// src/game/scenes/AchievementScene.ts

import { Scene } from 'phaser';
import { Achievement } from '../objects/AchievementManager';

export class AchievementScene extends Scene {
  private background!: Phaser.GameObjects.Graphics;
  private container!: Phaser.GameObjects.Container;
  private scrollContainer!: Phaser.GameObjects.Container;
  private achievements: Achievement[] = [];
  private closeButton!: Phaser.GameObjects.Container;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private scrollStartY: number = 0;

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
    const completionText = this.add.text(0, -260, '', {
      fontSize: '18px',
      color: '#cccccc'
    });
    completionText.setOrigin(0.5);
    this.container.add(completionText);

    // Create scrollable container for achievements
    this.scrollContainer = this.add.container(0, -200);
    this.container.add(this.scrollContainer);

    // Load achievements from localStorage
    this.loadAchievements();
    this.updateCompletionText();

    // Create achievement items
    this.createAchievementItems();

    // Create close button
    this.createCloseButton();

    // Set up input handlers
    this.setupInputHandlers();

    // Make scrollable
    this.makeScrollable();
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
    // Create a basic list of achievements (this should match the ones in AchievementManager)
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
        id: 'goo_collector',
        title: 'Goo Collector',
        description: 'Collect 100 goo total',
        category: 'economy',
        requirement: 100,
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
        id: 'clean_freak',
        title: 'Clean Freak',
        description: 'Clean 50 goo splatters with mops',
        category: 'cleaning',
        requirement: 50,
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
        id: 'tutorial_graduate',
        title: 'Tutorial Graduate',
        description: 'Complete the tutorial',
        category: 'progression',
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
    
    const completionText = this.container.getAt(2) as Phaser.GameObjects.Text;
    if (completionText) {
      completionText.setText(`${completed}/${total} Achievements (${percentage}%)`);
    }
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

    // Icon
    const iconColor = achievement.completed ? 0xf39c12 : 0x95a5a6;
    const icon = this.add.circle(-320, 0, 20, iconColor);
    itemContainer.add(icon);

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
    categoryBg.fillRoundedRect(-350, -35, 60, 20, 4);
    itemContainer.add(categoryBg);

    const categoryText = this.add.text(-320, -25, achievement.category.toUpperCase(), {
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

  private setupInputHandlers() {
    // Handle escape key
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.stop();
    });
  }

  private makeScrollable() {
    const scrollArea = this.add.zone(0, -200, 700, 400);
    scrollArea.setInteractive();

    scrollArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartY = pointer.y;
      this.scrollStartY = this.scrollContainer.y;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaY = pointer.y - this.dragStartY;
        const newY = this.scrollStartY + deltaY;
        
        // Limit scrolling
        const minY = -200 - (this.achievements.length * 80) + 400;
        const maxY = -200;
        
        this.scrollContainer.y = Phaser.Math.Clamp(newY, minY, maxY);
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Mouse wheel scrolling
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, deltaX: number, deltaY: number) => {
      const currentY = this.scrollContainer.y;
      const newY = currentY - deltaY * 2;
      
      // Limit scrolling
      const minY = -200 - (this.achievements.length * 80) + 400;
      const maxY = -200;
      
      this.scrollContainer.y = Phaser.Math.Clamp(newY, minY, maxY);
    });
  }
}
