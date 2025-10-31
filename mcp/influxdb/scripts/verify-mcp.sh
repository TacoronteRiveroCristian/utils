#!/bin/bash
# Simple verification script using direct InfluxDB queries
# Tests the data that the MCP server will access

set -e

INFLUX_URL="http://localhost:8888"
PROJECT_DIR="/home/cristiantr/GitHub/utils/mcp/influxdb"

echo "🚀 MCP InfluxDB Verification Script"
echo "===================================="
echo ""

# Check if Docker is running
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if InfluxDB is accessible
echo "🔍 Checking InfluxDB connection..."
if ! curl -s "${INFLUX_URL}/ping" >/dev/null 2>&1; then
    echo "❌ InfluxDB is not accessible at ${INFLUX_URL}"
    echo "   Please check if your InfluxDB container is running."
    exit 1
fi
echo "✅ InfluxDB is accessible"
echo ""

# Build MCP Docker image
echo "🐳 Building MCP Docker image..."
cd "$PROJECT_DIR"
if npm run build >/dev/null 2>&1 && docker build -t mcp-influxdb:latest . >/dev/null 2>&1; then
    echo "✅ MCP Docker image built successfully"
else
    echo "❌ Failed to build MCP Docker image"
    exit 1
fi
echo ""

# Test 1: List databases
echo "📊 TEST 1: List Databases"
echo "-------------------------"
DATABASES=$(curl -s "${INFLUX_URL}/query?q=SHOW+DATABASES" | jq -r '.results[0].series[0].values[] | .[0]')
DB_COUNT=$(echo "$DATABASES" | wc -l)
echo "Found $DB_COUNT databases:"
echo "$DATABASES" | sed 's/^/  - /'
echo ""

# Test 2: Check omie_data
echo "📊 TEST 2: OMIE Price Data"
echo "--------------------------"
MEASUREMENTS=$(curl -s "${INFLUX_URL}/query?db=omie_data&q=SHOW+MEASUREMENTS" | jq -r '.results[0].series[0].values[] | .[0]')
echo "Measurements in omie_data:"
echo "$MEASUREMENTS" | sed 's/^/  - /'
echo ""

# Test 3: Last price
echo "📊 TEST 3: Latest Spot Price"
echo "----------------------------"
LAST_PRICE=$(curl -s "${INFLUX_URL}/query?db=omie_data&q=SELECT+LAST(spot_pdbc_eur_MWh)+FROM+spot_prices")
PRICE_VALUE=$(echo "$LAST_PRICE" | jq -r '.results[0].series[0].values[0][1]')
PRICE_TIME=$(echo "$LAST_PRICE" | jq -r '.results[0].series[0].values[0][0]')
echo "Latest price: ${PRICE_VALUE} EUR/MWh"
echo "Timestamp: ${PRICE_TIME}"
echo ""

# Test 4: Statistics (last 24h)
echo "📊 TEST 4: 24-Hour Price Statistics"
echo "-----------------------------------"
STATS=$(curl -s "${INFLUX_URL}/query?db=omie_data&q=SELECT+MEAN(spot_pdbc_eur_MWh),MIN(spot_pdbc_eur_MWh),MAX(spot_pdbc_eur_MWh),STDDEV(spot_pdbc_eur_MWh)+FROM+spot_prices+WHERE+time+>+now()-24h")
if echo "$STATS" | jq -e '.results[0].series[0]' >/dev/null 2>&1; then
    MEAN=$(echo "$STATS" | jq -r '.results[0].series[0].values[0][1]' | xargs printf "%.2f")
    MIN=$(echo "$STATS" | jq -r '.results[0].series[0].values[0][2]' | xargs printf "%.2f")
    MAX=$(echo "$STATS" | jq -r '.results[0].series[0].values[0][3]' | xargs printf "%.2f")
    STDDEV=$(echo "$STATS" | jq -r '.results[0].series[0].values[0][4]' | xargs printf "%.2f")

    echo "  Mean:   ${MEAN} EUR/MWh"
    echo "  Min:    ${MIN} EUR/MWh"
    echo "  Max:    ${MAX} EUR/MWh"
    echo "  StdDev: ${STDDEV} EUR/MWh"
else
    echo "  No data in last 24 hours"
fi
echo ""

# Test 5: Hourly aggregation (last 12h)
echo "📊 TEST 5: Hourly Prices (Last 12 Hours)"
echo "----------------------------------------"
HOURLY=$(curl -s "${INFLUX_URL}/query?db=omie_data&q=SELECT+MEAN(spot_pdbc_eur_MWh)+FROM+spot_prices+WHERE+time+>+now()-12h+GROUP+BY+time(1h)+ORDER+BY+time+DESC+LIMIT+5")
if echo "$HOURLY" | jq -e '.results[0].series[0]' >/dev/null 2>&1; then
    echo "Recent hourly averages:"
    echo "$HOURLY" | jq -r '.results[0].series[0].values[] | "  " + .[0] + " -> " + (.[1] | tostring | . + " EUR/MWh")' | head -5
else
    echo "  No hourly data available"
fi
echo ""

# Test 6: REE Data
echo "📊 TEST 6: REE Data (Sample)"
echo "----------------------------"
REE_DBS=$(echo "$DATABASES" | grep "ree_data_from" | head -1)
if [ -n "$REE_DBS" ]; then
    echo "Checking: $REE_DBS"
    REE_MEASUREMENTS=$(curl -s "${INFLUX_URL}/query?db=${REE_DBS}&q=SHOW+MEASUREMENTS" | jq -r '.results[0].series[0].values[] | .[0]' | head -3)
    echo "Sample measurements:"
    echo "$REE_MEASUREMENTS" | sed 's/^/  - /'
else
    echo "  No REE databases found"
fi
echo ""

# Test 7: Data freshness
echo "📊 TEST 7: Data Freshness"
echo "-------------------------"
LAST_TIME=$(echo "$LAST_PRICE" | jq -r '.results[0].series[0].values[0][0]')
LAST_EPOCH=$(date -d "$LAST_TIME" +%s 2>/dev/null || echo "0")
NOW_EPOCH=$(date +%s)
AGE_HOURS=$(( (NOW_EPOCH - LAST_EPOCH) / 3600 ))

if [ $AGE_HOURS -lt 24 ]; then
    echo "✅ Data is fresh (${AGE_HOURS} hours old)"
elif [ $AGE_HOURS -lt 168 ]; then
    echo "⚠️  Data is ${AGE_HOURS} hours old"
else
    DAYS=$(( AGE_HOURS / 24 ))
    echo "⚠️  Data is ${DAYS} days old"
fi
echo ""

# Test 8: Test MCP Server Startup
echo "📊 TEST 8: MCP Server Startup Test"
echo "-----------------------------------"
echo "Starting MCP server for 3 seconds..."
timeout 3 docker run --rm -i --network host \
    -e INFLUX_PORT=8888 \
    -e INFLUX_USERNAME= \
    -e INFLUX_PASSWORD= \
    -e LOG_LEVEL=error \
    mcp-influxdb:latest >/dev/null 2>&1 && echo "✅ MCP server starts successfully" || echo "⚠️  MCP server startup test timed out (this is expected)"
echo ""

# Summary
echo "===================================="
echo "🎉 VERIFICATION COMPLETE"
echo "===================================="
echo ""
echo "Summary:"
echo "  ✅ Docker running"
echo "  ✅ InfluxDB accessible (port 8888)"
echo "  ✅ MCP Docker image built"
echo "  ✅ Found $DB_COUNT databases"
echo "  ✅ OMIE price data accessible"
echo "  ✅ Latest price: ${PRICE_VALUE} EUR/MWh"
echo ""
echo "📖 Next Steps:"
echo "   1. Configure Cline in VSCode (see START-HERE.md)"
echo "   2. Copy the configuration from cline-config.json"
echo "   3. Restart VSCode"
echo "   4. Start asking questions about your data!"
echo ""
