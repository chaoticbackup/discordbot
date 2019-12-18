import { Client, DMChannel, Message, RichEmbed, Snowflake } from 'discord.js';
import fs from 'fs-extra';
import { Logger } from 'winston';
import Icons from '../common/bot_icons';
import users from '../common/users';
import parseCommand from '../common/parse_command';
import { API } from '../database';
import { Channel, SendFunction } from '../definitions';
import ScanBattlegear from './scanfunction/Battlegear';
import ScanCreature from './scanfunction/Creature';
import ScanLocation from './scanfunction/Location';
import { BattlegearScan, ScannableBattlegear } from './scannable/Battlegear';
import { CreatureScan, ScannableCreature } from './scannable/Creature';
import { LocationScan, ScannableLocation } from './scannable/Location';
import { Scannable } from './scannable/Scannable';
import ScanQuestDB, {list, scan} from './scan_db';

const file = "last_spawn.json";

export default class ScanQuest {
    private db: ScanQuestDB;
    private timeout: NodeJS.Timeout;
    private scan_creature: ScanCreature;
    private scan_locations: ScanLocation;
    private scan_battlegear: ScanBattlegear;
    bot: Client;
    logger: Logger;
    icons: Icons;

    constructor(bot: Client, logger: Logger) {
        this.db = new ScanQuestDB();
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

        // Initialize components
        this.icons = new Icons(this.bot);
        this.scan_creature = new ScanCreature();
        this.scan_locations = new ScanLocation();
        this.scan_battlegear = new ScanBattlegear();

        this.logger.info("ScanQuest has started");

<<<<<<< HEAD
        if (process.env.NODE_ENV === "development") {
            this.randomTime(.01, .3);
        }
        else {
            this.randomTime(120, 240); 
        }
=======
>>>>>>> wip multiscan progress
    }

    stop() {
        // save all data into database
    }

    async monitor(message: Message) {
        if (this.bot === undefined || message.author.bot) return;

        // Prevents sending an empty message
        const send: SendFunction = async (msg, options) => {
            if (msg) return message.channel.send(msg, options)
                .catch(error => this.logger.error(error.stack));
            return Promise.resolve();
        }

        const content = message.content;
        
        if (content.charAt(0) === '!' || content.charAt(1) === '!') {
            const {cmd, args, options} = parseCommand(content);

            /* Scan */
            switch (cmd) {
                case 'scan':
                    if (message.guild) {
                        return send(await scan(this.db, message.guild.id, message.author.id, this.icons));
                    }
                    return;
                case 'list':
                    return list(this.db, message, options);
                case 'load': 
                    if (message.author.id === users("daddy").id) {
                        let id = args[0];
                        let type = args[1];
                        let content = args.splice(1).join(" ");
                        let info = content.substr(content.indexOf(' ') + 1);

                        this.db.save(id, (await this.loadScan({type, info}))!.card);
                    }
                    return;
                default:
                    return;
            }

        }
        else {

            // TODO only monitor the server the bot is configured for

            // TODO decrease timer countdown with activity
            // Assign point value to next spawn, size of messages decrease from point value

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

        return null; // This shouldn't be null unless error in json
    }

    /**
     * Sends a card image to the configed channel
     */
    private sendCard() {
        let lastScan: Scannable;
        let image: RichEmbed;

        // Creatures spawn more often than locations and battlegear
        let rnd = Math.floor(Math.random() * 20);
        if (rnd < 4) {
            [lastScan, image] = this.scan_locations.generate();
        }
        else if (rnd < 5) {
            [lastScan, image] = this.scan_battlegear.generate();
        }
        else {
            [lastScan, image] = this.scan_creature.generate();
        }

        (this.bot.channels.get(this.send_channel) as Channel).send(image);

<<<<<<< HEAD
        this.randomTime(300, 400);

=======
>>>>>>> wip multiscan progress
        let lastSpawn = JSON.stringify({
            type: lastScan.card.type,
            info: lastScan.toString()
        });

        fs.writeFile(file, lastSpawn);
    }


}
