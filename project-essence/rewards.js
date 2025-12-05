const REWARD_BUNDLES = {
  RB_ACT1_NODE1_WIN: {
    currencies: {
      crownShards: 100,
      essenceTokens: 5,
    },
    arcaneKeys: 0,
    unlockCards: [],
    unlockCosmetics: [],
    xp: 25,
  },
  RB_ACT1_NODE2_WIN: {
    currencies: {
      crownShards: 140,
      essenceTokens: 8,
    },
    arcaneKeys: 0,
    unlockCards: ["EC-AV-101"],
    unlockCosmetics: [],
    xp: 40,
  },
  RB_ACT1_BOSS_WIN: {
    currencies: {
      crownShards: 300,
      essenceTokens: 10,
    },
    arcaneKeys: 1,
    unlockCards: ["DEITY_NYUMARA_ASCENDANT"],
    unlockCosmetics: ["frame_nyumara_gold", "title_first_sun_fang"],
    xp: 100,
  },
  RB_ACT2_NODE1_WIN: {
    currencies: {
      crownShards: 200,
      essenceTokens: 10,
    },
    arcaneKeys: 0,
    unlockCards: ["EC-AV-201"],
    unlockCosmetics: ["frame_crownline_bronze"],
    xp: 60,
  },
  RB_ACT2_NODE2_WIN: {
    currencies: {
      crownShards: 260,
      essenceTokens: 12,
    },
    arcaneKeys: 1,
    unlockCards: ["EC-TE-205"],
    unlockCosmetics: [],
    xp: 75,
  },
  RB_ACT2_BOSS_WIN: {
    currencies: {
      crownShards: 350,
      essenceTokens: 15,
    },
    arcaneKeys: 1,
    unlockCards: ["DEITY_TKAZUUN_TIMESHAPER"],
    unlockCosmetics: ["frame_tkazuuv_gold"],
    xp: 120,
  },
  RB_ACT3_NODE1_WIN: {
    currencies: {
      crownShards: 280,
      essenceTokens: 14,
    },
    arcaneKeys: 1,
    unlockCards: ["EC-AV-301"],
    unlockCosmetics: [],
    xp: 90,
  },
  RB_ACT3_BOSS_WIN: {
    currencies: {
      crownShards: 500,
      essenceTokens: 20,
    },
    arcaneKeys: 2,
    unlockCards: ["DEITY_ROOT_BREAKER"],
    unlockCosmetics: ["title_cycle_savior", "frame_root_diamond"],
    xp: 160,
  },
};

function getRewardBundle(id) {
  return REWARD_BUNDLES[id] || null;
}

const Rewards = { REWARD_BUNDLES, getRewardBundle };

export { Rewards };
