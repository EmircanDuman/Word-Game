//GOTTA FIGURE OUT A WAY TO DEFINE THE ENTRY POINT AND THEN MOVE ON TO OTHER STUFF IDK MAYBE DO
//SOMETHING ABOUT router.push OR ADD A NAVIGATOR HERE IDK IDK

import { Provider } from "react-redux";
import store from "./redux/store";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <Provider store={store}>
      <Slot />
      <StatusBar style="dark" />
    </Provider>
  );
}
