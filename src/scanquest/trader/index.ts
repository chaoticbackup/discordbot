import { Client, Message, GuildMember, CollectorFilter, MessageReaction } from 'discord.js';
import ScanQuestDB from '../scan_db';
import TradeManager, { TradeStatus } from './TradeManager';
import debug from '../../common/debug';
import logger from '../../logger';

const yes = '🇾';
const no = '🇳';

type sendFunction = (msg: string) => Promise<Message | void>

export default class Trader {
  readonly bot: Client;
  readonly trades: TradeManager;

  constructor(bot: Client, db: ScanQuestDB) {
    this.bot = bot;
    this.trades = new TradeManager(db);
  }

  public async trade(args: string[], mentions: string[], message: Message): Promise<void> {
    const content = args.join(' ').replace(/<@![0-9]*>/gi, '');

    const send = async (msg: string) => {
      return await message.channel.send(msg).catch((e) => { logger.error(e); });
    }

    if (!mentions || mentions.length === 0) { await send('Tag a user to trade with'); return; }
    if (mentions.length > 1) { await send('You must specify exactly one user per trade'); return; }
    // if (mentions[0] === message.author.id) { await send('You cannot trade with yourself'); return; }

    try {
      const one = message.member;
      const two = message.guild.members.get(mentions[0]);
      if (!two || two.user.bot) { await send('Invalid user'); return; }

      if (content.includes('cancel')) {
        this.trades.remove(one, two);
        await send(`${one.displayName} has canceled the trade`);
        return;
      }

      const status = this.trades.find(one, two)?.status ?? TradeStatus.none;
      switch (status) {
        case TradeStatus.none:
          await this.startTrade(one, two, content, send);
          break;
        case TradeStatus.sent:
          await send('Trade with this user is already pending');
          break;
        case TradeStatus.offering:
          await send(this.postOffer(one, two, content));
          if (message.deletable) await message.delete();
          break;
        default:
          break;
      }
    }
    catch (e) {
      debug(this.bot, e, 'error');
    }
  }

  protected async startTrade(one: GuildMember, two: GuildMember, content: string, send: sendFunction) {
    // In this function, I choose to skip awaiting certain async actions to speed up the interactions
    // Empty catch statements, because it can still function without these actions succeeding

    const response = await send(
      `${two.displayName}, would you like to trade with ${one.displayName}?`
    );
    if (!response) { await send('Error starting trade'); return; }

    this.trades.add(one, two, response, parseScans(content));

    await response.react(yes);
    response.react(no).catch(() => {});

    const filter = ((reaction: MessageReaction, user) => {
      return [yes, no].includes(reaction.emoji.name) && user.id === two.id;
    }) as CollectorFilter;

    response.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
    .then(async collected => {
      const reaction = collected.first();
      await response.clearReactions();

      if (reaction.emoji.name === yes) {
        this.trades.update(one, two, { status: TradeStatus.offering });
        send(`${two.displayName} is willing to trade.\n${help(0)}\n${help()}`).catch(() => {});
        await response.react(yes);
        this.acceptTrade(one, two, response, send);
      }
      else if (reaction.emoji.name === no) {
        this.trades.remove(one, two);
        await send(`${two.displayName} has rejected the trade`);
      }
    })
    .catch(async () => {
      this.trades.remove(one, two);
      await send(`${one.displayName}'s trade with ${two.displayName} has expired`);
    });
  }

  protected acceptTrade(one: GuildMember, two: GuildMember, response: Message, send: sendFunction) {
    const filter = ((reaction: MessageReaction, user) => {
      return [yes].includes(reaction.emoji.name) && (user.id === one.id || user.id === two.id);
    }) as CollectorFilter;

    response.awaitReactions(filter, { max: 2, time: 240000, errors: ['time'] })
    .then(async () => {
      this.trades.complete(one, two);
      await send(`The trade between ${one.displayName} and ${two.displayName} has been completed!`);
    })
    .catch(async () => {
      this.trades.remove(one, two);
      await response.clearReactions();
    });
  }

  protected postOffer(one: GuildMember, two: GuildMember, content: string) {
    let offering = 0;
    const cards = parseScans(content);
    const trade = this.trades.find(one, two);

    if (trade?.one.id === one.id) {
      if (trade.one.scans.length > 0) offering = 1;
      trade.one.scans = cards;
    }
    else if (trade?.two.id === one.id) {
      if (trade.two.scans.length > 0) offering = 1;
      trade.two.scans = cards;
    }
    this.trades.update(one, two, { ...trade });

    let msg = (offering === 0) ? `${one.displayName} is offering: ` : `${one.displayName} has updated offer: `;
    msg += this.trades.listScans(one, cards);

    return msg;
  }
}

function help(arg?: number) {
  if (arg === 0) return 'Either player may cancel by using ``!trade @tag cancel``';
  return 'To modify offer, use ``!trade @tag scan id, scan id, etc.``'
}

export function parseScans(content: string): number[] {
  const cards = [...new Set(content.split(',').filter((card) => !isNaN(+card)))].map((card) => parseInt(card));
  if (cards.length > 0 && isNaN(cards[0])) cards.pop();
  return cards;
}
