import React, { useState } from 'react';
import { ActiveScreen } from '../types';

interface HeaderProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  onOpenDocs: () => void;
  onOpenSecurity: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onOpenDocs,
  onOpenSecurity,
  darkMode,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 w-full px-4 sm:px-6 lg:px-10 flex items-center justify-between">
        {/* Left branding */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={() => onNavigate('register')}
            className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-transform active:scale-95"
            aria-label="Aegis Identity Home"
          >
            <img
              alt="Aegis Auth Logo"
              className="h-8 w-auto object-contain shrink-0"
              src="https://lh3.googleusercontent.com/aida/AEtjO1UyAFXpxS5DwDXIB6O6yySUhaa6b9-mhL4gJDs323aTkuCCDBHmx4bEpHmMx2sZCqaYrtnbbzhEr_hm3v39eGn7TwUIwaHRFyBeJsO0VqrcOAtUgWN0Ec9ZQyLg8fTPRF1UAAFUiFF4x7erZvwc1KWpjbKa0Fk-lReaciDtXJhL2qDl4bHY7T6rTPjnGjVEQTNVzGDQbUIXa42A6nNPzkqGo7hkAEWADJH_TUmp3c1YcGH8LbUeK7czkvI"
            />
            <span className="font-headline-sm text-slate-900 dark:text-slate-100 tracking-tight ml-1 font-semibold">
              Aegis Identity
            </span>
          </button>

          {/* Operational Pill */}
          <div className="hidden xl:flex items-center gap-2 bg-[#eff4ff] dark:bg-slate-800/80 px-2.5 py-1 rounded-full text-[#464555] dark:text-slate-300 font-label-sm text-xs">
            <span className="w-2 h-2 rounded-full bg-[#4f46e5] animate-pulse"></span>
            <span>System operational</span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span className="font-code-sm text-xs font-semibold text-indigo-600 dark:text-indigo-400">99.99%</span>
          </div>

          {/* API Version Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e5eeff] dark:bg-slate-800 text-xs text-[#0b1c30] dark:text-slate-200">
            <span className="material-symbols-outlined text-[15px] text-[#464555] dark:text-slate-400">
              terminal
            </span>
            <span className="font-code-sm text-xs font-medium">Production / v2.4 API</span>
          </div>
        </div>

        {/* Right navigation */}
        <div className="flex items-center gap-2 sm:gap-6">
          <nav className="hidden md:flex items-center gap-5 lg:gap-6">
            <button
              onClick={() => onNavigate('login')}
              className={`transition-colors text-sm font-medium py-1 px-1 relative ${
                currentScreen === 'login'
                  ? 'text-[#3525cd] dark:text-indigo-400 font-semibold'
                  : 'text-[#464555] dark:text-slate-300 hover:text-[#0b1c30] dark:hover:text-white'
              }`}
            >
              Sign In
              {currentScreen === 'login' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3525cd] dark:bg-indigo-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onNavigate('register')}
              className={`transition-colors text-sm font-medium py-1 px-1 relative ${
                currentScreen === 'register'
                  ? 'text-[#3525cd] dark:text-indigo-400 font-semibold'
                  : 'text-[#464555] dark:text-slate-300 hover:text-[#0b1c30] dark:hover:text-white'
              }`}
            >
              Register
              {currentScreen === 'register' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3525cd] dark:bg-indigo-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onNavigate('mfa')}
              className={`transition-colors text-sm font-medium py-1 px-1 relative ${
                currentScreen === 'mfa'
                  ? 'text-[#3525cd] dark:text-indigo-400 font-semibold'
                  : 'text-[#464555] dark:text-slate-300 hover:text-[#0b1c30] dark:hover:text-white'
              }`}
            >
              MFA Verification
              {currentScreen === 'mfa' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3525cd] dark:bg-indigo-400 rounded-full" />
              )}
            </button>

            <button
              onClick={onOpenDocs}
              className="text-[#464555] dark:text-slate-300 text-sm font-medium hover:text-[#0b1c30] dark:hover:text-white transition-colors"
            >
              Documentation
            </button>

            <button
              onClick={onOpenSecurity}
              className="text-[#464555] dark:text-slate-300 text-sm font-medium hover:text-[#0b1c30] dark:hover:text-white transition-colors"
            >
              Security Center
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {/* Screen switcher pill for quick toggle on all screens */}
            <div className="sm:hidden flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => onNavigate('login')}
                className={`px-2 py-1 text-xs font-medium rounded-md ${
                  currentScreen === 'login'
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('register')}
                className={`px-2 py-1 text-xs font-medium rounded-md ${
                  currentScreen === 'register'
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Register
              </button>
            </div>

            {/* Theme toggle */}
            <button
              aria-label="Toggle Theme"
              onClick={onToggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#464555] dark:text-slate-300 hover:bg-[#e5eeff] dark:hover:bg-slate-800 hover:text-[#0b1c30] dark:hover:text-white transition-colors"
              type="button"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {darkMode ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            {/* User Profile Avatar */}
            <button
              onClick={() => onNavigate(currentScreen === 'register' ? 'login' : 'register')}
              title="Aegis Identity Profile"
              className="w-8 h-8 rounded-full bg-[#3525cd] hover:bg-[#4f46e5] transition-colors flex items-center justify-center shadow-xs"
            >
              <span className="material-symbols-outlined text-white text-[18px]">
                person
              </span>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#464555] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle Menu"
            >
              <span className="material-symbols-outlined text-[22px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">API Gateway: v2.4 Spec</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">99.99% Uptime</span>
          </div>
          <button
            onClick={() => {
              onNavigate('login');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              currentScreen === 'login'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-[#3525cd] dark:text-indigo-400 font-semibold'
                : 'text-slate-700 dark:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              onNavigate('register');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              currentScreen === 'register'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-[#3525cd] dark:text-indigo-400 font-semibold'
                : 'text-slate-700 dark:text-slate-200'
            }`}
          >
            Create Developer Account
          </button>
          <button
            onClick={() => {
              onNavigate('mfa');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              currentScreen === 'mfa'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-[#3525cd] dark:text-indigo-400 font-semibold'
                : 'text-slate-700 dark:text-slate-200'
            }`}
          >
            MFA Verification
          </button>
          <button
            onClick={() => {
              onOpenDocs();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Documentation (OpenAPI)
          </button>
          <button
            onClick={() => {
              onOpenSecurity();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Security Center & FIPS Audit
          </button>
        </div>
      )}
    </header>
  );
};
