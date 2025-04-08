export default class abertura extends Phaser.Scene {

  constructor () {
    super('abertura');
  }

  init () { }

  preload () {
    this.load.image('fundo', 'assets/fundo.png')
  }

  create () {
    this.add.image(400, 225, 'fundo')
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('precarregamento')
      })
  }

  update () { }

}

