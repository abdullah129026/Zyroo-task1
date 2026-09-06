import React, { useState } from 'react';

export const Footer: React.FC = () => {
  const [modalContent, setModalContent] = useState<{ title: string; body: string } | null>(null);

  const openComplianceModal = (title: string, body: string) => {
    setModalContent({ title, body });
  };

  return (
    <>
      <footer className="w-full bg-[#eff4ff] dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-4 relative z-10">
        <div className="w-full px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Security Badges */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-[#464555] dark:text-slate-400 font-label-sm text-xs">
            <button
              onClick={() =>
                openComplianceModal(
                  'SOC2 Type II Attestation',
                  'Aegis Identity undergoes continuous annual independent audits performed by AICPA-accredited auditors covering Security, Availability, and Confidentiality trust service criteria.'
                )
              }
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg shadow-xs hover:border-indigo-400 border border-transparent transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-[#3525cd] dark:text-indigo-400">
                verified_user
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">SOC2 Type II</span>
            </button>

            <button
              onClick={() =>
                openComplianceModal(
                  'ISO/IEC 27001:2022 Certification',
                  'Our Information Security Management System (ISMS) operates under rigorous cryptographic key life-cycles, tenant zero-isolation, and physical security standards.'
                )
              }
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg shadow-xs hover:border-indigo-400 border border-transparent transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-[#3525cd] dark:text-indigo-400">
                shield
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">ISO 27001</span>
            </button>

            <button
              onClick={() =>
                openComplianceModal(
                  'GDPR & CCPA Privacy Compliance',
                  'All telemetry, credential hashes, and user logs are encrypted with sovereign data residency boundaries and right-to-erasure API endpoints.'
                )
              }
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg shadow-xs hover:border-indigo-400 border border-transparent transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-[#3525cd] dark:text-indigo-400">
                policy
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">GDPR Compliant</span>
            </button>

            <button
              onClick={() =>
                openComplianceModal(
                  '256-bit AES-GCM Key Vault',
                  'Root passwords, token signatures, and device biometric hashes are derived via Argon2id and encrypted at rest with hardware HSM-backed 256-bit AES-GCM keys.'
                )
              }
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg shadow-xs hover:border-indigo-400 border border-transparent transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-[#3525cd] dark:text-indigo-400">
                lock
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">256-bit AES</span>
            </button>
          </div>

          {/* Legal and links */}
          <div className="flex items-center gap-4 text-[#464555] dark:text-slate-400 text-xs">
            <span>© 2025 Aegis Cloud Identity, Inc.</span>
            <button
              onClick={() =>
                openComplianceModal(
                  'Privacy Shield Policy',
                  'Aegis Identity does not sell or distribute credential payloads. Zero-knowledge authentication ensures developer keys cannot be accessed by staff.'
                )
              }
              className="hover:text-slate-900 dark:hover:text-white transition-colors underline-offset-2 hover:underline"
            >
              Privacy
            </button>
            <button
              onClick={() =>
                openComplianceModal(
                  'Developer Terms of Service',
                  'Developers receive 10,000 MAUs free tier under standard SLA guarantees with 99.99% multi-region uptime and RFC 5322 compliance.'
                )
              }
              className="hover:text-slate-900 dark:hover:text-white transition-colors underline-offset-2 hover:underline"
            >
              Terms
            </button>
            <button
              onClick={() =>
                openComplianceModal(
                  'Trust & Real-time Compliance Status',
                  'Real-time system health, cryptographic cipher suites, and third-party penetration test attestations are updated hourly.'
                )
              }
              className="hover:text-slate-900 dark:hover:text-white transition-colors underline-offset-2 hover:underline"
            >
              Trust &amp; Compliance
            </button>
          </div>
        </div>
      </footer>

      {/* Compliance info dialog */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-[22px]">
                  verified
                </span>
                <h3 className="font-headline-sm text-base font-semibold text-slate-900 dark:text-slate-100">
                  {modalContent.title}
                </h3>
              </div>
              <button
                onClick={() => setModalContent(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {modalContent.body}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalContent(null)}
                className="px-4 py-2 bg-[#3525cd] text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
