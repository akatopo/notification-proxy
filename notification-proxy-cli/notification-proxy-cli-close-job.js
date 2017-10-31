#!/usr/bin/env node

const program = require('commander');
const ora = require('ora');
const { setCommonOptions, defaultEnv } = require('./notification-proxy-cli-base');
const { closeJob } = require('../notification-proxy-sdk');

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
  const [jobId] = program.args;

  const spinner = ora('Closing job').start();
  await closeJob({ jobId, deviceId, privateKeyPath }, env)
    .then((action) => {
      spinner.succeed(`Job closed: ${JSON.stringify(action)}`);
    })
    .catch((err) => spinner.fail(`Failed to close job: ${err}`));
}());
