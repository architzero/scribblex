import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { fetchCountries, generateSmartUsernameSuggestions, type Country } from '../utils/profileUtils';

const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#C7CEEA', '#B4A7D6', '#95E1D3'];

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    country: '',
    color: '#FF6B6B',
    bio: '',
    dob: '',
  });

  const [currentStep, setCurrentStep] = useState<'name' | 'username' | 'country' | 'dob' | 'bio' | 'done'>('name');
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) localStorage.setItem('accessToken', token);
    
    fetchCountries().then(data => {
      setCountries(data);
      setLoadingCountries(false);
    }).catch(() => setLoadingCountries(false));
  }, [searchParams]);

  useEffect(() => {
    const checkUsername = async () => {
      if (!formData.username || formData.username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      
      setUsernameChecking(true);
      try {
        const response = await api.get(`/user/check-username/${formData.username}`);
        setUsernameAvailable(response.data.available);
        if (!response.data.available) {
          setUsernameSuggestions(generateSmartUsernameSuggestions(formData.username, formData.name));
        } else {
          setUsernameSuggestions([]);
        }
      } catch (error) {
        console.error('Username check failed:', error);
        setUsernameAvailable(true);
        setUsernameSuggestions([]);
      } finally {
        setUsernameChecking(false);
      }
    };
    
    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [formData.username, formData.name]);

  const initials = formData.name
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const selectedCountry = countries.find(c => c.name === formData.country);
  const joinDate = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const goToNextStep = () => {
    if (currentStep === 'name' && formData.name.trim()) {
      setCurrentStep('username');
    } else if (currentStep === 'username' && formData.username && formData.username.length >= 3) {
      setCurrentStep('country');
    } else if (currentStep === 'country' && formData.country) {
      setCurrentStep('dob');
    } else if (currentStep === 'dob' && formData.dob) {
      setCurrentStep('bio');
    } else if (currentStep === 'bio') {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === 'username') setCurrentStep('name');
    else if (currentStep === 'country') setCurrentStep('username');
    else if (currentStep === 'dob') setCurrentStep('country');
    else if (currentStep === 'bio') setCurrentStep('dob');
  };

  const handleSubmit = async () => {
    const birthDate = new Date(formData.dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    
    if (actualAge < 13) {
      toast.error('You must be at least 13 years old');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/user/complete-profile', {
        name: formData.name,
        username: formData.username,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=${formData.color.slice(1)}&color=fff&size=200`,
        bio: formData.bio,
        location: formData.country,
        dateOfBirth: formData.dob,
        socialLinks: []
      });
      
      if (response.data.success && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        setCurrentStep('done');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }} />

      <motion.div animate={{ x: [0, 30, 0], y: [0, -40, 0], rotate: [0, 5, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-[10%] w-24 h-24 border-2 border-gray-200 rounded-full opacity-40" />
      <motion.div animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[35%] left-[5%] w-16 h-16 border-2 border-gray-200 rounded-full opacity-35" />
      <motion.div animate={{ x: [0, 25, 0], y: [0, -25, 0], rotate: [0, 8, 0] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[60%] left-[8%] w-20 h-20 border-2 border-gray-200 opacity-40" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
      <motion.div animate={{ x: [0, -25, 0], y: [0, 35, 0], rotate: [0, -8, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/3 right-[12%] w-32 h-32 opacity-30">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 20 50 L 35 20 L 65 20 L 80 50 L 65 80 L 35 80 Z" fill="none" stroke="#000" strokeWidth="2" opacity="0.2" />
        </svg>
      </motion.div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          
          <div>
            {currentStep !== 'name' && currentStep !== 'done' && (
              <button onClick={handleBack} className="mb-8 text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm">
                ← Back
              </button>
            )}

            <div className="mb-20">
              <div className="flex items-center gap-3">
                <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
                  <path d="M8 4 Q 4 4, 4 8 L 4 24 Q 4 28, 8 28 L 24 28 Q 28 28, 28 24 L 28 8 Q 28 4, 24 4 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M 10 16 Q 12 10, 16 12 T 22 16" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
                <div>
                  <div className="font-bold text-2xl tracking-tight leading-none">ScribbleX</div>
                  <div className="text-[10px] text-gray-600 tracking-[0.2em] font-bold mt-1.5">CREATE YOUR PROFILE</div>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {currentStep === 'name' && (
                <motion.div key="name" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div>
                    <div className="text-4xl font-light mb-6 text-gray-200">01</div>
                    <h2 className="text-3xl mb-4 font-medium">What's your name?</h2>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && formData.name.trim()) {
                          goToNextStep();
                        }
                      }}
                      className="text-2xl w-full bg-transparent border-0 border-b-2 border-gray-900 pb-2 outline-none placeholder:text-gray-300" 
                      placeholder="Type here..." 
                      autoFocus 
                    />
                  </div>
                  <button onClick={goToNextStep} disabled={!formData.name.trim()} className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30">Press Enter ↵</button>
                </motion.div>
              )}

              {currentStep === 'username' && (
                <motion.div key="username" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div>
                    <div className="text-4xl font-light mb-6 text-gray-200">02</div>
                    <h2 className="text-3xl mb-4 font-medium">Pick a username</h2>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.username} 
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) })} 
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && formData.username && formData.username.length >= 3) {
                            goToNextStep();
                          }
                        }}
                        className="text-2xl w-full bg-transparent border-0 border-b-2 border-gray-900 pb-2 outline-none placeholder:text-gray-300 pr-10" 
                        placeholder="username" 
                        autoFocus 
                      />
                      {usernameChecking && <div className="absolute right-2 top-2 w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />}
                      {!usernameChecking && usernameAvailable === true && <Check className="absolute right-2 top-2 w-5 h-5 text-green-600" />}
                      {!usernameChecking && usernameAvailable === false && <div className="absolute right-2 top-2 w-5 h-5 text-red-600 font-bold">✗</div>}
                    </div>
                    {formData.username.length >= 3 && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">scribbleX.com/@{formData.username}</span>
                        {!usernameChecking && usernameAvailable === true && <span className="text-green-600 ml-2 font-medium">✓ Available</span>}
                        {!usernameChecking && usernameAvailable === false && <span className="text-red-600 ml-2 font-medium">✗ Taken</span>}
                      </div>
                    )}
                    {usernameSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-sm text-gray-500">Try:</span>
                        {usernameSuggestions.map((s, i) => (
                          <button key={i} onClick={() => setFormData({ ...formData, username: s })} className="text-sm px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200">{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={goToNextStep} disabled={!formData.username || formData.username.length < 3} className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30">Press Enter ↵</button>
                </motion.div>
              )}

              {currentStep === 'country' && (
                <motion.div key="country" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div>
                    <div className="text-4xl font-light mb-6 text-gray-200">03</div>
                    <h2 className="text-3xl mb-4 font-medium">Where are you from?</h2>
                    {loadingCountries ? (
                      <div className="flex items-center gap-3 text-gray-400">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                        <span>Loading countries...</span>
                      </div>
                    ) : (
                      <select 
                        value={formData.country} 
                        onChange={(e) => { 
                          setFormData({ ...formData, country: e.target.value }); 
                          if (e.target.value) setTimeout(() => goToNextStep(), 100); 
                        }} 
                        className="text-2xl w-full bg-transparent border-0 border-b-2 border-gray-900 pb-2 outline-none" 
                        autoFocus
                      >
                        <option value="">Select country...</option>
                        {countries.map(c => (
                          <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <button onClick={goToNextStep} disabled={!formData.country} className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30">Select to continue</button>
                </motion.div>
              )}

              {currentStep === 'dob' && (
                <motion.div key="dob" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div>
                    <div className="text-4xl font-light mb-6 text-gray-200">04</div>
                    <h2 className="text-3xl mb-4 font-medium">When's your birthday?</h2>
                    <input 
                      type="date" 
                      value={formData.dob} 
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })} 
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && formData.dob) {
                          goToNextStep();
                        }
                      }}
                      max={new Date().toISOString().split('T')[0]} 
                      className="text-2xl w-full bg-transparent border-0 border-b-2 border-gray-900 pb-2 outline-none" 
                      autoFocus 
                    />
                  </div>
                  <button onClick={goToNextStep} disabled={!formData.dob} className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30">Press Enter ↵</button>
                </motion.div>
              )}

              {currentStep === 'bio' && (
                <motion.div key="bio" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div>
                    <div className="text-4xl font-light mb-6 text-gray-200">05</div>
                    <h2 className="text-3xl mb-4 font-medium">Tell us about yourself</h2>
                    <textarea 
                      value={formData.bio} 
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 160) })} 
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          goToNextStep();
                        }
                      }}
                      className="text-xl w-full bg-transparent border-0 border-b-2 border-gray-900 pb-2 outline-none placeholder:text-gray-300 resize-none" 
                      placeholder="Optional..." 
                      rows={3} 
                      autoFocus 
                    />
                    <div className="text-sm text-gray-400 text-right">{formData.bio.length}/160</div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => handleSubmit()} className="text-gray-400 hover:text-gray-600">Skip →</button>
                    <button onClick={goToNextStep} disabled={loading} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">{loading ? 'Creating...' : 'Finish'}</button>
                  </div>
                </motion.div>
              )}

              {currentStep === 'done' && (
                <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="text-6xl mb-4">✓</div>
                  <h2 className="text-3xl mb-4 font-medium">Ready to create</h2>
                  <p className="text-gray-500">Your profile is set up. Let's start scribbling.</p>
                  <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800">Open Canvas →</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }} 
            transition={{ type: "spring", stiffness: 300, damping: 20 }} 
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black rounded-2xl transform translate-x-3 translate-y-3 transition-transform group-hover:translate-x-4 group-hover:translate-y-4" />
            <div className="relative bg-white border-2 border-black rounded-2xl p-8 space-y-6 shadow-xl">
              <div className="flex items-start gap-4">
                <motion.div 
                  whileHover={{ scale: 1.15, rotate: [0, -10, 10, -10, 0] }} 
                  transition={{ duration: 0.6 }} 
                  className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-2 ring-white cursor-pointer" 
                  style={{ backgroundColor: formData.color }}
                >
                  {initials || '?'}
                </motion.div>
                <div className="flex-1">
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="font-bold text-2xl mb-1"
                  >
                    {formData.name || 'Your Name'}
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 0.1 }} 
                    className="text-gray-500 text-base mb-2"
                  >
                    @{formData.username || 'username'}
                  </motion.div>
                  {selectedCountry && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-sm text-gray-700 font-medium"
                    >
                      <span>{selectedCountry.flag}</span>
                      <span>{selectedCountry.name}</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {formData.bio && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="p-4 bg-gray-50 rounded-xl border-l-4 border-black"
                >
                  <p className="text-sm text-gray-700 leading-relaxed">{formData.bio}</p>
                </motion.div>
              )}

              <div className="flex items-center justify-between text-xs pt-4 border-t-2 border-gray-100">
                <div className="flex items-center gap-2">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ duration: 2, repeat: Infinity }} 
                    className="w-2.5 h-2.5 bg-gradient-to-br from-red-500 to-pink-500 rounded-full shadow-sm" 
                  />
                  <span className="font-bold text-gray-800 tracking-wide">MEMBER</span>
                </div>
                <span className="text-gray-500 font-medium">Joined {joinDate}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
