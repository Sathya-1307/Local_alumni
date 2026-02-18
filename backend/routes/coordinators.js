const express = require('express');
const router = express.Router();

// Middleware to get models from app locals
router.use((req, res, next) => {
  req.Coordinator = req.app.locals.Coordinator;
  req.Member = req.app.locals.Member;
  next();
});

// Department extraction functions
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

// Add a new coordinator
router.post('/add', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    // Validate role
    if (!['student', 'department'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be either "student" or "department"' });
    }

    // Check if coordinator already exists
    const existingCoordinator = await req.Coordinator.findOne({ email: email.toLowerCase() });
    if (existingCoordinator) {
      return res.status(400).json({ message: 'Coordinator with this email already exists' });
    }

    // Fetch member details from Member collection
    let memberDetails = null;
    try {
      const member = await req.Member.findOne({ 'basic.email_id': email.toLowerCase() });
      if (member) {
        memberDetails = {
          name: member.basic?.name,
          department: getDepartmentFromMember(member),
          phoneNumber: member.contact_details?.mobile
        };
      }
    } catch (error) {
      console.log('Member not found, proceeding without member details');
    }

    // Create new coordinator
    const coordinator = new req.Coordinator({
      email: email.toLowerCase(),
      role,
      ...memberDetails
    });

    await coordinator.save();

    res.status(201).json({
      message: 'Coordinator added successfully',
      coordinator: {
        email: coordinator.email,
        role: coordinator.role,
        name: coordinator.name,
        department: coordinator.department,
        phoneNumber: coordinator.phoneNumber
      }
    });
  } catch (error) {
    console.error('Error adding coordinator:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all coordinators
router.get('/', async (req, res) => {
  try {
    const coordinators = await req.Coordinator.find().sort({ createdAt: -1 });
    res.json(coordinators);
  } catch (error) {
    console.error('Error fetching coordinators:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get coordinators by role
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;

    if (!['student', 'department'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be either "student" or "department"' });
    }

    const coordinators = await req.Coordinator.find({ role }).sort({ createdAt: -1 });
    res.json(coordinators);
  } catch (error) {
    console.error('Error fetching coordinators by role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get member details by email for auto-fill in coordinators
router.get('/member-by-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const member = await req.Member.findOne({ 'basic.email_id': email.toLowerCase() });
    if (!member) {
      return res.json({ found: false });
    }
    // Extract department using the existing logic
    const department = getDepartmentFromMember(member);
    // Extract batch from member data (end year from education details)
    const endYear = member.education_details?.[0]?.end_year;
    let batch = '';
    if (typeof endYear === 'string' && endYear.toLowerCase() !== 'present') {
      const year = parseInt(endYear);
      if (!isNaN(year)) batch = year.toString();
    } else if (typeof endYear === 'number') {
      batch = endYear.toString();
    }
    if (!batch) {
      batch = member.basic?.batch || member.batch || '';
    }
    // Extract contact number from multiple possible paths
    const contact_no = member.contact_details?.mobile ||
                      member.contact_details?.phone ||
                      member.mobile ||
                      member.phone ||
                      member.contact ||
                      '';
    res.json({
      found: true,
      name: member.basic?.name || '',
      contact_no: contact_no,
      department: department || '',
      batch: batch
    });
  } catch (error) {
    console.error('Error fetching member by email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete coordinator
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await req.Coordinator.findByIdAndDelete(id);
    res.json({ message: 'Coordinator deleted successfully' });
  } catch (error) {
    console.error('Error deleting coordinator:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
