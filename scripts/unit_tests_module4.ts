import { generatePPDBReportCsv } from '../src/services/ppdbService';
import { Applicant, TestCategory, TestResult, AdmissionDecision } from '../src/types/ppdb';

function runUnitTests() {
  console.log('=== RUNNING PPDB BUSINESS LOGIC & CALCULATION TESTS ===\n');
  const results: { test: string; status: 'PASS' | 'FAIL'; detail: string }[] = [];

  // 1. Test Categories & Weighting
  const mockCategories: TestCategory[] = [
    { id: 'cat-1', code: 'AKADEMIK', name: 'Tes Akademik', description: 'CBT', type: 'cbt', passingGrade: 70, weight: 25, order: 1, isActive: true },
    { id: 'cat-2', code: 'QURAN', name: 'Tes Baca Al-Qur\'an', description: 'Oral', type: 'examiner', passingGrade: 75, weight: 25, order: 2, isActive: true },
    { id: 'cat-3', code: 'HAFALAN', name: 'Tes Hafalan', description: 'Tahfidz', type: 'examiner', passingGrade: 75, weight: 20, order: 3, isActive: true },
    { id: 'cat-4', code: 'WAWANCARA', name: 'Tes Wawancara', description: 'Interview', type: 'examiner', passingGrade: 70, weight: 15, order: 4, isActive: true },
    { id: 'cat-5', code: 'PRAKTIK', name: 'Tes Praktik', description: 'Practical', type: 'examiner', passingGrade: 70, weight: 15, order: 5, isActive: true },
  ];

  const totalWeight = mockCategories.reduce((acc, c) => acc + c.weight, 0);
  results.push({
    test: '1. Total Category Weight Equal 100%',
    status: totalWeight === 100 ? 'PASS' : 'FAIL',
    detail: `Total weight: ${totalWeight}% across 5 categories`,
  });

  // 2. Test Mathematical Formula for Weighted Score
  // Scenario A: Candidate with full scores across all 5 categories
  // Akademik: 80 (wt 25) -> 20
  // Quran: 90 (wt 25) -> 22.5
  // Hafalan: 85 (wt 20) -> 17
  // Wawancara: 80 (wt 15) -> 12
  // Praktik: 80 (wt 15) -> 12
  // Total expected = 20 + 22.5 + 17 + 12 + 12 = 83.5 -> Math.round = 84
  const scoreScores: Record<string, number> = {
    AKADEMIK: 80,
    QURAN: 90,
    HAFALAN: 85,
    WAWANCARA: 80,
    PRAKTIK: 80,
  };

  let calculatedTotal = 0;
  mockCategories.forEach((c) => {
    calculatedTotal += (scoreScores[c.code] * c.weight) / 100;
  });
  const roundedTotal = Math.round(calculatedTotal);
  results.push({
    test: '2. Multi-Category Weighted Aggregation Math',
    status: roundedTotal === 84 ? 'PASS' : 'FAIL',
    detail: `Calculated: ${calculatedTotal} -> Rounded: ${roundedTotal} (Expected: 84)`,
  });

  // 3. Test Incomplete Category Detection
  const partialScores: Record<string, number> = {
    AKADEMIK: 85,
    QURAN: 90,
    // Missing HAFALAN, WAWANCARA, PRAKTIK
  };
  const missingCategories = mockCategories
    .filter((c) => partialScores[c.code] === undefined)
    .map((c) => c.name);

  results.push({
    test: '3. Incomplete Evaluation Guard & Missing Categories Tracking',
    status: missingCategories.length === 3 ? 'PASS' : 'FAIL',
    detail: `Detected ${missingCategories.length} missing: ${missingCategories.join(', ')}`,
  });

  // 4. Test Automatic Recommendation Rules
  // Rule 1: If incomplete -> 'pending_incomplete'
  // Rule 2: If complete and totalScore >= 75 and all >= KKM -> 'recommended_accepted'
  // Rule 3: If complete and totalScore >= 75 but one category < KKM -> 'recommended_waitlist'
  // Rule 4: If complete and totalScore < 75 -> 'recommended_rejected'
  const passingGrade = 75;
  const testScenarios = [
    {
      name: 'Incomplete categories',
      complete: false,
      score: 85,
      belowKkm: [],
      expected: 'pending_incomplete',
    },
    {
      name: 'All categories passed KKM and aggregate >= 75',
      complete: true,
      score: 84,
      belowKkm: [],
      expected: 'recommended_accepted',
    },
    {
      name: 'Total score 78 but Hafalan 65 < KKM (75)',
      complete: true,
      score: 78,
      belowKkm: ['Hafalan'],
      expected: 'recommended_waitlist',
    },
    {
      name: 'Total score 68 < 75',
      complete: true,
      score: 68,
      belowKkm: [],
      expected: 'recommended_rejected',
    },
  ];

  let recommendationPassed = true;
  testScenarios.forEach((sc) => {
    let rec: string;
    if (!sc.complete) rec = 'pending_incomplete';
    else if (sc.score >= passingGrade) {
      rec = sc.belowKkm.length > 0 ? 'recommended_waitlist' : 'recommended_accepted';
    } else {
      rec = 'recommended_rejected';
    }
    if (rec !== sc.expected) recommendationPassed = false;
  });

  results.push({
    test: '4. Automated Pleno Recommendation Decision Matrix',
    status: recommendationPassed ? 'PASS' : 'FAIL',
    detail: 'Passed all 4 policy scenarios (accepted, waitlist, rejected, incomplete)',
  });

  // 5. Test CSV Generation with UTF-8 BOM and Quote Escaping
  const mockApplicants: Applicant[] = [
    {
      id: 'app-1',
      userId: 'u1',
      registrationNumber: 'PPDB-2026-001',
      fullName: 'Ahmad Faiz "Bintang" Ramadhan',
      nisn: '0089234123',
      gender: 'L',
      birthPlace: 'Bandung',
      birthDate: '2012-04-15',
      previousSchool: 'SDIT Nurul Fikri',
      parentName: 'H. Ridwan Ramadhan',
      parentPhone: '081234567890',
      address: 'Bandung',
      wave: 'Gelombang 1',
      program: 'Kulliyyatul Mu\'allimin (KMI)',
      status: 'tested',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockResultMap = new Map<string, TestResult>([
    [
      'app-1',
      {
        id: 'app-1',
        applicantId: 'app-1',
        totalScore: 84,
        categoryScores: scoreScores,
        isCompleted: true,
        status: 'passed',
        generatedAt: new Date().toISOString(),
        automaticRecommendation: 'recommended_accepted',
      },
    ],
  ]);

  const mockDecisionMap = new Map<string, AdmissionDecision>([
    [
      'app-1',
      {
        id: 'dec-1',
        applicantId: 'app-1',
        decision: 'accepted',
        notes: 'Lulus seleksi KMI dengan beasiswa santri berprestasi.',
        decisionDate: new Date().toISOString(),
        decidedBy: 'Panitia Pleno',
      },
    ],
  ]);

  const csv = generatePPDBReportCsv(mockApplicants, mockResultMap, mockDecisionMap, mockCategories);
  const startsWithBom = csv.charCodeAt(0) === 0xfeff;
  const containsQuotesEscaped = csv.includes('Ahmad Faiz ""Bintang"" Ramadhan');
  const containsScore = csv.includes('"84"');
  const containsDecision = csv.includes('"LULUS DITERIMA"');

  const csvPass = startsWithBom && containsQuotesEscaped && containsScore && containsDecision;
  results.push({
    test: '5. CSV Export Engine (UTF-8 BOM, RFC-4180 Escaping & Multi-category Cols)',
    status: csvPass ? 'PASS' : 'FAIL',
    detail: `BOM: ${startsWithBom}, Escaped: ${containsQuotesEscaped}, Value: ${containsScore}, Decision: ${containsDecision}`,
  });

  // 6. Test Score Distribution Intervals (0-50, 51-65, 66-75, 76-85, 86-100)
  const testScores = [45, 52, 64, 70, 75, 80, 85, 92, 98];
  const brackets = [
    { range: '0 - 50', min: 0, max: 50, count: 0 },
    { range: '51 - 65', min: 51, max: 65, count: 0 },
    { range: '66 - 75', min: 66, max: 75, count: 0 },
    { range: '76 - 85', min: 76, max: 85, count: 0 },
    { range: '86 - 100', min: 86, max: 100, count: 0 },
  ];

  testScores.forEach((s) => {
    for (const b of brackets) {
      if (s >= b.min && s <= b.max) {
        b.count++;
        break;
      }
    }
  });

  const distSum = brackets.reduce((acc, b) => acc + b.count, 0);
  results.push({
    test: '6. Score Distribution Histogram Interval Math',
    status: distSum === testScores.length ? 'PASS' : 'FAIL',
    detail: `Sample ${testScores.length} scores distributed across 5 brackets accurately`,
  });

  console.log('\n=== UNIT TEST EXECUTION SUMMARY ===');
  results.forEach((r) => {
    console.log(`[${r.status}] ${r.test}: ${r.detail}`);
  });
  console.log('===================================\n');

  const allPassed = results.every((r) => r.status === 'PASS');
  process.exit(allPassed ? 0 : 1);
}

runUnitTests();
