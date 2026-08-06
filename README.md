# 🚀 NoDueNest

Smart Student Clearance & Hall Ticket Management Platform

A next-generation, **Multi-Tenant SaaS platform** designed to automate institutional clearance workflows. This system eliminates traditional paperwork, allowing students, mentors, and administrators to manage dues and hall tickets with surgical precision.

![Banner](https://img.shields.io/badge/Status-Live-emerald?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Tech-React_%7C_Fastify_%7C_Prisma-blueviolet?style=for-the-badge)

---

## 🌟 Key Features

### **1. Institutional Control Center (SuperAdmin)**
*   **Multi-Tenant Node Management**: Initialize and manage isolated partitions for multiple colleges.
*   **Global Activity Ledger**: Real-time audit trails across the entire platform.
*   **Support Mode (Impersonation)**: Securely troubleshoot user issues by assuming their session with one click.
*   **Node Lockdown**: Toggle maintenance mode for specific institutions.

### **2. Digital Clearance Workflow (Mentor/Staff)**
*   **Bulk Onboarding**: Import thousands of students instantly via Excel.
*   **Automated Fee Sync**: Intelligent detection and clearance of student dues.
*   **Digital Signatures**: Upload and manage signatures for automated document stamping.
*   **Real-time Announcements**: Broadcast campus-wide or department-specific alerts.

### **3. Student Command Center**
*   **Live Due Tracking**: Students can see their clearance status across all departments in real-time.
*   **Digital Hall Ticket**: Automated generation of QR-coded hall tickets upon 100% clearance.
*   **Smart Documentation**: Access to receipts and institutional materials.

---

## 🛠️ Technology Stack

- **Frontend**: React, Tailwind CSS, Framer Motion (Animations), Lucide React (Icons).
- **Backend**: Fastify (High-performance Node.js framework).
- **Database**: PostgreSQL with Prisma ORM.
- **Security**: JWT-based Authentication, Bcrypt hashing, and Role-Based Access Control (RBAC).

---

## ⚙️ Installation & Setup

### **Prerequisites**
- Node.js (v18+)
- PostgreSQL Database
- Git

### **1. Clone the Repository**
```bash
git clone https://github.com/PRAVEEN0E/Smart_no_due_clearance.git
cd "Smart no due clearance"
```

### **2. Backend Configuration**
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
DATABASE_URL="your_postgresql_url"
JWT_SECRET="your_secure_secret"
PORT=3000
```
Sync the database:
```bash
npx prisma db push
```

### **3. Frontend Configuration**
```bash
cd ../client
npm install
```

---

## 🚀 Running the Project

### **Start Backend Server**
```bash
cd server
npm run dev
```

### **Start Frontend Client**
```bash
cd client
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 🛣️ Roadmap
- [x] Multi-tenant Architecture
- [x] SuperAdmin Command Center
- [x] Institutional Maintenance Mode
- [x] Advanced Landing Page
- [ ] AI-Powered Student Risk Prediction
- [ ] Mobile QR Scanner for Staff
- [ ] WhatsApp/Email Notification Bridge

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ for Modern Institutions.**
