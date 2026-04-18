#!/usr/bin/env python3
"""
VerSona AI Backend - Gemini Setup Helper
=========================================
Interactive script to help configure Gemini API key.
"""

import os
import sys
from pathlib import Path


def print_header():
    """Print welcome header."""
    print("\n" + "=" * 60)
    print("  VerSona AI Backend - Gemini API Setup")
    print("=" * 60)
    print("\nThis script will help you configure Google Gemini AI.\n")


def check_existing_key():
    """Check if API key already exists."""
    env_path = Path(".env")
    if env_path.exists():
        with open(env_path, 'r') as f:
            content = f.read()
            if 'GEMINI_API_KEY=' in content and 'your_gemini_api_key_here' not in content:
                print("✅ Gemini API key is already configured in .env file")
                return True
    return False


def create_env_file(api_key: str):
    """Create or update .env file with API key."""
    env_path = Path(".env")
    env_example_path = Path(".env.example")
    
    if env_path.exists():
        # Update existing file
        with open(env_path, 'r') as f:
            lines = f.readlines()
        
        updated = False
        new_lines = []
        for line in lines:
            if line.startswith('GEMINI_API_KEY=') or line.startswith('# GEMINI_API_KEY='):
                new_lines.append(f'GEMINI_API_KEY={api_key}\n')
                updated = True
            else:
                new_lines.append(line)
        
        if not updated:
            new_lines.insert(0, f'GEMINI_API_KEY={api_key}\n')
        
        with open(env_path, 'w') as f:
            f.writelines(new_lines)
    else:
        # Create new file from template
        if env_example_path.exists():
            with open(env_example_path, 'r') as f:
                content = f.read()
            
            # Replace placeholder with actual key
            content = content.replace('your_gemini_api_key_here', api_key)
            
            with open(env_path, 'w') as f:
                f.write(content)
        else:
            # Create minimal .env file
            with open(env_path, 'w') as f:
                f.write(f'GEMINI_API_KEY={api_key}\n')


def verify_setup():
    """Verify the Gemini API setup."""
    print("\n📝 Verifying setup...\n")
    
    try:
        from ml_models.gemini_config import get_gemini_config
        
        config = get_gemini_config()
        print("✅ Gemini API configured successfully!")
        print(f"✅ API key is valid and ready to use!")
        
        # Test a simple API call
        print("\n🧪 Testing API connection...")
        model = config.get_model()
        response = model.generate_content("Say 'Hello, VerSona!' in a friendly way.")
        print(f"✅ API test successful!")
        print(f"   Response: {response.text[:100]}...")
        
        return True
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        return False


def main():
    """Main setup function."""
    print_header()
    
    # Check if already configured
    if check_existing_key():
        response = input("\nDo you want to update the existing API key? (y/N): ")
        if response.lower() != 'y':
            print("\nSetup cancelled. Using existing configuration.")
            return
    
    print("To get your Gemini API key:")
    print("1. Visit: https://makersuite.google.com/app/apikey")
    print("2. Sign in with your Google account")
    print("3. Click 'Create API Key'")
    print("4. Copy the generated key\n")
    
    # Get API key from user
    api_key = input("Enter your Gemini API key: ").strip()
    
    if not api_key:
        print("\n❌ No API key provided. Setup cancelled.")
        sys.exit(1)
    
    if api_key == 'your_gemini_api_key_here':
        print("\n❌ Please enter your actual API key, not the placeholder.")
        sys.exit(1)
    
    # Validate format (basic check)
    if not api_key.startswith('AIzaSy'):
        print("\n⚠️  Warning: API key doesn't match expected format (should start with 'AIzaSy')")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            print("\nSetup cancelled.")
            sys.exit(1)
    
    # Create/update .env file
    print("\n💾 Saving API key to .env file...")
    try:
        create_env_file(api_key)
        print("✅ API key saved successfully!")
    except Exception as e:
        print(f"❌ Error saving API key: {e}")
        sys.exit(1)
    
    # Verify setup
    if verify_setup():
        print("\n" + "=" * 60)
        print("  🎉 Setup Complete!")
        print("=" * 60)
        print("\nYou're ready to use VerSona AI Backend!")
        print("\nNext steps:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Start the server: uvicorn main:app --reload --port 8001")
        print("3. Visit API docs: http://localhost:8001/docs")
        print("\n")
    else:
        print("\n" + "=" * 60)
        print("  ⚠️  Setup Incomplete")
        print("=" * 60)
        print("\nThere was an issue verifying the setup.")
        print("Please check:")
        print("- Your API key is correct")
        print("- You have internet connection")
        print("- Dependencies are installed: pip install -r requirements.txt")
        print("\n")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        sys.exit(1)
