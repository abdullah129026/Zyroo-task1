import React, { useState, useEffect } from 'react';
import { ActiveScreen } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RegisterScreen } from './components/RegisterScreen';
import { LoginScreen } from './components/LoginScreen';
import { MfaScreen } from './components/MfaScreen';
import { SamlModal } from './components/SamlModal';
import { DocumentationModal } from './components/DocumentationModal';
import { SecurityCenterModal } from './components/SecurityCenterModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('register');
  const [darkMode, setDarkMode] = useState(false);

  // Modals state
  const [isSamlOpen, setIsSamlOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="bg-[#f8f9ff] dark:bg-slate-950 font-body-md text-[#0b1c30] dark:text-slate-100 min-h-screen flex flex-col relative transition-colors duration-200">
      {/* Fixed Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="w-full pt-16 flex-1 relative overflow-hidden flex flex-col justify-start">
        {/* Ambient Radial Gradients from spec */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.08),transparent_70%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.04),transparent_60%)] pointer-events-none"></div>

        {/* Screen Content Wrapper */}
        <div className="relative z-10 w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto w-full">
            {currentScreen === 'register' && (
              <RegisterScreen
                onNavigate={(s) => setCurrentScreen(s)}
                onOpenSaml={() => setIsSamlOpen(true)}
                onOpenDocs={() => setIsDocsOpen(true)}
              />
            )}

            {currentScreen === 'login' && (
              <LoginScreen
                onNavigate={(s) => setCurrentScreen(s)}
                onOpenSaml={() => setIsSamlOpen(true)}
                onOpenForgotPassword={() => setIsForgotOpen(true)}
              />
            )}

            {currentScreen === 'mfa' && (
              <MfaScreen onNavigate={(s) => setCurrentScreen(s)} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <SamlModal isOpen={isSamlOpen} onClose={() => setIsSamlOpen(false)} />
      <DocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      <SecurityCenterModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />
      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </div>
  );
}
