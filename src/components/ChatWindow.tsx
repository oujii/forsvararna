import React, { useState, useRef, useEffect, useCallback } from "react";
import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import WindowTitleBar from "./WindowTitleBar";

// Define props interface
interface ChatWindowProps {
  isMinimized: boolean;
  setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  isClosed: boolean;
  setIsClosed: React.Dispatch<React.SetStateAction<boolean>>;
  isActive: boolean;
  onFocus: () => void;
  isScriptedSequenceActive?: boolean;
  setIsScriptedSequenceActive?: React.Dispatch<React.SetStateAction<boolean>>;
  systemDateTime: Date;
  onOpenBrowser?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  isMinimized,
  setIsMinimized,
  isClosed,
  setIsClosed,
  isActive,
  onFocus,
  isScriptedSequenceActive = false,
  setIsScriptedSequenceActive,
  systemDateTime,
  onOpenBrowser
}) => {
  const [isMaximized, setIsMaximized] = useState(false); // Start windowed
  const [message, setMessage] = useState("");
  const windowRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Scripted conversation state
  const [messages, setMessages] = useState<Array<{id: number, sender: 'Thomas' | 'Max', text: string}>>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isWaitingForUserInput, setIsWaitingForUserInput] = useState(false);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [forcedText, setForcedText] = useState('');
  const [forcedTextIndex, setForcedTextIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Scripted conversation sequence - Silvia & Kardell
  const conversationScript = [
    { type: 'user_input', expectedText: 'Hej, jag behöver hjälp med en lur. Återställa sms och samtalslistor. Gärna asap.', delay: 0 }, // User starts
    { type: 'thomas', text: 'Pysslar du inte med trädgårdsarbete på heltid nuförtiden?', delay: 5500 },
    { type: 'user_input', expectedText: 'Jag? Aldrig.', delay: 0 },
    { type: 'thomas', text: 'Vems lur?', delay: 3000 },
    { type: 'user_input', expectedText: 'Jag hjälper en väninna. Hennes mans lur. Du vet.', delay: 0 },
    { type: 'thomas', text: 'svin.', delay: 3000 },
    { type: 'user_input', expectedText: 'Hur snabbt kan du få fram?', delay: 0 },
    { type: 'thomas', text: 'Skicka så börjar jag direkt.', delay: 4700 },
    { type: 'user_input', expectedText: 'Tack!', delay: 0 },
    { type: 'file_attachment_user', delay: 1000 }, // User sends file
    { type: 'pause', delay: 1000 }, // Time gap
    { type: 'user_input', expectedText: 'Hur ligger du till?', delay: 0 },
    { type: 'thomas', text: 'Max två tim', delay: 4300 },
    { type: 'pause', delay: 10000 }, // Another time gap
    { type: 'thomas', text: 'Ok. Här är allt jag har lyckats återställa. Hoppas det hjälper din väninna.', delay: 0 },
    { type: 'file_attachment_thomas', delay: 2000 } // Kardell sends Adam.txt file
  ];
  
  // Windowed mode state
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Will be calculated on first render
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 }); // Will be calculated on first render
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Calculate default windowed size and position
  const calculateWindowedDimensions = () => {
    const taskbarHeight = 48; // Height of taskbar (h-12 = 48px)
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight - taskbarHeight;

    // Larger size for chat window
    const width = Math.floor(availableWidth * 0.6); // 60% width (increased from 40%)
    const height = Math.floor(availableHeight * 0.7); // 70% height (increased from 60%)

    // Position offset from browser window
    const x = Math.floor(availableWidth * 0.15); // Start more to the left (was 0.5)
    const y = Math.floor((availableHeight - height) / 4); // Start higher up

    return { x, y, width, height };
  };

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to add a message to the conversation
  const addMessage = useCallback((sender: 'Thomas' | 'Max', text: string) => {
    const newMessage = {
      id: Date.now(),
      sender,
      text
    };
    setMessages(prev => [...prev, newMessage]);
    // Auto-scroll to bottom after adding message
    setTimeout(scrollToBottom, 100);
  }, []);



  // Initialize windowed dimensions on first render
  useEffect(() => {
    if (windowSize.width === 0 && windowSize.height === 0) {
      const dimensions = calculateWindowedDimensions();
      setPosition({ x: dimensions.x, y: dimensions.y });
      setWindowSize({ width: dimensions.width, height: dimensions.height });
    }
  }, [windowSize.width, windowSize.height]);

  // Focus input when window becomes active and not minimized
  useEffect(() => {
    if (isActive && !isMinimized && inputRef.current) {
      // Small delay to ensure the window is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isActive, isMinimized]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    // Actually close the window (not just minimize)
    setIsClosed(true);
    setIsMinimized(false); // Reset minimize state when closing
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging in windowed mode and on the titlebar
    if (isMaximized || !e.target || !(e.target instanceof Element)) return;
    
    // Prevent dragging when clicking buttons or other interactive elements
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('svg')) {
      return;
    }

    setIsDragging(true);
    const windowRect = windowRef.current?.getBoundingClientRect();

    if (windowRect) {
      setDragOffset({
        x: e.clientX - windowRect.left,
        y: e.clientY - windowRect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isMaximized) return;

    const taskbarHeight = 48;
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight - taskbarHeight;
    const windowRect = windowRef.current?.getBoundingClientRect();

    if (windowRect) {
      // Calculate new position
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Constrain to viewport boundaries
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

  // Set up event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Handle window resize to keep window within bounds
  useEffect(() => {
    const handleWindowResize = () => {
      if (!isMaximized && windowRef.current) {
        const taskbarHeight = 48;
        const availableWidth = window.innerWidth;
        const availableHeight = window.innerHeight - taskbarHeight;
        const windowRect = windowRef.current.getBoundingClientRect();

        // Ensure window doesn't go off-screen
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
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [position, isMaximized]);

  // Effect to start scripted sequence when activated
  useEffect(() => {
    if (isScriptedSequenceActive) {
      // Reset everything immediately when sequence starts
      setMessages([]);
      setCurrentStep(0);
      setIsWaitingForUserInput(false);
      setForcedText('');
      setForcedTextIndex(0);
      setMessage('');
      setShowFileDialog(false);

      // Start with first step (user input) after reset is complete
      setTimeout(() => {
        setCurrentStep(0);
        setTimeout(scrollToBottom, 100);
      }, 50);
    }
  }, [isScriptedSequenceActive]);

  // Effect to handle step progression
  useEffect(() => {
    if (isScriptedSequenceActive && !isNavigating && currentStep >= 0 && currentStep < conversationScript.length) {
      const currentScriptStep = conversationScript[currentStep];

      if (currentScriptStep.type === 'thomas') {
        const timeoutId = setTimeout(() => {
          addMessage('Thomas', currentScriptStep.text);
          setCurrentStep(prev => prev + 1);
        }, currentScriptStep.delay);
        timeoutRefs.current.push(timeoutId);
      } else if (currentScriptStep.type === 'user_input') {
        setIsWaitingForUserInput(true);
        setForcedText(currentScriptStep.expectedText);
        setForcedTextIndex(0);
        setMessage(''); // Clear input
      } else if (currentScriptStep.type === 'file_attachment') {
        setIsWaitingForUserInput(false);
      } else if (currentScriptStep.type === 'file_attachment_thomas') {
        // Kardell sends Adam.pdf file
        const timeoutId = setTimeout(() => {
          addMessage('Thomas', 'ATTACHMENT:adam.pdf');
          setCurrentStep(prev => prev + 1);
        }, currentScriptStep.delay);
        timeoutRefs.current.push(timeoutId);
      } else if (currentScriptStep.type === 'file_attachment_user') {
        // Wait for user to click paperclip - don't send automatically
        // The paperclip button will handle the file dialog and sending
        setIsWaitingForUserInput(false);
      } else if (currentScriptStep.type === 'pause') {
        // Just wait and continue
        const timeoutId = setTimeout(() => {
          setCurrentStep(prev => prev + 1);
        }, currentScriptStep.delay);
        timeoutRefs.current.push(timeoutId);
      }
    }
  }, [currentStep, isScriptedSequenceActive, addMessage]);

  // Handle input change with forced typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isScriptedSequenceActive && isWaitingForUserInput && forcedText) {
      // In forced typing mode, advance one character for each keystroke
      if (forcedTextIndex < forcedText.length) {
        const nextIndex = forcedTextIndex + 1;
        setForcedTextIndex(nextIndex);
        setMessage(forcedText.substring(0, nextIndex));
      }
    } else {
      // Normal typing mode
      setMessage(e.target.value);
    }
  };

  const handleSendMessage = () => {
    if (isScriptedSequenceActive && isWaitingForUserInput) {
      // If we've navigated backward, trim messages array first
      if (visibleMessageCount < messages.length) {
        setMessages(prev => prev.slice(0, visibleMessageCount));
      }

      // In scripted mode, send the expected text regardless of what user typed
      const currentScriptStep = conversationScript[currentStep];
      if (currentScriptStep && currentScriptStep.type === 'user_input') {
        addMessage('Max', currentScriptStep.expectedText);
        setMessage("");
        setIsWaitingForUserInput(false);
        setForcedText('');
        setForcedTextIndex(0);
        setCurrentStep(prev => prev + 1);

        // Re-enable automatic flow after user input
        setIsNavigating(false);
      }
    } else if (message.trim()) {
      // Normal chat mode
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleWindowClick = () => {
    onFocus(); // Bring this window to front
  };

  // Bulletproof navigation using message visibility filter (doesn't touch currentStep)
  const [visibleMessageCount, setVisibleMessageCount] = useState(0);

  // Keep visibleMessageCount in sync with messages when new ones are added
  useEffect(() => {
    setVisibleMessageCount(messages.length);
  }, [messages.length]);

  const handleStepBackward = () => {
    // Cancel all pending timeouts
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    setIsNavigating(true); // Stop automatic script flow

    const newVisibleCount = Math.max(0, visibleMessageCount - 1);
    setVisibleMessageCount(newVisibleCount);

    // Sync currentStep with navigation position
    setCurrentStep(newVisibleCount);

    // Check if next step after current position is user_input
    const nextStep = conversationScript[newVisibleCount];
    if (nextStep?.type === 'user_input') {
      // Activate forced typing for the next message
      setIsWaitingForUserInput(true);
      setForcedText(nextStep.expectedText);
      setForcedTextIndex(0);
      setMessage('');
    } else {
      // Disable forced typing
      setIsWaitingForUserInput(false);
      setForcedText('');
      setForcedTextIndex(0);
      setMessage('');
    }
  };

  const handleStepForward = () => {
    // Cancel all pending timeouts
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    setIsNavigating(true); // Stop automatic script flow

    const newVisibleCount = Math.min(messages.length, visibleMessageCount + 1);
    setVisibleMessageCount(newVisibleCount);

    // Sync currentStep with navigation position
    setCurrentStep(newVisibleCount);

    // Check if next step after current position is user_input
    const nextStep = conversationScript[newVisibleCount];
    if (nextStep?.type === 'user_input') {
      // Activate forced typing for the next message
      setIsWaitingForUserInput(true);
      setForcedText(nextStep.expectedText);
      setForcedTextIndex(0);
      setMessage('');
    } else {
      // Disable forced typing
      setIsWaitingForUserInput(false);
      setForcedText('');
      setForcedTextIndex(0);
      setMessage('');
    }
  };

  if (isMinimized || isClosed) return null; // Don't render if minimized or closed

  return (
    // Main container for chat window
    <div 
      ref={windowRef}
      className={cn(
        "flex flex-col bg-[#1f1f23] shadow-xl border border-[#3e3e42]", // Dark mode background
        isMaximized ? "fixed inset-0 bottom-12" : "absolute" // Adjust styling based on mode
      )}
      style={isMaximized ? { 
        zIndex: isActive ? 40 : 30 
      } : { 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        width: `${windowSize.width}px`,
        height: `${windowSize.height}px`,
        resize: "both", // Allow resizing in windowed mode
        overflow: "hidden", // Hide overflow during resize
        minWidth: "300px", // Minimum window size
        minHeight: "400px",
        cursor: isDragging ? "grabbing" : "default",
        zIndex: isActive ? 40 : 30
      }}
      onClick={handleWindowClick}
    >
      {/* Use WindowTitleBar for standard window controls */}
      <WindowTitleBar
        title="CryptChat" // Chat window title
        isMainWindow={true} // Use same style as browser window
        isChatWindow={true} // Use clean chat variant without tabs
        isFullscreen={isMaximized}
        isActive={isActive}
        onClose={handleClose}
        onMinimize={handleMinimize}
        onMaximize={toggleMaximize}
        onMouseDown={handleMouseDown} // Add dragging support
      />

      {/* Chat Content Area - Three column layout */}
      <div className={`flex-1 flex overflow-hidden ${!isMaximized ? '' : ''}`}>

        {/* Far Left Sidebar - Vertical Icons */}
        <div className="w-12 bg-[#2d2d30] border-[#3e3e42] flex flex-col items-center py-4 space-y-4">
          {/* Hamburger Menu Icon */}
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 opacity-80 hover:bg-[#404040] rounded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

        

          {/* Phone Icon (Filled) */}
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 opacity-80 hover:bg-[#404040] rounded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>

          {/* Spacer to push bottom icons down */}
          <div className="flex-1"></div>

          {/* Trash Icon */}
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 opacity-80 hover:bg-[#404040] rounded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0 0 1 2 2V6"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>

          {/* Settings Icon */}
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 opacity-80 hover:bg-[#404040] rounded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>

        {/* Middle Sidebar - Contact List */}
        <div className="w-80 bg-[#252526] border-r border-[#3e3e42] flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#3e3e42]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-white">Chattar</h2>
              <div className="flex items-center space-x-2">
                <button className="p-1 hover:bg-[#404040] rounded">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button className="p-1 hover:bg-[#404040] rounded">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="#ffffff" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Sök eller starta en ny chatt"
                className="w-full pl-10 pr-3 py-2 bg-[#3c3c3c] border border-[#5a5a5a] rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#0078d4]"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {/* Contact Items */}
            <div className="p-2 space-y-1">
              <div className="flex items-center p-3 bg-[#404040] hover:bg-[#4a4a4a] rounded cursor-pointer">
                <div className="w-10 h-10 bg-[#6a6a6a] rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                  K
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-white truncate">Kardell</div>
                    <div className="text-xs text-gray-400">20/06/2025</div>
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {messages.length > 0 ? messages[messages.length - 1].text : ' '}
                  </div>
                </div>
              </div>

              <div className="flex items-center p-3 hover:bg-[#4a4a4a] rounded cursor-pointer">
                <div className="w-10 h-10 rounded-full mr-3 overflow-hidden">
                  <img src="/1.jpg" alt="Mark" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-white truncate">Mark</div>
                    <div className="text-xs text-gray-400">12/06/2025</div>
                  </div>
                  <div className="text-xs text-gray-400 truncate">Ta hand om dig!</div>
                </div>
              </div>

              <div className="flex items-center p-3 hover:bg-[#4a4a4a] rounded cursor-pointer">
                <div className="w-10 h-10 bg-[#6a6a6a] rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                  D
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-white truncate">DempaB</div>
                    <div className="text-xs text-gray-400">10/06/2025</div>
                  </div>
                  <div className="text-xs text-gray-400 truncate">Jaha? 😅</div>
                </div>
              </div>

              <div className="flex items-center p-3 hover:bg-[#4a4a4a] rounded cursor-pointer">
                <div className="w-10 h-10 rounded-full mr-3 overflow-hidden">
                  <img src="/3.jpg" alt="Rutberg" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-white truncate">Rutberg</div>
                    <div className="text-xs text-gray-400">07/06/2025</div>
                  </div>
                  <div className="text-xs text-gray-400 truncate">Jag är riktigt dålig på MK</div>
                </div>
              </div>

              

              <div className="flex items-center p-3 hover:bg-[#4a4a4a] rounded cursor-pointer">
                <div className="w-10 h-10 bg-[#6a6a6a] rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                  NS
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-white truncate">Nina Skoglund</div>
                    <div className="text-xs text-gray-400">06/06/2025</div>
                  </div>
                  <div className="text-xs text-gray-400 truncate">Skickar det direkt.</div>
                </div>
              </div>

              <div className="flex items-center p-3 hover:bg-[#4a4a4a] rounded cursor-pointer">
                <div className="w-10 h-10 rounded-full mr-3 overflow-hidden">
                  <img src="/2.jpg" alt="Holm" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-white truncate">Holm</div>
                    <div className="text-xs text-gray-400">05/06/2025</div>
                  </div>
                  <div className="text-xs text-gray-400 truncate">inte jag iallafall.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Chat Area */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#3e3e42] bg-[#2d2d30]">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#6a6a6a] rounded-full flex items-center justify-center text-white mr-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center">
                    <div className="text-md font-medium text-white">Kardell</div>
                    {/* Green dot for secure connection */}
                    <div className="w-2 h-2 bg-green-400 rounded-full ml-2" title="Säker anslutning"></div>
                  </div>
                  {/* Encryption notice */}
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="mr-1">
                      <path d="M12 13C11.6955 12.9964 11.3973 13.0862 11.1454 13.2573C10.8936 13.4284 10.7001 13.6725 10.5912 13.9568C10.4823 14.2411 10.4631 14.552 10.5361 14.8476C10.6092 15.1431 10.7711 15.4092 11 15.61V17C11 17.2652 11.1054 17.5196 11.2929 17.7071C11.4804 17.8946 11.7348 18 12 18C12.2652 18 12.5196 17.8946 12.7071 17.7071C12.8946 17.5196 13 17.2652 13 17V15.61C13.2289 15.4092 13.3908 15.1431 13.4639 14.8476C13.5369 14.552 13.5177 14.2411 13.4088 13.9568C13.2999 13.6725 13.1064 13.4284 12.8546 13.2573C12.6027 13.0862 12.3045 12.9964 12 13ZM17 9V7C17 5.67392 16.4732 4.40215 15.5355 3.46447C14.5979 2.52678 13.3261 2 12 2C10.6739 2 9.40215 2.52678 8.46447 3.46447C7.52678 4.40215 7 5.67392 7 7V9C6.20435 9 5.44129 9.31607 4.87868 9.87868C4.31607 10.4413 4 11.2044 4 12V19C4 19.7956 4.31607 20.5587 4.87868 21.1213C5.44129 21.6839 6.20435 22 7 22H17C17.7956 22 18.5587 21.6839 19.1213 21.1213C19.6839 20.5587 20 19.7956 20 19V12C20 11.2044 19.6839 10.4413 19.1213 9.87868C18.5587 9.31607 17.7956 9 17 9ZM9 7C9 6.20435 9.31607 5.44129 9.87868 4.87868C10.4413 4.31607 11.2044 4 12 4C12.7956 4 13.5587 4.31607 14.1213 4.87868C14.6839 5.44129 15 6.20435 15 7V9H9V7ZM18 19C18 19.2652 17.8946 19.5196 17.7071 19.7071C17.5196 17.8946 17.2652 20 17 20H7C6.73478 20 6.48043 19.8946 6.29289 19.7071C6.10536 19.5196 6 19.2652 6 19V12C6 11.7348 6.10536 11.4804 6.29289 11.2929C6.48043 11.1054 6.73478 11 7 11H17C17.2652 11 17.5196 11.1054 17.7071 11.2929C17.8946 11.4804 18 11.7348 18 12V19Z"/>
                    </svg>
                    End-to-end krypterad
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-[#404040] rounded" onClick={handleStepBackward}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </button>
                <button className="p-2 hover:bg-[#404040] rounded" onClick={handleStepForward}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </button>
                <button className="p-2 hover:bg-[#404040] rounded">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Encryption status message when no messages are visible */}
            {visibleMessageCount === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <div className="flex items-center justify-center mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                      <path d="M12 13C11.6955 12.9964 11.3973 13.0862 11.1454 13.2573C10.8936 13.4284 10.7001 13.6725 10.5912 13.9568C10.4823 14.2411 10.4631 14.552 10.5361 14.8476C10.6092 15.1431 10.7711 15.4092 11 15.61V17C11 17.2652 11.1054 17.5196 11.2929 17.7071C11.4804 17.8946 11.7348 18 12 18C12.2652 18 12.5196 17.8946 12.7071 17.7071C12.8946 17.5196 13 17.2652 13 17V15.61C13.2289 15.4092 13.3908 15.1431 13.4639 14.8476C13.5369 14.552 13.5177 14.2411 13.4088 13.9568C13.2999 13.6725 13.1064 13.4284 12.8546 13.2573C12.6027 13.0862 12.3045 12.9964 12 13ZM17 9V7C17 5.67392 16.4732 4.40215 15.5355 3.46447C14.5979 2.52678 13.3261 2 12 2C10.6739 2 9.40215 2.52678 8.46447 3.46447C7.52678 4.40215 7 5.67392 7 7V9C6.20435 9 5.44129 9.31607 4.87868 9.87868C4.31607 10.4413 4 11.2044 4 12V19C4 19.7956 4.31607 20.5587 4.87868 21.1213C5.44129 21.6839 6.20435 22 7 22H17C17.7956 22 18.5587 21.6839 19.1213 21.1213C19.6839 20.5587 20 19.7956 20 19V12C20 11.2044 19.6839 10.4413 19.1213 9.87868C18.5587 9.31607 17.7956 9 17 9ZM9 7C9 6.20435 9.31607 5.44129 9.87868 4.87868C10.4413 4.31607 11.2044 4 12 4C12.7956 4 13.5587 4.31607 14.1213 4.87868C14.6839 5.44129 15 6.20435 15 7V9H9V7ZM18 19C18 19.2652 17.8946 19.5196 17.7071 19.7071C17.5196 17.8946 17.2652 20 17 20H7C6.73478 20 6.48043 19.8946 6.29289 19.7071C6.10536 19.5196 6 19.2652 6 19V12C6 11.7348 6.10536 11.4804 6.29289 11.2929C6.48043 11.1054 6.73478 11 7 11H17C17.2652 11 17.5196 11.1054 17.7071 11.2929C17.8946 11.4804 18 11.7348 18 12V19Z"/>
                    </svg>
                  </div>
                  <div className="text-lg font-medium mb-2">Säker krypterad chatt</div>
                  <div className="text-sm opacity-75">End-to-end kryptering är aktiverad</div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {messages.slice(0, visibleMessageCount).map((msg, index) => {
                const visibleMessages = messages.slice(0, visibleMessageCount);
                const isLastFromSender = index === visibleMessages.length - 1 || visibleMessages[index + 1]?.sender !== msg.sender;
                const isLatestMessage = index === visibleMessages.length - 1;

                return (
                  <div key={msg.id} className={`flex ${msg.sender === 'Thomas' ? 'justify-start' : 'justify-end'} items-end gap-2`}>
                    <div className={`max-w-xs lg:max-w-md relative ${
                      msg.sender === 'Thomas'
                        ? 'bg-[#404040] text-white'
                        : 'bg-[#0A40AC] text-white'
                    } px-3 py-2 shadow-sm`}>
                      {/* Message content */}
                      <div className="flex items-end justify-between gap-3">
                        <div className="text-sm flex-1">
                          {msg.text.startsWith('ATTACHMENT:') ? (
                            <div
                              className={`flex items-center space-x-3 p-2 bg-white/10 rounded-lg border border-white/20 ${
                                msg.text === 'ATTACHMENT:adam.pdf' ? 'cursor-pointer hover:bg-white/20 transition-colors' : ''
                              }`}
                              onClick={() => {
                                if (msg.text === 'ATTACHMENT:adam.pdf' && onOpenBrowser) {
                                  onOpenBrowser();
                                }
                              }}
                            >
                              {msg.text === 'ATTACHMENT:adam.bim' ? (
                                // Windows 10 generic file icon for adam.bim
                                <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 32 32" fill="none">
                                  <rect x="6" y="4" width="20" height="24" rx="1" fill="#FFFFFF" stroke="#C7C7C7" strokeWidth="1"/>
                                  <path d="M22 4v6h4" stroke="#C7C7C7" strokeWidth="1" fill="none"/>
                                  <rect x="6" y="4" width="20" height="24" rx="1" fill="url(#gradient)" fillOpacity="0.1"/>
                                  <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#F0F0F0"/>
                                      <stop offset="100%" stopColor="#E0E0E0"/>
                                    </linearGradient>
                                  </defs>
                                </svg>
                              ) : (
                                // Document icon for adam.pdf
                                <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14,2 14,8 20,8"/>
                                  <line x1="16" y1="13" x2="8" y2="13"/>
                                  <line x1="16" y1="17" x2="8" y2="17"/>
                                  <polyline points="10,9 9,9 8,9"/>
                                </svg>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate">
                                  {msg.text.replace('ATTACHMENT:', '')}
                                </div>
                                <div className="text-xs opacity-70">
                                  {msg.text === 'ATTACHMENT:adam.pdf' ? '256 kB' : '186 kB'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            msg.text
                          )}
                        </div>

                        {/* Only show lock for last message from sender */}
                        {isLastFromSender && (
                          <div className="flex items-center flex-shrink-0">
                            {/* Lock icon for encryption */}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="opacity-70">
                              <path d="M12 13C11.6955 12.9964 11.3973 13.0862 11.1454 13.2573C10.8936 13.4284 10.7001 13.6725 10.5912 13.9568C10.4823 14.2411 10.4631 14.552 10.5361 14.8476C10.6092 15.1431 10.7711 15.4092 11 15.61V17C11 17.2652 11.1054 17.5196 11.2929 17.7071C11.4804 17.8946 11.7348 18 12 18C12.2652 18 12.5196 17.8946 12.7071 17.7071C12.8946 17.5196 13 17.2652 13 17V15.61C13.2289 15.4092 13.3908 15.1431 13.4639 14.8476C13.5369 14.552 13.5177 14.2411 13.4088 13.9568C13.2999 13.6725 13.1064 13.4284 12.8546 13.2573C12.6027 13.0862 12.3045 12.9964 12 13ZM17 9V7C17 5.67392 16.4732 4.40215 15.5355 3.46447C14.5979 2.52678 13.3261 2 12 2C10.6739 2 9.40215 2.52678 8.46447 3.46447C7.52678 4.40215 7 5.67392 7 7V9C6.20435 9 5.44129 9.31607 4.87868 9.87868C4.31607 10.4413 4 11.2044 4 12V19C4 19.7956 4.31607 20.5587 4.87868 21.1213C5.44129 21.6839 6.20435 22 7 22H17C17.7956 22 18.5587 21.6839 19.1213 21.1213C19.6839 20.5587 20 19.7956 20 19V12C20 11.2044 19.6839 10.4413 19.1213 9.87868C18.5587 9.31607 17.7956 9 17 9ZM9 7C9 6.20435 9.31607 5.44129 9.87868 4.87868C10.4413 4.31607 11.2044 4 12 4C12.7956 4 13.5587 4.31607 14.1213 4.87868C14.6839 5.44129 15 6.20435 15 7V9H9V7ZM18 19C18 19.2652 17.8946 19.5196 17.7071 19.7071C17.5196 19.8946 17.2652 20 17 20H7C6.73478 20 6.48043 19.8946 6.29289 19.7071C6.10536 19.5196 6 19.2652 6 19V12C6 11.7348 6.10536 11.4804 6.29289 11.2929C6.48043 11.1054 6.73478 11 7 11H17C17.2652 11 17.5196 11.1054 17.7071 11.2929C17.8946 11.4804 18 11.7348 18 12V19Z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subtle timestamp outside bubble for latest message only */}
                    {isLatestMessage && (
                      <div className={`text-xs text-gray-500 opacity-60 mb-1 ${msg.sender === 'Thomas' ? 'ml-2' : 'order-first mr-2'}`}>
                        Nu
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input Area */}
          <div className="border-t border-[#3e3e42] p-4 bg-[#2d2d30]">
            <div className="flex items-center space-x-2">
            
              <button
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#404040] rounded"
                onClick={() => {
                  if (isScriptedSequenceActive) {
                    const currentScriptStep = conversationScript[currentStep];
                    // Check if we're at a file attachment step (either adam.bim or adam.txt)
                    if (currentScriptStep?.type === 'file_attachment_user' || currentStep === conversationScript.length - 2) {
                      setShowFileDialog(true);
                    }
                  }
                }}
              >
                <Paperclip size={16} />
              </button>
               {/* Smiley Icon */}
              <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#404040] rounded">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <circle cx="9" cy="9" r="1" fill="currentColor"/>
                  <circle cx="15" cy="9" r="1" fill="currentColor"/> 

                </svg>
              </button>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Skicka ett krypterat meddelande..."
                  className="w-full px-3 py-2 border border-[#5a5a5a] bg-[#3c3c3c] rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#0078d4]"
                />
              </div>
             
              {/* Microphone Icon */}
              <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#404040] rounded">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Windows File Explorer Dialog */}
      {showFileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#0078d4] shadow-2xl" style={{ width: '680px', height: '400px', fontFamily: 'Segoe UI, sans-serif' }}>
            {/* Title Bar */}
            <div className="h-8 mb-1 bg-white flex items-center justify-between px-2">
              <div className="flex items-center space-x-2">
                <img src="file-explorer.png" alt="File" className="w-4 h-4" />
                <span className="text-xs">Öppna</span>
              </div>
              <button
                className="w-6 h-6 flex items-center justify-center hover:bg-red-500 hover:text-white text-1xl"
                onClick={() => setShowFileDialog(false)}
              >
                ×
              </button>
            </div>

            {/* Navigation Bar */}
            <div className="h-10 bg-[#fff] flex items-center px-2 space-x-1">
              <button className=" h-8 flex items-center justify-center">
                <img src="/open-dialog/SCR-20250806-lyuu.png"   alt="Back" className="h-6" />
              </button>
          
              <div className="flex-1 mx-2">
                <div className="flex items-center bg-white border border-gray-300 px-2 py-1 text-xs">
                  <img src="/open-dialog/SCR-20250806-lypk.png" alt="PC" className="w-4 h-4 mr-1" />

                    <img src="/open-dialog/SCR-20250806-micg.png" alt="PC" className="w-2 h-2 mr-1" />
                  <span>This PC</span>
                    <img src="/open-dialog/SCR-20250806-micg.png" alt="PC" className="w-2 h-2 mr-1 ml-1" />

                  <span>Downloads</span>
                  
                </div>
              </div>
             <div className="flex items-center justify-between bg-white border border-gray-300 px-2 py-1 text-xs w-48">
  <span className="text-gray-500">Sök i Hämtade filer</span>
  <img src="/open-dialog/SCR-20250806-lyxd.png" alt="Search" className="w-4 h-4" />
</div>
            </div>

            {/* Toolbar */}
            <div className="h-10 bg-[#f8f9fa] border-b border-b-[#F0F0F0] flex items-center px-2 relative">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-[#1F3978] ml-2">Organize</span>
                  <img src="/open-dialog/SCR-20250806-lyyh.png" alt="Dropdown" className="w-3 h-3" />
                </div>
                <span className="text-xs text-[#1F3978]">New folder</span>
              </div>
              {/*   Move this content to the maximum right START   */}
              <img src="/open-dialog/SCR-20250806-lytd.png" alt="View" className="h-5 absolute right-2 top-1/2 transform -translate-y-1/2" />
              {/*   Move this content to the maximum right END   */}
            </div>

            {/* Main Content */}
            <div className="flex h-64 overflow-hidden">
              {/* Sidebar */}
              <div className="w-70 flex-shrink-0 bg-white border-r border-[#F0F0F0] p-6">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-2 -pl-3 pb-1 hover:bg-blue-100">
                    <img src="/open-dialog/SCR-20250806-lyoi.png" alt="Favorites" className="w-4 h-4" />
                    <span>Snabbaccess</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1  pl-1  hover:bg-blue-100">
                    <img src="/open-dialog/SCR-20250806-lyou.png" alt="Desktop" className="w-4 h-4" />
                    <span>Skrivbordet</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1  pl-1 hover:bg-blue-100">
                    <img src="/open-dialog/SCR-20250806-lypk.png" alt="Downloads" className="w-4 h-4" />
                    <span>Hämtade filer</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1  pl-1 hover:bg-blue-100">
                    <img src="/open-dialog/SCR-20250806-lypv.png" alt="Documents" className="w-4 h-4" />
                    <span>Mina dokument</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1 pl-1 hover:bg-blue-100">
                    <img src="/open-dialog/SCR-20250806-lyqe.png" alt="Pictures" className="w-4 h-4" />
                    <span>Bilder</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1  pl-1 pb-3 hover:bg-blue-100">
                    <img src="/open-dialog/SCR-20250806-lyqp.png" alt="Google Drive" className="w-4 h-4" />
                    <span>Google Drive</span>
                  </div>
                  <div className="flex items-center space-x-2 -pl-3 pt-2 pb-2 hover:bg-blue-100">
                    <img src="/open-dialog/SCR-20250806-lyqz.png" alt="OneDrive" className="w-4 h-4" />
                    <span>OneDrive</span>
                  </div>
                  <div className="flex items-center space-x-2 -pl-3 pt-2 pb-2 hover:bg-blue-100">
                    <img src="/open-dialog/SCR-20250806-lyrr.png" alt="This PC" className="w-4 h-4" />
                    <span>This PC</span>
                  </div>
                  <div className="flex items-center space-x-2 -pl-3 pt-2 pb-2 hover:bg-blue-100">
                    <img src="/open-dialog/SCR-20250806-lysc.png" alt="Network" className="w-4 h-4" />
                    <span>Network</span>
                  </div>
                </div>
              </div>

              {/* File List */}
              <div className="flex-1 bg-white">
                {/* Column Headers */}
                <div className="h-8 bg-white border-b border-[#e1e1e1] flex items-center text-xs text-gray-400">
                  <div className="w-6"></div> {/* Space for icon */}
                  <div className="w-80 pl-2">Namn</div>
                  <div className="w-32">Modifierad</div>
                  <div className="w-32">Typ</div>
                </div>

                {/* File Items */}
                <div className="p-2 space-y-[0px]">
                  <div
                    className={`flex items-center py-2 cursor-pointer ${
                      selectedFile === 'adam.bim'
                        ? 'bg-[#0078d4] text-white'
                        : 'hover:bg-[#CCE8FE]'
                    }`}
                    onClick={() => setSelectedFile('adam.bim')}
                  >
                    <div className="w-6 flex justify-center">
                      <img src="/open-dialog/file.png" alt="Image" className="h-4" />
                    </div>
                    <div className="w-80 text-xs pl-2">adam.bim</div>
                    <div className={`w-32 text-xs ${selectedFile === 'adam.bim' ? 'text-white' : 'text-gray-500'}`}>4/10/2025 09:17</div>
                    <div className={`w-32 text-xs ${selectedFile === 'adam.bim' ? 'text-white' : 'text-gray-500'}`}>Binary File</div>
                  </div>
                  <div className="flex items-center py-2 hover:bg-[#CCE8FE] border-blue-900 cursor-pointer">
                    <div className="w-6 flex justify-center">
                      <img src="/open-dialog/SCR-20250806-nzvs.png" alt="PDF" className="h-4" />
                    </div>
                    <div className="w-80 text-xs pl-2">Pensionshandlingar.pdf</div>
                    <div className="w-32 text-xs text-gray-500">5/22/2025 21:45</div>
                    <div className="w-32 text-xs text-gray-500">Adobe Acrobat Reader</div>
                  </div>
                  <div className="flex items-center py-2 hover:bg-[#CCE8FE] border-blue-900 cursor-pointer">
                    <div className="w-6 flex justify-center">
                      <img src="/open-dialog/SCR-20250806-mcng.png" alt="Folder" className="w-4 h-4" />
                    </div>
                    <div className="w-80 text-xs pl-2">Sommarstuga_dokument</div>
                    <div className="w-32 text-xs text-gray-500">6/15/2025 14:03</div>
                    <div className="w-32 text-xs text-gray-500">Mapp</div>
                  </div>
                  <div className="flex items-center py-2 hover:bg-[#CCE8FE] border-blue-900 cursor-pointer">
                    <div className="w-6 flex justify-center">
                      <img src="/open-dialog/SCR-20250806-mcng.png" alt="Folder" className="w-4 h-4" />
                    </div>
                    <div className="w-80 text-xs pl-2">Båtpapper</div>
                    <div className="w-32 text-xs text-gray-500">7/01/2025 06:52</div>
                    <div className="w-32 text-xs text-gray-500">Mapp</div>
                  </div>
                  <div className="flex items-center py-2 hover:bg-[#CCE8FE] border-blue-900 cursor-pointer">
                    <div className="w-6 flex justify-center">
                      <img src="/open-dialog/png.png" alt="Image" className="h-4" />
                    </div>
                    <div className="w-80 text-xs pl-2">Familjebilder_midsommar.jpg</div>
                    <div className="w-32 text-xs text-gray-500">8/06/2025 18:29</div>
                    <div className="w-32 text-xs text-gray-500">JPEG-bild</div>
                  </div>
                  <div className="flex items-center py-2 hover:bg-[#CCE8FE] border-blue-900 cursor-pointer">
                    <div className="w-6 flex justify-center">
                      <img src="/open-dialog/SCR-20250806-mcng.png" alt="Folder" className="w-4 h-4" />
                    </div>
                    <div className="w-80 text-xs pl-2">Trädgårdsplanering</div>
                    <div className="w-32 text-xs text-gray-500">9/14/2025 11:38</div>
                    <div className="w-32 text-xs text-gray-500">Mapp</div>
                  </div>
                  <div className="flex items-center py-2 hover:bg-[#CCE8FE] border-blue-900 cursor-pointer">
                    <div className="w-6 flex justify-center">
                      <img src="/open-dialog/SCR-20250806-mcng.png" alt="Folder" className="w-4 h-4" />
                    </div>
                    <div className="w-80 text-xs pl-2">Receptsamling</div>
                    <div className="w-32 text-xs text-gray-500">10/30/2025 23:07</div>
                    <div className="w-32 text-xs text-gray-500">Mapp</div>
                  </div>
                  <div className="flex items-center py-2 hover:bg-[#CCE8FE] border-blue-900 cursor-pointer">
                    <div className="w-6 flex justify-center">
                      <img src="/open-dialog/SCR-20250806-nzvs.png" alt="PDF" className="h-4" />
                    </div>
                    <div className="w-80 text-xs pl-2">Försäkringsärenden.pdf</div>
                    <div className="w-32 text-xs text-gray-500">11/12/2025 15:56</div>
                    <div className="w-32 text-xs text-gray-500">Adobe Acrobat Reader</div>
                  </div>
                  <div className="flex items-center py-2 hover:bg-[#CCE8FE] border-blue-900 cursor-pointer">
                    <div className="w-6 flex justify-center">
                      <img src="/open-dialog/png.png" alt="Image" className="h-4" />
                    </div>
                    <div className="w-80 text-xs pl-2">Skärgårdsvy_sunset.png</div>
                    <div className="w-32 text-xs text-gray-500">12/25/2025 08:44</div>
                    <div className="w-32 text-xs text-gray-500">PNG-fil</div>
                  </div>
                  <div className="flex items-center py-2 hover:bg-[#CCE8FE] border-blue-900 cursor-pointer">
                    <div className="w-6 flex justify-center">
                      <img src="/open-dialog/SCR-20250806-mcng.png" alt="Folder" className="w-4 h-4" />
                    </div>
                    <div className="w-80 text-xs pl-2">Bokföring_pensionärsrabatter</div>
                    <div className="w-32 text-xs text-gray-500">1/05/2026 20:15</div>
                    <div className="w-32 text-xs text-gray-500">Mapp</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-[#F0F0F0] border-t border-[#e1e1e1] px-4 py-3 -mt-4 relative z-10">
              {/* First Row - Filnamn and Alla filer */}
              <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center space-x-2 ml-auto">
                  <span className="text-xs">Filnamn:</span>
                
                <div className="bg-white border border-blue-300 px-2 py-1 text-xs w-64 flex items-center justify-between">
                    <span>{selectedFile || ''}</span>
                    <button className="text-xs">
                      <img src="/open-dialog/pilned.png" alt="Dropdown" className="h-4 w-[11px] pt-1 pb-1" />
                    </button>
                  </div>


                </div>
                <div className="flex items-center">
                  <select className="text-xs bg-[#E1E1E1] border border-gray-300 px-2 py-1">
                    <option>Alla filer</option>
                    <option>PDF-filer (*.pdf)</option>
                    <option>Dokument (*.doc, *.docx)</option>
                  </select>
                </div>
              </div>

              {/* Second Row - Buttons */}
              <div className="flex justify-end space-x-2">
                <button className="px-6 py-1 bg-[#E1E1E1] border-2 border-blue-500 text-gray text-xs hover:bg-[#CECECE]"
                  onClick={() => {
                    // Determine which file to send based on current step
                    const currentScriptStep = conversationScript[currentStep];
                    if (currentScriptStep?.type === 'file_attachment_user') {
                      // Silvia sends adam.bim
                      addMessage('Max', 'ATTACHMENT:adam.bim');
                    } else {
                      // Kardell sends adam.pdf (final file)
                      addMessage('Max', 'ATTACHMENT:adam.pdf');
                    }
                    setShowFileDialog(false);
                    setCurrentStep(prev => prev + 1);
                  }}
                >
                  Öppna
                </button>
                <button
                  className="px-6 py-1 bg-[#E1E1E1] text-gray text-xs hover:bg-[#CECECE]"
                  onClick={() => setShowFileDialog(false)}
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
