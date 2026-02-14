export interface OpenFoodFactsResponse {
  code: string;
  status: number; // 1 = found, 0 = not found
  status_verbose: string;
  product?: OpenFoodFactsProduct;
}

export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];

  // Environmental scoring
  ecoscore_grade?: string; // "a" | "b" | "c" | "d" | "e" | "unknown" | "not-applicable"
  ecoscore_score?: number; // 0-100

  // Carbon footprint
  carbon_footprint_percent_of_known_ingredients?: number;

  // Nutrition scoring
  nutriscore_grade?: string; // "a" through "e"
  nutriscore_score?: number;
  nova_group?: number; // 1-4 (processing level)

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
  ecoscoreGrade: string | null; // "a"-"e" or null
  ecoscoreScore: number | null; // 0-100
  nutriscoreGrade: string | null;
  nutriscoreScore: number | null;
  novaGroup: number | null; // 1-4
  carbonFootprint100g: number | null; // g CO2e per 100g
  labels: string[];
  categories: string[];
  origins: string | null;
  ingredientsText: string | null;
  imageUrl: string | null;
  rawProduct: OpenFoodFactsProduct | null;
  error?: string;
}
