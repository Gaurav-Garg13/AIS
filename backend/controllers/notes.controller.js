import Note from '../models/Note.js';

// @desc    Get all notes for a user
// @route   GET /api/notes
// @access  Private
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
export const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = new Note({
      user: req.user._id,
      title: title || 'Untitled Note',
      content: content || '',
    });
    const createdNote = await note.save();
    res.status(201).json(createdNote);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a note
// @route   PATCH /api/notes/:id
// @access  Private
export const updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;

    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    await note.deleteOne();
    res.json({ message: 'Note removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
