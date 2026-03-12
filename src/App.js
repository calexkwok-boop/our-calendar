import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, Clock, Plus, X, ChevronLeft, ChevronRight, Edit2, Trash2, Tag, Settings, Lock, User, Bell, BellOff, AlertTriangle, Repeat, Moon, Sun, Camera, MessageSquare, MapPin } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getToken, onMessage } from "firebase/messaging";
import { getMessagingIfSupported } from "./firebase";

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
  popup_event: { label: 'Pop up event', color: 'bg-rose-500', lightBg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
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

const WEB_PUSH_VAPID_PUBLIC_KEY = String(process.env.REACT_APP_VAPID_PUBLIC_KEY || process.env.REACT_APP_FCM_VAPID_PUBLIC_KEY || '').trim();
const FCM_WEB_VAPID_PUBLIC_KEY = String(process.env.REACT_APP_FCM_VAPID_PUBLIC_KEY || process.env.REACT_APP_VAPID_PUBLIC_KEY || '').trim();

const LOCKED_DEFAULT_LAYER_TITLE_STYLE = Object.freeze({
  mode: 'gradient',
  solidColor: '#7c3aed',
  gradientFrom: '#e11d48',
  gradientVia: '#7c3aed',
  gradientTo: '#4f46e5',
});

const LOCKED_DEFAULT_LAYER_PAGE_THEME = Object.freeze({
  matchTitle: true,
  accent: '#7c3aed',
  backgroundFrom: '#fdf2f8',
  backgroundVia: '#f5f3ff',
  backgroundTo: '#eef2ff',
  coverOpacity: 0.82,
});

const createDefaultLayerTitleStyle = () => ({ ...LOCKED_DEFAULT_LAYER_TITLE_STYLE });
const createDefaultLayerPageTheme = () => ({ ...LOCKED_DEFAULT_LAYER_PAGE_THEME });
const DEFAULT_LAYER_TITLE_STYLE = createDefaultLayerTitleStyle();
const DEFAULT_LAYER_PAGE_THEME = createDefaultLayerPageTheme();

const TITLE_STYLE_PRESETS = [
  { name: 'Sunset', mode: 'gradient', gradientFrom: '#fb7185', gradientVia: '#f59e0b', gradientTo: '#f97316' },
  { name: 'Gradient Berry', ...LOCKED_DEFAULT_LAYER_TITLE_STYLE },
  { name: 'Ocean', mode: 'gradient', gradientFrom: '#06b6d4', gradientVia: '#2563eb', gradientTo: '#4f46e5' },
  { name: 'Mint', mode: 'gradient', gradientFrom: '#10b981', gradientVia: '#14b8a6', gradientTo: '#0ea5e9' },
  { name: 'Gold', mode: 'solid', solidColor: '#b45309' },
  { name: 'Charcoal', mode: 'solid', solidColor: '#1f2937' },
];

const SPORTS_TITLE_STYLE_PRESETS = [
  { name: 'Bay Gold', mode: 'gradient', gradientFrom: '#1d4ed8', gradientVia: '#2563eb', gradientTo: '#fbbf24' },
  { name: 'Scarlet Faithful', mode: 'gradient', gradientFrom: '#991b1b', gradientVia: '#dc2626', gradientTo: '#fbbf24' },
  { name: 'Midnight Silver', mode: 'gradient', gradientFrom: '#111827', gradientVia: '#374151', gradientTo: '#9ca3af' },
  { name: 'Celtic Green', mode: 'gradient', gradientFrom: '#065f46', gradientVia: '#059669', gradientTo: '#d1fae5' },
  { name: 'Dodger Blue', mode: 'gradient', gradientFrom: '#1d4ed8', gradientVia: '#2563eb', gradientTo: '#93c5fd' },
  { name: 'Purple Gold', mode: 'gradient', gradientFrom: '#4c1d95', gradientVia: '#7c3aed', gradientTo: '#facc15' },
  { name: 'Orange Black', mode: 'gradient', gradientFrom: '#111827', gradientVia: '#f97316', gradientTo: '#fb923c' },
  { name: 'Emerald Navy', mode: 'gradient', gradientFrom: '#065f46', gradientVia: '#0f766e', gradientTo: '#1e3a8a' },
];

const CALENDAR_REPORT_REASONS = [
  { value: 'copyright', label: 'Copyright issue' },
  { value: 'trademark', label: 'Trademark or impersonation' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'adult', label: 'Adult or unsafe content' },
  { value: 'spam', label: 'Spam' },
];


const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const getLayerDarkModeStorageKey = (userId, layerId) => `darkMode:${String(userId || '').trim()}:${String(layerId || '').trim()}`;

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
  const holidayCleanupRunRef = useRef(new Set());
  const dateTapTimeoutRef = useRef(null);
  const layerMediaInputRef = useRef(null);
  const layerHeaderCardRef = useRef(null);
  const pendingLayerMediaKindRef = useRef('');
  const layerCropDragRef = useRef({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const scanReminderInputRef = useRef(null);
  const scanReminderUploadInputRef = useRef(null);
  const importCalendarInputRef = useRef(null);
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
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', content: 'Hi, I can help you plan events, trips, and reminders.' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [inAppNotifications, setInAppNotifications] = useState([]);
  const [pendingTripInvites, setPendingTripInvites] = useState([]);
  const seenInAppNotificationKeysRef = useRef(new Set());
  const dismissedCalendarInviteIdsRef = useRef(new Set());
  const inAppSyncCursorRef = useRef({ events: null, subCalEvents: null, tripPhotos: null, sharedListItems: null, tripInvites: null });
  const seenExpenseIdsRef = useRef(new Set());
  const [showTimePrompt, setShowTimePrompt] = useState(false);
  const [pendingEvent, setPendingEvent] = useState(null);
  const [showConflictPrompt, setShowConflictPrompt] = useState(false);
  const [conflictPromptData, setConflictPromptData] = useState({
    heading: 'Scheduling Conflict',
    title: '',
    lines: [],
    confirmLabel: 'Save Anyway',
    cancelLabel: 'Change Time',
    showCancel: true,
  });
  const [recurringDeletePrompt, setRecurringDeletePrompt] = useState(null);
  const [isPopupEventDraft, setIsPopupEventDraft] = useState(false);
  const [popupEventMaxPeopleDraft, setPopupEventMaxPeopleDraft] = useState('10');
  const [popupEventsByEventId, setPopupEventsByEventId] = useState({});
  const [popupSignupsByEventId, setPopupSignupsByEventId] = useState({});
  const [popupFeatureAvailable, setPopupFeatureAvailable] = useState(true);
  const [layerRefreshToken, setLayerRefreshToken] = useState(0);
  const [calendarTitle, setCalendarTitle] = useState('Our Calendar');
  const [showTitleStyleModal, setShowTitleStyleModal] = useState(false);
  const [titleNameDraft, setTitleNameDraft] = useState('');
  const [titleStyleDraft, setTitleStyleDraft] = useState(createDefaultLayerTitleStyle());
  const [showThemeMatchPrompt, setShowThemeMatchPrompt] = useState(false);
  const [pendingThemeMatchStyle, setPendingThemeMatchStyle] = useState(null);
  const [coverOpacityPreview, setCoverOpacityPreview] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [isImportingCalendar, setIsImportingCalendar] = useState(false);
  const [uploadingLayerMedia, setUploadingLayerMedia] = useState(false);
  const [showFirstImportPrompt, setShowFirstImportPrompt] = useState(false);
  const [importPromptStep, setImportPromptStep] = useState('main');
  const [appleCalendarUrlInput, setAppleCalendarUrlInput] = useState('');
  const IMPORT_PROMPT_HIDE_KEY = 'calendar-hide-import-prompt';
  const GOOGLE_IMPORT_PENDING_KEY = 'calendar-google-import-pending';
  const GOOGLE_CALENDAR_READ_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
  const GOOGLE_CONTACTS_READ_SCOPE = 'https://www.googleapis.com/auth/contacts.readonly';
  const googleImportResumeRef = useRef(false);
  const [hideImportPromptForever, setHideImportPromptForever] = useState(() => localStorage.getItem(IMPORT_PROMPT_HIDE_KEY) === 'true');
  const [dontShowImportPromptChecked, setDontShowImportPromptChecked] = useState(false);
  const [importPromptDismissedThisSession, setImportPromptDismissedThisSession] = useState(false);
  const [firstTapDate, setFirstTapDate] = useState(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [recurrence, setRecurrence] = useState('once');
  const [calendarView, setCalendarView] = useState('month');
  const [agendaRangeDays, setAgendaRangeDays] = useState(30);
  const [agendaSearchQuery, setAgendaSearchQuery] = useState('');
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
  const [activeCalendarSortOrder, setActiveCalendarSortOrder] = useState([]);
  const [upcomingTripSortOrder, setUpcomingTripSortOrder] = useState([]);
  const [upcomingPopupSortOrder, setUpcomingPopupSortOrder] = useState([]);
  const [draggingActiveCalendarId, setDraggingActiveCalendarId] = useState(null);
  const [draggingUpcomingTripId, setDraggingUpcomingTripId] = useState(null);
  const [draggingUpcomingPopupId, setDraggingUpcomingPopupId] = useState(null);
  const conflictPromptResolverRef = useRef(null);

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
  const [subCalMembersCollapsed, setSubCalMembersCollapsed] = useState(true);
  const [showSubCalLocationSheet, setShowSubCalLocationSheet] = useState(false);
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
  const [shareLayerLocation, setShareLayerLocation] = useState(() => localStorage.getItem('layer-share-location') === 'true');
  const [layerMemberLocations, setLayerMemberLocations] = useState({});
  const layerLocationChannelRef = useRef(null);
  const layerGeoWatchRef = useRef(null);
  const [tripPhotos, setTripPhotos] = useState([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState([]);
  const [deletedPhotosNoteId, setDeletedPhotosNoteId] = useState(null);
  const [photoView, setPhotoView] = useState('grid'); // 'grid' | 'timeline'
  const [showPhotoSortMenu, setShowPhotoSortMenu] = useState(false);
  const [showSubCalInviteModal, setShowSubCalInviteModal] = useState(false);
  const [showSubCalNotesModal, setShowSubCalNotesModal] = useState(false);
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

  const REACTION_EMOJIS = ['??', '??', '??', '??', '??', '??', '??', '??', '??'];
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
  const getLayerCategoriesLocalKey = (_userId, layerId) => `layer-categories-${String(layerId || '').trim()}`;
  const readLocalLayerCategories = (userId, layerId) => {
    try {
      const lid = String(layerId || '').trim();
      if (!lid) return null;
      let raw = localStorage.getItem(getLayerCategoriesLocalKey('', lid));
      if (!raw) {
        // Legacy fallback for old key format.
        const uid = String(userId || '').trim();
        if (uid) raw = localStorage.getItem(`layer-categories-${uid}-${lid}`);
      }
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  };
  const writeLocalLayerCategories = (userId, layerId, categoriesObj) => {
    try {
      const lid = String(layerId || '').trim();
      if (!lid) return;
      const payload = JSON.stringify(categoriesObj || {});
      localStorage.setItem(getLayerCategoriesLocalKey('', lid), payload);
      const uid = String(userId || '').trim();
      if (uid) localStorage.setItem(`layer-categories-${uid}-${lid}`, payload); // compatibility
    } catch {}
  };
  const getActiveCalendarsSortLocalKey = (userId) => `active-calendars-order-${String(userId || '').trim()}`;
  const getUpcomingTripsSortLocalKey = (userId, layerId) => `upcoming-trips-order-${String(userId || '').trim()}-${String(layerId || '').trim()}`;
  const getUpcomingPopupsSortLocalKey = (userId, layerId) => `upcoming-popups-order-${String(userId || '').trim()}-${String(layerId || '').trim()}`;
  const readLocalSortOrder = (key) => {
    try {
      const raw = localStorage.getItem(String(key || ''));
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((id) => String(id || '')).filter(Boolean);
    } catch {
      return [];
    }
  };
  const writeLocalSortOrder = (key, ids) => {
    try {
      const normalized = Array.from(new Set((ids || []).map((id) => String(id || '')).filter(Boolean)));
      localStorage.setItem(String(key || ''), JSON.stringify(normalized));
    } catch {}
  };
  const normalizeSortOrder = (ids, order) => {
    const idList = Array.from(new Set((ids || []).map((id) => String(id || '')).filter(Boolean)));
    const orderList = Array.from(new Set((order || []).map((id) => String(id || '')).filter(Boolean)));
    return [...orderList.filter((id) => idList.includes(id)), ...idList.filter((id) => !orderList.includes(id))];
  };
  const reorderSortOrder = (ids, fromId, toId) => {
    const normalized = normalizeSortOrder(ids, ids);
    const source = String(fromId || '');
    const target = String(toId || '');
    if (!source || !target || source === target) return normalized;
    const fromIndex = normalized.indexOf(source);
    const toIndex = normalized.indexOf(target);
    if (fromIndex < 0 || toIndex < 0) return normalized;
    const next = [...normalized];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  };
  const normalizeIdentityKey = (value) => String(value || '').trim().toLowerCase();
  const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
  const isEmailValue = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase());
  const normalizePhoneNumber = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const compact = raw.replace(/[^\d+]/g, '');
    if (!compact) return '';
    if (compact.startsWith('+')) {
      const digits = compact.slice(1).replace(/\D/g, '');
      return digits ? `+${digits}` : '';
    }
    const digits = compact.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return `+${digits}`;
  };
  const getAuthIdentityLabel = (authUser) => {
    const email = String(authUser?.email || '').trim();
    if (email) return email;
    const phone = String(authUser?.phone || '').trim();
    if (phone) return phone;
    const fullName = String(authUser?.user_metadata?.full_name || '').trim();
    if (fullName) return fullName;
    const name = String(authUser?.user_metadata?.name || '').trim();
    if (name) return name;
    return 'User';
  };
  const resolveInviteRecipient = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const email = normalizeEmail(raw);
    if (isEmailValue(email)) {
      return { kind: 'email', value: email, email, phone: '' };
    }
    const phone = normalizePhoneNumber(raw);
    if (phone) {
      return { kind: 'phone', value: phone, email: '', phone };
    }
    return null;
  };
  const getInviteIdentityFromRow = (row) => {
    const rowEmail = normalizeEmail(row?.email);
    if (rowEmail) return rowEmail;
    const rowPhone = normalizePhoneNumber(row?.phone);
    if (rowPhone) return rowPhone;
    return '';
  };
  const getShareRecipientFromRow = (row) => {
    const rowEmail = normalizeEmail(row?.shared_with_email);
    if (rowEmail) return rowEmail;
    const rowPhone = normalizePhoneNumber(row?.shared_with_phone);
    if (rowPhone) return rowPhone;
    return '';
  };
  const getRecipientKindLabel = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    return normalized.includes('@') ? 'Email' : 'Phone';
  };
  const buildShareRecipientFilter = (userId, email, phone) => {
    const clauses = [];
    const uid = String(userId || '').trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhoneNumber(phone);
    if (uid) clauses.push(`shared_with_id.eq.${uid}`);
    if (normalizedEmail) clauses.push(`shared_with_email.eq.${normalizedEmail}`);
    if (normalizedPhone) clauses.push(`shared_with_phone.eq.${normalizedPhone}`);
    return clauses.join(',');
  };
  const buildMemberRecipientFilter = (email, phone) => {
    const clauses = [];
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhoneNumber(phone);
    if (normalizedEmail) clauses.push(`email.eq.${normalizedEmail}`);
    if (normalizedPhone) clauses.push(`phone.eq.${normalizedPhone}`);
    return clauses.join(',');
  };
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

  // -- Sub-calendar functions ----------------------------------------------

  const loadSubCalendars = async () => {
    const requestedLayerId = String(activeLayerId || '');
    if (!requestedLayerId) {
      setSubCalendars([]);
      setActiveSubCalendar(null);
      return [];
    }
    try {
      const myUserId = String(user?.id || '');
      const myEmail = String(user?.email || '').trim().toLowerCase();
      const ownerIdForLayer = String(activeLayerOwnerId || myUserId || '');
      const shareRecipientFilter = buildShareRecipientFilter(myUserId, myEmail, user?.phone);

      const { data: directRows, error } = await supabase
        .from('sub_calendars')
        .select('*')
        .eq('layer_id', requestedLayerId);
      if (error) {
        console.error('Error loading sub_calendars:', error);
        return;
      }

      let sharedOwnerQuery = supabase
        .from('shared_access')
        .select('owner_id')
        .eq('layer_id', requestedLayerId);
      if (shareRecipientFilter) sharedOwnerQuery = sharedOwnerQuery.or(shareRecipientFilter);
      const { data: sharedOwnerRows } = await sharedOwnerQuery;
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
      const myPhone = normalizePhoneNumber(user?.phone);
      const memberRecipientFilter = buildMemberRecipientFilter(myEmail, myPhone);
      if (memberRecipientFilter) {
        const { data: memberLinks } = await supabase
          .from('sub_calendar_members')
          .select('sub_calendar_id,status')
          .or(memberRecipientFilter);
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
      const layerScopedRows = mergedRows.filter(sc => String(sc?.layer_id || '') === requestedLayerId);

      // Deduplicate duplicate cloned trips (same name + dates + effective layer) by selecting the best candidate.
      const dedupedMap = new Map();
      const getTripScore = (sc) => {
        let score = 0;
        const scId = String(sc?.id || '');
        const scLayerId = String(sc?.layer_id || '');
        const scOwnerId = String(sc?.owner_id || '');
        if (scLayerId && scLayerId === requestedLayerId) score += 4;
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
      (layerScopedRows || []).forEach((sc) => {
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
      if (String(activeLayerIdRef.current || '') !== requestedLayerId) return dedupedRows;
      setSubCalendars(dedupedRows);
      setActiveSubCalendar((prev) => {
        if (!prev?.id) return prev;
        return dedupedRows.some((sc) => String(sc.id) === String(prev.id)) ? prev : null;
      });
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
      const myEmail = normalizeEmail(user?.email);
      const myPhone = normalizePhoneNumber(user?.phone);
      const { data: memberRows } = await supabase
        .from('sub_calendar_members')
        .select('*')
        .eq('sub_calendar_id', subCalId);

      const merged = new Map();
      const addMember = (identityValue, extra = {}) => {
        const recipient = resolveInviteRecipient(identityValue);
        if (!recipient?.value) return;
        if (recipient.value === myEmail || recipient.value === myPhone) return;
        if (!merged.has(recipient.value)) {
          merged.set(recipient.value, {
            id: recipient.value,
            identity: recipient.value,
            email: recipient.email || null,
            phone: recipient.phone || null,
            ...extra,
          });
        }
      };

      (memberRows || []).forEach((row) => {
        const status = String(row?.status || '').toLowerCase();
        if (status === 'declined') return;
        addMember(row?.email || row?.phone, { status: row?.status || null, source: 'trip_invite', removable: true });
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
          .select('owner_id,shared_with_email,shared_with_phone')
          .eq('layer_id', layerId);
        (sharedRows || []).forEach((row) => {
          const sharedEmail = normalizeEmail(row?.shared_with_email);
          const sharedPhone = normalizePhoneNumber(row?.shared_with_phone);
          const sharedIdentity = sharedEmail || sharedPhone;
          const ownerId = String(row?.owner_id || '').trim();

          if (sharedIdentity) {
            addMember(sharedIdentity, { status: 'accepted', source: 'layer_share', removable: false });
          }

          // If this row is "owner shared to me", also include the owner label/email.
          // This preserves collaborator visibility for recipients under strict RLS.
          if (sharedIdentity && (sharedIdentity === myEmail || sharedIdentity === myPhone) && ownerId) {
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
        .select('shared_with_email,shared_with_phone')
        .eq('layer_id', layerId);
      if (sharedErr) {
        console.error('syncSubCalendarMembersFromLayer shared_access error:', sharedErr);
        return;
      }

      const sharedRecipients = Array.from(
        new Set(
          (sharedRows || [])
            .map((r) => normalizeEmail(r?.shared_with_email) || normalizePhoneNumber(r?.shared_with_phone))
            .filter(Boolean)
        )
      );
      if (sharedRecipients.length === 0) return;

      const { data: existingRows, error: existingErr } = await supabase
        .from('sub_calendar_members')
        .select('email,phone')
        .eq('sub_calendar_id', subCalId);
      if (existingErr) {
        console.error('syncSubCalendarMembersFromLayer existing members error:', existingErr);
        return;
      }
      const existingRecipients = new Set(
        (existingRows || [])
          .map((r) => normalizeEmail(r?.email) || normalizePhoneNumber(r?.phone))
          .filter(Boolean)
      );
      const missingRecipients = sharedRecipients.filter((identity) => !existingRecipients.has(identity));
      if (missingRecipients.length === 0) return;

      const nowIso = new Date().toISOString();
      const rows = missingRecipients.map((identity) => {
        const recipient = resolveInviteRecipient(identity);
        return {
          sub_calendar_id: subCalId,
          email: recipient?.email || null,
          phone: recipient?.phone || null,
          added_by: user.id,
          status: 'accepted',
          invited_at: nowIso,
          accepted_at: nowIso,
          created_at: nowIso,
        };
      });

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
    if (!assertCanEditActiveLayer('create itineraries')) return;
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
    if (!assertCanEditActiveLayer('delete itineraries')) return;
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

  const inviteToSubCalendar = async (recipientOverride) => {
    if (!assertCanEditActiveLayer('invite members to itineraries')) return;
    const recipient = resolveInviteRecipient(recipientOverride || subCalInviteEmail);
    if (!recipient?.value || !activeSubCalendar) return;
    if (!user?.id) {
      alert('You must be signed in to invite members.');
      return;
    }

    const payload = {
      sub_calendar_id: activeSubCalendar.id,
      email: recipient.email || null,
      phone: recipient.phone || null,
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
          email: recipient.email || null,
          phone: recipient.phone || null,
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
        let refreshQuery = supabase
          .from('sub_calendar_members')
          .update(refreshPayload)
          .eq('sub_calendar_id', activeSubCalendar.id);
        const recipientFilter = buildMemberRecipientFilter(recipient.email, recipient.phone);
        if (recipientFilter) refreshQuery = refreshQuery.or(recipientFilter);
        const refresh = await refreshQuery;
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
    setShowSubCalInviteModal(false);
  };

  const removeMemberFromSubCal = async (identity) => {
    if (!assertCanEditActiveLayer('remove itinerary members')) return;
    const recipient = resolveInviteRecipient(identity);
    if (!recipient?.value) return;
    let deleteQuery = supabase.from('sub_calendar_members')
      .delete()
      .eq('sub_calendar_id', activeSubCalendar.id);
    const recipientFilter = buildMemberRecipientFilter(recipient.email, recipient.phone);
    if (recipientFilter) deleteQuery = deleteQuery.or(recipientFilter);
    await deleteQuery;
    setSubCalMembers(prev => prev.filter(m => m.identity !== recipient.value));
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
      setPhotoUploadMessage('');
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
    if (!assertCanEditActiveLayer('add itinerary notes')) return;
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
    if (!assertCanEditActiveLayer('delete itinerary notes')) return;
    await supabase.from('sub_calendar_notes').delete().eq('id', noteId);
    setSubCalNotes(prev => prev.filter(n => n.id !== noteId));
    if (expandedNote === noteId) setExpandedNote(null);
  };

  const updateNoteText = async (noteId, newText) => {
    if (!assertCanEditActiveLayer('edit itinerary notes')) return;
    if (!newText.trim()) return;
    await supabase.from('sub_calendar_notes').update({ text: newText.trim() }).eq('id', noteId);
    setSubCalNotes(prev => prev.map(n => n.id === noteId ? { ...n, text: newText.trim() } : n));
    setEditingNote(null);
  };

  const updateSubCalTitle = async (newName) => {
    if (!assertCanEditActiveLayer('rename itineraries')) return;
    if (!newName.trim() || !activeSubCalendar) return;
    await supabase.from('sub_calendars').update({ name: newName.trim() }).eq('id', activeSubCalendar.id);
    setActiveSubCalendar(prev => ({ ...prev, name: newName.trim() }));
    setSubCalendars(prev => prev.map(sc => sc.id === activeSubCalendar.id ? { ...sc, name: newName.trim() } : sc));
    setEditingSubCalTitle(false);
  };

  const saveExpenseLedger = async (expenses) => {
    if (!assertCanEditActiveLayer('edit itinerary expenses')) return false;
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
    if (!assertCanEditActiveLayer('edit payment handles')) return false;
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
    if (!assertCanEditActiveLayer('edit payment handles')) return false;
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
    if (!assertCanEditActiveLayer('edit payment handles')) return false;
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
    if (!assertCanEditActiveLayer('edit payment handles')) return false;
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
    if (!assertCanEditActiveLayer('delete itinerary photos')) return false;
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
    if (!assertCanEditActiveLayer('add itinerary expenses')) return;
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
    if (!assertCanEditActiveLayer('delete itinerary expenses')) return;
    const updated = subCalExpenses.filter(e => e.id !== expenseId);
    const ok = await saveExpenseLedger(updated);
    if (!ok) return;
    setExpenseError('');
    setSubCalExpenses(updated);
  };

  const extendSubCalDates = async (direction) => {
    if (!assertCanEditActiveLayer('change itinerary dates')) return;
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
    if (!assertCanEditActiveLayer('change itinerary dates')) return;
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
    if (!assertCanEditActiveLayer('edit itinerary checklists')) return;
    if (!itemText.trim()) return;
    const note = subCalNotes.find(n => n.id === noteId);
    const checklist = [...(note.checklist || []), { id: Date.now(), text: itemText.trim(), done: false }];
    await supabase.from('sub_calendar_notes').update({ checklist: JSON.stringify(checklist) }).eq('id', noteId);
    setSubCalNotes(prev => prev.map(n => n.id === noteId ? { ...n, checklist } : n));
    setNewChecklistItem('');
  };

  const toggleChecklistItem = async (noteId, itemId) => {
    if (!assertCanEditActiveLayer('edit itinerary checklists')) return;
    const note = subCalNotes.find(n => n.id === noteId);
    const checklist = note.checklist.map(item => item.id === itemId ? { ...item, done: !item.done } : item);
    await supabase.from('sub_calendar_notes').update({ checklist: JSON.stringify(checklist) }).eq('id', noteId);
    setSubCalNotes(prev => prev.map(n => n.id === noteId ? { ...n, checklist } : n));
  };

  const deleteChecklistItem = async (noteId, itemId) => {
    if (!assertCanEditActiveLayer('edit itinerary checklists')) return;
    const note = subCalNotes.find(n => n.id === noteId);
    const checklist = note.checklist.filter(item => item.id !== itemId);
    await supabase.from('sub_calendar_notes').update({ checklist: JSON.stringify(checklist) }).eq('id', noteId);
    setSubCalNotes(prev => prev.map(n => n.id === noteId ? { ...n, checklist } : n));
  };

  const addSubCalEvent = async (date, title, time, endTime, location = null) => {
    if (!assertCanEditActiveLayer('add itinerary events')) return;
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
    if (!assertCanEditActiveLayer('edit itinerary events')) return;
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
    if (!assertCanEditActiveLayer('delete itinerary events')) return;
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
  const [publicCalendars, setPublicCalendars] = useState([]);
  const [expandedExploreDescriptions, setExpandedExploreDescriptions] = useState({});
  const [exploreSearch, setExploreSearch] = useState('');
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreError, setExploreError] = useState('');
  const [showLayerModal, setShowLayerModal] = useState(false);
  const [showPublishLayerModal, setShowPublishLayerModal] = useState(false);
  const [publishLayerTargetId, setPublishLayerTargetId] = useState(null);
  const [publishLayerDescription, setPublishLayerDescription] = useState('');
  const [publishLayerTagsInput, setPublishLayerTagsInput] = useState('');
  const [publishPolicyConfirmed, setPublishPolicyConfirmed] = useState(false);
  const [showCalendarReportModal, setShowCalendarReportModal] = useState(false);
  const [reportCalendarTarget, setReportCalendarTarget] = useState(null);
  const [reportCalendarReason, setReportCalendarReason] = useState('copyright');
  const [reportCalendarDetails, setReportCalendarDetails] = useState('');
  const [submittingCalendarReport, setSubmittingCalendarReport] = useState(false);
  const [showLayerMediaMenu, setShowLayerMediaMenu] = useState(false);
  const [showLayerMediaCropModal, setShowLayerMediaCropModal] = useState(false);
  const [layerMediaCropKind, setLayerMediaCropKind] = useState('');
  const [layerMediaCropImageUrl, setLayerMediaCropImageUrl] = useState('');
  const [layerMediaCropNatural, setLayerMediaCropNatural] = useState({ width: 0, height: 0 });
  const [layerMediaCropZoom, setLayerMediaCropZoom] = useState(1);
  const [layerMediaCropOffset, setLayerMediaCropOffset] = useState({ x: 0, y: 0 });
  const [newLayerName, setNewLayerName] = useState('');
  const [sharedCalendars, setSharedCalendars] = useState([]); // calendars others shared with me
  const [sharedOwnerLabels, setSharedOwnerLabels] = useState({});
  const [myShares, setMyShares] = useState([]); // people I've shared with
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showListPanel, setShowListPanel] = useState(false);
  const [listPanelAttention, setListPanelAttention] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [sharedListGroups, setSharedListGroups] = useState([]);
  const [sharedListItems, setSharedListItems] = useState([]);
  const [calendarChatMessages, setCalendarChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const [chatUnreadCounts, setChatUnreadCounts] = useState({});
  const [chatLastSeenByLayer, setChatLastSeenByLayer] = useState({});
  const [chatMembers, setChatMembers] = useState([]);
  const [chatPresenceByUserId, setChatPresenceByUserId] = useState({});
  const [showChatMembersPanel, setShowChatMembersPanel] = useState(false);
  const [chatReactionPickerFor, setChatReactionPickerFor] = useState(null);
  const chatLastTapRef = useRef({ messageId: null, at: 0 });
  const lastSwPushRawRef = useRef({ at: 0, raw: '' });
  const [deletingChatMessageId, setDeletingChatMessageId] = useState(null);
  const [showCreateEventPopup, setShowCreateEventPopup] = useState(false);
  const [pollComposerStep, setPollComposerStep] = useState('menu');
  const [pollQuestionInput, setPollQuestionInput] = useState('');
  const [pollDateInput, setPollDateInput] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [pollOptionInputs, setPollOptionInputs] = useState(['', '']);
  const [popupDraftTitle, setPopupDraftTitle] = useState('');
  const [popupDraftDate, setPopupDraftDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [popupDraftTime, setPopupDraftTime] = useState('');
  const [popupDraftLocation, setPopupDraftLocation] = useState('');
  const [popupDraftMaxPeople, setPopupDraftMaxPeople] = useState('10');
  const [popupDraftNoMaxPeople, setPopupDraftNoMaxPeople] = useState(false);
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
  const [darkMode, setDarkMode] = useState(false);
  const [showTipBanner, setShowTipBanner] = useState(() => localStorage.getItem('hideTipBanner') !== 'true');
  const [weather, setWeather] = useState({}); // { 'YYYY-MM-DD': { emoji, high, low } }
  const [showWeather, setShowWeather] = useState(true);
  const calendarChatScrollRef = useRef(null);
  const listPanelRef = useRef(null);
  const CHAT_POLL_PREFIX = '[poll-v1]';
  const CHAT_POPUP_PREFIX = '[popup-v1]';
  const CHAT_DELETED_PREFIX = '[deleted-v1]';
  const CHAT_MESSAGE_PREFIX = '[msg-v1]';
  const CHAT_REACTION_EMOJIS = ['??', '??', '??', '??', '??', '??', '??', '?', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '?', '??', '??', '??', '??', '??', '??'];
  const POPUP_NO_MAX_SENTINEL = 1000000;

  const parseDateFromText = (text) => {
    const raw = String(text || '');
    const iso = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (iso) {
      const year = Number(iso[1]);
      const month = Number(iso[2]);
      const day = Number(iso[3]);
      const d = new Date(year, month - 1, day);
      if (d.getFullYear() === year && d.getMonth() === (month - 1) && d.getDate() === day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    const m = raw.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
    if (!m) return null;
    const month = Number(m[1]);
    const day = Number(m[2]);
    let year = Number(m[3]);
    if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) return null;
    if (year < 100) year += 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== (month - 1) || d.getDate() !== day) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const parseTimeFromText = (text) => {
    const raw = String(text || '');
    const m = raw.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (!m) return null;
    return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`;
  };

  const parseDateRangeFromText = (text) => {
    const raw = String(text || '');
    const m = raw.match(/\b(\d{4}-\d{2}-\d{2})\s+(?:to|-)\s+(\d{4}-\d{2}-\d{2})\b/i);
    if (!m) return null;
    const start = parseDateFromText(m[1]);
    const end = parseDateFromText(m[2]);
    if (!start || !end) return null;
    return { start, end };
  };

  const getDateKeysInRange = (startKey, endKey) => {
    const start = new Date(`${startKey}T00:00:00`);
    const end = new Date(`${endKey}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [startKey];
    const from = start <= end ? start : end;
    const to = start <= end ? end : start;
    const out = [];
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      out.push(getDateKey(d));
      if (out.length > 370) break;
    }
    return out.length > 0 ? out : [startKey];
  };

  const formatDateKeyMMDDYYYY = (value) => {
    const raw = String(value || '').trim();
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return raw;
    return `${m[2]}/${m[3]}/${m[1]}`;
  };

  const isDeletedChatMessage = (message) => String(message || '').startsWith(CHAT_DELETED_PREFIX);
  const markChatSeenForLayer = (layerId, atIso = new Date().toISOString()) => {
    const key = String(layerId || '');
    if (!key) return;
    setChatLastSeenByLayer(prev => ({ ...prev, [key]: atIso }));
    setChatUnreadCounts(prev => ({ ...prev, [key]: 0 }));
  };

  const buildTextChatMessage = (text, reactions = {}) => (
    `${CHAT_MESSAGE_PREFIX}${JSON.stringify({ type: 'msg', text: String(text || ''), reactions: reactions || {} })}`
  );

  const buildPopupInviteMessage = (payload = {}, reactions = {}) => (
    `${CHAT_POPUP_PREFIX}${JSON.stringify({
      type: 'popup_invite',
      eventId: String(payload?.eventId || ''),
      title: String(payload?.title || ''),
      dateKey: String(payload?.dateKey || ''),
      time: payload?.time ? String(payload.time) : null,
      location: payload?.location ? String(payload.location) : null,
      maxPeople: Number(payload?.maxPeople || 0),
      noMax: Boolean(payload?.noMax),
      createdBy: String(payload?.createdBy || ''),
      createdAt: String(payload?.createdAt || new Date().toISOString()),
      reactions: reactions || {},
    })}`
  );

  const parseTextChatMessage = (message) => {
    const raw = String(message || '');
    if (!raw.startsWith(CHAT_MESSAGE_PREFIX)) return null;
    try {
      const parsed = JSON.parse(raw.slice(CHAT_MESSAGE_PREFIX.length));
      const text = String(parsed?.text || '');
      if (!text) return null;
      const reactions = (parsed && typeof parsed.reactions === 'object' && parsed.reactions !== null) ? parsed.reactions : {};
      return { text, reactions };
    } catch {
      return null;
    }
  };

  const parsePopupInviteMessage = (message) => {
    const raw = String(message || '');
    if (!raw.startsWith(CHAT_POPUP_PREFIX)) return null;
    try {
      const parsed = JSON.parse(raw.slice(CHAT_POPUP_PREFIX.length));
      const eventId = String(parsed?.eventId || '').trim();
      const title = String(parsed?.title || '').trim();
      const dateKey = String(parsed?.dateKey || '').trim();
      if (!eventId || !title || !dateKey) return null;
      return {
        eventId,
        title,
        dateKey,
        time: parsed?.time ? String(parsed.time) : null,
        location: parsed?.location ? String(parsed.location) : null,
        maxPeople: Math.max(0, Number(parsed?.maxPeople || 0)),
        noMax: Boolean(parsed?.noMax),
        createdBy: String(parsed?.createdBy || ''),
        createdAt: String(parsed?.createdAt || ''),
        reactions: normalizeChatReactions(parsed?.reactions),
      };
    } catch {
      return null;
    }
  };

  const normalizeChatReactions = (reactions) => {
    const next = {};
    if (!reactions || typeof reactions !== 'object') return next;
    Object.entries(reactions).forEach(([emoji, users]) => {
      const ids = Array.isArray(users) ? Array.from(new Set(users.map(v => String(v || '').trim()).filter(Boolean))) : [];
      if (ids.length > 0) next[String(emoji)] = ids;
    });
    return next;
  };

  const toggleChatReaction = (reactions, emoji, userId) => {
    const current = normalizeChatReactions(reactions);
    const key = String(emoji || '').trim();
    const uid = String(userId || '').trim();
    if (!key || !uid) return current;
    const set = new Set(current[key] || []);
    if (set.has(uid)) set.delete(uid); else set.add(uid);
    if (set.size === 0) delete current[key];
    else current[key] = Array.from(set);
    return current;
  };

  const buildPollMessage = ({ question, dateKey, createdBy, dimensions = [], optionsByDimension = {} }) => {
    const dims = ['what', 'where', 'when'].filter((key) => (dimensions || []).includes(key));
    const normalizedOptions = {
      what: Array.isArray(optionsByDimension?.what) ? optionsByDimension.what.map(v => String(v || '').trim()).filter(Boolean).slice(0, 3) : [],
      where: Array.isArray(optionsByDimension?.where) ? optionsByDimension.where.map(v => String(v || '').trim()).filter(Boolean).slice(0, 3) : [],
      when: Array.isArray(optionsByDimension?.when) ? optionsByDimension.when.map(v => String(v || '').trim()).filter(Boolean).slice(0, 3) : [],
    };
    const payload = {
      type: 'poll',
      question: String(question || '').trim(),
      dateKey: String(dateKey || ''),
      mode: 'structured',
      dimensions: dims,
      optionsByDimension: normalizedOptions,
      votesByDimension: { what: {}, where: {}, when: {} },
      winners: { what: null, where: null, when: null },
      reactions: {},
      resolved: false,
      createdEventId: null,
      createdBy: String(createdBy || '').trim() || 'Member',
      createdAt: new Date().toISOString(),
    };
    return `${CHAT_POLL_PREFIX}${JSON.stringify(payload)}`;
  };

  const buildLegacyPollMessage = ({ question, dateKey, options, createdBy, pollFor = 'what', eventTitle = null }) => {
    const payload = {
      type: 'poll',
      question: String(question || '').trim(),
      dateKey: String(dateKey || ''),
      options: (options || []).map(v => String(v || '').trim()).filter(Boolean).slice(0, 8),
      pollFor: ['when', 'what', 'both'].includes(String(pollFor)) ? String(pollFor) : 'what',
      eventTitle: eventTitle ? String(eventTitle).trim() : null,
      votes: {},
      resolved: false,
      winnerIndex: null,
      reactions: {},
      createdEventId: null,
      createdBy: String(createdBy || '').trim() || 'Member',
      createdAt: new Date().toISOString(),
    };
    return `${CHAT_POLL_PREFIX}${JSON.stringify(payload)}`;
  };

  const coercePollIndex = (value, optionCount = null) => {
    if (value === null || value === undefined || value === '') return null;
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isInteger(n) || n < 0) return null;
    if (Number.isInteger(optionCount) && optionCount >= 0 && n >= optionCount) return null;
    return n;
  };

  const parsePollMessage = (message) => {
    const raw = String(message || '');
    if (!raw.startsWith(CHAT_POLL_PREFIX)) return null;
    const json = raw.slice(CHAT_POLL_PREFIX.length);
    try {
      const parsed = JSON.parse(json);
      if (String(parsed?.type || '') !== 'poll' || !parsed?.question) return null;
      const dimensions = Array.isArray(parsed?.dimensions)
        ? parsed.dimensions.map(v => String(v || '').trim().toLowerCase()).filter(v => ['what', 'where', 'when'].includes(v))
        : [];

      if (String(parsed?.mode || '') === 'structured' && dimensions.length > 0) {
        const optionsByDimension = {
          what: Array.isArray(parsed?.optionsByDimension?.what) ? parsed.optionsByDimension.what.map(v => String(v || '').trim()).filter(Boolean) : [],
          where: Array.isArray(parsed?.optionsByDimension?.where) ? parsed.optionsByDimension.where.map(v => String(v || '').trim()).filter(Boolean) : [],
          when: Array.isArray(parsed?.optionsByDimension?.when) ? parsed.optionsByDimension.when.map(v => String(v || '').trim()).filter(Boolean) : [],
        };
        const votesByDimension = { what: {}, where: {}, when: {} };
        const rawVotes = parsed?.votesByDimension && typeof parsed.votesByDimension === 'object' ? parsed.votesByDimension : {};
        ['what', 'where', 'when'].forEach((key) => {
          const options = optionsByDimension[key] || [];
          const raw = rawVotes[key] && typeof rawVotes[key] === 'object' ? rawVotes[key] : {};
          Object.entries(raw).forEach(([uid, idx]) => {
            const n = Number(idx);
            if (String(uid || '').trim() && Number.isInteger(n) && n >= 0 && n < options.length) {
              votesByDimension[key][String(uid)] = n;
            }
          });
        });
        const winners = { what: null, where: null, when: null };
        const rawWinners = parsed?.winners && typeof parsed.winners === 'object' ? parsed.winners : {};
        ['what', 'where', 'when'].forEach((key) => {
          const n = coercePollIndex(rawWinners[key], (optionsByDimension[key] || []).length);
          if (Number.isInteger(n)) winners[key] = n;
        });
        return {
          ...parsed,
          mode: 'structured',
          question: String(parsed.question),
          dateKey: String(parsed.dateKey || ''),
          dimensions,
          optionsByDimension,
          votesByDimension,
          winners,
          reactions: normalizeChatReactions(parsed?.reactions),
          resolved: Boolean(parsed.resolved),
          createdEventId: parsed.createdEventId ? String(parsed.createdEventId) : null,
        };
      }

      // Backward compatibility for legacy single-dimension polls.
      const options = Array.isArray(parsed?.options) ? parsed.options.map(v => String(v || '').trim()).filter(Boolean) : [];
      if (options.length < 2) return null;
      const votesObj = (parsed && typeof parsed.votes === 'object' && parsed.votes !== null) ? parsed.votes : {};
      const votes = {};
      Object.entries(votesObj).forEach(([uid, idx]) => {
        const n = Number(idx);
        if (String(uid || '').trim() && Number.isInteger(n) && n >= 0 && n < options.length) votes[String(uid)] = n;
      });
      return {
        ...parsed,
        mode: 'legacy',
        question: String(parsed.question),
        dateKey: String(parsed.dateKey || ''),
        options,
        pollFor: ['when', 'what', 'both'].includes(String(parsed?.pollFor || '')) ? String(parsed.pollFor) : 'both',
        eventTitle: parsed?.eventTitle ? String(parsed.eventTitle) : null,
        votes,
        reactions: normalizeChatReactions(parsed?.reactions),
        resolved: Boolean(parsed.resolved),
        winnerIndex: coercePollIndex(parsed?.winnerIndex, options.length),
        createdEventId: parsed.createdEventId ? String(parsed.createdEventId) : null,
      };
    } catch {
      return null;
    }
  };

  const getPollVoteCounts = (poll, dimensionKey = null) => {
    if (poll?.mode === 'structured') {
      const dim = String(dimensionKey || '').toLowerCase();
      const opts = poll?.optionsByDimension?.[dim] || [];
      const counts = new Array(opts.length).fill(0);
      Object.values(poll?.votesByDimension?.[dim] || {}).forEach((idx) => {
        if (Number.isInteger(idx) && idx >= 0 && idx < counts.length) counts[idx] += 1;
      });
      return counts;
    }
    const counts = new Array((poll?.options || []).length).fill(0);
    Object.values(poll?.votes || {}).forEach((idx) => {
      if (Number.isInteger(idx) && idx >= 0 && idx < counts.length) counts[idx] += 1;
    });
    return counts;
  };

  const getPollMajorityWinner = (poll, dimensionKey = null, eligibleVoterCount = null) => {
    const counts = getPollVoteCounts(poll, dimensionKey);
    const totalVotes = counts.reduce((sum, n) => sum + n, 0);
    const eligibleCount = Number.isInteger(Number(eligibleVoterCount)) && Number(eligibleVoterCount) > 0
      ? Number(eligibleVoterCount)
      : null;
    const votesNeeded = eligibleCount ? Math.floor(eligibleCount / 2) + 1 : 2;
    if (totalVotes < votesNeeded) return { winnerIndex: null, counts, totalVotes, votesNeeded };
    let winnerIndex = null;
    counts.forEach((n, idx) => {
      if (n >= votesNeeded) winnerIndex = idx;
    });
    return { winnerIndex, counts, totalVotes, votesNeeded };
  };

  const getEligiblePollVoterCount = async (layerId) => {
    const normalizedLayerId = String(layerId || '').trim();
    if (!normalizedLayerId) return 2;
    const participants = new Set();
    const ownerId = String(activeLayerOwnerId || user?.id || '').trim();
    if (ownerId) participants.add(`owner:${ownerId}`);

    try {
      const { data, error } = await supabase
        .from('shared_access')
        .select('shared_with_id,shared_with_email,shared_with_phone')
        .eq('layer_id', normalizedLayerId);
      if (!error) {
        (data || []).forEach((row) => {
          const identity = String(row?.shared_with_id || '').trim()
            || normalizeEmail(row?.shared_with_email)
            || normalizePhoneNumber(row?.shared_with_phone);
          if (identity) participants.add(`share:${identity}`);
        });
        return Math.max(1, participants.size);
      }
    } catch {}

    // Fallback for restrictive RLS: use locally known shares plus owner.
    (myShares || []).forEach((row) => {
      const rowLayerId = String(row?.layer_id || row?.calendar_id || '').trim();
      if (rowLayerId !== normalizedLayerId) return;
      const identity = String(row?.shared_with_id || '').trim()
        || normalizeEmail(row?.shared_with_email)
        || normalizePhoneNumber(row?.shared_with_phone);
      if (identity) participants.add(`share:${identity}`);
    });

    if (String(activeLayerOwnerId || '') !== String(user?.id || '')) {
      const me = String(user?.id || '').trim()
        || normalizeEmail(user?.email)
        || normalizePhoneNumber(user?.phone);
      if (me) participants.add(`share:${me}`);
    }
    return Math.max(1, participants.size);
  };

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
  const activeLayerIdRef = useRef(activeLayerId);
  useEffect(() => {
    activeLayerIdRef.current = activeLayerId;
  }, [activeLayerId]);
  useEffect(() => {
    setSubCalendars([]);
    setActiveSubCalendar(null);
  }, [activeLayerId]);
  useEffect(() => {
    if (!showDateDetailModal) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [showDateDetailModal]);
  useEffect(() => {
    if (!showTitleStyleModal) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [showTitleStyleModal]);
  const activeLayer = layers.find(layer => layer.id === activeLayerId) || null;
  const activeLayerOwnerId = activeLayer?.owner_id || user?.id || null;
  const isActiveLayerOwner = String(activeLayerOwnerId || '') === String(user?.id || '');
  const activeShareRowForMe = (sharedCalendars || []).find((row) => {
    const layerId = String(row?.layer_id || row?.calendar_id || '');
    if (layerId !== String(activeLayerId || '')) return false;
    const byId = String(row?.shared_with_id || '') === String(user?.id || '');
    const byEmail = normalizeEmail(row?.shared_with_email) && normalizeEmail(row?.shared_with_email) === normalizeEmail(user?.email);
    const byPhone = normalizePhoneNumber(row?.shared_with_phone) && normalizePhoneNumber(row?.shared_with_phone) === normalizePhoneNumber(user?.phone);
    return byId || byEmail || byPhone;
  }) || null;
  const canEditActiveLayer = isActiveLayerOwner || !activeShareRowForMe || activeShareRowForMe?.can_edit !== false;
  const normalizedActiveLayerName = String(activeLayer?.name || calendarTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const canEditEllieMilesSharedTitle = normalizedActiveLayerName === 'elliemiles' && canEditActiveLayer;
  const canEditActiveLayerTitle = isActiveLayerOwner || canEditEllieMilesSharedTitle;
  const assertCanEditActiveLayer = (actionLabel = 'make changes to this calendar') => {
    if (canEditActiveLayer) return true;
    alert(`Read-only access: you can chat and join events, but you cannot ${actionLabel}.`);
    return false;
  };

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

  const loadLayersForUser = async (userId, userEmail, userPhone) => {
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
        title_style: createDefaultLayerTitleStyle(),
        page_theme: createDefaultLayerPageTheme(),
      };
      let { data: insertedLayer, error: insertErr } = await supabase
        .from('calendar_layers')
        .insert(defaultPayload)
        .select('*')
        .single();
      if (insertErr && /column .*title_style|column .*page_theme|schema cache/i.test(String(insertErr.message || ''))) {
        const fallbackPayload = { ...defaultPayload };
        delete fallbackPayload.title_style;
        delete fallbackPayload.page_theme;
        const fallback = await supabase
          .from('calendar_layers')
          .insert(fallbackPayload)
          .select('*')
          .single();
        insertedLayer = fallback.data;
        insertErr = fallback.error;
      }
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

    const shareRecipientFilter = buildShareRecipientFilter(userId, userEmail, userPhone);
    let sharedRowsQuery = supabase
      .from('shared_access')
      .select('layer_id');
    if (shareRecipientFilter) sharedRowsQuery = sharedRowsQuery.or(shareRecipientFilter);
    const { data: sharedRows } = await sharedRowsQuery;
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

    const merged = Array.from(new Map([...(ownedLayers || []), ...sharedLayers].map(layer => [String(layer.id), normalizeLayerRow(layer)])).values());
    setLayers(merged);
    return merged;
  };

  const parsePublicTags = (raw) => {
    if (Array.isArray(raw)) return raw.map(v => String(v || '').trim()).filter(Boolean);
    const txt = String(raw || '').trim();
    if (!txt) return [];
    try {
      const parsed = JSON.parse(txt);
      if (Array.isArray(parsed)) return parsed.map(v => String(v || '').trim()).filter(Boolean);
    } catch {}
    return txt.split(',').map(v => String(v || '').trim()).filter(Boolean);
  };

  function normalizeHexColor(value, fallback) {
    const txt = String(value || '').trim();
    return /^#([0-9a-fA-F]{6})$/.test(txt) ? txt.toLowerCase() : fallback;
  }

  function hexToRgb(value) {
    const hex = normalizeHexColor(value, '#000000').slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  function mixHexColors(base, target, weight = 0.5) {
    const a = hexToRgb(base);
    const b = hexToRgb(target);
    const mix = (x, y) => Math.round((x * (1 - weight)) + (y * weight));
    return `#${[mix(a.r, b.r), mix(a.g, b.g), mix(a.b, b.b)].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  }

  function hexToRgba(value, alpha = 1) {
    const { r, g, b } = hexToRgb(value);
    const normalizedAlpha = Math.max(0, Math.min(1, Number(alpha)));
    return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`;
  }

  function isLightHexColor(value) {
    const { r, g, b } = hexToRgb(value);
    const luminance = ((0.2126 * r) + (0.7152 * g) + (0.0722 * b)) / 255;
    return luminance > 0.72;
  }

  const getLayerTitleStyleStorageKey = (layerId) => `calendar-layer-title-style-${String(layerId || '').trim()}`;
  const getLayerPageThemeStorageKey = (layerId) => `calendar-layer-page-theme-${String(layerId || '').trim()}`;

  function normalizeLayerTitleStyle(raw) {
    let parsed = raw;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = {};
      }
    }
    if (!parsed || typeof parsed !== 'object') parsed = {};
    const mode = String(parsed?.mode || '').trim() === 'solid' ? 'solid' : 'gradient';
    return {
      mode,
      solidColor: normalizeHexColor(parsed?.solidColor, DEFAULT_LAYER_TITLE_STYLE.solidColor),
      gradientFrom: normalizeHexColor(parsed?.gradientFrom, DEFAULT_LAYER_TITLE_STYLE.gradientFrom),
      gradientVia: normalizeHexColor(parsed?.gradientVia, DEFAULT_LAYER_TITLE_STYLE.gradientVia),
      gradientTo: normalizeHexColor(parsed?.gradientTo, DEFAULT_LAYER_TITLE_STYLE.gradientTo),
    };
  }

  const readStoredLayerTitleStyle = (layerId) => {
    const lid = String(layerId || '').trim();
    if (!lid || typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(getLayerTitleStyleStorageKey(lid));
      if (!raw) return null;
      return normalizeLayerTitleStyle(raw);
    } catch {
      return null;
    }
  };

  const writeStoredLayerTitleStyle = (layerId, style) => {
    const lid = String(layerId || '').trim();
    if (!lid || typeof window === 'undefined') return;
    try {
      localStorage.setItem(getLayerTitleStyleStorageKey(lid), JSON.stringify(normalizeLayerTitleStyle(style)));
    } catch {}
  };

  function getLayerTitleDisplayStyle(style) {
    const normalized = normalizeLayerTitleStyle(style);
    if (normalized.mode === 'solid') {
      return {
        color: normalized.solidColor,
        backgroundImage: 'none',
        WebkitTextFillColor: normalized.solidColor,
      };
    }
    return {
      backgroundImage: `linear-gradient(90deg, ${normalized.gradientFrom} 0%, ${normalized.gradientVia} 55%, ${normalized.gradientTo} 100%)`,
      color: 'transparent',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    };
  }

  const derivePageThemeFromTitleStyle = (style) => {
    const normalized = normalizeLayerTitleStyle(style);
    if (normalized.mode === 'solid') {
      return {
        matchTitle: true,
        accent: normalized.solidColor,
        backgroundFrom: mixHexColors(normalized.solidColor, '#ffffff', 0.9),
        backgroundVia: mixHexColors(normalized.solidColor, '#ffffff', 0.82),
        backgroundTo: mixHexColors(normalized.solidColor, '#dbeafe', 0.72),
      };
    }
    return {
      matchTitle: true,
      accent: normalized.gradientVia,
      backgroundFrom: mixHexColors(normalized.gradientFrom, '#ffffff', 0.88),
      backgroundVia: mixHexColors(normalized.gradientVia, '#ffffff', 0.84),
      backgroundTo: mixHexColors(normalized.gradientTo, '#ffffff', 0.8),
    };
  };

  function normalizeLayerPageTheme(raw, titleStyle = DEFAULT_LAYER_TITLE_STYLE) {
    let parsed = raw;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = {};
      }
    }
    if (!parsed || typeof parsed !== 'object') parsed = {};
    const fallback = parsed?.matchTitle ? derivePageThemeFromTitleStyle(titleStyle) : DEFAULT_LAYER_PAGE_THEME;
    return {
      matchTitle: parsed?.matchTitle === true,
      accent: normalizeHexColor(parsed?.accent, fallback.accent),
      backgroundFrom: normalizeHexColor(parsed?.backgroundFrom, fallback.backgroundFrom),
      backgroundVia: normalizeHexColor(parsed?.backgroundVia, fallback.backgroundVia),
      backgroundTo: normalizeHexColor(parsed?.backgroundTo, fallback.backgroundTo),
      coverOpacity: Math.max(0, Math.min(1, Number(parsed?.coverOpacity ?? fallback.coverOpacity ?? DEFAULT_LAYER_PAGE_THEME.coverOpacity))),
    };
  }

  const readStoredLayerPageTheme = (layerId, titleStyle) => {
    const lid = String(layerId || '').trim();
    if (!lid || typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(getLayerPageThemeStorageKey(lid));
      if (!raw) return null;
      return normalizeLayerPageTheme(raw, titleStyle);
    } catch {
      return null;
    }
  };

  const writeStoredLayerPageTheme = (layerId, theme, titleStyle) => {
    const lid = String(layerId || '').trim();
    if (!lid || typeof window === 'undefined') return;
    try {
      localStorage.setItem(getLayerPageThemeStorageKey(lid), JSON.stringify(normalizeLayerPageTheme(theme, titleStyle)));
    } catch {}
  };

  const activeLayerTitleStyle = normalizeLayerTitleStyle(activeLayer?.title_style);
  const activeLayerTitleTextStyle = getLayerTitleDisplayStyle(activeLayerTitleStyle);
  const activeLayerPageTheme = normalizeLayerPageTheme(activeLayer?.page_theme, activeLayerTitleStyle);
  const activeLayerNameKey = String(activeLayer?.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  const useLegacyEllieMilesTheme = activeLayerNameKey === 'elliemiles';
  const effectiveCoverOpacity = coverOpacityPreview == null
    ? activeLayerPageTheme.coverOpacity
    : Math.max(0, Math.min(1, Number(coverOpacityPreview)));
  const themeAccentSoftBg = mixHexColors(activeLayerPageTheme.accent, '#ffffff', darkMode ? 0.78 : 0.82);
  const themeAccentSofterBg = mixHexColors(activeLayerPageTheme.accent, '#ffffff', darkMode ? 0.88 : 0.9);
  const themeAccentBorder = mixHexColors(activeLayerPageTheme.accent, '#ffffff', darkMode ? 0.5 : 0.62);
  const coverFadeSurfaceColor = darkMode ? '#1f2937' : '#ffffff';
  const themeAccentGradient = activeLayerTitleStyle.mode === 'solid'
    ? `linear-gradient(135deg, ${mixHexColors(activeLayerPageTheme.accent, '#ffffff', 0.05)} 0%, ${activeLayerPageTheme.accent} 100%)`
    : `linear-gradient(135deg, ${activeLayerTitleStyle.gradientFrom} 0%, ${activeLayerTitleStyle.gradientVia} 55%, ${activeLayerTitleStyle.gradientTo} 100%)`;
  const themedPageBackgroundStyle = darkMode
    ? {
      backgroundImage: `linear-gradient(135deg, ${mixHexColors(activeLayerPageTheme.backgroundFrom, '#111827', 0.85)} 0%, ${mixHexColors(activeLayerPageTheme.backgroundVia, '#111827', 0.9)} 55%, ${mixHexColors(activeLayerPageTheme.backgroundTo, '#111827', 0.93)} 100%)`,
      paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
      paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
      paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
      paddingBottom: 'max(4.75rem, env(safe-area-inset-bottom))',
    }
    : {
      backgroundImage: `linear-gradient(135deg, ${activeLayerPageTheme.backgroundFrom} 0%, ${activeLayerPageTheme.backgroundVia} 50%, ${activeLayerPageTheme.backgroundTo} 100%)`,
      paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
      paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
      paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
      paddingBottom: 'max(4.75rem, env(safe-area-inset-bottom))',
    };
  const themeAccentButtonStyle = {
    backgroundColor: activeLayerPageTheme.accent,
    color: isLightHexColor(activeLayerPageTheme.accent) ? '#111111' : '#ffffff',
  };
  const themeAccentTextStyle = { color: isLightHexColor(activeLayerPageTheme.accent) ? '#111111' : activeLayerPageTheme.accent };
  const themeAccentSoftButtonStyle = {
    backgroundColor: themeAccentSoftBg,
    color: isLightHexColor(activeLayerPageTheme.accent) ? '#111111' : activeLayerPageTheme.accent,
    borderColor: themeAccentBorder,
  };
  const themeAccentHeadingStyle = {
    color: activeLayerPageTheme.accent,
  };
  const themeSelectedSurfaceStyle = {
    backgroundImage: themeAccentGradient,
    color: '#ffffff',
    boxShadow: `0 10px 24px ${mixHexColors(activeLayerPageTheme.accent, '#000000', 0.72)}22`,
  };
  const themeTodaySurfaceStyle = {
    backgroundImage: `linear-gradient(135deg, ${themeAccentSofterBg} 0%, ${themeAccentSoftBg} 100%)`,
    color: darkMode ? '#f3f4f6' : '#111827',
    borderColor: themeAccentBorder,
  };

  const normalizeLayerRow = (row) => ({
    ...row,
    icon_url: String(row?.icon_url || '').trim() || null,
    header_bg_url: String(row?.header_bg_url || '').trim() || null,
    public_description: String(row?.public_description || '').trim(),
    public_tags: parsePublicTags(row?.public_tags),
    title_style: normalizeLayerTitleStyle(readStoredLayerTitleStyle(row?.id) || row?.title_style),
    page_theme: normalizeLayerPageTheme(readStoredLayerPageTheme(row?.id, row?.title_style) || row?.page_theme, row?.title_style),
  });

  const normalizePublicCalendarRow = (row, memberCount = 0) => ({
    ...normalizeLayerRow(row),
    member_count: Number(memberCount || 0),
  });

  const mergeLayerIntoState = (layerRow) => {
    const incoming = layerRow || {};
    const lid = String(incoming?.id || '').trim();
    if (!lid) return normalizeLayerRow(incoming);
    const existing = (layers || []).find(item => String(item?.id || '') === lid)
      || (publicCalendars || []).find(item => String(item?.id || '') === lid)
      || {};
    const normalized = normalizeLayerRow({ ...existing, ...incoming });
    setLayers(prev => {
      const found = prev.some(item => String(item?.id || '') === lid);
      return found
        ? prev.map(item => (String(item?.id || '') === lid ? { ...item, ...normalized } : item))
        : [...prev, normalized];
    });
    setPublicCalendars(prev => prev.map(item => (
      String(item?.id || '') === lid
        ? { ...item, ...normalized }
        : item
    )));
    writeStoredLayerTitleStyle(lid, normalized?.title_style);
    writeStoredLayerPageTheme(lid, normalized?.page_theme, normalized?.title_style);
    return normalized;
  };

  const mapSupabaseEventRow = (event, currentUserId) => ({
    id: event.id,
    title: event.title,
    time: event.time,
    date: event.date,
    category: event.category,
    description: String(event?.description || '').trim(),
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
    isShared: String(event.user_id || '') !== String(currentUserId || ''),
  });

  const loadPublicCalendars = async () => {
    if (!user?.id) {
      setPublicCalendars([]);
      setExploreError('');
      return;
    }
    setExploreLoading(true);
    setExploreError('');
    try {
      const { data: rows, error } = await supabase
        .from('calendar_layers')
        .select('id,name,owner_id,created_by,created_at,is_public,public_description,public_tags')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(300);

      if (error) {
        if (/column .*is_public|schema cache|42P01/i.test(String(error.message || ''))) {
          setPublicCalendars([]);
          setExploreError('Explore needs DB setup for public calendars.');
          return;
        }
        throw error;
      }

      const ids = (rows || []).map(r => String(r?.id || '')).filter(Boolean);
      let countsMap = {};
      if (ids.length > 0) {
        const { data: memberRows } = await supabase
          .from('shared_access')
          .select('layer_id')
          .in('layer_id', ids);
        countsMap = (memberRows || []).reduce((acc, row) => {
          const key = String(row?.layer_id || '');
          if (!key) return acc;
          acc[key] = Number(acc[key] || 0) + 1;
          return acc;
        }, {});
      }

      const normalized = (rows || []).map((row) => normalizePublicCalendarRow(row, countsMap[String(row?.id || '')] || 0));
      setPublicCalendars(normalized);
      setExpandedExploreDescriptions({});
    } catch (err) {
      console.error('Error loading public calendars:', err);
      setExploreError(`Could not load Explore calendars: ${String(err?.message || 'Unknown error')}`);
    } finally {
      setExploreLoading(false);
    }
  };

  const openPublishLayerModal = (layer) => {
    const lid = String(layer?.id || '').trim();
    if (!lid) return;
    setPublishLayerTargetId(lid);
    setPublishLayerDescription(String(layer?.public_description || '').trim());
    const tags = Array.isArray(layer?.public_tags) ? layer.public_tags : parsePublicTags(layer?.public_tags);
    setPublishLayerTagsInput(tags.join(', '));
    setPublishPolicyConfirmed(Boolean(layer?.is_public));
    setShowPublishLayerModal(true);
  };

  const openCalendarReportModal = (layer) => {
    setReportCalendarTarget(layer || null);
    setReportCalendarReason('copyright');
    setReportCalendarDetails('');
    setShowCalendarReportModal(true);
  };

  const publishLayerCalendar = async (layerId, publish, details = {}) => {
    const lid = String(layerId || '').trim();
    if (!lid || !user?.id) return false;
    const layer = (layers || []).find(item => String(item?.id || '') === lid)
      || (publicCalendars || []).find(item => String(item?.id || '') === lid);
    if (!layer || String(layer?.owner_id || '') !== String(user.id)) {
      alert('Only the calendar owner can edit public description/settings.');
      return false;
    }
    const nextPublish = !!publish;
    let nextDescription = String((details?.description ?? layer?.public_description) || '').trim();
    let nextTags = Array.isArray(details?.tags)
      ? details.tags
      : parsePublicTags(details?.tags ?? layer?.public_tags);

    const payload = {
      is_public: nextPublish,
      public_description: nextPublish ? (nextDescription || null) : null,
      public_tags: nextPublish ? (nextTags.length > 0 ? nextTags : null) : null,
    };
    const primary = await supabase
      .from('calendar_layers')
      .update(payload)
      .eq('id', lid)
      .eq('owner_id', user.id)
      .select('*')
      .maybeSingle();
    let error = primary.error;
    let updatedLayer = primary.data || null;
    if (!updatedLayer && !error) {
      const fallback = await supabase
        .from('calendar_layers')
        .update(payload)
        .eq('id', lid)
        .select('*')
        .maybeSingle();
      error = fallback.error;
      updatedLayer = fallback.data || null;
    }
    if (error || !updatedLayer) {
      console.error('Publish calendar update failed:', error || 'No rows updated');
      if (/column .*is_public|schema cache/i.test(String(error?.message || ''))) {
        alert('Public calendar columns are missing. Run the SQL migration first.');
      } else if (!updatedLayer) {
        alert('Could not save calendar description/settings. The calendar row was not updated.');
      } else {
        alert(`Could not update public setting: ${error?.message || 'Unknown error'}`);
      }
      return false;
    }

    mergeLayerIntoState(updatedLayer);
    setLayerRefreshToken(prev => prev + 1);
    if (bottomNavTab === 'explore') loadPublicCalendars();
    return true;
  };

  const submitPublishLayerModal = async () => {
    const layerId = String(publishLayerTargetId || '').trim();
    if (!layerId) return;
    if (!publishTargetIsPublic && !publishPolicyConfirmed) {
      alert('Confirm that you have rights to publish this content before making the calendar public.');
      return;
    }
    const tags = parsePublicTags(publishLayerTagsInput);
    const ok = await publishLayerCalendar(layerId, true, {
      description: publishLayerDescription,
      tags,
    });
    if (!ok) return;
    setShowPublishLayerModal(false);
    setPublishLayerTargetId(null);
    setPublishLayerDescription('');
    setPublishLayerTagsInput('');
  };

  const submitCalendarReport = async () => {
    const layerId = String(reportCalendarTarget?.id || '').trim();
    if (!layerId || !user?.id || submittingCalendarReport) return;
    setSubmittingCalendarReport(true);
    try {
      const payload = {
        calendar_id: layerId,
        reported_by: user.id,
        reason: reportCalendarReason,
        details: String(reportCalendarDetails || '').trim() || null,
        status: 'open',
      };
      const { error } = await supabase.from('calendar_reports').insert(payload);
      if (error) {
        if (/relation .*calendar_reports|does not exist|schema cache/i.test(String(error?.message || ''))) {
          alert('Reporting is not set up in Supabase yet. Run the SQL migration first.');
        } else {
          alert(`Could not submit report: ${error.message || 'Unknown error'}`);
        }
        return;
      }
      setShowCalendarReportModal(false);
      setReportCalendarTarget(null);
      setReportCalendarDetails('');
      alert('Report submitted. We can review and remove public calendars if needed.');
    } finally {
      setSubmittingCalendarReport(false);
    }
  };

  const joinPublicCalendar = async (layer) => {
    const layerId = String(layer?.id || '').trim();
    if (!layerId || !user?.id) return;
    const isAlreadyVisible = (layers || []).some(item => String(item?.id || '') === layerId);
    if (isAlreadyVisible) return;
    const payload = {
      owner_id: layer.owner_id,
      layer_id: layerId,
      calendar_id: layerId,
      shared_with_id: user.id,
      shared_with_email: normalizeEmail(user?.email) || null,
      shared_with_phone: normalizePhoneNumber(user?.phone) || null,
      can_edit: false,
    };
    let { error } = await supabase.from('shared_access').insert(payload);
    if (error && /column .*can_edit|schema cache/i.test(String(error.message || ''))) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.can_edit;
      const fallback = await supabase.from('shared_access').insert(fallbackPayload);
      error = fallback.error;
    }
    if (error && !/duplicate key|already exists|unique constraint|23505/i.test(String(error.message || ''))) {
      alert(`Could not join calendar: ${error.message || 'Unknown error'}`);
      return;
    }
    await loadLayersForUser(user.id, user.email, user.phone);
    setLayerRefreshToken(prev => prev + 1);
  };

  const leavePublicCalendarById = async (layerId) => {
    const lid = String(layerId || '').trim();
    if (!lid || !user?.id) return;
    const myEmail = normalizeEmail(user?.email);
    const myPhone = normalizePhoneNumber(user?.phone);
    const shareRecipientFilter = buildShareRecipientFilter(user.id, myEmail, myPhone);
    let query = supabase
      .from('shared_access')
      .delete()
      .eq('layer_id', lid);
    if (shareRecipientFilter) query = query.or(shareRecipientFilter);
    const { error } = await query;
    if (error) {
      alert(`Could not leave calendar: ${error.message || 'Unknown error'}`);
      return;
    }
    await loadLayersForUser(user.id, user.email, user.phone);
    setLayerRefreshToken(prev => prev + 1);
  };

  const createLayerCalendar = async () => {
    const name = newLayerName.trim();
    if (!name || !user?.id) return;
    const normalizedName = name.toLowerCase();
    const duplicateOwned = (layers || []).some(layer =>
      String(layer?.owner_id) === String(user.id) &&
      String(layer?.name || '').trim().toLowerCase() === normalizedName
    );
    if (duplicateOwned) {
      setShareMessage('You already have a calendar with this name.');
      return;
    }
    const payload = {
      owner_id: user.id,
      name,
      is_default: false,
      created_by: currentUser || user.email || 'User',
      icon_url: null,
      header_bg_url: null,
      title_style: createDefaultLayerTitleStyle(),
      page_theme: createDefaultLayerPageTheme(),
    };
    let { data, error } = await supabase
      .from('calendar_layers')
      .insert(payload)
      .select('*')
      .single();
    if (error && /column .*icon_url|column .*header_bg_url|schema cache/i.test(String(error.message || ''))) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.icon_url;
      delete fallbackPayload.header_bg_url;
      if (/column .*title_style|column .*page_theme|schema cache/i.test(String(error.message || ''))) {
        delete fallbackPayload.title_style;
        delete fallbackPayload.page_theme;
      }
      const fallback = await supabase
        .from('calendar_layers')
        .insert(fallbackPayload)
        .select('*')
        .single();
      data = fallback.data;
      error = fallback.error;
    }
    if (error && /column .*title_style|column .*page_theme|schema cache/i.test(String(error.message || ''))) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.icon_url;
      delete fallbackPayload.header_bg_url;
      delete fallbackPayload.title_style;
      delete fallbackPayload.page_theme;
      const fallback = await supabase
        .from('calendar_layers')
        .insert(fallbackPayload)
        .select('*')
        .single();
      data = fallback.data;
      error = fallback.error;
    }
    if (error) {
      setShareMessage(`Could not create calendar: ${error.message}`);
      return;
    }
    const created = normalizeLayerRow(data || payload);
    setLayers(prev => [...prev, created]);
    setActiveLayerId(created.id);
    localStorage.setItem(`active-layer-${user.id}`, created.id);
    setNewLayerName('');
    setShowLayerModal(false);
  };

  const uploadLayerMedia = async (kind, file) => {
    const mediaKind = String(kind || '').trim();
    if (!file || !user?.id || !activeLayerId || !isActiveLayerOwner) return false;
    if (mediaKind !== 'icon' && mediaKind !== 'header') return false;
    if (!String(file.type || '').startsWith('image/')) {
      alert('Please choose an image file.');
      return false;
    }

    setUploadingLayerMedia(true);
    try {
      const processedFile = file;
      const ext = String((processedFile?.type || '').split('/')[1] || (String(file.name || '').split('.').pop() || 'jpg')).toLowerCase();
      const filename = `layer-media/${activeLayerId}/${mediaKind}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const buckets = ['layer-media', 'layer_media', 'trip-photos', 'trip_photos'];
      let selectedBucket = null;
      let lastError = null;

      for (const bucket of buckets) {
        const { error: uploadErr } = await supabase.storage.from(bucket).upload(filename, processedFile, { contentType: processedFile.type || file.type });
        if (!uploadErr) {
          selectedBucket = bucket;
          lastError = null;
          break;
        }
        lastError = uploadErr;
        if (!/bucket.*not found/i.test(String(uploadErr?.message || ''))) break;
      }

      if (!selectedBucket) {
        alert(`Could not upload image: ${String(lastError?.message || 'Unknown upload error')}`);
        return false;
      }

      const { data: urlData } = supabase.storage.from(selectedBucket).getPublicUrl(filename);
      const publicUrl = String(urlData?.publicUrl || '').trim();
      if (!publicUrl) {
        alert('Upload succeeded but no public URL was returned.');
        return false;
      }

      const field = mediaKind === 'icon' ? 'icon_url' : 'header_bg_url';
      const primaryUpdate = await supabase
        .from('calendar_layers')
        .update({ [field]: publicUrl })
        .eq('id', activeLayerId)
        .eq('owner_id', user.id)
        .select('*')
        .maybeSingle();
      let updateErr = primaryUpdate.error;
      let updatedLayer = primaryUpdate.data || null;
      if (updateErr || !updatedLayer) {
        // Fallback for legacy rows where owner_id is missing/misaligned.
        const fallbackUpdate = await supabase
          .from('calendar_layers')
          .update({ [field]: publicUrl })
          .eq('id', activeLayerId);
        const fallbackSelect = await supabase
          .from('calendar_layers')
          .select('*')
          .eq('id', activeLayerId)
          .maybeSingle();
        updateErr = fallbackUpdate.error || fallbackSelect.error;
        updatedLayer = fallbackSelect.data || null;
      }
      if (updateErr || !updatedLayer) {
        if (/column .*icon_url|column .*header_bg_url|schema cache/i.test(String(updateErr?.message || ''))) {
          alert('Calendar media columns are missing. Run SQL migration: add icon_url and header_bg_url to calendar_layers.');
        } else if (!updatedLayer) {
          alert('Could not save the image on this calendar. The calendar row was not updated.');
        } else {
          alert(`Could not save image on calendar: ${updateErr?.message || 'Unknown error'}`);
        }
        return false;
      }

      mergeLayerIntoState(updatedLayer);
      setLayerRefreshToken(prev => prev + 1);
      setShowLayerMediaMenu(false);
      return true;
    } catch (err) {
      console.error('Layer media upload failed:', err);
      alert(`Upload failed: ${String(err?.message || 'Unknown error')}`);
      return false;
    } finally {
      setUploadingLayerMedia(false);
      if (layerMediaInputRef.current) layerMediaInputRef.current.value = '';
    }
  };

  const openLayerMediaPicker = (kind) => {
    if (!isActiveLayerOwner || !activeLayerId) return;
    pendingLayerMediaKindRef.current = String(kind || '');
    layerMediaInputRef.current?.click();
  };

  const openLayerMediaMenu = () => {
    if (!isActiveLayerOwner || !activeLayerId || uploadingLayerMedia) return;
    setCoverOpacityPreview(null);
    setShowLayerMediaMenu(true);
  };

  const openTitleStyleModal = () => {
    if (!canEditActiveLayerTitle || !activeLayerId) return;
    setTitleNameDraft(String(calendarTitle || activeLayer?.name || '').trim());
    setTitleStyleDraft(normalizeLayerTitleStyle(activeLayer?.title_style));
    setShowTitleStyleModal(true);
  };

  const saveLayerPageTheme = async (themeInput, titleStyleInput = null) => {
    const lid = String(activeLayerId || '').trim();
    if (!lid || !user?.id || !isActiveLayerOwner) return false;
    const normalizedTitleStyle = normalizeLayerTitleStyle(titleStyleInput || activeLayer?.title_style);
    const normalizedTheme = normalizeLayerPageTheme(themeInput, normalizedTitleStyle);
    writeStoredLayerPageTheme(lid, normalizedTheme, normalizedTitleStyle);

    const primary = await supabase
      .from('calendar_layers')
      .update({ page_theme: normalizedTheme })
      .eq('id', lid)
      .eq('owner_id', user.id)
      .select('*')
      .maybeSingle();
    if (primary.error && /column .*page_theme|schema cache/i.test(String(primary.error?.message || ''))) {
      mergeLayerIntoState({ id: lid, page_theme: normalizedTheme, title_style: normalizedTitleStyle });
      return true;
    }
    if (primary.error) {
      alert(`Could not save page theme: ${primary.error.message || 'Unknown error'}`);
      return false;
    }
    mergeLayerIntoState({ ...(primary.data || { id: lid }), page_theme: normalizedTheme, title_style: normalizedTitleStyle });
    return true;
  };

  const commitCoverOpacityPreview = async () => {
    if (coverOpacityPreview == null) return;
    const nextOpacity = Math.max(0, Math.min(1, Number(coverOpacityPreview)));
    setCoverOpacityPreview(null);
    await saveLayerPageTheme({ ...activeLayerPageTheme, coverOpacity: nextOpacity }, activeLayerTitleStyle);
  };

  const saveLayerTitleStyle = async () => {
    const lid = String(activeLayerId || '').trim();
    if (!lid || !user?.id || !canEditActiveLayerTitle) return false;
    const trimmedTitle = String(titleNameDraft || '').trim();
    if (!trimmedTitle) {
      alert('Enter a calendar title.');
      return false;
    }
    if (trimmedTitle !== String(activeLayer?.name || calendarTitle || '').trim()) {
      await renameActiveLayer(trimmedTitle);
    }
    const normalizedStyle = normalizeLayerTitleStyle(titleStyleDraft);
    writeStoredLayerTitleStyle(lid, normalizedStyle);

    const primary = await supabase
      .from('calendar_layers')
      .update({ title_style: normalizedStyle })
      .eq('id', lid)
      .eq('owner_id', user.id)
      .select('*')
      .maybeSingle();
    let error = primary.error;
    let updatedLayer = primary.data || null;
    if (error && /column .*title_style|schema cache/i.test(String(error?.message || ''))) {
      mergeLayerIntoState({ id: lid, title_style: normalizedStyle });
      setShowTitleStyleModal(false);
      setPendingThemeMatchStyle(normalizedStyle);
      setShowThemeMatchPrompt(true);
      return true;
    }
    if (!updatedLayer && !error) {
      const fallbackUpdate = await supabase
        .from('calendar_layers')
        .update({ title_style: normalizedStyle })
        .eq('id', lid);
      const fallbackSelect = await supabase
        .from('calendar_layers')
        .select('*')
        .eq('id', lid)
        .maybeSingle();
      error = fallbackUpdate.error || fallbackSelect.error;
      updatedLayer = fallbackSelect.data || null;
    }
    if (error) {
      alert(`Could not save title style: ${error?.message || 'Unknown error'}`);
      return false;
    }
    if (!updatedLayer) {
      mergeLayerIntoState({ id: lid, title_style: normalizedStyle });
      setShowTitleStyleModal(false);
      setPendingThemeMatchStyle(normalizedStyle);
      setShowThemeMatchPrompt(true);
      return true;
    }
    mergeLayerIntoState({ ...updatedLayer, title_style: normalizedStyle });
    setShowTitleStyleModal(false);
    setPendingThemeMatchStyle(normalizedStyle);
    setShowThemeMatchPrompt(true);
    return true;
  };

  const chooseLayerMediaKind = (kind) => {
    setShowLayerMediaMenu(false);
    openLayerMediaPicker(kind);
  };

  const handleLayerCropPointerDown = (e) => {
    if (!showLayerMediaCropModal) return;
    if (typeof e.button === 'number' && e.button !== 0) return;
    const base = clampLayerCropOffset(layerMediaCropKind, layerMediaCropNatural, layerMediaCropZoom, layerMediaCropOffset);
    layerCropDragRef.current = {
      active: true,
      startX: Number(e.clientX || 0),
      startY: Number(e.clientY || 0),
      baseX: base.x,
      baseY: base.y,
    };
    if (typeof e.currentTarget?.setPointerCapture === 'function') {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    }
  };

  const handleLayerCropPointerMove = (e) => {
    const drag = layerCropDragRef.current;
    if (!drag?.active) return;
    const nextOffset = clampLayerCropOffset(
      layerMediaCropKind,
      layerMediaCropNatural,
      layerMediaCropZoom,
      {
        x: drag.baseX + (Number(e.clientX || 0) - Number(drag.startX || 0)),
        y: drag.baseY + (Number(e.clientY || 0) - Number(drag.startY || 0)),
      },
    );
    setLayerMediaCropOffset(nextOffset);
  };

  const handleLayerCropPointerUp = (e) => {
    if (typeof e.currentTarget?.releasePointerCapture === 'function') {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    }
    layerCropDragRef.current = {
      ...layerCropDragRef.current,
      active: false,
    };
  };

  const startLayerCropDragAt = (clientX, clientY) => {
    const base = clampLayerCropOffset(layerMediaCropKind, layerMediaCropNatural, layerMediaCropZoom, layerMediaCropOffset);
    layerCropDragRef.current = {
      active: true,
      startX: Number(clientX || 0),
      startY: Number(clientY || 0),
      baseX: base.x,
      baseY: base.y,
    };
  };

  const moveLayerCropDragAt = (clientX, clientY) => {
    const drag = layerCropDragRef.current;
    if (!drag?.active) return;
    const nextOffset = clampLayerCropOffset(
      layerMediaCropKind,
      layerMediaCropNatural,
      layerMediaCropZoom,
      {
        x: drag.baseX + (Number(clientX || 0) - Number(drag.startX || 0)),
        y: drag.baseY + (Number(clientY || 0) - Number(drag.startY || 0)),
      },
    );
    setLayerMediaCropOffset(nextOffset);
  };

  const endLayerCropDrag = () => {
    layerCropDragRef.current = {
      ...layerCropDragRef.current,
      active: false,
    };
  };

  const handleLayerCropMouseDown = (e) => {
    if (typeof e.button === 'number' && e.button !== 0) return;
    startLayerCropDragAt(e.clientX, e.clientY);
  };

  const handleLayerCropMouseMove = (e) => moveLayerCropDragAt(e.clientX, e.clientY);
  const handleLayerCropMouseUp = () => endLayerCropDrag();

  const handleLayerCropTouchStart = (e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    startLayerCropDragAt(touch.clientX, touch.clientY);
  };

  const handleLayerCropTouchMove = (e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    moveLayerCropDragAt(touch.clientX, touch.clientY);
  };

  const handleLayerCropTouchEnd = () => endLayerCropDrag();

  const getLayerCropFrame = (kind) => {
    if (String(kind || '') === 'icon') return { width: 240, height: 240, targetW: 512, targetH: 512 };
    // Match the crop frame ratio to the live header card so saved positioning matches what user sees.
    const headerEl = layerHeaderCardRef.current;
    const measuredW = Number(headerEl?.clientWidth || 0);
    const measuredH = Number(headerEl?.clientHeight || 0);
    const ratio = (measuredW > 0 && measuredH > 0) ? (measuredW / measuredH) : 3;
    const width = 360;
    const height = Math.max(90, Math.min(220, Math.round(width / ratio)));
    const targetW = 1800;
    const targetH = Math.max(300, Math.round(targetW / ratio));
    return { width, height, targetW, targetH };
  };

  const getLayerCropMetrics = (kind, natural, zoom) => {
    const frame = getLayerCropFrame(kind);
    const srcW = Number(natural?.width || 0);
    const srcH = Number(natural?.height || 0);
    if (!srcW || !srcH) {
      return { ...frame, scale: 1, renderedW: frame.width, renderedH: frame.height };
    }
    const baseScale = Math.max(frame.width / srcW, frame.height / srcH);
    const scale = baseScale * Math.max(1, Number(zoom || 1));
    return {
      ...frame,
      scale,
      renderedW: srcW * scale,
      renderedH: srcH * scale,
    };
  };

  const clampLayerCropOffset = (kind, natural, zoom, offset) => {
    const metrics = getLayerCropMetrics(kind, natural, zoom);
    const maxX = Math.max(0, (metrics.renderedW - metrics.width) / 2);
    const maxY = Math.max(0, (metrics.renderedH - metrics.height) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, Number(offset?.x || 0))),
      y: Math.max(-maxY, Math.min(maxY, Number(offset?.y || 0))),
    };
  };

  const closeLayerMediaCropModal = () => {
    if (layerMediaCropImageUrl) URL.revokeObjectURL(layerMediaCropImageUrl);
    setShowLayerMediaCropModal(false);
    setLayerMediaCropKind('');
    setLayerMediaCropImageUrl('');
    setLayerMediaCropNatural({ width: 0, height: 0 });
    setLayerMediaCropZoom(1);
    setLayerMediaCropOffset({ x: 0, y: 0 });
    layerCropDragRef.current = { active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 };
  };

  const beginLayerMediaCrop = (kind, file) => {
    if (!file) return;
    const mediaKind = String(kind || '').trim();
    if (mediaKind !== 'icon' && mediaKind !== 'header') return;
    if (layerMediaCropImageUrl) URL.revokeObjectURL(layerMediaCropImageUrl);
    const objectUrl = URL.createObjectURL(file);
    setLayerMediaCropKind(mediaKind);
    setLayerMediaCropImageUrl(objectUrl);
    setLayerMediaCropNatural({ width: 0, height: 0 });
    setLayerMediaCropZoom(1);
    setLayerMediaCropOffset({ x: 0, y: 0 });
    setShowLayerMediaCropModal(true);
  };

  const commitLayerMediaCrop = async () => {
    const kind = String(layerMediaCropKind || '').trim();
    if (!kind || !layerMediaCropImageUrl) return;
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = layerMediaCropImageUrl;
    }).catch(() => null);
    if (!img) {
      alert('Could not process image crop.');
      return;
    }

    const natural = {
      width: Number(img?.naturalWidth || layerMediaCropNatural.width || 0),
      height: Number(img?.naturalHeight || layerMediaCropNatural.height || 0),
    };
    if (!natural.width || !natural.height) {
      alert('Could not read image dimensions.');
      return;
    }

    const metrics = getLayerCropMetrics(kind, natural, layerMediaCropZoom);
    const safeOffset = clampLayerCropOffset(kind, natural, layerMediaCropZoom, layerMediaCropOffset);
    const srcCropW = metrics.width / metrics.scale;
    const srcCropH = metrics.height / metrics.scale;
    const srcX = Math.max(0, Math.min(natural.width - srcCropW, ((natural.width - srcCropW) / 2) - (safeOffset.x / metrics.scale)));
    const srcY = Math.max(0, Math.min(natural.height - srcCropH, ((natural.height - srcCropH) / 2) - (safeOffset.y / metrics.scale)));

    const canvas = document.createElement('canvas');
    canvas.width = metrics.targetW;
    canvas.height = metrics.targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert('Could not process image crop.');
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, srcX, srcY, srcCropW, srcCropH, 0, 0, metrics.targetW, metrics.targetH);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.94));
    if (!blob) {
      alert('Could not finalize cropped image.');
      return;
    }
    const croppedFile = new File([blob], `layer-${kind}.jpg`, { type: 'image/jpeg' });
    const ok = await uploadLayerMedia(kind, croppedFile);
    if (ok) closeLayerMediaCropModal();
  };

  const removeLayerMedia = async (kind) => {
    const mediaKind = String(kind || '').trim();
    if (!user?.id || !activeLayerId || !isActiveLayerOwner) return;
    if (mediaKind !== 'icon' && mediaKind !== 'header') return;
    const field = mediaKind === 'icon' ? 'icon_url' : 'header_bg_url';
    const { data: updatedLayer, error } = await supabase
      .from('calendar_layers')
      .update({ [field]: null })
      .eq('id', activeLayerId)
      .eq('owner_id', user.id)
      .select('*')
      .maybeSingle();
    if (error || !updatedLayer) {
      alert(`Could not remove image: ${error?.message || (!updatedLayer ? 'Calendar row was not updated.' : 'Unknown error')}`);
      return;
    }
    mergeLayerIntoState(updatedLayer);
    setLayerRefreshToken(prev => prev + 1);
    setShowLayerMediaMenu(false);
  };

  const deleteLayerCalendar = async (layerId) => {
    const normalizedLayerId = String(layerId || '');
    if (!normalizedLayerId || !user?.id) return;
    const layer = layers.find(item => String(item.id) === normalizedLayerId);
    if (!layer || String(layer.owner_id) !== String(user.id)) return;
    const totalCount = (layers || []).length;
    if (totalCount <= 1) {
      alert('You must keep at least one calendar.');
      return;
    }
    if (!window.confirm(`Delete "${layer.name || 'this calendar'}" only?\n\nThis removes events, lists, shares, and trips linked to this specific calendar layer.`)) return;

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

  const handleLayerSwipeStart = (e, layerId, canSwipeAction) => {
    if (!canSwipeAction) return;
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
    if (!trimmed || !activeLayerId || !canEditActiveLayerTitle) {
      setCalendarTitle(activeLayer?.name || 'Our Calendar');
      return;
    }
    const primary = await supabase
      .from('calendar_layers')
      .update({ name: trimmed })
      .eq('id', activeLayerId)
      .eq('owner_id', user.id);
    let error = primary.error;
    if (!error && !isActiveLayerOwner) {
      const fallback = await supabase
        .from('calendar_layers')
        .update({ name: trimmed })
        .eq('id', activeLayerId);
      error = fallback.error;
    }
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
        const tripMemberKeys = new Set((targetTripMembers || []).map(m => `${String(m.sub_calendar_id)}|${normalizeEmail(m.email) || normalizePhoneNumber(m.phone)}`));
        const tripMembersToInsert = [];
        (sourceTripMembers || []).forEach(member => {
          const mappedSubCalId = tripIdMap[String(member.sub_calendar_id)];
          if (!mappedSubCalId) return;
          const email = normalizeEmail(member.email);
          const phone = normalizePhoneNumber(member.phone);
          const identity = email || phone;
          if (!identity) return;
          const key = `${mappedSubCalId}|${identity}`;
          if (tripMemberKeys.has(key)) return;
          tripMemberKeys.add(key);
          tripMembersToInsert.push({
            sub_calendar_id: mappedSubCalId,
            email: email || null,
            phone: phone || null,
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
        const sharedWithEmail = normalizeEmail(row?.shared_with_email);
        const sharedWithPhone = normalizePhoneNumber(row?.shared_with_phone);
        const sharedIdentity = sharedWithEmail || sharedWithPhone;
        if (!sharedIdentity) continue;
        if (sharedWithId === String(user.id)) continue;
        if (sharedIdentity === normalizeEmail(user?.email) || sharedIdentity === normalizePhoneNumber(user?.phone)) continue;
        const payload = {
          owner_id: user.id,
          layer_id: targetLayerId,
          calendar_id: targetLayerId,
          shared_with_id: sharedWithId,
          shared_with_email: sharedWithEmail || null,
          shared_with_phone: sharedWithPhone || null,
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

      if (!isAuto) setShareMessage('? Merge complete. Switched to the merged calendar.');
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
  }, [darkMode]);

  useEffect(() => {
    const userId = String(user?.id || '').trim();
    const layerId = String(activeLayerId || '').trim();
    if (!userId || !layerId) {
      const legacy = typeof window !== 'undefined' ? localStorage.getItem('darkMode') : null;
      setDarkMode(legacy === 'true');
      return;
    }
    const scopedKey = getLayerDarkModeStorageKey(userId, layerId);
    const scopedValue = localStorage.getItem(scopedKey);
    if (scopedValue === 'true' || scopedValue === 'false') {
      setDarkMode(scopedValue === 'true');
      return;
    }
    const legacy = localStorage.getItem('darkMode');
    setDarkMode(legacy === 'true');
  }, [user?.id, activeLayerId]);

  useEffect(() => {
    const userId = String(user?.id || '').trim();
    const layerId = String(activeLayerId || '').trim();
    if (!userId || !layerId) return;
    localStorage.setItem(getLayerDarkModeStorageKey(userId, layerId), String(darkMode));
  }, [darkMode, user?.id, activeLayerId]);

  useEffect(() => {
    if (!user?.id) {
      setImportPromptDismissedThisSession(false);
      setDontShowImportPromptChecked(false);
      googleImportResumeRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoading || showAuth || showUserSetup) return;
    if (!user?.id || !activeLayerId) return;
    if (hideImportPromptForever || importPromptDismissedThisSession) {
      setShowFirstImportPrompt(false);
      return;
    }
    setShowFirstImportPrompt(true);
  }, [
    isLoading,
    showAuth,
    showUserSetup,
    user?.id,
    activeLayerId,
    hideImportPromptForever,
    importPromptDismissedThisSession,
  ]);

  const getDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const isSameDay = (date1, date2) => {
    return date1 && date2 &&
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  };

  const SCHEDULING_CONFLICT_WINDOW_HOURS = 3;
  const SCHEDULING_CONFLICT_WINDOW_MS = SCHEDULING_CONFLICT_WINDOW_HOURS * 60 * 60 * 1000;
  const toEventDateTime = (dateKey, time) => {
    const dk = String(dateKey || '').trim();
    const tm = String(time || '').trim();
    if (!dk || !tm || !/^\d{4}-\d{2}-\d{2}$/.test(dk)) return null;
    const m = tm.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    const normalizedTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`;
    const d = new Date(`${dk}T${normalizedTime}`);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };
  const formatConflictDateTime = (dateKey, time) => {
    const dt = toEventDateTime(dateKey, time);
    if (!dt) return `${dateKey} ${time || ''}`.trim();
    return dt.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
    });
  };
  const openConflictPrompt = ({ heading, title, lines, confirmLabel, cancelLabel, showCancel = true }) => new Promise((resolve) => {
    conflictPromptResolverRef.current = resolve;
    setConflictPromptData({
      heading: String(heading || 'Scheduling Conflict'),
      title: String(title || 'Scheduling conflict'),
      lines: Array.isArray(lines) ? lines : [],
      confirmLabel: String(confirmLabel || 'Save Anyway'),
      cancelLabel: String(cancelLabel || 'Change Time'),
      showCancel: showCancel !== false,
    });
    setShowConflictPrompt(true);
  });
  const closeConflictPrompt = (accepted) => {
    setShowConflictPrompt(false);
    const resolver = conflictPromptResolverRef.current;
    conflictPromptResolverRef.current = null;
    if (typeof resolver === 'function') resolver(Boolean(accepted));
  };
  useEffect(() => () => {
    if (typeof conflictPromptResolverRef.current === 'function') {
      conflictPromptResolverRef.current(false);
      conflictPromptResolverRef.current = null;
    }
  }, []);
  const findSchedulingConflicts = async ({ dateKey, time, ignoreEventId = null }) => {
    if (!user?.id) return [];
    const target = toEventDateTime(dateKey, time);
    if (!target) return [];

    const minDate = new Date(target.getTime() - (24 * 60 * 60 * 1000));
    const maxDate = new Date(target.getTime() + (24 * 60 * 60 * 1000));
    const minDateKey = getDateKey(minDate);
    const maxDateKey = getDateKey(maxDate);
    const ignoreId = String(ignoreEventId || '').trim();
    const rowsById = new Map();

    // Local in-memory events first (captures unsaved/debounced state).
    Object.values(events || {}).forEach((list) => {
      (list || []).forEach((evt) => {
        const evtId = String(evt?.id || '').trim();
        if (!evtId || (ignoreId && evtId === ignoreId)) return;
        const evtDateKey = String(evt?.date || '').trim();
        const evtTime = String(evt?.time || '').trim();
        if (!evtDateKey || !evtTime) return;
        rowsById.set(evtId, {
          id: evtId,
          title: String(evt?.title || '').trim() || 'Untitled Event',
          date: evtDateKey,
          time: evtTime,
          layer_id: String(activeLayerId || ''),
        });
      });
    });

    // DB rows across all visible layers (owned + shared).
    const visibleLayerIds = Array.from(
      new Set((layers || []).map((layer) => String(layer?.id || '').trim()).filter(Boolean))
    );
    if (visibleLayerIds.length === 0 && String(activeLayerId || '').trim()) {
      visibleLayerIds.push(String(activeLayerId).trim());
    }
    if (visibleLayerIds.length > 0) {
      for (const lid of visibleLayerIds) {
        try {
          const { data: dbRows, error } = await supabase
            .from('events')
            .select('id,title,date,time,layer_id,user_id')
            .eq('layer_id', lid)
            .gte('date', minDateKey)
            .lte('date', maxDateKey)
            .not('time', 'is', null)
            .limit(500);
          if (error) {
            console.warn('Conflict check layer query failed:', lid, error.message || error);
            continue;
          }
          (dbRows || []).forEach((row) => {
            const evtId = String(row?.id || '').trim();
            if (!evtId || (ignoreId && evtId === ignoreId)) return;
            rowsById.set(evtId, {
              id: evtId,
              title: String(row?.title || '').trim() || 'Untitled Event',
              date: String(row?.date || '').trim(),
              time: String(row?.time || '').trim(),
              layer_id: String(row?.layer_id || '').trim(),
            });
          });
        } catch {}
      }
    }

    const layerNameById = {};
    (layers || []).forEach((layer) => {
      const id = String(layer?.id || '').trim();
      if (id) layerNameById[id] = String(layer?.name || '').trim() || 'Calendar';
    });

    const conflicts = [];
    rowsById.forEach((row) => {
      const dt = toEventDateTime(row.date, row.time);
      if (!dt) return;
      const deltaMs = Math.abs(dt.getTime() - target.getTime());
      if (deltaMs > SCHEDULING_CONFLICT_WINDOW_MS) return;
      conflicts.push({
        ...row,
        deltaMs,
        layerName: layerNameById[String(row.layer_id || '').trim()] || 'Calendar',
      });
    });
    conflicts.sort((a, b) => a.deltaMs - b.deltaMs);
    return conflicts.slice(0, 6);
  };
  const confirmSchedulingConflicts = async ({ dateKey, time, ignoreEventId = null, draftTitle = 'This event' }) => {
    const conflicts = await findSchedulingConflicts({ dateKey, time, ignoreEventId });
    if (conflicts.length === 0) return true;
    const lines = conflicts
      .slice(0, 4)
      .map((row) => `• ${row.title} (${row.layerName}) at ${formatConflictDateTime(row.date, row.time)}`)
      .filter(Boolean);
    return openConflictPrompt({
      title: `"${draftTitle}" is within ${SCHEDULING_CONFLICT_WINDOW_HOURS} hours of:`,
      lines,
    });
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

  // Weather code ? display object with emoji/label and a color
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
    const normalizeHolidayTitle = (value) => String(value || '')
      .trim()
      .toLowerCase()
      .replace(/^us\s*holiday[:\s-]*/i, '')
      .replace(/[^a-z0-9]/g, '');
    const isAllDayLike = (event) => {
      const time = String(event?.time || '').trim();
      return !time || time === '00:00' || time === '00:00:00';
    };
    const isHolidayLikeTitle = (normalizedTitle) => {
      const t = String(normalizedTitle || '');
      if (!t) return false;
    return (
        t.includes('holiday')
        || t.includes('newyear')
        || t.includes('mlk')
        || t.includes('martinlutherking')
        || t.includes('presidentsday')
        || t.includes('washingtonsbirthday')
        || t.includes('memorialday')
        || t.includes('juneteenth')
        || t.includes('independenceday')
        || t.includes('laborday')
        || t.includes('columbusday')
        || t.includes('veteransday')
        || t.includes('thanksgiving')
        || t.includes('christmas')
        || t.includes('fathersday')
        || t.includes('mothersday')
        || t.includes('flagday')
        || t.includes('easter')
        || t.includes('goodfriday')
        || t.includes('taxday')
        || t.includes('stpatrick')
        || t.includes('cincodemayo')
      );
    };

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

    const holiday = getHolidayForDate(dateKey);
    const holidayNames = new Set(
      [holiday?.localName, holiday?.name]
        .map(normalizeHolidayTitle)
        .filter(Boolean)
    );
    const seenHolidayTitles = new Set();
    const dedupedDirectEvents = [];
    (directEvents || []).forEach((event) => {
      const normalizedTitle = normalizeHolidayTitle(event?.title);
      const isHolidayLike = normalizedTitle && isAllDayLike(event) && (
        holidayNames.has(normalizedTitle)
        || isHolidayLikeTitle(normalizedTitle)
      );
      if (isHolidayLike) {
        if (seenHolidayTitles.has(normalizedTitle)) return;
        seenHolidayTitles.add(normalizedTitle);
      }
      dedupedDirectEvents.push(event);
    });

    const holidayEvents = [];
    const alreadyHasHolidayEvent = holiday
      && dedupedDirectEvents.some((event) => {
        const title = normalizeHolidayTitle(event?.title);
        return title && holidayNames.has(title);
      });
    if (holiday && !alreadyHasHolidayEvent) {
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

    const mergedEvents = [...holidayEvents, ...dedupedDirectEvents, ...virtualRecurrences];
    const seenHolidayKeys = new Set();
    const dedupedMergedEvents = [];
    mergedEvents.forEach((event) => {
      const normalizedTitle = normalizeHolidayTitle(event?.title);
      const isHolidayLike = normalizedTitle && isAllDayLike(event) && (
        holidayNames.has(normalizedTitle)
        || isHolidayLikeTitle(normalizedTitle)
      );
      if (isHolidayLike) {
        const holidayKey = `${dateKey}|${normalizedTitle}`;
        if (seenHolidayKeys.has(holidayKey)) return;
        seenHolidayKeys.add(holidayKey);
      }
      dedupedMergedEvents.push(event);
    });

    return dedupedMergedEvents.sort((a, b) => {
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
      if (!assertCanEditActiveLayer('edit events in this calendar')) return;
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
                description: event.description || null,
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
          // Non-destructive save: upsert local owned events, never bulk-delete.
          if (myEvents.length > 0) {
            for (let i = 0; i < myEvents.length; i += 250) {
              if (requestId !== saveRequestIdRef.current) return;
              const chunk = myEvents.slice(i, i + 250);
              let { error } = await supabase
                .from('events')
                .upsert(chunk, { onConflict: 'id' });
              if (error && /column .*description|schema cache/i.test(String(error.message || ''))) {
                const fallbackChunk = chunk.map(({ description, ...rest }) => rest);
                const fallbackResult = await supabase
                  .from('events')
                  .upsert(fallbackChunk, { onConflict: 'id' });
                error = fallbackResult.error;
              }
              if (error) {
                console.error('Error upserting events to Supabase:', error);
                break;
              }
            }
          }

          // Save shared event edits via targeted UPDATE on each row
          for (const event of sharedUpdates) {
            if (requestId !== saveRequestIdRef.current) return;
            let updateResult = await supabase.from('events').update({
              title: event.title,
              time: event.time,
              category: event.category,
              description: event.description || null,
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
            if (updateResult.error && /column .*description|schema cache/i.test(String(updateResult.error.message || ''))) {
              updateResult = await supabase.from('events').update({
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

  const leaveSharedLayerCalendar = async (layerId) => {
    const normalizedLayerId = String(layerId || '');
    if (!normalizedLayerId || !user?.id) return;
    const layer = layers.find(item => String(item.id) === normalizedLayerId);
    if (!layer || String(layer.owner_id) === String(user.id)) return;
    if (!window.confirm(`Leave "${layer.name || 'this calendar'}"?`)) return;

    try {
      const myEmail = normalizeEmail(user?.email);
      const myPhone = normalizePhoneNumber(user?.phone);
      const shareRecipientFilter = buildShareRecipientFilter(user.id, myEmail, myPhone);
      const deletedIds = new Set();

      const { data: deletedById, error: deleteByIdErr } = await supabase
        .from('shared_access')
        .delete()
        .eq('layer_id', normalizedLayerId)
        .eq('shared_with_id', user.id)
        .select('id');
      if (deleteByIdErr) {
        alert(`Could not leave calendar: ${deleteByIdErr.message || 'Unknown error'}`);
        return;
      }
      (deletedById || []).forEach((row) => {
        if (row?.id) deletedIds.add(String(row.id));
      });

      if (shareRecipientFilter) {
        const { data: deletedByRecipient, error: deleteByRecipientErr } = await supabase
          .from('shared_access')
          .delete()
          .eq('layer_id', normalizedLayerId)
          .or(shareRecipientFilter)
          .select('id');
        if (deleteByRecipientErr) {
          alert(`Could not leave calendar: ${deleteByRecipientErr.message || 'Unknown error'}`);
          return;
        }
        (deletedByRecipient || []).forEach((row) => {
          if (row?.id) deletedIds.add(String(row.id));
        });
      }

      if (deletedIds.size === 0) {
        alert('Could not leave calendar: no deletable share row found for this account (likely Supabase RLS policy).');
        return;
      }

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
      setLayerRefreshToken(prev => prev + 1);
    } catch (err) {
      console.error('Error leaving shared calendar layer:', err);
      alert(`Could not leave calendar: ${err.message || 'Unknown error'}`);
    }
  };

  const loadCategoriesForLayer = async (layerId, viewerUserId, layerOwnerId) => {
    const normalizeCategoriesForUse = (raw) => {
      const next = {};
      Object.entries(raw || {}).forEach(([key, value]) => {
        if (!value || typeof value !== 'object') return;
        next[String(key)] = {
          label: String(value.label || '').trim() || 'Category',
          color: String(value.color || '').trim() || 'bg-gray-500',
          lightBg: String(value.lightBg || '').trim() || 'bg-gray-50',
          border: String(value.border || '').trim() || 'border-gray-200',
          text: String(value.text || '').trim() || 'text-gray-700',
        };
      });
      if (!next.other) next.other = { ...DEFAULT_CATEGORIES.other };
      return next;
    };

    const normalizedLayerId = String(layerId || '').trim();
    const normalizedViewerId = String(viewerUserId || '').trim();
    const normalizedOwnerId = String(layerOwnerId || normalizedViewerId || '').trim();
    if (!normalizedLayerId || !normalizedViewerId) {
      setCategories(DEFAULT_CATEGORIES);
      return;
    }

    const localLayerCategories = readLocalLayerCategories(normalizedViewerId, normalizedLayerId);
    let categoriesData = [];
    let categoriesError = null;
    let categoriesLayerScopedUnavailable = false;

    try {
      const scoped = await supabase
        .from('categories')
        .select('*')
        .eq('layer_id', normalizedLayerId)
        .eq('user_id', normalizedOwnerId);
      categoriesData = scoped?.data || [];
      categoriesError = scoped?.error || null;
    } catch (err) {
      categoriesError = err;
    }

    if (categoriesError && /column .*layer_id|schema cache|does not exist/i.test(String(categoriesError?.message || ''))) {
      categoriesLayerScopedUnavailable = true;
      const legacy = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', normalizedOwnerId);
      categoriesData = legacy?.data || [];
      categoriesError = legacy?.error || null;
    }
    if (categoriesError) {
      console.error('Error loading categories:', categoriesError);
    }

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
      setCategories(normalizeCategoriesForUse(categoriesObj));
      writeLocalLayerCategories(normalizedViewerId, normalizedLayerId, categoriesObj);
      return;
    }

    if (localLayerCategories && typeof localLayerCategories === 'object') {
      setCategories(normalizeCategoriesForUse(localLayerCategories));
      return;
    }

    setCategories(DEFAULT_CATEGORIES);
    if (categoriesLayerScopedUnavailable) {
      console.warn('categories.layer_id missing; using default per-layer categories until saved locally.');
    }
  };

  const saveCategories = async (newCategories) => {
    try {
      if (!assertCanEditActiveLayer('edit categories in this calendar')) return;
      setCategories(newCategories);
      if (!user?.id || !activeLayerId) return;
      const categoryOwnerId = String(activeLayerOwnerId || user.id || '').trim();
      writeLocalLayerCategories(user.id, activeLayerId, newCategories);
      const categoriesArray = Object.entries(newCategories).map(([key, cat]) => ({
        key,
        label: cat.label,
        color: cat.color,
        light_bg: cat.lightBg,
        border: cat.border,
        text: cat.text,
        user_id: categoryOwnerId,
        layer_id: activeLayerId,
        calendar_id: activeLayerId,
      }));
      let deleteError = null;
      try {
        const del = await supabase
          .from('categories')
          .delete()
          .eq('user_id', categoryOwnerId)
          .eq('layer_id', activeLayerId);
        deleteError = del?.error || null;
      } catch (err) {
        deleteError = err;
      }
      if (deleteError && /column .*layer_id|schema cache|does not exist/i.test(String(deleteError?.message || ''))) {
        // Backward-compatible fallback: keep per-layer categories local-only when DB lacks layer_id.
        console.warn('categories.layer_id missing; saved categories per-layer in local storage only.');
        return;
      } else if (deleteError) {
        console.error('Error deleting categories in Supabase:', deleteError);
      }

      let insertError = null;
      try {
        const ins = await supabase.from('categories').insert(categoriesArray);
        insertError = ins?.error || null;
      } catch (err) {
        insertError = err;
      }
      if (insertError && /column .*layer_id|column .*calendar_id|schema cache|does not exist/i.test(String(insertError?.message || ''))) {
        console.warn('categories.layer_id missing; saved categories per-layer in local storage only.');
        return;
      }
      const error = insertError;
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
    if (!isActiveLayerOwner) {
      setShareMessage('Only the calendar owner can change sharing settings.');
      return;
    }
    const recipient = resolveInviteRecipient(shareEmailInput);
    if (!recipient?.value) {
      setShareMessage('Enter a valid email or phone number.');
      return;
    }
    const email = recipient.email;
    const phone = recipient.phone;

    // Check not already shared
    if (myShares.some(s => getShareRecipientFromRow(s) === recipient.value)) {
      setShareMessage('Already shared with this person.');
      return;
    }

    // Check not sharing with yourself
    const myEmail = normalizeEmail(user?.email);
    const myPhone = normalizePhoneNumber(user?.phone);
    if (recipient.value === myEmail || recipient.value === myPhone) {
      setShareMessage("You can't share with yourself.");
      return;
    }

    let { error } = await supabase.from('shared_access').insert({
      owner_id: user.id,
      layer_id: activeLayerId,
      calendar_id: activeLayerId,
      shared_with_email: email || null,
      shared_with_phone: phone || null,
      can_edit: false,
    });
    if (error && /column .*can_edit|schema cache/i.test(String(error.message || ''))) {
      const fallback = await supabase.from('shared_access').insert({
        owner_id: user.id,
        layer_id: activeLayerId,
        calendar_id: activeLayerId,
        shared_with_email: email || null,
        shared_with_phone: phone || null,
      });
      error = fallback.error;
    }

    if (error) {
      setShareMessage('Error sharing calendar. Try again.');
      console.error(error);
    } else {
      setMyShares(prev => [...prev, {
        owner_id: user.id,
        layer_id: activeLayerId,
        shared_with_email: email || null,
        shared_with_phone: phone || null,
        can_edit: false,
      }]);
      setShareEmailInput('');
      setShareMessage(`Shared! ${recipient.value} is Read only by default (you can change to Editor).`);
    }
  };

  const handleRemoveShare = async (identity) => {
    if (!isActiveLayerOwner) {
      setShareMessage('Only the calendar owner can change sharing settings.');
      return;
    }
    const recipient = resolveInviteRecipient(identity);
    if (!recipient?.value) return;
    let query = supabase
      .from('shared_access')
      .delete()
      .eq('owner_id', user.id)
      .eq('layer_id', activeLayerId);
    const recipientFilter = buildShareRecipientFilter('', recipient.email, recipient.phone);
    if (recipientFilter) query = query.or(recipientFilter);
    const { error } = await query;

    if (!error) {
      setMyShares(prev => prev.filter(s => getShareRecipientFromRow(s) !== recipient.value));
      setShareMessage(`Removed access for ${recipient.value}.`);
    }
  };

  const handleToggleShareEditPermission = async (identity, nextCanEdit) => {
    if (!isActiveLayerOwner) {
      setShareMessage('Only the calendar owner can change sharing settings.');
      return;
    }
    const recipient = resolveInviteRecipient(identity);
    if (!recipient?.value) return;

    let query = supabase
      .from('shared_access')
      .update({ can_edit: !!nextCanEdit })
      .eq('owner_id', user.id)
      .eq('layer_id', activeLayerId);
    const recipientFilter = buildShareRecipientFilter('', recipient.email, recipient.phone);
    if (recipientFilter) query = query.or(recipientFilter);
    const { error } = await query;

    if (error) {
      if (/column .*can_edit|schema cache/i.test(String(error.message || ''))) {
        setShareMessage('Permissions column missing. Add shared_access.can_edit BOOLEAN DEFAULT TRUE.');
      } else {
        setShareMessage(`Could not update permission: ${error.message}`);
      }
      return;
    }

    setMyShares(prev => prev.map(share => (
      getShareRecipientFromRow(share) === recipient.value
        ? { ...share, can_edit: !!nextCanEdit }
        : share
    )));
    setShareMessage(`${recipient.value} is now ${nextCanEdit ? 'Editor' : 'Read only'}.`);
  };

  const primaryListOwnerId = activeLayerOwnerId;

  const loadSharedListGroups = async (ownerId) => {
    if (!activeLayerId) return;
    let { data, error } = await supabase
      .from('shared_list_groups')
      .select('*')
      .eq('layer_id', activeLayerId)
      .order('created_at', { ascending: true });

    // Fallback for stricter policies that still expect owner_id scoping.
    if ((!data || data.length === 0) && ownerId) {
      const fallback = await supabase
        .from('shared_list_groups')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('layer_id', activeLayerId)
        .order('created_at', { ascending: true });
      if (!fallback.error && Array.isArray(fallback.data)) {
        data = fallback.data;
        error = null;
      }
    }

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
    if (!listId || !activeLayerId) {
      setSharedListItems([]);
      return;
    }
    let { data, error } = await supabase
      .from('shared_lists')
      .select('*')
      .eq('layer_id', activeLayerId)
      .eq('list_id', listId)
      .order('created_at', { ascending: true });

    // Fallback for projects where list reads are owner-scoped in RLS.
    if ((!data || data.length === 0) && ownerId) {
      const fallback = await supabase
        .from('shared_lists')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('layer_id', activeLayerId)
        .eq('list_id', listId)
        .order('created_at', { ascending: true });
      if (!fallback.error && Array.isArray(fallback.data)) {
        data = fallback.data;
        error = null;
      }
    }

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
    if (!assertCanEditActiveLayer('create shared lists')) return;
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
    if (!assertCanEditActiveLayer('delete shared lists')) return;
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
    if (!assertCanEditActiveLayer('rename shared lists')) return false;
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

  const ensurePushSubscriptionForCurrentDevice = async () => {
    try {
      if (!user?.id) return false;
      if (!('Notification' in window) || Notification.permission !== 'granted') return false;
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
      const pushVapidKey = WEB_PUSH_VAPID_PUBLIC_KEY || FCM_WEB_VAPID_PUBLIC_KEY;
      if (!pushVapidKey) return false;

      const registration = await ensureFirebaseMessagingServiceWorker();
      if (!registration) return false;
      let subscription = await registration.pushManager.getSubscription();
      const storedVapidKey = String(localStorage.getItem('push-vapid-key') || '').trim();
      if (subscription && storedVapidKey && storedVapidKey !== pushVapidKey) {
        try { await subscription.unsubscribe(); } catch {}
        subscription = null;
      }
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(pushVapidKey),
        });
      }
      if (!subscription) return false;
      const payload = subscription.toJSON();
      const endpoint = String(payload?.endpoint || '').trim();
      const p256dh = String(payload?.keys?.p256dh || '').trim();
      const auth = String(payload?.keys?.auth || '').trim();
      if (!endpoint || !p256dh || !auth) return false;

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent || null,
          enabled: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'endpoint' });
      if (error) {
        console.warn('push_subscriptions upsert failed (pre-send):', error);
        return false;
      }
      localStorage.setItem('push-vapid-key', pushVapidKey);
      return true;
    } catch (err) {
      console.warn('ensurePushSubscriptionForCurrentDevice failed:', err?.message || err);
      return false;
    }
  };

  const sendImmediatePushNotification = async ({ type = 'update', title, body, layerId, subCalendarId = null, extraData = {} }) => {
    try {
      await ensurePushSubscriptionForCurrentDevice();
      const { data, error } = await supabase.functions.invoke('send-immediate-push', {
        body: {
          type,
          title,
          body,
          layerId: layerId || null,
          subCalendarId: subCalendarId || null,
          actorUserId: user?.id || null,
          actorEmail: user?.email || null,
          data: {
            type,
            title,
            body,
            layerId: layerId || null,
            url: '/',
            tag: `${type}-${Date.now()}`,
            ...(extraData && typeof extraData === 'object' ? extraData : {}),
          },
        },
      });
      if (error) {
        let detailed = '';
        try {
          const context = error?.context;
          if (context && typeof context.clone === 'function' && typeof context.clone().json === 'function') {
            const payload = await context.clone().json();
            detailed = String(payload?.error || payload?.message || '').trim();
          }
        } catch {}
        const message = detailed || error.message || 'Push invoke failed';
        console.warn('send-immediate-push invoke error:', message, error);
        return { ok: false, error: message };
      }
      const sent = Number(data?.sent || 0);
      const ok = Boolean(data?.ok !== false);
      return { ok, sent, data };
    } catch (err) {
      console.warn('send-immediate-push failed:', err?.message || err);
      return { ok: false, error: err?.message || 'Push invoke failed' };
    }
  };

  const addSharedListItem = async () => {
    if (!assertCanEditActiveLayer('add list items')) return;
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
    const who = String(currentUser || user?.email || user?.phone || 'Someone');
    const selectedList = (sharedListGroups || []).find((g) => String(g?.id || '') === String(selectedSharedListId || ''));
    const listName = String(selectedList?.title || 'the list').trim();
    const preview = text.length > 48 ? `${text.slice(0, 48)}...` : text;
    const pushResult = await sendImmediatePushNotification({
      type: 'list',
      title: 'List Update',
      body: `${who} added "${preview}" to ${listName}.`,
      layerId: activeLayerId,
      extraData: {
        listId: selectedSharedListId || null,
        listItemId: data?.id || null,
      },
    });
    if (notificationsEnabled && Notification.permission === 'granted') {
      maybeSendInAppSystemNotification(
        'list',
        `shared_lists:local:${Date.now()}`,
        `You added "${preview}" to ${listName}.`,
        { allowWhenVisible: true }
      );
    }
    if (!pushResult?.ok) {
      setListError(`Push not sent: ${pushResult?.error || 'Unknown error'}`);
    } else {
      setListError('');
    }
  };

  const toggleSharedListItem = async (item) => {
    if (!assertCanEditActiveLayer('edit list items')) return;
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
    if (!assertCanEditActiveLayer('delete list items')) return;
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
    if (!assertCanEditActiveLayer('edit list items')) return;
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

  const loadCalendarChatMessages = async () => {
    if (!activeLayerId) {
      setCalendarChatMessages([]);
      return;
    }
    const { data, error } = await supabase
      .from('calendar_messages')
      .select('*')
      .eq('layer_id', activeLayerId)
      .order('created_at', { ascending: true })
      .limit(400);

    if (error) {
      console.error('Error loading calendar chat:', error);
      if (error.code === '42P01') {
        setChatError('Chat feature needs DB setup (calendar_messages table is missing).');
      } else {
        setChatError(`Could not load chat: ${error.message}`);
      }
      return;
    }

    setChatError('');
    setCalendarChatMessages((data || []).filter(row => !isDeletedChatMessage(row?.message)));
  };

  const loadPopupEventData = async () => {
    if (!activeLayerId) {
      setPopupEventsByEventId({});
      setPopupSignupsByEventId({});
      return;
    }

    const { data: popupEventsRows, error: popupEventsErr } = await supabase
      .from('popup_events')
      .select('event_id,max_people,created_by_user_id,created_by_name,created_at')
      .eq('layer_id', activeLayerId);

    if (popupEventsErr) {
      if (popupEventsErr.code === '42P01') {
        setPopupFeatureAvailable(false);
      }
      setPopupEventsByEventId({});
      setPopupSignupsByEventId({});
      return;
    }

    const eventIds = (popupEventsRows || []).map((row) => String(row?.event_id || '')).filter(Boolean);
    const eventsMap = {};
    (popupEventsRows || []).forEach((row) => {
      const eventId = String(row?.event_id || '');
      if (!eventId) return;
      eventsMap[eventId] = {
        eventId,
        maxPeople: Math.max(1, Number(row?.max_people || 1)),
        createdByUserId: String(row?.created_by_user_id || ''),
        createdByName: String(row?.created_by_name || ''),
        createdAt: String(row?.created_at || ''),
      };
    });

    let signupsMap = {};
    if (eventIds.length > 0) {
      const { data: signupRows, error: signupErr } = await supabase
        .from('popup_event_signups')
        .select('event_id,user_id,display_name,created_at')
        .eq('layer_id', activeLayerId)
        .in('event_id', eventIds)
        .order('created_at', { ascending: true });

      if (!signupErr) {
        signupsMap = {};
        (signupRows || []).forEach((row) => {
          const eventId = String(row?.event_id || '');
          if (!eventId) return;
          if (!Array.isArray(signupsMap[eventId])) signupsMap[eventId] = [];
          signupsMap[eventId].push({
            userId: String(row?.user_id || ''),
            displayName: String(row?.display_name || ''),
            createdAt: String(row?.created_at || ''),
          });
        });
      }
    }

    setPopupFeatureAvailable(true);
    setPopupEventsByEventId(eventsMap);
    setPopupSignupsByEventId(signupsMap);
  };

  const createPopupEventRows = async (rows) => {
    const payload = Array.isArray(rows) ? rows : [];
    if (payload.length === 0) return true;
    const { error } = await supabase
      .from('popup_events')
      .upsert(payload, { onConflict: 'event_id' });
    if (error) {
      if (error.code === '42P01') {
        setPopupFeatureAvailable(false);
        alert('Popup events need DB setup (popup_events + popup_event_signups tables are missing).');
        return false;
      }
      alert(`Could not create popup event: ${error.message}`);
      return false;
    }
    setPopupFeatureAvailable(true);
    await loadPopupEventData();
    return true;
  };

  const focusOnPopupEventDate = (eventId, fallbackDateKey = null) => {
    let dateKey = String(fallbackDateKey || '').trim();
    if (!dateKey) {
      Object.entries(events || {}).some(([dk, list]) => {
        const found = (list || []).some((evt) => String(evt?.id || '') === String(eventId || ''));
        if (!found) return false;
        dateKey = String(dk || '').trim();
        return true;
      });
    }
    const m = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (Number.isNaN(d.getTime())) return;
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(d);
    setSelectedDates([]);
    setSelectionStart(null);
    setFirstTapDate(null);
    setShowDateDetailModal(true);
  };

  const joinPopupEvent = async (eventId, fallbackMeta = null) => {
    const normalizedEventId = String(eventId || '').trim();
    const popup = popupEventsByEventId[normalizedEventId] || null;
    if (!normalizedEventId || !activeLayerId || !user?.id) return;
    if (!popupFeatureAvailable) {
      alert('Popup events need DB setup first.');
      return;
    }
    const signups = popupSignupsByEventId[normalizedEventId] || [];
    const alreadyJoined = signups.some((row) => String(row?.userId || '') === String(user.id));
    if (alreadyJoined) {
      focusOnPopupEventDate(normalizedEventId, fallbackMeta?.dateKey || null);
      return;
    }
    const fallbackNoMax = Boolean(fallbackMeta?.noMax);
    const fallbackMax = Math.max(1, Number(fallbackMeta?.maxPeople || 1));
    const maxPeople = popup ? Number(popup?.maxPeople || 1) : fallbackMax;
    const noMax = popup ? (Number(popup?.maxPeople || 0) >= POPUP_NO_MAX_SENTINEL) : fallbackNoMax;
    if (!noMax && signups.length >= maxPeople) {
      alert('This pop-up event is full.');
      return;
    }
    const payload = {
      layer_id: activeLayerId,
      event_id: normalizedEventId,
      user_id: user.id,
      display_name: currentUser || user?.email || user?.phone || 'Member',
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('popup_event_signups').insert(payload);
    if (error) {
      if (String(error?.code || '') === '23505') {
        // Already joined (unique event_id + user_id); treat as success.
        await loadPopupEventData();
        focusOnPopupEventDate(normalizedEventId, fallbackMeta?.dateKey || null);
        return;
      }
      alert(`Could not join popup event: ${error.message}`);
      return;
    }
    await loadPopupEventData();
    focusOnPopupEventDate(normalizedEventId, fallbackMeta?.dateKey || null);
  };

  const leavePopupEvent = async (eventId) => {
    const normalizedEventId = String(eventId || '').trim();
    if (!normalizedEventId || !activeLayerId || !user?.id) return;
    const { error } = await supabase
      .from('popup_event_signups')
      .delete()
      .eq('layer_id', activeLayerId)
      .eq('event_id', normalizedEventId)
      .eq('user_id', user.id);
    if (error) {
      alert(`Could not leave popup event: ${error.message}`);
      return;
    }
    await loadPopupEventData();
  };

  const loadChatMembers = async () => {
    if (!activeLayerId) {
      setChatMembers([]);
      return;
    }
    const membersMap = new Map();
    const userIdToKey = new Map();
    const scoreLabel = (value) => {
      const label = String(value || '').trim();
      if (!label) return 0;
      if (label.toLowerCase() === 'member') return 1;
      if (label.toLowerCase() === 'owner') return 1;
      if (label.toLowerCase() === 'you') return 5;
      // Prefer display-like names over raw email/phone identities.
      if (label.includes('@') || /^\+?\d[\d\s()-]{6,}$/.test(label)) return 2;
      return 4;
    };
    const addMember = (member) => {
      const key = String(member?.key || '').trim();
      const uid = String(member?.userId || '').trim();
      if (!key) return;
      if (uid && userIdToKey.has(uid)) {
        const existingKey = userIdToKey.get(uid);
        const existing = membersMap.get(existingKey);
        if (!existing) {
          membersMap.set(key, member);
          userIdToKey.set(uid, key);
          return;
        }
        const existingScore = scoreLabel(existing?.label);
        const incomingScore = scoreLabel(member?.label);
        if (incomingScore > existingScore) {
          membersMap.set(existingKey, { ...existing, label: member.label });
        }
        return;
      }
      if (membersMap.has(key)) return;
      membersMap.set(key, member);
      if (uid) userIdToKey.set(uid, key);
    };

    const ownerId = String(activeLayerOwnerId || user?.id || '').trim();
    const ownerLabel = String(
      activeLayerOwnerId === user?.id
        ? (currentUser || 'You')
        : (sharedOwnerLabels?.[ownerId] || fallbackOwnerLabel(ownerId) || 'Owner')
    ).trim();
    if (ownerId) {
      addMember({
        key: `owner:${ownerId}`,
        userId: ownerId,
        label: ownerLabel || 'Owner',
      });
    }

    let rows = [];
    try {
      const { data, error } = await supabase
        .from('shared_access')
        .select('shared_with_id,shared_with_email,shared_with_phone')
        .eq('layer_id', activeLayerId);
      if (!error) rows = data || [];
    } catch {}

    (rows || []).forEach((row) => {
      const sharedWithId = String(row?.shared_with_id || '').trim();
      if (!sharedWithId) return; // only count accepted members
      const sharedWithEmail = normalizeEmail(row?.shared_with_email);
      const sharedWithPhone = normalizePhoneNumber(row?.shared_with_phone);
      const identity = sharedWithId || sharedWithEmail || sharedWithPhone;
      if (!identity) return;
      const isMe = sharedWithId && String(sharedWithId) === String(user?.id || '');
      const label = isMe
        ? 'You'
        : (sharedWithEmail || sharedWithPhone || fallbackOwnerLabel(sharedWithId) || 'Member');
      addMember({
        key: `share:${identity}`,
        userId: sharedWithId || null,
        label: String(label || 'Member'),
      });
    });

    // Fallback when shared_access visibility is limited.
    if (rows.length === 0) {
      (myShares || []).forEach((row) => {
        const rowLayerId = String(row?.layer_id || row?.calendar_id || '').trim();
        if (rowLayerId !== String(activeLayerId)) return;
        const sharedWithId = String(row?.shared_with_id || '').trim();
        if (!sharedWithId) return; // only count accepted members
        const sharedWithEmail = normalizeEmail(row?.shared_with_email);
        const sharedWithPhone = normalizePhoneNumber(row?.shared_with_phone);
        const identity = sharedWithId || sharedWithEmail || sharedWithPhone;
        if (!identity) return;
        addMember({
          key: `share:${identity}`,
          userId: sharedWithId || null,
          label: String(sharedWithEmail || sharedWithPhone || fallbackOwnerLabel(sharedWithId) || 'Member'),
        });
      });
      if (String(activeLayerOwnerId || '') !== String(user?.id || '')) {
        const meKey = String(user?.id || '').trim() || normalizeEmail(user?.email) || normalizePhoneNumber(user?.phone);
        if (meKey) {
          addMember({
            key: `share:${meKey}`,
            userId: String(user?.id || '').trim() || null,
            label: 'You',
          });
        }
      }
    }

    // Enrich roster from actual layer activity so members still show up under stricter share-row visibility.
    try {
      const { data: chatActors } = await supabase
        .from('calendar_messages')
        .select('user_id,created_by,created_at')
        .eq('layer_id', activeLayerId)
        .order('created_at', { ascending: false })
        .limit(300);
      (chatActors || []).forEach((row) => {
        const actorId = String(row?.user_id || '').trim();
        if (!actorId) return;
        const actorLabel = String(row?.created_by || '').trim();
        addMember({
          key: `actor:${actorId}`,
          userId: actorId,
          label: actorLabel || fallbackOwnerLabel(actorId) || 'Member',
        });
      });
    } catch {}

    try {
      const { data: eventActors } = await supabase
        .from('events')
        .select('user_id,created_by,created_at')
        .eq('layer_id', activeLayerId)
        .order('created_at', { ascending: false })
        .limit(300);
      (eventActors || []).forEach((row) => {
        const actorId = String(row?.user_id || '').trim();
        if (!actorId) return;
        const actorLabel = String(row?.created_by || '').trim();
        addMember({
          key: `event-actor:${actorId}`,
          userId: actorId,
          label: actorLabel || fallbackOwnerLabel(actorId) || 'Member',
        });
      });
    } catch {}

    setChatMembers(Array.from(membersMap.values()));
  };

  const sendCalendarChatMessage = async () => {
    const text = String(chatInput || '').trim();
    if (!text || !activeLayerId || !user?.id) return;
    const payload = {
      layer_id: activeLayerId,
      calendar_id: activeLayerId,
      user_id: user.id,
      created_by: currentUser || user?.email || user?.phone || 'User',
      message: buildTextChatMessage(text, {}),
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('calendar_messages')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('Error sending chat message:', error);
      setChatError(`Could not send message: ${error.message}`);
      return;
    }

    setChatError('');
    setChatInput('');
    if (data) {
      setCalendarChatMessages((prev) => {
        const exists = prev.some((row) => String(row?.id || '') === String(data?.id || ''));
        if (exists) return prev;
        return [...prev, data];
      });
    }
  };

  const sendCalendarChatPollMessage = async () => {
    if (!assertCanEditActiveLayer('create event polls')) return;
    if (!activeLayerId || !user?.id) return;
    const eventName = String(pollQuestionInput || '').trim();
    const dateKey = String(pollDateInput || '').trim();
    if (!eventName) {
      setChatError("Add the event name first.");
      return;
    }
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      setChatError('Pick a valid event date.');
      return;
    }
    const options = (pollOptionInputs || []).map(v => String(v || '').trim()).filter(Boolean);
    if (options.length < 2) {
      setChatError('Add at least two poll options.');
      return;
    }

    const payload = {
      layer_id: activeLayerId,
      calendar_id: activeLayerId,
      user_id: user.id,
      created_by: currentUser || user?.email || user?.phone || 'User',
      message: buildLegacyPollMessage({
        question: eventName,
        dateKey,
        options,
        createdBy: currentUser || user?.email || user?.phone || 'User'
      }),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('calendar_messages')
      .insert(payload)
      .select('*')
      .single();
    if (error) {
      console.error('Error sending poll message:', error);
      setChatError(`Could not create event vote: ${error.message}`);
      return;
    }

    setChatError('');
    setShowCreateEventPopup(false);
    setPollComposerStep('menu');
    setPollQuestionInput('');
    setPollDateInput(getDateKey(selectedDate || new Date()));
    setPollOptionInputs(['', '']);
    if (data) {
      setCalendarChatMessages((prev) => {
        const exists = prev.some((row) => String(row?.id || '') === String(data?.id || ''));
        if (exists) return prev;
        return [...prev, data];
      });
    }
    const pollCreator = String(currentUser || user?.email || user?.phone || 'Someone');
    const pollTitle = eventName.length > 56 ? `${eventName.slice(0, 56)}...` : eventName;
    const pollPushResult = await sendImmediatePushNotification({
      type: 'chat_poll',
      title: 'New Poll in Chat',
      body: `${pollCreator} created a poll: "${pollTitle}" (${dateKey}).`,
      layerId: activeLayerId,
      extraData: {
        panel: 'chat',
        dateKey,
      },
    });
    const pollSentCount = Number(pollPushResult?.sent || 0);
    if (!pollPushResult?.ok || pollSentCount <= 0) {
      const reason = pollPushResult?.error || (pollSentCount <= 0 ? 'No subscribed recipients found' : 'Unknown error');
      console.warn('Poll push not sent:', reason, pollPushResult);
      setChatError(`Poll created, but push was not delivered: ${reason}`);
    }
  };

  const createPopupEventFromChat = async () => {
    if (!assertCanEditActiveLayer('create pop-up events')) return;
    if (!activeLayerId || !user?.id) return;
    if (!popupFeatureAvailable) {
      setChatError('Popup events need DB setup first.');
      return;
    }
    const title = String(popupDraftTitle || '').trim();
    const dateKey = String(popupDraftDate || '').trim();
    const time = String(popupDraftTime || '').trim() || null;
    const location = String(popupDraftLocation || '').trim() || null;
    const maxPeople = popupDraftNoMaxPeople
      ? POPUP_NO_MAX_SENTINEL
      : Math.max(1, parseInt(String(popupDraftMaxPeople || '').trim(), 10) || 1);
    if (!title) {
      setChatError('Add the event name first.');
      return;
    }
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      setChatError('Pick a valid event date.');
      return;
    }
      const eventRow = {
        id: `${Date.now()}-${Math.random()}`,
        date: dateKey,
        title,
        time,
        category: 'popup_event',
        is_private: false,
        is_private_for: null,
      is_urgent: false,
      is_multi_day: false,
      multi_day_id: null,
      is_annual: false,
      annual_month: null,
      annual_day: null,
      recurrence: 'once',
      exceptions: null,
      reactions: null,
      location,
      created_by: currentUser || user?.email || user?.phone || 'User',
      created_at: new Date().toISOString(),
      user_id: user.id,
      layer_id: activeLayerId,
      calendar_id: activeLayerId,
    };
    const { data, error } = await supabase
      .from('events')
      .insert(eventRow)
      .select('*')
      .single();
    if (error) {
      setChatError(`Could not create popup event: ${error.message}`);
      return;
    }

    const inserted = data || eventRow;
    setEvents(prev => {
      const next = { ...prev };
      const key = inserted.date;
      const curr = next[key] || [];
      const mapped = {
        id: inserted.id,
        title: inserted.title,
        time: inserted.time,
        date: inserted.date,
        category: inserted.category,
        isPrivate: inserted.is_private,
        isUrgent: inserted.is_urgent,
        isMultiDay: inserted.is_multi_day,
        multiDayId: inserted.multi_day_id,
        isAnnual: inserted.is_annual || false,
        annualMonth: inserted.annual_month || null,
        annualDay: inserted.annual_day || null,
        recurrence: inserted.recurrence || 'once',
        exceptions: inserted.exceptions ? JSON.parse(inserted.exceptions) : [],
        reactions: inserted.reactions ? JSON.parse(inserted.reactions) : {},
        location: inserted.location || null,
        createdBy: inserted.created_by,
        createdAt: inserted.created_at,
        userId: inserted.user_id,
        isShared: String(inserted.user_id || '') !== String(user?.id || ''),
      };
      next[key] = [...curr, mapped].sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
      return next;
    });

    await createPopupEventRows([{
      layer_id: activeLayerId,
      event_id: inserted.id,
      max_people: maxPeople,
      created_by_user_id: user.id,
      created_by_name: currentUser || user?.email || user?.phone || 'Member',
      created_at: new Date().toISOString(),
    }]);

    const invitePayload = {
      eventId: inserted.id,
      title: inserted.title,
      dateKey: inserted.date,
      time: inserted.time,
      location: inserted.location || null,
      maxPeople,
      noMax: maxPeople >= POPUP_NO_MAX_SENTINEL,
      createdBy: currentUser || user?.email || user?.phone || 'Member',
      createdAt: new Date().toISOString(),
    };
    const { data: popupChatMsg } = await supabase
      .from('calendar_messages')
      .insert({
        layer_id: activeLayerId,
        calendar_id: activeLayerId,
        user_id: user.id,
        created_by: currentUser || user?.email || user?.phone || 'User',
        message: buildPopupInviteMessage(invitePayload, {}),
        created_at: new Date().toISOString(),
      })
      .select('*')
      .maybeSingle();
    if (popupChatMsg) {
      setCalendarChatMessages((prev) => {
        const exists = prev.some((row) => String(row?.id || '') === String(popupChatMsg?.id || ''));
        if (exists) return prev;
        return [...prev, popupChatMsg];
      });
    }
    const eventCreator = String(currentUser || user?.email || user?.phone || 'Someone');
    const eventTitle = String(inserted?.title || title || 'Event');
    const eventDate = String(inserted?.date || dateKey || '');
    const eventTime = String(inserted?.time || '').trim();
    const eventBody = eventTime
      ? `${eventCreator} created "${eventTitle}" for ${eventDate} at ${eventTime}.`
      : `${eventCreator} created "${eventTitle}" for ${eventDate}.`;
    const eventPushResult = await sendImmediatePushNotification({
      type: 'chat_event',
      title: 'New Event in Chat',
      body: eventBody,
      layerId: activeLayerId,
      extraData: {
        panel: 'chat',
        eventId: inserted?.id || null,
        dateKey: inserted?.date || dateKey || null,
      },
    });
    const eventSentCount = Number(eventPushResult?.sent || 0);
    if (!eventPushResult?.ok || eventSentCount <= 0) {
      const reason = eventPushResult?.error || (eventSentCount <= 0 ? 'No subscribed recipients found' : 'Unknown error');
      console.warn('Chat event push not sent:', reason, eventPushResult);
      setChatError(`Event created, but push was not delivered: ${reason}`);
    }
    if ((eventPushResult?.ok && eventSentCount > 0)) setChatError('');
    resetPollComposer();
  };

  const resetPollComposer = () => {
    setShowCreateEventPopup(false);
    setPollComposerStep('menu');
    setPollQuestionInput('');
    setPollDateInput(getDateKey(selectedDate || new Date()));
    setPollOptionInputs(['', '']);
    setPopupDraftTitle('');
    setPopupDraftDate(getDateKey(selectedDate || new Date()));
    setPopupDraftTime('');
    setPopupDraftLocation('');
    setPopupDraftMaxPeople('10');
    setPopupDraftNoMaxPeople(false);
  };

  const deleteCalendarChatMessage = async (messageRow) => {
    const messageId = String(messageRow?.id || '');
    if (!messageId || !activeLayerId || !user?.id) return;
    const ownerId = String(messageRow?.user_id || '');
    if (ownerId !== String(user.id)) return;
    const raw = String(messageRow?.message || '');
    const popupInvite = parsePopupInviteMessage(raw);
    const popupEventId = popupInvite ? String(popupInvite?.eventId || '') : '';
    if (!window.confirm('Delete this message?')) return;
    setDeletingChatMessageId(messageId);
    if (popupEventId) {
      const deletedPopup = await deleteEventsByIds([popupEventId], { silent: true });
      if (!deletedPopup) {
        setChatError('Invite removed from chat. Event remains on calendar due to permissions.');
      } else {
        setEvents((prev) => {
          const next = {};
          Object.entries(prev || {}).forEach(([dateKey, rows]) => {
            const filtered = (rows || []).filter((row) => String(row?.id || '') !== popupEventId);
            if (filtered.length) next[dateKey] = filtered;
          });
          return next;
        });
        setPopupEventsByEventId((prev) => {
          const next = { ...(prev || {}) };
          delete next[popupEventId];
          return next;
        });
        setPopupSignupsByEventId((prev) => {
          const next = { ...(prev || {}) };
          delete next[popupEventId];
          return next;
        });
      }
    }
    const { data: hardDeletedRows, error } = await supabase
      .from('calendar_messages')
      .delete()
      .select('id')
      .eq('id', messageId)
      .eq('layer_id', activeLayerId);

    const hardDeleted = Array.isArray(hardDeletedRows)
      && hardDeletedRows.some((row) => String(row?.id || '') === messageId);

    if (error || !hardDeleted) {
      // Fallback for projects without DELETE policy: soft-delete via UPDATE and hide in UI.
      const tombstone = `${CHAT_DELETED_PREFIX}${JSON.stringify({ id: messageId, at: new Date().toISOString(), by: String(user.id) })}`;
      const { data: softDeletedRows, error: softDeleteErr } = await supabase
        .from('calendar_messages')
        .update({ message: tombstone })
        .select('id')
        .eq('id', messageId)
        .eq('layer_id', activeLayerId);

      const softDeleted = Array.isArray(softDeletedRows)
        && softDeletedRows.some((row) => String(row?.id || '') === messageId);

      if (softDeleteErr || !softDeleted) {
        console.error('Error deleting chat message:', error, softDeleteErr);
        setChatError(`Could not delete message: ${(softDeleteErr && softDeleteErr.message) || (error && error.message) || 'Delete permission blocked.'}`);
        setDeletingChatMessageId(null);
        return;
      }
    }
    setChatError('');
    setCalendarChatMessages(prev => prev.filter(row => String(row?.id || '') !== messageId));
    setDeletingChatMessageId(null);
  };

  const reactToChatMessage = async (messageRow, emoji) => {
    const messageId = String(messageRow?.id || '');
    if (!messageId || !activeLayerId || !user?.id || !emoji) return;
    const raw = String(messageRow?.message || '');
    if (!raw || isDeletedChatMessage(raw)) return;

    const poll = parsePollMessage(raw);
    const popupInvite = poll ? null : parsePopupInviteMessage(raw);
    const textPayload = (poll || popupInvite) ? null : parseTextChatMessage(raw);
    const fallbackText = (!poll && !popupInvite && !textPayload) ? raw : '';
    const currentReactions = poll
      ? normalizeChatReactions(poll?.reactions)
      : (popupInvite
        ? normalizeChatReactions(popupInvite?.reactions)
        : normalizeChatReactions(textPayload?.reactions));
    const nextReactions = toggleChatReaction(currentReactions, emoji, user.id);

    let nextMessage = raw;
    if (poll) {
      nextMessage = `${CHAT_POLL_PREFIX}${JSON.stringify({ ...poll, reactions: nextReactions })}`;
    } else if (popupInvite) {
      nextMessage = buildPopupInviteMessage(popupInvite, nextReactions);
    } else if (textPayload) {
      nextMessage = buildTextChatMessage(textPayload.text, nextReactions);
    } else {
      nextMessage = buildTextChatMessage(fallbackText, nextReactions);
    }

    const { data, error } = await supabase
      .from('calendar_messages')
      .update({ message: nextMessage })
      .eq('id', messageId)
      .eq('layer_id', activeLayerId)
      .select('*')
      .limit(1);
    if (error) {
      console.error('Error reacting to chat message:', error);
      setChatError(`Could not add reaction: ${error.message}`);
      return;
    }
    const updatedRow = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!updatedRow) {
      setChatError('Could not add reaction: update permission blocked.');
      return;
    }
    setChatError('');
    setChatReactionPickerFor(null);
    setCalendarChatMessages(prev => prev.map(row => String(row?.id || '') === messageId ? updatedRow : row));
  };

  const insertPollWinnerEvent = async (poll, pollMessageId) => {
    if (!poll || !activeLayerId || !user?.id) return null;
    let eventDateKey = parseDateFromText(poll?.dateKey) || poll?.dateKey || getDateKey(new Date());
    let eventTime = null;
    let eventTitle = String(poll?.question || 'Event').trim() || 'Event';
    let eventLocation = null;

    if (poll?.mode === 'structured') {
      const dims = Array.isArray(poll?.dimensions) ? poll.dimensions : [];
      const winners = poll?.winners || {};
      const pick = (dim) => {
        const idx = coercePollIndex(winners?.[dim], (poll?.optionsByDimension?.[dim] || []).length);
        const opts = poll?.optionsByDimension?.[dim] || [];
        if (!Number.isInteger(idx)) return null;
        return String(opts[idx] || '').trim() || null;
      };
      const whereWinner = pick('where');
      const whenWinner = pick('when');
      if (dims.includes('where') && !whereWinner) return null;
      if (dims.includes('when') && !whenWinner) return null;
      if (whereWinner) eventLocation = whereWinner;
      if (whenWinner) {
        const range = parseDateRangeFromText(whenWinner);
        if (range?.start) eventDateKey = range.start;
        const winnerDate = parseDateFromText(whenWinner);
        if (!range && winnerDate) eventDateKey = winnerDate;
        eventTime = range ? null : parseTimeFromText(whenWinner);
      }
    } else {
      const winnerIndex = coercePollIndex(poll?.winnerIndex, (poll?.options || []).length);
      if (!Number.isInteger(winnerIndex)) return null;
      const winnerOption = String(poll.options[winnerIndex] || '').trim();
      if (!winnerOption) return null;
      const pollFor = ['when', 'what', 'both'].includes(String(poll?.pollFor || '')) ? String(poll.pollFor) : 'both';
      if (pollFor === 'when') {
        const winnerDate = parseDateFromText(winnerOption);
        if (winnerDate) eventDateKey = winnerDate;
        eventTime = parseTimeFromText(winnerOption);
        eventTitle = String(poll?.eventTitle || poll?.question || winnerOption).replace(/\?+$/, '').trim() || winnerOption;
      } else if (pollFor === 'what') {
        eventTitle = winnerOption;
      } else {
        eventTitle = `${poll.question}: ${winnerOption}`;
      }
    }

    let dateKeys = [eventDateKey];
    const structuredWhenWinner = poll?.mode === 'structured' ? (() => {
      const idx = Number(poll?.winners?.when);
      const opts = poll?.optionsByDimension?.when || [];
      return Number.isInteger(idx) && idx >= 0 && idx < opts.length ? String(opts[idx]) : null;
    })() : null;
    if (structuredWhenWinner) {
      const range = parseDateRangeFromText(structuredWhenWinner);
      if (range?.start && range?.end) dateKeys = getDateKeysInRange(range.start, range.end);
    }
    const multiDayId = dateKeys.length > 1 ? `poll-multi-${Date.now()}` : null;
    const nowIso = new Date().toISOString();
    const eventRows = dateKeys.map((dateKey, idx) => ({
      id: `${Date.now()}-${Math.random()}-${idx}`,
      date: dateKey,
      title: eventTitle,
      time: idx === 0 ? eventTime : null,
      category: 'other',
      is_private: false,
      is_private_for: null,
      is_urgent: false,
      is_multi_day: dateKeys.length > 1,
      multi_day_id: multiDayId,
      is_annual: false,
      annual_month: null,
      annual_day: null,
      recurrence: 'once',
      exceptions: null,
      reactions: null,
      location: eventLocation,
      created_by: currentUser || user?.email || user?.phone || 'User',
      created_at: nowIso,
      user_id: user.id,
      layer_id: activeLayerId,
      calendar_id: activeLayerId,
    }));

    const { data: insertedEvents, error: eventErr } = await supabase
      .from('events')
      .insert(eventRows)
      .select('*')
      .order('date', { ascending: true });
    if (eventErr) {
      console.error('Error inserting poll winner event:', eventErr);
      setChatError(`Could not create event from poll: ${eventErr.message}`);
      return null;
    }

    setEvents(prev => {
      const next = { ...prev };
      (insertedEvents || []).forEach((insertedEvent) => {
        const dayKey = insertedEvent.date;
        const dateEvents = next[dayKey] || [];
        const nextEvent = {
          id: insertedEvent.id,
          title: insertedEvent.title,
          time: insertedEvent.time,
          date: insertedEvent.date,
          category: insertedEvent.category,
          isPrivate: insertedEvent.is_private,
          isUrgent: insertedEvent.is_urgent,
          isMultiDay: insertedEvent.is_multi_day,
          multiDayId: insertedEvent.multi_day_id,
          isAnnual: insertedEvent.is_annual || false,
          annualMonth: insertedEvent.annual_month || null,
          annualDay: insertedEvent.annual_day || null,
          recurrence: insertedEvent.recurrence || 'once',
          exceptions: insertedEvent.exceptions ? JSON.parse(insertedEvent.exceptions) : [],
          reactions: insertedEvent.reactions ? JSON.parse(insertedEvent.reactions) : {},
          location: insertedEvent.location || null,
          createdBy: insertedEvent.created_by,
          createdAt: insertedEvent.created_at,
          userId: insertedEvent.user_id,
          isShared: String(insertedEvent.user_id || '') !== String(user?.id || ''),
        };
        next[dayKey] = [...dateEvents, nextEvent].sort((a, b) => {
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
        });
      });
      return next;
    });

    const resolvedPoll = {
      ...poll,
      resolved: true,
      createdEventId: insertedEvents?.[0]?.id || null,
    };
    const { data: updatedMessage, error: msgErr } = await supabase
      .from('calendar_messages')
      .update({ message: `${CHAT_POLL_PREFIX}${JSON.stringify(resolvedPoll)}` })
      .eq('id', pollMessageId)
      .eq('layer_id', activeLayerId)
      .select('*')
      .single();
    if (msgErr) {
      console.error('Error marking poll as resolved:', msgErr);
      return insertedEvents?.[0] || null;
    }
    if (updatedMessage) {
      setCalendarChatMessages(prev => prev.map(m => String(m?.id) === String(updatedMessage.id) ? updatedMessage : m));
    }
    return insertedEvents?.[0] || null;
  };

  const voteOnChatPoll = async (messageRow, optionIndex, dimensionKey = null) => {
    if (!messageRow?.id || !activeLayerId || !user?.id) return;
    const poll = parsePollMessage(messageRow.message);
    if (!poll || poll.resolved) return;
    const nextPoll = { ...poll };
    let shouldInsertEvent = false;
    const eligibleVoterCount = await getEligiblePollVoterCount(activeLayerId);

    if (poll.mode === 'structured') {
      const dim = String(dimensionKey || '').toLowerCase();
      if (!['what', 'where', 'when'].includes(dim)) return;
      const opts = poll?.optionsByDimension?.[dim] || [];
      if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= opts.length) return;
      nextPoll.votesByDimension = {
        ...(poll.votesByDimension || {}),
        [dim]: {
          ...(poll?.votesByDimension?.[dim] || {}),
          [String(user.id)]: optionIndex,
        },
      };
      const maj = getPollMajorityWinner(nextPoll, dim, eligibleVoterCount);
      if (Number.isInteger(maj.winnerIndex)) {
        nextPoll.winners = { ...(poll.winners || {}), [dim]: maj.winnerIndex };
      } else {
        nextPoll.winners = { ...(poll.winners || {}), [dim]: null };
      }
      const dims = Array.isArray(nextPoll?.dimensions) ? nextPoll.dimensions : [];
      shouldInsertEvent = dims.length > 0 && dims.every((key) => {
        const opts = nextPoll?.optionsByDimension?.[key] || [];
        return Number.isInteger(coercePollIndex(nextPoll?.winners?.[key], opts.length));
      });
    } else {
      if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) return;
      nextPoll.votes = {
        ...(poll.votes || {}),
        [String(user.id)]: optionIndex,
      };
      const majority = getPollMajorityWinner(nextPoll, null, eligibleVoterCount);
      if (Number.isInteger(majority.winnerIndex)) nextPoll.winnerIndex = majority.winnerIndex;
      shouldInsertEvent = Number.isInteger(coercePollIndex(nextPoll?.winnerIndex, (nextPoll?.options || []).length));
    }

    const { data: updatedRow, error } = await supabase
      .from('calendar_messages')
      .update({ message: `${CHAT_POLL_PREFIX}${JSON.stringify(nextPoll)}` })
      .eq('id', messageRow.id)
      .eq('layer_id', activeLayerId)
      .select('*')
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('Error voting on poll:', error);
      setChatError(`Could not submit vote: ${error.message}`);
      return;
    }

    setChatError('');
    const targetId = String(updatedRow?.id || messageRow?.id || '');
    if (updatedRow) {
      setCalendarChatMessages(prev => prev.map(m => String(m?.id) === String(updatedRow.id) ? updatedRow : m));
    } else {
      // Keep local UI responsive when update succeeds but no row is returned by policy/shape.
      setCalendarChatMessages(prev => prev.map((m) => (
        String(m?.id || '') === targetId ? { ...m, message: `${CHAT_POLL_PREFIX}${JSON.stringify(nextPoll)}` } : m
      )));
    }
    if (shouldInsertEvent && !nextPoll.resolved && !nextPoll.createdEventId) {
      await insertPollWinnerEvent(nextPoll, targetId);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        const userEmail = session?.user?.email;
        const userPhone = session?.user?.phone;
        if (!userId) return;
        const shareRecipientFilter = buildShareRecipientFilter(userId, userEmail, userPhone);
        let loadedLayers = await loadLayersForUser(userId, userEmail, userPhone);
        if (!loadedLayers || loadedLayers.length === 0) {
          // Retry once; loadLayersForUser already contains bootstrap logic.
          loadedLayers = await loadLayersForUser(userId, userEmail, userPhone);
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

        // Load all events visible in this layer (owner + collaborators).
        const { data: layerEventsData, error: layerEventsError } = await supabase
          .from('events')
          .select('*')
          .eq('layer_id', selectedLayerId);

        // Load calendars shared WITH me (by email/id)
        let sharedWithMeQuery = supabase
          .from('shared_access')
          .select('*')
          .eq('layer_id', selectedLayerId);
        if (shareRecipientFilter) sharedWithMeQuery = sharedWithMeQuery.or(shareRecipientFilter);
        const { data: sharedWithMeRaw } = await sharedWithMeQuery;
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
        } else {
          setSharedCalendars([]);
          setSharedOwnerLabels({});
        }

        if (layerEventsError) {
          console.error('Error loading events:', layerEventsError);
        } else if (layerEventsData) {
          const eventsObj = {};
          layerEventsData.forEach(event => {
            if (!eventsObj[event.date]) eventsObj[event.date] = [];
            eventsObj[event.date].push(mapSupabaseEventRow(event, userId));
          });
          setEvents(eventsObj);
          if (typeof window !== 'undefined') window.events = eventsObj;
        }

        // Load people I've shared with
        const { data: mySharesData } = await supabase
          .from('shared_access')
          .select('*')
          .eq('owner_id', userId)
          .eq('layer_id', selectedLayerId);
        setMyShares(mySharesData || []);

        const activeLayerRow = loadedLayers.find(layer => String(layer.id) === String(selectedLayerId));
        await loadCategoriesForLayer(selectedLayerId, userId, activeLayerRow?.owner_id || userId);
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
        if (!userId || !activeLayerId) return;

        const { data: layerEventsData, error: layerEventsError } = await supabase
          .from('events')
          .select('*')
          .eq('layer_id', activeLayerId);
        if (layerEventsError) {
          console.error('Error refreshing layer events:', layerEventsError);
          return;
        }

        const eventsObj = {};
        (layerEventsData || []).forEach(event => {
          if (!eventsObj[event.date]) eventsObj[event.date] = [];
          eventsObj[event.date].push(mapSupabaseEventRow(event, userId));
        });
        setEvents(eventsObj);
        if (typeof window !== 'undefined') window.events = eventsObj;
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
      if (session?.user) setCurrentUser(getAuthIdentityLabel(session.user));
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setShowAuth(!session?.user);
      if (session?.user) setCurrentUser(getAuthIdentityLabel(session.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!primaryListOwnerId) return;
    loadSharedListGroups(primaryListOwnerId);
  }, [primaryListOwnerId, activeLayerId]);

  useEffect(() => {
    if (!user?.id || !activeLayerId) return;
    const runKey = `${String(user.id)}:${String(activeLayerId)}`;
    if (holidayCleanupRunRef.current.has(runKey)) return;
    holidayCleanupRunRef.current.add(runKey);
    cleanupDuplicateHolidayEventsForCurrentUserLayer().then((removed) => {
      if (removed > 0) {
        console.info(`Removed ${removed} duplicate holiday event(s) in this calendar layer.`);
      }
    }).catch((err) => {
      console.error('Automatic holiday duplicate cleanup failed:', err);
    });
  }, [user?.id, activeLayerId]);

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
    if (!showChatPanel || !activeLayerId) {
      if (!showChatPanel) setChatInput('');
      return;
    }
    loadCalendarChatMessages();
  }, [showChatPanel, activeLayerId]);

  useEffect(() => {
    if (!activeLayerId) {
      setPopupEventsByEventId({});
      setPopupSignupsByEventId({});
      return;
    }
    loadPopupEventData();
  }, [activeLayerId, layerRefreshToken]);

  useEffect(() => {
    if (!activeLayerId || !user?.id) return;
    const ownerIdForLayer = String(
      (layers || []).find((layer) => String(layer?.id || '') === String(activeLayerId || ''))?.owner_id
      || user.id
    ).trim();
    const categoriesChannel = supabase
      .channel(`categories-${activeLayerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `layer_id=eq.${activeLayerId}` }, async () => {
        await loadCategoriesForLayer(activeLayerId, user.id, ownerIdForLayer);
      })
      .subscribe();

    return () => {
      categoriesChannel.unsubscribe();
    };
  }, [activeLayerId, user?.id, layers]);

  useEffect(() => {
    if (!activeLayerId) {
      setChatMembers([]);
      setShowChatMembersPanel(false);
      return;
    }
    loadChatMembers();
  }, [activeLayerId, activeLayerOwnerId, user?.id, user?.email, user?.phone, currentUser, myShares, sharedOwnerLabels, layerRefreshToken]);

  useEffect(() => {
    if (!activeLayerId || !user?.id) {
      setChatPresenceByUserId({});
      return;
    }
    const presenceChannel = supabase.channel(`calendar-chat-presence-${activeLayerId}`, {
      config: { presence: { key: String(user.id) } },
    });
    const syncPresence = () => {
      const state = presenceChannel.presenceState();
      const next = {};
      Object.values(state || {}).forEach((metas) => {
        (metas || []).forEach((meta) => {
          const uid = String(meta?.userId || '').trim();
          if (!uid) return;
          next[uid] = {
            userId: uid,
            label: String(meta?.label || ''),
            at: String(meta?.at || ''),
          };
        });
      });
      setChatPresenceByUserId(next);
    };

    presenceChannel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        if (showChatPanel) {
          await presenceChannel.track({
            userId: String(user.id),
            label: String(currentUser || user?.email || user?.phone || 'Member'),
            at: new Date().toISOString(),
          });
        }
      });

    return () => {
      presenceChannel.unsubscribe();
      setChatPresenceByUserId({});
    };
  }, [activeLayerId, user?.id, showChatPanel, currentUser, user?.email, user?.phone]);

  useEffect(() => {
    if (!activeLayerId) return;
    const channel = supabase
      .channel(`calendar-chat-${activeLayerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_messages', filter: `layer_id=eq.${activeLayerId}` }, (payload) => {
        const eventType = String(payload?.eventType || '').toUpperCase();
        if (eventType === 'DELETE') {
          const deletedId = String(payload?.old?.id || '');
          if (!deletedId) return;
          setDeletingChatMessageId((prev) => (String(prev || '') === deletedId ? null : prev));
          setCalendarChatMessages(prev => prev.filter((m) => String(m?.id || '') !== deletedId));
          return;
        }
        const row = payload?.new;
        if (!row) return;
        if (isDeletedChatMessage(row?.message)) {
          setCalendarChatMessages(prev => prev.filter((m) => String(m?.id || '') !== String(row?.id || '')));
          return;
        }
        if (
          eventType === 'INSERT'
          && !showChatPanel
          && String(row?.user_id || '') !== String(user?.id || '')
        ) {
          const layerKey = String(activeLayerId || '');
          if (layerKey) {
            setChatUnreadCounts(prev => ({
              ...prev,
              [layerKey]: (Number(prev[layerKey] || 0) + 1),
            }));
          }
        }
        setCalendarChatMessages((prev) => {
          const idx = prev.findIndex((m) => String(m?.id || '') === String(row?.id || ''));
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = row;
            return copy;
          }
          return [...prev, row];
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [showChatPanel, activeLayerId, user?.id]);

  useEffect(() => {
    if (!activeLayerId) return;
    const channel = supabase
      .channel(`popup-events-${activeLayerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'popup_events', filter: `layer_id=eq.${activeLayerId}` }, () => {
        loadPopupEventData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'popup_event_signups', filter: `layer_id=eq.${activeLayerId}` }, () => {
        loadPopupEventData();
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [activeLayerId, user?.id]);

  useEffect(() => {
    if (!showChatPanel || !activeLayerId) return;
    markChatSeenForLayer(activeLayerId);
  }, [showChatPanel, activeLayerId]);

  useEffect(() => {
    if (!user?.id) {
      setChatLastSeenByLayer({});
      setChatUnreadCounts({});
      return;
    }
    const storageKey = `chat-last-seen-${user.id}`;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      const normalized = (parsed && typeof parsed === 'object') ? parsed : {};
      setChatLastSeenByLayer(normalized);
    } catch {
      setChatLastSeenByLayer({});
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const storageKey = `chat-last-seen-${user.id}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(chatLastSeenByLayer));
    } catch {}
  }, [user?.id, chatLastSeenByLayer]);

  useEffect(() => {
    const syncUnreadForActiveLayer = async () => {
      if (!activeLayerId || !user?.id || showChatPanel) return;
      const layerKey = String(activeLayerId);
      const lastSeen = chatLastSeenByLayer[layerKey];
      let query = supabase
        .from('calendar_messages')
        .select('id,user_id,created_at,message')
        .eq('layer_id', activeLayerId)
        .order('created_at', { ascending: false })
        .limit(250);
      if (lastSeen) query = query.gt('created_at', lastSeen);
      const { data, error } = await query;
      if (error) return;
      const unread = (data || []).filter(row => (
        String(row?.user_id || '') !== String(user.id)
        && !isDeletedChatMessage(row?.message)
      )).length;
      setChatUnreadCounts(prev => ({ ...prev, [layerKey]: unread }));
    };

    syncUnreadForActiveLayer();
    if (showChatPanel || !activeLayerId || !user?.id) return;

    const intervalId = window.setInterval(syncUnreadForActiveLayer, 15000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncUnreadForActiveLayer();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', syncUnreadForActiveLayer);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', syncUnreadForActiveLayer);
    };
  }, [activeLayerId, user?.id, showChatPanel, chatLastSeenByLayer, layerRefreshToken]);

  useEffect(() => {
    if (!showChatPanel || !calendarChatScrollRef.current) return;
    const el = calendarChatScrollRef.current;
    el.scrollTop = el.scrollHeight;
  }, [showChatPanel, calendarChatMessages.length]);

  useEffect(() => {
    if (!chatReactionPickerFor) return;
    const closeOnOutsidePointer = (event) => {
      const target = event?.target;
      if (target && typeof target.closest === 'function' && target.closest('[data-chat-reaction-picker="true"]')) return;
      setChatReactionPickerFor(null);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
    };
  }, [chatReactionPickerFor]);

  useEffect(() => {
    if (!user?.id) {
      seenInAppNotificationKeysRef.current = new Set();
      dismissedCalendarInviteIdsRef.current = new Set();
      seenExpenseIdsRef.current = new Set();
      inAppSyncCursorRef.current = { events: null, subCalEvents: null, tripPhotos: null, sharedListItems: null, tripInvites: null };
      setInAppNotifications([]);
      return;
    }
    const storageKey = `in-app-notifications-${user.id}`;
    const dismissedCalendarInvitesKey = `dismissed-calendar-invites-${user.id}`;
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
        target: (item?.target && typeof item.target === 'object') ? item.target : null,
      })).filter(item => item.key && item.message) : [];
      seenInAppNotificationKeysRef.current = new Set(normalized.map(item => item.key));
      setInAppNotifications(normalized);
      const cursorRaw = localStorage.getItem(cursorKey);
      const parsedCursor = cursorRaw ? JSON.parse(cursorRaw) : null;
      const seenExpensesRaw = localStorage.getItem(expenseSeenKey);
      const parsedSeenExpenses = seenExpensesRaw ? JSON.parse(seenExpensesRaw) : [];
      const dismissedRaw = localStorage.getItem(dismissedCalendarInvitesKey);
      const parsedDismissed = dismissedRaw ? JSON.parse(dismissedRaw) : [];
      const fallbackTs = new Date(Date.now() - (5 * 60 * 1000)).toISOString();
      seenExpenseIdsRef.current = new Set(Array.isArray(parsedSeenExpenses) ? parsedSeenExpenses.map(v => String(v)) : []);
      dismissedCalendarInviteIdsRef.current = new Set(
        Array.isArray(parsedDismissed) ? parsedDismissed.map(v => String(v)) : []
      );
      inAppSyncCursorRef.current = {
        events: parsedCursor?.events || fallbackTs,
        subCalEvents: parsedCursor?.subCalEvents || fallbackTs,
        tripPhotos: parsedCursor?.tripPhotos || fallbackTs,
        sharedListItems: parsedCursor?.sharedListItems || fallbackTs,
        tripInvites: parsedCursor?.tripInvites || fallbackTs,
      };
    } catch {
      seenInAppNotificationKeysRef.current = new Set();
      dismissedCalendarInviteIdsRef.current = new Set();
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
    const myEmail = normalizeEmail(user?.email);
    const myPhone = normalizePhoneNumber(user?.phone);
    const memberRecipientFilter = buildMemberRecipientFilter(myEmail, myPhone);
    const shareRecipientFilter = buildShareRecipientFilter(me, myEmail, myPhone);
    const subCalIdSet = new Set((subCalendars || []).map(sc => String(sc.id)));
    const subCalNameMap = {};
    (subCalendars || []).forEach(sc => { subCalNameMap[String(sc.id)] = sc.name || 'Trip'; });
    const accessibleSubCalIdCache = new Set(subCalIdSet);
    const accessibleOwnerIdCache = new Set([me]);
    const accessibleLayerIdCache = new Set((layers || []).map((layer) => String(layer?.id || '')).filter(Boolean));

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

      const memberRowsQuery = supabase
        .from('sub_calendar_members')
        .select('sub_calendar_id')
        .eq('sub_calendar_id', normalizedId);
      const memberRowsResult = memberRecipientFilter
        ? await memberRowsQuery.or(memberRecipientFilter).limit(1)
        : { data: [], error: null };
      const memberRowsData = memberRowsResult.data;
      const memberErr = memberRowsResult.error;
      if (!memberErr && (memberRowsData || []).length > 0) {
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
        .or(shareRecipientFilter)
        .limit(1);
      if (scLayerId) shareByIdQuery = shareByIdQuery.eq('layer_id', scLayerId);
      const { data: shareById, error: shareByIdErr } = await shareByIdQuery;
      if (!shareByIdErr && (shareById || []).length > 0) {
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
        .or(shareRecipientFilter)
        .limit(1);
      if (!shareByIdErr && (shareById || []).length > 0) {
        accessibleOwnerIdCache.add(ownerId);
        return true;
      }

      return false;
    };

    const canAccessLayerId = async (layerIdValue) => {
      const layerId = String(layerIdValue || '').trim();
      if (!layerId) return false;
      if (accessibleLayerIdCache.has(layerId)) return true;

      const { data: layerRow, error: layerErr } = await supabase
        .from('calendar_layers')
        .select('id,owner_id')
        .eq('id', layerId)
        .maybeSingle();
      if (!layerErr && layerRow && String(layerRow.owner_id || '') === me) {
        accessibleLayerIdCache.add(layerId);
        return true;
      }

      const { data: acceptedShareRows, error: acceptedShareErr } = await supabase
        .from('shared_access')
        .select('id')
        .eq('layer_id', layerId)
        .eq('shared_with_id', me)
        .limit(1);
      if (!acceptedShareErr && (acceptedShareRows || []).length > 0) {
        accessibleLayerIdCache.add(layerId);
        return true;
      }

      // Support recipient-based shares where shared_with_id may not be populated yet.
      if (shareRecipientFilter) {
        const { data: recipientShareRows, error: recipientShareErr } = await supabase
          .from('shared_access')
          .select('id')
          .eq('layer_id', layerId)
          .or(shareRecipientFilter)
          .limit(1);
        if (!recipientShareErr && (recipientShareRows || []).length > 0) {
          accessibleLayerIdCache.add(layerId);
          return true;
        }
      }

      return false;
    };

    const updatesChannel = supabase
      .channel(`in-app-updates-${me}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, async ({ new: row }) => {
        if (!row || isOwnRow(row)) return;
        if (!(await canAccessLayerId(row.layer_id || row.calendar_id))) return;
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
        if (!(await canAccessLayerId(row.layer_id || row.calendar_id))) return;
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
        const inviteIdentity = getInviteIdentityFromRow(row);
        if (!inviteIdentity || (inviteIdentity !== myEmail && inviteIdentity !== myPhone)) return;
        if (String(row.added_by || '') === me) return;
        const status = String(row?.status || '').trim().toLowerCase();
        if (status && status !== 'pending') return;
        if (row?.accepted_at) return;
        const subCalId = String(row.sub_calendar_id || '');
        if (!subCalId) return;
        const tripName = subCalNameMap[subCalId] || 'a trip';
        const stamp = String(row?.invited_at || row?.created_at || '');
        addInAppNotification({
          key: `trip_invite:${subCalId}:${inviteIdentity}:${stamp}`,
          type: 'invite',
          message: `You were invited to ${tripName}.`,
          createdAt: row.created_at || new Date().toISOString(),
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shared_access' }, async ({ new: row }) => {
        if (!row) return;
        const rowId = String(row.id || '').trim();
        if (rowId && dismissedCalendarInviteIdsRef.current.has(rowId)) return;
        const sharedWithId = String(row.shared_with_id || '');
        const sharedRecipient = getShareRecipientFromRow(row);
        const layerId = String(row.layer_id || '').trim();
        // Only notify for pending invites. Accepted shares have shared_with_id set.
        if (sharedWithId) return;
        if (sharedWithId !== me && sharedRecipient !== myEmail && sharedRecipient !== myPhone) return;
        if (String(row.owner_id || '') === me) return;

        let calendarName = 'a calendar';
        if (layerId) {
          const { data: layerRow } = await supabase
            .from('calendar_layers')
            .select('name')
            .eq('id', layerId)
            .maybeSingle();
          const maybeName = String(layerRow?.name || '').trim();
          if (maybeName) calendarName = `"${maybeName}"`;
        }

        addInAppNotification({
          key: `calendar_invite:${String(row.id || '')}:${layerId}`,
          type: 'invite',
          message: `You were invited to ${calendarName}.`,
          createdAt: row.created_at || new Date().toISOString(),
        });
      })
      .subscribe();

    return () => {
      updatesChannel.unsubscribe();
    };
  }, [user?.id, user?.email, user?.phone, currentUser, subCalendars, layers]);

  useEffect(() => {
    if (!user?.id) return;
    const me = String(user.id);
    const myEmail = normalizeEmail(user?.email);
    const myPhone = normalizePhoneNumber(user?.phone);
    const myName = String(currentUser || '').trim().toLowerCase();
    const memberRecipientFilter = buildMemberRecipientFilter(myEmail, myPhone);
    if (!memberRecipientFilter) return;
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
          key: `events:${row.id}:${String(row.layer_id || '')}`,
          type: 'event',
          message: `${who} added "${row.title || 'an event'}" to the calendar.`,
          createdAt: row.created_at,
          target: {
            layerId: String(row.layer_id || '').trim() || null,
            eventId: String(row.id || '').trim() || null,
            dateKey: String(row.date || '').trim() || null,
          },
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
          key: `shared_lists:${row.id}:${String(row.layer_id || '')}`,
          type: 'list',
          message: `${who} added "${preview || 'a list item'}" to the list.`,
          createdAt: row.created_at,
          target: {
            layerId: String(row.layer_id || '').trim() || null,
            listItemId: String(row.id || '').trim() || null,
            listId: String(row.list_id || '').trim() || null,
          },
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
        const inviteIdentity = getInviteIdentityFromRow(row);
        if (!inviteIdentity || (inviteIdentity !== myEmail && inviteIdentity !== myPhone)) return;
        if (String(row?.added_by || '') === me) return;
        const status = String(row?.status || '').trim().toLowerCase();
        if (status && status !== 'pending') return;
        if (row?.accepted_at) return;
        const subCalId = String(row?.sub_calendar_id || '');
        if (!subCalId) return;
        const tripName = String(row?.sub_calendar_name || subCalNameMap[subCalId] || 'a trip');
        const stamp = String(row?.invited_at || row?.created_at || '');
        addInAppNotification({
          key: `trip_invite:${subCalId}:${inviteIdentity}:${stamp}`,
          type: 'invite',
          message: `You were invited to ${tripName}.`,
          createdAt: row?.created_at || new Date().toISOString(),
        });
      });
    };

    const notifyCalendarShares = async (rows) => {
      const acceptedLayerIds = new Set(
        (rows || [])
          .filter((row) => String(row?.shared_with_id || '') === me)
          .map((row) => String(row?.layer_id || '').trim())
          .filter(Boolean)
      );

      if (acceptedLayerIds.size > 0) {
        const removedKeys = [];
        setInAppNotifications(prev => prev.filter((item) => {
          const key = String(item?.key || '');
          if (!key.startsWith('calendar_invite:')) return true;
          const parts = key.split(':');
          const layerId = String(parts?.[2] || '').trim();
          const shouldRemove = Boolean(layerId) && acceptedLayerIds.has(layerId);
          if (shouldRemove) removedKeys.push(key);
          return !shouldRemove;
        }));
        removedKeys.forEach((key) => seenInAppNotificationKeysRef.current.delete(key));
      }

      const inviteRows = (rows || []).filter((row) => {
        const rowId = String(row?.id || '').trim();
        if (rowId && dismissedCalendarInviteIdsRef.current.has(rowId)) return false;
        const ownerId = String(row?.owner_id || '');
        if (!ownerId || ownerId === me) return false;
        const sharedWithId = String(row?.shared_with_id || '');
        const sharedRecipient = getShareRecipientFromRow(row);
        const layerId = String(row?.layer_id || '').trim();
        // Only surface pending calendar invites.
        if (sharedWithId) return false;
        if (layerId && acceptedLayerIds.has(layerId)) return false;
        return sharedRecipient === myEmail || sharedRecipient === myPhone;
      });
      if (inviteRows.length === 0) return;

      const layerIds = Array.from(new Set(inviteRows.map(row => String(row?.layer_id || '')).filter(Boolean)));
      const layerNameMap = {};
      if (layerIds.length > 0) {
        const { data: layerRows, error: layerErr } = await supabase
          .from('calendar_layers')
          .select('id,name')
          .in('id', layerIds);
        if (layerErr) {
          console.error('calendar_layers invite name fetch failed:', layerErr);
        } else {
          (layerRows || []).forEach(layer => {
            layerNameMap[String(layer.id)] = layer.name || 'a calendar';
          });
        }
      }

      inviteRows.forEach((row) => {
        const layerId = String(row?.layer_id || '');
        const calendarName = layerNameMap[layerId] || 'a calendar';
        const rowId = String(row?.id || '');
        if (!rowId || !layerId) return;
        addInAppNotification({
          key: `calendar_invite:${rowId}:${layerId}`,
          type: 'invite',
          message: `You were invited to "${calendarName}".`,
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

      let memberRows = [];
      let memberErr = null;
      if (memberRecipientFilter) {
        const memberResult = await supabase
          .from('sub_calendar_members')
          .select('sub_calendar_id')
          .or(memberRecipientFilter);
        memberRows = memberResult.data || [];
        memberErr = memberResult.error;
      }
      if (!memberErr) (memberRows || []).forEach(r => { if (r?.sub_calendar_id) ids.add(String(r.sub_calendar_id)); });

      const { data: sharesById, error: sharesByIdErr } = await supabase
        .from('shared_access')
        .select('owner_id')
        .eq('shared_with_id', me);
      const { data: sharesByRecipientRows, error: sharesByRecipientErr } = await supabase
        .from('shared_access')
        .select('owner_id,shared_with_email,shared_with_phone');
      const sharesByRecipient = (sharesByRecipientRows || []).filter((row) => {
        const recipient = getShareRecipientFromRow(row);
        return recipient && (recipient === myEmail || recipient === myPhone);
      });

      const ownerIds = new Set();
      if (!sharesByIdErr) (sharesById || []).forEach(s => { if (s?.owner_id) ownerIds.add(String(s.owner_id)); });
      if (!sharesByRecipientErr) sharesByRecipient.forEach(s => { if (s?.owner_id) ownerIds.add(String(s.owner_id)); });

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
        const shareRecipientFilter = buildShareRecipientFilter(user?.id, user?.email, user?.phone);
        let sharedDataQuery = supabase
          .from('shared_access')
          .select('id,owner_id,layer_id,shared_with_id,shared_with_email,shared_with_phone,created_at');
        if (shareRecipientFilter) sharedDataQuery = sharedDataQuery.or(shareRecipientFilter);
        const { data: sharedData } = await sharedDataQuery;
        const accessibleShares = (sharedData || []).filter((row) => {
          const sharedWithId = String(row?.shared_with_id || '');
          const sharedRecipient = getShareRecipientFromRow(row);
          return sharedWithId === me || sharedRecipient === myEmail || sharedRecipient === myPhone;
        });
        const sharedLayerIds = Array.from(new Set(accessibleShares.map(s => String(s.layer_id || '')).filter(Boolean)));
        await notifyCalendarShares(sharedData || []);

        if (sharedLayerIds.length > 0) {
          const { data: sharedEvents } = await supabase
            .from('events')
            .select('id,title,date,created_by,user_id,created_at,layer_id')
            .in('layer_id', sharedLayerIds)
            .gt('created_at', getCursor('events'))
            .order('created_at', { ascending: true })
            .limit(200);
          notifySharedEvents(sharedEvents);
          updateCursor('events', sharedEvents);

          const { data: sharedListItems } = await supabase
            .from('shared_lists')
            .select('id,list_id,text,created_by,user_id,created_at,layer_id')
            .in('layer_id', sharedLayerIds)
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
          .select('sub_calendar_id,email,phone,added_by,status,invited_at,accepted_at')
          .or(memberRecipientFilter)
          .eq('status', 'pending')
          .or(`invited_at.gt.${getCursor('tripInvites')},accepted_at.gt.${getCursor('tripInvites')}`)
          .order('invited_at', { ascending: true, nullsFirst: false })
          .limit(200);
        if (inviteErr) {
          console.error('sub_calendar_members invite poll failed:', inviteErr);
        }
        const { data: nullInviteRows, error: nullInviteErr } = await supabase
          .from('sub_calendar_members')
          .select('sub_calendar_id,email,phone,added_by,status,invited_at,accepted_at')
          .or(memberRecipientFilter)
          .eq('status', 'pending')
          .is('invited_at', null)
          .limit(200);
        if (nullInviteErr) {
          console.error('sub_calendar_members null-invited_at invite poll failed:', nullInviteErr);
        }
        const inviteRows = Array.from(new Map([...(datedInviteRows || []), ...(nullInviteRows || [])].map(row => [`${String(row?.sub_calendar_id || '')}|${getInviteIdentityFromRow(row)}`, row])).values());
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
  }, [user?.id, user?.email, user?.phone, currentUser, subCalendars, layers]);

  // Invite notifications must work even when no active layer is selected yet.
  useEffect(() => {
    if (!user?.id) return;
    const me = String(user.id);
    const myEmail = normalizeEmail(user.email);
    const myPhone = normalizePhoneNumber(user.phone);
    const memberRecipientFilter = buildMemberRecipientFilter(myEmail, myPhone);
    if (!memberRecipientFilter) return;

    const notifyInvites = async (rows) => {
        const inviteRows = (rows || []).filter(row => {
          const inviteIdentity = getInviteIdentityFromRow(row);
          if (!inviteIdentity || (inviteIdentity !== myEmail && inviteIdentity !== myPhone)) return false;
          if (String(row?.added_by || '') === me) return false;
          const status = String(row?.status || '').trim().toLowerCase();
          if (status && status !== 'pending') return false;
          if (row?.accepted_at) return false;
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
          const inviteIdentity = getInviteIdentityFromRow(row);
          const inviteKey = `trip_invite:${subCalId}:${inviteIdentity}:${stamp}`;
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
          .select('sub_calendar_id,email,phone,added_by,status,accepted_at,invited_at')
          .or(memberRecipientFilter)
          .eq('status', 'pending')
          .or(`accepted_at.gt.${cursor},invited_at.gt.${cursor}`)
          .order('invited_at', { ascending: true, nullsFirst: false })
          .limit(200);
        const { data: nullRows } = await supabase
          .from('sub_calendar_members')
          .select('sub_calendar_id,email,phone,added_by,status,accepted_at,invited_at')
          .or(memberRecipientFilter)
          .eq('status', 'pending')
          .is('invited_at', null)
          .limit(200);
        const merged = Array.from(new Map([...(datedRows || []), ...(nullRows || [])].map(row => [`${String(row?.sub_calendar_id || '')}|${getInviteIdentityFromRow(row)}`, row])).values());
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
  }, [user?.id, user?.email, user?.phone, layers]);

  const loadPendingTripInvites = async () => {
    const myEmail = normalizeEmail(user?.email);
    const myPhone = normalizePhoneNumber(user?.phone);
    const memberRecipientFilter = buildMemberRecipientFilter(myEmail, myPhone);
    if (!memberRecipientFilter) {
      setPendingTripInvites([]);
      return;
    }
    try {
      const me = String(user?.id || '');
      let rows = [];
      const pendingResult = await supabase
        .from('sub_calendar_members')
        .select('sub_calendar_id,email,phone,added_by,status,invited_at,accepted_at')
        .or(memberRecipientFilter)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false, nullsFirst: false })
        .limit(200);
      if (!pendingResult.error) {
        rows = pendingResult.data || [];
      } else {
        const fallback = await supabase
          .from('sub_calendar_members')
          .select('sub_calendar_id,email,phone,added_by,status,invited_at,accepted_at')
          .or(memberRecipientFilter)
          .order('invited_at', { ascending: false, nullsFirst: false })
          .limit(200);
        if (fallback.error) {
          console.error('loadPendingTripInvites failed:', fallback.error);
          setPendingTripInvites([]);
          return;
        }
        rows = (fallback.data || []).filter((row) => {
          const status = String(row?.status || '').toLowerCase();
          return status === 'pending';
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
            identity: getInviteIdentityFromRow(row),
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
    if (!invite || !user?.id) return;
    const myEmail = normalizeEmail(user?.email);
    const myPhone = normalizePhoneNumber(user?.phone);
    const memberRecipientFilter = buildMemberRecipientFilter(myEmail, myPhone);
    if (!memberRecipientFilter) return;
    try {
      const { error: updateErr } = await supabase
        .from('sub_calendar_members')
        .update({ status: 'accepted' })
        .eq('sub_calendar_id', invite.subCalendarId)
        .or(memberRecipientFilter);
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
      clearInviteNotifications({ kind: 'trip', subCalendarId: invite.subCalendarId });
      setLayerRefreshToken(prev => prev + 1);
    } catch (err) {
      alert(`Accept failed: ${err.message || 'Unknown error'}`);
    }
  };

  const declineTripInvite = async (invite) => {
    if (!invite || !user?.id) return;
    const myEmail = normalizeEmail(user?.email);
    const myPhone = normalizePhoneNumber(user?.phone);
    const memberRecipientFilter = buildMemberRecipientFilter(myEmail, myPhone);
    if (!memberRecipientFilter) return;
    try {
      const { error: updateErr } = await supabase
        .from('sub_calendar_members')
        .update({ status: 'declined' })
        .eq('sub_calendar_id', invite.subCalendarId)
        .or(memberRecipientFilter);
      if (updateErr) {
        alert(`Decline failed: ${updateErr.message || 'Could not update invite status.'}`);
        return;
      }
      setPendingTripInvites(prev => prev.filter(item => item.subCalendarId !== invite.subCalendarId));
      clearInviteNotifications({ kind: 'trip', subCalendarId: invite.subCalendarId });
    } catch (err) {
      alert(`Decline failed: ${err.message || 'Unknown error'}`);
    }
  };

  useEffect(() => {
    if (!user?.email && !user?.phone) {
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
  }, [user?.email, user?.phone, user?.id, layerRefreshToken, layers]);

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

  const sendAiAssistantMessage = async () => {
    const text = String(aiInput || '').trim();
    if (!text || aiLoading) return;
    const userMessage = { role: 'user', content: text };
    const nextMessages = [...aiMessages, userMessage];
    setAiMessages(nextMessages);
    setAiInput('');
    setAiError('');
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ask-assistant', {
        body: {
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          context: {
            selectedDate: selectedDate ? getDateKey(selectedDate) : null,
            currentUser: currentUser || user?.email || 'User',
            calendarView,
          },
        },
      });
      if (error) throw new Error(error.message || 'Function invocation failed');
      const reply = String(data?.reply || '').trim() || "I couldn't generate a response.";
      setAiMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setAiError(String(err?.message || 'Assistant request failed.'));
    } finally {
      setAiLoading(false);
    }
  };

  const ensureFirebaseMessagingServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return null;
    try {
      let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      }

      if (!registration?.active) {
        await new Promise((resolve) => {
          let resolved = false;
          const done = () => {
            if (resolved) return;
            resolved = true;
            resolve();
          };
          const timeout = setTimeout(done, 5000);
          if (registration?.installing) {
            registration.installing.addEventListener('statechange', () => {
              if (registration.active) {
                clearTimeout(timeout);
                done();
              }
            });
          } else {
            clearTimeout(timeout);
            done();
          }
        });
      }

      if (!registration?.active) {
        await navigator.serviceWorker.ready;
        registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      }

      return registration?.active ? registration : null;
    } catch (err) {
      console.error('Firebase service worker setup failed:', err);
      return null;
    }
  };

  const requestFcmToken = async () => {
    try {
      const messaging = await getMessagingIfSupported();
      if (!messaging) return null;
      const vapidKey = FCM_WEB_VAPID_PUBLIC_KEY || WEB_PUSH_VAPID_PUBLIC_KEY;
      if (!vapidKey) return null;
      const registration = await ensureFirebaseMessagingServiceWorker();
      if (!registration) {
        console.warn('FCM token skipped: firebase-messaging-sw.js is not active yet.');
        return null;
      }
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (token) {
        localStorage.setItem('fcm-token', token);
        console.log('FCM token:', token);
      }
      return token || null;
    } catch (err) {
      console.error('Error getting FCM token:', err);
      return null;
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    if (!notificationsEnabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    requestFcmToken();
  }, [user?.id, notificationsEnabled, notificationPermission]);

  const formatPushNotificationContent = (payload) => {
    const data = (payload?.data && typeof payload.data === 'object') ? payload.data : {};
    const notification = (payload?.notification && typeof payload.notification === 'object') ? payload.notification : {};
    const firstText = (...values) => {
      for (const value of values) {
        const text = String(value || '').trim();
        if (text) return text;
      }
      return '';
    };
    const normalizedType = String(data?.type || notification?.type || 'update').trim().toLowerCase();
    const genericTitleSet = new Set([
      'calendar update',
      'notification from our calendar',
      'our calendar notification',
      'our calendar',
    ]);
    const titleByType = {
      invite: 'Calendar Invite',
      event: 'Calendar Update',
      list: 'List Update',
      photo: 'Trip Photo',
      expense: 'Expense Update',
      reminder: 'Event Reminder',
      update: 'Calendar Update',
    };
    const rawTitle = firstText(notification?.title, data?.title);
    const fallbackTitle = titleByType[normalizedType] || 'Calendar Update';
    const title = (!rawTitle || genericTitleSet.has(rawTitle.toLowerCase())) ? fallbackTitle : rawTitle;

    let body = firstText(notification?.body, data?.body, data?.message, data?.summary, data?.text);
    if (!body) {
      const actor = firstText(data?.actor, data?.actorName, data?.createdBy);
      const action = firstText(data?.action, 'updated');
      const subject = firstText(data?.eventTitle, data?.itemTitle, data?.subject, data?.calendarName);
      if (actor && subject) body = `${actor} ${action} "${subject}".`;
      else if (subject) body = `Update: "${subject}".`;
    }
    if (!body) body = 'Open Our Calendar to see what changed.';

    return {
      title,
      body,
      tag: String(data?.tag || `fcm-${normalizedType || 'update'}`),
      data,
    };
  };

  const pushPayloadToInAppNotification = (rawPayload, source = 'push') => {
    try {
      let payload = rawPayload;
      if (typeof rawPayload === 'string') {
        const text = String(rawPayload || '').trim();
        if (!text) return;
        try {
          payload = JSON.parse(text);
        } catch {
          // Match SW behavior: treat non-JSON push as notification body text.
          payload = { notification: { body: text } };
        }
      }
      if (!payload || typeof payload !== 'object') return;
      const formatted = formatPushNotificationContent(payload);
      const data = (formatted?.data && typeof formatted.data === 'object') ? formatted.data : {};
      const normalizedType = String(data?.type || 'update').trim().toLowerCase() || 'update';
      const explicitPushId = String(
        data?.id
        || data?.eventId
        || data?.messageId
        || payload?.messageId
        || ''
      ).trim();
      const hasStrongIdentity = Boolean(explicitPushId || String(formatted?.tag || '').trim());
      const stableKey = hasStrongIdentity
        ? [
            'push',
            String(source || 'push'),
            explicitPushId || String(formatted?.tag || '').trim(),
            String(data?.layerId || '').trim(),
          ].join(':')
        : [
            'push',
            String(source || 'push'),
            String(data?.layerId || '').trim(),
            String(Date.now()),
            Math.random().toString(36).slice(2, 7),
          ].join(':');
      const body = String(formatted?.body || '').trim();
      if (!body) return;
      addInAppNotification({
        key: stableKey,
        type: normalizedType,
        message: body,
        createdAt: new Date().toISOString(),
        target: {
          layerId: String(data?.layerId || '').trim() || null,
          eventId: String(data?.eventId || '').trim() || null,
          listId: String(data?.listId || '').trim() || null,
          listItemId: String(data?.listItemId || '').trim() || null,
          subCalendarId: String(data?.subCalendarId || '').trim() || null,
          dateKey: String(data?.dateKey || '').trim() || null,
          panel: String(data?.panel || '').trim() || null,
        },
      });
    } catch {}
  };

  useEffect(() => {
    let unsubscribe = null;
    const startForegroundListener = async () => {
      try {
        const messaging = await getMessagingIfSupported();
        if (!messaging) return;
        unsubscribe = onMessage(messaging, (payload) => {
          console.log('Foreground FCM payload:', payload);
          pushPayloadToInAppNotification(payload, 'fcm-foreground');
          if (!('Notification' in window)) return;
          if (Notification.permission !== 'granted') return;
          const formatted = formatPushNotificationContent(payload);
          try {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js').then((registration) => {
                if (registration?.showNotification) {
                  registration.showNotification(formatted.title, {
                    body: formatted.body,
                    tag: formatted.tag || 'fcm-foreground',
                    data: formatted.data || {},
                  });
                } else {
                  new Notification(formatted.title, { body: formatted.body, tag: formatted.tag || 'fcm-foreground' });
                }
              });
            } else {
              new Notification(formatted.title, { body: formatted.body, tag: formatted.tag || 'fcm-foreground' });
            }
          } catch {}
        });
      } catch (error) {
        console.error('Error setting up foreground FCM listener:', error);
      }
    };
    startForegroundListener();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handleSwDebugMessage = (event) => {
      const data = event?.data || {};
      if (data?.source !== 'firebase-messaging-sw') return;
      if (data?.type === 'push-received') {
        const rawText = String(data?.payload?.rawText || '');
        lastSwPushRawRef.current = { at: Date.now(), raw: rawText };
        pushPayloadToInAppNotification(rawText, 'sw-push');
      } else if (data?.type === 'notification-shown') {
        const last = lastSwPushRawRef.current || { at: 0, raw: '' };
        const isRecent = (Date.now() - Number(last.at || 0)) < 5000;
        const hasRawPayload = Boolean(String(last.raw || '').trim());
        if (!isRecent || !hasRawPayload) {
          addInAppNotification({
            key: `push:sw-shown:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
            type: 'update',
            message: 'You have a new calendar update.',
            createdAt: new Date().toISOString(),
          });
        }
      }
      console.log('[SW debug]', data.type, data.payload || {});
    };
    navigator.serviceWorker.addEventListener('message', handleSwDebugMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSwDebugMessage);
    };
  }, []);

  const maybeSendInAppSystemNotification = (type, key, message, options = {}) => {
    if (!notificationsEnabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const normalizedType = String(type || '').trim().toLowerCase();
    const allowWhenVisible = Boolean(options?.allowWhenVisible);
    // Invite notifications should still surface in-app while user is active.
    if (document.visibilityState === 'visible' && normalizedType !== 'invite' && !allowWhenVisible) return;

    const titleByType = {
      invite: 'Calendar Invite',
      event: 'Calendar Update',
      list: 'List Update',
      photo: 'Trip Photo',
      expense: 'Expense Update',
      update: 'Calendar Update',
    };
    const title = titleByType[normalizedType] || 'Calendar Update';
    const tag = `in-app:${String(key || '').trim()}`;

    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js').then((registration) => {
          if (registration?.showNotification) {
            registration.showNotification(title, { body: message, tag, data: { url: '/' } });
          } else {
            new Notification(title, { body: message, tag });
          }
        }).catch(() => {
          new Notification(title, { body: message, tag });
        });
      } else {
        new Notification(title, { body: message, tag });
      }
    } catch {}
  };

  const addInAppNotification = ({ key, type, message, createdAt, target = null }) => {
    if (!key || !message) return;
    const normalizedKey = String(key);
    if (seenInAppNotificationKeysRef.current.has(normalizedKey)) return;
    seenInAppNotificationKeysRef.current.add(normalizedKey);
    maybeSendInAppSystemNotification(type, normalizedKey, message);
    setInAppNotifications(prev => {
      if (prev.some(n => n.key === normalizedKey)) return prev;
      const next = [{
        id: `ian_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        key: normalizedKey,
        type: type || 'update',
        message,
        createdAt: createdAt || new Date().toISOString(),
        read: false,
        target: (target && typeof target === 'object') ? target : null,
      }, ...prev];
      return next.slice(0, 75);
    });
  };

  const clearInviteNotifications = ({ kind, subCalendarId, shareId }) => {
    const normalizedKind = String(kind || '').trim().toLowerCase();
    const normalizedSubCalId = String(subCalendarId || '').trim();
    const normalizedShareId = String(shareId || '').trim();
    const removedKeys = [];
    setInAppNotifications(prev => prev.filter((item) => {
      const key = String(item?.key || '');
      let shouldRemove = false;
      if (normalizedKind === 'trip' && normalizedSubCalId) {
        shouldRemove = key.startsWith(`trip_invite:${normalizedSubCalId}:`);
      } else if (normalizedKind === 'calendar' && normalizedShareId) {
        shouldRemove = key.startsWith(`calendar_invite:${normalizedShareId}:`);
      }
      if (shouldRemove && key) removedKeys.push(key);
      return !shouldRemove;
    }));
    removedKeys.forEach((key) => seenInAppNotificationKeysRef.current.delete(key));
  };

  const markCalendarInviteDismissed = (shareId) => {
    const normalized = String(shareId || '').trim();
    if (!normalized || !user?.id) return;
    dismissedCalendarInviteIdsRef.current.add(normalized);
    try {
      localStorage.setItem(
        `dismissed-calendar-invites-${user.id}`,
        JSON.stringify(Array.from(dismissedCalendarInviteIdsRef.current))
      );
    } catch {}
  };

  const parseInviteNotification = (item) => {
    const key = String(item?.key || '');
    if (key.startsWith('trip_invite:')) {
      const parts = key.split(':');
      if (parts.length < 3) return null;
      const subCalendarId = String(parts[1] || '').trim();
      const identity = String(parts[2] || '').trim().toLowerCase();
      if (!subCalendarId || !identity) return null;
      return { kind: 'trip', subCalendarId, identity };
    }
    if (key.startsWith('calendar_invite:')) {
      const parts = key.split(':');
      if (parts.length < 3) return null;
      const shareId = String(parts[1] || '').trim();
      const layerId = String(parts[2] || '').trim();
      if (!shareId || !layerId) return null;
      return { kind: 'calendar', shareId, layerId };
    }
    return null;
  };

  const acceptCalendarInvite = async (invite) => {
    if (!invite?.shareId || !invite?.layerId || !user?.id) return;
    const myEmail = String(user?.email || '').trim().toLowerCase();
    const shareRecipientFilter = buildShareRecipientFilter(user.id, myEmail, user?.phone);
    try {
      let acceptQuery = supabase
        .from('shared_access')
        .update({ shared_with_id: user.id })
        .eq('id', invite.shareId);
      if (shareRecipientFilter) acceptQuery = acceptQuery.or(shareRecipientFilter);
      const { error } = await acceptQuery;
      if (error) {
        alert(`Accept failed: ${error.message || 'Could not accept calendar invite.'}`);
        return;
      }
      setActiveLayerId(invite.layerId);
      localStorage.setItem(`active-layer-${user.id}`, invite.layerId);
      markCalendarInviteDismissed(invite.shareId);
      clearInviteNotifications({ kind: 'calendar', shareId: invite.shareId });
      setLayerRefreshToken(prev => prev + 1);
    } catch (err) {
      alert(`Accept failed: ${err.message || 'Unknown error'}`);
    }
  };

  const declineCalendarInvite = async (invite) => {
    if (!invite?.shareId || !user?.id) return;
    const myEmail = String(user?.email || '').trim().toLowerCase();
    const shareRecipientFilter = buildShareRecipientFilter(user.id, myEmail, user?.phone);
    try {
      let declineQuery = supabase
        .from('shared_access')
        .delete()
        .eq('id', invite.shareId);
      if (shareRecipientFilter) declineQuery = declineQuery.or(shareRecipientFilter);
      const { error } = await declineQuery;
      if (error) {
        alert(`Decline failed: ${error.message || 'Could not decline calendar invite.'}`);
        return;
      }
      markCalendarInviteDismissed(invite.shareId);
      clearInviteNotifications({ kind: 'calendar', shareId: invite.shareId });
    } catch (err) {
      alert(`Decline failed: ${err.message || 'Unknown error'}`);
    }
  };

  const markInAppNotificationRead = (notificationId) => {
    setInAppNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  const focusDateFromKey = (dateKey) => {
    const raw = String(dateKey || '').trim();
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (Number.isNaN(d.getTime())) return false;
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(d);
    setShowDateDetailModal(true);
    setBottomNavTab('home');
    setShowChatPanel(false);
    setShowListPanel(false);
    setShowNotificationSettings(false);
    return true;
  };

  const openSubCalendarById = async (subCalendarId) => {
    const id = String(subCalendarId || '').trim();
    if (!id) return false;
    let target = (subCalendars || []).find((sc) => String(sc?.id || '') === id) || null;
    if (!target) {
      const { data } = await supabase
        .from('sub_calendars')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      target = data || null;
    }
    if (!target) return false;
    await openSubCalendar(target);
    setShowNotificationSettings(false);
    setShowChatPanel(false);
    setShowListPanel(false);
    return true;
  };

  const handleInAppNotificationClick = async (item) => {
    if (!item) return;
    markInAppNotificationRead(item.id);
    const key = String(item?.key || '');
    const type = String(item?.type || '').trim().toLowerCase();
    const target = (item?.target && typeof item.target === 'object') ? item.target : {};
    const targetLayerId = String(target?.layerId || '').trim();
    const switchToLayer = (layerId) => {
      const lid = String(layerId || '').trim();
      if (!lid || !user?.id) return;
      if (String(activeLayerId || '') === lid) return;
      setActiveLayerId(lid);
      localStorage.setItem(`active-layer-${user.id}`, lid);
      setLayerRefreshToken(prev => prev + 1);
    };
    if (targetLayerId) switchToLayer(targetLayerId);
    if (String(target?.panel || '').trim().toLowerCase() === 'chat') {
      setShowChatPanel(true);
      setShowListPanel(false);
      setShowNotificationSettings(false);
    }
    const revealListPanel = () => {
      setListPanelAttention(true);
      setTimeout(() => setListPanelAttention(false), 1300);
      setTimeout(() => {
        try {
          listPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch {}
      }, 120);
    };

    if (key.startsWith('events:')) {
      const parts = key.split(':');
      const eventId = String(parts[1] || target?.eventId || '').trim();
      const keyLayerId = String(parts[2] || targetLayerId || activeLayerId || '').trim();
      if (keyLayerId) switchToLayer(keyLayerId);
      if (eventId) {
        let eventDateKey = '';
        Object.entries(events || {}).some(([dk, rows]) => {
          const found = (rows || []).some((row) => String(row?.id || '') === eventId);
          if (found) eventDateKey = dk;
          return found;
        });
        if (!eventDateKey) {
          const { data } = await supabase
            .from('events')
            .select('date')
            .eq('id', eventId)
            .eq('layer_id', keyLayerId || activeLayerId)
            .maybeSingle();
          eventDateKey = String(data?.date || '');
        }
        if (eventDateKey) {
          focusDateFromKey(eventDateKey);
          return;
        }
      }
    }

    if (key.startsWith('shared_lists:')) {
      const parts = key.split(':');
      const itemId = String(parts[1] || target?.listItemId || '').trim();
      const listIdFromTarget = String(target?.listId || '').trim();
      const keyLayerId = String(parts[2] || targetLayerId || activeLayerId || '').trim();
      if (keyLayerId) switchToLayer(keyLayerId);
      setActiveSubCalendar(null);
      setBottomNavTab('home');
      setShowDateDetailModal(false);
      setShowListPanel(true);
      setShowChatPanel(false);
      setShowNotificationSettings(false);
      revealListPanel();
      if ((itemId || listIdFromTarget) && (keyLayerId || activeLayerId)) {
        let listId = String(listIdFromTarget || (sharedListItems || []).find((row) => String(row?.id || '') === itemId)?.list_id || '').trim();
        if (!listId) {
          const { data } = await supabase
            .from('shared_lists')
            .select('list_id')
            .eq('id', itemId)
            .maybeSingle();
          listId = String(data?.list_id || '').trim();
        }
        if (listId) {
          setSelectedSharedListId(listId);
          if (primaryListOwnerId) await loadSharedListItems(primaryListOwnerId, listId);
        }
      }
      return;
    }

    if (key.startsWith('sub_calendar_events:')) {
      const subCalEventId = String(key.split(':')[1] || '').trim();
      if (subCalEventId) {
        const { data } = await supabase
          .from('sub_calendar_events')
          .select('sub_calendar_id,date')
          .eq('id', subCalEventId)
          .maybeSingle();
        const subCalId = String(data?.sub_calendar_id || '').trim();
        if (subCalId) {
          const opened = await openSubCalendarById(subCalId);
          if (opened) {
            const dateKey = String(data?.date || '').trim();
            const m = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) {
              const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
              if (!Number.isNaN(d.getTime())) setSubCalSelectedDate(d);
            }
          }
          return;
        }
      }
    }

    if (key.startsWith('expense:')) {
      const parts = key.split(':');
      const subCalId = String(parts[1] || '').trim();
      if (subCalId) {
        const opened = await openSubCalendarById(subCalId);
        if (opened) setSubCalTab('expenses');
        return;
      }
    }

    if (key.startsWith('trip_photos:')) {
      const photoId = String(key.split(':')[1] || '').trim();
      if (photoId) {
        const { data } = await supabase
          .from('trip_photos')
          .select('sub_calendar_id')
          .eq('id', photoId)
          .maybeSingle();
        const subCalId = String(data?.sub_calendar_id || '').trim();
        if (subCalId) {
          const opened = await openSubCalendarById(subCalId);
          if (opened) setSubCalTab('photos');
          return;
        }
      }
    }

    if (key.startsWith('trip_invite:')) {
      const parts = key.split(':');
      const subCalId = String(parts[1] || '').trim();
      if (subCalId) {
        const opened = await openSubCalendarById(subCalId);
        if (opened) return;
      }
      setShowNotificationSettings(true);
      return;
    }

    if (key.startsWith('calendar_invite:')) {
      const parts = key.split(':');
      const layerId = String(parts[2] || '').trim();
      if (layerId && user?.id) {
        setActiveLayerId(layerId);
        localStorage.setItem(`active-layer-${user.id}`, layerId);
        setLayerRefreshToken(prev => prev + 1);
      }
      setShowNotificationSettings(true);
      return;
    }

    if (type === 'list') {
      if (targetLayerId) switchToLayer(targetLayerId);
      setActiveSubCalendar(null);
      setBottomNavTab('home');
      setShowDateDetailModal(false);
      setShowListPanel(true);
      setShowChatPanel(false);
      setShowNotificationSettings(false);
      revealListPanel();
      const listId = String(target?.listId || '').trim();
      if (listId) setSelectedSharedListId(listId);
      return;
    }

    const msg = String(item?.message || '').toLowerCase();
    if (msg.includes('to the list') || msg.includes('list item')) {
      if (targetLayerId) switchToLayer(targetLayerId);
      setActiveSubCalendar(null);
      setBottomNavTab('home');
      setShowDateDetailModal(false);
      setShowListPanel(true);
      setShowChatPanel(false);
      setShowNotificationSettings(false);
      revealListPanel();
      const listId = String(target?.listId || '').trim();
      if (listId) setSelectedSharedListId(listId);
      return;
    }

    if (type === 'chat_poll' || type === 'chat_event') {
      if (targetLayerId) switchToLayer(targetLayerId);
      const dateKey = String(target?.dateKey || '').trim();
      if (dateKey) focusDateFromKey(dateKey);
      setShowChatPanel(true);
      setShowListPanel(false);
      setShowNotificationSettings(false);
      return;
    }

    if (type === 'event') {
      if (targetLayerId) switchToLayer(targetLayerId);
      const eventId = String(target?.eventId || '').trim();
      const dateKey = String(target?.dateKey || '').trim();
      if (dateKey) {
        focusDateFromKey(dateKey);
        return;
      }
      if (eventId) {
        const { data } = await supabase
          .from('events')
          .select('date')
          .eq('id', eventId)
          .eq('layer_id', targetLayerId || activeLayerId)
          .maybeSingle();
        const eventDateKey = String(data?.date || '');
        if (eventDateKey) {
          focusDateFromKey(eventDateKey);
          return;
        }
      }
    }
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

  // Keep this browser/device subscribed for web push when notifications are enabled.
  useEffect(() => {
    if (!user?.id) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const pushVapidKey = WEB_PUSH_VAPID_PUBLIC_KEY || FCM_WEB_VAPID_PUBLIC_KEY;
    if (!pushVapidKey) {
      console.warn('Push disabled: missing REACT_APP_VAPID_PUBLIC_KEY (or REACT_APP_FCM_VAPID_PUBLIC_KEY)');
      return;
    }

    let cancelled = false;
    const syncPushSubscription = async () => {
      try {
        const registration = await ensureFirebaseMessagingServiceWorker();
        if (!registration) {
          console.warn('Push subscription skipped: firebase-messaging-sw.js is not active yet.');
          return;
        }
        let subscription = await registration.pushManager.getSubscription();
        const storedVapidKey = String(localStorage.getItem('push-vapid-key') || '').trim();
        if (subscription && storedVapidKey && storedVapidKey !== pushVapidKey) {
          try { await subscription.unsubscribe(); } catch {}
          subscription = null;
        }
        const shouldEnable = notificationsEnabled && Notification.permission === 'granted';

        if (shouldEnable) {
          if (!subscription) {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(pushVapidKey),
            });
          }
          if (!subscription || cancelled) return;
          const payload = subscription.toJSON();
          const endpoint = String(payload?.endpoint || '').trim();
          const p256dh = String(payload?.keys?.p256dh || '').trim();
          const auth = String(payload?.keys?.auth || '').trim();
          if (!endpoint || !p256dh || !auth) return;
          const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
              user_id: user.id,
              endpoint,
              p256dh,
              auth,
              user_agent: navigator.userAgent || null,
              enabled: true,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'endpoint' });
          if (error) console.error('push_subscriptions upsert failed:', error);
          else localStorage.setItem('push-vapid-key', pushVapidKey);
        } else if (subscription) {
          const endpoint = String(subscription.endpoint || '').trim();
          if (endpoint) {
            const { error } = await supabase
              .from('push_subscriptions')
              .update({ enabled: false, updated_at: new Date().toISOString() })
              .eq('user_id', user.id)
              .eq('endpoint', endpoint);
            if (error) console.error('push_subscriptions disable failed:', error);
          }
          try { await subscription.unsubscribe(); } catch {}
          localStorage.removeItem('push-vapid-key');
        }
      } catch (err) {
        if (String(err?.name || '') === 'AbortError') {
          console.warn('Push subscription sync aborted (service worker not active or browser storage issue):', err);
          return;
        }
        console.error('Push subscription sync failed:', err);
      }
    };

    syncPushSubscription();
    return () => {
      cancelled = true;
    };
  }, [user?.id, notificationsEnabled, notificationPermission]);

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

  // Live location sharing within active calendar layer (opt-in only).
  useEffect(() => {
    const clearGeoWatch = () => {
      if (layerGeoWatchRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(layerGeoWatchRef.current);
        layerGeoWatchRef.current = null;
      }
    };

    if (!activeLayerId || !user?.id) {
      clearGeoWatch();
      setLayerMemberLocations({});
      return;
    }

    const identity = String(user?.id || user?.email || user?.phone || currentUser || `guest-${Date.now()}`);
    const displayName = currentUser || user?.email || user?.phone || 'Member';
    let cancelled = false;
    const channel = supabase.channel(`layer-live-location-${activeLayerId}`, {
      config: { presence: { key: identity } },
    });
    layerLocationChannelRef.current = channel;

    const publishPassivePresence = async () => {
      try {
        await channel.track({
          userId: identity,
          layerId: String(activeLayerId),
          name: displayName,
          email: user?.email || null,
          sharing: false,
          updatedAt: new Date().toISOString(),
        });
      } catch {}
    };

    const startOrUpdateSharing = async () => {
      clearGeoWatch();
      if (!shareLayerLocation || !navigator?.geolocation) {
        await publishPassivePresence();
        return;
      }
      layerGeoWatchRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          if (cancelled) return;
          try {
            await channel.track({
              userId: identity,
              layerId: String(activeLayerId),
              name: displayName,
              email: user?.email || null,
              sharing: true,
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy || 0),
              updatedAt: new Date().toISOString(),
            });
          } catch (err) {
            console.error('Layer location presence update failed:', err);
          }
        },
        async (err) => {
          console.error('Layer geolocation watch failed:', err);
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
      setLayerMemberLocations(flattened);
    });

    channel.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED' || cancelled) return;
      await startOrUpdateSharing();
    });

    return () => {
      cancelled = true;
      clearGeoWatch();
      setLayerMemberLocations({});
      channel.untrack().catch(() => {});
      channel.unsubscribe();
      if (layerLocationChannelRef.current === channel) layerLocationChannelRef.current = null;
    };
  }, [activeLayerId, shareLayerLocation, currentUser, user?.id, user?.email, user?.phone]);

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
    // Keep this ASCII-safe to avoid regex parser issues in production builds.
    const locationPrefix = /^(?:@|pin:|location:)\s*/i;
    const withPin = lines.find(line => locationPrefix.test(line));
    if (withPin) return withPin.replace(locationPrefix, '').trim();
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
    const parsedMax = Math.max(1, parseInt(String(popupEventMaxPeopleDraft || '').trim(), 10) || 1);
    setPendingEvent({
      title,
      datesToAdd,
      isMultiDay: selectedDates.length > 1,
      isPopupEvent: Boolean(isPopupEventDraft),
      popupMaxPeople: parsedMax,
    });
    setShowTimePrompt(true);
    setQuickEntry('');
  };

  const unfoldIcsLines = (text) => {
    const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rawLines = normalized.split('\n');
    const lines = [];
    rawLines.forEach((line) => {
      if (!line) {
        lines.push('');
        return;
      }
      if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
        lines[lines.length - 1] += line.slice(1);
      } else {
        lines.push(line);
      }
    });
    return lines;
  };

  const parseIcsDateTime = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const dateOnly = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (dateOnly) {
      return {
        date: new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])),
        isAllDay: true,
      };
    }
    const dateTimeUtc = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z$/);
    if (dateTimeUtc) {
      return {
        date: new Date(Date.UTC(
          Number(dateTimeUtc[1]),
          Number(dateTimeUtc[2]) - 1,
          Number(dateTimeUtc[3]),
          Number(dateTimeUtc[4]),
          Number(dateTimeUtc[5]),
          Number(dateTimeUtc[6] || '0')
        )),
        isAllDay: false,
      };
    }
    const dateTimeLocal = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/);
    if (dateTimeLocal) {
      return {
        date: new Date(
          Number(dateTimeLocal[1]),
          Number(dateTimeLocal[2]) - 1,
          Number(dateTimeLocal[3]),
          Number(dateTimeLocal[4]),
          Number(dateTimeLocal[5]),
          Number(dateTimeLocal[6] || '0')
        ),
        isAllDay: false,
      };
    }
    return null;
  };

  const parseIcsText = (text) => {
    const lines = unfoldIcsLines(text);
    const eventsOut = [];
    let current = null;

    lines.forEach((line) => {
      const trimmed = String(line || '').trim();
      if (!trimmed) return;
      const upper = trimmed.toUpperCase();
      if (upper === 'BEGIN:VEVENT') {
        current = {};
        return;
      }
      if (upper === 'END:VEVENT') {
        if (current) eventsOut.push(current);
        current = null;
        return;
      }
      if (!current) return;

      const sepIndex = trimmed.indexOf(':');
      if (sepIndex <= 0) return;
      const left = trimmed.slice(0, sepIndex);
      const value = trimmed.slice(sepIndex + 1);
      const [rawKey, ...paramParts] = left.split(';');
      const key = String(rawKey || '').trim().toUpperCase();
      const params = {};
      paramParts.forEach((part) => {
        const eq = part.indexOf('=');
        if (eq <= 0) return;
        const pKey = part.slice(0, eq).toUpperCase();
        const pVal = part.slice(eq + 1);
        params[pKey] = pVal;
      });
      current[key] = { value, params };
    });

    return eventsOut;
  };

  const mapIcsFreqToRecurrence = (rrule) => {
    const raw = String(rrule || '').toUpperCase();
    const freq = raw.match(/(?:^|[:;])FREQ=([^;]+)/)?.[1] || '';
    if (freq === 'YEARLY') return 'annual';
    if (freq === 'MONTHLY') return 'monthly';
    if (freq === 'WEEKLY') return 'weekly';
    return 'once';
  };

  const parseGoogleDateTimeValue = (value) => {
    if (!value || typeof value !== 'object') return null;
    const dateTimeRaw = String(value.dateTime || '').trim();
    if (dateTimeRaw) {
      const parsed = new Date(dateTimeRaw);
      if (!Number.isNaN(parsed.getTime())) {
        return { date: parsed, isAllDay: false };
      }
    }
    const dateRaw = String(value.date || '').trim();
    const dateOnly = dateRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      return {
        date: new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])),
        isAllDay: true,
      };
    }
    return null;
  };

  const normalizeHolidayLikeTitle = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    let normalized = raw.toLowerCase();
    try {
      normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch {}
    return normalized
      .replace(/^us\s*holiday[:\s-]*/i, '')
      .replace(/^public\s*holiday[:\s-]*/i, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const isLikelyHolidayTitle = (normalizedTitle) => {
    const t = String(normalizedTitle || '');
    if (!t) return false;
    return [
      'holiday',
      'newyear',
      'mlk',
      'martinlutherking',
      'presidentsday',
      'washingtonsbirthday',
      'memorialday',
      'juneteenth',
      'independenceday',
      'laborday',
      'columbusday',
      'veteransday',
      'thanksgiving',
      'christmas',
      'fathersday',
      'mothersday',
      'flagday',
      'easter',
      'goodfriday',
      'taxday',
      'stpatrick',
      'cincodemayo',
    ].some((token) => t.includes(token));
  };

  const importEventKeyOf = (row) => {
    const dateKey = String(row?.date || '');
    const timeKey = String(row?.time || '');
    const titleNorm = normalizeHolidayLikeTitle(row?.title);
    const locationKey = String(row?.location || '').trim().toLowerCase();
    const recurrenceKey = String(row?.recurrence || 'once');
    const allDayLike = !timeKey || timeKey === '00:00' || timeKey === '00:00:00';
    if (allDayLike && titleNorm && isLikelyHolidayTitle(titleNorm)) {
      return [dateKey, 'holiday', titleNorm].join('|');
    }
    return [dateKey, timeKey, titleNorm, locationKey, recurrenceKey].join('|');
  };

  const persistImportedEvents = async (candidateEvents) => {
    if (!assertCanEditActiveLayer('import events into this calendar')) {
      return { insertedCount: 0, duplicateCount: 0 };
    }
    const incoming = Array.isArray(candidateEvents) ? candidateEvents : [];
    if (!activeLayerId || !user?.id || incoming.length === 0) {
      return { insertedCount: 0, duplicateCount: 0 };
    }

    const existingKeys = new Set();
    Object.values(events || {}).forEach((rows) => {
      (rows || []).forEach((row) => existingKeys.add(importEventKeyOf(row)));
    });

    // Defensive check from DB too, so imports remain append-only even if local state is stale.
    const { data: existingRows } = await supabase
      .from('events')
      .select('date,time,title,location,recurrence')
      .eq('layer_id', activeLayerId);
    (existingRows || []).forEach((row) => {
      existingKeys.add(importEventKeyOf({
        date: row?.date,
        time: row?.time,
        title: row?.title,
        location: row?.location,
        recurrence: row?.recurrence || 'once',
      }));
    });

    const eventsToInsert = [];
    let duplicateCount = 0;
    incoming.forEach((row) => {
      const key = importEventKeyOf(row);
      if (existingKeys.has(key)) {
        duplicateCount += 1;
        return;
      }
      existingKeys.add(key);
      eventsToInsert.push(row);
    });

    if (eventsToInsert.length === 0) {
      return { insertedCount: 0, duplicateCount };
    }

    const asDbRows = eventsToInsert.map((event) => ({
      id: event.id,
      date: event.date,
      title: event.title,
      time: event.time,
      category: event.category || 'other',
      is_private: Boolean(event.isPrivate),
      is_private_for: event.isPrivate ? (event.createdBy || null) : null,
      is_urgent: Boolean(event.isUrgent),
      is_multi_day: Boolean(event.isMultiDay),
      multi_day_id: event.multiDayId || null,
      is_annual: Boolean(event.isAnnual),
      annual_month: event.annualMonth || null,
      annual_day: event.annualDay || null,
      recurrence: event.recurrence || 'once',
      exceptions: event.exceptions ? JSON.stringify(event.exceptions) : null,
      reactions: event.reactions ? JSON.stringify(event.reactions) : null,
      location: event.location || null,
      created_by: event.createdBy || currentUser || user?.email || user?.phone || 'User',
      created_at: event.createdAt || new Date().toISOString(),
      user_id: user.id,
      layer_id: activeLayerId,
      calendar_id: activeLayerId,
    }));

    for (let i = 0; i < asDbRows.length; i += 250) {
      const chunk = asDbRows.slice(i, i + 250);
      const { error } = await supabase.from('events').insert(chunk);
      if (error) throw new Error(error.message || 'Failed to save imported events.');
    }

    setEvents((prev) => {
      const next = { ...(prev || {}) };
      eventsToInsert.forEach((event) => {
        const dateKey = String(event.date || '');
        if (!dateKey) return;
        const dateRows = next[dateKey] || [];
        next[dateKey] = [...dateRows, event].sort((a, b) => {
          if (!a.time) return 1;
          if (!b.time) return -1;
          return String(a.time).localeCompare(String(b.time));
        });
      });
      return next;
    });

    return { insertedCount: eventsToInsert.length, duplicateCount };
  };

  const normalizeHolidayTitleForCleanup = (value) => normalizeHolidayLikeTitle(value);

  const cleanupDuplicateHolidayEventsForCurrentUserLayer = async () => {
    if (!activeLayerId || !user?.id) return 0;
    const { data: rows, error } = await supabase
      .from('events')
      .select('id,date,time,title,created_at')
      .eq('layer_id', activeLayerId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(5000);
    if (error) {
      console.error('Holiday duplicate cleanup failed to load rows:', error);
      return 0;
    }

    const firstByKey = new Map();
    const deleteIds = [];
    (rows || []).forEach((row) => {
      const dateKey = String(row?.date || '').trim();
      const timeKey = String(row?.time || '').trim();
      const allDayLike = !timeKey || timeKey === '00:00' || timeKey === '00:00:00';
      const titleNorm = normalizeHolidayTitleForCleanup(row?.title);
      if (!dateKey || !allDayLike || !titleNorm || !isLikelyHolidayTitle(titleNorm)) return;
      const key = `${dateKey}|${titleNorm}`;
      if (!firstByKey.has(key)) {
        firstByKey.set(key, String(row.id));
      } else {
        deleteIds.push(String(row.id));
      }
    });
    if (deleteIds.length === 0) return 0;

    const deleted = new Set();
    for (let i = 0; i < deleteIds.length; i += 200) {
      const chunk = deleteIds.slice(i, i + 200);
      const { data: removedRows, error: deleteError } = await supabase
        .from('events')
        .delete()
        .select('id')
        .eq('layer_id', activeLayerId)
        .eq('user_id', user.id)
        .in('id', chunk);
      if (deleteError) {
        console.error('Holiday duplicate cleanup delete failed:', deleteError);
        continue;
      }
      (removedRows || []).forEach((row) => deleted.add(String(row?.id || '')));
    }

    if (deleted.size > 0) {
      setEvents((prev) => {
        const next = {};
        Object.entries(prev || {}).forEach(([dk, list]) => {
          const filtered = (list || []).filter((event) => !deleted.has(String(event?.id || '')));
          if (filtered.length > 0) next[dk] = filtered;
        });
        return next;
      });
    }

    return deleted.size;
  };

  const triggerGoogleCalendarOAuthImport = async () => {
    localStorage.setItem(GOOGLE_IMPORT_PENDING_KEY, 'true');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: `openid email profile ${GOOGLE_CALENDAR_READ_SCOPE} ${GOOGLE_CONTACTS_READ_SCOPE}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          include_granted_scopes: 'true',
        },
      },
    });
    if (error) {
      localStorage.removeItem(GOOGLE_IMPORT_PENDING_KEY);
      throw new Error(error.message || 'Could not connect Google Calendar.');
    }
  };

  const buildBirthdayTitle = (name) => {
    const base = String(name || '').trim() || 'Contact';
    return base.endsWith('s') ? `${base}' birthday` : `${base}'s birthday`;
  };

  const fetchGoogleContactBirthdays = async (providerToken) => {
    const headers = { Authorization: `Bearer ${providerToken}` };
    let pageToken = '';
    const rows = [];
    for (let page = 0; page < 8; page += 1) {
      const params = new URLSearchParams({
        personFields: 'names,birthdays',
        pageSize: '1000',
      });
      if (pageToken) params.set('pageToken', pageToken);
      const resp = await fetch(`https://people.googleapis.com/v1/people/me/connections?${params.toString()}`, {
        headers,
      });
      // Missing People API enablement or scope should not break calendar import.
      if (resp.status === 403 || resp.status === 404) return rows;
      if (!resp.ok) {
        let message = `Google Contacts request failed (${resp.status}).`;
        try {
          const errData = await resp.json();
          const errMsg = String(errData?.error?.message || '').trim();
          if (errMsg) message = errMsg;
        } catch {}
        throw new Error(message);
      }
      const json = await resp.json();
      const people = Array.isArray(json?.connections) ? json.connections : [];
      rows.push(...people);
      pageToken = String(json?.nextPageToken || '').trim();
      if (!pageToken || rows.length >= 7000) break;
    }
    return rows;
  };

  const importGoogleCalendarEvents = async ({ allowReconnect = true } = {}) => {
    if (!activeLayerId || !user?.id) return;
    setIsImportingCalendar(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const providerToken = String(sessionData?.session?.provider_token || '').trim();
      if (!providerToken) {
        if (!allowReconnect) {
          throw new Error('Google auth token is missing. Please reconnect and try again.');
        }
        await triggerGoogleCalendarOAuthImport();
        return;
      }

      const authHeaders = { Authorization: `Bearer ${providerToken}` };
      const calendarListResp = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=freeBusyReader&showHidden=true', {
        headers: authHeaders,
      });

      if ((calendarListResp.status === 401 || calendarListResp.status === 403) && allowReconnect) {
        await triggerGoogleCalendarOAuthImport();
        return;
      }
      if (!calendarListResp.ok) {
        let message = `Google Calendar list request failed (${calendarListResp.status}).`;
        try {
          const errData = await calendarListResp.json();
          const errMsg = String(errData?.error?.message || '').trim();
          if (errMsg) message = errMsg;
        } catch {}
        throw new Error(message);
      }

      const calendarListJson = await calendarListResp.json();
      const calendars = Array.isArray(calendarListJson?.items) ? calendarListJson.items : [];
      const readableCalendars = calendars.filter((c) => {
        const calId = String(c?.id || '').trim();
        const accessRole = String(c?.accessRole || '').toLowerCase();
        return Boolean(calId) && ['owner', 'writer', 'reader', 'freebusyreader'].includes(accessRole);
      });
      const isHolidayCalendar = (c) => {
        const id = String(c?.id || '').trim().toLowerCase();
        const summary = String(c?.summary || c?.summaryOverride || '').trim().toLowerCase();
        return id.includes('#holiday@group.v.calendar.google.com') || summary.includes('holiday');
      };
      const importableCalendars = readableCalendars.filter((c) => !isHolidayCalendar(c));
      const knownBirthdayCalendarIds = [
        'addressbook#contacts@group.v.calendar.google.com',
        'contacts@group.v.calendar.google.com',
      ];
      const calendarCandidatesMap = new Map();
      importableCalendars.forEach((c) => {
        const id = String(c?.id || '').trim();
        if (!id) return;
        calendarCandidatesMap.set(id, {
          id,
          summary: String(c?.summary || c?.summaryOverride || '').trim() || id,
        });
      });
      knownBirthdayCalendarIds.forEach((id) => {
        if (!calendarCandidatesMap.has(id)) {
          calendarCandidatesMap.set(id, { id, summary: 'Birthdays' });
        }
      });
      const calendarCandidates = Array.from(calendarCandidatesMap.values());
      if (calendarCandidates.length === 0) {
        throw new Error('No readable Google calendars were found for this account.');
      }

      const googleEvents = [];
      let calendarBirthdayEventCount = 0;
      for (const cal of calendarCandidates) {
        const targetCalendarId = String(cal?.id || '').trim();
        let pageToken = '';
        for (let page = 0; page < 6; page += 1) {
          const params = new URLSearchParams({
            showDeleted: 'false',
            singleEvents: 'true',
            orderBy: 'startTime',
            maxResults: '2500',
            timeMin: new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)).toISOString(),
            timeMax: new Date(Date.now() + (365 * 2 * 24 * 60 * 60 * 1000)).toISOString(),
          });
          // Include birthdays explicitly; some Google accounts omit them unless requested.
          params.append('eventTypes', 'default');
          params.append('eventTypes', 'birthday');
          if (pageToken) params.set('pageToken', pageToken);
          const eventsResp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events?${params.toString()}`, {
            headers: authHeaders,
          });
          if (!eventsResp.ok) {
            // Some known fallback IDs may not exist for a given account; skip quietly.
            if ([403, 404].includes(eventsResp.status)) break;
            let message = `Google Calendar events request failed (${eventsResp.status}).`;
            try {
              const errData = await eventsResp.json();
              const errMsg = String(errData?.error?.message || '').trim();
              if (errMsg) message = errMsg;
            } catch {}
            throw new Error(message);
          }
          const eventsJson = await eventsResp.json();
          const pageItems = Array.isArray(eventsJson?.items) ? eventsJson.items : [];
          googleEvents.push(...pageItems);
          pageItems.forEach((item) => {
            const eventType = String(item?.eventType || '').toLowerCase();
            const summary = String(item?.summary || '').toLowerCase();
            if (eventType === 'birthday' || summary.includes('birthday')) calendarBirthdayEventCount += 1;
          });
          pageToken = String(eventsJson?.nextPageToken || '').trim();
          if (!pageToken || googleEvents.length >= 7000) break;
        }
        if (googleEvents.length >= 7000) break;
      }

      if (googleEvents.length === 0) {
        alert('No Google Calendar events were found to import.');
      }

      const importedEventsDraft = [];
      const nowTs = Date.now();
      const createdByLabel = currentUser || user?.email || user?.phone || 'User';
      let contactBirthdayCandidateCount = 0;
      let contactsFetchStatus = 'ok';

      googleEvents.forEach((ev, idx) => {
        if (String(ev?.status || '').toLowerCase() === 'cancelled') return;
        const summary = String(ev?.summary || '').trim() || 'Imported Event';
        const location = String(ev?.location || '').trim() || null;
        const startParsed = parseGoogleDateTimeValue(ev?.start);
        const endParsed = parseGoogleDateTimeValue(ev?.end);
        if (!startParsed?.date || Number.isNaN(startParsed.date.getTime())) return;
        const recurrenceRaw = Array.isArray(ev?.recurrence) ? String(ev.recurrence[0] || '').replace(/^RRULE:/i, '') : '';
        const recurrence = mapIcsFreqToRecurrence(recurrenceRaw);

        const pushEvent = (dateObj, opts = {}) => {
          const dateKey = getDateKey(dateObj);
          const hasTime = !opts.allDay;
          const time = hasTime
            ? `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
            : null;

          const newEvent = {
            id: `gimp_${nowTs}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
            title: summary,
            time,
            date: dateKey,
            category: 'other',
            isPrivate: false,
            isUrgent: false,
            isAnnual: recurrence === 'annual',
            recurrence,
            annualMonth: recurrence === 'annual' ? (dateObj.getMonth() + 1) : null,
            annualDay: recurrence === 'annual' ? dateObj.getDate() : null,
            createdBy: createdByLabel,
            createdAt: new Date().toISOString(),
            isMultiDay: Boolean(opts.multiDayId),
            multiDayId: opts.multiDayId || null,
            userId: user.id,
            location,
            reactions: {},
            exceptions: [],
          };
          importedEventsDraft.push(newEvent);
        };

        const start = new Date(startParsed.date);
        const isAllDay = Boolean(startParsed.isAllDay);
        if (isAllDay && endParsed?.date) {
          const inclusiveEnd = new Date(endParsed.date);
          inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
          if (!Number.isNaN(inclusiveEnd.getTime()) && inclusiveEnd >= start) {
            const spanDays = Math.round((inclusiveEnd.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
            if (spanDays > 1) {
              const multiDayId = `gimpmd_${nowTs}_${idx}`;
              for (let d = new Date(start); d <= inclusiveEnd; d.setDate(d.getDate() + 1)) {
                pushEvent(new Date(d), { allDay: true, multiDayId });
                if (importedEventsDraft.length > 5000) break;
              }
              return;
            }
          }
        }

        pushEvent(start, { allDay: isAllDay });
      });

      // Fallback for contact birthdays that may not surface as calendar events.
      try {
        const peopleRows = await fetchGoogleContactBirthdays(providerToken);
        peopleRows.forEach((person, idx) => {
          const rawName = Array.isArray(person?.names) ? String(person.names[0]?.displayName || '').trim() : '';
          const displayName = rawName || 'Contact';
          const birthdays = Array.isArray(person?.birthdays) ? person.birthdays : [];
          birthdays.forEach((entry, bIdx) => {
            const d = entry?.date || {};
            const month = Number(d?.month || 0);
            const day = Number(d?.day || 0);
            if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1 || day > 31) return;
            const eventDate = new Date(new Date().getFullYear(), month - 1, day);
            if (Number.isNaN(eventDate.getTime())) return;
            contactBirthdayCandidateCount += 1;
            importedEventsDraft.push({
              id: `gbday_${nowTs}_${idx}_${bIdx}_${Math.random().toString(36).slice(2, 7)}`,
              title: buildBirthdayTitle(displayName),
              time: null,
              date: getDateKey(eventDate),
              category: 'other',
              isPrivate: false,
              isUrgent: false,
              isAnnual: true,
              recurrence: 'annual',
              annualMonth: month,
              annualDay: day,
              createdBy: createdByLabel,
              createdAt: new Date().toISOString(),
              isMultiDay: false,
              multiDayId: null,
              userId: user.id,
              location: null,
              reactions: {},
              exceptions: [],
            });
          });
        });
      } catch (contactsErr) {
        contactsFetchStatus = String(contactsErr?.message || 'contacts-fetch-failed');
        console.warn('Google Contacts birthday import skipped:', contactsErr?.message || contactsErr);
      }

      const { insertedCount, duplicateCount } = await persistImportedEvents(importedEventsDraft);
      const cleanedHolidayDuplicates = await cleanupDuplicateHolidayEventsForCurrentUserLayer();
      const birthdayDraftCount = importedEventsDraft.filter((row) => {
        const title = String(row?.title || '').toLowerCase();
        return String(row?.recurrence || '') === 'annual' && title.includes('birthday');
      }).length;
      if (insertedCount === 0) {
        if (duplicateCount > 0) {
          console.info(
            'Google import matched existing events only.',
            {
              calendarBirthdayEvents: calendarBirthdayEventCount,
              contactsBirthdayCandidates: contactBirthdayCandidateCount,
              birthdayDrafts: birthdayDraftCount,
              contactsStatus: contactsFetchStatus,
            }
          );
          return;
        }
        alert(
          'No valid Google events were found to import.\n'
          + `Diagnostics: calendar birthday events=${calendarBirthdayEventCount}, contacts birthday candidates=${contactBirthdayCandidateCount}, birthday drafts=${birthdayDraftCount}, contacts status=${contactsFetchStatus}.`
        );
        return;
      }
      alert(
        `Imported ${insertedCount} Google event${insertedCount === 1 ? '' : 's'} from ${calendarCandidates.length} calendar${calendarCandidates.length === 1 ? '' : 's'}`
        + (duplicateCount > 0 ? ` (${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'} skipped).` : '.')
        + (cleanedHolidayDuplicates > 0 ? ` Cleaned ${cleanedHolidayDuplicates} duplicate holiday event${cleanedHolidayDuplicates === 1 ? '' : 's'}.` : '')
      );
    } catch (err) {
      console.error('Google calendar import failed:', err);
      alert(`Google import failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsImportingCalendar(false);
    }
  };

  const importIcsTextContent = async (text, sourceLabel = 'this source') => {
    const parsedEvents = parseIcsText(text);
    if (parsedEvents.length === 0) {
      alert('No calendar events found in this .ics source.');
      return false;
    }

    const importedEventsDraft = [];
    const nowTs = Date.now();

    parsedEvents.forEach((ev, idx) => {
      const summary = String(ev?.SUMMARY?.value || '').trim() || 'Imported Event';
      const location = String(ev?.LOCATION?.value || '').trim() || null;
      const startRaw = ev?.DTSTART?.value || '';
      const endRaw = ev?.DTEND?.value || '';
      const startParsed = parseIcsDateTime(startRaw);
      const endParsed = parseIcsDateTime(endRaw);
      if (!startParsed?.date || Number.isNaN(startParsed.date.getTime())) return;

      const recurrence = mapIcsFreqToRecurrence(ev?.RRULE?.value || '');

      const pushEvent = (dateObj, opts = {}) => {
        const dateKey = getDateKey(dateObj);
        const hours = dateObj.getHours();
        const minutes = dateObj.getMinutes();
        const hasTime = !opts.allDay;
        const time = hasTime ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` : null;
        const newEvent = {
          id: `imp_${nowTs}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
          title: summary,
          time,
          date: dateKey,
          category: 'other',
          isPrivate: false,
          isUrgent: false,
          isAnnual: recurrence === 'annual',
          recurrence,
          annualMonth: recurrence === 'annual' ? (dateObj.getMonth() + 1) : null,
          annualDay: recurrence === 'annual' ? dateObj.getDate() : null,
          createdBy: currentUser || user?.email || user?.phone || 'User',
          createdAt: new Date().toISOString(),
          isMultiDay: Boolean(opts.multiDayId),
          multiDayId: opts.multiDayId || null,
          userId: user.id,
          location,
          reactions: {},
          exceptions: [],
        };
        importedEventsDraft.push(newEvent);
      };

      const start = new Date(startParsed.date);
      const isAllDay = Boolean(startParsed.isAllDay);
      if (isAllDay && endParsed?.date) {
        const inclusiveEnd = new Date(endParsed.date);
        inclusiveEnd.setDate(inclusiveEnd.getDate() - 1); // ICS all-day DTEND is exclusive
        if (!Number.isNaN(inclusiveEnd.getTime()) && inclusiveEnd >= start) {
          const multiDayId = `impmd_${nowTs}_${idx}`;
          for (let d = new Date(start); d <= inclusiveEnd; d.setDate(d.getDate() + 1)) {
            pushEvent(new Date(d), { allDay: true, multiDayId });
            if (importedEventsDraft.length > 5000) break;
          }
          return;
        }
      }

      pushEvent(start, { allDay: isAllDay });
    });

    const { insertedCount, duplicateCount } = await persistImportedEvents(importedEventsDraft);
    if (insertedCount === 0) {
      if (duplicateCount > 0) {
        alert('No new events were imported (all matched existing events).');
        return true;
      }
      alert('No valid events were imported from this source.');
      return false;
    }

    alert(
      `Imported ${insertedCount} event${insertedCount === 1 ? '' : 's'} from ${sourceLabel}`
      + (duplicateCount > 0 ? ` (${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'} skipped).` : '.')
    );
    return true;
  };

  const normalizeIcsUrl = (raw) => {
    const trimmed = String(raw || '').trim();
    if (!trimmed) return '';
    if (/^webcal:\/\//i.test(trimmed)) return trimmed.replace(/^webcal:\/\//i, 'https://');
    return trimmed;
  };

  const importIcsFromUrl = async (rawUrl) => {
    if (!activeLayerId || !user?.id) return false;
    const url = normalizeIcsUrl(rawUrl);
    if (!url) {
      alert('Paste your Apple calendar share link first.');
      return false;
    }
    setIsImportingCalendar(true);
    try {
      if (!/^https?:\/\//i.test(url)) {
        throw new Error('Use a valid http(s) or webcal calendar URL.');
      }
      const { data, error } = await supabase.functions.invoke('fetch-ics-url', {
        body: { url },
      });
      if (error) {
        const status = Number(error?.context?.status || 0);
        let serverMessage = '';
        try {
          const context = error?.context;
          if (context && typeof context.clone === 'function' && typeof context.clone().json === 'function') {
            const payload = await context.clone().json();
            serverMessage = String(payload?.error || payload?.message || '').trim();
          }
        } catch {}
        if (status === 404) {
          throw new Error('Server calendar fetch failed. Make sure the Edge Function "fetch-ics-url" is deployed.');
        }
        throw new Error(serverMessage || String(error?.message || '').trim() || 'Server calendar fetch failed.');
      }
      const text = String(data?.icsText || '');
      if (!/BEGIN:VCALENDAR/i.test(text)) {
        throw new Error('That link did not return a valid .ics calendar feed.');
      }
      const success = await importIcsTextContent(text, 'Apple calendar URL');
      return success;
    } catch (err) {
      console.error('ICS URL import failed:', err);
      alert(
        `Import from URL failed: ${err?.message || 'Unknown error'}\n\n`
        + 'If this is an Apple share link, make sure it starts with webcal:// or https:// and is publicly accessible.'
      );
      return false;
    } finally {
      setIsImportingCalendar(false);
    }
  };

  const importIcsFile = async (file) => {
    if (!file || !activeLayerId || !user?.id) return;
    setIsImportingCalendar(true);
    try {
      const text = await file.text();
      await importIcsTextContent(text, file.name || '.ics file');
    } catch (err) {
      console.error('ICS import failed:', err);
      alert(`Import failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsImportingCalendar(false);
      if (importCalendarInputRef.current) importCalendarInputRef.current.value = '';
    }
  };

  const handleFirstImportPromptChoice = async (provider) => {
    const finalizePromptDismissal = () => {
      if (dontShowImportPromptChecked) {
        localStorage.setItem(IMPORT_PROMPT_HIDE_KEY, 'true');
        setHideImportPromptForever(true);
      }
      setImportPromptDismissedThisSession(true);
      setDontShowImportPromptChecked(false);
      setImportPromptStep('main');
      setShowFirstImportPrompt(false);
    };

    if (provider === 'google') {
      await importGoogleCalendarEvents();
      finalizePromptDismissal();
      return;
    }

    if (provider === 'apple') {
      importCalendarInputRef.current?.click();
      finalizePromptDismissal();
      return;
    }

    if (provider === 'apple_url') {
      const imported = await importIcsFromUrl(appleCalendarUrlInput);
      if (!imported) return;
      setAppleCalendarUrlInput('');
      finalizePromptDismissal();
      return;
    }

    finalizePromptDismissal();
  };

  useEffect(() => {
    if (isLoading || showAuth || showUserSetup) return;
    if (!user?.id || !activeLayerId) return;
    if (googleImportResumeRef.current) return;
    const pendingGoogleImport = localStorage.getItem(GOOGLE_IMPORT_PENDING_KEY) === 'true';
    if (!pendingGoogleImport) return;
    googleImportResumeRef.current = true;
    localStorage.removeItem(GOOGLE_IMPORT_PENDING_KEY);
    importGoogleCalendarEvents({ allowReconnect: false });
  }, [isLoading, showAuth, showUserSetup, user?.id, activeLayerId]);

  const handleTimeSubmit = async (time) => {
    if (!assertCanEditActiveLayer('add events to this calendar')) return;
    if (!pendingEvent) return;
    if (!pendingEvent.isMultiDay && time) {
      const proposedDates = pendingEvent.datesToAdd || [];
      const allConflicts = [];
      for (const date of proposedDates) {
        const dk = getDateKey(date);
        const found = await findSchedulingConflicts({ dateKey: dk, time, ignoreEventId: null });
        found.forEach((item) => allConflicts.push(item));
      }
      if (allConflicts.length > 0) {
        const unique = Array.from(new Map(allConflicts.map((row) => [String(row.id), row])).values())
          .sort((a, b) => a.deltaMs - b.deltaMs)
          .slice(0, 4);
        const lines = unique
          .map((row) => `• ${row.title} (${row.layerName}) at ${formatConflictDateTime(row.date, row.time)}`)
          .filter(Boolean);
        // Close "What time?" first so the conflict modal is the only active prompt.
        setShowTimePrompt(false);
        const ok = await openConflictPrompt({
          title: `"${pendingEvent.title}" is within ${SCHEDULING_CONFLICT_WINDOW_HOURS} hours of:`,
          lines,
        });
        if (!ok) {
          setShowTimePrompt(true);
          return;
        }
      }
    }
    const updatedEvents = { ...events };
    const multiDayId = pendingEvent.isMultiDay ? Date.now().toString() : null;
    const createdEventIds = [];
    pendingEvent.datesToAdd.forEach(date => {
      const dateKey = getDateKey(date);
      const eventId = `${Date.now()}-${Math.random()}`;
      const newEvent = {
        id: eventId,
        title: pendingEvent.title,
        time: pendingEvent.isMultiDay ? null : (time || null),
        date: dateKey,
        category: pendingEvent.isPopupEvent ? 'popup_event' : selectedCategory,
        description: String(pendingEvent.description || '').trim(),
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
      createdEventIds.push(eventId);
      const dateEvents = updatedEvents[dateKey] || [];
      updatedEvents[dateKey] = [...dateEvents, newEvent].sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
    });
    saveEvents(updatedEvents);
    if (pendingEvent.isPopupEvent) {
      const maxPeople = Math.max(1, Number(pendingEvent.popupMaxPeople || 1));
      await createPopupEventRows(createdEventIds.map((eventId) => ({
        layer_id: activeLayerId,
        event_id: eventId,
        max_people: maxPeople,
        created_by_user_id: user?.id || null,
        created_by_name: currentUser || user?.email || user?.phone || 'Member',
        created_at: new Date().toISOString(),
      })));
    }
    setSelectedDates([]);
    setRecurrence('once');
    setSuggestedTime('');
    setShowTimePrompt(false);
    setPendingEvent(null);
    setIsPopupEventDraft(false);
    setPopupEventMaxPeopleDraft('10');
  };

  const deleteEventsByIds = async (eventIds, options = {}) => {
    const silent = Boolean(options?.silent);
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
      if (!silent) alert(`Could not delete event(s): ${error.message}`);
      return false;
    }
    const deletedIds = new Set((data || []).map(row => String(row.id)));
    if (deletedIds.size === 0 || ids.some(id => !deletedIds.has(String(id)))) {
      const missing = ids.filter(id => !deletedIds.has(String(id)));
      if (!silent) alert(`Delete blocked by permissions or ownership. Missing IDs: ${missing.join(', ')}`);
      return false;
    }
    try {
      await supabase.from('popup_event_signups').delete().eq('layer_id', activeLayerId).in('event_id', ids);
      await supabase.from('popup_events').delete().eq('layer_id', activeLayerId).in('event_id', ids);
      await loadPopupEventData();
    } catch {}
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

  const openRecurringDeletePrompt = ({ dateKey, event }) => {
    if (!event?.id) return;
    setRecurringDeletePrompt({
      dateKey: String(dateKey || ''),
      eventId: String(event.id),
      title: String(event.title || 'this event'),
      isVirtualAnnual: Boolean(event.isVirtualAnnual),
      isVirtualRecurrence: Boolean(event.isVirtualRecurrence),
    });
  };

  const closeRecurringDeletePrompt = () => {
    setRecurringDeletePrompt(null);
  };

  const confirmRecurringDeleteChoice = async (skipOnce) => {
    const prompt = recurringDeletePrompt;
    if (!prompt?.eventId) return;
    closeRecurringDeletePrompt();
    await handleDeleteEvent(
      prompt.dateKey,
      prompt.eventId,
      prompt.isVirtualAnnual,
      prompt.isVirtualRecurrence,
      Boolean(skipOnce)
    );
  };

  // Update a field without closing the edit form (for toggles)
  const handleUpdateEventField = async (dateKey, eventId, updates) => {
    if (Object.prototype.hasOwnProperty.call(updates || {}, 'time')) {
      const nextTime = String(updates?.time || '').trim();
      if (nextTime) {
        const actualDateKeyForConflict = Object.keys(events).find(k => events[k].some(e => e.id === eventId)) || dateKey;
        const targetEvent = (events[actualDateKeyForConflict] || []).find(e => e.id === eventId);
        const proposedDateKey = String(updates?.date || targetEvent?.date || actualDateKeyForConflict || '').trim();
        const ok = await confirmSchedulingConflicts({
          dateKey: proposedDateKey,
          time: nextTime,
          ignoreEventId: eventId,
          draftTitle: String(targetEvent?.title || 'This event'),
        });
        if (!ok) return;
      }
    }
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
  const multiDaySpanCounts = {};
  Object.values(events || {}).forEach((rows) => {
    (rows || []).forEach((row) => {
      if (!row?.isMultiDay) return;
      const key = String(row?.multiDayId || '').trim();
      if (!key) return;
      multiDaySpanCounts[key] = (multiDaySpanCounts[key] || 0) + 1;
    });
  });
  const shouldShowCategoryDot = (event) => {
    if (!event || event.isHoliday) return false;
    if (!event.isMultiDay) return true;
    const key = String(event?.multiDayId || '').trim();
    if (!key) return false;
    // Backward-compat: older imports marked single-day all-day rows as multi-day.
    return Number(multiDaySpanCounts[key] || 0) <= 1;
  };
  const agendaItems = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const days = Math.max(1, Math.min(365, Number(agendaRangeDays || 30)));
    const query = String(agendaSearchQuery || '').trim().toLowerCase();
    const out = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dateKey = getDateKey(d);
      const rows = (getEventsForDate(d) || []).map((event) => ({
        ...event,
        dateKey,
      }));
      rows.forEach((event) => {
        if (!query) {
          out.push(event);
          return;
        }
        const categoryLabel = String((categories[event.category || 'other'] || categories.other || {}).label || '').toLowerCase();
        const haystack = [
          String(event.title || '').toLowerCase(),
          String(event.location || '').toLowerCase(),
          String(event.createdBy || '').toLowerCase(),
          String(event.date || '').toLowerCase(),
          String(event.time || '').toLowerCase(),
          categoryLabel,
        ].join(' ');
        if (haystack.includes(query)) out.push(event);
      });
    }
    return out.sort((a, b) => {
      const ak = String(a.date || a.dateKey || '');
      const bk = String(b.date || b.dateKey || '');
      if (ak !== bk) return ak.localeCompare(bk);
      if (!a.time) return 1;
      if (!b.time) return -1;
      return String(a.time).localeCompare(String(b.time));
    });
  }, [agendaRangeDays, agendaSearchQuery, events, holidays, categories, currentDate]);
  const openAgendaItem = (event) => {
    const key = String(event?.date || event?.dateKey || '').trim();
    const m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (Number.isNaN(d.getTime())) return;
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(d);
    setSelectedDates([]);
    setShowDateDetailModal(true);
  };
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
  const parseNotificationTimestamp = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const direct = new Date(raw);
    if (!Number.isNaN(direct.getTime())) return direct;
    const normalized = raw.replace(' ', 'T');
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
    if (!hasTimezone) {
      const assumedUtc = new Date(`${normalized}Z`);
      if (!Number.isNaN(assumedUtc.getTime())) return assumedUtc;
    }
    const fallback = new Date(normalized);
    if (!Number.isNaN(fallback.getTime())) return fallback;
    return null;
  };
  const formatNotificationTime = (value) => {
    const d = parseNotificationTimestamp(value);
    if (!d) return 'Just now';
    const diffMs = Date.now() - d.getTime();
    if (Number.isFinite(diffMs) && diffMs >= 0) {
      const sec = Math.floor(diffMs / 1000);
      if (sec < 60) return 'Just now';
      const min = Math.floor(sec / 60);
      if (min < 60) return `${min}m ago`;
      const hr = Math.floor(min / 60);
      if (hr < 24) return `${hr}h ago`;
    }
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  const upcomingTrips = [...subCalendars]
    .filter(sc => {
      const startTs = toDateOnlyTs(getSubCalStartRaw(sc));
      return startTs !== null && startTs > todayTs;
    })
    .sort((a, b) => toDateOnlyTs(getSubCalStartRaw(a)) - toDateOnlyTs(getSubCalStartRaw(b)));
  const upcomingPopupEvents = (() => {
    const seen = new Set();
    return Object.entries(events || {})
      .flatMap(([dateKey, dateEvents]) => (dateEvents || []).map((event) => ({
        ...event,
        dateKey: String(event?.date || dateKey || ''),
      })))
      .filter((event) => {
        const eventId = String(event?.id || '');
        if (!eventId || seen.has(eventId)) return false;
        if (!popupEventsByEventId[eventId]) return false;
        const eventTs = toDateOnlyTs(event?.date || event?.dateKey || '');
        if (eventTs === null || eventTs < todayTs) return false;
        seen.add(eventId);
        return true;
      })
      .sort((a, b) => {
        const aTs = toDateOnlyTs(a?.date || a?.dateKey || '') || 0;
        const bTs = toDateOnlyTs(b?.date || b?.dateKey || '') || 0;
        if (aTs !== bTs) return aTs - bTs;
        if (!a?.time) return 1;
        if (!b?.time) return -1;
        return String(a.time).localeCompare(String(b.time));
      });
  })();
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
  const uniqueVisibleLayers = Array.from(
    new Map((layers || []).map(layer => [String(layer?.id || ''), layer])).values()
  ).filter(layer => String(layer?.id || '').trim() !== '');
  const visibleLayerCalendars = [...uniqueVisibleLayers].sort((a, b) => {
    const aOwned = String(a?.owner_id) === String(user?.id) ? 0 : 1;
    const bOwned = String(b?.owner_id) === String(user?.id) ? 0 : 1;
    if (aOwned !== bOwned) return aOwned - bOwned;
    return String(a?.name || '').localeCompare(String(b?.name || ''));
  });
  useEffect(() => {
    if (!user?.id) {
      setActiveCalendarSortOrder([]);
      setUpcomingTripSortOrder([]);
      setUpcomingPopupSortOrder([]);
      return;
    }
    const activeCalendarsKey = getActiveCalendarsSortLocalKey(user.id);
    setActiveCalendarSortOrder(readLocalSortOrder(activeCalendarsKey));
    if (!activeLayerId) {
      setUpcomingTripSortOrder([]);
      setUpcomingPopupSortOrder([]);
      return;
    }
    const tripsKey = getUpcomingTripsSortLocalKey(user.id, activeLayerId);
    const popupsKey = getUpcomingPopupsSortLocalKey(user.id, activeLayerId);
    setUpcomingTripSortOrder(readLocalSortOrder(tripsKey));
    setUpcomingPopupSortOrder(readLocalSortOrder(popupsKey));
  }, [user?.id, activeLayerId]);

  useEffect(() => {
    if (!user?.id) return;
    writeLocalSortOrder(getActiveCalendarsSortLocalKey(user.id), activeCalendarSortOrder);
  }, [user?.id, activeCalendarSortOrder]);

  useEffect(() => {
    if (!user?.id || !activeLayerId) return;
    writeLocalSortOrder(getUpcomingTripsSortLocalKey(user.id, activeLayerId), upcomingTripSortOrder);
  }, [user?.id, activeLayerId, upcomingTripSortOrder]);

  useEffect(() => {
    if (!user?.id || !activeLayerId) return;
    writeLocalSortOrder(getUpcomingPopupsSortLocalKey(user.id, activeLayerId), upcomingPopupSortOrder);
  }, [user?.id, activeLayerId, upcomingPopupSortOrder]);

  useEffect(() => {
    const ids = visibleLayerCalendars.map((layer) => String(layer?.id || ''));
    setActiveCalendarSortOrder((prev) => normalizeSortOrder(ids, prev));
  }, [visibleLayerCalendars]);

  useEffect(() => {
    const ids = upcomingTrips.map((trip) => String(trip?.id || ''));
    setUpcomingTripSortOrder((prev) => normalizeSortOrder(ids, prev));
  }, [upcomingTrips]);

  useEffect(() => {
    const ids = upcomingPopupEvents.map((event) => String(event?.id || ''));
    setUpcomingPopupSortOrder((prev) => normalizeSortOrder(ids, prev));
  }, [upcomingPopupEvents]);

  useEffect(() => {
    if (!user?.id) return;
    if (bottomNavTab !== 'explore') return;
    loadPublicCalendars();
  }, [bottomNavTab, user?.id, layerRefreshToken]);

  useEffect(() => {
    setSubCalMembersCollapsed(true);
  }, [activeSubCalendar?.id]);

  const orderedVisibleLayerCalendars = (() => {
    const byId = new Map((visibleLayerCalendars || []).map((layer) => [String(layer?.id || ''), layer]));
    const order = normalizeSortOrder(Array.from(byId.keys()), activeCalendarSortOrder);
    return order.map((id) => byId.get(id)).filter(Boolean);
  })();
  const orderedPrivateLayerCalendars = orderedVisibleLayerCalendars.filter((layer) => !Boolean(layer?.is_public));
  const orderedPublicLayerCalendars = orderedVisibleLayerCalendars.filter((layer) => Boolean(layer?.is_public));

  const orderedUpcomingTrips = (() => {
    const byId = new Map((upcomingTrips || []).map((trip) => [String(trip?.id || ''), trip]));
    const order = normalizeSortOrder(Array.from(byId.keys()), upcomingTripSortOrder);
    return order.map((id) => byId.get(id)).filter(Boolean);
  })();

  const orderedUpcomingPopupEvents = (() => {
    const byId = new Map((upcomingPopupEvents || []).map((event) => [String(event?.id || ''), event]));
    const order = normalizeSortOrder(Array.from(byId.keys()), upcomingPopupSortOrder);
    return order.map((id) => byId.get(id)).filter(Boolean);
  })();

  const filteredPublicCalendars = (() => {
    const q = String(exploreSearch || '').trim().toLowerCase();
    if (!q) return publicCalendars;
    return (publicCalendars || []).filter((row) => {
      const tags = Array.isArray(row?.public_tags) ? row.public_tags : [];
      const hay = [
        String(row?.name || ''),
        String(row?.public_description || ''),
        String(row?.created_by || ''),
        tags.join(' '),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  })();
  const publishTargetLayer = (layers || []).find((layer) => String(layer?.id || '') === String(publishLayerTargetId || '')) || null;
  const publishTargetIsPublic = Boolean(publishTargetLayer?.is_public);

  const handleDropActiveCalendar = (targetId, groupIds = null) => {
    const ids = Array.isArray(groupIds) && groupIds.length > 0
      ? groupIds
      : visibleLayerCalendars.map((layer) => String(layer?.id || ''));
    setActiveCalendarSortOrder((prev) => {
      const normalized = normalizeSortOrder(ids, prev);
      return reorderSortOrder(normalized, draggingActiveCalendarId, targetId);
    });
    setDraggingActiveCalendarId(null);
  };

  const handleDropUpcomingTrip = (targetId) => {
    const ids = upcomingTrips.map((trip) => String(trip?.id || ''));
    setUpcomingTripSortOrder((prev) => {
      const normalized = normalizeSortOrder(ids, prev);
      return reorderSortOrder(normalized, draggingUpcomingTripId, targetId);
    });
    setDraggingUpcomingTripId(null);
  };

  const handleDropUpcomingPopup = (targetId) => {
    const ids = upcomingPopupEvents.map((event) => String(event?.id || ''));
    setUpcomingPopupSortOrder((prev) => {
      const normalized = normalizeSortOrder(ids, prev);
      return reorderSortOrder(normalized, draggingUpcomingPopupId, targetId);
    });
    setDraggingUpcomingPopupId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Loading calendar...</div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    setAuthBusy(false);
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
            disabled={authBusy}
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
        <div style={{ width: 'calc(100vw - 2rem)', maxWidth: '28rem', boxSizing: 'border-box' }} className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            What time?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">Event: <strong>{pendingEvent.title}</strong></p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {pendingEvent.isMultiDay ? "Multi-day events don't need a time" : 'Enter a time or skip to add without time'}
            {recurrence !== 'once' && (
              <span className="ml-2 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                {recurrence === 'weekly' ? '🔁 Weekly' : recurrence === 'monthly' ? '🗓️ Monthly' : '🎂 Annual'}
              </span>
            )}
          </p>
          <div className="min-w-0" style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
            <input
              type="text"
              id="timeInput"
              placeholder="e.g. 3:00 PM or 15:00"
              defaultValue={suggestedTime || ''}
              style={{ boxSizing: 'border-box', minWidth: 0 }}
              className="block w-full min-w-0 max-w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 mb-4"
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
  const activeChatUnreadCount = Number(chatUnreadCounts[String(activeLayerId || '')] || 0);
  const chatTotalMembers = Math.max(1, Number(chatMembers.length || 0));
  const chatOnlineMemberCount = chatMembers.reduce((sum, member) => (
    member?.userId && chatPresenceByUserId[String(member.userId)] ? sum + 1 : sum
  ), 0);
  const chatMembersWithStatus = [...chatMembers].sort((a, b) => {
    const aOnline = Boolean(a?.userId && chatPresenceByUserId[String(a.userId)]);
    const bOnline = Boolean(b?.userId && chatPresenceByUserId[String(b.userId)]);
    if (aOnline !== bOnline) return aOnline ? -1 : 1;
    return String(a?.label || '').localeCompare(String(b?.label || ''));
  });
  const selectedSharedListGroup = sharedListGroups.find(group => group.id === selectedSharedListId) || null;
  const incompleteSharedListItems = sharedListItems.filter(item => !item.done);
  const completedSharedListItems = sharedListItems.filter(item => item.done);
  const totalSharedListItems = sharedListItems.length;
  const completedSharedListCount = completedSharedListItems.length;

  return (
    <>
    <style>{shakeStyle}</style>
    {showConflictPrompt && (
      <div className="fixed inset-0 z-[95] bg-black/45 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-purple-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-2xl">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {conflictPromptData.heading || 'Scheduling Conflict'}
          </h3>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{conflictPromptData.title}</p>
          <div className="mt-3 rounded-xl bg-purple-50 dark:bg-gray-700/70 border border-purple-100 dark:border-gray-600 p-3 space-y-1.5">
            {(conflictPromptData.lines || []).map((line, idx) => (
              <div key={idx} className="text-xs sm:text-sm text-gray-700 dark:text-gray-200">{line}</div>
            ))}
          </div>
          <div className={`mt-4 grid grid-cols-1 ${conflictPromptData.showCancel !== false ? 'sm:grid-cols-2' : ''} gap-2`}>
            <button
              onClick={() => closeConflictPrompt(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-sm font-semibold hover:shadow-lg transition-all"
            >
              {conflictPromptData.confirmLabel || 'Save Anyway'}
            </button>
            {conflictPromptData.showCancel !== false && (
              <button
                onClick={() => closeConflictPrompt(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                {conflictPromptData.cancelLabel || 'Change Time'}
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    {recurringDeletePrompt && (
      <div className="fixed inset-0 z-[96] bg-black/45 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-2xl">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
            Recurring Event
          </h3>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
            Choose how you want to remove <span className="font-semibold">"{recurringDeletePrompt.title}"</span>.
          </p>
          <div className="mt-3 rounded-xl bg-rose-50 dark:bg-gray-700/70 border border-rose-100 dark:border-gray-600 p-3 space-y-1.5">
            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-200">Remove only this one occurrence</div>
            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-200">or delete the entire series.</div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => confirmRecurringDeleteChoice(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-sm font-semibold hover:shadow-lg transition-all"
            >
              Just This One
            </button>
            <button
              onClick={() => confirmRecurringDeleteChoice(false)}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white text-sm font-semibold hover:shadow-lg transition-all"
            >
              Delete All
            </button>
            <button
              onClick={closeRecurringDeletePrompt}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    {showFirstImportPrompt && (
      <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {importPromptStep === 'apple' ? 'Import Apple Calendar' : 'Import Calendar'}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {importPromptStep === 'apple'
              ? 'Paste your Apple calendar share link or upload an exported .ics file.'
              : 'Choose Google or Apple, then import events into this calendar layer.'}
          </p>
          <label className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={dontShowImportPromptChecked}
              onChange={(e) => setDontShowImportPromptChecked(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Don't show this again
          </label>
          {importPromptStep === 'main' ? (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleFirstImportPromptChoice('google')}
                disabled={isImportingCalendar || !activeLayerId || !user?.id}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
              >
                Connect Google
              </button>
              <button
                onClick={() => setImportPromptStep('apple')}
                disabled={isImportingCalendar || !activeLayerId || !user?.id}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
              >
                Import Apple Calendar
              </button>
              <button
                onClick={() => handleFirstImportPromptChoice('later')}
                className="sm:col-span-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Not now
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 bg-gray-50/80 dark:bg-gray-900/30">
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Apple Share Link
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={appleCalendarUrlInput}
                    onChange={(e) => setAppleCalendarUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!isImportingCalendar && activeLayerId && user?.id && appleCalendarUrlInput.trim()) {
                          handleFirstImportPromptChoice('apple_url');
                        }
                      }
                    }}
                    placeholder="webcal://... or https://... .ics"
                    className="w-full sm:flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    onClick={() => handleFirstImportPromptChoice('apple_url')}
                    disabled={isImportingCalendar || !activeLayerId || !user?.id || !appleCalendarUrlInput.trim()}
                    className="w-full sm:w-auto px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all whitespace-nowrap"
                  >
                    Import URL
                  </button>
                </div>
                <button
                  onClick={() => handleFirstImportPromptChoice('apple')}
                  disabled={isImportingCalendar || !activeLayerId || !user?.id}
                  className="mt-2 w-full sm:w-auto px-3 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
                >
                  Upload .ics File
                </button>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 p-2.5">
                <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">How to get Apple link / file</div>
                <ol className="mt-1 text-[11px] text-gray-600 dark:text-gray-300 space-y-1 list-decimal pl-4">
                  <li>
                    Open Calendar on iPhone/Mac.
                    {' '}
                    <a
                      href="calshow://"
                      className="text-indigo-600 dark:text-indigo-300 underline"
                    >
                      Open Calendar
                    </a>
                  </li>
                  <li>Click calendar icon at the bottom of the screen.</li>
                  <li>Find the calendar you want, tap the info icon, then Share Calendar.</li>
                  <li>Turn on Public Calendar and copy the link (webcal://...).</li>
                  <li>
                    If needed, use
                    {' '}
                    <a
                      href="https://www.icloud.com/calendar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-300 underline"
                    >
                      iCloud Calendar
                    </a>
                    {' '}
                    to copy/export.
                  </li>
                </ol>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setImportPromptStep('main')}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => handleFirstImportPromptChoice('later')}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Not now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    <input
      ref={importCalendarInputRef}
      type="file"
      accept=".ics,text/calendar"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) importIcsFile(file);
      }}
    />
    <input
      ref={layerMediaInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        const kind = pendingLayerMediaKindRef.current;
        pendingLayerMediaKindRef.current = '';
        if (file && kind) beginLayerMediaCrop(kind, file);
      }}
    />
    <div className="min-h-screen p-2 sm:p-3 pt-7 sm:pt-10 pb-24" style={themedPageBackgroundStyle}>
      <div className="max-w-6xl mx-auto">
        <div
          ref={layerHeaderCardRef}
          className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl mb-4 ${
            activeLayer?.header_bg_url
              ? 'p-4 sm:p-5 min-h-[210px] sm:min-h-[250px]'
              : 'p-3 sm:p-4'
          }`}
          style={activeLayer?.header_bg_url && effectiveCoverOpacity > 0.01
            ? {
              backgroundImage: `linear-gradient(${hexToRgba(coverFadeSurfaceColor, Number((1 - effectiveCoverOpacity).toFixed(3)))}, ${hexToRgba(coverFadeSurfaceColor, Number((1 - effectiveCoverOpacity).toFixed(3)))}), url(${activeLayer.header_bg_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
            : undefined}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {activeLayer?.icon_url ? (
                  <img
                    src={activeLayer.icon_url}
                    alt="Calendar icon"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-purple-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="p-1.5 bg-gradient-to-br from-rose-400 via-purple-400 to-indigo-400 rounded-xl">
                    <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                )}
                {isActiveLayerOwner && (
                  <button
                    onClick={openLayerMediaMenu}
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
                    title="Edit cover/icon"
                  >
                    <Camera className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                  </button>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h1
                    onClick={() => {
                      if (!canEditActiveLayerTitle) return;
                      openTitleStyleModal();
                    }}
                    className={`text-xl sm:text-2xl font-bold transition-opacity truncate ${canEditActiveLayerTitle ? 'cursor-pointer hover:opacity-70' : 'cursor-default opacity-90'}`}
                    style={activeLayerTitleTextStyle}
                    title={canEditActiveLayerTitle ? 'Click to edit title and style' : 'Read-only calendar'}
                  >
                    {calendarTitle}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  <span className="font-semibold" style={themeAccentTextStyle}>{user?.email || user?.phone || currentUser}</span>
                  {!canEditActiveLayer && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 align-middle">
                      Read only
                    </span>
                  )}
                  <button onClick={handleLogout} className="ml-2 text-xs underline" style={themeAccentTextStyle}>logout</button>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowSharePanel(!showSharePanel)}
                className={`p-2 rounded-xl transition-all duration-200 border ${
                  useLegacyEllieMilesTheme
                    ? showSharePanel
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-transparent'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent'
                    : showSharePanel
                      ? 'border-transparent'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent'
                }`}
                style={showSharePanel && !useLegacyEllieMilesTheme ? themeAccentButtonStyle : undefined}
                title="Share calendar"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                className={`relative p-2 rounded-xl transition-all duration-200 bg-gray-100 dark:bg-gray-700 ${
                  notificationsEnabled
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
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
                className={`px-3 py-2 rounded-xl transition-all duration-200 text-xs font-semibold border ${
                  useLegacyEllieMilesTheme
                    ? showListPanel
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-transparent'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent'
                    : showListPanel
                      ? 'border-transparent'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent'
                }`}
                style={showListPanel && !useLegacyEllieMilesTheme ? themeAccentButtonStyle : undefined}
                title="Shared list"
              >
                List
              </button>
              <button
                onClick={() => {
                  const layerKey = String(activeLayerId || '');
                  const next = !showChatPanel;
                  setShowChatPanel(next);
                  if (!next) setShowChatMembersPanel(false);
                  if (next && layerKey) markChatSeenForLayer(layerKey);
                }}
                className={`relative px-3 py-2 rounded-xl transition-all duration-200 text-xs font-semibold border ${
                  useLegacyEllieMilesTheme
                    ? showChatPanel
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-transparent'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent'
                    : showChatPanel
                      ? 'border-transparent'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent'
                }`}
                style={showChatPanel && !useLegacyEllieMilesTheme ? themeAccentButtonStyle : undefined}
                title="Calendar chat"
              >
                Chat
                {activeChatUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] leading-none font-bold flex items-center justify-center">
                    {activeChatUnreadCount > 99 ? '99+' : activeChatUnreadCount}
                  </span>
                )}
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
                className={`p-2 rounded-xl transition-all duration-200 border ${
                  useLegacyEllieMilesTheme
                    ? showCategoryEditor
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-transparent'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent'
                    : showCategoryEditor
                      ? 'border-transparent'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent'
                }`}
                style={showCategoryEditor && !useLegacyEllieMilesTheme ? themeAccentButtonStyle : undefined}
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
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
                className="p-2 rounded-xl transition-all duration-200"
                style={undefined}
              >
                <ChevronLeft
                  className="w-6 h-6"
                  style={undefined}
                />
              </button>
            <div className="flex flex-col items-center gap-1">
              <h2 className="text-lg sm:text-xl font-semibold" style={activeLayerTitleTextStyle}>
                {calendarView === 'month'
                  ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : calendarView === 'week'
                    ? (() => {
                      const days = getWeekDays(currentDate);
                      const start = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      const end = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      return `${start} – ${end}`;
                    })()
                    : `Agenda · Next ${agendaRangeDays} days`
                }
              </h2>
              <div
                className="flex rounded-lg overflow-hidden border dark:border-gray-600 text-xs font-medium"
                style={undefined}
              >
                <button
                  onClick={() => setCalendarView('month')}
                  className={`px-2.5 py-0.5 transition-all ${calendarView === 'month' ? '' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                  style={calendarView === 'month' ? themeAccentButtonStyle : undefined}
                >
                  Month
                </button>
                <button
                  onClick={() => setCalendarView('week')}
                  className={`px-2.5 py-0.5 transition-all ${calendarView === 'week' ? '' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                  style={calendarView === 'week' ? themeAccentButtonStyle : undefined}
                >
                  Week
                </button>
                <button
                  onClick={() => setCalendarView('agenda')}
                  className={`px-2.5 py-0.5 transition-all ${calendarView === 'agenda' ? '' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                  style={calendarView === 'agenda' ? themeAccentButtonStyle : undefined}
                >
                  Agenda
                </button>
              </div>
            </div>
              <button
                onClick={() => calendarView === 'month' ? changeMonth(1) : changeWeek(1)}
                className="p-2 rounded-xl transition-all duration-200"
                style={undefined}
              >
                <ChevronRight
                  className="w-6 h-6"
                  style={undefined}
                />
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
                      <div key={`${invite.subCalendarId}-${invite.identity || 'invite'}`} className="rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-gray-800 p-2.5">
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
              <div
                className={`p-4 rounded-xl border ${useLegacyEllieMilesTheme ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : ''}`}
                style={useLegacyEllieMilesTheme ? undefined : { backgroundColor: themeAccentSofterBg, borderColor: themeAccentBorder }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5" style={useLegacyEllieMilesTheme ? undefined : themeAccentTextStyle} />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">In-App Updates</span>
                    {unreadInAppCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{unreadInAppCount}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={markAllInAppNotificationsRead}
                      disabled={unreadInAppCount === 0}
                      className={`px-2 py-1 rounded-md text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed ${useLegacyEllieMilesTheme ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : ''}`}
                      style={useLegacyEllieMilesTheme ? undefined : themeAccentButtonStyle}
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
                        onClick={() => { void handleInAppNotificationClick(item); }}
                        className={`w-full text-left rounded-lg border px-2.5 py-2 transition-colors ${
                          useLegacyEllieMilesTheme
                            ? (item.read ? 'bg-white/70 dark:bg-gray-800 border-indigo-100 dark:border-indigo-800' : 'bg-white dark:bg-gray-800 border-indigo-300 dark:border-indigo-600')
                            : (item.read ? 'bg-white/70 dark:bg-gray-800' : 'bg-white dark:bg-gray-800')
                        }`}
                        style={useLegacyEllieMilesTheme ? undefined : { borderColor: item.read ? mixHexColors(activeLayerPageTheme.accent, '#ffffff', darkMode ? 0.8 : 0.85) : themeAccentBorder }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs ${item.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100 font-medium'}`}>{item.message}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {!item.read && <span className="w-2 h-2 rounded-full bg-red-500 mt-1" />}
                            {item.read && (
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteInAppNotification(item.id); }}
                                className="text-gray-400 hover:text-red-500 leading-none"
                                title="Remove notification"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                          {formatNotificationTime(item.createdAt)}
                        </div>
                        {item.type === 'invite' && (() => {
                          const parsedInvite = parseInviteNotification(item);
                          if (!parsedInvite) return null;
                          if (parsedInvite.kind === 'calendar') {
                            return (
                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    acceptCalendarInvite(parsedInvite);
                                    markInAppNotificationRead(item.id);
                                  }}
                                  className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-violet-500 hover:bg-violet-600 text-white"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    declineCalendarInvite(parsedInvite);
                                    markInAppNotificationRead(item.id);
                                  }}
                                  className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                  Decline
                                </button>
                              </div>
                            );
                          }

                          if (parsedInvite.kind !== 'trip') return null;
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
                                    identity: parsedInvite.identity,
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
                                    identity: parsedInvite.identity,
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

        {showAiAssistant && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-5 mb-6 border" style={{ borderColor: themeAccentBorder }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold" style={themeAccentHeadingStyle}>AI Assistant</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ask for help planning events, reminders, and trip ideas.</p>
              </div>
              <button
                onClick={() => setShowAiAssistant(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close AI assistant"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <div className="h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 space-y-2">
              {aiMessages.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}`}
                    className={`max-w-[92%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                      ? 'ml-auto text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100'
                    }`}
                    style={msg.role === 'user' ? themeAccentButtonStyle : undefined}
                  >
                    {msg.content}
                  </div>
              ))}
              {aiLoading && (
                <div className="max-w-[92%] px-3 py-2 rounded-xl text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                  Thinking...
                </div>
              )}
            </div>
            {aiError && <p className="mt-2 text-xs text-red-500">{aiError}</p>}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendAiAssistantMessage();
                  }
                }}
                placeholder="Ask anything about your calendar..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2"
                style={{ borderColor: themeAccentBorder }}
              />
              <button
                onClick={sendAiAssistantMessage}
                disabled={aiLoading || !aiInput.trim()}
                className="px-3 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={themeAccentButtonStyle}
              >
                Send
              </button>
            </div>
          </div>
        )}

        {showSharePanel && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold" style={themeAccentHeadingStyle}>
                Share Calendar
              </h3>
              <button onClick={() => { setShowSharePanel(false); setShareMessage(''); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="mb-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Enter someone's email or phone number to give them access to your calendar.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareEmailInput}
                  onChange={(e) => { setShareEmailInput(e.target.value); setShareMessage(''); }}
                  placeholder="wife@gmail.com or +15551234567"
                  disabled={!isActiveLayerOwner}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleShareCalendar()}
                />
                <button
                  onClick={handleShareCalendar}
                  disabled={!isActiveLayerOwner}
                  className={`px-4 py-2 rounded-xl transition-all ${isActiveLayerOwner ? 'text-white hover:shadow-lg' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                  style={isActiveLayerOwner ? themeAccentButtonStyle : undefined}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {!isActiveLayerOwner && (
                <p className="text-xs text-amber-600 dark:text-amber-300 mt-2">Only the calendar owner can add/remove members or change permissions.</p>
              )}
              {shareMessage && (
                <p className={`text-sm mt-2 ${shareMessage.startsWith('?') ? 'text-green-600' : 'text-red-500'}`}>
                  {shareMessage}
                </p>
              )}
            </div>
            {myShares.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Shared with:</h4>
                <div className="space-y-2">
                  {myShares.map((share, i) => (
                    (() => {
                      const recipient = getShareRecipientFromRow(share);
                      if (!recipient) return null;
                      return (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-700">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-400 flex items-center justify-center text-white text-xs font-bold">
                          {recipient[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="min-w-0 truncate text-sm text-gray-700 dark:text-gray-300">{recipient}</span>
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200">
                          {getRecipientKindLabel(recipient)}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {isActiveLayerOwner && (
                          <button
                            onClick={() => handleToggleShareEditPermission(recipient, !(share?.can_edit !== false))}
                            className={`px-2 py-1 text-[11px] rounded-lg border transition-all ${
                              share?.can_edit !== false
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                            }`}
                            title="Toggle edit permission"
                          >
                            {share?.can_edit !== false ? 'Editor' : 'Read only'}
                          </button>
                        )}
                        <button onClick={() => handleRemoveShare(recipient)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-all" title="Remove access">
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                      );
                    })()
                  ))}
                </div>
              </div>
            )}
            <div className="mb-1 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
              {(() => {
                const activeLayer = (layers || []).find(layer => String(layer?.id || '') === String(activeLayerId || ''));
                const isOwner = String(activeLayer?.owner_id || '') === String(user?.id || '');
                const hasCollaborators = isOwner
                  ? (myShares || []).some(share => String(share?.layer_id || share?.calendar_id || '') === String(activeLayerId || ''))
                  : Boolean(activeLayerId);
                const liveLocations = Object.values(layerMemberLocations).filter(
                  loc => loc?.sharing && typeof loc?.lat === 'number' && typeof loc?.lon === 'number'
                );
                const toggleDisabled = !hasCollaborators;
                return (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">📍 Live Location</h4>
                        <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90">
                          {hasCollaborators
                            ? `${liveLocations.length} member${liveLocations.length === 1 ? '' : 's'} sharing now in this calendar.`
                            : 'Share this calendar with someone to enable live location.'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (toggleDisabled) return;
                          const next = !shareLayerLocation;
                          setShareLayerLocation(next);
                          localStorage.setItem('layer-share-location', next.toString());
                        }}
                        disabled={toggleDisabled}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shareLayerLocation && !toggleDisabled ? 'bg-green-500' : 'bg-gray-300'} ${toggleDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={toggleDisabled ? 'Share the calendar first' : 'Share my live location with calendar members'}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${shareLayerLocation && !toggleDisabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    {liveLocations.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {liveLocations.map((loc, idx) => (
                          <a
                            key={`${loc.userId || 'member'}-${idx}`}
                            href={`https://www.google.com/maps?q=${loc.lat},${loc.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400"
                          >
                            <span className="text-gray-700 dark:text-gray-200 truncate">📍 {loc.name || loc.email || loc.userId}</span>
                            <span className="text-gray-400 dark:text-gray-500 ml-2 shrink-0">Open</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            {myShares.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">No shares yet. Add an email or phone above to get started.</p>
            )}
          </div>
        )}

        {showChatPanel && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-5 mb-6 border" style={{ borderColor: themeAccentBorder }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-semibold" style={themeAccentHeadingStyle}>Calendar Chat</h3>
                  <button
                    onClick={() => setShowChatMembersPanel(prev => !prev)}
                    className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${
                      useLegacyEllieMilesTheme
                        ? 'border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/25 text-indigo-700 dark:text-indigo-200'
                        : ''
                    }`}
                    style={useLegacyEllieMilesTheme ? undefined : (showChatMembersPanel ? themeAccentButtonStyle : themeAccentSoftButtonStyle)}
                    title="Show member status"
                  >
                    {chatOnlineMemberCount}/{chatTotalMembers} members
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Messages in this calendar are shared with everyone who has access.</p>
                {showChatMembersPanel && (
                  <div className="mt-2 w-full max-w-xs rounded-xl border bg-white dark:bg-gray-900 shadow-md p-2" style={{ borderColor: themeAccentBorder }}>
                    {chatMembersWithStatus.map((member, idx) => {
                      const online = Boolean(member?.userId && chatPresenceByUserId[String(member.userId)]);
                      return (
                        <div key={String(member?.key || `${member?.label || 'member'}-${idx}`)} className="flex items-center justify-between gap-2 px-1.5 py-1">
                          <span className="text-xs text-gray-700 dark:text-gray-200 truncate">{member?.label || 'Member'}</span>
                          <span className={`inline-block w-2 h-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <button onClick={() => { setShowChatMembersPanel(false); setShowChatPanel(false); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div ref={calendarChatScrollRef} className="h-64 overflow-y-auto rounded-xl border bg-gray-50 dark:bg-gray-900 p-3 space-y-2" style={{ borderColor: themeAccentBorder }}>
              {calendarChatMessages.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">No messages yet. Start the conversation.</p>
              ) : (
                calendarChatMessages.map((msg) => {
                  const mine = String(msg?.user_id || '') === String(user?.id || '');
                  const who = String(msg?.created_by || msg?.email || 'Member');
                  const poll = parsePollMessage(msg?.message);
                  const popupInvite = poll ? null : parsePopupInviteMessage(msg?.message);
                  const textPayload = (poll || popupInvite) ? null : parseTextChatMessage(msg?.message);
                  const displayText = textPayload ? textPayload.text : String(msg?.message || '');
                  const chatReactions = poll
                    ? normalizeChatReactions(poll?.reactions)
                    : (popupInvite
                      ? normalizeChatReactions(popupInvite?.reactions)
                      : normalizeChatReactions(textPayload?.reactions));
                  const messageId = String(msg?.id || '');
                  return (
                    <div
                      key={String(msg?.id || `${who}-${msg?.created_at || ''}`)}
                      onPointerUp={(e) => {
                        if (!messageId || isDeletedChatMessage(msg?.message)) return;
                        if (e.button !== undefined && e.button !== 0) return;
                        const now = Date.now();
                        const last = chatLastTapRef.current;
                        if (last.messageId === messageId && (now - last.at) < 320) {
                          setChatReactionPickerFor(prev => prev === messageId ? null : messageId);
                          chatLastTapRef.current = { messageId: null, at: 0 };
                        } else {
                          chatLastTapRef.current = { messageId, at: now };
                        }
                      }}
                      className={`max-w-[90%] sm:max-w-[92%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap break-words ${mine ? 'ml-auto text-white' : 'bg-white dark:bg-gray-800 border text-gray-800 dark:text-gray-100'}`}
                      style={mine ? themeAccentButtonStyle : { borderColor: themeAccentBorder }}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className={`text-[10px] ${mine ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>{mine ? 'You' : who}</div>
                        {mine && (
                          <button
                            onClick={() => deleteCalendarChatMessage(msg)}
                            disabled={String(deletingChatMessageId || '') === String(msg?.id || '')}
                            className={`p-1 rounded-md ${mine ? 'text-indigo-100 hover:bg-indigo-500/60' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'} disabled:opacity-50`}
                            title={poll ? 'Delete this poll' : 'Delete this message'}
                            aria-label={poll ? 'Delete poll' : 'Delete message'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {poll ? (
                        <div className={`${mine ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                          <div className="font-semibold">{poll.question}</div>
                          {poll.mode === 'structured' ? (
                            <div className="mt-2 space-y-3">
                              {(poll.dimensions || []).map((dim) => {
                                const options = poll?.optionsByDimension?.[dim] || [];
                                const counts = getPollVoteCounts(poll, dim);
                                const total = counts.reduce((sum, n) => sum + n, 0);
                                const myVote = Number(poll?.votesByDimension?.[dim]?.[String(user?.id || '')]);
                                const winner = coercePollIndex(poll?.winners?.[dim], options.length);
                                const label = dim === 'what' ? 'What' : dim === 'where' ? 'Where' : 'When';
                                return (
                                  <div key={`${msg?.id || 'poll'}-${dim}`} className="rounded-lg border px-2.5 py-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div className={`text-[11px] font-semibold mb-1 ${mine ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-300'}`}>{label}</div>
                                    <div className="space-y-1.5">
                                      {options.map((opt, idx) => {
                                        const selected = myVote === idx;
                                        const isWinner = winner === idx;
                                        const pct = total > 0 ? Math.round((counts[idx] / total) * 100) : 0;
                                        return (
                                          <button
                                            key={`${msg?.id || 'poll'}-${dim}-opt-${idx}`}
                                            onClick={() => voteOnChatPoll(msg, idx, dim)}
                                            disabled={Boolean(poll.resolved)}
                                            className={`w-full text-left px-2 py-1.5 rounded-lg border transition-colors ${mine
                                              ? (selected ? 'bg-white border-indigo-300 text-gray-900' : 'bg-white border-gray-200 text-gray-900 hover:border-indigo-300')
                                              : (selected ? 'bg-white dark:bg-gray-800 border-indigo-300 dark:border-indigo-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700')
                                            } ${poll.resolved ? 'cursor-default opacity-90' : ''}`}
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="truncate min-w-0">{idx + 1}. {opt}</span>
                                              <span className={`text-[10px] shrink-0 ${mine ? 'text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {counts[idx]} ({pct}%)
                                              </span>
                                            </div>
                                            {isWinner && <div className={`text-[10px] mt-1 ${mine ? 'text-gray-700' : 'text-gray-600 dark:text-gray-400'}`}>Majority reached</div>}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <>
                              <div className={`text-[11px] mt-0.5 ${mine ? 'text-indigo-100/90' : 'text-gray-500 dark:text-gray-400'}`}>
                                {poll?.pollFor === 'when'
                                  ? 'Vote on the date for this event.'
                                  : `Vote to add an event on ${poll?.dateKey || getDateKey(new Date())}`}
                              </div>
                              <div className="mt-2 space-y-1.5">
                                {(poll.options || []).map((opt, idx) => {
                                  const voteCounts = getPollVoteCounts(poll);
                                  const voteTotal = voteCounts.reduce((sum, n) => sum + n, 0);
                                  const myVoteIndex = Number(poll?.votes?.[String(user?.id || '')]);
                                  const winnerIndex = coercePollIndex(poll?.winnerIndex, (poll?.options || []).length);
                                  const selected = myVoteIndex === idx;
                                  const isWinner = winnerIndex === idx;
                                  const pct = voteTotal > 0 ? Math.round((voteCounts[idx] / voteTotal) * 100) : 0;
                                  return (
                                    <button
                                      key={`${msg?.id || 'poll'}-opt-${idx}`}
                                      onClick={() => voteOnChatPoll(msg, idx)}
                                      disabled={Boolean(poll.resolved)}
                                      className={`w-full text-left px-2.5 py-1.5 rounded-lg border transition-colors ${mine
                                        ? (selected ? 'bg-white border-indigo-300 text-gray-900' : 'bg-white border-gray-200 text-gray-900 hover:border-indigo-300')
                                        : (selected ? 'bg-white dark:bg-gray-800 border-indigo-300 dark:border-indigo-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700')
                                      } ${poll.resolved ? 'cursor-default opacity-90' : ''}`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="truncate min-w-0">{idx + 1}. {opt}</span>
                                        <span className={`text-[11px] shrink-0 ${mine ? 'text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                                          {voteCounts[idx]} vote{voteCounts[idx] === 1 ? '' : 's'} ({pct}%)
                                        </span>
                                      </div>
                                      {isWinner && <div className={`mt-1 text-[10px] ${mine ? 'text-gray-700' : 'text-gray-600 dark:text-gray-400'}`}>Majority reached</div>}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                          <div className={`text-[10px] mt-1 ${mine ? 'text-indigo-100/90' : 'text-gray-400 dark:text-gray-500'}`}>
                            {poll.resolved ? 'Voting complete. Event added to calendar.' : 'Vote to reach majority in each selected section.'}
                          </div>
                        </div>
                      ) : popupInvite ? (
                        <div className={`${mine ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                          <div className={`rounded-lg border px-3 py-2 ${mine ? 'border-indigo-200/70 bg-indigo-500/35' : 'border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20'}`}>
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1 ${mine ? 'bg-indigo-400/40 text-indigo-100' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'}`}>
                              Pop-up Event
                            </div>
                            <div className="font-semibold">📌 {popupInvite.title}</div>
                            <div className={`text-[11px] mt-0.5 ${mine ? 'text-indigo-100/90' : 'text-gray-600 dark:text-gray-300'}`}>
                              {formatDateKeyMMDDYYYY(popupInvite.dateKey)}{popupInvite.time ? ` at ${formatTime(popupInvite.time)}` : ''}
                            </div>
                            {popupInvite.location && (
                              <div className={`text-[11px] mt-0.5 ${mine ? 'text-indigo-100/90' : 'text-gray-600 dark:text-gray-300'}`}>
                                📍 {popupInvite.location}
                              </div>
                            )}
                            {(() => {
                              const popupMeta = popupEventsByEventId[String(popupInvite.eventId || '')] || null;
                              const popupSignups = popupMeta ? (popupSignupsByEventId[String(popupInvite.eventId || '')] || []) : [];
                              const noMax = popupMeta ? Number(popupMeta.maxPeople || 0) >= POPUP_NO_MAX_SENTINEL : Boolean(popupInvite.noMax);
                              const maxPeople = popupMeta ? Number(popupMeta.maxPeople || 0) : Number(popupInvite.maxPeople || 0);
                              const popupUnavailable = !popupMeta;
                              const joined = popupSignups.some((row) => String(row?.userId || '') === String(user?.id || ''));
                              const full = noMax ? false : (popupSignups.length >= maxPeople);
                              return (
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <div className={`text-[11px] ${mine ? 'text-indigo-100/90' : 'text-purple-700 dark:text-purple-300'}`}>
                                    {popupUnavailable
                                      ? 'This event is no longer available.'
                                      : `${popupSignups.length}${noMax ? ' joined (no max)' : `/${maxPeople} spots`}`}
                                  </div>
                                  {popupUnavailable ? (
                                    <button
                                      disabled
                                      className={`px-2 py-1 text-[11px] rounded-md border opacity-70 cursor-not-allowed ${mine ? 'border-indigo-200/70 bg-indigo-500/30 text-indigo-100' : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                                    >
                                      Unavailable
                                    </button>
                                  ) : joined ? (
                                    <button
                                      onClick={() => leavePopupEvent(popupInvite.eventId)}
                                      className={`px-2 py-1 text-[11px] rounded-md border ${mine ? 'border-indigo-200/70 bg-indigo-500/40 text-white' : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-200'}`}
                                    >
                                      Leave
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => joinPopupEvent(popupInvite.eventId, {
                                        maxPeople: popupInvite.maxPeople,
                                        noMax: popupInvite.noMax,
                                        dateKey: popupInvite.dateKey,
                                      })}
                                      disabled={full}
                                      className={`px-2 py-1 text-[11px] rounded-md border disabled:opacity-50 ${mine ? 'border-indigo-200/70 bg-indigo-500/40 text-white' : 'border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300'}`}
                                    >
                                      {full ? 'Full' : 'Join'}
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div>{displayText}</div>
                      )}
                      {Object.keys(chatReactions).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {Object.entries(chatReactions).map(([emoji, users]) => (
                            <button
                              key={`${messageId}-rx-${emoji}`}
                              onClick={() => reactToChatMessage(msg, emoji)}
                              className={`px-1.5 py-0.5 rounded-full text-[11px] border ${mine ? 'border-indigo-200/70 bg-indigo-500/40 text-white' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                            >
                              {emoji} {Array.isArray(users) ? users.length : 0}
                            </button>
                          ))}
                        </div>
                      )}
                      {chatReactionPickerFor === messageId && !isDeletedChatMessage(msg?.message) && (
                        <div data-chat-reaction-picker="true" className={`mt-1.5 max-w-full min-h-[2.5rem] rounded-full border px-2 py-1.5 ${mine ? 'border-indigo-200/70 bg-indigo-500/45' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'}`}>
                          <div className="flex items-center gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap pr-0.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
                          {CHAT_REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={`${messageId}-picker-${emoji}`}
                              onClick={() => reactToChatMessage(msg, emoji)}
                              className="shrink-0 text-lg leading-none p-0.5 hover:scale-110 transition-transform"
                              title={`React ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                          </div>
                        </div>
                      )}
                      <div className={`text-[10px] mt-1 ${mine ? 'text-indigo-100/90' : 'text-gray-400 dark:text-gray-500'}`}>{msg?.created_at ? new Date(msg.created_at).toLocaleString() : ''}</div>
                    </div>
                  );
                })
              )}
            </div>

            {chatError && <p className="mt-2 text-xs text-red-500">{chatError}</p>}

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setPollComposerStep('menu');
                  setPollQuestionInput('');
                  setPollDateInput(getDateKey(selectedDate || new Date()));
                  setPollOptionInputs(['', '']);
                  setPopupDraftTitle('');
                  setPopupDraftDate(getDateKey(selectedDate || new Date()));
                  setPopupDraftTime('');
                  setPopupDraftLocation('');
                  setPopupDraftMaxPeople('10');
                  setPopupDraftNoMaxPeople(false);
                  setShowCreateEventPopup(true);
                  if (chatError) setChatError('');
                }}
                className="w-10 h-10 shrink-0 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 text-xl leading-none"
                title="Create an event vote"
                aria-label="Create an event vote"
              >
                +
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => { setChatInput(e.target.value); if (chatError) setChatError(''); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendCalendarChatMessage();
                  }
                }}
                placeholder="Send a message to this calendar..."
                className="flex-1 px-3 py-2 border dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2"
                style={{ borderColor: themeAccentBorder }}
              />
              <button
                onClick={sendCalendarChatMessage}
                disabled={!chatInput.trim()}
                className="px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={themeAccentButtonStyle}
              >
                Send
              </button>
            </div>

            {showCreateEventPopup && (
              <div className="fixed inset-0 z-[70] bg-black/45 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl border bg-white dark:bg-gray-800 p-4 shadow-2xl" style={{ borderColor: themeAccentBorder }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold" style={themeAccentHeadingStyle}>
                      {pollComposerStep === 'menu'
                        ? 'Create'
                        : pollComposerStep === 'when'
                          ? 'When is the event?'
                          : pollComposerStep === 'what'
                            ? 'What is the event?'
                            : pollComposerStep === 'popup'
                              ? 'Create pop-up event'
                              : 'Poll options'}
                    </h4>
                    <button
                      onClick={resetPollComposer}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>

                  {pollComposerStep === 'menu' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setPollComposerStep('when')}
                        className="w-full px-3 py-3 rounded-xl border text-left transition-colors"
                        style={{ borderColor: themeAccentBorder, backgroundColor: themeAccentSofterBg }}
                      >
                        <div className="text-sm font-semibold" style={themeAccentHeadingStyle}>🗳️ Create an event poll</div>
                        <div className="text-xs mt-0.5" style={themeAccentTextStyle}>Ask members to vote, then auto-add the winner.</div>
                      </button>
                      <button
                        onClick={() => setPollComposerStep('popup')}
                        className="w-full px-3 py-3 rounded-xl border border-rose-200 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 text-left hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                      >
                        <div className="text-sm font-semibold text-rose-700 dark:text-rose-300">🎟️ Create a pop-up event</div>
                        <div className="text-xs text-rose-700/90 dark:text-rose-300/90 mt-0.5">First come, first served with max headcount.</div>
                      </button>
                    </div>
                  )}

                  {pollComposerStep === 'popup' && (
                    <div className="space-y-3">
                      <input
                        autoFocus
                        type="text"
                        value={popupDraftTitle}
                        onChange={(e) => setPopupDraftTitle(e.target.value)}
                        placeholder="What's the event? (e.g. Pickup basketball)"
                        className="w-full px-3 py-2 text-sm border border-rose-200 dark:border-rose-700 bg-white/90 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-400"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0 overflow-hidden">
                        <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-rose-200 dark:border-rose-700 bg-white/90 dark:bg-gray-800">
                          <input
                            type="date"
                            value={popupDraftDate}
                            onChange={(e) => setPopupDraftDate(e.target.value)}
                            className="block w-full min-w-0 max-w-full px-3 py-2 text-sm bg-transparent dark:text-white"
                            style={{ width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', WebkitAppearance: 'none' }}
                          />
                        </div>
                        <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-rose-200 dark:border-rose-700 bg-white/90 dark:bg-gray-800">
                          <input
                            type="time"
                            value={popupDraftTime}
                            onChange={(e) => setPopupDraftTime(e.target.value)}
                            className="block w-full min-w-0 max-w-full px-3 py-2 text-sm bg-transparent dark:text-white"
                            style={{ width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <PlacesAutocomplete
                        value={popupDraftLocation}
                        onSelect={(val) => setPopupDraftLocation(val || '')}
                        placeholder="📍 Location (optional)"
                        className="w-full px-3 py-2 text-sm border border-rose-200 dark:border-rose-700 bg-white/90 dark:bg-gray-800 dark:text-white rounded-xl"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Max people</label>
                        <input
                          type="number"
                          min="1"
                          value={popupDraftMaxPeople}
                          onChange={(e) => setPopupDraftMaxPeople(e.target.value)}
                          disabled={popupDraftNoMaxPeople}
                          className="w-24 px-2 py-1.5 text-sm border border-rose-200 dark:border-rose-700 bg-white/90 dark:bg-gray-800 dark:text-white rounded-lg"
                        />
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={popupDraftNoMaxPeople}
                            onChange={(e) => setPopupDraftNoMaxPeople(e.target.checked)}
                            className="rounded"
                          />
                          No max
                        </label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setPollComposerStep('menu')}
                          className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                        >
                          Back
                        </button>
                        <button
                          onClick={createPopupEventFromChat}
                          className="px-3 py-2 text-sm rounded-xl bg-rose-600 text-white font-semibold"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  )}

                  {pollComposerStep === 'when' && (
                    <div className="space-y-3 min-w-0 overflow-hidden">
                      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border bg-white/90 dark:bg-gray-800" style={{ borderColor: themeAccentBorder }}>
                        <input
                          autoFocus
                          type="date"
                          value={pollDateInput}
                          onChange={(e) => setPollDateInput(e.target.value)}
                          className="block w-full min-w-0 max-w-full px-3 py-2 text-sm bg-transparent dark:text-white focus:ring-2 outline-none"
                          style={{ width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', WebkitAppearance: 'none' }}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setPollComposerStep('menu')}
                          className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => {
                            if (!pollDateInput || !/^\d{4}-\d{2}-\d{2}$/.test(pollDateInput)) {
                              setChatError('Pick a valid event date.');
                              return;
                            }
                            setChatError('');
                            setPollComposerStep('what');
                          }}
                          className="px-3 py-2 text-sm rounded-xl font-semibold"
                          style={themeAccentButtonStyle}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {pollComposerStep === 'what' && (
                    <div className="space-y-3">
                      <input
                        autoFocus
                        type="text"
                        value={pollQuestionInput}
                        onChange={(e) => setPollQuestionInput(e.target.value)}
                        placeholder="What's the event? (e.g. Team lunch)"
                        className="w-full px-3 py-2 text-sm border bg-white/90 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2"
                        style={{ borderColor: themeAccentBorder }}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setPollComposerStep('when')}
                          className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => {
                            if (!pollQuestionInput.trim()) {
                              setChatError('Add the event name first.');
                              return;
                            }
                            setChatError('');
                            setPollComposerStep('structured');
                          }}
                          className="px-3 py-2 text-sm rounded-xl font-semibold"
                          style={themeAccentButtonStyle}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {pollComposerStep === 'structured' && (
                    <div className="space-y-3">
                      <div className="px-1">
                        <div className="text-sm sm:text-base font-semibold" style={themeAccentHeadingStyle}>
                          {pollQuestionInput || 'Event'}
                        </div>
                        <div className="text-xs sm:text-sm" style={themeAccentTextStyle}>
                          {formatDateKeyMMDDYYYY(pollDateInput || getDateKey(selectedDate || new Date()))}
                        </div>
                      </div>
                      {pollOptionInputs.map((opt, idx) => (
                        <div key={`poll-option-${idx}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const next = [...pollOptionInputs];
                              next[idx] = e.target.value;
                              setPollOptionInputs(next);
                            }}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 px-3 py-2 text-xs sm:text-sm border bg-white/90 dark:bg-gray-800 dark:text-white rounded-xl"
                            style={{ borderColor: themeAccentBorder }}
                          />
                          {pollOptionInputs.length > 2 && (
                            <button
                              onClick={() => setPollOptionInputs(prev => prev.filter((_, i) => i !== idx))}
                              className="px-2.5 py-2 text-xs rounded-lg border border-rose-200 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => setPollOptionInputs(prev => prev.length >= 8 ? prev : [...prev, ''])}
                        className="text-xs px-2.5 py-1.5 rounded-lg border"
                        style={themeAccentSoftButtonStyle}
                      >
                        + Add option
                      </button>

                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={() => setPollComposerStep('what')}
                          className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                        >
                          Back
                        </button>
                        <button
                          onClick={sendCalendarChatPollMessage}
                          className="px-3 py-2 text-sm rounded-xl font-semibold"
                          style={themeAccentButtonStyle}
                        >
                          Post vote
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {showListPanel && (
          <div
            ref={listPanelRef}
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-5 mb-6 border dark:border-gray-700 transition-all ${
              listPanelAttention ? 'ring-2' : ''
            }`}
            style={listPanelAttention ? { borderColor: themeAccentBorder, boxShadow: `0 0 0 2px ${themeAccentBorder}` } : { borderColor: themeAccentBorder }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold" style={themeAccentHeadingStyle}>Shared Lists</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Clean space for groceries, reminders, and quick to-dos.</p>
              </div>
              <button onClick={() => setShowListPanel(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div
              className={`p-3 rounded-xl border mb-3 ${useLegacyEllieMilesTheme ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 border-purple-100 dark:border-gray-600' : ''}`}
              style={useLegacyEllieMilesTheme ? undefined : { backgroundColor: themeAccentSofterBg, borderColor: themeAccentBorder }}
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newSharedListTitle}
                  onChange={(e) => setNewSharedListTitle(e.target.value)}
                  placeholder="Create new list title"
                  className={`flex-1 px-3 py-2 text-base sm:text-sm border dark:bg-gray-800 dark:text-white rounded-lg focus:ring-1 ${useLegacyEllieMilesTheme ? 'border-gray-200 dark:border-gray-600 focus:ring-purple-400' : ''}`}
                  style={useLegacyEllieMilesTheme ? { fontSize: '16px' } : { fontSize: '16px', borderColor: themeAccentBorder }}
                  onKeyPress={(e) => e.key === 'Enter' && createSharedList()}
                />
                <button
                  onClick={createSharedList}
                  className="px-3 py-2 text-sm text-white rounded-lg hover:shadow-lg transition-all"
                  style={themeAccentButtonStyle}
                  title="Create list"
                >
                  Create
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-2">
              {sharedListGroups.map(group => (
                editingListGroupId === group.id ? (
                  <div key={group.id} className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full border bg-white dark:bg-gray-700" style={{ borderColor: themeAccentBorder }}>
                    <input
                      autoFocus
                      value={editingListGroupTitle}
                      onChange={(e) => setEditingListGroupTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitEditingListGroup();
                        if (e.key === 'Escape') cancelEditingListGroup();
                      }}
                      onBlur={submitEditingListGroup}
                      className="w-36 px-2 py-1 text-base sm:text-xs border rounded-md bg-white dark:bg-gray-800 dark:text-white"
                      style={{ fontSize: '16px', borderColor: themeAccentBorder }}
                    />
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={submitEditingListGroup}
                      className="px-2 py-1 text-[11px] rounded-md"
                      style={themeAccentButtonStyle}
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
                        ? 'text-white border-transparent'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                    }`}
                    style={selectedSharedListId === group.id ? themeAccentButtonStyle : undefined}
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
                className="flex-1 px-3 py-2 text-base sm:text-sm border dark:bg-gray-700 dark:text-white rounded-lg focus:ring-1"
                style={{ fontSize: '16px', borderColor: themeAccentBorder }}
                onKeyPress={(e) => e.key === 'Enter' && addSharedListItem()}
                disabled={!selectedSharedListId}
              />
              <button
                onClick={addSharedListItem}
                className="px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50"
                style={themeAccentButtonStyle}
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
                      className="flex-1 text-sm px-2 py-1 border dark:bg-gray-800 dark:text-white rounded-md focus:ring-1"
                      style={{ borderColor: themeAccentBorder }}
                    />
                  ) : (
                    <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {item.text}
                    </span>
                  )}
                  {editingListItemId !== item.id && (
                    <button
                      onClick={() => startEditingListItem(item)}
                      className="p-1 rounded-lg"
                      style={themeAccentSoftButtonStyle}
                      title="Edit item"
                    >
                      <Edit2 className="w-3.5 h-3.5" style={themeAccentTextStyle} />
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
                            className="flex-1 text-sm px-2 py-1 border dark:bg-gray-800 dark:text-white rounded-md focus:ring-1"
                            style={{ borderColor: themeAccentBorder }}
                          />
                        ) : (
                          <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                            {item.text}
                          </span>
                        )}
                        {editingListItemId !== item.id && (
                          <button
                            onClick={() => startEditingListItem(item)}
                            className="p-1 rounded-lg"
                            style={themeAccentSoftButtonStyle}
                            title="Edit item"
                          >
                            <Edit2 className="w-3.5 h-3.5" style={themeAccentTextStyle} />
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
              <h3 className="text-xl font-semibold" style={themeAccentHeadingStyle}>Manage Categories</h3>
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
                  className="flex-1 px-3 py-2 text-base sm:text-sm border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-400"
                  style={{ fontSize: '16px' }}
                />
                  <button onClick={handleAddCategory} className="px-4 py-2 rounded-lg" style={themeAccentButtonStyle}>
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
                        className="w-full px-2 py-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-base sm:text-sm"
                        style={{ fontSize: '16px' }}
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
              <h3 className="text-base sm:text-lg font-semibold" style={themeAccentHeadingStyle}>Today At A Glance</h3>
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setSelectedDates([]);
                  setShowDateDetailModal(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  useLegacyEllieMilesTheme
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60'
                    : 'text-white hover:shadow-lg'
                }`}
                style={useLegacyEllieMilesTheme ? undefined : themeAccentButtonStyle}
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
                        {event.isUrgent && <span className="text-xs">??</span>}
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
                          <span className="text-xl">🧳</span>
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
                  aria-label="Close tip"
                  className="absolute top-2 right-2 text-purple-400 hover:text-purple-600 dark:text-purple-500 dark:hover:text-purple-300 leading-none"
                >
                  <X className="w-4 h-4" />
                </button>
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

            {calendarView === 'agenda' && (
              <div className="mb-3 rounded-xl border p-2.5 space-y-2 dark:bg-gray-700/40" style={{ borderColor: themeAccentBorder, backgroundColor: themeAccentSofterBg }}>
                <div className="flex gap-2 overflow-x-auto">
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setAgendaRangeDays(days)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                        agendaRangeDays === days
                          ? ''
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border'
                        }`}
                        style={agendaRangeDays === days ? themeAccentButtonStyle : { borderColor: themeAccentBorder }}
                      >
                      Next {days}d
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={agendaSearchQuery}
                  onChange={(e) => setAgendaSearchQuery(e.target.value)}
                  placeholder="Search agenda (title, location, category)"
                  className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                  style={{ borderColor: themeAccentBorder }}
                />
              </div>
            )}

            {/* Day headers */}
            {calendarView !== 'agenda' && (
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-200 py-1">{day}</div>
              ))}
            </div>
            )}

            {calendarView === 'month' ? (
              /* -- MONTH VIEW -- */
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
                          ${isInSelection ? `text-white shadow-lg scale-105 ring-2 ${useLegacyEllieMilesTheme ? 'bg-gradient-to-br from-purple-400 to-indigo-400 ring-purple-300' : ''}` : ''}
                          ${isSelected && !isInSelection ? `text-white shadow-lg scale-105 ${useLegacyEllieMilesTheme ? 'bg-gradient-to-br from-purple-500 to-indigo-500' : ''}` : ''}
                          ${!isInSelection && !isSelected && isTodayDate && !hasUrgentEvent ? `${useLegacyEllieMilesTheme ? 'bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-900/50 dark:to-purple-900/50 ring-2 ring-purple-400' : 'ring-2'}` : ''}
                          ${!isInSelection && !isSelected && !isTodayDate && !hasUrgentEvent ? 'text-gray-700 dark:text-gray-100 dark:hover:bg-gray-600' : ''}
                          ${hasUrgentEvent && !isSelected && !isInSelection ? 'bg-red-50 dark:bg-red-900/30' : ''}
                        `}
                        style={{
                          zIndex: 10,
                          ...(isInSelection || isSelected) && !useLegacyEllieMilesTheme ? themeSelectedSurfaceStyle : {},
                          ...(!isInSelection && !isSelected && isTodayDate && !hasUrgentEvent && !useLegacyEllieMilesTheme
                            ? { ...themeTodaySurfaceStyle, borderWidth: 0, boxShadow: `inset 0 0 0 2px ${themeAccentBorder}` }
                            : {}),
                          ...(!isInSelection && !isSelected && !isTodayDate && !hasUrgentEvent
                            ? { '--theme-hover-bg': themeAccentSofterBg }
                            : {}),
                        }}
                      >
                        {hasSubCalendarRange && (
                          <div
                            className="absolute bottom-0 left-0.5 right-0.5 h-1 rounded-t bg-gradient-to-r from-emerald-300 to-green-500 opacity-90"
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
                            <span className="absolute top-0.5 right-0.5 text-xs">🎉</span>
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
                            {[...new Set(dateEvents.filter(shouldShowCategoryDot).map(e => e.category || 'other'))].slice(0, 2).map((cat, i) => (
                              <div key={i} className={`w-1 h-1 rounded-full ${isSelected || isInSelection ? 'bg-white' : categories[cat]?.color || 'bg-gray-500'}`} />
                            ))}
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : calendarView === 'week' ? (
              /* -- WEEK VIEW -- */
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
                        ${isSelected ? `text-white shadow-lg ring-2 ${useLegacyEllieMilesTheme ? 'bg-gradient-to-br from-purple-500 to-indigo-500 ring-purple-300' : ''}` : ''}
                        ${!isSelected && isTodayDate ? `${useLegacyEllieMilesTheme ? 'bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-900/50 dark:to-purple-900/50 ring-2 ring-purple-400' : 'ring-2'}` : ''}
                        ${!isSelected && !isTodayDate ? 'bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600' : ''}
                        ${hasUrgentEvent && !isSelected ? 'ring-2 ring-red-500' : ''}
                      `}
                      style={{
                        ...(isSelected && !useLegacyEllieMilesTheme ? themeSelectedSurfaceStyle : {}),
                        ...(!isSelected && isTodayDate && !useLegacyEllieMilesTheme ? { ...themeTodaySurfaceStyle, boxShadow: `inset 0 0 0 2px ${themeAccentBorder}` } : {}),
                        ...(!isSelected && !isTodayDate ? { '--theme-hover-bg': themeAccentSofterBg } : {}),
                      }}
                      >
                      {hasSubCalendarRange && (
                        <div
                          className={`absolute bottom-0 left-1 right-1 h-1 rounded-t ${isSelected ? 'bg-white/70' : 'bg-gradient-to-r from-emerald-300 to-green-500 opacity-90'}`}
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
                        {hasHoliday && <span className="ml-1">🎉</span>}
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
                              🎉 {event.title}
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
            ) : (
              /* -- AGENDA VIEW -- */
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {agendaItems.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">No agenda items in this range.</div>
                ) : (
                  (() => {
                    let lastDateKey = '';
                    return agendaItems.map((event) => {
                      const dk = String(event?.date || event?.dateKey || '');
                      const showHeader = dk !== lastDateKey;
                      lastDateKey = dk;
                      const category = categories[event.category || 'other'] || categories.other;
                      const dateObj = new Date(`${dk}T00:00:00`);
                      return (
                        <div key={`${event.id}-${dk}-${event.time || 'all-day'}`}>
                          {showHeader && (
                            <div className="sticky top-0 z-10 -mx-1 px-2 py-1 rounded-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur border text-xs font-semibold mb-1" style={{ borderColor: themeAccentBorder, color: activeLayerPageTheme.accent }}>
                              {Number.isNaN(dateObj.getTime())
                                ? dk
                                : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          )}
                          <button
                            onClick={() => openAgendaItem(event)}
                            className={`w-full text-left rounded-xl border p-2.5 mb-1 transition-all hover:shadow ${event.isHoliday ? 'bg-red-50 dark:bg-red-900/25 border-red-200 dark:border-red-800' : `${category.lightBg} dark:bg-gray-700 ${category.border}`}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {!event.isHoliday && <span className={`w-2 h-2 rounded-full shrink-0 ${category.color}`} />}
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{event.title}</span>
                                  {event.isUrgent && <span className="text-xs">!</span>}
                                </div>
                                {event.location && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">Location: {event.location}</div>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                                {event.time ? formatTime(event.time) : 'All day'}
                              </span>
                            </div>
                          </button>
                        </div>
                      );
                    });
                  })()
                )}
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
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorY: 'contain',
              touchAction: 'pan-y',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={themeAccentHeadingStyle}>Date Details</h3>
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
                <div className="p-4 rounded-xl border-2" style={{ ...themeTodaySurfaceStyle, borderColor: themeAccentBorder }}>
                  <h3 className="text-xl font-semibold mb-2" style={themeAccentHeadingStyle}>Multi-Day Selection</h3>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium" style={themeAccentTextStyle}>
                      {selectedDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {selectedDates[selectedDates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <span className="px-2 py-1 text-white text-xs rounded-full" style={themeAccentButtonStyle}>{selectedDates.length} days</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedDates([])} className="text-xs underline font-medium" style={themeAccentTextStyle}>Clear selection</button>
                    <button
                      onClick={() => setShowSubCalendarModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                      style={themeAccentButtonStyle}
                    >
                      🗓️ Create Sub-Calendar
                    </button>
                  </div>
                </div>
              ) : (
                <h3 className="text-xl font-semibold mb-2" style={themeAccentHeadingStyle}>
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
                    isPrivate ? 'text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  style={isPrivate ? themeAccentButtonStyle : undefined}
                >
                  <Lock className="w-4 h-4" />
                  {isPrivate ? 'Private Event (Only You)' : 'Shared Event'}
                </button>
                <button
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={`w-full px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                    isUrgent ? 'text-white shadow-md animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  style={isUrgent ? themeAccentButtonStyle : undefined}
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
                    { value: 'once', label: '🕐 One-time' },
                    { value: 'weekly', label: '🔁 Weekly' },
                    { value: 'monthly', label: '🗓️ Monthly' },
                    { value: 'annual', label: '🎂 Annual' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setRecurrence(opt.value);
                      }}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        recurrence === opt.value
                          ? 'text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      style={recurrence === opt.value ? themeAccentButtonStyle : undefined}
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
                <button onClick={handleQuickAdd} className="px-4 py-2 text-white rounded-xl hover:shadow-lg transition-all" style={themeAccentButtonStyle}>
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsPopupEventDraft(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    isPopupEventDraft
                      ? 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-300'
                      : 'bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }`}
                >
                  {isPopupEventDraft ? 'Pop-up event: on' : 'Pop-up event'}
                </button>
                {isPopupEventDraft && (
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                    Max people
                    <input
                      type="number"
                      min="1"
                      value={popupEventMaxPeopleDraft}
                      onChange={(e) => setPopupEventMaxPeopleDraft(e.target.value)}
                      className="w-16 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </label>
                )}
              </div>
              {isPopupEventDraft && (
                <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-300">First come, first served signups will be enabled for this event.</p>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">No events for this day</div>
              ) : (
                selectedEvents.map(event => {
                  const popupMeta = popupEventsByEventId[String(event.id || '')] || null;
                  const effectiveCategoryKey = popupMeta ? 'popup_event' : (event.category || 'other');
                  const category = categories[effectiveCategoryKey] || categories.popup_event || categories.other;
                  const popupSignups = popupMeta ? (popupSignupsByEventId[String(event.id || '')] || []) : [];
                  const popupJoined = popupSignups.some((row) => String(row?.userId || '') === String(user?.id || ''));
                  const popupNoMax = popupMeta ? Number(popupMeta.maxPeople || 0) >= POPUP_NO_MAX_SENTINEL : false;
                  const popupFull = popupMeta ? (!popupNoMax && popupSignups.length >= Number(popupMeta.maxPeople || 1)) : false;

                  if (event.isHoliday) {
                    return (
                      <div key={event.id} className="bg-red-50 dark:bg-red-900/30 rounded-xl p-3 border-2 border-red-200 dark:border-red-700 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🎉</span>
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
                          <textarea
                            defaultValue={event.description || ''}
                            onBlur={(e) => handleUpdateEventField(event.date, event.id, { description: e.target.value })}
                            placeholder="Add description"
                            rows={3}
                            className="w-full px-2 py-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm resize-none"
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
                            🎂 Annual (repeats every year)
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
                                <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-200">
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
                            {event.description && (
                              <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap mb-1">
                                {event.description}
                              </div>
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
                            {popupMeta && (
                              <div className="mt-2 p-2 rounded-lg border border-rose-200 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                                    Pop-up event: {popupSignups.length}{popupNoMax ? ' joined (no max)' : `/${popupMeta.maxPeople} spots`}
                                  </div>
                                  {popupJoined ? (
                                    <button
                                      onClick={() => leavePopupEvent(event.id)}
                                      className="px-2 py-1 text-[11px] rounded-md border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200"
                                    >
                                      Leave
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => joinPopupEvent(event.id, { dateKey: event.date })}
                                      disabled={popupFull}
                                      className="px-2 py-1 text-[11px] rounded-md border border-rose-300 dark:border-rose-700 bg-white dark:bg-gray-800 text-rose-700 dark:text-rose-300 disabled:opacity-50"
                                    >
                                      {popupFull ? 'Full' : 'Join'}
                                    </button>
                                  )}
                                </div>
                                {popupSignups.length > 0 && (
                                  <div className="mt-1 text-[11px] text-rose-700/90 dark:text-rose-300/90 truncate">
                                    {popupSignups.map((row) => row.displayName || 'Member').join(', ')}
                                  </div>
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
                                {showReactionPicker === event.id ? '?' : '+'}
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
                                  openRecurringDeletePrompt({ dateKey: selectedDateKey, event });
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
                  <h3 className="text-lg sm:text-xl font-semibold mb-3" style={themeAccentHeadingStyle}>Calendars</h3>
                  {layers.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No calendars found.</div>
                  ) : (
                    <div className="space-y-4">
                      {[
                        { key: 'private', label: 'Private Calendars', items: orderedPrivateLayerCalendars },
                        { key: 'public', label: 'Public Calendars', items: orderedPublicLayerCalendars },
                      ].map((group) => {
                        const groupIds = group.items.map((layer) => String(layer?.id || ''));
                        return (
                          <div key={group.key}>
                            <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 mb-2">
                              {group.label}
                            </h4>
                            {group.items.length === 0 ? (
                              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 rounded-xl px-3 py-2">
                                No {group.key} calendars yet.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {group.items.map(layer => {
                                  const isActiveLayer = String(layer.id) === String(activeLayerId);
                                  const isOwnedLayer = String(layer?.owner_id) === String(user?.id);
                                  const isPublicLayer = Boolean(layer?.is_public);
                                  const rowNameKey = String(layer?.name || '')
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '');
                                  const useLegacyRowTheme = rowNameKey === 'elliemiles';
                                  const rowTheme = normalizeLayerPageTheme(layer?.page_theme, layer?.title_style);
                                  const rowAccentBorder = mixHexColors(rowTheme.accent, '#ffffff', darkMode ? 0.5 : 0.62);
                                  const rowSoftBg = mixHexColors(rowTheme.accent, '#ffffff', darkMode ? 0.78 : 0.82);
                                  const canDeleteLayer = isOwnedLayer && layers.length > 1;
                                  const canLeaveLayer = !isOwnedLayer;
                                  const canSwipeLayerAction = canDeleteLayer || canLeaveLayer;
                                  const layerRowOffset = layerSwipeDrag.id === layer.id ? layerSwipeDrag.offset : (swipedLayerId === layer.id ? -88 : 0);
                                  const isLayerActionRevealed = layerRowOffset < 0;
                                  return (
                                    <div
                                      key={layer.id}
                                      className="relative rounded-xl overflow-hidden"
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        handleDropActiveCalendar(String(layer.id), groupIds);
                                      }}
                                    >
                                      {canSwipeLayerAction && (
                                        <div className={`absolute inset-y-0 right-0 w-[88px] flex items-center justify-center transition-colors ${
                                          isLayerActionRevealed
                                            ? (canDeleteLayer ? 'bg-red-500' : 'bg-amber-500')
                                            : 'bg-transparent'
                                        }`}>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (canDeleteLayer) deleteLayerCalendar(layer.id);
                                              else if (canLeaveLayer) leaveSharedLayerCalendar(layer.id);
                                            }}
                                            className={`w-full h-full text-sm font-semibold transition-opacity ${isLayerActionRevealed ? 'text-white opacity-100' : 'text-transparent opacity-0 pointer-events-none'}`}
                                          >
                                            {canDeleteLayer ? 'Delete' : 'Leave'}
                                          </button>
                                        </div>
                                      )}
                                      <button
                                        draggable
                                        onDragStart={(e) => {
                                          try {
                                            e.dataTransfer.setData('text/plain', String(layer.id));
                                            e.dataTransfer.effectAllowed = 'move';
                                          } catch {}
                                          setDraggingActiveCalendarId(String(layer.id));
                                        }}
                                        onDragEnd={() => setDraggingActiveCalendarId(null)}
                                        onTouchStart={(e) => handleLayerSwipeStart(e, layer.id, canSwipeLayerAction)}
                                        onTouchMove={handleLayerSwipeMove}
                                        onTouchEnd={handleLayerSwipeEnd}
                                        onTouchCancel={handleLayerSwipeEnd}
                                        onClick={() => {
                                          setActiveLayerId(layer.id);
                                          if (user?.id) localStorage.setItem(`active-layer-${user.id}`, layer.id);
                                          setBottomNavTab('home');
                                          setShowDateDetailModal(false);
                                        }}
                                        className={`relative z-10 w-full text-left p-3 rounded-xl border transition-all ${
                                          isActiveLayer
                                            ? (useLegacyRowTheme ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : '')
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                        }`}
                                        style={{
                                          transform: `translateX(${layerRowOffset}px)`,
                                          transition: layerSwipeDrag.id === layer.id ? 'none' : 'transform 180ms ease',
                                          ...(isActiveLayer && !useLegacyRowTheme
                                            ? { borderColor: rowAccentBorder, backgroundColor: rowSoftBg }
                                            : {}),
                                        }}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="min-w-0">
                                            <div className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{layer.name || 'Calendar'}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                              {isOwnedLayer
                                                ? 'Owned by you'
                                                : `Shared by ${sharedOwnerLabels[String(layer?.owner_id || '')] || fallbackOwnerLabel(layer?.owner_id)}`}
                                            </div>
                                            {isOwnedLayer && (
                                              <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                {isPublicLayer ? 'Public in Explore' : 'Private calendar'}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <span
                                              onClick={(e) => e.stopPropagation()}
                                              title="Drag to reorder"
                                              className="inline-flex select-none cursor-grab active:cursor-grabbing items-center justify-center px-1 py-0.5 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                              ⋮⋮
                                            </span>
                                            {isActiveLayer && (
                                              <span
                                                className="text-[10px] font-semibold px-2 py-1 rounded-full"
                                                style={{
                                                  backgroundColor: useLegacyRowTheme ? '#6366f1' : rowTheme.accent,
                                                  color: useLegacyRowTheme ? '#ffffff' : (isLightHexColor(rowTheme.accent) ? '#111111' : '#ffffff'),
                                                }}
                                              >
                                                Active
                                              </span>
                                            )}
                                            {isOwnedLayer && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openPublishLayerModal(layer);
                                                }}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                                                  isPublicLayer
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                                title={isPublicLayer ? 'Edit public settings' : 'Publish to Explore'}
                                              >
                                                {isPublicLayer ? 'Edit Public' : 'Publish'}
                                              </button>
                                            )}
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
                                            {canLeaveLayer && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  leaveSharedLayerCalendar(layer.id);
                                                }}
                                                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-medium"
                                                title="Leave shared calendar"
                                              >
                                                Leave
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button
                    onClick={() => setShowLayerModal(true)}
                    className="mt-3 w-full px-3 py-2 rounded-lg text-white text-sm font-semibold hover:shadow-lg transition-all"
                    style={themeAccentButtonStyle}
                  >
                    + New Calendar
                  </button>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-wide font-semibold text-green-600 dark:text-green-400 mb-2">Upcoming Itineraries</h4>
                  {orderedUpcomingTrips.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No upcoming itineraries yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {orderedUpcomingTrips.map(sc => {
                      const canDelete = sc.owner_id === user?.id;
                      const rowOffset = tripSwipeDrag.id === sc.id ? tripSwipeDrag.offset : (swipedTripId === sc.id ? -88 : 0);
                      const isDeleteRevealed = rowOffset < 0;
                      return (
                        <div
                          key={sc.id}
                          className="relative rounded-xl overflow-hidden ring-1 ring-inset ring-green-200 dark:ring-green-700"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDropUpcomingTrip(String(sc.id));
                          }}
                        >
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
                            draggable
                            onDragStart={(e) => {
                              try {
                                e.dataTransfer.setData('text/plain', String(sc.id));
                                e.dataTransfer.effectAllowed = 'move';
                              } catch {}
                              setDraggingUpcomingTripId(String(sc.id));
                            }}
                            onDragEnd={() => setDraggingUpcomingTripId(null)}
                            onTouchStart={(e) => handleTripSwipeStart(e, sc.id, canDelete)}
                            onTouchMove={handleTripSwipeMove}
                            onTouchEnd={handleTripSwipeEnd}
                            onTouchCancel={handleTripSwipeEnd}
                            className="relative z-10 flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                            style={{ transform: `translateX(${rowOffset}px)`, transition: tripSwipeDrag.id === sc.id ? 'none' : 'transform 180ms ease' }}
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{sc.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTripDate(getSubCalStartRaw(sc))} - {formatTripDate(getSubCalEndRaw(sc), true)}
                              </div>
                            </div>
                            <div className="ml-3 flex items-center gap-2 shrink-0">
                              <span
                                title="Drag to reorder"
                                className="inline-flex select-none cursor-grab active:cursor-grabbing items-center justify-center px-1 py-0.5 rounded text-green-500/80 dark:text-green-300/80 hover:text-green-700 dark:hover:text-green-200"
                              >
                                ⋮⋮
                              </span>
                              <button
                                onClick={() => openSubCalendar(sc)}
                                className="px-3 py-1.5 text-xs rounded-lg bg-green-500 hover:bg-green-600 text-white"
                              >
                                Open
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  )}
                </div>
                <div className="mt-5">
                  <h4 className="text-xs uppercase tracking-wide font-semibold text-rose-600 dark:text-rose-400 mb-2">Upcoming Pop-up Events</h4>
                  {orderedUpcomingPopupEvents.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No upcoming pop-up events yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {orderedUpcomingPopupEvents.slice(0, 8).map((event) => {
                        const popupMeta = popupEventsByEventId[String(event.id || '')] || null;
                        const signups = popupSignupsByEventId[String(event.id || '')] || [];
                        const joinedCount = signups.length;
                        const noMax = popupMeta ? Number(popupMeta.maxPeople || 0) >= POPUP_NO_MAX_SENTINEL : false;
                        const maxLabel = noMax ? 'No max' : `${Number(popupMeta?.maxPeople || 0)} max`;
                        return (
                          <div
                            key={`upcoming-popup-${event.id}`}
                            className="rounded-xl p-3 ring-1 ring-inset ring-rose-200 dark:ring-rose-700 bg-rose-50/70 dark:bg-rose-900/20"
                            draggable
                            onDragStart={(e) => {
                              try {
                                e.dataTransfer.setData('text/plain', String(event.id || ''));
                                e.dataTransfer.effectAllowed = 'move';
                              } catch {}
                              setDraggingUpcomingPopupId(String(event.id || ''));
                            }}
                            onDragEnd={() => setDraggingUpcomingPopupId(null)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleDropUpcomingPopup(String(event.id || ''));
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">📌 {event.title}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                  {formatDateKeyMMDDYYYY(event.date || event.dateKey)}{event.time ? ` at ${formatTime(event.time)}` : ''}
                                </div>
                                {event.location && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">📍 {event.location}</div>
                                )}
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                  {joinedCount} joined · {maxLabel}
                                </div>
                              </div>
                              <div className="shrink-0 ml-2 flex items-center gap-2">
                                <span
                                  title="Drag to reorder"
                                  className="inline-flex select-none cursor-grab active:cursor-grabbing items-center justify-center px-1 py-0.5 rounded text-rose-500/80 dark:text-rose-300/80 hover:text-rose-700 dark:hover:text-rose-200"
                                >
                                  ⋮⋮
                                </span>
                                <button
                                  onClick={() => focusOnPopupEventDate(event.id, event.date || event.dateKey)}
                                  className="px-3 py-1.5 text-xs rounded-lg bg-rose-500 hover:bg-rose-600 text-white"
                                >
                                  Open
                                </button>
                              </div>
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
                <h3 className="text-lg sm:text-xl font-semibold mb-3" style={themeAccentHeadingStyle}>Archived Trips</h3>
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
                               className="ml-3 px-3 py-1.5 text-xs rounded-lg text-white hover:shadow-lg transition-all"
                               style={themeAccentButtonStyle}
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

            {bottomNavTab === 'explore' && (
              <>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-lg sm:text-xl font-semibold" style={themeAccentHeadingStyle}>Explore Calendars</h3>
                  <button
                    onClick={loadPublicCalendars}
                    className="px-3 py-1.5 text-xs rounded-lg transition-all"
                    style={themeAccentSoftButtonStyle}
                  >
                    Refresh
                  </button>
                </div>
                <input
                  type="text"
                  value={exploreSearch}
                  onChange={(e) => setExploreSearch(e.target.value)}
                  placeholder="Search by name, tag, or description"
                  className="w-full px-3 py-2 mb-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                />
                {exploreLoading && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading public calendars...</div>
                )}
                {!exploreLoading && exploreError && (
                  <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">{exploreError}</div>
                )}
                {!exploreLoading && !exploreError && filteredPublicCalendars.length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No public calendars found yet.</div>
                )}
                {!exploreLoading && !exploreError && filteredPublicCalendars.length > 0 && (
                  <div className="space-y-2">
                    {filteredPublicCalendars.map((row) => {
                      const layerId = String(row?.id || '');
                      const isOwner = String(row?.owner_id || '') === String(user?.id || '');
                      const joinedLayer = (layers || []).find((layer) => String(layer?.id || '') === layerId);
                      const isJoined = Boolean(joinedLayer);
                      const ownerLabel = String(row?.created_by || sharedOwnerLabels[String(row?.owner_id || '')] || fallbackOwnerLabel(row?.owner_id) || 'Creator');
                      const tags = Array.isArray(row?.public_tags) ? row.public_tags : [];
                      const description = String(row?.public_description || '').trim();
                      const isExpanded = Boolean(expandedExploreDescriptions[layerId]);
                      return (
                        <div
                          key={`explore-${layerId}`}
                          className="rounded-xl border p-3"
                          style={{ borderColor: themeAccentBorder, backgroundColor: themeAccentSofterBg }}
                        >
                          <div className="min-w-0">
                              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{row?.name || 'Public Calendar'}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                by {ownerLabel} · {Math.max(1, Number(row?.member_count || 0) + 1)} member{Math.max(1, Number(row?.member_count || 0) + 1) === 1 ? '' : 's'}
                              </div>
                              {description && (
                                <div className="mt-1">
                                  {!isExpanded && (
                                      <button
                                        onClick={() => setExpandedExploreDescriptions(prev => ({ ...prev, [layerId]: true }))}
                                        className="text-[11px] font-medium hover:underline"
                                        style={themeAccentTextStyle}
                                      >
                                        Show description
                                      </button>
                                  )}
                                  {isExpanded && (
                                    <>
                                      <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {description}
                                      </div>
                                      <button
                                        onClick={() => setExpandedExploreDescriptions(prev => ({ ...prev, [layerId]: false }))}
                                        className="mt-1 text-[11px] font-medium hover:underline"
                                        style={themeAccentTextStyle}
                                      >
                                        Hide description
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                              {tags.length > 0 && (
                                <div className="mt-1.5 w-full max-w-full flex gap-1 overflow-x-auto whitespace-nowrap pb-1 pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                  {tags.slice(0, 6).map((tag) => (
                                    <span
                                      key={`${layerId}-${tag}`}
                                      className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white/90 dark:bg-gray-700 border"
                                      style={{ color: activeLayerPageTheme.accent, borderColor: themeAccentBorder }}
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                          </div>
                          <div className="mt-2 flex items-center justify-end gap-2">
                              {isJoined && (
                                  <button
                                    onClick={() => {
                                      setActiveLayerId(layerId);
                                      if (user?.id) localStorage.setItem(`active-layer-${user.id}`, layerId);
                                      setBottomNavTab('home');
                                    }}
                                    className="px-3 py-1.5 text-xs rounded-lg text-white hover:shadow-lg transition-all"
                                    style={themeAccentButtonStyle}
                                  >
                                    Open
                                  </button>
                              )}
                              {!isOwner && isJoined && (
                                <button
                                  onClick={() => leavePublicCalendarById(layerId)}
                                  className="px-3 py-1.5 text-xs rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                                >
                                  Leave
                                </button>
                              )}
                              {!isOwner && !isJoined && (
                                  <button
                                    onClick={() => joinPublicCalendar(row)}
                                    className="px-3 py-1.5 text-xs rounded-lg text-white hover:shadow-lg transition-all"
                                    style={themeAccentButtonStyle}
                                  >
                                    Join
                                  </button>
                              )}
                              {isOwner && (
                                <>
                                   <button
                                     onClick={() => openPublishLayerModal(row)}
                                     className="px-3 py-1.5 text-xs rounded-lg text-white hover:shadow-lg transition-all"
                                     style={themeAccentButtonStyle}
                                   >
                                     Edit
                                   </button>
                                  <button
                                    onClick={() => publishLayerCalendar(layerId, false)}
                                    className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                  >
                                    Unpublish
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => openCalendarReportModal(row)}
                                className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                              >
                                Report
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

    {!activeSubCalendar && (
      <div className="fixed right-3 z-30 flex flex-row gap-2" style={{ bottom: 'calc(3.35rem + env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => setShowAiAssistant(true)}
          className={`w-11 h-11 rounded-xl shadow-lg flex items-center justify-center transition-all ${useLegacyEllieMilesTheme ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'text-white'}`}
          style={useLegacyEllieMilesTheme ? undefined : themeAccentButtonStyle}
          title="Ask AI"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowScanHelpModal(true)}
          disabled={isScanningReminder}
          className={`w-11 h-11 rounded-xl shadow-lg flex items-center justify-center transition-all ${isScanningReminder ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}
          title="Scan document"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>
    )}
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

    {/* -- Create Sub-Calendar Modal -- */}
    {!activeSubCalendar && (
      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur border border-gray-200 dark:border-gray-700 shadow-2xl">
            <button
              onClick={() => {
                setBottomNavTab('home');
                setShowDateDetailModal(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${bottomNavTab === 'home' ? '' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              style={bottomNavTab === 'home' ? themeAccentButtonStyle : undefined}
            >
              Home
            </button>
            <button
              onClick={() => {
                setBottomNavTab('active');
                setShowDateDetailModal(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${bottomNavTab === 'active' ? '' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              style={bottomNavTab === 'active' ? themeAccentButtonStyle : undefined}
            >
              Active
            </button>
            <button
              onClick={() => {
                setBottomNavTab('archived');
                setShowDateDetailModal(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${bottomNavTab === 'archived' ? '' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              style={bottomNavTab === 'archived' ? themeAccentButtonStyle : undefined}
            >
              Archived
            </button>
            <button
              onClick={() => {
                setBottomNavTab('explore');
                setShowDateDetailModal(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${bottomNavTab === 'explore' ? '' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              style={bottomNavTab === 'explore' ? themeAccentButtonStyle : undefined}
            >
              Explore
            </button>
          </div>
        </div>
      </div>
    )}

    {showLayerMediaCropModal && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 w-full max-w-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold" style={themeAccentHeadingStyle}>
              {layerMediaCropKind === 'icon' ? 'Crop Icon' : 'Crop Cover Photo'}
            </h3>
            <button onClick={closeLayerMediaCropModal} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Drag to position. Use zoom to crop before saving.
          </div>
          <div
            className={`relative mx-auto overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 ${layerMediaCropKind === 'icon' ? 'rounded-2xl' : 'rounded-xl'}`}
            style={{
              width: `${getLayerCropFrame(layerMediaCropKind).width}px`,
              height: `${getLayerCropFrame(layerMediaCropKind).height}px`,
              maxWidth: '100%',
              touchAction: 'none',
              cursor: 'grab',
            }}
            onPointerDown={handleLayerCropPointerDown}
            onPointerMove={handleLayerCropPointerMove}
            onPointerUp={handleLayerCropPointerUp}
            onPointerCancel={handleLayerCropPointerUp}
            onPointerLeave={handleLayerCropPointerUp}
            onMouseDown={handleLayerCropMouseDown}
            onMouseMove={handleLayerCropMouseMove}
            onMouseUp={handleLayerCropMouseUp}
            onMouseLeave={handleLayerCropMouseUp}
            onTouchStart={handleLayerCropTouchStart}
            onTouchMove={handleLayerCropTouchMove}
            onTouchEnd={handleLayerCropTouchEnd}
            onTouchCancel={handleLayerCropTouchEnd}
          >
            {!!layerMediaCropImageUrl && (
              <img
                src={layerMediaCropImageUrl}
                alt="Crop preview"
                draggable={false}
                onLoad={(e) => {
                  const natural = {
                    width: Number(e.currentTarget.naturalWidth || 0),
                    height: Number(e.currentTarget.naturalHeight || 0),
                  };
                  setLayerMediaCropNatural(natural);
                  setLayerMediaCropOffset({ x: 0, y: 0 });
                }}
                className="absolute select-none max-w-none pointer-events-none"
                style={{
                  width: `${getLayerCropMetrics(layerMediaCropKind, layerMediaCropNatural, layerMediaCropZoom).renderedW}px`,
                  height: `${getLayerCropMetrics(layerMediaCropKind, layerMediaCropNatural, layerMediaCropZoom).renderedH}px`,
                  left: `calc(50% + ${clampLayerCropOffset(layerMediaCropKind, layerMediaCropNatural, layerMediaCropZoom, layerMediaCropOffset).x}px)`,
                  top: `calc(50% + ${clampLayerCropOffset(layerMediaCropKind, layerMediaCropNatural, layerMediaCropZoom, layerMediaCropOffset).y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
              Zoom
            </label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={layerMediaCropZoom}
              onChange={(e) => {
                const nextZoom = Math.max(1, Math.min(3, Number(e.target.value || 1)));
                setLayerMediaCropZoom(nextZoom);
                setLayerMediaCropOffset(prev => clampLayerCropOffset(layerMediaCropKind, layerMediaCropNatural, nextZoom, prev));
              }}
              className="w-full"
              style={{ accentColor: activeLayerPageTheme.accent }}
            />
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              onClick={closeLayerMediaCropModal}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={commitLayerMediaCrop}
              disabled={uploadingLayerMedia || !layerMediaCropImageUrl}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${uploadingLayerMedia || !layerMediaCropImageUrl ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'text-white'}`}
              style={uploadingLayerMedia || !layerMediaCropImageUrl ? undefined : themeAccentButtonStyle}
            >
              Save Photo
            </button>
          </div>
        </div>
      </div>
    )}

    {showLayerMediaMenu && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold" style={themeAccentHeadingStyle}>Edit Calendar Photos</h3>
            <button onClick={() => setShowLayerMediaMenu(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl border bg-gray-50/80 dark:bg-gray-900/30 p-3" style={{ borderColor: themeAccentBorder }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Cover Photo Opacity
                </label>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {Math.round(effectiveCoverOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(effectiveCoverOpacity * 100)}
                onChange={(e) => {
                  const coverOpacity = Math.max(0, Math.min(1, Number(e.target.value || 0) / 100));
                  setCoverOpacityPreview(coverOpacity);
                }}
                onMouseUp={commitCoverOpacityPreview}
                onTouchEnd={commitCoverOpacityPreview}
                onKeyUp={(e) => {
                  if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown') {
                    commitCoverOpacityPreview();
                  }
                }}
                className="w-full"
                style={{ accentColor: activeLayerPageTheme.accent }}
              />
              <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Lower opacity softens the cover image. Higher opacity makes the photo show through more.
              </div>
            </div>
            <button
              onClick={() => chooseLayerMediaKind('header')}
              disabled={uploadingLayerMedia}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${uploadingLayerMedia ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'text-white'}`}
              style={uploadingLayerMedia ? undefined : themeAccentButtonStyle}
            >
              Choose Cover Photo
            </button>
            <button
              onClick={() => chooseLayerMediaKind('icon')}
              disabled={uploadingLayerMedia}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${uploadingLayerMedia ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
            >
              Change Icon
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => removeLayerMedia('header')}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Remove Cover
              </button>
              <button
                onClick={() => removeLayerMedia('icon')}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Remove Icon
              </button>
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 px-1">
              Photos open in a manual crop screen before saving.
            </div>
            <button
              onClick={() => setShowLayerMediaMenu(false)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {showTitleStyleModal && (
      <div className="fixed inset-0 bg-black/50 z-50 p-4 overflow-y-auto flex items-start sm:items-center justify-center">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto my-6"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
            touchAction: 'pan-y',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div />
            <button onClick={() => setShowTitleStyleModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-900/20 px-4 py-3 mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Calendar Title
            </label>
            <input
              type="text"
              value={titleNameDraft}
              onChange={(e) => setTitleNameDraft(e.target.value)}
              placeholder="Calendar Title"
              className="w-full bg-transparent border-0 p-0 text-2xl sm:text-3xl font-bold focus:outline-none"
              style={getLayerTitleDisplayStyle(titleStyleDraft)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setTitleStyleDraft(prev => ({ ...prev, mode: 'gradient' }))}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border ${titleStyleDraft.mode === 'gradient' ? 'bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 text-white border-transparent' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'}`}
            >
              Gradient
            </button>
            <button
              onClick={() => setTitleStyleDraft(prev => ({ ...prev, mode: 'solid' }))}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border ${titleStyleDraft.mode === 'solid' ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'}`}
            >
              Solid
            </button>
          </div>

          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Presets
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TITLE_STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setTitleStyleDraft(normalizeLayerTitleStyle(preset))}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-left hover:border-purple-300 dark:hover:border-purple-500"
                >
                  <div
                    className="text-sm font-bold truncate"
                    style={getLayerTitleDisplayStyle(preset)}
                  >
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Sports
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SPORTS_TITLE_STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setTitleStyleDraft(normalizeLayerTitleStyle(preset))}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-left hover:border-purple-300 dark:hover:border-purple-500"
                >
                  <div
                    className="text-sm font-bold truncate"
                    style={getLayerTitleDisplayStyle(preset)}
                  >
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {titleStyleDraft.mode === 'solid' ? (
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Font Color
              </label>
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                <input
                  type="color"
                  value={titleStyleDraft.solidColor}
                  onChange={(e) => setTitleStyleDraft(prev => ({ ...prev, solidColor: e.target.value }))}
                  className="w-10 h-10 rounded-lg border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={titleStyleDraft.solidColor}
                  onChange={(e) => setTitleStyleDraft(prev => ({ ...prev, solidColor: e.target.value }))}
                  className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-100 outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {[
                ['gradientFrom', 'From'],
                ['gradientVia', 'Middle'],
                ['gradientTo', 'To'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    {label}
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                    <input
                      type="color"
                      value={titleStyleDraft[key]}
                      onChange={(e) => setTitleStyleDraft(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-9 h-9 rounded-lg border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={titleStyleDraft[key]}
                      onChange={(e) => setTitleStyleDraft(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full min-w-0 bg-transparent text-sm text-gray-700 dark:text-gray-100 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setTitleNameDraft(String(calendarTitle || activeLayer?.name || '').trim());
                setTitleStyleDraft(activeLayerTitleStyle);
                setShowTitleStyleModal(false);
              }}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={saveLayerTitleStyle}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-semibold"
            >
              Save Title
            </button>
          </div>
        </div>
      </div>
    )}

    {showThemeMatchPrompt && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[55] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 w-full max-w-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Match the page theme too?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Use your title colors for the page background and main accent buttons on this calendar.
          </p>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-3 mb-4" style={{
            backgroundImage: `linear-gradient(135deg, ${derivePageThemeFromTitleStyle(pendingThemeMatchStyle || activeLayerTitleStyle).backgroundFrom} 0%, ${derivePageThemeFromTitleStyle(pendingThemeMatchStyle || activeLayerTitleStyle).backgroundVia} 50%, ${derivePageThemeFromTitleStyle(pendingThemeMatchStyle || activeLayerTitleStyle).backgroundTo} 100%)`,
          }}>
            <div
              className="text-xl font-bold truncate"
              style={getLayerTitleDisplayStyle(pendingThemeMatchStyle || activeLayerTitleStyle)}
            >
              {calendarTitle || activeLayer?.name || 'Calendar Title'}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setShowThemeMatchPrompt(false);
                setPendingThemeMatchStyle(null);
              }}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium"
            >
              No
            </button>
            <button
              onClick={async () => {
                const nextStyle = normalizeLayerTitleStyle(pendingThemeMatchStyle || activeLayerTitleStyle);
                await saveLayerPageTheme(derivePageThemeFromTitleStyle(nextStyle), nextStyle);
                setShowThemeMatchPrompt(false);
                setPendingThemeMatchStyle(null);
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={themeAccentButtonStyle}
            >
              Yes, match it
            </button>
          </div>
        </div>
      </div>
    )}

    {showPublishLayerModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {publishTargetIsPublic ? 'Edit Public Calendar' : 'Publish Calendar'}
            </h3>
            <button
              onClick={() => {
                setShowPublishLayerModal(false);
                setPublishLayerTargetId(null);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Public description
          </label>
          <textarea
            value={publishLayerDescription}
            onChange={(e) => setPublishLayerDescription(e.target.value)}
            placeholder="What is this calendar about?"
            rows={3}
            className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl mb-3 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          />
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Tags
          </label>
          <input
            type="text"
            value={publishLayerTagsInput}
            onChange={(e) => setPublishLayerTagsInput(e.target.value)}
            placeholder="e.g. pickleball, fresno, community"
            className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl mb-4 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          />
          {!publishTargetIsPublic && (
            <label className="flex items-start gap-3 mb-4 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={publishPolicyConfirmed}
                onChange={(e) => setPublishPolicyConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span>
                I have the rights or permission to publish this content, and I understand public calendars can be reported and removed.
              </span>
            </label>
          )}
          <div className="flex items-center justify-between gap-2">
            {publishTargetIsPublic ? (
              <button
                onClick={async () => {
                  if (!publishLayerTargetId) return;
                  await publishLayerCalendar(publishLayerTargetId, false);
                  setShowPublishLayerModal(false);
                  setPublishLayerTargetId(null);
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Unpublish
              </button>
            ) : <div />}
            <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowPublishLayerModal(false);
                setPublishLayerTargetId(null);
              }}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={submitPublishLayerModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-semibold"
            >
              {publishTargetIsPublic ? 'Save' : 'Publish'}
            </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {showCalendarReportModal && reportCalendarTarget && (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => setShowCalendarReportModal(false)}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Report Calendar</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {reportCalendarTarget?.name || 'Public Calendar'}
              </p>
            </div>
            <button
              onClick={() => setShowCalendarReportModal(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Reason
          </label>
          <select
            value={reportCalendarReason}
            onChange={(e) => setReportCalendarReason(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl mb-3"
          >
            {CALENDAR_REPORT_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>{reason.label}</option>
            ))}
          </select>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Details
          </label>
          <textarea
            value={reportCalendarDetails}
            onChange={(e) => setReportCalendarDetails(e.target.value)}
            placeholder="Tell us what looks wrong."
            rows={4}
            className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl mb-4"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowCalendarReportModal(false)}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={submitCalendarReport}
              disabled={submittingCalendarReport}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-semibold disabled:opacity-60"
            >
              {submittingCalendarReport ? 'Submitting...' : 'Submit Report'}
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
            className="w-full px-3 py-2 text-base sm:text-sm border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl mb-4 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            style={{ fontSize: '16px' }}
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
            <h3 className="text-lg font-bold" style={themeAccentHeadingStyle}>New Sub-Calendar</h3>
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
            placeholder={'e.g. SF Trip \u2708\uFE0F, Cabo 2026 \uD83C\uDF34'}
            className="w-full px-3 py-2 text-base sm:text-sm border-2 dark:bg-gray-700 dark:text-white rounded-xl mb-4 focus:ring-2"
            style={{ fontSize: '16px', borderColor: themeAccentBorder }}
            autoFocus
            onKeyPress={e => e.key === 'Enter' && createSubCalendar()}
          />
          <button
            onClick={createSubCalendar}
            className="w-full py-2.5 text-white rounded-xl font-medium"
            style={themeAccentButtonStyle}
          >Create Sub-Calendar</button>
        </div>
      </div>
    )}

    {showSubCalInviteModal && activeSubCalendar && (
      <div
        className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"
        onClick={() => setShowSubCalInviteModal(false)}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Invite to Trip
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Add someone to {activeSubCalendar.name}
              </p>
            </div>
            <button
              onClick={() => setShowSubCalInviteModal(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              aria-label="Close invite modal"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <input
            type="text"
            value={subCalInviteEmail}
            onChange={(e) => setSubCalInviteEmail(e.target.value)}
            placeholder="Enter email or phone"
            className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl mb-4 focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && inviteToSubCalendar()}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowSubCalInviteModal(false)}
              className="flex-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => inviteToSubCalendar()}
              className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-sm font-semibold"
            >
              Send Invite
            </button>
          </div>
        </div>
      </div>
    )}

    {showSubCalNotesModal && activeSubCalendar && (
      <div
        className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"
        onClick={() => setShowSubCalNotesModal(false)}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-300">Reminders & Notes</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Notes for {activeSubCalendar.name}
              </p>
            </div>
            <button
              onClick={() => setShowSubCalNotesModal(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              aria-label="Close reminders and notes"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl border border-yellow-300 dark:border-yellow-700">
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
                    newNotes.forEach((n, i) => {
                      supabase.from('sub_calendar_notes').update({ created_at: new Date(Date.now() - (newNotes.length - i) * 1000).toISOString() }).eq('id', n.id);
                    });
                  }}
                  onDragEnd={() => setDraggedNoteId(null)}
                  className={`bg-yellow-50 dark:bg-gray-700 rounded-lg border border-yellow-300 dark:border-yellow-700 overflow-hidden transition-opacity ${draggedNoteId === note.id ? 'opacity-40' : 'opacity-100'}`}
                >
                  <div className="flex items-center gap-2 px-2.5 py-2">
                    <span className="text-gray-300 dark:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 select-none text-sm">::</span>
                    <button onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)} className="text-xs text-gray-400 shrink-0 w-3">
                      {expandedNote === note.id ? '−' : '+'}
                    </button>
                    <span className="text-xs">📝</span>
                    {editingNote === note.id ? (
                      <input
                        autoFocus
                        defaultValue={note.text}
                        onBlur={e => updateNoteText(note.id, e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && updateNoteText(note.id, e.target.value)}
                        className="flex-1 text-base sm:text-xs px-1.5 py-0.5 border border-purple-300 rounded dark:bg-gray-600 dark:text-white"
                        style={{ fontSize: '16px' }}
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
                    <button onClick={() => deleteSubCalNote(note.id)} className="text-gray-300 hover:text-red-400 text-xs shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
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
                          <button onClick={() => deleteChecklistItem(note.id, item.id)} className="text-gray-300 hover:text-red-400 text-xs">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-1.5 mt-1">
                        <input
                          type="text"
                          value={newChecklistItem}
                          onChange={e => setNewChecklistItem(e.target.value)}
                          onKeyPress={e => { if (e.key === 'Enter') { addChecklistItem(note.id, newChecklistItem); } }}
                          placeholder="Add item..."
                          className="flex-1 px-2 py-1 text-base sm:text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg"
                          style={{ fontSize: '16px' }}
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
                className="flex-1 px-2.5 py-1.5 text-base sm:text-xs border border-yellow-300 dark:border-yellow-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-1 focus:ring-yellow-400"
                style={{ fontSize: '16px' }}
              />
              <button onClick={addSubCalNote} className="px-2.5 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg text-xs font-medium">Add</button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* -- Sub-Calendar Full View -- */}
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
                className="font-bold text-base sm:text-sm text-gray-800 dark:text-white bg-transparent border-b-2 border-purple-400 text-center outline-none w-40"
                style={{ fontSize: '16px' }}
              />
            ) : (
              <div
                className="font-bold text-gray-800 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setEditingSubCalTitle(true)}
              >{`${activeSubCalendar.name} \u2708\uFE0F`}</div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(activeSubCalendar.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(activeSubCalendar.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSubCalLocationSheet(true)}
              className="relative p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              title="Trip live location"
            >
              <MapPin className="w-4 h-4" />
              {Object.values(memberLocations).filter(loc => loc?.sharing && typeof loc?.lat === 'number' && typeof loc?.lon === 'number').length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1rem] h-[1rem] px-1 rounded-full bg-emerald-500 text-white text-[9px] leading-none font-bold flex items-center justify-center">
                  {Object.values(memberLocations).filter(loc => loc?.sharing && typeof loc?.lat === 'number' && typeof loc?.lon === 'number').length}
                </span>
              )}
            </button>
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
              onClick={() => setShowSubCalInviteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-xs rounded-xl font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Invite
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
            touchAction: 'pan-y',
          }}
        >

        {/* Weather location — collapsed pill or expanding input */}
        <div className="relative px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2" ref={weatherAutocompleteRef}>
          {subCalWeatherLocation && !subCalWeatherExpanded ? (
            // Collapsed pill
            <button
              onClick={() => setSubCalWeatherExpanded(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all"
            >
              📍 {subCalWeatherLocation}
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
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      setSubCalWeatherExpanded(false);
                      setSubCalWeatherSuggestions([]);
                      e.currentTarget.blur();
                      return;
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const firstSuggestion = subCalWeatherSuggestions[0];
                      if (firstSuggestion) {
                        fetchSubCalWeather(firstSuggestion);
                      } else {
                        setSubCalWeatherExpanded(false);
                        setSubCalWeatherSuggestions([]);
                      }
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="Search city for weather…"
                  className="flex-1 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-base sm:text-xs"
                  style={{ fontSize: '16px' }}
                />
                {subCalWeatherLoading && <span className="text-xs text-blue-400 animate-pulse shrink-0">Loading…</span>}
                {subCalWeatherLocation && (
                  <button
                    onClick={() => {
                      setSubCalWeatherExpanded(false);
                      setSubCalWeatherInput(subCalWeatherLocation);
                      setSubCalWeatherSuggestions([]);
                    }}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
                    aria-label="Close weather search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
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
          <button
            onClick={() => setShowSubCalNotesModal(true)}
            className="ml-auto shrink-0 w-9 h-9 rounded-xl border border-yellow-300 dark:border-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center relative hover:bg-yellow-200 dark:hover:bg-yellow-900/45 transition-colors"
            title="Open reminders and notes"
            aria-label="Open reminders and notes"
          >
            <span className="relative block w-4 h-5 rounded-[3px] bg-yellow-300 dark:bg-yellow-200 shadow-sm">
              <span className="absolute left-0 right-0 top-[4px] border-t border-yellow-700/40" />
              <span className="absolute left-0 right-0 top-[8px] border-t border-yellow-700/40" />
              <span className="absolute left-0 right-0 top-[12px] border-t border-yellow-700/40" />
            </span>
            {subCalNotes.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1rem] h-[1rem] px-1 rounded-full bg-yellow-500 text-white text-[9px] leading-none font-bold flex items-center justify-center">
                {subCalNotes.length}
              </span>
            )}
          </button>
        </div>

        {/* Members (quick access near top) */}
        <div className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Members ({subCalMembers.length + 1})</h4>
            <button
              onClick={() => setSubCalMembersCollapsed((prev) => !prev)}
              className="text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
            >
              {subCalMembersCollapsed ? 'Show' : 'Hide'}
            </button>
          </div>
          {!subCalMembersCollapsed && (
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs flex items-center gap-1">
                👤 {currentUser} (you)
              </span>
              {subCalMembers.map(m => (
                <span key={m.identity || m.email || m.phone} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs flex items-center gap-1">
                  {m.identity || m.email || m.phone}
                  <span className="px-1 py-0.5 rounded text-[9px] font-semibold bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200">
                    {getRecipientKindLabel(m.identity || m.email || m.phone)}
                  </span>
                  {activeSubCalendar.owner_id === user?.id && m.removable !== false && (
                    <button onClick={() => removeMemberFromSubCal(m.identity || m.email || m.phone)} className="ml-0.5 text-gray-400 hover:text-red-500">×</button>
                  )}
                </span>
              ))}
              {activeSubCalendar.owner_id === user?.id && (
                <button
                  onClick={() => setShowSubCalInviteModal(true)}
                  className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors"
                >+ Invite</button>
              )}
            </div>
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
                  onTouchMove={() => clearTimeout(shakingTimeoutRef.current)}
                  onTouchEnd={() => clearTimeout(shakingTimeoutRef.current)}
                  onTouchCancel={() => clearTimeout(shakingTimeoutRef.current)}
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
                    >-</button>
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
              <span className="text-xs text-red-400">Tap - to remove a day</span>
              <button onClick={() => setShakingDates(false)} className="text-xs text-gray-400 hover:text-gray-600 underline">Done</button>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSubCalTab('itinerary')}
            className={`flex-1 py-2.5 text-sm font-medium transition-all border-b-2 ${subCalTab === 'itinerary' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >Itinerary</button>
          <button
            onClick={() => setSubCalTab('photos')}
            className={`flex-1 py-2.5 text-sm font-medium transition-all border-b-2 relative ${subCalTab === 'photos' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >
            Photos
            {tripPhotos.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 text-xs rounded-full">{tripPhotos.length}</span>}
          </button>
          <button
            onClick={() => setSubCalTab('expenses')}
            className={`flex-1 py-2.5 text-sm font-medium transition-all border-b-2 ${subCalTab === 'expenses' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >Expenses</button>
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
            <div className="px-4 py-4 space-y-4">

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
                              <div
                                className="bg-white dark:bg-gray-700 rounded-xl p-3 border-2 border-purple-300 shadow space-y-2 mb-1"
                                style={{ touchAction: 'pan-y' }}
                              >
                                <input
                                  type="text"
                                  defaultValue={event.title}
                                  onBlur={e => updateSubCalEvent(event.id, { title: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-base sm:text-sm"
                                  style={{ fontSize: '16px' }}
                                  autoFocus
                                />
                                <div className="flex gap-2 min-w-0">
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
                                    className="flex-1 min-w-0 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-base sm:text-xs"
                                    style={{ fontSize: '16px' }}
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
                                    className="flex-1 min-w-0 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-base sm:text-xs"
                                    style={{ fontSize: '16px' }}
                                  />
                                </div>
                                <textarea
                                  defaultValue={event.notes || ''}
                                  onBlur={e => updateSubCalEvent(event.id, { notes: e.target.value })}
                                  placeholder="Notes..."
                                  rows={2}
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-base sm:text-sm resize-none"
                                  style={{ fontSize: '16px' }}
                                />
                                <PlacesAutocomplete
                                  value={event.location || ''}
                                  onSelect={(val) => updateSubCalEvent(event.id, { location: val })}
                                  placeholder="📍 Add location (optional)"
                                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg text-base sm:text-sm"
                                />
                                <button onClick={() => setSubCalEditingEvent(null)} className="w-full py-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-lg text-sm font-medium">Done</button>
                              </div>
                           ) : (
                              <div
                                className="bg-purple-50 dark:bg-purple-900/20 rounded-xl px-2.5 py-2 mb-1 border border-purple-200 dark:border-purple-700"
                                style={{ touchAction: 'pan-y' }}
                              >
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
                                      className="reaction-picker text-gray-400 hover:text-purple-500 text-xs">+</button>
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
                                  >📸</button>
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
                              className="w-full text-base sm:text-sm px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                              style={{ fontSize: '16px' }}
                            />
                            <div className="flex gap-2 min-w-0">
                              <input
                                type="text"
                                readOnly
                                value={`${hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`}
                                className="w-24 shrink-0 text-base sm:text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-300 rounded-lg bg-gray-50"
                                style={{ fontSize: '16px' }}
                              />
                              <input
                                type="text"
                                placeholder="End time (optional)"
                                value={subCalNewEventForm.endTime}
                                onChange={e => setSubCalNewEventForm(f => ({ ...f, endTime: e.target.value }))}
                                className="flex-1 min-w-0 text-base sm:text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                                style={{ fontSize: '16px' }}
                              />
                            </div>
                            <PlacesAutocomplete
                              value={subCalNewEventForm.location}
                              onSelect={val => setSubCalNewEventForm(f => ({ ...f, location: val || '' }))}
                              placeholder="📍 Add location (optional)"
                              className="w-full text-base sm:text-xs px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
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
                              <span className="text-xs text-purple-300 dark:text-purple-700 group-hover:text-purple-400 dark:group-hover:text-purple-500 transition-colors">+</span>
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
            <div className="px-4 py-4 space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                <button
                  onClick={() => toggleExpensePanel('splitter')}
                  className="w-full flex items-center justify-between mb-2 text-left"
                >
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">💸 Expense Splitter</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{expensePanels.splitter ? '-' : '+'}</span>
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
                          <button onClick={() => deleteSubCalExpense(item.id)} className="text-gray-300 hover:text-red-400 text-xs shrink-0">?</button>
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
                  <span className="text-xs text-gray-500 dark:text-gray-400">{expensePanels.summary ? '-' : '+'}</span>
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
                  <span className="text-xs text-gray-500 dark:text-gray-400">{expensePanels.handles ? '-' : '+'}</span>
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
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">🤝 Who Pays Whom</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{expensePanels.settlements ? '-' : '+'}</span>
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
          <div>

            {/* Upload bar */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto || isPhotoSelectionMode || photoDeleteMode}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium shadow hover:shadow-lg transition-all disabled:opacity-50"
              >
                {uploadingPhoto ? 'Uploading…' : 'Add Photos'}
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
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setIsPhotoSelectionMode(false);
                      setPhotoDeleteMode(true);
                      setShowPhotoSortMenu(false);
                    }}
                    className="min-h-[2rem] px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
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
                <div className="relative ml-auto">
                  <button
                    onClick={() => setShowPhotoSortMenu((prev) => !prev)}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 leading-none align-middle"
                    title="Sort photos"
                    aria-label="Sort photos"
                  >
                    <span className="inline-flex h-4 flex-col items-center justify-center gap-1" aria-hidden="true">
                      <span className="block w-4 h-0.5 rounded-full bg-current" />
                      <span className="block w-4 h-0.5 rounded-full bg-current" />
                      <span className="block w-4 h-0.5 rounded-full bg-current" />
                    </span>
                  </button>
                  {showPhotoSortMenu && (
                    <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl overflow-hidden z-20">
                      <div className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Sort by
                      </div>
                      <button
                        onClick={() => {
                          setPhotoView('grid');
                          setShowPhotoSortMenu(false);
                        }}
                        className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${photoView === 'grid' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        Day grid
                      </button>
                      <button
                        onClick={() => {
                          setPhotoView('timeline');
                          setShowPhotoSortMenu(false);
                        }}
                        className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${photoView === 'timeline' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        Timeline
                      </button>
                    </div>
                  )}
                </div>
            </div>

            {tripPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                <div className="text-6xl mb-4">{'\uD83D\uDCF8'}</div>
                <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">No photos yet</div>
                <div className="text-sm text-gray-400 dark:text-gray-500">Tap "Add Photos" to share memories from this trip</div>
              </div>
            ) : photoView === 'grid' ? (
              /* -- GRID VIEW -- */
              <div className="px-4 pb-4 pt-6">
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
                            className={`relative group aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer ${isSelectedPhoto ? 'ring-2 ring-purple-500' : ''}`}
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
                                <X className="w-3.5 h-3.5" />
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
              /* -- TIMELINE VIEW -- */
              <div className="px-4 pb-4 pt-6 space-y-8">
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
                          <div key={photo.id} className={`relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border ${isSelectedPhoto ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-100 dark:border-gray-700'}`}>
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
                                <p className="text-xs text-gray-400 dark:text-gray-500">👤 {photo.uploaded_by}</p>
                              </div>
                              {!isPhotoSelectionMode && photoDeleteMode && <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">Delete mode</span>}
                            </div>
                            {!isPhotoSelectionMode && photoDeleteMode && (
                              <button
                                onClick={() => deleteTripPhoto(photo)}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow"
                              >
                                <X className="w-3.5 h-3.5" />
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

        {showSubCalLocationSheet && (() => {
          const todayKey = getDateKey(new Date());
          const sharingWindowOpen = todayKey >= activeSubCalendar.start_date && todayKey <= activeSubCalendar.end_date;
          const liveLocations = Object.values(memberLocations).filter(
            (loc) => loc?.sharing && typeof loc?.lat === 'number' && typeof loc?.lon === 'number'
          );
          return (
            <div
              className="fixed inset-0 z-50 bg-black/45 flex items-end sm:items-center justify-center"
              onClick={() => setShowSubCalLocationSheet(false)}
            >
              <div
                className="w-full sm:w-[28rem] bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-white">Trip Live Location</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {sharingWindowOpen ? `${liveLocations.length} member${liveLocations.length === 1 ? '' : 's'} sharing right now.` : 'Available only during trip dates.'}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSubCalLocationSheet(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Close live location"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 px-3 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">Share my location</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {sharingWindowOpen
                        ? 'Shared only with members in this trip, and only during the trip dates.'
                        : 'Available only during the trip dates, and only shared with members in this trip.'}
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

                <div className="mt-4">
                  <div className="mb-2 text-[11px] text-gray-500 dark:text-gray-400">
                    Live location is limited to this trip’s member list and does not share outside the trip.
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                    Members Sharing
                  </div>
                  {liveLocations.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 px-3 py-3">
                      Nobody is sharing location right now.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {liveLocations.map((loc, idx) => (
                        <a
                          key={`${loc.userId || 'member'}-${idx}`}
                          href={`https://www.google.com/maps?q=${loc.lat},${loc.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between text-sm px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-700"
                        >
                          <span className="text-gray-700 dark:text-gray-200 truncate">📍 {loc.name || loc.email || loc.userId}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 shrink-0">Open</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        </div>

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
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption || ''}
              className="max-w-full max-h-[80vh] rounded-xl object-contain"
              onClick={e => e.stopPropagation()}
            />
            <div className="mt-3 text-center" onClick={e => e.stopPropagation()}>
              {lightboxPhoto.caption && <p className="text-white text-sm mb-1">{lightboxPhoto.caption}</p>}
              <p className="text-gray-400 text-xs">👤 {lightboxPhoto.uploaded_by} · {lightboxPhoto.date ? new Date(lightboxPhoto.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>
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
      <style>{`
        @media (max-width: 640px) {
          input,
          textarea,
          select {
            font-size: 16px !important;
          }
        }
      `}</style>
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


