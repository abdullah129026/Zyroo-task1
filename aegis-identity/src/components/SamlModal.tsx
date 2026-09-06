import React, { useState } from 'react';

interface SamlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SamlModal: React.FC<SamlModalProps> = ({ isOpen, onClose }) => {
  const [ssoDomain, setSsoDomain] = useState('acmecorp.com');
  const [idpProvider, setIdpProvider] = useState<'okta' | 'azure' | 'google' | 'ping'>('okta');
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!isOpen) return null;

  const handleLaunchSaml = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRedirecting(true);
    setTimeout(() => {
      setIsRedirecting(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#3525cd] dark:text-indigo-400 text-[24px]">
              domain
            </span>
            <h3 className="font-headline-sm text-lg font-bold text-slate-900 dark:text-slate-100">
              Enterprise Single Sign-On (SAML 2.0 / OIDC)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleLaunchSaml} className="mt-5 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Enter your corporate domain or IdP slug to orchestrate federated SAML assertion or OIDC authorization code flow.
          </p>

          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 block">
              Identity Provider (IdP)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['okta', 'azure', 'google', 'ping'] as const).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setIdpProvider(prov)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center uppercase tracking-wider font-code-sm ${
                    idpProvider === prov
                      ? 'border-[#3525cd] bg-indigo-50 dark:bg-indigo-950/60 text-[#3525cd] dark:text-indigo-400 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 block">
              Enterprise Corporate Email / Domain
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                alternate_email
              </span>
              <input
                type="text"
                required
                value={ssoDomain}
                onChange={(e) => setSsoDomain(e.target.value)}
                placeholder="company.com"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#eff4ff] dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3525cd]/20"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold block mb-0.5">Automated SCIM 2.0 Provisioning</span>
            Accounts are provisioned just-in-time (JIT) using signed X.509 certificates and SHA-256 digests.
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
              disabled={isRedirecting}
              className="px-5 py-2.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {isRedirecting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  <span>Redirecting to {idpProvider.toUpperCase()} IdP...</span>
                </>
              ) : (
                <>
                  <span>Initiate SAML Flow</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
