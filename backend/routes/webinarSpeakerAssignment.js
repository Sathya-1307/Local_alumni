const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET route to get member by email
router.get('/member-by-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const member = await req.app.locals.Member.findOne({ 'basic.email_id': email });
    if (!member) {
      return res.json({ found: false });
    }

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
        member.education_details?.[0]?.department,
        member.education_details?.[0]?.dept,
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

    const department = getDepartmentFromMember(member);

    // ------------------------------
    // ⭐ FETCH BATCH FROM education_details[0].batch or end_year
    // ------------------------------
    const batch =
      member.education_details?.[0]?.batch ||
      member.basic?.batch ||
      member.education_details?.[0]?.end_year ||
      "";

    const contact_no = member.contact_details?.mobile ||
                      member.contact_details?.phone ||
                      member.mobile ||
                      member.phone ||
                      member.contact ||
                      '';
                      
    res.json({
      found: true,
      name: member.basic?.name || "",
      contact_no: contact_no,
      department: department || "",
      batch: batch
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST route to assign speaker
router.post('/assign-speaker', upload.single('speakerPhoto'), async (req, res) => {
  try {
    const {
      email, designation, companyName, alumniCity, domain, topic,
      webinarVenue, meetingLink, slots, phaseId
    } = req.body;

    console.log('Received data:', { email, designation, companyName, alumniCity, domain, topic, webinarVenue, meetingLink, slots });

    const speakerPhoto = req.file ? req.file.filename : null;
    console.log('Speaker photo:', speakerPhoto);

    // Parse slots
    let parsedSlots;
    try {
      parsedSlots = JSON.parse(slots);
      console.log('Parsed slots:', parsedSlots);
    } catch (error) {
      console.error('Error parsing slots:', error);
      return res.status(400).json({ error: 'Invalid slots data' });
    }

    // Validate required fields
    if (!email || !designation || !companyName || !alumniCity || !domain || !topic || !webinarVenue || !meetingLink || !speakerPhoto) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Check for conflicts with existing webinars
    for (const slot of parsedSlots) {
      const existingWebinar = await req.app.locals.Webinar.findOne({
        venue: webinarVenue,
        webinarDate: new Date(slot.webinarDate),
        time: slot.time
      });

      if (existingWebinar) {
        return res.status(409).json({
          error: `Conflict detected: A webinar is already scheduled at ${webinarVenue} on ${new Date(slot.webinarDate).toLocaleDateString()} at ${slot.time}.`
        });
      }
    }

    // Get member details
    const member = await req.app.locals.Member.findOne({ 'basic.email_id': email });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    console.log('Found member:', member.basic?.name);

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
        member.education_details?.[0]?.department,
        member.education_details?.[0]?.dept,
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

    const name = member.basic?.name || "";
    const department = getDepartmentFromMember(member);

    // ------------------------------
    // ⭐ FETCH BATCH FROM education_details[0].batch or end_year
    // ------------------------------
    const batch =
      member.education_details?.[0]?.batch ||
      member.basic?.batch ||
      member.education_details?.[0]?.end_year ||
      "";

    console.log('Extracted data:', { name, department, batch });

    // Allow empty department and batch for now, but log warning
    if (!department) {
      console.warn('Department not found for member, proceeding with empty department');
    }
    if (!batch) {
      console.warn('Batch not found for member, proceeding with empty batch');
    }

    // Create speaker
    const speakerData = {
      email,
      name,
      department: department || '',
      batch: batch || '',
      designation,
      companyName,
      speakerPhoto,
      domain,
      topic,
      webinarVenue,
      alumniCity,
      meetingLink,
      phaseId,
      slots: parsedSlots
    };

    console.log('Creating speaker with data:', speakerData);

    const newSpeaker = new req.app.locals.Speaker(speakerData);
    await newSpeaker.save();
    console.log('Speaker created successfully:', newSpeaker._id);

    // Create webinars for each slot
    const webinars = parsedSlots.map(slot => ({
      webinarDate: new Date(slot.webinarDate),
      deadline: new Date(slot.deadline),
      time: slot.time,
      speaker: newSpeaker._id,
      topic,
      domain,
      venue: webinarVenue,
      meetingLink,
      alumniCity,
      phaseId
    }));

    console.log('Creating webinars:', webinars);
    await req.app.locals.Webinar.insertMany(webinars);
    console.log('Webinars created successfully');

    // Send emails to students who requested this topic
    try {
      const studentRequests = await req.app.locals.StudentRequestForm.find({
        domain: domain,
        topic: topic
      });

      if (studentRequests.length > 0) {
        // Create transporter
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER || 'mohamedmi5520401@gmail.com',
            pass: process.env.EMAIL_PASS || 'coyvbsfvjmxlzyry'
          }
        });

        // Prepare webinar details for email
        const webinarDetails = parsedSlots.map(slot => ({
          date: new Date(slot.webinarDate).toLocaleDateString(),
          time: slot.time,
          deadline: new Date(slot.deadline).toLocaleDateString()
        }));

        // Send email to each student
        for (const request of studentRequests) {
          const mailOptions = {
            from: process.env.EMAIL_USER || 'mohamedmi5520401@gmail.com',
            to: request.email,
            subject: `Webinar Speaker Assigned for "${topic}"`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Webinar Speaker Assignment Notification</h2>
                <p>Dear Student,</p>
                <p>We are pleased to inform you that a speaker has been assigned for the webinar topic you requested: <strong>"${topic}"</strong></p>

                <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
                  <h3>Speaker Details:</h3>
                  <p><strong>Name:</strong> ${name}</p>
                  <p><strong>Designation:</strong> ${designation}</p>
                  <p><strong>Company:</strong> ${companyName}</p>
                  <p><strong>Department:</strong> ${department}</p>
                  <p><strong>Batch:</strong> ${batch}</p>
                </div>

                <div style="background-color: #e8f4f8; padding: 20px; margin: 20px 0; border-radius: 5px;">
                  <h3>Webinar Schedule:</h3>
                  ${webinarDetails.map(slot => `
                    <p><strong>Date:</strong> ${slot.date}</p>
                    <p><strong>Time:</strong> ${slot.time}</p>
                    <p><strong>Registration Deadline:</strong> ${slot.deadline}</p>
                    <p><strong>Venue:</strong> ${webinarVenue}</p>
                    <p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
                    <hr style="margin: 15px 0;">
                  `).join('')}
                </div>

                <p>Please register for the webinar before the deadline to secure your spot.</p>
                <p>Best regards,<br>NEC Alumni Association</p>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          console.log(`Email sent to ${request.email} for topic "${topic}"`);
        }

        console.log(`Emails sent to ${studentRequests.length} students for topic "${topic}"`);
      } else {
        console.log(`No student requests found for topic "${topic}" in domain "${domain}"`);
      }
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Don't fail the entire operation if email sending fails
    }

    res.status(201).json({ message: 'Speaker assigned successfully' });
  } catch (error) {
    console.error('Error assigning speaker:', error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

module.exports = router;
