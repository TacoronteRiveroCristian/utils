# Changelog

## [1.0.0] - 2025-10-30

### Añadido

#### Core Features
- ✅ Servidor MCP completo para InfluxDB 1.8
- ✅ 10 herramientas MCP organizadas en 4 categorías
- ✅ Validación estricta de queries (solo lectura)
- ✅ Query builder seguro sin concatenación de strings
- ✅ Planificador inteligente de queries (LAST, AGGREGATED, RAW, DOWNSAMPLED)

#### Herramientas MCP

**Metadatos (5 tools)**
- `meta.list_databases` - Lista de bases de datos disponibles
- `meta.list_measurements` - Measurements de una base de datos
- `meta.list_fields` - Campos con sus tipos
- `meta.list_tags` - Tags de un measurement
- `meta.retention_policies` - Políticas de retención

**Series Temporales (3 tools)**
- `timeseries.query` - Query general con builder completo
- `timeseries.last` - Últimos valores con LAST() eficiente
- `timeseries.window_agg` - Agregaciones por ventana

**Análisis (1 tool)**
- `features.extract` - 10 features estadísticas (mean, std, var, rms, p2p, skew, kurtosis, zcr, trend, auc)

**Salud (1 tool)**
- `health.ping` - Verificación de conectividad

#### Infrastructure
- ✅ Cliente HTTP con undici (keep-alive, gzip, retry con backoff exponencial)
- ✅ Caché LRU con TTL configurable
- ✅ Rate limiting (QPS + concurrencia máxima)
- ✅ Streaming de chunked responses
- ✅ Paginación con cursors opacos
- ✅ Logging estructurado con pino

#### Seguridad
- ✅ Validación de keywords prohibidas (DROP, DELETE, INTO, etc.)
- ✅ Whitelist de funciones InfluxQL permitidas
- ✅ Whitelist de bases de datos
- ✅ Límites configurables (max points, max range, max limit)

#### Configuration
- ✅ 30+ variables de entorno configurables
- ✅ Configuración para Claude Desktop
- ✅ Configuración para VSCode MCP
- ✅ Docker setup con docker-compose
- ✅ Soporte para múltiples instancias de InfluxDB

#### Testing
- ✅ Setup de tests con Vitest
- ✅ Test unitario de ejemplo para query validator

#### Documentation
- ✅ README completo con especificación detallada (1500+ líneas)
- ✅ INSTALL.md con instrucciones paso a paso
- ✅ Ejemplos de uso para cada herramienta
- ✅ Troubleshooting guide

### Notas Técnicas

**Stack:**
- TypeScript 5.7+
- Node.js 20+
- @modelcontextprotocol/sdk 1.0.4
- undici 6.22.0
- lru-cache 10.4.3
- pino 8.21.0
- zod 3.23.8

**Arquitectura:**
- Modo solo lectura garantizado
- Streaming HTTP para grandes volúmenes
- Planificador de estrategias automático
- Downsampling inteligente para prevenir saturación
- Caché de metadatos y queries

**Compatibilidad:**
- ✅ Claude Desktop/Code
- ✅ VSCode con MCP
- ✅ Compatible con InfluxDB 1.8.x

### Roadmap Futuro

**v1.1**
- [ ] Soporte para InfluxDB 2.x (Flux queries)
- [ ] WebSocket transport para MCP
- [ ] Caché persistente con Redis opcional
- [ ] Métricas Prometheus
- [ ] Dashboard de monitoreo

**v1.2**
- [ ] Query optimizer con EXPLAIN
- [ ] Continuous queries discovery
- [ ] Export a CSV/Parquet
- [ ] ML features adicionales (FFT, wavelet)

**v2.0**
- [ ] Sharding/federation de múltiples InfluxDB
- [ ] Autenticación JWT
- [ ] Audit logging
