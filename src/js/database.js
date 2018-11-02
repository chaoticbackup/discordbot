import loki from 'lokijs';
import {reload, rndrsp, cleantext} from './shared.js';
import fs from 'fs';
const fetch =  require('node-fetch');
const { RichEmbed } = require('discord.js');
const LokiFSStructuredAdapter = require('lokijs/src/loki-fs-structured-adapter');

export default class API {
  static base_url = "https://spreadsheets.google.com/feeds/list/";
  static data_format = "/od6/public/values?alt=json";
  static base_spreadsheet = "1cUNmwV693zl2zqbH_IG4Wz8o9Va_sOHe7pAZF6M59Es";
  static base_image = "https://drive.google.com/uc?id=";

  path(spreadsheetID) {
    return API.base_url + spreadsheetID + API.data_format;
  }

  constructor() {
    this.format = "cards";
    // Sort data descending alphabetically
    let filterdb = new loki("filter.db");
    this.filter = filterdb.addCollection('filter');

    let urls = {};
    this.getSpreadsheet(this.path(API.base_spreadsheet), (data) => {
      // If no data, use the json file
      if (data == null) {
        console.error("Falling back on local database");
        this.data = "local";
        return;
      }
      // Setup urls
      data.forEach((d) => {
        if (!urls[d.gsx$type.$t]) urls[d.gsx$type.$t] = {};
        urls[d.gsx$type.$t][d.gsx$subtype.$t] = this.path(d.gsx$url.$t);
      });
      this.urls = urls;

      if (!fs.existsSync(__dirname + '/../db')) {
        fs.mkdirSync(__dirname + '/../db');
      }

      // setup database from spreadsheet data
      this.db = new loki(`${__dirname}/../db/chaotic_${this.format}.db`, {
        autosave: true,
        autoload: true,
        autoloadCallback: this.databaseInitialize.bind(this),
        autosaveInterval: 4000,
        adapter: new LokiFSStructuredAdapter()
      });
    });
  }

  async getSpreadsheet(spreadsheet, callback) {
    fetch(spreadsheet)
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      return callback(json.feed.entry);
    })
    .catch((err) => {
      console.error('parsing failed', err);
      return callback(null);
    });
  }

  //https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }

  async databaseInitialize() {
    await this.asyncForEach(["attacks","battlegear", "creatures", "locations", "mugic"],
    async (type) => {
      // check if the db already exists in memory
      let entries = this.db.getCollection(type);
      if (entries === null) {
        this[type] = this.db.addCollection(type);
        this.setupType(type);
      }
      else {
        this[type] = entries;
        this.mergeDB(type);
      }
    });
  }

  async setupType(type) {
    let uc_type = type.charAt(0).toUpperCase() + type.slice(1);
    return this.getSpreadsheetData(this.urls[uc_type][this.format], uc_type, (data) => {
      this[type].insert(data);
      this.mergeDB(type);
    });
  }

  async mergeDB(type) {
    // Combines into single DB
    let temp = this[type].chain().data();
    temp.forEach(function(v){ delete v.$loki });
    this.filter.insert(temp);
  }

  async getSpreadsheetData(spreadsheet, type, callback) {
    this.getSpreadsheet(spreadsheet, (data) => {
      callback(data.map((item) => {
        let temp = {};
        delete item.content;
        for (const key of Object.keys(item)) {
          temp[key] = item[key].$t;
        }
        temp["gsx$type"] = type;
        return temp;
      }));
    });
  }

  /*
    Returning a card
  */
  card(card, bot) {
    if (this.data === "local") {
      return this.card_local(card, bot.emojis.find(emoji => emoji.name==="GenCounter"));
    }
    else {
      return this.card_db(card, bot);
    }
  }

  card_local(card, genCounter) {
    var cards = require('../config/cards.json');
    card = cleantext(card.join(" ")); // re-merge string
    function GenericCounter(cardtext, genCounter) {
      if (genCounter) {
        return cardtext.replace(/:GenCounter:/gi, genCounter.toString());
      }
      else return cardtext.replace(/:GenCounter:/gi, 'MC');
    }

    if (!card) {
      // Return random card
      var keys = Object.keys(cards);
      return `${GenericCounter(cards[keys[keys.length * Math.random() << 0]], genCounter)}`;
    }

    for (var key in cards) {
      if (cleantext(key).indexOf(card) === 0) {
        return `${GenericCounter(cards[key], genCounter)}`;
      }
    }

    return "That's not a valid card name";
  }

  card_db(card, bot) {
    card = card.join(" ")
      .replace(/\(|\)/g, (match) => {return ("\\"+match)})
      .replace(/’/g, '\'');

    // Search by name
    let results = this.filter.chain().find(
        {'gsx$name': {'$regex': new RegExp("^"+card, 'i')}}
      ).simplesort('gsx$name').data();

    if (results.length <= 0) {
      if ("thebsarr".includes(cleantext(card))) {
        return new RichEmbed()
          .setColor("#ba9626")
          .addField("Theb-Sarr", "No data available")
          .setImage("https://vignette.wikia.nocookie.net/chaotic/images/d/d8/Theb-sarr.jpg/revision/latest?cb=20130627223729");
      }
      return "That's not a valid card name";
    }

    if (card.length > 0) {
      return this.Response(results[0], bot);
    }
    else {
      return this.Response(rndrsp(results), bot); // Random card
    }
  }

  Response(card, bot) {
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

    let Disciplines = () => {
      let line = "";
      line += card.gsx$courage + bot.emojis.find(emoji => emoji.name==="Courage").toString() + " ";
      line += card.gsx$power + bot.emojis.find(emoji => emoji.name==="Power").toString() + " ";
      line += card.gsx$wisdom + bot.emojis.find(emoji => emoji.name==="Wisdom").toString() + " ";
      line += card.gsx$speed + bot.emojis.find(emoji => emoji.name==="Speed").toString() + " ";
      line += "| " + card.gsx$energy + " E";
      return line;
    }

    let color = () => {
      if (card.gsx$type == "Battlegear") 
        return "#aebdce";
      if (card.gsx$type == "Locations")
        return "#419649";
      if (card.gsx$type == "Attacks")
        return "#586b81";
      switch (card.gsx$tribe) {
        case "OverWorld":
          return "#1994d1";
        case "UnderWorld":
          return "#ce344e";
        case "M'arrillian":
          return "#717981";
        case "Mipedian":
          return "#ba9626";
        case "Danian":
          return "#957167";
        case "Generic":
         if (card.gsx$type == "Creatures")
          return "#b5b5b5";
         else 
          return "#4f545c";
      }
      return "#56687e"; // Default color
    }

    // Ability
    let resp = Ability(card.gsx$ability);

    if (card.gsx$brainwashed){
      resp += "\n**Brainwashed**\n" + Ability(card.gsx$brainwashed);
    }

    if (card.gsx$energy > 0) {
      resp += "\n" + Disciplines();
    }

    const embed = new RichEmbed()
      .setTitle(card.gsx$name)
      .setURL(API.base_image + card.gsx$image)
      .setColor(color())
      .setDescription(resp)
      .setImage(API.base_image + card.gsx$image);
    
    return embed;
  }

}
