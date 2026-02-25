import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { Tool, TapeColor, Notebook, DrawingLine, TapeStrip } from './types';
import { PAPER_THEMES } from './constants';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Trophy, Plus, Book } from 'lucide-react';
import { cn } from './lib/utils';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: '1',
    title: 'Anatomy & Physiology',
    isFavorite: true,
    tags: ['medical', 'study'],
    pages: [
      {
        id: 'p1',
        title: 'The Skeletal System',
        lines: [],
        tapes: [],
        background: 'paper',
        orientation: 'portrait'
      }
    ]
  },
  {
    id: '2',
    title: 'Organic Chemistry',
    isFavorite: false,
    tags: ['science'],
    pages: [
      {
        id: 'p2',
        title: 'Hydrocarbons',
        lines: [],
        tapes: [],
        background: 'grid',
        orientation: 'portrait'
      }
    ]
  }
];

export default function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INITIAL_NOTEBOOKS);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(INITIAL_NOTEBOOKS[0].id);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tapeColor, setTapeColor] = useState<TapeColor>('yellow');
  const [penColor, setPenColor] = useState('#141414');
  const [highlighterColor, setHighlighterColor] = useState('#fef08a');
  const [penWidth, setPenWidth] = useState(2);
  const [highlighterWidth, setHighlighterWidth] = useState(20);
  const [eraserWidth, setEraserWidth] = useState(20);
  const [tapeHeight, setTapeHeight] = useState(40);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizProgress, setQuizProgress] = useState({ current: 0, total: 0 });

  const activeNotebook = notebooks.find(n => n.id === activeNotebookId);
  const activePage = activeNotebook?.pages[activePageIndex];

  const handleImportImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          if (!activeNotebookId || !activePage) return;
          setNotebooks(prev => prev.map(n => {
            if (n.id === activeNotebookId) {
              return {
                ...n,
                pages: n.pages.map((p, i) => i === activePageIndex ? { ...p, backgroundImage: url } : p)
              };
            }
            return n;
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleImportPDF = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
            const loadingTask = pdfjsLib.getDocument(typedarray);
            const pdf = await loadingTask.promise;
            
            // Load the first page
            const page = await pdf.getPage(1);
            const scale = 2;
            const viewport = page.getViewport({ scale });

            // Prepare canvas using PDF page dimensions
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
              const renderContext: any = {
                canvasContext: context,
                viewport: viewport
              };
              await page.render(renderContext).promise;
              const url = canvas.toDataURL();

              if (!activeNotebookId || !activePage) return;
              setNotebooks(prev => prev.map(n => {
                if (n.id === activeNotebookId) {
                  return {
                    ...n,
                    pages: n.pages.map((p, i) => i === activePageIndex ? { ...p, title: file.name.replace('.pdf', ''), backgroundImage: url } : p)
                  };
                }
                return n;
              }));
            }
          } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Failed to load PDF. Please try again.');
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0 || !activePage) return;
    setTapes(activePage.tapes.filter(t => !selectedIds.includes(t.id)));
    setSelectedIds([]);
  };

  const toggleOrientation = () => {
    if (!activeNotebookId || !activePage) return;
    const newOrientation = activePage.orientation === 'portrait' ? 'landscape' : 'portrait';
    setNotebooks(prev => prev.map(n => {
      if (n.id === activeNotebookId) {
        return {
          ...n,
          pages: n.pages.map((p, i) => i === activePageIndex ? { ...p, orientation: newOrientation } : p)
        };
      }
      return n;
    }));
  };

  const setLines = useCallback((lines: DrawingLine[]) => {
    if (!activeNotebookId || !activePage) return;
    setNotebooks(prev => prev.map(n => {
      if (n.id === activeNotebookId) {
        return {
          ...n,
          pages: n.pages.map((p, i) => i === activePageIndex ? { ...p, lines } : p)
        };
      }
      return n;
    }));
  }, [activeNotebookId, activePageIndex, activePage]);

  const setTapes = useCallback((tapes: TapeStrip[]) => {
    if (!activeNotebookId || !activePage) return;
    setNotebooks(prev => prev.map(n => {
      if (n.id === activeNotebookId) {
        return {
          ...n,
          pages: n.pages.map((p, i) => i === activePageIndex ? { ...p, tapes } : p)
        };
      }
      return n;
    }));
  }, [activeNotebookId, activePageIndex, activePage]);

  const setBackground = (background: keyof typeof PAPER_THEMES) => {
    if (!activeNotebookId || !activePage) return;
    setNotebooks(prev => prev.map(n => {
      if (n.id === activeNotebookId) {
        return {
          ...n,
          pages: n.pages.map((p, i) => i === activePageIndex ? { ...p, background } : p)
        };
      }
      return n;
    }));
  };

  const handleAddPage = () => {
    if (!activeNotebookId) return;
    setNotebooks(prev => prev.map(n => {
      if (n.id === activeNotebookId) {
        return {
          ...n,
          pages: [...n.pages, {
            id: Math.random().toString(36).substr(2, 9),
            title: `Page ${n.pages.length + 1}`,
            lines: [],
            tapes: [],
            background: 'white',
            orientation: 'portrait'
          }]
        };
      }
      return n;
    }));
    setActivePageIndex(activeNotebook?.pages.length || 0);
  };

  const handleUndo = () => {
    if (!activePage) return;
    if (activePage.lines.length > 0) {
      setLines(activePage.lines.slice(0, -1));
    }
  };

  const handleClear = () => {
    setLines([]);
    setTapes([]);
  };

  const handleToggleAllTape = (reveal: boolean) => {
    if (!activePage) return;
    setTapes(activePage.tapes.map(t => ({ ...t, isRevealed: reveal })));
  };

  const handleSmartTape = async () => {
    // In a real app, we'd OCR the page or use existing text
    // For this demo, we'll simulate finding keywords and placing tape
    const demoKeywords = ["Mitochondria", "ATP", "Cellular Respiration"];
    
    if (!activePage) return;
    
    const newTapes: TapeStrip[] = demoKeywords.map((kw, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      x: 100 + (i * 50),
      y: 200 + (i * 60),
      width: 150,
      height: 40,
      rotation: (Math.random() - 0.5) * 5,
      color: 'yellow',
      opacity: 0.9,
      isRevealed: false,
      isLocked: false,
    }));

    setTapes([...activePage.tapes, ...newTapes]);
  };

  const startQuiz = () => {
    if (!activePage || activePage.tapes.length === 0) return;
    handleToggleAllTape(false);
    setIsQuizMode(true);
    setQuizProgress({ current: 0, total: activePage.tapes.length });
  };

  const handleNewNotebook = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newNotebook: Notebook = {
      id: newId,
      title: 'Untitled Notebook',
      isFavorite: false,
      tags: [],
      pages: [{
        id: 'p' + newId,
        title: 'Page 1',
        lines: [],
        tapes: [],
        background: 'white',
        orientation: 'portrait'
      }]
    };
    setNotebooks([...notebooks, newNotebook]);
    setActiveNotebookId(newId);
  };

  // Track quiz progress by counting revealed tapes
  useEffect(() => {
    if (isQuizMode && activePage) {
      const revealedCount = activePage.tapes.filter(t => t.isRevealed).length;
      setQuizProgress(prev => ({ ...prev, current: revealedCount }));
      
      if (revealedCount === activePage.tapes.length && activePage.tapes.length > 0) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fef08a', '#f5f5dc', '#d1d5db']
        });
        setTimeout(() => setIsQuizMode(false), 3000);
      }
    }
  }, [activePage?.tapes, isQuizMode]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-100">
      <Sidebar 
        notebooks={notebooks} 
        activeNotebookId={activeNotebookId}
        setActiveNotebookId={setActiveNotebookId}
        onNewNotebook={handleNewNotebook}
      />
      
      <main className="flex-1 relative flex flex-col">
        {/* Page Tabs */}
        {activeNotebook && (
          <div className="bg-white border-b border-zinc-200 px-4 flex items-center gap-1 h-12 z-40">
            {activeNotebook.pages.map((page, index) => (
              <button
                key={page.id}
                onClick={() => setActivePageIndex(index)}
                className={cn(
                  "px-4 h-full text-xs font-medium border-b-2 transition-all flex items-center gap-2",
                  activePageIndex === index 
                    ? "border-zinc-900 text-zinc-900 bg-zinc-50" 
                    : "border-transparent text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
                )}
              >
                {page.title}
              </button>
            ))}
            <button 
              onClick={handleAddPage}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 transition-colors ml-2"
            >
              <Plus size={14} />
            </button>

            <div className="ml-auto flex items-center gap-2">
              {(Object.keys(PAPER_THEMES) as Array<keyof typeof PAPER_THEMES>).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setBackground(theme)}
                  title={theme}
                  className={cn(
                    "w-5 h-5 rounded border border-zinc-200 transition-all",
                    activePage?.background === theme ? "ring-2 ring-zinc-900 ring-offset-1" : "hover:scale-110",
                    theme === 'white' && 'bg-white',
                    theme === 'dark' && 'bg-zinc-800',
                    theme === 'paper' && 'bg-[#fdfbf7]',
                    theme === 'grid' && 'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:4px_4px]',
                    theme === 'dots' && 'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:2px_2px]'
                  )}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          <Toolbar 
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            tapeColor={tapeColor}
            setTapeColor={setTapeColor}
            penColor={penColor}
            setPenColor={setPenColor}
            highlighterColor={highlighterColor}
            setHighlighterColor={setHighlighterColor}
            penWidth={penWidth}
            setPenWidth={setPenWidth}
            highlighterWidth={highlighterWidth}
            setHighlighterWidth={setHighlighterWidth}
            eraserWidth={eraserWidth}
            setEraserWidth={setEraserWidth}
            tapeHeight={tapeHeight}
            setTapeHeight={setTapeHeight}
            onUndo={handleUndo}
            onRedo={() => {}} // TODO: Implement Redo
            onClear={handleClear}
            onToggleAllTape={handleToggleAllTape}
            onStartQuiz={startQuiz}
            onSmartTape={handleSmartTape}
            onDeleteSelected={handleDeleteSelected}
            onImportImage={handleImportImage}
            onImportPDF={handleImportPDF}
            onToggleOrientation={toggleOrientation}
            orientation={activePage?.orientation || 'portrait'}
          />

          {activePage && (
            <Canvas 
              tool={activeTool}
              lines={activePage.lines}
              setLines={setLines}
              tapes={activePage.tapes}
              setTapes={setTapes}
              tapeColor={tapeColor}
              background={PAPER_THEMES[activePage.background]}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              penColor={penColor}
              highlighterColor={highlighterColor}
              penWidth={penWidth}
              highlighterWidth={highlighterWidth}
              eraserWidth={eraserWidth}
              tapeHeight={tapeHeight}
              backgroundImage={activePage.backgroundImage}
              orientation={activePage.orientation}
            />
          )}
        </div>

        {/* Quiz Mode Overlay */}
        <AnimatePresence>
          {isQuizMode && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/10"
            >
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Study Mode Active</span>
                <span className="text-lg font-serif font-bold">Reveal the hidden sections</span>
              </div>
              
              <div className="h-10 w-px bg-white/10" />
              
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs opacity-60">Progress</span>
                  <span className="font-mono font-bold">{quizProgress.current} / {quizProgress.total}</span>
                </div>
                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-yellow-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${(quizProgress.current / quizProgress.total) * 100}%` }}
                  />
                </div>
              </div>

              <button 
                onClick={() => setIsQuizMode(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!activeNotebookId && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mx-auto">
                <Book size={40} className="text-zinc-300" />
              </div>
              <h2 className="text-2xl font-serif font-bold">Select a Notebook</h2>
              <p className="text-zinc-500 max-w-xs">Pick a notebook from the sidebar or create a new one to start studying.</p>
              <button 
                onClick={handleNewNotebook}
                className="px-6 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Create Notebook
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
