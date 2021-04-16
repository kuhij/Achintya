const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// const admin = require('firebase-admin');
// admin.initializeApp();

// exports.onlineStatus = functions.database.ref('Spaces/{spaceId}/online').onUpdate((change, context) => {
//     const value = change.after.val()
//     const time = Date.now()
//     const firestoreDb = admin.firestore();
//     const space = change.after.ref.parent.key
//     let username;
//     console.log(space, username)

//     admin.database().ref(`/Spaces/${space}/owner`).once("value", function (snap) {
//         username = snap.val()
//     })

//     if (value === false) {
//         const docRefçerence = firestoreDb.collection("Spaces").doc(space).collection("Timeline").doc(time.toString());
//         docRefçerence.set({ exit: time, username: username })
//         console.log('updated', space, username);
//     }

// })