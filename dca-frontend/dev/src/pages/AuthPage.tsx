import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../lib/api/auth';
import { useAuth } from '../contexts/AuthContext';

// Import all background components
import DarkVeil from '../components/DarkVeil';
import RippleGrid from '../components/RippleGrid';
import FaultyTerminal from '../components/FaultyTerminal';
import GradientBlinds from '../components/GradientBlinds';
import Lightning from '../components/Lightning';
import Plasma from '../components/Plasma';

const AuthPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // New state for email
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false); // State to toggle between login and register
  const { login } = useAuth();

  // --- Background Selection ---
  // Change this index to switch between different background components.
  // 0: DarkVeil (current default dark background)
  // 1: RippleGrid (interactive grid with ripple effects)
  // 2: FaultyTerminal (glitchy, terminal-like background)
  // 3: GradientBlinds (animated gradient blinds effect)
  // 4: Lightning (dynamic lightning bolt effects)
  // 5: Plasma (fluid, ethereal plasma-like animation)
  const backgroundIndex: number = 5; 

  const renderBackground = (index: number) => {
    switch (index) {
      case 0:
        // Default dark background - you can add props if DarkVeil accepts any
        return <DarkVeil hueShift={216}/>;
      case 1:
        // RippleGrid: Customize grid color and ripple intensity
        return <RippleGrid gridColor="#E66100" rippleIntensity={0.01} gridSize={18}  gridThickness={5}  fadeDistance={1.8} vignetteStrength={3.8} glowIntensity={0.8} enableRainbow={false}/>;
      case 2:
        // FaultyTerminal: Add props here if needed
        return <FaultyTerminal tint='#E66100' scale={1.8} digitSize={2.5} noiseAmp={0.7} brightness={1}  scanlineIntensity={1} curvature={0.4} mouseStrength={1.7}/>;
      case 3:
        // GradientBlinds: Add props here if needed
        return <GradientBlinds gradientColors={['#E66100', '#db8649ff']} angle={50}  noise={0.25} blindCount={16} distortAmount={0}/>;
      case 4:
        // Lightning: Add props here if needed
        return <Lightning hue={20} xOffset={0} speed={0.2} intensity={0.7} size={1.1}/>;
      case 5:
        // Plasma: Add props here if needed
        return <Plasma color='#E66100' speed={0.3} scale={0.8}  opacity={1} mouseInteractive={false}/>;
      default:
        return <DarkVeil />; // Fallback to default
    }
  };

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
    <div className="relative flex items-center justify-center min-h-screen bg-black text-white">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {renderBackground(backgroundIndex)}
      </div>

      {/* Login Form Layer (above background) */}
      <div className="relative z-10 w-full max-w-md p-8 space-y-8">
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

