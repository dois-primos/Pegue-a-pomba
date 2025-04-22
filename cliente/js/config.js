export default {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  parent: 'game-container',
physics: {
  default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: true 
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}