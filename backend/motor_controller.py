import logging

logger = logging.getLogger(__name__)

# I2C / motor constants (from TankDemo.py)
I2C_BUS = 1
MOTOR_ADDR = 0x34
MOTOR_TYPE_ADDR = 0x14
MOTOR_ENCODER_POLARITY_ADDR = 0x15
MOTOR_FIXED_SPEED_ADDR = 0x33
ADC_BAT_ADDR = 0x00

MOTOR_TYPE_JGB37_520_12V_110RPM = 3
MOTOR_ENCODER_POLARITY = 0

# Mecanum wheel speed vectors: [FL, RL, FR, RR]
# Multiply each element by `speed` to get the per-motor target.
# If a motor turns the wrong way, negate its column here OR change
# MOTOR_ENCODER_POLARITY above (0 or 1).
DIRECTION_VECTORS = {
    'n':   [ 1,  1,  1,  1],   # Forward
    's':   [-1, -1, -1, -1],   # Backward
    'e':   [ 1, -1, -1,  1],   # Strafe right
    'w':   [-1,  1,  1, -1],   # Strafe left
    'ne':  [ 1,  0,  0,  1],   # Diagonal fwd-right
    'nw':  [ 0,  1,  1,  0],   # Diagonal fwd-left
    'se':  [ 0, -1, -1,  0],   # Diagonal rev-right
    'sw':  [-1,  0,  0, -1],   # Diagonal rev-left
    'cw':  [ 1, -1,  1, -1],   # Rotate clockwise
    'ccw': [-1,  1, -1,  1],   # Rotate counter-clockwise
}


def _clamp_int8(value: float) -> int:
    return max(-100, min(100, int(round(value))))


class MotorController:
    def __init__(self):
        self._bus = None
        try:
            import smbus
            import time
            self._bus = smbus.SMBus(I2C_BUS)
            self._bus.write_byte_data(MOTOR_ADDR, MOTOR_TYPE_ADDR, MOTOR_TYPE_JGB37_520_12V_110RPM)
            time.sleep(0.5)
            self._bus.write_byte_data(MOTOR_ADDR, MOTOR_ENCODER_POLARITY_ADDR, MOTOR_ENCODER_POLARITY)
            logger.info("MotorController: I2C inicializado correctamente")
        except Exception as e:
            self._bus = None
            logger.warning(f"MotorController: I2C no disponible, modo simulación ({e})")

    def _write_speeds(self, speeds: list[int]):
        if self._bus is None:
            logger.info(f"[SIM] velocidades motores: {speeds}")
            return
        try:
            self._bus.write_i2c_block_data(MOTOR_ADDR, MOTOR_FIXED_SPEED_ADDR, speeds)
        except Exception as e:
            logger.error(f"MotorController: error I2C al escribir: {e}")

    def set_direction(self, direction: str, speed: int):
        vec = DIRECTION_VECTORS.get(direction)
        if vec is None:
            logger.warning(f"MotorController: dirección desconocida '{direction}'")
            return
        speeds = [_clamp_int8(v * speed) for v in vec]
        self._write_speeds(speeds)

    def read_battery_mv(self) -> int | None:
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

    def stop(self):
        self._write_speeds([0, 0, 0, 0])

    def estop(self):
        self.stop()

    def close(self):
        if self._bus is not None:
            try:
                self.stop()
                self._bus.close()
            except Exception:
                pass
            self._bus = None
