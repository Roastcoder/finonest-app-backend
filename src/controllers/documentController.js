import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|webp|bmp|gif|tiff/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (.png, .jpg, .jpeg, .webp, .bmp, .gif, .tiff) and .pdf are allowed!'));
    }
  }
});

export const uploadMiddleware = upload.single('document');

// Helper function to convert image to JPEG
const convertImageToJpeg = async (inputPath, outputPath) => {
  try {
    const ext = path.extname(inputPath).toLowerCase();
    
    // Only convert if it's not already JPEG
    if (ext === '.jpg' || ext === '.jpeg') {
      return inputPath; // Already JPEG, no conversion needed
    }
    
    // Check if it's an image file
    if (['.png', '.webp', '.bmp', '.gif', '.tiff'].includes(ext)) {
      await sharp(inputPath)
        .jpeg({ quality: 90, progressive: true })
        .toFile(outputPath);
      
      // Delete original file
      fs.unlinkSync(inputPath);
      return outputPath;
    }
    
    // If it's PDF or other format, return original path
    return inputPath;
  } catch (error) {
    console.error('Image conversion error:', error);
    // If conversion fails, return original path
    return inputPath;
  }
};

export const getAllDocuments = async (req, res) => {
  try {
    let query = `
      SELECT d.*, 
             COALESCE(u.full_name, u.user_id) as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
    `;
    
    const conditions = [];
    const values = [];
    
    if (req.query.lead_id) {
      conditions.push('d.lead_id = $' + (values.length + 1));
      values.push(req.query.lead_id);
    }
    
    if (req.query.document_type) {
      conditions.push('d.document_type = $' + (values.length + 1));
      values.push(req.query.document_type);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY d.created_at DESC';
    
    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, 
             COALESCE(u.full_name, u.user_id) as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get document by ID error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { lead_id, loan_id, document_type } = req.body;
    
    if (!document_type) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Document type is required' });
    }
    if (!lead_id && !loan_id) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Lead ID or Loan ID is required' });
    }

    // Verify lead exists if lead_id provided
    if (lead_id) {
      const leadCheck = await db.query('SELECT id FROM leads WHERE id = $1', [lead_id]);
      if (leadCheck.rows.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Lead not found' });
      }
    }

    // Verify loan exists if loan_id provided
    if (loan_id) {
      const loanCheck = await db.query('SELECT id, lead_id FROM loans WHERE id = $1', [loan_id]);
      if (loanCheck.rows.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Loan not found' });
      }
    }

    // Convert image to JPEG if it's an image file
    let finalFilePath = req.file.path;
    let finalFileName = req.file.originalname;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    if (['.png', '.webp', '.bmp', '.gif', '.tiff'].includes(ext)) {
      const jpegPath = req.file.path.replace(ext, '.jpg');
      finalFilePath = await convertImageToJpeg(req.file.path, jpegPath);
      finalFileName = path.basename(finalFilePath);
    }

    const documentData = {
      document_type,
      file_path: path.relative(process.cwd(), finalFilePath),
      file_name: finalFileName,
      file_size: fs.statSync(finalFilePath).size,
      uploaded_by: req.user.id,
      status: 'pending',
      ...(lead_id ? { lead_id: parseInt(lead_id) } : {}),
      ...(loan_id ? { loan_id: parseInt(loan_id) } : {}),
    };

    const { keys, values, params } = toPostgresParams(documentData);
    const result = await db.query(
      `INSERT INTO documents (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );

    res.status(201).json({
      message: 'Document uploaded successfully',
      documentId: result.rows[0].id,
      fileName: finalFileName,
      fileSize: documentData.file_size
    });
  } catch (error) {
    console.error('Upload document error:', error);
    // Clean up file if database operation fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateDocumentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be pending, verified, or rejected' });
    }

    const { query, values } = buildUpdateQuery('documents', { status }, req.params.id);
    const result = await db.query(query, values);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({ message: 'Document status updated successfully' });
  } catch (error) {
    console.error('Update document status error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const result = await db.query('SELECT file_path FROM documents WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = result.rows[0].file_path;
    
    // Delete from database
    await db.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    
    // Delete physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    // No authentication required - allow public access to documents
    const result = await db.query(
      'SELECT file_path, file_name, document_type FROM documents WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { file_path, file_name } = result.rows[0];
    
    // Normalize and resolve file path
    const normalizedFilePath = file_path.replace(/\\/g, '/');
    const fileNameInStorage = normalizedFilePath.split('/').pop();
    let resolvedPath = path.join(process.cwd(), 'uploads', 'documents', fileNameInStorage);
    
    if (!fs.existsSync(resolvedPath)) {
      const fallback = path.isAbsolute(normalizedFilePath) ? normalizedFilePath : path.join(process.cwd(), normalizedFilePath);
      if (fs.existsSync(fallback)) resolvedPath = fallback;
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Set headers for PDF preview
    const ext = path.extname(file_name).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf': contentType = 'application/pdf'; break;
      case '.jpg':
      case '.jpeg': contentType = 'image/jpeg'; break;
      case '.png': contentType = 'image/png'; break;
    }

    // Add CORS headers for iframe preview and Android WebView
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${file_name}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Get file size for Content-Length header
    const stats = fs.statSync(resolvedPath);
    res.setHeader('Content-Length', stats.size);
    
    // Stream the file
    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error reading file' });
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDocumentsByLead = async (req, res) => {
  try {
    const leadId = req.params.leadId;
    console.log(`Fetching documents for lead ID: ${leadId}`);
    
    const result = await db.query(`
      SELECT d.*, 
             COALESCE(u.full_name, u.user_id) as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.lead_id = $1
      ORDER BY d.document_type, d.created_at DESC
    `, [leadId]);
    
    console.log(`Found ${result.rows.length} documents for lead ${leadId}`);
    result.rows.forEach(doc => {
      console.log(`  - Document: ${doc.document_type} (ID: ${doc.id}, File: ${doc.file_name})`);
    });
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get documents by lead error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Bulk download multiple documents for mobile sharing
export const downloadMultipleDocuments = async (req, res) => {
  try {
    const { documentIds } = req.body;
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ error: 'Document IDs array is required' });
    }

    // Get document information
    const placeholders = documentIds.map((_, index) => `$${index + 1}`).join(',');
    const result = await db.query(
      `SELECT id, file_path, file_name, document_type FROM documents WHERE id IN (${placeholders})`,
      documentIds
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No documents found' });
    }

    // For single document, return it directly
    if (result.rows.length === 1) {
      const doc = result.rows[0];
      const normalizedFilePath = doc.file_path.replace(/\\/g, '/');
      const fileNameInStorage = normalizedFilePath.split('/').pop();
      let resolvedPath = path.join(process.cwd(), 'uploads', 'documents', fileNameInStorage);
      
      if (!fs.existsSync(resolvedPath)) {
        const fallback = path.isAbsolute(normalizedFilePath) ? normalizedFilePath : path.join(process.cwd(), normalizedFilePath);
        if (fs.existsSync(fallback)) resolvedPath = fallback;
      }

      if (!fs.existsSync(resolvedPath)) {
        return res.status(404).json({ error: 'File not found on server' });
      }

      const ext = path.extname(doc.file_name).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case '.pdf': contentType = 'application/pdf'; break;
        case '.jpg':
        case '.jpeg': contentType = 'image/jpeg'; break;
        case '.png': contentType = 'image/png'; break;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`);
      
      const fileStream = fs.createReadStream(resolvedPath);
      return fileStream.pipe(res);
    }

    // For multiple documents, create a simple JSON response with file info
    // In a real implementation, you might want to create a ZIP file
    const documentInfo = result.rows.map(doc => ({
      id: doc.id,
      fileName: doc.file_name,
      documentType: doc.document_type,
      downloadUrl: `/api/documents/${doc.id}/download`
    }));

    res.json({
      message: `Found ${result.rows.length} documents`,
      documents: documentInfo,
      bulkDownloadNote: 'Use individual download URLs for each document'
    });
    
  } catch (error) {
    console.error('Bulk download error:', error);
    res.status(500).json({ error: error.message });
  }
};