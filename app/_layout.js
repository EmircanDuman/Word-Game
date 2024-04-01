import { Provider } from "react-redux";
import store from "./redux/store";
import { App } from "./index";

export default function Layout() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}
