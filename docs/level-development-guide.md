# 麦斯镇 MathTown 关卡开发规约

> 本文档面向关卡开发者，规范关卡包和单关卡的开发流程、文件结构、脚本格式，以及开发完成后的检查清单。所有经验均来自实际开发过程中的踩坑总结，请严格遵守。

---

## 目录

1. [概述](#1-概述)
2. [关卡包结构](#2-关卡包结构)
3. [单关卡目录结构](#3-单关卡目录结构)
4. [剧情脚本 story.json 规约](#4-剧情脚本-storyjson-规约)
5. [解题场景开发规约](#5-解题场景开发规约)
6. [素材规约](#6-素材规约)
7. [开发流程](#7-开发流程)
8. [开发完成检查清单 ✅](#8-开发完成检查清单-)
9. [常见问题与解决方案](#9-常见问题与解决方案)
10. [部署注意事项](#10-部署注意事项)

---

## 1. 概述

麦斯镇采用 **视觉小说 + 互动解题** 的游戏模式。每一关是一个完整的故事，通过 NPC 对话推动剧情，在关键节点插入互动解题环节。

核心设计原则：
- **剧情驱动**：先有好故事，再有题目。题目是故事的一部分，不是孤立的练习题。
- **不剧透**：解题前的对话绝不透露解法和答案，解法放在「提示」功能里。
- **知识融入**：数学家故事、公式、历史背景自然融入对话，解题通过后自动记录到手札。
- **至少 2 个 NPC**：玩家没有对话，故事通过 NPC 之间的对话和旁白讲述。
- **至少 3 个解题环节**：每关不少于 3 道互动题。

---

## 2. 关卡包结构

关卡包是一组相关关卡的集合，放在 `levels_packs/` 目录下。

```
levels_packs/
└── pack_primary_math/          # 关卡包目录（命名：pack_<主题>）
    ├── pack_meta.json           # 关卡包元数据（必填）
    ├── L001_gauss_grocery/     # 第一关
    ├── L002_zu_clocktower/     # 第二关
    └── ...
```

### pack_meta.json 格式

```json
{
  "pack_id": "com.mathtown.primary_math",
  "pack_name": "麦斯镇·小学数学谜题集",
  "version": "1.0.0",
  "author": "MathTown Team",
  "description": "关卡包描述",
  "api_version_required": 2,
  "levels": [
    { "level_id": "gauss_grocery", "folder": "L001_gauss_grocery" },
    { "level_id": "zu_clocktower", "folder": "L002_zu_clocktower" }
  ]
}
```

**注意**：新增关卡后，必须在 `pack_meta.json` 的 `levels` 数组中注册，否则游戏不会加载该关卡。

---

## 3. 单关卡目录结构

```
L001_gauss_grocery/
├── meta.json              # 关卡元数据（必填）
├── story.json             # 剧情脚本（必填）
├── scenes/                # 解题场景 HTML
│   ├── scene_ledger.html
│   └── scene_shelf.html
└── assets/                # 关卡专属素材
    ├── images/            # 场景背景图、缩略图
    ├── characters/        # 人物立绘
    ├── badges/            # 徽章图片
    └── audio/             # 关卡 BGM
```

### meta.json 格式

```json
{
  "level_id": "gauss_grocery",
  "level_name": "暖阳杂货铺的速算密码",
  "description": "关卡简短描述",
  "mathematician": "高斯",
  "difficulty": 1,
  "estimated_time": 10,
  "thumbnail": "assets/images/thumbnail.png",
  "default_background": "assets/images/bg_shop_front.png",
  "default_bgm": "assets/audio/bgm_shop.mp3",
  "unlock_condition": {
    "type": "complete_level",
    "level": "com.mathtown.primary_math:gauss_grocery"
  },
  "badge": {
    "name": "速算徽章",
    "image": "assets/badges/badge_speed.png",
    "description": "徽章描述"
  }
}
```

**解锁条件说明**：
- 第一关通常不需要解锁条件（或 `unlock_condition` 设为 `null`）
- 后续关卡设置 `type: "complete_level"`，指定需要先通关的关卡 compositeId
- compositeId 格式：`<pack_id>:<level_id>`

---

## 4. 剧情脚本 story.json 规约

### 4.1 整体结构

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
    { "type": "dialog", "speaker": "gauss", "text": "你好。" },
    { "type": "win" }
  ]
}
```

**字段兼容**：`nodes` 和 `script` 两种字段名都支持；人物字段 `character`/`charId`、`expression`/`portrait`、`speaker`/`charId`、`id`/`puzzleId` 均兼容。

### 4.2 节点类型详解

| 类型 | 说明 | 关键字段 |
|------|------|----------|
| `bg` | 切换场景背景 | `src` — 背景图路径（相对关卡目录） |
| `bgm` | 切换背景音乐 | `src` — 音频路径（相对关卡目录） |
| `show` | 显示人物立绘 | `character` — 人物ID；`position` — `left`/`right`；`expression` — 表情 key |
| `hide` | 隐藏人物立绘 | `character` — 人物ID |
| `dialog` | 人物对话 | `speaker` — 人物ID；`text` — 对话内容；`portrait` — （可选）切换表情 |
| `narration` | 旁白 | `text` — 旁白内容（斜体居中显示） |
| `handbook` | 自动记录手札 | `title` — 笔记标题；`content` — 笔记内容 |
| `puzzle` | 互动解题环节 | `id` — 题目ID；`scene` — 场景HTML文件名；`hint` — 提示文字 |
| `win` | 通关 | — |

### 4.3 路径规约 ⚠️

**所有素材路径都是相对于关卡目录的相对路径**，不要写绝对路径，不要写 `levels_packs/...` 前缀。

正确示例：
```json
{ "type": "bg", "src": "assets/images/bg_shop.png" }
{ "type": "bgm", "src": "assets/audio/bgm_shop.mp3" }
```

错误示例：
```json
{ "type": "bg", "src": "/assets/images/bg_shop.png" }           // ❌ 绝对路径
{ "type": "bg", "src": "levels_packs/.../bg_shop.png" }        // ❌ 含关卡包前缀
```

引擎会自动将相对路径拼接为完整路径。如果路径写错，背景图和音乐会静默失败（不报错，但显示空白/不播放）。

### 4.4 对话内容规约

- **不剧透原则**：解题前的对话绝不透露解法和答案。可以描述题目条件，但不能说"用XX公式"或直接算出结果。
- **解法放提示**：每道题的 `puzzle` 节点必须写 `hint` 字段，提示只给思路不给答案。
- **文字长度**：单条对话控制在 50-80 字以内，避免对话框出现滚动条。过长的内容拆成多条 `dialog`。
- **英文引号**：JSON 字符串内禁止使用英文双引号 `"`，必须用中文引号「」或转义 `\"`。否则 JSON 解析失败，关卡无法加载。
- **旁白用法**：场景转换、心理描写、环境描写用 `narration`；人物说话用 `dialog`。

### 4.5 人物立绘规约

- 每关至少 2 个 NPC 人物。
- 每个人物至少 1 种表情（`normal`），建议 2 种（如 `normal`/`happy` 或 `normal`/`surprised`）。
- `show` 节点指定 `position: left` 或 `right`，决定立绘出现在左下角还是右下角。
- 场景切换时如果人物还在，不需要重复 `show`；如果人物离开，用 `hide`。
- 通关前建议 `hide` 所有人物，再显示通关场景。

### 4.6 手札记录规约

- 每关至少 2 条手札记录，放在解题通过后的对话中。
- 手札内容要详细，包含公式、原理、数学史背景，不只是一句话。
- 手札 `title` 是去重依据：同一关卡内相同标题的笔记只记录一次（重复玩不会重复添加）。
- 手札是全局的：玩家在关卡外（开始画面）也能查看所有关卡的手札。

---

## 5. 解题场景开发规约

### 5.1 场景文件

每个解题环节是一个独立的 HTML 文件，放在 `scenes/` 目录下，通过 iframe 加载。

### 5.2 通信协议

解题场景通过 `postMessage` 与主框架通信，解题完成时发送：

```javascript
parent.postMessage({
  protocol: 'mathtown-puzzle',
  action: 'complete',
  puzzleId: 'ledger'   // 必须与 story.json 中 puzzle.id 完全一致
}, '*');
```

**注意**：`puzzleId` 必须与 `story.json` 中对应 `puzzle` 节点的 `id` 完全一致，否则主框架收不到完成信号，剧情会卡住。

### 5.3 场景样式规约

- 背景用深色渐变（如 `#2a2a3e`），内容卡片用泛黄羊皮纸色（`#f5e6c8`），与游戏整体风格一致。
- 题目用纯文字描述，不要用复杂的可视化图形（容易溢出或变形）。
- 输入框用 `type="number"`，支持回车提交。
- 答案验证用 `Math.abs(val - CORRECT) < 0.01` 处理浮点数精度。
- 答对后显示成功提示，延迟 800ms 再发送 `complete` 消息，让玩家看到反馈。
- 答错后显示有引导性的错误提示（不是简单的"错误"，而是提示思考方向）。

### 5.4 题目设计规约

- **逻辑自洽**：题目描述中的数字必须经得起推敲。例如"周一到周日"是 7 天，不能出现第 20 件。
- **难度递进**：同一关内的题目由易到难。
- **答案唯一**：确保正确答案唯一，避免歧义。
- **不依赖剧情外信息**：题目所需的所有条件都要在题目描述中给出。

---

## 6. 素材规约

### 6.1 文件位置 ⚠️

**所有关卡素材必须放在关卡目录下的 `assets/` 中**，不能只放在全局 `assets/` 目录。

全局 `assets/` 只放主界面共用的素材（开始界面背景、主菜单背景、主界面BGM、默认缩略图）。

### 6.2 图片

- 场景背景图：建议 1280×720 或 1920×1080，JPG/PNG 均可。
- 人物立绘：建议竖向比例（约 2:3），PNG 格式，背景可以不透明（引擎用 `object-fit: contain` 适配）。
- 徽章：建议 256×256 以上，PNG 格式。
- 缩略图：建议 440×240，用于关卡列表卡片。

### 6.3 音频 ⚠️

- **格式**：MP3（兼容性最好）。
- **比特率**：64kbps 足够，文件小。
- **大小控制**：单首 BGM 控制在 500KB 以内。WAV 格式太大（10MB+），必须转 MP3 压缩。
- 压缩命令：`ffmpeg -i input.wav -b:a 64k output.mp3`

### 6.4 总大小控制

飞书应用部署有硬性限制：打包后 tar.gz ≤ 20MB。开发时注意：
- 删除不需要的旧文件（旧场景、旧徽章、旧素材、`node_modules`）。
- BGM 用 MP3 不用 WAV。
- 图片可以适当压缩。

---

## 7. 开发流程

### 第一步：设计
1. 确定关卡主题和数学家。
2. 构思故事大纲（开头、冲突、解题节点、结局）。
3. 设计 3+ 道题目，确定答案。
4. 规划人物（至少 2 个 NPC）和场景（至少 2-3 个背景）。

### 第二步：准备素材
1. 生成场景背景图。
2. 生成人物立绘（每人至少 1 种表情）。
3. 生成徽章。
4. 生成/合成 BGM。
5. 所有素材放入关卡 `assets/` 对应子目录。

### 第三步：编写剧情脚本
1. 创建 `meta.json`。
2. 编写 `story.json`，按故事顺序排列节点。
3. 每个 `puzzle` 节点写好 `hint`。
4. 解题通过后插入 `handbook` 节点记录知识。

### 第四步：编写解题场景
1. 为每道题创建 `scenes/scene_xxx.html`。
2. 实现题目展示、输入、验证、postMessage 通信。

### 第五步：注册关卡
在 `pack_meta.json` 的 `levels` 数组中添加新关卡。

### 第六步：本地测试
用 `python3 -m http.server 8080` 启动本地服务器，完整玩一遍，按检查清单逐项验证。

### 第七步：提交部署
测试通过后，`git add` / `git commit` / `git push`，GitHub Pages 自动构建。

---

## 8. 开发完成检查清单 ✅

> 以下每一项都必须手动验证，任何一项不通过都不能上线。

### 8.1 基础加载
- [ ] 关卡能正常进入，不卡在 loading 界面
- [ ] 控制台无 JS 报错
- [ ] JSON 无语法错误（可用 `python3 -c "import json; json.load(open('story.json'))"` 验证）

### 8.2 场景与背景
- [ ] 第一个场景背景图正常显示（不是空白）
- [ ] 每次 `bg` 切换后背景图正常更新
- [ ] 背景图路径正确（相对关卡目录，不含 `levels_packs/` 前缀）

### 8.3 人物立绘
- [ ] 人物立绘正常显示，不是破损图标
- [ ] 立绘位置正确（left 在左下，right 在右下）
- [ ] 切换表情时立绘更新
- [ ] `hide` 后立绘完全消失（包括边框，不留空框）
- [ ] 立绘有圆角边框

### 8.4 对话与剧情
- [ ] 对话框文字不溢出、不出现滚动条
- [ ] 点击对话框/场景能推进对话
- [ ] 对话框右下角有 ▼ 箭头动效
- [ ] 旁白样式正确（斜体居中，无说话人标签）
- [ ] 解题前的对话**不透露解法和答案**（逐句检查）

### 8.5 背景音乐
- [ ] 进入关卡后 BGM 正常播放
- [ ] `bgm` 节点切换音乐正常
- [ ] BGM 文件在关卡 `assets/audio/` 目录下（不是只在全局 assets）

### 8.6 解题环节
- [ ] 进入解题环节时对话框和箭头隐藏
- [ ] 题目文字完整显示，不溢出
- [ ] 输入框可输入，回车可提交
- [ ] 答对后显示成功反馈，然后自动继续剧情
- [ ] 答错后显示有引导性的错误提示
- [ ] 题目描述逻辑自洽（数字、条件无矛盾）
- [ ] `puzzleId` 与 story.json 中的 `id` 一致

### 8.7 提示功能
- [ ] 解题中点击「提示」显示**当前这道题**的提示（不是上一关的）
- [ ] 提示内容只给思路，不给直接答案
- [ ] 非解题时点击「提示」弹出"当前没有任何提示"

### 8.8 手札
- [ ] 解题通过后手札自动记录（有提示弹窗）
- [ ] 手札内容完整（公式、原理、背景）
- [ ] 重复玩同一关不重复添加相同标题的笔记
- [ ] 手札弹窗能打开、能搜索、能翻页
- [ ] 开始画面的「手札」按钮能打开，能看到所有关卡的笔记

### 8.9 通关与结算
- [ ] 最后一道题通过后自动进入结算界面（不需要额外点击）
- [ ] 通关后计时器停止（不再累加）
- [ ] 结算界面显示通关时间
- [ ] 结算界面徽章图片正常显示
- [ ] 返回关卡列表后，该关显示"已通关"和最佳时间
- [ ] 下一关解锁（如果有解锁条件）

### 8.10 其他功能
- [ ] 草稿功能能打开、能涂鸦、关闭后重开内容保留
- [ ] 退出关卡后草稿内容清空
- [ ] 菜单按钮能打开，重新开始/返回列表功能正常
- [ ] 设置面板音量调节有效

### 8.11 部署前
- [ ] 删除 `node_modules`、旧场景、旧素材等不需要的文件
- [ ] 总目录大小 < 20MB（飞书应用限制）
- [ ] BGM 都是 MP3 格式，不是 WAV
- [ ] `index.html` 中脚本版本号已递增（避免 CDN 缓存）
- [ ] `pack_meta.json` 已注册新关卡

---

## 9. 常见问题与解决方案

### Q1: 场景背景一片空白

**原因**：`story.json` 中 `bg` 的路径写错，或图片文件不在关卡目录下。

**排查**：
1. 检查路径是否为相对路径（`assets/images/xxx.png`），不是绝对路径。
2. 检查文件是否真实存在于关卡 `assets/images/` 目录。
3. 打开浏览器控制台，看是否有 404 错误。

### Q2: 人物立绘不显示或显示破损图标

**原因**：`characters` 中 `portraits` 的路径写错，或文件不存在。

**排查**：同 Q1，检查路径和文件存在性。

### Q3: BGM 不播放

**原因**：路径错误、文件不存在、或浏览器自动播放策略限制（需用户交互后才能播放）。

**排查**：
1. 检查路径和文件。
2. 游戏设计中第一次 BGM 播放在用户点击"进入关卡"之后，通常不会触发自动播放限制。
3. 检查音频格式是否为 MP3。

### Q4: 关卡加载失败，报 JSON 解析错误

**原因**：`story.json` 中字符串内使用了英文双引号 `"`，或缺少逗号/括号。

**解决**：
1. 用 `python3 -c "import json; json.load(open('story.json'))"` 定位错误行。
2. 字符串内的引号改用中文「」或转义 `\"`。

### Q5: 解题后剧情不继续

**原因**：解题场景发送的 `puzzleId` 与 `story.json` 中 `puzzle.id` 不一致。

**解决**：检查两边的 ID 完全一致（区分大小写）。

### Q6: 提示显示的是上一关的内容

**原因**：`puzzle` 节点没有写 `hint` 字段，或 `_useHint` 没有读取当前 puzzle 节点。

**解决**：每个 `puzzle` 节点都必须写 `hint` 字段。

### Q7: 通关后不自动进入结算

**原因**：`story.json` 最后没有 `win` 节点，或 `win` 节点前有未完成的 `puzzle`。

**解决**：确保剧情最后一个节点是 `{ "type": "win" }`。

### Q8: 飞书部署后看到的还是旧版本

**原因**：CDN 缓存，或发布到了旧的 app_id。

**解决**：
1. `index.html` 中脚本和 CSS 的版本号 `?v=x.x.x` 递增。
2. 如果旧应用持续发布失败，创建新应用发布。

### Q9: 手札点不开

**原因**：JS 报错（通常是 `save.handbook_notes` 为 undefined 时未做空值处理）。

**解决**：代码中已加 try-catch 和空值安全处理。如果仍有问题，检查控制台报错。

### Q10: 人物立绘消失后边框还在

**原因**：旧实现用 `div + backgroundImage`，隐藏时只设了 `opacity:0` 但没移除元素。

**解决**：当前实现用 `<img>` 标签，`hide` 时 `removeChild` 整个元素。如果自定义修改，确保移除整个 DOM 元素。

---

## 10. 部署注意事项

### GitHub Pages
- 推送 `main` 分支后自动构建，通常 1-2 分钟生效。
- 访问地址：`https://<用户名>.github.io/<仓库名>/`
- 因使用 `fetch` 加载 JSON，GitHub Pages 完全支持（同域）。

### 飞书应用
- 用 `lark-cli apps +html-publish --app-id <app_id> --path .` 发布。
- 硬性大小限制：单 HTML ≤ 10MB，打包 tar.gz ≤ 20MB，未压缩 ≤ 200MB。
- 发布前删除 `node_modules` 等不需要的文件。
- 如果旧应用持续发布失败（构建日志全绿但状态 failed），创建新应用。

### 版本号
- 每次修改 JS/CSS 后，`index.html` 中引用的 `?v=x.x.x` 要递增，避免浏览器缓存旧版本。
- 示例：`<script src="js/main.js?v=2.2.1"></script>`

---

## 附录：关卡模板速查

### story.json 最小模板

```json
{
  "characters": {
    "char_a": {
      "name": "角色A",
      "color": "#3a6a8a",
      "portraits": { "normal": "assets/characters/a_normal.png" }
    },
    "char_b": {
      "name": "角色B",
      "color": "#8b6914",
      "portraits": { "normal": "assets/characters/b_normal.png" }
    }
  },
  "nodes": [
    { "type": "bg", "src": "assets/images/bg_scene1.png" },
    { "type": "bgm", "src": "assets/audio/bgm_level.mp3" },
    { "type": "narration", "text": "故事开场描述。" },
    { "type": "show", "character": "char_a", "position": "left", "expression": "normal" },
    { "type": "dialog", "speaker": "char_a", "text": "对话内容。" },
    { "type": "show", "character": "char_b", "position": "right", "expression": "normal" },
    { "type": "dialog", "speaker": "char_b", "text": "引出题目。" },
    { "type": "puzzle", "id": "puzzle1", "scene": "scene_puzzle1", "hint": "提示思路。" },
    { "type": "handbook", "title": "知识标题", "content": "详细知识内容。" },
    { "type": "dialog", "speaker": "char_a", "text": "解题后的对话。" },
    { "type": "hide", "character": "char_a" },
    { "type": "hide", "character": "char_b" },
    { "type": "bg", "src": "assets/images/bg_ending.png" },
    { "type": "narration", "text": "结局描述。" },
    { "type": "win" }
  ]
}
```

### 解题场景 HTML 最小模板

```html
<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body { font-family: Georgia, serif; background: linear-gradient(135deg,#2a2a3e,#3a3a52);
    min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
  .card { background:#f5e6c8; border:3px solid #c9a96e; border-radius:10px; padding:36px 40px; max-width:560px; width:100%; }
  .title { text-align:center; font-size:22px; color:#6b4e1e; margin-bottom:24px; }
  .problem { background:rgba(201,169,110,.12); border-left:4px solid #c9a96e; padding:16px 20px; margin-bottom:24px; line-height:1.8; color:#4a3a1a; }
  input { padding:10px 14px; font-size:18px; border:2px solid #c9a96e; border-radius:6px; text-align:center; }
  button { width:100%; padding:12px; font-size:16px; background:linear-gradient(135deg,#8b6914,#a67c00);
    color:#fdf6e3; border:none; border-radius:6px; cursor:pointer; margin-top:16px; }
</style></head><body>
  <div class="card">
    <div class="title">题目标题</div>
    <div class="problem">题目描述。</div>
    <input type="number" id="answer" placeholder="输入答案">
    <button id="submit">提交答案</button>
  </div>
<script>
  const CORRECT = 42;
  document.getElementById('submit').onclick = () => {
    const val = parseFloat(document.getElementById('answer').value);
    if (Math.abs(val - CORRECT) < 0.01) {
      setTimeout(() => parent.postMessage({protocol:'mathtown-puzzle',action:'complete',puzzleId:'puzzle1'},'*'), 800);
    }
  };
</script>
</body></html>
```

---

*本文档随项目迭代持续更新。如有新的踩坑经验，请补充到对应章节。*
