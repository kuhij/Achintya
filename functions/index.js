const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

//const serviceAccount = require("./serviceAccountKey.json");

const admin = require("firebase-admin");

const bucketName = "achintya-org.appspot.com";

exports.makeUppercase = functions.database
  .ref("/User/mohit/amount")
  .onCreate((snapshot, context) => {
    // Grab the current value of what was written to the Realtime Database.
    // const original = snapshot.val();
    // // console.log('Uppercasing From', context.params.userId, original);
    // const uppercase = original.toUpperCase();
    //  snapshot.ref.parent.child('uppercase').update(uppercase);
    // // You must return a Promise when performing asynchronous tasks inside a Functions such as
    // // writing to the Firebase Realtime Database.
    // // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
    // console.log('calling rzp');

    let amount = 100;
    return request(
      {
        method: "GET",
        url: "https://api.razorpay.com/v1/payments/pay_F3GqI7yPp9LCj7/capture",
      },
      function (error, response, body) {
        console.log("Status:", response.statusCode);
        console.log("Headers:", JSON.stringify(response.headers));
        console.log("Response:", body);

        const balance = snapshot.ref.parent.child("balance");
        balance.once("value", function (snap) {
          newAmount = snap.val() + amount;
          balance.update(newAmount);
        });
      }
    );
  });

exports.subscribeToTopic = functions.firestore
  .ref("actions/{actionId}")
  .onWrite((change, context) => {
   
        const topic = change.after.data().subscription;
        console.log(topic);
        const registrationToken = change.after.data().fcmtoken;
        return admin
          .messaging()
          .subscribeToTopic(
            "dz1kGMTnVhjczeAJpgexd8:APA91bG0DQiak9Q27VNkih6Tmoi0AYOBP0k2rjhppkC3-1JuJ7ily1ENRV5gBGBlOP-hGVJ5H81LPhYEdcATVku4OBEGp-EuMX8DqFb2ntOLfTA2K1ExkaJ4RBMxMCwpnqb9b1fDreKx",
            "achintya"
          )
          .then((response) => {
            // See the MessagingTopicManagementResponse reference documentation
            // for the contents of response.
            return console.log("Successfully subscribed to topic:", response);
          })
          .catch((error) => {
            return console.log("Error subscribing to topic:", error);
          });
      
  });

const request = require("request");
//const rp = require('request-promise');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

admin.initializeApp();
