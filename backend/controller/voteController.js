const {
  createVote,
  getVotesByCandidate,
  getAllVoteCounts,
  hasVoted
} = require('../model/voteModel');

// Get vote count for a specific candidate
const getVoteCount = async (req, res) => {
  try {
    const candidateId = parseInt(req.params.candidateId, 10);
    const count = await getVotesByCandidate(candidateId);
    res.json({ candidateId, voteCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all vote counts
const getAllVotes = async (req, res) => {
  try {
    const results = await getAllVoteCounts();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Check if an IP has voted
const checkIfVoted = async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const voted = await hasVoted(ip);
    res.json({ hasVoted: voted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Submit a vote
const castVote = async (req, res) => {
  const { candidateId, candidateName, maidenName } = req.body;
  const voterIp = req.ip || req.connection.remoteAddress;

  if (!maidenName || maidenName.trim() === '') {
    return res.status(400).json({ error: 'Maiden name is required' });
  }

  try {
    const vote = await createVote(candidateId, candidateName, voterIp, maidenName);
    res.status(201).json({ message: 'Vote recorded', vote });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  castVote,
  checkIfVoted,
  getVoteCount,
  getAllVotes
};
