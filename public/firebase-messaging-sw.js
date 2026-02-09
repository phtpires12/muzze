// Self-destruct: if this file is running as a standalone SW
// (not imported by Workbox), unregister and reload to let
// the Workbox SW take control.
// v2 - self-destruct enabled
if (self.registration && self.registration.active &&
    self.registration.active.scriptURL.includes('firebase-messaging-sw.js')) {
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      self.registration.unregister().then(() => {
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => client.navigate(client.url));
        });
      })
    );
  });
  self.addEventListener('install', () => self.skipWaiting());
  // Stop here — don't initialize Firebase as standalone SW
} else {
  // Normal Firebase initialization (imported by Workbox)
  importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

  firebase.initializeApp({
    apiKey: "AIzaSyDrtH99Oc0niicAXjOyv0tzhPTaYjXTj0s",
    authDomain: "muzze-app.firebaseapp.com",
    projectId: "muzze-app",
    storageBucket: "muzze-app.firebasestorage.app",
    messagingSenderId: "594867527436",
    appId: "1:594867527436:web:cd65bb860f8c3239217329",
    measurementId: "G-18WHQFYPWV"
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'Muzze';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'muzze-reminder',
      requireInteraction: false,
      data: {
        url: '/'
      }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  });
}
