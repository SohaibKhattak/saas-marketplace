import os
import re

files = [
    r'apps/web/src/app/(auth)/login/page.tsx',
    r'apps/web/src/app/(auth)/register/page.tsx',
    r'apps/web/src/app/(auth)/forgot-password/page.tsx',
    r'apps/web/src/app/(auth)/reset-password/page.tsx'
]

replacements = [
    # Remove large shadow and replace with light thin border
    (r'shadow-\[0_6px_32px_0_rgba\(0,0,0,0\.10\)\] rounded-\[10px\]', r'border border-gray-200 shadow-sm rounded-sm'),
    (r'shadow-\[0_6px_32px_0_rgba\(0,0,0,0\.10\)\]', r'border border-gray-200 shadow-sm'),
    
    # Input styles updates
    (r'border border-black rounded-\[4px\] rounded-br-\[4px\] rounded-tl-\[4px\] rounded-tr-\[4px\] focus:outline-none focus:border-black focus:border-2 focus:ring-0',
     r'border border-gray-300 rounded-sm hover:border-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black'),
    (r'border border-black rounded-\[4px\] focus:outline-none focus:border-black focus:border-2 focus:ring-0',
     r'border border-gray-300 rounded-sm hover:border-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black'),
    (r'border border-black rounded-\[4px\] focus:outline-none focus:border-black focus:border-\[0\.1px\] focus:ring-0',
     r'border border-gray-300 rounded-sm hover:border-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black'),
     
    (r'border border-black rounded-sm rounded-br-\[4px\] rounded-tl-\[4px\] rounded-tr-\[4px\] focus:outline-none focus:border-black focus:border-2 focus:ring-0',
     r'border border-gray-300 rounded-sm hover:border-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black'),
    (r'border border-black rounded-sm focus:outline-none focus:border-black focus:border-2 focus:ring-0',
     r'border border-gray-300 rounded-sm hover:border-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black'),
    (r'border border-black rounded-sm focus:outline-none focus:border-black focus:border-\[0\.1px\] focus:ring-0',
     r'border border-gray-300 rounded-sm hover:border-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black'),
     
    # Buttons updates
    (r'bg-black text-white font-medium rounded-\[4px\] hover:bg-gray-900 cursor-pointer border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
     r'bg-black text-white font-semibold tracking-tight rounded-sm hover:bg-neutral-800 cursor-pointer border border-transparent focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200'),
    (r'bg-black text-white font-medium rounded-sm hover:bg-gray-900 cursor-pointer border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
     r'bg-black text-white font-semibold tracking-tight rounded-sm hover:bg-neutral-800 cursor-pointer border border-transparent focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200'),
     
    (r'bg-black text-white font-medium rounded-\[4px\] border border-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
     r'bg-black text-white font-semibold tracking-tight rounded-sm hover:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200'),
    (r'bg-black text-white font-medium rounded-sm border border-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
     r'bg-black text-white font-semibold tracking-tight rounded-sm hover:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200'),

    (r'bg-white text-black font-medium rounded-\[4px\] border border-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
     r'bg-white text-black font-medium tracking-tight rounded-sm border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all duration-200'),
    (r'bg-white text-black font-medium rounded-sm border border-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
     r'bg-white text-black font-medium tracking-tight rounded-sm border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all duration-200'),

    # Text hierarchy and color changes
    (r'text-sm font-medium text-black', r'text-sm font-semibold tracking-tight text-neutral-900'),
    (r'border border-black bg-gray-50 text-sm text-black rounded-\[4px\]', r'border border-gray-200 bg-neutral-50 text-sm text-neutral-900 rounded-sm'),
    (r'border border-black bg-gray-50 p-4', r'border border-gray-200 bg-neutral-50 p-4'),
    
    # Sharp corners for icons
    (r'rounded-full bg-gray-100', r'rounded border border-gray-200 bg-neutral-50'),
    (r'rounded-full bg-green-100', r'rounded border border-neutral-200 bg-neutral-50'),
    
    (r'text-green-600', r'text-black'),

    # Typography fixes
    (r'uppercase tracking-widest text-sm', r'uppercase tracking-tight font-bold text-sm'),
    (r'transition-none', r'transition-all duration-200'),
    
    # Monochrome Google Logo
    (r'fill="#EA4335"', r'fill="currentColor"'),
    
    # Roles active states to outline
    (r'rounded-\[4px\] border border-black p-4', r'rounded-sm border border-gray-200 hover:border-gray-300 p-4 transition-all duration-200'),
    (r'rounded-sm border border-black p-4', r'rounded-sm border border-gray-200 hover:border-gray-300 p-4 transition-all duration-200'),
]

role_customer_old = """role === "customer"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-50\""""
role_customer_new = """role === "customer"
                    ? "border-black ring-1 ring-black bg-neutral-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300\""""

role_developer_old = """role === "developer"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-50\""""
role_developer_new = """role === "developer"
                    ? "border-black ring-1 ring-black bg-neutral-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300\""""

import pathlib

for filepath in files:
    full_path = os.path.join(os.getcwd(), filepath)
    if not os.path.exists(full_path):
        print(f"Not found: {full_path}")
        continue
        
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pre-emptively fix 4px border radiuses that might have been changed in pass 1
    content = content.replace('rounded-[10px]', 'rounded-sm')
    
    content = content.replace(role_customer_old, role_customer_new)
    content = content.replace(role_developer_old, role_developer_new)

    for old, new in replacements:
        content = re.sub(old, new, content)
        
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Applied strict monochrome design system formatting to all auth pages.")
