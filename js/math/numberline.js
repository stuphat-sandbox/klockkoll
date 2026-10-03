// Tom tallinje: talen man landar på och bågar för varje hopp ("+20", "+5").
// Avstånden är ungefärliga – större hopp blir längre, men små hopp syns ändå.

class NumberLine {
  constructor(container) {
    this.el = container;
  }

  show(start, jumps, { animateFrom = null, startDelay = 0 } = {}) {
    const vals = [...new Set([start, ...jumps.map(j => j.to)])].sort((a, b) => a - b);
    const margin = 30, minGap = 52, avail = 520;
    const raw = vals.slice(1).map((v, i) => Math.sqrt(v - vals[i]));
    const total = raw.reduce((s, x) => s + x, 0) || 1;
    const gaps = raw.map(r => Math.max(minGap, r / total * avail));
    const W = Math.max(320, margin * 2 + gaps.reduce((s, g) => s + g, 0));
    const offset = (W - margin * 2 - gaps.reduce((s, g) => s + g, 0)) / 2;
    const xOf = new Map();
    let x = margin + offset;
    vals.forEach((v, i) => { if (i) x += gaps[i - 1]; xOf.set(v, x); });

    const Y = 92;
    const end = jumps.length ? jumps[jumps.length - 1].to : start;
    let svg = `<line class="nl-axis" x1="6" y1="${Y}" x2="${W - 6}" y2="${Y}"/>`;
    let arcs = '';
    let d = startDelay;
    jumps.forEach((j, i) => {
      const x1 = xOf.get(j.from), x2 = xOf.get(j.to);
      const h = Math.min(62, 20 + Math.abs(x2 - x1) * 0.35);
      const mx = (x1 + x2) / 2, cy = Y - 2 * h;
      const kind = jumpKind(j);
      const anim = animateFrom !== null && i >= animateFrom;
      const dur = jumpCells(j.from, j.to).length * STEP_MS;
      const st = anim ? ` style="--d:${d}ms;--dur:${Math.max(250, dur)}ms;--d2:${d + Math.max(250, dur) - 100}ms"` : '';
      // Pilspets i hoppets riktning.
      const ang = Math.atan2(Y - cy, x2 - mx);
      const p = (a, r) => `${(x2 - Math.cos(ang + a) * r).toFixed(1)},${(Y - Math.sin(ang + a) * r).toFixed(1)}`;
      arcs += `<path class="nl-arc ${kind}${anim ? ' anim' : ''}" pathLength="1" d="M${x1.toFixed(1)},${Y} Q${mx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${Y}"${st}/>
        <polygon class="nl-head ${kind}${anim ? ' anim' : ''}" points="${x2.toFixed(1)},${Y} ${p(0.45, 11)} ${p(-0.45, 11)}"${st}/>
        <text class="nl-label ${kind}${anim ? ' anim' : ''}" x="${mx.toFixed(1)}" y="${(Y - h - 8).toFixed(1)}"${st}>${jumpLabel(j)}</text>`;
      if (anim) d += Math.max(250, dur);
    });
    let nums = '';
    vals.forEach(v => {
      const vx = xOf.get(v).toFixed(1);
      const cls = v === start ? ' start' : v === end ? ' end' : '';
      nums += `<line class="nl-tick" x1="${vx}" y1="${Y - 7}" x2="${vx}" y2="${Y + 7}"/>
        <text class="nl-num${cls}" x="${vx}" y="${Y + 26}">${v}</text>`;
    });
    this.el.innerHTML = `<svg viewBox="0 0 ${W.toFixed(0)} 124" role="img" aria-label="Tallinje">${svg}${arcs}${nums}</svg>`;
    return d - startDelay;
  }

  destroy() {}
}
