from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
import time

SEQUENCES_DIR = Path(__file__).parent.parent / "secuencias"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/sequences")
async def list_sequences():
    SEQUENCES_DIR.mkdir(exist_ok=True)
    result = []
    for f in sorted(SEQUENCES_DIR.glob("*.json")):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            data.setdefault("id", f.stem)
            data["isUserCreated"] = True
            result.append(data)
        except Exception:
            pass
    return result


@app.post("/sequences")
async def create_sequence(seq: dict):
    SEQUENCES_DIR.mkdir(exist_ok=True)
    seq_id = seq.get("id") or f"seq-{int(time.time() * 1000)}"
    seq["id"] = seq_id
    seq.setdefault("steps", [])
    filepath = SEQUENCES_DIR / f"{seq_id}.json"
    filepath.write_text(json.dumps(seq, ensure_ascii=False, indent=2), encoding="utf-8")
    return seq


@app.put("/sequences/{seq_id}")
async def update_sequence(seq_id: str, seq: dict):
    SEQUENCES_DIR.mkdir(exist_ok=True)
    seq["id"] = seq_id
    filepath = SEQUENCES_DIR / f"{seq_id}.json"
    filepath.write_text(json.dumps(seq, ensure_ascii=False, indent=2), encoding="utf-8")
    return seq


@app.delete("/sequences/{seq_id}")
async def delete_sequence(seq_id: str):
    filepath = SEQUENCES_DIR / f"{seq_id}.json"
    if filepath.exists():
        filepath.unlink()
    return {"ok": True}


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
