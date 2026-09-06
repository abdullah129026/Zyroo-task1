import React, { useState } from 'react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [resetEmail, setResetEmail] = useState('developer@enterprise.com');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSendReset = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 2500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#3525cd] dark:text-indigo-400 text-[22px]">
              lock_reset
            </span>
            <h3 className="font-headline-sm text-base font-bold text-slate-900 dark:text-slate-100">
              Reset Master Passphrase
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Cryptographic Recovery Dispatched
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              An ephemeral signed reset invitation token has been dispatched to <strong>{resetEmail}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendReset} className="mt-4 space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enter the corporate email address associated with your developer identity. We will issue a zero-knowledge password reset token valid for 15 minutes.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 block">
                Work Email Address
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="developer@enterprise.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#eff4ff] dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3525cd]/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-2.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                    <span>Dispatching Token...</span>
                  </>
                ) : (
                  <span>Send Recovery Token</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
