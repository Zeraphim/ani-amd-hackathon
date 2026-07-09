"""Stub backend — mirrors web/lib/stub.ts so both tiers tell the same story."""

CROPS = {
    "Cabbage (Scorpio)": (96, "Firm, market-ready", 8.2),
    "Carrots": (168, "Mature", 8.6),
    "Broccoli": (60, "Tight florets", 7.4),
    "Lettuce (Romaine)": (48, "Crisp, high moisture", 7.1),
    "Bell Pepper": (120, "Glossy, full color", 8.0),
    "Chinese Cabbage (Wombok)": (72, "Dense head", 7.6),
}


def grade(crop: str, quantity_kg: float) -> dict:
    shelf, ripeness, quality = CROPS.get(crop, CROPS["Cabbage (Scorpio)"])
    volume_factor = min(2.0, quantity_kg / 400.0)
    urgency = max(2.0, min(10.0, round((240 - shelf) / 24 + volume_factor * 1.5 + 3, 1)))
    g = "A" if quality >= 8 else "B" if quality >= 7 else "C"
    high = urgency >= 7
    return {
        "crop": crop,
        "grade": g,
        "qualityScore": round(quality, 1),
        "ripeness": ripeness,
        "shelfLifeHours": shelf,
        "urgency": urgency,
        "spoilageWindow": f"Peak freshness decays in ~{shelf}h at ambient highland temps",
        "suggestion": (
            f"High urgency — prioritize cold-chain dispatch within {round(shelf/6)}h to hold premium NCR pricing."
            if high else
            "Moderate urgency — consolidate with nearby farms before dispatch to cut haul cost."
        ),
        "source": "stub",
    }


def match(grade: dict) -> dict:
    pool = [
        ("Balintawak Cloverleaf Trader", "Balintawak, Quezon City", 96, "Surging", 42,
         "Weekend restaurant demand surging; short supply expected.", "Route First"),
        ("Divisoria Wholesale Cluster", "Divisoria, Manila", 88, "Stable", 36,
         "Steady bulk offtake; reliable but price-sensitive.", "Reserve"),
        ("SM Supermarket Commissary", "Makati NCR DC", 82, "Stable", 48,
         "Pays premium for Grade A with shelf-life guarantee.", "Review"),
        ("Nepa-Q-Mart Consolidator", "Cubao, Quezon City", 71, "Dipping", 28,
         "Demand softening this week; hold unless urgency is high.",
         "Review" if grade.get("urgency", 0) >= 7 else "Hold"),
    ]
    is_a = grade.get("grade") == "A"
    buyers = [
        {
            "buyer": b[0], "market": b[1], "matchPct": b[2], "demand": b[3],
            "pricePerKg": b[4] + (4 if is_a else 0), "note": b[5], "action": b[6],
        }
        for b in pool
    ]
    buyers.sort(key=lambda x: x["matchPct"], reverse=True)
    return {"buyers": buyers, "source": "stub"}
