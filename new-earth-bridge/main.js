import { ProfileManager } from "../project-essence/profileManager.js";

const MAX_KL = 31;
const GOD_THRESHOLD = 13;
const MAX_GOD_CHARGES = 3;

const CAMPAIGN_ACTS = [
  {
    id: 1,
    title: "Act I – Kaixu-Prime Skirmishes",
    summary: "Scout the shardlines and secure the bridgeheads.",
    nodes: [
      {
        id: "act1-node1",
        title: "Shard Scouting",
        desc: "Open with basic shard deployment to stabilize the lane.",
        rewards: { crownShards: 40, essenceTokens: 10 },
        stars: 1,
      },
      {
        id: "act1-node2",
        title: "Bridgehold Clash",
        desc: "Hold against a counterattack and push back.",
        rewards: { crownShards: 60, arcaneKeys: 1 },
        stars: 2,
      },
      {
        id: "act1-node3",
        title: "Nullgrid Breach",
        desc: "Break through Nullgrid resistance with a decisive strike.",
        rewards: { crownShards: 80, unlockedDeities: ["DEITY_Nullgrid"] },
        stars: 3,
      },
    ],
  },
  {
    id: 2,
    title: "Act II – Crownline Offensive",
    summary: "Capture relay points and claim Kaixu-Prime’s mythic relics.",
    nodes: [
      {
        id: "act2-node1",
        title: "Solar Relay",
        desc: "Empower your KL network while denying the foe.",
        rewards: { crownShards: 120, essenceTokens: 20 },
        stars: 1,
      },
      {
        id: "act2-node2",
        title: "Crownforge Duel",
        desc: "Face an elite champion with enhanced God Charges.",
        rewards: { crownShards: 150, arcaneKeys: 2, unlockedCardIds: ["EC-AV-201"] },
        stars: 2,
      },
    ],
  },
];

const PHASES = ["Ready", "Draw", "KL Recalc", "Main", "Combat", "End"];

const ui = {
  loading: document.getElementById("loading-screen"),
  board: document.getElementById("board-screen"),
  start: document.getElementById("start-button"),
};

let isTutorialMode = false;
let tutorialStepIndex = 0;

const tutorialScript = [
  {
    id: "intro",
    trigger: "onTutorialStart",
    message:
      "Welcome to Essence Crown: Shard Wars. This tutorial will walk you through your first few turns.",
  },
  {
    id: "zones",
    trigger: "onBoardReady",
    message:
      "At the top is your Deity. In front are your Shard lanes. Your hand sits at the bottom. The deck is to the side.",
  },
  {
    id: "turn1_draw",
    trigger: "onTurnStart",
    turn: 1,
    player: "you",
    message:
      "Turn 1: The game draws a card for you. Look at your Shards. Play a Shard into a lane to begin generating Essence.",
  },
  {
    id: "turn1_play_shard",
    trigger: "onCardPlayed",
    condition: "shardFirst",
    message:
      "Great. Shards are like your energy sources. On future turns, they’ll fuel your Avatars and Techniques.",
  },
  {
    id: "turn2_start",
    trigger: "onTurnStart",
    turn: 2,
    player: "you",
    message:
      "Turn 2: Draw again. Now you should have enough Essence to play an Avatar. Play one into a Shard lane.",
  },
  {
    id: "turn2_attack",
    trigger: "onCombatAvailable",
    message:
      "Once your Avatar is in play and can attack, choose a lane and attack. Damage goes through that lane to enemy Avatars or their Deity.",
  },
  {
    id: "turn3_start",
    trigger: "onTurnStart",
    turn: 3,
    player: "you",
    message:
      "Turn 3: You know the basics. Play another card or use a Technique, then attack again. After this turn, the tutorial will end and the game continues normally.",
  },
  {
    id: "outro",
    trigger: "onAfterTurn",
    turn: 3,
    player: "you",
    message:
      "You’ve completed the guided tutorial. You can keep playing this game out, or start a normal match from the main screen when you’re ready.",
  },
];

function cacheAppNode() {
  ui.app = document.getElementById("app");
}

function bindShellEvents() {
  if (ui.start) {
    ui.start.addEventListener("click", () => {
      ui.loading?.classList.add("hidden");
      ui.board?.classList.remove("hidden");
      campaignState.mode = "freeplay";
      campaignState.activeNode = null;
      resetGame();
    });
  }

  initTutorialUI();
}

function initTutorialUI() {
  const playTutorialBtn = document.getElementById("play-tutorial-btn");
  const tutorialNextBtn = document.getElementById("tutorial-next-btn");
  const tutorialExitBtn = document.getElementById("tutorial-exit-btn");

  if (playTutorialBtn) {
    playTutorialBtn.addEventListener("click", () => {
      ui.loading?.classList.add("hidden");
      ui.board?.classList.remove("hidden");
      startTutorialGame();
    });
  }

  if (tutorialNextBtn) {
    tutorialNextBtn.addEventListener("click", advanceTutorialStep);
  }

  if (tutorialExitBtn) {
    tutorialExitBtn.addEventListener("click", endTutorialMode);
  }
}

function createDeity(ownerId, essence, baseKl) {
  return {
    id: "DEITY-" + ownerId,
    name: ownerId === "P1" ? "Second Sun Herald" : "Null Regent",
    essenceStart: essence,
    baseKl,
  };
}

function createShard(ownerId, index, klCost) {
  return {
    id: "SHARD-" + ownerId + "-" + index,
    ownerId,
    name: "Sun Shard " + (index + 1),
    type: "Shard",
    klCost,
    power: 0,
    guard: 0,
    tapped: false,
  };
}

function createAvatar(ownerId, index, name, power, guard, klCost) {
  return {
    id: "AVATAR-" + ownerId + "-" + index,
    ownerId,
    name,
    type: "Avatar",
    klCost,
    power,
    guard,
    tapped: false,
    image: SAMPLE_ART[index % SAMPLE_ART.length],
  };
}

const SAMPLE_ART = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=60",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=60",
  "https://images.unsplash.com/photo-1517816428104-797678c7cf0d?auto=format&fit=crop&w=600&q=60",
  "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=60",
];

function createFakeDeck(ownerId) {
  const deck = [];
  for (let i = 0; i < 4; i++) {
    deck.push({ ...createShard(ownerId, i, 1), image: SAMPLE_ART[(i + 1) % SAMPLE_ART.length] });
  }
  deck.push(createAvatar(ownerId, 0, "Glow Vanguard", 2, 2, 2));
  deck.push(createAvatar(ownerId, 1, "Solar Aegis Knight", 3, 3, 3));
  deck.push(createAvatar(ownerId, 2, "Crownflame Herald", 4, 3, 4));
  deck.push(createAvatar(ownerId, 3, "Nullblade Stalker", 3, 1, 2));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function buildCardView(card, { canPlay = true, onClick } = {}) {
  const cardEl = document.createElement("div");
  cardEl.className = "card-frame";
  if (!canPlay) cardEl.classList.add("card-disabled");

  cardEl.innerHTML = `
    <div class="card-art-wrapper">
      <img class="card-art" src="${card.image || SAMPLE_ART[0]}" alt="${card.name}" />
    </div>
    <div class="card-overlay">
      <div class="card-header-row">
        <span class="card-title">${card.name}</span>
        <span class="card-cost">${card.klCost ?? card.cost ?? 0}</span>
      </div>
      <div class="card-type-row">
        <span class="card-type">${card.type || ""}</span>
      </div>
      <div class="card-stats-row">${card.power !== undefined ? `${card.power} / ${card.guard ?? card.toughness ?? 0}` : ""}</div>
    </div>
  `;

  cardEl.addEventListener("mouseenter", () => showDetailOverlay(card));
  cardEl.addEventListener("mouseleave", hideDetailOverlay);
  cardEl.addEventListener("click", () => {
    if (onClick) onClick();
    showDetailOverlay(card);
  });

  return cardEl;
}

function showDetailOverlay(card) {
  const overlay = document.getElementById("card-detail-overlay");
  if (!overlay) return;
  overlay.innerHTML = `
    <div class="card-detail-content">
      <div class="card-header-row">
        <span class="card-title">${card.name}</span>
        <span class="card-cost">${card.klCost ?? card.cost ?? 0} KL</span>
      </div>
      <div class="card-art-wrapper">
        <img class="card-art" src="${card.image || SAMPLE_ART[0]}" alt="${card.name}" />
      </div>
      <div class="card-type-row">${card.type || ""}</div>
      <div class="card-stats-row">${card.power !== undefined ? `${card.power} / ${card.guard ?? card.toughness ?? 0}` : ""}</div>
    </div>
  `;
  overlay.classList.remove("card-detail-hidden");
  overlay.onclick = hideDetailOverlay;
}

function hideDetailOverlay() {
  const overlay = document.getElementById("card-detail-overlay");
  if (!overlay) return;
  overlay.classList.add("card-detail-hidden");
  overlay.innerHTML = "";
}

function createPlayer(id, name, essence, baseKl) {
  const deity = createDeity(id, essence, baseKl);
  return {
    id,
    name,
    deity,
    essence,
    baseKl,
    currentKl: baseKl,
    klCap: MAX_KL,
    godCharges: 0,
    godChargesSpent: 0,
    veiledDeck: deckOverride || createFakeDeck(id),
    hand: [],
    shardRow: [],
    avatarFrontline: [],
    domainRow: [],
    crypt: [],
    nullZone: [],
  };
}

const game = {
  players: [
    createPlayer("P1", "Player One", 23, 3),
    createPlayer("P2", "Player Two", 21, 3),
  ],
  activeIndex: -1,
  turnNumber: 0,
  currentPhase: "Ready",
  log: [],
};

let focusInfo = {
  kind: "board",
  title: "New Earth Command Bridge",
  lines: [
    "This is the digital mirror of your 2-player Essence Crown playmat.",
    "Top: Opposing commander. Bottom: Frontline commander.",
    "Center: Shared New Earth battlefield where both frontlines clash.",
  ],
};

let guidedMode = true;

function showTutorialMessage(message) {
  const overlay = document.getElementById("tutorial-overlay");
  const textEl = document.getElementById("tutorial-text");
  if (!overlay || !textEl) return;

  textEl.textContent = message;
  overlay.classList.remove("tutorial-hidden");
}

function hideTutorialMessage() {
  const overlay = document.getElementById("tutorial-overlay");
  if (!overlay) return;
  overlay.classList.add("tutorial-hidden");
}

function advanceTutorialStep() {
  hideTutorialMessage();
}

function endTutorialMode() {
  isTutorialMode = false;
  hideTutorialMessage();
}

function runTutorialTrigger(triggerName, context = {}) {
  if (!isTutorialMode) return;

  const step = tutorialScript[tutorialStepIndex];
  if (!step || step.trigger !== triggerName) return;

  if (typeof step.turn === "number" && context.turn !== step.turn) return;
  if (step.player && context.player !== step.player) return;
  if (step.condition === "shardFirst" && context.cardType !== "Shard") return;

  showTutorialMessage(step.message);
  tutorialStepIndex += 1;
}

function activePlayer() {
  return game.activeIndex === -1 ? null : game.players[game.activeIndex];
}

function opponentOf(player) {
  return game.players.find((p) => p.id !== player.id) || null;
}

function logLine(text) {
  const stamp = "[T" + game.turnNumber + "]";
  game.log.push(stamp + " " + text);
  if (game.log.length > 120) {
    game.log.shift();
  }
}

function drawCard(player) {
  if (player.veiledDeck.length === 0) return null;
  const card = player.veiledDeck.shift();
  player.hand.push(card);
  card._justDrawn = true;
  return card;
}

function recalcKl(player) {
  let effective = player.baseKl + player.shardRow.length;
  if (effective > player.klCap) effective = player.klCap;
  const previous = player.currentKl;
  player.currentKl = effective;
  if (previous !== effective) {
    logLine(
      player.name +
        " KL: " +
        previous +
        " → " +
        effective +
        " (Base " +
        player.baseKl +
        " + " +
        player.shardRow.length +
        " Shard bonus)."
    );
  }
}

function maybeGainGodCharge(player) {
  if (game.turnNumber < 3) return;
  if (player.currentKl >= GOD_THRESHOLD && player.godCharges < MAX_GOD_CHARGES) {
    player.godCharges += 1;
    logLine(
      player.name +
        " reached KL " +
        GOD_THRESHOLD +
        "+ and gained a God Charge (" +
        player.godCharges +
        "/" +
        MAX_GOD_CHARGES +
        ")."
    );
  }
}

function readyFrontline(player) {
  player.avatarFrontline.forEach((card) => {
    card.tapped = false;
  });
}

function startNextTurn() {
  const previousPlayer = game.activeIndex;
  const previousTurn = game.turnNumber;

  if (game.activeIndex === -1) {
    game.activeIndex = 0;
    game.turnNumber = 1;
  } else {
    game.activeIndex = (game.activeIndex + 1) % game.players.length;
    game.turnNumber += 1;
  }

  const p = activePlayer();
  const opp = opponentOf(p);
  game.currentPhase = "Draw";

  readyFrontline(p);
  game.currentPhase = "Draw";

  const drawn = drawCard(p);
  if (drawn) {
    logLine(p.name + " drew from the Veiled Deck (" + drawn.name + ").");
  } else {
    logLine(p.name + " tried to draw but Veiled Deck is empty.");
  }

  game.currentPhase = "KL Recalc";
  recalcKl(p);
  maybeGainGodCharge(p);

  game.currentPhase = "Main";

  logLine(
    p.name +
      " begins their turn. Essence " +
      p.essence +
      ", KL " +
      p.currentKl +
      "/" +
      p.klCap +
      ", God Charges " +
      p.godCharges +
      "/" +
      MAX_GOD_CHARGES +
      "."
  );

  if (opp && opp.essence <= 0) {
    logLine(opp.name + " has 0 Essence. Game over.");
  }

  if (isTutorialMode && previousPlayer === 0 && previousTurn > 0) {
    runTutorialTrigger("onAfterTurn", { turn: previousTurn, player: "you" });
  }

  focusInfo = {
    kind: "turn",
    title: "Turn " + game.turnNumber + " — " + p.name,
    lines: [
      "Draw, KL Recalc, and Ready steps have completed.",
      "Hand: " +
        p.hand.length +
        " • Veiled Deck: " +
        p.veiledDeck.length +
        " • Crypt: " +
        p.crypt.length +
        ".",
      "Current KL: " +
        p.currentKl +
        " (God Threshold " +
        GOD_THRESHOLD +
        ", Cap " +
        MAX_KL +
        ").",
      "God Charges: " + p.godCharges + " / " + MAX_GOD_CHARGES + ".",
    ],
  };

  runTutorialTrigger("onTurnStart", {
    turn: game.turnNumber,
    player: game.activeIndex === 0 ? "you" : "opponent",
  });

  render();
}

function playCardFromHand(cardId) {
  const p = activePlayer();
  if (!p) return;
  const idx = p.hand.findIndex((c) => c.id === cardId);
  if (idx === -1) return;
  const card = p.hand[idx];

  const cost = card.klCost || 0;
  if (p.currentKl < cost) {
    focusInfo = {
      kind: "warning",
      title: "Not Enough KL",
      lines: [
        p.name + " tried to play " + card.name + ".",
        "Required KL: " + cost + ", available: " + p.currentKl + ".",
        "Add more Shards to your Shard Row or wait for a later turn.",
      ],
    };
    logLine(
      p.name +
        " attempted to play " +
        card.name +
        " but lacked KL (" +
        p.currentKl +
        "/" +
        cost +
        ")."
    );
    render();
    return;
  }

  p.currentKl -= cost;
  p.hand.splice(idx, 1);

  if (card.type === "Shard") {
    card._justPlayed = true;
    p.shardRow.push(card);
    logLine(p.name + " played Shard: " + card.name + " (KL -" + cost + ").");
    recalcKl(p);
    maybeGainGodCharge(p);
    focusInfo = {
      kind: "zone",
      title: "Shard Played – " + card.name,
      lines: [
        "This Shard now sits in your Shard / Relic Row.",
        "Each Shard adds +1 effective KL (capped at " + MAX_KL + ").",
        "Shard synergy is how you climb toward the God Threshold (" +
          GOD_THRESHOLD +
          " KL).",
      ],
    };
  } else if (card.type === "Avatar") {
    card.tapped = false;
    card._justPlayed = true;
    p.avatarFrontline.push(card);
    logLine(p.name + " played Avatar: " + card.name + " (KL -" + cost + ").");
    focusInfo = {
      kind: "card",
      title: "Avatar Deployed – " + card.name,
      lines: [
        "Owner: " + p.name + " (" + p.id + ").",
        "Stats: " + (card.power || 0) + " Power / " + (card.guard || 0) + " Guard.",
        "This Avatar now occupies a frontline slot on New Earth.",
      ],
    };
  } else {
    logLine(p.name + " played " + card.name + " (type " + card.type + ").");
    focusInfo = {
      kind: "card",
      title: "Card Played – " + card.name,
      lines: [
        "Type: " + card.type + ".",
        "KL Cost: " + cost + ".",
        "Future versions will resolve its full spell / Domain text here.",
      ],
    };
  }

  if (isTutorialMode) {
    runTutorialTrigger("onCardPlayed", { cardType: card.type });
  }

  render();
}

function attackWithAll() {
  const p = activePlayer();
  if (!p) return;
  const opp = opponentOf(p);
  if (!opp) return;

  game.currentPhase = "Combat";

  const attackers = p.avatarFrontline.filter((c) => !c.tapped && (c.power || 0) > 0);

  if (attackers.length === 0) {
    logLine(p.name + " has no untapped Avatars to attack with.");
    focusInfo = {
      kind: "info",
      title: "No Attackers Available",
      lines: [
        "You have no untapped Avatars with Power > 0 on the New Earth frontline.",
        "Play Avatars from your hand in Main phase, then swing.",
      ],
    };
    render();
    return;
  }

  runTutorialTrigger("onCombatAvailable", { player: "you" });

  let totalDamage = 0;
  attackers.forEach((a) => {
    totalDamage += a.power || 0;
    a.tapped = true;
  });

  const prevEss = opp.essence;
  opp.essence = Math.max(0, opp.essence - totalDamage);

  logLine(
    p.name +
      " attacks with " +
      attackers.length +
      " Avatar(s) for " +
      totalDamage +
      " Essence damage to " +
      opp.name +
      "."
  );
  logLine(opp.name + " Essence: " + prevEss + " → " + opp.essence + ".");

  focusInfo = {
    kind: "combat",
    title: "Attack Declared",
    lines: [
      p.name +
        " swung with " +
        attackers.length +
        " Avatar(s) for " +
        totalDamage +
        " Essence damage.",
      opp.name + " now sits at " + opp.essence + " Essence.",
      opp.essence <= 0
        ? opp.name + " has fallen. New Earth is claimed."
        : "Blocking, counterplay and triggers live in the full engine layer.",
    ],
  };

  if (opp.essence <= 0) {
    logLine(opp.name + " has been reduced to 0 Essence. Game over.");
    handleVictory(p.id);
  }

  game.currentPhase = "End";
  render();
}

function dealOpeningHand(player, count) {
  for (let i = 0; i < count; i++) {
    drawCard(player);
  }
}

function startNewGameWithTutorialDecks() {
  const playerDeck = createTutorialDeck("P1");
  const opponentDeck = createTutorialDeck("P2");

  game.players = [
    createPlayer("P1", "Player One", 23, 3, playerDeck),
    createPlayer("P2", "AI Opponent", 21, 3, opponentDeck),
  ];
  game.activeIndex = -1;
  game.turnNumber = 0;
  game.currentPhase = "Ready";
  game.log = [];

  dealOpeningHand(game.players[0], 3);
  dealOpeningHand(game.players[1], 2);

  const oppShard = game.players[1].veiledDeck.shift();
  if (oppShard) {
    game.players[1].shardRow.push(oppShard);
    recalcKl(game.players[1]);
  }

  focusInfo = {
    kind: "board",
    title: "Tutorial Ready",
    lines: [
      "Scripted decks are loaded. Use “Start Game” to begin Turn 1.",
      "You’ll see guided steps for the first few turns.",
    ],
  };
  logLine("Tutorial game initialized with scripted decks.");
  render();
}

function startTutorialGame() {
  isTutorialMode = true;
  tutorialStepIndex = 0;
  startNewGameWithTutorialDecks();
  runTutorialTrigger("onTutorialStart");
  runTutorialTrigger("onBoardReady");
}

function resetGame() {
  isTutorialMode = false;
  tutorialStepIndex = 0;
  hideTutorialMessage();
  game.players = [
    createPlayer("P1", "Player One", 23, 3),
    createPlayer("P2", "Player Two", 21, 3),
  ];
  game.activeIndex = -1;
  game.turnNumber = 0;
  game.currentPhase = "Ready";
  game.log = [];
  focusInfo = {
    kind: "board",
    title: "Board Reset",
    lines: [
      "New Earth is reset. Both commanders return to starting Essence and KL.",
      "Click “Start Game (P1 Turn 1)” to begin.",
      "This mirrors shuffling your decks and setting Essence on the physical mat.",
    ],
  };
  logLine("New game started.");
  render();
}

function setFocus(kind, title, lines) {
  focusInfo = { kind, title, lines: lines || [] };
  render();
}

function buildMeter(current, max, type) {
  const meter = document.createElement("div");
  meter.className = "meter";

  const label = document.createElement("div");
  label.className = "meter-label";
  label.textContent = type === "kl" ? "KL Flow" : "Essence Life Force";
  meter.appendChild(label);

  const track = document.createElement("div");
  track.className = "meter-track";

  const fill = document.createElement("div");
  fill.className = "meter-fill" + (type ? " " + type : "");

  let ratio = max > 0 ? current / max : 0;
  if (ratio < 0) ratio = 0;
  if (ratio > 1) ratio = 1;
  fill.style.transform = "scaleX(" + ratio.toFixed(3) + ")";

  track.appendChild(fill);

  if (type === "kl") {
    const threshold = GOD_THRESHOLD / MAX_KL;
    const marker = document.createElement("div");
    marker.className = "kl-threshold-marker";
    marker.style.left = (threshold * 100).toFixed(1) + "%";
    track.appendChild(marker);

    const capMarker = document.createElement("div");
    capMarker.className = "kl-cap-marker";
    track.appendChild(capMarker);
  }

  meter.appendChild(track);
  return meter;
}

function buildGodChargeRow(player) {
  const row = document.createElement("div");
  row.className = "god-charge-row";

  const label = document.createElement("div");
  label.textContent = "God Charges";
  row.appendChild(label);

  const orbsWrap = document.createElement("div");
  orbsWrap.className = "god-orbs";

  for (let i = 0; i < MAX_GOD_CHARGES; i++) {
    const orb = document.createElement("div");
    orb.className = "god-orb";
    if (i < player.godCharges) {
      orb.classList.add("charged");
    } else if (i < player.godCharges + player.godChargesSpent) {
      orb.classList.add("spent");
    }
    orbsWrap.appendChild(orb);
  }

  row.appendChild(orbsWrap);
  return row;
}

function buildPlayerSection(player, index) {
  const section = document.createElement("div");
  section.className = "player-section " + (index === 0 ? "bottom" : "top");
  if (index === game.activeIndex) {
    section.className += " is-active";
  }

  const inner = document.createElement("div");
  inner.className = "player-section-inner";
  section.appendChild(inner);

  const headerRow = document.createElement("div");
  headerRow.className = "player-header-row";

  const idBlock = document.createElement("div");
  idBlock.className = "player-id-block";

  const label = document.createElement("div");
  label.className = "player-label";
  label.textContent = index === 0 ? "Frontline Commander" : "Opposing Commander";

  const name = document.createElement("div");
  name.className = "player-name";
  name.textContent = player.name + " (" + player.id + ")";

  idBlock.appendChild(label);
  idBlock.appendChild(name);
  headerRow.appendChild(idBlock);

  if (index === game.activeIndex) {
    const badge = document.createElement("div");
    badge.className = "badge-active";
    badge.textContent = "Active Turn";
    headerRow.appendChild(badge);
  }

  inner.appendChild(headerRow);

  const statsRow = document.createElement("div");
  statsRow.className = "player-stats-row";

  function pill(text, cls) {
    const el = document.createElement("div");
    el.className = "stat-pill" + (cls ? " " + cls : "");
    el.textContent = text;
    return el;
  }

  statsRow.appendChild(pill("Essence: " + player.essence, "essence"));
  statsRow.appendChild(pill("KL: " + player.currentKl + " / " + player.klCap, "kl"));
  statsRow.appendChild(pill("Base KL: " + player.baseKl, "kl"));
  statsRow.appendChild(
    pill("God Charges: " + player.godCharges + " / " + MAX_GOD_CHARGES, "god")
  );
  statsRow.appendChild(pill("Hand: " + player.hand.length));
  statsRow.appendChild(pill("Veiled: " + player.veiledDeck.length));
  statsRow.appendChild(pill("Crypt: " + player.crypt.length));

  if (player.essence <= 5) {
    statsRow.appendChild(pill("Critical Essence", "danger"));
  }

  inner.appendChild(statsRow);

  const meters = document.createElement("div");
  meters.className = "meter-row";
  meters.appendChild(buildMeter(player.essence, 30, "essence"));
  meters.appendChild(buildMeter(player.currentKl, player.klCap, "kl"));
  inner.appendChild(meters);

  inner.appendChild(buildGodChargeRow(player));

  const grid = document.createElement("div");
  grid.className = "zones-grid";

  const leftCol = document.createElement("div");
  leftCol.className = "zone-column";

  const veiledCard = document.createElement("div");
  veiledCard.className = "zone-card";
  veiledCard.onclick = function () {
    setFocus("zone", "Veiled Deck (" + player.id + ")", [
      "Cards remaining: " + player.veiledDeck.length + ".",
      "Draw 1 card from here at the start of your turn.",
      "Deck-out penalties, milling, and loss conditions are handled in the full rules.",
    ]);
  };

  const veiledTitle = document.createElement("div");
  veiledTitle.className = "zone-title";
  veiledTitle.textContent = "Veiled Deck";

  const veiledBody = document.createElement("div");
  veiledBody.className = "zone-body";
  const veiledVisual = document.createElement("div");
  veiledVisual.className = "deck-visual";
  veiledVisual.innerHTML = `
    <div class="deck-stack">
      <div class="deck-card back"></div>
      <div class="deck-card front"></div>
    </div>
  `;
  const veiledCount = document.createElement("div");
  veiledCount.className = "zone-count-badge";
  veiledCount.textContent = player.veiledDeck.length + " card(s)";
  const veiledNote = document.createElement("div");
  veiledNote.className = "zone-note";
  veiledNote.textContent = "This mirrors the Veiled Deck stack on your physical mat.";

  veiledBody.appendChild(veiledVisual);
  veiledBody.appendChild(veiledCount);
  veiledBody.appendChild(veiledNote);
  veiledCard.appendChild(veiledTitle);
  veiledCard.appendChild(veiledBody);
  leftCol.appendChild(veiledCard);

  const cryptCard = document.createElement("div");
  cryptCard.className = "zone-card compact";
  cryptCard.onclick = function () {
    setFocus("zone", "Crypt (" + player.id + ")", [
      "Cards in Crypt: " + player.crypt.length + ".",
      "Destroyed Avatars, spent Relics, and resolved spells accumulate here.",
      "On your playmat, this is the Crypt / Discard / Fallen zone.",
    ]);
  };

  const cryptTitle = document.createElement("div");
  cryptTitle.className = "zone-title";
  cryptTitle.textContent = "Crypt (Discard / Fallen)";

  const cryptBody = document.createElement("div");
  cryptBody.className = "zone-body";
  const cryptCount = document.createElement("div");
  cryptCount.className = "zone-count-badge";
  cryptCount.textContent = player.crypt.length + " card(s)";
  cryptBody.appendChild(cryptCount);

  cryptCard.appendChild(cryptTitle);
  cryptCard.appendChild(cryptBody);
  leftCol.appendChild(cryptCard);

  grid.appendChild(leftCol);

  const centerCol = document.createElement("div");
  centerCol.className = "zone-column";

  const deityCard = document.createElement("div");
  deityCard.className = "zone-card";
  deityCard.onclick = function () {
    setFocus("deity", "Deity – " + player.deity.name + " (" + player.id + ")", [
      "Starting Essence: " +
        player.deity.essenceStart +
        ". Current Essence: " +
        player.essence +
        ".",
      "Base KL: " + player.baseKl + ". Shards increase KL, capped at " + MAX_KL + ".",
      "If Essence hits 0, your Deity falls and the game ends.",
    ]);
  };

  const deityTitle = document.createElement("div");
  deityTitle.className = "zone-title";
  deityTitle.textContent = "Deity / Essence Crown";

  const deityBody = document.createElement("div");
  deityBody.className = "zone-body";
  const deityName = document.createElement("div");
  deityName.textContent = player.deity.name + " – Essence " + player.essence;
  const deityNote = document.createElement("div");
  deityNote.className = "zone-note";
  deityNote.textContent = "This panel is your Essence Crown and Deity portrait on the mat.";

  deityBody.appendChild(deityName);
  deityBody.appendChild(deityNote);
  deityCard.appendChild(deityTitle);
  deityCard.appendChild(deityBody);
  centerCol.appendChild(deityCard);

  grid.appendChild(centerCol);

  const rightCol = document.createElement("div");
  rightCol.className = "zone-column";

  const shardCard = document.createElement("div");
  shardCard.className = "zone-card";
  shardCard.onclick = function () {
    setFocus("zone", "Shard / Relic Row (" + player.id + ")", [
      "Shards in play: " + player.shardRow.length + ".",
      "Each Shard adds +1 effective KL on your turn (cap " + MAX_KL + ").",
      "This is the Shard / Relic row printed on your right-hand mat column.",
    ]);
  };

  const shardTitle = document.createElement("div");
  shardTitle.className = "zone-title";
  shardTitle.textContent = "Shard / Relic Row";

  const shardBody = document.createElement("div");
  shardBody.className = "zone-body";
  const shardCount = document.createElement("div");
  shardCount.className = "zone-count-badge";
  shardCount.textContent = player.shardRow.length + " in play";
  const shardNote = document.createElement("div");
  shardNote.className = "zone-note";
  shardNote.textContent =
    "Shards are your sun-fractures; they push KL toward the God Threshold.";

  shardBody.appendChild(shardCount);
  shardBody.appendChild(shardNote);
  shardCard.appendChild(shardTitle);
  shardCard.appendChild(shardBody);
  rightCol.appendChild(shardCard);

  const domainCard = document.createElement("div");
  domainCard.className = "zone-card compact";
  domainCard.onclick = function () {
    setFocus("zone", "Domain Lane (" + player.id + ")", [
      "Domains in play: " + player.domainRow.length + ".",
      "Domains are global rule tiles that reshape how Essence, KL and Avatars behave.",
      "On your mat, this matches the Domain strip adjacent to the Shard row.",
    ]);
  };

  const domainTitle = document.createElement("div");
  domainTitle.className = "zone-title";
  domainTitle.textContent = "Domain Lane";

  const domainBody = document.createElement("div");
  domainBody.className = "zone-body";
  const domainCount = document.createElement("div");
  domainCount.className = "zone-count-badge";
  domainCount.textContent = player.domainRow.length + " domain(s)";
  domainBody.appendChild(domainCount);

  domainCard.appendChild(domainTitle);
  domainCard.appendChild(domainBody);
  rightCol.appendChild(domainCard);

  grid.appendChild(rightCol);

  inner.appendChild(grid);
  return section;
}

function renderBattlefield(container, topPlayer, bottomPlayer) {
  const inner = document.createElement("div");
  inner.className = "battlefield-inner";

  const header = document.createElement("div");
  header.className = "battlefield-header";

  const title = document.createElement("div");
  title.className = "battlefield-title";
  title.textContent = "New Earth • Shared Battlefield";

  const info = document.createElement("div");
  info.className = "battlefield-title";
  info.textContent = "Avatars from both commanders clash across the centerline.";
  header.appendChild(title);
  header.appendChild(info);

  inner.appendChild(header);

  const centerLabel = document.createElement("div");
  centerLabel.className = "battlefield-center-label";
  centerLabel.textContent = "Centerline / Clash Zone";
  inner.appendChild(centerLabel);

  const centerLineVisual = document.createElement("div");
  centerLineVisual.className = "centerline";
  inner.appendChild(centerLineVisual);

  const topLabel = document.createElement("div");
  topLabel.className = "frontline-row-label";
  topLabel.textContent = "P2 Frontline (Opponent)";
  inner.appendChild(topLabel);

  const topRow = document.createElement("div");
  topRow.className = "frontline-row";

  const maxSlots = 5;
  for (let i = 0; i < maxSlots; i++) {
    const slot = document.createElement("div");
    const card = topPlayer.avatarFrontline[i] || null;
    slot.className = "battle-slot";
    if (card) {
      slot.classList.add("has-card");
      slot.textContent = "";
      const cardView = buildCardView(card, { canPlay: false });
      if (card._justPlayed) {
        requestAnimationFrame(() => {
          cardView.classList.add("card-anim-play");
          cardView.addEventListener(
            "animationend",
            () => {
              cardView.classList.remove("card-anim-play");
              card._justPlayed = false;
            },
            { once: true }
          );
        });
      }
      slot.appendChild(cardView);
      slot.onclick = function () {
        setFocus("card", "Avatar – " + card.name + " (P2)", [
          "Owner: " + topPlayer.name + " (P2).",
          "Stats: " + (card.power || 0) + " Power / " + (card.guard || 0) + " Guard.",
          "Tapped: " + (card.tapped ? "Yes" : "No") + ".",
          "This Avatar occupies the upper frontline on New Earth.",
        ]);
      };
    } else {
      slot.classList.add("empty");
      slot.textContent = "Empty Slot";
      slot.onclick = function () {
        setFocus("zone", "Empty P2 Frontline Slot", [
          "When P2 plays Avatars, they appear in these slots on the upper row.",
          "On the physical mat, this is your opponent’s Avatar lane.",
        ]);
      };
    }
    topRow.appendChild(slot);
  }
  inner.appendChild(topRow);

  const bottomLabel = document.createElement("div");
  bottomLabel.className = "frontline-row-label";
  bottomLabel.textContent = "P1 Frontline (You)";
  inner.appendChild(bottomLabel);

  const bottomRow = document.createElement("div");
  bottomRow.className = "frontline-row";
  for (let i = 0; i < maxSlots; i++) {
    const slot = document.createElement("div");
    const card = bottomPlayer.avatarFrontline[i] || null;
    slot.className = "battle-slot";
    if (card) {
      slot.classList.add("has-card");
      slot.textContent = "";
      const cardView = buildCardView(card, { canPlay: false });
      if (card._justPlayed) {
        requestAnimationFrame(() => {
          cardView.classList.add("card-anim-play");
          cardView.addEventListener(
            "animationend",
            () => {
              cardView.classList.remove("card-anim-play");
              card._justPlayed = false;
            },
            { once: true }
          );
        });
      }
      slot.appendChild(cardView);
      slot.onclick = function () {
        setFocus("card", "Avatar – " + card.name + " (P1)", [
          "Owner: " + bottomPlayer.name + " (P1).",
          "Stats: " + (card.power || 0) + " Power / " + (card.guard || 0) + " Guard.",
          "Tapped: " + (card.tapped ? "Yes" : "No") + ".",
          "This Avatar occupies the lower frontline on New Earth.",
        ]);
      };
    } else {
      slot.classList.add("empty");
      slot.textContent = "Empty Slot";
      slot.onclick = function () {
        setFocus("zone", "Empty P1 Frontline Slot", [
          "When you play Avatars, they appear in these slots on the lower row.",
          "On the physical mat, this is your Avatar lane.",
        ]);
      };
    }
    bottomRow.appendChild(slot);
  }
  inner.appendChild(bottomRow);

  container.appendChild(inner);
}

function render() {
  if (!ui.app) return;
  ui.app.innerHTML = "";

  const topBar = document.createElement("div");
  topBar.className = "top-bar";

  const controls = document.createElement("div");
  controls.className = "controls";

  const btnTurn = document.createElement("button");
  btnTurn.textContent = game.activeIndex === -1 ? "Start Game (P1 Turn 1)" : "Next Turn";
  btnTurn.onclick = startNextTurn;
  controls.appendChild(btnTurn);

  const btnAttack = document.createElement("button");
  btnAttack.textContent = "Attack With All Avatars";
  btnAttack.onclick = attackWithAll;
  btnAttack.disabled = !activePlayer();
  controls.appendChild(btnAttack);

  const btnReset = document.createElement("button");
  btnReset.textContent = "Reset Game";
  btnReset.onclick = resetGame;
  controls.appendChild(btnReset);

  topBar.appendChild(controls);

  const toggle = document.createElement("div");
  toggle.className = "toggle-pill";

  const toggleLabel = document.createElement("span");
  toggleLabel.textContent = "Mode:";
  toggle.appendChild(toggleLabel);

  const modeLabel = document.createElement("span");
  modeLabel.className = "mode-label";
  modeLabel.textContent = guidedMode ? "Guided" : "Pro";
  toggle.appendChild(modeLabel);

  const switchEl = document.createElement("div");
  switchEl.className = "toggle-switch" + (guidedMode ? " guided" : "");
  const knob = document.createElement("div");
  knob.className = "toggle-knob";
  switchEl.appendChild(knob);
  switchEl.onclick = function () {
    guidedMode = !guidedMode;
    render();
  };

  toggle.appendChild(switchEl);

  topBar.appendChild(toggle);

  ui.app.appendChild(topBar);

  const turnInd = document.createElement("div");
  turnInd.className = "turn-indicator";
  if (game.turnNumber === 0) {
    turnInd.textContent = "Turn: Not started • Click “Start Game (P1 Turn 1)”";
  } else {
    const p = activePlayer();
    turnInd.textContent =
      "Turn " +
      game.turnNumber +
      " — Active Commander: " +
      (p ? p.name : "?") +
      " • Phase: " +
      game.currentPhase;
  }
  ui.app.appendChild(turnInd);

  const board = document.createElement("div");
  board.className = "board";

  board.appendChild(buildPlayerSection(game.players[1], 1));

  const centerBlock = document.createElement("div");
  centerBlock.className = "center-block";

  const centerStrip = document.createElement("div");
  centerStrip.className = "center-strip";

  const tempoPanel = document.createElement("div");
  tempoPanel.className = "center-panel";
  const tempoTitle = document.createElement("div");
  tempoTitle.className = "center-title";
  tempoTitle.textContent = "New Earth Timeline";
  const tempoLine = document.createElement("div");
  tempoLine.className = "center-line";
  tempoLine.textContent =
    "Turn " +
    game.turnNumber +
    " • KL threshold " +
    GOD_THRESHOLD +
    " • KL cap " +
    MAX_KL +
    " • Max " +
    MAX_GOD_CHARGES +
    " God Charges per commander.";
  tempoPanel.appendChild(tempoTitle);
  tempoPanel.appendChild(tempoLine);

  const phaseBar = document.createElement("div");
  phaseBar.className = "phase-bar";
  PHASES.forEach((phase) => {
    const pill = document.createElement("div");
    pill.className = "phase-pill";
    pill.textContent = phase;
    if (phase === game.currentPhase) {
      pill.classList.add("active");
    }
    phaseBar.appendChild(pill);
  });
  tempoPanel.appendChild(phaseBar);

  if (guidedMode) {
    const hint = document.createElement("div");
    hint.className = "guided-hint";
    if (game.currentPhase === "Main") {
      hint.textContent =
        "Guided: In Main, play Shards to grow KL, or Avatars to your frontline before attacking.";
    } else if (game.currentPhase === "Combat") {
      hint.textContent =
        "Guided: In Combat, use “Attack With All Avatars” to swing with your frontline.";
    } else if (game.currentPhase === "Draw") {
      hint.textContent = "Guided: You automatically drew from your Veiled Deck. Check your hand below.";
    } else if (game.currentPhase === "KL Recalc") {
      hint.textContent =
        "Guided: KL recalculated from Base KL + Shard Row (capped at " + MAX_KL + ").";
    } else {
      hint.textContent =
        "Guided: Follow the phases left-to-right each turn, like a built-in tutorial track.";
    }
    tempoPanel.appendChild(hint);
  }

  centerStrip.appendChild(tempoPanel);

  const flowPanel = document.createElement("div");
  flowPanel.className = "center-panel";
  const flowTitle = document.createElement("div");
  flowTitle.className = "center-title";
  flowTitle.textContent = "Shard Wars Turn Flow";
  const flowLine = document.createElement("div");
  flowLine.className = "center-line";
  flowLine.textContent =
    "Ready → Draw → KL Recalc (Shards) → Main Actions → Combat → End. God Charges only accrue once KL ≥ " +
    GOD_THRESHOLD +
    " after Turn 3.";
  flowPanel.appendChild(flowTitle);
  flowPanel.appendChild(flowLine);
  centerStrip.appendChild(flowPanel);

  centerBlock.appendChild(centerStrip);

  const battlefield = document.createElement("div");
  battlefield.className = "battlefield-panel";
  battlefield.onclick = function () {
    setFocus("zone", "New Earth Battlefield", [
      "This central band is the shared New Earth battlefield from your mat.",
      "Top row: P2 frontline Avatars. Bottom row: P1 frontline Avatars.",
      "All combat is visually centered here, across the glowing centerline.",
    ]);
  };
  renderBattlefield(battlefield, game.players[1], game.players[0]);
  centerBlock.appendChild(battlefield);

  board.appendChild(centerBlock);

  board.appendChild(buildPlayerSection(game.players[0], 0));

  ui.app.appendChild(board);

  const handWrap = document.createElement("div");
  handWrap.className = "hand-wrapper";

  const pActive = activePlayer();

  const handTitle = document.createElement("div");
  handTitle.className = "hand-title";
  handTitle.textContent = pActive
    ? "Active Hand — " + pActive.name + " (" + pActive.id + ")"
    : "Active Hand — Start the game to draw from your Veiled Deck.";
  handWrap.appendChild(handTitle);

  const handRow = document.createElement("div");
  handRow.className = "hand-cards";

  if (pActive) {
    if (pActive.hand.length === 0) {
      const empty = document.createElement("div");
      empty.style.fontSize = "0.72rem";
      empty.style.color = "#9ca3af";
      empty.textContent = "No cards in hand yet (draw happens automatically as your turn begins).";
      handRow.appendChild(empty);
    } else {
      pActive.hand.forEach((card) => {
        const canAfford = pActive.currentKl >= (card.klCost || 0);
        const cardView = buildCardView(card, {
          canPlay: canAfford,
          onClick: () => {
            if (canAfford) playCardFromHand(card.id);
          },
        });
        cardView.classList.add("hand-card");

        requestAnimationFrame(() => {
          if (card._justDrawn) {
            cardView.classList.add("card-anim-draw");
            cardView.addEventListener(
              "animationend",
              () => {
                cardView.classList.remove("card-anim-draw");
                card._justDrawn = false;
              },
              { once: true }
            );
          }
        });

        handRow.appendChild(cardView);
      });
    }
  }

  handWrap.appendChild(handRow);
  ui.app.appendChild(handWrap);

  const detailWrap = document.createElement("div");
  detailWrap.className = "detail-wrapper";

  const detailHead = document.createElement("div");
  detailHead.className = "detail-title-row";

  const detailTitle = document.createElement("div");
  detailTitle.className = "detail-title";
  detailTitle.textContent = "Focused Detail";
  detailHead.appendChild(detailTitle);

  const detailBadge = document.createElement("div");
  detailBadge.className = "detail-badge";
  detailBadge.textContent =
    focusInfo.kind === "board"
      ? "Board"
      : focusInfo.kind.charAt(0).toUpperCase() + focusInfo.kind.slice(1);
  detailHead.appendChild(detailBadge);

  detailWrap.appendChild(detailHead);

  const mainTitle = document.createElement("div");
  mainTitle.className = "detail-main-title";
  mainTitle.textContent = focusInfo.title || "";
  detailWrap.appendChild(mainTitle);

  const linesBox = document.createElement("div");
  linesBox.className = "detail-lines";
  focusInfo.lines.forEach((line) => {
    const l = document.createElement("div");
    l.className = "detail-line";
    l.textContent = line;
    linesBox.appendChild(l);
  });
  detailWrap.appendChild(linesBox);

  if (guidedMode) {
    const hint = document.createElement("div");
    hint.className = "detail-hint";
    hint.textContent =
      "Guided: Click any zone, Deity panel, frontline slot, or hand card to see its lore + rules here.";
    detailWrap.appendChild(hint);
  }

  ui.app.appendChild(detailWrap);

  const logBox = document.createElement("div");
  logBox.className = "log";

  const logTitle = document.createElement("div");
  logTitle.className = "log-title";
  logTitle.textContent = "Combat Log";
  logBox.appendChild(logTitle);

  game.log.forEach((line) => {
    const div = document.createElement("div");
    div.className = "log-line";
    div.textContent = line;
    logBox.appendChild(div);
  });

  ui.app.appendChild(logBox);
}

cacheAppNode();
bindShellEvents();
renderProfileUI();
renderCampaignUI();
logLine("New game started.");
render();
