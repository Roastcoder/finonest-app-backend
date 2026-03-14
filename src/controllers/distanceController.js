import axios from 'axios';

export const calculateDistance = async (req, res) => {
  try {
    const { branchLat, branchLng, customerLat, customerLng } = req.body;

    if (!branchLat || !branchLng || !customerLat || !customerLng) {
      return res.status(400).json({ error: 'All coordinates are required' });
    }

    // OSRM API endpoint for distance calculation
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${branchLng},${branchLat};${customerLng},${customerLat}?overview=false&alternatives=false&steps=false`;

    const response = await axios.get(osrmUrl);
    
    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const distanceInMeters = route.distance;
      const durationInSeconds = route.duration;
      
      const distanceInKm = (distanceInMeters / 1000).toFixed(2);
      const durationInMinutes = Math.round(durationInSeconds / 60);

      res.json({
        distance: {
          meters: distanceInMeters,
          kilometers: parseFloat(distanceInKm)
        },
        duration: {
          seconds: durationInSeconds,
          minutes: durationInMinutes
        },
        coordinates: {
          branch: { lat: branchLat, lng: branchLng },
          customer: { lat: customerLat, lng: customerLng }
        }
      });
    } else {
      res.status(400).json({ error: 'No route found between the coordinates' });
    }
  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate distance' });
  }
};
