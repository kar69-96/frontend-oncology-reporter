import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface DocumentContent {
  patientName: string;
  mrn: string;
  dateOfBirth: string;
  diagnosis: string;
  type: 'pathology' | 'clinical_notes' | 'imaging';
}

export class DocumentGenerator {
  private documentsDir = join(process.cwd(), 'public', 'documents');

  constructor() {
    if (!existsSync(this.documentsDir)) {
      mkdirSync(this.documentsDir, { recursive: true });
    }
  }

  generatePathologyReport(content: DocumentContent, filename: string): void {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Pathology Report - ${content.patientName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .hospital-name { font-size: 24px; font-weight: bold; text-align: center; }
        .report-title { font-size: 18px; font-weight: bold; text-align: center; margin-top: 10px; }
        .patient-info { background: #f5f5f5; padding: 15px; margin: 20px 0; }
        .section { margin: 20px 0; }
        .section-title { font-weight: bold; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 150px; }
        .signature { margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="hospital-name">Memorial Cancer Center</div>
        <div class="report-title">SURGICAL PATHOLOGY REPORT</div>
    </div>

    <div class="patient-info">
        <div class="field"><span class="label">Patient Name:</span> ${content.patientName}</div>
        <div class="field"><span class="label">Medical Record #:</span> ${content.mrn}</div>
        <div class="field"><span class="label">Date of Birth:</span> ${content.dateOfBirth}</div>
        <div class="field"><span class="label">Date of Service:</span> ${new Date().toLocaleDateString()}</div>
        <div class="field"><span class="label">Report Date:</span> ${new Date().toLocaleDateString()}</div>
    </div>

    <div class="section">
        <div class="section-title">CLINICAL HISTORY</div>
        <p>${this.getPathologyHistory(content.diagnosis)}</p>
    </div>

    <div class="section">
        <div class="section-title">SPECIMEN(S) RECEIVED</div>
        <p>${this.getSpecimenDescription(content.diagnosis)}</p>
    </div>

    <div class="section">
        <div class="section-title">GROSS DESCRIPTION</div>
        <p>${this.getGrossDescription(content.diagnosis)}</p>
    </div>

    <div class="section">
        <div class="section-title">MICROSCOPIC DESCRIPTION</div>
        <p>${this.getMicroscopicDescription(content.diagnosis)}</p>
    </div>

    <div class="section">
        <div class="section-title">DIAGNOSIS</div>
        <p><strong>${content.diagnosis}</strong></p>
        <p>${this.getPathologyDiagnosis(content.diagnosis)}</p>
    </div>

    <div class="section">
        <div class="section-title">COMMENT</div>
        <p>${this.getPathologyComment(content.diagnosis)}</p>
    </div>

    <div class="signature">
        <p><strong>Dr. Sarah Williams, MD</strong><br>
        Anatomic Pathologist<br>
        Memorial Cancer Center<br>
        Electronically signed on ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;

    writeFileSync(join(this.documentsDir, filename.replace('.pdf', '.html')), html);
  }

  generateClinicalNotes(content: DocumentContent, filename: string): void {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Clinical Notes - ${content.patientName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .hospital-name { font-size: 24px; font-weight: bold; text-align: center; }
        .note-title { font-size: 18px; font-weight: bold; text-align: center; margin-top: 10px; }
        .patient-info { background: #f5f5f5; padding: 15px; margin: 20px 0; }
        .section { margin: 20px 0; }
        .section-title { font-weight: bold; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 150px; }
        .vital-signs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .signature { margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="hospital-name">Memorial Cancer Center</div>
        <div class="note-title">ONCOLOGY CONSULTATION NOTE</div>
    </div>

    <div class="patient-info">
        <div class="field"><span class="label">Patient Name:</span> ${content.patientName}</div>
        <div class="field"><span class="label">Medical Record #:</span> ${content.mrn}</div>
        <div class="field"><span class="label">Date of Birth:</span> ${content.dateOfBirth}</div>
        <div class="field"><span class="label">Date of Service:</span> ${new Date().toLocaleDateString()}</div>
        <div class="field"><span class="label">Provider:</span> Dr. Michael Rodriguez, MD</div>
    </div>

    <div class="section">
        <div class="section-title">CHIEF COMPLAINT</div>
        <p>${this.getChiefComplaint(content.diagnosis)}</p>
    </div>

    <div class="section">
        <div class="section-title">HISTORY OF PRESENT ILLNESS</div>
        <p>${this.getHistoryOfPresentIllness(content.diagnosis)}</p>
    </div>

    <div class="section">
        <div class="section-title">PAST MEDICAL HISTORY</div>
        <p>${this.getPastMedicalHistory()}</p>
    </div>

    <div class="section">
        <div class="section-title">MEDICATIONS</div>
        <p>${this.getMedications(content.diagnosis)}</p>
    </div>

    <div class="section">
        <div class="section-title">VITAL SIGNS</div>
        <div class="vital-signs">
            <div>BP: 128/82 mmHg</div>
            <div>HR: 72 bpm</div>
            <div>Temp: 98.6°F</div>
            <div>RR: 16/min</div>
            <div>O2 Sat: 98%</div>
            <div>Weight: 165 lbs</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">PHYSICAL EXAMINATION</div>
        <p>${this.getPhysicalExam(content.diagnosis)}</p>
    </div>

    <div class="section">
        <div class="section-title">ASSESSMENT AND PLAN</div>
        <p><strong>Assessment:</strong> ${content.diagnosis}</p>
        <p><strong>Plan:</strong> ${this.getTreatmentPlan(content.diagnosis)}</p>
    </div>

    <div class="signature">
        <p><strong>Dr. Michael Rodriguez, MD</strong><br>
        Medical Oncologist<br>
        Memorial Cancer Center<br>
        Electronically signed on ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;

    writeFileSync(join(this.documentsDir, filename.replace('.pdf', '.html')), html);
  }

  generateImagingReport(content: DocumentContent, filename: string): void {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Imaging Report - ${content.patientName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .hospital-name { font-size: 24px; font-weight: bold; text-align: center; }
        .report-title { font-size: 18px; font-weight: bold; text-align: center; margin-top: 10px; }
        .patient-info { background: #f5f5f5; padding: 15px; margin: 20px 0; }
        .section { margin: 20px 0; }
        .section-title { font-weight: bold; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 150px; }
        .signature { margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="hospital-name">Memorial Cancer Center</div>
        <div class="report-title">RADIOLOGY REPORT</div>
    </div>

    <div class="patient-info">
        <div class="field"><span class="label">Patient Name:</span> ${content.patientName}</div>
        <div class="field"><span class="label">Medical Record #:</span> ${content.mrn}</div>
        <div class="field"><span class="label">Date of Birth:</span> ${content.dateOfBirth}</div>
        <div class="field"><span class="label">Exam Date:</span> ${new Date().toLocaleDateString()}</div>
        <div class="field"><span class="label">Study Type:</span> ${this.getImagingStudyType(content.diagnosis)}</div>
    </div>

    <div class="section">
        <div class="section-title">CLINICAL INDICATION</div>
        <p>${this.getImagingIndication(content.diagnosis)}</p>
    </div>

    <div class="section">
        <div class="section-title">TECHNIQUE</div>
        <p>${this.getImagingTechnique(content.diagnosis)}</p>
    </div>

    <div class="section">
        <div class="section-title">COMPARISON</div>
        <p>Prior ${this.getImagingStudyType(content.diagnosis)} from ${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
    </div>

    <div class="section">
        <div class="section-title">FINDINGS</div>
        <p>${this.getImagingFindings(content.diagnosis)}</p>
    </div>

    <div class="section">
        <div class="section-title">IMPRESSION</div>
        <p>${this.getImagingImpression(content.diagnosis)}</p>
    </div>

    <div class="signature">
        <p><strong>Dr. Jennifer Chen, MD</strong><br>
        Radiologist<br>
        Memorial Cancer Center<br>
        Electronically signed on ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;

    writeFileSync(join(this.documentsDir, filename.replace('.pdf', '.html')), html);
  }

  private getPathologyHistory(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return 'Patient presents with a palpable mass in the left breast discovered on routine self-examination. Recent mammography and ultrasound showed a suspicious lesion requiring tissue sampling.';
    } else if (diagnosis.includes('lung')) {
      return 'Patient with history of smoking presents with persistent cough and chest pain. CT scan revealed a pulmonary nodule in the right upper lobe.';
    } else if (diagnosis.includes('prostate')) {
      return 'Elevated PSA levels on routine screening. Digital rectal examination revealed an irregular, firm nodule in the prostate gland.';
    } else if (diagnosis.includes('colon')) {
      return 'Patient presents with changes in bowel habits and positive fecal occult blood test. Colonoscopy revealed a polypoid lesion in the sigmoid colon.';
    }
    return 'Patient presents for evaluation of suspicious lesion identified on imaging studies.';
  }

  private getSpecimenDescription(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return 'Core needle biopsy, left breast, 2:00 position, submitted in formalin.';
    } else if (diagnosis.includes('lung')) {
      return 'Bronchoscopic biopsy, right upper lobe mass, submitted in formalin.';
    } else if (diagnosis.includes('prostate')) {
      return 'Prostate needle biopsy, 12 cores, submitted in separate containers.';
    }
    return 'Tissue biopsy specimen submitted in formalin.';
  }

  private getGrossDescription(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return 'The specimen consists of multiple tissue fragments measuring 1.2 x 0.8 x 0.5 cm in aggregate. The tissue is tan-white and firm with areas of hemorrhage.';
    } else if (diagnosis.includes('lung')) {
      return 'The specimen consists of small tissue fragments measuring 0.8 x 0.6 x 0.3 cm in aggregate. The tissue appears gray-white and firm.';
    }
    return 'The specimen consists of tissue fragments submitted in their entirety for microscopic examination.';
  }

  private getMicroscopicDescription(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return 'Sections show invasive ductal carcinoma with moderate nuclear grade. The tumor cells are arranged in irregular nests and cords infiltrating the surrounding stroma.';
    } else if (diagnosis.includes('lung')) {
      return 'Sections show atypical epithelial cells with enlarged nuclei and prominent nucleoli. The cells are arranged in glandular and solid patterns.';
    }
    return 'Microscopic examination reveals malignant cells with characteristic features consistent with the diagnosis.';
  }

  private getPathologyDiagnosis(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return 'Invasive ductal carcinoma, intermediate grade (Grade 2 of 3). Estrogen receptor positive, progesterone receptor positive, HER2 negative.';
    } else if (diagnosis.includes('lung')) {
      return 'Adenocarcinoma of lung, moderately differentiated. Immunostains consistent with primary pulmonary origin.';
    }
    return 'Malignant neoplasm consistent with clinical presentation and imaging findings.';
  }

  private getPathologyComment(diagnosis: string): string {
    return 'Tumor staging and further treatment recommendations should be based on clinical correlation and additional imaging studies as appropriate.';
  }

  private getChiefComplaint(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return 'Newly diagnosed breast cancer, referred for oncology evaluation and treatment planning.';
    } else if (diagnosis.includes('lung')) {
      return 'Recently diagnosed lung cancer, here for staging and treatment options discussion.';
    }
    return 'New cancer diagnosis, seeking oncology consultation.';
  }

  private getHistoryOfPresentIllness(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return 'This is a 52-year-old female who discovered a lump in her left breast during self-examination 6 weeks ago. Mammography and ultrasound confirmed a suspicious lesion, and core needle biopsy revealed invasive ductal carcinoma.';
    } else if (diagnosis.includes('lung')) {
      return 'This is a 65-year-old male with a 40 pack-year smoking history who presented with persistent cough and chest pain. CT scan revealed a 3.2 cm mass in the right upper lobe, and biopsy confirmed adenocarcinoma.';
    }
    return 'Patient presents with recently diagnosed malignancy requiring oncologic evaluation and treatment planning.';
  }

  private getPastMedicalHistory(): string {
    return 'Hypertension, controlled on lisinopril. No previous history of cancer. No significant family history of malignancy.';
  }

  private getMedications(diagnosis: string): string {
    return 'Lisinopril 10mg daily, multivitamin daily. No known drug allergies.';
  }

  private getPhysicalExam(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return 'Well-appearing female in no acute distress. Breast examination reveals a firm, fixed mass in the left breast at 2:00 position. No palpable lymphadenopathy. Remainder of examination unremarkable.';
    } else if (diagnosis.includes('lung')) {
      return 'Well-appearing male in no acute distress. Pulmonary examination reveals decreased breath sounds in the right upper lobe. No clubbing or cyanosis. Remainder of examination unremarkable.';
    }
    return 'Well-appearing patient in no acute distress. Physical examination reveals findings consistent with known diagnosis.';
  }

  private getTreatmentPlan(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return 'Complete staging workup including CT chest/abdomen/pelvis and bone scan. Multidisciplinary tumor board discussion. Consider neoadjuvant chemotherapy followed by surgical resection.';
    } else if (diagnosis.includes('lung')) {
      return 'Complete staging with PET/CT and brain MRI. Molecular testing for targeted therapy options. Multidisciplinary approach with thoracic surgery and radiation oncology.';
    }
    return 'Complete staging workup and multidisciplinary treatment planning. Follow-up in 1 week to review results and finalize treatment approach.';
  }

  private getImagingStudyType(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return 'Bilateral Breast MRI with contrast';
    } else if (diagnosis.includes('lung')) {
      return 'Chest CT with contrast';
    } else if (diagnosis.includes('colon')) {
      return 'CT Abdomen and Pelvis with contrast';
    }
    return 'CT with contrast';
  }

  private getImagingIndication(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return 'Newly diagnosed breast cancer, evaluate for extent of disease and multifocal/multicentric disease.';
    } else if (diagnosis.includes('lung')) {
      return 'Staging of known lung cancer, evaluate for metastatic disease.';
    }
    return 'Cancer staging and evaluation for metastatic disease.';
  }

  private getImagingTechnique(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return 'Bilateral breast MRI performed with gadolinium contrast using standard protocols. Dynamic contrast-enhanced sequences obtained.';
    } else if (diagnosis.includes('lung')) {
      return 'Contrast-enhanced CT of the chest performed with 5mm slice thickness. Oral and IV contrast administered.';
    }
    return 'Contrast-enhanced CT imaging performed according to standard protocol.';
  }

  private getImagingFindings(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return 'There is an irregular enhancing mass in the left breast measuring 2.1 x 1.8 cm with spiculated margins. No additional suspicious lesions identified. No enlarged axillary lymph nodes.';
    } else if (diagnosis.includes('lung')) {
      return 'There is a spiculated mass in the right upper lobe measuring 3.2 x 2.8 cm. No additional pulmonary nodules. No pleural effusion. Mediastinal lymph nodes are within normal limits.';
    }
    return 'Imaging demonstrates findings consistent with known malignancy. No evidence of distant metastatic disease.';
  }

  private getImagingImpression(diagnosis: string): string {
    if (diagnosis.includes('breast')) {
      return '1. Known left breast cancer as described above. 2. No evidence of multifocal or multicentric disease. 3. No suspicious axillary lymphadenopathy.';
    } else if (diagnosis.includes('lung')) {
      return '1. Known right upper lobe lung cancer as described. 2. No evidence of distant metastatic disease. 3. Clinical stage T2N0M0.';
    }
    return 'Imaging findings consistent with known malignancy. Recommend clinical correlation and follow-up as appropriate.';
  }
}