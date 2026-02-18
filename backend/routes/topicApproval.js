const express = require('express');
const router = express.Router();

// Import string-similarity
const stringSimilarity = require('string-similarity');

// Function to group topics
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

// GET route to get topic approvals
router.get('/topic-approvals', async (req, res) => {
  try {
    const { phase } = req.query;
    let query = {};

    if (phase) {
      // Extract phaseId from phase string (e.g., "Phase 6" -> 6)
      const phaseId = parseInt(phase.replace('Phase ', ''));
      if (!isNaN(phaseId)) {
        query.phaseId = phaseId;
      }
    }

    let topicApprovals = await req.app.locals.TopicApproval.find(query);

    // If no topic approvals exist for this phase, generate them from student requests
    if (topicApprovals.length === 0 && phase) {
      const phaseId = parseInt(phase.replace('Phase ', ''));
      if (!isNaN(phaseId)) {
        // Double-check if approvals were created by another request while this one was processing
        const existingApprovals = await req.app.locals.TopicApproval.find({ phaseId });
        if (existingApprovals.length === 0) {
          console.log(`No topic approvals found for phase ${phaseId}, generating from student requests...`);

          // Fetch student requests for this specific phase
          const studentRequests = await req.app.locals.StudentRequestForm.find({ phaseId });

          if (studentRequests.length > 0) {
            // Group by domain
            const domainGroups = {};
            studentRequests.forEach(request => {
              if (!domainGroups[request.domain]) {
                domainGroups[request.domain] = [];
              }
              domainGroups[request.domain].push(request.topic);
            });

            // Process each domain
            const newTopicApprovals = [];
            for (const [domain, topics] of Object.entries(domainGroups)) {
              const groupedTopics = groupTopics(topics);
              groupedTopics.forEach(group => {
                const totalRequested = group.length;
                const topic = group[0]; // Use the first topic as representative
                newTopicApprovals.push({
                  phaseId: phaseId,
                  domain,
                  topic,
                  total_requested: totalRequested,
                  approval: 'On Hold'
                });
              });
            }

            // Insert new topic approvals
            if (newTopicApprovals.length > 0) {
              await req.app.locals.TopicApproval.insertMany(newTopicApprovals);
              topicApprovals = newTopicApprovals;
              console.log(`Generated ${newTopicApprovals.length} topic approvals for phase ${phaseId}`);
            }
          }
        } else {
          // Use existing approvals that were created by another request
          topicApprovals = existingApprovals;
        }
      }
    }

    res.json(topicApprovals);
  } catch (error) {
    console.error('Error fetching topic approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST route to generate topic approvals from student requests
router.post('/generate-topic-approvals', async (req, res) => {
  try {
    // Fetch all student requests
    const studentRequests = await req.app.locals.StudentRequestForm.find({});

    // Group by domain
    const domainGroups = {};
    studentRequests.forEach(request => {
      if (!domainGroups[request.domain]) {
        domainGroups[request.domain] = [];
      }
      domainGroups[request.domain].push(request.topic);
    });

    // Process each domain
    const topicApprovals = [];
    for (const [domain, topics] of Object.entries(domainGroups)) {
      const groupedTopics = groupTopics(topics);
      groupedTopics.forEach(group => {
        const totalRequested = group.length;
        const topic = group[0]; // Use the first topic as representative
        topicApprovals.push({
          domain,
          topic,
          total_requested: totalRequested,
          approval: 'On Hold'
        });
      });
    }

    // Clear existing topic approvals and insert new ones
    await req.app.locals.TopicApproval.deleteMany({});
    await req.app.locals.TopicApproval.insertMany(topicApprovals);

    res.status(201).json({ message: 'Topic approvals generated successfully', count: topicApprovals.length });
  } catch (error) {
    console.error('Error generating topic approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT route to update approval status
router.put('/topic-approvals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { approval } = req.body;

    const updatedTopic = await req.app.locals.TopicApproval.findByIdAndUpdate(
      id,
      { approval },
      { new: true }
    );

    if (!updatedTopic) {
      return res.status(404).json({ error: 'Topic approval not found' });
    }

    res.json(updatedTopic);
  } catch (error) {
    console.error('Error updating topic approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route to get student requests for a specific topic
router.get('/student-requests/:domain/:topic', async (req, res) => {
  try {
    const { domain, topic } = req.params;
    const { phase } = req.query;

    let query = { domain };

    // Add phase filter if provided
    if (phase) {
      const phaseId = parseInt(phase.replace('Phase ', ''));
      if (!isNaN(phaseId)) {
        query.phaseId = phaseId;
      }
    }

    // Find student requests that match the domain and phase (if specified)
    const studentRequests = await req.app.locals.StudentRequestForm.find(query);

    // Filter requests with similar topics
    const matchingRequests = studentRequests.filter(request =>
      stringSimilarity.compareTwoStrings(request.topic, topic) > 0.6
    );

    res.json(matchingRequests);
  } catch (error) {
    console.error('Error fetching student requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
