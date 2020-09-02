export function king(stats, card, options) {
  let c, p, w, s, e;

  ([c, p, w, s] = (() => {
    function stat_max(c) { return Number(c) + 10; }
    const max = [
      stat_max(card.gsx$courage),
      stat_max(card.gsx$power),
      stat_max(card.gsx$wisdom),
      stat_max(card.gsx$speed)
    ];

    function base(c, s) { return 100 - (c - s) * 5; }
    const s = [
      base(max[0], stats[0]),
      base(max[1], stats[1]),
      base(max[2], stats[2]),
      base(max[3], stats[3])
    ];

    if (options.includes('pure')) return s;

    // valuable stat checks
    // 50, 60, 70, 75, 100
    if (!options.includes('nocheck')) {
      for (let i = 0; i < 4; i++) {
        if (max[i] >= 100 && stats[i] < 100) {
          s[i] *= 0.80;
        }
        else if (max[i] >= 75 && stats[i] < 75) {
          s[i] *= 0.80;
        }
        else if (max[i] >= 70 && stats[i] < 70) {
          s[i] *= 0.90;
        }
        else if (max[i] >= 60 && stats[i] < 60) {
          s[i] *= 0.70;
        }
        else if (max[i] >= 50 && stats[i] < 50) {
          s[i] *= 0.90;
        }
      }
    }

    // Bias values against each other
    if (!options.includes('noweight')) {
      let h = [0];
      for (let i = 0; i < 4; i++) {
        if (s[i] == s[h[0]]) {
          if (i != 0) h.push(i);
        }
        else if (s[i] > s[h[0]]) {
          for (let j = 0; j < h.length; j++) {
            s[h[j]] *= 0.90; // reduce score
          }
          h = [i]; // reset array
        }
        else {
          s[i] *= 0.90; // reduce score
        }
      }
    }
    return s;
  })());

  e = (() => {
    const max = Number(card.gsx$energy) + 5;
    let value = 100 - (max - stats[4]) * 10;

    if (options.includes('pure')) return value;

    // 65, 85 Xerium Armor
    if (!options.includes('nocheck')) {
      if (max >= 85 && stats[4] < 85) {
        value *= 0.80;
      }
      else if (max >= 65 && stats[4] < 65) {
        value *= 0.80;
      }
    }

    // This prevents total being over 100%
    if ((c + p + w + s) / 4 > 85) return value;

    return value * 1.5;
  })();

  const total = Number.parseFloat((c + p + w + s + e) / 5).toFixed(2);

  return [`${c}%`, `${p}%`, `${w}%`, `${s}%`, `${e}%`, `${total}%`];
}
