import { LevelData } from './LevelData';

// 0=empty, 1=ground surface, 2=ground fill, 3=platform, 4=small platform
const _ = 0, S = 1, F = 2, P = 3, Q = 4;

const tiles: number[][] = [
  //60 columns wide
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,Q,Q,_,_,_,_,_,_,_,_,_,_,_,P,P,P,_,_,_,_,_,_,_,_,_,_,_,_,Q,Q,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,P,P,P,_,_,_,_,_,_,_,_,_,_,Q,Q,_,_,_,_,_,_,_,_,_,_,_,Q,Q,_,_,_,_,_,_,_,_,_,_,P,P,P,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,P,P,_,_,_,_,_,_,_,_,_,P,P,P,_,_,_,_,_,_,P,P,P,_,_,_,_,_,_,_,_,_,_,_,P,P,P,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S,S],
  [F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F],
];

// ~25 gems — fewer but more intentional placement
const gems = [
  // Ground level clusters (row 7)
  { col: 5, row: 7 }, { col: 6, row: 7 },
  { col: 12, row: 7 }, { col: 13, row: 7 },
  { col: 22, row: 7 }, { col: 23, row: 7 },
  { col: 33, row: 7 }, { col: 34, row: 7 },
  { col: 44, row: 7 }, { col: 45, row: 7 },
  { col: 50, row: 7 },
  // Platform gems — require jumping
  { col: 8, row: 3 }, { col: 9, row: 3 }, { col: 10, row: 3 },
  { col: 14, row: 2 },
  { col: 18, row: 4 }, { col: 19, row: 4 },
  { col: 27, row: 2 }, { col: 28, row: 2 },
  { col: 30, row: 4 },
  { col: 35, row: 3 },
  { col: 39, row: 4 }, { col: 40, row: 4 },
  { col: 42, row: 2 },
  { col: 47, row: 3 }, { col: 48, row: 3 },
];

// Carrots on ground only (require crouch to pick up)
const carrots = [
  { col: 4, row: 7 },
  { col: 10, row: 7 },
  { col: 16, row: 7 },
  { col: 20, row: 7 },
  { col: 26, row: 7 },
  { col: 30, row: 7 },
  { col: 36, row: 7 },
  { col: 40, row: 7 },
  { col: 46, row: 7 },
  { col: 52, row: 7 },
];

export const level1: LevelData = {
  name: 'Circuit Meadow',
  width: 60,
  height: 10,
  tiles,
  playerSpawn: { col: 2, row: 7 },
  carrots,
  gems,
  portal: { col: 57, row: 7 },
  gemsRequired: 12,
  robots: [
    { col: 15, row: 7, patrolLeft: 10, patrolRight: 20 },
    { col: 40, row: 7, patrolLeft: 35, patrolRight: 45 },
  ],
};
