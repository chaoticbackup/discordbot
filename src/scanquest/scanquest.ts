import { Client, DMChannel, Message, RichEmbed } from 'discord.js';
import fs from 'fs-extra';
import { Logger } from 'winston';
import Icons from '../common/bot_icons';
import servers from '../common/servers';
import { API } from '../database';
import { Channel, SendFunction } from '../definitions';
import ScanBattlegear from './scanfunction/Battlegear';
import ScanCreature from './scanfunction/Creature';
import ScanLocation from './scanfunction/Location';
import { BattlegearScan, ScannableBattlegear } from './scannable/Battlegear';
import { CreatureScan, ScannableCreature } from './scannable/Creature';
import { LocationScan, ScannableLocation } from './scannable/Location';
import { Scannable } from './scannable/Scannable';
import ScanQuestDB from './scan_db';
import users from '../common/users';

const config = {
    "send_channel": servers("main").channel("perim"),
    "recieve_channel": servers("main").channel("bot_commands"),
    "test_channel": servers("develop").channel("bot_commands")
}

const file = "last_spawn.json";

export default class ScanQuest {
    private db: ScanQuestDB;
    private send_channel: string;
    private recieve_channel: string;
    private timeout: NodeJS.Timeout;
    private scan_creature: ScanCreature;
    private scan_locations: ScanLocation;
    private scan_battlegear: ScanBattlegear;
    private lastScan: Scannable | null;
    bot: Client;
    logger: Logger;
    icons: Icons;

    constructor(bot: Client, logger: Logger) {
        this.db = new ScanQuestDB();
        this.send_channel = (process.env.NODE_ENV != "development") ? config.send_channel : config.test_channel;
        this.recieve_channel = (process.env.NODE_ENV != "development") ? config.recieve_channel : config.test_channel;
        this.bot = bot;
        this.logger = logger;
    }

    start() {
        // Check to see if database has been initialized
        if (!API.data) {
            // Try again in a second
            this.timeout = setTimeout(() => {this.start()}, 1000);
            return;
        }
        if (API.data === "local") {
            this.logger.info("ScanQuest cannot start. Database is down");
            return;
        }

        // load previous card spawn
        if (fs.existsSync(file)) {
            fs.readFile(file, async (err, data) => {
                if (!err) {
                    this.lastScan = await this.loadScan(JSON.parse(data.toString()));
                }
            });
        }

        // Initialize components
        this.icons = new Icons(this.bot);
        this.scan_creature = new ScanCreature();
        this.scan_locations = new ScanLocation();
        this.scan_battlegear = new ScanBattlegear();

        this.logger.info("ScanQuest has started on channel <#" + this.send_channel + ">");

        if (process.env.NODE_ENV === "development") {
            this.randomTime(.01, .3);
        }
        else {
            this.randomTime(120, 240); 
        }
    }

    stop() {
        clearTimeout(this.timeout);
        // save all data into database
    }

    async monitor(message: Message) {
        if (this.bot === undefined || message.author.bot) return;

        // TODO only monitor the server the bot is configured for

        // TODO decrease timer countdown with activity
        // Assign point value to next spawn, size of messages decrease from point value

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
                    if (message.channel.id === this.recieve_channel) {
                        this.scan(message.author.id, send);
                    }
                    return;
                case 'list':
                    if (message.channel.id === this.recieve_channel || message.channel instanceof DMChannel) {
                        return send(await this.db.list(message));
                    }
                    return;
                case 'load': 
                    if (message.author.id === users("daddy").id) {
                        let args: string[] = result.split(" ").splice(1);
                        let id = args[0];
                        let type = args[1];
                        let content = args.splice(1).join(" ");
                        let info = content.substr(content.indexOf(' ') + 1);

                        this.db.save(id, (await this.loadScan({type, info}))!.card);
                    }
            }

        }

    }

    private async loadScan(lastSpawn: {type: string, info: any}): Promise<Scannable | null> {
        if (lastSpawn.type === "Creatures") {
            let crScan = new CreatureScan();
            [
                crScan.name, crScan.courage, crScan.power, 
                crScan.wisdom, crScan.speed, crScan.energy
            ] = lastSpawn.info.split(/ (?=[0-9]+)/);
            return new ScannableCreature(crScan);
        }
        else if (lastSpawn.type === "Battlegear") {
            let bgScan = new BattlegearScan();
            bgScan.name = lastSpawn.info;
            return new ScannableBattlegear(bgScan);
        }
        else if (lastSpawn.type === "Locations") {
            let locScan = new LocationScan();
            locScan.name = lastSpawn.info;
            return new ScannableLocation(locScan);
        }

        return null; // This shouldn't be null unless error in json file
    }

    private async scan(id: string, send: SendFunction): Promise<void> {
        const lastScan = this.lastScan;
        if (!lastScan) {
            return send("There is no scannable card");
        }

        if (await this.db.save(id, lastScan.card)) {
            return send(lastScan.getCard(this.icons));
        }

        return send("You've already scanned this " + lastScan.card.name);
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

        (this.bot.channels.get(this.send_channel) as Channel).send(image);

        this.randomTime(300, 400);

        let lastSpawn = JSON.stringify({
            type: this.lastScan.card.type,
            info: this.lastScan.toString()
        });

        fs.writeFile(file, lastSpawn);
    }


}
