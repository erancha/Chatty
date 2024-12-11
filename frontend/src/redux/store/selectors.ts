import { createSelector } from 'reselect';
import { AppState } from './types';
import { DEFAULT_TIME_WINDOW_DAYS } from './constants';

// Selector to get the timeWindowDays from state
export const selectTimeWindow = (state: AppState) => state.mnu.timeWindowDays;

// Create a selector that returns timeWindowDays or a default value
export const selectEffectiveTimeWindow = createSelector([selectTimeWindow], (timeWindowDays) =>
  timeWindowDays !== null && timeWindowDays !== undefined ? timeWindowDays : DEFAULT_TIME_WINDOW_DAYS
);
