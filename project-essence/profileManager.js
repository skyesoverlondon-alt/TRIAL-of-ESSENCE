const PROFILE_STORAGE_KEY = "essenceCrownProfile_v1";

const DEFAULT_PROFILE = {
  playerId: null,
  displayName: "",
  avatarId: "estifarr",
  shardAlignment: {
    estifarr: 0,
    lokaya: 0,
    hahalakiel: 0,
    kaiwass: 0,
    halucard: 0,
  },
  unlockedDeities: [],
  unlockedCardIds: [],
  unlockedCosmetics: [],
  playerLevel: 1,
  xp: 0,
  currencies: {
    crownShards: 0,
    arcaneKeys: 0,
    essenceTokens: 0,
  },
  campaignProgress: {
    completedNodes: [],
    nodeStars: {},
    actUnlocked: 1,
  },
  deckSlots: [],
};

function cloneProfile(base) {
  return JSON.parse(JSON.stringify(base));
}

function generateId() {
  return "ec-" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizeProfile(parsed);
    }
  } catch (err) {
    console.warn("Failed to load profile; using default", err);
  }
  const profile = cloneProfile(DEFAULT_PROFILE);
  profile.playerId = generateId();
  saveProfile(profile);
  return profile;
}

function normalizeProfile(profile) {
  const merged = cloneProfile(DEFAULT_PROFILE);
  Object.assign(merged, profile || {});
  merged.playerId = merged.playerId || generateId();
  merged.shardAlignment = {
    ...DEFAULT_PROFILE.shardAlignment,
    ...(profile?.shardAlignment || {}),
  };
  merged.currencies = {
    ...DEFAULT_PROFILE.currencies,
    ...(profile?.currencies || {}),
  };
  merged.campaignProgress = {
    ...DEFAULT_PROFILE.campaignProgress,
    ...(profile?.campaignProgress || {}),
  };
  return merged;
}

function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn("Failed to save profile", err);
  }
}

function updateProfile(mutator) {
  const profile = loadProfile();
  const updated = typeof mutator === "function" ? mutator(cloneProfile(profile)) : { ...profile, ...(mutator || {}) };
  saveProfile(updated);
  return updated;
}

function addCurrencies(profile, rewards) {
  const result = cloneProfile(profile);
  if (rewards.crownShards) result.currencies.crownShards += rewards.crownShards;
  if (rewards.arcaneKeys) result.currencies.arcaneKeys += rewards.arcaneKeys;
  if (rewards.essenceTokens) result.currencies.essenceTokens += rewards.essenceTokens;
  return result;
}

function addUnlocks(profile, rewards) {
  const result = cloneProfile(profile);
  if (Array.isArray(rewards.unlockedDeities)) {
    result.unlockedDeities = Array.from(new Set([...result.unlockedDeities, ...rewards.unlockedDeities]));
  }
  if (Array.isArray(rewards.unlockedCardIds)) {
    result.unlockedCardIds = Array.from(new Set([...result.unlockedCardIds, ...rewards.unlockedCardIds]));
  }
  if (Array.isArray(rewards.unlockedCosmetics)) {
    result.unlockedCosmetics = Array.from(new Set([...result.unlockedCosmetics, ...rewards.unlockedCosmetics]));
  }
  return result;
}

function recordNodeCompletion(profile, nodeId, stars, rewards) {
  let working = cloneProfile(profile);
  if (!working.campaignProgress.completedNodes.includes(nodeId)) {
    working.campaignProgress.completedNodes.push(nodeId);
  }
  if (stars) {
    working.campaignProgress.nodeStars[nodeId] = { stars: Math.min(3, Math.max(1, stars)) };
  }
  working = addCurrencies(working, rewards || {});
  working = addUnlocks(working, rewards || {});
  return working;
}

const ProfileManager = {
  load: loadProfile,
  save: saveProfile,
  update: updateProfile,
  getProfile: loadProfile,
  reset() {
    const profile = cloneProfile(DEFAULT_PROFILE);
    profile.playerId = generateId();
    saveProfile(profile);
    return profile;
  },
  recordCompletion(nodeId, stars = 1, rewards = {}) {
    const profile = loadProfile();
    const updated = recordNodeCompletion(profile, nodeId, stars, rewards);
    saveProfile(updated);
    return updated;
  },
  applyRewards(rewards = {}) {
    const profile = loadProfile();
    const updated = addUnlocks(addCurrencies(profile, rewards), rewards);
    saveProfile(updated);
    return updated;
  },
};

export { ProfileManager, DEFAULT_PROFILE, PROFILE_STORAGE_KEY };
