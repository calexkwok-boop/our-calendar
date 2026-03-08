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

const formatNotificationContent = (payload) => {
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : {};
  const notification = payload?.notification && typeof payload.notification === 'object' ? payload.notification : {};
  const firstText = (...values) => {
    for (const value of values) {
      const text = String(value || '').trim();
      if (text) return text;
    }
    return '';
  };
  const type = String(data?.type || notification?.type || 'update').trim().toLowerCase();
  const genericTitles = new Set([
    'calendar update',
    'notification from our calendar',
    'our calendar notification',
    'our calendar',
  ]);
  const titleByType = {
    invite: 'Calendar Invite',
    event: 'Calendar Update',
    list: 'List Update',
    photo: 'Trip Photo',
    expense: 'Expense Update',
    reminder: 'Event Reminder',
    update: 'Calendar Update',
  };

  const rawTitle = firstText(notification?.title, data?.title);
  const title = !rawTitle || genericTitles.has(rawTitle.toLowerCase())
    ? (titleByType[type] || 'Calendar Update')
    : rawTitle;

  let body = firstText(notification?.body, data?.body, data?.message, data?.summary, data?.text);
  if (!body) {
    const actor = firstText(data?.actor, data?.actorName, data?.createdBy);
    const action = firstText(data?.action, 'updated');
    const subject = firstText(data?.eventTitle, data?.itemTitle, data?.subject, data?.calendarName);
    if (actor && subject) body = `${actor} ${action} "${subject}".`;
    else if (subject) body = `Update: "${subject}".`;
  }
  if (!body) body = 'Open Our Calendar to see what changed.';

  return {
    title,
    body,
    tag: String(data?.tag || `calendar-${type || 'update'}`),
    data,
  };
};

const showFromPayload = async (rawPayload) => {
  const payload = normalizePayload(rawPayload);
  const formatted = formatNotificationContent(payload);
  await self.registration.showNotification(formatted.title, {
    body: formatted.body,
    tag: formatted.tag,
    data: formatted.data,
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
