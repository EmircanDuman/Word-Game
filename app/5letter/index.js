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
  const [sonuc, setSonuc] = useState(null);

  const CELL_COUNT = 5;
  const ROOM_TYPE = "5letter";
  const [cellColors, setCellColors] = useState([
    Array.from({ length: CELL_COUNT }, () => "rgb(255, 255, 255)"),
    Array.from({ length: CELL_COUNT }, () => "rgb(255, 255, 255)"),
    Array.from({ length: CELL_COUNT }, () => "rgb(255, 255, 255)"),
    Array.from({ length: CELL_COUNT }, () => "rgb(255, 255, 255)"),
    Array.from({ length: CELL_COUNT }, () => "rgb(255, 255, 255)"),
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://192.168.1.37:${PORT}/getroom`, {
          params: {
            username: name,
            roomtype: ROOM_TYPE,
          },
        });
        const room = res.data.room;
        const user1 = room.user1;
        const user2 = room.user2;

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
            roomtype: ROOM_TYPE,
          },
        });
        room = res.data.room;

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

  useEffect(() => {
    let intervalID = setInterval(async () => {
      try {
        const res = await axios.get(`http://192.168.1.37:${PORT}/getroom`, {
          params: {
            username: name,
            roomtype: ROOM_TYPE,
          },
        });
        room = res.data.room;

        if (room.user1 === name) {
          if (room.user2word && room.user2try.includes(room.user2word)) {
            clearInterval(intervalID);
            setSonuc("Opponent has won!");
          } else if (room.user1word && room.user1try.includes(room.user1word)) {
            clearInterval(intervalID);
            setSonuc("You have won");
          }
        } else if (room.user2 === name) {
          if (room.user1word && room.user1try.includes(room.user1word)) {
            clearInterval(intervalID);
            setSonuc("Opponent has won!");
          } else if (room.user2word && room.user2try.includes(room.user2word)) {
            clearInterval(intervalID);
            setSonuc("You have won");
          }
        }
      } catch (error) {
        console.error("Error occured during usertry check: ", error);
      }
    }, 1000);
  }, []);

  const initialFieldValues = Array(CELL_COUNT + 1).fill("");
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
          roomtype: ROOM_TYPE,
          word: fieldValues[0],
        },
      });
    } else {
      console.log("failure");
    }
  };

  const SubmitTry = async (index, submittedValue) => {
    setCellColors((prevCellColors) => {
      return prevCellColors.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        const newRow = [...row];

        for (let i = 0; i < CELL_COUNT; i++) {
          const cellValue = ownWord[i];
          const submittedChar = submittedValue[i];

          if (!ownWord.includes(submittedChar)) {
            newRow[i] = "rgb(128, 128, 128)";
          } else {
            if (cellValue === submittedChar) {
              newRow[i] = "rgb(0, 255, 0)";
            } else if (ownWord.includes(submittedChar)) {
              newRow[i] = "rgb(255, 255, 0)";
            }
          }
        }

        return newRow;
      });
    });

    try {
      const response = await axios.get(`http://192.168.1.37:${PORT}/addtry`, {
        params: {
          username: name,
          triedword: submittedValue,
        },
      });
    } catch (error) {
      console.error("Error occurred while adding new try:", error);
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
      {opponentWordExists && ownWord === null && sonuc === null && (
        <Text>Please wait for opponent to submit a word...</Text>
      )}
      {sonuc !== null && <Text style={tw`text-2xl`}>{sonuc}</Text>}
      {opponentWordExists &&
        sonuc === null &&
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
              onSubmitEditing={() => SubmitTry(i, fieldValues[i + 1])}
              cellCount={CELL_COUNT}
              rootStyle={styles.codeFieldRoot}
              keyboardType="ascii-capable"
              textContentType="oneTimeCode"
              editable={[...cellColors][i][0] === "rgb(255, 255, 255)"}
              renderCell={({ index, symbol, isFocused }) => (
                <Text
                  key={index}
                  style={[
                    styles.cell,
                    isFocused && styles.focusCell,
                    {
                      backgroundColor: cellColors[i][index],
                    },
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
