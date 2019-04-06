const {rndrsp, cleantext} = require('./shared.js');

export function banlist(options) {
  if (options.includes("small") || options.includes("short")) {
    return small();
  }

  const {bans, watchlist} = require('../config/bans.json');
  
  let message = "**Community Ban List:**\n=====";
  for (var key in bans) {
    message += "\n" + key;
  }
  message += "\n=====\n**Watchlist:** (not banned)"
  for (var key in watchlist) {
    message += "\n" + key;
  }
  message += "\n=====\nYou can ask me why a card was banned with \"!whyban --serious *card name*\"";
  return message;
}

function small() {
  const {small} = require('../config/bans.json');
  let message = "**Short Banlist:**\n(Removes the minimum amount of game breaking cards)";
  small.forEach((key) => {
    message += "\n" + key;
  });
  return message;
}

export function whyban(card, options=[]) {
  card = cleantext(card);

  const {bans, watchlist, hidden} = require('../config/bans.json');

  let merge = Object.assign({}, bans, watchlist, hidden);
  for (var key in merge) {
    if (cleantext(key).indexOf(card) === 0) {
      if (options.includes("serious")) {
        return `*${key}*:\n${merge[key][0]}`;
      }
      else {
        return `*${key}*:\n${rndrsp(merge[key], 'bans')}`;
      }
    }
  }

  return rndrsp(["That card isn't banned. :D", `Oh lucky you, ${card} isn't banned`]);
}

export function limited() {
  const {limited} = require('../config/bans.json');
  let message = "**Limited Format:**\n(1 copy of each of the following in addition to the banlist)";
  limited.forEach((key) => {
    message += "\n" + key;
  });
  return message;
}

export function shakeup() {
  const {shakeup} = require('../config/bans.json');
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
