import express from "express";
import mongoose, { model, Schema } from "mongoose";
import { Kafka } from "kafkajs";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tournament_designer';
const KAFKA_BROKERS = process.env.KAFKA_BROKERS || 'localhost:9092';

// Configurar Kafka
const kafka = new Kafka({
  clientId: 'tournament-api',
  brokers: [KAFKA_BROKERS]
});

const producer = kafka.producer();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Pass to next layer of middleware
    next();
});

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error conectando a MongoDB:", err));

// Conectar Kafka Producer
producer.connect()
  .then(() => console.log("✅ Conectado a Kafka Producer"))
  .catch((err) => console.error("❌ Error conectando a Kafka:", err));

// Schema para registros
const registroSchema = new Schema(
  {
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    tipo: { type: String, required: false }
  },
  { timestamps: true }
);

const Registro = model("Registro", registroSchema);


const tournamentSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    roster: [{
      id: { type: Number, required: true },
      name: { type: String, required: true },
      weight: { type: Number, required: true },
      age: { type: Number, required: true },
    }]
  },
  { timestamps: true }
);

const Tournament = model("Tournament", tournamentSchema);

// POST /registrar endpoint
app.post('/registrar', async (req, res) => {
  try {
    // 1. Validar datos de entrada
    const { nombre, descripcion, tipo } = req.body;
    
    if (!nombre || !descripcion) {
      return res.status(400).json({
        success: false,
        error: "Los campos 'nombre' y 'descripcion' son requeridos"
      });
    }

    // 2. Insertar en MongoDB
    const nuevoRegistro = new Registro({
      nombre,
      descripcion,
      tipo: tipo || 'default'
    });

    const resultado = await nuevoRegistro.save();
    console.log(`✅ Registro insertado en MongoDB:`, resultado._id);

    // 3. Publicar mensaje en Kafka
    const mensaje = {
      id: resultado._id.toString(),
      nombre,
      descripcion,
      tipo: tipo || 'default',
      timestamp: new Date().toISOString()
    };

    await producer.send({
      topic: 'registros',
      messages: [{
        key: resultado._id.toString(),
        value: JSON.stringify(mensaje)
      }]
    });

    console.log(`✅ Mensaje enviado a Kafka:`, mensaje);

    // 4. Responder con 201 y el insertedId
    res.status(201).json({
      success: true,
      insertedId: resultado._id,
      message: "Registro creado y enviado a Kafka"
    });

  } catch (error) {
    console.error("❌ Error en /registrar:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor"
    });
  }
});


app.post('/upload-data', async (req, res) => {
  const data = req.body;
  // Here you would handle the data upload logic
  console.log("Data received:", data);

  await Tournament.insertMany(req.body);
  res.status(201).json({ message: `Inserted ${req.body.length} tournaments!` });
});

app.get('/fetch-tournaments', async (req, res) => {
  const tournaments = await Tournament.find();
  res.status(200).json(tournaments);
});

app.get("/", (req, res) => {
  res.json({ message: "Tournament Designer API is running!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Cerrando conexiones...');
  await producer.disconnect();
  await mongoose.disconnect();
  console.log('✅ Conexiones cerradas');
  process.exit(0);
});
