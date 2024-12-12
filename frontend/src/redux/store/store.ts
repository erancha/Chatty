import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers';
import initialState from './initialState';

const store = configureStore({
  reducer: rootReducer,
  preloadedState: initialState,
});

export type AppDispatch = typeof store.dispatch;

export default store;
