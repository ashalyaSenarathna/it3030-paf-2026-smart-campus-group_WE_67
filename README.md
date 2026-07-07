# 🏫 Smart Campus Operations Hub

> A production-inspired, role-based platform designed to manage university facilities, booking schedules, and maintenance operations. Built with **Spring Boot**, **React (Vite)**, and **MongoDB**, featuring secure local authentication alongside Google OAuth 2.0 integration.

---

## 🚀 Project Overview

The **Smart Campus Operations Hub** is a centralized platform designed to streamline campus management. It allows students, administrative staff, and maintenance technicians to interact seamlessly to locate, book, and maintain campus facilities and resources.

```
┌────────────────────────────────────────────────────────┐
│                     React Frontend                     │
│               (Vite + React Router + Axios)            │
└───────────────────────────┬────────────────────────────┘
                            │ (REST APIs, CORS Enabled)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  Spring Boot Backend                   │
│          (Spring Security + OAuth 2.0 Client)          │
└───────────────────────────┬────────────────────────────┘
                            │ (Spring Data MongoDB)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   MongoDB Database                     │
│                (Atlas / Local Instance)                │
└────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 👤 User Roles & Dashboard Access
- **Admin**: Full control over resource management (create, update, delete resources), review bookings (approve or reject with reasons), and view overall analytics.
- **Student**: View available resource catalogues, check availability calendars, book facilities (auditoriums, labs, study areas), and receive notifications.
- **Technician**: Manage resource statuses, receive specific notifications, view dashboard summaries, and update resource operational status.

### 📅 Booking & Facility Management
- **Resource Catalogue**: Interactive listing of campus locations categorized by type, capacity, description, location, and availability hours.
- **Booking Requests**: Secure request submission workflow (dates, timings, purpose, attendee count) with collision checks.
- **Approval System**: Interactive administrator dashboard to process requests and append review decisions.

### 🔒 Security & Auth
- **Dual Authentications**: Choice between secure local credential validation (encrypted via BCrypt) and Google OAuth 2.0 Single Sign-On (SSO).
- **Session & CORS Policies**: Stateful session cookies with HTTP-only cookies (`JSESSIONID`) and complete CORS configurations for client-server decoupling.

### 🔔 Notifications
- Real-time event notifications for booking actions (approvals, rejections, or modifications).
- Inline notification drawer to review and dismiss alerts.

---

## 🛠️ Technology Stack

### Backend
* **Language/Framework**: Java 17, Spring Boot 3.5.x
* **Database**: MongoDB (Spring Data MongoDB)
* **Security**: Spring Security (BCrypt, OAuth 2.0 Client, State-based Authentication)
* **Build System**: Maven
* **Utilities**: Lombok, Validation API

### Frontend
* **Core**: React 19 (JSX)
* **Build & Bundle**: Vite 8
* **Routing**: React Router DOM
* **Client-server**: Axios
* **Visualizations**: Recharts (for administrative metrics)

---

## ⚙️ Configuration & Setup

### Prerequisites
- [JDK 17 or higher](https://www.oracle.com/java/technologies/downloads/)
- [Node.js (v18+) & npm](https://nodejs.org/)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas) or a local MongoDB Server running.

---

### 🍃 Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```

2. Open `src/main/resources/application.properties` and customize the configuration properties:
   ```properties
   # MongoDB Connection
   spring.data.mongodb.uri=your_mongodb_connection_string

   # Server Port
   server.port=8085

   # Google OAuth 2.0 Settings
   spring.security.oauth2.client.registration.google.client-id=YOUR_CLIENT_ID
   spring.security.oauth2.client.registration.google.client-secret=YOUR_CLIENT_SECRET
   
   # Frontend URL configuration
   app.frontend.url=http://localhost:5173
   ```

3. Run the backend application:
   ```bash
   # Using Maven wrapper
   ./mvnw spring-boot:run
   ```
   The backend service will boot up and bind to **`http://localhost:8085`**.

---

### ⚛️ Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend application will boot up at **`http://localhost:5173`**.

---

## 💾 Database Seeding & Mock Credentials

The application includes an automated seeder (`DatabaseSeeder.java`) that creates default users and sample resources automatically on the first startup if they do not exist.

### 🔑 Seeded Accounts
You can log in to test role configurations using the following local accounts:

| Role | Username | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin@gmail.com` | `admin123` |
| **Technician** | `tech` | `tech@gmail.com` | `tech123` |
| **Student** | `student` | `student@gmail.com` | `student123` |

### 🏢 Seeded Resources
By default, the following campus facilities will be populated:
1. **Main Auditorium** (Lecture Hall, Cap: 500, Bldg A, Floor 1)
2. **Physics Lab 01** (Lab, Cap: 40, Bldg B, Floor 2)
3. **Conference Room B** (Meeting Room, Cap: 15, Bldg C, Floor 3)
4. **Indoor Sports Center** (Sports Facility, Cap: 100, Campus West Zone)
5. **Smart Classroom 402** (Lecture Hall, Cap: 60, Bldg D, Floor 4)

To manually force database reseeding at any time, execute a GET request on:
`http://localhost:8085/api/system/force-seed`

---

## 🔌 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
* `POST /api/auth/register` - Register a new user
* `POST /api/auth/login` - Authenticate local user credentials
* `POST /api/auth/logout` - Invalidate user session
* `GET /api/auth/user` - Fetch authenticated user details

### 🏢 Resource Management (`/api/resources`)
* `GET /api/resources` - Retrieve list of resources
* `POST /api/resources` - Create a new resource *(Admin/Technician)*
* `PUT /api/resources/{id}` - Update resource details
* `DELETE /api/resources/{id}` - Remove a resource *(Admin)*

### 📅 Booking Operations (`/api/bookings`)
* `POST /api/bookings` - Submit a booking request
* `GET /api/bookings` - List all bookings
* `GET /api/bookings/user/{userId}` - Retrieve bookings of a specific user
* `PUT /api/bookings/{id}/status` - Approve/Reject a booking with notes *(Admin)*

### 🔔 Notifications (`/api/notifications`)
* `GET /api/notifications` - Fetch list of user notifications
* `PUT /api/notifications/{id}/read` - Mark a specific notification as read

---

## 👥 Contributors
- **Group WE_146_3.1**
- Developed as part of the IT3030 PAF Module.
