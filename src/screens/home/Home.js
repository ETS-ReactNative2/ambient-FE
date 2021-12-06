import React, { useContext, useState, useEffect } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Portal } from "react-native-portalize";
import { MenuHome, LiveShow, CreateShowModalize, HomeSong } from "./components";
import { MainContext } from "store/MainProvider";
import { getShows } from "api/shows";

export default function Home({ navigation }) {
  const { user, activeShow, activeTrack } = useContext(MainContext);
  const [liveShows, setliveShows] = useState([]);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    getShows()
      .then((res) => {
        setliveShows(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [activeShow]);

  const openModal = () => {
    setModal((<CreateShowModalize openModal={true} onClose={closeModal} callback={(newShow) => navigation.navigate('Show', newShow)} />));
  }

  const closeModal = () => {
    setModal(null);
  }

  return (
    <>
      <View style={styles.container}>
        <MenuHome 
          user={user} 
          callback={openModal}
        />
        <View style={styles.liveShow}>
          <FlatList
            data={liveShows}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.liveShowItem}>
                <LiveShow
                  showId={item._id}
                  showName={item.name}
                  showDescription={item.description}
                  amountSpeakers={0}
                  amountListeners={0}
                  imageUri={""}
                  listenCallback={() => navigation.navigate("Show", item)}
                />
              </View>
            )}
          />
        </View>
        {activeTrack.id !== "" && <HomeSong
          callback={() => navigation.navigate("Show", activeShow)}
          onPause={() => SpotifyRemote.pause()}
          onPlay={() => SpotifyRemote.playUri("")}
        />}
      </View>
      <Portal>
        {modal}
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  stories: {
    marginVertical: 16,
  },
  liveShow: {
    marginHorizontal: 16,
    flex: 1,
  },
  liveShowItem: {
    marginBottom: 16,
  },
});

const dummyShowImageUri = "https://f4.bcbits.com/img/a1024330960_10.jpg";
