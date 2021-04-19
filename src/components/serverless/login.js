import React, { useState, useEffect } from "react";
import { Dimensions, View, } from "react-native";

import { notification, Button, Input, Tooltip } from 'antd';

import { Redirect, useHistory } from "react-router-dom";
import { UserOutlined } from '@ant-design/icons';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import ServerLessSpaces from './spaces'

const { width, height } = Dimensions.get("window");


export default function ServerLessLogin(params) {
    const history = useHistory();

    const [username, setUsername] = useState("")
    const [redirect, setRedirect] = useState(false)
    const [select, setSelect] = useState(false)
    const [spaceName, setSpaceName] = useState("")
    const [showTop, setShowTop] = useState(false)


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

    }

    const handleSpaceName = (e) => {
        setSpaceName(e.target.value)

    }

    const selectSpace = () => {

        setRedirect(true)
        //history.push(`/space/${spaceName}`);

    }


    return redirect ? <ServerLessSpaces myName={username} spaceId={spaceName} /> : (
        <View style={{ height: height, width: width, overflow: 'hidden' }}>
            <img
                src="../favicon.png"
                alt="logo"
                style={{ height: 25, width: 25, margin: 10 }}

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
                        <Button style={{ width: height / 3, height: 40 }} onClick={() => setSelect(true)}>
                            Proceed
                        </Button>
                        <br />


                    </View >
                    <View style={{ display: 'flex', flexFlow: 'column', alignItems: 'flex-end', marginRight: width <= 600 ? '4%' : '2%', marginTop: height / 1.3, position: 'absolute', marginLeft: width - 45 }}>
                        {!showTop ?

                            <>
                                <Tooltip title="top-creators">
                                    <View style={{ backgroundColor: 'white', height: 28, width: 28, borderRadius: '50%', cursor: 'pointer' }} onClick={() => setShowTop(true)}>
                                        <KeyboardArrowDownIcon style={{ margin: 'auto' }} />

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
                        Enter
                        </Button>
                </View>
            }
        </View>
    )

}