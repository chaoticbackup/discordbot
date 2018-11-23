const {reload, rndrsp, cleantext} = require('./shared.js');

export function banlist() {
  const {bans, watchlist} = reload('../config/bans.json');
  let message = "**Community Ban List:**\n=====";
  for (var key in bans) {
    message += "\n" + key;
  }
  message += "\n=====\n**Watchlist:** (not banned)"
  for (var key in watchlist) {
    message += "\n" + key;
  }
  message += "\n=====\nYou can ask me why a card was banned with \"!whyban *card name*\"";
  return message;
}

export function whyban(card) {
  card = cleantext(card);

  const {bans, watchlist, hidden} = reload('../config/bans.json');

  let merge = Object.assign({}, bans, watchlist, hidden);
  for (var key in merge) {
    if (cleantext(key).indexOf(card) === 0)
      return `*${key}*:\n${rndrsp(merge[key])}`;
  }

  return rndrsp(["That card isn't banned. :D", `Oh lucky you, ${card} isn't banned`]);
}

export function limited() {
  const {limited} = reload('../config/bans.json');
  let message = "**Limited Format:**\n(1 copy of each of the following in addition to the banlist)";
  limited.forEach((key) => {
    message += "\n" + key;
  });
  return message;
}
