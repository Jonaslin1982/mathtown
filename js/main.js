/**
 * MathTownGame - 主游戏控制器（视觉小说模式）
 */
class MathTownGame {
  constructor() {
    this.storage = new StorageManager();
    this.audio = new AudioManager();
    this.packLoader = new PackLoader();
    this.ui = new UIManager(this);
    this.session = null;
    this.currentLevelId = null;
  }

  async init() {
    try {
      await this.storage.init();
      await this.audio.init();
      await this.packLoader.loadAll();
      this.ui.initStartScreen();
      this.ui.initGameScreen();
      this.ui.showScreen('start');
      const save = await this.storage.getSave();
      this.audio.setBGMVolume(save.settings.bgm_volume);
      this.audio.setSFXVolume(save.settings.sfx_volume);
      console.log('MathTown init complete');
    } catch (e) {
      console.error('Init failed:', e);
      const div = document.createElement('div');
      div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#1a1a2e;color:#fff;padding:40px;font-family:monospace;z-index:99999;overflow:auto;';
      div.innerHTML = '<h2>Init Error</h2><pre>' + (e.message || e) + '\n\n' + (e.stack || '') + '</pre>';
      document.body.appendChild(div);
    }
  }

  enterMainMenu() {
    this.storage.getSave().then(save => {
      this.ui.renderMainMenu(this.packLoader.packs, save);
    });
  }

  async startLevel(compositeId) {
    const levelInfo = this.packLoader.getLevel(compositeId);
    if (!levelInfo) {
      this.ui.showModal('提示', '关卡未找到');
      return;
    }
    this.currentLevelId = compositeId;
    this._showLoading('正在加载关卡素材...');
    try {
      const storyResp = await fetch(levelInfo.path + '/story.json');
      const storyData = await storyResp.json();
      const engine = new StoryEngine(this);
      const assets = engine.collectAssets(storyData);
      if (levelInfo.meta.thumbnail) assets.push(levelInfo.path + '/' + levelInfo.meta.thumbnail);
      await this._preloadAssets(assets);
      this._hideLoading();
      this.ui.showScreen('game');
      this.ui.setupGameUI(levelInfo.meta);
      this.session = new Session(this);
      await this.session.start(compositeId, levelInfo.meta, storyData, levelInfo.path);
    } catch (err) {
      console.error('关卡加载失败:', err);
      this._hideLoading();
      this.ui.showModal('加载失败', '关卡加载失败：' + err.message);
    }
  }

  async _preloadAssets(urls) {
    const total = urls.length;
    let loaded = 0;
    const promises = urls.map(url => {
      return new Promise(resolve => {
        if (url.endsWith('.wav') || url.endsWith('.mp3') || url.endsWith('.ogg')) {
          const audio = new Audio();
          audio.oncanplaythrough = () => { loaded++; this._updateLoading(loaded, total); resolve(); };
          audio.onerror = () => { loaded++; this._updateLoading(loaded, total); resolve(); };
          audio.src = url;
        } else {
          const img = new Image();
          img.onload = () => { loaded++; this._updateLoading(loaded, total); resolve(); };
          img.onerror = () => { loaded++; this._updateLoading(loaded, total); resolve(); };
          img.src = url;
        }
      });
    });
    await Promise.all(promises);
  }

  _showLoading(text) {
    document.getElementById('loading-text').textContent = text || '正在加载...';
    document.getElementById('loading-progress').style.width = '0%';
    document.getElementById('loading-overlay').style.display = 'flex';
  }

  _updateLoading(loaded, total) {
    const pct = total > 0 ? Math.round((loaded / total) * 100) : 100;
    document.getElementById('loading-progress').style.width = pct + '%';
  }

  _hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
  }

  addHandbookNote(title, content) {
    if (this.session) {
      const added = this.session.addHandbookNote(title, content);
      if (added) {
        this.ui.showModal('📖 手札更新', '新笔记已记录：「' + title + '」\n\n可在右侧面板点击「手札」查看。');
      }
    }
  }

  async onLevelWin(outcome) {
    if (!this.session || this.session._ended) return;
    const elapsedMs = this.session.elapsedMs;
    const timeStr = this.session.formatTime(elapsedMs);
    const levelInfo = this.packLoader.getLevel(this.currentLevelId);
    const meta = levelInfo && levelInfo.meta;
    this.session._ended = true;
    if (this.session._timerInterval) {
      clearInterval(this.session._timerInterval);
      this.session._timerInterval = null;
    }
    let badgeInfo = null;
    let endingBg = null;
    if (meta && meta.badges && outcome) {
      const matchedBadge = meta.badges.find(b => b.outcomes && b.outcomes.includes(outcome));
      if (matchedBadge) {
        badgeInfo = { name: matchedBadge.name, image: levelInfo.path + '/' + matchedBadge.image, tier: matchedBadge.tier, tier_order: matchedBadge.tier_order };
      }
      if (meta.ending_backgrounds && meta.ending_backgrounds[outcome]) {
        endingBg = levelInfo.path + '/' + meta.ending_backgrounds[outcome];
      }
    } else if (meta && meta.badge) {
      badgeInfo = { name: meta.badge.name, image: levelInfo.path + '/' + meta.badge.image };
    }
    (async () => {
      try {
        const save = await this.storage.getSave();
        if (!save.completed_levels) save.completed_levels = {};
        if (!save.best_times) save.best_times = {};
        if (!save.unlocked_levels) save.unlocked_levels = [];
        if (!save.badge_tiers) save.badge_tiers = {};
        save.completed_levels[this.currentLevelId] = true;
        if (!save.best_times[this.currentLevelId] || elapsedMs < save.best_times[this.currentLevelId]) {
          save.best_times[this.currentLevelId] = elapsedMs;
        }
        if (badgeInfo && badgeInfo.tier_order) {
          const currentTier = save.badge_tiers[this.currentLevelId];
          if (!currentTier || badgeInfo.tier_order > currentTier) {
            save.badge_tiers[this.currentLevelId] = badgeInfo.tier_order;
          }
        }
        const next = this.packLoader.getNextLevel(this.currentLevelId);
        if (next && !save.unlocked_levels.includes(next.compositeId)) {
          save.unlocked_levels.push(next.compositeId);
        }
        await this.storage.putSave(save);
      } catch (e) {
        console.error('保存通关数据失败:', e);
      }
    })();
    if (this.session) {
      this.session.destroy();
      this.session = null;
    }
    this.ui.showSettlement({ timeStr, elapsedMs, outcome, endingBg }, badgeInfo);
  }

  restartLevel() {
    if (this.session) {
      this.session.destroy();
      this.session = null;
    }
    this.startLevel(this.currentLevelId);
  }

  quitToMenu() {
    if (this.session) {
      this.session.destroy();
      this.session = null;
    }
    this.enterMainMenu();
  }
}

let game;
window.addEventListener('DOMContentLoaded', async () => {
  game = new MathTownGame();
  await game.init();
});
