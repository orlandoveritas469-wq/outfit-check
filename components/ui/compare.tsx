/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { SparklesCore } from "./sparkles";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
 
interface CompareProps {
  firstImage?: string;
  secondImage?: string;
  className?: string;
  firstImageClassName?: string;
  secondImageClassname?: string;
  initialSliderPercentage?: number;
  slideMode?: "hover" | "drag";
  showHandlebar?: boolean;
  autoplay?: boolean;
  autoplayDuration?: number;
}
export const Compare = ({
  firstImage = "",
  secondImage = "",
  className,
  firstImageClassName,
  secondImageClassname,
  initialSliderPercentage = 50,
  slideMode = "hover",
  showHandlebar = true,
  autoplay = false,
  autoplayDuration = 5000,
}: CompareProps) => {
  const [sliderXPercent, setSliderXPercent] = useState(initialSliderPercentage);
  const [isDragging, setIsDragging] = useState(false);
 
  const sliderRef = useRef<HTMLDivElement>(null);
 
  const [isMouseOver, setIsMouseOver] = useState(false);
 
  // FIX: Use ReturnType<typeof setTimeout> for browser compatibility instead of NodeJS.Timeout
  const autoplayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 
  const startAutoplay = useCallback(() => {
    if (!autoplay) return;
 
    const startTime = Date.now();
    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const progress =
        (elapsedTime % (autoplayDuration * 2)) / autoplayDuration;
      const percentage = progress <= 1 ? progress * 100 : (2 - progress) * 100;
 
      setSliderXPercent(percentage);
      autoplayRef.current = setTimeout(animate, 16); // ~60fps
    };
 
    animate();
  }, [autoplay, autoplayDuration]);
 
  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearTimeout(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);
 
  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [startAutoplay, stopAutoplay]);
 
  function mouseEnterHandler() {
    setIsMouseOver(true);
    stopAutoplay();
  }
 
  function mouseLeaveHandler() {
    setIsMouseOver(false);
    if (slideMode === "hover") {
      setSliderXPercent(initialSliderPercentage);
    }
    if (slideMode === "drag") {
      setIsDragging(false);
    }
    startAutoplay();
  }
 
  const handleStart = useCallback(
    (clientX: number) => {
      if (slideMode === "drag") {
        setIsDragging(true);
      }
    },
    [slideMode]
  );
 
  const handleEnd = useCallback(() => {
    if (slideMode === "drag") {
      setIsDragging(false);
    }
  }, [slideMode]);
 
  const handleMove = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      if (slideMode === "hover" || (slideMode === "drag" && isDragging)) {
        const rect = sliderRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = (x / rect.width) * 100;
        requestAnimationFrame(() => {
          setSliderXPercent(Math.max(0, Math.min(100, percent)));
        });
      }
    },
    [slideMode, isDragging]
  );
 
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => handleStart(e.clientX),
    [handleStart]
  );
  const handleMouseUp = useCallback(() => handleEnd(), [handleEnd]);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => handleMove(e.clientX),
    [handleMove]
  );
 
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!autoplay) {
        handleStart(e.touches[0].clientX);
      }
    },
    [handleStart, autoplay]
  );
 
  const handleTouchEnd = useCallback(() => {
    if (!autoplay) {
      handleEnd();
    }
  }, [handleEnd, autoplay]);
 
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!autoplay) {
        handleMove(e.touches[0].clientX);
      }
    },
    [handleMove, autoplay]
  );
 
  return (
    <div
      ref={sliderRef}
      className={cn("w-[400px] h-[400px] overflow-hidden rounded-3xl", className)}
      style={{
        position: "relative",
        cursor: slideMode === "drag" ? (isDragging ? "grabbing" : "grab") : "col-resize",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={mouseLeaveHandler}
      onMouseEnter={mouseEnterHandler}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <AnimatePresence initial={false}>
        <motion.div
          className="h-full w-1 absolute top-0 m-auto z-30 bg-white/50"
          style={{
            left: `${sliderXPercent}%`,
            top: "0",
            zIndex: 40,
          }}
          transition={{ duration: 0 }}
        >
          {showHandlebar && (
            <div className="h-10 w-10 rounded-full top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-amber-500 z-30 -left-1/2 -translate-x-1/2 absolute flex items-center justify-center border-2 border-white/80 shadow-xl">
              <ChevronLeftIcon className="w-5 h-5 text-white" />
              <ChevronRightIcon className="w-5 h-5 text-white" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="overflow-hidden w-full h-full relative z-20 pointer-events-none">
        <AnimatePresence initial={false}>
          {firstImage ? (
            <motion.div
              className={cn(
                "absolute inset-0 z-20 shrink-0 w-full h-full select-none overflow-hidden",
                firstImageClassName
              )}
              style={{
                clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)`,
              }}
              transition={{ duration: 0 }}
            >
              <img
                alt="first image"
                src={firstImage}
                className={cn(
                  "absolute inset-0 z-20 shrink-0 w-full h-full select-none object-cover",
                  firstImageClassName
                )}
                draggable={false}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
 
      <AnimatePresence initial={false}>
        {secondImage ? (
          <motion.img
            className={cn(
              "absolute top-0 left-0 z-[19] w-full h-full select-none object-cover",
              secondImageClassname
            )}
            alt="second image"
            src={secondImage}
            draggable={false}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};
 
const MemoizedSparklesCore = React.memo(SparklesCore);