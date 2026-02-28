const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');
const Stand = require('../models/Stand');
const Visit = require('../models/Visit');
const Survey = require('../models/Survey');

// --- PARTICIPANTS ---
router.get('/participants', async (req, res) => {
  try {
    const participants = await Participant.find().sort({ registrationDate: -1 });
    res.json(participants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/participants', async (req, res) => {
  try {
    const participant = new Participant(req.body);
    await participant.save();
    res.status(201).json(participant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- STANDS ---
router.get('/stands', async (req, res) => {
  try {
    const stands = await Stand.find().sort({ createdAt: -1 });
    res.json(stands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stands', async (req, res) => {
  try {
    const stand = new Stand(req.body);
    await stand.save();
    res.status(201).json(stand);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- VISITS (Scanner) ---
router.post('/visits/scan', async (req, res) => {
  try {
    const { participantId, standId } = req.body;
    
    if (!participantId || !standId) {
      return res.status(400).json({ error: 'Missing participant or stand ID' });
    }

    const visit = new Visit({
      participant: participantId,
      stand: standId
    });
    
    await visit.save();
    res.status(201).json({ message: 'Visit recorded successfully', visit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SURVEYS ---
router.get('/surveys', async (req, res) => {
  try {
    const surveys = await Survey.find()
      .populate('participant')
      .populate('stand')
      .sort({ createdAt: -1 });
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/surveys', async (req, res) => {
  try {
    const survey = new Survey(req.body);
    await survey.save();
    res.status(201).json(survey);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REPORTS / ANALYTICS ---
router.get('/reports/stats', async (req, res) => {
  try {
    const totalParticipants = await Participant.countDocuments();
    const totalVisits = await Visit.countDocuments();
    const totalStands = await Stand.countDocuments();
    const totalSurveys = await Survey.countDocuments();

    res.json({
      totalParticipants,
      totalVisits,
      totalStands,
      totalSurveys
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/stand-visits', async (req, res) => {
  try {
    // Agrupación con la colección traducida al español 'estands' en Mongo
    const standVisits = await Visit.aggregate([
      {
        $group: {
          _id: '$stand',
          visits: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'estands', 
          localField: '_id',
          foreignField: '_id',
          as: 'standDetails'
        }
      },
      {
        $unwind: '$standDetails'
      },
      {
        $project: {
          name: '$standDetails.name',
          visits: 1
        }
      },
      {
        $sort: { visits: -1 }
      }
    ]);

    res.json(standVisits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
