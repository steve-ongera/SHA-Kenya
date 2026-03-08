from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'counties', views.CountyViewSet)
router.register(r'facilities', views.HealthFacilityViewSet)
router.register(r'members', views.MemberViewSet)
router.register(r'claims', views.ClaimViewSet)
router.register(r'contributions', views.ContributionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views.dashboard_stats, name='dashboard-stats'),
    path('me/', views.current_user, name='current-user'),
]