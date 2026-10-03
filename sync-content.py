"""Publish owner edits as local GitHub Pages content and media."""
import json
import mimetypes
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ORIGIN = 'https://a-private-garden-one-year.qianyingzzh.chatgpt.site'

def fetch(url):
    result = subprocess.run(['curl', '-fsSL', '--retry', '2', '--max-time', '60', '-w', '\n%{content_type}', url], check=True, capture_output=True).stdout
    body, content_type = result.rsplit(b'\n', 1)
    return body, content_type.decode().split(';', 1)[0]

raw, _ = fetch(ORIGIN + '/api/public/snapshot')
data = json.loads(raw)
assert len(data['sections']) == 3 and isinstance(data['copy'], dict)
for section in data['sections']:
    assert isinstance(section['memories'], list)
    for memory in section['memories']:
        for media in memory['media']:
            media_id = media['id']
            assert re.fullmatch(r'[a-zA-Z0-9-]+', media_id)
            existing = list((ROOT / 'media').glob(media_id + '.*'))
            if existing:
                target = existing[0]
            else:
                body, content_type = fetch(ORIGIN + '/api/public/media/' + media_id)
                extension = mimetypes.guess_extension(content_type)
                assert extension and (content_type.startswith('image/') or content_type.startswith('video/'))
                target = ROOT / 'media' / (media_id + extension)
                target.parent.mkdir(exist_ok=True)
                target.write_bytes(body)
            media['src'] = 'media/' + target.name
if data['copy'].get('city.berlin.name') == '柏林':
    data['copy']['city.berlin.name'] = '冰岛'
if data['copy'].get('city.berlin.stamp') == 'BRANDENBURG TWILIGHT':
    data['copy']['city.berlin.stamp'] = 'ICELAND · AURORA'
compact = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
app = ROOT / 'app.js'
source = app.read_text()
start = source.index('var ye=')
end = source.index(';const anniversaryRoot=', start)
app.write_text(source[:start] + 'var ye=' + compact + source[end:])
(ROOT / 'content.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('Synced published content and media to GitHub Pages artifact.')
