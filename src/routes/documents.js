import express from 'express';
import { 
  getAllDocuments, 
  getDocumentById, 
  uploadDocument, 
  updateDocumentStatus, 
  deleteDocument, 
  downloadDocument, 
  getDocumentsByLead,
  uploadMiddleware 
} from '../controllers/documentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllDocuments);
router.get('/test', (req, res) => res.json({ message: 'Documents route working' }));
router.get('/lead/:leadId', getDocumentsByLead);
router.get('/:id/download', downloadDocument);
router.get('/:id', getDocumentById);
router.post('/', uploadMiddleware, uploadDocument);
router.put('/:id/status', authorize('admin', 'manager', 'team_leader'), updateDocumentStatus);
router.delete('/:id', authorize('admin', 'manager'), deleteDocument);

export default router;
