import { loginFailure, loginStart, loginSuccess } from "./userRedux";
import { publicRequest } from "../utils/requestMethods";
import { handleRequestErrorAlert } from "../utils/errorHandlers";

export const login = async (dispatch, user) => {
  dispatch(loginStart());
  try {
    const res = await publicRequest.post("/auth/login", user);
    dispatch(loginSuccess(res.data));
  } catch (err) {
    dispatch(loginFailure());
    handleRequestErrorAlert(err);
    throw new Error(err.response?.data?.error);
  }
};
