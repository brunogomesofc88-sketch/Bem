import express from "express";
import { WebSocketServer } from "ws";
import TikTokLiveConnection from "tiktok-live-connector";

const app = express();
const PORT = process.env.PORT || 8080;
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || "seu_user";

// --- HTTP (Render precisa de HTTP rodando) ---
app.get("/", (req, res) => {
  res.send("✅ Servidor TikTok Live rodando!");
});
const server = app.listen(PORT, () =>
  console.log(`🌐 Servidor HTTP rodando na porta ${PORT}`)
);

// --- WEBSOCKET SERVER ---
const wss = new WebSocketServer({ server });
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

// --- TIKTOK LIVE ---
let tiktok = new TikTokLiveConnection(TIKTOK_USERNAME, {
  enableExtendedGiftInfo: true,
});

// Evento: conectado
tiktok.connect().then(() => {
  console.log(`🎥 Conectado à live de @${TIKTOK_USERNAME}`);
});

// Evento: usuário entrou
tiktok.on("roomUser", (msg) => {
  if (msg.user) {
    broadcast({
      type: "join",
      user: msg.user.uniqueId,
      profilePic: msg.user.profilePictureUrl,
    });
  }
});

// Evento: presente enviado
tiktok.on("gift", (msg) => {
  broadcast({
    type: "gift",
    user: msg.uniqueId,
    profilePic: msg.profilePictureUrl,
    gift: msg.giftName,
    amount: msg.repeatCount,
  });
});
