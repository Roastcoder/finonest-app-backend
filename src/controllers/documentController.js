import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, .jpeg and .pdf files are allowed!'));
    }
  }
});

export const uploadMiddleware = upload.single('document');

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

    const { lead_id, document_type } = req.body;
    
    if (!lead_id || !document_type) {
      // Clean up uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Lead ID and document type are required' });
    }

    // Verify lead exists
    const leadCheck = await db.query('SELECT id FROM leads WHERE id = $1', [lead_id]);
    if (leadCheck.rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Lead not found' });
    }

    const documentData = {
      lead_id: parseInt(lead_id),
      document_type,
      file_path: path.relative(process.cwd(), req.file.path),
      file_name: req.file.originalname,
      file_size: req.file.size,
      uploaded_by: req.user.id,
      status: 'pending'
    };

    const { keys, values, params } = toPostgresParams(documentData);
    const result = await db.query(
      `INSERT INTO documents (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );

    res.status(201).json({
      message: 'Document uploaded successfully',
      documentId: result.rows[0].id,
      fileName: req.file.originalname,
      fileSize: req.file.size
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
    console.log('Download request for document ID:', req.params.id);
    
    const result = await db.query(
      'SELECT file_path, file_name, document_type FROM documents WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      console.log('Document not found in database:', req.params.id);
      return res.status(404).json({ error: 'Document not found' });
    }

    const { file_path, file_name, document_type } = result.rows[0];
    console.log('Document found in DB:', { file_path, file_name, document_type });
    
    // Resolve path robustly
    let resolvedPath = file_path;
    
    // If it's not absolute or exists as is, try it
    if (!path.isAbsolute(resolvedPath)) {
      resolvedPath = path.join(process.cwd(), resolvedPath);
    }
    
    // If the path doesn't exist, try resolving just the filename in the uploads/documents directory
    // This handles cases where absolute paths from other environments (like Windows) were stored
    if (!fs.existsSync(resolvedPath)) {
      // Robustly get filename regardless of source path separator (/ or \)
      const fileNameInStorage = file_path.split(/[\\/]/).pop();
      const alternativePath = path.join(process.cwd(), 'uploads', 'documents', fileNameInStorage);
      console.log('Original path not found, checking alternative:', alternativePath);
      
      if (fs.existsSync(alternativePath)) {
        resolvedPath = alternativePath;
      } else {
        // Also check directly in 'uploads' in case they were uploaded there before our change
        const altPath2 = path.join(process.cwd(), 'uploads', fileNameInStorage);
        if (fs.existsSync(altPath2)) {
          resolvedPath = altPath2;
        }
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      console.log('File NOT found on filesystem anywhere:', resolvedPath);
      return res.status(404).json({ 
        error: 'File not found on server',
        details: 'The document record exists but the physical file is missing.'
      });
    }

    console.log('Serving file from:', resolvedPath);

    // Set appropriate content type
    const ext = path.extname(file_name).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${file_name}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error reading file' });
      }
    });
    
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getDocumentsByLead = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, 
             COALESCE(u.full_name, u.user_id) as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.lead_id = $1
      ORDER BY d.document_type, d.created_at DESC
    `, [req.params.leadId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get documents by lead error:', error);
    res.status(500).json({ error: error.message });
  }
};