"""Render the studio's existing pink four-point star as small website icons.
Development tool only: Python + Pillow. No visitor dependency.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#292638"/>
  <path fill="#FFB6D5" d="M256 64 C272 208 304 240 448 256 C304 272 272 304 256 448 C240 304 208 272 64 256 C208 240 240 208 256 64Z"/>
</svg>
'''


def main():
    (ROOT / 'assets/img/studio-mark.svg').write_text(SVG, encoding='utf-8')
    scale = 4
    canvas = Image.new('RGBA', (512 * scale, 512 * scale))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((0, 0, 512 * scale - 1, 512 * scale - 1), radius=112 * scale, fill='#292638')
    curves = [
        ((256, 64), (272, 208), (304, 240), (448, 256)),
        ((448, 256), (304, 272), (272, 304), (256, 448)),
        ((256, 448), (240, 304), (208, 272), (64, 256)),
        ((64, 256), (208, 240), (240, 208), (256, 64)),
    ]
    points = []
    for curve in curves:
        for n in range(65):
            t = n / 64
            points.append(tuple(scale * sum(c[k] * w for c, w in zip(curve, ((1-t)**3, 3*(1-t)**2*t, 3*(1-t)*t*t, t**3))) for k in (0, 1)))
    draw.polygon(points, fill='#FFB6D5')
    base = canvas.resize((512, 512), Image.Resampling.LANCZOS)
    base.save(ROOT / 'assets/img/studio-mark.png', optimize=True)
    for size, filename in [(96, 'favicon-96x96.png'), (180, 'apple-touch-icon.png')]:
        base.resize((size, size), Image.Resampling.LANCZOS).save(ROOT / filename, optimize=True)
    base.save(ROOT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print('Ready: favicon.ico (6 sizes), favicon-96x96.png, apple-touch-icon.png, studio-mark.png/svg')


if __name__ == '__main__':
    main()
