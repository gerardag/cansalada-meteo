# Can Salada Meteo 🌤️

Sistema de monitorització meteorològica amb estació GW2000, backend Node.js i frontend Astro.

## 📋 Arquitectura

```
Estació GW2000 (local)
    ↓
Collector.js (Raspberry Pi)
    ↓
BBDD (Supabase)
    ↓
server.js (Nubulus)
    ↓
Frontend  (Vercel)
```

## 🗂️ Estructura del projecte

- **collector.js**: Recull dades de l'estació meteorològica local i les desa a Supabase
- **server.js**: API REST que exposa les dades desade

## 🚀 Desplegament

### 1️⃣ Collector (Raspberry Pi)

El collector s'ha d'executar en una **Raspberry Pi** dins de la **mateixa xarxa local** que l'estació GW2000.

#### Requisits

- Raspberry Pi (qualsevol model amb connectivitat de xarxa)
- Raspbian OS / Raspberry Pi OS
- Node.js 18+

#### Instal·lació a la Raspberry Pi

```bash
# 1. Connectar-se a la Raspberry Pi
ssh pi@ip-raspberry-pi

# 2. Instal·lar Node.js 18.x (o superior)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Verificar instal·lació
node -v
npm -v

# 4. Crear directori del projecte
mkdir -p ~/cansalada-meteo
cd ~/cansalada-meteo

# 5. Copiar fitxers del projecte
# Des del teu ordinador local:
# scp collector.js package.json .env pi@ip-raspberry-pi:~/cansalada-meteo/

# 6. Instal·lar dependències
npm install

# 7. Configurar variables d'entorn
nano .env
# Afegir SUPABASE_URL i SUPABASE_ANON_KEY

# 8. Instal·lar PM2 globalment
sudo npm install -g pm2

# 9. Iniciar collector
pm2 start collector.js --name "weather-collector"

# 10. Configurar inici automàtic al reiniciar la Raspberry Pi
pm2 startup
# Executar la comanda que et retorna PM2
pm2 save

# 11. Veure logs
pm2 logs weather-collector
```

#### Verificar que funciona

```bash
# Veure estat del procés
pm2 status

# Veure logs en temps real
pm2 logs weather-collector --lines 50

# Verificar connectivitat amb l'estació
ping 192.168.1.57
curl http://192.168.1.57/get_livedata_info
```

### 2️⃣ Server (Servidor Debian)

El servidor API es desplega en un servidor Debian amb accés públic.

#### Requisits

- Node.js 18+
- PM2
- Nginx (opcional, recomanat)

#### Instal·lació a Debian

```bash
# 1. Instal·lar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Instal·lar PM2
sudo npm install -g pm2

# 3. Crear directori del projecte
sudo mkdir -p /var/www/cansalada-meteo
cd /var/www/cansalada-meteo

# 4. Clonar o copiar fitxers del projecte
# git clone el-teu-repo.git .
# O amb scp:
# scp -r server.js package.json .env usuari@servidor:/var/www/cansalada-meteo/

# 5. Instal·lar dependències
npm install

# 6. Configurar variables d'entorn
nano .env
```

Contingut del fitxer `.env`:
```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

```bash
# 7. Iniciar servidor amb PM2
pm2 start server.js --name "weather-api"

# 8. Configurar inici automàtic
pm2 startup systemd
pm2 save

# 9. Veure estat i logs
pm2 status
pm2 logs weather-api
```

#### Configurar Nginx (Recomanat)

```bash
# Instal·lar Nginx
sudo apt install nginx

# Crear configuració
sudo nano /etc/nginx/sites-available/weather-api
```

Contingut del fitxer:
```nginx
server {
    listen 80;
    server_name meteo-api.cnsld.cc;

    # Logs personalitzats per a l'API
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

        # Log específic per a proxying
        proxy_set_header X-Request-ID $request_id;
    }
}
```

```bash
# Activar configuració
sudo ln -s /etc/nginx/sites-available/weather-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3️⃣ Frontend Astro (Netlify)

#### Configurar a Netlify

1. Connecta el teu repositori del frontend
2. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. A **Domain settings** → Afegir custom domain: `meteo.cnsld.cc`

### 4️⃣ Configurar Cloudflare

#### DNS Records

Afegeix aquests registres a Cloudflare:

```
Tipus   Nom     Contingut                      Proxy
CNAME   meteo   cansalada-meteo.netlify.app    ✅ Proxied
A       api     85.117.241.102                 ❌ Proxied
```

## 🔌 Endpoints de l'API

### `GET /api/current`
Obté l'últim registre meteorològic.

**Resposta:**
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
Estadístiques del dia actual (màxims i mínims).

**Resposta:**
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
Històric de les últimes 24 hores.

**Resposta:**
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

## 🛠️ Comandes útils

### PM2

```bash
# Veure estat de tots els processos
pm2 status

# Veure logs en temps real
pm2 logs weather-api
pm2 logs weather-collector

# Reiniciar procés
pm2 restart weather-api
pm2 restart weather-collector

# Aturar procés
pm2 stop weather-api

# Monitor de recursos
pm2 monit

# Eliminar procés
pm2 delete weather-api
```

### Nginx

```bash
# Verificar configuració
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Veure logs de l'API en temps real
sudo tail -f /var/log/nginx/weather-api-access.log
sudo tail -f /var/log/nginx/weather-api-error.log

# Veure logs generals de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Veure les últimes 100 línies
sudo tail -n 100 /var/log/nginx/weather-api-access.log

# Buscar errors específics
sudo grep "error" /var/log/nginx/weather-api-error.log

# Veure logs filtrats per codi d'estat (ex: 500, 404)
sudo grep " 500 " /var/log/nginx/weather-api-access.log
sudo grep " 404 " /var/log/nginx/weather-api-access.log

# Analitzar peticions més freqüents
sudo awk '{print $7}' /var/log/nginx/weather-api-access.log | sort | uniq -c | sort -rn | head -10

# Rotar logs manualment (si cal)
sudo logrotate -f /etc/logrotate.d/nginx
```

## 🔐 Variables d'entorn

Crea un fitxer `.env` a l'arrel del projecte:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## 📊 Base de dades (Supabase)

La taula `weather` desa totes les dades meteorològiques:

- `temperature`: Temperatura (°C)
- `humidity`: Humitat relativa (%)
- `dew_point`: Punt de rosada (°C)
- `wind_speed`: Velocitat del vent (km/h)
- `wind_gust`: Ràfega de vent (km/h)
- `wind_gust_max`: Ràfega màxima (km/h)
- `wind_direction`: Direcció del vent (°)
- `solar_radiation`: Radiació solar (W/m²)
- `uv_index`: Índex UV
- `rain_event`: Pluja per esdeveniment (mm)
- `rain_rate`: Intensitat de pluja (mm/h)
- `rain_daily`: Pluja diària (mm)
- `rain_weekly`: Pluja setmanal (mm)
- `rain_monthly`: Pluja mensual (mm)
- `rain_total`: Pluja total (mm)
- `created_at`: Timestamp (auto)

## 🔄 Flux de dades

1. **Collector** consulta l'estació GW2000 cada 60 segons
2. **Collector** processa i desa les dades a Supabase
3. **Server** exposa les dades mitjançant una API REST
4. **Frontend** consumeix l'API i mostra les dades a l'usuari

#### Recuperar l'esquema de la BBDD

1. Ves al **Dashboard de Supabase**
2. **Table Editor** → Selecciona la taula `weather`
3. Fes clic a **⋮** (tres punts) → **Copy SQL**
4. Això et donarà el `CREATE TABLE` statement

### Esquema actual (referència)

El fitxer [schema.sql](schema.sql) del projecte conté l'esquema de la taula `weather`.

## �🐛 Troubleshooting

### El collector no pot connectar amb l'estació

```bash
# Connectar-se a la Raspberry Pi
ssh pi@ip-raspberry-pi

# Verificar que l'estació és accessible des de la Raspberry Pi
ping 192.168.1.57

# Provar endpoint manualment
curl http://192.168.1.57/get_livedata_info

# Verificar que el collector està executant-se
pm2 status
pm2 logs weather-collector
```

### El server no respon

```bash
# Verificar que el procés està executant-se
pm2 status

# Veure logs d'errors
pm2 logs weather-api --err

# Reiniciar el procés
pm2 restart weather-api

# Verificar que el port 3000 està escoltant
sudo netstat -tulpn | grep 3000
```

### Errors de CORS al frontend

Assegura't que el domini del frontend està afegit a `server.js`:

```javascript
fastify.register(require('@fastify/cors'), {
	origin: [
		'http://localhost:4321',
		'https://meteo.cnsld.cc',
	],
	credentials: true
});
```

## 📝 Llicència

ISC
