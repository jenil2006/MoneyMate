from django.core.mail import send_mail
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer, ChangePasswordSerializer,UserProfileSerializer
from django.contrib.auth import get_user_model
import random, json
from datetime import timedelta
import pytz
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated

User = get_user_model()

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        # This ensures users can only see and edit their own profile
        return self.request.user

# This view handles changing the password
class ChangePasswordView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.request.user

        # Check old password
        if not user.check_password(serializer.data.get("old_password")):
            return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(serializer.data.get("new_password"))
        user.save()
        
        return Response({"status": "password set successfully"}, status=status.HTTP_200_OK)


@api_view(['POST'])
def signup(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'User registered successfully'}, status=201)
    return Response(serializer.errors, status=400)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@csrf_exempt
@api_view(["POST"])
def send_otp_email(request):
    try:
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required"}, status=400)
        
        if not User.objects.filter(email=email).exists():
            return Response({"error": "Email not found"}, status=404)

        otp = str(random.randint(100000, 999999))
        otp_expiry_time = timezone.now() + timedelta(minutes=5)

        # Ensure session exists and save it
        if not request.session.session_key:
            request.session.create()

        request.session['otp'] = otp
        request.session['email'] = email
        request.session['otp_expiry_time'] = otp_expiry_time.isoformat() 
        request.session.modified = True
        request.session.save()

        send_mail("OTP for Password Reset", f"Your OTP is {otp}", None, [email])
        
        response = Response({"message": "OTP sent successfully"}, status=200)
        
        # Explicitly set the session cookie
        if request.session.session_key:
            response.set_cookie(
                'sessionid',
                request.session.session_key,
                max_age=3600,
                domain=None,
                secure=False,
                httponly=False,
                samesite='Lax'
            )
        
        return response
    except Exception as e:
        return Response({"error": "Internal server error. Please try again."}, status=500)

@csrf_exempt
@api_view(["POST"])
def verify_otp(request):
    entered_email = request.data.get("email")
    entered_otp = request.data.get("otp")

    if not entered_email or not entered_otp:
        return Response({"error": "Email and OTP are required"}, status=400)

    # Ensure session exists
    if not request.session.session_key:
        request.session.create()
    
    stored_email = request.session.get("email")
    stored_otp = request.session.get("otp")
    stored_otp_expiry_time_str = request.session.get("otp_expiry_time") 

    if not (stored_email and stored_otp and stored_otp_expiry_time_str):
        return Response({"error": "OTP session data not found or expired. Please request a new OTP."}, status=400)

    try:
        stored_otp_expiry_time = timezone.datetime.fromisoformat(stored_otp_expiry_time_str)
        if stored_otp_expiry_time.tzinfo is None:
            stored_otp_expiry_time = timezone.make_aware(stored_otp_expiry_time, timezone.get_current_timezone())
        stored_otp_expiry_time = stored_otp_expiry_time.astimezone(pytz.utc)

    except ValueError:
        return Response({"error": "Invalid OTP timestamp format. Please request a new OTP."}, status=500)

    if timezone.now().astimezone(pytz.utc) > stored_otp_expiry_time:
        if 'otp' in request.session: del request.session['otp']
        if 'email' in request.session: del request.session['email']
        if 'otp_expiry_time' in request.session: del request.session['otp_expiry_time']
        request.session.modified = True
        return Response({"error": "OTP has expired. Please request a new OTP."}, status=400)

    if entered_email == stored_email and str(entered_otp) == stored_otp:
        if 'otp' in request.session: del request.session['otp']
        if 'email' in request.session: del request.session['email']
        if 'otp_expiry_time' in request.session: del request.session['otp_expiry_time']
        request.session.modified = True

        response = Response({"message": "OTP verified successfully"}, status=200)
        
        if request.session.session_key:
            response.set_cookie(
                'sessionid',
                request.session.session_key,
                max_age=3600,
                domain=None,
                secure=False,
                httponly=False,
                samesite='Lax'
            )
        
        return response
    else:
        return Response({"error": "Invalid OTP"}, status=400)

@csrf_exempt
@api_view(["POST"])
def reset_password(request):
    email = request.data.get("email")
    new_password = request.data.get("new_password")
    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password reset successful"}, status=200)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)