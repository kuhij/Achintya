import React from "react";
import YouTube from "react-player";
import { View, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export default function YoutubeComp({ videoId, opacity }) {
  return (
    <YouTube
      height="100%"
      width="100%"
      playing={true}
      style={{ position: "absolute", top: 0, left: 0, opacity: opacity }}
      url={"https://www.youtube.com/watch?v=" + videoId}
      // videoId={creations[creationIndex]}
    />
  );
}
