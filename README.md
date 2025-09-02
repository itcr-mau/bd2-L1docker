# Taller BD2 Docker: Tournament Manager + Kafka

**Repositorio**: https://github.com/itcr-mau/bd2-L1docker

**Instituto Tecnológico de Costa Rica**  
Campus Tecnológico Central Cartago  
Escuela de Ingeniería en Computación  

**Curso**: IC4302 Bases de datos II  
**Profesor**: Diego Andres Mora Rojas  
**Semestre**: II Semestre, 2025  

**Estudiante**: Mauricio González Prendas  
**Carné**: 2024143009  
**Correo**: m.gonzalez.9@estudiantec.cr  

Este taller implementa un sistema completo de gestión de torneos que incluye:
- **UI Angular** (puerto 80) - Visualización de torneos
- **API NodeJS** (puerto 3000) - Gestión de torneos y registros
- **MongoDB** (puerto 27017) - Almacenamiento de datos
- **Kafka + Zookeeper** (puerto 9092) - Sistema de mensajería
- **Job Consumer** para procesar mensajes de registro

## Arquitectura

```
UI Angular → API NodeJS → MongoDB
                ↓
              Kafka → Job Consumer
```

## Servicios Implementados

### 1. API NodeJS
- Endpoint `GET /` - Health check del servicio
- Endpoint `POST /registrar` que:
  - Registra torneos con información completa (título, tipo, categoría, ubicación, fecha)
  - Inserta datos en MongoDB colección `registros`
  - Publica mensaje en Kafka tópico 'registros'
  - Retorna `insertedId` y confirmación
- Endpoint `GET /fetch-tournaments` - Obtiene todos los torneos
- Endpoint `GET /fetch-registros` - Obtiene todos los registros
- Endpoint `POST /upload-data` - Carga masiva de torneos

### 2. Job Consumer (Kafka)
- Consume mensajes del tópico 'registros'
- Procesa tanto formato nuevo (torneos) como legacy (personas)
- Imprime cada mensaje en consola con formato estructurado
- Maneja errores y reconexiones automáticas

### 3. Base de Datos
- MongoDB con dos colecciones:
  - `tournaments`: Torneos con brackets completos
  - `registros`: Registros de torneos con schema `{ title, type, category, location, date, timestamps }`

### 4. UI Angular
- Visualización de brackets de torneos
- Interfaz para mostrar torneos registrados
- Componentes reutilizables para diferentes tipos de competencias

## Comandos de Uso

### Levantar todo el sistema
```bash
docker compose up -d --build
```

### Verificar servicios
```bash
docker compose ps
```

### Ver logs de un servicio específico
```bash
docker compose logs -f api
docker compose logs -f job
docker compose logs -f kafka
```

### Probar el endpoint /registrar
```bash
curl -X POST http://localhost:3000/registrar \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Campeonato Nacional de Karate 2024",
    "type": "torneo-nacional", 
    "category": "karate-kumite",
    "location": "Gimnasio Nacional, San José",
    "date": "2024-03-15T09:00:00.000Z"
  }'
```

### Verificar registros de torneos
```bash
curl -s http://localhost:3000/fetch-registros | jq .
```

### Verificar health de la API
```bash
curl -s http://localhost:3000/ | jq .
```

### Verificar MongoDB
```bash
docker compose exec mongo mongosh tournament_designer
# Dentro de mongosh:
db.registros.find()
```

### Verificar tópicos de Kafka
```bash
docker compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list
```

## Endpoints de la API

### POST /registrar
Registra un nuevo torneo y lo envía a Kafka.

**Request:**
```json
{
  "title": "string",       // requerido - Nombre del torneo
  "type": "string",        // requerido - Tipo de torneo  
  "category": "string",    // opcional - Categoría (default: "General")
  "location": "string",    // opcional - Ubicación (default: "TBD")
  "date": "ISO_Date"       // opcional - Fecha del torneo
}
```

**Response (201):**
```json
{
  "success": true,
  "insertedId": "ObjectId",
  "message": "Torneo registrado y enviado a Kafka"
}
```

### GET /
Health check de la API - Retorna estado del servicio

### GET /fetch-tournaments
Obtiene todos los torneos de la colección tournaments

### GET /fetch-registros  
Obtiene todos los registros de torneos de la colección registros

### POST /upload-data
Carga masiva de torneos con brackets completos

## Verificación del Flujo Completo

1. **Registrar un torneo:**
   ```bash
   curl -X POST http://localhost:3000/registrar \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Campeonato Regional de Taekwondo",
       "type": "torneo-regional",
       "category": "taekwondo-poomsae", 
       "location": "Centro Deportivo Nacional",
       "date": "2024-04-20T10:00:00.000Z"
     }'
   ```

2. **Verificar inserción en MongoDB:**
   ```bash
   docker compose exec mongo mongosh tournament_designer --eval "db.registros.find().pretty()"
   ```

3. **Ver mensaje procesado por Job Consumer:**
   ```bash
   docker compose logs -f job
   ```

## Testing con Postman

1. Importar la colección: `docs/Tournament.postman_collection.json`
2. Usar el endpoint POST /registrar con datos de torneo
3. Verificar que aparezca en los logs del job consumer

## Estructura Final del Proyecto

```text
bd2-L1docker/
├── compose.yaml                     # Docker Compose principal
├── tournament-manager-ui/           # Frontend Angular
├── tournament-manager-api/          # Backend API NodeJS
├── kafka/                          # Job Consumer Kafka
│   ├── Dockerfile
│   ├── package.json
│   ├── .env
│   └── src/
│       └── consumer.js
└── docs/                           # Documentación y colección Postman
    └── Tournament.postman_collection.json
```

## Variables de Entorno

### API (tournament-manager-api)
- `PORT=3000`
- `MONGO_URI=mongodb://mongo:27017/tournament_designer`
- `KAFKA_BROKERS=kafka:29092`

### Job Consumer (kafka)
- `KAFKA_BROKERS=kafka:29092`
- `KAFKA_GROUP_ID=registros-consumer`
- `KAFKA_TOPIC=registros`

## Puertos Utilizados

- **UI Angular**: 80
- **API NodeJS**: 3000  
- **MongoDB**: 27017
- **Kafka**: 9092
- **Zookeeper**: 2181