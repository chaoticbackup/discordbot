import { Client, Snowflake, Message, GuildMember, CollectorFilter, MessageReaction, Guild } from 'discord.js';
import ScanQuestDB from '../scan_db';
import { TradeStatus } from './manager';

export default class Trader {
  readonly bot: Client;
  readonly db: ScanQuestDB;

  constructor(bot: Client, db: ScanQuestDB) {
    this.bot = bot;
    this.db = db;
  }

  public async trade(args: string[], mentions: string[], message: Message) {
    const content = args.join(' ').replace(/<:.*:[0-9]*>/gi, '');
    console.log(content, mentions, message.content);

    if (mentions.length === 0) return await message.channel.send('Tag a user to start a trade with');
    if (mentions.length > 1) return await message.channel.send('You must specify exatly one user');

    const one = message.member;
    const two = message.guild.members.get(mentions[0]);

    const status = this.findTrade(one, two!)?.status ?? undefined;
    if (!status) {
      return await this.startTrade(one, two!, message);
    }
    else if (status === TradeStatus.sent) {
      return 'Trade with this user is already pending';
    }
    else {
      // TODO
      this.activeTrades.pop();
    }
  }

  protected findTradeQuery(trade: ActiveTrade, one: GuildMember, two: GuildMember) {
    return Boolean(
      (trade.one.id === one.id && trade.two.id === two.id) ||
      (trade.one.id === two.id && trade.two.id === one.id)
    );
  }

  protected findTrade(one: GuildMember, two: GuildMember) {
    return this.activeTrades.find(trade => this.findTradeQuery(trade, one, two));
  }

  protected removeTrade()

  protected async startTrade(one: GuildMember, two: GuildMember, message: Message) {
    const new_trade = {
      one: {
        id: message.author.id,
        items: []
      },
      two: {
        id: two.id,
        items: []
      },
      status: TradeStatus.sent
    }
    const displayName = message.guild.members.get(two.id);

    this.activeTrades.push(new_trade);

    const msg = await message.channel.send(`${displayName}, would you like to trade with ${message.member.displayName}?`);
    await msg.react('🇾');
    await msg.react('🇳');

    const filter = ((reaction: MessageReaction, user) => {
      return ['🇾', '🇳'].includes(reaction.emoji.name) && user.id === two.id;
    }) as CollectorFilter;

    await msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
    .then(async collected => {
      const reaction = collected.first();

      if (reaction.emoji.name === '🇾') {

      }
      else if (reaction.emoji.name === '🇳') {
        this.activeTrades = this.activeTrades.filter(trade => this.findTradeQuery(trade, one, two));
        await message.channel.send(`${displayName} has rejected starting a trade`);
      }
    })
    .catch(() => {
      this.activeTrades = this.activeTrades.filter(trade => this.findTradeQuery(trade, one, two));
    });
  }

  protected postOffer() {

  }

  protected acceptOffer() {

  }
}
