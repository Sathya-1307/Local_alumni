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

const isCoordinatorRole = (roleName) => {
  if (!roleName) return false;
  const coordinatorKeywords = ['coordinator', 'Coordinator', 'placement_coordinator', 'Placement Coordinator'];
  return coordinatorKeywords.some(keyword => roleName.includes(keyword));
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
// MAIN PERMISSIONS ENDPOINT
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
    
    const adminDb = mongoose.connection.useDb("local_Administration");
    
    // Check assign_roles
    const assignedRoles = await adminDb
      .collection("assign_roles")
      .find({ memberId: user._id.toString() })
      .toArray();
    
    let userType = 'unknown';
    let roleIds = [];
    let roleNames = [];
    let isCoordinator = false;
    
    if (assignedRoles && assignedRoles.length > 0) {
      roleIds = assignedRoles.map(r => r.roleId);
      const roles = await adminDb
        .collection("roles")
        .find({ roleId: { $in: roleIds } })
        .toArray();
      
      roleNames = roles.map(r => r.name);
      isCoordinator = roles.some(r => isCoordinatorRole(r.name));
      
      if (isCoordinator) {
        userType = 'placement_coordinator';
      } else {
        const hasAdmin = roles.some(r => r.name.toLowerCase().includes('admin'));
        const hasAlumni = roles.some(r => r.name.toLowerCase().includes('alumni'));
        const hasStudent = roles.some(r => r.name.toLowerCase().includes('student'));
        
        if (hasAdmin) userType = 'admin';
        else if (hasAlumni) userType = 'alumni';
        else if (hasStudent) userType = 'student';
        else userType = 'assigned';
      }
    } else {
      userType = determineUserType(user);
      const defaultRoleId = await getDefaultRoleId(adminDb, userType);
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
    
    let quickActions = [];
    
    if (permissions.length > 0) {
      const screenIds = [...new Set(permissions.map(p => p.screenId))];
      
      const screens = await adminDb
        .collection("screens")
        .find({ 
          screenId: { $in: screenIds },
          module: 'PLACEMENT' 
        })
        .toArray();
      
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
    
    console.log(`✅ Sending ${quickActions.length} quick actions for ${userType}`);
    
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
})

module.exports = router;