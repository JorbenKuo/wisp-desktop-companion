"""Check reproducible HTML outputs and parse embedded scripts with Node.js."""
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parents[1]
node = shutil.which('node')
if not node:
    sys.exit('Node.js is required for JavaScript syntax checks.')
outputs = [root / 'index.html', root / 'source/shell.html']
before = [path.read_bytes() for path in outputs]
subprocess.run([sys.executable, str(root / 'build.py')], check=True)
after = [path.read_bytes() for path in outputs]
if before != after:
    sys.exit('Generated HTML is stale. Run python3 build.py and commit both outputs.')
assert after[0] == after[1], 'Entrypoints differ'
html = after[0].decode('utf-8')
assert not re.search(r'/\*__[A-Z_]+__\*/', html), 'Unresolved build token'
skills = re.findall(r'data-skill="([^"]+)"', html)
assert sorted(skills) == ['check', 'create', 'summon', 'understand'], skills
scripts = re.findall(r'<script\b([^>]*)>(.*?)</script\s*>', html, re.I | re.S)
parsed = 0
with tempfile.TemporaryDirectory() as directory:
    for i, (attributes, script) in enumerate(scripts):
        kind = re.search(r'type=[\"\x27]([^\"\x27]+)', attributes, re.I)
        if kind and kind.group(1) not in ('module', 'text/javascript', 'application/javascript'):
            continue
        extension = 'mjs' if kind and kind.group(1) == 'module' else 'js'
        path = Path(directory) / f'script-{i}.{extension}'
        path.write_text(script)
        subprocess.run([node, '--check', str(path)], check=True)
        parsed += 1
assert parsed > 0, 'No executable scripts found'
print(f'PASS: identical, reproducible HTML; four basics; {parsed} executable script blocks parsed.')
