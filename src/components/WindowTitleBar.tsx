import React from 'react';

interface WindowTitleBarProps {
  title: string;
  isActive?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  isMainWindow?: boolean;
  isFullscreen?: boolean;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  isChatWindow?: boolean; // New prop to distinguish chat windows
  isMailWindow?: boolean; // New prop to distinguish mail window
}

const WindowTitleBar: React.FC<WindowTitleBarProps> = ({
  title = "ResCueX",
  isActive = true,
  onClose,
  onMinimize,
  onMaximize,
  isMainWindow = false,
  isFullscreen = false,
  onMouseDown,
  isChatWindow = false,
  isMailWindow = false
}) => {
  // Determine icon color based on window type
  const iconColor = isChatWindow ? "white" : "black";
  const handleMaximizeClick = () => {
    // Use the onMaximize prop instead of browser fullscreen
    if (onMaximize) {
      onMaximize();
    }
  };

  if (isMainWindow) {
    // Chat window variant - clean titlebar without tabs
    if (isChatWindow) {
      return (
        <div
          className={`overflow-hidden shadow-md flex items-center justify-between h-10 pl-4 pr-0 bg-[#2d2d30] border-b border-[#3e3e42] ${!isFullscreen ? 'cursor-move' : ''}`}
          style={{ marginBottom: '-3px' }} // Added negative margin-bottom
          onMouseDown={onMouseDown}
        >
          <div className="flex items-center">
            {isMailWindow ? (
              // Mail icon
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            ) : (
              // CryptChat icon (new blue icon)
              <img src="/icon_app(blue).svg" alt="CryptChat" className="w-4 h-4 mr-2" />
            )}
            <span className="text-white text-sm font-normal">
              {title}
            </span>
          </div>
          <div className="flex items-center">
            <button
              className="w-[46px] h-8 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors"
              onClick={onMinimize}
              aria-label="Minimize"
            >
              <svg width="10" height="10" viewBox="0 0 10.2 1" fill={iconColor}>
                <rect x="0" y="0" width="10.2" height="1"></rect>
              </svg>
            </button>
            <button
              className="w-[46px] h-8 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors"
              onClick={handleMaximizeClick}
              aria-label="Maximize"
            >
              {/* Maximize icon (single square) - always shown */}
              <svg width="10" height="10" viewBox="0 0 10 10" fill={iconColor}>
                <path d="M0,0v10h10V0H0z M9,9H1V1h8V9z"></path>
              </svg>
            </button>
            <button
              className="w-[46px] h-8 flex items-center justify-center hover:bg-red-600 active:bg-red-400 transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <svg width="10" height="10" viewBox="0 0 10.2 10.2" fill={iconColor}>
                <polygon points="10.2,0.7 9.5,0 5.1,4.4 0.7,0 0,0.7 4.4,5.1 0,9.5 0.7,10.2 5.1,5.8 9.5,10.2 10.2,9.5 5.8,5.1"></polygon>
              </svg>
            </button>
          </div>
        </div>
      );
    }

    // Browser window variant - with tabs and complex layout
    return (
      <div
        className={`overflow-hidden shadow-md flex items-center justify-between h-10 pl-4 pr-0 bg-[#DEE1E6] border-b border-[#DEE1E6] ${!isFullscreen ? 'cursor-move' : ''}`}
        style={{ marginBottom: '-3px' }} // Added negative margin-bottom
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center">
          <span className="text-white text-sm font-normal">
          <div className="flex items-center -ml-4" style={{ marginBottom: '-4px', backgroundColor: 'white' }}>

  <img src="../left.png" alt="Left S" className="bg-white h-9 pr-1"  object-contain/>

<img src="/aftonbladet/aftonbladet.png" alt="Aftonbladet" className="bg-white w-4 h-4 my-2.5" />
  <button className="bg-white h-9 pl-2 pb-1.5 pr-6 text-xs rounded-none text-gray-600">
    {title}
  </button>
  <div className="bg-white  h-9 text-gray-700 text-xl cursor-pointer">&times;</div>

  <img src="../right.png" alt="Right S" className="h-9" object-contain />
  <div className="bg-[#DEE1E6] -ml-0.5 -mt-1 h-9 text-gray-500 text-2xl cursor-pointer">+</div>
</div>


          </span>
        </div>
        <div className="flex items-center">
          <button 
            className="w-[46px] h-8 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors" 
            onClick={onMinimize}
            aria-label="Minimize"
          >
            <svg width="10" height="10" viewBox="0 0 10.2 1" fill={iconColor}>
              <rect x="0" y="0" width="10.2" height="1"></rect>
            </svg>
          </button>
          <button
            className="w-[46px] h-8 flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors"
            onClick={handleMaximizeClick}
            aria-label="Maximize"
          >
            {/* Maximize icon (single square) - always shown */}
            <svg width="10" height="10" viewBox="0 0 10 10" fill={iconColor}>
              <path d="M0,0v10h10V0H0z M9,9H1V1h8V9z"></path>
            </svg>
          </button>
          <button 
            className="w-[46px] h-8 flex items-center justify-center hover:bg-red-600 active:bg-red-400 transition-colors" 
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10.2 10.2" fill={iconColor}>
              <polygon points="10.2,0.7 9.5,0 5.1,4.4 0.7,0 0,0.7 4.4,5.1 0,9.5 0.7,10.2 5.1,5.8 9.5,10.2 10.2,9.5 5.8,5.1"></polygon>
            </svg>
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center justify-between h-6 px-2 ${isActive ? 'bg-[#333333]' : 'bg-[#E1E1E1]'} border-b border-[#aaaaaa]`}>
      <div className="flex items-center">
        <span className={`text-xs font-normal ${isActive ? 'text-white' : 'text-black'}`}>
          {title}
        </span>
      </div>
      <button 
        className={`w-6 h-6 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors rounded-sm`} 
        onClick={onClose}
        aria-label="Close"
      >
        <svg width="8" height="8" viewBox="0 0 10.2 10.2" fill={isActive ? "white" : "black"}>
          <polygon points="10.2,0.7 9.5,0 5.1,4.4 0.7,0 0,0.7 4.4,5.1 0,9.5 0.7,10.2 5.1,5.8 9.5,10.2 10.2,9.5 5.8,5.1"></polygon>
        </svg>
      </button>
    </div>
  );
};

export default WindowTitleBar;
