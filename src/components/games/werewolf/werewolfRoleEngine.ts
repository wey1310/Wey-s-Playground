import { WerewolfRole, NPCVillager, WerewolfFaction } from './werewolfTypes';
import { DEFAULT_VILLAGE_NPCS, PERSONALITY_PROFILES } from './werewolfVillageData';

export interface RoleEngineOptions {
  preset?: 'standard' | 'balanced' | 'investigative' | 'custom';
  wolfCount?: number; // 2, 3, or 4
  allowedRoles?: {
    seer?: boolean;
    guard?: boolean;
    witch?: boolean;
    hunter?: boolean;
  };
}

/**
 * Generate an exact distribution array of 12 roles for the village
 */
export function generateRoleDistribution(options: RoleEngineOptions = {}): WerewolfRole[] {
  const preset = options.preset || 'standard';

  if (preset === 'standard') {
    // 3 Sói, 1 Tiên tri, 1 Bảo vệ, 1 Phù thủy, 1 Thợ săn, 5 Dân = 12
    return [
      'werewolf', 'werewolf', 'werewolf',
      'seer',
      'guard',
      'witch',
      'hunter',
      'villager', 'villager', 'villager', 'villager', 'villager'
    ];
  }

  if (preset === 'balanced') {
    // 2 Sói, 1 Tiên tri, 1 Bảo vệ, 1 Phù thủy, 1 Thợ săn, 6 Dân = 12
    return [
      'werewolf', 'werewolf',
      'seer',
      'guard',
      'witch',
      'hunter',
      'villager', 'villager', 'villager', 'villager', 'villager', 'villager'
    ];
  }

  if (preset === 'investigative') {
    // 3 Sói, 1 Tiên tri, 1 Bảo vệ, 7 Dân = 12
    return [
      'werewolf', 'werewolf', 'werewolf',
      'seer',
      'guard',
      'villager', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager'
    ];
  }

  // Custom configuration
  const wolfCount = Math.max(2, Math.min(4, options.wolfCount ?? 3));
  const roles: WerewolfRole[] = [];

  for (let i = 0; i < wolfCount; i++) {
    roles.push('werewolf');
  }

  // Seer is always essential for the village
  roles.push('seer');

  if (options.allowedRoles?.guard !== false && roles.length < 12) {
    roles.push('guard');
  }
  if (options.allowedRoles?.witch !== false && roles.length < 12) {
    roles.push('witch');
  }
  if (options.allowedRoles?.hunter !== false && roles.length < 12) {
    roles.push('hunter');
  }

  // Fill remaining slots with villagers up to exactly 12
  while (roles.length < 12) {
    roles.push('villager');
  }

  return roles.slice(0, 12);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Initialize 12 fresh NPC Villagers with randomized roles and intelligent initial state
 */
export function initializeVillageNPCs(options: RoleEngineOptions = {}): NPCVillager[] {
  const roles = shuffleArray(generateRoleDistribution(options));
  const templates = [...DEFAULT_VILLAGE_NPCS];

  // 1. Identify all werewolf IDs first so werewolves know their pack partners
  const wolfIds: string[] = [];
  templates.forEach((tmpl, idx) => {
    if (roles[idx] === 'werewolf') {
      wolfIds.push(tmpl.id);
    }
  });

  // 2. Build 12 NPC objects
  const npcs: NPCVillager[] = templates.map((tmpl, idx) => {
    const role = roles[idx];
    const faction: WerewolfFaction = role === 'werewolf' ? 'werewolf' : 'villager';
    const personality = tmpl.defaultPersonality;
    const personalityProfile = PERSONALITY_PROFILES[personality];

    // Build initial baseline suspicion matrix (random noise 0.15 - 0.35)
    const initialSuspicion: Record<string, number> = {};
    const initialRelationships: Record<string, number> = {};

    templates.forEach(other => {
      if (other.id !== tmpl.id) {
        // Default neutral-suspicious baseline
        initialSuspicion[other.id] = parseFloat((0.2 + (Math.random() * 0.15)).toFixed(2));
        initialRelationships[other.id] = parseFloat(((Math.random() * 0.4) - 0.2).toFixed(2));
      }
    });

    // Werewolves trust their fellow pack members completely
    if (role === 'werewolf') {
      wolfIds.forEach(wId => {
        if (wId !== tmpl.id) {
          initialSuspicion[wId] = 0.0;
          initialRelationships[wId] = 1.0;
        }
      });
    }

    return {
      id: tmpl.id,
      name: tmpl.name,
      avatar: tmpl.avatar,
      age: tmpl.age,
      job: tmpl.job,
      bio: tmpl.bio,
      personality,
      personalityProfile,
      faction,
      role,
      isAlive: true,
      isRevealed: false,
      suspicion: initialSuspicion,
      memory: [
        {
          night: 0,
          event: `Khởi đầu game: ${tmpl.name} sinh sống yên bình trong ngôi làng.`,
          type: 'observed'
        }
      ],
      relationships: initialRelationships,
      nightActionHistory: [],
      knownInformation: {
        investigatedNpcs: {},
        witchPotions: {
          healUsed: false,
          poisonUsed: false
        },
        wolfPartners: role === 'werewolf' ? wolfIds.filter(id => id !== tmpl.id) : []
      },
      behaviorState: {
        fearLevel: 0.1,
        alertness: personality === 'observant' || personality === 'suspicious' ? 0.8 : 0.5
      }
    };
  });

  return npcs;
}
