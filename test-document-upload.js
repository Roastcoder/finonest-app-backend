import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Create a test file
const testFilePath = './test-document.txt';
fs.writeFileSync(testFilePath, 'This is a test document for upload testing.');

async function testDocumentUpload() {
  try {
    // First, let's test if we can get a lead
    console.log('Testing document upload functionality...');
    
    // Test the documents endpoint
    const testResponse = await fetch('http://localhost:5000/api/documents/test');
    const testResult = await testResponse.text();
    console.log('Test endpoint response:', testResult);
    
    // Test authentication (you'll need to replace with a valid token)
    console.log('\nTo test document upload, you need:');
    console.log('1. A valid authentication token');
    console.log('2. A valid lead_id');
    console.log('3. A file to upload');
    
    console.log('\nExample curl command to test upload:');
    console.log(`curl -X POST "http://localhost:5000/api/documents" \\
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \\
  -F "document=@${testFilePath}" \\
  -F "lead_id=1" \\
  -F "document_type=test_document"`);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

testDocumentUpload();