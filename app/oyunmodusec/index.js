import { Button, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import tw from "twrnc";
import { stopHeartbeat } from "../../server/Heartbeat";
import { setName as setReduxName } from "../redux/userslice";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import axios from "axios";

export default function OyunModuSec() {
  const PORT = process.env.PORT || 3000;

  const name = useSelector((state) => state.mevcutuser.name);
  const intervalId = useSelector((state) => state.interval.intervalId);
  const [directive, setDirective] = useState("CHOOSE LETTER COUNT");
  const dispatch = useDispatch();

  useEffect(() => {
    setDirective("CHOOSE LETTER COUNT");
  }, []);

  const logoutUser = async () => {
    stopHeartbeat(intervalId);
    setDirective("Logging out...");
    setTimeout(() => {
      router.push("/");
      dispatch(setReduxName(""));
    }, 1000);
  };

  const joinGame = async ({ username, roomtype }) => {
    setDirective("Joining...");
    setTimeout(async () => {
      const res = await axios.get(`http://192.168.174.64:${PORT}/joinroom`, {
        params: {
          username: username,
          roomtype: roomtype,
        },
      });
      switch (roomtype) {
        case "4letter":
          router.push("/4letter");
          break;
        case "5letter":
          router.push("/5letter");
          break;
        case "6letter":
          router.push("/6letter");
          break;
        case "7letter":
          router.push("/7letter");
          break;
      }
    }, 500);
  };

  return (
    <View style={tw`flex-1 justify-center items-center gap-10`}>
      <View style={tw`flex flex-row`}>
        <Text style={tw`text-center`}>Current user is: </Text>
        <Text style={tw`text-blue-700`}>{name}</Text>
      </View>
      <View style={tw`w-full flex items-center justify-center`}>
        <Text>{directive}</Text>
      </View>
      <View style={tw`flex flex-row gap-5`}>
        <View style={tw`flex flex-col gap-5`}>
          <Button
            title="4 harfli"
            style={tw`p-5`}
            onPress={() =>
              joinGame({
                username: name,
                roomtype: "4letter",
              })
            }
          />
          <Button
            title="5 harfli"
            style={tw`p-5`}
            onPress={() =>
              joinGame({
                username: name,
                roomtype: "5letter",
              })
            }
          />
        </View>
        <View style={tw`flex flex-col gap-5`}>
          <Button
            title="6 harfli"
            style={tw`p-5`}
            onPress={() =>
              joinGame({
                username: name,
                roomtype: "6letter",
              })
            }
          />
          <Button
            title="7 harfli"
            style={tw`p-5`}
            onPress={() =>
              joinGame({
                username: name,
                roomtype: "7letter",
              })
            }
          />
        </View>
        <Button
          title="Logout"
          style={{ textAlign: "center" }}
          onPress={() => logoutUser()}
        />
      </View>
    </View>
  );
}
