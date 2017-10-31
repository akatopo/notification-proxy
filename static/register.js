/* eslint-env browser */

export default {
  pushSupported,
  subscribedToPush,
  registerServiceWorker,
  askNotificationPermission,
  subscribeUserToPush,
};

/////////////////////////////////////////////////////////////

function pushSupported() {
  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return false;
  }
  return true;
}

async function registerServiceWorker() {
  try {
    const registration =
      await navigator.serviceWorker.register('static/service-worker.js');
    return registration;
  }
  catch (err) {
    console.error('Unable to register service worker.', err);
    throw err;
  }
}

async function askNotificationPermission() {
  return new Promise((resolve, reject) => {
    const permissionResult =
      Notification.requestPermission((result) => resolve(result));

    if (permissionResult) {
      permissionResult.then(resolve, reject);
    }
  })
  .then((permissionResult) => {
    if (permissionResult !== 'granted') {
      throw new Error('We weren\'t granted permission.');
    }
  });
}

async function subscribedToPush(serviceWorkerRegistration) {
  const subscription = await serviceWorkerRegistration.pushManager.getSubscription();

  return subscription !== null;
}

async function subscribeUserToPush(vapidPublicKey, serviceWorkerRegistration) {
  const logSub = (s) => {
    console.log('Received PushSubscription: ', JSON.stringify(s));
  };

  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  };

  const subscription = await serviceWorkerRegistration.pushManager.subscribe(subscribeOptions);

  logSub(subscription);

  return subscription;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
