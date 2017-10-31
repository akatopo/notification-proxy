const db = require('./db');
const Promise = require('bluebird');
const mapValues = require('lodash/fp/mapValues');
const { ObjectID } = require('mongodb');

module.exports = mapValues((f) => db.bindCollection('devices', f), {
  saveDevice,
  createIndexes,
  tryGetDevice,
  addSubscriptionToDevice,
  removeSubscriptionsFromDevice,
});

/////////////////////////////////////////////////////////////

async function createIndexes(collection) {
  return Promise.all([
    collection.createIndex('publicKey', { unique: true }),
    collection.createIndex('subscriptions.endpoint'),
  ]);
}

async function saveDevice(publicKey, collection) {
  return collection.insert({
    publicKey,
    subscriptions: [],
  });
}

async function addSubscriptionToDevice(id, subscription, collection) {
  return collection.updateOne(
    { _id: ObjectID.createFromHexString(id) },
    { $addToSet: { subscriptions: subscription } },
  );
}

async function removeSubscriptionsFromDevice(id, subscriptionsToRemove, collection) {
  return collection.updateOne(
    { _id: ObjectID.createFromHexString(id) },
    { $pull: { subscriptions: { $in: subscriptionsToRemove } } }
  );
}

async function tryGetDevice(id, collection) {
  const found = await collection.findOne({ _id: ObjectID.createFromHexString(id) });
  return found;
}
