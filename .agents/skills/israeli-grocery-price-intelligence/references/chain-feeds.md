# Israeli Supermarket Chain Price Feeds

## Overview

Under the Price Transparency Law (חוק שקיפות מחירים, 2015), supermarket chains with 3 or more stores must publish product prices as machine-readable XML files. Data must be updated daily.

## Feed Types

All chains publish three categories of data files:

| File Type | Content | Update Frequency |
|-----------|---------|-----------------|
| PricesFull | Complete product catalog with current prices | Daily (overnight) |
| PricesPromotions (Promos) | Active sales, discounts, multi-buy deals | Daily (may lag PricesFull) |
| Stores | Store locations, addresses, operating hours | Weekly or on change |

## Per-Chain Feed Access

### Shufersal (שופרסל)
- **Feed Portal:** http://prices.shufersal.co.il
- **Access:** Public, no authentication required
- **Format:** Gzipped XML (.xml.gz)
- **File naming:** `PriceFull{StoreId}-{FileId}.xml.gz`
- **Schema:** Standard government format with extensions
- **Update time:** Typically 02:00-05:00 Israel time
- **Notes:** Most reliable and structured feed. Good baseline for testing parsers.
- **Store count:** 300+ stores, each with separate price files

### Rami Levy (רמי לוי)
- **Feed Portal:** http://prices.rframi.co.il
- **Access:** Public, no authentication required
- **Format:** Gzipped XML (.xml.gz)
- **File naming:** `PriceFull{StoreId}-{FileId}.xml.gz`
- **Schema:** Standard format, minor field naming differences
- **Update time:** Typically 01:00-04:00 Israel time
- **Notes:** Known for competitive pricing. Feed structure similar to Shufersal.

### Yochananof (יוחננוף)
- **Feed Portal:** http://prices.ybitan.co.il
- **Access:** Public, no authentication required
- **Format:** Gzipped XML (.xml.gz)
- **Schema:** Standard format
- **Update time:** Typically 03:00-06:00 Israel time
- **Notes:** Focuses on central Israel. Fewer stores means faster full downloads.

### Victory / Mega (ויקטורי / מגה)
- **Feed Portal:** http://prices.mega.co.il
- **Access:** Public, no authentication required
- **Format:** Gzipped XML (.xml.gz)
- **Schema:** Standard format with Alon group extensions
- **Update time:** Typically 02:00-05:00 Israel time
- **Notes:** Victory and Mega merged under Alon group. May appear as separate entities in feeds.

### Osher Ad (אושר עד)
- **Feed Portal:** http://prices.osherad.co.il
- **Access:** Public, no authentication required
- **Format:** Gzipped XML (.xml.gz)
- **Schema:** Standard format, minimal extensions
- **Update time:** Typically 01:00-03:00 Israel time
- **Notes:** Discount chain. Some products may have limited metadata.

### Tiv Taam (טיב טעם)
- **Feed Portal:** http://prices.tivtaam.co.il
- **Access:** Public, no authentication required
- **Format:** Gzipped XML (.xml.gz)
- **Schema:** Standard format
- **Update time:** Typically 02:00-05:00 Israel time
- **Notes:** Includes non-kosher products. Product categories may differ from kosher-only chains.

## XML Schema Reference

### PricesFull Schema (common fields)

```xml
<Items>
  <Item>
    <ItemCode>7290000000001</ItemCode>
    <ItemType>0</ItemType>
    <ItemName>חלב תנובה 3% שומן 1 ליטר</ItemName>
    <ManufacturerName>תנובה</ManufacturerName>
    <ManufactureCountry>IL</ManufactureCountry>
    <ManufacturerItemDescription>חלב מפוסטר 3%</ManufacturerItemDescription>
    <UnitQty>1</UnitQty>
    <Quantity>1</Quantity>
    <UnitOfMeasure>ליטר</UnitOfMeasure>
    <bIsWeighted>0</bIsWeighted>
    <QtyInPackage>1</QtyInPackage>
    <ItemPrice>6.50</ItemPrice>
    <UnitOfMeasurePrice>6.50</UnitOfMeasurePrice>
    <AllowDiscount>1</AllowDiscount>
    <ItemStatus>1</ItemStatus>
    <PriceUpdateDate>2026-02-26</PriceUpdateDate>
  </Item>
</Items>
```

### Key Fields

| Field | Description | Notes |
|-------|-------------|-------|
| ItemCode | Barcode / product code | Use for cross-chain matching |
| ItemName | Product name (Hebrew) | Naming varies across chains |
| ManufacturerName | Manufacturer | Useful for fuzzy matching |
| ItemPrice | Current price in NIS | VAT included |
| UnitOfMeasurePrice | Price per unit (kg/liter) | For weight/volume comparison |
| bIsWeighted | 0=fixed, 1=sold by weight | Affects price calculation |
| PriceUpdateDate | Last price update date | Check for staleness |

## Known Format Variations

- **Field naming:** Some chains use `ItemNm` instead of `ItemName`, or `ManuName` instead of `ManufacturerName`
- **Encoding:** All feeds should be UTF-8, but some chains occasionally produce Windows-1255 encoded files
- **Weighted items:** Price for weighted items (bIsWeighted=1) is per kg; actual cost depends on purchase weight
- **Barcode formats:** Israeli barcodes typically start with 729. Some store-brand items use internal codes starting with 2
- **Promotion overlap:** A product may appear in both PricesFull (regular price) and PricesPromotions (sale price). Always check promotions feed for the effective price
