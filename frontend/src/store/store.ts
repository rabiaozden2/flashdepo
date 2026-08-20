import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import campaignReducer from './slices/campaignSlice';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import rootSaga from './rootSaga';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
    reducer: {
        campaign: campaignReducer,
        auth: authReducer,
        cart: cartReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
