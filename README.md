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

## Solución de Problemas

### Kafka no se conecta
```bash
# Verificar que Kafka esté corriendo
docker compose ps kafka

# Ver logs de Kafka
docker compose logs kafka
```

### MongoDB no conecta
```bash
# Verificar MongoDB
docker compose ps mongo

# Conectar directamente
docker compose exec mongo mongosh
```

### Reiniciar servicios
```bash
# Reiniciar un servicio específico
docker compose restart api

# Reiniciar todo
docker compose down && docker compose up -d --build
```

## Testing con Postman

1. Importar la colección: `docs/Tournament.postman_collection.json`
2. Usar el endpoint POST /registrar con datos de prueba
3. Verificar que aparezca en los logs del job consumer

## Estructura Final del Proyecto
```
tournament-manager/
│── tournament-api
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── tournament-ui/
    ├── Dockerfile
    └── docker-compose.yml

```

## Compilar las imagenes
### API
Nos movemos a la carpeta del api, y compilamos las imágenes mediante el siguiente comando:

```cmd
docker-compose build
```

Este comando hará dos cosas:
1. Descarga la imagen de mongo
2. Compila la aplicación del api

## UI
Nos movemos a la carpeta del ui.

```cmd
docker-compose build
```

Este comando hará dos cosas:
1. Compila la aplicación del IO

## Verificamos
En este momento, podemos realizar una verificación con el comando `docker container ls` y debemos tener 3 imágenes.

# Subir las aplicaciones
En las carpetas de UI y API podemos subir las aplicaciones utilizando el comando
```
docker-compose up
```

El UI estará expuesto en el puerto 80 y el api en el 3000.

## Incluímos datos
Tomamos datos del archivo `data.ts` y utilizando Postman para insertar los datos en la base de datos.  Tenemos que importar el archivo `docs/Tournament.postman_collection.json`.

Posteriormente, enviamos la solicitud de `Create Tournament` para tener datos en la basde de datos.
Podemos verificar estos datos entrando a mongo directamente desde el pod o utilizando la solicitud de `Fetch Tournaments`.

## Estructura Final del Proyecto

```
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

El sistema está configurado para funcionar con las siguientes variables:

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

## Mejoras Implementadas

### Refactorización del Dominio
- **Antes**: Endpoint `/registrar` para personas con campos `{nombre, descripcion, tipo}`
- **Después**: Endpoint `/registrar` para torneos con campos `{title, type, category, location, date}`
- Lógica alineada al dominio de gestión de torneos

### Optimización de Health Checks
- Reducción de intervalos: 30s → 10s para checks rápidos
- Timeout optimizado: 10s → 3s  
- Menor tiempo de arranque: 40s → 15s para API
- Uso de `wget` en lugar de `curl` para mayor confiabilidad

### Job Consumer Mejorado
- Compatibilidad con formato nuevo (torneos) y legacy (personas)
- Mejor logging con campos específicos según el tipo de mensaje
- Parsing inteligente de mensajes Kafka

### UI Angular Actualizada  
- Visualización de torneos registrados
- Integración con endpoint `/fetch-registros`
- Componentes optimizados para gestión de torneos

¡El sistema está completo y listo para producción!