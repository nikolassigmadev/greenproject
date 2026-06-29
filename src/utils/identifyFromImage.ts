import { advancedProductOCR } from "@/services/ocr/advanced-openai-ocr";
import { lookupBarcode, isValidBarcode } from "@/services/openfoodfacts";

const isUnknown = (s?: string | null) =>
  !s || /^(unknown|none)$/i.test(s.trim());

/**
 * Identify a search-ready product label ("Brand Product") from a photo, reusing
 * the exact pipeline the scan page uses: OpenAI vision reads the packaging (and
 * any barcode), and a readable barcode is resolved against Open Food Facts for
 * the most precise label. Returns a string callers can feed into
 * {@link import("./smartProductSearch").smartProductSearch}, or null when the
 * model couldn't read anything usable.
 *
 * Shared by the Compare page's photo/camera capture so it identifies products
 * the same way as a normal scan (image → OpenAI → barcode → OFF).
 */
export async function identifyLabelFromImage(imageDataUrl: string): Promise<string | null> {
  const id = await advancedProductOCR(imageDataUrl);
  if (!id.success) return null;

  // A readable barcode is the most precise signal — resolve it against OFF so
  // the slot is seeded with the exact product name.
  if (id.barcode && isValidBarcode(id.barcode)) {
    try {
      const r = await lookupBarcode(id.barcode);
      if (r.found) {
        const named = [r.brand, r.productName].filter(Boolean).join(" ").trim();
        return named || id.barcode;
      }
    } catch {
      /* fall through to the OCR text label */
    }
  }

  const label = [id.brandName, id.productName]
    .filter((s) => !isUnknown(s))
    .join(" ")
    .trim();
  return label || null;
}

/** Read a File (from a file input / camera capture) into a base64 data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
