# 麦斯镇 MathTown

> 一款融合知识学习与视觉小说叙事的网页解谜游戏。每一关都是一个完整的故事，在剧情推进中穿插互动解题环节，让学习变成一场冒险。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tech](https://img.shields.io/badge/tech-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-orange.svg)
![Levels](https://img.shields.io/badge/levels-2-green.svg)

## ✨ 特色

- **视觉小说叙事**：每关都是一个完整故事，NPC 对话推动剧情，人物立绘 + 对话框 + 背景音乐，沉浸式体验
- **互动解题环节**：剧情中穿插解谜题目，玩家亲手计算、作答，通关后继续故事
- **数学家故事融入**：每关围绕一位数学家或一个知识主题展开，剧情中自然融入数学史、公式、科学成就
- **手札知识系统**：剧情中的知识要点自动记录到手札，支持搜索、翻页，关卡内外均可查看
- **徽章收集**：每关通关获得专属徽章，徽章陈列室展示收集进度
- **草稿功能**：内置泛黄稿纸画布，解题时随手涂鸦计算
- **关卡包可扩展**：新增关卡只需添加一个文件夹 + 剧情脚本 + 解题场景，无需修改主程序
- **纯前端无后端**：原生 HTML/CSS/JS，IndexedDB 本地存档，可部署到任意静态托管

## 🎮 已上线关卡

| 关卡 | 主题 | 数学家 | 解题环节 |
|------|------|--------|----------|
| 暖阳杂货铺的速算密码 | 等差数列求和 | 高斯 | 账本求和、货架数列 |
| 钟楼的齿轮密语 | 齿轮传动 / 钟面角度 / 圆周率 | 祖冲之 | 齿轮传动比、钟面角度、铜环周长 |

## 🛠 技术栈

- **原生 HTML5 + CSS3 + Vanilla JavaScript (ES6+)** — 无框架、无构建步骤
- **自研 StoryEngine** — JSON 结构化剧情脚本驱动的视觉小说引擎
- **IndexedDB** — 本地存档（通关记录、最佳时间、手札笔记、设置）
- **iframe + postMessage** — 解题场景独立运行，与主框架安全通信
- **Web Audio API** — 背景音乐 + 音效合成
- **Canvas 2D** — 草稿涂鸦功能

## 📁 项目结构

```
mathtown-web/
├── index.html                  # 游戏主入口（全部界面 DOM）
├── css/
│   └── main.css                # 全局样式（蒸汽朋克羊皮纸风格）
├── js/
│   ├── main.js                 # 游戏控制器 / 预加载 / 关卡流程
│   ├── system/
│   │   ├── story_engine.js     # 视觉小说剧情引擎（节点执行/对话/解题）
│   │   ├── session.js          # 关卡会话（计时器/手札记录）
│   │   ├── storage.js          # IndexedDB 存档系统
│   │   ├── pack_loader.js      # 关卡包加载器
│   │   ├── audio.js            # 音频管理（BGM/SFX）
│   │   └── settler.js          # 通关结算
│   └── ui/
│       └── ui_manager.js       # UI 管理器（全部界面/对话框/手札/草稿）
├── assets/                     # 全局素材（主界面背景/音乐/默认缩略图）
├── levels_packs/               # 关卡包根目录
│   └── pack_primary_math/      # 小学数学谜题集
│       ├── pack_meta.json      # 关卡包元数据
│       ├── L001_gauss_grocery/ # 第一关
│       │   ├── meta.json       # 关卡元数据
│       │   ├── story.json      # 剧情脚本（对话/背景/人物/解题/手札）
│       │   ├── scenes/         # 解题场景 HTML
│       │   └── assets/         # 关卡专属素材（背景/立绘/徽章/音乐）
│       └── L002_zu_clocktower/ # 第二关
│           └── ...
└── schemas/                    # JSON Schema（可选校验）
```

## 🚀 本地运行

因使用 `fetch` 和 `iframe`，需要通过 HTTP 服务器运行：

```bash
cd mathtown-web
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 📖 剧情脚本格式（story.json）

每关的剧情由 `story.json` 驱动，节点类型包括：

| 节点类型 | 说明 | 关键字段 |
|----------|------|----------|
| `bg` | 切换场景背景 | `src` |
| `bgm` | 切换背景音乐 | `src` |
| `show` | 显示人物立绘 | `character`, `position`, `expression` |
| `hide` | 隐藏人物立绘 | `character` |
| `dialog` | 人物对话 | `speaker`, `text`, `portrait`(可选) |
| `narration` | 旁白 | `text` |
| `handbook` | 自动记录手札 | `title`, `content` |
| `puzzle` | 互动解题环节 | `id`, `scene`, `hint` |
| `win` | 通关 | — |

示例：

```json
{
  "characters": {
    "gauss": {
      "name": "小高斯",
      "color": "#3a6a8a",
      "portraits": {
        "normal": "assets/characters/gauss_normal.png",
        "happy": "assets/characters/gauss_happy.png"
      }
    }
  },
  "nodes": [
    { "type": "bg", "src": "assets/images/bg_shop.png" },
    { "type": "show", "character": "gauss", "position": "left", "expression": "normal" },
    { "type": "dialog", "speaker": "gauss", "text": "让我试试吧。" },
    { "type": "puzzle", "id": "ledger", "scene": "scene_ledger", "hint": "试试首尾配对法。" },
    { "type": "handbook", "title": "等差数列求和", "content": "总和 =（首项+末项）×项数÷2" },
    { "type": "win" }
  ]
}
```

## 🧩 解题场景通信协议

解题场景是独立的 HTML，通过 `postMessage` 与主框架通信：

```javascript
// 解题完成时通知主框架
parent.postMessage({
  protocol: 'mathtown-puzzle',
  action: 'complete',
  puzzleId: 'ledger'   // 与 story.json 中 puzzle.id 对应
}, '*');
```

## ➕ 制作新关卡

1. 在 `levels_packs/<pack>/` 下创建关卡文件夹（如 `L003_new_level/`）
2. 创建 `meta.json`（关卡名、描述、徽章、解锁条件）
3. 编写 `story.json`（剧情脚本，参考上方格式）
4. 创建 `scenes/` 目录，编写解题 HTML（参考现有场景）
5. 准备 `assets/`（背景图、人物立绘、徽章、BGM）
6. 在 `pack_meta.json` 的 `levels` 数组中注册新关卡

## 🌐 部署

纯静态文件，可部署到任意静态托管服务：

- **GitHub Pages**：推送后在仓库 Settings → Pages 选择主分支
- **Vercel / Netlify**：直接导入仓库，零配置部署
- **飞书应用**：使用 `lark-cli apps +html-publish` 发布为飞书应用
- **任意 Nginx / Apache**：将目录放入网站根目录

## 📖 开发文档

- [关卡开发规约](docs/level-development-guide.md) — 关卡包结构、剧情脚本格式、解题场景开发、素材规范、开发流程、完成检查清单、常见问题排查

## 📄 开源协议

MIT License — 可自由使用、修改、分发。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！无论是新关卡、bug 修复还是功能改进。

---

*麦斯镇 — 让每一个知识都有一个故事。*
