import React, { useState } from "react";
import { PermissionsAndroid } from "react-native";
import { mediaDevices } from "react-native-webrtc";
import socketio from "socket.io-client";

import {
  SOCKET_SERVER,
  PEER_SERVER_HOST,
  PEER_SERVER_PORT,
  PEER_SERVER_PATH,
} from "server";
import Peer from "react-native-peerjs";

const initialValues = {
  user: {
    _id: "",
    username: "",
    displayName: "",
    email: "",
    avatar: null,
    createdShows: [],
    showShowNotifications: ""
  },
  spotifyData: null,
  activeShow: {
    _id: "",
    name: "",
    description: "",
    averageColor: "",
  },
  activeTrack: {
    id: "",
    name: "",
    uri: "",
    imageUri: null,
    artists: [] 
  },
  peerId: "",
  localStream: null,
  remoteStreams: [],
  remoteUsers: [],
  initialize: () => {},
  joinShow: () => {}, // start show
  toggleMute: () => {},
  isMuted: false,
  leaveShow: () => {}, //leaveShow
  reset: () => {},
  activeCalls: [], // activeShow
};

export const MainContext = React.createContext(initialValues);

const MainContextProvider = ({ children }) => {
  const [user, setUser] = useState(initialValues.user);
  const [spotifyData, setSpotifyData] = useState(initialValues.spotifyData)
  const [activeShow, setActiveShow] = useState(initialValues.activeShow);
  const [activeTrack, setActiveTrack] = useState(initialValues.activeTrack);
  const [peerId, setPeerId] = useState(initialValues.peerId);
  const [localStream, setLocalStream] = useState(initialValues.localStream);
  const [remoteStreams, setRemoteStreams] = useState(
    initialValues.remoteStreams
  );
  const [remoteUsers, setRemoteUsers] = useState(initialValues.remoteUsers);
  const [socket, setSocket] = useState(null);
  const [peerServer, setPeerServer] = useState(null);
  const [isMuted, setIsMuted] = useState(initialValues.isMuted);
  const [activeCalls, setActiveCalls] = useState(initialValues.activeCalls);

  const checkPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message: "We need access to your microphone so you can join the stage",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the microphone");
        initialize();
      } else {
        console.log("Microphone permission denied");
        // TODO: deal with permission denial
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const initialize = async () => {
    const constraints = {
      audio: true,
      video: false,
    };
      
    const newStream = await mediaDevices.getUserMedia(constraints)

    setLocalStream(newStream);
      
    const io = await socketio.connect(SOCKET_SERVER, {
      reconnection: true,
      autoConnect: true,
    });
      
    io.on("connect", () => {
      console.log('CONNECTED');
      setSocket(io);
      
      const peer = new Peer(undefined, {
        host: PEER_SERVER_HOST,
        path: PEER_SERVER_PATH,
        secure: true,
        port: PEER_SERVER_PORT,
        config: {
          iceServers: [
            {
              urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
              ],
            },
          ],
        },
      });
      // console.log('socket', socket);

      setPeerServer(peer);
      // console.log(peerServer);
    
      // set
      peer.on("error", (err) => console.log("Peer server error", err));
    
      peer.on("open", (peerId) => {
        setPeerId(peerId)
      })

      // console.log(peerId);
    
      io.emit("register", user, peerId); // register user

      
  
      // when a new user joins the room, all users start a call with the new user
      io.on("user-joined-show", (participant) => {
        // console.log(user, activeShow, newStream, peer)
        io.emit("call", user._id, activeShow._id);
        setRemoteUsers([...remoteUsers, participant.userId]);

        if (!peer) {
          console.log('Peer server or socket connection not found');
          return;
        } else {
          console.log('there is a peerServer')
        }

        try {
          console.log('calling: ', participant.peerId, 'my local stream: ', newStream.active)
          const call = peer.call(participant.peerId, newStream);
          console.log('call', call);
          
          call.on(
            "stream",
            (stream) => {
              setActiveCalls([...activeCalls, call]);
              setRemoteStreams([...remoteStreams, stream]);
            },
            (err) => {
              console.error("Failed to get call stream", err);
            }
            );
        } catch (error) {
          console.log("Calling error", error);
        }
      });

      // answering a call
      io.on("call", (userId) => {
        peerServer.on("call", (call) => {
          setRemoteUsers([...remoteUsers, userId]);
          call.answer(localStream);
          setActiveCalls([...activeCalls, call]);
          
          call.on("stream", (stream) => {
            setRemoteStreams([...remoteStreams, stream]);
          });
          
          call.on("close", () => { 
            closeCall();
          });
          
          call.on("error", () => {});
        });
      });
    })
  }

  const joinShow = (activeShow) => {
    if (!activeShow._id) {
      console.log("Show not found");
      return;
    }

    const eventInfo = {
      showId: activeShow._id,
      user: user,
      userId: user._id,
      peerId
    }
    
    socket.emit("user-join-show", eventInfo, ({showId, userId, peerId, role}) => {
      console.log(`
    Participant: 
    showId: ${showId}
    userId: ${userId}
    peerId: ${peerId}
    is now set to the ${role} role.`)});

  };

  const toggleMute = () => {
    if (localStream)
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
  };

  const leaveShow = () => {
    activeCalls?.forEach((call) => {
      call.close();
    });
    setActiveCalls([]);
    setRemoteUsers([]);
  };

  const resetShow = () => {
    return (
      {
        _id: "",
        name: "",
        description: "",
      }
    )};

    const resetTrack = () => {
    return (
      {
        id: "",
        name: "",
        uri: "",
        imageUri: null,
        artists: []
      }
    )};

  return (
    <MainContext.Provider
      value={{
        user,
        setUser,
        spotifyData,
        setSpotifyData,
        activeShow,
        setActiveShow,
        activeTrack,
        setActiveTrack,
        peerId,
        setPeerId,
        localStream,
        setLocalStream,
        remoteStreams,
        setRemoteStreams,
        remoteUsers,
        setRemoteUsers,
        checkPermissions,
        initialize,
        joinShow,
        toggleMute,
        isMuted,
        setIsMuted,
        leaveShow,
        resetShow,
        resetTrack,
        activeCalls,
        setActiveCalls,
        socket,
        peerServer
      }}
    >
      {children}
    </MainContext.Provider>
  );
};

export default MainContextProvider;

// 'inspiration': https://github.com/metehankurucu/react-native-video-calling-app/blob/main/src/store/MainProvider.tsx
