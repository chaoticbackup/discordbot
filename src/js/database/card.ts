import { RichEmbed, Client, Emoji } from 'discord.js';
import {rndrsp, escape_text} from '../common';
import API from './database';

export function full_art(name: string) {
  let results = API.find_cards_by_name(name);

  if (results.length > 0) {
    let card = results[0];
    if (card.gsx$splash) return new RichEmbed()
      .setColor(API.color(card))
      .setTitle(card.gsx$name)
      .setURL(API.base_image + card.gsx$splash)
      .setImage(API.base_image + card.gsx$splash);
    else {
      return `Sorry, I don't have ${card.gsx$name}'s full art`;
    }
  }
  else {
    return "That's not a valid card name";
  }
}

/*
Find a list of names based on input
*/
export function find_card(name: string) {
  if (API.data === "local") {
    return "Database offline; unable to find cards by name";
  }

  if (name.length < 2) {
    return "Use at least 2 characters";
  }

  let results = API.find_card_name(name);

  if (results.length == 0) {
    return "No cards match this search";
  }

  let response = "";
  if (results.length > 15) response = "First 15 matches:\n";
  results.splice(0, 15).forEach((card) => {
    response += card.gsx$name.replace(
      new RegExp(escape_text(name), 'i'), (match: string) => {
        return `**${match}**`;
      }
    ) + '\n';
  });

  return response;
}

/*
  Returning a card
*/
export function display_card(name: string, options: string[], bot: Client) {
  if (API.data === "local") {
    return card_local(name, bot);
  }
  else {
    return card_db(name, options, bot);
  }
}

/* If database hadn't been set up */
function card_local(name: string, bot: Client) {
  let cards = require('../config/cards.json');
  let genCounter = bot.emojis.find(emoji => emoji.name==="GenCounter");

  function GenericCounter(cardtext: string, genCounter: Emoji) {
    if (genCounter) {
      return cardtext.replace(/:GenCounter:/gi, genCounter.toString());
    }
    else return cardtext.replace(/:GenCounter:/gi, 'MC');
  }

  if (!name) {
    // Return random card
    var keys = Object.keys(cards);
    return `${GenericCounter(cards[keys[keys.length * Math.random() << 0]], genCounter)}`;
  }

  for (var key in cards) {
    if ((key).toLowerCase().indexOf(name) === 0) {
      return `${GenericCounter(cards[key], genCounter)}`;
    }
  }

  return "That's not a valid card name";
}

/* Return a card to send */
function card_db(name: string, options: string[], bot: Client) {
  let results = API.find_cards_by_name(name, options);

  if (results.length <= 0) {
    return "That's not a valid card name";
  }

  if (name.length > 0) {
    return Response(results[0], options, bot);
  }
  else {
    // Random card
    return Response(rndrsp(results, "card"), options, bot);
  }
}

function addNewLine(entry: string, isText: boolean) {
  if (entry != "") {
    entry += (isText) ? "\n\n" : "\n";
  }
  return entry;
}

function Response(card: any, options: string[], bot: Client) {
    // If not a released card
  if (!card.gsx$set) {
    if (card.gsx$image == '') {
      if (options.includes("text") || options.includes("stats")) return "No card data available";
      return new RichEmbed()
        .setTitle(card.gsx$name)
        .setColor(API.color(card))
        .setDescription(card.gsx$ability || "No data available")
        .setURL(API.base_image + card.gsx$splash)
        .setImage(API.base_image + card.gsx$splash);
    }
  }

  // Formatting to include an image or just the card text
  const textOnly = Boolean(options.indexOf("text") != -1);

  const Disciplines = (modstat = 0) => {
    let line = ""
      + eval(`${card.gsx$courage}+${modstat}`) + bot.emojis.find(emoji => emoji.name==="Courage").toString() + " "
      + eval(`${card.gsx$power}+${modstat}`) + bot.emojis.find(emoji => emoji.name==="Power").toString() + " "
      + eval(`${card.gsx$wisdom}+${modstat}`) + bot.emojis.find(emoji => emoji.name==="Wisdom").toString() + " "
      + eval(`${card.gsx$speed}+${modstat}`) + bot.emojis.find(emoji => emoji.name==="Speed").toString() + " "
      + "| " + eval(`${card.gsx$energy}+${modstat/2}`) + "\u00A0E";
    return line;
  }

  const Stats = () => {
    let resp = "";
    if (card.gsx$energy > 0) {
      let modstat = 0;
      if ((options.indexOf("max") > -1 || options.indexOf("thicc") > -1)
       && !(options.indexOf("min") > -1)) {
        modstat = 10;
      }
      if (options.indexOf("min") > -1 && !(options.indexOf("max") > -1)) {
        modstat = -10;
      }
      if (card.gsx$name == "Aa'une the Oligarch, Avatar") modstat = 0;
      resp += Disciplines(modstat);
    }

    return addNewLine(resp, textOnly);
  }

  if (options.indexOf("stats") != -1) {
    if (card.gsx$type == "Creatures") {
      return new RichEmbed()
        .setTitle(card.gsx$name)
        .setColor(API.color(card))
        .setDescription(Stats())
        .setURL(API.base_image + card.gsx$image);
    }
    else return "Only Creatures have stats";
  }

  const TypeLine = () => {
    if (!textOnly) return "";
    let resp = "";

    if (card.gsx$type == "Attacks") {
      resp = `Attack - ${card.gsx$bp} Build Points`;
    }
    else if (card.gsx$type == "Battlegear") {
      resp = `Battlegear${card.gsx$types.length > 0 ? " - " + card.gsx$types : ""}`;
    }
    else if (card.gsx$type == "Creatures") {
      let tribe = card.gsx$tribe;
      let types = card.gsx$types;
      let past = false;
      if (types.toLowerCase().includes("past")) {
        past = true;
        types = types.replace(/past /i, '');
      }
      resp = "Creature - " + (past ? "Past " : "") + (tribe == "Generic" ? "" : tribe + " ") + types;
    }
    else if (card.gsx$type == "Locations") {
      resp = `Location${card.gsx$types.length > 0 ? " - " + card.gsx$types : ""}`;
    }
    else if (card.gsx$type == "Mugic") {
      resp = `Mugic - ${card.gsx$tribe}`;
    }
    else return "";

    return addNewLine(resp, true);
  }

  // Element icons
  const el = ((input: string) => {
    switch (input) {
      case "Fire":
        return bot.emojis.find(emoji => emoji.name=="Fire");
      case "Air":
        return bot.emojis.find(emoji => emoji.name=="Air");
      case "Earth":
        return bot.emojis.find(emoji => emoji.name=="Earth");
      case "Water":
        return bot.emojis.find(emoji => emoji.name=="Water");
      default:
        return "";
    }
  });

  const el_inactive = (input: string) => {
    switch (input) {
      case "Fire":
        return bot.emojis.find(emoji => emoji.name=="fireinactive");
      case "Air":
        return bot.emojis.find(emoji => emoji.name=="airinactive");
      case "Earth":
        return bot.emojis.find(emoji => emoji.name=="earthinactive");
      case "Water":
        return bot.emojis.find(emoji => emoji.name=="waterinactive");
      default:
        return "";
    }
  }

  // Discipline icons
  const dis = ((input: string) => {
    switch (input) {
      case "Courage":
        return bot.emojis.find(emoji => emoji.name=="Courage");
      case "Power":
        return bot.emojis.find(emoji => emoji.name=="Power");
      case "Wisdom":
        return bot.emojis.find(emoji => emoji.name=="Wisdom");
      case "Speed":
        return bot.emojis.find(emoji => emoji.name=="Speed");
      default:
        return "";
    }
  });

  const tribe = (input: string) => {
    switch (input) {
      case "OverWorld":
        return bot.emojis.find(emoji => emoji.name==="OW");
      case "UnderWorld":
        return bot.emojis.find(emoji => emoji.name==="UW");
      case "M'arrillian":
        return bot.emojis.find(emoji => emoji.name==="Mar");
      case "Mipedian":
        return bot.emojis.find(emoji => emoji.name==="Mip");
      case "Danian":
        return bot.emojis.find(emoji => emoji.name==="Dan");
      default:
        return bot.emojis.find(emoji => emoji.name==="TL");
    }
  }

  //tribal mugic counters
  const mc = (() => {
    switch (card.gsx$tribe) {
      case "OverWorld":
        return bot.emojis.find(emoji => emoji.name==="OWCounter");
      case "UnderWorld":
        return bot.emojis.find(emoji => emoji.name==="UWCounter");
      case "M'arrillian":
        return bot.emojis.find(emoji => emoji.name==="MarCounter");
      case "Mipedian":
        return bot.emojis.find(emoji => emoji.name==="MipCounter");
      case "Danian":
        return bot.emojis.find(emoji => emoji.name==="DanCounter");
      default:
        return bot.emojis.find(emoji => emoji.name==="TLCounter");
    }
  })();

  const Ability = (cardtext: string) => {

    cardtext = cardtext.replace(/(\b((fire)|(air)|(earth)|(water))\b)/gi, (match, p1) => {
      return el(p1) + match;
    });

    cardtext = cardtext.replace(/(\b((courage)|(power)|(wisdom)|(speed))\b)/gi, (match, p1) => {
      return dis(p1) + match;
    });
    
    cardtext = addNewLine(cardtext, textOnly);

    if (mc) return cardtext.replace(/\{\{MC\}\}/gi, mc.toString());
    else return cardtext.replace(/\{\{MC\}\}/gi, 'MC');
  }

  const BuildRestrictions = () => {
    if (!textOnly) return "";
    let resp = "";
    if (card.gsx$loyal) {
      resp += "**";
      if (card.gsx$unique) {
        resp += "Unique, ";
      }
      else if (card.gsx$legendary) {
        resp += "Legendary, ";
      }
      resp += (card.gsx$loyal == "1" ? "Loyal" : "Loyal - " + card.gsx$loyal);
      if (card.gsx$type === "Creatures" && card.gsx$tribe === "M'arrillian") {
        resp += " - M'arrillians or Minions";
      }
      resp += "**";
    }
    else if (card.gsx$unique) {
      resp += "**Unique**";
    }
    else if (card.gsx$legendary) {
      resp += "**Legendary**";
    }

    return addNewLine(resp, textOnly);
  }

  const FlavorText = () => {
    let resp = `*${card.gsx$flavortext}*`;
    if (resp != "**") return addNewLine(resp, true);
    else return "";
  }

  const Elements = () => {
    let resp = "";

    if (card.gsx$type == "Creatures") {
      ["Fire", "Air", "Earth", "Water"].forEach((element) => {
        if (card.gsx$elements.includes(element)) {
          resp += el(element) + " ";
        }
        else {
          resp += el_inactive(element) + " ";
        }
      });
      resp.trim();
    }
    else if (card.gsx$type == "Attacks") {
      resp += card.gsx$base + " | ";
      ["Fire", "Air", "Earth", "Water"].forEach((element) => {
        let dmg = card[`gsx$${element.toLowerCase()}`];
        if (dmg && dmg >= 0) {
          resp += el(element) + " " + dmg + " ";
        }
        else {
          resp += el_inactive(element) + " ";
        }
      });
      resp += "\n\n";
    }
    else return "";

    return resp;
  }

  const MugicAbility = () => {
    let amount: any = 0;
    let resp = "";

    if (card.gsx$type == "Creatures") {
      amount = card.gsx$mugicability;
      if (amount == 0) return "";
    }
    else if (card.gsx$type == "Mugic") {
      amount = card.gsx$cost;
      if (amount == 0) return "0";
      if (amount == "X") return "X";
    }

    for (let i = 0; i < amount; i++) {
      resp += mc;
    }

    return resp;
  }

  const Initiative = () => {

    let init: string = card.gsx$initiative;

    init = init.replace(/(\b((fire)|(air)|(earth)|(water))\b)/gi, (match, p1) => {
      return el(p1) + match;
    });

    init = init.replace(/(\b((courage)|(power)|(wisdom)|(speed))\b)/gi, (match, p1) => {
      return dis(p1) + match;
    });

    init = init.replace(/(\b((overworld)|(underworld)|(danian)|(mipedian)|(m'arrillian))\b)/gi, (match, p1) => {
      return tribe(p1) + match;
    }); 

    return addNewLine(init, true);
  }

  /* Response Body */

  let body = TypeLine();
  
  if (textOnly && card.gsx$type == "Mugic") {
    body += MugicAbility() + "\n\n";
  }

  if (textOnly && card.gsx$type == "Locations") {
    body += "Initiative: " + Initiative();
  }

  if (textOnly && card.gsx$type == "Attacks") {
    body += Elements();
  }

  body += Ability(card.gsx$ability);

  if (card.gsx$brainwashed){
    body += "**Brainwashed**\n" + Ability(card.gsx$brainwashed);
  }

  body += BuildRestrictions();

  if (textOnly) {
    body += FlavorText();
  }

  body += Stats();
  
  if (textOnly && card.gsx$type == "Creatures") {
    body += Elements();
    body += " | " + MugicAbility();
  }

  // Card Embed
  const CardMsg = new RichEmbed()
    .setTitle(card.gsx$name)
    .setURL(API.base_image + card.gsx$image)
    .setColor(API.color(card))
    .setDescription(body);

  if (!textOnly) {
    CardMsg
    .setImage(API.base_image + card.gsx$image);
  }
  
  return CardMsg;
}

export function read_card(name: string, options: string[]) {
  let results = API.find_cards_by_name(name);

  if (results.length > 0) {
    if (options.includes("brainwashed") && results[0].gsx$brainwashed) {
      return results[0].gsx$name + "\n" + results[0].gsx$brainwashed;
    }
    else {
      return results[0].gsx$name + "\n" + results[0].gsx$ability;
    }
  }
  return;
}

