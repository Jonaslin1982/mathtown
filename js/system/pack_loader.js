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
    const builtinPacks = ['pack_primary_math', 'pack_war_calculus'];
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
    // 只返回同一关卡包内的下一关
    const level = this.getLevel(compositeId);
    if (!level) return null;
    for (const pack of this.packs) {
      const idx = pack.levels.findIndex(l => l.compositeId === compositeId);
      if (idx >= 0 && idx < pack.levels.length - 1) {
        return pack.levels[idx + 1];
      }
    }
    return null;
  }

  isFirstLevel(compositeId) {
    // 判断是否是所在关卡包的第一关（第一关默认解锁，无需前置）
    for (const pack of this.packs) {
      if (pack.levels.length > 0 && pack.levels[0].compositeId === compositeId) {
        return true;
      }
    }
    return false;
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
