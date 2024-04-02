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
