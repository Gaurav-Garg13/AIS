import Course from "../models/Course.js";

function sanitizeCoursePayload(input, options = {}) {
  const { partial = false } = options;
  const output = {};

  const optionalString = (key) => {
    if (input[key] == null || (typeof input[key] === 'string' && !input[key].trim())) {
      return;
    }
    output[key] = input[key].trim();
  };

  const optionalNumber = (key, { min = 0, max = Number.POSITIVE_INFINITY } = {}) => {
    if (input[key] == null || input[key] === '') {
      return;
    }
    const numericValue = Number(input[key]);
    if (!Number.isFinite(numericValue) || numericValue < min || numericValue > max) {
      throw new Error(`${key} must be a number between ${min} and ${max}`);
    }
    output[key] = numericValue;
  };

  optionalString('code');
  optionalString('title');
  optionalString('instructor');
  optionalNumber('credits', { min: 0, max: 12 });
  optionalNumber('progress', { min: 0, max: 100 });


  if (input.syllabus != null) {
    const syllabus = Array.isArray(input.syllabus) 
      ? input.syllabus.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
      : (typeof input.syllabus === 'string' ? input.syllabus.split(',').map(s => s.trim()).filter(Boolean) : []);
    output.syllabus = syllabus;
  }

  if (input.description != null && typeof input.description === 'string' && input.description.trim()) {
    output.description = input.description.trim();
  }

  if (input.schedule != null && typeof input.schedule === 'string' && input.schedule.trim()) {
    output.schedule = input.schedule.trim();
  }

  if (input.intensity != null) {
    const allowedIntensity = ['Core', 'Lab', 'Elective'];
    if (allowedIntensity.includes(input.intensity)) {
      output.intensity = input.intensity;
    }
  }

  if (input.accent != null) {
    if (typeof input.accent !== 'string' || !/^#[\da-fA-F]{6}$/.test(input.accent.trim())) {
      throw new Error('accent must be a hex color like #38bdf8');
    }
    output.accent = input.accent.trim();
  }

  return output;
}

export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.user._id });
    // Format them slightly to match UI expectations (like returning _id as id)
    const formatted = courses.map(c => ({
      ...c.toObject(),
      id: c._id
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Error reading courses:', error);
    res.status(500).json({ error: 'Failed to load courses' });
  }
};

export const createCourse = async (req, res) => {
  try {
    const payload = sanitizeCoursePayload(req.body ?? {});
    
    // Check if course code exists for THIS user (only if code is provided)
    if (payload.code) {
      const existing = await Course.findOne({ 
        userId: req.user._id,
        code: { $regex: new RegExp(`^${payload.code}$`, 'i') } 
      });

      if (existing) {
        return res.status(409).json({ error: `Course code "${payload.code}" already exists` });
      }
    }

    const newCourse = await Course.create({
      ...payload,
      userId: req.user._id
    });

    const formatted = { ...newCourse.toObject(), id: newCourse._id };
    res.status(201).json(formatted);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = sanitizeCoursePayload(req.body ?? {}, { partial: true });
    
    if (payload.code) {
      const existing = await Course.findOne({
        userId: req.user._id,
        _id: { $ne: id },
        code: { $regex: new RegExp(`^${payload.code}$`, 'i') }
      });
      if (existing) {
        return res.status(409).json({ error: `Course code "${payload.code}" already exists` });
      }
    }

    const updatedCourse = await Course.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      payload,
      { returnDocument: 'after' }
    );

    if (!updatedCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const formatted = { ...updatedCourse.toObject(), id: updatedCourse._id };
    res.json(formatted);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const id = req.params.id;
    
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
