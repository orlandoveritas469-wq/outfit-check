/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobeModal';
import OutfitStack from './components/OutfitStack';
import { generateVirtualTryOnImage, generatePoseVariation } from './services/geminiService';
import { OutfitLayer, WardrobeItem } from './types';
import { ChevronDownIcon, ChevronUpIcon } from './components/icons';
import { defaultWardrobe } from './wardrobe';
import Footer from './components/Footer';
import { getFriendlyErrorMessage } from './lib/utils';
import Spinner from './components/Spinner';
import ShareModal from './components/ShareModal';

const POSE_INSTRUCTIONS = [
  // Standard & Classic
  "Full frontal view, hands on hips",
  "Slightly turned, 3/4 view",
  "Side profile view",
  "Back view, looking over shoulder",
  "Leaning against a neutral wall",

  // Walking & Action
  "Walking towards camera, in mid-stride",
  "Jumping in the air, joyful expression",
  "Twirling, capturing fabric motion",
  "Striding confidently, runway walk",
  "A dynamic action pose, mid-movement",

  // Sitting & Relaxed
  "Sitting casually on a modern stool",
  "Lounging gracefully on a chaise lounge",
  "Sitting on the floor, cross-legged",
  "Leaning forward, hands on knees",
  "Crouching, athletic stance",

  // Expressive & Editorial
  "Confident power pose, one hand in pocket",
  "Playful pose, hands in hair",
  "Hands framing face, high-fashion look",
  "Looking up, hopeful expression",
  "Arms crossed, serious and direct look",
];

interface HistoryState {
  outfitHistory: OutfitLayer[];
  currentOutfitIndex: number;
  currentPoseIndex: number;
}

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQueryList.addEventListener('change', listener);
    
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};


const App: React.FC = () => {
  const [originalUserImageUrl, setOriginalUserImageUrl] = useState<string | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const currentState = useMemo(() => history[historyIndex], [history, historyIndex]);
  const outfitHistory = currentState?.outfitHistory ?? [];
  const currentOutfitIndex = currentState?.currentOutfitIndex ?? 0;
  const currentPoseIndex = currentState?.currentPoseIndex ?? 0;

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const activeOutfitLayers = useMemo(() => 
    outfitHistory.slice(0, currentOutfitIndex + 1), 
    [outfitHistory, currentOutfitIndex]
  );
  
  const activeGarmentIds = useMemo(() => 
    activeOutfitLayers.map(layer => layer.garment?.id).filter(Boolean) as string[], 
    [activeOutfitLayers]
  );
  
  const displayImageUrl = useMemo(() => {
    if (outfitHistory.length === 0) return generatedModelUrl;
    const currentLayer = outfitHistory[currentOutfitIndex];
    if (!currentLayer) return generatedModelUrl;

    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    return currentLayer.poseImages[poseInstruction] ?? Object.values(currentLayer.poseImages)[0];
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, generatedModelUrl]);

  const availablePoseKeys = useMemo(() => {
    if (outfitHistory.length === 0) return [];
    const currentLayer = outfitHistory[currentOutfitIndex];
    return currentLayer ? Object.keys(currentLayer.poseImages) : [];
  }, [outfitHistory, currentOutfitIndex]);

  const recordNewState = useCallback((newState: HistoryState) => {
    const newHistory = [...history.slice(0, historyIndex + 1), newState];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleModelFinalized = (originalUrl: string, generatedUrl: string) => {
    setOriginalUserImageUrl(originalUrl);
    setGeneratedModelUrl(generatedUrl);
    const initialState: HistoryState = {
      outfitHistory: [{
        garment: null,
        poseImages: { [POSE_INSTRUCTIONS[0]]: generatedUrl }
      }],
      currentOutfitIndex: 0,
      currentPoseIndex: 0,
    };
    setHistory([initialState]);
    setHistoryIndex(0);
  };

  const handleStartOver = () => {
    setOriginalUserImageUrl(null);
    setGeneratedModelUrl(null);
    setHistory([]);
    setHistoryIndex(-1);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setIsSheetCollapsed(false);
    setWardrobe(defaultWardrobe);
  };

  const handleShare = () => setIsShareModalOpen(true);
  const handleCloseShareModal = () => setIsShareModalOpen(false);


  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(i => i - 1);
    }
  }, [canUndo]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(i => i + 1);
    }
  }, [canRedo]);


  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!generatedModelUrl || isLoading || !currentState) return;

    // This handles re-applying a garment from later in the history stack, which is a "redo" action.
    const nextLayer = outfitHistory[currentOutfitIndex + 1];
    if (nextLayer && nextLayer.garment?.id === garmentInfo.id) {
        recordNewState({
          ...currentState,
          currentOutfitIndex: currentOutfitIndex + 1,
          currentPoseIndex: 0,
        });
        return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Adding ${garmentInfo.name}...`);

    try {
      const activeLayers = outfitHistory.slice(0, currentOutfitIndex + 1);
      
      // Find if a garment of the same category already exists in the active stack.
      const existingLayerIndex = activeLayers.findIndex(
          (layer) => layer.garment?.category === garmentInfo.category
      );

      // Determine the base history and image for the generation.
      // If replacing, we build from the layer *before* the one being replaced.
      // If adding, we build from the current top layer.
      const baseHistorySlice = (existingLayerIndex !== -1 && existingLayerIndex > 0)
          ? outfitHistory.slice(0, existingLayerIndex)
          : activeLayers;

      const baseLayer = baseHistorySlice[baseHistorySlice.length - 1];
      if (!baseLayer) throw new Error("Could not find a base layer for generation.");
      
      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
      const baseImageForGeneration = baseLayer.poseImages[currentPoseInstruction] ?? Object.values(baseLayer.poseImages)[0];

      if (!baseImageForGeneration) throw new Error("Could not find a base image for generation.");
      
      // Generate the new image with the selected garment.
      const newImageUrl = await generateVirtualTryOnImage(baseImageForGeneration, garmentFile, garmentInfo.category);
      
      const newLayer: OutfitLayer = { 
        garment: garmentInfo, 
        poseImages: { [currentPoseInstruction]: newImageUrl } 
      };

      // Create the new history state. Any layers after a replacement are discarded.
      const updatedOutfitHistory = [...baseHistorySlice, newLayer];
      
      recordNewState({
        outfitHistory: updatedOutfitHistory,
        currentOutfitIndex: updatedOutfitHistory.length - 1,
        currentPoseIndex: currentPoseIndex,
      });
      
      // Add new custom garments to the wardrobe state so they appear in the panel.
      setWardrobe(prev => {
        if (prev.find(item => item.id === garmentInfo.id)) {
            return prev;
        }
        return [...prev, garmentInfo];
      });

    // Fix: Use the default `unknown` type for the catch clause variable, which is correctly handled by `getFriendlyErrorMessage`.
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to apply garment'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [generatedModelUrl, isLoading, currentState, outfitHistory, currentOutfitIndex, currentPoseIndex, recordNewState]);


  const handleRemoveLastGarment = () => {
    if (currentOutfitIndex > 0 && currentState) {
      recordNewState({
        ...currentState,
        currentOutfitIndex: currentOutfitIndex - 1,
        currentPoseIndex: 0,
      });
    }
  };
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex || !currentState) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = outfitHistory[currentOutfitIndex];

    if (currentLayer.poseImages[poseInstruction]) {
      recordNewState({
        ...currentState,
        currentPoseIndex: newIndex,
      });
      return;
    }

    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0];
    if (!baseImageForPoseChange) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Changing pose...`);
    
    try {
      const newImageUrl = await generatePoseVariation(baseImageForPoseChange, poseInstruction);
      const newOutfitHistory = outfitHistory.map((layer, index) => {
        if (index === currentOutfitIndex) {
          return {
            ...layer,
            poseImages: {
              ...layer.poseImages,
              [poseInstruction]: newImageUrl,
            }
          };
        }
        return layer;
      });

      recordNewState({
        ...currentState,
        outfitHistory: newOutfitHistory,
        currentPoseIndex: newIndex,
      });
    // Fix: Use the default `unknown` type for the catch clause variable, which is correctly handled by `getFriendlyErrorMessage`.
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to change pose'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentPoseIndex, outfitHistory, isLoading, currentOutfitIndex, currentState, recordNewState]);

  const viewVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="font-sans bg-background text-foreground">
      <AnimatePresence mode="wait">
        {!generatedModelUrl ? (
          <motion.div
            key="start-screen"
            className="w-screen min-h-screen flex items-start sm:items-center justify-center p-4 pb-20"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <StartScreen onModelFinalized={handleModelFinalized} />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-screen bg-background overflow-hidden"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
              <div className="w-full h-full flex-grow flex items-center justify-center pb-16 relative">
                <Canvas 
                  displayImageUrl={displayImageUrl}
                  onStartOver={handleStartOver}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handlePoseSelect}
                  poseInstructions={POSE_INSTRUCTIONS}
                  currentPoseIndex={currentPoseIndex}
                  availablePoseKeys={availablePoseKeys}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onShare={handleShare}
                />
              </div>

              <aside 
                className={`absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm bg-surface/80 backdrop-blur-md flex flex-col border-t md:border-t-0 md:border-l border-border transition-transform duration-500 ease-in-out ${isSheetCollapsed ? 'translate-y-[calc(100%-4.5rem)]' : 'translate-y-0'} md:translate-y-0`}
                style={{ transitionProperty: 'transform' }}
              >
                  <button 
                    onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} 
                    className="md:hidden w-full h-8 flex items-center justify-center bg-surface/50"
                    aria-label={isSheetCollapsed ? 'Expand panel' : 'Collapse panel'}
                  >
                    {isSheetCollapsed ? <ChevronUpIcon className="w-6 h-6 text-muted-foreground" /> : <ChevronDownIcon className="w-6 h-6 text-muted-foreground" />}
                  </button>
                  <div className="p-4 md:p-6 pb-20 overflow-y-auto flex-grow flex flex-col gap-8">
                    {error && (
                      <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-4 mb-4 rounded-xl" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                      </div>
                    )}
                    <OutfitStack 
                      outfitHistory={activeOutfitLayers}
                      onRemoveLastGarment={handleRemoveLastGarment}
                    />
                    <WardrobePanel
                      onGarmentSelect={handleGarmentSelect}
                      activeGarmentIds={activeGarmentIds}
                      isLoading={isLoading}
                      wardrobe={wardrobe}
                    />
                  </div>
              </aside>
            </main>
            <AnimatePresence>
              {isLoading && isMobile && (
                <motion.div
                  className="fixed inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Spinner />
                  {loadingMessage && (
                    <p className="text-lg font-bold text-foreground mt-4 text-center px-4">{loadingMessage}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer isOnDressingScreen={!!generatedModelUrl} />
      <AnimatePresence>
        {isShareModalOpen && originalUserImageUrl && displayImageUrl && (
          <ShareModal
            originalImage={originalUserImageUrl}
            finalImage={displayImageUrl}
            onClose={handleCloseShareModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;