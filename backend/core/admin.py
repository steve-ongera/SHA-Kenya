from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count
from .models import County, HealthFacility, Member, Claim, Contribution


# ─── County Admin ─────────────────────────────────────────────────────────────

@admin.register(County)
class CountyAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'member_count', 'facility_count', 'created_at')
    search_fields = ('name', 'code')
    ordering = ('name',)
    readonly_fields = ('created_at',)

    def member_count(self, obj):
        count = obj.members.count()
        return format_html('<b style="color:#006600">{}</b>', count)
    member_count.short_description = 'Members'

    def facility_count(self, obj):
        count = obj.facilities.count()
        return format_html('<b style="color:#0891b2">{}</b>', count)
    facility_count.short_description = 'Facilities'


# ─── Health Facility Admin ─────────────────────────────────────────────────────

@admin.register(HealthFacility)
class HealthFacilityAdmin(admin.ModelAdmin):
    list_display = ('facility_code', 'name', 'facility_type', 'county', 'phone', 'beds', 'status_badge', 'claim_count')
    list_filter = ('facility_type', 'status', 'county')
    search_fields = ('name', 'facility_code', 'phone', 'email')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 25

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'facility_code', 'facility_type', 'status')
        }),
        ('Location', {
            'fields': ('county', 'address')
        }),
        ('Contact', {
            'fields': ('phone', 'email')
        }),
        ('Capacity', {
            'fields': ('beds',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def status_badge(self, obj):
        colors = {'active': '#16a34a', 'inactive': '#6b7280', 'suspended': '#dc2626'}
        color = colors.get(obj.status, '#666')
        return format_html(
            '<span style="background:{};color:white;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.status.upper()
        )
    status_badge.short_description = 'Status'

    def claim_count(self, obj):
        return obj.claims.count()
    claim_count.short_description = 'Claims'


# ─── Member Admin ──────────────────────────────────────────────────────────────

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('sha_number', 'full_name', 'national_id', 'gender', 'county', 'phone',
                    'monthly_contribution', 'status_badge', 'total_claims_count', 'registration_date')
    list_filter = ('status', 'gender', 'county')
    search_fields = ('sha_number', 'first_name', 'last_name', 'national_id', 'phone', 'email')
    ordering = ('-created_at',)
    readonly_fields = ('sha_number', 'registration_date', 'created_at', 'updated_at',
                       'total_contributions_display', 'total_claims_count')
    list_per_page = 25
    date_hierarchy = 'registration_date'

    fieldsets = (
        ('SHA Identity', {
            'fields': ('sha_number', 'national_id', 'status')
        }),
        ('Personal Details', {
            'fields': ('first_name', 'last_name', 'date_of_birth', 'gender')
        }),
        ('Contact Information', {
            'fields': ('phone', 'email')
        }),
        ('Location & Employment', {
            'fields': ('county', 'employer')
        }),
        ('Financial', {
            'fields': ('monthly_contribution', 'total_contributions_display')
        }),
        ('Statistics', {
            'fields': ('total_claims_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('registration_date', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def status_badge(self, obj):
        colors = {'active': '#16a34a', 'inactive': '#6b7280', 'suspended': '#dc2626'}
        color = colors.get(obj.status, '#666')
        return format_html(
            '<span style="background:{};color:white;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.status.upper()
        )
    status_badge.short_description = 'Status'

    def total_claims_count(self, obj):
        count = obj.claims.count()
        return format_html('<b>{}</b> claims', count)
    total_claims_count.short_description = 'Total Claims'

    def total_contributions_display(self, obj):
        total = obj.contributions.filter(status='confirmed').aggregate(Sum('amount'))['amount__sum'] or 0
        return format_html('<b style="color:#006600">KES {:,.2f}</b>', total)
    total_contributions_display.short_description = 'Total Confirmed Contributions'


# ─── Claim Admin ───────────────────────────────────────────────────────────────

@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ('claim_number', 'member_link', 'facility', 'claim_type',
                    'total_amount_display', 'approved_amount_display', 'status_badge',
                    'admission_date', 'processed_by')
    list_filter = ('status', 'claim_type', 'facility__county', 'admission_date')
    search_fields = ('claim_number', 'member__first_name', 'member__last_name',
                     'member__sha_number', 'diagnosis')
    ordering = ('-created_at',)
    readonly_fields = ('claim_number', 'created_at', 'updated_at')
    list_per_page = 25
    date_hierarchy = 'admission_date'
    raw_id_fields = ('member', 'facility')
    autocomplete_fields = []

    fieldsets = (
        ('Claim Identity', {
            'fields': ('claim_number', 'status')
        }),
        ('Patient & Facility', {
            'fields': ('member', 'facility')
        }),
        ('Medical Details', {
            'fields': ('claim_type', 'diagnosis', 'admission_date', 'discharge_date')
        }),
        ('Financial', {
            'fields': ('total_amount', 'approved_amount')
        }),
        ('Processing', {
            'fields': ('processed_by', 'rejection_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def status_badge(self, obj):
        colors = {
            'pending': '#d97706', 'under_review': '#0891b2',
            'approved': '#16a34a', 'rejected': '#dc2626', 'paid': '#7c3aed'
        }
        color = colors.get(obj.status, '#666')
        return format_html(
            '<span style="background:{};color:white;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.status.replace('_', ' ').upper()
        )
    status_badge.short_description = 'Status'

    def member_link(self, obj):
        return format_html(
            '<b>{}</b><br><small style="color:#666">{}</small>',
            obj.member.full_name, obj.member.sha_number
        )
    member_link.short_description = 'Member'

    def total_amount_display(self, obj):
        return format_html('KES <b>{:,.0f}</b>', obj.total_amount)
    total_amount_display.short_description = 'Total'

    def approved_amount_display(self, obj):
        if obj.approved_amount:
            return format_html('<span style="color:#16a34a">KES <b>{:,.0f}</b></span>', obj.approved_amount)
        return format_html('<span style="color:#9ca3af">—</span>')
    approved_amount_display.short_description = 'Approved'

    def save_model(self, request, obj, form, change):
        if obj.status not in ('pending',) and not obj.processed_by:
            obj.processed_by = request.user
        super().save_model(request, obj, form, change)


# ─── Contribution Admin ────────────────────────────────────────────────────────

@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = ('transaction_ref', 'member_link', 'amount_display', 'payment_method_badge',
                    'period_display', 'payment_date', 'status_badge', 'created_at')
    list_filter = ('status', 'payment_method', 'period_year', 'period_month')
    search_fields = ('transaction_ref', 'member__first_name', 'member__last_name', 'member__sha_number')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    list_per_page = 25
    date_hierarchy = 'payment_date'
    raw_id_fields = ('member',)

    fieldsets = (
        ('Transaction', {
            'fields': ('transaction_ref', 'status')
        }),
        ('Member', {
            'fields': ('member',)
        }),
        ('Payment Details', {
            'fields': ('amount', 'payment_method', 'payment_date')
        }),
        ('Coverage Period', {
            'fields': ('period_month', 'period_year')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def status_badge(self, obj):
        colors = {'pending': '#d97706', 'confirmed': '#16a34a', 'failed': '#dc2626'}
        color = colors.get(obj.status, '#666')
        return format_html(
            '<span style="background:{};color:white;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.status.upper()
        )
    status_badge.short_description = 'Status'

    def member_link(self, obj):
        return format_html(
            '<b>{}</b><br><small style="color:#666">{}</small>',
            obj.member.full_name, obj.member.sha_number
        )
    member_link.short_description = 'Member'

    def amount_display(self, obj):
        return format_html('<b style="color:#006600">KES {:,.0f}</b>', obj.amount)
    amount_display.short_description = 'Amount'

    def payment_method_badge(self, obj):
        icons = {'mpesa': '📱', 'bank': '🏦', 'cash': '💵', 'payroll': '💼'}
        icon = icons.get(obj.payment_method, '💳')
        return format_html('{} {}', icon, obj.payment_method.upper())
    payment_method_badge.short_description = 'Method'

    def period_display(self, obj):
        months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        month_name = months[obj.period_month - 1] if 1 <= obj.period_month <= 12 else obj.period_month
        return format_html('<b>{} {}</b>', month_name, obj.period_year)
    period_display.short_description = 'Period'


# ─── Admin Site Customization ──────────────────────────────────────────────────

admin.site.site_header = '🇰🇪 SHA Kenya — Social Health Authority'
admin.site.site_title = 'SHA Admin Portal'
admin.site.index_title = 'Management Dashboard'