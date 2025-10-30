# 🚀 MCP Server para InfluxDB 1.8

Servidor MCP (Model Context Protocol) para consultar InfluxDB 1.8 en **modo SOLO LECTURA** orientado a análisis a gran escala.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Inicio Rápido](#-inicio-rápido)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Herramientas MCP](#-herramientas-mcp)
- [Arquitectura](#-arquitectura)
- [Ejemplos de Uso](#-ejemplos-de-uso)
- [Testing](#-testing)
- [Desarrollo](#-desarrollo)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)

## ✨ Características

### Core
- 🔒 **Solo Lectura Garantizada**: Validación estricta de queries (bloqueo de DDL/DML)
- 📊 **Análisis a Gran Escala**: Maneja millones de puntos con streaming y paginación
- ⚡ **Planificador Inteligente**: Selección automática de estrategia (LAST, GROUP BY, downsampling)
- 🎯 **10 Herramientas MCP**: Metadatos, queries, agregaciones, features estadísticas
- 💾 **Caché LRU**: Metadatos y consultas repetidas (configurable)
- 🛡️ **Límites Seguros**: Max points, max range, rate limiting, timeouts

### Capacidades de Análisis
- 📈 **Series Temporales**: Queries crudas o agregadas con ventanas de tiempo
- 🔍 **Metadatos Completos**: DBs, measurements, fields, tags, retention policies
- 📉 **Últimos Valores**: `LAST()` eficiente con agrupación por tags
- 🧮 **Features Estadísticas**: mean, std, var, rms, p2p, skewness, kurtosis, trend, zcr, auc
- 🪟 **Ventanas Deslizantes**: Análisis rolling con step configurable
- 🏷️ **Agrupación Flexible**: Por tags y ventanas temporales

### Rendimiento
- 🚄 **Streaming HTTP**: Chunked responses para grandes volúmenes
- 🔄 **Keep-Alive Pool**: Conexiones persistentes con InfluxDB
- 📦 **Compresión Gzip**: Reduce ancho de banda
- ⏱️ **Reintentos Inteligentes**: Backoff exponencial en errores temporales
- 📊 **Logs Estructurados**: JSON con métricas de rendimiento

## 🎯 Objetivo

Servidor MCP que expone herramientas de lectura/analítica sobre múltiples bases InfluxDB 1.8:
- ✅ Descubrir metadatos (DBs, measurements, fields, tags)
- ✅ Consultar series crudas o agregadas con ventanas de tiempo
- ✅ Obtener "últimos valores" con `LAST()` eficiente
- ✅ Extraer características estadísticas sobre ventanas
- ✅ Manejar gran volumen con paginación, streaming y caché
- ✅ Planificador que elige estrategia óptima automáticamente

---

## 🚀 Inicio Rápido

### Opción 1: Docker (Recomendado)

```bash
# Clonar y arrancar con docker-compose (incluye InfluxDB de prueba)
git clone <repo>
cd mcp-influxdb
cp .env.example .env
docker-compose up -d

# El servidor MCP estará en http://localhost:3000
```

### Opción 2: NPX (Sin Instalación)

```bash
# Ejecutar directamente
npx @tu-org/mcp-influxdb

# Con configuración custom
INFLUX_HOST=localhost INFLUX_PORT=8086 npx @tu-org/mcp-influxdb
```

### Opción 3: Local Development

```bash
npm install
cp .env.example .env
# Editar .env con tu configuración de InfluxDB
npm run dev
```

### Opción 4: Registro en Claude Desktop

Añade a tu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "influxdb": {
      "command": "npx",
      "args": ["@tu-org/mcp-influxdb"],
      "env": {
        "INFLUX_HOST": "localhost",
        "INFLUX_PORT": "8086",
        "INFLUX_USERNAME": "admin",
        "INFLUX_PASSWORD": "admin"
      }
    }
  }
}
```

---

## 📦 Instalación

### Requisitos Previos

- **Node.js**: >= 20.x
- **InfluxDB**: 1.8.x (no compatible con 2.x)
- **Docker** (opcional): >= 20.x

### Instalación Global

```bash
npm install -g @tu-org/mcp-influxdb
mcp-influxdb --help
```

### Instalación Local

```bash
npm install @tu-org/mcp-influxdb
```

### Build desde Fuente

```bash
git clone <repo>
cd mcp-influxdb
npm install
npm run build
npm link
```

---

## ⚙️ Configuración

### Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Lenguaje | TypeScript | 5.3+ |
| Runtime | Node.js | 20+ |
| MCP SDK | @modelcontextprotocol/sdk | latest |
| HTTP Client | undici | 6.x |
| Cache | lru-cache | 10.x |
| Testing | Vitest | 1.x |
| Logging | pino | 8.x |
| Validation | zod | 3.x |

### Variables de Entorno (.env)

Crea un archivo `.env` basado en `.env.example`:


```bash
# ═══════════════════════════════════════════════════════════
# CONEXIÓN INFLUXDB 1.8
# ═══════════════════════════════════════════════════════════
INFLUX_PROTOCOL=http              # http o https
INFLUX_HOST=localhost             # Host de InfluxDB
INFLUX_PORT=8086                  # Puerto (por defecto 8086)
INFLUX_USERNAME=admin             # Usuario con permisos de lectura
INFLUX_PASSWORD=admin             # Contraseña
INFLUX_DATABASE=                  # DB por defecto (opcional)

# ═══════════════════════════════════════════════════════════
# TIMEOUTS Y CONEXIONES
# ═══════════════════════════════════════════════════════════
INFLUX_TIMEOUT_MS=15000           # Timeout por query (ms)
INFLUX_MAX_CONNS=10               # Max conexiones keep-alive
INFLUX_RETRY_MAX=3                # Max reintentos en errores temporales
INFLUX_RETRY_DELAY_MS=500         # Delay inicial para backoff exponencial

# ═══════════════════════════════════════════════════════════
# SEGURIDAD Y LÍMITES
# ═══════════════════════════════════════════════════════════
ALLOWED_DATABASES=*               # "*" o "db1,db2,db3" (whitelist)
MAX_POINTS=1000000                # Máx puntos por consulta (1M)
MAX_RANGE_DAYS=365                # Máx rango temporal (días)
MAX_LIMIT=10000                   # Máx LIMIT en queries
MAX_CHUNK_SIZE=10000              # Máx chunk_size de InfluxDB

# ═══════════════════════════════════════════════════════════
# CACHÉ Y RENDIMIENTO
# ═══════════════════════════════════════════════════════════
CACHE_TTL_S=30                    # TTL de caché LRU (segundos)
CACHE_MAX_SIZE=100                # Max entradas en caché
RATE_LIMIT_QPS=20                 # Max queries por segundo
RATE_LIMIT_CONCURRENT=5           # Max queries concurrentes

# ═══════════════════════════════════════════════════════════
# CONFIGURACIÓN GENERAL
# ═══════════════════════════════════════════════════════════
DEFAULT_TZ=UTC                    # Timezone por defecto
DEFAULT_PAGE_SIZE=1000            # Tamaño de página por defecto
LOG_LEVEL=info                    # trace|debug|info|warn|error
LOG_FORMAT=json                   # json|pretty
NODE_ENV=production               # development|production|test

# ═══════════════════════════════════════════════════════════
# SERVIDOR MCP
# ═══════════════════════════════════════════════════════════
MCP_SERVER_NAME=influxdb-mcp      # Nombre del servidor MCP
MCP_SERVER_VERSION=1.0.0          # Versión
MCP_TRANSPORT=stdio               # stdio|http (por ahora solo stdio)
```

### Configuración de InfluxDB

El servidor requiere un usuario con **permisos de lectura** en las bases de datos:

```sql
-- En InfluxDB 1.8
CREATE USER "mcp_reader" WITH PASSWORD 'secure_password'
GRANT READ ON "database1" TO "mcp_reader"
GRANT READ ON "database2" TO "mcp_reader"
```

---

## 🛠️ Herramientas MCP

El servidor expone **10 herramientas** organizadas en 4 categorías:

### 📊 Metadatos (5 tools)

#### 1. `meta.list_databases`

Lista todas las bases de datos disponibles (respetando whitelist).

**Input:**
```json
{}
```

**Output:**
```json
{
  "databases": ["telegraf", "planta", "monitoring"]
}
```

---

#### 2. `meta.list_measurements`

Lista measurements de una base de datos.

**Input:**
```json
{
  "db": "telegraf",
  "match": "cpu.*"  // opcional: regex para filtrar
}
```

**Output:**
```json
{
  "measurements": ["cpu", "cpu_usage", "disk", "mem"]
}
```

---

#### 3. `meta.list_fields`

Lista fields (columnas) de un measurement con sus tipos.

**Input:**
```json
{
  "db": "telegraf",
  "measurement": "cpu"
}
```

**Output:**
```json
{
  "fields": [
    { "name": "usage_idle", "type": "float" },
    { "name": "usage_system", "type": "float" },
    { "name": "usage_user", "type": "float" }
  ]
}
```

---

#### 4. `meta.list_tags`

Lista tags (dimensiones) de un measurement.

**Input:**
```json
{
  "db": "telegraf",
  "measurement": "cpu"
}
```

**Output:**
```json
{
  "tags": ["host", "cpu", "datacenter"]
}
```

---

#### 5. `meta.retention_policies`

Lista políticas de retención de una base de datos.

**Input:**
```json
{
  "db": "telegraf"
}
```

**Output:**
```json
{
  "rps": [
    {
      "name": "autogen",
      "duration": "0s",
      "replication": 1,
      "default": true
    },
    {
      "name": "one_week",
      "duration": "168h0m0s",
      "replication": 1,
      "default": false
    }
  ]
}
```

---

### ⏱️ Series Temporales (3 tools)

#### 6. `timeseries.query`

Consulta general de series temporales con query builder seguro.

**Input:**
```json
{
  "db": "planta",
  "measurement": "turbina",
  "fields": ["p_kw", "rpm"],
  "where": {
    "time": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-01T06:00:00Z"
    },
    "tags": {
      "id": "T01",
      "location": { "op": "=~", "value": "/plant.*/"}
    }
  },
  "agg": "mean",
  "group_by_time": "1m",
  "group_by_tags": ["id"],
  "fill": "none",
  "order": "asc",
  "limit": 1000,
  "tz": "UTC",
  "page_size": 500,
  "no_cache": false
}
```

**Output:**
```json
{
  "columns": ["time", "id", "mean_p_kw", "mean_rpm"],
  "rows": [
    ["2025-01-01T00:00:00Z", "T01", 1250.5, 1800.2],
    ["2025-01-01T00:01:00Z", "T01", 1255.3, 1802.1]
  ],
  "stats": {
    "scanned_points": 50000,
    "window": "1m",
    "duration_ms": 342,
    "partial": false
  },
  "next_cursor": "eyJkYiI6InBsYW50YSIsIm9mZnNldCI6NTAwfQ=="
}
```

**Parámetros avanzados:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `fields` | `string[] \| "*"` | Campos a consultar (o "*" para todos) |
| `agg` | `string` | Agregación: mean, median, min, max, sum, count, spread, stddev, percentile |
| `percentile` | `number` | Percentil si `agg="percentile"` (0-100) |
| `group_by_time` | `string` | Ventana temporal: "1s", "1m", "1h", "1d" |
| `group_by_tags` | `string[]` | Tags para agrupar (GROUP BY) |
| `fill` | `string \| number` | Rellenar huecos: "none", "previous", "linear", 0 |
| `chunk_size` | `number` | Chunked de InfluxDB (max: MAX_CHUNK_SIZE) |
| `cursor` | `string` | Token opaco para paginación |

---

#### 7. `timeseries.last`

Obtiene últimos valores con `LAST()` eficiente.

**Input:**
```json
{
  "db": "planta",
  "measurement": "turbina",
  "field": "p_kw",
  "where": {
    "tags": {
      "location": "plant_a"
    }
  },
  "group_by_tags": ["id"]
}
```

**Output:**
```json
{
  "rows": [
    {
      "group": { "id": "T01" },
      "time": "2025-10-30T10:45:23Z",
      "value": 1320.5
    },
    {
      "group": { "id": "T02" },
      "time": "2025-10-30T10:45:25Z",
      "value": 1405.2
    }
  ]
}
```

---

#### 8. `timeseries.window_agg`

Atajo para agregaciones por ventanas con defaults sensatos.

**Input:**
```json
{
  "db": "planta",
  "measurement": "turbina",
  "field": "p_kw",
  "from": "2025-01-01T00:00:00Z",
  "to": "2025-01-01T06:00:00Z",
  "window": "5m",
  "aggs": ["mean", "min", "max", "stddev"],
  "group_by_tags": ["id"],
  "fill": "previous",
  "tz": "Europe/Madrid"
}
```

**Output:** (igual que `timeseries.query`)

---

### 📈 Análisis y Features (1 tool)

#### 9. `features.extract`

Calcula características estadísticas sobre series temporales.

**Input (con serie pre-cargada):**
```json
{
  "series": [
    { "t": "2025-01-01T00:00:00Z", "v": 100.5 },
    { "t": "2025-01-01T00:00:01Z", "v": 102.3 },
    { "t": "2025-01-01T00:00:02Z", "v": 98.7 }
  ],
  "features": ["mean", "std", "rms", "p2p", "trend"],
  "rolling": {
    "window": "60s",
    "step": "10s"
  }
}
```

**Input (con query):**
```json
{
  "query": {
    "db": "planta",
    "measurement": "turbina",
    "fields": ["vibration"],
    "where": {
      "time": {
        "from": "2025-01-01T00:00:00Z",
        "to": "2025-01-01T01:00:00Z"
      }
    },
    "group_by_time": "1s"
  },
  "features": ["mean", "std", "var", "rms", "p2p", "skew", "kurtosis", "zcr", "trend", "auc"],
  "sampling_hz": 1
}
```

**Output:**
```json
{
  "global": {
    "mean": 100.5,
    "std": 2.3,
    "var": 5.29,
    "rms": 100.52,
    "p2p": 8.5,
    "skew": -0.12,
    "kurtosis": 2.95,
    "zcr": 12,
    "trend": 0.05,
    "auc": 362100.5
  },
  "rolling": [
    {
      "window_start": "2025-01-01T00:00:00Z",
      "window_end": "2025-01-01T00:01:00Z",
      "values": {
        "mean": 101.2,
        "std": 1.8,
        "rms": 101.22
      }
    }
  ]
}
```

**Features Disponibles:**

| Feature | Descripción | Fórmula |
|---------|-------------|---------|
| `mean` | Media aritmética | $\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i$ |
| `std` | Desviación estándar | $\sigma = \sqrt{\frac{1}{n}\sum_{i=1}^{n}(x_i - \bar{x})^2}$ |
| `var` | Varianza | $\sigma^2$ |
| `rms` | Root Mean Square | $\sqrt{\frac{1}{n}\sum_{i=1}^{n} x_i^2}$ |
| `p2p` | Peak to Peak | $\max(x) - \min(x)$ |
| `skew` | Asimetría (skewness) | $\frac{\frac{1}{n}\sum(x_i-\bar{x})^3}{\sigma^3}$ |
| `kurtosis` | Curtosis | $\frac{\frac{1}{n}\sum(x_i-\bar{x})^4}{\sigma^4}$ |
| `zcr` | Zero Crossing Rate | Cruces por cero |
| `trend` | Pendiente (regresión lineal) | $\beta$ en $y = \alpha + \beta t$ |
| `auc` | Área bajo la curva | Integral trapezoidal |

---

### 🏥 Salud (1 tool)

#### 10. `health.ping`

Verifica conectividad con InfluxDB.

**Input:**
```json
{}
```

**Output:**
```json
{
  "ok": true,
  "influx": "pong",
  "server_time": "2025-10-30T10:45:30.123Z",
  "version": "1.8.10"
}
```

---

## 🏗️ Arquitectura

### CONEXIÓN A INFLUXDB 1.8
- Endpoints HTTP oficiales: /ping, /query
- Modo chunked con `chunked=true&chunk_size=...` para respuestas grandes.
- Gzip, keep-alive, timeouts y reintentos con backoff exponencial (solo en GET idempotentes).
- Solo lectura: **prohibir** cualquier cláusula de escritura o DDL (SELECT INTO, INTO, DROP, DELETE, ALTER, CREATE, GRANT, REVOKE, etc.). Implementa un validador y un “query builder” para evitar concatenaciones peligrosas.

### SEGURIDAD Y LÍMITES
- Whitelist de funciones InfluxQL permitidas: mean, median, min, max, sum, count, spread, stddev, derivative, non_negative_derivative, integral, first, last, percentile, moving_average.
- Exigir siempre un rango temporal cuando se pidan puntos crudos; si no se indica, usar último 1h.
- Limitar `LIMIT` y `chunk_size`. Rechazar consultas sin measurement si pueden disparar cardinalidad.
- Filtrado opcional de DBs/measurements por lista blanca (env ALLOWED_DATABASES).

### PLANIFICADOR DE CONSULTAS (estrategia)
- Si la petición pide “último valor”: usar `SELECT LAST(field) FROM ... WHERE ...`.
- Si pide estadísticas en ventana: `SELECT AGG(field) FROM ... WHERE time >= ... AND time < ... GROUP BY time(window) [ , tags...] fill(none) tz('...')`.
- Si pide puntos crudos con downsampling: aplicar `GROUP BY time(window)` con agregación adecuada (p. ej., mean) para no devolver millones de puntos brutos por defecto.
- Si solo metadatos: usar SHOW ... (ver “Metadatos”).
- Si la cardinalidad puede ser alta, requerir ‘measurement’ y/o filtros de tags; si no, rechazar.

### HERRAMIENTAS MCP (TOOLS)
Expón estas tools con esquemas JSON claros (valida inputs y devuelve errores ricos):
1) meta.list_databases
   Input: {}
   Output: { databases: string[] }

2) meta.list_measurements
   Input: { db: string, match?: string }  // match: regex opcional
   Output: { measurements: string[] }

3) meta.list_fields
   Input: { db: string, measurement: string }
   Output: { fields: Array<{name: string, type: "float"|"integer"|"boolean"|"string"}> }

4) meta.list_tags
   Input: { db: string, measurement: string }
   Output: { tags: string[] }

5) meta.retention_policies
   Input: { db: string }
   Output: { rps: Array<{ name: string, duration: string, replication: number, default: boolean }> }

6) timeseries.query
   // Consulta general con builder seguro; por defecto aplica downsampling si page_size grande.
   Input: {
     db: string,
     measurement: string,
     fields: string[] | "*",
     where?: { time?: { from: string, to: string }, tags?: Record<string,string|{op:"="|"!="|"=~"|"!~", value:string}> },
     agg?: "mean"|"median"|"min"|"max"|"sum"|"count"|"spread"|"stddev"|"percentile",
     percentile?: number,            // si agg="percentile"
     group_by_time?: string,         // p. ej., "1m"
     group_by_tags?: string[],       // opcional
     fill?: "none"|"previous"|number,
     order?: "asc"|"desc",
     limit?: number,
     chunk_size?: number,
     tz?: string,
     page_size?: number,             // paginación del servidor (no de Influx)
     cursor?: string,                // token opaco para siguiente página
     no_cache?: boolean
   }
   Output: {
     columns: string[],
     rows: Array<any[]>,             // tiempos en ISO 8601
     stats: { scanned_points?: number, window?: string|null, duration_ms: number, partial?: boolean },
     next_cursor?: string|null
   }

7) timeseries.last
   Input: {
     db: string,
     measurement: string,
     field: string,
     where?: { tags?: Record<string,string|{op:"="|"!="|"=~"|"!~", value:string}> },
     group_by_tags?: string[]        // devuelve LAST por grupo de tags
   }
   Output: { rows: Array<{ group?: Record<string,string>, time: string, value: number|null }> }

8) timeseries.window_agg
   // Atajo de agregación por ventanas con defaults sensatos
   Input: {
     db: string, measurement: string, field: string,
     from: string, to: string, window: string,
     aggs: Array<"mean"|"min"|"max"|"sum"|"count"|"stddev"|"spread"|"percentile">,
     percentile?: number,
     group_by_tags?: string[],
     fill?: "none"|"previous"|number,
     tz?: string
   }
   Output: igual que timeseries.query

9) features.extract
   // Calcula features sobre una serie ya agregada o cruda (el servidor puede aplicar downsampling antes).
   Input: {
     series: Array<{ t: string, v: number }>,   // opcional si se provee consulta
     query?: { ...mismo esquema de timeseries.query pero OBLIGANDO a time.from/to },
     features: Array<"mean"|"std"|"var"|"rms"|"p2p"|"skew"|"kurtosis"|"trend"|"zcr"|"auc">,
     rolling?: { window: string, step?: string }, // devuelve features por ventana deslizante
     sampling_hz?: number                         // si se calcula zcr/trend con paso temporal constante
   }
   Output: {
     global?: Record<string, number>,
     rolling?: Array<{ window_start: string, window_end: string, values: Record<string, number> }>
   }

10) health.ping
    Input: {}
    Output: { ok: true, influx: "pong", server_time: string }

### METADATOS (InfluxQL)
- SHOW DATABASES
- SHOW MEASUREMENTS [ON db] [WITH MEASUREMENT =~ /regex/]
- SHOW FIELD KEYS [ON db] FROM "measurement"
- SHOW TAG KEYS [ON db] FROM "measurement"
- SHOW RETENTION POLICIES ON db
- (Opcional) SHOW SERIES CARDINALITY ON db FROM "measurement"  // si soportado; controlar coste

### IMPLEMENTACIÓN
- “Query Builder” seguro que componga InfluxQL a partir de inputs validados (sin concatenaciones libres).
- Conversión de tiempos a ISO 8601; tz configurable.
- Paginación propia: si rows > page_size, devuelve first page y ‘next_cursor’ con {db, measurement, time_anchor, ...} en base64.
- Streaming desde Influx (`chunked=true`) para no cargar todo en memoria.
- Caché LRU (metadatos y resultados idénticos durante CACHE_TTL_S) con invalidación por parámetros ‘no_cache’.
- Rate limiting por proceso (QPS y concurrentes).
- Logs estructurados (JSON) con tiempos, bytes y query plan elegido.


### Estructura del Proyecto

```
mcp-influxdb/
├── src/
│   ├── index.ts                    # Entry point del servidor MCP
│   ├── server.ts                   # Configuración del servidor MCP
│   ├── config/
│   │   ├── env.ts                  # Validación y carga de .env
│   │   └── constants.ts            # Constantes globales
│   ├── influx/
│   │   ├── client.ts               # Cliente HTTP para InfluxDB
│   │   ├── query-builder.ts       # Builder seguro de InfluxQL
│   │   ├── query-validator.ts     # Validación de queries (solo lectura)
│   │   ├── query-planner.ts       # Planificador de estrategias
│   │   ├── streaming.ts            # Manejo de chunked responses
│   │   └── types.ts                # Tipos de InfluxDB
│   ├── tools/
│   │   ├── metadata.ts             # Tools de metadatos (1-5)
│   │   ├── timeseries.ts           # Tools de series temporales (6-8)
│   │   ├── features.ts             # Tool de análisis (9)
│   │   └── health.ts               # Tool de salud (10)
│   ├── features/
│   │   ├── statistical.ts          # Features estadísticas básicas
│   │   ├── signal.ts               # Features de señal (zcr, trend)
│   │   └── rolling.ts              # Ventanas deslizantes
│   ├── cache/
│   │   └── lru.ts                  # Caché LRU con TTL
│   ├── utils/
│   │   ├── logger.ts               # Logger estructurado (pino)
│   │   ├── rate-limiter.ts         # Rate limiting
│   │   ├── retry.ts                # Backoff exponencial
│   │   ├── time.ts                 # Parsing y conversión de tiempos
│   │   ├── pagination.ts           # Cursor de paginación
│   │   └── errors.ts               # Custom errors
│   └── schemas/
│       └── tools.ts                # Schemas Zod de cada tool
├── tests/
│   ├── unit/
│   │   ├── query-builder.test.ts
│   │   ├── query-validator.test.ts
│   │   ├── query-planner.test.ts
│   │   ├── features.test.ts
│   │   └── cache.test.ts
│   ├── integration/
│   │   ├── influx-mock.test.ts
│   │   ├── tools.test.ts
│   │   └── streaming.test.ts
│   └── fixtures/
│       ├── mock-responses.json
│       └── test-data.sql
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── influxdb/
│       └── init.sql                # Seed data para testing
├── .env.example
├── .env.test
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── mcp.json                        # Config para clientes MCP
└── README.md
```

### Flujo de Ejecución

```
┌─────────────┐
│   Cliente   │ (Claude Desktop, etc.)
│     MCP     │
└──────┬──────┘
       │ stdio/http
       ▼
┌─────────────────────────────────────────┐
│         Servidor MCP                     │
│  ┌────────────────────────────────────┐ │
│  │  Tool Router                       │ │
│  │  (meta|timeseries|features|health) │ │
│  └───────────────┬────────────────────┘ │
│                  │                       │
│  ┌───────────────▼────────────────────┐ │
│  │  Input Validation (Zod)           │ │
│  └───────────────┬────────────────────┘ │
│                  │                       │
│  ┌───────────────▼────────────────────┐ │
│  │  Rate Limiter + Cache Check       │ │
│  └───────────────┬────────────────────┘ │
│                  │                       │
│  ┌───────────────▼────────────────────┐ │
│  │  Query Planner                     │ │
│  │  (LAST | GROUP BY | RAW)          │ │
│  └───────────────┬────────────────────┘ │
│                  │                       │
│  ┌───────────────▼────────────────────┐ │
│  │  Query Builder (safe InfluxQL)    │ │
│  └───────────────┬────────────────────┘ │
│                  │                       │
│  ┌───────────────▼────────────────────┐ │
│  │  Query Validator (read-only)      │ │
│  └───────────────┬────────────────────┘ │
└──────────────────┼──────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   InfluxDB 1.8  │
         │   HTTP Client   │
         │  (chunked+gzip) │
         └─────────┬───────┘
                   │
                   ▼
         ┌─────────────────┐
         │  InfluxDB 1.8   │
         │     Server      │
         └─────────────────┘
```

### Componentes Clave

#### 1. Query Builder Seguro
```typescript
// NO hace esto ❌
const query = `SELECT * FROM ${measurement} WHERE ${userInput}`;

// Hace esto ✅
const query = buildQuery({
  select: ['field1', 'field2'],
  from: sanitizeMeasurement(measurement),
  where: buildWhereClause(validatedFilters),
  timeRange: { from, to }
});
```

#### 2. Query Planner

```typescript
interface QueryPlan {
  strategy: 'LAST' | 'AGGREGATED' | 'RAW' | 'DOWNSAMPLED';
  estimatedPoints: number;
  needsDownsampling: boolean;
  window?: string;
  query: string;
}

function planQuery(input: QueryInput): QueryPlan {
  if (input.isLastValue) return { strategy: 'LAST', ... };

  const estimated = estimatePoints(input);
  if (estimated > MAX_POINTS) {
    const window = calculateOptimalWindow(input.timeRange, MAX_POINTS);
    return { strategy: 'DOWNSAMPLED', window, ... };
  }

  return { strategy: input.agg ? 'AGGREGATED' : 'RAW', ... };
}
```

#### 3. Streaming Processor

```typescript
async function* streamChunkedResponse(
  response: Response
): AsyncGenerator<InfluxResult[]> {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      if (chunk.trim()) {
        yield JSON.parse(chunk);
      }
    }
  }
}
```

#### 4. Query Validator (Solo Lectura)

```typescript
const FORBIDDEN_KEYWORDS = [
  'INTO', 'DROP', 'DELETE', 'ALTER', 'CREATE',
  'GRANT', 'REVOKE', 'INSERT'
];

const ALLOWED_FUNCTIONS = [
  'MEAN', 'MEDIAN', 'MIN', 'MAX', 'SUM', 'COUNT',
  'SPREAD', 'STDDEV', 'PERCENTILE', 'FIRST', 'LAST',
  'DERIVATIVE', 'NON_NEGATIVE_DERIVATIVE', 'INTEGRAL',
  'MOVING_AVERAGE'
];

function validateReadOnly(query: string): void {
  const upper = query.toUpperCase();

  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (upper.includes(keyword)) {
      throw new Error(`Forbidden keyword: ${keyword}`);
    }
  }

  if (!upper.startsWith('SELECT') && !upper.startsWith('SHOW')) {
    throw new Error('Only SELECT and SHOW queries allowed');
  }
}
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Descubrir Estructura

```typescript
// 1. Listar bases de datos
const dbs = await mcp.callTool('meta.list_databases', {});
// → { databases: ['telegraf', 'planta'] }

// 2. Listar measurements
const measurements = await mcp.callTool('meta.list_measurements', {
  db: 'planta'
});
// → { measurements: ['turbina', 'sensor'] }

// 3. Ver fields disponibles
const fields = await mcp.callTool('meta.list_fields', {
  db: 'planta',
  measurement: 'turbina'
});
// → { fields: [
//     { name: 'p_kw', type: 'float' },
//     { name: 'rpm', type: 'float' },
//     { name: 'temp_c', type: 'float' }
//   ]}

// 4. Ver tags
const tags = await mcp.callTool('meta.list_tags', {
  db: 'planta',
  measurement: 'turbina'
});
// → { tags: ['id', 'location', 'model'] }
```

### Ejemplo 2: Último Valor de Potencia

```typescript
const lastPower = await mcp.callTool('timeseries.last', {
  db: 'planta',
  measurement: 'turbina',
  field: 'p_kw',
  where: {
    tags: {
      id: 'T01'
    }
  }
});

// Resultado:
// {
//   rows: [{
//     group: { id: 'T01' },
//     time: '2025-10-30T10:45:23Z',
//     value: 1320.5
//   }]
// }
```

### Ejemplo 3: Agregación por Minutos

```typescript
const aggregated = await mcp.callTool('timeseries.window_agg', {
  db: 'planta',
  measurement: 'turbina',
  field: 'p_kw',
  from: '2025-10-30T00:00:00Z',
  to: '2025-10-30T06:00:00Z',
  window: '1m',
  aggs: ['mean', 'max', 'min'],
  group_by_tags: ['id'],
  tz: 'UTC'
});

// Resultado:
// {
//   columns: ['time', 'id', 'mean', 'max', 'min'],
//   rows: [
//     ['2025-10-30T00:00:00Z', 'T01', 1250.5, 1280.0, 1220.0],
//     ['2025-10-30T00:01:00Z', 'T01', 1255.3, 1285.0, 1225.0],
//     ...
//   ],
//   stats: {
//     scanned_points: 360000,
//     window: '1m',
//     duration_ms: 842
//   }
// }
```

### Ejemplo 4: Query Compleja con Filtros

```typescript
const complex = await mcp.callTool('timeseries.query', {
  db: 'planta',
  measurement: 'turbina',
  fields: ['p_kw', 'rpm', 'temp_c'],
  where: {
    time: {
      from: '2025-10-30T08:00:00Z',
      to: '2025-10-30T12:00:00Z'
    },
    tags: {
      location: 'plant_a',
      model: { op: '=~', value: '/GE.*/' }
    }
  },
  agg: 'mean',
  group_by_time: '5m',
  group_by_tags: ['id', 'model'],
  fill: 'previous',
  order: 'asc',
  limit: 1000,
  tz: 'Europe/Madrid'
});
```

### Ejemplo 5: Features Estadísticas

```typescript
// Opción A: Desde query
const features = await mcp.callTool('features.extract', {
  query: {
    db: 'planta',
    measurement: 'turbina',
    fields: ['vibration'],
    where: {
      time: {
        from: '2025-10-30T00:00:00Z',
        to: '2025-10-30T01:00:00Z'
      },
      tags: { id: 'T01' }
    },
    group_by_time: '1s'
  },
  features: ['mean', 'std', 'rms', 'p2p', 'skew', 'kurtosis'],
  sampling_hz: 1
});

// Resultado:
// {
//   global: {
//     mean: 0.025,
//     std: 0.008,
//     rms: 0.026,
//     p2p: 0.045,
//     skew: 0.12,
//     kurtosis: 2.95
//   }
// }

// Opción B: Análisis rolling
const rollingFeatures = await mcp.callTool('features.extract', {
  query: { /* ... */ },
  features: ['mean', 'std', 'rms'],
  rolling: {
    window: '60s',
    step: '10s'
  }
});

// Resultado:
// {
//   rolling: [
//     {
//       window_start: '2025-10-30T00:00:00Z',
//       window_end: '2025-10-30T00:01:00Z',
//       values: { mean: 0.024, std: 0.007, rms: 0.025 }
//     },
//     {
//       window_start: '2025-10-30T00:00:10Z',
//       window_end: '2025-10-30T00:01:10Z',
//       values: { mean: 0.026, std: 0.009, rms: 0.027 }
//     },
//     ...
//   ]
// }
```

### Ejemplo 6: Paginación

```typescript
// Primera página
const page1 = await mcp.callTool('timeseries.query', {
  db: 'planta',
  measurement: 'turbina',
  fields: ['*'],
  where: {
    time: {
      from: '2025-10-01T00:00:00Z',
      to: '2025-10-30T23:59:59Z'
    }
  },
  page_size: 1000
});

// page1.next_cursor = "eyJkYiI6InBsYW50YSIsIm9mZnNldCI6MTAwMH0="

// Segunda página
const page2 = await mcp.callTool('timeseries.query', {
  db: 'planta',
  measurement: 'turbina',
  fields: ['*'],
  where: { /* mismo where */ },
  page_size: 1000,
  cursor: page1.next_cursor
});
```

---

## 🧪 Testing

### Estructura de Tests

```
tests/
├── unit/                       # Tests unitarios (sin I/O)
│   ├── query-builder.test.ts  # Builder de queries
│   ├── query-validator.test.ts # Validación read-only
│   ├── query-planner.test.ts  # Estrategias de planificación
│   ├── features.test.ts       # Cálculo de features
│   ├── time.test.ts           # Parsing de tiempos
│   ├── cache.test.ts          # LRU cache
│   └── pagination.test.ts     # Cursor de paginación
├── integration/               # Tests de integración
│   ├── influx-mock.test.ts   # Con mock de InfluxDB
│   ├── tools.test.ts         # Cada tool MCP
│   └── streaming.test.ts     # Chunked responses
└── e2e/                      # End-to-end con docker-compose
    └── real-influx.test.ts   # Contra InfluxDB real
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Solo unit tests
npm run test:unit

# Solo integration tests
npm run test:integration

# Con coverage
npm run test:coverage

# Watch mode
npm run test:watch

# E2E con docker
npm run test:e2e
```

### Ejemplo de Test

```typescript
// tests/unit/query-validator.test.ts
import { describe, it, expect } from 'vitest';
import { validateReadOnly } from '../../src/influx/query-validator';

describe('Query Validator', () => {
  it('should allow SELECT queries', () => {
    expect(() => {
      validateReadOnly('SELECT * FROM cpu WHERE time > now() - 1h');
    }).not.toThrow();
  });

  it('should reject DROP queries', () => {
    expect(() => {
      validateReadOnly('DROP MEASUREMENT cpu');
    }).toThrow(/Forbidden keyword: DROP/);
  });

  it('should reject queries with INTO', () => {
    expect(() => {
      validateReadOnly('SELECT * INTO backup FROM cpu');
    }).toThrow(/Forbidden keyword: INTO/);
  });

  it('should allow SHOW queries', () => {
    expect(() => {
      validateReadOnly('SHOW DATABASES');
    }).not.toThrow();
  });
});
```

---

## 🛠️ Desarrollo

### Scripts NPM

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "docker-compose up -d influxdb && vitest run tests/e2e",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src tests --ext .ts",
    "lint:fix": "eslint src tests --ext .ts --fix",
    "format": "prettier --write 'src/**/*.ts' 'tests/**/*.ts'",
    "typecheck": "tsc --noEmit",
    "docker:build": "docker build -t mcp-influxdb .",
    "docker:run": "docker-compose up -d",
    "docker:logs": "docker-compose logs -f mcp-server",
    "docker:down": "docker-compose down -v",
    "seed": "tsx scripts/seed-data.ts"
  }
}
```

### Configuración de Docker

#### Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar código y compilar
COPY . .
RUN npm run build

# Imagen final (multi-stage)
FROM node:20-alpine

WORKDIR /app

# Copiar solo lo necesario
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001
USER mcp

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  influxdb:
    image: influxdb:1.8-alpine
    container_name: mcp-influxdb
    ports:
      - "8086:8086"
    environment:
      - INFLUXDB_DB=telegraf
      - INFLUXDB_ADMIN_USER=admin
      - INFLUXDB_ADMIN_PASSWORD=admin
      - INFLUXDB_HTTP_AUTH_ENABLED=true
    volumes:
      - influx_data:/var/lib/influxdb
      - ./docker/influxdb/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - mcp-network
    healthcheck:
      test: ["CMD", "influx", "-execute", "SHOW DATABASES"]
      interval: 10s
      timeout: 5s
      retries: 5

  mcp-server:
    build: .
    container_name: mcp-server
    depends_on:
      influxdb:
        condition: service_healthy
    environment:
      - INFLUX_HOST=influxdb
      - INFLUX_PORT=8086
      - INFLUX_USERNAME=admin
      - INFLUX_PASSWORD=admin
      - ALLOWED_DATABASES=*
      - LOG_LEVEL=debug
    networks:
      - mcp-network
    volumes:
      - ./logs:/app/logs

volumes:
  influx_data:

networks:
  mcp-network:
    driver: bridge
```

### Seed Data

```bash
# scripts/seed-data.ts
npm run seed
```

```typescript
// Genera datos de prueba en InfluxDB
// - 30 días de datos
// - 3 turbinas (T01, T02, T03)
// - Métricas: p_kw, rpm, temp_c, vibration
// - 1 punto por segundo (~7.7M puntos total)
```

---

## 🐛 Troubleshooting

### Problema: "Connection refused"

```bash
# Verificar que InfluxDB esté corriendo
curl http://localhost:8086/ping

# Logs de InfluxDB
docker-compose logs influxdb

# Verificar conectividad
docker-compose exec mcp-server ping influxdb
```

### Problema: "Query timeout"

```bash
# Aumentar timeout en .env
INFLUX_TIMEOUT_MS=30000

# Verificar tamaño de la consulta
# Reducir rango temporal o aumentar window
```

### Problema: "Max points exceeded"

```typescript
// El planificador debería downsampling automático
// Si no, especifica group_by_time:
{
  "group_by_time": "1m",  // En vez de datos crudos
  "agg": "mean"
}
```

### Problema: "Forbidden keyword"

```typescript
// Error: Solo lectura
// Causa: Query contiene DROP, INTO, DELETE, etc.
// Solución: Usar solo SELECT y SHOW queries
```

### Problema: "Database not allowed"

```bash
# Verificar whitelist en .env
ALLOWED_DATABASES=db1,db2,db3

# O permitir todas
ALLOWED_DATABASES=*
```

---

## 🗺️ Roadmap

### v1.0 (MVP) ✅
- [x] 10 herramientas MCP básicas
- [x] Query builder seguro
- [x] Planificador de estrategias
- [x] Streaming y paginación
- [x] Caché LRU
- [x] Rate limiting
- [x] Tests unitarios y de integración
- [x] Docker + docker-compose

### v1.1 (Mejoras)
- [ ] Soporte para InfluxDB 2.x (Flux queries)
- [ ] WebSocket transport para MCP
- [ ] Caché persistente (Redis opcional)
- [ ] Métricas Prometheus
- [ ] Dashboard de monitoreo
- [ ] CLI interactivo

### v1.2 (Avanzado)
- [ ] Query optimizer con EXPLAIN
- [ ] Continuous queries discovery
- [ ] Alerting simple
- [ ] Export a CSV/Parquet
- [ ] ML features (FFT, wavelet, autocorrelation)
- [ ] Multi-tenancy

### v2.0 (Enterprise)
- [ ] Sharding/federation de múltiples InfluxDB
- [ ] Query cache distribuido
- [ ] Autenticación JWT
- [ ] Audit logging
- [ ] GraphQL API adicional

---

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing`)
5. Abre un Pull Request

### Guidelines

- ✅ Tests para nuevas features
- ✅ Código TypeScript estricto (`strict: true`)
- ✅ Docs en español para README
- ✅ Commits semánticos (feat, fix, docs, etc.)

---

## 📞 Soporte

- 🐛 Issues: [GitHub Issues](https://github.com/tu-org/mcp-influxdb/issues)
- 💬 Discusiones: [GitHub Discussions](https://github.com/tu-org/mcp-influxdb/discussions)
- 📧 Email: soporte@tu-org.com

---

## 🙏 Agradecimientos

- [Model Context Protocol](https://modelcontextprotocol.io/) por el SDK
- [InfluxData](https://www.influxdata.com/) por InfluxDB
- Comunidad de TypeScript y Node.js

---

**Hecho con ❤️ para análisis de series temporales a gran escala**
