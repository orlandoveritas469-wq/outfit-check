/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import type { WardrobeItem, GarmentCategory } from '../types';
import { UploadCloudIcon, CheckCircleIcon } from './icons';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
}

const CATEGORIES: GarmentCategory[] = ['shirt', 'outerwear', 'pants', 'shoes', 'hat'];
const CATEGORY_DISPLAY: Record<GarmentCategory, string> = {
  shirt: 'Shirts',
  outerwear: 'Outerwear',
  pants: 'Pants',
  shoes: 'Shoes',
  hat: 'Hats',
};

// Helper to convert image URL to a File object using a canvas to bypass potential CORS issues.
const urlToFile = (url: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            ctx.drawImage(image, 0, 0);

            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas toBlob failed.'));
                }
                const mimeType = blob.type || 'image/png';
                const file = new File([blob], filename, { type: mimeType });
                resolve(file);
            }, 'image/png');
        };

        image.onerror = (error) => {
            reject(new Error(`Could not load image from URL for canvas conversion. Error: ${error}`));
        };

        image.src = url;
    });
};

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, activeGarmentIds, isLoading, wardrobe }) => {
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<GarmentCategory | 'all'>('all');

    const handleGarmentClick = async (item: WardrobeItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;
        setError(null);
        try {
            const file = await urlToFile(item.url, item.name);
            onGarmentSelect(file, item);
        } catch (err) {
            const detailedError = `Failed to load wardrobe item. This is often a CORS issue. Check the developer console for details.`;
            setError(detailedError);
            console.error(`[CORS Check] Failed to load and convert wardrobe item from URL: ${item.url}. The browser's console should have a specific CORS error message if that's the issue.`, err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            // Assign the category based on the currently selected tab. Default to 'shirt' if 'All' is selected.
            const categoryForUpload: GarmentCategory = selectedCategory === 'all' ? 'shirt' : selectedCategory;
            const customGarmentInfo: WardrobeItem = {
                id: `custom-${Date.now()}`,
                name: file.name,
                url: URL.createObjectURL(file),
                category: categoryForUpload,
            };
            onGarmentSelect(file, customGarmentInfo);
        }
    };
    
    const filteredWardrobe = useMemo(() => {
        if (selectedCategory === 'all') return wardrobe;
        return wardrobe.filter(item => item.category === selectedCategory);
    }, [wardrobe, selectedCategory]);

  return (
    <div className="pt-6 border-t border-border">
        <h2 className="text-xl font-bold tracking-wide text-foreground mb-4">Wardrobe</h2>
        
        <div className="flex space-x-1 mb-4 overflow-x-auto pb-2 -mx-1 px-1" role="tablist" aria-label="Wardrobe categories">
            <button
              onClick={() => setSelectedCategory('all')}
              role="tab"
              aria-selected={selectedCategory === 'all'}
              className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground hover:bg-panel'}`}
            >
              All
            </button>
            {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  role="tab"
                  aria-selected={selectedCategory === category}
                  className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${selectedCategory === category ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground hover:bg-panel'}`}
                >
                    {CATEGORY_DISPLAY[category]}
                </button>
            ))}
        </div>
        
        <div className="grid grid-cols-3 gap-3">
            {filteredWardrobe.map((item) => {
            const isActive = activeGarmentIds.includes(item.id);
            return (
                <button
                key={item.id}
                onClick={() => handleGarmentClick(item)}
                disabled={isLoading || isActive}
                className="relative aspect-square border border-border rounded-xl overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary group disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label={`Select ${item.name}`}
                >
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                </div>
                {isActive && (
                    <div className="absolute inset-0 bg-primary/70 flex items-center justify-center backdrop-blur-sm">
                        <CheckCircleIcon className="w-8 h-8 text-primary-foreground" />
                    </div>
                )}
                </button>
            );
            })}
            <label htmlFor="custom-garment-upload" className={`relative aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground transition-colors ${isLoading ? 'cursor-not-allowed bg-surface' : 'hover:border-gray-600 hover:text-gray-300 cursor-pointer'}`}>
                <UploadCloudIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs text-center px-1">Upload Item</span>
                <input id="custom-garment-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} disabled={isLoading}/>
            </label>
        </div>
         {filteredWardrobe.length === 0 && wardrobe.length > 0 && selectedCategory !== 'all' && (
            <p className="text-center text-sm text-muted-foreground mt-4">No items in this category. Try 'All' or upload an item.</p>
        )}
        {wardrobe.length === 0 && (
             <p className="text-center text-sm text-muted-foreground mt-4">Your uploaded garments will appear here.</p>
        )}
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
    </div>
  );
};

export default WardrobePanel;