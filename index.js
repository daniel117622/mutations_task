const express = require('express');
const app = express();
const port = 80;
const { validateDnaRequest, ErrorCode } = require('./validationUtils'); 
const { processingQueue, processQueueItems , addToProcessingQueue} = require('./processingQueue.js');
const hashing = require('crypto')
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

// Activa la cola de procesamiento
processQueueItems().catch(err => console.error(err));

// POST endpoint for "/mutation"
app.post('/mutation', async (req, res) => {
    const validationResult = validateDnaRequest(req);
    switch (validationResult) 
    {
        case ErrorCode.NO_ERROR:
            const q_item = { id : hashing.createHash('md5').update(JSON.stringify(req.body.dna)).digest('hex'), data: req.body.dna , receivedAt: Date.now() }
            addToProcessingQueue(q_item).then((message) =>
            {
                if (message == "OK")
                {
                    res.status(200).send({"result": "OK"});
                }
                else if (message == "MUTATED")
                {
                    res.status(403).send({"result": "Mutation found"});
                }
            });
            // For the moment the queue size is shown
            const queueString = JSON.stringify(processingQueue);
            const sizeInBytes = Buffer.byteLength(queueString, 'utf8');
            
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

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
