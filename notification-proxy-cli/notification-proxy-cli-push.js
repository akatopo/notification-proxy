#!/usr/bin/env node

const program = require('commander');
const ora = require('ora');
const { setCommonOptions, defaultEnv } = require('./notification-proxy-cli-base');
const { pushNotification } = require('../notification-proxy-sdk');

setCommonOptions(program)
  .parse(process.argv);

if (
  !program.privateKey ||
  !program.deviceId ||
  !program.args[0]
) {
  throw new Error('not enough arguments provided');
}

(async function main() {
  const env = program.environment || defaultEnv;
  const {
    deviceId,
    privateKey: privateKeyPath,
  } = program;
  const [payload] = program.args;

  const spinner = ora('Pushing notification').start();

  await pushNotification({ deviceId, payload, privateKeyPath }, env)
    .then((jobId) => {
      spinner.succeed(`Notification pushed${jobId ? `, jobId is ${jobId}` : ''}`);
    })
    .catch((err) => spinner.fail(`Failed to push: ${err}`));
}());
