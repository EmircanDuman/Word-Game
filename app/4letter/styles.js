import { StyleSheet } from "react-native";

export default StyleSheet.create({
  root: { padding: 20, minHeight: 300 },
  title: { textAlign: "center", fontSize: 30 },
  codeFiledRoot: { marginTop: 20 },
  cell: {
    width: 40,
    height: 40,
    lineHeight: 38,
    fontSize: 24,
    borderWidth: 4,
    borderColor: "#00000030",
    textAlign: "center",
    margin: 10,
  },
  focusCell: {
    borderColor: "#000",
  },
  firstCodeField: {
    marginBottom: 20, // Adjust the value as needed
  },
});
