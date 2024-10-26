import express from "express";
import http from "http";
import QRCode from "qrcode";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Substitua pela URL da sua aplicação
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Configuração do CORS
app.use(
  cors({
    origin: "http://localhost:3000", // Substitua pela URL da sua aplicação
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

interface QRCodeStatus {
  locked: boolean;
  imageUrl: string;
}

interface QRCodes {
  [key: string]: QRCodeStatus;
}

// ID fixo do QR Code
const fixedQRCodeId = "myFixedQRCode";
let qrCodes: QRCodes = {
  [fixedQRCodeId]: { locked: true, imageUrl: "" },
};

let qrStatus = { locked: true, redirectUrl: "/bloqueado" };

// Rota para desbloquear QR Code
app.post("/unlock-qr", (req, res) => {
  const { qrId } = req.body;
  if (qrId === fixedQRCodeId) {
    qrCodes[fixedQRCodeId].locked = false;
    qrStatus.locked = false;
    const status = {
      locked: false,
      redirectUrl: "https://psiuu-03.vercel.app/",
    };

    io.emit("qrUnlocked", status);
    res.send("QR Code desbloqueado!");
  } else {
    res.status(404).send("QR Code não encontrado.");
  }
});

// Rota para bloquear QR Code
app.post("/lock-qr", (req, res) => {
  const { qrId } = req.body;
  if (qrId === fixedQRCodeId) {
    qrCodes[fixedQRCodeId].locked = true;
    qrStatus.locked = true;
    const status = { locked: true, redirectUrl: "/bloqueado" };

    io.emit("qrLocked", status);
    res.send("QR Code bloqueado!");
  } else {
    res.status(404).send("QR Code não encontrado.");
  }
});

// Rota para obter o status do QR Code
app.get("/qr-status", (req, res) => {
  res.json({ locked: qrStatus.locked });
});

// Evento de conexão do Socket.IO
io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);
  socket.emit("qrStatus", qrStatus);
});

// Inicia o servidor na porta 6767
server.listen(6767, () => {
  console.log("Servidor rodando na porta 6767");
});
