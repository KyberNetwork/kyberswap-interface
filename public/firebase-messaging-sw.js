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

self.addEventListener('push', function(event) {
  const parse_payload = payload_obj => {
    return new Promise((resolve, reject) => {
      try {
        if (JSON.parse(payload_obj)) {
          //firebase struct
          const json = JSON.parse(payload_obj)
          resolve(json)
        }
        reject(payload_obj)
      } catch (e) {
        reject(payload_obj)
      }
    })
  }

  parse_payload(event.data.text()).then(notif => {
    const notificationTitle = notif.data.title
    const notificationOptions = {
      body: notif.data.body,
      icon: 'https://s2.coinmarketcap.com/static/img/coins/200x200/9444.png',
      actions: [
        {
          action: 'Discover more',
          title: 'Discover more',
        },
      ],
    }

    event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions))
  })
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
      })
      .then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url == '/discover?tab=trending_soon' && 'focus' in client) return client.focus()
        }
        if (clients.openWindow) return clients.openWindow('/discover?tab=trending_soon')
      }),
  )
})
