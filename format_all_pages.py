import os
import re

def format_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content
    # Remove playful elements and apply strict monochrome tokens
    
    # 1. Colors to strict black and white / neutrals
    new_content = re.sub(r'bg-(blue|indigo|purple|slate|zinc|gray|neutral)-(50|100|200)', 'bg-white', new_content)
    new_content = re.sub(r'bg-(blue|indigo|purple|slate|zinc)-(500|600|700|800|900)', 'bg-black', new_content)
    new_content = re.sub(r'bg-primary/\d+', 'bg-gray-100', new_content)
    new_content = re.sub(r'bg-primary([^\w\-])', r'bg-black\1', new_content)
    
    new_content = re.sub(r'text-(blue|indigo|purple|slate|zinc)-(500|600|700|800|900)', 'text-neutral-900', new_content)
    new_content = re.sub(r'text-primary([^\w\-])', r'text-neutral-900\1', new_content)
    
    new_content = re.sub(r'border-(blue|indigo|purple|slate|zinc)-(200|300|400|500)', 'border-gray-200', new_content)
    new_content = re.sub(r'border-primary/20', 'border-gray-200', new_content)
    
    new_content = re.sub(r'focus:ring-(blue|indigo|purple|slate|primary)', 'focus:ring-black', new_content)
    
    # 2. Rounded corners to strict sharp/near-sharp
    new_content = re.sub(r'rounded-(md|lg|xl|2xl|3xl|full)', 'rounded-sm', new_content)
    
    # 3. Typography adjustments (premium and confident)
    new_content = re.sub(r'font-medium', 'font-semibold tracking-tight', new_content)
    new_content = re.sub(r'text-muted-foreground', 'text-gray-500', new_content)
    
    # 4. Hover states
    new_content = re.sub(r'hover:bg-(blue|indigo|purple|slate|zinc)-(100|200)', 'hover:bg-gray-50', new_content)
    new_content = re.sub(r'hover:bg-(blue|indigo|purple|slate|zinc|primary)-(500|600|700|800|900)', 'hover:bg-neutral-800', new_content)
    new_content = re.sub(r'hover:text-(blue|indigo|purple|slate|zinc)-(500|600|700|800|900)', 'hover:text-black', new_content)
    
    # Shadows
    new_content = re.sub(r'shadow-(md|lg|xl|2xl|inner)', 'shadow-sm', new_content)

    if new_content != content:
        # Clean up dupes
        new_content = new_content.replace('rounded-sm rounded-sm', 'rounded-sm')
        new_content = new_content.replace('shadow-sm shadow-sm', 'shadow-sm')
        new_content = new_content.replace('tracking-tight tracking-tight', 'tracking-tight')
        new_content = new_content.replace('bg-black hover:bg-black/90', 'bg-black hover:bg-neutral-800')

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated: {file_path}")

def scan_and_run(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".tsx") or file.endswith(".ts"):
                format_file(os.path.join(root, file))

if __name__ == "__main__":
    app_dir = r"d:\fyp\saas-marketplace\apps\web\src\app"
    components_dir = r"d:\fyp\saas-marketplace\apps\web\src\components"
    scan_and_run(app_dir)
    scan_and_run(components_dir)
    print("Formatting complete!")
