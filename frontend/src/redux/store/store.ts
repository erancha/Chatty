import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '../reducers/reducers';
import initialState from '../initialState';

const store = configureStore({
  reducer: rootReducer,
  preloadedState: initialState,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
