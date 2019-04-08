const { RichEmbed } = require('discord.js');
import {rndrsp, cleantext} from '../shared.js';
const API = require('./database.js').default;

export function full_art(name) {
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
export function find_card(name) {
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
    response += card.gsx$name.replace(new RegExp(name, 'i'), (match) => {
      return `**${match}**`;
    }) + '\n';
  });

  return response;
}

/*
  Returning a card
*/
export function display_card(name, options, bot) {
  if (API.data === "local") {
    return card_local(name, bot.emojis.find(emoji => emoji.name==="GenCounter"));
  }
  else {
    return card_db(name, options, bot);
  }
}

/* If database hadn't been set up */
function card_local(name, genCounter) {
  var cards = require('../config/cards.json');

  function GenericCounter(cardtext, genCounter) {
    if (genCounter) {
      return cardtext.replace(/:GenCounter:/gi, genCounter.toString());
    }
    else return cardtext.replace(/:GenCounter:/gi, 'MC');
  }

  name = cleantext(name);

  if (!name) {
    // Return random card
    var keys = Object.keys(cards);
    return `${GenericCounter(cards[keys[keys.length * Math.random() << 0]], genCounter)}`;
  }

  for (var key in cards) {
    if (cleantext(key).indexOf(name) === 0) {
      return `${GenericCounter(cards[key], genCounter)}`;
    }
  }

  return "That's not a valid card name";
}

/* Return a card to send */
function card_db(name, options, bot) {
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

function Response(card, options, bot) {
  // If not a released card
  if (!card.gsx$set) {
    const embed = new RichEmbed()
      .setTitle(card.gsx$name)
      .setColor(API.color(card))
      .setDescription(card.gsx$ability || "No data available");

      if (card.gsx$image != '') {
        embed.setURL(API.base_image + card.gsx$image);
        embed.setImage(API.base_image + card.gsx$image);
      }
      else if (card.gsx$spash != '')
      {
        embed.setURL(API.base_image + card.gsx$splash);
        embed.setImage(API.base_image + card.gsx$splash);
      }
    return embed;
  }

  let Ability = (cardtext) => {
    //tribal mugic counters
    let mc = (() => {
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
          return bot.emojis.find(emoji => emoji.name==="GenCounter");
      }
    })();

    let el = ((input) => {
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

    let dis = ((input) => {
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

    cardtext = cardtext.replace(/(\b((fire)|(air)|(earth)|(water))\b)/gi, (match, p1) => {
      return el(p1) + match;
    });

    cardtext = cardtext.replace(/(\b((courage)|(power)|(wisdom)|(speed))\b)/gi, (match, p1) => {
      return dis(p1) + match;
    });

    if (mc) return cardtext.replace(/\{\{MC\}\}/gi, mc.toString());
    else return cardtext.replace(/\{\{MC\}\}/gi, 'MC');
  }

  let Disciplines = (modstat = 0) => {
    let line = ""
      + eval(`${card.gsx$courage}+${modstat}`) + bot.emojis.find(emoji => emoji.name==="Courage").toString() + " "
      + eval(`${card.gsx$power}+${modstat}`) + bot.emojis.find(emoji => emoji.name==="Power").toString() + " "
      + eval(`${card.gsx$wisdom}+${modstat}`) + bot.emojis.find(emoji => emoji.name==="Wisdom").toString() + " "
      + eval(`${card.gsx$speed}+${modstat}`) + bot.emojis.find(emoji => emoji.name==="Speed").toString() + " "
      + "| " + eval(`${card.gsx$energy}+${modstat/2}`) + " E";
    return line;
  }

  // Ability
  let resp = Ability(card.gsx$ability);

  if (card.gsx$brainwashed){
    resp += "\n**Brainwashed**\n" + Ability(card.gsx$brainwashed);
  }

  if (card.gsx$energy > 0) {
    let modstat = 0;
    if ((options.indexOf("max") > -1 || options.indexOf("thicc") > -1)
     && !(options.indexOf("min") > -1)) {
      modstat = 10;
    }
    if (options.indexOf("min") > -1 && !(options.indexOf("max") > -1)) {
      modstat = -10;
    }
    resp += "\n" + Disciplines(modstat);
  }

  return new RichEmbed()
    .setTitle(card.gsx$name)
    .setURL(API.base_image + card.gsx$image)
    .setColor(API.color(card))
    .setDescription(resp)
    .setImage(API.base_image + card.gsx$image);
}

export function read_card(name, options) {
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

export function nowornever(card) {
  const cards = require('../config/nowornever.json');
  card = cleantext(card); // re-merge string

  if (!card) {
    // Return random card
    var keys = Object.keys(cards);
    return `${cards[keys[keys.length * Math.random() << 0]]}`;
  }

  for (var key in cards) {
    if (cleantext(key).indexOf(card) === 0) {
      return `${cards[key]}`;
    }
  }
}
