-- Check all documents for lead ID 45
SELECT 
  d.id,
  d.lead_id,
  d.document_type,
  d.file_name,
  d.file_size,
  d.status,
  d.created_at,
  u.full_name as uploaded_by
FROM documents d
LEFT JOIN users u ON d.uploaded_by = u.id
WHERE d.lead_id = 45
ORDER BY d.created_at DESC;

-- Check for any aadhar documents (all variations)
SELECT 
  d.id,
  d.lead_id,
  d.document_type,
  d.file_name,
  d.created_at
FROM documents d
WHERE d.lead_id = 45
AND (
  d.document_type LIKE '%aadhar%' 
  OR d.document_type LIKE '%aadhaar%'
)
ORDER BY d.created_at DESC;

-- Count documents by type for lead 45
SELECT 
  document_type,
  COUNT(*) as count
FROM documents
WHERE lead_id = 45
GROUP BY document_type
ORDER BY document_type;

-- Check if aadhar_back exists at all
SELECT 
  COUNT(*) as aadhar_back_count
FROM documents
WHERE lead_id = 45
AND document_type = 'aadhar_back';

-- If aadhar_back is missing, check what aadhar documents exist
SELECT 
  id,
  document_type,
  file_name,
  created_at
FROM documents
WHERE lead_id = 45
AND document_type LIKE '%aadhar%'
ORDER BY created_at;

-- Fix: If you find duplicate aadhar_front, rename one to aadhar_back
-- First, identify which one should be aadhar_back (usually the second one)
SELECT 
  id,
  document_type,
  file_name,
  created_at
FROM documents
WHERE lead_id = 45
AND document_type = 'aadhar_front'
ORDER BY created_at;

-- Then update it (replace DOCUMENT_ID with the actual ID)
-- UPDATE documents 
-- SET document_type = 'aadhar_back' 
-- WHERE id = DOCUMENT_ID;
