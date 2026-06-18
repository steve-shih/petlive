import os
import re

src_dir = r"c:\Users\beaut\.gemini\antigravity-ide\scratch\petlive\frontend\src"

def add_header_to_fetch(content):
    # Regex to find fetch('...') or fetch(`...`)
    # We will replace fetch(X) with fetch(X, { headers: { "ngrok-skip-browser-warning": "69420" } })
    # For fetch(X, { ... }) we need to be careful, but let's just do a simple replacement for now
    # Since we know our fetch calls, let's look for fetch("/api/ or fetch(`/api/
    
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if 'fetch(' in line and ('/api/' in line or '`http' in line):
            if 'headers:' in line:
                # If it already has headers, we inject our header
                line = line.replace('headers: {', 'headers: { "ngrok-skip-browser-warning": "69420",')
            elif '{ method:' in line:
                line = line.replace('{ method:', '{ headers: { "ngrok-skip-browser-warning": "69420" }, method:')
            else:
                # fetch(url) -> fetch(url, { headers: { "ngrok-skip-browser-warning": "69420" } })
                # Extract the url part
                match = re.search(r'fetch\((.*?)\)', line)
                if match:
                    url = match.group(1)
                    if not url.endswith('}'):
                        line = line.replace(f'fetch({url})', f'fetch({url}, {{ headers: {{ "ngrok-skip-browser-warning": "69420" }} }})')
        new_lines.append(line)
    return '\n'.join(new_lines)

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            new_content = add_header_to_fetch(content)
            
            if new_content != content:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {file_path}")
