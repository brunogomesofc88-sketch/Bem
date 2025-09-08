import express from "express";
import { WebSocketServer } from "ws";
import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";

const app = express();
const PORT = process.env.PORT || 8080;
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || "gotiicaff";

// Servidor HTTP (Render precisa disso)
app.get("/", (req, res) => {
  res.send("✅ Servidor TikTok Live rodando!");
});
const server = app.listen(PORT, () =>
  console.log(`🌐 HTTP rodando na porta ${PORT}`)
);

// Servidor WebSocket
const wss = new WebSocketServer({ server });
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

// Conectar ao TikTok
let connection = new TikTokLiveConnection(TIKTOK_USERNAME);

connection.connect()
  .then(state => {
    console.log(`✅ Conectado à live de @${TIKTOK_USERNAME}, roomId: ${state.roomId}`);
  })
  .catch(err => console.error("❌ Erro ao conectar:", err));

// Eventos
connection.on(WebcastEvent.CHAT, data => {
  broadcast({ type: "chat", user: data.user.uniqueId, comment: data.comment });
});

connection.on(WebcastEvent.GIFT, data => {
  broadcast({
    type: "gift",
    user: data.user.uniqueId,
    gift: data.giftName,
    amount: data.repeatCount
  });
});

connection.on(WebcastEvent.LIKE, data => {
  broadcast({
    type: "like",
    user: data.user.uniqueId,
    likeCount: data.likeCount,
    total: data.totalLikeCount
  });
});

connection.on(WebcastEvent.MEMBER, data => {
  broadcast({ type: "join", user: data.user.uniqueId });
});
