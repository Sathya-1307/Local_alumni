const express = require('express');
const router = express.Router();
const placementDB = require('../config/placementDB');
const mongoose = require('mongoose');

// ========== COMPANY MAPPING SCHEMA (Updated with new fields) ==========
const companyMappingSchema = new mongoose.Schema({
  mapping_id: { 
    type: Number, 
    unique: true, 
    required: true 
  },
  alumni_user_id: { 
    type: String, 
    required: true 
  },
  company_id: { 
    type: Number, 
    required: true 
  },
  assigned_on: { 
    type: Date, 
    default: Date.now 
  },
  alumni_status: { 
    type: String,
    enum: ['Not Applied', 'Applied', 'Rejected', 'In Process', 'Selected'],
    default: 'Not Applied'
  },
  remarks: { 
    type: String,
    default: null 
  },
  // NEW FIELDS FROM SECOND FILE
  final_status: {
    type: String,
    enum: ['Closure', 'Not Doable', null],
    default: null
  },
  coordinator_remark: {
    type: String,
    default: null
  },
  last_updated_on: {
    type: Date,
    default: null
  }
}, {
  collection: 'company_mapping'
});

const CompanyMapping = placementDB.model('CompanyMapping', companyMappingSchema);

// ========== HELPER FUNCTION - Get Next Mapping ID ==========
const getNextMappingId = async () => {
  const lastMapping = await CompanyMapping.findOne().sort({ mapping_id: -1 });
  return lastMapping ? lastMapping.mapping_id + 1 : 1;
};

// ========== NEW ROUTE - Assign multiple companies ==========
router.post('/assign-multiple', async (req, res) => {
  try {
    const { alumni_user_id, company_ids, remarks } = req.body;
    
    console.log('Received multiple mapping request:', { alumni_user_id, company_ids, remarks });
    
    // Validate required fields
    if (!alumni_user_id || !company_ids || !Array.isArray(company_ids) || company_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields: alumni_user_id, company_ids (array)' 
      });
    }

    // Validate ObjectId format for alumni_user_id
    if (!mongoose.Types.ObjectId.isValid(alumni_user_id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid alumni user ID format' 
      });
    }

    // Check if alumni exists
    const memberCollection = mongoose.connection.client
      .db("test")
      .collection("members");
    
    const userExists = await memberCollection.findOne({
      _id: new mongoose.Types.ObjectId(alumni_user_id)
    });

    if (!userExists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Alumni not found in database' 
      });
    }

    // Check if companies exist
    const companyCollection = mongoose.connection.client
      .db("placement")
      .collection("company_registration");
    
    const existingMappings = [];
    const newMappings = [];
    
    for (const company_id of company_ids) {
      const companyExists = await companyCollection.findOne({ 
        company_id: parseInt(company_id) 
      });

      if (!companyExists) {
        return res.status(404).json({ 
          success: false, 
          message: `Company with ID ${company_id} not found in database` 
        });
      }

      // Check if mapping already exists
      const existingMapping = await CompanyMapping.findOne({
        alumni_user_id: alumni_user_id,
        company_id: parseInt(company_id)
      });

      if (existingMapping) {
        existingMappings.push({
          company_id: company_id,
          company_name: companyExists.name
        });
      } else {
        newMappings.push({
          company_id: parseInt(company_id),
          company_name: companyExists.name,
          is_alumni_company: companyExists.is_alumni_company || false
        });
      }
    }

    // Create new mappings
    const createdMappings = [];
    for (const company of newMappings) {
      const nextMappingId = await getNextMappingId();
      
      const mapping = new CompanyMapping({ 
        mapping_id: nextMappingId,
        alumni_user_id: alumni_user_id,
        company_id: company.company_id,
        assigned_on: new Date(),
        alumni_status: 'Not Applied',
        remarks: remarks || null,
        final_status: null,
        coordinator_remark: null,
        last_updated_on: new Date()
      });
      
      await mapping.save();
      createdMappings.push(mapping);
    }

    console.log('Multiple mappings saved successfully:', {
      created: createdMappings.length,
      alreadyExists: existingMappings.length
    });

    res.status(201).json({ 
      success: true, 
      message: 'Companies assigned successfully!',
      data: {
        created: createdMappings,
        already_exists: existingMappings
      },
      summary: {
        total_requested: company_ids.length,
        created: createdMappings.length,
        already_existed: existingMappings.length
      }
    });
  } catch (err) {
    console.error('Error in multiple company mapping:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// ========== GET: Get all companies for dropdown ==========
router.get('/available-companies', async (req, res) => {
  try {
    const companyCollection = mongoose.connection.client
      .db("placement")
      .collection("company_registration");
    
    const companies = await companyCollection.find({})
      .sort({ name: 1 })
      .project({
        company_id: 1,
        name: 1,
        is_alumni_company: 1,
        role: 1,
        location: 1,
        ctc_offered: 1,
        skills_required: 1,
        deadline: 1,
        link: 1,
        created_at: 1
      })
      .toArray();
    
    const formattedCompanies = companies.map(company => ({
      ...company,
      is_alumni_company: company.is_alumni_company || false,
      highlight_alumni: company.is_alumni_company === true
    }));
    
    res.status(200).json({ 
      success: true, 
      message: 'Companies fetched successfully',
      data: formattedCompanies 
    });
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// ========== GET: Check already assigned companies for alumni ==========
router.get('/alumni/:alumniId/assigned-companies', async (req, res) => {
  try {
    const alumniId = req.params.alumniId;
    
    const mappings = await CompanyMapping.find({ alumni_user_id: alumniId })
      .select('company_id alumni_status final_status coordinator_remark')
      .lean();
    
    const companyIds = mappings.map(m => m.company_id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Assigned companies fetched',
      data: {
        assigned_company_ids: companyIds,
        count: companyIds.length,
        mappings: mappings
      }
    });
  } catch (err) {
    console.error('Error fetching assigned companies:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// ========== EXISTING ROUTES ==========

// POST /api/company-mapping - Assign company to alumni
router.post('/', async (req, res) => {
  try {
    const { alumni_user_id, company_id, remarks } = req.body;
    
    console.log('Received mapping request:', { alumni_user_id, company_id, remarks });
    
    // Validate required fields
    if (!alumni_user_id || !company_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields: alumni_user_id, company_id' 
      });
    }

    // Validate ObjectId format for alumni_user_id
    if (!mongoose.Types.ObjectId.isValid(alumni_user_id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid alumni user ID format' 
      });
    }

    // Check if alumni exists
    const memberCollection = mongoose.connection.client
      .db("test")
      .collection("members");
    
    const userExists = await memberCollection.findOne({
      _id: new mongoose.Types.ObjectId(alumni_user_id)
    });

    if (!userExists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Alumni not found in database' 
      });
    }

    // Check if company exists
    const companyCollection = mongoose.connection.client
      .db("placement")
      .collection("company_registration");
    
    const companyExists = await companyCollection.findOne({ 
      company_id: parseInt(company_id) 
    });

    console.log('Company exists:', companyExists);

    if (!companyExists) {
      return res.status(404).json({ 
        success: false, 
        message: `Company with ID ${company_id} not found in database` 
      });
    }

    // Check if mapping already exists
    const existingMapping = await CompanyMapping.findOne({
      alumni_user_id: alumni_user_id,
      company_id: parseInt(company_id)
    });

    if (existingMapping) {
      return res.status(400).json({ 
        success: false, 
        message: 'This alumni is already assigned to this company' 
      });
    }

    // Get next auto-increment mapping_id
    const nextMappingId = await getNextMappingId();
    
    const mapping = new CompanyMapping({ 
      mapping_id: nextMappingId,
      alumni_user_id: alumni_user_id,
      company_id: parseInt(company_id),
      assigned_on: new Date(),
      alumni_status: 'Not Applied',
      remarks: remarks || null,
      final_status: null,
      coordinator_remark: null,
      last_updated_on: new Date()
    });
    
    await mapping.save();

    console.log('Mapping saved successfully:', mapping);

    res.status(201).json({ 
      success: true, 
      message: 'Company assigned successfully!', 
      data: mapping
    });
  } catch (err) {
    console.error('Error in company mapping:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// GET /api/company-mapping - Get all mappings with details
router.get('/', async (req, res) => {
  try {
    const mappings = await CompanyMapping.find().sort({ assigned_on: -1 });
    
    const memberCollection = mongoose.connection.client
      .db("test")
      .collection("members");
    
    const companyCollection = mongoose.connection.client
      .db("placement")
      .collection("company_registration");
    
    const enrichedMappings = await Promise.all(
      mappings.map(async (mapping) => {
        let member = null;
        let company = null;
        
        try {
          member = await memberCollection.findOne({
            _id: new mongoose.Types.ObjectId(mapping.alumni_user_id)
          });
        } catch (err) {
          console.log('Invalid ObjectId:', mapping.alumni_user_id);
        }
        
        company = await companyCollection.findOne({ company_id: mapping.company_id });
        
        return {
          ...mapping.toObject(),
          alumniName: member?.basic?.name || 'N/A',
          alumniBatch: member?.basic?.label || 'N/A',
          alumniEmail: member?.basic?.email_id || 'N/A',
          companyName: company?.name || 'N/A',
          companyRole: company?.role || 'N/A',
          companyLocation: company?.location || 'N/A',
          companyCtc: company?.ctc_offered || 'N/A',
          isAlumniCompany: company?.is_alumni_company || false,
          highlightAlumni: company?.is_alumni_company === true
        };
      })
    );
    
    res.status(200).json({ 
      success: true, 
      message: 'Mappings fetched successfully',
      data: enrichedMappings 
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

// GET /api/company-mapping/alumni/:alumniId - Get mappings for specific alumni
router.get('/alumni/:alumniId', async (req, res) => {
  try {
    const alumniId = req.params.alumniId;
    
    const mappings = await CompanyMapping.find({ alumni_user_id: alumniId })
      .sort({ assigned_on: -1 });
    
    if (mappings.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No companies assigned to this alumni',
        data: [] 
      });
    }

    const companyCollection = mongoose.connection.client
      .db("placement")
      .collection("company_registration");
    
    const enrichedMappings = await Promise.all(
      mappings.map(async (mapping) => {
        const company = await companyCollection.findOne({ company_id: mapping.company_id });
        
        return {
          ...mapping.toObject(),
          companyName: company?.name || 'N/A',
          companyRole: company?.role || 'N/A',
          companyLocation: company?.location || 'N/A',
          companyCtc: company?.ctc_offered || 'N/A',
          companySkills: company?.skills_required || 'N/A',
          companyDeadline: company?.deadline || null,
          companyLink: company?.link || null,
          isAlumniCompany: company?.is_alumni_company || false,
          highlightAlumni: company?.is_alumni_company === true
        };
      })
    );
    
    res.status(200).json({ 
      success: true, 
      message: 'Alumni mappings fetched successfully',
      data: enrichedMappings 
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

// PATCH /api/company-mapping/:mappingId - Update mapping (Updated with new fields)
router.patch('/:mappingId', async (req, res) => {
  try {
    const mappingId = parseInt(req.params.mappingId);
    const { alumni_status, remarks, final_status, coordinator_remark } = req.body;

    if (isNaN(mappingId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid mapping ID' 
      });
    }

    // Validate alumni_status
    const validStatuses = ['Not Applied', 'Applied', 'In Process', 'Selected', 'Rejected'];
    if (alumni_status && !validStatuses.includes(alumni_status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid alumni status. Valid values: Not Applied, Applied, In Process, Selected, Rejected' 
      });
    }

    // Validate final_status (if provided)
    if (final_status !== undefined && final_status !== null && !['Closure', 'Not Doable'].includes(final_status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid final status. Valid values: Closure, Not Doable, or null' 
      });
    }

    const updateData = { last_updated_on: new Date() };
    if (alumni_status !== undefined) updateData.alumni_status = alumni_status;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (final_status !== undefined) updateData.final_status = final_status;
    if (coordinator_remark !== undefined) updateData.coordinator_remark = coordinator_remark;

    const mapping = await CompanyMapping.findOneAndUpdate(
      { mapping_id: mappingId },
      updateData,
      { new: true }
    );

    if (!mapping) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mapping not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Mapping updated successfully',
      data: mapping 
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

// DELETE /api/company-mapping/:mappingId - Delete mapping
router.delete('/:mappingId', async (req, res) => {
  try {
    const mappingId = parseInt(req.params.mappingId);
    
    if (isNaN(mappingId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid mapping ID' 
      });
    }

    const mapping = await CompanyMapping.findOneAndDelete({ mapping_id: mappingId });

    if (!mapping) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mapping not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Mapping deleted successfully'
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

// GET /api/company-mapping/company/:companyId - Get all alumni assigned to a company
router.get('/company/:companyId', async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    
    if (isNaN(companyId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid company ID' 
      });
    }

    const mappings = await CompanyMapping.find({ company_id: companyId })
      .sort({ assigned_on: -1 });
    
    const memberCollection = mongoose.connection.client
      .db("test")
      .collection("members");
    
    const companyCollection = mongoose.connection.client
      .db("placement")
      .collection("company_registration");
    
    const company = await companyCollection.findOne({ company_id: companyId });
    
    const enrichedMappings = await Promise.all(
      mappings.map(async (mapping) => {
        let member = null;
        
        try {
          member = await memberCollection.findOne({
            _id: new mongoose.Types.ObjectId(mapping.alumni_user_id)
          });
        } catch (err) {
          console.log('Invalid ObjectId:', mapping.alumni_user_id);
        }
        
        return {
          ...mapping.toObject(),
          alumniName: member?.basic?.name || 'N/A',
          alumniBatch: member?.basic?.label || 'N/A',
          alumniEmail: member?.basic?.email_id || 'N/A',
          alumniMobile: member?.contact_details?.mobile || 'N/A',
          isAlumniCompany: company?.is_alumni_company || false,
          highlightAlumni: company?.is_alumni_company === true
        };
      })
    );
    
    res.status(200).json({ 
      success: true, 
      message: 'Company mappings fetched successfully',
      data: {
        company_info: {
          name: company?.name || 'N/A',
          is_alumni_company: company?.is_alumni_company || false
        },
        mappings: enrichedMappings
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

// GET /api/company-mapping/members/email/:email - Get alumni by email
router.get('/members/email/:email', async (req, res) => {
  try {
    const email = req.params.email;
    
    const memberCollection = mongoose.connection.client
      .db("test")
      .collection("members");
    
    const member = await memberCollection.findOne({
      "basic.email_id": email
    });
    
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'Alumni not found with this email' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: member 
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