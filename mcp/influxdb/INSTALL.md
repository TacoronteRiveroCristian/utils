# Instalación y Configuración - MCP Server InfluxDB 1.8

## Instalación

### 1. Instalar dependencias

```bash
cd /home/cristiantr/GitHub/utils/mcp/influxdb
npm install
```

### 2. Compilar el proyecto

```bash
npm run build
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y ajusta según tu configuración:

```bash
cp .env.example .env
```

Edita `.env` con las credenciales de tu InfluxDB:

```env
INFLUX_HOST=localhost
INFLUX_PORT=8086
INFLUX_USERNAME=admin
INFLUX_PASSWORD=admin
ALLOWED_DATABASES=*
```

## Configuración con Claude Desktop

### Opción 1: Configuración manual

Edita el archivo de configuración de Claude Desktop:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Añade la siguiente configuración:

```json
{
  "mcpServers": {
    "influxdb": {
      "command": "node",
      "args": ["/home/cristiantr/GitHub/utils/mcp/influxdb/dist/index.js"],
      "env": {
        "INFLUX_HOST": "localhost",
        "INFLUX_PORT": "8086",
        "INFLUX_USERNAME": "admin",
        "INFLUX_PASSWORD": "admin",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Opción 2: Usar el archivo de ejemplo

```bash
cp claude_desktop_config.example.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

## Configuración con VSCode MCP

La configuración ya está en `.vscode/settings.json`. Asegúrate de tener instalada la extensión MCP para VSCode.

## Verificar la instalación

### 1. Probar el servidor manualmente

```bash
cd /home/cristiantr/GitHub/utils/mcp/influxdb
node dist/index.js
```

El servidor debería iniciarse sin errores.

### 2. Ejecutar tests

```bash
npm test
```

### 3. Verificar con Docker

Si quieres probar con una instancia de InfluxDB en Docker:

```bash
docker-compose up -d
```

Esto levantará InfluxDB 1.8 en `localhost:8086` con las credenciales por defecto.

## Uso Básico

Una vez configurado, puedes usar las siguientes herramientas MCP desde Claude Desktop o VSCode:

### Metadatos

- `meta.list_databases` - Listar bases de datos
- `meta.list_measurements` - Listar measurements
- `meta.list_fields` - Listar campos
- `meta.list_tags` - Listar tags
- `meta.retention_policies` - Listar políticas de retención

### Series Temporales

- `timeseries.query` - Query flexible con opciones avanzadas
- `timeseries.last` - Obtener últimos valores
- `timeseries.window_agg` - Agregaciones por ventana

### Análisis

- `features.extract` - Extraer features estadísticas

### Salud

- `health.ping` - Verificar conectividad

## Troubleshooting

### Error: Cannot connect to InfluxDB

- Verifica que InfluxDB esté corriendo: `curl http://localhost:8086/ping`
- Verifica las credenciales en `.env` o la configuración de Claude
- Verifica que el puerto 8086 esté accesible

### Error: Database not allowed

- Verifica la variable `ALLOWED_DATABASES` en tu configuración
- Si quieres permitir todas las bases: `ALLOWED_DATABASES=*`
- Si quieres permitir solo algunas: `ALLOWED_DATABASES=db1,db2,db3`

### El servidor no aparece en Claude Desktop

- Reinicia Claude Desktop completamente
- Verifica que el path en `claude_desktop_config.json` sea absoluto y correcto
- Verifica los logs de Claude Desktop

## Desarrollo

```bash
# Modo desarrollo con hot-reload
npm run dev

# Compilar
npm run build

# Tests
npm test
npm run test:watch

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format
```

## Docker

```bash
# Build imagen
npm run docker:build

# Ejecutar con docker-compose
npm run docker:run

# Ver logs
npm run docker:logs

# Detener
npm run docker:down
```
