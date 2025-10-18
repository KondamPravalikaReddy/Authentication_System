# Multi-Role Authentication System

A secure Node.js for user authentication and authorization supporting Admin, Manager, User, and Guest roles with JWT. Designed for modular integration, clear permission hierarchy, and robust REST endpoints.

Table of Contents

- About
- Features  
- Getting Started  
- Prerequisites 
- Installation  
- Usage  
- API Endpoints
- Roles & Permissions 
- Test Credentials  
- Environment Variablels  
- Error Handling
- ScreenShot 

About

Multi-Role Authentication System provides strong role-based access control using JWTs, with customizable routes and permission middleware for modern web applications.

Features

- JWT authentication and secure password hashing
- Multiple roles: Admin, Manager, User, Guest
- Role hierarchy and permission checks (read, write, delete, manage)
- RESTful API: login, registration, profiles, teams, users
- In-memory sample user database (replaceable with persistent DB)
- Structured and consistent error handling

Getting Started

Prerequisites

- Node.js 
- npm

Installation:

npm init -y
npm install express jsonwebtoken bcryptjs body-parser

Start the server:

node server.js

Usage:

API hosted at: http://localhost:3000

List all available endpoints: GET /api/routes

Use provided credentials for authentication and testing

API Endpoints:

| Method | Endpoint            | Role          | Description                        |
| ------ | ------------------- | ------------- | ---------------------------------- |
| POST   | /api/auth/login     | All           | Login and receive JWT token        |
| POST   | /api/auth/register  | Admin         | Register a new user                |
| GET    | /api/auth/profile   | Authenticated | Get profile of current user        |
| POST   | /api/auth/verify    | Authenticated | Verify a JWT token                 |
| POST   | /api/auth/refresh   | Authenticated | Refresh a JWT token                |
| GET    | /api/public         | Public        | Public endpoint, no authentication |
| GET    | /api/user/dashboard | User          | User dashboard                     |
| GET    | /api/manager/team   | Manager/Admin | Manager's team overview            |
| GET    | /api/admin/users    | Admin         | List all users                     |
| POST   | /api/content/create | Write perm.   | Create new content                 |
| DELETE | /api/content/:id    | Level >=2     | Delete content by ID               |

Roles & Permissions:

| Role    | Level | Permissions                                      |
| ------- | ----- | ------------------------------------------------ |
| Admin   | 3     | read, write, delete, manage_users, manage_system |
| Manager | 2     | read, write, manage_team                         |
| User    | 1     | read                                             |
| Guest   | 0     | None                                             |

Test Credentials:

Admin: username: admin, password: admin123

Manager: username: manager, password: manager123

User: username: user, password: user123

Error Handling:

All errors return JSON:

{
  "success": false,
  "message": "Error description"
}

Screenshots : 
<img width="1919" height="1009" alt="Screenshot 2025-10-18 173732" src="https://github.com/user-attachments/assets/c9c35a81-b747-4de1-8e04-bb5f50632a0e" />



<img width="1919" height="936" alt="Screenshot 2025-10-18 174550" src="https://github.com/user-attachments/assets/8abc4e48-b4a6-43e0-af44-f64a2167ece3" />



<img width="1919" height="940" alt="Screenshot 2025-10-18 174630" src="https://github.com/user-attachments/assets/1796ee09-cb1d-4133-b1dd-85aec37023f1" />



<img width="1919" height="939" alt="Screenshot 2025-10-18 174752" src="https://github.com/user-attachments/assets/f93aea3c-cc26-4ed1-be6b-88bdceca8617" />

