from django.db import models
from django.contrib.auth.models import User


class County(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Counties'
        ordering = ['name']


class HealthFacility(models.Model):
    FACILITY_TYPES = [
        ('hospital', 'Hospital'),
        ('health_centre', 'Health Centre'),
        ('dispensary', 'Dispensary'),
        ('clinic', 'Clinic'),
        ('nursing_home', 'Nursing Home'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]
    name = models.CharField(max_length=200)
    facility_code = models.CharField(max_length=20, unique=True)
    facility_type = models.CharField(max_length=20, choices=FACILITY_TYPES)
    county = models.ForeignKey(County, on_delete=models.CASCADE, related_name='facilities')
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    beds = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.facility_code})"

    class Meta:
        verbose_name_plural = 'Health Facilities'
        ordering = ['name']


class Member(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive'), ('suspended', 'Suspended')]

    sha_number = models.CharField(max_length=20, unique=True)
    national_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    county = models.ForeignKey(County, on_delete=models.SET_NULL, null=True, related_name='members')
    employer = models.CharField(max_length=200, blank=True)
    monthly_contribution = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    registration_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"{self.full_name} ({self.sha_number})"

    class Meta:
        ordering = ['-created_at']


class Claim(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
    ]
    CLAIM_TYPES = [
        ('inpatient', 'Inpatient'),
        ('outpatient', 'Outpatient'),
        ('maternity', 'Maternity'),
        ('dental', 'Dental'),
        ('optical', 'Optical'),
        ('chronic', 'Chronic Disease'),
    ]

    claim_number = models.CharField(max_length=20, unique=True)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='claims')
    facility = models.ForeignKey(HealthFacility, on_delete=models.CASCADE, related_name='claims')
    claim_type = models.CharField(max_length=20, choices=CLAIM_TYPES)
    diagnosis = models.TextField()
    admission_date = models.DateField()
    discharge_date = models.DateField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    approved_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Claim {self.claim_number} - {self.member.full_name}"

    class Meta:
        ordering = ['-created_at']


class Contribution(models.Model):
    PAYMENT_METHODS = [
        ('mpesa', 'M-Pesa'),
        ('bank', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('payroll', 'Payroll Deduction'),
    ]
    STATUS_CHOICES = [('pending', 'Pending'), ('confirmed', 'Confirmed'), ('failed', 'Failed')]

    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='contributions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    transaction_ref = models.CharField(max_length=50, unique=True)
    payment_date = models.DateField()
    period_month = models.IntegerField()
    period_year = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.member.full_name} - KES {self.amount} ({self.period_month}/{self.period_year})"

    class Meta:
        ordering = ['-created_at']