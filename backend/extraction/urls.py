
from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
    TokenBlacklistView,
)

urlpatterns = [
    path('register/', views.register, name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('extract/', views.extract_document, name='extract_document'),
    path('documents/', views.get_documents, name='get_documents'),
    path('documents/<int:document_id>/', views.get_document_detail, name='get_document_detail'),
    path('documents/<int:document_id>/ask_question/', views.ask_question, name='ask_question'),
]