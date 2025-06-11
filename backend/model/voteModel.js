const db = require('../config/db');

// Create a vote (if the IP hasn't voted yet)
const createVote = async (candidateId, candidateName, voterIp) => {
  try {
    const existingVote = await db.query(
      'SELECT 1 FROM votes WHERE voter_ip = $1',
      [voterIp]
    );

    if (existingVote.rows.length > 0) {
      throw new Error('This IP has already voted');
    }

    const voteResult = await db.query(
      'INSERT INTO votes (candidate_id, candidate_name, voter_ip) VALUES ($1, $2, $3) RETURNING *',
      [candidateId, candidateName, voterIp]
    );

    return voteResult.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get vote count for a specific candidate
const getVotesByCandidate = async (candidateId) => {
  const result = await db.query(
    'SELECT COUNT(*) AS vote_count FROM votes WHERE candidate_id = $1',
    [candidateId]
  );
  return parseInt(result.rows[0].vote_count, 10);
};

// Get whether a user (by IP) has voted
const hasVoted = async (voterIp) => {
  const result = await db.query(
    'SELECT 1 FROM votes WHERE voter_ip = $1 LIMIT 1',
    [voterIp]
  );
  return result.rows.length > 0;
};

// Get vote counts for all candidates
const getAllVoteCounts = async () => {
  const result = await db.query(`
    SELECT candidate_id, candidate_name, COUNT(*) AS vote_count
    FROM votes
    GROUP BY candidate_id, candidate_name
    ORDER BY vote_count DESC
  `);
  return result.rows;
};

module.exports = {
  createVote,
  getVotesByCandidate,
  getAllVoteCounts,
  hasVoted
};
