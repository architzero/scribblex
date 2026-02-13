export interface Country {
  code: string;
  name: string;
  flag: string;
}

let cachedCountries: Country[] | null = null;

const fallbackCountries: Country[] = [
  { code: 'US', name: 'United States', flag: 'https://flagcdn.com/w40/us.png' },
  { code: 'GB', name: 'United Kingdom', flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'CA', name: 'Canada', flag: 'https://flagcdn.com/w40/ca.png' },
  { code: 'AU', name: 'Australia', flag: 'https://flagcdn.com/w40/au.png' },
  { code: 'IN', name: 'India', flag: 'https://flagcdn.com/w40/in.png' },
  { code: 'DE', name: 'Germany', flag: 'https://flagcdn.com/w40/de.png' },
  { code: 'FR', name: 'France', flag: 'https://flagcdn.com/w40/fr.png' },
  { code: 'JP', name: 'Japan', flag: 'https://flagcdn.com/w40/jp.png' },
  { code: 'CN', name: 'China', flag: 'https://flagcdn.com/w40/cn.png' },
  { code: 'BR', name: 'Brazil', flag: 'https://flagcdn.com/w40/br.png' },
  { code: 'MX', name: 'Mexico', flag: 'https://flagcdn.com/w40/mx.png' },
  { code: 'ES', name: 'Spain', flag: 'https://flagcdn.com/w40/es.png' },
  { code: 'IT', name: 'Italy', flag: 'https://flagcdn.com/w40/it.png' },
  { code: 'NL', name: 'Netherlands', flag: 'https://flagcdn.com/w40/nl.png' },
  { code: 'SE', name: 'Sweden', flag: 'https://flagcdn.com/w40/se.png' },
  { code: 'NO', name: 'Norway', flag: 'https://flagcdn.com/w40/no.png' },
  { code: 'DK', name: 'Denmark', flag: 'https://flagcdn.com/w40/dk.png' },
  { code: 'FI', name: 'Finland', flag: 'https://flagcdn.com/w40/fi.png' },
  { code: 'PL', name: 'Poland', flag: 'https://flagcdn.com/w40/pl.png' },
  { code: 'RU', name: 'Russia', flag: 'https://flagcdn.com/w40/ru.png' },
  { code: 'KR', name: 'South Korea', flag: 'https://flagcdn.com/w40/kr.png' },
  { code: 'SG', name: 'Singapore', flag: 'https://flagcdn.com/w40/sg.png' },
  { code: 'AE', name: 'United Arab Emirates', flag: 'https://flagcdn.com/w40/ae.png' },
  { code: 'SA', name: 'Saudi Arabia', flag: 'https://flagcdn.com/w40/sa.png' },
  { code: 'ZA', name: 'South Africa', flag: 'https://flagcdn.com/w40/za.png' },
];

export const fetchCountries = async (): Promise<Country[]> => {
  if (cachedCountries) return cachedCountries;

  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name,flags');
    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('Invalid data format:', data);
      return [];
    }
    
    cachedCountries = data
      .map((country: any) => ({
        code: country.cca2,
        name: country.name.common,
        flag: country.flags.png,
      }))
      .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
    
    return cachedCountries;
  } catch (error) {
    console.error('Failed to fetch countries:', error);
    return [];
  }
};

export const generateSmartUsernameSuggestions = (username: string, fullName: string): string[] => {
  const suggestions: string[] = [];
  const nameParts = fullName.toLowerCase().split(' ').filter(p => p.length > 0);
  
  if (nameParts.length >= 2) {
    suggestions.push(`${nameParts[0]}_${nameParts[1]}`);
    suggestions.push(`${nameParts[0]}${nameParts[1]}`);
  }
  
  if (nameParts.length > 0 && nameParts[0] !== username) {
    suggestions.push(`${nameParts[0]}_${username}`);
  }
  
  const year = new Date().getFullYear();
  suggestions.push(`${username}${year}`);
  suggestions.push(`${username}_official`);
  
  return [...new Set(suggestions)].slice(0, 3);
};

export const generateAvatarUrl = (seed: string, style: 'avataaars' | 'bottts' | 'lorelei' | 'notionists' | 'adventurer' = 'adventurer'): string => {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`;
};
