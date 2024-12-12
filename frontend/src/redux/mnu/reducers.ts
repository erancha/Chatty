import { MnuState } from '../store/types';
import initialState from '../store/initialState';
import { TOGGLE_OVERVIEW, TOGGLE_MENU, IToggleOverview, IToggleMenu } from './actions';

type HandledActions = IToggleOverview | IToggleMenu;

export const mnuReducers = (state: MnuState = initialState.mnu, action: HandledActions): MnuState => {
  switch (action.type) {
    case TOGGLE_OVERVIEW:
      return { ...state, showOverview: action.payload };
    case TOGGLE_MENU:
      return { ...state, menuOpen: action.payload };
    default:
      return state;
  }
};
