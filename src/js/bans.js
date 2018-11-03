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

export function goodstuff(filter) {
  const {goodstuff} = reload('../config/bans.json');

  function Creatures() {
    let message = "";
    [].concat(goodstuff.Creatures["Danian"], goodstuff.Creatures["M'arrillian"], 
      goodstuff.Creatures["Mipedian"], goodstuff.Creatures["OverWorld"], 
      goodstuff.Creatures["UnderWorld"], goodstuff.Creatures["Tribeless"]).sort().forEach((card) => {
        message += "\n" + card;
    });
    return message;
  }

  function Mugic() {
    let message = "";
    [].concat(goodstuff.Mugic["Danian"], goodstuff.Mugic["M'arrillian"], 
      goodstuff.Mugic["Mipedian"], goodstuff.Mugic["OverWorld"], 
      goodstuff.Mugic["UnderWorld"], goodstuff.Mugic["Generic"]).sort().forEach((card) => {
        message += "\n" + card;
    });
    return message;
  }

  function Type(type) {
    let message = "";
    goodstuff[type].forEach((card) => {
      message += "\n" + card;
    });
    return message;
  }

  function Tribe(tribe, type) {
    let message = "";
    // If specified mugic or creatures
    if (type) {
      if (type.toLowerCase()=="creatures") {
        message = `**Strong ${tribe} Creatures**`;
        goodstuff["Creatures"][tribe].forEach((card) => {
          message += "\n" + card;
        });
      }
      if (type.toLowerCase()=="mugic") {
        message = `**Strong ${tribe} Mugic**`;
        goodstuff["Mugic"][tribe].forEach((card) => {
          message += "\n" + card;
        });
      }
    }
    else {
      message = `**Strong ${tribe} Cards:**`;
      [].concat(goodstuff["Mugic"][tribe], goodstuff["Creatures"][tribe])
        .sort().forEach((card) => {
          message += "\n" + card;
      });
    }
    return message;
  }

  let message = "";
  if (filter && filter.length > 0) {
    switch (filter[0].toLowerCase()) {
      case 'creature':
      case 'creatures':
        message = `**Strong Creatures:**`;
        message += Creatures();
        break;
      case 'mugic':
        message = `**Strong Mugic:**`;
        message += Mugic();
        break;
      case 'attack':
      case 'attacks':
        message = `**Strong Attacks:**`;
        message += Type("Attacks");
        break;
      case 'battlegear':
        message = `**Strong Battlegear:**`;
        message += Type("Battlegear");
        break;
      case 'location':
      case 'locations':
        message = `**Strong Locations:**`;
        message += Type("Locations");
        break;
      case 'danian':
      case 'danians':
        message = Tribe("Danian", filter[1]);
        break;
      case 'm\'arrillian':
      case 'm\'arrillians':
        message = Tribe("M'arrillian", filter[1]);
        break;
      case 'mipedian':
      case 'mipedians':
        message = Tribe("Mipedian", filter[1]);
        break;
      case 'overworld':
      case 'overworlders':
        message = Tribe("OverWorld", filter[1]);
        break;
      case 'underworld':
      case 'underworlders':
        message = Tribe("UnderWorld", filter[1]);
        break;
      case 'tribeless':
        message = `**Strong Tribeless Creatures:**`;
        goodstuff["Creatures"]["Generic"].forEach((card) => {
          message += "\n" + card;
        });
        break;
      case 'generic':
        message = `**Strong Generic Mugic:**`;
        goodstuff["Mugic"]["Generic"].forEach((card) => {
          message += "\n" + card;
        });
        break;
    }
  }
  else {
    message = "**Best cards in the game**";
    message += "\n**Attacks**:";
    message += Type("Attacks");

    message += "\n**Battlegear**:";
    message += Type("Battlegear");

    message += "\n**Creatures**:";
    message += Creatures();

    message += "\n**Locations**:";
    message += Type("Locations");

    message += "\n**Mugic**:";
    message += Mugic();

    message += "\n(*Thanks Metal*)";
  }
  return message;
}

