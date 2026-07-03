#!/usr/bin/env python3
import os
import re

def convert_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Convert const { x } = require('y') to import { x } from 'y'
    def replace_destructured(m):
        imports = m.group(1)
        path = m.group(2)
        if path.startswith(".") and not path.endswith(".js"):
            path += ".js"
        return "import { " + imports + " } from '" + path + "';"
    
    content = re.sub(
        r"const\s+{\s*([^}]+)\s*}\s*=\s*require\('([^']+)'\);?",
        replace_destructured,
        content
    )
    
    # Convert const x = require('y') to import x from 'y'
    def replace_default(m):
        varname = m.group(1)
        path = m.group(2)
        if path.startswith(".") and not path.endswith(".js"):
            path += ".js"
        return "import " + varname + " from '" + path + "';"
    
    content = re.sub(
        r"const\s+(\w+)\s*=\s*require\('([^']+)'\);?",
        replace_default,
        content
    )
    
    # Convert module.exports = { ... } to export { ... }
    content = re.sub(r"module\.exports\s*=\s*{", "export {", content)
    
    # Convert module.exports = x to export default x
    content = re.sub(r"module\.exports\s*=\s*", "export default ", content)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print("✅ Converted: " + filepath)
        return True
    else:
        print("⏭️  Skipped: " + filepath)
        return False

def main():
    base = "src"
    folders = ["routes", "controllers", "models"]
    exclude = ["index.js"]
    
    for folder in folders:
        folder_path = os.path.join(base, folder)
        if os.path.exists(folder_path):
            for filename in os.listdir(folder_path):
                if filename.endswith(".js") and filename not in exclude:
                    filepath = os.path.join(folder_path, filename)
                    try:
                        convert_file(filepath)
                    except Exception as e:
                        print("❌ Error converting " + filepath + ": " + str(e))

if __name__ == "__main__":
    main()
