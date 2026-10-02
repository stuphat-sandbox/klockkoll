// Analog SVG-klocka med kopplade visare, dragning och hjälpzoner.

const SVG_NS = 'http://www.w3.org/2000/svg';
const HOUR_LEN = 50;
const MIN_LEN = 82;

function polar(r, deg) {
  const a = deg * Math.PI / 180;
  return [r * Math.sin(a), -r * Math.cos(a)];
}

function angDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function sectorPath(r, fromMin, toMin) {
  const a1 = fromMin * 6, a2 = toMin * 6;
  const [x1, y1] = polar(r, a1);
  const [x2, y2] = polar(r, a2);
  const large = a2 - a1 > 180 ? 1 : 0;
  return `M0,0 L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
}

const ZONES = {
  half: [
    { from: 0, to: 30, cls: 'z-over', label: 'över', at: 12 },
    { from: 30, to: 60, cls: 'z-i', label: 'i', at: 48 },
  ],
  quarter: [
    { from: 0, to: 20, cls: 'z-over', label: 'över', at: 10 },
    { from: 20, to: 30, cls: 'z-ihalv', label: 'i halv', at: 25 },
    { from: 30, to: 40, cls: 'z-overhalv', label: 'över halv', at: 35 },
    { from: 40, to: 60, cls: 'z-i', label: 'i', at: 50 },
  ],
};

class Clock {
  constructor(container, opts = {}) {
    this.opts = Object.assign({
      mode: 'static',       // 'static' | 'drag' | 'tap'
      snap: 5,              // minutsteg vid dragning
      zones: 'none',        // 'none' | 'half' | 'quarter'
      minuteNumbers: false,
      onChange: null,       // (h, m) vid varje ändring
      onRelease: null,      // (h, m) när man släpper
      onHandTap: null,      // ('hour'|'minute') i tap-läge
    }, opts);
    this.h = 12 % 12;
    this.m = 0;
    this.dragHand = null;
    this.anim = null;

    this.el = document.createElementNS(SVG_NS, 'svg');
    this.el.setAttribute('viewBox', '-120 -120 240 240');
    this.el.setAttribute('class', 'clock mode-' + this.opts.mode);
    this.el.setAttribute('role', 'img');
    this.faceG = document.createElementNS(SVG_NS, 'g');
    this.handsG = document.createElementNS(SVG_NS, 'g');
    this.labelsG = document.createElementNS(SVG_NS, 'g');
    this.labelsG.setAttribute('class', 'labels');
    this.el.append(this.faceG, this.handsG, this.labelsG);
    this.renderFace();
    this.renderHands();
    container.appendChild(this.el);

    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
    this.el.addEventListener('pointerdown', this.onDown);
    this.el.addEventListener('pointermove', this.onMove);
    this.el.addEventListener('pointerup', this.onUp);
    this.el.addEventListener('pointercancel', this.onUp);
    this.update();
  }

  renderFace() {
    let s = `<circle class="rim" r="104"/><circle class="face-bg" r="100"/>`;
    let labels = '';
    const zones = ZONES[this.opts.zones];
    if (zones) {
      for (const z of zones) s += `<path class="zone ${z.cls}" d="${sectorPath(100, z.from, z.to)}"/>`;
      // Etiketterna ligger ovanpå visarna så att de alltid syns.
      for (const z of zones) {
        const [x, y] = polar(58, z.at * 6);
        labels += `<text class="zone-label ${z.cls}" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${z.label}</text>`;
      }
    }
    for (let i = 0; i < 60; i++) {
      const big = i % 5 === 0;
      const [x1, y1] = polar(big ? 89 : 94, i * 6);
      const [x2, y2] = polar(98, i * 6);
      s += `<line class="tick${big ? ' big' : ''}" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`;
    }
    for (let n = 1; n <= 12; n++) {
      const [x, y] = polar(76, n * 30);
      s += `<text class="num" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${n}</text>`;
    }
    if (this.opts.minuteNumbers) {
      for (let n = 0; n < 12; n++) {
        const [x, y] = polar(112, n * 30);
        s += `<text class="min-num" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${n === 0 ? '00' : n * 5}</text>`;
      }
    }
    this.faceG.innerHTML = s;
    this.labelsG.innerHTML = labels;
  }

  renderHands() {
    this.handsG.innerHTML = `
      <g class="hand hand-hour"><line class="hit" x1="0" y1="0" x2="0" y2="${-HOUR_LEN}"/><line class="shape" x1="0" y1="12" x2="0" y2="${-HOUR_LEN}"/></g>
      <g class="hand hand-minute"><line class="hit" x1="0" y1="0" x2="0" y2="${-MIN_LEN}"/><line class="shape" x1="0" y1="14" x2="0" y2="${-MIN_LEN}"/></g>
      <circle class="center" r="6"/>`;
    this.hourHand = this.handsG.querySelector('.hand-hour');
    this.minHand = this.handsG.querySelector('.hand-minute');
  }

  hourAngle(h = this.h, m = this.m) { return ((h % 12) + m / 60) * 30; }

  update(total) {
    let ha, ma;
    if (total !== undefined) {
      ha = (total / 60) * 30;
      ma = (total % 60) * 6;
    } else {
      ha = this.hourAngle();
      ma = this.m * 6;
    }
    this.hourHand.setAttribute('transform', `rotate(${ha})`);
    this.minHand.setAttribute('transform', `rotate(${ma})`);
  }

  setTime(h, m, animate = false) {
    const from = (this.h % 12) * 60 + this.m;
    this.h = ((h % 12) + 12) % 12;
    this.m = m;
    const to = this.h * 60 + this.m;
    if (this.anim) cancelAnimationFrame(this.anim);
    if (!animate || from === to) { this.update(); return; }
    let diff = ((to - from) % 720 + 720) % 720;
    if (diff > 360) diff -= 720;
    const start = performance.now();
    const dur = Math.min(1400, 500 + Math.abs(diff) * 2);
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const cur = ((from + diff * e) % 720 + 720) % 720;
      this.update(cur);
      if (t < 1) this.anim = requestAnimationFrame(step);
      else { this.anim = null; this.update(); }
    };
    this.anim = requestAnimationFrame(step);
  }

  getTime() { return { h: this.h, m: this.m }; }

  setZones(z) { this.opts.zones = z; this.renderFace(); }
  setMinuteNumbers(b) { this.opts.minuteNumbers = b; this.renderFace(); }
  setMode(mode) {
    this.opts.mode = mode;
    this.el.setAttribute('class', 'clock mode-' + mode);
  }

  pulse(hand) {
    const g = hand === 'hour' ? this.hourHand : this.minHand;
    g.classList.remove('pulse');
    void g.getBBox();
    g.classList.add('pulse');
    setTimeout(() => g.classList.remove('pulse'), 1600);
  }

  // --- Pekare ---
  pointFromEvent(e) {
    const pt = this.el.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(this.el.getScreenCTM().inverse());
    const r = Math.hypot(p.x, p.y);
    let ang = Math.atan2(p.x, -p.y) * 180 / Math.PI;
    if (ang < 0) ang += 360;
    return { x: p.x, y: p.y, r, ang };
  }

  distToHand(p, angle, len) {
    const [dx, dy] = polar(1, angle);
    const t = Math.max(0, Math.min(len, p.x * dx + p.y * dy));
    return Math.hypot(p.x - t * dx, p.y - t * dy);
  }

  pickHand(p) {
    const dH = this.distToHand(p, this.hourAngle(), HOUR_LEN);
    const dM = this.distToHand(p, this.m * 6, MIN_LEN);
    let hand = dH < dM ? 'hour' : 'minute';
    // Visarna ligger nästan på varandra: nära mitten = korta visaren.
    if (Math.abs(dH - dM) < 6) hand = p.r <= HOUR_LEN + 4 ? 'hour' : 'minute';
    return { hand, dist: Math.min(dH, dM) };
  }

  onDown(e) {
    if (this.opts.mode === 'static') return;
    const p = this.pointFromEvent(e);
    if (p.r > 118) return;
    if (this.opts.mode === 'tap') {
      const { hand, dist } = this.pickHand(p);
      if (dist < 22 && this.opts.onHandTap) this.opts.onHandTap(hand);
      return;
    }
    e.preventDefault();
    const pick = this.pickHand(p);
    // Klick långt från båda visarna flyttar minutvisaren dit.
    this.dragHand = pick.dist < 24 ? pick.hand : (p.r < 40 ? null : 'minute');
    if (!this.dragHand) return;
    this.el.setPointerCapture(e.pointerId);
    this.el.classList.add('dragging');
    if (this.anim) { cancelAnimationFrame(this.anim); this.anim = null; }
    this.applyAngle(p.ang, false);
  }

  onMove(e) {
    if (!this.dragHand) return;
    e.preventDefault();
    this.applyAngle(this.pointFromEvent(e).ang, true);
  }

  onUp() {
    if (!this.dragHand) return;
    this.dragHand = null;
    this.el.classList.remove('dragging');
    if (this.opts.onRelease) this.opts.onRelease(this.h, this.m);
  }

  applyAngle(ang, continuous) {
    const snap = this.opts.snap;
    const oldH = this.h, oldM = this.m;
    if (this.dragHand === 'minute') {
      let m = Math.round(ang / 6 / snap) * snap % 60;
      if (continuous) {
        if (oldM >= 45 && m < 15) this.h = (this.h + 1) % 12;
        else if (oldM < 15 && m >= 45) this.h = (this.h + 11) % 12;
      }
      this.m = m;
    } else {
      this.h = ((Math.round(ang / 30 - this.m / 60) % 12) + 12) % 12;
    }
    if (this.h !== oldH || this.m !== oldM) {
      this.update();
      if (this.opts.onChange) this.opts.onChange(this.h, this.m);
    }
  }

  destroy() {
    if (this.anim) cancelAnimationFrame(this.anim);
    this.el.remove();
  }
}
