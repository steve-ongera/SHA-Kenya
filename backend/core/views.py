from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from datetime import date
import random, string, logging

from .models import County, HealthFacility, Member, Claim, Contribution
from .serializers import (CountySerializer, HealthFacilitySerializer,
                          MemberSerializer, ClaimSerializer,
                          ContributionSerializer, UserSerializer)

logger = logging.getLogger(__name__)


# ─── Dashboard ────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    today = date.today()
    this_month = today.month
    this_year = today.year

    total_members = Member.objects.count()
    active_members = Member.objects.filter(status='active').count()
    total_facilities = HealthFacility.objects.count()
    active_facilities = HealthFacility.objects.filter(status='active').count()

    total_claims = Claim.objects.count()
    pending_claims = Claim.objects.filter(status='pending').count()
    approved_claims = Claim.objects.filter(status='approved').count()
    rejected_claims = Claim.objects.filter(status='rejected').count()
    paid_claims = Claim.objects.filter(status='paid').count()

    total_approved_amount = Claim.objects.filter(
        status__in=['approved', 'paid']
    ).aggregate(Sum('approved_amount'))['approved_amount__sum'] or 0

    total_contributions = Contribution.objects.filter(
        status='confirmed'
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    monthly_contributions = Contribution.objects.filter(
        status='confirmed', period_month=this_month, period_year=this_year
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    claims_trend = []
    members_trend = []
    for i in range(5, -1, -1):
        offset = this_month - i
        m = (offset - 1) % 12 + 1
        y = this_year if offset > 0 else this_year - 1
        c_count = Claim.objects.filter(created_at__month=m, created_at__year=y).count()
        c_amount = Claim.objects.filter(
            created_at__month=m, created_at__year=y, status__in=['approved', 'paid']
        ).aggregate(Sum('approved_amount'))['approved_amount__sum'] or 0
        claims_trend.append({'month': months[m-1], 'claims': c_count, 'amount': float(c_amount)})
        m_count = Member.objects.filter(created_at__month=m, created_at__year=y).count()
        members_trend.append({'month': months[m-1], 'registrations': m_count})

    claims_by_type = list(Claim.objects.values('claim_type').annotate(count=Count('id')))
    top_counties = list(
        County.objects.annotate(member_count=Count('members'))
        .order_by('-member_count')[:5]
        .values('name', 'member_count')
    )

    return Response({
        'summary': {
            'total_members': total_members,
            'active_members': active_members,
            'total_facilities': total_facilities,
            'active_facilities': active_facilities,
            'total_claims': total_claims,
            'pending_claims': pending_claims,
            'approved_claims': approved_claims,
            'rejected_claims': rejected_claims,
            'paid_claims': paid_claims,
            'total_approved_amount': float(total_approved_amount),
            'total_contributions': float(total_contributions),
            'monthly_contributions': float(monthly_contributions),
        },
        'claims_trend': claims_trend,
        'claims_by_type': claims_by_type,
        'top_counties': top_counties,
        'members_trend': members_trend,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response(UserSerializer(request.user).data)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def generate_sha_number():
    return 'SHA' + ''.join(random.choices(string.digits, k=9))

def generate_claim_number():
    return 'CLM' + ''.join(random.choices(string.digits, k=8))

def generate_transaction_ref():
    return 'TXN' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))


# ─── ViewSets ─────────────────────────────────────────────────────────────────

class CountyViewSet(viewsets.ModelViewSet):
    serializer_class = CountySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = County.objects.all().order_by('name')
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(code__icontains=search)
            )
        return qs

    def create(self, request, *args, **kwargs):
        logger.debug("County POST data: %s", request.data)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error("County validation errors: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)



class HealthFacilityViewSet(viewsets.ModelViewSet):
    serializer_class = HealthFacilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = HealthFacility.objects.select_related('county').all()
        search = self.request.query_params.get('search', '').strip()
        county = self.request.query_params.get('county', '').strip()
        fstatus = self.request.query_params.get('status', '').strip()
        ftype = self.request.query_params.get('type', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(facility_code__icontains=search) |
                Q(county__name__icontains=search)
            )
        if county:
            qs = qs.filter(county_id=county)
        if fstatus:
            qs = qs.filter(status=fstatus)
        if ftype:
            qs = qs.filter(facility_type=ftype)
        return qs


class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Member.objects.select_related('county').all()
        search = self.request.query_params.get('search', '').strip()
        county = self.request.query_params.get('county', '').strip()
        fstatus = self.request.query_params.get('status', '').strip()
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(sha_number__icontains=search) |
                Q(national_id__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search)
            )
        if county:
            qs = qs.filter(county_id=county)
        if fstatus:
            qs = qs.filter(status=fstatus)
        return qs

    def perform_create(self, serializer):
        sha = serializer.validated_data.get('sha_number') or generate_sha_number()
        serializer.save(sha_number=sha)


class ClaimViewSet(viewsets.ModelViewSet):
    serializer_class = ClaimSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Claim.objects.select_related('member', 'facility', 'processed_by').all()
        search = self.request.query_params.get('search', '').strip()
        fstatus = self.request.query_params.get('status', '').strip()
        claim_type = self.request.query_params.get('claim_type', '').strip()
        if search:
            qs = qs.filter(
                Q(claim_number__icontains=search) |
                Q(member__first_name__icontains=search) |
                Q(member__last_name__icontains=search) |
                Q(member__sha_number__icontains=search) |
                Q(diagnosis__icontains=search)
            )
        if fstatus:
            qs = qs.filter(status=fstatus)
        if claim_type:
            qs = qs.filter(claim_type=claim_type)
        return qs

    def perform_create(self, serializer):
        cnum = serializer.validated_data.get('claim_number') or generate_claim_number()
        serializer.save(claim_number=cnum)


class ContributionViewSet(viewsets.ModelViewSet):
    serializer_class = ContributionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Contribution.objects.select_related('member').all()
        search = self.request.query_params.get('search', '').strip()
        fstatus = self.request.query_params.get('status', '').strip()
        member = self.request.query_params.get('member', '').strip()
        if search:
            qs = qs.filter(
                Q(transaction_ref__icontains=search) |
                Q(member__sha_number__icontains=search) |
                Q(member__first_name__icontains=search) |
                Q(member__last_name__icontains=search)
            )
        if fstatus:
            qs = qs.filter(status=fstatus)
        if member:
            qs = qs.filter(member_id=member)
        return qs

    def perform_create(self, serializer):
        ref = serializer.validated_data.get('transaction_ref') or generate_transaction_ref()
        serializer.save(transaction_ref=ref)