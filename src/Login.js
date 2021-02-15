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

import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        '& > * + *': {
            marginTop: theme.spacing(2),
        },
    },
}));

const { width, height } = Dimensions.get("window");

let width1 = (window.innerWidth * 9) / 10;
if (width1 > 400) width1 = 400;
let height1 = width1 * (344 / 400);

let values = []

let topCreator;
let topCount;
let id = Math.random().toString(36).slice(2)

export default function Login(props) {
    //console.log(height, width);
    const dispatchAction = useActionDispatcher();
    const history = useHistory();
    const classes = useStyles();

    const user_data = useSelector((state) => state.globalUserData);

    const [emailId, setEmail] = useState("");
    const [home, setHome] = useState(false)
    const [count, setCount] = useState(-1);
    const [showLogin, setShowLogin] = useState(false)
    const [currentUser, setCurrentUser] = useState("")
    const [watchers, setWatchers] = useState(0)
    // const [count, setCount] = useState(0)
    const [creationId, setCreationId] = useState()
    const [creationData, setCreationData] = useState(null)
    const [visitPast, setVisitPast] = useState(false)
    const [replayFinish, setReplayFinish] = useState(false)


    const [timer, setTimer] = useState(null)

    //const [topCreator, setTopCreator] = useState("")
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

    // const fireFunc = (val, token) => {
    //     database.collection("Users").doc(val).collection("pages").limit(1).get().then((querySnapshot) => {
    //         const conversion = JSON.parse(querySnapshot.docs[0].data().message)
    //         console.log(querySnapshot.docs[0].data().message);
    //         setCreationId(querySnapshot.docs[0].id)
    //         setCreationData(conversion.data)
    //         console.log(creationId);
    //     })
    //     database.collection("actions").doc(id).set({
    //         subscription: val,
    //         fcmtoken: token,
    //         time: firebase.firestore.FieldValue.serverTimestamp()
    //     })
    // }

    useEffect(() => {
        const docRef = firebase.firestore.FieldPath.documentId()

        messaging
            .requestPermission()
            .then(function () {
                console.log("permission granted");

                return messaging.getToken();
            })
            .then(async (token) => {

                await db.ref("Spaces").orderByChild("count").limitToFirst(1).once("child_added", async function (snap) {
                    console.log(snap.val(), snap.key);
                    topCreator = snap.key
                    topCount = snap.val().count
                    //setTopCreator(snap.key)

                    await dispatchAction(UPDATE_USER_DATA, {
                        data: {
                            is_creator: false,
                            active_space: id,
                            token: token,
                            totalUsers: snap.val().count,
                            joinedSpace: snap.key
                        },
                    });
                    if (user_data.showLogin) {
                        return null
                    } else {
                        history.push(`/${snap.key}`);
                    }

                })

            });

        //loading()

    }, [])


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



    const onSwiping = async ({ dir }) => {
        if (dir === DOWN) {
            setShowLogin(true)
            console.log('down');
        }
        if (dir === UP) {
            //setCount(count + 1)
            // clearTimeout(timer)
            // await db.ref("Users").orderByChild("count").startAt(topCount + 1).limitToFirst(1).once("child_added", function (snap) {
            //     console.log(snap.val(), snap.key);
            //     topCreator = snap.key
            //     topCount = snap.val().count
            //     //setTopCreator(snap.key)
            // })
            // fireFunc(topCreator, user_data.token)
        }
    }

    return home === false || showLogin === true ? (
        <Swipeable onSwiped={(eventData) => onSwiping(eventData)} preventDefaultTouchmoveEvent={true} trackMouse={true} >

            <View>

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

            </View>
        </Swipeable>
    ) :
        (<HomePage email={emailId} name={profileId} />)
}
// {values.length && increment >= 0 ?
// console.log(values[increment])
{/* <p style={{ fontSize: values[increment].length === 1 ? "70vw" : (75 / (values[increment].length) + 10) + "vw", textAlign: 'center', overflow: 'hidden' }}>{values[increment]}</p>
                            : null} */}