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
  if (options.includes("small") || options.includes("short")) {
    return list_small();
  }
  else if (options.includes("limited")) {
    return list_limited();
  }
  else if (options.includes("pauper")) {
    return list_pauper();
  }
  else if (options.includes("noble")) {
    return list_noble();
  }
  else if (options.includes("3v3")) {
    return list_3v3();
  }
  else if (options.includes("rotation") || options.includes("rotate")) {
    return list_rotation();
  }

  return list_standard();
}

function list_standard() {
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

function list_small() {
  let message = "**Short Banlist:**\n(Removes the minimum amount of game breaking cards)";
  small.forEach((key) => {
    message += "\n" + key;
  });
  return message;
}

function list_limited() {
  let message = "**Banlist and Restricted Format:**\n=====";
  bans.forEach((key) => {
    message += "\n" + key;
  });

  message += "\n=====\n**Restricted :**\n(1 copy of each of the following)";
  limited.forEach((key) => {
    message += "\n" + key;
  });

  return message;
}

function list_3v3() {
  let message = "**Banlist for 3 Creature Format:**\n=====";
  three.forEach((key) => {
    message += "\n" + key;
  });

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
  let message = "**Noble (Commons, Uncommons, and Rares)**\nBanned Cards:\n====="
  noble.forEach((key) => {
    message += "\n" + key;
  });
  return message;
}

function list_rotation() {
  let message = "**Set Rotation**\n(Printed Cards from: M'arrillian Invasion, Secrets of the Lost City, Organized Play, and Promos)\nBanned Cards:\n=====";
  rotation.forEach((key) => {
    message += "\n" + key;
  });
  return message;
}
