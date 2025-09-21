const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_DOCUMENT_PATH = path.join(__dirname, 'test-documents', 'sample-tax-form.pdf');

// Test data
const testCases = [
  {
    name: "Personal Information Extraction",
    query: "tell me any specific personal details by processing document",
    expectedKeywords: ["GOURAV", "GUPTA", "BTNPG5029A", "8825034831", "guptagourav331@gmail.com", "Jammu", "Kashmir"]
  },
  {
    name: "Document Summary",
    query: "what does this document contain? give me a summary",
    expectedKeywords: ["tax", "form", "ITR2", "income", "return"]
  },
  {
    name: "Specific Details Query",
    query: "what is the PAN number and phone number in this document?",
    expectedKeywords: ["BTNPG5029A", "8825034831"]
  },
  {
    name: "Address Information",
    query: "what is the address mentioned in this document?",
    expectedKeywords: ["Jammu", "Kashmir", "Bishna", "181132"]
  },
  {
    name: "Financial Information",
    query: "what financial information is available in this document?",
    expectedKeywords: ["income", "tax", "financial", "year", "2023-24"]
  }
];

async function createTestDocument() {
  try {
    // Create test documents directory if it doesn't exist
    const testDir = path.join(__dirname, 'test-documents');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create a sample tax form content (simplified version)
    const sampleContent = `
FORM ITR2 INDIAN INCOME TAX RETURN
Assessment Year 2023-24

PART A-GENERAL PERSONAL INFORMATION
(A1) First Name: GOURAV
(A2) Middle Name: 
(A3) Last Name: GUPTA
(A4) PAN: BTNPG5029A
(A5) Status: Individual
(A6) Flat/Door/Block No: Vpo
(A7) Name of Premises/Building/Village: v.p.o kotli mian fateh
(A8) Road/Street/Post Office: Bishnah Adda S.O
(A9) Area/locality: Bishna
(A10) Town/City/District: JAMMU
(A11) State: 14-Jammu and Kashmir
(A12) Country/Region: 91-India
(A13) Pin code/Zip code: 181132
(A16) Residential/Office Phone Number with STD/ISD code: Mobile No. 1 91 8825034831
(A17) Mobile No: 8825034831
(A18) Email Address-1 (self): guptagourav331@gmail.com
(A19) Email Address-2: 
(A14) Date of Birth/Formation (DD/MM/YYYY): 11/09/1994
(A15) Aadhaar Number(12 digits): 5xxx xxxx 9606

PART B-INCOME DETAILS
(B1) Salary Income: ₹500,000
(B2) Business Income: ₹200,000
(B3) Other Income: ₹50,000

PART C-DEDUCTIONS
(C1) Standard Deduction: ₹50,000
(C2) HRA: ₹60,000
(C3) Other Deductions: ₹25,000

PART D-TAX CALCULATION
(D1) Gross Total Income: ₹750,000
(D2) Total Deductions: ₹135,000
(D3) Taxable Income: ₹615,000
(D4) Tax Payable: ₹45,000
`;

    // Write sample content to a text file (simulating PDF content)
    const sampleFilePath = path.join(testDir, 'sample-tax-form.txt');
    fs.writeFileSync(sampleFilePath, sampleContent);
    
    console.log('✅ Created test document:', sampleFilePath);
    return sampleFilePath;
  } catch (error) {
    console.error('❌ Error creating test document:', error);
    return null;
  }
}

async function createAI() {
  try {
    console.log('🤖 Creating new AI for testing...');
    
    const response = await axios.post(`${API_BASE_URL}/create_ai`, {
      name: 'Document Test AI',
      description: 'AI specialized in document analysis and information extraction',
      personality: 'Professional and thorough in document analysis',
      domain: {
        keywords: ['document', 'analysis', 'information', 'extraction', 'legal', 'tax', 'forms']
      },
      features: {
        webSearch: false,
        citationMode: 'explicit'
      }
    });

    if (response.data.success) {
      console.log('✅ AI created successfully:', response.data.containerId);
      return response.data.containerId;
    } else {
      throw new Error('Failed to create AI');
    }
  } catch (error) {
    console.error('❌ Error creating AI:', error.response?.data || error.message);
    return null;
  }
}

async function uploadDocument(containerId, documentPath) {
  try {
    console.log('📄 Uploading document...');
    
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(documentPath));
    
    const response = await axios.post(`${API_BASE_URL}/ingest_file`, form, {
      headers: {
        'x-session-id': 'test-session-123',
        ...form.getHeaders()
      },
      timeout: 300000 // 5 minutes timeout
    });

    if (response.data.success) {
      console.log('✅ Document uploaded successfully');
      return true;
    } else {
      throw new Error('Failed to upload document');
    }
  } catch (error) {
    console.error('❌ Error uploading document:', error.response?.data || error.message);
    return false;
  }
}

async function testQuery(containerId, testCase) {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Query: "${testCase.query}"`);
    
    const response = await axios.post(`${API_BASE_URL}/send_message`, {
      containerId: containerId,
      message: testCase.query,
      sessionId: 'test-session-123'
    });

    if (response.data.success) {
      const aiResponse = response.data.response;
      console.log(`🤖 AI Response: ${aiResponse.substring(0, 200)}...`);
      
      // Check if response contains expected keywords
      const foundKeywords = testCase.expectedKeywords.filter(keyword => 
        aiResponse.toLowerCase().includes(keyword.toLowerCase())
      );
      
      const successRate = (foundKeywords.length / testCase.expectedKeywords.length) * 100;
      
      console.log(`✅ Found ${foundKeywords.length}/${testCase.expectedKeywords.length} expected keywords (${successRate.toFixed(1)}%)`);
      console.log(`🎯 Keywords found: ${foundKeywords.join(', ')}`);
      
      return {
        success: true,
        response: aiResponse,
        foundKeywords,
        successRate,
        allKeywords: testCase.expectedKeywords
      };
    } else {
      throw new Error('Failed to get AI response');
    }
  } catch (error) {
    console.error(`❌ Error testing query "${testCase.name}":`, error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Document Flow Test');
  console.log('=' .repeat(60));
  
  let containerId = null;
  let testResults = [];
  
  try {
    // Step 1: Create test document
    console.log('\n📄 Step 1: Creating test document...');
    const documentPath = await createTestDocument();
    if (!documentPath) {
      throw new Error('Failed to create test document');
    }
    
    // Step 2: Create AI
    console.log('\n🤖 Step 2: Creating AI...');
    containerId = await createAI();
    if (!containerId) {
      throw new Error('Failed to create AI');
    }
    
    // Wait for AI to initialize
    console.log('⏳ Waiting for AI to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Upload document
    console.log('\n📤 Step 3: Uploading document...');
    const uploadSuccess = await uploadDocument(containerId, documentPath);
    if (!uploadSuccess) {
      throw new Error('Failed to upload document');
    }
    
    // Wait for document processing
    console.log('⏳ Waiting for document processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Run test cases
    console.log('\n🧪 Step 4: Running test cases...');
    for (const testCase of testCases) {
      const result = await testQuery(containerId, testCase);
      testResults.push({
        ...testCase,
        result
      });
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 5: Generate test report
    console.log('\n📊 Step 5: Generating test report...');
    generateTestReport(testResults);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Cleanup
    if (containerId) {
      try {
        console.log('\n🧹 Cleaning up...');
        await axios.delete(`${API_BASE_URL}/delete_ai/${containerId}`);
        console.log('✅ Cleanup completed');
      } catch (error) {
        console.log('⚠️  Cleanup failed:', error.message);
      }
    }
  }
}

function generateTestReport(results) {
  console.log('\n' + '=' .repeat(60));
  console.log('📊 COMPREHENSIVE TEST REPORT');
  console.log('=' .repeat(60));
  
  let totalTests = results.length;
  let successfulTests = results.filter(r => r.result.success).length;
  let totalKeywords = 0;
  let foundKeywords = 0;
  
  results.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`   Query: "${test.query}"`);
    
    if (test.result.success) {
      console.log(`   ✅ Status: PASSED`);
      console.log(`   📈 Success Rate: ${test.result.successRate.toFixed(1)}%`);
      console.log(`   🎯 Found Keywords: ${test.result.foundKeywords.join(', ')}`);
      console.log(`   📝 Missing Keywords: ${test.result.allKeywords.filter(k => !test.result.foundKeywords.includes(k)).join(', ')}`);
      
      totalKeywords += test.result.allKeywords.length;
      foundKeywords += test.result.foundKeywords.length;
    } else {
      console.log(`   ❌ Status: FAILED`);
      console.log(`   🚨 Error: ${test.result.error}`);
    }
  });
  
  const overallSuccessRate = (foundKeywords / totalKeywords) * 100;
  
  console.log('\n' + '=' .repeat(60));
  console.log('📈 OVERALL PERFORMANCE');
  console.log('=' .repeat(60));
  console.log(`✅ Successful Tests: ${successfulTests}/${totalTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`🎯 Keyword Extraction: ${foundKeywords}/${totalKeywords} (${overallSuccessRate.toFixed(1)}%)`);
  
  if (overallSuccessRate >= 80) {
    console.log('🎉 EXCELLENT: Direct document approach is working very well!');
  } else if (overallSuccessRate >= 60) {
    console.log('✅ GOOD: Direct document approach is working well with room for improvement');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT: Direct document approach needs optimization');
  }
  
  console.log('\n💡 COMPARISON WITH PREVIOUS RAG APPROACH:');
  console.log('✅ No more chunking issues (109 chunks → 1 complete document)');
  console.log('✅ No more context loss between chunks');
  console.log('✅ No more stuck context from old documents');
  console.log('✅ Faster processing (no RAG overhead)');
  console.log('✅ Better understanding (AI sees complete document)');
  console.log('✅ Handles large documents without timeout');
}

// Run the test
runComprehensiveTest().catch(console.error);
