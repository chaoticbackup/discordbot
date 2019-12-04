import {SendFunction} from '../definitions.d';
import {RichEmbed, GuildMember} from 'discord.js';
import {Client} from 'discord.js';
import {API, color} from '../database';
import { Creature } from '../definitions';
import servers from '../common/servers';
import Icons from '../common/bot_icons';
import { Logger } from 'winston';

const config = {
    "default_channel": servers("main").channel("bot_commands"),
    "test_channel": servers("develop").channel("bot_commands")
}

type ScannableCreature = {
    name: string;
    card: RichEmbed;
}

class ScanQuest {
    private bot: Client;
    private logger: Logger;
    private channel: string;
    private creatures: Creature[];
    private timeout: NodeJS.Timeout;
    private lastRandom: number = -1;
    private lastCreature: ScannableCreature;
    private players: string[] = [];
    private icons: Icons;
    private static instance: ScanQuest;


    // Singleton
    static getInstance(): ScanQuest {
        if (!ScanQuest.instance) ScanQuest.instance = new ScanQuest();
        return ScanQuest.instance;
    }

    init(bot: Client, logger: Logger): ScanQuest {
        this.bot = bot;
        this.logger = logger;
        this.icons = new Icons(bot);
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
        if (API.data === "local") return;
        const creatures: Creature[] = API.find_cards_by_name("", ["type=creature"]);
        this.creatures = creatures.filter((creature) =>
            creature.gsx$avatar && creature.gsx$avatar !== ""
        );
        this.randomTime(10, 30);

        this.logger.info("ScanQuest has started on channel <#" + this.channel + ">");
    }

    stop() {
        clearTimeout(this.timeout);
    }

    scan(player: GuildMember, send: SendFunction): Promise<void> {
        const creature = this.lastCreature;
        if (!creature) {
            return send("There's no scannable Creature");
        }
        if (this.players.includes(player.id)) {
            return send("You've already scanned " + creature.name);
        }
        this.players.push(player.id);
        return send(creature.card);
    }

    /**
     * Takes a min and max number in minutes and 
     * sets the next iterval to send a creature
     */
    private randomTime(min: number, max: number): void {
        const interval = Math.floor(((Math.random() * (max - min)) + min) * 60) * 1000;
        this.timeout = setTimeout(() => {this.sendCreature()}, interval);
    }

    /**
     * Returns a creature from the list of creatures with avatars
     */
    private randomCreature(): Creature {
        let rnd;
        do {
            rnd = Math.floor(Math.random() * this.creatures.length);
        } while (rnd === this.lastRandom);
        this.lastRandom = rnd;
        return this.creatures[rnd];
    }

    /**
     * Sends a creature's avatar (image) to the configed channel
     */
    private sendCreature() {
        const creature = this.randomCreature();
        this.createCreature(creature);

        const message = new RichEmbed()
            .setImage(API.base_image + creature.gsx$avatar);

        // @ts-ignore bot will always be defined
        this.bot.channels.get(this.channel).send(message);

        this.randomTime(30, 300);
    }

    private randomStat(stat: string | number, range: number): string {
        if (typeof stat == 'string') stat = parseInt(stat);
        const rnd = Math.floor(Math.random() * (range / 5 + 1));
        return (stat - (range / 2) + 5 * rnd).toString();
    }

    private createCreature(creature: Creature) {
        const {disciplines} = this.icons;
        const body
            = this.randomStat(creature.gsx$courage, 20) + disciplines("Courage") + " "
            + this.randomStat(creature.gsx$power, 20) + disciplines("Power") + " "
            + this.randomStat(creature.gsx$wisdom, 20) + disciplines("Wisdom") + " "
            + this.randomStat(creature.gsx$speed, 20) + disciplines("Speed") + " "
            + "| " + this.randomStat(creature.gsx$energy, 10) + "\u00A0E";

        const message = new RichEmbed()
            .setTitle(creature.gsx$name)
            .setColor(color(creature))
            .setDescription(body)
            .setURL(API.base_image + creature.gsx$image)
            .setImage(API.base_image + creature.gsx$image);

        this.lastCreature = {
            name: creature.gsx$name,
            card: message
        }

        this.players = [];
    }
}

export default ScanQuest.getInstance();
