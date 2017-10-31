#!/usr/bin/env node

const program = require('commander');
const ora = require('ora');
const { printSubscriptionLinkQrCode, addOtp } = require('../notification-proxy-sdk');
const { setCommonOptions, defaultEnv } = require('./notification-proxy-cli-base');

setCommonOptions(program)
  .parse(process.argv);

if (!program.privateKey || !program.deviceId) {
  throw new Error('not enough arguments provided');
}

(async function main() {
  const env = program.environment || defaultEnv;
  const {
    deviceId,
    privateKey: privateKeyPath,
  } = program;

  const spinner = ora('Adding OTP').start();
  await addOtp({ deviceId, privateKeyPath }, env)
    .then((otp) => {
      spinner.succeed();
      printSubscriptionLinkQrCode(deviceId, otp, env);
    })
    .catch((err) => spinner.fail(`Failed to add OTP${err ? `: ${err}` : ''}`));
}());
