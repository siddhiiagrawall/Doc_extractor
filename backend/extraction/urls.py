from django.urls import path
from . import views

urlpatterns = [
    path('extract/', views.extract_document, name='extract_document'),
    path('documents/', views.get_documents, name='get_documents'),
    path('documents/<int:document_id>/', views.get_document_detail, name='get_document_detail'),
]