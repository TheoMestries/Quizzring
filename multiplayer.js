const STORAGE_KEY = "quizzring-state";
const PLAYER_KEY = "quizzring-player-id";
const CHANNEL_NAME = "quizzring-sync";

const defaultState = {
  players: [],
  game: { status: "waiting", name: null, startedAt: null },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

let state = loadState();
const listeners = new Set();
const channel = new BroadcastChannel(CHANNEL_NAME);

channel.onmessage = (event) => {
  const incoming = event.data;
  if (!incoming) return;
  state = incoming;
  persist(state, { broadcast: false });
};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return clone(defaultState);
  try {
    const parsed = JSON.parse(raw);
    return {
      players: Array.isArray(parsed.players) ? parsed.players : [],
      game: parsed.game || clone(defaultState.game),
    };
  } catch (error) {
    console.warn("État local illisible, remise à zéro", error);
    return clone(defaultState);
  }
}

function persist(newState, { broadcast = true } = {}) {
  state = newState;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (broadcast) {
    channel.postMessage(state);
  }
  notify();
}

function notify() {
  listeners.forEach((listener) => listener(clone(state)));
}

function subscribe(listener) {
  listeners.add(listener);
  listener(clone(state));
  return () => listeners.delete(listener);
}

function randomId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `p-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function defaultAvatar(seed) {
  const safeSeed = seed || "Player";
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(
    safeSeed
  )}`;
}

function getCurrentPlayerId() {
  return localStorage.getItem(PLAYER_KEY);
}

function getPlayerFromState(currentId) {
  return state.players.find((player) => player.id === currentId);
}

function upsertPlayer({ name, avatar }) {
  const trimmedName = name?.trim();
  if (!trimmedName) throw new Error("Le nom Discord est requis");

  const id = getCurrentPlayerId() || randomId();
  localStorage.setItem(PLAYER_KEY, id);

  const newPlayer = {
    id,
    name: trimmedName,
    avatar: avatar?.trim() || defaultAvatar(trimmedName),
    status: state.game.status === "running" ? "in-game" : "waiting",
    lastSeen: Date.now(),
  };

  const players = state.players.some((player) => player.id === id)
    ? state.players.map((player) => (player.id === id ? newPlayer : player))
    : [...state.players, newPlayer];

  persist({ ...state, players });
  return newPlayer;
}

function refreshPresence() {
  const currentId = getCurrentPlayerId();
  if (!currentId) return;
  const players = state.players.map((player) =>
    player.id === currentId ? { ...player, lastSeen: Date.now() } : player
  );
  persist({ ...state, players });
}

function startGame(name) {
  const trimmed = name?.trim() || "Partie surprise";
  const players = state.players.map((player) => ({
    ...player,
    status: "in-game",
  }));
  persist({
    players,
    game: { status: "running", name: trimmed, startedAt: Date.now() },
  });
}

function resetGame() {
  const players = state.players.map((player) => ({
    ...player,
    status: "waiting",
  }));
  persist({ players, game: clone(defaultState.game) });
}

function removeInactive(delayMs = 1000 * 60 * 60 * 6) {
  const cutoff = Date.now() - delayMs;
  const players = state.players.filter((player) => player.lastSeen >= cutoff);
  persist({ ...state, players });
}

function formatSince(timestamp) {
  if (!timestamp) return "—";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes === 1) return "Il y a une minute";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `Il y a ${hours} h`;
}

window.quizzringState = {
  subscribe,
  upsertPlayer,
  startGame,
  resetGame,
  refreshPresence,
  getCurrentPlayerId,
  getPlayerFromState,
  formatSince,
  removeInactive,
};
