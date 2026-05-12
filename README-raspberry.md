# Raspberry Pi deployment

## Configurar punto de acceso Wi-Fi (AP)

Este comando crea y levanta un AP, es decir, un punto de acceso Wi-Fi desde la Raspberry Pi. Sirve para que otros equipos puedan conectarse directamente a la red `RoboMeshA` generada por la Raspberry usando la interfaz `wlan0`.

```bash
sudo nmcli con add \
  type wifi \
  ifname wlan0 \
  con-name RoboMeshA \
  autoconnect yes \
  ssid RoboMeshA \
  802-11-wireless.mode ap \
  802-11-wireless.band bg \
  ipv4.method shared \
  wifi-sec.key-mgmt wpa-psk \
  wifi-sec.psk 123456789

sudo nmcli con up RoboMeshA
```

Parametros principales:

- `type wifi`: crea una conexion Wi-Fi.
- `ifname wlan0`: usa la interfaz inalambrica de la Raspberry Pi.
- `con-name RoboMeshA`: guarda la conexion con el nombre `RoboMeshA`.
- `autoconnect yes`: permite que el AP se active automaticamente al iniciar.
- `ssid RoboMeshA`: nombre de la red Wi-Fi que veran los clientes.
- `802-11-wireless.mode ap`: configura la Raspberry como punto de acceso.
- `802-11-wireless.band bg`: usa la banda de 2.4 GHz.
- `ipv4.method shared`: comparte red y asigna IP a los clientes conectados.
- `wifi-sec.key-mgmt wpa-psk`: activa seguridad WPA con clave compartida.
- `wifi-sec.psk 123456789`: define la contrasena de la red.
- `sudo nmcli con up RoboMeshA`: levanta la red inmediatamente.

## Que hace

- Revisa dependencias del frontend y backend.
- Instala solo cuando cambian `package.json`, `pnpm-lock.yaml` o `requirements.txt`.
- Usa `corepack pnpm@9.15.9` para evitar depender del `pnpm` global del sistema.
- Reconstruye el frontend en modo `build`.
- Arranca FastAPI sirviendo tambien el frontend compilado.
- Instala hooks para que despues de `git pull` se ejecute el refresh automaticamente y se reinicie el servicio.
- Instala un servicio `systemd` para que todo arranque con la Raspberry Pi sin reconstruir en cada boot.

## Setup una vez

```bash
cd ~/interfaz_v3.0
sudo ./scripts/install_service.sh
```

Ese comando:

- corrige permisos para tu usuario
- instala o actualiza dependencias
- genera el `build`
- instala y habilita `robomesha.service`
- arranca el servicio en ese momento
- valida `http://127.0.0.1:8000/health`

La app quedara disponible en `http://<ip-de-la-raspberry>:8000`.

## Uso manual

```bash
sudo ./scripts/install_service.sh
./scripts/start_stack.sh
```

## Git pull normal

Despues de `git pull`, el hook corre:

- `sudo ./scripts/install_service.sh`

Si tu sistema no tiene `sudo` sin password para ese comando, puede pedirte contraseña durante el `git pull`.

## Verificar servicio

```bash
systemctl is-enabled robomesha.service
systemctl is-active robomesha.service
curl http://127.0.0.1:8000/health
```

## Desinstalar el servicio

```bash
sudo ./scripts/uninstall_service.sh
```

## Logs

```bash
journalctl -u robomesha.service -f
```
