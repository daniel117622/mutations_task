# DNA Analysis Backend

This backend service is designed to analyze DNA sequences to detect mutations. It provides endpoints to submit DNA samples, retrieve analysis statistics, and list the latest valid requests. Built with Node.js, Express, and MongoDB, it features a robust architecture for efficient data processing and storage.

## Getting Started

### Prerequisites

- Node.js (version 12.x or newer recommended)
- npm (Node Package Manager)
- MongoDB (Remote or local installation)
- An `.env` file configured with your MongoDB connection string

### API Endpoints

#### POST /mutation

Submits a DNA sample for mutation analysis.

**Request Body:**

{
  "dna": ["ATGCGA", "CAGTGC", "TTATGT", "AGAAGG", "CCCCTA", "TCACTG"]
}

**Responses:**
  - 200 OK if no mutation is found.
  - 403 Forbidden if a mutation is detected or the DNA format is incorrect.
  - GET /stats
  - Retrieves the statistics of DNA analysis, including counts of mutations and non-mutations.

#### GET /stats
**Request Body:**
Retrieves the statistics of DNA analysis, including counts of mutations and non-mutations.

{
  "states": {
    "OK": 10,
    "MUTATED": 5
  }
}

#### GET /list
Fetches the last 10 processed DNA analysis requests.

