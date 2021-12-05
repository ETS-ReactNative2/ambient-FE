import React, { useEffect, useContext } from "react";
import { MainContext } from "store/MainProvider";
import ShowInfo from "./ShowInfo"
import ShowModalize from "./ShowModalize";

export default function Show({ route: { params: activeShow },  navigation }) {
  
  const { setActiveShow } = useContext(MainContext);

  useEffect(() => {
    setActiveShow(activeShow);
    console.log(`Welcome to show ${activeShow.name}!`);
  }, []);

  return (
    <>
      <ShowInfo {...dummyShowInfo} callback={(screen) => navigation.navigate(screen)} goBack={() => navigation.goBack()} />
      <ShowModalize />
    </>
  );
}

// Dummy variables - DELETE

const dummyBGImage = { uri: "https://f4.bcbits.com/img/a1024330960_10.jpg" };

const dummyShowInfo = {
  showId: "1",
  showTitle: "SHOW NAME",
  showName: "Some show",
  showDescription: "this is a description",
  amountSpeakers: "10",
  amountListeners: "20",
  imageUri: dummyBGImage.uri,
  users: [],
  listenCallback: null,
};
