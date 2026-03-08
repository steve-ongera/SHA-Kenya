from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Sum
from .models import County, HealthFacility, Member, Claim, Contribution


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']


class CountySerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True, default=0)
    facility_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = County
        fields = ['id', 'name', 'code', 'created_at', 'member_count', 'facility_count']
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['member_count'] = instance.members.count()
        rep['facility_count'] = instance.facilities.count()
        return rep


class HealthFacilitySerializer(serializers.ModelSerializer):
    county_name = serializers.CharField(source='county.name', read_only=True)
    claim_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = HealthFacility
        fields = [
            'id', 'name', 'facility_code', 'facility_type',
            'county', 'county_name',
            'address', 'phone', 'email', 'status', 'beds',
            'created_at', 'updated_at', 'claim_count',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'county_name', 'claim_count']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['claim_count'] = instance.claims.count()
        return rep


class MemberSerializer(serializers.ModelSerializer):
    county_name = serializers.CharField(source='county.name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    total_contributions = serializers.FloatField(read_only=True, default=0)
    total_claims = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Member
        fields = [
            'id', 'sha_number', 'national_id', 'first_name', 'last_name', 'full_name',
            'date_of_birth', 'gender', 'phone', 'email',
            'county', 'county_name', 'employer', 'monthly_contribution', 'status',
            'registration_date', 'created_at', 'updated_at',
            'total_contributions', 'total_claims',
        ]
        read_only_fields = [
            'id', 'full_name', 'county_name', 'registration_date',
            'created_at', 'updated_at', 'total_contributions', 'total_claims',
        ]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        result = instance.contributions.filter(status='confirmed').aggregate(Sum('amount'))
        rep['total_contributions'] = float(result['amount__sum'] or 0)
        rep['total_claims'] = instance.claims.count()
        return rep


class ClaimSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_sha = serializers.CharField(source='member.sha_number', read_only=True)
    facility_name = serializers.CharField(source='facility.name', read_only=True)
    processed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Claim
        fields = [
            'id', 'claim_number',
            'member', 'member_name', 'member_sha',
            'facility', 'facility_name',
            'claim_type', 'diagnosis',
            'admission_date', 'discharge_date',
            'total_amount', 'approved_amount',
            'status', 'rejection_reason',
            'processed_by', 'processed_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at',
            'member_name', 'member_sha',
            'facility_name', 'processed_by_name',
        ]

    def get_processed_by_name(self, obj):
        if obj.processed_by:
            name = f"{obj.processed_by.first_name} {obj.processed_by.last_name}".strip()
            return name or obj.processed_by.username
        return None


class ContributionSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_sha = serializers.CharField(source='member.sha_number', read_only=True)

    class Meta:
        model = Contribution
        fields = [
            'id', 'member', 'member_name', 'member_sha',
            'amount', 'payment_method', 'transaction_ref',
            'payment_date', 'period_month', 'period_year',
            'status', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'member_name', 'member_sha']