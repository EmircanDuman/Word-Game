//buraya iki buton eklesen yeter, veya
// Sabit / Sabit olamyan
//  4       4
//  5       5
//  6       6
//  7       7
//şeklinde bir sayfa ayarla

import { Text, View } from "react-native";
import { useSelector } from "react-redux";
import tw from "twrnc";

export default function OyunModuSec() {
  const name = useSelector((state) => state.mevcutuser.name);
  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-center`}>Current user is: {name}</Text>
    </View>
  );
}
