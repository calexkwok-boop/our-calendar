import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Plus, X, ChevronLeft, ChevronRight, Edit2, Trash2, Tag, Mic, MicOff, Settings, Eye, EyeOff, Lock, User, Bell, BellOff, AlertTriangle, Repeat, Moon, Sun } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
'https://qyifsblebdnlcyurrgbt.supabase.co',
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWZzYmxlYmRubGN5dXJyZ2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTA1NTcsImV4cCI6MjA4NzAyNjU1N30.S_DUVQCwkBWrbSWoujQipb_5jz1d5UCsU_gSwWAGzTk'
);

// Supabase storage wrapper
const storage = {
  get: async (key, shared = false) => {
    if (key === 'calendar-user' || key === 'calendar-title') {
      const value = localStorage.getItem(key);
      return value ? { key, value, shared } : null;
    }
    return { key, value: null, shared };
  },
  set: async (key, value, shared = false) => {
    if (key === 'calendar-user' || key.includes('notification') || key === 'calendar-title') {
      localStorage.setItem(key, value);
      return { key, value, shared };
    }
    return { key, value, shared: true };
  }
};

if (typeof window !== 'undefined') {
  window.storage = storage;
  window.supabase = supabase;
}

const DEFAULT_CATEGORIES = {
  work: { label: 'Work', color: 'bg-blue-500', lightBg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  wife: { label: 'Wife', color: 'bg-rose-500', lightBg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  daughter: { label: 'Daughter', color: 'bg-pink-500', lightBg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  family: { label: 'Family', color: 'bg-purple-500', lightBg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  personal: { label: 'Personal', color: 'bg-emerald-500', lightBg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  health: { label: 'Health', color: 'bg-teal-500', lightBg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
  social: { label: 'Social', color: 'bg-amber-500', lightBg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  other: { label: 'Other', color: 'bg-gray-500', lightBg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' }
};

const COLOR_OPTIONS = [
  { name: 'Blue', color: 'bg-blue-500', lightBg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { name: 'Rose', color: 'bg-rose-500', lightBg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  { name: 'Pink', color: 'bg-pink-500', lightBg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  { name: 'Purple', color: 'bg-purple-500', lightBg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  { name: 'Emerald', color: 'bg-emerald-500', lightBg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  { name: 'Teal', color: 'bg-teal-500', lightBg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
  { name: 'Amber', color: 'bg-amber-500', lightBg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  { name: 'Orange', color: 'bg-orange-500', lightBg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  { name: 'Red', color: 'bg-red-500', lightBg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  { name: 'Indigo', color: 'bg-indigo-500', lightBg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  { name: 'Cyan', color: 'bg-cyan-500', lightBg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
  { name: 'Lime', color: 'bg-lime-500', lightBg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-700' },
  { name: 'Gray', color: 'bg-gray-500', lightBg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' },
];

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [quickEntry, setQuickEntry] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_OPTIONS[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showPrivateEvents, setShowPrivateEvents] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);
  const [currentUser, setCurrentUser] = useState('');
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [userNameInput, setUserNameInput] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isUrgent, setIsUrgent] = useState(false);
  const [onlyNotifyUrgent, setOnlyNotifyUrgent] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showTimePrompt, setShowTimePrompt] = useState(false);
  const [pendingEvent, setPendingEvent] = useState(null);
  const [calendarTitle, setCalendarTitle] = useState('Our Calendar');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(true);
  const [authError, setAuthError] = useState('');
  const [firstTapDate, setFirstTapDate] = useState(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isAnnual, setIsAnnual] = useState(false);
  const [holidays, setHolidays] = useState({});
  const [showHolidays, setShowHolidays] = useState(true);
  const [sharedCalendars, setSharedCalendars] = useState([]); // calendars others shared with me
  const [myShares, setMyShares] = useState([]); // people I've shared with
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareEmailInput, setShareEmailInput] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [activeCalendars, setActiveCalendars] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const getDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const isSameDay = (date1, date2) => {
    return date1 && date2 &&
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  };

  const fetchHolidays = async (year) => {
    if (holidays[year]) return; // already fetched
    try {
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`);
      if (!res.ok) return;
      const data = await res.json();
      setHolidays(prev => ({ ...prev, [year]: data }));
    } catch (err) {
      console.error('Failed to fetch holidays:', err);
    }
  };

  // Fetch holidays for visible years whenever month changes
  useEffect(() => {
    const year = currentDate.getFullYear();
    fetchHolidays(year);
    // Also pre-fetch adjacent year in case calendar spans it
    const month = currentDate.getMonth();
    if (month === 11) fetchHolidays(year + 1);
    if (month === 0) fetchHolidays(year - 1);
  }, [currentDate]);

  // Helper: get holiday info for a specific date key
  const getHolidayForDate = (dateKey) => {
    if (!showHolidays) return null;
    const year = parseInt(dateKey.split('-')[0]);
    const yearHolidays = holidays[year] || [];
    return yearHolidays.find(h => h.date === dateKey) || null;
  };
  const handleDateTap = (date) => {
    if (!date) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;

    // Double tap detection (within 300ms)
    if (timeSinceLastTap < 300 && firstTapDate && isSameDay(firstTapDate, date)) {
      // Double tap on same date - start multi-day selection
      setSelectedDates([date]);
      setSelectionStart(date);
      setFirstTapDate(null);
    } else if (selectionStart && !isSameDay(selectionStart, date)) {
      // We have a start date, this is the end date
      const start = new Date(Math.min(selectionStart, date));
      const end = new Date(Math.max(selectionStart, date));
      const dates = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
      setSelectedDates(dates);
      setSelectionStart(null);
    } else {
      // Single tap - select this date
      setSelectedDate(date);
      setFirstTapDate(date);
      setSelectedDates([]);
      setSelectionStart(null);
    }

    setLastTapTime(now);
  };

  const handleDateMouseEnter = (date) => {
    if (!date || !isSelecting || !selectionStart) return;
    const start = new Date(Math.min(selectionStart, date));
    const end = new Date(Math.max(selectionStart, date));
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    setSelectedDates(dates);
  };

  const handleDateMouseUp = () => {
    setIsSelecting(false);
    if (selectedDates.length > 0) {
      setSelectedDate(selectedDates[0]);
    }
  };

  // Returns all events for a given date, including virtual annual recurrences and holidays
  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateKey = getDateKey(date);
    const directEvents = events[dateKey] || [];

    // Find annual events from any year that match this month+day
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const virtualAnnual = [];
    Object.values(events).forEach(dateEvents => {
      dateEvents.forEach(event => {
        if (!event.isAnnual) return;
        if (event.annualMonth === month && event.annualDay === day) {
          const alreadyDirect = directEvents.some(e => e.id === event.id);
          if (!alreadyDirect) {
            virtualAnnual.push({ ...event, date: dateKey, isVirtualAnnual: true });
          }
        }
      });
    });

    // Inject holiday if present
    const holidayEvents = [];
    if (showHolidays) {
      const holiday = getHolidayForDate(dateKey);
      if (holiday) {
        holidayEvents.push({
          id: `holiday-${dateKey}`,
          title: holiday.localName,
          fullName: holiday.name,
          date: dateKey,
          time: null,
          category: 'other',
          isHoliday: true,
          isReadOnly: true,
        });
      }
    }

    return [...holidayEvents, ...directEvents, ...virtualAnnual].sort((a, b) => {
      if (a.isHoliday) return -1; // holidays always first
      if (b.isHoliday) return 1;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  };

  const saveEvents = async (newEvents) => {
    try {
      setEvents(newEvents);
      const eventsArray = [];
      Object.entries(newEvents).forEach(([date, dateEvents]) => {
        dateEvents.forEach(event => {
          // Only save events owned by current user
          if (event.userId && event.userId !== user?.id) return;
          eventsArray.push({
            id: event.id,
            date: event.date,
            title: event.title,
            time: event.time,
            category: event.category,
            is_private: event.isPrivate || false,
            is_private_for: event.isPrivate ? event.createdBy : null,
            is_urgent: event.isUrgent || false,
            is_multi_day: event.isMultiDay || false,
            multi_day_id: event.multiDayId,
            is_annual: event.isAnnual || false,
            annual_month: event.annualMonth || null,
            annual_day: event.annualDay || null,
            created_by: event.createdBy,
            created_at: event.createdAt,
            user_id: user?.id
          });
        });
      });
      // Only delete and reinsert current user's events
      await supabase.from('events').delete().eq('user_id', user?.id);
      if (eventsArray.length > 0) {
        const { error } = await supabase.from('events').insert(eventsArray);
        if (error) console.error('Error saving events to Supabase:', error);
      }
    } catch (error) {
      console.error('Error saving events:', error);
    }
  };

  const saveCategories = async (newCategories) => {
    try {
      setCategories(newCategories);
      const categoriesArray = Object.entries(newCategories).map(([key, cat]) => ({
        key,
        label: cat.label,
        color: cat.color,
        light_bg: cat.lightBg,
        border: cat.border,
        text: cat.text,
        user_id: user?.id
      }));
      await supabase.from('categories').delete().eq('user_id', user?.id);
      const { error } = await supabase.from('categories').insert(categoriesArray);
      if (error) console.error('Error saving categories to Supabase:', error);
    } catch (error) {
      console.error('Error saving categories:', error);
    }
  };

  const saveUser = async (userName) => {
    if (!userName || userName.trim() === '') userName = 'User';
    try {
      await window.storage.set('calendar-user', userName, false);
      setCurrentUser(userName);
      setShowUserSetup(false);
    } catch (error) {
      console.error('Error saving user:', error);
      setCurrentUser(userName);
      setShowUserSetup(false);
    }
  };

  const handleMagicLink = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAuthError('');
    if (!email) {
      setAuthError('Please enter your email address first.');
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthError('✅ Magic link sent! Check your email.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowAuth(true);
  };

  const handleShareCalendar = async () => {
    if (!shareEmailInput.trim()) return;
    const email = shareEmailInput.trim().toLowerCase();

    // Check not already shared
    if (myShares.some(s => s.shared_with_email === email)) {
      setShareMessage('Already shared with this email.');
      return;
    }

    // Check not sharing with yourself
    if (email === user?.email) {
      setShareMessage("You can't share with yourself.");
      return;
    }

    const { error } = await supabase.from('shared_access').insert({
      owner_id: user.id,
      shared_with_email: email,
    });

    if (error) {
      setShareMessage('Error sharing calendar. Try again.');
      console.error(error);
    } else {
      setMyShares(prev => [...prev, { owner_id: user.id, shared_with_email: email }]);
      setShareEmailInput('');
      setShareMessage(`✅ Shared! When ${email} logs in they'll see your calendar.`);
    }
  };

  const handleRemoveShare = async (shareEmail) => {
    const { error } = await supabase
      .from('shared_access')
      .delete()
      .eq('owner_id', user.id)
      .eq('shared_with_email', shareEmail);

    if (!error) {
      setMyShares(prev => prev.filter(s => s.shared_with_email !== shareEmail));
      setShareMessage(`Removed access for ${shareEmail}.`);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        const userEmail = session?.user?.email;
        if (!userId) return;

        // Load my own events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', userId);

        // Load calendars shared WITH me (by email)
        const { data: sharedWithMe } = await supabase
          .from('shared_access')
          .select('*')
          .eq('shared_with_email', userEmail);

        // Update shared_with_id if not yet set (first time they log in)
        if (sharedWithMe && sharedWithMe.length > 0) {
          for (const share of sharedWithMe) {
            if (!share.shared_with_id) {
              await supabase
                .from('shared_access')
                .update({ shared_with_id: userId })
                .eq('id', share.id);
            }
          }
          setSharedCalendars(sharedWithMe);

          // Load events from all owners who shared with me
          const ownerIds = sharedWithMe.map(s => s.owner_id);
          setActiveCalendars(ownerIds);

          const { data: sharedEventsData } = await supabase
            .from('events')
            .select('*')
            .in('user_id', ownerIds);

          // Merge own events + shared events
          const allEventsData = [...(eventsData || []), ...(sharedEventsData || [])];
          const eventsObj = {};
          allEventsData.forEach(event => {
            if (!eventsObj[event.date]) eventsObj[event.date] = [];
            eventsObj[event.date].push({
              id: event.id,
              title: event.title,
              time: event.time,
              date: event.date,
              category: event.category,
              isPrivate: event.is_private,
              isUrgent: event.is_urgent,
              isMultiDay: event.is_multi_day,
              multiDayId: event.multi_day_id,
              isAnnual: event.is_annual || false,
              annualMonth: event.annual_month || null,
              annualDay: event.annual_day || null,
              createdBy: event.created_by,
              createdAt: event.created_at,
              userId: event.user_id,
              isShared: event.user_id !== userId
            });
          });
          setEvents(eventsObj);
          if (typeof window !== 'undefined') window.events = eventsObj;
        } else {
          setSharedCalendars([]);
          if (eventsError) {
            console.error('Error loading events:', eventsError);
          } else if (eventsData) {
            const eventsObj = {};
            eventsData.forEach(event => {
              if (!eventsObj[event.date]) eventsObj[event.date] = [];
              eventsObj[event.date].push({
                id: event.id,
                title: event.title,
                time: event.time,
                date: event.date,
                category: event.category,
                isPrivate: event.is_private,
                isUrgent: event.is_urgent,
                isMultiDay: event.is_multi_day,
                multiDayId: event.multi_day_id,
                isAnnual: event.is_annual || false,
                annualMonth: event.annual_month || null,
                annualDay: event.annual_day || null,
                createdBy: event.created_by,
                createdAt: event.created_at,
                userId: event.user_id,
                isShared: false
              });
            });
            setEvents(eventsObj);
            if (typeof window !== 'undefined') window.events = eventsObj;
          }
        }

        // Load people I've shared with
        const { data: mySharesData } = await supabase
          .from('shared_access')
          .select('*')
          .eq('owner_id', userId);
        setMyShares(mySharesData || []);

        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId);

        if (categoriesData && categoriesData.length > 0) {
          const categoriesObj = {};
          categoriesData.forEach(cat => {
            categoriesObj[cat.key] = {
              label: cat.label,
              color: cat.color,
              lightBg: cat.light_bg,
              border: cat.border,
              text: cat.text
            };
          });
          setCategories(categoriesObj);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }

        const titleKey = `calendar-title-${userId}`;
        const savedTitle = localStorage.getItem(titleKey);
        if (savedTitle) setCalendarTitle(savedTitle);
        else setCalendarTitle('Our Calendar');

        const userResult = await window.storage.get('calendar-user', false);
        if (userResult && userResult.value) {
          setCurrentUser(userResult.value);
          setShowUserSetup(false);
        } else {
          setShowUserSetup(true);
        }
      } catch (error) {
        console.log('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const eventsSubscription = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        loadData();
      })
      .subscribe();

    return () => eventsSubscription.unsubscribe();
  }, []);

  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setShowAuth(!session?.user);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setShowAuth(!session?.user);
      if (session?.user) setCurrentUser(session.user.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check notification permission on load
  useEffect(() => {
    if ('Notification' in window) setNotificationPermission(Notification.permission);
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        await window.storage.set('notifications-enabled', 'true', false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled && notificationPermission !== 'granted') {
      await requestNotificationPermission();
    } else {
      const newState = !notificationsEnabled;
      setNotificationsEnabled(newState);
      await window.storage.set('notifications-enabled', newState.toString(), false);
    }
  };

  // Check for upcoming events and send notifications
  useEffect(() => {
    if (!notificationsEnabled) return;
    const checkNotifications = () => {
      const now = new Date();
      Object.entries(events).forEach(([dateKey, dateEvents]) => {
        const eventDate = new Date(dateKey);
        dateEvents.forEach(event => {
          if (event.isPrivate && showPrivateEvents === false) return;
          if (onlyNotifyUrgent && !event.isUrgent) return;
          const timeDiff = eventDate - now;
          const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          const urgentPrefix = event.isUrgent ? '🚨 URGENT: ' : '';
          if (daysUntil === 7) {
            new Notification(`${urgentPrefix}📅 Event in 1 Week`, {
              body: `${event.title} - ${eventDate.toLocaleDateString()}`,
              tag: `${event.id}-week`
            });
          }
          if (daysUntil === 1) {
            new Notification(`${urgentPrefix}⚠️ Event Tomorrow!`, {
              body: `${event.title} - ${eventDate.toLocaleDateString()}`,
              tag: `${event.id}-day`
            });
          }
        });
      });
    };
    checkNotifications();
    const interval = setInterval(checkNotifications, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [events, notificationsEnabled, showPrivateEvents, onlyNotifyUrgent]);

  // Load notification preference
  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const result = await window.storage.get('notifications-enabled', false);
        if (result && result.value === 'true') setNotificationsEnabled(true);
        const urgentResult = await window.storage.get('notify-urgent-only', false);
        if (urgentResult && urgentResult.value === 'true') setOnlyNotifyUrgent(true);
      } catch (error) {
        console.log('No notification preference found');
      }
    };
    loadNotificationPreference();
  }, []);

  // Global mouse up handler for selections
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) setIsSelecting(false);
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting]);

  const processVoiceCommand = (transcript) => {
    const text = transcript.toLowerCase();
    let targetDate = new Date(selectedDate);

    const dateMatch = text.match(/(?:on\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
    if (dateMatch) {
      const month = parseInt(dateMatch[1]) - 1;
      const day = parseInt(dateMatch[2]);
      const year = dateMatch[3] ? (dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3])) : targetDate.getFullYear();
      targetDate = new Date(year, month, day);
    } else {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      for (let i = 0; i < days.length; i++) {
        if (text.includes(days[i])) {
          const today = new Date();
          const currentDay = today.getDay();
          const daysUntil = (i - currentDay + 7) % 7 || 7;
          targetDate = new Date(today);
          targetDate.setDate(today.getDate() + daysUntil);
          break;
        }
      }
      if (text.includes('today')) {
        targetDate = new Date();
      } else if (text.includes('tomorrow')) {
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 1);
      }
    }

    const timeMatch = text.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/);
    let time = null;
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const meridiem = timeMatch[3]?.replace(/\./g, '').toLowerCase();
      if (meridiem === 'pm' && hours !== 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      if (!meridiem && hours < 8) hours += 12;
      time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    let title = transcript;
    title = title.replace(/(?:schedule|add|create|new)\s+/gi, '');
    title = title.replace(/\s+(?:on|at|for)\s+.*$/i, '');
    if (dateMatch) title = title.replace(dateMatch[0], '');
    if (timeMatch) title = title.replace(timeMatch[0], '');
    title = title.trim();

    const dateKey = getDateKey(targetDate);
    const newEvent = {
      id: Date.now().toString(),
      title,
      time,
      date: dateKey,
      category: selectedCategory,
      isPrivate: isPrivate,
      createdBy: currentUser,
      createdAt: new Date().toISOString()
    };

    const dateEvents = events[dateKey] || [];
    const updatedEvents = {
      ...events,
      [dateKey]: [...dateEvents, newEvent].sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      })
    };

    saveEvents(updatedEvents);
    setSelectedDate(targetDate);
    setQuickEntry(`Added: ${title}`);
    setTimeout(() => setQuickEntry(''), 3000);
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        processVoiceCommand(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [selectedCategory, isPrivate, events, selectedDate]);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setVoiceTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const key = newCategoryName.toLowerCase().replace(/\s+/g, '_');
    const updatedCategories = { ...categories, [key]: { label: newCategoryName, ...newCategoryColor } };
    saveCategories(updatedCategories);
    setNewCategoryName('');
    setNewCategoryColor(COLOR_OPTIONS[0]);
  };

  const handleDeleteCategory = (key) => {
    if (key === 'other') return;
    const { [key]: deleted, ...remaining } = categories;
    saveCategories(remaining);
    if (selectedCategory === key) setSelectedCategory('other');
  };

  const handleUpdateCategory = (key, updates) => {
    const updatedCategories = { ...categories, [key]: { ...categories[key], ...updates } };
    saveCategories(updatedCategories);
    setEditingCategory(null);
  };

  const handleQuickAdd = () => {
    if (!quickEntry.trim()) return;
    const title = quickEntry.trim();
    const datesToAdd = selectedDates.length > 1 ? selectedDates : [selectedDate];
    setPendingEvent({ title, datesToAdd, isMultiDay: selectedDates.length > 1 });
    setShowTimePrompt(true);
    setQuickEntry('');
  };

  const handleTimeSubmit = (time) => {
    if (!pendingEvent) return;
    const updatedEvents = { ...events };
    const multiDayId = pendingEvent.isMultiDay ? Date.now().toString() : null;
    pendingEvent.datesToAdd.forEach(date => {
      const dateKey = getDateKey(date);
      const newEvent = {
        id: `${Date.now()}-${Math.random()}`,
        title: pendingEvent.title,
        time: pendingEvent.isMultiDay ? null : (time || null),
        date: dateKey,
        category: selectedCategory,
        isPrivate: isPrivate,
        isUrgent: isUrgent,
        isAnnual: isAnnual,
        annualMonth: isAnnual ? (date.getMonth() + 1) : null,
        annualDay: isAnnual ? date.getDate() : null,
        createdBy: currentUser,
        createdAt: new Date().toISOString(),
        isMultiDay: pendingEvent.isMultiDay,
        multiDayId,
        userId: user?.id || null
      };
      const dateEvents = updatedEvents[dateKey] || [];
      updatedEvents[dateKey] = [...dateEvents, newEvent].sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
    });
    saveEvents(updatedEvents);
    setSelectedDates([]);
    setIsAnnual(false);
    setShowTimePrompt(false);
    setPendingEvent(null);
  };

  const handleDeleteEvent = (dateKey, eventId, isVirtualAnnual = false) => {
    const eventToDelete = events[dateKey]?.find(e => e.id === eventId);

    // For virtual annual recurrences, find and delete the original record
    if (isVirtualAnnual) {
      let originalDateKey = null;
      Object.entries(events).forEach(([key, evts]) => {
        if (evts.some(e => e.id === eventId)) originalDateKey = key;
      });
      if (originalDateKey) {
        const updatedEvents = { ...events, [originalDateKey]: events[originalDateKey].filter(e => e.id !== eventId) };
        if (updatedEvents[originalDateKey].length === 0) delete updatedEvents[originalDateKey];
        saveEvents(updatedEvents);
      }
      return;
    }

    if (eventToDelete?.isMultiDay && eventToDelete.multiDayId) {
      const updatedEvents = { ...events };
      Object.keys(updatedEvents).forEach(key => {
        updatedEvents[key] = updatedEvents[key].filter(e => e.multiDayId !== eventToDelete.multiDayId);
        if (updatedEvents[key].length === 0) delete updatedEvents[key];
      });
      saveEvents(updatedEvents);
    } else {
      const updatedEvents = { ...events, [dateKey]: events[dateKey].filter(e => e.id !== eventId) };
      if (updatedEvents[dateKey].length === 0) delete updatedEvents[dateKey];
      saveEvents(updatedEvents);
    }
  };

  const handleUpdateEvent = (dateKey, eventId, updates) => {
    const updatedEvents = {
      ...events,
      [dateKey]: events[dateKey].map(e => e.id === eventId ? { ...e, ...updates } : e)
        .sort((a, b) => {
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
        })
    };
    saveEvents(updatedEvents);
    setEditingEvent(null);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${minutes} ${period}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date &&
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const selectedDateKey = getDateKey(selectedDate);
  const selectedEvents = getEventsForDate(selectedDate);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Loading calendar...</div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    setAuthError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setAuthError(error.message);
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-gradient-to-br from-rose-400 via-purple-400 to-indigo-400 rounded-xl">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Our Calendar
            </h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">
            Sign in to access your personal calendar
          </p>
          {authError && (
            <p className="text-red-600 text-sm text-center mb-4">{authError}</p>
          )}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-purple-300 hover:shadow-md transition-all font-medium text-gray-700 dark:text-gray-200"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Sign in with Google
          </button>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 text-center">
            Each account only sees its own events
          </p>
        </div>
      </div>
    );
  }

  if (showTimePrompt && pendingEvent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            What time?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">Event: <strong>{pendingEvent.title}</strong></p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {pendingEvent.isMultiDay ? "Multi-day events don't need a time" : 'Enter a time or skip to add without time'}
            {isAnnual && <span className="ml-2 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">🔁 Repeats annually</span>}
          </p>
          <input
            type="time"
            id="timeInput"
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 mb-4"
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleTimeSubmit(e.target.value);
            }}
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                const input = document.getElementById('timeInput');
                handleTimeSubmit(input.value);
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Add Event
            </button>
            <button
              onClick={() => handleTimeSubmit(null)}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Skip Time
            </button>
            <button
              onClick={() => {
                setShowTimePrompt(false);
                setPendingEvent(null);
                setQuickEntry(pendingEvent.title);
              }}
              className="px-6 py-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-200 dark:hover:bg-red-800 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showUserSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Welcome to Your Calendar!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">What's your name? This helps identify who created each event.</p>
          <input
            type="text"
            value={userNameInput}
            onChange={(e) => setUserNameInput(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 mb-4"
            onKeyPress={(e) => {
              if (e.key === 'Enter') saveUser(userNameInput.trim() || 'User');
            }}
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={() => saveUser(userNameInput.trim() || 'User')}
              className="flex-1 px-6 py-3 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Get Started
            </button>
            <button
              onClick={() => saveUser('User')}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-gradient-to-br from-rose-400 via-purple-400 to-indigo-400 rounded-xl shrink-0">
                <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0">
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={calendarTitle}
                    onChange={(e) => setCalendarTitle(e.target.value)}
                    onBlur={async () => {
                      setIsEditingTitle(false);
                      localStorage.setItem(`calendar-title-${user?.id}`, calendarTitle);
                    }}
                    onKeyPress={async (e) => {
                      if (e.key === 'Enter') {
                        setIsEditingTitle(false);
                        localStorage.setItem(`calendar-title-${user?.id}`, calendarTitle);
                      }
                    }}
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent px-2 py-1 border-2 border-purple-300 rounded-lg w-full"
                    autoFocus
                  />
                ) : (
                  <h1
                    onClick={() => setIsEditingTitle(true)}
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer hover:opacity-70 transition-opacity truncate"
                    title="Click to rename calendar"
                  >
                    {calendarTitle}
                  </h1>
                )}
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{user?.email}</span>
                  <button onClick={handleLogout} className="ml-2 text-xs text-purple-500 hover:text-purple-700 underline">logout</button>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowSharePanel(!showSharePanel)}
                className={`p-2 rounded-xl transition-all duration-200 ${showSharePanel ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                title="Share calendar"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                className={`p-2 rounded-xl transition-all duration-200 ${notificationsEnabled ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                title={notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
              >
                {notificationsEnabled ? <Bell className="w-4 h-4 sm:w-5 sm:h-5" /> : <BellOff className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button
                onClick={() => setShowHolidays(!showHolidays)}
                className={`p-2 rounded-xl transition-all duration-200 text-sm ${showHolidays ? 'bg-red-100 dark:bg-red-900' : 'bg-gray-100 dark:bg-gray-700 opacity-40'}`}
                title={showHolidays ? 'Hide US holidays' : 'Show US holidays'}
              >
                🇺🇸
              </button>
              <button
                onClick={() => setShowCategoryEditor(!showCategoryEditor)}
                className="p-2 hover:bg-purple-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl transition-all duration-200 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-yellow-400"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-purple-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200">
              <ChevronLeft className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </button>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-purple-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200">
              <ChevronRight className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </button>
          </div>
        </div>

        {/* Notification Settings Panel */}
        {showNotificationSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Notification Settings</h3>
              <button onClick={() => setShowNotificationSettings(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Enable Notifications</span>
                  </div>
                  <button
                    onClick={toggleNotifications}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get notified 1 week and 1 day before events</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-xl border-2 border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Urgent Events Only</span>
                  </div>
                  <button
                    onClick={async () => {
                      const newState = !onlyNotifyUrgent;
                      setOnlyNotifyUrgent(newState);
                      await window.storage.set('notify-urgent-only', newState.toString(), false);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${onlyNotifyUrgent ? 'bg-red-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${onlyNotifyUrgent ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Only send notifications for events marked as urgent 🚨</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>📅 1 Week Before:</strong> Yellow notification<br />
                  <strong>⚠️ 1 Day Before:</strong> Red notification<br />
                  <strong>🚨 Urgent Events:</strong> Show "URGENT" prefix
                </p>
              </div>
            </div>
          </div>
        )}

        {showSharePanel && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Share Calendar
              </h3>
              <button onClick={() => { setShowSharePanel(false); setShareMessage(''); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="mb-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Enter someone's email to give them access to your calendar. They'll see and be able to edit your events when they log in.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={shareEmailInput}
                  onChange={(e) => { setShareEmailInput(e.target.value); setShareMessage(''); }}
                  placeholder="wife@gmail.com"
                  className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleShareCalendar()}
                />
                <button
                  onClick={handleShareCalendar}
                  className="px-4 py-2 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {shareMessage && (
                <p className={`text-sm mt-2 ${shareMessage.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
                  {shareMessage}
                </p>
              )}
            </div>
            {myShares.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Shared with:</h4>
                <div className="space-y-2">
                  {myShares.map((share, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-400 flex items-center justify-center text-white text-xs font-bold">
                          {share.shared_with_email[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{share.shared_with_email}</span>
                      </div>
                      <button onClick={() => handleRemoveShare(share.shared_with_email)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-all" title="Remove access">
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sharedCalendars.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Calendars shared with you:</h4>
                <div className="space-y-2">
                  {sharedCalendars.map((share, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-700">
                      <div className="w-7 h-7 rounded-full bg-green-400 flex items-center justify-center text-white text-xs">📅</div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Shared by <strong>{share.shared_with_email === user?.email ? share.owner_id : 'another user'}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {myShares.length === 0 && sharedCalendars.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">No shares yet. Add someone's email above to get started.</p>
            )}
          </div>
        )}

        {showCategoryEditor && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Manage Categories</h3>
              <button onClick={() => setShowCategoryEditor(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Add New Category</h4>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 px-3 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-400"
                />
                <button onClick={handleAddCategory} className="px-4 py-2 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-lg">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_OPTIONS.map((colorOption, idx) => (
                  <button
                    key={idx}
                    onClick={() => setNewCategoryColor(colorOption)}
                    className={`w-full aspect-square rounded-lg ${colorOption.color} ${newCategoryColor.name === colorOption.name ? 'ring-4 ring-gray-800 dark:ring-white' : ''}`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(categories).map(([key, cat]) => (
                <div key={key} className={`p-3 rounded-xl ${cat.lightBg} border-2 ${cat.border}`}>
                  {editingCategory === key ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        defaultValue={cat.label}
                        onBlur={(e) => handleUpdateCategory(key, { label: e.target.value })}
                        className="w-full px-2 py-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                        autoFocus
                      />
                      <div className="grid grid-cols-6 gap-1">
                        {COLOR_OPTIONS.map((colorOption, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleUpdateCategory(key, { ...colorOption })}
                            className={`w-full aspect-square rounded-lg ${colorOption.color} ${cat.color === colorOption.color ? 'ring-2 ring-gray-800 dark:ring-white' : ''}`}
                            title={colorOption.name}
                          />
                        ))}
                      </div>
                      <button onClick={() => setEditingCategory(null)} className="w-full px-3 py-1 bg-green-500 text-white rounded-lg text-sm">Done</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${cat.color}`} />
                        <span className="font-medium text-gray-800 dark:text-gray-200">{cat.label}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingCategory(key)} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-lg">
                          <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        {key !== 'other' && (
                          <button onClick={() => handleDeleteCategory(key)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl border border-purple-200 dark:border-purple-700">
              <p className="text-sm text-purple-700 dark:text-purple-300 text-center">
                💡 <strong>Tip:</strong> Double-tap a start date, then tap an end date to create multi-day events like vacations!
              </p>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(currentDate).map((date, index) => {
                const dateKey = date ? getDateKey(date) : null;
                const dateEvents = getEventsForDate(date);
                const isSelected = date && isSameDay(date, selectedDate);
                const isTodayDate = date && isToday(date);
                const isInSelection = date && selectedDates.some(d => isSameDay(d, date));
                const hasUrgentEvent = dateEvents.some(e => e.isUrgent);
                const hasHoliday = dateEvents.some(e => e.isHoliday);

                const multiDayEvents = dateEvents.filter(e => e.isMultiDay);
                const uniqueMultiDayIds = [...new Set(multiDayEvents.map(e => e.multiDayId))];

                const multiDayBars = uniqueMultiDayIds.map(multiDayId => {
                  const allDatesForEvent = Object.entries(events)
                    .filter(([_, evts]) => evts.some(e => e.multiDayId === multiDayId))
                    .map(([dateKey]) => {
                      const [year, month, day] = dateKey.split('-').map(Number);
                      return new Date(year, month - 1, day);
                    })
                    .sort((a, b) => a - b);

                  const isFirst = date && allDatesForEvent[0] && isSameDay(date, allDatesForEvent[0]);
                  const isLast = date && allDatesForEvent[allDatesForEvent.length - 1] && isSameDay(date, allDatesForEvent[allDatesForEvent.length - 1]);
                  const isMiddle = date && allDatesForEvent.some(d => isSameDay(d, date)) && !isFirst && !isLast;
                  const eventWithId = dateEvents.find(e => e.multiDayId === multiDayId);
                  const categoryColor = eventWithId ? categories[eventWithId.category || 'other']?.color : 'bg-purple-500';
                  return { isFirst, isLast, isMiddle, categoryColor };
                });

                return (
                  <div key={index} className="relative pb-3">
                    <button
                      onClick={() => handleDateTap(date)}
                      disabled={!date}
                      className={`
                        w-full aspect-square rounded-xl p-2 transition-all duration-200 relative select-none
                        ${!date ? 'invisible' : 'bg-white dark:bg-gray-700'}
                        ${hasUrgentEvent && !isSelected && !isInSelection ? 'ring-2 ring-red-500 shadow-lg shadow-red-200' : ''}
                        ${isInSelection ? 'bg-gradient-to-br from-purple-400 to-indigo-400 text-white shadow-lg scale-105 ring-2 ring-purple-300' : ''}
                        ${isSelected && !isInSelection ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg scale-105' : ''}
                        ${!isInSelection && !isSelected && isTodayDate && !hasUrgentEvent ? 'bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-900/50 dark:to-purple-900/50 text-purple-900 dark:text-purple-200 ring-2 ring-purple-400' : ''}
                        ${!isInSelection && !isSelected && !isTodayDate && !hasUrgentEvent ? 'text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-600' : ''}
                        ${hasUrgentEvent && !isSelected && !isInSelection ? 'bg-red-50 dark:bg-red-900/30' : ''}
                      `}
                      style={{ zIndex: 10 }}
                    >
                      <div className={`text-sm font-medium ${hasUrgentEvent && !isSelected && !isInSelection ? 'text-red-700 dark:text-red-400' : ''}`}>
                        {date ? date.getDate() : ''}
                        {hasHoliday && !isSelected && !isInSelection && (
                          <span className="absolute top-0.5 right-0.5 text-xs">🇺🇸</span>
                        )}
                      </div>
                      {dateEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                          {hasHoliday && (
                            <div className={`w-1.5 h-1.5 rounded-full ${isSelected || isInSelection ? 'bg-white' : 'bg-red-400'}`} />
                          )}
                          {[...new Set(dateEvents.filter(e => !e.isMultiDay && !e.isHoliday).map(e => e.category || 'other'))].slice(0, 2).map((cat, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${isSelected || isInSelection ? 'bg-white' : categories[cat]?.color || 'bg-gray-500'}`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                    {multiDayBars.map((bar, barIndex) => (
                      bar.isFirst || bar.isLast || bar.isMiddle ? (
                        <div key={barIndex} className="absolute left-0 right-0 flex items-center" style={{ top: '100%', marginTop: `${barIndex * 5}px` }}>
                          {bar.isFirst && <div className={`h-2 ${bar.categoryColor} rounded-l-full`} style={{ width: '85%', marginLeft: '15%' }} />}
                          {bar.isMiddle && <div className={`h-2 ${bar.categoryColor} w-full`} />}
                          {bar.isLast && <div className={`h-2 ${bar.categoryColor} rounded-r-full`} style={{ width: '85%' }} />}
                        </div>
                      ) : null
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="mb-4">
              {selectedDates.length > 1 ? (
                <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 rounded-xl border-2 border-purple-300 dark:border-purple-600">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">Multi-Day Selection</h3>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                      {selectedDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {selectedDates[selectedDates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">{selectedDates.length} days</span>
                  </div>
                  <button onClick={() => setSelectedDates([])} className="text-xs text-purple-700 dark:text-purple-300 hover:text-purple-900 underline font-medium">Clear selection</button>
                </div>
              ) : (
                <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
              )}
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Category:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(categories).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      selectedCategory === key ? `${cat.color} text-white shadow-md scale-105` : `${cat.lightBg} ${cat.text} hover:scale-105`
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 space-y-2">
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-full px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                  isPrivate ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Lock className="w-4 h-4" />
                {isPrivate ? 'Private Event (Only You)' : 'Shared Event'}
              </button>
              <button
                onClick={() => setIsUrgent(!isUrgent)}
                className={`w-full px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                  isUrgent ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                {isUrgent ? '🚨 Urgent Event' : 'Normal Event'}
              </button>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`w-full px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                  isAnnual ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Repeat className="w-4 h-4" />
                {isAnnual ? '🔁 Annual (repeats every year)' : 'One-time Event'}
              </button>
            </div>

            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick add:</div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={quickEntry}
                  onChange={(e) => setQuickEntry(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
                  placeholder={selectedDates.length > 1 ? "Vacation in Mexico" : "Ed working, or Playdate 3pm"}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-purple-400"
                />
                <button onClick={handleQuickAdd} className="px-4 py-2 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ? (
                <div>
                  <button
                    onClick={toggleVoiceInput}
                    className={`w-full px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                      isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white hover:shadow-lg'
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    {isListening ? 'Listening...' : 'Use Voice Input'}
                  </button>
                  {voiceTranscript && (
                    <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">"{voiceTranscript}"</div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Say: "Meeting with John at 2pm on Friday"</div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 dark:text-gray-400">Voice input not supported</div>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">No events for this day</div>
              ) : (
                selectedEvents.map(event => {
                  const category = categories[event.category || 'other'] || categories.other;

                  if (event.isHoliday) {
                    return (
                      <div key={event.id} className="bg-red-50 dark:bg-red-900/30 rounded-xl p-3 border-2 border-red-200 dark:border-red-700 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🇺🇸</span>
                            <div>
                              <div className="text-gray-800 dark:text-gray-200 font-medium">{event.title}</div>
                              {event.fullName !== event.title && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">{event.fullName}</div>
                              )}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">US Holiday</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={event.id} className={`${category.lightBg} rounded-xl p-3 border-2 ${event.isVirtualAnnual ? 'border-violet-300 border-dashed' : category.border} transition-all duration-200 hover:shadow-md relative`}>
                      {event.isPrivate && (
                        <div className="absolute top-2 right-2">
                          <Lock className="w-3 h-3 text-amber-600" />
                        </div>
                      )}
                      {editingEvent === event.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            defaultValue={event.title}
                            onBlur={(e) => handleUpdateEvent(selectedDateKey, event.id, { title: e.target.value })}
                            className="w-full px-2 py-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                            autoFocus
                          />
                          <input
                            type="time"
                            defaultValue={event.time || ''}
                            onChange={(e) => handleUpdateEvent(selectedDateKey, event.id, { time: e.target.value })}
                            className="w-full px-2 py-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                          />
                          <select
                            defaultValue={event.category || 'other'}
                            onChange={(e) => handleUpdateEvent(selectedDateKey, event.id, { category: e.target.value })}
                            className="w-full px-2 py-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                          >
                            {Object.entries(categories).map(([key, cat]) => (
                              <option key={key} value={key}>{cat.label}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-2 text-sm dark:text-gray-300">
                            <input
                              type="checkbox"
                              defaultChecked={event.isPrivate}
                              onChange={(e) => handleUpdateEvent(selectedDateKey, event.id, { isPrivate: e.target.checked })}
                              className="rounded"
                            />
                            Private event
                          </label>
                          <label className="flex items-center gap-2 text-sm dark:text-gray-300">
                            <input
                              type="checkbox"
                              defaultChecked={event.isUrgent}
                              onChange={(e) => handleUpdateEvent(selectedDateKey, event.id, { isUrgent: e.target.checked })}
                              className="rounded"
                            />
                            🚨 Urgent event
                          </label>
                          <label className="flex items-center gap-2 text-sm dark:text-gray-300">
                            <input
                              type="checkbox"
                              defaultChecked={event.isAnnual}
                              onChange={(e) => handleUpdateEvent(selectedDateKey, event.id, {
                                isAnnual: e.target.checked,
                                annualMonth: e.target.checked ? (new Date(event.date).getMonth() + 1) : null,
                                annualDay: e.target.checked ? new Date(event.date).getDate() : null
                              })}
                              className="rounded"
                            />
                            🔁 Annual (repeats every year)
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-6">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category.color} text-white`}>
                                {category.label}
                              </span>
                              {event.isUrgent && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white animate-pulse flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Urgent
                                </span>
                              )}
                              {event.isMultiDay && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500 text-white">Multi-day</span>
                              )}
                              {event.isAnnual && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500 text-white flex items-center gap-1">
                                  <Repeat className="w-3 h-3" />
                                  Annual
                                </span>
                              )}
                              {event.time && (
                                <div className={`flex items-center gap-1 ${category.text} text-sm font-medium`}>
                                  <Clock className="w-3 h-3" />
                                  {formatTime(event.time)}
                                </div>
                              )}
                            </div>
                            <div className="text-gray-800 dark:text-gray-200 font-medium mb-1">{event.title}</div>
                            {event.createdBy && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <User className="w-3 h-3" />
                                {event.createdBy}
                                {event.isShared && (
                                  <span className="ml-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs">shared</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            {!event.isVirtualAnnual && (
                              <button onClick={() => setEditingEvent(event.id)} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all">
                                <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const msg = event.isVirtualAnnual
                                  ? `Delete "${event.title}" from ALL years? This removes the annual event entirely.`
                                  : event.isAnnual
                                  ? `Delete "${event.title}" from ALL years? This removes the annual event entirely.`
                                  : null;
                                if (!msg || window.confirm(msg)) {
                                  handleDeleteEvent(selectedDateKey, event.id, event.isVirtualAnnual);
                                }
                              }}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-all"
                              title={event.isAnnual || event.isVirtualAnnual ? 'Deletes from all years' : 'Delete event'}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
