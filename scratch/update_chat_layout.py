import re

file_path = r"f:\MyVersona\src\components\ChatPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the outermost wrapper
old_wrapper = """  return (
    <div className="min-h-screen bg-background">
      <div className="h-screen flex flex-col">"""

new_wrapper = """  return (
    <div className="flex-1 flex flex-col w-full overflow-hidden bg-background">"""

content = content.replace(old_wrapper, new_wrapper)

# We removed one div level, so we need to remove the matching closing div at the very end.
# Look for the last `</div>\n    </div>\n  );\n}`
content = content.replace("      </div>\n    </div>\n  );\n}", "    </div>\n  );\n}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
