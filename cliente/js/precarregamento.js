/*global Phaser*/

export default class precarregamento extends Phaser.Scene {
  constructor() {
    super("precarregamento");
  }

  preload() {
    this.load.audio("musica-de-fundo", "assets/musica-de-fundo.mp3");
    this.load.audio("fire", "assets/fire.mp3");

    this.load.image("mira", "assets/mira.png");
    this.load.image("mira-remoto", "assets/mira-remoto.png");
    this.load.image("background", "assets/background.png");

    this.load.spritesheet("pomba-branca", "assets/pomba-branca.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet("pomba-cinza", "assets/pomba-cinza.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet("corvo", "assets/corvo.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet(
      "pomba-branca-caindo",
      "assets/pomba-branca-caindo.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );
  }

  create() {
    this.scene.start("sala");
  }
}
