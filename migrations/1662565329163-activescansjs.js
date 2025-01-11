'use strict'
const run = require('./_db');

module.exports.up = () => {
  run(async (db) => {
    const server_db = db.collection("servers");
    const scan_db = db.collection("scans");

    try {
      const servers = await server_db.find({}).toArray();
      for (const server of servers) {
        if (server == null) continue;
  
        const results = await scan_db.insertMany(server.activescans);
        await server_db.updateOne(
          { _id: server._id }, 
          {
            $set : { activescan_ids: Object.values(results.insertedIds) }
          }
        );
        await server_db.updateMany({}, { $unset: { "activescans": 1 }})
      }
    } catch (e) {
      console.error(e);
    }
  });
}

module.exports.down = () => {}
