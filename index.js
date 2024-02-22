const express = require('express');
const app = express();
const cors = require('cors');
const port = 80;
const { validateDnaRequest, ErrorCode } = require('./validationUtils'); 
const { processingQueue, processQueueItems , addToProcessingQueue} = require('./processingQueue.js');
const hashing = require('crypto')
app.use(cors());
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_KEY, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connection successful'))
.catch((err) => console.error('MongoDB connection error:', err));


const { Schema } = mongoose;

// Define the User schema
const requestSchema = new Schema({
  hash: { type: String, unique: true, required: true },
  data: [String],
  result: String,
  date_initiated: Number,
  date_completed: Number
});
const Request = mongoose.model('Request', requestSchema);

// Solo hay un endpoint de tipo POST donde recibe data del usuario. 
// Esta bien configurar el middleware para todas las rutas
app.use(express.json({
    verify: (req, res, buf, encoding) => {
        try {
            JSON.parse(buf); // Attempt to parse the incoming raw request
        } catch (e) {
            res.status(400).send({ error: "Invalid JSON payload" }); // Notifica al usuario del error
            throw new Error('Invalid JSON'); 
        }
    }
}));
// Suprimir alertas por errrores.
app.use((err, req, res, next) => {
    if (err.message === 'Invalid JSON') {
        return; 
    }
    next(err);
});
app.get('/test', (req, res) => {
    res.send('Test route working');
  });
// Activa la cola de procesamiento
processQueueItems().catch(err => console.error(err));

// POST endpoint for "/mutation"
app.post('/mutation', async (req, res) => {
    const validationResult = validateDnaRequest(req);
    console.log("Request accepted")
    switch (validationResult) 
    {
        case ErrorCode.NO_ERROR:
            const q_item = { id : hashing.createHash('md5').update(JSON.stringify(req.body.dna)).digest('hex'), data: req.body.dna , receivedAt: Date.now() }
            addToProcessingQueue(q_item).then((message) =>
            {
                if (message == "OK")
                {
                    res.status(200).send({"result": "OK"});
                    const newRequest = new Request({
                        hash: q_item.id,
                        data: q_item.data, // Array of strings
                        result: 'OK',
                        date_initiated: q_item.receivedAt,
                        date_completed: Date.now()
                      });
                      
                      newRequest.save()
                      .then(doc => console.log('Document inserted:', doc))
                      .catch(err => {}); // No problem with duplicate keys
                }
                else if (message == "MUTATED")
                {
                    res.status(403).send({"result": "Mutation found"});
                    const newRequest = new Request({
                        hash: q_item.id,
                        data: q_item.data, // Array of strings
                        result: 'MUTATED',
                        date_initiated: q_item.receivedAt,
                        date_completed: Date.now()
                      });
                      
                      newRequest.save()
                      .then(doc => console.log('Document inserted:', doc))
                      .catch(err => {}); // No problem with duplicate keys
                }
                else if (message == "FORMAT_ERROR")
                {
                    res.status(403).send({"error": "DNA in wrong format"});
                }
            });
            // For the moment the queue size is shown
            const queueString = JSON.stringify(processingQueue);
            
            break;
        case ErrorCode.MISSING_DNA:
            console.log('The "dna" attribute is missing.');
            res.status(400).send('Missing "dna" attribute.');
            break;
        case ErrorCode.EXTRA_FIELDS:
            console.log('The request body contains fields other than "dna".');
            res.status(400).send('Request body contains extra fields.');
            break;
        default:
            res.status(500).send('Internal server error.');
    }
});

app.get('/stats', async (req, res) => {
    try {
      // Aggregate query to get counts
      const stats = await Request.aggregate([
        {
          $group: {
            _id: '$result', // Group by the result
            count: { $sum: 1 } // Count the number of documents in each group
          }
        },
        {
          $match: {
            _id: { $in: ['OK', 'MUTATED'] } // Strings to look for
          }
        }
      ]);
  
      const formattedStats = stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});
  
      // Ensure both OK and MUTATED keys exist
      const finalStats = {
        OK: formattedStats.OK || 0,
        MUTATED: formattedStats.MUTATED || 0
      };
      
      res.json({"states" : finalStats});
    } catch (err) {
      console.error('Error fetching stats:', err);
      res.status(500).send({ error: 'Internal server error' });
    }
  });

app.use((req, res, next) => {
res.status(404).json({
    message: 'Ohh you are lost, read the API documentation to find your way back home :)'
})
})
// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
