import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Plus, X, ChevronLeft, ChevronRight, Edit2, Trash2, Tag, Mic, MicOff, Settings, Eye, EyeOff, Lock, User, Bell, BellOff, AlertTriangle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  'https://qyifsblebdnlcyurrgbt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWZzYmxlYmRubGN5dXJyZ2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTA1NTcsImV4cCI6MjA4NzAyNjU1N30.S_DUVQCwkBWrbSWoujQipb_5jz1d5UCsU_gSwWAGzTk'
);
// Supabase storage wrapper
const storage = {
  get: async (key, shared = false) => {
    if (key === 'calendar-user') {
      // User is stored locally
      const value = localStorage.getItem(key);
      return value ? { key, value, shared } : null;
    }
    // Everything else uses Supabase - events and categories are always shared
    return { key, value: null, shared };
  },
  set: async (key, value, shared = false) => {
    if (key === 'calendar-user' || key.includes('notification')) {
      // User and notifications stored locally
      localStorage.setItem(key, value);
      return { key, value, shared };
    }
    // Events and categories go to Supabase
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

  const getDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const saveEvents = async (newEvents) => {
  try {
    setEvents(newEvents);
    
    // Flatten events object to array for Supabase
    const eventsArray = [];
    Object.entries(newEvents).forEach(([date, dateEvents]) => {
      dateEvents.forEach(event => {
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
          created_by: event.createdBy,
          created_at: event.createdAt
        });
      });
    });
    
    // Clear all events and insert new ones
    await supabase.from('events').delete().neq('id', '___nonexistent___');
    
    if (eventsArray.length > 0) {
      const { error } = await supabase.from('events').insert(eventsArray);
      if (error) {
        console.error('Error saving events to Supabase:', error);
      }
    }
  } catch (error) {
    console.error('Error saving events:', error);
  }
};

  const saveCategories = async (newCategories) => {
  try {
    setCategories(newCategories);
    
    // Convert to array for Supabase
    const categoriesArray = Object.entries(newCategories).map(([key, cat]) => ({
      key,
      label: cat.label,
      color: cat.color,
      light_bg: cat.lightBg,
      border: cat.border,
      text: cat.text
    }));
    
    // Clear and insert
    await supabase.from('categories').delete().neq('key', '___nonexistent___');
    
    const { error } = await supabase.from('categories').insert(categoriesArray);
    if (error) {
      console.error('Error saving categories to Supabase:', error);
    }
  } catch (error) {
    console.error('Error saving categories:', error);
  }
};

  const saveUser = async (userName) => {
    console.log('Attempting to save user:', userName);
    if (!userName || userName.trim() === '') {
      userName = 'User';
    }
    try {
      const result = await window.storage.set('calendar-user', userName, false);
      console.log('Storage result:', result);
      setCurrentUser(userName);
      setShowUserSetup(false);
      console.log('User saved successfully, showUserSetup is now false');
    } catch (error) {
      console.error('Error saving user:', error);
      // Even if storage fails, let them use the calendar
      setCurrentUser(userName);
      setShowUserSetup(false);
    }
  };

 useEffect(() => {
  const loadData = async () => {
    try {
      // Load events from Supabase
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*');
      
      if (eventsError) {
        console.error('Error loading events:', eventsError);
      } else if (eventsData) {
        // Convert flat array to date-keyed object
        const eventsObj = {};
        eventsData.forEach(event => {
          if (!eventsObj[event.date]) {
            eventsObj[event.date] = [];
          }
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
            createdBy: event.created_by,
            createdAt: event.created_at
          });
        });
        setEvents(eventsObj);
      }
      
      // Load categories from Supabase
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');
      
      if (categoriesError) {
        console.log('No categories yet, using defaults');
      } else if (categoriesData && categoriesData.length > 0) {
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
      }

      // Load user from localStorage
      try {
        const userResult = await window.storage.get('calendar-user', false);
        if (userResult && userResult.value) {
          setCurrentUser(userResult.value);
          setShowUserSetup(false);
        } else {
          setShowUserSetup(true);
        }
      } catch (userError) {
        console.log('No user found, showing setup');
        setShowUserSetup(true);
      }
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  loadData();
  
  // Subscribe to realtime changes
  const eventsSubscription = supabase
    .channel('events-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
      // Reload events when they change
      loadData();
    })
    .subscribe();

  return () => {
    eventsSubscription.unsubscribe();
  };
}, []);

  // Check notification permission on load
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
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
      const oneDayFromNow = new Date(now);
      oneDayFromNow.setDate(now.getDate() + 1);
      const oneWeekFromNow = new Date(now);
      oneWeekFromNow.setDate(now.getDate() + 7);

      Object.entries(events).forEach(([dateKey, dateEvents]) => {
        const eventDate = new Date(dateKey);
        
        dateEvents.forEach(event => {
          if (event.isPrivate && showPrivateEvents === false) return;
          
          // Skip non-urgent events if only notifying urgent ones
          if (onlyNotifyUrgent && !event.isUrgent) return;
          
          const timeDiff = eventDate - now;
          const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

          const urgentPrefix = event.isUrgent ? '🚨 URGENT: ' : '';

          // 1 week notification (yellow/amber)
          if (daysUntil === 7) {
            new Notification(`${urgentPrefix}📅 Event in 1 Week`, {
              body: `${event.title} - ${eventDate.toLocaleDateString()}`,
              icon: '📅',
              tag: `${event.id}-week`,
              badge: event.isUrgent ? '🚨' : '📅'
            });
          }

          // 1 day notification (red/urgent)
          if (daysUntil === 1) {
            new Notification(`${urgentPrefix}⚠️ Event Tomorrow!`, {
              body: `${event.title} - ${eventDate.toLocaleDateString()}`,
              icon: '⚠️',
              tag: `${event.id}-day`,
              badge: event.isUrgent ? '🚨' : '⚠️'
            });
          }
        });
      });
    };

    // Check once on mount and then every hour
    checkNotifications();
    const interval = setInterval(checkNotifications, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [events, notificationsEnabled, showPrivateEvents, onlyNotifyUrgent]);

  // Load notification preference
  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const result = await window.storage.get('notifications-enabled', false);
        if (result && result.value === 'true') {
          setNotificationsEnabled(true);
        }
        
        const urgentResult = await window.storage.get('notify-urgent-only', false);
        if (urgentResult && urgentResult.value === 'true') {
          setOnlyNotifyUrgent(true);
        }
      } catch (error) {
        console.log('No notification preference found');
      }
    };
    loadNotificationPreference();
  }, []);

  // Global mouse up handler for selections
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
      }
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting]);

 const [firstTapDate, setFirstTapDate] = useState(null);
const [lastTapTime, setLastTapTime] = useState(0);

const handleDateTap = (date) => {
  if (!date) return;
  
  const now = Date.now();
  const timeSinceLastTap = now - lastTapTime;
  
  // Double tap detection (within 300ms)
  if (timeSinceLastTap < 300 && firstTapDate && isSameDay(firstTapDate, date)) {
    // This is a double tap on the same date - start selection
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
      if (!meridiem && hours < 12 && hours >= 8) {
      } else if (!meridiem && hours < 8) {
        hours += 12;
      }
      
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

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [selectedCategory, isPrivate, events, selectedDate, processVoiceCommand]);

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
    const updatedCategories = {
      ...categories,
      [key]: {
        label: newCategoryName,
        ...newCategoryColor
      }
    };
    
    saveCategories(updatedCategories);
    setNewCategoryName('');
    setNewCategoryColor(COLOR_OPTIONS[0]);
  };

  const handleDeleteCategory = (key) => {
    if (key === 'other') return;
    
    const { [key]: deleted, ...remaining } = categories;
    saveCategories(remaining);
    
    if (selectedCategory === key) {
      setSelectedCategory('other');
    }
  };

  const handleUpdateCategory = (key, updates) => {
    const updatedCategories = {
      ...categories,
      [key]: {
        ...categories[key],
        ...updates
      }
    };
    saveCategories(updatedCategories);
    setEditingCategory(null);
  };

  const parseQuickEntry = (text) => {
    const timeRegex = /(\d{1,2}):?(\d{2})?\s*(am|pm)?/i;
    const match = text.match(timeRegex);
    
    let time = null;
    let title = text;
    
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const meridiem = match[3]?.toLowerCase();
      
      if (meridiem === 'pm' && hours !== 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      
      time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      title = text.replace(match[0], '').trim();
    }
    
    return { title, time };
  };

  const handleQuickAdd = () => {
    if (!quickEntry.trim()) return;
    
    const { title, time } = parseQuickEntry(quickEntry);
    const datesToAdd = selectedDates.length > 1 ? selectedDates : [selectedDate];
    
    const updatedEvents = { ...events };
    const multiDayId = selectedDates.length > 1 ? Date.now().toString() : null;
    
    datesToAdd.forEach(date => {
      const dateKey = getDateKey(date);
      const newEvent = {
        id: `${Date.now()}-${Math.random()}`,
        title,
        time: selectedDates.length > 1 ? null : time,
        date: dateKey,
        category: selectedCategory,
        isPrivate: isPrivate,
        isUrgent: isUrgent,
        createdBy: currentUser,
        createdAt: new Date().toISOString(),
        isMultiDay: selectedDates.length > 1,
        multiDayId
      };
      
      const dateEvents = updatedEvents[dateKey] || [];
      updatedEvents[dateKey] = [...dateEvents, newEvent].sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
    });
    
    saveEvents(updatedEvents);
    setQuickEntry('');
    setSelectedDates([]);
  };

  const handleDeleteEvent = (dateKey, eventId) => {
    const eventToDelete = events[dateKey]?.find(e => e.id === eventId);
    
    if (eventToDelete?.isMultiDay && eventToDelete.multiDayId) {
      const updatedEvents = { ...events };
      Object.keys(updatedEvents).forEach(key => {
        updatedEvents[key] = updatedEvents[key].filter(e => e.multiDayId !== eventToDelete.multiDayId);
        if (updatedEvents[key].length === 0) {
          delete updatedEvents[key];
        }
      });
      saveEvents(updatedEvents);
    } else {
      const updatedEvents = {
        ...events,
        [dateKey]: events[dateKey].filter(e => e.id !== eventId)
      };
      if (updatedEvents[dateKey].length === 0) {
        delete updatedEvents[dateKey];
      }
      saveEvents(updatedEvents);
    }
  };

  const handleUpdateEvent = (dateKey, eventId, updates) => {
    const updatedEvents = {
      ...events,
      [dateKey]: events[dateKey].map(e => 
        e.id === eventId ? { ...e, ...updates } : e
      ).sort((a, b) => {
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
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
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

  const isSameDay = (date1, date2) => {
    return date1 && date2 &&
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const selectedDateKey = getDateKey(selectedDate);
  const selectedEvents = (events[selectedDateKey] || []).filter(event => 
    showPrivateEvents || !event.isPrivate
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Loading calendar...</div>
      </div>
    );
  }

  if (showUserSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Welcome to Your Calendar!
          </h2>
          <p className="text-gray-600 mb-6">
            What's your name? This helps identify who created each event.
          </p>
          <input
            type="text"
            value={userNameInput}
            onChange={(e) => setUserNameInput(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 mb-4"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const name = userNameInput.trim() || 'User';
                saveUser(name);
              }
            }}
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                const name = userNameInput.trim() || 'User';
                saveUser(name);
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Get Started
            </button>
            <button
              onClick={() => saveUser('User')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-rose-400 via-purple-400 to-indigo-400 rounded-xl">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Our Calendar
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Logged in as <span className="font-semibold text-purple-600">{currentUser}</span>
                  <button
                    onClick={() => setShowUserSetup(true)}
                    className="ml-2 text-xs text-purple-500 hover:text-purple-700 underline"
                  >
                    change
                  </button>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  notificationsEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
                title={notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
              >
                {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowPrivateEvents(!showPrivateEvents)}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  showPrivateEvents ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {showPrivateEvents ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowCategoryEditor(!showCategoryEditor)}
                className="p-2 hover:bg-purple-100 rounded-xl transition-all duration-200"
              >
                <Settings className="w-5 h-5 text-purple-600" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-purple-100 rounded-xl transition-all duration-200">
              <ChevronLeft className="w-6 h-6 text-purple-600" />
            </button>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-purple-100 rounded-xl transition-all duration-200">
              <ChevronRight className="w-6 h-6 text-purple-600" />
            </button>
          </div>
        </div>

        {/* Notification Settings Panel */}
        {showNotificationSettings && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Notification Settings
              </h3>
              <button onClick={() => setShowNotificationSettings(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Enable/Disable Notifications */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-800">Enable Notifications</span>
                  </div>
                  <button
                    onClick={toggleNotifications}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationsEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Get notified 1 week and 1 day before events
                </p>
              </div>

              {/* Urgent Only Toggle */}
              <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-gray-800">Urgent Events Only</span>
                  </div>
                  <button
                    onClick={async () => {
                      const newState = !onlyNotifyUrgent;
                      setOnlyNotifyUrgent(newState);
                      await window.storage.set('notify-urgent-only', newState.toString(), false);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      onlyNotifyUrgent ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        onlyNotifyUrgent ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Only send notifications for events marked as urgent 🚨
                </p>
              </div>

              {/* Info box */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>📅 1 Week Before:</strong> Yellow notification<br/>
                  <strong>⚠️ 1 Day Before:</strong> Red notification<br/>
                  <strong>🚨 Urgent Events:</strong> Show "URGENT" prefix
                </p>
              </div>
            </div>
          </div>
        )}

        {showCategoryEditor && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Manage Categories</h3>
              <button onClick={() => setShowCategoryEditor(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Category</h4>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400"
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
                    className={`w-full aspect-square rounded-lg ${colorOption.color} ${
                      newCategoryColor.name === colorOption.name ? 'ring-4 ring-gray-800' : ''
                    }`}
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
                        className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg text-sm"
                        autoFocus
                      />
                      <div className="grid grid-cols-6 gap-1">
                        {COLOR_OPTIONS.map((colorOption, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleUpdateCategory(key, { ...colorOption })}
                            className={`w-full aspect-square rounded-lg ${colorOption.color} ${
                              cat.color === colorOption.color ? 'ring-2 ring-gray-800' : ''
                            }`}
                            title={colorOption.name}
                          />
                        ))}
                      </div>
                      <button onClick={() => setEditingCategory(null)} className="w-full px-3 py-1 bg-green-500 text-white rounded-lg text-sm">
                        Done
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${cat.color}`} />
                        <span className="font-medium text-gray-800">{cat.label}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingCategory(key)} className="p-1 hover:bg-white rounded-lg">
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        {key !== 'other' && (
                          <button onClick={() => handleDeleteCategory(key)} className="p-1 hover:bg-red-100 rounded-lg">
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
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6">
            {/* Instruction banner */}
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
              <p className="text-sm text-purple-700 text-center">
                💡 <strong>Tip:</strong> Double-tap a start date, then tap an end date to create multi-day events like vacations!
              </p>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(currentDate).map((date, index) => {
                const dateKey = date ? getDateKey(date) : null;
                const allDateEvents = dateKey && events[dateKey] ? events[dateKey] : [];
                const dateEvents = allDateEvents.filter(e => {
  if (!e.isPrivate) return true;
  const currentUserName = localStorage.getItem('calendar-user');
  return showPrivateEvents || e.createdBy === currentUserName;
});
                const isSelected = date && isSameDay(date, selectedDate);
                const isTodayDate = date && isToday(date);
                const isInSelection = date && selectedDates.some(d => isSameDay(d, date));
                const hasUrgentEvent = dateEvents.some(e => e.isUrgent);
                
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
                        ${!date ? 'invisible' : 'bg-white'}
                        ${hasUrgentEvent && !isSelected && !isInSelection ? 'ring-2 ring-red-500 shadow-lg shadow-red-200' : ''}
                        ${isInSelection ? 'bg-gradient-to-br from-purple-400 to-indigo-400 text-white shadow-lg scale-105 ring-2 ring-purple-300' : ''}
                        ${isSelected && !isInSelection ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg scale-105' : ''}
                        ${!isInSelection && !isSelected && isTodayDate && !hasUrgentEvent ? 'bg-gradient-to-br from-rose-100 to-purple-100 text-purple-900 ring-2 ring-purple-400' : ''}
                        ${!isInSelection && !isSelected && !isTodayDate && !hasUrgentEvent ? 'text-gray-700 hover:bg-purple-50' : ''}
                        ${hasUrgentEvent && !isSelected && !isInSelection ? 'bg-red-50' : ''}
                      `}
                      style={{ zIndex: 10 }}
                    >
                      <div className={`text-sm font-medium ${hasUrgentEvent && !isSelected && !isInSelection ? 'text-red-700' : ''}`}>
                        {date ? date.getDate() : ''}
                      </div>
                      {dateEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                          {[...new Set(dateEvents.filter(e => !e.isMultiDay).map(e => e.category || 'other'))].slice(0, 3).map((cat, i) => (
                            <div 
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected || isInSelection ? 'bg-white' : categories[cat]?.color || 'bg-gray-500'
                              }`} 
                            />
                          ))}
                        </div>
                      )}
                    </button>
                    
                    {/* Multi-day event bars below the date */}
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

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="mb-4">
              {selectedDates.length > 1 ? (
                <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl border-2 border-purple-300">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    Multi-Day Selection
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-purple-700 font-medium">
                      {selectedDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {selectedDates[selectedDates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                      {selectedDates.length} days
                    </span>
                  </div>
                  <button onClick={() => setSelectedDates([])} className="text-xs text-purple-700 hover:text-purple-900 underline font-medium">
                    Clear selection
                  </button>
                </div>
              ) : (
                <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
              )}
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
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
                  isPrivate ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Lock className="w-4 h-4" />
                {isPrivate ? 'Private Event (Only You)' : 'Shared Event'}
              </button>
              
              <button
                onClick={() => setIsUrgent(!isUrgent)}
                className={`w-full px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                  isUrgent ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                {isUrgent ? '🚨 Urgent Event' : 'Normal Event'}
              </button>
            </div>

            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 mb-2">Quick add:</div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={quickEntry}
                  onChange={(e) => setQuickEntry(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
                  placeholder={selectedDates.length > 1 ? "Vacation in Mexico" : "Ed working, or Playdate 3pm"}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400"
                />
                <button onClick={handleQuickAdd} className="px-4 py-2 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {'webkitSpeechRecognition' in window || 'SpeechRecognition' in window ? (
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
                    <div className="mt-2 p-2 bg-emerald-50 rounded-lg text-sm text-emerald-700">"{voiceTranscript}"</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">Say: "Meeting with John at 2pm on Friday"</div>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Voice input not supported</div>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No events for this day</div>
              ) : (
                selectedEvents.map(event => {
                  const category = categories[event.category || 'other'] || categories.other;
                  return (
                    <div key={event.id} className={`${category.lightBg} rounded-xl p-3 border-2 ${category.border} transition-all duration-200 hover:shadow-md relative`}>
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
                            className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg text-sm"
                            autoFocus
                          />
                          <input
                            type="time"
                            defaultValue={event.time || ''}
                            onChange={(e) => handleUpdateEvent(selectedDateKey, event.id, { time: e.target.value })}
                            className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg text-sm"
                          />
                          <select
                            defaultValue={event.category || 'other'}
                            onChange={(e) => handleUpdateEvent(selectedDateKey, event.id, { category: e.target.value })}
                            className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg text-sm"
                          >
                            {Object.entries(categories).map(([key, cat]) => (
                              <option key={key} value={key}>{cat.label}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              defaultChecked={event.isPrivate}
                              onChange={(e) => handleUpdateEvent(selectedDateKey, event.id, { isPrivate: e.target.checked })}
                              className="rounded"
                            />
                            Private event
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              defaultChecked={event.isUrgent}
                              onChange={(e) => handleUpdateEvent(selectedDateKey, event.id, { isUrgent: e.target.checked })}
                              className="rounded"
                            />
                            🚨 Urgent event
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
                              {event.time && (
                                <div className={`flex items-center gap-1 ${category.text} text-sm font-medium`}>
                                  <Clock className="w-3 h-3" />
                                  {formatTime(event.time)}
                                </div>
                              )}
                            </div>
                            <div className="text-gray-800 font-medium mb-1">{event.title}</div>
                            {event.createdBy && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <User className="w-3 h-3" />
                                {event.createdBy}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button onClick={() => setEditingEvent(event.id)} className="p-1.5 hover:bg-white rounded-lg transition-all">
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button onClick={() => handleDeleteEvent(selectedDateKey, event.id)} className="p-1.5 hover:bg-red-100 rounded-lg transition-all">
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
};

export default App;
