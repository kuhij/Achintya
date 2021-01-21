import React, { useEffect, useState, useRef, Component } from "react";
import firebase from "firebase";
import { View, Image, Text, Dimensions } from "react-native";
import HomePage from "./homepage";

const { width, height } = Dimensions.get("window");

let width1 = (window.innerWidth * 9) / 10;
if (width1 > 400) width1 = 400;
let height1 = width1 * (344 / 400);

export default function Login(props) {
    console.log(height, width);
    const [emailId, setEmail] = useState("");
    const [home, setHome] = useState(false)

    const googleLogin = async () => {
        if (!firebase.auth().currentUser) {
            var provider = new firebase.auth.GoogleAuthProvider()
            firebase
                .auth()
                .signInWithPopup(provider)
                .then(function (result) {
                    const token = result.credential.accessToken;
                    const user = result.user;
                    console.log(user);

                    const name = user["displayName"]
                    const email = user["email"]
                    const uid = user["uid"]
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
            var id = loggedInUser.email
            console.log(loggedInUser);
            setHome(true)
            setEmail(id)
        }
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
                <HomePage email={emailId} />
            }
        </View>

    )
}