const {rndrsp, cleantext} = require('./shared.js');
const {bans, watchlist, limited, small, reasons, jokes, shakeup, three} = require('../config/bans.json');

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
    return small_list();
  }

  if (options.includes("limited")) {
    return limited_list();
  }

  if (options.includes("3v3")) {
    return list_3v3();
  }

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

export function small_list() {
  let message = "**Short Banlist:**\n(Removes the minimum amount of game breaking cards)";
  small.forEach((key) => {
    message += "\n" + key;
  });
  return message;
}

export function limited_list() {
  let message = "**Banlist and Limited Format:**\n=====";
  bans.forEach((key) => {
    message += "\n" + key;
  });

  message += "\n=====\n**Limited :**\n(1 copy of each of the following)";
  limited.forEach((key) => {
    message += "\n" + key;
  });

  return message;
}

export function list_3v3() {
  let message = "**Banlist for 3 Creature Format:**\n=====";
  three.forEach((key) => {
    message += "\n" + key;
  });

  return message;
}

export function shakeup_list() {
  let message = "The **Shake Up** list aims to widen the meta";

  message += "\n``The following are limited (unique):``";
  shakeup.limited.forEach((key) => {
    message += "\n" + key;
  });

  message += "\n``The following are banned:``";
  shakeup.bans.forEach((key) => {
    message += "\n" + key;
  });

  return message;
}
