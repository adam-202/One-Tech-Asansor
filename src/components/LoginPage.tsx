import React, { useState } from 'react';
import { Technician } from '../types';
import { Language, translations } from '../utils/translations';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Building2,
  Sparkles,
  Globe,
  ArrowRight,
  UserCheck,
  Compass,
} from 'lucide-react';

interface LoginPageProps {
  technicians: Technician[];
  onLoginSuccess: (user: Technician) => void;
  language: Language;
  onToggleLanguage: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  technicians,
  onLoginSuccess,
  language,
  onToggleLanguage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = translations[language];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    setTimeout(() => {
      // Find technician
      const user = technicians.find(
        (t) => t.email.toLowerCase().trim() === cleanEmail
      );

      if (!user) {
        setError(
          language === 'en'
            ? 'Account not found. Please contact Operations Director (Adam) for access.'
            : 'Hesap bulunamadı. Erişim için lütfen Operasyon Yöneticisi (Adam) ile iletişime geçin.'
        );
        setLoading(false);
        return;
      }

      // Check password (default password if undefined is 'onetech2026' for Adam, 'tech123' for others)
      const expectedPassword = user.password || (user.isAdmin || user.email === 'adam.osama60@gmail.com' ? 'onetech2026' : 'tech123');

      if (cleanPass !== expectedPassword) {
        setError(
          language === 'en'
            ? 'Incorrect password. Please verify your credentials or ask Admin for a reset.'
            : 'Hatalı şifre. Lütfen bilgilerinizi kontrol edin veya yöneticiden sıfırlama talep edin.'
        );
        setLoading(false);
        return;
      }

      setLoading(false);
      onLoginSuccess(user);
    }, 400);
  };

  const fillQuickLogin = (tech: Technician) => {
    setEmail(tech.email);
    setPassword(tech.password || (tech.isAdmin || tech.email === 'adam.osama60@gmail.com' ? 'onetech2026' : 'tech123'));
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden text-slate-100">
      {/* Dynamic Background Glows & Elevator Grid Line Accents */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-indigo-600 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-emerald-600 blur-3xl opacity-50" />
        {/* Subtle Isometric Grid */}
        <div
          className="w-full h-full opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block leading-tight">
              One Tech Asansör
            </span>
            <span className="text-[11px] text-blue-400 font-mono tracking-wide">
              ElevatorOps • Enterprise Field Platform
            </span>
          </div>
        </div>

        <button
          onClick={onToggleLanguage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all active:scale-95 shadow-xs"
          title="Switch Language / Dil Değiştir"
        >
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>{language === 'en' ? '🇹🇷 Türkçe' : '🇺🇸 English'}</span>
        </button>
      </header>

      {/* Main Login Card Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Operations Portal</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {language === 'en' ? 'Welcome Back' : 'Giriş Yap'}
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {language === 'en'
                ? 'Sign in to access your daily routes, building safety logs, and field dispatch.'
                : 'Günlük rota, bina güvenlik kontrolleri ve saha görevlerinize erişmek için giriş yapın.'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {language === 'en' ? 'Email Address' : 'E-Posta Adresi'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@onetech.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-blue-500 rounded-2xl text-xs text-white placeholder-slate-600 outline-hidden transition-all focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {language === 'en' ? 'Password' : 'Şifre'}
                </label>
                <span className="text-[10px] text-slate-500">
                  {language === 'en' ? 'Admin assigned' : 'Yönetici tarafından verilir'}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-800 focus:border-blue-500 rounded-2xl text-xs text-white placeholder-slate-600 outline-hidden transition-all focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{language === 'en' ? 'Sign In to Dashboard' : 'Panele Giriş Yap'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Pills */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
              {language === 'en' ? 'Quick Demo Login Accounts' : 'Hızlı Giriş Hesapları'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {technicians.slice(0, 3).map((tech) => {
                const isAdmin = tech.isAdmin || tech.email === 'adam.osama60@gmail.com';
                return (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => fillQuickLogin(tech)}
                    className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 text-left transition-all group flex items-center gap-2"
                  >
                    <div className={`w-7 h-7 rounded-lg ${tech.avatarColor || 'bg-blue-600'} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                      {tech.name[0]}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-semibold text-slate-200 truncate">{tech.name}</span>
                        {isAdmin && (
                          <span className="px-1 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-300 font-mono">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate font-mono">
                        {tech.email.split('@')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              {language === 'en'
                ? 'Only the Admin (Adam) can create or update employee credentials in the Admin Portal.'
                : 'Yalnızca Yönetici (Adam) Yönetim Panelinden personel hesapları oluşturabilir ve şifreleri düzenleyebilir.'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center text-xs text-slate-500">
        <span>One Tech Asansör © {new Date().getFullYear()} • İstanbul, Türkiye</span>
      </footer>
    </div>
  );
};
