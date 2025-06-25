/*global io*/
/*eslint no-undef: "error"*/
const socket = io();

document.getElementById("limpar-sala").addEventListener("click", () => {
  socket.emit("limpar-sala", 1);
});
