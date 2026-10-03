// Mattekoll – nivåer och uppgifter i addition och subtraktion.
// Färgspråk i hela mattedelen: tiotal = blått, ental = orange.

const MINUS = '−';

const MATH_LEVELS = [
  { id: 1, name: 'Tiokamrater', short: '7 + 3 = 10', icon: '🔟' },
  { id: 2, name: 'Över tian', short: '8 + 5 och 13 − 6', icon: '🧮' },
  { id: 3, name: 'Tiotal och ental', short: '30 + 40, 4 tiotal och 7 ental', icon: '🧱' },
  { id: 4, name: 'Hoppa tiotal', short: '34 + 20 och 67 − 30', icon: '⬇️' },
  { id: 5, name: 'Fyll tiotalet', short: '47 + 8 och 52 − 6', icon: '🎯' },
  { id: 6, name: 'Plus med tvåsiffriga', short: '38 + 25', icon: '➕' },
  { id: 7, name: 'Minus med tvåsiffriga', short: '52 − 17 och 61 − 58', icon: '➖' },
  { id: 8, name: 'Lästal', short: 'Räkna med tal upp till 200', icon: '📖' },
];
const MATH_MAX = MATH_LEVELS.length;
function mathLevelById(id) { return MATH_LEVELS[id - 1]; }

// Uppgiftstyper – visas i vuxenläget ("svårast just nu").
const MATH_CATS = {
  friends10: 'Tiokamrater',
  add20: 'Plus över tian (inom 20)',
  sub20: 'Minus över tian (inom 20)',
  tens: 'Hela tiotal',
  place: 'Tiotal och ental',
  pm10: 'Plus/minus hela tiotal',
  add21: 'Tvåsiffrigt + ensiffrigt',
  sub21: 'Tvåsiffrigt − ensiffrigt',
  missing: 'Hur långt till tiotalet?',
  add22: 'Tvåsiffrigt + tvåsiffrigt',
  sub22: 'Tvåsiffrigt − tvåsiffrigt',
  countup: 'Räkna upp (tal nära varandra)',
  word: 'Lästal',
};

const MATH_HINTS = {
  friends10: 'Fråga: Hur många rutor är tomma? Vilka två tal blir 10 tillsammans?',
  add20: 'Fråga: Hur många behövs för att fylla tian? Hur många är kvar sen?',
  sub20: 'Fråga: Hur mycket ska du ta bort för att komma ner till 10? Hur mycket är kvar att ta bort sen?',
  tens: 'Fråga: Hur många tiostavar blir det? Tre tiotal och fyra tiotal är sju tiotal – alltså 70.',
  place: 'Fråga: Hur många tiostavar? Hur många små kuber? Vilken siffra skrivs först?',
  pm10: 'Fråga: Var hamnar du om du går ett steg rakt ner på rutan? Vilken siffra ändras – och vilken är densamma?',
  add21: 'Fråga: Vilket är nästa hela tiotal? Hur långt är det dit? Hur mycket är kvar sen?',
  sub21: 'Fråga: Hur långt är det ner till det hela tiotalet? Hur mycket är kvar att ta bort sen?',
  missing: 'Fråga: Hur många steg är det till nästa hela tiotal? Räkna på rutan.',
  add22: 'Fråga: Hur många tiotal har det andra talet? Kan du hoppa dem först – rakt ner på rutan?',
  sub22: 'Fråga: Ta bort tiotalen först – rakt upp på rutan. Hur många ental är kvar att ta bort sen?',
  countup: 'Fråga: Talen ligger nära varandra. Kan du räkna upp från det mindre talet i stället för att ta bort?',
  word: 'Läs texten högt tillsammans. Fråga: Blir det fler eller färre? Är det plus eller minus?',
};

// Typer där barnet kan hoppa själv på hundrarutan.
const HOP_CATS = new Set(['pm10', 'add21', 'sub21', 'add22', 'sub22']);
// Typer som kan byggas om från "a op b" (för att öva igen på det som blev fel).
const REBUILD_CATS = new Set(['add20', 'sub20', 'tens', 'pm10', 'add21', 'sub21', 'add22', 'sub22', 'countup']);

// --- Små hjälpare ---
function between(lo, hi) { return lo + rnd(hi - lo + 1); }
function opSign(op) { return op === '+' ? '+' : MINUS; }
function calc(a, op, b) { return op === '+' ? a + b : a - b; }
function exprText(a, op, b) { return `${a} ${opSign(op)} ${b}`; }
// Text för uppläsning: "38 + 25 = 63" -> "38 plus 25 är 63".
function mathSay(s) {
  return s.replace(/−/g, ' minus ').replace(/\+/g, ' plus ').replace(/=/g, ' är ').replace(/[?▢]/g, '').replace(/\s+/g, ' ').trim();
}

// --- Hopp (strategier) ---
function J(from, to) { return { from, to }; }

// Ental: dela hoppet vid tiotalet om det passeras ("fyll tiotalet först").
function onesJumps(a, d) {
  const out = [];
  if (!d) return out;
  if (d > 0) {
    const toTen = (10 - a % 10) % 10;
    if (toTen > 0 && d > toTen) { out.push(J(a, a + toTen)); a += toTen; d -= toTen; }
  } else {
    const down = a % 10;
    if (down > 0 && -d > down) { out.push(J(a, a - down)); a -= down; d += down; }
  }
  out.push(J(a, a + d));
  return out;
}

// Tiotal: ett hopp, eller ett hopp per tiotal (split).
function tensJumps(a, d, split) {
  if (!d) return [];
  if (!split) return [J(a, a + d)];
  const out = [];
  const s = Math.sign(d);
  for (let k = 0; k < Math.abs(d) / 10; k++) { out.push(J(a, a + 10 * s)); a += 10 * s; }
  return out;
}

// "Tiotalen först, sen entalen."
function tensFirstJumps(a, op, b, split = false) {
  const d = op === '+' ? b : -b;
  const tens = Math.trunc(d / 10) * 10;
  return tensJumps(a, tens, split).concat(onesJumps(a + tens, d - tens));
}

// Räkna upp från det mindre talet till det större.
function countUpJumps(from, to) {
  const out = [];
  let x = from;
  const toTen = (10 - x % 10) % 10;
  if (toTen && x + toTen <= to) { out.push(J(x, x + toTen)); x += toTen; }
  const tens = Math.floor((to - x) / 10) * 10;
  if (tens) { out.push(J(x, x + tens)); x += tens; }
  if (to > x) out.push(J(x, to));
  return out;
}

function stepText(j) {
  return `${j.from} ${j.to >= j.from ? '+' : MINUS} ${Math.abs(j.to - j.from)} = ${j.to}`;
}
function stepsSentence(jumps) {
  return jumps.map((j, i) => (i ? 'Sen ' : '') + stepText(j)).join('. ') + '.';
}

// --- Felsvar som bygger på vanliga missförstånd ---
function addErrors(a, b) {
  const s = a + b, c = [];
  const ones = a % 10 + b % 10;
  if (ones >= 10 && a >= 10) {
    c.push(+(String(Math.floor(a / 10) + Math.floor(b / 10)) + ones)); // 47 + 8 -> "415"
    c.push(s - 10);                                                    // glömt tiotalet man fick
  }
  c.push(s + 10, s - 1, s + 1);
  return c;
}

function subErrors(a, b) {
  const d = a - b, c = [];
  if ((a >= 20 || b >= 10) && a % 10 < b % 10) {
    // Minsta från största i varje kolumn: 52 − 17 -> 45, 52 − 6 -> 54.
    c.push((Math.floor(a / 10) - Math.floor(b / 10)) * 10 + (b % 10 - a % 10));
    c.push(d - 10);
  }
  c.push(d + 10, d + 1, d - 1);
  return c;
}

// Tre svarsalternativ. Det första felsvaret (det vanligaste felet) kommer alltid med.
function numberChoices(correct, cands) {
  const seen = new Set([correct]);
  const wrong = [];
  const list = cands.slice(0, 1).concat(shuffle(cands.slice(1, 4)), cands.slice(4),
    [correct + 1, correct - 1, correct + 2, correct + 10, correct + 3]);
  for (const c of list) {
    if (!Number.isInteger(c) || c < 0 || seen.has(c)) continue;
    seen.add(c);
    wrong.push(c);
    if (wrong.length === 2) break;
  }
  return shuffle([{ label: String(correct), correct: true }, ...wrong.map(w => ({ label: String(w), correct: false }))]);
}

// --- Tiorutor: varje ruta är en lista med 10 celler: 'a' | 'b' | 'x' (borttagen) | '' ---
function fr(...groups) {
  const c = [];
  groups.forEach(([s, n]) => { for (let i = 0; i < n; i++) c.push(s); });
  while (c.length < 10) c.push('');
  return c;
}

// --- Bygg en räkneuppgift från a op b ---
const LEADS = {
  add20: 'Fyll tian först!',
  sub20: 'Gå ner till 10 först!',
  add21: 'Hoppa till nästa hela tiotal först.',
  sub21: 'Hoppa ner till det hela tiotalet först.',
  add22: 'Ta tiotalen först, sen entalen.',
  sub22: 'Ta bort tiotalen först, sen entalen.',
};

function buildArith(level, cat, a, op, b) {
  const ans = calc(a, op, b);
  const t = {
    level, cat, kind: 'choice', a, op, b, ans, start: a,
    expr: `${exprText(a, op, b)} = ?`,
    prompt: 'Vad blir det?',
    say: `Vad är ${a} ${op === '+' ? 'plus' : 'minus'} ${b}?`,
    choices: numberChoices(ans, op === '+' ? addErrors(a, b) : subErrors(a, b)),
    jumps: tensFirstJumps(a, op, b, cat === 'pm10'),
    visual: 'grid',
    hint: MATH_HINTS[cat],
    key: `${level}|${a}${op}${b}|${cat}`,
  };
  const done = `${exprText(a, op, b)} = ${ans}.`;
  if (cat === 'pm10') {
    const dir = op === '+' ? 'ner' : 'upp';
    t.explain = `Varje tiotal är ett steg rakt ${dir} på rutan. Tiotalssiffran ändras, men entalssiffran är densamma. ${done}`;
  } else {
    t.explain = `${LEADS[cat] || ''} ${stepsSentence(t.jumps)}`.trim();
  }
  if (cat === 'add20') {
    t.visual = 'frames';
    const fill = 10 - a;
    t.frames = { before: [fr(['a', a]), fr(['b', b])], after: [fr(['a', a], ['b', fill]), fr(['b', b - fill])] };
  } else if (cat === 'sub20') {
    t.visual = 'frames';
    const ones = a - 10, rest = b - ones;
    t.frames = { before: [fr(['a', 10]), fr(['a', ones])], after: [fr(['a', 10 - rest], ['x', rest]), fr(['x', ones])] };
  } else if (cat === 'tens') {
    t.visual = 'blocks';
    const x = a / 10, y = b / 10;
    t.blocks = op === '+'
      ? { before: { groups: [{ t: x }, { t: y }], op }, after: { groups: [{ t: x + y }] } }
      : { before: { groups: [{ t: x }] }, after: { groups: [{ t: x, gone: y }] } };
    t.choices = numberChoices(ans, [ans / 10, ans + 10, ans - 10]);
    t.jumps = [J(a, ans)];
    t.explain = `${x} tiotal ${opSign(op)} ${y} tiotal = ${ans / 10} tiotal. ${done}`;
  } else if (cat === 'countup') {
    t.start = b;
    t.jumps = countUpJumps(b, a);
    t.explain = `Talen ligger nära varandra – räkna upp från ${b}! ${stepsSentence(t.jumps)} Det blev ${ans} steg, så ${done}`;
  }
  return t;
}

// --- Slumpa tal per typ ---
function genTens() {
  if (Math.random() < 0.5) { const x = between(1, 8); return [x * 10, '+', between(1, 9 - x) * 10]; }
  const x = between(3, 9);
  return [x * 10, '-', between(1, x - 1) * 10];
}

function genPm10() {
  for (;;) {
    const a = between(11, 89);
    if (a % 10 === 0) continue;
    const b = pick([10, 10, 20, 20, 30, 40]);
    const op = Math.random() < 0.55 ? '+' : '-';
    const r = calc(a, op, b);
    if (r >= 1 && r <= 99) return [a, op, b];
  }
}

function genAdd21() {
  const o = between(2, 9), tt = between(1, 8);
  return [tt * 10 + o, '+', between(11 - o, 9)];
}

function genSub21() {
  const o = between(0, 7), tt = between(2, 9);
  return [tt * 10 + o, '-', between(o + 1, 9)];
}

function genAdd22() {
  const cross = Math.random() < 0.75;
  for (let i = 0; i < 200; i++) {
    const a = between(12, 78), b = between(11, 87);
    if (a % 10 === 0 || b % 10 === 0 || a + b > 99) continue;
    if ((a % 10 + b % 10 >= 10) !== cross) continue;
    return [a, '+', b];
  }
  return [38, '+', 25];
}

function genSub22() {
  const cross = Math.random() < 0.75;
  for (let i = 0; i < 200; i++) {
    const a = between(31, 98), b = between(11, a - 5);
    if (b % 10 === 0 || a - b < 5) continue;
    if ((a % 10 < b % 10) !== cross) continue;
    return [a, '-', b];
  }
  return [52, '-', 17];
}

function genCountUp() {
  const a = between(3, 9) * 10 + between(0, 4);
  const diff = between(a % 10 + 1, a % 10 + 6);
  return [a, '-', a - diff];
}

const GEN = { tens: genTens, pm10: genPm10, add21: genAdd21, sub21: genSub21, add22: genAdd22, sub22: genSub22, countup: genCountUp };

// --- Uppgifter som inte är vanliga "a op b" ---
function taskFriends(level) {
  const x = between(1, 9), ans = 10 - x;
  if (Math.random() < 0.65) {
    return {
      level, cat: 'friends10', kind: 'choice', visual: 'frames', ans,
      expr: `${x} + ? = 10`, prompt: 'Hur många fattas till 10?',
      say: `${x} plus hur många blir 10?`,
      choices: numberChoices(ans, [ans + 1, ans - 1, x]),
      frames: { before: [fr(['a', x])], after: [fr(['a', x], ['b', ans])] },
      explain: `Det fanns ${ans} tomma rutor. ${x} och ${ans} är tiokamrater: ${x} + ${ans} = 10.`,
      hint: MATH_HINTS.friends10, key: null,
    };
  }
  return {
    level, cat: 'friends10', kind: 'choice', visual: 'frames', ans,
    expr: `10 ${MINUS} ${x} = ?`, prompt: 'Vad blir det?',
    say: `Vad är 10 minus ${x}?`,
    choices: numberChoices(ans, [ans + 1, ans - 1, x]),
    frames: { before: [fr(['a', 10])], after: [fr(['a', ans], ['x', x])] },
    explain: `${x} och ${ans} är tiokamrater, så 10 ${MINUS} ${x} = ${ans}.`,
    hint: MATH_HINTS.friends10, key: null,
  };
}

function taskAdd20(level) {
  const a = between(6, 9);
  return buildArith(level, 'add20', a, '+', between(11 - a, 9));
}

function taskSub20(level) {
  const a = between(11, 18);
  return buildArith(level, 'sub20', a, '-', between(a - 10 + 1, 9));
}

function taskPlace(level) {
  const tt = between(1, 9);
  let o = between(1, 9);
  if (o === tt) o = o === 9 ? 1 : o + 1;
  const ans = tt * 10 + o;
  return {
    level, cat: 'place', kind: 'choice', visual: 'blocks', ans,
    expr: `${tt} tiotal och ${o} ental`, prompt: 'Vilket tal är det?',
    say: `Vilket tal är ${tt} tiotal och ${o} ental?`,
    choices: numberChoices(ans, [o * 10 + tt, +`${tt}0${o}`, tt + o]),
    blocks: { before: { groups: [{ t: tt, o }] }, after: { groups: [{ t: tt, o }] } },
    explain: `${tt} tiotal är ${tt * 10}. ${tt * 10} och ${o} till är ${ans}. Tiotalen skrivs först: ${ans}.`,
    hint: MATH_HINTS.place, key: null,
  };
}

function taskMissing(level) {
  const a = between(1, 8) * 10 + between(1, 9);
  const target = Math.ceil(a / 10) * 10;
  const ans = target - a;
  return {
    level, cat: 'missing', kind: 'choice', visual: 'grid', a, ans, start: a,
    expr: `${a} + ? = ${target}`, prompt: 'Hur mycket fattas?',
    say: `${a} plus hur mycket blir ${target}?`,
    choices: numberChoices(ans, [a % 10, ans + 1, ans - 1, ans + 10]),
    jumps: [J(a, target)],
    explain: `Från ${a} till ${target} är det ${ans} steg. ${ans} och ${a % 10} är tiokamrater. ${a} + ${ans} = ${target}.`,
    hint: MATH_HINTS.missing, key: null,
  };
}

// Lästal. n = barnets namn.
const WORD_TEMPLATES = [
  { op: '+', e: '🚌', small: true, t: (n, a, b) => `Det sitter ${a} personer på bussen. Vid nästa hållplats kliver ${b} till på. Hur många sitter på bussen nu?` },
  { op: '+', e: '⭐', t: (n, a, b) => `${n} har ${a} klistermärken och får ${b} till. Hur många klistermärken har ${n} nu?` },
  { op: '-', e: '🪙', t: (n, a, b) => `Du har ${a} kronor och köper en bok för ${b} kronor. Hur mycket pengar har du kvar?` },
  { op: '-', e: '📚', t: (n, a, b) => `Boken har ${a} sidor. ${n} har läst ${b} sidor. Hur många sidor är kvar att läsa?` },
  { op: '+', e: '🦘', t: (n, a, b) => `${n} hoppar hopprep. Först ${a} hopp och sen ${b} hopp till. Hur många hopp blir det?` },
  { op: '-', e: '🍪', t: (n, a, b) => `Det fanns ${a} kakor på kalaset. Gästerna åt upp ${b}. Hur många kakor är kvar?` },
  { op: '-', e: '🚛', small: true, t: (n, a, b) => `En lastbil har ${a} lådor. Den lämnar ${b} lådor i en affär. Hur många lådor är kvar på lastbilen?` },
];

function taskWord(level, name) {
  const w = pick(WORD_TEMPLATES);
  const big = !w.small && Math.random() < 0.5;
  let ab;
  if (w.op === '+') ab = big ? (() => { const a = between(101, 168); return [a, '+', between(12, 199 - a)]; })() : genAdd22();
  else ab = big ? [between(112, 199), '-', between(13, 69)] : genSub22();
  const [a, , b] = ab;
  const ans = calc(a, w.op, b);
  const jumps = tensFirstJumps(a, w.op, b, false);
  const lead = w.op === '+' ? 'Det blir fler – alltså plus.' : 'Det blir färre – alltså minus.';
  return {
    level, cat: 'word', kind: 'choice', visual: 'line', emoji: w.e, a, op: w.op, b, ans, start: a,
    text: w.t(name || 'Du', a, b), expr: null, prompt: '',
    choices: numberChoices(ans, w.op === '+' ? addErrors(a, b) : subErrors(a, b)),
    jumps, solved: `${exprText(a, w.op, b)} = ${ans}`,
    explain: `${lead} ${exprText(a, w.op, b)}. ${stepsSentence(jumps)}`,
    hint: MATH_HINTS.word, key: null,
  };
}

// --- Skapa uppgifter ---
function mathTaskForCat(level, cat, name) {
  switch (cat) {
    case 'friends10': return taskFriends(level);
    case 'add20': return taskAdd20(level);
    case 'sub20': return taskSub20(level);
    case 'place': return taskPlace(level);
    case 'missing': return taskMissing(level);
    case 'word': return taskWord(level, name);
    default: { const [a, op, b] = GEN[cat](); return buildArith(level, cat, a, op, b); }
  }
}

// Vilka typer som övas på varje nivå (med vikt).
const LEVEL_CATS = {
  1: [['friends10', 1]],
  2: [['add20', 0.55], ['sub20', 0.45]],
  3: [['tens', 0.6], ['place', 0.4]],
  4: [['pm10', 1]],
  5: [['add21', 0.45], ['sub21', 0.4], ['missing', 0.15]],
  6: [['add22', 1]],
  7: [['sub22', 0.7], ['countup', 0.3]],
  8: [['word', 1]],
};

function pickCat(level) {
  let r = Math.random();
  for (const [c, w] of LEVEL_CATS[level]) { if ((r -= w) < 0) return c; }
  return LEVEL_CATS[level][0][0];
}

// Ibland: en uppgift som barnet tidigare haft fel på.
function retryTask(level, track, used) {
  const hard = Object.entries(track.mistakes || {})
    .filter(([k, n]) => n > 0 && k.startsWith(level + '|') && !used.has(k));
  if (!hard.length) return null;
  const [, ex, cat] = pick(hard)[0].split('|');
  const m = /^(\d+)([+-])(\d+)$/.exec(ex);
  if (!m || !REBUILD_CATS.has(cat)) return null;
  return buildArith(level, cat, +m[1], m[2], +m[3]);
}

function mathMakeTask(level, track, used, name, kind = 'choice') {
  let t = null;
  if (track && Math.random() < 0.3) t = retryTask(level, track, used);
  for (let i = 0; !t && i < 20; i++) {
    const c = mathTaskForCat(level, pickCat(level), name);
    if (!c.key || !used.has(c.key)) t = c;
  }
  if (kind === 'hop' && HOP_CATS.has(t.cat)) {
    t.kind = 'hop';
    t.prompt = 'Hoppa på rutan till svaret!';
    t.say = `${mathSay(exprText(t.a, t.op, t.b))}. Hoppa på rutan till svaret.`;
  }
  if (t.key) used.add(t.key);
  return t;
}

// Ett pass: 10 uppgifter. Från nivå 2: 2 av dem är repetition. På nivå 4–7 hoppar barnet själv i 3 av uppgifterna.
function mathMakePass(level, track, name) {
  const used = new Set();
  const review = level >= 2 ? 2 : 0;
  const n = 10 - review;
  const hops = level >= 4 && level <= 7 ? 3 : 0;
  const kinds = Array.from({ length: n }, (_, i) => (i < hops ? 'hop' : 'choice'));
  const order = ['choice'].concat(shuffle(kinds.slice(0, -1)));
  const tasks = order.map(k => mathMakeTask(level, track, used, name, k));
  for (let i = 0; i < review; i++) {
    const lo = Math.max(1, level - 3);
    const t = mathMakeTask(between(lo, level - 1), track, used, name);
    t.review = true;
    tasks.splice(2 + rnd(tasks.length - 1), 0, t);
  }
  return tasks;
}

// Starttest: valfria uppgifter, två per nivå.
function mathPlacementTask(level, name) {
  return mathMakeTask(level, null, new Set(), name);
}

// --- Bygg talet (tiostavar och entalskuber) ---
function makeBuildTasks() {
  const tasks = [];
  const target = between(21, 89);
  tasks.push({ start: { t: 0, o: 0 }, target, prompt: `Bygg talet ${target}!`, say: `Bygg talet ${target}.` });
  const t2 = between(12, 79);
  tasks.push({ start: { t: 0, o: 0 }, target: t2, prompt: `Bygg talet ${t2}!`, say: `Bygg talet ${t2}.` });
  const n = between(21, 79), more = Math.random() < 0.5;
  tasks.push({
    start: { t: Math.floor(n / 10), o: n % 10 }, target: more ? n + 10 : n - 10,
    prompt: `Här är ${n}. Gör talet 10 ${more ? 'större' : 'mindre'}!`,
    say: `Här är ${n}. Gör talet 10 ${more ? 'större' : 'mindre'}.`,
  });
  for (let i = 0; i < 3; i++) {
    const tt = between(2, 9), o = between(0, 4), b = between(o + 1, 9), a = tt * 10 + o;
    tasks.push({
      start: { t: tt, o }, target: a - b, exchange: true,
      prompt: `Här är ${a}. Ta bort ${b} ental!`,
      say: `Här är ${a}. Ta bort ${b} ental.`,
    });
  }
  return [tasks[0]].concat(shuffle(tasks.slice(1)));
}

// --- Vilken väg? Två strategier för samma uppgift ---
function makeWays() {
  if (Math.random() < 0.5) {
    let a, b;
    for (;;) { a = between(23, 68); b = between(14, 99 - a); if (a % 10 && b % 10 && a % 10 + b % 10 > 10) break; }
    const A = { name: 'Tiotalen först', jumps: tensFirstJumps(a, '+', b) };
    let B;
    if (b % 10 >= 7) {
      const up = b + 10 - b % 10;
      B = { name: `Avrunda: ta ${up}, sen tillbaka ${up - b}`, jumps: [J(a, a + up), J(a + up, a + b)] };
    } else {
      const toTen = 10 - a % 10;
      B = { name: 'Till hela tiotalet först', jumps: [J(a, a + toTen)].concat(tensFirstJumps(a + toTen, '+', b - toTen)) };
    }
    return { a, op: '+', b, ans: a + b, ways: [A, B] };
  }
  let a, b;
  for (;;) { a = between(41, 98); b = between(13, a - 4); if (b % 10 && a % 10 < b % 10) break; }
  const A = { name: 'Ta bort tiotalen först', jumps: tensFirstJumps(a, '-', b) };
  let B;
  if (a - b <= 15) {
    B = { name: `Räkna upp från ${b}`, jumps: countUpJumps(b, a), countUp: true };
  } else if (b % 10 >= 7) {
    const down = b + 10 - b % 10;
    B = { name: `Avrunda: ta bort ${down}, sen lägg tillbaka ${down - b}`, jumps: [J(a, a - down), J(a - down, a - b)] };
  } else {
    const down = a % 10;
    B = { name: 'Ner till hela tiotalet först', jumps: [J(a, a - down)].concat(tensFirstJumps(a - down, '-', b - down)) };
  }
  return { a, op: '-', b, ans: a - b, ways: [A, B] };
}
