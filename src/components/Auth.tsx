import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  loginWithGoogle, 
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Modal } from './Modal';
import { AboutContent, PrivacyContent, TermsContent } from './LegalContent';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isMissionOpen, setIsMissionOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Form states
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Ensure user document exists
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: currentUser.email,
            name: currentUser.displayName || name || 'User',
            createdAt: Date.now()
          });
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [name]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        if (!agreeToTerms) {
          throw new Error('Please agree to the Terms of Service and Privacy Policy');
        }
        await createUserWithEmailAndPassword(auth, email, password);
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setResetSuccess(true);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('This email is already registered. Please sign in.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password.');
      } else {
        setAuthError(err.message || 'Authentication failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setAuthError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setAuthError('Google sign in failed. ' + (err.message || ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
          <p className="text-slate-500 font-medium tracking-wide text-sm">Authenticating workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --primary-navy: #0F2942;
            --accent-teal: #00D4FF;
            --secondary-rust: #C85A2B;
            --text-primary: #1a1a1a;
            --text-secondary: #666;
            --bg-light: #f9f8f6;
            --border-color: #e0ddd9;
          }

          @keyframes scan-line {
            0% { transform: translateY(-100%); opacity: 0.6; }
            50% { opacity: 0.3; }
            100% { transform: translateY(100vh); opacity: 0; }
          }

          .auth-container {
            min-height: 100vh;
            display: grid;
            grid-template-columns: 1fr 1fr;
            background: var(--bg-light);
            position: relative;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          }

          .auth-visual {
            background: var(--primary-navy);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            position: relative;
            padding: 60px 40px;
          }

          .auth-visual::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 212, 255, 0.03) 2px,
              rgba(0, 212, 255, 0.03) 4px
            );
            pointer-events: none;
            animation: scan-line 8s linear infinite;
          }

          .auth-visual::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--accent-teal), transparent);
            animation: scan-line 8s linear infinite;
          }

          .visual-content {
            position: relative;
            z-index: 1;
          }

          .auth-form-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 60px 40px;
            position: relative;
          }

          .form-wrapper {
            max-width: 380px;
            margin: 0 auto;
            width: 100%;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 8px;
          }

          .form-input {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            transition: all 0.3s ease;
            background: white;
          }

          .form-input:focus {
            outline: none;
            border-color: var(--accent-teal);
            box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
          }

          .form-input::placeholder {
            color: #999;
          }

          .form-divider {
            text-align: center;
            margin: 28px 0;
            position: relative;
          }

          .form-divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: var(--border-color);
          }

          .form-divider-text {
            background: var(--bg-light);
            padding: 0 12px;
            color: var(--text-secondary);
            font-size: 13px;
            position: relative;
            display: inline-block;
          }

          .btn-custom {
            width: 100%;
            padding: 12px 16px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }

          .btn-custom:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .btn-primary {
            background: var(--primary-navy);
            color: white;
            margin-bottom: 12px;
          }

          .btn-primary:hover:not(:disabled) {
            background: #0a1a2e;
            transform: translateY(-1px);
          }

          .btn-secondary {
            background: white;
            color: var(--primary-navy);
            border: 1px solid var(--border-color);
          }

          .btn-secondary:hover:not(:disabled) {
            background: #fafaf8;
            border-color: var(--accent-teal);
          }

          .google-icon {
            width: 16px;
            height: 16px;
          }

          .form-footer {
            text-align: center;
            margin-top: 20px;
            font-size: 13px;
            color: var(--text-secondary);
          }

          .form-footer button {
            color: var(--accent-teal);
            font-weight: 500;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
          }

          .form-footer button:hover {
            text-decoration: underline;
          }

          .form-header {
            margin-bottom: 28px;
          }

          .form-header h2 {
            font-size: 24px;
            font-weight: 600;
            color: var(--primary-navy);
            margin-bottom: 8px;
          }

          .form-header p {
            font-size: 14px;
            color: var(--text-secondary);
            line-height: 1.5;
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--accent-teal);
            text-decoration: none;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 24px;
            cursor: pointer;
            background: none;
            border: none;
            padding: 0;
          }

          .back-link:hover {
            text-decoration: underline;
          }

          .password-reset {
            text-align: center;
          }

          .password-reset h2 {
            font-size: 28px;
            font-weight: 600;
            color: var(--primary-navy);
            margin-bottom: 12px;
          }

          .password-reset p {
            font-size: 14px;
            color: var(--text-secondary);
            line-height: 1.6;
            margin-bottom: 32px;
          }

          .success-message {
            background: rgba(0, 212, 255, 0.1);
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 24px;
            font-size: 13px;
            color: #0088aa;
            text-align: center;
          }

          .error-message {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #ef4444;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 20px;
            font-size: 13px;
            text-align: center;
          }

          .checkbox-group {
            display: flex;
            gap: 8px;
            align-items: flex-start;
          }

          .checkbox-input {
            width: 16px;
            height: 16px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
            flex-shrink: 0;
            margin-top: 2px;
          }

          .checkbox-input:checked {
            background: var(--primary-navy);
            border-color: var(--primary-navy);
          }

          .checkbox-label {
            font-size: 13px;
            color: var(--text-secondary);
            line-height: 1.5;
          }

          @media (max-width: 900px) {
            .auth-container {
              grid-template-columns: 1fr;
            }
            .auth-visual {
              display: none;
            }
            .auth-form-container {
              padding: 40px 24px;
            }
            .form-wrapper {
              max-width: 340px;
            }
          }
        `}} />
        
        <div className="auth-container">
          <div className="auth-visual">
            <div className="visual-content text-left max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] text-sm font-medium mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4FF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D4FF]"></span>
                </span>
                Satellite Imagery Analysis
              </div>
              
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-8">
                Advanced Landscape <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-blue-400">Analysis Platform</span>
              </h1>
              
              <p className="text-lg text-slate-300 max-w-lg leading-relaxed mb-8">
                Empower your archaeological and remote sensing workflows with state-of-the-art AI interpretation, historical comparisons, and robust batch processing.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => setIsMissionOpen(true)}
                  className="flex items-center gap-2 text-[#00D4FF] font-medium hover:text-white transition-colors group"
                >
                  Read our mission <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          <div className="auth-form-container">
            <div className="form-wrapper">
              
              {authError && (
                <div className="error-message">
                  {authError}
                </div>
              )}

              {mode === 'login' && (
                <div className="form-content active">
                  <div className="form-header">
                    <h2>Welcome back</h2>
                    <p>Sign in to access your workspace and analysis records</p>
                  </div>
                  
                  <form onSubmit={handleEmailAuth}>
                    <div className="form-group">
                      <label className="form-label">Email address</label>
                      <input 
                        type="email" 
                        required
                        className="form-input" 
                        placeholder="name@organization.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required
                          className="form-input pr-10" 
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="btn-custom btn-primary">
                      {isSubmitting ? 'Signing in...' : 'Sign in'}
                    </button>
                  </form>
                  <div className="form-divider">
                    <div className="form-divider-text">Or continue with</div>
                  </div>
                  
                  <button type="button" onClick={handleGoogle} disabled={isSubmitting} className="btn-custom btn-secondary">
                    <svg className="google-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                  <div className="form-footer">
                    Don't have an account? <button type="button" onClick={() => setMode('signup')}>Sign up</button><br />
                    <button type="button" style={{marginTop: '12px'}} onClick={() => { setMode('reset'); setResetSuccess(false); setAuthError(''); }}>Forgot your password?</button>
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div className="form-content active">
                  <div className="form-header">
                    <h2>Create your account</h2>
                    <p>Join researchers and heritage managers using AstraScan ML</p>
                  </div>
                  
                  <form onSubmit={handleEmailAuth}>
                    <div className="form-group">
                      <label className="form-label">Full name</label>
                      <input 
                        type="text" 
                        required
                        className="form-input" 
                        placeholder="e.g. Opuada Uranta"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email address</label>
                      <input 
                        type="email" 
                        required
                        className="form-input" 
                        placeholder="name@organization.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required
                          minLength={6}
                          className="form-input pr-10" 
                          placeholder="Create a strong password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <div className="checkbox-group mb-4">
                        <input 
                          type="checkbox" 
                          id="terms" 
                          className="checkbox-input"
                          checked={agreeToTerms}
                          onChange={(e) => setAgreeToTerms(e.target.checked)}
                        />
                        <label htmlFor="terms" className="checkbox-label">
                          I agree to the <button type="button" onClick={() => setIsTermsOpen(true)} style={{color: 'var(--accent-teal)'}}>Terms of Service</button> and <button type="button" onClick={() => setIsPrivacyOpen(true)} style={{color: 'var(--accent-teal)'}}>Privacy Policy</button>
                        </label>
                      </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="btn-custom btn-primary">
                      {isSubmitting ? 'Creating account...' : 'Create account'}
                    </button>
                  </form>
                  <div className="form-divider">
                    <div className="form-divider-text">Or sign up with</div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => {
                      if (!agreeToTerms) {
                        setAuthError('Please agree to the Terms of Service and Privacy Policy');
                        return;
                      }
                      handleGoogle();
                    }} 
                    disabled={isSubmitting} 
                    className="btn-custom btn-secondary"
                  >
                    <svg className="google-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign up with Google
                  </button>
                  <div className="form-footer">
                    Already have an account? <button type="button" onClick={() => setMode('login')}>Sign in</button>
                  </div>
                </div>
              )}

              {mode === 'reset' && (
                <div className="form-content active">
                  <button type="button" onClick={() => setMode('login')} className="back-link">← Back to sign in</button>
                  <div className="password-reset">
                    <h2>Reset your password</h2>
                    <p>Enter your email address and we'll send you a link to create a new password</p>
                  </div>
                  {resetSuccess ? (
                    <div className="success-message">
                      ✓ Check your email for a password reset link
                    </div>
                  ) : (
                    <form onSubmit={handleEmailAuth}>
                      <div className="form-group">
                        <label className="form-label">Email address</label>
                        <input 
                          type="email" 
                          required
                          className="form-input" 
                          placeholder="name@organization.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <button type="submit" disabled={isSubmitting} className="btn-custom btn-primary">
                        {isSubmitting ? 'Sending...' : 'Send reset link'}
                      </button>
                    </form>
                  )}
                  <div className="form-footer" style={{marginTop: '24px'}}>
                    <button type="button" onClick={() => setMode('login')}>Back to sign in</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Modal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} title="About">
          <AboutContent />
        </Modal>

        <Modal isOpen={isMissionOpen} onClose={() => setIsMissionOpen(false)} title="Our Mission">
          <div className="space-y-4 text-sm leading-relaxed text-slate-700">
            <p>
              To advance archaeological and landscape research by making AI-assisted satellite imagery interpretation more accessible, efficient, and reliable, while promoting responsible use of geospatial technologies for cultural heritage preservation.
            </p>
          </div>
        </Modal>

        <Modal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} title="Privacy Policy">
          <PrivacyContent />
        </Modal>

        <Modal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} title="Terms of Service">
          <TermsContent />
        </Modal>
      </>
    );
  }

  return <>{children}</>;
}
