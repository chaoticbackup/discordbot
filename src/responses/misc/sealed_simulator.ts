
import { GuildMember, Message, RichEmbed } from 'discord.js';
import fs from 'fs-extra';
import Loki from 'lokijs';
// @ts-ignore
import fetch from 'node-fetch';
import path from 'path';

import { isModerator } from '../../common/index.js';
import users from '../../common/users.js';

import API from '../../database/Api.js';
import db_path from '../../database/db_path';
import { SendFunction } from '../../definitions.js';
import logger from '../../logger';

const LokiFSStructuredAdapter = require('lokijs/src/loki-fs-structured-adapter');

const db_folder = path.resolve(db_path, 'cards');
// ensure cards folder exists
if (!fs.existsSync(db_folder)) {
  fs.mkdirSync(db_folder);
}

const id = '19uyfD6OWAw_bACsducnQBpJuTU6fdgscozlQz3AZLlo';

interface Card {
  name: string
  type: string
  rarity: string
}

class Sealed {
  db;
  sealed: Loki.Collection<any>;

  constructor() {
    const databaseInitialize = async () => {
      const entries = this.db.getCollection('sealed_pool');
      if (entries === null || entries.data.length === 0) {
        this.db.removeCollection('sealed_pool');
      }
      this.sealed = this.db.addCollection('sealed_pool');
      try {
        // @ts-ignore
        const url = API.path(id);

        const response = await fetch(url);
        const data = await response.json()
        .then((json: any) => json.values)
        .then((data: any) => {
          const header = data.shift().map((h: string) => h.toLowerCase().replace(' ', ''));

          return data.map((card: Card) => {
            const obj = {};

            for (let i = 0; i < header.length; i++) {
              obj[`${header[i]}`] = card[i];
            }

            return obj;
          });
        });
        this.sealed.insert(data);
      } catch (e) {
        logger.error(e.message);
      }
    };

    this.db = new Loki(path.resolve(db_folder, 'sealed_pool.db'), {
      autosave: true,
      autoload: true,
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      autoloadCallback: databaseInitialize.bind(this),
      adapter: new LokiFSStructuredAdapter()
    });
  }

  public packs(amount: number) {
    const cards: Card[] = [];

    const pview = this.sealed.addDynamicView('set');

    const generateCard = (results: any[]) => {
      const id = Math.floor(Math.random() * results.length);
      const card = results[id];
      cards.push(card);
    };

    const randomChaser = (rarity = 'rare') => {
      const randomNumber = Math.floor(Math.random() * 24) + 1;
      if (randomNumber === 24) return 'ultra';
      else if (randomNumber % 3 === 0) return 'super';
      else return rarity;
    };

    const genrarity = (rarity: string, num: number) => {
      pview
        .applyFind({ rarity });
      const results = pview.data();
      for (let i = 0; i < num; i++) generateCard(results);
      pview.removeFilters();
    };

    for (let i = 0; i < amount; i++) {
      genrarity('common', 6);
      genrarity('rare', 2);
      genrarity(randomChaser(), 1);
    }

    return cards;
  }
}

const set = new Sealed();

export default async function (
  amount: number, message: Message, guildMember: GuildMember | undefined, mentions: string[], send: SendFunction
) {
  if (amount > 40) {
    return await send('Maximum of *40* packs at a time');
  }
  const pool = generate_sealed_pool(amount);
  if (guildMember) {
    if (mentions.length > 0 && isModerator(guildMember)) {
      if (mentions.includes(users('me'))) {
        return await send('Thanks for the packs!');
      }
      const gm = await message.guild.fetchMember(mentions[0]);
      void gm.send(pool)
      .then(() => {
        pool.setDescription(`<@${gm.id}>`);
        void guildMember.send(pool);
      });
    } else {
      void guildMember.send(pool);
    }
  }
  else {
    void send(pool);
  }
  return await send(`Generating sealed card pool with ${amount} pack(s)`);
}

export function generate_sealed_pool(amount: number) {
  const cards = set.packs(amount);

  const attacks: Card[] = [];
  const battlegear: Card[] = [];
  const creatures: Card[] = [];
  const locations: Card[] = [];
  const mugic: Card[] = [];

  cards.forEach((card) => {
    if (card.type === 'attack') attacks.push(card);
    else if (card.type === 'battlegear') battlegear.push(card);
    else if (card.type === 'creature') creatures.push(card);
    else if (card.type === 'location') locations.push(card);
    else if (card.type === 'mugic') mugic.push(card);
  });

  const output = new RichEmbed();

  const makeSection = (type: string, cards: Card[]) => {
    let message = '';
    let cont = false;
    let dup = 1;

    const sorted = cards.map(c => c.name).sort((c1, c2) => c1.localeCompare(c2));

    const { length } = sorted;

    sorted.forEach((card, index) => {
      if (index < length && card === sorted[index + 1]) {
        dup++;
        return;
      }

      const entry = dup > 1 ? `${card} [x${dup}]\n` : `${card}\n`;
      dup = 1;

      if (message.length + entry.length >= 1024) {
        output.addField(
          (!cont ? type : `${type} cont.`), message, true
        );
        message = '';
        cont = true;
      }
      message += entry;
    });
    output.addField(
      (!cont ? type : `${type} cont.`), message, true
    );
  };

  if (attacks.length > 1) makeSection('Attacks', attacks);
  if (battlegear.length > 1) makeSection('Battlegear', battlegear);
  if (creatures.length > 1) makeSection('Creatures', creatures);
  if (locations.length > 1) makeSection('Locations', locations);
  if (mugic.length > 1) makeSection('Mugic', mugic);

  return output;
}
