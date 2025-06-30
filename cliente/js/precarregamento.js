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
    this.load.audio("tiro", "assets/tiro.mp3");
  }

  create() {
    this.scene.start("abertura");
  }
}
