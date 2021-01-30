const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const admin = require('firebase-admin');

const request = require('request');

admin.initializeApp();


exports.subscribeToTopic = functions.firestore.document('actions/{actionId}')
    .onWrite((change, context) => {

        let topic = change.after.data().subscription;

        const registrationToken = change.after.data().fcmtoken;
        console.log(topic, registrationToken);

        if (topic === "none") {
            topic = change.before.data().subscription

            return admin.messaging().unsubscribeFromTopic(registrationToken, topic).then((response) => {
                // See the MessagingTopicManagementResponse reference documentation
                // for the contents of response.
                return console.log('Successfully unsubscribed to topic:', response, topic);
            })
                .catch((error) => {
                    return console.log('Error unsubscribed to topic:', error);
                });
        } else {
            return admin.messaging().subscribeToTopic(registrationToken, topic).then((response) => {
                // See the MessagingTopicManagementResponse reference documentation
                // for the contents of response.
                return console.log('Successfully subscribed to topic:', response);
            })
                .catch((error) => {
                    return console.log('Error subscribing to topic:', error);
                });
        }

    });


exports.sendNotificationsToTopic = functions.firestore.document('Creations/{pageId}')
    .onWrite((change, context) => {
        console.log('function triggered')

        const topic = 'achintya'
        const message = {
            data: {
                "body": "Hi",
                "status": change.after.data().message,
                'extra field': "extra data"
            },
            topic: topic
        };
        // Send a message to devices subscribed to the provided topic.
        return admin.messaging().send(message)
            .then((response) => {
                // Response is a message ID string.
                return console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                return console.log('Error sending message:', error);
            });
    });


//firestore payment verification function
exports.transaction = functions.firestore.document('transactions/{transactionId}')
    .onWrite(async (change, context) => {
        // Grab the current value of what was written to Cloud Firestore.

        // Access the parameter {documentId} with context.params

        // You must return a Promise when performing asynchronous tasks inside a Functions such as
        // writing to Cloud Firestore.
        // Setting an 'uppercase' field in Cloud Firestore document returns a Promise.

        //const transactionRef = transaction.ref.parent.parent;
        const newValue = await change.after.data().claimedAmount;
        const paidValue = await change.after.data().paidAmount

        const id = await change.after.data().paymentId



        console.log('newValue ', newValue);
        let amount = parseInt(newValue * 100)
        return request({
            method: 'POST',
            url: `https://rzp_live_1hWjIFVX8QIpW8:M6pOFPEl16cMzyegvKLXvOhL@api.razorpay.com/v1/payments/${id}/capture`,
            form: {
                amount: amount,
                currency: "INR"
            }
        }, ((error, response, body) => {
            //console.log(response);
            //console.log('Status:', response.statusCode);
            //console.log('Headers:', JSON.stringify(response.headers));
            console.log('Response:', body);
            if (response.statusCode === 200) {
                console.log('CAPTURED');
                if (newValue === paidValue) {
                    return console.log('claimed amount is updated in paidAmount');
                } else {
                    change.after.ref.update({ status: 1, paidAmount: newValue + "+", claimedAmount: 0, time: admin.firestore.FieldValue.serverTimestamp() })
                    return console.log('value changed');
                }
            } else {
                console.log(newValue);
                return console.log('payment declined');
            }

            //transaction.ref.parent.update({key: 'value'})
        }));
    });
