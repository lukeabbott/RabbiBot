# RabbiBot Multiplayer Plan

## Goal

Add central-server multiplayer to RabbiBot so up to four players can play co-op together from different machines at `rabbibot.retrobit.dev`, with room creation, rabbit customization, player collision, and a clean path to future combat modes.

## Principles

- Keep Phaser, TypeScript, and Vite on the client.
- Add a separate Node.js WebSocket server for authoritative room and game state.
- Share gameplay types and message contracts between client and server.
- Ship co-op first, then layer in combat-ready systems without a rewrite.
- Preserve the existing single-player game as a fallback while multiplayer is built.

## Target Architecture

### Client

- Phaser handles rendering, animation, camera, UI, and local input.
- The client sends player inputs and profile updates to the server.
- The client predicts local movement where needed and interpolates remote players.
- The client treats server snapshots and authoritative events as truth.

### Server

- Node.js + TypeScript service hosted behind `wss://rabbibot.retrobit.dev/ws`.
- Owns room lifecycle, lobby state, ready state, level state, pickups, portal progress, robots, damage, respawns, and transitions.
- Runs the authoritative simulation tick for multiplayer rooms.
- Validates interactions so clients cannot fake pickups, portal deposits, or damage.

### Shared Package

- Room and player types
- Cosmetics/profile types
- Level and entity state types
- WebSocket message schemas
- Shared constants that both client and server must agree on

## Recommended Repo Shape

```text
client/
  src/
server/
  src/
shared/
  src/
```

Suggested migration path inside this repo:

```text
src/                # current Phaser client during transition
server/             # new WebSocket server
shared/             # shared types and protocol
```

Later, the current `src/` can move into `client/src/` once the multiplayer foundation is stable.

## Gameplay Scope: Phase 1 Co-op

- Up to 4 players per room
- Shared level progress
- Shared portal objective
- Individual player movement and energy
- Player-to-player collision enabled
- Cosmetic rabbit customization per player
- Join by room code from the web app
- Host creates room, others join, host starts match

Not in initial phase:

- PvP combat
- Persistent accounts
- Matchmaking
- Reconnect persistence across browser restarts
- Cross-room chat beyond lightweight emotes or ready-state UX

## Gameplay Scope: Later Combat Support

Design Phase 1 with these future hooks:

- Generic health/damage model
- Team or friendly-fire flags
- Spawn and respawn points per mode
- Weapon or ability event pipeline
- Score and round state model
- Collision and hit resolution on the server

## Current Codebase Refactor Direction

The current game is scene-centric and single-player. Before deep multiplayer logic, refactor toward separation of concerns.

### Keep Client-side

- Rendering and animation
- Camera behavior
- Local HUD display
- Menu and lobby screens
- Input capture
- Cosmetic presentation

### Move Toward Shared/Server-owned Logic

- Player state model
- Room state model
- Level state progression
- Pickup ownership and collection
- Portal deposit and completion
- Robot state and damage resolution
- Respawn rules
- Transition rules for level complete and game over

## Server Responsibilities

### Room Manager

- Create and destroy rooms
- Generate room codes
- Track host player
- Handle joins, leaves, disconnects, and reconnect windows later

### Lobby State

- Player list
- Ready status
- Cosmetic selections
- Selected mode
- Host start permissions

### Simulation State

- Current level index
- Authoritative player transforms and state
- Active pickups and collectibles
- Portal charge
- Robot positions and patrol state
- Damage, invincibility, respawn timers
- Win/loss transitions

### Networking

- Accept WebSocket connections
- Associate socket to session and room
- Receive and validate inputs
- Broadcast snapshots and discrete events
- Heartbeat/ping handling

## Client Responsibilities

### Frontend Flow

- Main menu with `Single Player` and `Multiplayer`
- Multiplayer menu with `Create Room` and `Join Room`
- Lobby UI with player cards, rabbit customization, and ready state
- In-game HUD showing room players and shared progress

### Runtime Behavior

- Capture input per frame and send compact input packets
- Render remote players using interpolated snapshots
- Render local player with prediction where appropriate
- Reconcile local state when server corrections arrive

## Rabbit Customization

Start simple and data-driven.

### Initial Support

- Display name
- Body tint/palette
- Accent tint/palette
- Optional preset cosmetic style id

### Future Support

- Hats or accessories
- Unlockable skins
- Team colors for combat

Suggested profile shape:

```ts
type PlayerCosmetics = {
  bodyColor: string;
  accentColor: string;
  styleId?: string;
};

type PlayerProfile = {
  id: string;
  name: string;
  cosmetics: PlayerCosmetics;
};
```

## Netcode Approach

### Recommended Model

- Authoritative server
- Client sends inputs, not positions as truth
- Server simulates state on a fixed tick
- Server broadcasts snapshots or state deltas at a steady rate
- Client interpolates remote entities and reconciles local player corrections

### Tick Guidance

- Simulation tick: 20-30 Hz to start
- Snapshot broadcast: 10-20 Hz to start
- Client render: browser frame rate

### Why This Model

- Better sync for player collision
- Better support for shared pickups and portal logic
- Easier migration to combat later
- Better cheat resistance

## Physics Strategy

Phaser Arcade Physics is convenient on the client, but it is not a strong cross-machine authority model on its own.

Recommended path:

- Keep Phaser Arcade for client-side feel and visuals.
- Implement simplified authoritative simulation on the server for core multiplayer state.
- Avoid relying on client-only collision outcomes for gameplay-critical events.

For initial co-op, the server must own at least:

- Player bounds and collision resolution
- Pickup collection success
- Robot hit detection
- Portal deposit and entry state
- Respawn triggers

## Message Schema Outline

### Client to Server

- `create_room`
- `join_room`
- `leave_room`
- `update_profile`
- `set_ready`
- `start_game`
- `player_input`
- `interact`
- `ping`

### Server to Client

- `room_created`
- `room_joined`
- `room_state`
- `player_joined`
- `player_left`
- `game_started`
- `state_snapshot`
- `entity_event`
- `level_complete`
- `game_over`
- `error`

Suggested packet style:

```ts
type ClientMessage =
  | { type: 'create_room'; profile: PlayerProfile }
  | { type: 'join_room'; roomCode: string; profile: PlayerProfile }
  | { type: 'set_ready'; ready: boolean }
  | { type: 'update_profile'; profile: PlayerProfile }
  | { type: 'player_input'; input: InputFrame }
  | { type: 'interact' };
```

## Room Model

```ts
type RoomPhase = 'lobby' | 'playing' | 'level_complete' | 'game_over';

type RoomState = {
  roomId: string;
  roomCode: string;
  hostPlayerId: string;
  phase: RoomPhase;
  levelIndex: number;
  players: NetworkPlayer[];
  sharedProgress: {
    depositedGems: number;
    gemsRequired: number;
  };
};
```

## Implementation Phases

### Phase 0 - Prep the current codebase

- Keep the current single-player path working.
- Separate pure state logic from scene rendering where possible.
- Introduce shared interfaces for players, rooms, levels, and messages.
- Reduce direct scene-only assumptions in gameplay systems.

### Phase 1 - Add shared protocol and server skeleton

- Create `server/` and `shared/` directories.
- Add TypeScript build support for all packages.
- Implement WebSocket server bootstrap.
- Add room creation and join flow.
- Add basic health checks and heartbeat support.

### Phase 2 - Build multiplayer menus and lobby

- Add `Multiplayer` option to the main menu.
- Add create/join room screens.
- Add room code entry.
- Add lobby player list.
- Add rabbit customization UI.
- Add ready state and host start button.

### Phase 3 - Sync player presence and movement

- Spawn all players in a room.
- Send local inputs to the server.
- Broadcast snapshots for all players.
- Render remote players on the client.
- Add interpolation and correction logic.

### Phase 4 - Move objectives to server authority

- Server validates gem collection.
- Server validates carrot collection.
- Server owns portal deposit progress.
- Server owns portal activation and entry.
- Clients render results from authoritative events.

### Phase 5 - Add robots, damage, and respawn flow

- Server simulates robot patrol state.
- Server resolves robot-player collisions.
- Server applies damage and invincibility.
- Server handles fall recovery and respawns.
- Game over and level complete become room state transitions.

### Phase 6 - Polish multiplayer UX

- Better join/leave/disconnect messaging
- Rejoin flow if socket drops briefly
- Simple emotes or quick chat
- Better player labels and cosmetic previews
- Server-side room cleanup rules

### Phase 7 - Combat foundation

- Generalize damage system
- Add player-vs-player collision tuning
- Add hit event abstraction
- Add mode flags for co-op vs combat
- Add combat-safe spawn logic and scoring rules

## Deployment Plan for retrobit.dev

- Frontend hosted at `https://rabbibot.retrobit.dev`
- WebSocket endpoint at `wss://rabbibot.retrobit.dev/ws`
- Reverse proxy through nginx or caddy with WebSocket upgrades enabled
- Start with in-memory room storage
- Add process manager such as `pm2` or Docker later if desired

## Operational Notes

- Use HTTPS/WSS only.
- Add logging for room create/join/leave/start/error events.
- Add per-room player limits.
- Add basic rate limiting for malformed or spammy inputs.
- Consider simple server metrics before public rollout.

## Risks

- Server-authoritative platforming is the hardest part.
- Phaser Arcade client behavior may not map cleanly to server simulation.
- Player collision can become frustrating without tuning.
- Reconciliation bugs can feel like jitter or rubber-banding.
- Combat will magnify all sync and collision issues if the base model is weak.

## Success Criteria for First Multiplayer Release

- Four players can join the same room from different machines.
- Players can choose distinct rabbit looks.
- Lobby flow is stable and easy to understand.
- Players can move together in the same level.
- Shared collectibles and portal progress stay in sync.
- Player collision works without major griefing.
- Level transitions work for the whole room.
- The game remains playable on normal home broadband.

## Recommended First Coding Step

Create `shared/` with room, player, cosmetics, and message types, then scaffold `server/` with room creation and join logic before changing the Phaser runtime.
