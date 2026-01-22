import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { defaultProducts, Product, calculateScore, getScoreRating } from '@/data/products';
import { saveProducts, loadProducts } from '@/utils/storage';
import { Lock, Plus, Pencil, Trash2, Upload, ImageIcon, X, Download } from 'lucide-react';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { SimpleLivestockForm, SimpleLivestockData } from '@/components/SimpleLivestockForm';
import { downloadProductsFile, copySingleProductCode } from '@/utils/productExporter';

const ADMIN_PASSWORD = 'pass';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [productList, setProductList] = useState<Product[]>(defaultProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [livestockData, setLivestockData] = useState<SimpleLivestockData>({
    animalSpace: 'good',
    animalExecution: 'standard',
    animalDiet: 'conventional',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load products from localStorage on component mount
  useEffect(() => {
    const storedProducts = loadProducts();
    if (storedProducts) {
      setProductList(storedProducts);
    }
  }, []);

  // Save products to localStorage whenever productList changes
  useEffect(() => {
    if (productList !== defaultProducts) {
      saveProducts(productList);
    }
  }, [productList]);

  // Update editing product materials in real-time when livestock data changes
  useEffect(() => {
    if (editingProduct && (editingProduct.category.includes('Meat') || 
        editingProduct.category.includes('Dairy') || 
        editingProduct.category.includes('Eggs'))) {
      
      // Build materials array from livestock data with appropriate labels
      const livestockMaterials = [
        livestockData.animalSpace === 'excellent' ? 'Excellent Space' :
        livestockData.animalSpace === 'good' ? 'Good Space' :
        livestockData.animalSpace === 'poor' ? 'Poor Space' : 'Terrible Space',
        livestockData.animalExecution === 'humane' ? 'Humane Execution' :
        livestockData.animalExecution === 'standard' ? 'Standard Execution' : 'Inhumane Execution',
        livestockData.animalDiet === 'natural' ? 'Natural Diet' :
        livestockData.animalDiet === 'organic' ? 'Organic Diet' :
        livestockData.animalDiet === 'conventional' ? 'Conventional Diet' : 'Processed Diet',
      ];

      // Update editing product with livestock materials
      setEditingProduct(prev => prev ? {
        ...prev,
        materials: livestockMaterials,
      } : null);
    }
  }, [livestockData, editingProduct?.category]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateEditingProduct('imageUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    updateEditingProduct('imageUrl', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const generateNextId = () => {
    const ids = productList.map(p => parseInt(p.id.replace('#p', '')));
    const maxId = Math.max(...ids, 0);
    return `#p${String(maxId + 1).padStart(4, '0')}`;
  };

  const emptyProduct: Product = {
    id: '',
    name: '',
    brand: '',
    category: '',
    origin: { country: '', region: '' },
    materials: ['Standard Production'], // Default materials to avoid empty array issues
    laborRisk: 'medium',
    transportDistance: 0,
    certifications: [],
    carbonFootprint: 0,
    keywords: [],
    barcode: '',
    manualScore: undefined,
  };

  const handleAddNew = () => {
    setEditingProduct({ ...emptyProduct, id: generateNextId() });
    setLivestockData({
      animalSpace: 'good',
      animalExecution: 'standard',
      animalDiet: 'conventional',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct({ ...product });
    // Reset livestock data to defaults
    setLivestockData({
      animalSpace: 'good',
      animalExecution: 'standard',
      animalDiet: 'conventional',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProductList(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSave = () => {
    if (!editingProduct) return;

    // For livestock products, materials are already updated in real-time
    // Just save the current editing product
    const existingIndex = productList.findIndex(p => p.id === editingProduct.id);
    if (existingIndex >= 0) {
      setProductList(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
    } else {
      setProductList(prev => [...prev, editingProduct]);
    }
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleExportProducts = () => {
    downloadProductsFile(productList);
  };

  const handleExportSingleProduct = (product: Product) => {
    copySingleProductCode(product);
  };

  const updateEditingProduct = (field: string, value: any) => {
    if (!editingProduct) return;
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditingProduct({
        ...editingProduct,
        [parent]: {
          ...(editingProduct[parent as keyof Product] as object),
          [child]: value
        }
      });
    } else {
      setEditingProduct({ ...editingProduct, [field]: value });
    }
  };

  const parseArrayInput = (value: string): string[] => {
    return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Admin Access</CardTitle>
              <p className="text-muted-foreground">Enter password to access the admin panel</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                  />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button type="submit" className="w-full">
                  Unlock Admin Panel
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Product Admin</h1>
            <p className="text-muted-foreground">Manage products - scores are auto-calculated</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportProducts} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Products
            </Button>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {productList.map(product => {
            const score = calculateScore(product);
            const rating = getScoreRating(score);
            return (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center">
                        <ScoreDisplay score={score} size="sm" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{product.id}</span>
                        <Badge variant={product.laborRisk === 'low' ? 'default' : product.laborRisk === 'medium' ? 'secondary' : 'destructive'}>
                          {product.laborRisk} risk
                        </Badge>
                      </div>
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.brand} • {product.category} • {product.origin.country}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${rating.color}`}>{rating.label}</p>
                      <p className="text-xs text-muted-foreground">{product.carbonFootprint} kg CO₂</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(product)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Select onValueChange={() => handleExportSingleProduct(product)}>
                        <SelectTrigger className="w-8 h-8">
                          <Download className="w-4 h-4" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="export">Copy Product Code</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct?.id && productList.some(p => p.id === editingProduct.id) ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product ID</Label>
                    <Input value={editingProduct.id} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Calculated Score</Label>
                    <div className="h-10 flex items-center">
                      <span className={`font-bold text-lg ${getScoreRating(calculateScore(editingProduct)).color}`}>
                        {calculateScore(editingProduct)}/100 - {getScoreRating(calculateScore(editingProduct)).label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input 
                      value={editingProduct.name} 
                      onChange={(e) => updateEditingProduct('name', e.target.value)}
                      placeholder="e.g., Organic Cotton T-Shirt"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Brand *</Label>
                    <Input 
                      value={editingProduct.brand} 
                      onChange={(e) => updateEditingProduct('brand', e.target.value)}
                      placeholder="e.g., EcoWear"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select 
                      value={editingProduct.category} 
                      onValueChange={(value) => updateEditingProduct('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Clothing">Clothing</SelectItem>
                        <SelectItem value="Drinkware">Drinkware</SelectItem>
                        <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                        <SelectItem value="Personal Care">Personal Care</SelectItem>
                        <SelectItem value="Footwear">Footwear</SelectItem>
                        <SelectItem value="Meat, Dairy & Eggs">Meat, Dairy & Eggs</SelectItem>
                        <SelectItem value="Electronics & Appliances">Electronics & Appliances</SelectItem>
                        <SelectItem value="Snacks & Packaged Foods">Snacks & Packaged Foods</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Labor Risk *</Label>
                    <Select 
                      value={editingProduct.laborRisk} 
                      onValueChange={(v) => updateEditingProduct('laborRisk', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Origin Country *</Label>
                    <Input 
                      value={editingProduct.origin.country} 
                      onChange={(e) => updateEditingProduct('origin.country', e.target.value)}
                      placeholder="e.g., Portugal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Origin Region</Label>
                    <Input 
                      value={editingProduct.origin.region || ''} 
                      onChange={(e) => updateEditingProduct('origin.region', e.target.value)}
                      placeholder="e.g., Porto"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transport Distance (km) *</Label>
                    <Input 
                      type="number"
                      value={editingProduct.transportDistance} 
                      onChange={(e) => updateEditingProduct('transportDistance', Number(e.target.value))}
                      placeholder="e.g., 5000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Carbon Footprint (kg CO₂) *</Label>
                    <Input 
                      type="number"
                      step="0.1"
                      value={editingProduct.carbonFootprint} 
                      onChange={(e) => updateEditingProduct('carbonFootprint', Number(e.target.value))}
                      placeholder="e.g., 8.5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Materials (comma-separated) *</Label>
                  <Input 
                    value={editingProduct.materials.join(', ')} 
                    onChange={(e) => updateEditingProduct('materials', parseArrayInput(e.target.value))}
                    placeholder="e.g., Organic Cotton, Natural Dyes"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Certifications (comma-separated)</Label>
                  <Input 
                    value={editingProduct.certifications.join(', ')} 
                    onChange={(e) => updateEditingProduct('certifications', parseArrayInput(e.target.value))}
                    placeholder="e.g., Fair Trade, Organic, B-Corp"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Keywords (comma-separated) *</Label>
                  <Input 
                    value={editingProduct.keywords.join(', ')} 
                    onChange={(e) => updateEditingProduct('keywords', parseArrayInput(e.target.value))}
                    placeholder="e.g., shirt, tshirt, cotton, apparel"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Product Image</Label>
                  <div className="space-y-3">
                    {editingProduct.imageUrl ? (
                      <div className="relative inline-block">
                        <img 
                          src={editingProduct.imageUrl} 
                          alt="Product preview" 
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 w-6 h-6"
                          onClick={removeImage}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Image
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Or enter URL:</span>
                      <Input 
                        value={editingProduct.imageUrl || ''} 
                        onChange={(e) => updateEditingProduct('imageUrl', e.target.value || undefined)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input 
                    value={editingProduct.barcode || ''} 
                    onChange={(e) => updateEditingProduct('barcode', e.target.value)}
                    placeholder="e.g., 1234567890123"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Manual Score Override (Optional)</Label>
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    value={editingProduct.manualScore !== undefined ? editingProduct.manualScore : ''} 
                    onChange={(e) => updateEditingProduct('manualScore', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Leave empty for auto-calculated score"
                  />
                  <p className="text-xs text-muted-foreground">
                    Override the calculated score (0-100). Leave empty to use automatic scoring.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave}>Save Product</Button>
                </div>
              </div>
            )}
            
            {/* Simple Livestock Form */}
            {editingProduct && (
              <SimpleLivestockForm
                category={editingProduct.category}
                livestockData={livestockData}
                onChange={setLivestockData}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
