const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const placementDB = require('../config/placementDB');

const mongoose = require('mongoose');

// ========== MULTER SETUP ==========
const uploadDir = path.join(__dirname, '..', 'uploads'); 

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${uniqueSuffix}-${safeName}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ========== JOB REQUEST SCHEMA (As per your table) ==========
const jobRequestSchema = new mongoose.Schema({
  request_id: { 
    type: Number, 
    unique: true, 
    required: true 
  },
  alumni_user_id: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    maxlength: 100, 
    required: true 
  },
  skillset: { 
    type: String, 
    maxlength: 255, 
    required: true 
  },
  company: { 
    type: String, 
    maxlength: 150, 
    required: true 
  },
  experience: { 
    type: String, 
    maxlength: 50, 
    default: null 
  },
  ctc_current: { 
    type: String, 
    maxlength: 50, 
    default: null 
  },
  message: { 
    type: String, 
    default: null 
  },
  attachment: { 
    type: String, 
    default: null 
  },
  requested_on: { 
    type: Date, 
    default: Date.now 
  },
  approved_on: { 
    type: Date, 
    default: null 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  }
}, {
  collection: 'placement_data_requests' // Custom collection name
});

const JobRequest = placementDB.model('JobRequest', jobRequestSchema);

// ========== HELPER FUNCTION - Get Next Request ID ==========
const getNextRequestId = async () => {
  const lastRequest = await JobRequest.findOne().sort({ request_id: -1 });
  return lastRequest ? lastRequest.request_id + 1 : 1;
};

// ========== NEW ENDPOINT - Check if user has submitted request ==========
// GET /api/placement-requests/check/:email - Check if user has placement request
router.get('/check/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // First, get user ID from email in test database
    const memberCollection = mongoose.connection.client
      .db("test")
      .collection("members");
    
    const member = await memberCollection.findOne({
      'basic.email_id': email
    });

    if (!member) {
      return res.status(200).json({ 
        success: true, 
        hasRequested: false,
        message: 'User not found'
      });
    }

    // Check if this user has any job request
    const jobRequest = await JobRequest.findOne({ 
      alumni_user_id: member._id.toString() 
    });

    res.status(200).json({ 
      success: true, 
      hasRequested: jobRequest ? true : false,
      requestStatus: jobRequest?.status || null
    });
  } catch (err) {
    console.error('Error checking placement request:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// ========== ROUTES ==========

// GET /api/job-requests - Fetch all job requests with user details
router.get('/', async (req, res) => {
  try {
    const jobRequests = await JobRequest.find()
      .sort({ requested_on: -1 })
      .select('-__v');
    
    // Get user details from 'test' database
    const memberCollection = mongoose.connection.client
      .db("test")
      .collection("members");
    
    const enrichedRequests = await Promise.all(
      jobRequests.map(async (request) => {
        let member = null;
        try {
          member = await memberCollection.findOne({
            _id: new mongoose.Types.ObjectId(request.alumni_user_id)
          });
        } catch (err) {
          console.log('Invalid ObjectId:', request.alumni_user_id);
        }
        
        return {
          ...request.toObject(),
          userName: member?.basic?.name || 'N/A',
          userBatch: member?.basic?.label || 'N/A',
          userContact: member?.contact_details?.mobile || 'N/A',
          userEmail: member?.basic?.email_id || 'N/A'
        };
      })
    );
    
    res.status(200).json({ 
      success: true, 
      message: 'Job requests fetched successfully',
      data: enrichedRequests 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// POST /api/job-requests - Create new job request
router.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const { userId, location, skillset, company, experience, ctc, message } = req.body;
    
    // Validate required fields (as per NOT NULL constraints)
    if (!userId || !location || !skillset || !company) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields: userId, location, skillset, company' 
      });
    }

    // Verify userId exists in test database
    const memberCollection = mongoose.connection.client
      .db("test")
      .collection("members");
    
    let userExists = null;
    try {
      userExists = await memberCollection.findOne({
        _id: new mongoose.Types.ObjectId(userId)
      });
    } catch (err) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    if (!userExists) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }

    // Get next auto-increment request_id
    const nextRequestId = await getNextRequestId();
    
    const jobRequest = new JobRequest({ 
      request_id: nextRequestId,
      alumni_user_id: userId,
      location: location,
      skillset: skillset,
      company: company,
      experience: experience || null,
      ctc_current: ctc || null,
      message: message || null,
      attachment: req.file ? req.file.filename : null,
      requested_on: new Date(),
      approved_on: null,
      status: 'Pending'
    });
    
    await jobRequest.save();

    res.status(201).json({ 
      success: true, 
      message: 'Job request submitted successfully!', 
      jobRequest: {
        request_id: jobRequest.request_id,
        alumni_user_id: jobRequest.alumni_user_id,
        status: jobRequest.status,
        requested_on: jobRequest.requested_on
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// PATCH /api/job-requests/:requestId - Update job request status
router.patch('/:requestId', async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    const { status } = req.body;

    if (isNaN(requestId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request ID' 
      });
    }

    if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid status (Pending, Approved, Rejected) is required' 
      });
    }

    const updateData = { status };
    
    // Set approved_on date when status is Approved
    if (status === 'Approved') {
      updateData.approved_on = new Date();
    } else if (status === 'Pending' || status === 'Rejected') {
      updateData.approved_on = null;
    }

    const jobRequest = await JobRequest.findOneAndUpdate(
      { request_id: requestId },
      updateData,
      { new: true }
    );

    if (!jobRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job request not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: `Job request ${status.toLowerCase()} successfully`,
      data: jobRequest 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// GET /api/job-requests/:requestId - Get single job request with user details
router.get('/:requestId', async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    
    if (isNaN(requestId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request ID' 
      });
    }

    const jobRequest = await JobRequest.findOne({ request_id: requestId }).select('-__v');

    if (!jobRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job request not found' 
      });
    }

    // Get user details
    const memberCollection = mongoose.connection.client
      .db("test")
      .collection("members");
    
    let member = null;
    try {
      member = await memberCollection.findOne({
        _id: new mongoose.Types.ObjectId(jobRequest.alumni_user_id)
      });
    } catch (err) {
      console.log('Invalid ObjectId:', jobRequest.alumni_user_id);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Job request fetched successfully',
      data: {
        ...jobRequest.toObject(),
        userName: member?.basic?.name || 'N/A',
        userBatch: member?.basic?.label || 'N/A',
        userContact: member?.contact_details?.mobile || 'N/A',
        userEmail: member?.basic?.email_id || 'N/A'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// DELETE /api/job-requests/:requestId - Delete job request
router.delete('/:requestId', async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    
    if (isNaN(requestId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request ID' 
      });
    }

    const jobRequest = await JobRequest.findOneAndDelete({ request_id: requestId });

    if (!jobRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job request not found' 
      });
    }

    // Delete associated file
    if (jobRequest.attachment) {
      const filePath = path.join(__dirname, 'uploads', jobRequest.attachment);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Job request deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// GET /api/job-requests/user/:userId - Get job requests by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const jobRequests = await JobRequest.find({ 
      alumni_user_id: userId 
    }).sort({ requested_on: -1 }).select('-__v');

    res.status(200).json({ 
      success: true, 
      message: 'Job requests fetched successfully',
      data: jobRequests 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});
// Backend - GET /api/placement-requests - Fetch all placement requests with emails
router.get('/', async (req, res) => {
  try {
    const jobRequests = await JobRequest.find()
      .sort({ requested_on: -1 })
      .select('-__v');
    
    // Get user details from 'test' database
    const memberCollection = mongoose.connection.client
      .db("test")
      .collection("members");
    
    const enrichedRequests = await Promise.all(
      jobRequests.map(async (request) => {
        let member = null;
        try {
          member = await memberCollection.findOne({
            _id: new mongoose.Types.ObjectId(request.alumni_user_id)
          });
        } catch (err) {
          console.log('Invalid ObjectId:', request.alumni_user_id);
        }
        
        return {
          ...request.toObject(),
          userName: member?.basic?.name || 'N/A',
          userBatch: member?.basic?.label || 'N/A',
          userContact: member?.contact_details?.mobile || 'N/A',
          userEmail: member?.basic?.email_id || 'N/A'
        };
      })
    );
    
    res.status(200).json({ 
      success: true, 
      message: 'Placement requests fetched successfully',
      data: enrichedRequests 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

module.exports = router;