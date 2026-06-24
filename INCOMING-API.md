# Incoming Ticket API

External apps can push tickets into the system via `POST /api/tickets/incoming`.

## Setup

1. Run `database-setup.sql` in the Supabase SQL Editor.
2. Set `TICKETING_API_KEY` in `.env` to a strong random string.

## Endpoint

```
POST /api/tickets/incoming
```

### Headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `x-api-key` | Your `TICKETING_API_KEY` from `.env` |

### Request Body

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | Yes | Max 255 characters |
| `description` | string | Yes | Full issue description |
| `category` | string | Yes | Category name |
| `type` | string | No | Ticket type |
| `product` | string | No | Product name |
| `product_reference_number` | string | No | Reference number |
| `priority` | string | No | `LOW`, `MEDIUM` (default), `HIGH`, `URGENT` |
| `status` | string | No | `UNTOUCHED` (default), `PENDING`, `OPENED`, `SOLVED` |
| `tags` | string[] | No | Array of tag strings |
| `user_id` | string (UUID) | No* | Supabase user ID |
| `user_email` | string | No* | Email looked up in `tbl_users` |

*Either `user_id` or `user_email` must be provided.

### Success Response (201)

```json
{
  "success": true,
  "ticket": {
    "id": "uuid",
    "number": 1,
    "title": "Server down",
    "description": "API returning 500s",
    "category": "Infrastructure",
    "priority": "HIGH",
    "status": "UNTOUCHED",
    "user_id": "uuid",
    "created_at": "2026-06-24T06:30:00Z",
    "updated_at": "2026-06-24T06:30:00Z"
  }
}
```

### Error Responses

| Status | Body |
|--------|------|
| `401` | `{ "error": "Invalid or missing API key" }` |
| `400` | `{ "error": "title, description, and category are required" }` |
| `400` | `{ "error": "user_id or a valid user_email is required" }` |
| `500` | `{ "error": "Server configuration error" }` |

## Example

```bash
curl -X POST https://your-domain.com/api/tickets/incoming \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -d '{
    "title": "Server down",
    "description": "Production API returning 500s since 2pm",
    "category": "Infrastructure",
    "priority": "HIGH",
    "user_email": "client@example.com"
  }'
```

## Notes

- Uses Supabase service role key server-side only; never exposed to clients.
- If `user_email` is provided, the API looks up the matching user in `tbl_users` by email.
- If the email does not match any existing user, the request returns `400`.
