const { MongoClient } = require('mongodb');
const Promise = require('bluebird');

module.exports = {
  collection,
  bindCollection,
  close,
};

/////////////////////////////////////////////////////////////

let db;

async function getDb() {
  const mongoUri = process.env.MONGO_URI;

  return MongoClient.connect(
    mongoUri,
    { promiseLibrary: Promise },
  );
}

async function collection(name) {
  db = db || await getDb();

  return db.collection(name);
}

async function close() {
  if (!db) {
    throw new Error('no active DB connection');
  }

  return db.close();
}

function bindCollection(name, func) {
  return async (...args) => {
    args.push(await collection(name));

    return func(...args);
  };
}

process.on('SIGINT', async () => {
  if (db) {
    await db.close();
    console.log('closing db connection');
    process.exit(0);
  }
});
