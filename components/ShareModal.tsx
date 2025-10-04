/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { XIcon, DownloadIcon } from './icons';
import Spinner from './Spinner';

interface ShareModalProps {
  originalImage: string;
  finalImage: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ originalImage, finalImage, onClose }) => {
  const [shareableImageUrl, setShareableImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateImage = async () => {
      setIsLoading(true);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) {
        setIsLoading(false);
        return;
      }

      const canvasWidth = 1200;
      const canvasHeight = 675; // 16:9 aspect ratio
      const padding = 60;
      const innerWidth = canvasWidth - padding * 2;
      const imageWidth = (innerWidth - padding) / 2;
      const imageHeight = canvasHeight - padding * 2;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Background
      ctx.fillStyle = '#101118';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Title
      ctx.fillStyle = '#F0F0F0';
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('My Virtual Try-On', canvasWidth / 2, padding + 10);


      const beforeImg = new Image();
      const afterImg = new Image();
      beforeImg.crossOrigin = 'anonymous';
      afterImg.crossOrigin = 'anonymous';

      const beforePromise = new Promise((resolve, reject) => {
        beforeImg.onload = resolve;
        beforeImg.onerror = reject;
      });
      const afterPromise = new Promise((resolve, reject) => {
        afterImg.onload = resolve;
        afterImg.onerror = reject;
      });

      beforeImg.src = originalImage;
      afterImg.src = finalImage;

      try {
        await Promise.all([beforePromise, afterPromise]);
      } catch (error) {
        console.error("Failed to load images for sharing:", error);
        setIsLoading(false);
        return;
      }
      
      // Function to draw image centered and scaled
      const drawImageToFit = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
        const imgAspectRatio = img.width / img.height;
        const containerAspectRatio = w / h;
        let drawWidth = w;
        let drawHeight = h;

        if (imgAspectRatio > containerAspectRatio) {
          drawHeight = w / imgAspectRatio;
        } else {
          drawWidth = h * imgAspectRatio;
        }

        const drawX = x + (w - drawWidth) / 2;
        const drawY = y + (h - drawHeight) / 2;
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      };

      // Draw "Before"
      ctx.fillStyle = '#d1d5db';
      ctx.font = '24px Inter, sans-serif';
      ctx.textAlign = 'center';
      const beforeX = padding + imageWidth / 2;
      const imageY = padding + 80;
      ctx.fillText('Before', beforeX, imageY - 20);
      drawImageToFit(beforeImg, padding, imageY, imageWidth, imageHeight - 80);

      // Draw "After"
      const afterX = padding + imageWidth + padding + imageWidth / 2;
      ctx.fillText('After', afterX, imageY - 20);
      drawImageToFit(afterImg, padding + imageWidth + padding, imageY, imageWidth, imageHeight - 80);
      
      // Footer
      ctx.fillStyle = '#FF6B00';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Powered by Gemini', canvasWidth - padding, canvasHeight - padding / 2);

      setShareableImageUrl(canvas.toDataURL('image/png'));
      setIsLoading(false);
    };

    generateImage();
  }, [originalImage, finalImage]);

  const handleDownload = () => {
    if (!shareableImageUrl) return;
    const link = document.createElement('a');
    link.href = shareableImageUrl;
    link.download = 'virtual-try-on-outfit.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-surface rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-border"
      >
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-2xl font-bold tracking-wide text-foreground">Share Your Outfit</h2>
          <button onClick={onClose} className="p-1 rounded-full text-muted-foreground hover:bg-panel hover:text-foreground transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto flex items-center justify-center bg-background rounded-b-2xl">
          {isLoading && (
            <div className="flex flex-col items-center gap-4 text-center">
              <Spinner />
              <p className="text-lg font-bold text-foreground">Generating shareable image...</p>
            </div>
          )}
          {!isLoading && shareableImageUrl && (
            <img 
              src={shareableImageUrl} 
              alt="Shareable outfit comparison" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-md" 
            />
          )}
        </div>
        <div className="p-4 border-t border-border bg-surface rounded-b-2xl flex justify-end">
          <button
            onClick={handleDownload}
            disabled={isLoading || !shareableImageUrl}
            className="flex items-center justify-center text-center bg-gradient-to-r from-primary to-amber-500 text-primary-foreground font-bold py-3 px-6 rounded-xl transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_rgba(255,107,0,0.6)] active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon className="w-5 h-5 mr-2" />
            Download Image
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ShareModal;