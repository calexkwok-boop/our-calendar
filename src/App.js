import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Plus, X, ChevronLeft, ChevronRight, Edit2, Trash2, Tag, Settings, Eye, EyeOff, Lock, User, Bell, BellOff, AlertTriangle, Repeat, Moon, Sun } from 'lucide-react';
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

  const saveTimeoutRef = useRef(null);
  const dateTapTimeoutRef = useRef(null);
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
  const [notifyOneWeek, setNotifyOneWeek] = useState(true);
  const [notifyOneDay, setNotifyOneDay] = useState(true);
  const [notifyOneHour, setNotifyOneHour] = useState(false);
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
  const [recurrence, setRecurrence] = useState('once');
  const [calendarView, setCalendarView] = useState('month');
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showDateDetailModal, setShowDateDetailModal] = useState(false);
  const [bottomNavTab, setBottomNavTab] = useState('home');

  // Sub-calendar state
  const [subCalendars, setSubCalendars] = useState([]);
  const [activeSubCalendar, setActiveSubCalendar] = useState(null);
  const [subCalNotes, setSubCalNotes] = useState([]); // [{id, text, checklist, createdBy, createdAt}]
  const [newNote, setNewNote] = useState('');
  const [expandedNote, setExpandedNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [editingSubCalTitle, setEditingSubCalTitle] = useState(false);
  const [editingSubCalDates, setEditingSubCalDates] = useState(false);
  const [shakingDates, setShakingDates] = useState(false);
  const shakingTimeoutRef = useRef(null);
  const [subCalWeather, setSubCalWeather] = useState({});
  const [subCalWeatherLocation, setSubCalWeatherLocation] = useState('');
  const [subCalWeatherLoading, setSubCalWeatherLoading] = useState(false);
  const [subCalWeatherInput, setSubCalWeatherInput] = useState('');
  const [subCalWeatherSuggestions, setSubCalWeatherSuggestions] = useState([]);
  const [subCalWeatherExpanded, setSubCalWeatherExpanded] = useState(false);
  const weatherAutocompleteRef = useRef(null);
  const [draggedNoteId, setDraggedNoteId] = useState(null);
  const [subCalendarEvents, setSubCalendarEvents] = useState({});
  const [showSubCalendarModal, setShowSubCalendarModal] = useState(false);
  const [newSubCalName, setNewSubCalName] = useState('');
  const [subCalInviteEmail, setSubCalInviteEmail] = useState('');
  const [subCalMembers, setSubCalMembers] = useState([]);
  const [subCalEditingEvent, setSubCalEditingEvent] = useState(null);
  const [subCalSelectedDate, setSubCalSelectedDate] = useState(null);
  const [subCalShowReactionPicker, setSubCalShowReactionPicker] = useState(null);
  const [subCalAddingSlot, setSubCalAddingSlot] = useState(null); // hour number being added to
  const [subCalNewEventForm, setSubCalNewEventForm] = useState({ title: '', endTime: '', location: '' });
  const [subCalTab, setSubCalTab] = useState('itinerary'); // 'itinerary' | 'photos'
  const [tripPhotos, setTripPhotos] = useState([]);
  const [photoView, setPhotoView] = useState('grid'); // 'grid' | 'timeline'
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadMessage, setPhotoUploadMessage] = useState('');
  const [photoUploadError, setPhotoUploadError] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoEventId, setPhotoEventId] = useState(null);
  const [photoDate, setPhotoDate] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const photoInputRef = useRef(null);

  const REACTION_EMOJIS = ['❤️', '😂', '😮', '👍', '🎉', '😢', '💰', '😘', '💯'];

  // ── Sub-calendar functions ──────────────────────────────────────────────

  const loadSubCalendars = async () => {
    try {
      const { data, error } = await supabase.from('sub_calendars').select('*');
      if (error) { console.error('Error loading sub_calendars:', error); return; }
      setSubCalendars(data || []);
    } catch (e) { console.error(e); }
  };

  const loadSubCalendarEvents = async (subCalId) => {
    try {
      const { data, error } = await supabase
        .from('sub_calendar_events')
        .select('*')
        .eq('sub_calendar_id', subCalId);
      if (error) { console.error('Error loading sub_calendar_events:', error); return; }
      const grouped = {};
      (data || []).forEach(e => {
        if (!grouped[e.date]) grouped[e.date] = [];
        grouped[e.date].push({
          id: e.id,
          title: e.title,
          time: e.time,
          endTime: e.end_time,
          notes: e.notes,
          date: e.date,
          category: e.category || 'other',
          createdBy: e.created_by,
          userId: e.user_id,
          reactions: e.reactions ? JSON.parse(e.reactions) : {},
          location: e.location || null,
        });
      });
      setSubCalendarEvents(grouped);
    } catch (e) { console.error(e); }
  };

  const loadSubCalendarMembers = async (subCalId) => {
    try {
      const { data } = await supabase
        .from('sub_calendar_members')
        .select('*')
        .eq('sub_calendar_id', subCalId);
      setSubCalMembers(data || []);
    } catch (e) { console.error(e); }
  };

  const createSubCalendar = async () => {
    console.log('createSubCalendar called', { name: newSubCalName, dates: selectedDates.length, user: user?.id });
    if (!newSubCalName.trim() || selectedDates.length < 2) {
      alert(selectedDates.length < 2 ? `Please select at least 2 dates first. Currently selected: ${selectedDates.length}` : 'Please enter a name.');
      return;
    }
    const sorted = [...selectedDates].sort((a, b) => a - b);
    const startDate = getDateKey(sorted[0]);
    const endDate = getDateKey(sorted[sorted.length - 1]);
    const id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newSC = {
      id,
      name: newSubCalName.trim(),
      start_date: startDate,
      end_date: endDate,
      created_by: currentUser,
      owner_id: user.id,
    };
    const { data: insertData, error } = await supabase.from('sub_calendars').insert(newSC).select();
    console.log('insert response:', insertData, error);
    if (error) {
      console.error('Error creating sub_calendar:', error);
      alert(`Error saving: ${error.message}`);
      return;
    }
    if (!insertData || insertData.length === 0) {
      alert('Saved silently failed — check Supabase RLS policies. Run the SQL fix in the console.');
      return;
    }
    setSubCalendars(prev => [...prev, newSC]);
    setShowSubCalendarModal(false);
    setNewSubCalName('');
    openSubCalendar(newSC);
  };

  const deleteSubCalendar = async (id) => {
    if (!window.confirm('Delete this sub-calendar and all its events?')) return;
    await supabase.from('sub_calendar_events').delete().eq('sub_calendar_id', id);
    await supabase.from('sub_calendar_members').delete().eq('sub_calendar_id', id);
    await supabase.from('sub_calendars').delete().eq('id', id);
    setSubCalendars(prev => prev.filter(sc => sc.id !== id));
    if (activeSubCalendar?.id === id) setActiveSubCalendar(null);
  };

  const openSubCalendar = async (sc) => {
    setActiveSubCalendar(sc);
    setSubCalWeather({});
    setSubCalWeatherSuggestions([]);
    setSubCalWeatherExpanded(false);
    if (sc.weather_location && sc.weather_lat && sc.weather_lon) {
      setSubCalWeatherLocation(sc.weather_location);
      setSubCalWeatherInput(sc.weather_location);
      // Re-fetch fresh forecast using saved coords
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${sc.weather_lat}&longitude=${sc.weather_lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=16`
        );
        const data = await res.json();
        const weatherMap = {};
        data.daily.time.forEach((dateStr, i) => {
          const display = weatherDisplay(data.daily.weathercode[i]);
          weatherMap[dateStr] = { icon: display.icon, color: display.color, high: Math.round(data.daily.temperature_2m_max[i]), low: Math.round(data.daily.temperature_2m_min[i]) };
        });
        setSubCalWeather(weatherMap);
      } catch {}
    } else {
      setSubCalWeatherLocation('');
      setSubCalWeatherInput('');
    }
    setSubCalTab('itinerary');
    setTripPhotos([]);
    await loadSubCalendarEvents(sc.id);
    await loadSubCalendarMembers(sc.id);
    await loadSubCalNotes(sc.id);
    await loadTripPhotos(sc.id);
    const firstDate = new Date(sc.start_date + 'T00:00:00');
    setSubCalSelectedDate(firstDate);
  };

  const inviteToSubCalendar = async (emailOverride) => {
    const emailToInvite = (emailOverride || subCalInviteEmail).trim().toLowerCase();
    if (!emailToInvite || !activeSubCalendar) return;
    const { error } = await supabase.from('sub_calendar_members').insert({
      sub_calendar_id: activeSubCalendar.id,
      email: emailToInvite,
      added_by: user.id,
    });
    if (error) { console.error('Error inviting member:', error); return; }
    setSubCalMembers(prev => [...prev, { email: emailToInvite, sub_calendar_id: activeSubCalendar.id }]);
    setSubCalInviteEmail('');
  };

  const removeMemberFromSubCal = async (email) => {
    await supabase.from('sub_calendar_members')
      .delete()
      .eq('sub_calendar_id', activeSubCalendar.id)
      .eq('email', email);
    setSubCalMembers(prev => prev.filter(m => m.email !== email));
  };

  const loadSubCalNotes = async (subCalId) => {
    try {
      const { data, error } = await supabase
        .from('sub_calendar_notes')
        .select('*')
        .eq('sub_calendar_id', subCalId)
        .order('created_at', { ascending: true });
      if (error) { console.error('Error loading notes:', error); return; }
      setSubCalNotes((data || []).map(n => ({ ...n, checklist: n.checklist ? JSON.parse(n.checklist) : [] })));
    } catch (e) { console.error(e); }
  };

  const loadTripPhotos = async (subCalId) => {
    try {
      const { data, error } = await supabase
        .from('trip_photos')
        .select('*')
        .eq('sub_calendar_id', subCalId)
        .order('created_at', { ascending: true });
      if (error) { console.error('Error loading photos:', error); return; }
      setTripPhotos(data || []);
    } catch (e) { console.error(e); }
  };

  const uploadTripPhoto = async (file, caption, eventId, date) => {
    if (!file) return false;
    if (!activeSubCalendar) {
      setPhotoUploadError(true);
      setPhotoUploadMessage('No active trip selected.');
      return false;
    }
    if (!user) {
      setPhotoUploadError(true);
      setPhotoUploadMessage('Please sign in again, then retry uploading.');
      return false;
    }
    setUploadingPhoto(true);
    setPhotoUploadError(false);
    setPhotoUploadMessage('');
    try {
      const TRIP_PHOTO_BUCKETS = ['trip-photos', 'trip_photos'];
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const filename = `${activeSubCalendar.id}/${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`;
      let selectedBucket = null;
      let uploadError = null;

      for (const bucket of TRIP_PHOTO_BUCKETS) {
        const { error } = await supabase.storage.from(bucket).upload(filename, file, { contentType: file.type });
        if (!error) {
          selectedBucket = bucket;
          uploadError = null;
          break;
        }
        uploadError = error;
        if (!/bucket.*not found/i.test(error.message || '')) break;
      }

      if (!selectedBucket) {
        console.error('Upload error:', uploadError);
        setPhotoUploadError(true);
        if (/bucket.*not found/i.test(uploadError?.message || '')) {
          setPhotoUploadMessage("Upload failed: no storage bucket found. Create a public bucket named 'trip-photos' or 'trip_photos' in Supabase Storage.");
        } else {
          setPhotoUploadMessage(`Upload failed: ${uploadError?.message || 'Unknown upload error'}`);
        }
        return false;
      }

      const { data: urlData } = supabase.storage.from(selectedBucket).getPublicUrl(filename);
      if (!urlData?.publicUrl) {
        setPhotoUploadError(true);
        setPhotoUploadMessage('Upload succeeded but no public URL was generated.');
        return false;
      }
      const photo = {
        id: `ph_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        sub_calendar_id: activeSubCalendar.id,
        event_id: eventId || null,
        date: date || (subCalSelectedDate ? getDateKey(subCalSelectedDate) : null),
        url: urlData.publicUrl,
        caption: caption || null,
        uploaded_by: currentUser,
        user_id: user.id,
      };
      const { error: dbError } = await supabase.from('trip_photos').insert(photo);
      if (dbError) {
        console.error('DB error:', dbError);
        setPhotoUploadError(true);
        setPhotoUploadMessage(`Saved file but failed to add photo record: ${dbError.message}`);
        return false;
      }
      setTripPhotos(prev => [...prev, photo]);
      setPhotoUploadError(false);
      setPhotoUploadMessage(`Uploaded: ${file.name}`);
      return true;
    } catch (e) {
      console.error(e);
      setPhotoUploadError(true);
      setPhotoUploadMessage(`Upload failed: ${e.message || 'Unknown error'}`);
      return false;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const deleteTripPhoto = async (photo) => {
    if (!window.confirm('Delete this photo?')) return;
    const TRIP_PHOTO_BUCKETS = ['trip-photos', 'trip_photos'];
    for (const bucket of TRIP_PHOTO_BUCKETS) {
      const marker = `/object/public/${bucket}/`;
      const idx = photo.url.indexOf(marker);
      if (idx === -1) continue;
      const path = decodeURIComponent(photo.url.slice(idx + marker.length));
      if (!path) continue;
      await supabase.storage.from(bucket).remove([path]);
      break;
    }
    await supabase.from('trip_photos').delete().eq('id', photo.id);
    setTripPhotos(prev => prev.filter(p => p.id !== photo.id));
  };

  const handleTripPhotoFilesSelected = async (files, clearInput) => {
    if (!files || files.length === 0) return;
    setPhotoUploadError(false);
    setPhotoUploadMessage('');
    let successCount = 0;
    for (const file of files) {
      const ok = await uploadTripPhoto(
        file,
        photoCaption,
        photoEventId,
        photoDate || (subCalSelectedDate ? getDateKey(subCalSelectedDate) : null)
      );
      if (ok) successCount += 1;
    }
    if (successCount > 1) {
      setPhotoUploadError(false);
      setPhotoUploadMessage(`Uploaded ${successCount} photos.`);
    }
    setPhotoCaption('');
    setPhotoEventId(null);
    if (clearInput) clearInput();
  };

  const renameSubCalendar = async (newName) => {
    if (!newName.trim() || !activeSubCalendar) return;
    await supabase.from('sub_calendars').update({ name: newName.trim() }).eq('id', activeSubCalendar.id);
    setActiveSubCalendar(prev => ({ ...prev, name: newName.trim() }));
    setSubCalendars(prev => prev.map(sc => sc.id === activeSubCalendar.id ? { ...sc, name: newName.trim() } : sc));
    setEditingSubCalTitle(false);
  };

  const addSubCalNote = async () => {
    if (!newNote.trim() || !activeSubCalendar) return;
    const note = {
      id: `scn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sub_calendar_id: activeSubCalendar.id,
      text: newNote.trim(),
      checklist: JSON.stringify([]),
      created_by: currentUser,
      user_id: user?.id,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('sub_calendar_notes').insert(note);
    if (error) { console.error('Error adding note:', error); return; }
    setSubCalNotes(prev => [...prev, { ...note, checklist: [] }]);
    setNewNote('');
  };

  const deleteSubCalNote = async (noteId) => {
    await supabase.from('sub_calendar_notes').delete().eq('id', noteId);
    setSubCalNotes(prev => prev.filter(n => n.id !== noteId));
    if (expandedNote === noteId) setExpandedNote(null);
  };

  const updateNoteText = async (noteId, newText) => {
    if (!newText.trim()) return;
    await supabase.from('sub_calendar_notes').update({ text: newText.trim() }).eq('id', noteId);
    setSubCalNotes(prev => prev.map(n => n.id === noteId ? { ...n, text: newText.trim() } : n));
    setEditingNote(null);
  };

  const updateSubCalTitle = async (newName) => {
    if (!newName.trim() || !activeSubCalendar) return;
    await supabase.from('sub_calendars').update({ name: newName.trim() }).eq('id', activeSubCalendar.id);
    setActiveSubCalendar(prev => ({ ...prev, name: newName.trim() }));
    setSubCalendars(prev => prev.map(sc => sc.id === activeSubCalendar.id ? { ...sc, name: newName.trim() } : sc));
    setEditingSubCalTitle(false);
  };

  const extendSubCalDates = async (direction) => {
    // direction: 'before' adds 1 day before start, 'after' adds 1 day after end
    const start = new Date(activeSubCalendar.start_date + 'T00:00:00');
    const end = new Date(activeSubCalendar.end_date + 'T00:00:00');
    if (direction === 'before') start.setDate(start.getDate() - 1);
    else end.setDate(end.getDate() + 1);
    const newStart = getDateKey(start);
    const newEnd = getDateKey(end);
    await supabase.from('sub_calendars').update({ start_date: newStart, end_date: newEnd }).eq('id', activeSubCalendar.id);
    const updated = { ...activeSubCalendar, start_date: newStart, end_date: newEnd };
    setActiveSubCalendar(updated);
    setSubCalendars(prev => prev.map(sc => sc.id === activeSubCalendar.id ? updated : sc));
    if (direction === 'before') setSubCalSelectedDate(start);
    else setSubCalSelectedDate(end);
  };

  const shrinkSubCalDate = async (direction) => {
    const start = new Date(activeSubCalendar.start_date + 'T00:00:00');
    const end = new Date(activeSubCalendar.end_date + 'T00:00:00');
    if (start.getTime() === end.getTime()) return; // keep at least 1 day
    if (direction === 'before') start.setDate(start.getDate() + 1);
    else end.setDate(end.getDate() - 1);
    const newStart = getDateKey(start);
    const newEnd = getDateKey(end);
    await supabase.from('sub_calendars').update({ start_date: newStart, end_date: newEnd }).eq('id', activeSubCalendar.id);
    const updated = { ...activeSubCalendar, start_date: newStart, end_date: newEnd };
    setActiveSubCalendar(updated);
    setSubCalendars(prev => prev.map(sc => sc.id === activeSubCalendar.id ? updated : sc));
    const selectedKey = subCalSelectedDate ? getDateKey(subCalSelectedDate) : null;
    if (!selectedKey || selectedKey < newStart || selectedKey > newEnd) setSubCalSelectedDate(start);
  };

  const searchWeatherLocations = async (query) => {
    if (query.length < 2) { setSubCalWeatherSuggestions([]); return; }
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
      const data = await res.json();
      setSubCalWeatherSuggestions(data.results || []);
    } catch { setSubCalWeatherSuggestions([]); }
  };

  const fetchSubCalWeather = async (geoResult) => {
    if (!activeSubCalendar) return;
    setSubCalWeatherLoading(true);
    setSubCalWeatherSuggestions([]);
    try {
      const { latitude, longitude, name, admin1, country } = geoResult;
      const label = [name, admin1, country].filter(Boolean).join(', ');
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=16`
      );
      const data = await res.json();
      const weatherMap = {};
      data.daily.time.forEach((dateStr, i) => {
        const display = weatherDisplay(data.daily.weathercode[i]);
        weatherMap[dateStr] = {
          icon: display.icon,
          color: display.color,
          high: Math.round(data.daily.temperature_2m_max[i]),
          low: Math.round(data.daily.temperature_2m_min[i]),
        };
      });
      setSubCalWeather(weatherMap);
      setSubCalWeatherLocation(label);
      setSubCalWeatherInput(label);
      setSubCalWeatherExpanded(false);
      // Persist to Supabase so it reloads next time
      await supabase.from('sub_calendars').update({ weather_location: label, weather_lat: latitude, weather_lon: longitude }).eq('id', activeSubCalendar.id);
      setActiveSubCalendar(prev => ({ ...prev, weather_location: label, weather_lat: latitude, weather_lon: longitude }));
    } catch (err) {
      console.error('Failed to fetch sub-cal weather:', err);
    }
    setSubCalWeatherLoading(false);
  };

  const reorderNote = async (noteId, direction) => {
    const idx = subCalNotes.findIndex(n => n.id === noteId);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === subCalNotes.length - 1) return;
    const newNotes = [...subCalNotes];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newNotes[idx], newNotes[swapIdx]] = [newNotes[swapIdx], newNotes[idx]];
    setSubCalNotes(newNotes);
    // Save new order by updating a sort_order field or re-inserting — simplest: update created_at timestamps
    await supabase.from('sub_calendar_notes').update({ created_at: new Date(Date.now() - 1000).toISOString() }).eq('id', newNotes[swapIdx].id);
    await supabase.from('sub_calendar_notes').update({ created_at: new Date().toISOString() }).eq('id', newNotes[idx].id);
  };

  const addChecklistItem = async (noteId, itemText) => {
    if (!itemText.trim()) return;
    const note = subCalNotes.find(n => n.id === noteId);
    const checklist = [...(note.checklist || []), { id: Date.now(), text: itemText.trim(), done: false }];
    await supabase.from('sub_calendar_notes').update({ checklist: JSON.stringify(checklist) }).eq('id', noteId);
    setSubCalNotes(prev => prev.map(n => n.id === noteId ? { ...n, checklist } : n));
    setNewChecklistItem('');
  };

  const toggleChecklistItem = async (noteId, itemId) => {
    const note = subCalNotes.find(n => n.id === noteId);
    const checklist = note.checklist.map(item => item.id === itemId ? { ...item, done: !item.done } : item);
    await supabase.from('sub_calendar_notes').update({ checklist: JSON.stringify(checklist) }).eq('id', noteId);
    setSubCalNotes(prev => prev.map(n => n.id === noteId ? { ...n, checklist } : n));
  };

  const deleteChecklistItem = async (noteId, itemId) => {
    const note = subCalNotes.find(n => n.id === noteId);
    const checklist = note.checklist.filter(item => item.id !== itemId);
    await supabase.from('sub_calendar_notes').update({ checklist: JSON.stringify(checklist) }).eq('id', noteId);
    setSubCalNotes(prev => prev.map(n => n.id === noteId ? { ...n, checklist } : n));
  };

  const addSubCalEvent = async (date, title, time, endTime, location = null) => {
    if (!title?.trim() || !activeSubCalendar) { console.log('addSubCalEvent bail: no title or no activeSubCalendar', {title, activeSubCalendar}); return; }
    if (!user?.id) { console.log('addSubCalEvent bail: no user'); return; }
    const id = `sce_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newEvent = {
      id,
      sub_calendar_id: activeSubCalendar.id,
      date: getDateKey(date),
      title: title.trim(),
      time: time || null,
      end_time: endTime || null,
      notes: null,
      category: 'other',
      created_by: currentUser,
      user_id: user.id,
      reactions: null,
      location: location || null,
    };
    const { error } = await supabase.from('sub_calendar_events').insert(newEvent);
    if (error) { console.error('Error adding sub_calendar_event:', error); return; }
    const dateKey = getDateKey(date);
    setSubCalendarEvents(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), {
        id, title: newEvent.title, time: newEvent.time,
        endTime: newEvent.end_time, notes: null, date: dateKey,
        category: 'other', createdBy: currentUser, userId: user.id, reactions: {},
        location: location || null,
      }]
    }));
  };

  const updateSubCalEvent = async (eventId, updates) => {
    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.time !== undefined) dbUpdates.time = updates.time;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.reactions !== undefined) dbUpdates.reactions = JSON.stringify(updates.reactions);
    await supabase.from('sub_calendar_events').update(dbUpdates).eq('id', eventId);
    setSubCalendarEvents(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(dateKey => {
        updated[dateKey] = updated[dateKey].map(e =>
          e.id === eventId ? { ...e, ...updates } : e
        );
      });
      return updated;
    });
  };

  const deleteSubCalEvent = async (eventId, dateKey) => {
    await supabase.from('sub_calendar_events').delete().eq('id', eventId);
    setSubCalendarEvents(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(e => e.id !== eventId)
    }));
  };

  const handleSubCalReact = (event, emoji) => {
    const currentReactions = event.reactions || {};
    const currentUsers = currentReactions[emoji] || [];
    const updatedUsers = currentUsers.includes(currentUser)
      ? currentUsers.filter(u => u !== currentUser)
      : [...currentUsers, currentUser];
    const updatedReactions = { ...currentReactions, [emoji]: updatedUsers };
    Object.keys(updatedReactions).forEach(k => {
      if (updatedReactions[k].length === 0) delete updatedReactions[k];
    });
    updateSubCalEvent(event.id, { reactions: updatedReactions });
    setSubCalShowReactionPicker(null);
  };

  // Get all dates between start and end inclusive
  const getSubCalDates = (sc) => {
    const dates = [];
    const cur = new Date(sc.start_date + 'T00:00:00');
    const end = new Date(sc.end_date + 'T00:00:00');
    while (cur <= end) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };

  // Hours to show in timeline
  const TIMELINE_HOURS = Array.from({ length: 24 }, (_, i) => (i + 6) % 24); // 6am–5am

  const handleReact = (event, emoji) => {
    const actualDateKey = Object.keys(events).find(k => events[k].some(e => e.id === event.id));
    if (!actualDateKey) return;
    const currentReactions = event.reactions || {};
    const currentUsers = currentReactions[emoji] || [];
    let updatedUsers;
    if (currentUsers.includes(currentUser)) {
      updatedUsers = currentUsers.filter(u => u !== currentUser);
    } else {
      updatedUsers = [...currentUsers, currentUser];
    }
    const updatedReactions = { ...currentReactions, [emoji]: updatedUsers };
    Object.keys(updatedReactions).forEach(k => {
      if (updatedReactions[k].length === 0) delete updatedReactions[k];
    });

    // Update local state immediately — single setEvents call, no saveEvents
    setEvents(prev => ({
      ...prev,
      [actualDateKey]: prev[actualDateKey].map(e =>
        e.id === event.id ? { ...e, reactions: updatedReactions } : e
      )
    }));
    setShowReactionPicker(null);

    // Save only the reactions field directly to DB — bypass saveEvents entirely
    supabase
      .from('events')
      .update({ reactions: JSON.stringify(updatedReactions) })
      .eq('id', event.id)
      .then(({ error }) => {
        if (error) console.error('Error saving reaction:', error);
      });
  }; // 'month' | 'week'
  const [holidays, setHolidays] = useState({});
  const [sharedCalendars, setSharedCalendars] = useState([]); // calendars others shared with me
  const [myShares, setMyShares] = useState([]); // people I've shared with
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showListPanel, setShowListPanel] = useState(false);
  const [sharedListGroups, setSharedListGroups] = useState([]);
  const [sharedListItems, setSharedListItems] = useState([]);
  const [selectedSharedListId, setSelectedSharedListId] = useState(null);
  const [newSharedListTitle, setNewSharedListTitle] = useState('');
  const [newListItemText, setNewListItemText] = useState('');
  const [editingListItemId, setEditingListItemId] = useState(null);
  const [editingListText, setEditingListText] = useState('');
  const [listError, setListError] = useState('');
  const [shareEmailInput, setShareEmailInput] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [activeCalendars, setActiveCalendars] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [showTipBanner, setShowTipBanner] = useState(() => localStorage.getItem('hideTipBanner') !== 'true');
  const [weather, setWeather] = useState({}); // { 'YYYY-MM-DD': { emoji, high, low } }
  const [showWeather, setShowWeather] = useState(true);

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
    const year = parseInt(dateKey.split('-')[0]);
    const yearHolidays = holidays[year] || [];
    return yearHolidays.find(h => h.date === dateKey) || null;
  };

  // Weather code → display object with emoji/label and a color
  const weatherDisplay = (code) => {
    if (code === 0) return { icon: '☀️', color: 'text-yellow-500' };
    if (code <= 2) return { icon: '⛅', color: 'text-yellow-400' };
    if (code <= 3) return { icon: '☁️', color: 'text-gray-400' };
    if (code <= 49) return { icon: 'FOG', color: 'text-gray-400' };
    if (code <= 59) return { icon: '🌦️', color: 'text-blue-400' };
    if (code <= 67) return { icon: '🌧️', color: 'text-blue-500' };
    if (code <= 77) return { icon: '🌨️', color: 'text-blue-200' };
    if (code <= 84) return { icon: '🌧️', color: 'text-blue-500' };
    if (code <= 99) return { icon: '⛈️', color: 'text-purple-500' };
    return { icon: '⛈️', color: 'text-purple-500' };
  };

  const fetchWeather = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=14`
      );
      if (!res.ok) return;
      const data = await res.json();
      const weatherMap = {};
      data.daily.time.forEach((dateStr, i) => {
        const display = weatherDisplay(data.daily.weathercode[i]);
        weatherMap[dateStr] = {
          icon: display.icon,
          color: display.color,
          high: Math.round(data.daily.temperature_2m_max[i]),
          low: Math.round(data.daily.temperature_2m_min[i]),
        };
      });
      setWeather(weatherMap);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
    }
  };

  // Get user location then fetch weather
  useEffect(() => {
    const initWeather = () => {
      if (!navigator.geolocation) {
        // Fallback to Fresno if geolocation not supported
        fetchWeather(36.7378, -119.7871);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchWeather(latitude, longitude);
          // Refresh every 3 hours with same location
          const interval = setInterval(() => fetchWeather(latitude, longitude), 3 * 60 * 60 * 1000);
          return () => clearInterval(interval);
        },
        () => {
          // User denied or error — fallback to Fresno
          fetchWeather(36.7378, -119.7871);
        },
        { timeout: 10000 }
      );
    };
    initWeather();
  }, []);
  const handleDateTap = (date) => {
    if (!date) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;
    const isDoubleTap = timeSinceLastTap < 300 && firstTapDate && isSameDay(firstTapDate, date);

    if (dateTapTimeoutRef.current) {
      clearTimeout(dateTapTimeoutRef.current);
      dateTapTimeoutRef.current = null;
    }

    // Double tap detection (within 300ms)
    if (isDoubleTap) {
      // Double tap on same date - start multi-day selection
      setShowDateDetailModal(false);
      setSelectedDate(date);
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
      setSelectedDate(start);
      setSelectedDates(dates);
      setSelectionStart(null);
      setFirstTapDate(null);
      setShowDateDetailModal(true);
    } else {
      // Single tap - select this date
      setSelectedDate(date);
      setFirstTapDate(date);
      setSelectedDates([]);
      setSelectionStart(null);
      dateTapTimeoutRef.current = setTimeout(() => {
        setShowDateDetailModal(true);
        dateTapTimeoutRef.current = null;
      }, 320);
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

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateKey = getDateKey(date);
    const directEvents = events[dateKey] || [];

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const virtualRecurrences = [];

    Object.values(events).forEach(dateEvents => {
      dateEvents.forEach(event => {
        const alreadyDirect = directEvents.some(e => e.id === event.id);
        if (alreadyDirect) return;

        const eventDate = new Date(event.date + 'T00:00:00');

        if (event.recurrence === 'annual' || event.isAnnual) {
          if (event.annualMonth === month && event.annualDay === day) {
            if (!(event.exceptions || []).includes(dateKey)) {
              virtualRecurrences.push({ ...event, date: dateKey, isVirtualAnnual: true });
            }
          }
        } else if (event.recurrence === 'weekly') {
          if (eventDate.getDay() === dayOfWeek && date > eventDate) {
            if (!(event.exceptions || []).includes(dateKey)) {
              virtualRecurrences.push({ ...event, date: dateKey, isVirtualRecurrence: true });
            }
          }
        } else if (event.recurrence === 'monthly') {
          if (eventDate.getDate() === day && date > eventDate) {
            if (!(event.exceptions || []).includes(dateKey)) {
              virtualRecurrences.push({ ...event, date: dateKey, isVirtualRecurrence: true });
            }
          }
        }
      });
    });

    const holidayEvents = [];
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

    return [...holidayEvents, ...directEvents, ...virtualRecurrences].sort((a, b) => {
      if (a.isHoliday) return -1;
      if (b.isHoliday) return 1;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  };

  const saveEvents = async (newEvents) => {
    try {
      setEvents(newEvents);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const myEvents = [];
          const sharedUpdates = []; // events owned by others that we've edited

          Object.entries(newEvents).forEach(([date, dateEvents]) => {
            dateEvents.forEach(event => {
              if (event.userId && event.userId !== user?.id) {
                // Shared event — do a targeted update on just the fields we allow editing
                sharedUpdates.push(event);
                return;
              }
              myEvents.push({
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
                recurrence: event.recurrence || 'once',
                exceptions: event.exceptions ? JSON.stringify(event.exceptions) : null,
                reactions: event.reactions ? JSON.stringify(event.reactions) : null,
                location: event.location || null,
                created_by: event.createdBy,
                created_at: event.createdAt,
                user_id: user?.id
              });
            });
          });

          // Save own events via delete+reinsert
          await supabase.from('events').delete().eq('user_id', user?.id);
          if (myEvents.length > 0) {
            const { error } = await supabase.from('events').insert(myEvents);
            if (error) console.error('Error saving events to Supabase:', error);
          }

          // Save shared event edits via targeted UPDATE on each row
          for (const event of sharedUpdates) {
            await supabase.from('events').update({
              title: event.title,
              time: event.time,
              category: event.category,
              is_private: event.isPrivate || false,
              is_urgent: event.isUrgent || false,
              is_annual: event.isAnnual || false,
              annual_month: event.annualMonth || null,
              annual_day: event.annualDay || null,
              recurrence: event.recurrence || 'once',
              exceptions: event.exceptions ? JSON.stringify(event.exceptions) : null,
              reactions: event.reactions ? JSON.stringify(event.reactions) : null,
              location: event.location || null,
            }).eq('id', event.id);
          }
        } catch (err) {
          console.error('Error writing to Supabase:', err);
        }
      }, 800);
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

  const primaryListOwnerId = (sharedCalendars && sharedCalendars.length > 0)
    ? sharedCalendars[0].owner_id
    : user?.id;

  const loadSharedListGroups = async (ownerId) => {
    if (!ownerId) return;
    const { data, error } = await supabase
      .from('shared_list_groups')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading shared list groups:', error);
      if (error.code === '42P01') {
        setListError('List feature needs DB setup (shared_list_groups/shared_lists tables are missing).');
      } else {
        setListError(`Could not load lists: ${error.message}`);
      }
      return;
    }

    setListError('');
    const groups = data || [];
    setSharedListGroups(groups);
    if (groups.length === 0) {
      setSelectedSharedListId(null);
      setSharedListItems([]);
      return;
    }
    if (!selectedSharedListId || !groups.some(g => g.id === selectedSharedListId)) {
      setSelectedSharedListId(groups[0].id);
    }
  };

  const loadSharedListItems = async (ownerId, listId) => {
    if (!ownerId || !listId) {
      setSharedListItems([]);
      return;
    }
    const { data, error } = await supabase
      .from('shared_lists')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('list_id', listId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading shared list items:', error);
      if (error.code === '42P01') {
        setListError('List feature needs DB setup (shared_list_groups/shared_lists tables are missing).');
      } else {
        setListError(`Could not load list items: ${error.message}`);
      }
      return;
    }

    setListError('');
    setSharedListItems((data || []).map(item => ({ ...item, done: !!item.done })));
  };

  const createSharedList = async () => {
    const title = newSharedListTitle.trim();
    if (!title || !primaryListOwnerId || !user?.id) return;

    const payload = {
      owner_id: primaryListOwnerId,
      title,
      created_by: currentUser || user.email || 'User',
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('shared_list_groups')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating shared list:', error);
      setListError(`Could not create list: ${error.message}`);
      return;
    }

    setListError('');
    const created = data || payload;
    setSharedListGroups(prev => [...prev, created]);
    setSelectedSharedListId(created.id);
    setNewSharedListTitle('');
    setSharedListItems([]);
  };

  const deleteSharedList = async (listId) => {
    if (!listId || !primaryListOwnerId) return;
    if (!window.confirm('Delete this list and all its items?')) return;

    const { error: itemDeleteError } = await supabase
      .from('shared_lists')
      .delete()
      .eq('owner_id', primaryListOwnerId)
      .eq('list_id', listId);

    if (itemDeleteError) {
      setListError(`Could not delete list items: ${itemDeleteError.message}`);
      return;
    }

    const { error: listDeleteError } = await supabase
      .from('shared_list_groups')
      .delete()
      .eq('id', listId);

    if (listDeleteError) {
      setListError(`Could not delete list: ${listDeleteError.message}`);
      return;
    }

    setListError('');
    const remaining = sharedListGroups.filter(g => g.id !== listId);
    setSharedListGroups(remaining);
    setSelectedSharedListId(remaining.length > 0 ? remaining[0].id : null);
    if (remaining.length === 0) setSharedListItems([]);
  };

  const addSharedListItem = async () => {
    const text = newListItemText.trim();
    if (!text || !primaryListOwnerId || !selectedSharedListId || !user?.id) return;

    const payload = {
      owner_id: primaryListOwnerId,
      list_id: selectedSharedListId,
      text,
      done: false,
      created_by: currentUser || user.email || 'User',
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('shared_lists')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('Error adding list item:', error);
      setListError(`Could not add item: ${error.message}`);
      return;
    }

    setListError('');
    setSharedListItems(prev => [...prev, { ...(data || payload), done: false }]);
    setNewListItemText('');
  };

  const toggleSharedListItem = async (item) => {
    const { error } = await supabase
      .from('shared_lists')
      .update({ done: !item.done })
      .eq('id', item.id);

    if (error) {
      console.error('Error updating list item:', error);
      setListError(`Could not update item: ${error.message}`);
      return;
    }

    setListError('');
    setSharedListItems(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i));
  };

  const removeSharedListItem = async (itemId) => {
    const { error } = await supabase
      .from('shared_lists')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting list item:', error);
      setListError(`Could not delete item: ${error.message}`);
      return;
    }

    setListError('');
    setSharedListItems(prev => prev.filter(i => i.id !== itemId));
  };

  const startEditingListItem = (item) => {
    setEditingListItemId(item.id);
    setEditingListText(item.text || '');
  };

  const saveSharedListItemText = async (item) => {
    const nextText = editingListText.trim();
    if (!nextText) {
      setListError('List item text cannot be empty.');
      return;
    }
    if (nextText === item.text) {
      setEditingListItemId(null);
      setEditingListText('');
      return;
    }

    const { error } = await supabase
      .from('shared_lists')
      .update({ text: nextText })
      .eq('id', item.id);

    if (error) {
      console.error('Error editing list item:', error);
      setListError(`Could not edit item: ${error.message}`);
      return;
    }

    setListError('');
    setSharedListItems(prev => prev.map(i => i.id === item.id ? { ...i, text: nextText } : i));
    setEditingListItemId(null);
    setEditingListText('');
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
              recurrence: event.recurrence || (event.is_annual ? 'annual' : 'once'),
              exceptions: event.exceptions ? JSON.parse(event.exceptions) : [],
              reactions: event.reactions ? JSON.parse(event.reactions) : {},
              location: event.location || null,
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
                recurrence: event.recurrence || (event.is_annual ? 'annual' : 'once'),
                exceptions: event.exceptions ? JSON.parse(event.exceptions) : [],
                reactions: event.reactions ? JSON.parse(event.reactions) : {},
                location: event.location || null,
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

        // Load sub-calendars now that we know user is authenticated
        await loadSubCalendars();
      } catch (error) {
        console.log('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Listen for changes to OTHER users' events (shared calendars)
    // We use a separate loadSharedEvents function that only fetches shared data
    // and merges it with local state — never triggers a save
    const loadSharedEvents = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        const userEmail = session?.user?.email;
        if (!userId) return;

        // Get calendars shared with me
        const { data: sharedData } = await supabase
          .from('shared_access')
          .select('*')
          .or(`shared_with_email.eq.${userEmail},shared_with_id.eq.${userId}`);

        if (!sharedData || sharedData.length === 0) return;

        const ownerIds = sharedData.map(s => s.owner_id);
        const { data: sharedEventsData } = await supabase
          .from('events')
          .select('*')
          .in('user_id', ownerIds);

        if (!sharedEventsData) return;

        // Merge shared events into current state without overwriting own events
        setEvents(prev => {
          const merged = {};
          // Keep all own events
          Object.entries(prev).forEach(([dateKey, evts]) => {
            merged[dateKey] = evts.filter(e => !e.isShared);
          });
          // Add fresh shared events
          sharedEventsData.forEach(event => {
            if (!merged[event.date]) merged[event.date] = [];
            merged[event.date].push({
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
              recurrence: event.recurrence || 'once',
              exceptions: event.exceptions ? JSON.parse(event.exceptions) : [],
              reactions: event.reactions ? JSON.parse(event.reactions) : {},
              location: event.location || null,
              createdBy: event.created_by,
              createdAt: event.created_at,
              userId: event.user_id,
              isShared: true
            });
          });
          return merged;
        });
      } catch (err) {
        console.error('Error refreshing shared events:', err);
      }
    };

    const sharedSubscription = supabase
      .channel('shared-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        loadSharedEvents();
      })
      .subscribe();

    return () => sharedSubscription.unsubscribe();
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

  useEffect(() => {
    if (!primaryListOwnerId) return;
    loadSharedListGroups(primaryListOwnerId);
  }, [primaryListOwnerId]);

  useEffect(() => {
    if (!primaryListOwnerId || !selectedSharedListId) {
      setSharedListItems([]);
      return;
    }
    loadSharedListItems(primaryListOwnerId, selectedSharedListId);
  }, [primaryListOwnerId, selectedSharedListId]);

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

  const toggleNotificationWindow = async (key, currentValue, setter) => {
    const next = !currentValue;
    setter(next);
    await window.storage.set(key, next.toString(), false);
  };

  // Check for upcoming events and send notifications
  useEffect(() => {
    if (!notificationsEnabled) return;
    if (!notifyOneWeek && !notifyOneDay && !notifyOneHour) return;

    const readSentMap = () => {
      try {
        const raw = localStorage.getItem('notification-sent-map');
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    };

    const writeSentMap = (map) => {
      try {
        localStorage.setItem('notification-sent-map', JSON.stringify(map));
      } catch {}
    };

    const checkNotifications = () => {
      const now = new Date();
      const sentMap = readSentMap();

      Object.entries(events).forEach(([dateKey, dateEvents]) => {
        dateEvents.forEach(event => {
          if (event.isPrivate && showPrivateEvents === false) return;
          if (onlyNotifyUrgent && !event.isUrgent) return;

          let eventDateTime;
          if (event.time && /^\d{2}:\d{2}$/.test(event.time)) {
            eventDateTime = new Date(`${dateKey}T${event.time}:00`);
          } else {
            eventDateTime = new Date(`${dateKey}T00:00:00`);
          }

          const timeDiff = eventDateTime.getTime() - now.getTime();
          if (timeDiff <= 0) return;

          const urgentPrefix = event.isUrgent ? 'URGENT: ' : '';
          const windows = [
            { enabled: notifyOneWeek, ms: 7 * 24 * 60 * 60 * 1000, key: 'week', title: `${urgentPrefix}Event in 1 Week` },
            { enabled: notifyOneDay, ms: 24 * 60 * 60 * 1000, key: 'day', title: `${urgentPrefix}Event in 1 Day` },
            { enabled: notifyOneHour, ms: 60 * 60 * 1000, key: 'hour', title: `${urgentPrefix}Event in 1 Hour` },
          ];

          windows.forEach(windowDef => {
            if (!windowDef.enabled) return;
            if (timeDiff > windowDef.ms) return;

            const sentKey = `${event.id}-${dateKey}-${windowDef.key}`;
            if (sentMap[sentKey]) return;

            new Notification(windowDef.title, {
              body: `${event.title} - ${eventDateTime.toLocaleString()}`,
              tag: sentKey,
            });

            sentMap[sentKey] = true;
          });
        });
      });

      writeSentMap(sentMap);
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [events, notificationsEnabled, showPrivateEvents, onlyNotifyUrgent, notifyOneWeek, notifyOneDay, notifyOneHour]);
  // Load notification preference
  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const result = await window.storage.get('notifications-enabled', false);
        if (result && result.value === 'true') setNotificationsEnabled(true);
        const urgentResult = await window.storage.get('notification-urgent-only', false);
        if (urgentResult && urgentResult.value === 'true') setOnlyNotifyUrgent(true);
        const legacyUrgentResult = await window.storage.get('notify-urgent-only', false);
        if (legacyUrgentResult && legacyUrgentResult.value === 'true') setOnlyNotifyUrgent(true);
        const weekResult = await window.storage.get('notification-window-week', false);
        if (weekResult && weekResult.value === 'false') setNotifyOneWeek(false);
        const dayResult = await window.storage.get('notification-window-day', false);
        if (dayResult && dayResult.value === 'false') setNotifyOneDay(false);
        const hourResult = await window.storage.get('notification-window-hour', false);
        if (hourResult && hourResult.value === 'true') setNotifyOneHour(true);
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

  useEffect(() => {
    return () => {
      if (dateTapTimeoutRef.current) {
        clearTimeout(dateTapTimeoutRef.current);
      }
    };
  }, []);

  // Close reaction picker when clicking anywhere outside it
  useEffect(() => {
    if (!showReactionPicker) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.reaction-picker')) {
        setShowReactionPicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showReactionPicker]);

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
  };

  const handleUpdateCategoryAndClose = (key, updates) => {
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
        isAnnual: recurrence === 'annual',
        recurrence: recurrence,
        annualMonth: recurrence === 'annual' ? (date.getMonth() + 1) : null,
        annualDay: recurrence === 'annual' ? date.getDate() : null,
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
    setRecurrence('once');
    setShowTimePrompt(false);
    setPendingEvent(null);
  };

  const handleDeleteEvent = (dateKey, eventId, isVirtualAnnual = false, isVirtualRecurrence = false, skipOnce = false) => {
    const eventToDelete = events[dateKey]?.find(e => e.id === eventId);

    if (isVirtualAnnual || isVirtualRecurrence) {
      // Find the original event
      let originalDateKey = null;
      let originalEvent = null;
      Object.entries(events).forEach(([key, evts]) => {
        const found = evts.find(e => e.id === eventId);
        if (found) { originalDateKey = key; originalEvent = found; }
      });
      if (!originalDateKey || !originalEvent) return;

      if (skipOnce) {
        // Add this date as an exception so it's skipped in future renders
        const updatedExceptions = [...(originalEvent.exceptions || []), dateKey];
        const updatedEvents = {
          ...events,
          [originalDateKey]: events[originalDateKey].map(e =>
            e.id === eventId ? { ...e, exceptions: updatedExceptions } : e
          )
        };
        saveEvents(updatedEvents);
      } else {
        // Delete the whole recurring event
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
    // Find the actual date key where this event is stored
    const actualDateKey = Object.keys(events).find(k => events[k].some(e => e.id === eventId)) || dateKey;
    const updatedEvents = {
      ...events,
      [actualDateKey]: events[actualDateKey].map(e => e.id === eventId ? { ...e, ...updates } : e)
        .sort((a, b) => {
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
        })
    };
    saveEvents(updatedEvents);
    setEditingEvent(null);
  };

  // Update a field without closing the edit form (for toggles)
  const handleUpdateEventField = (dateKey, eventId, updates) => {
    // Find the actual date key where this event is stored
    const actualDateKey = Object.keys(events).find(k => events[k].some(e => e.id === eventId)) || dateKey;
    const updatedEvents = {
      ...events,
      [actualDateKey]: events[actualDateKey]?.map(e => e.id === eventId ? { ...e, ...updates } : e) || []
    };
    saveEvents(updatedEvents);
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

  const changeWeek = (delta) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta * 7);
    setCurrentDate(d);
  };

  // Returns the 7 days of the week containing currentDate
  const getWeekDays = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(sunday);
      dd.setDate(sunday.getDate() + i);
      return dd;
    });
  };

  const selectedDateKey = getDateKey(selectedDate);
  const selectedEvents = getEventsForDate(selectedDate);
  const todayKey = getDateKey(new Date());
  const todayEvents = getEventsForDate(new Date()).filter(e => !e.isHoliday);
  const getSubCalStartRaw = (sc) => sc?.start_date ?? sc?.startDate ?? sc?.start ?? sc?.date ?? null;
  const getSubCalEndRaw = (sc) => sc?.end_date ?? sc?.endDate ?? sc?.end ?? getSubCalStartRaw(sc);
  const toDateOnlyTs = (value) => {
    if (!value) return null;

    let d = null;
    if (value instanceof Date) {
      d = new Date(value);
    } else if (typeof value === 'string') {
      const trimmed = value.trim();

      // Common DB formats: YYYY-MM-DD or ISO datetime
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        d = new Date(`${trimmed.slice(0, 10)}T00:00:00`);
      } else {
        // Legacy UI formats like M/D/YYYY
        const mdY = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (mdY) {
          const month = Number(mdY[1]) - 1;
          const day = Number(mdY[2]);
          const year = Number(mdY[3]);
          d = new Date(year, month, day);
        } else {
          // Last resort parse
          const parsed = new Date(trimmed);
          if (!Number.isNaN(parsed.getTime())) d = parsed;
        }
      }
    } else {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) d = parsed;
    }

    if (!d || Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const todayTs = toDateOnlyTs(todayKey);
  const formatTripDate = (value, withYear = false) => {
    const ts = toDateOnlyTs(value);
    if (ts === null) return 'Unknown date';
    return new Date(ts).toLocaleDateString('en-US', withYear ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' });
  };
  const upcomingTrips = [...subCalendars]
    .filter(sc => {
      const startTs = toDateOnlyTs(getSubCalStartRaw(sc));
      return startTs !== null && startTs > todayTs;
    })
    .sort((a, b) => toDateOnlyTs(getSubCalStartRaw(a)) - toDateOnlyTs(getSubCalStartRaw(b)));
  const archivedTrips = [...subCalendars]
    .filter(sc => {
      const endTs = toDateOnlyTs(getSubCalEndRaw(sc));
      return endTs !== null && endTs < todayTs;
    })
    .sort((a, b) => toDateOnlyTs(getSubCalEndRaw(b)) - toDateOnlyTs(getSubCalEndRaw(a)));

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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div style={{ width: 'calc(100vw - 2rem)', maxWidth: '28rem', boxSizing: 'border-box' }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            What time?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">Event: <strong>{pendingEvent.title}</strong></p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {pendingEvent.isMultiDay ? "Multi-day events don't need a time" : 'Enter a time or skip to add without time'}
            {recurrence !== 'once' && (
              <span className="ml-2 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                {recurrence === 'weekly' ? '🔁 Weekly' : recurrence === 'monthly' ? '🔁 Monthly' : '🔁 Annual'}
              </span>
            )}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
            <input
              type="text"
              id="timeInput"
              placeholder="e.g. 3:00 PM or 15:00"
              style={{ boxSizing: 'border-box', minWidth: 0 }}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const val = e.target.value;
                  // parse "3pm", "3:30pm", "15:00" etc into HH:MM
                  const match = val.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
                  if (match) {
                    let h = parseInt(match[1]);
                    const m = match[2] ? parseInt(match[2]) : 0;
                    const period = match[3]?.toLowerCase();
                    if (period === 'pm' && h < 12) h += 12;
                    if (period === 'am' && h === 12) h = 0;
                    handleTimeSubmit(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
                  } else {
                    handleTimeSubmit(null);
                  }
                }
              }}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                const input = document.getElementById('timeInput');
                const val = input.value.trim();
                if (!val) { handleTimeSubmit(null); return; }
                const match = val.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
                if (match) {
                  let h = parseInt(match[1]);
                  const m = match[2] ? parseInt(match[2]) : 0;
                  const period = match[3]?.toLowerCase();
                  if (period === 'pm' && h < 12) h += 12;
                  if (period === 'am' && h === 12) h = 0;
                  handleTimeSubmit(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
                } else {
                  handleTimeSubmit(null);
                }
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              Add Event
            </button>
            <button
              onClick={() => handleTimeSubmit(null)}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Skip Time
            </button>
            <button
              onClick={() => {
                setShowTimePrompt(false);
                setPendingEvent(null);
                setQuickEntry(pendingEvent.title);
              }}
              className="flex-1 px-6 py-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-200 dark:hover:bg-red-800 transition-all"
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
    <>
    <style>{shakeStyle}</style>
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-2 sm:p-3 pb-24" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))', paddingLeft: 'max(0.5rem, env(safe-area-inset-left))', paddingRight: 'max(0.5rem, env(safe-area-inset-right))', paddingBottom: 'max(4.75rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-3 sm:p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1.5 bg-gradient-to-br from-rose-400 via-purple-400 to-indigo-400 rounded-xl shrink-0">
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
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
                    className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent px-2 py-1 border-2 border-purple-300 rounded-lg w-full"
                    autoFocus
                  />
                ) : (
                  <h1
                    onClick={() => setIsEditingTitle(true)}
                    className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer hover:opacity-70 transition-opacity truncate"
                    title="Click to rename calendar"
                  >
                    {calendarTitle}
                  </h1>
                )}
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
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
                onClick={() => setShowListPanel(!showListPanel)}
                className={`px-3 py-2 rounded-xl transition-all duration-200 text-xs font-semibold ${showListPanel ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                title="Shared list"
              >
                List
              </button>
              <button
                onClick={() => setShowWeather(!showWeather)}
                className={`p-2 rounded-xl transition-all duration-200 text-sm ${showWeather ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700 opacity-40'}`}
                title={showWeather ? 'Hide weather' : 'Show weather'}
              >
                🌤️
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

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => calendarView === 'month' ? changeMonth(-1) : changeWeek(-1)}
              className="p-2 hover:bg-purple-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
            >
              <ChevronLeft className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </button>
            <div className="flex flex-col items-center gap-1">
              <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                {calendarView === 'month'
                  ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : (() => {
                      const days = getWeekDays(currentDate);
                      const start = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      const end = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      return `${start} – ${end}`;
                    })()
                }
              </h2>
              <div className="flex rounded-lg overflow-hidden border border-purple-200 dark:border-gray-600 text-xs font-medium">
                <button
                  onClick={() => setCalendarView('month')}
                  className={`px-2.5 py-0.5 transition-all ${calendarView === 'month' ? 'bg-purple-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-600'}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setCalendarView('week')}
                  className={`px-2.5 py-0.5 transition-all ${calendarView === 'week' ? 'bg-purple-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-600'}`}
                >
                  Week
                </button>
              </div>
            </div>
            <button
              onClick={() => calendarView === 'month' ? changeMonth(1) : changeWeek(1)}
              className="p-2 hover:bg-purple-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
            >
              <ChevronRight className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </button>
          </div>
        </div>

        {/* Notification Settings Panel */}
        {showNotificationSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">Notification Settings</h3>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Choose exactly when reminders are sent.</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">1 Week Before</span>
                  <button
                    onClick={() => toggleNotificationWindow('notification-window-week', notifyOneWeek, setNotifyOneWeek)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifyOneWeek ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifyOneWeek ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">1 Day Before</span>
                  <button
                    onClick={() => toggleNotificationWindow('notification-window-day', notifyOneDay, setNotifyOneDay)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifyOneDay ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifyOneDay ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">1 Hour Before</span>
                  <button
                    onClick={() => toggleNotificationWindow('notification-window-hour', notifyOneHour, setNotifyOneHour)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifyOneHour ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifyOneHour ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
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
                      await window.storage.set('notification-urgent-only', newState.toString(), false);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${onlyNotifyUrgent ? 'bg-red-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${onlyNotifyUrgent ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Only send notifications for events marked as urgent 🚨</p>
              </div>
            </div>
          </div>
        )}

        {showSharePanel && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400">
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

        {showListPanel && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-5 mb-6 border border-purple-100 dark:border-gray-700">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-purple-600 dark:text-purple-400">Shared Lists</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Clean space for groceries, reminders, and quick to-dos.</p>
              </div>
              <button onClick={() => setShowListPanel(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 border border-purple-100 dark:border-gray-600 mb-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newSharedListTitle}
                  onChange={(e) => setNewSharedListTitle(e.target.value)}
                  placeholder="Create new list title"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-1 focus:ring-purple-400"
                  onKeyPress={(e) => e.key === 'Enter' && createSharedList()}
                />
                <button
                  onClick={createSharedList}
                  className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  title="Create list"
                >
                  Create
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-3">
              {sharedListGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedSharedListId(group.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedSharedListId === group.id
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {group.title}
                </button>
              ))}
              <button
                onClick={() => deleteSharedList(selectedSharedListId)}
                disabled={!selectedSharedListId}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 disabled:opacity-50"
                title="Delete selected list"
              >
                Delete
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={newListItemText}
                onChange={(e) => setNewListItemText(e.target.value)}
                placeholder="Add an item..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-1 focus:ring-purple-400"
                onKeyPress={(e) => e.key === 'Enter' && addSharedListItem()}
                disabled={!selectedSharedListId}
              />
              <button
                onClick={addSharedListItem}
                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                title="Add item"
                disabled={!selectedSharedListId}
              >
                Add
              </button>
            </div>

            {listError && (
              <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-300">
                {listError}
              </div>
            )}

            <div className="space-y-1.5">
              {sharedListGroups.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">Create your first list to get started.</p>
              )}
              {sharedListItems.length === 0 && selectedSharedListId && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No items yet.</p>
              )}
              {sharedListItems.map(item => (
                <div key={item.id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                  <button
                    onClick={() => toggleSharedListItem(item)}
                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${item.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-500'}`}
                    title={item.done ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {item.done ? '?' : ''}
                  </button>
                  {editingListItemId === item.id ? (
                    <input
                      autoFocus
                      value={editingListText}
                      onChange={(e) => setEditingListText(e.target.value)}
                      onBlur={() => saveSharedListItemText(item)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') saveSharedListItemText(item);
                        if (e.key === 'Escape') { setEditingListItemId(null); setEditingListText(''); }
                      }}
                      className="flex-1 text-sm px-2 py-1 border border-purple-300 dark:border-purple-600 dark:bg-gray-800 dark:text-white rounded-md focus:ring-1 focus:ring-purple-400"
                    />
                  ) : (
                    <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {item.text}
                    </span>
                  )}
                  {editingListItemId !== item.id && (
                    <button
                      onClick={() => startEditingListItem(item)}
                      className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-lg"
                      title="Edit item"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-purple-500" />
                    </button>
                  )}
                  <button
                    onClick={() => removeSharedListItem(item.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              ))}
              </div>
            </div>
          )}

        {showCategoryEditor && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400">Manage Categories</h3>
              <button onClick={() => setShowCategoryEditor(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
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
                <div key={key} className={`p-3 rounded-xl border-2 ${cat.border} bg-white dark:bg-gray-700`}>
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

        {bottomNavTab === 'home' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-3 sm:p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-purple-600 dark:text-purple-400">Today At A Glance</h3>
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setSelectedDates([]);
                  setShowDateDetailModal(true);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-all"
              >
                Open Today
              </button>
            </div>
            {todayEvents.length === 0 ? (
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No events today.</div>
            ) : (
              <div className="space-y-1.5 max-h-24 sm:max-h-28 overflow-y-auto pr-1">
                {todayEvents.slice(0, 4).map(event => {
                  const category = categories[event.category || 'other'] || categories.other;
                  return (
                    <div key={`${event.id}-${event.date}`} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${category.color}`} />
                        <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-100 truncate">{event.title}</span>
                        {event.isUrgent && <span className="text-xs">🚨</span>}
                      </div>
                      <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 shrink-0">
                        {event.time ? formatTime(event.time) : 'All day'}
                      </span>
                    </div>
                  );
                })}
                {todayEvents.length > 4 && (
                  <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">+{todayEvents.length - 4} more today</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-3 sm:p-4 ${bottomNavTab !== 'home' ? 'hidden' : ''}`}>

            {/* Active sub-calendar banner */}
            {(() => {
              const today = getDateKey(new Date());
              const active = subCalendars
                .filter(sc => today >= sc.start_date && today <= sc.end_date)
                .sort((a, b) => {
                  const todayEvents = events[today] || [];
                  const aMatch = todayEvents.some(e => e.title.toLowerCase().includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(e.title.toLowerCase()));
                  const bMatch = todayEvents.some(e => e.title.toLowerCase().includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(e.title.toLowerCase()));
                  return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
                });
              if (active.length === 0) return null;
              return (
                <div className="mb-4 space-y-2">
                  {active.map(sc => (
                    <button
                      key={sc.id}
                      onClick={() => openSubCalendar(sc)}
                      className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-300 dark:border-green-700 hover:shadow-md transition-all text-left"
                    >
                      <span className="text-xl">🗓️</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-green-800 dark:text-green-300">{sc.name}</div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Happening now · {new Date(sc.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(sc.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium shrink-0">Open →</span>
                    </button>
                  ))}
                </div>
              );
            })()}

            {showTipBanner && (
              <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl border border-purple-200 dark:border-purple-700 relative">
                <button
                  onClick={() => setShowTipBanner(false)}
                  className="absolute top-2 right-2 text-purple-400 hover:text-purple-600 dark:text-purple-500 dark:hover:text-purple-300 leading-none"
                >✕</button>
                <p className="text-sm text-purple-700 dark:text-purple-300 text-center pr-4">
                  💡 <strong>Tip:</strong> Double-tap a start date, then tap an end date to create multi-day events like vacations!
                </p>
                <label className="flex items-center justify-center gap-1.5 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    onChange={e => {
                      if (e.target.checked) localStorage.setItem('hideTipBanner', 'true');
                      else localStorage.removeItem('hideTipBanner');
                    }}
                  />
                  <span className="text-xs text-purple-500 dark:text-purple-400">Don't show this again</span>
                </label>
              </div>
            )}

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-200 py-1">{day}</div>
              ))}
            </div>

            {calendarView === 'month' ? (
              /* ── MONTH VIEW ── */
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((date, index) => {
                  const dateKey = date ? getDateKey(date) : null;
                  const dateEvents = getEventsForDate(date);
                  const isSelected = date && isSameDay(date, selectedDate);
                  const isTodayDate = date && isToday(date);
                  const isInSelection = date && selectedDates.some(d => isSameDay(d, date));
                  const hasUrgentEvent = dateEvents.some(e => e.isUrgent);
                  const hasHoliday = dateEvents.some(e => e.isHoliday);
                  const weatherData = showWeather && dateKey ? weather[dateKey] : null;
                  const dateTs = date ? toDateOnlyTs(date) : null;

                  const multiDayEvents = dateEvents.filter(e => e.isMultiDay);
                  const uniqueMultiDayIds = [...new Set(multiDayEvents.map(e => e.multiDayId))];
                  const multiDayBars = uniqueMultiDayIds.map(multiDayId => {
                    const allDatesForEvent = Object.entries(events)
                      .filter(([_, evts]) => evts.some(e => e.multiDayId === multiDayId))
                      .map(([dk]) => { const [y,m,d] = dk.split('-').map(Number); return new Date(y,m-1,d); })
                      .sort((a, b) => a - b);
                    const isFirst = date && allDatesForEvent[0] && isSameDay(date, allDatesForEvent[0]);
                    const isLast = date && allDatesForEvent[allDatesForEvent.length-1] && isSameDay(date, allDatesForEvent[allDatesForEvent.length-1]);
                    const isMiddle = date && allDatesForEvent.some(d => isSameDay(d, date)) && !isFirst && !isLast;
                    const eventWithId = dateEvents.find(e => e.multiDayId === multiDayId);
                    const categoryColor = eventWithId ? categories[eventWithId.category || 'other']?.color : 'bg-purple-500';
                    return { isFirst, isLast, isMiddle, categoryColor };
                  });
                  const subTripsOnDate = dateTs === null
                    ? []
                    : subCalendars.filter(sc => {
                        const startTs = toDateOnlyTs(getSubCalStartRaw(sc));
                        const endTs = toDateOnlyTs(getSubCalEndRaw(sc));
                        return startTs !== null && endTs !== null && dateTs >= startTs && dateTs <= endTs;
                      });
                  const primarySubTrip = subTripsOnDate[0];

                  return (
                    <div key={index} className="relative pb-2">
                      <button
                        onClick={() => handleDateTap(date)}
                        disabled={!date}
                        className={`
                          w-full aspect-square rounded-lg p-1 transition-all duration-200 relative select-none
                          ${!date ? 'invisible' : 'bg-white dark:bg-gray-700'}
                          ${hasUrgentEvent && !isSelected && !isInSelection ? 'ring-2 ring-red-500 shadow-lg shadow-red-200' : ''}
                          ${isInSelection ? 'bg-gradient-to-br from-purple-400 to-indigo-400 text-white shadow-lg scale-105 ring-2 ring-purple-300' : ''}
                          ${isSelected && !isInSelection ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg scale-105' : ''}
                          ${!isInSelection && !isSelected && isTodayDate && !hasUrgentEvent ? 'bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-900/50 dark:to-purple-900/50 text-purple-900 dark:text-purple-200 ring-2 ring-purple-400' : ''}
                          ${!isInSelection && !isSelected && !isTodayDate && !hasUrgentEvent ? 'text-gray-700 dark:text-gray-100 hover:bg-purple-50 dark:hover:bg-gray-600' : ''}
                          ${hasUrgentEvent && !isSelected && !isInSelection ? 'bg-red-50 dark:bg-red-900/30' : ''}
                        `}
                        style={{ zIndex: 10 }}
                      >
                        <div className={`text-xs sm:text-sm font-medium ${hasUrgentEvent && !isSelected && !isInSelection ? 'text-red-700 dark:text-red-400' : ''}`}>
                          {date ? date.getDate() : ''}
                          {hasHoliday && !isSelected && !isInSelection && (
                            <span className="absolute top-0.5 right-0.5 text-xs">🇺🇸</span>
                          )}
                        </div>
                        {weatherData && !isSelected && !isInSelection && (
                          <div className="flex flex-col items-center leading-none mt-0.5">
                            <span style={{ fontSize: weatherData.icon.length > 2 ? '0.5rem' : '0.85rem' }} className={`${weatherData.icon.length > 2 ? `font-bold ${weatherData.color}` : ''}`}>
                              {weatherData.icon}
                            </span>
                            <span style={{ fontSize: '0.55rem' }} className="text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                              {weatherData.high}°/{weatherData.low}°
                            </span>
                          </div>
                        )}
                        {dateEvents.length > 0 && (
                          <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                            {hasHoliday && <div className={`w-1 h-1 rounded-full ${isSelected || isInSelection ? 'bg-white' : 'bg-red-400'}`} />}
                            {[...new Set(dateEvents.filter(e => !e.isMultiDay && !e.isHoliday).map(e => e.category || 'other'))].slice(0, 2).map((cat, i) => (
                              <div key={i} className={`w-1 h-1 rounded-full ${isSelected || isInSelection ? 'bg-white' : categories[cat]?.color || 'bg-gray-500'}`} />
                            ))}
                          </div>
                        )}
                      </button>
                      {date && primarySubTrip && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSubCalendar(primarySubTrip);
                          }}
                          className="absolute top-0.5 left-0.5 z-20 px-1 py-0.5 rounded bg-indigo-500/90 text-white text-[9px] sm:text-[10px] leading-none hover:bg-indigo-600"
                          title={`Open ${primarySubTrip.name}`}
                        >
                          {subTripsOnDate.length > 1 ? `Trips ${subTripsOnDate.length}` : 'Trip'}
                        </button>
                      )}
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
            ) : (
              /* ── WEEK VIEW ── */
              <div className="grid grid-cols-7 gap-1">
                {getWeekDays(currentDate).map((date, index) => {
                  const dateKey = getDateKey(date);
                  const dateEvents = getEventsForDate(date);
                  const isSelected = isSameDay(date, selectedDate);
                  const isTodayDate = isToday(date);
                  const hasUrgentEvent = dateEvents.some(e => e.isUrgent);
                  const hasHoliday = dateEvents.some(e => e.isHoliday);
                  const weatherData = showWeather ? weather[dateKey] : null;
                  const dateTs = toDateOnlyTs(date);
                  const subTripsOnDate = subCalendars.filter(sc => {
                    const startTs = toDateOnlyTs(getSubCalStartRaw(sc));
                    const endTs = toDateOnlyTs(getSubCalEndRaw(sc));
                    return startTs !== null && endTs !== null && dateTs >= startTs && dateTs <= endTs;
                  });
                  const primarySubTrip = subTripsOnDate[0];

                  return (
                    <div
                      key={index}
                      onClick={() => handleDateTap(date)}
                      className={`
                        min-h-24 rounded-lg p-1.5 cursor-pointer transition-all duration-200 flex flex-col gap-1
                        ${isSelected ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg ring-2 ring-purple-300' : ''}
                        ${!isSelected && isTodayDate ? 'bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-900/50 dark:to-purple-900/50 ring-2 ring-purple-400' : ''}
                        ${!isSelected && !isTodayDate ? 'bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-gray-600' : ''}
                        ${hasUrgentEvent && !isSelected ? 'ring-2 ring-red-500' : ''}
                      `}
                    >
                      {/* Date number */}
                      <div className={`text-xs font-bold mb-1 ${isSelected ? 'text-white' : isTodayDate ? 'text-purple-700 dark:text-purple-200' : 'text-gray-700 dark:text-gray-200'}`}>
                        {date.getDate()}
                        {hasHoliday && <span className="ml-1">🇺🇸</span>}
                      </div>
                      {primarySubTrip && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSubCalendar(primarySubTrip);
                          }}
                          className={`w-fit px-1.5 py-0.5 rounded text-[10px] leading-none mb-1 ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'}`}
                          title={`Open ${primarySubTrip.name}`}
                        >
                          {subTripsOnDate.length > 1 ? `Trips ${subTripsOnDate.length}` : 'Trip'}
                        </button>
                      )}

                      {/* Weather */}
                      {weatherData && !isSelected && (
                        <div className="flex items-center gap-0.5 mb-1">
                          <span style={{ fontSize: '0.7rem' }}>{weatherData.icon.length > 2 ? <span className={`text-xs font-bold ${weatherData.color}`}>{weatherData.icon}</span> : weatherData.icon}</span>
                          <span style={{ fontSize: '0.55rem' }} className="text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{weatherData.high}°/{weatherData.low}°</span>
                        </div>
                      )}

                      {/* Events */}
                      <div className="flex flex-col gap-1 overflow-hidden">
                        {dateEvents.slice(0, 4).map(event => {
                          const cat = categories[event.category || 'other'] || categories.other;
                          if (event.isHoliday) return (
                            <div key={event.id} className="text-xs px-1.5 py-1 rounded-md bg-red-500 text-white truncate font-medium shadow-sm">
                              🇺🇸 {event.title}
                            </div>
                          );
                          return (
                            <div
                              key={event.id}
                              className={`text-xs px-1.5 py-1 rounded-md truncate font-medium shadow-sm
                                ${isSelected ? 'bg-white/25 text-white' : `${cat.color} text-white`}
                                ${event.isUrgent ? 'ring-1 ring-red-300' : ''}
                              `}
                            >
                              {event.time && <span className="opacity-80 mr-1">{formatTime(event.time)}</span>}
                              {event.isPrivate && '🔒 '}
                              {event.title}
                            </div>
                          );
                        })}
                        {dateEvents.length > 4 && (
                          <div className={`text-xs font-medium ${isSelected ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                            +{dateEvents.length - 4} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {showDateDetailModal && (
          <div
            className="fixed inset-0 z-40 bg-black/50 p-4 flex items-center justify-center"
            onClick={() => setShowDateDetailModal(false)}
          >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Date Details</h3>
              <button
                onClick={() => setShowDateDetailModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                aria-label="Close date details"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              </button>
            </div>
            <div className="mb-4">
              {selectedDates.length > 1 ? (
                <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 rounded-xl border-2 border-purple-300 dark:border-purple-600">
                  <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-2">Multi-Day Selection</h3>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                      {selectedDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {selectedDates[selectedDates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">{selectedDates.length} days</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedDates([])} className="text-xs text-purple-700 dark:text-purple-300 hover:text-purple-900 underline font-medium">Clear selection</button>
                    <button
                      onClick={() => setShowSubCalendarModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-xs rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                    >
                      🗓️ Create Sub-Calendar
                    </button>
                  </div>
                </div>
              ) : (
                <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-2">
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
              <div className="w-full">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Repeats:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'once', label: '🗓️ One-time' },
                    { value: 'weekly', label: '🔁 Weekly' },
                    { value: 'monthly', label: '📅 Monthly' },
                    { value: 'annual', label: '🎉 Annual' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setRecurrence(opt.value);
                        setIsAnnual(opt.value === 'annual');
                      }}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        recurrence === opt.value
                          ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
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
                    <div key={event.id} className={`${category.lightBg} dark:bg-gray-700 rounded-xl p-3 border-2 ${event.isVirtualAnnual ? 'border-violet-300 border-dashed dark:border-violet-600' : category.border} transition-all duration-200 hover:shadow-md relative`}>
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
                            onBlur={(e) => handleUpdateEventField(event.date, event.id, { title: e.target.value })}
                            className="w-full px-2 py-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                            autoFocus
                          />
                          <input
                            type="text"
                            defaultValue={event.time || ''}
                            placeholder="e.g. 3:00 PM"
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (!val) { handleUpdateEventField(event.date, event.id, { time: null }); return; }
                              const match = val.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
                              if (match) {
                                let h = parseInt(match[1]);
                                const m = match[2] ? parseInt(match[2]) : 0;
                                const period = match[3]?.toLowerCase();
                                if (period === 'pm' && h < 12) h += 12;
                                if (period === 'am' && h === 12) h = 0;
                                handleUpdateEventField(event.date, event.id, { time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` });
                              }
                            }}
                            className="w-full px-2 py-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                          />
                          <PlacesAutocomplete
                            value={event.location || ''}
                            onSelect={(val) => {
                              if (val !== (event.location || null)) {
                                handleUpdateEventField(event.date, event.id, { location: val });
                              }
                            }}
                            placeholder="📍 Add location (optional)"
                            className="w-full px-2 py-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                          />
                          <select
                            defaultValue={event.category || 'other'}
                            onChange={(e) => handleUpdateEventField(event.date, event.id, { category: e.target.value })}
                            className="w-full px-2 py-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                          >
                            {Object.entries(categories).map(([key, cat]) => (
                              <option key={key} value={key}>{cat.label}</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateEventField(event.date, event.id, { isPrivate: !event.isPrivate })}
                              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                event.isPrivate
                                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md'
                                  : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              <Lock className="w-3 h-3" />
                              {event.isPrivate ? 'Private' : 'Shared'}
                            </button>
                            <button
                              onClick={() => handleUpdateEventField(event.date, event.id, { isUrgent: !event.isUrgent })}
                              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                event.isUrgent
                                  ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md'
                                  : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {event.isUrgent ? 'Urgent' : 'Normal'}
                            </button>
                          </div>
                          <label className="flex items-center gap-2 text-sm dark:text-gray-300">
                            <input
                              type="checkbox"
                              defaultChecked={event.isAnnual}
                              onChange={(e) => handleUpdateEventField(event.date, event.id, {
                                isAnnual: e.target.checked,
                                annualMonth: e.target.checked ? (new Date(event.date + 'T00:00:00').getMonth() + 1) : null,
                                annualDay: e.target.checked ? new Date(event.date + 'T00:00:00').getDate() : null
                              })}
                              className="rounded"
                            />
                            🔁 Annual (repeats every year)
                          </label>
                          <button
                            onClick={() => setEditingEvent(null)}
                            className="w-full px-3 py-2 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium"
                          >
                            Done
                          </button>
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
                              {(event.isAnnual || (event.recurrence && event.recurrence !== 'once')) && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500 text-white flex items-center gap-1">
                                  <Repeat className="w-3 h-3" />
                                  {event.recurrence === 'weekly' ? 'Weekly' : event.recurrence === 'monthly' ? 'Monthly' : 'Annual'}
                                </span>
                              )}
                              {event.time && (
                                <div className={`flex items-center gap-1 ${category.text} text-sm font-medium`}>
                                  <Clock className="w-3 h-3" />
                                  {formatTime(event.time)}
                                </div>
                              )}
                            </div>
                            <div className="font-medium mb-1 text-gray-900 dark:text-white">{event.title}</div>
                            {event.location && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 mb-1"
                                onClick={e => e.stopPropagation()}
                              >
                                📍 {event.location}
                              </a>
                            )}
                            {event.createdBy && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <User className="w-3 h-3" />
                                {event.createdBy}
                                {event.isShared && (
                                  <span className="ml-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs">shared</span>
                                )}
                              </div>
                            )}

                            {/* Reactions */}
                            <div className="flex flex-wrap items-center gap-1 mt-1.5">
                              {event.reactions && Object.entries(event.reactions).map(([emoji, users]) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReact(event, emoji)}
                                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all ${
                                    users.includes(currentUser)
                                      ? 'bg-purple-100 dark:bg-purple-900 ring-1 ring-purple-400'
                                      : 'bg-gray-100 dark:bg-gray-600'
                                  }`}
                                  title={users.join(', ')}
                                >
                                  <span>{emoji}</span>
                                  <span className="text-gray-600 dark:text-gray-300 font-medium">{users.length}</span>
                                </button>
                              ))}
                              <button
                                onClick={() => setShowReactionPicker(showReactionPicker === event.id ? null : event.id)}
                                className="reaction-picker text-gray-400 dark:text-gray-500 hover:text-purple-500 text-sm px-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                                title="Add reaction"
                              >
                                {showReactionPicker === event.id ? '✕' : '＋'}
                              </button>
                            </div>
                            {showReactionPicker === event.id && (
                              <div className="reaction-picker flex gap-1 mt-1 p-1.5 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 w-fit">
                                {REACTION_EMOJIS.map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReact(event, emoji)}
                                    className="text-lg hover:scale-125 transition-transform p-0.5"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            {!event.isVirtualAnnual && !event.isVirtualRecurrence && (
                              <button onClick={() => setEditingEvent(event.id)} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all">
                                <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const isRepeating = event.isVirtualAnnual || event.isVirtualRecurrence || (event.recurrence && event.recurrence !== 'once');
                                if (isRepeating) {
                                  const choice = window.confirm(
                                    `"${event.title}" is a recurring event.\n\nOK = Remove just this occurrence\nCancel = Delete ALL occurrences`
                                  );
                                  // OK = true = skip once, Cancel = false = delete all
                                  handleDeleteEvent(selectedDateKey, event.id, event.isVirtualAnnual, event.isVirtualRecurrence, choice);
                                } else {
                                  handleDeleteEvent(selectedDateKey, event.id, false, false, false);
                                }
                              }}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-all"
                              title="Delete event"
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

            {/* Sub-calendars list */}
            {subCalendars.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">🗓️ Sub-Calendars</h4>
                <div className="space-y-2">
                  {[...subCalendars].sort((a, b) => {
                    const today = getDateKey(new Date());
                    const aActive = today >= a.start_date && today <= a.end_date;
                    const bActive = today >= b.start_date && today <= b.end_date;
                    // Also check if name loosely matches any event today
                    const todayEvents = events[today] || [];
                    const aMatches = aActive && todayEvents.some(e => e.title.toLowerCase().includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(e.title.toLowerCase()));
                    const bMatches = bActive && todayEvents.some(e => e.title.toLowerCase().includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(e.title.toLowerCase()));
                    if (aMatches && !bMatches) return -1;
                    if (bMatches && !aMatches) return 1;
                    if (aActive && !bActive) return -1;
                    if (bActive && !aActive) return 1;
                    return 0;
                  }).map(sc => {
                    const today = getDateKey(new Date());
                    const isActive = today >= sc.start_date && today <= sc.end_date;
                    return (
                    <div key={sc.id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isActive ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700' : 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isActive && <span className="text-xs">🟢</span>}
                          <div className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{sc.name}</div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(sc.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(sc.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {isActive && <span className="ml-1 text-green-600 dark:text-green-400 font-medium">· happening now</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => openSubCalendar(sc)}
                          className={`px-2.5 py-1 text-white text-xs rounded-lg transition-all ${isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-purple-500 hover:bg-purple-600'}`}
                        >Open</button>
                        {sc.owner_id === user?.id && (
                          <button onClick={() => deleteSubCalendar(sc.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          </div>

          )}

          {bottomNavTab !== 'home' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6">

            {bottomNavTab === 'upcoming' && (
              <>
                <h3 className="text-lg sm:text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3">Upcoming Trips</h3>
                {upcomingTrips.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No upcoming trips yet.</div>
                ) : (
                  <div className="space-y-2">
                    {upcomingTrips.map(sc => (
                      <div key={sc.id} className="flex items-center justify-between p-3 rounded-xl border border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{sc.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTripDate(getSubCalStartRaw(sc))} - {formatTripDate(getSubCalEndRaw(sc), true)}
                          </div>
                        </div>
                        <button
                          onClick={() => openSubCalendar(sc)}
                          className="ml-3 px-3 py-1.5 text-xs rounded-lg bg-purple-500 hover:bg-purple-600 text-white"
                        >
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {bottomNavTab === 'archived' && (
              <>
                <h3 className="text-lg sm:text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3">Archived Trips</h3>
                {archivedTrips.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No archived trips yet.</div>
                ) : (
                  <div className="space-y-2">
                    {archivedTrips.map(sc => (
                      <div key={sc.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{sc.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTripDate(getSubCalStartRaw(sc))} - {formatTripDate(getSubCalEndRaw(sc), true)}
                          </div>
                        </div>
                        <button
                          onClick={() => openSubCalendar(sc)}
                          className="ml-3 px-3 py-1.5 text-xs rounded-lg bg-gray-600 hover:bg-gray-700 text-white"
                        >
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          )}
        </div>
      </div>
    </div>

    {/* ── Create Sub-Calendar Modal ── */}
    {!activeSubCalendar && (
      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur border border-gray-200 dark:border-gray-700 shadow-2xl">
            <button
              onClick={() => {
                setBottomNavTab('home');
                setShowDateDetailModal(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${bottomNavTab === 'home' ? 'bg-purple-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              Home
            </button>
            <button
              onClick={() => {
                setBottomNavTab('upcoming');
                setShowDateDetailModal(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${bottomNavTab === 'upcoming' ? 'bg-purple-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => {
                setBottomNavTab('archived');
                setShowDateDetailModal(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${bottomNavTab === 'archived' ? 'bg-purple-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              Archived
            </button>
          </div>
        </div>
      </div>
    )}

    {showSubCalendarModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">New Sub-Calendar</h3>
            <button onClick={() => setShowSubCalendarModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {selectedDates.length > 0 && `${selectedDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${selectedDates[selectedDates.length-1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${selectedDates.length} days)`}
          </div>
          <input
            type="text"
            value={newSubCalName}
            onChange={e => setNewSubCalName(e.target.value)}
            placeholder="e.g. SF Trip 🌁, Cabo 2026 🌊"
            className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl mb-4 focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
            autoFocus
            onKeyPress={e => e.key === 'Enter' && createSubCalendar()}
          />
          <button
            onClick={createSubCalendar}
            className="w-full py-2.5 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl font-medium"
          >Create Sub-Calendar</button>
        </div>
      </div>
    )}

    {/* ── Sub-Calendar Full View ── */}
    {activeSubCalendar && (
      <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-40 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 shadow-md" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
          <button onClick={() => setActiveSubCalendar(null)} className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium text-sm">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center">
            {editingSubCalTitle ? (
              <input
                autoFocus
                defaultValue={activeSubCalendar.name}
                onBlur={e => updateSubCalTitle(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && updateSubCalTitle(e.target.value)}
                className="font-bold text-gray-800 dark:text-white bg-transparent border-b-2 border-purple-400 text-center outline-none w-40"
              />
            ) : (
              <div
                className="font-bold text-gray-800 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setEditingSubCalTitle(true)}
              >{activeSubCalendar.name} ✏️</div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(activeSubCalendar.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(activeSubCalendar.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* Invite button */}
            <button
              onClick={() => {
                const email = window.prompt('Enter email to invite:');
                if (email) { inviteToSubCalendar(email); }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs rounded-xl font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Invite
            </button>
          </div>
        </div>

        {/* Weather location — collapsed pill or expanding input */}
        <div className="relative px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2" ref={weatherAutocompleteRef}>
          {subCalWeatherLocation && !subCalWeatherExpanded ? (
            // Collapsed pill
            <button
              onClick={() => setSubCalWeatherExpanded(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all"
            >
              🌤️ {subCalWeatherLocation}
              <span className="text-blue-400 text-xs">✏️</span>
            </button>
          ) : (
            // Expanded input with autocomplete
            <div className="flex-1 relative">
              <div className="flex items-center gap-2">
                <span className="text-sm shrink-0">🌤️</span>
                <input
                  autoFocus={subCalWeatherExpanded}
                  type="text"
                  value={subCalWeatherInput}
                  onChange={e => { setSubCalWeatherInput(e.target.value); searchWeatherLocations(e.target.value); }}
                  onKeyDown={e => { if (e.key === 'Escape') { setSubCalWeatherExpanded(false); setSubCalWeatherSuggestions([]); } }}
                  placeholder="Search city for weather…"
                  className="flex-1 text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                {subCalWeatherLoading && <span className="text-xs text-blue-400 animate-pulse shrink-0">Loading…</span>}
                {subCalWeatherLocation && (
                  <button onClick={() => { setSubCalWeatherExpanded(false); setSubCalWeatherInput(subCalWeatherLocation); setSubCalWeatherSuggestions([]); }} className="text-xs text-gray-400 hover:text-gray-600 shrink-0">✕</button>
                )}
              </div>
              {/* Suggestions dropdown */}
              {subCalWeatherSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 z-50 overflow-hidden">
                  {subCalWeatherSuggestions.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => fetchSubCalWeather(result)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <span className="font-medium text-gray-800 dark:text-white">{result.name}</span>
                      <span className="text-gray-400 ml-1">{[result.admin1, result.country].filter(Boolean).join(', ')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Show "add weather" prompt if no location yet */}
          {!subCalWeatherLocation && !subCalWeatherExpanded && (
            <button
              onClick={() => setSubCalWeatherExpanded(true)}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 flex items-center gap-1"
            >🌤️ Add trip weather</button>
          )}
        </div>

        {/* Day tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div
            className="flex gap-2 px-4 py-3 overflow-x-auto items-center"
            onMouseLeave={() => { if (shakingDates) { clearTimeout(shakingTimeoutRef.current); setShakingDates(false); } }}
          >
            {/* Add day before */}
            <button
              onClick={() => extendSubCalDates('before')}
              className="flex flex-col items-center justify-center w-10 h-14 rounded-xl shrink-0 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-all"
            >
              <span className="text-lg leading-none">+</span>
            </button>

            {getSubCalDates(activeSubCalendar).map((date, dateIdx, allDates) => {
              const dk = getDateKey(date);
              const isSelected = subCalSelectedDate && getDateKey(subCalSelectedDate) === dk;
              const hasEvents = (subCalendarEvents[dk] || []).length > 0;
              const isFirst = dateIdx === 0;
              const isLast = dateIdx === allDates.length - 1;
              const canRemove = allDates.length > 1 && (isFirst || isLast);
              return (
                <div
                  key={dk}
                  className={`relative shrink-0 ${shakingDates && canRemove ? 'shake-wiggle' : ''}`}
                  onMouseDown={() => {
                    shakingTimeoutRef.current = setTimeout(() => setShakingDates(true), 500);
                  }}
                  onMouseUp={() => clearTimeout(shakingTimeoutRef.current)}
                  onTouchStart={() => {
                    shakingTimeoutRef.current = setTimeout(() => setShakingDates(true), 500);
                  }}
                  onTouchEnd={() => clearTimeout(shakingTimeoutRef.current)}
                >
                  <button
                    onClick={() => { if (shakingDates) return; setSubCalSelectedDate(date); }}
                    className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all ${
                      isSelected && !shakingDates
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-xs font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="text-lg font-bold leading-none">{date.getDate()}</span>
                    {subCalWeather[dk] && (
                      <span className="text-xs mt-0.5">{subCalWeather[dk].icon}</span>
                    )}
                    {subCalWeather[dk] && (
                      <span className={`text-xs leading-none ${isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                        {subCalWeather[dk].high}°
                      </span>
                    )}
                    {hasEvents && !shakingDates && !subCalWeather[dk] && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-purple-500'}`} />}
                    {hasEvents && !shakingDates && subCalWeather[dk] && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-purple-500'}`} />}
                  </button>
                  {/* Minus badge — only on first/last when shaking */}
                  {shakingDates && canRemove && (
                    <button
                      onClick={e => { e.stopPropagation(); shrinkSubCalDate(isFirst ? 'before' : 'after'); if (allDates.length <= 2) setShakingDates(false); }}
                      className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md border-2 border-white dark:border-gray-800 leading-none"
                    >−</button>
                  )}
                </div>
              );
            })}

            {/* Add day after */}
            <button
              onClick={() => extendSubCalDates('after')}
              className="flex flex-col items-center justify-center w-10 h-14 rounded-xl shrink-0 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-all"
            >
              <span className="text-lg leading-none">+</span>
            </button>
          </div>
          {/* Tap hint when shaking */}
          {shakingDates && (
            <div className="flex items-center justify-between px-4 pb-2">
              <span className="text-xs text-red-400">Tap − to remove a day</span>
              <button onClick={() => setShakingDates(false)} className="text-xs text-gray-400 hover:text-gray-600 underline">Done</button>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSubCalTab('itinerary')}
            className={`flex-1 py-2.5 text-sm font-medium transition-all border-b-2 ${subCalTab === 'itinerary' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >🗓️ Itinerary</button>
          <button
            onClick={() => setSubCalTab('photos')}
            className={`flex-1 py-2.5 text-sm font-medium transition-all border-b-2 relative ${subCalTab === 'photos' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >
            📸 Photos
            {tripPhotos.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 text-xs rounded-full">{tripPhotos.length}</span>}
          </button>
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async e => {
            const files = Array.from(e.target.files || []);
            await handleTripPhotoFilesSelected(files, () => { e.target.value = ''; });
          }}
        />

        {/* Day content */}
        {subCalTab === 'itinerary' && subCalSelectedDate && (() => {
          const dk = getDateKey(subCalSelectedDate);
          const dayEvents = (subCalendarEvents[dk] || []).sort((a, b) => {
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
          });
          const dayEventPhotos = tripPhotos.filter(p => p.event_id && (p.date === dk || !p.date));
          const getEventPhotos = (eventId) => dayEventPhotos.filter(p => p.event_id === eventId);

          return (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

              {/* Weather for selected day */}
              {subCalWeather[dk] && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <span className="text-2xl">{subCalWeather[dk].icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-white">
                      {subCalSelectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {subCalWeatherLocation} · High {subCalWeather[dk].high}° / Low {subCalWeather[dk].low}°
                    </div>
                  </div>
                </div>
              )}

              {/* Notes / Reminders */}
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">📝 Reminders &amp; Notes</h4>
                <div className="space-y-1.5 mb-2">
                  {subCalNotes.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">No reminders yet</p>
                  )}
                  {subCalNotes.map((note, noteIdx) => (
                    <div
                      key={note.id}
                      draggable
                      onDragStart={() => setDraggedNoteId(note.id)}
                      onDragOver={e => { e.preventDefault(); }}
                      onDrop={() => {
                        if (!draggedNoteId || draggedNoteId === note.id) return;
                        const from = subCalNotes.findIndex(n => n.id === draggedNoteId);
                        const to = noteIdx;
                        const newNotes = [...subCalNotes];
                        const [moved] = newNotes.splice(from, 1);
                        newNotes.splice(to, 0, moved);
                        setSubCalNotes(newNotes);
                        setDraggedNoteId(null);
                        // Persist order via timestamps
                        newNotes.forEach((n, i) => {
                          supabase.from('sub_calendar_notes').update({ created_at: new Date(Date.now() - (newNotes.length - i) * 1000).toISOString() }).eq('id', n.id);
                        });
                      }}
                      onDragEnd={() => setDraggedNoteId(null)}
                      className={`bg-white dark:bg-gray-700 rounded-lg border border-yellow-200 dark:border-yellow-700 overflow-hidden transition-opacity ${draggedNoteId === note.id ? 'opacity-40' : 'opacity-100'}`}
                    >
                      <div className="flex items-center gap-2 px-2.5 py-2">
                        {/* Drag handle */}
                        <span className="text-gray-300 dark:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 select-none text-sm">⠿</span>
                        <button onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)} className="text-xs text-gray-400 shrink-0 w-3">
                          {expandedNote === note.id ? '◂' : '▸'}
                        </button>
                        <span className="text-xs">📌</span>
                        {editingNote === note.id ? (
                          <input
                            autoFocus
                            defaultValue={note.text}
                            onBlur={e => updateNoteText(note.id, e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && updateNoteText(note.id, e.target.value)}
                            className="flex-1 text-xs px-1.5 py-0.5 border border-purple-300 rounded dark:bg-gray-600 dark:text-white"
                          />
                        ) : (
                          <span
                            className="flex-1 text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:text-purple-600"
                            onClick={() => setEditingNote(note.id)}
                          >{note.text}</span>
                        )}
                        {(note.checklist || []).length > 0 && (
                          <span className="text-xs text-gray-400">
                            {(note.checklist || []).filter(i => i.done).length}/{(note.checklist || []).length}
                          </span>
                        )}
                        <button onClick={() => deleteSubCalNote(note.id)} className="text-gray-300 hover:text-red-400 text-xs shrink-0">✕</button>
                      </div>
                      {expandedNote === note.id && (
                        <div className="px-3 pb-2.5 space-y-1.5 border-t border-yellow-100 dark:border-yellow-800 pt-2">
                          {(note.checklist || []).map(item => (
                            <div key={item.id} className="flex items-center gap-2">
                              <button
                                onClick={() => toggleChecklistItem(note.id, item.id)}
                                className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all ${item.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-500'}`}
                              >
                                {item.done && <span className="text-xs leading-none">✓</span>}
                              </button>
                              <span className={`text-xs flex-1 ${item.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{item.text}</span>
                              <button onClick={() => deleteChecklistItem(note.id, item.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                            </div>
                          ))}
                          <div className="flex gap-1.5 mt-1">
                            <input
                              type="text"
                              value={newChecklistItem}
                              onChange={e => setNewChecklistItem(e.target.value)}
                              onKeyPress={e => { if (e.key === 'Enter') { addChecklistItem(note.id, newChecklistItem); } }}
                              placeholder="Add item..."
                              className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg"
                            />
                            <button onClick={() => addChecklistItem(note.id, newChecklistItem)} className="px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg text-xs">+</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addSubCalNote()}
                    placeholder="Add a note..."
                    className="flex-1 px-2.5 py-1.5 text-xs border border-yellow-300 dark:border-yellow-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-1 focus:ring-yellow-400"
                  />
                  <button onClick={addSubCalNote} className="px-2.5 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg text-xs font-medium">Add</button>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                {TIMELINE_HOURS.map(hour => {
                  const timeStr = `${String(hour).padStart(2,'0')}:00`;
                  const nextHour = (hour + 1) % 24;
                  const nextStr = `${String(nextHour).padStart(2,'0')}:00`;
                  // For overnight hours (0-5), events with time < "06:00" belong here
                  const slotEvents = dayEvents.filter(e => {
                    if (!e.time) return false;
                    if (hour < 6) {
                      // overnight slot: time must be >= timeStr AND < nextStr (both < 06:00)
                      return e.time >= timeStr && e.time < nextStr;
                    }
                    return e.time >= timeStr && e.time < nextStr;
                  });
                  const label = hour === 0 ? '12am' : hour === 12 ? '12pm' : hour > 12 ? `${hour-12}pm` : `${hour}am`;
                  return (
                    <div key={hour} className="flex gap-3 min-h-[52px] group">
                      <div className="w-12 shrink-0 text-right">
                        <span className="text-xs text-gray-400 dark:text-gray-500 leading-[52px]">{label}</span>
                      </div>
                      <div
                        className="flex-1 border-t border-gray-200 dark:border-gray-700 pt-1 pb-1 relative"
                        onClick={() => {
                          if (subCalAddingSlot === hour || slotEvents.length > 0 || subCalEditingEvent) return;
                          setSubCalAddingSlot(hour);
                          setSubCalNewEventForm({ title: '', endTime: '', location: '' });
                        }}
                      >
                        {slotEvents.map(event => (
                          <div key={event.id}>
                            {subCalEditingEvent === event.id ? (
                              <div className="bg-white dark:bg-gray-700 rounded-xl p-3 border-2 border-purple-300 shadow space-y-2 mb-1">
                                <input
                                  type="text"
                                  defaultValue={event.title}
                                  onBlur={e => updateSubCalEvent(event.id, { title: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-sm"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    defaultValue={event.time || ''}
                                    placeholder="Start 9:00 AM"
                                    onBlur={e => {
                                      const val = e.target.value.trim();
                                      if (!val) return;
                                      const match = val.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
                                      if (match) {
                                        let h = parseInt(match[1]);
                                        const m = match[2] ? parseInt(match[2]) : 0;
                                        const p = match[3]?.toLowerCase();
                                        if (p === 'pm' && h < 12) h += 12;
                                        if (p === 'am' && h === 12) h = 0;
                                        updateSubCalEvent(event.id, { time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` });
                                      }
                                    }}
                                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-xs"
                                  />
                                  <input
                                    type="text"
                                    defaultValue={event.endTime || ''}
                                    placeholder="End 10:00 AM"
                                    onBlur={e => {
                                      const val = e.target.value.trim();
                                      if (!val) return;
                                      const match = val.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
                                      if (match) {
                                        let h = parseInt(match[1]);
                                        const m = match[2] ? parseInt(match[2]) : 0;
                                        const p = match[3]?.toLowerCase();
                                        if (p === 'pm' && h < 12) h += 12;
                                        if (p === 'am' && h === 12) h = 0;
                                        updateSubCalEvent(event.id, { endTime: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` });
                                      }
                                    }}
                                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-xs"
                                  />
                                </div>
                                <textarea
                                  defaultValue={event.notes || ''}
                                  onBlur={e => updateSubCalEvent(event.id, { notes: e.target.value })}
                                  placeholder="Notes..."
                                  rows={2}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-sm resize-none"
                                />
                                <PlacesAutocomplete
                                  value={event.location || ''}
                                  onSelect={(val) => updateSubCalEvent(event.id, { location: val })}
                                  placeholder="📍 Add location (optional)"
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-sm"
                                />
                                <button onClick={() => setSubCalEditingEvent(null)} className="w-full py-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-lg text-sm font-medium">Done</button>
                              </div>
                           ) : (
                              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl px-2.5 py-2 mb-1 border border-purple-200 dark:border-purple-700">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{event.title}</div>
                                  {(event.time || event.endTime) && (
                                    <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {event.time && formatTime(event.time)}{event.endTime && ` – ${formatTime(event.endTime)}`}
                                    </div>
                                  )}
                                  {event.notes && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">{event.notes}</div>}
                                  {event.location && (
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 mt-0.5"
                                      onClick={e => e.stopPropagation()}
                                    >📍 {event.location}</a>
                                  )}
                                  {getEventPhotos(event.id).length > 0 && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setLightboxPhoto(getEventPhotos(event.id)[0]); }}
                                      className="mt-1 relative"
                                      title="View event photo"
                                    >
                                      <img
                                        src={getEventPhotos(event.id)[0].url}
                                        alt=""
                                        className="w-12 h-12 rounded-lg object-cover border border-purple-200 dark:border-purple-700"
                                      />
                                      {getEventPhotos(event.id).length > 1 && (
                                        <span className="absolute -top-1 -right-1 text-[10px] px-1 py-0.5 rounded-full bg-purple-600 text-white">
                                          +{getEventPhotos(event.id).length - 1}
                                        </span>
                                      )}
                                    </button>
                                  )}
                                  {event.createdBy && <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5"><User className="w-2.5 h-2.5" />{event.createdBy}</div>}
                                  {/* Reactions */}
                                  <div className="flex flex-wrap items-center gap-1 mt-1">
                                    {Object.entries(event.reactions || {}).map(([emoji, users]) => (
                                      <button key={emoji} onClick={() => handleSubCalReact(event, emoji)}
                                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs ${users.includes(currentUser) ? 'bg-purple-100 dark:bg-purple-900 ring-1 ring-purple-400' : 'bg-gray-100 dark:bg-gray-600'}`}
                                        title={users.join(', ')}
                                      ><span>{emoji}</span><span className="text-gray-600 dark:text-gray-300">{users.length}</span></button>
                                    ))}
                                    <button onClick={() => setSubCalShowReactionPicker(subCalShowReactionPicker === event.id ? null : event.id)}
                                      className="reaction-picker text-gray-400 hover:text-purple-500 text-xs">＋</button>
                                    {subCalShowReactionPicker === event.id && (
                                      <div className="reaction-picker flex gap-1 p-1.5 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600">
                                        {REACTION_EMOJIS.map(emoji => (
                                          <button key={emoji} onClick={() => handleSubCalReact(event, emoji)} className="text-base hover:scale-125 transition-transform p-0.5">{emoji}</button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    onClick={() => { setPhotoEventId(event.id); setPhotoDate(dk); photoInputRef.current?.click(); }}
                                    className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-lg"
                                    title="Add photo"
                                  >📷</button>
                                  <button onClick={() => setSubCalEditingEvent(event.id)} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-gray-500" /></button>
                                  <button onClick={() => deleteSubCalEvent(event.id, dk)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    
                        {/* Click slot to add event */}
                        {subCalAddingSlot === hour ? (
                          <div className="mt-1 p-3 bg-white dark:bg-gray-700 rounded-xl border-2 border-purple-300 dark:border-purple-600 shadow-lg space-y-2">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Event title *"
                              value={subCalNewEventForm.title}
                              onChange={e => setSubCalNewEventForm(f => ({ ...f, title: e.target.value }))}
                              className="w-full text-sm px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                            />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                readOnly
                                value={`${hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`}
                                className="w-24 text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-300 rounded-lg bg-gray-50"
                              />
                              <input
                                type="text"
                                placeholder="End time (optional)"
                                value={subCalNewEventForm.endTime}
                                onChange={e => setSubCalNewEventForm(f => ({ ...f, endTime: e.target.value }))}
                                className="flex-1 text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                              />
                            </div>
                            <PlacesAutocomplete
                              value={subCalNewEventForm.location}
                              onSelect={val => setSubCalNewEventForm(f => ({ ...f, location: val || '' }))}
                              placeholder="📍 Add location (optional)"
                              className="w-full text-xs px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!subCalNewEventForm.title.trim()) return;
                                  const timeStr = `${String(hour).padStart(2,'0')}:00`;
                                  let endTimeStr = null;
                                  if (subCalNewEventForm.endTime.trim()) {
                                    const match = subCalNewEventForm.endTime.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
                                    if (match) {
                                      let h = parseInt(match[1]);
                                      const m = match[2] ? parseInt(match[2]) : 0;
                                      const p = match[3]?.toLowerCase();
                                      if (p === 'pm' && h < 12) h += 12;
                                      if (p === 'am' && h === 12) h = 0;
                                      endTimeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
                                    }
                                  }
                                  await addSubCalEvent(subCalSelectedDate, subCalNewEventForm.title, timeStr, endTimeStr, subCalNewEventForm.location || null);
                                  setSubCalAddingSlot(null);
                                  setSubCalNewEventForm({ title: '', endTime: '', location: '' });
                                }}
                                className="flex-1 py-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-lg text-xs font-medium"
                              >Add Event</button>
                              <button
                                onClick={() => { setSubCalAddingSlot(null); setSubCalNewEventForm({ title: '', endTime: '', location: '' }); }}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-xs"
                              >Cancel</button>
                            </div>
                          </div>
                        ) : (
                          slotEvents.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-xs text-purple-300 dark:text-purple-700 group-hover:text-purple-400 dark:group-hover:text-purple-500 transition-colors">＋</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Unscheduled events */}
                {dayEvents.filter(e => !e.time).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Unscheduled</h4>
                    {dayEvents.filter(e => !e.time).map(event => (
                      <div key={event.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-xl px-2.5 py-2 mb-1">
                        {getEventPhotos(event.id).length > 0 && (
                          <button
                            onClick={() => setLightboxPhoto(getEventPhotos(event.id)[0])}
                            className="shrink-0"
                            title="View event photo"
                          >
                            <img
                              src={getEventPhotos(event.id)[0].url}
                              alt=""
                              className="w-9 h-9 rounded-md object-cover border border-gray-200 dark:border-gray-600"
                            />
                          </button>
                        )}
                        <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{event.title}</span>
                        {event.notes && <span className="text-xs text-gray-400 italic truncate max-w-[120px]">{event.notes}</span>}
                        <button onClick={() => setSubCalEditingEvent(event.id)} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-gray-500" /></button>
                        <button onClick={() => deleteSubCalEvent(event.id, dk)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Members */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Members ({subCalMembers.length + 1})</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs flex items-center gap-1">
                    👑 {currentUser} (you)
                  </span>
                  {subCalMembers.map(m => (
                    <span key={m.email} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs flex items-center gap-1">
                      {m.email}
                      {activeSubCalendar.owner_id === user?.id && (
                        <button onClick={() => removeMemberFromSubCal(m.email)} className="ml-0.5 text-gray-400 hover:text-red-500">×</button>
                      )}
                    </span>
                  ))}
                  {activeSubCalendar.owner_id === user?.id && (
                    <button
                      onClick={() => {
                        const email = window.prompt('Invite by email:');
                        if (email) { inviteToSubCalendar(email); }
                      }}
                      className="px-2 py-1 border border-dashed border-purple-300 dark:border-purple-600 text-purple-500 rounded-full text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >+ Invite</button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Photos tab */}
        {subCalTab === 'photos' && (
          <div className="flex-1 overflow-y-auto">

            {/* Upload bar */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium shadow hover:shadow-lg transition-all disabled:opacity-50"
              >
                {uploadingPhoto ? '⏳ Uploading…' : '📷 Add Photos'}
              </button>
              <input
                type="text"
                value={photoCaption}
                onChange={e => setPhotoCaption(e.target.value)}
                placeholder="Caption (optional)…"
                className="flex-1 text-sm px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              {photoUploadMessage && (
                <span className={`text-xs ${photoUploadError ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {photoUploadMessage}
                </span>
              )}
                <button
                  onClick={() => setPhotoView('grid')}
                  className={`p-1.5 rounded-lg transition-all ${photoView === 'grid' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Grid view"
                >⊞</button>
                <button
                  onClick={() => setPhotoView('timeline')}
                  className={`p-1.5 rounded-lg transition-all ${photoView === 'timeline' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Timeline view"
                >☰</button>
            </div>

            {tripPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                <div className="text-6xl mb-4">📸</div>
                <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">No photos yet</div>
                <div className="text-sm text-gray-400 dark:text-gray-500">Tap "Add Photos" to share memories from this trip</div>
              </div>
            ) : photoView === 'grid' ? (
              /* ── GRID VIEW ── */
              <div className="p-4">
                {/* Group by date */}
                {(() => {
                  const byDate = {};
                  tripPhotos.forEach(p => {
                    const d = p.date || 'unlinked';
                    if (!byDate[d]) byDate[d] = [];
                    byDate[d].push(p);
                  });
                  return Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b)).map(([date, photos]) => (
                    <div key={date} className="mb-6">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                        <span>{date !== 'unlinked' ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unlinked'}</span>
                        {subCalWeather[date] && <span>{subCalWeather[date].icon} {subCalWeather[date].high}°</span>}
                        <span className="text-gray-300 dark:text-gray-600">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {photos.map(photo => (
                          <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer" onClick={() => setLightboxPhoto(photo)}>
                            <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                            {photo.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs truncate">{photo.caption}</p>
                              </div>
                            )}
                            {photo.uploaded_by === currentUser && (
                              <button
                                onClick={e => { e.stopPropagation(); deleteTripPhoto(photo); }}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow"
                              >✕</button>
                            )}
                            <div className="absolute bottom-1 left-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="bg-black/50 text-white px-1.5 py-0.5 rounded-full text-xs">{photo.uploaded_by}</span>
                            </div>
                          </div>
                        ))}
                        {/* Add more photos to this day */}
                        <button
                          onClick={() => { setPhotoDate(date !== 'unlinked' ? date : null); photoInputRef.current?.click(); }}
                          className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-all flex items-center justify-center text-2xl"
                        >+</button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              /* ── TIMELINE VIEW ── */
              <div className="p-4 space-y-8">
                {(() => {
                  const byDate = {};
                  tripPhotos.forEach(p => {
                    const d = p.date || 'unlinked';
                    if (!byDate[d]) byDate[d] = [];
                    byDate[d].push(p);
                  });
                  return Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b)).map(([date, photos]) => (
                    <div key={date} className="relative pl-6 border-l-2 border-purple-200 dark:border-purple-800">
                      {/* Date marker */}
                      <div className="absolute -left-3 top-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{date !== 'unlinked' ? new Date(date + 'T00:00:00').getDate() : '?'}</span>
                      </div>
                      <div className="mb-3">
                        <div className="font-semibold text-gray-800 dark:text-white text-sm">
                          {date !== 'unlinked' ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Unlinked Photos'}
                        </div>
                        {subCalWeather[date] && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            {subCalWeather[date].icon} {subCalWeather[date].high}° / {subCalWeather[date].low}°
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {photos.map(photo => (
                          <div key={photo.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                            <img
                              src={photo.url}
                              alt={photo.caption || ''}
                              className="w-full max-h-72 object-cover cursor-pointer"
                              onClick={() => setLightboxPhoto(photo)}
                            />
                            <div className="px-3 py-2 flex items-start justify-between gap-2">
                              <div>
                                {photo.caption && <p className="text-sm text-gray-800 dark:text-gray-200 mb-0.5">{photo.caption}</p>}
                                <p className="text-xs text-gray-400 dark:text-gray-500">📷 {photo.uploaded_by}</p>
                              </div>
                              {photo.uploaded_by === currentUser && (
                                <button onClick={() => deleteTripPhoto(photo)} className="text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
                              )}
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => { setPhotoDate(date !== 'unlinked' ? date : null); photoInputRef.current?.click(); }}
                          className="flex items-center gap-2 text-xs text-purple-500 hover:text-purple-700 font-medium"
                        >+ Add photo to this day</button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}

        {/* Lightbox */}
        {lightboxPhoto && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
            onClick={() => setLightboxPhoto(null)}
          >
            <button className="absolute top-4 right-4 text-white text-2xl z-10">✕</button>
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption || ''}
              className="max-w-full max-h-[80vh] rounded-xl object-contain"
              onClick={e => e.stopPropagation()}
            />
            <div className="mt-3 text-center" onClick={e => e.stopPropagation()}>
              {lightboxPhoto.caption && <p className="text-white text-sm mb-1">{lightboxPhoto.caption}</p>}
              <p className="text-gray-400 text-xs">📷 {lightboxPhoto.uploaded_by} · {lightboxPhoto.date ? new Date(lightboxPhoto.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>
            </div>
          </div>
        )}

      </div>
    )}
    </>
  );
}

function PlacesAutocomplete({ value, onSelect, placeholder, className }) {
  const [input, setInput] = React.useState(value || '');
  const [suggestions, setSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const serviceRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const debounceRef = React.useRef(null);

  React.useEffect(() => { setInput(value || ''); }, [value]);

  // Close on outside click
  React.useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, []);

  const getService = () => {
    if (serviceRef.current) return serviceRef.current;
    if (!window.google?.maps?.places) return null;
    serviceRef.current = new window.google.maps.places.AutocompleteService();
    return serviceRef.current;
  };

  const search = (query) => {
    clearTimeout(debounceRef.current);
    if (!query || query.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(() => {
      const svc = getService();
      if (!svc) { console.warn('Google Places not ready yet'); return; }
      svc.getPlacePredictions({ input: query }, (predictions, status) => {
        if (predictions && status === 'OK') {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      });
    }, 200);
  };

  const handleSelect = (prediction) => {
    const val = prediction.description;
    setInput(val);
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect(val);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={input}
        onChange={e => { setInput(e.target.value); search(e.target.value); }}
        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
        onBlur={() => {
          setTimeout(() => {
            setShowSuggestions(false);
            // Save typed value even if no suggestion picked
            const val = input.trim() || null;
            if (val !== (value || null)) onSelect(val);
          }, 200);
        }}
        placeholder={placeholder || '📍 Add location (optional)'}
        className={className}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden" style={{zIndex: 9999}}>
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/30 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <span className="text-gray-400 mr-1">📍</span>
              <span className="font-medium text-gray-800 dark:text-white">{s.structured_formatting?.main_text}</span>
              {s.structured_formatting?.secondary_text && (
                <span className="text-gray-400 ml-1">{s.structured_formatting.secondary_text}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const shakeStyle = `
@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-4deg); }
  40% { transform: rotate(4deg); }
  60% { transform: rotate(-3deg); }
  80% { transform: rotate(3deg); }
}
.shake-wiggle {
  animation: wiggle 0.5s ease-in-out infinite;
  transform-origin: center;
}
`;

export default App;
