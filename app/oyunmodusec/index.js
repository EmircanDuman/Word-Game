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

  const CreateRoom = async (username, roomtype) => {
    try {
      const response = await axios.post(
        `http://192.168.1.37:${PORT}/createroom`,
        {
          user1: username,
          roomtype: roomtype,
        }
      );
      return response.data; // Optionally return data from the server
    } catch (error) {
      console.error("Error creating room:", error);
      throw error; // Throw the error for error handling in the calling code
    }
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
            title="4 oyuncu"
            style={tw`p-5`}
            onPress={() => CreateRoom(name, "4letter")}
          />
          <Button title="5 oyuncu" style={tw`p-5`} />
        </View>
        <View style={tw`flex flex-col gap-5`}>
          <Button title="6 oyuncu" style={tw`p-5`} />
          <Button title="7 oyuncu" style={tw`p-5`} />
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
