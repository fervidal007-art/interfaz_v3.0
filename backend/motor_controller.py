import logging
import math
import os
import struct
import threading
import time
from typing import List, Optional

logger = logging.getLogger(__name__)

# I2C / motor constants (from TankDemo.py)
I2C_BUS = 1
MOTOR_ADDR = 0x34
MOTOR_TYPE_ADDR = 0x14
MOTOR_ENCODER_POLARITY_ADDR = 0x15
MOTOR_FIXED_PWM_ADDR = 0x1F
MOTOR_FIXED_SPEED_ADDR = 0x33
MOTOR_ENCODER_TOTAL_ADDR = 0x3C
ADC_BAT_ADDR = 0x00

MOTOR_TYPE_JGB37_520_12V_110RPM = 3
MOTOR_ENCODER_POLARITY = 0  # Default del driver (ver TankDemo.py:35)
CONTROL_MODE = os.getenv("MOTOR_CONTROL_MODE", "pwm").strip().lower()
FILTER_TIME_CONSTANT_S = float(os.getenv("MOTOR_FILTER_TAU_S", "0.18"))
RAMP_INTERVAL_S = 0.015
PWM_UI_REFERENCE = float(os.getenv("MOTOR_PWM_UI_REFERENCE", "50"))
PWM_STATIC_FRICTION_OFFSET = float(os.getenv("MOTOR_PWM_STATIC_OFFSET", "40"))
PWM_OUTPUT_LIMIT = float(os.getenv("MOTOR_PWM_LIMIT", "85"))

# Multiplicador por motor: 1 = normal, -1 = invertido.
# Cambiar el valor del motor que gire al revés.
MOTOR_POLARITY = [1, -1, -1, 1]  # M2 y M3 tienen encoder invertido

# Mecanum wheel speed vectors: [M1=FL, M2=RL, M3=FR, M4=RR]
# Orden y signos tomados de interfaz_v3.0/2/server.py (versión verificada en hardware).
DIRECTION_VECTORS = {
    'n':   [ 1,  1,  1,  1],   # Forward
    's':   [-1, -1, -1, -1],   # Backward
    'e':   [-1,  1,  1, -1],   # Strafe right
    'w':   [ 1, -1, -1,  1],   # Strafe left
    'ne':  [ 0,  1,  1,  0],   # Diagonal fwd-right
    'nw':  [ 1,  0,  0,  1],   # Diagonal fwd-left
    'se':  [-1,  0,  0, -1],   # Diagonal rev-right
    'sw':  [ 0, -1, -1,  0],   # Diagonal rev-left
    'cw':  [ 1, -1,  1, -1],   # Rotate clockwise
    'ccw': [-1,  1, -1,  1],   # Rotate counter-clockwise
}


def _clamp_int8(value: float) -> int:
    return max(-100, min(100, int(round(value))))


def _normalize_control_mode(mode: str) -> str:
    return "speed" if mode == "speed" else "pwm"


class MotorController:
    def __init__(self):
        self._bus = None
        self._control_mode = _normalize_control_mode(CONTROL_MODE)
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._worker = None
        self._target_speeds = [0, 0, 0, 0]
        self._current_speeds = [0.0, 0.0, 0.0, 0.0]
        self._last_written_speeds = None
        self._last_update_ts = time.monotonic()
        try:
            try:
                import smbus2 as smbus
            except ImportError:
                import smbus
            self._bus = smbus.SMBus(I2C_BUS)
            self._bus.write_byte_data(MOTOR_ADDR, MOTOR_TYPE_ADDR, MOTOR_TYPE_JGB37_520_12V_110RPM)
            time.sleep(0.5)
            self._bus.write_byte_data(MOTOR_ADDR, MOTOR_ENCODER_POLARITY_ADDR, MOTOR_ENCODER_POLARITY)
            logger.info(f"MotorController: I2C inicializado correctamente ({self._control_mode})")
        except Exception as e:
            self._bus = None
            logger.warning(f"MotorController: I2C no disponible, modo simulación ({e})")

        self._worker = threading.Thread(target=self._ramp_loop, daemon=True)
        self._worker.start()

    def _write_speeds(self, speeds: List[int]):
        normalized = [int(v) for v in speeds]
        if self._last_written_speeds == normalized:
            return
        self._last_written_speeds = normalized
        if self._bus is None:
            logger.debug(f"[SIM] velocidades motores: {normalized}")
            return
        try:
            register = MOTOR_FIXED_SPEED_ADDR if self._control_mode == "speed" else MOTOR_FIXED_PWM_ADDR
            self._bus.write_i2c_block_data(MOTOR_ADDR, register, normalized)
        except Exception as e:
            logger.error(f"MotorController: error I2C al escribir: {e}")

    def _set_target_speeds(self, speeds: List[int]):
        with self._lock:
            self._target_speeds = [int(v) for v in speeds]

    def _map_speed_command(self, speed: int) -> int:
        magnitude = abs(int(speed))
        if self._control_mode != "pwm" or magnitude == 0:
            return _clamp_int8(speed)

        reference = max(PWM_UI_REFERENCE, 1.0)
        usable_range = max(PWM_OUTPUT_LIMIT - PWM_STATIC_FRICTION_OFFSET, 0.0)
        scaled = PWM_STATIC_FRICTION_OFFSET + min(magnitude, reference) / reference * usable_range
        return _clamp_int8(math.copysign(scaled, speed))

    def _ramp_loop(self):
        while not self._stop_event.is_set():
            now = time.monotonic()
            dt = max(now - self._last_update_ts, RAMP_INTERVAL_S)
            self._last_update_ts = now
            alpha = 1.0 if FILTER_TIME_CONSTANT_S <= 0 else 1.0 - math.exp(-dt / FILTER_TIME_CONSTANT_S)

            with self._lock:
                target = self._target_speeds[:]
                current = self._current_speeds[:]
                for motor_index in range(len(current)):
                    delta = target[motor_index] - current[motor_index]
                    if delta == 0:
                        continue
                    current[motor_index] += delta * alpha
                    if abs(target[motor_index] - current[motor_index]) < 0.5:
                        current[motor_index] = float(target[motor_index])
                self._current_speeds = current
                write = [_clamp_int8(value) for value in current]

            self._write_speeds(write)
            self._stop_event.wait(RAMP_INTERVAL_S)

    def set_direction(self, direction: str, speed: int):
        vec = DIRECTION_VECTORS.get(direction)
        if vec is None:
            logger.warning(f"MotorController: dirección desconocida '{direction}'")
            return
        command = self._map_speed_command(speed)
        speeds = [_clamp_int8(v * command * p) for v, p in zip(vec, MOTOR_POLARITY)]
        self._set_target_speeds(speeds)

    def read_battery_mv(self) -> Optional[int]:
        """Lee el voltaje de batería. Retorna mV o None si I2C no está disponible."""
        if self._bus is None:
            logger.info("[SIM] lectura de batería no disponible en modo simulación")
            return None
        try:
            data = self._bus.read_i2c_block_data(MOTOR_ADDR, ADC_BAT_ADDR, 2)
            return data[0] + (data[1] << 8)
        except Exception as e:
            logger.error(f"MotorController: error leyendo batería: {e}")
            return None

    def read_encoder_counts(self) -> Optional[List[int]]:
        """Lee el contador acumulado de los 4 encoders y lo normaliza al eje lógico."""
        if self._bus is None:
            return None
        try:
            raw = self._bus.read_i2c_block_data(MOTOR_ADDR, MOTOR_ENCODER_TOTAL_ADDR, 16)
            counts = struct.unpack('<iiii', bytes(raw))
            return [count * polarity for count, polarity in zip(counts, MOTOR_POLARITY)]
        except Exception as e:
            logger.error(f"MotorController: error leyendo encoders: {e}")
            return None

    def stop(self):
        self._set_target_speeds([0, 0, 0, 0])

    def estop(self):
        with self._lock:
            self._target_speeds = [0, 0, 0, 0]
            self._current_speeds = [0, 0, 0, 0]
        self._write_speeds([0, 0, 0, 0])

    def close(self):
        self._stop_event.set()
        if self._worker is not None:
            self._worker.join(timeout=0.5)
            self._worker = None

        if self._bus is not None:
            try:
                self.estop()
                self._bus.close()
            except Exception:
                pass
            self._bus = None
