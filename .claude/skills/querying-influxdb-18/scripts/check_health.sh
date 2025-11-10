#!/bin/bash
INFLUX_URL=$1
INFLUX_DB=$2

echo "=== InfluxDB Health Check ==="
echo "URL: $INFLUX_URL"
echo "Database: $INFLUX_DB"
echo ""

# Ping
echo "1. Ping test:"
curl -sI "$INFLUX_URL/ping" | grep -E "HTTP|X-Influxdb-Version"
echo ""

# List databases
echo "2. Available databases:"
curl -sG "$INFLUX_URL/query" --data-urlencode "q=SHOW DATABASES" | jq -r '.results[0].series[0].values[][0]'
echo ""

# List measurements
echo "3. Measurements in $INFLUX_DB:"
curl -sG "$INFLUX_URL/query?db=$INFLUX_DB" --data-urlencode "q=SHOW MEASUREMENTS" | jq -r '.results[0].series[0].values[][0]'
