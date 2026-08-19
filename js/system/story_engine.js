/**
 * StoryEngine - 视觉小说剧情引擎
 * 解析并线性执行 story.json 脚本
 * 支持节点类型：bg, bgm, show, hide, dialog, narration, handbook, puzzle, win
 */
class StoryEngine {
  constructor(game) {
    this.game = game;
    this.script = [];
    this.characters = {};
    this.currentIndex = 0;
    this.paused = false;
    this.waitingForInput = false;
    this.waitingForPuzzle = false;
    this.currentPuzzleId = null;
    this.visibleCharacters = {};
    this._resolveInput = null;
  }
  load(storyData) {
    this.script = storyData.script || storyData.nodes || [];
    this.characters = storyData.characters || {};
    this.currentIndex = 0;
    this.visibleCharacters = {};
  }
  /** 将相对路径解析为相对于关卡目录的完整路径 */
  _resolvePath(src) {
    if (!src) return src;
    // 绝对URL、网站根路径、已包含关卡目录的路径直接返回
    if (src.startsWith('http') || src.startsWith('/') || src.startsWith('levels_packs/')) {
      return src;
    }
    const levelPath = this.game.session ? this.game.session.levelPath : '';
    return levelPath ? (levelPath + '/' + src) : src;
  }
  /** 收集所有需要预加载的资源 URL */
  collectAssets(storyData) {
    const assets = new Set();
    const chars = storyData.characters || {};
    const levelPath = this.game.session ? this.game.session.levelPath : '';
    const resolve = (src) => {
      if (!src) return src;
      if (src.startsWith('http') || src.startsWith('/') || src.startsWith('levels_packs/')) return src;
      return levelPath ? (levelPath + '/' + src) : src;
    };
    Object.values(chars).forEach(c => {
      if (c.portraits) Object.values(c.portraits).forEach(p => assets.add(resolve(p)));
    });
    const nodes = storyData.script || storyData.nodes || [];
    nodes.forEach(node => {
      if (node.type === 'bg' && node.src) assets.add(resolve(node.src));
      if (node.type === 'bgm' && node.src) assets.add(resolve(node.src));
      if (node.type === 'puzzle' && node.bgm) assets.add(resolve(node.bgm));
    });
    if (storyData.default_background) assets.add(resolve(storyData.default_background));
    if (storyData.default_bgm) assets.add(resolve(storyData.default_bgm));
    return Array.from(assets);
  }
  /** 开始执行剧情 */
  async start() {
    this.currentIndex = 0;
    this.visibleCharacters = {};
    await this._executeNext();
  }
  /** 执行下一个节点（自动跳过非交互节点） */
  async _executeNext() {
    while (this.currentIndex < this.script.length && !this.paused) {
      const node = this.script[this.currentIndex];
      this.currentIndex++;
      const stop = await this._executeNode(node);
      if (stop) return;
    }
  }
  async _executeNode(node) {
    switch (node.type) {
      case 'bg':
        this.game.ui.setBackground(this._resolvePath(node.src));
        return false;
      case 'bgm':
        this.game.audio.playBGM(this._resolvePath(node.src));
        return false;
      case 'show':
        this._showCharacter(node.character || node.charId, node.position, node.expression || node.portrait);
        return false;
      case 'hide':
        this._hideCharacter(node.character || node.charId);
        return false;
      case 'dialog':
        return await this._showDialog(node);
      case 'narration':
        return await this._showNarration(node.text);
      case 'handbook':
        this.game.addHandbookNote(node.title, node.content);
        return false;
      case 'puzzle':
        return await this._startPuzzle(node);
      case 'win':
        this.game.onLevelWin();
        return true;
      default:
        console.warn('Unknown story node type:', node.type);
        return false;
    }
  }
  _showCharacter(charId, position, expression) {
    const char = this.characters[charId];
    if (!char) return;
    const portrait = this._resolvePath(char.portraits[expression] || char.portraits.normal);
    this.visibleCharacters[charId] = { position, portrait, name: char.name, color: char.color };
    this.game.ui.showCharacter(charId, portrait, position, char.name, char.color);
  }
  _hideCharacter(charId) {
    delete this.visibleCharacters[charId];
    this.game.ui.hideCharacter(charId);
  }
  _showDialog(node) {
    return new Promise(resolve => {
      this.waitingForInput = true;
      this._resolveInput = resolve;
      const charId = node.speaker || node.charId;
      const char = this.characters[charId];
      if (char && node.portrait && this.visibleCharacters[charId]) {
        const portrait = this._resolvePath(char.portraits[node.portrait] || char.portraits.normal);
        if (this.visibleCharacters[charId].portrait !== portrait) {
          this.visibleCharacters[charId].portrait = portrait;
          this.game.ui.showCharacter(charId, portrait, this.visibleCharacters[charId].position, char.name, char.color);
        }
      }
      this.game.ui.showDialog(node.text, char ? char.name : '', char ? char.color : '');
    });
  }
  _showNarration(text) {
    return new Promise(resolve => {
      this.waitingForInput = true;
      this._resolveInput = resolve;
      this.game.ui.showNarration(text);
    });
  }
  _startPuzzle(node) {
    return new Promise(resolve => {
      this.waitingForPuzzle = true;
      this.currentPuzzleId = node.id || node.puzzleId;
      this.currentPuzzleNode = node;
      this._resolvePuzzle = resolve;
      if (node.bgm) this.game.audio.playBGM(this._resolvePath(node.bgm));
      this.game.ui.loadPuzzleScene(node.scene);
    });
  }
  /** 用户点击继续 */
  advance() {
    if (this.waitingForInput && this._resolveInput) {
      this.waitingForInput = false;
      const r = this._resolveInput;
      this._resolveInput = null;
      r();
    }
  }
  /** 解题完成，继续剧情 */
  completePuzzle(puzzleId) {
    if (this.waitingForPuzzle && this.currentPuzzleId === puzzleId) {
      this.waitingForPuzzle = false;
      this.currentPuzzleId = null;
      const r = this._resolvePuzzle;
      this._resolvePuzzle = null;
      r();
    }
  }
  destroy() {
    this.paused = true;
    this.script = [];
    this.visibleCharacters = {};
  }
}
