#!/usr/bin/env python3
"""Parse Israeli supermarket XML price feeds into normalized JSON.

Supports feeds published under the Price Transparency Law (חוק שקיפות מחירים).
Handles gzipped XML files and various chain-specific format differences.

Usage:
    python parse_price_xml.py --chain shufersal --input PriceFull.xml.gz --output prices.json
    python parse_price_xml.py --chain rami-levy --input PriceFull.xml --output prices.json
    python parse_price_xml.py --help
"""

import argparse
import gzip
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

# Chain-specific field mappings to normalize different XML schemas
CHAIN_FIELD_MAP = {
    "shufersal": {
        "item_code": "ItemCode",
        "item_name": "ItemName",
        "manufacturer": "ManufacturerName",
        "price": "ItemPrice",
        "unit_price": "UnitOfMeasurePrice",
        "quantity": "Quantity",
        "unit_of_measure": "UnitOfMeasure",
        "update_date": "PriceUpdateDate",
        "is_weighted": "bIsWeighted",
    },
    "rami-levy": {
        "item_code": "ItemCode",
        "item_name": "ItemNm",
        "manufacturer": "ManufacturerName",
        "price": "ItemPrice",
        "unit_price": "UnitOfMeasurePrice",
        "quantity": "Quantity",
        "unit_of_measure": "UnitOfMeasure",
        "update_date": "PriceUpdateDate",
        "is_weighted": "bIsWeighted",
    },
    "default": {
        "item_code": "ItemCode",
        "item_name": "ItemName",
        "manufacturer": "ManufacturerName",
        "price": "ItemPrice",
        "unit_price": "UnitOfMeasurePrice",
        "quantity": "Quantity",
        "unit_of_measure": "UnitOfMeasure",
        "update_date": "PriceUpdateDate",
        "is_weighted": "bIsWeighted",
    },
}

SUPPORTED_CHAINS = [
    "shufersal",
    "rami-levy",
    "yochananof",
    "victory",
    "osher-ad",
    "mega",
    "tiv-taam",
]


def read_xml(input_path: str) -> ET.Element:
    """Read XML from a plain or gzipped file, handling encoding issues."""
    path = Path(input_path)
    if not path.exists():
        print(f"Error: File not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    if path.suffix == ".gz" or path.name.endswith(".xml.gz"):
        with gzip.open(path, "rb") as f:
            raw = f.read()
    else:
        with open(path, "rb") as f:
            raw = f.read()

    # Try UTF-8 first, fall back to Windows-1255 (common in Israeli feeds)
    for encoding in ("utf-8", "windows-1255", "iso-8859-8"):
        try:
            text = raw.decode(encoding)
            # Strip XML declaration to avoid encoding mismatch with ET
            if text.startswith("<?xml"):
                text = text[text.index("?>") + 2 :]
            return ET.fromstring(text)
        except (UnicodeDecodeError, ET.ParseError):
            continue

    print("Error: Could not decode XML with any supported encoding.", file=sys.stderr)
    sys.exit(1)


def get_field_map(chain: str) -> dict:
    """Get the field mapping for a specific chain."""
    return CHAIN_FIELD_MAP.get(chain, CHAIN_FIELD_MAP["default"])


def extract_text(element: ET.Element, tag: str) -> str:
    """Safely extract text from an XML child element."""
    child = element.find(tag)
    if child is not None and child.text:
        return child.text.strip()
    return ""


def parse_items(root: ET.Element, chain: str) -> list[dict]:
    """Parse item elements from the XML tree into normalized dicts."""
    field_map = get_field_map(chain)
    items = []

    # Try common wrapper elements
    item_elements = root.findall(".//Item")
    if not item_elements:
        item_elements = root.findall(".//Product")
    if not item_elements:
        item_elements = root.findall(".//{*}Item")

    for item_el in item_elements:
        price_str = extract_text(item_el, field_map["price"])
        unit_price_str = extract_text(item_el, field_map["unit_price"])

        try:
            price = float(price_str) if price_str else 0.0
        except ValueError:
            price = 0.0

        try:
            unit_price = float(unit_price_str) if unit_price_str else 0.0
        except ValueError:
            unit_price = 0.0

        normalized = {
            "item_code": extract_text(item_el, field_map["item_code"]),
            "item_name": extract_text(item_el, field_map["item_name"]),
            "manufacturer": extract_text(item_el, field_map["manufacturer"]),
            "price": price,
            "unit_price": unit_price,
            "quantity": extract_text(item_el, field_map["quantity"]),
            "unit_of_measure": extract_text(item_el, field_map["unit_of_measure"]),
            "update_date": extract_text(item_el, field_map["update_date"]),
            "is_weighted": extract_text(item_el, field_map["is_weighted"]) == "1",
            "chain": chain,
        }
        items.append(normalized)

    return items


def main():
    parser = argparse.ArgumentParser(
        description="Parse Israeli supermarket XML price feeds into normalized JSON."
    )
    parser.add_argument(
        "--chain",
        required=True,
        choices=SUPPORTED_CHAINS,
        help="Supermarket chain name (determines XML field mapping)",
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to XML or gzipped XML price feed file",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output JSON file path (default: stdout)",
    )

    args = parser.parse_args()

    root = read_xml(args.input)
    items = parse_items(root, args.chain)

    result = {
        "chain": args.chain,
        "item_count": len(items),
        "items": items,
    }

    json_output = json.dumps(result, ensure_ascii=False, indent=2)

    if args.output:
        output_path = Path(args.output)
        output_path.write_text(json_output, encoding="utf-8")
        print(f"Wrote {len(items)} items to {args.output}", file=sys.stderr)
    else:
        print(json_output)


if __name__ == "__main__":
    main()
