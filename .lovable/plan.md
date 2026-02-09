

# Fix: Service Worker Conflict Causing Stale Versions

## Root Cause

Two service workers fight for control of the same scope (`/`):

1. Workbox SW (`/sw.js`) - handles all PWA caching and updates
2. Firebase Messaging SW (`/firebase-messaging-sw.js`) - registered separately by `getFCMToken()`

When `getFCMToken()` calls `navigator.serviceWorker.register('/firebase-messaging-sw.js')`, it **replaces** the Workbox SW. After that, all update logic stops — users get stuck on old cached versions permanently.

The Workbox config also imports firebase-messaging-sw.js via `importScripts`, creating a double conflict where the same firebase code runs in both SWs, with conflicting `install`/`activate` lifecycle handlers.

## Solution

Consolidate into a **single service worker** (the Workbox-generated one). Firebase messaging will run inside it via `importScripts`, but without conflicting lifecycle handlers.

## Changes

### 1. `public/firebase-messaging-sw.js`

Remove the `install` and `activate` event listeners (lines 4-11). These conflict with Workbox's own lifecycle management. Keep only the Firebase initialization and message handling code.

Before:
```js
self.addEventListener('install', (event) => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(clients.claim()); });
importScripts(...)
```

After:
```js
// No install/activate listeners — Workbox handles lifecycle
importScripts(...)
```

### 2. `src/lib/firebase.ts`

In `getFCMToken()`, stop registering a separate SW. Instead, use the **existing** Workbox SW registration (which already has firebase messaging loaded via `importScripts`).

Before:
```typescript
const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
```

After:
```typescript
const registration = await navigator.serviceWorker.ready;
```

This waits for the already-active Workbox SW (which includes the firebase messaging code) instead of registering a competing SW.

### 3. `src/hooks/usePWAUpdate.ts`

Add a safety mechanism: on first load, check if any rogue SWs exist at non-Workbox URLs and unregister them. This cleans up the editor's (and any other user's) browser that already has the conflicting firebase SW installed.

```typescript
// On mount: unregister any competing service workers
useEffect(() => {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const reg of registrations) {
      if (reg.active?.scriptURL?.includes('firebase-messaging-sw.js')) {
        console.log('[PWA] Removing competing firebase SW');
        reg.unregister();
      }
    }
  });
}, []);
```

## Why This Fixes It

- Only ONE SW controls the app (Workbox-generated `sw.js`)
- Firebase messaging still works because the Workbox SW imports the firebase code
- The 30-second update checks and auto-update logic remain intact
- Existing users with the rogue firebase SW get it cleaned up automatically
- No lifecycle conflicts between install/activate handlers

## Files Modified

| File | Change |
|------|--------|
| `public/firebase-messaging-sw.js` | Remove conflicting install/activate listeners |
| `src/lib/firebase.ts` | Use existing SW via `navigator.serviceWorker.ready` instead of registering a new one |
| `src/hooks/usePWAUpdate.ts` | Add cleanup of rogue competing SWs on mount |

