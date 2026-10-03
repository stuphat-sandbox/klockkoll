// Tiorutor (prickar i 2 × 5) och tiostavar/entalskuber som HTML.

// frames: lista med tiorutor, varje ruta 10 celler: 'a' | 'b' | 'x' (borttagen) | ''.
function tenFramesHtml(frames, after = false) {
  let i = 0;
  return `<div class="frames${after ? ' after' : ''}">${frames.map(f => `<div class="tenframe">${
    f.map(c => `<i class="tf${c ? ' tf-' + c : ''}" style="--i:${c === 'b' || c === 'x' ? i++ : 0}"></i>`).join('')
  }</div>`).join('')}</div>`;
}

// spec: { groups: [{ t, o, gone, goneOnes, fresh }], op }
// t = antal tiostavar, o = antal entalskuber. gone/goneOnes = överstrukna (borttagna) från slutet.
function blocksHtml(spec) {
  const groups = spec.groups.map(g => {
    const t = g.t || 0, o = g.o || 0;
    let rods = '';
    for (let i = 0; i < t; i++) {
      rods += `<span class="rod${i >= t - (g.gone || 0) ? ' gone' : ''}">${'<b></b>'.repeat(10)}</span>`;
    }
    // Kuberna staplas i kolumner om 5, nerifrån och upp.
    let cols = '';
    for (let c = 0; c * 5 < o; c++) {
      let col = '';
      for (let i = c * 5; i < Math.min(o, c * 5 + 5); i++) {
        const gone = i >= o - (g.goneOnes || 0);
        const fresh = g.fresh && i >= o - g.fresh;
        col += `<span class="cube${gone ? ' gone' : ''}${fresh ? ' fresh' : ''}"></span>`;
      }
      cols += `<span class="cubecol">${col}</span>`;
    }
    return `<div class="bgroup">${rods}${cols}${!t && !o ? '<span class="bempty">0</span>' : ''}</div>`;
  });
  return `<div class="blocks">${groups.join(spec.op ? `<span class="bop">${opSign(spec.op)}</span>` : '')}</div>`;
}

function placeWords(n) {
  return `${Math.floor(n / 10)} tiotal och ${n % 10} ental`;
}
