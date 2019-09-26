const {rndrsp, cleantext} = require('./common');
const {bans, watchlist, detailed, reasons,
  jokes, pauper, noble, modern} = require('../config/bans.json');

export function whyban(card, options=[]) {
  card = cleantext(card);

  if (options.includes("detailed")) {
    for (let key in detailed) {
      if (cleantext(key).indexOf(card) === 0) {
        return `*${key}*:\n${detailed[key]}`;
      }
    }

    return "This ban doesn't have a more detailed explaination";
  }

  for (let key in reasons) {
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

  for (let key in jokes) {
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
  let message = "**Pauper (Commons and Uncommons)**\nBanned Cards:\n====="
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
  let message = "**Modern**\n(M'arrillian Invasion, Secrets of the Lost City, Organized Play, League Rewards)\nBanned Cards:\n=====";
  modern.forEach((key) => {
    message += "\n" + key;
  });
  return message;
}
