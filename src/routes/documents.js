import express from 'express';
import { 
  getAllDocuments, 
  getDocumentById, 
  uploadDocument, 
  updateDocumentStatus, 
  deleteDocument, 
  downloadDocument, 
  getDocumentsByLead,
  downloadMultipleDocuments,
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

// Public document access routes (NO authentication required)
router.get('/:id/download', downloadDocument); // Public access for document download
router.get('/:id/preview', downloadDocument); // Public access for document preview
router.get('/:id/view', downloadDocument); // Alternative public access route

// Bulk download route for mobile sharing
router.post('/bulk-download', downloadMultipleDocuments); // Public access for bulk download

// Authenticated routes for document management
router.get('/', authenticate, getAllDocuments);
router.get('/lead/:leadId', authenticate, getDocumentsByLead);
router.get('/:id', authenticate, getDocumentById);

// Upload and management routes
router.post('/', authenticate, uploadMiddleware, uploadDocument);
router.put('/:id/status', authenticate, authorize('admin', 'manager', 'team_leader'), updateDocumentStatus);
router.delete('/:id', authenticate, authorize('admin', 'manager'), deleteDocument);

export default router;
