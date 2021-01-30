import React, { useEffect, useState, useRef, Component } from "react";
import firebase from "firebase";
import { View, Image, Text, Dimensions } from "react-native";
import HomePage from "./homepage";
import { db, database, messaging } from './App'

import { TextField, IconButton, Button } from "@material-ui/core";

const { width, height } = Dimensions.get("window");

let width1 = (window.innerWidth * 9) / 10;
if (width1 > 400) width1 = 400;
let height1 = width1 * (344 / 400);

export default function Login(props) {
    console.log(height, width);
    const [emailId, setEmail] = useState("");
    const [home, setHome] = useState(false)

    const [profileId, setProfileId] = useState("");

    const googleLogin = async () => {
        firebase.database().ref(`/Spaces/${profileId}`).once("value", (snap) => {
            if (!firebase.auth().currentUser && !snap.val()) {
                var provider = new firebase.auth.GoogleAuthProvider()
                firebase
                    .auth()
                    .signInWithPopup(provider)
                    .then(function (result) {
                        const token = result.credential.accessToken;
                        const user = result.user;
                        console.log(user);
                        const email = user["email"]
                        db.ref(`/Spaces/${profileId}/`).update({
                            balance: 0,
                            name: user["displayName"],
                            email: user["email"],
                            uid: user["uid"],
                        })
                        setHome(true)
                        setEmail(email)
                    })
                    .catch(function (error) {
                        const errorcode = error.code;
                        const errorMessage = error.message;
                        const email = error.email;
                        const credential = error.credential;
                        console.log(errorMessage, errorcode);
                    });
            } else {
                var loggedInUser = firebase.auth().currentUser;
                firebase.database().ref(`/Spaces/${profileId}`).once("value", (snap) => {
                    if (snap.val()) {
                        var id = loggedInUser.email
                        console.log(loggedInUser);
                        setHome(true)
                        setEmail(id)
                    }
                })
            }
        })
    };

    return (
        <View>
            {home === false ?
                <View style={{ marginTop: height / 8.5, width: width1, margin: 'auto' }}>
                    <Image
                        style={{
                            marginHorizontal: "auto",
                            marginVertical: 20,
                            textAlign: "center",
                            maxWidth: "100%",
                        }}
                        source={{ uri: "favicon.png", width: width1, height: height1 }}
                    />
                    <Text style={{ fontSize: 28, fontWeight: 600, textAlign: 'center' }}>Achintya</Text>
                    <br />
                    <br />
                    <TextField
                        variant="outlined"
                        placeholder="Enter Profile Id"
                        size="small"
                        value={profileId}
                        onChange={(e) => setProfileId(e.target.value)}
                    //onClick={visitCreator}
                    />
                    <br />
                    <button
                        onClick={googleLogin}
                        style={{
                            fontSize: 13,
                            color: "white",
                            background: 'black',
                            height: 38,
                            borderRadius: 3,
                            fontFamily: 'emoji',
                            fontSize: 16,
                            border: 'none',
                            cursor: 'pointer'
                        }}

                    >
                        Login with Google
      </button>
                </View>
                :
                <HomePage email={emailId} name={profileId} />
            }
        </View>

    )
}