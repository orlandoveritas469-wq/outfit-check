/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { RotateCcwIcon, ChevronLeftIcon, ChevronRightIcon, UndoIcon, RedoIcon, ShareIcon } from './icons';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (index: number) => void;
  poseInstructions: string[];
  currentPoseIndex: number;
  availablePoseKeys: string[];
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onShare: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ 
  displayImageUrl, 
  onStartOver, 
  isLoading, 
  loadingMessage, 
  onSelectPose, 
  poseInstructions, 
  currentPoseIndex, 
  availablePoseKeys,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onShare,
}) => {
  const [isPoseMenuOpen, setIsPoseMenuOpen] = useState(false);
  
  const handlePreviousPose = () => {
    if (isLoading || availablePoseKeys.length <= 1) return;

    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);
    
    // Fallback if current pose not in available list (shouldn't happen)
    if (currentIndexInAvailable === -1) {
        onSelectPose((currentPoseIndex - 1 + poseInstructions.length) % poseInstructions.length);
        return;
    }

    const prevIndexInAvailable = (currentIndexInAvailable - 1 + availablePoseKeys.length) % availablePoseKeys.length;
    const prevPoseInstruction = availablePoseKeys[prevIndexInAvailable];
    const newGlobalPoseIndex = poseInstructions.indexOf(prevPoseInstruction);
    
    if (newGlobalPoseIndex !== -1) {
        onSelectPose(newGlobalPoseIndex);
    }
  };

  const handleNextPose = () => {
    if (isLoading) return;

    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);

    // Fallback or if there are no generated poses yet
    if (currentIndexInAvailable === -1 || availablePoseKeys.length === 0) {
        onSelectPose((currentPoseIndex + 1) % poseInstructions.length);
        return;
    }
    
    const nextIndexInAvailable = currentIndexInAvailable + 1;
    if (nextIndexInAvailable < availablePoseKeys.length) {
        // There is another generated pose, navigate to it
        const nextPoseInstruction = availablePoseKeys[nextIndexInAvailable];
        const newGlobalPoseIndex = poseInstructions.indexOf(nextPoseInstruction);
        if (newGlobalPoseIndex !== -1) {
            onSelectPose(newGlobalPoseIndex);
        }
    } else {
        // At the end of generated poses, generate the next one from the master list
        const newGlobalPoseIndex = (currentPoseIndex + 1) % poseInstructions.length;
        onSelectPose(newGlobalPoseIndex);
    }
  };
  
  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative animate-zoom-in group">
      {/* Top Controls */}
      <div className="absolute top-4 left-4 z-30 flex items-center space-x-2">
        <button 
            onClick={onStartOver}
            className="flex items-center justify-center text-center bg-panel/60 border border-border text-foreground font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-panel hover:border-gray-600 active:scale-95 text-sm backdrop-blur-sm"
        >
            <RotateCcwIcon className="w-4 h-4 mr-2" />
            Start Over
        </button>
         <div className="flex items-center bg-panel/60 border border-border rounded-full backdrop-blur-sm shadow-sm">
            <button 
                onClick={onUndo} 
                disabled={!canUndo} 
                aria-label="Undo"
                className="p-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-panel/80 rounded-l-full transition-colors"
            >
                <UndoIcon className="w-4 h-4 text-foreground" />
            </button>
            <div className="w-px h-4 bg-border"></div>
            <button 
                onClick={onRedo} 
                disabled={!canRedo} 
                aria-label="Redo"
                className="p-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-panel/80 rounded-r-full transition-colors"
            >
                <RedoIcon className="w-4 h-4 text-foreground" />
            </button>
        </div>
      </div>

       {/* Share Button */}
      <div className="absolute top-4 right-4 z-30">
        <button 
            onClick={onShare}
            className="flex items-center justify-center text-center bg-gradient-to-r from-primary to-amber-500 text-primary-foreground font-bold py-2 px-4 rounded-full transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_rgba(255,107,0,0.6)] active:scale-95 text-sm"
        >
            <ShareIcon className="w-4 h-4 mr-2" />
            Share
        </button>
      </div>
      

      {/* Image Display or Placeholder */}
      <div className="relative w-full h-full flex items-center justify-center">
        {displayImageUrl ? (
          <img
            key={displayImageUrl} // Use key to force re-render and trigger animation on image change
            src={displayImageUrl}
            alt="Virtual try-on model"
            className="max-w-full max-h-full object-contain transition-opacity duration-500 animate-fade-in rounded-lg"
          />
        ) : (
            <div className="w-[400px] h-[600px] bg-surface border border-border rounded-lg flex flex-col items-center justify-center">
              <Spinner />
              <p className="text-md font-semibold text-muted-foreground mt-4">Loading Model...</p>
            </div>
        )}
        
        <AnimatePresence>
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg"
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
      </div>

      {/* Pose Controls */}
      {displayImageUrl && !isLoading && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onMouseEnter={() => setIsPoseMenuOpen(true)}
          onMouseLeave={() => setIsPoseMenuOpen(false)}
        >
          {/* Pose popover menu */}
          <AnimatePresence>
              {isPoseMenuOpen && (
                  <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute bottom-full mb-3 w-64 bg-surface/80 backdrop-blur-lg rounded-xl p-2 border border-border"
                  >
                      <div className="grid grid-cols-2 gap-2">
                          {poseInstructions.map((pose, index) => (
                              <button
                                  key={pose}
                                  onClick={() => onSelectPose(index)}
                                  disabled={isLoading || index === currentPoseIndex}
                                  className="w-full text-left text-sm font-medium text-foreground p-2 rounded-lg hover:bg-panel/70 disabled:opacity-50 disabled:bg-panel/70 disabled:font-bold disabled:cursor-not-allowed"
                              >
                                  {pose}
                              </button>
                          ))}
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>
          
          <div className="flex items-center justify-center gap-2 bg-panel/80 backdrop-blur-md rounded-full p-2 border border-border">
            <button 
              onClick={handlePreviousPose}
              aria-label="Previous pose"
              className="p-2 rounded-full hover:bg-surface active:scale-90 transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              <ChevronLeftIcon className="w-5 h-5 text-foreground" />
            </button>
            <span className="text-sm font-semibold text-foreground w-48 text-center truncate" title={poseInstructions[currentPoseIndex]}>
              {poseInstructions[currentPoseIndex]}
            </span>
            <button 
              onClick={handleNextPose}
              aria-label="Next pose"
              className="p-2 rounded-full hover:bg-surface active:scale-90 transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              <ChevronRightIcon className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;