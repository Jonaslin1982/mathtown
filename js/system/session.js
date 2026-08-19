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
  }

  async start(levelId, meta, storyData, levelPath) {
    this.levelId = levelId;
    this.meta = meta;
    this.levelPath = levelPath;
    this.handbookNotes = [];
    this.puzzleCompleted = {};
    this._ended = false;

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

  destroy() {
    this._ended = true;
    if (this._timerInterval) clearInterval(this._timerInterval);
    if (this.storyEngine) this.storyEngine.destroy();
    if (this.iframe && this.iframe.parentNode) this.iframe.parentNode.removeChild(this.iframe);
    this.iframe = null;
    this.storyEngine = null;
  }
}
