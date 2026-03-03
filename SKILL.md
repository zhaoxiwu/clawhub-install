---
name: clawhub-install
description: 从 ClawHub 安装 skill。用户输入 ClawHub 上的 skill 主页 URL（如 https://clawhub.ai/evgyur/crypto-price），自动解析并安装到 ~/.openclaw/workspace/skills/ 目录。
metadata:
  {
    "openclaw":
      {
        "requires":
          { "bins": ["clawhub"] },
        "install":
          [
            { "id": "npm", "kind": "node", "package": "clawhub", "bins": ["clawhub"], "label": "Install ClawHub CLI (npm)" },
          ],
      },
  }
---

# ClawHub Install Skill

## 简介

从 ClawHub (clawhub.ai) 动态安装 skill。用户只需提供 skill 主页 URL，系统自动完成解析、下载和安装。

## 使用方式

用户输入 ClawHub skill 主页 URL，例如：

- `https://clawhub.ai/evgyur/crypto-price`
- `https://clawhub.ai/owner/skill-name`
- `owner/skill-name` (直接格式)

## 工作流程

1. **解析 URL**：从 URL 中提取 owner 和 slug
2. **安装 Skill**：使用 `clawhub install <slug>` 命令安装
3. **自动重试**：遇到速率限制时自动等待重试
4. **报告结果**：告知用户安装状态

## 依赖

- **clawhub CLI**：需要全局安装
  ```bash
  npm i -g clawhub
  ```

## 示例

```
用户：帮我安装 https://clawhub.ai/evgyur/crypto-price

AI：[clawhub-install] 解析结果:
  - Owner: evgyur
  - Slug: crypto-price
  - 安装目录: /root/.openclaw/workspace/skills/crypto-price
[clawhub-install] Installing skill: crypto-price

✅ 安装成功!
   Skill 已安装到: /root/.openclaw/workspace/skills/crypto-price
```

## 注意事项

- skill 会安装到 `~/.openclaw/workspace/skills/<slug>`
- 如已存在同名 skill，会自动使用 --force 覆盖
- 遇到速率限制会自动等待重试
