"""Procedurally carves the world map into organic, connected territories.

Design goal (see project README, section 5 "Map System"): territories must
read as real, hand-drawn geography -- connected, curved borders, no floating
shapes, and explicitly NOT a grid. Hand-tracing that many districts is a
multi-day illustration task. This script gets the same visual result from a
30-second algorithm instead:

  1. Scatter seed points across the canvas (rejection-sampled so no two
     districts start too close together).
  2. Mirror every seed across all four canvas edges, then run a Voronoi
     diagram over seeds + mirrors. The mirrors make every real district's
     cell bounded exactly at the canvas edge -- no clipping math needed, and
     every cell shares a wall with its neighbors (no floating shapes).
  3. Chaikin corner-cutting smooths the straight Voronoi edges into the soft,
     natural curves real coastlines have, instead of a crystalline/blobby
     look.
  4. k-means over district centroids groups them into named regions (AI,
     Dev, Marketing, ...), echoing the README's "different regions" idea.

Run with: python -m app.map_generator
"""

import random

import numpy as np
from scipy.spatial import Voronoi

from app.database import Base, SessionLocal, engine
from app.models import Territory
from app.services.pricing import price_cents_for_area

WIDTH, HEIGHT = 1000, 640
NUM_DISTRICTS = 55
MIN_SEED_SPACING = 55
CHAIKIN_ITERATIONS = 2
KM2_PER_SQ_UNIT = 0.003  # tuned so districts land in the ~5-100 km2 range

REGIONS = ["AI", "Dev", "Marketing", "Design", "Growth", "Community"]

NAME_PREFIXES = [
    "Fern", "Cedar", "Willow", "Moss", "Amber", "Copper", "Thorn", "Sage",
    "Birch", "Reed", "Clover", "Maple", "Elder", "Sparrow", "Hollow", "Brook",
]
NAME_SUFFIXES = [
    "Hollow", "Bluff", "Vale", "Ridge", "Cove", "Meadow", "Glade", "Point",
    "Landing", "Fields", "Grove", "Bend", "Reach", "Crest",
]


def _sample_seed_points(rng: random.Random) -> np.ndarray:
    margin = 20
    points: list[tuple[float, float]] = []
    attempts = 0
    while len(points) < NUM_DISTRICTS and attempts < NUM_DISTRICTS * 400:
        attempts += 1
        x = rng.uniform(margin, WIDTH - margin)
        y = rng.uniform(margin, HEIGHT - margin)
        if all((x - px) ** 2 + (y - py) ** 2 >= MIN_SEED_SPACING**2 for px, py in points):
            points.append((x, y))
    return np.array(points)


def _mirror_points(points: np.ndarray) -> np.ndarray:
    left = np.column_stack([-points[:, 0], points[:, 1]])
    right = np.column_stack([2 * WIDTH - points[:, 0], points[:, 1]])
    top = np.column_stack([points[:, 0], -points[:, 1]])
    bottom = np.column_stack([points[:, 0], 2 * HEIGHT - points[:, 1]])
    return np.vstack([points, left, right, top, bottom])


def _clip_to_canvas(poly: np.ndarray) -> np.ndarray:
    """Sutherland-Hodgman clip against the canvas rect, as a numerical-error safety net."""

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
    poly = clip_edge(poly, lambda p: p[0] <= WIDTH, lambda a, b: intersect(a, b, 0, WIDTH))
    poly = clip_edge(poly, lambda p: p[1] >= 0, lambda a, b: intersect(a, b, 1, 0))
    poly = clip_edge(poly, lambda p: p[1] <= HEIGHT, lambda a, b: intersect(a, b, 1, HEIGHT))
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


def _kmeans_labels(centroids: np.ndarray, k: int, rng: random.Random, iterations: int = 25) -> np.ndarray:
    n = len(centroids)
    seed_idx = rng.sample(range(n), k)
    means = centroids[seed_idx].copy()
    labels = np.zeros(n, dtype=int)
    for _ in range(iterations):
        dists = np.linalg.norm(centroids[:, None, :] - means[None, :, :], axis=2)
        labels = dists.argmin(axis=1)
        for c in range(k):
            members = centroids[labels == c]
            if len(members):
                means[c] = members.mean(axis=0)
    return labels


def generate_districts(seed: int = 42):
    rng = random.Random(seed)
    np.random.seed(seed)

    seeds = _sample_seed_points(rng)
    all_points = _mirror_points(seeds)
    vor = Voronoi(all_points)

    districts = []
    for i in range(len(seeds)):
        region_idx = vor.point_region[i]
        vertex_idx = vor.regions[region_idx]
        if not vertex_idx or -1 in vertex_idx:
            continue  # degenerate cell (shouldn't happen thanks to mirroring); skip defensively
        poly = vor.vertices[vertex_idx]
        poly = _clip_to_canvas(poly)
        if len(poly) < 3:
            continue
        poly = _order_by_angle(poly)
        poly = _chaikin(poly, CHAIKIN_ITERATIONS)
        area_units = _shoelace_area(poly)
        centroid = poly.mean(axis=0)
        districts.append(
            {
                "path_svg": _to_svg_path(poly),
                "area_km2": round(area_units * KM2_PER_SQ_UNIT, 1),
                "centroid_x": float(centroid[0]),
                "centroid_y": float(centroid[1]),
            }
        )

    centroids = np.array([[d["centroid_x"], d["centroid_y"]] for d in districts])
    labels = _kmeans_labels(centroids, k=len(REGIONS), rng=rng)

    used_names: set[str] = set()
    for d, label in zip(districts, labels):
        d["region"] = REGIONS[label]
        while True:
            name = f"{rng.choice(NAME_PREFIXES)} {rng.choice(NAME_SUFFIXES)}"
            if name not in used_names:
                used_names.add(name)
                d["name"] = name
                break
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
        print(f"Seeded {count} territories.")
        return count
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    seed_database(force="--force" in sys.argv)
