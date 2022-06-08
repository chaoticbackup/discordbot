/* eslint-disable promise/no-callback-in-promise */
import fs from 'fs-extra';
import loki from 'lokijs';
import path from 'path';
import fetch from 'node-fetch';

import { escape_text, asyncForEach } from '../common';
import db_path from './db_path';
import spreadsheet_data from './meta_spreadsheet.json';

const LokiFSStructuredAdapter = require('lokijs/src/loki-fs-structured-adapter');

const db_folder = path.resolve(db_path, 'cards');
// ensure cards folder exists
if (!fs.existsSync(db_folder)) {
  fs.mkdirSync(db_folder);
}

export default class API {
  instance = null;
  data = '';
  
  get base_image() { return "https://drive.google.com/uc?id=" }
  get thumb_missing() { return "1JYjPzkv74IhzlHTyVh2niTDyui73HSfp" }
  get card_back() { return "https://i.imgur.com/xbeDBRJ.png" }
  // such secure, much wow
  static key() { 
    return ["AIz", "aSy", "Bfq", "09-", "tBi", "78b", "nH6", "6f1", "Lkn", "zGD", "XM9", "Zu9", "JG0"].join("");
  }

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
    return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetID}/values/Sheet1?key=${API.key()}`
  }

  constructor() {
    // Sort data descending alphabetically
    const filterdb = new loki('filter.db');
    this.filter = filterdb.addCollection('filter');

    // Setup urls
    const urls = {};
    spreadsheet_data.forEach(({ type, subtype, url }) => {
      if (!urls[type]) urls[type] = {};
      urls[type][subtype] = url;
    });
    this.urls = urls;

    // setup database from spreadsheet data
    this.db = new loki(path.resolve(db_folder, `chaotic_cards.db`), {
      autosave: true,
      autoload: true,
      autoloadCallback: this.databaseInitialize.bind(this),
      adapter: new LokiFSStructuredAdapter()
    });
  }

  async getSpreadsheet(spreadsheetId) {
    const url = API.path(spreadsheetId);

    try {
      const response = await fetch(url);

      if (response.status !== 200) {
        this.data = 'local';
        const err = new Error('Falling back on local database');
        console.error(err.message);
        throw err;
      }

      const json = await response.json();
      return json.values;
    } catch (err) {
      console.error('parsing failed', err);
      throw new Error(err);
    }

  }

  async parseSpreadsheet(spreadsheetId, cardType) {
    return this.getSpreadsheet(spreadsheetId)
    .then((data) => {
      if (data.length < 2) return [];

      const header = data.shift().map((h) => h.toLowerCase().replace(" ", ""));
      const cards = data.map((card) => {
        const obj = { "gsx$type": cardType };

        for (let i = 0; i < header.length; i++) {
          obj[`gsx$${header[i]}`] = card[i];
        }

        return obj;
      });

      return cards;
    });
  }

  async databaseInitialize() {
    await asyncForEach(['Attacks', 'Battlegear', 'Creatures', 'Locations', 'Mugic'],
      async (type) => {
        // check if the db already exists in memory
        const entries = this.db.getCollection(type);
        if (entries === null || entries.data.length === 0) {
          this[type] = this.db.addCollection(type);

          const uc_type = type.charAt(0).toUpperCase() + type.slice(1);
          const data = await this.parseSpreadsheet(this.urls[uc_type]["cards"], uc_type);
          this[type].insert(data);
        }
        else {
          this[type] = entries;
          return Promise.resolve();
        }
      }
    )
    .then(() => {
      // Combines into single DB
      ['Attacks', 'Battlegear', 'Creatures', 'Locations', 'Mugic'].forEach(type => {
        const temp = this[type].chain().data();
        temp.forEach(function (v) { delete v.$loki; });
        this.filter.insert(temp);
      });
      this.data = 'api';
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

  find_cards_ignore_comma(name, options=[]) {
    let results = this.find_cards_by_name(name, options);

    if (results.length > 0) {
      return results;
    }

    if (name.split(' ').length > 1) {
      results = this.find_cards_by_name(name.split(' ')[0], []);
      if (results.length > 0) {
        for (let i = 0; i < results.length; i++) {
          if (results[i].gsx$name.replace(',', '').toLowerCase().includes(name.toLowerCase())) {
            return [results[i]];
          }
        }
      }
    }

    return [];
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
    let results = this.filter.chain().find({
      $and: [
        { gsx$name: { $regex: new RegExp(`^${name}`, 'i') }},
        { $and: filters }
      ]
    }).simplesort('gsx$name').data();

    if (results.length > 0) return results;

    results = this.filter.chain().find({
      $and: [
        { gsx$tags: { $regex: new RegExp(`(^|\\s)${name}`, 'gi') }},
        { $and: filters }
      ]
    }).simplesort('gsx$name').data();

    return results;
  }
}
