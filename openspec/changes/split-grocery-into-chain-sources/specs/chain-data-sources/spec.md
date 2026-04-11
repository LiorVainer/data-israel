# chain-data-sources

## ADDED Requirements

### Requirement: Shufersal Data Source
The system SHALL provide a `shufersal` data source with a REST API client querying `https://www.shufersal.co.il/online/he/search/results`.

#### Scenario: Search products by name
- **GIVEN** a user asks about Shufersal product prices
- **WHEN** the Shufersal agent searches for "חלב"
- **THEN** it SHALL return products with name, price, brand, unit description, and category

#### Scenario: Search products by barcode
- **GIVEN** a user provides a barcode starting with 729
- **WHEN** the Shufersal agent searches for that barcode
- **THEN** it SHALL return the matching product with its price

### Requirement: Rami Levy Data Source
The system SHALL provide a `rami-levy` data source with a REST API client querying `https://www.rami-levy.co.il/api/catalog`.

#### Scenario: Search products by name
- **GIVEN** a user asks about Rami Levy product prices
- **WHEN** the Rami Levy agent searches for "חלב"
- **THEN** it SHALL return products with name, price (NIS), barcode, brand, and department

#### Scenario: Search products by barcode
- **GIVEN** a user provides a barcode
- **WHEN** the Rami Levy agent searches for that barcode
- **THEN** it SHALL return the matching product with its price

### Requirement: Cross-Chain Price Comparison
The routing agent SHALL support parallel delegation to both Shufersal and Rami Levy agents for price comparison queries.

#### Scenario: Compare prices across chains
- **GIVEN** a user asks "כמה עולה חלב תנובה 3% בשופרסל לעומת רמי לוי?"
- **WHEN** the routing agent identifies this as a cross-chain comparison
- **THEN** it SHALL call both agents in parallel and present a comparison

## REMOVED Requirements

### Requirement: Remove Generic Grocery Data Source
The `grocery` data source (XML feed parsing) SHALL be removed and replaced by the chain-specific sources above.

#### Scenario: No grocery agent in registry
- **GIVEN** the migration is complete
- **WHEN** the registry is queried
- **THEN** there SHALL be no `grocery` entry; instead `shufersal` and `rami-levy` entries SHALL exist
