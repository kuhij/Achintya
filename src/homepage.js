import React, { useEffect, useState, useRef, Component } from "react";
import { View, Image, Text, Dimensions } from "react-native";
import swal from "sweetalert";
import firebase from 'firebase';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import ShareIcon from '@material-ui/icons/Share';
import MeetingRoomIcon from '@material-ui/icons/MeetingRoom';
import { TextField } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';
import { useSwipeable, Swipeable, LEFT, RIGHT, UP, DOWN } from "react-swipeable";

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { useHistory, useParams } from "react-router-dom";

import { useSelector } from "react-redux";
import useActionDispatcher from "./Hooks/useActionDispatcher";
import { SET_KEYS_TRUE, UPDATE_USER_DATA } from "./Store/actions";

import Loading from "./Loading";
import Creation from './text/Creation';

import { db, database, messaging } from './App'

const { width, height } = Dimensions.get("window");

const useStyles = makeStyles((theme) => ({
    button: {
        margin: theme.spacing(1),
    },
    root: {
        minWidth: 275,
    },
    bullet: {
        display: 'inline-block',
        margin: '0 2px',
        transform: 'scale(0.8)',
    },
    title: {
        fontSize: 14,
    },
    pos: {
        marginBottom: 12,
    },
}));

let high = {}

export default function HomePage({ name, email }) {
    const classes = useStyles();
    const dispatchAction = useActionDispatcher();
    const history = useHistory();

    const user_data = useSelector((state) => state.globalUserData);

    const [amount, setAmount] = useState(0)
    const [receiver, setReceiver] = useState("")
    const [transfer, setTransfer] = useState(null)

    const [transactions, setTransactions] = useState([])
    const [showTransactions, setShowTransactions] = useState(false)
    const [transactionId, setTransactionId] = useState("")

    const [loading, setLoading] = useState(false);
    const [room, setRoom] = useState(false)
    const [count, setCount] = useState(0)
    const [time, setTime] = useState(null)
    const [showCamp, setShowCamp] = useState(false)

    const [startPrice, setStartPrice] = useState(0);
    const [minVal, setMinVal] = useState(0);
    const [duration, setDuration] = useState(0);
    const [paymentPage, setPaymentPage] = useState(true);
    const [title, setTitle] = useState("");
    const [auctionData, setAuctionData] = useState(null)



    useEffect(() => {
        //const random = Math.floor(Math.random() * 4999)
        db.ref(`/Spaces/${name}/`).on("value", function (snap) {
            setAmount(snap.val().balance)
        })

        messaging
            .requestPermission()
            .then(function () {
                console.log("permission granted");

                return messaging.getToken();
            })
            .then((token) => {
                console.log(token);
                // dispatchAction(UPDATE_USER_DATA, {
                //     data: {
                //         token: token
                //     },
                // });
                database.collection("actions").doc(name).set({
                    subscription: name,
                    fcmtoken: token,
                    time: firebase.firestore.FieldValue.serverTimestamp()
                })
            });
    }, [])

    useEffect(() => {

        let query;
        if (count > 1) {
            console.log(time, count);
            query = database.collection("transactions").where("wallet", "array-contains", name).where("time", '<', time).orderBy("time", "desc").limit(1)
        } else {
            query = database.collection("transactions").where("wallet", "array-contains", name).orderBy("time", "desc").limit(1)
        }
        query.get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                console.log(doc.id, ' => ', doc.data());
                setTransactions(doc.data())
                setTransactionId(doc.id)
                setTime(doc.data().time.toDate())
            })
        })

    }, [count])

    const addMoney = () => {
        swal({
            text: 'Enter Amount',
            content: "input",
            button: {
                text: "Add",
                closeModal: true,
            },
        }).then((value) => {
            const payId = "pay_" + Math.floor(Math.random() * 1000)
            if (parseInt(value) < 100) {
                alert("Amount should be equal or more than 100")
            } else {
                openCheckout(parseInt(value))
            }
        })
    }


    const openCheckout = async (amount) => {
        let options = {
            key: "rzp_live_1hWjIFVX8QIpW8",
            amount: parseInt(amount) * 100,
            name: "Achintya",
            currency: "INR",
            description: `Space on Achintya`,
            image: "./favicon.png",
            handler: async function (response) {
                console.log(response);
                if (response.razorpay_payment_id) {
                    await firebase.firestore().collection("transactions").doc(response.razorpay_payment_id).set({
                        paymentId: response.razorpay_payment_id,
                        claimedAmount: parseInt(amount),
                        wallet: [name, "self"],
                        time: firebase.firestore.FieldValue.serverTimestamp()
                    })
                        .then(() => {
                            firebase.firestore().collection("transactions").doc(response.razorpay_payment_id).onSnapshot(async function (doc) {
                                if (doc.data()) {
                                    if (doc.data().paidAmount) {
                                        if (parseInt(doc.data().paidAmount.slice(0, -1)) === parseInt(amount) && doc.data().status === 1) {

                                            await firebase
                                                .database()
                                                .ref(`/Spaces/${name}/`)
                                                .update({
                                                    balance: firebase.database.ServerValue.increment(parseInt(doc.data().paidAmount.slice(0, -1))),
                                                })
                                                .then(() => {
                                                    swal({
                                                        title:
                                                            "Transaction Successful for INR " + amount,
                                                        text:
                                                            "Congatulations! You got your space on Achintya. You can save your Transaction ID - " +
                                                            response.razorpay_payment_id.replace("pay_", ""),
                                                        icon: "success",
                                                        button: "Okay!",
                                                        buttonColor: "#000",
                                                    }).then(() => {
                                                        setLoading(false);
                                                        dispatchAction(UPDATE_USER_DATA, {
                                                            data: {
                                                                creator: true,
                                                                is_creator: true,
                                                                user_id: name,
                                                                active_room_id: name,
                                                            },
                                                        });
                                                        // firebase.database().ref(`/Spaces/${name}`).update({
                                                        //     online: true,
                                                        // });
                                                        messaging
                                                            .requestPermission()
                                                            .then(function () {
                                                                console.log("permission granted");

                                                                return messaging.getToken();
                                                            })
                                                            .then((token) => {
                                                                database.collection("actions").doc(name).set({
                                                                    subscription: "achintya",
                                                                    fcmtoken: token,
                                                                    time: firebase.firestore.FieldValue.serverTimestamp()
                                                                })
                                                            });
                                                        //history.push(`/${name}`);
                                                    });
                                                });
                                        } else {
                                            setLoading(true);
                                            // history.push(`/`);
                                        }
                                    } else {
                                        setLoading(true);
                                    }
                                } else {
                                    setLoading(true);
                                }
                            });
                        });
                }
            },
            prefill: {
                name: "",
                email: "",
            },
            notes: {
                address: "Hello World",
            },
            theme: {
                color: "#000000",
            },
        };

        let rzp = new window.Razorpay(options);
        rzp.open();
    };

    useEffect(() => {
        if (receiver !== "" && transfer !== null) {
            const payId = "pay_" + Math.floor(Math.random() * 1000)
            database.collection("transactions").doc(payId).set({
                paidAmount: transfer + "-",
                wallet: [name, receiver],
                time: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                db.ref(`/Spaces/${name}/`).update({
                    balance: firebase.database.ServerValue.increment(-parseInt(transfer))
                })
                db.ref(`/Spaces/${receiver}/`).update({
                    balance: firebase.database.ServerValue.increment(parseInt(transfer))
                })
                swal({
                    text: `Successfully transfered`,
                    icon: "success",
                    button: {
                        text: "OK",
                        closeModal: true,
                    },
                })
            })
            console.log(receiver, transfer);
        }

    }, [receiver, transfer])

    const transferMoney = () => {
        if (amount === 0) {
            swal({
                text: 'Insufficient amount in wallet',
                icon: "error",
                button: {
                    text: "OK",
                    closeModal: true,
                },
            })
        }
        swal({
            text: 'Reciver\'s name',
            content: "input",
            button: {
                text: "Proceed",
                closeModal: true,
            },
        }).then((value) => {
            db.ref(`/Spaces/${value}/`).on("value", function (snap) {
                if (snap.val() && value !== name) {
                    console.log(value);
                    setReceiver(value)
                    swal({
                        text: 'Enter Amount',
                        content: "input",
                        button: {
                            text: "Transfer",
                            closeModal: true,
                        },
                    })
                        .then((value) => {
                            if (parseInt(value) > amount) {
                                swal({
                                    text: 'Insufficient amount in wallet',
                                    icon: "error",
                                    button: {
                                        text: "OK",
                                        closeModal: true,
                                    },
                                })
                            } else {
                                setTransfer(value)
                            }

                            //console.log(receiver, value);
                        })
                } else {
                    swal({
                        text: 'User Not Fount!',
                        icon: "error",
                        button: {
                            text: "OK",
                            closeModal: true,
                        },
                    })
                }
            })
        })
    }

    const goToRoom = () => {
        history.push(`/${name}`)
        dispatchAction(UPDATE_USER_DATA, {
            data: {
                creator: true,
                is_creator: true,
                user_id: name,
                active_room_id: name,
            },
        });
        setRoom(true)
    }

    const startBiding = () => {
        db.ref(`/auctions/0`).update({
            title: title,
            duration: parseInt(duration),
            minPrice: parseInt(minVal),
            startPrice: parseInt(startPrice),
            status: 'open',
            owner: name
        })
    }

    const auctionCheckout = (amount) => {
        let options = {
            key: "rzp_live_1hWjIFVX8QIpW8",
            amount: parseInt(amount) * 100,
            name: "Achintya",
            currency: "INR",
            description: `Donation`,
            image: "./favicon.png",
            handler: async function (response) {
                if (response.razorpay_payment_id) {
                    await firebase.firestore().collection("transactions").doc(response.razorpay_payment_id).set({
                        paymentId: response.razorpay_payment_id,
                        claimedAmount: parseInt(amount),
                        wallet: [name, auctionData[0].owner],
                        time: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        firebase.firestore().collection("transactions").doc(response.razorpay_payment_id).onSnapshot(async function (doc) {
                            if (doc.data()) {
                                if (doc.data().paidAmount) {
                                    if (parseInt(doc.data().paidAmount.slice(0, -1)) === parseInt(amount) && doc.data().status === 1) {

                                        await firebase
                                            .database()
                                            .ref(`/auction/0/participants/${name}`)
                                            .update({
                                                donation: firebase.database.ServerValue.increment(parseInt(doc.data().paidAmount.slice(0, -1))),
                                            })
                                            .then(() => {
                                                swal({
                                                    title:
                                                        "Transaction Successful for INR " + amount,
                                                    text:
                                                        "Congatulations! Your donation is successfull. You can save your Transaction ID - " +
                                                        response.razorpay_payment_id.replace("pay_", ""),
                                                    icon: "success",
                                                    button: "Join Auction",
                                                    buttonColor: "#000",
                                                }).then(() => {
                                                    joinAuctionForm()
                                                })
                                            })
                                    }
                                }
                            }
                        })
                    })
                }
            },
            prefill: {
                name: "",
                email: "",
            },
            notes: {
                address: "Hello World",
            },
            theme: {
                color: "#000000",
            },
        }
        let rzp = new window.Razorpay(options);
        rzp.open();
    }

    const joinAuctionForm = () => {
        swal({
            text: 'Enter Biding Amount',
            content: "input",
            button: {
                text: "Add",
                closeModal: true,
            },
        }).then((value) => {
            if (parseInt(value) < auctionData[0].minPrice + auctionData[0].startPrice) {
                swal({
                    text: `Bid value must be higher than current value by INR ${auctionData[0].minPrice}`,
                    icon: "info",
                    button: {
                        text: "OK",
                        closeModal: true,
                    },
                })
            } else {
                db.ref(`/auctions/0/participants/${name}`).update({
                    bidingAmount: parseInt(value)
                })
                db.ref(`/auctions/0`).update({
                    startPrice: firebase.database.ServerValue.increment(parseInt(value))
                })
            }
        })
    }

    const joiAuction = () => {
        swal({
            text: 'Donate INR 1000 to eligible for donation.',
            icon: 'info',
            button: {
                text: "Donate",
                closeModal: true,
            },
        }).then(() => {
            db.ref(`/auctions/0/participants/${name}/donation`).on("value", function (snap) {
                if (snap.val()) {
                    joinAuctionForm()
                } else {
                    auctionCheckout(1000)
                }
            })

        })
    }

    useEffect(() => {
        db.ref("/auctions/").limitToFirst(1).on("value", function (snap) {
            db.ref("/auctions/0/participants/").orderByChild("bidingAmount").limitToLast(1).on("child_added", function (child) {
                if (child.val()) {
                    console.log(child.val(), child.key);
                    high.name = child.key
                    high.amount = child.val().bidingAmount
                } else {
                    return null;
                }

            })
            console.log(snap.val());
            setAuctionData(snap.val())
        })
    }, [])

    useEffect(() => {
        const date = new Date()
        let hours;
        if (auctionData !== null) {
            let days = auctionData[0].duration
            let seconds = days * 24 * 60 * 60 - date.getSeconds()
            const timer = setInterval(() => {
                seconds = seconds - 1
                //hours
                hours = Math.floor(seconds / 60 / 60)
                if (hours === 0) {
                    db.ref(`/auctions/0/`).update({
                        status: 'closed'
                    })
                    clearInterval(timer)
                }
                //console.log(hours);
            }, 1000);

        }
    }, [auctionData])

    const onSwiping = ({ dir }) => {
        if (dir === UP) {
            console.log(transactions.paymentId);
            setShowTransactions(true)
            setCount(count + 1)
        }
        if (dir === DOWN) {
            setShowCamp(true)
            setPaymentPage(false)
        }
    }

    return loading ? (
        <Loading />
    ) : room ? (
        <Creation />
    ) : (
                <Swipeable onSwiped={(eventData) => onSwiping(eventData)} preventDefaultTouchmoveEvent={true} trackMouse={true} >

                    <View>
                        <img src="edit-solid.svg" style={{ height: 30, position: 'absolute', marginLeft: '95%', marginTop: 15, cursor: 'pointer' }} onClick={goToRoom} />
                        {showTransactions === false && paymentPage === true ?
                            <View style={{ marginTop: height / 4 }}>
                                <View style={{ display: 'flex', alignItems: 'center' }}>
                                    <Text style={{ fontSize: width < 500 ? 95 : 140 }}>
                                        <span>&#8377;</span>: {amount}
                                    </Text>
                                    <br />
                                    <Text style={{ fontSize: 18, fontFamily: 'auto' }}>
                                        {email}
                                    </Text>
                                </View>
                                <br />
                                <br />
                                <View style={{ display: 'flex', flexFlow: 'column' }}>
                                    <Button
                                        variant="contained"
                                        className={classes.button}
                                        startIcon={<AddIcon />}
                                        style={{ width: width / 5, margin: 'auto', background: 'black', color: 'white', cursor: 'pointer' }}
                                        onClick={addMoney}
                                    >
                                        Add Money
      </Button>
                                    <br />
                                    <Button
                                        variant="contained"
                                        className={classes.button}
                                        startIcon={<ShareIcon />}
                                        style={{ width: width / 5, margin: 'auto', background: 'black', color: 'white', cursor: 'pointer' }}
                                        onClick={transferMoney}
                                    >
                                        Transfer Money
      </Button>
                                    {auctionData !== null ?
                                        <View style={{ border: 'none', padding: 20 }}>

                                            {/* <View style={{ display: 'flex', flexFlow: 'row', justifyContent: 'space-around' }}>
                                                <Text><b>Title:</b> {auctionData[0].title}</Text>
                                                <Text><b>Auction Status:</b> {auctionData[0].status}</Text>
                                            </View>
                                            <View>
                                                {/* <Text>{high.name}</Text>
                                                <View style={{ display: 'flex', flexFlow: 'column', alignItems: 'center' }}>
                                                    <b>Highest Bid Value</b>
                                                    <br />
                                                    <Text>{auctionData[0].startPrice}</Text>
                                                </View>

                                            </View>
                                            <Text><b>Duration:</b> {auctionData[0].duration}</Text>
                                            <Button variant="contained" color="primary" style={{ marginTop: 15 }} onClick={joiAuction}>
                                                Join Auction
                                            </Button> */}
                                        </View>
                                        : null}
                                </View>

                            </View>
                            : showCamp === true && paymentPage === false ?
                                <View style={{ padding: '30px', width: '50%', margin: 'auto', border: '1px solid', marginTop: '15%' }}>
                                    <TextField
                                        id="standard-text"
                                        label="Title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                    <br />
                                    <TextField
                                        id="standard-number"
                                        label="Min. Inc."
                                        type="number"
                                        value={minVal}
                                        onChange={(e) => setMinVal(e.target.value)}
                                    />
                                    <br />
                                    <TextField
                                        id="standard-number"
                                        label="Biding Duration"
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                    />
                                    <br />
                                    <TextField
                                        id="standard-number"
                                        label="Start Price"
                                        type="number"
                                        value={startPrice}
                                        onChange={(e) => setStartPrice(e.target.value)}
                                    />
                                    <br />
                                    <Button variant="contained" color="primary" onClick={startBiding}>
                                        Primary
                                    </Button>
                                </View>
                                :
                                <View style={{ marginTop: (height / 7) }}>
                                    <h3 style={{ textAlign: 'center', fontFamily: 'auto', marginBottom: 20 }}>Transaction history</h3>
                                    <View style={{ display: 'flex', flexFlow: width < 600 ? "column" : 'row', flexWrap: 'wrap', margin: width < 600 ? "auto" : 15, marginTop: width < 600 ? 15 : null, justifyContent: 'center' }}>

                                        <Card className={classes.root} style={{ width: width / 1.2, margin: 15, height: height / 1.9 }}>
                                            <CardContent style={{ marginTop: 15 }}>
                                                <View style={{ display: 'flex', flexFlow: 'row', justifyContent: 'space-evenly', alignItems: 'center' }}>
                                                    <View>
                                                        <Typography variant="h5" component="h2" style={{ textAlign: 'center', marginBottom: 5, fontSize: 16 }}>
                                                            {transactions.paidAmount.charAt(transactions.paidAmount.length - 1) === "+" ? "Money Added" : "Money Paid"}
                                                        </Typography>
                                                        <Typography variant="h5" component="h2" style={{ fontWeight: 600, marginBottom: 5, fontSize: 20, marginTop: 5 }}>
                                                            <span>&#8377;</span> {transactions.paidAmount.slice(0, -1)}
                                                        </Typography>


                                                        <View style={{ display: 'flex', flexFlow: 'row', marginBottom: 15, marginTop: 10 }}>
                                                            <Typography variant="h5" component="h2" style={{ textAlign: 'center', fontSize: 11 }}>
                                                                {transactions.time.toDate().toString().slice(3, 10)},{"  "}
                                                            </Typography>
                                                            <Typography variant="h5" component="h2" style={{ textAlign: 'center', marginLeft: 2, fontSize: 11 }}>
                                                                {transactions.time.toDate().toString().slice(15, 21)}
                                                            </Typography>
                                                        </View>
                                                    </View>
                                                    <Typography variant="h5" component="h2" style={{ textAlign: 'center', marginBottom: 5, fontSize: 20 }}>
                                                        {transactions.paidAmount.charAt(transactions.paidAmount.length - 1) === "+" ? <button style={{ border: 'none', borderRadius: '50%', background: '#24cc81', color: 'white', width: 20, height: 20 }}>+</button> : <button style={{ border: 'none', borderRadius: '50%', background: '#f84b6e', color: 'white', fontSize: 16, width: 20 }}>-</button>}
                                                    </Typography>


                                                </View>

                                                <View style={{ height: 0.5, width: '100%', background: 'black', marginTop: '2%' }}></View>
                                                <br />
                                                <View style={{ margin: 15, marginTop: '2%' }}>
                                                    <Text>Transaction Id: {transactionId}</Text>
                                                </View>
                                                <TableContainer component={Paper} style={{ marginTop: '2%' }}>
                                                    <Table className={classes.table} aria-label="simple table">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>Dr: </TableCell>
                                                                <TableCell align="right">Cr: </TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            <TableRow >
                                                                <TableCell component="th" scope="row" style={{ fontFamily: 'auto' }}>
                                                                    {transactions.wallet[0]}
                                                                </TableCell>
                                                                <TableCell align="right">{transactions.wallet[1]}</TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>

                                            </CardContent>
                                        </Card>

                                    </View>

                                </View>

                        }
                    </View>
                </Swipeable>
            )

} 