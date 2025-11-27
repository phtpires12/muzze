// Firebase configuration - using dynamic imports to avoid TypeScript stack overflow
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

// Use 'any' to avoid complex type inference that causes stack overflow
let firebaseApp: any = null;
let messaging: any = null;
let firebaseMessagingModule: any = null;

// Dynamic Firebase loader
const loadFirebase = async () => {
  if (!firebaseApp) {
    const firebaseAppModule = await import('firebase/app');
    firebaseApp = firebaseAppModule.initializeApp(firebaseConfig);
  }
  return firebaseApp;
};

// Dynamic Messaging loader
const loadMessaging = async () => {
  if (!firebaseMessagingModule) {
    firebaseMessagingModule = await import('firebase/messaging');
  }
  return firebaseMessagingModule;
};

export const initializeMessaging = async () => {
  const messagingModule = await loadMessaging();
  const supported = await messagingModule.isSupported();
  
  if (supported) {
    await loadFirebase();
    messaging = messagingModule.getMessaging(firebaseApp);
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

    const messagingModule = await loadMessaging();

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', registration);

    const token = await messagingModule.getToken(messaging, {
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

export const setupForegroundMessageHandler = async (callback: (payload: any) => void) => {
  if (!messaging) {
    console.log('Messaging not initialized');
    return;
  }

  const messagingModule = await loadMessaging();
  messagingModule.onMessage(messaging, (payload: any) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

export { messaging };
