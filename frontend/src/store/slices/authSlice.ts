import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  managerTitle?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state, action: PayloadAction<{email: string, password: string}>) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{token: string, user: User}>) {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    registerStart(state, action: PayloadAction<{email: string, password: string, role: string}>) {
      state.loading = true;
      state.error = null;
    },
    registerSuccess(state) {
      state.loading = false;
      state.error = null;
    },
    registerFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
    },
    initializeAuth(state, action: PayloadAction<{token: string, user: User}>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    }
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout,
  initializeAuth
} = authSlice.actions;

export default authSlice.reducer;
