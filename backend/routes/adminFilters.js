const express = require('express');
const router = express.Router();

// Domain mappings for display
const domainMappings = {
  'FULL STACK DEVELOPMENT (IT)': 'Full Stack Development (IT department)',
  'ARTIFICIAL INTELLIGENCE & DATA SCIENCE (AD & DS)': 'Artificial Intelligence & Data Science (AD & DS department)',
  'CLOUD COMPUTING (CSE)': 'Cloud Computing (CSE department)',
  'ROBOTIC AND AUTOMATION (MECH)': 'Robotic and Automation (MECH department)',
  'ELECTRICAL POWER SYSTEM (EEE)': 'Electrical Power System (EEE department)',
  'EMBEDDED SYSTEMS (ECE)': 'Embedded Systems (ECE department)',
  'STRUCTURAL ENGINEERING (CIVIL)': 'Structural Engineering (CIVIL department)',
  'Robotic and Automation (MECH department)': 'Robotic and Automation (MECH department)'
};

// Get dropdown options for filters
router.get('/filter-options', async (req, res) => {
  try {
    const WebinarPhase = req.app.locals.WebinarPhase || req.app.locals.WebinarPhaseModel;
    const Speaker = req.app.locals.Speaker;

    if (!WebinarPhase || !Speaker) {
      return res.status(500).json({ error: 'Database models not available' });
    }

    // Get unique phases from WebinarPhase with display text
    const phases = await WebinarPhase.find({}, 'phaseId startingDate endingDate domains').lean();
    const phaseOptions = phases.map(p => ({
      id: p.phaseId,
      name: `Phase ${p.phaseId} (${new Date(p.startingDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${new Date(p.endingDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`
    })).sort((a, b) => a.id - b.id);

    // Get unique domains from WebinarPhase and map to display names
    const allDomains = phases.flatMap(p => p.domains.map(d => domainMappings[d.domain] || d.domain));
    const domains = [...new Set(allDomains)].sort();

    // Get unique batches from Speaker
    const speakers = await Speaker.find({}, 'batch department').lean();
    const batches = [...new Set(speakers.map(s => s.batch).filter(Boolean))].sort();

    // Get unique departments from Speaker
    const departments = [...new Set(speakers.map(s => s.department).filter(Boolean))].sort();

    res.json({
      phases: phaseOptions,
      domains,
      batches,
      departments
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

module.exports = router;
