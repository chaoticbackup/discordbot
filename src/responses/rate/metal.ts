import { Creature } from '../../definitions';

export function metal(stats: number[], card: Creature): number[] {
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
  let [c, p, w, s]: string[] | number[] = (() => {
    const r = [];
    for (let i = 0; i < 4; i++) {
      if (stats[i] === _C[i] + 10)
        r[i] = 0.6;
      else if (stats[i] === _C[i] + 5)
        r[i] = 0.45;
      else if (stats[i] === _C[i])
        r[i] = 0.3;
      else if (stats[i] === _C[i] - 5)
        r[i] = 0.15;
      else if (stats[i] === _C[i] - 10)
        r[i] = 0;
    }
    return r;
  })();

  let e: string | number = (() => {
    if (stats[4] === _C[4] + 5)
      return 0.4;
    else if (stats[4] === _C[4])
      return 0.2;
    else if (stats[4] === _C[4] - 5)
      return 0;
    else
      return 0;
  })();

  const t = parseFloat(Number((c * cW + p * pW + w * wW + s * sW + e) * 100).toFixed(2));
  c = parseFloat(Number(c * cW * 100).toFixed(2));
  p = parseFloat(Number(p * pW * 100).toFixed(2));
  w = parseFloat(Number(w * wW * 100).toFixed(2));
  s = parseFloat(Number(s * sW * 100).toFixed(2));
  e = parseFloat(Number(e * 100).toFixed(2));

  return [c, p, w, s, e, t];
}
