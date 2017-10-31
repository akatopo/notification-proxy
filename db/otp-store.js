const db = require('./db');
const mapValues = require('lodash/fp/mapValues');

module.exports = mapValues((f) => db.bindCollection('otps', f), {
  saveOtp,
  createIndexes,
  tryRemoveOtp,
});

/////////////////////////////////////////////////////////////

async function createIndexes(collection) {
  return Promise.all([
    collection.createIndex({ otpHash: 1, deviceId: 1 }, { unique: true }),
    collection.createIndex('createdAt', { expireAfterSeconds: 10 * 60 }),
  ]);
}

async function saveOtp(deviceId, otpHash, collection) {
  return collection.insert({
    deviceId,
    otpHash,
    createdAt: new Date(),
  });
}

async function tryRemoveOtp(deviceId, otpHash, collection) {
  const res = await collection.findOneAndDelete({ deviceId, otpHash });
  return !!res.ok;
}
