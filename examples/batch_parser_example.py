"""
HUNTIQUE - Scraper & Batch Ingestion Example (Python)
This script demonstrates how your external scrapers/parsers can send thousands
of antique transactions directly into the HUNTIQUE SQLite engine in a single batch request.
"""

import json
import urllib.request
import time

HUNTIQUE_API_URL = "http://localhost:3000/api/batch/ingest"

def push_parsed_lots_to_huntique(lots_data, source_name="Arthouse Hejtmánek Scraper"):
    payload = json.dumps({
        "source": source_name,
        "records": lots_data
    }).encode("utf-8")

    req = urllib.request.Request(
        HUNTIQUE_API_URL,
        data=payload,
        headers={"Content-Type": "application/json"}
    )

    t0 = time.time()
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        elapsed = time.time() - t0

    print("=" * 50)
    print("  BATCH INGESTION COMPLETE")
    print("=" * 50)
    print(f"Status:       {result.get('success')}")
    print(f"Processed:    {result.get('inserted')} records")
    print(f"Time:         {result.get('durationMs')} ms ({elapsed:.3f}s total)")
    print(f"Speed:        {result.get('speedPerSecond')} records/sec")
    print("=" * 50)
    return result

# Example demo batch:
if __name__ == "__main__":
    demo_scraped_items = [
        {
            "id": f"hejtmanek_2026_{i}",
            "title": f"Biedermeier Blown Glass Goblet Lot #{i}",
            "category": "tableware",
            "subcategory": "glass",
            "maker": "Bohemian Glassworks",
            "period": "Biedermeier",
            "price_czk": 12500 + i * 250,
            "hammer_price_czk": 10000 + i * 200,
            "price_type": "with_premium",
            "verification_level": "verified",
            "verification_source_type": "auction",
            "sale_date": "2026-03-15",
            "city": "Prague 6",
            "source_name": "Arthouse Hejtmánek (Online Spring Auction)",
            "source_url": f"https://www.arthousehejtmanek.cz/en/lots/2026-spring-{i}",
            "condition": "Excellent antique condition, original cut facets intact."
        }
        for i in range(1, 21)
    ]

    print(f"Sending {len(demo_scraped_items)} parsed lots to HUNTIQUE...")
    push_parsed_lots_to_huntique(demo_scraped_items)
