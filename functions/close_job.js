const Promise = require('bluebird');
const crypto2 = Promise.promisifyAll(require('crypto2'));
const { tryGetDevice } = require('../db/device-store');
const { tryGetAndRemoveJob } = require('../db/job-store');

/**
* Closes a job tied to a device. The device id needs to be signed.
* @param {string} jobId job id
* @param {string} deviceId device id
* @param {string} signature signature of the deviceId
* @returns {object}
*/
module.exports = async (jobId, deviceId, signature/* , context */) => {
  const device = await tryGetDevice(deviceId);
  if (!device) {
    throw new Error('Device not found');
  }

  const verified = await crypto2.verifyAsync(deviceId, device.publicKey, signature);
  if (!verified) {
    throw new Error('Invalid signature ');
  }

  const res = await tryGetAndRemoveJob(jobId);
  if (!res) {
    throw new Error('Invalid job id');
  }
  return { data: { success: true, message: 'job remove', action: res.action } };
};
