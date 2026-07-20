export const MOVE_DELTA = 2;
export const BLOCKED_SEARCH_RADIUS = 5;
export const SIMULATOR_TICK_INTERVAL_NAME = 'simulator-tick';

// A robot walking home counts as "arrived" once within this Chebyshev
// distance of the origin — exact (0,0) may be occupied by another robot
// that got there first, so it docks in the nearest open cell instead.
export const ARRIVAL_RADIUS = MOVE_DELTA;
