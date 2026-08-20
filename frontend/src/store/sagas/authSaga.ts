import { call, put, takeLatest } from 'redux-saga/effects';
import { 
  loginStart, 
  loginSuccess, 
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure
} from '../slices/authSlice';

function* loginSaga(action: ReturnType<typeof loginStart>): Generator<any, void, any> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flashdepo-api.onrender.com';
    const response = yield call(fetch, `${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action.payload)
    });
    
    const data = yield call([response, response.json]);
    
    if (!response.ok) {
      throw new Error(data.error || 'Giriş başarısız');
    }
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    yield put(loginSuccess({ token: data.token, user: data.user }));
  } catch (error: any) {
    yield put(loginFailure(error.message));
  }
}

function* registerSaga(action: ReturnType<typeof registerStart>): Generator<any, void, any> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flashdepo-api.onrender.com';
    const response = yield call(fetch, `${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action.payload)
    });
    
    const data = yield call([response, response.json]);
    
    if (!response.ok) {
      throw new Error(data.error || 'Kayıt başarısız');
    }
    
    yield put(registerSuccess());
  } catch (error: any) {
    yield put(registerFailure(error.message));
  }
}

export function* watchAuthSagas() {
  yield takeLatest(loginStart.type, loginSaga);
  yield takeLatest(registerStart.type, registerSaga);
}
