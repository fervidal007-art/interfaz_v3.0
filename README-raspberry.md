# Raspberry Pi deployment

## Que hace

- Revisa dependencias del frontend y backend.
- Instala solo cuando cambian `package.json`, `pnpm-lock.yaml` o `requirements.txt`.
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
./scripts/update_runtime.sh
./scripts/start_stack.sh
```

## Git pull normal

Despues de `git pull`, el hook corre:

- `./scripts/update_runtime.sh`
- `sudo systemctl restart robomesha.service`

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

## Healthcheck

```bash
curl http://127.0.0.1:8000/health
```
