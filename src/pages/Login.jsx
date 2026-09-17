import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { loginUser } from '../services/api';

const Login = () => {
  const [activeTab, setActiveTab] = useState('caissier'); // 'caissier' or 'patronne'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (activeTab === 'caissier') {
        await loginUser(null, pinCode);
      } else {
        await loginUser(email, password);
      }
      // App.jsx redirects automatically
    } catch (err) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-primary" size={40} />
          </div>
          <h1 className="text-3xl font-serif text-secondary mb-2">Majolica</h1>
          <p className="text-gray-500">Beauty Studio - Espace Administration</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'caissier' ? 'bg-white shadow-sm text-secondary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setActiveTab('caissier'); setError(''); }}
            >
              Caissier (Code)
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'patronne' ? 'bg-white shadow-sm text-secondary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setActiveTab('patronne'); setError(''); }}
            >
              Patronne (Email)
            </button>
          </div>

          <h2 className="text-xl font-bold text-secondary mb-6 text-center">
            {activeTab === 'caissier' ? 'Accès Caisse' : 'Accès Administrateur'}
          </h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {activeTab === 'caissier' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Code PIN</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound size={18} />
                  </div>
                  <input
                    type="password"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-center tracking-[0.5em] font-bold text-lg"
                    placeholder="••••"
                    maxLength="4"
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="patronne@majolica.ma"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-red-500/30 transition-all flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
