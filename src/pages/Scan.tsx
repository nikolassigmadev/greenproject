import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, Search, Loader2, AlertCircle, X, ScanLine, Image as ImageIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { calculateScore, Product } from "@/data/products";
import { ScoreBreakdownSlider } from "@/components/ScoreBreakdownSlider";
import Tesseract from "tesseract.js";

const Scan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const products = useProducts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [manualSearch, setManualSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Debug: Check if video element is mounted
  useEffect(() => {
    console.log('Video ref status:', !!videoRef.current);
    console.log('Canvas ref status:', !!canvasRef.current);
  }, [cameraActive, cameraInitializing]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraInitializing(true);
      
      // Check if video ref exists before proceeding
      if (!videoRef.current) {
        console.error('Video ref is null at start');
        setCameraInitializing(false);
        toast({
          title: "Camera Error",
          description: "Video element not ready. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }
      
      // Debug: Log what's available in navigator
      console.log('Navigator object:', navigator);
      console.log('MediaDevices available:', !!navigator.mediaDevices);
      console.log('getUserMedia available:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
      console.log('Video element exists:', !!videoRef.current);
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices) {
        console.error('navigator.mediaDevices is not available');
        toast({
          title: "Browser Not Supported",
          description: "Camera access is not supported in this browser. Please try Chrome, Firefox, or Safari.",
          variant: "destructive",
        });
        setCameraInitializing(false);
        return;
      }

      if (!navigator.mediaDevices.getUserMedia) {
        console.error('navigator.mediaDevices.getUserMedia is not available');
        toast({
          title: "Browser Not Supported",
          description: "Camera access is not supported in this browser. Please try Chrome, Firefox, or Safari.",
          variant: "destructive",
        });
        setCameraInitializing(false);
        return;
      }

      // Check if we're in a secure context
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        toast({
          title: "Secure Context Required",
          description: "Camera access requires HTTPS. Please use a secure connection or localhost.",
          variant: "destructive",
        });
        setCameraInitializing(false);
        return;
      }

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log('Camera access granted, setting up video stream...');
      
      // Double-check video ref still exists
      if (!videoRef.current) {
        console.error('Video ref became null during async operation');
        setCameraInitializing(false);
        toast({
          title: "Camera Error",
          description: "Video element not found. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }
      
      const video = videoRef.current;
      
      // Clear any existing stream
      if (video.srcObject) {
        const oldStream = video.srcObject as MediaStream;
        oldStream.getTracks().forEach(track => track.stop());
      }
      
      video.srcObject = stream;
      
      // Force video to load the new stream
      video.load();
      
      // Wait for video to be ready to play
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded, playing video...');
        // Ensure video dimensions are set
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        
        video.play()
          .then(() => {
            console.log('Video playing successfully');
            console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
            setCameraActive(true);
            setCameraInitializing(false);
            toast({
              title: "Camera Active",
              description: "Camera is ready to scan products.",
            });
          })
          .catch((error) => {
            console.error('Error playing video:', error);
            setCameraInitializing(false);
            toast({
              title: "Camera Error",
              description: "Failed to start video stream. Please try again.",
              variant: "destructive",
            });
          });
      };
      
      video.onerror = (error) => {
        console.error('Video error:', error);
        setCameraInitializing(false);
        toast({
          title: "Camera Error",
          description: "Video stream failed to load. Please try again.",
          variant: "destructive",
        });
      };

      // Add timeout for video loading
      setTimeout(() => {
        if (!cameraActive && cameraInitializing) {
          console.error('Video loading timeout');
          setCameraInitializing(false);
          toast({
            title: "Camera Error",
            description: "Camera initialization timed out. Please try again.",
            variant: "destructive",
          });
        }
      }, 10000); // 10 second timeout
    } catch (error: any) {
      console.error('Camera error:', error);
      setCameraInitializing(false);
      
      let errorMessage = "Unable to access camera. Please check permissions.";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found. Please connect a camera and try again.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera is already in use by another application.";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "Camera constraints not supported. Trying with default settings...";
        // Fallback to basic video constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setCameraActive(true);
          }
        } catch (fallbackError) {
          errorMessage = "Unable to access camera with any settings.";
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast, cameraActive, cameraInitializing]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, []);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      processImage(canvas.toDataURL("image/jpeg"));
    }
    stopCamera();
  }, [stopCamera]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);
        processImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process image with OCR
  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    setExtractedText("");

    try {
      const result = await Tesseract.recognize(imageData, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setIsScanning(true);
          }
        },
      });

      const text = result.data.text;
      setExtractedText(text);
      setIsScanning(false);

      // Search for products based on extracted text
      searchProducts(text);
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsScanning(false);
    }
  };

  // Search products with improved name-first matching
  const searchProducts = (query: string) => {
    const cleanQuery = query.toLowerCase().trim();
    const searchTerms = cleanQuery.split(/\s+/).filter((t) => t.length > 2);
    
    const results = products
      .map((product) => {
        const name = product.name.toLowerCase();
        const brand = product.brand.toLowerCase();
        const keywords = product.keywords.join(" ").toLowerCase();
        const id = product.id.toLowerCase();
        const barcode = (product.barcode || "").toLowerCase();
        const allText = `${name} ${brand} ${id} ${barcode} ${keywords}`;

        // Prioritize name matches
        let score = 0;
        if (name.includes(cleanQuery)) score += 100;
        else if (cleanQuery.includes(name)) score += 90;
        else if (searchTerms.some((term) => name.includes(term))) score += 50;
        else if (searchTerms.every((term) => name.includes(term))) score += 40;
        else if (brand.includes(cleanQuery)) score += 30;
        else if (searchTerms.some((term) => brand.includes(term))) score += 20;
        else if (searchTerms.some((term) => allText.includes(term))) score += 10;
        
        return { product, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);

    setSearchResults(results);

    if (results.length === 1) {
      // Direct match - navigate to product
      navigate(`/product/${results[0].id.replace("#", "")}`);
    } else if (results.length > 1) {
      toast({
        title: "Multiple Matches Found",
        description: `Found ${results.length} possible matches. Please select one below.`,
      });
    } else if (results.length === 0 && query.trim()) {
      toast({
        title: "No Products Found",
        description: "Try a different search or add the product to our database.",
      });
    }
  };

  // Manual search
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSearch.trim()) {
      searchProducts(manualSearch);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container max-w-2xl">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
              Scan a Product
            </h1>
            <p className="text-muted-foreground">
              Use your camera or upload an image to identify products
            </p>
          </div>

          {/* Scanner Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-primary" />
                Product Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Camera View */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 aspect-video shadow-lg border border-slate-200 dark:border-slate-700">
                {/* Always render video element, control visibility with CSS */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  style={{ 
                    transform: 'scaleX(-1)',
                    backgroundColor: '#000'
                  }}
                  onError={(e) => {
                    console.error('Video element error:', e);
                  }}
                  onStalled={() => {
                    console.log('Video stalled');
                  }}
                  onSuspend={() => {
                    console.log('Video suspended');
                  }}
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {cameraActive && (
                  <>
                    {/* Scanning overlay with improved design */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative">
                        <div className="w-56 h-56 border-2 border-primary rounded-2xl animate-pulse-soft shadow-lg" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 border border-primary/50 rounded-xl" />
                        </div>
                        {/* Corner indicators */}
                        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                      </div>
                    </div>

                    {/* Camera controls with improved positioning */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6">
                      <div className="bg-black/20 backdrop-blur-md rounded-full p-2 flex gap-3">
                        <Button 
                          onClick={capturePhoto} 
                          size="lg" 
                          className="bg-gradient-hero hover:scale-105 transition-transform duration-200 rounded-full w-16 h-16 p-0 shadow-lg"
                        >
                          <Camera className="w-6 h-6" />
                        </Button>
                        <Button 
                          onClick={stopCamera} 
                          variant="secondary" 
                          size="lg"
                          className="bg-white/90 hover:bg-white hover:scale-105 transition-all duration-200 rounded-full w-14 h-14 p-0 shadow-lg border border-white/20"
                        >
                          <X className="w-5 h-5 text-slate-700" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                
                {cameraInitializing ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                    <div className="text-center space-y-4 p-8">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                        <div className="absolute inset-0 w-12 h-12 animate-ping bg-primary/20 rounded-full mx-auto" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Initializing camera...</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Please allow camera access when prompted</p>
                      </div>
                    </div>
                  </div>
                ) : !cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-8">
                    <div className="w-full max-w-md space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          onClick={startCamera}
                          variant="outline"
                          className="h-36 flex-col gap-4 bg-white/50 hover:bg-white hover:scale-105 transition-all duration-200 rounded-2xl border-2 border-transparent hover:border-primary/30 shadow-lg backdrop-blur-sm"
                          disabled={isProcessing}
                        >
                          <div className="relative">
                            <Camera className="w-10 h-10 text-primary" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                          </div>
                          <span className="font-medium">Use Camera</span>
                        </Button>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="h-36 flex-col gap-4 bg-white/50 hover:bg-white hover:scale-105 transition-all duration-200 rounded-2xl border-2 border-transparent hover:border-primary/30 shadow-lg backdrop-blur-sm"
                          disabled={isProcessing}
                        >
                          <Upload className="w-10 h-10 text-primary" />
                          <span className="font-medium">Upload Image</span>
                        </Button>
                      </div>
                      
                      {/* Debug button with improved styling */}
                      <Button
                        onClick={() => {
                          console.log('Debug - Video ref:', videoRef.current);
                          console.log('Debug - Canvas ref:', canvasRef.current);
                          console.log('Debug - File input ref:', fileInputRef.current);
                          console.log('Debug - Camera active:', cameraActive);
                          console.log('Debug - Camera initializing:', cameraInitializing);
                          toast({
                            title: "Debug Info",
                            description: `Video ref: ${!!videoRef.current ? '✅' : '❌'}, Canvas ref: ${!!canvasRef.current ? '✅' : '❌'}`,
                          });
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full bg-slate-100/50 hover:bg-slate-200/50 dark:bg-slate-700/50 dark:hover:bg-slate-600/50 transition-all duration-200 rounded-xl border border-slate-300/30 dark:border-slate-600/30"
                      >
                        <span className="text-xs text-slate-500 dark:text-slate-400">🔧 Debug Video Elements</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Processing State */}
              {isProcessing && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-muted-foreground">
                    {isScanning ? "Reading text from image..." : "Processing image..."}
                  </span>
                </div>
              )}

              {/* Image Preview */}
              {uploadedImage && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Image Preview:</p>
                  <div className="relative rounded-lg overflow-hidden bg-muted aspect-video max-h-64">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Extracted Text */}
              {extractedText && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Extracted Text:</p>
                  <p className="text-sm font-mono whitespace-pre-wrap">
                    {extractedText.slice(0, 200)}
                    {extractedText.length > 200 && "..."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Manual Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSearch} className="flex gap-3">
                <Input
                  placeholder="Enter product name, barcode, or code (e.g., #p0001)"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-gradient-hero">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results ({searchResults.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id.replace("#", "")}`)}
                      className="w-full p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-lg bg-eco-sage/20 flex items-center justify-center flex-shrink-0">
                        {uploadedImage ? (
                          <img src={uploadedImage} alt="" className="w-full h-full object-cover rounded" />
                        ) : (
                          <ScanLine className="w-6 h-6 text-primary/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.brand} • {product.id}
                        </p>
                        <div className="mt-3">
                          <div className="text-sm font-medium">Score: {calculateScore(product)}</div>
                          <div className="mt-2">
                            <ScoreBreakdownSlider product={product} />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Scanning Tips</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Position the product label clearly in frame</li>
                  <li>Ensure good lighting for best results</li>
                  <li>Try scanning barcodes for faster identification</li>
                  <li>Use manual search if scanning doesn't work</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Debug Information */}
          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-2">Camera Troubleshooting</p>
                <div className="space-y-1 text-blue-800">
                  <p><strong>Browser:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
                  <p><strong>Protocol:</strong> {location.protocol}</p>
                  <p><strong>Hostname:</strong> {location.hostname}</p>
                  <p><strong>Navigator has mediaDevices:</strong> {!!navigator.mediaDevices ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>getUserMedia available:</strong> {!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? '❌ No' : '✅ Yes'}</p>
                  <p><strong>Secure Context:</strong> {location.protocol === 'https:' || location.hostname === 'localhost' ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>HTTPS required:</strong> {location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1' ? '❌ Yes (missing)' : '✅ No'}</p>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="font-medium text-blue-900">If camera doesn't work:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Open browser console (F12) and click "Use Camera" to see detailed errors</li>
                    <li>Check browser camera permissions (click the 🔒 icon in address bar)</li>
                    <li>Try refreshing the page and granting camera access</li>
                    <li>Ensure no other app is using the camera</li>
                    <li>Try using Chrome, Firefox, or Safari browsers</li>
                    <li>On mobile, use the built-in camera app instead</li>
                    <li>If using localhost, make sure you're on http://localhost:8080 or http://127.0.0.1:8080</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Scan;
