import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { defaultProducts, Product, calculateScore, getScoreRating } from '@/data/products';
import { saveProducts, loadProducts } from '@/utils/storage';
import { Plus, Pencil, Trash2, Upload, ImageIcon, X, Download, LogOut, ChevronsUpDown } from 'lucide-react';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { SimpleLivestockForm, SimpleLivestockData } from '@/components/SimpleLivestockForm';
import { downloadProductsFile, copySingleProductCode } from '@/utils/productExporter';

import { clearAdminAuthenticated, isAdminAuthenticated } from '@/utils/adminAuth';
import { toast } from 'sonner';

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [productList, setProductList] = useState<Product[]>(defaultProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [livestockData, setLivestockData] = useState<SimpleLivestockData>({
    productType: 'BEEF',
    animalSpace: 'good',
    animalExecution: 'standard',
    animalDiet: 'conventional',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Livestock certification options (3 points each)
  const livestockCertifications = [
    'Certified Humane',
    'Animal Welfare Approved',
    'Global Animal Partnership (GAP) 5+',
    'Global Animal Partnership (GAP) 4',
    'Global Animal Partnership (GAP) 3',
    'Global Animal Partnership (GAP) 2',
    'Global Animal Partnership (GAP) 1',
    'USDA Organic',
    'EU Organic',
    'Pasture for Life',
    'Regenerative Organic Certified',
    'Demeter Biodynamic',
    'MSC Certified',
    'Sustainable Seafood',
    'Non-GMO',
    'Grass-fed Certified',
    'Free-Range Certified',
    'Carbon Neutral',
    'Fair Trade',
  ];

  // Load products from localStorage on component mount
  useEffect(() => {
    const storedProducts = loadProducts();
    if (storedProducts) {
      setProductList(storedProducts);
    }
  }, []);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin/login', { replace: true, state: { from: location } });
    }
  }, [location, navigate]);

  const authenticated = isAdminAuthenticated();

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
        livestockData.productType,
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
    comments: '',
  };

  const handleAddNew = () => {
    const newProduct: Product = {
      id: `#p${(productList.length + 1).toString().padStart(4, '0')}`,
      name: '',
      brand: '',
      category: '',
      origin: { country: '' },
      materials: [''],
      laborRisk: 'low',
      transportDistance: 0,
      certifications: [],
      carbonFootprint: 0,
      keywords: [''],
      imageUrl: undefined,
      barcode: '',
      comments: '',
      manualScore: undefined,
      // Initialize new detailed scoring fields with defaults
      laborViolations: 'none',
      laborBonuses: [],
      laborManualPoints: undefined,
      animalWelfareConditions: 'plant-based',
      animalWelfareItems: [],
      animalWelfareManualPoints: undefined,
      transportMode: 'truck',
      transportManualPoints: undefined,
      certificationManualPoints: undefined,
    };
    setEditingProduct(newProduct);
    setIsDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct({ ...product });
    // Reset livestock data to defaults
    setLivestockData({
      productType: 'BEEF',
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

  const handleExportSingleProduct = async (product: Product) => {
    try {
      const success = await copySingleProductCode(product);
      if (success) {
        toast.success(`Product JSON for "${product.name}" copied to clipboard!`);
      } else {
        toast.error("Could not copy to clipboard. Please try again.");
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export product JSON.");
    }
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

  if (!authenticated) return null;

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
              Export JSON
            </Button>
            <Button
              onClick={() => {
                clearAdminAuthenticated();
                navigate('/admin/login', { replace: true });
              }}
              variant="outline"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
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
                          <SelectItem value="export">Copy Product JSON</SelectItem>
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
                                  </div>

                
                {/* LABOR SCORING CRITERIA */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Labor Scoring Criteria (35 points max)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Labor Violations</Label>
                        <Select 
                          value={editingProduct.laborViolations || 'none'} 
                          onValueChange={(v) => updateEditingProduct('laborViolations', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select labor violations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No violations</SelectItem>
                            <SelectItem value="no-third-party-audit">No third-party audit (-3)</SelectItem>
                            <SelectItem value="limited-transparency">Limited transparency (-5)</SelectItem>
                            <SelectItem value="no-union-rights">No union rights (-8)</SelectItem>
                            <SelectItem value="excessive-hours">Excessive hours &gt;60/week (-10)</SelectItem>
                            <SelectItem value="unsafe-conditions">Unsafe conditions (-12)</SelectItem>
                            <SelectItem value="no-living-wage">No living wage (-15)</SelectItem>
                            <SelectItem value="slavery-forced-child-labor">Slavery/Forced labor/Child labor (-35)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Labor Manual Points</Label>
                        <Input 
                          type="number"
                          value={editingProduct.laborManualPoints || 0} 
                          onChange={(e) => updateEditingProduct('laborManualPoints', Number(e.target.value))}
                          placeholder="Manual labor points (0-35)"
                          min="0"
                          max="35"
                        />
                        <p className="text-xs text-muted-foreground">
                          Override labor score. Use this to manually set labor points instead of using violations/bonuses.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Labor Bonuses</Label>
                        <div className="space-y-2">
                          {['Fair Trade certified (+5)', 'B-Corp certified (+3)', 'Living wage plus (+2)'].map((bonus) => (
                            <div key={bonus} className="flex items-center space-x-2">
                              <Checkbox 
                                id={bonus}
                                checked={editingProduct.laborBonuses?.includes(bonus) || false}
                                onCheckedChange={(checked) => {
                                  const current = editingProduct.laborBonuses || [];
                                  if (checked) {
                                    updateEditingProduct('laborBonuses', [...current, bonus]);
                                  } else {
                                    updateEditingProduct('laborBonuses', current.filter(b => b !== bonus));
                                  }
                                }}
                              />
                              <Label htmlFor={bonus} className="text-sm">{bonus}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Current Labor Score</Label>
                        <div className="text-lg font-mono bg-muted/50 p-2 rounded">
                          {editingProduct.laborManualPoints !== undefined ? editingProduct.laborManualPoints : 'Auto-calculated'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {editingProduct.laborManualPoints !== undefined 
                            ? `Manually set to ${editingProduct.laborManualPoints}/35 points`
                            : 'Calculated from violations and bonuses'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ANIMAL WELFARE SCORING CRITERIA */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Animal Welfare Scoring Criteria (30 points max)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Farming Conditions</Label>
                        <Select 
                          value={editingProduct.animalWelfareConditions || 'plant-based'} 
                          onValueChange={(v) => updateEditingProduct('animalWelfareConditions', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select farming conditions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="plant-based">Plant-based/vegan (30 points)</SelectItem>
                            <SelectItem value="organic-humane">Organic + humane (25 points)</SelectItem>
                            <SelectItem value="free-range-cage-free">Free-range/cage-free (18 points)</SelectItem>
                            <SelectItem value="intensive-farming">Intensive farming (8 points)</SelectItem>
                            <SelectItem value="factory-farmed">Factory farmed (0 points)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Animal Welfare Manual Points</Label>
                        <Input 
                          type="number"
                          value={editingProduct.animalWelfareManualPoints || 0} 
                          onChange={(e) => updateEditingProduct('animalWelfareManualPoints', Number(e.target.value))}
                          placeholder="Manual animal welfare points (0-30)"
                          min="0"
                          max="30"
                        />
                        <p className="text-xs text-muted-foreground">
                          Override animal welfare score manually.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Animal Welfare Bonuses/Violations</Label>
                        <div className="space-y-2">
                          {['Certified Humane (+3)', 'Animal Welfare Approved (+3)', 'Grass-fed (+2)', 'Cruelty-free (vegan) (+2)', 'Animal testing (-15)'].map((item) => (
                            <div key={item} className="flex items-center space-x-2">
                              <Checkbox 
                                id={item}
                                checked={editingProduct.animalWelfareItems?.includes(item) || false}
                                onCheckedChange={(checked) => {
                                  const current = editingProduct.animalWelfareItems || [];
                                  if (checked) {
                                    updateEditingProduct('animalWelfareItems', [...current, item]);
                                  } else {
                                    updateEditingProduct('animalWelfareItems', current.filter(i => i !== item));
                                  }
                                }}
                              />
                              <Label htmlFor={item} className="text-sm">{item}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Current Animal Welfare Score</Label>
                        <div className="text-lg font-mono bg-muted/50 p-2 rounded">
                          {editingProduct.animalWelfareManualPoints !== undefined ? editingProduct.animalWelfareManualPoints : 'Auto-calculated'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {editingProduct.animalWelfareManualPoints !== undefined 
                            ? `Manually set to ${editingProduct.animalWelfareManualPoints}/30 points`
                            : 'Calculated from farming conditions and bonuses'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CARBON FOOTPRINT SCORING */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Carbon Footprint Scoring (20 points max)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>CO2 Emissions (kg) *</Label>
                        <Input 
                          type="number"
                          step="0.1"
                          value={editingProduct.carbonFootprint} 
                          onChange={(e) => updateEditingProduct('carbonFootprint', Number(e.target.value))}
                          placeholder="e.g., 8.5"
                        />
                        <p className="text-xs text-muted-foreground">
                          &le;0.5kg: 20pts | 0.5-2kg: 16pts | 2-5kg: 11pts | 5-10kg: 6pts | &gt;10kg: 2pts
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CERTIFICATIONS SCORING */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Certifications Scoring (10 points max)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Tier 1 (2 points each)</Label>
                        <div className="space-y-1">
                          {['B-Corp', 'Fair Trade', 'Certified Humane', 'Rainforest Alliance', 'AWA'].map((cert) => (
                            <div key={cert} className="flex items-center space-x-2">
                              <Checkbox 
                                id={cert}
                                checked={editingProduct.certifications.includes(cert)}
                                onCheckedChange={(checked) => {
                                  const current = editingProduct.certifications;
                                  if (checked) {
                                    updateEditingProduct('certifications', [...current, cert]);
                                  } else {
                                    updateEditingProduct('certifications', current.filter(c => c !== cert));
                                  }
                                }}
                              />
                              <Label htmlFor={cert} className="text-sm">{cert}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Tier 2 (1 point each)</Label>
                        <div className="space-y-1">
                          {['USDA Organic', 'EU Organic', 'Non-GMO', 'Carbon Neutral', 'Leaping Bunny'].map((cert) => (
                            <div key={cert} className="flex items-center space-x-2">
                              <Checkbox 
                                id={cert}
                                checked={editingProduct.certifications.includes(cert)}
                                onCheckedChange={(checked) => {
                                  const current = editingProduct.certifications;
                                  if (checked) {
                                    updateEditingProduct('certifications', [...current, cert]);
                                  } else {
                                    updateEditingProduct('certifications', current.filter(c => c !== cert));
                                  }
                                }}
                              />
                              <Label htmlFor={cert} className="text-sm">{cert}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Tier 3 (0.5 points each) + Bonuses</Label>
                        <div className="space-y-1">
                          {['Cage-free', 'Free-range', 'Grass-fed', 'Recyclable', 'Supply chain disclosure (+2)', 'Third-party audit (+1)', 'Sustainability report (+1)'].map((cert) => (
                            <div key={cert} className="flex items-center space-x-2">
                              <Checkbox 
                                id={cert}
                                checked={editingProduct.certifications.includes(cert)}
                                onCheckedChange={(checked) => {
                                  const current = editingProduct.certifications;
                                  if (checked) {
                                    updateEditingProduct('certifications', [...current, cert]);
                                  } else {
                                    updateEditingProduct('certifications', current.filter(c => c !== cert));
                                  }
                                }}
                              />
                              <Label htmlFor={cert} className="text-sm">{cert}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Certification Manual Points</Label>
                          <Input 
                            type="number"
                            value={editingProduct.certificationManualPoints || 0} 
                            onChange={(e) => updateEditingProduct('certificationManualPoints', Number(e.target.value))}
                            placeholder="Manual certification points (0-10)"
                            min="0"
                            max="10"
                          />
                          <p className="text-xs text-muted-foreground">
                            Override certification score manually.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Current Certification Score</Label>
                          <div className="text-lg font-mono bg-muted/50 p-2 rounded">
                            {editingProduct.certificationManualPoints !== undefined ? editingProduct.certificationManualPoints : 'Auto-calculated'}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {editingProduct.certificationManualPoints !== undefined 
                              ? `Manually set to ${editingProduct.certificationManualPoints}/10 points`
                              : 'Calculated from selected certifications'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                
                {/* Hide materials field for livestock products since they use the SimpleLivestockForm */}
                {!editingProduct.category.includes('Meat') && 
                 !editingProduct.category.includes('Dairy') && 
                 !editingProduct.category.includes('Eggs') && (
                  <div className="space-y-2">
                    <Label>Materials (comma-separated) *</Label>
                    <Input 
                      value={editingProduct.materials.join(', ')} 
                      onChange={(e) => updateEditingProduct('materials', parseArrayInput(e.target.value))}
                      placeholder="e.g., Organic Cotton, Natural Dyes"
                    />
                  </div>
                )}

                
                <div className="space-y-2">
                  <Label>Keywords (comma-separated) *</Label>
                  <Input 
                    value={editingProduct.keywords.join(', ')} 
                    onChange={(e) => updateEditingProduct('keywords', parseArrayInput(e.target.value))}
                    placeholder="e.g., shirt, tshirt, cotton, apparel"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Product Comments</Label>
                  <Textarea 
                    value={editingProduct.comments || ''} 
                    onChange={(e) => updateEditingProduct('comments', e.target.value)}
                    placeholder="Add comments that will appear on the product page..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    These comments will be displayed on the front of the product page for all users to see.
                  </p>
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
