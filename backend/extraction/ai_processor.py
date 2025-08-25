import fitz  # PyMuPDF
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from PIL import Image
import io
import time
import logging
from typing import Dict, Any, Optional
import re
import json
import numpy as np
# Add to top of file
from llama_cpp import Llama
import os


# Load Mistral GGUF model path from environment variable or use default
DEFAULT_MODEL_PATH = "models/mistral/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
MODEL_PATH = os.environ.get("MISTRAL_MODEL_PATH", DEFAULT_MODEL_PATH)

def get_llama_model():
    if not hasattr(get_llama_model, "llm"):
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Mistral model not found at {MODEL_PATH}")
        get_llama_model.llm = Llama(
            model_path=MODEL_PATH,
            n_ctx=4096,
            n_threads=8,     # You have 4 cores / 8 threads (i3), use max
            n_gpu_layers=0,  # CPU inference
            verbose=False
        )
    return get_llama_model.llm


logger = logging.getLogger(__name__)

def make_json_serializable(data):
    if isinstance(data, dict):
        return {k: make_json_serializable(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [make_json_serializable(item) for item in data]
    elif isinstance(data, np.integer):
        return int(data)
    elif isinstance(data, np.floating):
        return float(data)
    elif isinstance(data, np.ndarray):
        return data.tolist()
    return data

class DocumentProcessor:
    def _load_models(self):
        try:
            self.models['invoice'] = pipeline(
                "token-classification",
                model="dbmdz/bert-large-cased-finetuned-conll03-english",
                device=0 if self.device == "cuda" else -1
            )
            self.models['resume'] = pipeline(
                "token-classification",
                model="dbmdz/bert-large-cased-finetuned-conll03-english",
                device=0 if self.device == "cuda" else -1
            )
            self.models['research_paper'] = pipeline(
                "summarization",
                model="facebook/bart-large-cnn",
                device=0 if self.device == "cuda" else -1
            )
            self.models['other'] = None  # placeholder
            # Add QA pipeline for open-ended Q&A
            try:
                self.models['qa'] = pipeline(
                    "question-answering",
                    model="deepset/roberta-base-squad2",
                    device=0 if self.device == "cuda" else -1
                )
            except Exception as e:
                logger.error(f"Error loading QA model: {e}")
                self.models['qa'] = None
            logger.info("All models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            self._load_fallback_models()

    def answer_question(self, text: str, question: str) -> Dict[str, Any]:
        """Answer a question about the document text using a QA model."""
        if not self.models.get('qa'):
            return {"error": "QA model not available"}
        try:
            result = self.models['qa']({"context": text, "question": question})
            return {
                "question": question,
                "answer": result.get("answer"),
                "score": result.get("score")
            }
        except Exception as e:
            logger.error(f"Error answering question: {e}")
            return {"error": str(e)}
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.models = {}
        self._load_models()
    
    def _load_models(self):
        try:
            self.models['invoice'] = pipeline(
                "token-classification",
                model="dbmdz/bert-large-cased-finetuned-conll03-english",
                device=0 if self.device == "cuda" else -1
            )
            self.models['resume'] = pipeline(
                "token-classification", 
                model="dbmdz/bert-large-cased-finetuned-conll03-english",
                device=0 if self.device == "cuda" else -1
            )
            self.models['research_paper'] = pipeline(
                "summarization",
                model="facebook/bart-large-cnn",
                device=0 if self.device == "cuda" else -1
            )
            self.models['other'] = None  # placeholder
            logger.info("All models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            self._load_fallback_models()
    
    def _load_fallback_models(self):
        self.models['invoice'] = None
        self.models['resume'] = None
        self.models['research_paper'] = None
        self.models['other'] = None
        logger.info("Using fallback text processing")

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        try:
            doc = fitz.open(pdf_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return ""
    
    def process_invoice(self, text: str) -> Dict[str, Any]:
        try:
            invoice_data = {
                "invoice_number": self._extract_invoice_number(text),
                "date": self._extract_date(text),
                "vendor_name": self._extract_vendor_name(text),
                "total_amount": self._extract_total_amount(text),
                "line_items": self._extract_line_items(text)
            }
            if self.models.get('invoice'):
                try:
                    entities = self.models['invoice'](text[:512])
                    invoice_data['entities'] = entities
                except Exception as e:
                    logger.warning(f"Model processing failed: {e}")
            return make_json_serializable(invoice_data)
        except Exception as e:
            logger.error(f"Error processing invoice: {e}")
            return {"error": str(e)}
    
    def process_resume(self, text: str) -> Dict[str, Any]:
        try:
            resume_data = {
                "name": self._extract_name(text),
                "email": self._extract_email(text),
                "phone": self._extract_phone(text),
                "education": self._extract_education(text),
                "experience": self._extract_experience(text),
                "skills": self._extract_skills(text)
            }
            if self.models.get('resume'):
                try:
                    entities = self.models['resume'](text[:512])
                    resume_data['entities'] = entities
                except Exception as e:
                    logger.warning(f"Model processing failed: {e}")
            return make_json_serializable(resume_data)
        except Exception as e:
            logger.error(f"Error processing resume: {e}")
            return {"error": str(e)}

    def process_research_paper(self, text: str) -> Dict[str, Any]:
        try:
            paper_data = {
                "title": self._extract_title(text),
                "authors": self._extract_authors(text),
                "abstract": self._extract_abstract(text),
                "keywords": self._extract_keywords(text),
                "sections": self._extract_sections(text)
            }
            if self.models.get('research_paper'):
                try:
                    summary_text = text[:1024]
                    summary = self.models['research_paper'](summary_text, max_length=150, min_length=50)
                    paper_data['summary'] = summary[0]['summary_text']
                except Exception as e:
                    logger.warning(f"Summarization failed: {e}")
            return make_json_serializable(paper_data)
        except Exception as e:
            logger.error(f"Error processing research paper: {e}")
            return {"error": str(e)}

    def process_custom(self, text: str, prompt: str) -> Dict[str, Any]:
        """Process document using Mistral-7B-Instruct locally"""
        # Basic prompt sanitization (prevent prompt injection/abuse)
        safe_prompt = prompt.replace("[INST]", "").replace("[/INST]", "").strip()[:500]
        try:
            chunks = [text[i:i+3000] for i in range(0, len(text), 3000)]
            full_response = ""

            llm = get_llama_model()

            for chunk in chunks:
                full_prompt = f"[INST] {safe_prompt}\n\n{chunk.strip()} [/INST]"
                result = llm(full_prompt, max_tokens=1024, stop=["</s>"])
                response = result["choices"][0]["text"].strip()
                full_response += response + "\n---\n"

            return {
                "prompt_used": safe_prompt,
                "model": "mistral-7b-instruct.Q4_K_M.gguf (local)",
                "result": full_response.strip()
            }

        except Exception as e:
            logger.error(f"Error using Mistral: {e}")
            return {"error": str(e)}

        
    # Helper methods for text extraction
    def _extract_invoice_number(self, text: str) -> Optional[str]:
        patterns = [
            r'invoice\s*#?\s*:?\s*([A-Z0-9-]+)',
            r'inv\s*#?\s*:?\s*([A-Z0-9-]+)',
            r'#\s*([A-Z0-9-]+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None
    
    def _extract_date(self, text: str) -> Optional[str]:
        patterns = [
            r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b',
            r'\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b',
            r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None
    
    def _extract_vendor_name(self, text: str) -> Optional[str]:
        lines = text.split('\n')[:5]  # Check first 5 lines
        for line in lines:
            if len(line.strip()) > 3 and not re.search(r'\d', line):
                return line.strip()
        return None
    
    def _extract_total_amount(self, text: str) -> Optional[float]:
        patterns = [
            r'total\s*:?\s*\$?(\d+\.?\d*)',
            r'amount\s*:?\s*\$?(\d+\.?\d*)',
            r'\$(\d+\.?\d*)'
        ]
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                try:
                    return float(matches[-1])  # Return last match (likely the total)
                except ValueError:
                    continue
        return None
    
    def _extract_line_items(self, text: str) -> list:
        # Simple line item extraction
        lines = text.split('\n')
        items = []
        for line in lines:
            if re.search(r'\$\d+', line) and len(line.strip()) > 10:
                items.append({"description": line.strip()})
        return items[:10]  # Limit to 10 items
    
    def _extract_name(self, text: str) -> Optional[str]:
        lines = text.split('\n')[:3]
        for line in lines:
            if len(line.strip()) > 5 and len(line.strip()) < 50:
                if not re.search(r'@|phone|email|address', line, re.IGNORECASE):
                    return line.strip()
        return None
    
    def _extract_email(self, text: str) -> Optional[str]:
        pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(pattern, text)
        return match.group(0) if match else None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        patterns = [
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            r'\(\d{3}\)\s*\d{3}[-.]?\d{4}'
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        return None
    
    def _extract_education(self, text: str) -> list:
        education_keywords = ['university', 'college', 'degree', 'bachelor', 'master', 'phd', 'education']
        lines = text.split('\n')
        education = []
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in education_keywords):
                education.append({"institution": line.strip()})
        return education[:5]
    
    def _extract_experience(self, text: str) -> list:
        experience_keywords = ['experience', 'work', 'employment', 'job', 'position']
        lines = text.split('\n')
        experience = []
        for line in lines:
            if any(keyword in line.lower() for keyword in experience_keywords):
                experience.append({"position": line.strip()})
        return experience[:5]
    
    def _extract_skills(self, text: str) -> list:
        skill_keywords = ['python', 'java', 'javascript', 'react', 'django', 'sql', 'html', 'css']
        skills = []
        for skill in skill_keywords:
            if skill in text.lower():
                skills.append(skill.title())
        return skills
    
    def _extract_title(self, text: str) -> Optional[str]:
        lines = text.split('\n')[:5]
        for line in lines:
            if len(line.strip()) > 10 and len(line.strip()) < 200:
                return line.strip()
        return None
    
    def _extract_authors(self, text: str) -> list:
        # Simple author extraction
        lines = text.split('\n')[:10]
        authors = []
        for line in lines:
            if 'author' in line.lower() or re.search(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', line):
                authors.append(line.strip())
        return authors[:5]
    
    def _extract_abstract(self, text: str) -> Optional[str]:
        abstract_match = re.search(r'abstract\s*:?\s*(.*?)(?=\n\n|\nkeywords|\nintroduction)', text, re.IGNORECASE | re.DOTALL)
        if abstract_match:
            return abstract_match.group(1).strip()
        return None
    
    def _extract_keywords(self, text: str) -> list:
        keyword_match = re.search(r'keywords?\s*:?\s*(.*?)(?=\n\n|\nintroduction)', text, re.IGNORECASE)
        if keyword_match:
            keywords = keyword_match.group(1).split(',')
            return [kw.strip() for kw in keywords[:10]]
        return []
    
    def _extract_sections(self, text: str) -> list:
        sections = []
        section_headers = re.findall(r'\n([A-Z][A-Za-z\s]+)\n', text)
        for header in section_headers[:10]:
            sections.append({"title": header.strip()})
        return sections
    
    def _analyze_with_prompt(self, text: str, prompt: str) -> Dict[str, Any]:
        """Analyze text based on custom prompt"""
        # Simple keyword-based analysis
        prompt_words = prompt.lower().split()
        analysis = {}
        
        for word in prompt_words:
            if word in text.lower():
                analysis[f"contains_{word}"] = True
            else:
                analysis[f"contains_{word}"] = False
        
        analysis["text_snippet"] = text[:200]
        return analysis


# Global processor instance
processor = DocumentProcessor()