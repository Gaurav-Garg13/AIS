import express from 'express';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../controllers/notes.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/').get(requireAuth, getNotes).post(requireAuth, createNote);
router.route('/:id').patch(requireAuth, updateNote).delete(requireAuth, deleteNote);

export default router;
