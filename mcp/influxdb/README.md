# 📊 Servidor MCP InfluxDB

> Servidor MCP (Model Context Protocol) para conectar Claude Code y VSCode con InfluxDB 1.8 mediante Docker.

<div align="center">

![InfluxDB](https://img.shields.io/badge/InfluxDB-1.8-blue)
![Docker](https://img.shields.io/badge/Docker-Required-2496ED)
![MCP](https://img.shields.io/badge/MCP-Protocol-purple)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## 🚀 Quick Start

### 1️⃣ Build de la imagen Docker

```bash
cd /ruta/a/mcp/influxdb
docker build -t mcp-influxdb:latest .
```

### 2️⃣ Configuración

Elige tu cliente MCP preferido:

<details open>
<summary><b>📟 Claude Code</b></summary>

Agrega a tu `~/.claude.json`:

```json
{
  "mcpServers": {
    "influxdb": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init", "--network", "host",
        "-e", "INFLUX_HOST=localhost",
        "-e", "INFLUX_PORT=8086",
        "-e", "LOG_LEVEL=info",
        "mcp-influxdb:latest"
      ]
    }
  }
}
```

> **Nota:** `--network host` es necesario solo cuando InfluxDB está en `localhost`. Para servidores remotos (IPs o hostnames), no lo incluyas.

</details>

<details>
<summary><b>💻 VSCode (Claude Dev Extension)</b></summary>

Agrega a tu `mcp.json` (usualmente en `~/.config/Code/User/mcp.json` o `%APPDATA%\Code\User\mcp.json` en Windows):

```json
{
  "servers": {
    "influxdb": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init", "--network", "host",
        "-e", "INFLUX_HOST=localhost",
        "-e", "INFLUX_PORT=8086",
        "-e", "LOG_LEVEL=info",
        "mcp-influxdb:latest"
      ],
      "type": "stdio"
    }
  }
}
```

> **Nota:** `--network host` es necesario solo cuando InfluxDB está en `localhost`. Para servidores remotos (IPs o hostnames), no lo incluyas.

**Diferencias con Claude Code:**
- Añade el campo `"type": "stdio"` para especificar el protocolo de comunicación
- Usa la estructura `"servers"` en lugar de `"mcpServers"`
- `stdio` = comunicación mediante Standard Input/Output (el método más común para servidores locales)

</details>

### 3️⃣ Reiniciar y verificar

- **Claude Code**: Reinicia Claude Code y verifica que "influxdb" aparezca conectado
- **VSCode**: Recarga VSCode (Ctrl+Shift+P → "Reload Window")

Deberías ver **10 herramientas disponibles** ✨

---

## 🔄 Trabajar con múltiples servidores

En lugar de editar la configuración cada vez que cambias de entorno, puedes configurar **múltiples servidores** y activar/desactivar según necesites.

### 🌐 Importante: ¿Cuándo usar `--network host`?

> **⚠️ Regla de oro:** Solo usa `--network host` cuando InfluxDB está en **localhost**

| Escenario | `--network host` | Razón |
|-----------|------------------|-------|
| InfluxDB en `localhost` o `127.0.0.1` | ✅ **SÍ necesario** | El contenedor Docker necesita acceder a la red del host para conectarse a localhost |
| InfluxDB en IP remota (ej. `10.142.150.64`) | ❌ **NO necesario** | Docker puede acceder a IPs externas por defecto |
| InfluxDB en hostname remoto (ej. `influx.ejemplo.com`) | ❌ **NO necesario** | Docker puede resolver DNS y acceder a hosts remotos |

**Ejemplo correcto:**
```bash
# ✅ Local - CON --network host
INFLUX_HOST=localhost    → --network host ✓

# ❌ Remoto - SIN --network host
INFLUX_HOST=10.142.150.64  → --network host ✗
INFLUX_HOST=influx.example.com → --network host ✗
```

### 📝 Configuración recomendada

Configura 3 servidores con diferentes propósitos:

| Servidor | Propósito | Cuándo usar |
|----------|-----------|-------------|
| `influxdb-local` | 🏠 Desarrollo local | Testing local, sin autenticación |
| `influxdb-prod` | 🚀 Producción | Datos reales, con credenciales |
| `influxdb-dev` | 🔧 Staging/Dev | Servidor de desarrollo remoto |

<details>
<summary><b>📟 Ejemplo para Claude Code (~/.claude.json)</b></summary>

```json
{
  "mcpServers": {
    "influxdb-local": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init",
        "--network", "host",
        "-e", "INFLUX_HOST=localhost",
        "-e", "INFLUX_PORT=8086",
        "-e", "LOG_LEVEL=info",
        "mcp-influxdb:latest"
      ]
    },
    "influxdb-prod": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init",
        "-e", "INFLUX_HOST=10.142.150.64",
        "-e", "INFLUX_PORT=8087",
        "-e", "INFLUX_USERNAME=admin",
        "-e", "INFLUX_PASSWORD=secret",
        "-e", "ALLOWED_DATABASES=production,metrics",
        "-e", "LOG_LEVEL=warn",
        "mcp-influxdb:latest"
      ]
    },
    "influxdb-dev": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init",
        "-e", "INFLUX_HOST=dev.example.com",
        "-e", "INFLUX_PORT=8086",
        "-e", "LOG_LEVEL=debug",
        "mcp-influxdb:latest"
      ]
    }
  }
}
```

**Nota:** Observa que solo `influxdb-local` usa `--network host` porque se conecta a `localhost`. Los servidores remotos (`influxdb-prod` e `influxdb-dev`) **NO** lo necesitan.

</details>

<details>
<summary><b>💻 Ejemplo para VSCode (mcp.json)</b></summary>

```json
{
  "servers": {
    "influxdb-local": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init",
        "--network", "host",
        "-e", "INFLUX_HOST=localhost",
        "-e", "INFLUX_PORT=8086",
        "mcp-influxdb:latest"
      ],
      "type": "stdio"
    },
    "influxdb-prod": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init",
        "-e", "INFLUX_HOST=10.142.150.64",
        "-e", "INFLUX_PORT=8087",
        "-e", "INFLUX_USERNAME=admin",
        "-e", "INFLUX_PASSWORD=secret",
        "-e", "ALLOWED_DATABASES=production,metrics",
        "mcp-influxdb:latest"
      ],
      "type": "stdio"
    },
    "influxdb-dev": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init",
        "-e", "INFLUX_HOST=dev.example.com",
        "-e", "INFLUX_PORT=8086",
        "mcp-influxdb:latest"
      ],
      "type": "stdio"
    }
  }
}
```

**Nota:** Solo `influxdb-local` incluye `--network host` porque se conecta a `localhost`. Los demás servidores no lo necesitan.

</details>

### 🎮 Cómo activar/desactivar servidores

#### En Claude Code

**Opción 1: Comando MCP**
```bash
# Ver servidores disponibles
claude mcp list

# Habilitar un servidor
claude mcp enable influxdb-prod

# Deshabilitar un servidor
claude mcp disable influxdb-local
```

**Opción 2: @-mention en el chat**
```
@influxdb-prod  # Activa el servidor de producción para esta conversación
```

**Opción 3: UI interactiva**
```bash
claude mcp  # Abre interfaz para gestionar servidores
```

#### En VSCode

**Opción 1: Settings UI**
1. Abre Settings (Ctrl+,)
2. Busca "MCP Servers"
3. Marca/desmarca los checkboxes de cada servidor

**Opción 2: Deshabilitar temporalmente**
- Agrega el servidor al array `disabledMcpServers` en settings

**Opción 3: Command Palette**
```
Ctrl+Shift+P → "MCP: Manage Servers"
```

### 💡 Tips y buenas prácticas

- ✅ **`--network host` solo para localhost**: No lo uses con IPs remotas o hostnames
- ✅ **Mantén solo un servidor activo a la vez** para evitar confusión
- ✅ **Usa nombres descriptivos**: `influxdb-proyecto-prod` es mejor que `influxdb2`
- ✅ **Diferentes LOG_LEVEL por entorno**:
  - Local/Dev: `info` o `debug`
  - Producción: `warn` o `error`
- ✅ **ALLOWED_DATABASES restrictivo en producción**: Lista explícita en lugar de `*`
- ✅ **Comparte configuraciones** con tu equipo versionando los archivos de config

---

## ⚙️ Configuración

### 🔧 Variables de entorno

Pasa las variables usando `-e` en los args de Docker:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `INFLUX_PROTOCOL` | `http` | 🔒 Protocolo (http/https) |
| `INFLUX_HOST` | `localhost` | 🖥️ Host de InfluxDB |
| `INFLUX_PORT` | `8086` | 🔌 Puerto de InfluxDB |
| `INFLUX_USERNAME` | `""` | 👤 Usuario (vacío si no hay auth) |
| `INFLUX_PASSWORD` | `""` | 🔑 Contraseña (vacío si no hay auth) |
| `ALLOWED_DATABASES` | `*` | 🗄️ Bases permitidas (* para todas, o separadas por comas) |
| `LOG_LEVEL` | `info` | 📝 Nivel de logs (debug, info, warn, error) |

### 📝 Ejemplos con autenticación

<details>
<summary><b>🏠 Servidor local con autenticación</b></summary>

**Para Claude Code:**
```json
{
  "mcpServers": {
    "influxdb-local": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init",
        "--network", "host",
        "-e", "INFLUX_HOST=localhost",
        "-e", "INFLUX_PORT=8086",
        "-e", "INFLUX_USERNAME=admin",
        "-e", "INFLUX_PASSWORD=secret",
        "-e", "ALLOWED_DATABASES=metrics,logs",
        "-e", "LOG_LEVEL=info",
        "mcp-influxdb:latest"
      ]
    }
  }
}
```

**Para VSCode:**
```json
{
  "servers": {
    "influxdb-local": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init",
        "--network", "host",
        "-e", "INFLUX_HOST=localhost",
        "-e", "INFLUX_PORT=8086",
        "-e", "INFLUX_USERNAME=admin",
        "-e", "INFLUX_PASSWORD=secret",
        "-e", "ALLOWED_DATABASES=metrics,logs",
        "-e", "LOG_LEVEL=info",
        "mcp-influxdb:latest"
      ],
      "type": "stdio"
    }
  }
}
```

</details>

<details>
<summary><b>🌐 Servidor remoto con autenticación</b></summary>

**Para Claude Code:**
```json
{
  "mcpServers": {
    "influxdb-remote": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init",
        "-e", "INFLUX_HOST=10.142.150.64",
        "-e", "INFLUX_PORT=8087",
        "-e", "INFLUX_USERNAME=admin",
        "-e", "INFLUX_PASSWORD=secret123",
        "-e", "ALLOWED_DATABASES=production,metrics",
        "-e", "LOG_LEVEL=warn",
        "mcp-influxdb:latest"
      ]
    }
  }
}
```

**Para VSCode:**
```json
{
  "servers": {
    "influxdb-remote": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init",
        "-e", "INFLUX_HOST=10.142.150.64",
        "-e", "INFLUX_PORT=8087",
        "-e", "INFLUX_USERNAME=admin",
        "-e", "INFLUX_PASSWORD=secret123",
        "-e", "ALLOWED_DATABASES=production,metrics",
        "-e", "LOG_LEVEL=warn",
        "mcp-influxdb:latest"
      ],
      "type": "stdio"
    }
  }
}
```

**Nota:** Este ejemplo NO usa `--network host` porque se conecta a una IP remota.

</details>

---

## 🛠️ Herramientas disponibles

El servidor MCP proporciona **10 herramientas** organizadas por categoría:

### 📊 Metadatos (5 tools)
| Herramienta | Descripción |
|-------------|-------------|
| `meta.list_databases` | 🗄️ Lista todas las bases de datos disponibles |
| `meta.list_measurements` | 📈 Lista measurements de una base de datos |
| `meta.list_fields` | 🏷️ Lista campos con sus tipos de datos |
| `meta.list_tags` | 🔖 Lista tags disponibles |
| `meta.retention_policies` | ⏱️ Consulta políticas de retención |

### ⏰ Series temporales (3 tools)
| Herramienta | Descripción |
|-------------|-------------|
| `timeseries.query` | 🔍 Query flexible con agregaciones personalizadas |
| `timeseries.last` | ⚡ Últimos valores (optimizado para eficiencia) |
| `timeseries.window_agg` | 📊 Agregaciones por ventanas temporales |

### 🔬 Análisis (1 tool)
| Herramienta | Descripción |
|-------------|-------------|
| `features.extract` | 📉 Extrae features estadísticas (mean, std, trend, etc.) |

### 💊 Salud (1 tool)
| Herramienta | Descripción |
|-------------|-------------|
| `health.ping` | 🏥 Verifica conectividad con InfluxDB |

---

## 💡 Ejemplos de uso

Simplemente pregúntale a Claude:

> 💬 "Lista todas las bases de datos disponibles"

> 💬 "Muestra los últimos valores de la measurement 'cpu' en 'system_metrics'"

> 💬 "Calcula el promedio por hora de 'temperature' en los últimos 7 días"

> 💬 "Extrae features estadísticas de los datos del último mes"

---

## 🏗️ Arquitectura

```
┌─────────────────────┐
│  Claude Code / VS   │
│       Code          │
└──────────┬──────────┘
           │ MCP Protocol (stdio)
           ↓
┌─────────────────────┐
│ Docker Container    │
│  (mcp-influxdb)     │
└──────────┬──────────┘
           │ HTTP
           ↓
┌─────────────────────┐
│   InfluxDB 1.8      │
└─────────────────────┘
```

El servidor MCP corre en un **contenedor Docker efímero** (`--rm`) que se conecta a tu InfluxDB mediante HTTP/HTTPS.

---

## 🔒 Seguridad

Este servidor ha sido diseñado con seguridad en mente:

- ✅ **Read-only**: Solo permite queries `SELECT` y `SHOW`
- ✅ **Query validation**: Valida y sanitiza todas las queries
- ✅ **Whitelist de funciones**: Solo funciones seguras permitidas
- ✅ **Database filtering**: Restringe acceso mediante `ALLOWED_DATABASES`
- ✅ **Rate limiting**: Limita requests concurrentes
- ✅ **No-root user**: El contenedor corre con un usuario no privilegiado

---

## 🔧 Troubleshooting

<details>
<summary><b>❌ Servidor no conecta</b></summary>

1. **Verifica que la imagen Docker existe:**
   ```bash
   docker images | grep mcp-influxdb
   ```

2. **Si no existe, construye la imagen:**
   ```bash
   cd /ruta/a/mcp/influxdb
   docker build -t mcp-influxdb:latest .
   ```

3. **Verifica que Docker está corriendo:**
   ```bash
   docker ps
   ```

</details>

<details>
<summary><b>🔌 Error de conexión a InfluxDB</b></summary>

1. **Verifica que InfluxDB esté corriendo:**
   ```bash
   curl http://localhost:8888/ping
   ```

   Deberías ver una respuesta `204 No Content`

2. **Si InfluxDB está en Docker, verifica el puerto:**
   ```bash
   docker ps | grep influxdb
   ```

3. **Verifica las variables de entorno:**
   - `INFLUX_HOST` debe apuntar al host correcto
   - `INFLUX_PORT` debe coincidir con el puerto expuesto
   - Si usas autenticación, verifica `INFLUX_USERNAME` y `INFLUX_PASSWORD`

</details>

<details>
<summary><b>📝 Ver logs detallados</b></summary>

Para depuración avanzada, cambia el nivel de logs a `debug`:

```json
"-e", "LOG_LEVEL=debug"
```

Esto mostrará todas las queries ejecutadas y respuestas de InfluxDB.

</details>

<details>
<summary><b>🌐 Problemas con servidores remotos</b></summary>

Si no puedes conectarte a un servidor InfluxDB remoto:

1. **Verifica que NO estés usando `--network host` innecesariamente:**
   - `--network host` solo es para `localhost`
   - Para IPs remotas o hostnames, **NO lo uses**

2. **Prueba la conectividad desde tu máquina:**
   ```bash
   curl http://IP_REMOTA:PUERTO/ping
   ```

   Deberías ver una respuesta `204 No Content`

3. **Verifica firewall/seguridad:**
   - El puerto debe estar abierto en el servidor remoto
   - Tu máquina debe tener acceso de red al servidor

4. **Si usas VPN o red corporativa:**
   - Asegúrate de estar conectado a la VPN
   - Verifica que las rutas de red sean correctas

**Configuración correcta para servidor remoto:**
```json
{
  "args": [
    "run", "-i", "--rm", "--init",
    // ❌ NO usar --network host aquí
    "-e", "INFLUX_HOST=10.142.150.64",
    "-e", "INFLUX_PORT=8087",
    "mcp-influxdb:latest"
  ]
}
```

</details>

---

## 👨‍💻 Desarrollo

### 📦 Build local

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Construir imagen Docker
docker build -t mcp-influxdb:latest .
```

### 🧪 Tests

```bash
# Ejecutar todos los tests
npm test

# Tests unitarios solamente
npm run test:unit

# Tests de integración
npm run test:integration

# Coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### ✨ Linting y formato

```bash
# Verificar código
npm run lint

# Auto-fix
npm run lint:fix

# Formatear con Prettier
npm run format
```

### 🐳 Docker local

```bash
# Iniciar entorno completo (InfluxDB + MCP Server)
npm run docker:run

# Ver logs del servidor
npm run docker:logs

# Detener todo
npm run docker:down
```

---

## 📋 Requisitos

- 🐳 Docker instalado y corriendo
- 📊 InfluxDB 1.8.x accesible (local o remoto)
- 🤖 Claude Code o VSCode con extensión Claude Dev
- 📦 Node.js 20+ (solo para desarrollo)

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles

---

<div align="center">

**Hecho con ❤️ por [Cristian TR](https://github.com/cristiantr)**

[⭐ Star en GitHub](https://github.com/cristiantr/utils) • [🐛 Reportar bug](https://github.com/cristiantr/utils/issues) • [💡 Solicitar feature](https://github.com/cristiantr/utils/issues)

</div>
