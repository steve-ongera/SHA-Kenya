# 🇰🇪 SHA Kenya — Social Health Authority Management System

> A comprehensive full-stack management system for Kenya's Social Health Authority, built with Django REST Framework and React.

---

## 📋 Overview

The SHA Management System is a government-grade web application designed to manage:

- **Members** — Register and manage health insurance beneficiaries
- **Claims** — Process, approve, and track medical claims
- **Contributions** — Record and monitor member premium payments
- **Health Facilities** — Manage accredited hospitals and clinics
- **Counties** — Administer all 47 counties of Kenya

---

## 🏗️ Architecture

```
sha-system/
├── backend/                    # Django REST API
│   ├── sha_backend/           # Project settings & URLs
│   │   ├── settings.py
│   │   └── urls.py
│   ├── core/                  # Main application
│   │   ├── models.py          # Database models
│   │   ├── views.py           # API views & viewsets
│   │   ├── serializers.py     # DRF serializers
│   │   ├── urls.py            # API routing
│   │   └── management/
│   │       └── commands/
│   │           └── seed_data.py   # Sample data seeder
│   └── requirements.txt
│
└── frontend/                   # React Application
    ├── public/
    │   └── index.html          # HTML template with Bootstrap Icons
    └── src/
        ├── styles/
        │   └── global.css      # Global styles (Kenya theme)
        ├── services/
        │   └── api.js          # API service layer (all HTTP calls)
        ├── context/
        │   ├── AuthContext.jsx  # JWT authentication state
        │   └── ToastContext.jsx # Toast notifications
        ├── components/
        │   ├── Sidebar.jsx      # Responsive collapsible sidebar
        │   ├── Navbar.jsx       # Top navigation bar
        │   └── Modal.jsx        # Reusable JS modals
        ├── pages/
        │   ├── Login.jsx        # Login page
        │   ├── Dashboard.jsx    # Analytics dashboard (Recharts)
        │   ├── Members.jsx      # Member management CRUD
        │   ├── Claims.jsx       # Claims processing CRUD
        │   ├── Contributions.jsx # Payments CRUD
        │   ├── Facilities.jsx   # Facilities CRUD
        │   └── Counties.jsx     # Counties CRUD
        └── App.jsx              # Root component & routing
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip

### 1. Run the setup script
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Start backend
```bash
cd backend
python manage.py runserver
# Runs at http://localhost:8000
```

### 3. Start frontend
```bash
cd frontend
npm start
# Opens at http://localhost:3000
```

---

## 🔐 Authentication

Uses JWT (JSON Web Tokens) via `djangorestframework-simplejwt`.

| User | Username | Password | Role |
|------|----------|----------|------|
| Administrator | `admin` | `Admin@1234` | Full access |
| Claims Officer | `officer` | `Officer@1234` | Operations |

Tokens expire after **8 hours** with automatic refresh.

---

## 📡 API Endpoints

```
POST   /api/token/              # Login
POST   /api/token/refresh/      # Refresh token
GET    /api/me/                 # Current user
GET    /api/dashboard/          # Dashboard statistics

GET/POST   /api/members/        # Members list/create
GET/PUT/DELETE /api/members/{id}/

GET/POST   /api/claims/         # Claims list/create
GET/PUT/DELETE /api/claims/{id}/

GET/POST   /api/contributions/  # Contributions list/create
GET/PUT/DELETE /api/contributions/{id}/

GET/POST   /api/facilities/     # Facilities list/create
GET/PUT/DELETE /api/facilities/{id}/

GET/POST   /api/counties/       # Counties list/create
GET/PUT/DELETE /api/counties/{id}/
```

### Query Parameters (all list endpoints)
- `?search=` — Text search
- `?status=` — Filter by status
- `?county=` — Filter by county ID
- `?page=` — Pagination

---

## 🎨 Design System

**Color Palette** — Inspired by Kenya's national flag:
- Primary: `#006600` (Green)
- Secondary: `#BB0000` (Red)
- Background: `#001a00` (Sidebar)

**Typography:** Plus Jakarta Sans + IBM Plex Mono

**Icons:** Bootstrap Icons (CDN-loaded)

**Charts:** Recharts (Area, Bar, Pie charts)

---

## 🏛️ Data Models

### Member
Fields: SHA Number, National ID, Full Name, DOB, Gender, Phone, Email, County, Employer, Monthly Contribution, Status

### Claim
Fields: Claim Number, Member, Facility, Type (inpatient/outpatient/maternity/dental/optical/chronic), Diagnosis, Dates, Amounts, Status

### Contribution
Fields: Member, Amount, Payment Method (M-Pesa/Bank/Cash/Payroll), Transaction Reference, Period, Status

### Health Facility
Fields: Name, Code, Type, County, Address, Phone, Beds, Status

### County
Fields: Name, Code (+ derived counts)

---

## 🔧 Production Deployment

### Backend
```bash
# Install gunicorn
pip install gunicorn

# Set production settings
export DJANGO_SETTINGS_MODULE=sha_backend.settings
export SECRET_KEY=<strong-secret-key>
export DEBUG=False
export ALLOWED_HOSTS=yourdomain.go.ke

# Collect static files
python manage.py collectstatic

# Run with gunicorn
gunicorn sha_backend.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Frontend
```bash
npm run build
# Serve the build/ folder with nginx
```

### Recommended Stack
- **Server:** Ubuntu 22.04 LTS
- **Web Server:** Nginx
- **WSGI:** Gunicorn
- **Database:** PostgreSQL (replace SQLite)
- **SSL:** Let's Encrypt

### Switch to PostgreSQL
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'sha_db',
        'USER': 'sha_user',
        'PASSWORD': '<password>',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

---

## 📊 Features

- ✅ JWT Authentication with token refresh
- ✅ Responsive sidebar (collapsible + mobile drawer)
- ✅ Dashboard with live charts (Area, Bar, Pie)
- ✅ Full CRUD on all entities via JS Modals
- ✅ Search & filtering on all tables
- ✅ Pagination
- ✅ Toast notifications
- ✅ Kenya-themed UI (green/red/black)
- ✅ Bootstrap Icons
- ✅ Sample data seeder

---

## 📞 Support

**Social Health Authority Kenya**  
Ministry of Health, Afya House  
Cathedral Road, Nairobi  
📧 info@sha.go.ke  
🌐 www.sha.go.ke

---

*© 2024 Government of Kenya — Ministry of Health*  
*Confidential Government System — Authorized Access Only*