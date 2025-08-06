from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class InvoiceData(BaseModel):
    invoice_number: Optional[str] = None
    date: Optional[str] = None
    due_date: Optional[str] = None
    vendor_name: Optional[str] = None
    vendor_address: Optional[str] = None
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    total_amount: Optional[float] = None
    tax_amount: Optional[float] = None
    subtotal: Optional[float] = None
    line_items: Optional[List[Dict[str, Any]]] = []


class ResumeData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    summary: Optional[str] = None
    education: Optional[List[Dict[str, Any]]] = []
    experience: Optional[List[Dict[str, Any]]] = []
    skills: Optional[List[str]] = []
    certifications: Optional[List[str]] = []


class ResearchPaperData(BaseModel):
    title: Optional[str] = None
    authors: Optional[List[str]] = []
    abstract: Optional[str] = None
    keywords: Optional[List[str]] = []
    publication_date: Optional[str] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    sections: Optional[List[Dict[str, str]]] = []
    references: Optional[List[str]] = []


class CustomExtractionData(BaseModel):
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
    prompt_used: Optional[str] = None


class DocumentUploadRequest(BaseModel):
    document_type: str = Field(..., regex="^(invoice|resume|research_paper|other)$")
    custom_prompt: Optional[str] = None


class ExtractionResponse(BaseModel):
    success: bool
    document_id: int
    document_type: str
    extracted_data: Dict[str, Any]
    processing_time: float
    message: Optional[str] = None