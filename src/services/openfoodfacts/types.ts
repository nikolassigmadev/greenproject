// Single product lookup response
export interface OpenFoodFactsResponse {
  code: string;
  status: number; // 1 = found, 0 = not found
  status_verbose: string;
  product?: OpenFoodFactsProduct;
}

// Text search response
export interface OpenFoodFactsSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
}

export interface EcoscorePackagingComponent {
  material?: string;
  shape?: string;
  weight_measured?: number;
  recycling?: string;
  score?: number;
  non_recyclable_and_non_biodegradable?: string;
}

export interface EcoscoreAdjustments {
  origins_of_ingredients?: {
    epi_score?: number;
    transportation_score?: number;
    value?: number;
    aggregated_origins?: Array<{
      origin?: string;
      percent?: number;
    }>;
  };
  packaging?: {
    score?: number;
    value?: number;
    packagings?: EcoscorePackagingComponent[];
  };
  threatened_species?: {
    ingredient?: string;
    value?: number;
  };
  production_system?: {
    labels?: string[];
    value?: number;
  };
}

export interface EcoscoreData {
  grade?: string;
  score?: number;
  status?: string;
  adjustments?: EcoscoreAdjustments;
  agribalyse?: {
    code?: string;
    score?: number;
    co2_agriculture?: number;
    co2_consumption?: number;
    co2_distribution?: number;
    co2_packaging?: number;
    co2_processing?: number;
    co2_total?: number;
    co2_transportation?: number;
    ef_agriculture?: number;
    ef_consumption?: number;
    ef_distribution?: number;
    ef_packaging?: number;
    ef_processing?: number;
    ef_total?: number;
    ef_transportation?: number;
  };
}

export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];

  // Environmental scoring
  ecoscore_grade?: string;
  ecoscore_score?: number;
  ecoscore_data?: EcoscoreData;

  // Carbon footprint
  carbon_footprint_percent_of_known_ingredients?: number;

  // Nutrition scoring
  nutriscore_grade?: string;
  nutriscore_score?: number;
  nova_group?: number;

  nutriments?: {
    'carbon-footprint-from-known-ingredients_product'?: number;
    'carbon-footprint-from-known-ingredients_serving'?: number;
    'carbon-footprint-from-known-ingredients_100g'?: number;
    [key: string]: unknown;
  };

  // Labels and certifications
  labels?: string;
  labels_tags?: string[];

  // Origin
  origins?: string;
  origins_tags?: string[];
  manufacturing_places?: string;
  countries?: string;
  countries_tags?: string[];

  // Ingredients
  ingredients_text?: string;
  ingredients_text_en?: string;

  // Images
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
}

export interface OpenFoodFactsResult {
  found: boolean;
  barcode: string;
  productName: string | null;
  brand: string | null;
  ecoscoreGrade: string | null;
  ecoscoreScore: number | null;
  nutriscoreGrade: string | null;
  nutriscoreScore: number | null;
  novaGroup: number | null;
  carbonFootprint100g: number | null;
  carbonFootprintProduct: number | null;
  carbonFootprintServing: number | null;
  labels: string[];
  categories: string[];
  origins: string | null;
  ingredientsText: string | null;
  imageUrl: string | null;
  ecoscoreData: EcoscoreData | null;
  rawProduct: OpenFoodFactsProduct | null;
  error?: string;
}
