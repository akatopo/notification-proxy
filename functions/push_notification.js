const webpush = require('web-push');
const Promise = require('bluebird');
const crypto2 = Promise.promisifyAll(require('crypto2'));
const { tryGetDevice, removeSubscriptionsFromDevice } = require('../db/device-store');
const { createJob } = require('../db/job-store');
const pickBy = require('lodash/fp/pickBy');
const set = require('lodash/fp/set');
const prop = require('lodash/fp/prop');

const subscriptionGoneStatusCode = 410;

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  'mailto:4640e8d1@opayq.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

/**
* Pushes a notification to a device's subscribers. The notification payload needs to be signed.
* The notification payload has to be parsable as the options object expected by
* `ServiceWorkerRegistration.showNotification(title, [options])`. Additionally the `data` property
* must be an object with the `title` as an optional field. The job id (`jobId`) and the
* environment (`env`) are going to be added to `data` once the notification
* is pushed to the subscribers. Further, the job id will be added only if the `actions` property
* is a populated array and the resulting job will be available for an hour or until it's closed.
* @param {string} deviceId device id
* @param {string} payload notification payload (JSON string) compatible with a
*   ServiceWorkerRegistration.showNotification() options object
*   (https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification)
* @param {string} signature signature of the notification payload
* @returns {object}
*/
module.exports = async (deviceId, payload, signature, context) =>
  tryGetDevice(deviceId)
    .then(checkHasDevice)
    .then(async (device) => {
      let jobId;
      const verified = await crypto2.verifyAsync(payload, device.publicKey, signature);
      if (!verified) {
        throw new Error('Invalid signature ');
      }

      let payloadObject = JSON.parse(payload);
      if (prop('actions.length', payloadObject) > 0) {
        jobId = await createJob(deviceId);
        payloadObject = set(
          'data.jobId', jobId,
          set('data.env', context.service.environment, payloadObject)
        );
        payload = JSON.stringify(payloadObject);
      }
      const pushPayload = push.bind(undefined, payload);
      const results = await Promise.all(device.subscriptions.map(pushPayload));
      const subsToRemove = device.subscriptions
        .filter((sub, index) => results[index] === subscriptionGoneStatusCode);
      if (subsToRemove.length) {
        await removeSubscriptionsFromDevice(deviceId, subsToRemove);
      }
      return { data: { success: true, message: 'notification pushed', jobId } };
    })
    .catch(() => new Error('Error when looking for device'));

function checkHasDevice(device) {
  if (!device) {
    throw new Error('Device not found');
  }
  return device;
}

async function push(payload, subscription) {
  return webpush.sendNotification(pickBy((value, key) => key !== '_id', subscription), payload)
    .catch((err) => err.statusCode);
}
