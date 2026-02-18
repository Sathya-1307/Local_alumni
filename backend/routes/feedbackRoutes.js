// backend/routes/feedback.js - AUTO-INCREMENT WITHOUT COUNTER COLLECTION
const express = require("express");
const placementDB = require('../config/placementDB');

const mongoose = require("mongoose");

const router = express.Router();

// Placement Feedback Schema with feedback_id
const placementFeedbackSchema = new mongoose.Schema({
  feedback_id: {
    type: Number,
    unique: true,
    required: true
  },
  user_id: {
    type: String, // MongoDB _id as string
    required: true
  },
  feedback_text: {
    type: String,
    required: false
  },
  submitted_on: {
    type: Date,
    default: Date.now
  }
}, {
  collection: "placement_feedback",
  timestamps: true
});

const PlacementFeedback = placementDB.model("PlacementFeedback", placementFeedbackSchema);

// ========== HELPER FUNCTION - Get Next Feedback ID ==========
const getNextFeedbackId = async () => {
  const lastFeedback = await PlacementFeedback.findOne().sort({ feedback_id: -1 });
  return lastFeedback ? lastFeedback.feedback_id + 1 : 1;
};

// POST: Submit placement feedback
router.post("/submit-feedback", async (req, res) => {
  try {
    console.log("📝 Received feedback submission:", req.body);

    const { user_id, feedback_text } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const nextFeedbackId = await getNextFeedbackId();

    const newFeedback = new PlacementFeedback({
      feedback_id: nextFeedbackId,
      user_id: user_id,
      feedback_text: feedback_text || ""
    });

    await newFeedback.save();

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully!",
      feedback: {
        feedback_id: newFeedback.feedback_id,
        _id: newFeedback._id,
        user_id: newFeedback.user_id,
        feedback_text: newFeedback.feedback_text,
        submitted_on: newFeedback.submitted_on
      }
    });

  } catch (error) {
    console.error("❌ Error submitting feedback:", error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate entry",
        error: "This feedback already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while submitting feedback",
      error: error.message
    });
  }
});

// GET all feedbacks
router.get("/", async (req, res) => {
  try {
    const feedbacks = await PlacementFeedback.find().sort({ feedback_id: -1 });
    
    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks: feedbacks
    });
  } catch (error) {
    console.error("❌ Error fetching feedbacks:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching feedback",
      error: error.message
    });
  }
});

// GET feedback by feedback_id
router.get("/id/:feedback_id", async (req, res) => {
  try {
    const feedback_id = parseInt(req.params.feedback_id);
    
    if (isNaN(feedback_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID format"
      });
    }

    const feedback = await PlacementFeedback.findOne({ feedback_id: feedback_id });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }

    res.json({ success: true, feedback: feedback });
  } catch (error) {
    console.error("❌ Error fetching feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching feedback",
      error: error.message
    });
  }
});

// GET feedback by MongoDB _id
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid MongoDB ID format"
      });
    }

    const feedback = await PlacementFeedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }

    res.json({ success: true, feedback: feedback });
  } catch (error) {
    console.error("❌ Error fetching feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching feedback",
      error: error.message
    });
  }
});

// GET feedbacks by user_id
router.get("/user/:user_id", async (req, res) => {
  try {
    const user_id = req.params.user_id;

    const feedbacks = await PlacementFeedback.find({ user_id: user_id }).sort({ feedback_id: -1 });

    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks: feedbacks
    });
  } catch (error) {
    console.error("❌ Error fetching user feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user feedback",
      error: error.message
    });
  }
});

// PUT: Update feedback by feedback_id
router.put("/id/:feedback_id", async (req, res) => {
  try {
    const feedback_id = parseInt(req.params.feedback_id);
    const { feedback_text } = req.body;

    if (isNaN(feedback_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID format"
      });
    }

    const updatedFeedback = await PlacementFeedback.findOneAndUpdate(
      { feedback_id: feedback_id },
      { feedback_text: feedback_text, submitted_on: new Date() },
      { new: true }
    );

    if (!updatedFeedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }

    res.json({
      success: true,
      message: "Feedback updated successfully",
      feedback: updatedFeedback
    });
  } catch (error) {
    console.error("❌ Error updating feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating feedback",
      error: error.message
    });
  }
});

// DELETE: Delete feedback by feedback_id
router.delete("/id/:feedback_id", async (req, res) => {
  try {
    const feedback_id = parseInt(req.params.feedback_id);

    if (isNaN(feedback_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID format"
      });
    }

    const deletedFeedback = await PlacementFeedback.findOneAndDelete({ feedback_id: feedback_id });

    if (!deletedFeedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }

    res.json({
      success: true,
      message: "Feedback deleted successfully",
      feedback: deletedFeedback
    });
  } catch (error) {
    console.error("❌ Error deleting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting feedback",
      error: error.message
    });
  }
});

module.exports = router;
