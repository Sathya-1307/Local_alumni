const express = require('express');
const router = express.Router();

const memberSchema = require('../models/Member');
const studentFeedbackSchema = require('../models/StudentFeedback');

// ------------------------------
// Department Extraction Logic
// ------------------------------
function extractDepartment(label) {
  if (!label) return "";
  const departments = ["CSE", "ECE", "MECH", "EEE", "CIVIL", "AIDS", "CE", "CS", "CS&E", "CSEH", "AEI", "IT"];
  const upperLabel = String(label).toUpperCase();
  for (const dept of departments) {
    try {
      const re = new RegExp("\\b" + dept.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\b", 'i');
      if (re.test(upperLabel)) return dept;
    } catch (e) {
      if (upperLabel.includes(dept)) return dept;
    }
  }
  if (upperLabel.includes('COMPUTER') && upperLabel.includes('ENGINEER')) return 'CSE';
  if (upperLabel.includes('ELECTRON') && upperLabel.includes('COMM')) return 'ECE';
  if (upperLabel.includes('MECHAN') || upperLabel.includes('MECH')) return 'MECH';
  return "";
}

function getDepartmentFromMember(member) {
  if (!member) return "";
  const candidates = [
    member.basic?.department,
    member.basic?.dept,
    member.basic?.label,
    member.basic?.course,
    member.department,
    member.dept,
    member.contact_details?.department,
    member.contact_details?.dept,
    member.education_details?.[0]?.department,
    member.education_details?.[0]?.dept,
    member.education_details?.[0]?.course,
    member.education_details?.[0]?.branch,
    member.academic_details?.department,
    member.academic_details?.dept,
    member.academic_details?.course,
    member.academic_details?.branch
  ];
  for (const c of candidates) {
    if (!c) continue;
    const dept = extractDepartment(c);
    if (dept) return dept;
    const str = String(c).trim();
    if (str.length > 0 && str.length <= 10) return str.toUpperCase();
  }
  try {
    const fullText = JSON.stringify(member).toUpperCase();
    const fallbackOrder = ["CSE", "ECE", "MECH", "EEE", "CIVIL", "AIDS", "CE", "CS", "IT"];
    for (const dept of fallbackOrder) {
      const re = new RegExp("\\b" + dept.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\b", 'i');
      if (re.test(fullText)) return dept;
    }
    if (/COMPUTER/.test(fullText) && /ENGINEER/.test(fullText)) return 'CSE';
    if (/ELECTRON/.test(fullText) && /COMM/.test(fullText)) return 'ECE';
    if (/MECHAN|MECH/.test(fullText)) return 'MECH';
  } catch (e) {}
  return "";
}

router.post('/submit-student-feedback', async (req, res) => {
  try {
    const { email, name, webinar, speaker, q1, q2, feedback, phaseId } = req.body;
    if (!email || !name || !webinar || !speaker || !q1 || !q2 || !feedback || !phaseId) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const Member = req.app.locals.Member;
    const member = await Member.findOne({ "basic.email_id": email });
    if (!member) {
      return res.status(404).json({ error: 'Student not found with this email' });
    }
    const StudentFeedback = req.app.locals.StudentFeedback;

    // Check if feedback already exists for this email and webinar
    const existingFeedback = await StudentFeedback.findOne({ email, webinar });
    if (existingFeedback) {
      return res.status(400).json({ error: 'Feedback already submitted for this webinar' });
    }

    const newFeedback = new StudentFeedback({
      studentId: member._id,
      email,
      name,
      webinar,
      speaker,
      q1,
      q2,
      feedback,
      phaseId
    });
    await newFeedback.save();

    res.status(201).json({ message: 'Feedback submitted successfully' });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/student-feedback', async (req, res) => {
  try {
    const StudentFeedback = req.app.locals.StudentFeedback;
    const Member = req.app.locals.Member;
    const feedbacks = await StudentFeedback.find().sort({ submittedAt: -1 });

    // Get member details for each feedback
    const feedbacksWithDetails = await Promise.all(
      feedbacks.map(async (feedback) => {
        const member = await Member.findById(feedback.studentId);
        if (member) {
          const department = getDepartmentFromMember(member);
          // Extract batch from member data (prioritize basic.batch, then calculate passout year)
          let batch = member.basic?.batch || member.batch || '';
          if (!batch) {
            const education = member.education_details?.[0];
            const endYear = education?.end_year;
            if (typeof endYear === 'string' && endYear.toLowerCase() === 'present') {
              // For current students, calculate expected passout year (start_year + 4)
              const startYear = education?.start_year;
              if (typeof startYear === 'number') {
                batch = (startYear + 4).toString();
              } else if (typeof startYear === 'string') {
                const start = parseInt(startYear);
                if (!isNaN(start)) batch = (start + 4).toString();
              }
            } else if (typeof endYear === 'string') {
              const year = parseInt(endYear);
              if (!isNaN(year)) batch = year.toString();
            } else if (typeof endYear === 'number') {
              batch = endYear.toString();
            }
          }
          return {
            _id: feedback._id,
            email: feedback.email,
            name: feedback.name,
            webinar: feedback.webinar,
            speaker: feedback.speaker,
            q1: feedback.q1,
            q2: feedback.q2,
            feedback: feedback.feedback,
            phaseId: feedback.phaseId,
            submittedAt: feedback.submittedAt,
            department: department || 'N/A',
            batch: batch || 'N/A'
          };
        } else {
          // If member not found, return feedback with limited info
          return {
            _id: feedback._id,
            email: feedback.email,
            name: feedback.name,
            webinar: feedback.webinar,
            speaker: feedback.speaker,
            q1: feedback.q1,
            q2: feedback.q2,
            feedback: feedback.feedback,
            phaseId: feedback.phaseId,
            submittedAt: feedback.submittedAt,
            department: 'N/A',
            batch: 'N/A'
          };
        }
      })
    );

    res.json(feedbacksWithDetails);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/student-feedback/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const StudentFeedback = req.app.locals.StudentFeedback;
    const feedbacks = await StudentFeedback.find({ email }).sort({ submittedAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/student-feedback/webinar/:webinar', async (req, res) => {
  try {
    const { webinar } = req.params;
    const StudentFeedback = req.app.locals.StudentFeedback;
    const Member = req.app.locals.Member;
    const feedbacks = await StudentFeedback.find({ webinar }).sort({ submittedAt: -1 });

    // Get member details for each feedback
    const feedbacksWithDetails = await Promise.all(
      feedbacks.map(async (feedback) => {
        const member = await Member.findById(feedback.studentId);
        if (member) {
          const department = getDepartmentFromMember(member);
          // Extract batch from member data (prioritize basic.batch, then calculate passout year)
          let batch = member.basic?.batch || member.batch || '';
          if (!batch) {
            const education = member.education_details?.[0];
            const endYear = education?.end_year;
            if (typeof endYear === 'string' && endYear.toLowerCase() === 'present') {
              // For current students, calculate expected passout year (start_year + 4)
              const startYear = education?.start_year;
              if (typeof startYear === 'number') {
                batch = (startYear + 4).toString();
              } else if (typeof startYear === 'string') {
                const start = parseInt(startYear);
                if (!isNaN(start)) batch = (start + 4).toString();
              }
            } else if (typeof endYear === 'string') {
              const year = parseInt(endYear);
              if (!isNaN(year)) batch = year.toString();
            } else if (typeof endYear === 'number') {
              batch = endYear.toString();
            }
          }
          return {
            _id: feedback._id,
            email: feedback.email,
            name: feedback.name,
            webinar: feedback.webinar,
            speaker: feedback.speaker,
            q1: feedback.q1,
            q2: feedback.q2,
            feedback: feedback.feedback,
            phaseId: feedback.phaseId,
            submittedAt: feedback.submittedAt,
            department: department || 'N/A',
            batch: batch || 'N/A'
          };
        } else {
          // If member not found, return feedback with limited info
          return {
            _id: feedback._id,
            email: feedback.email,
            name: feedback.name,
            webinar: feedback.webinar,
            speaker: feedback.speaker,
            q1: feedback.q1,
            q2: feedback.q2,
            feedback: feedback.feedback,
            phaseId: feedback.phaseId,
            submittedAt: feedback.submittedAt,
            department: 'N/A',
            batch: 'N/A'
          };
        }
      })
    );

    res.json(feedbacksWithDetails);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
