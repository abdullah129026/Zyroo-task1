import React, { useState, useEffect } from 'react';
import { ActiveScreen, RegisterScenario, RegisterApiTab, PasswordEntropy } from '../types';

interface RegisterScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenSaml: () => void;
  onOpenDocs: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigate,
  onOpenSaml,
  onOpenDocs,
}) => {
  // Form State
  const [fullName, setFullName] = useState('Elena Rostova');
  const [workEmail, setWorkEmail] = useState('dev@company.io');
  const [password, setPassword] = useState('Aegis#Secure2025!');
  const [confirmPassword, setConfirmPassword] = useState('Aegis#Secure2025!');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Field UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Sandbox & API Contract state
  const [currentScenario, setCurrentScenario] = useState<RegisterScenario>('valid');
  const [activeApiTab, setActiveApiTab] = useState<RegisterApiTab>('req');

  // Password Entropy Calculation
  const calculateEntropy = (pw: string): PasswordEntropy => {
    const hasLength = pw.length >= 8;
    const hasUpper = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);

    let score = 0;
    if (hasLength) score++;
    if (hasUpper) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    let label = 'Unchecked';
    if (pw.length === 0) {
      label = 'Unchecked';
    } else if (score === 1) {
      label = 'Weak (Entropy < 24 bits)';
    } else if (score === 2) {
      label = 'Fair (Acceptable)';
    } else if (score === 3) {
      label = 'Good (High Entropy)';
    } else if (score === 4) {
      label = 'High Assurance (Optimal)';
    }

    return { hasLength, hasUpper, hasNumber, hasSpecial, score, label };
  };

  const entropy = calculateEntropy(password);

  // Confirm password match evaluation
  const getMatchStatus = () => {
    if (!confirmPassword) return { text: 'Awaiting input', class: 'text-slate-500 dark:text-slate-400' };
    if (password === confirmPassword) {
      return { text: 'Passphrases match', class: 'text-indigo-600 dark:text-indigo-400 font-semibold' };
    }
    return { text: 'Passphrases do not match', class: 'text-rose-600 dark:text-rose-400 font-semibold' };
  };

  const matchStatus = getMatchStatus();

  // Email validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail);

  // Scenario switch handler
  const handleScenarioChange = (scenario: RegisterScenario) => {
    setCurrentScenario(scenario);

    if (scenario === 'valid') {
      setShowConflictAlert(false);
      setWorkEmail('dev@company.io');
      setPassword('Aegis#Secure2025!');
      setConfirmPassword('Aegis#Secure2025!');
    } else if (scenario === 'conflict') {
      setShowConflictAlert(true);
      setWorkEmail('dev@company.io');
      setActiveApiTab('res');
    } else if (scenario === 'bad_request') {
      setShowConflictAlert(false);
      setPassword('abc');
      setConfirmPassword('abc');
      setActiveApiTab('res');
    } else if (scenario === 'mismatch') {
      setShowConflictAlert(false);
      setPassword('Aegis#Secure2025!');
      setConfirmPassword('Aegis#Mismatch999!');
      setActiveApiTab('res');
    }
  };

  const handleToggleConflict = () => {
    const next = !showConflictAlert;
    setShowConflictAlert(next);
    if (next) {
      setCurrentScenario('conflict');
      setActiveApiTab('res');
    } else {
      setCurrentScenario('valid');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (workEmail === 'dev@company.io' && currentScenario === 'conflict') {
      setShowConflictAlert(true);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    }, 1100);
  };

  // Synchronized dynamic Request payload
  const requestPayloadJson = {
    org_id: 'org_default_dev',
    full_name: fullName || 'Elena Rostova',
    work_email: workEmail || 'dev@company.io',
    password_hash_algo: 'argon2id',
    client_meta: {
      sdk: '@aegis/auth-js@2.4.0',
      fips_compliant: true,
      webauthn_ready: true,
      entropy_bits: entropy.score * 28,
    },
  };

  // Synchronized dynamic API Response payload
  const getResponsePayload = () => {
    if (currentScenario === 'valid') {
      return {
        status: 'success',
        user_id: 'usr_94bdf341a029',
        email: workEmail,
        verification_required: true,
        flow: 'mfa_enrollment_pending',
        token_type: 'Bearer',
        expires_in: 3600,
        zero_trust_binding: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      };
    }
    if (currentScenario === 'conflict') {
      return {
        status: 'error',
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'The email address is already registered in this realm',
        target_field: 'work_email',
        resolution: 'Sign in or initiate recovery reset flow',
        existing_account_id: 'usr_81a18c02',
      };
    }
    if (currentScenario === 'bad_request') {
      return {
        status: 'error',
        code: 'VALIDATION_FAILED',
        errors: [
          {
            field: 'password',
            rule: 'min_length_8',
            message: 'Password length must be greater than or equal to 8 characters.',
          },
          {
            field: 'password',
            rule: 'entropy_minimum',
            message: 'Entropy must meet high assurance threshold (minimum 3 criteria met).',
          },
        ],
      };
    }
    return {
      status: 'error',
      code: 'PASSWORD_CONFIRMATION_MISMATCH',
      message: 'confirm_password does not equal password input',
    };
  };

  const getResponseStatusText = () => {
    if (currentScenario === 'valid') return { label: 'HTTP 201 Created', color: 'text-indigo-600 dark:text-indigo-400' };
    if (currentScenario === 'conflict') return { label: 'HTTP 409 Conflict', color: 'text-rose-600 dark:text-rose-400' };
    if (currentScenario === 'bad_request') return { label: 'HTTP 400 Bad Request', color: 'text-rose-600 dark:text-rose-400' };
    return { label: 'HTTP 422 Unprocessable', color: 'text-amber-600 dark:text-amber-400' };
  };

  const responseStatus = getResponseStatusText();

  return (
    <div className="w-full">
      {/* Top Meta Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-[#e2dfff] dark:bg-indigo-950/80 text-[#0f0069] dark:text-indigo-300 font-code-sm text-xs font-semibold">
            v2.4 API Spec
          </span>
          <span className="text-[#464555] dark:text-slate-400 text-xs flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] animate-pulse"></span>
            FIPS 140-3 Validated Cryptography Ready
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-[#464555] dark:text-slate-400 font-label-sm text-xs">
            <span className="material-symbols-outlined text-[18px] text-[#3525cd] dark:text-indigo-400">
              security_update_good
            </span>
            <span>Zero-trust Session Binding</span>
          </div>

          <button
            onClick={onOpenSaml}
            className="text-[#3525cd] dark:text-indigo-400 font-body-md-medium text-sm hover:underline inline-flex items-center gap-1 group font-semibold"
          >
            <span>Enterprise SAML</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      </div>

      {/* Main Dual-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: Registration Card */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden border border-slate-200/80 dark:border-slate-800">
            {/* Decorative Top Glow Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3525cd] via-[#4f46e5] to-[#dae2fd]"></div>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eff4ff] dark:bg-slate-800 text-[#3525cd] dark:text-indigo-400 font-label-sm text-xs mb-2 font-semibold">
                <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                <span>Developer Free Tier: 10,000 MAUs</span>
              </div>
              <h1 className="font-headline-lg text-slate-900 dark:text-slate-100 tracking-tight text-2xl sm:text-3xl font-bold">
                Create your developer account
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 leading-relaxed">
                Start orchestrating OAuth 2.1, Passkeys, and MFA with zero cold-starts and pre-audited compliance tokens.
              </p>
            </div>

            {/* SSO Providers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  setFullName('Octocat Developer');
                  setWorkEmail('octocat@github.com');
                  setCurrentScenario('valid');
                }}
                className="h-11 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] group"
              >
                <svg className="w-5 h-5 fill-current text-slate-800 dark:text-slate-200" viewBox="0 0 24 24">
                  <path
                    clipRule="evenodd"
                    d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                    fillRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Continue with GitHub
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFullName('Alex Chen');
                  setWorkEmail('alex.chen@googlemail.com');
                  setCurrentScenario('valid');
                }}
                className="h-11 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] group"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.27-2.09 3.675-5.17 3.675-9.15z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.61H1.25C.45 8.23 0 10.06 0 12s.45 3.77 1.25 5.39l4.02-3.15z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Continue with Google
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="w-full h-px bg-slate-200 dark:bg-slate-700"></div>
              <span className="bg-white dark:bg-slate-900 px-3 font-label-sm text-xs text-slate-500 uppercase tracking-wider relative z-10 font-medium">
                or register with work email
              </span>
            </div>

            {/* Interactive Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Conflict Alert Banner (HTTP 409 Conflict) */}
              {showConflictAlert && (
                <div className="rounded-xl bg-[#ffdad6] dark:bg-rose-950/60 p-4 transition-all duration-200 shadow-xs border border-rose-200 dark:border-rose-900 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#ba1a1a] dark:text-rose-400 text-[22px] shrink-0 mt-0.5">
                      error
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <h4 className="font-label-md text-sm text-[#93000a] dark:text-rose-200 font-bold">
                          Account Already Exists (HTTP 409 Conflict)
                        </h4>
                        <span className="font-code-sm text-xs bg-rose-500/15 text-[#93000a] dark:text-rose-300 px-1.5 py-0.5 rounded font-semibold">
                          EMAIL_ALREADY_EXISTS
                        </span>
                      </div>
                      <p className="text-xs text-[#93000a] dark:text-rose-200 mt-1">
                        An account with <strong>{workEmail || 'dev@company.io'}</strong> already exists in Aegis Identity.
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          type="button"
                          onClick={() => onNavigate('login')}
                          className="text-xs text-[#3525cd] dark:text-indigo-400 font-bold hover:underline"
                        >
                          Sign in instead →
                        </button>
                        <button
                          type="button"
                          onClick={() => alert(`Password recovery link dispatched to ${workEmail}`)}
                          className="text-xs text-slate-600 dark:text-slate-300 hover:underline"
                        >
                          Reset password
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConflictAlert(false)}
                          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-auto"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200" htmlFor="full-name">
                    Full Name
                  </label>
                  <span className="text-xs text-slate-500">Required</span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[18px] text-slate-400 pointer-events-none">
                    badge
                  </span>
                  <input
                    id="full-name"
                    name="full_name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Elena Rostova"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#eff4ff] dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm border border-transparent focus:border-indigo-400 shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200" htmlFor="work-email">
                    Work Email
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleConflict}
                    className="font-code-sm text-xs text-[#3525cd] dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span className="material-symbols-outlined text-[14px]">toggle_on</span>
                    <span>Toggle 409 Conflict</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[18px] text-slate-400 pointer-events-none">
                    mail
                  </span>
                  <input
                    id="work-email"
                    name="work_email"
                    type="email"
                    required
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    placeholder="dev@company.io"
                    className="w-full h-11 pl-10 pr-28 rounded-xl bg-[#eff4ff] dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm border border-transparent focus:border-indigo-400 shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
                  />
                  <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        isEmailValid
                          ? 'text-[#3525cd] dark:text-indigo-400'
                          : 'text-[#ba1a1a] dark:text-rose-400'
                      }`}
                    >
                      {isEmailValid ? 'check_circle' : 'cancel'}
                    </span>
                    <span
                      className={`font-code-sm text-xs font-medium ${
                        isEmailValid
                          ? 'text-[#3525cd] dark:text-indigo-400'
                          : 'text-[#ba1a1a] dark:text-rose-400'
                      }`}
                    >
                      RFC 5322
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    We issue ephemeral zero-knowledge access invitations.
                  </p>
                  <span
                    className={`font-code-sm text-xs font-semibold ${
                      isEmailValid
                        ? 'text-[#3525cd] dark:text-indigo-400'
                        : 'text-[#ba1a1a] dark:text-rose-400'
                    }`}
                  >
                    {isEmailValid ? 'Valid syntax' : 'Invalid email structure'}
                  </span>
                </div>
              </div>

              {/* Master Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200" htmlFor="password">
                    Master Password
                  </label>
                  <span className="text-xs text-slate-500">Min. 8 chars &amp; entropy rules</span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[18px] text-slate-400 pointer-events-none">
                    key
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-11 rounded-xl bg-[#eff4ff] dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm border border-transparent focus:border-indigo-400 shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* 4-Stage Strength Bar */}
                <div className="mt-2 space-y-1.5">
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    <div
                      className={`rounded-full transition-colors duration-200 ${
                        entropy.score >= 1
                          ? entropy.score === 1
                            ? 'bg-rose-500'
                            : entropy.score === 2
                            ? 'bg-amber-500'
                            : entropy.score === 3
                            ? 'bg-indigo-500'
                            : 'bg-[#3525cd] dark:bg-indigo-400'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                    <div
                      className={`rounded-full transition-colors duration-200 ${
                        entropy.score >= 2
                          ? entropy.score === 2
                            ? 'bg-amber-500'
                            : entropy.score === 3
                            ? 'bg-indigo-500'
                            : 'bg-[#3525cd] dark:bg-indigo-400'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                    <div
                      className={`rounded-full transition-colors duration-200 ${
                        entropy.score >= 3
                          ? entropy.score === 3
                            ? 'bg-indigo-500'
                            : 'bg-[#3525cd] dark:bg-indigo-400'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                    <div
                      className={`rounded-full transition-colors duration-200 ${
                        entropy.score === 4
                          ? 'bg-[#3525cd] dark:bg-indigo-400'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Strength rating:</span>
                    <span
                      className={`font-code-sm font-semibold ${
                        entropy.score === 4
                          ? 'text-[#3525cd] dark:text-indigo-400'
                          : entropy.score === 3
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : entropy.score === 2
                          ? 'text-amber-600 dark:text-amber-400'
                          : entropy.score === 1
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {entropy.label}
                    </span>
                  </div>
                </div>

                {/* Live Criteria Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2">
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      entropy.hasLength
                        ? 'bg-[#dae2fd] dark:bg-indigo-950 text-[#131b2e] dark:text-indigo-200 font-medium'
                        : 'bg-[#eff4ff] dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[14px] ${
                        entropy.hasLength ? 'text-[#3525cd] dark:text-indigo-400 font-bold' : ''
                      }`}
                    >
                      {entropy.hasLength ? 'check_circle' : 'circle'}
                    </span>
                    <span>8+ chars</span>
                  </div>

                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      entropy.hasUpper
                        ? 'bg-[#dae2fd] dark:bg-indigo-950 text-[#131b2e] dark:text-indigo-200 font-medium'
                        : 'bg-[#eff4ff] dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[14px] ${
                        entropy.hasUpper ? 'text-[#3525cd] dark:text-indigo-400 font-bold' : ''
                      }`}
                    >
                      {entropy.hasUpper ? 'check_circle' : 'circle'}
                    </span>
                    <span>Uppercase</span>
                  </div>

                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      entropy.hasNumber
                        ? 'bg-[#dae2fd] dark:bg-indigo-950 text-[#131b2e] dark:text-indigo-200 font-medium'
                        : 'bg-[#eff4ff] dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[14px] ${
                        entropy.hasNumber ? 'text-[#3525cd] dark:text-indigo-400 font-bold' : ''
                      }`}
                    >
                      {entropy.hasNumber ? 'check_circle' : 'circle'}
                    </span>
                    <span>1+ Number</span>
                  </div>

                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      entropy.hasSpecial
                        ? 'bg-[#dae2fd] dark:bg-indigo-950 text-[#131b2e] dark:text-indigo-200 font-medium'
                        : 'bg-[#eff4ff] dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[14px] ${
                        entropy.hasSpecial ? 'text-[#3525cd] dark:text-indigo-400 font-bold' : ''
                      }`}
                    >
                      {entropy.hasSpecial ? 'check_circle' : 'circle'}
                    </span>
                    <span>Special char</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <span className={`font-code-sm text-xs ${matchStatus.class}`}>
                    {matchStatus.text}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[18px] text-slate-400 pointer-events-none">
                    lock
                  </span>
                  <input
                    id="confirm-password"
                    name="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-11 rounded-xl bg-[#eff4ff] dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm border border-transparent focus:border-indigo-400 shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
                  />
                  <button
                    type="button"
                    aria-label="Toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Terms & Consent Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#3525cd] focus:ring-[#3525cd] cursor-pointer accent-[#3525cd]"
                />
                <label className="text-xs text-slate-600 dark:text-slate-400 leading-snug cursor-pointer" htmlFor="terms">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={onOpenDocs}
                    className="text-[#3525cd] dark:text-indigo-400 hover:underline font-medium"
                  >
                    Terms of Service
                  </button>
                  ,{' '}
                  <button
                    type="button"
                    onClick={onOpenDocs}
                    className="text-[#3525cd] dark:text-indigo-400 hover:underline font-medium"
                  >
                    Privacy Shield Policy
                  </button>
                  , and consent to receive cryptographic signing root telemetry.
                </label>
              </div>

              {/* Primary Submit CTA */}
              <div className="pt-2">
                <button
                  id="submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full h-12 rounded-xl text-white font-label-md text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] ${
                    submitSuccess
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-[#3525cd] hover:bg-[#4f46e5]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">
                        sync
                      </span>
                      <span>Initializing Cryptographic Root...</span>
                    </>
                  ) : submitSuccess ? (
                    <>
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span>Account Provisioned • Verification Sent</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                      <span>Create Aegis Developer Account</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sign in redirect */}
              <div className="text-center pt-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Already registered with Aegis?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-[#3525cd] dark:text-indigo-400 font-semibold hover:underline ml-1"
                  >
                    Sign In →
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Sandbox & API Contract Inspector */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Live Testing Matrix Pill Bar */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-lg p-5 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3525cd] dark:text-indigo-400 text-[20px]">
                  science
                </span>
                <h3 className="font-headline-sm text-slate-900 dark:text-slate-100 text-base font-semibold">
                  Interactive Sandbox
                </h3>
              </div>
              <span className="font-code-sm text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                Client Harness
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Trigger deterministic mock API scenarios to inspect real-time component states, schema validations, and HTTP conflict payloads.
            </p>

            {/* 4 Deterministic Scenario Pills */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleScenarioChange('valid')}
                className={`px-3 py-2 rounded-xl font-code-sm text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                  currentScenario === 'valid'
                    ? 'bg-[#3525cd] text-white shadow-md'
                    : 'bg-[#eff4ff] dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>201 Created</span>
              </button>

              <button
                type="button"
                onClick={() => handleScenarioChange('conflict')}
                className={`px-3 py-2 rounded-xl font-code-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  currentScenario === 'conflict'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-[#eff4ff] dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-rose-500">report_problem</span>
                <span>409 Conflict</span>
              </button>

              <button
                type="button"
                onClick={() => handleScenarioChange('bad_request')}
                className={`px-3 py-2 rounded-xl font-code-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  currentScenario === 'bad_request'
                    ? 'bg-indigo-700 text-white shadow-md'
                    : 'bg-[#eff4ff] dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-indigo-500">rule</span>
                <span>400 Password &lt; 8</span>
              </button>

              <button
                type="button"
                onClick={() => handleScenarioChange('mismatch')}
                className={`px-3 py-2 rounded-xl font-code-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  currentScenario === 'mismatch'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-[#eff4ff] dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-amber-500">sync_problem</span>
                <span>PW Mismatch</span>
              </button>
            </div>
          </div>

          {/* REST API Contract Preview Card */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-lg p-5 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#4f46e5] text-white font-code-sm text-xs font-bold">
                  POST
                </span>
                <span className="font-code-sm text-xs text-slate-900 dark:text-slate-100 font-semibold">
                  /v1/auth/register
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3525cd] dark:bg-indigo-400 animate-pulse"></span>
                <span className={`font-code-sm text-xs font-bold ${responseStatus.color}`}>
                  {responseStatus.label}
                </span>
              </div>
            </div>

            {/* Tabs for Payload & Response */}
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
              <button
                onClick={() => setActiveApiTab('req')}
                className={`font-label-sm text-xs pb-1 transition-colors relative font-semibold ${
                  activeApiTab === 'req'
                    ? 'text-[#3525cd] dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Request Payload
                {activeApiTab === 'req' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3525cd] dark:bg-indigo-400 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveApiTab('res')}
                className={`font-label-sm text-xs pb-1 transition-colors relative font-semibold ${
                  activeApiTab === 'res'
                    ? 'text-[#3525cd] dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                API Response
                {activeApiTab === 'res' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3525cd] dark:bg-indigo-400 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveApiTab('matrix')}
                className={`font-label-sm text-xs pb-1 transition-colors relative font-semibold ${
                  activeApiTab === 'matrix'
                    ? 'text-[#3525cd] dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Validation Matrix
                {activeApiTab === 'matrix' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3525cd] dark:bg-indigo-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Tab 1: Request Payload */}
            {activeApiTab === 'req' && (
              <div className="animate-in fade-in duration-100">
                <pre className="bg-[#eff4ff] dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-3 rounded-xl font-code-sm text-xs overflow-x-auto leading-relaxed border border-slate-200/50 dark:border-slate-800">
                  <code>{JSON.stringify(requestPayloadJson, null, 2)}</code>
                </pre>
              </div>
            )}

            {/* Tab 2: API Response */}
            {activeApiTab === 'res' && (
              <div className="animate-in fade-in duration-100">
                <pre className="bg-[#eff4ff] dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-3 rounded-xl font-code-sm text-xs overflow-x-auto leading-relaxed border border-slate-200/50 dark:border-slate-800">
                  <code>{JSON.stringify(getResponsePayload(), null, 2)}</code>
                </pre>
              </div>
            )}

            {/* Tab 3: Validation Matrix */}
            {activeApiTab === 'matrix' && (
              <div className="space-y-2 animate-in fade-in duration-100">
                <div className="p-2.5 rounded-xl bg-[#eff4ff] dark:bg-slate-800 flex items-center justify-between text-xs">
                  <span className="font-code-sm text-slate-900 dark:text-slate-100 font-semibold">full_name</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-code-sm">
                    required, 2-100 chars
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#eff4ff] dark:bg-slate-800 flex items-center justify-between text-xs">
                  <span className="font-code-sm text-slate-900 dark:text-slate-100 font-semibold">work_email</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-code-sm">
                    RFC 5322, unique index
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#eff4ff] dark:bg-slate-800 flex items-center justify-between text-xs">
                  <span className="font-code-sm text-slate-900 dark:text-slate-100 font-semibold">password</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-code-sm">
                    &gt;= 8 chars, 1 upper, 1 num, 1 spec
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#eff4ff] dark:bg-slate-800 flex items-center justify-between text-xs">
                  <span className="font-code-sm text-slate-900 dark:text-slate-100 font-semibold">terms</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-code-sm">
                    boolean, truthy strictly required
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Card Footer */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                <span className="material-symbols-outlined text-[16px] text-[#3525cd] dark:text-indigo-400">
                  enhanced_encryption
                </span>
                <span className="font-medium">Argon2id + AES-GCM Root</span>
              </div>
              <button
                type="button"
                onClick={onOpenDocs}
                className="font-label-sm text-xs text-[#3525cd] dark:text-indigo-400 hover:underline font-semibold"
              >
                Full Schema Specs →
              </button>
            </div>
          </div>

          {/* Trust & Security Bento Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-md border border-slate-200/80 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-[#e5eeff] dark:bg-slate-800 flex items-center justify-center mb-2 text-[#3525cd] dark:text-indigo-400">
                <span className="material-symbols-outlined text-[20px]">badge</span>
              </div>
              <h4 className="font-label-md text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-semibold">
                WebAuthn &amp; Passkeys
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Add biometric sign-in instantly via the Aegis FIDO2 certified WebAuthn orchestrator.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-md border border-slate-200/80 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-[#e5eeff] dark:bg-slate-800 flex items-center justify-center mb-2 text-[#3525cd] dark:text-indigo-400">
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </div>
              <h4 className="font-label-md text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-semibold">
                Directory Sync
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Automated SCIM 2.0 provisioning for Okta, Azure AD, and Google Workspace integrations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Continuous Zero-Day Protection Shield Banner */}
      <div className="mt-8 p-4 rounded-2xl bg-[#eff4ff]/80 dark:bg-slate-900/80 shadow-xs border border-slate-200/70 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3525cd] dark:bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[22px]">verified</span>
          </div>
          <div>
            <h4 className="font-label-md text-sm text-slate-900 dark:text-slate-100 font-semibold">
              Continuous Zero-Day Protection Shield
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Automated breach corpus screening matches prospective passwords against 14B+ compromised credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-code-sm text-xs text-slate-500">Status:</span>
          <span className="inline-flex items-center gap-1.5 font-code-sm text-xs text-[#3525cd] dark:text-indigo-400 font-bold bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#4f46e5] animate-pulse"></span>
            ENCRYPTED ENGINE v2.4
          </span>
        </div>
      </div>
    </div>
  );
};
