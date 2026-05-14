with open(r'src/views/VideoDetail.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import html2pdf from 'html2pdf.js';", "// dynamically imported html2pdf")

old_usage = "await html2pdf().set(opt).from(container).save();"
new_usage = """const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      await html2pdf().set(opt).from(container).save();"""
content = content.replace(old_usage, new_usage)

with open(r'src/views/VideoDetail.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("html2pdf fixed")
