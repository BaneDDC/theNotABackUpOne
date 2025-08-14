import { Game as MainGame } from "./scenes/Game"
import { Loading } from "./scenes/Loading"
import { MainMenu } from "./scenes/MainMenu"
import { CollisionEditor } from "./objects/hitBox"
import { RecipeOverlay } from "./scenes/RecipeOverlay"
import { Bestiary } from "./scenes/Bestiary"
import { PauseMenu } from "./scenes/PauseMenu"
import { PlungeMiniGame } from "./scenes/PlungeMiniGame"
import { ItemCatalog } from "./scenes/ItemCatalog"
import { AUTO, Game, Scale, Types } from "phaser"

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
  type: AUTO,
  width: 1170,
  height: 540,
  parent: "game-container",
  backgroundColor: "#2c3e50",
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
    // Enable fullscreen support
    fullscreenTarget: "game-container"
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  // New streamlined flow: Loading -> MainMenu -> Game
  scene: [Loading, MainMenu, MainGame, CollisionEditor, RecipeOverlay, Bestiary, PauseMenu, PlungeMiniGame, ItemCatalog],
}

const StartGame = (parent: string) => {
  return new Game({ ...config, parent })
}

export default StartGame
