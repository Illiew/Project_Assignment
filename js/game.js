// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 700,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene, ShopScene],
    render: {
        pixelArt: false,
        antialias: true
    }
};

const game = new Phaser.Game(config);

// Game Scene - Main Cooking Game
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.money = 0;
        this.level = 1;
        this.orderQueue = [];
        this.currentOrder = null;
        this.shawarmaProgress = 0;
        this.ingredientCount = 0;
        this.meatPieces = 3;
        this.isClean = true;
    }

    create() {
        this.createBackground();
        this.createUI();
        this.createGameElements();
        this.createButtons();
        this.spawnNewOrder();
        this.events.on('update', this.update, this);
        this.time.addEvent({
            delay: 3000,
            callback: this.spawnNewOrder,
            callbackScope: this,
            loop: true
        });
    }

    createBackground() {
        // Restaurant background
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(0, 0, 1000, 700);
        graphics.generateTexture('bg', 1000, 700);
        graphics.destroy();
        
        this.add.image(500, 350, 'bg');
        
        // Counter
        const counterGfx = this.make.graphics({ x: 0, y: 0, add: false });
        counterGfx.fillStyle(0x654321, 1);
        counterGfx.fillRect(0, 400, 1000, 300);
        counterGfx.generateTexture('counter', 1000, 300);
        counterGfx.destroy();
        
        this.add.image(500, 550, 'counter');
        
        // Wall
        const wallGfx = this.make.graphics({ x: 0, y: 0, add: false });
        wallGfx.fillStyle(0xD2691E, 1);
        wallGfx.fillRect(0, 0, 1000, 400);
        wallGfx.generateTexture('wall', 1000, 400);
        wallGfx.destroy();
        
        this.add.image(500, 200, 'wall');
    }

    createUI() {
        // Money display
        this.moneyText = this.add.text(20, 20, `💵 $${this.money}`, {
            fontSize: '32px',
            fill: '#FFD700',
            fontStyle: 'bold'
        });
        this.moneyText.setDepth(100);

        // Level display
        this.levelText = this.add.text(20, 60, `📊 Level: ${this.level}`, {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontStyle: 'bold'
        });
        this.levelText.setDepth(100);

        // Order display
        this.orderText = this.add.text(500, 30, 'Waiting for order...', {
            fontSize: '28px',
            fill: '#FFFFFF',
            align: 'center',
            fontStyle: 'bold'
        });
        this.orderText.setOrigin(0.5, 0);
        this.orderText.setDepth(100);

        // Progress bar background
        const progressBg = this.add.rectangle(500, 120, 400, 40, 0x333333);
        progressBg.setDepth(100);

        this.progressBar = this.add.rectangle(500, 120, 0, 40, 0x00FF00);
        this.progressBar.setOrigin(0, 0.5);
        this.progressBar.setDepth(101);
        this.progressBar.x = 300;

        this.progressText = this.add.text(500, 120, 'Cook: 0%', {
            fontSize: '18px',
            fill: '#FFFFFF',
            align: 'center'
        });
        this.progressText.setOrigin(0.5);
        this.progressText.setDepth(102);
    }

    createGameElements() {
        // Create cooking station
        this.cookingZone = this.add.rectangle(350, 500, 150, 150, 0x000000, 0.3);
        this.cookingZone.setInteractive();

        // Create cutting station
        this.cuttingZone = this.add.rectangle(550, 500, 150, 150, 0x000000, 0.3);
        this.cuttingZone.setInteractive();

        // Create ingredient station
        this.ingredientZone = this.add.rectangle(750, 500, 150, 150, 0x000000, 0.3);
        this.ingredientZone.setInteractive();

        // Labels
        this.add.text(350, 450, '🍳 COOK', {
            fontSize: '18px',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(550, 450, '🔪 CUT MEAT', {
            fontSize: '18px',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(750, 450, '🥗 INGREDIENTS', {
            fontSize: '18px',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);

        // Interact with cooking zone
        this.cookingZone.on('pointerdown', () => this.cookShawarma());
        
        // Interact with cutting zone
        this.cuttingZone.on('pointerdown', () => this.cutMeat());
        
        // Interact with ingredient zone
        this.ingredientZone.on('pointerdown', () => this.addIngredient());
    }

    createButtons() {
        // Clean button
        const cleanBtn = this.add.rectangle(150, 650, 100, 50, 0x4CAF50);
        cleanBtn.setInteractive();
        cleanBtn.on('pointerdown', () => this.cleanWorkspace());
        this.add.text(150, 650, '🧹 CLEAN', {
            fontSize: '16px',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);

        // Serve button
        const serveBtn = this.add.rectangle(300, 650, 100, 50, 0xFF9800);
        serveBtn.setInteractive();
        serveBtn.on('pointerdown', () => this.serveShawarma());
        this.add.text(300, 650, '📦 SERVE', {
            fontSize: '16px',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);

        // Trash button
        const trashBtn = this.add.rectangle(450, 650, 100, 50, 0xF44336);
        trashBtn.setInteractive();
        trashBtn.on('pointerdown', () => this.throwAway());
        this.add.text(450, 650, '🗑️ TRASH', {
            fontSize: '16px',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);

        // Shop button
        const shopBtn = this.add.rectangle(850, 650, 100, 50, 0x2196F3);
        shopBtn.setInteractive();
        shopBtn.on('pointerdown', () => this.scene.start('ShopScene'));
        this.add.text(850, 650, '🛒 SHOP', {
            fontSize: '16px',
            fill: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);

        // Info text
        this.infoText = this.add.text(600, 650, '', {
            fontSize: '14px',
            fill: '#FFD700'
        });
    }

    spawnNewOrder() {
        if (!this.currentOrder) {
            this.currentOrder = {
                meat: Math.floor(Math.random() * 3) + 1,
                ingredients: Math.floor(Math.random() * 3) + 1,
                quality: 1
            };
            this.orderText.setText(`🛵 New Order: ${this.currentOrder.meat} meat cuts, ${this.currentOrder.ingredients} ingredients`);
        }
    }

    cookShawarma() {
        if (!this.currentOrder) {
            this.infoText.setText('No order!');
            return;
        }
        
        if (this.shawarmaProgress < 100) {
            this.shawarmaProgress += 15;
            this.shawarmaProgress = Math.min(this.shawarmaProgress, 100);
            this.showFeedback('🔥 COOKING...', 350, 500);
            this.updateProgressBar();
        }
    }

    cutMeat() {
        if (!this.currentOrder) {
            this.infoText.setText('No order!');
            return;
        }

        if (this.meatPieces > 0 && this.ingredientCount < this.currentOrder.ingredients) {
            this.meatPieces--;
            if (this.meatPieces <= 0) this.meatPieces = 3;
            this.ingredientCount++;
            this.showFeedback('🔪 CUT!', 550, 500);
            this.showFloatingText(`Meat: ${this.meatPieces}`, 550, 500);
        }
    }

    addIngredient() {
        if (!this.currentOrder) {
            this.infoText.setText('No order!');
            return;
        }

        if (this.ingredientCount < this.currentOrder.ingredients * 2) {
            this.ingredientCount++;
            this.showFeedback('✨ Added!', 750, 500);
        } else {
            this.infoText.setText('Too many ingredients!');
        }
    }

    cleanWorkspace() {
        this.isClean = true;
        this.showFeedback('✨ CLEAN!', 150, 600);
        this.infoText.setText('Workspace cleaned! +10% efficiency');
    }

    throwAway() {
        this.shawarmaProgress = 0;
        this.ingredientCount = 0;
        this.meatPieces = 3;
        this.currentOrder = null;
        this.updateProgressBar();
        this.orderText.setText('Order discarded. Waiting for new order...');
        this.showFeedback('🗑️ TRASH', 450, 600);
    }

    serveShawarma() {
        if (!this.currentOrder) {
            this.infoText.setText('No order to serve!');
            return;
        }

        const quality = this.calculateQuality();
        
        if (quality >= 0.5) {
            const earnings = Math.floor(50 * quality);
            this.money += earnings;
            this.moneyText.setText(`💵 $${this.money}`);
            this.showFeedback(`✅ SOLD +$${earnings}!`, 500, 300);
            
            // Check for level up
            if (this.money >= this.level * 200) {
                this.level++;
                this.levelText.setText(`📊 Level: ${this.level}`);
                this.showFeedback(`⭐ LEVEL UP! ${this.level}`, 500, 200);
            }
        } else {
            this.showFeedback('❌ POOR QUALITY!', 500, 300);
        }

        this.resetShawarma();
    }

    calculateQuality() {
        let quality = (this.shawarmaProgress / 100) * 0.5;
        quality += (this.ingredientCount / (this.currentOrder.ingredients * 2)) * 0.3;
        quality += this.isClean ? 0.2 : 0;
        return Math.min(quality, 1);
    }

    resetShawarma() {
        this.shawarmaProgress = 0;
        this.ingredientCount = 0;
        this.meatPieces = 3;
        this.currentOrder = null;
        this.updateProgressBar();
        this.orderText.setText('Preparing next order...');
        
        this.time.delayedCall(1500, () => this.spawnNewOrder());
    }

    updateProgressBar() {
        const width = (this.shawarmaProgress / 100) * 400;
        this.progressBar.width = width;
        this.progressText.setText(`Cook: ${this.shawarmaProgress}%`);
    }

    showFeedback(text, x, y) {
        const feedback = this.add.text(x, y, text, {
            fontSize: '24px',
            fill: '#FFD700',
            fontStyle: 'bold'
        });
        feedback.setOrigin(0.5);
        
        this.tweens.add({
            targets: feedback,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Quad.easeOut',
            onComplete: () => feedback.destroy()
        });
    }

    showFloatingText(text, x, y) {
        const floatingText = this.add.text(x, y - 30, text, {
            fontSize: '16px',
            fill: '#00FF00'
        });
        floatingText.setOrigin(0.5);
        
        this.tweens.add({
            targets: floatingText,
            y: y - 80,
            alpha: 0,
            duration: 1000,
            ease: 'Quad.easeOut',
            onComplete: () => floatingText.destroy()
        });
    }

    update() {
        // Auto-cook over time (very slowly)
        if (this.currentOrder && this.shawarmaProgress < 100) {
            this.shawarmaProgress += 0.1;
            this.updateProgressBar();
        }
    }
}

// Shop Scene - Upgrades
class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    create() {
        // Background
        const bgGfx = this.make.graphics({ x: 0, y: 0, add: false });
        bgGfx.fillStyle(0x1a1a1a, 1);
        bgGfx.fillRect(0, 0, 1000, 700);
        bgGfx.generateTexture('shopBg', 1000, 700);
        bgGfx.destroy();
        
        this.add.image(500, 350, 'shopBg');

        // Title
        this.add.text(500, 50, '🛒 UPGRADE SHOP', {
            fontSize: '48px',
            fill: '#FFD700',
            align: 'center',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Money display
        const gameScene = this.scene.get('GameScene');
        this.moneyText = this.add.text(50, 30, `💵 $${gameScene.money}`, {
            fontSize: '28px',
            fill: '#FFD700',
            fontStyle: 'bold'
        });

        // Upgrades
        const upgrades = [
            { name: 'Faster Cutting', icon: '⚡', cost: 100, effect: '🔪 2x faster' },
            { name: 'Better Stove', icon: '🔥', cost: 150, effect: '🍳 2x better cook' },
            { name: 'Premium Ingredients', icon: '🌟', cost: 200, effect: '🥗 Better quality' },
            { name: 'Auto Clean', icon: '🤖', cost: 300, effect: '✨ Auto clean' },
            { name: 'Double Meat', icon: '🍖', cost: 250, effect: '🔪 2x meat pieces' },
            { name: 'Bigger Order Queue', icon: '📦', cost: 180, effect: '📊 More orders' }
        ];

        let yPos = 150;
        upgrades.forEach((upgrade, index) => {
            const xPos = index % 2 === 0 ? 250 : 750;
            if (index > 0 && index % 2 === 0) yPos += 150;

            // Upgrade box
            const box = this.add.rectangle(xPos, yPos, 350, 120, 0x333333);
            box.setInteractive();

            // Text
            this.add.text(xPos - 150, yPos - 35, upgrade.name, {
                fontSize: '20px',
                fill: '#FFD700',
                fontStyle: 'bold'
            });

            this.add.text(xPos - 150, yPos, upgrade.effect, {
                fontSize: '16px',
                fill: '#00FF00'
            });

            this.add.text(xPos - 150, yPos + 35, `Cost: $${upgrade.cost}`, {
                fontSize: '14px',
                fill: '#FFFFFF'
            });

            this.add.text(xPos + 120, yPos - 10, upgrade.icon, {
                fontSize: '40px'
            });

            // Buy button
            box.on('pointerdown', () => {
                if (gameScene.money >= upgrade.cost) {
                    gameScene.money -= upgrade.cost;
                    this.moneyText.setText(`💵 $${gameScene.money}`);
                    this.showMessage(`✅ Upgraded: ${upgrade.name}!`);
                } else {
                    this.showMessage('❌ Not enough money!');
                }
            });
        });

        // Back button
        const backBtn = this.add.rectangle(500, 650, 150, 50, 0x2196F3);
        backBtn.setInteractive();
        backBtn.on('pointerdown', () => this.scene.start('GameScene'));
        this.add.text(500, 650, '← BACK', {
            fontSize: '20px',
            fill: '#FFFFFF',
            align: 'center',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.messageText = this.add.text(500, 400, '', {
            fontSize: '32px',
            fill: '#FFD700',
            align: 'center',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    showMessage(msg) {
        this.messageText.setText(msg);
        this.messageText.setDepth(1000);
        
        this.tweens.add({
            targets: this.messageText,
            alpha: 1,
            duration: 100,
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    this.messageText.setText('');
                });
            }
        });
    }
}
