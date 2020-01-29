import { ScannableBattlegear, BattlegearScan } from './scannable/Battlegear';
import { ScannableLocation, LocationScan } from './scannable/Location';
import Loki, { Collection } from 'lokijs';
import path from 'path';
import db_path from '../database/db_path';
import { CreatureScan, ScannableCreature } from './scannable/Creature';
import { Scan, Scannable } from './scannable/Scannable';
import { Message, DMChannel, TextChannel } from 'discord.js';
import { FieldsEmbed } from 'discord-paginationembed';
import { resolve } from 'dns';
const LokiFSStructuredAdapter = require('lokijs/src/loki-fs-structured-adapter');

class Player {
  public id: string;
  public scans: Scan[];
}

class ScanQuestDB {
  private players: Collection<Player>;
  private readonly db: Loki;

  constructor() {
    this.db = new Loki(path.resolve(db_path, 'scanquest.db'), {
      adapter: new LokiFSStructuredAdapter(),
      autoload: true,
      autosave: true,
      autoloadCallback: () => {
        const players = this.db.getCollection('players') as Collection<Player>;
        if (players === null) {
          this.players = this.db.addCollection('players');
        }
        else {
          this.players = players;
        }
      }
    });
  }

  list = async (message: Message): Promise<void> => {
    const player = this.findOnePlayer({ id: message.author.id });
    if (player.scans.length === 0) {
      await message.channel.send('You have no scans');
      return;
    }

    const resp: string[] = [];
    player.scans.forEach((scan, i) => {
      let result: Scannable | undefined;
      if (scan.type === 'Creatures') {
        result = new ScannableCreature(scan as CreatureScan);
      }
      else if (scan.type === 'Locations') {
        result = new ScannableLocation(scan as LocationScan);
      }
      else if (scan.type === 'Battlegear') {
        result = new ScannableBattlegear(scan as BattlegearScan);
      }

      if (result) {
        resp.push(`${i + 1}) ${result.toString()}`);
      }
    });

    const Pagination = new FieldsEmbed<string>()
    .setAuthorizedUsers([message.author.id])
    .setChannel(message.channel as (TextChannel | DMChannel))
    .setElementsPerPage((message.channel instanceof TextChannel) ? 10 : 20)
    .setPageIndicator(true)
    .setArray(resp)
    .formatField('Scans', el => el);

    return Pagination.build();
  }

  save = async (id: string, card: Scan): Promise<boolean> => {
    return new Promise((resolve) => {
      const player = this.findOnePlayer({ id: id });
      if (player.scans.length === 0 || player.scans[player.scans.length - 1].name !== card.name) {
        player.scans.push(card);
        this.players.update(player);
        return resolve(true);
      }
      return resolve(false);
    });
  }

  private findOnePlayer({ id }: {id: string}) {
    let player = this.players.findOne({ id: id });
    if (player === null) {
      player = this.players.insert({ id, scans: [] }) as Player & LokiObj;
    }
    return player;
  }
}

export default ScanQuestDB;
