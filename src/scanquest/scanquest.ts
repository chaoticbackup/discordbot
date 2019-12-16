import { Client, GuildMember, RichEmbed, Message, DMChannel } from 'discord.js';
import { Logger } from 'winston';
import Icons from '../common/bot_icons';
import servers from '../common/servers';
import { API } from '../database';
import { Channel, SendFunction } from '../definitions';
import ScanCreature from './scanfunction/Creature';
import { Scannable } from './scannable/Scannable';
import ScanQuestDB from './scan_db';
import ScanLocation from './scanfunction/Location';
import ScanBattlegear from './scanfunction/Battlegear';

const config = {
    "default_channel": servers("main").channel("perim"),
    "test_channel": servers("develop").channel("bot_commands")
}

class ScanQuest {
    private static instance: ScanQuest;
    private channel: string;
    private timeout: NodeJS.Timeout;
    private lastScan: Scannable;
    private db: ScanQuestDB;
    private scan_creature: ScanCreature;
    private scan_locations: ScanLocation;
    private scan_battlegear: ScanBattlegear;
    icons: Icons;
    bot: Client;
    logger: Logger;

    constructor() {
        this.db = new ScanQuestDB();
        this.channel = (process.env.NODE_ENV != "development") ? config.default_channel : config.test_channel;
    }

    // Singleton
    static getInstance(): ScanQuest {
        if (!ScanQuest.instance) ScanQuest.instance = new ScanQuest();
        return ScanQuest.instance;
    }

    init(bot: Client, logger: Logger): ScanQuest {
        this.bot = bot;
        this.logger = logger;
        return this;
    }

    start() {
        // Check to see if database has been initialized
        if (!API.data) {
            // Try again in a second
            this.timeout = setTimeout(() => {this.start()}, 1000);
            return;
        }
        if (API.data === "local") {
            this.logger.info("ScanQuest has failed to start. Database is down");
            return;
        }

        // Initialize components
        this.icons = new Icons(this.bot);
        this.scan_creature = new ScanCreature();
        this.scan_locations = new ScanLocation();
        this.scan_battlegear = new ScanBattlegear();

        this.logger.info("ScanQuest has started on channel <#" + this.channel + ">");
        this.randomTime(.01, .03);
    }

    stop() {
        clearTimeout(this.timeout);
    }

    monitor(message: Message) {
        if (message.author.bot) return;

        // TODO only monitor the channels the bot is configured for

        if (message.channel.id === this.channel || message.channel instanceof DMChannel) {
            // Prevents sending an empty message
            const send: SendFunction = (msg, options) => {
                if (msg) return message.channel.send(msg, options)
                    .catch(error => this.logger.error(error.stack));
                return Promise.resolve();
            }

            let result: string | undefined;

            if (message.content.charAt(1) === "!") {
                result = message.content.substring(2);
            }
            else if (message.content.charAt(0) === "!") {
                result = message.content.substring(1);
            }
            
            if (result !== undefined) {
                let cmd = result.split(" ")[0].toLowerCase();

                /* Scan */
                switch (cmd) {
                    case 'scan':
                        if (this.bot !== undefined) {
                            this.scan(message.member, send);
                        }
                        return;
                    case 'list':
                        if (this.bot !== undefined) {
                            this.list(message.member, send);
                        }
                        return;
                }

                // TODO decrease timer countdown with activity
            }

        }

    }

    private async scan(player: GuildMember, send: SendFunction): Promise<void> {
        const lastScan = this.lastScan;
        if (!lastScan) {
            return send("There is no scannable card");
        }

        if (await this.db.save(player.id, lastScan.card)) {
            return send(lastScan.getCard(this.icons));
        }

        return send("You've already scanned this " + lastScan.card.name);
    }

    private async list(player: GuildMember, send: SendFunction): Promise<void> {
        return send(await this.db.list(player.id));
    }

    /**
     * Takes a min and max number in minutes and 
     * sets the next iterval to send a creature
     */
    private randomTime(min: number, max: number): void {
        const interval = Math.floor(((Math.random() * (max - min)) + min) * 60) * 1000;
        this.timeout = setTimeout(() => {this.sendCard()}, interval);
    }

    /**
     * Sends a card image to the configed channel
     */
    private sendCard() {
        let image: RichEmbed;

        // Creatures spawn more often than locations and battlegear
        let rnd = Math.floor(Math.random() * 20);
        if (rnd < 4) {
            [this.lastScan, image] = this.scan_locations.generate();
        }
        else if (rnd < 5) {
            [this.lastScan, image] = this.scan_battlegear.generate();
        }
        else {
            [this.lastScan, image] = this.scan_creature.generate();
        }
    
        (this.bot.channels.get(this.channel) as Channel).send(image);

        this.randomTime(30, 300);
    }


}

export default ScanQuest.getInstance();
