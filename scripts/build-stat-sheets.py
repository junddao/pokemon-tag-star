"""태그 이미지를 OCR 하기 좋은 몽타주 시트로 묶는다.

수치는 태그 뒷면(스탯·기술)과 앞면(에너지) 픽셀에만 있다. 공식 상세 API 는
이미지 URL 만 돌려주고, 나무위키 표는 일본판 번호라 한국판 `no` 와 1:1 로 붙지 않는다
(피카츄만 4장이다). 그래서 레포가 이미 가진 이미지를 직접 읽는 쪽이 유일하게 안전하다.

시트는 1회성 산출물이라 레포에 넣지 않는다. 출력은 스크래치패드로 받는다.

    python3 scripts/build-stat-sheets.py <출력디렉터리>
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
TAGS = ROOT / "public" / "tags"

SCALE = 2
LABEL_H = 22
# 뒷면은 글자가 많아 크게, 앞면은 에너지 숫자 하나라 작게 담아도 읽힌다.
GRID = {"back": (3, 3), "front": (4, 5)}

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
]


def load_font(size: int) -> ImageFont.ImageFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def tile(no: str, face: str, font: ImageFont.ImageFont) -> Image.Image:
    """태그 한 장을 '번호 라벨 + 확대 이미지' 한 칸으로 만든다."""
    src = Image.open(TAGS / f"{no}-{face}.png").convert("RGB")
    # ★4 이하 앞면은 세로로 저장돼 있다. 돌려놓지 않으면 몽타주 칸에 안 맞아 잘린다.
    if src.height > src.width:
        src = src.rotate(-90, expand=True)
    w, h = src.width * SCALE, src.height * SCALE
    src = src.resize((w, h), Image.LANCZOS)

    cell = Image.new("RGB", (w, h + LABEL_H), "white")
    draw = ImageDraw.Draw(cell)
    # 라벨이 없으면 몽타주를 읽고 나서 어느 수치가 어느 태그 것인지 되짚을 수 없다.
    draw.text((6, 3), no, fill="black", font=font)
    cell.paste(src, (0, LABEL_H))
    return cell


def build(face: str, numbers: list[str], out_dir: Path) -> int:
    cols, rows = GRID[face]
    per_sheet = cols * rows
    font = load_font(16)

    for index in range(0, len(numbers), per_sheet):
        chunk = numbers[index : index + per_sheet]
        cells = [tile(no, face, font) for no in chunk]
        cw, ch = cells[0].size

        sheet = Image.new("RGB", (cols * cw, rows * ch), "#dddddd")
        for slot, cell in enumerate(cells):
            sheet.paste(cell, ((slot % cols) * cw, (slot // cols) * ch))

        sheet.save(out_dir / f"{face}-{index // per_sheet:02d}.png")

    return -(-len(numbers) // per_sheet)


def main() -> None:
    out_dir = Path(sys.argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)

    tags = json.loads((ROOT / "public" / "data" / "tags.json").read_text())
    numbers = [t["no"] for t in tags]

    for face in ("back", "front"):
        count = build(face, numbers, out_dir)
        print(f"{face}: {len(numbers)}장 → 시트 {count}개")


if __name__ == "__main__":
    main()
