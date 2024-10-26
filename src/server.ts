import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://qrcode-lock-front.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: ["https://qrcode-lock-front.vercel.app", "http://localhost:3000"],
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

const fixedQRCodeId = "myFixedQRCode";
let qrCodes: QRCodes = {
  [fixedQRCodeId]: { locked: true, imageUrl: "" },
};

let qrStatus = { locked: true, redirectUrl: "/bloqueado" };

// Rota para desbloquear QR Code
// Rota para desbloquear QR Code
app.post("/unlock-qr", (req, res) => {
  const { qrId } = req.body;
  if (qrId === fixedQRCodeId) {
    // Somente mudar o status se estiver bloqueado
    if (qrCodes[fixedQRCodeId].locked) {
      qrCodes[fixedQRCodeId].locked = false;
      qrStatus.locked = false;

      const status = {
        locked: false,
        redirectUrl: "https://psiuu-03.vercel.app/",
      };

      io.emit("qrUnlocked", status);
      res.send("QR Code desbloqueado!");
    } else {
      // Se já estiver desbloqueado, envie o status atual
      res.send("QR Code já está desbloqueado.");
    }
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
    const status = {
      locked: true,
      redirectUrl: "https://psiuu-03.vercel.app/",
    };

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
  // Envia o status atual do QR Code ao cliente que se conecta
  socket.emit("qrStatus", qrStatus);

  // Para garantir que o cliente receba o status atualizado ao desbloquear ou bloquear
  socket.on("requestQrStatus", () => {
    socket.emit("qrStatus", qrStatus);
  });
});

// Inicia o servidor na porta 6767
server.listen(6767, () => {
  console.log("Servidor rodando na porta 6767");
});
