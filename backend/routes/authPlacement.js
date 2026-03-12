const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const extractYearFromLabel = (label) => {
  if (!label) return null;
  const yearMatch = String(label).match(/\b(19|20)\d{2}\b/);
  return yearMatch ? parseInt(yearMatch[0]) : null;
};

const findGraduationYear = (user) => {
  const fieldsToCheck = [
    { name: 'label', value: user.label },
    { name: 'batch', value: user.batch },
    { name: 'graduationYear', value: user.graduationYear },
    { name: 'passingYear', value: user.passingYear },
    { name: 'yearOfPassing', value: user.yearOfPassing }
  ];
  
  for (const field of fieldsToCheck) {
    if (field.value) {
      const year = extractYearFromLabel(field.value);
      if (year) return year;
    }
  }
  
  if (user.education_details && Array.isArray(user.education_details)) {
    for (const edu of user.education_details) {
      if (edu.end_year) {
        const year = extractYearFromLabel(String(edu.end_year));
        if (year) return year;
      }
    }
  }
  
  return null;
};

const determineUserType = (user) => {
  const currentYear = new Date().getFullYear();
  const graduationYear = findGraduationYear(user);
  
  if (graduationYear) {
    return graduationYear < currentYear ? 'alumni' : 'student';
  }
  return 'student';
};

// ========== FIXED: Check if user is admin based on label (checking inside basic object) ==========
const isAdminByLabel = (user) => {
  if (!user) return false;
  
  // Check in basic.label first (since your data shows label inside basic)
  if (user.basic && user.basic.label) {
    const labelLower = String(user.basic.label).toLowerCase();
    if (labelLower.includes('admin') || labelLower === 'administrator') {
      return true;
    }
  }
  
  // Also check root level label as fallback
  if (user.label) {
    const labelLower = String(user.label).toLowerCase();
    if (labelLower.includes('admin') || labelLower === 'administrator') {
      return true;
    }
  }
  
  return false;
};

// ========== Only check for Placement Coordinator specifically ==========
const isPlacementCoordinator = (roleName) => {
  if (!roleName) return false;
  const roleNameLower = roleName.toLowerCase();
  return roleNameLower.includes('placement coordinator') || 
         roleNameLower === 'placement_coordinator' ||
         roleNameLower.includes('placement');
};

const getDefaultRoleId = async (adminDb, userType) => {
  try {
    let roleName = '';
    switch(userType) {
      case 'alumni': roleName = 'Alumni'; break;
      case 'student': roleName = 'Student'; break;
      case 'admin': roleName = 'Admin'; break;
      case 'placement_coordinator': roleName = 'Placement Coordinator'; break;
      default: return null;
    }
    
    const role = await adminDb
      .collection("roles")
      .findOne({ name: { $regex: new RegExp(`^${roleName}$`, 'i') } });
    
    return role ? role.roleId : null;
  } catch (error) {
    console.error('Error getting default roleId:', error);
    return null;
  }
};

// ==========================================
// ICON FUNCTIONS
// ==========================================
const getIconForScreen = (screenName) => {
  const iconMap = {
    'Admin Dashboard': 'LayoutDashboard',
    'Assigned Companies': 'Briefcase',
    'Requester Feedback': 'MessageSquare',
    'Placement Data Request': 'FileText',
    'Company Registration': 'Building',
    'Interview Results': 'BarChart3',
    'Placement Feedback': 'Star',
    'Companies List': 'Table',
    'Interview Results View': 'BarChart3',
    'Alumni Feedback Display': 'MessageSquare',
    'Alumni Job Requests Display': 'Briefcase',
    'Placement Dashboard': 'LayoutDashboard'
  };
  return iconMap[screenName] || 'Circle';
};

const getColorForScreen = (screenName) => {
  const colorMap = {
    'Company Registration': '#3b82f6',
    'Companies List': '#10b981',
    'Requester Feedback': '#ef4444',
    'Placement Feedback': '#ec4899',
    'Admin Dashboard': '#14b8a6',
    'Assigned Companies': '#f59e0b',
    'Interview Results': '#8b5cf6',
    'Interview Results View': '#8b5cf6',
    'Placement Data Request': '#3b82f6',
    'Alumni Feedback Display': '#ef4444',
    'Alumni Job Requests Display': '#f59e0b'
  };
  return colorMap[screenName] || '#6b7280';
};

// ==========================================
// MAIN PERMISSIONS ENDPOINT - WITH LABEL CHECK FOR ADMIN
// ==========================================
router.get('/', async (req, res) => {
  try {
    console.log('\n📨 ========== PLACEMENT PERMISSIONS ENDPOINT HIT ==========');
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ 'basic.email_id': cleanEmail });
    
    if (!user) {
      return res.json({ success: true, userType: 'unknown', quickActions: [] });
    }
    
    console.log('📋 User found:', {
      name: user.basic?.name,
      email: user.basic?.email_id,
      label: user.basic?.label || user.label // Show both possible label locations
    });
    
    const adminDb = mongoose.connection.useDb("local_Administration");
    
    // ========== FIRST CHECK: Is user admin by label? ==========
    if (isAdminByLabel(user)) {
      console.log('👑 Admin detected by label:', user.basic?.label || user.label);
      
      // Get admin role ID (roleId 10)
      const adminRole = await adminDb
        .collection("roles")
        .findOne({ name: { $regex: /^admin$/i } });
      
      const roleIds = adminRole ? [adminRole.roleId] : [10];
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
      
      // Get screens
      let quickActions = [];
      if (permissions.length > 0) {
        const screenIds = [...new Set(permissions.map(p => p.screenId))];
        console.log('🎯 Screen IDs:', screenIds);
        
        const screens = await adminDb
          .collection("screens")
          .find({ 
            screenId: { $in: screenIds },
            module: 'PLACEMENT' 
          })
          .toArray();
        
        console.log(`📱 Found ${screens.length} PLACEMENT screens`);
        
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
      
      console.log(`✅ Admin Response: ${quickActions.length} quick actions`);
      
      return res.json({
        success: true,
        userType: 'admin',
        roleIds,
        roleNames,
        isCoordinator: false,
        quickActions
      });
    }
    
    // ========== If not admin by label, check assign_roles ==========
    console.log(`🔍 Looking for memberId: ${user._id.toString()}`);
    const assignedRoles = await adminDb
      .collection("assign_roles")
      .find({ memberId: user._id.toString() })
      .toArray();
    
    console.log(`📊 Found ${assignedRoles.length} assigned roles`);
    
    let userType = 'unknown';
    let roleIds = [];
    let roleNames = [];
    let isCoordinator = false;
    
    if (assignedRoles && assignedRoles.length > 0) {
      console.log('✅ User HAS assigned roles');
      roleIds = assignedRoles.map(r => r.roleId);
      console.log('📋 Role IDs from DB:', roleIds);
      
      const roles = await adminDb
        .collection("roles")
        .find({ roleId: { $in: roleIds } })
        .toArray();
      
      roleNames = roles.map(r => r.name);
      console.log('📋 Role Names from DB:', roleNames);
      
      // Check for PLACEMENT COORDINATOR specifically (roleId 9 or name contains placement coordinator)
      const hasPlacementCoordinator = roles.some(r => 
        isPlacementCoordinator(r.name) || r.roleId === 9
      );
      
      // Check for ALUMNI (roleId 8 or name contains alumni)
      const hasAlumni = roles.some(r => r.name.toLowerCase().includes('alumni') || r.roleId === 8);
      
      // Check for STUDENT (roleId 1 or name contains student)
      const hasStudent = roles.some(r => r.name.toLowerCase().includes('student') || r.roleId === 1);
      
      // Determine user type in priority order
      if (hasPlacementCoordinator) {
        userType = 'placement_coordinator';
        isCoordinator = true;
        console.log('⚙️ Placement Coordinator detected');
      }
      else if (hasAlumni) {
        userType = 'alumni';
        isCoordinator = false;
        console.log('🎓 Alumni detected');
      }
      else if (hasStudent) {
        userType = 'student';
        isCoordinator = false;
        console.log('📚 Student detected');
      }
      else {
        // For any other roles (like Mentorship Coordinator - roleId 7)
        // Determine based on graduation year
        userType = determineUserType(user);
        isCoordinator = false;
        console.log(`📅 Other role (${roleIds}) - using graduation year: ${userType}`);
      }
      
    } else {
      console.log('⚠️ No assigned roles - using graduation year');
      userType = determineUserType(user);
      console.log(`📅 Graduation year check result: ${userType}`);
      
      const defaultRoleId = await getDefaultRoleId(adminDb, userType);
      console.log(`🎯 Default roleId for ${userType}:`, defaultRoleId);
      
      if (defaultRoleId) {
        roleIds = [defaultRoleId];
        const defaultRole = await adminDb
          .collection("roles")
          .findOne({ roleId: defaultRoleId });
        if (defaultRole) roleNames = [defaultRole.name];
      }
    }
    
    // Get permissions from role_mapping
    const permissions = await adminDb
      .collection("role_mapping")
      .find({ 
        roleId: { $in: roleIds },
        canView: true 
      })
      .toArray();
    
    console.log(`📋 Found ${permissions.length} role mappings`);
    
    let quickActions = [];
    
    if (permissions.length > 0) {
      const screenIds = [...new Set(permissions.map(p => p.screenId))];
      console.log('🎯 Screen IDs:', screenIds);
      
      const screens = await adminDb
        .collection("screens")
        .find({ 
          screenId: { $in: screenIds },
          module: 'PLACEMENT' 
        })
        .toArray();
      
      console.log(`📱 Found ${screens.length} PLACEMENT screens`);
      
      const screenMap = {};
      screens.forEach(screen => { screenMap[screen.screenId] = screen; });
      
      const validPermissions = permissions.filter(p => screenMap[p.screenId]);
      
      quickActions = validPermissions.map(permission => {
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
    
    console.log(`✅ Final Response:`);
    console.log(`   - userType: ${userType}`);
    console.log(`   - isCoordinator: ${isCoordinator}`);
    console.log(`   - roleIds:`, roleIds);
    console.log(`   - roleNames:`, roleNames);
    console.log(`   - quickActions: ${quickActions.length}`);
    
    res.json({
      success: true,
      userType,
      roleIds,
      roleNames,
      isCoordinator,
      quickActions
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Placement Auth working' });
});

module.exports = router;