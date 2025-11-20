# Backend

Node.js + Express + TypeScript backend that exposes `/api/cars` for server-side pagination, sorting, search and filters.

Setup

1. Copy `.env.example` to `.env` and set DB connection details.
2. Install dependencies: `npm install`.
3. Import CSV data (example):

   # Windows PowerShell

   npm run import -- --file "..\\BMW_Aptitude_Test_Test_Data_ElectricCarData.csv"

4. Run dev server: `npm run dev`.

API

- GET /api/cars
  - query params: page, pageSize, sortField, sortOrder, search, filters
  - `filters` is a JSON string of objects: [{"field":"PriceEuro","op":"gt","value":50000}]
