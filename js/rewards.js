// Stjärnor, djurpark och nivåframsteg.

const ANIMALS = [
  ['🐶', 'hund'], ['🐱', 'katt'], ['🐭', 'mus'], ['🐹', 'hamster'], ['🐰', 'kanin'], ['🦊', 'räv'],
  ['🐻', 'björn'], ['🐼', 'panda'], ['🐨', 'koala'], ['🐯', 'tiger'], ['🦁', 'lejon'], ['🐮', 'ko'],
  ['🐷', 'gris'], ['🐸', 'groda'], ['🐵', 'apa'], ['🐔', 'höna'], ['🐧', 'pingvin'], ['🦆', 'anka'],
  ['🦉', 'uggla'], ['🐴', 'häst'], ['🦄', 'enhörning'], ['🐝', 'bi'], ['🐞', 'nyckelpiga'], ['🦋', 'fjäril'],
  ['🐢', 'sköldpadda'], ['🦎', 'ödla'], ['🐙', 'bläckfisk'], ['🦀', 'krabba'], ['🐠', 'fisk'], ['🐬', 'delfin'],
  ['🐳', 'val'], ['🦈', 'haj'], ['🐊', 'krokodil'], ['🦓', 'zebra'], ['🦒', 'giraff'], ['🐘', 'elefant'],
  ['🦛', 'flodhäst'], ['🦏', 'noshörning'], ['🐪', 'kamel'], ['🦘', 'känguru'], ['🦔', 'igelkott'], ['🦥', 'sengångare'],
  ['🦦', 'utter'], ['🦩', 'flamingo'], ['🦚', 'påfågel'], ['🦜', 'papegoja'], ['🐑', 'får'], ['🐐', 'get'],
  ['🦌', 'hjort'], ['🐿️', 'ekorre'], ['🦫', 'bäver'], ['🐺', 'varg'], ['🦭', 'säl'], ['🐌', 'snigel'],
];

const NEUTER = new Set(['bi', 'lejon', 'får']);
function withArticle(name) { return (NEUTER.has(name) ? 'ett ' : 'en ') + name; }

const UNLOCK_NEED = 8;   // rätt av
const UNLOCK_WINDOW = 10; // senaste

function starsFor(right, total) {
  const r = right / total;
  if (r >= 0.9) return 3;
  if (r >= 0.7) return 2;
  return 1;
}

function newAnimal(profile, gold) {
  const owned = new Set(profile.animals.map(a => a.e));
  const pool = ANIMALS.filter(([e]) => !owned.has(e));
  const [e, n] = pick(pool.length ? pool : ANIMALS);
  const a = { e, n, gold: !!gold, at: Date.now() };
  profile.animals.push(a);
  return a;
}

// Registrera ett svar. Returnerar true om nivån just låstes upp.
function recordAnswer(profile, task, correct) {
  const lv = task.level;
  const s = profile.stats[lv] || (profile.stats[lv] = { right: 0, total: 0 });
  s.total++;
  if (correct) s.right++;
  if (task.key) {
    const k = task.key;
    if (!correct) profile.mistakes[k] = (profile.mistakes[k] || 0) + 1;
    else if (profile.mistakes[k]) profile.mistakes[k] = Math.max(0, profile.mistakes[k] - 1);
  }
  if (task.review) return false;
  const r = profile.recent[lv] || (profile.recent[lv] = []);
  r.push(correct);
  while (r.length > UNLOCK_WINDOW) r.shift();
  return false;
}

function levelProgress(profile, lv) {
  const r = profile.recent[lv] || [];
  return { right: r.filter(Boolean).length, count: r.length };
}

// Kolla om nästa nivå ska låsas upp (efter ett avslutat pass).
function checkUnlock(profile) {
  const lv = profile.unlocked;
  if (lv >= MAX_LEVEL) return false;
  const { right } = levelProgress(profile, lv);
  if (right >= UNLOCK_NEED) {
    profile.unlocked = lv + 1;
    profile.current = lv + 1;
    return true;
  }
  return false;
}
