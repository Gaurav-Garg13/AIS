import Grade from "../models/Grade.js";

export const getGrades = async (req, res) => {
  try {
    const grades = await Grade.find({ userId: req.user._id });
    res.json(grades);
  } catch (error) {
    console.error("Error reading grades:", error);
    res.status(500).json({ error: "Failed to load grades" });
  }
};

export const updateGrades = async (req, res) => {
  try {
    const gradesData = req.body;
    
    // Clear existing grades
    await Grade.deleteMany({ userId: req.user._id });
    
    // Insert new grades
    if (gradesData && Array.isArray(gradesData) && gradesData.length > 0) {
      const gradesToInsert = gradesData.map(g => ({
        ...g,
        userId: req.user._id
      }));
      await Grade.insertMany(gradesToInsert);
    }
    
    const updatedGrades = await Grade.find({ userId: req.user._id });
    res.json(updatedGrades);
  } catch (error) {
    console.error("Error updating grades:", error);
    res.status(500).json({ error: "Failed to update grades" });
  }
};

export const createGrade = async (req, res) => {
  try {
    const { title, courseId, score, total } = req.body;
    
    if (!title || score == null || total == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newGrade = await Grade.create({
      userId: req.user._id,
      title,
      courseId,
      score: Number(score),
      total: Number(total),
      date: new Date(),
    });

    res.status(201).json(newGrade);
  } catch (error) {
    console.error("Error creating grade:", error);
    res.status(500).json({ error: "Failed to create grade" });
  }
};

export const updateGrade = async (req, res) => {
  try {
    const id = req.params.code; // code or id
    const payload = req.body;

    let grade;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      grade = await Grade.findOneAndUpdate(
        { _id: id, userId: req.user._id },
        payload,
        { returnDocument: 'after' }
      );
    }
    
    if (!grade) {
      return res.status(404).json({ error: "Grade not found" });
    }

    res.json(grade);
  } catch (error) {
    console.error("Error updating grade:", error);
    res.status(500).json({ error: "Failed to update grade" });
  }
};
