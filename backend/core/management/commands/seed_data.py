"""
SHA Kenya — Comprehensive Data Seeder
======================================
Generates realistic long-term data spanning 3 years (2022–2024):
  - 47 Kenya counties (all official)
  - 50 health facilities across all tiers
  - 300 members with full profiles
  - 1,800+ contribution records (monthly, multi-year)
  - 500+ claims across all types and statuses

Run:
    python manage.py seed_data
    python manage.py seed_data --reset      # clears existing data first
    python manage.py seed_data --members 500 --claims 1000
"""

import random
import string
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction

from core.models import County, HealthFacility, Member, Claim, Contribution


# ─── All 47 Kenya Counties ────────────────────────────────────────────────────

ALL_47_COUNTIES = [
    ('Mombasa', 'MSA'), ('Kwale', 'KWL'), ('Kilifi', 'KLF'),
    ('Tana River', 'TNR'), ('Lamu', 'LMU'), ('Taita-Taveta', 'TTA'),
    ('Garissa', 'GRS'), ('Wajir', 'WJR'), ('Mandera', 'MND'),
    ('Marsabit', 'MRS'), ('Isiolo', 'ISL'), ('Meru', 'MRU'),
    ('Tharaka-Nithi', 'TRN'), ('Embu', 'EMB'), ('Kitui', 'KTU'),
    ('Machakos', 'MKS'), ('Makueni', 'MKN'), ('Nyandarua', 'NDR'),
    ('Nyeri', 'NYR'), ('Kirinyaga', 'KRG'), ("Murang'a", 'MRG'),
    ('Kiambu', 'KMB'), ('Turkana', 'TRK'), ('West Pokot', 'WPK'),
    ('Samburu', 'SMB'), ('Trans-Nzoia', 'TNZ'), ('Uasin Gishu', 'UGS'),
    ('Elgeyo-Marakwet', 'EGM'), ('Nandi', 'NND'), ('Baringo', 'BRN'),
    ('Laikipia', 'LKP'), ('Nakuru', 'NKR'), ('Narok', 'NRK'),
    ('Kajiado', 'KJD'), ('Kericho', 'KRC'), ('Bomet', 'BMT'),
    ('Kakamega', 'KKG'), ('Vihiga', 'VHG'), ('Bungoma', 'BNG'),
    ('Busia', 'BSA'), ('Siaya', 'SYA'), ('Kisumu', 'KSM'),
    ('Homa Bay', 'HMB'), ('Migori', 'MGR'), ('Kisii', 'KSI'),
    ('Nyamira', 'NYM'), ('Nairobi', 'NBI'),
]


# ─── Health Facilities ────────────────────────────────────────────────────────

FACILITIES_DATA = [
    # (name, code, type, county_name, beds)
    # --- National Referral ---
    ('Kenyatta National Hospital', 'KNH001', 'hospital', 'Nairobi', 1800),
    ('Moi Teaching & Referral Hospital', 'MTR001', 'hospital', 'Uasin Gishu', 900),
    # --- County Referral Hospitals ---
    ('Coast General Teaching & Referral Hospital', 'CGT001', 'hospital', 'Mombasa', 650),
    ('Nakuru Level 5 Hospital', 'NKR001', 'hospital', 'Nakuru', 340),
    ('Kisumu County Referral Hospital', 'KCR001', 'hospital', 'Kisumu', 380),
    ('Kakamega County General Hospital', 'KKG001', 'hospital', 'Kakamega', 320),
    ('Meru Teaching & Referral Hospital', 'MRU001', 'hospital', 'Meru', 310),
    ('Embu Level 5 Hospital', 'EMB001', 'hospital', 'Embu', 280),
    ('Kiambu Level 5 Hospital', 'KMB001', 'hospital', 'Kiambu', 300),
    ('Machakos Level 5 Hospital', 'MKS001', 'hospital', 'Machakos', 290),
    ('Nyeri County Referral Hospital', 'NYR001', 'hospital', 'Nyeri', 260),
    ('Thika Level 5 Hospital', 'THK001', 'hospital', 'Kiambu', 240),
    ('Garissa County Referral Hospital', 'GRS001', 'hospital', 'Garissa', 200),
    ('Migori County Referral Hospital', 'MGR001', 'hospital', 'Migori', 190),
    ('Kisii Teaching & Referral Hospital', 'KSI001', 'hospital', 'Kisii', 220),
    # --- Private Hospitals ---
    ('Aga Khan University Hospital Nairobi', 'AKH001', 'hospital', 'Nairobi', 254),
    ('Nairobi Hospital', 'NRB001', 'hospital', 'Nairobi', 300),
    ('MP Shah Hospital', 'MPS001', 'hospital', 'Nairobi', 200),
    ('Mater Misericordiae Hospital', 'MAT001', 'hospital', 'Nairobi', 180),
    ("Gertrude's Children's Hospital", 'GCH001', 'hospital', 'Nairobi', 120),
    ('Pandya Memorial Hospital', 'PMH001', 'hospital', 'Mombasa', 100),
    ('Avenue Hospital Kisumu', 'AVK001', 'hospital', 'Kisumu', 80),
    ('Nairobi Women\'s Hospital Karen', 'NWK001', 'hospital', 'Nairobi', 90),
    # --- Health Centres ---
    ('Pumwani Health Centre', 'PWN001', 'health_centre', 'Nairobi', 0),
    ('Kangemi Health Centre', 'KGM001', 'health_centre', 'Nairobi', 0),
    ('Mathare North Health Centre', 'MNH001', 'health_centre', 'Nairobi', 0),
    ('Likoni Health Centre', 'LKN001', 'health_centre', 'Mombasa', 0),
    ('Kisumu East Health Centre', 'KSE001', 'health_centre', 'Kisumu', 0),
    ('Nakuru East Health Centre', 'NKE001', 'health_centre', 'Nakuru', 0),
    ('Eldoret Health Centre', 'ELD001', 'health_centre', 'Uasin Gishu', 0),
    ('Garissa Health Centre', 'GRH001', 'health_centre', 'Garissa', 0),
    # --- Dispensaries ---
    ('Kibera Dispensary', 'KBR001', 'dispensary', 'Nairobi', 0),
    ('Mathare Dispensary', 'MTH001', 'dispensary', 'Nairobi', 0),
    ('Mombasa Old Town Dispensary', 'MOT001', 'dispensary', 'Mombasa', 0),
    ('Kisumu Central Dispensary', 'KSC001', 'dispensary', 'Kisumu', 0),
    ('Nakuru Central Dispensary', 'NKC001', 'dispensary', 'Nakuru', 0),
    ('Kisii Central Dispensary', 'KSC002', 'dispensary', 'Kisii', 0),
    ('Bungoma Dispensary', 'BNG001', 'dispensary', 'Bungoma', 0),
    # --- Clinics ---
    ('City Eye & ENT Specialist Clinic', 'CEE001', 'clinic', 'Nairobi', 0),
    ('Nairobi Dental & Implant Centre', 'NDC001', 'clinic', 'Nairobi', 0),
    ('Westlands Medical Clinic', 'WMC001', 'clinic', 'Nairobi', 0),
    ('Mombasa Specialist Clinic', 'MSC001', 'clinic', 'Mombasa', 0),
    ('Kisumu Specialist Clinic', 'KSP001', 'clinic', 'Kisumu', 0),
    # --- Nursing Homes ---
    ('Aga Khan Maternity Home', 'AKM001', 'nursing_home', 'Nairobi', 40),
    ('Mombasa Nursing Home', 'MNR001', 'nursing_home', 'Mombasa', 30),
    ('Kisumu Nursing Home', 'KNR001', 'nursing_home', 'Kisumu', 25),
    ('Nakuru Nursing Home', 'NNR001', 'nursing_home', 'Nakuru', 20),
    ('Nyeri Nursing Home', 'NYN001', 'nursing_home', 'Nyeri', 18),
    ('Eldoret Nursing Home', 'ENN001', 'nursing_home', 'Uasin Gishu', 22),
]


# ─── Names ────────────────────────────────────────────────────────────────────

MALE_NAMES = [
    'James', 'John', 'Peter', 'David', 'Samuel', 'Daniel', 'Joseph', 'Paul',
    'Moses', 'Patrick', 'Michael', 'George', 'Robert', 'Charles', 'Francis',
    'Kevin', 'Brian', 'Dennis', 'Eric', 'Philip', 'Simon', 'Stephen', 'Timothy',
    'Victor', 'William', 'Alex', 'Andrew', 'Anthony', 'Benjamin', 'Caleb',
    'Duncan', 'Edwin', 'Felix', 'Geoffrey', 'Hassan', 'Ibrahim', 'Jackson',
    'Kennedy', 'Lawrence', 'Martin', 'Nathan', 'Rashid', 'Tobias', 'Umar',
]

FEMALE_NAMES = [
    'Mary', 'Grace', 'Faith', 'Esther', 'Agnes', 'Joyce', 'Alice', 'Elizabeth',
    'Rose', 'Mercy', 'Amina', 'Fatuma', 'Aisha', 'Zainab', 'Halima',
    'Ann', 'Betty', 'Carol', 'Diana', 'Emily', 'Florence', 'Gloria', 'Hannah',
    'Irene', 'Janet', 'Linda', 'Margaret', 'Nancy', 'Olivia', 'Purity',
    'Rachel', 'Sarah', 'Teresa', 'Violet', 'Wanjiru', 'Yvonne', 'Zipporah',
    'Consolata', 'Perpetua', 'Celestine', 'Scholastica', 'Immaculate',
]

LAST_NAMES = [
    'Kamau', 'Ochieng', 'Wanjiku', 'Mutua', 'Auma', 'Mwangi', 'Otieno',
    'Njoroge', 'Omondi', 'Gathoni', 'Kiprop', 'Adhiambo', 'Kimani', 'Wambua',
    'Chebet', 'Ndungu', 'Okello', 'Mugo', 'Akinyi', 'Kariuki', 'Waweru',
    'Muthoni', 'Gitau', 'Njeru', 'Korir', 'Rotich', 'Bett', 'Lagat',
    'Tanui', 'Ruto', 'Kiptoo', 'Kirui', 'Sang', 'Chepkorir', 'Yego',
    'Odinga', 'Onyango', 'Owino', 'Ogola', 'Adero', 'Achieng', 'Awiti',
    'Nyamweya', 'Ombati', 'Moraa', 'Gekara', 'Omwenga', 'Nyaboke',
    'Hassan', 'Omar', 'Ali', 'Ahmed', 'Farah', 'Abdi', 'Juma', 'Salim',
    'Wafula', 'Simiyu', 'Barasa', 'Namukoa', 'Nafula', 'Khaemba',
    'Otiende', 'Shikuku', 'Masinde', 'Wekesa', 'Wanyonyi', 'Makokha',
]

EMPLOYERS = [
    ('Government of Kenya', 2500),
    ('Nairobi City County Government', 2000),
    ('Mombasa County Government', 2000),
    ('Kenya Revenue Authority', 2500),
    ('Kenya Power & Lighting Co.', 2000),
    ('Safaricom PLC', 2500),
    ('Equity Bank Kenya Ltd', 2000),
    ('KCB Bank Kenya Ltd', 2000),
    ('Co-operative Bank of Kenya', 1500),
    ('Standard Chartered Kenya', 2000),
    ('Kenya Airways', 2000),
    ('Kenya Ports Authority', 2000),
    ('Kenya Pipeline Company', 2000),
    ('Kenya Broadcasting Corporation', 1500),
    ('Kenya Medical Research Institute', 1500),
    ('Kenya Red Cross Society', 1500),
    ('Aga Khan Health Services Kenya', 2000),
    ('University of Nairobi', 2000),
    ('Kenyatta University', 1500),
    ('Moi University', 1500),
    ('Strathmore University', 1500),
    ('USAID Kenya', 2500),
    ('UN Kenya', 2500),
    ('Unilever Kenya Ltd', 2000),
    ('East African Breweries Ltd', 2000),
    ('Nation Media Group', 1500),
    ('Kenya Tea Development Agency', 1500),
    ('Del Monte Kenya', 1500),
    ('Bidco Africa', 1500),
    ('Self Employed', 1000),
    ('Casual Worker', 500),
    ('Retired Civil Servant', 500),
    ('Unemployed', 500),
    ('', 500),
]

# (diagnosis, claim_type, typical_days_stay)
DIAGNOSES = [
    # Inpatient
    ('Plasmodium falciparum Malaria — Severe', 'inpatient', 5),
    ('Community Acquired Pneumonia', 'inpatient', 7),
    ('Acute Appendicitis — Laparoscopic Surgery', 'inpatient', 3),
    ('Femur Fracture — Open Reduction Internal Fixation', 'inpatient', 14),
    ('Tibia/Fibula Fracture', 'inpatient', 7),
    ('Cholecystitis — Laparoscopic Cholecystectomy', 'inpatient', 3),
    ('Peptic Ulcer Disease with Haemorrhage', 'inpatient', 5),
    ('Road Traffic Accident — Multiple Injuries', 'inpatient', 14),
    ('Burns 30–40% Total Body Surface Area', 'inpatient', 21),
    ('Pulmonary Tuberculosis', 'inpatient', 14),
    ('Severe Acute Malnutrition', 'inpatient', 10),
    ('Hypertensive Emergency — ICU Admission', 'inpatient', 5),
    ('Diabetic Ketoacidosis', 'inpatient', 4),
    ('Acute Kidney Injury', 'inpatient', 7),
    ('Stroke — Ischaemic', 'inpatient', 14),
    ('Meningitis — Bacterial', 'inpatient', 14),
    # Maternity
    ('Normal Spontaneous Vaginal Delivery', 'maternity', 2),
    ('Caesarean Section — Cephalopelvic Disproportion', 'maternity', 4),
    ('Caesarean Section — Foetal Distress', 'maternity', 4),
    ('Preeclampsia / Eclampsia', 'maternity', 5),
    ('Ectopic Pregnancy — Salpingectomy', 'maternity', 3),
    ('Postpartum Haemorrhage', 'maternity', 4),
    ('Premature Labour at 32 Weeks', 'maternity', 10),
    ('Placenta Praevia', 'maternity', 5),
    # Outpatient
    ('Uncomplicated Malaria — Outpatient', 'outpatient', 0),
    ('Upper Respiratory Tract Infection', 'outpatient', 0),
    ('Urinary Tract Infection', 'outpatient', 0),
    ('Acute Gastroenteritis', 'outpatient', 0),
    ('Typhoid Fever — Outpatient', 'outpatient', 0),
    ('Dysentery', 'outpatient', 0),
    ('Skin Infection — Cellulitis', 'outpatient', 0),
    ('Asthma Exacerbation', 'outpatient', 0),
    ('Migraine Headache', 'outpatient', 0),
    ('Anaemia — Iron Deficiency', 'outpatient', 0),
    ('Ear Infection — Otitis Media', 'outpatient', 0),
    ('Eye Infection — Conjunctivitis', 'outpatient', 0),
    # Dental
    ('Dental Caries — Multiple Restorations', 'dental', 0),
    ('Periodontal Disease — Scaling & Polishing', 'dental', 0),
    ('Impacted Wisdom Tooth — Surgical Extraction', 'dental', 0),
    ('Root Canal Treatment — Molar', 'dental', 0),
    ('Dental Abscess — Incision & Drainage', 'dental', 0),
    ('Denture Fabrication — Complete Upper', 'dental', 0),
    # Optical
    ('Refractive Error — Myopia, Spectacles Prescribed', 'optical', 0),
    ('Cataract — Phacoemulsification Both Eyes', 'optical', 1),
    ('Glaucoma — Trabeculectomy', 'optical', 2),
    ('Diabetic Retinopathy — Laser Treatment', 'optical', 0),
    ('Pterygium Excision', 'optical', 1),
    # Chronic
    ('Type 2 Diabetes Mellitus — Quarterly Review', 'chronic', 0),
    ('Type 1 Diabetes Mellitus — Insulin Refill', 'chronic', 0),
    ('Essential Hypertension — Medication Review', 'chronic', 0),
    ('HIV/AIDS — Antiretroviral Therapy Review', 'chronic', 0),
    ('Chronic Kidney Disease Stage 3 — Dialysis', 'chronic', 0),
    ('Epilepsy — Anticonvulsant Refill', 'chronic', 0),
    ('Asthma — Inhaler Prescription', 'chronic', 0),
    ('Rheumatoid Arthritis — DMARD Therapy', 'chronic', 0),
    ('Cancer — Chemotherapy Session', 'chronic', 0),
    ('Sickle Cell Disease — Hydroxyurea Refill', 'chronic', 0),
]

REJECTION_REASONS = [
    'Member contributions in arrears for more than 3 months at time of admission',
    'Pre-existing condition not covered under the current SHA benefit package',
    'Claim submitted beyond the 90-day filing window',
    'Duplicate claim — identical claim already processed under reference {prev}',
    'Facility not accredited for this category of services',
    'Insufficient supporting medical documentation attached',
    'Treatment not listed on the SHA Essential Benefits Package (EBP)',
    'Member was inactive/suspended at the time of admission',
    'Claim amount exceeds the annual out-of-pocket limit for this benefit',
    'Service was a cosmetic/elective procedure not covered by SHA',
    'Patient not confirmed as registered SHA beneficiary at time of service',
    'Claim exceeds maximum benefit limit for this claim type in the policy year',
]


# ─── Helper Functions ─────────────────────────────────────────────────────────

def gen_mpesa_ref():
    """Realistic Safaricom M-Pesa transaction format: Q + 9 alphanumeric chars"""
    return 'Q' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=9))

def gen_bank_ref():
    return 'BNK' + ''.join(random.choices(string.digits, k=12))

def gen_payroll_ref(year, month):
    return f"PAY{year}{str(month).zfill(2)}" + ''.join(random.choices(string.digits, k=6))

def gen_cash_ref():
    return 'CSH' + ''.join(random.choices(string.digits, k=10))

def gen_sha_number():
    return 'SHA' + ''.join(random.choices(string.digits, k=9))

def gen_claim_number():
    return 'CLM' + ''.join(random.choices(string.digits, k=8))

def unique_ref(gen_fn, *args):
    """Keep trying until a unique transaction ref is found"""
    ref = gen_fn(*args) if args else gen_fn()
    while Contribution.objects.filter(transaction_ref=ref).exists():
        ref = gen_fn(*args) if args else gen_fn()
    return ref


# ─── Main Command ─────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = 'Seed SHA Kenya with comprehensive 3-year long-term realistic data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset', action='store_true',
            help='Delete all existing data before seeding'
        )
        parser.add_argument(
            '--members', type=int, default=300,
            help='Number of members to generate (default: 300)'
        )
        parser.add_argument(
            '--claims', type=int, default=500,
            help='Number of claims to generate (default: 500)'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 58))
        self.stdout.write(self.style.SUCCESS('  🇰🇪  SHA KENYA — DATA SEEDER'))
        self.stdout.write(self.style.SUCCESS('=' * 58))

        if options['reset']:
            self._reset_data()

        with transaction.atomic():
            self._create_users()
            counties = self._create_counties()
            facilities = self._create_facilities(counties)
            members = self._create_members(counties, options['members'])
            contrib_count = self._create_contributions(members)
            claim_count = self._create_claims(members, facilities, options['claims'])

        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 58))
        self.stdout.write(self.style.SUCCESS('  ✅  SEEDING COMPLETE'))
        self.stdout.write(self.style.SUCCESS('=' * 58))
        self.stdout.write(f'  Counties:      {County.objects.count():>6}')
        self.stdout.write(f'  Facilities:    {HealthFacility.objects.count():>6}')
        self.stdout.write(f'  Members:       {Member.objects.count():>6}')
        self.stdout.write(f'  Contributions: {Contribution.objects.count():>6}')
        self.stdout.write(f'  Claims:        {Claim.objects.count():>6}')
        self.stdout.write('')
        self.stdout.write('  Login Credentials:')
        self.stdout.write('  ┌──────────┬───────────────────┬─────────────┐')
        self.stdout.write('  │ Username │ Password          │ Role        │')
        self.stdout.write('  ├──────────┼───────────────────┼─────────────┤')
        self.stdout.write('  │ admin    │ Admin@1234        │ Superuser   │')
        self.stdout.write('  │ manager  │ Manager@1234      │ Manager     │')
        self.stdout.write('  │ officer  │ Officer@1234      │ Claims Off. │')
        self.stdout.write('  │ finance  │ Finance@1234      │ Finance     │')
        self.stdout.write('  └──────────┴───────────────────┴─────────────┘')
        self.stdout.write(self.style.SUCCESS('=' * 58 + '\n'))

    # ─── Reset ───────────────────────────────────────────────────────────────

    def _reset_data(self):
        self.stdout.write(self.style.WARNING('\n  ⚠️  Resetting all data...'))
        Contribution.objects.all().delete()
        Claim.objects.all().delete()
        Member.objects.all().delete()
        HealthFacility.objects.all().delete()
        County.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.WARNING('     Done.\n'))

    # ─── Users ───────────────────────────────────────────────────────────────

    def _create_users(self):
        self.stdout.write('\n  👤 Creating system users...')
        users_spec = [
            # (username, email, password, first, last, staff, super)
            ('admin',   'admin@sha.go.ke',   'Admin@1234',   'System',     'Administrator', True,  True),
            ('manager', 'manager@sha.go.ke', 'Manager@1234', 'Operations', 'Manager',       True,  False),
            ('officer', 'officer@sha.go.ke', 'Officer@1234', 'Claims',     'Officer',       True,  False),
            ('finance', 'finance@sha.go.ke', 'Finance@1234', 'Finance',    'Officer',       True,  False),
            ('auditor', 'auditor@sha.go.ke', 'Auditor@1234', 'Internal',   'Auditor',       False, False),
        ]
        self.users = {}
        for uname, email, pwd, fn, ln, is_staff, is_super in users_spec:
            if not User.objects.filter(username=uname).exists():
                if is_super:
                    u = User.objects.create_superuser(uname, email, pwd)
                else:
                    u = User.objects.create_user(uname, email, pwd)
                u.first_name = fn
                u.last_name = ln
                u.is_staff = is_staff
                u.save()
            self.users[uname] = User.objects.get(username=uname)
        self.stdout.write(f'     Created {len(users_spec)} users.')

    # ─── Counties ─────────────────────────────────────────────────────────────

    def _create_counties(self):
        self.stdout.write('\n  🗺️  Creating all 47 Kenya counties...')
        counties = {}
        for name, code in ALL_47_COUNTIES:
            c, _ = County.objects.get_or_create(code=code, defaults={'name': name})
            counties[name] = c
        self.stdout.write(f'     Created {len(counties)} counties.')
        return counties

    # ─── Facilities ───────────────────────────────────────────────────────────

    def _create_facilities(self, counties):
        self.stdout.write('\n  🏥 Creating health facilities...')
        county_list = list(counties.values())
        facilities = []

        for name, code, ftype, county_name, beds in FACILITIES_DATA:
            county = counties.get(county_name) or random.choice(county_list)
            status = random.choices(
                ['active', 'inactive', 'suspended'],
                weights=[85, 12, 3]
            )[0]
            prefix = random.choice(['020', '0722', '0733', '0712', '0743', '0700'])
            phone = f"{prefix}{random.randint(100000, 999999)}"

            f, _ = HealthFacility.objects.get_or_create(
                facility_code=code,
                defaults={
                    'name': name,
                    'facility_type': ftype,
                    'county': county,
                    'address': f"P.O. Box {random.randint(1, 9999)}-{random.randint(10000, 99999)}, {county_name}",
                    'phone': phone,
                    'email': f"info@{code.lower()}.health.go.ke",
                    'status': status,
                    'beds': beds,
                }
            )
            facilities.append(f)

        self.stdout.write(f'     Created {len(facilities)} facilities.')
        return facilities

    # ─── Members ──────────────────────────────────────────────────────────────

    def _create_members(self, counties, count):
        self.stdout.write(f'\n  👥 Creating {count} members...')
        county_list = list(counties.values())
        members = []

        for i in range(count):
            gender = random.choice(['M', 'F'])
            first_name = random.choice(MALE_NAMES if gender == 'M' else FEMALE_NAMES)
            last_name = random.choice(LAST_NAMES)

            employer_entry = random.choice(EMPLOYERS)
            employer, base_contribution = employer_entry

            # Age distribution: mostly working-age adults
            age = random.choices(
                range(18, 76),
                weights=[*[1]*5, *[3]*8, *[5]*15, *[4]*10, *[3]*10, *[2]*10],
                k=1
            )[0]
            dob = date(date.today().year - age, random.randint(1, 12), random.randint(1, 28))

            # Generate unique SHA number
            sha = gen_sha_number()
            while Member.objects.filter(sha_number=sha).exists():
                sha = gen_sha_number()

            # Generate unique National ID
            nid = str(random.randint(10000000, 39999999))
            while Member.objects.filter(national_id=nid).exists():
                nid = str(random.randint(10000000, 39999999))

            prefix = random.choice(['0722', '0733', '0712', '0743', '0700', '0711', '0720', '0790'])
            phone = f"{prefix}{random.randint(100000, 999999)}"

            # Contribution: can vary slightly from base
            contribution = random.choice([
                base_contribution,
                base_contribution,
                base_contribution,
                max(500, base_contribution - 500),
                min(2500, base_contribution + 500),
            ])

            status = random.choices(
                ['active', 'inactive', 'suspended'],
                weights=[78, 17, 5]
            )[0]

            # Registration spread: Jan 2022 to today
            reg_date = date(2022, 1, 1) + timedelta(days=random.randint(0, (date.today() - date(2022, 1, 1)).days))

            try:
                m = Member.objects.create(
                    sha_number=sha,
                    national_id=nid,
                    first_name=first_name,
                    last_name=last_name,
                    date_of_birth=dob,
                    gender=gender,
                    phone=phone,
                    email=f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@gmail.com",
                    county=random.choice(county_list),
                    employer=employer,
                    monthly_contribution=contribution,
                    status=status,
                    registration_date=reg_date,
                )
                members.append(m)
            except Exception:
                pass  # skip unique constraint collisions

            if (i + 1) % 100 == 0:
                self.stdout.write(f'     ... {i + 1}/{count}')

        self.stdout.write(f'     ✅ Created {len(members)} members.')
        return members

    # ─── Contributions ────────────────────────────────────────────────────────

    def _create_contributions(self, members):
        self.stdout.write('\n  💰 Generating 3-year contribution history (2022–2024)...')
        total = 0

        # Build period list: Jan 2022 → current month
        all_periods = []
        start = date(2022, 1, 1)
        today = date.today()
        d = start
        while d <= today:
            all_periods.append((d.year, d.month))
            # Advance one month
            if d.month == 12:
                d = date(d.year + 1, 1, 1)
            else:
                d = date(d.year, d.month + 1, 1)

        for member in members:
            reg = member.registration_date

            # Payment consistency by employment type
            if member.employer in ('', 'Unemployed', 'Casual Worker'):
                base_rate = 0.50
            elif member.employer in ('Self Employed', 'Retired Civil Servant'):
                base_rate = 0.70
            elif 'Government' in (member.employer or '') or 'County' in (member.employer or ''):
                base_rate = 0.95   # Payroll deductions are very consistent
            else:
                base_rate = 0.87

            # Suspended members have very patchy payment history
            if member.status == 'suspended':
                base_rate *= 0.35
            elif member.status == 'inactive':
                base_rate *= 0.55

            for year, month in all_periods:
                # Skip months before registration
                period_date = date(year, month, 1)
                if period_date < date(reg.year, reg.month, 1):
                    continue
                # Skip future months
                if period_date > date(today.year, today.month, 1):
                    continue

                # Did member pay this month?
                if random.random() > base_rate:
                    continue

                # Payment method based on employer
                e = member.employer or ''
                if 'Government' in e or 'County' in e or 'Authority' in e or 'University' in e:
                    method = random.choices(
                        ['payroll', 'mpesa', 'bank'],
                        weights=[70, 20, 10]
                    )[0]
                elif e in ('Self Employed', 'Casual Worker', 'Unemployed', ''):
                    method = random.choices(
                        ['mpesa', 'cash', 'bank'],
                        weights=[75, 15, 10]
                    )[0]
                else:
                    method = random.choices(
                        ['mpesa', 'payroll', 'bank', 'cash'],
                        weights=[50, 30, 15, 5]
                    )[0]

                # Generate transaction reference
                if method == 'mpesa':
                    ref = unique_ref(gen_mpesa_ref)
                elif method == 'bank':
                    ref = unique_ref(gen_bank_ref)
                elif method == 'payroll':
                    ref = unique_ref(gen_payroll_ref, year, month)
                else:
                    ref = unique_ref(gen_cash_ref)

                # Payment date: mostly 1st–15th of the month
                pay_day = random.choices(
                    range(1, 29),
                    weights=[*[5]*15, *[1]*13]
                )[0]
                payment_date = date(year, month, pay_day)

                # Determine status
                days_ago = (today - payment_date).days
                if days_ago <= 2:
                    status = random.choices(['pending', 'confirmed'], weights=[70, 30])[0]
                elif days_ago <= 7:
                    status = random.choices(['pending', 'confirmed'], weights=[25, 75])[0]
                elif days_ago <= 30:
                    status = random.choices(['confirmed', 'failed', 'pending'], weights=[90, 6, 4])[0]
                else:
                    status = random.choices(['confirmed', 'failed'], weights=[97, 3])[0]

                try:
                    Contribution.objects.create(
                        member=member,
                        amount=member.monthly_contribution,
                        payment_method=method,
                        transaction_ref=ref,
                        payment_date=payment_date,
                        period_month=month,
                        period_year=year,
                        status=status,
                    )
                    total += 1
                except Exception:
                    pass

        self.stdout.write(f'     ✅ Created {total} contribution records.')
        return total

    # ─── Claims ───────────────────────────────────────────────────────────────

    def _create_claims(self, members, facilities, count):
        self.stdout.write(f'\n  📋 Generating {count} claims (2022–2024)...')

        active_facilities = [f for f in facilities if f.status == 'active'] or facilities
        eligible_members = [m for m in members if m.status in ('active', 'inactive')] or members

        officer = self.users.get('officer')
        manager = self.users.get('manager')
        finance = self.users.get('finance')
        processors = [officer, manager, finance, manager, officer]  # weighted towards officer/manager

        # Realistic claim status distribution for a live system
        STATUS_DIST = {
            'paid':         38,   # Already fully disbursed
            'approved':     22,   # Approved, payment being processed
            'under_review': 16,   # Active processing
            'pending':      14,   # Recently submitted
            'rejected':     10,   # Rejected claims
        }

        # Amount ranges in KES (realistic Kenya market rates)
        AMOUNT_RANGES = {
            'inpatient':   (18000,  450000),
            'outpatient':  (500,    9000),
            'maternity':   (10000,  95000),
            'dental':      (2500,   28000),
            'optical':     (3000,   22000),
            'chronic':     (1500,   15000),
        }

        # SHA cover rate (portion of bill covered)
        COVER_RATES = {
            'inpatient':   (0.80, 0.95),
            'outpatient':  (0.70, 1.00),
            'maternity':   (0.85, 1.00),
            'dental':      (0.60, 0.80),
            'optical':     (0.60, 0.80),
            'chronic':     (0.70, 0.90),
        }

        statuses = list(STATUS_DIST.keys())
        s_weights = list(STATUS_DIST.values())

        created = 0
        attempts = 0
        max_attempts = count * 4

        while created < count and attempts < max_attempts:
            attempts += 1

            member = random.choice(eligible_members)
            facility = random.choice(active_facilities)
            diag_entry = random.choice(DIAGNOSES)
            diagnosis, claim_type, typical_stay = diag_entry

            total_amount = random.randint(*AMOUNT_RANGES.get(claim_type, (2000, 50000)))

            # Dates spread across 2022–2024
            days_back = random.randint(1, 1095)
            admission_date = date.today() - timedelta(days=days_back)

            # Discharge date
            if claim_type in ('inpatient', 'maternity') and typical_stay > 0:
                actual_stay = max(1, int(random.gauss(typical_stay, typical_stay * 0.3)))
                discharge_date = admission_date + timedelta(days=actual_stay)
            else:
                discharge_date = None

            # Older claims are more likely to be finalised (paid/approved/rejected)
            if days_back > 60:
                status = random.choices(statuses, weights=[45, 25, 10, 5, 15])[0]
            elif days_back > 14:
                status = random.choices(statuses, weights=[30, 25, 20, 15, 10])[0]
            else:
                # Recent — mostly pending or under review
                status = random.choices(statuses, weights=[5, 10, 25, 55, 5])[0]

            # Approved amount
            approved_amount = None
            if status in ('approved', 'paid'):
                lo, hi = COVER_RATES.get(claim_type, (0.75, 0.95))
                approved_amount = int(total_amount * random.uniform(lo, hi))

            # Rejection reason
            rejection_reason = ''
            if status == 'rejected':
                rejection_reason = random.choice(REJECTION_REASONS)

            # Processor
            processed_by = None
            if status != 'pending':
                processed_by = random.choice(processors)

            cnum = gen_claim_number()
            if Claim.objects.filter(claim_number=cnum).exists():
                continue

            try:
                Claim.objects.create(
                    claim_number=cnum,
                    member=member,
                    facility=facility,
                    claim_type=claim_type,
                    diagnosis=diagnosis,
                    admission_date=admission_date,
                    discharge_date=discharge_date,
                    total_amount=Decimal(str(total_amount)),
                    approved_amount=Decimal(str(approved_amount)) if approved_amount else None,
                    status=status,
                    rejection_reason=rejection_reason,
                    processed_by=processed_by,
                )
                created += 1
            except Exception:
                pass

            if created % 100 == 0 and created > 0:
                self.stdout.write(f'     ... {created}/{count} claims')

        self.stdout.write(f'     ✅ Created {created} claims.')
        return created