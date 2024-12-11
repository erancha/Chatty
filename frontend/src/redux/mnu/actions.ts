// show or hide the overview.
export const TOGGLE_OVERVIEW = 'TOGGLE_OVERVIEW';
export interface IToggleOverview {
  type: typeof TOGGLE_OVERVIEW;
  payload: boolean;
}
export const toggleOverview = (show: boolean): IToggleOverview => ({
  type: TOGGLE_OVERVIEW,
  payload: show,
});

// open or close the menu.
export const TOGGLE_MENU = 'TOGGLE_MENU';
export interface IToggleMenu {
  type: typeof TOGGLE_MENU;
  payload: boolean;
}
export const toggleMenu = (isOpen: boolean): IToggleMenu => ({
  type: TOGGLE_MENU,
  payload: isOpen,
});

// show or hide the time filter:
export const TOGGLE_TIME_FILTER = 'TOGGLE_TIME_FILTER';
export interface IToggleTimeFilter {
  type: typeof TOGGLE_TIME_FILTER;
  payload: boolean;
}
export const toggleTimeFilter = (isVisible: boolean): IToggleTimeFilter => ({
  type: TOGGLE_TIME_FILTER,
  payload: isVisible,
});

// set the time window value in the state.
export const SET_TIME_WINDOW = 'SET_TIME_WINDOW';
export interface ISetTimeWindow {
  type: typeof SET_TIME_WINDOW;
  payload: number | null;
}
export const setTimeWindow = (minutes: number | null): ISetTimeWindow => ({
  type: SET_TIME_WINDOW,
  payload: minutes,
});
