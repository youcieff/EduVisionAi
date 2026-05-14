import os

routes = {
    "page.js": ("Home", "../views/Home", False),
    "login/page.js": ("Login", "../../views/Login", False),
    "register/page.js": ("Register", "../../views/Register", False),
    "about/page.js": ("About", "../../views/About", False),
    "leaderboard/page.js": ("Leaderboard", "../../views/Leaderboard", False),
    "dashboard/page.js": ("Dashboard", "../../views/Dashboard", True),
    "upload/page.js": ("Upload", "../../views/Upload", True),
    "profile/page.js": ("Profile", "../../views/Profile", True),
    "video/[id]/page.js": ("VideoDetail", "../../../views/VideoDetail", False),
}

base_dir = "src/app"
os.makedirs(base_dir, exist_ok=True)

for path, (component, import_path, is_protected) in routes.items():
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    content = f"import {component} from '{import_path}';\n"
    if is_protected:
        protected_import = "../../components/common/ProtectedRoute" if path.count("/") == 1 else "../../../components/common/ProtectedRoute"
        content += f"import ProtectedRoute from '{protected_import}';\n"
        
    content += f"\nexport const metadata = {{\n  title: 'EduVisionAI - {component}',\n}};\n\nexport default function Page() {{\n"
    if is_protected:
        content += f"  return <ProtectedRoute><{component} /></ProtectedRoute>;\n"
    else:
        content += f"  return <{component} />;\n"
        
    content += "}\n"
    
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

print("Generated Next.js app router pages!")
