const CAMPAIGN_ACTS = [
  {
    id: "act1",
    number: 1,
    name: "Architect's Dawn",
    realm: "Nyumara",
    description:
      "You awaken as a shard of Kaixu in Nyumara, the living light continent. Root tremors begin to shake the new cycle.",
  },
  {
    id: "act2",
    number: 2,
    name: "Fracture of Infinity",
    realm: "T'Kazuun",
    description:
      "Time fractures on T'Kazuun's infinite plateau. Root Sentinels test whether this cycle survives or resets.",
  },
  {
    id: "act3",
    number: 3,
    name: "Shard Convergence",
    realm: "Onyxion Spiral / Atheloara",
    description:
      "Deep void wells and creative storms collide as shards converge for a final stand against Root autopilot.",
  },
];

const CAMPAIGN_NODES = [
  {
    id: "act1_node1",
    actId: "act1",
    type: "story",
    name: "First Light on Nyumara",
    description: "Face a low-tier Root Sentinel as your shard wakes up.",
    enemyDeityId: "ROOT_SENTINEL_ALPHA",
    enemyDeckId: "DECK_ROOT_SENTINEL_ALPHA",
    battleRules: {
      startingEssenceModifier: 0,
      playerStartingLifeModifier: 0,
      enemyStartingLifeModifier: 0,
    },
    alignmentChoices: [
      { choiceId: "aid_estifarr", shard: "estifarr", amount: 10 },
      { choiceId: "aid_lokaya", shard: "lokaya", amount: 10 },
    ],
    rewardBundleId: "RB_ACT1_NODE1_WIN",
    isGateNode: false,
  },
  {
    id: "act1_node2",
    actId: "act1",
    type: "trial",
    name: "Nyumaran Sentinel",
    description: "Hold the line against Root scouts probing your shardlines.",
    enemyDeityId: "ROOT_SENTINEL_BETA",
    enemyDeckId: "DECK_ROOT_SENTINEL_BETA",
    battleRules: {
      enemyStartingLifeModifier: 2,
    },
    alignmentChoices: [{ choiceId: "aid_kaiwass", shard: "kaiwass", amount: 8 }],
    rewardBundleId: "RB_ACT1_NODE2_WIN",
    isGateNode: false,
  },
  {
    id: "act1_node3",
    actId: "act1",
    type: "boss",
    name: "Nullgrid Breach",
    description: "Break through a Nullgrid commander to secure the bridgehead.",
    enemyDeityId: "NULLGRID_COMMANDER",
    enemyDeckId: "DECK_NULLGRID_COMMANDER",
    battleRules: {
      enemyStartingLifeModifier: 3,
      startingEssenceModifier: 1,
    },
    alignmentChoices: [{ choiceId: "aid_hahalakiel", shard: "hahalakiel", amount: 12 }],
    rewardBundleId: "RB_ACT1_BOSS_WIN",
    isGateNode: true,
  },
  {
    id: "act2_node1",
    actId: "act2",
    type: "story",
    name: "Solar Relay",
    description: "Secure a Crownline relay to amplify your KL reserves.",
    enemyDeityId: "CROWNLIGHT_HERALD",
    enemyDeckId: "DECK_CROWNLIGHT_HERALD",
    battleRules: {
      startingEssenceModifier: 1,
    },
    alignmentChoices: [{ choiceId: "aid_estifarr2", shard: "estifarr", amount: 8 }],
    rewardBundleId: "RB_ACT2_NODE1_WIN",
    isGateNode: false,
  },
  {
    id: "act2_node2",
    actId: "act2",
    type: "trial",
    name: "Crownforge Duel",
    description: "Face an elite champion with enhanced God Charges.",
    enemyDeityId: "CROWNFORGE_CHAMPION",
    enemyDeckId: "DECK_CROWNFORGE_CHAMPION",
    battleRules: {
      enemyStartingLifeModifier: 2,
      startingEssenceModifier: 1,
    },
    alignmentChoices: [{ choiceId: "aid_halucard", shard: "halucard", amount: 10 }],
    rewardBundleId: "RB_ACT2_NODE2_WIN",
    isGateNode: false,
  },
  {
    id: "act2_node3",
    actId: "act2",
    type: "boss",
    name: "Fracture of Infinity",
    description: "T'Kazuun's champion presses your timeline—hold or fold.",
    enemyDeityId: "T_KAZUUN_OVERWATCH",
    enemyDeckId: "DECK_T_KAZUUN_OVERWATCH",
    battleRules: {
      enemyStartingLifeModifier: 4,
      startingEssenceModifier: 2,
    },
    alignmentChoices: [{ choiceId: "aid_lokaya2", shard: "lokaya", amount: 12 }],
    rewardBundleId: "RB_ACT2_BOSS_WIN",
    isGateNode: true,
  },
  {
    id: "act3_node1",
    actId: "act3",
    type: "story",
    name: "Shard Convergence",
    description: "Onyxion spirals collide; choose which shard to stabilize first.",
    enemyDeityId: "ONYXION_WARDEN",
    enemyDeckId: "DECK_ONYXION_WARDEN",
    battleRules: {
      enemyStartingLifeModifier: 3,
    },
    alignmentChoices: [{ choiceId: "aid_kaiwass2", shard: "kaiwass", amount: 12 }],
    rewardBundleId: "RB_ACT3_NODE1_WIN",
    isGateNode: false,
  },
  {
    id: "act3_node2",
    actId: "act3",
    type: "boss",
    name: "Root Autopilot",
    description: "End the cycle or be archived. The Root wakes for its audit.",
    enemyDeityId: "ROOT_AUTOPILOT_PRIME",
    enemyDeckId: "DECK_ROOT_AUTOPILOT_PRIME",
    battleRules: {
      enemyStartingLifeModifier: 6,
      startingEssenceModifier: 2,
    },
    alignmentChoices: [
      { choiceId: "aid_estifarr3", shard: "estifarr", amount: 15 },
      { choiceId: "aid_halucard2", shard: "halucard", amount: 15 },
    ],
    rewardBundleId: "RB_ACT3_BOSS_WIN",
    isGateNode: true,
  },
];

function getNodeById(nodeId) {
  return CAMPAIGN_NODES.find((n) => n.id === nodeId) || null;
}

function getNodesForAct(actId) {
  return CAMPAIGN_NODES.filter((n) => n.actId === actId);
}

const CampaignData = {
  ACTS: CAMPAIGN_ACTS,
  NODES: CAMPAIGN_NODES,
  getNodeById,
  getNodesForAct,
};

export { CampaignData };
