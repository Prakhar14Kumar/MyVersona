import os
from pathlib import Path
import re

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Don't modify if it's not needed
        if "VerSona" not in content and "Versona" not in content and "versona" not in content:
            return False
            
        # We need to be careful with "versona" if it's in paths or urls
        # But for display text, "VerSona" -> "MyVerSona"
        # "Versona" -> "MyVerSona"
        
        # Look for the exact strings
        # Only replace word matches or specific cases to avoid breaking paths if possible
        # Actually, let's just do a simple replace for the capitalized versions
        new_content = content.replace("VerSona", "MyVerSona")
        new_content = new_content.replace("Versona", "MyVerSona")
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
            
        return False
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return False

def main():
    src_dir = Path(r"F:\MyVersona\src")
    index_html = Path(r"F:\MyVersona\index.html")
    package_json = Path(r"F:\MyVersona\package.json")
    
    count = 0
    
    # Process src directory
    for root, _, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js', '.jsx', '.html', '.css', '.md')):
                filepath = os.path.join(root, file)
                if replace_in_file(filepath):
                    print(f"Updated {filepath}")
                    count += 1
                    
    # Process root files
    for file in [index_html, package_json]:
        if file.exists() and replace_in_file(file):
            print(f"Updated {file}")
            count += 1
            
    print(f"Done! Updated {count} files.")

if __name__ == "__main__":
    main()
