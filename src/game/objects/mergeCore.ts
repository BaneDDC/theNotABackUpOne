// src/game/objects/mergeCore.ts
// Self-contained merge loop (placeholders).
import Phaser from "phaser";
import {
  Item,
  getMergeResult,
  pickRandomTier1,
  getTier,
  isTier1,
  SPAWNABLE_TIER1,
  getTier1Partners,
} from "../config/mergeDataFull";
import { AssetManager } from "./AssetManager";
import { collectGooFromCleaning } from "./GooCounter";

type LabeledRect = (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite) & {
  itemName?: Item;
  __label?: Phaser.GameObjects.Text;
  __visualSprite?: Phaser.GameObjects.Sprite; // For when we use rectangle + sprite combo
  __hoverTimer?: Phaser.Time.TimerEvent; // Timer for hover delay
  __isHovering?: boolean; // Track hover state.
};

// Funny descriptions for items
const ITEM_DESCRIPTIONS: Record<string, string> = {
  // Tier 1 items
  "Plunger": "The hero of every bathroom emergency. Has seen things that would make a grown man cry.",
  "Toilet Paper": "Softer than a cloud, more precious than gold during a pandemic.",
  "Toilet Brush": "The unsung warrior of bathroom hygiene. Fights the good fight daily.",
  "Soap": "Slippery when wet, judgmental when you don't use it enough.",
  "Mop": "Professional floor dancer with a serious attitude about cleanliness.",
  "Bucket": "Simple, reliable, and surprisingly good at holding things. Revolutionary!",
  "Pipe": "Not the smoking kind. This one prefers to carry water and occasionally burst.",
  "Loose Wires": "Sparky's distant cousins. They're having an identity crisis.",
  "Battery": "Energizer bunny's life force. Contains 100% pure 'get up and go'.",
  "Fan Blade": "One blade to rule them all. Dreams of being part of a helicopter.",
  "Toolkit": "Contains everything you need except the thing you're actually looking for.",
  "Coolant Tank": "Keeps things chill. Literally. The ice queen of mechanical parts.",
  "Rubber Duck": "Debugging expert and bath time philosopher. Quacks under pressure.",
  "Goldfish Bowl": "Home sweet home for aquatic pets with 3-second attention spans.",
  "Sock": "The lone survivor of the great washing machine sock massacre.",
  "Ham Sandwich": "Portable happiness between two slices. May contain traces of joy.",
  "Portal Shard": "Fragment of interdimensional travel. Handle with existential care.",
  "Energy Canister": "Concentrated enthusiasm in a can. Side effects may include productivity.",
  "Towel": "Don't panic! Always know where your towel is. -Hitchhiker's Guide",
  "Wrench": "Turns nuts and bolts, occasionally turns your knuckles purple.",
  "Duct Tape": "The force has a light side, a dark side, and duct tape holding it together.",
  "Screw": "Gets screwed over more than anyone else in the toolbox.",
  "Fuse": "Short-tempered electrical component. Blows up when things get heated.",
  "Toilet": "The porcelain throne. Where all great ideas are born.",
  
  // Tier 2+ items
  "Powered Wire": "Wires with attitude and electrical personality disorders.",
  "THOR'S PLUNGER": "Mjolnir's bathroom-dwelling cousin. Only the worthy can unclog with it.",
  "Wet Mop": "A mop that's seen some stuff. Probably needs therapy.",
  "Electric Brush": "Gives your teeth the shock of their lives. Dentists hate this one trick!",
  "Reinforced Plunger": "When regular plunging just isn't enough. For industrial-strength problems.",
  "Soapy Mop": "Clean freak's dream tool. Leaves everything sparkling and judgmental.",
  "Bubble Wand": "Childhood magic in stick form. Makes everything better with bubbles.",
  "Sanitation Maul": "When cleaning requires brute force. Mess with the best, die like the rest.",
  "Charged Duck": "Rubber duck with electrical superpowers. Quacks with authority.",
  "Sticky Sock": "Lost its partner, gained adhesive properties. Clings to hope.",
  "Bandaged Towel": "First aid meets bathroom accessories. Patches up your problems.",
  "Chilled Pipe": "Cooler than the other side of the pillow. Ice cold delivery system.",
  "Makeshift Vent": "DIY air circulation. Not OSHA approved, but it works!",
  "Jury-Rigged Fan": "Engineering at its finest. Held together by hope and determination.",
  "Wired Fuse": "Fuse with commitment issues. Can't decide when to blow.",
  "Paper Fuse": "The most flammable safety device ever invented. Irony at its finest.",
  "Stabilized Fuse": "Finally got its act together. Reliable, dependable, boring.",
  "Improvised Screwdriver": "When you need to screw things up... I mean, fix things.",
  "Bolted Wrench": "Wrench that's really committed to the job. Bolted down for life.",
  "Combo Tool": "Swiss Army knife's overachieving cousin. Does everything, masters nothing.",
  "Repaired Pipe": "Back from the dead and ready to flow. Zombie pipe with a purpose.",
  "Heated Pipe": "Warm, cozy, and ready to deliver hot water or existential warmth.",
  "Thermo Coil": "Temperature control freak. Hot, cold, or just right - it's got you covered.",
  "Cryo Coil": "Ice cold and proud of it. Gives everyone the cold shoulder.",
  "Power Coupler": "Brings things together with electrical enthusiasm.",
  "Cryo Coupler": "Connects things while keeping them cool. The ice king of connections.",
  "Arc Cell": "Electrical storage with a sparky personality. Charges ahead with confidence.",
  "Portal Key Alpha": "First half of interdimensional access. Comes with existential dread.",
  "Portal Key Beta": "Second half of reality-bending power. Assembly required.",
  "Portal Access Token": "Your ticket to anywhere but here. Terms and conditions apply.",
  "Boss Key (Heat)": "Unlocks fiery confrontations. Warning: contents may be explosive.",
  "Boss Key (Cold)": "Opens icy encounters. Side effects include brain freeze.",
  "Boss Sigil": "The ultimate key. Opens doors you didn't know existed.",
  
  // Enemies
  "Unstable Goo": "Angry green blob with commitment issues. Dissolves everything it touches.",
  "Enemy: Voltaic Wisp": "Electrical ghost with a shocking personality. Sparks flywhen it's around.",
  "Enemy: Ooze Fish": "Aquatic nightmare fuel. Swims in goo, dreams of cleaner waters.",
  "Enemy: Crawling Sandwich": "Your lunch has gained sentience and it's not happy about being eaten.",
  "Enemy: Pipe Serpent": "Snake made of plumbing. Hisses in hydraulic and bites with water pressure.",
  "Enemy: Portal Slime": "Interdimensional goo with travel experience. Seen things, absorbed things.",
  "Enemy: Lint Golem": "Dryer lint achieved consciousness. Fluffy but deadly.",
  
  // Hazards
  "Hazard: Shocking Puddle": "Water and electricity's dangerous dance. Step carefully or get zapped.",
  "Hazard: Short Circuit": "When wires and coolant have a disagreement. Sparks will fly.",
  "Hazard: Corrosive Bristles": "Brush gone bad. Cleans by dissolving everything in its path.",
  "Soggy Paper (Hazard: Slippery)": "Wet toilet paper's revenge. Makes everything slippery and sad.",
  
  // Advanced items
  "Coolant Bowl": "Goldfish bowl filled with coolant. Fish not included, thankfully.",
  "Misting Fan": "Creates a refreshing mist while spinning. Spa day in mechanical form.",
  "Ion Sprayer": "Shoots ions with precision. Negative attitudes not welcome.",
  "Laser Duck": "Rubber duck with laser vision. Quacks and zaps with equal enthusiasm.",
  "Steam Burst": "Concentrated steam with anger management issues. Blows off steam literally.",
  "Quack of of Doom": "The ultimate rubber duck weapon. Quacks of mass destruction.",
  "Cold Vent": "Blows cold air with the intensity of a disappointed parent.",
  "Cryo Foam Cannon": "Shoots freezing foam. Makes everything cold and foamy.",
  "Containment Spear": "Pointy stick for containing things. Sharp end goes toward the problem.",
  "Containment Set": "Complete containment solution. Some assembly required.",
  "Maintenance Halberd": "Medieval weapon meets modern maintenance. Fixes things with style.",
  "Stun Lance": "Pointy stick with electrical attitude. Pokes and shocks simultaneously.",
  "Air Zap Trap": "Traps air and zaps things. Multitasking at its finest.",
  "Static Sock Trap": "Sock with electrical ambitions. Clings and shocks.",
  "Stasis Snare": "Freezes things in time and space. Temporal timeout device.",
  "Ionic Towel (Defense: zap)": "Towel with electrical defense mechanisms. Dries and defends.",
  "Chill Towel (Defense: slow)": "Towel that keeps things cool under pressure. Literally.",
  "Static Bubble Duck": "Rubber duck in an electrical bubble. Protected and shocking.",
  "Bubbly Breaker": "Breaks things with the power of bubbles. Surprisingly effective.",
  "Bubble Cyclone": "Tornado made of soap bubbles. Clean destruction at its finest.",
  "Confetti Storm": "Celebration meets chaos. Party cleanup nightmare.",
  "Enemy: Goo Tornado": "Spinning vortex of chaos. The Ooze-Nado spawns unstable goo minions every 5 seconds!",
  "Foam Roll": "Toilet paper's foamy evolution. Soft, absorbent, and bubbly.",
  "Foam Blaster": "Shoots foam with the enthusiasm of a caffeinated barista.",
  "Chilled Sock (Throwable)": "Cold sock with projectile potential. Chills enemies to the bone.",
  "Coolant Spill": "Accidental coolant everywhere. Slippery when wet, cold when dry.",
  "Sock Puppet Duck": "Rubber duck wearing a sock. Fashion meets function meets confusion."
};

export class ItemManager {
  private assetManager: AssetManager;
  private scene: Phaser.Scene;
  private hoverTooltip?: Phaser.GameObjects.Container;
  private tooltipBackground?: Phaser.GameObjects.Graphics;
  private tooltipText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.assetManager = new AssetManager(scene)
    // Load all assets when ItemManager is created
    this.assetManager.loadAllAssets()
    this.createTooltip()
  }

  private createTooltip() {
    // Create tooltip container
    this.hoverTooltip = this.scene.add.container(0, 0)
    this.hoverTooltip.setDepth(5000) // Very high depth to stay on top
    this.hoverTooltip.setVisible(false)
    
    // Create tooltip background
    this.tooltipBackground = this.scene.add.graphics()
    this.hoverTooltip.add(this.tooltipBackground)
    
    // Create tooltip text
    this.tooltipText = this.scene.add.text(0, 0, '', {
      fontSize: '14px',
      color: '#ffffff',
      padding: { x: 12, y: 8 },
      lineSpacing: 4,
      wordWrap: { width: 300 }
    })
    this.hoverTooltip.add(this.tooltipText)
  }

  private setupItemHover(item: LabeledRect) {
    if (!item.itemName) return;

    // Make item interactive for hover
    item.setInteractive();
    
    item.on('pointerover', () => {
      item.__isHovering = true;
      
      // Start 2-second timer for tooltip
      item.__hoverTimer = this.scene.time.delayedCall(2000, () => {
        if (item.__isHovering && item.active) {
          this.showItemTooltip(item);
        }
      });
    });

    item.on('pointerout', () => {
      item.__isHovering = false;
      
      // Cancel hover timer
      if (item.__hoverTimer) {
        item.__hoverTimer.destroy();
        item.__hoverTimer = undefined;
      }
      
      // Hide tooltip
      this.hideTooltip();
    });

    item.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Update tooltip position if it's visible
      if (this.hoverTooltip && this.hoverTooltip.visible) {
        this.updateTooltipPosition(pointer.x, pointer.y);
      }
    });
  }

  private showItemTooltip(item: LabeledRect) {
    if (!item.itemName || !this.hoverTooltip || !this.tooltipText || !this.tooltipBackground) return;

    const itemName = item.itemName;
    const description = ITEM_DESCRIPTIONS[itemName] || "A mysterious item with unknown properties.";
    
    // Get discovered merges from bestiary
    const discoveredMerges = this.getDiscoveredMergesForItem(itemName);
    
    // Build tooltip content
    let content = `${itemName}\n\n${description}`;
    
    if (discoveredMerges.length > 0) {
      content += `\n\nKnown Merges:`;
      discoveredMerges.forEach(merge => {
        content += `\n• ${merge.partner} → ${merge.result}`;
      });
    } else {
      content += `\n\nMerges: Unknown (try experimenting!)`;
    }

    this.tooltipText.setText(content);

    // Update background size
    const textBounds = this.tooltipText.getBounds();
    this.tooltipBackground.clear();
    this.tooltipBackground.fillStyle(0x2c3e50, 0.95);
    this.tooltipBackground.lineStyle(2, 0x3498db);
    this.tooltipBackground.fillRoundedRect(-12, -8, textBounds.width + 24, textBounds.height + 16, 8);
    this.tooltipBackground.strokeRoundedRect(-12, -8, textBounds.width + 24, textBounds.height + 16, 8);

    // Position tooltip near item but keep it on screen
    this.updateTooltipPosition(item.x, item.y);
    
    // Show tooltip with fade-in animation
    this.hoverTooltip.setAlpha(0);
    this.hoverTooltip.setVisible(true);
    
    this.scene.tweens.add({
      targets: this.hoverTooltip,
      alpha: 1,
      duration: 200,
      ease: 'Power2.easeOut'
    });
  }

  private updateTooltipPosition(x: number, y: number) {
    if (!this.hoverTooltip || !this.tooltipText) return;

    const textBounds = this.tooltipText.getBounds();
    const gameWidth = this.scene.scale.width;
    const gameHeight = this.scene.scale.height;
    
    // Default position: above and to the right of the cursor/item
    let tooltipX = x + 20;
    let tooltipY = y - textBounds.height - 20;
    
    // Keep tooltip on screen
    if (tooltipX + textBounds.width + 24 > gameWidth) {
      tooltipX = x - textBounds.width - 44; // Position to the left
    }
    if (tooltipY < 0) {
      tooltipY = y + 40; // Position below
    }
    if (tooltipY + textBounds.height + 16 > gameHeight) {
      tooltipY = gameHeight - textBounds.height - 32; // Keep at bottom
    }
    
    this.hoverTooltip.setPosition(tooltipX, tooltipY);
  }

  private hideTooltip() {
    if (!this.hoverTooltip) return;
    
    if (this.hoverTooltip.visible) {
      this.scene.tweens.add({
        targets: this.hoverTooltip,
        alpha: 0,
        duration: 150,
        ease: 'Power2.easeIn',
        onComplete: () => {
          this.hoverTooltip!.setVisible(false);
        }
      });
    }
  }

  private getDiscoveredMergesForItem(itemName: string): Array<{partner: string, result: string}> {
    const merges: Array<{partner: string, result: string}> = [];
    
    // Get bestiary discoveries from localStorage
    const saved = localStorage.getItem('bestiary_discoveries');
    if (!saved) return merges;
    
    try {
      const discoveries = JSON.parse(saved);
      
      // Look through discovered recipes for ones involving this item
      discoveries.forEach((discovery: any) => {
        // Parse the recipe format: "ItemA+ItemB → Result"
        const recipeParts = discovery.recipe.split(' → ');
        if (recipeParts.length !== 2) return; // Skip malformed recipes
        
        const [ingredients, result] = recipeParts;
        const ingredientParts = ingredients.split('+');
        if (ingredientParts.length !== 2) return; // Skip malformed ingredients
        
        const [itemA, itemB] = ingredientParts;
        
        // Check if this item is involved in the discovered recipe
        if (itemA === itemName) {
          merges.push({ partner: itemB, result: result });
        } else if (itemB === itemName) {
          merges.push({ partner: itemA, result: result });
        }
      });
    } catch (e) {

    }
    
    return merges;
  }

  spawn(name: Item, x: number, y: number, color = 0x999999): LabeledRect {
    let mainObject: LabeledRect;

    // Try to create a sprite if we have an asset for this item
    const sprite = this.assetManager.createSprite(name, x, y);
    
    if (sprite) {
      // Use the sprite as the main object
      mainObject = sprite as LabeledRect;
      mainObject.setInteractive({ draggable: true });
      this.scene.input.setDraggable(mainObject);
    } else {
      // Fall back to colored rectangle - but also try to load the asset asynchronously for future spawns
      const rect = this.scene.add.rectangle(x, y, 36, 36, color) as LabeledRect;
      rect.setStrokeStyle(1, 0x222222);
      mainObject = rect;
      mainObject.setInteractive({ draggable: true });
      this.scene.input.setDraggable(mainObject);
      
      // Try to load the asset asynchronously for future spawns
      this.assetManager.loadAsset(name).then((loaded) => {
        if (loaded) {

        }
      });
    }

    // Add physics to the main object
    this.scene.physics.add.existing(mainObject);
    mainObject.itemName = name;

    // Set higher depth for all droppable items to appear in front of permanent assets
    mainObject.setDepth(10);

    // Setup hover tooltip for all items (except enemies)
    if (!name.startsWith("Enemy:") && name !== "Unstable Goo" && name !== "Confetti Storm") {
      this.setupItemHover(mainObject);
    }

    // Special behavior for enemies - return null to indicate enemy should be handled elsewhere
    if (name === "Unstable Goo" || name === "Confetti Storm" || name === "Enemy: Goo Tornado" || name.startsWith("Enemy:")) {
      // Clean up the object we created since enemies are handled by EnemyManager
      mainObject.destroy();
      return null as any; // Return null to indicate this should be handled by EnemyManager
    } else {
      // Normal item behavior - draggable
      // Set up drag events
      mainObject.on(Phaser.Input.Events.DRAG, (_p: any, dx: number, dy: number) => {
        mainObject.setPosition(dx, dy);
        
        // Hide tooltip while dragging
        this.hideTooltip();
        
        // Check for mop cleaning splatters during drag
        if (name === "Mop") {
          this.checkMopSplatterCleaning(mainObject);
        }
      });
      
      mainObject.on(Phaser.Input.Events.DRAG_START, () => {
        mainObject.setDepth(1000); // Bring to front while dragging
        
        // Hide tooltip when dragging starts
        this.hideTooltip();
        mainObject.__isHovering = false;
        if (mainObject.__hoverTimer) {
          mainObject.__hoverTimer.destroy();
          mainObject.__hoverTimer = undefined;
        }
        
        // Rotate item to normal facing (0 degrees) when picked up
        this.scene.tweens.add({
          targets: mainObject,
          angle: 0, // Face normal/upward orientation
          duration: 200,
          ease: 'Power2.easeOut'
        });
      });
      
      mainObject.on(Phaser.Input.Events.DRAG_END, () => mainObject.setDepth(10)); // Return to normal droppable item depth
    }

    // Store original scale values before animation
    const originalScaleX = mainObject.scaleX;
    const originalScaleY = mainObject.scaleY;

    // For the main object, do a subtle bounce animation that respects its current scale
    this.scene.tweens.add({
      targets: mainObject,
      scaleX: originalScaleX * 1.05, // Small bounce relative to current scale
      scaleY: originalScaleY * 1.05,
      duration: 120,
      yoyo: true,
    });

    return mainObject;
  }

  private checkMopSplatterCleaning(mop: LabeledRect) {
    // Get all goo splatters in the scene
    const gooSplatters = (this.scene as any).gooSplatters || [];
    
    gooSplatters.forEach((splatter: Phaser.GameObjects.Sprite) => {
      if (!splatter.active) return;
      
      // Check if mop is overlapping with splatter
      const mopBounds = mop.getBounds();
      const splatterBounds = splatter.getBounds();
      
      if (Phaser.Geom.Rectangle.Overlaps(mopBounds, splatterBounds)) {
        // Check if this splatter was recently cleaned (prevent rapid cleaning)
        const currentTime = this.scene.time.now;
        const lastCleanTime = (splatter as any).lastCleanTime || 0;
        
        if (currentTime - lastCleanTime > 500) { // 500ms cooldown between cleans
          this.cleanSplatter(splatter);
          (splatter as any).lastCleanTime = currentTime;
        }
      }
    });
  }

  private cleanSplatter(splatter: Phaser.GameObjects.Sprite) {
    // Increment cleanup count
    (splatter as any).cleanupCount = ((splatter as any).cleanupCount || 0) + 1;
    
    // Calculate new alpha (reduce by 25% each time)
    const originalAlpha = (splatter as any).originalAlpha || 0.8;
    const cleanupCount = (splatter as any).cleanupCount;
    const maxCleanups = (splatter as any).maxCleanups || 3;
    
    if (cleanupCount >= maxCleanups) {
      // Remove splatter completely after 3rd swipe
      this.removeSplatter(splatter);
    } else {
      // Reduce opacity by 25%
      const newAlpha = originalAlpha * (1 - (cleanupCount * 0.25));
      
      // Animate the cleaning effect
      this.scene.tweens.add({
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

  private removeSplatter(splatter: Phaser.GameObjects.Sprite) {
    // Create final cleaning effect
    this.createCleaningSparkle(splatter.x, splatter.y);
    
    // Collect goo when splatter is completely removed
    collectGooFromCleaning();
    
    // Animate removal
    this.scene.tweens.add({
      targets: splatter,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 300,
      ease: 'Power2.easeIn',
      onComplete: () => {
        // Remove from splatters array
        const gooSplatters = (this.scene as any).gooSplatters || [];
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
    // Create small sparkle particles to show cleaning effect
    const sparkleCount = 3;
    
    for (let i = 0; i < sparkleCount; i++) {
      // Create a small white circle as sparkle
      const sparkle = this.scene.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-20, 20),
        3,
        0xffffff
      );
      
      sparkle.setDepth(100); // Above most objects
      
      // Animate sparkle
      this.scene.tweens.add({
        targets: sparkle,
        alpha: 0,
        scaleX: 2,
        scaleY: 2,
        y: sparkle.y - 20, // Float upward
        duration: 500,
        ease: 'Power2.easeOut',
        delay: i * 100, // Stagger sparkles
        onComplete: () => {
          sparkle.destroy();
        }
      });
    }
  }



















  private rejectItem(obj: LabeledRect) {
    // Animate item bouncing out of toilet
    const bounceDistance = 100;
    const bounceAngle = Phaser.Math.Between(-45, 45); // Random angle between -45 and 45 degrees
    const bounceRad = Phaser.Math.DegToRad(bounceAngle);
    
    const bounceX = obj.x + Math.cos(bounceRad) * bounceDistance;
    const bounceY = obj.y + Math.sin(bounceRad) * bounceDistance;
    
    // Animate bounce out
    this.scene.tweens.add({
      targets: obj,
      x: bounceX,
      y: bounceY,
      duration: 300,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // Then settle to a nearby position
        const settleX = bounceX + Phaser.Math.between(-20, 20);
        const settleY = Math.max(bounceY + 50, 450); // Ensure it settles on the floor
        
        this.scene.tweens.add({
          targets: obj,
          x: settleX,
          y: settleY,
          duration: 200,
          ease: 'Power2.easeIn'
        });
      }
    });
    
    // Add visual feedback - red tint to show rejection
    this.scene.tweens.add({
      targets: obj,
      tint: 0xff4444, // Red tint
      duration: 150,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        obj.setTint(0xffffff); // Reset to normal color
      }
    });
  }

  destroy(obj: LabeledRect) {
    // Clean up hover timer and tooltip
    if (obj.__hoverTimer) {
      obj.__hoverTimer.destroy();
    }
    if (obj.__isHovering) {
      this.hideTooltip();
    }
    
    // Emit destroy event before actually destroying
    obj.emit('destroy');
    // Remove label destruction since there are no labels
    // obj.__label?.destroy();
    obj.__visualSprite?.destroy(); // Clean up visual sprite if it exists
    obj.destroy();
  }

  // Method to get the asset manager for external use
  getAssetManager(): AssetManager {
    return this.assetManager;
  }

  // New helper: make an item tween down to the floor similar to Game.makeItemFallToFloor
  public makeItemFallToFloor(item: any) {
    const floorY = 473 - 18;

    if (Math.abs(item.y - floorY) < 20) {
      return;
    }

    const fallDuration = Math.max(300, Math.abs(item.y - floorY) * 2);

    const horizontalDrift = Phaser.Math.Between(-20, 20);
    const targetX = Math.max(100, Math.min(1000, item.x + horizontalDrift));

    this.scene.tweens.add({
      targets: item,
      x: targetX,
      y: floorY,
      duration: fallDuration,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.scene.tweens.add({
          targets: item,
          y: floorY - 10,
          duration: 150,
          ease: 'Power2.easeOut',
          onComplete: () => {
            this.scene.tweens.add({
              targets: item,
              y: floorY,
              duration: 100,
              ease: 'Power2.easeIn'
            });
          }
        });
      }
    });

    const rotationAmount = Phaser.Math.Between(90, 270);
    const rotationDirection = Phaser.Math.RND.pick([-1, 1]);

    this.scene.tweens.add({
      targets: item,
      angle: item.angle + (rotationAmount * rotationDirection),
      duration: fallDuration + 250,
      ease: 'Power1.easeOut'
    });
  }

  // New helpers: tier2 retrieval and reward spawning
  public getTier2Items(): string[] {
    const { ITEM_TIERS } = require('../config/mergeDataFull');
    const tier2Items: string[] = [];
    for (const [itemName, tier] of Object.entries(ITEM_TIERS)) {
      if (tier === 2) {
        tier2Items.push(itemName);
      }
    }
    return tier2Items;
  }

  public spawnTier2Reward() {
    const tier2Items = this.getTier2Items();
    if (tier2Items.length === 0) return;
    const randomTier2 = tier2Items[Math.floor(Math.random() * tier2Items.length)];
    // forward to portal/spawner via scene event, matching original behavior
    this.scene.events.emit('toilet:merged', randomTier2);
  }
}

export class PortalSpawner {
  private timer?: Phaser.Time.TimerEvent;
  private portalViz?: Phaser.GameObjects.Ellipse;
  private mouth: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private spawnedItems: Set<LabeledRect> = new Set(); // Track spawned items
  private mergedResults: Set<Item> = new Set(); // Track items that have been merged
  private hasInitialSpawn: boolean = false; // Track if we've done initial spawn
  private portalSounds: Phaser.Sound.BaseSound[] = []; // Array to hold portal sounds
  private currentPortalSoundIndex: number = 0; // Track which sound to play next

  constructor(
    private scene: Phaser.Scene,
    private items: ItemManager,
    private portalSprite: Phaser.GameObjects.Sprite
  ) {
    // Initialize mouth position immediately
    this.initMouth();
    
    // Initialize portal sounds
    this.initializePortalSounds();
    
    // Note: Penalty events are now handled by the Game scene directly
    // to avoid duplicate event listeners causing double spawning
  }

  private initializePortalSounds() {
    // Create the portal sound objects - only use portal2
    this.portalSounds = [];
    
    // Only check for and load portal2 sound
    if (this.scene.sound.get('portal2') || this.scene.cache.audio.exists('portal2')) {
      try {
        this.portalSounds.push(this.scene.sound.add('portal2', { volume: 0.6 }));
      } catch (error) {

      }
    }
    
    // If portal2 sound wasn't loaded, try to load it asynchronously
    if (this.portalSounds.length === 0) {

      // Set up a timer to retry loading sound
      this.scene.time.delayedCall(1000, () => {
        this.retryLoadPortalSounds();
      });
    }
  }

  private retryLoadPortalSounds() {
    // Try to create portal2 sound again after a delay
    if (this.portalSounds.length === 0) {
      if (this.scene.cache.audio.exists('portal2')) {
        try {
          this.portalSounds.push(this.scene.sound.add('portal2', { volume: 0.6 }));
        } catch (error) {

        }
      }
    }
  }

  private playAlternatingPortalSound() {
    if ( this.portalSounds.length === 0) {
      // Try to initialize sounds again if they weren't available before
      this.initializePortalSounds();
      if (this.portalSounds.length === 0) {

        return;
      }
    }
    
    try {
      // Always play portal2 sound (index 0, the only sound in the array)
      this.portalSounds[0].play();
      
      // No need to increment index since we only have one sound
    } catch (error) {

    }
  }

  start(intervalMs = 3000) { // Keep interval parameter for potential future use
    this.stop();

    this.initMouth();
    
    // Remove automatic spawning - items now only come from successful merges
    // No timer needed since we only spawn on toilet:merged events
    
    // Remove the timer creation since we don't want automatic spawning
    // this.timer = this.scene.time.addEvent({
    //   delay: intervalMs,
    //   loop: true,
    //   callback: () => this.maintainItemCount(),
    // });
  }

  stop() {
    this.timer?.remove();
    this.timer = undefined;
    this.portalViz?.destroy();
    this.spawnedItems.clear();
    
    // Clean up portal sounds with error handling
    this.portalSounds.forEach(sound => {
      if (sound) {
        try {
          sound.destroy();
        } catch (error) {

        }
      }
    });
    this.portalSounds = [];
  }

  // Method to add a merged result to our spawnable pool
  public addMergedResult(resultItem: Item) {
    this.mergedResults.add(resultItem);
  }

  private initMouth() {
    // Use the portal sprite's position for spawning
    const x = this.portalSprite.x;
    const y = this.portalSprite.y + 50; // Slightly below the portal sprite
    this.mouth.set(x, y);

  }

  private cleanupDestroyedItems() {
    // Remove items that have been destroyed from our tracking set
    const itemsToRemove: LabeledRect[] = [];
    
    this.spawnedItems.forEach(item => {
      if (!item.active || item.scene !== this.scene) {
        itemsToRemove.push(item);
      }
    });
    
    itemsToRemove.forEach(item => {
      this.spawnedItems.delete(item);
    });
  }

  private getRandomMergedResult(): Item | null {
    if (this.mergedResults.size === 0) {
      return null;
    }
    
    const mergedArray = Array.from(this.mergedResults);
    return mergedArray[Math.floor(Math.random() * mergedArray.length)];
  }

  private dropSpecificItem(itemName: Item) {
    // Only allow merged results - no more tier 1 items from portal
    if (!this.mergedResults.has(itemName)) {
      return;
    }
    
    // Spawn at portal mouth with slight random offset
    const x = this.mouth.x + Phaser.Math.Between(-30, 30);
    const y = this.mouth.y;

    const obj = this.items.spawn(itemName, x, y, 0x8888ff);
    
    // Track this spawned item
    this.spawnedItems.add(obj);
    
    // Listen for when this item is destroyed (merged)
    obj.once('destroy', () => {
      this.spawnedItems.delete(obj);
    });

    // Use the portal sprite for visual feedback
    if (this.portalSprite) {
      this.scene.tweens.add({
        targets: this.portalSprite,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 140,
        yoyo: true,
      });
    }

    // Find a random landing spot that doesn't overlap with existing items
    const landingSpot = this.findRandomLandingSpot();
    
    // Create a bouncing trajectory to the landing spot
    this.createBouncingTrajectory(obj, landingSpot.x, landingSpot.y);
  }

  public spawnAtPortal(name: string) {

    
    // Play alternating portal sound when spawning items
    this.playAlternatingPortalSound();
    
    // Add this result to our merged results pool for future reference
    this.addMergedResult(name);
    
    // Check if this is an enemy type that should use EnemyManager
    if (name === "Unstable Goo" || name === "Confetti Storm" || name === "Enemy: Goo Tornado" || name.startsWith("Enemy:")) {
      // Get enemy manager from scene and spawn enemy
      const gameScene = this.scene as any;
      if (gameScene.getEnemyManager) {
        const enemyManager = gameScene.getEnemyManager();
        const enemySprite = enemyManager.spawnEnemy(name, this.mouth.x, this.mouth.y);
        
        if (enemySprite) {
          // Find a random landing spot
          const landingSpot = this.findRandomLandingSpot();
          
          // Create a bouncing trajectory to the landing spot
          this.createBouncingTrajectory(enemySprite, landingSpot.x, landingSpot.y);
          
          // Use the portal sprite for visual feedback
          if (this.portalSprite) {
            this.scene.tweens.add({ 
              targets: this.portalSprite, 
              scaleX: 1.2, 
              scaleY: 1.2, 
              duration: 140, 
              yoyo: true 
            });
          }
        } else {

        }
      } else {

      }
      return; // Exit early for enemies
    }
    
    // Spawn exactly 1 item as reward for successful merge
    const obj = this.items.spawn(name, this.mouth.x, this.mouth.y, 0x55aa55);
    
    // Check if spawn was successful before proceeding
    if (!obj) {

      return;
    }
    
    // Find a random landing spot that doesn't overlap with existing items
    const landingSpot = this.findRandomLandingSpot();
    
    // Create a bouncing trajectory to the landing spot
    this.createBouncingTrajectory(obj, landingSpot.x, landingSpot.y);
    
    // Use the portal sprite for visual feedback
    if (this.portalSprite) {
      this.scene.tweens.add({ targets: this.portalSprite, scaleX: 1.2, scaleY: 1.2, duration: 140, yoyo: true });
    }
  }

  private findRandomLandingSpot(): { x: number, y: number } {
    const floorY = 473 - 18; // Top of Floor Platform minus half item height
    const minX = 100; // Left boundary with some margin
    const maxX = 1000; // Right boundary with some margin
    const itemSize = 36; // Item size for collision detection
    const minDistance = 50; // Minimum distance between items
    
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
      const randomX = Phaser.Math.Between(minX, maxX);
      const randomY = floorY;
      
      // Check if this spot is too close to existing items
      let tooClose = false;
      
      // Get all existing items in the scene
      const existingItems = this.scene.children.list.filter(child => 
        child instanceof Phaser.GameObjects.Rectangle && 
        (child as any).itemName
      );
      
      for (const existingItem of existingItems) {
        const distance = Phaser.Math.Distance.Between(
          randomX, randomY,
          existingItem.x, existingItem.y
        );
        
        if (distance < minDistance) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        return { x: randomX, y: randomY };
      }
      
      attempts++;
    }
    
    // If we couldn't find a good spot after max attempts, just use a random spot
    return { 
      x: Phaser.Math.Between(minX, maxX), 
      y: floorY 
    };
  }

  private createBouncingTrajectory(obj: any, targetX: number, targetY: number) {
    // Add null check to prevent error
    if (!obj || !obj.active) {

      return;
    }
    
    const startX = obj.x;
    const startY = obj.y;
    const groundY = 473 - 18; // Floor Platform top minus half item height
    
    // Calculate horizontal distance and add some randomness to the trajectory
    const horizontalDistance = targetX - startX;
    const fallTime = 500; // Slightly faster fall
    
    // Phase 1: Natural fall with slight horizontal drift - remove label from targets
    this.scene.tweens.add({
      targets: obj, // Remove obj.__label from targets
      x: startX + (horizontalDistance * 0.3), // Only move 30% during fall
      y: groundY,
      duration: fallTime,
      ease: "Power2.easeIn", // More realistic gravity curve
      onComplete: () => {
        // Check if object is still active before continuing
        if (!obj || !obj.active) return;
        
        // Phase 2: First bounce - highest - remove label from targets
        this.scene.tweens.add({
          targets: obj, // Remove obj.__label from targets
          x: startX + (horizontalDistance * 0.6), // Move more horizontally
          y: groundY - Phaser.Math.Between(20, 30), // Random bounce height
          duration: Phaser.Math.Between(180, 220), // Slight time variation
          ease: "Power2.easeOut",
          onComplete: () => {
            // Check if object is still active before continuing
            if (!obj || !obj.active) return;
            
            // Phase 3: Fall from first bounce - remove label from targets
            this.scene.tweens.add({
              targets: obj, // Remove obj.__label from targets
              x: startX + (horizontalDistance * 0.8), // Continue moving
              y: groundY,
              duration: Phaser.Math.Between(160, 200),
              ease: "Power2.easeIn",
              onComplete: () => {
                // Check if object is still active before continuing
                if (!obj || !obj.active) return;
                
                // Phase 4: Second bounce - smaller - remove label from targets
                this.scene.tweens.add({
                  targets: obj, // Remove obj.__label from targets
                  x: targetX, // Reach final position
                  y: groundY - Phaser.Math.Between(8, 15),// Smaller random bounce
                  duration: Phaser.Math.Between(120, 160),
                  ease: "Power2.easeOut",
                  onComplete: () => {
                    // Check if object is still active before continuing
                    if (!obj || !obj.active) return;
                    
                    // Phase 5: Final settle - remove label from targets
                    this.scene.tweens.add({
                      targets: obj, // Remove obj.__label from targets
                      y: targetY,
                      duration: Phaser.Math.Between(100, 140),
                      ease: "Power2.easeIn"
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
    
    // Add more natural rotation with some randomness
    const rotationAmount = Phaser.Math.Between(180, 360);
    const rotationDirection = Phaser.Math.RND.pick([-1, 1]);
    
    this.scene.tweens.add({
      targets: obj,
      angle: rotationAmount * rotationDirection,
      duration: 1200, // Total duration across all phases
      ease: "Power1.easeOut" // Rotation slows down naturally
    });
  }

  public spawnPenaltyItem(penaltyItem: string) {

    
    // Play alternating portal sound when spawning penalty items too
    this.playAlternatingPortalSound();
    
    // Check if this is an enemy type that should use EnemyManager
    if (penaltyItem === "Unstable Goo" || penaltyItem === "Confetti Storm" || penaltyItem === "Enemy: Goo Tornado" || penaltyItem.startsWith("Enemy:")) {
      // Get enemy manager from scene and spawn enemy
      const gameScene = this.scene as any;
      if (gameScene.getEnemyManager) {
        const enemyManager = gameScene.getEnemyManager();
        const enemySprite = enemyManager.spawnEnemy(penaltyItem, this.mouth.x, this.mouth.y);
        
        if (enemySprite) {
          // Find a random landing spot
          const landingSpot = this.findRandomLandingSpot();
          
          // Create a bouncing trajectory to the landing spot
          this.createBouncingTrajectory(enemySprite, landingSpot.x, landingSpot.y);
          
          // Use the portal sprite for visual feedback (different color for penalty)
          if (this.portalSprite) {
            this.scene.tweens.add({ 
              targets: this.portalSprite, 
              tint: 0xff4414, // Red tint for penalty
              scaleX: 1.2, 
              scaleY: 1.2, 
              duration: 140, 
              yoyo: true,
              onComplete: () => {
                // Reset tint after animation
                this.portalSprite.setTint(0xffffff);
              }
            });
          }
        } else {

        }
      } else {

      }
    }
    
    // Fallback to regular item spawning for non-enemies
    const obj = this.items.spawn(penaltyItem, this.mouth.x, this.mouth.y, 0xff4444); // Red tint for penalty
    
    // Only proceed if spawn was successful (not an enemy that returned null)
    if (obj) {
      // Find a random landing spot
      const landingSpot = this.findRandomLandingSpot();
      
      // Create a bouncing trajectory to the landing spot
      this.createBouncingTrajectory(obj, landingSpot.x, landingSpot.y);
      
      // Use the portal sprite for visual feedback (different color for penalty)
      if (this.portalSprite) {
        this.scene.tweens.add({ 
          targets: this.portalSprite, 
          tint: 0xff4414, // Red tint for penalty
          scaleX: 1.2, 
          scaleY: 1.2, 
          duration: 140, 
          yoyo: true,
          onComplete: () => {
            // Reset tint after animation
            this.portalSprite.setTint(0xffffff);
          }
        });
      }
    }
  }

  private setupConfettiStormEnemy(confetti: LabeledRect) {
    // Make Confetti Storm interactive for clicking (but not draggable)
    confetti.setInteractive();
    
    // Set up physics body for movement
    const body = confetti.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setBounce(0.2, 0.2);
    
    // Add custom properties for enemy behavior
    (confetti as any).isConfettiStorm = true;
    (confetti as any).targetGoo = null;
    (confetti as any).isActive = true;
    (confetti as any).moveSpeed = 50; // Faster than goo
    (confetti as any).hasLanded = false;
    
    // Add health system properties
    (confetti as any).maxHealth = 3; // Fixed health instead of random
    (confetti as any).currentHealth = (confetti as any).maxHealth;
    
    // Add click handler for damaging the confetti storm
    confetti.on('pointerdown', () => {
      this.damageConfettiStorm(confetti);
    });
    
    // Wait for confetti to land before starting AI behavior
    this.scene.time.delayyCall(2000, () => {
      if (confetti.active) {
        (confetti as any).hasLanded = true;
        this.correctConfettiFacing(confetti);
        this.startConfettiStormAI(confetti);
      }
    });
  }

  private setupGooTornado(tornado: LabeledRect) {
    // Make Goo Tornado interactive for clicking (but not draggable)
    tornado.setInteractive();
    
    // Set up physics body for movement
    const body = tornado.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setBounce(0.3, 0.3);
    
    // Add custom properties for enemy behavior
    (tornado as any).isGooTornado = true;
    (tornado as any).isActive = true;
    (tornado as any).moveSpeed = 60; // 2x faster than unstable goo (30 * 2 = 60)
    (tornado as any).hasLanded = false;
    (tornado as any).spawnTimer = null; // Timer for spawning goos
    (tornado as any).destructionRadius = 50; // Add destruction radius
    
    // Add health system properties - random between 5-15 clicks
    (tornado as any).maxHealth = Phaser.Math.Between(5, 15);
    (tornado as any).currentHealth = (tornado as any).maxHealth;
    
    // Add click handler for damaging the tornado
    tornado.on('pointerdown', () => {
      this.damageTornado(tornado);
    });
    
    // Start spawning unstable goos immediately when created
    this.startGooSpawning(tornado);
    
    // Wait for tornado to land before starting movement AI
    this.scene.time.delayedCall(2000, () => {
      if (tornado.active) {
        (tornado as any).hasLanded = true;
        this.startTornadoMovement(tornado);
        this.startTornadoDestruction(tornado);
      }
    });
  }

  private setupConfettiStormAI(confetti: LabeledRect) {
    if (!confetti.active || !(confetti as any).isActive) return;
    
    // Import hazard detection function
    const { isHazard } = require('../config/mergeDataFull');
    
    // Find target goo or nearest goo
    let targetGoo = (confetti as any).targetGoo;
    if (!targetGoo || !targetGoo.active) {
      targetGoo = this.findNearestGoo(confetti);
      (confetti as any).targetGoo = targetGoo;
    }
    
    // Move toward target goo if found
    if (targetGoo && targetGoo.active) {
      this.moveConfettiTowardTarget(confetti, targetGoo);
      
      // Check if close enough to merge
      const distance = Phaser.Math.Distance.Between(
        confetti.x, confetti.y,
        targetGoo.x, targetGoo.y
      );
      
      if (distance < 30) { // Close enough to merge
        // Check if the target is actually a hazard
        if (isHazard(targetGoo.itemName!)) {

          this.destroyConfettiFromHazard(confetti, targetGoo);
          return; // Exit AI loop
        } else {
          // Normal merge with actual goo
          this.mergeConfettiWithGoo(confetti, targetGoo);
          return; // Exit AI loop
        }
      }
    }
    
    // Continue AI if still active
    if (confetti.active && (confetti as any).isActive) {
      this.scene.time.delayedCall(100, () => { // Reduced from 2000 to 100 for more responsive AI
        this.startConfettiStormAI(confetti);
      });
    }
  }



  private rejectItem(obj: LabeledRect) {
    // Animate item bouncing out of toilet
    const bounceDistance = 100;
    const bounceAngle = Phaser.Math.Between(-45, 45); // Random angle between -45 and 45 degrees
    const bounceRad = Phaser.Math.DegToRad(bounceAngle);
    
    const bounceX = obj.x + Math.cos(bounceRad) * bounceDistance;
    const bounceY = obj.y + Math.sin(bounceRad) * bounceDistance;
    
    // Animate bounce out
    this.scene.tweens.add({
      targets: obj,
      x: bounceX,
      y: bounceY,
      duration: 300,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // Then settle to a nearby position
        const settleX = bounceX + Phaser.Math.between(-20, 20);
        const settleY = Math.max(bounceY + 50, 450); // Ensure it settles on the floor
        
        this.scene.tweens.add({
          targets: obj,
          x: settleX,
          y: settleY,
          duration: 200,
          ease: 'Power2.easeIn'
        });
      }
    });
    
    // Add visual feedback - red tint to show rejection
    this.scene.tweens.add({
      targets: obj,
      tint: 0xff4444, // Red tint
      duration: 150,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        obj.setTint(0xffffff); // Reset to normal color
      }
    });
  }

  destroy(obj: LabeledRect) {
    // Clean up hover timer and tooltip
    if (obj.__hoverTimer) {
      obj.__hoverTimer.destroy();
    }
    if (obj.__isHovering) {
      this.hideTooltip();
    }
    
    // Emit destroy event before actually destroying
    obj.emit('destroy');
    // Remove label destruction since there are no labels
    // obj.__label?.destroy();
    obj.__visualSprite?.destroy(); // Clean up visual sprite if it exists
    obj.destroy();
  }

  // Method to get the asset manager for external use
  getAssetManager(): AssetManager {
    return this.assetManager;
  }
}

export class MergeToilet {
  private zone: Phaser.GameObjects.Zone;
  private viz: Phaser.GameObjects.Rectangle;
  private waiting: LabeledRect[] = [];
  private splashSounds: Phaser.Sound.BaseSound[] = [];
  private currentSplashIndex: number = 0;
  private hasTutorialFlushPlayed: boolean = false; // Track if tutorial flush has been played
  private hasTutorialDownPlayed: boolean = false; // Track if tutorial down sound has been played

  constructor(
    private scene: Phaser.Scene,
    private items: ItemManager,
    x: number,
    y: number,
    w = 140,
    h = 140
  ) {
    this.zone = this.scene.add.zone(x, y, w, h);
    this.scene.physics.add.existing(this.zone, true);

    this.viz = this.scene.add
      .rectangle(x, y, w, h, 0x3355aa, 0) // Changed alpha from 0.12 to 0 (invisible)
      .setStrokeStyle(0, 0x3355aa); // Changed stroke width from 2 to 0 (no border)

    // Initialize splash sounds
    this.initializeSplashSounds();

    // Accept drops that end inside the zone
    this.scene.input.on(Phaser.Input.Events.DRAG_END, (_: any, obj: any) => {
      if (!obj?.itemName) return;
      const b = this.viz.getBounds();
      if (Phaser.Geom.Rectangle.Contains(b, obj.x, obj.y)) {
        this.accept(obj);
      } else {
        // Check if item was previously in toilet and is now being dragged out
        this.checkItemRemoval(obj);
      }
    });

    // Listen for toilet flush to trigger merge
    this.scene.events.on("toilet:flush", () => this.onFlush());
  }

  private initializeSplashSounds() {
    // Create the splash sound objects with different volumes for variety
    this.splashSounds = [
      this.scene.sound.add('splash1', { volume: 0.6 }),
      this.scene.sound.add('splash2', { volume: 0.7 }),
      this.scene.sound.add('splash3', { volume: 0.65 })
    ];
  }

  private playRandomSplashSound() {
    if ( this.splashSounds.length === 0) return;
    
    // Play the current splash sound
    this.splashSounds[this.currentSplashIndex].play();
    
    // Move to next sound for variety (cycle through all sounds)
    this.currentSplashIndex = (this.currentSplashIndex + 1) % this.splashSounds.length;
  }

  private checkItemRemoval(obj: LabeledRect) {
    // Check if this item was in the waiting list (meaning it was in the toilet)
    const index = this.waiting.indexOf(obj);
    if (index !== -1) {
      // Remove item from waiting list
      this.waiting.splice(index, 1);
      
      // Restore original size if we stored it
      if ((obj as any).__originalScaleX && (obj as any).__originalScaleY) {
        this.scene.tweens.add({
          targets: obj,
          scaleX: (obj as any).__originalScaleX,
          scaleY: (obj as any).__originalScaleY,
          duration: 300,
          ease: 'Power2.easeOut'
        });
        
        // Clean up stored values
        delete (obj as any).__originalScaleX;
        delete (obj as any).__originalScaleY;
      }
      
      // Remove label scale restoration since there are no labels
      // if (obj.__label) {
      //   this.scene.tweens.add({
      //     targets: obj.__label,
      //     scaleX: 1,
      //     scaleY: 1,
      //     duration: 300,
      //     ease: 'Power2.easeOut'
      //   });
      // }
    }
  }

  private accept(obj: LabeledRect) {
    if (this.waiting.includes(obj)) return;
    
    // Play splash sound when item is dropped in toilet
    this.playRandomSplashSound();
    
    // Check if this is the tutorial merge completion (second item being dropped) - only if tutorial not completed
    if (!this.hasTutorialFlushPlayed && this.waiting.length === 1 && !this.isTutorialCompleted()) {
      const existingItem = this.waiting[0];
      const newItem = obj;
      
      // Check if this completes the tutorial merge (Battery + Loose Wires)
      if (this.isTutorialMerge(existingItem.itemName!, newItem.itemName!, "Powered Wire")) {
        this.playTutorialFlushSound();
        this.hasTutorialFlushPlayed = true; // Ensure it only plays once
      }
    }
    
    // If there's already an item waiting, check if they can merge before accepting
    if (this.waiting.length === 1) {
      const existingItem = this.waiting[0];
      const result = getMergeResult(existingItem.itemName!, obj.itemName!);
      
      // If they can't merge, reject the new item and prepare for penalty spawn
      if (!result) {
        // Store the items for destruction when flushed
        this.waiting.push(obj); // Add the new item to waiting list for destruction
        
        // Position the new item in toilet like normal
        obj.x = this.zone.x + Phaser.Math.Between(-14, 14);
        obj.y = this.zone.y + Phaser.Math.Between(-10, 10);
        
        // Store original scale values before making smaller
        (obj as any).__originalScaleX = obj.scaleX;
        (obj as any).__originalScaleY = obj.scaleY,
        
        // Make item smaller when placed in toilet
        this.scene.tweens.add({
          targets: obj,
          scaleX: obj.scaleX * 0.6,
          scaleY: obj.scaleY * 0.6,
          duration: 300,
          ease: 'Power2.easeOut'
        });
        
        return; // Don't spit out immediately, wait for flush
      }
    }
    
    // Accept the item into the toilet zone (valid combination or first item)
    obj.x = this.zone.x + Phaser.Math.Between(-14, 14);
    obj.y = this.zone.y + Phaser.Math.Between(-10, 10);

    // Store original scale values before making smaller
    (obj as any).__originalScaleX = obj.scaleX;
    (obj as any).__originalScaleY = obj.scaleY;
    
    // Make item smaller when placed in toilet
    this.scene.tweens.add({
      targets: obj,
      scaleX: obj.scaleX * 0.6,
      scaleY: obj.scaleY * 0.6,
      duration: 300,
      ease: 'Power2.easeOut'
    });

    this.waiting.push(obj);
    
    // Visual feedback when items are ready to merge
    if (this.waiting.length === 2) {
      const result = getMergeResult(this.waiting[0].itemName!, this.waiting[1].itemName!);
      
      if (result) {
        // Valid combination - show ready-to-merge feedback
        this.waiting.forEach(item => {
          const currentScalex = item.scaleX;
          const currentScaleY = item.scaleY;
          
          this.scene.tweens.add({
            targets: item,
            scaleX: currentScalex * 1.1,
            scaleY: currentScaleY * 1.1,
            duration: 200,
            yoyo: true,
          });
        });
      } else {
        // Invalid combination - show warning feedback (red tint)
        this.waiting.forEach(item => {
          this.scene.tweens.add({
            targets: item,
            tint: 0xff4214, // Red tint to indicate invalid combination
            duration: 300,
            yoyo: true,
            repeat: 2
          });
        });
      }
    }
  }

  private onFlush() {
    // Check if we have exactly 1 item and it's a duck
    if (this.waiting.length === 1) {
      const [singleItem] = this.waiting.splice(0, 1)
      const itemName = singleItem.itemName!
      
      // If the single item is a duck, spawn the same duck item from portal (no special sound)
      if (this.isDuckItem(itemName)) {
        // Destroy the duck item and spawn the same duck item from portal
        this.scene.tweens.add({
          targets: [singleItem],
          alpha: 0,
          angle: "+=15",
          duration: 180,
          onComplete: () => {
            this.items.destroy(singleItem)
            
            // Spawn the same duck item from portal instead of penalty
            this.scene.events.emit("toilet:merged", itemName)
          },
        })
        return
      } else if (itemName === "Wet Mop") {
        // If the single item is a wet mop, spawn the same wet mop from portal (no special sound)
        this.scene.tweens.add({
          targets: [singleItem],
          alpha: 0,
          angle: "+=15",
          duration: 180,
          onComplete: () => {
            this.items.destroy(singleItem)
            
            // Spawn the same wet mop from portal instead of penalty
            this.scene.events.emit("toilet:merged", itemName)
          },
        })
        return
      } else {
        // Single non-duck, non-wet-mop item - handle normally (destroy and spawn penalty)
        this.scene.tweens.add({
          targets: [singleItem],
          alpha: 0,
          angle: "+=15",
          duration: 180,
          onComplete: () => {
            this.items.destroy(singleItem)
            
            // Spawn Unstable Goo from portal as penalty

            this.scene.events.emit("toilet:penalty", "Unstable Goo")
          },
        })
        return
      }
    }

    // Only process pairs if we have exactly 2 items
    if (this.waiting.length !== 2) return

    const [aObj, bObj] = this.waiting.splice(0, 2)
    const a = aObj.itemName!
    const b = bObj.itemName!
    const result = getMergeResult(a, b)

    if (result) {
      // Check if this is the tutorial flush and emit event for hint controller (only if tutorial not completed)
      if (!this.hasTutorialDownPlayed && this.isTutorialMerge(a, b, result) && !this.isTutorialCompleted()) {
        this.scene.events.emit('tutorial:mergeComplete')
        this.hasTutorialDownPlayed = true // Ensure it only plays once
      }

      // Valid merge - proceed normally
      this.items.destroy(aObj)
      this.items.destroy(bObj)

      // Track the merge in the bestiary
      const bestiaryScene = this.scene.scene.get('Bestiary')
      if (bestiaryScene && (bestiaryScene as any).addDiscovery) {
        (bestiaryScene as any).addDiscovery(a, b, result)
      }

      // Emit event for successful merge (this will spawn from portal)
      this.scene.events.emit("toilet:merged", result)
    } else {
      // Invalid merge - destroy items and spawn Unstable Goo as penalty
      this.scene.tweens.add({
        targets: [aObj, bObj],
        alpha: 0,
        angle: "+=15",
        duration: 180,
        onComplete: () => {
          this.items.destroy(aObj)
          this.items.destroy(bObj)
          
          // Spawn Unstable Goo from portal as penalty

          this.scene.events.emit("toilet:penalty", "Unstable Goo")
        },
      })
    }
  }

  private isDuckItem(itemName: string): boolean {
    // Check if the item name contains "Duck" (case-insensitive).
    return itemName.toLowerCase().includes('duck')
  }

  private playTutorialFlushSound() {
    // Only emit tutorial event if tutorial is not completed
    if (!this.isTutorialCompleted()) {
      // Emit event for hint controller to handle tutorial flush sound
      this.scene.events.emit('tutorial:mergeFlush')
    }
  }

  private isTutorialCompleted(): boolean {
    try {
      const savedState = localStorage.getItem('toilet_merge_gamestate');
      if (!savedState) {
        return false; // No save data means tutorial not completed
      }

      const gameState = JSON.parse(savedState);
      return gameState.tutorialCompleted === true;
    } catch (error) {

      return false; // Default to tutorial not completed if we can't read the save
    }
  }

  private isTutorialMerge(itemA: string, itemB: string, result: string): boolean {
    // Check if this is the specific tutorial merge: Battery + Loose Wires = Powered Wire
    const sortedItems = [itemA, itemB].sort();
    return sortedItems[0] === "Battery" && 
           sortedItems[1] === "Loose Wires" && 
           result === "Powered Wire";
  }

  public hasAnyItems(): boolean {
    return this.waiting.length > 0;
  }

  public hasItemsReadyToMerge(): boolean {
    return this.waiting.length === 2;
  }

  destroy() {
    this.viz.destroy();
    this.zone.destroy();
    this.waiting.length = 0;
  }
}

/** Quick wiring helper */
export function initMergeCore(
  scene: Phaser.Scene,
  portalSprite: Phaser.GameObjects.Sprite | null, // Allow null for tutorial
  toilet: { x: number; y: number; w?: number; h?: number }
) {
  scene.physics.world.setBounds(0, 0, scene.scale.width, scene.scale.height);

  const items = new ItemManager(scene);
  const toiletZone = new MergeToilet(
    scene,
    items,
    toilet.x,
    toilet.y,
    toilet.w ?? 140,
    toilet.h ?? 140
  );
  
  // Only create spawner if portal sprite is provided
  let spawner: PortalSpawner | null = null;
  if (portalSprite) {
    spawner = new PortalSpawner(scene, items, portalSprite);
  }

  // Return an object that allows spawner to be added later
  const mergeSystem = { 
    items, 
    toilet: toiletZone, 
    spawner,
    // Method to add spawner later during tutorial
    setSpawner: (newSpawner: PortalSpawner) => {
      mergeSystem.spawner = newSpawner;
    }
  };

  return mergeSystem;
}
