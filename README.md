# TowingHero

_A database-backed website for a 24-hour towing and roadside assistance service in Berlin._

[![Python: 3.12+](https://img.shields.io/badge/Python-3.12%2B-3776AB.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-Backend-000000.svg)](https://flask.palletsprojects.com/)
[![Bootstrap: 5.3](https://img.shields.io/badge/Bootstrap-5.3-7952B3.svg)](https://getbootstrap.com/)

---

## ✨ Overview

TowingHero is a modern, highly interactive, and database-backed web application built for an "Abschleppdienst" (towing service) in Berlin. It combines a public marketing site with a live cost calculator, an interactive service-area map, and a full admin dashboard for managing content without touching code.

- **No static content** — headlines, hours, FAQs, and reviews are all editable live from the admin dashboard.
- **No external map service dependency** — uses Leaflet.js with CartoDB Positron tiles, no API key required.
- **No hardcoded pricing** — the price calculator computes estimates from location surcharges and time-of-day rules stored in the app.

## 🚀 Features

- **Interactive Price Calculator** — A 3-step cost estimator on the homepage that calculates estimated towing, recovery, and key/start services based on location surcharges and time of day
- **Leaflet.js Map Integration** — An interactive service area map centered on Berlin, with custom markers for service stations (Mitte, Charlottenburg, Potsdam, Spandau, Köpenick, etc.), clickable popups, and a highlighted primary response zone
- **Secure Admin Dashboard** — Access-restricted management panel at `/static/admin/index.html` covering:
  - **Anfragen Inbox** — Real-time listing and read/unread toggles for contact form submissions and callback requests
  - **Leistungen & Texte** — Rich settings to change headlines, descriptions, company details, address, email, phone, and WhatsApp numbers
  - **Öffnungszeiten** — A dynamic scheduler for live updates of opening hours, with automatic closed/open badge changes on the site header
  - **FAQ Management** — Create, edit, re-order, and delete frequently asked questions instantly
  - **Kundenbewertungen** — Manage user testimonials (stars, reviews, locations) dynamically loaded on the start page
  - **Bilder Uploads** — File upload manager for replacing website Hero and Team banners directly
- **Granular DSGVO Cookie Banner** — A compliance consent banner allowing visitors to toggle essential, analytics, and marketing cookies
- **Floating WhatsApp Widget** — Clean mobile-friendly integration for instant chat connections with dynamic pre-filled text

## 📋 Requirements

- [Python 3.12+](https://www.python.org/)
- [uv](https://github.com/astral-sh/uv) *(recommended)* — extremely fast dependency installation, or standard pip/venv
- Flask, Flask-SQLAlchemy, and SQLite (bundled via project dependencies)

## 📦 Installation

### Option A — uv (recommended)

```bash
git clone <repository-url>
cd towinghero

uv run flask run --debug --host=0.0.0.0 --port=5000
```

### Option B — pip / venv

```bash
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

pip install -r pyproject.toml   # or install flask, flask-sqlalchemy, psycopg2-binary
flask run --debug --host=0.0.0.0 --port=5000
```

> Open your browser and navigate to `http://127.0.0.1:5000/` once the server is running.

## 🎛 Configuration

### Via the Admin Dashboard

Most site content is configured live through the UI rather than config files:

- Open `/static/admin/index.html` and log in (see [Admin Credentials](#-admin-credentials) below).
- Edit headlines, company details, opening hours, FAQs, reviews, and hero/team images directly — changes save immediately to the database.

### Via `app.py`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `ADMIN_USERNAME` | string | `admin` | Admin dashboard login username |
| `ADMIN_PASSWORD` | string | `admin123` | Admin dashboard login password |
| `SQLALCHEMY_DATABASE_URI` | string | local SQLite file | Database connection string (swap for Postgres via `psycopg2-binary` if needed) |
| `FLASK_RUN_PORT` | int | `5000` | Port the dev server listens on |

## 🔑 Admin Credentials

Log into the Admin Dashboard at `/static/admin/login.html`:

- **Username**: `admin`
- **Password**: `admin123`

> **Change these before deploying.** Update them in `app.py` / config — the defaults are for local development only.

## 🖼 Preview

<!-- Add a screenshot or GIF here, e.g. -->
<!-- ![TowingHero homepage](docs/preview.png) -->

_Feel free to add a screenshot of the homepage calculator and the admin dashboard._

## 🛠 Troubleshooting

| Problem | Solution |
| --- | --- |
| `flask run` command not found | Ensure the virtual environment is activated, or use `uv run flask run` |
| Map doesn't load | Check network access to CartoDB tile servers; no API key is needed but outbound internet access is required |
| Admin login fails | Confirm you're using the default credentials, or check if they were changed in `app.py` |
| Uploaded images don't appear | Verify the uploads directory is writable by the Flask process |
| Database changes not persisting | Confirm the SQLite file path is writable and not reset between restarts (e.g. ephemeral containers) |

## 💻 Development

### Project structure

```text
towinghero/
├── app.py                  # Flask app entrypoint, routes, admin auth, config
├── pyproject.toml          # Project dependencies
├── static/
│   ├── admin/
│   │   ├── index.html      # Admin dashboard UI
│   │   └── login.html      # Admin login page
│   ├── css/                # Vanilla CSS
│   ├── js/                 # Vanilla JS, Leaflet map logic, calculator logic
│   └── uploads/            # Hero/team banner uploads
├── templates/              # HTML5 templates (Bootstrap 5.3)
└── database/                # SQLite database file(s)
```

### How it works

- `app.py` serves the public site and the admin dashboard, and exposes the routes the admin UI calls to read/write content.
- Flask-SQLAlchemy models store services, pricing rules, opening hours, FAQs, reviews, and inbox submissions in SQLite.
- The homepage price calculator reads location surcharge and time-of-day rules from the database to compute live estimates.
- The Leaflet.js map renders service station markers and the primary response zone using CartoDB Positron tiles — no external API key required.
- The DSGVO cookie banner gates analytics/marketing scripts client-side until consent is given.

## 📄 [License](https://github.com/nimabio85/Towing-Website/commit/5f0f222f2d062519e7fc6356ae7893888afaf48e)

## 🙏 Acknowledgements

- [Flask](https://flask.palletsprojects.com/)
- [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/)
- [Leaflet.js](https://leafletjs.com/)
- [Bootstrap](https://getbootstrap.com/)
- [uv](https://github.com/astral-sh/uv) by Astral
