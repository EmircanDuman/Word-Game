import axios from "axios";
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import tw from "twrnc";
import { setName as setReduxName } from "./redux/userslice";
import { useDispatch } from "react-redux";
import { router } from "expo-router";
import { startHeartbeat } from "../server/Heartbeat";
import { setIntervalId } from "./redux/intervalslice";

const App = () => {
  const PORT = process.env.PORT || 3000;

  const [status, setStatus] = useState("Haven't tried yet");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();

  const userLogin = async () => {
    if (name === "" || password === "") {
      setStatus("Please fill the input areas");
      return;
    } else if (name.length < 5 || password.length < 5) {
      setStatus("Both name and password should be at least 5 characters long");
      return;
    }

    try {
      setStatus("Fetching...");
      const res = await axios.get(`http://192.168.1.37:${PORT}/user`, {
        params: {
          name: name,
          password: password,
        },
      });
      if (res.data.success) {
        setStatus("Logging in...");
        dispatch(setReduxName(res.data.user.name));

        let intervalId = startHeartbeat(res.data.user.name);
        dispatch(setIntervalId(intervalId));

        setTimeout(() => {
          router.push("/oyunmodusec");
        }, 1000);
      } else {
        setStatus("User not found");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const userRegister = async () => {
    if (name === "" || password === "") {
      setStatus("Please fill the input areas");
      return;
    } else if (name.length < 5 || password.length < 5) {
      setStatus("Both name and password should be at least 5 characters long");
      return;
    }

    try {
      setStatus("Fetching...");
      const res = await axios.get(
        `http://192.168.1.37:${PORT}/user/checkname`,
        {
          params: {
            name: name,
          },
        }
      );

      if (!res.data.success) {
        setStatus("Adding new user...");
        const newUserRes = await axios({
          method: "post",
          url: `http://192.168.1.37:${PORT}/user`,
          data: {
            name: name,
            password: password,
            status: "Offline",
          },
        });

        if (newUserRes.data.success) {
          setStatus("User added successfully");
        } else {
          setStatus(newUserRes.data.message);
        }
      } else {
        setStatus("User already exists");
      }
    } catch (error) {
      console.error("Error registering user:", error);
      setStatus("Error registering user");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Haven't tried yet":
        return statusStyles.black;
      case "Fetching...":
        return statusStyles.purple;
      case "Please fill the input areas":
      case "Both name and password should be at least 5 characters long":
        return statusStyles.red;
      case "Logging in...":
        return statusStyles.green;
      case "User not found":
        return statusStyles.red;
      case "Adding new user...":
        return statusStyles.blue;
      case "User added successfully":
        return statusStyles.green;
      case "User already exists":
        return statusStyles.darkyellow;
      case "Error registering user":
        return statusStyles.red;
    }
  };

  const statusStyles = StyleSheet.create({
    purple: {
      color: "purple",
    },
    green: {
      color: "green",
    },
    red: {
      color: "red",
    },
    blue: {
      color: "blue",
    },
    black: {
      color: "black",
    },
    darkyellow: {
      color: "#B8860B",
    },
  });

  return (
    <View style={tw`flex-1 flex-col justify-center items-center gap-4`}>
      <Text>Word Game</Text>
      <TextInput
        style={{
          height: 40,
          borderColor: "gray",
          borderWidth: 1,
          width: 200,
          padding: 10,
        }}
        defaultValue=""
        placeholder="Enter name"
        onChangeText={(text) => setName(text)}
      />
      <TextInput
        style={{
          height: 40,
          borderColor: "gray",
          borderWidth: 1,
          width: 200,
          padding: 10,
        }}
        defaultValue=""
        placeholder="Enter password"
        onChangeText={(text) => setPassword(text)}
      />

      <Text style={getStatusColor(status)}>{status}</Text>
      <Button title="Login" onPress={() => userLogin()} />
      <Button title="Register" onPress={() => userRegister()} />
    </View>
  );
};

export default App;
