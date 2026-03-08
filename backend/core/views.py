from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import date, timedelta
import random, string

from .models import County, HealthFacility, Member, Claim, Contribution
from .serializers import (CountySerializer, HealthFacilitySerializer,
                          MemberSerializer, ClaimSerializer, ContributionSerializer, UserSerializer)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Comprehensive dashboard statistics"""
    today = date.today()
    this_month = today.month
    this_year = today.year

    # Core stats
    total_members = Member.objects.count()
    active_members = Member.objects.filter(status='active').count()
    total_facilities = HealthFacility.objects.count()
    active_facilities = HealthFacility.objects.filter(status='active').count()

    # Claims stats
    total_claims = Claim.objects.count()
    pending_claims = Claim.objects.filter(status='pending').count()
    approved_claims = Claim.objects.filter(status='approved').count()
    rejected_claims = Claim.objects.filter(status='rejected').count()
    paid_claims = Claim.objects.filter(status='paid').count()

    total_approved_amount = Claim.objects.filter(
        status__in=['approved', 'paid']
    ).aggregate(Sum('approved_amount'))['approved_amount__sum'] or 0

    # Contributions
    total_contributions = Contribution.objects.filter(
        status='confirmed'
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    monthly_contributions = Contribution.objects.filter(
        status='confirmed', period_month=this_month, period_year=this_year
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    # Monthly claims trend (last 6 months)
    claims_trend = []
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for i in range(5, -1, -1):
        m = (this_month - i - 1) % 12 + 1
        y = this_year if this_month - i > 0 else this_year - 1
        count = Claim.objects.filter(created_at__month=m, created_at__year=y).count()
        amount = Claim.objects.filter(
            created_at__month=m, created_at__year=y, status__in=['approved', 'paid']
        ).aggregate(Sum('approved_amount'))['approved_amount__sum'] or 0
        claims_trend.append({'month': months[m - 1], 'claims': count, 'amount': float(amount)})

    # Claims by type
    claims_by_type = list(Claim.objects.values('claim_type').annotate(count=Count('id')))

    # Top counties by members
    top_counties = list(
        County.objects.annotate(member_count=Count('members')).order_by('-member_count')[:5].values('name', 'member_count')
    )

    # Members trend (registrations per month)
    members_trend = []
    for i in range(5, -1, -1):
        m = (this_month - i - 1) % 12 + 1
        y = this_year if this_month - i > 0 else this_year - 1
        count = Member.objects.filter(created_at__month=m, created_at__year=y).count()
        members_trend.append({'month': months[m - 1], 'registrations': count})

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


def generate_sha_number():
    return 'SHA' + ''.join(random.choices(string.digits, k=9))

def generate_claim_number():
    return 'CLM' + ''.join(random.choices(string.digits, k=8))

def generate_transaction_ref():
    return 'TXN' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))


class CountyViewSet(viewsets.ModelViewSet):
    queryset = County.objects.all()
    serializer_class = CountySerializer
    permission_classes = [IsAuthenticated]


class HealthFacilityViewSet(viewsets.ModelViewSet):
    queryset = HealthFacility.objects.select_related('county').all()
    serializer_class = HealthFacilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        county = self.request.query_params.get('county')
        status = self.request.query_params.get('status')
        ftype = self.request.query_params.get('type')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(facility_code__icontains=search))
        if county:
            qs = qs.filter(county_id=county)
        if status:
            qs = qs.filter(status=status)
        if ftype:
            qs = qs.filter(facility_type=ftype)
        return qs


class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.select_related('county').all()
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        county = self.request.query_params.get('county')
        status = self.request.query_params.get('status')
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) | Q(last_name__icontains=search) |
                Q(sha_number__icontains=search) | Q(national_id__icontains=search)
            )
        if county:
            qs = qs.filter(county_id=county)
        if status:
            qs = qs.filter(status=status)
        return qs

    def perform_create(self, serializer):
        if not serializer.validated_data.get('sha_number'):
            serializer.save(sha_number=generate_sha_number())
        else:
            serializer.save()


class ClaimViewSet(viewsets.ModelViewSet):
    queryset = Claim.objects.select_related('member', 'facility', 'processed_by').all()
    serializer_class = ClaimSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        status = self.request.query_params.get('status')
        claim_type = self.request.query_params.get('claim_type')
        if search:
            qs = qs.filter(
                Q(claim_number__icontains=search) | Q(member__first_name__icontains=search) |
                Q(member__last_name__icontains=search) | Q(member__sha_number__icontains=search)
            )
        if status:
            qs = qs.filter(status=status)
        if claim_type:
            qs = qs.filter(claim_type=claim_type)
        return qs

    def perform_create(self, serializer):
        if not serializer.validated_data.get('claim_number'):
            serializer.save(claim_number=generate_claim_number())
        else:
            serializer.save()


class ContributionViewSet(viewsets.ModelViewSet):
    queryset = Contribution.objects.select_related('member').all()
    serializer_class = ContributionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        status = self.request.query_params.get('status')
        member = self.request.query_params.get('member')
        if search:
            qs = qs.filter(
                Q(transaction_ref__icontains=search) | Q(member__sha_number__icontains=search) |
                Q(member__first_name__icontains=search)
            )
        if status:
            qs = qs.filter(status=status)
        if member:
            qs = qs.filter(member_id=member)
        return qs

    def perform_create(self, serializer):
        if not serializer.validated_data.get('transaction_ref'):
            serializer.save(transaction_ref=generate_transaction_ref())
        else:
            serializer.save()