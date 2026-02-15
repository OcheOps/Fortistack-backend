# Backend API Contract Audit

## Authentication

### Login
- **Endpoint**: `POST /auth/login`
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "data": {
      "access_token": "string",
      "refresh_token": "string"
    },
    "error": null
  }
  ```

### Register (Admin Only)
- **Endpoint**: `POST /auth/register`
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string",
    "role": "string", 
    "tenant_id": "string?"
  }
  ```

### Refresh Token
- **Endpoint**: `POST /auth/refresh`
- **Request Body**:
  ```json
  {
    "refresh_token": "string"
  }
  ```
- **Response**:
  ```json
  {
    "data": {
      "access_token": "string"
    },
    "error": null
  }
  ```

## Tenants

### List Tenants
- **Endpoint**: `GET /tenants`
- **Response**:
  ```json
  {
    "data": [ ... ],
    "error": null
  }
  ```
