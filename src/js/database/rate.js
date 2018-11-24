const API = require('./database.js').default;

export function rate_card(text, options, bot) {
  try {
    var name = text.split(/\s\d.*/g)[0].trim();
    var stats = text.match(/\d+/g).map(Number);
    if (!stats || stats.length != 5) throw "";
  } catch (err) {
    return "!rate <Creature> <Courage> <Power> <Wisdom> <Speed> <Energy>";
  }

  let results = API.find_cards_by_name(name);
  if (results.length <= 0) {
    return "That's not a valid card name";
  }
  let card = results[0];
  if (card.gsx$type != "Creatures") return `${card.gsx$name} is not a Creature`;

  let error = "";

  if (stats[0] % 5 != 0) error += "Courage must be a multiple of 5\n";
  if (stats[0] > Number(card.gsx$courage) + 10 || stats[0] < Number(card.gsx$courage) - 10) {
    error += `Courage must be between ${Number(card.gsx$courage) - 10} and ${Number(card.gsx$courage) + 10}\n`;
  }
  if (stats[1] % 5 != 0) error += "Power must be a multiple of 5\n";
  if (stats[1] > Number(card.gsx$power) + 10 || stats[1] < Number(card.gsx$power) - 10) {
    error += `Power must be between ${Number(card.gsx$power) - 10} and ${Number(card.gsx$power) + 10}\n`;
  }
  if (stats[2] % 5 != 0) error += "Wisdom must be a multiple of 5\n";
  if (stats[2] > Number(card.gsx$wisdom) + 10 || stats[2] < Number(card.gsx$wisdom) - 10) {
    error += `Wisdom must be between ${Number(card.gsx$wisdom) - 10} and ${Number(card.gsx$wisdom) + 10}\n`;
  }
  if (stats[3] % 5 != 0) error += "Speed must be a multiple of 5\n";
  if (stats[3] > Number(card.gsx$speed) + 10 || stats[3] < Number(card.gsx$speed) - 10) {
    error += `Speed must be between ${Number(card.gsx$speed) - 10} and ${Number(card.gsx$speed) + 10}\n`;
  }
  if (stats[4] % 5 != 0) error += "Energy must be a multiple of 5\n";
  if (stats[4] > Number(card.gsx$energy) + 5 || stats[4] < Number(card.gsx$energy) - 5) {
    error += `Energy must be between ${Number(card.gsx$energy) - 5} and ${Number(card.gsx$energy) + 5}\n`;
  }

  if (error) return error;

  let courage, power, wisdom, speed, energy, total;

  if (options.includes('king')) {
    ([courage, power, wisdom, speed, energy, total] = king(stats, card, options));
  }
  else if (options.includes('metal')) {
    return "metal is working on his";
  }
  else {
    ([courage, power, wisdom, speed, energy, total] = smildon(stats, card));
  }

  return (
    bot.emojis.find(emoji => emoji.name=="Courage") + " " + courage + "\n" +
    bot.emojis.find(emoji => emoji.name=="Power") + " " + power + "\n" +
    bot.emojis.find(emoji => emoji.name=="Wisdom") + " " + wisdom + "\n" +
    bot.emojis.find(emoji => emoji.name=="Speed") + " " + speed + "\n" +
    "| E |  " + energy + "\n" +
    "Total Rating: " + total
  );
}

function king(stats, card, options) {
  // valuable stat checks
  // 50, 60, 70, 75, 100
  function discipline(c, s) {
    let max = Number(c) + 10;
    let value = 100 - (max - s) * 5;

    if (options.includes('nocheck') || options.includes('pure')) return value;

    if (max >= 100 && s < 100) {
      value = value * .80;
    }
    else if (max >= 75 && s < 75) {
      value = value * .70;
    }
    else if (max >= 70 && s < 70) {
      value = value * .90;
    }
    else if (max >= 60 && s < 60) {
      value = value * .70;
    }
    else if (max >= 50 && s < 50) {
      value = value * .90;
    }

    return value;
  }

  let courage = discipline(card.gsx$courage, stats[0]);
  let power   = discipline(card.gsx$power, stats[1]);
  let wisdom  = discipline(card.gsx$wisdom, stats[2]);
  let speed   = discipline(card.gsx$speed, stats[3]);

  // 65, 85 Xerium Armor
  let energy  = ((c, e) => {
    let max = Number(c) + 5;
    let value = 100 - (max - e) * 10;

    if (options.includes('nocheck') || options.includes('pure')) return value;

    if (max >= 85 && e < 85) {
      value = value * .70;
    }
    else if (max >= 65 && e < 65) {
      value = value * .75;
    }
    return value;
  })(card.gsx$energy, stats[4]);
  
  // Bias values against each other
  let c, p, w, s;
  ([c, p, w, s] = (() => {
    let h = [0];
    let s = [courage, power, wisdom, speed];

    if (options.includes('noweight') || options.includes('pure')) return s;

    for (let i = 0; i < s.length; i++) {
      if (s[i] > s[h[0]]) {
        for (let j = 0; j < h.length; j++) {
          s[h[j]] = s[h[j]] * .80; // reduce score
        }
        h = [i]; // reset array
      }
      else if (s[i] == s[h[0]]) h.push(s[i]);
      else {
        s[i] = s[i] * .80; // reduce score
      }
    }
    return s;
  })());

  let e = (() => {
    // This prevents over 100%
    if ((c + p + w + s) / 4 > 85) return energy;
    if (options.includes('pure')) return energy;
    return energy*1.5;
  })();

  let total = Number.parseFloat((c + p + w + s + e) / 5).toFixed(2);

  return [c+"%", p+"%", w+"%", s+"%", e+"%", total+"%"];
}

function smildon(stats, card) {
  let courage = (stats[0] - card.gsx$courage) / 5;
  let power = (stats[1] - card.gsx$power) / 5;
  let wisdom = (stats[2] - card.gsx$wisdom) / 5;
  let speed = (stats[3] - card.gsx$speed) / 5;
  let energy = (stats[4] - card.gsx$energy) / 5;
  let total = ((energy*1.5)+courage+power+wisdom+speed) / 5;

  return [courage, power, wisdom, speed, energy, total];
}

function metal(stats, card) {

}

