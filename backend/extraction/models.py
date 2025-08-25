from django.db import models
from django.contrib.auth.models import User
import json


class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    DOCUMENT_TYPES = [
        ('invoice', 'Invoice'),
        ('resume', 'Resume'),
        ('research_paper', 'Research Paper'),
        ('other', 'Other'),
    ]
    
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    custom_prompt = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.title} ({self.document_type})"


class ExtractionResult(models.Model):
    document = models.OneToOneField(Document, on_delete=models.CASCADE, related_name='result')
    extracted_data = models.JSONField()
    processing_time = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Result for {self.document.title}"
    
    def get_extracted_data(self):
        return json.loads(self.extracted_data) if isinstance(self.extracted_data, str) else self.extracted_data