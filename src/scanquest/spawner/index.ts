
import { Client, RichEmbed, Snowflake, Message } from 'discord.js';
import Battlegear from './Battlegear';
import Creature from './Creature';
import Location from './Location';
import Scannable from '../scanner/Scannable';
import ScanQuestDB from '../scan_db';
import { Channel } from '../../definitions';

export default class Spawner {
  private readonly scan_battlegear: Battlegear;
  private readonly scan_creature: Creature;
  private readonly scan_locations: Location;
  private readonly timers: Record<Snowflake, NodeJS.Timeout>;
  readonly bot: Client;
  readonly db: ScanQuestDB;

  constructor(bot: Client) {
    this.bot = bot;
    this.scan_battlegear = new Battlegear();
    this.scan_creature = new Creature();
    this.scan_locations = new Location();
  }

  stop() {
    Object.keys(this.timers).forEach((timer) => {
      clearTimeout(this.timers[timer]);
    });
  }

  reroll(message: Message) {
    const server_id = message.guild.id;
    clearTimeout(this.timers[server_id]);
  }

  tick(message: Message) {
    const server_id = message.guild.id;
    // TODO only monitor the server the bot is configured for

    // TODO decrease timer countdown with activity
    // Assign point value to next spawn, size of messages decrease from point value
  }

  /**
   * Sends a card image to the configed channel
  */
  private sendCard(send_channel: Snowflake) {
    let image: RichEmbed;
    let scannable: Scannable;

    // Creatures spawn more often than locations and battlegear
    // TODO more complex spawn logic
    const rnd = Math.floor(Math.random() * 20);
    if (rnd < 4) {
      [scannable, image] = this.scan_locations.generate();
    }
    else if (rnd < 5) {
      [scannable, image] = this.scan_battlegear.generate();
    }
    else {
      [scannable, image] = this.scan_creature.generate();
    }

    // TODO set time active
    image.setDescription('timer');

    (this.bot.channels.get(send_channel) as Channel).send(image).catch(() => {});

    // TODO add to list of active scans

    // TODO setup timer to remove active scans when they time out

    // const lastSpawn = JSON.stringify({
    //   type: scan.card.type,
    //   info: scan.toString()
    // });
  }
}
