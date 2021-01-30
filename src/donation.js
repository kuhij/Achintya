import { db, database } from "../../../App";
import * as firebase from "firebase";

import React, { useEffect, useState, useRef } from "react";
import { Dimensions, Text, TextInput, View } from "react-native";

import swal from "sweetalert";

import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import { useParams } from "react-router-dom";
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';

export default function Donation(props) {
    const { username } = useParams();

    const donation = () => {
        swal({
            text: 'Enter Donation Amount',
            content: "input",
            button: {
                text: "Proceed",
                closeModal: false,
            },
        }).then((value) => {
            if (parseInt(value) < 100) {
                alert("Amount should be equal or more than 100")
            } else {
                openCheckout(parseInt(value) * 100)
            }
        })
    }

    const sendingMoney = (razorpay_payment_id) => {
        console.log("payment successful", razorpay_payment_id);
    };

    const openCheckout = async (amount) => {
        let options = {
            "key": "rzp_live_1hWjIFVX8QIpW8",
            "amount": amount,
            "name": "Donation",
            "currency": 'INR',
            "description": `${props.receiver}`,
            "image": "./favicon.png",
            "handler": async function (response) {
                console.log(response)
                if (response.razorpay_payment_id) {
                    sendingMoney(response.razorpay_payment_id);

                    await database.collection("transactions").doc(response.razorpay_payment_id).set({
                        paymentId: response.razorpay_payment_id,
                        claimedAmount: amount
                    }).then(() => {
                        database.collection("transactions").doc(response.razorpay_payment_id).onSnapshot(async function (doc) {
                            if (doc.data()) {
                                if (doc.data().paidAmount === amount && doc.data().status === 1) {
                                    await db.ref(`/Users/${props.receiver}/wallet/`).update({
                                        balance: firebase.database.ServerValue.increment(amount)
                                    }).then(() => {
                                        swal({
                                            title: "Donation Successful",
                                            text:
                                                "Congatulations! Your donation is successful for INR " + amount,
                                            icon: "success",
                                            button: "Proceed",
                                            buttonColor: "#000",
                                        })
                                    })
                                } else {
                                    console.log('payment failed');
                                }
                            }
                        })
                    })
                }
            },
            "prefill": {
                name: "",
                email: "",
            },
            "notes": {
                address: "Hello World",
            },
            "theme": {
                color: "#000000",
            },
        };

        let rzp = new window.Razorpay(options);
        rzp.open();
    };

    return (
        <View style={{ position: "absolute", bottom: 11 }}>
            <Tooltip title="Donate" placement="right">
                <IconButton color="inherit" onClick={donation}>
                    <AttachMoneyIcon />
                </IconButton>
            </Tooltip>
        </View>
    )
}