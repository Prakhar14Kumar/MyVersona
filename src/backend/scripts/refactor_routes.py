import os
import re

routes_dir = r"f:\MyVersona\src\backend\routes"
files_to_process = ["chat.py", "notifications.py", "search.py", "moderation.py", "explore.py", "career.py"]

# Regex to find the get_current_user_id block to delete
get_current_user_id_pattern = re.compile(
    r'async def get_current_user_id\(authorization: Optional\[str\] = Header\(None\)\) -> str:.*?(?=\n\n|\n@|\Z)', 
    re.DOTALL
)

import_to_add = "from ..core.dependencies import get_current_user_id as auth_get_current_user_id\n"

for filename in files_to_process:
    filepath = os.path.join(routes_dir, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Skip if already refactored
    if 'auth_get_current_user_id' in content:
        continue
        
    # 1. Add Depends locally if not imported
    if 'Depends' not in content:
        content = re.sub(r'from fastapi import (.*?)\n', r'from fastapi import \1, Depends\n', content, count=1)
        
    # 2. Add dependencies import after other from .. imports
    if import_to_add not in content:
        # Find a good place to insert it (after imports)
        import_match = list(re.finditer(r'^from \.\..*$', content, re.MULTILINE))
        if import_match:
            last_import = import_match[-1]
            insert_pos = last_import.end()
            content = content[:insert_pos] + "\n" + import_to_add + content[insert_pos:]
        else:
            # fallback
            imports_end = content.find('\n\n')
            content = content[:imports_end] + "\n" + import_to_add + content[imports_end:]

    # 3. Remove the localized get_current_user_id definition
    content = get_current_user_id_pattern.sub('', content)

    # 4. Replace authorization parameter
    content = re.sub(
        r'authorization: Optional\[str\] = Header\(None\)',
        r'user_id: str = Depends(auth_get_current_user_id)',
        content
    )

    # 5. Remove the awaited call to get_current_user_id
    # Sometimes it's `user_id = await get_current_user_id(authorization)`
    content = re.sub(r'^[ \t]*user_id = await get_current_user_id\(authorization\)[ \t]*\n', '', content, flags=re.MULTILINE)
    
    # Sometimes it's `current_user_id = await get_current_user_id(authorization)` -> we must rename the param in #4 to current_user_id
    # We will do a generic approach: find what it returns to and rename parameter.
    # Wait, simple way: we already replaced param with user_id. We should also replace current_user_id with user_id!
    # But wait, that's risky. 
    # Let's see if current_user_id is used.
    # We'll just replace `current_user_id = await get_current_user_id(authorization)` with `current_user_id = user_id`
    content = re.sub(r'([ \t]*)current_user_id = await get_current_user_id\(authorization\)', r'\1current_user_id = user_id', content)
    
    # Sometimes it's just `await get_current_user_id(authorization)`
    content = re.sub(r'^[ \t]*await get_current_user_id\(authorization\)[ \t]*\n', '', content, flags=re.MULTILINE)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Refactored {filename}")

