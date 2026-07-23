import os
from pypdf import PdfReader
import logging

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts plain text from a PDF file.
    If extraction fails or the file doesn't exist, returns empty string.
    """
    if not os.path.exists(file_path):
        logger.warning(f"File not found for extraction: {file_path}")
        return ""
    
    try:
        reader = PdfReader(file_path)
        text = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
        return "\n".join(text)
    except Exception as e:
        logger.error(f"Error extracting text from PDF {file_path}: {e}")
        # Fallback to empty string
        return ""
