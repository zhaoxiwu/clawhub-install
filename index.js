#!/usr/bin/env node

/**
 * ClawHub Install Skill
 * 
 * 从 ClawHub URL 安装 skill
 * 用法: node index.js <clawhub-url> [--force]
 */

const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const WORKSPACE_DIR = process.env.OPENCLAW_WORKSPACE || 
  path.join(process.env.HOME || '/root', '.openclaw', 'workspace');
const SKILLS_DIR = path.join(WORKSPACE_DIR, 'skills');

/**
 * 解析 ClawHub URL，提取 owner 和 slug
 * 支持格式:
 * - https://clawhub.ai/evgyur/crypto-price
 * - https://clawhub.ai/owner/slug
 * - owner/slug (直接格式)
 */
function parseClawHubUrl(input) {
  // 去除首尾空白
  input = input.trim();
  
  // 检查是否是直接格式 owner/slug
  if (input.includes('/') && !input.includes('.')) {
    const parts = input.split('/');
    if (parts.length === 2) {
      return { owner: parts[0], slug: parts[1] };
    }
  }
  
  // 解析 URL
  const urlMatch = input.match(/clawhub\.ai\/([^\/]+)\/([^\/\s]+)/);
  if (urlMatch) {
    return { owner: urlMatch[1], slug: urlMatch[2] };
  }
  
  // 如果只是 slug
  return { owner: null, slug: input };
}

/**
 * 安装 skill
 */
function installSkill(slug, options = {}) {
  const skillDir = path.join(SKILLS_DIR, slug);
  const isInstalled = fs.existsSync(skillDir) && fs.existsSync(path.join(skillDir, 'SKILL.md'));
  
  console.log(`[clawhub-install] Installing skill: ${slug}`);
  
  const args = ['install', slug, '--workdir', WORKSPACE_DIR, '--dir', 'skills'];
  
  // 如果已安装，自动使用 --force
  if (options.force) {
    args.push('--force');
  }

  if (isInstalled) {
    console.log(`[clawhub-install] Skill already exists, using --force to reinstall`);
  }

  try {
    const result = execSync(`clawhub ${args.join(' ')}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large downloads
    });
    console.log(`[clawhub-install] ${result}`);
    return { success: true, message: result, installedPath: skillDir };
  } catch (error) {
    // 检查是否是 rate limit
    if (error.message.includes('Rate limit')) {
      console.log(`[clawhub-install] 触发速率限制，等待 10 秒后重试...`);
      sleep(10000);
      return installSkill(slug, { ...options, force: true });
    }
    console.error(`[clawhub-install] Error: ${error.message}`);
    return { success: false, message: error.message };
  }
}

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('用法: node index.js <clawhub-url> [--force]');
    console.error('示例: node index.js "https://clawhub.ai/evgyur/crypto-price"');
    process.exit(1);
  }
  
  // 检查 clawhub 是否安装
  try {
    execSync('which clawhub', { stdio: 'ignore' });
  } catch {
    console.error('错误: clawhub CLI 未安装');
    console.error('请运行: npm i -g clawhub');
    process.exit(1);
  }
  
  // 检查并创建 skills 目录
  if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  }
  
  // 解析 URL
  const input = args[0];
  const force = args.includes('--force');
  const parsed = parseClawHubUrl(input);
  
  console.log(`[clawhub-install] 解析结果:`);
  console.log(`  - Owner: ${parsed.owner || '(默认)'}`);
  console.log(`  - Slug: ${parsed.slug}`);
  console.log(`  - 安装目录: ${path.join(SKILLS_DIR, parsed.slug)}`);
  
  // 安装
  const result = installSkill(parsed.slug, { force });
  
  if (result.success) {
    console.log(`\n✅ 安装成功!`);
    console.log(`   Skill 已安装到: ${path.join(SKILLS_DIR, parsed.slug)}`);
  } else {
    console.log(`\n❌ 安装失败: ${result.message}`);
    process.exit(1);
  }
}

main();
