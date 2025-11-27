import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDrtH99Oc0niicAXjOyv0tzhPTaYjXTj0s",
  authDomain: "muzze-app.firebaseapp.com",
  projectId: "muzze-app",
  storageBucket: "muzze-app.firebasestorage.app",
  messagingSenderId: "594867527436",
  appId: "1:594867527436:web:cd65bb860f8c3239217329",
  measurementId: "G-18WHQFYPWV"
};

const VAPID_KEY = "BGpB5yQvMAOuPRaUr3ln39zkdcuCDy-xib-bwAf_b0j4h-EcEWMJm-k97sgcDdPy8Aau6zR_c8cgcTjrafxvqVQ";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Messaging (only in supported browsers)
let messaging: ReturnType<typeof getMessaging> | null = null;

export const initializeMessaging = async () => {
  const supported = await isSupported();
  if (supported) {
    messaging = getMessaging(app);
    return messaging;
  }
  return null;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return 'denied';
  }
  
  return await Notification.requestPermission();
};

export const getFCMToken = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      await initializeMessaging();
    }
    
    if (!messaging) {
      console.log('Messaging not supported');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', registration);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('FCM Token obtained:', token);
      return token;
    } else {
      console.log('No registration token available.');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const setupForegroundMessageHandler = (callback: (payload: any) => void) => {
  if (!messaging) {
    console.log('Messaging not initialized');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

export { messaging };
