"""Carves the world map into five named continents, each holding a small
cluster of connected, curved-border districts.

Earlier iterations of this generator scattered ~55 districts edge-to-edge
across one big rectangle. It technically satisfied "no grid, no hand-tracing"
but read as one dense mass of color rather than a legible world -- there was
no ocean, no sense of place, nothing to label. This version fixes that by
running the same proven algorithm (mirrored Voronoi + Chaikin smoothing --
see the docstrings on the helpers below) once per continent, inside a small
local box, then translating the result onto the continent's spot on the
canvas. Between continents is open ocean; within a continent, districts
still share walls and have smooth, non-grid, non-random-blob borders.

Run with: python -m app.map_generator
"""

import random

import numpy as np
from scipy.spatial import Voronoi

from app.database import Base, SessionLocal, engine
from app.models import Territory
from app.services.pricing import price_cents_for_area

WIDTH, HEIGHT = 1200, 720
CHAIKIN_ITERATIONS = 2
KM2_PER_SQ_UNIT = 0.0016  # tuned so districts land in a ~10-45 km2 spread

# Each continent is a separate Voronoi cluster carved inside its own local
# box (w, h) and then placed at (cx, cy) on the shared canvas. Districts per
# continent varies a little so continents don't all feel identically sized.
CONTINENTS = [
    {"name": "AI Continent", "tagline": "Build Smarter", "cx": 290, "cy": 210, "w": 300, "h": 260, "n": 4},
    {"name": "Developer Continent", "tagline": "Build Faster", "cx": 910, "cy": 210, "w": 300, "h": 260, "n": 4},
    {"name": "Marketing Continent", "tagline": "Get Noticed", "cx": 230, "cy": 520, "w": 280, "h": 230, "n": 4},
    {"name": "Creator Continent", "tagline": "Inspire More", "cx": 970, "cy": 520, "w": 280, "h": 230, "n": 4},
    {"name": "Open Continent", "tagline": "For Everything Else", "cx": 600, "cy": 620, "w": 340, "h": 190, "n": 5},
]

NAME_PREFIXES = [
    "Fern", "Cedar", "Willow", "Moss", "Amber", "Copper", "Thorn", "Sage",
    "Birch", "Reed", "Clover", "Maple", "Elder", "Sparrow", "Hollow", "Brook",
]
NAME_SUFFIXES = [
    "Hollow", "Bluff", "Vale", "Ridge", "Cove", "Meadow", "Glade", "Point",
    "Landing", "Fields", "Grove", "Bend", "Reach", "Crest",
]


def _sample_seed_points(rng: random.Random, w: float, h: float, n: int) -> np.ndarray:
    margin = min(w, h) * 0.12
    min_spacing = 0.62 * ((w * h) / max(n, 1)) ** 0.5
    points: list[tuple[float, float]] = []
    attempts = 0
    while len(points) < n and attempts < n * 800:
        attempts += 1
        x = rng.uniform(margin, w - margin)
        y = rng.uniform(margin, h - margin)
        if all((x - px) ** 2 + (y - py) ** 2 >= min_spacing**2 for px, py in points):
            points.append((x, y))
    while len(points) < n:  # pathological case: just fill in, spacing be damned
        points.append((rng.uniform(margin, w - margin), rng.uniform(margin, h - margin)))
    return np.array(points)


def _mirror_points(points: np.ndarray, w: float, h: float) -> np.ndarray:
    left = np.column_stack([-points[:, 0], points[:, 1]])
    right = np.column_stack([2 * w - points[:, 0], points[:, 1]])
    top = np.column_stack([points[:, 0], -points[:, 1]])
    bottom = np.column_stack([points[:, 0], 2 * h - points[:, 1]])
    return np.vstack([points, left, right, top, bottom])


def _clip_to_box(poly: np.ndarray, w: float, h: float) -> np.ndarray:
    """Sutherland-Hodgman clip against the local box, as a numerical-error safety net."""

    def clip_edge(points, inside_fn, intersect_fn):
        if len(points) == 0:
            return points
        out = []
        prev = points[-1]
        prev_in = inside_fn(prev)
        for cur in points:
            cur_in = inside_fn(cur)
            if cur_in:
                if not prev_in:
                    out.append(intersect_fn(prev, cur))
                out.append(cur)
            elif prev_in:
                out.append(intersect_fn(prev, cur))
            prev, prev_in = cur, cur_in
        return np.array(out) if out else np.empty((0, 2))

    def intersect(p1, p2, axis, value):
        t = (value - p1[axis]) / (p2[axis] - p1[axis])
        return p1 + t * (p2 - p1)

    poly = clip_edge(poly, lambda p: p[0] >= 0, lambda a, b: intersect(a, b, 0, 0))
    poly = clip_edge(poly, lambda p: p[0] <= w, lambda a, b: intersect(a, b, 0, w))
    poly = clip_edge(poly, lambda p: p[1] >= 0, lambda a, b: intersect(a, b, 1, 0))
    poly = clip_edge(poly, lambda p: p[1] <= h, lambda a, b: intersect(a, b, 1, h))
    return poly


def _chaikin(poly: np.ndarray, iterations: int) -> np.ndarray:
    for _ in range(iterations):
        new_poly = []
        n = len(poly)
        for i in range(n):
            p0, p1 = poly[i], poly[(i + 1) % n]
            new_poly.append(0.75 * p0 + 0.25 * p1)
            new_poly.append(0.25 * p0 + 0.75 * p1)
        poly = np.array(new_poly)
    return poly


def _order_by_angle(poly: np.ndarray) -> np.ndarray:
    centroid = poly.mean(axis=0)
    angles = np.arctan2(poly[:, 1] - centroid[1], poly[:, 0] - centroid[0])
    return poly[np.argsort(angles)]


def _shoelace_area(poly: np.ndarray) -> float:
    x, y = poly[:, 0], poly[:, 1]
    return 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))


def _to_svg_path(poly: np.ndarray) -> str:
    pts = [f"{x:.1f},{y:.1f}" for x, y in poly]
    return "M " + " L ".join(pts) + " Z"


def _carve_cluster(rng: random.Random, w: float, h: float, n: int) -> list[dict]:
    """One continent's worth of districts, in the continent's own local (0,0)-(w,h) space."""
    seeds = _sample_seed_points(rng, w, h, n)
    all_points = _mirror_points(seeds, w, h)
    vor = Voronoi(all_points)

    cells = []
    for i in range(len(seeds)):
        region_idx = vor.point_region[i]
        vertex_idx = vor.regions[region_idx]
        if not vertex_idx or -1 in vertex_idx:
            continue  # degenerate cell (shouldn't happen thanks to mirroring); skip defensively
        poly = vor.vertices[vertex_idx]
        poly = _clip_to_box(poly, w, h)
        if len(poly) < 3:
            continue
        poly = _order_by_angle(poly)
        poly = _chaikin(poly, CHAIKIN_ITERATIONS)
        area_units = _shoelace_area(poly)
        centroid = poly.mean(axis=0)
        cells.append({"poly": poly, "area_units": area_units, "centroid": centroid})
    return cells


def generate_districts(seed: int = 42) -> list[dict]:
    rng = random.Random(seed)
    np.random.seed(seed)

    used_names: set[str] = set()
    districts: list[dict] = []

    for continent in CONTINENTS:
        w, h = continent["w"], continent["h"]
        offset_x, offset_y = continent["cx"] - w / 2, continent["cy"] - h / 2
        for cell in _carve_cluster(rng, w, h, continent["n"]):
            poly = cell["poly"] + np.array([offset_x, offset_y])
            centroid = cell["centroid"] + np.array([offset_x, offset_y])

            while True:
                name = f"{rng.choice(NAME_PREFIXES)} {rng.choice(NAME_SUFFIXES)}"
                if name not in used_names:
                    used_names.add(name)
                    break

            districts.append(
                {
                    "name": name,
                    "region": continent["name"],
                    "path_svg": _to_svg_path(poly),
                    "area_km2": round(cell["area_units"] * KM2_PER_SQ_UNIT, 1),
                    "centroid_x": float(centroid[0]),
                    "centroid_y": float(centroid[1]),
                }
            )
    return districts


def seed_database(force: bool = False) -> int:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(Territory).count()
        if existing and not force:
            print(f"{existing} territories already seeded; skipping (pass --force to regenerate).")
            return existing
        if force:
            db.query(Territory).delete()

        for d in generate_districts():
            db.add(
                Territory(
                    name=d["name"],
                    region=d["region"],
                    path_svg=d["path_svg"],
                    centroid_x=d["centroid_x"],
                    centroid_y=d["centroid_y"],
                    area_km2=d["area_km2"],
                    price_cents=price_cents_for_area(d["area_km2"]),
                )
            )
        db.commit()
        count = db.query(Territory).count()
        print(f"Seeded {count} territories across {len(CONTINENTS)} continents.")
        return count
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    seed_database(force="--force" in sys.argv)
