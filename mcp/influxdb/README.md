# Servidor MCP InfluxDB

Servidor MCP (Model Context Protocol) para conectar Claude Code con InfluxDB 1.8 mediante Docker.

## Quick Start

### 1. Build de la imagen Docker

```bash
cd /ruta/a/mcp/influxdb
docker build -t mcp-influxdb:latest .
```

### 2. Configurar Claude Code

Agrega a tu configuración de MCP:

```json
{
  "mcpServers": {
    "influxdb": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--init",
        "--network",
        "host",
        "-e",
        "INFLUX_HOST=localhost",
        "-e",
        "INFLUX_PORT=8888",
        "-e",
        "LOG_LEVEL=info",
        "mcp-influxdb:latest"
      ]
    }
  }
}
```

### 3. Reiniciar Claude Code

Listo. Verifica que "influxdb" aparezca conectado con 10 herramientas disponibles.

## Configuración

### Variables de entorno principales

Pasa las variables usando `-e` en los args de Docker:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `INFLUX_PROTOCOL` | `http` | Protocolo (http/https) |
| `INFLUX_HOST` | `localhost` | Host de InfluxDB |
| `INFLUX_PORT` | `8086` | Puerto de InfluxDB |
| `INFLUX_USERNAME` | `""` | Usuario (vacío si no hay auth) |
| `INFLUX_PASSWORD` | `""` | Contraseña (vacío si no hay auth) |
| `ALLOWED_DATABASES` | `*` | Bases permitidas (* para todas, o separadas por comas) |
| `LOG_LEVEL` | `info` | Nivel de logs (debug, info, warn, error) |

### Ejemplo con autenticación

```json
{
  "mcpServers": {
    "influxdb": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init", "--network", "host",
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

## Herramientas disponibles

### Metadatos (5 tools)
- `meta.list_databases` - Lista bases de datos
- `meta.list_measurements` - Lista measurements
- `meta.list_fields` - Lista campos con tipos
- `meta.list_tags` - Lista tags
- `meta.retention_policies` - Políticas de retención

### Series temporales (3 tools)
- `timeseries.query` - Query flexible con agregaciones
- `timeseries.last` - Últimos valores (eficiente)
- `timeseries.window_agg` - Agregaciones por ventana temporal

### Análisis (1 tool)
- `features.extract` - Extrae features estadísticas (mean, std, trend, etc.)

### Salud (1 tool)
- `health.ping` - Verifica conectividad

## Ejemplos de uso

```
"Lista todas las bases de datos disponibles"

"Muestra los últimos valores de la measurement 'cpu' en 'system_metrics'"

"Calcula el promedio por hora de 'temperature' en los últimos 7 días"

"Extrae features estadísticas de los datos del último mes"
```

## Arquitectura

```
Claude Code
    ↓ MCP Protocol (stdio)
Docker Container (mcp-influxdb)
    ↓ HTTP
InfluxDB 1.8
```

El servidor MCP corre en un contenedor Docker que se conecta a tu InfluxDB mediante HTTP.

## Seguridad

- Read-only: Solo permite queries SELECT y SHOW
- Query validation: Valida y sanitiza todas las queries
- Whitelist de funciones: Solo funciones seguras
- Database filtering: Restringe acceso por base de datos
- Rate limiting: Limita requests concurrentes

## Troubleshooting

### Servidor no conecta

1. Verifica que la imagen existe:
   ```bash
   docker images | grep mcp-influxdb
   ```

2. Si no existe, haz build:
   ```bash
   docker build -t mcp-influxdb:latest .
   ```

### Error de conexión a InfluxDB

1. Verifica que InfluxDB esté corriendo:
   ```bash
   curl http://localhost:8888/ping
   ```

2. Si InfluxDB está en un contenedor Docker, asegúrate de que expone el puerto:
   ```bash
   docker ps | grep influxdb
   ```

### Logs del servidor

Para ver logs detallados, cambia `LOG_LEVEL` a `debug` en la configuración.

## Desarrollo

### Build local

```bash
npm install
npm run build
docker build -t mcp-influxdb:latest .
```

### Tests

```bash
npm test
```

### Linting

```bash
npm run lint
npm run format
```

## Requisitos

- Docker instalado y corriendo
- InfluxDB 1.8.x accesible (localmente o remoto)
- Claude Code con soporte MCP

## Licencia

MIT
