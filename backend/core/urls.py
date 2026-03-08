from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'counties', views.CountyViewSet, basename='county')
router.register(r'facilities', views.HealthFacilityViewSet, basename='facility')
router.register(r'members', views.MemberViewSet, basename='member')
router.register(r'claims', views.ClaimViewSet, basename='claim')
router.register(r'contributions', views.ContributionViewSet, basename='contribution')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views.dashboard_stats, name='dashboard-stats'),
    path('me/', views.current_user, name='current-user'),
]
