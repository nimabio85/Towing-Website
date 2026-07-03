# TowingHero — Abschleppdienst Berlin Website

A modern, highly interactive, and database-backed web application for a 24-hour towing and roadside assistance service in Berlin. 

## Key Features

- **Interactive Price Calculator**: A 3-step cost estimator directly on the homepage allowing users to calculate estimated towing, recovery, and key/start services based on location surcharges and time of day.
- **Leaflet.js Map Integration**: An interactive service area map centered on Berlin. Includes custom map markers for service stations (Mitte, Charlottenburg, Potsdam, Spandau, Köpenick, etc.) with clickable popups, and a highlighted primary response zone.
- **Secure Admin Dashboard**: Access-restricted management panel (`/static/admin/index.html`) featuring:
  - **Anfragen Inbox**: Real-time listing and read/unread toggles for contact form submissions and callback requests.
  - **Leistungen & Texte**: Rich settings to change headlines, descriptions, company details, address, email, phone, and WhatsApp numbers.
  - **Öffnungszeiten**: A dynamic scheduler allowing live updates of opening hours and automatic closed/open badge changes on the site header.
  - **FAQ Management**: Create, edit, re-order, and delete frequently asked questions instantly.
  - **Kundenbewertungen**: Manage user testimonials (stars, reviews, locations) dynamically loaded on the start page.
  - **Bilder Uploads**: File upload manager for replacing website Hero and Team banners directly.
- **Granular DSGVO Cookie Banner**: A compliance consent banner allowing visitors to toggle essential, analytics, and marketing cookies.
- **Floating WhatsApp Widget**: Clean mobile-friendly integration for instant chat connections with dynamic pre-filled text.

## Tech Stack

- **Backend**: Python 3.12, Flask, Flask-SQLAlchemy (ORM), SQLite (local database persistence).
- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript, Bootstrap 5.3, CartoDB Positron mapping layout via Leaflet.js.

## Getting Started

### Prerequisites

You need Python 3.12+ installed on your machine. The [uv](https://github.com/astral-sh/uv) package manager is recommended for extremely fast dependency installation.

### Local Installation & Run

1. Clone or download the repository.
2. Open terminal in the directory.
3. Install dependencies and start the app:
   ```bash
   uv run flask run --debug --host=0.0.0.0 --port=5000
   ```
   *(Alternatively, use standard pip/venv)*:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r pyproject.toml  # or install flask, flask-sqlalchemy, psycopg2-binary
   flask run --debug --host=0.0.0.0 --port=5000
   ```
4. Open your browser and navigate to `http://127.0.0.1:5000/`.

### Admin Credentials

To log into the Admin Dashboard (`/static/admin/login.html`):
- **Username**: `admin`
- **Password**: `admin123`
*(Can be updated in `app.py` / `config` if needed)*
