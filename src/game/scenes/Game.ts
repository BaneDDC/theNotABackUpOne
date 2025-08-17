import { Scene } from "phaser"
import { initMergeCore } from "../objects/mergeCore"
import { BoxSpawner } from "../objects/BoxSpawner"
import { HintButton } from "../objects/HintButton"
import { GooCounter, GooCollectionSystem } from "../objects/GooCounter"
import { TrashRecycler } from "../objects/TrashRecycler"
import { RadioManager } from "../objects/RadioManager"
import { EnemyManager } from "../objects/EnemyManager"
import { StoreManager } from "../objects/StoreManager"
import { PauseButton } from "../objects/ui/PauseButton"
import { AlienOrderSystem } from "../objects/ui/AlienOrderSystem"
import { AchievementManager } from "../objects/AchievementManager"
import { SaveService } from "../../services/SaveService"

export class Game extends Scene {
  private toiletSound!: Phaser.Sound.BaseSound
  private lastToiletSoundTime: number = 0
  private readonly TOILET_SOUND_COOLDOWN = 7000 // 7 seconds in milliseconds
  private plungerSound!: Phaser.Sound.BaseSound
  private lastPlungerSoundTime: number = 0
  private readonly PLUNGER_SOUND_COOLDOWN = 5000 // 5 seconds in milliseconds

  private FlushCount: number = 0 // Start with toilet empty
  private toilet!: Phaser.GameObjects.Sprite // Reference to toilet sprite
  private plunger!: Phaser.GameObjects.Sprite // Reference to plunger sprite
  private plungerOriginalX: number = 0
  private plungerOriginalY: number = 0
  private plungerVibrateTimer!: Phaser.Time.TimerEvent // Timer for plunger vibration
  private boxSpawner!: BoxSpawner // Reference to box spawner
  private customCursor!: Phaser.GameObjects.Sprite // Global custom cursor
  private isPointerDown: boolean = false
  private hintButton!: HintButton // Reference to hint button
  private gooCounter!: GooCounter // Reference to goo counter
  private toiletPulseTween?: Phaser.Tweens.Tween // Reference to toilet pulse tween
  private tutorialPhase: boolean = true // Track if we're in tutorial phase
  private portalCreated: boolean = false// Track if portal has been created
  private sink!: Phaser.GameObjects.Sprite // Reference to sink sprite
  private isSinkOn: boolean = false // Track sink state
  private faucetSound!: Phaser.Sound.BaseSound // Reference to faucet sound
  private sinkShakeTween?: Phaser.Tweens.Tween // Reference to sink shake tween
  private toiletPaperBg!: Phaser.GameObjects.Sprite // Reference to toilet paper background sprite
  private toiletPaperBlinkTimer!: Phaser.Time.TimerEvent // Timer for toilet paper blinking
  private toiletPaperFlushTimer?: Phaser.Time.TimerEvent // Timer for toilet paper flush animation
  private trashRecycler!: Phaser.GameObjects.Sprite // Reference to trash recycler sprite
  private trashRecyclerManager!: TrashRecycler // Reference to trash recycler manager
  private radioManager!: RadioManager // Reference to radio manager
  private enemyManager!: EnemyManager // Reference to enemy manager
  private storeManager!: StoreManager // Add store manager property
  private recyclerCooldownTimer?: Phaser.Time.TimerEvent // Timer for recycler cooldown
  private recyclerLastUsed: number = 0 // Timestamp of last recycler use
  private readonly RECYCLER_COOLDOWN = 60000 // 60 seconds in milliseconds
  private sceneManager!: import('../managers/SceneManager').SceneManager
  private animationManager!: import('../managers/AnimationManager').AnimationManager
  private researchLog!: Phaser.GameObjects.Image // Reference to research log image
  private researchLogScale: number = 1.0 // Current scale of research log
  private researchLogIsExpanded: boolean = false // Track if research log is expanded
  private researchLogOriginalPosition = { x: 1112.359375, y: 249.42112037804378, scale: 0.05 }; // BoxSpawn position
  private researchLogExpandedPosition = { x: 624.1456121888725, y: 259.6994420217029, scale: 0.35 }; // Clicked position
  private scoreImage!: Phaser.GameObjects.Image // Reference to score image
  private scoreImageScale: number = 1.0 // Current scale of score image
  private currentScore: number = 0 // Current game score
  private scoreText!: Phaser.GameObjects.Text // Score display text
  private interactiveMop!: Phaser.GameObjects.Sprite // Reference to interactive mop sprite
  private interactiveMopOriginalX: number = 400 // Initial X position
  private interactiveMopOriginalY: number = 300 // Initial Y position
  private interactiveMopScale: number = 1.0 // Current scale of interactive mop
  private isMopBeingDragged: boolean = false // Track if mop is currently being dragged
  
  // Alientube properties
  private alientube!: Phaser.GameObjects.Sprite
  private alientubeTargetX: number = 546
  private alientubeTargetY: number = 159
  private alientubeTargetScale: number = 0.20
  private alientubePortalY: number = -100 // Portal is above top of screen (completely hidden)
  private isAlientubeEmerging: boolean = false
  private vacuumSound?: Phaser.Sound.BaseSound // Store reference to looping vacuum sound
  
  // Occluder properties
  private occluder!: Phaser.GameObjects.Graphics
  private occluderBorder!: Phaser.GameObjects.Graphics
  private isOccluderVisible: boolean = true
  private isOccluderDragged: boolean = false
  private occluderDragOffset: { x: number; y: number } = { x: 0, y: 0 }
  private occluderX: number = 462
  private occluderY: number = 0
  private occluderWidth: number = 200
  private occluderHeight: number = 20
  
  // Center box properties
  private centerBox!: Phaser.GameObjects.Rectangle
  private centerBoxScale: number = 1.0
  
  // Achievement system
  private achievementManager!: AchievementManager
  
  // Save system
  private saveService: SaveService
  private autoSaveTimer?: Phaser.Time.TimerEvent
  private readonly AUTO_SAVE_INTERVAL = 30000 // 30 seconds in milliseconds

  constructor() {
    super("Game")
    this.saveService = SaveService.getInstance()
  }

  preload() {
    // Load the research log image - try multiple URL formats
    this.load.image('researchlog', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/researchlog.png');
    // Load the score image
    this.load.image('score', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/score.png');
    
    // Load alien order system images
    this.load.image('alien1', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/alien1.webp');
    this.load.image('alien2', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/alien2.webp');
    this.load.image('alien3', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/alien3.webp');
    this.load.image('alien4', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/alien4.webp');
    this.load.image('card', 'https://raw.githubusercontent.com/localgod13/merge-assets/main/card.webp');
    this.load.image('alientube', 'https://cdn.jsdelivr.net/gh/localgod13/merge-assets@main/alientube.png');
    this.load.image('tutcom', 'https://cdn.jsdelivr.net/gh/localgod13/merge-assets@main/tutcom.png');
    
    // Add error handling for image loading
    this.load.on('loaderror', (file: any) => {
      // If image fails to load, we'll create a fallback in setupResearchLog
    });
    
    this.load.on('complete', () => {
      // Assets loaded successfully
    });
  }

  async create() {
    this.physics.world.setBounds(0, 0, 1170, 540)
    this.sceneManager = new (require('../managers/SceneManager').SceneManager)(this)
    this.sceneManager.setupGlobalCustomCursor()
    this.animationManager = new (require('../managers/AnimationManager').AnimationManager)(this as any)
    this.animationManager.setupAnimatedBackground()
    this.setupNewSprite()
    this.setupCenterBox()
    this.setupToilet()
    this.setupPlunger()
    this.setupSink()
    this.setupTowel()
    this.setupToiletPaperBackground()
    this.setupRadio()
    this.setupTrashRecycler()
    this.setupEnemyManager()
    this.setupStoreManager()
    this.setupAchievementManager()
    this.setupResearchLog()
    this.setupScoreImage()
    this.setupInteractiveMop()
    this.setupAlientube()
    this.setupOccluder()
    this.toiletSound = this.sound.add('toiletFlush', { volume: 0.5 })
    this.plungerSound = this.sound.add('plungerSound', { volume: 0.7 })
    this.setupCollisionEditorKey()

    const saveGameChoice = this.registry.get('saveGameChoice')
    let gameStateLoaded = false;
    if (saveGameChoice === 'continue') {
      gameStateLoaded = await this.loadGameState();
    } else {
      // Ensure completely fresh start for new games
      this.tutorialPhase = true;
      this.portalCreated = false;
      this.FlushCount = 0;
      this.currentScore = 0;
      
      // Reset all managers to fresh state
      if (this.gooCounter) {
        this.gooCounter.setGooCount(0);
      }
      if (this.radioManager) {
        this.radioManager.setVolume(0.3);
        this.radioManager.setCurrentSong(0);
        this.radioManager.setPowerState(false);
      }
      this.isSinkOn = false;
      
      // Ensure no existing items or enemies are present
      this.clearAllGameObjects();
      

    }

    if (!gameStateLoaded) {
      this.updateToiletSprite()
    }

    this.setupMergeSystem()
    this.setupHintButton()
    this.setupGooCounter()
    this.scene.launch('Bestiary')

    const pauseUI = new PauseButton(this).create()
    ;(this as any).pauseButton = pauseUI.button
    ;(this as any).pauseSymbol = pauseUI.symbol

    // Create the alien order system
    const alienOrderSystem = new AlienOrderSystem(this)
    const alienOrderUI = alienOrderSystem.create()
    ;(this as any).alienOrderSystem = alienOrderUI.container
    ;(this as any).alienHead = alienOrderUI.alienHead
    ;(this as any).orderCard = alienOrderUI.card

    // Set a random alien head when the system is created (removed timer)
    alienOrderSystem.setRandomAlien()

    // Store the alien order system instance for order checking
    ;(this as any).alienOrderSystemInstance = alienOrderSystem

    // Listen for merge completion to trigger alientube emergence only for alien order items
    this.events.on('toilet:merged', (result: string) => {
      // Check if there's a current alien order and if the merged item matches it
      const currentOrder = (this as any).alienOrderSystemInstance?.getCurrentOrder();
      if (currentOrder && result === currentOrder.requestedItem) {
        // Only trigger alientube emergence when the merged item matches the alien order request
        this.triggerAlientubeEmergence();
      }
    })
    
    // Global drag handlers to ensure all items are in front of alientube when dragged
    this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      // Check if this is a draggable item (has itemName property)
      if ((gameObject as any).itemName && !(gameObject === this.interactiveMop)) {
        // Bring draggable items to front while dragging (higher than alientube)
        (gameObject as any).setDepth(2000);
      }
    });
    
    this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      // Check if this is a draggable item (has itemName property)
      if ((gameObject as any).itemName && !(gameObject === this.interactiveMop)) {
        // Return items to normal depth when dragging ends
        (gameObject as any).setDepth(1000);
      }
    });

    this.time.delayedCall(100, () => {
      this.sceneManager.recreateCustomCursor()
    })



    if (saveGameChoice === 'continue' && ! this.tutorialPhase && this.portalCreated) {
      this.time.delayedCall(1000, () => {
        const existingPortal = this.children.getByName('portal');
        if (!existingPortal) {
          this.createPortalFromSave();
        } else {
          this.setupPortalInMergeSystem(existingPortal as Phaser.GameObjects.Sprite);
        }
      });
    }

    this.events.on('plunger:result', (result: 'green' | 'red' | 'yellow') => {
      this.handlePlungerResult(result)
    })

    // Recycler minigame is now handled directly in TrashRecycler

    this.events.on('tutorial:complete', () => {
      this.completeTutorial();
      // Notify alien order system that tutorial is completed
      if ((this as any).alienOrderSystemInstance) {
        (this as any).alienOrderSystemInstance.setTutorialCompleted(true);
      }
    });

    this.events.on('toilet:flush', () => {
      this.showToiletPaperFlush();
    });

    // Listen for score events
    this.events.on('score:add', (points: number) => {
      this.addScore(points);
    });

    this.events.on('score:subtract', (points: number) => {
      this.addScore(-points);
    });

    // Start auto-save timer (every 30 seconds)
    this.startAutoSaveTimer();

    // Listen for achievement updates to trigger save
    this.events.on('achievements:updated', () => {
      this.saveGameState();
    });
  }

  private handlePlungerResult(result: 'green' | 'red' | 'yellow') {
    switch (result) {
      case 'green':
        this.FlushCount = Math.max(0, this.FlushCount - 2)
        this.updateToiletSprite()
        // use ItemManager helper for tier2 reward
        const mergeForReward = this.getMergeSystem();
        if (mergeForReward && mergeForReward.items && (mergeForReward.items as any).spawnTier2Reward) {
          (mergeForReward.items as any).spawnTier2Reward();
        }
        // Emit achievement event for perfect plunger result
        this.events.emit('achievement:plunger_perfect');
        break
      case 'red':
        this.FlushCount = Math.max(0, this.FlushCount - 1)
        this.updateToiletSprite()
        this.events.emit('toilet:penalty', 'Unstable Goo')
        break
      case 'yellow':
        this.FlushCount = Math.max(0, this.FlushCount - 1)
        this.updateToiletSprite()
        break
    }

    // Handle toilet fixing and plunger movement if toilet becomes completely unclogged
    if (this.FlushCount <= 0) {
      // Ensure FlushCount is exactly 0, not negative
      this.FlushCount = 0
      this.updateToiletSprite()
      
      // Game state will be saved automatically every 30 seconds
      
      this.stopPlungerVibrateTimer()
      this.events.emit('toilet:fixed')
      
      // Move plunger back after sound finishes
      const soundDuration = this.plungerSound.totalDuration * 1000
      const bufferTime = 200
      
      this.time.delayedCall(soundDuration + bufferTime, () => {
        this.movePlungerToOriginalPosition()
        
        // Spawn a new box after toilet is unclogged and plunger is moved back
        this.time.delayedCall(1000, () => {
          this.boxSpawner.spawnBox()
        })
      })
    }
  }

  // Recycler minigame is now handled directly in TrashRecycler

  private setupHintButton() {
    // Create hint button positioned under the bestiary on the right side
    this.hintButton = new HintButton(this)
    
    // Position under bestiary: bestiary is at top-right corner with 80px size and 20px padding
    // So bestiary center is at (width - 20 - 40, 20 + 40) = (width - 60, 60)
    // Position hint button below it with some spacing, moved down 15px
    const hintButtonX = this.scale.width - 60; // Same X as bestiary center
    const hintButtonY = 60 + 40 + 30 + 15; // Bestiary center Y + half bestiary size + spacing + 15px down
    
    this.hintButton.setPosition(hintButtonX, hintButtonY)
  }

  private setupMergeSystem() {
    // Define toilet merge zone position (around the toilet sprite)
    const toiletZone = { 
      x: this.toilet.x, 
      y: this.toilet.y, 
      w: 140, 
      h: 140 
    };

    // Initialize the merge system without portal sprite initially
    const merge = initMergeCore(this, null, toiletZone);
    
    // Store merge system reference for towel functionality
    (this as any).mergeSystem = merge;

    // Initialize box spawner
    this.boxSpawner = new BoxSpawner(this, merge.items);

    // Initialize trash recycler manager
    this.trashRecyclerManager = new (require('../objects/TrashRecycler').TrashRecycler)(this, merge.items, this.trashRecycler);

    // Listen for successful toilet merges
    this.events.on("toilet:merged", (resultName: string) => {
      // Check if this is the tutorial merge (Battery + Loose Wires = Powered Wire)
      if (this.tutorialPhase && resultName === "Powered Wire") {
        this.handleTutorialMerge();
      } else if (!this.tutorialPhase) {
        // Normal gameplay - send merged item to portal
        if (merge.spawner) {
          merge.spawner.spawnAtPortal(resultName);
        }
      }
    });

    // Listen for penalty events (when invalid merges or single items are flushed)
    this.events.on("toilet:penalty", (penaltyItem: string) => {

      if (!this.tutorialPhase && merge.spawner) {

        merge.spawner.spawnPenaltyItem(penaltyItem);
      } else {

      }
    });

    // Listen for item drops to handle physics falling
    this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: any) => {
      if (gameObject && gameObject.itemName) {
        this.handleItemDrop(gameObject);
      }
    });

    // Wait for all assets to be loaded AND give extra time for texture cache to be ready
    merge.items.getAssetManager().loadAllAssets().then(() => {
      // Add a small delay to ensure all textures are properly cached
      this.time.delayedCall(500, () => {
        // Only start portal spawner if tutorial is complete and we have a spawner
        if (!this.tutorialPhase && merge.spawner) {
          merge.spawner.start(5000); // Spawn tier 1 items every 5 seconds

        }
        
        // Initialize tier 1 count for the box spawner monitoring
        this.time.delayedCall(1000, () => {
          // Force an initial check to set the baseline
          if (this.boxSpawner && (this.boxSpawner as any).checkTier1Items) {
            (this.boxSpawner as any).checkTier1Items();
          }
        });
      });
    });

    // Only spawn the initial box if we're in tutorial mode
    // For loaded saves, boxes will be spawned through normal gameplay
    if (this.tutorialPhase) {
      this.time.delayedCall(2000, () => {
        this.boxSpawner.spawnBox();
      });
    }
  }

  private handleTutorialMerge() {
    // Tutorial merge completed - create and animate portal
    this.createTutorialPortal();
  }

  private createTutorialPortal() {
    if (this.portalCreated && this.children.getByName('portal')) {
      // Portal already exists, don't create another one
      return;
    }
    
    this.portalCreated = true;
    
    // Emit achievement event for portal creation
    this.events.emit('achievement:portal_created');
    
    // Create portal animation - forward then backward (34 frames total, ignoring last 2)
    const forwardFrames = []
    const backwardFrames = []
    
    // Add forward frames (0-33, skipping the last 2 blank frames)
    for (let i = 0; i < 34; i++) {
      forwardFrames.push({ key: 'portal', frame: i })
    }
    
    // Add backward frames (32-1) to avoid duplicating frame 33 and frame 0
    for (let i = 32; i >= 1; i--) {
      backwardFrames.push({ key: 'portal', frame: i })
    }
    
    this.anims.create({
      key: 'portalAnim',
      frames: [...forwardFrames, ...backwardFrames],
      frameRate: 12,
      repeat: -1 // Loop infinitely
    })

    // Create the portal sprite at specified position - start very small
    const portal = this.add.sprite(564.96, 42.41, 'portal')
    portal.setDisplaySize(0, 0) // Start at size 0
    portal.setFlipY(true)
    portal.setName('portal') // Add name so we can find it later
    portal.setDepth(-2) // Set lower depth so droppable items appear in front
    portal.play('portalAnim')

    // Animate portal growing to full size
    this.tweens.add({
      targets: portal,
      displayWidth: 600,
      displayHeight: 200,
      duration: 2000, // 2 seconds to grow
      ease: 'Back.easeOut',
      onComplete: () => {
        // Portal is now fully grown - update merge system and spawn tutorial items
        this.setupPortalInMergeSystem(portal);
        this.spawnTutorialItems();
      }
    });
  }

  private setupPortalInMergeSystem(portalSprite: Phaser.GameObjects.Sprite) {
    // Update the merge system with the portal sprite
    const merge = this.getMergeSystem();
    if (merge) {
      // Create a new spawner since we didn't have one during tutorial
      const { PortalSpawner } = require('../objects/mergeCore');
      const newSpawner = new PortalSpawner(this, merge.items, portalSprite);
      
      // Set the spawner in the merge system
      merge.spawner = newSpawner;
      
      // Initialize the spawner's mouth position
      (newSpawner as any).initMouth();
    }
  }

  private spawnTutorialItems() {
    // Spawn "Powered Wire" and "Unstable Goo" from the portal
    const merge = this.getMergeSystem();
    if (merge && merge.spawner) {

      
      // Spawn Powered Wire first
      merge.spawner.spawnAtPortal("Powered Wire");
      
      // Spawn Unstable Goo after a short delay
      this.time.delayedCall(1500, () => {
        if (merge.spawner) {
          merge.spawner.spawnPenaltyItem("Unstable Goo");
          
          // Tutorial will now complete when the tutorial Unstable Goo is destroyed
          // This allows players who know what to do to skip ahead and continue properly
        }
      });
    } else {



      
      // Fallback: tutorial will complete when player cleans goo puddle
      // No need to auto-complete here
    }
  }

  private completeTutorial() {
    // Prevent duplicate tutorial completion
    if (!this.tutorialPhase) {
      return;
    }
    
    this.tutorialPhase = false;
    
    // Emit achievement event for tutorial completion
    this.events.emit('achievement:tutorial_complete');
    
    // Start normal portal spawning
    const merge = this.getMergeSystem();
    if (merge && merge.spawner) {
      merge.spawner.start(5000); // Spawn tier 1 items every 5 seconds
    }
    
    // Show tutorial completion image
    const message = this.add.image(this.scale.width / 2, this.scale.height / 2, 'tutcom');
    message.setOrigin(0.5);
    message.setDepth(3000);
    
    // Scale the image appropriately (1024x1024 original, scale to reasonable size)
    const targetSize = 200; // Scale to 200x200 pixels
    message.setDisplaySize(targetSize, targetSize);
    
    // Fade out message after 3 seconds
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: message,
        alpha: 0,
        duration: 1000,
        onComplete: () => message.destroy()
      });
    });
    
    // Emit tutorial completion event
    this.events.emit('tutorial:complete');
  }

  private startToiletPulsinging() {
    // Don't start pulsing if toilet is already pulsing or if it's clogged
    if (this.toiletPulseTween || this.FlushCount >= 4) return;

    // Store the current scale values when effects are added
    const currentScaleX = this.toilet.scaleX;
    const currentScaleY = this.toilet.scaleY;

    // Delegate toilet pulsing to AnimationManager
    this.toiletPulseTween = (this.animationManager as any).pulseTarget(this.toilet, currentScaleX, currentScaleY, 1.25, 625)

    // Stop pulsing after 10 seconds or when toilet is used
    this.time.delayedCall(10000, () => {
      this.stopToiletPulsing();
    });
  }

  private stopToiletPulsing() {
    if (this.toiletPulseTween) {
      this.toiletPulseTween.destroy();
      this.toiletPulseTween = undefined;
    }
  }

  private playToiletSound() {
    const currentTime = this.time.now
    
    // If toilet is clogged (FlushCount >= 4), only shake - no sound or increment
    if (this.FlushCount >= 4) {
      this.shakeToilet()
      return
    }
    
    // Check if enough time has passed since the last sound play
    if (currentTime - this.lastToiletSoundTime >= this.TOILET_SOUND_COOLDOWN) {
      this.toiletSound.play()
      this.lastToiletSoundTime = currentTime
      
      // Check if toilet has any items (1 or more) BEFORE emitting flush event
      const merge = this.getMergeSystem()
      const hasAnyItems = merge && merge.toilet && merge.toilet.hasAnyItems()
      
      // Increment flush count if there are any items in the toilet (1 or more)
      if (hasAnyItems) {
        this.FlushCount++
        this.updateToiletSprite()
        
        // Move plunger closer to toilet when it gets clogged
        if (this.FlushCount >= 4) {
          this.movePlungerToToilet()
        }
      }
      
      // Emit flush event for merge system AFTER checking and incrementing flush count
      this.events.emit("toilet:flush")
      
      // Always shake the toilet when flushed, regardless of items
      this.shakeToilet()
    }
  }

  private usePlunger() {
    // Only work if toilet is clogged
    if (this.FlushCount <= 0) return
    
    const currentTime = this.time.now
    
    // Play plunger sound with cooldown (only when plunger is ready to use)
    if (currentTime - this.lastPlungerSoundTime >= this.PLUNGER_SOUND_COOLDOWN) {
      this.plungerSound.play()
      this.lastPlungerSoundTime = currentTime
    }
    
    // Launch the plunge mini-game - let the mini-game handle flush count changes
    this.scene.pause() // Pause the main game
    this.scene.launch('PlungeMiniGame', {
      toiletX: this.toilet.x,
      toiletY: this.toilet.y
    })
    
    // Shake plunger to show it's being used
    this.shakePlunger()
    
    // Remove the automatic toilet fixing logic - mini-game will handle this
    // The mini-game will call the appropriate methods based on the result
  }

  private setupPlunger() {
    // Position plunger to the right of the sink
    this.plungerOriginalX = 1050
    this.plungerOriginalY = 450
    
    this.plunger = this.physics.add.staticSprite(this.plungerOriginalX, this.plungerOriginalY, 'plunger')
    this.plunger.setDisplaySize(120, 120)
    this.plunger.setName('plunger')
    this.plunger.setDepth(0) // Changed from -1 to 0 to be in front of Goo-mba (-0.5)
    
    // Set up physics body
    this.plunger.body.setSize(120, 120)
    this.plunger.body.setOffset(-60, -60)
    
    // Start with plungerNOT interactive (disable interactivity properly)
    this.plunger.removeInteractive()
    
    // Add click handler that will only work when plunger is interactive
    this.plunger.on('pointerdown', () => {
      this.usePlunger()
    })
  }

  private movePlungerToToilet() {
    // Move plunger to specific coordinates when toilet is clogged
    const targetX = 873.00
    const targetY = 342.00
    
    this.tweens.add({
      targets: this.plunger,
      x: targetX,
      y: targetY,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        // Make plunger interactive only when it reaches the toilet
        this.plunger.setInteractive()
      }
    })
    
    // Start vibration timer when plunger is moved to toilet
    this.startPlungerVibrateTimer()
  }

  private movePlungerToOriginalPosition() {
    // Make plunger unclickable immediately when starting to move back
    this.plunger.removeInteractive()
    
    // Move plunger back to original position when toilet is fixed
    this.tweens.add({
      targets: this.plunger,
      x: this.plungerOriginalX,
      y: this.plungerOriginalY,
      duration: 1500,
      ease: 'Power2'
      // Plunger remains non-interactive at original position
    })
  }

  private startPlungerVibrateTimer() {
    // Stop existing timer if it exists
    this.stopPlungerVibrateTimer()
    
    // Only start timer if toilet needs fixing
    if (this.FlushCount <= 0) return
    
    // Create timer that vibrates plunger every 3 seconds
    this.plungerVibrateTimer = this.time.addEvent({
      delay: 3000, // 3 seconds
      callback: () => {
        // Only vibrate if toilet still needs fixing
        if (this.FlushCount > 0) {
          this.vibratePlunger()
        } else {
          this.stopPlungerVibrateTimer()
        }
      },
      loop: true
    })
  }

  private stopPlungerVibrateTimer() {
    if (this.plungerVibrateTimer) {
      this.plungerVibrateTimer.destroy()
      this.plungerVibrateTimer = null!
    }
  }

  private shakePlunger() {
    if (!this.plunger) return
    // Delegate plunger shake to AnimationManager
    this.animationManager.shakeSprite(this.plunger, { intensity: 6, duration: 800, interval: 40 })
  }

  private vibratePlunger() {
    if (!this.plunger) return
    // Delegate plunger subtle vibration to AnimationManager
    this.animationManager.shakeSprite(this.plunger, { intensity: 3, duration: 500, interval: 30 })
  }

  private updateToiletSprite() {
    if (! this.toilet) return
    
    // Determine which toilet texture to use based on FlushCount
    let textureKey = 'toilet' // Default (FlushCount = 0)
    
    if (this.FlushCount === 1) {
      textureKey = 'toilet1'
    } else if (this.FlushCount === 2) {
      textureKey = 'toilet2'
    } else if (this.FlushCount === 3) {
      textureKey = 'toilet3'
    } else if (this.FlushCount >= 4) {
      textureKey = 'toilet4'
    }
    
    // Update the toilet texture
    this.toilet.setTexture(textureKey)
  }

  private shakeToilet() {
    if (!this.toilet) return

    // Store original position
    const originalX = this.toilet.x
    const originalY = this.toilet.y

    // Create a variable to track shake intensity that decreases over time
    let shakeIntensity = 8 // Start with strong shake (8 pixels)
    const minIntensity = 0.5 // End with very light shake (0.5 pixel)
    const shakeDuration = 6000 // 6 seconds total
    const shakeInterval = 50 // Update every 50ms

    // Function to update shake position
    const updateShake = () => {
      const randomX = originalX + Phaser.Math.Between(-shakeIntensity, shakeIntensity)
      const randomY = originalY + Phaser.Math.Between(-shakeIntensity, shakeIntensity)
      this.toilet.setPosition(randomX, randomY)
    }

    // Start the shaking timer
    const shakeTimer = this.time.addEvent({
      delay: shakeInterval,
      callback: updateShake,
      repeat: (shakeDuration / shakeInterval) - 1 // Total number of shakes
    })

    // Gradually reduce shake intensity over time
    const intensityTimer = this.time.addEvent({
      delay: 200, // Update intensity every 200ms
      callback: () => {
        // Gradually reduce intensity from 8 to 0.5 over 6 seconds
        const elapsed = 6000 - shakeTimer.getRemaining()
        const progress = elapsed / shakeDuration
        shakeIntensity = Math.max(minIntensity, 8 - (7.5 * progress))
      },
      repeat: (shakeDuration / 200) - 1
    })

    // Stop shaking and reset position after 6 seconds
    this.time.delayedCall(shakeDuration, () => {
      shakeTimer.destroy()
      intensityTimer.destroy()
      this.toilet.setPosition(originalX, originalY)
    })
  }

  private setupToilet() {
    // Create the toilet sprite to the left of the towel but closer
    // Moving 10px to the left from previous position (867.68 - 10 = 857.68)
    this.toilet = this.physics.add.staticSprite(857.68, 380.70, 'toilet')
    this.toilet.setDisplaySize(200.00, 200.00)
    this.toilet.setName('toilet') // Set name so we can find it later
    this.toilet.setDepth(-1) // Set lower depth so droppable items appear in front
    
    // Set up physics body for collision detection
    this.toilet.body.setSize(200, 200)
    this.toilet.body.setOffset(-100, -100) // Center the physics body
    
    // Make toilet interactive and add click handler
    this.toilet.setInteractive()
    this.toilet.on('pointerdown', () => {
      this.playToiletSound()
    })
  }

  private setupSink() {
    // Create the sink sprite at the specified position and size
    this.sink = this.physics.add.staticSprite(1121.33, 419.08, 'sink')
    this.sink.setDisplaySize(200.00, 200.00)
    this.sink.setName('sink')
    this.sink.setDepth(0) // Changed from -1 to 0 to be in front of Goo-mba (-0.5)
    
    // Set up physics body
    this.sink.body.setSize(200, 200)
    this.sink.body.setOffset(-100, -100)
    
    // Create faucet sound WITHOUT loop - let it play once and finish naturally
    this.faucetSound = this.sound.add('faucet', { volume: 0.7, loop: false })
    
    // Make sink interactive and add click handler
    this.sink.setInteractive()
    this.sink.on('pointerdown', () => {
      this.toggleSink()
    })
  }

  private toggleSink() {
    if (this.isSinkOn) {
      // Turn sink off - switch back to original sink texture
      this.sink.setTexture('sink')
      
      // Stop the faucet sound immediately
      if (this.faucetSound.isPlaying) {
        this.faucetSound.stop()
      }
      
      this.isSinkOn = false
      
      // Stop the shake animation
      this.stopSinkShake()
    } else {
      // Turn sink on - switch to sinkon texture and play faucet sound
      this.sink.setTexture('sinkon')
      this.faucetSound.play()
      this.isSinkOn = true
      
      // Start the shake animation
      this.startSinkShake()
      
      // Listen for when the faucet sound completes naturally and automatically turn off sink
      this.faucetSound.once('complete', () => {
        if (this.isSinkOn) {
          // Automatically turn sink off when sound finishes naturally
          this.sink.setTexture('sink')
          this.isSinkOn = false
          this.stopSinkShake()
        }
      })
    }
    
    // Add visual feedback - slight scale animation
    this.tweens.add({
      targets: this.sink,
      scaleX: this.sink.scaleX * 1.05,
      scaleY: this.sink.scaleY * 1.05,
      duration: 150,
      yoyo: true,
      ease: 'Power2.easeOut'
    })
  }

  private startSinkShake() {
    // Stop any existing shake animation
    this.stopSinkShake()
    
    // Delegate subtle shake to AnimationManager
    this.sinkShakeTween = this.animationManager.subtleJitter(this.sink, { intensity: 1, interval: 100 })
  }

  private stopSinkShake() {
    if ( this.sinkShakeTween) {
      this.sinkShakeTween.destroy()
      this.sinkShakeTween = undefined
      
      // Reset sink to original position
      this.sink.setPosition(1121.33, 419.08)
    }
  }

  private setupTowel() {
    // Create the towel sprite at the specified position and size
    const towel = this.physics.add.staticSprite(967.68, 363.52, 'towel')
    towel.setDisplaySize(131.22, 131.22)
    towel.setName('towel')
    towel.setDepth(-1) // Set lower depth so droppable items appear in front
    
    // Set up physics body
    towel.body.setSize(131.22, 131.22)
    towel.body.setOffset(-65.61, -65.61)
    
    // Make towel interactive and add click handler
    towel.setInteractive()
    towel.on('pointerdown', () => {
      this.onTowelClick()
    })
  }

  private onTowelClick() {
    // Only work if toilet is not clogged (FlushCount is 0, meaning toilet is clean)
    // When FlushCount is 0, the plunger is not active, so toilet is not clogged
    if (this.FlushCount > 0) return // If FlushCount > 0, toilet is clogged, don't spawn items
    
    // Get all existing tier 1 items on the field
    const existingTier1Items = this.getExistingTier1Items()
    
    // Check if there are any valid combinations among existing items
    if (this.hasValidTier1Combinations(existingTier1Items)) return
    
    // If no valid combinations exist, spawn a compatible item
    this.spawnCompatibleTier1Item(existingTier1Items)
  }

  private getExistingTier1Items(): string[] {
    const tier1Items: string[] = []
    
    // Get all items from the scene that have itemName property
    this.children.list.forEach(child => {
      if ((child as any).itemName) {
        const itemName = (child as any).itemName
        // Check if it's a tier 1 item using the merge data
        if (this.isTier1Item(itemName)) {
          tier1Items.push(itemName)
        }
      }
    })
    
    return tier1Items
  }

  private isTier1Item(itemName: string): boolean {
    // Import the tier 1 check from merge data
    const { isTier1 } = require('../config/mergeDataFull')
    return isTier1(itemName)
  }

  private hasValidTier1Combinations(tier1Items: string[]): boolean {
    const { getMergeResult } = require('../config/mergeDataFull')
    
    // Check all pairs of existing tier 1 items
    for (let i = 0; i < tier1Items.length; i++) {
      for (let j = i + 1; j < tier1Items.length; j++) {
        const result = getMergeResult(tier1Items[i], tier1Items[j])
        if (result) {
          return true // Found at least one valid combination
        }
      }
    }
    
    return false // No valid combinations found
  }

  private spawnCompatibleTier1Item(existingTier1Items: string[]) {
    if (existingTier1Items.length === 0) {
      // If no tier 1 items exist, spawn a random one
      const { pickRandomTier1 } = require('../config/mergeDataFull')
      const randomItem = pickRandomTier1()
      this.spawnItemFromTowel(randomItem)
      return
    }
    
    const { getTier1Partners, SPAWNABLE_TIER1 } = require('../config/mergeDataFull')
    
    // Find all possible partners for existing items
    const possiblePartners: string[] = []
    
    existingTier1Items.forEach(existingItem => {
      const partners = getTier1Partners(existingItem)
      partners.forEach(partner => {
        if (!possiblePartners.includes(partner) && !existingTier1Items.includes(partner)) {
          possiblePartners.push(partner)
        }
      })
    })
    
    if (possiblePartners.length > 0) {
      // Spawn a random compatible partner
      const randomPartner = possiblePartners[Math.floor(Math.random() * possiblePartners.length)]
      this.spawnItemFromTowel(randomPartner)
    } else {
      // Fallback: spawn any spawnable tier 1 item
      const availableItems = SPAWNABLE_TIER1.filter(item => !existingTier1Items.includes(item))
      if (availableItems.length > 0) {
        const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)]
        this.spawnItemFromTowel(randomItem)
      }
    }
  }

  private spawnItemFromTowel(itemName: string) {
    // Get reference to the merge system's item manager
    const merge = this.getMergeSystem()
    if (!merge) return
    
    // Spawn item behind the towel (slightly to the left)
    const towelX = 967.68
    const towelY = 363.52
    const spawnX = towelX - 80 // Spawn 80 pixels to the left of towel
    const spawnY = towelY
    
    const item = merge.items.spawn(itemName, spawnX, spawnY)
    
    // Animate item sliding out from behind towel
    this.tweens.add({
      targets: item,
      x: towelX + 100, // Slide to the right of towel
      duration: 800,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // Then drop to floor level
        const floorY = 473 - 18 // Floor platform top minus half item height
        this.tweens.add({
          targets: item,
          y: floorY,
          duration: 400,
          ease: 'Power2.easeIn'
        })
      }
    })
    
    // Add slight rotation during slide
    this.tweens.add({
      targets: item,
      angle: 90,
      duration: 800,
      ease: 'Power1.easeOut'
    })
  }

  private getMergeSystem() {
    // Return reference to the merge system if available
    // This assumes the merge system is stored as a scene property
    return (this as any).mergeSystem || null
  }

  private setupNewSprite() {
    // Create animation for the new sprite (4 frames at 0.25 fps)
    this.anims.create({
      key: 'newSpriteAnim',
      frames: this.anims.generateFrameNumbers('newSprite', { start: 0, end: 3 }),
      frameRate: 0.25, // 0.25 frames per second (1 frame every 4 seconds)
      duration: 16000, // 16 seconds total duration (4 frames * 4 seconds each)
      repeat: -1 // Loop forever
    })

    // Create the new sprite at specified position with exact dimensions - static, no interaction
    const newSprite = this.add.sprite(651.8026101141925, 186.97354614237588, 'newSprite', 0)
    newSprite.setDisplaySize(87.48137007449901, 47.135068652692226)
    newSprite.play('newSpriteAnim')
  }

  private setupCenterBox() {
    // Create the center box attached to the alientube
    // Position will be set relative to the alientube in setupAlientube
    const centerBox = this.add.rectangle(0, 0, 100, 100, 0x00ff00)
    centerBox.setName('centerBox')
    centerBox.setDepth(1500) // Set depth higher than alientube (1000) and mergable items (1000)
    
    // Make the box interactive to detect drops
    centerBox.setInteractive()
    
    // Store reference to the center box for drop detection
    this.centerBox = centerBox
    
    // Hide the center box from view (invisible but still functional)
    centerBox.setVisible(false)
    
    // Add mouse wheel resizing and dragging functionality
    this.setupCenterBoxControls(centerBox)
  }

  private setupCenterBoxControls(centerBox: Phaser.GameObjects.Rectangle) {
    // Center box is now attached to alientube - no manual controls needed
    // Mouse wheel resizing and WASD movement removed
  }

  private setupBoxSpawner() {
    // Create a new BoxSpawner instance
    this.boxSpawner = new BoxSpawner(this)
  }

  public recreateCustomCursor() {
    if (!this.sceneManager) return
    this.sceneManager.recreateCustomCursor()
  }

  private setupToiletPaperBackground() {
    // Create the toilet paper background sprite at the specified position using the @a-futurist-2 asset
    this.toiletPaperBg = this.add.sprite(750, 333, 'toilet_paper_asset')
    this.toiletPaperBg.setDisplaySize(80, 80)
    this.toiletPaperBg.setName('toilet_paper_background')
    this.toiletPaperBg.setDepth(-5) // Set low depth so it appears behind other objects
    
    // No physics body or interactivity - it's just a background decoration
    
    // Start the random blinking animation with new timing
    this.startToiletPaperBlinking()
  }

  private showToiletPaperFlush() {
    if (!this.toiletPaperBg || !this.toiletPaperBg.active) return
    
    // Cancel any existing flush timer
    if (this.toiletPaperFlushTimer) {
      this.toiletPaperFlushTimer.destroy()
      this.toiletPaperFlushTimer = undefined
    }
    
    // Cancel blink timer during flush animation
    if (this.toiletPaperBlinkTimer) {
      this.toiletPaperBlinkTimer.destroy()
      this.toiletPaperBlinkTimer = undefined
    }
    
    // Switch to tp texture for flush animation and maintain size
    this.toiletPaperBg.setTexture('tp')
    this.toiletPaperBg.setDisplaySize(80, 80) // Ensure size stays consistent
    
    // After 6 seconds, switch back to original texture and restart blinking
    this.toiletPaperFlushTimer = this.time.delayedCall(6000, () => {
      if (this.toiletPaperBg && this.toiletPaperBg.active) {
        this.toiletPaperBg.setTexture('toilet_paper_asset')
        this.toiletPaperBg.setDisplaySize(80, 80) // Ensure size stays consistent
        // Restart the blinking animation
        this.startToiletPaperBlinking()
      }
      this.toiletPaperFlushTimer = undefined
    })
  }

  private startToiletPaperBlinking() {
    // Don't start blinking if flush animation is active
    if (this.toiletPaperFlushTimer) return
    
    // Create a timer that triggers every 10 seconds (changed from 10-15 seconds random)
    const scheduleNextBlink = () => {
      const blinkDelay = 10000 // 10 seconds in milliseconds
      
      this.toiletPaperBlinkTimer = this.time.delayedCall(blinkDelay, () => {
        // Only blink if not in flush mode
        if (!this.toiletPaperFlushTimer) {
          this.blinkToiletPaper()
          scheduleNextBlink() // Schedule the next blink
        }
      })
    }
    
    // Start the first blink cycle
    scheduleNextBlink()
  }

  private blinkToiletPaper() {
    if (! this.toiletPaperBg || !this.toiletPaperBg.active || this.toiletPaperFlushTimer) return
    
    // Switch to tpblink texture and maintain size
    this.toiletPaperBg.setTexture('tpblink')
    this.toiletPaperBg.setDisplaySize(80, 80) // Ensure size stays consistent
    
    // After 0.5 seconds, switch back to original texture (changed from 1 second)
    this.time.delayedCall(500, () => {
      if (this.toiletPaperBg && this.toiletPaperBg.active && ! this.toiletPaperFlushTimer) {
        this.toiletPaperBg.setTexture('toilet_paper_asset')
        this.toiletPaperBg.setDisplaySize(80, 80) // Ensure size stays consistent
      }
    })
  }

  private setupCollisionEditorKey() {
    // Add F9 key listener to launch collision editor
    this.input.keyboard!.on('keydown-F9', () => {
      // Pause this scene and launch the collision editor
      this.scene.pause()
      this.scene.launch('CollisionEditor')
    })

    // Add F8 key listener to launch item catalog
    this.input.keyboard!.on('keydown-F8', () => {
      // Pause this scene and launch the item catalog
      this.scene.pause()
      this.scene.launch('ItemCatalog')
      
      // Recreate cursor after a brief delay to ensure it's on top of the overlay
      this.time.delayedCall(100, () => {
        this.recreateCustomCursor()
      })
    })

    // Add F7 key listener to open store
    this.input.keyboard!.on('keydown-F7', () => {
      if (this.storeManager) {
        this.storeManager.openStore()
      }
    })

    // Add ESC key listener to launch pause menu
    this.input.keyboard!.on('keydown-ESC', () => {
      // Pause this scene and launch the pause menu
      this.scene.pause()
      this.scene.launch('PauseMenu')
    })

    // Add Shift+D hotkey for texture debugging - improved implementation
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.shiftKey && event.key.toLowerCase() === 'd') {

        const ptr = this.input.activePointer;

        
        // Get all objects under the pointer
        const hits = this.input.hitTestPointer(ptr);

        
        if (hits.length > 0) {
          const top = hits[0] as any;

          
          if (top && top.texture) {

            this.logTextureInfo(top.texture.key, top);
          } else {

            // Try to get texture info from other properties
            if (top.frame && top.frame.texture) {

              this.logTextureInfo(top.frame.texture.key, top);
            } else {
          // No texture found on object
            }
          }
        } else {

          
          // Also try to get all interactive objects in the scene
          const allObjects = this.children.list.filter(child => child.input && child.input.enabled);

          
          allObjects.forEach((obj, index) => {
            const bounds = (obj as any).getBounds ? (obj as any).getBounds() : null;
            // Object debug info
          });
        }
      }
    });

    // Add = key listener to give 10 goo (cheat/debug feature)
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.key === '=') {
        // Only give goo if no UI is open (store manager not open)
        if (!this.storeManager || !this.storeManager.isOpen()) {
          // Give 10 goo to the player
          if (this.gooCounter) {
            this.gooCounter.collectGoo(10)
            
            // Show a brief notification
            const notification = this.add.text(this.scale.width / 2, this.scale.height / 2, "+10 Goo!", {
              fontSize: "24px",
              color: "#27ae60",
              backgroundColor: "rgba(0,0,0,0.8)",
              padding: { x: 12, y: 8 }
            })
            notification.setOrigin(0.5)
            notification.setDepth(3000)
            
            // Animate and fade out the notification
            this.tweens.add({
              targets: notification,
              y: notification.y - 50,
              alpha: 0,
              duration: 1500,
              ease: 'Power2.easeOut',
              onComplete: () => notification.destroy()
            })
          }
        }
      }
    })
  }

  private logTextureInfo(key: string, obj?: Phaser.GameObjects.GameObject) {
    // delegate to SceneManager
    if (!this.sceneManager) return
    this.sceneManager.logTextureInfo(key, obj)
  }

  private setupGooCounter() {
    // Create goo counter in top-left corner
    this.gooCounter = new GooCounter(this);
    
    // Register the counter with the global collection system
    GooCollectionSystem.getInstance().setGooCounter(this.gooCounter);
  }

  private setupRadio() {
    const radio = this.add.sprite(964.6513866231648, 195.0240238581764, 'radio')
    radio.setDisplaySize(88.63848717161304, 88.63848717161304)
    radio.setScale(0.08656102262852836, 0.08656102262852836)
    radio.setName('radio')
    radio.setDepth(-1)
    radio.setInteractive()
    this.radioManager = new RadioManager(this, radio)
  }

  private setupEnemyManager() {
    this.enemyManager = new EnemyManager(this)
  }

  private setupStoreManager() {
    this.storeManager = new StoreManager(this)
  }

  private setupAchievementManager() {
    this.achievementManager = new AchievementManager(this)
  }

  private setupResearchLog() {
    // Check if the research log image loaded successfully
    if (this.textures.exists('researchlog')) {
      // Create the research log image at the original position
      this.researchLog = this.add.image(
        this.researchLogOriginalPosition.x, 
        this.researchLogOriginalPosition.y, 
        'researchlog'
      );

    } else {
      // Create a fallback colored rectangle if image failed to load
      this.researchLog = this.add.rectangle(
        this.researchLogOriginalPosition.x, 
        this.researchLogOriginalPosition.y, 
        200, 150, 
        0x8B4513, 0.8
      );

    }
    
    // Set initial size and scale
    this.researchLog.setDisplaySize(120, 90);
    this.researchLog.setScale(this.researchLogOriginalPosition.scale);
    this.researchLogScale = this.researchLogOriginalPosition.scale;
    
    // Make it interactive for hover and click effects
    this.researchLog.setInteractive();
    this.researchLog.setName('researchlog');
    this.researchLog.setDepth(1000); // Higher depth to be in front of other objects
    
    // Start hover animation since it begins in small position
    this.tweens.add({
      targets: this.researchLog,
      y: this.researchLog.y - 5, // Float up slightly
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Math.random() * 2000 // Random delay between 0-2000ms to desynchronize
    });
    
    // Add hovering animation like bestiary (only when in small position)
    this.researchLog.on('pointerover', () => {
      this.researchLog.setScale(this.researchLogScale * 1.1); // Slight scale up on hover
      this.researchLog.setTint(0xffffaa); // Light yellow tint on hover
    });
    
    this.researchLog.on('pointerout', () => {
      this.researchLog.setScale(this.researchLogScale); // Return to normal scale
      this.researchLog.clearTint(); // Remove tint
    });
    
    // Add click handler to toggle between positions
    this.researchLog.on('pointerdown', () => {
      if (this.researchLogIsExpanded) {
        // Return to original position
        this.researchLog.x = this.researchLogOriginalPosition.x;
        this.researchLog.y = this.researchLogOriginalPosition.y;
        this.researchLog.setScale(this.researchLogOriginalPosition.scale);
        this.researchLogScale = this.researchLogOriginalPosition.scale;
        this.researchLogIsExpanded = false;

        
        // Start hover animation when returning to small position
        this.tweens.add({
          targets: this.researchLog,
          y: this.researchLog.y - 5, // Float up slightly from new position
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: Math.random() * 2000 // Random delay to keep it desynchronized
        });
      } else {
        // Move to expanded position
        this.researchLog.x = this.researchLogExpandedPosition.x;
        this.researchLog.y = this.researchLogExpandedPosition.y;
        this.researchLog.setScale(this.researchLogExpandedPosition.scale);
        this.researchLogScale = this.researchLogExpandedPosition.scale;
        this.researchLogIsExpanded = true;

        
        // Stop hover animation when expanded
        this.tweens.killTweensOf(this.researchLog);
      }
    });
    
    // Add mouse wheel event for resizing (only when expanded)
    this.researchLog.on('wheel', (pointer: Phaser.Input.Pointer, deltaX: number, deltaY: number) => {
      // Only allow resizing when expanded
      if (this.researchLogIsExpanded) {
        // Adjust scale based on wheel direction
        const scaleChange = deltaY > 0 ? 0.05 : -0.05; // Smaller scale changes for precision
        this.researchLogScale = Math.max(0.1, Math.min(1.0, this.researchLogScale + scaleChange));
        
        // Apply new scale
        this.researchLog.setScale(this.researchLogScale);
        
        // Update expanded position scale
        this.researchLogExpandedPosition.scale = this.researchLogScale;
        
        // Prevent event from bubbling to other wheel handlers
        pointer.event.stopPropagation();
      }
    });
    

  }

  private setupScoreImage() {
    // Check if the score image loaded successfully
    if (this.textures.exists('score')) {
      // Create the score image at the permanent position
      this.scoreImage = this.add.image(856.43, 36.30, 'score');

    } else {
      // Create a fallback colored rectangle if image failed to load
      this.scoreImage = this.add.rectangle(856.43, 36.30, 80, 80, 0x00ff00, 0.8);

    }
    
    // Set initial size and scale to match permanent position
    this.scoreImage.setDisplaySize(80, 80);
    this.scoreImage.setScale(0.1);
    this.scoreImageScale = 0.1;
    
    // Set name and depth (no longer interactive)
    this.scoreImage.setName('score');
    this.scoreImage.setDepth(1000); // Higher depth to be in front of other objects
    
            // Create score text display next to the score image
        this.scoreText = this.add.text(905, 31.30, '0000000', {
          fontSize: '36px',
          color: '#228B22', // Grassy green color
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        });
    this.scoreText.setOrigin(0, 0.5); // Left-aligned, vertically centered
    this.scoreText.setDepth(1001); // Higher depth than score image
    this.scoreText.setName('scoreText');
    
    // Initialize score display
    this.updateScoreDisplay();

  }

  private updateScoreDisplay() {
    // Format score with leading zeros to maintain 7-digit display
    const formattedScore = this.currentScore.toString().padStart(7, '0');
    this.scoreText.setText(formattedScore);
  }

  private addScore(points: number) {
    this.currentScore += points;
    // Prevent score from going below 0
    if (this.currentScore < 0) {
      this.currentScore = 0;
    }
    this.updateScoreDisplay();
  }

  private setupInteractiveMop() {
    // Check if the mop image loaded successfully
    if (!this.textures.exists('interactive_mop_asset')) {

      return;
    }
    
    // Create the mop sprite at permanent position
    this.interactiveMop = this.add.sprite(236, 356, 'interactive_mop_asset');
    this.interactiveMop.setDisplaySize(80, 80);
    this.interactiveMop.setName('interactive_mop');
    this.interactiveMop.setDepth(-100); // Very low depth so items appear in front of it
    
    // Apply permanent scale
    this.interactiveMop.setScale(0.20);
    
    // Store permanent position and scale
    this.interactiveMopOriginalX = 236;
    this.interactiveMopOriginalY = 356;
    this.interactiveMopScale = 0.20;
    
    // Make mop interactive for dragging
    this.interactiveMop.setInteractive();
    this.input.setDraggable(this.interactiveMop);
    
    // Track if mop is being dragged
    this.isMopBeingDragged = false;
    
    // Handle drag start
    this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject === this.interactiveMop) {
        this.isMopBeingDragged = true;

        // Bring mop to front when dragging so items appear behind it
        this.interactiveMop.setDepth(1000);
      }
    });
    
    // Handle drag
    this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
      if (gameObject === this.interactiveMop) {
        this.interactiveMop.x = dragX;
        this.interactiveMop.y = dragY;
      }
    });
    
    // Handle drag end - start spring back animation
    this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject === this.interactiveMop) {
        this.isMopBeingDragged = false;

        // Disable mop interaction while springing back
        this.interactiveMop.disableInteractive();
        this.springMopBack();
      }
    });
    


  }
  
  private setupAlientube() {
    // Create the alientube sprite at portal position (top of screen)
    this.alientube = this.add.sprite(this.alientubeTargetX, this.alientubePortalY, 'alientube');
    this.alientube.setDisplaySize(100, 100);
    this.alientube.setName('alientube');
    this.alientube.setDepth(1000); // High depth to be in front
    this.alientube.setScale(this.alientubeTargetScale);
    
    // Initially hide the alientube - it will emerge when needed
    this.alientube.setVisible(false);
    
    // Position the center box relative to the alientube
    if (this.centerBox) {
      // Set the center box to the permanent position relative to the alientube
      this.centerBox.setPosition(this.alientube.x + 29, this.alientube.y + 91); // Offset from alientube center
      this.centerBox.setScale(0.60); // Set to permanent scale
    }
    
    // Alientube is no longer interactive for dragging or resizing
    
    // Handle spacebar for coordinate recording
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey.on('down', () => {

    });
    
    // Handle T key for debug retract/extend
    const tKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    tKey.on('down', () => {
      if (this.alientube && !this.isAlientubeEmerging) {
        if (this.alientube.y >= this.alientubeTargetY - 5) { // Allow small tolerance for floating point
          // Tube is extended, retract it to portal
                   this.retractAlientubeToPortal();
       } else {
         // Tube is retracted, extend it to target
         this.triggerAlientubeEmergence();
        }
      }
    });
  }
  
  public triggerAlientubeEmergence(): void {
    if (this.alientube && !this.isAlientubeEmerging) {
      this.isAlientubeEmerging = true;
      
      // Get tube sound duration and play it
      let animationDuration = 3000; // Default fallback duration
      if (this.cache.audio.exists('tubesound')) {
        const tubeSound = this.sound.add('tubesound', { volume: 1.0 });
        tubeSound.play();
        
        // Get the audio duration and convert to milliseconds, but make it faster
        if (tubeSound.totalDuration) {
          const audioDuration = tubeSound.totalDuration * 1000;
          // Make animation 1.5x faster than audio duration, with a minimum of 1500ms
          animationDuration = Math.max(1500, audioDuration * 0.67);
          
        }
      } else {
        console.warn('Tube sound not found in cache, using default animation duration');
      }
      
      // Reset alientube to portal position
      this.alientube.setPosition(this.alientubeTargetX, this.alientubePortalY);
      this.alientube.setScale(this.alientubeTargetScale);
      this.alientube.setVisible(true);
      
      // Position the center box (but keep it hidden)
      if (this.centerBox) {
        this.centerBox.setPosition(this.alientube.x + 29, this.alientube.y + 91);
      }
      
      // Create the emerging animation - duration synchronized with audio
      this.tweens.add({
        targets: this.alientube,
        y: this.alientubeTargetY,
        duration: animationDuration,
        ease: 'Power2.easeOut',
        onComplete: () => {
          this.isAlientubeEmerging = false;
          // Update center box position to final target position
          if (this.centerBox) {
            this.centerBox.setPosition(this.alientube.x + 29, this.alientube.y + 91);
          }
          
          
          // Play vacuum sound when tube is fully extended - loop until retracted
          if (this.cache.audio.exists('vacuum')) {
            this.vacuumSound = this.sound.add('vacuum', { 
              volume: 1.0,
              loop: true // Loop continuously
            });
            this.vacuumSound.play();
            
          } else {
            console.warn('Vacuum sound not found in cache');
          }
        }
      });
    }
  }
  
  public retractAlientubeToPortal(): void {
    if (this.alientube && !this.isAlientubeEmerging) {
      this.isAlientubeEmerging = true;
      
      // Stop the looping vacuum sound when retracting
      this.stopVacuumSound();
      
      // Get tube sound duration and play it
      
      // Get tube sound duration and play it
      let animationDuration = 2000; // Default fallback duration
      if (this.cache.audio.exists('tubesound')) {
        const tubeSound = this.sound.add('tubesound', { volume: 1.0 });
        tubeSound.play();
        
        // Get the audio duration and convert to milliseconds, but make it faster
        if (tubeSound.totalDuration) {
          const audioDuration = tubeSound.totalDuration * 1000;
          // Make animation 1.5x faster than audio duration, with a minimum of 1000ms
          animationDuration = Math.max(1000, audioDuration * 0.67);
          
        }
      } else {
        console.warn('Tube sound not found in cache, using default animation duration');
      }
      
      // Center box is already hidden, no need to hide it again
      
      // Create the retracting animation - duration synchronized with audio
      this.tweens.add({
        targets: this.alientube,
        y: this.alientubePortalY,
        duration: animationDuration,
        ease: 'Power2.easeIn',
        onComplete: () => {
          this.isAlientubeEmerging = false;
          this.alientube.setVisible(false); // Hide when fully retracted
          
          
          // Ensure vacuum sound is stopped when retraction is complete
          this.stopVacuumSound();
        }
      });
    }
  }
  
  // Public method to force-stop the vacuum sound
  public stopVacuumSound(): void {
    if (this.vacuumSound && this.vacuumSound.isPlaying) {
      this.vacuumSound.stop();
      this.vacuumSound.destroy();
      this.vacuumSound = undefined;
      
    }
  }
  
  private setupOccluder(): void {
    // Create the occluder rectangle (invisible fill)
    this.occluder = this.add.graphics();
    this.occluder.fillStyle(0x000000, 0.5); // Semi-transparent black fill
    this.occluder.fillRect(this.occluderX, this.occluderY, this.occluderWidth, this.occluderHeight);
    
    // Create the visible border around the occluder
    this.occluderBorder = this.add.graphics();
    this.occluderBorder.lineStyle(3, 0xff0000, 1); // Red border, 3px thick
    this.occluderBorder.strokeRect(this.occluderX, this.occluderY, this.occluderWidth, this.occluderHeight);
    
    // Set depth to be above other elements
    this.occluder.setDepth(1500);
    this.occluderBorder.setDepth(1501);
    
    // Hide the occluder elements (invisible but still functional as mask)
    this.occluder.setVisible(false);
    this.occluderBorder.setVisible(false);
    
    // Create the initial mask for the alientube
    this.createAlientubeMask();
    
    // Make occluder interactive for dragging
    this.occluder.setInteractive(new Phaser.Geom.Rectangle(this.occluderX, this.occluderY, this.occluderWidth, this.occluderHeight), Phaser.Geom.Rectangle.Contains);
    this.input.setDraggable(this.occluder);
    
    // Handle drag start
    this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject === this.occluder) {
        this.isOccluderDragged = true;
        this.occluderDragOffset.x = pointer.x - this.occluderX;
        this.occluderDragOffset.y = pointer.y - this.occluderY;
      }
    });
    
    // Handle drag
    this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
      if (gameObject === this.occluder) {
        this.occluderX = dragX - this.occluderDragOffset.x;
        this.occluderY = dragY - this.occluderDragOffset.y;
        this.updateOccluder();
      }
    });
    
    // Handle drag end
    this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject === this.occluder) {
        this.isOccluderDragged = false;
      }
    });
    
    // Handle mouse wheel for resizing
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number, deltaZ: number) => {
      // Check if pointer is within the occluder bounds manually
      if (this.occluder && 
          pointer.x >= this.occluderX && pointer.x <= this.occluderX + this.occluderWidth &&
          pointer.y >= this.occluderY && pointer.y <= this.occluderY + this.occluderHeight) {
        // Resize width with horizontal scroll, height with vertical scroll
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal scroll - resize width
          const widthChange = deltaX > 0 ? 10 : -10;
          this.occluderWidth = Math.max(50, Math.min(500, this.occluderWidth + widthChange));
        } else {
          // Vertical scroll - resize height
          const heightChange = deltaY > 0 ? 10 : -10;
          this.occluderHeight = Math.max(50, Math.min(500, this.occluderHeight + heightChange));
        }
        this.updateOccluder();
      }
    });
    
    // Add key controls for fine-tuning
    const arrowKeys = this.input.keyboard.addKeys('W,A,S,D');
    arrowKeys.W.on('down', () => { this.occluderY -= 5; this.updateOccluder(); });
    arrowKeys.S.on('down', () => { this.occluderY += 5; this.updateOccluder(); });
    arrowKeys.A.on('down', () => { this.occluderX -= 5; this.updateOccluder(); });
    arrowKeys.D.on('down', () => { this.occluderX += 5; this.updateOccluder(); });
    
    // Add key controls for resizing
    const resizeKeys = this.input.keyboard.addKeys('Q,E,R,F');
    resizeKeys.Q.on('down', () => { this.occluderWidth -= 5; this.updateOccluder(); });
    resizeKeys.E.on('down', () => { this.occluderWidth += 5; this.updateOccluder(); });
    resizeKeys.R.on('down', () => { this.occluderHeight -= 5; this.updateOccluder(); });
    resizeKeys.F.on('down', () => { this.occluderHeight += 5; this.updateOccluder(); });
  }
  
  private updateOccluder(): void {
    // Update occluder fill
    this.occluder.clear();
    this.occluder.fillStyle(0x000000, 0.5);
    this.occluder.fillRect(this.occluderX, this.occluderY, this.occluderWidth, this.occluderHeight);
    
    // Update occluder border
    this.occluderBorder.clear();
    this.occluderBorder.lineStyle(3, 0xff0000, 1);
    this.occluderBorder.strokeRect(this.occluderX, this.occluderY, this.occluderWidth, this.occluderHeight);
    
    // Update interactive area
    this.occluder.setInteractive(new Phaser.Geom.Rectangle(this.occluderX, this.occluderY, this.occluderWidth, this.occluderHeight), Phaser.Geom.Rectangle.Contains);
    
    // Update the mask on the alientube
    this.createAlientubeMask();
  }
  
  private createAlientubeMask(): void {
    if (this.alientube) {
      // Create a Graphics-based occluder (NOT this.add.rectangle)
      const occluder = this.add.graphics()
        .setScrollFactor(1)        // match your tube/RT scroll factor
        .setVisible(false);        // invisible but still used as mask

      // Draw the band you want to HIDE (using your positioned coordinates)
      const bandX = this.occluderX;
      const bandY = this.occluderY;           // y of the band to hide (your red box)
      const bandW = this.occluderWidth;
      const bandH = this.occluderHeight;      // band thickness
      occluder.clear();
      occluder.fillStyle(0xffffff, 1);
      occluder.fillRect(bandX, bandY, bandW, bandH);

      // Build a GeometryMask from the Graphics
      const gMask = new Phaser.Display.Masks.GeometryMask(this, occluder);

      // We drew the area we want to HIDE, so invert the mask:
      gMask.invertAlpha = true;

      // Apply the mask to the alientube sprite
      this.alientube.setMask(gMask);
    }
  }
  
  private springMopBack() {
    // Create a smooth spring-back animation to original position
    this.tweens.add({
      targets: this.interactiveMop,
      x: this.interactiveMopOriginalX,
      y: this.interactiveMopOriginalY,
      duration: 1000, // 1 second spring back
      ease: 'Back.easeOut', // Bouncy spring effect
              onComplete: () => {

          // Re-enable mop interaction after springing back
          this.interactiveMop.setInteractive();
          this.input.setDraggable(this.interactiveMop);
          // Reset mop depth so items appear in front of it again
          this.interactiveMop.setDepth(-100);
        }
      });
    }
  
  private checkMopGooCleaning() {
    if (!this.interactiveMop || !this.interactiveMop.active) return;
    
    // Get all goo splatters in the scene (same as existing mop system)
    const gooSplatters = (this as any).gooSplatters || [];
    
    gooSplatters.forEach((splatter: Phaser.GameObjects.Sprite) => {
      if (!splatter.active) return;
      
      // Check if mop is overlapping with splatter using distance-based detection for small mop
      const distance = Phaser.Math.Distance.Between(
        this.interactiveMop.x, 
        this.interactiveMop.y, 
        splatter.x, 
        splatter.y
      );
      
      // Use a reasonable detection radius (40 pixels) for the small mop
      if (distance < 40) {
        // Check if this splatter was recently cleaned (prevent rapid cleaning)
        const currentTime = this.time.now;
        const lastCleanTime = (splatter as any).lastCleanTime || 0;
        
        if (currentTime - lastCleanTime > 500) { // 500ms cooldown between cleans
          this.cleanSplatterWithMop(splatter);
          (splatter as any).lastCleanTime = currentTime;
        }
      }
    });
  }
  
  private cleanSplatterWithMop(splatter: Phaser.GameObjects.Sprite) {
    // Increment cleanup count (same as existing mop system)
    (splatter as any).cleanupCount = ((splatter as any).cleanupCount || 0) + 1;
    
    // Emit achievement event for splatter cleaning (interactive mop)
    this.events.emit('achievement:splatter_cleaned', 'Interactive Mop');
    
    // Calculate new alpha (reduce by 25% each time)
    const originalAlpha = (splatter as any).originalAlpha || 0.8;
    const cleanupCount = (splatter as any).cleanupCount;
    const maxCleanups = (splatter as any).maxCleanups || 3;
    
    // Tutorial completion is now triggered when the tutorial Unstable Goo is destroyed
    // No longer triggered by cleaning goo puddles
    
    if (cleanupCount >= maxCleanups) {
      // Remove splatter completely after 3rd swipe
      this.removeSplatterWithMop(splatter);
    } else {
      // Reduce opacity by 25%
      const newAlpha = originalAlpha * (1 - (cleanupCount * 0.25));
      
      // Animate the cleaning effect
      this.tweens.add({
        targets: splatter,
        alpha: newAlpha,
        scaleX: splatter.scaleX * 0.95, // Slightly shrink
        scaleY: splatter.scaleY * 0.95,
        duration: 200,
        ease: 'Power2.easeOut',
        onComplete: () => {
          // Add sparkle effect to show cleaning
          this.createCleaningSparkle(splatter.x, splatter.y);
        }
      });
    }
  }
  
  private removeSplatterWithMop(splatter: Phaser.GameObjects.Sprite) {
    // Create final cleaning effect
    this.createCleaningSparkle(splatter.x, splatter.y);
    
    // Collect goo when splatter is completely removed (interactive mop gives 1 goo)
    const { collectGooFromCleaning } = require('../objects/GooCounter');
    collectGooFromCleaning();
    
    // Animate removal
    this.tweens.add({
      targets: splatter,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 300,
      ease: 'Power2.easeIn',
      onComplete: () => {
        // Remove from splatters array
        const gooSplatters = (this as any).gooSplatters || [];
        const index = gooSplatters.indexOf(splatter);
        if (index > -1) {
          gooSplatters.splice(index, 1);
        }
        
        // Destroy the splatter
        splatter.destroy();
      }
    });
  }
  
  private createCleaningSparkle(x: number, y: number) {
    // Create small sparkle particles to show cleaning effect (same as existing mop)
    const sparkleCount = 3;
    
    for (let i = 0; i < sparkleCount; i++) {
      // Create a small white circle as sparkle
      const sparkle = this.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-20, 20),
        3,
        0xffffff
      );
      
      sparkle.setDepth(100); // Above most objects
      
      // Animate sparkle
      this.tweens.add({
        targets: sparkle,
        alpha: 0,
        scaleX: 2,
        scaleY: 2,
        duration: 500,
        ease: 'Power2.easeOut',
        onComplete: () => {
          sparkle.destroy();
        }
      });
    }
  }
  


  update() {
    if (!(this as any).mergeCore) {
    }

    let operationCount = 0;
    const maxOperationsPerFrame = 50;

    this.children.list.forEach(child => {
      operationCount++;
      if (operationCount > maxOperationsPerFrame) return;

      if ((child as any).pendingDestroy && child.active) {
        child.destroy();
      }

      if ((child as any).itemName && child.active) {
        const body = (child as any).body;
        if (body && (isNaN(body.velocity.x) || isNaN(body.velocity.y))) {
          body.setVelocity(0, 0);
        }
      }
    });

    if (this.enemyManager) {
      this.enemyManager.updateEnemies();
      if ((this.enemyManager as any).checkEnemyHazardCollisions) {
        (this.enemyManager as any).checkEnemyHazardCollisions();
      }
    }
    
    // Check if mop is cleaning goo
    this.checkMopGooCleaning();
  }

  private checkEnemyHazardCollisions() {
    const enemies: any[] = [];
    const hazards: any[] = [];
    
    // Import the hazard detection function
    const { isHazard } = require('../config/mergeDataFull');
    
    // Collect all enemies and hazards with more comprehensive detection
    this.children.list.forEach(child => {
      if ((child as any).itemName && child.active) {
        const itemName = (child as any).itemName;
        
        // Enhanced enemy detection - check for all possible enemy types
        if (itemName.startsWith("Enemy:") || 
            itemName === "Unstable Goo" || 
            itemName === "Confetti Storm" || 
            itemName === "Enemy: Goo Tornado" ||
            (child as any).isUnstableGoo ||
            (child as any).isConfettiStorm ||
            (child as any).isGooTornado) {
          enemies.push(child);
        } 
        // Use the improved hazard detection function
        else if (isHazard(itemName)) {
          hazards.push(child);
        }
      }
    });
    
    // Only log when we actually find enemies and hazards
    if (enemies.length > 0 && hazards.length > 0) {

    }
    
    // Check collisions between enemies and hazards
    enemies.forEach(enemy => {
      if (!enemy.active || (enemy as any).isBeingDestroyed) return;
      
      hazards.forEach(hazard => {
        if (!hazard.active || (hazard as any).isBeingDestroyed) return;
        
        // Check if enemy and hazard are overlapping
        if (this.areObjectsOverlapping(enemy, hazard)) {
          // Collision detected
          this.handleEnemyHazardCollision(enemy, hazard);
        }
      });
    });
  }

  private areObjectsOverlapping(obj1: any, obj2: any): boolean {
    // Use multiple methods to check for overlap to ensure reliability
    
    // Method 1: Check if objects are close enough (distance-based)
    const distance = Phaser.Math.Distance.Between(obj1.x, obj1.y, obj2.x, obj2.y);
    const minDistance = 40; // Minimum distance for collision (adjust as needed)
    
    if (distance > minDistance) {
      return false; // Too far apart, definitely not overlapping
    }
    
    // Method 2: Use getBounds if available
    try {
      const bounds1 = obj1.getBounds();
      const bounds2 = obj2.getBounds();
      
      if (bounds1 && bounds2) {
        return Phaser.Geom.Rectangle.Overlaps(bounds1, bounds2);
      }
    } catch (error) {

    }
    
    // Method 3: Fallback - simple radius-based collision
    const obj1Size = Math.max(obj1.displayWidth || obj1.width || 36, obj1.displayHeight || obj1.height || 36) / 2;
    const obj2Size = Math.max(obj2.displayWidth || obj2.width || 36, obj2.displayHeight || obj2.height || 36) / 2;
    const combinedRadius = obj1Size + obj2Size;
    
    return distance < combinedRadius * 0.7; // 70% overlap threshold
  }

  private handleEnemyHazardCollision(enemy: any, hazard: any) {
    // Prevent multiple collision handling for the same objects
    if ((enemy as any).isBeingDestroyed || (hazard as any).isBeingDestroyed) {
      return;
    }
    
    // Mark objects as being destroyed to prevent multiple collisions
    (enemy as any).isBeingDestroyed = true;
    (hazard as any).isBeingDestroyed = true;
    

    
    // IMMEDIATELY stop any ongoing dissolve processes for the enemy
    if ((enemy as any).isDissolving) {
      (enemy as any).isDissolving = false;
      if ((enemy as any).dissolveTimer) {
        (enemy as any).dissolveTimer.destroy();
        (enemy as any).dissolveTimer = null;
      }
    }
    
    // IMMEDIATELY stop any timers and movement for the enemy
    if ((enemy as any).spawnTimer) {
      (enemy as any).spawnTimer.destroy();
      (enemy as any).spawnTimer = null;
    }
    if ((enemy as any).stopTimer) {
      (enemy as any).stopTimer.destroy();
      (enemy as any).stopTimer = null;
    }
    
    // Stop enemy movement immediately
    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
    if (enemyBody) {
      enemyBody.setVelocity(0, 0);
    }
    
    // Get positions for splatter creation
    const enemyX = enemy.x;
    const enemyY = enemy.y;
    const enemyScale = enemy.scaleX;
    
    const hazardx = hazard.x;
    const hazardY = hazard.y;
    const hazardScale = hazard.scaleX;
    
    // Create goo splatters at both positions
    this.enemyManager.createGooSplatterAt(enemyX, enemyY, enemyScale);
    this.enemyManager.createGooSplatterAt(hazardx, hazardY, hazardScale);
    
    // Play destruction sound
    const oozesplatSound = this.sound.add('oozesplat', { volume: 0.8 });
    oozesplatSound.play();
    
    // Award score for destroying enemy
    this.addScore(25);
    
    // Destroy both objects with visual effects IMMEDIATELY
    this.destroyObjectWithEffect(enemy);
    this.destroyObjectWithEffect(hazard);
  }



  private destroyObjectWithEffect(obj: any) {
    // Mark as being destroyed to prevent any other processes from interfering
    (obj as any).isBeingDestroyed = true;
    
    // IMMEDIATELY stop any existing tweens on the object
    this.tweens.killTweensOf(obj);
    
    // IMMEDIATELY stop any timers associated with the object
    if ((obj as any).spawnTimer) {
      (obj as any).spawnTimer.destroy();
      (obj as any).spawnTimer = null;
    }
    if ((obj as any).dissolveTimer) {
      (obj as any).dissolveTimer.destroy();
      (obj as any).dissolveTimer = null;
    }
    if ((obj as any).stopTimer) {
      (obj as any).stopTimer.destroy();
      (obj as any).stopTimer = null;
    }
    
    // IMMEDIATELY stop any sounds associated with the object
    if ((obj as any).spawnSound && (obj as any).spawnSound.isPlaying) {
      (obj as any).spawnSound.stop();
      (obj as any).spawnSound.destroy();
    }
    
    // IMMEDIATELY stop any physics movement
    const body = obj.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
    }
    
    // Set flags to prevent any other systems from processing this object
    (obj as any).isDissolving = false;
    (obj as any).isStopped = true;
    (obj as any).isActive = false;
    
    // Death animation - shrink and fade with spin
    this.tweens.add({
      targets: obj,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      angle: obj.angle + 360, // Full spin while shrinking
      duration: 500,
      ease: 'Power2.easeIn',
      onComplete: () => {
        if (obj.active) {
          // Get merge system to properly destroy the object
          const merge = this.getMergeSystem();
          if (merge && merge.items) {
            merge.items.destroy(obj);
          } else {
            obj.destroy();
          }
        }
      }
    });
    
    // Visual effect - flash effect to indicate destruction
    this.tweens.add({
      targets: obj,
      tint: 0xffffff, // White flash
      duration: 100,
      yoyo: true,
      repeat: 2
    });
  }

  public destroy() {
    if (this.gooCounter) {
      this.gooCounter.destroy()
    }
    if (this.trashRecyclerManager) {
      this.trashRecyclerManager.destroy()
    }
    if (this.enemyManager) {
      this.enemyManager.destroy()
    }
    if (this.sceneManager) {
      this.sceneManager.destroyCursor()
    }
    if (this.boxSpawner) {
      this.boxSpawner.destroy()
    }
    if ((this as any).mergeSystem) {
      (this as any).mergeSystem.destroy?.()
    }
    if (this.toiletSound) {
      this.toiletSound.destroy()
    }
    if (this.plungerSound) {
      this.plungerSound.destroy()
    }
    if (this.faucetSound) {
      this.faucetSound.destroy()
    }
    if (this.sinkShakeTween) {
      this.sinkShakeTween.destroy()
    }
    if (this.toiletPaperBlinkTimer) {
      this.toiletPaperBlinkTimer.destroy()
    }
    if (this.toiletPaperFlushTimer) {
      this.toiletPaperFlushTimer.destroy()
    }
    if (this.autoSaveTimer) {
      this.autoSaveTimer.destroy()
    }
    if (this.physics.world) {
      this.physics.world.destroy()
    }
    if (this.sys.events) {
      this.sys.events.off('wake')
      this.sys.events.off('resume')
    }
    if (this.input) {
      this.input.off('pointermove')
      this.input.off('pointerdown')
      this.input.off('pointerup');
    }

    if (this.time) {
      this.time.events.off('destroy')
    }
    if (this.tweens) {
      this.tweens.events.off('destroy');
    }
    if (this.anims) {
      this.anims.events.off('destroy')
    }
    if (this.scene) {
      this.scene.events.off('destroy')
    }
    if (this.game) {
      this.game.events.off('destroy')
    }

    this.toilet = null
    this.plunger = null
    this.plungerOriginalX = 0
    this.plungerOriginalY = 0
    this.plungerVibrateTimer = null as any
    this.boxSpawner = null as any
    this.customCursor = null as any
    this.isPointerDown = false
    this.hintButton = null as any
    ;(this as any).mergeSystem = null
    this.toiletSound = null as any
    this.plungerSound = null as any
    this.toiletPaperBg = null as any
    this.toiletPaperBlinkTimer = null as any
    this.toiletPaperFlushTimer = null as any
    this.researchLog = null as any
    this.scoreImage = null as any
    this.scoreText = null as any

    if (this.radioManager) {
      this.radioManager.destroy()
    }
    if (this.storeManager) {
      this.storeManager.destroy()
    }
    if (this.recyclerCooldownTimer) {
      this.recyclerCooldownTimer.destroy()
    }

    super.destroy()
  }

  private async saveGameState() {
    // Emit achievement event for game saving
    this.events.emit('achievement:game_saved');
    
          try {
        console.log('🔄 Auto-save triggered (30-second interval)');
        const gameState = {
        tutorialCompleted: !this.tutorialPhase,
        portalCreated: this.portalCreated,
        flushCount: this.FlushCount,
        currentScore: this.currentScore,
        items: this.getAllItemsState(),
        enemies: this.getEnemiesState(),
        gooCount: this.gooCounter ? this.gooCounter.getGooCount() : 0,
        recyclerPurchased: this.trashRecycler ? this.trashRecycler.visible : false,
        goombas: this.getGoombasState(),
        radioVolume: this.radioManager ? this.radioManager.getVolume() : 0.5,
        radioStation: this.radioManager ? this.radioManager.getCurrentSong() : 0,
        radioOn: this.radioManager ? this.radioManager.isPowered() : false,
        sinkOn: this.isSinkOn,
        gooSplatters: this.getGooSplattersState(),
        bestiaryEntries: this.getBestiaryEntriesState(),
        achievements: this.getAchievementsState(),
        portalExists: this.portalCreated && !!this.children.getByName('portal'),
        portalPosition: this.portalCreated ? { x: 564.96, y: 52.41 } : null,
        timestamp: Date.now(),
        version: "1.0"
      };

              // Save to cloud
        const cloudSaveResult = await this.saveService.saveGame(gameState);
        
        if (cloudSaveResult.success) {
          console.log('✅ Auto-save completed successfully');
          this.showSaveNotification('Game saved to cloud!');
        } else {
          console.error('❌ Auto-save failed:', cloudSaveResult.error);
          this.showSaveNotification('Cloud save failed!');
        }
          } catch (error) {
        console.error('❌ Save failed:', error);
        this.showSaveNotification('Save failed!');
      }
  }

  private async loadGameState() {
    // Only load if we're explicitly continuing a saved game
    const saveGameChoice = this.registry.get('saveGameChoice');
    if (saveGameChoice !== 'continue') {
      return false;
    }

          try {
        console.log('🔄 Loading saved game state...');
        // Load from cloud
        const cloudLoadResult = await this.saveService.loadGame();
        let gameState: any = null;

        if (cloudLoadResult.success && cloudLoadResult.data) {
          gameState = cloudLoadResult.data;
          console.log('✅ Game state loaded from cloud');
        } else {
          console.log('ℹ️ No cloud save data found');
          return false;
        }

      
              // Validate save data structure
        if (!gameState.version || !gameState.hasOwnProperty('tutorialCompleted')) {
          console.error('❌ Invalid save data structure');
          return false;
        }

      // Restore tutorial state
      this.tutorialPhase = !gameState.tutorialCompleted;
      this.portalCreated = gameState.portalCreated || false;
      this.FlushCount = gameState.flushCount || 0;
      this.currentScore = gameState.currentScore || 0; // Load saved score

      // Check if portal should exist based on save data
      const shouldHavePortal = gameState.portalExists !== undefined ? gameState.portalExists : gameState.portalCreated;



      // Update toilet sprite to match loaded flush count
      this.updateToiletSprite();

      // Restore goo count if available
      if (gameState.gooCount !== undefined && this.gooCounter) {
        this.gooCounter.setGooCount(gameState.gooCount);
      }

      // Restore radio settings
      if (gameState.radioVolume !== undefined && this.radioManager) {
        this.radioManager.setVolume(gameState.radioVolume);
      }
      if (gameState.radioStation !== undefined && this.radioManager) {
        this.radioManager.setCurrentSong(gameState.radioStation);
      }
      if (gameState.radioOn !== undefined && this.radioManager) {
        if (gameState.radioOn) {
          this.radioManager.setPowerState(true);
        } else {
          this.radioManager.setPowerState(false);
        }
      }

      // Restore sink state
      if (gameState.sinkOn !== undefined) {
        this.isSinkOn = gameState.sinkOn;
        if (this.isSinkOn) {
          this.sink.setTexture('sinkon');
        } else {
          this.sink.setTexture('sink');
        }
      }

      // Restore recycler state
      if (gameState.recyclerPurchased && this.trashRecycler) {
        this.trashRecycler.setActive(true).setVisible(true);
      }

      // Restore goo splatters
      if (gameState.gooSplatters && gameState.gooSplatters.length > 0) {
        this.restoreGooSplattersFromSave(gameState.gooSplatters);
      }

      // Restore bestiary entries
      if (gameState.bestiaryEntries && gameState.bestiaryEntries.length > 0) {
        this.restoreBestiaryEntriesFromSave(gameState.bestiaryEntries);
      }

      // Restore achievements
      if (gameState.achievements && this.achievementManager) {
        this.achievementManager.setProgress(gameState.achievements);
      }

      // If tutorial is completed and portal should exist, mark for creation
      if (gameState.tutorialCompleted && shouldHavePortal) {
        // Ensure tutorial phase is false and portal should be created
        this.tutorialPhase = false;
        this.portalCreated = true; // Mark that portal should exist
        
        // Notify alien order system that tutorial is completed (for saved games)
        if ((this as any).alienOrderSystemInstance) {
          (this as any).alienOrderSystemInstance.setTutorialCompleted(true);
        }
      }

      // Restore enemies first (before regular items)
      if (gameState.enemies && gameState.enemies.length > 0) {
        this.time.delayedCall(500, () => {
          this.restoreEnemiesFromSave(gameState.enemies);
        });
      }

      // Restore goombas
      if (gameState.goombas && gameState.goombas.length > 0) {
        this.time.delayedCall(750, () => {
          this.restoreGoombasFromSave(gameState.goombas);
        });
      }

      // Restore items after a short delay to ensure scene is fully initialized
      if (gameState.items && gameState.items.length > 0) {

        this.time.delayedCall(1500, () => {
          this.restoreItemsFromSave(gameState.items);
        });
      }

              // Emit event that a saved game was loaded - delay it to ensure hint button is ready
        this.time.delayedCall(2000, () => {
          this.events.emit('game:savedGameLoaded');
        });

        console.log('✅ Game state restored successfully');
        return true;
          } catch (error) {
        console.error('❌ Load game state error:', error);
        return false;
      }
  }

  private getAllItemsState(): Array<{name: string, x: number, y: number, scale: number}> {
    const itemsState: Array<{name: string, x: number, y: number, scale: number}> = [];
    
    // Get all items from the scene that have itemName property
    this.children.list.forEach(child => {
      if ((child as any).itemName && child.active) {
        const item = child as any;
        // Include ALL items with itemName, including enemies (they'll be handled by EnemyManager on restore)
        itemsState.push({
          name: item.itemName,
          x: item.x,
          y: item.y,
          scale: item.scaleX // Assuming uniform scaling
        });
      }
    });
    
    return itemsState;
  }

  private getEnemiesState(): Array<{name: string, x: number, y: number, scale: number, type: string}> {
    const enemiesState: Array<{name: string, x: number, y: number, scale: number, type: string}> = [];
    
    // Get all enemies from the scene
    this.children.list.forEach(child => {
      if ((child as any).itemName && child.active) {
        const itemName = (child as any).itemName;
        if (itemName.startsWith("Enemy:") || 
            itemName === "Unstable Goo" || 
            itemName === "Confetti Storm" || 
            itemName === "Enemy: Goo Tornado" ||
            (child as any).isUnstableGoo ||
            (child as any).isConfettiStorm ||
            (child as any).isGooTornado) {
          enemiesState.push({
            name: itemName,
            x: (child as any).x,
            y: (child as any).y,
            scale: (child as any).scaleX,
            type: itemName
          });
        }
      }
    });
    
    return enemiesState;
  }

  private getGoombasState(): Array<{x: number, y: number, scale: number}> {
    const goombasState: Array<{x: number, y: number, scale: number}> = [];
    
    // Get all goombas from the scene
    this.children.list.forEach(child => {
      if ((child as any).itemName === "Goomba" && child.active) {
        goombasState.push({
          x: (child as any).x,
          y: (child as any).y,
          scale: (child as any).scaleX
        });
      }
    });
    
    return goombasState;
  }

  private getGooSplattersState(): Array<{x: number, y: number, alpha: number, scale: number}> {
    const gooSplattersState: Array<{x: number, y: number, alpha: number, scale: number}> = [];
    
    // Get all goo splatters from the scene
    const gooSplatters = (this as any).gooSplatters || [];
    gooSplatters.forEach((splatter: any) => {
      if (splatter && splatter.active) {
        gooSplattersState.push({
          x: splatter.x,
          y: splatter.y,
          alpha: splatter.alpha,
          scale: splatter.scaleX
        });
      }
    });
    
    return gooSplattersState;
  }

  private getBestiaryEntriesState(): Array<string> {
    // Get bestiary entries from the Bestiary scene
    const bestiaryScene = this.scene.get('Bestiary') as any;
    if (bestiaryScene && bestiaryScene.discoveredMerges) {
      return bestiaryScene.discoveredMerges;
    }
    return [];
  }

  private getAchievementsState(): any {
    // Get achievement progress from the AchievementManager
    if (this.achievementManager) {
      return this.achievementManager.getProgress();
    }
    return {};
  }

  private restoreEnemiesFromSave(enemiesData: Array<{name: string, x: number, y: number, scale: number, type: string}>) {
    const merge = this.getMergeSystem();
    if (!merge) return;

    enemiesData.forEach(enemyData => {
      try {
        const enemy = merge.items.spawn(enemyData.name as any, enemyData.x, enemyData.y);
        if (enemy) {
          enemy.setScale(enemyData.scale);
        }
      } catch (error) {
        console.warn('Failed to restore enemy:', enemyData.name, error);
      }
    });
  }

  private restoreGoombasFromSave(goombasData: Array<{x: number, y: number, scale: number}>) {
    const merge = this.getMergeSystem();
    if (!merge) return;

    goombasData.forEach(goombaData => {
      try {
        const goomba = merge.items.spawn('Goomba' as any, goombaData.x, goombaData.y);
        if (goomba) {
          goomba.setScale(goombaData.scale);
        }
      } catch (error) {
        console.warn('Failed to restore goomba:', error);
      }
    });
  }

  private restoreGooSplattersFromSave(gooSplattersData: Array<{x: number, y: number, alpha: number, scale: number}>) {
    if (!this.enemyManager) return;

    gooSplattersData.forEach(splatterData => {
      try {
        this.enemyManager.createGooSplatterAt(splatterData.x, splatterData.y, splatterData.scale);
      } catch (error) {
        console.warn('Failed to restore goo splatter:', error);
      }
    });
  }

  private restoreBestiaryEntriesFromSave(bestiaryEntriesData: Array<string>) {
    const bestiaryScene = this.scene.get('Bestiary') as any;
    if (bestiaryScene && bestiaryScene.discoveredMerges) {
      bestiaryScene.discoveredMerges = bestiaryEntriesData;
    }
  }

  private restoreItemsFromSave(itemsData: Array<{name: string, x: number, y: number, scale: number}>) {
    const merge = this.getMergeSystem();
    if (!merge) {

      return;
    }

    // ... keep existing clearing code ...

    const portalX = 564.96;
    const portalY = 52.41;
    const portalTolerance = 10;

    const toiletY = this.toilet ? this.toilet.y : 380.70;

    let restoredCount = 0;
    let enemyCount = 0;

    itemsData.forEach((itemData, index) => {
      try {
        // ... enemy handling unchanged ...

        let restoredItem = merge.items.spawn(itemData.name as any, itemData.x, itemData.y);

        if (!restoredItem) {
          // ... fallback creation unchanged ...
        }
        
        if (restoredItem) {
          // Restore scale if different from default
          if (itemData.scale && itemData.scale !== 1) {
            restoredItem.setScale(itemData.scale);
          }

          // Always consider floor settling after a tiny delay to ensure body exists
          this.time.delayedCall(100, () => {
            // Check if item ended up at portal location (regardless of intended position)
            const distanceFromPortal = Phaser.Math.Distance.Between(
              restoredItem.x, restoredItem.y, 
              portalX, portalY
            );

            if (distanceFromPortal <= portalTolerance || restoredItem.y < (473 - 18 - 20)) {
              if ((merge.items as any).makeItemFallToFloor) {
                (merge.items as any).makeItemFallToFloor(restoredItem);
              }
            }
          });
          
          restoredCount++;
        } else {

        }
      } catch (error) {

      }
    });


  }

  private createPortalFromSave() {
    // Check if portal already exists to avoid duplicates
    const existingPortal = this.children.getByName('portal');
    if (existingPortal) {

      this.setupPortalInMergeSystem(existingPortal as Phaser.GameObjects.Sprite);
      return;
    }
    

    this.portalCreated = true;
    
    // Create portal animation - same as tutorial but without the growing animation
    const forwardFrames = []
    const backwardFrames = []
    
    // Add forward frames (0-33, skipping the last 2 blank frames)
    for (let i = 0; i < 34; i++) {
      forwardFrames.push({ key: 'portal', frame: i })
    }
    
    // Add backward frames (32-1) to avoid duplicating frame 33 and frame 0
    for (let i = 32; i >= 1; i--) {
      backwardFrames.push({ key: 'portal', frame: i })
    }
    
    // Only create animation if it doesn't exist
    if (!this.anims.exists('portalAnim')) {
      this.anims.create({
        key: 'portalAnim',
        frames: [...forwardFrames, ...backwardFrames],
        frameRate: 12,
        repeat: -1 // Loop infinitely
      })
    }

    // Create the portal sprite at full size (no growing animation)
    const portal = this.add.sprite(564.96, 42.41, 'portal')
    portal.setDisplaySize(600, 200)
    portal.setFlipY(true)
    portal.setName('portal')
    portal.setDepth(-2) // Set lower depth so droppable items appear in front
    portal.play('portalAnim')



    // Set up portal in merge system immediately
    this.setupPortalInMergeSystem(portal);
    
    // Start normal spawning with a longer delay to ensure all saved items are loaded first
    this.time.delayedCall(3000, () => { // Increased from 2000ms to 3000ms for more safety
      const merge = this.getMergeSystem();
      if (merge && merge.spawner) {
        merge.spawner.start(5000);

      } else {

        // Retry after another delay
        this.time.delayedCall(2000, () => {
          const retryMerge = this.getMergeSystem();
          if (retryMerge && retryMerge.spawner) {
            retryMerge.spawner.start(5000);
            // Portal spawning started for loaded game (retry)
          }
        });
      }
    });
  }

  private startAutoSaveTimer() {
    // Stop any existing timer
    this.stopAutoSaveTimer();
    
    // Create timer that saves every 30 seconds
    this.autoSaveTimer = this.time.addEvent({
      delay: this.AUTO_SAVE_INTERVAL,
      callback: () => {
        this.saveGameState();
      },
      loop: true
    });
  }

  private stopAutoSaveTimer() {
    if (this.autoSaveTimer) {
      this.autoSaveTimer.destroy();
      this.autoSaveTimer = undefined;
    }
  }

  private showSaveNotification() {
    if (!this.sceneManager) return
    this.sceneManager.showSaveNotification()
  }

  private handleItemDrop(item: any) {
    // Check if item was dropped on the center box
    if (this.centerBox) {
      const centerBoxBounds = this.centerBox.getBounds();
      const isInCenterBox = (
        item.x >= centerBoxBounds.x &&
        item.x <= centerBoxBounds.x + centerBoxBounds.width &&
        item.y >= centerBoxBounds.y &&
        item.y <= centerBoxBounds.y + centerBoxBounds.height
      );

      // If item is dropped on center box, disable physics and snap to center
      if (isInCenterBox) {
        this.handleCenterBoxDrop(item);
        return;
      }
    }

    // Check if item was dropped from above the toilet's center Y position
    const toiletCenterY = this.toilet.y;
    const dropY = item.y;

    // Define toilet merge zone bounds (matches MergeToilet zone: w=140, h=140, centered on toilet)
    const toiletZone = {
      x: this.toilet.x,
      y: this.toilet.y,
      w: 140,
      h: 140
    };

    // Correct bounds check against zone width/height
    const isInToiletZone = (
      item.x >= toiletZone.x - toiletZone.w / 2 &&
      item.x <= toiletZone.x + toiletZone.w / 2 &&
      item.y >= toiletZone.y - toiletZone.h / 2 &&
      item.y <= toiletZone.y + toiletZone.h / 2
    );

    // If item is dropped in toilet zone, do not make it fall to the floor.
    // Additionally, if tutorial is complete and the item is Battery or Loose Wires, kill any pulsing.
    if (isInToiletZone) {
      if (!this.tutorialPhase && item.itemName && (item.itemName === 'Battery' || item.itemName === 'Loose Wires')) {
        this.tweens.killTweensOf(item);
      }
      return;
    }

    // If dropped from above toilet center and NOT in toilet zone, make it fall to floor
    if (dropY < toiletCenterY) {
      const merge = this.getMergeSystem();
      if (merge && merge.items && (merge.items as any).makeItemFallToFloor) {
        (merge.items as any).makeItemFallToFloor(item);
      }
    }
  }

  private handleCenterBoxDrop(item: any) {
    // Play suck sound when item is placed in the tube
    if (this.cache.audio.exists('suck')) {
      const suckSound = this.sound.add('suck', { volume: 1.0 });
      suckSound.play();
      
    } else {
      console.warn('Suck sound not found in cache');
    }
    
    // Disable physics on the item
    if (item.body) {
      item.body.setEnable(false);
    }
    
    // Disable any existing tweens/animations
    this.tweens.killTweensOf(item);
    
    // Snap the item to the center of the center box
    const centerX = this.centerBox.x;
    const centerY = this.centerBox.y;
    
    // Animate the item snapping to the center
    this.tweens.add({
      targets: item,
      x: centerX,
      y: centerY,
      duration: 300,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // Ensure the item stays at the center
        item.x = centerX;
        item.y = centerY;
        
        // Re-enable interactivity so items can be dragged out
        item.setInteractive({ draggable: true });
        
        // Set a high depth so it appears above the center box and alientube
        item.setDepth(2000);
        
        // Store the original position for potential return
        item.centerBoxOriginalPosition = { x: centerX, y: centerY };
        
        // Add drag event listeners to handle dragging out of the center box
        this.setupCenterBoxItemDragListeners(item);
        
        // Check if this item completes an alien order
        this.checkAndCompleteAlienOrder(item);
        
        // Start the pulsing animation sequence
        this.startItemPulseAnimation(item);
      }
    });
  }

  private checkAndCompleteAlienOrder(item: any) {
    // Check if there's a current alien order and if this item matches it
    if (!(this as any).alienOrderSystemInstance) {
      return;
    }
    
    const currentOrder = (this as any).alienOrderSystemInstance.getCurrentOrder();
    if (!currentOrder) {
      return;
    }
    
    // Check if the item name matches the requested item in the order
    const itemName = item.itemName;
    const requestedItem = currentOrder.requestedItem;
    
    if (itemName === requestedItem) {
      // Complete the order
      const orderCompleted = (this as any).alienOrderSystemInstance.checkOrderCompletion(requestedItem);
      if (orderCompleted) {
        
        // Mark that this item completed an order so tube retracts after animation
        item.completedAlienOrder = true;
      }
    }
  }

  private startItemPulseAnimation(item: any) {
    // Store original scale for reference
    const originalScale = item.scale || 1;
    let pulseCount = 0;
    const maxPulses = 4;
    
    const pulseAnimation = () => {
      if (pulseCount >= maxPulses) {
        // Final animation: shrink and disappear
        this.tweens.add({
          targets: item,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: 500,
          ease: 'Power2.easeIn',
          onComplete: () => {
            // Make item invisible and remove it
            item.setVisible(false);
            item.destroy();
            
            // If this item completed an alien order, retract the tube
            if (item.completedAlienOrder) {
              this.retractAlientubeToPortal();
            }
          }
        });
        return;
      }
      
      // Grow larger
      this.tweens.add({
        targets: item,
        scaleX: originalScale * 1.5,
        scaleY: originalScale * 1.5,
        duration: 200,
        ease: 'Power2.easeOut',
        onComplete: () => {
          // Shrink back
          this.tweens.add({
            targets: item,
            scaleX: originalScale,
            scaleY: originalScale,
            duration: 200,
            ease: 'Power2.easeIn',
            onComplete: () => {
              pulseCount++;
              // Continue to next pulse or final animation
              pulseAnimation();
            }
          });
        }
      });
    };
    
    // Start the pulse sequence
    pulseAnimation();
  }

  private setupCenterBoxItemDragListeners(item: any) {
    // Listen for drag start to track when item is being moved
    item.on('dragstart', () => {
      // Store that this item is being dragged from center box
      item.isDraggingFromCenterBox = true;
    });
    
    // Listen for drag end to check if item should return to center
    item.on('dragend', () => {
      if (item.isDraggingFromCenterBox) {
        // Check if item was dropped outside the center box area
        const centerBoxBounds = this.centerBox.getBounds();
        const isOutsideCenterBox = (
          item.x < centerBoxBounds.x ||
          item.x > centerBoxBounds.x + centerBoxBounds.width ||
          item.y < centerBoxBounds.y ||
          item.y > centerBoxBounds.y + centerBoxBounds.height
        );
        
        if (isOutsideCenterBox) {
          // Item was dropped outside center box, return it to center
          this.returnItemToCenterBox(item);
        }
        
        // Reset the flag
        item.isDraggingFromCenterBox = false;
      }
    });
  }

  private returnItemToCenterBox(item: any) {
    // Animate the item back to the center of the center box
    const centerX = this.centerBox.x;
    const centerY = this.centerBox.y;
    
    this.tweens.add({
      targets: item,
      x: centerX,
      y: centerY,
      duration: 200,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // Ensure the item stays at the center
        item.x = centerX;
        item.y = centerY;
      }
    });
  }

  private makeItemFallToFloor(item: any) {
    // Calculate floor position (same as portal spawning logic)
    const floorY = 473 - 18; // Floor platform top minus half item height
    
    // Don't apply physics if item is already near the floor
    if (Math.abs(item.y - floorY) < 20) {
      return;
    }
    
    // Create falling animation similar to portal spawning
    const fallDuration = Math.max(300, Math.abs(item.y - floorY) * 2); // Minimum 300ms, scale with distance
    
    // Add slight horizontal drift during fall
    const horizontalDrift = Phaser.Math.Between(-20, 20);
    const targetX = Math.max(100, Math.min(1000, item.x + horizontalDrift)); // Keep within bounds
    
    // Animate fall with physics-like easing
    this.tweens.add({
      targets: item,
      x: targetX,
      y: floorY,
      duration: fallDuration,
      ease: 'Power2.easeIn', // Gravity-like acceleration
      onComplete: () => {
        // Add small bounce effect when hitting floor
        this.tweens.add({
          targets: item,
          y: floorY - 10, // Small bounce up
          duration: 150,
          ease: 'Power2.easeOut',
          onComplete: () => {
            // Settle back to floor
            this.tweens.add({
              targets: item,
              y: floorY,
              duration: 100,
              ease: 'Power2.easeIn'
            });
          }
        });
      }
    });
    
    // Add rotation during fall for more natural physics
    const rotationAmount = Phaser.Math.Between(90, 270);
    const rotationDirection = Phaser.Math.RND.pick([-1, 1]);
    
    this.tweens.add({
      targets: item,
      angle: item.angle + (rotationAmount * rotationDirection),
      duration: fallDuration + 250, // Slightly longer than fall for natural effect
      ease: 'Power1.easeOut'
    });
  }

  private setupTrashRecycler() {
    // Create the trash recycler sprite at the specified fixed position
    this.trashRecycler = this.add.sprite(411, 384, 'trash_recycler')
    this.trashRecycler.setDisplaySize(180, 180) // Fixed size
    this.trashRecycler.setName('trash_recycler')
    this.trashRecycler.setDepth(-1) // Set lower depth so droppable items appear in front
    
    // Store original scale for later restoration
    this.trashRecycler.setData('__origScale', { x: this.trashRecycler.scaleX, y: this.trashRecycler.scaleY })
    
    // Hide the recycler by default - it will only be shown when purchased from store
    this.trashRecycler.setActive(false).setVisible(false)
    
    // Make recycler interactive for clicking - but only when visible/purchased
    this.trashRecycler.setInteractive()
    this.trashRecycler.on('pointerdown', () => {
      // Only function if recycler is visible (purchased)
      if (!this.trashRecycler.visible) {
        return;
      }
      
      // Check cooldown
      const currentTime = this.time.now;
      const timeSinceLastUse = currentTime - this.recyclerLastUsed;
      
      if (timeSinceLastUse < this.RECYCLER_COOLDOWN) {
        // Show cooldown message via TrashRecycler manager
        const remainingTime = Math.ceil((this.RECYCLER_COOLDOWN - timeSinceLastUse) / 1000);
        if (this.trashRecyclerManager && (this.trashRecyclerManager as any).showCooldownMessage) {
          (this.trashRecyclerManager as any).showCooldownMessage(remainingTime);
        }
        return;
      }
      
      // Check if recycler has 2 items and play sound
      if (this.trashRecyclerManager && this.trashRecyclerManager.getItemCount() === 2) {
        // Record the use time
        this.recyclerLastUsed = currentTime;
        
        const recSound = this.sound.add('recsound', { volume: 0.2 })
        recSound.play()
        
        // Launch recycling minigame when clicked
        this.trashRecyclerManager.recycleItems();
        
        // Note: The minigame will handle success/failure and spawn goo jar only on completion
      }
    })
  }



  public getEnemyManager(): EnemyManager {
    return this.enemyManager
  }

  public getGooCounter(): any {
    return this.gooCounter
  }

  private rejectItem(obj: LabeledRect) {
    // remove: toilet no longer rejects or bounces items
  }

  private closeStore() {
    // Exit all modes when closing
    if ((this as any).isDeleteMode) {
      this.toggleDeleteMode();
    }
    if ((this as any).isRenameMode) {
      this.toggleRenameMode();
    }

    // Stop store audio when closing store - get it from goo counter
    const gameScene = this.scene as any;
    if (gameScene.gooCounter && gameScene.gooCounter.getCurrentStoreSound) {
      const storeSound = gameScene.gooCounter.getCurrentStoreSound();
      if (storeSound && storeSound.isPlaying) {
        storeSound.stop();
      }
    }

    // Resume radio if it was paused by store opening
    if (gameScene.gooCounter && gameScene.gooCounter.wasRadioPausedByStore()) {
      if (gameScene.radioManager) {
        const radioManager = gameScene.radiomanager;
        if (radioManager.isPowered() && radioManager.getCurrentMusic) {
          const currentMusic = radioManager.getCurrentMusic();
          if (currentMusic && currentMusic.isPaused) {
            currentMusic.resume();
          }
        }
      }
      // Clear the flag after resuming
      gameScene.gooCounter.clearRadioPauseFlag();
    }

    // Hide UI when closing store
    this.isUIVisible = false;
    this.controlsContainer.setVisible(false);
    
    // Show the bestiary book when store closes - fix typo
    const bestiaryScene = this.scene.get('Bestiary') as any;
    if (bestiaryScene && bestiaryScene.bookClosed) {
      bestiaryScene.bookClosed.setVisible(true);
    }
    
    // When closing store, keep asset-based items visible but hide placeholder rectangles
    this.placedItems.forEach(item => {
      const hasAsset = this.itemHasAsset(item.itemName);
      
      if (hasAsset) {
        // Items with assets should remain visible even when store is closed
        item.container.setVisible(true);
      } else {
        // Items without assets get hidden when store closes
        item.container.setVisible(false);
      }
    });

    this.scene.tweens.add({
      targets: this.storeContainer,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.isStoreOpen = false;
        this.storeContainer.setVisible(false);
      }
    });
  }

  private showRecyclerCooldownMessage(remainingSeconds: number) {
    // removed: moved to TrashRecycler.showCooldownMessage
  }

  private showRecyclerSuccessMessage() {
    // removed: moved to TrashRecycler.showSuccessMessage
  }

  private clearAllGameObjects() {
    // Clear all items and enemies from the scene
    this.children.list.forEach(child => {
      if ((child as any).itemName && child.active) {
        const itemName = (child as any).itemName;
        // Remove all items that have itemName property (items, enemies, etc.)
        if (itemName.startsWith("Enemy:") || 
            itemName === "Unstable Goo" || 
            itemName === "Confetti Storm" || 
            itemName === "Enemy: Goo Tornado" ||
            (child as any).isUnstableGoo ||
            (child as any).isConfettiStorm ||
            (child as any).isGooTornado ||
            itemName.includes("Goo") ||
            itemName.includes("Item:")) {
          child.destroy();
        }
      }
    });
    
    // Clear any existing goo splatters
    this.children.list.forEach(child => {
      if ((child as any).isGooSplatter) {
        child.destroy();
      }
    });
    
    
  }
}
