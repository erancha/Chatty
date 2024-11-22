import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '../reducers/reducers';
import { localStorageMiddleware } from '../middleware/localStorage';
import initialState from '../initialState';

const store = configureStore({
  reducer: rootReducer,
  preloadedState: initialState,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(localStorageMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
