function findSequences(dna) 
{
    const sequences = ["AAAA", "GGGG", "CCCC", "TTTT"];
    function getDiagonals(array) 
    {
        let n = array.length;
        let m = array[0].length; // Asumiendo que todas las entradas son del mismo tamaño
        let diagonals = [];

        for (let i = 0; i < n + m - 1; i++) {
            let diag1 = [];
            let diag2 = [];
            for (let j = 0; j <= i; j++) {
            let k = i - j;
            if (k < n && j < m) {
                diag1.push(array[k][j]);
            }
            if (k < n && m - j - 1 >= 0) {
                diag2.push(array[k][m - j - 1]);
            }
            }
            if (diag1.length > 0) diagonals.push(diag1.join('')); // Descending
            if (diag2.length > 0) diagonals.push(diag2.join('')); // Ascending
        }

        return diagonals;
    }

    function checkRows(rows) 
    {
      for (let row of rows) 
      {
        for (let sequence of sequences) 
        {
          if (row.includes(sequence)) 
          {
            return true;
          }
        }
      }
      return false;
    }

    // El array se voltea
    function transposeArray(array) 
    {
        // Initialize an empty array to hold the transposed DNA strings
        let transposed = [];

        // Assuming all strings are of equal length
        let rowLength = dna[0].length;

        // Loop through each column index
        for (let colIndex = 0; colIndex < rowLength; colIndex++) {
            // Collect the nth character from each string and form a new string
            let newRow = dna.map(row => row[colIndex]).join('');
            // Add the new string to the transposed array
            transposed.push(newRow);
        }

        return transposed;
    }
    if (checkRows(dna)) 
    {
      return true;
    }
  
    // Checar en tabla provisional
    const transposedDNA = transposeArray(dna);
    console.log(transposedDNA)
    if (checkRows(transposedDNA)) 
    {
      return true;
    }
    
    // Se crea tuna tabla provisional de las diagonales
    const diagonalDNA = getDiagonals(dna);
    console.log(diagonalDNA)
    if (checkRows(diagonalDNA)) 
    {
        return true;
    }
    // Ninguna de las condiciones se cumple    
    return false;
  }

let processingQueue = [];

function addToProcessingQueue(item) 
{
    processingQueue.push(item);
    // Create and return a promise that will resolve when processing is complete
    return new Promise((resolve) => {
        processCompletionListeners.set(item.id, resolve);
    });
}
let processCompletionListeners = new Map(); 
// Asynchronously processes items in the queue
async function processQueueItems() {
    while (true) { // Infinite loop to continuously process items
        if (processingQueue.length > 0) {
            const item = processingQueue.shift(); // Dequeue the first item
            console.log(`Processing DNA: ${item.id} - Received at: ${item.receivedAt}`);
            if (item.data.every((str, _, arr) => str.length === arr[0].length)) // Same length
            {
                let hasMutations = findSequences(item.data)
                console.log(`DNA: ${item.id} is valid. Found ${hasMutations}`)
                const resolve = processCompletionListeners.get(item.id);
                if (resolve) 
                {
                    if (hasMutations) {resolve("MUTATED");}
                    else { resolve("OK") }
                    processCompletionListeners.delete(item.id);
                }
            }
            else
            {
                console.log(`DNA: ${item.id} not valid`)
            }

            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
        }
    }
}


module.exports = { processingQueue , processQueueItems, addToProcessingQueue };