from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import time
import logging

from .models import Document, ExtractionResult
from .serializers import DocumentUploadSerializer, ExtractionResultSerializer
from .ai_processor import processor

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ask_question(request, document_id):
    """
    Answer a user question about a specific document using the QA pipeline
    """
    try:
        document = Document.objects.get(id=document_id, user=request.user)
        question = request.data.get('question')
        if not question:
            return Response({'success': False, 'message': 'Question is required.'}, status=status.HTTP_400_BAD_REQUEST)
        # Extract text from the document
        pdf_path = document.file.path
        text = processor.extract_text_from_pdf(pdf_path)
        # Use QA pipeline
        result = processor.answer_question(text, question)
        return Response({'success': True, 'result': result}, status=status.HTTP_200_OK)
    except Document.DoesNotExist:
        return Response({'success': False, 'message': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in ask_question: {e}")
        return Response({'success': False, 'message': 'Error answering question.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.response import Response
from django.db import IntegrityError

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user with email and password
    """
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({'success': False, 'message': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=email).exists():
        return Response({'success': False, 'message': 'User with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.create_user(username=email, email=email, password=password)
        return Response({'success': True, 'message': 'User registered successfully.'}, status=status.HTTP_201_CREATED)
    except IntegrityError:
        return Response({'success': False, 'message': 'User with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import time
import logging

from .models import Document, ExtractionResult
from .serializers import DocumentUploadSerializer, ExtractionResultSerializer
from .ai_processor import processor

logger = logging.getLogger(__name__)


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def extract_document(request):
    """
    API endpoint to upload and extract data from documents
    """
    try:
        serializer = DocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get validated data
        file = serializer.validated_data['file']
        document_type = serializer.validated_data['document_type']
        custom_prompt = serializer.validated_data.get('custom_prompt', '')
        title = serializer.validated_data.get('title', file.name)
        
        # Validate file type
        if not file.name.lower().endswith('.pdf'):
            return Response({
                'success': False,
                'message': 'Only PDF files are supported'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Save document to database
        document = Document.objects.create(
            user=request.user,
            title=title,
            file=file,
            document_type=document_type,
            custom_prompt=custom_prompt if document_type == 'other' else None
        )
        
        # Process the document
        start_time = time.time()
        
        try:
            # Extract text from PDF
            file_path = document.file.path
            text = processor.extract_text_from_pdf(file_path)
            
            if not text.strip():
                return Response({
                    'success': False,
                    'message': 'Could not extract text from PDF'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Process based on document type
            if document_type == 'invoice':
                extracted_data = processor.process_invoice(text)
            elif document_type == 'resume':
                extracted_data = processor.process_resume(text)
            elif document_type == 'research_paper':
                extracted_data = processor.process_research_paper(text)
            elif document_type == 'other':
                extracted_data = processor.process_custom(text, custom_prompt)
            else:
                return Response({
                    'success': False,
                    'message': 'Invalid document type'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            processing_time = time.time() - start_time
            
            # Save extraction result
            result = ExtractionResult.objects.create(
                document=document,
                extracted_data=extracted_data,
                processing_time=processing_time
            )
            
            # Mark document as processed
            document.processed = True
            document.save()
            
            return Response({
                'success': True,
                'document_id': document.id,
                'document_type': document_type,
                'extracted_data': extracted_data,
                'processing_time': processing_time,
                'message': 'Document processed successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error processing document: {e}")
            return Response({
                'success': False,
                'message': f'Error processing document: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"Error in extract_document view: {e}")
        return Response({
            'success': False,
            'message': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_documents(request):
    """
    Get list of all uploaded documents
    """
    try:
        documents = Document.objects.filter(user=request.user).order_by('-uploaded_at')
        data = []
        
        for doc in documents:
            doc_data = {
                'id': doc.id,
                'title': doc.title,
                'document_type': doc.document_type,
                'uploaded_at': doc.uploaded_at,
                'processed': doc.processed
            }
            
            if hasattr(doc, 'result'):
                doc_data['extracted_data'] = doc.result.extracted_data
                doc_data['processing_time'] = doc.result.processing_time
            
            data.append(doc_data)
        
        return Response({
            'success': True,
            'documents': data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error getting documents: {e}")
        return Response({
            'success': False,
            'message': 'Error retrieving documents'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_document_detail(request, document_id):
    """
    Get detailed information about a specific document
    """
    try:
        document = Document.objects.get(id=document_id, user=request.user)
        
        data = {
            'id': document.id,
            'title': document.title,
            'document_type': document.document_type,
            'custom_prompt': document.custom_prompt,
            'uploaded_at': document.uploaded_at,
            'processed': document.processed
        }
        
        if hasattr(document, 'result'):
            data['extracted_data'] = document.result.extracted_data
            data['processing_time'] = document.result.processing_time
            data['created_at'] = document.result.created_at
        
        return Response({
            'success': True,
            'document': data
        }, status=status.HTTP_200_OK)
    
    except Document.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Document not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Error getting document detail: {e}")
        return Response({
            'success': False,
            'message': 'Error retrieving document details'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)