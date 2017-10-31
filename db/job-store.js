const db = require('./db');
const mapValues = require('lodash/fp/mapValues');
const { ObjectID } = require('mongodb');
const pick = require('lodash/fp/pick');

module.exports = mapValues((f) => db.bindCollection('jobs', f), {
  createJob,
  createIndexes,
  tryGetAndRemoveJob,
  tryAddActionToJob,
});

/////////////////////////////////////////////////////////////

async function createIndexes(collection) {
  return collection.createIndex('createdAt', { expireAfterSeconds: 60 * 60 });
}

async function createJob(deviceId, collection) {
  const { insertedId } = await collection.insertOne({
    action: undefined,
    deviceId,
    createdAt: new Date(),
  });

  return insertedId.toHexString();
}

async function tryAddActionToJob(jobId, action, collection) {
  const res = await collection.findOneAndUpdate(
    { _id: ObjectID.createFromHexString(jobId), action: { $eq: null } },
    { $set: { action } }
  );

  return !!res.ok;
}

async function tryGetAndRemoveJob(jobId, collection) {
  const res = await collection.findOneAndDelete({ _id: ObjectID.createFromHexString(jobId) });
  return (res.ok && res.value && pick(['action'], res.value)) || null;
}
