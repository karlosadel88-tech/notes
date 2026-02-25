import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { Tool, TapeColor, Notebook, DrawingLine, TapeStrip } from './types';
import { PAPER_THEMES } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Plus } from 'lucide-react';
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
        background: 'paper'
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
        background: 'grid'
      }
    ]
  }
];

export default function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => {
    try {
      const saved = localStorage.getItem('notetape_notebooks');
      return saved ? JSON.parse(saved) : INITIAL_NOTEBOOKS;
    } catch (e) {
      console.error('Failed to parse notebooks from localStorage', e);
      return INITIAL_NOTEBOOKS;
    }
  });
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('notetape_notebooks');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0].id : (INITIAL_NOTEBOOKS[0]?.id || null);
      }
    } catch (e) {
      console.error('Failed to parse activeNotebookId from localStorage', e);
    }
    return INITIAL_NOTEBOOKS[0]?.id || null;
  });

  // Save to localStorage whenever notebooks change
  useEffect(() => {
    localStorage.setItem('notetape_notebooks', JSON.stringify(notebooks));
  }, [notebooks]);

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
  const [zoom, setZoom] = useState(1);

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
            const numPages = pdf.numPages;
            const scale = 2; // High resolution render
            
            // Get dimensions of all pages to calculate total height
            let totalHeight = 0;
            let maxWidth = 0;
            const pageData = [];
            
            for (let i = 1; i <= numPages; i++) {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale });
              totalHeight += viewport.height;
              maxWidth = Math.max(maxWidth, viewport.width);
              pageData.push({ page, viewport });
            }

            // Prepare canvas using total PDF dimensions
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = totalHeight;
            canvas.width = maxWidth;

            if (context) {
              let currentY = 0;
              for (const { page, viewport } of pageData) {
                const renderContext: any = {
                  canvasContext: context,
                  viewport: viewport,
                  // We need to translate the context for each page
                };
                
                // Save context state
                context.save();
                context.translate(0, currentY);
                await page.render(renderContext).promise;
                context.restore();
                
                currentY += viewport.height;
              }
              const url = canvas.toDataURL();

              if (!activeNotebookId) return;
              const newPageId = Math.random().toString(36).substr(2, 9);
              setNotebooks(prev => prev.map(n => {
                if (n.id === activeNotebookId) {
                  const newPage = {
                    id: newPageId,
                    title: file.name.replace('.pdf', ''),
                    lines: [],
                    tapes: [],
                    background: 'white' as const,
                    backgroundImage: url
                  };
                  return {
                    ...n,
                    pages: [...n.pages, newPage]
                  };
                }
                return n;
              }));
              
              // Switch to the new page
              const notebook = notebooks.find(n => n.id === activeNotebookId);
              if (notebook) {
                setActivePageIndex(notebook.pages.length);
              }
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
            background: 'white'
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
        background: 'white'
      }]
    };
    setNotebooks([...notebooks, newNotebook]);
    setActiveNotebookId(newId);
  };

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
            onSmartTape={handleSmartTape}
            onDeleteSelected={handleDeleteSelected}
            onImportImage={handleImportImage}
            onImportPDF={handleImportPDF}
            zoom={zoom}
            setZoom={setZoom}
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
              zoom={zoom}
            />
          )}
        </div>

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
