import React from 'react'
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"
import Loader from 'react-loader-spinner'
import { Dimensions, View } from "react-native";

const { width, height } = Dimensions.get("window");

export default class Loading extends React.Component {
    //other logic
    render() {
        return (
            <View style={{ height: height, width: width, alignItems: "center", justifyContent: "center" }}>
                <Loader
                    type="TailSpin"
                    color="#000"
                    height={100}
                    width={100}
                />
            </View>

        );
    }
}