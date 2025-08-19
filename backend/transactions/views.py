from rest_framework import generics, permissions
from .models import Transaction
from .serializers import TransactionSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Q # <-- Import Q
from django.db import models
from rest_framework.views import APIView
from datetime import datetime
from django.db.models.functions import TruncDay



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_trend(request):
    user = request.user
    current_month = datetime.now().month
    current_year = datetime.now().year

    # Group transactions by day
    qs = Transaction.objects.filter(
        user=user,
        date__month=current_month,
        date__year=current_year
    ).annotate(day=TruncDay('date')).values('day', 'type').annotate(
        total=Sum('amount')
    ).order_by('day')

    # Structure as day-wise income and expense
    data = {}
    for row in qs:
        day_str = row['day'].strftime("%d %b")
        if day_str not in data:
            data[day_str] = {"day": day_str, "income": 0, "expense": 0}
        if row['type'] == 'income':
            data[day_str]["income"] = row['total']
        else:
            data[day_str]["expense"] = row['total']

    return Response(list(data.values()))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    user = request.user
    income = Transaction.objects.filter(user=user, type='income').aggregate(total=Sum('amount'))['total'] or 0
    expense = Transaction.objects.filter(user=user, type='expense').aggregate(total=Sum('amount'))['total'] or 0
    balance = income - expense

    data = {
        "total_income": income,
        "total_expense": expense,
        "balance": balance,
    }
    return Response(data)   

    
class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

class TransactionSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        
        user = request.user
        
        current_month = datetime.now().month
        current_year = datetime.now().year

        total_income = Transaction.objects.filter(
            user=user, 
            type='income',
            date__month=current_month,
            date__year=current_year
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_expense = Transaction.objects.filter(
            user=user, 
            type='expense',
            date__month=current_month,
            date__year=current_year
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        balance = Transaction.objects.filter(user=user).aggregate(
            balance=Sum('amount', filter=models.Q(type='income')) - Sum('amount', filter=models.Q(type='expense'))
        )['balance'] or 0

        return Response({
            'total_income': total_income,
            'total_expense': total_expense,
            'balance': balance
        })
