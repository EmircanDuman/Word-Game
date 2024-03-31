//!! HEARTBEAT.JS'i burada return() içine component olarak ekle ve user'ı 8 saniyede bir kontrol eden bir interval'ın olsun
// ANCAK BU SADECE SEÇİLİ USER'I UPDATELER, UYGULAMAYI KAPATMIŞ BİR KULLANICIYI KONTROL EDEN MEKANİZMA HENÜZ YOK

import axios from "axios";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import tw from "twrnc";

export default function App() {
  const PORT = process.env.PORT || 3000;

  const [status, setStatus] = useState("Haven't tried yet");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

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
        setStatus("Found user");
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
      case "Found user":
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
      color: "red", // Corrected typo here
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
        onChangeText={(text) => setName(text)} // Use text instead of e
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
        onChangeText={(text) => setPassword(text)} // Use text instead of e
      />

      <Text style={getStatusColor(status)}>{status}</Text>
      <Button title="Login" onPress={() => userLogin()} />
      <Button title="Register" onPress={() => userRegister()} />
      <StatusBar style="dark" />
    </View>
  );
}
