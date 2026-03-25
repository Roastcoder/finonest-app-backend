import express from 'express';
import { getPincodeDetails } from '../integrations/pincodeApi.js';

const router = express.Router();

router.get('/pincode/:pincode', getPincodeDetails);

export default router;
