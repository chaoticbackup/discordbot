const {agame, goodstuff} = require('../config/goodstuff.json');

export { fs as funstuff, gs as goodstuff };

function fs() {
  let message = "";
  agame.sort().forEach((card: string) => {
    message += card + "\n";
  });
  return message;
}

function gs(args: string[]) {

  if (args.length == 0 || args[0] == '') {
    return "Due to the length, I can't send all the cards.\nPlease specify a card type/tribe";
  }

  let message = "";

  switch (args[0].toLowerCase()) {
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
      message = Attacks(args[1]);
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
      message = Tribe("Danian", args[1]);
      break;
    case 'm\'arrillian':
    case 'm\'arrillians':
      message = Tribe("M'arrillian", args[1]);
      break;
    case 'mipedian':
    case 'mipedians':
      message = Tribe("Mipedian", args[1]);
      break;
    case 'overworld':
    case 'overworlders':
      message = Tribe("OverWorld", args[1]);
      break;
    case 'underworld':
    case 'underworlders':
      message = Tribe("UnderWorld", args[1]);
      break;
    case 'tribeless':
      message = `**Strong Tribeless Creatures:**`;
      goodstuff["Creatures"]["Generic"].forEach((card: string) => {
        message += "\n" + card;
      });
      break;
    case 'generic':
      message = `**Strong Generic Mugic:**`;
      goodstuff["Mugic"]["Generic"].forEach((card: string) => {
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

function Attacks(bp: string): string {
  let msg = `**Strong ${bp} BP Attacks:**`;
  if (bp && +bp >= 0 && +bp <= 5) {
    goodstuff.Attacks[bp].forEach((card: string) => {
      msg += "\n" + card;
    });
  }
  else return Attacks("1");
  return msg;
}

function Type(type: string) {
  let msg = "";
  goodstuff[type].forEach((card: string) => {
    msg += "\n" + card;
  });
  return msg;
}

function Tribe(tribe: string, type: string) {
  let msg = "";
  // If specified mugic or creatures
  if (type) {
    if (type.toLowerCase()=="creatures") {
      msg = `**Strong ${tribe} Creatures**`;
      goodstuff["Creatures"][tribe].forEach((card: string) => {
        msg += "\n" + card;
      });
    }
    if (type.toLowerCase()=="mugic") {
      msg = `**Strong ${tribe} Mugic**`;
      goodstuff["Mugic"][tribe].forEach((card: string) => {
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
