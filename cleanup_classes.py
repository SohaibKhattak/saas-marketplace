import os

files = [
    r'apps/web/src/app/(auth)/login/page.tsx',
    r'apps/web/src/app/(auth)/register/page.tsx',
    r'apps/web/src/app/(auth)/forgot-password/page.tsx',
    r'apps/web/src/app/(auth)/reset-password/page.tsx'
]

for filepath in files:
    full_path = os.path.join(os.getcwd(), filepath)
    if not os.path.exists(full_path):
        continue
        
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix duplicates
    content = content.replace('transition-all duration-200 transition-all duration-200', 'transition-all duration-200')
    content = content.replace('font-semibold text-black uppercase tracking-tight font-bold text-sm', 'text-black uppercase tracking-tight font-bold text-sm')
    content = content.replace('transition-none transition-all duration-200', 'transition-all duration-200')
    content = content.replace('transition-colors duration-200 transition-all duration-200', 'transition-all duration-200')
    
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
print('Duplicates removed.')
