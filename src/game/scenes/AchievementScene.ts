// src/game/scenes/AchievementScene.ts

import { Scene } from 'phaser';
import { Achievement } from '../objects/AchievementManager';

export class AchievementScene extends Scene {
  private background!: Phaser.GameObjects.Graphics;
  private container!: Phaser.GameObjects.Container;
  private scrollContainer!: Phaser.GameObjects.Container;
  private achievements: Achievement[] = [];
  private closeButton!: Phaser.GameObjects.Container;
  private completionText!: Phaser.GameObjects.Text;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private scrollStartY: number = 0;
  private wheelHandler!: (event: WheelEvent) => void;

  constructor() {
    super('AchievementScene');
  }

  create() {
    // Set up background
    this.background = this.add.graphics();
    this.background.fillStyle(0x000000, 0.8);
    this.background.fillRect(0, 0, this.scale.width, this.scale.height);

    // Create main container
    this.container = this.add.container(this.scale.width / 2, this.scale.height / 2);

    // Create title
    const title = this.add.text(0, -300, 'Achievements', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Create completion percentage
    this.completionText = this.add.text(0, -260, '', {
      fontSize: '18px',
      color: '#cccccc'
    });
    this.completionText.setOrigin(0.5);
    this.container.add(this.completionText);

    // Create scrollable container for achievements
    this.scrollContainer = this.add.container(0, -200);
    this.scrollContainer.setDepth(2);
    this.container.add(this.scrollContainer);

    // Load achievements from localStorage
    this.loadAchievements();
    this.updateCompletionText();

    // Create achievement items
    this.createAchievementItems();

    // Create close button
    this.createCloseButton();

    // Create exit to main menu button
    this.createExitButton();

    // Set up input handlers
    this.setupInputHandlers();

    // Make scrollable
    this.makeScrollable();
    
    // Debug info
    console.log(`Achievement scene created with ${this.achievements.length} achievements`);
    console.log(`Total height: ${this.achievements.length * 80}px`);
    console.log(`Scroll container initial Y: ${this.scrollContainer.y}`);
  }

  private loadAchievements() {
    try {
      const saved = localStorage.getItem('achievement_progress');
      if (saved) {
        const progress = JSON.parse(saved);
        // We'll get the full achievement list from the Game scene
        // For now, create a basic structure
        this.achievements = this.createBasicAchievementList();
        
        // Update with saved progress
        for (const [id, data] of Object.entries(progress)) {
          const achievement = this.achievements.find(a => a.id === id);
          if (achievement) {
            achievement.currentProgress = (data as any).currentProgress || 0;
            achievement.completed = (data as any).completed || false;
            achievement.completedAt = (data as any).completedAt;
          }
        }
      } else {
        this.achievements = this.createBasicAchievementList();
      }
    } catch (e) {
      this.achievements = this.createBasicAchievementList();
    }
  }

  private createBasicAchievementList(): Achievement[] {
    // Create a comprehensive list of achievements to test scrolling
    return [
      {
        id: 'first_discovery',
        title: 'First Discovery',
        description: 'Discover your first merge recipe',
        category: 'discovery',
        requirement: 1,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'recipe_hunter',
        title: 'Recipe Hunter',
        description: 'Discover 10 different merge recipes',
        category: 'discovery',
        requirement: 10,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'master_alchemist',
        title: 'Master Alchemist',
        description: 'Discover 25 different merge recipes',
        category: 'discovery',
        requirement: 25,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'tier_explorer',
        title: 'Tier Explorer',
        description: 'Discover a Tier 3 item',
        category: 'discovery',
        requirement: 1,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'goo_collector',
        title: 'Goo Collector',
        description: 'Collect 100 goo total',
        category: 'economy',
        requirement: 100,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'goo_millionaire',
        title: 'Goo Millionaire',
        description: 'Collect 1000 goo total',
        category: 'economy',
        requirement: 1000,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'big_spender',
        title: 'Big Spender',
        description: 'Spend 50 goo in the store',
        category: 'economy',
        requirement: 50,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'store_regular',
        title: 'Store Regular',
        description: 'Purchase 5 different items from the store',
        category: 'economy',
        requirement: 5,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'recycler_owner',
        title: 'Recycler Owner',
        description: 'Purchase the recycler from the store',
        category: 'economy',
        requirement: 1,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'enemy_hunter',
        title: 'Enemy Hunter',
        description: 'Defeat 10 enemies total',
        category: 'combat',
        requirement: 10,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'enemy_slayer',
        title: 'Enemy Slayer',
        description: 'Defeat 50 enemies total',
        category: 'combat',
        requirement: 50,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'unstable_goo_buster',
        title: 'Unstable Goo Buster',
        description: 'Defeat 20 Unstable Goo enemies',
        category: 'combat',
        requirement: 20,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'confetti_cleaner',
        title: 'Confetti Cleaner',
        description: 'Defeat 15 Confetti Storm enemies',
        category: 'combat',
        requirement: 15,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'tornado_chaser',
        title: 'Tornado Chaser',
        description: 'Defeat 5 Goo Tornado enemies',
        category: 'combat',
        requirement: 5,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'clean_freak',
        title: 'Clean Freak',
        description: 'Clean 50 goo splatters with mops',
        category: 'cleaning',
        requirement: 50,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'mop_master',
        title: 'Mop Master',
        description: 'Clean 100 goo splatters with mops',
        category: 'cleaning',
        requirement: 100,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'plunger_pro',
        title: 'Plunger Pro',
        description: 'Get 5 perfect plunger results (green zone)',
        category: 'minigame',
        requirement: 5,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'plunger_master',
        title: 'Plunger Master',
        description: 'Get 20 perfect plunger results',
        category: 'minigame',
        requirement: 20,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'recycler_champion',
        title: 'Recycler Champion',
        description: 'Complete 10 recycler mini-games',
        category: 'minigame',
        requirement: 10,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'box_opener',
        title: 'Box Opener',
        description: 'Open your first help box',
        category: 'box',
        requirement: 1,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'box_collector',
        title: 'Box Collector',
        description: 'Open 10 help boxes',
        category: 'box',
        requirement: 10,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'tutorial_graduate',
        title: 'Tutorial Graduate',
        description: 'Complete the tutorial',
        category: 'progression',
        requirement: 1,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'portal_pioneer',
        title: 'Portal Pioneer',
        description: 'Create your first portal',
        category: 'progression',
        requirement: 1,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'lucky_duck',
        title: 'Lucky Duck',
        description: 'Find a rubber duck in a box',
        category: 'special',
        requirement: 1,
        currentProgress: 0,
        completed: false
      },
      {
        id: 'radio_enthusiast',
        title: 'Radio Enthusiast',
        description: 'Purchase and use the radio',
        category: 'special',
        requirement: 1,
        currentProgress: 0,
        completed: false
      }
    ];
  }

  private updateCompletionText() {
    const total = this.achievements.length;
    const completed = this.achievements.filter(a => a.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    this.completionText.setText(`${completed}/${total} Achievements (${percentage}%)`);
  }

  private createAchievementItems() {
    const startY = 0;
    const spacing = 80;

    this.achievements.forEach((achievement, index) => {
      const y = startY + (index * spacing);
      this.createAchievementItem(achievement, y);
    });
  }

  private createAchievementItem(achievement: Achievement, y: number) {
    const itemContainer = this.add.container(0, y);
    this.scrollContainer.add(itemContainer);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(achievement.completed ? 0x27ae60 : 0x2c3e50, 0.8);
    bg.fillRoundedRect(-350, -35, 700, 70, 8);
    bg.lineStyle(2, achievement.completed ? 0x2ecc71 : 0x34495e);
    bg.strokeRoundedRect(-350, -35, 700, 70, 8);
    itemContainer.add(bg);

    // Icon - only show for completed achievements
    if (achievement.completed) {
      const icon = this.add.image(-320, 0, 'trophy');
      icon.setDisplaySize(40, 40); // Smaller size for achievement list
      itemContainer.add(icon);
    }

    // Title
    const title = this.add.text(-280, -15, achievement.title, {
      fontSize: '16px',
      color: achievement.completed ? '#ffffff' : '#bdc3c7',
      fontStyle: 'bold'
    });
    itemContainer.add(title);

    // Description
    const description = this.add.text(-280, 5, achievement.description, {
      fontSize: '12px',
      color: achievement.completed ? '#ecf0f1' : '#95a5a6'
    });
    itemContainer.add(description);

    // Progress bar
    const progressBarBg = this.add.graphics();
    progressBarBg.fillStyle(0x34495e, 0.5);
    progressBarBg.fillRoundedRect(200, -10, 100, 20, 4);
    itemContainer.add(progressBarBg);

    const progress = Math.min(achievement.currentProgress / achievement.requirement, 1);
    const progressBarFill = this.add.graphics();
    progressBarFill.fillStyle(achievement.completed ? 0x2ecc71 : 0x3498db, 0.8);
    progressBarFill.fillRoundedRect(200, -10, 100 * progress, 20, 4);
    itemContainer.add(progressBarFill);

    // Progress text
    const progressText = this.add.text(250, 0, `${achievement.currentProgress}/${achievement.requirement}`, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    progressText.setOrigin(0.5);
    itemContainer.add(progressText);

    // Category badge
    const categoryColors: Record<string, number> = {
      discovery: 0xe74c3c,
      economy: 0xf39c12,
      combat: 0x9b59b6,
      cleaning: 0x3498db,
      minigame: 0x1abc9c,
      box: 0x34495e,
      progression: 0x27ae60,
      special: 0xe67e22
    };

    const categoryBg = this.add.graphics();
    categoryBg.fillStyle(categoryColors[achievement.category] || 0x95a5a6, 0.8);
    categoryBg.fillRoundedRect(-30, -35, 60, 20, 4);
    itemContainer.add(categoryBg);

    const categoryText = this.add.text(0, -25, achievement.category.toUpperCase(), {
      fontSize: '8px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    categoryText.setOrigin(0.5);
    itemContainer.add(categoryText);

    // Completion checkmark
    if (achievement.completed) {
      const checkmark = this.add.text(320, 0, '✓', {
        fontSize: '24px',
        color: '#2ecc71',
        fontStyle: 'bold'
      });
      checkmark.setOrigin(0.5);
      itemContainer.add(checkmark);
    }
  }

  private createCloseButton() {
    this.closeButton = this.add.container(this.scale.width / 2 + 350, this.scale.height / 2 - 350);

    const bg = this.add.graphics();
    bg.fillStyle(0xe74c3c, 0.8);
    bg.fillCircle(0, 0, 25);
    bg.lineStyle(2, 0xc0392b);
    bg.strokeCircle(0, 0, 25);
    this.closeButton.add(bg);

    const text = this.add.text(0, 0, 'X', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);
    this.closeButton.add(text);

    this.closeButton.setInteractive(new Phaser.Geom.Circle(0, 0, 25), Phaser.Geom.Circle.Contains);
    this.closeButton.on('pointerdown', () => {
      this.scene.stop();
    });

    this.closeButton.on('pointerover', () => {
      this.closeButton.setScale(1.1);
    });

    this.closeButton.on('pointerout', () => {
      this.closeButton.setScale(1.0);
    });
  }

  private createExitButton() {
    // Create button at screen coordinates, not relative to container
    const exitButton = this.add.container(this.scale.width / 2, this.scale.height - 50);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x3498db, 0.9);
    bg.fillRoundedRect(-100, -25, 200, 50, 8);
    bg.lineStyle(2, 0x2980b9);
    bg.strokeRoundedRect(-100, -25, 200, 50, 8);
    exitButton.add(bg);

    // Text
    const text = this.add.text(0, 0, 'Exit to Main Menu', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);
    exitButton.add(text);

    // Make interactive
    exitButton.setInteractive(new Phaser.Geom.Rectangle(-100, -25, 200, 50), Phaser.Geom.Rectangle.Contains);
    
    // Click handler
    exitButton.on('pointerdown', () => {
      this.scene.stop();
      this.scene.start('MainMenu');
    });

    // Hover effects
    exitButton.on('pointerover', () => {
      exitButton.setScale(1.05);
      this.input.setDefaultCursor('pointer');
    });

    exitButton.on('pointerout', () => {
      exitButton.setScale(1.0);
      this.input.setDefaultCursor('default');
    });

    // Set high depth to ensure it's visible
    exitButton.setDepth(20);
  }

  private setupInputHandlers() {
    // Handle escape key
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.stop();
    });
  }

  private makeScrollable() {
    // Create scroll area that covers the entire achievement list area
    const scrollArea = this.add.zone(0, -200, 800, 600);
    scrollArea.setInteractive();
    scrollArea.setDepth(10); // Ensure it's above other elements

    // Touch/drag scrolling
    scrollArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log('Pointer down on scroll area');
      this.isDragging = true;
      this.dragStartY = pointer.y;
      this.scrollStartY = this.scrollContainer.y;
    });

    scrollArea.on('pointerup', () => {
      if (this.isDragging) {
        console.log('Pointer up on scroll area - stopping drag');
        this.isDragging = false;
      }
    });

    scrollArea.on('pointerout', () => {
      if (this.isDragging) {
        console.log('Pointer out on scroll area - stopping drag');
        this.isDragging = false;
      }
    });

    // Make the entire scroll container interactive with a much larger area
    this.scrollContainer.setInteractive(new Phaser.Geom.Rectangle(-800, -2000, 1600, 4000), Phaser.Geom.Rectangle.Contains);
    this.scrollContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log('Pointer down on scroll container');
      this.isDragging = true;
      this.dragStartY = pointer.y;
      this.scrollStartY = this.scrollContainer.y;
    });

    this.scrollContainer.on('pointerup', () => {
      if (this.isDragging) {
        console.log('Pointer up on scroll container - stopping drag');
        this.isDragging = false;
      }
    });

    this.scrollContainer.on('pointerout', () => {
      if (this.isDragging) {
        console.log('Pointer out on scroll container - stopping drag');
        this.isDragging = false;
      }
    });

    // Use global input events for better drag detection
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaY = pointer.y - this.dragStartY;
        const newY = this.scrollStartY + deltaY;
        
        // Calculate proper scroll limits
        const totalHeight = this.achievements.length * 80; // 80px per achievement
        const visibleHeight = 400; // Visible area height
        const minY = -200 - Math.max(0, totalHeight - visibleHeight);
        const maxY = -200;
        
        console.log(`Dragging: currentY=${this.scrollContainer.y}, newY=${newY}, minY=${minY}, maxY=${maxY}, totalHeight=${totalHeight}`);
        
        this.scrollContainer.y = Phaser.Math.Clamp(newY, minY, maxY);
      }
    });

    this.input.on('pointerup', () => {
      if (this.isDragging) {
        console.log('Pointer up - stopping drag');
        this.isDragging = false;
      }
    });

    // Also handle pointer out to stop dragging if pointer leaves the area
    this.input.on('pointerout', () => {
      if (this.isDragging) {
        console.log('Pointer out - stopping drag');
        this.isDragging = false;
      }
    });

    // Mouse wheel scrolling - make it work globally
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, deltaX: number, deltaY: number) => {
      console.log(`Wheel event: deltaX=${deltaX}, deltaY=${deltaY}`);
      
      const currentY = this.scrollContainer.y;
      const newY = currentY - deltaY * 10; // Increased sensitivity
      
      // Calculate proper scroll limits
      const totalHeight = this.achievements.length * 80; // 80px per achievement
      const visibleHeight = 400; // Visible area height
      const minY = -200 - Math.max(0, totalHeight - visibleHeight);
      const maxY = -200;
      
      console.log(`Scrolling: currentY=${currentY}, newY=${newY}, minY=${minY}, maxY=${maxY}, totalHeight=${totalHeight}`);
      
      this.scrollContainer.y = Phaser.Math.Clamp(newY, minY, maxY);
    });

    // Alternative mouse wheel handling using DOM events
    const gameCanvas = this.game.canvas;
    this.wheelHandler = (event: WheelEvent) => {
      event.preventDefault();
      console.log(`DOM Wheel event: deltaY=${event.deltaY}`);
      
      const currentY = this.scrollContainer.y;
      const newY = currentY - event.deltaY * 0.5; // Scale down the delta
      
      // Calculate proper scroll limits
      const totalHeight = this.achievements.length * 80; // 80px per achievement
      const visibleHeight = 400; // Visible area height
      const minY = -200 - Math.max(0, totalHeight - visibleHeight);
      const maxY = -200;
      
      console.log(`DOM Scrolling: currentY=${currentY}, newY=${newY}, minY=${minY}, maxY=${maxY}`);
      
      this.scrollContainer.y = Phaser.Math.Clamp(newY, minY, maxY);
    };
    gameCanvas.addEventListener('wheel', this.wheelHandler, { passive: false });


    
    // Add scroll instructions
    const scrollText = this.add.text(0, 250, 'Scroll to see more achievements', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'italic'
    });
    scrollText.setOrigin(0.5);
    scrollText.setDepth(5);
    this.container.add(scrollText);
  }

  shutdown() {
    // Clean up DOM event listener
    const gameCanvas = this.game.canvas;
    if (gameCanvas && this.wheelHandler) {
      gameCanvas.removeEventListener('wheel', this.wheelHandler);
    }
  }
}
