//imports
import React, { useState, useEffect } from "react";
import { Dimensions, View, } from "react-native";

import { notification } from 'antd';

import ServerLessTextPage from './one-one'

import { useParams, useHistory } from "react-router-dom";
const { width, height } = Dimensions.get("window");


const guestId = "guest_" + Math.random().toString(36).slice(2)
let counter = 0
export default function ServerLessSpaces({ myName, spaceId }) {
    //const { spaceId } = useParams();
    const history = useHistory();

    const openNotification = (placement, message) => {
        notification.info({
            message: `Alert`,
            description:
                `${message}`,
            placement
        });
    };


    return (
        <View style={{ height: "100%" }}>

            <View>
                {myName !== "" ?
                    <ServerLessTextPage myName={myName} spaceName={spaceId} />
                    : null}
                <View style={{ display: 'flex', flexFlow: 'column', alignItems: 'flex-end', marginRight: width <= 600 ? '4%' : '2%', marginTop: height / 1.6, position: 'absolute', marginLeft: width - 45 }}>

                    {/* <>
                            <View style={{ backgroundColor: 'white', height: 28, width: 28, borderRadius: '50%', cursor: 'pointer' }} onClick={forward}>
                                <KeyboardArrowRightIcon style={{ margin: 'auto' }} />
                            </View>
                            <br />
                        </>

                        <>
                            <View style={{ backgroundColor: 'white', height: 28, width: 28, borderRadius: '50%', cursor: 'pointer' }} onClick={backward}>
                                <KeyboardArrowLeftIcon style={{ margin: 'auto' }} />
                            </View>
                            <br />
                        </> */}

                </View>
            </View>

        </View>

    )
}