"""Untrusted-upload handling for company logos.

We never trust a browser-supplied Content-Type or file extension. Instead we
decode the bytes with Pillow, verify they are a real, bounded raster image,
and then RE-ENCODE to a fresh PNG before storing anything. Re-encoding drops
any non-image payload smuggled inside the file (embedded scripts, polyglot
PDFs/HTML, EXIF, ICC blobs) so what we persist and later serve back is
guaranteed to be plain pixel data.
"""

import io

from fastapi import HTTPException, UploadFile
from PIL import Image

MAX_UPLOAD_BYTES = 300 * 1024  # 300 KB
MAX_DIMENSION = 512


async def load_and_sanitize_logo(file: UploadFile) -> bytes:
    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Logo must be under 300KB")

    try:
        image = Image.open(io.BytesIO(raw))
        image.verify()  # cheap structural check, does not decode pixels
        image = Image.open(io.BytesIO(raw))  # re-open: verify() burns the parser
        image.load()  # force full pixel decode now, while we still control it
    except Exception as exc:  # noqa: BLE001 - any decode failure means "not a real image"
        raise HTTPException(status_code=400, detail="File is not a valid image") from exc

    if image.format not in {"PNG", "JPEG", "WEBP"}:
        raise HTTPException(status_code=400, detail="Logo must be PNG, JPEG, or WEBP")

    image.thumbnail((MAX_DIMENSION, MAX_DIMENSION))
    image = image.convert("RGBA")

    out = io.BytesIO()
    image.save(out, format="PNG", optimize=True)
    return out.getvalue()
