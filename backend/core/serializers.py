from rest_framework import serializers
from django.contrib.auth.models import User
from .models import County, HealthFacility, Member, Claim, Contribution


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']


class CountySerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    facility_count = serializers.SerializerMethodField()

    class Meta:
        model = County
        fields = '__all__'

    def get_member_count(self, obj):
        return obj.members.count()

    def get_facility_count(self, obj):
        return obj.facilities.count()


class HealthFacilitySerializer(serializers.ModelSerializer):
    county_name = serializers.CharField(source='county.name', read_only=True)
    claim_count = serializers.SerializerMethodField()

    class Meta:
        model = HealthFacility
        fields = '__all__'

    def get_claim_count(self, obj):
        return obj.claims.count()


class MemberSerializer(serializers.ModelSerializer):
    county_name = serializers.CharField(source='county.name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    total_contributions = serializers.SerializerMethodField()
    total_claims = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = '__all__'

    def get_total_contributions(self, obj):
        from django.db.models import Sum
        result = obj.contributions.filter(status='confirmed').aggregate(Sum('amount'))
        return float(result['amount__sum'] or 0)

    def get_total_claims(self, obj):
        return obj.claims.count()


class ClaimSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_sha = serializers.CharField(source='member.sha_number', read_only=True)
    facility_name = serializers.CharField(source='facility.name', read_only=True)
    processed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Claim
        fields = '__all__'

    def get_processed_by_name(self, obj):
        if obj.processed_by:
            return f"{obj.processed_by.first_name} {obj.processed_by.last_name}"
        return None


class ContributionSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_sha = serializers.CharField(source='member.sha_number', read_only=True)

    class Meta:
        model = Contribution
        fields = '__all__'