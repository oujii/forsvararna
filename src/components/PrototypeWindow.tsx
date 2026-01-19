import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PrototypeWindowProps {
  isMinimized: boolean;
  setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  isClosed: boolean;
  setIsClosed: React.Dispatch<React.SetStateAction<boolean>>;
  isActive: boolean;
  onFocus: () => void;
}

export const PrototypeWindow: React.FC<PrototypeWindowProps> = ({
  isMinimized,
  setIsMinimized,
  isClosed,
  setIsClosed,
  isActive,
  onFocus
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const calculateWindowedDimensions = () => {
    const taskbarHeight = 48;
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight - taskbarHeight;

    const width = Math.floor(availableWidth * 0.55);
    const height = Math.floor(availableHeight * 0.55);

    const x = Math.floor((availableWidth - width) / 2);
    const y = Math.floor((availableHeight - height) / 2);

    return { x, y, width, height };
  };

  useEffect(() => {
    if (windowSize.width === 0 && windowSize.height === 0) {
      const dimensions = calculateWindowedDimensions();
      setPosition({ x: dimensions.x, y: dimensions.y });
      setWindowSize({ width: dimensions.width, height: dimensions.height });
    }
  }, [windowSize.width, windowSize.height]);

  const handleClose = () => {
    setIsClosed(true);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleWindowClick = () => {
    onFocus();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMaximized) return;

    if (e.target instanceof Element && e.target.closest("button")) {
      return;
    }

    const windowRect = windowRef.current?.getBoundingClientRect();
    if (windowRect) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - windowRect.left,
        y: e.clientY - windowRect.top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isMaximized) return;

      const taskbarHeight = 48;
      const availableWidth = window.innerWidth;
      const availableHeight = window.innerHeight - taskbarHeight;
      const windowRect = windowRef.current?.getBoundingClientRect();

      if (windowRect) {
        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;

        const maxX = availableWidth - windowRect.width;
        const maxY = availableHeight - windowRect.height;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, isMaximized]);

  if (isClosed || isMinimized) return null;

  return (
    <div
      ref={windowRef}
      className={cn(
        "flex flex-col bg-[#c7c7c7] shadow-xl border border-[#a0a0a0]",
        isMaximized ? "fixed inset-0 bottom-12" : "absolute"
      )}
      style={isMaximized ? {
        zIndex: isActive ? 45 : 30
      } : {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${windowSize.width}px`,
        height: `${windowSize.height}px`,
        resize: "both",
        overflow: "hidden",
        minWidth: "360px",
        minHeight: "240px",
        cursor: isDragging ? "grabbing" : "default",
        zIndex: isActive ? 45 : 30
      }}
      onClick={handleWindowClick}
    >
      <div
        className={`overflow-hidden shadow-md flex items-center justify-between h-10 pl-4 pr-0 bg-[#DEE1E6] border-b border-[#DEE1E6] ${!isMaximized ? "cursor-move" : ""}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center">
          <span className="text-xs text-gray-700">Nytt program</span>
        </div>
        <div className="flex items-center">
          <button
            className="w-[46px] h-8 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors"
            onClick={handleMinimize}
            aria-label="Minimize"
          >
            <svg width="10" height="10" viewBox="0 0 10.2 1" fill="black">
              <rect x="0" y="0" width="10.2" height="1"></rect>
            </svg>
          </button>
          <button
            className="w-[46px] h-8 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors"
            onClick={toggleMaximize}
            aria-label="Maximize"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="black">
              <path d="M0,0v10h10V0H0z M9,9H1V1h8V9z"></path>
            </svg>
          </button>
          <button
            className="group w-[46px] h-8 flex items-center justify-center hover:bg-red-600 active:bg-red-400 transition-colors"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10.2 10.2"
              className="fill-black group-hover:fill-white"
            >
              <polygon points="10.2,0.7 9.5,0 5.1,4.4 0.7,0 0,0.7 4.4,5.1 0,9.5 0.7,10.2 5.1,5.8 9.5,10.2 10.2,9.5 5.8,5.1"></polygon>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#bfbfbf] p-6">
        <div className="w-full h-full bg-[#d0d0d0] border border-[#a6a6a6] flex items-center justify-center text-lg text-gray-700">
          hello world
        </div>
      </div>
    </div>
  );
};
