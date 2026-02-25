import { 
  Pen, 
  Eraser, 
  StickyNote, 
  MousePointer2, 
  Undo2, 
  Redo2, 
  Trash2,
  Settings2,
  Highlighter,
  Image as ImageIcon,
  FileUp,
  Scissors,
  ZoomIn,
  ZoomOut,
  Maximize
} from 'lucide-react';
import { Tool, TapeColor } from '../types';
import { TAPE_COLORS, PEN_COLORS, HIGHLIGHTER_COLORS } from '../constants';
import { cn } from '../lib/utils';

interface ToolbarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  tapeColor: TapeColor;
  setTapeColor: (color: TapeColor) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  highlighterColor: string;
  setHighlighterColor: (color: string) => void;
  penWidth: number;
  setPenWidth: (w: number) => void;
  highlighterWidth: number;
  setHighlighterWidth: (w: number) => void;
  eraserWidth: number;
  setEraserWidth: (w: number) => void;
  tapeHeight: number;
  setTapeHeight: (h: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSmartTape: () => void;
  onDeleteSelected: () => void;
  onImportImage: () => void;
  onImportPDF: () => void;
  zoom: number;
  setZoom: (z: number) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  tapeColor,
  setTapeColor,
  penColor,
  setPenColor,
  highlighterColor,
  setHighlighterColor,
  penWidth,
  setPenWidth,
  highlighterWidth,
  setHighlighterWidth,
  eraserWidth,
  setEraserWidth,
  tapeHeight,
  setTapeHeight,
  onUndo,
  onRedo,
  onClear,
  onSmartTape,
  onDeleteSelected,
  onImportImage,
  onImportPDF,
  zoom,
  setZoom
}) => {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-row-reverse items-start gap-4">
      <div className="flex flex-col items-center gap-2 p-2 bg-white/80 backdrop-blur-md border border-zinc-200 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center gap-1 pb-4 border-b border-zinc-200">
          <ToolButton 
            active={activeTool === 'select'} 
            onClick={() => setActiveTool('select')} 
            icon={<MousePointer2 size={20} />} 
            label="Select"
          />
          <ToolButton 
            active={activeTool === 'lasso'} 
            onClick={() => setActiveTool('lasso')} 
            icon={<Scissors size={20} />} 
            label="Lasso"
          />
          <ToolButton 
            active={activeTool === 'pen'} 
            onClick={() => setActiveTool('pen')} 
            icon={<Pen size={20} />} 
            label="Pen"
          />
          <ToolButton 
            active={activeTool === 'highlighter'} 
            onClick={() => setActiveTool('highlighter')} 
            icon={<Highlighter size={20} />} 
            label="Highlighter"
          />
          <ToolButton 
            active={activeTool === 'eraser'} 
            onClick={() => setActiveTool('eraser')} 
            icon={<Eraser size={20} />} 
            label="Stroke Eraser"
          />
          <ToolButton 
            active={activeTool === 'tape'} 
            onClick={() => setActiveTool('tape')} 
            icon={<StickyNote size={20} />} 
            label="Tape Tool"
          />
        </div>

        <div className="flex flex-col items-center gap-1 py-4 border-b border-zinc-200">
          <ToolButton onClick={onImportImage} icon={<ImageIcon size={20} />} label="Import Image" />
          <ToolButton onClick={onImportPDF} icon={<FileUp size={20} />} label="Import PDF" />
        </div>

        <div className="flex flex-col items-center gap-1 py-4 border-b border-zinc-200">
          <ToolButton onClick={onUndo} icon={<Undo2 size={20} />} label="Undo" />
          <ToolButton onClick={onRedo} icon={<Redo2 size={20} />} label="Redo" />
          <ToolButton onClick={onClear} icon={<Trash2 size={20} />} label="Clear Page" />
          {activeTool === 'select' && (
            <>
              <div className="w-6 h-px bg-zinc-200 my-1" />
              <ToolButton onClick={onDeleteSelected} icon={<Trash2 size={20} className="text-red-500" />} label="Delete Selected" />
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 py-4 border-b border-zinc-200">
          <ToolButton onClick={() => setZoom(Math.min(zoom + 0.1, 3))} icon={<ZoomIn size={20} />} label="Zoom In" />
          <ToolButton onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))} icon={<ZoomOut size={20} />} label="Zoom Out" />
          <ToolButton onClick={() => setZoom(1)} icon={<Maximize size={20} />} label="Reset Zoom" />
          <div className="text-[10px] font-mono font-bold text-zinc-400 mt-1">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 pt-4">
          <ToolButton onClick={onSmartTape} icon={<Settings2 size={20} />} label="Smart Tape (AI)" />
        </div>
      </div>

      {/* Secondary Toolbar for Colors and Sizes - now positioned to the left of the main toolbar */}
      {(activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'tape' || activeTool === 'eraser') && (
        <div className="flex flex-col items-start gap-6 px-4 py-4 bg-white/80 backdrop-blur-md border border-zinc-200 rounded-xl shadow-lg animate-in fade-in slide-in-from-right-2">
          {activeTool === 'pen' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-zinc-400 mr-2">Color</span>
                {PEN_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setPenColor(color.value)}
                    className={cn(
                      "w-5 h-5 rounded-full border-2 transition-all",
                      penColor === color.value ? "border-zinc-900 scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Size</span>
                <input 
                  type="range" min="1" max="20" step="1" 
                  value={penWidth} 
                  onChange={(e) => setPenWidth(parseInt(e.target.value))}
                  className="w-24 accent-zinc-900"
                />
                <span className="text-[10px] font-mono w-4">{penWidth}</span>
              </div>
            </>
          )}
          {activeTool === 'highlighter' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-zinc-400 mr-2">Color</span>
                {HIGHLIGHTER_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setHighlighterColor(color.value)}
                    className={cn(
                      "w-5 h-5 rounded-full border-2 transition-all",
                      highlighterColor === color.value ? "border-zinc-900 scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Size</span>
                <input 
                  type="range" min="10" max="60" step="5" 
                  value={highlighterWidth} 
                  onChange={(e) => setHighlighterWidth(parseInt(e.target.value))}
                  className="w-24 accent-zinc-900"
                />
                <span className="text-[10px] font-mono w-4">{highlighterWidth}</span>
              </div>
            </>
          )}
          {activeTool === 'eraser' && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Eraser Size</span>
              <input 
                type="range" min="5" max="100" step="5" 
                value={eraserWidth} 
                onChange={(e) => setEraserWidth(parseInt(e.target.value))}
                className="w-32 accent-zinc-900"
              />
              <span className="text-[10px] font-mono w-6">{eraserWidth}</span>
            </div>
          )}
          {activeTool === 'tape' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-zinc-400 mr-2">Color</span>
                {(Object.keys(TAPE_COLORS) as TapeColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => setTapeColor(color)}
                    className={cn(
                      "w-5 h-5 rounded-full border-2 transition-all",
                      tapeColor === color ? "border-zinc-900 scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: TAPE_COLORS[color] }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Tape Height</span>
                <input 
                  type="range" min="20" max="100" step="5" 
                  value={tapeHeight} 
                  onChange={(e) => setTapeHeight(parseInt(e.target.value))}
                  className="w-24 accent-zinc-900"
                />
                <span className="text-[10px] font-mono w-6">{tapeHeight}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ToolButton: React.FC<{ 
  active?: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    title={label}
    className={cn(
      "p-2 rounded-lg transition-all relative group",
      active ? "bg-zinc-100 text-zinc-900 shadow-inner" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
    )}
  >
    {icon}
    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
      {label}
    </span>
  </button>
);
