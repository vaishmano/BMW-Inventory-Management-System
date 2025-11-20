# BMW Battery Datagrid App

A full-stack web application for browsing, searching, filtering, and managing electric car data (BMW internship project).

## Features
- CSV import to MySQL database
- Node.js + Express + TypeScript backend
- REST API for data access and deletion
- React + Vite + TypeScript frontend
- AG Grid and Material UI for table and UI
- Search, filter, pagination, and detail view
- Delete with confirmation (from grid or detail)

## Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (for MySQL, or use your own MySQL server)

## Quick Start

### 1. Clone the repository
```sh
git clone <your-repo-url>
cd bmw-battery-datagrid-app
```

### 2. Start MySQL with Docker
```sh
docker run --name bmw-mysql -e MYSQL_ROOT_PASSWORD=rootpass -e MYSQL_DATABASE=bmw_internship -p 3306:3306 -d mysql:8.0
```

### 3. Prepare the database table
Connect to MySQL (in the container or with a client) and run:
```sql
USE bmw_internship;
CREATE TABLE IF NOT EXISTS cars (
  Brand VARCHAR(64),
  Model VARCHAR(64),
  AccelSec FLOAT,
  TopSpeed_KmH INT,
  Range_Km INT,
  Efficiency_WhKm INT,
  FastCharge_KmH INT,
  RapidCharge VARCHAR(16),
  PowerTrain VARCHAR(32),
  PlugType VARCHAR(32),
  BodyStyle VARCHAR(32),
  Segment VARCHAR(32),
  Seats INT,
  PriceEuro INT,
  Date VARCHAR(32)
);
```

### 4. Import the CSV data
Copy the CSV into the container:
```sh
docker cp backend/BMW_Aptitude_Test_Test_Data_ElectricCarData.csv bmw-mysql:/tmp/
```
Then, in the MySQL shell:
```sql
LOAD DATA LOCAL INFILE '/tmp/BMW_Aptitude_Test_Test_Data_ElectricCarData.csv'
INTO TABLE cars
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(Brand,Model,AccelSec,TopSpeed_KmH,Range_Km,Efficiency_WhKm,FastCharge_KmH,RapidCharge,PowerTrain,PlugType,BodyStyle,Segment,Seats,PriceEuro,Date);
```

### 5. Backend setup
```sh
cd backend
cp .env.example .env # Edit DB credentials if needed
npm install
npm run import-csv # (optional, if you want to use the script)
npm start
```

### 6. Frontend setup
```sh
cd frontend
cp .env.example .env # Edit API URL if needed
npm install
npm run dev
```

### 7. Open the app
Go to [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

- `backend/` — Node.js/Express/TypeScript API server
- `frontend/` — React/Vite/TypeScript client app
- `backend/scripts/importCsv.ts` — CSV import script
- `frontend/src/components/` — React components (table, details, etc)
- `frontend/src/services/api.ts` — API client

## SQL Table Definition
```sql
CREATE TABLE IF NOT EXISTS cars (
  Brand VARCHAR(64),
  Model VARCHAR(64),
  AccelSec FLOAT,
  TopSpeed_KmH INT,
  Range_Km INT,
  Efficiency_WhKm INT,
  FastCharge_KmH INT,
  RapidCharge VARCHAR(16),
  PowerTrain VARCHAR(32),
  PlugType VARCHAR(32),
  BodyStyle VARCHAR(32),
  Segment VARCHAR(32),
  Seats INT,
  PriceEuro INT,
  Date VARCHAR(32)
);
```

## Troubleshooting
- If you get `local_infile` errors, enable it on both server and client.
- If you use a different MySQL setup, update `.env` files accordingly.
- For Windows paths, always copy the CSV into the container and use a Linux-style path in SQL.

## License
MIT
# bmw-battery-datagrid-app

A small monorepo demo app that imports an electric car dataset and exposes a server-side searchable/filterable DataGrid.

Contents

- `/backend` — Node.js + Express + TypeScript backend, MySQL storage, CSV import script.
- `/frontend` — React + Vite + TypeScript frontend using AG Grid and Material UI.

## Quick overview

This project demonstrates:

- CSV streaming import into MySQL
- Server-side search, filters and pagination
- Frontend data grid (AG Grid) with server-side filtering (contains, equals, startsWith, endsWith, isEmpty, gt, lt)
- Detail view and delete action

## Prerequisites

- Node.js (16+ recommended)
- npm or yarn
- MySQL server (local or Docker)
- Optional: Docker & Docker Compose

## Docker (quick MySQL dev)

Run a MySQL container for local development:

```powershell
docker run --name mysql-dev -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=bmw_battery -p 3306:3306 -d mysql:8.0
```

Wait a few seconds for MySQL to initialize.

## Environment files

Copy the examples and edit to match your environment:

```powershell
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Key backend env vars:

- DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
- CSV_PATH — path to `BMW_Aptitude_Test_Test_Data_ElectricCarData.csv` (default expects it in repo root)
- PORT — backend listen port

## Import CSV into MySQL

1. Ensure MySQL is running and `backend/.env` points to it.
2. Install backend dependencies and run the import script:

```powershell
cd backend
npm install
npm run import-csv -- --file "..\BMW_Aptitude_Test_Test_Data_ElectricCarData.csv"
```

The importer will create the `electric_cars` table (if not present) and perform batched inserts with simple deduplication.

## Run the backend

```powershell
cd backend
npm install
npm run dev   # uses ts-node-dev for local development
```

The API base is at `http://localhost:4000/api` by default.

## Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

By default the frontend expects `VITE_API_URL` pointing to the backend API (see `frontend/.env.example`).

## API examples

- GET items (search, filters, pagination):

  GET /api/items?q=Tesla&page=1&pageSize=50&filters=%5B%7B%22column%22%3A%22Brand%22%2C%22op%22%3A%22contains%22%2C%22value%22%3A%22Tesla%22%7D%5D

  Response:

  ```json
  {
    "data": [],
    "total": 123,
    "page": 1,
    "pageSize": 50
  }
  ```

- GET single item:
  GET /api/items/:id

- DELETE item:
  DELETE /api/items/:id

## Deliverable checklist

- [x] Backend: Node/Express/TypeScript, MySQL, CSV import script
- [x] Frontend: React + Vite + TypeScript, AG Grid, MUI
- [x] Server-side search/filters, pagination
- [x] Detail view and delete
- [ ] Expanded docs & tests (future work)

## Next steps / recommendations

- Add DB-level unique constraint to prevent duplicates permanently.
- Add E2E tests for import + API behaviors.
- Replace confirm() with an MUI dialog for delete UX consistency.
- Add better field formatting on the Detail page (dates, numbers).

---

Generated files:

- `backend/.env.example` (edit and copy to `.env`)
- `frontend/.env.example` (edit and copy to `.env`)

# bmw-battery-datagrid-app

Monorepo with backend (Node.js + Express + TypeScript) and frontend (React + Vite + TypeScript).

Features

- Backend: MySQL-backed API with server-side search and filters (contains, equals, startsWith, endsWith, isEmpty, greater than, less than).
- CSV import script for `BMW_Aptitude_Test_Test_Data_ElectricCarData.csv`.
- Frontend: React + Vite app using AG Grid and Material UI to display data and interact with server-side filtering.

Quick start

1. Configure database in `/backend/.env` (copy `.env.example`).
2. From `/backend` install dependencies and run the import script to populate MySQL:

   # Windows PowerShell

   cd backend; npm install; npm run import -- --file "..\\BMW_Aptitude_Test_Test_Data_ElectricCarData.csv"

3. Start backend: `npm run dev` or `npm run build && npm start`.
4. Start frontend: `cd frontend; npm install; npm run dev`.

See `/backend/README.md` and `/frontend/README.md` for details.
