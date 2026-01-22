# Livestock Sustainability Scoring Algorithm

## Overview
This specialized scoring algorithm evaluates meat, dairy, and egg products based on comprehensive animal welfare and environmental factors. It uses scientific research and industry standards to provide accurate sustainability assessments.

## Scoring Categories

### Animal Welfare Factors (60% weight)

#### 1. Housing Type (15%)
- **Pasture-raised** (95 points): Animals roam freely on pasture
- **Free-range** (90 points): Access to outdoor areas
- **Extensive** (85 points): Low-density outdoor systems
- **Intensive** (25 points): High-density confined systems
- **Caged** (20 points): Confined to cages
- **Factory-farmed** (15 points): Industrial confinement systems

#### 2. Feed Type (12%)
- **Grass-fed** (85 points): Natural diet, better for ruminants
- **Organic-feed** (80 points): No synthetic pesticides/herbicides
- **Mixed-feed** (60 points): Combination of natural and conventional
- **Conventional-feed** (40 points): Standard industrial feed
- **Grain-fed** (35 points): High-grain diets for ruminants

#### 3. Antibiotics Use (10%)
- **No antibiotics** (90 points): Antibiotic-free production
- **Therapeutic-only** (70 points): Only when medically necessary
- **Routine-use** (30 points): Regular preventive use
- **Growth-promoters** (15 points): Used for growth enhancement

#### 4. Hormones Use (8%)
- **No hormones** (85 points): No hormone supplementation
- **Natural hormones** (60 points): Natural hormone alternatives
- **Synthetic hormones** (20 points): Synthetic growth hormones

#### 5. Slaughter Method (7%)
- **Humane-certified** (85 points): Certified humane practices
- **Standard** (50 points): Conventional methods
- **Unknown** (40 points): Method not specified

#### 6. Space Per Animal (8%)
- **High** (90 points): Ample space, low stress
- **Adequate** (70 points): Minimum welfare standards
- **Crowded** (35 points): Below welfare standards
- **Overcrowded** (15 points): Severely restricted

### Environmental Factors (30% weight)

#### 1. Land Use (8%)
- **Low** (85 points): Efficient land use
- **Medium** (65 points): Moderate land requirements
- **High** (40 points): Significant land use
- **Very-high** (20 points): Extensive land requirements

#### 2. Water Usage (6%)
- **Low** (85 points): Water-efficient production
- **Medium** (70 points): Average water consumption
- **High** (45 points): High water requirements
- **Very-high** (25 points): Very water-intensive

#### 3. Methane Emissions (8%)
- **Low** (85 points): Low greenhouse gas emissions
- **Medium** (65 points): Average emissions
- **High** (40 points): High emissions
- **Very-high** (20 points): Very high emissions

#### 4. Biodiversity Impact (5%)
- **Positive** (90 points): Enhances biodiversity
- **Neutral** (60 points): No significant impact
- **Negative** (35 points): Harms biodiversity
- **Severe-negative** (15 points): Major biodiversity loss

#### 5. Deforestation Risk (3%)
- **None** (90 points): No deforestation link
- **Low** (75 points): Minimal risk
- **Medium** (50 points): Moderate risk
- **High** (25 points): High deforestation risk

### Certification Factors (10% weight)

#### High-Value Certifications
- **Animal Welfare Approved** (10 points): Highest welfare standards
- **Regenerative Organic Certified** (10 points): Regenerative practices
- **Demeter Biodynamic** (9 points): Biodynamic farming
- **Global Animal Partnership (GAP) 5+** (9 points): Highest welfare level
- **Certified Humane** (8 points): Humane treatment standards
- **MSC Certified** (8 points): Sustainable seafood
- **EU Organic** (7 points): European organic standards
- **Grass-fed Certified** (7 points): Verified grass-fed

#### Medium-Value Certifications
- **USDA Organic** (6 points): USDA organic standards
- **Pasture for Life** (9 points): 100% pasture-raised
- **Pasture-Raised** (6 points): Pasture access
- **Fair Trade** (5 points): Fair labor practices
- **Carbon Neutral** (4 points): Carbon offset programs

#### Basic Certifications
- **Non-GMO** (3 points): No genetically modified organisms
- **Free-Range Certified** (5 points): Verified free-range
- **Sustainable Seafood** (6 points): Basic sustainability

## Category Adjustments

**IMPORTANT**: The algorithm does NOT apply category-based penalties or bonuses. All livestock products are evaluated based on their production methods only. The category selection (Meat, Dairy & Eggs) does not affect the sustainability score - only the specific production practices matter.

Different animal types have different environmental baseline factors, but these are determined by the production methods selected, not by the category itself.

## Environmental Factor Determination

### Land Use
- **Grass-fed + Pasture-raised**: High land use (extensive grazing)
- **Grass-fed**: Medium land use
- **Factory-farmed**: Low land use (concentrated operations)

### Water Usage
- **Salmon**: Medium water requirements (aquaculture)
- **Grass-fed**: Medium water use
- **Conventional feed**: High water requirements

### Methane Emissions
- **Beef/Lamb + Grass-fed**: High methane (ruminant digestion)
- **Beef/Lamb + Conventional**: Medium methane
- **Chicken/Turkey + Organic**: Low methane
- **Chicken/Turkey + Conventional**: Medium methane
- **Salmon**: Low methane (fish)

### Biodiversity Impact
- **Pasture-raised + Grass-fed**: Positive (regenerative grazing)
- **Free-range**: Neutral impact
- **Factory-farmed**: Severe negative (monoculture feed production)

### Deforestation Risk
**High-risk countries**: Brazil, Argentina, Paraguay, Bolivia, Indonesia, Malaysia
**Medium-risk countries**: Mexico, Colombia, Peru, Venezuela

## Example Scenarios

### Excellent Example (90+ points)
- **Pasture-raised, grass-fed organic beef**
- **No antibiotics or hormones**
- **Animal Welfare Approved certification**
- **Low deforestation risk region**
- **Humane slaughter certification**

### Poor Example (under 30 points)
- **Factory-farmed, caged eggs**
- **Routine antibiotics use**
- **Synthetic hormones**
- **High deforestation risk region**
- **No animal welfare certifications**

## Data Extraction

The algorithm automatically extracts factors from:
- **Product materials**: Housing type, feed type, antibiotic/hormone use
- **Certifications**: Verified standards and practices
- **Origin country**: Deforestation risk assessment
- **Product category**: Environmental impact adjustments

This comprehensive approach ensures accurate, science-based sustainability scoring for all meat, dairy, and egg products.
