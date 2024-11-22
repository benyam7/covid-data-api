# COVID-19 Data Aggregator API

This project provides an API to fetch, aggregate, and analyze COVID-19 data efficiently. It employs advanced data retrieval techniques, caching strategies, and MongoDB's aggregation pipeline to deliver highly optimized responses. The API is built using **Node.js**, **Express**, and **Mongoose**, with **Redis** for caching.

## Features

-   **Data Aggregation**:
    -   Aggregate COVID-19 data by regions, countries, or specific time intervals.
    -   Fetch vaccination statistics and other key metrics.
-   **Caching with Redis**:
    -   Cache results to reduce database load and improve response times.
    -   Implement data compression for optimized Redis storage.
-   **Flexible Queries**:
    -   Filter data by date range, country, or specific metrics (e.g., total cases, vaccinations).
-   **Pagination**:
    -   Support for paginated responses to manage large datasets.
-   **Data Validation**:
    -   Use Zod for schema validation of query parameters.

---

## Project Structure

```plaintext
.
├── controllers/
│   ├── covidController.ts   # Handles API requests and responses
├── models/
│   ├── covid-data.ts        # MongoDB model for COVID-19 data
├── utils/
│   ├── logger.ts            # Logging utility (Winston-based)
│   ├── redis-client.ts      # Redis client configuration
├── app.ts                   # Application entry point
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

## Endpoints

### `/api/comparison`

Fetches comparison data for selected countries over a specified date range.

-   **Query Parameters**:

    -   `startDate` (required): Start of the date range (ISO string).
    -   `endDate` (required): End of the date range (ISO string).
    -   `country` (required): Array of country names.
    -   `query_type` (required): Metric to compare (e.g., `total_cases`, `total_deaths`).
    -   `page` (optional): Page number for paginated results (default: 1).
    -   `limit` (optional): Number of results per page (default: 10).

-   **Caching**:
    -   Data is cached for one week using a unique key based on query parameters.
    -   Compressed data is stored in Redis to optimize storage.

---

### `/api/regions`

Provides aggregated COVID-19 data by continent.

-   **Data Points**:

    -   Total cases and deaths.
    -   Average number of female and male smokers.
    -   Percentage of population aged 65 and 70 or older.

-   **Caching**:
    -   Results are cached for one week to minimize database load.

---

### `/api/vaccination`

Fetches average vaccination coverage data for all countries.

-   **Data Points**:

    -   Average number of people vaccinated per hundred, rounded to 2 decimal places.

-   **Caching**:
    -   Results are cached for one week.

---

## Caching Strategies

To improve performance and reduce database load, the API employs a robust caching strategy using **Redis**.

1. **Key Generation**:

    - Cache keys are dynamically generated based on query parameters to ensure unique storage for each query.

    Example: comparison:2024-01-01:2024-01-31:USA,Canada:total_cases:page:1:limit:10

2. **Data Compression**:

-   Results are compressed using Gzip before being stored in Redis.
-   This reduces memory consumption, especially for large datasets.

3. **Cache Expiry**:

-   Data is cached for one week (`TTL = 3600 * 24 * 7` seconds).
-   While COVID-19 data is relatively static, this ensures freshness without overwhelming the cache. _(Free Redis tier in use)_

4. **Cache Invalidation**:

-   A TTL-based strategy is used; however, if the data source updates, the API could implement manual invalidation or versioned keys.

---

## Technologies Used

-   **Backend**:
-   Node.js, Express
-   **Database**:
-   MongoDB (Mongoose for schema definition and querying)
-   **Caching**:
-   Redis (with data compression using Gzip)
-   **Validation**:
-   Zod for schema validation of query parameters
-   **Logging**:
-   Winston for structured and configurable logging

---

## Setup Instructions

### Prerequisites

-   **Node.js** (>=16.x)
-   **MongoDB**
-   **Redis**

---

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-repo/covid-data-api.git
cd covid-data-api
```

2. Install dependency:

```bash
pnpm install
```

3. Configure environment variables:
   Create a .env file in the root directory with the following (you can copy from .env.example):

```plaintext
PORT=8000
MONGODB_URI=shared-in-email
MONGO_USER=shared-in-email
MONGO_PASSWORD=shared-in-email
MONGO_URL=shared-in-email
MONGO_TABLE=shared-in-email
REDIS_URL=shared-in-email
```

4. Start the server:

```bash
pnpm run dev
```

#### Development

##### Logging

The API uses Winston for structured logging. Logs are colorized for the console during development and can be output to files in production.
• Log Levels:
• info: Informational messages (e.g., cache hits/misses).
• warn: Warnings about potential issues.
• error: Errors with stack traces.

#### License

This project is licensed under the MIT License.
