# Second Sync — Backend API

Node.js + Express backend for the Second Sync marketplace.

## Stack
- **Runtime:** Node.js (ESM modules)
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Image Storage:** Cloudinary
- **Security:** Helmet, CORS, Rate Limiting

---

## Folder Structure

```
backend/
├── src/
│   ├── server.js              ← Entry point
│   ├── config/
│   │   ├── supabase.js        ← Supabase client (anon + admin)
│   │   └── cloudinary.js      ← Cloudinary config
│   ├── middleware/
│   │   ├── auth.js            ← JWT auth + admin guard
│   │   └── rateLimiter.js     ← Rate limiting per route type
│   └── routes/
│       ├── listings.js        ← CRUD for product listings
│       ├── upload.js          ← Cloudinary image upload
│       ├── contact.js         ← Contact form submission
│       ├── admin.js           ← Admin-only operations
│       └── users.js           ← User profile management
├── .env.example               ← Environment variables template
├── package.json
└── README.md
```

---

## Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Create `.env` file
```bash
cp .env.example .env
# Fill in your values
```

### 3. Run in development
```bash
npm run dev
```
Server starts at **http://localhost:4000**

### 4. Run in production
```bash
npm start
```

---

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/listings` | Get all active listings |
| GET | `/api/listings/:id` | Get single listing |
| POST | `/api/contact` | Submit contact form |

### Auth Required (Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/listings` | Create listing |
| PATCH | `/api/listings/:id` | Update own listing |
| DELETE | `/api/listings/:id` | Remove own listing |
| POST | `/api/upload/image` | Upload single image |
| POST | `/api/upload/images` | Upload multiple images |
| DELETE | `/api/upload/image` | Delete image |
| GET | `/api/users/me` | Get own profile |
| PATCH | `/api/users/me` | Update own profile |
| GET | `/api/users/me/listings` | Get own listings |

### Admin Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/users` | All users |
| PATCH | `/api/admin/users/:id/ban` | Ban / unban user |
| PATCH | `/api/admin/users/:id/admin` | Promote / demote admin |
| GET | `/api/admin/listings` | All listings |
| PATCH | `/api/admin/listings/:id/deactivate` | Deactivate listing |
| GET | `/api/admin/messages` | Contact messages |
| PATCH | `/api/admin/messages/:id/read` | Mark message as read |
| GET | `/api/admin/activity` | Activity log |

---

## Authentication

All protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <supabase_access_token>
```

Get the token from the frontend via `supabase.auth.getSession()`.

---

## Rate Limits

| Type | Limit |
|------|-------|
| General API | 100 req / 15 min |
| Auth endpoints | 10 req / 15 min |
| File uploads | 20 req / hour |
| Contact form | 5 req / hour |
