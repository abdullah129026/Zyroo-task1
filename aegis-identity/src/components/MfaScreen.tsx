import React, { useState, useRef, useEffect } from 'react';
import { ActiveScreen } from '../types';

interface MfaScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
}

export const MfaScreen: React.FC<MfaScreenProps> = ({ onNavigate }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [mfaMethod, setMfaMethod] = useState<'totp' | 'webauthn' | 'recovery'>('totp');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (mfaMethod === 'totp') {
      inputRefs.current[0]?.focus();
    }
  }, [mfaMethod]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setErrorMessage(null);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = () => {
    setIsVerifying(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsVerifying(false);
      const code = otp.join('');
      if (mfaMethod === 'totp' && code === '000000') {
        setErrorMessage('Invalid TOTP token or clock skew exceeds ±30s.');
      } else {
        setVerificationSuccess(true);
        setTimeout(() => setVerificationSuccess(false), 4000);
      }
    }, 1000);
  };

  const simulatePasskey = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationSuccess(true);
      setTimeout(() => setVerificationSuccess(false), 4000);
    }, 1200);
  };

  const mfaRequestPayload = {
    auth_session: 'sess_9921bdf94a02',
    mfa_type: mfaMethod === 'totp' ? 'totp_rfc6238' : mfaMethod === 'webauthn' ? 'fido2_webauthn' : 'emergency_recovery_key',
    token: mfaMethod === 'totp' ? otp.join('') : mfaMethod === 'recovery' ? recoveryCode : 'clientDataJSON_assertion_hash',
    client_context: {
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64)',
      ip_reputation: 'trusted_device',
    },
  };

  return (
    <div className="w-full">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-[#e2dfff] dark:bg-indigo-950/80 text-[#0f0069] dark:text-indigo-300 font-code-sm text-xs font-semibold">
            RFC 6238 &amp; FIDO2
          </span>
          <span className="text-slate-600 dark:text-slate-400 text-xs flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] animate-pulse"></span>
            Hardware Cryptographic Step-Up Authentication
          </span>
        </div>

        <button
          onClick={() => onNavigate('login')}
          className="text-xs text-[#3525cd] dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Sign In</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* Left card: MFA Verification Surface */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-[480px] bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col border border-slate-200/80 dark:border-slate-800">
            {/* Header badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e5eeff] dark:bg-slate-800 font-code-sm text-xs text-[#3525cd] dark:text-indigo-400 font-semibold">
                <span className="material-symbols-outlined text-[16px]">shield</span>
                <span>Two-Factor Authentication</span>
              </div>
              <span className="font-code-sm text-xs text-slate-500">Tier 2 Protection</span>
            </div>

            <h1 className="font-headline-md text-slate-900 dark:text-slate-100 text-2xl sm:text-3xl font-bold tracking-tight">
              MFA Verification
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 mb-6">
              Verify your identity using your authenticator app, FIDO2 passkey, or emergency backup key.
            </p>

            {/* Verification Method Switcher */}
            <div className="flex bg-[#eff4ff] dark:bg-slate-950 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setMfaMethod('totp')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mfaMethod === 'totp'
                    ? 'bg-white dark:bg-slate-800 text-[#3525cd] dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">pin</span>
                <span>Authenticator Code</span>
              </button>

              <button
                type="button"
                onClick={() => setMfaMethod('webauthn')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mfaMethod === 'webauthn'
                    ? 'bg-white dark:bg-slate-800 text-[#3525cd] dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">fingerprint</span>
                <span>FIDO2 Passkey</span>
              </button>

              <button
                type="button"
                onClick={() => setMfaMethod('recovery')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mfaMethod === 'recovery'
                    ? 'bg-white dark:bg-slate-800 text-[#3525cd] dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">key</span>
                <span>Recovery</span>
              </button>
            </div>

            {/* Feedback alert */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {verificationSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Authentication Granted! Cryptographic root session established.</span>
              </div>
            )}

            {/* METHOD 1: 6-Digit OTP */}
            {mfaMethod === 'totp' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    6-Digit Security Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp(['7', '4', '2', '8', '1', '9']);
                    }}
                    className="text-xs text-[#3525cd] dark:text-indigo-400 hover:underline font-medium"
                  >
                    Auto-fill Demo Code
                  </button>
                </div>

                {/* 6-box input */}
                <div className="flex justify-between gap-2" onPaste={handlePaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-11 sm:w-12 h-14 text-center font-code-sm text-2xl font-bold bg-[#eff4ff] dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20 transition-all focus:outline-none"
                    />
                  ))}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Enter the time-based OTP generated by Google Authenticator, 1Password, or YubiKey.
                </p>

                <button
                  type="button"
                  disabled={isVerifying || otp.join('').length < 6}
                  onClick={handleVerify}
                  className="w-full h-11 rounded-xl bg-[#3525cd] hover:bg-[#4f46e5] text-white text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isVerifying ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                      <span>Verifying TOTP Nonce...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Verify &amp; Establish Session</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* METHOD 2: WebAuthn Passkey */}
            {mfaMethod === 'webauthn' && (
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#eff4ff] dark:bg-slate-800 flex items-center justify-center text-[#3525cd] dark:text-indigo-400">
                  <span className="material-symbols-outlined text-[36px]">fingerprint</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    FIDO2 Hardware Key or Touch ID
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    Insert your security key or touch your biometric sensor to complete cryptographic handshake.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={simulatePasskey}
                  disabled={isVerifying}
                  className="w-full h-11 rounded-xl bg-[#3525cd] hover:bg-[#4f46e5] text-white text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                      <span>Requesting WebAuthn Credential...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                      <span>Authenticate with Passkey</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* METHOD 3: Emergency Recovery */}
            {mfaMethod === 'recovery' && (
              <div className="space-y-4">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  16-Character Emergency Recovery Key
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                    key
                  </span>
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                    placeholder="AEGIS-9821-X4K9-77PQ"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#eff4ff] dark:bg-slate-800 font-code-sm text-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[#3525cd]/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setRecoveryCode('AEGIS-9821-X4K9-77PQ')}
                  className="text-xs text-[#3525cd] dark:text-indigo-400 hover:underline font-medium"
                >
                  Insert Sample Backup Key
                </button>

                <button
                  type="button"
                  disabled={isVerifying || recoveryCode.length < 8}
                  onClick={handleVerify}
                  className="w-full h-11 rounded-xl bg-[#3525cd] hover:bg-[#4f46e5] text-white text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {isVerifying ? 'Validating Recovery Token...' : 'Consume Recovery Key'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right card: Telemetry & Protocol Inspector */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3525cd] dark:text-indigo-400 text-[20px]">
                  terminal
                </span>
                <span className="font-headline-sm text-base font-semibold text-slate-900 dark:text-slate-100">
                  MFA Endpoint Protocol
                </span>
              </div>
              <span className="font-code-sm text-xs px-2 py-0.5 rounded bg-[#e5eeff] dark:bg-slate-800 text-[#3525cd] dark:text-indigo-400 font-semibold">
                POST /v1/auth/mfa/verify
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-4 leading-relaxed">
              Step-up MFA challenge validator enforcing constant-time token comparison and single-use nonces.
            </p>

            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
              <button
                onClick={() => setActiveTab('request')}
                className={`font-label-sm text-xs pb-1 font-semibold transition-colors ${
                  activeTab === 'request'
                    ? 'text-[#3525cd] dark:text-indigo-400 border-b-2 border-[#3525cd]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Inbound Payload
              </button>
              <button
                onClick={() => setActiveTab('response')}
                className={`font-label-sm text-xs pb-1 font-semibold transition-colors ${
                  activeTab === 'response'
                    ? 'text-[#3525cd] dark:text-indigo-400 border-b-2 border-[#3525cd]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Resolution Contract
              </button>
            </div>

            {activeTab === 'request' ? (
              <pre className="bg-[#eff4ff] dark:bg-slate-950 p-3 rounded-xl font-code-sm text-xs text-slate-800 dark:text-slate-200 overflow-x-auto leading-relaxed border border-slate-200/50 dark:border-slate-800">
                <code>{JSON.stringify(mfaRequestPayload, null, 2)}</code>
              </pre>
            ) : (
              <pre className="bg-[#eff4ff] dark:bg-slate-950 p-3 rounded-xl font-code-sm text-xs text-slate-800 dark:text-slate-200 overflow-x-auto leading-relaxed border border-slate-200/50 dark:border-slate-800">
                <code>
                  {JSON.stringify(
                    {
                      status: 'authenticated',
                      access_token: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImtleV8wMSJ9...',
                      token_type: 'Bearer',
                      expires_in: 3600,
                      fips_assurance_level: 'AAL3',
                      mfa_verified_at: new Date().toISOString(),
                    },
                    null,
                    2
                  )}
                </code>
              </pre>
            )}

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>RFC 6238 TOTP Window: ±1 step (30s)</span>
              <span className="font-code-sm text-[#3525cd] dark:text-indigo-400 font-semibold">
                FIPS AAL3 Certified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
