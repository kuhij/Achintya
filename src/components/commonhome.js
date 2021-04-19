//imports
import React, { useState, useEffect } from "react";
import { Dimensions, View, } from "react-native";

import { notification } from 'antd';

import { Switch } from 'antd';

import ServerLessLogin from './serverless/login'
import Login from "./login";

import { useParams, useHistory } from "react-router-dom";


const { width, height } = Dimensions.get("window");

const guestId = "guest_" + Math.random().toString(36).slice(2)
export default function CommonHome() {
    const { spaceId } = useParams();
    const [name, setName] = useState("")
    const [creator, setCreator] = useState(false)
    const [serverless, setServerLess] = useState(true)

    function onChange(checked1) {
        console.log(`switch to ${checked1}`);
        setServerLess(checked1)
    }

    return (
        <View>
            <Switch defaultChecked onChange={onChange} style={{ width: '3%', marginLeft: width / 1.04, position: 'absolute', marginTop: 15, zIndex: 99999 }} />
            {serverless ?
                <ServerLessLogin />
                :
                <Login />
            }
        </View>
    )
}

