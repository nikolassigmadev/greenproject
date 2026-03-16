# Animal Welfare Data Sources & References

This document lists all sources used for the animal welfare company ratings and flags integrated into the Ethical Shopper application.

## Primary Sources

### 1. BBFAW 2024/2025 Report - Business Benchmark on Farm Animal Welfare
- **URL**: https://www.bbfaw.com/benchmark/
- **Scope**: Evaluates farm animal welfare policies, management systems, reporting and performance of 150 of the world's largest food companies
- **Methodology**: Assessed companies across 51 criteria related to farm animal welfare
- **Tier System**:
  - Tier 1-2: Leading companies with strong animal welfare policies
  - Tier 3: Moderate commitment with some implementation
  - Tier 4: Limited farm animal welfare management (26-50% score)
  - Tier 5: Farm animal welfare on business agenda but limited evidence of management (11-26% score)
  - Tier 6 (Worst): Limited/no evidence of farm animal welfare recognition (below 11% score)
- **Impact Rating**: 91% of all benchmarked companies score lowest Impact Ratings (E or F)
- **Geographic Finding**: 98% of US-based companies appear in bottom two tiers (Tiers 5-6)

### 2. World Animal Protection - Corporate Scorecard & Pecking Order Report
- **URL**: https://www.worldanimalprotection.org/latest/press-releases/
- **Focus Areas**:
  - Chicken welfare (broiler chickens, layer hens)
  - Pig welfare (gestation crates)
  - Beef cattle welfare
  - Fish farming welfare
  - Antibiotic use in animal agriculture
- **Scorecard**: "Moving the Menu 2024 Corporate Scorecard"
- **Key Findings**: Major food companies (Walmart, Amazon, McDonald's, Whole Foods, etc.) failing to adopt humane farming standards

### 3. Humane Society of the United States - Food Industry Scorecard
- **URL**: https://www.humanesociety.org/blog/food-companies-efforts-save-animals-rated
- **Scope**: Evaluates food companies on their efforts to reduce animal suffering
- **Grading System**: A-F letter grades
- **Assessment Criteria**:
  - Cage-free egg commitments and implementation
  - Chicken welfare improvements
  - Pig welfare (gestation crate abolition)
  - Antibiotic use reduction
  - Supply chain transparency

## Company-Specific Sources

### Tyson Foods
- **Animal Outlook Investigation**: https://animaloutlook.org/tyson-exposed-a-tradition-of-torture/
- **Sentient Media - Tyson Investigations**: https://sentientmedia.org/tyson-foods-free-range/
- **Key Finding**: Documented worker violence against chickens, deformed birds, untreated injuries, crippling leg deformities, unsanitary conditions with toxic ammonia fumes

### Starbucks Cage-Free Commitment
- **ABC News Investigation**: Coverage of Starbucks walking back cage-free commitments
- **The Humane League**: Tracking Starbucks' cage-free transition progress
- **Finding**: Cage-free promise altered to apply only to company-owned stores (40%), not franchises (40% of restaurants)

### Cargill Inc.
- **Mighty Earth**: https://www.mightyearth.org/
- **Report**: Cargill named "worst company in the world" (2019) for ecosystem destruction, along with animal welfare and labor concerns
- **Sentient Media**: Coverage of Cargill's use of critical antibiotics
- **Finding**: Documented use of 12 different antibiotics, including WHO-designated vital human medicines

### Mondelēz International Animal Testing
- **PETA Database**: https://crueltyfree.peta.org/companies-do-test/
- **Finding**: History of funding non-required animal testing, including nutritional studies involving forced feeding to mice and rats
- **Recent Update**: 2024 - Agreement to stop nutritional science tests on animals after shareholder pressure

## Supplementary Sources

### PETA - Cruelty Free Companies Database
- **URL**: https://crueltyfree.peta.org/
- **Focus**: Animal testing practices in cosmetics, personal care, and food companies
- **Coverage**: L'Oréal (Nestlé subsidiary) and other companies with animal testing concerns

### Compassion in World Farming (CIWF)
- **Focus**: Farm animal welfare standards and certifications
- **Certifications Recognized**:
  - Certified Humane
  - Animal Welfare Approved (AWA)
  - Grass-fed/pasture-raised
  - RSPCA Assured (UK)

### The Humane League
- **Focus**: Corporate campaigns for animal welfare improvements
- **Recent Campaigns**: Chick-fil-A, Dunkin', Subway chicken welfare
- **URL**: https://thehumaneleague.org/

## Data Integration

### Implementation in Codebase
- **File**: `src/data/poorAnimalWelfareCompanies.ts`
- **Data Structure**: JSON-formatted list of 19 major food/consumer companies with:
  - Company name and primary brands
  - BBFAW tier and score
  - Specific animal welfare concerns
  - Severity classification (critical/high/moderate)
  - Source references for each company

### Product Scoring Impact
- **File**: `src/data/scoreBreakdown.ts`
- **Integration**: Animal welfare flag penalties applied to product scores
  - Critical severity: -40 points from animal welfare score
  - High severity: -25 points from animal welfare score
  - Moderate severity: -15 points from animal welfare score

### UI Component
- **File**: `src/components/AnimalWelfareFlagBadge.tsx`
- **Display**: Warning badge showing company name, BBFAW tier, and key concerns

## Methodology

### Company Selection Criteria
1. **BBFAW Bottom Tier Companies**: Tiers 5-6 (bottom two tiers)
2. **Major Market Presence**: Large global food companies with significant market share
3. **Multiple Source Verification**: Information verified against multiple independent sources
4. **Documented Evidence**: Specific allegations backed by investigations or official reports

### Severity Assessment
- **Critical**: Tier 6 status, criminal charges, or systemic abuse documented
- **High**: Tier 5 status with failed commitments or widespread poor practices
- **Moderate**: Tier 4 status or limited implementation of public commitments

## Notes on Data Accuracy

- All sources are from reputable animal welfare organizations with established methodologies
- BBFAW report represents the most comprehensive assessment of farm animal welfare policies
- Company information reflects data as of March 2025
- Some companies have multiple subsidiaries/brands that may have different practices
- Certifications and standards mentioned represent legitimate third-party verifications
- This data is intended to inform consumer choices and corporate accountability

## Important Disclaimer

This database represents aggregated information from multiple reputable sources. While effort has been made to ensure accuracy, animal welfare assessment is evolving. Companies may improve practices over time. Consumers are encouraged to:
- Check the original sources for the latest updates
- Support companies with strong animal welfare records
- Advocate for industry-wide improvements
- Contact companies to request better practices

## References for Updates

To stay current with animal welfare standards:
1. Visit BBFAW.com annually for updated rankings
2. Check World Animal Protection's corporate scorecard updates
3. Monitor Humane Society's food industry scorecard
4. Review individual company commitments and implementation progress
