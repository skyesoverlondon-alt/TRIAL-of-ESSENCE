import { CampaignData } from "./campaignData.js";
import { Rewards } from "./rewards.js";
import { ProfileManager } from "./profileManager.js";

function el(id) {
  return document.getElementById(id);
}

function renderProfileSummary(profile) {
  const summary = el("campaign-profile-summary");
  if (!summary) return;
  summary.innerHTML = "";
  const name = document.createElement("div");
  name.className = "profile-line";
  name.textContent = profile.displayName || "Unnamed Pilot";
  summary.appendChild(name);

  const level = document.createElement("div");
  level.className = "profile-line sub";
  level.textContent = `Level ${profile.playerLevel} • XP ${profile.xp}`;
  summary.appendChild(level);

  const currencies = document.createElement("div");
  currencies.className = "profile-currencies";
  [
    ["Crown Shards", profile.currencies.crownShards],
    ["Arcane Keys", profile.currencies.arcaneKeys],
    ["Essence Tokens", profile.currencies.essenceTokens],
  ].forEach(([label, value]) => {
    const pill = document.createElement("div");
    pill.className = "currency-pill";
    pill.textContent = `${label}: ${value}`;
    currencies.appendChild(pill);
  });
  summary.appendChild(currencies);

  const alignment = document.createElement("div");
  alignment.className = "alignment-list";
  Object.entries(profile.shardAlignment).forEach(([k, v]) => {
    const row = document.createElement("div");
    row.className = "alignment-row";
    row.innerHTML = `<span>${k.toUpperCase()}</span><span>${v}</span>`;
    alignment.appendChild(row);
  });
  summary.appendChild(alignment);
}

function renderActList(profile, onSelect) {
  const list = el("campaign-act-list");
  if (!list) return;
  list.innerHTML = "";
  CampaignData.ACTS.forEach((act) => {
    if (act.number > (profile.campaignProgress.actUnlocked || 1)) return;
    const card = document.createElement("div");
    card.className = "act-card";
    card.innerHTML = `<div class="act-title">Act ${act.number} – ${act.name}</div><div class="node-desc">${act.description}</div>`;
    card.addEventListener("click", () => onSelect(act));
    list.appendChild(card);
  });
}

function renderNodeList(profile, act, startCampaignNode) {
  const list = el("campaign-node-list");
  if (!list) return;
  list.innerHTML = "";
  if (!act) return;
  CampaignData.getNodesForAct(act.id).forEach((node) => {
    const card = document.createElement("div");
    card.className = "node-card";
    const complete = profile.campaignProgress.completedNodes.includes(node.id);
    const stars = profile.campaignProgress.nodeStars[node.id]?.stars || 0;
    card.innerHTML = `
      <div class="node-title"><span>${node.name}</span><span class="status ${
      complete ? "complete" : "pending"
    }">${complete ? "Completed" : `Stars ${stars || 0}`}</span></div>
      <div class="node-desc">${node.description}</div>
      <div class="node-type">${node.type.toUpperCase()}</div>
    `;

    const rewardsWrap = document.createElement("div");
    rewardsWrap.className = "node-rewards";
    const bundle = Rewards.getRewardBundle(node.rewardBundleId);
    if (bundle) {
      const pill = document.createElement("div");
      pill.className = "currency-pill";
      pill.textContent = `Crown Shards: ${bundle.currencies?.crownShards || 0}`;
      rewardsWrap.appendChild(pill);
      const pill2 = document.createElement("div");
      pill2.className = "currency-pill";
      pill2.textContent = `Essence Tokens: ${bundle.currencies?.essenceTokens || 0}`;
      rewardsWrap.appendChild(pill2);
    }
    card.appendChild(rewardsWrap);

    const actions = document.createElement("div");
    actions.className = "node-actions";
    const play = document.createElement("button");
    play.textContent = "Play";
    play.addEventListener("click", () => startCampaignNode(node));
    actions.appendChild(play);
    card.appendChild(actions);

    list.appendChild(card);
  });
}

function initProfileOverlay() {
  const openBtn = el("open-profile-btn");
  const closeBtn = el("profile-close-btn");
  const saveBtn = el("profile-save-btn");
  const overlay = el("profile-overlay");
  if (!overlay) return;

  const refresh = () => {
    const profile = ProfileManager.loadOrCreateProfile();
    const nameInput = el("profile-name-input");
    const avatarSelect = el("profile-avatar-select");
    if (nameInput) nameInput.value = profile.displayName || "";
    if (avatarSelect) avatarSelect.value = profile.avatarId || "estifarr";
  };

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      refresh();
      overlay.classList.remove("profile-hidden");
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", () => overlay.classList.add("profile-hidden"));

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const nameInput = el("profile-name-input");
      const avatarSelect = el("profile-avatar-select");
      ProfileManager.update((p) => ({
        ...p,
        displayName: nameInput?.value || "",
        avatarId: avatarSelect?.value || "estifarr",
      }));
      overlay.classList.add("profile-hidden");
    });
  }
}

function initCampaignUI(startCampaignGame) {
  const openBtn = el("open-campaign-btn");
  const closeBtn = el("close-campaign-btn");
  const overlay = el("campaign-overlay");
  const actList = el("campaign-act-list");
  if (!openBtn || !closeBtn || !overlay) return;

  let selectedAct = null;

  openBtn.addEventListener("click", () => {
    overlay.classList.remove("campaign-hidden");
    const profile = ProfileManager.loadOrCreateProfile();
    renderProfileSummary(profile);
    renderActList(profile, (act) => {
      selectedAct = act;
      renderNodeList(profile, act, (node) => startCampaignGame(node));
    });
    if (!selectedAct && actList?.firstChild) {
      selectedAct = CampaignData.ACTS[0];
      renderNodeList(profile, selectedAct, (node) => startCampaignGame(node));
    }
  });

  closeBtn.addEventListener("click", () => overlay.classList.add("campaign-hidden"));
}

const CampaignUI = { initCampaignUI, initProfileOverlay };

export { CampaignUI };
