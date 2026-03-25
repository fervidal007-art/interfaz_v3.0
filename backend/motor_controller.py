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
MOTOR_POLARITY = [1, -1, -1, 1]  # M2 y M3 tienen encoder invertido

# Mecanum wheel speed vectors: [M1=FL, M2=RL, M3=FR, M4=RR]
DIRECTION_VECTORS = {
    'n':   [ 1,  1,  1,  1],
    's':   [-1, -1, -1, -1],
    'e':   [-1,  1,  1, -1],
    'w':   [ 1, -1, -1,  1],
    'ne':  [ 1,  0,  0,  1],
    'nw':  [ 0,  1,  1,  0],
    'se':  [ 0, -1, -1,  0],
    'sw':  [ -1, 0,  0, -1],
    'cw':  [ 1,  1, -1, -1],
    'ccw': [-1, -1,  1,  1],
}

# Intervalo mínimo entre escrituras I2C.
# El STM32 corre PID cada 10ms; esto da margen para que no esté en su ISR.
MIN_WRITE_INTERVAL = 0.030

# Backoff progresivo cuando el STM32 NACKs.
# El HAL STM32 tiene un timeout interno de ~25ms; esperar 200ms al tercer
# intento da tiempo suficiente para que suelte el bus automáticamente.
_RETRY_DELAYS = [0.025, 0.100, 0.300]

I2C_INIT_RETRIES = 5
I2C_INIT_DELAY = 0.5


def _clamp_int8(value: float) -> int:
    return max(-100, min(100, int(round(value))))


def _to_bytes(speeds: list[int]) -> list[int]:
    """Convierte velocidades signed a unsigned para el bus I2C."""
    return [v & 0xFF for v in speeds]


class MotorController:
    def __init__(self):
        self._bus = None
        self._last_speeds: list[int] = [0, 0, 0, 0]
        self._last_write_t: float = 0.0
        try:
            try:
                import smbus2 as smbus
            except ImportError:
                import smbus
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

    def _write_speeds(self, speeds: list[int]):
        if speeds == self._last_speeds:
            return
        if self._bus is None:
            self._last_speeds = list(speeds)
            logger.info(f"[SIM] velocidades motores: {speeds}")
            return

        # Respetar intervalo mínimo para no pillar al STM32 en su ISR de PID.
        elapsed = time.monotonic() - self._last_write_t
        if elapsed < MIN_WRITE_INTERVAL:
            time.sleep(MIN_WRITE_INTERVAL - elapsed)

        data = _to_bytes(speeds)
        for attempt, delay in enumerate(_RETRY_DELAYS):
            try:
                self._bus.write_i2c_block_data(MOTOR_ADDR, MOTOR_FIXED_SPEED_ADDR, data)
                self._last_write_t = time.monotonic()
                self._last_speeds = list(speeds)
                return
            except OSError as e:
                if e.errno != 121:
                    logger.error(f"MotorController: error I2C ({e})")
                    return
                if attempt < len(_RETRY_DELAYS) - 1:
                    # El STM32 puede estar en su ISR o con el bus bloqueado.
                    # Esperar con backoff progresivo para que haga timeout interno.
                    time.sleep(delay)

        logger.error("MotorController: error I2C persistente — comando descartado")

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
