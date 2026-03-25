import fetch from 'node-fetch';

// Ensure fetch is properly imported for ESM
const fetchModule = fetch.default || fetch;

export const getPincodeDetails = async (req, res) => {
    try {
        const { pincode } = req.params;
        if (!pincode || pincode.length !== 6) {
            return res.status(400).json({ error: 'Invalid Pincode format' });
        }

        const response = await fetchModule(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();

        if (data && data[0] && data[0].Status === 'Success') {
            res.json({
                city: data[0].PostOffice[0].District,
                state: data[0].PostOffice[0].State
            });
        } else {
            res.status(404).json({ error: 'Pincode not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error retrieving Pincode' });
    }
};
