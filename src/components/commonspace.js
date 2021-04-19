//imports
import React, { useState, useEffect } from "react";
import { Dimensions, View, } from "react-native";

import { notification } from 'antd';

import firebase from "firebase";

import ServerLessSpaces from './serverless/spaces'

import { useParams, useHistory } from "react-router-dom";
import Spaces from "./spaces";
const { width, height } = Dimensions.get("window");

const guestId = "guest_" + Math.random().toString(36).slice(2)
export default function CommonSpace({ serverless, myName }) {
    const { spaceId } = useParams();
    const [name, setName] = useState(myName)
    const [creator, setCreator] = useState(false)

    useEffect(() => {
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                setCreator(true)
                //loggedIn user
                const name1 = user.email.replace('@achintya.org', '')
                setName(name1)
                console.log('current user ', user);

            } else {
                setName(myName)
                setCreator(false)
                console.log('not logged in');
            }
        });
    }, [])


    return (
        <View>

            {serverless ?
                <View style={{ height: height }}>
                    {name ?
                        <View>
                            <ServerLessSpaces myName={name} />
                        </View>
                        : null}
                </View>
                :
                <Spaces />
            }
            {/* {name !== "" ?
                <VideoRoom myName={name} spaceName={spaceId} creator={creator} />
                : null} */}
        </View>
    )
}

