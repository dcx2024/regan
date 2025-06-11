const express = require('express');
const router = express.Router();
const voteController = require('../controller/voteController');

router.post('/vote', voteController.castVote);
router.get('/has-voted', voteController.checkIfVoted);
router.get('/votes/:candidateId', voteController.getVoteCount);
router.get('/votes', voteController.getAllVotes); // NEW: returns votes for all candidates

module.exports = router;
