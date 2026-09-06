import React, { useState } from 'react';
import { ActiveScreen, LoginScenario, LoginSpecTab } from '../types';

interface LoginScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenSaml: () => void;
  onOpenForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigate,
  onOpenSaml,
  onOpenForgotPassword,
}) => {
  // Input fields
  const [email, setEmail] = useState('developer@enterprise.com');
  const [password, setPassword] = useState('Aegis#EnterpriseMasterKey2025!');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Validation & Error states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Simulation & Spec Inspector state
  const [simScenario, setSimScenario] = useState<LoginScenario>('default');
  const [activeSpecTab, setActiveSpecTab] = useState<LoginSpecTab>('schema');

  // Switch simulation scenario
  const handleSimChange = (scenario: LoginScenario) => {
    setSimScenario(scenario);
    if (scenario === 'default') {
      setActiveSpecTab('schema');
    } else if (scenario === 'credentials') {
      setActiveSpecTab('res-401');
    } else if (scenario === 'expired') {
      setActiveSpecTab('res-token');
    } else if (scenario === 'locked') {
      setActiveSpecTab('res-401');
    }
  };

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let valid = true;
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid work email address');
      valid = false;
    } else {
      setEmailError(null);
    }

    if (!password || password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      valid = false;
    } else {
      setPasswordError(null);
    }

    if (!valid) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      if (email === 'admin@aegis.dev') {
        setAuthSuccess(true);
        setTimeout(() => setAuthSuccess(false), 3500);
      } else {
        // By default trigger 401 simulation
        setSimScenario('credentials');
        setActiveSpecTab('res-401');
      }
    }, 1100);
  };

  return (
    <div className="w-full">
      {/* Interactive Diagnostic Switcher Strip */}
      <div className="w-full bg-[#eff4ff] dark:bg-slate-900/90 py-2.5 px-4 sm:px-6 lg:px-10 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 mb-8 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#4f46e5] text-white">
            <span className="material-symbols-outlined text-[15px]">tune</span>
          </span>
          <span className="font-label-sm text-xs text-slate-900 dark:text-slate-100 font-bold">
            QA Simulation Mode:
          </span>
          <span className="font-code-sm text-xs text-slate-500 dark:text-slate-400">
            RFC-7235 &amp; OWASP Compliance
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-xs overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => handleSimChange('default')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              simScenario === 'default'
                ? 'bg-[#3525cd] text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Default Ready</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimChange('credentials')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              simScenario === 'credentials'
                ? 'bg-rose-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-rose-500">lock_reset</span>
            <span>Sim: 401 Bad Credentials</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimChange('expired')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              simScenario === 'expired'
                ? 'bg-[#4f46e5] text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-indigo-500">
              history_toggle_off
            </span>
            <span>Sim: 401 Token Expired</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimChange('locked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              simScenario === 'locked'
                ? 'bg-rose-700 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-rose-500">
              hourglass_disabled
            </span>
            <span>Sim: 429 Rate Locked</span>
          </button>
        </div>
      </div>

      {/* Main Workstation Layout: Dual-Pane Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* Left Pane: Authentication Core Surface */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-[480px] bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col relative border border-slate-200/80 dark:border-slate-800">
            {/* Security Shield Watermark / Micro Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e5eeff] dark:bg-slate-800 font-code-sm text-xs text-[#3525cd] dark:text-indigo-400 font-semibold">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>TLS 1.3 Strict-Transport</span>
              </div>
              <span className="font-code-sm text-xs text-slate-500 dark:text-slate-400">
                Auth Realm: production-us-east-1
              </span>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-1 mb-6">
              <h1 className="font-headline-md text-slate-900 dark:text-slate-100 text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Sign in to access your Aegis developer dashboard and API tokens
              </p>
            </div>

            {/* Dynamic Security Banners Container */}
            {simScenario !== 'default' && (
              <div className="flex flex-col gap-2 mb-4 animate-in fade-in duration-200">
                {/* 401 Bad Credentials Banner */}
                {simScenario === 'credentials' && (
                  <div className="p-4 rounded-xl bg-[#ffdad6] dark:bg-rose-950/60 text-[#93000a] dark:text-rose-200 shadow-xs flex items-start gap-3 border border-rose-200 dark:border-rose-900">
                    <span className="material-symbols-outlined text-[20px] text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                      error
                    </span>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="font-label-md text-sm font-bold">
                        Authentication Failure
                      </span>
                      <p className="text-xs leading-relaxed">
                        Invalid email or password. Please verify your credentials and try again.
                      </p>
                      <span className="font-code-sm text-xs text-rose-700 dark:text-rose-300 opacity-90 mt-1 font-medium">
                        HTTP 401 UNAUTHORIZED • Sanitized against account enumeration
                      </span>
                    </div>
                  </div>
                )}

                {/* 401 Session / Token Expired Banner */}
                {simScenario === 'expired' && (
                  <div className="p-4 rounded-xl bg-[#dce9ff] dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs flex items-start gap-3 border border-indigo-200 dark:border-indigo-900">
                    <span className="material-symbols-outlined text-[20px] text-[#3525cd] dark:text-indigo-400 shrink-0 mt-0.5">
                      hourglass_empty
                    </span>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="font-label-md text-sm font-bold">
                        Session Revoked or Expired
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Session expired or invalid authentication token. Please sign in again to continue.
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-code-sm text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-[#3525cd] dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-indigo-900">
                          WWW-Authenticate: Bearer error="invalid_token"
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 429 Account Locked Banner */}
                {simScenario === 'locked' && (
                  <div className="p-4 rounded-xl bg-[#ffdad6] dark:bg-rose-950/60 text-[#93000a] dark:text-rose-200 shadow-xs flex items-start gap-3 border border-rose-200 dark:border-rose-900">
                    <span className="material-symbols-outlined text-[20px] text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                      gpp_bad
                    </span>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="font-label-md text-sm font-bold">
                        Adaptive Brute-Force Lockout
                      </span>
                      <p className="text-xs leading-relaxed">
                        Maximum attempt threshold reached for this source IP subnet. Account access has been throttled for 15 minutes.
                      </p>
                      <span className="font-code-sm text-xs text-rose-700 dark:text-rose-300 mt-1 font-semibold">
                        HTTP 429 TOO MANY REQUESTS • Retry-After: 900s
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth Success Banner */}
            {authSuccess && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-600">
                  check_circle
                </span>
                <span>OAuth 2.0 PKCE Authorization Successful! Routing to Dashboard...</span>
              </div>
            )}

            {/* Enterprise SSO Providers Grid */}
            <div className="flex flex-col gap-2.5 mb-6">
              <div className="grid grid-cols-2 gap-2.5">
                {/* GitHub SSO */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@aegis.dev');
                    setPassword('Aegis#EnterpriseMasterKey2025!');
                  }}
                  className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-[#eff4ff] dark:bg-slate-800 hover:bg-[#e5eeff] dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-label-md text-sm shadow-xs transition-colors"
                >
                  <svg className="w-5 h-5 shrink-0 fill-current text-slate-800 dark:text-slate-200" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"></path>
                  </svg>
                  <span className="font-medium">GitHub</span>
                </button>

                {/* Google SSO */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail('developer@enterprise.com');
                    setPassword('Aegis#EnterpriseMasterKey2025!');
                  }}
                  className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-[#eff4ff] dark:bg-slate-800 hover:bg-[#e5eeff] dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-label-md text-sm shadow-xs transition-colors"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="font-medium">Google</span>
                </button>
              </div>

              {/* Enterprise SAML / Okta SSO Full-Width Button */}
              <button
                type="button"
                onClick={onOpenSaml}
                className="flex items-center justify-between h-11 px-4 rounded-xl bg-[#eff4ff] dark:bg-slate-800 hover:bg-[#e5eeff] dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-label-md text-sm shadow-xs transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#3525cd] dark:text-indigo-400">
                    domain
                  </span>
                  <span className="font-medium">Single Sign-On (SSO / SAML)</span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="w-full h-px bg-slate-200 dark:bg-slate-700"></div>
              <span className="absolute bg-white dark:bg-slate-900 px-3 font-label-sm text-xs text-slate-500 uppercase tracking-wider font-medium">
                or continue with email
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Work Email Field */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between" htmlFor="loginEmail">
                  <span>Work Email address</span>
                  <span className="font-code-sm text-xs text-slate-500">Required</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[20px] pointer-events-none">
                    alternate_email
                  </span>
                  <input
                    id="loginEmail"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(null);
                    }}
                    placeholder="developer@enterprise.com"
                    className={`w-full h-11 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm shadow-xs border transition-all focus:outline-none focus:ring-2 ${
                      emailError
                        ? 'border-rose-400 ring-rose-400/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                    }`}
                  />
                </div>
                {emailError && (
                  <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs mt-1">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200" htmlFor="loginPassword">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={onOpenForgotPassword}
                    className="font-label-sm text-xs text-[#3525cd] dark:text-indigo-400 hover:underline transition-colors font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[20px] pointer-events-none">
                    lock
                  </span>
                  <input
                    id="loginPassword"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Enter your master password"
                    className={`w-full h-11 pl-10 pr-11 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm shadow-xs border transition-all focus:outline-none focus:ring-2 ${
                      passwordError
                        ? 'border-rose-400 ring-rose-400/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors focus:outline-none cursor-pointer z-10 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px] select-none">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {passwordError && (
                  <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs mt-1">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3525cd] focus:ring-[#3525cd] accent-[#3525cd] cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Remember this device for 30 days
                  </span>
                </label>
                <span
                  className="material-symbols-outlined text-slate-400 text-[18px] cursor-help hover:text-slate-600"
                  title="Persistent trusted session token encrypted with AES-GCM"
                >
                  help_outline
                </span>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full h-11 rounded-xl bg-[#3525cd] hover:bg-[#4f46e5] text-white font-label-md text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="font-code-sm text-xs font-medium">Validating via OAuth 2.0 PKCE...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to Aegis</span>
                    <span className="material-symbols-outlined text-[18px]">key</span>
                  </>
                )}
              </button>

              {/* Register link footer */}
              <div className="text-center pt-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Don't have an account?
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="text-sm text-[#3525cd] dark:text-indigo-400 font-semibold ml-1 hover:underline"
                >
                  Register for free
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Pane: API Inspector & HTTP Protocol Specs */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          {/* Aegis Protocol Surface Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3525cd] dark:text-indigo-400 text-[20px]">
                  terminal
                </span>
                <span className="font-headline-sm text-slate-900 dark:text-slate-100 text-base font-semibold">
                  API Protocol Inspector
                </span>
              </div>
              <span className="font-code-sm text-xs px-2 py-0.5 rounded bg-[#e5eeff] dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                v1 OpenAPI Spec
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Live telemetry mapping for Aegis Identity authentication transactions. Standardized error models reject client enumeration.
            </p>

            {/* Spec Tabs Header */}
            <div className="flex items-center gap-1 bg-[#eff4ff] dark:bg-slate-950 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveSpecTab('schema')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-code-sm text-xs text-center transition-all ${
                  activeSpecTab === 'schema'
                    ? 'bg-white dark:bg-slate-800 text-[#3525cd] dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                POST /v1/auth/login
              </button>

              <button
                type="button"
                onClick={() => setActiveSpecTab('res-401')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-code-sm text-xs text-center transition-all ${
                  activeSpecTab === 'res-401'
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                401 Credentials
              </button>

              <button
                type="button"
                onClick={() => setActiveSpecTab('res-token')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-code-sm text-xs text-center transition-all ${
                  activeSpecTab === 'res-token'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                401 Token Expiry
              </button>
            </div>

            {/* Spec Tab 1: POST Schema */}
            {activeSpecTab === 'schema' && (
              <div className="flex flex-col gap-2 animate-in fade-in duration-100">
                <div className="flex items-center justify-between text-xs font-code-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 text-[#3525cd] dark:text-indigo-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#3525cd] dark:bg-indigo-400"></span>
                    Request Payload Contract
                  </span>
                  <span>Content-Type: application/json</span>
                </div>

                <div className="bg-[#eff4ff] dark:bg-slate-950 p-3 rounded-xl font-code-sm text-xs text-slate-900 dark:text-slate-100 overflow-x-auto border border-slate-200/50 dark:border-slate-800">
                  <pre className="leading-relaxed">
                    <code>
                      {JSON.stringify(
                        {
                          grant_type: 'password',
                          client_id: 'aegis_portal_web',
                          email: email || 'developer@enterprise.com',
                          password: showPassword ? password : '••••••••••••',
                          remember_device: rememberDevice,
                          device_fingerprint: 'fp_sha256_9b83a029...',
                          pkce_challenge: 'E9Melhoa2OwvFrGMTJguCH5rtx642C-g96enLDURFL8',
                        },
                        null,
                        2
                      )}
                    </code>
                  </pre>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mt-1">
                  <span className="material-symbols-outlined text-[16px] text-[#3525cd] dark:text-indigo-400">
                    security
                  </span>
                  <span>Payload automatically protected against replay attacks via unique Nonce.</span>
                </div>
              </div>
            )}

            {/* Spec Tab 2: HTTP 401 Generic Failure */}
            {activeSpecTab === 'res-401' && (
              <div className="flex flex-col gap-2 animate-in fade-in duration-100">
                <div className="flex items-center justify-between text-xs font-code-sm">
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    HTTP 401 Unauthorized
                  </span>
                  <span className="text-slate-500 font-code-sm">X-Aegis-Request-ID: req_883a9f</span>
                </div>

                <div className="bg-[#eff4ff] dark:bg-slate-950 p-3 rounded-xl font-code-sm text-xs text-slate-900 dark:text-slate-100 overflow-x-auto border border-slate-200/50 dark:border-slate-800">
                  <pre className="leading-relaxed">
                    <code>
                      {JSON.stringify(
                        {
                          status: 401,
                          error: 'Unauthorized',
                          code: 'INVALID_CREDENTIALS',
                          message: 'Invalid credentials',
                          timestamp: '2025-05-18T10:44:21.092Z',
                          trace_id: 'trc_9901fa49c',
                        },
                        null,
                        2
                      )}
                    </code>
                  </pre>
                </div>

                <div className="p-2.5 rounded-xl bg-[#e5eeff] dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-start gap-2 border border-slate-200/60 dark:border-slate-700">
                  <span className="material-symbols-outlined text-[16px] text-[#3525cd] dark:text-indigo-400 shrink-0 mt-0.5">
                    info
                  </span>
                  <span>
                    <strong>Anti-Enumeration Guard:</strong> Response timing and payload are identical whether the user exists or not, mitigating credential stuffing.
                  </span>
                </div>
              </div>
            )}

            {/* Spec Tab 3: HTTP 401 Token Expired + WWW-Authenticate */}
            {activeSpecTab === 'res-token' && (
              <div className="flex flex-col gap-2 animate-in fade-in duration-100">
                <div className="flex items-center justify-between text-xs font-code-sm">
                  <span className="flex items-center gap-1.5 text-[#3525cd] dark:text-indigo-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#3525cd] dark:bg-indigo-400"></span>
                    RFC-6750 Token Expired (401)
                  </span>
                  <span className="text-slate-500 font-code-sm">Cache-Control: no-store</span>
                </div>

                <div className="bg-[#eff4ff] dark:bg-slate-950 p-3 rounded-xl font-code-sm text-xs text-slate-900 dark:text-slate-100 overflow-x-auto border border-slate-200/50 dark:border-slate-800">
                  <pre className="leading-relaxed">
                    <code>
                      {`// Response Headers
HTTP/2 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_token", 
  error_description="The access token expired"

// Response Body
` +
                        JSON.stringify(
                          {
                            status: 401,
                            code: 'TOKEN_EXPIRED',
                            message: 'The provided Bearer token is missing, expired, or invalid',
                            revoked_at: '2025-05-18T10:42:00Z',
                            token_endpoint: '/v1/auth/token/refresh',
                          },
                          null,
                          2
                        )}
                    </code>
                  </pre>
                </div>

                <div className="p-2.5 rounded-xl bg-[#e5eeff] dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-start gap-2 border border-slate-200/60 dark:border-slate-700">
                  <span className="material-symbols-outlined text-[16px] text-[#3525cd] dark:text-indigo-400 shrink-0 mt-0.5">
                    policy
                  </span>
                  <span>
                    Client SDK must trigger silent refresh using the HTTP-only rotating refresh cookie or redirect here to establish fresh identity session.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Security Posture Miniature Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md p-4 flex items-center justify-between border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e5eeff] dark:bg-slate-800 flex items-center justify-center text-[#3525cd] dark:text-indigo-400">
                <span className="material-symbols-outlined text-[24px]">fingerprint</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Client Device Verification
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Browser WebCrypto API v2 Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-[#eff4ff] dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-[#3525cd] dark:bg-indigo-400 animate-pulse"></span>
              <span className="font-code-sm text-xs font-semibold text-slate-900 dark:text-slate-100">
                Hardware Bound
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
