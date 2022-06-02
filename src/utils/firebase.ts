import firebase from 'firebase/compat/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'AIzaSyDszHtJ4CJq0mwjBJ1pTt5OOzG5tiooEsg',
  authDomain: 'test-bace2.firebaseapp.com',
  projectId: 'test-bace2',
  storageBucket: 'test-bace2.appspot.com',
  messagingSenderId: '337703820408',
  appId: '1:337703820408:web:2fb16ef71941817dec618d',
}
const firebaseApp = firebase.initializeApp(firebaseConfig)
const messaging = getMessaging(firebaseApp)

export const fetchToken = () => {
  return getToken(messaging, {
    vapidKey: 'BCH2laZcZj5fJyW2Od-iXyAy8OhJ2jpJDWJornW6JDSOi29IFeNjpIqrg-n-Ge9YExxpNUWeomKMQNFM4tx2t5Y',
  })
    .then(currentToken => {
      if (currentToken) {
        return currentToken
        // Track the token -> client mapping, by sending to backend server
        // show on the UI that permission is secured
      } else {
        return ''
        // shows on the UI that permission is required
      }
    })
    .catch(err => {
      // catch error while creating client token
      return ''
    })
}

export const onMessageListener = () =>
  new Promise(resolve => {
    onMessage(messaging, payload => {
      resolve(payload)
    })
  })
