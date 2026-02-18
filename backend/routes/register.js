const express = require('express');
const router = express.Router();

// POST endpoint to register for a webinar
router.post('/register', async (req, res) => {
  try {
    const { email, webinarId, phaseId } = req.body;

    // Validate required fields
    if (!email || !webinarId || !phaseId) {
      return res.status(400).json({ error: 'Email, webinarId, and phaseId are required' });
    }

    // Check if already registered
    const Register = req.app.locals.Register;
    const existingRegistration = await Register.findOne({ email, webinarId });
    if (existingRegistration) {
      return res.status(400).json({ error: 'Already registered for this webinar' });
    }

    // Create new registration
    const newRegistration = new Register({
      email,
      webinarId,
      phaseId
    });

    // Save to database
    await newRegistration.save();

    res.status(201).json({ message: 'Registration successful' });

  } catch (error) {
    console.error('Error registering for webinar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET endpoint to get registrations for a webinar
router.get('/registrations/:webinarId', async (req, res) => {
  try {
    const { webinarId } = req.params;
    const Register = req.app.locals.Register;
    const registrations = await Register.find({ webinarId }).sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET endpoint to get registrations for a user
router.get('/registrations/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const Register = req.app.locals.Register;
    const registrations = await Register.find({ email }).sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET endpoint to get detailed registrations for a webinar (with user details)
router.get('/registrations/webinar/:webinarId/details', async (req, res) => {
  try {
    const { webinarId } = req.params;
    const Register = req.app.locals.Register;
    const Member = req.app.locals.Member;

    // Get all registrations for the webinar
    const registrations = await Register.find({ webinarId }).sort({ createdAt: -1 });

    // Get user details for each registration
    const detailedRegistrations = await Promise.all(
      registrations.map(async (registration) => {
        const member = await Member.findOne({ 'basic.email_id': registration.email });

        // Extract department using the same logic as in server.js
        let department = '';
        let batch = '';
        if (member) {
          console.log('Member data for debugging:', JSON.stringify(member, null, 2));

          // Use the getDepartmentFromMember function from server.js
          const extractDepartment = (label) => {
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
          };

          const getDepartmentFromMember = (member) => {
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
            console.log('Department candidates:', candidates);
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
          };

          department = getDepartmentFromMember(member);
          console.log('Extracted department:', department);

          // Extract batch from member data (prioritize education_details.batch, then basic.batch, then calculate passout year)
          batch = member.education_details?.[0]?.batch ||
                     member.basic?.batch ||
                     member.batch ||
                     '';
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
          console.log('Extracted batch:', batch);
        }

        return {
          _id: registration._id,
          email: registration.email,
          webinarId: registration.webinarId,
          phaseId: registration.phaseId,
          attendedStatus: registration.attendedStatus,
          createdAt: registration.createdAt,
          userDetails: member ? {
            name: member.basic?.name || '',
            department: department,
            batch:batch,
            contact_no: member.contact_details?.mobile || member.contact_details?.phone || ''
          } : null
        };
      })
    );

    res.json(detailedRegistrations);
  } catch (error) {
    console.error('Error fetching detailed registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;