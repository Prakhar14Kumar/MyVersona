"""
Input sanitization service
Prevents XSS and other injection attacks
"""
import bleach
from typing import Optional

# Allowed HTML tags for rich text (very restrictive for security)
ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li']
ALLOWED_ATTRS = {
    'a': ['href', 'title'],
}

# Allowed protocols for links
ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']

def sanitize_html(text: Optional[str], allow_tags: bool = False) -> str:
    """
    Sanitize HTML content
    
    Args:
        text: Raw HTML text
        allow_tags: If True, allows basic formatting tags. If False, strips all HTML.
    
    Returns:
        Sanitized text safe for display
    """
    if not text:
        return ""
    
    if allow_tags:
        # Allow basic formatting but remove dangerous content
        return bleach.clean(
            text,
            tags=ALLOWED_TAGS,
            attributes=ALLOWED_ATTRS,
            protocols=ALLOWED_PROTOCOLS,
            strip=True
        )
    else:
        # Strip all HTML
        return bleach.clean(text, tags=[], strip=True)

def sanitize_plain_text(text: Optional[str], max_length: Optional[int] = None) -> str:
    """
    Strip all HTML and optionally limit length
    
    Args:
        text: Raw text
        max_length: Maximum length (optional)
    
    Returns:
        Plain text with no HTML
    """
    if not text:
        return ""
    
    # Remove all HTML tags
    cleaned = bleach.clean(text, tags=[], strip=True)
    
    # Trim whitespace
    cleaned = cleaned.strip()
    
    # Limit length if specified
    if max_length and len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    
    return cleaned

def sanitize_url(url: Optional[str]) -> Optional[str]:
    """
    Validate and sanitize URL
    
    Args:
        url: URL to sanitize
    
    Returns:
        Safe URL or None if invalid
    """
    if not url:
        return None
    
    # Basic URL validation
    url = url.strip()
    
    # Only allow http/https
    if not url.startswith(('http://', 'https://')):
        return None
    
    # Use bleach to clean the URL
    return bleach.clean(url, tags=[], strip=True)

def sanitize_filename(filename: Optional[str]) -> str:
    """
    Sanitize filename to prevent path traversal
    
    Args:
        filename: Original filename
    
    Returns:
        Safe filename
    """
    if not filename:
        return "untitled"
    
    # Remove path separators
    filename = filename.replace('/', '').replace('\\', '')
    
    # Remove potentially dangerous characters
    dangerous_chars = ['..', '<', '>', ':', '"', '|', '?', '*']
    for char in dangerous_chars:
        filename = filename.replace(char, '')
    
    # Limit length
    if len(filename) > 255:
        # Keep extension if present
        parts = filename.rsplit('.', 1)
        if len(parts) == 2:
            name, ext = parts
            filename = name[:250] + '.' + ext[:4]
        else:
            filename = filename[:255]
    
    return filename or "untitled"
