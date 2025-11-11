import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  TrashIcon, 
  CheckCircleIcon, 
  PencilIcon, 
  EraserIcon, 
  UndoIcon, 
  RedoIcon,
  MousePointerIcon,
  SquareIcon,
  CircleIcon,
  TriangleIcon
} from './icons'; // Using the new consolidated icons file

interface DrawingCanvasProps {
  onComplete: (file: File) => void;
  onCancel: () => void;
}

type Tool = 'draw' | 'erase' | 'line' | 'rect' | 'circle' | 'triangle';
const COLORS = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'];

// Utility component for the toolbar
const ToolButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-full transition-colors duration-200 ${
      isActive ? 'bg-brand-primary text-black' : 'text-content-muted hover:bg-base-300'
    }`}
    aria-label={label}
    title={label}
  >
    {children}
  </button>
);

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onComplete, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('draw');
  const [brushSize, setBrushSize] = useState(4);
  const [color, setColor] = useState('#000000'); // Default to black brush
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoHistory, setRedoHistory] = useState<ImageData[]>([]);
  
  // For shape/line drawing
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  const getDPR = () => window.devicePixelRatio || 1;

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = getDPR();
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const context = canvas.getContext('2d');
      if (!context) return;
      contextRef.current = context;
      
      // Set white background
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      context.lineCap = 'round';
      context.lineJoin = 'round';

      const initialImageData = context.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialImageData]);
      setRedoHistory([]);
    }
  }, []);

  // --- !! THIS IS THE FIX !! ---
  // We use a ResizeObserver to detect when the canvas's CSS size changes
  // and then call setupCanvas to update the internal buffer size to match.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      setupCanvas(); // Re-setup the canvas when its size changes
    });
    observer.observe(canvas);

    // Initial setup
    setupCanvas();

    return () => {
      observer.disconnect();
    };
  }, [setupCanvas]);
  // --- !! END FIX !! ---


  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev, imageData]);
    setRedoHistory([]);
  }, []);

  const getEventCoordinates = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = getDPR();
    let clientX: number, clientY: number;

    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ('clientX' in event) {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    } else {
      return { x: 0, y: 0 };
    }
    
    return { 
        x: (clientX - rect.left) * dpr,
        y: (clientY - rect.top) * dpr 
    };
  }, []);

  const setContextSettings = useCallback(() => {
    const context = contextRef.current;
    if (!context) return;
    const dpr = getDPR();
    
    if (tool === 'erase') {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = (brushSize * 5) * dpr;
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = color;
      context.fillStyle = color;
      context.lineWidth = brushSize * dpr;
    }
  }, [tool, brushSize, color]);

  // --- New functions for drawing shapes ---
  const drawShape = (endX: number, endY: number) => {
    const context = contextRef.current;
    if (!context || !startPos || !snapshot) return;

    // Restore the canvas to the state before we started drawing the shape
    context.putImageData(snapshot, 0, 0);
    setContextSettings();
    context.beginPath();

    const dpr = getDPR();
    // Add 0.5 to coordinates for sharp pixel lines
    const startX = startPos.x + 0.5;
    const startY = startPos.y + 0.5;
    endX += 0.5;
    endY += 0.5;

    switch (tool) {
      case 'line':
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        break;
      case 'rect':
        context.rect(startX, startY, endX - startX, endY - startY);
        break;
      case 'circle':
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        context.arc(startX, startY, radius, 0, 2 * Math.PI);
        break;
      case 'triangle':
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.lineTo(startX * 2 - endX, endY); // Creates an isosceles triangle
        context.closePath();
        break;
    }
    context.stroke();
  };

  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const context = contextRef.current;
    if (!context) return;
    
    const { x, y } = getEventCoordinates(event);
    setContextSettings();
    setIsDrawing(true);
    
    if (tool === 'draw' || tool === 'erase') {
      context.beginPath();
      context.moveTo(x, y);
    } else if (tool === 'line' || tool === 'rect' || tool === 'circle' || tool === 'triangle') {
      // Save the canvas state *before* we start drawing the shape preview
      setSnapshot(context.getImageData(0, 0, context.canvas.width, context.canvas.height));
      setStartPos({ x, y });
    }
    
    event.preventDefault();
  }, [tool, getEventCoordinates, setContextSettings]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      // For shapes, the final draw is already on the canvas, so just save it
      if (tool !== 'draw' && tool !== 'erase') {
        setStartPos(null);
        setSnapshot(null);
      }
      saveState();
    }
    setIsDrawing(false);
  }, [isDrawing, saveState, tool]);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getEventCoordinates(event);
    
    if (tool === 'draw' || tool === 'erase') {
      contextRef.current?.lineTo(x, y);
      contextRef.current?.stroke();
    } else if (tool === 'line' || tool === 'rect' || tool === 'circle' || tool === 'triangle') {
      drawShape(x, y);
    }
    
    event.preventDefault();
  }, [isDrawing, getEventCoordinates, tool, drawShape]);
  
  const handleUndo = () => {
      if (history.length <= 1) return; // Can't undo initial state
      const lastState = history[history.length - 1];
      setRedoHistory(prev => [lastState, ...prev]);
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      const prevState = newHistory[newHistory.length - 1];
      contextRef.current?.putImageData(prevState, 0, 0);
  };
  
  const handleRedo = () => {
      if (redoHistory.length === 0) return;
      const nextState = redoHistory[0];
      setHistory(prev => [...prev, nextState]);
      const newRedoHistory = redoHistory.slice(1);
      setRedoHistory(newRedoHistory);
      contextRef.current?.putImageData(nextState, 0, 0);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      // Re-run setup to clear and reset history
      setupCanvas();
    }
  };

  const handleComplete = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'sketch.png', { type: 'image/png' });
        onComplete(file);
      }
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 bg-base-100/80 backdrop-blur-md z-40 flex flex-col items-center justify-center animate-fade-in p-4">
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 bg-base-200/50 backdrop-blur-lg border border-base-300/50 rounded-full p-2 flex items-center gap-2">
            
            <ToolButton label="Pencil" isActive={tool === 'draw'} onClick={() => setTool('draw')}>
              <PencilIcon className="w-6 h-6" />
            </ToolButton>
            <ToolButton label="Line" isActive={tool === 'line'} onClick={() => setTool('line')}>
              <MousePointerIcon className="w-6 h-6" style={{ transform: 'rotate(90deg) scaleX(-1)' }} />
            </ToolButton>
            <ToolButton label="Rectangle" isActive={tool === 'rect'} onClick={() => setTool('rect')}>
              <SquareIcon className="w-6 h-6" />
            </ToolButton>
            <ToolButton label="Circle" isActive={tool === 'circle'} onClick={() => setTool('circle')}>
              <CircleIcon className="w-6 h-6" />
            </ToolButton>
            <ToolButton label="Triangle" isActive={tool === 'triangle'} onClick={() => setTool('triangle')}>
              <TriangleIcon className="w-6 h-6" />
            </ToolButton>
            <ToolButton label="Erase" isActive={tool === 'erase'} onClick={() => setTool('erase')}>
              <EraserIcon className="w-6 h-6" />
            </ToolButton>

            <div className="w-px h-6 bg-base-300/50 mx-1"></div>
            
            {/* --- NEW: Color Palette --- */}
            {COLORS.map((c) => (
              <button
                key={c}
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${
                  color === c ? 'border-brand-primary scale-110' : 'border-base-300'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}

            <div className="w-px h-6 bg-base-300/50 mx-1"></div>

            <div className="flex items-center gap-2 px-2">
                <PencilIcon className="w-5 h-5 text-content-muted" />
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                    className="w-24 h-2 bg-base-300 rounded-lg appearance-none cursor-pointer"
                    style={{'accentColor': '#39FF14'}}
                    aria-label="Brush size"
                />
            </div>
            
            <div className="w-px h-6 bg-base-300/50 mx-1"></div>
            <ToolButton label="Undo" isActive={false} onClick={handleUndo}>
              <UndoIcon className="w-6 h-6" />
            </ToolButton>
            <ToolButton label="Redo" isActive={false} onClick={handleRedo}>
              <RedoIcon className="w-6 h-6" />
            </ToolButton>
        </div>
        <canvas
            ref={canvasRef}
            className="w-[80vw] h-[70vh] max-w-[1000px] max-h-[600px] rounded-lg shadow-2xl border-2 border-base-300"
            style={{ cursor: tool === 'draw' || tool === 'erase' ? 'crosshair' : 'default' }}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
        />
        <div className="flex items-center gap-4 mt-6">
            <button
                onClick={handleClear}
                className="bg-red-600/50 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full flex items-center justify-center transition-colors duration-300 text-lg"
            >
                <TrashIcon className="w-6 h-6 mr-2" />
                Clear
            </button>
            <button
                onClick={onCancel}
                className="bg-base-300 hover:bg-base-300/80 text-content font-bold py-3 px-6 rounded-full flex items-center justify-center transition-colors duration-300 text-lg"
            >
                Cancel
            </button>
            <button
                onClick={handleComplete}
                className="bg-brand-primary/80 hover:bg-brand-primary text-black font-bold py-3 px-6 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50 text-lg"
            >
                <CheckCircleIcon className="w-6 h-6 mr-2" />
                Done
            </button>
        </div>
    </div>
  );
};