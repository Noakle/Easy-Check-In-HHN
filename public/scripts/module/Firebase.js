var firebase = require('firebase/app').default;
require('firebase/firestore');

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDB0A3CJfEn2aa-03eTMjpvElyTAkG8fjo",
    authDomain: "easy-check-in-hhn.firebaseapp.com",
    databaseURL: "https://easy-check-in-hhn.firebaseio.com",
    projectId: "easy-check-in-hhn",
    storageBucket: "easy-check-in-hhn.appspot.com",
    messagingSenderId: "487033956025",
    appId: "1:487033956025:web:cd60e17dac796dcd40dd68"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.firestore().settings({ timestampsInSnapshots: true });

module.exports.firebase = firebase;