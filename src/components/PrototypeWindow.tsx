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
  const [availableBounds, setAvailableBounds] = useState({ width: 0, height: 0 });

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

  useEffect(() => {
    const updateBounds = () => {
      const taskbarHeight = 48;
      setAvailableBounds({
        width: window.innerWidth,
        height: window.innerHeight - taskbarHeight
      });
    };

    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, []);

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

  useEffect(() => {
    const handleWindowResize = () => {
      if (isMaximized || !windowRef.current) return;

      const taskbarHeight = 48;
      const availableWidth = window.innerWidth;
      const availableHeight = window.innerHeight - taskbarHeight;
      const windowRect = windowRef.current.getBoundingClientRect();

      let newX = position.x;
      let newY = position.y;

      if (position.x + windowRect.width > availableWidth) {
        newX = Math.max(0, availableWidth - windowRect.width);
      }
      if (position.y + windowRect.height > availableHeight) {
        newY = Math.max(0, availableHeight - windowRect.height);
      }

      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY });
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [position, isMaximized]);

  if (isClosed || isMinimized) return null;

  return (
    <div
      ref={windowRef}
      className={cn(
        "flex flex-col bg-[#c7c7c7] shadow-xl border border-[#a0a0a0]",
        isMaximized ? "fixed inset-0" : "absolute"
      )}
      style={isMaximized ? {
        zIndex: isActive ? 45 : 30,
        bottom: "48px",
        height: "calc(100vh - 48px)"
      } : {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${windowSize.width}px`,
        height: `${windowSize.height}px`,
        maxWidth: availableBounds.width ? `${availableBounds.width}px` : undefined,
        maxHeight: availableBounds.height ? `${availableBounds.height}px` : undefined,
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
        className={`shrink-0 z-10 overflow-hidden shadow-md flex items-center justify-between h-10 pl-4 pr-0 bg-[#dfe3ea] border-b border-[#b8bcc2] ${!isMaximized ? "cursor-move" : ""}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center">
          <span className="text-xs font-medium text-gray-700">GPS-spårning</span>
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

      <div className="flex-1 bg-[#d7d7d7] flex flex-col">
        <div className="h-8 bg-[#efefef] border-b border-[#c7c7c7] flex items-center px-3 text-xs text-gray-700 shrink-0">
          <button className="px-2 py-1 hover:bg-[#dedede] rounded">Översikt</button>
          <button className="px-2 py-1 hover:bg-[#dedede] rounded">Karta</button>
          <button className="px-2 py-1 hover:bg-[#dedede] rounded">Enheter</button>
          <button className="px-2 py-1 hover:bg-[#dedede] rounded">Händelser</button>
          <button className="px-2 py-1 hover:bg-[#dedede] rounded">Rapporter</button>
          <button className="px-2 py-1 hover:bg-[#dedede] rounded">Verktyg</button>
          <button className="px-2 py-1 hover:bg-[#dedede] rounded">Hjälp</button>
          <div className="ml-auto text-[11px] text-gray-600">
            Enhet: GPS-4471 · Operatör: N. Eklund
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 bg-[#f2f2f2] border-r border-[#c7c7c7] flex flex-col">
            <div className="p-3 border-b border-[#d2d2d2] text-xs text-gray-700">
              <div className="font-semibold">Märkta enheter</div>
              <div className="text-[11px] text-gray-500">Aktiva: 3 · Passiva: 1</div>
            </div>
            <div className="flex-1 overflow-auto text-xs">
              <div className="px-3 py-2 border-b border-[#e3e3e3] bg-white">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">GPS-4471</span>
                  <span className="text-[10px] text-green-700">AKTIV</span>
                </div>
                <div className="text-[11px] text-gray-500">Senast fix: 16:34</div>
                <div className="text-[11px] text-gray-500">Kyndelsö · 59.3921, 19.7364</div>
              </div>
              <div className="px-3 py-2 border-b border-[#e3e3e3] hover:bg-[#ededed]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">GPS-4428</span>
                  <span className="text-[10px] text-green-700">AKTIV</span>
                </div>
                <div className="text-[11px] text-gray-500">Senast fix: 16:29</div>
                <div className="text-[11px] text-gray-500">Utö · 58.9662, 18.7635</div>
              </div>
              <div className="px-3 py-2 border-b border-[#e3e3e3] hover:bg-[#ededed]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">GPS-4310</span>
                  <span className="text-[10px] text-green-700">AKTIV</span>
                </div>
                <div className="text-[11px] text-gray-500">Senast fix: 16:11</div>
                <div className="text-[11px] text-gray-500">Möja · 59.4370, 18.8882</div>
              </div>
              <div className="px-3 py-2 hover:bg-[#ededed]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">GPS-4199</span>
                  <span className="text-[10px] text-gray-500">PASSIV</span>
                </div>
                <div className="text-[11px] text-gray-500">Senast fix: 12:05</div>
                <div className="text-[11px] text-gray-500">Norrtälje · 59.7584, 18.7047</div>
              </div>
            </div>
            <div className="p-3 border-t border-[#d2d2d2] text-[11px] text-gray-600">
              Filter: Skärgård · Klassning: Intern
            </div>
          </div>

          <div className="flex-1 bg-[#dcdcdc] border-r border-[#c7c7c7] flex flex-col">
            <div className="h-9 bg-[#f7f7f7] border-b border-[#d2d2d2] flex items-center px-3 text-xs text-gray-700">
              <div className="flex items-center gap-3">
                <span className="font-semibold">Karta</span>
                <span className="text-[11px] text-gray-500">Lager: Kustlinje · Skala 1:50 000</span>
              </div>
              <div className="ml-auto text-[11px] text-gray-500">Koordinater: 59.3921, 19.7364</div>
            </div>
            <div className="relative flex-1 bg-[#cfcfcf] overflow-hidden">
              <img
                src="/kyndelso-map.png"
                alt="Karta över Kyndelsö"
                className="w-full h-full object-contain"
              />
              <div
                className="absolute"
                style={{ top: "46%", left: "54%" }}
              >
                <div className="w-20 h-20 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500/30 border border-blue-500/60 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-blue-700"></div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 bg-white/80 border border-[#bdbdbd] text-[10px] text-gray-700 px-2 py-1">
                Kyndelsö · GPS-4471 · Fix 16:34:12
              </div>
            </div>
          </div>

          <div className="w-72 bg-[#f2f2f2] flex flex-col">
            <div className="p-3 border-b border-[#d2d2d2] text-xs text-gray-700">
              <div className="font-semibold">Enhetsdetaljer</div>
              <div className="text-[11px] text-gray-500">Vald: GPS-4471</div>
            </div>
            <div className="flex-1 overflow-auto text-xs">
              <div className="p-3 border-b border-[#e3e3e3]">
                <div className="text-[11px] text-gray-500">Status</div>
                <div className="font-semibold text-green-700">AKTIV · Sändning pågår</div>
              </div>
              <div className="p-3 border-b border-[#e3e3e3]">
                <div className="text-[11px] text-gray-500">Senaste position</div>
                <div className="font-semibold">Kyndelsö, Norrtälje kommun</div>
                <div className="text-[11px] text-gray-600">Lat 59.3921 · Lon 19.7364</div>
                <div className="text-[11px] text-gray-600">Noggrannhet: ±12 m</div>
              </div>
              <div className="p-3 border-b border-[#e3e3e3]">
                <div className="text-[11px] text-gray-500">Rörelse</div>
                <div className="text-[11px] text-gray-600">Hastighet: 0.4 kn</div>
                <div className="text-[11px] text-gray-600">Riktning: 082°</div>
                <div className="text-[11px] text-gray-600">Stillastående: 00:18:42</div>
              </div>
              <div className="p-3 border-b border-[#e3e3e3]">
                <div className="text-[11px] text-gray-500">Batteri / signal</div>
                <div className="text-[11px] text-gray-600">Batteri: 74%</div>
                <div className="text-[11px] text-gray-600">Signal: 4/5</div>
                <div className="text-[11px] text-gray-600">Senaste ping: 16:34:12</div>
              </div>
              <div className="p-3">
                <div className="text-[11px] text-gray-500">Koppling</div>
                <div className="text-[11px] text-gray-600">Ärende: 24-18342</div>
                <div className="text-[11px] text-gray-600">Ägare: POU Nord</div>
                <div className="text-[11px] text-gray-600">Prioritet: Hög</div>
              </div>
            </div>
            <div className="p-3 border-t border-[#d2d2d2] text-[11px] text-gray-600">
              <div>Senast uppdaterad: 16:34:12</div>
              <div>GPS-signal: Aktiv</div>
            </div>
          </div>
        </div>

        <div className="h-6 bg-[#efefef] border-t border-[#c7c7c7] px-3 flex items-center text-[11px] text-gray-700">
          Status: Online · Kryptering: TLS 1.2 · Version 2.8.4 · Driftläge: Live
        </div>
      </div>
    </div>
  );
};
