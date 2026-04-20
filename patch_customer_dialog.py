import os

path = r'apps/web/src/app/(dashboard)/customer/profile/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

if 'Dialog,' not in text:
    text = text.replace('import { Badge } from "@/components/ui/badge";', 'import { Badge } from "@/components/ui/badge";\nimport { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print('Added Dialog to customer profile')
else:
    print('Already has Dialog')
