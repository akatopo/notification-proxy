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
  const title = get('data.title', payloadObject);

  event.waitUntil(self.registration.showNotification(title, payloadObject));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { action } = event;
  if (!action) {
    return;
  }
  const { env, jobId } = get('notification.data', event) || {};
  const baseUrl = getBaseUrl(env);
  const url = `${baseUrl}/?jobId=${jobId}&action=${action}`;
  const addedActionToJob = self.fetch(url);
  addedActionToJob
    .then(console.log)
    .catch(console.error);
  event.waitUntil(addedActionToJob);
});

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
