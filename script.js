
// =================================================
// PARADOX ENGINE X
// THE MULTIVERSE OPERATING SYSTEM
// =================================================

const $ = id => document.getElementById(id);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const initialState = {
  stability: 87,
  chaos: 13,
  energy: 750,
  dimensions: 3,
  gravity: 50,
  timeFlow: 50,
  flux: 50,
  entropy: 20,
  universeId: "PX-" + random(100000, 999999),
  activeDimension: "EARTH-PRIME",
  seconds: 0,
  events: [],
  planets: [],
  notes: [],
  branches: [],
  missions: [],
  completedMissions: 0,
  rewards: 0,
  trades: 0,
  tradeHistory: [],
  discoveries: [],
  changes: 0,
  sound: false,
  matrix: false,
  lastWeather: "CLEAR SPACE",
  marketPrices: [120, 250, 80, 400, 180, 320]
};

let state = { ...initialState };
let currentPlanet = null;
let toastTimer;
let audioContext = null;

// =================================================
// STORAGE
// =================================================

function save() {
  try {
    localStorage.setItem("paradoxEngineX", JSON.stringify(state));
  } catch {
    notify("Storage limit reached. Remove some old notes.");
  }
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem("paradoxEngineX"));
    if (data && typeof data === "object") {
      state = { ...initialState, ...data };
      [
        "events", "planets", "notes", "branches",
        "missions", "discoveries", "tradeHistory"
      ].forEach(key => {
        if (!Array.isArray(state[key])) state[key] = [];
      });
    }
  } catch {
    state = { ...initialState };
  }
}

// =================================================
// NOTIFICATIONS AND SOUND
// =================================================

function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
  beep();
}

function beep() {
  if (!state.sound) return;

  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = 500;
    oscillator.type = "sine";

    gain.gain.setValueAtTime(0.04, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001, audioContext.currentTime + 0.12
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.12);
  } catch {}
}

$("soundBtn").addEventListener("click", () => {
  state.sound = !state.sound;
  $("soundBtn").textContent = state.sound ? "♫ ON" : "♫";
  save();
  notify(state.sound ? "SOUND ENABLED" : "SOUND DISABLED");
});

// =================================================
// NAVIGATION SYSTEM
// =================================================

const pageNames = {
  dashboard: "COMMAND CENTER",
  multiverse: "MULTIVERSE EXPLORER",
  planets: "PLANET LABORATORY",
  timeline: "TIMELINE ENGINE",
  missions: "MISSION CONTROL",
  oracle: "ORACLE INTELLIGENCE",
  market: "QUANTUM MARKET",
  vault: "DATA VAULT",
  terminal: "SYSTEM TERMINAL"
};

function navigate(view) {
  if (!pageNames[view]) return;

  document.querySelectorAll(".view").forEach(el => {
    el.classList.toggle("active", el.id === view);
  });

  document.querySelectorAll(".nav").forEach(el => {
    el.classList.toggle("active", el.dataset.view === view);
  });

  $("pageTitle").textContent = pageNames[view];

  if (view === "multiverse") renderUniverses();
  if (view === "planets") renderPlanetHistory();
  if (view === "timeline") renderTimeline();
  if (view === "missions") renderMissions();
  if (view === "market") renderMarket();
  if (view === "vault") renderNotes();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.view));
});

document.querySelectorAll("[data-goto]").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.goto));
});

// =================================================
// DASHBOARD
// =================================================

function render() {
  $("stability").textContent = state.stability + "%";
  $("chaos").textContent = state.chaos + "%";
  $("energy").textContent = state.energy;
  $("dimensions").textContent = String(state.dimensions).padStart(2, "0");

  $("stabilityBar").style.width = state.stability + "%";
  $("chaosBar").style.width = state.chaos + "%";
  $("energyBar").style.width = Math.min(100, state.energy / 10) + "%";
  $("dimensionBar").style.width = Math.min(100, state.dimensions * 5) + "%";

  $("universeId").textContent = state.universeId;
  $("activeDimension").textContent = state.activeDimension;
  $("destination").textContent = state.activeDimension;
  $("weather").textContent = state.lastWeather;

  $("coreState").textContent =
    state.stability < 30 ? "CRITICAL" :
    state.chaos > 65 ? "UNSTABLE" : "STABLE";

  $("marketBalance").textContent = state.energy;
  $("missionCount").textContent = state.completedMissions;
  $("rewards").textContent = state.rewards;
  $("tradeCount").textContent = state.trades;

  updateClock();
  renderRecentEvents();
  save();
}

function updateClock() {
  const h = Math.floor(state.seconds / 3600);
  const m = Math.floor((state.seconds % 3600) / 60);
  const s = state.seconds % 60;

  const time = [h, m, s]
    .map(n => String(n).padStart(2, "0"))
    .join(":");

  $("clock").textContent = new Date().toLocaleTimeString();
  $("simTime").textContent = time;
}

function log(name, description) {
  state.events.push({
    name,
    description,
    time: new Date().toLocaleTimeString()
  });

  if (state.events.length > 150) state.events.shift();

  renderRecentEvents();
  renderTimeline();
  save();
}

function renderRecentEvents() {
  const list = state.events.slice(-5).reverse();

  $("recentEvents").innerHTML = list.length
    ? list.map(event => `
      <div class="feed-item">
        <b>${safe(event.name)}</b>
        <p>${safe(event.description)}</p>
        <small>${safe(event.time)}</small>
      </div>
    `).join("")
    : '<div class="muted">No events recorded yet.</div>';
}

function safe(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// =================================================
// REALITY CONTROL
// =================================================

const sliders = [
  ["gravity", "gravityVal"],
  ["timeFlow", "timeVal"],
  ["flux", "fluxVal"],
  ["entropy", "entropyVal"]
];

sliders.forEach(([input, output]) => {
  $(input).addEventListener("input", () => {
    $(output).textContent = $(input).value;
  });
});

$("applyReality").addEventListener("click", () => {
  const next = {
    gravity: Number($("gravity").value),
    timeFlow: Number($("timeFlow").value),
    flux: Number($("flux").value),
    entropy: Number($("entropy").value)
  };

  const cost = Object.keys(next).reduce((total, key) => {
    return total + Math.abs(next[key] - state[key]);
  }, 0);

  if (cost > state.energy) {
    notify("INSUFFICIENT QUANTUM ENERGY");
    return;
  }

  state.energy -= cost;

  Object.assign(state, next);

  const instability =
    Math.abs(next.gravity - 50) * .15 +
    Math.abs(next.timeFlow - 50) * .15 +
    Math.abs(next.flux - 50) * .15 +
    next.entropy * .15;

  state.chaos = clamp(Math.round(13 + instability), 0, 100);
  state.stability = 100 - state.chaos;
  state.changes++;

  log("REALITY ALTERED", "Creator modified universal parameters.");
  render();
  notify("REALITY SUCCESSFULLY MODIFIED");
});

$("healBtn").addEventListener("click", healReality);

function healReality() {
  if (state.energy < 100) {
    notify("NEED 100 ENERGY UNITS");
    return;
  }

  state.energy -= 100;
  state.stability = clamp(state.stability + 25, 0, 100);
  state.chaos = clamp(state.chaos - 25, 0, 100);

  state.changes++;

  log("EMERGENCY STABILIZATION", "Reality shield repaired.");
  render();
  notify("UNIVERSE STABILIZED");
}

// =================================================
// COSMIC EVENT ENGINE
// =================================================

const cosmicEvents = {
  supernova: ["SUPERNOVA", "A distant star has exploded.", 100, 15, -12],
  wormhole: ["WORMHOLE", "A portal to a new dimension appeared.", 120, 12, -8],
  blackhole: ["BLACK HOLE", "A mysterious gravitational anomaly appeared.", 180, 22, -18],
  quantum: ["QUANTUM SHIFT", "The structure of reality has changed.", 100, 20, -15],
  meteor: ["METEOR SHOWER", "Cosmic debris crossed your universe.", 60, 8, -4],
  eclipse: ["TIME ECLIPSE", "The flow of time became distorted.", 70, 14, -10]
};

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", () => activateEvent(button.dataset.action));
});

function activateEvent(type) {
  const event = cosmicEvents[type];
  if (!event) return;

  const [name, description, cost, chaos, stability] = event;

  if (state.energy < cost) {
    notify("INSUFFICIENT ENERGY");
    return;
  }

  state.energy -= cost;
  state.chaos = clamp(state.chaos + chaos, 0, 100);
  state.stability = clamp(state.stability + stability, 0, 100);
  state.changes++;

  if (type === "wormhole") state.dimensions++;
  if (type === "blackhole") state.lastWeather = "GRAVITATIONAL STORM";
  if (type === "supernova") state.lastWeather = "STELLAR RADIATION";

  log(name, description);
  render();
  notify(name + " ACTIVATED");
}

// =================================================
// MULTIVERSE EXPLORER
// =================================================

const universes = [
  { name: "EARTH-PRIME", color: "#39eaff", desc: "The original baseline reality.", stability: 87 },
  { name: "NEON-2077", color: "#ff59c7", desc: "A futuristic cyberpunk civilization.", stability: 65 },
  { name: "VOID-NULL", color: "#a477ff", desc: "An empty and mysterious dimension.", stability: 23 },
  { name: "SOLARIS-9", color: "#ffb45b", desc: "A universe powered by stellar energy.", stability: 92 },
  { name: "FROST-OMEGA", color: "#7cbdff", desc: "A frozen alternate reality.", stability: 74 },
  { name: "MATRIX-404", color: "#48ffb0", desc: "A reality made of digital structures.", stability: 55 },
  { name: "DREAM-01", color: "#ee90ff", desc: "A strange universe of possibilities.", stability: 81 },
  { name: "INFINITY-X", color: "#ffffff", desc: "A reality with unknown properties.", stability: 99 },
  { name: "CHAOS-77", color: "#ff526d", desc: "A universe with unpredictable laws.", stability: 12 }
];

function renderUniverses() {
  $("universeGrid").innerHTML = universes.map((u, i) => `
    <div class="universe-card ${state.activeDimension === u.name ? "selected" : ""}">
      <div class="planet-dot" style="color:${u.color}"></div>
      <h3>${u.name}</h3>
      <p>${u.desc}</p>
      <p style="margin-top:10px;color:${u.color}">STABILITY: ${u.stability}%</p>
      <button data-travel="${i}">
        ${state.activeDimension === u.name ? "CURRENT WORLD" : "ENTER DIMENSION ↗"}
      </button>
    </div>
  `).join("");

  document.querySelectorAll("[data-travel]").forEach(button => {
    button.addEventListener("click", () => travelTo(Number(button.dataset.travel)));
  });
}

function travelTo(index) {
  const u = universes[index];
  if (!u) return;

  if (state.energy < 40) {
    notify("NEED 40 ENERGY TO TRAVEL");
    return;
  }

  state.energy -= 40;
  state.activeDimension = u.name;
  state.dimensions = Math.max(state.dimensions, 3);
  state.changes++;

  log("DIMENSION TRANSFER", "Traveled to " + u.name);
  render();
  renderUniverses();
  notify("ARRIVED AT " + u.name);
}

$("randomPortal").addEventListener("click", () => {
  const choices = universes.filter(u => u.name !== state.activeDimension);
  const destination = pick(choices);
  travelTo(universes.indexOf(destination));
});

// =================================================
// PLANET GENERATOR
// =================================================

const planetPrefixes = [
  "XENO", "NOVA", "ZEPHYR", "AETHER", "ORION",
  "VORTEX", "LYRA", "TITAN", "NEXUS", "ASTRA"
];

const planetSuffixes = [
  "PRIME", "OMEGA", "IX", "ZERO", "NOVA",
  "SEVEN", "DELTA", "404", "X", "MINOR"
];

const planetTypes = [
  "Oceanic world", "Desert world", "Frozen world",
  "Volcanic world", "Gas giant", "Crystal world",
  "Artificial world", "Forest world"
];

const planetColors = [
  ["#39eaff", "#3438b0"],
  ["#ffb45b", "#b73d31"],
  ["#a477ff", "#37216e"],
  ["#48ffb0", "#126b55"],
  ["#ff59c7", "#71266c"],
  ["#8bc9ff", "#3050a5"]
];

function generatePlanet() {
  const name = pick(planetPrefixes) + "-" + pick(planetSuffixes);
  const type = pick(planetTypes);
  const colors = pick(planetColors);

  currentPlanet = {
    name,
    type,
    size: random(2000, 18000),
    temperature: random(-180, 500),
    moons: random(0, 15),
    gravity: random(1, 30),
    atmosphere: pick(["Oxygen-rich", "Methane", "Nitrogen", "Carbon dioxide", "Unknown"]),
    population: random(0, 9000000),
    color1: colors[0],
    color2: colors[1]
  };

  $("planetVisual").style.background =
    `radial-gradient(circle at 30% 25%,white,${colors[0]} 20%,${colors[1]} 75%,#080813)`;

  $("planetVisual").style.boxShadow = `0 0 45px ${colors[0]}88`;

  $("planetName").textContent = name;
  $("planetDesc").textContent = type;

  $("planetStats").innerHTML = [
    ["CLASSIFICATION", type],
    ["DIAMETER", currentPlanet.size + " KM"],
    ["TEMPERATURE", currentPlanet.temperature + " °C"],
    ["MOONS", currentPlanet.moons],
    ["GRAVITY", currentPlanet.gravity + " m/s²"],
    ["ATMOSPHERE", currentPlanet.atmosphere],
    ["POPULATION", currentPlanet.population.toLocaleString()]
  ].map(([key, value]) => `
    <div class="data-row"><span>${key}</span><b>${safe(value)}</b></div>
  `).join("");

  notify("NEW PLANET GENERATED");
}

$("generatePlanet").addEventListener("click", generatePlanet);

$("savePlanet").addEventListener("click", () => {
  if (!currentPlanet) {
    notify("GENERATE A PLANET FIRST");
    return;
  }

  if (state.planets.some(p => p.name === currentPlanet.name)) {
    notify("PLANET ALREADY DISCOVERED");
    return;
  }

  state.planets.push({ ...currentPlanet });
  state.discoveries.push(currentPlanet.name);
  state.energy += 20;

  log("PLANET DISCOVERED", currentPlanet.name + " added to your archive.");
  renderPlanetHistory();
  render();
  notify("PLANET SAVED +20 ENERGY");
});

function renderPlanetHistory() {
  $("planetHistory").innerHTML = state.planets.length
    ? state.planets.slice(-12).reverse().map(p => `
      <div class="feed-item"><b>${safe(p.name)}</b><p>${safe(p.type)}</p></div>
    `).join("")
    : '<p class="muted">No planets discovered yet.</p>';
}

// =================================================
// TIMELINE ENGINE
// =================================================

function renderTimeline() {
  const history = $("fullTimeline");
  if (!history) return;

  history.innerHTML = state.events.length
    ? state.events.slice().reverse().map(e => `
      <div class="timeline-item">
        <b>${safe(e.name)}</b>
        <p>${safe(e.description)}</p>
        <small>${safe(e.time)}</small>
      </div>
    `).join("")
    : '<p class="muted">Your universe history is waiting to be written.</p>';

  $("branches").innerHTML = state.branches.map(b => `
    <div class="branch">⌁ <b>${safe(b.name)}</b> — ${safe(b.time)}</div>
  `).join("");
}

$("createTimeline").addEventListener("click", () => {
  const input = $("timelineName");
  const name = input.value.trim();

  if (!name) {
    notify("ENTER A TIMELINE NAME");
    return;
  }

  state.branches.push({
    name,
    time: new Date().toLocaleTimeString()
  });

  state.changes++;
  input.value = "";

  log("TIMELINE CREATED", "Alternate reality: " + name);
  renderTimeline();
  notify("NEW TIMELINE BRANCH CREATED");
});

$("clearHistory").addEventListener("click", () => {
  if (!confirm("Clear all timeline history?")) return;

  state.events = [];
  renderTimeline();
  renderRecentEvents();
  save();
  notify("HISTORY CLEARED");
});

// =================================================
// MISSION CENTER
// =================================================

const missionTemplates = [
  { title: "REALITY ARCHITECT", desc: "Apply a new reality configuration.", reward: 120, type: "change" },
  { title: "COSMIC EXPLORER", desc: "Discover a new planet.", reward: 100, type: "planet" },
  { title: "DIMENSION WALKER", desc: "Travel to another universe.", reward: 150, type: "travel" },
  { title: "EVENT MASTER", desc: "Trigger a cosmic event.", reward: 100, type: "event" },
  { title: "ENERGY MANAGER", desc: "Save your universe.", reward: 50, type: "save" },
  { title: "TIMELINE CREATOR", desc: "Create an alternate timeline.", reward: 120, type: "timeline" },
  { title: "MARKET OPERATOR", desc: "Complete a resource trade.", reward: 90, type: "trade" }
];

function createMissions() {
  const shuffled = [...missionTemplates].sort(() => Math.random() - .5);

  state.missions = shuffled.slice(0, 5).map((m, i) => ({
    ...m,
    id: Date.now() + i,
    done: false
  }));

  renderMissions();
  save();
}

function renderMissions() {
  $("missionList").innerHTML = state.missions.map(m => `
    <div class="mission">
      <h3>⚑ ${safe(m.title)}</h3>
      <p>${safe(m.desc)}</p>
      <small>REWARD: +${m.reward} QUANTUM ENERGY</small>
      <button data-mission="${m.id}" ${m.done ? "disabled" : ""}>
        ${m.done ? "✓ COMPLETED" : "CLAIM MISSION"}
      </button>
    </div>
  `).join("");

  document.querySelectorAll("[data-mission]").forEach(button => {
    button.addEventListener("click", () => claimMission(Number(button.dataset.mission)));
  });
}

function claimMission(id) {
  const mission = state.missions.find(m => m.id === id);
  if (!mission || mission.done) return;

  const requirements = {
    change: state.changes > 0,
    planet: state.planets.length > 0,
    travel: state.activeDimension !== "EARTH-PRIME",
    event: state.events.some(e => Object.keys(cosmicEvents).some(k => e.name === cosmicEvents[k][0])),
    save: true,
    timeline: state.branches.length > 0,
    trade: state.trades > 0
  };

  if (!requirements[mission.type]) {
    notify("OBJECTIVE NOT YET COMPLETED");
    return;
  }

  mission.done = true;
  state.energy += mission.reward;
  state.rewards += mission.reward;
  state.completedMissions++;

  log("MISSION COMPLETED", mission.title + " | Reward: " + mission.reward);
  render();
  renderMissions();
  notify("MISSION REWARD CLAIMED");
}

$("newMissions").addEventListener("click", createMissions);

// =================================================
// ORACLE INTELLIGENCE
// =================================================

const oracleResponses = [
  "Your universe is evolving. Every choice changes its future.",
  "My analysis detects unknown possibilities beyond your current dimension.",
  "The quantum field is fluctuating. A new discovery may be close.",
  "There are more realities than your current scanner can detect.",
  "Creator, your next decision may become a turning point in history.",
  "The cosmic weather is unpredictable. Stay curious.",
  "A stable universe is not necessarily an interesting universe.",
  "My prediction: exploration will reveal something unexpected."
];

function oracleAnswer(question) {
  const q = question.toLowerCase();

  if (q.includes("hello") || q.includes("hi")) {
    return "Greetings, Creator Prem. ORACLE-09 is ready.";
  }

  if (q.includes("status") || q.includes("universe")) {
    return `Current universe: ${state.universeId}. Stability: ${state.stability}%. Chaos: ${state.chaos}%. Energy: ${state.energy}.`;
  }

  if (q.includes("energy")) {
    return "Your current quantum reserve is " + state.energy + " units. The Quantum Market can help you manage resources.";
  }

  if (q.includes("predict") || q.includes("future")) {
    return pick([
      "I predict a new dimension will soon enter your discovery log.",
      "The future is uncertain, but your universe has many possibilities.",
      "A major cosmic event could change your universe's story."
    ]);
  }

  if (q.includes("mystery")) {
    return pick([
      "Somewhere in the multiverse, a universe exists with no concept of time.",
      "Scientists in a fictional alternate dimension discovered a star that never shines.",
      "There may be a dimension where every decision creates a new reality."
    ]);
  }

  if (q.includes("prem")) {
    return "Creator Prem. Identity verified. All creative privileges enabled.";
  }

  if (q.includes("help")) {
    return "I can analyze your universe, predict fictional possibilities, explain your statistics and share cosmic mysteries.";
  }

  return pick(oracleResponses);
}

function addChat(message, type) {
  const bubble = document.createElement("div");
  bubble.className = "bubble " + type;
  bubble.textContent = message;

  $("oracleChat").appendChild(bubble);
  $("oracleChat").scrollTop = $("oracleChat").scrollHeight;
}

$("oracleForm").addEventListener("submit", event => {
  event.preventDefault();

  const input = $("oracleInput");
  const question = input.value.trim();

  if (!question) return;

  addChat(question, "user");
  input.value = "";

  setTimeout(() => {
    addChat(oracleAnswer(question), "oracle");
  }, 350);
});

document.querySelectorAll("[data-question]").forEach(button => {
  button.addEventListener("click", () => {
    addChat(button.dataset.question, "user");
    setTimeout(() => {
      addChat(oracleAnswer(button.dataset.question), "oracle");
    }, 350);
  });
});

// =================================================
// QUANTUM MARKET
// =================================================

const resources = [
  { name: "STARDUST", icon: "✦", description: "Cosmic particles from distant stars.", base: 120 },
  { name: "DARK MATTER", icon: "◉", description: "A mysterious invisible substance.", base: 250 },
  { name: "NEBULA GAS", icon: "☁", description: "A rare cosmic energy source.", base: 80 },
  { name: "TIME CRYSTAL", icon: "◇", description: "A fictional temporal artifact.", base: 400 },
  { name: "VOID SHARD", icon: "⬡", description: "Fragment of an unknown dimension.", base: 180 },
  { name: "QUANTUM CORE", icon: "◎", description: "A high-value energy component.", base: 320 }
];

function renderMarket() {
  $("marketGrid").innerHTML = resources.map((r, i) => `
    <div class="market-item">
      <div class="resource-icon">${r.icon}</div>
      <h3>${r.name}</h3>
      <p>${r.description}</p>
      <b>${state.marketPrices[i]} Q-UNITS</b>
      <button data-buy="${i}">PURCHASE RESOURCE</button>
    </div>
  `).join("");

  document.querySelectorAll("[data-buy]").forEach(button => {
    button.addEventListener("click", () => buyResource(Number(button.dataset.buy)));
  });

  $("tradeHistory").innerHTML = state.tradeHistory.length
    ? state.tradeHistory.slice(-10).reverse().map(t => `
      <div class="feed-item"><b>${safe(t.name)}</b><p>${safe(t.price)} Q-UNITS</p></div>
    `).join("")
    : '<p class="muted">No trades yet.</p>';
}

function buyResource(index) {
  const resource = resources[index];
  const price = state.marketPrices[index];

  if (state.energy < price) {
    notify("INSUFFICIENT QUANTUM CREDITS");
    return;
  }

  state.energy -= price;
  state.trades++;

  state.tradeHistory.push({ name: resource.name, price });

  log("MARKET PURCHASE", resource.name + " acquired.");
  render();
  renderMarket();
  notify(resource.name + " PURCHASED");
}

setInterval(() => {
  state.marketPrices = resources.map((r, i) =>
    clamp(
      state.marketPrices[i] + random(-15, 15),
      Math.max(10, r.base - 100),
      r.base + 150
    )
  );

  if ($("market").classList.contains("active")) renderMarket();
  save();
}, 30000);

// =================================================
// DATA VAULT
// =================================================

function renderNotes() {
  $("notes").innerHTML = state.notes.length
    ? state.notes.map((note, i) => `
      <div class="note">
        <b>${safe(note.title)}</b>
        <p>${safe(note.body)}</p>
        <button data-delete-note="${i}">DELETE NOTE ×</button>
      </div>
    `).join("")
    : '<p class="muted">Your archive is empty.</p>';

  document.querySelectorAll("[data-delete-note]").forEach(button => {
    button.addEventListener("click", () => {
      state.notes.splice(Number(button.dataset.deleteNote), 1);
      renderNotes();
      save();
      notify("NOTE DELETED");
    });
  });
}

$("saveNote").addEventListener("click", () => {
  const title = $("noteTitle").value.trim();
  const body = $("noteBody").value.trim();

  if (!title || !body) {
    notify("ENTER A TITLE AND NOTE");
    return;
  }

  if (state.notes.length >= 50) {
    notify("VAULT LIMIT REACHED");
    return;
  }

  state.notes.push({ title, body });

  $("noteTitle").value = "";
  $("noteBody").value = "";

  renderNotes();
  save();
  notify("NOTE SECURELY SAVED");
});

// =================================================
// COMMAND TERMINAL
// =================================================

function printTerminal(message, type = "") {
  const line = document.createElement("div");
  line.className = type;
  line.textContent = "> " + message;

  $("terminalOutput").appendChild(line);
  $("terminalOutput").scrollTop = $("terminalOutput").scrollHeight;

  while ($("terminalOutput").children.length > 100) {
    $("terminalOutput").removeChild($("terminalOutput").firstChild);
  }
}

function command(cmd) {
  const c = cmd.trim().toUpperCase();
  if (!c) return;

  printTerminal(c);

  switch (c) {
    case "HELP":
      [
        "AVAILABLE COMMANDS:",
        "STATUS - Universe statistics",
        "SCAN - Run a fictional scan",
        "HEAL - Stabilize reality",
        "BOOST - Add 100 energy",
        "PLANET - Generate a planet",
        "TRAVEL - Open multiverse",
        "MISSIONS - Open mission center",
        "ORACLE - Open intelligence",
        "MATRIX - Toggle matrix theme",
        "SAVE - Save universe",
        "WHOAMI - Creator identity",
        "CLEAR - Clear terminal",
        "REBOOT - Reset saved universe",
        "PREM / SHIV / KRISHNA / PHANTOM"
      ].forEach(line => printTerminal(line));
      break;

    case "STATUS":
      printTerminal(`STABILITY ${state.stability}% | CHAOS ${state.chaos}% | ENERGY ${state.energy}`);
      printTerminal(`DIMENSIONS ${state.dimensions} | CURRENT ${state.activeDimension}`);
      break;

    case "SCAN":
      printTerminal("SCANNING UNIVERSAL STRUCTURE...", "success");
      setTimeout(() => {
        printTerminal("SCAN COMPLETE. NO UNKNOWN ERROR DETECTED.", "success");
        printTerminal("REALITY INTEGRITY: " + state.stability + "%");
      }, 500);
      break;

    case "HEAL":
      healReality();
      printTerminal("HEALING PROTOCOL EXECUTED.", "success");
      break;

    case "BOOST":
      state.energy = Math.min(2000, state.energy + 100);
      render();
      printTerminal("100 ENERGY UNITS ADDED.", "success");
      break;

    case "PLANET":
      generatePlanet();
      navigate("planets");
      printTerminal("NEW PLANET GENERATED.", "success");
      break;

    case "TRAVEL":
      navigate("multiverse");
      printTerminal("MULTIVERSE MAP OPENED.");
      break;

    case "MISSIONS":
      navigate("missions");
      printTerminal("MISSION CONTROL OPENED.");
      break;

    case "ORACLE":
      navigate("oracle");
      printTerminal("ORACLE CONNECTION REQUESTED.");
      break;

    case "MATRIX":
      toggleMatrix();
      printTerminal("VISUAL REALITY MODE CHANGED.", "success");
      break;

    case "SAVE":
      save();
      printTerminal("UNIVERSE SAVED SUCCESSFULLY.", "success");
      break;

    case "WHOAMI":
      printTerminal("IDENTITY: CREATOR PREM", "success");
      printTerminal("ACCESS LEVEL: CREATOR");
      printTerminal("UNIVERSE: " + state.universeId);
      break;

    case "CLEAR":
      $("terminalOutput").innerHTML = "";
      break;

    case "PREM":
      printTerminal("WELCOME BACK, CREATOR PREM.", "success");
      printTerminal("THE MULTIVERSE RECOGNIZES YOU.");
      notify("PREM EASTER EGG UNLOCKED");
      break;

    case "SHIV":
      printTerminal("SHIV DETECTED. SECONDARY CREATOR IDENTIFIED.", "success");
      break;

    case "KRISHNA":
      printTerminal("KRISHNA DETECTED. LEGENDARY CREATOR STATUS.", "success");
      break;

    case "PHANTOM":
      printTerminal("PHANTOM NETWORK SIGNAL DETECTED.", "success");
      break;

    case "MATRIX":
      break;

    case "REBOOT":
      if (confirm("This will erase your saved universe. Continue?")) {
        localStorage.removeItem("paradoxEngineX");
        location.reload();
      }
      break;

    default:
      printTerminal("UNKNOWN COMMAND. TYPE HELP.", "error");
  }

  save();
}

$("terminalForm").addEventListener("submit", event => {
  event.preventDefault();
  command($("terminalInput").value);
  $("terminalInput").value = "";
});

document.querySelectorAll("[data-command]").forEach(button => {
  button.addEventListener("click", () => command(button.dataset.command));
});

// =================================================
// MATRIX MODE
// =================================================

function toggleMatrix() {
  state.matrix = !state.matrix;
  document.body.classList.toggle("matrix", state.matrix);
  save();
  notify(state.matrix ? "MATRIX MODE ENABLED" : "MATRIX MODE DISABLED");
}

$("themeBtn").addEventListener("click", toggleMatrix);

// =================================================
// COSMIC WEATHER
// =================================================

const weatherTypes = [
  "CLEAR SPACE",
  "NEBULA STORM",
  "QUANTUM RAIN",
  "SOLAR WINDS",
  "COSMIC FOG",
  "STARFALL",
  "VOID DISTURBANCE"
];

setInterval(() => {
  state.lastWeather = pick(weatherTypes);
  render();
  notify("COSMIC WEATHER: " + state.lastWeather);
}, 45000);

// =================================================
// PARTICLE BACKGROUND
// =================================================

const canvas = $("space");
const ctx = canvas.getContext("2d");

let particles = [];

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  particles = Array.from({ length: 130 }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 1.5 + .3,
    v: Math.random() * .4 + .1,
    a: Math.random() * .6 + .2
  }));
}

function animate() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  particles.forEach(p => {
    p.y -= p.v;

    if (p.y < 0) {
      p.y = innerHeight;
      p.x = Math.random() * innerWidth;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(120,160,255,${p.a})`;
    ctx.fill();
  });

  requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);

// =================================================
// SIMULATION CLOCK
// =================================================

setInterval(() => {
  state.seconds++;
  updateClock();

  if (state.seconds % 15 === 0) {
    state.energy = Math.min(2000, state.energy + 5);
    render();
  } else if (state.seconds % 5 === 0) {
    save();
  }
}, 1000);

// =================================================
// EXPORT AND SAVE
// =================================================

$("saveBtn").addEventListener("click", () => {
  save();
  notify("UNIVERSE DATA SAVED");
});

function exportUniverse() {
  const file = new Blob(
    [JSON.stringify(state, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(file);
  const a = document.createElement("a");

  a.href = url;
  a.download = "paradox-universe-backup.json";
  a.click();

  URL.revokeObjectURL(url);
}

// =================================================
// INITIALIZATION
// =================================================

load();

$("gravity").value = state.gravity;
$("timeFlow").value = state.timeFlow;
$("flux").value = state.flux;
$("entropy").value = state.entropy;

sliders.forEach(([input, output]) => {
  $(output).textContent = $(input).value;
});

$("soundBtn").textContent = state.sound ? "♫ ON" : "♫";
document.body.classList.toggle("matrix", state.matrix);

if (state.missions.length === 0) {
  createMissions();
}

resize();
animate();
render();
renderUniverses();
renderTimeline();
renderPlanetHistory();
renderMissions();
renderMarket();
renderNotes();

log("ENGINE INITIALIZED", "PARADOX ENGINE X is online.");

printTerminal("CREATOR: PREM", "success");
printTerminal("ALL SYSTEMS OPERATIONAL.", "success");

console.log("%c PARADOX ENGINE X ", "background:#080813;color:#39eaff;font-size:22px;padding:12px");
console.log("Reality belongs to the creator.");
