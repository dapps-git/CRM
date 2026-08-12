import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiTrash2, FiEdit3, FiSearch, FiCheck, FiX, FiBookmark, FiTag, FiCopy 
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import { playAddSound, playDeleteSound } from '../utils/soundEffects';

const NOTE_COLORS = [
  { id: 'purple', bg: '#f5eeff', border: '#e2ccff', label: 'Purple' },
  { id: 'yellow', bg: '#fffbe6', border: '#ffe58f', label: 'Yellow' },
  { id: 'green',  bg: '#e6f7ff', border: '#91d5ff', label: 'Blue' },
  { id: 'mint',   bg: '#f6ffed', border: '#b7eb8f', label: 'Mint' },
  { id: 'pink',   bg: '#fff0f6', border: '#ffadd2', label: 'Pink' },
  { id: 'white',  bg: '#ffffff', border: '#e8e8e8', label: 'White' },
];

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Note Creator State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('#f5eeff');
  const [isExpanding, setIsExpanding] = useState(false);

  // Edit Modal State
  const [editingNote, setEditingNote] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notes');
      setNotes(res.data || []);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      toast.error('Please type a title or content for your note');
      return;
    }

    try {
      const res = await api.post('/notes', {
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        color: selectedColor
      });
      playAddSound();
      toast.success('Note saved!');
      setNotes([res.data, ...notes]);
      setTitle('');
      setContent('');
      setIsExpanding(false);
    } catch {
      toast.error('Failed to save note');
    }
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    if (!editingNote) return;

    try {
      const res = await api.put(`/notes/${editingNote._id}`, {
        title: editingNote.title.trim() || 'Untitled Note',
        content: editingNote.content.trim(),
        color: editingNote.color
      });
      toast.success('Note updated');
      setNotes(notes.map(n => n._id === res.data._id ? res.data : n));
      setEditingNote(null);
    } catch {
      toast.error('Failed to update note');
    }
  };

  const handleTogglePin = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/notes/${id}/pin`);
      setNotes(notes.map(n => n._id === res.data._id ? res.data : n).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
      toast.success(res.data.pinned ? 'Note pinned to top' : 'Note unpinned');
    } catch {
      toast.error('Failed to update pin');
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/notes/${deleteTargetId}`);
      playDeleteSound();
      toast.success('Note deleted');
      setNotes(notes.filter(n => n._id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const copyToClipboard = (text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success('Copied note text to clipboard!');
  };

  const filteredNotes = notes.filter(n => {
    const q = search.toLowerCase();
    return (n.title && n.title.toLowerCase().includes(q)) || 
           (n.content && n.content.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* ── Page Header & Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100/60 pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#2c2438] tracking-tight flex items-center gap-2">
            <span>📝 Quick Notes & Ideas</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Jot down quick thoughts, meeting reminders, client snippets, or project to-dos.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={14} />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-purple-200/80 rounded-lg text-xs outline-none focus:border-[#8a32c6] transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              <FiX size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Create Note Card Box ── */}
      <div className="max-w-2xl mx-auto">
        <form 
          onSubmit={handleCreateNote} 
          className="bg-white border border-purple-200/80 rounded-2xl p-4 shadow-sm transition-all focus-within:shadow-md"
          style={{ background: selectedColor }}
        >
          {isExpanding && (
            <input
              type="text"
              placeholder="Note Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm font-bold bg-transparent outline-none mb-2 text-[#2c2438] placeholder-neutral-400"
            />
          )}

          <textarea
            placeholder="Take a note or type random thoughts..."
            rows={isExpanding ? 3 : 1}
            value={content}
            onFocus={() => setIsExpanding(true)}
            onChange={(e) => setContent(e.target.value)}
            className="w-full text-xs bg-transparent outline-none resize-none text-[#2c2438] placeholder-neutral-400 leading-relaxed"
          />

          {isExpanding && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/5 mt-2">
              
              {/* Color Selector */}
              <div className="flex items-center gap-1.5">
                {NOTE_COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.bg)}
                    className={`w-5 h-5 rounded-full border transition-transform ${selectedColor === c.bg ? 'scale-125 ring-2 ring-[#8a32c6]' : 'hover:scale-110'}`}
                    style={{ background: c.bg, borderColor: c.border }}
                    title={c.label}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setIsExpanding(false); setTitle(''); setContent(''); }}
                  className="px-3 py-1 text-xs font-semibold text-neutral-600 hover:text-neutral-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#8a32c6] hover:bg-[#7828b0] text-white text-xs font-bold rounded-lg shadow-2xs transition-all hover:shadow-xs flex items-center gap-1"
                >
                  <FiPlus size={14} /> Save Note
                </button>
              </div>

            </div>
          )}
        </form>
      </div>

      {/* ── Notes Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#8a32c6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-white/60 border border-purple-100 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-[#8a32c6] flex items-center justify-center mx-auto mb-3">
            📝
          </div>
          <p className="text-sm font-semibold text-neutral-700">No notes found</p>
          <p className="text-xs text-neutral-400 mt-1">Start typing in the box above to create your first note!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredNotes.map(n => (
            <div
              key={n._id}
              onClick={() => setEditingNote(n)}
              className="group relative border rounded-2xl p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between"
              style={{
                background: n.color || '#ffffff',
                borderColor: NOTE_COLORS.find(c => c.bg === n.color)?.border || '#e8e8e8',
                minHeight: '140px'
              }}
            >
              <div>
                {/* Note Header & Pin */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-xs text-[#2c2438] line-clamp-1">
                    {n.title || 'Untitled Note'}
                  </h3>
                  <button
                    type="button"
                    onClick={(e) => handleTogglePin(n._id, e)}
                    className={`p-1 rounded-full transition-colors ${n.pinned ? 'text-[#8a32c6] bg-purple-200/60' : 'text-neutral-300 hover:text-neutral-600'}`}
                    title={n.pinned ? 'Unpin' : 'Pin note to top'}
                  >
                    <FiBookmark size={13} fill={n.pinned ? '#8a32c6' : 'none'} />
                  </button>
                </div>

                {/* Note Body */}
                <p className="text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed line-clamp-6 font-normal">
                  {n.content}
                </p>
              </div>

              {/* Card Footer Tools */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-black/5 opacity-80 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-neutral-400 font-medium">
                  {new Date(n.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => copyToClipboard(`${n.title}\n\n${n.content}`, e)}
                    className="p-1 text-neutral-400 hover:text-purple-700 rounded transition-colors"
                    title="Copy note"
                  >
                    <FiCopy size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDeleteTargetId(n._id); }}
                    className="p-1 text-neutral-400 hover:text-rose-600 rounded transition-colors"
                    title="Delete note"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ── Edit Note Modal ── */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div 
            className="w-full max-w-md border rounded-2xl p-5 shadow-2xl relative transition-all"
            style={{ background: editingNote.color || '#ffffff', borderColor: '#d4c8e3' }}
          >
            <div className="flex items-center justify-between mb-3">
              <input
                type="text"
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                className="text-base font-bold text-[#2c2438] bg-transparent outline-none w-full"
                placeholder="Title"
              />
              <button 
                onClick={() => setEditingNote(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full"
              >
                <FiX size={18} />
              </button>
            </div>

            <textarea
              rows={6}
              value={editingNote.content}
              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
              className="w-full text-xs text-[#2c2438] bg-transparent outline-none resize-none leading-relaxed mb-4"
              placeholder="Type note details..."
            />

            {/* Color picker in Edit Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-black/10">
              <div className="flex items-center gap-1.5">
                {NOTE_COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setEditingNote({ ...editingNote, color: c.bg })}
                    className={`w-5 h-5 rounded-full border transition-transform ${editingNote.color === c.bg ? 'scale-125 ring-2 ring-[#8a32c6]' : 'hover:scale-110'}`}
                    style={{ background: c.bg, borderColor: c.border }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-3 py-1 text-xs font-medium text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateNote}
                  className="px-4 py-1.5 bg-[#8a32c6] hover:bg-[#7828b0] text-white text-xs font-bold rounded-lg shadow-2xs"
                >
                  Save Changes
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        onConfirm={handleDeleteNote}
        onCancel={() => setDeleteTargetId(null)}
      />

    </div>
  );
};

export default Notes;
