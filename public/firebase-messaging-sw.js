// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: 'AIzaSyDszHtJ4CJq0mwjBJ1pTt5OOzG5tiooEsg',
  authDomain: 'test-bace2.firebaseapp.com',
  projectId: 'test-bace2',
  storageBucket: 'test-bace2.appspot.com',
  messagingSenderId: '337703820408',
  appId: '1:337703820408:web:2fb16ef71941817dec618d',
}

firebase.initializeApp(firebaseConfig)

// Retrieve firebase messaging
const messaging = firebase.messaging()

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload)

  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})
