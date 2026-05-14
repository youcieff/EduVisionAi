import os
import re

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replaces 'to=' with 'href=' inside <Link ...> tags, handling newlines
    new_content = re.sub(r'(<Link[^>]*?)\bto=', r'\1href=', content)

    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed Links in {path}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.js'):
            process_file(os.path.join(root, file))
