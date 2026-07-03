import os
import json
import logging
from datetime import datetime
from flask import Flask, render_template, request, flash, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.utils import secure_filename

logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-prod")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

database_url = os.environ.get("DATABASE_URL", "sqlite:///abschleppdienst.db")
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_recycle": 300, "pool_pre_ping": True}
app.config["UPLOAD_FOLDER"] = os.path.join("static", "uploads")
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB

db.init_app(app)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}

# ─────────────────────────────────────────────────────────────────────────────
# DEFAULT DATA
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_CONTENT = {
    'headline': '24h Abschleppdienst in Berlin',
    'subheadline': 'Schnell. Zuverlässig. Rund um die Uhr.',
    'phoneNumber': '+49 30 123 456 789',
    'whatsappNumber': '+49 30 123 456 789',
    'companyName': 'Abschleppdienst Berlin',
    'address': 'Musterstraße 123\n12345 Berlin',
    'email': 'info@abschleppdienst-berlin.de',
    'hero_image': None,
    'team_image': None,
    'services': [
        {'id': 1, 'title': 'Pannenhilfe', 'description': 'Schnelle Hilfe bei Autopannen. Unser erfahrenes Team ist 24/7 für Sie da und löst Ihr Problem direkt vor Ort.', 'icon': 'fas fa-tools'},
        {'id': 2, 'title': 'Unfallbergung', 'description': 'Professionelle Bergung nach Unfällen. Wir kümmern uns um die sichere Bergung Ihres Fahrzeugs.', 'icon': 'fas fa-car-crash'},
        {'id': 3, 'title': 'Abschleppdienst', 'description': 'Zuverlässiger Transport Ihres Fahrzeugs zur Werkstatt oder zum gewünschten Zielort.', 'icon': 'fas fa-truck'},
        {'id': 4, 'title': 'Falschparker entfernen', 'description': 'Rechtssichere Entfernung von Falschparkern auf Ihrem Privatgelände oder Firmenparkplatz.', 'icon': 'fas fa-car'},
        {'id': 5, 'title': 'Batterie-Starthilfe', 'description': 'Schnelle Starthilfe bei leerer Batterie. Wir bringen Ihr Fahrzeug wieder zum Laufen.', 'icon': 'fas fa-battery-half'},
    ]
}

DEFAULT_HOURS = {
    'always_24h': True,
    'days': {
        'monday':    {'label': 'Montag',     'is_open': True, 'is_24h': True, 'open': '08:00', 'close': '20:00'},
        'tuesday':   {'label': 'Dienstag',   'is_open': True, 'is_24h': True, 'open': '08:00', 'close': '20:00'},
        'wednesday': {'label': 'Mittwoch',   'is_open': True, 'is_24h': True, 'open': '08:00', 'close': '20:00'},
        'thursday':  {'label': 'Donnerstag', 'is_open': True, 'is_24h': True, 'open': '08:00', 'close': '20:00'},
        'friday':    {'label': 'Freitag',    'is_open': True, 'is_24h': True, 'open': '08:00', 'close': '20:00'},
        'saturday':  {'label': 'Samstag',    'is_open': True, 'is_24h': True, 'open': '08:00', 'close': '20:00'},
        'sunday':    {'label': 'Sonntag',    'is_open': True, 'is_24h': True, 'open': '08:00', 'close': '20:00'},
    }
}

DEFAULT_TESTIMONIALS = [
    {'name': 'Thomas K.', 'location': 'Berlin Mitte', 'rating': 5, 'text': 'Super schnelle Hilfe! Mein Auto war nach einem Platten innerhalb von 20 Minuten abgeschleppt. Sehr freundliches Team und faire Preise. Klare Empfehlung!'},
    {'name': 'Sandra M.', 'location': 'Berlin Charlottenburg', 'rating': 5, 'text': 'Mitten in der Nacht liegengeblieben und innerhalb kürzester Zeit war der Pannendienst da. Professionell und günstig — ich bin sehr zufrieden!'},
    {'name': 'Mehmet A.', 'location': 'Berlin Kreuzberg', 'rating': 5, 'text': 'Unfallbergung nach einem Auffahrunfall. Der Service war ruhig, effizient und hat mir in einer stressigen Situation sehr geholfen. Danke!'},
    {'name': 'Julia R.', 'location': 'Potsdam', 'rating': 4, 'text': 'Starthilfe am frühen Morgen vor der Arbeit. Kam innerhalb von 25 Minuten, hat alles schnell erledigt. Preis-Leistung stimmt. Gerne wieder!'},
]

DEFAULT_FAQS = [
    {'question': 'Wie schnell sind Sie vor Ort?', 'answer': 'Unsere durchschnittliche Reaktionszeit in Berlin beträgt 15–30 Minuten. In der Innenstadt oft noch schneller. Sobald Sie anrufen, nennen wir Ihnen eine genaue Schätzung für Ihren Standort.', 'sort_order': 1},
    {'question': 'Was kostet ein Abschleppvorgang?', 'answer': 'Die Kosten richten sich nach Einsatzart, Entfernung und Uhrzeit. Nutzen Sie unseren Preisrechner für eine unverbindliche Schätzung, oder rufen Sie uns an — wir nennen Ihnen immer vorab einen transparenten Preis ohne versteckte Gebühren.', 'sort_order': 2},
    {'question': 'Sind Sie wirklich rund um die Uhr erreichbar?', 'answer': 'Ja! Wir sind 24 Stunden täglich, 7 Tage die Woche, 365 Tage im Jahr für Sie da — auch an Feiertagen, nachts und am Wochenende. Im Notfall zögern Sie nicht anzurufen.', 'sort_order': 3},
    {'question': 'Welche Fahrzeugtypen schleppen Sie ab?', 'answer': 'Wir schleppen alle gängigen Fahrzeugtypen: PKW, Transporter, Motorräder, Wohnmobile und leichte LKW. Bei sehr schweren Fahrzeugen sprechen Sie uns bitte vorab an.', 'sort_order': 4},
    {'question': 'Was passiert nach einem Unfall?', 'answer': 'Rufen Sie sofort die Polizei (110) und uns an. Wir sichern die Unfallstelle ab, kümmern uns um die Bergung Ihres Fahrzeugs und transportieren es in die Werkstatt Ihrer Wahl. Wir arbeiten auch mit Versicherungen zusammen.', 'sort_order': 5},
    {'question': 'Kann ich auch per WhatsApp kontaktieren?', 'answer': 'Für nicht dringende Anfragen und Kostenvoranschläge können Sie uns per WhatsApp kontaktieren. Bei einem Notfall rufen Sie bitte immer telefonisch an, damit wir sofort reagieren können.', 'sort_order': 6},
    {'question': 'Arbeiten Sie mit Versicherungen zusammen?', 'answer': 'Ja, wir stellen Ihnen auf Wunsch eine detaillierte Rechnung aus, die Sie bei Ihrer Kfz-Versicherung oder ADAC einreichen können. Klären Sie vorab mit Ihrer Versicherung, welche Leistungen übernommen werden.', 'sort_order': 7},
    {'question': 'Wie weit ist Ihr Einsatzgebiet?', 'answer': 'Wir sind in ganz Berlin sowie im Berliner Umland aktiv. Das umfasst alle 12 Berliner Bezirke sowie angrenzende Städte in Brandenburg wie Potsdam, Oranienburg und Strausberg.', 'sort_order': 8},
]

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def load_website_content():
    try:
        with open('content.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return DEFAULT_CONTENT.copy()

def save_website_content(content):
    try:
        with open('content.json', 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        logging.error(f"Error saving content: {e}")
        return False

def load_hours():
    try:
        with open('hours.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return DEFAULT_HOURS.copy()

def save_hours(data):
    try:
        with open('hours.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        logging.error(f"Error saving hours: {e}")
        return False

def get_open_status(hours_data):
    """Return (is_open: bool, label: str)"""
    if hours_data.get('always_24h', True):
        return True, '24/7 Geöffnet'
    try:
        try:
            from zoneinfo import ZoneInfo
            now = datetime.now(ZoneInfo('Europe/Berlin'))
        except Exception:
            from datetime import timezone, timedelta
            now = datetime.now(timezone(timedelta(hours=2)))

        day_keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        today_key = day_keys[now.weekday()]
        day = hours_data.get('days', {}).get(today_key, {})

        if not day.get('is_open', False):
            return False, 'Heute geschlossen'
        if day.get('is_24h', False):
            return True, '24 Stunden geöffnet'

        open_t  = day.get('open', '08:00')
        close_t = day.get('close', '20:00')
        now_str = now.strftime('%H:%M')
        if open_t <= now_str <= close_t:
            return True, f'Geöffnet bis {close_t} Uhr'
        elif now_str < open_t:
            return False, f'Öffnet um {open_t} Uhr'
        else:
            return False, 'Heute geschlossen'
    except Exception:
        return True, '24/7 Geöffnet'

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_unread_counts():
    try:
        from models import ContactSubmission, CallbackRequest
        contacts  = ContactSubmission.query.filter_by(is_read=False).count()
        callbacks = CallbackRequest.query.filter_by(is_read=False).count()
        return contacts + callbacks
    except Exception:
        return 0

# ─────────────────────────────────────────────────────────────────────────────
# CONTEXT PROCESSOR — inject into every template
# ─────────────────────────────────────────────────────────────────────────────

@app.context_processor
def inject_globals():
    hours_data = load_hours()
    is_open, hours_label = get_open_status(hours_data)
    return dict(
        is_open=is_open,
        hours_label=hours_label,
        unread_count=get_unread_counts(),
    )

# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    from models import Testimonial
    content = load_website_content()
    testimonials = Testimonial.query.filter_by(active=True).order_by(Testimonial.created_at.desc()).limit(6).all()
    return render_template('index.html', content=content, testimonials=testimonials)

@app.route('/leistungen')
def leistungen():
    content = load_website_content()
    return render_template('leistungen.html', content=content)

@app.route('/ueber-uns')
def ueber_uns():
    content = load_website_content()
    return render_template('ueber_uns.html', content=content)

@app.route('/kontakt', methods=['GET', 'POST'])
def kontakt():
    from models import ContactSubmission
    content = load_website_content()
    if request.method == 'POST':
        name    = request.form.get('name', '').strip()
        email   = request.form.get('email', '').strip()
        phone   = request.form.get('phone', '').strip()
        subject = request.form.get('subject', '').strip()
        message = request.form.get('message', '').strip()

        if not all([name, email, message]):
            flash('Bitte füllen Sie alle Pflichtfelder aus.', 'error')
        else:
            try:
                submission = ContactSubmission(
                    name=name, email=email, phone=phone,
                    subject=subject, message=message
                )
                db.session.add(submission)
                db.session.commit()
                flash('Vielen Dank für Ihre Nachricht! Wir melden uns schnellstmöglich bei Ihnen.', 'success')
                return redirect(url_for('kontakt'))
            except Exception as e:
                logging.error(f"Error saving contact submission: {e}")
                flash('Fehler beim Senden. Bitte rufen Sie uns direkt an.', 'error')
    return render_template('kontakt.html', content=content)

@app.route('/impressum')
def impressum():
    content = load_website_content()
    return render_template('impressum.html', content=content)

@app.route('/datenschutz')
def datenschutz():
    content = load_website_content()
    return render_template('datenschutz.html', content=content)

@app.route('/faq')
def faq():
    from models import FAQ
    content = load_website_content()
    faqs = FAQ.query.filter_by(active=True).order_by(FAQ.sort_order.asc()).all()
    return render_template('faq.html', content=content, faqs=faqs)

@app.route('/preisrechner')
def preisrechner():
    content = load_website_content()
    return render_template('preisrechner.html', content=content)

# ─────────────────────────────────────────────────────────────────────────────
# ADMIN ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/admin')
@app.route('/admin/')
def admin_redirect():
    return redirect('/static/admin/login.html')

# ─────────────────────────────────────────────────────────────────────────────
# API — CONTENT
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/content', methods=['GET'])
def get_content():
    return jsonify(load_website_content())

@app.route('/api/content', methods=['POST'])
def update_content():
    try:
        new_content = request.get_json()
        if not new_content or 'headline' not in new_content:
            return jsonify({'error': 'Invalid content data'}), 400
        if save_website_content(new_content):
            return jsonify({'success': True})
        return jsonify({'error': 'Failed to save content'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/content/reset', methods=['POST'])
def reset_content():
    try:
        if save_website_content(DEFAULT_CONTENT.copy()):
            return jsonify({'success': True})
        return jsonify({'error': 'Failed to reset content'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# API — CALLBACK REQUESTS
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/callback', methods=['POST'])
def save_callback():
    from models import CallbackRequest
    try:
        data = request.get_json()
        name      = (data.get('name') or '').strip()
        phone     = (data.get('phone') or '').strip()
        best_time = (data.get('best_time') or '').strip()
        if not name or not phone:
            return jsonify({'error': 'Name und Telefon erforderlich'}), 400
        cb = CallbackRequest(name=name, phone=phone, best_time=best_time)
        db.session.add(cb)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        logging.error(f"Callback error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/callbacks', methods=['GET'])
def get_callbacks():
    from models import CallbackRequest
    try:
        items = CallbackRequest.query.order_by(CallbackRequest.created_at.desc()).all()
        return jsonify([i.to_dict() for i in items])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/callbacks/<int:item_id>/read', methods=['POST'])
def mark_callback_read(item_id):
    from models import CallbackRequest
    try:
        item = CallbackRequest.query.get_or_404(item_id)
        item.is_read = True
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/callbacks/<int:item_id>', methods=['DELETE'])
def delete_callback(item_id):
    from models import CallbackRequest
    try:
        item = CallbackRequest.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# API — CONTACT SUBMISSIONS
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/submissions', methods=['GET'])
def get_submissions():
    from models import ContactSubmission
    try:
        items = ContactSubmission.query.order_by(ContactSubmission.created_at.desc()).all()
        return jsonify([i.to_dict() for i in items])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submissions/<int:item_id>/read', methods=['POST'])
def mark_submission_read(item_id):
    from models import ContactSubmission
    try:
        item = ContactSubmission.query.get_or_404(item_id)
        item.is_read = True
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submissions/<int:item_id>', methods=['DELETE'])
def delete_submission(item_id):
    from models import ContactSubmission
    try:
        item = ContactSubmission.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# API — TESTIMONIALS
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/testimonials', methods=['GET'])
def get_testimonials():
    from models import Testimonial
    try:
        items = Testimonial.query.order_by(Testimonial.created_at.desc()).all()
        return jsonify([i.to_dict() for i in items])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/testimonials', methods=['POST'])
def add_testimonial():
    from models import Testimonial
    try:
        data = request.get_json()
        t = Testimonial(
            name=data.get('name', '').strip(),
            location=data.get('location', '').strip(),
            rating=int(data.get('rating', 5)),
            text=data.get('text', '').strip(),
            active=data.get('active', True),
        )
        db.session.add(t)
        db.session.commit()
        return jsonify({'success': True, 'id': t.id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/testimonials/<int:item_id>', methods=['PATCH'])
def update_testimonial(item_id):
    from models import Testimonial
    try:
        item = Testimonial.query.get_or_404(item_id)
        data = request.get_json()
        if 'name'     in data: item.name     = data['name']
        if 'location' in data: item.location = data['location']
        if 'rating'   in data: item.rating   = int(data['rating'])
        if 'text'     in data: item.text     = data['text']
        if 'active'   in data: item.active   = bool(data['active'])
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/testimonials/<int:item_id>', methods=['DELETE'])
def delete_testimonial(item_id):
    from models import Testimonial
    try:
        item = Testimonial.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# API — FAQ
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/faq', methods=['GET'])
def get_faq():
    from models import FAQ
    try:
        items = FAQ.query.order_by(FAQ.sort_order.asc()).all()
        return jsonify([i.to_dict() for i in items])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/faq', methods=['POST'])
def add_faq():
    from models import FAQ
    try:
        data = request.get_json()
        f = FAQ(
            question=data.get('question', '').strip(),
            answer=data.get('answer', '').strip(),
            sort_order=int(data.get('sort_order', 0)),
            active=data.get('active', True),
        )
        db.session.add(f)
        db.session.commit()
        return jsonify({'success': True, 'id': f.id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/faq/<int:item_id>', methods=['PATCH'])
def update_faq(item_id):
    from models import FAQ
    try:
        item = FAQ.query.get_or_404(item_id)
        data = request.get_json()
        if 'question'   in data: item.question   = data['question']
        if 'answer'     in data: item.answer     = data['answer']
        if 'sort_order' in data: item.sort_order = int(data['sort_order'])
        if 'active'     in data: item.active     = bool(data['active'])
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/faq/<int:item_id>', methods=['DELETE'])
def delete_faq(item_id):
    from models import FAQ
    try:
        item = FAQ.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# API — OPENING HOURS
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/hours', methods=['GET'])
def get_hours():
    return jsonify(load_hours())

@app.route('/api/hours', methods=['POST'])
def update_hours():
    try:
        data = request.get_json()
        if save_hours(data):
            return jsonify({'success': True})
        return jsonify({'error': 'Failed to save hours'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# API — IMAGE UPLOAD
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/upload', methods=['POST'])
def upload_image():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Keine Datei übermittelt'}), 400
        file = request.files['file']
        slot = request.form.get('slot', 'hero_image')  # hero_image or team_image
        if file.filename == '':
            return jsonify({'error': 'Keine Datei ausgewählt'}), 400
        if not allowed_file(file.filename):
            return jsonify({'error': 'Dateiformat nicht erlaubt (nur JPG, PNG, WebP, GIF)'}), 400

        ext      = file.filename.rsplit('.', 1)[1].lower()
        filename = secure_filename(f"{slot}.{ext}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Update content.json with new image path
        content = load_website_content()
        content[slot] = f"uploads/{filename}"
        save_website_content(content)

        return jsonify({'success': True, 'url': f"/static/uploads/{filename}", 'slot': slot})
    except Exception as e:
        logging.error(f"Upload error: {e}")
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# API — CHATBOT
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = (data.get('message', '') or '').lower().strip()
    content = load_website_content()
    phone   = content.get('phoneNumber', '+49 30 123 456 789')
    company = content.get('companyName', 'Abschleppdienst Berlin')

    rules = [
        (['hallo', 'hi', 'guten tag', 'guten morgen', 'guten abend', 'hey'],
         f"Hallo! Willkommen bei {company} 👋 Wie kann ich Ihnen helfen?"),
        (['preis', 'kosten', 'wie viel', 'wieviel', 'tarif', 'gebühr', 'euro', '€'],
         f"Unsere Preise richten sich nach Einsatzart und Entfernung. Nutzen Sie unseren <a href='/preisrechner' class='chat-link'>Preisrechner</a> oder rufen Sie uns an: {phone} 📞"),
        (['notfall', 'sofort', 'dringend', 'hilfe', 'unfall', 'stecke fest', 'stecken', 'abgeschleppt'],
         f"🚨 Im Notfall sofort anrufen: **{phone}** — Wir sind rund um die Uhr für Sie da!"),
        (['wie lange', 'wartezeit', 'wann kommt', 'ankunft', 'reaktionszeit', 'wie schnell'],
         "Unsere durchschnittliche Reaktionszeit in Berlin beträgt **15–30 Minuten**. ⏱️"),
        (['pannenhilfe', 'panne', 'reifenpanne', 'reifen', 'platt'],
         "Wir helfen bei allen Arten von Autopannen direkt vor Ort. 🔧"),
        (['starthilfe', 'batterie', 'akku', 'springt nicht an', 'startet nicht'],
         "Leere Batterie? Kein Problem! Wir kommen schnell und geben Ihnen Starthilfe. 🔋"),
        (['schlüssel', 'ausgesperrt', 'türe', 'tür', 'schloss', 'verloren'],
         f"Ausgesperrt? Wir öffnen Ihr Fahrzeug schnell und ohne Beschädigungen. Anrufen: **{phone}** 🔑"),
        (['abschleppen', 'transport', 'werkstatt', 'zielort'],
         "Wir transportieren Ihr Fahrzeug sicher zu jeder Werkstatt in Berlin und Umgebung. 🚛"),
        (['falschparker', 'falsch geparkt', 'parkplatz', 'privatgelände'],
         "Wir entfernen Falschparker rechtssicher von Ihrem Privatgelände. 🚗"),
        (['öffnungszeiten', 'wann', '24', 'rund um die uhr', 'nacht', 'wochenende'],
         "Wir sind **24/7 — 365 Tage im Jahr** für Sie erreichbar! ⏰"),
        (['wo', 'standort', 'berlin', 'gebiet', 'bereich', 'umgebung'],
         "Wir sind in ganz **Berlin und Umgebung** aktiv. 📍"),
        (['kontakt', 'anrufen', 'telefon', 'nummer', 'email'],
         f"Am schnellsten erreichen Sie uns telefonisch: **{phone}** 📞"),
        (['faq', 'fragen', 'häufig'],
         f"Schauen Sie in unsere <a href='/faq' class='chat-link'>FAQ-Seite</a> — dort beantworten wir die häufigsten Fragen."),
        (['danke', 'dankeschön', 'vielen dank', 'super', 'prima', 'toll'],
         "Gern geschehen! 😊 Haben Sie noch weitere Fragen?"),
        (['tschüss', 'auf wiedersehen', 'bye'],
         "Auf Wiedersehen! Bei Fragen oder im Notfall sind wir rund um die Uhr da. 👋"),
    ]

    for keywords, response in rules:
        if any(kw in user_message for kw in keywords):
            return jsonify({'reply': response})

    return jsonify({'reply': f"Das kann ich leider nicht genau beantworten. Am besten rufen Sie uns an: **{phone}** 📞"})

# ─────────────────────────────────────────────────────────────────────────────
# DB INIT + SEED
# ─────────────────────────────────────────────────────────────────────────────

def seed_default_data():
    from models import Testimonial, FAQ
    if Testimonial.query.count() == 0:
        for t in DEFAULT_TESTIMONIALS:
            db.session.add(Testimonial(**t))
    if FAQ.query.count() == 0:
        for f in DEFAULT_FAQS:
            db.session.add(FAQ(**f))
    db.session.commit()

with app.app_context():
    import models  # noqa: F401
    db.create_all()
    seed_default_data()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
