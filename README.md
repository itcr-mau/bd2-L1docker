# Taller BD2 Docker: Tournament Manager + Kafka

**Instituto Tecnológico de Costa Rica**  
Campus Tecnológico Central Cartago  
Escuela de Ingeniería en Computación  

**Curso**: IC4302 Bases de datos II  
**Profesor**: Diego Andres Mora Rojas  
**Semestre**: II Semestre, 2025  

**Estudiante**: Mauricio González Prendas  
**Carné**: 2024143009  
**Correo**: m.gonzalez.9@estudiantec.cr  

Este taller implementa un sistema completo que incluye:
- **UI Angular** (puerto 80)
- **API NodeJS** (puerto 3000) 
- **MongoDB** (puerto 27017)
- **Kafka + Zookeeper** (puerto 9092)
- **Job Consumer** para procesar mensajes

## Arquitectura

```
UI Angular → API NodeJS → MongoDB
                ↓
              Kafka → Job Consumer
```

## Servicios Implementados

### 1. API NodeJS
- Endpoint `POST /registrar` que:
  - Inserta datos en MongoDB
  - Publica mensaje en Kafka tópico 'registros'
  - Retorna `insertedId`

### 2. Job Consumer (Kafka)
- Consume mensajes del tópico 'registros'
- Imprime cada mensaje en consola con formato estructurado
- Maneja errores y reconexiones

### 3. Base de Datos
- MongoDB con colección `registros`
- Schema: `{ nombre, descripcion, tipo, timestamps }`

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
  -d '{"nombre":"test","descripcion":"prueba","tipo":"demo"}'
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
Crea un nuevo registro y lo envía a Kafka.

**Request:**
```json
{
  "nombre": "string",      // requerido
  "descripcion": "string", // requerido  
  "tipo": "string"         // opcional
}
```

**Response (201):**
```json
{
  "success": true,
  "insertedId": "ObjectId",
  "message": "Registro creado y enviado a Kafka"
}
```

### GET /
Health check de la API

### GET /fetch-tournaments
Obtiene todos los torneos (funcionalidad existente)

### POST /upload-data
Carga masiva de torneos (funcionalidad existente)

## Verificación del Flujo Completo

1. **Enviar datos al endpoint:**
   ```bash
   curl -X POST http://localhost:3000/registrar \
     -H "Content-Type: application/json" \
     -d '{"nombre":"Juan Pérez","descripcion":"Registro de prueba","tipo":"demo"}'
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

¡El sistema está completo y listo para usar!