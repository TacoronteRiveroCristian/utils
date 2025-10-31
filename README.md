# 🛠️ Utils - Colección de Herramientas Reutilizables

> Repositorio personal de utilidades, herramientas y servidores que utilizo en mis proyectos

<div align="center">

![Status](https://img.shields.io/badge/Status-En%20Desarrollo-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## 📋 Sobre este Proyecto

Este repositorio nace con la intención de centralizar todas las herramientas, utilidades y servicios que necesito usar de forma recurrente en mis diferentes proyectos. La idea es ir construyendo poco a poco una colección de recursos reutilizables que me permitan acelerar el desarrollo y mantener consistencia entre proyectos.

### 🎯 Objetivos

- **Centralización**: Tener un único lugar donde mantener todas mis utilidades
- **Reutilización**: Evitar reescribir código común entre proyectos
- **Modularidad**: Cada herramienta es independiente y puede usarse por separado
- **Documentación**: Mantener todo bien documentado para referencia futura
- **Crecimiento progresivo**: Ir añadiendo nuevas utilidades según las vaya necesitando

---

## 📦 Contenido Actual

### 🔌 Servidores MCP (Model Context Protocol)

Actualmente el repositorio contiene servidores MCP para integrar diferentes servicios con herramientas de IA como Claude y VS Code.

#### 📊 [Servidor MCP InfluxDB](./mcp/influxdb/)

Servidor MCP para conectar Claude Code y VSCode con InfluxDB 1.8 mediante Docker.

**Características:**
- ✅ Query de series temporales con opciones flexibles
- ✅ Agregaciones por ventana temporal
- ✅ Extracción de features estadísticos
- ✅ Gestión de metadatos (databases, measurements, tags, fields)
- ✅ Health checks y conectividad
- ✅ Caché LRU para optimización de queries
- ✅ Rate limiting y retry automático
- ✅ Streaming de datos para datasets grandes

**Documentación completa:** [mcp/influxdb/README.md](./mcp/influxdb/README.md)

---

## 🚧 Próximas Adiciones (Planificadas)

A medida que avance en mis proyectos, iré añadiendo:

- 📝 Utilidades de procesamiento de texto
- 🔐 Helpers de autenticación y seguridad
- 📊 Funciones de análisis de datos
- 🌐 Utilidades de red y APIs
- 📁 Gestores de archivos y configuración
- 🧪 Funciones de testing comunes
- Y mucho más según vaya necesitando...

---

## 🏗️ Estructura del Proyecto

```
utils/
├── mcp/                    # Servidores MCP
│   └── influxdb/          # Servidor MCP para InfluxDB
│       ├── src/           # Código fuente
│       ├── tests/         # Tests
│       ├── docker/        # Configuración Docker
│       └── README.md      # Documentación específica
│
├── [futuras carpetas]     # Otras utilidades por añadir
│
└── README.md             # Este archivo
```

---

## 💡 Filosofía del Proyecto

Este no es un proyecto con un roadmap estricto. Más bien es una colección orgánica que crece según mis necesidades reales. Cada vez que me encuentro escribiendo código que podría ser útil en otros proyectos, lo añado aquí de forma generalizada y documentada.

**Principios:**
- ✨ **Calidad sobre cantidad**: Prefiero pocas utilidades bien hechas
- 📖 **Documentación clara**: Si no está documentado, no sirve
- 🧪 **Testing cuando sea crítico**: Las utilidades complejas deben estar testeadas
- 🔄 **Evolución constante**: El proyecto crece con el tiempo, sin prisa

---

## 📄 Licencia

MIT License - Siéntete libre de usar cualquier parte de este código en tus proyectos.

---

## 👤 Autor

**Cristian Tacoronte Rivero**

Este es mi repositorio personal de utilidades. Si encuentras algo útil, ¡genial! Pero ten en cuenta que está pensado principalmente para mi uso personal y puede cambiar sin previo aviso.

---

<div align="center">

**⚠️ Proyecto en construcción activa - Se irán añadiendo más utilidades progresivamente**

</div>
