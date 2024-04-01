import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userslice";

export default configureStore({
  reducer: {
    mevcutuser: userReducer,
  },
});
