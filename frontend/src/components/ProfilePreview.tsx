import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Twitter, Instagram, Github, Linkedin, Globe, Calendar, User } from 'lucide-react';

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

interface ProfileData {
  avatar: string;
  fullName: string;
  username: string;
  bio: string;
  dateOfBirth: string;
  location: string;
  isActive: boolean;
  socialLinks: SocialLink[];
}

interface ProfilePreviewProps {
  data: ProfileData;
}

const getIcon = (platform: string) => {
  const iconMap: { [key: string]: any } = {
    twitter: Twitter,
    instagram: Instagram,
    github: Github,
    linkedin: Linkedin,
    website: Globe,
  };
  return iconMap[platform.toLowerCase()] || Globe;
};

export function ProfilePreview({ data }: ProfilePreviewProps) {
  const { avatar, fullName, username, bio, dateOfBirth, location, socialLinks } = data;

  const complete = Math.round(
    ((fullName ? 1 : 0) + 
     (username ? 1 : 0) + 
     (bio ? 1 : 0) + 
     (avatar ? 1 : 0) + 
     (location ? 1 : 0) + 
     (dateOfBirth ? 1 : 0)) / 6 * 100
  );

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-500">Preview</div>
      
      <motion.div
        layout
        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="w-20 h-20 rounded-xl object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {fullName || 'Your Name'}
            </h3>
            <p className="text-sm text-gray-500">
              @{username || 'username'}
            </p>
          </div>
        </div>

        {bio && (
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
            {bio}
          </p>
        )}

        {(location || dateOfBirth) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {location && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <MapPin className="w-3.5 h-3.5" />
                <span>{location}</span>
              </div>
            )}
            
            {dateOfBirth && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(dateOfBirth).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        )}

        {socialLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((link, index) => {
              const Icon = getIcon(link.platform);
              return (
                <div
                  key={index}
                  className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"
                >
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Profile Completion</span>
          <span className="text-sm font-bold text-gray-900">{complete}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${complete}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
