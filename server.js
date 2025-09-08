import asyncio
import json
import os
import websockets
from tiktoklive import TikTokLiveClient
from tiktoklive.events import JoinEvent, GiftEvent

# ⚠️ Defina o @ da sua conta TikTok em variável de ambiente no Render
TIKTOK_USERNAME = os.getenv("TIKTOK_USERNAME", "seu_user")

# Lista de conexões WebSocket ativas (navegadores conectados)
connections = set()

# Cliente TikTokLive
client = TikTokLiveClient(unique_id=TIKTOK_USERNAME)


# WebSocket handler: cuida das conexões do navegador
async def ws_handler(websocket):
    connections.add(websocket)
    try:
        async for _ in websocket:
            pass  # não esperamos mensagens do cliente, só enviamos
    finally:
        connections.remove(websocket)


# Função para enviar eventos para todos conectados
async def broadcast(data):
    if connections:
        msg = json.dumps(data)
        await asyncio.gather(*(ws.send(msg) for ws in connections))


# Evento: alguém entrou na live
@client.on("join")
async def on_join(event: JoinEvent):
    data = {
        "type": "join",
        "user": event.user.unique_id,
        "profilePic": event.user.profile_picture.url
    }
    await broadcast(data)


# Evento: alguém mandou presente (opcional, para integrar com Plinko depois)
@client.on("gift")
async def on_gift(event: GiftEvent):
    data = {
        "type": "gift",
        "user": event.user.unique_id,
        "profilePic": event.user.profile_picture.url,
        "gift": event.gift.name,
        "amount": event.gift.repeat_count
    }
    await broadcast(data)


# Main
async def main():
    port = int(os.getenv("PORT", 8080))
    server = await websockets.serve(ws_handler, "0.0.0.0", port)
    print(f"✅ WebSocket rodando na porta {port} e conectado ao @{TIKTOK_USERNAME}")
    await asyncio.gather(client.start(), server.wait_closed())


if __name__ == "__main__":
    asyncio.run(main())
