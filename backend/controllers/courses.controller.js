import Course from "../models/Course.js";

// Get all courses for the logged-in user
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.user._id });
    // Add an 'id' field so the frontend can use it easily
    const result = courses.map(c => ({ ...c.toObject(), id: c._id }));
    res.json(result);
  } catch (error) {
    console.error('Error reading courses:', error);
    res.status(500).json({ error: 'Failed to load courses' });
  }
};

// Create a new course
export const createCourse = async (req, res) => {
  try {
    const { code, title, instructor, credits, progress, description, schedule, intensity, syllabus, accent } = req.body;

    // Check if this course code already exists for this user
    if (code) {
      const existing = await Course.findOne({
        userId: req.user._id,
        code: { $regex: new RegExp(`^${code}$`, 'i') }
      });
      if (existing) {
        return res.status(409).json({ error: `Course code "${code}" already exists` });
      }
    }

    // Parse syllabus if it comes as a comma-separated string
    let syllabusArray = [];
    if (Array.isArray(syllabus)) {
      syllabusArray = syllabus.filter(Boolean);
    } else if (typeof syllabus === 'string' && syllabus.trim()) {
      syllabusArray = syllabus.split(',').map(s => s.trim()).filter(Boolean);
    }

    const newCourse = await Course.create({
      userId: req.user._id,
      code: code?.trim(),
      title: title?.trim(),
      instructor: instructor?.trim(),
      credits: Number(credits) || 0,
      progress: Number(progress) || 0,
      description: description?.trim(),
      schedule: schedule?.trim(),
      intensity: intensity || 'Core',
      syllabus: syllabusArray,
      accent: accent?.trim(),
    });

    res.status(201).json({ ...newCourse.toObject(), id: newCourse._id });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

// Update an existing course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, title, instructor, credits, progress, description, schedule, intensity, syllabus, accent, status, difficulty, duration, prerequisites } = req.body;

    // If updating code, make sure it doesn't conflict with another course
    if (code) {
      const existing = await Course.findOne({
        userId: req.user._id,
        _id: { $ne: id },
        code: { $regex: new RegExp(`^${code}$`, 'i') }
      });
      if (existing) {
        return res.status(409).json({ error: `Course code "${code}" already exists` });
      }
    }

    // Build the update object with whatever was sent
    const updates = {};
    if (code !== undefined) updates.code = code.trim();
    if (title !== undefined) updates.title = title.trim();
    if (instructor !== undefined) updates.instructor = instructor.trim();
    if (credits !== undefined) updates.credits = Number(credits);
    if (progress !== undefined) updates.progress = Number(progress);
    if (description !== undefined) updates.description = description.trim();
    if (schedule !== undefined) updates.schedule = schedule.trim();
    if (intensity !== undefined) updates.intensity = intensity;
    if (accent !== undefined) updates.accent = accent.trim();
    if (status !== undefined) updates.status = status;
    if (difficulty !== undefined) updates.difficulty = difficulty;
    if (duration !== undefined) updates.duration = duration;
    if (prerequisites !== undefined) updates.prerequisites = prerequisites;
    if (syllabus !== undefined) {
      if (Array.isArray(syllabus)) {
        updates.syllabus = syllabus.filter(Boolean);
      } else if (typeof syllabus === 'string') {
        updates.syllabus = syllabus.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    const updated = await Course.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updates,
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ ...updated.toObject(), id: updated._id });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

// Delete a course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Course.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!deleted) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};
