/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { OutfitLayer } from '../types';
import { Trash2Icon } from './icons';

interface OutfitStackProps {
  outfitHistory: OutfitLayer[];
  onRemoveLastGarment: () => void;
}

const OutfitStack: React.FC<OutfitStackProps> = ({ outfitHistory, onRemoveLastGarment }) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-bold tracking-wide text-foreground border-b border-border pb-2 mb-4">Outfit Stack</h2>
      <div className="space-y-2">
        {outfitHistory.map((layer, index) => (
          <div
            key={layer.garment?.id || 'base'}
            className="flex items-center justify-between bg-panel p-2 rounded-xl animate-fade-in border border-border"
          >
            <div className="flex items-center overflow-hidden">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 mr-3 text-xs font-bold text-muted-foreground bg-surface rounded-full">
                  {index + 1}
                </span>
                {layer.garment && (
                    <img src={layer.garment.url} alt={layer.garment.name} className="flex-shrink-0 w-12 h-12 object-cover rounded-md mr-3" />
                )}
                <span className="font-semibold text-foreground truncate" title={layer.garment?.name}>
                  {layer.garment ? layer.garment.name : 'Base Model'}
                </span>
            </div>
            {index > 0 && index === outfitHistory.length - 1 && (
               <button
                onClick={onRemoveLastGarment}
                className="flex-shrink-0 text-muted-foreground hover:text-red-400 transition-colors p-2 rounded-md hover:bg-red-900/50"
                aria-label={`Remove ${layer.garment?.name}`}
              >
                <Trash2Icon className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        {outfitHistory.length === 1 && (
            <p className="text-center text-sm text-muted-foreground pt-4">Your stacked items will appear here. Select an item from the wardrobe below.</p>
        )}
      </div>
    </div>
  );
};

export default OutfitStack;