// auth.js - Complete permissions endpoint with dynamic database access
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// Import models for mentorship tables
const MentorRegistration = require('../models/MentorRegistration');
const MenteeRequest = require('../models/MenteeRequest');
const MentorMenteeAssignment = require('../models/MentorMenteeAssignment');

// ==========================================
// HELPER FUNCTIONS - EXACTLY MATCHING FRONTEND
// ==========================================

// Extract graduation year from any string (EXACT match with frontend)
const extractYearFromLabel = (label) => {
  if (!label) return null;
  console.log('🔍 Extracting year from:', label);
  const yearMatch = String(label).match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0]) : null;
  console.log('✅ Extracted year:', year);
  return year;
};

// Comprehensive function to find graduation year from ANY field
const findGraduationYear = (user) => {
  console.log('\n🔍 SEARCHING FOR GRADUATION YEAR IN ALL FIELDS');
  
  // List of all possible fields that might contain graduation year
  const fieldsToCheck = [
    { name: 'label', value: user.label },
    { name: 'batch', value: user.batch },
    { name: 'graduationYear', value: user.graduationYear },
    { name: 'passingYear', value: user.passingYear },
    { name: 'yearOfPassing', value: user.yearOfPassing },
    { name: 'batchYear', value: user.batchYear },
    { name: 'academicYear', value: user.academicYear }
  ];
  
  // Check direct fields first
  for (const field of fieldsToCheck) {
    if (field.value) {
      console.log(`Checking ${field.name}:`, field.value);
      const year = extractYearFromLabel(field.value);
      if (year) {
        console.log(`✅ Found year ${year} in ${field.name}`);
        return year;
      }
    }
  }
  
  // Check education_details array
  if (user.education_details && Array.isArray(user.education_details)) {
    console.log('Checking education_details array:', JSON.stringify(user.education_details));
    for (let i = 0; i < user.education_details.length; i++) {
      const edu = user.education_details[i];
      const eduFields = [
        { name: `education_details[${i}].passing_year`, value: edu.passing_year },
        { name: `education_details[${i}].yearOfPassing`, value: edu.yearOfPassing },
        { name: `education_details[${i}].graduationYear`, value: edu.graduationYear },
        { name: `education_details[${i}].batch`, value: edu.batch },
        { name: `education_details[${i}].end_year`, value: edu.end_year },
        { name: `education_details[${i}].start_year`, value: edu.start_year }
      ];
      
      for (const field of eduFields) {
        if (field.value !== undefined && field.value !== null && field.value !== 0 && field.value !== '0') {
          console.log(`Checking ${field.name}:`, field.value);
          const year = extractYearFromLabel(String(field.value));
          if (year) {
            console.log(`✅ Found year ${year} in ${field.name}`);
            return year;
          }
        }
      }
    }
  }
  
  // Check membership_details array
  if (user.membership_details && Array.isArray(user.membership_details)) {
    console.log('Checking membership_details array');
    for (let i = 0; i < user.membership_details.length; i++) {
      const membership = user.membership_details[i];
      if (membership.details && Array.isArray(membership.details)) {
        for (let j = 0; j < membership.details.length; j++) {
          const detail = membership.details[j];
          const detailFields = [
            { name: `membership_details[${i}].details[${j}].end_year`, value: detail.end_year },
            { name: `membership_details[${i}].details[${j}].start_year`, value: detail.start_year }
          ];
          
          for (const field of detailFields) {
            if (field.value !== undefined && field.value !== null && field.value !== 0 && field.value !== '0') {
              console.log(`Checking ${field.name}:`, field.value);
              const year = extractYearFromLabel(String(field.value));
              if (year) {
                console.log(`✅ Found year ${year} in ${field.name}`);
                return year;
              }
            }
          }
        }
      }
    }
  }
  
  // Check basic object
  if (user.basic) {
    console.log('Checking basic object');
    if (user.basic.batch) {
      console.log('Checking basic.batch:', user.basic.batch);
      const year = extractYearFromLabel(user.basic.batch);
      if (year) {
        console.log(`✅ Found year ${year} in basic.batch`);
        return year;
      }
    }
    if (user.basic.label) {
      console.log('Checking basic.label:', user.basic.label);
      const year = extractYearFromLabel(user.basic.label);
      if (year) {
        console.log(`✅ Found year ${year} in basic.label`);
        return year;
      }
    }
  }
  
  console.log('❌ No graduation year found in any field');
  return null;
};

// Determine user type based on graduation year (EXACT match with frontend)
const determineUserType = (user) => {
  const currentYear = new Date().getFullYear();
  console.log('\n📅 Current year:', currentYear);
  
  // Find graduation year from ANY field
  const graduationYear = findGraduationYear(user);
  
  if (graduationYear) {
    console.log(`🎓 Found graduation year: ${graduationYear}`);
    const isAlumni = graduationYear < currentYear;
    console.log(`📊 Comparison: ${graduationYear} < ${currentYear} = ${isAlumni}`);
    console.log(isAlumni ? '✅ Is Alumni (passed out)' : '✅ Is Student (current/future)');
    return isAlumni ? 'alumni' : 'student';
  }
  
  console.log('⚠️ No graduation year found, defaulting to student');
  return 'student';
};

// ========== NEW: Check if user is admin by label (based on placement code) ==========
const isAdminByLabel = (user) => {
  if (!user) return false;
  
  // Check in basic.label first
  if (user.basic && user.basic.label) {
    const labelLower = String(user.basic.label).toLowerCase();
    if (labelLower.includes('admin') || labelLower === 'administrator') {
      console.log('👑 Admin detected by basic.label:', user.basic.label);
      return true;
    }
  }
  
  // Also check root level label as fallback
  if (user.label) {
    const labelLower = String(user.label).toLowerCase();
    if (labelLower.includes('admin') || labelLower === 'administrator') {
      console.log('👑 Admin detected by root label:', user.label);
      return true;
    }
  }
  
  return false;
};

// Helper function to check if a role is a coordinator role
const isCoordinatorRole = (roleName) => {
  if (!roleName) return false;
  const coordinatorKeywords = ['coordinator', 'Coordinator'];
  return coordinatorKeywords.some(keyword => roleName.includes(keyword));
};

// FIXED: Strict function to check ONLY for mentorship coordinator, not any coordinator
const isMentorshipCoordinatorRole = (roleName) => {
  if (!roleName) return false;
  
  // Convert to lowercase for case-insensitive comparison
  const lowerRoleName = roleName.toLowerCase();
  
  // STRICT CHECK: Must contain BOTH "mentorship" AND "coordinator"
  // This ensures it's specifically a mentorship coordinator, not any other type of coordinator
  const hasMentorship = lowerRoleName.includes('mentorship');
  const hasCoordinator = lowerRoleName.includes('coordinator');
  
  // Also check for exact variations
  const exactMatches = [
    'mentorship coordinator',
    'mentorship-coordinator',
    'mentorship_coordinator'
  ];
  
  const isExactMatch = exactMatches.some(match => 
    lowerRoleName === match || lowerRoleName.includes(match)
  );
  
  const result = (hasMentorship && hasCoordinator) || isExactMatch;
  
  if (result) {
    console.log(`✅ Role "${roleName}" IS a mentorship coordinator`);
  } else {
    console.log(`❌ Role "${roleName}" is NOT a mentorship coordinator`);
  }
  
  return result;
};

// Helper function to get default roleId based on user type
const getDefaultRoleId = async (adminDb, userType) => {
  try {
    let roleName = '';
    
    switch(userType) {
      case 'alumni':
        roleName = 'Alumni';
        break;
      case 'student':
        roleName = 'Student';
        break;
      case 'mentor':
        roleName = 'Mentor';
        break;
      case 'mentee':
        roleName = 'Mentee';
        break;
      case 'admin':
        roleName = 'Admin';
        break;
      default:
        return null;
    }
    
    console.log(`🔍 Looking for default role: ${roleName}`);
    
    // Find role in roles table by name (case insensitive)
    const role = await adminDb
      .collection("roles")
      .findOne({ name: { $regex: new RegExp(`^${roleName}$`, 'i') } });
    
    console.log(`✅ Found role:`, role);
    return role ? role.roleId : null;
  } catch (error) {
    console.error('Error getting default roleId:', error);
    return null;
  }
};

// ==========================================
// MENTOR/MENTEE TABLE CHECKING FUNCTIONS
// MATCHING DASHBOARD CONTROLLER SCHEMA
// ==========================================

// Check if user is in mentee table (using MenteeRequest model)
const checkMenteeTable = async (userId) => {
  try {
    console.log(`🔍 Checking mentee table for userId: ${userId}`);
    
    // Use the MenteeRequest model to find by mentee_user_id
    const mentee = await MenteeRequest.findOne({ 
      mentee_user_id: userId 
    });
    
    if (mentee) {
      console.log('✅ User found in mentee table with status:', mentee.status);
      return { 
        isMentee: true, 
        data: mentee,
        status: mentee.status,
        phaseId: mentee.phaseId,
        area_of_interest: mentee.area_of_interest
      };
    }
    
    console.log('❌ User not found in mentee table');
    return { isMentee: false, data: null };
  } catch (error) {
    console.error('Error checking mentee table:', error);
    return { isMentee: false, data: null };
  }
};

// Check if user is in mentor table (using MentorRegistration model)
const checkMentorTable = async (userId) => {
  try {
    console.log(`🔍 Checking mentor table for userId: ${userId}`);
    
    // Use the MentorRegistration model to find by mentor_id
    const mentor = await MentorRegistration.findOne({ 
      mentor_id: userId 
    });
    
    if (mentor) {
      console.log('✅ User found in mentor table with phase:', mentor.phaseId);
      return { 
        isMentor: true, 
        data: mentor,
        phaseId: mentor.phaseId,
        areas_of_interest: mentor.areas_of_interest
      };
    }
    
    console.log('❌ User not found in mentor table');
    return { isMentor: false, data: null };
  } catch (error) {
    console.error('Error checking mentor table:', error);
    return { isMentor: false, data: null };
  }
};

// Enhanced function to check complete mentorship status
const checkUserMentorshipStatus = async (userId) => {
  try {
    console.log(`\n📋 CHECKING COMPLETE MENTORSHIP STATUS FOR USER: ${userId}`);
    
    // Check both tables in parallel
    const [menteeResult, mentorResult] = await Promise.all([
      checkMenteeTable(userId),
      checkMentorTable(userId)
    ]);
    
    // Check if mentee is assigned to any mentor
    let isAssigned = false;
    let mentorId = null;
    
    if (menteeResult.isMentee) {
      const assignment = await MentorMenteeAssignment.findOne({
        mentee_user_ids: userId
      });
      isAssigned = !!assignment;
      mentorId = assignment?.mentor_user_id;
    }
    
    // Determine user's mentorship role
    let mentorshipRole = null;
    let mentorshipData = null;
    let phaseId = null;
    
    if (menteeResult.isMentee && mentorResult.isMentor) {
      mentorshipRole = 'both';
      mentorshipData = {
        mentee: menteeResult.data,
        mentor: mentorResult.data
      };
      phaseId = mentorResult.phaseId || menteeResult.phaseId;
      console.log('✅ User is BOTH mentor and mentee');
    } 
    else if (menteeResult.isMentee) {
      mentorshipRole = 'mentee';
      mentorshipData = menteeResult.data;
      phaseId = menteeResult.phaseId;
      console.log('✅ User is a MENTEE with status:', menteeResult.status);
    } 
    else if (mentorResult.isMentor) {
      mentorshipRole = 'mentor';
      mentorshipData = mentorResult.data;
      phaseId = mentorResult.phaseId;
      console.log('✅ User is a MENTOR');
    } 
    else {
      console.log('❌ User is not in mentor or mentee tables');
    }
    
    return {
      hasMentorshipRole: !!(menteeResult.isMentee || mentorResult.isMentor),
      mentorshipRole,
      mentorshipData,
      phaseId,
      isAssigned,
      mentorId,
      details: {
        isMentee: menteeResult.isMentee,
        menteeStatus: menteeResult.status,
        isMentor: mentorResult.isMentor,
        mentorPhase: mentorResult.phaseId,
        isAssignedToMentor: isAssigned
      }
    };
    
  } catch (error) {
    console.error('Error checking mentorship status:', error);
    return {
      hasMentorshipRole: false,
      mentorshipRole: null,
      mentorshipData: null,
      phaseId: null,
      isAssigned: false,
      mentorId: null,
      details: {}
    };
  }
};

// Check if user is an approved mentee
const checkApprovedMentee = async (userId) => {
  try {
    const mentee = await MenteeRequest.findOne({ 
      mentee_user_id: userId,
      status: { $in: ['approved', 'active', 'assigned'] }
    });
    
    return {
      isApprovedMentee: !!mentee,
      data: mentee,
      status: mentee?.status
    };
  } catch (error) {
    console.error('Error checking approved mentee:', error);
    return { isApprovedMentee: false, data: null };
  }
};

// Check if mentor is active
const checkActiveMentor = async (userId) => {
  try {
    const mentor = await MentorRegistration.findOne({ 
      mentor_id: userId 
    });
    
    // Check if mentor has active assignments
    const assignments = await MentorMenteeAssignment.find({
      mentor_user_id: userId
    });
    
    return {
      isActiveMentor: !!mentor,
      data: mentor,
      phaseId: mentor?.phaseId,
      assignmentCount: assignments.length,
      totalMentees: assignments.reduce((sum, a) => sum + a.mentee_user_ids.length, 0)
    };
  } catch (error) {
    console.error('Error checking active mentor:', error);
    return { isActiveMentor: false, data: null };
  }
};

// ==========================================
// ICON AND COLOR FUNCTIONS - BASED ON YOUR SCREENS TABLE
// ==========================================

// Helper function to get icon for screen - MATCHING YOUR SCREEN NAMES
const getIconForScreen = (screenName) => {
  const iconMap = {
    // Mentorship screens (from your data)
    'Coordinator Dashboard': 'Users',
    
    // Add other mentorship screens as needed
    'Meeting Status Update': 'CalendarCheck',
    'Program Feedback': 'MessageSquare',
    'Scheduled Dashboard': 'Calendar',
    'Admin Dashboard (Mentorship)': 'BarChart3',
    'Mentee Registration': 'UserPlus',
    'Mentor Registration': 'GraduationCap'
  };
  return iconMap[screenName] || 'HelpCircle';
};

// Helper function to get color for screen - MATCHING YOUR SCREEN NAMES
const getColorForScreen = (screenName) => {
  const colorMap = {
    // Mentorship screens (from your data)
    'Coordinator Dashboard': '#f59e0b',
    
    // Add other mentorship screens as needed
    'Meeting Status Update': '#3b82f6',
    'Program Feedback': '#8b5cf6',
    'Scheduled Dashboard': '#10b981',
    'Admin Dashboard (Mentorship)': '#ef4444',
    'Mentee Registration': '#3b82f6',
    'Mentor Registration': '#8b5cf6'
  };
  return colorMap[screenName] || '#6b7280';
};

// ==========================================
// CHECK ROLE MAPPING ENDPOINT
// ==========================================
router.get('/check-role-mapping/:roleId', async (req, res) => {
  try {
    const { roleId } = req.params;
    const adminDb = mongoose.connection.useDb("local_Administration");
    
    const permissions = await adminDb
      .collection("role_mapping")
      .find({ roleId: parseInt(roleId), canView: true })
      .toArray();
    
    const screenIds = permissions.map(p => p.screenId);
    
    // IMPORTANT: Only fetch screens where module is 'MENTORSHIP' (uppercase)
    const screens = await adminDb
      .collection("screens")
      .find({ 
        screenId: { $in: screenIds },
        module: 'MENTORSHIP'  // Uppercase as in your database
      })
      .toArray();
    
    // Get role name
    const role = await adminDb
      .collection("roles")
      .findOne({ roleId: parseInt(roleId) });
    
    res.json({
      success: true,
      roleId: roleId,
      roleName: role ? role.name : 'Unknown',
      permissionsCount: permissions.length,
      permissions: permissions,
      screensCount: screens.length,
      screens: screens,
      filteredModule: 'MENTORSHIP' // Indicate we filtered by mentorship module
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// CHECK ALL DATA ENDPOINT
// ==========================================
router.get('/check-all', async (req, res) => {
  try {
    const adminDb = mongoose.connection.useDb("local_Administration");
    
    // Get ALL screens but we'll show module information
    const allScreens = await adminDb
      .collection("screens")
      .find({})
      .toArray();
    
    // Group screens by module
    const screensByModule = {};
    allScreens.forEach(screen => {
      const module = screen.module || 'unknown';
      if (!screensByModule[module]) {
        screensByModule[module] = [];
      }
      screensByModule[module].push(screen);
    });
    
    const allRoles = await adminDb
      .collection("roles")
      .find({})
      .toArray();
    
    const allPermissions = await adminDb
      .collection("role_mapping")
      .find({})
      .toArray();
    
    // Group permissions by roleId
    const permissionsByRole = {};
    allPermissions.forEach(p => {
      if (!permissionsByRole[p.roleId]) {
        permissionsByRole[p.roleId] = [];
      }
      permissionsByRole[p.roleId].push(p);
    });
    
    res.json({
      success: true,
      rolesCount: allRoles.length,
      roles: allRoles,
      screensCount: allScreens.length,
      screensByModule: screensByModule, // Show screens grouped by module
      mentorshipScreensCount: screensByModule['MENTORSHIP']?.length || 0,
      permissionsCount: allPermissions.length,
      permissionsByRole: permissionsByRole
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// DEBUG ENDPOINT - Check User Data
// ==========================================
router.get('/debug/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    console.log('\n🔍 DEBUG: Fetching user data for:', email);
    
    const user = await User.findOne({ 'basic.email_id': email });
    
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    
    // Check mentorship status
    const mentorshipStatus = await checkUserMentorshipStatus(user._id);
    
    // Create a clean user object with all relevant fields
    const userData = {
      _id: user._id,
      name: user.basic?.name,
      email: user.basic?.email_id,
      label: user.label,
      batch: user.batch,
      graduationYear: user.graduationYear,
      passingYear: user.passingYear,
      yearOfPassing: user.yearOfPassing,
      education_details: user.education_details,
      basic: user.basic
    };
    
    // Find graduation year using our comprehensive function
    const foundYear = findGraduationYear(user);
    const userType = foundYear ? (foundYear < new Date().getFullYear() ? 'alumni' : 'student') : 'unknown';
    
    res.json({
      success: true,
      message: 'User data retrieved',
      userData: userData,
      foundGraduationYear: foundYear,
      determinedUserType: userType,
      mentorshipStatus: mentorshipStatus,
      allFields: user
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==========================================
// GET USER PERMISSIONS - MAIN ENDPOINT
// ==========================================
router.get('/', async (req, res) => {
  try {
    console.log('\n📨 ========== PERMISSIONS ENDPOINT HIT ==========');
    console.log('Query params:', req.query);
    
    const { email } = req.query;
    
    if (!email) {
      console.log('❌ No email provided');
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    const cleanEmail = email.toLowerCase().trim();
    console.log('Clean email:', cleanEmail);
    
    // Get user from database
    console.log('🔍 Looking up user in database...');
    const user = await User.findOne({ 'basic.email_id': cleanEmail });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('❌ User not found');
      return res.json({ 
        success: true, 
        role: 'new_user',
        userType: 'unknown',
        roleIds: [],
        quickActions: [] 
      });
    }
    
    console.log('✅ User found with ID:', user._id);
    console.log('User name:', user.basic?.name);
    console.log('User label (basic):', user.basic?.label);
    console.log('User label (root):', user.label);
    console.log('User batch:', user.batch);
    console.log('User graduationYear field:', user.graduationYear);
    
    // Connect to local_Administration database
    const adminDb = mongoose.connection.useDb("local_Administration");
    console.log('🔌 Connected to local_Administration database');
    
    // ========== STEP 1: FIRST CHECK - Is user admin by label? (based on placement code) ==========
    if (isAdminByLabel(user)) {
      console.log('👑 Admin detected by label - giving full mentorship access');
      
      // Get admin role ID (roleId 10 like in placement, or find it in roles table)
      const adminRole = await adminDb
        .collection("roles")
        .findOne({ name: { $regex: /^admin$/i } });
      
      const roleIds = adminRole ? [adminRole.roleId] : [10]; // Fallback to 10
      const roleNames = adminRole ? [adminRole.name] : ['Admin'];
      
      console.log('📋 Admin role IDs:', roleIds);
      console.log('📋 Admin role names:', roleNames);
      
      // Get permissions for admin
      const permissions = await adminDb
        .collection("role_mapping")
        .find({ 
          roleId: { $in: roleIds },
          canView: true 
        })
        .toArray();
      
      console.log(`📋 Found ${permissions.length} role mappings for admin`);
      
      // Get MENTORSHIP screens only
      let quickActions = [];
      if (permissions.length > 0) {
        const screenIds = [...new Set(permissions.map(p => p.screenId))];
        console.log('🎯 Screen IDs:', screenIds);
        
        const screens = await adminDb
          .collection("screens")
          .find({ 
            screenId: { $in: screenIds },
            module: 'MENTORSHIP'  // Uppercase as in your database
          })
          .toArray();
        
        console.log(`📱 Found ${screens.length} MENTORSHIP screens for admin`);
        
        const screenMap = {};
        screens.forEach(screen => { screenMap[screen.screenId] = screen; });
        
        quickActions = permissions
          .filter(p => screenMap[p.screenId])
          .map(permission => {
            const screen = screenMap[permission.screenId];
            return {
              id: screen.screenId,
              title: screen.name,
              description: `Access ${screen.name}`,
              icon: getIconForScreen(screen.name),
              path: screen.route,
              color: getColorForScreen(screen.name),
              module: screen.module,
              roleName: roleNames.join(', '),
              permissions: {
                canView: permission.canView,
                canCreate: permission.canCreate || false,
                canEdit: permission.canEdit || false,
                canDelete: permission.canDelete || false
              }
            };
          });
      }
      
      console.log(`✅ Admin Response: ${quickActions.length} mentorship quick actions`);
      
      return res.json({
        success: true,
        role: 'admin',
        userType: 'admin',
        roleIds,
        roleNames,
        isCoordinator: false, // Admin is not a coordinator specifically
        quickActions,
        isAssignedRole: true
      });
    }
    
    // ========== STEP 2: If not admin, check assign_roles for mentorship coordinator ==========
    console.log('\n📋 User is not admin - checking assign_roles for mentorship coordinator...');
    const assignedRoles = await adminDb
      .collection("assign_roles")
      .find({ memberId: user._id.toString() }) // Convert to string like placement code
      .toArray();
    
    console.log('📊 assign_roles found:', assignedRoles.length);
    
    let role = 'new_user';
    let roleIds = [];
    let quickActions = [];
    let userType = 'unknown';
    let roleNames = [];
    let isMentorshipCoordinator = false;
    let isAssignedRole = false;
    
    // Only process assigned roles if they exist
    if (assignedRoles && assignedRoles.length > 0) {
      // Get role IDs from assign_roles
      const potentialRoleIds = assignedRoles.map(role => role.roleId);
      console.log('Potential Role IDs:', potentialRoleIds);
      
      // Get role names from roles table
      console.log('🔍 Fetching role names from roles table...');
      const potentialRoles = await adminDb
        .collection("roles")
        .find({ roleId: { $in: potentialRoleIds } })
        .toArray();
      console.log('Potential roles found:', potentialRoles.length);
      
      // Log all role names for debugging
      console.log('Role names from assign_roles:');
      potentialRoles.forEach(r => console.log(`  - ${r.name}`));
      
      // STRICT CHECK: Check if ANY of the roles is a mentorship coordinator role
      // Using the strict function that requires BOTH "mentorship" AND "coordinator"
      isMentorshipCoordinator = potentialRoles.some(r => isMentorshipCoordinatorRole(r.name));
      console.log('Is mentorship coordinator (strict check):', isMentorshipCoordinator);
      
      // ONLY process if user is a mentorship coordinator
      if (isMentorshipCoordinator) {
        console.log('✅ User IS a mentorship coordinator - processing assigned roles');
        isAssignedRole = true;
        
        // Get ALL roleIds from assign_roles
        roleIds = assignedRoles.map(role => role.roleId);
        console.log('Role IDs:', roleIds);
        
        // Store role names
        roleNames = potentialRoles.map(r => r.name);
        
        if (roleNames.length > 0) {
          role = roleNames.join(', ');
          console.log('Role names:', role);
        }
        
        // Set userType based on roles
        if (isMentorshipCoordinator) {
          userType = 'coordinator';
        }
        
        // Get permissions from role_mapping for ALL roleIds
        console.log('🔍 Fetching permissions from role_mapping...');
        const permissions = await adminDb
          .collection("role_mapping")
          .find({ 
            roleId: { $in: roleIds },
            canView: true 
          })
          .toArray();
        console.log('Permissions found:', permissions.length);
        
        if (permissions.length > 0) {
          // Get unique screenIds
          const screenIds = [...new Set(permissions.map(p => p.screenId))];
          console.log('Unique Screen IDs:', screenIds);
          
          // IMPORTANT: Only fetch screens where module is 'MENTORSHIP' (uppercase)
          console.log('🔍 Fetching MENTORSHIP screens from screens table...');
          const screens = await adminDb
            .collection("screens")
            .find({ 
              screenId: { $in: screenIds },
              module: 'MENTORSHIP'  // Uppercase as in your database
            })
            .toArray();
          console.log('MENTORSHIP screens found:', screens.length);
          
          // Create screen map for quick lookup
          const screenMap = {};
          screens.forEach(screen => {
            screenMap[screen.screenId] = screen;
          });
          
          // Filter permissions to only those with mentorship screens
          const mentorshipPermissions = permissions.filter(p => screenMap[p.screenId]);
          
          console.log('Building quick actions from MENTORSHIP screens...');
          // Build quick actions
          quickActions = mentorshipPermissions.map(permission => {
            const screen = screenMap[permission.screenId];
            if (!screen) return null;
            
            // Get the specific role that gave this permission
            const permissionRole = potentialRoles.find(r => r.roleId === permission.roleId);
            
            return {
              id: screen.screenId,
              title: screen.name,
              description: `Access ${screen.name}`,
              icon: getIconForScreen(screen.name),
              path: screen.route,
              color: getColorForScreen(screen.name),
              module: screen.module, // Will always be 'MENTORSHIP'
              roleIds: [permission.roleId],
              roleName: permissionRole ? permissionRole.name : null,
              permissions: {
                canView: permission.canView,
                canCreate: permission.canCreate || false,
                canEdit: permission.canEdit || false,
                canDelete: permission.canDelete || false
              }
            };
          }).filter(action => action !== null);
          
          console.log('✅ Quick actions built from MENTORSHIP screens:', quickActions.length);
        } else {
          console.log('ℹ️ No permissions found for roles');
        }
      } else {
        console.log('ℹ️ User has assigned roles but is NOT a mentorship coordinator - skipping assigned roles processing');
        // Skip to the next steps (mentee/mentor tables)
      }
    } else {
      console.log('ℹ️ No assigned roles found');
    }
    
    // ==========================================
    // If user is NOT a mentorship coordinator, proceed with regular checks
    // ==========================================
    if (!isMentorshipCoordinator) {
      console.log('\n📋 User is NOT a mentorship coordinator - proceeding with regular checks');
      
      // Reset role and userType if they were set from coordinator flow
      if (!isAssignedRole) {
        role = 'new_user';
        userType = 'unknown';
      }
      
      // ==========================================
      // STEP 3: Check mentee table using MenteeRequest model
      // ==========================================
      console.log('\n📋 STEP 3: Checking mentee table');
      
      const menteeCheck = await checkMenteeTable(user._id);
      
      if (menteeCheck.isMentee) {
        console.log('✅ User is a MENTEE with status:', menteeCheck.status);
        userType = 'mentee';
        role = 'mentee';
        
        // Get default roleId for mentee
        const defaultRoleId = await getDefaultRoleId(adminDb, 'mentee');
        console.log('Default mentee roleId:', defaultRoleId);
        
        if (defaultRoleId) {
          roleIds = [defaultRoleId];
          
          // Get role name
          const defaultRole = await adminDb
            .collection("roles")
            .findOne({ roleId: defaultRoleId });
          
          if (defaultRole) {
            roleNames = [defaultRole.name];
            console.log('Role set to:', role);
          }
          
          // Fetch permissions from role_mapping (only MENTORSHIP screens)
          await fetchPermissionsForRole(adminDb, defaultRoleId, defaultRole, quickActions);
        }
      } else {
        // ==========================================
        // STEP 4: Check mentor table using MentorRegistration model
        // ==========================================
        console.log('\n📋 STEP 4: Not in mentee table - checking mentor table');
        
        const mentorCheck = await checkMentorTable(user._id);
        
        if (mentorCheck.isMentor) {
          console.log('✅ User is a MENTOR with phase:', mentorCheck.phaseId);
          userType = 'mentor';
          role = 'mentor';
          
          // Get default roleId for mentor
          const defaultRoleId = await getDefaultRoleId(adminDb, 'mentor');
          console.log('Default mentor roleId:', defaultRoleId);
          
          if (defaultRoleId) {
            roleIds = [defaultRoleId];
            
            // Get role name
            const defaultRole = await adminDb
              .collection("roles")
              .findOne({ roleId: defaultRoleId });
            
            if (defaultRole) {
              roleNames = [defaultRole.name];
              console.log('Role set to:', role);
            }
            
            // Fetch permissions from role_mapping (only MENTORSHIP screens)
            await fetchPermissionsForRole(adminDb, defaultRoleId, defaultRole, quickActions);
          }
        } else {
          // ==========================================
          // STEP 5: Determine student/alumni status
          // ==========================================
          console.log('\n📋 STEP 5: Not in mentee or mentor tables - determining student/alumni status');
          
          // Determine user type based on graduation year
          console.log('🔍 Searching for graduation year in all fields...');
          userType = determineUserType(user);
          role = userType;
          console.log('✅ Final user type determined:', userType);
          
          // Get default roleId from roles table
          const defaultRoleId = await getDefaultRoleId(adminDb, userType);
          console.log('Default roleId:', defaultRoleId);
          
          if (defaultRoleId) {
            roleIds = [defaultRoleId];
            
            // Get role name
            const defaultRole = await adminDb
              .collection("roles")
              .findOne({ roleId: defaultRoleId });
            
            if (defaultRole) {
              role = defaultRole.name.toLowerCase();
              roleNames = [defaultRole.name];
              console.log('Role set to:', role);
            }
            
            // Fetch permissions from role_mapping (only MENTORSHIP screens)
            await fetchPermissionsForRole(adminDb, defaultRoleId, defaultRole, quickActions);
          }
        }
      }
    }
    
    console.log('\n📤 ========== SENDING RESPONSE ==========');
    console.log('role:', role);
    console.log('userType:', userType);
    console.log('roleIds:', roleIds);
    console.log('roleNames:', roleNames);
    console.log('isMentorshipCoordinator:', isMentorshipCoordinator);
    console.log('quickActionsCount (MENTORSHIP only):', quickActions.length);
    console.log('isAssignedRole (only for mentorship coordinators):', isAssignedRole);
    console.log('=====================================\n');
    
    res.json({ 
      success: true, 
      role,
      userType,
      roleIds,
      roleNames,
      isCoordinator: isMentorshipCoordinator, // Renamed for frontend compatibility
      quickActions, // This will ONLY contain MENTORSHIP module screens
      isAssignedRole: isAssignedRole
    });
    
  } catch (error) {
    console.error('❌ ERROR in permissions endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// ==========================================
// Helper function to fetch permissions for a role
// FILTERS FOR MENTORSHIP MODULE ONLY (UPPERCASE)
// ==========================================
async function fetchPermissionsForRole(adminDb, roleId, role, quickActionsArray) {
  console.log(`🔍 Fetching permissions from role_mapping for roleId: ${roleId}`);
  const permissions = await adminDb
    .collection("role_mapping")
    .find({ 
      roleId: roleId,
      canView: true 
    })
    .toArray();
  console.log('Permissions found:', permissions.length);
  
  if (permissions.length > 0) {
    const screenIds = permissions.map(p => p.screenId);
    console.log('Screen IDs from role_mapping:', screenIds);
    
    // IMPORTANT: Only fetch screens where module is 'MENTORSHIP' (uppercase)
    const screens = await adminDb
      .collection("screens")
      .find({ 
        screenId: { $in: screenIds },
        module: 'MENTORSHIP'  // Uppercase as in your database
      })
      .toArray();
    console.log('MENTORSHIP screens found:', screens.length);
    
    const screenMap = {};
    screens.forEach(screen => {
      screenMap[screen.screenId] = screen;
    });
    
    // Filter permissions to only those with mentorship screens
    const mentorshipPermissions = permissions.filter(p => screenMap[p.screenId]);
    
    const actions = mentorshipPermissions.map(permission => {
      const screen = screenMap[permission.screenId];
      if (!screen) return null;
      
      return {
        id: screen.screenId,
        title: screen.name,
        description: `Access ${screen.name}`,
        icon: getIconForScreen(screen.name),
        path: screen.route,
        color: getColorForScreen(screen.name),
        module: screen.module, // Will always be 'MENTORSHIP'
        roleIds: [roleId],
        roleName: role ? role.name : null,
        permissions: {
          canView: permission.canView,
          canCreate: permission.canCreate || false,
          canEdit: permission.canEdit || false,
          canDelete: permission.canDelete || false
        }
      };
    }).filter(action => action !== null);
    
    quickActionsArray.push(...actions);
    console.log(`✅ Built ${actions.length} quick actions from MENTORSHIP screens`);
  } else {
    console.log('ℹ️ No permissions found in role_mapping for this role');
  }
}

// ==========================================
// NEW: Endpoint to get only MENTORSHIP screens
// ==========================================
router.get('/mentorship-screens', async (req, res) => {
  try {
    const adminDb = mongoose.connection.useDb("local_Administration");
    
    const mentorshipScreens = await adminDb
      .collection("screens")
      .find({ module: 'MENTORSHIP' }) // Uppercase as in your database
      .toArray();
    
    res.json({
      success: true,
      count: mentorshipScreens.length,
      screens: mentorshipScreens
    });
  } catch (error) {
    console.error('Error fetching mentorship screens:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==========================================
// TEST ENDPOINT
// ==========================================
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Permissions test endpoint is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;