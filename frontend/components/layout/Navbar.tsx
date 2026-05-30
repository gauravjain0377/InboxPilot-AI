'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Inbox,
  Send,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Clock,
  Megaphone,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useUserStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { href: '/inbox', label: 'Inbox', icon: Inbox },
    { href: '/compose', label: 'Compose', icon: Send },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/followups', label: 'Follow-ups', icon: Clock },
    { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-900 hidden sm:block">
                  InboxPilot AI
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-500 hidden sm:block transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      Email Signature
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-gray-100">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
