"""열매나무 임시 그림을 만든다. 팀 그림이 오면 이 파일 대신 slice_art.py에서 자른 그림으로 바꾼다."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public/assets/plants"
LINE = (74, 48, 28, 255)
TRUNK = (150, 98, 54, 255)
LEAF = (92, 148, 62, 255)
LEAF_LIT = (128, 178, 78, 255)


def tree(size: int, canopy: float, fruit: tuple | None) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = size // 2
    w = max(6, size // 10)
    top = int(size * (1 - canopy))
    d.rectangle([cx - w, int(size * 0.6), cx + w, size - 4], fill=TRUNK, outline=LINE, width=3)
    r = int(size * canopy * 0.36)
    cy = top + r
    for dx, dy, k in [(-r * 0.6, r * 0.25, 0.72), (r * 0.6, r * 0.25, 0.72), (0, 0, 1.0)]:
        rr = r * k
        d.ellipse([cx + dx - rr, cy + dy - rr, cx + dx + rr, cy + dy + rr], fill=LEAF, outline=LINE, width=3)
    d.ellipse([cx - r * 0.55, cy - r * 0.7, cx + r * 0.25, cy - r * 0.05], fill=LEAF_LIT)
    if fruit:
        for dx, dy in [(-0.55, 0.3), (0.5, 0.45), (0.05, -0.2), (-0.1, 0.65), (0.75, -0.05)]:
            x, y, rr = cx + dx * r, cy + dy * r, max(4, r * 0.13)
            d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=fruit, outline=LINE, width=2)
    return img


OUT.mkdir(parents=True, exist_ok=True)
tree(192, 0.82, None).save(OUT / "tree_young.png")
tree(192, 0.95, None).save(OUT / "tree_grown.png")
tree(192, 0.95, (214, 62, 58, 255)).save(OUT / "apple_tree.png")
tree(192, 0.95, (240, 150, 110, 255)).save(OUT / "peach_tree.png")
