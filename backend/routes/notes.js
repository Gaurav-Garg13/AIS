const express = require('express');
const router = express.Router();
const {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} = require('../controllers/notes.controller');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getNotes).post(protect, createNote);
router.route('/:id').patch(protect, updateNote).delete(protect, deleteNote);

module.exports = router;
