skill-install

🤖 从 ClawHub 一键安装 OpenClaw Skill

功能简介

当你想安装 ClawHub 上的某个 Skill 时，只需要告诉 AI：
> "帮我安装 https://clawhub.ai/evgyur/crypto-price"

AI 就会自动完成：
1. 解析 URL 获取 skill 信息
2. 获取下载链接
3. 下载 zip 压缩包
4. 解压到你的 skills 目录

安装方式

方式一：Git Clone（推荐）

```bash
cd ~/.openclaw/workspace/skills/
git clone https://github.com/zhaoxiwu/skill-install.git
```

方式二：下载 Release

```bash
cd ~/.openclaw/workspace/skills/
wget https://github.com/zhaoxiwu/skill-install/archive/refs/tags/v1.0.zip
unzip v1.0.zip
mv skill-install-1.0 skill-install
```

使用方法

命令行

```bash
node index.js <clawhub-url>
```

示例：
```bash

安装指定 skill
node index.js "https://clawhub.ai/evgyur/crypto-price"

简写格式
node index.js "evgyur/crypto-price"
```

AI 对话中

只需告诉 AI：
"帮我安装 xxx"
"从 ClawHub 安装 skill"

AI 会自动调用这个 skill 完成安装。

工作原理

1. 解析 URL - 从 clawhub.ai/owner/slug 提取信息
2. 获取下载链接 - 用 Puppeteer 渲染页面，找到下载按钮
3. 下载 zip - 直接下载压缩包
4. 解压安装 - 解压到 `~/.openclaw/workspace/skills/<slug>`

环境要求

Node.js ≥ 18
unzip 命令（Linux: `apt install unzip`）
首次运行会自动安装 Puppeteer（约 99MB）

支持的输入格式

| 格式 | 示例 |
|------|------|
| 完整 URL | `https://clawhub.ai/evgyur/crypto-price` |
| 简写 | `evgyur/crypto-price` |
| 仅 slug | `crypto-price` |

常见问题

Q: 安装后在哪里？
A: `~/.openclaw/workspace/skills/<skill-name>/`

Q: 已存在的 skill 会被覆盖吗？
A: 会，自动删除旧版本

Q: Puppeteer 下载太慢？
A: 可以先手动 `npm install puppeteer` 或使用国内镜像

--

⭐ 如果觉得好用，欢迎 Star！
