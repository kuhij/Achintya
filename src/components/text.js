//imports
import React, { useState, useRef, useEffect } from "react";
import { Dimensions, View, Text, TextInput } from "react-native";

import { notification, Button, Input, Tooltip } from 'antd';

import firebase from "firebase";
import {
    CopyOutlined
} from '@ant-design/icons';



import { useParams, useHistory } from "react-router-dom";
const { width, height } = Dimensions.get("window");

export default function TextPage({ currentData, turn, myName }) {
    const { spaceId } = useParams();
    const [word, setWord] = useState("")

    const textInputRef = useRef();

    useEffect(() => {

    }, [])


    //sending letter by letter to rtdb.
    const handleInput = async (event) => {
        const current = event.nativeEvent.key;

        let docRef;

        docRef = firebase.database().ref(`/Spaces/${spaceId}/data`);

        if (current === "Enter") {
            textInputRef.current.focus();
        }

        //while deleting the letters, speaker name shouldn't be deleted
        if (current === "ArrowRight" || current === "ArrowLeft" || current === "ArrowUp" || current === "ArrowDown" || current === "Escape") {
            return null;
        } else if (current === " ") {

            let wrd = word + " "
            // setSingle(wrd)

            docRef.update({ word: wrd }).then(() => {
                textInputRef.current.focus();
            })

            setWord("")
        } else if (current === "Backspace") {
            setWord(word.slice(0, -1))
        } else {
            setWord(word + current)

        }
    };

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
                .then(() => {
                    textInputRef.current.focus();
                })

            setWord("")

            console.log('spacebar detected');
        }
    }

    const autoFocus = () => {
        textInputRef.current.focus()

    }

    return (
        <View>
            <View
                style={{
                    shadowOpacity: 4,
                    width: width,
                    //overflowY: "auto",
                    overflow: 'hidden',
                    height: height * 0.91,
                    marginTop: '18px',
                    zIndex: 99999,

                }}
                onClick={turn === myName ? autoFocus : null}
            >
                <View>
                    <Text style={{ textAlign: 'center', fontWeight: 600, fontFamily: 'cursive' }}>{turn}</Text>

                    <View style={{ height: 1, background: 'black', marginTop: 28, position: 'absolute', width: width }}></View>
                    <Text
                        style={{
                            marginLeft: '10px',
                            margin: 20,
                            fontSize: 15.5,
                            paddingRight: '18px',
                            overscrollBehaviorY: "contain",
                            scrollSnapType: "y proximity",
                            scrollSnapAlign: "end",
                        }}
                    >

                        <View style={{ display: 'flex', flexFlow: 'row' }}>


                            <Text style={{ letterSpacing: 1, fontFamily: 'Ubuntu, sans-serif', fontSize: width < 600 ? (width / currentData.length + currentData.length) : (currentData.length === 2 ? height / 1.8 : (currentData.length) + height / (currentData.length / 2)), textAlign: 'center', width: width, marginTop: width <= 600 ? height / 4 : height / 10 }}>{currentData}</Text>


                            {/* <Text style={{ letterSpacing: 1, fontFamily: 'Ubuntu, sans-serif' }}>{word}</Text> */}

                        </View>

                    </Text>

                </View>

            </View>
            {turn === myName ?

                <View style={{ marginTop: height - 40, position: 'absolute', }}>
                    <Input onChange={handleInputMobile} placeholder="Type message.." value={word} type="text" id="standard-multiline-flexible" style={{ width: width, height: width < 600 ? 40 : 37 }} ref={textInputRef} editable={true} />
                    {/* <Tooltip title="copy link">
                        <CopyOutlined style={{ fontSize: 25, marginLeft: width / 1.03, position: 'absolute', marginTop: 5, cursor: 'pointer' }} onClick={copyLink}/>
                    </Tooltip> */}

                </View>
                : null}

        </View>

    )
}