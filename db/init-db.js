#!/usr/bin/env node
const Promise = require('bluebird');
const program = require('commander');
const stores = [
  require('./device-store'),
  require('./job-store'),
  require('./otp-store'),
];
const { close: closeDb } = require('./db');

program
  .version('0.1.0')
  .option('-env --environment <name>', 'environment name (local|dev|release)')
  .parse(process.argv);

const [deviceStore] = stores;
if (!process.env.MONGO_URI) {
  const envVars = require('../env.json')[program.environment];
  Object.keys(envVars).forEach((key) => {
    process.env[key] = envVars[key];
  });
}

const { TRUSTED_PUBLIC_KEYS: trustedPublicKeys } = require('../trusted-public-keys.json');

(async function main() {
  await Promise.all(stores.map((store) => store.createIndexes()));

  await Promise.all(trustedPublicKeys.map(
    (publicKey) => deviceStore.saveDevice(publicKey)
  ));

  await closeDb();
}());
