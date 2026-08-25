/**
 * UIManager - 视觉小说模式 UI 管理器
 */
class UIManager {
  constructor(game) {
    this.game = game;
    this.currentScreen = null;
    this.iframe = null;
    this._inPuzzle = false;
    this._handbookPage = 0;
    this._handbookSearch = '';
    this._draftCanvas = null;
    this._draftCtx = null;
    this._draftDrawing = false;
    this._draftData = null;
  }

  showScreen(name) {
    ['start', 'main-menu', 'game', 'settlement', 'gallery'].forEach(s => {
      const el = document.getElementById('screen-' + s);
      if (el) el.style.display = (s === name) ? 'flex' : 'none';
    });
    this.currentScreen = name;
  }

  initStartScreen() {
    document.getElementById('btn-enter').addEventListener('click', () => {
      this.game.audio.playSFX('ui_click');
      this.game.enterMainMenu();
    });
    document.getElementById('btn-gallery-start').addEventListener('click', () => {
      this.game.audio.playSFX('ui_click');
      this.showGallery();
    });
    document.getElementById('btn-handbook-start').addEventListener('click', () => {
      this.game.audio.playSFX('ui_click');
      this.showHandbook();
    });
    document.getElementById('btn-settings-start').addEventListener('click', () => {
      this.game.audio.playSFX('ui_click');
      this.showSettings();
    });
  }

  renderMainMenu(packs, save) {
    this.showScreen('main-menu');
    this.game.audio.playBGM('assets/audio/bgm_menu.mp3');
    const container = document.getElementById('level-list');
    container.innerHTML = '';
    let totalLevels = 0, completedLevels = 0;

    packs.forEach(pack => {
      const packSection = document.createElement('div');
      packSection.className = 'pack-section';
      const header = document.createElement('div');
      header.className = 'pack-header';
      header.innerHTML = '<span class="pack-icon">📦</span> <span class="pack-name">' + pack.pack_name + '</span> <span class="pack-desc">' + (pack.description || '') + '</span>';
      packSection.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'level-grid-vn';
      pack.levels.forEach(level => {
        totalLevels++;
        const cid = level.compositeId;
        const unlocked = this.game.packLoader.isFirstLevel(cid) || save.unlocked_levels.includes(cid);
        const completed = save.completed_levels && save.completed_levels[cid];
        const bestTime = save.best_times && save.best_times[cid];
        if (completed) completedLevels++;

        const card = document.createElement('div');
        card.className = 'level-card-vn' + (unlocked ? '' : ' locked');
        card.tabIndex = unlocked ? 0 : -1;
        const thumb = level.meta.thumbnail ? (level.path + '/' + level.meta.thumbnail) : 'assets/ui/default_thumb.png';
        card.innerHTML =
          '<div class="level-thumb-vn"><img src="' + thumb + '" onerror="this.src=\'assets/ui/default_thumb.png\'"></div>' +
          '<div class="level-info-vn">' +
            '<div class="level-name-vn">' + level.meta.level_name + '</div>' +
            '<div class="level-meta-vn">' +
              (bestTime ? '<span class="best-time">⏱ ' + this._formatTime(bestTime) + '</span>' : '<span class="not-played">未通关</span>') +
              (completed ? '<span class="cleared-badge">✓ 已通关</span>' : '') +
            '</div>' +
          '</div>' +
          (unlocked ? '' : '<div class="level-lock">🔒</div>');
        if (unlocked) {
          const startFn = () => {
            this.game.audio.playSFX('ui_click');
            this.game.startLevel(cid);
          };
          card.addEventListener('click', startFn);
          card.addEventListener('keydown', (e) => { if (e.key === 'Enter') startFn(); });
        }
        grid.appendChild(card);
      });
      packSection.appendChild(grid);
      container.appendChild(packSection);
    });

    document.getElementById('progress-text').textContent = '已通关 ' + completedLevels + '/' + totalLevels + ' 关';
    document.getElementById('btn-back-to-start').onclick = () => {
      this.game.audio.playSFX('ui_click');
      this.showScreen('start');
    };
    document.getElementById('btn-settings-menu').onclick = () => {
      this.game.audio.playSFX('ui_click');
      this.showSettings();
    };
  }

  _formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  initGameScreen() {
    const advanceFn = () => {
      if (this.game.session && this.game.session.storyEngine && !this._inPuzzle) {
        this.game.session.storyEngine.advance();
      }
    };
    document.getElementById('dialog-box').addEventListener('click', advanceFn);
    document.getElementById('scene-area').addEventListener('click', advanceFn);

    document.getElementById('btn-handbook').addEventListener('click', () => {
      this.game.audio.playSFX('ui_click');
      this.showHandbook();
    });
    document.getElementById('btn-hint').addEventListener('click', () => {
      this.game.audio.playSFX('ui_click');
      this._useHint();
    });
    document.getElementById('btn-draft').addEventListener('click', () => {
      this.game.audio.playSFX('ui_click');
      this.showDraft();
    });
    document.getElementById('btn-menu').addEventListener('click', () => {
      this.game.audio.playSFX('ui_click');
      this.showMenu();
    });
  }

  setupGameUI(meta) {
    document.getElementById('game-level-title').textContent = meta.level_name;
    document.getElementById('timer-display').textContent = '00:00:00';
    this._inPuzzle = false;
    this._clearCharacters();
    this._hideDialog();
    this._draftData = null;
    this._draftCanvas = null;
  }

  updateTimer(ms) {
    const el = document.getElementById('timer-display');
    if (el) {
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      el.textContent = [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
    }
  }

  setBackground(src) {
    const bg = document.getElementById('scene-background');
    if (bg) {
      bg.style.opacity = '0';
      setTimeout(() => {
        bg.style.backgroundImage = 'url(' + src + ')';
        bg.style.opacity = '1';
      }, 200);
    }
  }

  showCharacter(charId, portrait, position, name, color) {
    let el = document.getElementById('char-' + charId);
    if (!el) {
      el = document.createElement('img');
      el.id = 'char-' + charId;
      el.className = 'character-portrait';
      document.getElementById('character-layer').appendChild(el);
    }
    el.src = portrait;
    el.alt = name || '';
    el.className = 'character-portrait ' + (position || 'left');
    el.style.opacity = '0';
    requestAnimationFrame(() => { el.style.opacity = '1'; });
  }

  hideCharacter(charId) {
    const el = document.getElementById('char-' + charId);
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }
  }

  _clearCharacters() {
    const layer = document.getElementById('character-layer');
    if (layer) layer.innerHTML = '';
  }

  showDialog(text, speaker, color) {
    this._inPuzzle = false;
    const box = document.getElementById('dialog-box');
    const nameEl = document.getElementById('dialog-speaker');
    const textEl = document.getElementById('dialog-text');
    const arrow = document.getElementById('dialog-arrow');
    if (speaker) {
      nameEl.textContent = speaker;
      nameEl.style.display = 'block';
      nameEl.style.background = color || '#8b6914';
    } else {
      nameEl.style.display = 'none';
    }
    textEl.textContent = text;
    textEl.style.fontStyle = '';
    textEl.style.textAlign = '';
    box.style.display = 'block';
    arrow.style.display = 'block';
  }

  showNarration(text) {
    this._inPuzzle = false;
    const box = document.getElementById('dialog-box');
    const nameEl = document.getElementById('dialog-speaker');
    const textEl = document.getElementById('dialog-text');
    const arrow = document.getElementById('dialog-arrow');
    nameEl.style.display = 'none';
    textEl.textContent = text;
    textEl.style.fontStyle = 'italic';
    textEl.style.textAlign = 'center';
    box.style.display = 'block';
    arrow.style.display = 'block';
  }

  _hideDialog() {
    document.getElementById('dialog-box').style.display = 'none';
    document.getElementById('dialog-arrow').style.display = 'none';
  }

  loadPuzzleScene(sceneName) {
    this._inPuzzle = true;
    document.getElementById('dialog-arrow').style.display = 'none';
    const container = document.getElementById('puzzle-container');
    const oldIframe = container.querySelector('iframe');
    if (oldIframe) oldIframe.remove();

    this.iframe = document.createElement('iframe');
    this.iframe.src = this.game.session.levelPath + '/scenes/' + sceneName + '.html';
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.border = 'none';
    this.iframe.style.opacity = '0';
    container.appendChild(this.iframe);
    this.game.session.iframe = this.iframe;

    setTimeout(() => { this.iframe.style.opacity = '1'; }, 100);

    const handler = (e) => {
      const m = e.data;
      if (m && m.protocol === 'mathtown-puzzle' && m.action === 'complete') {
        window.removeEventListener('message', handler);
        this._finishPuzzle(m.puzzleId);
      }
    };
    window.addEventListener('message', handler);
  }

  _finishPuzzle(puzzleId) {
    const container = document.getElementById('puzzle-container');
    if (this.iframe) this.iframe.style.opacity = '0';
    setTimeout(() => {
      container.innerHTML = '';
      this.iframe = null;
      this._inPuzzle = false;
      if (this.game.session) {
        this.game.session.onPuzzleComplete(puzzleId);
      }
    }, 300);
  }

  /** 军事沙盘：兵力与天数调配 */
  showSandbox(config) {
    this._inPuzzle = true;
    this._sandboxConfig = config;
    document.getElementById('dialog-arrow').style.display = 'none';
    const container = document.getElementById('puzzle-container');
    container.innerHTML = '';
    const r = this.game.session.sandboxResources;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;padding:16px 24px;box-sizing:border-box;font-family:inherit;color:#3a2a1a;overflow-y:auto;';
    // 标题
    const title = document.createElement('div');
    title.style.cssText = 'text-align:center;font-size:20px;font-weight:bold;margin-bottom:12px;color:#5a3a1a;letter-spacing:2px;';
    title.textContent = '⚔ 戈壁后勤推演 ⚔';
    wrap.appendChild(title);
    // 预埋资源
    const resRow = document.createElement('div');
    resRow.style.cssText = 'display:flex;gap:12px;margin-bottom:16px;justify-content:center;';
    const resItems = [
      { label: '预埋水源', val: r.W_total, unit: '单位', icon: '💧', color: '#4a90d9' },
      { label: '预埋肉食', val: r.Me_total, unit: '单位', icon: '🍖', color: '#c0392b' },
      { label: '预埋马料', val: r.Hay_total, unit: '单位', icon: '🌾', color: '#d4a017' }
    ];
    resItems.forEach(item => {
      const card = document.createElement('div');
      card.style.cssText = 'flex:1;max-width:180px;background:rgba(255,248,230,0.9);border:2px solid ' + item.color + ';border-radius:8px;padding:8px 12px;text-align:center;';
      card.innerHTML = '<div style="font-size:13px;color:#666;">' + item.icon + ' ' + item.label + '</div>' +
        '<div style="font-size:20px;font-weight:bold;color:' + item.color + ';">' + item.val.toLocaleString() + '</div>' +
        '<div style="font-size:11px;color:#999;">' + item.unit + '</div>';
      resRow.appendChild(card);
    });
    wrap.appendChild(resRow);
    // 滑块区域
    const sliderArea = document.createElement('div');
    sliderArea.style.cssText = 'background:rgba(255,248,230,0.85);border-radius:10px;padding:16px 20px;margin-bottom:14px;';
    // 兵力滑块
    const troopLabel = document.createElement('div');
    troopLabel.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px;';
    troopLabel.innerHTML = '<span>🐎 出征兵力（人，整百）</span><span id="sandbox-troop-val" style="font-weight:bold;color:#5a3a1a;">3000</span>';
    sliderArea.appendChild(troopLabel);
    const troopSlider = document.createElement('input');
    troopSlider.type = 'range';
    troopSlider.min = 100; troopSlider.max = 10000; troopSlider.step = 100; troopSlider.value = 3000;
    troopSlider.style.cssText = 'width:100%;margin-bottom:14px;accent-color:#8b4513;';
    sliderArea.appendChild(troopSlider);
    // 天数滑块
    const dayLabel = document.createElement('div');
    dayLabel.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px;';
    dayLabel.innerHTML = '<span>📅 行军天数（日）</span><span id="sandbox-day-val" style="font-weight:bold;color:#5a3a1a;">12</span>';
    sliderArea.appendChild(dayLabel);
    const daySlider = document.createElement('input');
    daySlider.type = 'range';
    daySlider.min = 1; daySlider.max = 30; daySlider.step = 1; daySlider.value = 12;
    daySlider.style.cssText = 'width:100%;accent-color:#8b4513;';
    sliderArea.appendChild(daySlider);
    wrap.appendChild(sliderArea);
    // 实时消耗显示
    const consumeArea = document.createElement('div');
    consumeArea.style.cssText = 'background:rgba(255,248,230,0.85);border-radius:10px;padding:12px 16px;margin-bottom:14px;';
    const consumeTitle = document.createElement('div');
    consumeTitle.style.cssText = 'font-size:14px;font-weight:bold;margin-bottom:8px;color:#5a3a1a;';
    consumeTitle.textContent = '📊 预计总消耗';
    consumeArea.appendChild(consumeTitle);
    const consumeGrid = document.createElement('div');
    consumeGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;';
    const consumeItems = [
      { id: 'c-water', label: '水', color: '#4a90d9' },
      { id: 'c-meat', label: '肉', color: '#c0392b' },
      { id: 'c-hay', label: '马料', color: '#d4a017' }
    ];
    consumeItems.forEach(item => {
      const cell = document.createElement('div');
      cell.style.cssText = 'text-align:center;padding:6px;border-radius:6px;background:rgba(255,255,255,0.5);';
      cell.innerHTML = '<div style="font-size:11px;color:#888;">' + item.label + '</div>' +
        '<div id="' + item.id + '" style="font-size:16px;font-weight:bold;color:' + item.color + ';">0</div>';
      consumeGrid.appendChild(cell);
    });
    consumeArea.appendChild(consumeGrid);
    const statusLine = document.createElement('div');
    statusLine.id = 'sandbox-status';
    statusLine.style.cssText = 'text-align:center;margin-top:8px;font-size:13px;font-weight:bold;';
    consumeArea.appendChild(statusLine);
    wrap.appendChild(consumeArea);
    // 出征按钮
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'text-align:center;';
    const marchBtn = document.createElement('button');
    marchBtn.textContent = '⚔ 出征！';
    marchBtn.style.cssText = 'padding:12px 48px;font-size:18px;font-weight:bold;background:linear-gradient(135deg,#8b4513,#a0522d);color:#fff;border:none;border-radius:8px;cursor:pointer;letter-spacing:4px;box-shadow:0 4px 12px rgba(139,69,19,0.4);';
    btnRow.appendChild(marchBtn);
    wrap.appendChild(btnRow);
    container.appendChild(wrap);
    // 实时计算
    const updateCalc = () => {
      const X = parseInt(troopSlider.value);
      const Y = parseInt(daySlider.value);
      document.getElementById('sandbox-troop-val').textContent = X;
      document.getElementById('sandbox-day-val').textContent = Y;
      const water = 9 * X * Y;
      const meat = 0.5 * X * Y;
      const hay = 8 * X * Y;
      const wEl = document.getElementById('c-water');
      const mEl = document.getElementById('c-meat');
      const hEl = document.getElementById('c-hay');
      wEl.textContent = water.toLocaleString();
      mEl.textContent = meat.toLocaleString();
      hEl.textContent = hay.toLocaleString();
      const over = [];
      if (water > r.W_total) { over.push('水'); wEl.style.color = '#c0392b'; } else { wEl.style.color = '#4a90d9'; }
      if (meat > r.Me_total) { over.push('肉'); mEl.style.color = '#c0392b'; } else { mEl.style.color = '#c0392b'; }
      if (hay > r.Hay_total) { over.push('马料'); hEl.style.color = '#c0392b'; } else { hEl.style.color = '#d4a017'; }
      const status = document.getElementById('sandbox-status');
      if (over.length > 0) {
        status.textContent = '⚠ 补给不足：' + over.join('、') + ' 消耗超过预埋总量';
        status.style.color = '#c0392b';
        marchBtn.disabled = true;
        marchBtn.style.opacity = '0.5';
        marchBtn.style.cursor = 'not-allowed';
      } else {
        status.textContent = '';
        marchBtn.disabled = false;
        marchBtn.style.opacity = '1';
        marchBtn.style.cursor = 'pointer';
      }
    };
    troopSlider.addEventListener('input', updateCalc);
    daySlider.addEventListener('input', updateCalc);
    updateCalc();
    // 出征
    marchBtn.addEventListener('click', () => {
      this.game.audio.playSFX('ui_click');
      const X = parseInt(troopSlider.value);
      const Y = parseInt(daySlider.value);
      const result = this.game.session.calculateSandboxOutcome(X, Y);
      this._showSandboxResult(result, X, Y);
    });
  }

  /** 沙盘出征结果 */
  _showSandboxResult(result, X, Y) {
    const container = document.getElementById('puzzle-container');
    container.innerHTML = '';
    const isFail = result.outcome === 'annihilated' || result.outcome === 'short';
    const outcomeMap = {
      annihilated: { title: '💀 全军覆没', color: '#c0392b', icon: '💀' },
      short: { title: '🏜 无法抵境', color: '#e67e22', icon: '🏜' },
      delayed: { title: '⏳ 错失战机', color: '#d4a017', icon: '⏳' },
      hard_fought: { title: '⚔ 苦战惨胜', color: '#e67e22', icon: '⚔' },
      pass: { title: '✅ 合格通关', color: '#27ae60', icon: '✅' },
      perfect: { title: '🏆 完美通关', color: '#8b4513', icon: '🏆' }
    };
    const info = outcomeMap[result.outcome] || outcomeMap.pass;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;';
    const card = document.createElement('div');
    card.style.cssText = 'background:rgba(255,248,230,0.95);border:3px solid ' + info.color + ';border-radius:16px;padding:28px 36px;max-width:520px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.3);';
    card.innerHTML = '<div style="font-size:48px;margin-bottom:8px;">' + info.icon + '</div>' +
      '<div style="font-size:24px;font-weight:bold;color:' + info.color + ';margin-bottom:16px;letter-spacing:2px;">' + info.title + '</div>' +
      '<div style="font-size:14px;color:#5a4a3a;margin-bottom:12px;line-height:1.8;">' + result.detail + '</div>' +
      '<div style="font-size:13px;color:#8a7a6a;margin-bottom:16px;line-height:1.8;">' +
      '出征兵力：' + X.toLocaleString() + ' 人 &nbsp;|&nbsp; 行军天数：' + Y + ' 日<br>' +
      '资源利用率：' + (result.efficiency * 100).toFixed(1) + '%' +
      '</div>';
    if (isFail) {
      const retryBtn = document.createElement('button');
      retryBtn.textContent = '🔄 重新推演';
      retryBtn.style.cssText = 'padding:10px 32px;font-size:16px;font-weight:bold;background:linear-gradient(135deg,#8b4513,#a0522d);color:#fff;border:none;border-radius:8px;cursor:pointer;letter-spacing:2px;';
      retryBtn.addEventListener('click', () => {
        this.game.audio.playSFX('ui_click');
        this.showSandbox(this._sandboxConfig || {});
      });
      card.appendChild(retryBtn);
    } else {
      const contBtn = document.createElement('button');
      contBtn.textContent = '继续 →';
      contBtn.style.cssText = 'padding:10px 32px;font-size:16px;font-weight:bold;background:linear-gradient(135deg,#8b4513,#a0522d);color:#fff;border:none;border-radius:8px;cursor:pointer;letter-spacing:2px;';
      contBtn.addEventListener('click', () => {
        this.game.audio.playSFX('ui_click');
        this._inPuzzle = false;
        container.innerHTML = '';
        if (this.game.session && this.game.session.storyEngine) {
          this.game.session.storyEngine.completeSandbox(result.outcome);
        }
      });
      card.appendChild(contBtn);
    }
    wrap.appendChild(card);
    container.appendChild(wrap);
  }

  _useHint() {
    if (this._inPuzzle && this.game.session && this.game.session.storyEngine && this.game.session.storyEngine.currentPuzzleNode) {
      const node = this.game.session.storyEngine.currentPuzzleNode;
      const hint = node.hint || '仔细观察题目中的数字关系，必要时可以打开草稿功能进行计算。';
      this.showModal('💡 解题提示', hint);
    } else {
      this.showModal('💡 提示', '当前没有任何提示。\n\n在解题环节中点击提示按钮可获得帮助。');
    }
  }

  showMenu() {
    const overlay = document.getElementById('menu-overlay');
    overlay.style.display = 'flex';
    document.getElementById('menu-restart').onclick = () => {
      overlay.style.display = 'none';
      this.game.restartLevel();
    };
    document.getElementById('menu-quit').onclick = () => {
      overlay.style.display = 'none';
      this.game.quitToMenu();
    };
    document.getElementById('menu-settings').onclick = () => {
      overlay.style.display = 'none';
      this.showSettings();
    };
    document.getElementById('menu-close').onclick = () => {
      overlay.style.display = 'none';
    };
  }

  async showHandbook() {
    try {
      const save = await this.game.storage.getSave();
      // 合并所有关卡的手札笔记
      const allNotes = [];
      const notesByLevel = save.handbook_notes || {};
      const allLevels = this.game.packLoader ? this.game.packLoader.getAllLevels() : [];
      const levelNameMap = {};
      allLevels.forEach(({ level }) => { levelNameMap[level.compositeId] = level.meta.level_name; });
      Object.keys(notesByLevel).forEach(levelId => {
        const levelName = levelNameMap[levelId] || levelId;
        notesByLevel[levelId].forEach(n => {
          allNotes.push({
            ...n,
            levelName: levelName
          });
        });
      });
      // 按创建时间排序
      allNotes.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
      this._handbookPage = 0;
      this._handbookSearch = '';
      this._renderHandbook(allNotes);
      document.getElementById('handbook-overlay').style.display = 'flex';

      document.getElementById('handbook-search').oninput = (e) => {
        this._handbookSearch = e.target.value.toLowerCase();
        this._handbookPage = 0;
        this._renderHandbook(allNotes);
      };
      document.getElementById('handbook-prev').onclick = () => {
        if (this._handbookPage > 0) { this._handbookPage--; this._renderHandbook(allNotes); }
      };
      document.getElementById('handbook-next').onclick = () => {
        const filtered = this._filterNotes(allNotes);
        const pages = Math.ceil(filtered.length / 5);
        if (this._handbookPage < pages - 1) { this._handbookPage++; this._renderHandbook(allNotes); }
      };
      document.getElementById('handbook-close').onclick = () => {
        document.getElementById('handbook-overlay').style.display = 'none';
      };
    } catch (e) {
      console.error('打开手札失败:', e);
      this.showModal('错误', '打开手札失败：' + e.message);
    }
  }

  _filterNotes(notes) {
    if (!this._handbookSearch) return notes;
    return notes.filter(n =>
      (n.title && n.title.toLowerCase().includes(this._handbookSearch)) ||
      (n.content && n.content.toLowerCase().includes(this._handbookSearch))
    );
  }

  _renderHandbook(allNotes) {
    const filtered = this._filterNotes(allNotes);
    const perPage = 5;
    const pages = Math.ceil(filtered.length / perPage);
    const start = this._handbookPage * perPage;
    const pageNotes = filtered.slice(start, start + perPage);

    const list = document.getElementById('handbook-list');
    list.innerHTML = '';
    if (pageNotes.length === 0) {
      list.innerHTML = '<p class="empty-notes">暂无笔记。剧情中的数学知识会自动记录在这里。</p>';
    } else {
      pageNotes.forEach(n => {
        const div = document.createElement('div');
        div.className = 'handbook-note-vn';
        const levelTag = n.levelName ? '<span class="handbook-level-tag">' + n.levelName + '</span>' : '';
        div.innerHTML = '<h4>' + levelTag + (n.title || '未命名') + '</h4><p>' + (n.content || '').replace(/\n/g, '<br>') + '</p>';
        list.appendChild(div);
      });
    }
    document.getElementById('handbook-page-info').textContent =
      filtered.length > 0 ? (this._handbookPage + 1) + ' / ' + Math.max(1, pages) : '0 / 0';
    document.getElementById('handbook-count').textContent = '共 ' + filtered.length + ' 条';
  }

  // ===== 草稿功能 =====
  showDraft() {
    const overlay = document.getElementById('draft-overlay');
    overlay.style.display = 'flex';
    this._initDraftCanvas();

    document.getElementById('draft-close').onclick = () => {
      this._saveDraft();
      overlay.style.display = 'none';
    };
    document.getElementById('draft-clear').onclick = () => {
      if (this._draftCtx) {
        this._draftCtx.clearRect(0, 0, this._draftCanvas.width, this._draftCanvas.height);
        this._drawDraftBackground();
        this._draftData = null;
      }
    };
  }

  _initDraftCanvas() {
    if (this._draftCanvas) {
      if (this._draftData) {
        const img = new Image();
        img.onload = () => { this._draftCtx.clearRect(0,0,this._draftCanvas.width,this._draftCanvas.height); this._draftCtx.drawImage(img, 0, 0); };
        img.src = this._draftData;
      }
      return;
    }
    const canvas = document.getElementById('draft-canvas');
    const wrap = canvas.parentElement;
    const w = wrap.clientWidth || 600;
    const h = wrap.clientHeight || 400;
    canvas.width = w;
    canvas.height = h;
    this._draftCanvas = canvas;
    this._draftCtx = canvas.getContext('2d');
    this._drawDraftBackground();

    if (this._draftData) {
      const img = new Image();
      img.onload = () => { this._draftCtx.drawImage(img, 0, 0); };
      img.src = this._draftData;
    }

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
      const cy = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
      return { x: (cx - rect.left) * (canvas.width / rect.width), y: (cy - rect.top) * (canvas.height / rect.height) };
    };

    const startDraw = (e) => {
      e.preventDefault();
      this._draftDrawing = true;
      const pos = getPos(e);
      this._draftCtx.beginPath();
      this._draftCtx.moveTo(pos.x, pos.y);
    };
    const draw = (e) => {
      if (!this._draftDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      this._draftCtx.lineTo(pos.x, pos.y);
      this._draftCtx.strokeStyle = '#3a2a1a';
      this._draftCtx.lineWidth = 2;
      this._draftCtx.lineCap = 'round';
      this._draftCtx.lineJoin = 'round';
      this._draftCtx.stroke();
    };
    const endDraw = () => { this._draftDrawing = false; };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);
  }

  _drawDraftBackground() {
    if (!this._draftCtx) return;
    const ctx = this._draftCtx;
    const w = this._draftCanvas.width, h = this._draftCanvas.height;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f5e6c8');
    grad.addColorStop(0.5, '#ede0c0');
    grad.addColorStop(1, '#e8d9b5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = 'rgba(139,105,20,' + (Math.random() * 0.08) + ')';
      ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
  }

  _saveDraft() {
    if (this._draftCanvas) {
      this._draftData = this._draftCanvas.toDataURL('image/png');
    }
  }

  showSettlement(result, badgeInfo) {
    this.showScreen('settlement');
    this.game.audio.playBGM('assets/audio/bgm_menu.mp3');
    document.getElementById('set-time').textContent = result.timeStr;
    const badgeEl = document.getElementById('set-badge');
    if (badgeInfo) {
      badgeEl.innerHTML = '<img src="' + badgeInfo.image + '" onerror="this.style.display=\'none\'"><div class="badge-name-vn">' + badgeInfo.name + '</div>';
    } else {
      badgeEl.innerHTML = '<div class="badge-name-vn">通关成功</div>';
    }
    document.getElementById('btn-retry').onclick = () => {
      this.game.audio.playSFX('ui_click');
      this.game.restartLevel();
    };
    document.getElementById('btn-back-menu').onclick = () => {
      this.game.audio.playSFX('ui_click');
      this.game.quitToMenu();
    };
  }

  async showGallery() {
    this.showScreen('gallery');
    const save = await this.game.storage.getSave();
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';
    const allLevels = this.game.packLoader.getAllLevels();
    let total = 0, obtained = 0;

    allLevels.forEach(({ level }) => {
      total++;
      const cid = level.compositeId;
      const completed = save.completed_levels && save.completed_levels[cid];
      const badge = level.meta.badge;
      if (completed) obtained++;
      const cell = document.createElement('div');
      cell.className = 'gallery-badge-vn' + (completed ? '' : ' locked');
      if (completed && badge) {
        cell.innerHTML = '<img src="' + (level.path + '/' + badge.image) + '" onerror="this.style.display=\'none\'"><div class="g-name-vn">' + badge.name + '</div><div class="g-level-vn">' + level.meta.level_name + '</div>';
      } else {
        cell.innerHTML = '<div class="g-silhouette-vn">?</div><div class="g-name-vn">???</div><div class="g-level-vn">未通关</div>';
      }
      grid.appendChild(cell);
    });

    document.getElementById('gallery-progress').textContent = '徽章收集：' + obtained + ' / ' + total;
    document.getElementById('btn-gallery-back').onclick = () => {
      this.game.audio.playSFX('ui_click');
      if (this.game.session && !this.game.session._ended) {
        this.showScreen('game');
      } else {
        this.showScreen('start');
      }
    };
  }

  showSettings() {
    const overlay = document.getElementById('settings-overlay');
    overlay.style.display = 'flex';
    this.game.storage.getSave().then(save => {
      document.getElementById('bgm-volume').value = save.settings.bgm_volume;
      document.getElementById('sfx-volume').value = save.settings.sfx_volume;
    });
    document.getElementById('bgm-volume').oninput = (e) => {
      const v = parseInt(e.target.value);
      this.game.audio.setBGMVolume(v);
      this._updateSetting('bgm_volume', v);
    };
    document.getElementById('sfx-volume').oninput = (e) => {
      const v = parseInt(e.target.value);
      this.game.audio.setSFXVolume(v);
      this._updateSetting('sfx_volume', v);
    };
    document.getElementById('btn-export-save').onclick = () => this.game.storage.exportSave();
    document.getElementById('btn-clear-save').onclick = () => {
      if (confirm('确定要清空所有存档吗？')) {
        this.game.storage.clearSave().then(() => { location.reload(); });
      }
    };
    document.getElementById('btn-close-settings').onclick = () => { overlay.style.display = 'none'; };
  }

  async _updateSetting(key, value) {
    const save = await this.game.storage.getSave();
    save.settings[key] = value;
    await this.game.storage.putSave(save);
  }

  showModal(title, text) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = text;
    overlay.style.display = 'flex';
    document.getElementById('modal-ok').onclick = () => { overlay.style.display = 'none'; };
  }

  showToast(msg) {
    this.showModal('提示', msg);
  }
}
