const express = require('express');
const router = express.Router();

// Import string-similarity for topic matching
const stringSimilarity = require('string-similarity');

// Function to group topics using fuzzy matching
function groupTopics(topics) {
  let groups = [];
  topics.forEach(t => {
    let found = false;
    for (let g of groups) {
      if (stringSimilarity.compareTwoStrings(t, g[0]) > 0.6) {
        g.push(t);
        found = true;
        break;
      }
    }
    if (!found) groups.push([t]);
  });
  return groups;
}

// POST route to submit student request form
router.post('/submit-student-request', async (req, res) => {
  try {
    const { email, domain, topic, reason, phaseId } = req.body;

    // Validate required fields
    if (!email || !domain || !topic || !reason) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create new student request form entry
    const newRequest = new req.app.locals.StudentRequestForm({
      email,
      domain,
      topic,
      reason,
      phaseId
    });

    // Save to database
    await newRequest.save();

    // Update topic approval table by re-grouping topics for this domain and phase
    const allRequestsForDomainAndPhase = await req.app.locals.StudentRequestForm.find({ domain, phaseId });
    const topicsForDomainAndPhase = allRequestsForDomainAndPhase.map(request => request.topic);

    const groupedTopics = groupTopics(topicsForDomainAndPhase);

    // Clear existing topic approvals for this domain and phase
    await req.app.locals.TopicApproval.deleteMany({ domain, phaseId });

    // Create new topic approvals based on grouped topics
    const topicApprovals = groupedTopics.map(group => ({
      phaseId,
      domain,
      topic: group[0], // Use the first topic as representative
      total_requested: group.length,
      approval: 'On Hold'
    }));

    await req.app.locals.TopicApproval.insertMany(topicApprovals);

    res.status(201).json({ message: 'Student request submitted successfully' });
  } catch (error) {
    console.error('Error submitting student request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
