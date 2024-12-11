import { MnuState } from '../store/types';
import initialState from '../store/initialState';
import {
  TOGGLE_OVERVIEW,
  TOGGLE_MENU,
  TOGGLE_TIME_FILTER,
  SET_TIME_WINDOW,
  IToggleOverview,
  IToggleMenu,
  IToggleTimeFilter,
  ISetTimeWindow,
} from './actions';

type AppAction = IToggleOverview | IToggleMenu | IToggleTimeFilter | ISetTimeWindow;

export const mnuReducers = (state: MnuState = initialState.mnu, action: AppAction): MnuState => {
  switch (action.type) {
    case TOGGLE_OVERVIEW:
      return { ...state, showOverview: action.payload };
    case TOGGLE_MENU:
      return { ...state, menuOpen: action.payload };
    case TOGGLE_TIME_FILTER:
      return { ...state, timeFilterVisible: action.payload };
    case SET_TIME_WINDOW:
      return { ...state, timeWindowDays: action.payload };
    default:
      return state;
  }
};
