// Nivåer och generering av uppgifter.

const LEVELS = [
  { id: 1, name: 'Urtavlan', short: 'Korta och långa visaren', icon: '🕐', zones: 'none', minNums: false },
  { id: 2, name: 'Hela timmar', short: '"Klockan tre"', icon: '🕒', zones: 'none', minNums: false, main: [0], rest: [] },
  { id: 3, name: 'Halvtimmar', short: '"Halv fyra"', icon: '🕞', zones: 'none', minNums: false, main: [30], rest: [0] },
  { id: 4, name: 'Kvart', short: '"Kvart över" och "kvart i"', icon: '🕓', zones: 'half', minNums: false, main: [15, 45], rest: [0, 30] },
  { id: 5, name: 'Fem och tio', short: '"Tio över", "fem i"', icon: '🕔', zones: 'half', minNums: true, main: [5, 10, 50, 55], rest: [0, 15, 30, 45] },
  { id: 6, name: 'Runt halv', short: '"Fem i halv", "fem över halv"', icon: '🕕', zones: 'quarter', minNums: true, main: [20, 25, 35, 40], rest: [5, 10, 15, 45, 50, 55] },
  { id: 7, name: 'Digital tid', short: '14:30 är halv tre', icon: '📱', zones: 'quarter', minNums: true },
  { id: 8, name: 'Hur lång tid?', short: 'En kvart, en halvtimme', icon: '⏳', zones: 'half', minNums: true },
];
const MAX_LEVEL = LEVELS.length;
const ALL_FIVES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function levelById(id) { return LEVELS[id - 1]; }

// --- Slump ---
function rnd(n) { return Math.floor(Math.random() * n); }
function pick(arr) { return arr[rnd(arr.length)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function norm12(h) { return ((h % 12) + 12) % 12; }
function timeKey(h, m) { return h12(h) + ':' + pad(m); }

function pickMinute(level) {
  const L = levelById(level);
  if (!L.rest || !L.rest.length || Math.random() < 0.7) return pick(L.main);
  return pick(L.rest);
}

// Välj en tid för nivån – ibland en tid barnet tidigare haft fel på.
function pickTime(level, profile, used) {
  const L = levelById(level);
  const allowed = new Set([...(L.main || []), ...(L.rest || [])]);
  if (profile && Math.random() < 0.3) {
    const hard = Object.entries(profile.mistakes || {})
      .filter(([k, n]) => n > 0 && allowed.has(+k.split(':')[1]) && !used.has(k));
    if (hard.length) {
      const [k] = pick(hard);
      const [hh, mm] = k.split(':').map(Number);
      return { h: norm12(hh), m: mm };
    }
  }
  for (let i = 0; i < 30; i++) {
    const t = { h: rnd(12), m: pickMinute(level) };
    if (!used.has(timeKey(t.h, t.m))) return t;
  }
  return { h: rnd(12), m: pickMinute(level) };
}

// Troliga felsvar – vanliga missförstånd först.
function distractorTimes(h, m) {
  const pri = [];
  const add = (hh, mm) => pri.push({ h: norm12(hh), m: mm });
  switch (m) {
    case 0: add(h + 1, 0); add(h - 1, 0); add(h + 2, 0); break;
    case 30: add(h - 1, 30); add(h, 0); add(h + 1, 30); add(h + 1, 0); break;
    case 15: add(h, 45); add(h - 1, 45); add(h + 1, 15); break;
    case 45: add(h, 15); add(h + 1, 15); add(h - 1, 45); break;
    case 25: add(h, 35); add(h - 1, 25); add(h, 5); break;
    case 35: add(h, 25); add(h + 1, 35); add(h, 55); break;
    case 20: add(h, 40); add(h - 1, 20); add(h, 10); break;
    case 40: add(h, 20); add(h + 1, 40); add(h, 50); break;
    default: add(h, 60 - m); add(h + (m < 30 ? -1 : 1), m); add(h, m < 30 ? m + 5 : m - 5);
  }
  return pri;
}

function textChoices(h, m, toText) {
  const correct = toText(h, m);
  const seen = new Set([correct]);
  const wrong = [];
  const cands = distractorTimes(h, m);
  // Ta de två första med lite slump bland de tre bästa.
  const top = shuffle(cands.slice(0, 3)).concat(cands.slice(3));
  for (const c of top) {
    const t = toText(c.h, c.m);
    if (!seen.has(t)) { seen.add(t); wrong.push(t); }
    if (wrong.length === 2) break;
  }
  return shuffle([{ label: correct, correct: true }, ...wrong.map(w => ({ label: w, correct: false }))]);
}

function readHint(m) {
  if (m === 0) return 'Fråga: Var pekar den långa visaren? Rakt upp betyder jämnt. Vilken siffra pekar den korta visaren på?';
  if (m === 30) return 'Fråga: Den långa visaren pekar rakt ner – vad betyder det? Vilken siffra är den korta visaren på väg mot? Halv betyder "halvvägs till" nästa timme.';
  if (m === 15 || m === 45) return 'Fråga: Är den långa visaren på över-sidan eller på i-sidan? Vilken timme har den korta visaren passerat?';
  if (m === 25 || m === 35 || m === 20 || m === 40) return 'Hitta halv (siffran 6). Är den långa visaren strax före eller strax efter? Räkna femsteg dit.';
  return 'Räkna femsteg med den långa visaren: 5, 10, 15 … Är den på över-sidan eller i-sidan?';
}

// --- Uppgiftstyper ---

function taskTapHand() {
  const want = Math.random() < 0.5 ? 'hour' : 'minute';
  const h = 1 + rnd(10);
  return {
    type: 'tapHand', want,
    clock: { h, m: 0, mode: 'tap' },
    prompt: want === 'hour' ? 'Tryck på den korta visaren!' : 'Tryck på den långa visaren!',
    say: want === 'hour' ? 'Tryck på den korta visaren. Den heter timvisaren.' : 'Tryck på den långa visaren. Den heter minutvisaren.',
    explain: 'Den korta röda visaren är timvisaren. Den långa blå visaren är minutvisaren.',
    hint: 'Låt barnet peka på båda visarna och säga vilken som är längst.',
    key: null,
  };
}

function taskPointNumber() {
  if (Math.random() < 0.55) {
    const h = 1 + rnd(11);
    const nums = shuffle([h, 12, pick([h + 1, h - 1].filter(n => n >= 1 && n < 12 && n !== h))]);
    return {
      type: 'choice', kind: 'pointNumber',
      clock: { h, m: 0 },
      prompt: 'Vilken siffra pekar den korta visaren på?',
      say: 'Vilken siffra pekar den korta visaren på?',
      choices: nums.map(n => ({ label: String(n), correct: n === h })),
      explain: `Den korta visaren pekar på ${h}. Den långa visaren pekar på 12.`,
      hint: 'Följ den korta, röda visaren med fingret ut till siffran.',
      key: null,
    };
  }
  const m = 5 * (1 + rnd(11));
  const pos = m / 5;
  let h = 1 + rnd(11);
  if (Math.abs(h - pos) < 2) h = norm12(h + 5) || 12;
  const nums = shuffle([pos, h12(h), pos === 11 ? 10 : pos + 1]);
  return {
    type: 'choice', kind: 'pointNumber',
    clock: { h, m },
    prompt: 'Vilken siffra pekar den långa visaren på?',
    say: 'Vilken siffra pekar den långa visaren på?',
    choices: nums.map(n => ({ label: String(n), correct: n === pos })),
    explain: `Den långa blå visaren pekar på ${pos}.`,
    hint: 'Följ den långa, blå visaren med fingret ut till siffran.',
    key: null,
  };
}

function taskRead(level, profile, used) {
  const { h, m } = pickTime(level, profile, used);
  const alt = altWords(h, m);
  return {
    type: 'choice', kind: 'read',
    clock: { h, m },
    prompt: 'Vad är klockan?',
    say: 'Vad är klockan?',
    choices: textChoices(h, m, timePhrase),
    explain: explain(h, m) + (alt ? ` Man kan också säga ${alt}.` : ''),
    hint: readHint(m),
    key: timeKey(h, m), h, m,
  };
}

function taskSet(level, profile, used) {
  let t;
  do { t = pickTime(level, profile, used); } while (t.h === 0 && t.m === 0);
  const words = timeToWords(t.h, t.m);
  return {
    type: 'set',
    clock: { h: 0, m: 0, mode: 'drag' },
    target: t,
    prompt: `Ställ klockan på ${words}.`,
    say: `Ställ klockan på ${words}.`,
    explain: explain(t.h, t.m),
    hint: `Börja med den långa visaren – var ska den stå för "${words}"? Flytta sedan den korta visaren.`,
    key: timeKey(t.h, t.m), h: t.h, m: t.m,
  };
}

function pick24() {
  const h = 6 + rnd(16); // 06–21
  return { h, m: pick(ALL_FIVES) };
}

function digitalExplain(h, m) {
  const hh = h % 24;
  if (hh > 12) {
    return `${digital24(hh, m)}: timmen är större än 12, så vi tar bort 12. ${hh} − 12 = ${hh - 12}. Klockan är ${timeToWords(hh, m)} ${partOfDay(hh)}.`;
  }
  return `${digital24(hh, m)} är ${timeToWords(hh, m)} ${partOfDay(hh)}.`;
}

function taskDigitalRead() {
  const { h, m } = pick24();
  const choices = textChoices(h, m, timePhrase);
  // Vanligt fel: läsa sista siffran i timmen (14 -> "fyra").
  if (h > 12 && h % 10 !== h - 12) {
    const naive = timePhrase(h % 10, m);
    if (!choices.some(c => c.label === naive)) {
      const i = choices.findIndex(c => !c.correct);
      choices[i] = { label: naive, correct: false };
    }
  }
  return {
    type: 'choice', kind: 'digitalRead',
    clock: null, digital: digital24(h, m),
    prompt: 'Vad är klockan?',
    say: 'Vad är klockan? Titta på den digitala klockan.',
    choices,
    explain: digitalExplain(h, m),
    hint: 'Om timmen är större än 12 – ta bort 12. Vad blir kvar?',
    key: null, h, m,
  };
}

function taskToDigital() {
  const { h, m } = pick24();
  const correct = digital24(h, m);
  const other = digital24((h + 12) % 24, m);
  const off = digital24(m === 30 ? h + 1 : h + pick([1, -1]), m);
  const set = [correct, other, off].filter((v, i, a) => a.indexOf(v) === i);
  if (set.length < 3) set.push(digital24(h - 1, m));
  return {
    type: 'choice', kind: 'toDigital',
    clock: { h, m }, part: partOfDay(h),
    prompt: `Det är ${partOfDayNoun(h)}. Vilken digital tid är det?`,
    say: `Det är ${partOfDayNoun(h)}. Vilken digital tid visar klockan?`,
    choices: shuffle(set.slice(0, 3).map(v => ({ label: v, correct: v === correct }))),
    explain: h > 12
      ? `Klockan är ${timeToWords(h, m)} ${partOfDay(h)}. Efter tolv på dagen lägger vi till 12: ${h - 12} + 12 = ${h}. Det blir ${correct}.`
      : `Klockan är ${timeToWords(h, m)} ${partOfDay(h)}. Det blir ${correct}.`,
    hint: 'Läs först den analoga klockan. Är det efter tolv på dagen? Lägg då till 12 på timmen.',
    key: null, h, m,
  };
}

function taskSetDigital() {
  const { h, m } = pick24();
  return {
    type: 'set',
    clock: { h: 0, m: 0, mode: 'drag' },
    target: { h: norm12(h), m },
    digital: digital24(h, m),
    prompt: `Ställ klockan på ${digital24(h, m)}.`,
    say: `Ställ klockan på ${timeToWords(h, m)}, ${partOfDay(h)}.`,
    explain: digitalExplain(h, m),
    hint: 'Vad blir timmen om du tar bort 12? Börja sedan med den långa visaren.',
    key: null, h, m,
  };
}

const ACTIVITIES = [
  { e: '🎬', t: 'Filmen' }, { e: '⚽', t: 'Fotbollsträningen' }, { e: '🏊', t: 'Simskolan' },
  { e: '🎂', t: 'Kalaset' }, { e: '🎨', t: 'Pysslet' }, { e: '🚗', t: 'Bilresan' }, { e: '🎹', t: 'Pianolektionen' },
];
const DURATIONS = [15, 30, 45, 60, 90, 120];

function durationRule(d) {
  if (d === 15) return 'En kvart är när den långa visaren går tre siffror.';
  if (d === 30) return 'En halvtimme är när den långa visaren går ett halvt varv.';
  if (d === 45) return 'Tre kvart är när den långa visaren går tre fjärdedelar av ett varv.';
  if (d === 60) return 'En timme är när den långa visaren går ett helt varv.';
  if (d === 90) return 'Ett helt varv och ett halvt varv till – en och en halv timme.';
  return 'Två hela varv med den långa visaren – två timmar.';
}

function taskDuration() {
  const a = pick(ACTIVITIES);
  const h1 = 1 + rnd(10);
  const m1 = pick([0, 15, 30, 45]);
  const d = pick(DURATIONS);
  const end = h1 * 60 + m1 + d;
  const h2 = Math.floor(end / 60), m2 = end % 60;
  const opts = shuffle(DURATIONS.filter(x => x !== d)).slice(0, 2).concat(d);
  return {
    type: 'choice', kind: 'duration',
    clock: null, pair: { h1, m1, h2, m2 },
    prompt: `${a.e} ${a.t} börjar ${timePhrase(h1, m1)} och slutar ${timePhrase(h2, m2)}. Hur lång tid tar det?`,
    say: `${a.t} börjar ${timePhrase(h1, m1)} och slutar ${timePhrase(h2, m2)}. Hur lång tid tar det?`,
    choices: shuffle(opts.map(x => ({ label: durationWords(x), correct: x === d }))),
    explain: `Från ${timePhrase(h1, m1)} till ${timePhrase(h2, m2)} är det ${durationWords(d)}. ${durationRule(d)}`,
    hint: 'Följ den långa visaren från första klockan till den andra. Hur långt har den gått?',
    key: null,
  };
}

function taskLater() {
  const h1 = 1 + rnd(10);
  const m1 = pick([0, 15, 30, 45]);
  const d = pick([15, 30, 60]);
  const end = h1 * 60 + m1 + d;
  const t = { h: norm12(Math.floor(end / 60)), m: end % 60 };
  return {
    type: 'set',
    clock: { h: h1, m: m1, mode: 'drag' },
    target: t,
    prompt: `Klockan är ${timeToWords(h1, m1)}. Vad är klockan om ${durationWords(d)}? Ställ klockan!`,
    say: `Klockan är ${timeToWords(h1, m1)}. Vad är klockan om ${durationWords(d)}? Ställ klockan.`,
    explain: `${capitalize(timePhrase(h1, m1))} och ${durationWords(d)} till blir ${timePhrase(t.h, t.m)}. ${durationRule(d)}`,
    hint: 'Flytta den långa visaren framåt, lika långt som tiden säger.',
    key: null,
  };
}

// Skapa en uppgift för en nivå.
// kind: 'read' | 'set' för nivå 2–6 (annars slump).
function makeTask(level, profile, used, kind) {
  let t;
  if (level === 1) t = Math.random() < 0.35 ? taskTapHand() : taskPointNumber();
  else if (level <= 6) {
    if (!kind) kind = Math.random() < 0.5 ? 'read' : 'set';
    t = kind === 'read' ? taskRead(level, profile, used) : taskSet(level, profile, used);
  }
  else if (level === 7) {
    const r = Math.random();
    t = r < 0.35 ? taskDigitalRead() : r < 0.7 ? taskToDigital() : taskSetDigital();
  } else t = Math.random() < 0.6 ? taskDuration() : taskLater();
  t.level = level;
  if (t.key) used.add(t.key);
  return t;
}

// Ett pass: 10 uppgifter, varav 2 repetition från tidigare nivåer.
function makePass(level, profile) {
  const used = new Set();
  const tasks = [];
  const review = level >= 3 ? 2 : 0;
  const n = 10 - review;
  // Hälften läsa, hälften ställa – läsa först i blandningen är lättast att komma igång med.
  const kinds = shuffle(Array.from({ length: n }, (_, i) => (i % 2 ? 'set' : 'read')));
  if (kinds[0] === 'set') { const j = kinds.indexOf('read'); [kinds[0], kinds[j]] = [kinds[j], kinds[0]]; }
  for (let i = 0; i < n; i++) tasks.push(makeTask(level, profile, used, kinds[i]));
  for (let i = 0; i < review; i++) {
    const t = makeTask(2 + rnd(level - 2), profile, used);
    t.review = true;
    tasks.splice(2 + rnd(tasks.length - 1), 0, t);
  }
  return tasks;
}

// Starttest: två läsuppgifter per nivå, från nivå 2 och uppåt.
function makePlacementTask(level) {
  const used = new Set();
  if (level <= 6) return Object.assign(taskRead(level, null, used), { level });
  return Object.assign(taskDigitalRead(), { level });
}

// Hjälpzoner/minutsiffror utifrån inställning och nivå.
function clockHelpers(level, settings) {
  const L = levelById(level);
  if (settings.zones === 'off') return { zones: 'none', minNums: false };
  if (settings.zones === 'on') return { zones: level >= 6 ? 'quarter' : 'half', minNums: true };
  return { zones: L.zones, minNums: L.minNums };
}
