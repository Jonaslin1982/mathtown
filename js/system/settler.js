/**
 * Settler - 结算器
 * 负责徽章评级判定、存档更新、解锁下一关
 */
class Settler {
  static evaluateBadge(meta, result) {
    if (!meta.badges) return null;
    for (const tier of ['royal', 'baron', 'knight']) {
      const t = meta.badges[tier];
      if (!t || !t.threshold) continue;
      if (result.elapsedSeconds <= t.threshold.max_time_seconds &&
          result.remainingOrderFlow >= t.threshold.min_remaining_order_flow) {
        return tier;
      }
    }
    return null;
  }

  static async processWin(game, levelId, result) {
    const { pack, level } = game.packLoader.getLevel(levelId);
    const meta = level.meta;
    const badgeTier = this.evaluateBadge(meta, result);
    const badgeInfo = badgeTier ? meta.badges[badgeTier] : null;

    const save = await game.storage.getSave();

    // 更新徽章
    if (!save.badges[levelId]) save.badges[levelId] = {};
    if (badgeTier) {
      const existing = save.badges[levelId][badgeTier];
      const isNew = !existing || !existing.obtained;
      save.badges[levelId][badgeTier] = {
        obtained: true,
        obtained_at: new Date().toISOString(),
        best_time: existing && existing.best_time ? Math.min(existing.best_time, result.elapsedSeconds) : result.elapsedSeconds
      };
      if (isNew) game.audio.playSFX('badge_get');
    }

    // 更新最佳记录
    if (!save.best_records[levelId]) save.best_records[levelId] = {};
    const rec = save.best_records[levelId];
    rec.best_time = rec.best_time ? Math.min(rec.best_time, result.elapsedSeconds) : result.elapsedSeconds;
    rec.best_order_flow = rec.best_order_flow ? Math.max(rec.best_order_flow, result.remainingOrderFlow) : result.remainingOrderFlow;

    // 解锁下一关
    const allLevels = game.packLoader.getAllLevels();
    const idx = allLevels.findIndex(l => l.level.compositeId === levelId);
    if (idx >= 0 && idx + 1 < allLevels.length) {
      const nextLevel = allLevels[idx + 1].level;
      const cond = nextLevel.meta.unlock_condition;
      if (cond && cond.type === 'complete_level' && cond.level === levelId) {
        if (!save.unlocked_levels.includes(nextLevel.compositeId)) {
          save.unlocked_levels.push(nextLevel.compositeId);
        }
      }
    }
    // 第一关默认解锁确保
    if (!save.unlocked_levels.includes('com.mathtown.primary_math:gauss_grocery')) {
      save.unlocked_levels.push('com.mathtown.primary_math:gauss_grocery');
    }

    await game.storage.putSave(save);
    return { badgeTier, badgeInfo, level };
  }
}
