const {badultras, agame, goodstuff} = require('../config/goodstuff.json');

export {
  bu as badultras,
  fs as funstuff,
  gs as goodstuff
}

function bu() {
  let message = "**List of Wasted Ultras**";
  badultras.forEach((key) => {
    message += "\n" + key;
  });
  return message;
}

function fs(filter) {
  let message = "";
  agame.sort().forEach((card) => {
    message += card + "\n";
  });
  return message;
}

function gs(filter, options) {
  filter = filter.split(' ');

  if (!filter || filter[0] == '') {
    return "Due to the length, I can't send all the cards.\nPlease specify a card type/tribe";
  }

  let message = "";

  switch (filter[0].toLowerCase()) {
    case 'creature':
    case 'creatures':
      message += "Please specify a tribe:\n``!good <tribe> creatures``";
      break;
    case 'mugic':
      message = `**Strong Mugic:**`;
      message += Mugic();
      break;
    case 'attack':
    case 'attacks':
      message = Attacks(filter[1]);
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

  return message;
}

function Mugic() {
  let msg = "";
  [].concat(goodstuff.Mugic["Danian"], goodstuff.Mugic["M'arrillian"],
    goodstuff.Mugic["Mipedian"], goodstuff.Mugic["OverWorld"],
    goodstuff.Mugic["UnderWorld"], goodstuff.Mugic["Generic"]).sort().forEach((card) => {
      msg += "\n" + card;
  });
  return msg;
}

function Attacks(bp) {
  let msg = `**Strong ${bp} BP Attacks:**`;
  if (bp && bp >= 0 && bp <= 5) {
    goodstuff.Attacks[bp].forEach((card) => {
      msg += "\n" + card;
    });
  }
  else return Attacks(1);
  return msg;
}

function Type(type) {
  let msg = "";
  goodstuff[type].forEach((card) => {
    msg += "\n" + card;
  });
  return msg;
}

function Tribe(tribe, type) {
  let msg = "";
  // If specified mugic or creatures
  if (type) {
    if (type.toLowerCase()=="creatures") {
      msg = `**Strong ${tribe} Creatures**`;
      goodstuff["Creatures"][tribe].forEach((card) => {
        msg += "\n" + card;
      });
    }
    if (type.toLowerCase()=="mugic") {
      msg = `**Strong ${tribe} Mugic**`;
      goodstuff["Mugic"][tribe].forEach((card) => {
        msg += "\n" + card;
      });
    }
  }
  else {
    msg = `**Strong ${tribe} Cards:**`;
    [].concat(goodstuff["Mugic"][tribe], goodstuff["Creatures"][tribe])
      .sort().forEach((card) => {
        msg += "\n" + card;
    });
  }
  return msg;
}
