import React, { useEffect, useState, useRef, Component } from "react";
import firebase from "firebase";
import { View, Image, Text, Dimensions } from "react-native";
import { useSwipeable, Swipeable, LEFT, RIGHT, UP, DOWN } from "react-swipeable";
import { TextField, IconButton, Button } from "@material-ui/core";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import HomePage from "./homepage";
import { db, database, messaging } from './App'
import TextBroadCast from './text/groups'
import useActionDispatcher from "./Hooks/useActionDispatcher";
import { SET_KEYS_TRUE, UPDATE_USER_DATA } from "./Store/actions";

const { width, height } = Dimensions.get("window");

let width1 = (window.innerWidth * 9) / 10;
if (width1 > 400) width1 = 400;
let height1 = width1 * (344 / 400);

export default function Login(props) {
    console.log(height, width);
    const dispatchAction = useActionDispatcher();
    const history = useHistory();

    const user_data = useSelector((state) => state.globalUserData);

    const [emailId, setEmail] = useState("");
    const [home, setHome] = useState(false)
    const [count, setCount] = useState(0);
    const [showLogin, setShowLogin] = useState(false)
    const [currentUser, setCurrentUser] = useState("")
    const [watchers, setWatchers] = useState(0)

    const [profileId, setProfileId] = useState("");

    // useEffect(() => {
    //     let first;
    //     firebase.database().ref(`/Spaces`).on("value", function (snapshot) {
    //         if (snapshot.val()) {
    //             if (count > 0) {
    //                 first = firebase.database().ref().child("/Spaces/").orderByChild("count").limitToFirst(1).startAt(watchers + 1)
    //             } else {
    //                 first = firebase.database().ref().child("/Spaces/").orderByChild("count").limitToFirst(1)
    //             }

    //             first.once("child_added", function (snapshot) {
    //                 console.log(snapshot.val(), snapshot.key);
    //                 dispatchAction(UPDATE_USER_DATA, {
    //                     data: {
    //                         is_creator: false,
    //                         joinedSpace: snapshot.key,
    //                         anonymous_user: true
    //                     },
    //                 });
    //                 //history.push(`/${snapshot.key}`)
    //                 setWatchers(snapshot.val().count)
    //             })
    //         } else {
    //             setShowLogin(true)
    //         }
    //     })

    // }, [count])

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
                        setShowLogin(false)
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
                        var id = snap.val().email
                        console.log(loggedInUser);
                        setHome(true)
                        setShowLogin(false)
                        setEmail(id)
                    }
                })
            }
        })
    };



    const onSwiping = ({ dir }) => {
        if (dir === DOWN) {
            //setShowLogin(true)
            console.log('down');
        }
        if (dir === UP) {
            setCount(count + 1)
        }
    }

    return (
        <Swipeable onSwiped={(eventData) => onSwiping(eventData)} preventDefaultTouchmoveEvent={true} trackMouse={true} >
            <View>
                {home === false || showLogin === true ?
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
        </Swipeable>
    )
}