from rest_framework import serializers
from .models import Document, ExtractionResult


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'title', 'file', 'document_type', 'custom_prompt', 'uploaded_at', 'processed']
        read_only_fields = ['id', 'uploaded_at', 'processed']


class ExtractionResultSerializer(serializers.ModelSerializer):
    document = DocumentSerializer(read_only=True)
    
    class Meta:
        model = ExtractionResult
        fields = ['id', 'document', 'extracted_data', 'processing_time', 'created_at']
        read_only_fields = ['id', 'created_at']


class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    document_type = serializers.ChoiceField(choices=['invoice', 'resume', 'research_paper', 'other'])
    custom_prompt = serializers.CharField(required=False, allow_blank=True)
    title = serializers.CharField(max_length=255, required=False)
