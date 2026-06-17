
import { LOGIN_SUCCESS, LOGIN_FAILURE } from '../actions/auth';

const initialState = {
  isAuthenticated: false,
  customerInfo: null,
  error: null
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        customerInfo: action.payload,
        error: null
      };
    case LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        customerInfo: null,
        error: action.payload
      };
    default:
      return state;
  }
};

export default authReducer;
