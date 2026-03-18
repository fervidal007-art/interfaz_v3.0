import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
import time

from motor_controller import MotorController

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SEQUENCES_DIR = Path(__file__).parent.parent / "secuencias"

motor = MotorController()
current_speed: int = 35  # default: Normal


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    motor.close()


app = FastAPI(lifespan=lifespan)

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
    global current_speed
    await ws.accept()
    logger.info("🟢 Cliente conectado")
    bat_mv = motor.read_battery_mv()
    if bat_mv is not None:
        logger.info(f"🔋 Batería: {bat_mv} mV ({bat_mv / 1000:.2f} V) — I2C OK")
    else:
        logger.warning("⚠️  I2C no disponible — modo simulación")
    try:
        while True:
            data = json.loads(await ws.receive_text())
            cmd = data.get("type", "?")

            if cmd == "speed":
                current_speed = int(data.get("value", current_speed))
                logger.info(f"⚡ SPEED    | {current_speed}")

            elif cmd == "direction":
                direction = data.get("direction", "")
                pressed = data.get("pressed", False)
                state = "ON" if pressed else "OFF"
                logger.info(f"🎮 DIRECTION | {direction:>3} | {state}")
                if pressed:
                    motor.set_direction(direction, current_speed)
                else:
                    motor.stop()

            elif cmd == "rotate":
                direction = data.get("direction", "")
                pressed = data.get("pressed", False)
                state = "ON" if pressed else "OFF"
                logger.info(f"🔄 ROTATE   | {direction:>3} | {state}")
                if pressed:
                    motor.set_direction(direction, current_speed)
                else:
                    motor.stop()

            elif cmd == "estop":
                logger.info("🔴 E-STOP")
                motor.estop()

            else:
                logger.info(f"❓ {cmd.upper():>8} | {data}")

    except WebSocketDisconnect:
        motor.stop()
        logger.info("⚪ Cliente desconectado — motores parados")
