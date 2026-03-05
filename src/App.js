import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Plus, X, ChevronLeft, ChevronRight, Edit2, Trash2, Tag, Settings, Lock, User, Bell, BellOff, AlertTriangle, Repeat, Moon, Sun, Camera } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
'https://qyifsblebdnlcyurrgbt.supabase.co',
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aWZzYmxlYmRubGN5dXJyZ2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTA1NTcsImV4cCI6MjA4NzAyNjU1N30.S_DUVQCwkBWrbSWoujQipb_5jz1d5UCsU_gSwWAGzTk'
);

// Supabase storage wrapper
const storage = {
  get: async (key, shared = false) => {
    if (
      key === 'calendar-user' ||
      key === 'calendar-title' ||
      key.includes('notification') ||
      key.startsWith('notify-')
    ) {
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
  const [isScanningReminder, setIsScanningReminder] = useState(false);
  const [showScanHelpModal, setShowScanHelpModal] = useState(false);
  const [suggestedTime, setSuggestedTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [smartLeavePrompt, setSmartLeavePrompt] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_OPTIONS[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showPrivateEvents] = useState(false);

  const saveTimeoutRef = useRef(null);
  const saveRequestIdRef = useRef(0);
  const dateTapTimeoutRef = useRef(null);
  const scanReminderInputRef = useRef(null);
  const scanReminderUploadInputRef = useRef(null);
  const smartLeaveGeoCacheRef = useRef(new Map());
  const smartLeaveTravelCacheRef = useRef(new Map());
  const smartLeavePositionRef = useRef({ at: 0, lat: null, lng: null });
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
  const [notifyAtEventTime, setNotifyAtEventTime] = useState(true);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState([]);
  const [pendingTripInvites, setPendingTripInvites] = useState([]);
  const seenInAppNotificationKeysRef = useRef(new Set());
  const inAppSyncCursorRef = useRef({ events: null, subCalEvents: null, tripPhotos: null, sharedListItems: null, tripInvites: null });
  const seenExpenseIdsRef = useRef(new Set());
  const [showTimePrompt, setShowTimePrompt] = useState(false);
  const [pendingEvent, setPendingEvent] = useState(null);
  const [layerRefreshToken, setLayerRefreshToken] = useState(0);
  const [calendarTitle, setCalendarTitle] = useState('Our Calendar');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(true);
  const [authError, setAuthError] = useState('');
  const [firstTapDate, setFirstTapDate] = useState(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [recurrence, setRecurrence] = useState('once');
  const [calendarView, setCalendarView] = useState('month');
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showDateDetailModal, setShowDateDetailModal] = useState(false);
  const [bottomNavTab, setBottomNavTab] = useState('home');
  const [swipedTripId, setSwipedTripId] = useState(null);
  const [tripSwipeDrag, setTripSwipeDrag] = useState({ id: null, offset: 0 });
  const tripSwipeStartXRef = useRef(0);
  const swipingTripIdRef = useRef(null);
  const [swipedLayerId, setSwipedLayerId] = useState(null);
  const [layerSwipeDrag, setLayerSwipeDrag] = useState({ id: null, offset: 0 });
  const layerSwipeStartXRef = useRef(0);
  const swipingLayerIdRef = useRef(null);

  // Sub-calendar state
  const [subCalendars, setSubCalendars] = useState([]);
  const [activeSubCalendar, setActiveSubCalendar] = useState(null);
  const [subCalNotes, setSubCalNotes] = useState([]); // [{id, text, checklist, createdBy, createdAt}]
  const [subCalExpenses, setSubCalExpenses] = useState([]); // [{id, payer, description, amount, createdAt}]
  const [expenseLedgerNoteId, setExpenseLedgerNoteId] = useState(null);
  const [venmoHandles, setVenmoHandles] = useState({});
  const [venmoHandlesNoteId, setVenmoHandlesNoteId] = useState(null);
  const [globalVenmoHandles, setGlobalVenmoHandles] = useState({});
  const [cashAppHandles, setCashAppHandles] = useState({});
  const [cashAppHandlesNoteId, setCashAppHandlesNoteId] = useState(null);
  const [globalCashAppHandles, setGlobalCashAppHandles] = useState({});
  const [paymentOptionPickerIdentity, setPaymentOptionPickerIdentity] = useState(null);
  const [newExpenseDraft, setNewExpenseDraft] = useState({ payer: '', description: '', amount: '' });
  const [expensePanels, setExpensePanels] = useState({
    splitter: true,
    summary: true,
    handles: true,
    settlements: true,
  });
  const [expenseError, setExpenseError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [expandedNote, setExpandedNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [editingSubCalTitle, setEditingSubCalTitle] = useState(false);
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
  const [subCalTab, setSubCalTab] = useState('itinerary'); // 'itinerary' | 'expenses' | 'photos'
  const [shareMyLocation, setShareMyLocation] = useState(() => localStorage.getItem('subcal-share-location') === 'true');
  const [memberLocations, setMemberLocations] = useState({});
  const subCalLocationChannelRef = useRef(null);
  const subCalGeoWatchRef = useRef(null);
  const [tripPhotos, setTripPhotos] = useState([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState([]);
  const [deletedPhotosNoteId, setDeletedPhotosNoteId] = useState(null);
  const [photoView, setPhotoView] = useState('grid'); // 'grid' | 'timeline'
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadMessage, setPhotoUploadMessage] = useState('');
  const [photoUploadError, setPhotoUploadError] = useState(false);
  const [photoDeleteMode, setPhotoDeleteMode] = useState(false);
  const [isPhotoSelectionMode, setIsPhotoSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [photoEventId, setPhotoEventId] = useState(null);
  const [photoDate, setPhotoDate] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [locationActionTarget, setLocationActionTarget] = useState('');
  const photoInputRef = useRef(null);
  const photoDeleteHoldTimerRef = useRef(null);
  const photoTapRef = useRef({ id: null, at: 0, timer: null });
  const photoHoldSuppressRef = useRef({ id: null, until: 0 });

  const REACTION_EMOJIS = ['❤️', '😂', '😮', '👍', '🎉', '😢', '💰', '😘', '💯'];
  const EXPENSE_LEDGER_NOTE_TEXT = '__EXPENSE_LEDGER_V1__';
  const VENMO_HANDLES_NOTE_TEXT = '__VENMO_HANDLES_V1__';
  const CASHAPP_HANDLES_NOTE_TEXT = '__CASHAPP_HANDLES_V1__';
  const DELETED_PHOTOS_NOTE_TEXT = '__DELETED_PHOTOS_V1__';
  const AUTO_MERGE_SHARED_LAYERS = false;
  const getDeletedPhotosLocalKey = (subCalId) => `subcal-deleted-photos-${subCalId}`;
  const readLocalDeletedPhotoIds = (subCalId) => {
    try {
      const raw = localStorage.getItem(getDeletedPhotosLocalKey(subCalId));
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return Array.from(new Set(parsed.map(id => String(id)).filter(Boolean)));
    } catch {
      return [];
    }
  };
  const writeLocalDeletedPhotoIds = (subCalId, ids) => {
    try {
      const normalized = Array.from(new Set((ids || []).map(id => String(id)).filter(Boolean)));
      localStorage.setItem(getDeletedPhotosLocalKey(subCalId), JSON.stringify(normalized));
    } catch {}
  };
  const normalizeIdentityKey = (value) => String(value || '').trim().toLowerCase();
  const getExpenseParticipants = () => {
    const seen = new Set();
    const participants = [];
    const addParticipant = (value) => {
      const trimmed = String(value || '').trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      participants.push(trimmed);
    };
    if (user?.email) addParticipant(user.email);
    else addParticipant(currentUser);
    (subCalMembers || []).forEach(m => addParticipant(m?.email));
    (subCalExpenses || []).forEach(item => addParticipant(item?.payer));
    return participants;
  };
  const getExpenseDisplayName = (identity) => {
    const raw = String(identity || '').trim();
    if (!raw) return 'Member';
    const current = String(user?.email || currentUser || '').trim().toLowerCase();
    if (current && raw.toLowerCase() === current) return 'You';
    if (!raw.includes('@')) return raw;
    const local = raw.split('@')[0] || raw;
    const cleaned = local.replace(/[._-]+/g, ' ').trim();
    if (!cleaned) return raw;
    return cleaned.replace(/\b\w/g, c => c.toUpperCase());
  };
  const getVenmoHandleForIdentity = (identity) => {
    const key = normalizeIdentityKey(identity);
    return venmoHandles[key] || globalVenmoHandles[key] || '';
  };
  const getCashAppHandleForIdentity = (identity) => {
    const key = normalizeIdentityKey(identity);
    return cashAppHandles[key] || globalCashAppHandles[key] || '';
  };
  const canEditVenmoIdentity = (identity) => {
    const mine = normalizeIdentityKey(user?.email || currentUser);
    if (!mine) return false;
    return normalizeIdentityKey(identity) === mine;
  };
  const cleanVenmoHandle = (value) => String(value || '').trim().replace(/^@+/, '').replace(/\s+/g, '');
  const cleanCashAppHandle = (value) => String(value || '').trim().replace(/^\$+/, '').replace(/\s+/g, '');
  const openVenmoPayment = (recipient, amountCents, note = '') => {
    const cleanRecipient = cleanVenmoHandle(recipient);
    const amount = (Number(amountCents) || 0) / 100;
    if (!cleanRecipient || amount <= 0) return;
    const params = new URLSearchParams({
      txn: 'pay',
      recipients: cleanRecipient,
      amount: amount.toFixed(2),
      note: note || 'Trip expense settlement',
    });
    const deepLink = `venmo://paycharge?${params.toString()}`;
    const webFallback = `https://venmo.com/?${params.toString()}`;
    try {
      window.location.href = deepLink;
      setTimeout(() => {
        window.open(webFallback, '_blank', 'noopener,noreferrer');
      }, 700);
    } catch {
      window.open(webFallback, '_blank', 'noopener,noreferrer');
    }
  };
  const openCashAppPayment = (recipient, amountCents) => {
    const cleanRecipient = cleanCashAppHandle(recipient);
    const amount = (Number(amountCents) || 0) / 100;
    if (!cleanRecipient || amount <= 0) return;
    const amt = amount.toFixed(2);
    // Prefer path-based amount format first; it is more reliable on mobile handoff.
    const webPrimary = `https://cash.app/$${encodeURIComponent(cleanRecipient)}/${encodeURIComponent(amt)}`;
    const webFallback = `https://cash.app/$${encodeURIComponent(cleanRecipient)}?amount=${encodeURIComponent(amt)}`;
    const webAlt = `https://cash.app/pay?cash_tag=${encodeURIComponent(cleanRecipient)}&amount=${encodeURIComponent(amt)}`;
    try {
      window.location.href = webPrimary;
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          window.location.href = webFallback;
        }
      }, 900);
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          window.location.href = webAlt;
        }
      }, 1700);
    } catch {
      window.location.href = webPrimary;
    }
  };
  const openLocationActionChooser = (location) => {
    const destination = String(location || '').trim();
    if (!destination) return;
    setLocationActionTarget(destination);
  };
  const handleLocationLinkClick = (e, location) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    openLocationActionChooser(location);
  };
  const geocodeDestination = async (destination) => {
    if (!destination || !window.google?.maps?.Geocoder) return null;
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: destination }, (results, status) => {
          if (status === 'OK' && results && results[0]) resolve(results[0]);
          else reject(new Error(`geocode status: ${status}`));
        });
      });
      const loc = result.geometry?.location;
      const lat = typeof loc?.lat === 'function' ? loc.lat() : null;
      const lng = typeof loc?.lng === 'function' ? loc.lng() : null;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        lat,
        lng,
        formattedAddress: result.formatted_address || destination,
      };
    } catch {
      return null;
    }
  };
  const handleLocationActionSelect = async (service) => {
    const destination = String(locationActionTarget || '').trim();
    if (!destination) return;
    const encoded = encodeURIComponent(destination);
    if (service === 'google') {
      const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
      setLocationActionTarget('');
      window.open(googleUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const geo = await geocodeDestination(destination);
    const dropLat = geo ? String(geo.lat) : '';
    const dropLng = geo ? String(geo.lng) : '';
    const dropAddress = geo?.formattedAddress || destination;
    setLocationActionTarget('');
    if (service === 'uber') {
      const appParams = new URLSearchParams({
        action: 'setPickup',
        'pickup': 'my_location',
        'dropoff[formatted_address]': dropAddress,
        'dropoff[nickname]': 'Destination',
      });
      if (dropLat && dropLng) {
        appParams.set('dropoff[latitude]', dropLat);
        appParams.set('dropoff[longitude]', dropLng);
      }
      const appLink = `uber://?${appParams.toString()}`;
      const webParams = new URLSearchParams({
        action: 'setPickup',
        pickup: 'my_location',
        'dropoff[formatted_address]': dropAddress,
        'dropoff[nickname]': 'Destination',
      });
      if (dropLat && dropLng) {
        webParams.set('dropoff[latitude]', dropLat);
        webParams.set('dropoff[longitude]', dropLng);
      }
      const primary = `https://m.uber.com/ul/?${webParams.toString()}`;
      let handedOff = false;
      let timer = null;
      const cleanup = () => {
        window.removeEventListener('blur', onHidden);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        if (timer) clearTimeout(timer);
      };
      const onHidden = () => {
        handedOff = true;
        cleanup();
      };
      const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') onHidden();
      };
      window.addEventListener('blur', onHidden);
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.location.href = appLink;
      timer = setTimeout(() => {
        cleanup();
        if (!handedOff && document.visibilityState === 'visible') window.location.href = primary;
      }, 1600);
      return;
    }
    if (service === 'lyft') {
      // Inference: Lyft app URI supports ridetype with destination fields.
      const appParams = new URLSearchParams({
        id: 'lyft',
        pickup: 'my_location',
        'destination[address]': dropAddress,
      });
      if (dropLat && dropLng) {
        appParams.set('destination[latitude]', dropLat);
        appParams.set('destination[longitude]', dropLng);
      }
      const appLink = `lyft://ridetype?${appParams.toString()}`;
      const primary = `https://ride.lyft.com/?${appParams.toString()}`;
      let handedOff = false;
      let timer = null;
      const cleanup = () => {
        window.removeEventListener('blur', onHidden);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        if (timer) clearTimeout(timer);
      };
      const onHidden = () => {
        handedOff = true;
        cleanup();
      };
      const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') onHidden();
      };
      window.addEventListener('blur', onHidden);
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.location.href = appLink;
      timer = setTimeout(() => {
        cleanup();
        if (!handedOff && document.visibilityState === 'visible') window.location.href = primary;
      }, 1600);
      return;
    }
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  // ── Sub-calendar functions ──────────────────────────────────────────────

  const loadSubCalendars = async () => {
    if (!activeLayerId) {
      setSubCalendars([]);
      return [];
    }
    try {
      const myUserId = String(user?.id || '');
      const myEmail = String(user?.email || '').trim().toLowerCase();
      const ownerIdForLayer = String(activeLayerOwnerId || myUserId || '');

      const { data: directRows, error } = await supabase
        .from('sub_calendars')
        .select('*')
        .eq('layer_id', activeLayerId);
      if (error) {
        console.error('Error loading sub_calendars:', error);
        return;
      }

      const { data: sharedOwnerRows } = await supabase
        .from('shared_access')
        .select('owner_id')
        .eq('layer_id', activeLayerId)
        .or(`shared_with_id.eq.${myUserId},shared_with_email.eq.${myEmail}`);
      const accessibleOwnerIds = Array.from(new Set([
        ownerIdForLayer,
        ...((sharedOwnerRows || []).map(row => String(row?.owner_id || '')).filter(Boolean)),
      ]));

      let legacyRows = [];
      if (accessibleOwnerIds.length > 0) {
        const { data: legacyData } = await supabase
          .from('sub_calendars')
          .select('*')
          .is('layer_id', null)
          .in('owner_id', accessibleOwnerIds);
        legacyRows = legacyData || [];
      }

      let memberRows = [];
      const memberTripIdSet = new Set();
      if (myEmail) {
        const { data: memberLinks } = await supabase
          .from('sub_calendar_members')
          .select('sub_calendar_id,status')
          .eq('email', myEmail);
        const memberTripIds = Array.from(new Set((memberLinks || [])
          .filter(row => {
            const status = String(row?.status || '').toLowerCase();
            // Legacy rows without status remain visible; new flow requires accepted.
            return !status || status === 'accepted';
          })
          .map(row => String(row?.sub_calendar_id || ''))
          .filter(Boolean)));
        memberTripIds.forEach(id => memberTripIdSet.add(id));
        if (memberTripIds.length > 0) {
          const { data: memberTrips } = await supabase
            .from('sub_calendars')
            .select('*')
            .in('id', memberTripIds);
          memberRows = memberTrips || [];
        }
      }

      const mergedRows = Array.from(new Map([...(directRows || []), ...legacyRows, ...memberRows].map(sc => [String(sc.id), sc])).values());

      // Deduplicate duplicate cloned trips (same name + dates + effective layer) by selecting the best candidate.
      const dedupedMap = new Map();
      const getTripScore = (sc) => {
        let score = 0;
        const scId = String(sc?.id || '');
        const scLayerId = String(sc?.layer_id || '');
        const scOwnerId = String(sc?.owner_id || '');
        if (scLayerId && scLayerId === String(activeLayerId || '')) score += 4;
        if (!scLayerId) score += 1; // legacy copy
        if (scOwnerId && scOwnerId === String(ownerIdForLayer || '')) score += 2;
        if (memberTripIdSet.has(scId)) score += 1;
        return score;
      };
      const getDedupKey = (sc) => {
        const name = String(sc?.name || '').trim().toLowerCase();
        const start = String(sc?.start_date || '');
        const end = String(sc?.end_date || '');
        return `${name}|${start}|${end}`;
      };
      (mergedRows || []).forEach((sc) => {
        const key = getDedupKey(sc);
        const existing = dedupedMap.get(key);
        if (!existing) {
          dedupedMap.set(key, sc);
          return;
        }
        const currentScore = getTripScore(sc);
        const existingScore = getTripScore(existing);
        if (currentScore > existingScore) {
          dedupedMap.set(key, sc);
          return;
        }
        if (currentScore === existingScore) {
          const currentCreated = Date.parse(sc?.created_at || '') || 0;
          const existingCreated = Date.parse(existing?.created_at || '') || 0;
          if (currentCreated < existingCreated) dedupedMap.set(key, sc);
        }
      });

      const dedupedRows = Array.from(dedupedMap.values());
      setSubCalendars(dedupedRows);
      return dedupedRows;
    } catch (e) { console.error(e); }
    return [];
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
      const myEmail = String(user?.email || '').trim().toLowerCase();
      const { data: memberRows } = await supabase
        .from('sub_calendar_members')
        .select('*')
        .eq('sub_calendar_id', subCalId);

      const merged = new Map();
      const addMember = (email, extra = {}) => {
        const normalized = String(email || '').trim().toLowerCase();
        if (!normalized.includes('@')) return;
        if (!normalized || normalized === myEmail) return;
        if (!merged.has(normalized)) merged.set(normalized, { email: normalized, ...extra });
      };

      (memberRows || []).forEach((row) => {
        const status = String(row?.status || '').toLowerCase();
        if (status === 'declined') return;
        addMember(row?.email, { status: row?.status || null, source: 'trip_invite', removable: true });
      });

      const { data: subCalRow } = await supabase
        .from('sub_calendars')
        .select('layer_id,owner_id,created_by')
        .eq('id', subCalId)
        .maybeSingle();
      const layerId = String(subCalRow?.layer_id || '').trim();
      const subCalOwnerLabel = String(subCalRow?.created_by || '').trim();
      if (subCalOwnerLabel) {
        addMember(subCalOwnerLabel, { status: 'accepted', source: 'subcal_owner', removable: false });
      }
      const subCalOwnerId = String(subCalRow?.owner_id || '').trim();
      if (subCalOwnerId) {
        const ownerLabel = String(sharedOwnerLabels?.[subCalOwnerId] || '').trim();
        if (ownerLabel) addMember(ownerLabel, { status: 'accepted', source: 'subcal_owner', removable: false });
      }
      if (layerId) {
        const { data: sharedRows } = await supabase
          .from('shared_access')
          .select('owner_id,shared_with_email')
          .eq('layer_id', layerId);
        (sharedRows || []).forEach((row) => {
          const sharedEmail = String(row?.shared_with_email || '').trim().toLowerCase();
          const ownerId = String(row?.owner_id || '').trim();

          // Always include directly shared recipient email (unless it's me).
          if (sharedEmail) {
            addMember(sharedEmail, { status: 'accepted', source: 'layer_share', removable: false });
          }

          // If this row is "owner shared to me", also include the owner label/email.
          // This preserves collaborator visibility for recipients under strict RLS.
          if (sharedEmail && sharedEmail === myEmail && ownerId) {
            const ownerLabel = String(sharedOwnerLabels?.[ownerId] || '').trim().toLowerCase();
            if (ownerLabel.includes('@')) {
              addMember(ownerLabel, { status: 'accepted', source: 'layer_share_owner', removable: false });
            }
          }
        });

        // Fallback: infer collaborators from visible layer events.
        const { data: layerEventRows } = await supabase
          .from('events')
          .select('created_by,user_id')
          .eq('layer_id', layerId)
          .limit(500);
        (layerEventRows || []).forEach((row) => {
          const createdBy = String(row?.created_by || '').trim();
          if (createdBy) addMember(createdBy, { status: 'accepted', source: 'layer_events', removable: false });
          const ownerLabel = String(sharedOwnerLabels?.[String(row?.user_id || '')] || '').trim();
          if (ownerLabel) addMember(ownerLabel, { status: 'accepted', source: 'layer_events_owner', removable: false });
        });
      }

      // Fallback: infer collaborators from trip itinerary events.
      const { data: subCalEventRows } = await supabase
        .from('sub_calendar_events')
        .select('created_by')
        .eq('sub_calendar_id', subCalId)
        .limit(500);
      (subCalEventRows || []).forEach((row) => {
        const createdBy = String(row?.created_by || '').trim();
        if (createdBy) addMember(createdBy, { status: 'accepted', source: 'trip_events', removable: false });
      });

      setSubCalMembers(Array.from(merged.values()));
    } catch (e) { console.error(e); }
  };

  const syncSubCalendarMembersFromLayer = async (subCal) => {
    try {
      const subCalId = String(subCal?.id || '').trim();
      const layerId = String(subCal?.layer_id || '').trim();
      if (!subCalId || !layerId || !user?.id) return;

      // Only owner should maintain canonical trip member mirror from layer shares.
      if (String(subCal?.owner_id || '') !== String(user.id)) return;

      const { data: sharedRows, error: sharedErr } = await supabase
        .from('shared_access')
        .select('shared_with_email')
        .eq('layer_id', layerId);
      if (sharedErr) {
        console.error('syncSubCalendarMembersFromLayer shared_access error:', sharedErr);
        return;
      }

      const sharedEmails = Array.from(
        new Set(
          (sharedRows || [])
            .map((r) => String(r?.shared_with_email || '').trim().toLowerCase())
            .filter(Boolean)
        )
      );
      if (sharedEmails.length === 0) return;

      const { data: existingRows, error: existingErr } = await supabase
        .from('sub_calendar_members')
        .select('email')
        .eq('sub_calendar_id', subCalId);
      if (existingErr) {
        console.error('syncSubCalendarMembersFromLayer existing members error:', existingErr);
        return;
      }
      const existingEmails = new Set((existingRows || []).map((r) => String(r?.email || '').trim().toLowerCase()).filter(Boolean));
      const missingEmails = sharedEmails.filter((email) => !existingEmails.has(email));
      if (missingEmails.length === 0) return;

      const nowIso = new Date().toISOString();
      const rows = missingEmails.map((email) => ({
        sub_calendar_id: subCalId,
        email,
        added_by: user.id,
        status: 'accepted',
        invited_at: nowIso,
        accepted_at: nowIso,
        created_at: nowIso,
      }));

      let { error: insertErr } = await supabase.from('sub_calendar_members').insert(rows);
      if (insertErr && /column .*created_at|schema cache/i.test(String(insertErr.message || ''))) {
        const fallbackRows = rows.map(({ created_at, ...rest }) => rest);
        const fallback = await supabase.from('sub_calendar_members').insert(fallbackRows);
        insertErr = fallback.error;
      }
      if (insertErr && !/duplicate key|already exists|unique constraint/i.test(String(insertErr.message || ''))) {
        console.error('syncSubCalendarMembersFromLayer insert error:', insertErr);
      }
    } catch (e) {
      console.error('syncSubCalendarMembersFromLayer exception:', e);
    }
  };

  const loadGlobalVenmoHandles = async () => {
    try {
      const { data, error } = await supabase
        .from('sub_calendar_notes')
        .select('checklist')
        .eq('text', VENMO_HANDLES_NOTE_TEXT)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Error loading global Venmo handles:', error);
        return;
      }
      const merged = {};
      (data || []).forEach((row) => {
        let parsed = {};
        try {
          parsed = row?.checklist ? JSON.parse(row.checklist) : {};
        } catch {
          parsed = {};
        }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
        Object.entries(parsed).forEach(([k, v]) => {
          const key = normalizeIdentityKey(k);
          const handle = cleanVenmoHandle(v);
          if (key && handle) merged[key] = handle;
        });
      });
      setGlobalVenmoHandles(merged);
    } catch (e) { console.error(e); }
  };

  const loadGlobalCashAppHandles = async () => {
    try {
      const { data, error } = await supabase
        .from('sub_calendar_notes')
        .select('checklist')
        .eq('text', CASHAPP_HANDLES_NOTE_TEXT)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Error loading global Cash App handles:', error);
        return;
      }
      const merged = {};
      (data || []).forEach((row) => {
        let parsed = {};
        try {
          parsed = row?.checklist ? JSON.parse(row.checklist) : {};
        } catch {
          parsed = {};
        }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
        Object.entries(parsed).forEach(([k, v]) => {
          const key = normalizeIdentityKey(k);
          const handle = cleanCashAppHandle(v);
          if (key && handle) merged[key] = handle;
        });
      });
      setGlobalCashAppHandles(merged);
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
      layer_id: activeLayerId,
      calendar_id: activeLayerId,
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
    await supabase.from('sub_calendars').delete().eq('id', id).eq('layer_id', activeLayerId);
    setSubCalendars(prev => prev.filter(sc => sc.id !== id));
    if (activeSubCalendar?.id === id) setActiveSubCalendar(null);
  };

  const handleTripSwipeStart = (e, tripId, canDelete) => {
    if (!canDelete) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    tripSwipeStartXRef.current = touch.clientX;
    swipingTripIdRef.current = tripId;
    if (swipedTripId && swipedTripId !== tripId) setSwipedTripId(null);
  };

  const handleTripSwipeMove = (e) => {
    const tripId = swipingTripIdRef.current;
    if (!tripId) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    const deltaX = touch.clientX - tripSwipeStartXRef.current;
    const clamped = Math.max(-88, Math.min(0, deltaX));
    setTripSwipeDrag({ id: tripId, offset: clamped });
  };

  const handleTripSwipeEnd = () => {
    const tripId = swipingTripIdRef.current;
    if (!tripId) return;
    const open = tripSwipeDrag.id === tripId && tripSwipeDrag.offset <= -44;
    setSwipedTripId(open ? tripId : null);
    setTripSwipeDrag({ id: null, offset: 0 });
    swipingTripIdRef.current = null;
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
    setDeletedPhotoIds([]);
    setDeletedPhotosNoteId(null);
    await loadGlobalVenmoHandles();
    await loadGlobalCashAppHandles();
    await syncSubCalendarMembersFromLayer(sc);
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
    if (!user?.id) {
      alert('You must be signed in to invite members.');
      return;
    }

    const payload = {
      sub_calendar_id: activeSubCalendar.id,
      email: emailToInvite,
      added_by: user.id,
      status: 'pending',
      invited_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    let error = null;
    try {
      const primary = await supabase.from('sub_calendar_members').insert(payload);
      error = primary.error;

      if (error && /column .*created_at|schema cache/i.test(String(error.message || ''))) {
        const fallbackPayload = {
          sub_calendar_id: activeSubCalendar.id,
          email: emailToInvite,
          added_by: user.id,
          status: 'pending',
          invited_at: new Date().toISOString(),
        };
        const fallback = await supabase.from('sub_calendar_members').insert(fallbackPayload);
        error = fallback.error;
      }

      // If already invited, refresh invite timestamp/status so recipient gets a fresh invite notification.
      if (error && /duplicate key|already exists|unique constraint/i.test(String(error.message || ''))) {
        const refreshPayload = {
          added_by: user.id,
          status: 'pending',
          invited_at: new Date().toISOString(),
        };
        const refresh = await supabase
          .from('sub_calendar_members')
          .update(refreshPayload)
          .eq('sub_calendar_id', activeSubCalendar.id)
          .ilike('email', emailToInvite);
        error = refresh.error;
      }
    } catch (e) {
      error = e;
    }

    if (error) {
      console.error('Error inviting member:', error);
      alert(`Invite failed: ${error.message || 'Unknown error'}`);
      return;
    }

    await loadSubCalendarMembers(activeSubCalendar.id);
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
      const visibleNotes = [];
      let loadedExpenses = [];
      let loadedLedgerId = null;
      let loadedVenmoHandles = {};
      let loadedVenmoHandlesNoteId = null;
      let loadedCashAppHandles = {};
      let loadedCashAppHandlesNoteId = null;
      let loadedDeletedPhotoIds = [];
      let loadedDeletedPhotosNoteId = null;
      (data || []).forEach((n) => {
        let parsedChecklist = [];
        try {
          parsedChecklist = n.checklist ? JSON.parse(n.checklist) : [];
        } catch {
          parsedChecklist = [];
        }
        if (n.text === EXPENSE_LEDGER_NOTE_TEXT) {
          loadedLedgerId = n.id;
          loadedExpenses = Array.isArray(parsedChecklist) ? parsedChecklist : [];
          return;
        }
        if (n.text === VENMO_HANDLES_NOTE_TEXT) {
          loadedVenmoHandlesNoteId = n.id;
          const parsed = (parsedChecklist && typeof parsedChecklist === 'object' && !Array.isArray(parsedChecklist)) ? parsedChecklist : {};
          const sanitized = {};
          Object.entries(parsed).forEach(([k, v]) => {
            const key = normalizeIdentityKey(k);
            const handle = cleanVenmoHandle(v);
            if (key && handle) sanitized[key] = handle;
          });
          loadedVenmoHandles = sanitized;
          return;
        }
        if (n.text === CASHAPP_HANDLES_NOTE_TEXT) {
          loadedCashAppHandlesNoteId = n.id;
          const parsed = (parsedChecklist && typeof parsedChecklist === 'object' && !Array.isArray(parsedChecklist)) ? parsedChecklist : {};
          const sanitized = {};
          Object.entries(parsed).forEach(([k, v]) => {
            const key = normalizeIdentityKey(k);
            const handle = cleanCashAppHandle(v);
            if (key && handle) sanitized[key] = handle;
          });
          loadedCashAppHandles = sanitized;
          return;
        }
        if (n.text === DELETED_PHOTOS_NOTE_TEXT) {
          loadedDeletedPhotosNoteId = n.id;
          loadedDeletedPhotoIds = Array.isArray(parsedChecklist) ? parsedChecklist : [];
          return;
        }
        visibleNotes.push({ ...n, checklist: parsedChecklist });
      });
      setSubCalNotes(visibleNotes);
      setSubCalExpenses(loadedExpenses);
      setExpenseLedgerNoteId(loadedLedgerId);
      setVenmoHandles({ ...globalVenmoHandles, ...loadedVenmoHandles });
      setVenmoHandlesNoteId(loadedVenmoHandlesNoteId);
      setCashAppHandles({ ...globalCashAppHandles, ...loadedCashAppHandles });
      setCashAppHandlesNoteId(loadedCashAppHandlesNoteId);
      const localDeleted = readLocalDeletedPhotoIds(subCalId);
      setDeletedPhotoIds(Array.from(new Set([...(loadedDeletedPhotoIds || []).map(id => String(id)), ...localDeleted])));
      setDeletedPhotosNoteId(loadedDeletedPhotosNoteId);
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
      const deletedSet = new Set((deletedPhotoIds || []).map(id => String(id)));
      const filtered = (data || []).filter(p => !deletedSet.has(String(p.id)));
      setTripPhotos(filtered);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!deletedPhotoIds || deletedPhotoIds.length === 0) return;
    const deletedSet = new Set((deletedPhotoIds || []).map(id => String(id)));
    setTripPhotos(prev => prev.filter(p => !deletedSet.has(String(p.id))));
  }, [deletedPhotoIds]);

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
        created_at: new Date().toISOString(),
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

  const removeTripPhotoRecord = async (photo) => {
    try {
      const removeFromStorage = async () => {
        const TRIP_PHOTO_BUCKETS = ['trip-photos', 'trip_photos'];
        for (const bucket of TRIP_PHOTO_BUCKETS) {
          const marker = `/object/public/${bucket}/`;
          const idx = photo.url.indexOf(marker);
          if (idx === -1) continue;
          const path = decodeURIComponent(photo.url.slice(idx + marker.length));
          if (!path) continue;
          const { error: storageError } = await supabase.storage.from(bucket).remove([path]);
          if (storageError) console.warn('Storage delete warning:', storageError.message);
          break;
        }
      };
      const { data: deletedRows, error: dbError } = await supabase
        .from('trip_photos')
        .delete()
        .eq('id', photo.id)
        .select('id');
      if (dbError || !Array.isArray(deletedRows) || deletedRows.length === 0) {
        const fallbackOk = await markPhotoDeleted(photo.id);
        if (fallbackOk) {
          setPhotoUploadError(false);
          setPhotoUploadMessage('Photo removed.');
          return true;
        }
        setPhotoUploadError(true);
        if (dbError) setPhotoUploadMessage(`Could not delete photo: ${dbError.message}`);
        else setPhotoUploadMessage('Could not delete photo from database; saved local hidden state instead.');
        return false;
      }
      setTripPhotos(prev => prev.filter(p => p.id !== photo.id));
      await removeFromStorage();
      return true;
    } catch (e) {
      console.error('Photo delete failed:', e);
      const fallbackOk = await markPhotoDeleted(photo.id);
      if (fallbackOk) {
        setPhotoUploadError(false);
        setPhotoUploadMessage('Photo removed.');
        return true;
      }
      setPhotoUploadError(true);
      setPhotoUploadMessage(`Could not delete photo: ${e.message || 'Unknown error'}`);
      return false;
    }
  };

  const deleteTripPhoto = async (photo) => {
    if (!window.confirm('Delete this photo?')) return;
    await removeTripPhotoRecord(photo);
  };

  const clearPhotoReactionHold = () => {
    if (photoDeleteHoldTimerRef.current) {
      clearTimeout(photoDeleteHoldTimerRef.current);
      photoDeleteHoldTimerRef.current = null;
    }
  };

  const clearPhotoTapTimer = () => {
    if (photoTapRef.current.timer) {
      clearTimeout(photoTapRef.current.timer);
      photoTapRef.current.timer = null;
    }
  };

  const saveSinglePhotoToDevice = async (photo) => {
    if (!photo?.url) return;
    try {
      const res = await fetch(photo.url);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const extFromType = blob.type?.split('/')[1] || 'jpg';
      const file = new File([blob], `photo.${extFromType}`, { type: blob.type || 'image/jpeg' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Photo', text: 'Save photo' });
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
      setPhotoUploadError(false);
      setPhotoUploadMessage('Photo ready to save.');
    } catch (e) {
      console.error('Save photo failed:', e);
      setPhotoUploadError(true);
      setPhotoUploadMessage('Could not save photo.');
    }
  };

  const startPhotoHoldAction = (photo) => {
    if (!photo || isPhotoSelectionMode || photoDeleteMode) return;
    clearPhotoReactionHold();
    photoDeleteHoldTimerRef.current = setTimeout(() => {
      photoHoldSuppressRef.current = { id: photo.id, until: Date.now() + 500 };
      if (window.confirm('Save this photo to your device?')) {
        saveSinglePhotoToDevice(photo);
      }
      clearPhotoReactionHold();
    }, 550);
  };

  const handlePhotoTap = (photo) => {
    if (!photo) return;
    if (isPhotoSelectionMode) {
      toggleSelectedPhoto(photo.id);
      return;
    }
    if (photoDeleteMode) return;
    const suppress = photoHoldSuppressRef.current;
    if (suppress.id === photo.id && Date.now() < suppress.until) return;
    const now = Date.now();
    const prev = photoTapRef.current;
    if (prev.id === photo.id && now - prev.at < 300) {
      clearPhotoTapTimer();
      photoTapRef.current = { id: null, at: 0, timer: null };
      setLightboxPhoto(photo);
      return;
    }
    photoTapRef.current = { id: photo.id, at: now, timer: null };
  };

  useEffect(() => () => {
    clearPhotoReactionHold();
    clearPhotoTapTimer();
  }, []);

  const toggleSelectedPhoto = (photoId) => {
    setSelectedPhotoIds(prev => prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]);
  };

  const closePhotoSelectionMode = () => {
    setIsPhotoSelectionMode(false);
    setSelectedPhotoIds([]);
  };

  const saveSelectedPhotosToDevice = async () => {
    const selected = tripPhotos.filter(p => selectedPhotoIds.includes(p.id));
    if (selected.length === 0) return;
    try {
      const files = [];
      for (let i = 0; i < selected.length; i++) {
        const photo = selected[i];
        const res = await fetch(photo.url);
        if (!res.ok) continue;
        const blob = await res.blob();
        const extFromType = blob.type?.split('/')[1] || 'jpg';
        const baseName = `photo-${i + 1}.${extFromType}`;
        files.push(new File([blob], baseName, { type: blob.type || 'image/jpeg' }));
      }

      if (files.length > 0 && navigator.share && navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: `${files.length} photo${files.length === 1 ? '' : 's'}`,
          text: 'Save photos',
        });
        setPhotoUploadError(false);
        setPhotoUploadMessage(`Shared ${files.length} photo${files.length === 1 ? '' : 's'}.`);
        return;
      }

      // Fallback for browsers without file-sharing support.
      files.forEach((file, idx) => {
        const url = URL.createObjectURL(file);
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name || `photo-${idx + 1}.jpg`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1500);
        }, idx * 120);
      });
      setPhotoUploadError(false);
      setPhotoUploadMessage(`Saving ${files.length} photo${files.length === 1 ? '' : 's'} to device...`);
    } catch (e) {
      if (e?.name === 'AbortError') return; // user closed share sheet
      console.error('Save photos failed:', e);
      setPhotoUploadError(true);
      setPhotoUploadMessage('Could not save selected photos. Try again.');
    }
  };

  const deleteSelectedPhotos = async () => {
    const selected = tripPhotos.filter(p => selectedPhotoIds.includes(p.id));
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} selected photo${selected.length === 1 ? '' : 's'}?`)) return;
    let deletedCount = 0;
    for (const photo of selected) {
      const ok = await removeTripPhotoRecord(photo);
      if (ok) deletedCount += 1;
    }
    setPhotoUploadError(false);
    setPhotoUploadMessage(`Deleted ${deletedCount} photo${deletedCount === 1 ? '' : 's'}.`);
    closePhotoSelectionMode();
  };

  const handleTripPhotoFilesSelected = async (files, clearInput) => {
    if (!files || files.length === 0) return;
    setPhotoUploadError(false);
    setPhotoUploadMessage('');
    let successCount = 0;
    for (const file of files) {
      const ok = await uploadTripPhoto(
        file,
        null,
        photoEventId,
        photoDate || (subCalSelectedDate ? getDateKey(subCalSelectedDate) : null)
      );
      if (ok) successCount += 1;
    }
    if (successCount > 1) {
      setPhotoUploadError(false);
      setPhotoUploadMessage(`Uploaded ${successCount} photos.`);
    }
    setPhotoEventId(null);
    if (clearInput) clearInput();
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

  const saveExpenseLedger = async (expenses) => {
    if (!activeSubCalendar) return false;
    const payload = {
      checklist: JSON.stringify(expenses),
    };
    if (expenseLedgerNoteId) {
      const { error } = await supabase.from('sub_calendar_notes').update(payload).eq('id', expenseLedgerNoteId);
      if (error) {
        setExpenseError(`Could not save expenses: ${error.message}`);
        return false;
      }
      return true;
    }
    const row = {
      id: `scexp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sub_calendar_id: activeSubCalendar.id,
      text: EXPENSE_LEDGER_NOTE_TEXT,
      checklist: JSON.stringify(expenses),
      created_by: currentUser,
      user_id: user?.id,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('sub_calendar_notes').insert(row);
    if (error) {
      setExpenseError(`Could not save expenses: ${error.message}`);
      return false;
    }
    setExpenseLedgerNoteId(row.id);
    return true;
  };

  const saveVenmoHandles = async (nextHandles) => {
    if (!activeSubCalendar) return false;
    const payload = {
      checklist: JSON.stringify(nextHandles),
    };
    if (venmoHandlesNoteId) {
      const { error } = await supabase.from('sub_calendar_notes').update(payload).eq('id', venmoHandlesNoteId);
      if (error) {
        setExpenseError(`Could not save Venmo handle: ${error.message}`);
        return false;
      }
      return true;
    }
    const row = {
      id: `scvenmo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sub_calendar_id: activeSubCalendar.id,
      text: VENMO_HANDLES_NOTE_TEXT,
      checklist: JSON.stringify(nextHandles),
      created_by: currentUser,
      user_id: user?.id,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('sub_calendar_notes').insert(row);
    if (error) {
      setExpenseError(`Could not save Venmo handle: ${error.message}`);
      return false;
    }
    setVenmoHandlesNoteId(row.id);
    return true;
  };

  const saveVenmoHandleEverywhere = async (identity, handle) => {
    const key = normalizeIdentityKey(identity);
    if (!key || !activeSubCalendar) return false;
    const cleaned = cleanVenmoHandle(handle);
    const { data, error } = await supabase
      .from('sub_calendar_notes')
      .select('id,sub_calendar_id,checklist')
      .eq('text', VENMO_HANDLES_NOTE_TEXT);
    if (error) {
      setExpenseError(`Could not save Venmo handle: ${error.message}`);
      return false;
    }

    const rows = data || [];
    if (rows.length === 0) {
      if (!cleaned) return true;
      const initial = { ...globalVenmoHandles, [key]: cleaned };
      const ok = await saveVenmoHandles(initial);
      if (!ok) return false;
      setGlobalVenmoHandles(initial);
      setVenmoHandles(initial);
      return true;
    }

    let foundActiveRow = false;
    for (const row of rows) {
      let parsed = {};
      try {
        parsed = row?.checklist ? JSON.parse(row.checklist) : {};
      } catch {
        parsed = {};
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) parsed = {};
      if (cleaned) parsed[key] = cleaned;
      else delete parsed[key];

      const { error: updateError } = await supabase
        .from('sub_calendar_notes')
        .update({ checklist: JSON.stringify(parsed) })
        .eq('id', row.id);
      if (updateError) {
        setExpenseError(`Could not save Venmo handle: ${updateError.message}`);
        return false;
      }
      if (row.sub_calendar_id === activeSubCalendar.id) {
        foundActiveRow = true;
        setVenmoHandles(parsed);
        setVenmoHandlesNoteId(row.id);
      }
    }

    if (!foundActiveRow && cleaned) {
      const nextCurrent = { ...globalVenmoHandles };
      nextCurrent[key] = cleaned;
      const ok = await saveVenmoHandles(nextCurrent);
      if (!ok) return false;
      setVenmoHandles(nextCurrent);
    }

    setGlobalVenmoHandles(prev => {
      const next = { ...prev };
      if (cleaned) next[key] = cleaned;
      else delete next[key];
      return next;
    });
    return true;
  };

  const saveCashAppHandles = async (nextHandles) => {
    if (!activeSubCalendar) return false;
    const payload = {
      checklist: JSON.stringify(nextHandles),
    };
    if (cashAppHandlesNoteId) {
      const { error } = await supabase.from('sub_calendar_notes').update(payload).eq('id', cashAppHandlesNoteId);
      if (error) {
        setExpenseError(`Could not save Cash App handle: ${error.message}`);
        return false;
      }
      return true;
    }
    const row = {
      id: `sccash_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sub_calendar_id: activeSubCalendar.id,
      text: CASHAPP_HANDLES_NOTE_TEXT,
      checklist: JSON.stringify(nextHandles),
      created_by: currentUser,
      user_id: user?.id,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('sub_calendar_notes').insert(row);
    if (error) {
      setExpenseError(`Could not save Cash App handle: ${error.message}`);
      return false;
    }
    setCashAppHandlesNoteId(row.id);
    return true;
  };

  const saveCashAppHandleEverywhere = async (identity, handle) => {
    const key = normalizeIdentityKey(identity);
    if (!key || !activeSubCalendar) return false;
    const cleaned = cleanCashAppHandle(handle);
    const { data, error } = await supabase
      .from('sub_calendar_notes')
      .select('id,sub_calendar_id,checklist')
      .eq('text', CASHAPP_HANDLES_NOTE_TEXT);
    if (error) {
      setExpenseError(`Could not save Cash App handle: ${error.message}`);
      return false;
    }

    const rows = data || [];
    if (rows.length === 0) {
      if (!cleaned) return true;
      const initial = { ...globalCashAppHandles, [key]: cleaned };
      const ok = await saveCashAppHandles(initial);
      if (!ok) return false;
      setGlobalCashAppHandles(initial);
      setCashAppHandles(initial);
      return true;
    }

    let foundActiveRow = false;
    for (const row of rows) {
      let parsed = {};
      try {
        parsed = row?.checklist ? JSON.parse(row.checklist) : {};
      } catch {
        parsed = {};
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) parsed = {};
      if (cleaned) parsed[key] = cleaned;
      else delete parsed[key];

      const { error: updateError } = await supabase
        .from('sub_calendar_notes')
        .update({ checklist: JSON.stringify(parsed) })
        .eq('id', row.id);
      if (updateError) {
        setExpenseError(`Could not save Cash App handle: ${updateError.message}`);
        return false;
      }
      if (row.sub_calendar_id === activeSubCalendar.id) {
        foundActiveRow = true;
        setCashAppHandles(parsed);
        setCashAppHandlesNoteId(row.id);
      }
    }

    if (!foundActiveRow && cleaned) {
      const nextCurrent = { ...globalCashAppHandles };
      nextCurrent[key] = cleaned;
      const ok = await saveCashAppHandles(nextCurrent);
      if (!ok) return false;
      setCashAppHandles(nextCurrent);
    }

    setGlobalCashAppHandles(prev => {
      const next = { ...prev };
      if (cleaned) next[key] = cleaned;
      else delete next[key];
      return next;
    });
    return true;
  };

  const promptSetVenmoHandle = async (identity) => {
    const key = normalizeIdentityKey(identity);
    if (!key) return;
    if (!canEditVenmoIdentity(identity)) {
      setExpenseError('You can only edit your own Venmo handle.');
      return;
    }
    const currentHandle = getVenmoHandleForIdentity(identity);
    const value = window.prompt(`Set Venmo username for ${getExpenseDisplayName(identity)} (without @):`, currentHandle);
    if (value === null) return;
    const cleaned = cleanVenmoHandle(value);
    const ok = await saveVenmoHandleEverywhere(identity, cleaned);
    if (!ok) return;
    setExpenseError('');
  };

  const promptSetCashAppHandle = async (identity) => {
    const key = normalizeIdentityKey(identity);
    if (!key) return;
    if (!canEditVenmoIdentity(identity)) {
      setExpenseError('You can only edit your own Cash App handle.');
      return;
    }
    const currentHandle = getCashAppHandleForIdentity(identity);
    const value = window.prompt(`Set Cash App cashtag for ${getExpenseDisplayName(identity)} (without $):`, currentHandle);
    if (value === null) return;
    const cleaned = cleanCashAppHandle(value);
    const ok = await saveCashAppHandleEverywhere(identity, cleaned);
    if (!ok) return;
    setExpenseError('');
  };

  const saveDeletedPhotoIds = async (nextDeletedIds) => {
    if (!activeSubCalendar) return false;
    const subCalId = activeSubCalendar.id;
    const normalizedDeleted = Array.from(new Set((nextDeletedIds || []).map(id => String(id)).filter(Boolean)));
    writeLocalDeletedPhotoIds(subCalId, normalizedDeleted);
    const payload = {
      checklist: JSON.stringify(normalizedDeleted),
    };
    if (deletedPhotosNoteId) {
      const { error } = await supabase.from('sub_calendar_notes').update(payload).eq('id', deletedPhotosNoteId);
      if (error) {
        setPhotoUploadError(false);
        setPhotoUploadMessage(`Photo hidden on this device. Could not sync deleted-photo state: ${error.message}`);
        return true;
      }
      return true;
    }
    const row = {
      id: `scdel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sub_calendar_id: activeSubCalendar.id,
      text: DELETED_PHOTOS_NOTE_TEXT,
      checklist: JSON.stringify(normalizedDeleted),
      created_by: currentUser,
      user_id: user?.id,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('sub_calendar_notes').insert(row);
    if (error) {
      setPhotoUploadError(false);
      setPhotoUploadMessage(`Photo hidden on this device. Could not sync deleted-photo state: ${error.message}`);
      return true;
    }
    setDeletedPhotosNoteId(row.id);
    return true;
  };

  const markPhotoDeleted = async (photoId) => {
    if (!photoId) return false;
    const nextDeleted = Array.from(new Set([...(deletedPhotoIds || []).map(id => String(id)), String(photoId)]));
    const ok = await saveDeletedPhotoIds(nextDeleted);
    if (!ok) return false;
    setDeletedPhotoIds(nextDeleted);
    setTripPhotos(prev => prev.filter(p => String(p.id) !== String(photoId)));
    return true;
  };

  const toggleExpensePanel = (panelKey) => {
    setExpensePanels(prev => ({ ...prev, [panelKey]: !prev[panelKey] }));
  };

  const addSubCalExpense = async () => {
    const participants = getExpenseParticipants();
    const payer = (newExpenseDraft.payer || participants[0] || '').trim();
    const description = newExpenseDraft.description.trim();
    const amount = Number.parseFloat(newExpenseDraft.amount);
    if (!payer || !description || !Number.isFinite(amount) || amount <= 0) {
      setExpenseError('Enter payer, description, and a valid amount.');
      return;
    }
    const expense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      payer,
      description,
      amount: Math.round(amount * 100) / 100,
      createdAt: new Date().toISOString(),
    };
    const updated = [...subCalExpenses, expense];
    const ok = await saveExpenseLedger(updated);
    if (!ok) return;
    setExpenseError('');
    setSubCalExpenses(updated);
    setNewExpenseDraft({ payer, description: '', amount: '' });
  };

  const deleteSubCalExpense = async (expenseId) => {
    const updated = subCalExpenses.filter(e => e.id !== expenseId);
    const ok = await saveExpenseLedger(updated);
    if (!ok) return;
    setExpenseError('');
    setSubCalExpenses(updated);
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
    const { data, error } = await supabase
      .from('sub_calendar_events')
      .delete()
      .select('id')
      .eq('id', eventId);
    if (error) {
      console.error('Error deleting sub-calendar event:', error);
      alert(`Could not delete trip event: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      alert('Could not delete trip event (no rows affected). Check DB permissions.');
      return;
    }
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
      .eq('layer_id', activeLayerId)
      .then(({ error }) => {
        if (error) console.error('Error saving reaction:', error);
      });
  }; // 'month' | 'week'
  const [holidays, setHolidays] = useState({});
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [showLayerModal, setShowLayerModal] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [sharedCalendars, setSharedCalendars] = useState([]); // calendars others shared with me
  const [sharedOwnerLabels, setSharedOwnerLabels] = useState({});
  const [myShares, setMyShares] = useState([]); // people I've shared with
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showListPanel, setShowListPanel] = useState(false);
  const [sharedListGroups, setSharedListGroups] = useState([]);
  const [sharedListItems, setSharedListItems] = useState([]);
  const [selectedSharedListId, setSelectedSharedListId] = useState(null);
  const [newSharedListTitle, setNewSharedListTitle] = useState('');
  const [newListItemText, setNewListItemText] = useState('');
  const [editingListGroupId, setEditingListGroupId] = useState(null);
  const [editingListGroupTitle, setEditingListGroupTitle] = useState('');
  const [editingListItemId, setEditingListItemId] = useState(null);
  const [editingListText, setEditingListText] = useState('');
  const [listError, setListError] = useState('');
  const [shareEmailInput, setShareEmailInput] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [mergeTargetLayerId, setMergeTargetLayerId] = useState('');
  const [mergeInProgress, setMergeInProgress] = useState(false);
  const autoMergeSeenRef = useRef(new Set());
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [showTipBanner, setShowTipBanner] = useState(() => localStorage.getItem('hideTipBanner') !== 'true');
  const [weather, setWeather] = useState({}); // { 'YYYY-MM-DD': { emoji, high, low } }
  const [showWeather, setShowWeather] = useState(true);

  const isUuidLike = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim());
  const cleanOwnerLabel = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (isUuidLike(raw)) return '';
    return raw;
  };
  const fallbackOwnerLabel = (ownerId) => {
    const id = String(ownerId || '');
    if (!id) return 'another user';
    return isUuidLike(id) ? `User ${id.slice(0, 8)}` : id;
  };
  const activeLayer = layers.find(layer => layer.id === activeLayerId) || null;
  const activeLayerOwnerId = activeLayer?.owner_id || user?.id || null;

  const resolveSharedOwnerLabels = async (shares, layerId) => {
    const ownerIds = Array.from(new Set((shares || []).map(s => String(s?.owner_id || '')).filter(Boolean)));
    if (ownerIds.length === 0) {
      setSharedOwnerLabels({});
      return;
    }

    const nextLabels = {};
    ownerIds.forEach(id => { nextLabels[id] = ''; });

    try {
      const { data: eventRows, error: eventErr } = await supabase
        .from('events')
        .select('user_id,created_by,created_at')
        .in('user_id', ownerIds)
        .eq('layer_id', layerId)
        .order('created_at', { ascending: false })
        .limit(500);
      if (!eventErr) {
        (eventRows || []).forEach(row => {
          const ownerId = String(row?.user_id || '');
          if (!ownerId || nextLabels[ownerId]) return;
          const label = cleanOwnerLabel(row?.created_by);
          if (label) nextLabels[ownerId] = label;
        });
      }
    } catch {}

    const missingAfterEvents = ownerIds.filter(id => !nextLabels[id]);
    if (missingAfterEvents.length > 0) {
      try {
        const { data: subCalRows, error: subCalErr } = await supabase
          .from('sub_calendars')
          .select('owner_id,created_by,created_at')
          .in('owner_id', missingAfterEvents)
          .order('created_at', { ascending: false })
          .limit(500);
        if (!subCalErr) {
          (subCalRows || []).forEach(row => {
            const ownerId = String(row?.owner_id || '');
            if (!ownerId || nextLabels[ownerId]) return;
            const label = cleanOwnerLabel(row?.created_by);
            if (label) nextLabels[ownerId] = label;
          });
        }
      } catch {}
    }

    setSharedOwnerLabels(prev => {
      const merged = { ...prev };
      ownerIds.forEach(id => {
        merged[id] = nextLabels[id] || prev[id] || fallbackOwnerLabel(id);
      });
      return merged;
    });
  };

  const loadLayersForUser = async (userId, userEmail) => {
    let { data: ownedLayers, error: ownedErr } = await supabase
      .from('calendar_layers')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true });
    if (ownedErr) throw ownedErr;

    // Bootstrap a brand-new account with a default calendar.
    if (!ownedLayers || ownedLayers.length === 0) {
      const defaultPayload = {
        owner_id: userId,
        name: 'Main Calendar',
        is_default: true,
        created_by: currentUser || userEmail || 'User',
      };
      const { data: insertedLayer, error: insertErr } = await supabase
        .from('calendar_layers')
        .insert(defaultPayload)
        .select('*')
        .single();
      if (insertErr) {
        // If another session created it first, continue by reloading owned layers.
        const { data: reloadedOwned, error: reloadErr } = await supabase
          .from('calendar_layers')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: true });
        if (reloadErr) throw reloadErr;
        ownedLayers = reloadedOwned || [];
      } else {
        ownedLayers = insertedLayer ? [insertedLayer] : [];
      }
    }

    const { data: sharedRows } = await supabase
      .from('shared_access')
      .select('layer_id')
      .or(`shared_with_email.eq.${userEmail},shared_with_id.eq.${userId}`);
    const sharedLayerIds = Array.from(new Set((sharedRows || []).map(r => String(r?.layer_id || '')).filter(Boolean)));

    let sharedLayers = [];
    if (sharedLayerIds.length > 0) {
      const { data: sharedLayerData, error: sharedLayersErr } = await supabase
        .from('calendar_layers')
        .select('*')
        .in('id', sharedLayerIds)
        .order('created_at', { ascending: true });
      if (sharedLayersErr) throw sharedLayersErr;
      sharedLayers = sharedLayerData || [];
    }

    const merged = Array.from(new Map([...(ownedLayers || []), ...sharedLayers].map(layer => [String(layer.id), layer])).values());
    setLayers(merged);
    return merged;
  };

  const createLayerCalendar = async () => {
    const name = newLayerName.trim();
    if (!name || !user?.id) return;
    const payload = {
      owner_id: user.id,
      name,
      is_default: false,
      created_by: currentUser || user.email || 'User',
    };
    const { data, error } = await supabase
      .from('calendar_layers')
      .insert(payload)
      .select('*')
      .single();
    if (error) {
      setShareMessage(`Could not create calendar: ${error.message}`);
      return;
    }
    const created = data || payload;
    setLayers(prev => [...prev, created]);
    setActiveLayerId(created.id);
    localStorage.setItem(`active-layer-${user.id}`, created.id);
    setNewLayerName('');
    setShowLayerModal(false);
  };

  const deleteLayerCalendar = async (layerId) => {
    const normalizedLayerId = String(layerId || '');
    if (!normalizedLayerId || !user?.id) return;
    const layer = layers.find(item => String(item.id) === normalizedLayerId);
    if (!layer || String(layer.owner_id) !== String(user.id)) return;
    const ownedCount = (layers || []).filter(item => String(item.owner_id) === String(user.id)).length;
    if (ownedCount <= 1) {
      alert('You must keep at least one calendar.');
      return;
    }
    if (!window.confirm(`Delete "${layer.name || 'this calendar'}" and all of its events, lists, shares, and trips?`)) return;

    try {
      const { data: subCalRows } = await supabase
        .from('sub_calendars')
        .select('id')
        .eq('layer_id', normalizedLayerId);
      const subCalIds = (subCalRows || []).map(row => String(row.id)).filter(Boolean);

      if (subCalIds.length > 0) {
        await supabase.from('sub_calendar_events').delete().in('sub_calendar_id', subCalIds);
        await supabase.from('sub_calendar_members').delete().in('sub_calendar_id', subCalIds);
        await supabase.from('sub_calendar_notes').delete().in('sub_calendar_id', subCalIds);
        await supabase.from('trip_photos').delete().in('sub_calendar_id', subCalIds);
      }

      await supabase.from('sub_calendars').delete().eq('layer_id', normalizedLayerId);
      await supabase.from('events').delete().eq('layer_id', normalizedLayerId);
      await supabase.from('shared_lists').delete().eq('layer_id', normalizedLayerId);
      await supabase.from('shared_list_groups').delete().eq('layer_id', normalizedLayerId);
      await supabase.from('shared_access').delete().eq('layer_id', normalizedLayerId);
      await supabase.from('calendar_layers').delete().eq('id', normalizedLayerId).eq('owner_id', user.id);

      const remainingLayers = layers.filter(item => String(item.id) !== normalizedLayerId);
      setLayers(remainingLayers);
      setSwipedLayerId(null);
      setLayerSwipeDrag({ id: null, offset: 0 });
      if (String(activeLayerId) === normalizedLayerId) {
        const nextOwned = remainingLayers.find(item => String(item.owner_id) === String(user.id));
        const fallback = nextOwned || remainingLayers[0] || null;
        const nextLayerId = fallback ? String(fallback.id) : null;
        setActiveLayerId(nextLayerId);
        if (nextLayerId) localStorage.setItem(`active-layer-${user.id}`, nextLayerId);
      }
    } catch (error) {
      console.error('Error deleting calendar layer:', error);
      alert(`Could not delete calendar: ${error.message || 'Unknown error'}`);
    }
  };

  const handleLayerSwipeStart = (e, layerId, canDelete) => {
    if (!canDelete) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    layerSwipeStartXRef.current = touch.clientX;
    swipingLayerIdRef.current = layerId;
    if (swipedLayerId && swipedLayerId !== layerId) setSwipedLayerId(null);
  };

  const handleLayerSwipeMove = (e) => {
    const layerId = swipingLayerIdRef.current;
    if (!layerId) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    const deltaX = touch.clientX - layerSwipeStartXRef.current;
    const clamped = Math.max(-88, Math.min(0, deltaX));
    setLayerSwipeDrag({ id: layerId, offset: clamped });
  };

  const handleLayerSwipeEnd = () => {
    const layerId = swipingLayerIdRef.current;
    if (!layerId) return;
    const open = layerSwipeDrag.id === layerId && layerSwipeDrag.offset <= -44;
    setSwipedLayerId(open ? layerId : null);
    setLayerSwipeDrag({ id: null, offset: 0 });
    swipingLayerIdRef.current = null;
  };

  const renameActiveLayer = async (nextName) => {
    const trimmed = String(nextName || '').trim();
    if (!trimmed || !activeLayerId || String(activeLayerOwnerId) !== String(user?.id)) {
      setCalendarTitle(activeLayer?.name || 'Our Calendar');
      return;
    }
    const { error } = await supabase
      .from('calendar_layers')
      .update({ name: trimmed })
      .eq('id', activeLayerId)
      .eq('owner_id', user.id);
    if (error) {
      console.error('Could not rename calendar layer:', error);
      setCalendarTitle(activeLayer?.name || 'Our Calendar');
      return;
    }
    setLayers(prev => prev.map(layer => String(layer.id) === String(activeLayerId) ? { ...layer, name: trimmed } : layer));
    setCalendarTitle(trimmed);
  };

  const buildEventMergeKey = (event) => {
    const title = String(event?.title || '').trim().toLowerCase();
    const date = String(event?.date || '').trim();
    const time = String(event?.time || '').trim();
    const recurrence = String(event?.recurrence || '').trim();
    const location = String(event?.location || '').trim().toLowerCase();
    return [date, time, title, recurrence, location].join('|');
  };

  const mergeLayerIntoOwnedCalendar = async (opts = {}) => {
    const sourceLayerId = String(opts.sourceLayerId || activeLayerId || '');
    const targetLayerId = String(opts.targetLayerId || mergeTargetLayerId || '');
    const isAuto = Boolean(opts.auto);
    const sourceLayer = layers.find(layer => String(layer.id) === sourceLayerId);
    if (!user?.id || !sourceLayerId || !targetLayerId) return false;
    if (String(activeLayerOwnerId) === String(user.id) && sourceLayerId === String(activeLayerId || '')) {
      if (!isAuto) setShareMessage('Switch to a shared calendar first, then run merge.');
      return false;
    }
    if (sourceLayerId === targetLayerId) {
      if (!isAuto) setShareMessage('Source and target calendars cannot be the same.');
      return false;
    }
    if (!isAuto) {
      const confirmed = window.confirm('Merge this shared calendar into your selected calendar? Existing items are preserved and duplicates are skipped.');
      if (!confirmed) return false;
    }

    setMergeInProgress(true);
    if (!isAuto) setShareMessage('');
    try {
      const targetLayer = layers.find(layer => String(layer.id) === targetLayerId);
      if (!targetLayer || String(targetLayer.owner_id) !== String(user.id)) {
        if (!isAuto) setShareMessage('Target calendar must be one of your owned calendars.');
        return false;
      }

      // Merge events
      const { data: sourceEvents, error: srcEventsErr } = await supabase
        .from('events')
        .select('*')
        .eq('layer_id', sourceLayerId);
      if (srcEventsErr) throw srcEventsErr;
      const { data: targetEvents, error: tgtEventsErr } = await supabase
        .from('events')
        .select('*')
        .eq('layer_id', targetLayerId);
      if (tgtEventsErr) throw tgtEventsErr;

      const targetEventKeys = new Set((targetEvents || []).map(buildEventMergeKey));
      const eventsToInsert = [];
      (sourceEvents || []).forEach((row, idx) => {
        const key = buildEventMergeKey(row);
        if (targetEventKeys.has(key)) return;
        targetEventKeys.add(key);
        eventsToInsert.push({
          id: `evt_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
          date: row.date,
          title: row.title,
          time: row.time,
          category: row.category || 'other',
          is_private: !!row.is_private,
          is_private_for: row.is_private_for || null,
          is_urgent: !!row.is_urgent,
          is_multi_day: !!row.is_multi_day,
          multi_day_id: row.multi_day_id || null,
          is_annual: !!row.is_annual,
          annual_month: row.annual_month || null,
          annual_day: row.annual_day || null,
          recurrence: row.recurrence || 'once',
          exceptions: row.exceptions || null,
          reactions: row.reactions || null,
          location: row.location || null,
          created_by: row.created_by || currentUser || user.email || 'User',
          created_at: row.created_at || new Date().toISOString(),
          user_id: user.id,
          layer_id: targetLayerId,
          calendar_id: targetLayerId,
        });
      });
      if (eventsToInsert.length > 0) {
        const { error: insertEventsErr } = await supabase.from('events').insert(eventsToInsert);
        if (insertEventsErr) throw insertEventsErr;
      }

      // Merge list groups
      const { data: sourceGroups, error: srcGroupsErr } = await supabase
        .from('shared_list_groups')
        .select('*')
        .eq('layer_id', sourceLayerId);
      if (srcGroupsErr) throw srcGroupsErr;
      const { data: targetGroups, error: tgtGroupsErr } = await supabase
        .from('shared_list_groups')
        .select('*')
        .eq('layer_id', targetLayerId);
      if (tgtGroupsErr) throw tgtGroupsErr;

      const existingGroupByTitle = new Map();
      (targetGroups || []).forEach(group => {
        existingGroupByTitle.set(String(group.title || '').trim().toLowerCase(), group);
      });
      const groupIdMap = {};
      for (const srcGroup of (sourceGroups || [])) {
        const titleKey = String(srcGroup.title || '').trim().toLowerCase();
        const existing = existingGroupByTitle.get(titleKey);
        if (existing) {
          groupIdMap[String(srcGroup.id)] = existing.id;
          continue;
        }
        const payload = {
          owner_id: user.id,
          layer_id: targetLayerId,
          calendar_id: targetLayerId,
          title: srcGroup.title || 'List',
          created_by: srcGroup.created_by || currentUser || user.email || 'User',
          user_id: user.id,
        };
        const { data: insertedGroup, error: insertGroupErr } = await supabase
          .from('shared_list_groups')
          .insert(payload)
          .select('*')
          .single();
        if (insertGroupErr) throw insertGroupErr;
        groupIdMap[String(srcGroup.id)] = insertedGroup.id;
        existingGroupByTitle.set(titleKey, insertedGroup);
      }

      // Merge list items
      const { data: sourceItems, error: srcItemsErr } = await supabase
        .from('shared_lists')
        .select('*')
        .eq('layer_id', sourceLayerId);
      if (srcItemsErr) throw srcItemsErr;
      const { data: targetItems, error: tgtItemsErr } = await supabase
        .from('shared_lists')
        .select('*')
        .eq('layer_id', targetLayerId);
      if (tgtItemsErr) throw tgtItemsErr;
      const targetItemKeys = new Set((targetItems || []).map(item => `${String(item.list_id)}|${String(item.text || '').trim().toLowerCase()}|${item.done ? '1' : '0'}`));
      const itemsToInsert = [];
      (sourceItems || []).forEach(item => {
        const mappedListId = groupIdMap[String(item.list_id)];
        if (!mappedListId) return;
        const itemKey = `${String(mappedListId)}|${String(item.text || '').trim().toLowerCase()}|${item.done ? '1' : '0'}`;
        if (targetItemKeys.has(itemKey)) return;
        targetItemKeys.add(itemKey);
        itemsToInsert.push({
          owner_id: user.id,
          layer_id: targetLayerId,
          calendar_id: targetLayerId,
          list_id: mappedListId,
          text: item.text || '',
          done: !!item.done,
          created_by: item.created_by || currentUser || user.email || 'User',
          user_id: user.id,
        });
      });
      if (itemsToInsert.length > 0) {
        const { error: insertItemsErr } = await supabase.from('shared_lists').insert(itemsToInsert);
        if (insertItemsErr) throw insertItemsErr;
      }

      // Merge trip sub-calendars (+ related rows)
      const { data: sourceTrips, error: srcTripsErr } = await supabase
        .from('sub_calendars')
        .select('*')
        .eq('layer_id', sourceLayerId);
      if (srcTripsErr) throw srcTripsErr;
      const { data: targetTrips, error: tgtTripsErr } = await supabase
        .from('sub_calendars')
        .select('*')
        .eq('layer_id', targetLayerId);
      if (tgtTripsErr) throw tgtTripsErr;

      const tripIdMap = {};
      const existingTripByKey = new Map();
      (targetTrips || []).forEach(trip => {
        const key = `${String(trip.name || '').trim().toLowerCase()}|${String(trip.start_date || '')}|${String(trip.end_date || '')}`;
        existingTripByKey.set(key, trip);
      });

      for (const sourceTrip of (sourceTrips || [])) {
        const tripKey = `${String(sourceTrip.name || '').trim().toLowerCase()}|${String(sourceTrip.start_date || '')}|${String(sourceTrip.end_date || '')}`;
        const existing = existingTripByKey.get(tripKey);
        if (existing) {
          tripIdMap[String(sourceTrip.id)] = String(existing.id);
          continue;
        }
        const newTrip = {
          id: `sc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: sourceTrip.name || 'Trip',
          start_date: sourceTrip.start_date,
          end_date: sourceTrip.end_date,
          created_by: sourceTrip.created_by || currentUser || user.email || 'User',
          owner_id: user.id,
          layer_id: targetLayerId,
          calendar_id: targetLayerId,
          weather_location: sourceTrip.weather_location || null,
          weather_lat: sourceTrip.weather_lat || null,
          weather_lon: sourceTrip.weather_lon || null,
        };
        const { data: insertedTrip, error: insertTripErr } = await supabase
          .from('sub_calendars')
          .insert(newTrip)
          .select('*')
          .single();
        if (insertTripErr) throw insertTripErr;
        tripIdMap[String(sourceTrip.id)] = String(insertedTrip.id);
        existingTripByKey.set(tripKey, insertedTrip);
      }

      const sourceTripIds = Object.keys(tripIdMap);
      if (sourceTripIds.length > 0) {
        const targetTripIds = Array.from(new Set(Object.values(tripIdMap)));

        const { data: sourceTripEvents, error: srcTripEventsErr } = await supabase
          .from('sub_calendar_events')
          .select('*')
          .in('sub_calendar_id', sourceTripIds);
        if (srcTripEventsErr) throw srcTripEventsErr;
        const { data: targetTripEvents, error: tgtTripEventsErr } = await supabase
          .from('sub_calendar_events')
          .select('*')
          .in('sub_calendar_id', targetTripIds);
        if (tgtTripEventsErr) throw tgtTripEventsErr;

        const tripEventKeys = new Set((targetTripEvents || []).map(ev => `${String(ev.sub_calendar_id)}|${String(ev.date || '')}|${String(ev.time || '')}|${String(ev.end_time || '')}|${String(ev.title || '').trim().toLowerCase()}|${String(ev.location || '').trim().toLowerCase()}`));
        const tripEventsToInsert = [];
        (sourceTripEvents || []).forEach((ev, idx) => {
          const mappedSubCalId = tripIdMap[String(ev.sub_calendar_id)];
          if (!mappedSubCalId) return;
          const key = `${mappedSubCalId}|${String(ev.date || '')}|${String(ev.time || '')}|${String(ev.end_time || '')}|${String(ev.title || '').trim().toLowerCase()}|${String(ev.location || '').trim().toLowerCase()}`;
          if (tripEventKeys.has(key)) return;
          tripEventKeys.add(key);
          tripEventsToInsert.push({
            id: `sce_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
            sub_calendar_id: mappedSubCalId,
            date: ev.date,
            title: ev.title || '',
            time: ev.time || null,
            end_time: ev.end_time || null,
            notes: ev.notes || null,
            category: ev.category || 'other',
            created_by: ev.created_by || currentUser || user.email || 'User',
            user_id: user.id,
            reactions: ev.reactions || null,
            location: ev.location || null,
            created_at: ev.created_at || new Date().toISOString(),
          });
        });
        if (tripEventsToInsert.length > 0) {
          const { error: insertTripEventsErr } = await supabase.from('sub_calendar_events').insert(tripEventsToInsert);
          if (insertTripEventsErr) throw insertTripEventsErr;
        }

        const { data: sourceTripMembers, error: srcTripMembersErr } = await supabase
          .from('sub_calendar_members')
          .select('*')
          .in('sub_calendar_id', sourceTripIds);
        if (srcTripMembersErr) throw srcTripMembersErr;
        const { data: targetTripMembers, error: tgtTripMembersErr } = await supabase
          .from('sub_calendar_members')
          .select('*')
          .in('sub_calendar_id', targetTripIds);
        if (tgtTripMembersErr) throw tgtTripMembersErr;
        const tripMemberKeys = new Set((targetTripMembers || []).map(m => `${String(m.sub_calendar_id)}|${String(m.email || '').trim().toLowerCase()}`));
        const tripMembersToInsert = [];
        (sourceTripMembers || []).forEach(member => {
          const mappedSubCalId = tripIdMap[String(member.sub_calendar_id)];
          if (!mappedSubCalId) return;
          const email = String(member.email || '').trim().toLowerCase();
          if (!email) return;
          const key = `${mappedSubCalId}|${email}`;
          if (tripMemberKeys.has(key)) return;
          tripMemberKeys.add(key);
          tripMembersToInsert.push({
            sub_calendar_id: mappedSubCalId,
            email,
            added_by: user.id,
          });
        });
        if (tripMembersToInsert.length > 0) {
          const { error: insertTripMembersErr } = await supabase.from('sub_calendar_members').insert(tripMembersToInsert);
          if (insertTripMembersErr) throw insertTripMembersErr;
        }

        const { data: sourceTripNotes, error: srcTripNotesErr } = await supabase
          .from('sub_calendar_notes')
          .select('*')
          .in('sub_calendar_id', sourceTripIds);
        if (srcTripNotesErr) throw srcTripNotesErr;
        const { data: targetTripNotes, error: tgtTripNotesErr } = await supabase
          .from('sub_calendar_notes')
          .select('*')
          .in('sub_calendar_id', targetTripIds);
        if (tgtTripNotesErr) throw tgtTripNotesErr;
        const tripNoteKeys = new Set((targetTripNotes || []).map(n => `${String(n.sub_calendar_id)}|${String(n.text || '')}|${String(n.checklist || '')}`));
        const tripNotesToInsert = [];
        (sourceTripNotes || []).forEach((note, idx) => {
          const mappedSubCalId = tripIdMap[String(note.sub_calendar_id)];
          if (!mappedSubCalId) return;
          const key = `${mappedSubCalId}|${String(note.text || '')}|${String(note.checklist || '')}`;
          if (tripNoteKeys.has(key)) return;
          tripNoteKeys.add(key);
          tripNotesToInsert.push({
            id: `scn_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
            sub_calendar_id: mappedSubCalId,
            text: note.text || '',
            checklist: note.checklist || JSON.stringify([]),
            created_by: note.created_by || currentUser || user.email || 'User',
            user_id: user.id,
            created_at: note.created_at || new Date().toISOString(),
          });
        });
        if (tripNotesToInsert.length > 0) {
          const { error: insertTripNotesErr } = await supabase.from('sub_calendar_notes').insert(tripNotesToInsert);
          if (insertTripNotesErr) throw insertTripNotesErr;
        }

        const { data: sourceTripPhotos, error: srcTripPhotosErr } = await supabase
          .from('trip_photos')
          .select('*')
          .in('sub_calendar_id', sourceTripIds);
        if (srcTripPhotosErr) throw srcTripPhotosErr;
        const { data: targetTripPhotos, error: tgtTripPhotosErr } = await supabase
          .from('trip_photos')
          .select('*')
          .in('sub_calendar_id', targetTripIds);
        if (tgtTripPhotosErr) throw tgtTripPhotosErr;
        const tripPhotoKeys = new Set((targetTripPhotos || []).map(p => `${String(p.sub_calendar_id)}|${String(p.url || '')}|${String(p.date || '')}|${String(p.caption || '')}`));
        const tripPhotosToInsert = [];
        (sourceTripPhotos || []).forEach((photo, idx) => {
          const mappedSubCalId = tripIdMap[String(photo.sub_calendar_id)];
          if (!mappedSubCalId) return;
          const key = `${mappedSubCalId}|${String(photo.url || '')}|${String(photo.date || '')}|${String(photo.caption || '')}`;
          if (tripPhotoKeys.has(key)) return;
          tripPhotoKeys.add(key);
          tripPhotosToInsert.push({
            id: `ph_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
            sub_calendar_id: mappedSubCalId,
            event_id: photo.event_id || null,
            date: photo.date || null,
            url: photo.url || null,
            caption: photo.caption || null,
            uploaded_by: photo.uploaded_by || currentUser || user.email || 'User',
            user_id: user.id,
            created_at: photo.created_at || new Date().toISOString(),
          });
        });
        if (tripPhotosToInsert.length > 0) {
          const { error: insertTripPhotosErr } = await supabase.from('trip_photos').insert(tripPhotosToInsert);
          if (insertTripPhotosErr) throw insertTripPhotosErr;
        }
      }

      // Merge participants / sharing
      const { data: sourceShares, error: srcSharesErr } = await supabase
        .from('shared_access')
        .select('*')
        .eq('layer_id', sourceLayerId);
      if (srcSharesErr) throw srcSharesErr;
      const participantRows = [...(sourceShares || [])];

      for (const row of participantRows) {
        const sharedWithId = row?.shared_with_id ? String(row.shared_with_id) : null;
        const sharedWithEmail = row?.shared_with_email ? String(row.shared_with_email).trim().toLowerCase() : '';
        // In this project schema, shared_with_email is NOT NULL.
        // Skip rows that do not have a valid email instead of failing the whole merge.
        if (!sharedWithEmail) continue;
        if (sharedWithId === String(user.id)) continue;
        if (sharedWithEmail && sharedWithEmail === String(user.email || '').trim().toLowerCase()) continue;
        const payload = {
          owner_id: user.id,
          layer_id: targetLayerId,
          calendar_id: targetLayerId,
          shared_with_id: sharedWithId,
          shared_with_email: sharedWithEmail,
        };
        const { error: insertShareErr } = await supabase.from('shared_access').insert(payload);
        if (
          insertShareErr &&
          !/duplicate key/i.test(String(insertShareErr.message || '')) &&
          String(insertShareErr.code || '') !== '23505'
        ) {
          throw insertShareErr;
        }
      }

      if (!isAuto) setShareMessage('✅ Merge complete. Switched to the merged calendar.');
      setActiveLayerId(targetLayerId);
      localStorage.setItem(`active-layer-${user.id}`, targetLayerId);
      setLayerRefreshToken(prev => prev + 1);
      return true;
    } catch (error) {
      console.error('Calendar merge failed:', error);
      if (!isAuto) setShareMessage(`Merge failed: ${error.message || 'Unknown error'}`);
      return false;
    } finally {
      setMergeInProgress(false);
    }
  };

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

  const saveEvents = async (newEvents, options = {}) => {
    const { immediate = false } = options;
    try {
      if (!activeLayerId || !user?.id) return;
      setEvents(newEvents);
      const requestId = ++saveRequestIdRef.current;
      const saveLayerId = activeLayerId;
      const saveUserId = user.id;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      const persist = async () => {
        try {
          if (requestId !== saveRequestIdRef.current) return;
          const myEvents = [];
          const sharedUpdates = []; // events owned by others that we've edited

          Object.entries(newEvents).forEach(([date, dateEvents]) => {
            dateEvents.forEach(event => {
              if (event.userId && event.userId !== saveUserId) {
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
                user_id: saveUserId,
                layer_id: saveLayerId,
                calendar_id: saveLayerId
              });
            });
          });

          if (requestId !== saveRequestIdRef.current) return;
          // Save own events via delete+reinsert
          const { error: deleteError } = await supabase.from('events').delete().eq('user_id', saveUserId).eq('layer_id', saveLayerId);
          if (deleteError) {
            console.error('Error deleting existing events in Supabase:', deleteError);
            return;
          }
          if (requestId !== saveRequestIdRef.current) return;
          if (myEvents.length > 0) {
            const { error } = await supabase.from('events').insert(myEvents);
            if (error) console.error('Error saving events to Supabase:', error);
          }

          // Save shared event edits via targeted UPDATE on each row
          for (const event of sharedUpdates) {
            if (requestId !== saveRequestIdRef.current) return;
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
            }).eq('id', event.id).eq('layer_id', saveLayerId);
          }
        } catch (err) {
          console.error('Error writing to Supabase:', err);
        }
      };

      if (immediate) await persist();
      else saveTimeoutRef.current = setTimeout(persist, 800);
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
    if (!shareEmailInput.trim() || !activeLayerId) return;
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
      layer_id: activeLayerId,
      calendar_id: activeLayerId,
      shared_with_email: email,
    });

    if (error) {
      setShareMessage('Error sharing calendar. Try again.');
      console.error(error);
    } else {
      setMyShares(prev => [...prev, { owner_id: user.id, layer_id: activeLayerId, shared_with_email: email }]);
      setShareEmailInput('');
      setShareMessage(`✅ Shared! When ${email} logs in they'll see your calendar.`);
    }
  };

  const handleRemoveShare = async (shareEmail) => {
    const { error } = await supabase
      .from('shared_access')
      .delete()
      .eq('owner_id', user.id)
      .eq('layer_id', activeLayerId)
      .eq('shared_with_email', shareEmail);

    if (!error) {
      setMyShares(prev => prev.filter(s => s.shared_with_email !== shareEmail));
      setShareMessage(`Removed access for ${shareEmail}.`);
    }
  };

  const primaryListOwnerId = activeLayerOwnerId;

  const loadSharedListGroups = async (ownerId) => {
    if (!ownerId || !activeLayerId) return;
    const { data, error } = await supabase
      .from('shared_list_groups')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('layer_id', activeLayerId)
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
    if (!ownerId || !listId || !activeLayerId) {
      setSharedListItems([]);
      return;
    }
    const { data, error } = await supabase
      .from('shared_lists')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('layer_id', activeLayerId)
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
    if (!title || !primaryListOwnerId || !user?.id || !activeLayerId) return;

    const payload = {
      owner_id: primaryListOwnerId,
      layer_id: activeLayerId,
      calendar_id: activeLayerId,
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
    if (!listId || !primaryListOwnerId || !activeLayerId) return;
    if (!window.confirm('Delete this list and all its items?')) return;

    const { error: itemDeleteError } = await supabase
      .from('shared_lists')
      .delete()
      .eq('owner_id', primaryListOwnerId)
      .eq('layer_id', activeLayerId)
      .eq('list_id', listId);

    if (itemDeleteError) {
      setListError(`Could not delete list items: ${itemDeleteError.message}`);
      return;
    }

    const { error: listDeleteError } = await supabase
      .from('shared_list_groups')
      .delete()
      .eq('layer_id', activeLayerId)
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

  const renameSharedList = async (listId, nextTitleRaw) => {
    if (!listId || !primaryListOwnerId || !activeLayerId) return false;
    const nextTitle = String(nextTitleRaw || '').trim();
    if (!nextTitle) {
      setListError('List name cannot be empty.');
      return false;
    }

    const { error } = await supabase
      .from('shared_list_groups')
      .update({ title: nextTitle })
      .eq('owner_id', primaryListOwnerId)
      .eq('layer_id', activeLayerId)
      .eq('id', listId);

    if (error) {
      setListError(`Could not rename list: ${error.message}`);
      return false;
    }

    setListError('');
    setSharedListGroups(prev => prev.map(g => g.id === listId ? { ...g, title: nextTitle } : g));
    return true;
  };

  const startEditingListGroup = (group) => {
    if (!group?.id) return;
    setEditingListGroupId(group.id);
    setEditingListGroupTitle(group.title || '');
  };

  const cancelEditingListGroup = () => {
    setEditingListGroupId(null);
    setEditingListGroupTitle('');
  };

  const submitEditingListGroup = async () => {
    if (!editingListGroupId) return;
    const ok = await renameSharedList(editingListGroupId, editingListGroupTitle);
    if (ok) cancelEditingListGroup();
  };

  const addSharedListItem = async () => {
    const text = newListItemText.trim();
    if (!text || !primaryListOwnerId || !selectedSharedListId || !user?.id || !activeLayerId) return;

    const payload = {
      owner_id: primaryListOwnerId,
      layer_id: activeLayerId,
      calendar_id: activeLayerId,
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
      .eq('layer_id', activeLayerId)
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
    const { data, error } = await supabase
      .from('shared_lists')
      .delete()
      .select('id')
      .eq('layer_id', activeLayerId)
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting list item:', error);
      setListError(`Could not delete item: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      setListError('Could not delete item (no rows affected). Check DB permissions.');
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
      .eq('layer_id', activeLayerId)
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
        let loadedLayers = await loadLayersForUser(userId, userEmail);
        if (!loadedLayers || loadedLayers.length === 0) {
          // Hard fallback bootstrap for new accounts if layer preload returns empty.
          const fallbackPayload = {
            owner_id: userId,
            name: 'Main Calendar',
            is_default: true,
            created_by: currentUser || userEmail || 'User',
          };
          let bootstrapOk = false;
          let bootstrapError = null;

          const bootstrapInsert = await supabase
            .from('calendar_layers')
            .insert(fallbackPayload)
            .select('*')
            .single();
          bootstrapError = bootstrapInsert.error;
          if (!bootstrapError) bootstrapOk = true;

          if (bootstrapError && /column .*is_default|schema cache/i.test(String(bootstrapError.message || ''))) {
            const { is_default, ...fallbackNoDefault } = fallbackPayload;
            const secondTry = await supabase
              .from('calendar_layers')
              .insert(fallbackNoDefault)
              .select('*')
              .single();
            bootstrapError = secondTry.error;
            if (!bootstrapError) bootstrapOk = true;
          }

          if (!bootstrapOk && bootstrapError) {
            console.error('Default calendar bootstrap failed:', bootstrapError);
          }

          loadedLayers = await loadLayersForUser(userId, userEmail);
        }

        if (!loadedLayers || loadedLayers.length === 0) {
          setLayers([]);
          setActiveLayerId(null);
          setEvents({});
          setSharedCalendars([]);
          setMyShares([]);
          setSharedListGroups([]);
          setSharedListItems([]);
          return;
        }
        const persistedLayerId = localStorage.getItem(`active-layer-${userId}`);
        const selectedLayerId = (
          activeLayerId && loadedLayers.some(layer => String(layer.id) === String(activeLayerId))
            ? activeLayerId
            : (persistedLayerId && loadedLayers.some(layer => String(layer.id) === String(persistedLayerId))
              ? persistedLayerId
              : loadedLayers[0].id)
        );
        if (selectedLayerId !== activeLayerId) setActiveLayerId(selectedLayerId);
        localStorage.setItem(`active-layer-${userId}`, selectedLayerId);

        // Load my own events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', userId)
          .eq('layer_id', selectedLayerId);

        // Load calendars shared WITH me (by email/id)
        const { data: sharedWithMeRaw } = await supabase
          .from('shared_access')
          .select('*')
          .eq('layer_id', selectedLayerId)
          .or(`shared_with_email.eq.${userEmail},shared_with_id.eq.${userId}`);
        const sharedWithMe = (sharedWithMeRaw || []).filter(s => String(s?.owner_id || '') !== String(userId));

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
          await resolveSharedOwnerLabels(sharedWithMe, selectedLayerId);

          // Load events from all owners who shared with me
          const ownerIds = Array.from(new Set(sharedWithMe.map(s => s.owner_id).filter(Boolean)));
          const { data: sharedEventsData } = await supabase
            .from('events')
            .select('*')
            .in('user_id', ownerIds)
            .eq('layer_id', selectedLayerId);

          // Merge own events + shared events
          const allEventsData = Array.from(
            new Map([...(eventsData || []), ...(sharedEventsData || [])].map(evt => [String(evt.id), evt])).values()
          );
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
          setSharedOwnerLabels({});
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
          .eq('owner_id', userId)
          .eq('layer_id', selectedLayerId);
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

        const activeLayerRow = loadedLayers.find(layer => String(layer.id) === String(selectedLayerId));
        setCalendarTitle(activeLayerRow?.name || 'Our Calendar');

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
        if (!userId || !activeLayerId) return;

        // Get calendars shared with me
        const { data: sharedDataRaw } = await supabase
          .from('shared_access')
          .select('*')
          .eq('layer_id', activeLayerId)
          .or(`shared_with_email.eq.${userEmail},shared_with_id.eq.${userId}`);
        const sharedData = (sharedDataRaw || []).filter(s => String(s?.owner_id || '') !== String(userId));

        if (!sharedData || sharedData.length === 0) return;

        const ownerIds = Array.from(new Set(sharedData.map(s => s.owner_id).filter(Boolean)));
        const { data: sharedEventsData } = await supabase
          .from('events')
          .select('*')
          .in('user_id', ownerIds)
          .eq('layer_id', activeLayerId);

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
  }, [activeLayerId, layerRefreshToken]);

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
  }, [primaryListOwnerId, activeLayerId]);

  useEffect(() => {
    if (!sharedCalendars || sharedCalendars.length === 0) return;
    resolveSharedOwnerLabels(sharedCalendars, activeLayerId);
  }, [sharedCalendars, activeLayerId]);

  useEffect(() => {
    if (!AUTO_MERGE_SHARED_LAYERS) return;
    const autoMergeMutualSharedLayers = async () => {
      if (!user?.id || mergeInProgress || !Array.isArray(layers) || layers.length === 0) return;
      const owned = layers.filter(layer => String(layer.owner_id) === String(user.id));
      const shared = layers.filter(layer => String(layer.owner_id) !== String(user.id));
      if (owned.length === 0 || shared.length === 0) return;

      const resolvedTargetId = owned.some(layer => String(layer.id) === String(mergeTargetLayerId))
        ? String(mergeTargetLayerId)
        : String(owned[0].id);
      if (!owned.some(layer => String(layer.id) === String(mergeTargetLayerId))) {
        setMergeTargetLayerId(resolvedTargetId);
      }

      for (const sharedLayer of shared) {
        const autoKey = `${String(user.id)}:${String(sharedLayer.id)}->${resolvedTargetId}`;
        if (autoMergeSeenRef.current.has(autoKey)) continue;
        autoMergeSeenRef.current.add(autoKey);
        const ok = await mergeLayerIntoOwnedCalendar({
          sourceLayerId: String(sharedLayer.id),
          targetLayerId: resolvedTargetId,
          auto: true,
        });
        if (!ok) autoMergeSeenRef.current.delete(autoKey);
      }
    };
    autoMergeMutualSharedLayers();
  }, [user?.id, layers, mergeTargetLayerId, mergeInProgress, activeLayerId]);

  useEffect(() => {
    if (!primaryListOwnerId || !selectedSharedListId) {
      setSharedListItems([]);
      return;
    }
    loadSharedListItems(primaryListOwnerId, selectedSharedListId);
  }, [primaryListOwnerId, selectedSharedListId, activeLayerId]);

  useEffect(() => {
    if (!user?.id) {
      seenInAppNotificationKeysRef.current = new Set();
      seenExpenseIdsRef.current = new Set();
      inAppSyncCursorRef.current = { events: null, subCalEvents: null, tripPhotos: null, sharedListItems: null, tripInvites: null };
      setInAppNotifications([]);
      return;
    }
    const storageKey = `in-app-notifications-${user.id}`;
    const expenseSeenKey = `in-app-seen-expenses-${user.id}`;
    const cursorKey = `in-app-notification-cursor-${user.id}`;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const normalized = Array.isArray(parsed) ? parsed.slice(0, 75).map(item => ({
        id: item.id || `ian_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        key: String(item.key || ''),
        type: item.type || 'update',
        message: item.message || '',
        createdAt: item.createdAt || new Date().toISOString(),
        read: Boolean(item.read),
      })).filter(item => item.key && item.message) : [];
      seenInAppNotificationKeysRef.current = new Set(normalized.map(item => item.key));
      setInAppNotifications(normalized);
      const cursorRaw = localStorage.getItem(cursorKey);
      const parsedCursor = cursorRaw ? JSON.parse(cursorRaw) : null;
      const seenExpensesRaw = localStorage.getItem(expenseSeenKey);
      const parsedSeenExpenses = seenExpensesRaw ? JSON.parse(seenExpensesRaw) : [];
      const fallbackTs = new Date(Date.now() - (5 * 60 * 1000)).toISOString();
      seenExpenseIdsRef.current = new Set(Array.isArray(parsedSeenExpenses) ? parsedSeenExpenses.map(v => String(v)) : []);
      inAppSyncCursorRef.current = {
        events: parsedCursor?.events || fallbackTs,
        subCalEvents: parsedCursor?.subCalEvents || fallbackTs,
        tripPhotos: parsedCursor?.tripPhotos || fallbackTs,
        sharedListItems: parsedCursor?.sharedListItems || fallbackTs,
        tripInvites: parsedCursor?.tripInvites || fallbackTs,
      };
    } catch {
      seenInAppNotificationKeysRef.current = new Set();
      seenExpenseIdsRef.current = new Set();
      const fallbackTs = new Date(Date.now() - (5 * 60 * 1000)).toISOString();
      inAppSyncCursorRef.current = { events: fallbackTs, subCalEvents: fallbackTs, tripPhotos: fallbackTs, sharedListItems: fallbackTs, tripInvites: fallbackTs };
      setInAppNotifications([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const storageKey = `in-app-notifications-${user.id}`;
    const cursorKey = `in-app-notification-cursor-${user.id}`;
    const expenseSeenKey = `in-app-seen-expenses-${user.id}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(inAppNotifications.slice(0, 75)));
      localStorage.setItem(cursorKey, JSON.stringify(inAppSyncCursorRef.current));
      localStorage.setItem(expenseSeenKey, JSON.stringify(Array.from(seenExpenseIdsRef.current).slice(-300)));
    } catch {}
  }, [user?.id, inAppNotifications]);

  useEffect(() => {
    if (!user?.id) return;
    const me = String(user.id);
    const myEmail = String(user?.email || '').trim().toLowerCase();
    const subCalIdSet = new Set((subCalendars || []).map(sc => String(sc.id)));
    const subCalNameMap = {};
    (subCalendars || []).forEach(sc => { subCalNameMap[String(sc.id)] = sc.name || 'Trip'; });
    const accessibleSubCalIdCache = new Set(subCalIdSet);
    const accessibleOwnerIdCache = new Set([me]);

    const isOwnRow = (row) => {
      const rowUserId = row?.user_id ? String(row.user_id) : '';
      const rowCreatedBy = String(row?.created_by || '').trim().toLowerCase();
      const myName = String(currentUser || '').trim().toLowerCase();
      return (rowUserId && rowUserId === me) || (rowCreatedBy && (rowCreatedBy === myEmail || rowCreatedBy === myName));
    };

    const canAccessSubCalId = async (subCalId) => {
      const normalizedId = String(subCalId || '');
      if (!normalizedId) return false;
      if (accessibleSubCalIdCache.has(normalizedId)) return true;

      const { data: memberRows, error: memberErr } = await supabase
        .from('sub_calendar_members')
        .select('sub_calendar_id')
        .eq('sub_calendar_id', normalizedId)
        .ilike('email', myEmail)
        .limit(1);
      if (!memberErr && (memberRows || []).length > 0) {
        accessibleSubCalIdCache.add(normalizedId);
        return true;
      }

      const { data: scRow, error: scErr } = await supabase
        .from('sub_calendars')
        .select('id,owner_id,layer_id')
        .eq('id', normalizedId)
        .maybeSingle();
      if (scErr || !scRow) return false;
      const ownerId = String(scRow.owner_id || '');
      const scLayerId = String(scRow.layer_id || '');
      if (ownerId === me) {
        accessibleSubCalIdCache.add(normalizedId);
        return true;
      }
      if (!ownerId) return false;

      let shareByIdQuery = supabase
        .from('shared_access')
        .select('id')
        .eq('owner_id', ownerId)
        .eq('shared_with_id', me)
        .limit(1);
      if (scLayerId) shareByIdQuery = shareByIdQuery.eq('layer_id', scLayerId);
      const { data: shareById, error: shareByIdErr } = await shareByIdQuery;
      if (!shareByIdErr && (shareById || []).length > 0) {
        accessibleSubCalIdCache.add(normalizedId);
        return true;
      }

      let shareByEmailQuery = supabase
        .from('shared_access')
        .select('id')
        .eq('owner_id', ownerId)
        .ilike('shared_with_email', myEmail)
        .limit(1);
      if (scLayerId) shareByEmailQuery = shareByEmailQuery.eq('layer_id', scLayerId);
      const { data: shareByEmail, error: shareByEmailErr } = await shareByEmailQuery;
      if (!shareByEmailErr && (shareByEmail || []).length > 0) {
        accessibleSubCalIdCache.add(normalizedId);
        return true;
      }

      return false;
    };

    const canAccessOwnerId = async (ownerIdValue) => {
      const ownerId = String(ownerIdValue || '');
      if (!ownerId) return false;
      if (accessibleOwnerIdCache.has(ownerId)) return true;

      const { data: shareById, error: shareByIdErr } = await supabase
        .from('shared_access')
        .select('id')
        .eq('owner_id', ownerId)
        .eq('shared_with_id', me)
        .limit(1);
      if (!shareByIdErr && (shareById || []).length > 0) {
        accessibleOwnerIdCache.add(ownerId);
        return true;
      }

      const { data: shareByEmail, error: shareByEmailErr } = await supabase
        .from('shared_access')
        .select('id')
        .eq('owner_id', ownerId)
        .ilike('shared_with_email', myEmail)
        .limit(1);
      if (!shareByEmailErr && (shareByEmail || []).length > 0) {
        accessibleOwnerIdCache.add(ownerId);
        return true;
      }

      return false;
    };

    const updatesChannel = supabase
      .channel(`in-app-updates-${me}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, async ({ new: row }) => {
        if (!row || isOwnRow(row)) return;
        if (!(await canAccessOwnerId(row.user_id))) return;
        const who = String(row.created_by || 'Someone');
        addInAppNotification({
          key: `events:${row.id}`,
          type: 'event',
          message: `${who} added "${row.title || 'an event'}" to the calendar.`,
          createdAt: row.created_at,
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sub_calendar_events' }, async ({ new: row }) => {
        if (!row || isOwnRow(row)) return;
        const subCalId = String(row.sub_calendar_id || '');
        if (!(await canAccessSubCalId(subCalId))) return;
        const who = String(row.created_by || 'Someone');
        const tripName = subCalNameMap[subCalId] || 'trip';
        addInAppNotification({
          key: `sub_calendar_events:${row.id}`,
          type: 'event',
          message: `${who} added "${row.title || 'an event'}" in ${tripName}.`,
          createdAt: row.created_at,
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trip_photos' }, async ({ new: row }) => {
        if (!row || isOwnRow(row)) return;
        const subCalId = String(row.sub_calendar_id || '');
        const who = String(row.uploaded_by || 'Someone');
        const tripName = subCalNameMap[subCalId] || 'trip';
        addInAppNotification({
          key: `trip_photos:${row.id}`,
          type: 'photo',
          message: `${who} added a photo in ${tripName}.`,
          createdAt: row.created_at,
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shared_lists' }, async ({ new: row }) => {
        if (!row || isOwnRow(row)) return;
        if (!(await canAccessOwnerId(row.owner_id || row.user_id))) return;
        const who = String(row.created_by || 'Someone');
        const itemText = String(row.text || '').trim();
        const preview = itemText.length > 42 ? `${itemText.slice(0, 42)}...` : itemText;
        addInAppNotification({
          key: `shared_lists:${row.id}`,
          type: 'list',
          message: `${who} added "${preview || 'a list item'}" to the list.`,
          createdAt: row.created_at,
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sub_calendar_members' }, async ({ new: row }) => {
        if (!row) return;
        const inviteEmail = String(row.email || '').trim().toLowerCase();
        if (!inviteEmail || inviteEmail !== myEmail) return;
        if (String(row.added_by || '') === me) return;
        const subCalId = String(row.sub_calendar_id || '');
        if (!subCalId) return;
        const tripName = subCalNameMap[subCalId] || 'a trip';
        addInAppNotification({
          key: `trip_invite:${subCalId}:${inviteEmail}`,
          type: 'invite',
          message: `You were invited to ${tripName}.`,
          createdAt: row.created_at || new Date().toISOString(),
        });
      })
      .subscribe();

    return () => {
      updatesChannel.unsubscribe();
    };
  }, [user?.id, user?.email, currentUser, subCalendars]);

  useEffect(() => {
    if (!user?.id) return;
    const me = String(user.id);
    const myEmail = String(user?.email || '').trim().toLowerCase();
    const myName = String(currentUser || '').trim().toLowerCase();
    const subCalIdSet = new Set((subCalendars || []).map(sc => String(sc.id)));
    const subCalNameMap = {};
    (subCalendars || []).forEach(sc => { subCalNameMap[String(sc.id)] = sc.name || 'Trip'; });

    const isOwnRow = (row) => {
      const rowUserId = row?.user_id ? String(row.user_id) : '';
      const rowCreatedBy = String(row?.created_by || '').trim().toLowerCase();
      return (rowUserId && rowUserId === me) || (rowCreatedBy && (rowCreatedBy === myEmail || rowCreatedBy === myName));
    };

    const updateCursor = (key, rows) => {
      if (!Array.isArray(rows) || rows.length === 0) return;
      const maxCreatedAt = rows.reduce((max, row) => {
        const ts = String(row?.created_at || '');
        if (!ts) return max;
        return !max || ts > max ? ts : max;
      }, inAppSyncCursorRef.current[key] || null);
      if (maxCreatedAt) inAppSyncCursorRef.current[key] = maxCreatedAt;
    };

    const getCursor = (key) => inAppSyncCursorRef.current[key] || new Date(Date.now() - (5 * 60 * 1000)).toISOString();

    const notifySharedEvents = (rows) => {
      (rows || []).forEach(row => {
        if (isOwnRow(row)) return;
        const who = String(row.created_by || 'Someone');
        addInAppNotification({
          key: `events:${row.id}`,
          type: 'event',
          message: `${who} added "${row.title || 'an event'}" to the calendar.`,
          createdAt: row.created_at,
        });
      });
    };

    const notifySharedListItems = (rows) => {
      (rows || []).forEach(row => {
        if (isOwnRow(row)) return;
        const who = String(row.created_by || 'Someone');
        const itemText = String(row.text || '').trim();
        const preview = itemText.length > 42 ? `${itemText.slice(0, 42)}...` : itemText;
        addInAppNotification({
          key: `shared_lists:${row.id}`,
          type: 'list',
          message: `${who} added "${preview || 'a list item'}" to the list.`,
          createdAt: row.created_at,
        });
      });
    };

    const notifySubCalEvents = (rows) => {
      (rows || []).forEach(row => {
        if (isOwnRow(row)) return;
        const subCalId = String(row.sub_calendar_id || '');
        const who = String(row.created_by || 'Someone');
        addInAppNotification({
          key: `sub_calendar_events:${row.id}`,
          type: 'event',
          message: `${who} added "${row.title || 'an event'}" in ${subCalNameMap[subCalId] || 'trip'}.`,
          createdAt: row.created_at,
        });
      });
    };

    const notifyExpenseNotes = (notes) => {
      (notes || []).forEach(note => {
        let parsed = [];
        try {
          parsed = note?.checklist ? JSON.parse(note.checklist) : [];
        } catch {
          parsed = [];
        }
        if (!Array.isArray(parsed)) return;
        parsed.forEach(item => {
          const expenseId = String(item?.id || '');
          if (!expenseId) return;
          const expenseKey = `${note.sub_calendar_id}:${expenseId}`;
          if (seenExpenseIdsRef.current.has(expenseKey)) return;
          seenExpenseIdsRef.current.add(expenseKey);
          const payerKey = normalizeIdentityKey(item?.payer);
          const mineEmailKey = normalizeIdentityKey(user?.email);
          const mineNameKey = normalizeIdentityKey(currentUser);
          if (payerKey && (payerKey === mineEmailKey || payerKey === mineNameKey)) return;
          const amount = Number(item?.amount);
          const amountLabel = Number.isFinite(amount) ? `$${amount.toFixed(2)}` : 'an amount';
          const desc = String(item?.description || 'an expense');
          const preview = desc.length > 38 ? `${desc.slice(0, 38)}...` : desc;
          const tripName = subCalNameMap[String(note.sub_calendar_id)] || 'trip';
          addInAppNotification({
            key: `expense:${expenseKey}`,
            type: 'expense',
            message: `${getExpenseDisplayName(item?.payer)} added ${amountLabel} for "${preview}" in ${tripName}.`,
            createdAt: item?.createdAt || note?.created_at,
          });
        });
      });
    };

    const notifyTripPhotos = (rows) => {
      const uniqueRows = Array.from(new Map((rows || []).map(row => [String(row.id), row])).values());
      uniqueRows.forEach(row => {
        if (isOwnRow(row)) return;
        const subCalId = String(row.sub_calendar_id || '');
        const who = String(row.uploaded_by || 'Someone');
        addInAppNotification({
          key: `trip_photos:${row.id}`,
          type: 'photo',
          message: `${who} added a photo in ${subCalNameMap[subCalId] || 'trip'}.`,
          createdAt: row.created_at,
        });
      });
    };

    const notifyTripInvites = (rows) => {
      (rows || []).forEach(row => {
        const inviteEmail = String(row?.email || '').trim().toLowerCase();
        if (!inviteEmail || inviteEmail !== myEmail) return;
        if (String(row?.added_by || '') === me) return;
        const subCalId = String(row?.sub_calendar_id || '');
        if (!subCalId) return;
        const tripName = String(row?.sub_calendar_name || subCalNameMap[subCalId] || 'a trip');
        addInAppNotification({
          key: `trip_invite:${subCalId}:${inviteEmail}`,
          type: 'invite',
          message: `You were invited to ${tripName}.`,
          createdAt: row?.created_at || new Date().toISOString(),
        });
      });
    };

    const getAccessibleSubCalIds = async () => {
      const ids = new Set(Array.from(subCalIdSet));

      const { data: ownedRows, error: ownedErr } = await supabase
        .from('sub_calendars')
        .select('id')
        .eq('owner_id', me);
      if (!ownedErr) (ownedRows || []).forEach(r => { if (r?.id) ids.add(String(r.id)); });

      const { data: memberRows, error: memberErr } = await supabase
        .from('sub_calendar_members')
        .select('sub_calendar_id')
        .ilike('email', myEmail);
      if (!memberErr) (memberRows || []).forEach(r => { if (r?.sub_calendar_id) ids.add(String(r.sub_calendar_id)); });

      const { data: sharesById, error: sharesByIdErr } = await supabase
        .from('shared_access')
        .select('owner_id')
        .eq('shared_with_id', me);
      const { data: sharesByEmail, error: sharesByEmailErr } = await supabase
        .from('shared_access')
        .select('owner_id')
        .ilike('shared_with_email', myEmail);

      const ownerIds = new Set();
      if (!sharesByIdErr) (sharesById || []).forEach(s => { if (s?.owner_id) ownerIds.add(String(s.owner_id)); });
      if (!sharesByEmailErr) (sharesByEmail || []).forEach(s => { if (s?.owner_id) ownerIds.add(String(s.owner_id)); });

      if (ownerIds.size > 0) {
        const { data: sharedOwnerSubCals, error: sharedOwnerErr } = await supabase
          .from('sub_calendars')
          .select('id')
          .in('owner_id', Array.from(ownerIds));
        if (!sharedOwnerErr) (sharedOwnerSubCals || []).forEach(r => { if (r?.id) ids.add(String(r.id)); });
      }

      return Array.from(ids);
    };

    const pollInAppUpdates = async () => {
      try {
        const { data: sharedData } = await supabase
          .from('shared_access')
          .select('owner_id')
          .or(`shared_with_email.eq.${user.email},shared_with_id.eq.${user.id}`);
        const ownerIds = Array.from(new Set((sharedData || []).map(s => String(s.owner_id || '')).filter(Boolean)));

        if (ownerIds.length > 0) {
          const { data: sharedEvents } = await supabase
            .from('events')
            .select('id,title,created_by,user_id,created_at')
            .in('user_id', ownerIds)
            .gt('created_at', getCursor('events'))
            .order('created_at', { ascending: true })
            .limit(200);
          notifySharedEvents(sharedEvents);
          updateCursor('events', sharedEvents);

          const { data: sharedListItems } = await supabase
            .from('shared_lists')
            .select('id,text,created_by,user_id,created_at')
            .in('owner_id', ownerIds)
            .gt('created_at', getCursor('sharedListItems'))
            .order('created_at', { ascending: true })
            .limit(200);
          notifySharedListItems(sharedListItems);
          updateCursor('sharedListItems', sharedListItems);
        }

        const subCalIds = await getAccessibleSubCalIds();
        if (subCalIds.length > 0) {
          const { data: subCalEvents } = await supabase
            .from('sub_calendar_events')
            .select('id,title,created_by,user_id,sub_calendar_id,created_at')
            .in('sub_calendar_id', subCalIds)
            .gt('created_at', getCursor('subCalEvents'))
            .order('created_at', { ascending: true })
            .limit(200);
          notifySubCalEvents(subCalEvents);
          updateCursor('subCalEvents', subCalEvents);

          const { data: expenseLedgerNotes } = await supabase
            .from('sub_calendar_notes')
            .select('id,sub_calendar_id,checklist,created_at')
            .eq('text', EXPENSE_LEDGER_NOTE_TEXT)
            .in('sub_calendar_id', subCalIds)
            .limit(200);
          notifyExpenseNotes(expenseLedgerNotes);
        }

        const buildTripPhotoQuery = () => {
          const base = supabase
            .from('trip_photos')
            .select('id,uploaded_by,user_id,sub_calendar_id,created_at');
          return subCalIds.length > 0 ? base.in('sub_calendar_id', subCalIds) : base;
        };
        const { data: datedTripPhotoRows, error: datedTripPhotoError } = await buildTripPhotoQuery()
          .gt('created_at', getCursor('tripPhotos'))
          .order('created_at', { ascending: true })
          .limit(200);
        if (datedTripPhotoError) {
          console.error('trip_photos dated poll failed:', datedTripPhotoError);
        }
        const { data: nullTripPhotoRows, error: nullTripPhotoError } = await buildTripPhotoQuery()
          .is('created_at', null)
          .limit(200);
        if (nullTripPhotoError) {
          console.error('trip_photos null-created_at poll failed:', nullTripPhotoError);
        }
        notifyTripPhotos([...(datedTripPhotoRows || []), ...(nullTripPhotoRows || [])]);
        updateCursor('tripPhotos', datedTripPhotoRows);

        const { data: datedInviteRows, error: inviteErr } = await supabase
          .from('sub_calendar_members')
          .select('sub_calendar_id,email,added_by,invited_at,accepted_at')
          .ilike('email', myEmail)
          .or(`invited_at.gt.${getCursor('tripInvites')},accepted_at.gt.${getCursor('tripInvites')}`)
          .order('invited_at', { ascending: true, nullsFirst: false })
          .limit(200);
        if (inviteErr) {
          console.error('sub_calendar_members invite poll failed:', inviteErr);
        }
        const { data: nullInviteRows, error: nullInviteErr } = await supabase
          .from('sub_calendar_members')
          .select('sub_calendar_id,email,added_by,invited_at,accepted_at')
          .ilike('email', myEmail)
          .is('invited_at', null)
          .limit(200);
        if (nullInviteErr) {
          console.error('sub_calendar_members null-invited_at invite poll failed:', nullInviteErr);
        }
        const inviteRows = Array.from(new Map([...(datedInviteRows || []), ...(nullInviteRows || [])].map(row => [`${String(row?.sub_calendar_id || '')}|${String(row?.email || '').toLowerCase()}`, row])).values());
        if (inviteRows.length > 0) {
          const inviteTripIds = Array.from(new Set(inviteRows.map(row => String(row?.sub_calendar_id || '')).filter(Boolean)));
          const inviteNameMap = {};
          if (inviteTripIds.length > 0) {
            const { data: inviteTrips, error: inviteTripsErr } = await supabase
              .from('sub_calendars')
              .select('id,name')
              .in('id', inviteTripIds);
            if (inviteTripsErr) {
              console.error('sub_calendars invite name fetch failed:', inviteTripsErr);
            } else {
              (inviteTrips || []).forEach(trip => {
                inviteNameMap[String(trip.id)] = trip.name || 'trip';
              });
            }
          }
          const inviteRowsWithNames = inviteRows.map(row => ({
            ...row,
            sub_calendar_name: inviteNameMap[String(row?.sub_calendar_id || '')] || subCalNameMap[String(row?.sub_calendar_id || '')] || 'trip',
          }));
          notifyTripInvites(inviteRowsWithNames);
          updateCursor('tripInvites', datedInviteRows);
        }
      } catch (err) {
        console.error('In-app notification sync failed:', err);
      }
    };

    pollInAppUpdates();
    const interval = setInterval(pollInAppUpdates, 60 * 1000);
    window.addEventListener('focus', pollInAppUpdates);
    const onVisible = () => {
      if (document.visibilityState === 'visible') pollInAppUpdates();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', pollInAppUpdates);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user?.id, user?.email, currentUser, subCalendars]);

  // Invite notifications must work even when no active layer is selected yet.
  useEffect(() => {
    if (!user?.id || !user?.email) return;
    const me = String(user.id);
    const myEmail = String(user.email).trim().toLowerCase();

    const notifyInvites = async (rows) => {
        const inviteRows = (rows || []).filter(row => {
          const inviteEmail = String(row?.email || '').trim().toLowerCase();
          if (!inviteEmail || inviteEmail !== myEmail) return false;
          if (String(row?.added_by || '') === me) return false;
          return Boolean(row?.sub_calendar_id);
      });
      if (inviteRows.length === 0) return;

      const subIds = Array.from(new Set(inviteRows.map(row => String(row.sub_calendar_id))));
      let nameMap = {};
      if (subIds.length > 0) {
        const { data: tripRows } = await supabase
          .from('sub_calendars')
          .select('id,name')
          .in('id', subIds);
        (tripRows || []).forEach(trip => {
          nameMap[String(trip.id)] = trip.name || 'a trip';
        });
      }

        inviteRows.forEach(row => {
          const subCalId = String(row.sub_calendar_id);
          const stamp = String(row?.invited_at || row?.accepted_at || '');
          const inviteKey = `trip_invite:${subCalId}:${myEmail}:${stamp}`;
          addInAppNotification({
            key: inviteKey,
            type: 'invite',
            message: `You were invited to ${nameMap[subCalId] || 'a trip'}.`,
            createdAt: row.invited_at || row.accepted_at || new Date().toISOString(),
          });
        });
      };

    const pollInviteRows = async () => {
      try {
        const cursor = inAppSyncCursorRef.current.tripInvites || new Date(Date.now() - (5 * 60 * 1000)).toISOString();
        const { data: datedRows } = await supabase
          .from('sub_calendar_members')
          .select('sub_calendar_id,email,added_by,accepted_at,invited_at')
          .ilike('email', myEmail)
          .or(`accepted_at.gt.${cursor},invited_at.gt.${cursor}`)
          .order('invited_at', { ascending: true, nullsFirst: false })
          .limit(200);
        const { data: nullRows } = await supabase
          .from('sub_calendar_members')
          .select('sub_calendar_id,email,added_by,accepted_at,invited_at')
          .ilike('email', myEmail)
          .is('invited_at', null)
          .limit(200);
        const merged = Array.from(new Map([...(datedRows || []), ...(nullRows || [])].map(row => [`${String(row?.sub_calendar_id || '')}|${String(row?.email || '').toLowerCase()}`, row])).values());
        await notifyInvites(merged);

        if (Array.isArray(datedRows) && datedRows.length > 0) {
          const maxCreatedAt = datedRows.reduce((max, row) => {
            const ts = String(row?.invited_at || row?.accepted_at || '');
            if (!ts) return max;
            return !max || ts > max ? ts : max;
          }, inAppSyncCursorRef.current.tripInvites || null);
          if (maxCreatedAt) inAppSyncCursorRef.current.tripInvites = maxCreatedAt;
        }
      } catch (err) {
        console.error('Invite notification poll failed:', err);
      }
    };

    const inviteChannel = supabase
      .channel(`invite-updates-${me}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sub_calendar_members' }, async ({ new: row }) => {
        if (!row) return;
        await notifyInvites([row]);
      })
      .subscribe();

    pollInviteRows();
    const interval = setInterval(pollInviteRows, 60 * 1000);
    window.addEventListener('focus', pollInviteRows);
    const onVisible = () => {
      if (document.visibilityState === 'visible') pollInviteRows();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', pollInviteRows);
      document.removeEventListener('visibilitychange', onVisible);
      inviteChannel.unsubscribe();
    };
  }, [user?.id, user?.email]);

  const loadPendingTripInvites = async () => {
    const myEmail = String(user?.email || '').trim().toLowerCase();
    if (!myEmail) {
      setPendingTripInvites([]);
      return;
    }
    try {
      let rows = [];
      const pendingResult = await supabase
        .from('sub_calendar_members')
        .select('sub_calendar_id,email,added_by,status,invited_at,accepted_at')
        .ilike('email', myEmail)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false, nullsFirst: false })
        .limit(200);
      if (!pendingResult.error) {
        rows = pendingResult.data || [];
      } else {
        const fallback = await supabase
          .from('sub_calendar_members')
          .select('sub_calendar_id,email,added_by,status,invited_at,accepted_at')
          .ilike('email', myEmail)
          .order('invited_at', { ascending: false, nullsFirst: false })
          .limit(200);
        if (fallback.error) {
          console.error('loadPendingTripInvites failed:', fallback.error);
          setPendingTripInvites([]);
          return;
        }
        rows = (fallback.data || []).filter((row) => {
          const status = String(row?.status || 'pending').toLowerCase();
          return status !== 'accepted' && status !== 'declined';
        });
      }
      const subCalIds = Array.from(new Set(rows.map(r => String(r?.sub_calendar_id || '')).filter(Boolean)));
      if (subCalIds.length === 0) {
        setPendingTripInvites([]);
        return;
      }
      const { data: tripRows, error: tripErr } = await supabase
        .from('sub_calendars')
        .select('id,name,layer_id,owner_id,start_date,end_date')
        .in('id', subCalIds);
      if (tripErr) {
        console.error('loadPendingTripInvites trip lookup failed:', tripErr);
      }
      const tripMap = new Map((tripRows || []).map(t => [String(t.id), t]));
      const pending = rows
        .map((row) => {
          const subCalId = String(row?.sub_calendar_id || '');
          const trip = tripMap.get(subCalId) || null;
          return {
            subCalendarId: subCalId,
            tripName: trip?.name || 'Trip Invite',
            layerId: String(trip?.layer_id || ''),
            ownerId: String(trip?.owner_id || row?.added_by || ''),
            startDate: trip?.start_date || null,
            endDate: trip?.end_date || null,
            invitedAt: row.invited_at || row.accepted_at || null,
            email: String(row.email || myEmail).toLowerCase(),
          };
        })
        .filter(Boolean);
      setPendingTripInvites(pending);
    } catch (err) {
      console.error('loadPendingTripInvites exception:', err);
      setPendingTripInvites([]);
    }
  };

  const acceptTripInvite = async (invite) => {
    if (!invite || !user?.id || !user?.email) return;
    const myEmail = String(user.email).trim().toLowerCase();
    try {
      const { error: updateErr } = await supabase
        .from('sub_calendar_members')
        .update({ status: 'accepted' })
        .eq('sub_calendar_id', invite.subCalendarId)
        .ilike('email', myEmail);
      if (updateErr) {
        alert(`Accept failed: ${updateErr.message || 'Could not update invite status.'}`);
        return;
      }

      let tripRow = null;
      const { data: tripData, error: tripErr } = await supabase
        .from('sub_calendars')
        .select('*')
        .eq('id', invite.subCalendarId)
        .maybeSingle();
      if (tripErr) {
        console.error('Accept invite trip load failed:', tripErr);
      } else if (tripData) {
        tripRow = tripData;
      }

      if (!tripRow) {
        const refreshed = await loadSubCalendars();
        tripRow = (refreshed || []).find(sc => String(sc?.id || '') === String(invite.subCalendarId || '')) || null;
      }

      if (!tripRow) {
        tripRow = pendingTripInvites.find(sc => String(sc?.subCalendarId || '') === String(invite.subCalendarId || '')) || null;
      }

      if (!tripRow && invite?.subCalendarId) {
        const fallbackDate = getDateKey(new Date());
        tripRow = {
          id: invite.subCalendarId,
          name: invite.tripName || 'Trip',
          start_date: invite.startDate || fallbackDate,
          end_date: invite.endDate || invite.startDate || fallbackDate,
          layer_id: invite.layerId || null,
          owner_id: invite.ownerId || null,
        };
      }

      if (tripRow) {
        const openTarget = {
          ...tripRow,
          id: tripRow.id || invite.subCalendarId,
          start_date: tripRow.start_date || tripRow.startDate,
          end_date: tripRow.end_date || tripRow.endDate || tripRow.start_date || tripRow.startDate,
          name: tripRow.name || tripRow.tripName || 'Trip',
        };
        setSubCalendars(prev => {
          const existing = new Map((prev || []).map(sc => [String(sc.id), sc]));
          existing.set(String(openTarget.id), openTarget);
          return Array.from(existing.values());
        });
        await openSubCalendar(openTarget);
        setBottomNavTab('home');
        setShowNotificationSettings(false);
      } else {
        setBottomNavTab('active');
        setShowNotificationSettings(false);
      }

      setPendingTripInvites(prev => prev.filter(item => item.subCalendarId !== invite.subCalendarId));
      setLayerRefreshToken(prev => prev + 1);
    } catch (err) {
      alert(`Accept failed: ${err.message || 'Unknown error'}`);
    }
  };

  const declineTripInvite = async (invite) => {
    if (!invite || !user?.email) return;
    const myEmail = String(user.email).trim().toLowerCase();
    try {
      const { error: updateErr } = await supabase
        .from('sub_calendar_members')
        .update({ status: 'declined' })
        .eq('sub_calendar_id', invite.subCalendarId)
        .ilike('email', myEmail);
      if (updateErr) {
        alert(`Decline failed: ${updateErr.message || 'Could not update invite status.'}`);
        return;
      }
      setPendingTripInvites(prev => prev.filter(item => item.subCalendarId !== invite.subCalendarId));
    } catch (err) {
      alert(`Decline failed: ${err.message || 'Unknown error'}`);
    }
  };

  useEffect(() => {
    if (!user?.email) {
      setPendingTripInvites([]);
      return;
    }
    loadPendingTripInvites();
    const interval = setInterval(loadPendingTripInvites, 60 * 1000);
    const onFocus = () => loadPendingTripInvites();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.email, user?.id, layerRefreshToken]);

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

  const addInAppNotification = ({ key, type, message, createdAt }) => {
    if (!key || !message) return;
    const normalizedKey = String(key);
    if (seenInAppNotificationKeysRef.current.has(normalizedKey)) return;
    seenInAppNotificationKeysRef.current.add(normalizedKey);
    setInAppNotifications(prev => {
      if (prev.some(n => n.key === normalizedKey)) return prev;
      const next = [{
        id: `ian_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        key: normalizedKey,
        type: type || 'update',
        message,
        createdAt: createdAt || new Date().toISOString(),
        read: false,
      }, ...prev];
      return next.slice(0, 75);
    });
  };

  const parseInviteNotification = (item) => {
    const key = String(item?.key || '');
    if (!key.startsWith('trip_invite:')) return null;
    const parts = key.split(':');
    if (parts.length < 3) return null;
    const subCalendarId = String(parts[1] || '').trim();
    const email = String(parts[2] || '').trim().toLowerCase();
    if (!subCalendarId || !email) return null;
    return { subCalendarId, email };
  };

  const markInAppNotificationRead = (notificationId) => {
    setInAppNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  const deleteInAppNotification = (notificationId) => {
    setInAppNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const markAllInAppNotificationsRead = () => {
    setInAppNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearReadInAppNotifications = () => {
    setInAppNotifications(prev => prev.filter(n => !n.read));
  };

  const sendTestNotification = () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications.');
      return;
    }
    if (Notification.permission !== 'granted') {
      alert('Notification permission is not granted.');
      return;
    }
    new Notification('Test notification', {
      body: `Notifications are working at ${new Date().toLocaleTimeString()}.`,
      tag: 'notification-test',
    });
  };

  const getEventDateTime = (dateKey, timeValue) => {
    if (!dateKey || typeof dateKey !== 'string') return null;
    const [yy, mm, dd] = dateKey.split('-').map(Number);
    if (!yy || !mm || !dd) return null;
    if (timeValue && /^\d{2}:\d{2}$/.test(timeValue)) {
      const [hh, min] = timeValue.split(':').map(Number);
      return new Date(yy, mm - 1, dd, hh || 0, min || 0, 0, 0);
    }
    // All-day events notify relative to morning instead of midnight.
    return new Date(yy, mm - 1, dd, 9, 0, 0, 0);
  };

  const readSmartLeaveMap = () => {
    try {
      const raw = localStorage.getItem('smart-leave-sent-map');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const writeSmartLeaveMap = (map) => {
    try {
      localStorage.setItem('smart-leave-sent-map', JSON.stringify(map));
    } catch {}
  };

  const getCurrentPositionForSmartLeave = async () => {
    const cached = smartLeavePositionRef.current;
    const now = Date.now();
    if (cached.lat && cached.lng && (now - cached.at) < 60 * 1000) {
      return { lat: cached.lat, lng: cached.lng };
    }
    if (!navigator?.geolocation) return null;
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 7000,
          maximumAge: 60 * 1000,
        });
      });
      const lat = position?.coords?.latitude;
      const lng = position?.coords?.longitude;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      smartLeavePositionRef.current = { at: now, lat, lng };
      return { lat, lng };
    } catch {
      return null;
    }
  };

  const geocodeDestinationForSmartLeave = async (destination) => {
    const key = String(destination || '').trim().toLowerCase();
    if (!key) return null;
    if (smartLeaveGeoCacheRef.current.has(key)) return smartLeaveGeoCacheRef.current.get(key);

    const googleGeo = await geocodeDestination(destination);
    if (googleGeo?.lat && googleGeo?.lng) {
      smartLeaveGeoCacheRef.current.set(key, googleGeo);
      return googleGeo;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`);
      const data = await res.json();
      const first = Array.isArray(data) ? data[0] : null;
      const lat = first ? Number(first.lat) : null;
      const lng = first ? Number(first.lon) : null;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const fallback = { lat, lng, formattedAddress: first.display_name || destination };
      smartLeaveGeoCacheRef.current.set(key, fallback);
      return fallback;
    } catch {
      return null;
    }
  };

  const estimateDriveTimeMs = async (fromLat, fromLng, toLat, toLng) => {
    const cacheKey = `${fromLat.toFixed(3)},${fromLng.toFixed(3)}=>${toLat.toFixed(3)},${toLng.toFixed(3)}`;
    const cached = smartLeaveTravelCacheRef.current.get(cacheKey);
    if (cached && (Date.now() - cached.at) < 5 * 60 * 1000) return cached.ms;

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
      const res = await fetch(url);
      const data = await res.json();
      const seconds = data?.routes?.[0]?.duration;
      if (!Number.isFinite(seconds) || seconds <= 0) return null;
      const ms = Math.round(seconds * 1000);
      smartLeaveTravelCacheRef.current.set(cacheKey, { at: Date.now(), ms });
      return ms;
    } catch {
      return null;
    }
  };

  const openGoogleNavigation = (destination) => {
    const encoded = encodeURIComponent(String(destination || '').trim());
    if (!encoded) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const dismissSmartLeavePrompt = () => {
    setSmartLeavePrompt(null);
  };

  const snoozeSmartLeavePrompt = (minutes = 5) => {
    if (!smartLeavePrompt?.id) {
      setSmartLeavePrompt(null);
      return;
    }
    const map = readSmartLeaveMap();
    const snooze = map.__snooze || {};
    snooze[smartLeavePrompt.id] = Date.now() + (minutes * 60 * 1000);
    delete map[smartLeavePrompt.id];
    map.__snooze = snooze;
    writeSmartLeaveMap(map);
    setSmartLeavePrompt(null);
  };

  const handleSmartLeaveNavigate = () => {
    if (!smartLeavePrompt?.destination) return;
    openGoogleNavigation(smartLeavePrompt.destination);
    setSmartLeavePrompt(null);
  };

  const handleSmartLeaveRideOptions = () => {
    if (!smartLeavePrompt?.destination) return;
    openLocationActionChooser(smartLeavePrompt.destination);
    setSmartLeavePrompt(null);
  };

  // Check for upcoming events and send notifications
  useEffect(() => {
    if (!notificationsEnabled) return;
    if (!notifyOneWeek && !notifyOneDay && !notifyOneHour && !notifyAtEventTime) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

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

          const eventDateTime = getEventDateTime(dateKey, event.time);
          if (!eventDateTime || Number.isNaN(eventDateTime.getTime())) return;

          const timeDiff = eventDateTime.getTime() - now.getTime();
          const graceMs = 5 * 60 * 1000;

          const urgentPrefix = event.isUrgent ? 'URGENT: ' : '';
          const windows = [
            { enabled: notifyOneWeek, leadMs: 7 * 24 * 60 * 60 * 1000, key: 'week', title: `${urgentPrefix}Event in 1 Week` },
            { enabled: notifyOneDay, leadMs: 24 * 60 * 60 * 1000, key: 'day', title: `${urgentPrefix}Event in 1 Day` },
            { enabled: notifyOneHour, leadMs: 60 * 60 * 1000, key: 'hour', title: `${urgentPrefix}Event in 1 Hour` },
            { enabled: notifyAtEventTime, leadMs: 0, key: 'at-time', title: `${urgentPrefix}Event Starting` },
          ];

          windows.forEach(windowDef => {
            if (!windowDef.enabled) return;
            if (timeDiff > windowDef.leadMs) return;
            if (timeDiff < -graceMs) return;

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
    const interval = setInterval(checkNotifications, 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkNotifications();
    };
    window.addEventListener('focus', checkNotifications);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkNotifications);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [events, notificationsEnabled, showPrivateEvents, onlyNotifyUrgent, notifyOneWeek, notifyOneDay, notifyOneHour, notifyAtEventTime]);

  // Smart leave assistant: estimate travel time and prompt a few minutes before leaving.
  useEffect(() => {
    if (!notificationsEnabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const checkSmartLeave = async () => {
      const now = new Date();
      const sentMap = readSmartLeaveMap();
      const snoozeMap = sentMap.__snooze || {};
      const ownCandidates = [];

      Object.entries(events).forEach(([dateKey, dateEvents]) => {
        dateEvents.forEach(event => {
          if (!event?.time || !event?.location) return;
          if (event.isPrivate && showPrivateEvents === false) return;
          if (onlyNotifyUrgent && !event.isUrgent) return;
          const eventDateTime = getEventDateTime(dateKey, event.time);
          if (!eventDateTime || Number.isNaN(eventDateTime.getTime())) return;
          const diffMs = eventDateTime.getTime() - now.getTime();
          if (diffMs < -15 * 60 * 1000) return;
          if (diffMs > 6 * 60 * 60 * 1000) return;
          ownCandidates.push({ dateKey, event, eventDateTime });
        });
      });

      ownCandidates.sort((a, b) => a.eventDateTime.getTime() - b.eventDateTime.getTime());
      for (const candidate of ownCandidates.slice(0, 3)) {
        const sentKey = `${candidate.event.id}-${candidate.dateKey}-smart-leave`;
        const snoozeUntil = Number(snoozeMap[sentKey] || 0);
        if (sentMap[sentKey]) continue;
        if (snoozeUntil && Date.now() < snoozeUntil) continue;

        const currentPos = await getCurrentPositionForSmartLeave();
        if (!currentPos) return;
        const destinationGeo = await geocodeDestinationForSmartLeave(candidate.event.location);
        if (!destinationGeo) continue;
        const travelMs = await estimateDriveTimeMs(currentPos.lat, currentPos.lng, destinationGeo.lat, destinationGeo.lng);
        if (!travelMs) continue;

        const leaveAtMs = candidate.eventDateTime.getTime() - travelMs - (5 * 60 * 1000);
        const deltaToLeaveMs = leaveAtMs - now.getTime();
        const graceMs = 4 * 60 * 1000;
        if (deltaToLeaveMs > 0 || deltaToLeaveMs < -graceMs) continue;

        const minutes = Math.max(1, Math.round(travelMs / 60000));
        new Notification('Time to leave soon', {
          body: `${candidate.event.title}: ~${minutes} min to ${candidate.event.location}.`,
          tag: sentKey,
        });
        setSmartLeavePrompt({
          id: sentKey,
          title: candidate.event.title,
          destination: candidate.event.location,
          eventTime: candidate.eventDateTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          travelMinutes: minutes,
        });
        sentMap[sentKey] = true;
        writeSmartLeaveMap(sentMap);
        break;
      }
    };

    checkSmartLeave();
    const interval = setInterval(checkSmartLeave, 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkSmartLeave();
    };
    window.addEventListener('focus', checkSmartLeave);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkSmartLeave);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [events, notificationsEnabled, showPrivateEvents, onlyNotifyUrgent]);
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
        const atTimeResult = await window.storage.get('notification-window-at-time', false);
        if (atTimeResult && atTimeResult.value === 'false') setNotifyAtEventTime(false);
      } catch (error) {
        console.log('No notification preference found');
      }
    };
    loadNotificationPreference();
  }, []);

  // Live location sharing within active sub-calendar (opt-in only)
  useEffect(() => {
    const clearGeoWatch = () => {
      if (subCalGeoWatchRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(subCalGeoWatchRef.current);
        subCalGeoWatchRef.current = null;
      }
    };

    if (!activeSubCalendar) {
      clearGeoWatch();
      setMemberLocations({});
      return;
    }

    const todayKey = getDateKey(new Date());
    const sharingWindowOpen = todayKey >= activeSubCalendar.start_date && todayKey <= activeSubCalendar.end_date;
    const identity = String(user?.id || user?.email || currentUser || `guest-${Date.now()}`);
    const displayName = currentUser || user?.email || 'Member';

    let cancelled = false;
    const channel = supabase.channel(`subcal-live-location-${activeSubCalendar.id}`, {
      config: { presence: { key: identity } },
    });
    subCalLocationChannelRef.current = channel;

    const publishPassivePresence = async () => {
      try {
        await channel.track({
          userId: identity,
          name: displayName,
          email: user?.email || null,
          sharing: false,
          updatedAt: new Date().toISOString(),
        });
      } catch {}
    };

    const startOrUpdateSharing = async () => {
      clearGeoWatch();
      if (!shareMyLocation || !sharingWindowOpen || !navigator?.geolocation) {
        await publishPassivePresence();
        return;
      }
      subCalGeoWatchRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          if (cancelled) return;
          try {
            await channel.track({
              userId: identity,
              name: displayName,
              email: user?.email || null,
              sharing: true,
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy || 0),
              updatedAt: new Date().toISOString(),
            });
          } catch (err) {
            console.error('Location presence update failed:', err);
          }
        },
        async (err) => {
          console.error('Geolocation watch failed:', err);
          await publishPassivePresence();
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    };

    channel.on('presence', { event: 'sync' }, () => {
      if (cancelled) return;
      const state = channel.presenceState();
      const flattened = {};
      Object.values(state || {}).forEach((entries) => {
        (entries || []).forEach((entry) => {
          if (!entry?.userId) return;
          flattened[entry.userId] = entry;
        });
      });
      setMemberLocations(flattened);
    });

    channel.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED' || cancelled) return;
      await startOrUpdateSharing();
    });

    return () => {
      cancelled = true;
      clearGeoWatch();
      setMemberLocations({});
      channel.untrack().catch(() => {});
      channel.unsubscribe();
      if (subCalLocationChannelRef.current === channel) subCalLocationChannelRef.current = null;
    };
  }, [activeSubCalendar?.id, shareMyLocation, currentUser, user?.id, user?.email]);

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

  const parseScannedDate = (rawText) => {
    const text = String(rawText || '');
    const now = new Date();

    const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
    if (numeric) {
      const month = Number(numeric[1]);
      const day = Number(numeric[2]);
      const yearRaw = numeric[3];
      let year = yearRaw ? Number(yearRaw) : now.getFullYear();
      if (year < 100) year += 2000;
      const d = new Date(year, month - 1, day);
      if (!Number.isNaN(d.getTime())) return d;
    }

    const monthName = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/i);
    if (monthName) {
      const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
      const key = monthName[1].slice(0, 3).toLowerCase();
      const month = monthMap[key];
      const day = Number(monthName[2]);
      const year = monthName[3] ? Number(monthName[3]) : now.getFullYear();
      const d = new Date(year, month, day);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return null;
  };

  const parseScannedTime = (rawText) => {
    const text = String(rawText || '');
    const ampm = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (ampm) {
      let h = Number(ampm[1]);
      const m = Number(ampm[2] || '0');
      const period = String(ampm[3] || '').toLowerCase();
      if (period === 'pm' && h < 12) h += 12;
      if (period === 'am' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    const hhmm = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (hhmm) return `${String(Number(hhmm[1])).padStart(2, '0')}:${hhmm[2]}`;
    return '';
  };

  const parseScannedLocation = (rawText) => {
    const lines = String(rawText || '').split('\n').map(line => line.trim()).filter(Boolean);
    const withPin = lines.find(line => /^(📍|@)\s*/.test(line));
    if (withPin) return withPin.replace(/^(📍|@)\s*/, '').trim();
    const addressLike = lines.find(line => /\b(st|street|ave|avenue|rd|road|blvd|boulevard|suite|ste|clinic|hospital)\b/i.test(line));
    return addressLike || '';
  };

  const parseScannedTitle = (rawText) => {
    const lines = String(rawText || '').split('\n').map(line => line.trim()).filter(Boolean);
    const candidate = lines.find(line => {
      if (line.length < 3) return false;
      if (/^\d/.test(line)) return false;
      if (/\b(am|pm)\b/i.test(line)) return false;
      if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line)) return false;
      return true;
    });
    return candidate || 'Appointment';
  };

  const handleScanReminder = async (file) => {
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) {
      return;
    }
    setIsScanningReminder(true);
    try {
      const tesseract = await import('tesseract.js');
      let text = '';
      if (typeof tesseract.recognize === 'function') {
        const result = await tesseract.recognize(file, 'eng');
        text = String(result?.data?.text || '');
      } else if (typeof tesseract.createWorker === 'function') {
        const worker = await tesseract.createWorker('eng');
        const result = await worker.recognize(file);
        text = String(result?.data?.text || '');
        await worker.terminate();
      }

      if (!text.trim()) {
        return;
      }

      const parsedDate = parseScannedDate(text) || new Date();
      const parsedTime = parseScannedTime(text);
      const parsedTitle = parseScannedTitle(text);
      const parsedLocation = parseScannedLocation(text);
      const fullTitle = parsedLocation ? `${parsedTitle} @ ${parsedLocation}` : parsedTitle;

      setSelectedDate(parsedDate);
      setSelectedDates([parsedDate]);
      setQuickEntry(fullTitle);
      setPendingEvent({ title: fullTitle, datesToAdd: [parsedDate], isMultiDay: false });
      setSuggestedTime(parsedTime || '');
      setShowTimePrompt(true);
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setIsScanningReminder(false);
    }
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
    setRecurrence('once');
    setSuggestedTime('');
    setShowTimePrompt(false);
    setPendingEvent(null);
  };

  const deleteEventsByIds = async (eventIds) => {
    const ids = Array.from(new Set((eventIds || []).map(id => String(id)).filter(Boolean)));
    if (!activeLayerId || ids.length === 0) return true;
    const { data, error } = await supabase
      .from('events')
      .delete()
      .select('id')
      .in('id', ids)
      .eq('layer_id', activeLayerId);
    if (error) {
      console.error('Error deleting events:', error);
      alert(`Could not delete event(s): ${error.message}`);
      return false;
    }
    const deletedIds = new Set((data || []).map(row => String(row.id)));
    if (deletedIds.size === 0 || ids.some(id => !deletedIds.has(String(id)))) {
      const missing = ids.filter(id => !deletedIds.has(String(id)));
      alert(`Delete blocked by permissions or ownership. Missing IDs: ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleDeleteEvent = async (dateKey, eventId, isVirtualAnnual = false, isVirtualRecurrence = false, skipOnce = false) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    // Invalidate any in-flight save that may write stale pre-delete state.
    saveRequestIdRef.current += 1;

    const actualDateKey = Object.keys(events).find(k => events[k]?.some(e => e.id === eventId)) || dateKey;
    const eventToDelete = events[actualDateKey]?.find(e => e.id === eventId);

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
        const { error } = await supabase
          .from('events')
          .update({ exceptions: JSON.stringify(updatedExceptions) })
          .eq('id', eventId)
          .eq('layer_id', activeLayerId);
        if (error) {
          console.error('Error updating recurrence exceptions:', error);
          alert(`Could not update recurring event: ${error.message}`);
          return;
        }
        setEvents(prev => ({
          ...prev,
          [originalDateKey]: (prev[originalDateKey] || []).map(e =>
            e.id === eventId ? { ...e, exceptions: updatedExceptions } : e
          )
        }));
      } else {
        // Delete the whole recurring event
        const ok = await deleteEventsByIds([eventId]);
        if (!ok) return;
        const updatedEvents = { ...events, [originalDateKey]: (events[originalDateKey] || []).filter(e => e.id !== eventId) };
        if (updatedEvents[originalDateKey].length === 0) delete updatedEvents[originalDateKey];
        setEvents(updatedEvents);
      }
      return;
    }

    if (eventToDelete?.isMultiDay && eventToDelete.multiDayId) {
      const updatedEvents = { ...events };
      const idsToDelete = [];
      Object.keys(updatedEvents).forEach(key => {
        idsToDelete.push(...updatedEvents[key].filter(e => e.multiDayId === eventToDelete.multiDayId).map(e => e.id));
        updatedEvents[key] = updatedEvents[key].filter(e => e.multiDayId !== eventToDelete.multiDayId);
        if (updatedEvents[key].length === 0) delete updatedEvents[key];
      });
      const ok = await deleteEventsByIds(idsToDelete);
      if (!ok) return;
      setEvents(updatedEvents);
    } else {
      const updatedEvents = { ...events, [actualDateKey]: (events[actualDateKey] || []).filter(e => e.id !== eventId) };
      if (updatedEvents[actualDateKey].length === 0) delete updatedEvents[actualDateKey];
      const ok = await deleteEventsByIds([eventId]);
      if (!ok) return;
      setEvents(updatedEvents);
    }
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
  const activeTrips = [...subCalendars]
    .filter(sc => {
      const startTs = toDateOnlyTs(getSubCalStartRaw(sc));
      const endTs = toDateOnlyTs(getSubCalEndRaw(sc));
      return startTs !== null && endTs !== null && todayTs >= startTs && todayTs <= endTs;
    })
    .sort((a, b) => toDateOnlyTs(getSubCalStartRaw(a)) - toDateOnlyTs(getSubCalStartRaw(b)));
  const archivedTrips = [...subCalendars]
    .filter(sc => {
      const endTs = toDateOnlyTs(getSubCalEndRaw(sc));
      return endTs !== null && endTs < todayTs;
    })
    .sort((a, b) => toDateOnlyTs(getSubCalEndRaw(b)) - toDateOnlyTs(getSubCalEndRaw(a)));
  const ownedLayerCalendars = layers.filter(layer => String(layer.owner_id) === String(user?.id));

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
              defaultValue={suggestedTime || ''}
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
                setSuggestedTime('');
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

  const unreadInAppCount = inAppNotifications.reduce((sum, n) => sum + (n.read ? 0 : 1), 0);
  const readInAppCount = inAppNotifications.reduce((sum, n) => sum + (n.read ? 1 : 0), 0);
  const selectedSharedListGroup = sharedListGroups.find(group => group.id === selectedSharedListId) || null;
  const incompleteSharedListItems = sharedListItems.filter(item => !item.done);
  const completedSharedListItems = sharedListItems.filter(item => item.done);
  const totalSharedListItems = sharedListItems.length;
  const completedSharedListCount = completedSharedListItems.length;

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
                      await renameActiveLayer(calendarTitle);
                    }}
                    onKeyPress={async (e) => {
                      if (e.key === 'Enter') {
                        setIsEditingTitle(false);
                        await renameActiveLayer(calendarTitle);
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
                className={`relative p-2 rounded-xl transition-all duration-200 ${notificationsEnabled ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                title={notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
              >
                {notificationsEnabled ? <Bell className="w-4 h-4 sm:w-5 sm:h-5" /> : <BellOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                {unreadInAppCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] leading-none font-bold flex items-center justify-center">
                    {unreadInAppCount > 99 ? '99+' : unreadInAppCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowListPanel(!showListPanel)}
                className={`px-3 py-2 rounded-xl transition-all duration-200 text-xs font-semibold ${showListPanel ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                title="Shared list"
              >
                List
              </button>
              <button
                onClick={() => setShowScanHelpModal(true)}
                disabled={isScanningReminder}
                className={`p-2 rounded-xl transition-all duration-200 ${isScanningReminder ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Scan document"
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <input
                ref={scanReminderInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleScanReminder(file);
                  e.target.value = '';
                }}
              />
              <input
                ref={scanReminderUploadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleScanReminder(file);
                  e.target.value = '';
                }}
              />
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
              {pendingTripInvites.length > 0 && (
                <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-5 h-5 text-violet-600" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Trip Invites</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-violet-500 text-white text-[10px] font-bold">{pendingTripInvites.length}</span>
                  </div>
                  <div className="space-y-2">
                    {pendingTripInvites.map(invite => (
                      <div key={`${invite.subCalendarId}-${invite.email}`} className="rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-gray-800 p-2.5">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{invite.tripName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTripDate(invite.startDate)} - {formatTripDate(invite.endDate, true)}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => acceptTripInvite(invite)}
                            className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-violet-500 hover:bg-violet-600 text-white"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => declineTripInvite(invite)}
                            className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">In-App Updates</span>
                    {unreadInAppCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{unreadInAppCount}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={markAllInAppNotificationsRead}
                      disabled={unreadInAppCount === 0}
                      className="px-2 py-1 rounded-md text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Mark all read
                    </button>
                    <button
                      onClick={clearReadInAppNotifications}
                      disabled={readInAppCount === 0}
                      className="px-2 py-1 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Clear read
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {inAppNotifications.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">No updates yet.</p>
                  ) : (
                    inAppNotifications.map(item => (
                      <button
                        key={item.id}
                        onClick={() => markInAppNotificationRead(item.id)}
                        className={`w-full text-left rounded-lg border px-2.5 py-2 transition-colors ${item.read ? 'bg-white/70 dark:bg-gray-800 border-indigo-100 dark:border-indigo-800' : 'bg-white dark:bg-gray-800 border-indigo-300 dark:border-indigo-600'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs ${item.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100 font-medium'}`}>{item.message}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {!item.read && <span className="w-2 h-2 rounded-full bg-red-500 mt-1" />}
                            {item.read && (
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteInAppNotification(item.id); }}
                                className="text-gray-400 hover:text-red-500 text-xs leading-none"
                                title="Remove notification"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                        {item.type === 'invite' && (() => {
                          const parsedInvite = parseInviteNotification(item);
                          if (!parsedInvite) return null;
                          const pendingInvite = pendingTripInvites.find(
                            inv => String(inv?.subCalendarId || '') === String(parsedInvite.subCalendarId || '')
                          );
                          return (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  acceptTripInvite(pendingInvite || {
                                    subCalendarId: parsedInvite.subCalendarId,
                                    email: parsedInvite.email,
                                    tripName: 'Trip Invite',
                                  });
                                  markInAppNotificationRead(item.id);
                                }}
                                className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-violet-500 hover:bg-violet-600 text-white"
                              >
                                Accept
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  declineTripInvite(pendingInvite || {
                                    subCalendarId: parsedInvite.subCalendarId,
                                    email: parsedInvite.email,
                                  });
                                  markInAppNotificationRead(item.id);
                                }}
                                className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                              >
                                Decline
                              </button>
                            </div>
                          );
                        })()}
                      </button>
                    ))
                  )}
                </div>
              </div>
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
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">At Event Time</span>
                  <button
                    onClick={() => toggleNotificationWindow('notification-window-at-time', notifyAtEventTime, setNotifyAtEventTime)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifyAtEventTime ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifyAtEventTime ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">Quick Test</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Send a test notification right now.</p>
                  </div>
                  <button
                    onClick={sendTestNotification}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    Send Test
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
                      <span className="text-sm text-gray-700 dark:text-gray-300">Shared by <strong>{sharedOwnerLabels[String(share.owner_id || '')] || fallbackOwnerLabel(share.owner_id)}</strong></span>
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

            <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-2">
              {sharedListGroups.map(group => (
                editingListGroupId === group.id ? (
                  <div key={group.id} className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full border border-purple-300 bg-white dark:bg-gray-700 dark:border-purple-700">
                    <input
                      autoFocus
                      value={editingListGroupTitle}
                      onChange={(e) => setEditingListGroupTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitEditingListGroup();
                        if (e.key === 'Escape') cancelEditingListGroup();
                      }}
                      onBlur={submitEditingListGroup}
                      className="w-36 px-2 py-1 text-xs border border-purple-200 dark:border-purple-600 rounded-md bg-white dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={submitEditingListGroup}
                      className="px-2 py-1 text-[11px] rounded-md bg-purple-600 text-white"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedSharedListId(group.id);
                      cancelEditingListGroup();
                    }}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selectedSharedListId === group.id
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {group.title}
                  </button>
                )
              ))}
              <button
                onClick={() => {
                  const selected = sharedListGroups.find(group => group.id === selectedSharedListId);
                  if (selected) startEditingListGroup(selected);
                }}
                disabled={!selectedSharedListId}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 disabled:opacity-50"
                title="Rename selected list"
              >
                Rename
              </button>
              <button
                onClick={() => deleteSharedList(selectedSharedListId)}
                disabled={!selectedSharedListId}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 disabled:opacity-50"
                title="Delete selected list"
              >
                Delete
              </button>
            </div>
            {selectedSharedListGroup && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 px-1">
                {selectedSharedListGroup.title}: {totalSharedListItems} item{totalSharedListItems === 1 ? '' : 's'} · {completedSharedListCount} done
              </p>
            )}

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
                disabled={!selectedSharedListId || !newListItemText.trim()}
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
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">Create a list above, then add items below.</p>
              )}
              {sharedListGroups.length > 0 && !selectedSharedListId && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">Pick a list to start adding items.</p>
              )}
              {selectedSharedListId && totalSharedListItems === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No items yet. Add your first one above.</p>
              )}
              {incompleteSharedListItems.map(item => (
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
              {completedSharedListItems.length > 0 && (
                <div className="pt-2">
                  <div className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Completed ({completedSharedListItems.length})
                  </div>
                  <div className="space-y-1.5">
                    {completedSharedListItems.map(item => (
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
                  {active.map(sc => {
                    const canDelete = sc.owner_id === user?.id;
                    const rowOffset = tripSwipeDrag.id === sc.id ? tripSwipeDrag.offset : (swipedTripId === sc.id ? -88 : 0);
                    const isDeleteRevealed = rowOffset < 0;
                    return (
                      <div key={sc.id} className="relative rounded-xl overflow-hidden ring-1 ring-inset ring-green-300 dark:ring-green-700">
                        {canDelete && (
                          <div className={`absolute inset-y-0 right-0 w-[88px] flex items-center justify-center transition-colors ${isDeleteRevealed ? 'bg-red-500' : 'bg-transparent'}`}>
                            <button
                              onClick={() => deleteSubCalendar(sc.id)}
                              className={`w-full h-full text-sm font-semibold transition-opacity ${isDeleteRevealed ? 'text-white opacity-100' : 'text-transparent opacity-0 pointer-events-none'}`}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        <div
                          onTouchStart={(e) => handleTripSwipeStart(e, sc.id, canDelete)}
                          onTouchMove={handleTripSwipeMove}
                          onTouchEnd={handleTripSwipeEnd}
                          onTouchCancel={handleTripSwipeEnd}
                          onClick={() => openSubCalendar(sc)}
                          className="relative z-10 w-full flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 hover:shadow-md transition-all text-left cursor-pointer"
                          style={{ transform: `translateX(${rowOffset}px)`, transition: tripSwipeDrag.id === sc.id ? 'none' : 'transform 180ms ease' }}
                        >
                          <span className="text-xl">🗓️</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-green-800 dark:text-green-300">{sc.name}</div>
                            <div className="text-xs text-green-600 dark:text-green-400">
                              Happening now · {new Date(sc.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(sc.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium shrink-0">Open →</span>
                        </div>
                      </div>
                    );
                  })}
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

                  const subTripsOnDate = dateTs === null
                    ? []
                    : subCalendars.filter(sc => {
                        const startTs = toDateOnlyTs(getSubCalStartRaw(sc));
                        const endTs = toDateOnlyTs(getSubCalEndRaw(sc));
                        return startTs !== null && endTs !== null && dateTs >= startTs && dateTs <= endTs;
                      });
                  const hasSubCalendarRange = subTripsOnDate.length > 0;
                  const hasSecondarySubCalendarRange = subTripsOnDate.length > 1;

                  return (
                    <div key={index} className="relative">
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
                        {hasSubCalendarRange && (
                          <div
                            className="absolute top-0 left-0.5 right-0.5 h-1 rounded-b bg-gradient-to-r from-emerald-300 to-green-500 opacity-90"
                            title={`${subTripsOnDate.length} sub-calendar range${subTripsOnDate.length > 1 ? 's' : ''}`}
                          />
                        )}
                        {hasSecondarySubCalendarRange && (
                          <div
                            className="absolute top-1.5 right-0.5 bottom-1.5 w-1 rounded-l bg-gradient-to-b from-cyan-300 to-blue-500 opacity-90"
                            title="Additional overlapping multi-day range"
                          />
                        )}
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
                  const hasSubCalendarRange = subTripsOnDate.length > 0;
                  const hasSecondarySubCalendarRange = subTripsOnDate.length > 1;

                  return (
                    <div
                      key={index}
                      onClick={() => handleDateTap(date)}
                      className={`
                        min-h-24 rounded-lg p-1.5 cursor-pointer transition-all duration-200 flex flex-col gap-1 relative
                        ${isSelected ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg ring-2 ring-purple-300' : ''}
                        ${!isSelected && isTodayDate ? 'bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-900/50 dark:to-purple-900/50 ring-2 ring-purple-400' : ''}
                        ${!isSelected && !isTodayDate ? 'bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-gray-600' : ''}
                        ${hasUrgentEvent && !isSelected ? 'ring-2 ring-red-500' : ''}
                      `}
                      >
                      {hasSubCalendarRange && (
                        <div
                          className={`absolute top-0 left-1 right-1 h-1 rounded-b ${isSelected ? 'bg-white/70' : 'bg-gradient-to-r from-emerald-300 to-green-500 opacity-90'}`}
                          title={`${subTripsOnDate.length} sub-calendar range${subTripsOnDate.length > 1 ? 's' : ''}`}
                        />
                      )}
                      {hasSecondarySubCalendarRange && (
                        <div
                          className={`absolute top-1.5 right-0.5 bottom-1.5 w-1 rounded-l ${isSelected ? 'bg-white/60' : 'bg-gradient-to-b from-cyan-300 to-blue-500 opacity-90'}`}
                          title="Additional overlapping multi-day range"
                        />
                      )}
                      {/* Date number */}
                      <div className={`text-xs font-bold mb-1 ${isSelected ? 'text-white' : isTodayDate ? 'text-purple-700 dark:text-purple-200' : 'text-gray-700 dark:text-gray-200'}`}>
                        {date.getDate()}
                        {hasHoliday && <span className="ml-1">🇺🇸</span>}
                      </div>

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
                              <button
                                type="button"
                                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 mb-1"
                                onClick={(e) => handleLocationLinkClick(e, event.location)}
                              >
                                📍 {event.location}
                              </button>
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

          </div>
          </div>

          )}

          {bottomNavTab !== 'home' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6">

            {bottomNavTab === 'active' && (
              <>
                <div className="mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3">Calendars</h3>
                  {layers.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No calendars found.</div>
                  ) : (
                    <div className="space-y-2">
                      {ownedLayerCalendars.map(layer => {
                        const isActiveLayer = String(layer.id) === String(activeLayerId);
                        const canDeleteLayer = ownedLayerCalendars.length > 1;
                        const layerRowOffset = layerSwipeDrag.id === layer.id ? layerSwipeDrag.offset : (swipedLayerId === layer.id ? -88 : 0);
                        const isLayerDeleteRevealed = layerRowOffset < 0;
                        return (
                          <div key={layer.id} className="relative rounded-xl overflow-hidden">
                            {canDeleteLayer && (
                              <div className={`absolute inset-y-0 right-0 w-[88px] flex items-center justify-center transition-colors ${isLayerDeleteRevealed ? 'bg-red-500' : 'bg-transparent'}`}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteLayerCalendar(layer.id);
                                  }}
                                  className={`w-full h-full text-sm font-semibold transition-opacity ${isLayerDeleteRevealed ? 'text-white opacity-100' : 'text-transparent opacity-0 pointer-events-none'}`}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                            <button
                              onTouchStart={(e) => handleLayerSwipeStart(e, layer.id, canDeleteLayer)}
                              onTouchMove={handleLayerSwipeMove}
                              onTouchEnd={handleLayerSwipeEnd}
                              onTouchCancel={handleLayerSwipeEnd}
                              onClick={() => {
                                setActiveLayerId(layer.id);
                                if (user?.id) localStorage.setItem(`active-layer-${user.id}`, layer.id);
                                setBottomNavTab('home');
                                setShowDateDetailModal(false);
                              }}
                              className={`relative z-10 w-full text-left p-3 rounded-xl border transition-all ${isActiveLayer ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300'}`}
                              style={{ transform: `translateX(${layerRowOffset}px)`, transition: layerSwipeDrag.id === layer.id ? 'none' : 'transform 180ms ease' }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{layer.name || 'Calendar'}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    Owned by you
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {isActiveLayer && <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-indigo-500 text-white">Active</span>}
                                  {canDeleteLayer && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteLayerCalendar(layer.id);
                                      }}
                                      className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-medium"
                                      title="Delete calendar"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button
                    onClick={() => setShowLayerModal(true)}
                    className="mt-3 w-full px-3 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold"
                  >
                    + New Calendar
                  </button>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-wide font-semibold text-purple-600 dark:text-purple-400 mb-2">Upcoming Itineraries</h4>
                  {upcomingTrips.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No upcoming itineraries yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {upcomingTrips.map(sc => {
                      const canDelete = sc.owner_id === user?.id;
                      const rowOffset = tripSwipeDrag.id === sc.id ? tripSwipeDrag.offset : (swipedTripId === sc.id ? -88 : 0);
                      const isDeleteRevealed = rowOffset < 0;
                      return (
                        <div key={sc.id} className="relative rounded-xl overflow-hidden ring-1 ring-inset ring-purple-200 dark:ring-purple-700">
                          {canDelete && (
                            <div className={`absolute inset-y-0 right-0 w-[88px] flex items-center justify-center transition-colors ${isDeleteRevealed ? 'bg-red-500' : 'bg-transparent'}`}>
                              <button
                                onClick={() => deleteSubCalendar(sc.id)}
                                className={`w-full h-full text-sm font-semibold transition-opacity ${isDeleteRevealed ? 'text-white opacity-100' : 'text-transparent opacity-0 pointer-events-none'}`}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                          <div
                            onTouchStart={(e) => handleTripSwipeStart(e, sc.id, canDelete)}
                            onTouchMove={handleTripSwipeMove}
                            onTouchEnd={handleTripSwipeEnd}
                            onTouchCancel={handleTripSwipeEnd}
                            className="relative z-10 flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20"
                            style={{ transform: `translateX(${rowOffset}px)`, transition: tripSwipeDrag.id === sc.id ? 'none' : 'transform 180ms ease' }}
                          >
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
                        </div>
                      );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {bottomNavTab === 'archived' && (
              <>
                <h3 className="text-lg sm:text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3">Archived Trips</h3>
                {archivedTrips.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No archived trips yet.</div>
                ) : (
                  <div className="space-y-2">
                    {archivedTrips.map(sc => {
                      const canDelete = sc.owner_id === user?.id;
                      const rowOffset = tripSwipeDrag.id === sc.id ? tripSwipeDrag.offset : (swipedTripId === sc.id ? -88 : 0);
                      const isDeleteRevealed = rowOffset < 0;
                      return (
                        <div key={sc.id} className="relative rounded-xl overflow-hidden ring-1 ring-inset ring-gray-200 dark:ring-gray-700">
                          {canDelete && (
                            <div className={`absolute inset-y-0 right-0 w-[88px] flex items-center justify-center transition-colors ${isDeleteRevealed ? 'bg-red-500' : 'bg-transparent'}`}>
                              <button
                                onClick={() => deleteSubCalendar(sc.id)}
                                className={`w-full h-full text-sm font-semibold transition-opacity ${isDeleteRevealed ? 'text-white opacity-100' : 'text-transparent opacity-0 pointer-events-none'}`}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                          <div
                            onTouchStart={(e) => handleTripSwipeStart(e, sc.id, canDelete)}
                            onTouchMove={handleTripSwipeMove}
                            onTouchEnd={handleTripSwipeEnd}
                            onTouchCancel={handleTripSwipeEnd}
                            className="relative z-10 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/40"
                            style={{ transform: `translateX(${rowOffset}px)`, transition: tripSwipeDrag.id === sc.id ? 'none' : 'transform 180ms ease' }}
                          >
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
                        </div>
                      );
                    })}
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
                setBottomNavTab('active');
                setShowDateDetailModal(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${bottomNavTab === 'active' ? 'bg-purple-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              Active
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

    {showLayerModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">New Calendar</h3>
            <button onClick={() => setShowLayerModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <input
            type="text"
            value={newLayerName}
            onChange={e => setNewLayerName(e.target.value)}
            placeholder="e.g. Work, Friends, Family"
            className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl mb-4 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            autoFocus
            onKeyPress={e => e.key === 'Enter' && createLayerCalendar()}
          />
          <button
            onClick={createLayerCalendar}
            className="w-full py-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl font-medium"
          >
            Create Calendar
          </button>
        </div>
      </div>
    )}

    {showScanHelpModal && (
      <div
        className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"
        onClick={() => setShowScanHelpModal(false)}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Scan Appointment</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Take or upload a photo of your appointment/reminder card and we will try to auto-fill the event title, date, and time.
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Tip: keep the text clear and include the date/time in the photo.
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowScanHelpModal(false)}
              className="flex-1 px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowScanHelpModal(false);
                scanReminderInputRef.current?.click();
              }}
              className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-sm font-semibold"
            >
              Take Photo
            </button>
            <button
              onClick={() => {
                setShowScanHelpModal(false);
                scanReminderUploadInputRef.current?.click();
              }}
              className="flex-1 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-gray-700 border border-indigo-200 dark:border-gray-600 text-indigo-600 dark:text-gray-200 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-gray-600"
            >
              Upload Photo
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

        {/* Members (quick access near top) */}
        <div className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
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
                {activeSubCalendar.owner_id === user?.id && m.removable !== false && (
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

        {/* Location sharing quick controls (mobile-friendly placement) */}
        {(() => {
          const todayKey = getDateKey(new Date());
          const sharingWindowOpen = todayKey >= activeSubCalendar.start_date && todayKey <= activeSubCalendar.end_date;
          const liveLocations = Object.values(memberLocations).filter(
            loc => loc?.sharing && typeof loc?.lat === 'number' && typeof loc?.lon === 'number'
          );
          return (
            <div className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">📍 Live Location</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {sharingWindowOpen ? `${liveLocations.length} member${liveLocations.length === 1 ? '' : 's'} sharing now` : 'Available only during trip dates'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const next = !shareMyLocation;
                    setShareMyLocation(next);
                    localStorage.setItem('subcal-share-location', next.toString());
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shareMyLocation && sharingWindowOpen ? 'bg-green-500' : 'bg-gray-300'}`}
                  title="Share my location with trip members"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${shareMyLocation && sharingWindowOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          );
        })()}

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
          <button
            onClick={() => setSubCalTab('expenses')}
            className={`flex-1 py-2.5 text-sm font-medium transition-all border-b-2 ${subCalTab === 'expenses' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >💸 Expenses</button>
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
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl border border-yellow-300 dark:border-yellow-700">
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
                      className={`bg-yellow-50 dark:bg-gray-700 rounded-lg border border-yellow-300 dark:border-yellow-700 overflow-hidden transition-opacity ${draggedNoteId === note.id ? 'opacity-40' : 'opacity-100'}`}
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
                        <div className="px-3 pb-2.5 space-y-1.5 border-t border-yellow-200 dark:border-yellow-800 pt-2">
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
                  const slotEvents = dayEvents.filter(e => {
                    if (!e.time) return false;
                    // Handle midnight wrap (23:00 -> 00:00) correctly.
                    if (nextHour <= hour) return e.time >= timeStr || e.time < nextStr;
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
                                    <button
                                      type="button"
                                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 mt-0.5"
                                      onClick={(e) => handleLocationLinkClick(e, event.location)}
                                    >📍 {event.location}</button>
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

              {/* Live location details */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {(() => {
                  const todayKey = getDateKey(new Date());
                  const sharingWindowOpen = todayKey >= activeSubCalendar.start_date && todayKey <= activeSubCalendar.end_date;
                  const liveLocations = Object.values(memberLocations).filter(loc => loc?.sharing && typeof loc?.lat === 'number' && typeof loc?.lon === 'number');
                  return (
                    <div className="mt-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">Live Location Sharing</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            {sharingWindowOpen ? 'Shared only during this trip window.' : 'Trip is not active today; location stays off.'}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const next = !shareMyLocation;
                            setShareMyLocation(next);
                            localStorage.setItem('subcal-share-location', next.toString());
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shareMyLocation && sharingWindowOpen ? 'bg-green-500' : 'bg-gray-300'}`}
                          title="Share my location with members"
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${shareMyLocation && sharingWindowOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      {liveLocations.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {liveLocations.map((loc, idx) => (
                            <a
                              key={`${loc.userId}-${idx}`}
                              href={`https://www.google.com/maps?q=${loc.lat},${loc.lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-green-300"
                            >
                              <span className="text-gray-700 dark:text-gray-200 truncate">📍 {loc.name || loc.email || loc.userId}</span>
                              <span className="text-gray-400 dark:text-gray-500 ml-2 shrink-0">Open</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })()}

        {/* Expenses tab */}
        {subCalTab === 'expenses' && (() => {
          const expenseParticipants = getExpenseParticipants();
          const selectedPayer = newExpenseDraft.payer || expenseParticipants[0] || '';

          const paidByCents = {};
          expenseParticipants.forEach(name => { paidByCents[name] = 0; });
          subCalExpenses.forEach(item => {
            const payer = String(item.payer || '').trim();
            if (!payer) return;
            const cents = Math.round((Number(item.amount) || 0) * 100);
            if (!Number.isFinite(cents) || cents <= 0) return;
            if (typeof paidByCents[payer] !== 'number') paidByCents[payer] = 0;
            paidByCents[payer] += cents;
          });

          const totalCents = Object.values(paidByCents).reduce((sum, cents) => sum + cents, 0);
          const sortedParticipants = [...expenseParticipants].sort((a, b) => a.localeCompare(b));
          const memberCount = sortedParticipants.length || 1;
          const baseShare = Math.floor(totalCents / memberCount);
          const extraPennies = totalCents - (baseShare * memberCount);

          const shareByCents = {};
          sortedParticipants.forEach((name, idx) => {
            shareByCents[name] = baseShare + (idx < extraPennies ? 1 : 0);
          });

          const expenseBalances = sortedParticipants.map(name => {
            const paid = paidByCents[name] || 0;
            const share = shareByCents[name] || 0;
            return { name, paid, balance: paid - share };
          });

          const creditors = expenseBalances
            .filter(row => row.balance > 0)
            .map(row => ({ ...row }))
            .sort((a, b) => b.balance - a.balance);
          const debtors = expenseBalances
            .filter(row => row.balance < 0)
            .map(row => ({ ...row, balance: Math.abs(row.balance) }))
            .sort((a, b) => b.balance - a.balance);

          const settlements = [];
          let credIdx = 0;
          let debtIdx = 0;
          while (credIdx < creditors.length && debtIdx < debtors.length) {
            const credit = creditors[credIdx];
            const debt = debtors[debtIdx];
            const transfer = Math.min(credit.balance, debt.balance);
            if (transfer > 0) {
              settlements.push({ from: debt.name, to: credit.name, amount: transfer });
            }
            credit.balance -= transfer;
            debt.balance -= transfer;
            if (credit.balance === 0) credIdx += 1;
            if (debt.balance === 0) debtIdx += 1;
          }

          return (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                <button
                  onClick={() => toggleExpensePanel('splitter')}
                  className="w-full flex items-center justify-between mb-2 text-left"
                >
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">💸 Expense Splitter</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{expensePanels.splitter ? '−' : '+'}</span>
                </button>
                {expensePanels.splitter ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
                      <select
                        value={selectedPayer}
                        onChange={e => setNewExpenseDraft(prev => ({ ...prev, payer: e.target.value }))}
                        className="px-2.5 py-1.5 text-xs border border-emerald-300 dark:border-emerald-700 dark:bg-gray-700 dark:text-white rounded-lg"
                      >
                        {expenseParticipants.length === 0 ? (
                          <option value="">No members</option>
                        ) : (
                          expenseParticipants.map(name => <option key={name} value={name}>{getExpenseDisplayName(name)}</option>)
                        )}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newExpenseDraft.amount}
                        onChange={e => setNewExpenseDraft(prev => ({ ...prev, amount: e.target.value }))}
                        onKeyPress={e => e.key === 'Enter' && addSubCalExpense()}
                        placeholder="Amount"
                        className="px-2.5 py-1.5 text-xs border border-emerald-300 dark:border-emerald-700 dark:bg-gray-700 dark:text-white rounded-lg"
                      />
                      <input
                        type="text"
                        value={newExpenseDraft.description}
                        onChange={e => setNewExpenseDraft(prev => ({ ...prev, description: e.target.value }))}
                        onKeyPress={e => e.key === 'Enter' && addSubCalExpense()}
                        placeholder="What was paid?"
                        className="sm:col-span-2 px-2.5 py-1.5 text-xs border border-emerald-300 dark:border-emerald-700 dark:bg-gray-700 dark:text-white rounded-lg"
                      />
                    </div>
                    <button
                      onClick={addSubCalExpense}
                      className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium"
                    >
                      Add Expense
                    </button>
                    {expenseError && <p className="mt-2 text-xs text-red-500">{expenseError}</p>}

                    <div className="mt-3 space-y-1.5">
                      {subCalExpenses.length === 0 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">No expenses yet</p>
                      )}
                      {subCalExpenses.map(item => (
                        <div key={item.id} className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-emerald-100 dark:border-emerald-800 rounded-lg px-2.5 py-1.5">
                          <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">{getExpenseDisplayName(item.payer)}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-1 truncate">{item.description}</span>
                          <span className="text-xs text-gray-700 dark:text-gray-200 font-semibold">${(Number(item.amount) || 0).toFixed(2)}</span>
                          <button onClick={() => deleteSubCalExpense(item.id)} className="text-gray-300 hover:text-red-400 text-xs shrink-0">✕</button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{subCalExpenses.length} expense{subCalExpenses.length === 1 ? '' : 's'} recorded</p>
                )}
              </div>

              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => toggleExpensePanel('summary')}
                  className="w-full flex items-center justify-between mb-2 text-left"
                >
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">📊 Split Summary</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{expensePanels.summary ? '−' : '+'}</span>
                </button>
                {expensePanels.summary ? (
                  <>
                    <div className="space-y-1 text-xs">
                      <div className="text-gray-700 dark:text-gray-300">Total: <span className="font-semibold">${(totalCents / 100).toFixed(2)}</span></div>
                      <div className="text-gray-700 dark:text-gray-300">Per member ({sortedParticipants.length}): <span className="font-semibold">${(sortedParticipants.length > 0 ? totalCents / 100 / sortedParticipants.length : 0).toFixed(2)}</span></div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                      {expenseBalances.map(row => (
                        <div key={row.name} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-300">{getExpenseDisplayName(row.name)}</span>
                          <span className="text-gray-700 dark:text-gray-200">
                            Paid ${(row.paid / 100).toFixed(2)} · {row.balance >= 0 ? `Gets back $${(row.balance / 100).toFixed(2)}` : `Owes $${(Math.abs(row.balance) / 100).toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total ${(totalCents / 100).toFixed(2)}</p>
                )}
              </div>

              <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-200 dark:border-sky-700">
                <button
                  onClick={() => toggleExpensePanel('handles')}
                  className="w-full flex items-center justify-between mb-2 text-left"
                >
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">💳 Payment Handles</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{expensePanels.handles ? '−' : '+'}</span>
                </button>
                {expensePanels.handles ? (
                  <div className="space-y-1.5">
                    {sortedParticipants.map(name => {
                      const venmoHandle = getVenmoHandleForIdentity(name);
                      const cashHandle = getCashAppHandleForIdentity(name);
                      const canEdit = canEditVenmoIdentity(name);
                      return (
                        <div key={`payment-${name}`} className="text-xs bg-white dark:bg-gray-700 rounded-lg border border-sky-100 dark:border-sky-800 px-2.5 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-700 dark:text-gray-200 font-medium min-w-0 truncate">{getExpenseDisplayName(name)}</span>
                            {canEdit ? (
                              <button
                                onClick={() => setPaymentOptionPickerIdentity(prev => prev === name ? null : name)}
                                className="px-2 py-0.5 rounded-md bg-sky-500 hover:bg-sky-600 text-white font-medium shrink-0"
                              >
                                {paymentOptionPickerIdentity === name ? 'Done' : (venmoHandle || cashHandle ? 'Edit payment options' : 'Add payment option')}
                              </button>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 shrink-0">Only they can edit</span>
                            )}
                          </div>
                          {canEdit && paymentOptionPickerIdentity === name && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <button
                                onClick={async () => { await promptSetVenmoHandle(name); }}
                                className="px-2 py-1 rounded-md text-white font-semibold bg-[#008CFF] hover:bg-[#0078dc]"
                                title="Set Venmo handle"
                              >
                                V Venmo
                              </button>
                              <button
                                onClick={async () => { await promptSetCashAppHandle(name); }}
                                className="px-2 py-1 rounded-md text-white font-semibold bg-[#00D632] hover:bg-[#00b92b]"
                                title="Set Cash App handle"
                              >
                                $ Cash App
                              </button>
                            </div>
                          )}
                          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">
                            {venmoHandle ? `Venmo @${venmoHandle}` : 'Venmo not set'} · {cashHandle ? `Cash App $${cashHandle}` : 'Cash App not set'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{sortedParticipants.length} member{sortedParticipants.length === 1 ? '' : 's'}</p>
                )}
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                <button
                  onClick={() => toggleExpensePanel('settlements')}
                  className="w-full flex items-center justify-between mb-2 text-left"
                >
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">🔄 Who Pays Whom</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{expensePanels.settlements ? '−' : '+'}</span>
                </button>
                {expensePanels.settlements ? (
                  settlements.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">No transfers needed.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {settlements.map((s, idx) => {
                        const venmoHandle = getVenmoHandleForIdentity(s.to);
                        const cashHandle = getCashAppHandleForIdentity(s.to);
                        const fromDisplay = getExpenseDisplayName(s.from);
                        const toDisplay = getExpenseDisplayName(s.to);
                        const payVerb = fromDisplay === 'You' ? 'pay' : 'pays';
                        return (
                          <div key={`${s.from}-${s.to}-${idx}`} className="flex items-center justify-between gap-2 text-xs bg-white dark:bg-gray-700 rounded-lg border border-indigo-100 dark:border-indigo-800 px-2.5 py-1.5">
                            <div className="min-w-0">
                              <span className="text-gray-700 dark:text-gray-200">{fromDisplay}</span>
                              <span className="text-indigo-500 dark:text-indigo-300 font-semibold"> {payVerb} ${(s.amount / 100).toFixed(2)} </span>
                              <span className="text-gray-700 dark:text-gray-200">{toDisplay}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => openVenmoPayment(
                                  venmoHandle,
                                  s.amount,
                                  `${fromDisplay} ${payVerb} ${toDisplay} for ${activeSubCalendar?.name || 'trip'}`
                                )}
                                disabled={!venmoHandle}
                                className="px-2.5 py-1 rounded-md bg-sky-500 hover:bg-sky-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                                title={venmoHandle ? `Pay @${venmoHandle}` : `${toDisplay} has not set a Venmo handle yet`}
                              >
                                {venmoHandle ? 'Venmo' : 'No Venmo'}
                              </button>
                              <button
                                onClick={() => openCashAppPayment(cashHandle, s.amount)}
                                disabled={!cashHandle}
                                className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                                title={cashHandle ? `Pay $${cashHandle}` : `${toDisplay} has not set a Cash App handle yet`}
                              >
                                {cashHandle ? 'Cash App' : 'No Cash App'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{settlements.length} transfer{settlements.length === 1 ? '' : 's'}</p>
                )}
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
                disabled={uploadingPhoto || isPhotoSelectionMode || photoDeleteMode}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium shadow hover:shadow-lg transition-all disabled:opacity-50"
              >
                {uploadingPhoto ? '⏳ Uploading…' : '📷 Add Photos'}
              </button>
              {isPhotoSelectionMode ? (
                <>
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                    {selectedPhotoIds.length} selected
                  </span>
                  <button
                    onClick={saveSelectedPhotosToDevice}
                    disabled={selectedPhotoIds.length === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 text-white disabled:opacity-40"
                  >
                    Save to iPhone
                  </button>
                  <button
                    onClick={deleteSelectedPhotos}
                    disabled={selectedPhotoIds.length === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white disabled:opacity-40"
                  >
                    Delete
                  </button>
                  <button
                    onClick={closePhotoSelectionMode}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                  >
                    Done
                  </button>
                </>
              ) : photoDeleteMode ? (
                <button
                  onClick={() => { setPhotoDeleteMode(false); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setPhotoDeleteMode(false);
                      setIsPhotoSelectionMode(true);
                      setSelectedPhotoIds([]);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => {
                      setIsPhotoSelectionMode(false);
                      setPhotoDeleteMode(true);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300"
                  >
                    Edit
                  </button>
                </>
              )}
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
                        {photos.map(photo => {
                          const isSelectedPhoto = selectedPhotoIds.includes(photo.id);
                          return (
                          <div
                            key={photo.id}
                            className={`relative group aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer ${isSelectedPhoto ? 'ring-2 ring-purple-500' : ''} ${photoDeleteMode ? 'shake-wiggle' : ''}`}
                            onClick={() => handlePhotoTap(photo)}
                            onMouseDown={() => startPhotoHoldAction(photo)}
                            onMouseUp={clearPhotoReactionHold}
                            onMouseLeave={clearPhotoReactionHold}
                            onTouchStart={() => startPhotoHoldAction(photo)}
                            onTouchEnd={clearPhotoReactionHold}
                            onTouchCancel={clearPhotoReactionHold}
                          >
                            <img
                              src={photo.url}
                              alt={photo.caption || ''}
                              className="w-full h-full object-cover"
                              onError={() => { markPhotoDeleted(photo.id); }}
                            />
                            {isPhotoSelectionMode && (
                              <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/50 border border-white flex items-center justify-center">
                                <span className={`text-xs ${isSelectedPhoto ? 'text-emerald-300' : 'text-white/70'}`}>{isSelectedPhoto ? '✓' : ''}</span>
                              </div>
                            )}
                            {photo.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs truncate">{photo.caption}</p>
                              </div>
                            )}
                            {!isPhotoSelectionMode && photoDeleteMode && (
                              <button
                                onClick={e => { e.stopPropagation(); deleteTripPhoto(photo); }}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow"
                              >
                                ✕
                              </button>
                            )}
                            <div className="absolute bottom-1 left-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="bg-black/50 text-white px-1.5 py-0.5 rounded-full text-xs">{photo.uploaded_by}</span>
                            </div>
                          </div>
                        )})}
                        {/* Add more photos to this day */}
                        {!isPhotoSelectionMode && (
                          <button
                            onClick={() => { setPhotoDate(date !== 'unlinked' ? date : null); photoInputRef.current?.click(); }}
                            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-all flex items-center justify-center text-2xl"
                          >+</button>
                        )}
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
                        {photos.map(photo => {
                          const isSelectedPhoto = selectedPhotoIds.includes(photo.id);
                          return (
                          <div key={photo.id} className={`relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border ${isSelectedPhoto ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-100 dark:border-gray-700'} ${photoDeleteMode ? 'shake-wiggle' : ''}`}>
                            <img
                              src={photo.url}
                              alt={photo.caption || ''}
                              className="w-full max-h-72 object-cover cursor-pointer"
                              onError={() => { markPhotoDeleted(photo.id); }}
                              onClick={() => handlePhotoTap(photo)}
                              onMouseDown={() => startPhotoHoldAction(photo)}
                              onMouseUp={clearPhotoReactionHold}
                              onMouseLeave={clearPhotoReactionHold}
                              onTouchStart={() => startPhotoHoldAction(photo)}
                              onTouchEnd={clearPhotoReactionHold}
                              onTouchCancel={clearPhotoReactionHold}
                            />
                            {isPhotoSelectionMode && (
                              <div className="px-3 pt-2">
                                <button
                                  onClick={() => toggleSelectedPhoto(photo.id)}
                                  className={`text-xs px-2 py-1 rounded-full ${isSelectedPhoto ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'}`}
                                >
                                  {isSelectedPhoto ? 'Selected' : 'Select'}
                                </button>
                              </div>
                            )}
                            <div className="px-3 py-2 flex items-start justify-between gap-2">
                              <div>
                                {photo.caption && <p className="text-sm text-gray-800 dark:text-gray-200 mb-0.5">{photo.caption}</p>}
                                <p className="text-xs text-gray-400 dark:text-gray-500">📷 {photo.uploaded_by}</p>
                              </div>
                              {!isPhotoSelectionMode && photoDeleteMode && <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">Delete mode</span>}
                            </div>
                            {!isPhotoSelectionMode && photoDeleteMode && (
                              <button
                                onClick={() => deleteTripPhoto(photo)}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )})}
                        {!isPhotoSelectionMode && (
                          <button
                            onClick={() => { setPhotoDate(date !== 'unlinked' ? date : null); photoInputRef.current?.click(); }}
                            className="flex items-center gap-2 text-xs text-purple-500 hover:text-purple-700 font-medium"
                          >+ Add photo to this day</button>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}

        {smartLeavePrompt && (
          <div
            className="fixed inset-0 z-[60] bg-black/45 flex items-end sm:items-center justify-center"
            onClick={dismissSmartLeavePrompt}
          >
            <div
              className="w-full sm:w-[28rem] bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-sm font-semibold text-gray-800 dark:text-white">Leave now?</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {smartLeavePrompt.title} at {smartLeavePrompt.eventTime}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {smartLeavePrompt.destination}
              </div>
              <div className="mt-1 text-xs text-indigo-600 dark:text-indigo-300">
                Estimated drive: about {smartLeavePrompt.travelMinutes} min + 5 min buffer.
              </div>
              <div className="mt-3 space-y-2">
                <button
                  onClick={handleSmartLeaveNavigate}
                  className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-semibold"
                >
                  Navigate
                </button>
                <button
                  onClick={handleSmartLeaveRideOptions}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200"
                >
                  Call Uber/Lyft
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => snoozeSmartLeavePrompt(5)}
                  className="py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Snooze 5m
                </button>
                <button
                  onClick={dismissSmartLeavePrompt}
                  className="py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location action sheet */}
        {locationActionTarget && (
          <div
            className="fixed inset-0 z-50 bg-black/45 flex items-end sm:items-center justify-center"
            onClick={() => setLocationActionTarget('')}
          >
            <div
              className="w-full sm:w-[26rem] bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-sm font-semibold text-gray-800 dark:text-white">Open location with</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{locationActionTarget}</div>
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => handleLocationActionSelect('google')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                >
                  <span className="w-7 h-7 rounded-full bg-[#4285F4] text-white text-xs font-bold flex items-center justify-center">G</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200">Google Maps</span>
                </button>
                <button
                  onClick={() => handleLocationActionSelect('uber')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                >
                  <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">U</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200">Uber</span>
                </button>
                <button
                  onClick={() => handleLocationActionSelect('lyft')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                >
                  <span className="w-7 h-7 rounded-full bg-[#FF00BF] text-white text-xs font-bold flex items-center justify-center">L</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200">Lyft</span>
                </button>
              </div>
              <button
                onClick={() => setLocationActionTarget('')}
                className="w-full mt-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxPhoto && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
            onClick={() => { setLightboxPhoto(null); }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxPhoto(null);
              }}
              className="absolute right-4 text-white text-2xl z-10 bg-black/45 hover:bg-black/60 rounded-full w-10 h-10 flex items-center justify-center"
              style={{ top: 'max(1.75rem, calc(env(safe-area-inset-top) + 1rem))' }}
              aria-label="Close photo"
            >
              ✕
            </button>
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
    {!activeSubCalendar && locationActionTarget && (
      <div
        className="fixed inset-0 z-50 bg-black/45 flex items-end sm:items-center justify-center"
        onClick={() => setLocationActionTarget('')}
      >
        <div
          className="w-full sm:w-[26rem] bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="text-sm font-semibold text-gray-800 dark:text-white">Open location with</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{locationActionTarget}</div>
          <div className="mt-3 space-y-2">
            <button
              onClick={() => handleLocationActionSelect('google')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
            >
              <span className="w-7 h-7 rounded-full bg-[#4285F4] text-white text-xs font-bold flex items-center justify-center">G</span>
              <span className="text-sm text-gray-800 dark:text-gray-200">Google Maps</span>
            </button>
            <button
              onClick={() => handleLocationActionSelect('uber')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
            >
              <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">U</span>
              <span className="text-sm text-gray-800 dark:text-gray-200">Uber</span>
            </button>
            <button
              onClick={() => handleLocationActionSelect('lyft')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
            >
              <span className="w-7 h-7 rounded-full bg-[#FF00BF] text-white text-xs font-bold flex items-center justify-center">L</span>
              <span className="text-sm text-gray-800 dark:text-gray-200">Lyft</span>
            </button>
          </div>
          <button
            onClick={() => setLocationActionTarget('')}
            className="w-full mt-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
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
  20% { transform: rotate(-1.5deg) translateX(-0.5px); }
  40% { transform: rotate(1.5deg) translateX(0.5px); }
  60% { transform: rotate(-1deg) translateX(-0.5px); }
  80% { transform: rotate(1deg) translateX(0.5px); }
}
.shake-wiggle {
  animation: wiggle 0.9s ease-in-out infinite;
  transform-origin: center;
}
`;

export default App;
