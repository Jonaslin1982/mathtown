/**
 * PackLoader - 关卡包加载器（视觉小说模式）
 */
class PackLoader {
  constructor() {
    this.basePath = 'levels_packs';
    this.packs = [];
  }

  async loadAll() {
    this.packs = [];
    const builtinPacks = ['pack_primary_math'];
    for (const packDir of builtinPacks) {
      try {
        const pack = await this._loadPack(packDir);
        if (pack) this.packs.push(pack);
      } catch (e) {
        console.error('Failed to load pack:', packDir, e);
      }
    }
    return this.packs;
  }

  async _loadPack(packDir) {
    const packPath = this.basePath + '/' + packDir;
    const meta = await this._fetchJSON(packPath + '/pack_meta.json');
    if (!meta) return null;
    const levels = [];
    for (const levelInfo of meta.levels) {
      try {
        const levelPath = packPath + '/' + levelInfo.folder;
        const levelMeta = await this._fetchJSON(levelPath + '/meta.json');
        if (levelMeta) {
          levels.push({
            level_id: levelInfo.level_id,
            folder: levelInfo.folder,
            meta: levelMeta,
            path: levelPath,
            compositeId: meta.pack_id + ':' + levelInfo.level_id
          });
        }
      } catch (e) {
        console.error('Failed to load level:', levelInfo.level_id, e);
      }
    }
    return { ...meta, path: packPath, levels };
  }

  getLevel(compositeId) {
    for (const pack of this.packs) {
      for (const level of pack.levels) {
        if (level.compositeId === compositeId) return level;
      }
    }
    return null;
  }

  getAllLevels() {
    const result = [];
    for (const pack of this.packs) {
      for (const level of pack.levels) {
        result.push({ level });
      }
    }
    return result;
  }

  getNextLevel(compositeId) {
    const all = this.getAllLevels();
    for (let i = 0; i < all.length; i++) {
      if (all[i].level.compositeId === compositeId && i < all.length - 1) {
        return all[i + 1].level;
      }
    }
    return null;
  }

  async _fetchJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }
}
