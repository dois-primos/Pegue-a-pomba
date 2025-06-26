import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const server = createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir os arquivos estáticos da pasta "cliente"
app.use(express.static(path.join(__dirname, "cliente")));

const salas = {};

io.on("connection", (socket) => {
  console.log("Novo jogador:", socket.id);

  socket.on("entrar-na-sala", (sala) => {
    socket.join(sala);
    if (!salas[sala]) {
      salas[sala] = [];
    }
    salas[sala].push(socket.id);

    const jogadores = salas[sala];
    socket.emit("jogadores", {
      primeiro: jogadores[0],
      segundo: jogadores[1] || null,
    });
  });

  socket.on("disconnect", () => {
    for (const sala in salas) {
      salas[sala] = salas[sala].filter((id) => id !== socket.id);
      if (salas[sala].length === 0) {
        delete salas[sala];
      }
    }
    console.log("Jogador desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
