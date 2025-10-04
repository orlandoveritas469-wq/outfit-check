/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type GarmentCategory = 'shirt' | 'outerwear' | 'pants' | 'shoes' | 'hat';

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
  category: GarmentCategory;
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  poseImages: Record<string, string>; // Maps pose instruction to image URL
}
