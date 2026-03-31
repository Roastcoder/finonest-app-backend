import express from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

// Get address suggestions from Google Places API
router.post('/autocomplete', authenticate, async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || input.trim().length < 3) {
      return res.json({ predictions: [] });
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`;

    const response = await axios.get(url);

    if (response.data.predictions && response.data.predictions.length > 0) {
      const predictions = response.data.predictions.map((pred) => ({
        place_id: pred.place_id,
        description: pred.description,
        main_text: pred.structured_formatting?.main_text || pred.description,
        secondary_text: pred.structured_formatting?.secondary_text || ''
      }));
      return res.json({ predictions });
    }

    res.json({ predictions: [] });
  } catch (error) {
    console.error('Google Places autocomplete error:', error.message);
    res.status(500).json({ error: 'Failed to fetch address suggestions' });
  }
});

// Get place details (coordinates and formatted address)
router.post('/place-details', authenticate, async (req, res) => {
  try {
    const { place_id } = req.body;

    if (!place_id) {
      return res.status(400).json({ error: 'place_id is required' });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${GOOGLE_MAPS_API_KEY}&fields=geometry,formatted_address`;

    const response = await axios.get(url);

    if (response.data.result && response.data.result.geometry) {
      const location = response.data.result.geometry.location;
      return res.json({
        lat: location.lat,
        lng: location.lng,
        address: response.data.result.formatted_address
      });
    }

    res.status(404).json({ error: 'Place not found' });
  } catch (error) {
    console.error('Google Places details error:', error.message);
    res.status(500).json({ error: 'Failed to fetch place details' });
  }
});

// Geocode address to get coordinates
router.post('/geocode', authenticate, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || address.trim().length === 0) {
      return res.status(400).json({ error: 'address is required' });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url);

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return res.json({
        lat: location.lat,
        lng: location.lng
      });
    }

    res.status(404).json({ error: 'Address not found' });
  } catch (error) {
    console.error('Google Geocoding error:', error.message);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
});

export default router;
