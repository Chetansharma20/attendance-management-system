# Attendance Management System (MERN)

A modern, full-stack Attendance Management System that tracks employee attendance using location coordinates and live photo verification, utilizing role-based access control (RBAC), and basic workflow management (overtime & validation requests).

---

## 🚀 Features Implemented

### 1. Authentication & Authorization
* **Secure Signup & Login**: Implemented JWT-based authentication.
* **Role-Based Access Control (RBAC)**: Support for three distinct user roles: `employee`, `manager`, and `admin`.
* **Protected Routes**: Middleware on the backend and route guards on the React client ensure users only access authorized paths.

### 2. Attendance Tracking (Punch In / Punch Out)
* **Photo Verification**: Captures a live webcam selfie during both Punch In and Punch Out (with file uploads protected to prevent spoofing).
* **Location Capture**: Automatically tracks the exact latitude and longitude at the time of punching.
* **Duration Calculation**: Automatic tracking of shift duration (working hours).

### 3. Working Hours Logic
* **Standard Shift**: Defined as 8 hours.
* **Shift Completion Status**: Automatically computed:
  * `completed`: Worked $\ge$ 8 hours.
  * `incomplete`: Worked $<$ 8 hours.

### 4. Overtime (OT) Workflow
* **Retrospective Requests**: Employees can request overtime for any `completed` shift.
* **Management Review**: Managers/Admins can Approve or Reject requests with reason logs.
* **Real-time Status Sync**: Overtime approval state is linked directly to the attendance records and displayed in real-time.

### 5. Multi-Role Dashboards
* **Employee**: View personal attendance log, track overtime requests, and view cumulative working hours.
* **Manager**: View team members' attendance history, inspect verification details, and manage pending overtime requests.
* **Admin**: All manager features, plus system-wide statistics, managing users, and overseeing all attendance logs.

### 6. Attendance Validation & Remarks
* **Selfie Verification**: Admins and Managers can inspect Punch In/Out selfies and coordinates.
* **Status Updates**: Mark logs as `valid` or `invalid` (fake/suspicious) and add mandatory notes/remarks.

### 7. Daily Attendance Reports
* **Exportable PDF Reports**: Generates customized daily reports with formatting including selfies, locations, names, working hours, and validation statuses.
* **Access Control**: Role-filtered exports (Employees get their own, Managers get team data, Admins get system-wide data).

### 8. Premium UI Styling & Theme Customization
* **Vibrant Glassmorphism Design**: Sleek dark and light mode UI with smooth CSS variable-based styling, gradients, and micro-animations.
* **Light / Dark Mode Toggle**: Live theme toggle in header nav and login screen persisting settings in local storage.

---

## 🏗️ Architecture Overview

```
attendance-management-system/
├── attendance frontend/       # Frontend React application (Vite, Tailwind CSS, RTK Query)
│   ├── src/
│   │   ├── components/        # Reusable UI components (PunchPanel, StatCard, etc.)
│   │   ├── pages/             # Route pages (Dashboard, Login, Signup)
│   │   ├── redux/             # Redux Store and RTK Query APIs
│   │   └── routes/            # Route protections
│   │   └── context/           # Theme toggle context & hooks
└── attendance backend/        # Backend REST API (NodeJS, Express, MongoDB, Mongoose)
    ├── src/
    │   ├── controllers/       # Route request handlers
    │   ├── models/            # Mongoose Schemas (User, Attendance, Overtime)
    │   ├── routes/            # Express Router endpoints
    │   ├── services/          # Core business logic
    │   └── middleware/        # Security, Auth, Logging (Winston, Morgan)
```

---

## 🛠️ Setup Instructions

### Prerequisites
* Node.js (v16+)
* MongoDB database instance

### Backend Configuration
1. Open the directory: `cd "attendance backend"`
2. Install dependencies: `npm install`
3. Create a `.env` file in `attendance backend/` with the following variables:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_signature_secret
   ```
4. Run in dev mode: `npm run dev`

### Frontend Configuration
1. Open the directory: `cd "attendance frontend"`
2. Install dependencies: `npm install`
3. Create a `.env` file in `attendance frontend/` with the following variable:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   ```
4. Start the development server: `npm run dev`

---

## 📝 Assumptions Made
1. **Camera Permission**: The application assumes the client browser has given permission to access the webcam for live selfies.
2. **Standard Shift Definition**: The standard shift duration is fixed at 8 hours as per the assessment instructions.
3. **Retrospective Overtime**: Employees can only request overtime retrospectively after completing a full shift, avoiding concurrent active timer complications.
4. **Theme Preference**: The system defaults to dark mode upon first launch and caches user preference in local storage.
