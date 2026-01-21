# Cansalada Meteo 🌤️

Sistema de monitorización meteorológica con estación GW2000, backend Node.js y frontend Astro.

## 📋 Arquitectura

```
Estación GW2000 (192.168.1.57)
        ↓
   collector.js (Raspberry Pi) ───→ Supabase
                                        ↓
                                  server.js (Debian)
                                        ↓
                            Frontend Astro (Netlify)
```

## 🗂️ Estructura del proyecto

- **collector.js**: Recoge datos de la estación meteorológica local y los almacena en Supabase
- **server.js**: API REST que expone los datos almacenados
- **schema.sql**: Esquema de la base de datos

## 🚀 Despliegue

### 1️⃣ Collector (Raspberry Pi)

El collector debe ejecutarse en una **Raspberry Pi** dentro de la **misma red local** que la estación GW2000.

#### Requisitos

- Raspberry Pi (cualquier modelo con conectividad de red)
- Raspbian OS / Raspberry Pi OS
- Node.js 18+

#### Instalación en Raspberry Pi

```bash
# 1. Conectarse a la Raspberry Pi
ssh pi@raspberry-pi-ip

# 2. Instalar Node.js 18.x (o superior)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Verificar instalación
node -v
npm -v

# 4. Crear directorio del proyecto
mkdir -p ~/cansalada-meteo
cd ~/cansalada-meteo

# 5. Copiar archivos del proyecto
# Desde tu ordenador local:
# scp collector.js package.json .env pi@raspberry-pi-ip:~/cansalada-meteo/

# 6. Instalar dependencias
npm install

# 7. Configurar variables de entorno
nano .env
# Añadir SUPABASE_URL y SUPABASE_ANON_KEY

# 8. Instalar PM2 globalmente
sudo npm install -g pm2

# 9. Iniciar collector
pm2 start collector.js --name "weather-collector"

# 10. Configurar inicio automático al reiniciar la Raspberry Pi
pm2 startup
# Ejecutar el comando que te devuelve PM2
pm2 save

# 11. Ver logs
pm2 logs weather-collector
```

#### Verificar que funciona

```bash
# Ver estado del proceso
pm2 status

# Ver logs en tiempo real
pm2 logs weather-collector --lines 50

# Verificar conectividad con la estación
ping 192.168.1.57
curl http://192.168.1.57/get_livedata_info
```

### 2️⃣ Server (Servidor Debian)

El servidor API se despliega en un servidor Debian con acceso público.

#### Requisitos

- Node.js 18+
- PM2
- Nginx (opcional, recomendado)

#### Instalación en Debian

```bash
# 1. Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Instalar PM2
sudo npm install -g pm2

# 3. Crear directorio del proyecto
sudo mkdir -p /var/www/cansalada-meteo
cd /var/www/cansalada-meteo

# 4. Clonar o copiar archivos del proyecto
# git clone tu-repo.git .
# O usando scp:
# scp -r server.js package.json .env usuario@servidor:/var/www/cansalada-meteo/

# 5. Instalar dependencias
npm install

# 6. Configurar variables de entorno
nano .env
```

Contenido del archivo `.env`:
```env
SUPABASE_URL=https://kyfvyncdpnfzymmcxdbp.supabase.co
SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

```bash
# 7. Iniciar servidor con PM2
pm2 start server.js --name "weather-api"

# 8. Configurar inicio automático
pm2 startup systemd
pm2 save

# 9. Ver estado y logs
pm2 status
pm2 logs weather-api
```

#### Configurar Nginx (Recomendado)

```bash
# Instalar Nginx
sudo apt install nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/weather-api
```

Contenido del archivo:
```nginx
server {
    listen 80;
    server_name meteo-api.cnsld.cc;

    # Logs personalizados para el API
    access_log /var/log/nginx/weather-api-access.log;
    error_log /var/log/nginx/weather-api-error.log;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Log específico para proxying
        proxy_set_header X-Request-ID $request_id;
    }
}
```

```bash
# Activar configuración
sudo ln -s /etc/nginx/sites-available/weather-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3️⃣ Frontend Astro (Netlify)

#### Configurar en Netlify

1. Conecta tu repositorio del frontend
2. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. En **Domain settings** → Añadir custom domain: `meteo.cnsld.cc`

### 4️⃣ Configurar Cloudflare

#### DNS Records

Añade estos registros en Cloudflare:

```
Tipo   Nombre  Contenido                      Proxy
CNAME  meteo   cansalada-meteo.netlify.app    ✅ Proxied
A      api     85.117.241.102                 ❌ Proxied
```

## 🔌 Endpoints de la API

### `GET /api/current`
Obtiene el último registro meteorológico.

**Respuesta:**
```json
{
  "data": {
    "temperature": 18.5,
    "humidity": 65,
    "wind_speed": 5.2,
    "rain_daily": 0,
    ...
  }
}
```

### `GET /api/daily-stats`
Estadísticas del día actual (máximos y mínimos).

**Respuesta:**
```json
{
  "data": {
    "temp_max": 22.3,
    "temp_min": 14.1,
    "humidity_max": 85,
    "humidity_min": 45,
    "records_count": 240
  }
}
```

### `GET /api/history`
Histórico de las últimas 24 horas.

**Respuesta:**
```json
{
  "data": [
    {
      "temperature": 18.5,
      "humidity": 65,
      "created_at": "2026-01-20T10:30:00Z",
      ...
    },
    ...
  ]
}
```

## 🛠️ Comandos útiles

### PM2

```bash
# Ver estado de todos los procesos
pm2 status

# Ver logs en tiempo real
pm2 logs weather-api
pm2 logs weather-collector

# Reiniciar proceso
pm2 restart weather-api
pm2 restart weather-collector

# Detener proceso
pm2 stop weather-api

# Monitor de recursos
pm2 monit

# Eliminar proceso
pm2 delete weather-api
```

### Nginx

```bash
# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs del API en tiempo real
sudo tail -f /var/log/nginx/weather-api-access.log
sudo tail -f /var/log/nginx/weather-api-error.log

# Ver logs generales de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Ver últimas 100 líneas
sudo tail -n 100 /var/log/nginx/weather-api-access.log

# Buscar errores específicos
sudo grep "error" /var/log/nginx/weather-api-error.log

# Ver logs con filtro por código de estado (ej: 500, 404)
sudo grep " 500 " /var/log/nginx/weather-api-access.log
sudo grep " 404 " /var/log/nginx/weather-api-access.log

# Analizar peticiones más frecuentes
sudo awk '{print $7}' /var/log/nginx/weather-api-access.log | sort | uniq -c | sort -rn | head -10

# Rotar logs manualmente (si es necesario)
sudo logrotate -f /etc/logrotate.d/nginx
```

## 🔐 Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
SUPABASE_URL=https://kyfvyncdpnfzymmcxdbp.supabase.co
SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

## 📊 Base de datos (Supabase)

La tabla `weather` almacena todos los datos meteorológicos:

- `temperature`: Temperatura (°C)
- `humidity`: Humedad relativa (%)
- `dew_point`: Punto de rocío (°C)
- `wind_speed`: Velocidad del viento (km/h)
- `w� Configuración avanzada de Logs

### Logs de Nginx

Los logs de Nginx se configuran automáticamente con la configuración anterior. Los archivos se encuentran en:

- **Access log**: `/var/log/nginx/weather-api-access.log` - Todas las peticiones HTTP
- **Error log**: `/var/log/nginx/weather-api-error.log` - Errores de Nginx y proxy

#### Formato de logs personalizado (opcional)

Para un formato más detallado, puedes añadir en `/etc/nginx/nginx.conf` dentro del bloque `http`:

```nginx
log_format weather_detailed '$remote_addr - $remote_user [$time_local] '
                           '"$request" $status $body_bytes_sent '
                           '"$http_referer" "$http_user_agent" '
                           'rt=$request_time uct="$upstream_connect_time" '
                           'uht="$upstream_header_time" urt="$upstream_response_time"';
```

Y luego en tu configuración del server:

```nginx
access_log /var/log/nginx/weather-api-access.log weather_detailed;
```

#### Rotación automática de logs

Nginx incluye rotación de logs por defecto. Verifica la configuración en:

```bash
cat /etc/logrotate.d/nginx
```

Contenido típico:
```
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

#### Monitorización en tiempo real

Para ver todas las peticiones en tiempo real con colores:

```bash
# Instalar goaccess (opcional, herramienta de análisis)
sudo apt install goaccess

# Análisis en tiempo real
sudo goaccess /var/log/nginx/weather-api-access.log --log-format=COMBINED
```

#### Permisos de logs

Si tienes problemas de permisos para leer los logs:

```bash
# Añadir tu usuario al grupo adm
sudo usermod -aG adm $USER

# Cerrar sesión y volver a entrar, o ejecutar:
newgrp adm
```

## �ind_gust`: Ráfaga de viento (km/h)
- `wind_gust_max`: Ráfaga máxima (km/h)
- `wind_direction`: Dirección del viento (°)
- `solar_radiation`: Radiación solar (W/m²)
- `uv_index`: Índice UV
- `rain_event`: Lluvia por evento (mm)
- `rain_rate`: Intensidad de lluvia (mm/h)
- `rain_daily`: Lluvia diaria (mm)
- `rain_weekly`: Lluvia semanal (mm)
- `rain_monthly`: Lluvia mensual (mm)
- `rain_total`: Lluvia total (mm)
- `created_at`: Timestamp (auto)

## 🔄 Flujo de datos

1. **Collector** consulta la estación GW2000 cada 60 segundos
2. **Collector** procesa y almacena los datos en Supabase
3. **Server** expone los datos mediante una API REST
4. **Frontend** consume la API y muestra los datos al usuario

## 🐛 Troubleshooting

### El collector no puede conectar con la estación

```bash
# Conectarse a la Raspberry Pi
ssh pi@raspberry-pi-ip

# Verificar que la estación es accesible desde la Raspberry Pi
ping 192.168.1.57

# Probar endpoint manualmente
curl http://192.168.1.57/get_livedata_info

# Verificar que el collector está ejecutándose
pm2 status
pm2 logs weather-collector
```

### El server no responde

```bash
# Verificar que el proceso está ejecutándose
pm2 status

# Ver logs de errores
pm2 logs weather-api --err

# Reiniciar el proceso
pm2 restart weather-api

# Verificar que el puerto 3000 está escuchando
sudo netstat -tulpn | grep 3000
```

### CORS errors en el frontend

Asegúrate de que el dominio del frontend está añadido en `server.js`:

```javascript
fastify.register(require('@fastify/cors'), {
	origin: [
		'http://localhost:4321',
		'https://meteo.cnsld.cc',
	],
	credentials: true
});
```

## 📝 Licencia

ISC
