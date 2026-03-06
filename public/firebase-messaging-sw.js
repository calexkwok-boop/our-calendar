/* global importScripts, firebase */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAzQ0jVpurMyxCsDZF8uLGQrGJEQFnyRFE",
  authDomain: "syncly-5e3f3.firebaseapp.com",
  projectId: "syncly-5e3f3",
  storageBucket: "syncly-5e3f3.firebasestorage.app",
  messagingSenderId: "785381918482",
  appId: "1:785381918482:web:ac9b089b2590a409cbd5cb",
});


firebase.messaging();

const broadcastToClients = async (type, payload) => {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach((client) => {
    client.postMessage({ source: 'firebase-messaging-sw', type, payload });
  });
};

const normalizePayload = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return { notification: { body: raw } };
    }
  }
  return raw;
};

const showFromPayload = async (rawPayload) => {
  const payload = normalizePayload(rawPayload);
  const notification = payload?.notification || {};
  const data = payload?.data || {};
  const title = notification.title || data.title || 'Calendar Update';
  const body = notification.body || data.body || '';
  const tag = data.tag || 'calendar-update';
  await self.registration.showNotification(title, {
    body,
    tag,
    data,
  });
};

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    try {
      const rawText = event?.data ? await event.data.text() : '';
      await broadcastToClients('push-received', { rawText });
      await showFromPayload(rawText);
      await broadcastToClients('notification-shown', {});
    } catch (err) {
      await self.registration.showNotification('Calendar Update', {
        body: 'You have a new update.',
        tag: 'calendar-update-fallback',
        data: {},
      });
      await broadcastToClients('push-error', { message: String(err?.message || err) });
      console.error('SW push handler failed:', err);
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event?.notification?.data?.url || '/';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((w) => w.url.includes(self.location.origin));
    if (existing) {
      existing.focus();
      return;
    }
    await self.clients.openWindow(targetUrl);
  })());
});
