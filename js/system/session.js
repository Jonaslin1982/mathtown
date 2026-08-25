/**
 * Session - 关卡会话管理（视觉小说模式）
 * 集成剧情引擎、计时器、手札记录
 */
class Session {
  constructor(game) {
    this.game = game;
    this.levelId = null;
    this.meta = null;
    this.story = null;
    this.storyEngine = null;
    this.startTime = 0;
    this.elapsedMs = 0;
    this._timerInterval = null;
    this.handbookNotes = [];
    this.puzzleCompleted = {};
    this.iframe = null;
    this._ended = false;
    // 军事沙盘相关
    this.sandboxOutcome = null;
    this.sandboxResources = null;
  }

  async start(levelId, meta, storyData, levelPath) {
    this.levelId = levelId;
    this.meta = meta;
    this.levelPath = levelPath;
    this.handbookNotes = [];
    this.puzzleCompleted = {};
    this._ended = false;
    this.sandboxOutcome = null;
    this.sandboxResources = null;

    this.storyEngine = new StoryEngine(this.game);
    this.storyEngine.load(storyData);

    this.startTime = performance.now();
    this.elapsedMs = 0;
    this._startTimer();

    await this.storyEngine.start();
  }

  _startTimer() {
    this._timerInterval = setInterval(() => {
      if (!this._ended) {
        this.elapsedMs = performance.now() - this.startTime;
        this.game.ui.updateTimer(this.elapsedMs);
      }
    }, 1000);
  }

  getElapsedSeconds() {
    return Math.floor(this.elapsedMs / 1000);
  }

  formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
  }

  addHandbookNote(title, content) {
    // 去重：同一关卡内相同标题的笔记只记录一次
    if (this.handbookNotes.some(n => n.title === title)) return false;
    const note = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title,
      content,
      created_at: new Date().toISOString()
    };
    this.handbookNotes.push(note);
    this.game.storage.getSave().then(save => {
      if (!save.handbook_notes[this.levelId]) save.handbook_notes[this.levelId] = [];
      if (!save.handbook_notes[this.levelId].some(n => n.title === title)) {
        save.handbook_notes[this.levelId].push(note);
        this.game.storage.putSave(save);
      }
    });
    return true;
  }

  onPuzzleComplete(puzzleId) {
    this.puzzleCompleted[puzzleId] = true;
    if (this.storyEngine) {
      this.storyEngine.completePuzzle(puzzleId);
    }
  }

  /** 初始化沙盘随机资源（含防死局校验：确保存在完美通关解） */
  initSandbox() {
    let attempts = 0;
    while (attempts < 50) {
      const W = Math.floor(Math.random() * (720000 - 360000 + 1)) + 360000;
      const Me = Math.floor(Math.random() * (48000 - 24000 + 1)) + 24000;
      const Hay = Math.floor(Math.random() * (640000 - 320000 + 1)) + 320000;
      const S1 = Math.floor(W / 9);
      const S2 = Math.floor(Me / 0.5);
      const S3 = Math.floor(Hay / 8);
      const Smax = Math.min(S1, S2, S3);
      let hasPerfect = false;
      for (let Y = 12; Y <= 14; Y++) {
        const maxX = Math.floor(Smax / Y / 100) * 100;
        if (maxX >= 1000 && (maxX * Y) / Smax >= 0.9) {
          hasPerfect = true;
          break;
        }
      }
      if (hasPerfect) {
        this.sandboxResources = { W_total: W, Me_total: Me, Hay_total: Hay, S_max: Smax };
        return this.sandboxResources;
      }
      attempts++;
    }
    this.sandboxResources = { W_total: 540000, Me_total: 36000, Hay_total: 480000, S_max: 60000 };
    return this.sandboxResources;
  }

  /** 计算沙盘结局 */
  calculateSandboxOutcome(X, Y) {
    const r = this.sandboxResources;
    if (!r) return { outcome: 'annihilated', detail: '资源未初始化' };
    const water = 9 * X * Y;
    const meat = 0.5 * X * Y;
    const hay = 8 * X * Y;
    const personDays = X * Y;
    const efficiency = personDays / r.S_max;
    // 兵力不足千人：惨败
    if (X < 1000) {
      return { outcome: 'annihilated', detail: '出征兵力不足千人，面对敌军主力战力悬殊，接战即溃，惨败而归。', water, meat, hay, personDays, efficiency, legal: false };
    }
    // 补给耗尽：明确指出哪种资源不够
    const shortages = [];
    if (water > r.W_total) shortages.push('水源');
    if (meat > r.Me_total) shortages.push('肉食');
    if (hay > r.Hay_total) shortages.push('马料');
    if (shortages.length > 0) {
      return { outcome: 'annihilated', detail: '行军途中' + shortages.join('、') + '耗尽，大军渴饿交加，战马倒毙，全军覆没于戈壁。', water, meat, hay, personDays, efficiency, legal: false };
    }
    // 无法抵境
    if (Y < 12) {
      return { outcome: 'short', detail: '戈壁全程720里，非日行60里、满12日不可逾越。行军过急，大军困死途中。', water, meat, hay, personDays, efficiency, legal: true };
    }
    // 错失战机
    if (Y > 14) {
      return { outcome: 'delayed', detail: '行军拖沓，抵达时敌军已完成布防，战机尽失，虽胜犹憾。', water, meat, hay, personDays, efficiency, legal: true };
    }
    // 合格通关
    if (efficiency < 0.9) {
      // 兵力刚过下限但不多：苦战惨胜
      if (X < 2000) {
        return { outcome: 'hard_fought', detail: '兵力刚够最低门槛，将士们浴血奋战，虽胜但伤亡惨重，苦战惨胜。', water, meat, hay, personDays, efficiency, legal: true };
      }
      return { outcome: 'pass', detail: '按时抵达，兵力保守，资源充裕，稳稳拿下此战。', water, meat, hay, personDays, efficiency, legal: true };
    }
    // 完美通关
    return { outcome: 'perfect', detail: '极致最优，兵力与补给配合天衣无缝，以最小代价拿下最大战果，史诗完胜！', water, meat, hay, personDays, efficiency, legal: true };
  }

  destroy() {
    this._ended = true;
    if (this._timerInterval) clearInterval(this._timerInterval);
    if (this.storyEngine) this.storyEngine.destroy();
    if (this.iframe && this.iframe.parentNode) this.iframe.parentNode.removeChild(this.iframe);
    this.iframe = null;
    this.storyEngine = null;
  }
}
