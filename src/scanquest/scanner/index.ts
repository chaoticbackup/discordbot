/* eslint-disable max-len */
import { Message, Client } from 'discord.js';
import moment from 'moment';
import { API } from '../../database';
import Icons from '../../common/bot_icons';
import ScanQuestDB, { ActiveScan } from '../scan_db';
import { ScannableBattlegear, BattlegearScan } from './Battlegear';
import { ScannableCreature, CreatureScan } from './Creature';
import { ScannableLocation, LocationScan } from './Location';
import Scannable from './Scannable';
import Scanned from './Scanned';
import { SendFunction } from '../../definitions';

export default class Scanner {
  readonly icons: Icons;
  readonly db: ScanQuestDB;

  constructor(bot: Client, db: ScanQuestDB) {
    this.icons = new Icons(bot);
    this.db = db;
  }

  scan = async (message: Message, args: string, send: SendFunction): Promise<Message | void> => {
    const guild_id = message.guild.id;
    const author_id = message.author.id;

    const server = this.db.servers.findOne({ id: guild_id });
    if (server === null) return;

    if (server.activescans.length === 0) {
      await send('There is no scannable card');
      return;
    }

    // give or take a minute
    const now = moment().subtract(1, 'minute');

    let selected: ActiveScan | undefined;
    if (args === '') {
      while (true) {
        if (server.activescans.length === 0) {
          await send('There is no scannable card');
          return;
        }
        selected = server.activescans[server.activescans.length - 1];
        if (selected === undefined || moment(selected.expires).isBefore(now)) {
          server.activescans.pop();
          this.db.servers.update(server);
        }
        else break;
      }
    }
    else {
      const name = API.find_cards_by_name(args)[0]?.gsx$name ?? null;
      if (name) {
        selected = server.activescans.find(scan => scan.scan.name === name);
      }

      if (selected === undefined || moment(selected.expires).isBefore(now)) {
        await send(`${name || args.replace('@', '')} isn't an active scan`);
        return;
      }
    }

    const player = this.db.findOnePlayer({ id: author_id });
    if (!selected.players || selected.players.length === 0) {
      selected.players = [player.id];
    }
    else if (selected.players.includes(player.id)) {
      await send(`You've already scanned this ${selected.scan.name}`);
      return;
    } else {
      selected.players.push(player.id);
    }
    this.db.servers.update(server);

    const card = Object.assign({}, selected.scan); // clone card to assign code
    card.code = this.db.generateCode();
    await this.db.save(player, card);

    const m = await send(toScannable(card)!.getCard(this.icons));

    if (player.scans.length <= 1) {
      await send(first_scan);
    }

    return m;
  };
}

export function toScannable(scan: Scanned): Scannable | undefined {
  switch (scan.type) {
    case 'Battlegear':
      return new ScannableBattlegear(scan as BattlegearScan);
    case 'Creatures':
      return new ScannableCreature(scan as CreatureScan);
    case 'Locations':
      return new ScannableLocation(scan as LocationScan);
  }
}

const first_scan = `
Hi there! It looks like this is your first time scanning something, so here's some extra info! Different cards will spawn with frequency based on server activity and are active. You can scan any of the active ones before they expire (they have a duration from the time the message appears).
You can see a full list of your scans by typing \`\`!list\`\`, and navigate it with the buttons at the bottom (buttons are explained at the bottom of this message). You can also trade with another person by typing "!trade @user" and following the prompts.
All of this is just for fun right now, but we hope you enjoy! If you have any other questions, we'll be happy to help in either <#135657678633566208> or <#587376910364049438>. That's where most of the server hangs out.

:arrow_backward: - Go one page backwards
:arrow_upper_right: - Go to a specific page (type which one in chat after pressing the button)
:arrow_right: - Go one page forwards
:wastebasket: - Clear your use of the command when you're done
:arrow_down: - Sort your scans alphabetically instead of in the order you scanned them
:mag_right: - Search for copies of a specific card 
`;
