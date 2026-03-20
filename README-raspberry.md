# Raspberry Pi deployment

## Que hace

- Revisa dependencias del frontend y backend.
- Instala solo cuando cambian `package.json`, `pnpm-lock.yaml` o `requirements.txt`.
- Reconstruye el frontend en modo `build`.
- Arranca FastAPI sirviendo tambien el frontend compilado.
- Instala hooks para que despues de `git pull` se ejecute el refresh automaticamente.
- Instala un servicio `systemd` para que todo arranque con la Raspberry Pi.

## Uso manual

```bash
./scripts/update_runtime.sh
./scripts/start_stack.sh
```

La app quedara disponible en `http://<ip-de-la-raspberry>:8000`.

## Instalar como servicio

```bash
chmod +x scripts/*.sh
sudo ./scripts/install_service.sh
sudo systemctl start robomesha.service
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
