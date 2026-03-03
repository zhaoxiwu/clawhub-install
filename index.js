#!/usr/bin/env node

/**
 * ClawHub Install Skill (Direct Download)
 * 
 * 从 ClawHub 页面找到下载链接，直接下载并解压
 * 用法: node index.js <clawhub-url>
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const WORKSPACE_DIR = process.env.OPENCLAW_WORKSPACE || 
  path.join(process.env.HOME || '/root', '.openclaw', 'workspace');
const SKILLS_DIR = path.join(WORKSPACE_DIR, 'skills');

/**
 * 解析 ClawHub URL，提取 owner 和 slug
 */
function parseClawHubUrl(input) {
  input = input.trim();
  
  // 检查是否是直接格式 owner/slug
  if (input.includes('/') && !input.includes('.')) {
    const parts = input.split('/');
    if (parts.length === 2) {
      return { owner: parts[0], slug: parts[1] };
    }
  }
  
  // 解析 URL: https://clawhub.ai/owner/slug
  const urlMatch = input.match(/clawhub\.ai\/([^\/]+)\/([^\/\s]+)/);
  if (urlMatch) {
    return { owner: urlMatch[1], slug: urlMatch[2] };
  }
  
  // 如果只是 slug
  return { owner: null, slug: input };
}

/**
 * 使用 puppeteer 获取下载链接
 */
async function getDownloadUrl(slug) {
  console.log(`[clawhub-install] 正在获取下载链接...`);
  
  // 动态加载 puppeteer
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    console.log(`[clawhub-install] 正在安装 puppeteer...`);
    execSync('npm install puppeteer', { 
      cwd: WORKSPACE_DIR,
      stdio: 'pipe' 
    });
    puppeteer = require('puppeteer');
  }
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.goto(`https://clawhub.ai/${slug}`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // 等待页面加载
    await new Promise(r => setTimeout(r, 3000));
    
    // 查找下载链接
    const downloadUrl = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const a of links) {
        if (a.href && a.href.includes('/api/v1/download') && a.href.includes('slug=')) {
          return a.href;
        }
      }
      return null;
    });
    
    return downloadUrl;
  } finally {
    await browser.close();
  }
}

/**
 * 下载文件
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`[clawhub-install] 重定向到: ${res.headers.location}`);
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed: ${res.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    
    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

/**
 * 解压 zip 文件
 */
function unzipFile(zipPath, destDir) {
  console.log(`[clawhub-install] 解压到: ${destDir}`);
  
  // 使用 unzipper 或 system unzip
  try {
    execSync(`unzip -o "${zipPath}" -d "${destDir}"`, { stdio: 'pipe' });
  } catch (e) {
    // 如果没有 unzip，尝试用 jar
    try {
      execSync(`jar xf "${zipPath}"`, { cwd: destDir, stdio: 'pipe' });
    } catch (e2) {
      throw new Error('解压失败，请安装 unzip: apt install unzip');
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('用法: node index.js <clawhub-url>');
    console.error('示例: node index.js "https://clawhub.ai/evgyur/crypto-price"');
    process.exit(1);
  }
  
  // 检查并创建 skills 目录
  if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  }
  
  // 解析 URL
  const input = args[0];
  const parsed = parseClawHubUrl(input);
  
  // 构建完整的 slug (owner/slug)
  const fullSlug = parsed.owner ? `${parsed.owner}/${parsed.slug}` : parsed.slug;
  
  console.log(`[clawhub-install] 解析结果:`);
  console.log(`  - Owner: ${parsed.owner || '(默认)'}`);
  console.log(`  - Slug: ${parsed.slug}`);
  console.log(`  - 安装目录: ${path.join(SKILLS_DIR, parsed.slug)}`);
  
  // 目标目录
  const skillDir = path.join(SKILLS_DIR, parsed.slug);
  
  // 如果已存在，先删除
  if (fs.existsSync(skillDir)) {
    console.log(`[clawhub-install] 删除旧目录...`);
    fs.rmSync(skillDir, { recursive: true, force: true });
  }
  fs.mkdirSync(skillDir, { recursive: true });
  
  // 获取下载链接
  let downloadUrl;
  try {
    downloadUrl = await getDownloadUrl(fullSlug);
  } catch (e) {
    console.error(`[clawhub-install] 获取下载链接失败: ${e.message}`);
    // 尝试备用方法：使用已知格式的 URL
    console.log(`[clawhub-install] 尝试备用下载方式...`);
    downloadUrl = `https://wry-manatee-359.convex.site/api/v1/download?slug=${parsed.slug}`;
  }
  
  if (!downloadUrl) {
    console.error(`[clawhub-install] 无法找到下载链接`);
    process.exit(1);
  }
  
  console.log(`[clawhub-install] 下载链接: ${downloadUrl}`);
  
  // 下载 zip 包
  const zipPath = path.join(skillDir, 'skill.zip');
  console.log(`[clawhub-install] 下载中...`);
  
  try {
    await downloadFile(downloadUrl, zipPath);
    console.log(`[clawhub-install] 下载完成: ${zipPath}`);
  } catch (e) {
    console.error(`[clawhub-install] 下载失败: ${e.message}`);
    process.exit(1);
  }
  
  // 解压
  console.log(`[clawhub-install] 解压中...`);
  try {
    // zip 包里面可能有一个根目录，需要处理
    const tempDir = path.join(skillDir, 'temp');
    fs.mkdirSync(tempDir, { recursive: true });
    execSync(`unzip -o "${zipPath}" -d "${tempDir}"`, { stdio: 'pipe' });
    
    // 检查解压后的内容
    const tempContents = fs.readdirSync(tempDir);
    console.log(`[clawhub-install] 解压后内容: ${tempContents.join(', ')}`);
    
    // 如果只有一个目录，移动其内容到 skillDir
    if (tempContents.length === 1) {
      const innerDir = path.join(tempDir, tempContents[0]);
      if (fs.statSync(innerDir).isDirectory()) {
        // 移动内容
        const innerContents = fs.readdirSync(innerDir);
        for (const item of innerContents) {
          fs.renameSync(path.join(innerDir, item), path.join(skillDir, item));
        }
      }
    } else {
      // 多个文件，直接移动
      for (const item of tempContents) {
        fs.renameSync(path.join(tempDir, item), path.join(skillDir, item));
      }
    }
    
    // 清理临时文件和 zip
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.unlinkSync(zipPath);
    
  } catch (e) {
    console.error(`[clawhub-install] 解压失败: ${e.message}`);
    process.exit(1);
  }
  
  console.log(`\n✅ 安装成功!`);
  console.log(`   Skill 已安装到: ${skillDir}`);
  console.log(`   文件列表: ${fs.readdirSync(skillDir).join(', ')}`);
}

main();
