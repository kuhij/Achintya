importScripts('https://www.gstatic.com/firebasejs/7.24.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/7.24.0/firebase-messaging.js')
firebase.initializeApp({
  apiKey: "AIzaSyBmZ-AXOJ0uW6thGCPjtDLLWR2XPh8lcUU",
  authDomain: "achintya-org.firebaseapp.com",
  databaseURL: "https://achintya-org.firebaseio.com/",
  projectId: "achintya-org",
  storageBucket: "achintya-org.appspot.com",
  messagingSenderId: "401631217685",
  appId: "1:401631217685:web:1ed2fc7d9e06ba7b"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  console.log('status ', payload)
  const notificationTitle = 'Notification';
  const content = payload.data.status
  const notificationOptions = {
    body: payload.data.status,
    icon: '/favicon.png'
  };

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});