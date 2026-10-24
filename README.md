# Survey App

A web application for creating and taking surveys. It allows users to register, create surveys with text and multiple-choice questions, share links, and collect and view response statistics.

---

## Features

- **Authentication:** registration and login with email + password using JWT.
- **Survey builder:** create questions of three types:
  - text response;
  - single choice (radio);
  - multiple choice (checkbox).
- **Management:** edit and delete your own surveys.
- **Participation:** take surveys created by other users.
- **Analytics:** view statistics for each question (count and percentage of responses).
- **Security:** protection against repeated submissions and prevention of authors responding to their own surveys.

---

## Tech Stack

### Backend

- **Platform:** Node.js (ESM), TypeScript
- **Framework:** Express 5
- **Database:** MySQL 8+ (compatible with MariaDB 10.5+)
- **Security:** JWT (`jsonwebtoken`), `bcryptjs` for password hashing
- **Rate limiting:** `express-rate-limit` to protect `/auth` endpoints

### Frontend

- **Language:** Vanilla TypeScript (SPA without heavy frameworks)
- **Bundler:** Vite
- **Routing:** custom router based on `history.pushState` + `popstate`

---

## Project Structure

```text
Survey/
├── Back/
│   ├── src/
│   │   ├── config/             # Database connection
│   │   ├── middleware/         # Auth
│   │   ├── repositories/       # SQL queries
│   │   ├── routes/             # Express routers
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Helpers, env, httpStatus
│   │   ├── validators/         # Validators
│   │   ├── constants.ts
│   │   ├── index.ts
│   │   └── types.ts
│   ├── sql/init.sql
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── Front/
│   ├── src/
│   │   ├── api/                # HTTP client
│   │   ├── components/         # Header, toast, renderers
│   │   ├── pages/              # SPA pages
│   │   ├── utils/              # Auth, router, validators, html, form
│   │   ├── styles/
│   │   ├── types/index.ts
│   │   ├── constants.ts
│   │   └── app.ts
│   ├── index.html
│   ├── .env.example
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## Environment Requirements

- **Node.js:** version 20+
- **npm:** version 10+
- **MySQL:** version 8+ (or MariaDB 10.5+)

---

## Installation and Running

### 1. Clone the repository

```bash
git clone https://github.com/maksbudnik64/Survey
cd Survey
```

### 2. Prepare the database

Create a database and apply the tables from the file `Back/sql/init.sql`:

```bash
mysql -u root -p < Back/sql/init.sql
```

### 3. Configure and run the backend

```bash
cd Back
npm install
cp .env.example .env
```

> **Important:** fill in the variables in the `.env` file according to the table in the "Environment Variables" section. The server will not start without a generated `JWT_SECRET`.

Command to generate the secret key `JWT_SECRET`:

```bash
openssl rand -base64 48
```

Start in development mode:

```bash
npm run dev
```

The backend will be available at `http://localhost:5000`. You can check the status via `GET http://localhost:5000/ping`.

### 4. Configure and run the frontend

In a new terminal window:

```bash
cd Front
npm install
cp .env.example .env
```

In the `.env` file, specify the backend URL:

```env
VITE_API_URL=http://localhost:5000
```

Start:

```bash
npm run dev
```

The application will automatically open at `http://localhost:3000`.

---

## Environment Variables

### Backend (`Back/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `FRONTEND_URL` | Allowed origins for CORS (comma-separated) | `http://localhost:3000` |
| `DB_HOST` | MySQL database host | `localhost` |
| `DB_PORT` | MySQL database port | `3306` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database user password | `—` |
| `DB_NAME` | Database name | `surveydb` |
| `DB_POOL_LIMIT` | Connection pool size | `10` |
| `JWT_SECRET` | Secret for signing tokens | *generated string* |

### Frontend (`Front/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the backend server | `http://localhost:5000` |

---

## Available Scripts

### Backend (`Back/`)

- `npm run dev` — start the dev server with hot reload (`tsx`).
- `npm run build` — compile TypeScript code into the `dist/` directory.
- `npm start` — start the compiled production server.

### Frontend (`Front/`)

- `npm run dev` — start the local Vite server (port 3000).
- `npm run build` — production build of the project into the `dist/` folder.
- `npm run preview` — preview the built bundle locally.
- `npm run typecheck` — check TypeScript types without building.

---

## API

All server responses are returned in a unified JSON format:

```json
// Successful request
{
  "success": true,
  "data": null
}

// Error
{
  "success": false,
  "error": "Error text",
  "code": "ERROR_CODE"
}
```

### Authentication

- `POST /auth/registration` — register a new user. **Body:** `{ email, password }`.
- `POST /auth/login` — log in. **Body:** `{ email, password }`.

> After a successful login, `{ token, user }` is returned. The token must be passed in the `Authorization: Bearer <token>` header.

### Surveys

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| **GET** | `/surveys` | — | List of all available surveys |
| **GET** | `/surveys/mySurveys` | ✅ | List of the current user's surveys |
| **GET** | `/surveys/:id` | — | Get detailed information about a survey |
| **GET** | `/surveys/:id/responded` | ✅ | Check whether the user has taken this survey |
| **GET** | `/surveys/responses/:id` | ✅ | Survey responses (available only to the author) |
| **POST** | `/surveys` | ✅ | Create a new survey |
| **POST** | `/surveys/:id/responses` | ✅ | Submit responses to a survey |
| **PUT** | `/surveys/edit/:id` | ✅ | Update a survey (available only to the author) |
| **DELETE** | `/surveys/:id` | ✅ | Delete a survey (available only to the author) |

### Service

- `GET /ping` — backend health check (returns status `200 OK`).

### Error Codes

| Code | HTTP | Description |
| :--- | :---: | :--- |
| `EMAIL_EXISTS` | 409 | Email is already registered |
| `USER_NOT_FOUND` | 404 | User not found |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `SURVEY_NOT_FOUND` | 404 | Survey not found |
| `FORBIDDEN` | 403 | No permission for the action |
| `DB_ERROR` | 500 | Database error |
| `VALIDATION_ERROR` | 400 | Data failed validation |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `UNAUTHORIZED` | 401 | Authorization required |
| `TOKEN_EXPIRED` | 401 | Token has expired |
| `INVALID_TOKEN` | 403 | Invalid token |
| `ALREADY_RESPONDED` | 409 | A response to the survey has already been submitted |
| `TOO_MANY_REQUESTS` | 429 | Request limit exceeded |

---

## System Limits

- **Email:** up to 255 characters.
- **Password:** 6 to 100 characters.
- **Survey title:** up to 255 characters.
- **Question text:** up to 500 characters.
- **Answer option:** up to 255 characters.
- **Questions per survey:** up to 20.
- **Answer options per question:** up to 10.
- **User text response:** up to 1000 characters.
- **Size of response JSON:** up to 100 KB.
- **Rate limit:** no more than 20 failed requests to `/auth/*` per 15 minutes from a single IP.

---

## Security

- Passwords are securely hashed using `bcryptjs` (10 rounds).
- Sessions are protected with JWT; the token lifetime is 7 days.
- All SQL queries are strictly parameterized to protect against SQL injection.
- User data passing through the frontend is escaped before being output to `innerHTML`.
- CORS is configured on the backend, restricting access to the list in `FRONTEND_URL`.
- *Note:* the authorization token is stored in `localStorage` — a deliberate compromise within the scope of an educational project.

---

## Known Limitations

- **No pagination** in survey and response lists — with a large amount of data, queries will be heavy.
- **Editing a survey deletes all accumulated responses** — statistics are fully reset.
- **No password recovery** or email verification.
- **The JWT token lives for 7 days**, is stored in `localStorage`, and cannot be revoked early.
- **Rate limiting is only applied to `/auth/*`** — creating surveys and submitting responses are not protected against spam.
- **No database migrations** — schema changes are applied manually.
- **No automated tests.**

---

## Possible Improvements

- **Automated tests** — cover utilities (`escapeHtml`, `pluralize`, `validators`) with unit tests, and key API endpoints with integration tests.
- **Docker** — a `Dockerfile` for the backend and frontend + `docker-compose.yml` with MySQL, so the project can be started with a single command.
- **UX improvements** — skeletons during page loading, a custom modal instead of `confirm()` when deleting, a visual indicator while forms are being submitted.
- **Pagination** — paginated output of surveys and responses with `?limit=&offset=` parameters.
- **Database migrations** — set up `knex`, `dbmate`, or `prisma migrate` so schema changes are not applied manually.
- **Refresh tokens** — a short-lived access token + a long-lived refresh token with revocation capability.
- **Response export** — export survey results to CSV or XLSX.
- **Survey search and sorting** — filter by title, sort by date and number of responses.
- **Email verification** — send an email with a link upon registration.
- **Logging and monitoring** — structured logs (`pino`), health check, metrics.
- **CI/CD** — GitHub Actions for type checking, tests, and builds on every push.

---

## License

This project is distributed under the [ISC](LICENSE) license.