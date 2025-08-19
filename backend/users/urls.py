from django.urls import path
from .views import (
    signup,
    send_otp_email,
    verify_otp,
    reset_password,
    CustomTokenObtainPairView,
    UserProfileView,
    ChangePasswordView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("signup/", signup),
    path("send-otp/", send_otp_email),
    path("verify-otp/", verify_otp),
    path("reset-password/", reset_password),
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
     path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password')
]
