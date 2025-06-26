/*global Phaser*/

export default class precarregamento extends Phaser.Scene {
  constructor() {
    super("precarregamento");
  }

  preload() {
    // Exemplo de carregamento de imagens
    this.load.image("background", "assets/background.png");
    this.load.image("mira", "assets/mira.png");
    this.load.image("pomba", "assets/pomba-branca.png");
    this.load.audio("musica", "assets/som.mp3");
    this.load.spritesheet("explosao", "assets/explosao.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    // Fonte personalizada, se houver
    this.load.bitmapFont("pixelFont", "assets/font.png", "assets/font.xml");
  }

  create() {
    this.scene.start("abertura");
  }
}
