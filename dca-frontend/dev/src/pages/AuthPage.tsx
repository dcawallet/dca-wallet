import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../lib/api/auth';
import { useAuth } from '../contexts/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // New state for email
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false); // State to toggle between login and register
  const { login } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegistering) {
        // Registration logic
        await registerUser({ username, email, password });
        // After successful registration, automatically log in the user
        const authResponse = await loginUser({ 
          username, 
          password,
          grant_type: 'password',
          scope: '',
          client_id: 'string',
          client_secret: ''
        });
        login(authResponse.access_token, authResponse.token_type);
        navigate('/dashboard');
      } else {
        // Login logic
        const authResponse = await loginUser({
          username,
          password,
          grant_type: 'password',
          scope: '',
          client_id: 'string',
          client_secret: ''
        });
        login(authResponse.access_token, authResponse.token_type);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold flex justify-center items-center">
            DCA Wallet
            <span className="ml-2 text-4xl">🟠</span>
          </h1>
          <p className="mt-2 text-zinc-400">
            Track your Bitcoin savings journey
          </p>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-md">
            <h3 className="font-bold">Authentication Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-400 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your username"
              />
            </div>
            {isRegistering && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your email"
                />
              </div>
            )}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your password"
              />
            </div>
          </div>
          <div>
            <button type="submit" className="w-full py-2 px-4 bg-[#ff9416] text-white rounded-full hover:bg-[#e08414] transition-colors">
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </div>
          <div className="flex items-center justify-center text-sm">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="font-medium text-[#3D64FF] hover:text-blue-400"
            >
              {isRegistering ? 'Already have an account? Login' : 'Dont have an account? Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
