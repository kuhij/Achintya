import React, { useEffect, useState, useRef, Component } from "react";
import { View, Image, Text, Dimensions } from "react-native";
import swal from "sweetalert";
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import { makeStyles } from '@material-ui/core/styles';

const { width, height } = Dimensions.get("window");

const useStyles = makeStyles((theme) => ({
    button: {
        margin: theme.spacing(1),
    },
}));

export default function HomePage(props) {
    const classes = useStyles();
    const [amount, setAmount] = useState(0)

    const openCheckout = (amount) => {
        let options = {
            "key": "rzp_live_1hWjIFVX8QIpW8",
            "amount": amount * 100,
            "name": "Achintya",
            "description": "Space on Achintya",
            "image": "./favicon.png",
            "handler": function (response) {
                if (response.razorpay_payment_id) {
                    swal({
                        title: "Transaction Successful for INR " + (amount * 100) / 100,
                        text: "You will be contacted shortly for verification. You can save your Transaction ID - " + response.razorpay_payment_id.replace('pay_', ''),
                        icon: "success",
                        button: "Okay!",
                        buttonColor: '#000',
                    }).then(() => {
                        setAmount(amount * 100)
                    })
                }
            },
            "notes": {
                "address": "Hello World"
            },
            "theme": {
                "color": "#000"
            }
        };

        let rzp = new window.Razorpay(options);
        rzp.open();

    }

    const addMoney = () => {
        swal({
            text: 'Enter Amount',
            content: "input",
            button: {
                text: "Add",
                closeModal: true,
            },
        }).then((value) => {
            if (parseInt(value) < 100) {
                alert("Amount should be equal or more than 100")
            } else {
                openCheckout(parseInt(value))
            }
        })
    }

    return (
        <View style={{ marginTop: height / 4 }}>
            <View style={{ display: 'flex', alignItems: 'center' }}>
                <Text style={{ fontSize: width < 500 ? 95 : 140 }}>
                    <span>&#8377;</span>: {amount}
                </Text>
                <br />
                <Text style={{ fontSize: 18, fontFamily: 'auto' }}>
                    {props.email}
                </Text>
            </View>
            <br />
            <br />
            <Button
                variant="contained"
                className={classes.button}
                startIcon={<AddIcon />}
                style={{ width: width / 4, margin: 'auto', background: 'black', color: 'white', cursor: 'pointer' }}
                onClick={addMoney}
            >
                Add Money
      </Button>
        </View>
    )

} 