import { db, database, messaging } from "../App";
import firebase from "firebase";
import React, { useEffect, useState, useRef } from "react";
import { Dimensions, Text, TextInput, View } from "react-native";
import { useParams } from "react-router-dom";
import { Swipeable, LEFT, RIGHT, UP, DOWN } from "react-swipeable";
import { useSelector } from "react-redux";
import useActionDispatcher from "../Hooks/useActionDispatcher";
import { SET_KEYS_TRUE, UPDATE_USER_DATA } from "../Store/actions";
import TextBroadCast from "./groups";

let values = []
let stop = false
let shift = false
//let timer;

export default function Replay(props) {
    const { username } = useParams();
    const dispatchAction = useActionDispatcher();
    const user_data = useSelector((state) => state.globalUserData);

    //const [increment, setIncrement] = useState(0)
    const [count, setCount] = useState(-1);
    const [visitPast, setVisitPast] = useState(false)
    const [latest, prevLatest] = useState(null)
    const [replayText, setReplayText] = useState(null)
    const [messgOwner, setOwner] = useState("")

    //const [creationCount, setCreationCount] = useState(0)

    const docRef = firebase.firestore.FieldPath.documentId()
    const path = database.collection("Spaces").doc(user_data.joinedSpace).collection("words").orderBy(docRef)


    messaging.onMessage((payload) => {
        //setMessage(payload.data.status)
        const obj = JSON.parse(payload.data.status)
        const update = obj.data
        setReplayText(update)
        setOwner(obj.name)
        console.log("on message works!", payload.data);
    });


    const replayMessage = () => {
        const keyArr = Object.keys(replayText)
        const valArr = Object.values(replayText)

        let increment = 0

        let counter = 16
        var myFunction = async function () {
            console.log(counter, valArr[increment]);

            await values.push(valArr[increment])

            increment = await increment + 1
            setCount(prev => prev + 1)
            counter = parseInt(keyArr[increment]) - parseInt(keyArr[increment - 1])
            console.log(values);
            const timer = setTimeout(myFunction, counter);

            if (keyArr[increment] === undefined || keyArr[increment] === null) {
                clearTimeout(timer)
                dispatchAction(UPDATE_USER_DATA, {
                    data: {
                        showLive: false,
                    },
                });
                shift = true
                // setTimeout(() => {
                //     setMessage("")
                // }, 5000);
                //alert('Replay stream finished')
            }

        }
        setTimeout(myFunction, counter)
    }

    useEffect(() => {
        if (replayText !== null) {
            replayMessage()
        }

    }, [replayText])

    // useEffect(() => {
    //     const path = database.collection("Spaces").doc(user_data.joinedSpace).collection("words")
    //     path.where("start", "==", true).orderBy("time", "desc").limit(2).get().then((querySnapshot) => {
    //         console.log(querySnapshot.docs[0].data().time, querySnapshot.docs[1].data());
    //         const arr = new Array(querySnapshot.docs[0].data().time + "", querySnapshot.docs[1].data().time + "")
    //         prevLatest(arr)
    //     })
    // }, [])

    // const replay = async () => {
    //     let arr = []
    //     const id = latest[creationCount]
    //     await path.startAt(id).limit(2).get().then((querySnapshot) => {
    //         arr = new Array(querySnapshot.docs[0].id, querySnapshot.docs[1].id)
    //         values.push(querySnapshot.docs[1].data().word)
    //         console.log(arr);
    //         console.log(values);
    //     })

    //     let counter = parseInt(arr[1]) - parseInt(arr[0])
    //     console.log(counter);
    //     var myFunction = async function () {
    //         setIncrement(prev => prev + 1)
    //         console.log(values, arr);
    //         await path.where(docRef, ">", arr[1]).limit(1).get().then(async (querySnapshot) => {
    //             //console.log(querySnapshot.docs[0].data());
    //             if (querySnapshot.empty) {
    //                 //console.log(querySnapshot.docs[0].data());
    //                 stop = true
    //                 shift = true
    //                 dispatchAction(UPDATE_USER_DATA, {
    //                     data: {
    //                         showLive: false,
    //                     },
    //                 });
    //                 alert('replay finished')
    //             } else {

    //                 if (querySnapshot.docs[0].data().word === null) {
    //                     stop = true
    //                     return alert('session finished')
    //                 }
    //                 console.log(querySnapshot.docs[0].data());
    //                 arr.shift()
    //                 arr.push(querySnapshot.docs[0].id)
    //                 values.push(querySnapshot.docs[0].data().word)
    //                 //console.log(values, arr);
    //             }
    //         })

    //         counter = parseInt(arr[1]) - parseInt(arr[0])
    //         console.log(counter);
    //         const timer = setTimeout(myFunction, counter);
    //         console.log(counter);
    //         if (stop === true) {
    //             clearTimeout(timer)
    //         }
    //     }

    //     setTimeout(myFunction, counter)
    // }

    // useEffect(() => {
    //     if (latest !== null) {
    //         replay()
    //         console.log(latest);
    //     }
    // }, [latest, creationCount])

    const onSwiping = async ({ dir }) => {
        if (dir === RIGHT) {
            setVisitPast(true)

            if (count >= values.length - 1) {
                alert('no more words')
            } else {
                setCount(prev => prev + 1)
            }
            console.log(count, values.length);
        }
        if (dir === LEFT) {
            setVisitPast(true)

            if (count < 1) {
                alert('no more words')
            } else {
                setCount(prev => prev - 1)
                console.log(count, values.length);
            }
        }
        if (dir === UP) {
            console.log('up');
            //clearTimeout(timer)

            // if (creationCount < 1) {
            //     setCreationCount(prev => prev + 1)
            // } else {
            //     const path = database.collection("Spaces").doc(user_data.joinedSpace).collection("words")
            //     path.where("start", "==", true).where("time", "<", parseInt(latest[1])).limit(1).get().then((querySnapshot) => {
            //         if (querySnapshot.empty) {
            //             shift = true
            //             dispatchAction(UPDATE_USER_DATA, {
            //                 data: {
            //                     showLive: false,
            //                 },
            //             });
            //         } else {
            //             const arr = new Array(0, querySnapshot.docs[0].data().time + "")
            //             prevLatest(arr)
            //         }
            //     })
            // }

        }
    }

    return (
        shift ? <TextBroadCast /> :
            <Swipeable onSwiped={(eventData) => onSwiping(eventData)} preventDefaultTouchmoveEvent={true} trackMouse={true} >
                <View style={{ height: 490, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {values.length > 0 && count >= 0 ?
                        <View>
                            {visitPast === true ?
                                <p style={{ fontSize: values[values.length - (count + 1)].length === 1 ? "70vw" : (75 / (values[values.length - (count + 1)].length) + 10) + "vw", textAlign: 'center' }}>
                                    {values[values.length - (count + 1)]}
                                </p>
                                :
                                <p style={{ fontSize: values[count].length === 1 ? "70vw" : (75 / (values[count].length) + 10) + "vw", textAlign: 'center' }}>
                                    {values[count]}
                                </p>
                            }
                        </View>

                        : null}
                </View>
            </Swipeable>
    )

}