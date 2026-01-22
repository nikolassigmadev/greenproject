import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface SimpleLivestockData {
  animalSpace: 'excellent' | 'good' | 'poor' | 'terrible';
  animalExecution: 'humane' | 'standard' | 'inhumane';
  animalDiet: 'natural' | 'organic' | 'conventional' | 'processed';
}

interface SimpleLivestockFormProps {
  category: string;
  livestockData: SimpleLivestockData;
  onChange: (data: SimpleLivestockData) => void;
}

const animalSpaceOptions = [
  { value: 'excellent', label: 'Excellent', description: 'Ample space, natural environment' },
  { value: 'good', label: 'Good', description: 'Adequate space, outdoor access' },
  { value: 'poor', label: 'Poor', description: 'Limited space, confinement' },
  { value: 'terrible', label: 'Terrible', description: 'Overcrowded, no space' },
];

const animalExecutionOptions = [
  { value: 'humane', label: 'Humane', description: 'Certified humane practices' },
  { value: 'standard', label: 'Standard', description: 'Conventional methods' },
  { value: 'inhumane', label: 'Inhumane', description: 'Poor welfare practices' },
];

const animalDietOptions = [
  { value: 'natural', label: 'Natural', description: 'Species-appropriate diet' },
  { value: 'organic', label: 'Organic', description: 'Organic certified feed' },
  { value: 'conventional', label: 'Conventional', description: 'Standard commercial feed' },
  { value: 'processed', label: 'Processed', description: 'Industrial processed feed' },
];

export function SimpleLivestockForm({ category, livestockData, onChange }: SimpleLivestockFormProps) {
  const isLivestock = category.includes('Meat') || category.includes('Dairy') || category.includes('Eggs');
  
  if (!isLivestock) {
    return null;
  }

  const updateField = (field: keyof SimpleLivestockData, value: any) => {
    onChange({ ...livestockData, [field]: value });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Animal Welfare Details</CardTitle>
        <p className="text-sm text-muted-foreground">
          These factors impact the sustainability score based on animal welfare standards.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Animal Space */}
        <div className="space-y-2">
          <Label>Animal Space *</Label>
          <Select value={livestockData.animalSpace} onValueChange={(value) => updateField('animalSpace', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select animal space" />
            </SelectTrigger>
            <SelectContent>
              {animalSpaceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Animal Execution */}
        <div className="space-y-2">
          <Label>Animal Execution *</Label>
          <Select value={livestockData.animalExecution} onValueChange={(value) => updateField('animalExecution', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select animal execution" />
            </SelectTrigger>
            <SelectContent>
              {animalExecutionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Animal Diet */}
        <div className="space-y-2">
          <Label>Animal Diet *</Label>
          <Select value={livestockData.animalDiet} onValueChange={(value) => updateField('animalDiet', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select animal diet" />
            </SelectTrigger>
            <SelectContent>
              {animalDietOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
