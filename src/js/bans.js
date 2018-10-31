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
  card = cleantext(card.join(" ")); // remerge string

  const {bans, watchlist, joke} = reload('../config/bans.json');

  let merge = Object.assign({}, bans, watchlist, joke);
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

export function badultras() {
  const {badultras} = reload('../config/bans.json');
  let message = "**List of Wasted Ultras**";
  badultras.forEach((key) => {
    message += "\n" + key;
  });
  return message;
}

export function restricted(filter) {
  const {restricted} = reload('../config/bans.json');
  let message = "";

  function Creatures() {
    let message = "";
    [].concat(restricted.Creatures["Danian"], restricted.Creatures["M'arrillian"], 
      restricted.Creatures["Mipedian"], restricted.Creatures["OverWorld"], 
      restricted.Creatures["UnderWorld"], restricted.Creatures["Tribeless"]).sort().forEach((card) => {
        message += "\n" + card;
    });
    return message;
  }

  function Mugic() {
    let message = "";
    [].concat(restricted.Mugic["Danian"], restricted.Mugic["M'arrillian"], 
      restricted.Mugic["Mipedian"], restricted.Mugic["OverWorld"], 
      restricted.Mugic["UnderWorld"], restricted.Mugic["Generic"]).sort().forEach((card) => {
        message += "\n" + card;
    });
    return message;
  }

  if (filter.length > 0) {
    let type = filter[0].charAt(0).toUpperCase() + filter[0].slice(1).toLowerCase();  

    if (type == "Creatures") {
      message = `**Strong Creatures:**`;
      message += Creatures();
    }
    else if (type == "Mugic") {
      message = `**Strong Mugic:**`;
      message += Mugic();
    }
    else if (["Attacks", "Battlegear", "Locations"].indexOf(type) !== -1) {
      message = `**Strong ${type}:**`;
      restricted[type].forEach((card) => {
        message += "\n" + card;
      });
    }
    // If specified a tribe
    else if (["Danian", "M'arrillian", "Mipedian", "OverWorld", 
      "UnderWorld", "Generic", "Tribeless"].indexOf(filter[0]) !== -1) {
      // If specified mugic or creatures
      if (filter[1] && (filter[1]=="Creatures" || filter[1] == "Mugic")) {
        message = `**Strong ${filter[0]} ${filter[1]}**`;
        restricted[filter[1]][filter[0]].forEach((card) => {
          message += "\n" + card;
        });
      }
      else {
        message = `**Strong ${filter[0]} Cards:**`;
        [].concat(restricted.Mugic[filter[0]], restricted.Creatures[filter[0]])
          .sort().forEach((card) => {
            message += "\n" + card;
        });
        }
    }
  }
  else {
    message = "**Restricted Format:**\n(best cards gone)";
    message += "\n**Attacks**:";
    restricted["Attacks"].forEach((card) => {
      message += "\n" + card;
    });
    message += "\n**Battlegear**:";
    restricted["Battlegear"].forEach((card) => {
      message += "\n" + card;
    });
    message += "\n**Creatures**:";
      message += Creatures();
    message += "\n**Locations**:";
    restricted["Locations"].forEach((card) => {
      message += "\n" + card;
    });
    message += "\n**Mugic**:";
     message += Mugic();

  }
  return message;
}

