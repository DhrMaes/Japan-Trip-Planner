# 🌸 Japan Trip Planner 🗾✨

A bespoke, aesthetic, and completely vibe-coded travel planning dashboard crafted to take the stress out of planning a multi-week Japan journey.

---

## ✨ The Architecture & Dev Setup

- ⚡ **Zero Local Installs Required**: Designed to run entirely inside a VS Code **Dev Container** (`.devcontainer/devcontainer.json`). Docker handles .NET 10, Node 22, Git, and all dependencies automatically with zero pollution on your host machine.
- 📁 **Clean Separation**:
  - **`src/JapanTripPlanner.App`**: React + Vite frontend workspace where your girlfriend can vibe-code the UI effortlessly.
  - **`src/JapanTripPlanner.Server`**: Fast, lightweight C# ASP.NET Core (.NET 10) backend for self-hosting static assets, file/photo uploads, and backup exports.
  - **🔥 Firebase Firestore**: Real-time cross-device data synchronization.
- 🐳 **Production-Ready Container**: Multi-stage Dockerfile bundling frontend build artifacts with ASP.NET Core Alpine runtime, deployable via GitHub Actions & Portainer.

---

## 🗾 Key Features

| Module | Description |
| :--- | :--- |
| 🗓️ **Day-by-Day Itinerary** | Journal-first daily itinerary with regional ideas, Wikimedia suggestions, completed activities, and camera roll photos. |
| 💴 **Budget & Currency Converter** | JPY expense tracking, category breakdown, and an adjustable yen-to-euro converter (with live FX rate integration). |
| 🧳 **Packing Checklist** | Categorized, editable packing lists for stress-free preparation. |
| 🚄 **Travel & Transport** | Flight, train, Shinkansen, and JR Pass records with PDF and document import. |
| 🏨 **Stays & Accommodations** | Hotel bookings by city, check-in/out schedules, price tracking, and photo attachments. |
| 🍜 **Food & Restaurant Wishlist** | Curated spots to eat and drink across Japan. |
| 🗣️ **Japanese Phrasebook** | Essential Japanese travel phrases with pronunciations and categories. |
| ⛅ **Weather & Mount Fuji Tracker** | 7-day live weather forecasts by city plus a dedicated Mount Fuji visibility indicator. |
| 💾 **Self-Hosted Uploads & Backups** | Image uploads and backup archive management via the backend server. |

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Lucide React, Tesseract.js (OCR), PDF.js.
- **Backend Service**: C# (.NET 10 / ASP.NET Core) serving static assets and handling multipart file uploads (`/api/upload`, `/api/images`, `/api/backup/export`, `/api/backup/import`).
- **Data Layer**: Cloud Firestore + local storage fallback.
- **Deployment**: Automated via GitHub Actions building to GitHub Container Registry (`ghcr.io`) and deploying to Portainer over WireGuard VPN.

---

## 🚀 Development via Dev Container (Recommended)

You do **not** need Node, npm, or .NET installed on your machine!

1. Open this repository in **VS Code**.
2. When prompted, click **"Reopen in Container"** (or press `F1` / `Ctrl+Shift+P` and choose `Dev Containers: Reopen in Container`).
3. Everything (.NET 10 SDK, Node 22, Docker-outside-of-docker, VS Code extensions) will be provisioned automatically inside the isolated container.

### Run inside Dev Container:

**Run the backend server:**
```bash
dotnet run --project src/JapanTripPlanner.Server
```
Open [http://localhost:8096](http://localhost:8096) in your browser.

**Or develop frontend with Vite hot-reload:**
```bash
cd src/JapanTripPlanner.App
npm run dev
```

---

## 🐳 Run with Docker Compose

```bash
docker compose up --build
```
Open [http://localhost:8096](http://localhost:8096) in your browser.

---

## 📁 Project Structure

```text
Japan-Trip-Planner/
├── .devcontainer/                    # VS Code Dev Container setup (.NET 10 + Node 22)
│   └── devcontainer.json
├── .github/
│   ├── dependabot.yml               # Weekly devcontainer dependency updates
│   └── workflows/
│       └── docker.yml               # GitHub Actions: build & Portainer deploy via WireGuard
├── .vscode/
│   ├── launch.json                  # VS Code debugging configurations
│   └── tasks.json                   # VS Code build & watch tasks
├── .dockerignore
├── .gitignore
├── Dockerfile                        # Multi-stage build (Node 22 + .NET 10 Alpine)
├── docker-compose.yml                # Docker Compose with persistent uploads volume
├── JapanTripPlanner.slnx             # .NET Solution file
├── README.md                         # Project documentation
├── firestore.rules                   # Firebase Firestore security rules
└── src/
    ├── JapanTripPlanner.App/         # 🌸 Frontend Workspace
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── index.html
    │   └── src/
    │       ├── App.jsx
    │       ├── main.jsx
    │       ├── styles.css
    │       ├── firebase.js
    │       ├── features/
    │       └── hooks/
    │
    └── JapanTripPlanner.Server/      # ⚡ C# ASP.NET Core Backend
        ├── Program.cs                # Static file server, /api/upload, /health & backups
        ├── appsettings.json          # Server & uploads directory configuration
        └── JapanTripPlanner.Server.csproj # .NET 10 Web Project
```