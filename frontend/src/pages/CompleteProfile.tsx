import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { DrawAvatar } from '../components/DrawAvatar';
import { GridBg } from '../components/GridBg';
import { AnimatedTitle } from '../components/AnimatedTitle';
import { User, Upload, Pencil, Sparkles, Check, X, ChevronDown, Instagram, Github, Linkedin, MessageCircle, Send } from 'lucide-react';
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

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) localStorage.setItem('accessToken', token);
    
    fetchCountries().then(data => {
      console.log('Fetched countries:', data.length);
      setCountries(data);
      setLoadingCountries(false);
    }).catch(err => {
      console.error('Error fetching countries:', err);
      setLoadingCountries(false);
    });
  }, [searchParams]);
  
  const [avatar, setAvatar] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [dob, setDob] = useState('');
  const [socialLinks, setSocialLinks] = useState<Array<{platform: string, url: string}>>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  
  const [showDraw, setShowDraw] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);
  const [editingSocial, setEditingSocial] = useState<string | null>(null);
  const [editSocialUrl, setEditSocialUrl] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.email) setUserEmail(user.email);
  }, []);

  useEffect(() => {
    const checkUsername = async () => {
      if (!username || username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      
      setUsernameChecking(true);
      try {
        const response = await api.get(`/user/check-username/${username}`);
        setUsernameAvailable(response.data.available);
        if (!response.data.available) {
          setUsernameSuggestions(generateSmartUsernameSuggestions(username, fullName));
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
  }, [username, fullName]);

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountry = countries.find(c => c.name === country);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
        setShowDraw(false);
        setShowPresets(false);
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

  const shareCard = async () => {
    const cardElement = document.getElementById('profile-card');
    if (!cardElement) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardElement, { backgroundColor: '#ffffff' });
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'profile-card.png', { type: 'image/png' });
          if (navigator.share && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: 'My ScribbleX Profile' });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'profile-card.png';
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      });
    } catch (error) {
      toast.error('Failed to share card');
    }
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!username.trim() || username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (usernameAvailable === false) {
      toast.error('Username is already taken');
      return;
    }

    if (!country) {
      toast.error('Please select your country');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/user/complete-profile', {
        name: fullName,
        username: username,
        avatar: avatar,
        bio: bio,
        location: country,
        dob: dob,
        socialLinks: socialLinks
      });
      
      if (response.data.success && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        toast.success('Welcome to ScribbleX!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = fullName.trim() && 
                    username.trim().length >= 3 && 
                    username !== fullName.toLowerCase().replace(/\s+/g, '') &&
                    usernameAvailable === true && 
                    country &&
                    dob;

  return (
    <div className="relative min-h-screen bg-[#fafaf9] overflow-hidden">
      <GridBg />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-8 z-20"
      >
        <h1 className="text-[28px] tracking-tight text-[#1a1a1a]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <AnimatedTitle noFlicker />
        </h1>
      </motion.div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <h2 className="text-[48px] font-bold text-[#1a1a1a] mb-3 tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Complete Your Profile</h2>
          <p className="text-[16px] text-[#666666]" style={{ fontFamily: 'Inter, sans-serif' }}>Just a few details to get started</p>
        </motion.div>

        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-10 shadow-sm border border-black/[0.06] overflow-visible max-h-none">
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-semibold text-[#666666] uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Email Address</label>
                <input 
                  type="email" 
                  value={userEmail} 
                  disabled 
                  className="w-full px-0 py-3 text-[15px] border-0 border-b-2 border-gray-200 bg-transparent text-gray-400 cursor-not-allowed focus:outline-none" 
                  style={{ fontFamily: 'Inter, sans-serif' }} 
                />
              </div>
              <div className="text-center pt-4 pb-2">
                <label className="block text-[11px] font-semibold text-[#666666] uppercase tracking-wider mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>Profile Picture</label>
                <div className="flex flex-col items-center gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    className="relative w-[108px] h-[108px] mx-auto rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-200 hover:ring-4 hover:ring-indigo-400/20"
                  >
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
                        <User className="w-12 h-12 text-indigo-300" />
                      </div>
                    )}
                  </motion.div>
                  <div className="flex justify-center gap-3">
                    <input type="file" id="avatar" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => document.getElementById('avatar')?.click()} 
                      className="px-4 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 flex items-center gap-2"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <Upload className="w-4 h-4" />Upload
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setShowDraw(!showDraw); setShowPresets(false); }} 
                      className="px-4 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 flex items-center gap-2"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <Pencil className="w-4 h-4" />Draw
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setShowPresets(!showPresets); setShowDraw(false); }} 
                      className="px-4 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 flex items-center gap-2"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <Sparkles className="w-4 h-4" />Presets
                    </motion.button>
                  </div>
                </div>

                {showDraw && (
                  <div className="mt-4">
                    <DrawAvatar onDone={(dataUrl) => { setAvatar(dataUrl); setShowDraw(false); }} />
                  </div>
                )}

                {showPresets && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 grid grid-cols-5 gap-3"
                  >
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
                      <motion.button 
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setAvatar(url); setShowPresets(false); }} 
                        className="aspect-square rounded-full overflow-hidden border-2 border-black/5 hover:border-black/15 transition-all shadow-sm hover:shadow-md bg-white"
                      >
                        <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full" />
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#666666] uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Full Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter your full name" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  className="w-full px-0 py-3 text-[15px] border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none focus:border-indigo-500 transition-colors" 
                  style={{ fontFamily: 'Inter, sans-serif' }} 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#666666] uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Username *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Choose a unique username" 
                    value={username} 
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      if (val.length <= 20) setUsername(val);
                    }} 
                    className="w-full px-0 py-3 pr-12 text-[15px] border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none focus:border-indigo-500 transition-colors" 
                    style={{ fontFamily: 'Inter, sans-serif' }} 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameChecking && <div className="w-5 h-5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />}
                    {!usernameChecking && usernameAvailable === true && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
                        <Check className="w-5 h-5 text-green-600" />
                      </motion.div>
                    )}
                    {!usernameChecking && usernameAvailable === false && <X className="w-5 h-5 text-red-600" />}
                  </div>
                </div>
                {username && (
                  <div className="mt-2">
                    <p className="text-sm text-[#666666]" style={{ fontFamily: 'Inter, sans-serif' }}>
                      scribbleX.com/@{username}
                      {!usernameChecking && usernameAvailable === true && <span className="text-green-600 ml-2 font-medium">✓ Available</span>}
                      {!usernameChecking && usernameAvailable === false && <span className="text-red-600 ml-2 font-medium">✗ Taken</span>}
                    </p>
                    {username.length < 3 && <p className="text-xs text-red-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Username must be at least 3 characters</p>}
                    {username === fullName.toLowerCase().replace(/\s+/g, '') && <p className="text-xs text-red-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Username cannot be same as name</p>}
                    {usernameSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-sm text-[#666666]" style={{ fontFamily: 'Inter, sans-serif' }}>Try:</span>
                        {usernameSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => setUsername(suggestion)}
                            className="text-sm px-3 py-1 bg-[#fafaf9] text-[#1a1a1a] rounded-full hover:bg-[#f5f5f4] transition-all border border-black/5"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#666666] uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Country *</label>
                <div className="relative">
                  <button 
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)} 
                    className="w-full px-0 py-3 text-[15px] border-0 border-b-2 border-gray-200 bg-transparent hover:border-indigo-500 focus:outline-none focus:border-indigo-500 flex items-center justify-between text-left transition-colors"
                  >
                    {selectedCountry ? (
                      <span className="flex items-center gap-3">
                        <img src={selectedCountry.flag} alt={selectedCountry.name} className="w-6 h-4 object-cover rounded" />
                        <span className="text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif' }}>{selectedCountry.name}</span>
                      </span>
                    ) : loadingCountries ? (
                      <span className="text-[#999999]" style={{ fontFamily: 'Inter, sans-serif' }}>Loading countries...</span>
                    ) : (
                      <span className="text-[#999999]" style={{ fontFamily: 'Inter, sans-serif' }}>Select your country</span>
                    )}
                    <ChevronDown className={`w-5 h-5 text-[#999999] transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showCountryDropdown && (
                    <div className="absolute z-[100] w-full mt-2 bg-white border border-black/10 rounded-lg shadow-xl overflow-hidden">
                      <div className="p-3 border-b border-black/5 sticky top-0 bg-white z-10">
                        <input 
                          type="text" 
                          placeholder="Search countries..." 
                          value={countrySearch} 
                          onChange={(e) => setCountrySearch(e.target.value)} 
                          autoFocus
                          className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5" 
                          style={{ fontFamily: 'Inter, sans-serif' }} 
                        />
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {filteredCountries.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-[#999999]" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {countrySearch ? 'No countries found' : 'Loading...'}
                          </div>
                        ) : (
                          filteredCountries.map((c) => (
                            <button 
                              key={c.code} 
                              onClick={() => { setCountry(c.name); setShowCountryDropdown(false); setCountrySearch(''); }} 
                              className="w-full px-4 py-3 hover:bg-[#fafaf9] flex items-center gap-3 text-left transition-colors"
                            >
                              <img src={c.flag} alt={c.name} className="w-6 h-4 object-cover rounded" />
                              <span className="text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif' }}>{c.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#666666] uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Date of Birth *</label>
                <input 
                  type="date" 
                  value={dob} 
                  onChange={(e) => setDob(e.target.value)} 
                  max={new Date().toISOString().split('T')[0]} 
                  className="w-full px-0 py-3 text-[15px] border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none focus:border-indigo-500 transition-colors" 
                  style={{ fontFamily: 'Inter, sans-serif' }} 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Bio (Optional)</label>
                <textarea 
                  placeholder="Tell us about yourself..." 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value.slice(0, 160))} 
                  rows={3} 
                  className="w-full px-0 py-3 text-[15px] border-0 border-b-2 border-gray-200 bg-transparent resize-none focus:outline-none focus:border-indigo-500 transition-colors" 
                  style={{ fontFamily: 'Inter, sans-serif' }} 
                />
                <div className="text-right text-xs text-[#999999] mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>{bio.length}/160</div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Social Links (Optional)</label>
                
                {!editingSocial && (
                  <div className="relative">
                    <button
                      onClick={() => setShowSocialDropdown(!showSocialDropdown)}
                      className="w-full px-0 py-3 text-[15px] border-0 border-b-2 border-gray-200 bg-transparent hover:border-indigo-500 focus:outline-none focus:border-indigo-500 flex items-center justify-between text-left transition-colors"
                    >
                      <span className="text-[#666666]" style={{ fontFamily: 'Inter, sans-serif' }}>Add social media</span>
                      <ChevronDown className={`w-5 h-5 text-[#999999] transition-transform ${showSocialDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showSocialDropdown && (
                      <div className="absolute left-0 right-0 z-[100] mt-2 bg-white border border-black/[0.06] rounded-2xl shadow-2xl max-h-64 overflow-y-auto">
                        {socialPlatforms.map((platform) => {
                          const added = socialLinks.find(l => l.platform === platform.value);
                          const Icon = platform.icon;
                          return (
                            <button
                              key={platform.value}
                              onClick={() => startEditingSocial(platform.value)}
                              className="w-full px-4 py-3 hover:bg-[#fafaf9] flex items-center gap-3 text-left transition-colors border-b border-black/5 last:border-0"
                            >
                              <Icon className="w-5 h-5 text-[#666666]" />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-[#1a1a1a]" style={{ fontFamily: 'Inter, sans-serif' }}>{platform.label}</div>
                                {added && <div className="text-xs text-[#999999] truncate" style={{ fontFamily: 'Inter, sans-serif' }}>{added.url}</div>}
                              </div>
                              {added && <Check className="w-4 h-4 text-green-600" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {editingSocial && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-[#fafaf9] rounded-lg border border-black/10"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>{socialPlatforms.find(p => p.value === editingSocial)?.label}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editSocialUrl}
                        onChange={(e) => setEditSocialUrl(e.target.value)}
                        placeholder={socialPlatforms.find(p => p.value === editingSocial)?.placeholder}
                        className="flex-1 px-4 py-3 text-sm rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                        autoFocus
                        onKeyPress={(e) => e.key === 'Enter' && saveSocialLink()}
                      />
                      <button onClick={saveSocialLink} className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-all">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEditingSocial} className="px-4 py-2 bg-white border border-black/10 rounded-lg hover:bg-[#fafaf9] transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              <motion.button 
                onClick={handleSubmit} 
                disabled={!canSubmit || loading}
                whileHover={{ scale: canSubmit && !loading ? 1.02 : 1 }}
                whileTap={{ scale: canSubmit && !loading ? 0.98 : 1 }}
                className="w-full py-4 rounded-full bg-[#1a1a1a] text-white font-semibold text-[15px] hover:bg-[#2a2a2a] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-8"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {loading ? 'Creating...' : 'Complete Profile'}
              </motion.button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:sticky lg:top-8 h-fit"
          >
            <motion.div
              className="bg-white rounded-2xl p-8 border border-black/5 shadow-lg relative overflow-hidden"
            >
              <div className="space-y-6" id="profile-card">
                {socialLinks.length > 0 && (
                  <div className="absolute top-8 right-8 flex gap-2">
                    {socialLinks.map((link, index) => {
                      const platform = socialPlatforms.find(p => p.value === link.platform);
                      const Icon = platform?.icon || Github;
                      const urls: Record<string, (url: string) => string> = {
                        instagram: (url) => `https://instagram.com/${url.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '')}`,
                        discord: (url) => url.startsWith('http') ? url : `https://discord.com/users/${url}`,
                        github: (url) => `https://github.com/${url.replace(/^@/, '').replace(/^https?:\/\/(www\.)?github\.com\//, '')}`,
                        snapchat: (url) => `https://snapchat.com/add/${url.replace(/^@/, '').replace(/^https?:\/\/(www\.)?snapchat\.com\/add\//, '')}`,
                        linkedin: (url) => url.startsWith('http') ? url : `https://linkedin.com/in/${url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}`,
                      };
                      return (
                        <motion.a
                          key={index}
                          href={urls[link.platform]?.(link.url) || link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.15 }}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-black/10 bg-white hover:bg-[#fafaf9] transition-all duration-150"
                        >
                          <Icon className="w-4 h-4 text-[#666666]" />
                        </motion.a>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-start gap-6">
                  <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                    {avatar ? (
                      <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-black/5 shadow-md">
                        <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ring-2 ring-black/5 shadow-md">
                        <User className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-[#1a1a1a] mb-1 truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{fullName || 'Your Name'}</h3>
                    <p className="text-sm text-[#666666] mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>@{username || 'username'}</p>
                    {country && selectedCountry && (
                      <div className="flex items-center gap-2 text-xs text-[#999999]">
                        <img src={selectedCountry.flag} alt={selectedCountry.name} className="w-4 h-3 object-cover rounded" />
                        <span style={{ fontFamily: 'Inter, sans-serif' }}>{selectedCountry.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {bio && (
                  <div className="p-4 bg-[#fafaf9] rounded-xl border border-black/5">
                    <p className="text-sm text-[#666666] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>"{bio}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
