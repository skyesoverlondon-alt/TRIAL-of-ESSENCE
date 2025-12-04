const phases = ["Dawn", "Main", "Combat", "End"];

function sampleDeck() {
  const pool = typeof CARD_DATABASE !== "undefined" ? CARD_DATABASE : [];
  const avatars = pool.filter((c) => c.type === "Avatar").slice(0, 10);
  const shards = pool.filter((c) => c.type === "Shard").slice(0, 10);
  const relics = pool.filter((c) => c.type === "Relic" || c.type === "Support").slice(0, 10);
  const mix = [...avatars, ...shards, ...relics];
  const base = mix.length > 0 ? mix : fallbackCards();
  return shuffle(base.map((card, idx) => ({
    ...card,
    cardId: `${card.id || card.name}-${idx}-${Math.random().toString(16).slice(2)}`,
  })));
}

function fallbackCards() {
  return shuffle([
    { id: "NE-001", name: "Bridge Vanguard", type: "Avatar", cost: 2, power: 3, toughness: 2 },
    { id: "NE-002", name: "Shardline Adept", type: "Shard", cost: 1 },
    { id: "NE-003", name: "Radiant Tactician", type: "Avatar", cost: 3, power: 4, toughness: 3 },
    { id: "NE-004", name: "Command Relay", type: "Support", cost: 1 },
    { id: "NE-005", name: "Frontier Domain", type: "Relic", cost: 2 },
    { id: "NE-006", name: "Solar Flare", type: "Relic", cost: 2 },
    { id: "NE-007", name: "Shard Soldier", type: "Avatar", cost: 1, power: 2, toughness: 1 },
    { id: "NE-008", name: "Gleam Scout", type: "Avatar", cost: 1, power: 1, toughness: 1 },
    { id: "NE-009", name: "Command Uplink", type: "Support", cost: 1 },
    { id: "NE-010", name: "Null Ward", type: "Relic", cost: 3 },
  ]);
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const state = {
  game: null,
  activePlayerIndex: 0,
  phaseIndex: 0,
  turn: 1,
};

const ui = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheNodes();
  bindEvents();
});

function cacheNodes() {
  ui.loadingScreen = document.getElementById("loading-screen");
  ui.board = document.getElementById("board");
  ui.turnIndicator = document.getElementById("turn-indicator");
  ui.activePlayer = document.getElementById("active-player");
  ui.phaseLabel = document.getElementById("phase-label");
  ui.essenceValue = document.getElementById("essence-value");
  ui.klValue = document.getElementById("kl-value");
  ui.godCharges = document.getElementById("god-charges");
  ui.deckCount = document.getElementById("deck-count");
  ui.hand = document.getElementById("hand-cards");
  ui.field = document.getElementById("field-cards");
  ui.log = document.getElementById("log");
  ui.startButton = document.getElementById("start-button");
  ui.nextPhase = document.getElementById("next-phase");
  ui.drawButton = document.getElementById("draw-button");
  ui.resetButton = document.getElementById("reset-button");
}

function bindEvents() {
  ui.startButton.addEventListener("click", startSoloDuel);
  ui.nextPhase.addEventListener("click", advancePhase);
  ui.drawButton.addEventListener("click", () => drawCard(state.activePlayerIndex));
  ui.resetButton.addEventListener("click", resetClient);
}

function startSoloDuel() {
  const playerDeck = sampleDeck();
  const opponentDeck = sampleDeck();

  state.game = {
    players: [
      {
        id: "player-1",
        name: "Commander", // player placeholder
        essence: 20,
        baseKl: 3,
        currentKl: 3,
        godCharges: 0,
        deck: shuffle(playerDeck),
        hand: [],
        field: [],
      },
      {
        id: "ai-1",
        name: "AI Opponent",
        essence: 20,
        baseKl: 3,
        currentKl: 3,
        godCharges: 0,
        deck: shuffle(opponentDeck),
        hand: [],
        field: [],
      },
    ],
  };

  state.activePlayerIndex = 0;
  state.phaseIndex = 0;
  state.turn = 1;

  for (let i = 0; i < 5; i += 1) {
    drawCard(0, false);
    drawCard(1, false);
  }

  log(`Solo duel initialized. Commander starts.`);
  ui.loadingScreen.classList.add("hidden");
  ui.board.classList.remove("hidden");
  render();
}

function currentPlayer() {
  if (!state.game) return null;
  return state.game.players[state.activePlayerIndex];
}

function drawCard(playerIndex, logAction = true) {
  if (!state.game) return;
  const player = state.game.players[playerIndex];
  const card = player.deck.shift();
  if (!card) {
    log(`${player.name} has no cards left to draw.`);
    return;
  }
  player.hand.push(card);
  if (logAction) {
    log(`${player.name} draws ${card.name}.`);
  }
  render();
}

function playCard(cardId) {
  if (!state.game) return;
  const player = currentPlayer();
  const idx = player.hand.findIndex((c) => c.cardId === cardId);
  if (idx === -1) return;
  const card = player.hand[idx];
  const cost = card.cost ?? card.klCost ?? 0;
  if (player.currentKl < cost) {
    log(`Not enough KL to play ${card.name}.`);
    return;
  }
  player.currentKl -= cost;
  player.hand.splice(idx, 1);
  player.field.push(card);
  log(`${player.name} plays ${card.name} (cost ${cost}).`);
  render();
}

function advancePhase() {
  if (!state.game) return;
  state.phaseIndex = (state.phaseIndex + 1) % phases.length;
  if (state.phaseIndex === 0) {
    endTurn();
  } else {
    render();
  }
}

function endTurn() {
  if (!state.game) return;
  state.activePlayerIndex = (state.activePlayerIndex + 1) % state.game.players.length;
  state.turn += 1;
  state.phaseIndex = 0;
  state.game.players[state.activePlayerIndex].currentKl =
    state.game.players[state.activePlayerIndex].baseKl;
  log(`Turn ${state.turn} begins for ${currentPlayer().name}.`);
  render();
}

function resetClient() {
  state.game = null;
  state.turn = 1;
  state.phaseIndex = 0;
  ui.board.classList.add("hidden");
  ui.loadingScreen.classList.remove("hidden");
  ui.log.innerHTML = "";
}

function log(message) {
  if (!ui.log) return;
  const entry = document.createElement("div");
  entry.className = "log-entry";
  const timestamp = new Date().toLocaleTimeString();
  entry.textContent = `[${timestamp}] ${message}`;
  ui.log.prepend(entry);
}

function render() {
  const player = currentPlayer();
  if (!player) return;
  ui.turnIndicator.textContent = `Turn ${state.turn} – ${phases[state.phaseIndex]}`;
  ui.activePlayer.textContent = `Active: ${player.name}`;
  ui.phaseLabel.textContent = phases[state.phaseIndex];
  ui.essenceValue.textContent = player.essence;
  ui.klValue.textContent = `${player.currentKl} / ${player.baseKl}`;
  ui.godCharges.textContent = player.godCharges;
  ui.deckCount.textContent = `${player.deck.length} cards`;

  ui.hand.innerHTML = "";
  player.hand.forEach((card) => {
    const chip = document.createElement("button");
    chip.className = "card-chip";
    chip.innerHTML = `
      <div class="name">${card.name}</div>
      <div class="meta">
        <span>${card.type || "Card"}</span>
        <span>KL ${card.cost ?? card.klCost ?? 0}</span>
      </div>`;
    chip.addEventListener("click", () => playCard(card.cardId));
    ui.hand.appendChild(chip);
  });

  ui.field.innerHTML = "";
  player.field.forEach((card) => {
    const chip = document.createElement("div");
    chip.className = "card-chip";
    chip.innerHTML = `
      <div class="name">${card.name}</div>
      <div class="meta">
        <span>${card.type || "Card"}</span>
        <span>KL ${card.cost ?? card.klCost ?? 0}</span>
      </div>`;
    ui.field.appendChild(chip);
  });
}
