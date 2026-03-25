import logging
import time

logger = logging.getLogger(__name__)

# I2C / motor constants (from TankDemo.py)
I2C_BUS = 0
MOTOR_ADDR = 0x34
MOTOR_TYPE_ADDR = 0x14
MOTOR_ENCODER_POLARITY_ADDR = 0x15
MOTOR_FIXED_SPEED_ADDR = 0x33
ADC_BAT_ADDR = 0x00

MOTOR_TYPE_JGB37_520_12V_110RPM = 3
MOTOR_ENCODER_POLARITY = 0  # Default del driver (ver TankDemo.py:35)

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

# Intervalo mínimo entre escrituras I2C (segundos).
# El STM32 corre PID cada 10ms; escribir más rápido no tiene efecto útil
# y satura el bus del RP1 causando errno 121.
MIN_WRITE_INTERVAL = 0.015

I2C_INIT_RETRIES = 5
I2C_INIT_DELAY = 0.5

def _clamp_int8(value: float) -> int:
    return max(-100, min(100, int(round(value))))


class MotorController:
    def __init__(self):
        self._bus = None
        self._smbus_mod = None
        self._last_speeds: list[int] = [0, 0, 0, 0]
        self._last_write_t: float = 0.0
        self._consecutive_errors: int = 0
        try:
            try:
                import smbus2 as smbus
            except ImportError:
                import smbus
            self._smbus_mod = smbus
            self._bus = smbus.SMBus(I2C_BUS)
            self._i2c_init_with_retry()
            logger.info("MotorController: I2C inicializado correctamente")
        except Exception as e:
            self._bus = None
            logger.warning(f"MotorController: I2C no disponible, modo simulación ({e})")

    def _i2c_init_with_retry(self):
        last_err = None
        for attempt in range(I2C_INIT_RETRIES):
            try:
                self._bus.write_byte_data(MOTOR_ADDR, MOTOR_TYPE_ADDR, MOTOR_TYPE_JGB37_520_12V_110RPM)
                time.sleep(0.1)
                self._bus.write_byte_data(MOTOR_ADDR, MOTOR_ENCODER_POLARITY_ADDR, MOTOR_ENCODER_POLARITY)
                return
            except OSError as e:
                last_err = e
                logger.info(f"MotorController: init intento {attempt + 1}/{I2C_INIT_RETRIES} falló ({e})")
                time.sleep(I2C_INIT_DELAY)
        raise last_err

    def _reset_bus(self):
        """Cierra y reabre el fd de I2C para resetear el controlador del RP1."""
        if self._bus is None or self._smbus_mod is None:
            return False
        try:
            self._bus.close()
        except Exception:
            pass
        try:
            time.sleep(0.05)
            self._bus = self._smbus_mod.SMBus(I2C_BUS)
            logger.info("MotorController: bus I2C reseteado")
            return True
        except Exception as e:
            logger.error(f"MotorController: no se pudo reabrir el bus I2C ({e})")
            self._bus = None
            return False

    def _write_speeds(self, speeds: list[int]):
        if speeds == self._last_speeds:
            return
        if self._bus is None:
            self._last_speeds = list(speeds)
            logger.info(f"[SIM] velocidades motores: {speeds}")
            return

        # Respetar intervalo mínimo entre escrituras para no saturar el bus.
        now = time.monotonic()
        wait = MIN_WRITE_INTERVAL - (now - self._last_write_t)
        if wait > 0:
            time.sleep(wait)

        for attempt in range(3):
            try:
                self._bus.write_i2c_block_data(MOTOR_ADDR, MOTOR_FIXED_SPEED_ADDR, speeds)
                self._last_write_t = time.monotonic()
                self._last_speeds = list(speeds)
                self._consecutive_errors = 0
                return
            except OSError as e:
                if e.errno != 121:
                    logger.error(f"MotorController: error I2C inesperado: {e}")
                    return
                self._consecutive_errors += 1
                if self._consecutive_errors >= 3 and attempt < 2:
                    # Bus del RP1 probablemente colgado — resetear fd
                    if not self._reset_bus():
                        return
                    time.sleep(0.05)
                else:
                    time.sleep(0.015)

        logger.error(f"MotorController: error I2C persistente ({self._consecutive_errors} consecutivos)")

    def set_direction(self, direction: str, speed: int):
        vec = DIRECTION_VECTORS.get(direction)
        if vec is None:
            logger.warning(f"MotorController: dirección desconocida '{direction}'")
            return
        speeds = [_clamp_int8(v * speed * p) for v, p in zip(vec, MOTOR_POLARITY)]
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
                self._last_speeds = [1, 1, 1, 1]  # fuerza la escritura del stop
                self.stop()
                self._bus.close()
            except Exception:
                pass
            self._bus = None
