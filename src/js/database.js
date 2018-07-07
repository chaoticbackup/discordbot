const fetch =  require('node-fetch');
import loki from 'lokijs';
import {reload, rndrsp, cleantext} from './shared.js';

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
    this.filter = new loki("filter.db");

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

      // setup database from spreadsheet data
      this.db = new loki(`chaotic_${this.format}.db`, {
        autosave: true,
        autoload: true,
        autoloadCallback: this.databaseInitialize.bind(this),
        autosaveInterval: 4000,
        persistenceMethod: 'localStorage'
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

  databaseInitialize() {
    ["attacks","battlegear", "creatures", "locations", "mugic"]
    .forEach((type, i) => {
      // check if the db already exists in memory
      let entries = this.db.getCollection(type);
      if (entries === null) {
        this[type] = this.db.addCollection(type);
        this.setupType(type);
      }
      else {
        this[type] = entries;
      }
    });
  }

  async setupType(type) {
    let uc_type = type.charAt(0).toUpperCase() + type.slice(1);
    return this.getSpreadsheetData(this.urls[uc_type][this.format], uc_type, (data) => {
      this[type].insert(data);
    });
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
      return this.card_local(card, bot.emojis.find("name", "GenCounter"));
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
        return `${GenericCounter(cards[key].replace(), genCounter)}`;
      }
    }

    return "That's not a valid card name";
  }

  card_db(card, bot) {
    card = card.join(" ");

    // Sort data descending alphabetically
    let filter = this.filter.addCollection('filter');
    var pview = filter.addDynamicView('filter');
    pview.applySimpleSort('gsx$name');

    // begin data filtering
    let attackResults = this.attacks.chain();
    let battlegearResults = this.battlegear.chain();
    let creatureResults = this.creatures.chain();
    let locationResults = this.locations.chain();
    let mugicResults = this.mugic.chain();

    // Search by name
    if (card.length > 0) {
      attackResults = attackResults.find(
        {'gsx$name': {'$regex': new RegExp("^"+card, 'i')}}
      );
      battlegearResults = battlegearResults.find(
        {'gsx$name': {'$regex': new RegExp("^"+card, 'i')}}
      );
      creatureResults = creatureResults.find(
        {'gsx$name': {'$regex': new RegExp("^"+card, 'i')}}
      );
      locationResults = locationResults.find(
        {'gsx$name': {'$regex': new RegExp("^"+card, 'i')}}
      );
      mugicResults = mugicResults.find(
        {'gsx$name': {'$regex': new RegExp("^"+card, 'i')}}
      );
    }

    // Merge Results
    let temp;

    temp = attackResults.data();
    temp.forEach(function(v){ delete v.$loki });
    filter.insert(temp);

    temp = battlegearResults.data();
    temp.forEach(function(v){ delete v.$loki });
    filter.insert(temp);

    temp = creatureResults.data();
    temp.forEach(function(v){ delete v.$loki });
    filter.insert(temp);

    temp = locationResults.data();
    temp.forEach(function(v){ delete v.$loki });
    filter.insert(temp);

    temp = mugicResults.data();
    temp.forEach(function(v){ delete v.$loki });
    filter.insert(temp);

    let results = pview.data();
    this.filter.removeCollection('filter');

    if (results.length <= 0) {
      return "That's not a valid card name";
    }

    let Response = (card) => {
      function MugicCounter(cardtext) {
        //tribal mugic counters
        let mc = (() => {
          switch (card.gsx$tribe) {
            case "OverWorld":
              return bot.emojis.find("name", "OWCounter");
            case "UnderWorld":
              return bot.emojis.find("name", "UWCounter");
            case "M'arrillian":
              return bot.emojis.find("name", "MarCounter");
            case "Mipedian":
              return bot.emojis.find("name", "MipCounter");
            case "Danian":
              return bot.emojis.find("name", "DanCounter");
            default:
              return bot.emojis.find("name", "GenCounter");
          }
        })();
        if (mc) {
          return cardtext.replace(/\{\{MC\}\}/gi, mc.toString());
        }
        else return cardtext.replace(/\{\{MC\}\}/gi, 'MC');
      }

      let resp = MugicCounter(card.gsx$ability);

      if (card.gsx$brainwashed)
        resp += "\n" + MugicCounter(card.gsx$brainwashed);

      resp += "\n" + API.base_image + card.gsx$image;

      return resp;
    }

    if (card.length > 0) {
      return Response(results[0]);
    }
    else {
      return Response(rndrsp(results)); // Random card
    }

  }

}
