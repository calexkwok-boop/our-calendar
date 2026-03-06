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


const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Calendar Update';
  const options = {
    body: payload?.notification?.body || '',
    data: payload?.data || {},
  };
  self.registration.showNotification(title, options);
});
