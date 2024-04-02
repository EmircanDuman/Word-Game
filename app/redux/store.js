import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userslice";
import intervalReducer from "./intervalslice";

export default configureStore({
  reducer: {
    mevcutuser: userReducer,
    interval: intervalReducer,
  },
});
