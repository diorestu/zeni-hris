# Mobile API (v1)

Base URL: `/api/mobile/v1`

## Authentication

### Login
- `POST /auth/login`
- Body:
```json
{
  "email": "user@example.com",
  "password": "password",
  "device_name": "android-app",
  "revoke_other_tokens": true
}
```

### Me
- `GET /auth/me`
- Header: `Authorization: Bearer <token>`

### Logout
- `POST /auth/logout`
- Header: `Authorization: Bearer <token>`

## Main Endpoints

All endpoints below require Bearer token.

- `GET /dashboard/summary?range=today|this_week|this_month`
- `GET /master/options`
- `GET /employees`
- `GET /employees/{employee}`

### Attendances
- `GET /attendances`
- `POST /attendances`
- `PUT /attendances/{employeeAttendance}`
- `DELETE /attendances/{employeeAttendance}`

### Leaves
- `GET /leaves`
- `POST /leaves`
- `PUT /leaves/{leave}`
- `DELETE /leaves/{leave}`

### Overtimes
- `GET /overtimes`
- `POST /overtimes`
- `PUT /overtimes/{overtime}`
- `DELETE /overtimes/{overtime}`

### Kasbon
- `GET /kasbons?period=YYYY-MM`
- `POST /kasbons`
- `PUT /kasbons/{employeeDeduction}`
- `DELETE /kasbons/{employeeDeduction}`

### Payroll
- `GET /payrolls/preview?period=YYYY-MM`
- `POST /payrolls/generate`
- `POST /payrolls/{payrollRun}/save`

## Response Pattern

Successful response:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Validation error (422):

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field": ["error message"]
  }
}
```
