import { Snowflake, GuildMember, Message, Collection } from 'discord.js';
import logger from '../../logger';
import ScanQuestDB from '../scan_db';
import Scanned from '../scanner/Scanned';
import { toScannable } from '../scanner';
import Scannable from '../scanner/Scannable';

export enum TradeStatus {
  none = -1,
  sent,
  offering
}

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

const yes = '🇾';

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
      this.activeTrades = this.activeTrades.filter(trade => this.findQuery(trade, one, two));
      this.getResponse(trade)?.clearReactions().catch(logger.error);
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

  public update(one: GuildMember, two: GuildMember, update: Partial<ActiveTrade>) {
    this.activeTrades.map((trade) => {
      if (this.findQuery(trade, one, two)) {
        trade = Object.assign(trade, { ...update });
        this.updateMessage(one, two);
      }
      return trade;
    });
  }

  private getResponse(trade: ActiveTrade) {
    return this.messages.get(trade.msg_id);
  }

  private updateMessage(one: GuildMember, two: GuildMember, response?: Message) {
    const trade = this.find(one, two) as ActiveTrade;
    if (!response) response = this.getResponse(trade);

    // swap users if out of order
    one = (one.id === trade.one.id) ? one : two;
    two = (two.id === trade.two.id) ? two : one;

    const content = `${one.displayName}: ${this.listScans(one, trade.one.scans)}\n` +
      `${two.displayName}: ${this.listScans(two, trade.two.scans)}\n` +
      `\n${help(0)}\n${help()}` +
      `When both players press the ${yes} reaction, the trade will be completed.`;

    response?.edit(content).catch(logger.error);
  }

  public listScans(one: GuildMember, cards: number[]) {
    let msg = '';
    const player = this.db.findOnePlayer({ id: one.id });
    cards.forEach((i) => {
      if (i < player.scans.length) {
        const card = toScannable(player.scans[i]) as Scannable;
        msg += `${card?.toString()}; `;
      }
    })
    return msg.replace(/;.{0,1}$/, '');
  }

  public complete(one: GuildMember, two: GuildMember) {
    const trade = this.find(one, two) as ActiveTrade;
    const p1 = this.db.findOnePlayer({ id: one.id });
    const p2 = this.db.findOnePlayer({ id: two.id });

    const c1 = [] as Scanned[];
    const c2 = [] as Scanned[];

    for (const scan of trade.one.scans) {
      c1.push(p1.scans.splice(scan, 1)[0]);
    }
    for (const scan of trade.two.scans) {
      c2.push(p2.scans.splice(scan, 1)[0]);
    }

    p1.scans = p1.scans.concat(c2);
    p2.scans = p2.scans.concat(c1);

    this.db.players.update(p1);
    this.db.players.update(p2);

    this.remove(one, two);

    const response = this.getResponse(trade);
    if (response) this.messages.delete(response.id);
  }
}

export function help(arg?: number) {
  if (arg === 0) return 'Either player may cancel by using ``!trade @tag cancel``';
  return 'To modify offer, use ``!trade @tag scan id, scan id, etc.``'
}
