import os

file_path = r'd:\fyp\saas-marketplace\apps\web\src\app\globals.css'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace colorful variables with strict B2B monochrome tokens in :root
text = text.replace('--primary: oklch(0.705 0.213 47.604);', '--primary: oklch(0.12 0.02 60);')
text = text.replace('--ring: oklch(0.705 0.213 47.604);', '--ring: oklch(0.12 0.02 60);')
text = text.replace('--sidebar-primary: oklch(0.705 0.213 47.604);', '--sidebar-primary: oklch(0.12 0.02 60);')
text = text.replace('--sidebar-ring: oklch(0.705 0.213 47.604);', '--sidebar-ring: oklch(0.12 0.02 60);')
text = text.replace('--background: oklch(0.98 0.005 60);', '--background: oklch(1 0 0);')
text = text.replace('--radius: 0.625rem;', '--radius: 0.125rem;')

# Look for dark mode replacements too
text = text.replace('--primary-foreground: oklch(0.10 0 0);', '--primary-foreground: oklch(0.98 0 0);')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated globals.css")
