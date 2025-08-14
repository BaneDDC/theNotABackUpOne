
// src/game/config/GameConfig.ts

export const GAME_CONFIG = {
  GRID: {
    COLS: 8,
    ROWS: 5,
    CELL_SIZE: 80,
    PADDING: 10,
    START_X: 400,
    START_Y: 50,
  },
  ITEMS: {
    SIZE: 70,
    MAX_LEVEL: 10,
  },
  COLORS: {
    GRID_LINE: 0x34495e,
    BACKGROUND: 0x2c3e50,
    ITEM_BORDER: 0xffffff,
    MERGE_SLOT: 0x3498db,
    MERGE_BUTTON: 0x27ae60,
    MERGE_BUTTON_HOVER: 0x2ecc71,
  },
  UI: {
    BUTTON_SIZE: 80,
    BUTTON_MARGIN: 20,
    MERGE_AREA_Y: 270,
    MERGE_SLOT_SIZE: 60,
  }
}

export const MERGE_RECIPES = {
  // Basic items that can be merged
  1: { name: "Spark", color: 0xff6b6b },
  2: { name: "Ember", color: 0xff8e53 },
  3: { name: "Crystal", color: 0x48dbfb },
  4: { name: "Seed", color: 0x2ecc71 },
  5: { name: "Stone", color: 0x95a5a6 },
}

export const MERGE_OUTCOMES = {
  // Good outcomes (beneficial)
  good: [
    { name: "Healing Potion", color: 0x2ecc71, effect: "heal", power: 20 },
    { name: "Shield Charm", color: 0x3498db, effect: "shield", power: 15 },
    { name: "Power Crystal", color: 0x9b59b6, effect: "power", power: 25 },
    { name: "Lucky Coin", color: 0xf1c40f, effect: "luck", power: 10 },
    { name: "Magic Sword", color: 0xe74c3c, effect: "attack", power: 30 },
  ],
  // Bad outcomes (strengthen enemies)
  bad: [
    { name: "Cursed Skull", color: 0x2c3e50, effect: "enemy_power", power: 15 },
    { name: "Dark Essence", color: 0x8e44ad, effect: "enemy_speed", power: 20 },
    { name: "Poison Cloud", color: 0x27ae60, effect: "enemy_health", power: 25 },
    { name: "Shadow Orb", color: 0x34495e, effect: "enemy_spawn", power: 10 },
  ]
}
