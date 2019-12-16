import {ScannableBattlegear, BattlegearScan} from './scannable/Battlegear';
import {ScannableLocation, LocationScan} from './scannable/Location';
import loki, { Collection } from 'lokijs';
import path from 'path';
import db_path from '../database/db_path';
import { CreatureScan, ScannableCreature } from './scannable/Creature';
import { Scan } from './scannable/Scannable';
const LokiFSStructuredAdapter = require('lokijs/src/loki-fs-structured-adapter');

class Player {
    public id: string;
    public scans: Scan[];
}

class ScanQuestDB {
    private players: Collection<Player>;
    private db: Loki;

    constructor() {
        this.db = new loki(path.resolve(db_path, 'scanquest.db'), {
            adapter: new LokiFSStructuredAdapter(),
            autoload: true,
            autosave: true,
            autoloadCallback: () => {
                let players = this.db.getCollection("players") as Collection<Player>;
                if (players === null) {
                    this.players = this.db.addCollection("players");
                }
                else {
                    this.players = players;
                }
            }
        });
    }

    list = async (id: string): Promise<string> => {
        let player = this.findOne({id: id});
        if (player.scans.length === 0) {
            return "You have no scans";
        }

        let resp = "";
        player.scans.forEach((scan) => {
            if (scan.type === "Creatures") {
                const result = new ScannableCreature(scan as CreatureScan);
                resp += result.toString() + "\n";
            }
            else if (scan.type === "Locations") {
                const result = new ScannableLocation(scan as LocationScan);
                resp += result.toString() + "\n";
            }
            else if (scan.type === "Battlegear") {
                const result = new ScannableBattlegear(scan as BattlegearScan);
                resp += result.toString() + "\n";
            }
        });

        return Promise.resolve(resp);
    }

    save = async (id: string, card: Scan): Promise<boolean> => {
        const player = this.findOne({id: id});
        if (player.scans.length === 0 || player.scans[0].name !== card.name) {
            player.scans.push(card);
            this.players.update(player);
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }

    private findOne({id}: {id: string}) {
        let player = this.players.findOne({id: id});
        if (player === null) {
            player = this.players.insert({id, scans: []}) as Player & LokiObj;
        }
        return player;
    }

}

export default ScanQuestDB;
