import os
import re

files = [
    r'apps/web/src/app/(dashboard)/customer/profile/page.tsx',
    r'apps/web/src/app/(dashboard)/developer/profile/page.tsx'
]

replacements = [
    (r'<Card className=\"border border-gray-200 shadow-sm rounded-sm\">', r'<Card>'),
    (r'<Card>', r'<Card className="border border-gray-200 shadow-sm rounded-sm">'),
    (r'bg-primary/10 text-primary', r'bg-primary/10 text-black'),
    (r'text-primary', r'text-black'),
    
    (r'className="h-11"', r'className="h-11 border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"'),
    (r'className="h-11 pl-10"', r'className="h-11 pl-10 border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"'),
    (r'className="h-11 pl-10 pr-20"', r'className="h-11 pl-10 pr-20 border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"'),
    (r'className="resize-none"', r'className="resize-none border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"'),
    (r'className="h-11 pl-10 pr-10"', r'className="h-11 pl-10 pr-10 border-gray-300 bg-white rounded-sm hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black transition-all duration-200"'),
    
    # Ensure they aren't rounded-full anymore
    (r'rounded-full bg-black/50', r'rounded-sm bg-black/50'),
    (r'rounded-full', r'rounded-sm'),
    
    # Standardize dark contrast
    (r'text-muted-foreground', r'text-gray-500'),
    
    # Change destructives to strict design
    (r'bg-destructive/10 text-destructive', r'bg-red-50 text-red-700 border border-red-200 shadow-sm rounded-sm')
]

for file_path in files:
    full_path = os.path.join(os.getcwd(), file_path)
    if not os.path.exists(full_path):
        continue
        
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    for old, new in replacements:
        content = content.replace(old, new)

    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Formatting applied to profiles")
