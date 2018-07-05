const fetch = require('whatwg-fetch');
const loki = require('lokijs');
const {reload, rndrsp, cleantext} = require('./shared.js');

export default class API {
  static base_url = "https://spreadsheets.google.com/feeds/list/";
  static data_format = "/od6/public/values?alt=json";
  static base_spreadsheet = "1cUNmwV693zl2zqbH_IG4Wz8o9Va_sOHe7pAZF6M59Es";

  path(spreadsheetID) {
    return API.base_url + spreadsheetID + API.data_format;
  }

  constructor() {
    this.format = "collection";

    let urls = {};
    this.getSpreadsheet(this.path(API.base_spreadsheet), (data) => {
      if (data == null) return;
      data.forEach((d) => {
        console.log(d);
        if (!urls[d.gsx$type.$t]) urls[d.gsx$type.$t] = {};
        urls[d.gsx$type.$t][d.gsx$subtype.$t] = this.path(d.gsx$url.$t);
      });
      console.log(urls);
      this.urls = urls;
    });

    this.db = new loki(`chaotic_${this.format}.db`, {
      autosave: true,
      autoload: true,
      autoloadCallback: this.databaseInitialize.bind(this),
      autosaveInterval: 4000,
      persistenceMethod: 'localStorage'
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

  async databaseInitialize() {
    ["attacks","battlegear", "creatures", "locations", "mugic"]
    .forEach((item, i) => {
      // check if the db already exists in memory
      let entries = this.db.getCollection(item);
      if (entries === null) {
        this[item] = this.db.addCollection(item);
      }
      else {
        this[item] = entries;
        console.log(item);
        setupType(item);
      }
    });
  }

  async setupType(type) {
    let uc_type = type.charAt(0).toUpperCase() + type.slice(1);
    console.log(type, this.urls[uc_type]);
    return this.getSpreadsheetData(this.urls[uc_type][this.format], uc_type, (data) => {
      this[type].insert(data);
    });
  }

  
  card(card, genCounter) {
    var cards = reload('../config/cards.json');
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

}
