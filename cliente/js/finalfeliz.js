/*global Phaser, axios*/
/*eslint no-undef: "error"*/
export default class finalfeliz extends Phaser.Scene {
  constructor() {
    super("finalfeliz");
  }

  init(data) {
    this.game.cenaAtual = "finalfeliz";
    this.score = data.score || 0;
  }

  preload() {
    // Carregar qualquer imagem, áudio ou outro recurso necessário
    this.load.image("final-feliz", "assets/final-feliz.png"); // Fundo para o final feliz
  }

  create() {
    this.add.image(400, 230, "final-feliz");

    // Inicializa o Google Sign-In
    globalThis.google.accounts.id.initialize({
      client_id:
        "331191695151-ku8mdhd76pc2k36itas8lm722krn0u64.apps.googleusercontent.com",
      callback: (res) => {
        if (res.error) {
          console.error(res.error);
        } else {
          axios
            .post(
              "https://feira-de-jogos.dev.br/api/v2/credit",
              {
                product: 45, // id do jogo cadastrado no banco de dados da Feira de Jogos
                value: 250, // crédito em tijolinhos
              },
              {
                headers: {
                  Authorization: `Bearer ${res.credential}`,
                },
              }
            )
            .then(function (response) {
              console.log(response);
              alert("Crédito adicionado com sucesso!");
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            })
            .catch(function (error) {
              console.error(error);
              alert("Erro ao adicionar crédito :(");
            });
        }
      },
    });

    // Exibe o prompt de login
    globalThis.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        globalThis.google.accounts.id.prompt();
      }
    });
  }
}
