// controllers/mentorMenteeController.js
const MentorRegistration = require("../models/MentorRegistration");
const MenteeRequest = require("../models/MenteeRequest");
const MentorMenteeAssignment = require("../models/MentorMenteeAssignment");
const User = require("../models/User");
const Phase = require("../models/Phase"); 

const getCurrentPhaseId = async () => {
  try {
    const today = new Date();
    const currentPhase = await Phase.findOne({
      startDate: { $lte: today },
      endDate: { $gte: today }
    });
    
    if (currentPhase) {
      console.log(`Current active phase found: ${currentPhase.phaseId} (${currentPhase.name})`);
      return currentPhase.phaseId;
    } else {
      console.log("No active phase found for today's date");
      return null;
    }
  } catch (err) {
    console.error("Error getting current phase:", err);
    return null;
  }
};

// ================================
// GET ALL MENTORS
// ================================
// ================================
// GET ALL MENTORS FOR CURRENT PHASE
// ================================
exports.getMentors = async (req, res) => {
  try {
    // Get current phase ID based on today's date
    const currentPhaseId = await getCurrentPhaseId();
    
    // Build query - always filter by current phase
    let query = {};
    if (currentPhaseId) {
      query.phaseId = currentPhaseId;
      console.log(`Fetching mentors for current phase ID: ${currentPhaseId}`);
    } else {
      // If no current phase, return empty array or all mentors?
      // Based on your requirement, I'm returning empty array
      console.log("No current phase active. Returning empty mentors list.");
      return res.json([]);
    }
    
    const mentors = await MentorRegistration.find(query);
    console.log(`Found ${mentors.length} mentors for current phase`);

    const formatted = await Promise.all(
      mentors.map(async (m) => {
        const user = await User.findById(m.mentor_id);

        return {
          user_id: user?._id || m.mentor_id || null,
          name: user?.basic?.name || "Unknown Mentor",
          email: user?.basic?.email_id || "No email found",
          areas_of_interest: m.areas_of_interest || "Not specified",
          // Don't need to send phaseId to frontend since it's auto-filtered
        };
      })
    );

    res.json(formatted);

  } catch (err) {
    console.error("Error fetching mentors:", err);
    res.status(500).json({ message: "Server error fetching mentors" });
  }
};


// ================================
// GET ALL PENDING MENTEES
// ================================
// GET ALL PENDING MENTEES FOR CURRENT PHASE
// ================================
exports.getMentees = async (req, res) => {
  try {
    // Get current phase ID based on today's date
    const currentPhaseId = await getCurrentPhaseId();
    
    // Build query - always filter by current phase
    let query = { status: "pending" };
    if (currentPhaseId) {
      query.phaseId = currentPhaseId;
      console.log(`Fetching mentees for current phase ID: ${currentPhaseId}`);
    } else {
      // If no current phase, return empty array
      console.log("No current phase active. Returning empty mentees list.");
      return res.json([]);
    }
    
    const mentees = await MenteeRequest.find(query);
    console.log(`Found ${mentees.length} mentees for current phase`);

    // Get already assigned mentees for the current phase
    const assigned = await MentorMenteeAssignment.find({ 
      phaseId: currentPhaseId 
    });
    const assignedIds = assigned.flatMap(a => a.mentee_user_ids.map(id => id.toString()));

    const formatted = await Promise.all(
      mentees.map(async (m) => {
        const user = await User.findById(m.mentee_user_id);

        return {
          user_id: user?._id || m.mentee_user_id,
          name: user?.basic?.name || "Unknown Mentee",
          email: user?.basic?.email_id || "No email",
          area_of_interest: m.area_of_interest || "Not specified",
          assigned: assignedIds.includes(m.mentee_user_id.toString()),
          // Don't need to send phaseId to frontend
        };
      })
    );

    res.json(formatted);

  } catch (err) {
    console.error("Error fetching mentees:", err);
    res.status(500).json({ message: "Server error fetching mentees" });
  }
};


// ================================
// ASSIGN MENTOR (UPDATED)
// ================================
// In your assignMentor controller
exports.assignMentor = async (req, res) => {
  try {
    const { mentor_user_id, mentee_user_ids } = req.body;
    
    // Get current phase ID automatically
    const currentPhaseId = await getCurrentPhaseId();
    
    if (!currentPhaseId) {
      return res.status(400).json({ 
        message: "Cannot assign mentor: No active phase found" 
      });
    }
    
    // Create assignment with auto-determined phaseId
    const assignment = new MentorMenteeAssignment({
      mentor_user_id,
      mentee_user_ids,
      phaseId: currentPhaseId, // Use the auto-determined phase ID
      assignedDate: new Date(),
    });
    
    await assignment.save();
    
    // You can also update the frontend's formData.phaseId if needed
    res.json({ 
      success: true, 
      message: "Mentor assigned successfully",
      phaseId: currentPhaseId 
    });
    
  } catch (err) {
    console.error("Error assigning mentor:", err);
    res.status(500).json({ message: "Server error assigning mentor" });
  }
};