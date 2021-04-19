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
import VideoRoom from './myVideo'

import { useParams, useHistory, Redirect } from "react-router-dom";
import Login from "./login";
const { width, height } = Dimensions.get("window");

const initialState = {
    value: "",
};

let array = []
let values = []
let counter = 0
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

                console.log('current user ', user);
                setLoggedIn(true)
                firebase.database().ref(`/Spaces/${creatorId}/`).update({
                    count: firebase.database.ServerValue.increment(1),
                })
            } else {
                setLoggedIn(false)
                setName(guestId)
                console.log('not logged in');
                firebase.database().ref(`/Spaces/${creatorId}/`).update({
                    count: firebase.database.ServerValue.increment(1),
                })
            }
        });


        // firebase.database().ref(`/Spaces/${creatorId}/`).update({
        //     count: firebase.database.ServerValue.increment(1),
        // })

        firebase.database().ref(`/Spaces/${creatorId}/`).onDisconnect().update({
            count: firebase.database.ServerValue.increment(-1)
        });

        listening(creatorId);
        writer(creatorId)
    };

    useEffect(() => {
        if (currentSpace) {
            firebase.database().ref(`/Spaces/${currentSpace}/`).onDisconnect().update({
                count: firebase.database.ServerValue.increment(-1)
            });

            firebase.database().ref(`/Spaces/${currentSpace}/online`).on("value", function (snap) {
                setOnline(snap.val())
            })
        }

    }, [currentSpace])

    const fetchUpdate = (creatorId) => {

        spaceOwnerData(creatorId);

    };


    const listening = (creatorId) => {
        let docRef = firebase.database().ref(`/Spaces/${creatorId}/data/word`);
        keyPressFunction(docRef);
    };


    useEffect(() => {
        let linksRef = firebase.database().ref('/Spaces/');
        linksRef.orderByChild('count').endAt(limit).limitToLast(1).once("value", function (snapshot) {
            if (snapshot.val()) {

                array = Object.keys(snapshot.val())
                values = Object.values(snapshot.val())

                const id = array[0]

                setCurrentSpace(id)
                const number = values[0].count

                setLimit(number)
                fetchUpdate(id)
                console.log(array, values);
                linksRef.orderByChild("count").equalTo(number).once("value", function (snap) {
                    if (snap.val()) {

                        const keys = Object.keys(snap.val())
                        array.push(Object.keys(snap.val())[0])
                        values.push(Object.values(snap.val())[0])
                        console.log(snap.val(), keys, number);
                        if (keys.length > 1) {
                            snap.forEach((doc) => {
                                const index = array.indexOf(doc.key)
                                if (index === -1) {
                                    array.push(doc.key)
                                    values.push(doc.val())
                                }
                                console.log(array);
                            })
                        }
                        else {
                            linksRef.orderByChild('count').endAt(values[values.length - 1].count - 1).limitToLast(1).once("value", function (snapshot) {
                                if (snapshot.val()) {
                                    array.push(Object.keys(snapshot.val())[0])
                                    values.push(Object.values(snapshot.val())[0])
                                    const number1 = Object.values(snapshot.val())[0].count

                                    console.log(array, snapshot.val(), values)

                                    linksRef.orderByChild("count").equalTo(number1).once("value", function (snap) {
                                        if (snap.val()) {

                                            const keys = Object.keys(snap.val())

                                            if (keys.length > 1) {
                                                snap.forEach((doc) => {
                                                    const index = array.indexOf(doc.key)
                                                    if (index === -1) {
                                                        array.push(doc.key)
                                                        values.push(doc.val())
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
            setState((e) => ({
                ...e,
                value: "",
            }));
            firebase.database().ref(`/Spaces/${currentSpace}/data`).update({ word: "" })
            firebase.database().ref(`/Spaces/${currentSpace}/`).update({ writer: name })
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


    const autoFocus = () => {
        textInputRef.current.focus()

    }


    const nextCard = async () => {
        counter = counter + 1

        let linksRef = firebase.database().ref('/Spaces/');
        console.log(currentSpace, array, counter);
        if (array.length - counter <= 2) {

            await linksRef.orderByChild('count').endAt(values[values.length - 1].count - 1).limitToLast(1).once("value", async function (snapshot) {
                console.log(snapshot.val(), array.length, counter);
                if (snapshot.val()) {

                    array.push(Object.keys(snapshot.val())[0])
                    values.push(Object.values(snapshot.val())[0])

                    const id = array[0]
                    const number = Object.values(snapshot.val())[0].count

                    linksRef.orderByChild("count").equalTo(number).once("value", function (snap) {
                        if (snap.val()) {

                            const keys = Object.keys(snap.val())
                            console.log(snap.val(), keys);
                            if (keys.length > 1) {
                                snap.forEach((doc) => {
                                    const index = array.indexOf(doc.key)
                                    if (index === -1) {
                                        array.push(doc.key)
                                        values.push(doc.val())
                                    }
                                    console.log(array);
                                    //array = keys
                                })
                            } else {
                                console.log(false);
                            }
                        }
                    })

                    //nextData(id)
                }
            })
        }

        if (counter >= array.length) {
            openNotification('bottomLeft', "no more creations.")
        } else {
            setState((e) => ({
                ...e,
                value: "",
            }));
            firebase.database().ref(`/Spaces/${array[counter]}/`).once("value", function (snapshot) {
                if (snapshot.val()) {
                    setLimit(snapshot.val().count)
                }

            })

            setCurrentSpace(array[counter])
            fetchUpdate(array[counter])

            // nextData(array[counter])
        }

    }

    const onDown = () => {

        counter = counter - 1
        if (array[counter]) {
            setState((e) => ({
                ...e,
                value: "",
            }));
            firebase.database().ref(`/Spaces/${currentSpace}/data/word`).off()
            firebase.database().ref(`/Spaces/${currentSpace}/writer`).off()
            firebase.database().ref(`/Spaces/${currentSpace}/`).onDisconnect().cancel()
            firebase.database().ref(`/Spaces/${currentSpace}/`).update({
                count: firebase.database.ServerValue.increment(-1)
            })

            setCurrentSpace(array[counter])
            fetchUpdate(array[counter])
        } else {
            counter = counter + 1
        }
        console.log(currentSpace, array, counter);
        //setRedirect(true)

    }

    const goToLogin = () => {
        if (currentSpace) {
            firebase.database().ref(`/Spaces/${currentSpace}/`).onDisconnect().cancel()
            firebase.database().ref(`/Spaces/${currentSpace}/`).update({
                count: firebase.database.ServerValue.increment(-1)
            })
            firebase.database().ref(`/Spaces/${currentSpace}/data/word`).off()
            firebase.database().ref(`/Spaces/${currentSpace}/writer`).off()
        }

        setRedirect(true)
    }

    const onUP = () => {


        firebase.database().ref(`/Spaces/${currentSpace}/`).onDisconnect().cancel()
        if (currentSpace) {


            firebase.database().ref(`/Spaces/${currentSpace}/`).update({
                count: firebase.database.ServerValue.increment(-1)
            })
            firebase.database().ref(`/Spaces/${currentSpace}/data/word`).off()
            firebase.database().ref(`/Spaces/${currentSpace}/writer`).off()
        }
        setCurrentSpace("")
        nextCard()
    }

    const goToSpace = () => {
        if (currentSpace) {
            firebase.database().ref(`/Spaces/${currentSpace}/`).onDisconnect().cancel()
            firebase.database().ref(`/Spaces/${currentSpace}/`).update({
                count: firebase.database.ServerValue.increment(-1)
            })
            firebase.database().ref(`/Spaces/${currentSpace}/data/word`).off()
            firebase.database().ref(`/Spaces/${currentSpace}/writer`).off()
        }
        setToSpace(true)
    }

    const forward = () => {
        setShowVideo(true)
        setShowText(false)
    }

    const backward = () => {
        setShowVideo(false)
        setShowText(true)
    }

    const onSwiping = ({ dir }) => {
        if (dir === UP) {
            onUP()

        }

        if (dir === DOWN) {

            onDown()

        }

    }


    return redirect ? <Login /> : toSpace ? <Redirect push to={`/space/${mySpace}`} /> : (
        <Swipeable onSwiped={(eventData) => onSwiping(eventData)} preventDefaultTouchmoveEvent={true} trackMouse={true} style={{ height: height }}>

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
                                <View style={{ marginLeft: width <= 600 ? width / 1.05 - 23 : width / 1.05, cursor: 'pointer', position: 'absolute' }} onClick={goToLogin}>
                                    <AccountCircleIcon />
                                </View>
                            </Tooltip>

                            :

                            <Tooltip title="my space">
                                <View style={{ marginLeft: width <= 600 ? width / 1.05 - 23 : width / 1.05, cursor: 'pointer', position: 'absolute' }} onClick={goToSpace}>
                                    <AddToHomeScreenIcon />
                                </View>
                            </Tooltip>

                        }

                        <View style={{ height: 1, background: 'black', marginTop: 28, position: 'absolute', width: width }}></View>

                        <Text style={{ letterSpacing: 1, fontFamily: 'Ubuntu, sans-serif', fontSize: width < 600 ? (width / state.value.length + state.value.length) : (state.value.length === 2 ? height / 1.8 : (state.value.length) + height / (state.value.length / 2)), textAlign: 'center', width: width, marginTop: width <= 600 ? height / 4 : height / 10 }}>{state.value}</Text>

                    </View>

                    <View style={{ display: 'flex', flexFlow: 'column', alignItems: 'flex-end', marginRight: width <= 600 ? '4%' : '2%', marginTop: height / 2.5, position: 'absolute', marginLeft: width - 45, display: show ? 'block' : 'none' }} >
                        {counter !== 0 ?

                            <Tooltip title="previous">
                                <View style={{ cursor: 'pointer', marginBottom: 10 }} onClick={onDown}>
                                    <KeyboardArrowUpIcon />
                                </View>
                            </Tooltip>

                            : null}
                        {counter < array.length ?

                            <Tooltip title="next">
                                <View style={{ cursor: 'pointer', marginTop: 10 }} onClick={onUP}>
                                    <KeyboardArrowDownIcon />

                                </View>
                            </Tooltip>

                            : null}

                        {/* {showText && turn === name && online ?
                            <>
                                <View style={{ backgroundColor: 'white', height: 28, width: 28, borderRadius: '50%', cursor: 'pointer' }} onClick={forward}>
                                    <KeyboardArrowRightIcon style={{ margin: 'auto' }} />
                                </View>
                                <br />
                            </>
                            : null}
                        {showVideo ?
                            <>
                                <View style={{ backgroundColor: 'white', height: 28, width: 28, borderRadius: '50%', cursor: 'pointer' }} onClick={backward}>
                                    <KeyboardArrowLeftIcon style={{ margin: 'auto' }} />
                                </View>
                                <br />
                            </>
                            : null} */}
                    </View>

                </View>

                <View style={{ position: 'absolute', width: width, marginTop: height / 1.08, marginLeft: (width - (width / 1.1)) / 2.1, zIndex: 99999 }}>
                    <Input
                        onChange={handleInputMobile}
                        placeholder="Type message.."
                        value={word}
                        type="text"
                        style={{ width: width / 1.1, height: width < 600 ? 40 : 37, borderRadius: 30, paddingLeft: 20, paddingRight: width <= 600 ? '15%' : '7%' }}
                        disabled={turn === name && online ? false : true}
                    />

                </View>
                {turn !== name && online ?
                    <Button
                        style={{
                            border: 'none', color: 'green', fontWeight: 600, zIndex: 99999, width: 30, position: 'absolute', marginTop: width <= 600 ? height / 1.08 : height / 1.08, marginLeft: width <= 600 ? width / 1.25 : width / 1.11, background: "transparent", height: width < 600 ? 40 : 37, fontSize: 11
                        }}
                        onClick={takeTurn}>
                        Take
                        </Button>
                    : null}

            </View>
            {/* { turn === name && online ?
                <View style={{ opacity: showVideo ? 1 : 0, position: 'absolute', zIndex: showVideo ? null : '-1' }}>
                    {name !== "" ?
                        <VideoRoom myName={name} spaceName={currentSpace} />
                        : null}
                </View>
                : null} */}
        </Swipeable>
    )
}