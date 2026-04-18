"""
File upload validation service
Prevents malicious file uploads and ensures file safety
"""
from fastapi import UploadFile, HTTPException
from typing import Set, Optional
import mimetypes

# File size limits (in bytes)
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'}
ALLOWED_VIDEO_EXTENSIONS = {'.mp4', '.webm', '.mov'}
ALLOWED_DOCUMENT_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt'}

# Allowed MIME types
ALLOWED_IMAGE_MIMES = {
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
}

ALLOWED_VIDEO_MIMES = {
    'video/mp4',
    'video/webm',
    'video/quicktime'
}

ALLOWED_DOCUMENT_MIMES = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
}

class FileValidator:
    """File upload validator"""
    
    @staticmethod
    async def validate_image(file: UploadFile) -> bool:
        """
        Validate image upload
        
        Args:
            file: Uploaded file
            
        Returns:
            True if valid
            
        Raises:
            HTTPException: If validation fails
        """
        return await FileValidator._validate_file(
            file,
            ALLOWED_IMAGE_EXTENSIONS,
            ALLOWED_IMAGE_MIMES,
            MAX_IMAGE_SIZE,
            "image"
        )
    
    @staticmethod
    async def validate_video(file: UploadFile) -> bool:
        """
        Validate video upload
        
        Args:
            file: Uploaded file
            
        Returns:
            True if valid
            
        Raises:
            HTTPException: If validation fails
        """
        return await FileValidator._validate_file(
            file,
            ALLOWED_VIDEO_EXTENSIONS,
            ALLOWED_VIDEO_MIMES,
            MAX_VIDEO_SIZE,
            "video"
        )
    
    @staticmethod
    async def validate_document(file: UploadFile) -> bool:
        """
        Validate document upload
        
        Args:
            file: Uploaded file
            
        Returns:
            True if valid
            
        Raises:
            HTTPException: If validation fails
        """
        return await FileValidator._validate_file(
            file,
            ALLOWED_DOCUMENT_EXTENSIONS,
            ALLOWED_DOCUMENT_MIMES,
            MAX_DOCUMENT_SIZE,
            "document"
        )
    
    @staticmethod
    async def _validate_file(
        file: UploadFile,
        allowed_extensions: Set[str],
        allowed_mimes: Set[str],
        max_size: int,
        file_type: str
    ) -> bool:
        """
        Internal file validation
        
        Args:
            file: Uploaded file
            allowed_extensions: Set of allowed file extensions
            allowed_mimes: Set of allowed MIME types
            max_size: Maximum file size in bytes
            file_type: Type description for error messages
            
        Returns:
            True if valid
            
        Raises:
            HTTPException: If validation fails
        """
        if not file or not file.filename:
            raise HTTPException(400, f"No {file_type} file provided")
        
        # Check file extension
        filename = file.filename.lower()
        extension = '.' + filename.split('.')[-1] if '.' in filename else ''
        
        if extension not in allowed_extensions:
            raise HTTPException(
                400,
                f"Invalid {file_type} file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Check MIME type
        if file.content_type and file.content_type not in allowed_mimes:
            raise HTTPException(
                400,
                f"Invalid {file_type} MIME type: {file.content_type}"
            )
        
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to start
        
        if file_size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            raise HTTPException(
                400,
                f"{file_type.capitalize()} file too large. Maximum size: {max_size_mb:.1f}MB"
            )
        
        if file_size == 0:
            raise HTTPException(400, f"{file_type.capitalize()} file is empty")
        
        return True
    
    @staticmethod
    def get_safe_filename(filename: str) -> str:
        """
        Generate a safe filename
        
        Args:
            filename: Original filename
            
        Returns:
            Safe filename with dangerous characters removed
        """
        if not filename:
            return "untitled"
        
        # Remove path separators
        filename = filename.replace('/', '').replace('\\', '')
        
        # Remove dangerous characters
        dangerous_chars = ['..', '<', '>', ':', '"', '|', '?', '*', '\0']
        for char in dangerous_chars:
            filename = filename.replace(char, '')
        
        # Remove leading/trailing dots and spaces
        filename = filename.strip('. ')
        
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
