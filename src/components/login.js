import React, { useState, useEffect } from "react";
import { Dimensions, View, Image, Text, } from "react-native";

import { notification, Button, Input, Tooltip } from 'antd';

import firebase from "firebase";
import { Redirect, useHistory } from "react-router-dom";
import { UserOutlined } from '@ant-design/icons';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import Spaces from "./spaces";
import TopCreators from "./topcreators";
import CommonSpace from './commonspace'

const { width, height } = Dimensions.get("window");


export default function Login(params) {
    const history = useHistory();

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [redirect, setRedirect] = useState(false)
    const [exist, setExist] = useState(false)
    const [showCreations, setShowCreations] = useState(false)
    const [select, setSelect] = useState(false)
    const [spaceName, setSpaceName] = useState("")
    const [available, setAvailable] = useState(false)
    const [showTop, setShowTop] = useState(false)

    const [userPwd, setUserPwd] = useState("")


    const openNotification = (placement, message) => {
        notification.info({
            message: `Alert`,
            description:
                `${message}`,
            placement
        });
    };

    const handleUsername = (e) => {
        setUsername(e.target.value)
        firebase.database().ref(`/Users/${e.target.value}/`).on("value", function (snap) {
            if (snap.val()) {
                setExist(true)
                setUserPwd(snap.val().password)
            }
        })
    }

    const handleSpaceName = (e) => {
        setSpaceName(e.target.value)
        firebase.database().ref(`/Spaces/${e.target.value}/`).on("value", function (snap) {
            if (snap.val()) {
                setAvailable(false)
            } else {
                setAvailable(true)
            }
        })
    }


    const selectSpace = () => {
        if (available) {
            firebase.database().ref(`/Spaces/${spaceName}/`).update({
                online: true
            })
            firebase.database().ref(`/Users/${username}/`).update({
                currentSpace: spaceName,
                mySpace: spaceName
            })

            setRedirect(true)
            history.push(`/space/${spaceName}`);
        } else {
            openNotification('bottomLeft', "spacename exists! Please select another one.")
        }
    }

    const signUp = () => {
        firebase.auth().createUserWithEmailAndPassword(username + "@achintya.org", password).then(function (result) {
            const username = result.user['email'].replace('@achintya.org', '')
            console.log(username, 'successfully signed up');

            firebase.database().ref(`/Users/${username}/`).update({
                currentSpace: spaceName,
                mySpace: spaceName
            })

            setUsername(username)
            setSelect(true)
        }).catch(function (error) {
            const errorCode = error.code;
            const errorMessage = error.message
            console.log(errorMessage, errorCode);
        });
    }

    const login = () => {

        firebase.auth().signInWithEmailAndPassword(username + "@achintya.org", password).then(function (result) {
            console.log(result.user['email'].replace('@achintya.org', ''), result.user)
            const username = result.user['email'].replace('@achintya.org', '')
            const name = result.user.uid


            setUsername(username)
            setRedirect(true)
            firebase.database().ref(`/Users/${username}/mySpace`).once("value", function (snap) {
                setSpaceName(snap.val())
                history.push(`/space/${snap.val()}`);
            })


        }).catch(function (error) {
            const errorCode = error.code;
            const errorMessage = error.message
            console.log(errorMessage, errorCode);
        });

    }



    return redirect ? <Redirect push to={`/space/${spaceName}`} /> : showTop ? <TopCreators /> : (
        <View style={{ height: height, width: width, overflow: 'hidden', background: "#fafafa" }}>
            <img
                src="../favicon.png"
                alt="logo"
                style={{ height: 25, width: 25, margin: 10, marginTop: 14 }}

            />

            {!select ?
                <>
                    <View style={{ display: 'flex', flexFlow: 'column', width: height / 3, marginTop: height / 2.8, marginLeft: width <= 600 ? '22%' : '42%' }}>
                        <Input
                            id="standard-text"
                            label="username"
                            type="text"
                            placeholder="enter username"
                            prefix={<UserOutlined />}
                            style={{ height: 40, width: height / 3, fontSize: 14 }}
                            value={username}
                            onChange={handleUsername}
                        />

                        <br />
                        <Input
                            id="standard-password"
                            label="password"
                            type="text"
                            prefix={<UserOutlined />}
                            type="password"
                            placeholder="enter password"
                            style={{ height: 40, width: height / 3, fontSize: 14 }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <br />
                        <Button style={{ width: height / 3, height: 40 }} onClick={exist ? login : signUp}>
                            {exist ? "LogIn" : "SignUp"}
                        </Button>
                        <br />


                    </View >
                    <View style={{ marginRight: width <= 600 ? null : '2%', marginTop: width <= 600 ? height / 1.3 : height / 2.3, position: 'absolute', marginLeft: width <= 600 ? (width / 2) : width - 45 }}>
                        {!showTop ?

                            <>
                                <Tooltip title="top-creators">
                                    <View style={{ cursor: 'pointer' }} onClick={() => setShowTop(true)}>
                                        <KeyboardArrowDownIcon />

                                    </View>
                                </Tooltip>
                                <br />
                            </>

                            : null}
                    </View>
                </>
                :
                <View style={{ display: 'flex', flexFlow: 'column', width: height / 3, marginTop: height / 2.8, marginLeft: width <= 600 ? '22%' : '42%' }}>
                    <Input
                        id="standard-text"
                        label="spacename"
                        type="text"
                        placeholder="Enter spacename"
                        prefix={<UserOutlined />}
                        style={{ height: 40, width: height / 3, fontSize: 14 }}
                        value={spaceName}
                        onChange={handleSpaceName}
                    />

                    <br />
                    <Button style={{ width: height / 3, height: 40 }} onClick={selectSpace}>
                        Proceed
                        </Button>
                </View>
            }
        </View>
    )

}