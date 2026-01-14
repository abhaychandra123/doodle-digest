import React, { useState } from 'react';
import { DoodleIcon } from './icons/DoodleIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { UsersIcon } from './icons/UsersIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface AuthViewProps {
  onRegister: (fullName: string, email: string, password: string) => { success: boolean, message: string };
  onLogin: (email: string, password: string) => { success: boolean, message: string };
  onForgotPassword: (email: string) => { success: boolean, message: string };
  onResetPassword: (otp: string, newPassword: string) => { success: boolean, message: string };
}

type AuthMode = 'login' | 'register' | 'forgotPassword' | 'resetPassword';

const AuthView: React.FC<AuthViewProps> = ({ onRegister, onLogin, onForgotPassword, onResetPassword }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('register');

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const clearFormState = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setConfirmPassword('');
    setOtp('');
    setError('');
    setSuccess('');
    setLoading(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setAuthMode(newMode);
    clearFormState();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const result = await onRegister(fullName, email, password);
    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const result = await onLogin(email, password);
    if (!result.success) {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const result = await onForgotPassword(email);
    if (result.success) {
      setSuccess(result.message);
      setAuthMode('resetPassword');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    const result = await onResetPassword(otp, password);
    if (result.success) {
      switchMode('login');
      setTimeout(() => setSuccess(result.message), 100);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const renderForm = () => {
    switch (authMode) {
      case 'register':
        return (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-black dark:text-white">Full Name</label>
              <input id="fullName" name="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full input-style" autoFocus />
            </div>
            <div>
              <label htmlFor="email-reg" className="block text-sm font-medium text-black dark:text-white">Email address</label>
              <input id="email-reg" name="email-reg" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full input-style" />
            </div>
            <div>
              <label htmlFor="password-reg" className="block text-sm font-medium text-black dark:text-white">Password</label>
              <input id="password-reg" name="password-reg" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full input-style" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-black dark:text-white">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full input-style" />
            </div>
            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        );
      case 'forgotPassword':
        return (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <h3 className="font-bold text-xl text-black dark:text-white mb-1">Forgot Password?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enter your email and we'll send you an OTP to reset your password.</p>
            <div>
              <label htmlFor="email-forgot" className="block text-sm font-medium text-black dark:text-white">Email address</label>
              <input id="email-forgot" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full input-style" autoFocus />
            </div>
            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
            <div className="text-sm text-center">
              <button type="button" onClick={() => switchMode('login')} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Back to Login</button>
            </div>
          </form>
        );
      case 'resetPassword':
        return (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <h3 className="font-bold text-xl text-black dark:text-white mb-4">Reset Your Password</h3>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-black dark:text-white">One-Time Password (OTP)</label>
              <input id="otp" name="otp" type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} className="mt-1 block w-full input-style" autoFocus />
            </div>
            <div>
              <label htmlFor="password-reset" className="block text-sm font-medium text-black dark:text-white">New Password</label>
              <input id="password-reset" name="password-reset" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full input-style" />
            </div>
            <div>
              <label htmlFor="confirmPassword-reset" className="block text-sm font-medium text-black dark:text-white">Confirm New Password</label>
              <input id="confirmPassword-reset" name="confirmPassword-reset" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full input-style" />
            </div>
            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        );
      case 'login':
      default:
        return (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="email-login" className="block text-sm font-medium text-black dark:text-white">Email address</label>
              <input id="email-login" name="email-login" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full input-style" autoFocus />
            </div>
            <div>
              <label htmlFor="password-login" className="block text-sm font-medium text-black dark:text-white">Password</label>
              <input id="password-login" name="password-login" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full input-style" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-black dark:text-white">Remember me</label>
              </div>
              <div className="text-sm">
                <button type="button" onClick={() => switchMode('forgotPassword')} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Forgot your password?</button>
              </div>
            </div>
            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60">
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        );
    }
  };

  const Feature: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="flex items-start gap-4 animate-fade-in p-3 rounded-xl bg-white/10 backdrop-blur-sm">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/20 rounded-xl">{icon}</div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <div className="text-sm mt-1">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl flex glass rounded-2xl shadow-2xl glow-indigo overflow-hidden animate-fade-in">
      {/* Left Pitch Column */}
      <div className="hidden md:flex md:flex-col md:justify-center w-1/2 gradient-bg p-10 relative">
        <div className="flex items-center gap-3 animate-fade-in">
          <DoodleIcon className="w-10 h-10 text-white float-animation" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Doodle Digest</h1>
        </div>
        <p className="mt-4 text-white/80">
          Go from complex research to clear, collaborative insights in minutes.
        </p>
        <div className="mt-10 space-y-8 stagger-children">
          <Feature icon={<LightbulbIcon className="w-5 h-5 text-white" />} title="AI-Powered Summaries">
            <span className="text-white/70">Our AI reads your papers and creates simple, visual summaries so you can grasp key concepts instantly.</span>
          </Feature>
          <Feature icon={<UsersIcon className="w-5 h-5 text-white" />} title="Built for Collaboration">
            <span className="text-white/70">Create research groups, manage tasks, and share findings all in one place.</span>
          </Feature>
          <Feature icon={<CheckCircleIcon className="w-5 h-5 text-white" />} title="Stay Organized">
            <span className="text-white/70">From datasets to literature reviews, our tools keep your project on track.</span>
          </Feature>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="w-full md:w-1/2 p-8 sm:p-10">
        {(authMode === 'login' || authMode === 'register') && (
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button onClick={() => switchMode('register')} className={`px-4 py-2 text-sm font-semibold ${authMode === 'register' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
              Register
            </button>
            <button onClick={() => switchMode('login')} className={`px-4 py-2 text-sm font-semibold ${authMode === 'login' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
              Login
            </button>
          </div>
        )}

        {success && <p className="mb-4 text-sm font-medium text-green-600 dark:text-green-400">{success}</p>}
        {error && <p className="mb-4 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}

        {renderForm()}
      </div>
      <style>{`.input-style {
        color: #000000;
        background-color: #ffffff;
        box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.07);
        border: 1px solid #D1D5DB; /* gray-300 */
        border-radius: 0.375rem;
        padding: 0.5rem 0.75rem;
        width: 100%;
      }
      .dark .input-style {
        color: #FFFFFF;
        background-color: #121212;
        border-color: #4B5563; /* gray-600 */
      }
      .input-style:focus {
        outline: none;
        border-color: #6366f1; /* indigo-500 */
        box-shadow: 0 0 0 1px #6366f1;
      }
      .dark .input-style:focus {
        border-color: #818cf8; /* indigo-400 */
        box-shadow: 0 0 0 1px #818cf8;
      }
      `}</style>
    </div>
  );
};

export default AuthView;