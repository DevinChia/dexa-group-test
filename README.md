# Dexa WFH Attendance System

A full-stack web application for managing Work From Home (WFH) employee attendance and HRD monitoring.

Employees can log in and submit daily attendance with photo evidence. HRD administrators can manage employee records and monitor submitted attendance.

## Features

### Employee
- Secure login and authentication.
- Submit daily attendance with photo evidence.
- Automatic attendance date and time capture by the server.
- View personal attendance status.
- Prevent duplicate attendance submissions on the same day.

### HRD Administrator
- Secure HRD login.
- Create and view employee records.
- Update employee information.
- Deactivate employee accounts.
- Monitor employee attendance records.
- Filter attendance records by date.
- View submitted attendance photo evidence.

## Technology Stack

### Backend
- TypeScript
- NestJS
- MySQL 8
- mysql2
- JWT Authentication
- bcrypt
- class-validator

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Architecture

The backend uses a **modular monolith architecture** with separate NestJS modules for different responsibilities.

| Module | Responsibility |
|---|---|
| Auth | Login, JWT authentication, and authorization |
| Employees | Employee management and account status |
| Attendance | Attendance submission, retrieval, and photo evidence |
| Database | MySQL connection and database access |

Each module has its own responsibilities while running within a single NestJS application.

The frontend communicates with the backend through REST APIs.

## Project Structure

```text
dexa-group-test/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── database/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── auth/
│   │   ├── pages/
│   │   └── ...
│   ├── .env.example
│   └── package.json
│
└── .gitignore
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- MySQL 8 or compatible MySQL server
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/DevinChia/dexa-group-test.git
cd dexa-group-test
```

### 2. Set Up the Database

Create the database:

```sql
CREATE DATABASE dexa_wfh_attendance;
```

Select the database:

```sql
USE dexa_wfh_attendance;
```

Create the employees table:

```sql
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('employee', 'hrd') NOT NULL DEFAULT 'employee',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);
```

Create the attendances table:

```sql
CREATE TABLE attendances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    attendance_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    photo_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attendance_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_employee_attendance
        UNIQUE (employee_id, attendance_date)
);
```

The unique constraint on `employee_id` and `attendance_date` ensures that an employee can only submit attendance once per day.

The foreign key uses `ON DELETE RESTRICT` to prevent employee records from being physically deleted while attendance records still reference them. Employee accounts are deactivated instead.

### 3. Set Up the Backend

Open a terminal:

```bash
cd backend
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Configure the database connection and JWT secret in `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=dexa_wfh_attendance
JWT_SECRET=your_secret_key
```

Replace the example values with your own database credentials. Use a strong, private JWT secret.

Create the directory for attendance photo uploads:

```bash
mkdir -p uploads/attendance
```

Start the backend:

```bash
npm run start:dev
```

The backend will run at:

`http://localhost:3000`

### 4. Initialize an HRD Account

HRD accounts are initialized manually in the database. Public employee registration is not available.

First, generate a bcrypt password hash from the backend directory:

```bash
node -e "require('bcrypt').hash('YourPasswordHere', 10).then(console.log)"
```

Copy the generated hash, then insert the HRD account into MySQL:

```sql
INSERT INTO employees (
    employee_number,
    name,
    email,
    password,
    role
)
VALUES (
    'HRD001',
    'HRD Administrator',
    'hrd@example.com',
    'PASTE_BCRYPT_HASH_HERE',
    'hrd'
);
```

Use the email and password you configured when logging in. Do not commit real credentials or password hashes to the repository.

### 5. Set Up the Frontend

Open another terminal from the repository root:

```bash
cd frontend
npm install
```

Create the frontend environment file:

```bash
cp .env.example .env
```

Configure the backend API URL in `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

The frontend will run at:

`http://localhost:5173`

## API Endpoints

All protected endpoints require a valid JWT access token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Authenticate an employee or HRD administrator |

### Employee Management

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/employees` | HRD | Create an employee |
| GET | `/employees` | HRD | Retrieve all employees |
| GET | `/employees/:id` | HRD | Retrieve an employee by ID |
| PATCH | `/employees/:id` | HRD | Update employee information |
| PATCH | `/employees/:id/deactivate` | HRD | Deactivate an employee account |

### Attendance

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/attendance` | Employee | Submit attendance with a photo |
| GET | `/attendance` | HRD | Retrieve all attendance records |
| GET | `/attendance/my` | Employee | Retrieve personal attendance for the current day |
| GET | `/attendance/:id/photo` | HRD / Attendance Owner | Retrieve attendance photo evidence |

For attendance submission, send a `multipart/form-data` request with the photo field named `photo`.

Photo uploads support JPEG, PNG, and WebP formats, with a maximum file size of 5 MB.

## Security and Validation

- Passwords are hashed using bcrypt before being stored.
- JWT authentication protects restricted API endpoints.
- Role-based authorization separates employee and HRD permissions.
- DTO validation is applied to incoming API requests.
- Inactive employees cannot log in.
- Attendance date and time are generated by the backend rather than supplied by the client.
- Duplicate daily attendance is prevented by a database unique constraint.
- Attendance photo retrieval requires authentication and ownership or HRD authorization.
- Employee deactivation preserves historical attendance records.

## Testing

The application was manually tested for the following scenarios:

- Successful and unsuccessful login attempts.
- Role-based access restrictions.
- Employee creation, retrieval, updating, and deactivation.
- Duplicate employee validation.
- Attendance submission and duplicate submission prevention.
- Personal and HRD attendance retrieval.
- Attendance photo upload and authenticated retrieval.
- Access restrictions for attendance photo evidence.
- Preservation of attendance history after employee deactivation.

## Build

Build the backend:

```bash
cd backend
npm run build
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Notes

- The backend and frontend run as separate development processes.
- Attendance photos are stored locally in `backend/uploads/attendance/` and are not tracked by Git.
- The upload directory must be created before starting the backend on a fresh clone.
- The backend CORS configuration currently allows the frontend development origin `http://localhost:5173`.
- Environment files containing actual credentials should never be committed to the repository.
