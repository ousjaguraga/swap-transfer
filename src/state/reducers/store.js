import { createSlice, configureStore } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
     customerInfo: {
      sub: '',
      name: '',
      email: '',
      groups: [] 
    },
    error: null
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.customerInfo = {
        sub: action.payload.sub,
        name: action.payload.name,
        email: action.payload.email,
        groups: action.payload.groups // Set the groups property from the payload
      };
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.isAuthenticated = false;
      state.customerInfo = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.customerInfo = null;
      state.error = null;
    },
  },
});

const senderSlice = createSlice({
  name: 'senders',
  initialState: [],
  reducers: {
    setSenders: (state, action) => {
    return action.payload
    },
    addSenders: (state, action) => {
      state.push(action.payload)
    }
  }
})

const transferSlice = createSlice({
  name: 'transfers',
  initialState: [],
  reducers: {
    setTransfers: (state, action) => {
    return action.payload
    },
    addTransfers: (state, action) => {
      state.push(action.payload)
    }
  }
})

// export actions
export const { loginSuccess, loginFailure, logout } = authSlice.actions;
export const { setSenders, addSenders } = senderSlice.actions;
export const {setTransfers, addTransfers } = transferSlice.actions;


// export selectors

// senders
export const selectSenders = (state) => state.senders
// transfers
export const selectTransfers = (state) => state.transfers
// auth
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectError = (state) => state.auth.error;
export const selectCustomerInfo = (state) => state.auth.customerInfo;


const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    senders: senderSlice.reducer,
    transfers: transferSlice.reducer,
  }
});

export default store;
