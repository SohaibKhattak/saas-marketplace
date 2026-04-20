import os

file_path = r'd:\fyp\saas-marketplace\apps\web\src\app\globals.css'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Pure white and strict blacks
text = text.replace('--sidebar: oklch(0.98 0.005 60);', '--sidebar: oklch(1 0 0);')
text = text.replace('--sidebar-border: oklch(0.90 0.01 60);', '--sidebar-border: oklch(0.90 0 0);') # Light gray border
    
# Dark Mode Sidebar
text = text.replace('--sidebar: oklch(0.12 0.012 60);', '--sidebar: oklch(0.12 0.02 60);')
text = text.replace('--sidebar-border: oklch(0.22 0.015 60);', '--sidebar-border: oklch(0.20 0 0);')

# Kill the gradients and orange custom colors
text = text.replace('oklch(0.705 0.213 47.604)', 'oklch(0.12 0.02 60)') # Black foreground fallback
text = text.replace('oklch(0.70 0.18 80)', 'oklch(0.12 0.02 60)')
text = text.replace('oklch(0.75 0.18 65)', 'oklch(0.12 0.02 60)')
text = text.replace('oklch(0.80 0.15 80)', 'oklch(0.12 0.02 60)')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated globals.css to fully enforce stark black/white.")
