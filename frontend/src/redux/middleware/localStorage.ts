import { Middleware } from '@reduxjs/toolkit';
import { ADD_MESSAGE, MARK_MESSAGE_VIEWED } from '../actions/actions';
import { AppState } from '../actions/types';

export const loadMessagesFromStorage = () => {
  try {
    const serializedState = localStorage.getItem('messages');
    return serializedState ? JSON.parse(serializedState) : [];
  } catch (e) {
    console.error('Could not load state from localStorage', e);
    return [];
  }
};
export const localStorageMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  if (action.type === ADD_MESSAGE || action.type === MARK_MESSAGE_VIEWED) {
    const state = store.getState() as AppState;
    localStorage.setItem('messages', JSON.stringify(state.msg.messages));
  }

  return result;
};
