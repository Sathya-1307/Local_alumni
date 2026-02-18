// backend/routes/requesterFeedback.js - Requester Feedback Routes
const express = require('express');
const placementDB = require('../config/placementDB');

const mongoose = require('mongoose');

const router = express.Router();

// Requester Feedback Schema (based on your table design)
const requesterFeedbackSchema = new mongoose.Schema({
  feedback_id: {
    type: Number,
    unique: true,
    required: true
  },
  alumni_user_id: {
    type: String, // MongoDB _id as string (references users table)
    required: true
  },
  request_id: {
    type: Number, // References placement_data_requests.request_id
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
  collection: "requester_feedback",
  timestamps: true
});

const RequesterFeedback = placementDB.model("RequesterFeedback", requesterFeedbackSchema);

// ========== HELPER FUNCTION - Get Next Feedback ID ==========
const getNextFeedbackId = async () => {
  const lastFeedback = await RequesterFeedback.findOne().sort({ feedback_id: -1 });
  return lastFeedback ? lastFeedback.feedback_id + 1 : 1;
};

// POST: Submit requester feedback
router.post("/submit-feedback", async (req, res) => {
  try {
    console.log("📝 Received requester feedback submission:", req.body);

    const { alumni_user_id, request_id, feedback_text } = req.body;

    // Validation
    if (!alumni_user_id) {
      return res.status(400).json({
        success: false,
        message: "Alumni User ID is required"
      });
    }

    if (!request_id) {
      return res.status(400).json({
        success: false,
        message: "Request ID is required"
      });
    }

    // Verify that the request_id exists in placement_data_requests
    const JobRequest = placementDB.model('JobRequest');
    const jobRequest = await JobRequest.findOne({ request_id: request_id });

    if (!jobRequest) {
      return res.status(404).json({
        success: false,
        message: "Job request not found with this request_id"
      });
    }

    // Verify that alumni_user_id matches the job request
    if (jobRequest.alumni_user_id !== alumni_user_id) {
      return res.status(400).json({
        success: false,
        message: "Alumni user ID does not match the job request"
      });
    }

    // Get next auto-increment feedback_id
    const nextFeedbackId = await getNextFeedbackId();

    // Create new feedback entry
    const newFeedback = new RequesterFeedback({
      feedback_id: nextFeedbackId,
      alumni_user_id: alumni_user_id,
      request_id: request_id,
      feedback_text: feedback_text || ""
    });

    await newFeedback.save();
    
    console.log("✅ Requester feedback saved successfully!");
    console.log("Feedback ID:", newFeedback.feedback_id);
    console.log("MongoDB _id:", newFeedback._id);

    res.status(201).json({
      success: true,
      message: "Requester feedback submitted successfully!",
      feedback: {
        feedback_id: newFeedback.feedback_id,
        _id: newFeedback._id,
        alumni_user_id: newFeedback.alumni_user_id,
        request_id: newFeedback.request_id,
        feedback_text: newFeedback.feedback_text,
        submitted_on: newFeedback.submitted_on
      }
    });

  } catch (error) {
    console.error("❌ Error submitting requester feedback:", error);
    console.error("Error details:", error.message);
    
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

// GET all requester feedbacks with user details
router.get("/", async (req, res) => {
  try {
    const feedbacks = await RequesterFeedback.find().sort({ feedback_id: -1 });
    
    // Get user details from 'test' database
    const memberCollection = mongoose.connection.client
      .db("test")
      .collection("members");
    
    const enrichedFeedbacks = await Promise.all(
      feedbacks.map(async (feedback) => {
        let member = null;
        let jobRequest = null;
        
        try {
          member = await memberCollection.findOne({
            _id: new mongoose.Types.ObjectId(feedback.alumni_user_id)
          });
        } catch (err) {
          console.log('Invalid ObjectId:', feedback.alumni_user_id);
        }
        
        // Get job request details
        const JobRequest = placementDB.model('JobRequest');
        jobRequest = await JobRequest.findOne({ request_id: feedback.request_id });
        
        return {
          ...feedback.toObject(),
          userName: member?.basic?.name || 'N/A',
          userBatch: member?.basic?.label || 'N/A',
          userContact: member?.contact_details?.mobile || 'N/A',
          userEmail: member?.basic?.email_id || 'N/A',
          requestCompany: jobRequest?.company || 'N/A',
          requestLocation: jobRequest?.location || 'N/A',
          requestStatus: jobRequest?.status || 'N/A'
        };
      })
    );
    
    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks: enrichedFeedbacks
    });
  } catch (error) {
    console.error("❌ Error fetching requester feedbacks:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching feedback",
      error: error.message
    });
  }
});

// GET feedback by feedback_id (auto-increment ID)
router.get("/id/:feedback_id", async (req, res) => {
  try {
    const feedback_id = parseInt(req.params.feedback_id);
    
    if (isNaN(feedback_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID format"
      });
    }
    
    const feedback = await RequesterFeedback.findOne({ feedback_id: feedback_id });
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }
    
    res.json({
      success: true,
      feedback: feedback
    });
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
    
    const feedback = await RequesterFeedback.findById(id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }
    
    res.json({
      success: true,
      feedback: feedback
    });
  } catch (error) {
    console.error("❌ Error fetching feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching feedback",
      error: error.message
    });
  }
});

// GET feedbacks by alumni_user_id
router.get("/user/:alumni_user_id", async (req, res) => {
  try {
    const alumni_user_id = req.params.alumni_user_id;
    
    const feedbacks = await RequesterFeedback.find({ alumni_user_id: alumni_user_id }).sort({ feedback_id: -1 });
    
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

// GET feedbacks by request_id
router.get("/request/:request_id", async (req, res) => {
  try {
    const request_id = parseInt(req.params.request_id);
    
    if (isNaN(request_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID format"
      });
    }
    
    const feedbacks = await RequesterFeedback.find({ request_id: request_id }).sort({ feedback_id: -1 });
    
    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks: feedbacks
    });
  } catch (error) {
    console.error("❌ Error fetching request feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching request feedback",
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
    
    const updatedFeedback = await RequesterFeedback.findOneAndUpdate(
      { feedback_id: feedback_id },
      { 
        feedback_text: feedback_text,
        submitted_on: new Date()
      },
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
    
    const deletedFeedback = await RequesterFeedback.findOneAndDelete({ feedback_id: feedback_id });
    
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