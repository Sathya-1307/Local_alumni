// companyRoutes.js
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const placementDB = require('../config/placementDB');

// ========== MODEL ==========
const companySchema = new mongoose.Schema({
  company_id: { type: Number, required: true },
  name: { type: String, required: true },
  is_alumni_company: { type: Boolean, default: false },
  role: { type: String, required: true },
  description: { type: String },
  skills_required: { type: String, required: true },
  ctc_offered: { type: String },
  location: { type: String, required: true },
  link: { type: String },
  deadline: { type: Date },
  poster: { type: String }
});

// const Company = mongoose.model(
//   'Company',
//   companySchema,
//   'company_registration'
// );

const Company = placementDB.model('Company', companySchema,'company_registration');

// ========== CONTROLLERS ==========
const registerCompany = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Received file:', req.file);

    const {
      companyName,
      isAlumniCompany,
      jobRole,
      requiredSkills,
      ctcOffered,
      location,
      deadline,
      applicationLink,
      jobDescription
    } = req.body;

    let posterBase64 = null;

    if (req.file) {
      posterBase64 = req.file.buffer.toString('base64');
    }

    // Get last company_id
    const lastCompany = await Company.findOne().sort({ company_id: -1 });
    const newCompanyId = lastCompany ? lastCompany.company_id + 1 : 1;

    const newCompany = new Company({
      company_id: newCompanyId,
      name: companyName,
      is_alumni_company:
        isAlumniCompany === 'true' || isAlumniCompany === true,
      role: jobRole,
      description: jobDescription,
      skills_required: requiredSkills,
      ctc_offered: ctcOffered,
      location: location,
      link: applicationLink,
      deadline: new Date(deadline),
      poster: posterBase64
    });

    await newCompany.save();

    res.status(201).json({
      success: true,
      message: 'Company Registered Successfully!',
      company: newCompany
    });
  } catch (error) {
    console.error('Error saving company:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving company',
      error: error.message
    });
  }
};

const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ company_id: -1 });

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies',
      error: error.message
    });
  }
};

// ========== ROUTES ==========
const router = express.Router();

// Multer config
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Routes
router.post('/register', upload.single('poster'), registerCompany);
// Add this route in companyRoutes.js
router.get('/all', async (req, res) => {
  try {
    const companies = await Company.find().sort({ company_id: -1 });

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies',
      error: error.message
    });
  }
});
router.get('/', getAllCompanies);
router.get('/test', (req, res) => {
  res.json({ message: 'Company routes working!' });
});

// 👇 IMPORTANT
module.exports = router;
