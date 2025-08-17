// src/game/objects/AchievementManager.ts

import { Scene } from 'phaser';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'discovery' | 'economy' | 'combat' | 'cleaning' | 'minigame' | 'box' | 'progression' | 'special';
  requirement: number;
  currentProgress: number;
  completed: boolean;
  completedAt?: number;
  icon?: string;
}

export class AchievementManager {
  private scene: Scene;
  private achievements: Map<string, Achievement> = new Map();
  private notificationContainer?: Phaser.GameObjects.Container;
  private isNotificationVisible: boolean = false;

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeAchievements();
    this.setupEventListeners();
    this.createNotificationContainer();
  }

  private initializeAchievements() {
    // Discovery Achievements
    this.addAchievement({
      id: 'first_discovery',
      title: 'First Discovery',
      description: 'Discover your first merge recipe',
      category: 'discovery',
      requirement: 1,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'recipe_hunter',
      title: 'Recipe Hunter',
      description: 'Discover 10 different merge recipes',
      category: 'discovery',
      requirement: 10,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'master_alchemist',
      title: 'Master Alchemist',
      description: 'Discover 25 different merge recipes',
      category: 'discovery',
      requirement: 25,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'tier_explorer',
      title: 'Tier Explorer',
      description: 'Discover a Tier 3 item',
      category: 'discovery',
      requirement: 1,
      currentProgress: 0,
      completed: false
    });

    // Economy Achievements
    this.addAchievement({
      id: 'goo_collector',
      title: 'Goo Collector',
      description: 'Collect 100 goo total',
      category: 'economy',
      requirement: 100,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'goo_millionaire',
      title: 'Goo Millionaire',
      description: 'Collect 1000 goo total',
      category: 'economy',
      requirement: 1000,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'big_spender',
      title: 'Big Spender',
      description: 'Spend 50 goo in the store',
      category: 'economy',
      requirement: 50,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'store_regular',
      title: 'Store Regular',
      description: 'Purchase 5 different items from the store',
      category: 'economy',
      requirement: 5,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'recycler_owner',
      title: 'Recycler Owner',
      description: 'Purchase the recycler from the store',
      category: 'economy',
      requirement: 1,
      currentProgress: 0,
      completed: false
    });

    // Combat Achievements
    this.addAchievement({
      id: 'enemy_hunter',
      title: 'Enemy Hunter',
      description: 'Defeat 10 enemies total',
      category: 'combat',
      requirement: 10,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'enemy_slayer',
      title: 'Enemy Slayer',
      description: 'Defeat 50 enemies total',
      category: 'combat',
      requirement: 50,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'unstable_goo_buster',
      title: 'Unstable Goo Buster',
      description: 'Defeat 20 Unstable Goo enemies',
      category: 'combat',
      requirement: 20,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'confetti_cleaner',
      title: 'Confetti Cleaner',
      description: 'Defeat 15 Confetti Storm enemies',
      category: 'combat',
      requirement: 15,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'tornado_chaser',
      title: 'Tornado Chaser',
      description: 'Defeat 5 Goo Tornado enemies',
      category: 'combat',
      requirement: 5,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'hazard_handler',
      title: 'Hazard Handler',
      description: 'Defeat enemies using hazards 10 times',
      category: 'combat',
      requirement: 10,
      currentProgress: 0,
      completed: false
    });

    // Cleaning Achievements
    this.addAchievement({
      id: 'clean_freak',
      title: 'Clean Freak',
      description: 'Clean 50 goo splatters with mops',
      category: 'cleaning',
      requirement: 50,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'mop_master',
      title: 'Mop Master',
      description: 'Clean 100 goo splatters with mops',
      category: 'cleaning',
      requirement: 100,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'efficient_cleaner',
      title: 'Efficient Cleaner',
      description: 'Clean 10 splatters with a single mop',
      category: 'cleaning',
      requirement: 10,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'tier_cleaner',
      title: 'Tier Cleaner',
      description: 'Use each tier of mop (Basic, Wet, Soapy)',
      category: 'cleaning',
      requirement: 3,
      currentProgress: 0,
      completed: false
    });

    // Mini-Game Achievements
    this.addAchievement({
      id: 'plunger_pro',
      title: 'Plunger Pro',
      description: 'Get 5 perfect plunger results (green zone)',
      category: 'minigame',
      requirement: 5,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'plunger_master',
      title: 'Plunger Master',
      description: 'Get 20 perfect plunger results',
      category: 'minigame',
      requirement: 20,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'recycler_champion',
      title: 'Recycler Champion',
      description: 'Complete 10 recycler mini-games',
      category: 'minigame',
      requirement: 10,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'recycler_expert',
      title: 'Recycler Expert',
      description: 'Complete 50 recycler mini-games',
      category: 'minigame',
      requirement: 50,
      currentProgress: 0,
      completed: false
    });

    // Box & Failsafe Achievements
    this.addAchievement({
      id: 'box_opener',
      title: 'Box Opener',
      description: 'Open your first help box',
      category: 'box',
      requirement: 1,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'box_collector',
      title: 'Box Collector',
      description: 'Open 10 help boxes',
      category: 'box',
      requirement: 10,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'self_sufficient',
      title: 'Self Sufficient',
      description: 'Play for 10 minutes without opening a help box',
      category: 'box',
      requirement: 1,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'merge_master',
      title: 'Merge Master',
      description: 'Successfully merge 100 items',
      category: 'box',
      requirement: 100,
      currentProgress: 0,
      completed: false
    });

    // Progression Achievements
    this.addAchievement({
      id: 'tutorial_graduate',
      title: 'Tutorial Graduate',
      description: 'Complete the tutorial',
      category: 'progression',
      requirement: 1,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'portal_pioneer',
      title: 'Portal Pioneer',
      description: 'Create your first portal',
      category: 'progression',
      requirement: 1,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'long_session',
      title: 'Long Session',
      description: 'Play for 30 minutes in one session',
      category: 'progression',
      requirement: 1,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'dedicated_player',
      title: 'Dedicated Player',
      description: 'Play for 2 hours total',
      category: 'progression',
      requirement: 1,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'save_scummer',
      title: 'Save Scummer',
      description: 'Save and reload your game 5 times',
      category: 'progression',
      requirement: 5,
      currentProgress: 0,
      completed: false
    });

    // Special Achievements
    this.addAchievement({
      id: 'lucky_duck',
      title: 'Lucky Duck',
      description: 'Find a rubber duck in a box',
      category: 'special',
      requirement: 1,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'radio_enthusiast',
      title: 'Radio Enthusiast',
      description: 'Purchase and use the radio',
      category: 'special',
      requirement: 1,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'goomba_friend',
      title: 'Goomba Friend',
      description: 'Purchase the Goo-mba helper',
      category: 'special',
      requirement: 1,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'environmentalist',
      title: 'Environmentalist',
      description: 'Use the recycler 25 times',
      category: 'special',
      requirement: 25,
      currentProgress: 0,
      completed: false
    });

    this.addAchievement({
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Complete 5 merges in under 30 seconds',
      category: 'special',
      requirement: 1,
      currentProgress: 0,
      completed: false
    });
  }

  private addAchievement(achievement: Achievement) {
    this.achievements.set(achievement.id, achievement);
  }

  private setupEventListeners() {
    // Listen to game events
    this.scene.events.on('achievement:discovery', this.handleDiscovery.bind(this));
    this.scene.events.on('achievement:goo_collected', this.handleGooCollected.bind(this));
    this.scene.events.on('achievement:goo_spent', this.handleGooSpent.bind(this));
    this.scene.events.on('achievement:store_purchase', this.handleStorePurchase.bind(this));
    this.scene.events.on('achievement:enemy_defeated', this.handleEnemyDefeated.bind(this));
    this.scene.events.on('achievement:splatter_cleaned', this.handleSplatterCleaned.bind(this));
    this.scene.events.on('achievement:plunger_perfect', this.handlePlungerPerfect.bind(this));
    this.scene.events.on('achievement:recycler_complete', this.handleRecyclerComplete.bind(this));
    this.scene.events.on('achievement:box_opened', this.handleBoxOpened.bind(this));
    this.scene.events.on('achievement:merge_complete', this.handleMergeComplete.bind(this));
    this.scene.events.on('achievement:tutorial_complete', this.handleTutorialComplete.bind(this));
    this.scene.events.on('achievement:portal_created', this.handlePortalCreated.bind(this));
    this.scene.events.on('achievement:game_saved', this.handleGameSaved.bind(this));
  }

  private createNotificationContainer() {
    this.notificationContainer = this.scene.add.container(0, 0);
    this.notificationContainer.setDepth(10000); // Very high depth to appear on top
    this.notificationContainer.setVisible(false);
  }

  private showAchievementNotification(achievement: Achievement) {
    if (!this.notificationContainer || this.isNotificationVisible) return;

    this.isNotificationVisible = true;

    // Create notification background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x2c3e50, 0.9);
    bg.fillRoundedRect(0, 0, 400, 80, 10);
    bg.lineStyle(2, 0xf39c12);
    bg.strokeRoundedRect(0, 0, 400, 80, 10);

    // Create achievement icon using trophy image
    const icon = this.scene.add.image(30, 40, 'trophy');
    icon.setDisplaySize(30, 30); // Scale down from 1024x1024 to 30x30 for notification size

    // Create title text
    const titleText = this.scene.add.text(60, 20, 'Achievement Unlocked!', {
      fontSize: '16px',
      color: '#f39c12',
      fontStyle: 'bold'
    });

    // Create achievement name
    const achievementText = this.scene.add.text(60, 40, achievement.title, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    });

    // Create description
    const descText = this.scene.add.text(60, 55, achievement.description, {
      fontSize: '12px',
      color: '#bdc3c7'
    });

    // Add all elements to container
    this.notificationContainer.add([bg, icon, titleText, achievementText, descText]);

    // Position notification (top-right corner)
    this.notificationContainer.setPosition(
      this.scene.scale.width - 420,
      20
    );

    // Show notification
    this.notificationContainer.setVisible(true);

    // Animate in
    this.notificationContainer.setAlpha(0);
    this.scene.tweens.add({
      targets: this.notificationContainer,
      alpha: 1,
      duration: 500,
      ease: 'Power2.easeOut'
    });

    // Auto-hide after 4 seconds
    this.scene.time.delayedCall(4000, () => {
      this.hideAchievementNotification();
    });
  }

  private hideAchievementNotification() {
    if (!this.notificationContainer || !this.isNotificationVisible) return;

    this.scene.tweens.add({
      targets: this.notificationContainer,
      alpha: 0,
      duration: 500,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.notificationContainer!.setVisible(false);
        this.isNotificationVisible = false;
      }
    });
  }

  private updateProgress(achievementId: string, amount: number = 1) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || achievement.completed) return;

    achievement.currentProgress += amount;

    if (achievement.currentProgress >= achievement.requirement && !achievement.completed) {
      achievement.completed = true;
      achievement.completedAt = Date.now();
      this.showAchievementNotification(achievement);
      this.saveProgress();
    }
  }

  private saveProgress() {
    // Emit event to notify the Game scene that achievements have been updated
    this.scene.events.emit('achievements:updated');
  }

  // Event handlers
  private handleDiscovery(itemA: string, itemB: string, result: string) {
    // Get current discovery count
    const discoveries = this.getDiscoveryCount();
    this.updateProgress('first_discovery');
    this.updateProgress('recipe_hunter');
    this.updateProgress('master_alchemist');

    // Check for tier 3+ items
    const { getTier } = require('../config/mergeDataFull');
    const tier = getTier(result);
    if (tier >= 3) {
      this.updateProgress('tier_explorer');
    }
  }

  private handleGooCollected(amount: number) {
    this.updateProgress('goo_collector', amount);
    this.updateProgress('goo_millionaire', amount);
  }

  private handleGooSpent(amount: number) {
    this.updateProgress('big_spender', amount);
  }

  private handleStorePurchase(itemName: string) {
    this.updateProgress('store_regular');
    
    if (itemName === 'Recycler') {
      this.updateProgress('recycler_owner');
    } else if (itemName === 'Radio') {
      this.updateProgress('radio_enthusiast');
    } else if (itemName === 'Goo-mba') {
      this.updateProgress('goomba_friend');
    }
  }

  private handleEnemyDefeated(enemyType: string) {
    this.updateProgress('enemy_hunter');
    this.updateProgress('enemy_slayer');

    if (enemyType === 'Unstable Goo') {
      this.updateProgress('unstable_goo_buster');
    } else if (enemyType === 'Confetti Storm') {
      this.updateProgress('confetti_cleaner');
    } else if (enemyType === 'Enemy: Goo Tornado') {
      this.updateProgress('tornado_chaser');
    }
  }

  private handleSplatterCleaned(mopType: string) {
    this.updateProgress('clean_freak');
    this.updateProgress('mop_master');
    this.updateProgress('efficient_cleaner');
    
    // Track tier cleaner progress
    if (mopType === 'Mop' || mopType === 'Wet Mop' || mopType === 'Soapy Mop') {
      this.updateProgress('tier_cleaner');
    }
  }

  private handlePlungerPerfect() {
    this.updateProgress('plunger_pro');
    this.updateProgress('plunger_master');
  }

  private handleRecyclerComplete() {
    this.updateProgress('recycler_champion');
    this.updateProgress('recycler_expert');
    this.updateProgress('environmentalist');
  }

  private handleBoxOpened() {
    this.updateProgress('box_opener');
    this.updateProgress('box_collector');
  }

  private handleMergeComplete() {
    this.updateProgress('merge_master');
  }

  private handleTutorialComplete() {
    this.updateProgress('tutorial_graduate');
  }

  private handlePortalCreated() {
    this.updateProgress('portal_pioneer');
  }

  private handleGameSaved() {
    this.updateProgress('save_scummer');
  }

  private getDiscoveryCount(): number {
    // Discovery count is now handled by cloud save system
    return 0;
  }

  // Public methods
  public getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  public getCompletedAchievements(): Achievement[] {
    return this.getAchievements().filter(a => a.completed);
  }

  public getCompletionPercentage(): number {
    const total = this.achievements.size;
    const completed = this.getCompletedAchievements().length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  public resetProgress() {
    for (const achievement of this.achievements.values()) {
      achievement.currentProgress = 0;
      achievement.completed = false;
      achievement.completedAt = undefined;
    }
  }

  public getProgress(): any {
    const progress: any = {};
    this.achievements.forEach((achievement, id) => {
      progress[id] = {
        currentProgress: achievement.currentProgress,
        completed: achievement.completed,
        completedAt: achievement.completedAt
      };
    });
    return progress;
  }

  public setProgress(progress: any) {
    Object.keys(progress).forEach(id => {
      const achievement = this.achievements.get(id);
      if (achievement) {
        const data = progress[id];
        achievement.currentProgress = data.currentProgress || 0;
        achievement.completed = data.completed || false;
        achievement.completedAt = data.completedAt;
      }
    });
  }
}
