import React, { useEffect, useState } from "react";
import axios from "axios";
import { Text, View } from "react-native";
import { useSelector } from "react-redux";
import tw from "twrnc";

export default function Room() {
  const PORT = process.env.PORT || 3000;
  const name = useSelector((state) => state.mevcutuser.name);
  const [otherUser, setOtherUser] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `http://192.168.1.37:${PORT}/getroom`,
          {
            params: {
              username: name,
              roomtype: "4letter",
            },
          }
        );
        console.log("test");
        const room = response.data.room;
        const user1 = room.user1;
        const user2 = room.user2;

        // Determine the other user
        const otherUser = user1 === name ? user2 : user1;
        setOtherUser(otherUser);
      } catch (error) {
        console.error("Error occurred while fetching room:", error);
      }
    };

    fetchData();
  }, [name]);

  return (
    <View style={tw`flex flex-col items-center justify-center h-full`}>
      <Text>You are: {name}</Text>
      <Text>Playing against: {otherUser}</Text>
    </View>
  );
}
