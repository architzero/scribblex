import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Sparkles, Check, X, Instagram, Github, Linkedin, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { fetchCountries, generateSmartUsernameSuggestions, type Country } from '../utils/profileUtils';

const socialPlatforms = [
  { value: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'username' },
  { value: 'discord', label: 'Discord', icon: MessageCircle, placeholder: 'username#1234' },
  { value: 'github', label: 'GitHub', icon: Github, placeholder: 'username' },
  { value: 'snapchat', label: 'Snapchat', icon: Send, placeholder: 'username' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'username' },
];

const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#C7CEEA', '#B4A7D6', '#95E1D3'];

const getRandomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

const getSocialUrl = (platform: string, username: string) => {
  const urls: Record<string, string> = {
    instagram: `https://instagram.com/${username}`,
    github: `https://github.com/${username}`,
    linkedin: `https://linkedin.com/in/${username}`,
    discord: username,
    snapchat: `https://snapchat.com/add/${username}`
  };
  return urls[platform] || '#';
};

const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const validateDateOfBirth = (dob: string): { valid: boolean; error?: string } => {
  if (!dob) return { valid: false, error: 'Date of birth is required' };
  
  const selectedDate = new Date(dob);
  const today = new Date();
  const minDate = new Date('1900-01-01');
  
  if (selectedDate > today) {
    return { valid: false, error: 'Date cannot be in the future' };
  }
  if (selectedDate < minDate) {
    return { valid: false, error: 'Please enter a valid date after 1900' };
  }
  
  const age = calculateAge(dob);
  if (age < 8) {
    return { valid: false, error: 'You must be at least 8 years old' };
  }
  
  return { valid: true };
};

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [avatar, setAvatar] = useState('');
  const [avatarColor, setAvatarColor] = useState(getRandomColor());
  const [dobError, setDobError] = useState('');
  const [socialLinks, setSocialLinks] = useState<Array<{platform: string, url: string}>>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [countrySearch, setCountrySearch] = useState('');
  
  const [showPresetAvatars, setShowPresetAvatars] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);
  const [editingSocial, setEditingSocial] = useState<string | null>(null);
  const [editSocialUrl, setEditSocialUrl] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showAllSocials, setShowAllSocials] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [currentStep, setCurrentStep] = useState<'name' | 'avatar' | 'username' | 'country' | 'dob' | 'bio' | 'social' | 'done'>('name');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    country: '',
    color: '#FF6B6B',
    bio: '',
    dob: '',
  });

  const initials = formData.name
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const joinDate = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) localStorage.setItem('accessToken', token);
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.email) setUserEmail(user.email);
    
    fetchCountries().then(data => {
      console.log('Fetched countries:', data.length);
      setCountries(data);
      setLoadingCountries(false);
    }).catch(err => {
      console.error('Error fetching countries:', err);
      setLoadingCountries(false);
    });
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
        setUsernameAvailable(null);
        setUsernameSuggestions([]);
      } finally {
        setUsernameChecking(false);
      }
    };
    
    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [formData.username, formData.name]);

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountry = countries.find(c => c.name === formData.country);

  const goToNextStep = () => {
    if (currentStep === 'name' && formData.name.trim()) {
      setCurrentStep('avatar');
    } else if (currentStep === 'avatar') {
      setCurrentStep('username');
    } else if (currentStep === 'username' && formData.username && formData.username.length >= 3) {
      setCurrentStep('country');
    } else if (currentStep === 'country' && formData.country) {
      setCurrentStep('dob');
    } else if (currentStep === 'dob') {
      const validation = validateDateOfBirth(formData.dob);
      if (!validation.valid) {
        setDobError(validation.error || '');
        toast.error(validation.error);
        return;
      }
      setDobError('');
      setCurrentStep('bio');
    } else if (currentStep === 'bio') {
      setCurrentStep('social');
    } else if (currentStep === 'social') {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === 'avatar') setCurrentStep('name');
    else if (currentStep === 'username') setCurrentStep('avatar');
    else if (currentStep === 'country') setCurrentStep('username');
    else if (currentStep === 'dob') setCurrentStep('country');
    else if (currentStep === 'bio') setCurrentStep('dob');
    else if (currentStep === 'social') setCurrentStep('bio');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgUrl = event.target?.result as string;
        setAvatar(imgUrl);
        setShowPresetAvatars(false);
        
        // Extract dominant color from image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 100;
            canvas.height = 100;
            ctx?.drawImage(img, 0, 0, 100, 100);
            const imageData = ctx?.getImageData(0, 0, 100, 100);
            if (imageData) {
              let r = 0, g = 0, b = 0, count = 0;
              for (let i = 0; i < imageData.data.length; i += 40) {
                r += imageData.data[i];
                g += imageData.data[i + 1];
                b += imageData.data[i + 2];
                count++;
              }
              r = Math.floor(r / count);
              g = Math.floor(g / count);
              b = Math.floor(b / count);
              setAvatarColor(`rgb(${r}, ${g}, ${b})`);
            }
          } catch (err) {
            console.log('Color extraction failed, using default');
            setAvatarColor('#4ECDC4');
          }
        };
        img.onerror = () => {
          setAvatarColor('#4ECDC4');
        };
        img.src = imgUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditingSocial = (platform: string) => {
    const current = socialLinks.find(l => l.platform === platform);
    setEditingSocial(platform);
    setEditSocialUrl(current?.url || '');
    setShowSocialDropdown(false);
  };

  const saveSocialLink = () => {
    if (editSocialUrl.trim() && editingSocial) {
      const exists = socialLinks.find(l => l.platform === editingSocial);
      if (exists) {
        setSocialLinks(socialLinks.map(l => l.platform === editingSocial ? { ...l, url: editSocialUrl.trim() } : l));
      } else {
        setSocialLinks([...socialLinks, { platform: editingSocial, url: editSocialUrl.trim() }]);
      }
      setEditingSocial(null);
      setEditSocialUrl('');
      toast.success('Social link added!');
    }
  };

  const cancelEditingSocial = () => {
    setEditingSocial(null);
    setEditSocialUrl('');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!formData.username.trim() || formData.username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (usernameAvailable === false) {
      toast.error('Username is already taken');
      return;
    }

    if (!formData.country) {
      toast.error('Please select your country');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmAndCreate = async () => {
    setShowConfirmation(false);
    setLoading(true);
    try {
      const finalAvatar = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=${formData.color.slice(1)}&color=fff&size=200`;
      
      const response = await api.post('/user/complete-profile', {
        name: formData.name,
        username: formData.username,
        avatar: finalAvatar,
        bio: formData.bio,
        location: formData.country,
        dob: formData.dob,
        socialLinks: socialLinks
      });
      
      if (response.data.success && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        toast.success('Profile created! Welcome to ScribbleX 🎉');
        setTimeout(() => navigate('/home'), 1000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = formData.name.trim() && 
                    formData.username.trim().length >= 3 && 
                    formData.username !== formData.name.toLowerCase().replace(/\s+/g, '') &&
                    usernameAvailable === true && 
                    formData.country &&
                    formData.dob;

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-6 relative overflow-hidden">
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
          
          <div className="relative">
            <div className="absolute top-0 left-0">
              {currentStep !== 'name' && currentStep !== 'done' && (
                <motion.button 
                  onClick={handleBack} 
                  whileHover={{ x: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-gray-400 hover:text-gray-900 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  ← Back
                </motion.button>
              )}
            </div>

            <div className="mb-20 mt-12">
              <div className="flex items-center gap-3">
                <svg width="33" height="33" viewBox="0 0 32 32" fill="none">
                  <path d="M8 4 Q 4 4, 4 8 L 4 24 Q 4 28, 8 28 L 24 28 Q 28 28, 28 24 L 28 8 Q 28 4, 24 4 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M 10 16 Q 12 10, 16 12 T 22 16" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
                <div>
                  <div className="font-bold text-xl tracking-tight leading-none font-display">ScribbleX</div>
                  <div className="text-[9px] text-gray-500 tracking-[0.15em] font-semibold mt-1.5">COMPLETE YOUR PROFILE</div>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {currentStep === 'name' && (
                <motion.div key="name" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div>
                    <div className="text-3xl font-light mb-6 text-gray-200">01</div>
                    {userEmail && (
                      <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="text-sm text-gray-700 font-medium">{userEmail}</p>
                      </div>
                    )}
                    <h2 className="text-2xl mb-4 font-medium">What's your name?</h2>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && formData.name.trim()) {
                          e.preventDefault();
                          e.stopPropagation();
                          goToNextStep();
                        }
                      }}
                      className="text-xl w-full bg-transparent border-0 border-b-2 border-gray-900 pb-2 outline-none placeholder:text-gray-300" 
                      placeholder="Type here..." 
                      autoFocus 
                    />
                  </div>
                  <button onClick={goToNextStep} disabled={!formData.name.trim()} className="text-sm text-gray-400 hover:text-gray-900 disabled:opacity-30 font-medium transition-colors">Press Enter ↵</button>
                </motion.div>
              )}

              {currentStep === 'avatar' && (
                <motion.div key="avatar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div>
                    <div className="text-3xl font-light mb-6 text-gray-200">02</div>
                    <h2 className="text-2xl mb-4 font-medium">Choose your avatar</h2>
                    
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white" style={{ backgroundColor: formData.color }}>
                            {initials || '?'}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-3">
                        <input type="file" id="avatar-upload" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        <button 
                          onClick={() => document.getElementById('avatar-upload')?.click()} 
                          className="px-4 py-2 rounded-full border border-black/10 bg-white text-sm font-medium hover:border-black hover:shadow-md transition-all flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />Upload
                        </button>
                        <button 
                          onClick={() => { setShowPresetAvatars(!showPresetAvatars); }} 
                          className="px-4 py-2 rounded-full border border-black/10 bg-white text-sm font-medium hover:border-black hover:shadow-md transition-all flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />Presets
                        </button>
                      </div>

                      {avatar && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">Accent color:</span>
                          <input 
                            type="color" 
                            value={avatarColor} 
                            onChange={(e) => setAvatarColor(e.target.value)} 
                            className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-200 hover:border-gray-400 transition-all"
                          />
                        </div>
                      )}

                      {showPresetAvatars && (
                        <div className="grid grid-cols-5 gap-3 w-full">
                          {[
                            'https://api.dicebear.com/9.x/bottts/svg?seed=Midnight&backgroundColor=b6e3f4',
                            'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=c0aede',
                            'https://api.dicebear.com/9.x/lorelei/svg?seed=Luna&backgroundColor=ffd5dc',
                            'https://api.dicebear.com/9.x/adventurer/svg?seed=Max&backgroundColor=ffdfbf',
                            'https://api.dicebear.com/9.x/big-smile/svg?seed=Happy&backgroundColor=d1d4f9',
                            'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Dragon&backgroundColor=b6e3f4',
                            'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Robot&backgroundColor=c0aede',
                            'https://api.dicebear.com/9.x/pixel-art/svg?seed=Gamer&backgroundColor=ffd5dc',
                            'https://api.dicebear.com/9.x/thumbs/svg?seed=Cool&backgroundColor=ffdfbf',
                            'https://api.dicebear.com/9.x/notionists/svg?seed=Smart&backgroundColor=d1d4f9',
                          ].map((url, index) => (
                            <button 
                              key={index}
                              onClick={() => { 
                                setAvatar(url); 
                                setShowPresetAvatars(false);
                                // Generate color from URL seed
                                const colors = ['#4ECDC4', '#FF6B6B', '#FFE66D', '#A8E6CF', '#FF8B94', '#C7CEEA', '#B4A7D6', '#95E1D3', '#FECA57', '#48DBFB'];
                                setAvatarColor(colors[index % colors.length]);
                              }} 
                              className="aspect-square rounded-full overflow-hidden border-2 border-gray-200 hover:border-black hover:scale-110 transition-all"
                            >
                              <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={goToNextStep}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        goToNextStep();
                      }
                    }}
                    className="text-sm text-gray-400 hover:text-gray-900 font-medium transition-colors"
                  >
                    Continue →
                  </button>
                </motion.div>
              )}

              {currentStep === 'username' && (
                <motion.div key="username" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div>
                    <div className="text-4xl font-light mb-6 text-gray-200">03</div>
                    <h2 className="text-3xl mb-4 font-medium">Pick a username</h2>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.username} 
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) })} 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && formData.username && formData.username.length >= 3 && usernameAvailable === true) {
                            e.preventDefault();
                            e.stopPropagation();
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
                  <button onClick={goToNextStep} disabled={!formData.username || formData.username.length < 3} className="text-sm text-gray-400 hover:text-gray-900 disabled:opacity-30 font-medium transition-colors">Press Enter ↵</button>
                </motion.div>
              )}

              {currentStep === 'country' && (
                <motion.div key="country" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div>
                    <div className="text-4xl font-light mb-6 text-gray-200">04</div>
                    <h2 className="text-3xl mb-4 font-medium">Where are you from?</h2>
                    {loadingCountries ? (
                      <div className="flex items-center gap-3 text-gray-400">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                        <span>Loading countries...</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={countrySearch || formData.country}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCountrySearch(value);
                            // Clear country if user is typing
                            if (value && formData.country) {
                              setFormData({ ...formData, country: '' });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              // If country already selected, go to next step
                              if (formData.country) {
                                goToNextStep();
                              }
                              // If searching and has results, select first one
                              else if (countrySearch && filteredCountries.length > 0) {
                                setFormData({ ...formData, country: filteredCountries[0].name });
                                setCountrySearch('');
                              }
                            }
                          }}
                          placeholder="Search country..."
                          className="text-2xl w-full bg-transparent border-0 border-b-2 border-gray-900 pb-2 outline-none placeholder:text-gray-300"
                          autoFocus
                        />
                        {countrySearch && filteredCountries.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white border-2 border-gray-200 rounded-lg shadow-lg z-10">
                            {filteredCountries.slice(0, 10).map((c) => (
                              <button
                                key={c.code}
                                onClick={() => {
                                  setFormData({ ...formData, country: c.name });
                                  setCountrySearch('');
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                <img src={c.flag} alt={c.code} className="w-6 h-4 object-cover rounded" />
                                <span className="text-lg">{c.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={goToNextStep} disabled={!formData.country} className="text-sm text-gray-400 hover:text-gray-900 disabled:opacity-30 font-medium transition-colors">Press Enter ↵</button>
                </motion.div>
              )}

              {currentStep === 'dob' && (
                <motion.div key="dob" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div>
                    <div className="text-4xl font-light mb-6 text-gray-200">05</div>
                    <h2 className="text-3xl mb-4 font-medium">When's your birthday?</h2>
                    <p className="text-sm text-gray-500 mb-4">You must be at least 8 years old</p>
                    <input 
                      type="date" 
                      value={formData.dob} 
                      onChange={(e) => {
                        setFormData({ ...formData, dob: e.target.value });
                        setDobError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && formData.dob) {
                          e.preventDefault();
                          e.stopPropagation();
                          goToNextStep();
                        }
                      }}
                      min="1900-01-01"
                      max={new Date().toISOString().split('T')[0]} 
                      className={`text-2xl w-full bg-transparent border-0 border-b-2 pb-2 outline-none transition-colors ${dobError ? 'border-red-500' : 'border-gray-900'}`}
                      autoFocus 
                    />
                    {dobError && <p className="text-sm text-red-500 mt-2">{dobError}</p>}
                  </div>
                  <button onClick={goToNextStep} disabled={!formData.dob} className="text-sm text-gray-400 hover:text-gray-900 disabled:opacity-30 font-medium transition-colors">Press Enter ↵</button>
                </motion.div>
              )}

              {currentStep === 'bio' && (
                <motion.div key="bio" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div>
                    <div className="text-4xl font-light mb-6 text-gray-200">06</div>
                    <h2 className="text-3xl mb-4 font-medium">Tell us about yourself</h2>
                    <textarea 
                      value={formData.bio} 
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 100) })} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          e.stopPropagation();
                          goToNextStep();
                        }
                      }}
                      className="text-xl w-full bg-transparent border-0 border-b-2 border-gray-900 pb-2 outline-none placeholder:text-gray-300 resize-none" 
                      placeholder="Optional..." 
                      rows={3} 
                      autoFocus 
                    />
                    <div className="text-sm text-gray-400 text-right">{formData.bio.length}/100</div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => goToNextStep()} className="text-gray-400 hover:text-gray-900 font-medium transition-colors">Skip →</button>
                    <button onClick={goToNextStep} disabled={loading} className="px-8 py-3 bg-black text-white rounded-full hover:shadow-lg disabled:opacity-50 transition-all font-medium">Continue</button>
                  </div>
                </motion.div>
              )}

              {currentStep === 'social' && (
                <motion.div key="social" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div>
                    <div className="text-4xl font-light mb-6 text-gray-200">07</div>
                    <h2 className="text-3xl mb-4 font-medium">Add social links</h2>
                    <p className="text-gray-500 mb-6">Optional - Connect your social profiles</p>
                    
                    {!editingSocial && (
                      <div className="space-y-3">
                        {socialPlatforms.map((platform) => {
                          const added = socialLinks.find(l => l.platform === platform.value);
                          const Icon = platform.icon;
                          return (
                            <button
                              key={platform.value}
                              onClick={() => startEditingSocial(platform.value)}
                              className="w-full px-4 py-3 bg-white hover:bg-gray-50 rounded-xl flex items-center gap-3 text-left transition-all border border-black/10 hover:border-black/20 hover:shadow-md"
                            >
                              <Icon className="w-5 h-5 text-gray-600" />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{platform.label}</div>
                                {added && <div className="text-xs text-gray-500 truncate">{added.url}</div>}
                              </div>
                              {added && <Check className="w-4 h-4 text-green-600" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {editingSocial && (
                      <div className="p-4 bg-white rounded-xl border border-black/10 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-medium">{socialPlatforms.find(p => p.value === editingSocial)?.label}</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editSocialUrl}
                            onChange={(e) => setEditSocialUrl(e.target.value)}
                            placeholder={socialPlatforms.find(p => p.value === editingSocial)?.placeholder}
                            className="flex-1 px-4 py-2 text-sm rounded-lg border-2 border-gray-200 bg-white focus:outline-none focus:border-gray-900 transition-colors"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveSocialLink()}
                          />
                          <button onClick={saveSocialLink} className="px-4 py-2 bg-black text-white rounded-full hover:shadow-lg transition-all">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEditingSocial} className="px-4 py-2 bg-white border border-black/10 rounded-full hover:border-black/20 hover:shadow-md transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => handleSubmit()} className="text-gray-400 hover:text-gray-900 font-medium transition-colors">Skip →</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-black text-white rounded-full hover:shadow-lg disabled:opacity-50 transition-all font-medium">{loading ? 'Creating...' : 'Finish'}</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ type: "spring", stiffness: 300, damping: 20 }} 
            className="relative group"
          >
            <div className="absolute inset-0 bg-black rounded-2xl transform translate-x-3 translate-y-3 transition-all group-hover:translate-x-4 group-hover:translate-y-4" />
            <div className="relative bg-white border-2 border-black rounded-2xl p-8 space-y-6 shadow-xl">
              {socialLinks.length > 0 && (
                <div className="absolute top-6 right-6">
                  <div className="flex -space-x-2">
                    {(showAllSocials ? socialLinks : socialLinks.slice(0, 3)).map((link, index) => {
                      const platform = socialPlatforms.find(p => p.value === link.platform);
                      const Icon = platform?.icon || Github;
                      return (
                        <motion.a
                          key={link.platform}
                          href={getSocialUrl(link.platform, link.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Visit ${platform?.label || link.platform} profile`}
                          whileHover={{ scale: 1.15, y: -2, zIndex: 50 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer relative"
                          style={{ 
                            zIndex: socialLinks.length - index,
                            border: `2px solid ${avatar ? `${avatarColor}20` : 'white'}`
                          }}
                        >
                          <Icon className="w-5 h-5 text-gray-600" />
                        </motion.a>
                      );
                    })}
                    {socialLinks.length > 3 && (
                      <motion.div
                        whileHover={{ scale: 1.15, y: -2, zIndex: 50 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAllSocials(!showAllSocials)}
                        aria-label={showAllSocials ? 'Show less social links' : `Show ${socialLinks.length - 3} more social links`}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold cursor-pointer transition-all relative"
                        style={{ 
                          zIndex: 0,
                          border: `2px solid ${avatar ? `${avatarColor}30` : 'white'}`
                        }}
                      >
                        {showAllSocials ? '−' : `+${socialLinks.length - 3}`}
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-24 h-24 rounded-full overflow-hidden border-4 shadow-lg flex-shrink-0 cursor-pointer"
                  style={{ borderColor: avatar ? avatarColor : '#e5e7eb' }}
                >
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white" style={{ backgroundColor: formData.color }}>
                      {initials || '?'}
                    </div>
                  )}
                </motion.div>
                <div className="flex-1">
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    whileHover={{ x: 5 }}
                    className="font-bold text-2xl mb-1 cursor-pointer break-words"
                  >
                    {formData.name || 'Your Name'}
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 0.1 }} 
                    whileHover={{ x: 5 }}
                    className="text-gray-500 text-base mb-2 cursor-pointer break-all"
                  >
                    @{formData.username || 'username'}
                  </motion.div>
                  {selectedCountry && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm text-gray-700 font-medium cursor-pointer transition-colors"
                      style={{ backgroundColor: avatar ? `${avatarColor}15` : '#f3f4f6' }}
                    >
                      <img src={selectedCountry.flag} alt={selectedCountry.code} className="w-5 h-4 object-cover rounded" />
                      <span>{selectedCountry.code}</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {formData.bio && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  className="p-4 bg-gray-50 rounded-xl cursor-pointer transition-all"
                  style={{ borderLeft: avatar ? `4px solid ${avatarColor}` : '4px solid #000' }}
                >
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{formData.bio}</p>
                </motion.div>
              )}

              <div className="flex items-center justify-between text-xs pt-4 border-t-2 border-gray-100">
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div 
                    animate={{ scale: [1, 1.3, 1] }} 
                    transition={{ duration: 2, repeat: Infinity }} 
                    className="w-2.5 h-2.5 rounded-full shadow-sm" 
                    style={{ background: avatar ? avatarColor : '#000' }}
                  />
                  <span className="font-bold text-gray-800 tracking-wide cursor-pointer">MEMBER</span>
                </motion.div>
                <motion.span 
                  whileHover={{ scale: 1.05 }}
                  className="text-gray-500 font-medium cursor-pointer"
                >
                  Joined {joinDate}
                </motion.span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-black"
            >
              <h3 className="text-2xl font-bold mb-2">Create your profile?</h3>
              <p className="text-gray-500 text-sm mb-8">You can always edit your profile later from settings.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmation(false)} 
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-full hover:border-gray-300 transition-all font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmAndCreate} 
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-full hover:shadow-lg transition-all font-medium disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
