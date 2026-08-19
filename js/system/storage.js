/**
 * Storage - IndexedDB 存档系统
 * 严格对齐《麦斯镇 v2.0 开发就绪设计文档》第 6 章存档系统
 */
class StorageManager {
  constructor() {
    this.dbName = 'mathtown_save';
    this.dbVersion = 2;
    this.db = null;
    this.memoryFallback = {};
    this.useMemory = false;
  }

  async init() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        this.useMemory = true;
        console.warn('[Storage] IndexedDB unavailable, using memory fallback');
        resolve();
        return;
      }
      const req = indexedDB.open(this.dbName, this.dbVersion);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('save')) {
          db.createObjectStore('save', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      req.onerror = () => {
        this.useMemory = true;
        console.warn('[Storage] IndexedDB open failed, using memory fallback');
        resolve();
      };
    });
  }

  async getSave() {
    if (this.useMemory) {
      return this.memoryFallback.save || this._defaultSave();
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('save', 'readonly');
      const store = tx.objectStore('save');
      const req = store.get('main');
      req.onsuccess = () => resolve(req.result || this._defaultSave());
      req.onerror = () => reject(req.error);
    });
  }

  async putSave(save) {
    save.id = 'main';
    if (this.useMemory) {
      this.memoryFallback.save = save;
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('save', 'readwrite');
      const store = tx.objectStore('save');
      const req = store.put(save);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearSave() {
    if (this.useMemory) {
      this.memoryFallback.save = this._defaultSave();
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('save', 'readwrite');
      const store = tx.objectStore('save');
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  _defaultSave() {
    return {
      id: 'main',
      save_version: 3,
      settings: {
        bgm_volume: 60,
        sfx_volume: 80
      },
      unlocked_levels: ['com.mathtown.primary_math:gauss_grocery'],
      completed_levels: {},
      best_times: {},
      handbook_notes: {}
    };
  }

  exportSave() {
    return this.getSave().then(save => {
      const data = JSON.stringify(save, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mathtown_save_' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.save_version) throw new Error('Invalid save file');
          this.putSave(data).then(resolve).catch(reject);
        } catch (err) {
          reject(new Error('存档文件损坏: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }
}
