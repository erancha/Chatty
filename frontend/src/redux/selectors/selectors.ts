import { createSelector } from 'reselect';
import { AppState } from '../actions/types';
import { DEFAULT_TIME_WINDOW_HOURS } from '../constants';

// Selector to get the timeWindowHours from state
export const selectTimeWindow = (state: AppState) => state.timeWindowHours;

// Create a selector that returns timeWindowHours or a default value of 24 hours
export const selectEffectiveTimeWindow = createSelector([selectTimeWindow], (timeWindowHours) =>
  timeWindowHours !== null && timeWindowHours !== undefined ? timeWindowHours : DEFAULT_TIME_WINDOW_HOURS
);
