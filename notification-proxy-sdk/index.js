const isString = require('lodash/fp/isString');
const Promise = require('bluebird');
const cryptoRandomString = require('crypto-random-string');
const lib = require('lib');
const path = require('path');
const crypto2 = Promise.promisifyAll(require('crypto2'));
const prop = require('lodash/fp/prop');
const qrcode = require('qrcode-terminal');
const compose = require('lodash/fp/flowRight');

const defaultEnv = 'release';

module.exports = {
  addOtp,
  getBaseUrl,
  pushNotification,
  closeJob,
  printSubscriptionLinkQrCode,
};

/////////////////////////////////////////////////////////////

async function addOtp({ deviceId, otp, privateKeyPath }, env = defaultEnv) {
  if (!isString(otp)) {
    otp = cryptoRandomString(10);
  }

  const privateKey = await crypto2.readPrivateKeyAsync(
    path.resolve(privateKeyPath)
  );

  const signature = await crypto2.signAsync(otp, privateKey);
  return lib.akatopo['notification-proxy'][`@${env}`]
    .add_otp({
      deviceId,
      otp,
      signature,
    })
    .then(handleFailedRes)
    .then(() => otp);
}

async function pushNotification({ deviceId, payload, privateKeyPath }, env = defaultEnv) {
  const privateKey = await crypto2.readPrivateKeyAsync(
    path.resolve(process.cwd(), privateKeyPath)
  );
  const signature = await crypto2.signAsync(payload, privateKey);

  return lib.akatopo['notification-proxy'][`@${env}`]
    .push_notification({
      deviceId,
      payload,
      signature,
    })
    .then(compose(prop('data.jobId'), handleFailedRes));
}

async function closeJob({ jobId, deviceId, privateKeyPath }, env = defaultEnv) {
  const privateKey = await crypto2.readPrivateKeyAsync(
    path.resolve(process.cwd(), privateKeyPath)
  );
  const signature = await crypto2.signAsync(deviceId, privateKey);

  return lib.akatopo['notification-proxy'][`@${env}`]
    .close_job({
      jobId,
      deviceId,
      signature,
    })
    .then(compose(prop('data.action'), handleFailedRes));
}

function getBaseUrl(env = defaultEnv) {
  const baseUrls = {
    local: 'http://localhost:8170/akatopo/notification-proxy',
    dev: 'https://akatopo.lib.id/notification-proxy@dev',
    release: 'https://akatopo.lib.id/notification-proxy',
  };

  return baseUrls[env];
}

function printSubscriptionLinkQrCode(deviceId, otp, env = defaultEnv) {
  const link = `${getBaseUrl(env)}/?deviceId=${deviceId}&otp=${otp}`;
  qrcode.generate(link);
  console.log(`\n${link}`);
}

function handleFailedRes(res) {
  if (!prop('data.success', res)) {
    throw new Error(prop('data.message', res));
  }
  return res;
}
