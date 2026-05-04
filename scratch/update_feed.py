import re

file_path = r"f:\MyVersona\src\components\FeedPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove LEFT SIDEBAR and the main wrapper
pattern = re.compile(r'<div className="min-h-screen bg-background flex overflow-x-hidden">\s*\{\/\* LEFT SIDEBAR \*\/\}.*?\{\/\* MAIN CONTENT \*\/\}\s*<main className="flex-1 lg:ml-64 xl:mr-80 min-w-0">', re.DOTALL)

replacement = """<>
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">"""
content = pattern.sub(replacement, content)

# 2. Fix header to be shrink-0 instead of sticky
header_old = """        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border">"""
header_new = """        <header className="shrink-0 z-30 bg-white/80 backdrop-blur-md border-b border-border">"""
content = content.replace(header_old, header_new)

# 3. Create the scrollable area
posts_old = """        {/* POSTS */}

        <div className="p-3 sm:p-5 lg:p-6 max-w-2xl mx-auto space-y-6 pb-24 lg:pb-6">"""
posts_new = """        {/* SCROLLABLE FEED AREA */}
        <div className="flex-1 overflow-y-auto scroll-smooth w-full flex justify-center">
          <div className="flex-1 min-w-0 max-w-2xl">
            {/* POSTS */}
            <div className="p-3 sm:p-5 lg:p-6 space-y-6 pb-24 lg:pb-6">"""
content = content.replace(posts_old, posts_new)

# 4. Handle right sidebar and closing tags
# Currently it looks like:
#       </main>
#       {/* RIGHT SIDEBAR */}
#       <aside className="hidden xl:block w-80 fixed right-0 top-0 h-full ...
#       ...
#       {/* MOBILE NAVIGATION */}
#       <div className="lg:hidden fixed bottom-0 ...

# We need to change RIGHT SIDEBAR to not be fixed, but be a relative block inside the scrollable flex container?
# Wait, the right sidebar should probably stay fixed on the right, or we can just hide it for now to simplify, or keep it fixed inside the page. If it's fixed `right-0 top-0 h-full`, it will still work visually! But wait, `AppLayout` has a `flex-1` main area. If the right sidebar is fixed to viewport right, it might overlap the scrollbar. 
# Better yet, since we wrap the feed in `<div className="flex-1 overflow-y-auto">`, the right sidebar could just be placed as a sibling inside the flex container if we want it to scroll, or we can keep it fixed. 
# For now, let's just make the right sidebar relative or sticky inside a wrapper, OR just delete it to make it match the clean layout requested. The user said: "Create a reusable global layout wrapper AppLayout and use the same height/overflow structure across all pages". 
# Let's keep the right sidebar but remove its fixed positioning so it fits naturally in the layout.

# Find the end of POSTS section:
posts_end = """          )}

          {/* LOADING MORE */}

          {hasMore && (
            <div ref={observerTarget} className="flex justify-center py-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF6F91]"></div>
                <span>Loading more posts...</span>
              </div>
            </div>
          )}
        </div>
      </main>"""

posts_end_new = """          )}

          {/* LOADING MORE */}

          {hasMore && (
            <div ref={observerTarget} className="flex justify-center py-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF6F91]"></div>
                <span>Loading more posts...</span>
              </div>
            </div>
          )}
        </div>
      </div>"""
content = content.replace(posts_end, posts_end_new)

right_sidebar_old = """      {/* RIGHT SIDEBAR */}

      <aside className="hidden xl:block w-80 fixed right-0 top-0 h-full bg-slate-50/60 border-l border-slate-200 overflow-y-auto backdrop-blur-sm">"""
right_sidebar_new = """      {/* RIGHT SIDEBAR */}

      <aside className="hidden xl:block shrink-0 w-80 h-full bg-slate-50/60 border-l border-slate-200 overflow-y-auto backdrop-blur-sm">"""
content = content.replace(right_sidebar_old, right_sidebar_new)

mobile_nav_pattern = re.compile(r'\{\/\* MOBILE NAVIGATION \*\/\}.*?<\/div>\s*\{\/\* CREATE POST DIALOG \*\/\}', re.DOTALL)
content = mobile_nav_pattern.sub('{/* CREATE POST DIALOG */}', content)

# Close the outer wrapper correctly
# Replace the final `</div>\n  );\n}`
content = content.replace("    </div>\n  );\n}", "        </div>\n      </div>\n    </>\n  );\n}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
