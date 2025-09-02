const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'tournament-job-consumer',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092']
});

const consumer = kafka.consumer({ 
  groupId: process.env.KAFKA_GROUP_ID || 'registros-consumer' 
});

const topic = process.env.KAFKA_TOPIC || 'registros';

async function runConsumer() {
  try {
    console.log('🚀 Iniciando Job Consumer de Kafka...');
    console.log(`📋 Configuración:`);
    console.log(`   - Brokers: ${process.env.KAFKA_BROKERS}`);
    console.log(`   - Group ID: ${process.env.KAFKA_GROUP_ID}`);
    console.log(`   - Topic: ${topic}`);

    // Conectar el consumer
    await consumer.connect();
    console.log('✅ Conectado a Kafka Consumer');

    // Suscribirse al tópico
    await consumer.subscribe({ 
      topic, 
      fromBeginning: true 
    });
    console.log(`✅ Suscrito al tópico: ${topic}`);

    // Procesar mensajes
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageValue = message.value?.toString();
          const messageKey = message.key?.toString();
          const timestamp = new Date().toISOString();

          console.log('\n📨 New message received:');
          console.log(`   ⏰ Timestamp: ${timestamp}`);
          console.log(`   🏷️  Topic: ${topic}`);
          console.log(`   📂 Partition: ${partition}`);
          console.log(`   🔑 Key: ${messageKey}`);
          console.log(`   📄 Value: ${messageValue}`);

          // Parse JSON message
          try {
            const parsedMessage = JSON.parse(messageValue);
            console.log('   📊 Tournament data:');
            console.log(`      - ID: ${parsedMessage.id}`);
            console.log(`      - Title: ${parsedMessage.title}`);
            console.log(`      - Type: ${parsedMessage.type}`);
            console.log(`      - Category: ${parsedMessage.category}`);
            console.log(`      - Location: ${parsedMessage.location}`);
            console.log(`      - Date: ${parsedMessage.date}`);
            console.log(`      - Original timestamp: ${parsedMessage.timestamp}`);
          } catch (parseError) {
            console.log('   ⚠️  Could not parse as JSON');
          }

          console.log('   ✅ Tournament registration processed successfully\n');
          console.log('─'.repeat(60));

        } catch (error) {
          console.error('❌ Error processing message:', error);
        }
      },
    });

  } catch (error) {
    console.error('❌ Consumer error:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🔄 Cerrando Job Consumer...');
  try {
    await consumer.disconnect();
    console.log('✅ Consumer desconectado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cerrar consumer:', error);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Iniciar el consumer
runConsumer().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
