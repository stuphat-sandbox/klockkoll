// Mattekoll – skärmar för plus och minus. Använder hjälpfunktionerna i app.js.

const MATH_PHRASES = {
  right: [
    'Rätt! 🎉', 'Helt rätt! ⭐', 'Precis så! 🙌', 'Prick rätt! 🎯', 'Där satt den! 💥', 'Bra tänkt! 💡',
    'Kanon! 🌟', 'Toppen! 🏆', 'Ja, exakt! ✨', 'Grymt! 🚀', 'Du kan det här! 💪', 'Jättebra! 🌈',
    'Yes! 🎈', 'Räknat som ett proffs! 🧮',
  ],
  rightHop: ['Snyggt hoppat! 🐸', 'Du hoppade rätt! 🦘', 'Rätt ruta! 🎯'],
  streak: {
    3: ['Tre rätt i rad! 🔥'],
    5: ['Fem rätt i rad! 🚀', 'Fem i rad – vilken räknare! 🚀'],
    7: ['Sju i rad! Du är en matteexpert! 🏆'],
    10: ['Tio rätt i rad! Helt otroligt! 👑'],
  },
  result3: ['Superbra!', 'Fantastiskt!', 'Du är en riktig räknare!', 'Wow, vilken koll du har!'],
};

function mathGridFirst() { return db.settings.mathGrid === '0-99' ? 0 : 1; }

function exprHtml(expr) {
  return esc(expr).replace('?', '<span class="q">?</span>');
}

// --- Vad ska vi öva? ---
function showSubjects() {
  const p = profile;
  const m = p.math;
  render(`
    ${topbar(`${p.avatar} ${esc(p.name)}`, `<span class="star-count">⭐ ${p.stars}</span>`)}
    <main class="page narrow">
      <h2 class="center">Vad ska vi öva?</h2>
      <div class="subjects">
        <button class="subject-card" id="sub-clock">
          <span class="subject-icon">🕐</span><b>Klockan</b>
          <small>${p.placed ? `Nivå ${p.current}: ${esc(levelById(p.current).name)}` : 'Börja med ett starttest'}</small>
        </button>
        <button class="subject-card math" id="sub-math">
          <span class="subject-icon">➕</span><b>Plus och minus</b>
          <small>${m.placed ? `Nivå ${m.current}: ${esc(mathLevelById(m.current).name)}` : 'Nytt! Tryck för att börja'}</small>
        </button>
      </div>
      <button class="menu-btn wide" id="m-zoo"><span>🦁</span>Djurpark<small>${p.animals.length} djur</small></button>
    </main>`);
  bindBack(showHome);
  on('#sub-clock', 'click', () => (p.placed ? showHub() : showPlacement()));
  on('#sub-math', 'click', () => (m.placed ? showMathHub() : showMathStart()));
  on('#m-zoo', 'click', () => showZoo(showSubjects));
}

// --- Första gången: starttest eller välj nivå ---
function showMathStart() {
  const opts = MATH_LEVELS.map(L => `<option value="${L.id}">Nivå ${L.id}: ${L.name}</option>`).join('');
  render(`
    ${topbar('Plus och minus')}
    <main class="page narrow center">
      <div class="big-emoji">${profile.avatar}</div>
      <h2>Hej ${esc(profile.name)}!</h2>
      <p>Nu ska vi räkna plus och minus. Först ett kort test, så att vi vet var vi ska börja. Det gör inget om det blir fel!</p>
      <button class="btn primary big" id="start">Starta testet</button>
      <details class="hint left"><summary>Vuxen: välj nivå själv i stället</summary>
        <select id="lvl">${opts}</select>
        <button class="btn" id="pick">Börja på vald nivå</button>
      </details>
    </main>`);
  bindBack(showSubjects);
  on('#start', 'click', showMathPlacement);
  on('#pick', 'click', () => placeMath(+$('#lvl').value, false));
}

function showMathPlacement() {
  // Två uppgifter per nivå från nivå 2. Första felet avgör var vi börjar.
  let level = 2, inLevel = 0, k = 0;
  const maxLevel = 7;
  const total = (maxLevel - 1) * 2;
  const step = () => {
    const t = mathPlacementTask(level, profile.name);
    showMathTask(t, k, total, true, (correct) => {
      k++;
      if (!correct) return placeMath(level, true);
      if (++inLevel === 2) {
        if (level === maxLevel) return placeMath(MATH_MAX, true);
        level++;
        inLevel = 0;
      }
      step();
    }, () => placeMath(Math.max(1, level - 1), false));
  };
  step();
}

function placeMath(level, celebrate) {
  const m = profile.math;
  m.unlocked = level;
  m.current = level;
  m.placed = true;
  saveDb();
  if (!celebrate) return showMathHub();
  const L = mathLevelById(level);
  render(`
    <main class="page narrow center result">
      <h1>Klart! 🎉</h1>
      <p>Vi börjar på</p>
      <div class="level-card small"><span class="level-icon">${L.icon}</span>
        <div><div class="level-no">Nivå ${level}</div><div class="level-name">${L.name}</div></div></div>
      <p class="muted">Nivåerna innan är upplåsta och går att repetera.</p>
      <button class="btn primary big" id="ok">Nu kör vi!</button>
    </main>`);
  confetti();
  on('#ok', 'click', showMathHub);
}

// --- Mattens nav ---
function showMathHub() {
  const p = profile, m = p.math;
  const L = mathLevelById(m.current);
  const prog = levelProgress(m, m.current);
  const atTop = m.current === m.unlocked && m.unlocked < MATH_MAX;
  const dots = Array.from({ length: UNLOCK_WINDOW }, (_, i) => {
    const r = (m.recent[m.current] || [])[i];
    return `<i class="dot ${r === true ? 'ok' : r === false ? 'no' : ''}"></i>`;
  }).join('');
  const chips = MATH_LEVELS.map(l => {
    const locked = l.id > m.unlocked;
    return `<button class="level-chip${l.id === m.current ? ' sel' : ''}${locked ? ' locked' : ''}" data-l="${l.id}" ${locked ? 'disabled' : ''}>
      <span>${locked ? '🔒' : l.icon}</span><b>${l.id}</b></button>`;
  }).join('');
  render(`
    ${topbar(`${p.avatar} Plus och minus`, `<span class="star-count">⭐ ${p.stars}</span>`)}
    <main class="page">
      <section class="level-card">
        <div class="level-head">
          <span class="level-icon">${L.icon}</span>
          <div><div class="level-no">Nivå ${L.id}</div><div class="level-name">${L.name}</div><div class="level-short">${L.short}</div></div>
        </div>
        ${atTop ? `<div class="progress"><div class="dots">${dots}</div><small>${prog.right} rätt av de senaste ${UNLOCK_WINDOW} – ${UNLOCK_NEED} rätt låser upp nästa nivå</small></div>`
          : m.current < m.unlocked ? `<small class="muted">Repetition – du har redan klarat den här nivån ✔</small>`
          : `<small class="muted">Högsta nivån! 🏆</small>`}
        <button class="btn primary big" id="go">▶ Öva (10 uppgifter)</button>
      </section>
      <div class="level-list">${chips}</div>
      <div class="menu-grid">
        <button class="menu-btn" id="m-grid"><span>🔢</span>Hundrarutan</button>
        <button class="menu-btn" id="m-build"><span>🧱</span>Bygg talet</button>
        <button class="menu-btn" id="m-ways" ${m.unlocked < 5 ? 'disabled' : ''}><span>🛤️</span>Vilken väg?${m.unlocked < 5 ? '<small>från nivå 5</small>' : ''}</button>
        <button class="menu-btn" id="m-zoo"><span>🦁</span>Djurpark<small>${p.animals.length} djur</small></button>
      </div>
    </main>`);
  bindBack(showSubjects);
  on('#go', 'click', () => startMathPass(m.current));
  app.querySelectorAll('.level-chip:not(.locked)').forEach(b => b.addEventListener('click', () => {
    m.current = +b.dataset.l; saveDb(); showMathHub();
  }));
  on('#m-grid', 'click', showGridExplore);
  on('#m-build', 'click', showBuild);
  on('#m-ways', 'click', showWays);
  on('#m-zoo', 'click', () => showZoo(showMathHub));
}

// --- Övningspass ---
function startMathPass(level) {
  const m = profile.math;
  const tasks = mathMakePass(level, m, profile.name);
  const results = [];
  let i = 0;
  streak = 0;
  const next = () => {
    if (i >= tasks.length) {
      return showResult(results, level, {
        track: m, max: MATH_MAX, levelName: id => mathLevelById(id).name,
        again: () => startMathPass(m.current), done: showMathHub, phrases: MATH_PHRASES,
      });
    }
    const task = tasks[i];
    showMathTask(task, i, tasks.length, false, (correct) => {
      results.push({ task, correct });
      recordMath(m, task, correct);
      saveDb();
      i++;
      next();
    }, showMathHub);
  };
  next();
}

function recordMath(track, task, correct) {
  recordAnswer(track, task, correct);
  const c = track.cats[task.cat] || (track.cats[task.cat] = { right: 0, total: 0 });
  c.total++;
  if (correct) c.right++;
}

function showMathTask(task, idx, total, placement, answer, quit) {
  const settings = db.settings;
  const progress = Array.from({ length: total }, (_, j) =>
    `<i class="${j < idx ? 'done' : j === idx ? 'cur' : ''}"></i>`).join('');
  let visual = '';
  if (task.visual === 'frames') visual = `<div class="mvis" id="mvis">${tenFramesHtml(task.frames.before)}</div>`;
  else if (task.visual === 'blocks') visual = `<div class="mvis" id="mvis">${blocksHtml(task.blocks.before)}</div>`;
  else if (task.visual === 'grid') visual = `<div id="grid"></div><div class="nline" id="nline" hidden></div>`;
  else if (task.visual === 'line') visual = `<div class="word-emoji">${task.emoji}</div><div class="nline" id="nline" hidden></div>`;

  let answers = '';
  if (task.kind === 'hop') {
    answers = `<p class="hop-path" id="hop-path">Tryck på en ruta för att hoppa dit!</p>
      <div class="row"><button class="btn" id="undo" disabled>↩ Ångra</button><button class="btn primary" id="check" disabled>Klar!</button></div>`;
  } else {
    answers = `<div class="choices short">${task.choices.map((c, j) =>
      `<button class="choice num" data-j="${j}">${esc(c.label)}</button>`).join('')}</div>`;
  }
  const review = task.review ? '<span class="tag">Repetition</span>' : '';
  render(`
    <header class="topbar task-top">
      <button class="icon-btn" id="quit" aria-label="Avsluta">✕</button>
      <div class="pbar">${progress}</div>
      <button class="icon-btn say-btn" id="say" aria-label="Läs upp igen">🗣️</button>
      ${soundBtn()}
    </header>
    <main class="task mtask task-${task.visual}">
      <div class="task-visual">${visual}</div>
      <div class="task-side">
        ${review}
        ${task.text ? `<p class="word-text">${esc(task.text)}</p>` : ''}
        ${task.expr ? `<div class="expr" id="expr">${exprHtml(task.expr)}</div>` : '<div class="expr" id="expr" hidden></div>'}
        ${task.prompt ? `<h2 class="prompt">${esc(task.prompt)}</h2>` : ''}
        ${answers}
        ${settings.hints && task.hint && !placement ? `<details class="hint"><summary>💡 Tips till vuxna</summary><p>${esc(task.hint)}</p></details>` : ''}
        <div class="feedback" id="feedback" hidden></div>
      </div>
    </main>`);

  const first = mathGridFirst();
  const grid = task.visual === 'grid' ? mount(new HundredGrid($('#grid'), {
    first, onTap: task.kind === 'hop' ? (n) => hop(n) : null,
  })) : null;
  const line = $('#nline') ? mount(new NumberLine($('#nline'))) : null;
  if (grid) grid.show(task.start, [], { token: profile.avatar });

  const sayText = task.text || task.say || mathSay(task.expr || '');
  const sayAll = () => {
    let s = sayText;
    if (task.kind === 'choice') {
      const labels = task.choices.map(c => c.label);
      s += ' Är det ' + labels.slice(0, -1).join(', ') + ' eller ' + labels[labels.length - 1] + '?';
    }
    speak(s);
  };
  on('#say', 'click', sayAll);
  on('#quit', 'click', quit);
  if (settings.autoSpeak) later(() => speak(sayText), 300);

  let answered = false;

  // Hoppa själv på rutan.
  const jumps = [];
  const pos = () => (jumps.length ? jumps[jumps.length - 1].to : task.start);
  const drawHops = (animate) => {
    const from = animate ? jumps.length - 1 : null;
    grid.show(task.start, jumps, { animateFrom: from, token: profile.avatar });
    line.el.hidden = !jumps.length;
    if (jumps.length) line.show(task.start, jumps, { animateFrom: from });
    $('#hop-path').innerHTML = jumps.length
      ? [task.start].concat(jumps.map(j => `<b class="${jumpKind(j)}">${jumpLabel(j)}</b> ${j.to}`)).join(' → ')
      : 'Tryck på en ruta för att hoppa dit!';
    $('#undo').disabled = !jumps.length;
    $('#check').disabled = !jumps.length;
  };
  const hop = (n) => {
    if (answered || n === pos()) return;
    jumps.push(J(pos(), n));
    drawHops(true);
    speak(String(n));
  };
  on('#undo', 'click', () => { jumps.pop(); drawHops(false); });
  on('#check', 'click', () => finish(pos() === task.ans));

  // Visa hur man kan tänka: animera hoppen / fyll tiorutan / klossarna.
  const showStrategy = (ownJumps) => {
    if (task.visual === 'frames') $('#mvis').innerHTML = tenFramesHtml(task.frames.after, true);
    else if (task.visual === 'blocks') $('#mvis').innerHTML = blocksHtml(task.blocks.after);
    if (ownJumps) return;
    if (grid) grid.show(task.start, task.jumps, { animateFrom: 0, token: profile.avatar });
    if (line && task.jumps) {
      line.el.hidden = false;
      line.show(task.start, task.jumps, { animateFrom: 0 });
    }
  };

  const finish = (correct, chosenBtn) => {
    if (answered) return;
    answered = true;
    app.querySelectorAll('button.choice').forEach((b, j) => {
      b.disabled = true;
      if (task.choices[j].correct) b.classList.add('right');
    });
    if (chosenBtn && !correct) chosenBtn.classList.add('wrong');
    ['#check', '#undo'].forEach(s => { const b = $(s); if (b) b.hidden = true; });
    const fb = $('#feedback');

    if (placement) {
      fb.hidden = false;
      fb.className = 'feedback neutral';
      fb.innerHTML = `<p class="fb-title">${correct ? phrase('placeRight') : phrase('placeWrong')}</p>`;
      later(() => answer(correct), 1100);
      return;
    }

    const ex = $('#expr');
    if (task.expr) ex.innerHTML = esc(task.expr).replace('?', `<span class="q filled">${task.ans}</span>`);
    else if (task.solved) { ex.hidden = false; ex.textContent = task.solved; }
    const doneSay = task.expr ? mathSay(task.expr.replace('?', task.ans)) : task.solved ? mathSay(task.solved) : '';

    if (correct) {
      streak++;
      showStrategy(task.kind === 'hop');
      let praise;
      if (MATH_PHRASES.streak[streak]) praise = phrase('mstreak' + streak, MATH_PHRASES.streak[streak]);
      else if (task.kind === 'hop') praise = phrase('mrightHop', MATH_PHRASES.rightHop);
      else praise = phrase('mright', MATH_PHRASES.right);
      const talk = Math.random() < 0.3;
      fb.hidden = false;
      fb.className = 'feedback good';
      fb.innerHTML = `<p class="fb-title">${praise}</p>
        ${task.kind === 'hop' ? '' : `<p class="small">${esc(task.explain)}</p>`}
        ${talk ? '<p class="talk">💬 Hur tänkte du? Berätta för din vuxen!</p>' : ''}
        <button class="btn primary" id="next">Nästa →</button>`;
      if (settings.autoSpeak) speak(speakable(praise) + ' ' + doneSay + (talk ? '. Hur tänkte du?' : ''));
      on('#next', 'click', () => answer(true));
      later(() => { if ($('#next')) $('#next').focus(); }, 50);
    } else {
      streak = 0;
      showStrategy(false);
      let extra = '';
      if (task.kind === 'hop') extra = `Du landade på ${pos()}. `;
      fb.hidden = false;
      fb.className = 'feedback try';
      fb.innerHTML = `<p class="fb-title">${phrase('wrong')}</p><p>${esc(extra + task.explain)}</p>
        <button class="btn primary" id="next">Jag förstår →</button>`;
      if (settings.autoSpeak) speak(mathSay(extra + task.explain));
      on('#next', 'click', () => answer(false));
    }
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  app.querySelectorAll('button.choice').forEach((b) => b.addEventListener('click', () => {
    finish(task.choices[+b.dataset.j].correct, b);
  }));
}

// --- Utforska hundrarutan ---
function showGridExplore() {
  const first = mathGridFirst();
  let cur = 23, neighbours = true;
  render(`
    ${topbar('Hundrarutan')}
    <main class="task explore mtask">
      <div class="task-visual"><div id="grid"></div></div>
      <div class="task-side">
        <div class="readout">
          <div class="words" id="num"></div>
          <div class="muted" id="parts"></div>
          <div id="mblocks" class="mini-blocks"></div>
        </div>
        <div class="row wrap">
          <button class="btn step tens" data-d="-10">${MINUS}10</button>
          <button class="btn step ones" data-d="-1">${MINUS}1</button>
          <button class="btn step ones" data-d="1">+1</button>
          <button class="btn step tens" data-d="10">+10</button>
        </div>
        <div class="row wrap">
          <button class="btn primary say-btn" id="say">🗣️ Läs upp</button>
          <button class="btn" id="random">🎲 Slumpa</button>
        </div>
        <div class="toggles"><label><input type="checkbox" id="t-nb" checked> Visa grannarna (+1, ${MINUS}1, +10, ${MINUS}10)</label></div>
        <p class="muted small">Tryck på ett tal! Gå ett steg rakt ner – vilken siffra ändras, och vilken är densamma?</p>
      </div>
    </main>`);
  bindBack(showMathHub);
  const grid = mount(new HundredGrid($('#grid'), { first, onTap: (n) => { cur = n; upd(); speak(String(n)); } }));
  const upd = (jump) => {
    if (jump) grid.show(jump.from, [jump], { animateFrom: 0, token: profile.avatar });
    else grid.showNeighbours(cur, neighbours);
    $('#num').textContent = cur;
    $('#parts').textContent = placeWords(cur);
    $('#mblocks').innerHTML = blocksHtml({ groups: [{ t: Math.floor(cur / 10), o: cur % 10 }] });
  };
  upd();
  app.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => {
    const n = cur + +b.dataset.d;
    if (!grid.has(n)) return;
    const j = J(cur, n);
    cur = n;
    upd(j);
    speak(`${n}`);
  }));
  on('#say', 'click', () => speak(`${cur}. ${placeWords(cur)}.`));
  on('#random', 'click', () => { cur = first + rnd(100); upd(); speak(String(cur)); });
  on('#t-nb', 'change', e => { neighbours = e.target.checked; upd(); });
}

// --- Bygg talet ---
function showBuild() {
  const tasks = makeBuildTasks();
  const results = [];
  let i = 0;
  streak = 0;
  const next = () => {
    if (i >= tasks.length) {
      return showResult(results, -1, {
        track: profile.math, max: MATH_MAX, levelName: id => mathLevelById(id).name,
        again: showBuild, done: showMathHub, phrases: MATH_PHRASES,
      });
    }
    buildTask(tasks[i], i, tasks.length, (correct) => { results.push({ correct }); i++; next(); });
  };
  next();
}

function buildTask(task, idx, total, answer) {
  const progress = Array.from({ length: total }, (_, j) =>
    `<i class="${j < idx ? 'done' : j === idx ? 'cur' : ''}"></i>`).join('');
  render(`
    <header class="topbar task-top">
      <button class="icon-btn" id="quit" aria-label="Avsluta">✕</button>
      <div class="pbar">${progress}</div>
      <button class="icon-btn say-btn" id="say" aria-label="Läs upp igen">🗣️</button>
      ${soundBtn()}
    </header>
    <main class="task mtask build">
      <div class="task-visual"><div class="mvis build-area" id="area"></div><p class="counts" id="counts"></p></div>
      <div class="task-side">
        <h2 class="prompt">${esc(task.prompt)}</h2>
        <div class="build-btns">
          <button class="btn tens" data-b="t+">＋ Tiotal</button>
          <button class="btn ones" data-b="o+">＋ Ental</button>
          <button class="btn tens" data-b="t-">${MINUS} Tiotal</button>
          <button class="btn ones" data-b="o-">${MINUS} Ental</button>
          <button class="btn swap" data-b="swap">🔁 Växla 1 tiotal till 10 ental</button>
        </div>
        <p class="build-msg" id="msg" hidden></p>
        <button class="btn primary big" id="check">Klar!</button>
        ${db.settings.hints ? `<details class="hint"><summary>💡 Tips till vuxna</summary><p>${task.exchange
          ? 'Fråga: Räcker entalen? Om inte – växla en tiostav till 10 små kuber. Det är samma sak som "låna" i uppställning.'
          : 'Fråga: Hur många tiotal behöver du? Hur många ental? Vilken siffra visar tiotalen?'}</p></details>` : ''}
        <div class="feedback" id="feedback" hidden></div>
      </div>
    </main>`);
  let t = task.start.t, o = task.start.o, fresh = 0, answered = false;
  const draw = () => {
    $('#area').innerHTML = blocksHtml({ groups: [{ t, o, fresh }] });
    $('#counts').innerHTML = `<b class="tens">${t} tiotal</b> och <b class="ones">${o} ental</b>`;
    fresh = 0;
  };
  draw();
  const msg = (s) => { const m = $('#msg'); m.hidden = !s; m.textContent = s || ''; if (s) speak(s); };
  on('#quit', 'click', showMathHub);
  on('#say', 'click', () => speak(task.say));
  if (db.settings.autoSpeak) later(() => speak(task.say), 300);
  app.querySelectorAll('[data-b]').forEach(b => b.addEventListener('click', () => {
    if (answered) return;
    msg('');
    const k = b.dataset.b;
    if (k === 't+' && t < 9) t++;
    else if (k === 'o+' && o < 19) { o++; fresh = 1; }
    else if (k === 't-' && t > 0) t--;
    else if (k === 'o-') {
      if (o > 0) o--;
      else if (t > 0) { msg('Det finns inga ental kvar. Växla ett tiotal till 10 ental!'); b.blur(); $('.swap').classList.add('pulse'); }
    } else if (k === 'swap') {
      if (t > 0) { t--; o += 10; fresh = 10; $('.swap').classList.remove('pulse'); }
      else msg('Det finns inget tiotal att växla.');
    }
    draw();
  }));
  on('#check', 'click', () => {
    if (answered) return;
    answered = true;
    const val = t * 10 + o;
    const correct = val === task.target;
    app.querySelectorAll('[data-b]').forEach(b => { b.disabled = true; });
    $('#check').hidden = true;
    const fb = $('#feedback');
    fb.hidden = false;
    if (correct) {
      streak++;
      const praise = phrase('mright', MATH_PHRASES.right);
      fb.className = 'feedback good';
      fb.innerHTML = `<p class="fb-title">${praise}</p><p>${placeWords(val)} är ${val}.</p><button class="btn primary" id="next">Nästa →</button>`;
      if (db.settings.autoSpeak) speak(`${speakable(praise)} ${placeWords(val)} är ${val}.`);
      on('#next', 'click', () => answer(true));
    } else {
      streak = 0;
      const tt = Math.floor(task.target / 10), oo = task.target % 10;
      const s = `Du byggde ${val}, men svaret är ${task.target}: ${placeWords(task.target)}.`;
      t = tt; o = oo; draw();
      fb.className = 'feedback try';
      fb.innerHTML = `<p class="fb-title">${phrase('wrong')}</p><p>${esc(s)}</p><button class="btn primary" id="next">Jag förstår →</button>`;
      if (db.settings.autoSpeak) speak(s);
      on('#next', 'click', () => answer(false));
    }
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

// --- Vilken väg? ---
function showWays() {
  const w = makeWays();
  const ex = `${exprText(w.a, w.op, w.b)} = ?`;
  render(`
    ${topbar('Vilken väg?')}
    <main class="page narrow">
      <div class="expr center" id="expr">${exprHtml(ex)}</div>
      <p class="center">Räkna först i huvudet – eller titta på två olika sätt att tänka!</p>
      <button class="btn primary big" id="show">Visa två vägar</button>
      <div class="ways" id="ways" hidden>
        ${w.ways.map((v, i) => `<section class="way" data-i="${i}">
          <h3>${i ? '🅱️' : '🅰️'} ${esc(v.name)}</h3>
          <div class="nline" id="wl${i}"></div>
          <p class="small">${esc(stepsSentence(v.jumps))}${v.countUp ? ` Det blev ${w.ans} steg.` : ''}</p>
          <button class="btn pick-way">Den här väljer jag!</button>
        </section>`).join('')}
      </div>
      <div class="feedback good" id="feedback" hidden></div>
    </main>`);
  bindBack(showMathHub);
  if (db.settings.autoSpeak) later(() => speak(mathSay(ex.replace('?', '')) + ' hur mycket?'), 300);
  on('#show', 'click', () => {
    $('#show').hidden = true;
    $('#ways').hidden = false;
    $('#expr').innerHTML = esc(ex).replace('?', `<span class="q filled">${w.ans}</span>`);
    w.ways.forEach((v, i) => {
      const start = v.jumps[0].from;
      mount(new NumberLine($('#wl' + i))).show(start, v.jumps, { animateFrom: 0, startDelay: i * 600 });
    });
  });
  app.querySelectorAll('.pick-way').forEach(b => b.addEventListener('click', () => {
    app.querySelectorAll('.way').forEach(s => s.classList.toggle('sel', s.contains(b)));
    const fb = $('#feedback');
    fb.hidden = false;
    fb.innerHTML = `<p class="fb-title">Bra val! 💬</p><p>Berätta för din vuxen varför du tycker att den vägen är enklast. Båda vägarna ger samma svar – ${w.ans}.</p>
      <div class="row"><button class="btn" id="again">Ny uppgift</button><button class="btn primary" id="done">Klar</button></div>`;
    speak('Bra val! Berätta för din vuxen varför du tycker att den vägen är enklast.');
    on('#again', 'click', showWays);
    on('#done', 'click', showMathHub);
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }));
}
