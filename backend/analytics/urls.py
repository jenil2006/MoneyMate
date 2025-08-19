from django.urls import path
from . import views

urlpatterns = [
    path('', views.analytics_view, name='analytics'),
     path('investment-plan/', views.investment_plan_view, name='investment-plan')
]