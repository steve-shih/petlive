import os

src_dir = r"c:\Users\beaut\.gemini\antigravity-ide\scratch\petlive\frontend\src"

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            if "http://127.0.0.1:5000/api" in content:
                new_content = content.replace("http://127.0.0.1:5000/api", "/api")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {file_path}")
