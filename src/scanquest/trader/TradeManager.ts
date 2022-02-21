import { Snowflake, GuildMember, Message, Collection } from 'discord.js';
import logger from '../../logger';
import ScanQuestDB from '../database';
import { Scanned } from '../scan_type/Scanned';
import { toScannable } from '../scan_type/toScannable';
import { Scannable } from '../scan_type/Scannable';
import { msgCatch } from '../../common';

export const yes = '🇾';
export const no = '🇳';

export enum TradeStatus {
  none = -1,
  sent,
  offering
}

export type sendFunction = (msg: string) => Promise<Message | void>;

export interface ActiveTrade {
  one: {
    id: Snowflake
    scans: number[]
  }
  two: {
    id: Snowflake
    scans: number[]
  }
  status: number
  msg_id: Snowflake
}

export default class {
  readonly db: ScanQuestDB;
  // the key is the combination of user snowflakes
  private activeTrades: ActiveTrade[] = [];
  private readonly messages: Collection<Snowflake, Message> = new Collection();

  constructor(db: ScanQuestDB) {
    this.db = db;
  }

  protected findQuery(trade: ActiveTrade, one: GuildMember, two: GuildMember) {
    return Boolean(
      (trade.one.id === one.id && trade.two.id === two.id) ||
        (trade.one.id === two.id && trade.two.id === one.id)
    );
  }

  public find(one: GuildMember, two: GuildMember) {
    return this.activeTrades.find(trade => this.findQuery(trade, one, two));
  }

  public remove(one: GuildMember, two: GuildMember) {
    const trade = this.find(one, two);
    if (trade) {
      this.activeTrades = this.activeTrades.filter(trade => !this.findQuery(trade, one, two));
      this.messages.get(trade.msg_id)?.clearReactions().catch(logger.error);
    }
  }

  public add(one: GuildMember, two: GuildMember, response: Message, cards: number[] = []) {
    this.activeTrades.push({
      one: {
        id: one.id,
        scans: cards
      },
      two: {
        id: two.id,
        scans: []
      },
      status: TradeStatus.sent,
      msg_id: response.id
    });

    this.messages.set(response.id, response);
  }

  public async acceptTrade(one: GuildMember, two: GuildMember, send: sendFunction) {
    const response = await send(`${two.displayName} is willing to trade with ${one.displayName}.`);
    if (!response) { await send('Error accepting trade'); return; }

    const trade = this.find(one, two);
    if (!trade) return;

    this.messages.delete(trade.msg_id);
    this.messages.set(response.id, response);

    this.update(one, two, { status: TradeStatus.offering, msg_id: response.id });

    await response.react(yes);

    await this.updateMessage(one, two, undefined, response);

    return response;
  }

  public update(one: GuildMember, two: GuildMember, update: Partial<ActiveTrade>) {
    this.activeTrades = this.activeTrades.map((trade) => {
      if (this.findQuery(trade, one, two)) {
        trade = Object.assign(trade, { ...update });
      }
      return trade;
    });
  }

  public async updateMessage(one: GuildMember, two: GuildMember, trade?: ActiveTrade, response?: Message) {
    if (!trade) trade = this.find(one, two) as ActiveTrade;
    if (!response) response = this.messages.get(trade.msg_id);

    let content = '';

    // swap users if out of order
    if (one.id === trade.one.id) {
      content = `${one.displayName}: ${await this.listScans(one.id, trade.one.scans)}\n`
        + `${two.displayName}: ${await this.listScans(two.id, trade.two.scans)}\n`;
    }
    else {
      content = `${two.displayName}: ${await this.listScans(two.id, trade.one.scans)}\n`
      + `${one.displayName}: ${await this.listScans(one.id, trade.two.scans)}\n`;
    }

    content += `\n${help(0)}\n${help()}\n${help(1)}`;

    response?.edit(content).catch(msgCatch);
  }

  public async listScans(id: Snowflake, cards: number[]) {
    let msg = '';
    const player = await this.db.findOnePlayer({ id: id });
    if (!player) return '';

    cards.forEach((i) => {
      if (i < player.scans.length) {
        const card = toScannable(player.scans[i]) as Scannable;
        msg += `${card?.toString()}; `;
      }
    });
    return msg.replace(/;.{0,1}$/, '');
  }

  public async complete(one: GuildMember, two: GuildMember) {
    const trade = this.find(one, two) as ActiveTrade;
    const p1 = await this.db.findOnePlayer({ id: one.id });
    const p2 = await this.db.findOnePlayer({ id: two.id });

    const c1 = [] as Scanned[];
    const c2 = [] as Scanned[];

    for (const scan of trade.one.scans.sort((a, b) => b - a)) {
      if (scan <= p1.scans.length)
        c1.push(p1.scans.splice(scan, 1)[0]);
    }
    for (const scan of trade.two.scans.sort((a, b) => b - a)) {
      if (scan <= p2.scans.length)
        c2.push(p2.scans.splice(scan, 1)[0]);
    }

    p1.scans = p1.scans.concat(c2);
    p2.scans = p2.scans.concat(c1);

    this.db.trades.insertOne({
      one: {
        id: p1.id,
        scans: c1
      },
      two: {
        id: p2.id,
        scans: c2
      }
    });

    this.db.players.update(p1);
    this.db.players.update(p2);

    this.remove(one, two);

    this.messages.delete(trade.msg_id);
  }
}

export function help(arg?: number) {
  if (arg === 0) return 'Either player may cancel by using ``!trade @tag cancel``';
  if (arg === 1) return `When both players press the ${yes} reaction, the trade will be completed.`;
  return 'To modify offer, type ``!trade @tag id id etc.``';
}
