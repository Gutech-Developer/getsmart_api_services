# 📘 GetSmart Backend Service

## 📖 Overview

GetSmart adalah sebuah platform e-learning berbasis web yang dirancang sebagai sistem pembelajaran digital adaptif. Platform ini merupakan pengembangan dari sistem sebelumnya yang dikenal dengan nama **GetMath** (nama lama), dengan tujuan untuk menyediakan pengalaman belajar yang lebih cerdas, terukur, dan berbasis data.

Berbeda dengan Learning Management System (LMS) konvensional, GetSmart tidak hanya menyediakan materi pembelajaran dan evaluasi, tetapi juga:

* Mengumpulkan dan menganalisis **data emosi siswa**
* Mengukur **keterlibatan belajar (engagement)**
* Menyediakan **evaluasi diagnostik dan remedial adaptif**
* Memberikan **feedback otomatis secara real-time**
* Menyajikan **Learning Analytics Dashboard (LAD)**

Sistem ini digunakan oleh beberapa peran utama:

* **Siswa** → belajar, mengerjakan materi, tes, dan berinteraksi
* **Guru** → mengelola materi, tes, dan memantau siswa
* **Orang Tua** → memonitor perkembangan anak
* **Admin** → mengelola sistem secara keseluruhan

---

## 🎯 Core System Goals

Backend ini dibangun untuk mendukung:

1. Analisis kondisi emosi siswa selama pembelajaran dan evaluasi
2. Tracking aktivitas belajar (time spent, progress, engagement)
3. Sistem evaluasi diagnostik + remedial adaptif
4. Feedback real-time berbasis kondisi siswa
5. Penyediaan data untuk Learning Analytics Dashboard (LAD)

---

## 🧩 Core Modules

Berikut adalah modul utama yang harus didukung oleh back    end:

### 1. Emotion Tracking Module

* Mendeteksi dan menyimpan data emosi siswa
* Terintegrasi dengan aktivitas belajar dan tes

### 2. Student Engagement Module

* Tracking aktivitas:

  * membaca materi
  * mengerjakan tes
  * navigasi sistem
* Logging seluruh aktivitas user

### 3. Diagnostic & Remedial Test Module

* Pre-test (diagnostic)
* Remedial otomatis jika nilai di bawah passing grade
* Max 2 kali remedial
* Nilai tertinggi menjadi final score

### 4. Feedback System

* Feedback real-time berbasis emosi
* Digunakan saat pengerjaan tes

### 5. Learning Analytics Dashboard (LAD)

* Visualisasi:

  * performa siswa
  * emosi
  * engagement
* Digunakan oleh guru, orang tua, dan admin

### 6. Course & Content Management

* Course / kelas
* Materi (PDF interaktif + E-LKPD)
* Tes diagnostik

### 7. Discussion Forum

* Diskusi siswa ↔ guru
* Thread, reply, like

### 8. AI Chatbot

* Pendamping belajar siswa
* Konteks berdasarkan materi course

---

## 🏗️ Tech Stack

Backend ini dibangun menggunakan:

* **Node.js + Express.js** → REST API server
* **PostgreSQL** → database utama
* **Sequelize ORM** → database abstraction
* **Zod** → schema validation
* **JWT** → authentication

### Environment Variable

```env
PORT=
JWT_SECRET=
INTERNAL_API_SECRET=
DB_URI=
NODE_ENV=
```

---

## 📦 Dependencies

### Production Dependencies

```json
{
  "bcryptjs": "^3.0.2",
  "body-parser": "^2.2.0",
  "cors": "^2.8.5",
  "dotenv": "^16.5.0",
  "express": "^5.1.0",
  "express-rate-limit": "^8.3.1",
  "helmet": "^8.1.0",
  "hpp": "^0.2.3",
  "jsonwebtoken": "^9.0.2",
  "pg": "^8.20.0",
  "pg-hstore": "^2.3.4",
  "sequelize": "^6.37.8",
  "zod": "^4.3.6"
}
```

### Development Dependencies

```json
{
  "@types/body-parser": "^1.19.6",
  "@types/cors": "^2.8.18",
  "@types/express": "^5.0.2",
  "@types/hpp": "^0.2.7",
  "@types/jsonwebtoken": "^9.0.9",
  "@types/node": "^22.15.21",
  "@types/pg": "^8.20.0",
  "@types/sequelize": "^6.12.0",
  "nodemon": "^3.1.10",
  "tsx": "^4.19.4",
  "typescript": "^5.8.3"
}
```

---

## 🧠 Coding Guidelines (IMPORTANT)

> ⚠️ Section ini WAJIB diikuti oleh semua developer dan AI agent (Copilot, dll)

### 1. Language & Paradigm

* Gunakan **TypeScript**
* Gunakan pendekatan **Object-Oriented Programming (OOP)**

### 2. Function Style

* Semua function WAJIB menggunakan **arrow function**

```ts
const exampleFunction = async (): Promise<void> => {
  // implementation
};
```

---

### 3. Project Structure

* Penempatan file HARUS sesuai dengan struktur folder yang sudah dibuat
* Dilarang menaruh logic secara acak

---

### 4. Best Practices

* Ikuti best practices backend development
* Gunakan:

  * clean architecture (disarankan)
  * reusable code
  * modular structure

---

### 5. Types & Interfaces

* Gunakan `interface` dan `type` secara jelas dan terstruktur
* Hindari penggunaan `any`
* Semua data contract HARUS didefinisikan

```ts
interface IUser {
  id: string;
  name: string;
  email: string;
}
```

---

### 6. Validation

* Gunakan **Zod** untuk semua validation request
* Validation HARUS berada di layer terpisah

---

### 7. Security

* Gunakan:

  * JWT untuk authentication (Access token dan Refresh token)
  * bcrypt untuk hashing password
  * helmet, hpp, rate-limit untuk keamanan

---

## 🔐 Authentication System

* Email & Password
* Google OAuth
* Email Magic Link

---

## 📡 API Design

* Gunakan **RESTful API**
* Standard:

  * `GET /resources`
  * `POST /resources`
  * `PUT /resources/:id`
  * `DELETE /resources/:id`


---

## 🚀 Development Notes for AI Agents

* Selalu baca README ini sebelum generate code
* Ikuti:

  * TypeScript strict typing
  * OOP pattern
  * folder structure
* Jangan membuat code di luar arsitektur yang sudah ditentukan
* Pastikan setiap fitur:

  * scalable
  * maintainable
  * testable

---

## 📌 Final Notes

Backend ini bukan sekadar API biasa, tetapi merupakan sistem yang:

* Data-driven
* Adaptive learning system
* Terintegrasi dengan analitik dan AI

Semua implementasi harus mempertimbangkan:

* scalability
* data consistency
* performance
* future integration (AI, analytics, dll)

---
