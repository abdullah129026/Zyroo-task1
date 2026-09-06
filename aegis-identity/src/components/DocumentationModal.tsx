import React, { useState } from 'react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [activeLang, setActiveLang] = useState<'curl' | 'typescript' | 'python' | 'go'>('typescript');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeSnippets: Record<string, string> = {
    typescript: `import { AegisClient } from '@aegis/auth-js';

// Initialize Aegis Client with FIPS 140-3 zero-trust binding
const aegis = new AegisClient({
  realm: 'production-us-east-1',
  clientId: 'aegis_portal_web',
  fipsCompliant: true,
  webAuthn: true,
});

// Orchestrate developer registration with Argon2id root
const session = await aegis.auth.register({
  fullName: 'Elena Rostova',
  workEmail: 'dev@company.io',
  password: 'Aegis#Secure2025!',
  clientMeta: {
    sdk: '@aegis/auth-js@2.4.0',
    deviceFingerprint: await aegis.crypto.fingerprint(),
  },
});

console.log('Session created:', session.userId, session.tokenType);`,

    curl: `curl -X POST https://api.aegis.dev/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -H "X-Aegis-SDK: @aegis/auth-js@2.4.0" \\
  -d '{
    "org_id": "org_default_dev",
    "full_name": "Elena Rostova",
    "work_email": "dev@company.io",
    "password_hash_algo": "argon2id",
    "client_meta": {
      "fips_compliant": true,
      "webauthn_ready": true
    }
  }'`,

    python: `from aegis_identity import AegisClient

client = AegisClient(
    realm="production-us-east-1",
    api_key="aegis_sec_live_..."
)

user = client.auth.create_developer_account(
    full_name="Elena Rostova",
    work_email="dev@company.io",
    password="Aegis#Secure2025!",
    fips_compliant=True
)

print(f"Provisioned developer account: {user.id}")`,

    go: `package main

import (
  "context"
  "fmt"
  "github.com/aegis-identity/aegis-go/v2"
)

func main() {
  client := aegis.NewClient("production-us-east-1")

  user, err := client.Register(context.Background(), &aegis.RegisterRequest{
    FullName:  "Elena Rostova",
    WorkEmail: "dev@company.io",
    Password:  "Aegis#Secure2025!",
  })
  if err != nil {
    panic(err)
  }
  fmt.Printf("Registered user: %s\\n", user.ID)
}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#3525cd] dark:text-indigo-400 text-[24px]">
              menu_book
            </span>
            <div>
              <h3 className="font-headline-sm text-lg font-bold text-slate-900 dark:text-slate-100">
                Aegis Developer Documentation &amp; OpenAPI Spec
              </h3>
              <span className="text-xs text-slate-500">v2.4 Production API Reference</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto pr-1 py-4 space-y-6 flex-1 text-xs sm:text-sm">
          {/* Overview */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Architecture Overview</h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Aegis Identity is built for zero-trust enterprise access with hardware-backed WebAuthn, OAuth 2.1 PKCE, and automated SCIM 2.0 provisioning. All password credentials are hashed client-side or at the gateway edge via Argon2id with continuous breach-corpus validation.
            </p>
          </div>

          {/* Endpoints Table */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Core API Endpoints</h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left font-code-sm text-xs">
                <thead className="bg-[#eff4ff] dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5">Endpoint</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-2.5 font-bold text-indigo-600">POST</td>
                    <td className="p-2.5 text-slate-900 dark:text-slate-100">/v1/auth/register</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">Developer registration</td>
                    <td className="p-2.5 text-emerald-600">201 Created</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-indigo-600">POST</td>
                    <td className="p-2.5 text-slate-900 dark:text-slate-100">/v1/auth/login</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">OAuth 2.1 PKCE Sign In</td>
                    <td className="p-2.5 text-emerald-600">200 OK / 401</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-indigo-600">POST</td>
                    <td className="p-2.5 text-slate-900 dark:text-slate-100">/v1/auth/mfa/verify</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">TOTP &amp; FIDO2 verification</td>
                    <td className="p-2.5 text-emerald-600">200 OK</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-indigo-600">POST</td>
                    <td className="p-2.5 text-slate-900 dark:text-slate-100">/v1/auth/token/refresh</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">Rotating refresh cookie exchange</td>
                    <td className="p-2.5 text-emerald-600">200 OK</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Code SDK Sandbox */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Quickstart SDK Integration</h4>
              <button
                onClick={handleCopy}
                className="text-xs text-[#3525cd] dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex gap-1 bg-[#eff4ff] dark:bg-slate-950 p-1 rounded-xl mb-2 font-code-sm text-xs">
              {(['typescript', 'curl', 'python', 'go'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
                    activeLang === lang
                      ? 'bg-white dark:bg-slate-800 text-[#3525cd] dark:text-indigo-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <pre className="bg-[#eff4ff] dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-4 rounded-xl font-code-sm text-xs overflow-x-auto leading-relaxed border border-slate-200 dark:border-slate-800">
              <code>{codeSnippets[activeLang]}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
