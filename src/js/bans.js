const {rndrsp, cleantext} = require('./shared.js');
const {bans, watchlist, limited, small, reasons,
  jokes, three, pauper, noble, rotation} = require('../config/bans.json');

export function whyban(card, options=[]) {
  card = cleantext(card);

  for (var key in reasons) {
    if (cleantext(key).indexOf(card) === 0) {
      if (options.includes("joke")) {
        if (reasons[key].length > 1) {
          return `*${key}*:\n${rndrsp(reasons[key].slice(1, reasons[key].length), key)}`;
        }
        else {
          return "Sorry " + key + " doesn't have a joke";
        }
      }
      else {
        return `*${key}*:\n${reasons[key][0]}`;
      }
    }
  }

  for (var key in jokes) {
    if (cleantext(key).indexOf(card) === 0) {
      return `*${key}*:\n${rndrsp(jokes[key], key)}`;
    }
  }

  return rndrsp(["That card isn't banned", `Oh lucky you, ${card} isn't banned`]);
}

export function banlist(options) {
  if (options.includes("pauper")) {
    return list_pauper();
  }
  else if (options.includes("noble")) {
    return list_noble();
  }
  else if (options.includes("rotation") || options.includes("modern")) {
    return list_rotation();
  }

  return list_legacy();
}

function list_legacy() {
  let message = "**Community Ban List:**\n=====";
  bans.forEach((key) => {
    message += "\n" + key;
  });

  message += "\n=====\n**Watchlist:** (not banned)"
  watchlist.forEach((key) => {
    message += "\n" + key;
  });

  message += "\n=====\nYou can ask me why a card was banned with \"!whyban *card name*\"";
  return message;
}

function list_pauper() {
  let message = "**Pauper (Printed Commons and Uncommons)**\nBanned Cards:\n====="
  pauper.forEach((key) => {
    message += "\n" + key;
  });
  return message;
}

function list_noble() {
  let message = "**Noble (Printed Commons, Uncommons, and Rares)**\nBanned Cards:\n====="
  noble.forEach((key) => {
    message += "\n" + key;
  });
  return message;
}

function list_rotation() {
  let message = "**Modern**\n(Cards from: M'arrillian Invasion, Secrets of the Lost City, Organized Play, League Rewards)\nBanned Cards:\n=====";
  rotation.forEach((key) => {
    message += "\n" + key;
  });
  return message;
}
