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
        
        # Replace `${API_URL}...` back to "http://localhost:8000..."
        content = re.sub(r'`\$\{API_URL\}(.*?)`', r'"http://localhost:8000\1"', content)
        
        # Remove import
        content = content.replace('import { API_URL } from "@/lib/api";\n', '')
                
        with open(f, 'w') as file:
            file.write(content)
        print(f"Reverted {f}")
    except Exception as e:
        print(f"Failed {f}: {e}")
