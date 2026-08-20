import {
  NPCVillager,
  NightAction,
  NightResolution,
} from './werewolfTypes';

/**
 * Helper to get all alive NPCs
 */
export function getAliveNPCs(npcs: NPCVillager[]): NPCVillager[] {
  return npcs.filter(npc => npc.isAlive);
}

/**
 * Intelligent Wolf Pack Decision Engine
 * Wolves coordinate their attack target collectively without cheating.
 */
function decideWolfPackTarget(wolves: NPCVillager[], allNpcs: NPCVillager[], currentNight: number): { targetId: string; targetName: string; reason: string } {
  const aliveNpcs = getAliveNPCs(allNpcs);
  const wolfIds = new Set(wolves.map(w => w.id));
  const validTargets = aliveNpcs.filter(npc => !wolfIds.has(npc.id));

  if (validTargets.length === 0) {
    return { targetId: '', targetName: '', reason: 'Không còn mục tiêu hợp lệ' };
  }

  // Score each candidate target
  const scoredTargets = validTargets.map(candidate => {
    let score = 50; // base score

    // 1. If this NPC was previously revealed to be Seer or Guard, high priority threat
    if (candidate.isRevealed) {
      if (candidate.role === 'seer') score += 45;
      if (candidate.role === 'guard') score += 35;
      if (candidate.role === 'witch') score += 30;
      if (candidate.role === 'hunter') score -= 15; // Hunter is risky because of death retaliation!
    }

    // 2. Aggregate suspicion among wolves toward this candidate
    let wolfSuspicionSum = 0;
    wolves.forEach(w => {
      wolfSuspicionSum += (w.suspicion[candidate.id] || 0.3);
    });
    score += (wolfSuspicionSum / wolves.length) * 30;

    // 3. Deduction if candidate was recently guarded or likely guarded
    if (candidate.knownInformation.lastGuardedId === candidate.id) {
      score -= 25; // might be guarded again or bait
    }

    // 4. Personality modifiers of dominant wolves
    wolves.forEach(w => {
      if (w.personality === 'aggressive') {
        // Prefer targets that seem outspoken / influential
        score += candidate.age > 40 ? 10 : 5;
      } else if (w.personality === 'cautious') {
        // Cautious wolves avoid risky targets
        if (candidate.job.includes('Thợ Săn') || candidate.job.includes('Rèn')) score -= 10;
      } else if (w.personality === 'logical') {
        // Prefer targets with high memory retention
        if (candidate.personality === 'observant' || candidate.personality === 'logical') score += 15;
      }
    });

    // 5. Add small stochastic noise (0 to 10) to avoid robotic determinism
    score += Math.random() * 10;

    return {
      candidate,
      score
    };
  });

  scoredTargets.sort((a, b) => b.score - a.score);
  const best = scoredTargets[0].candidate;

  return {
    targetId: best.id,
    targetName: best.name,
    reason: `Bầy Sói thống nhất nhắm vào ${best.name} (${best.job}) vì mối đe dọa cao đối với bầy đàn.`
  };
}

/**
 * Seer Decision Engine:
 * Chooses an alive NPC that has not been investigated yet, prioritizing highest suspicion.
 */
function decideSeerTarget(seer: NPCVillager, allNpcs: NPCVillager[]): { targetId: string; targetName: string; reason: string } | null {
  const aliveNpcs = getAliveNPCs(allNpcs);
  const uninvestigated = aliveNpcs.filter(npc => npc.id !== seer.id && !seer.knownInformation.investigatedNpcs[npc.id]);

  if (uninvestigated.length === 0) {
    // If all investigated, check the most suspicious one again or anyone alive
    const candidates = aliveNpcs.filter(npc => npc.id !== seer.id);
    if (candidates.length === 0) return null;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    return {
      targetId: target.id,
      targetName: target.name,
      reason: `Tiên tri ${seer.name} soi rọi lại nhân dạng của ${target.name}.`
    };
  }

  // Sort by Seer's suspicion
  uninvestigated.sort((a, b) => (seer.suspicion[b.id] || 0) - (seer.suspicion[a.id] || 0));
  const target = uninvestigated[0];

  return {
    targetId: target.id,
    targetName: target.name,
    reason: `Tiên tri ${seer.name} dùng quả cầu pha lê soi chiếu bóng đêm của ${target.name} do hoài nghi cao độ.`
  };
}

/**
 * Guard Decision Engine:
 * Chooses an alive NPC to protect, cannot protect the same NPC two nights in a row.
 */
function decideGuardTarget(guard: NPCVillager, allNpcs: NPCVillager[], currentNight: number): { targetId: string; targetName: string; reason: string } | null {
  const aliveNpcs = getAliveNPCs(allNpcs);
  const lastGuardedId = guard.knownInformation.lastGuardedId;

  // Filter out the last guarded NPC if there are other candidates
  let validCandidates = aliveNpcs.filter(npc => npc.id !== lastGuardedId);
  if (validCandidates.length === 0) {
    validCandidates = aliveNpcs;
  }

  // Priority scoring:
  // - Protect revealed Good roles (Seer, Witch)
  // - Self-protection if fear is high and allowed
  // - High-trust allies (relationship > 0.3)
  const scored = validCandidates.map(c => {
    let score = 30;

    if (c.isRevealed && c.role !== 'werewolf') {
      score += 50; // Protect verified village roles!
    }

    if (c.id === guard.id) {
      score += guard.personality === 'cautious' ? 25 : 10;
    }

    const rel = guard.relationships[c.id] || 0;
    score += rel * 20;

    const susp = guard.suspicion[c.id] || 0.3;
    score -= susp * 30; // Guard avoids protecting people they deeply suspect

    score += Math.random() * 8;
    return { candidate: c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const chosen = scored[0].candidate;

  return {
    targetId: chosen.id,
    targetName: chosen.name,
    reason: `Bảo vệ ${guard.name} lập khiên phong ấn canh gác cửa nhà ${chosen.name}.`
  };
}

/**
 * Witch Decision Engine:
 * Decides whether to use Heal potion (on wolf victim) or Poison potion (on a high suspicion target).
 */
function decideWitchAction(
  witch: NPCVillager,
  allNpcs: NPCVillager[],
  wolfTargetId: string,
  currentNight: number
): { healTargetId?: string; poisonTargetId?: string; healReason?: string; poisonReason?: string } {
  const result: { healTargetId?: string; poisonTargetId?: string; healReason?: string; poisonReason?: string } = {};
  const { healUsed, poisonUsed } = witch.knownInformation.witchPotions;
  const aliveNpcs = getAliveNPCs(allNpcs);

  // 1. Heal decision
  if (!healUsed && wolfTargetId) {
    const victim = allNpcs.find(n => n.id === wolfTargetId);
    if (victim) {
      // If victim is self -> always save!
      if (victim.id === witch.id) {
        result.healTargetId = victim.id;
        result.healReason = `Phù thủy ${witch.name} tự dùng bình thần dược để hồi sinh chính mình!`;
      } else {
        const susp = witch.suspicion[victim.id] || 0.3;
        // If victim is not suspicious (susp < 0.6) or revealed villager, save them!
        if (susp < 0.65 || (victim.isRevealed && victim.role !== 'werewolf')) {
          result.healTargetId = victim.id;
          result.healReason = `Phù thủy ${witch.name} cảm nhận được linh hồn vô tội của ${victim.name} và đã dùng bình cứu hộ mệnh.`;
        }
      }
    }
  }

  // 2. Poison decision (Cautious: only use if very high suspicion on night >= 2)
  if (!poisonUsed && currentNight >= 2 && !result.healTargetId) {
    const candidates = aliveNpcs.filter(npc => npc.id !== witch.id && npc.id !== wolfTargetId);
    if (candidates.length > 0) {
      // Find candidate with suspicion > 0.75
      const highestSuspicious = candidates
        .map(c => ({ candidate: c, susp: witch.suspicion[c.id] || 0.3 }))
        .sort((a, b) => b.susp - a.susp)[0];

      if (highestSuspicious && highestSuspicious.susp >= 0.78) {
        result.poisonTargetId = highestSuspicious.candidate.id;
        result.poisonReason = `Phù thủy ${witch.name} nhận thấy ${highestSuspicious.candidate.name} có dấu hiệu ma thuật hắc ám và đã bỏ bình độc!`;
      }
    }
  }

  return result;
}

/**
 * Hunter Retaliation Decision Engine:
 * When hunter dies, shoots the most suspicious alive target.
 */
function decideHunterShot(hunter: NPCVillager, allNpcs: NPCVillager[]): { targetId: string; targetName: string; reason: string } | null {
  const aliveNpcs = getAliveNPCs(allNpcs).filter(npc => npc.id !== hunter.id);
  if (aliveNpcs.length === 0) return null;

  aliveNpcs.sort((a, b) => (hunter.suspicion[b.id] || 0) - (hunter.suspicion[a.id] || 0));
  const target = aliveNpcs[0];

  return {
    targetId: target.id,
    targetName: target.name,
    reason: `Thợ săn ${hunter.name} trước khi gục ngã đã giương cây nỏ bạc bắn phát tiễn định mệnh vào ${target.name}!`
  };
}

/**
 * Master Night Simulation Engine:
 * Executes the complete hidden night actions cycle and calculates resolution.
 */
export function executeNightSimulation(allNpcs: NPCVillager[], currentNight: number): {
  updatedNpcs: NPCVillager[];
  resolution: NightResolution;
} {
  let npcs = JSON.parse(JSON.stringify(allNpcs)) as NPCVillager[];
  const actions: NightAction[] = [];
  const casualties: string[] = [];
  const savedIds: string[] = [];
  const poisonedIds: string[] = [];
  let hunterKilledId: string | undefined = undefined;
  const clues: string[] = [];
  const publicSummary: string[] = [];

  const aliveNpcs = getAliveNPCs(npcs);

  // 1. Guard Action (Priority 1)
  const guard = aliveNpcs.find(npc => npc.role === 'guard');
  let guardedTargetId: string | undefined = undefined;
  if (guard) {
    const guardDecision = decideGuardTarget(guard, npcs, currentNight);
    if (guardDecision) {
      guardedTargetId = guardDecision.targetId;
      actions.push({
        actorId: guard.id,
        actorName: guard.name,
        role: 'guard',
        actionType: 'guard_protect',
        targetId: guardDecision.targetId,
        targetName: guardDecision.targetName,
        priority: 1,
        reason: guardDecision.reason
      });

      // Update guard internal memory
      const guardNpc = npcs.find(n => n.id === guard.id);
      if (guardNpc) {
        guardNpc.knownInformation.lastGuardedId = guardedTargetId;
        guardNpc.nightActionHistory.push({
          night: currentNight,
          actionType: 'guard_protect',
          targetId: guardDecision.targetId,
          targetName: guardDecision.targetName,
          outcome: 'Đã bảo vệ'
        });
      }
    }
  }

  // 2. Seer Action (Priority 2)
  const seer = aliveNpcs.find(npc => npc.role === 'seer');
  let seerResultObj: { seerId: string; targetId: string; targetName: string; isWerewolf: boolean } | undefined = undefined;
  if (seer) {
    const seerDecision = decideSeerTarget(seer, npcs);
    if (seerDecision) {
      const targetNpc = npcs.find(n => n.id === seerDecision.targetId);
      const isWerewolf = targetNpc?.role === 'werewolf';

      actions.push({
        actorId: seer.id,
        actorName: seer.name,
        role: 'seer',
        actionType: 'seer_check',
        targetId: seerDecision.targetId,
        targetName: seerDecision.targetName,
        priority: 2,
        reason: `${seerDecision.reason} (Kết quả: ${isWerewolf ? 'SÓI 🐺' : 'DÂN LÀNG 🌿'})`
      });

      // Update Seer private knowledge & suspicion
      const seerNpc = npcs.find(n => n.id === seer.id);
      if (seerNpc && targetNpc) {
        seerNpc.knownInformation.investigatedNpcs[targetNpc.id] = isWerewolf ? 'werewolf' : 'villager';
        seerNpc.suspicion[targetNpc.id] = isWerewolf ? 1.0 : 0.05;
        seerNpc.relationships[targetNpc.id] = isWerewolf ? -1.0 : 0.8;
        seerNpc.nightActionHistory.push({
          night: currentNight,
          actionType: 'seer_check',
          targetId: targetNpc.id,
          targetName: targetNpc.name,
          outcome: isWerewolf ? 'Phát hiện Ma Sói' : 'Xác nhận Dân Làng vô tội'
        });
      }

      seerResultObj = {
        seerId: seer.id,
        targetId: seerDecision.targetId,
        targetName: seerDecision.targetName,
        isWerewolf
      };
    }
  }

  // 3. Werewolves Collective Attack (Priority 3)
  const wolves = aliveNpcs.filter(npc => npc.role === 'werewolf');
  let wolfVictimId: string = '';
  if (wolves.length > 0) {
    const wolfDecision = decideWolfPackTarget(wolves, npcs, currentNight);
    wolfVictimId = wolfDecision.targetId;

    if (wolfVictimId) {
      actions.push({
        actorId: wolves[0].id,
        actorName: 'Bầy Ma Sói',
        role: 'werewolf',
        actionType: 'wolf_kill',
        targetId: wolfDecision.targetId,
        targetName: wolfDecision.targetName,
        priority: 3,
        reason: wolfDecision.reason
      });

      wolves.forEach(w => {
        const wNpc = npcs.find(n => n.id === w.id);
        if (wNpc) {
          wNpc.nightActionHistory.push({
            night: currentNight,
            actionType: 'wolf_kill',
            targetId: wolfDecision.targetId,
            targetName: wolfDecision.targetName,
            outcome: 'Đã tấn công'
          });
        }
      });
    }
  }

  // 4. Witch Actions (Priority 4)
  const witch = aliveNpcs.find(npc => npc.role === 'witch');
  let witchHealedId: string | undefined = undefined;
  let witchPoisonedId: string | undefined = undefined;
  if (witch) {
    const witchDecisions = decideWitchAction(witch, npcs, wolfVictimId, currentNight);

    if (witchDecisions.healTargetId) {
      witchHealedId = witchDecisions.healTargetId;
      actions.push({
        actorId: witch.id,
        actorName: witch.name,
        role: 'witch',
        actionType: 'witch_save',
        targetId: witchHealedId,
        targetName: npcs.find(n => n.id === witchHealedId)?.name,
        priority: 4,
        reason: witchDecisions.healReason
      });

      const witchNpc = npcs.find(n => n.id === witch.id);
      if (witchNpc) {
        witchNpc.knownInformation.witchPotions.healUsed = true;
      }
    }

    if (witchDecisions.poisonTargetId) {
      witchPoisonedId = witchDecisions.poisonTargetId;
      actions.push({
        actorId: witch.id,
        actorName: witch.name,
        role: 'witch',
        actionType: 'witch_poison',
        targetId: witchPoisonedId,
        targetName: npcs.find(n => n.id === witchPoisonedId)?.name,
        priority: 4,
        reason: witchDecisions.poisonReason
      });

      const witchNpc = npcs.find(n => n.id === witch.id);
      if (witchNpc) {
        witchNpc.knownInformation.witchPotions.poisonUsed = true;
      }
    }
  }

  // 5. Resolution & Casualties Calculation
  if (wolfVictimId) {
    const isProtectedByGuard = guardedTargetId === wolfVictimId;
    const isSavedByWitch = witchHealedId === wolfVictimId;

    if (isProtectedByGuard || isSavedByWitch) {
      savedIds.push(wolfVictimId);
      clues.push(`Đêm qua, bóng đen hung tàn đã áp sát một ngôi nhà, nhưng một nguồn sức mạnh hộ mệnh kỳ bí đã kịp thời che chở.`);
    } else {
      casualties.push(wolfVictimId);
    }
  }

  if (witchPoisonedId && !casualties.includes(witchPoisonedId)) {
    poisonedIds.push(witchPoisonedId);
    casualties.push(witchPoisonedId);
    clues.push(`Một làn sương độc thảo mộc nồng nặc thoang thoảng trong không khí ban đêm.`);
  }

  // 6. Check Hunter Retaliation (Priority 5)
  const hunterCasualty = casualties.find(cId => {
    const victim = npcs.find(n => n.id === cId);
    return victim?.role === 'hunter';
  });

  if (hunterCasualty) {
    const hunterNpc = npcs.find(n => n.id === hunterCasualty);
    if (hunterNpc) {
      const shot = decideHunterShot(hunterNpc, npcs.filter(n => !casualties.includes(n.id)));
      if (shot) {
        hunterKilledId = shot.targetId;
        casualties.push(shot.targetId);
        actions.push({
          actorId: hunterNpc.id,
          actorName: hunterNpc.name,
          role: 'hunter',
          actionType: 'hunter_retaliate',
          targetId: shot.targetId,
          targetName: shot.targetName,
          priority: 5,
          reason: shot.reason
        });
        clues.push(`Tiếng nỏ bạc xé toạc màn đêm kèm theo một tiếng thét thất thanh.`);
      }
    }
  }

  // 7. Apply Deaths to NPC States
  npcs = npcs.map(npc => {
    if (casualties.includes(npc.id)) {
      return {
        ...npc,
        isAlive: false,
        memory: [
          ...npc.memory,
          {
            night: currentNight,
            event: `Đêm ${currentNight}: Bị loại khỏi ngôi làng bí ẩn.`,
            type: 'attacked'
          }
        ]
      };
    }

    if (savedIds.includes(npc.id)) {
      return {
        ...npc,
        memory: [
          ...npc.memory,
          {
            night: currentNight,
            event: `Đêm ${currentNight}: Đã thoát khỏi nguy hiểm nhờ bùa hộ mệnh.`,
            type: 'saved'
          }
        ]
      };
    }

    return npc;
  });

  // 8. Generate Public Dawn Summaries
  if (casualties.length === 0) {
    publicSummary.push('Bình minh ló rạng trong yên bình, đêm qua không có ai biến mất khỏi ngôi làng!');
    clues.push('Dân làng thở phào khi mọi cánh cửa nhà sáng đèn đầy đủ vào buổi sớm.');
  } else {
    casualties.forEach(cId => {
      const deadNpc = npcs.find(n => n.id === cId);
      if (deadNpc) {
        publicSummary.push(`Đêm qua, ${deadNpc.name} (${deadNpc.job}) đã biến mất trong màn đêm bí ẩn... ☠️`);
      }
    });
  }

  // 9. Update Living NPCs' suspicion matrices & memories based on public events
  const deadNpcNames = casualties.map(cId => npcs.find(n => n.id === cId)?.name).filter(Boolean);
  npcs = npcs.map(npc => {
    if (!npc.isAlive) return npc;

    const updatedSusp = { ...npc.suspicion };
    // Alive NPCs raise suspicion on neighbours or unrevealed characters
    npcs.forEach(other => {
      if (other.id !== npc.id && other.isAlive) {
        // Increase suspicion slightly if they are still alive while others died
        const delta = (Math.random() * 0.1) - 0.03;
        updatedSusp[other.id] = Math.max(0.05, Math.min(0.98, (updatedSusp[other.id] || 0.3) + delta));
      }
    });

    const newMemory = [...npc.memory];
    if (deadNpcNames.length > 0) {
      newMemory.push({
        night: currentNight,
        event: `Đêm ${currentNight}: Nghe tin ${deadNpcNames.join(', ')} đã tử nạn. Nỗi sợ hãi trong làng tăng cao.`,
        type: 'observed'
      });
    }

    return {
      ...npc,
      suspicion: updatedSusp,
      memory: newMemory,
      behaviorState: {
        ...npc.behaviorState,
        fearLevel: Math.min(1.0, npc.behaviorState.fearLevel + (casualties.length * 0.2))
      }
    };
  });

  const resolution: NightResolution = {
    night: currentNight,
    casualties,
    savedIds,
    poisonedIds,
    hunterKilledId,
    seerInvestigation: seerResultObj,
    actionsTaken: actions,
    clues: clues.slice(0, 3),
    publicSummary
  };

  return {
    updatedNpcs: npcs,
    resolution
  };
}
