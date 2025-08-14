
// src/game/managers/SceneManager.ts

import Phaser from 'phaser';

export class SceneManager {
  private scene: Phaser.Scene;
  private customCursor?: Phaser.GameObjects.Sprite;
  private isPointerDown: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ----- Texture utils -----
  public logTextureInfo(key: string, obj?: Phaser.GameObjects.GameObject) {
    // Check duplicates
    if (this.scene.textures.exists(key)) {
      const existingCount = (this.scene as any).textureKeyCount || {};
      existingCount[key] = (existingCount[key] || 0) + 1;
      (this.scene as any).textureKeyCount = existingCount;

      if (existingCount[key] > 1) {

      }
    }

    const tex = this.scene.textures.get(key);
    if (!tex) {

      return;
    }

    const src = tex.getSourceImage() as HTMLImageElement;
    const base = tex.get(); // base frame





    if (obj && 'displayWidth' in obj) {
      const go = obj as any;

      const parent = go.parentContainer;
      if (parent) {
        // Parent container scale info
      }

      if (go.displayWidth === 80 && go.displayHeight === 80) {
        // Object has setDisplaySize(80, 80) applied
      }
    }
  }

  // ----- Cursor management -----
  public setupGlobalCustomCursor() {
    this.scene.input.setDefaultCursor('none');
    this.createCustomCursor();
    this.setupGlobalPointerTracking();

    this.scene.sys.events.on('wake', () => {
      this.recreateCustomCursor();
    });

    this.scene.sys.events.on('resume', () => {
      this.recreateCustomCursor();
    });
  }

  public createCustomCursor() {
    if (this.customCursor) {
      this.customCursor.destroy();
    }
    this.customCursor = this.scene.add.sprite(0, 0, 'grabber', 0);
    this.customCursor.setDepth(99999);
    this.customCursor.setScrollFactor(0);
    this.customCursor.setVisible(true);
    this.customCursor.setFlipY(true);
    this.customCursor.setOrigin(0, 0);
  }

  public recreateCustomCursor() {
    this.createCustomCursor();
    if (this.isPointerDown && this.customCursor) {
      this.customCursor.setFrame(1);
    }
  }

  private setupGlobalPointerTracking() {
    const game = this.scene.sys.game;
    const canvas = game.canvas;

    const updateCursorPosition = (event: MouseEvent) => {
      if (!this.customCursor || !this.customCursor.active) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const scaledX = x * scaleX;
      const scaledY = y * scaleY;

      this.customCursor.setPosition(scaledX, scaledY);
      this.customCursor.setDepth(99999);
    };

    const updateCursorState = (isDown: boolean) => {
      if (!this.customCursor || !this.customCursor.active) return;
      this.customCursor.setFrame(isDown ? 1 : 0);
      this.customCursor.setDepth(999999);
    };

    canvas.addEventListener('mousemove', updateCursorPosition);
    canvas.addEventListener('mousedown', () => {
      this.isPointerDown = true;
      updateCursorState(true);
    });
    canvas.addEventListener('mouseup', () => {
      this.isPointerDown = false;
      updateCursorState(false);
    });

    canvas.addEventListener('mouseenter', () => {
      if (this.customCursor) {
        this.customCursor.setVisible(true);
        this.customCursor.setDepth(999991);
      }
    });

    canvas.addEventListener('mouseleave', () => {
      if (this.customCursor) this.customCursor.setVisible(false);
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.customCursor) {
        this.customCursor.setPosition(pointer.x, pointer.y);
        this.customCursor.setDepth(999991);
      }
    });

    this.scene.input.on('pointerdown', () => {
      this.isPointerDown = true;
      if (this.customCursor) {
        this.customCursor.setFrame(1);
        this.customCursor.setDepth(999999);
      }
    });

    this.scene.input.on('pointerup', () => {
      this.isPointerDown = false;
      if (this.customCursor) {
        this.customCursor.setFrame(0);
        this.customCursor.setDepth(999999);
      }
    });

    this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (this.customCursor && this.customCursor.active) {
          this.customCursor.setDepth(99999);
          if (this.customCursor.scene !== this.scene) {
            this.recreateCustomCursor();
          }
        }
      },
      loop: true
    });
  }

  public destroyCursor() {
    if (this.customCursor) {
      this.customCursor.destroy();
      this.customCursor = undefined;
    }
  }

  // ----- Notifications -----
  public showSaveNotification() {
    const notification = this.scene.add.text(this.scene.scale.width - 20, 20, "Game Saved", {
      fontSize: "16px",
      color: "#27ae60",
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: { x: 8, y: 4 }
    });
    notification.setOrigin(1, 0);
    notification.setDepth(2000);

    notification.setAlpha(0);
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      duration: 300,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            duration: 500,
            ease: 'Power2.easeIn',
            onComplete: () => notification.destroy()
          });
        });
      }
    });
  }
}
