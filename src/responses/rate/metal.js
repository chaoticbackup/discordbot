export function metal(stats, card) {
    // _C=Stats on card
    const _C = [
      Number(card.gsx$courage),
      Number(card.gsx$power),
      Number(card.gsx$wisdom),
      Number(card.gsx$speed),
      Number(card.gsx$energy)
    ];
  
    // _A=Average Stats
    // _W=Weight of stat in proportion to other stats
    const tA = stats[0] + stats[1] + stats[2] + stats[3];
    const cW = stats[0] / tA;
    const pW = stats[1] / tA;
    const wW = stats[2] / tA;
    const sW = stats[3] / tA;
  
    // c=courage p=power w=wisdom s=speed e=energy
    let c, p, w, s, e;
  
    ([c, p, w, s] = (() => {
      const r = [];
      for (let i = 0; i < 4; i++) {
        if (stats[i] == _C[i] + 10)
          r[i] = 0.6;
        else if (stats[i] == _C[i] + 5)
          r[i] = 0.45;
        else if (stats[i] == _C[i])
          r[i] = 0.3;
        else if (stats[i] == _C[i] - 5)
          r[i] = 0.15;
        else if (stats[i] == _C[i] - 10)
          r[i] = 0;
      }
      return r;
    })());
  
    (e = (() => {
      if (stats[4] == _C[4] + 5)
        return 0.4;
      else if (stats[4] == _C[4])
        return 0.2;
      else if (stats[4] == _C[4] - 5)
        return 0;
    })());
  
    // total
    const t = Number.parseFloat((c * cW + p * pW + w * wW + s * sW + e) * 100).toFixed(2);
  
    c = Number.parseFloat(c * cW * 100).toPrecision(2);
    p = Number.parseFloat(p * pW * 100).toPrecision(2);
    w = Number.parseFloat(w * wW * 100).toPrecision(2);
    s = Number.parseFloat(s * sW * 100).toPrecision(2);
    e = Number.parseFloat(e * 100).toPrecision(2);
  
    return [c, p, w, s, e, `${t}%`];
  }
  