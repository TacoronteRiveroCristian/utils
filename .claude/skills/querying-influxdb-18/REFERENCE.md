# Referencia técnica completa InfluxQL para InfluxDB 1.8

Este documento contiene la especificación técnica completa de InfluxQL para consultas de lectura.

## Sintaxis completa de SELECT
```sql
SELECT <function>(<field_key>) | <field_key> | <tag_key>
FROM <measurement_name>
WHERE <conditional_expression>
GROUP BY <tag_key> | time(<interval>)
ORDER BY time [ASC|DESC]
LIMIT <N>
OFFSET <N>
SLIMIT <N>
SOFFSET <N>
```

## Operadores WHERE

### Operadores de comparación
- `=` igual a
- `<>` o `!=` diferente de
- `>` mayor que
- `>=` mayor o igual que
- `<` menor que
- `<=` menor o igual que

### Operadores lógicos
- `AND` conjunción
- `OR` disyunción
- `NOT` negación

### Expresiones regulares
```sql
WHERE tag_key =~ /regex/
WHERE tag_key !~ /regex/
WHERE field_key =~ /regex/
```

## Funciones de agregación completas

### Funciones numéricas básicas
- `COUNT(field_key)` - número de valores no nulos
- `DISTINCT(field_key)` - valores únicos
- `MEAN(field_key)` - promedio aritmético
- `MEDIAN(field_key)` - valor medio
- `MODE(field_key)` - valor más frecuente
- `SPREAD(field_key)` - diferencia entre MAX y MIN
- `STDDEV(field_key)` - desviación estándar
- `SUM(field_key)` - suma de valores

### Funciones de selección
- `FIRST(field_key)` - primer valor cronológicamente
- `LAST(field_key)` - último valor cronológicamente
- `MAX(field_key)` - valor máximo
- `MIN(field_key)` - valor mínimo
- `PERCENTILE(field_key, N)` - percentil N (0-100)
- `SAMPLE(field_key, N)` - muestra aleatoria de N puntos

### Funciones de transformación
- `ABS(field_key)` - valor absoluto
- `CEILING(field_key)` - redondeo hacia arriba
- `FLOOR(field_key)` - redondeo hacia abajo
- `ROUND(field_key)` - redondeo estándar
- `LN(field_key)` - logaritmo natural
- `LOG(field_key, base)` - logaritmo en base especificada
- `LOG2(field_key)` - logaritmo base 2
- `LOG10(field_key)` - logaritmo base 10
- `POW(field_key, exponent)` - potencia
- `SQRT(field_key)` - raíz cuadrada

### Funciones de análisis de series temporales
- `CUMULATIVE_SUM(field_key)` - suma acumulativa
- `DERIVATIVE(field_key, [unit])` - tasa de cambio
- `DIFFERENCE(field_key)` - diferencia entre valores consecutivos
- `ELAPSED(field_key, [unit])` - tiempo transcurrido entre puntos
- `MOVING_AVERAGE(field_key, N)` - media móvil de N puntos
- `NON_NEGATIVE_DERIVATIVE(field_key, [unit])` - derivada solo positiva
- `NON_NEGATIVE_DIFFERENCE(field_key)` - diferencia solo positiva

## GROUP BY avanzado

### GROUP BY con múltiples dimensiones
```sql
GROUP BY tag1, tag2, time(1h)
```

### GROUP BY con fill() detallado

**Opciones de fill():**
- `fill(none)` - omite intervalos sin datos (por defecto para agregaciones)
- `fill(null)` - incluye intervalos con valor null
- `fill(0)` - rellena con cero
- `fill(previous)` - usa último valor conocido
- `fill(linear)` - interpolación lineal entre puntos
- `fill(<número>)` - rellena con valor específico

**Ejemplo complejo:**
```sql
SELECT MEAN(temperature)
FROM weather
WHERE time >= '2024-01-01T00:00:00Z' AND time < '2024-01-02T00:00:00Z'
GROUP BY time(10m, 5m), location fill(linear)
```

El segundo parámetro en `time(10m, 5m)` es el offset.

## Subqueries (consultas anidadas)

InfluxDB 1.8 soporta subqueries:
```sql
SELECT MAX(mean_value)
FROM (
  SELECT MEAN(field) AS mean_value
  FROM measurement
  WHERE time > now() - 24h
  GROUP BY time(1h)
)
```

**Limitaciones:**
- Subquery debe estar entre paréntesis
- Solo un nivel de anidación
- La subquery debe incluir time en GROUP BY si usa agregaciones

## Regular expressions

### En WHERE
```sql
WHERE tag_key =~ /^us-/          -- empieza con "us-"
WHERE tag_key =~ /.*west$/       -- termina con "west"
WHERE field_key !~ /temp/        -- no contiene "temp"
```

### En FROM
```sql
FROM /^cpu.*/                    -- mediciones que empiezan con "cpu"
FROM /temperature|humidity/      -- mediciones que contienen temperature o humidity
```

### En SHOW
```sql
SHOW MEASUREMENTS WITH MEASUREMENT =~ /^cpu/
SHOW TAG VALUES WITH KEY =~ /location/
```

## SLIMIT y SOFFSET (límites de series)

Controlan cuántas series se devuelven:
```sql
-- Primera serie solamente
SELECT * FROM measurement GROUP BY * SLIMIT 1

-- Segunda y tercera serie
SELECT * FROM measurement GROUP BY * SLIMIT 2 SOFFSET 1

-- Combinar con LIMIT (limite de puntos)
SELECT * FROM measurement
WHERE time > now() - 1h
GROUP BY location
LIMIT 100        -- máximo 100 puntos por serie
SLIMIT 5         -- máximo 5 series
```

## Manejo avanzado de tiempo

### Zonas horarias
InfluxDB almacena todo en UTC. Para queries con zonas horarias específicas:
```sql
-- InfluxDB interpreta como UTC
WHERE time >= '2024-01-01T00:00:00Z'

-- Especificar offset
WHERE time >= '2024-01-01T00:00:00-08:00'
```


### Epoch timestamps en queries
```sql
WHERE time >= 1704067200000000000     -- nanosegundos (defecto)
WHERE time >= 1704067200s              -- segundos
WHERE time >= 1704067200000ms          -- milisegundos
```

### Aritmética de tiempo
```sql
WHERE time > '2024-01-01T00:00:00Z' + 1h
WHERE time < now() - 7d + 2h
```

Espacio requerido entre operador y duración: `- 7d` no `-7d`

## Cláusula INTO (requiere POST, fuera del alcance de este skill)

**Nota:** INTO escribe datos y no está permitido en este skill de solo lectura.

## Casos especiales y edge cases

### Mediciones con caracteres especiales
```sql
-- Medición con espacios o guiones
SELECT * FROM "my-measurement name"

-- Campo con punto
SELECT "field.with.dots" FROM measurement
```


### Valores null y ausentes
InfluxDB no almacena valores null en fields. Para detectar ausencia:
```sql
-- Buscar intervalos sin datos
SELECT COUNT(field) FROM measurement
WHERE time > now() - 1h
GROUP BY time(1m) fill(0)
```

Intervalos con count=0 indican ausencia de datos.

### Múltiples mediciones en una query
```sql
SELECT field1 FROM measurement1, measurement2
WHERE time > now() - 1h
```

Devuelve datos de ambas mediciones con el mismo field.

### Queries con múltiples databases
```sql
-- Sintaxis: "database"."retention_policy"."measurement"
SELECT * FROM "db1"."autogen"."measurement1", "db2".."measurement2"
```

## Optimización de queries

### Índices y performance
InfluxDB indexa automáticamente:
- time (siempre indexado)
- tags (todos indexados)
- fields (NO indexados)

**Implicaciones:**
- Filtrar por tags es eficiente
- Filtrar por fields requiere escaneo completo
- Filtrar por time + tags es óptimo

### Estrategias de optimización

1. **Usa tags para filtros frecuentes**
```sql
-- RÁPIDO (usa índice de tag)
WHERE location = 'us-west'

-- LENTO (escanea todos los valores del field)
WHERE location_field = 'us-west'
```

2. **Limita rangos temporales**
```sql
-- BUENO
WHERE time > now() - 1h

-- MALO (escanea toda la data)
SELECT * FROM measurement
```

3. **Usa agregaciones en lugar de puntos raw**
```sql
-- Para visualización de 7 días, usa agregación
SELECT MEAN(value) FROM measurement
WHERE time > now() - 7d
GROUP BY time(1h)

-- Evita millones de puntos individuales
SELECT * FROM measurement WHERE time > now() - 7d
```

4. **Selecciona solo campos necesarios**
```sql
-- BUENO
SELECT field1, field2 FROM measurement

-- PEOR (transfiere datos innecesarios)
SELECT * FROM measurement
```

## Códigos de error comunes y soluciones

### "error parsing query"
**Causa:** Sintaxis incorrecta de InfluxQL

**Soluciones:**
- Verifica comillas: dobles para identificadores, simples para valores
- Verifica palabras clave (FROM, WHERE, GROUP BY en orden correcto)
- Asegura que SELECT incluye al menos un field

### "database not found"
**Causa:** Database no existe o nombre incorrecto

**Soluciones:**
- Ejecuta `SHOW DATABASES` para ver nombres exactos
- Nombres son case-sensitive
- Verifica ortografía

### "measurement not found"
**Causa:** Medición no existe en la database

**Soluciones:**
- Ejecuta `SHOW MEASUREMENTS` en la database
- Verifica nombre exacto (case-sensitive)

### "field not found"
**Causa:** Field no existe o es un tag

**Soluciones:**
- Ejecuta `SHOW FIELD KEYS FROM measurement`
- No puedes usar funciones de agregación en tags
- Verifica que estás consultando un field, no un tag

### "invalid operation: time and *type* are not compatible"
**Causa:** Intentando agregar time con tipo incompatible

**Soluciones:**
- Solo puedes agregar/restar duraciones de time
- Usa formato correcto: `now() - 1h` no `now() - 1`

### "query timeout"
**Causa:** Query tarda demasiado

**Soluciones:**
- Reduce rango temporal con WHERE time
- Usa agregaciones GROUP BY time()
- Agrega LIMIT para limitar resultados
- Considera aumentar timeout del servidor

## Límites y cuotas de InfluxDB 1.8

### Límites por defecto
- **Max series per database:** 1,000,000 (configurable)
- **Max values per tag:** No hay límite específico, pero alta cardinalidad afecta performance
- **Max query duration:** 0s (sin timeout por defecto, configurable)
- **Max concurrent queries:** 0 (sin límite por defecto, configurable)

### Consideraciones de cardinalidad
- **Alta cardinalidad** = muchas combinaciones únicas de tags
- Ejemplo de ALTA cardinalidad (evitar): usar UUID o timestamp como tag
- Ejemplo de BAJA cardinalidad (bueno): region, datacenter, host (valores finitos)

## Formato completo de respuesta JSON

### Respuesta exitosa con una serie
```json
{
  "results": [
    {
      "statement_id": 0,
      "series": [
        {
          "name": "measurement_name",
          "tags": {
            "tag_key1": "tag_value1",
            "tag_key2": "tag_value2"
          },
          "columns": ["time", "field1", "field2"],
          "values": [
            ["2024-01-01T00:00:00Z", 42.5, "value"],
            ["2024-01-01T00:01:00Z", 43.2, "value"]
          ]
        }
      ]
    }
  ]
}
```

### Respuesta con múltiples series (GROUP BY tags)
```json
{
  "results": [
    {
      "statement_id": 0,
      "series": [
        {
          "name": "cpu",
          "tags": {"host": "server01"},
          "columns": ["time", "mean"],
          "values": [["2024-01-01T00:00:00Z", 45.2]]
        },
        {
          "name": "cpu",
          "tags": {"host": "server02"},
          "columns": ["time", "mean"],
          "values": [["2024-01-01T00:00:00Z", 52.8]]
        }
      ]
    }
  ]
}
```

### Respuesta con múltiples queries
```json
{
  "results": [
    {
      "statement_id": 0,
      "series": [{...}]  // Primera query
    },
    {
      "statement_id": 1,
      "series": [{...}]  // Segunda query
    }
  ]
}
```

### Respuesta con error
```json
{
  "results": [
    {
      "statement_id": 0,
      "error": "database not found: mydb"
    }
  ]
}
```

### Respuesta con error parcial
```json
{
  "results": [
    {
      "statement_id": 0,
      "series": [{...}]  // Primera query exitosa
    },
    {
      "statement_id": 1,
      "error": "measurement not found"  // Segunda query falló
    }
  ]
}
```

## Endpoints adicionales de InfluxDB 1.8

Aunque el skill se enfoca en `/query`, estos endpoints pueden ser útiles:

### /ping
```bash
curl -I 'http://localhost:8086/ping'
```

**Respuesta:**
