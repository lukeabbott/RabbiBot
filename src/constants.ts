// Colors
export const COLORS = {
  SKY: 0xE8D8F0,
  GROUND_SURFACE: 0xB8E6D0,
  GROUND_FILL: 0x7DBFA0,
  PLATFORM: 0xA0D2DB,
  CIRCUIT_GOLD: 0xFFD93D,
  CIRCUIT_INDIGO: 0xA29BFE,
  CARROT: 0xFF9F43,
  GEM: 0xA29BFE,
  PORTAL: 0x8BE8CB,
  DARK_BG: 0x1a1a2e,
  ENERGY_GREEN: 0x00b894,
  ENERGY_ORANGE: 0xfdcb6e,
  ENERGY_RED: 0xe17055,
};

// Tile
export const TILE_SIZE = 64;

// Player
export const PLAYER_SPEED = 200;
export const PLAYER_JUMP = -480;
export const PLAYER_SCALE = 0.12;
export const COYOTE_TIME = 150; // ms

// Energy
export const ENERGY_MAX = 100;
export const ENERGY_DRAIN_MOVING = 2.4;  // per second
export const ENERGY_DRAIN_IDLE = 0.35;   // per second
export const ENERGY_RESTORE = 30;        // per carrot consumed
export const ENERGY_AUTO_EAT_THRESHOLD = 55;
export const ENERGY_AUTO_EAT_INTERVAL = 1500; // ms
export const FALL_RESPAWN_DAMAGE = 20;
export const FALL_RESPAWN_BUFFER = 160;

// Collectibles
export const CARROT_FLOAT_AMPLITUDE = 6;
export const CARROT_FLOAT_DURATION = 1500;
export const GEM_SPIN_DURATION = 1200;
export const GEM_DEPOSIT_RATE = 3; // gems/sec during deposit
export const MAX_CARROT_ICONS = 10;

// Robots
export const ROBOT_SPEED = 80;
export const ROBOT_ZAP_DAMAGE = 15;
export const INVINCIBILITY_DURATION = 1700; // ms

// Canvas
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 480;
