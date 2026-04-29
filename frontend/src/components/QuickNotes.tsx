import { useState, useEffect } from 'react';
import { PenLine, Save, Check, Plus, Trash2, Loader2 } from 'lucide-react';
import { apiFetch } from '../utils/api';

type Note = {
  _id: string;
  title: string;
  content: string;
  updatedAt: string;
};

export default function QuickNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  // Local state for the currently active note
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load from DB on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await apiFetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        if (data.length > 0 && !activeNoteId) {
          selectNote(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notes', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectNote = (note: Note) => {
    setActiveNoteId(note._id);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleCreateNew = async () => {
    try {
      setIsSaving(true);
      const res = await apiFetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Note', content: '' })
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes(prev => [newNote, ...prev]);
        selectNote(newNote);
      }
    } catch (error) {
      console.error('Failed to create note', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!activeNoteId) return;
    
    try {
      setIsSaving(true);
      const res = await apiFetch(`/api/notes/${activeNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      
      if (res.ok) {
        const updatedNote = await res.json();
        setNotes(prev => prev.map(n => n._id === updatedNote._id ? updatedNote : n));
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save note', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeNoteId) return;
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const res = await apiFetch(`/api/notes/${activeNoteId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        const updatedNotes = notes.filter(n => n._id !== activeNoteId);
        setNotes(updatedNotes);
        if (updatedNotes.length > 0) {
          selectNote(updatedNotes[0]);
        } else {
          setActiveNoteId(null);
          setTitle('');
          setContent('');
        }
      }
    } catch (error) {
      console.error('Failed to delete note', error);
    }
  };

  return (
    <div className="card-editorial flex flex-col flex-shrink-0 min-h-[350px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PenLine size={18} className="text-[#8aaca5]" />
          <h2 className="text-xl section-title m-0">Notes</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {activeNoteId && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Delete Note"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!activeNoteId || isSaving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-widest transition-all disabled:opacity-50 ${
              isSaved 
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                : 'bg-[#2d4f47] text-white hover:bg-[#2d4f47]/90 shadow-sm'
            }`}
          >
            {isSaved ? (
              <><Check size={14} /> Saved</>
            ) : isSaving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving</>
            ) : (
              <><Save size={14} /> Save</>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* Note Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar mb-4 pb-2 border-b border-[var(--border)] dark:border-white/10">
            {notes.map(note => (
              <button
                key={note._id}
                onClick={() => selectNote(note)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeNoteId === note._id
                    ? 'bg-[#8aaca5]/20 text-[#2d4f47] dark:text-[#a8bfad]'
                    : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {note.title || 'Untitled'}
              </button>
            ))}
            <button
              onClick={handleCreateNew}
              className="flex items-center justify-center p-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex-shrink-0"
              title="New Note"
            >
              <Plus size={14} />
            </button>
          </div>

          {activeNoteId ? (
            <div className="flex flex-col flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note Title"
                className="w-full bg-transparent text-lg font-serif font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none border-none mb-3"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing..."
                className="w-full flex-1 min-h-[200px] resize-none bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-sans text-sm leading-relaxed outline-none border-none hide-scrollbar"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-8">
              <PenLine size={32} className="mb-3 opacity-20" />
              <p className="text-sm">No note selected.</p>
              <button
                onClick={handleCreateNew}
                className="mt-4 text-xs font-medium text-[#6b968c] hover:underline"
              >
                Create your first note
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
