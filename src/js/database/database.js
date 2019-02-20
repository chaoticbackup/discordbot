import loki from 'lokijs';
import fs from 'fs';
const fetch =  require('node-fetch');
const LokiFSStructuredAdapter = require('lokijs/src/loki-fs-structured-adapter');

class API {
  instance = null;
  data = "";
  static base_url = "https://spreadsheets.google.com/feeds/list/";
  static data_format = "/od6/public/values?alt=json";
  static base_spreadsheet = "1cUNmwV693zl2zqbH_IG4Wz8o9Va_sOHe7pAZF6M59Es";
  get base_image() { return "https://drive.google.com/uc?id="; }
  get card_back() { return "1_MgWDPsPGf-gPBArn2v6ideJcqOPsSYC"; }

  // Singleton
  static getInstance() {
    if (!this.instance) { this.instance = new API(); }
    return this.instance;
  }

  static path(spreadsheetID) {
    return API.base_url + spreadsheetID + API.data_format;
  }
  path(spreadsheetID) {
    return API.path(spreadsheetID);
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

      if (!fs.existsSync(__dirname + '/../../db')) {
        fs.mkdirSync(__dirname + '/../../db');
      }

      // setup database from spreadsheet data
      this.db = new loki(`${__dirname}/../../db/chaotic_${this.format}.db`, {
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

  find_name(name) {
    if (name.length < 2) {
      return "Use at least 2 characters";
    }
    name = this.escape_text(name);

    let results = this.filter.chain().find(
        {'gsx$name': {'$regex': new RegExp(name, 'i')}}
      ).simplesort('gsx$name').data();

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

  escape_text(text) {
    return text
      .replace(/\(|\)/g, (match) => {return ("\\"+match)})
      .replace(/’/g, '\'');
  }

  /* Finding cards in the database by name */
  find_cards_by_name(name, options) {
    let card_name = this.escape_text(name);

    let filters = [];

    if (options.length > 0) {
      options = options.join(" ").toLowerCase();
      
      let type = (/type=([\w]{2,})/).exec(options);
      if (type) filters.push({'gsx$type': {'$regex': new RegExp(type[1], 'i')}});

      let tribe = (/tribe=([\w']{2,})/).exec(options);
      if (tribe) filters.push({'gsx$tribe': {'$regex': new RegExp(tribe[1], 'i')}});
    }

    // Search by name
    return this.filter.chain().find({'$and': [
      {'$or': [
        {'gsx$name': {'$regex': new RegExp("^"+card_name, 'i')}},
        {'gsx$tags': {'$regex': new RegExp(`(^|\\s)${card_name}`, 'gi')}}
      ]},
      {'$and': filters}
    ]}).simplesort('gsx$name').data();
  }

  color(card) {
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

}
export default API.getInstance();
