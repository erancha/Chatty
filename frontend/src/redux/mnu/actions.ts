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
