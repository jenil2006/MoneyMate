from django.urls import path
from .views import TransactionListCreateView, TransactionRetrieveUpdateDestroyView,TransactionSummaryView,daily_trend

urlpatterns = [
    path('', TransactionListCreateView.as_view(), name='transaction-list-create'),         
    path('<int:pk>/', TransactionRetrieveUpdateDestroyView.as_view(), name='transaction-detail'), 
    path('summary/', TransactionSummaryView.as_view(), name='transaction-summary'),
    path('daily-trend/', daily_trend, name='transaction-daily-trend')
]
