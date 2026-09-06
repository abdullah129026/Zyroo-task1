import React from 'react';

interface SecurityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#3525cd] dark:text-indigo-400 text-[24px]">
              verified_user
            </span>
            <div>
              <h3 className="font-headline-sm text-lg font-bold text-slate-900 dark:text-slate-100">
                Aegis Security Center &amp; Cryptographic Attestation
              </h3>
              <span className="text-xs text-slate-500">Live Hardware Security Module (HSM) Posture</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto pr-1 py-4 space-y-4 flex-1 text-xs sm:text-sm">
          {/* Status grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#eff4ff] dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
              <span className="text-xs text-slate-500 block">FIPS Compliance</span>
              <span className="font-code-sm text-sm font-bold text-[#3525cd] dark:text-indigo-400">
                140-3 Level 3
              </span>
              <span className="text-[11px] text-emerald-600 block mt-1">Validated Vault</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#eff4ff] dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
              <span className="text-xs text-slate-500 block">Hash Derivation</span>
              <span className="font-code-sm text-sm font-bold text-[#3525cd] dark:text-indigo-400">
                Argon2id (m=64MB)
              </span>
              <span className="text-[11px] text-emerald-600 block mt-1">t=3, p=4 parameters</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#eff4ff] dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
              <span className="text-xs text-slate-500 block">Session Transport</span>
              <span className="font-code-sm text-sm font-bold text-[#3525cd] dark:text-indigo-400">
                TLS 1.3 (0-RTT off)
              </span>
              <span className="text-[11px] text-emerald-600 block mt-1">P-384 ECDSA Certs</span>
            </div>
          </div>

          {/* Security Features */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">lock</span>
                Zero-Trust Device Session Binding
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tokens are cryptographically bound to client WebCrypto key pairs stored in hardware Secure Enclaves or TPM chips. Tokens exported from one browser context cannot be executed by adversaries.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">verified</span>
                14B+ Breach Corpus Zero-Day Shield
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Passphrases undergo constant-time k-Anonymity evaluation against live dark-web leak corpora. Any compromised credential is preemptively flagged with zero plaintext exposure.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">shield</span>
                Adaptive Rate-Limiting &amp; Anti-Enumeration
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                OWASP compliant authentication responses maintain uniform clock time whether an account exists or not, rendering timing attacks and email harvesting impossible.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            Close Security Center
          </button>
        </div>
      </div>
    </div>
  );
};
