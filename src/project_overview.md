# Toilet Merge Game - Project Overview

## Game Synopsis

**Toilet Merge Game** is a mobile web-based puzzle game built with Phaser 3.90.0 + TypeScript. Players merge bathroom items in a toilet to create new combinations, manage enemy spawns, and progress through increasingly complex item hierarchies. The game features:

- **Merge Mechanics**: Combine tier 1 items to create tier 2+ items
- **Enemy Management**: Unstable Goo and other enemies spawn from failed merges
- **Mini-Games**: Plunger timing mini-game for rewards
- **Store System**: In-game shop for purchasing items
- **Save/Load System**: Persistent progress with localStorage
- **Failsafe Systems**: Automatic box spawning when players get stuck

## File Structure & Line Counts

### Root Configuration (4 files, 89 lines)
- **package.json** (43 lines) - Project dependencies and build scripts
- **tsconfig.json** (23 lines) - TypeScript compiler configuration  
- **index.html** (22 lines) - Main HTML entry point
- **README.md** (167 lines) - Project documentation and setup guide

### Build Configuration (2 files, 214 lines)
- **webpack/config.dev.js** (105 lines) - Development build configuration
- **webpack/config.prod.js** (109 lines) - Production build configuration

### Source Entry Points (3 files, 88 lines)
- **src/main.ts** (8 lines) - Application bootstrap
- **src/global.d.ts** (72 lines) - Global TypeScript declarations
- **src/game/main.ts** (42 lines) - Phaser game configuration

### Game Configuration (3 files, 272 lines)
- **src/game/config/GameConfig.ts** (59 lines) - Game settings and constants
- **src/game/config/constants.ts** (17 lines) - Game constants and values
- **src/game/config/mergeDataFull.ts** (196 lines) - Item definitions and merge logic

### Scene Files (10 files, 6,365 lines)
- **src/game/scenes/Loading.ts** (363 lines) - Asset preloading and progress UI
- **src/game/scenes/MainMenu.ts** (458 lines) - Main menu and save game choice
- **src/game/scenes/Game.ts** (2,425 lines) - Main game scene and orchestration
- **src/game/scenes/PlungeMiniGame.ts** (761 lines) - Plunger timing mini-game
- **src/game/scenes/PauseMenu.ts** (578 lines) - Pause menu overlay
- **src/game/scenes/RecipeOverlay.ts** (290 lines) - Recipe display system
- **src/game/scenes/Bestiary.ts** (592 lines) - Enemy bestiary display
- **src/game/scenes/ItemCatalog.ts** (323 lines) - Item catalog display
- **src/game/scenes/Boot.ts** (1,163 lines) - Legacy boot scene (deprecated)
- **src/game/scenes/Boot2.ts** (77 lines) - Legacy boot scene (deprecated)

### Manager Files (3 files, 599 lines)
- **src/game/managers/SceneManager.ts** (212 lines) - Scene transitions and management
- **src/game/managers/AnimationManager.ts** (171 lines) - Animation system coordination
- **src/game/managers/CollisionManager.ts** (216 lines) - Centralized collision detection

### Core Game Objects (12 files, 9,234 lines)
- **src/game/objects/mergeCore.ts** (1,737 lines) - Core merging system and item management
- **src/game/objects/StoreManager.ts** (1,909 lines) - In-game store and transaction system
- **src/game/objects/hitBox.ts** (1,329 lines) - Collision editor and hitbox system
- **src/game/objects/TrashRecycler.ts** (1,062 lines) - Trash recycling mechanics
- **src/game/objects/EnemyManager.ts** (798 lines) - Enemy spawning and AI behavior
- **src/game/objects/BoxSpawner.ts** (717 lines) - Failsafe box spawning system
- **src/game/objects/RadioManager.ts** (686 lines) - Music and radio system
- **src/game/objects/HintButton.ts** (645 lines) - Hint system and UI
- **src/game/objects/AssetManager.ts** (808 lines) - Asset loading and management
- **src/game/objects/GooCounter.ts** (325 lines) - Goo collection and tracking
- **src/game/objects/MergeItem.ts** (77 lines) - Individual item class
- **src/game/objects/index.ts** (14 lines) - Object exports

### UI Components (2 files, 93 lines)
- **src/game/objects/ui/PauseButton.ts** (88 lines) - Pause button component
- **src/game/objects/ui/index.ts** (5 lines) - UI exports

## Primary Functions by Category

### Core Game Logic
- `initMergeCore()` - Initialize the main merging system
- `onFlush()` - Handle item flushing and penalties
- `spawnAtPortal()` - Spawn items from portal
- `spawnPenaltyItem()` - Spawn enemies from failed merges
- `spawnTier2Reward()` - Spawn rewards for perfect plunges

### Scene Management
- `create()` - Scene initialization
- `update()` - Game loop updates
- `preload()` - Asset loading
- `setupNewSprite()` - Sprite creation and setup

### Enemy System
- `spawnEnemy()` - Create new enemies
- `updateEnemyAI()` - Update enemy behavior
- `createGooSplatterAt()` - Create goo splatter effects
- `handleEnemyCollision()` - Process enemy collisions

### Store & Economy
- `setupStore()` - Initialize store system
- `handlePurchase()` - Process item purchases
- `updateStoreDisplay()` - Update store UI
- `processTransaction()` - Handle financial transactions

### Failsafe Systems
- `startTier1Monitoring()` - Monitor for stuck players
- `checkTier1Items()` - Check available items
- `startNoMergeableTimer()` - Timer for no mergeable combinations
- `startNoTier1Timer()` - Timer for no tier 1 items
- `spawnBox()` - Spawn help box

### Mini-Game
- `handlePointerDown()` - Plunger mini-game input
- `handlePointerUp()` - Plunger mini-game release
- `checkZone()` - Determine plunger accuracy
- `handlePlungerResult()` - Process mini-game results

## Key Variables & State Management

### Game State
- `tutorialPhase` - Track tutorial progression
- `portalCreated` - Portal creation status
- `FlushCount` - Number of successful flushes
- `isPointerDown` - Input state tracking

### Audio Management
- `toiletSound` - Toilet flush audio
- `plungerSound` - Plunger audio
- `faucetSound` - Sink audio
- `lastToiletSoundTime` - Audio cooldown tracking

### Timer Systems
- `plungerVibrateTimer` - Plunger animation timer
- `toiletPaperBlinkTimer` - Toilet paper animation
- `recyclerCooldownTimer` - Recycler usage cooldown
- `noMergeableTimer` - Failsafe timer
- `noTier1Timer` - Failsafe timer

### UI State
- `researchLogIsExpanded` - Research log display state
- `isMopBeingDragged` - Mop interaction state
- `isSinkOn` - Sink activation state
- `customCursor` - Custom cursor sprite

## Architecture Patterns

### Manager Pattern
- **SceneManager**: Handles scene transitions and global cursor
- **AnimationManager**: Coordinates all animations and backgrounds
- **CollisionManager**: Centralized collision detection system

### Event-Driven Communication
- Scene events for inter-component communication
- Registry system for data passing between scenes
- Event listeners for game state changes

### Object-Oriented Design
- Specialized classes for each game system
- Clear separation of concerns
- Modular component architecture

### Asset Management
- Preloading system for smooth gameplay
- Error handling for failed asset loads
- Progress tracking and user feedback

## Summary

The Toilet Merge Game is a well-structured, feature-rich mobile web game with approximately **25,000+ lines of TypeScript code** across **35+ files**. The project demonstrates solid software engineering practices with:

- **Clear separation of concerns** through manager patterns
- **Event-driven architecture** for loose coupling
- **Comprehensive failsafe systems** for player experience
- **Modular design** enabling easy feature additions
- **Robust asset management** with preloading and error handling
- **Persistent state management** with save/load functionality

The game successfully balances complexity with maintainability, providing a solid foundation for future enhancements and feature additions.

## Development Credits

**Toilet Merge Game** was designed by **Toxic** and **Flyboy** for the **GAMEJAM contest** on itch.io. This project represents a collaborative effort between human creativity and AI-powered development tools:

- **Game Design**: Toxic and Flyboy
- **AI Development Tools**: 
  - **Waffle.ai** - AI-powered game development assistance
  - **Cursor** - AI-enhanced code editor
- **Asset Generation**: All visual and audio assets were generated using AI tools
- **Code Development**: All programming and implementation was completed with AI assistance

This project demonstrates the potential of human-AI collaboration in game development, where creative vision meets AI-powered execution to create engaging interactive experiences.