// Hundrarutan: 10 × 10 tal (1–100 eller 0–99) som går att trycka på.
// Hopp visas med färger: tiotal blått (rakt upp/ner), ental orange (åt sidan).

// Rutorna som ett hopp passerar: först tiotalen (lodrätt), sen entalen (vågrätt).
function jumpCells(from, to) {
  const d = to - from, s = Math.sign(d);
  const cells = [];
  let x = from;
  for (let k = 0; k < Math.floor(Math.abs(d) / 10); k++) { x += 10 * s; cells.push({ n: x, kind: 'tens' }); }
  while (x !== to) { x += s; cells.push({ n: x, kind: 'ones' }); }
  return cells;
}
function jumpKind(j) {
  const d = Math.abs(j.to - j.from);
  return d % 10 === 0 ? 'tens' : d < 10 ? 'ones' : 'mix';
}
function jumpLabel(j) {
  const d = j.to - j.from;
  return (d >= 0 ? '+' : MINUS) + Math.abs(d);
}

const STEP_MS = 150;

class HundredGrid {
  constructor(container, opts = {}) {
    this.first = opts.first === 0 ? 0 : 1;
    this.onTap = opts.onTap || null;
    const cells = [];
    for (let i = 0; i < 100; i++) {
      const n = this.first + i;
      const q = (i % 10 >= 5) !== (Math.floor(i / 10) >= 5); // 5×5-block i olika ton
      cells.push(`<button class="hc${q ? ' q' : ''}" data-n="${n}" ${this.onTap ? '' : 'tabindex="-1"'}>${n}</button>`);
    }
    container.innerHTML = `<div class="hgrid${this.onTap ? ' tappable' : ''}" role="grid">${cells.join('')}</div>`;
    this.root = container.firstElementChild;
    this.handler = (e) => {
      const b = e.target.closest('.hc');
      if (b && this.onTap) this.onTap(+b.dataset.n);
    };
    this.root.addEventListener('click', this.handler);
  }

  cell(n) { return this.root.querySelector(`.hc[data-n="${n}"]`); }
  has(n) { return n >= this.first && n < this.first + 100; }

  clear() {
    this.root.querySelectorAll('.hc').forEach(c => {
      c.className = c.className.split(' ').filter(k => k === 'hc' || k === 'q').join(' ');
      c.style.removeProperty('--d');
      delete c.dataset.badge;
      delete c.dataset.token;
    });
  }

  // Visa startrutan och hoppen. Hopp från index animateFrom och framåt animeras.
  // Returnerar hur lång animationen är (ms).
  show(start, jumps, { animateFrom = null, token = '' } = {}) {
    this.clear();
    const s = this.cell(start);
    if (s) s.classList.add('start');
    let k = 0;
    jumps.forEach((j, i) => {
      const anim = animateFrom !== null && i >= animateFrom;
      let last = null;
      jumpCells(j.from, j.to).forEach(({ n, kind }) => {
        const c = this.cell(n);
        if (!c) return;
        c.classList.remove('p-tens', 'p-ones');
        c.classList.add('p-' + kind);
        if (anim) { c.classList.add('anim'); c.style.setProperty('--d', (k * STEP_MS) + 'ms'); k++; }
        last = c;
      });
      if (last) last.dataset.badge = jumpLabel(j);
    });
    const end = this.cell(jumps.length ? jumps[jumps.length - 1].to : start);
    if (end) {
      end.classList.add('cur');
      if (token) end.dataset.token = token;
    }
    return k * STEP_MS;
  }

  // Markera ett tal och dess grannar (+1, −1, +10, −10).
  showNeighbours(n, on = true) {
    this.clear();
    const c = this.cell(n);
    if (c) c.classList.add('cur');
    if (!on) return;
    [[1, 'ones'], [-1, 'ones'], [10, 'tens'], [-10, 'tens']].forEach(([d, kind]) => {
      const x = this.cell(n + d);
      if (!x) return;
      x.classList.add('p-' + kind, 'nb');
      x.dataset.badge = (d > 0 ? '+' : MINUS) + Math.abs(d);
    });
  }

  destroy() { this.root.removeEventListener('click', this.handler); }
}
