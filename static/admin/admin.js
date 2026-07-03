/**
 * Admin Dashboard — Abschleppdienst Berlin
 * All 8 tabs: Overview, Content, Services, Inbox, Reviews, FAQ, Hours, Images
 */

const DEFAULT_CONTENT = {
    headline: '24h Abschleppdienst in Berlin',
    subheadline: 'Schnell. Zuverlässig. Rund um die Uhr.',
    phoneNumber: '+49 30 123 456 789',
    whatsappNumber: '+49 30 123 456 789',
    companyName: 'Abschleppdienst Berlin',
    address: 'Musterstraße 123\n12345 Berlin',
    email: 'info@abschleppdienst-berlin.de',
    services: [
        { id:1, title:'Pannenhilfe',           description:'Schnelle Hilfe bei Autopannen. Unser erfahrenes Team ist 24/7 für Sie da.', icon:'fas fa-tools' },
        { id:2, title:'Unfallbergung',         description:'Professionelle Bergung nach Unfällen. Sicher und schnell.', icon:'fas fa-car-crash' },
        { id:3, title:'Abschleppdienst',       description:'Transport Ihres Fahrzeugs zur Werkstatt oder zum gewünschten Zielort.', icon:'fas fa-truck' },
        { id:4, title:'Falschparker entfernen',description:'Rechtssichere Entfernung von Falschparkern auf Ihrem Gelände.', icon:'fas fa-car' },
        { id:5, title:'Batterie-Starthilfe',   description:'Schnelle Starthilfe bei leerer Batterie.', icon:'fas fa-battery-half' }
    ]
};

const ICON_OPTIONS = [
    'fas fa-tools','fas fa-car-crash','fas fa-truck','fas fa-car',
    'fas fa-battery-half','fas fa-gas-pump','fas fa-wrench','fas fa-cog',
    'fas fa-shield-alt','fas fa-bolt','fas fa-road','fas fa-ambulance',
    'fas fa-map-marker-alt','fas fa-clock','fas fa-phone','fas fa-star',
    'fas fa-check-circle','fas fa-key','fas fa-tachometer-alt','fas fa-fire-extinguisher',
    'fas fa-user-shield','fas fa-handshake','fas fa-medal','fas fa-thumbs-up'
];

const DAY_KEYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

let currentContent = {};
let currentHours   = {};
let nextServiceId  = 6;
let activeIconServiceId = null;

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;
    await loadContent();
    populateContentForm();
    populateImagePreviews();
    renderServices();
    updateOverviewStats();
    buildIconGrid();
    loadInboxCounts();
});

/* ── AUTH ── */
function checkAuth() {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = '/static/admin/login.html';
        return false;
    }
    const t = localStorage.getItem('adminLoginTime');
    if (t && Date.now() - parseInt(t) > 86400000) { logout(); return false; }
    return true;
}
function logout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminLoginTime');
    window.location.href = '/static/admin/login.html';
}

/* ── TABS ── */
function switchTab(name, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    if (btn) btn.classList.add('active');

    switch(name) {
        case 'content':  populateContentForm(); break;
        case 'services': renderServices(); break;
        case 'inbox':    loadInbox(); break;
        case 'reviews':  loadReviews(); break;
        case 'faq':      loadFaq(); break;
        case 'hours':    loadHours(); break;
        case 'overview': updateOverviewStats(); break;
        case 'images':   populateImagePreviews(); break;
    }
}

/* ── CONTENT ── */
async function loadContent() {
    try {
        const r = await fetch('/api/content');
        if (r.ok) currentContent = await r.json();
        else throw new Error();
    } catch {
        const s = localStorage.getItem('websiteContent');
        currentContent = s ? JSON.parse(s) : JSON.parse(JSON.stringify(DEFAULT_CONTENT));
    }
    if (currentContent.services) {
        currentContent.services.forEach((s,i) => { if (!s.id) s.id = i+1; });
        nextServiceId = Math.max(...currentContent.services.map(s=>s.id)) + 1;
    } else { currentContent.services = []; }
}

function populateContentForm() {
    ['headline','subheadline','phoneNumber','whatsappNumber','companyName','address','email']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = currentContent[id] || ''; });
}

async function saveContent() {
    const st = document.getElementById('contentSaveStatus');
    setSt(st,'saving','Speichern…');
    const data = {
        headline:       v('headline'),
        subheadline:    v('subheadline'),
        phoneNumber:    v('phoneNumber'),
        whatsappNumber: v('whatsappNumber'),
        companyName:    v('companyName'),
        address:        v('address'),
        email:          v('email'),
        services:       currentContent.services,
        hero_image:     currentContent.hero_image,
        team_image:     currentContent.team_image,
    };
    if (!data.headline || !data.phoneNumber) {
        showToast('Bitte Überschrift und Telefon ausfüllen.','error');
        setSt(st,'',''); return;
    }
    await persist(data);
    currentContent = data;
    markSaved(st);
    updateOverviewStats();
    showToast('Texte & Kontakt gespeichert!','success');
}

async function resetContent() {
    if (!confirm('Alle Texte auf Standardwerte zurücksetzen?')) return;
    try {
        const r = await fetch('/api/content/reset',{method:'POST',headers:{'Content-Type':'application/json'}});
        if (r.ok) await loadContent(); else throw new Error();
    } catch { currentContent = JSON.parse(JSON.stringify(DEFAULT_CONTENT)); localStorage.setItem('websiteContent',JSON.stringify(currentContent)); }
    populateContentForm();
    updateOverviewStats();
    showToast('Zurückgesetzt.','success');
}

/* ── SERVICES ── */
function renderServices() {
    const list = document.getElementById('servicesList');
    if (!list) return;
    if (!currentContent.services || !currentContent.services.length) {
        list.innerHTML = `<div style="text-align:center;padding:28px;color:#bbb;"><i class="fas fa-tools fa-2x" style="margin-bottom:10px;display:block;"></i>Noch keine Leistungen.<br><button class="btn-add" style="margin-top:12px;" onclick="addService()"><i class="fas fa-plus"></i> Erste Leistung</button></div>`;
        return;
    }
    list.innerHTML = currentContent.services.map(s => buildServiceRow(s)).join('');
}

function buildServiceRow(s) {
    return `
    <div class="service-row" id="srow-${s.id}">
        <div class="service-row-top">
            <div class="service-icon-preview" id="siprev-${s.id}"><i class="${s.icon}"></i></div>
            <div class="service-row-title">${esc(s.title)||'Neue Leistung'}</div>
            <button class="btn-danger-sm" onclick="removeService(${s.id})" title="Entfernen"><i class="fas fa-trash"></i></button>
        </div>
        <div class="row g-2">
            <div class="col-sm-6">
                <label class="form-label">Name</label>
                <input type="text" class="form-control" value="${esc(s.title)}"
                    oninput="updateSF(${s.id},'title',this.value);this.closest('.service-row').querySelector('.service-row-title').textContent=this.value||'Neue Leistung'">
            </div>
            <div class="col-sm-6">
                <label class="form-label">Icon</label>
                <div class="icon-picker-wrap" style="position:relative;">
                    <span class="icon-preview-inline" id="icoP-${s.id}"><i class="${s.icon}"></i></span>
                    <input type="text" class="form-control icon-input-with-preview" id="icoIn-${s.id}" value="${esc(s.icon)}"
                        oninput="updateSF(${s.id},'icon',this.value);refreshIco(${s.id},this.value)">
                    <button type="button" onclick="openIconPicker(${s.id})"
                        style="position:absolute;right:6px;top:50%;transform:translateY(-50%);background:#f0f4fa;border:1px solid #dde1e8;border-radius:6px;padding:2px 8px;font-size:.72rem;cursor:pointer;color:#555;">
                        Wählen
                    </button>
                </div>
            </div>
            <div class="col-12">
                <label class="form-label">Beschreibung</label>
                <textarea class="form-control" rows="2"
                    oninput="updateSF(${s.id},'description',this.value)">${esc(s.description)}</textarea>
            </div>
        </div>
    </div>`;
}

function updateSF(id, field, val) {
    const s = currentContent.services.find(x=>x.id===id);
    if (s) s[field] = val;
}
function refreshIco(id, cls) {
    const p = document.getElementById('icoP-'+id);
    const b = document.getElementById('siprev-'+id);
    if (p) p.innerHTML = `<i class="${esc(cls)}"></i>`;
    if (b) b.innerHTML = `<i class="${esc(cls)}"></i>`;
}
function addService() {
    const ns = { id: nextServiceId++, title:'Neue Leistung', description:'Beschreibung…', icon:'fas fa-cog' };
    currentContent.services.push(ns);
    renderServices();
    const row = document.getElementById('srow-'+ns.id);
    if (row) row.scrollIntoView({behavior:'smooth',block:'center'});
}
function removeService(id) {
    if (!confirm('Leistung entfernen?')) return;
    currentContent.services = currentContent.services.filter(s=>s.id!==id);
    renderServices();
}
async function saveServices() {
    const st = document.getElementById('servicesSaveStatus');
    setSt(st,'saving','Speichern…');
    await persist(currentContent);
    markSaved(st);
    updateOverviewStats();
    showToast('Leistungen gespeichert!','success');
}

/* ── ICON PICKER ── */
function buildIconGrid() {
    const g = document.getElementById('iconGrid');
    if (!g) return;
    g.innerHTML = ICON_OPTIONS.map(ic=>`<div class="icon-choice" title="${ic}" onclick="selectIcon('${ic}')"><i class="${ic}"></i></div>`).join('');
}
function openIconPicker(svcId) {
    activeIconServiceId = svcId;
    const cur = (currentContent.services.find(s=>s.id===svcId)||{}).icon;
    document.querySelectorAll('.icon-choice').forEach(el=>el.classList.toggle('selected',el.title===cur));
    document.getElementById('iconPickerModal').style.display = 'flex';
}
function closeIconPicker() {
    document.getElementById('iconPickerModal').style.display = 'none';
    activeIconServiceId = null;
}
function selectIcon(cls) {
    if (activeIconServiceId!==null) {
        updateSF(activeIconServiceId,'icon',cls);
        refreshIco(activeIconServiceId,cls);
        const inp = document.getElementById('icoIn-'+activeIconServiceId);
        if (inp) inp.value = cls;
    }
    closeIconPicker();
}
document.getElementById('iconPickerModal').addEventListener('click', e=>{ if(e.target===document.getElementById('iconPickerModal')) closeIconPicker(); });

/* ── INBOX ── */
async function loadInboxCounts() {
    try {
        const [cRes, cbRes] = await Promise.all([fetch('/api/submissions'), fetch('/api/callbacks')]);
        const contacts  = cRes.ok  ? await cRes.json()  : [];
        const callbacks = cbRes.ok ? await cbRes.json() : [];
        const unread = [...contacts,...callbacks].filter(i=>!i.is_read).length;
        const badge = document.getElementById('inboxBadge');
        if (badge) { badge.textContent = unread; badge.classList.toggle('d-none', unread===0); }
        const statUnread = document.getElementById('stat-unread');
        if (statUnread) statUnread.textContent = unread > 0 ? unread + ' neu' : 'Keine neuen';
    } catch {}
}

async function loadInbox() {
    await Promise.all([loadContacts(), loadCallbacks()]);
}

async function loadContacts() {
    const el = document.getElementById('contactList');
    const countEl = document.getElementById('contactCount');
    try {
        const r = await fetch('/api/submissions');
        const items = r.ok ? await r.json() : [];
        if (countEl) countEl.textContent = items.length;
        if (!items.length) { el.innerHTML = '<div class="text-muted text-center py-3" style="font-size:.85rem;">Noch keine Kontaktanfragen.</div>'; return; }
        el.innerHTML = items.map(i => `
            <div class="inbox-item ${i.is_read?'':'unread'}" id="ci-${i.id}">
                <div class="inbox-icon ${i.is_read?'':'blue'}"><i class="fas fa-envelope"></i></div>
                <div class="inbox-item-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="inbox-item-name">${esc(i.name)} ${i.is_read?'':'<span class="badge bg-primary" style="font-size:.65rem;">Neu</span>'}</div>
                        <div class="inbox-item-date">${i.created_at}</div>
                    </div>
                    <div class="inbox-item-detail"><i class="fas fa-envelope me-1"></i>${esc(i.email)} ${i.phone?'· <i class="fas fa-phone me-1"></i>'+esc(i.phone):''} ${i.subject?'· '+esc(i.subject):''}</div>
                    <div class="inbox-item-msg">${esc(i.message)}</div>
                </div>
                <div class="d-flex flex-column gap-1 ms-2">
                    ${!i.is_read?`<button class="btn-add" style="font-size:.72rem;padding:4px 8px;" onclick="markRead('contact',${i.id})">Gelesen</button>`:''}
                    <button class="btn-danger-sm" onclick="deleteItem('contact',${i.id})" title="Löschen"><i class="fas fa-trash"></i></button>
                </div>
            </div>`).join('');
    } catch { el.innerHTML = '<div class="text-muted text-center py-3">Fehler beim Laden.</div>'; }
}

async function loadCallbacks() {
    const el = document.getElementById('callbackList');
    const countEl = document.getElementById('callbackCount');
    try {
        const r = await fetch('/api/callbacks');
        const items = r.ok ? await r.json() : [];
        if (countEl) countEl.textContent = items.length;
        if (!items.length) { el.innerHTML = '<div class="text-muted text-center py-3" style="font-size:.85rem;">Noch keine Rückrufanfragen.</div>'; return; }
        el.innerHTML = items.map(i => `
            <div class="inbox-item ${i.is_read?'':'unread'}" id="cbi-${i.id}">
                <div class="inbox-icon ${i.is_read?'':'green'}"><i class="fas fa-phone-alt"></i></div>
                <div class="inbox-item-body">
                    <div class="d-flex justify-content-between">
                        <div class="inbox-item-name">${esc(i.name)||'—'} ${i.is_read?'':'<span class="badge bg-success" style="font-size:.65rem;">Neu</span>'}</div>
                        <div class="inbox-item-date">${i.created_at}</div>
                    </div>
                    <div class="inbox-item-detail"><i class="fas fa-phone me-1"></i><strong>${esc(i.phone)}</strong>${i.best_time?' · '+esc(i.best_time):''}</div>
                </div>
                <div class="d-flex flex-column gap-1 ms-2">
                    ${!i.is_read?`<button class="btn-add" style="font-size:.72rem;padding:4px 8px;" onclick="markRead('callback',${i.id})">Gelesen</button>`:''}
                    <button class="btn-danger-sm" onclick="deleteItem('callback',${i.id})" title="Löschen"><i class="fas fa-trash"></i></button>
                </div>
            </div>`).join('');
    } catch { el.innerHTML = '<div class="text-muted text-center py-3">Fehler beim Laden.</div>'; }
}

async function markRead(type, id) {
    const url = type==='contact' ? `/api/submissions/${id}/read` : `/api/callbacks/${id}/read`;
    await fetch(url,{method:'POST'});
    await loadInbox();
    loadInboxCounts();
}
async function deleteItem(type, id) {
    if (!confirm('Eintrag löschen?')) return;
    const url = type==='contact' ? `/api/submissions/${id}` : `/api/callbacks/${id}`;
    await fetch(url,{method:'DELETE'});
    await loadInbox();
    loadInboxCounts();
}

/* ── REVIEWS ── */
async function loadReviews() {
    const el = document.getElementById('reviewsList');
    try {
        const r = await fetch('/api/testimonials');
        const items = r.ok ? await r.json() : [];
        if (!items.length) { el.innerHTML = '<div class="text-muted text-center py-3" style="font-size:.85rem;">Noch keine Bewertungen.</div>'; return; }
        el.innerHTML = items.map(t => `
            <div class="review-row" id="rev-${t.id}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <strong>${esc(t.name)}</strong>
                        ${t.location?`<span class="text-muted ms-2" style="font-size:.8rem;"><i class="fas fa-map-marker-alt me-1"></i>${esc(t.location)}</span>`:''}
                        <div class="review-stars">${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</div>
                    </div>
                    <div class="d-flex gap-2 align-items-center">
                        <div class="form-check form-switch m-0">
                            <input class="form-check-input" type="checkbox" ${t.active?'checked':''} onchange="toggleReview(${t.id},this.checked)" title="Sichtbar">
                        </div>
                        <button class="btn-danger-sm" onclick="deleteReview(${t.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div style="font-size:.85rem;color:#555;font-style:italic;">"${esc(t.text)}"</div>
                ${!t.active?'<div class="mt-1"><span class="badge bg-secondary" style="font-size:.7rem;">Ausgeblendet</span></div>':''}
            </div>`).join('');
    } catch { el.innerHTML = '<div class="text-muted text-center py-3">Fehler beim Laden.</div>'; }
}

function openAddReview() { document.getElementById('addReviewCard').classList.remove('d-none'); }

async function submitReview() {
    const name     = document.getElementById('newRevName').value.trim();
    const location = document.getElementById('newRevLocation').value.trim();
    const rating   = parseInt(document.getElementById('newRevRating').value);
    const text     = document.getElementById('newRevText').value.trim();
    if (!name || !text) { showToast('Name und Text sind Pflichtfelder.','error'); return; }
    const r = await fetch('/api/testimonials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,location,rating,text})});
    if (r.ok) {
        document.getElementById('addReviewCard').classList.add('d-none');
        ['newRevName','newRevLocation','newRevText'].forEach(id=>document.getElementById(id).value='');
        await loadReviews();
        showToast('Bewertung hinzugefügt!','success');
    }
}
async function toggleReview(id, active) {
    await fetch(`/api/testimonials/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({active})});
    await loadReviews();
}
async function deleteReview(id) {
    if (!confirm('Bewertung löschen?')) return;
    await fetch(`/api/testimonials/${id}`,{method:'DELETE'});
    await loadReviews();
    showToast('Gelöscht.','success');
}

/* ── FAQ ── */
async function loadFaq() {
    const el = document.getElementById('faqList');
    try {
        const r = await fetch('/api/faq');
        const items = r.ok ? await r.json() : [];
        if (!items.length) { el.innerHTML = '<div class="text-muted text-center py-3" style="font-size:.85rem;">Noch keine FAQ-Einträge.</div>'; return; }
        el.innerHTML = items.map(f => `
            <div class="service-row" id="frow-${f.id}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div style="font-weight:700;font-size:.9rem;flex:1;margin-right:10px;">
                        <i class="fas fa-question-circle text-primary me-2"></i>${esc(f.question)}
                    </div>
                    <div class="d-flex gap-2">
                        <div class="form-check form-switch m-0"><input class="form-check-input" type="checkbox" ${f.active?'checked':''} onchange="toggleFaq(${f.id},this.checked)" title="Aktiv"></div>
                        <button class="btn-danger-sm" onclick="deleteFaq(${f.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div style="font-size:.83rem;color:#666;">${esc(f.answer)}</div>
                ${!f.active?'<span class="badge bg-secondary mt-1" style="font-size:.7rem;">Ausgeblendet</span>':''}
            </div>`).join('');
    } catch { el.innerHTML = '<div class="text-muted text-center py-3">Fehler beim Laden.</div>'; }
}

function openAddFaq() { document.getElementById('addFaqCard').classList.remove('d-none'); }

async function submitFaq() {
    const question = document.getElementById('newFaqQ').value.trim();
    const answer   = document.getElementById('newFaqA').value.trim();
    if (!question || !answer) { showToast('Frage und Antwort sind Pflichtfelder.','error'); return; }
    const r = await fetch('/api/faq',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,answer})});
    if (r.ok) {
        document.getElementById('addFaqCard').classList.add('d-none');
        document.getElementById('newFaqQ').value='';
        document.getElementById('newFaqA').value='';
        await loadFaq();
        showToast('FAQ-Eintrag hinzugefügt!','success');
    }
}
async function toggleFaq(id, active) {
    await fetch(`/api/faq/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({active})});
    await loadFaq();
}
async function deleteFaq(id) {
    if (!confirm('FAQ-Eintrag löschen?')) return;
    await fetch(`/api/faq/${id}`,{method:'DELETE'});
    await loadFaq();
    showToast('Gelöscht.','success');
}

/* ── HOURS ── */
async function loadHours() {
    try {
        const r = await fetch('/api/hours');
        currentHours = r.ok ? await r.json() : { always_24h: true, days: {} };
    } catch { currentHours = { always_24h: true, days: {} }; }
    renderHours();
}

function renderHours() {
    const toggle = document.getElementById('always24h');
    if (toggle) toggle.checked = !!currentHours.always_24h;

    const table = document.getElementById('hoursTable');
    if (!table) return;
    const days = currentHours.days || {};
    const disabled = !!currentHours.always_24h;

    const DAY_LABELS = { monday:'Montag', tuesday:'Dienstag', wednesday:'Mittwoch', thursday:'Donnerstag', friday:'Freitag', saturday:'Samstag', sunday:'Sonntag' };

    table.innerHTML = DAY_KEYS.map(k => {
        const d = days[k] || { is_open:true, is_24h:true, open:'08:00', close:'20:00' };
        return `
        <div class="hours-row" style="${disabled?'opacity:.4;pointer-events:none':''}">
            <div class="hours-day">${DAY_LABELS[k]}</div>
            <div class="form-check"><input class="form-check-input" type="checkbox" id="hopen-${k}" ${d.is_open?'checked':''} onchange="updateDay('${k}','is_open',this.checked)"><label class="form-check-label" for="hopen-${k}" style="font-size:.82rem;">Geöffnet</label></div>
            <div class="form-check"><input class="form-check-input" type="checkbox" id="h24-${k}" ${d.is_24h?'checked':''} onchange="updateDay('${k}','is_24h',this.checked)"><label class="form-check-label" for="h24-${k}" style="font-size:.82rem;">24h</label></div>
            <div class="hours-fields" id="htime-${k}" style="${d.is_24h?'opacity:.4;pointer-events:none':''}">
                <input type="time" value="${d.open||'08:00'}" onchange="updateDay('${k}','open',this.value)">
                <span style="font-size:.85rem;color:#888;">bis</span>
                <input type="time" value="${d.close||'20:00'}" onchange="updateDay('${k}','close',this.value)">
            </div>
        </div>`;
    }).join('');
}

function toggle24h(checked) {
    if (!currentHours) currentHours = {};
    currentHours.always_24h = checked;
    renderHours();
}
function updateDay(key, field, value) {
    if (!currentHours.days) currentHours.days = {};
    if (!currentHours.days[key]) currentHours.days[key] = { is_open:true, is_24h:true, open:'08:00', close:'20:00' };
    currentHours.days[key][field] = value;
    if (field === 'is_24h') {
        const tf = document.getElementById('htime-'+key);
        if (tf) tf.style.cssText = value ? 'opacity:.4;pointer-events:none' : '';
    }
}
async function saveHours() {
    const st = document.getElementById('hoursSaveStatus');
    setSt(st,'saving','Speichern…');
    const r = await fetch('/api/hours',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(currentHours)});
    if (r.ok) { markSaved(st); showToast('Öffnungszeiten gespeichert!','success'); }
    else { setSt(st,'',''); showToast('Fehler beim Speichern.','error'); }
}

/* ── IMAGES ── */
async function uploadImage(input, slot, previewId, statusId) {
    if (!input.files || !input.files[0]) return;
    const stEl = document.getElementById(statusId);
    stEl.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Hochladen…';
    const fd = new FormData();
    fd.append('file', input.files[0]);
    fd.append('slot', slot);
    try {
        const r = await fetch('/api/upload',{method:'POST',body:fd});
        const data = await r.json();
        if (data.success) {
            const prev = document.getElementById(previewId);
            if (prev) { prev.src = data.url+'?t='+Date.now(); prev.classList.remove('d-none'); }
            currentContent[slot] = data.url.replace('/static/','');
            stEl.innerHTML = '<i class="fas fa-check-circle" style="color:#2e7d32;"></i> Erfolgreich hochgeladen!';
            showToast('Bild hochgeladen!','success');
        } else {
            stEl.innerHTML = `<span class="text-danger"><i class="fas fa-times-circle me-1"></i>${data.error}</span>`;
        }
    } catch {
        stEl.innerHTML = '<span class="text-danger"><i class="fas fa-times-circle me-1"></i>Upload fehlgeschlagen.</span>';
    }
}

function populateImagePreviews() {
    const heroPreview = document.getElementById('heroPreview');
    const teamPreview = document.getElementById('teamPreview');

    if (currentContent.hero_image) {
        if (heroPreview) {
            heroPreview.src = '/static/' + currentContent.hero_image;
            heroPreview.classList.remove('d-none');
        }
    }
    if (currentContent.team_image) {
        if (teamPreview) {
            teamPreview.src = '/static/' + currentContent.team_image;
            teamPreview.classList.remove('d-none');
        }
    }
}

/* ── OVERVIEW ── */
function updateOverviewStats() {
    setText('stat-company',  currentContent.companyName || '—');
    setText('stat-phone',    currentContent.phoneNumber || '—');
    setText('stat-services', (currentContent.services||[]).length + ' Leistungen');
    loadInboxCounts();
}

function updateLastSaved() {
    const el = document.getElementById('lastSavedInfo');
    if (!el) return;
    const now = new Date();
    el.innerHTML = `<i class="fas fa-check-circle" style="color:#2e7d32;margin-right:6px;"></i>Zuletzt gespeichert: <strong>${now.toLocaleDateString('de-DE')}</strong> um <strong>${now.toLocaleTimeString('de-DE')}</strong>`;
}

/* ── PERSIST ── */
async function persist(data) {
    try {
        const r = await fetch('/api/content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
        localStorage.setItem('websiteContent',JSON.stringify(data));
        localStorage.setItem('lastModified',Date.now().toString());
        updateLastSaved();
        return r.ok;
    } catch {
        localStorage.setItem('websiteContent',JSON.stringify(data));
        updateLastSaved();
        return false;
    }
}

/* ── UI HELPERS ── */
function setSt(el, type, text) {
    if (!el) return;
    el.className = 'save-status' + (type?' '+type:'');
    if (type==='saving') el.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    else if (type==='saved') el.innerHTML = `<i class="fas fa-check-circle"></i> ${text}`;
    else el.innerHTML = text;
}
function markSaved(el) {
    setSt(el,'saved','Gespeichert');
    setTimeout(()=>setSt(el,'',''),4000);
}
function showToast(msg, type='success') {
    const area = document.getElementById('toastArea');
    const id   = 'toast-'+Date.now();
    const icon = type==='success'?'check-circle':'exclamation-circle';
    const div  = document.createElement('div');
    div.id = id; div.className = 'toast-msg '+type;
    div.innerHTML = `<i class="fas fa-${icon}"></i> ${msg}`;
    area.appendChild(div);
    setTimeout(()=>{ div.style.opacity='0'; div.style.transition='opacity .3s'; setTimeout(()=>div.remove(),300); },3500);
}
function setText(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }
function v(id) { const el=document.getElementById(id); return el?(el.value||'').trim():''; }
function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── GLOBAL EXPORTS ── */
window.logout          = logout;
window.switchTab       = switchTab;
window.saveContent     = saveContent;
window.resetContent    = resetContent;
window.addService      = addService;
window.removeService   = removeService;
window.updateSF        = updateSF;
window.refreshIco      = refreshIco;
window.saveServices    = saveServices;
window.openIconPicker  = openIconPicker;
window.closeIconPicker = closeIconPicker;
window.selectIcon      = selectIcon;
window.markRead        = markRead;
window.deleteItem      = deleteItem;
window.openAddReview   = openAddReview;
window.submitReview    = submitReview;
window.toggleReview    = toggleReview;
window.deleteReview    = deleteReview;
window.openAddFaq      = openAddFaq;
window.submitFaq       = submitFaq;
window.toggleFaq       = toggleFaq;
window.deleteFaq       = deleteFaq;
window.toggle24h       = toggle24h;
window.updateDay       = updateDay;
window.saveHours       = saveHours;
window.uploadImage     = uploadImage;
window.populateImagePreviews = populateImagePreviews;
window.submitCallback  = window.submitCallback || function(){};
