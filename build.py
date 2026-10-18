from pathlib import Path
import base64
import json
import argparse

parser = argparse.ArgumentParser(description='Build the standalone Wisp demo.')
parser.add_argument('--legacy-exports', action='store_true', help='Also export compatibility HTML files into the parent folder.')
args = parser.parse_args()

ROOT = Path(__file__).resolve().parent
sprites = {p.stem: 'data:image/png;base64,' + base64.b64encode(p.read_bytes()).decode() for p in sorted((ROOT / 'assets').glob('*.png'))}
if 'grimoire-spread' not in sprites:
    raise FileNotFoundError('Missing grimoire-spread.png')
html = (ROOT / 'source/shell.template').read_text()
for token, value in {
    '/*__STYLES__*/': (ROOT / 'source/style.css').read_text(),
    '/*__LICENSES__*/': 'Pixelify Sans — SIL Open Font License\n'+(ROOT/'assets/fonts/OFL.txt').read_text()+'\n\nPhosphor Icons — MIT License\n'+(ROOT/'assets/os-icons/LICENSE.txt').read_text(),
    '/*__PIXEL_FONT__*/': 'data:font/ttf;base64,'+base64.b64encode((ROOT/'assets/fonts/PixelifySans.ttf').read_bytes()).decode(),
    '/*__SPRITES__*/': json.dumps(sprites, ensure_ascii=False),
    '/*__OS_ICONS__*/': json.dumps({p.stem:'data:image/svg+xml;base64,'+base64.b64encode(p.read_bytes()).decode() for p in sorted((ROOT/'assets/os-icons').glob('*.svg'))}),
    '/*__SCRIPT__*/': (ROOT / 'source/app.js').read_text().replace('/*__ABILITY_SCRIPT__*/',(ROOT/'source/abilities.js').read_text()).replace('/*__DESKTOP_SCRIPT__*/',(ROOT / 'source/desktop.js').read_text().replace('/*__OS_SCRIPT__*/',(ROOT/'source/os.js').read_text())),
    '/*__DOCUMENT_VENDORS__*/': json.dumps({name: base64.b64encode((ROOT / 'vendor' / filename).read_bytes()).decode() for name, filename in {'zip':'jszip.min.js','pdf':'pdf.min.mjs','worker':'pdf.worker.min.mjs'}.items()}),
    '/*__DOCUMENT_SCRIPT__*/': (ROOT / 'source/documents.js').read_text(),
}.items():
    assert html.count(token) == 1, token
    html = html.replace(token, value)
outputs = [ROOT / 'index.html', ROOT / 'source/shell.html']
if args.legacy_exports:
    outputs += [ROOT.parent / '小魔女-跨软件伙伴-v2.html', ROOT.parent / 'Wisp-Desktop-Demo.html']
for path in outputs:
    path.write_text(html)
    print(f'Built {path} ({path.stat().st_size:,} bytes)')
