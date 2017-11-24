/* eslint-env serviceworker */
/* eslint no-restricted-globals: 0 */

self.addEventListener('push', (event) => {
  let payloadObject;
  try {
    payloadObject = event.data.json();
  }
  catch (_) {
    payloadObject = { data: { title: event.data.text() } };
  }

  const expiresAtMillis = Date.parse(get('data.expiresAt', payloadObject));
  let timeout;
  if (!Number.isNaN(expiresAtMillis)) {
    timeout = expiresAtMillis - Date.now();
    if (timeout <= 0) {
      return;
    }
  }

  const title = get('data.title', payloadObject);
  const notified = showNotification(title, payloadObject)
    .then((notification) => {
      if (timeout !== undefined) {
        setTimeout(notification.close.bind(notification), timeout);
      }
    });

  // maybe wait until timeout executed / canceled
  event.waitUntil(notified);
});

self.addEventListener('notificationclick', (event) => {
  const { action } = event;
  if (!action) {
    return;
  }
  event.notification.close();
  const { env, jobId } = get('notification.data', event) || {};
  const baseUrl = getBaseUrl(env);
  const url = `${baseUrl}/?jobId=${jobId}&action=${action}`;
  const addedActionToJob = self.fetch(url);
  addedActionToJob
    .then(console.log)
    .catch(console.error);
  event.waitUntil(addedActionToJob);
});

function showNotification(title, options) {
  return self.registration.showNotification(title, options)
    .then(() => self.registration.getNotifications({ tag: options.tag })
      .then((notifications) => notifications[notifications.length - 1]));
}

function get(path, object) {
  return path
    .split('.')
    .reduce((prev, cur) => ((prev && prev[cur]) || undefined), object);
}

function getBaseUrl(env) {
  const baseUrls = {
    local: 'http://localhost:8170/akatopo/notification-proxy/job',
    dev: 'https://akatopo.lib.id/notification-proxy@dev/job',
    release: 'https://akatopo.lib.id/notification-proxy/job',
  };

  return baseUrls[env];
}
