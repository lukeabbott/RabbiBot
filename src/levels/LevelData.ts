export interface SpawnPoint {
  col: number;
  row: number;
}

export interface RobotSpawn {
  col: number;
  row: number;
  patrolLeft: number;
  patrolRight: number;
}

export interface LevelData {
  name: string;
  width: number;  // in tiles
  height: number; // in tiles
  tiles: number[][]; // 2D array [row][col]
  playerSpawn: SpawnPoint;
  carrots: SpawnPoint[];
  gems: SpawnPoint[];
  portal: SpawnPoint;
  robots?: RobotSpawn[];
  bombs?: SpawnPoint[];
  gemsRequired: number;
}
