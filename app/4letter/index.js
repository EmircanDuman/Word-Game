//TODO BELKİ STYLES SHEET İLE YAPILABİLİR

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Text, View } from "react-native";
import { useSelector } from "react-redux";
import tw from "twrnc";
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from "react-native-confirmation-code-field";
import styles from "./styles";

export default function Room() {
  const PORT = process.env.PORT || 3000;
  const name = useSelector((state) => state.mevcutuser.name);
  const [otherUser, setOtherUser] = useState("");
  const [opponentWord, setOpponentWord] = useState("");
  const [opponentWordExists, setOpponentWordExists] = useState(false);
  const [ownWord, setOwnWord] = useState(null);

  const CELL_COUNT = 4;
  const [cellColors, setCellColors] = useState([
    Array.from({ length: CELL_COUNT }, () => "rgb(255, 255, 255)"), // White color for the first row
    Array.from({ length: CELL_COUNT }, () => "rgb(255, 255, 255)"), // Yellow color for the second row
    Array.from({ length: CELL_COUNT }, () => "rgb(255, 255, 255)"), // Green color for the third row
    Array.from({ length: CELL_COUNT }, () => "rgb(255, 255, 255)"),
  ]);

  useEffect(() => {
    console.log(cellColors[0][0]);
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://192.168.1.37:${PORT}/getroom`, {
          params: {
            username: name,
            roomtype: "4letter",
          },
        });
        const room = res.data.room;
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

  useEffect(() => {
    let intervalID = setInterval(async () => {
      try {
        if (ownWord !== null) clearInterval(intervalID);
        const res = await axios.get(`http://192.168.1.37:${PORT}/getroom`, {
          params: {
            username: name,
            roomtype: "4letter",
          },
        });

        if (name === res.data.room.user1) {
          setOwnWord(res.data.room.user1word);
        } else {
          setOwnWord(res.data.room.user2word);
        }
      } catch (error) {
        console.error("Error occurred while fetching room:", error);
      }
    }, 1000);
  }, []);

  const initialFieldValues = Array(5).fill("");
  const [fieldValues, setFieldValues] = useState(initialFieldValues);
  const refs = fieldValues.map(() =>
    useBlurOnFulfill({ value: "", cellCount: CELL_COUNT })
  );
  const [propsArray, getCellOnLayoutHandlers] = useClearByFocusCell({
    value: "",
    setValue: (index, value) => {
      const newValues = [...fieldValues];
      newValues[index] = value;
      setFieldValues(newValues);
    },
  });

  const SubmitEnemyWord = async () => {
    const res = await axios.get(`http://192.168.1.37:${PORT}/getword`, {
      params: {
        kelime: fieldValues[0],
      },
    });
    if (res.data.exists) {
      setOpponentWordExists(true);
      setOpponentWord(fieldValues[0]);
      const updateRes = await axios({
        method: "post",
        url: `http://192.168.1.37:${PORT}/setenemyword`,
        data: {
          username: name,
          roomtype: "4letter",
          word: fieldValues[0],
        },
      });
    } else {
      console.log("failure");
    }
  };

  const SubmitTry = (index, submittedValue) => {
    for (let i = 0; i < CELL_COUNT; i++) {
      const cellValue = ownWord[i]; //orijinal
      const submittedChar = submittedValue[i];
      if (!ownWord.includes(submittedChar)) {
        const newCellColors = [...cellColors[index]];
        newCellColors[i] = "rgb(128, 128, 128)"; // Grey color in RGB format
        setCellColors(newCellColors);
      } else {
        if (cellValue === submittedChar) {
          const newCellColors = [...cellColors[index]];
          newCellColors[i] = "rgb(0, 255, 0)"; // Grey color in RGB format
          setCellColors(newCellColors);
        } else if (ownWord.includes(submittedChar)) {
          const newCellColors = [...cellColors[index]];
          newCellColors[i] = "rgb(255, 255, 0)"; // Grey color in RGB format
          setCellColors(newCellColors);
        }
      }
    }
  };

  return (
    <View style={tw`flex flex-col items-center justify-center h-full`}>
      <View style={tw`flex flex-col gap-5`}>
        <View style={tw`flex flex-row gap-4`}>
          <Text>Your enemy is:</Text>
          <Text style={tw`text-red-400`}>{otherUser}</Text>
        </View>
        <Text style={tw`text-red-400 font-bold`}>
          Pick a Turkish word for your opponent:
        </Text>
      </View>
      {opponentWordExists ? (
        <Text style={tw`text-red-400 font-bold`}>
          The opponent word is: {opponentWord}
        </Text>
      ) : (
        <View key={0} style={styles.firstCodeField}>
          <CodeField
            ref={refs[0]}
            {...propsArray[0]}
            value={fieldValues[0]}
            onChangeText={(text) => {
              const newValues = [...fieldValues];
              newValues[0] = text;
              setFieldValues(newValues);
            }}
            onSubmitEditing={SubmitEnemyWord}
            cellCount={CELL_COUNT}
            rootStyle={styles.codeFieldRoot}
            keyboardType="ascii-capable"
            textContentType="oneTimeCode"
            renderCell={({ index, symbol, isFocused }) => (
              <Text
                key={index}
                style={[styles.cell, isFocused && styles.focusCell]}
                onLayout={getCellOnLayoutHandlers(index)}
              >
                {symbol || (isFocused ? <Cursor /> : null)}
              </Text>
            )}
          />
        </View>
      )}
      {opponentWordExists && ownWord === null && (
        <Text>Please wait for opponent to submit a word...</Text>
      )}
      {opponentWordExists &&
        ownWord !== null &&
        fieldValues.slice(1).map((value, i) => (
          <View key={i + 1} style={styles.firstCodeField}>
            <CodeField
              ref={refs[i + 1]}
              {...propsArray[i + 1]}
              value={value}
              onChangeText={(text) => {
                const newValues = [...fieldValues];
                newValues[i + 1] = text;
                setFieldValues(newValues);
              }}
              onSubmitEditing={() => SubmitTry(i, fieldValues[i])}
              cellCount={CELL_COUNT}
              rootStyle={styles.codeFieldRoot}
              keyboardType="ascii-capable"
              textContentType="oneTimeCode"
              renderCell={({ index, symbol, isFocused }) => (
                <Text
                  key={index}
                  style={[
                    styles.cell,
                    isFocused && styles.focusCell,
                    {
                      backgroundColor: cellColors[i][index],
                    }, // Apply cell colors here
                  ]}
                  onLayout={getCellOnLayoutHandlers(index)}
                >
                  {symbol || (isFocused ? <Cursor /> : null)}
                </Text>
              )}
            />
          </View>
        ))}
    </View>
  );
}
