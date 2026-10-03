// Klockkoll – skärmar och navigering.

const app = document.getElementById('app');
let clocks = [];
let widgets = []; // hundrarutor, tallinjer m.m. (allt med destroy())
let timers = [];
let profile = null;

const AVATARS = ['🦊', '🐻', '🐼', '🐯', '🦁', '🐸', '🐙', '🦄', '🐧', '🐨', '🦖', '🐬'];

// --- Hjälpfunktioner ---
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function cleanup() {
  clocks.forEach(c => c.destroy());
  clocks = [];
  widgets.forEach(w => w.destroy());
  widgets = [];
  timers.forEach(clearTimeout);
  timers = [];
  stopSpeaking();
}

function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

function render(html) {
  cleanup();
  app.innerHTML = html;
  app.scrollTop = 0;
  window.scrollTo(0, 0);
}

function $(sel) { return app.querySelector(sel); }
function on(sel, ev, fn) { const el = $(sel); if (el) el.addEventListener(ev, fn); return el; }

function mountClock(sel, opts) {
  const c = new Clock($(sel), opts);
  clocks.push(c);
  return c;
}

function mount(w) { widgets.push(w); return w; }

function miniClockSvg(h, m) {
  // Enkel statisk klocka för kort och listor.
  const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
  let ticks = '';
  for (let n = 0; n < 12; n++) {
    const [x1, y1] = polar(82, n * 30), [x2, y2] = polar(96, n * 30);
    ticks += `<line class="tick big" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }
  return `<svg class="clock mini" viewBox="-110 -110 220 220" aria-label="${esc(timeToWords(h, m))}">
    <circle class="rim" r="104"/><circle class="face-bg" r="100"/>${ticks}
    <g class="hand hand-hour" transform="rotate(${ha})"><line class="shape" x1="0" y1="10" x2="0" y2="-50"/></g>
    <g class="hand hand-minute" transform="rotate(${ma})"><line class="shape" x1="0" y1="12" x2="0" y2="-82"/></g>
    <circle class="center" r="7"/></svg>`;
}

function confetti() {
  const box = document.createElement('div');
  box.className = 'confetti';
  const colors = ['#E4572E', '#2B7BD9', '#F4B400', '#2EAD6B', '#9B5DE5'];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * 0.4 + 's';
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 2500);
}

// --- Ljud på/av ---
function soundBtn() {
  const on = db.settings.sound;
  return `<button class="icon-btn sound-toggle" aria-pressed="${!on}" aria-label="${on ? 'Stäng av ljudet' : 'Slå på ljudet'}">${on ? '🔊' : '🔇'}</button>`;
}

function setSound(on) {
  db.settings.sound = on;
  saveDb();
  if (!on) stopSpeaking();
  document.body.classList.toggle('muted', !on);
  document.querySelectorAll('.sound-toggle').forEach(b => {
    b.textContent = on ? '🔊' : '🔇';
    b.setAttribute('aria-pressed', String(!on));
    b.setAttribute('aria-label', on ? 'Stäng av ljudet' : 'Slå på ljudet');
  });
  const s = document.getElementById('s-sound');
  if (s) s.checked = on;
}

app.addEventListener('click', (e) => {
  if (e.target.closest('.sound-toggle')) setSound(!db.settings.sound);
});

// --- Beröm och uppmuntran (varierat, samma fras kommer inte två gånger i rad) ---
const PHRASES = {
  right: [
    'Rätt! 🎉', 'Helt rätt! ⭐', 'Precis så! 🙌', 'Klockrent! ⏰', 'Prick rätt! 🎯', 'Där satt den! 💥',
    'Bra tänkt! 💡', 'Du tittade noga! 👀', 'Kanon! 🌟', 'Toppen! 🏆', 'Du har koll! 😎', 'Ja, exakt! ✨',
    'Grymt! 🚀', 'Mitt i prick! 🎯', 'Klockkoll! ⏱️', 'Du kan det här! 💪', 'Jättebra! 🌈', 'Yes! 🎈',
  ],
  rightSet: ['Visarna står precis rätt! 🎯', 'Du ställde klockan helt rätt! ⏰', 'Perfekt inställt! ✨'],
  rightRead: ['Du läste klockan rätt! 👀', 'Rätt avläst! ⭐'],
  streak: {
    3: ['Tre rätt i rad! 🔥', 'Tre i rad – du är på gång! 🔥'],
    5: ['Fem rätt i rad! 🚀', 'Fem i rad – vilken koll! 🚀'],
    7: ['Sju i rad! Du är en klockexpert! 🏆'],
    10: ['Tio rätt i rad! Helt otroligt! 👑'],
  },
  wrong: [
    'Nästan! Så här är det:', 'Inte riktigt – titta här:', 'Bra försök! Så här funkar det:',
    'Den var klurig! Så här är det:', 'Ingen fara – nu lär vi oss:', 'Oj, nära! Kolla här:',
    'Hoppsan! Så här blir det:', 'Bra att du testade! Titta här:',
  ],
  result3: ['Superbra!', 'Fantastiskt!', 'Du är en riktig klockexpert!', 'Wow, vilken koll du har!'],
  result2: ['Bra jobbat!', 'Snyggt kämpat!', 'Det går framåt!', 'Du lär dig massor!'],
  result1: ['Bra kämpat – övning ger färdighet!', 'Varje gång du övar blir du bättre!', 'Det var svåra – bra att du övade!', 'Skönt kämpat! Nästa gång går det ännu bättre.'],
  placeRight: ['Bra! 👍', 'Fint! ⭐', 'Det kan du! ✅', 'Snyggt! 👌'],
  placeWrong: ['Den här ska vi öva på! 💪', 'Den tar vi sen! 🙂', 'Bra att veta – den övar vi på! 💪'],
  matchDone: ['Alla par hittade! 🎉', 'Alla par klara! 🧩', 'Du hittade alla! 🌟'],
};
const lastPhrase = {};

function phrase(key, list = PHRASES[key]) {
  const options = list.length > 1 ? list.filter(p => p !== lastPhrase[key]) : list;
  const p = pick(options);
  lastPhrase[key] = p;
  return p;
}

// Text för uppläsning: utan emoji.
function speakable(s) { return s.replace(/[^\p{L}\p{N}\s!?.,–-]/gu, '').trim(); }

let streak = 0;

function topbar(title, extra = '') {
  return `<header class="topbar">
    <button class="icon-btn" id="back" aria-label="Tillbaka">←</button>
    <h1>${title}</h1>
    <div class="topbar-extra">${extra}${soundBtn()}</div>
  </header>`;
}

function bindBack(fn) { on('#back', 'click', fn); }

// --- Startsida: vem ska öva? ---
function showHome() {
  profile = null;
  const cards = db.profiles.map(p => `
    <button class="profile-card" data-id="${p.id}">
      <span class="avatar">${p.avatar}</span>
      <span class="pname">${esc(p.name)}</span>
      <span class="pmeta">🕐 ${p.current} · ➕ ${p.math.current} · ⭐ ${p.stars}</span>
    </button>`).join('');
  render(`
    <main class="home">
      <div class="home-sound">${soundBtn()}</div>
      <div class="logo">
        <div class="logo-clock" id="logo-clock"></div>
        <h1>Klockkoll</h1>
        <p class="tagline">Klockan, plus och minus – steg för steg</p>
      </div>
      <h2 class="center">Vem ska öva?</h2>
      <div class="profiles">${cards}
        <button class="profile-card add" id="add-profile"><span class="avatar">＋</span><span class="pname">Lägg till barn</span></button>
      </div>
      <div class="home-footer">
        <button class="link-btn" id="explore-free">🕰️ Utforska klockan</button>
        <button class="link-btn hold" id="parent-btn"><span class="hold-fill"></span>🔒 Vuxna (håll inne)</button>
      </div>
    </main>`);
  const logo = mountClock('#logo-clock', { mode: 'static' });
  const now = new Date();
  logo.setTime(now.getHours(), now.getMinutes());
  app.querySelectorAll('.profile-card[data-id]').forEach(b =>
    b.addEventListener('click', () => { profile = getProfile(b.dataset.id); showSubjects(); }));
  on('#add-profile', 'click', showNewProfile);
  on('#explore-free', 'click', () => showExplore(null));
  holdButton($('#parent-btn'), showParent);
}

function holdButton(btn, fn) {
  let t = null;
  const start = (e) => {
    e.preventDefault();
    btn.classList.add('holding');
    t = setTimeout(() => { btn.classList.remove('holding'); fn(); }, 1500);
  };
  const stop = () => { btn.classList.remove('holding'); clearTimeout(t); };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointerleave', stop);
  btn.addEventListener('pointercancel', stop);
  btn.addEventListener('contextmenu', e => e.preventDefault());
}

// --- Ny profil ---
function showNewProfile() {
  let avatar = AVATARS[0];
  const levelOpts = LEVELS.map(L => `<option value="${L.id}">Nivå ${L.id}: ${L.name}</option>`).join('');
  render(`
    ${topbar('Nytt barn')}
    <main class="page narrow">
      <label class="field">Namn<input id="pname" maxlength="20" placeholder="T.ex. Alva" autocomplete="off"></label>
      <div class="field">Välj en figur
        <div class="avatar-grid">${AVATARS.map((a, i) => `<button class="avatar-opt${i === 0 ? ' sel' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
      </div>
      <div class="field">Klockan: var ska vi börja?
        <label class="radio"><input type="radio" name="start" value="test" checked> <span><b>Gör ett kort starttest</b><br><small>Appen tar reda på vilken nivå som passar.</small></span></label>
        <label class="radio"><input type="radio" name="start" value="pick"> <span><b>Välj nivå själv</b></span></label>
        <select id="start-level" disabled>${levelOpts}</select>
      </div>
      <button class="btn primary big" id="create">Klar!</button>
    </main>`);
  bindBack(showHome);
  app.querySelectorAll('.avatar-opt').forEach(b => b.addEventListener('click', () => {
    app.querySelectorAll('.avatar-opt').forEach(x => x.classList.remove('sel'));
    b.classList.add('sel');
    avatar = b.dataset.a;
  }));
  app.querySelectorAll('input[name=start]').forEach(r => r.addEventListener('change', () => {
    $('#start-level').disabled = r.value !== 'pick' || !r.checked;
  }));
  on('#create', 'click', () => {
    const name = $('#pname').value.trim();
    if (!name) { $('#pname').focus(); $('#pname').classList.add('shake'); return; }
    const mode = app.querySelector('input[name=start]:checked').value;
    const lv = mode === 'pick' ? +$('#start-level').value : 1;
    profile = newProfile(name, avatar, lv);
    if (mode === 'test') { profile.placed = false; saveDb(); }
    showSubjects();
  });
}

// --- Profilens nav ---
function showHub() {
  const p = profile;
  const L = levelById(p.current);
  const prog = levelProgress(p, p.current);
  const atTop = p.current === p.unlocked && p.unlocked < MAX_LEVEL;
  const dots = Array.from({ length: UNLOCK_WINDOW }, (_, i) => {
    const r = (p.recent[p.current] || [])[i];
    return `<i class="dot ${r === true ? 'ok' : r === false ? 'no' : ''}"></i>`;
  }).join('');
  const levelList = LEVELS.map(l => {
    const locked = l.id > p.unlocked;
    return `<button class="level-chip${l.id === p.current ? ' sel' : ''}${locked ? ' locked' : ''}" data-l="${l.id}" ${locked ? 'disabled' : ''}>
      <span>${locked ? '🔒' : l.icon}</span><b>${l.id}</b></button>`;
  }).join('');
  render(`
    ${topbar(`${p.avatar} ${esc(p.name)}`, `<span class="star-count">⭐ ${p.stars}</span>`)}
    <main class="page">
      <section class="level-card">
        <div class="level-head">
          <span class="level-icon">${L.icon}</span>
          <div><div class="level-no">Nivå ${L.id}</div><div class="level-name">${L.name}</div><div class="level-short">${L.short}</div></div>
        </div>
        ${atTop ? `<div class="progress"><div class="dots">${dots}</div><small>${prog.right} rätt av de senaste ${UNLOCK_WINDOW} – ${UNLOCK_NEED} rätt låser upp nästa nivå</small></div>`
          : p.current < p.unlocked ? `<small class="muted">Repetition – du har redan klarat den här nivån ✔</small>`
          : `<small class="muted">Högsta nivån! 🏆</small>`}
        <button class="btn primary big" id="go">▶ Öva (10 uppgifter)</button>
      </section>
      <div class="level-list">${levelList}</div>
      <div class="menu-grid">
        <button class="menu-btn" id="m-explore"><span>🕰️</span>Utforska</button>
        <button class="menu-btn" id="m-day"><span>🌞</span>Min dag</button>
        <button class="menu-btn" id="m-match" ${p.unlocked < 3 ? 'disabled' : ''}><span>🧩</span>Para ihop${p.unlocked < 3 ? '<small>från nivå 3</small>' : ''}</button>
        <button class="menu-btn" id="m-zoo"><span>🦁</span>Djurpark<small>${p.animals.length} djur</small></button>
      </div>
    </main>`);
  bindBack(showSubjects);
  on('#go', 'click', () => startPass(p.current));
  app.querySelectorAll('.level-chip:not(.locked)').forEach(b => b.addEventListener('click', () => {
    p.current = +b.dataset.l; saveDb(); showHub();
  }));
  on('#m-explore', 'click', () => showExplore(p));
  on('#m-day', 'click', showDay);
  on('#m-match', 'click', showMatch);
  on('#m-zoo', 'click', () => showZoo(showHub));
}

// --- Övningspass ---
function startPass(level) {
  runSession({
    tasks: makePass(level, profile),
    level,
    title: `Nivå ${level}`,
    onDone: (res) => showResult(res, level),
  });
}

// Kör en serie uppgifter. Används av pass, starttest och Min dag.
function runSession({ tasks, level, title, onDone }) {
  let i = 0;
  streak = 0;
  const results = [];
  const next = () => {
    if (i >= tasks.length) { onDone(results); return; }
    const task = tasks[i];
    showTask(task, i, tasks.length, title, level, false, (correct) => {
      results.push({ task, correct });
      recordAnswer(profile, task, correct);
      saveDb();
      i++;
      next();
    }, showHub);
  };
  next();
}

function showTask(task, idx, total, title, level, placement, answer, quit) {
  const settings = db.settings;
  const helpers = clockHelpers(task.level || level, settings);
  const progress = Array.from({ length: total }, (_, j) =>
    `<i class="${j < idx ? 'done' : j === idx ? 'cur' : ''}"></i>`).join('');
  let visual = '';
  if (task.clock) visual = `<div class="clock-wrap" id="clock"></div>`;
  if (task.digital && !task.clock) visual = `<div class="digital big">${task.digital}</div>`;
  if (task.pair) {
    const { h1, m1, h2, m2 } = task.pair;
    visual = `<div class="pair">
      <figure>${miniClockSvg(h1, m1)}<figcaption>Börjar</figcaption></figure>
      <span class="arrow">→</span>
      <figure>${miniClockSvg(h2, m2)}<figcaption>Slutar</figcaption></figure></div>`;
  }
  let answers = '';
  if (task.type === 'choice') {
    answers = `<div class="choices${task.kind === 'pointNumber' || task.kind === 'toDigital' ? ' short' : ''}">
      ${task.choices.map((c, j) => `<button class="choice" data-j="${j}">${esc(c.label)}</button>`).join('')}</div>`;
  } else if (task.type === 'set') {
    answers = `<div class="set-controls"><button class="btn primary big" id="check">Klar!</button></div>`;
  }
  const review = task.review ? '<span class="tag">Repetition</span>' : '';
  render(`
    <header class="topbar task-top">
      <button class="icon-btn" id="quit" aria-label="Avsluta">✕</button>
      <div class="pbar">${progress}</div>
      <button class="icon-btn say-btn" id="say" aria-label="Läs upp frågan igen">🗣️</button>
      ${soundBtn()}
    </header>
    <main class="task task-${task.type}">
      <div class="task-visual">${visual}</div>
      <div class="task-side">
        ${review}
        ${task.digital && task.clock ? `<div class="digital">${task.digital}</div>` : ''}
        <h2 class="prompt">${esc(task.prompt)}</h2>
        ${answers}
        ${settings.hints && task.hint ? `<details class="hint"><summary>💡 Tips till vuxna</summary><p>${esc(task.hint)}</p></details>` : ''}
        <div class="feedback" id="feedback" hidden></div>
      </div>
    </main>`);

  let clock = null;
  let answered = false;
  if (task.clock) {
    clock = mountClock('#clock', {
      mode: task.clock.mode || 'static',
      snap: 5,
      zones: helpers.zones,
      minuteNumbers: helpers.minNums,
      onHandTap: (hand) => {
        if (answered) return;
        clock.pulse(hand);
        finish(hand === task.want);
      },
    });
    clock.setTime(task.clock.h, task.clock.m);
  }

  const sayAll = () => {
    let s = task.say || task.prompt;
    if (task.type === 'choice' && task.kind !== 'pointNumber') {
      const labels = task.choices.map(c => c.label);
      s += ' Är det ' + labels.slice(0, -1).join(', ') + ' eller ' + labels[labels.length - 1] + '?';
    }
    speak(s);
  };
  on('#say', 'click', sayAll);
  on('#quit', 'click', quit);
  if (settings.autoSpeak) later(() => speak(task.say || task.prompt), 300);

  const finish = (correct, chosenBtn) => {
    if (answered) return;
    answered = true;
    app.querySelectorAll('button.choice').forEach((b, j) => {
      b.disabled = true;
      if (task.choices[j].correct) b.classList.add('right');
    });
    if (chosenBtn && !correct) chosenBtn.classList.add('wrong');
    const fb = $('#feedback');
    const checkBtn = $('#check');
    if (checkBtn) checkBtn.hidden = true;
    if (clock) clock.setMode('static');

    if (placement) {
      fb.hidden = false;
      fb.className = 'feedback neutral';
      fb.innerHTML = `<p class="fb-title">${correct ? phrase('placeRight') : phrase('placeWrong')}</p>`;
      later(() => answer(correct), 1100);
      return;
    }

    if (correct) {
      streak++;
      let praise;
      if (PHRASES.streak[streak]) praise = phrase('streak' + streak, PHRASES.streak[streak]);
      else if (task.type === 'set' && Math.random() < 0.25) praise = phrase('rightSet');
      else if (task.kind === 'read' && Math.random() < 0.2) praise = phrase('rightRead');
      else praise = phrase('right');
      fb.hidden = false;
      fb.className = 'feedback good';
      const said = task.h !== undefined ? capitalize(timePhrase(task.h, task.m)) + '.'
        : task.target ? capitalize(timePhrase(task.target.h, task.target.m)) + '.' : '';
      fb.innerHTML = `<p class="fb-title">${praise}</p>${said ? `<p>${esc(said)}</p>` : ''}
        <button class="btn primary" id="next">Nästa →</button>`;
      if (settings.autoSpeak) speak(speakable(praise) + ' ' + said);
      on('#next', 'click', () => answer(true));
      later(() => { if ($('#next')) $('#next').focus(); }, 50);
    } else {
      streak = 0;
      if (task.type === 'set' && clock) {
        later(() => clock.setTime(task.target.h, task.target.m, true), 400);
      }
      if (task.type === 'tapHand' && clock) {
        clock.pulse(task.want);
      }
      fb.hidden = false;
      fb.className = 'feedback try';
      fb.innerHTML = `<p class="fb-title">${phrase('wrong')}</p><p>${esc(task.explain)}</p>
        <button class="btn primary" id="next">Jag förstår →</button>`;
      if (settings.autoSpeak) speak(task.explain);
      on('#next', 'click', () => answer(false));
    }
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  app.querySelectorAll('button.choice').forEach((b) => b.addEventListener('click', () => {
    finish(task.choices[+b.dataset.j].correct, b);
  }));
  on('#check', 'click', () => {
    const t = clock.getTime();
    finish(norm12(t.h) === norm12(task.target.h) && t.m === task.target.m);
  });
}

// --- Resultat ---
// o (valfritt, för matten): { track, max, levelName, again, done, phrases }
function showResult(results, level, o = {}) {
  const p = profile;
  const track = o.track || p;
  const levelName = o.levelName || (id => levelById(id).name);
  const right = results.filter(r => r.correct).length;
  const stars = starsFor(right, results.length);
  p.stars += stars;
  p.passes++;
  const unlocked = level === track.unlocked && checkUnlock(track, o.max || MAX_LEVEL);
  const animal = newAnimal(p, false);
  const gold = unlocked ? newAnimal(p, true) : null;
  saveDb();

  const starHtml = [1, 2, 3].map(i => `<span class="big-star${i <= stars ? ' on' : ''}" style="animation-delay:${i * 0.25}s">★</span>`).join('');
  const msg = o.phrases && o.phrases['result' + stars]
    ? phrase('mresult' + stars, o.phrases['result' + stars]) : phrase('result' + stars);
  render(`
    <main class="page result">
      <h1>${msg}</h1>
      <div class="stars">${starHtml}</div>
      <p class="score">${right} av ${results.length} rätt</p>
      <div class="new-animal">
        <p>Du fick ett nytt djur till djurparken:</p>
        <div class="animal-reveal">${animal.e}</div>
        <p class="animal-name">${capitalize(esc(withArticle(animal.n)))}!</p>
      </div>
      ${unlocked ? `<div class="unlock">
        <p class="unlock-title">🎉 Ny nivå upplåst! 🎉</p>
        <p>Nivå ${track.unlocked}: ${levelName(track.unlocked)}</p>
        <div class="animal-reveal gold">${gold.e}</div>
        <p class="animal-name">Ett guld-djur: ${esc(gold.n)}!</p></div>` : ''}
      <div class="row">
        <button class="btn" id="again">Öva igen</button>
        <button class="btn primary" id="home">Klar</button>
      </div>
    </main>`);
  confetti();
  if (db.settings.autoSpeak) speak(`${msg} Du fick ${withArticle(animal.n)}!${unlocked ? ' Och du har låst upp en ny nivå!' : ''}`);
  on('#again', 'click', o.again || (() => startPass(p.current)));
  on('#home', 'click', o.done || showHub);
}

// --- Starttest ---
function showPlacement() {
  render(`
    ${topbar('Starttest')}
    <main class="page narrow center">
      <div class="big-emoji">${profile.avatar}</div>
      <h2>Hej ${esc(profile.name)}!</h2>
      <p>Nu ska vi se hur mycket du redan kan om klockan. Det gör inget om det blir fel – då vet vi vad vi ska öva på.</p>
      <button class="btn primary big" id="start">Starta</button>
    </main>`);
  bindBack(() => { profile.placed = true; saveDb(); showHub(); });
  on('#start', 'click', () => {
    // Två frågor per nivå från nivå 2. Båda rätt = gå vidare.
    let level = 2;
    let inLevel = [];
    const maxLevel = 7;
    const total = (maxLevel - 1) * 2;
    let k = 0;
    const step = () => {
      const t = makePlacementTask(level);
      showTask(t, k, total, 'Starttest', level, true, (correct) => {
        k++;
        inLevel.push(correct);
        if (!correct) return place(level);
        if (inLevel.length === 2) {
          if (level === maxLevel) return place(MAX_LEVEL);
          level++;
          inLevel = [];
        }
        step();
      }, () => { profile.placed = true; saveDb(); showHub(); });
    };
    step();
  });
}

function place(level) {
  profile.unlocked = level;
  profile.current = level;
  profile.placed = true;
  saveDb();
  render(`
    <main class="page narrow center result">
      <h1>Klart! 🎉</h1>
      <p>Vi börjar på</p>
      <div class="level-card small"><span class="level-icon">${levelById(level).icon}</span>
        <div><div class="level-no">Nivå ${level}</div><div class="level-name">${levelById(level).name}</div></div></div>
      <p class="muted">Nivåerna innan är upplåsta och går att repetera.</p>
      <button class="btn primary big" id="ok">Nu kör vi!</button>
    </main>`);
  confetti();
  on('#ok', 'click', showHub);
}

// --- Utforska ---
function showExplore(p) {
  const lv = p ? p.current : 6;
  const h0 = clockHelpers(lv, db.settings);
  let zones = h0.zones === 'none' ? 'none' : h0.zones;
  let minNums = h0.minNums;
  let showText = true;
  render(`
    ${topbar('Utforska')}
    <main class="task explore">
      <div class="task-visual"><div class="clock-wrap" id="clock"></div></div>
      <div class="task-side">
        <div class="readout" id="readout">
          <div class="words" id="words"></div>
          <div class="digitals"><span id="d12"></span><span id="d24" class="muted"></span></div>
        </div>
        <div class="row wrap">
          <button class="btn" data-step="-60">−1 tim</button>
          <button class="btn" data-step="-5">−5 min</button>
          <button class="btn" data-step="5">+5 min</button>
          <button class="btn" data-step="60">+1 tim</button>
        </div>
        <div class="row wrap">
          <button class="btn primary say-btn" id="say">🗣️ Läs upp</button>
          <button class="btn" id="random">🎲 Slumpa</button>
          <button class="btn" id="now">🕒 Nu</button>
        </div>
        <div class="toggles">
          <label><input type="checkbox" id="t-text" checked> Visa tiden i text</label>
          <label><input type="checkbox" id="t-zones" ${zones !== 'none' ? 'checked' : ''}> Över/i-zoner</label>
          <label><input type="checkbox" id="t-quarter" ${zones === 'quarter' ? 'checked' : ''}> Visa "i halv / över halv"</label>
          <label><input type="checkbox" id="t-min" ${minNums ? 'checked' : ''}> Minutsiffror</label>
        </div>
        <p class="muted small">Dra i visarna! Den korta visaren följer med när den långa går runt.</p>
      </div>
    </main>`);
  bindBack(() => (p ? showHub() : showHome()));
  let pm = null; // håller reda på förmiddag/eftermiddag för 24h-visning
  const now = new Date();
  pm = now.getHours() >= 12;
  const clock = mountClock('#clock', {
    mode: 'drag', snap: 1, zones, minuteNumbers: minNums,
    onChange: (h, m) => upd(),
    onRelease: (h, m) => { if (db.settings.autoSpeak) speak(sentence(h, m)); },
  });
  let lastH = 0;
  const upd = () => {
    const { h, m } = clock.getTime();
    // Byt fm/em när timvisaren passerar 12.
    if ((lastH === 11 && h === 0) || (lastH === 0 && h === 11)) pm = !pm;
    lastH = h;
    const h24 = h + (pm ? 12 : 0);
    $('#words').textContent = showText ? capitalize(timePhrase(h, m)) : '? ? ?';
    $('#d12').textContent = showText ? digital12(h, m) : '';
    $('#d24').textContent = showText ? `${digital24(h24, m)} ${partOfDay(h24)}` : '';
  };
  const set = (h, m, anim = true) => { clock.setTime(h, m, anim); lastH = norm12(h); upd(); };
  set(now.getHours(), now.getMinutes(), false);

  app.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => {
    const { h, m } = clock.getTime();
    let tot = h * 60 + m + +b.dataset.step;
    const before = h;
    tot = ((tot % 720) + 720) % 720;
    const nh = Math.floor(tot / 60);
    if ((before === 11 && nh === 0) || (before === 0 && nh === 11)) pm = !pm;
    set(nh, tot % 60);
    if (db.settings.autoSpeak) speak(sentence(nh, tot % 60));
  }));
  on('#say', 'click', () => { const { h, m } = clock.getTime(); speak(sentence(h, m)); });
  on('#random', 'click', () => { set(rnd(12), pick(ALL_FIVES)); });
  on('#now', 'click', () => { const d = new Date(); pm = d.getHours() >= 12; set(d.getHours(), d.getMinutes()); });
  on('#t-text', 'change', e => { showText = e.target.checked; upd(); });
  const applyZones = () => {
    const z = $('#t-zones').checked ? ($('#t-quarter').checked ? 'quarter' : 'half') : 'none';
    clock.setZones(z);
  };
  on('#t-zones', 'change', applyZones);
  on('#t-quarter', 'change', e => { if (e.target.checked) $('#t-zones').checked = true; applyZones(); });
  on('#t-min', 'change', e => clock.setMinuteNumbers(e.target.checked));
}

// --- Min dag ---
function sortedDay() {
  return db.day.slice().sort((a, b) => (a.h * 60 + a.m) - (b.h * 60 + b.m));
}

function showDay() {
  const items = sortedDay();
  const list = items.map(d => `
    <button class="day-item" data-id="${d.id}">
      ${miniClockSvg(d.h, d.m)}
      <span class="day-text"><span class="day-emoji">${d.emoji}</span> <b>${esc(d.text)}</b>
      <span class="muted">${capitalize(timePhrase(d.h, d.m))} ${partOfDay(d.h)} · ${digital24(d.h, d.m)}</span></span>
    </button>`).join('');
  render(`
    ${topbar('Min dag')}
    <main class="page">
      <p class="muted center">Tryck på en händelse för att höra när den är.</p>
      <div class="day-list">${list || '<p class="center muted">Inga händelser ännu. En vuxen kan lägga till dem.</p>'}</div>
      ${items.length ? '<button class="btn primary big" id="day-play">▶ Öva med min dag</button>' : ''}
    </main>`);
  bindBack(showHub);
  app.querySelectorAll('.day-item').forEach(b => b.addEventListener('click', () => {
    const d = db.day.find(x => x.id === b.dataset.id);
    speak(`${d.text} ${timePhrase(d.h, d.m)} ${partOfDay(d.h)}.`);
    b.classList.add('flash');
    setTimeout(() => b.classList.remove('flash'), 600);
  }));
  on('#day-play', 'click', startDayPass);
}

function startDayPass() {
  const items = shuffle(db.day).slice(0, 8);
  const tasks = items.map((d, i) => {
    const h = norm12(d.h), m = d.m;
    const words = timePhrase(d.h, d.m);
    const setTask = i % 2 === 0;
    const base = { level: profile.current, key: timeKey(h, m), h, m, explain: explain(h, m), hint: readHint(m), day: true };
    if (setTask) {
      return Object.assign(base, {
        type: 'set', clock: { h: 0, m: 0, mode: 'drag' }, target: { h, m },
        prompt: `${d.emoji} ${d.text} ${words}. Ställ klockan!`,
        say: `${d.text} ${words}. Ställ klockan.`,
        hint: `Börja med den långa visaren – var ska den stå för "${words}"?`,
      });
    }
    return Object.assign(base, {
      type: 'choice', kind: 'read', clock: { h, m },
      prompt: `${d.emoji} ${d.text}. Vad är klockan?`,
      say: `${d.text}. Vad är klockan?`,
      choices: textChoices(h, m, timePhrase),
    });
  });
  // Min dag räknas inte mot nivåupplåsning.
  tasks.forEach(t => { t.review = true; });
  runSession({
    tasks, level: profile.current, title: 'Min dag',
    onDone: (res) => showResult(res, -1),
  });
}

// --- Para ihop ---
function showMatch() {
  const p = profile;
  const lv = Math.min(p.unlocked, 7);
  const used = new Set();
  const times = [];
  const levelsForMatch = [];
  for (let l = 2; l <= Math.min(lv, 6); l++) levelsForMatch.push(l);
  while (times.length < 4) {
    const l = levelsForMatch.length ? pick(levelsForMatch.slice(-2)) : 2;
    const t = pickTime(l, null, used);
    const k = timeKey(t.h, t.m);
    if (used.has(k)) continue;
    used.add(k);
    times.push(t);
  }
  const useDigital = p.unlocked >= 7 && Math.random() < 0.5;
  const label = (t) => useDigital ? digital12(t.h, t.m) : capitalize(timePhrase(t.h, t.m));
  const clocksCol = shuffle(times.map((t, i) => ({ i, t })));
  const textCol = shuffle(times.map((t, i) => ({ i, t })));
  render(`
    ${topbar('Para ihop')}
    <main class="page">
      <p class="center">Tryck på en klocka och sedan på tiden som hör ihop med den.</p>
      <div class="match">
        <div class="match-col">${clocksCol.map(c => `<button class="match-card clock-card" data-i="${c.i}">${miniClockSvg(c.t.h, c.t.m)}</button>`).join('')}</div>
        <div class="match-col">${textCol.map(c => `<button class="match-card text-card" data-i="${c.i}">${esc(label(c.t))}</button>`).join('')}</div>
      </div>
      <div id="match-done" hidden class="center">
        <p class="fb-title" id="match-title"></p>
        <div class="row"><button class="btn" id="m-again">Spela igen</button><button class="btn primary" id="m-back">Klar</button></div>
      </div>
    </main>`);
  bindBack(showHub);
  let selClock = null, selText = null, found = 0, misses = 0;
  const tryPair = () => {
    if (!selClock || !selText) return;
    const a = selClock, b = selText;
    selClock = selText = null;
    if (a.dataset.i === b.dataset.i) {
      a.classList.remove('sel'); b.classList.remove('sel');
      a.classList.add('matched'); b.classList.add('matched');
      a.disabled = b.disabled = true;
      const t = times[+a.dataset.i];
      speak(sentence(t.h, t.m));
      found++;
      if (found === times.length) {
        const done = phrase('matchDone');
        $('#match-title').textContent = done;
        $('#match-done').hidden = false;
        speak(speakable(done));
        if (misses <= 1) { p.stars += 1; saveDb(); }
        confetti();
      }
    } else {
      misses++;
      a.classList.add('wrong'); b.classList.add('wrong');
      setTimeout(() => { a.classList.remove('wrong', 'sel'); b.classList.remove('wrong', 'sel'); }, 700);
    }
  };
  app.querySelectorAll('.clock-card').forEach(c => c.addEventListener('click', () => {
    app.querySelectorAll('.clock-card').forEach(x => x.classList.remove('sel'));
    c.classList.add('sel'); selClock = c; tryPair();
  }));
  app.querySelectorAll('.text-card').forEach(c => c.addEventListener('click', () => {
    app.querySelectorAll('.text-card').forEach(x => x.classList.remove('sel'));
    c.classList.add('sel'); selText = c;
    if (!useDigital) speak(c.textContent);
    tryPair();
  }));
  on('#m-again', 'click', showMatch);
  on('#m-back', 'click', showHub);
}

// --- Djurpark ---
function showZoo(back = showHub) {
  const p = profile;
  const grid = p.animals.map(a => `<div class="zoo-animal${a.gold ? ' gold' : ''}" title="${esc(a.n)}"><span>${a.e}</span><small>${esc(a.n)}</small></div>`).join('');
  render(`
    ${topbar(`${esc(p.name)}s djurpark`)}
    <main class="page">
      <p class="center">${p.animals.length ? `Du har ${p.animals.length} djur! Guld-djuren fick du när du klarade en ny nivå.` : 'Här hamnar djuren du vinner när du övar. Kör ett pass!'}</p>
      <div class="zoo">${grid}</div>
    </main>`);
  bindBack(back);
  app.querySelectorAll('.zoo-animal').forEach(el => el.addEventListener('click', () => speak(el.title)));
}

// --- Föräldraläge ---
function showParent(tab = 'overview') {
  const s = db.settings;
  const tabs = [['overview', 'Barnen'], ['day', 'Min dag'], ['settings', 'Inställningar']];
  let body = '';
  if (tab === 'overview') {
    body = db.profiles.length ? db.profiles.map(p => {
      const lvRows = LEVELS.filter(l => p.stats[l.id]).map(l => {
        const st = p.stats[l.id];
        const pct = Math.round(100 * st.right / st.total);
        return `<tr><td>${l.id}. ${l.name}</td><td>${st.right}/${st.total}</td><td><div class="bar"><i style="width:${pct}%"></i></div></td><td>${pct}%</td></tr>`;
      }).join('');
      const hard = Object.entries(p.mistakes).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([k, n]) => { const [hh, mm] = k.split(':').map(Number); return `<li>${capitalize(timePhrase(hh, mm))} <span class="muted">(${k}, ${n} fel)</span></li>`; }).join('');
      const opts = LEVELS.map(l => `<option value="${l.id}" ${l.id === p.unlocked ? 'selected' : ''}>${l.id}. ${l.name}</option>`).join('');
      return `<section class="panel">
        <h3>${p.avatar} ${esc(p.name)}</h3>
        <h4>🕐 Klockan</h4>
        <p>Nivå ${p.current} (upplåst till ${p.unlocked}) · ${p.passes} pass · ⭐ ${p.stars} · ${p.animals.length} djur</p>
        ${lvRows ? `<table class="stats"><thead><tr><th>Nivå</th><th>Rätt</th><th></th><th></th></tr></thead><tbody>${lvRows}</tbody></table>` : '<p class="muted">Inga övningar ännu.</p>'}
        ${hard ? `<p><b>Svårast just nu:</b></p><ul>${hard}</ul>` : ''}
        <div class="row wrap">
          <label>Högsta nivå <select data-unlock="${p.id}">${opts}</select></label>
          <button class="btn" data-retest="${p.id}">Gör om starttest</button>
        </div>
        ${mathParentHtml(p)}
        <div class="row wrap">
          <button class="btn" data-rename="${p.id}">Byt namn</button>
          <button class="btn danger" data-del="${p.id}">Ta bort</button>
        </div></section>`;
    }).join('') : '<p class="muted">Inga barn tillagda ännu.</p>';
  } else if (tab === 'day') {
    const rows = sortedDay().map(d => `
      <div class="day-edit" data-id="${d.id}">
        <input class="e-emoji" value="${esc(d.emoji)}" maxlength="4" aria-label="Emoji">
        <input class="e-text" value="${esc(d.text)}" maxlength="40" aria-label="Händelse">
        <input class="e-time" type="time" step="300" value="${digital24(d.h, d.m)}" aria-label="Tid">
        <button class="icon-btn e-del" aria-label="Ta bort">🗑️</button>
      </div>`).join('');
    body = `<section class="panel">
      <p class="muted">Lägg in familjens vanliga tider. Använd gärna jämna 5-minuterstider, t.ex. 08:15. Ändringar sparas direkt.</p>
      <div class="day-edits">${rows}</div>
      <button class="btn" id="day-add">＋ Lägg till händelse</button></section>`;
  } else {
    body = `<section class="panel settings">
      <label class="switch"><input type="checkbox" id="s-sound" ${s.sound ? 'checked' : ''}> <span>Ljud på (samma som 🔊/🔇-knappen)</span></label>
      <label class="switch"><input type="checkbox" id="s-speak" ${s.autoSpeak ? 'checked' : ''}> <span>Läs upp frågor och svar automatiskt (annars bara när man trycker 🗣️)</span></label>
      <label class="switch"><input type="checkbox" id="s-hints" ${s.hints ? 'checked' : ''}> <span>Visa "Tips till vuxna" vid varje uppgift</span></label>
      <div class="field">Hundrarutan i matten
        <select id="s-grid">
          <option value="1-100" ${s.mathGrid !== '0-99' ? 'selected' : ''}>1–100 (vanligast i skolan)</option>
          <option value="0-99" ${s.mathGrid === '0-99' ? 'selected' : ''}>0–99</option>
        </select></div>
      <div class="field">Hjälpzoner på klockan (över/i, minutsiffror)
        <select id="s-zones">
          <option value="auto" ${s.zones === 'auto' ? 'selected' : ''}>Automatiskt efter nivå (rekommenderas)</option>
          <option value="on" ${s.zones === 'on' ? 'selected' : ''}>Alltid på</option>
          <option value="off" ${s.zones === 'off' ? 'selected' : ''}>Alltid av</option>
        </select></div>
      <button class="btn" id="s-testvoice">🔊 Testa rösten</button>
      <p class="muted small">${canSpeak() ? '' : 'Den här webbläsaren saknar uppläsning.'} Hör du ingen svensk röst? På Windows: installera svenska under Inställningar → Tid och språk → Tal. På iPhone: Inställningar → Hjälpmedel → Uppläst innehåll → Röster.</p>
    </section>`;
  }
  render(`
    ${topbar('Vuxenläge')}
    <main class="page">
      <nav class="tabs">${tabs.map(([k, n]) => `<button class="tab${k === tab ? ' sel' : ''}" data-tab="${k}">${n}</button>`).join('')}</nav>
      ${body}
    </main>`);
  bindBack(showHome);
  app.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => showParent(b.dataset.tab)));

  // Barnen
  app.querySelectorAll('[data-unlock]').forEach(sel => sel.addEventListener('change', () => {
    const p = getProfile(sel.dataset.unlock);
    p.unlocked = +sel.value;
    p.current = p.unlocked;
    saveDb(); showParent('overview');
  }));
  app.querySelectorAll('[data-rename]').forEach(b => b.addEventListener('click', () => {
    const p = getProfile(b.dataset.rename);
    const n = prompt('Nytt namn:', p.name);
    if (n && n.trim()) { p.name = n.trim().slice(0, 20); saveDb(); showParent('overview'); }
  }));
  app.querySelectorAll('[data-retest]').forEach(b => b.addEventListener('click', () => {
    profile = getProfile(b.dataset.retest);
    showPlacement();
  }));
  app.querySelectorAll('[data-munlock]').forEach(sel => sel.addEventListener('change', () => {
    const m = getProfile(sel.dataset.munlock).math;
    m.unlocked = +sel.value;
    m.current = m.unlocked;
    m.placed = true;
    saveDb(); showParent('overview');
  }));
  app.querySelectorAll('[data-mretest]').forEach(b => b.addEventListener('click', () => {
    profile = getProfile(b.dataset.mretest);
    showMathStart();
  }));
  app.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    const p = getProfile(b.dataset.del);
    if (confirm(`Ta bort ${p.name} och alla framsteg? Det går inte att ångra.`)) { deleteProfile(p.id); showParent('overview'); }
  }));

  // Min dag
  app.querySelectorAll('.day-edit').forEach(row => {
    const d = db.day.find(x => x.id === row.dataset.id);
    row.querySelector('.e-emoji').addEventListener('change', e => { d.emoji = e.target.value || '⏰'; saveDb(); });
    row.querySelector('.e-text').addEventListener('change', e => { d.text = e.target.value.trim() || 'Händelse'; saveDb(); });
    row.querySelector('.e-time').addEventListener('change', e => {
      const [hh, mm] = (e.target.value || '12:00').split(':').map(Number);
      d.h = hh; d.m = mm; saveDb();
    });
    row.querySelector('.e-del').addEventListener('click', () => {
      db.day = db.day.filter(x => x.id !== d.id); saveDb(); showParent('day');
    });
  });
  on('#day-add', 'click', () => {
    db.day.push({ id: uid(), emoji: '⭐', text: 'Ny händelse', h: 12, m: 0 });
    saveDb(); showParent('day');
  });

  // Inställningar
  on('#s-sound', 'change', e => setSound(e.target.checked));
  on('#s-speak', 'change', e => { s.autoSpeak = e.target.checked; saveDb(); });
  on('#s-hints', 'change', e => { s.hints = e.target.checked; saveDb(); });
  on('#s-zones', 'change', e => { s.zones = e.target.value; saveDb(); });
  on('#s-grid', 'change', e => { s.mathGrid = e.target.value; saveDb(); });
  on('#s-testvoice', 'click', () => speak('Hej! Klockan är fem i halv tre.'));
}

// Mattens del av föräldraöversikten.
function mathParentHtml(p) {
  const m = p.math;
  const lvRows = MATH_LEVELS.filter(l => m.stats[l.id]).map(l => {
    const st = m.stats[l.id];
    const pct = Math.round(100 * st.right / st.total);
    return `<tr><td>${l.id}. ${l.name}</td><td>${st.right}/${st.total}</td><td><div class="bar"><i style="width:${pct}%"></i></div></td><td>${pct}%</td></tr>`;
  }).join('');
  const hard = Object.entries(m.cats).filter(([, c]) => c.total >= 3 && c.right < c.total)
    .sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total).slice(0, 4)
    .map(([k, c]) => `<li>${esc(MATH_CATS[k] || k)} <span class="muted">(${c.right}/${c.total} rätt)</span></li>`).join('');
  const opts = MATH_LEVELS.map(l => `<option value="${l.id}" ${l.id === m.unlocked ? 'selected' : ''}>${l.id}. ${l.name}</option>`).join('');
  return `<h4>➕ Plus och minus</h4>
    <p>${m.placed ? `Nivå ${m.current} (upplåst till ${m.unlocked})` : 'Har inte börjat ännu.'}</p>
    ${lvRows ? `<table class="stats"><thead><tr><th>Nivå</th><th>Rätt</th><th></th><th></th></tr></thead><tbody>${lvRows}</tbody></table>` : ''}
    ${hard ? `<p><b>Svårast just nu:</b></p><ul>${hard}</ul>` : ''}
    <div class="row wrap">
      <label>Högsta nivå <select data-munlock="${p.id}">${opts}</select></label>
      <button class="btn" data-mretest="${p.id}">Gör om starttest</button>
    </div>`;
}

// --- Start ---
loadDb();
document.body.classList.toggle('muted', !db.settings.sound);
showHome();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
