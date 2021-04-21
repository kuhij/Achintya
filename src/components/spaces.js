//imports
import React, { useState, useEffect } from "react";
import { Dimensions, View, Text } from "react-native";

import { notification } from 'antd';
import TextPage from './text';


import firebase from "firebase";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader

import VideocamIcon from '@material-ui/icons/Videocam';

import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import VideoRoom from './myVideo'
import TopCreators from './topcreators'

import { useParams, useHistory } from "react-router-dom";
const { width, height } = Dimensions.get("window");

const initialState = {
    value: "",
};

const guestId = "guest_" + Math.random().toString(36).slice(2)
let counter = 0
export default function Spaces() {
    const { spaceId } = useParams();
    const history = useHistory();

    const [state, setState] = useState(initialState);
    const [turn, setTurn] = useState("")
    const [openJoinModal, setOpenJoinModal] = useState(false);
    const [anotherCreatorId, setAnotherCreatorId] = useState("");
    const [name, setName] = useState("")
    const [loggedIn, setLoggedIn] = useState(false)
    const [online, setOnline] = useState(false)
    const [mySpace, setMySpace] = useState("")
    const [showText, setShowText] = useState(true)
    const [showVideo, setShowVideo] = useState(false)
    const [showYoutube, setShowYoutube] = useState(false)
    const [creator, setCreator] = useState(false)
    const [haveTurn, setHaveTurn] = useState(false)
    const [showCall, setShowCall] = useState(false)
    const [videoId, setVideoId] = useState("")
    const [redirect, setRedirect] = useState(false)

    const openNotification = (placement, message) => {
        notification.info({
            message: `Alert`,
            description:
                `${message}`,
            placement
        });
    };


    const writer = () => {
        const path = firebase.database().ref(`/Spaces/${spaceId}/writer`)
        writerFunction(path)
    }

    const writerFunction = (ref) => {
        ref.on("value", (snapshot) => {
            if (snapshot.val() === name) {
                setHaveTurn(true)
            }

            setTurn(snapshot.val())
        });
    }

    //fetching current data from rtdb -- text
    const keyPressFunction = (ref) => {
        ref.on("value", async function (snapshot) {

            if (snapshot.val()) {

                if (snapshot.val() === null) {
                    return null;
                } else {
                    const current = snapshot.val();
                    console.log(current);
                    setState((e) => ({
                        ...e,
                        value: current,
                    }));

                }
            }
        });
    };

    const listening = () => {
        let docRef = firebase.database().ref(`/Spaces/${spaceId}/data/word`);
        keyPressFunction(docRef);

    };

    const spaceOwnerData = async () => {
        const time = Date.now()
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                setLoggedIn(true)
                //loggedIn user
                const name1 = user.email.replace('@achintya.org', '')
                setName(name1)
                console.log('current user ', user);
                firebase.database().ref(`/Users/${name1}/`).once("value", function (snap) {
                    setMySpace(snap.val().mySpace)

                    if (spaceId === snap.val().mySpace) {
                        setCreator(true)

                        firebase.database().ref(`/Spaces/${snap.val().mySpace}/`).update({
                            online: true,
                            owner: name1,
                            writer: name1,
                            time: firebase.database.ServerValue.TIMESTAMP,
                        })

                        firebase.database().ref(`/Spaces/${snap.val().mySpace}/data`).update({
                            word: ""
                        })

                        firebase.database().ref(`/Spaces/${spaceId}/webRTC/`).update({
                            call: 'open'
                        })

                        // firebase.firestore().collection("Spaces").doc(snap.val().mySpace).collection("Timeline").doc(time.toString()).set({
                        //     username: name1,
                        //     entry: time
                        // })

                        firebase.database().ref(`/Users/${name1}/`).onDisconnect().update({
                            currentSpace: snap.val().mySpace
                        })

                        firebase.database().ref(`/Users/${name1}/`).update({
                            currentSpace: snap.val().mySpace
                        })

                        firebase.database().ref(`/Spaces/${snap.val().mySpace}/webRTC`).onDisconnect().update({
                            messages: null,
                            call: null
                        })

                        firebase.database().ref(`/Spaces/${snap.val().mySpace}/`).onDisconnect().update({
                            online: false,
                            writer: name1,
                            time: firebase.database.ServerValue.TIMESTAMP,
                        });
                    }

                })

            } else {
                setName(guestId)
                setLoggedIn(false)
                console.log('not logged in');
            }
        });

        firebase.database().ref(`/Spaces/${spaceId}/`).update({
            count: firebase.database.ServerValue.increment(1),
        })

        firebase.database().ref(`/Spaces/${spaceId}/`).onDisconnect().update({
            count: firebase.database.ServerValue.increment(-1)
        });
        listening();
        writer()
    };

    const onSignOut = () => {
        firebase.auth().signOut().then(() => {

            console.log('successfully signed out');
            backToHome()
            openNotification('bottomLeft', "Successfully logged out.")
        }).catch((error) => {
            console.log(error);
        });

    }

    const backToHome = () => {
        firebase.database().ref(`/Spaces/${mySpace}/`).onDisconnect().cancel()
        firebase.database().ref(`/Spaces/${mySpace}/`).update({
            count: firebase.database.ServerValue.increment(-1),
            online: false,
        })
        firebase.database().ref(`/Spaces/${mySpace}/webRTC`).update({
            messages: null,
            call: null
        })
        history.push("/")
    }

    useEffect(() => {
        const time = Date.now()
        if (spaceId) {
            console.log(spaceId);

            firebase.database().ref(`/Spaces/${spaceId}/online`).on("value", function (snap) {
                setOnline(snap.val())
            })
        }

    }, [spaceId])


    useEffect(() => {
        spaceOwnerData();
    }, []);

    //taking turn on KEY ENTER
    useEffect(() => {

        const listener = (event) => {

            if (event.code === "Enter") {
                TakeTurn()

            }
        };

        // register listener
        document.addEventListener("keydown", listener);

        // clean up function, un register listener on component unmount
        return () => {
            document.removeEventListener("keydown", listener);
        };
    }, [name, turn])

    const TakeTurn = () => {
        if (online) {
            setState((e) => ({
                ...e,
                value: "",
            }));
            firebase.database().ref(`/Spaces/${spaceId}/data`).update({ word: "" })
            firebase.database().ref(`/Spaces/${spaceId}/`).update({ writer: name })
        } else {
            openNotification('bottomLeft', "user is offline.")
        }
    }

    const forward = () => {
        setShowVideo(true)
        setShowText(false)
    }

    const backward = () => {
        setShowVideo(false)
        setShowText(true)
    }



    return (
        <View style={{ height: "100%" }}>

            <View>
                <img
                    src="../favicon.png"
                    alt="logo"
                    style={{ height: 25, width: 25, margin: 10, position: 'absolute', zIndex: 9, cursor: 'pointer', marginTop: 14 }}
                    onClick={backToHome}
                />
                <View style={{ opacity: showText ? 1 : 0 }}>
                    <TextPage
                        currentData={state.value}
                        turn={turn}
                        myName={name}
                        spaceId={spaceId}
                        mySpace={mySpace}
                        online={online}
                        takeTurn={TakeTurn}
                        signout={onSignOut}
                    />
                </View>
                {/* <View style={{ cursor: 'pointer', marginTop: width <= 600 ? height / 1.08 : height / 1.08, marginLeft: width <= 600 ? width / 1.25 : width / 1.10, width: 30 }} onClick={forward}>
                    <VideocamIcon />
                </View> */}


                <View style={{ opacity: showVideo ? 1 : 0, position: 'absolute', zIndex: showVideo ? null : '-1' }}>
                    {name !== "" ?
                        <VideoRoom myName={name} spaceName={spaceId} turn={turn} takeTurn={TakeTurn} />
                        : null}
                </View>

                <View style={{ marginRight: width <= 600 ? '4%' : '2%', marginTop: height / 2.3, position: 'absolute', marginLeft: width - 45 }}>

                    <View style={{ cursor: 'pointer' }} onClick={forward}>
                        <KeyboardArrowRightIcon />
                        {/* <VideocamIcon /> */}
                    </View>

                    {showVideo ?
                        <>
                            <View style={{ cursor: 'pointer', marginBottom: 10 }} onClick={backward}>
                                <KeyboardArrowLeftIcon style={{ color: 'white' }} />
                            </View>
                            {/* <View style={{ cursor: 'pointer', marginTop: 10 }} >
                                <KeyboardArrowRightIcon style={{ color: 'white' }} />
                                
                            </View> */}
                        </>
                        : null}
                </View>
            </View>

        </View>

    )
}

// else {
                    //     firebase.firestore().collection("Spaces").doc(spaceId).collection("Timeline").doc(time.toString()).update({
                    //         username: name1,
                    //         entry: time
                    //     })
                    // }