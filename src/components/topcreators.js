//imports
import React, { useState, useEffect, useRef } from "react";
import { Dimensions, View, TextInput, Text } from "react-native";

import { notification, Button, Input, Tooltip } from 'antd';

import firebase from "firebase";

import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import AddToHomeScreenIcon from '@material-ui/icons/AddToHomeScreen';
import { useSwipeable, Swipeable, LEFT, RIGHT, UP, DOWN } from "react-swipeable";

import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import VideoRoom from './topCratorStream'
import YoutubeLiveView from "./creatorView";
import swal from 'sweetalert';

import { useParams, useHistory, Redirect } from "react-router-dom";
import Login from "./login";
const { width, height } = Dimensions.get("window");

const initialState = {
    value: "",
};

// let array = []
// let values = []
//let counter = 0
const guestId = "guest_" + Math.random().toString(36).slice(2)
export default function TopCreators(params) {
    const { spaceId } = useParams();
    const history = useHistory();

    const [state, setState] = useState(initialState);
    const [turn, setTurn] = useState("")
    const [limit, setLimit] = useState(99999999999);
    const [word, setWord] = useState("")
    const [name, setName] = useState("")
    const [redirect, setRedirect] = useState(false)
    const [online, setOnline] = useState(false)
    const [currentSpace, setCurrentSpace] = useState("")
    const [loggedIn, setLoggedIn] = useState(false)
    const [mySpace, setMySpace] = useState("")
    const [currentS, setCurrentS] = useState("")
    const [showText, setShowText] = useState(true)
    const [showVideo, setShowVideo] = useState(false)
    const [show, setShow] = useState(true)
    const [array, setArray] = useState([])
    const [values, setValues] = useState([])
    const [counter, setCounter] = useState(-1)
    const [hasData, setHasData] = useState(null)
    const [showYoutube, setShowYoutube] = useState(false)
    const [videoId, setVideoId] = useState("")
    const [myVideoId, setMyVideoId] = useState("")

    const [toSpace, setToSpace] = useState(false)

    const textInputRef = useRef();


    const openNotification = (placement, message) => {
        notification.info({
            message: `Alert`,
            description:
                `${message}`,
            placement
        });
    };

    const writer = (creatorId) => {
        const path = firebase.database().ref(`/Spaces/${creatorId}/writer`)
        writerFunction(path)
    }

    const writerFunction = (ref) => {
        ref.on("value", (snapshot) => {

            setTurn(snapshot.val())
        });
    }

    //fetching current data from rtdb -- text
    const keyPressFunction = (ref) => {
        ref.on("value", async function (snapshot) {

            if (snapshot.val()) {
                if (snapshot.val().being) {
                    setVideoId(snapshot.val().being)
                }
                if (snapshot.val().word === null) {
                    return null;
                } else {
                    const current = snapshot.val().word;
                    console.log(current);

                    setState((e) => ({
                        ...e,
                        value: current,
                    }));

                }
            }
        });
    };

    const spaceOwnerData = async (creatorId) => {
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                //loggedIn user
                const name1 = user.email.replace('@achintya.org', '')
                console.log(creatorId);
                setName(name1)
                firebase.database().ref(`/Users/${name1}/`).once("value", function (snap) {
                    setCurrentS(snap.val().currentSpace)
                    setMySpace(snap.val().mySpace)

                    firebase.database().ref(`/Users/${name1}/`).update({
                        currentSpace: creatorId
                    })

                    firebase.database().ref(`/Users/${name1}/`).onDisconnect().update({
                        currentSpace: snap.val().mySpace
                    })

                })

                setLoggedIn(true)

            } else {
                setLoggedIn(false)
                setName(guestId)
                console.log('not logged in');

            }
        });

        firebase.database().ref(`/Spaces/${creatorId}/`).update({
            count: firebase.database.ServerValue.increment(1),
        })

        firebase.database().ref(`/Spaces/${creatorId}/`).onDisconnect().update({
            count: firebase.database.ServerValue.increment(-1)
        });

        listening(creatorId);
        writer(creatorId)
    };

    useEffect(() => {
        if (currentSpace) {

            firebase.database().ref(`/Spaces/${currentSpace}/online`).on("value", function (snap) {
                setOnline(snap.val())
            })
        }

    }, [currentSpace])

    const fetchUpdate = (creatorId) => {

        spaceOwnerData(creatorId);

    };


    const listening = (creatorId) => {
        let docRef = firebase.database().ref(`/Spaces/${creatorId}/data/`);
        keyPressFunction(docRef);
    };

    useEffect(() => {
        if (array.length > 0 && values.length > 0 && counter <= array.length - 1 && counter > -1) {
            const id = array[counter]
            console.log(values);
            setCurrentSpace(id)
            const number = values[counter].count

            setLimit(number)
            fetchUpdate(id)
            console.log(array, values);
        }
        if (array.length > 1) {
            if (array[counter + 1]) {
                setHasData(true)
            }
        }
    }, [counter])

    useEffect(() => {
        let linksRef = firebase.database().ref('/Spaces/');
        linksRef.orderByChild('count').endAt(limit).limitToLast(1).once("value", function (snapshot) {
            if (snapshot.val()) {

                const keys = Object.keys(snapshot.val())
                let val = Object.values(snapshot.val())
                for (let i = 0; i < Object.keys(snapshot.val()).length; i++) {
                    const element = Object.keys(snapshot.val())[i];
                    const element1 = Object.values(snapshot.val())[i];
                    setArray(oldArray => [...oldArray, element]);
                    setValues(oldValue => [...oldValue, element1]);

                }
                //const number = values[counter].count
                setHasData(true)
                setCounter(counter + 1)
                linksRef.orderByChild("count").equalTo(val[0].count).once("value", function (snap) {
                    console.log("run");
                    if (snap.val()) {

                        const keys = Object.keys(snap.val())
                        // array.push(Object.keys(snap.val())[0])
                        let val = Object.values(snap.val())

                        for (let j = 0; j < keys.length; j++) {
                            const element = Object.keys(snap.val())[j];
                            const element1 = Object.values(snap.val())[j];
                            setArray(oldArray => [...oldArray, element]);
                            setValues(oldValue => [...oldValue, element1]);
                        }

                        console.log(snap.val(), keys, values[counter].count);
                        if (keys.length > 1) {
                            snap.forEach((doc) => {
                                const index = array.indexOf(doc.key)
                                if (index === -1) {

                                    setArray(oldArray => [...oldArray, doc.key]);
                                    setValues(oldValue => [...oldValue, doc.val()]);
                                }
                                console.log(array);
                            })
                        }
                        else {
                            linksRef.orderByChild('count').endAt(val[val.length - 1].count - 1).limitToLast(1).once("value", function (snapshot) {
                                if (snapshot.val()) {
                                    // array.push(Object.keys(snapshot.val())[0])
                                    // values.push(Object.values(snapshot.val())[0])
                                    // const number1 = Object.values(snapshot.val())[0].count
                                    let val = Object.values(snapshot.val())


                                    for (let i = 0; i < Object.keys(snapshot.val()).length; i++) {
                                        const element = Object.keys(snapshot.val())[i];
                                        const element1 = Object.values(snapshot.val())[i];
                                        setArray(oldArray => [...oldArray, element]);
                                        setValues(oldValue => [...oldValue, element1]);
                                    }

                                    console.log(array, snapshot.val(), values)

                                    linksRef.orderByChild("count").equalTo(val[0].count).once("value", function (snap) {
                                        if (snap.val()) {

                                            const keys = Object.keys(snap.val())

                                            if (keys.length > 1) {
                                                snap.forEach((doc) => {
                                                    const index = array.indexOf(doc.key)
                                                    if (index === -1) {
                                                        // array.push(doc.key)
                                                        // values.push(doc.val())
                                                        setArray(oldArray => [...oldArray, doc.key]);
                                                        setValues(oldValue => [...oldValue, doc.val()]);
                                                    }
                                                    console.log(array);
                                                    //array = keys
                                                })
                                            } else {
                                                console.log(false);
                                            }

                                        }
                                    })
                                } else {
                                    openNotification('bottomLeft', "no more creations")
                                }
                            })
                        }

                    }
                })


            } else {
                openNotification('bottomLeft', "no more creations.")
            }
        })
    }, []);

    //taking turn on KEY ENTER
    useEffect(() => {

        const listener = (event) => {

            if (event.code === "Enter") {
                //if (loggedIn) {

                takeTurn()

                // else {
                //     openNotification('bottomLeft', "please login to take turn.")
                // }

            }
        };

        // register listener
        document.addEventListener("keydown", listener);

        // clean up function, un register listener on component unmount
        return () => {
            document.removeEventListener("keydown", listener);
        };
    }, [name, turn, currentSpace, loggedIn, online])

    const takeTurn = () => {
        if (online) {
            if (myVideoId) {
                setState((e) => ({
                    ...e,
                    value: "",
                }));
                firebase.database().ref(`/Spaces/${currentSpace}/data`).update({ word: "", being: myVideoId })
                firebase.database().ref(`/Spaces/${currentSpace}/`).update({ writer: name })
            } else {
                swal({
                    text: 'Enter video id',
                    content: "input",
                    button: {
                        text: "Proceed",
                        closeModal: true,
                    },
                }).then((value) => {
                    if (value) {
                        setMyVideoId(value)
                        firebase.database().ref(`/Spaces/${currentSpace}/data`).update({
                            being: value,
                        }).then(() => {
                            setState((e) => ({
                                ...e,
                                value: "",
                            }));
                            firebase.database().ref(`/Spaces/${currentSpace}/`).update({ writer: name })
                        })
                    } else {
                        swal({
                            title: "Please enter videoId to continue!",
                            icon: "info",
                            button: "okay",
                        });
                    }
                })
            }
        } else {
            openNotification('bottomLeft', "user is offline.")
        }
    }


    const handleInputMobile = (e) => {
        setWord(e.target.value)
        const time = Date.now()
        var space = e.target.value.charAt(e.target.value.length - 1)

        // console.log(e.target.value, space);
        if (space == " ") {
            let wrd = word
            firebase.database().ref(`/Spaces/${currentSpace}/data`).update({ word: wrd })

            setWord("")
            console.log('spacebar detected');
        }
    }


    const nextCard = async () => {

        let linksRef = firebase.database().ref('/Spaces/');
        // console.log(currentSpace, array, counter);
        if (array.length - counter <= 2) {
            console.log('entry run');
            await linksRef.orderByChild('count').endAt(values[values.length - 1].count - 1).limitToLast(1).once("value", async function (snapshot) {
                console.log(snapshot.val(), array.length, counter);
                if (snapshot.val()) {
                    console.log('query run');
                    // array.push(Object.keys(snapshot.val())[0])
                    // values.push(Object.values(snapshot.val())[0])
                    let val = Object.values(snapshot.val())
                    for (let i = 0; i < Object.keys(snapshot.val()).length; i++) {
                        const element = Object.keys(snapshot.val())[i];
                        const element1 = Object.values(snapshot.val())[i];
                        setArray(oldArray => [...oldArray, element]);
                        setValues(oldValue => [...oldValue, element1]);

                    }

                    // const id = array[0]
                    // const number = Object.values(snapshot.val())[0].count

                    linksRef.orderByChild("count").equalTo(val[0].count).once("value", function (snap) {
                        if (snap.val()) {

                            const keys = Object.keys(snap.val())
                            console.log(snap.val(), keys);

                            snap.forEach((doc) => {
                                const index = array.indexOf(doc.key)
                                if (index === -1) {
                                    setArray(oldArray => [...oldArray, doc.key]);
                                    setValues(oldValue => [...oldValue, doc.val()]);
                                }
                                console.log(array);
                                //array = keys
                            })

                        }
                    })

                    // if (array[counter + 1]) {

                    // }

                    //nextData(id)
                } else {
                    setHasData(false)
                }
            })
        }
        // if (array[counter + 1]) {
        //     setHasData(true)
        // }
        setCounter(counter + 1)
        // if (counter >= array.length) {
        //     openNotification('bottomLeft', "no more creations.")
        // } else {
        //     setState((e) => ({
        //         ...e,
        //         value: "",
        //     }));
        //     firebase.database().ref(`/Spaces/${array[counter]}/`).once("value", function (snapshot) {
        //         if (snapshot.val()) {
        //             setLimit(snapshot.val().count)
        //         }

        //     })

        //     setCurrentSpace(array[counter])
        //     fetchUpdate(array[counter])

        //     nextData(array[counter])
        // }

    }

    const switchingOff = async () => {
        firebase.database().ref(`/Spaces/${currentSpace}/`).onDisconnect().cancel()
        await firebase.database().ref(`/Spaces/${currentSpace}/`).update({
            count: firebase.database.ServerValue.increment(-1)
        })
        firebase.database().ref(`/Spaces/${currentSpace}/data/`).off()
        firebase.database().ref(`/Spaces/${currentSpace}/`).off()
        firebase.database().ref(`/Spaces/${currentSpace}/webRTC/messages`).off()
        firebase.database().ref(`/Spaces/${currentSpace}/webRTC/call`).off()
        firebase.database().ref(`/Spaces/${currentSpace}/webRTC/messages/ice`).off()
    }

    const onDown = async () => {
        setHasData(true)
        setState((e) => ({
            ...e,
            value: "",
        }));
        setVideoId("")
        switchingOff()

        setCurrentSpace(array[counter])

        setCounter(counter - 1)
        console.log(currentSpace, array, counter);
        //setRedirect(true)

    }

    const goToLogin = async () => {
        console.log(currentSpace);
        if (currentSpace) {
            switchingOff()
        }

        setRedirect(true)
    }

    const onUP = async () => {
        console.log(currentSpace);

        setState((e) => ({
            ...e,
            value: "",
        }));
        setVideoId("")
        await switchingOff()

        nextCard()

    }

    const goToSpace = () => {
        if (currentSpace) {
            switchingOff()
        }
        setToSpace(true)
    }

    const forward = () => {
        setShowVideo(true)
        setShowText(false)
        setShowYoutube(false)
    }

    const backward = () => {
        setShowVideo(false)
        setShowText(true)
        setShowYoutube(false)
    }

    const onYouTube = () => {
        setShowVideo(false)
        setShowYoutube(true)
    }

    const onVideo = () => {
        setShowVideo(true)
        setShowYoutube(false)
    }

    const onSwiping = ({ dir }) => {
        if (dir === UP) {
            console.log(counter, array.length);
            if (hasData) {
                onUP()
            }

        }

        if (dir === DOWN) {
            if (counter !== 0) {
                onDown()
            }

        }

    }


    return redirect ? <Login /> : toSpace ? <Redirect push to={`/space/${mySpace}`} /> : (
        <Swipeable onSwiped={(eventData) => onSwiping(eventData)} preventDefaultTouchmoveEvent={true} trackMouse={true} style={{ height: height }}>
            <img
                src="../favicon.png"
                alt="logo"
                style={{ height: 25, width: 25, margin: 10, position: 'absolute', zIndex: 9, marginTop: 14 }}
            />
            <View style={{ marginRight: width <= 600 ? '4%' : '2%', marginTop: height / 2.3, position: 'absolute', marginLeft: width - 45, display: show ? 'block' : 'none', zIndex: 9 }} >
                {showVideo ?
                    <View style={{ cursor: 'pointer', }} onClick={backward}>
                        <KeyboardArrowLeftIcon style={{ color: 'white' }} />
                    </View>

                    : <View style={{ cursor: 'pointer', display: showYoutube ? "none" : 'block' }} onClick={forward}>
                        <KeyboardArrowRightIcon />
                    </View>}
                <br />
                {videoId ?
                    <>
                        {showYoutube ?
                            <View style={{ cursor: 'pointer' }} onClick={onVideo}>
                                <KeyboardArrowLeftIcon style={{ color: 'black' }} />
                            </View>
                            :
                            <View style={{ cursor: 'pointer' }} onClick={onYouTube}>
                                <KeyboardArrowRightIcon style={{ color: 'white' }} />
                            </View>
                        }
                    </>
                    : null}
            </View>
            <View style={{ opacity: showText ? 1 : 0, position: "absolute", height: height, width: width, overflow: 'hidden', background: "#fafafa" }}>

                <View
                    style={{
                        width: width,
                        overflow: 'hidden',
                        height: height,
                        marginTop: '18px',
                        zIndex: 99999,
                    }}
                >
                    <View style={{ width: width, height: height }} onClick={() => setShow(!show)}>
                        {array.length > 0 ?
                            <Text style={{ textAlign: 'center', fontFamily: 'Orelega One', marginBottom: 8 }}>
                                <span style={{ fontSize: 19 }}>{array[counter] ? array[counter].charAt(0).toUpperCase() + array[counter].slice(1) : array[array.length - 1].charAt(0).toUpperCase() + array[array.length - 1].slice(1)}:
                                </span>
                                {" "}{turn}

                                <Tooltip title={online ? "online" : "offline"}>
                                    <View style={{ marginLeft: 6, cursor: 'pointer', background: online ? "green" : "red", height: 9, width: 9, borderRadius: '50%' }}>

                                    </View>
                                </Tooltip>
                            </Text>
                            : null}
                        {!loggedIn ?

                            <Tooltip title="login">
                                <View style={{ marginLeft: width <= 600 ? width / 1.05 - 23 : width / 1.03, cursor: 'pointer', position: 'absolute' }} onClick={goToLogin}>
                                    <AccountCircleIcon />
                                </View>
                            </Tooltip>

                            :

                            <Tooltip title="my space">
                                <View style={{ marginLeft: width <= 600 ? width / 1.05 - 23 : width / 1.03, cursor: 'pointer', position: 'absolute' }} onClick={goToSpace}>
                                    <AddToHomeScreenIcon />
                                </View>
                            </Tooltip>

                        }

                        <View style={{ height: 1, background: 'black', marginTop: 28, position: 'absolute', width: width }}></View>

                        <Text style={{ letterSpacing: 1, fontFamily: 'Ubuntu, sans-serif', fontSize: width < 600 ? (width / state.value.length + state.value.length) : (state.value.length === 2 ? height / 1.8 : (state.value.length) + height / (state.value.length / 2)), textAlign: 'center', width: width, marginTop: width <= 600 ? height / 4 : height / 10 }}>{state.value}</Text>

                    </View>

                </View>

                <View style={{ position: 'absolute', width: width, marginTop: height / 1.08, marginLeft: width <= 600 ? null : (width - (width / 1.1)) / 2.1, zIndex: 99999 }}>
                    <Input
                        onChange={handleInputMobile}
                        placeholder="Type message.."
                        value={word}
                        type="text"
                        style={{ width: width <= 600 ? width : width / 1.1, height: width < 600 ? 40 : 37, borderRadius: 30, paddingLeft: 20, paddingRight: width <= 600 ? '20%' : '7%' }}
                        disabled={turn === name && online ? false : true}
                    />

                </View>
                {turn !== name && online ?
                    <Button
                        style={{
                            border: 'none', color: 'green', fontWeight: 600, zIndex: 99999, width: 30, position: 'absolute', marginTop: width <= 600 ? height / 1.08 : height / 1.08, marginLeft: width <= 600 ? width / 1.50 : width / 1.16, background: "transparent", height: width < 600 ? 40 : 37, fontSize: 11
                        }}
                        onClick={takeTurn}>
                        Take
                        </Button>
                    : null}

                <View style={{ display: 'flex', flexFlow: 'row', alignItems: 'flex-end', marginTop: width <= 600 ? height / 1.08 : height / 1.08, position: 'absolute', marginLeft: width <= 600 ? width / 1.25 : width / 1.11, height: width < 600 ? 33 : 31, zIndex: 999999 }} >
                    {counter !== 0 ?

                        <Tooltip title="previous">
                            <View style={{ cursor: 'pointer' }} onClick={onDown} disabled>
                                <KeyboardArrowUpIcon disabled />
                            </View>
                        </Tooltip>

                        : null}
                    {hasData ?

                        <Tooltip title="next">
                            <View style={{ cursor: 'pointer' }} onClick={onUP}>
                                <KeyboardArrowDownIcon />

                            </View>
                        </Tooltip>

                        : null}

                </View>

            </View>

            <View style={{ opacity: showVideo ? 1 : 0, position: 'absolute', zIndex: showVideo ? null : '-1' }}>
                {name !== "" ?
                    <VideoRoom myName={name} spaceName={currentSpace} takeTurn={takeTurn} turn={turn} online={online} creator={false} />
                    : null}
            </View>
            <View style={{ opacity: showYoutube ? 1 : 0, position: 'absolute', zIndex: showYoutube ? null : '-1' }}>

                <YoutubeLiveView myName={name} spaceName={currentSpace} turn={turn} takeTurn={takeTurn} online={online} videoId={videoId} />

            </View>

        </Swipeable>
    )
}