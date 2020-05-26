import { Snowflake, GuildMember } from 'discord.js';

export enum TradeStatus {
  sent,
  started,
  pending,
  offering,
}

export interface ActiveTrade {
  one: {
    id: Snowflake
    items: number[]
  }
  two: {
    id: Snowflake
    items: number[]
  }
  status: number
}

export default class Manager {
  private activeTrades = [] as ActiveTrade[];

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
    this.activeTrades = this.activeTrades.filter(trade => this.findQuery(trade, one, two));
  }

  public add(one: GuildMember, two: GuildMember) {
    this.activeTrades.push({
      one: {
        id: one.id,
        items: []
      },
      two: {
        id: two.id,
        items: []
      },
      status: TradeStatus.sent
    });
  }

  public updateStatus(one: GuildMember, two: GuildMember, status: TradeStatus) {
    this.activeTrades = this.activeTrades.map(trade => {
      if (this.findQuery(trade, one, two)) {
        trade.status = status;
        return trade;
      }
      return trade;
    });
  }
}
