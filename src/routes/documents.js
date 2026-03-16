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

// Test routes without auth
router.get('/test', (req, res) => res.json({ message: 'Documents route working' }));
router.get('/debug/:id', (req, res) => {
  res.json({ 
    message: 'Debug route working', 
    id: req.params.id,
    route: `/api/documents/${req.params.id}/debug`,
    timestamp: new Date().toISOString()
  });
});

// Public download route for testing
router.get('/:id/download-test', downloadDocument);

// Protected routes
router.use(authenticate);

router.get('/', getAllDocuments);
router.get('/lead/:leadId', getDocumentsByLead);
router.get('/:id/download', downloadDocument);
router.get('/:id/preview', downloadDocument);
router.get('/:id', getDocumentById);
router.post('/', uploadMiddleware, uploadDocument);
router.put('/:id/status', authorize('admin', 'manager', 'team_leader'), updateDocumentStatus);
router.delete('/:id', authorize('admin', 'manager'), deleteDocument);

export default router;
