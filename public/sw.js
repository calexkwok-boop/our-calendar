self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Calendar Reminder';
  const options = {
    body: payload.body || 'You have an upcoming calendar event.',
    icon: payload.icon || '/logo192.png',
    badge: payload.badge || '/logo192.png',
    data: payload.data || {},
    tag: payload.tag || undefined,
    renotify: !!payload.renotify,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const matching = allClients.find((client) => client.url.includes(self.location.origin));
    if (matching) {
      await matching.focus();
      try {
        matching.postMessage({ type: 'open-url', url: targetUrl });
      } catch {}
      return;
    }
    await clients.openWindow(targetUrl);
  })());
});
