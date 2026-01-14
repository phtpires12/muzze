// Firebase Cloud Messaging Service Worker
// This file handles background notifications when the app is not in focus

// Force immediate activation for faster updates
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
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

// Handle background messages
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

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
