import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  Applicant,
  AdmissionDecision,
  ExaminerAssessment,
  PPDBStatistics,
  QuestionBank,
  SystemGradingConfig,
  TestCategory,
  TestSchedule,
  TestSession,
  TestAnswer,
  TestResult,
  UserProfile,
  UserRole,
  AnnouncementConfig,
  DecisionAuditLog,
  ScoreDistribution,
  CategoryPerformanceStat,
  ProgramStat,
} from '../types/ppdb';

// Users Collection
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function upsertUserProfile(profile: Partial<UserProfile> & { uid: string; email: string; role: UserRole }): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    const userRef = doc(db, 'users', profile.uid);
    const existing = await getDoc(userRef);
    const now = new Date().toISOString();

    if (existing.exists()) {
      await updateDoc(userRef, {
        displayName: profile.displayName || existing.data().displayName,
        phoneNumber: profile.phoneNumber || existing.data().phoneNumber || '',
        photoURL: profile.photoURL || existing.data().photoURL || '',
        updatedAt: now,
      });
    } else {
      await setDoc(userRef, {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName || profile.email.split('@')[0],
        role: profile.role,
        photoURL: profile.photoURL || '',
        phoneNumber: profile.phoneNumber || '',
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Applicants Collection
export async function getAllApplicants(includeArchived: boolean = true): Promise<Applicant[]> {
  const path = 'applicants';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(200));
    const querySnapshot = await getDocs(q);
    const list: Applicant[] = [];
    querySnapshot.forEach((d) => {
      const data = d.data() as Applicant;
      if (includeArchived || data.status !== 'archived') {
        list.push({ ...data, id: d.id });
      }
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getApplicantByUserId(userId: string): Promise<Applicant | null> {
  const path = 'applicants';
  try {
    const q = query(collection(db, path), where('userId', '==', userId), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const d = snapshot.docs[0];
      return { id: d.id, ...d.data() } as Applicant;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createApplicant(data: Omit<Applicant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Applicant> {
  const path = 'applicants';
  try {
    const applicantsCol = collection(db, path);
    const newDocRef = doc(applicantsCol);
    const now = new Date().toISOString();
    
    const newApplicant: Applicant = {
      ...data,
      id: newDocRef.id,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: now,
      updatedAt: now,
    };
    
    await setDoc(newDocRef, newApplicant);
    return newApplicant;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateApplicant(applicantId: string, updates: Partial<Applicant>): Promise<void> {
  const path = `applicants/${applicantId}`;
  try {
    const ref = doc(db, 'applicants', applicantId);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function archiveApplicant(applicantId: string, archive: boolean = true): Promise<void> {
  await updateApplicant(applicantId, {
    status: archive ? 'archived' : 'registered',
    isActive: !archive,
  });
}

export async function deleteApplicant(applicantId: string): Promise<void> {
  const path = `applicants/${applicantId}`;
  try {
    await deleteDoc(doc(db, 'applicants', applicantId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function batchImportApplicants(
  items: Array<{
    fullName: string;
    nisn: string;
    gender: 'L' | 'P';
    program: string;
    previousSchool: string;
    parentName: string;
    parentPhone: string;
    address?: string;
    wave?: string;
  }>
): Promise<{ successCount: number; errors: string[] }> {
  let successCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      if (!item.fullName || !item.nisn) {
        errors.push(`Baris ${i + 1}: Nama atau NISN kosong.`);
        continue;
      }
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const regNumber = `PPDB-2026-${String(100 + successCount + 1).padStart(3, '0')}`;
      
      await createApplicant({
        userId: `import-${Date.now()}-${randomSuffix}`,
        registrationNumber: regNumber,
        fullName: item.fullName.trim(),
        nisn: item.nisn.trim(),
        gender: item.gender === 'P' ? 'P' : 'L',
        birthPlace: 'Kota',
        birthDate: '2012-01-01',
        previousSchool: item.previousSchool?.trim() || 'SD/MI Asal',
        parentName: item.parentName?.trim() || 'Wali Santri',
        parentPhone: item.parentPhone?.trim() || '-',
        address: item.address?.trim() || 'Alamat Santri',
        wave: item.wave?.trim() || 'Gelombang 1',
        program: item.program?.trim() || 'Kulliyyatul Mu\'allimin (KMI)',
        status: 'registered',
        isActive: true,
      });
      successCount++;
    } catch (err: any) {
      errors.push(`Baris ${i + 1} (${item.fullName}): ${err.message || 'Gagal menyimpan'}`);
    }
  }

  return { successCount, errors };
}

// Statistics Calculation
export async function getPPDBStatistics(): Promise<PPDBStatistics> {
  try {
    const [applicants, decisions, results] = await Promise.all([
      getAllApplicants(true),
      getAdmissionDecisions(),
      getAllTestResults(),
    ]);

    const activeApplicants = applicants.filter((a) => a.status !== 'archived');
    const total = activeApplicants.length;
    
    // Decisions breakdown
    const acceptedCount = decisions.filter((d) => d.decision === 'accepted').length;
    const rejectedCount = decisions.filter((d) => d.decision === 'rejected').length;
    const waitlistCount = decisions.filter((d) => d.decision === 'waitlist').length;
    
    // Decision IDs set
    const decidedApplicantIds = new Set(decisions.map((d) => d.applicantId));

    // Results mapping
    const resultMap = new Map<string, TestResult>();
    results.forEach((r) => resultMap.set(r.applicantId, r));

    // Calculate states
    let untested = 0;
    let tested = 0;
    let incomplete = 0;
    let pendingDecision = 0;

    activeApplicants.forEach((a) => {
      const res = resultMap.get(a.id);
      const isDecided = decidedApplicantIds.has(a.id);

      if (!res && a.status === 'registered') {
        untested++;
      } else if (res) {
        tested++;
        if (!res.isCompleted) {
          incomplete++;
        } else if (!isDecided) {
          pendingDecision++;
        }
      } else if (a.status === 'verified') {
        untested++;
      } else if (a.status === 'tested' && !isDecided) {
        pendingDecision++;
      }
    });

    const scores = results.map((r) => r.totalScore).filter((s) => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const passingRate = total > 0 ? Math.round((acceptedCount / total) * 100) : 0;

    return {
      totalApplicants: total,
      untestedApplicants: untested,
      testedApplicants: tested,
      incompleteAssessmentApplicants: incomplete,
      pendingDecisionApplicants: pendingDecision,
      acceptedApplicants: acceptedCount,
      rejectedApplicants: rejectedCount,
      waitlistApplicants: waitlistCount,
      archivedApplicants: applicants.filter((a) => a.status === 'archived').length,
      averageScore: avgScore,
      passingRate,
    };
  } catch (err) {
    console.error('Error calculating PPDB statistics:', err);
    return {
      totalApplicants: 0,
      untestedApplicants: 0,
      testedApplicants: 0,
      incompleteAssessmentApplicants: 0,
      pendingDecisionApplicants: 0,
      acceptedApplicants: 0,
      rejectedApplicants: 0,
      waitlistApplicants: 0,
      archivedApplicants: 0,
      averageScore: 0,
      passingRate: 0,
    };
  }
}

export async function getComprehensiveSelectionStats(): Promise<{
  stats: PPDBStatistics;
  scoreDistribution: ScoreDistribution[];
  categoryPerformance: CategoryPerformanceStat[];
  programStats: ProgramStat[];
}> {
  const [stats, applicants, categories, decisions, results] = await Promise.all([
    getPPDBStatistics(),
    getAllApplicants(false),
    getTestCategories(),
    getAdmissionDecisions(),
    getAllTestResults(),
  ]);

  // 1. Score Distribution
  const brackets = [
    { range: '0 - 50 (Kurang)', min: 0, max: 50, count: 0 },
    { range: '51 - 65 (Cukup)', min: 51, max: 65, count: 0 },
    { range: '66 - 75 (Hampir KKM)', min: 66, max: 75, count: 0 },
    { range: '76 - 85 (Baik)', min: 76, max: 85, count: 0 },
    { range: '86 - 100 (Sangat Baik)', min: 86, max: 100, count: 0 },
  ];

  const totalScoresCount = results.length;
  results.forEach((r) => {
    const s = r.totalScore;
    for (const b of brackets) {
      if (s >= b.min && s <= b.max) {
        b.count++;
        break;
      }
    }
  });

  const scoreDistribution: ScoreDistribution[] = brackets.map((b) => ({
    range: b.range,
    count: b.count,
    percentage: totalScoresCount > 0 ? Math.round((b.count / totalScoresCount) * 100) : 0,
  }));

  // 2. Category Performance
  const categoryPerformance: CategoryPerformanceStat[] = categories.map((cat) => {
    const scores: number[] = [];
    results.forEach((r) => {
      const catScore = r.categoryScores[cat.code] !== undefined ? r.categoryScores[cat.code] : r.categoryScores[cat.id];
      if (catScore !== undefined && typeof catScore === 'number') {
        scores.push(catScore);
      }
    });

    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const max = scores.length > 0 ? Math.max(...scores) : 0;
    const min = scores.length > 0 ? Math.min(...scores) : 0;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      weight: cat.weight,
      passingGrade: cat.passingGrade,
      averageScore: avg,
      highestScore: max,
      lowestScore: min,
      testedCount: scores.length,
    };
  });

  // 3. Program Breakdown
  const decisionMap = new Map<string, string>();
  decisions.forEach((d) => decisionMap.set(d.applicantId, d.decision));

  const programMap = new Map<string, { total: number; accepted: number; rejected: number; waitlist: number; pending: number }>();
  applicants.forEach((a) => {
    const prog = a.program || 'Umum';
    if (!programMap.has(prog)) {
      programMap.set(prog, { total: 0, accepted: 0, rejected: 0, waitlist: 0, pending: 0 });
    }
    const stat = programMap.get(prog)!;
    stat.total++;

    const dec = decisionMap.get(a.id);
    if (dec === 'accepted') stat.accepted++;
    else if (dec === 'rejected') stat.rejected++;
    else if (dec === 'waitlist') stat.waitlist++;
    else stat.pending++;
  });

  const programStats: ProgramStat[] = Array.from(programMap.entries()).map(([program, counts]) => ({
    program,
    ...counts,
  }));

  return {
    stats,
    scoreDistribution,
    categoryPerformance,
    programStats,
  };
}

// Test Categories
export async function getTestCategories(): Promise<TestCategory[]> {
  const path = 'testCategories';
  try {
    const snapshot = await getDocs(query(collection(db, path), orderBy('order', 'asc')));
    const list: TestCategory[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as TestCategory);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveTestCategory(category: Omit<TestCategory, 'id'> & { id?: string }): Promise<void> {
  const path = 'testCategories';
  try {
    const colRef = collection(db, path);
    const catDoc = category.id ? doc(colRef, category.id) : doc(colRef);
    await setDoc(catDoc, { ...category, id: catDoc.id, isActive: category.isActive !== undefined ? category.isActive : true }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTestCategory(categoryId: string): Promise<void> {
  const path = `testCategories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'testCategories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Question Banks
export async function getQuestions(categoryId?: string): Promise<QuestionBank[]> {
  const path = 'questionBanks';
  try {
    let q;
    if (categoryId && categoryId !== 'all') {
      q = query(collection(db, path), where('categoryId', '==', categoryId));
    } else {
      q = query(collection(db, path), limit(150));
    }
    const snapshot = await getDocs(q);
    const list: QuestionBank[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as QuestionBank);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveQuestion(question: Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<void> {
  const path = 'questionBanks';
  try {
    const colRef = collection(db, path);
    const qDoc = question.id ? doc(colRef, question.id) : doc(colRef);
    const now = new Date().toISOString();

    await setDoc(
      qDoc,
      {
        ...question,
        id: qDoc.id,
        createdAt: question.id ? undefined : now,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const path = `questionBanks/${questionId}`;
  try {
    await deleteDoc(doc(db, 'questionBanks', questionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Test Schedules
export async function getTestSchedules(): Promise<TestSchedule[]> {
  const path = 'testSchedules';
  try {
    const snapshot = await getDocs(query(collection(db, path), orderBy('examDate', 'asc')));
    const list: TestSchedule[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as TestSchedule);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveTestSchedule(schedule: Omit<TestSchedule, 'id'> & { id?: string }): Promise<void> {
  const path = 'testSchedules';
  try {
    const colRef = collection(db, path);
    const schedDoc = schedule.id ? doc(colRef, schedule.id) : doc(colRef);
    const now = new Date().toISOString();

    await setDoc(
      schedDoc,
      {
        ...schedule,
        id: schedDoc.id,
        status: schedule.status || 'open',
        durationMinutes: schedule.durationMinutes || 90,
        createdAt: schedule.id ? undefined : now,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateScheduleStatus(scheduleId: string, status: 'open' | 'closed' | 'cancelled'): Promise<void> {
  const path = `testSchedules/${scheduleId}`;
  try {
    await updateDoc(doc(db, 'testSchedules', scheduleId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTestSchedule(scheduleId: string): Promise<void> {
  const path = `testSchedules/${scheduleId}`;
  try {
    await deleteDoc(doc(db, 'testSchedules', scheduleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// System Grading Policy Configuration
export async function getSystemGradingConfig(): Promise<SystemGradingConfig> {
  const path = 'systemConfig/gradingPolicy';
  const defaultPolicy: SystemGradingConfig = {
    id: 'gradingPolicy',
    totalWeight: 100,
    aggregatePassingGrade: 75,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowDirectResultView: false,
    scoringPolicy: 'standard',
    defaultDurationMinutes: 90,
    sampleQuestionCount: 30,
    updatedAt: new Date().toISOString(),
  };

  try {
    const docSnap = await getDoc(doc(db, 'systemConfig', 'gradingPolicy'));
    if (docSnap.exists()) {
      return { ...defaultPolicy, ...docSnap.data() } as SystemGradingConfig;
    }
    return defaultPolicy;
  } catch {
    return defaultPolicy;
  }
}

export async function saveSystemGradingConfig(config: Partial<SystemGradingConfig>): Promise<void> {
  const path = 'systemConfig/gradingPolicy';
  try {
    await setDoc(
      doc(db, 'systemConfig', 'gradingPolicy'),
      {
        ...config,
        id: 'gradingPolicy',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Examiner Assessments
export async function getExaminerAssessments(examinerId?: string): Promise<ExaminerAssessment[]> {
  const path = 'examinerAssessments';
  try {
    let q;
    if (examinerId) {
      q = query(collection(db, path), where('examinerId', '==', examinerId));
    } else {
      q = query(collection(db, path), orderBy('evaluatedAt', 'desc'), limit(100));
    }
    const snapshot = await getDocs(q);
    const list: ExaminerAssessment[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as ExaminerAssessment);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function submitExaminerAssessment(assessment: Omit<ExaminerAssessment, 'id' | 'evaluatedAt'>): Promise<void> {
  const path = 'examinerAssessments';
  try {
    const colRef = collection(db, path);
    const newDoc = doc(colRef);
    const fullAssessment: ExaminerAssessment = {
      ...assessment,
      id: newDoc.id,
      evaluatedAt: new Date().toISOString(),
    };
    await setDoc(newDoc, fullAssessment);

    await updateApplicant(assessment.applicantId, {
      status: 'tested',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Admission Decisions
export async function getAdmissionDecisions(): Promise<AdmissionDecision[]> {
  const path = 'admissionDecisions';
  try {
    const snapshot = await getDocs(query(collection(db, path), orderBy('decisionDate', 'desc')));
    const list: AdmissionDecision[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as AdmissionDecision);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function recordDecisionAuditLog(
  log: Omit<DecisionAuditLog, 'id' | 'timestamp'>
): Promise<void> {
  const path = 'decisionAuditLogs';
  try {
    const colRef = collection(db, path);
    const newDoc = doc(colRef);
    const fullLog: DecisionAuditLog = {
      ...log,
      id: newDoc.id,
      timestamp: new Date().toISOString(),
    };
    await setDoc(newDoc, fullLog);
  } catch (error) {
    console.error('Error logging decision audit:', error);
  }
}

export async function getDecisionAuditLogs(applicantId?: string): Promise<DecisionAuditLog[]> {
  const path = 'decisionAuditLogs';
  try {
    let q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(100));
    if (applicantId) {
      q = query(collection(db, path), where('applicantId', '==', applicantId), orderBy('timestamp', 'desc'));
    }
    const snapshot = await getDocs(q);
    const logs: DecisionAuditLog[] = [];
    snapshot.forEach((d) => logs.push({ id: d.id, ...d.data() } as DecisionAuditLog));
    return logs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function submitAdmissionDecision(
  decision: Omit<AdmissionDecision, 'id' | 'decisionDate'>,
  auditReason?: string
): Promise<void> {
  const path = 'admissionDecisions';
  try {
    // Check if previous decision exists for this applicant
    const existingSnap = await getDocs(
      query(collection(db, path), where('applicantId', '==', decision.applicantId), limit(1))
    );

    let docRef;
    let prevDecision: any = undefined;

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      docRef = existingDoc.ref;
      prevDecision = (existingDoc.data() as AdmissionDecision).decision;
    } else {
      docRef = doc(collection(db, path));
    }

    const fullDecision: AdmissionDecision = {
      ...decision,
      id: docRef.id,
      decisionDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, fullDecision, { merge: true });

    // Update applicant status to announced
    await updateApplicant(decision.applicantId, {
      status: 'announced',
    });

    // Record audit log
    await recordDecisionAuditLog({
      applicantId: decision.applicantId,
      applicantName: decision.applicantName || 'Calon Santri',
      registrationNumber: decision.registrationNumber || '-',
      previousDecision: prevDecision,
      newDecision: decision.decision,
      changedBy: decision.decidedBy || 'Panitia PPDB',
      changedByEmail: decision.decidedByEmail,
      reason: auditReason || decision.notes || 'Penetapan keputusan hasil sidang pleno PPDB.',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Announcement Configuration
export async function getAnnouncementConfig(): Promise<AnnouncementConfig> {
  const path = 'announcementConfig/current';
  try {
    const docSnap = await getDoc(doc(db, 'announcementConfig', 'current'));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as AnnouncementConfig;
    }
    // Default announcement settings
    const defaultConfig: AnnouncementConfig = {
      id: 'current',
      isPublished: true, // Default active so initial demo showcases results
      publishDate: new Date().toISOString(),
      showCategoryBreakdown: true,
      showExaminerNotes: false, // Internal notes hidden from applicants by default
      publicNotice: 'Berdasarkan hasil musyawarah dan sidang pleno Panitia Penerimaan Peserta Didik Baru (PPDB) Pondok Pesantren Al Ikhlas Tahun Ajaran 2026/2027, dengan senantiasa mengharap ridho Allah SWT, berikut kami umumkan penetapan hasil seleksi calon santri baru.',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };
    await setDoc(doc(db, 'announcementConfig', 'current'), defaultConfig);
    return defaultConfig;
  } catch {
    return {
      id: 'current',
      isPublished: true,
      publishDate: new Date().toISOString(),
      showCategoryBreakdown: true,
      showExaminerNotes: false,
      publicNotice: 'Pengumuman resmi hasil seleksi PPDB Pondok Pesantren Al Ikhlas.',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };
  }
}

export async function saveAnnouncementConfig(
  updates: Partial<AnnouncementConfig>,
  updatedBy: string
): Promise<AnnouncementConfig> {
  const path = 'announcementConfig/current';
  try {
    const ref = doc(db, 'announcementConfig', 'current');
    const existing = await getAnnouncementConfig();
    const merged: AnnouncementConfig = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    await setDoc(ref, merged, { merge: true });
    return merged;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// ================= CBT ONLINE EXAM & SESSIONS =================

export async function getTestSession(sessionId: string): Promise<TestSession | null> {
  const path = `testSessions/${sessionId}`;
  try {
    const docSnap = await getDoc(doc(db, 'testSessions', sessionId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as TestSession;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getActiveSessionForApplicant(applicantId: string, scheduleId?: string): Promise<TestSession | null> {
  const path = 'testSessions';
  try {
    let q = query(
      collection(db, path),
      where('applicantId', '==', applicantId),
      limit(10)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      for (const d of snapshot.docs) {
        const data = d.data() as TestSession;
        if (scheduleId && data.scheduleId !== scheduleId) continue;
        if (data.status === 'in_progress' || data.status === 'scheduled') {
          return { ...data, id: d.id };
        }
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function startTestSession(
  applicant: Applicant,
  schedule: TestSchedule,
  categoryId: string = 'AKADEMIK'
): Promise<{ session: TestSession; questions: QuestionBank[] }> {
  const path = 'testSessions';
  try {
    // 1. Check if there's already an existing session for this applicant and schedule
    const existing = await getActiveSessionForApplicant(applicant.id, schedule.id);
    const allQuestions = await getQuestions(categoryId === 'all' ? undefined : categoryId);
    const config = await getSystemGradingConfig();

    // Filter active questions
    let activeQuestions = allQuestions.filter((q) => q.isActive);
    if (activeQuestions.length === 0) {
      activeQuestions = allQuestions; // Fallback
    }

    // Shuffle questions if configured
    if (config.shuffleQuestions) {
      activeQuestions = [...activeQuestions].sort(() => Math.random() - 0.5);
    }

    // Take sample question count
    const sampleCount = Math.min(activeQuestions.length, config.sampleQuestionCount || 25);
    const selectedQuestions = activeQuestions.slice(0, sampleCount);

    if (existing) {
      // Check if session has expired
      const now = new Date().getTime();
      const expiry = new Date(existing.expiresAt).getTime();
      if (now > expiry && existing.status === 'in_progress') {
        // Mark as timeout
        await updateDoc(doc(db, 'testSessions', existing.id), {
          status: 'timeout',
          submittedAt: new Date().toISOString(),
        });
        existing.status = 'timeout';
      }
      return { session: existing, questions: selectedQuestions };
    }

    // Create new session
    const colRef = collection(db, path);
    const newSessionDoc = doc(colRef);
    const duration = schedule.durationMinutes || config.defaultDurationMinutes || 90;
    const startTime = new Date();
    const expiryTime = new Date(startTime.getTime() + duration * 60000);

    const newSession: TestSession = {
      id: newSessionDoc.id,
      applicantId: applicant.id,
      applicantName: applicant.fullName,
      registrationNumber: applicant.registrationNumber,
      scheduleId: schedule.id,
      categoryId,
      categoryName: schedule.categoryName || 'Tes Akademik CBT',
      status: 'in_progress',
      startedAt: startTime.toISOString(),
      expiresAt: expiryTime.toISOString(),
      durationMinutes: duration,
      totalQuestions: selectedQuestions.length,
      totalAnswered: 0,
      markedDoubtQuestionIds: [],
      lastSavedAt: startTime.toISOString(),
    };

    await setDoc(newSessionDoc, newSession);

    // Update applicant status to testing
    await updateApplicant(applicant.id, {
      status: 'testing',
    });

    return { session: newSession, questions: selectedQuestions };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Autosave an individual answer (Idempotent: document ID is `${sessionId}_${questionId}`)
export async function saveAnswerAutosave(
  sessionId: string,
  applicantId: string,
  questionId: string,
  selectedOptionIndex?: number,
  essayAnswer?: string,
  isMarkedDoubt?: boolean
): Promise<TestAnswer> {
  const path = 'testAnswers';
  const docId = `${sessionId}_${questionId}`;
  const now = new Date().toISOString();

  const answerPayload: TestAnswer = {
    id: docId,
    sessionId,
    applicantId,
    questionId,
    selectedOptionIndex: selectedOptionIndex !== undefined ? selectedOptionIndex : undefined,
    essayAnswer: essayAnswer !== undefined ? essayAnswer : undefined,
    isMarkedDoubt: Boolean(isMarkedDoubt),
    answeredAt: now,
    syncStatus: 'synced',
  };

  // 1. Save to LocalStorage as offline backup
  try {
    const localKey = `cbt_answers_${sessionId}`;
    const cached = JSON.parse(localStorage.getItem(localKey) || '{}');
    cached[questionId] = answerPayload;
    localStorage.setItem(localKey, JSON.stringify(cached));
  } catch {
    // Ignore localStorage storage limits
  }

  // 2. Save to Firestore
  try {
    const answerRef = doc(db, 'testAnswers', docId);
    await setDoc(answerRef, answerPayload, { merge: true });

    // Update session lastSavedAt
    const sessionRef = doc(db, 'testSessions', sessionId);
    await updateDoc(sessionRef, {
      lastSavedAt: now,
    }).catch(() => {});

    return answerPayload;
  } catch (error) {
    // If offline, return with pending sync status
    answerPayload.syncStatus = 'pending';
    return answerPayload;
  }
}

// Toggle or update doubt/marked status for a question
export async function toggleQuestionDoubt(sessionId: string, questionId: string, isDoubt: boolean): Promise<void> {
  try {
    const sessionRef = doc(db, 'testSessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    if (sessionSnap.exists()) {
      const current = (sessionSnap.data().markedDoubtQuestionIds as string[]) || [];
      let updated: string[];
      if (isDoubt) {
        updated = Array.from(new Set([...current, questionId]));
      } else {
        updated = current.filter((id) => id !== questionId);
      }
      await updateDoc(sessionRef, { markedDoubtQuestionIds: updated });
    }
  } catch {
    // Fallback
  }
}

// Retrieve all answers for an exam session
export async function getAnswersForSession(sessionId: string): Promise<Record<string, TestAnswer>> {
  const path = 'testAnswers';
  const resultMap: Record<string, TestAnswer> = {};

  // First read local cache
  try {
    const localKey = `cbt_answers_${sessionId}`;
    const cached = JSON.parse(localStorage.getItem(localKey) || '{}');
    Object.assign(resultMap, cached);
  } catch {
    // Ignore
  }

  // Then fetch Firestore answers
  try {
    const q = query(collection(db, path), where('sessionId', '==', sessionId));
    const snapshot = await getDocs(q);
    snapshot.forEach((d) => {
      const data = d.data() as TestAnswer;
      resultMap[data.questionId] = { ...data, id: d.id, syncStatus: 'synced' };
    });
  } catch (err) {
    console.warn('Could not read from server, using local cache:', err);
  }

  return resultMap;
}

// Submit & Auto-Grade Test Session
export async function submitTestSession(sessionId: string): Promise<{ session: TestSession; result: TestResult }> {
  const path = `testSessions/${sessionId}`;
  const now = new Date().toISOString();

  // 1. Fetch Session
  const sessionSnap = await getDoc(doc(db, 'testSessions', sessionId));
  if (!sessionSnap.exists()) {
    throw new Error('Sesi ujian tidak ditemukan.');
  }
  const session = { id: sessionSnap.id, ...sessionSnap.data() } as TestSession;

  // 2. Fetch all questions and grading config for evaluation
  const [allQuestions, answersMap, config] = await Promise.all([
    getQuestions(),
    getAnswersForSession(sessionId),
    getSystemGradingConfig(),
  ]);

  const questionLookup = new Map<string, QuestionBank>();
  allQuestions.forEach((q) => questionLookup.set(q.id, q));

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalScorePoints = 0;
  let maxPossiblePoints = 0;

  // Evaluate each question attempted or assigned
  const answeredQuestionIds = Object.keys(answersMap);

  for (const qId of answeredQuestionIds) {
    const ans = answersMap[qId];
    const q = questionLookup.get(qId);
    if (!q) continue;

    maxPossiblePoints += q.points || 10;
    let isCorrect = false;

    if (q.questionType === 'multiple_choice' || q.questionType === 'true_false') {
      if (ans.selectedOptionIndex !== undefined && ans.selectedOptionIndex === q.correctOptionIndex) {
        isCorrect = true;
      }
    } else if (q.questionType === 'short_answer') {
      if (
        ans.essayAnswer &&
        q.correctAnswerText &&
        ans.essayAnswer.trim().toLowerCase() === q.correctAnswerText.trim().toLowerCase()
      ) {
        isCorrect = true;
      }
    }

    if (isCorrect) {
      correctCount++;
      totalScorePoints += q.points || 10;
    } else if (
      ans.selectedOptionIndex !== undefined ||
      (ans.essayAnswer && ans.essayAnswer.trim().length > 0)
    ) {
      incorrectCount++;
      if (config.scoringPolicy === 'penalty') {
        totalScorePoints = Math.max(0, totalScorePoints - 1);
      }
    } else {
      unansweredCount++;
    }

    // Save individual graded answer flag
    try {
      await updateDoc(doc(db, 'testAnswers', ans.id), {
        isCorrect,
        scoreAwarded: isCorrect ? q.points || 10 : 0,
      });
    } catch {
      // Ignore non-fatal update
    }
  }

  // Calculate percentage CBT score (0 - 100)
  const cbtScore = maxPossiblePoints > 0
    ? Math.min(100, Math.max(0, Math.round((totalScorePoints / maxPossiblePoints) * 100)))
    : 80;

  // 3. Update session
  const updatedSession: TestSession = {
    ...session,
    status: 'completed',
    submittedAt: now,
    cbtScore,
    totalAnswered: correctCount + incorrectCount,
  };

  await setDoc(doc(db, 'testSessions', sessionId), updatedSession, { merge: true });

  // 4. Update applicant test result aggregation
  const result = await recalculateApplicantResult(
    session.applicantId,
    cbtScore,
    correctCount,
    incorrectCount,
    unansweredCount
  );

  return { session: updatedSession, result };
}

// Recalculate applicant overall multi-category test results
export async function recalculateApplicantResult(
  applicantId: string,
  cbtScoreOverride?: number,
  cbtCorrect?: number,
  cbtIncorrect?: number,
  cbtUnanswered?: number
): Promise<TestResult> {
  const [applicant, categories, config, assessments, sessions] = await Promise.all([
    getAllApplicants(true).then((list) => list.find((a) => a.id === applicantId)),
    getTestCategories(),
    getSystemGradingConfig(),
    getExaminerAssessments().then((list) => list.filter((a) => a.applicantId === applicantId && !a.isDraft)),
    getDocs(query(collection(db, 'testSessions'), where('applicantId', '==', applicantId))),
  ]);

  // Find CBT score from completed sessions or override
  let cbtScore = cbtScoreOverride;
  if (cbtScore === undefined) {
    sessions.forEach((s) => {
      const data = s.data() as TestSession;
      if (data.status === 'completed' && data.cbtScore !== undefined) {
        cbtScore = data.cbtScore;
      }
    });
  }

  // Map category scores
  const categoryScores: Record<string, number> = {};
  if (cbtScore !== undefined) {
    categoryScores['AKADEMIK'] = cbtScore;
  }

  assessments.forEach((ass) => {
    categoryScores[ass.categoryId] = ass.totalScore;
  });

  // Calculate weighted score
  const activeCategories = categories.filter((c) => c.isActive !== false);
  let totalWeightedScore = 0;
  const missingCategories: string[] = [];

  for (const cat of activeCategories) {
    const score = categoryScores[cat.code] !== undefined
      ? categoryScores[cat.code]
      : categoryScores[cat.id];

    if (score !== undefined) {
      totalWeightedScore += score * (cat.weight / 100);
    } else {
      missingCategories.push(cat.name);
    }
  }

  const isCompleted = missingCategories.length === 0;
  const finalTotal = Math.round(totalWeightedScore);
  const aggregatePassingGrade = config.aggregatePassingGrade || 75;
  const status: 'pending' | 'passed' | 'failed' = !isCompleted
    ? 'pending'
    : finalTotal >= aggregatePassingGrade
    ? 'passed'
    : 'failed';

  // Automated Recommendation logic
  let automaticRecommendation: 'recommended_accepted' | 'recommended_waitlist' | 'recommended_rejected' | 'pending_incomplete';
  let recommendationReason: string;

  if (!isCompleted) {
    automaticRecommendation = 'pending_incomplete';
    recommendationReason = `Penilaian belum lengkap: masih ada ${missingCategories.length} kategori yang belum dinilai (${missingCategories.join(', ')}).`;
  } else if (finalTotal >= aggregatePassingGrade) {
    const belowKkmCats = activeCategories.filter((c) => {
      const s = categoryScores[c.code] !== undefined ? categoryScores[c.code] : categoryScores[c.id];
      return s !== undefined && s < c.passingGrade;
    });

    if (belowKkmCats.length > 0) {
      automaticRecommendation = 'recommended_waitlist';
      recommendationReason = `Total nilai akhir (${finalTotal}) mencapai passing grade (${aggregatePassingGrade}), namun terdapat nilai di bawah KKM kategori: ${belowKkmCats.map((c) => `${c.name} (${categoryScores[c.code] ?? categoryScores[c.id]}/${c.passingGrade})`).join(', ')}. Disarankan status Cadangan.`;
    } else {
      automaticRecommendation = 'recommended_accepted';
      recommendationReason = `Memenuhi passing grade agregat (${finalTotal} >= ${aggregatePassingGrade}) dan seluruh KKM 5 materi ujian terpenuhi. Sangat disarankan Lulus.`;
    }
  } else {
    automaticRecommendation = 'recommended_rejected';
    recommendationReason = `Total nilai akhir (${finalTotal}) belum mencapai passing grade kelulusan (${aggregatePassingGrade}).`;
  }

  const categoryWeights: Record<string, number> = {};
  const categoryPassingGrades: Record<string, number> = {};
  activeCategories.forEach((c) => {
    categoryWeights[c.code] = c.weight;
    categoryPassingGrades[c.code] = c.passingGrade;
  });

  const calculationConfigSnapshot = {
    aggregatePassingGrade,
    categoryWeights,
    categoryPassingGrades,
    calculatedAt: new Date().toISOString(),
  };

  const resultObj: TestResult = {
    id: applicantId,
    applicantId,
    applicantName: applicant?.fullName || 'Calon Santri',
    registrationNumber: applicant?.registrationNumber || '-',
    cbtScore: cbtScore || 0,
    cbtCorrectCount: cbtCorrect,
    cbtIncorrectCount: cbtIncorrect,
    cbtUnansweredCount: cbtUnanswered,
    categoryScores,
    totalScore: finalTotal,
    isCompleted,
    missingCategories,
    status,
    automaticRecommendation,
    recommendationReason,
    calculationConfigSnapshot,
    generatedAt: new Date().toISOString(),
  };

  // Save to testResults collection
  const resultRef = doc(db, 'testResults', applicantId);
  await setDoc(resultRef, resultObj, { merge: true });

  // If completed, update applicant status to 'tested'
  if (isCompleted && applicant?.status !== 'announced') {
    await updateApplicant(applicantId, {
      status: 'tested',
    });
  }

  return resultObj;
}

export async function getApplicantTestResult(applicantId: string): Promise<TestResult | null> {
  const path = `testResults/${applicantId}`;
  try {
    const docSnap = await getDoc(doc(db, 'testResults', applicantId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as TestResult;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAllTestResults(): Promise<TestResult[]> {
  const path = 'testResults';
  try {
    const snapshot = await getDocs(collection(db, path));
    const list: TestResult[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as TestResult);
    });
    return list;
  } catch {
    return [];
  }
}

// Export CSV generator helper
export function generatePPDBReportCsv(
  applicants: Applicant[],
  results: Map<string, TestResult>,
  decisions: Map<string, AdmissionDecision>,
  categories: TestCategory[]
): string {
  const headers = [
    'No. Registrasi',
    'Nama Lengkap',
    'NISN',
    'Jenis Kelamin',
    'Program Pilihan',
    'Gelombang',
    'Asal Sekolah',
    'Nama Wali',
    'No. HP Wali',
    'Status Seleksi Santri',
    'Status Kelengkapan Tes',
    ...categories.map((c) => `Nilai: ${c.name} (${c.weight}%)`),
    'Nilai Akhir Total (0-100)',
    'Rekomendasi Sistem',
    'Keputusan Panitia',
    'Catatan Keputusan',
    'Tanggal Penetapan',
  ];

  const rows = applicants.map((a) => {
    const res = results.get(a.id);
    const dec = decisions.get(a.id);

    const categoryScoreCols = categories.map((c) => {
      if (!res) return '-';
      const s = res.categoryScores[c.code] !== undefined ? res.categoryScores[c.code] : res.categoryScores[c.id];
      return s !== undefined ? String(s) : '-';
    });

    const decisionText = dec
      ? dec.decision === 'accepted'
        ? 'LULUS DITERIMA'
        : dec.decision === 'waitlist'
        ? 'CADANGAN'
        : 'TIDAK LULUS'
      : 'MENUNGGU KEPUTUSAN';

    const recommendationText = res?.automaticRecommendation
      ? res.automaticRecommendation === 'recommended_accepted'
        ? 'Disarankan Lulus'
        : res.automaticRecommendation === 'recommended_waitlist'
        ? 'Disarankan Cadangan'
        : res.automaticRecommendation === 'recommended_rejected'
        ? 'Disarankan Tidak Lulus'
        : 'Penilaian Belum Lengkap'
      : '-';

    return [
      `"${a.registrationNumber}"`,
      `"${a.fullName.replace(/"/g, '""')}"`,
      `"${a.nisn}"`,
      `"${a.gender === 'L' ? 'Laki-laki' : 'Perempuan'}"`,
      `"${a.program}"`,
      `"${a.wave}"`,
      `"${(a.previousSchool || '').replace(/"/g, '""')}"`,
      `"${(a.parentName || '').replace(/"/g, '""')}"`,
      `"${a.parentPhone || ''}"`,
      `"${a.status}"`,
      `"${res ? (res.isCompleted ? 'Lengkap' : `Kurang (${(res.missingCategories || []).join(', ')})`) : 'Belum Tes'}"`,
      ...categoryScoreCols.map((c) => `"${c}"`),
      `"${res ? res.totalScore : '-'}"`,
      `"${recommendationText}"`,
      `"${decisionText}"`,
      `"${(dec?.notes || '').replace(/"/g, '""')}"`,
      `"${dec?.decisionDate ? new Date(dec.decisionDate).toLocaleDateString('id-ID') : '-'}"`,
    ].join(',');
  });

  // Include UTF-8 BOM for Microsoft Excel compatibility
  return '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
}


// Seed Initial Baseline Data for Pondok Pesantren Al Ikhlas (5 Initial Test Categories & Sample Questions)
export async function seedPPDBMasterData(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Initial 5 Test Categories as specified:
    // - Tes Akademik
    // - Tes Baca Al-Qur'an
    // - Tes Hafalan
    // - Tes Wawancara
    // - Tes Praktik
    const initialCategories: Omit<TestCategory, 'id'>[] = [
      {
        code: 'AKADEMIK',
        name: 'Tes Akademik',
        description: 'Potensi akademik, matematika dasar, IPA, dan pengetahuan umum keislaman.',
        type: 'cbt',
        passingGrade: 70,
        weight: 25,
        order: 1,
        isActive: true,
      },
      {
        code: 'QURAN',
        name: 'Tes Baca Al-Qur\'an',
        description: 'Ujian tajwid, makharijul huruf, kelancaran membaca mushaf, dan kaidah tartil.',
        type: 'examiner',
        passingGrade: 75,
        weight: 25,
        order: 2,
        isActive: true,
      },
      {
        code: 'HAFALAN',
        name: 'Tes Hafalan (Tahfidz)',
        description: 'Kelancaran hafalan juz 30, sambung ayat, dan ketepatan hafalan surat-surat pendek.',
        type: 'examiner',
        passingGrade: 75,
        weight: 25,
        order: 3,
        isActive: true,
      },
      {
        code: 'WAWANCARA',
        name: 'Tes Wawancara',
        description: 'Kesiapan mental mondok berasrama, kemandirian santri, adab, dan komitmen wali santri.',
        type: 'interview',
        passingGrade: 70,
        weight: 15,
        order: 4,
        isActive: true,
      },
      {
        code: 'PRAKTIK',
        name: 'Tes Praktik',
        description: 'Praktik shalat fardhu, wudhu, doa harian, dan fiqih amaliyah ibadah santri.',
        type: 'practical',
        passingGrade: 75,
        weight: 10,
        order: 5,
        isActive: true,
      },
    ];

    for (const cat of initialCategories) {
      await saveTestCategory(cat);
    }

    // 2. Initial Test Schedules
    const defaultSchedules: Omit<TestSchedule, 'id'>[] = [
      {
        title: 'Sesi Pagi: Ujian CBT Potensi Akademik',
        categoryId: 'AKADEMIK',
        categoryName: 'Tes Akademik',
        examDate: '2026-11-10',
        startTime: '08:00',
        endTime: '09:30',
        durationMinutes: 90,
        room: 'Laboratorium Komputer 1 & 2',
        quota: 50,
        status: 'open',
        wave: 'Gelombang 1',
        targetProgram: 'Semua Program',
      },
      {
        title: 'Sesi Siang: Ujian Baca Al-Qur\'an & Hafalan Tahfidz',
        categoryId: 'HAFALAN',
        categoryName: 'Tes Hafalan (Tahfidz)',
        examDate: '2026-11-10',
        startTime: '10:00',
        endTime: '12:00',
        durationMinutes: 120,
        room: 'Gedung Tahfidz Lt. 2 & Masjid Jami\'',
        quota: 50,
        status: 'open',
        wave: 'Gelombang 1',
        targetProgram: 'Semua Program',
      },
      {
        title: 'Sesi Sore: Wawancara Santri & Praktik Ibadah',
        categoryId: 'WAWANCARA',
        categoryName: 'Tes Wawancara & Praktik',
        examDate: '2026-11-10',
        startTime: '13:30',
        endTime: '16:00',
        durationMinutes: 150,
        room: 'Aula Pertemuan & Kantor Asatidz',
        quota: 50,
        status: 'open',
        wave: 'Gelombang 1',
        targetProgram: 'Semua Program',
      },
    ];

    for (const sched of defaultSchedules) {
      await saveTestSchedule(sched);
    }

    // 3. Initial Sample Question Pool in Bank Soal
    const existingQuestions = await getQuestions();
    if (existingQuestions.length === 0) {
      const sampleQuestions: Array<Omit<QuestionBank, 'id'>> = [
        {
          categoryId: 'AKADEMIK',
          categoryName: 'Tes Akademik',
          questionText: 'Kitab suci Al-Qur\'an diturunkan kepada Nabi Muhammad SAW melalui perantara Malaikat Jibril AS secara berangsur-angsur selama kurang lebih...',
          questionType: 'multiple_choice',
          options: [
            '20 tahun 2 bulan 20 hari',
            '22 tahun 2 bulan 22 hari',
            '25 tahun genap',
            '10 tahun di Makkah dan 10 tahun di Madinah'
          ],
          correctOptionIndex: 1,
          points: 10,
          explanation: 'Al-Qur\'an diturunkan selama 22 tahun, 2 bulan, dan 22 hari (sekitar 23 tahun) di Makkah dan Madinah.',
          isActive: true,
        },
        {
          categoryId: 'AKADEMIK',
          categoryName: 'Tes Akademik',
          questionText: 'Sebuah pondok pesantren memiliki 15 asrama santri. Jika setiap asrama dihuni oleh 12 santri, berapa total santri yang tinggal di seluruh asrama tersebut?',
          questionType: 'multiple_choice',
          options: ['160 santri', '170 santri', '180 santri', '190 santri'],
          correctOptionIndex: 2,
          points: 10,
          explanation: '15 x 12 = 180 santri.',
          isActive: true,
        },
        {
          categoryId: 'AKADEMIK',
          categoryName: 'Tes Akademik',
          questionText: 'Hukum bacaan Nun Sukun (نْ) bertemu dengan huruf Ba (ب) dinamakan Iqlab.',
          questionType: 'true_false',
          options: ['Benar', 'Salah'],
          correctOptionIndex: 0,
          points: 10,
          explanation: 'Nun sukun atau tanwin bertemu huruf ba dibaca iqlab (mengganti bunyi nun menjadi mim disertai dengung).',
          isActive: true,
        },
        {
          categoryId: 'AKADEMIK',
          categoryName: 'Tes Akademik',
          questionText: 'Sebutkan rukun Islam yang ketiga yang diwajibkan bagi muslim yang telah mencapai nishab dan haul!',
          questionType: 'short_answer',
          correctAnswerText: 'Zakat',
          points: 10,
          explanation: 'Rukun Islam ke-3 adalah Menunaikan Zakat.',
          isActive: true,
        },
        {
          categoryId: 'QURAN',
          categoryName: 'Tes Baca Al-Qur\'an',
          questionText: 'Berapa harakat panjang bacaan Mad Thabi\'i (Mad Asli) dalam kaidah ilmu tajwid?',
          questionType: 'multiple_choice',
          options: ['1 Harakat', '2 Harakat (1 Alif)', '4 Harakat (2 Alif)', '6 Harakat (3 Alif)'],
          correctOptionIndex: 1,
          points: 10,
          explanation: 'Mad Thabi\'i dibaca sepanjang 2 harakat (1 alif).',
          isActive: true,
        },
        {
          categoryId: 'PRAKTIK',
          categoryName: 'Tes Praktik',
          questionText: 'Shalat sunnah yang dikerjakan saat memasuki masjid sebelum duduk disebut shalat...',
          questionType: 'short_answer',
          correctAnswerText: 'Tahiyyatul Masjid',
          points: 10,
          explanation: 'Shalat sunnah dua rakaat untuk menghormati masjid.',
          isActive: true,
        },
      ];

      for (const q of sampleQuestions) {
        await saveQuestion(q);
      }
    }

    // 4. Initial Baseline Grading Policy
    await saveSystemGradingConfig({
      id: 'gradingPolicy',
      totalWeight: 100,
      aggregatePassingGrade: 75,
      shuffleQuestions: true,
      shuffleOptions: true,
      allowDirectResultView: false,
      scoringPolicy: 'standard',
      defaultDurationMinutes: 90,
      sampleQuestionCount: 25,
    });

    // 5. Initial Sample Applicants
    const existing = await getAllApplicants(true);
    if (existing.length === 0) {
      const sampleApplicants: Omit<Applicant, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          userId: 'demo-santri-01',
          registrationNumber: 'PPDB-2026-001',
          fullName: 'Ahmad Faiz Ramadhan (Demo)',
          nisn: '0089234123',
          gender: 'L',
          birthPlace: 'Bandung',
          birthDate: '2012-04-15',
          previousSchool: 'SDIT Nurul Fikri',
          parentName: 'H. Ridwan Ramadhan',
          parentPhone: '081234567890',
          address: 'Jl. Pesantren No. 12, Buahbatu, Bandung',
          wave: 'Gelombang 1',
          program: 'Kulliyyatul Mu\'allimin (KMI)',
          status: 'verified',
          isActive: true,
        },
        {
          userId: 'demo-santri-02',
          registrationNumber: 'PPDB-2026-002',
          fullName: 'Siti Maryam Al-Zahra (Demo)',
          nisn: '0087452134',
          gender: 'P',
          birthPlace: 'Jakarta',
          birthDate: '2012-08-20',
          previousSchool: 'MI Pembangunan Jakarta',
          parentName: 'Drs. H. Lukman Hakim',
          parentPhone: '081398765432',
          address: 'Komplek Griya Indah Blok C3 No. 4, Jakarta Timur',
          wave: 'Gelombang 1',
          program: 'Tahfidz Reguler',
          status: 'tested',
          isActive: true,
        },
        {
          userId: 'demo-santri-03',
          registrationNumber: 'PPDB-2026-003',
          fullName: 'Muhammad Hafiz An-Nawawi (Demo)',
          nisn: '0091123455',
          gender: 'L',
          birthPlace: 'Cirebon',
          birthDate: '2012-01-10',
          previousSchool: 'SDN 1 Sumber Cirebon',
          parentName: 'Ustadz Ahmad Nawawi',
          parentPhone: '081566778899',
          address: 'Desa Plered RT 02/04, Cirebon',
          wave: 'Gelombang 1',
          program: 'Madrasah Tsanawiyah Unggulan',
          status: 'registered',
          isActive: true,
        },
      ];

      for (const app of sampleApplicants) {
        await createApplicant(app);
      }
    }

    // 6. Ensure Announcement Config is initialized
    await getAnnouncementConfig();

    // 7. Seed Sample Assessments & Results for Demo Applicants if not present
    const allApps = await getAllApplicants(true);
    const demoApplicantTested = allApps.find((a) => a.registrationNumber === 'PPDB-2026-002');
    if (demoApplicantTested) {
      // Seed examiner assessments
      const existingAssessments = await getExaminerAssessments();
      const hasAssessments = existingAssessments.some((ass) => ass.applicantId === demoApplicantTested.id);
      if (!hasAssessments) {
        await submitExaminerAssessment({
          applicantId: demoApplicantTested.id,
          applicantName: demoApplicantTested.fullName,
          registrationNumber: demoApplicantTested.registrationNumber,
          examinerId: 'ustadz-ahmad',
          examinerName: 'Ust. Ahmad Dahlan, S.Th.I',
          categoryId: 'QURAN',
          categoryName: 'Tes Baca Al-Qur\'an',
          aspectScores: { quran_tajwid: 90, quran_makharij: 88, quran_kelancaran: 92 },
          totalScore: 90,
          isDraft: false,
          notes: 'Makharijul huruf sangat fasih, kaidah mad dan ghunnah mutqin.',
        });

        await submitExaminerAssessment({
          applicantId: demoApplicantTested.id,
          applicantName: demoApplicantTested.fullName,
          registrationNumber: demoApplicantTested.registrationNumber,
          examinerId: 'ustadz-zulkifli',
          examinerName: 'Ust. Zulkifli, Al-Hafizh',
          categoryId: 'HAFALAN',
          categoryName: 'Tes Hafalan (Tahfidz)',
          aspectScores: { hafalan_kelancaran: 95, hafalan_tajwid: 90, hafalan_sambung_ayat: 92 },
          totalScore: 92,
          isDraft: false,
          notes: 'Hafalan Juz 30 sangat lancar, sambung ayat terjawab dengan baik dan cepat.',
        });

        await submitExaminerAssessment({
          applicantId: demoApplicantTested.id,
          applicantName: demoApplicantTested.fullName,
          registrationNumber: demoApplicantTested.registrationNumber,
          examinerId: 'ustadz-ridwan',
          examinerName: 'Drs. KH. Ridwan',
          categoryId: 'WAWANCARA',
          categoryName: 'Tes Wawancara',
          aspectScores: { wawancara_adab: 90, wawancara_kemandirian: 85, wawancara_komitmen_wali: 90 },
          totalScore: 88,
          isDraft: false,
          notes: 'Adab santun, motivasi mondok mandiri kuat atas dorongan diri sendiri.',
        });

        await submitExaminerAssessment({
          applicantId: demoApplicantTested.id,
          applicantName: demoApplicantTested.fullName,
          registrationNumber: demoApplicantTested.registrationNumber,
          examinerId: 'ustadz-hassan',
          examinerName: 'Ust. Hassan Basri',
          categoryId: 'PRAKTIK',
          categoryName: 'Tes Praktik',
          aspectScores: { praktik_wudhu: 88, praktik_shalat: 88, praktik_doa: 85 },
          totalScore: 87,
          isDraft: false,
          notes: 'Gerakan wudhu dan shalat fardhu tertib sesuai sunnah.',
        });

        // Recalculate result with CBT score 85
        await recalculateApplicantResult(demoApplicantTested.id, 85, 9, 1, 0);

        // Submit approved admission decision
        await submitAdmissionDecision(
          {
            applicantId: demoApplicantTested.id,
            applicantName: demoApplicantTested.fullName,
            registrationNumber: demoApplicantTested.registrationNumber,
            decision: 'accepted',
            notes: 'Selamat! Berdasarkan hasil sidang pleno kelulusan, Ananda dinyatakan LULUS SELEKSI pada program Tahfidz Reguler Pondok Pesantren Al Ikhlas.',
            decidedBy: 'Panitia PPDB Pusat',
          },
          'Keputusan sidang pleno gelombang 1'
        );
      }
    }

    // Demo applicant with incomplete test
    const demoIncomplete = allApps.find((a) => a.registrationNumber === 'PPDB-2026-001');
    if (demoIncomplete) {
      const existingAssessments = await getExaminerAssessments();
      const hasAssessments = existingAssessments.some((ass) => ass.applicantId === demoIncomplete.id);
      if (!hasAssessments) {
        await submitExaminerAssessment({
          applicantId: demoIncomplete.id,
          applicantName: demoIncomplete.fullName,
          registrationNumber: demoIncomplete.registrationNumber,
          examinerId: 'ustadz-ahmad',
          examinerName: 'Ust. Ahmad Dahlan, S.Th.I',
          categoryId: 'QURAN',
          categoryName: 'Tes Baca Al-Qur\'an',
          aspectScores: { quran_tajwid: 78, quran_makharij: 75, quran_kelancaran: 80 },
          totalScore: 78,
          isDraft: false,
          notes: 'Bacaan cukup lancar, perlu perbaikan pada makhraj huruf halqiyyah.',
        });

        // Calculate partial result (missing Hafalan, Wawancara, Praktik)
        await recalculateApplicantResult(demoIncomplete.id, 75, 7, 3, 0);
      }
    }

    return { success: true, message: 'Data master PPDB Al Ikhlas (5 Kategori, Bank Soal, Jadwal & Rekapitulasi) berhasil disinkronkan.' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Gagal menginisialisasi data' };
  }
}
