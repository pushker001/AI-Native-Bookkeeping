import re

files = [
    "src/app/processing/page.tsx",
    "src/app/signup/page.tsx",
    "src/app/dashboard/review/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/dashboard/reports/page.tsx",
    "src/app/api/auth/[...nextauth]/route.ts",
    "src/app/upload/page.tsx",
]

for f in files:
    try:
        with open(f, 'r') as file:
            content = file.read()
        
        # Replace string literal "http://localhost:8000..." with template literal `${API_URL}...`
        content = re.sub(r'"http://localhost:8000(.*?)"', r'`${API_URL}\1`', content)
        # Replace existing template literal `http://localhost:8000...` with `${API_URL}...`
        content = re.sub(r'`http://localhost:8000(.*?)`', r'`${API_URL}\1`', content)
        
        if 'import { API_URL }' not in content:
            if '"use client";' in content:
                content = content.replace('"use client";', '"use client";\nimport { API_URL } from "@/lib/api";')
            else:
                content = 'import { API_URL } from "@/lib/api";\n' + content
                
        with open(f, 'w') as file:
            file.write(content)
        print(f"Updated {f}")
    except Exception as e:
        print(f"Failed {f}: {e}")
