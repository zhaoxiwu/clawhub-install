---
name: skill-install
description: 从 ClawHub 安装 skill。用户输入 ClawHub 上的 skill 主页 URL（如 https://clawhub.ai/evgyur/crypto-price），自动解析下载链接，下载 zip 包并解压到 ~/.openclaw/workspace/skills/ 目录。
metadata:
  {
    "openclaw":
      {
        "requires":
          { "bins": ["unzip"] },
        "install":
          [
            { "id": "npm", "kind": "node", "package": "puppeteer", "label": "Install puppeteer for page scraping" },
          ],
      },
  }
---

# ClawHub Install Skill

## 简介

从 ClawHub (clawhub.ai) 动态安装 skill。直接获取页面上的下载链接，下载 zip 包并解压。

## 工作流程

1. **解析 URL**：从 URL 中提取 owner 和 slug
2. **获取下载链接**：使用 puppeteer 访问 skill 页面，解析下载按钮的链接
3. **下载 zip 包**：直接下载 skill 的 zip 压缩包
4. **解压安装**：解压到 `~/.openclaw/workspace/skills/<slug>`

## 使用方式

用户输入 ClawHub skill 主页 URL，例如：

- `https://clawhub.ai/evgyur/crypto-price`
- `https://clawhub.ai/owner/skill-name`
- `owner/skill-name`

## 实现原理

1. 访问 `https://clawhub.ai/{owner}/{slug}` 页面
2. 使用 puppeteer 渲染页面
3. 查找包含 `/api/v1/download?slug=` 的链接
4. 下载 zip 包 (Content-Type: application/zip)
5. 解压到目标目录

## 示例

```
用户：帮我安装 https://clawhub.ai/evgyur/crypto-price

AI：[clawhub-install] 解析结果:
  - Owner: evgyur
  - Slug: crypto-price
  - 安装目录: /root/.openclaw/workspace/skills/crypto-price
[clawhub-install] 正在获取下载链接...
[clawhub-install] 下载链接: https://xxx.convex.site/api/v1/download?slug=crypto-price
[clawhub-install] 下载中...
[clawhub-install] 解压中...

✅ 安装成功!
   Skill 已安装到: /root/.openclaw/workspace/skills/crypto-price
```

## 依赖

- **unzip**：系统命令，用于解压 zip 包
- **puppeteer**：Node.js 包，用于渲染页面获取下载链接

## 注意事项

- skill 会安装到 `~/.openclaw/workspace/skills/<slug>`
- 如已存在同名 skill，会自动覆盖
- 首次运行需要安装 puppeteer（约 99MB）
