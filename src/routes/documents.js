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
router.get('/:id', getDocumentById);
router.get('/lead/:leadId', getDocumentsByLead);
router.get('/:id/download', downloadDocument);
router.post('/', uploadMiddleware, uploadDocument);
router.put('/:id/status', authorize('admin', 'manager', 'team_leader'), updateDocumentStatus);
router.delete('/:id', authorize('admin', 'manager'), deleteDocument);

export default router;
