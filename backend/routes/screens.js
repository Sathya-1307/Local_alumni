// screen.js - Updated endpoint
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ==========================================
// GET USER'S ACCESSIBLE SCREENS BASED ON ASSIGNED ROLES OR DEFAULT ROLE
// ==========================================
router.get('/user-access', async (req, res) => {
  try {
    const { email } = req.query;
    const cleanEmail = email.toLowerCase().trim();
    
    const adminDb = mongoose.connection.useDb("local_Administration");
    const User = require('../models/User');
    
    // First, find the user in members collection
    const user = await User.findOne({ 'basic.email_id': cleanEmail });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const userId = user._id;
    let roleIds = [];
    let userType = '';
    let isAssignedRole = false;
    
    // Step 1: Check if user has assigned roles in assign_roles table
    const assignedRoles = await adminDb
      .collection("assign_roles")
      .find({ memberId: userId })
      .toArray();
    
    if (assignedRoles && assignedRoles.length > 0) {
      // User has assigned roles - get all roleIds
      roleIds = assignedRoles.map(role => role.roleId);
      isAssignedRole = true;
      userType = 'assigned';
      console.log(`User has assigned roles: ${roleIds.join(', ')}`);
    } else {
      // Step 2: No assigned roles - determine default role based on user type
      
      // Extract graduation year to determine if alumni or student
      let graduationYear = null;
      if (user.education_details && Array.isArray(user.education_details)) {
        const education = user.education_details.find(edu => 
          edu.passing_year || edu.yearOfPassing || edu.graduationYear
        );
        if (education) {
          graduationYear = education.passing_year || education.yearOfPassing || education.graduationYear;
        }
      }
      
      // Check if admin (hardcoded for now, but should come from roles table)
      if (cleanEmail === 'admin@gmail.com') {
        roleIds = [10]; // Admin roleId
        userType = 'admin';
      } else {
        const currentYear = new Date().getFullYear();
        if (graduationYear && graduationYear < currentYear) {
          roleIds = [8]; // Alumni roleId
          userType = 'alumni';
        } else {
          roleIds = [5]; // Student/Mentee roleId
          userType = 'student';
        }
      }
      console.log(`User has no assigned roles, using default role: ${roleIds[0]} (${userType})`);
    }
    
    // Step 3: Get all permissions from role_mapping table for these roleIds
    const permissions = await adminDb
      .collection("role_mapping")
      .find({ 
        roleId: { $in: roleIds },
        canView: true 
      })
      .toArray();
    
    // Get unique screenIds from permissions
    const screenIds = [...new Set(permissions.map(p => p.screenId))];
    
    // Step 4: Get screen details from screens table
    const screens = await adminDb
      .collection("screens")
      .find({ screenId: { $in: screenIds } })
      .toArray();
    
    // Create a map of screen details
    const screenMap = {};
    screens.forEach(screen => {
      screenMap[screen.screenId] = {
        name: screen.name,
        module: screen.module,
        route: screen.route
      };
    });
    
    // Step 5: Combine permissions with screen details
    const accessibleScreens = permissions.map(p => ({
      screenId: p.screenId,
      roleId: p.roleId,
      canView: p.canView,
      canCreate: p.canCreate || false,
      canEdit: p.canEdit || false,
      canDelete: p.canDelete || false,
      ...screenMap[p.screenId]
    })).filter(s => s.name); // Filter out any screens without names
    
    // Remove duplicates (in case same screen is accessible through multiple roles)
    const uniqueScreens = [];
    const seenScreenIds = new Set();
    
    accessibleScreens.forEach(screen => {
      if (!seenScreenIds.has(screen.screenId)) {
        seenScreenIds.add(screen.screenId);
        uniqueScreens.push(screen);
      }
    });
    
    res.json({ 
      success: true, 
      userId: userId,
      email: cleanEmail,
      isAssignedRole: isAssignedRole,
      userType: userType,
      roleIds: roleIds,
      screens: uniqueScreens
    });
    
  } catch (error) {
    console.error('Error fetching user screens:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;