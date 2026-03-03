// auth.js - Complete permissions endpoint with dynamic database access
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

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

// Helper function to check if a role is a coordinator role
const isCoordinatorRole = (roleName) => {
  if (!roleName) return false;
  const coordinatorKeywords = ['coordinator', 'Coordinator'];
  return coordinatorKeywords.some(keyword => roleName.includes(keyword));
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

// Helper function to get icon for screen
const getIconForScreen = (screenName) => {
  const iconMap = {
    // Webinar screens
    'Topic Approval Form': 'CheckSquare',
    'Webinar Completed Details Upload': 'Upload',
    'Speaker Assignment Form': 'Microphone',
    'Alumni Feedback Form': 'MessageSquare',
    'Admin Page (Webinar)': 'Settings',
    'Webinar Details': 'Info',
    'Student Request Form': 'FileText',
    'Webinar Events': 'Calendar',
    'Webinar Dashboard': 'Layout',
    'Webinar Circular': 'Bell',
    'Webinar Certificate': 'Award',
    'Student Feedback Form': 'MessageCircle',
    
    // Mentorship screens
    'Meeting Status Update': 'CalendarCheck',
    'Program Feedback': 'MessageSquare',
    'Scheduled Dashboard': 'Calendar',
    'Admin Dashboard (Mentorship)': 'BarChart3',
    'Coordinator Dashboard': 'Users',
    
    // Placement screens
    'Placement Dashboard': 'Briefcase',
    'Placement Admin Dashboard': 'Building',
    'Placement Feedback Form': 'FileText',
    'Requester Feedback Form': 'MessageCircle',
    'Alumni Feedback Display': 'Star',
    'Alumni Job Requests Display': 'Users',
    
    // Registration screens
    'Mentee Registration': 'UserPlus',
    'Mentor Registration': 'GraduationCap'
  };
  return iconMap[screenName] || 'HelpCircle';
};

// Helper function to get color for screen
const getColorForScreen = (screenName) => {
  const colorMap = {
    // Webinar screens
    'Topic Approval Form': '#8b5cf6',
    'Webinar Completed Details Upload': '#10b981',
    'Speaker Assignment Form': '#f59e0b',
    'Alumni Feedback Form': '#ec4899',
    'Admin Page (Webinar)': '#ef4444',
    'Webinar Details': '#6366f1',
    'Student Request Form': '#3b82f6',
    'Webinar Events': '#14b8a6',
    'Webinar Dashboard': '#6b7280',
    'Webinar Circular': '#f97316',
    'Webinar Certificate': '#eab308',
    'Student Feedback Form': '#06b6d4',
    
    // Mentorship screens
    'Meeting Status Update': '#3b82f6',
    'Program Feedback': '#8b5cf6',
    'Scheduled Dashboard': '#10b981',
    'Admin Dashboard (Mentorship)': '#ef4444',
    'Coordinator Dashboard': '#f59e0b',
    
    // Placement screens
    'Placement Dashboard': '#6366f1',
    'Placement Admin Dashboard': '#ec4899',
    'Placement Feedback Form': '#14b8a6',
    'Requester Feedback Form': '#f97316',
    'Alumni Feedback Display': '#eab308',
    'Alumni Job Requests Display': '#06b6d4',
    
    // Registration screens
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
    
    const screens = await adminDb
      .collection("screens")
      .find({ screenId: { $in: screenIds } })
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
      screens: screens
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
    
    const allScreens = await adminDb
      .collection("screens")
      .find({})
      .toArray();
    
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
      screens: allScreens,
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
    console.log('User label:', user.label);
    console.log('User batch:', user.batch);
    console.log('User graduationYear field:', user.graduationYear);
    
    // Connect to local_Administration database
    const adminDb = mongoose.connection.useDb("local_Administration");
    console.log('🔌 Connected to local_Administration database');
    
    // Check if user exists in assign_roles table
    console.log('🔍 Checking assign_roles for memberId:', user._id);
    const assignedRoles = await adminDb
      .collection("assign_roles")
      .find({ memberId: user._id })
      .toArray();
    
    console.log('📊 assign_roles found:', assignedRoles.length);
    
    let role = 'new_user';
    let roleIds = [];
    let quickActions = [];
    let userType = 'unknown';
    let roleNames = [];
    let isCoordinator = false;
    
    if (assignedRoles && assignedRoles.length > 0) {
      // ==========================================
      // CASE 1: USER HAS ASSIGNED ROLES
      // ==========================================
      console.log('✅ User HAS assigned roles');
      
      // Get ALL roleIds from assign_roles
      roleIds = assignedRoles.map(role => role.roleId);
      console.log('Role IDs:', roleIds);
      
      // Get role names from roles table
      console.log('🔍 Fetching role names from roles table...');
      const roles = await adminDb
        .collection("roles")
        .find({ roleId: { $in: roleIds } })
        .toArray();
      console.log('Roles found:', roles.length);
      
      // Store role names
      roleNames = roles.map(r => r.name);
      
      // Check if any of the roles is a coordinator role
      isCoordinator = roles.some(r => isCoordinatorRole(r.name));
      console.log('Is coordinator:', isCoordinator);
      
      if (roleNames.length > 0) {
        role = roleNames.join(', ');
        console.log('Role names:', role);
      }
      
      // Set userType based on roles
      if (isCoordinator) {
        userType = 'coordinator';
      } else {
        // Check if user has specific role types
        const hasStudentRole = roles.some(r => r.name.toLowerCase().includes('student'));
        const hasAlumniRole = roles.some(r => r.name.toLowerCase().includes('alumni'));
        const hasMentorRole = roles.some(r => r.name.toLowerCase().includes('mentor'));
        const hasMenteeRole = roles.some(r => r.name.toLowerCase().includes('mentee'));
        
        if (hasStudentRole || hasMenteeRole) {
          userType = 'student';
        } else if (hasAlumniRole || hasMentorRole) {
          userType = 'alumni';
        } else {
          userType = 'assigned';
        }
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
        
        // Get screen details
        console.log('🔍 Fetching screen details from screens table...');
        const screens = await adminDb
          .collection("screens")
          .find({ screenId: { $in: screenIds } })
          .toArray();
        console.log('Screens found:', screens.length);
        
        // Create screen map for quick lookup
        const screenMap = {};
        screens.forEach(screen => {
          screenMap[screen.screenId] = screen;
        });
        
        // Remove duplicate screens (keep first occurrence)
        const uniquePermissions = [];
        const seenScreenIds = new Set();
        
        permissions.forEach(permission => {
          if (!seenScreenIds.has(permission.screenId)) {
            seenScreenIds.add(permission.screenId);
            uniquePermissions.push(permission);
          }
        });
        
        console.log('Building quick actions...');
        // Build quick actions
        quickActions = uniquePermissions.map(permission => {
          const screen = screenMap[permission.screenId];
          if (!screen) return null;
          
          // Get the specific role that gave this permission
          const permissionRole = roles.find(r => r.roleId === permission.roleId);
          
          return {
            id: screen.screenId,
            title: screen.name,
            description: `Access ${screen.name}`,
            icon: getIconForScreen(screen.name),
            path: screen.route,
            color: getColorForScreen(screen.name),
            module: screen.module,
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
        
        console.log('✅ Quick actions built:', quickActions.length);
      } else {
        console.log('ℹ️ No permissions found for roles');
      }
      
    } else {
      // ==========================================
      // CASE 2: USER HAS NO ASSIGNED ROLES
      // ==========================================
      console.log('ℹ️ User has NO assigned roles - determining user type');
      
      // Check if admin first
      if (user.basic?.email_id === 'admin@gmail.com') {
        userType = 'admin';
        role = 'admin';
        console.log('👑 Admin user detected');
      } else {
        // Determine user type based on graduation year
        console.log('🔍 Searching for graduation year in all fields...');
        userType = determineUserType(user);
        role = userType;
        console.log('✅ Final user type determined:', userType);
      }
      
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
        
        // FETCH SCREENS FROM ROLE_MAPPING
        console.log(`🔍 Fetching permissions from role_mapping for roleId: ${defaultRoleId}`);
        const permissions = await adminDb
          .collection("role_mapping")
          .find({ 
            roleId: defaultRoleId,
            canView: true 
          })
          .toArray();
        console.log('Permissions found:', permissions.length);
        
        if (permissions.length > 0) {
          const screenIds = permissions.map(p => p.screenId);
          console.log('Screen IDs from role_mapping:', screenIds);
          
          const screens = await adminDb
            .collection("screens")
            .find({ screenId: { $in: screenIds } })
            .toArray();
          console.log('Screens found:', screens.length);
          
          const screenMap = {};
          screens.forEach(screen => {
            screenMap[screen.screenId] = screen;
          });
          
          quickActions = permissions.map(permission => {
            const screen = screenMap[permission.screenId];
            if (!screen) return null;
            
            return {
              id: screen.screenId,
              title: screen.name,
              description: `Access ${screen.name}`,
              icon: getIconForScreen(screen.name),
              path: screen.route,
              color: getColorForScreen(screen.name),
              module: screen.module,
              roleIds: [defaultRoleId],
              roleName: defaultRole ? defaultRole.name : null,
              permissions: {
                canView: permission.canView,
                canCreate: permission.canCreate || false,
                canEdit: permission.canEdit || false,
                canDelete: permission.canDelete || false
              }
            };
          }).filter(action => action !== null);
          
          console.log(`✅ Built ${quickActions.length} quick actions from role_mapping`);
        } else {
          console.log('ℹ️ No permissions found in role_mapping for this role');
        }
      }
    }
    
    console.log('\n📤 ========== SENDING RESPONSE ==========');
    console.log('role:', role);
    console.log('userType:', userType);
    console.log('roleIds:', roleIds);
    console.log('roleNames:', roleNames);
    console.log('isCoordinator:', isCoordinator);
    console.log('quickActionsCount:', quickActions.length);
    console.log('isAssignedRole:', assignedRoles.length > 0);
    console.log('=====================================\n');
    
    res.json({ 
      success: true, 
      role,
      userType,
      roleIds,
      roleNames,
      isCoordinator,
      quickActions,
      isAssignedRole: assignedRoles && assignedRoles.length > 0
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