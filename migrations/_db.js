const { MongoClient } = require("mongodb");

const auth = require('../src/auth.json');

/**
 * @param {(db: import("mongodb").Db) => Promise<void>} execute
 */
async function run_migration (execute) {
  if (!auth || !auth.db_uri) return await Promise.reject("Missing config");
  
  const client = new MongoClient(auth.db_uri);

  let db;

  try {
    await client.connect();
    await client.db('scanquest').command({ ping: 1 });
    db = client.db("scanquest");
  } catch (e) {
    console.error("Unable to connect to database")
    return await Promise.reject(e);
  }

  await execute(db);

  client.close();

  return Promise.resolve();
}

module.exports = run_migration;
