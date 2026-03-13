from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    print("🟢 Cliente conectado")
    try:
        while True:
            data = json.loads(await ws.receive_text())
            cmd = data.get("type", "?")
            direction = data.get("direction", "")
            state = "ON" if data.get("pressed") else "OFF"

            if cmd == "estop":
                print(f"🔴 E-STOP | {state}")
            else:
                print(f"🎮 {cmd.upper():>8} | {direction:>3} | {state}")

    except WebSocketDisconnect:
        print("⚪ Cliente desconectado")
