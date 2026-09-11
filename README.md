# Aici

See it. Report it. Fix it.

Aici lets a resident report an urban problem (a pothole, a broken streetlight, dumped
garbage) with a photo and a location, and lets a city hall see and handle those reports.

University project for the course Development of Secure Applications.

## Stack

- Next.js with TypeScript for the app
- Tailwind for the interface
- PostgreSQL with PostGIS for the data, hosted on Neon
- sharp for image handling
- Leaflet for the map, with OpenStreetMap data

## Running it

You need Node 20 or newer.

1. Install dependencies:

   npm install

2. Create your `.env` with the database connection. The database is a shared Neon project.
   The easiest way is the Neon CLI, which writes the connection into `.env` for you:

   npm i -g neon
   neon login
   neon link --project-id raspy-star-63740105 --branch production

   If you prefer, ask a teammate for the connection string and put it in `.env` by hand:

   DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

3. Run it:

   npm run dev

Open the address it prints. The report form is the home page, the city hall view is at
`/panou`.

The tables already exist on the shared `production` branch. If you point at your own
empty database, create them once by running the SQL in `db/init.sql`.

## Layout

- `db/init.sql` sets up the tables and PostGIS
- `src/app` holds the pages and the API routes
- `src/lib` holds the database connection, input validation, and the image pipeline
- `src/components` holds the report form and the city hall map
- `research/` holds the domain, legal, security, and stack research behind the project

## Security notes

Uploaded photos are re encoded on the server, which strips EXIF and GPS metadata before
anything is stored. Inputs are validated before they reach the database, database queries
are parameterized, and the connection to the database uses TLS. Staff authentication, rate
limiting, and virus scanning come in later work.
