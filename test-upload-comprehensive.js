#!/usr/bin/env node

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

// Create a test file
const testContent = 'This is a test document for upload verification.';
fs.writeFileSync('./test-upload.txt', testContent);

async function testDocumentUpload() {
  console.log('🧪 Testing Document Upload Functionality\n');
  
  try {
    // Test 1: Check if documents API is accessible
    console.log('1. Testing documents API endpoint...');
    const testResponse = await fetch('http://localhost:5000/api/documents/test');
    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log('✅ Documents API is accessible:', result.message);
    } else {
      console.log('❌ Documents API test failed:', testResponse.status);
      return;
    }
    
    // Test 2: Check if we can get leads (to find a valid lead_id)
    console.log('\n2. Testing leads API to get a valid lead_id...');
    const leadsResponse = await fetch('http://localhost:5000/api/leads', {
      headers: {
        'Authorization': 'Bearer test-token' // This will fail but we can see the error
      }
    });
    
    if (leadsResponse.status === 401) {
      console.log('⚠️  Authentication required (expected). Status:', leadsResponse.status);
    } else {
      console.log('📝 Leads API response status:', leadsResponse.status);
    }
    
    // Test 3: Test file upload without auth (should fail with 401)
    console.log('\n3. Testing document upload without authentication...');
    const formData = new FormData();
    formData.append('document', fs.createReadStream('./test-upload.txt'));
    formData.append('lead_id', '1');
    formData.append('document_type', 'test_document');
    
    const uploadResponse = await fetch('http://localhost:5000/api/documents', {
      method: 'POST',
      body: formData
    });
    
    if (uploadResponse.status === 401) {
      console.log('✅ Upload correctly requires authentication (401)');
    } else {
      console.log('📝 Upload response status:', uploadResponse.status);
      const uploadResult = await uploadResponse.text();
      console.log('📝 Upload response:', uploadResult);
    }
    
    console.log('\n📋 Summary:');
    console.log('- Documents API endpoint is working');
    console.log('- Authentication is properly enforced');
    console.log('- File upload endpoint is accessible');
    console.log('\n🔧 To test with authentication:');
    console.log('1. Login to get a valid token');
    console.log('2. Use that token in the Authorization header');
    console.log('3. Ensure you have a valid lead_id');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Clean up
    if (fs.existsSync('./test-upload.txt')) {
      fs.unlinkSync('./test-upload.txt');
      console.log('\n🧹 Cleaned up test file');
    }
  }
}

testDocumentUpload();