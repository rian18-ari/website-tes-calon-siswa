# Security Specification for PPDB Pondok Pesantren Al Ikhlas

## 1. Data Invariants
- A user document in `/users/{userId}` has an immutable UID matching `request.auth.uid`.
- Non-admin users cannot elevate their role to `admin` or `examiner`.
- Calon Peserta (applicants) can only read and mutate their own applicant document and test sessions.
- Applicants cannot read the answer keys (`correctOptionIndex`) from `questionBanks`.
- Examiners can view applicant lists and write evaluations in `examinerAssessments`.
- Final admission decisions in `admissionDecisions` can only be authored and modified by verified Panitia (Admins).

## 2. Dirty Dozen Threat Payloads
1. **Privilege Escalation via User Registration**: Unauthenticated or applicant user sends `{ role: "admin" }` on user creation to hijack system administrator rights.
2. **Ghost Field Injection**: Attacker injects `{ isApproved: true, bypassFee: true }` into an applicant record.
3. **Impersonated Assessment**: A candidate submits an assessment in `examinerAssessments` giving themselves 100/100 points.
4. **Answer Key Scraping**: A candidate attempts a `get` or `list` query on `questionBanks` containing the `correctOptionIndex`.
5. **Cross-Tenant Applicant PII Snooping**: Applicant A attempts `get(/applicants/applicant-B)` to harvest phone numbers and parent data.
6. **Fake Admission Decision**: Applicant sets `decision: "accepted"` in `admissionDecisions` for their own application ID.
7. **Schedule Tampering**: Non-panitia user attempts to delete or update `testSchedules` quotas.
8. **Test Session Score Forgery**: Candidate modifies `testResults` or `testSessions` status directly to `passed`.
9. **Denial-of-Wallet Long ID Attack**: Attacker creates document IDs with 200KB junk strings.
10. **Timestamp Tampering**: Attacker supplies future or back-dated client timestamps for exam start and submission.
11. **Email Spoofing Attack**: Attacker creates an account with admin email without verification to bypass rules.
12. **Orphaned Test Answer**: Attacker writes test answers without a valid corresponding testSession document.
