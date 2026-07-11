"""Stub backend — mirrors web/lib/stub.ts so both tiers return identical shapes."""

DATA = {
    "pechay": {
        "name": "Pechay", "grade": "A", "score": 92, "ripe": "Crisp, tight leaves · minimal wilt",
        "shelf": 48, "win": "2 days", "fill": 64, "urgency": "high",
        "to": "Divisoria", "eta": "6h · ₱44/kg", "load": "1.2t matched",
        "buyers": [
            ("SM Supermalls commissary", "Divisoria · needs 800kg Grade A by Thu", 44, "Surging", "96% fit", True),
            ("Balintawak wholesaler", "Balintawak · flexible volume · pays on pickup", 38, "Rising", "88% fit", False),
            ("Hotel group (QSR)", "Makati · recurring weekly order", 41, "Stable", "81% fit", False),
        ],
    },
    "cabbage": {
        "name": "Cabbage (Scorpio)", "grade": "A", "score": 88, "ripe": "Firm, market-ready head",
        "shelf": 96, "win": "4 days", "fill": 42, "urgency": "mid",
        "to": "Balintawak", "eta": "5h · ₱24/kg", "load": "2.4t matched",
        "buyers": [
            ("Balintawak Cloverleaf", "Balintawak · weekend demand surging", 24, "Surging", "94% fit", True),
            ("Divisoria wholesale cluster", "Divisoria · steady bulk offtake", 18, "Stable", "86% fit", False),
            ("NCR supermarket DC", "Makati · premium for Grade A", 30, "Rising", "80% fit", False),
        ],
    },
    "carrots": {
        "name": "Carrots", "grade": "A", "score": 90, "ripe": "Mature · firm · low breakage",
        "shelf": 168, "win": "7 days", "fill": 26, "urgency": "low",
        "to": "Cubao", "eta": "6h · ₱55/kg", "load": "3.0t matched",
        "buyers": [
            ("Nepa Q-Mart consolidator", "Cubao · demand rising", 55, "Rising", "92% fit", True),
            ("Divisoria wholesale", "Divisoria · steady offtake", 50, "Stable", "84% fit", False),
            ("Supermarket DC", "Makati · weekly order", 58, "Stable", "78% fit", False),
        ],
    },
    "broccoli": {
        "name": "Broccoli", "grade": "B", "score": 74, "ripe": "Tight florets · slight yellowing",
        "shelf": 60, "win": "2.5 days", "fill": 58, "urgency": "high",
        "to": "Makati", "eta": "6h · ₱120/kg", "load": "0.4t matched",
        "buyers": [
            ("Hotel group (QSR)", "Makati · needs 400kg by Fri", 120, "Surging", "90% fit", True),
            ("Divisoria specialty", "Divisoria · premium produce", 110, "Rising", "83% fit", False),
            ("Balintawak wholesaler", "Balintawak · flexible", 95, "Stable", "74% fit", False),
        ],
    },
}


def grade(
    crop: str,
    quantity_kg: float,
    image_data: str = "",
    location: str = "La Trinidad, Benguet",
) -> dict:
    crop_id = crop if crop in DATA else "pechay"
    d = DATA[crop_id]
    rush = "move within hours; " if d["urgency"] == "high" else ""
    return {
        "cropId": crop_id,
        "crop": d["name"],
        "grade": d["grade"],
        "score": d["score"],
        "ripeness": d["ripe"],
        "shelfLifeHours": d["shelf"],
        "freshnessWindow": d["win"],
        "freshnessFill": d["fill"],
        "urgency": d["urgency"],
        "suggestion": f"“Best sold in {d['to']} — {rush}your grade commands top price.”",
        "source": "stub",
    }


def analyze(image_data: str = "", location: str = "La Trinidad, Benguet") -> dict:
    """Photo-first fallback. The stub can't see the image, so it 'reads' the
    default Benguet harvest (pechay) and returns a plausible volume estimate.
    Keeps the demo alive when no real vision backend is reachable."""
    g = grade("pechay", 450, image_data, location)
    return {
        **g,
        "cropConfidence": 94,
        "volumeKg": 450,
        "volumeConfidence": 82,
        "isCrop": True,
        "error": "",
    }


def match(grade: dict, location: str = "La Trinidad, Benguet") -> dict:
    d = DATA.get((grade or {}).get("cropId"), DATA["pechay"])
    buyers = [
        {"buyer": b[0], "sub": b[1], "pricePerKg": b[2], "trend": b[3], "fit": b[4], "first": b[5]}
        for b in d["buyers"]
    ]
    return {
        "buyers": buyers,
        "dispatch": {"to": d["to"], "eta": d["eta"], "load": d["load"]},
        "source": "stub",
    }


def process_harvest(
    crop: str,
    quantity_kg: float,
    image_data: str = "",
    location: str = "La Trinidad, Benguet",
) -> dict:
    g = grade(crop, quantity_kg, image_data, location)
    m = match(g, location)
    return {**g, **m}
