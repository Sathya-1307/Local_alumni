// controllers/dashboardController.js - UPDATED TO MATCH WORKING PATTERN
const Phase = require("../models/Phase");
const MenteeRequest = require("../models/MenteeRequest");
const MentorRegistration = require("../models/MentorRegistration");
const MentorMenteeAssignment = require("../models/MentorMenteeAssignment");
const MeetingSchedule = require("../models/MeetingSchedule");
const MeetingStatus = require("../models/MeetingStatus");
const ProgramFeedback = require("../models/ProgramFeedback");
const User = require("../models/User");

// ==================== GET ALL MENTORS WITH FORMATTED DATA ====================
exports.getAllMentors = async (req, res) => {
  try {
    console.log("🔍 Fetching all mentors...");
    
    // Get all mentor registrations
    const mentors = await MentorRegistration.find();
    console.log(`📊 Found ${mentors.length} mentor registrations`);

    // Format mentors with user details (following your working pattern)
    const formatted = await Promise.all(
      mentors.map(async (m) => {
        const user = await User.findById(m.mentor_id);
        console.log(`Looking up User for mentor_id: ${m.mentor_id} => ${user ? "Found" : "Not found"}`);

        return {
          _id: m._id,
          mentor_id: m.mentor_id,
          user_id: user?._id || m.mentor_id || null,
          name: user?.basic?.name || "Unknown Mentor",
          email: user?.basic?.email_id || "No email found",
          areas_of_interest: m.areas_of_interest || [],
          description: m.description || "",
          phaseId: m.phaseId || "N/A",
          createdAt: m.createdAt
        };
      })
    );

    console.log(`✅ Final mentors sent to frontend: ${formatted.length}`);
    res.json({ 
      success: true, 
      mentors: formatted,
      stats: {
        total: formatted.length,
        withName: formatted.filter(m => m.name !== "Unknown Mentor").length,
        withEmail: formatted.filter(m => m.email !== "No email found").length
      }
    });

  } catch (err) {
    console.error("❌ Error fetching mentors:", err);
    res.status(500).json({ success: false, message: "Server error fetching mentors" });
  }
};

// ==================== GET ALL MENTEES WITH FORMATTED DATA ====================
exports.getAllMentees = async (req, res) => {
  try {
    console.log("🔍 Fetching all mentees...");
    
    const mentees = await MenteeRequest.find();
    console.log(`📊 Found ${mentees.length} mentee requests`);

    // Get already assigned mentees
    const assignments = await MentorMenteeAssignment.find();
    const assignedIds = assignments.flatMap(a => 
      a.mentee_user_ids.map(id => id.toString())
    );

    const formatted = await Promise.all(
      mentees.map(async (m) => {
        const user = await User.findById(m.mentee_user_id);

        return {
          _id: m._id,
          mentee_user_id: m.mentee_user_id,
          user_id: user?._id || m.mentee_user_id,
          name: user?.basic?.name || "Unknown Mentee",
          email: user?.basic?.email_id || "No email found",
          area_of_interest: m.area_of_interest || "Not specified",
          description: m.description || "",
          phaseId: m.phaseId || "N/A",
          status: m.status || "pending",
          assigned: assignedIds.includes(m.mentee_user_id.toString()),
          createdAt: m.createdAt
        };
      })
    );

    console.log(`✅ Final mentees sent to frontend: ${formatted.length}`);
    res.json({ 
      success: true, 
      mentees: formatted,
      stats: {
        total: formatted.length,
        pending: formatted.filter(m => m.status === "pending").length,
        assigned: formatted.filter(m => m.assigned).length,
        unassigned: formatted.filter(m => !m.assigned).length
      }
    });

  } catch (err) {
    console.error("❌ Error fetching mentees:", err);
    res.status(500).json({ success: false, message: "Server error fetching mentees" });
  }
};

// ==================== GET ALL ASSIGNMENTS WITH FORMATTED DATA ====================
exports.getAllAssignments = async (req, res) => {
  try {
    console.log("🔍 Fetching all assignments...");
    
    const assignments = await MentorMenteeAssignment.find();
    console.log(`📊 Found ${assignments.length} assignments`);

    const formatted = await Promise.all(
      assignments.map(async (assignment) => {
        // Get mentor details
        const mentor = await User.findById(assignment.mentor_user_id);
        
        // Get all mentees details
        const mentees = await Promise.all(
          assignment.mentee_user_ids.map(async (menteeId) => {
            const mentee = await User.findById(menteeId);
            return {
              _id: menteeId,
              name: mentee?.basic?.name || "Unknown Mentee",
              email: mentee?.basic?.email_id || "No email"
            };
          })
        );

        return {
          _id: assignment._id,
          mentor_user_id: assignment.mentor_user_id,
          mentorDetails: {
            name: mentor?.basic?.name || "Unknown Mentor",
            email: mentor?.basic?.email_id || "No email"
          },
          mentees: mentees,
          commencement_date: assignment.commencement_date,
          end_date: assignment.end_date,
          phaseId: assignment.phaseId,
          createdAt: assignment.createdAt
        };
      })
    );

    console.log(`✅ Final assignments sent to frontend: ${formatted.length}`);
    res.json({ 
      success: true, 
      assignments: formatted,
      stats: {
        total: formatted.length,
        totalMentees: formatted.reduce((sum, a) => sum + a.mentees.length, 0),
        avgMenteesPerMentor: (formatted.reduce((sum, a) => sum + a.mentees.length, 0) / formatted.length).toFixed(1)
      }
    });

  } catch (err) {
    console.error("❌ Error fetching assignments:", err);
    res.status(500).json({ success: false, message: "Server error fetching assignments" });
  }
};

exports.getAllMeetings = async (req, res) => {
  try {
    console.log("🔍 Fetching all meetings...");

    const { dateFrom, dateTo, status } = req.query;

    // ---------------- FILTER FOR MEETING SCHEDULE ----------------
    const filter = {};
    if (dateFrom || dateTo) {
      filter["meeting_dates.date"] = {};
      if (dateFrom) filter["meeting_dates.date"].$gte = new Date(dateFrom);
      if (dateTo) filter["meeting_dates.date"].$lte = new Date(dateTo);
    }

    const meetings = await MeetingSchedule.find(filter);
    console.log(`📊 Found ${meetings.length} meeting schedules`);

    // ---------------- FORMAT MEETINGS ----------------
    const formatted = await Promise.all(
      meetings.map(async (meeting) => {
        const mentor = await User.findById(meeting.mentor_user_id);

        const mentees = await Promise.all(
          meeting.mentee_user_ids.map(async (menteeId) => {
            const mentee = await User.findById(menteeId);
            return {
              _id: menteeId,
              name: mentee?.basic?.name || "Unknown Mentee",
              email: mentee?.basic?.email_id || "No email"
            };
          })
        );

        // 🔴 IMPORTANT: get ALL statuses for this meeting
        const statusDocs = await MeetingStatus.find({
          meeting_id: meeting._id
        });

        // Decide display status (priority-based)
        let meetingStatus = "Scheduled";
        if (statusDocs.some(s => s.status === "In Progress")) {
          meetingStatus = "In Progress";
        } else if (statusDocs.some(s => s.status === "Scheduled")) {
          meetingStatus = "Scheduled";
        } else if (statusDocs.some(s => s.status === "Completed")) {
          meetingStatus = "Completed";
        } else if (statusDocs.some(s => s.status === "Postponed")) {
          meetingStatus = "Postponed";
        } else if (statusDocs.some(s => s.status === "Cancelled")) {
          meetingStatus = "Cancelled";
        }

        return {
          _id: meeting._id,
          mentor_user_id: meeting.mentor_user_id,
          mentorDetails: {
            name: mentor?.basic?.name || "Unknown Mentor",
            email: mentor?.basic?.email_id || "No email"
          },
          mentees,
          meeting_dates: meeting.meeting_dates || [],
          meeting_time: meeting.meeting_time,
          duration_minutes: meeting.duration_minutes,
          platform: meeting.platform,
          meeting_link: meeting.meeting_link,
          agenda: meeting.agenda,
          preferred_day: meeting.preferred_day,
          number_of_meetings: meeting.number_of_meetings,
          createdAt: meeting.createdAt,
          status: meetingStatus
        };
      })
    );

    // ---------------- STATUS FILTER ----------------
    let filteredMeetings = formatted;
    if (status && status !== "all") {
      filteredMeetings = formatted.filter(
        m => m.status.toLowerCase() === status.toLowerCase()
      );
    }

    // ---------------- ✅ STATUS COUNTS FROM MeetingStatus ----------------
    const meetingStatuses = await MeetingStatus.find();

    const stats = {
      total: meetingStatuses.length,
      completed: meetingStatuses.filter(s => s.status === "Completed").length,
      postponed: meetingStatuses.filter(
        s => s.status === "Postponed" || s.status === "Cancelled"
      ).length,
      scheduled: meetingStatuses.filter(
        s => s.status === "Scheduled" || s.status === "In Progress"
      ).length
    };

    console.log("✅ Meeting stats:", stats);

    res.json({
      success: true,
      meetings: filteredMeetings,
      stats
    });

  } catch (err) {
    console.error("❌ Error fetching meetings:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching meetings"
    });
  }
};


// ==================== GET ALL FEEDBACKS WITH FORMATTED DATA ====================
exports.getAllFeedbacks = async (req, res) => {
  try {
    console.log("🔍 Fetching all feedbacks...");
    
    const feedbacks = await ProgramFeedback.find();
    console.log(`📊 Found ${feedbacks.length} feedbacks`);

    const formatted = await Promise.all(
      feedbacks.map(async (feedback) => {
        const user = await User.findById(feedback.user_id);

        return {
          _id: feedback._id,
          user_id: feedback.user_id,
          userDetails: {
            name: user?.basic?.name || "Anonymous User",
            email: user?.basic?.email_id || "No email"
          },
          role: feedback.role,
          programOrganization: feedback.programOrganization,
          matchingProcess: feedback.matchingProcess,
          supportProvided: feedback.supportProvided,
          overallSatisfaction: feedback.overallSatisfaction,
          generalFeedback: feedback.generalFeedback,
          suggestions: feedback.suggestions,
          participateAgain: feedback.participateAgain,
          createdAt: feedback.createdAt
        };
      })
    );

    console.log(`✅ Final feedbacks sent to frontend: ${formatted.length}`);
    res.json({ 
      success: true, 
      feedbacks: formatted,
      stats: {
        total: formatted.length,
        mentors: formatted.filter(f => f.role === "mentor").length,
        mentees: formatted.filter(f => f.role === "mentee").length
      }
    });

  } catch (err) {
    console.error("❌ Error fetching feedbacks:", err);
    res.status(500).json({ success: false, message: "Server error fetching feedbacks" });
  }
};

// ==================== GET DASHBOARD STATISTICS ====================
exports.getDashboardStats = async (req, res) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Get counts using the same pattern
    const totalMentors = await MentorRegistration.countDocuments();
    const totalMentees = await MenteeRequest.countDocuments();
    
    // New this week
    const newMentorsThisWeek = await MentorRegistration.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });
    
    const newMenteesThisWeek = await MenteeRequest.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });
    
    // Get phase-wise counts
    const phases = await Phase.find().sort({ phaseId: 1 });
    const phaseStats = await Promise.all(
      phases.map(async (phase) => {
        const mentorCount = await MentorRegistration.countDocuments({ phaseId: phase.phaseId });
        const menteeCount = await MenteeRequest.countDocuments({ phaseId: phase.phaseId });
        
        return {
          phaseId: phase.phaseId,
          phaseName: phase.name,
          startDate: phase.startDate,
          endDate: phase.endDate,
          totalMentors: mentorCount,
          totalMentees: menteeCount
        };
      })
    );

    // Meeting stats
    const totalMeetings = await MeetingSchedule.countDocuments();
    const upcomingMeetings = await MeetingSchedule.countDocuments({
      'meeting_dates.date': { $gte: new Date() }
    });

    res.json({
      success: true,
      stats: {
        totalMentors,
        totalMentees,
        newMentorsThisWeek,
        newMenteesThisWeek,
        totalMeetings,
        upcomingMeetings,
        phaseStats
      },
      lastUpdated: new Date()
    });

  } catch (err) {
    console.error("❌ Error fetching dashboard stats:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==================== GET RECENT ACTIVITY ====================
exports.getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Recent mentor registrations
    const recentMentors = await MentorRegistration.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    
    const activities = await Promise.all(
      recentMentors.map(async (mentor) => {
        const user = await User.findById(mentor.mentor_id);
        return {
          type: 'mentor_registration',
          user: user?.basic?.name || "New Mentor",
          email: user?.basic?.email_id || "",
          timestamp: mentor.createdAt,
          message: 'registered as a mentor'
        };
      })
    );

    res.json({
      success: true,
      activities: activities.slice(0, limit)
    });

  } catch (err) {
    console.error("❌ Error fetching recent activity:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==================== DEBUG: CHECK USER DATA ====================
exports.debugUserData = async (req, res) => {
  try {
    // Check a specific mentor from your data
    const mentorId = "68dfc1c151c797667a437b54"; // From your example
    const user = await User.findById(mentorId);
    
    // Check mentor registration
    const mentorReg = await MentorRegistration.findOne({ mentor_id: mentorId });
    
    // Check all users structure
    const allUsers = await User.find().limit(3);
    
    res.json({
      success: true,
      debug: {
        userExists: !!user,
        userData: user ? {
          _id: user._id,
          hasBasic: !!user.basic,
          basicFields: user.basic ? Object.keys(user.basic) : [],
          name: user.basic?.name,
          email: user.basic?.email_id
        } : null,
        mentorRegistration: mentorReg,
        sampleUsers: allUsers.map(u => ({
          _id: u._id,
          name: u.basic?.name,
          email: u.basic?.email_id
        }))
      }
    });

  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// controllers/dashboardController.js - ADD THESE NEW FUNCTIONS AT THE END

// ==================== DASHBOARD SUMMARY (For Cards Display) ====================
exports.getDashboardSummary = async (req, res) => {
  try {
    console.log("📊 Fetching dashboard summary...");
    
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Get all counts in parallel
    const [
      totalMentors,
      totalMentees,
      totalMeetings,
      assignments
    ] = await Promise.all([
      MentorRegistration.countDocuments(),
      MenteeRequest.countDocuments(),
      MeetingSchedule.countDocuments(),
      MentorMenteeAssignment.find()
    ]);
    
    // Calculate assigned mentees
    const assignedMentees = assignments.reduce((sum, assignment) => 
      sum + assignment.mentee_user_ids.length, 0);
    
    // Get meeting status counts
    const meetings = await MeetingSchedule.find();
    let completedMeetings = 0;
    let postponedMeetings = 0;
    let upcomingMeetings = 0;
    
    for (const meeting of meetings) {
      if (meeting.meeting_dates && meeting.meeting_dates.length > 0) {
        for (const dateObj of meeting.meeting_dates) {
          if (dateObj.meeting_id) {
            const statusDoc = await MeetingStatus.findOne({ 
              meeting_id: dateObj.meeting_id 
            });
            
            if (statusDoc) {
              if (statusDoc.status === 'Completed') completedMeetings++;
              if (statusDoc.status === 'Postponed' || statusDoc.status === 'Cancelled') postponedMeetings++;
            }
          }
          
          // Check if meeting is upcoming
         
        }
      }
    }
    
    // Get phase-wise counts for graph
    const phases = await Phase.find().sort({ phaseId: 1 });
    const phaseData = await Promise.all(
      phases.map(async (phase) => {
        const [mentorCount, menteeCount] = await Promise.all([
          MentorRegistration.countDocuments({ phaseId: phase.phaseId }),
          MenteeRequest.countDocuments({ phaseId: phase.phaseId })
        ]);
        
        return {
          phaseId: phase.phaseId,
          phaseName: phase.name,
          mentors: mentorCount,
          mentees: menteeCount,
          total: mentorCount + menteeCount
        };
      })
    );
    
    // Get mentor interests for carousel
    const mentors = await MentorRegistration.find().limit(10);
    const mentorInterests = await Promise.all(
      mentors.map(async (mentor) => {
        const user = await User.findById(mentor.mentor_id);
        return {
          name: user?.basic?.name || "Unknown Mentor",
          interests: mentor.areas_of_interest || [],
          phaseId: mentor.phaseId || "N/A"
        };
      })
    );
    
    // Calculate percentages
    const assignmentRate = totalMentees > 0 
      ? ((assignedMentees / totalMentees) * 100).toFixed(1) 
      : 0;
      
    const completionRate = totalMeetings > 0 
      ? ((completedMeetings / totalMeetings) * 100).toFixed(1) 
      : 0;

    res.json({
      success: true,
      summary: {
        // Key Metrics Cards
        metrics: [
          {
            title: "Total Mentors",
            value: totalMentors,
            icon: "👨‍🏫",
            color: "blue",
            change: "+12%",
            description: "Registered mentors"
          },
          {
            title: "Total Mentees",
            value: totalMentees,
            icon: "👨‍🎓",
            color: "green",
            change: "+18%",
            description: "Mentee requests"
          },
          {
            title: "Assigned Mentees",
            value: assignedMentees,
            icon: "🤝",
            color: "purple",
            change: assignmentRate + "%",
            description: "Successfully assigned"
          },
          {
            title: "Total Meetings",
            value: totalMeetings,
            icon: "📅",
            color: "orange",
            change: completedMeetings + " completed",
            description: "All scheduled meetings"
          }
        ],
        
        // Meeting Status Cards
        meetingStats: [
          {
            title: "Completed Meetings",
            value: completedMeetings,
            icon: "✅",
            color: "success",
            rate: completionRate + "%",
            description: "Successfully conducted"
          },
          {
            title: "Upcoming Meetings",
            value: upcomingMeetings,
            icon: "⏰",
            color: "warning",
            description: "Scheduled for next 7 days"
          },
          {
            title: "Postponed/Cancelled",
            value: postponedMeetings,
            icon: "⏸️",
            color: "danger",
            description: "Meetings rescheduled or cancelled"
          }
        ],
        
        // Phase-wise Data for Graph
        phaseGraphData: {
          phases: phaseData.map(p => p.phaseName),
          mentors: phaseData.map(p => p.mentors),
          mentees: phaseData.map(p => p.mentees)
        },
        
        // Phase Cards for Carousel
        phaseCards: phaseData.map(phase => ({
          phaseId: phase.phaseId,
          phaseName: phase.name,
          mentors: phase.mentors,
          mentees: phase.mentees,
          total: phase.total,
          mentorColor: getRandomColor(),
          menteeColor: getRandomColor()
        })),
        
        // Mentor Interests Carousel
        mentorInterests: mentorInterests,
        
        // Statistics
        statistics: {
          assignmentRate: assignmentRate + "%",
          completionRate: completionRate + "%",
          mentorToMenteeRatio: totalMentors > 0 ? (totalMentees / totalMentors).toFixed(1) : 0,
          upcomingMeetingsNext7Days: upcomingMeetings
        },
        
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error("❌ Error fetching dashboard summary:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Helper function for random colors
function getRandomColor() {
  const colors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', 
    '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ==================== GET PHASE-WISE STATISTICS ====================
// ==================== GET PHASE-WISE STATISTICS (FIXED & FINAL) ====================
// ==================== GET PHASE-WISE STATISTICS (FINAL FIX) ====================
exports.getPhaseStatistics = async (req, res) => {
  try {
    const phases = await Phase.find().sort({ phaseId: 1 });
    const today = new Date();

    const result = await Promise.all(
      phases.map(async (phase) => {

        const phaseId = phase.phaseId;

        // 1️⃣ Mentors & mentees by phase
        const mentors = await MentorRegistration.find({ phaseId });
        const mentees = await MenteeRequest.find({ phaseId });

        const mentorIds = mentors.map(m => m.mentor_id);
        const menteeIds = mentees.map(m => m.mentee_user_id);

        // 2️⃣ Assignments (NO phaseId here)
        const assignments = await MentorMenteeAssignment.find({
          mentor_user_id: { $in: mentorIds }
        });

        const assignedMenteeSet = new Set();
        assignments.forEach(a => {
          a.mentee_user_ids?.forEach(id =>
            assignedMenteeSet.add(id.toString())
          );
        });

        const assignedMentees = assignedMenteeSet.size;

        // 3️⃣ MeetingStatus — PHASE BASED (FIXED ✅)
        const meetingStatuses = await MeetingStatus.find({ phaseId });

        // Group by meeting_id
        const meetingMap = new Map();

        meetingStatuses.forEach(ms => {
          const mid = ms.meeting_id.toString();

          if (!meetingMap.has(mid)) {
            meetingMap.set(mid, {
              completed: false,
              cancelledOrPostponed: false
            });
          }

          if (ms.status === "Completed") {
            meetingMap.get(mid).completed = true;
          }

          if (ms.status === "Cancelled" || ms.status === "Postponed") {
            meetingMap.get(mid).cancelledOrPostponed = true;
          }
        });

        const totalMeetings = meetingMap.size;

        let completedMeetings = 0;
        let cancelledOrPostponed = 0;

        meetingMap.forEach(v => {
          if (v.completed) completedMeetings++;
          if (v.cancelledOrPostponed) cancelledOrPostponed++;
        });

        // 4️⃣ Upcoming meetings (phase-based)
        let upcomingMeetings = 0;

        const schedules = await MeetingSchedule.find({ phaseId });

        schedules.forEach(s => {
          s.meeting_dates?.forEach(d => {
            if (d?.date && new Date(d.date) > today) {
              upcomingMeetings++;
            }
          });
        });

        // 5️⃣ Mentor list (top 3)
        const mentorList = await Promise.all(
          mentors.slice(0, 3).map(async mentor => {
            const user = await User.findById(mentor.mentor_id);
            return {
              name: user?.basic?.name || "Unknown",
              interests: mentor.areas_of_interest || []
            };
          })
        );

        return {
          phaseId,
          phaseName: phase.name,
          startDate: phase.startDate,
          endDate: phase.endDate,
          isActive: today >= phase.startDate && today <= phase.endDate,
          stats: {
            totalMentors: mentors.length,
            totalMentees: mentees.length,
            assignedMentees,
            assignmentRate: mentees.length
              ? ((assignedMentees / mentees.length) * 100).toFixed(1) + "%"
              : "0%",
            totalMeetings,
            completedMeetings,
            upcomingMeetings,
            cancelledOrPostponed,
            completionRate: totalMeetings
              ? ((completedMeetings / totalMeetings) * 100).toFixed(1) + "%"
              : "0%"
          },
          mentorList
        };
      })
    );

    res.json({ success: true, phases: result });

  } catch (err) {
    console.error("❌ Phase stats error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};









// ==================== GET MENTOR INTERESTS CAROUSEL ====================
exports.getMentorInterestsCarousel = async (req, res) => {
  try {
    const mentors = await MentorRegistration.find();
    
    // Group by area of interest
    const interestCounts = {};
    const mentorsByInterest = {};
    
    for (const mentor of mentors) {
      const user = await User.findById(mentor.mentor_id);
      const mentorName = user?.basic?.name || "Unknown Mentor";
      
      if (mentor.areas_of_interest && mentor.areas_of_interest.length > 0) {
        for (const interest of mentor.areas_of_interest) {
          if (!interestCounts[interest]) {
            interestCounts[interest] = 0;
            mentorsByInterest[interest] = [];
          }
          interestCounts[interest]++;
          mentorsByInterest[interest].push({
            name: mentorName,
            phaseId: mentor.phaseId || "N/A"
          });
        }
      }
    }
    
    // Convert to array for carousel
    const interestsArray = Object.entries(interestCounts)
      .map(([interest, count]) => ({
        interest,
        count,
        mentors: mentorsByInterest[interest].slice(0, 5), // Top 5 mentors per interest
        color: getRandomColor()
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
    
    res.json({
      success: true,
      interests: interestsArray,
      totalInterests: Object.keys(interestCounts).length,
      mostPopular: interestsArray.length > 0 ? interestsArray[0] : null
    });
    
  } catch (err) {
    console.error("❌ Error fetching mentor interests:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==================== GET UPCOMING MEETINGS ====================
exports.getUpcomingMeetings = async (req, res) => {
  try {
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const meetings = await MeetingSchedule.find({
      'meeting_dates.date': { 
        $gte: today, 
        $lte: nextMonth 
      }
    }).sort({ 'meeting_dates.date': 1 });
    
    const formattedMeetings = await Promise.all(
      meetings.map(async (meeting) => {
        const mentor = await User.findById(meeting.mentor_user_id);
        const upcomingDates = meeting.meeting_dates
          .filter(dateObj => dateObj.date && new Date(dateObj.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3); // Get next 3 upcoming dates
        
        return {
          _id: meeting._id,
          mentorName: mentor?.basic?.name || "Unknown Mentor",
          menteeCount: meeting.mentee_user_ids.length,
          nextMeeting: upcomingDates.length > 0 ? upcomingDates[0].date : null,
          allUpcomingDates: upcomingDates.map(d => d.date),
          platform: meeting.platform,
          agenda: meeting.agenda || "No agenda specified"
        };
      })
    );
    
    res.json({
      success: true,
      meetings: formattedMeetings,
      next7Days: formattedMeetings.filter(m => {
        if (!m.nextMeeting) return false;
        const meetingDate = new Date(m.nextMeeting);
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return meetingDate <= weekFromNow;
      }).length
    });
    
  } catch (err) {
    console.error("❌ Error fetching upcoming meetings:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};