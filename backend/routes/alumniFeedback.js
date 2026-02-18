const express = require('express');
const router = express.Router();

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
    member.contact_details?.dept
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

// POST route to submit alumni feedback
router.post('/alumni-feedback', async (req, res) => {
  try {
    const { name, email, webinarTopic, arrangementsRating, studentParticipationRating, feedback } = req.body;

    // Validate required fields
    if (!name || !email || !webinarTopic || !arrangementsRating || !studentParticipationRating || !feedback) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Get the AlumniFeedback model from app locals (webinar connection)
    const AlumniFeedback = req.app.locals.AlumniFeedback;

    // Check if user is registered for this webinar
    const Webinar = req.app.locals.Webinar;
    const Register = req.app.locals.Register;

    // Find the webinar by topic to get webinarId
    const webinar = await Webinar.findOne({ topic: webinarTopic });
    if (!webinar) {
      return res.status(400).json({ message: 'Webinar not found' });
    }

    // Check if user is registered for this webinar
    const registration = await Register.findOne({ email, webinarId: webinar._id });
    if (!registration) {
      return res.status(400).json({ message: 'You must be registered for this webinar to submit feedback' });
    }

    // Check if feedback already exists for this email and webinar topic
    const existingFeedback = await AlumniFeedback.findOne({ email, webinarTopic });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this webinar' });
    }

    // Create new feedback entry
    const newFeedback = new AlumniFeedback({
      name,
      email,
      webinarTopic,
      arrangementsRating,
      studentParticipationRating,
      feedback
    });

    // Save to database
    await newFeedback.save();

    res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET route to retrieve all alumni feedback (optional, for admin purposes)
router.get('/feedbacks', async (req, res) => {
  try {
    const AlumniFeedback = req.app.locals.AlumniFeedback;
    const Member = req.app.locals.Member;
    const feedbacks = await AlumniFeedback.find({});

    // Get member details for each feedback
    const feedbacksWithDetails = await Promise.all(
      feedbacks.map(async (feedback) => {
        const member = await Member.findOne({ 'basic.email_id': feedback.email });
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
            name: feedback.name,
            email: feedback.email,
            webinarTopic: feedback.webinarTopic,
            arrangementsRating: feedback.arrangementsRating,
            studentParticipationRating: feedback.studentParticipationRating,
            feedback: feedback.feedback,
            submittedAt: feedback.submittedAt,
            department: department || 'N/A',
            batch: batch || 'N/A'
          };
        } else {
          // If member not found, return feedback with limited info
          return {
            _id: feedback._id,
            name: feedback.name,
            email: feedback.email,
            webinarTopic: feedback.webinarTopic,
            arrangementsRating: feedback.arrangementsRating,
            studentParticipationRating: feedback.studentParticipationRating,
            feedback: feedback.feedback,
            submittedAt: feedback.submittedAt,
            department: 'N/A',
            batch: 'N/A'
          };
        }
      })
    );

    res.json(feedbacksWithDetails);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route to retrieve alumni feedback by webinar topic
router.get('/alumni-feedback/webinar/:webinarTopic', async (req, res) => {
  try {
    const { webinarTopic } = req.params;
    const AlumniFeedback = req.app.locals.AlumniFeedback;
    const Member = req.app.locals.Member;
    const feedbacks = await AlumniFeedback.find({ webinarTopic });

    // Get member details for each feedback
    const feedbacksWithDetails = await Promise.all(
      feedbacks.map(async (feedback) => {
        const member = await Member.findOne({ 'basic.email_id': feedback.email });
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
            name: feedback.name,
            email: feedback.email,
            webinarTopic: feedback.webinarTopic,
            arrangementsRating: feedback.arrangementsRating,
            studentParticipationRating: feedback.studentParticipationRating,
            feedback: feedback.feedback,
            submittedAt: feedback.submittedAt,
            department: department || 'N/A',
            batch: batch || 'N/A'
          };
        } else {
          // If member not found, return feedback with limited info
          return {
            _id: feedback._id,
            name: feedback.name,
            email: feedback.email,
            webinarTopic: feedback.webinarTopic,
            arrangementsRating: feedback.arrangementsRating,
            studentParticipationRating: feedback.studentParticipationRating,
            feedback: feedback.feedback,
            submittedAt: feedback.submittedAt,
            department: 'N/A',
            batch: 'N/A'
          };
        }
      })
    );

    res.json(feedbacksWithDetails);
  } catch (error) {
    console.error('Error fetching alumni feedback by webinar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
