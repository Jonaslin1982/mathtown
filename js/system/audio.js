/**
 * AudioSystem - 音频系统
 * 负责 BGM、环境音、SFX 播放和音量控制
 */
class AudioManager {
  constructor() {
    this.bgmAudio = null;
    this.bgmVolume = 0.6;
    this.sfxVolume = 0.8;
    this.sfxCache = {};
    this.enabled = true;
    this._bgmPaused = false;
    this._currentSrc = null;
  }
  async init() {
    // 预创建 AudioContext（用户首次交互后才能播放）
  }

  setBGMVolume(v) {
    this.bgmVolume = v / 100;
    if (this.bgmAudio) this.bgmAudio.volume = this.bgmVolume;
  }

  setSFXVolume(v) {
    this.sfxVolume = v / 100;
  }

  playBGM(src) {
    if (!this.enabled) return;
    if (this._currentSrc === src && this.bgmAudio) return;
    this.stopBGM();
    if (!src) return;
    try {
      this.bgmAudio = new Audio(src);
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this.bgmVolume;
      this._currentSrc = src;
      this.bgmAudio.play().catch(() => {});
    } catch (e) {
      console.warn('BGM play failed:', e);
    }
  }

  stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio = null;
    }
    this._currentSrc = null;
  }

  pauseBGM() {
    if (this.bgmAudio && !this._bgmPaused) {
      this.bgmAudio.pause();
      this._bgmPaused = true;
    }
  }

  resumeBGM() {
    if (this.bgmAudio && this._bgmPaused) {
      this.bgmAudio.play().catch(() => {});
      this._bgmPaused = false;
    }
  }

  playSFX(name) {
    if (!this.enabled) return;
    // 内置音效使用 Web Audio API 生成（避免外部资源依赖）
    this._playBuiltinSFX(name);
  }

  _playBuiltinSFX(name) {
    try {
      const ctx = this._getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = this.sfxVolume * 0.3;

      const now = ctx.currentTime;
      switch (name) {
        case 'ui_click':
          osc.frequency.value = 800;
          osc.type = 'sine';
          gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now); osc.stop(now + 0.1);
          break;
        case 'puzzle_success':
          osc.frequency.setValueAtTime(523, now);
          osc.frequency.setValueAtTime(659, now + 0.1);
          osc.frequency.setValueAtTime(784, now + 0.2);
          osc.type = 'sine';
          gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.start(now); osc.stop(now + 0.4);
          break;
        case 'puzzle_fail':
          osc.frequency.value = 200;
          osc.type = 'sawtooth';
          gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.start(now); osc.stop(now + 0.3);
          break;
        case 'item_pickup':
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
          osc.type = 'sine';
          gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.start(now); osc.stop(now + 0.15);
          break;
        case 'badge_get':
          osc.frequency.setValueAtTime(523, now);
          osc.frequency.setValueAtTime(659, now + 0.15);
          osc.frequency.setValueAtTime(784, now + 0.3);
          osc.frequency.setValueAtTime(1047, now + 0.45);
          osc.type = 'triangle';
          gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
          osc.start(now); osc.stop(now + 0.7);
          break;
        case 'scene_transition':
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
          osc.type = 'sine';
          gain.gain.setValueAtTime(this.sfxVolume * 0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now); osc.stop(now + 0.25);
          break;
        case 'orderflow_low':
          osc.frequency.value = 120;
          osc.type = 'sine';
          gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.start(now); osc.stop(now + 0.5);
          break;
        default:
          osc.frequency.value = 600;
          osc.type = 'sine';
          gain.gain.setValueAtTime(this.sfxVolume * 0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now); osc.stop(now + 0.1);
      }
    } catch (e) {
      // 静默失败
    }
  }

  _getAudioContext() {
    if (!this._audioCtx) {
      try {
        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    if (this._audioCtx.state === 'suspended') {
      this._audioCtx.resume().catch(() => {});
    }
    return this._audioCtx;
  }
}
