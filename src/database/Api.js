/* eslint-disable promise/no-callback-in-promise */
import fs from 'fs-extra';
import loki from 'lokijs';
import path from 'path';
import { escape_text, asyncForEach } from '../common';
import db_path from './db_path';

const fetch = require('node-fetch');
const LokiFSStructuredAdapter = require('lokijs/src/loki-fs-structured-adapter');

const db_folder = path.resolve(db_path, 'cards');
// ensure cards folder exists
if (!fs.existsSync(db_folder)) {
  fs.mkdirSync(db_folder);
}

export default class API {
  instance = null;
  data = '';
  static base_url = 'https://spreadsheets.google.com/feeds/list/';
  static data_format = '/od6/public/values?alt=json';
  static base_spreadsheet = '1cUNmwV693zl2zqbH_IG4Wz8o9Va_sOHe7pAZF6M59Es';
  get base_image() { return 'https://drive.google.com/uc?id='; }
  get card_back() { return 'https://i.imgur.com/xbeDBRJ.png'; }

  // Singleton
  static getInstance() {
    if (!this.instance) { this.instance = new API(); }
    return this.instance;
  }

  rebuild() {
    this.instance = null;
    return new Promise((resolve, reject) => {
      fs.remove(db_folder, (error) => {
        if (error) return reject(error);
        return resolve();
      });
    });
  }

  static path(spreadsheetID) {
    return API.base_url + spreadsheetID + API.data_format;
  }

  path(spreadsheetID) {
    return API.path(spreadsheetID);
  }

  constructor() {
    this.format = 'cards';
    // Sort data descending alphabetically
    const filterdb = new loki('filter.db');
    this.filter = filterdb.addCollection('filter');

    // Setup urls
    const urls = {};
    const data = require('./meta_spreadsheet.json');
    data.forEach((d) => {
      if (!urls[d.gsx$type.$t]) urls[d.gsx$type.$t] = {};
      urls[d.gsx$type.$t][d.gsx$subtype.$t] = this.path(d.gsx$url.$t);
    });
    this.urls = urls;

    // setup database from spreadsheet data
    this.db = new loki(path.resolve(db_folder, `chaotic_${this.format}.db`), {
      autosave: true,
      autoload: true,
      autoloadCallback: this.databaseInitialize.bind(this),
      adapter: new LokiFSStructuredAdapter()
    });
  }

  async getSpreadsheet(spreadsheet, callback) {
    fetch(spreadsheet)
      .then((response) => {
        return response.json();
      })
      .catch(() => {
        console.error('Falling back on local database');
        this.data = 'local';
        callback(null);
      })
      .then((json) => {
        callback(json.feed.entry);
      })
      .catch((err) => {
        console.error('parsing failed', err);
        callback(null);
      });
  }

  async databaseInitialize() {
    await asyncForEach(['Attacks', 'Battlegear', 'Creatures', 'Locations', 'Mugic'],
      (type) => {
        // check if the db already exists in memory
        const entries = this.db.getCollection(type);
        if (entries === null) {
          this[type] = this.db.addCollection(type);
          this.setupType(type);
        }
        else {
          this[type] = entries;
          this.mergeDB(type);
        }
      }
    );
    this.data = 'api';
  }

  async setupType(type) {
    const uc_type = type.charAt(0).toUpperCase() + type.slice(1);
    return await this.getSpreadsheetData(this.urls[uc_type][this.format], uc_type, (data) => {
      this[type].insert(data);
      this.mergeDB(type);
    });
  }

  async mergeDB(type) {
    // Combines into single DB
    const temp = this[type].chain().data();
    temp.forEach(function (v) { delete v.$loki; });
    this.filter.insert(temp);
  }

  async getSpreadsheetData(spreadsheet, type, callback) {
    return await this.getSpreadsheet(spreadsheet, (data) => {
      callback(data.map((item) => {
        const temp = {};
        delete item.content;
        for (const key of Object.keys(item)) {
          temp[key] = item[key].$t;
        }
        temp.gsx$type = type;
        return temp;
      }));
    });
  }

  /**
   * Given a string of characters returns all cards that contain them
   */
  find_card_name(text) {
    text = escape_text(text).replace(/,([^\s]+)/, (str, p1) => {
      return `, ${p1}`;
    });

    return this.filter.chain().find({
      $or: [
        { gsx$name: { $regex: new RegExp(text, 'i') }},
        { gsx$tags: { $regex: new RegExp(`(^|\\s)${text}`, 'gi') }}
      ]
    }).simplesort('gsx$name').data();
  }

  /**
   *  Finds cards in the database by name
   */
  find_cards_by_name(name, options = []) {
    name = escape_text(name).replace(/,([^\s]+)/, (str, p1) => {
      return `, ${p1}`;
    });

    const filters = [];
    if (options && options.length > 0) {
      options = options.join(' ').toLowerCase();

      const type = (/type=([\w]{2,})/).exec(options);
      if (type) filters.push({ gsx$type: { $regex: new RegExp(type[1], 'i') }});

      const tribe = (/tribe=([\w']{2,})/).exec(options);
      if (tribe) filters.push({ gsx$tribe: { $regex: new RegExp(tribe[1], 'i') }});
    }

    // Search by name
    return this.filter.chain().find({
      $and: [
        {
          $or: [
            { gsx$name: { $regex: new RegExp(`^${name}`, 'i') }},
            { gsx$tags: { $regex: new RegExp(`(^|\\s)${name}`, 'gi') }}
          ]
        },
        { $and: filters }
      ]
    }).simplesort('gsx$name').data();
  }
}
