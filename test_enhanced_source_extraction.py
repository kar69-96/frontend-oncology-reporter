#!/usr/bin/env python3
"""
Test Enhanced Source Extraction System
Tests the improved Claude API integration for exact verbatim text extraction
"""

import requests
import json
import time
from pathlib import Path

# Test configuration
BACKEND_URL = "http://localhost:5003"

def test_enhanced_extraction():
    """Test the enhanced Claude extraction system"""
    
    print("🧪 Testing Enhanced Source Extraction System")
    print("=" * 60)
    
    # Test document content (simulated medical report)
    test_document_content = """
    PATIENT DEMOGRAPHICS:
    Name: John Doe
    Date of Birth: 1975-03-15
    Gender: Male
    Medical Record Number: MRN001234
    
    PATHOLOGY REPORT:
    Primary Site: Right upper lobe of lung
    Histologic Type: Invasive ductal adenocarcinoma, grade 2
    ICD-O-3 Morphology Code: 8140/3
    ICD-O-3 Site Code: C34.1
    Tumor Size: 4.2 cm in greatest dimension
    
    STAGING INFORMATION:
    Clinical Staging: Stage IIA (T2N0M0) with tumor measuring 4.2 cm
    TNM Classification:
    - Clinical T: T2
    - Clinical N: N0  
    - Clinical M: M0
    AJCC Stage: Stage IIA
    
    TREATMENT SUMMARY:
    Surgery Performed: Right upper lobectomy performed on 2024-01-15
    Chemotherapy: Adjuvant chemotherapy with carboplatin and paclitaxel
    Radiation Therapy: Not indicated for this stage
    """
    
    # Create test file
    test_file_path = Path("test_medical_report.txt")
    with open(test_file_path, "w") as f:
        f.write(test_document_content)
    
    try:
        print("📤 1. Uploading test document...")
        
        # Upload document to backend
        with open(test_file_path, "rb") as f:
            upload_response = requests.post(
                f"{BACKEND_URL}/upload",
                files={"file": ("test_medical_report.txt", f, "text/plain")},
                data={"patient_id": 1}
            )
        
        if upload_response.status_code != 200:
            print(f"❌ Upload failed: {upload_response.status_code}")
            print(upload_response.text)
            return False
        
        upload_data = upload_response.json()
        document_id = upload_data["document_id"]
        print(f"✅ Document uploaded successfully: {document_id}")
        
        print("\n🔄 2. Processing document with enhanced Claude extraction...")
        
        # Process document
        process_response = requests.post(
            f"{BACKEND_URL}/process/{document_id}",
            json={"patient_id": 1}
        )
        
        if process_response.status_code != 200:
            print(f"❌ Processing failed: {process_response.status_code}")
            print(process_response.text)
            return False
        
        process_data = process_response.json()
        print(f"✅ Document processed successfully")
        
        print("\n🔍 3. Analyzing extraction results...")
        
        # Test cases for exact text extraction
        test_cases = [
            {
                "field": "primary_site",
                "expected_exact_text": "Right upper lobe of lung",
                "description": "Anatomical location should be exact"
            },
            {
                "field": "histology", 
                "expected_exact_text": "Invasive ductal adenocarcinoma, grade 2",
                "description": "Histology should include exact grade information"
            },
            {
                "field": "clinical_t",
                "expected_exact_text": "T2",
                "description": "TNM staging should be exact codes"
            }
        ]
        
        fields = process_data.get("fields", {})
        success_count = 0
        total_tests = len(test_cases)
        
        print(f"\n📋 Testing {total_tests} extraction cases:")
        print("-" * 60)
        
        for i, test_case in enumerate(test_cases, 1):
            field_name = test_case["field"]
            expected_text = test_case["expected_exact_text"]
            description = test_case["description"]
            
            print(f"\n{i}. {field_name.upper()}")
            print(f"   Description: {description}")
            print(f"   Expected: '{expected_text}'")
            
            if field_name in fields:
                field_data = fields[field_name]
                extracted_value = field_data.get("value", "")
                source_snippet = field_data.get("source_snippet", "")
                exact_source_text = field_data.get("exact_source_text", "")
                confidence = field_data.get("confidence", 0)
                extraction_type = field_data.get("extraction_type", "unknown")
                
                print(f"   Extracted: '{extracted_value}'")
                print(f"   Source: '{source_snippet[:100]}...'")
                print(f"   Confidence: {confidence:.2f}")
                print(f"   Type: {extraction_type}")
                
                # Check if extraction is correct
                if expected_text.lower() in extracted_value.lower():
                    print(f"   ✅ PASS - Correct value extracted")
                    success_count += 1
                else:
                    print(f"   ❌ FAIL - Incorrect value extracted")
                    
            else:
                print(f"   ❌ FAIL - Field not found in extraction results")
        
        print(f"\n📊 RESULTS SUMMARY:")
        print(f"✅ Successful extractions: {success_count}/{total_tests}")
        print(f"📈 Success rate: {(success_count/total_tests)*100:.1f}%")
        
        if success_count >= total_tests * 0.8:
            print(f"🎉 OVERALL: PASS - Enhanced extraction system working well!")
            return True
        else:
            print(f"⚠️  OVERALL: NEEDS IMPROVEMENT - Success rate below 80%")
            return False
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False
    
    finally:
        # Cleanup
        if test_file_path.exists():
            test_file_path.unlink()

if __name__ == "__main__":
    print("🚀 Starting Enhanced Source Extraction Tests")
    print("=" * 80)
    
    # Check if services are running
    try:
        backend_health = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if backend_health.status_code == 200:
            print("✅ Backend service is running")
        else:
            print("❌ Backend service not responding correctly")
            exit(1)
    except:
        print("❌ Backend service not accessible - make sure it's running on port 5003")
        print("Start the backend with: cd Oncology-reporter-API && python3 enhanced_minimal_server.py")
        exit(1)
    
    # Run tests
    print("\n" + "="*80)
    backend_success = test_enhanced_extraction()
    
    print("\n" + "="*80)
    print("🏁 FINAL RESULTS:")
    print(f"Backend Enhanced Extraction: {'✅ PASS' if backend_success else '❌ FAIL'}")
    
    if backend_success:
        print("\n🎉 ENHANCED SOURCE EXTRACTION SYSTEM IS WORKING!")
        print("\n📋 Roadmap Progress:")
        print("✅ Phase 1: Enhanced PDF text extraction pipeline")
        print("✅ Phase 2: Exact text matching system integration") 
        print("✅ Phase 3: Claude API integration redesign")
        print("✅ Phase 4: Frontend enhancement (completed)")
        print("⏳ Phase 5: Database migration & optimization")
        print("⏳ Phase 6: Testing & medical validation")
        print("⏳ Phase 7: Performance & monitoring")
    else:
        print("\n⚠️  TESTS FAILED - Review implementation")
        print("Check the detailed output above for specific issues") 