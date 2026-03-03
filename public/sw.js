// Service Worker for דאטה ישראל — Push Notifications
// Plain JS — no TypeScript, no build step required.

// ---------------------------------------------------------------------------
// Lifecycle: ensure new SW versions activate immediately and claim all clients
// ---------------------------------------------------------------------------

self.addEventListener('install', function () {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});

// ---------------------------------------------------------------------------
// Fetch: pass-through (no offline caching). Required by Chrome for PWA install.
// ---------------------------------------------------------------------------

self.addEventListener('fetch', function () {
    // No-op: let the browser handle all fetch requests normally.
    // This handler exists solely to satisfy Chrome's PWA installability requirement.
});

// ---------------------------------------------------------------------------
// Push: show notification (with smart suppression when app is focused)
// ---------------------------------------------------------------------------

self.addEventListener('push', function (event) {
    if (!event.data) {
        return;
    }

    var data;
    try {
        data = event.data.json();
    } catch (e) {
        console.error('[sw] Failed to parse push payload as JSON:', e);
        data = { title: 'דאטה ישראל', body: event.data.text(), threadId: null };
    }

    var title = data.title || 'דאטה ישראל';
    var body = data.body || 'התשובה מוכנה';
    var threadId = data.threadId || null;

    var notificationOptions = {
        body: body,
        badge: '/icon-badge.png',
        vibrate: [100, 50, 100],
        tag: threadId ? 'chat-' + threadId : 'chat-notification',
        data: { threadId: threadId },
        dir: 'rtl',
        lang: 'he',
    };

    // Smart suppression: skip notification if user is actively viewing the app.
    // NOTE: Suppression is disabled during development for easier testing.
    // To re-enable, uncomment the focused-window check below.
    var showNotification = self.registration
        .showNotification(title, notificationOptions)
        .catch(function (err) {
            console.error('[sw] Push handler error:', err);
        });

    /*
    // Production version with smart suppression:
    var showNotification = clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then(function (windowClients) {
            for (var i = 0; i < windowClients.length; i++) {
                if (windowClients[i].focused) {
                    return false;
                }
            }
            return true;
        })
        .then(function (shouldShow) {
            if (!shouldShow) return;
            return self.registration.showNotification(title, notificationOptions);
        })
        .catch(function (err) {
            console.error('[sw] Push handler error, showing fallback notification:', err);
            return self.registration.showNotification(title, notificationOptions);
        });
    */

    event.waitUntil(showNotification);
});

// ---------------------------------------------------------------------------
// Notification click: navigate to the relevant chat thread
// ---------------------------------------------------------------------------

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    var threadId = event.notification.data && event.notification.data.threadId;
    var path = threadId ? '/chat/' + threadId : '/';
    var targetUrl = new URL(path, self.location.origin).href;

    // Try to find and focus an existing app tab, otherwise open a new one.
    // client.navigate() is async and some browsers (Arc) don't support it well,
    // so we chain promises properly and fall back to openWindow.
    var focusOrOpen = clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then(function (windowClients) {
            // Find a same-origin window that's already on our app
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url.indexOf(self.location.origin) === 0) {
                    // navigate() returns a Promise — chain it properly
                    return client.navigate(targetUrl).then(function (navigatedClient) {
                        return navigatedClient ? navigatedClient.focus() : clients.openWindow(targetUrl);
                    });
                }
            }
            return clients.openWindow(targetUrl);
        })
        .catch(function () {
            return clients.openWindow(targetUrl);
        });

    event.waitUntil(focusOrOpen);
});
