//imports
import React, { useState, useEffect } from "react";
import { Dimensions, View, Text, TextInput } from "react-native";

import { notification, Button, Input, Tooltip } from 'antd';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

import firebase from "firebase";


import { useParams, useHistory } from "react-router-dom";
const { width, height } = Dimensions.get("window");

export default function TextPage({ currentData, turn, myName, mySpace, online, takeTurn }) {
    const { spaceId } = useParams();
    const [word, setWord] = useState("")
    const history = useHistory()

    const openNotification = (placement, message) => {
        notification.info({
            message: `Alert`,
            description:
                `${message}`,
            placement
        });
    };


    const onSignOut = () => {
        firebase.auth().signOut().then(() => {
            firebase.database().ref(`/Spaces/${mySpace}/`).update({
                online: false,
                count: firebase.database.ServerValue.increment(-1)
            })
            console.log('successfully signed out');
            openNotification('bottomLeft', "Successfully logged out.")
            history.push("/")
        }).catch((error) => {
            console.log(error);
        });

    }

    const handleInputMobile = (e) => {
        setWord(e.target.value)
        const time = Date.now()
        var space = e.target.value.charAt(e.target.value.length - 1)

        // console.log(e.target.value, space);
        if (space == " ") {
            let wrd = word
            firebase.firestore().collection("Spaces").doc(spaceId).collection("Timeline").doc(time.toString()).set({
                username: myName,
                word: wrd,
                time: time
            })
            firebase.database().ref(`/Spaces/${spaceId}/data`).update({ word: wrd })

            setWord("")

            console.log('spacebar detected');
        }
    }

    const onclick = () => {
        console.log('clicked');
    }

    return (
        <View style={{ position: "absolute", height: height, width: width, overflow: 'hidden', background: "#fafafa" }}>
            <View
                style={{
                    width: width,
                    overflow: 'hidden',
                    height: height,
                    marginTop: '18px',
                    zIndex: 99999,
                }}
            >
                <View style={{ width: width, height: height }} >
                    {turn ?
                        <Text style={{ textAlign: 'center', fontFamily: 'Orelega One' }}>
                            <span style={{ fontSize: 19 }}>
                                {spaceId.charAt(0).toUpperCase() + spaceId.slice(1)}:
                    </span>
                            {" "}{turn}

                            <Tooltip title={online ? "online" : "offline"}>
                                <View style={{ marginLeft: 6, cursor: 'pointer', background: online ? "green" : "red", height: 9, width: 9, borderRadius: '50%' }}>

                                </View>
                            </Tooltip>
                        </Text>
                        : null}

                    <Tooltip title="sign out">
                        <View style={{ marginLeft: width <= 600 ? width / 1.05 - 23 : width / 1.05, cursor: 'pointer', position: 'absolute' }} onClick={onSignOut}>
                            <ExitToAppIcon />
                        </View>
                    </Tooltip>


                    <View style={{ height: 1, background: 'black', marginTop: 28, position: 'absolute', width: width }}></View>

                    <Text style={{ letterSpacing: 1, fontFamily: 'Ubuntu, sans-serif', fontSize: width < 600 ? (width / currentData.length + currentData.length) : (currentData.length === 2 ? height / 1.8 : (currentData.length) + height / (currentData.length / 2)), textAlign: 'center', width: width, marginTop: width <= 600 ? height / 4 : height / 10 }}>{currentData}</Text>

                </View>
            </View>



            <View style={{ marginTop: height / 1.08, position: 'absolute', marginLeft: (width - (width / 1.1)) / 2.1, zIndex: 99999 }}>
                <Input onChange={handleInputMobile} placeholder="Type message.." value={word} type="text" style={{ width: width / 1.1, height: width < 600 ? 40 : 37, borderRadius: 30, paddingLeft: 20, paddingRight: width <= 600 ? '15%' : '7%' }} disabled={turn === myName ? false : true} />

            </View>
            {turn !== myName ?
                <Button
                    style={{
                        border: 'none', color: 'green', fontWeight: 600, zIndex: 99999, width: 30, position: 'absolute', marginTop: width <= 600 ? height / 1.08 : height / 1.08, marginLeft: width <= 600 ? width / 1.25 : width / 1.11, background: "transparent", height: width < 600 ? 40 : 37, fontSize: 11
                    }}
                    onClick={takeTurn}>
                    Take
                        </Button>
                : null}

        </View>

    )
}