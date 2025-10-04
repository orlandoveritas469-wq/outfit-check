/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloudIcon } from './icons';
import { Compare } from './ui/compare';
import { generateModelImage } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage } from '../lib/utils';

interface StartScreenProps {
  onModelFinalized: (originalUrl: string, generatedUrl: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized }) => {
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setUserImageUrl(dataUrl);
        setIsGenerating(true);
        setGeneratedModelUrl(null);
        setError(null);
        try {
            const result = await generateModelImage(file);
            setGeneratedModelUrl(result);
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Failed to create model'));
            setUserImageUrl(null);
        } finally {
            setIsGenerating(false);
        }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleProceed = () => {
    if (userImageUrl && generatedModelUrl) {
      onModelFinalized(userImageUrl, generatedModelUrl);
    }
  };

  const reset = () => {
    setUserImageUrl(null);
    setGeneratedModelUrl(null);
    setIsGenerating(false);
    setError(null);
  };

  const screenVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
        <AnimatePresence mode="wait">
        {!userImageUrl ? (
            <motion.div
            key="uploader"
            className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 min-h-screen relative z-10"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
            >
            <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="max-w-lg">
                  <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                    <div className="bg-gradient-to-r from-primary to-amber-500 px-4 py-1 rounded-full">
                      <span className="font-bold text-primary-foreground">CHECK AI</span>
                    </div>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-black text-foreground tracking-tighter uppercase">
                      Virtual Try-On Studio
                  </h1>
                  <p className="mt-4 text-lg text-muted-foreground">
                      Ever wondered how an outfit would look on you? Stop guessing. Upload a photo and see for yourself. Our AI creates your personal model, ready to try on anything.
                  </p>
                  <div className="flex flex-col items-center lg:items-start w-full gap-4 mt-8">
                      <label htmlFor="image-upload-start" className="w-full sm:w-auto relative flex items-center justify-center px-8 py-4 text-base font-bold text-primary-foreground bg-gradient-to-r from-primary to-amber-500 rounded-xl cursor-pointer transition-all duration-300 ease-in-out hover:shadow-[0_0_20px_rgba(255,107,0,0.7)] hover:scale-105">
                        <UploadCloudIcon className="w-5 h-5 mr-3" />
                        Upload Full-Body Photo
                      </label>
                      <input id="image-upload-start" type="file" className="hidden" accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" onChange={handleFileChange} />
                      <p className="text-muted-foreground text-sm">Select a clear, well-lit photo for best results.</p>
                      <p className="text-gray-600 text-xs mt-1">By uploading, you agree not to create harmful, explicit, or unlawful content. This service is for creative and responsible use only.</p>
                      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                  </div>
                </div>
            </div>
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
                <Compare
                firstImage="https://i.imghippo.com/files/Wade4056eg.png"
                secondImage="https://i.imghippo.com/files/Itp5448AfU.webp"
                slideMode="drag"
                className="w-full max-w-sm aspect-[2/3] rounded-3xl bg-surface border-2 border-border"
                />
            </div>
            </motion.div>
        ) : (
            <motion.div
            key="compare"
            className="w-full max-w-6xl mx-auto h-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 min-h-screen relative z-10"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
            >
            <div className="md:w-1/2 flex-shrink-0 flex flex-col items-center md:items-start">
                <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-black text-foreground leading-tight tracking-tighter uppercase">
                    Your Personal Model
                </h1>
                <p className="mt-2 text-md text-muted-foreground">
                    Drag the slider to see your AI-powered transformation.
                </p>
                </div>
                
                {isGenerating && (
                <div className="flex items-center gap-3 text-lg text-foreground font-semibold mt-6">
                    <Spinner />
                    <span>Generating your model...</span>
                </div>
                )}

                {error && 
                <div className="text-center md:text-left text-red-400 max-w-md mt-6">
                    <p className="font-semibold">Generation Failed</p>
                    <p className="text-sm mb-4">{error}</p>
                    <button onClick={reset} className="text-sm font-semibold text-foreground hover:underline">Try Again</button>
                </div>
                }
                
                <AnimatePresence>
                {generatedModelUrl && !isGenerating && !error && (
                    <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-center gap-4 mt-8"
                    >
                    <button 
                        onClick={reset}
                        className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-foreground bg-panel rounded-xl cursor-pointer hover:bg-border transition-colors"
                    >
                        Use Different Photo
                    </button>
                    <button 
                        onClick={handleProceed}
                        className="w-full sm:w-auto relative inline-flex items-center justify-center px-8 py-3 text-base font-bold text-primary-foreground bg-gradient-to-r from-primary to-amber-500 rounded-xl cursor-pointer transition-all duration-300 ease-in-out hover:shadow-[0_0_20px_rgba(255,107,0,0.7)] hover:scale-105"
                    >
                        Proceed to Styling &rarr;
                    </button>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
            <div className="md:w-1/2 w-full flex items-center justify-center">
                <div 
                className={`relative rounded-3xl transition-all duration-700 ease-in-out border-2 ${isGenerating ? 'border-border animate-pulse' : 'border-transparent'}`}
                >
                <Compare
                    firstImage={userImageUrl}
                    secondImage={generatedModelUrl ?? userImageUrl}
                    slideMode="drag"
                    className="w-[280px] h-[420px] sm:w-[320px] sm:h-[480px] lg:w-[400px] lg:h-[600px] rounded-3xl bg-surface"
                />
                </div>
            </div>
            </motion.div>
        )}
        </AnimatePresence>
    </div>
  );
};

export default StartScreen;