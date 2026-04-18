"""
Centralized Gemini AI Configuration
===================================
Single source of truth for Gemini API configuration across all AI services.

Environment Variables Required:
- GEMINI_API_KEY: Your Google AI Studio API key
- GOOGLE_AI_API_KEY: Alternative key name (for backward compatibility)
"""

import os
from typing import Optional
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class GeminiConfig:
    """Centralized Gemini AI configuration and initialization."""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        """Singleton pattern to ensure only one configuration instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Gemini API configuration."""
        if not self._initialized:
            # Try multiple environment variable names
            self.api_key = (
                os.getenv('GEMINI_API_KEY') or 
                os.getenv('GOOGLE_AI_API_KEY') or
                os.getenv('GOOGLE_GEMINI_API_KEY')
            )
            
            if not self.api_key:
                raise ValueError(
                    "❌ GEMINI_API_KEY environment variable is required!\n\n"
                    "To use VerSona AI features, you must configure Google Gemini API:\n"
                    "1. Get your API key from: https://makersuite.google.com/app/apikey\n"
                    "2. Create a .env file in python-backend/ directory\n"
                    "3. Add: GEMINI_API_KEY=your_api_key_here\n\n"
                    "VerSona's AI features rely entirely on Gemini AI and cannot function without it."
                )
            
            # Configure Gemini
            try:
                genai.configure(api_key=self.api_key)
                self._initialized = True
                print("✅ Gemini AI initialized successfully!")
            except Exception as e:
                raise ValueError(
                    f"❌ Failed to initialize Gemini AI: {str(e)}\n"
                    "Please check your GEMINI_API_KEY is valid."
                )
    
    def get_model(self, model_name: str = 'gemini-pro') -> genai.GenerativeModel:
        """
        Get a Gemini model instance.
        
        Args:
            model_name: Name of the model (default: gemini-pro)
            
        Returns:
            Configured Gemini model instance
        """
        return genai.GenerativeModel(model_name)
    
    def get_vision_model(self) -> genai.GenerativeModel:
        """
        Get Gemini Pro Vision model for image understanding.
        
        Returns:
            Configured Gemini Pro Vision model instance
        """
        return genai.GenerativeModel('gemini-pro-vision')
    
    @property
    def is_configured(self) -> bool:
        """Check if Gemini API is properly configured."""
        return self._initialized and self.api_key is not None


# Global instance
_gemini_config = None


def get_gemini_config() -> GeminiConfig:
    """
    Get the global Gemini configuration instance.
    
    Returns:
        GeminiConfig instance
        
    Raises:
        ValueError: If GEMINI_API_KEY is not configured
    """
    global _gemini_config
    if _gemini_config is None:
        _gemini_config = GeminiConfig()
    return _gemini_config


def get_gemini_model(model_name: str = 'gemini-pro') -> genai.GenerativeModel:
    """
    Convenience function to get a Gemini model.
    
    Args:
        model_name: Name of the model
        
    Returns:
        Configured Gemini model instance
    """
    config = get_gemini_config()
    return config.get_model(model_name)


# Example usage and testing
if __name__ == "__main__":
    try:
        # Initialize configuration
        config = get_gemini_config()
        print(f"Gemini API configured: {config.is_configured}")
        
        # Get model instance
        model = get_gemini_model()
        print("Model instance created successfully!")
        
        # Test simple query
        response = model.generate_content("Say 'Hello, VerSona!' in a friendly way.")
        print(f"\nTest response: {response.text}")
        
    except ValueError as e:
        print(f"\nConfiguration Error:\n{e}")
    except Exception as e:
        print(f"\nUnexpected Error:\n{e}")
