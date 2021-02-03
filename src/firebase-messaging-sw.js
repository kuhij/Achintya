importScripts('https://www.gstatic.com/firebasejs/8.2.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.2.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
var config = {
    apiKey: "AAAAXYMWCBU:APA91bF6PB-uKwo3VJmZ-PyvyG0POr1LBg_r3s3EfdUEtQEW_ZxbSiJYwQtFElKCRk_DYJM9Tgv0wJ6Am6n_QLInSzMX6tYVNyBcjpB_3V2c139keZoV-JCWxRU2ojsCqZepLThjt2-P",
    authDomain: "achintya-org.firebaseapp.com",
    databaseURL: "https://achintya-org.firebaseio.com",
    projectId: "achintya-org",
    storageBucket: "achintya-org.appspot.com",
    messagingSenderId: "401631217685",
    appId: "1:401631217685:web:1ed2fc7d9e06ba7b",
};

firebase.initializeApp(config);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = 'Background Message Title';
    const notificationOptions = {
        body: 'Background Message body.',
    };

    self.registration.showNotification(notificationTitle,
        notificationOptions);
});
