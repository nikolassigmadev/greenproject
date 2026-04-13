import { useState, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";
import {
  Upload, Receipt, Loader2, AlertCircle,
  Plus, ShoppingBag, X, CheckCircle2, FileImage,
} from "lucide-react";
import { searchProducts as searchOffProducts } from "@/services/openfoodfacts";
import { addToBasket } from "@/utils/basketStorage";
import { useToast } from "@/hooks/use-toast";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { extractReceiptProducts } from "@/services/ocr/openai-service";

const gradeColor: Record<string, string> = {
  a: 'hsl(142 55% 38%)',
  b: 'hsl(80 55% 40%)',
  c: 'hsl(38 88% 44%)',
  d: 'hsl(22 80% 48%)',
  e: 'hsl(0 68% 48%)',
};

interface ReceiptProduct {
  query: string;
  result: OpenFoodFactsResult | null;
  loading: boolean;
  added: boolean;
}

export default function ReceiptScanner() {
  const [phase, setPhase] = useState<'upload' | 'reading' | 'searching' | 'results'>('upload');
  const [extractedCount, setExtractedCount] = useState(0);
  const [products, setProducts] = useState<ReceiptProduct[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processImage = useCallback(async (file: File) => {
    setPhase('reading');

    try {
      const lines = await extractReceiptProducts(file);

      if (lines.length === 0) {
        toast({
          title: 'No products detected',
          description: 'Try a clearer, flat photo of the receipt.',
          variant: 'destructive',
        });
        setPhase('upload');
        return;
      }

      setExtractedCount(lines.length);
      setPhase('searching');

      const initial: ReceiptProduct[] = lines.map((q) => ({
        query: q, result: null, loading: true, added: false,
      }));
      setProducts(initial);

      const settled = await Promise.allSettled(lines.map((q) => searchOffProducts(q)));

      setProducts(
        lines.map((query, i) => {
          const r = settled[i];
          const result =
            r.status === 'fulfilled' && r.value.length > 0 ? r.value[0] : null;
          return { query, result, loading: false, added: false };
        })
      );

      setPhase('results');
    } catch {
      toast({ title: 'Scan failed', description: 'Could not read the receipt. Check your API connection.', variant: 'destructive' });
      setPhase('upload');
    }
  }, [toast]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image.', variant: 'destructive' });
      return;
    }
    processImage(file);
  };

  const handleAddToBasket = (idx: number) => {
    const p = products[idx];
    if (!p.result || p.added) return;
    addToBasket({
      barcode: p.result.barcode,
      productName: p.result.productName || p.query,
      brand: p.result.brand,
      imageUrl: p.result.imageUrl,
      ecoscoreGrade: p.result.ecoscoreGrade,
      ecoscoreScore: p.result.ecoscoreScore,
      nutriscoreGrade: p.result.nutriscoreGrade,
      laborAllegations: 0,
      co2Per100g: p.result.carbonFootprint100g,
    });
    setProducts((prev) => prev.map((item, i) => i === idx ? { ...item, added: true } : item));
    toast({ title: 'Added to basket', description: p.result.productName || p.query });
  };

  const handleAddAll = () => {
    products.forEach((_, i) => {
      if (products[i].result && !products[i].added) handleAddToBasket(i);
    });
  };

  const reset = () => {
    setPhase('upload');
    setProducts([]);
    setExtractedCount(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const foundCount = products.filter((p) => p.result).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-nav">
        {/* Hero */}
        <div
          className="px-5 pt-10 pb-12 text-center relative overflow-hidden"
          style={{ background: 'var(--gradient-hero)' }}
        >
          <div className="max-w-sm mx-auto relative z-10">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.30)' }}
            >
              <Receipt className="w-7 h-7 text-white" strokeWidth={1.8} />
            </div>
            <h1
              className="text-2xl font-display font-extrabold tracking-tight mb-1.5"
              style={{ color: '#ffffff' }}
            >
              Receipt Scanner
            </h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.90)' }}>
              Ethics-check your whole shop in one go — just upload a photo of your receipt
            </p>
          </div>
        </div>

        <div className="px-5 -mt-5 relative z-10 pb-8">
          <div className="max-w-xl mx-auto space-y-4">

            {/* ── Upload ── */}
            {phase === 'upload' && (
              <div
                className={`bg-card rounded-2xl border-2 border-dashed shadow-soft p-10 text-center cursor-pointer transition-all duration-200 ${dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/60 hover:border-primary/50'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileImage className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-base font-bold text-foreground mb-1">Upload Receipt Photo</h2>
                <p className="text-sm text-muted-foreground mb-3">Drag & drop or tap to choose a photo</p>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: 'hsl(196 88% 22%)', color: '#ffffff' }}
                >
                  <Upload className="w-4 h-4" />
                  Choose Photo
                </div>
                <p className="text-xs text-muted-foreground/60 mt-3">
                  JPG · PNG · WEBP — works best with clear, flat receipts
                </p>
              </div>
            )}

            {/* ── Progress ── */}
            {(phase === 'reading' || phase === 'searching') && (
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-8 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <h2 className="text-base font-bold text-foreground mb-1">
                  {phase === 'reading' ? 'Analysing receipt...' : 'Looking up products...'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {phase === 'reading'
                    ? 'AI is reading your receipt and extracting items'
                    : `Found ${extractedCount} item${extractedCount !== 1 ? 's' : ''} — searching database...`}
                </p>
              </div>
            )}

            {/* ── Results ── */}
            {phase === 'results' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      {foundCount} of {products.length} matched
                    </h2>
                    <p className="text-xs text-muted-foreground">from your receipt</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddAll}
                      disabled={foundCount === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-soft hover:bg-primary/90 transition-all disabled:opacity-40"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Add All
                    </button>
                    <button
                      onClick={reset}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-medium transition-all hover:bg-muted/70 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {products.map((p, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border/60 shadow-soft p-4">
                      {p.result ? (
                        <div className="flex items-start gap-3">
                          {p.result.imageUrl ? (
                            <img
                              src={p.result.imageUrl}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-xl">
                              📦
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {p.result.productName || p.query}
                            </p>
                            {p.result.brand && (
                              <p className="text-xs text-muted-foreground">{p.result.brand}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
                              from: {p.query}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {p.result.ecoscoreGrade && (
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
                                  style={{ backgroundColor: gradeColor[p.result.ecoscoreGrade.toLowerCase()] ?? 'hsl(38 88% 44%)' }}
                                >
                                  Eco {p.result.ecoscoreGrade.toUpperCase()}
                                </span>
                              )}
                              {p.result.nutriscoreGrade && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500 text-white">
                                  Nutri {p.result.nutriscoreGrade.toUpperCase()}
                                </span>
                              )}
                              {p.result.carbonFootprint100g !== null && p.result.carbonFootprint100g !== undefined && (
                                <span className="text-[10px] text-muted-foreground">
                                  {p.result.carbonFootprint100g}g CO₂/100g
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddToBasket(i)}
                            disabled={p.added}
                            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${p.added ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-primary/10 hover:bg-primary/20'}`}
                            aria-label={p.added ? 'Added' : 'Add to basket'}
                          >
                            {p.added
                              ? <CheckCircle2 className="w-[1.125rem] h-[1.125rem] text-emerald-600" />
                              : <Plus className="w-[1.125rem] h-[1.125rem] text-primary" />
                            }
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.query}</p>
                            <p className="text-xs text-muted-foreground">Not found in database</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {foundCount > 0 && (
                  <Link
                    to="/basket"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
                    style={{ background: 'var(--gradient-hero)', color: '#ffffff' }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    View Basket Ethics Report
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
