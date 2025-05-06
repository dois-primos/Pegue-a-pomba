export default class precarregamento extends Phaser.Scene {

  constructor () {
    super('precarregamento');
  }

  init () {
    this.add.rectangle(400, 300, 468, 32).setStrokeStyle(1, 0xffffff)
    const progresso = this.add.rectangle(400, 300, 468, 32).setFillStyle(0xffffff)
    this.load.on('progress', (progress) => {
      progresso.width = 4 + (460 * progress)
    })
  }

  preload () {
    this.load.image ('background', 'assets/background.png')
    this.load.setPath('assets/')
    this.load.image('fundo', 'fundo.png')
    this.load.sprite('mira', 'mira.png')
    this.load.spritesheet('botao', 'botao.png', {
      frameWidth: 64,
      frameHeight: 64
    })
  }


  create () {
    this.scene.start('sala')

  }

  update () { }

}