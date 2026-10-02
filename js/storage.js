// Sparar profiler, inställningar och "Min dag" i localStorage.

const STORE_KEY = 'klockkoll-v1';

const DEFAULT_DAY = [
  { id: 'd1', emoji: '⏰', text: 'Vi vaknar', h: 7, m: 0 },
  { id: 'd2', emoji: '🏫', text: 'Skolan börjar', h: 8, m: 15 },
  { id: 'd3', emoji: '🍎', text: 'Mellanmål', h: 15, m: 0 },
  { id: 'd4', emoji: '🍝', text: 'Vi äter middag', h: 17, m: 30 },
  { id: 'd5', emoji: '🛁', text: 'Bad och tandborstning', h: 19, m: 0 },
  { id: 'd6', emoji: '🛏️', text: 'Läggdags', h: 19, m: 30 },
];

const DEFAULT_SETTINGS = {
  autoSpeak: true,   // läs upp frågan automatiskt
  hints: true,       // visa tipsknapp för vuxna
  zones: 'auto',     // 'auto' | 'on' | 'off'
};

let db = null;

function freshDb() {
  return { profiles: [], settings: { ...DEFAULT_SETTINGS }, day: DEFAULT_DAY.map(d => ({ ...d })) };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      db = JSON.parse(raw);
      db.settings = { ...DEFAULT_SETTINGS, ...(db.settings || {}) };
      db.profiles = db.profiles || [];
      db.day = db.day || DEFAULT_DAY.map(d => ({ ...d }));
      return db;
    }
  } catch (e) { /* trasig eller blockerad lagring – börja om */ }
  db = freshDb();
  return db;
}

function saveDb() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { /* ignoreras */ }
}

function uid() { return Math.random().toString(36).slice(2, 9); }

function newProfile(name, avatar, level) {
  const p = {
    id: uid(),
    name,
    avatar,
    unlocked: level,     // högsta upplåsta nivå
    current: level,      // vald nivå att öva på
    placed: true,
    recent: {},          // nivå -> senaste resultat [true/false]
    stats: {},           // nivå -> { right, total }
    mistakes: {},        // "h:m" -> antal fel
    stars: 0,
    passes: 0,
    animals: [],         // [{ e, n, gold }]
    created: Date.now(),
  };
  db.profiles.push(p);
  saveDb();
  return p;
}

function getProfile(id) { return db.profiles.find(p => p.id === id); }

function deleteProfile(id) {
  db.profiles = db.profiles.filter(p => p.id !== id);
  saveDb();
}
