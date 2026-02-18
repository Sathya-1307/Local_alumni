const mongoose = require("mongoose"); 
const MeetingSchedule = require("../models/MeetingSchedule");
const MentorMenteeAssignment = require("../models/MentorMenteeAssignment");
const MeetingStatus = require("../models/MeetingStatus");
const User = require("../models/User");

// ----------------------------------------------
// GET mentor details + assigned mentees
// ----------------------------------------------
exports.getMentorDetails = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Mentor email required" });

    const mentor = await User.findOne({
      "basic.email_id": { $regex: new RegExp(`^${email.trim().toLowerCase()}$`, "i") }
    });

    if (!mentor) return res.status(404).json({ message: "Mentor not found" });

    const assignment = await MentorMenteeAssignment.findOne({ mentor_user_id: mentor._id });

    let assignedMentees = [];
    let commencement_date = null;
    let end_date = null;

    if (assignment) {
      commencement_date = assignment.commencement_date;
      end_date = assignment.end_date;

      assignedMentees = await User.find({
        _id: { $in: assignment.mentee_user_ids }
      }).select("basic.name basic.email_id");

      assignedMentees = assignedMentees.map(m => ({
        _id: m._id,
        name: m.basic?.name || "",
        email: m.basic?.email_id || ""
      }));
    }

    res.json({
      mentor: {
        _id: mentor._id,
        name: mentor.basic?.name || "",
        email: mentor.basic?.email_id || ""
      },
      commencement_date,
      end_date,
      assignedMentees
    });

  } catch (err) {
    console.error("GET MENTOR DETAILS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------
// SCHEDULE meeting for MULTIPLE mentees
// ----------------------------------------------
exports.scheduleMeeting = async (req, res) => {
  try {
    const {
      mentor_user_id,
      mentee_user_ids,
      meeting_dates,
      meeting_time,
      duration_minutes,
      platform,
      meeting_link,
      agenda,
      preferred_day,
      number_of_meetings,
      phaseId  // ✅ Added phaseId
    } = req.body;

    // ✅ Validate phaseId first
    if (!phaseId) {
      return res.status(400).json({ message: "phaseId is required" });
    }

    const phaseIdNum = Number(phaseId);
    if (isNaN(phaseIdNum) || phaseIdNum <= 0) {
      return res.status(400).json({ message: "Invalid phaseId" });
    }

    // Validate other required fields
    if (
      !mentor_user_id ||
      !Array.isArray(mentee_user_ids) || mentee_user_ids.length === 0 ||
      !Array.isArray(meeting_dates) || meeting_dates.length === 0 ||
      !meeting_time ||
      !duration_minutes ||
      !platform
    ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Validate meeting dates format
    const validDates = meeting_dates.every(date => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    });
    
    if (!validDates) {
      return res.status(400).json({ message: "Invalid date format in meeting_dates" });
    }

    // Map each date to an object with unique meeting_id
    const meetingDatesWithId = meeting_dates.map(d => ({
      date: new Date(d),
      meeting_id: new mongoose.Types.ObjectId()
    }));

    // ✅ Create meeting with phaseId included
    const newMeeting = new MeetingSchedule({
      mentor_user_id,
      mentee_user_ids,
      meeting_dates: meetingDatesWithId,
      meeting_time,
      duration_minutes,
      platform,
      meeting_link: meeting_link || null,
      agenda: agenda || null,
      preferred_day: preferred_day || null,
      number_of_meetings: number_of_meetings || meetingDatesWithId.length,
      phaseId: phaseIdNum,  // ✅ Added phaseId
      status: "scheduled",  // Optional: Add status field
      createdAt: new Date()  // Optional: Add timestamp
    });

    await newMeeting.save();

    res.status(201).json({
      message: "Meeting scheduled successfully",
      meeting_dates: newMeeting.meeting_dates,
      phaseId: newMeeting.phaseId  // ✅ Return phaseId in response
    });

  } catch (err) {
    console.error("SCHEDULE MEETING ERROR:", err);
    
    // Handle duplicate key errors or validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: err.errors 
      });
    }
    
    if (err.code === 11000) { // MongoDB duplicate key error
      return res.status(400).json({ 
        message: "Duplicate meeting detected" 
      });
    }
    
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ----------------------------------------------
// GET meeting by ID for editing
// ----------------------------------------------
exports.getMeetingById = async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    if (!meetingId) {
      return res.status(400).json({ message: "Meeting ID is required" });
    }

    const meeting = await MeetingSchedule.findOne({
      "meeting_dates.meeting_id": new mongoose.Types.ObjectId(meetingId)
    })
    .populate("mentor_user_id", "basic.name basic.email_id")
    .populate("mentee_user_ids", "basic.name basic.email_id");

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Find the specific date entry
    const dateEntry = meeting.meeting_dates.find(d => 
      d.meeting_id && d.meeting_id.toString() === meetingId
    );

    if (!dateEntry) {
      return res.status(404).json({ message: "Meeting date not found" });
    }

    res.json({
      meeting: {
        _id: meeting._id,
        mentor: {
          _id: meeting.mentor_user_id._id,
          name: meeting.mentor_user_id.basic?.name || "",
          email: meeting.mentor_user_id.basic?.email_id || ""
        },
        mentees: meeting.mentee_user_ids.map(m => ({
          _id: m._id,
          name: m.basic?.name || "",
          email: m.basic?.email_id || ""
        })),
        date: dateEntry.date,
        meeting_id: dateEntry.meeting_id,
        time: meeting.meeting_time,
        duration_minutes: meeting.duration_minutes,
        platform: meeting.platform,
        meeting_link: meeting.meeting_link || "",
        agenda: meeting.agenda || "",
        preferred_day: meeting.preferred_day || "",
        number_of_meetings: meeting.number_of_meetings,
        all_dates: meeting.meeting_dates.map(d => ({
          date: d.date,
          meeting_id: d.meeting_id
        }))
      }
    });

  } catch (err) {
    console.error("GET MEETING BY ID ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------
// UPDATE meeting details (Mentor-only)
// ----------------------------------------------
// ----------------------------------------------
// UPDATE meeting details (Mentor-only)
// ----------------------------------------------
exports.updateMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const {
      meeting_date,
      meeting_time,
      duration_minutes,
      platform,
      meeting_link,
      agenda,
      mentee_user_ids,
      preferred_day,
      number_of_meetings,
      update_all_dates // Optional: if true, updates all dates in the series
    } = req.body;

    if (!meetingId) {
      return res.status(400).json({ message: "Meeting ID is required" });
    }

    // Find the meeting that contains this meeting_id in its dates array
    const meeting = await MeetingSchedule.findOne({
      "meeting_dates.meeting_id": new mongoose.Types.ObjectId(meetingId)
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const updateData = {};

    // Update meeting time if provided
    if (meeting_time !== undefined) {
      updateData.meeting_time = meeting_time;
    }

    // Update duration if provided
    if (duration_minutes !== undefined) {
      updateData.duration_minutes = duration_minutes;
    }

    // Update platform if provided
    if (platform !== undefined) {
      updateData.platform = platform;
    }

    // Update meeting link if provided
    if (meeting_link !== undefined) {
      updateData.meeting_link = meeting_link;
    }

    // Update agenda if provided
    if (agenda !== undefined) {
      updateData.agenda = agenda;
    }

    // Update mentees if provided
    if (mentee_user_ids !== undefined && Array.isArray(mentee_user_ids)) {
      updateData.mentee_user_ids = mentee_user_ids;
    }

    // Update preferred day if provided
    if (preferred_day !== undefined) {
      updateData.preferred_day = preferred_day;
    }

    // Update number of meetings if provided
    if (number_of_meetings !== undefined) {
      updateData.number_of_meetings = number_of_meetings;
    }

    // Update meeting dates
    if (meeting_date !== undefined) {
      const newDate = new Date(meeting_date);
      
      if (update_all_dates === true) {
        // Update all dates in the series (for recurring meetings)
        const dateDifference = newDate.getTime() - meeting.meeting_dates[0].date.getTime();
        
        const updatedDates = meeting.meeting_dates.map(d => ({
          date: new Date(d.date.getTime() + dateDifference),
          meeting_id: d.meeting_id
        }));
        
        updateData.meeting_dates = updatedDates;
      } else {
        // Update only the specific date
        const dateIndex = meeting.meeting_dates.findIndex(d => 
          d.meeting_id && d.meeting_id.toString() === meetingId
        );
        
        if (dateIndex !== -1) {
          const updatedDates = [...meeting.meeting_dates];
          updatedDates[dateIndex].date = newDate;
          updateData.meeting_dates = updatedDates;
        }
      }
    }

    // Apply updates - REMOVED POPULATE for now to fix the error
    const updatedMeeting = await MeetingSchedule.findByIdAndUpdate(
      meeting._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedMeeting) {
      return res.status(404).json({ message: "Meeting update failed" });
    }

    // Find the updated date entry
    const updatedDateEntry = updatedMeeting.meeting_dates.find(d => 
      d.meeting_id && d.meeting_id.toString() === meetingId
    );

    // Get mentor and mentees details separately
    const mentor = await User.findById(updatedMeeting.mentor_user_id);
    const mentees = await User.find({ _id: { $in: updatedMeeting.mentee_user_ids } });

    const responseData = {
      message: "Meeting updated successfully",
      meeting: {
        _id: updatedMeeting._id,
        mentor: mentor ? {
          _id: mentor._id,
          name: mentor.basic?.name || "",
          email: mentor.basic?.email_id || ""
        } : null,
        mentees: mentees.map(m => ({
          _id: m._id,
          name: m.basic?.name || "",
          email: m.basic?.email_id || ""
        })),
        date: updatedDateEntry?.date,
        meeting_id: updatedDateEntry?.meeting_id,
        time: updatedMeeting.meeting_time,
        duration_minutes: updatedMeeting.duration_minutes,
        platform: updatedMeeting.platform,
        meeting_link: updatedMeeting.meeting_link,
        agenda: updatedMeeting.agenda,
        preferred_day: updatedMeeting.preferred_day,
        number_of_meetings: updatedMeeting.number_of_meetings
      }
    };

    res.json(responseData);

  } catch (err) {
    console.error("UPDATE MEETING ERROR:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// ----------------------------------------------
// DELETE meeting
// ----------------------------------------------
exports.deleteMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    if (!meetingId) {
      return res.status(400).json({ message: "Meeting ID is required" });
    }

    // Find the meeting that contains this meeting_id
    const meeting = await MeetingSchedule.findOne({
      "meeting_dates.meeting_id": new mongoose.Types.ObjectId(meetingId)
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // If this is the only date in the meeting, delete the entire meeting
    if (meeting.meeting_dates.length === 1) {
      await MeetingSchedule.findByIdAndDelete(meeting._id);
    } else {
      // Remove only this date from the meeting_dates array
      await MeetingSchedule.findByIdAndUpdate(
        meeting._id,
        {
          $pull: {
            meeting_dates: { meeting_id: new mongoose.Types.ObjectId(meetingId) }
          },
          $inc: { number_of_meetings: -1 }
        }
      );
    }

    // Also delete related meeting status entries
    await MeetingStatus.deleteMany({ meeting_id: meetingId });

    res.json({
      message: "Meeting deleted successfully"
    });

  } catch (err) {
    console.error("DELETE MEETING ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------
// GET all scheduled meetings
// ----------------------------------------------
exports.getScheduledMeetings = async (req, res) => {
  try {
    const meetings = await MeetingSchedule.find().populate("mentor_user_id mentee_user_ids");
    res.json({ meetings });
  } catch (err) {
    console.error("GET SCHEDULED MEETINGS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------
// FILTER meetings BY user email
// Handles both mentor and mentee roles
// ----------------------------------------------
exports.getScheduledByUser = async (req, res) => {
  try {
    const email = req.params.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required", meetings: [] });

    // Find user
    const user = await User.findOne({ "basic.email_id": email });
    if (!user) return res.json({ message: "User not found", meetings: [] });

    let meetingsList = [];

    // ============================
    // 1) MENTOR CASE
    // ============================
    const mentorAssignments = await MentorMenteeAssignment.find({ mentor_user_id: user._id });
    if (mentorAssignments.length > 0) {
      const assignedMentees = [];

      for (const assignment of mentorAssignments) {
        for (const menteeId of assignment.mentee_user_ids) {
          const mentee = await User.findById(menteeId);
          if (mentee) {
            assignedMentees.push({
              _id: mentee._id,
              name: mentee.basic?.name || "Unknown",
              email: mentee.basic?.email_id || ""
            });
          }
        }
      }

      // Load Meetings
      const meetingSchedule = await MeetingSchedule.find({ mentor_user_id: user._id });

      meetingsList = meetingSchedule.map((meeting) => ({
        _id: meeting._id,
        mentor: {
          _id: user._id,
          name: user.basic?.name || "Unknown Mentor",
          email: user.basic?.email_id || ""
        },
        mentees: meeting.mentee_user_ids.map((id) => {
          const m = assignedMentees.find((x) => x._id.toString() === id.toString());
          return m || { _id: id, name: "Unknown", email: "" };
        }),
        time: meeting.meeting_time || "",
        duration_minutes: meeting.duration_minutes || "",
        dates: (meeting.meeting_dates || []).map((d, index) => ({
          date: d.date ? new Date(d.date).toISOString() : null,
          meeting_id: d.meeting_id?.toString() || `${meeting._id}_${index}`
        })),
        agenda: meeting.agenda || "-",
        platform: meeting.platform || "-",
        meeting_link: meeting.meeting_link || "",
        preferred_day: meeting.preferred_day || "",
        number_of_meetings: meeting.number_of_meetings || 1
      }));

      return res.json({
        role: "mentor",
        mentor: {
          _id: user._id,
          name: user.basic?.name || "Unknown Mentor",
          email: user.basic?.email_id || ""
        },
        mentees: assignedMentees,
        meetings: meetingsList
      });
    }

    // ============================
    // 2) MENTEE CASE
    // ============================
    const menteeMeetings = await MeetingSchedule.find({ mentee_user_ids: user._id });

    if (menteeMeetings.length === 0) {
      return res.json({ role: "mentee", mentor: null, mentees: [], meetings: [] });
    }

    let mentorInfo = null;

    const meetingsForMentee = [];

    for (const meeting of menteeMeetings) {
      const mentor = await User.findById(meeting.mentor_user_id);
      if (!mentor) continue;

      if (!mentorInfo) {
        mentorInfo = {
          _id: mentor._id,
          name: mentor.basic?.name || "Unknown Mentor",
          email: mentor.basic?.email_id || ""
        };
      }

      // Include all mentees in this meeting
      const allMentees = await User.find({ _id: { $in: meeting.mentee_user_ids } });
      const menteesOfMeeting = allMentees.map((mt) => ({
        _id: mt._id,
        name: mt.basic?.name || "Mentee",
        email: mt.basic?.email_id || ""
      }));

      meetingsForMentee.push({
        _id: meeting._id,
        mentor: mentorInfo,
        mentees: menteesOfMeeting,
        time: meeting.meeting_time || "",
        duration_minutes: meeting.duration_minutes || "",
        dates: (meeting.meeting_dates || []).map((d, index) => ({
          date: d.date ? new Date(d.date).toISOString() : null,
          meeting_id: d.meeting_id?.toString() || `${meeting._id}_${index}`
        })),
        agenda: meeting.agenda || "-",
        platform: meeting.platform || "-",
        meeting_link: meeting.meeting_link || "",
        preferred_day: meeting.preferred_day || "",
        number_of_meetings: meeting.number_of_meetings || 1
      });
    }

    return res.json({
      role: "mentee",
      mentor: mentorInfo,
      mentees: meetingsForMentee.flatMap(m => m.mentees),
      meetings: meetingsForMentee
    });

  } catch (error) {
    console.error("SCHEDULED BY USER ERROR:", error);
    res.status(500).json({ message: "Server error", meetings: [] });
  }
};

// ----------------------------------------------
// GET all meetings for a mentor (for edit dropdown)
// ----------------------------------------------
exports.getAllMeetingsForMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;
    
    if (!mentorId) {
      return res.status(400).json({ message: "Mentor ID is required" });
    }

    // Verify mentor exists
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    // Get all meetings for this mentor
    const meetings = await MeetingSchedule.find({ mentor_user_id: mentorId })
      .populate("mentor_user_id", "basic.name basic.email_id")
      .populate("mentee_user_ids", "basic.name basic.email_id");

    // Flatten meetings into individual date entries
    const flattenedMeetings = meetings.flatMap(meeting => 
      meeting.meeting_dates.map(dateEntry => ({
        _id: meeting._id,
        mentor: {
          _id: meeting.mentor_user_id._id,
          name: meeting.mentor_user_id.basic?.name || "",
          email: meeting.mentor_user_id.basic?.email_id || ""
        },
        mentees: meeting.mentee_user_ids.map(m => ({
          _id: m._id,
          name: m.basic?.name || "",
          email: m.basic?.email_id || ""
        })),
        date: dateEntry.date,
        meeting_id: dateEntry.meeting_id,
        time: meeting.meeting_time,
        duration_minutes: meeting.duration_minutes,
        platform: meeting.platform,
        meeting_link: meeting.meeting_link || "",
        agenda: meeting.agenda || "",
        preferred_day: meeting.preferred_day || "",
        number_of_meetings: meeting.number_of_meetings
      }))
    );

    // Sort by date (earliest first)
    flattenedMeetings.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      mentor: {
        _id: mentor._id,
        name: mentor.basic?.name || "",
        email: mentor.basic?.email_id || ""
      },
      meetings: flattenedMeetings
    });

  } catch (err) {
    console.error("GET ALL MEETINGS FOR MENTOR ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------
// GET mentor by email
// ----------------------------------------------
exports.getMentorByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const mentor = await User.findOne({
      "basic.email_id": { $regex: new RegExp(`^${email.trim().toLowerCase()}$`, "i") }
    });

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    // Check if user is actually a mentor
    const isMentor = await MentorMenteeAssignment.exists({ mentor_user_id: mentor._id });
    
    if (!isMentor) {
      return res.status(400).json({ message: "User is not a mentor" });
    }

    res.json({
      mentor: {
        _id: mentor._id,
        name: mentor.basic?.name || "",
        email: mentor.basic?.email_id || ""
      }
    });

  } catch (err) {
    console.error("GET MENTOR BY EMAIL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// NEW FUNCTION: Get mentor by mentee email
exports.getMentorByMenteeEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        message: "Mentee email is required" 
      });
    }

    // 1. Find mentee by email
    const mentee = await User.findOne({
      "basic.email_id": { $regex: new RegExp(`^${email.trim().toLowerCase()}$`, "i") }
    });

    if (!mentee) {
      return res.status(404).json({ message: "Mentee not found" });
    }

    // 2. Find which mentor is assigned to this mentee
    const assignment = await MentorMenteeAssignment.findOne({
      mentee_user_ids: mentee._id
    });

    if (!assignment) {
      return res.status(404).json({ message: "No mentor assigned" });
    }

    // 3. Get the mentor's details
    const mentor = await User.findById(assignment.mentor_user_id);

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    // 4. Get ALL mentees of this mentor
    const allAssignments = await MentorMenteeAssignment.find({
      mentor_user_id: mentor._id
    });

    // Collect all mentee IDs
    const allMenteeIds = [];
    allAssignments.forEach(assign => {
      allMenteeIds.push(...assign.mentee_user_ids);
    });

    // Get details of all mentees
    const assignedMentees = await User.find({
      _id: { $in: allMenteeIds }
    });

    // Format the response
    const response = {
      mentor: {
        _id: mentor._id,
        name: mentor.basic?.name || "",
        email: mentor.basic?.email_id || ""
      },
      assignedMentees: assignedMentees.map(m => ({
        _id: m._id,
        name: m.basic?.name || "",
        email: m.basic?.email_id || "",
        basic: {
          name: m.basic?.name || "",
          email_id: m.basic?.email_id || ""
        }
      })),
      commencement_date: assignment.commencement_date || "",
      end_date: assignment.end_date || ""
    };

    res.json(response);

  } catch (err) {
    console.error("GET MENTOR BY MENTEE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};