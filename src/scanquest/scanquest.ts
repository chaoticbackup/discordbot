import { Client, GuildMember, RichEmbed } from 'discord.js';
import { Logger } from 'winston';
import Icons from '../common/bot_icons';
import servers from '../common/servers';
import { API } from '../database';
import { Channel, SendFunction } from '../definitions';
import ScanCreature from './scanfunction/Creature';
import { Scannable } from './scannable/Scannable';
import ScanQuestDB from './scan_db';

const config = {
    "default_channel": servers("main").channel("bot_commands"),
    "test_channel": servers("develop").channel("bot_commands")
}

class ScanQuest {
    private static instance: ScanQuest;

    private bot: Client;
    private logger: Logger;
    private channel: string;
    private timeout: NodeJS.Timeout;
    private lastScan: Scannable;
    private db: ScanQuestDB;
    private scan_creature: ScanCreature;
    icons: Icons;

    constructor() {
        this.db = new ScanQuestDB();
    }

    // Singleton
    static getInstance(): ScanQuest {
        if (!ScanQuest.instance) ScanQuest.instance = new ScanQuest();
        return ScanQuest.instance;
    }

    init(bot: Client, logger: Logger): ScanQuest {
        this.bot = bot;
        this.logger = logger;
        this.channel = (process.env.NODE_ENV != "development") ? config.default_channel : config.test_channel;
        return this;
    }

    enabled(): boolean {
        return this.bot === undefined;
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

        this.logger.info("ScanQuest has started on channel <#" + this.channel + ">");
        this.randomTime(10, 30);
    }

    stop() {
        clearTimeout(this.timeout);
    }

    async scan(player: GuildMember, send: SendFunction): Promise<void> {
        const lastScan = this.lastScan;
        if (!lastScan) {
            return send("There is no scannable card");
        }

        if (await this.db.save(player.id, lastScan.card)) {
            return send(lastScan.getCard(this.icons));
        }

        return send("You've already scanned this " + lastScan.card.name);
    }

    async list(player: GuildMember, send: SendFunction): Promise<void> {
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

        // Only doing creatures for now
        [this.lastScan, image] = this.scan_creature.generate();

        (this.bot.channels.get(this.channel) as Channel).send(image);

        this.randomTime(30, 300);
    }


}

export default ScanQuest.getInstance();
