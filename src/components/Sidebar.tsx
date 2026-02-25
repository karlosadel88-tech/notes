import React from 'react';
import { 
  Book, 
  Folder, 
  Star, 
  Tag, 
  Plus, 
  Search,
  ChevronRight,
  MoreVertical,
  Settings
} from 'lucide-react';
import { Notebook } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  setActiveNotebookId: (id: string) => void;
  onNewNotebook: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notebooks,
  activeNotebookId,
  setActiveNotebookId,
  onNewNotebook
}) => {
  return (
    <div className="w-72 h-screen bg-white border-r border-zinc-200 flex flex-col">
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-xl font-serif font-bold tracking-tight">NoteTape</h1>
        <button className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
          <Settings size={18} className="text-zinc-500" />
        </button>
      </div>

      <div className="px-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search notes..." 
            className="w-full pl-10 pr-4 py-2 bg-zinc-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Library</h2>
            <button 
              onClick={onNewNotebook}
              className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1">
            <SidebarItem icon={<Book size={18} />} label="All Notebooks" active />
            <SidebarItem icon={<Star size={18} />} label="Favorites" />
            <SidebarItem icon={<Tag size={18} />} label="Tags" />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Folders</h2>
          </div>
          <div className="space-y-1">
            {notebooks.map((notebook) => (
              <button
                key={notebook.id}
                onClick={() => setActiveNotebookId(notebook.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group",
                  activeNotebookId === notebook.id 
                    ? "bg-zinc-100 text-zinc-900 font-medium" 
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
                )}
              >
                <Folder size={18} className={activeNotebookId === notebook.id ? "text-zinc-900" : "text-zinc-400"} />
                <span className="flex-1 text-left truncate">{notebook.title}</span>
                <MoreVertical size={14} className="opacity-0 group-hover:opacity-100 text-zinc-400" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-zinc-100">
        <div className="bg-zinc-900 rounded-2xl p-4 text-white">
          <p className="text-xs font-medium opacity-60 mb-1">Study Progress</p>
          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-serif font-bold">84%</span>
            <span className="text-[10px] opacity-60">12/15 Tapes Mastered</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: '84%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <button className={cn(
    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all",
    active ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
  )}>
    <span className={active ? "text-zinc-900" : "text-zinc-400"}>{icon}</span>
    {label}
  </button>
);
