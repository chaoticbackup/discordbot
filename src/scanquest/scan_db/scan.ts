import { RichEmbed, Snowflake } from 'discord.js';
import Icons from '../../common/bot_icons';
import ScanQuestDB from './scan_db';

export default async (db: ScanQuestDB, server_id: Snowflake, id: Snowflake, icons: Icons): 
Promise<RichEmbed | string | undefined> => {
    let server = db.servers.findOne({id: server_id});
    if (server === null) return;

    if (server.lastScan === null) {
        return "There is no scannable card";
    }

    const player = db.findOnePlayer({id: id});

    // (db.usedcodes.find({code: {'$eq': code}}))

    if ((await db.save(id, server.lastScan.card)) !== null) {
        return server.lastScan.getCard(icons);
    }

    return "You've already scanned this " + server.lastScan.card.name;
}
