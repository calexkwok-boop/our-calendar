import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Plus, MapPin, Radio } from 'lucide-react';

const PopupEventPanel = ({
  event,
  supabase,
  user,
  displayName,
  accent = '#6366f1',
  darkMode = false,
}) => {
  const [tab, setTab] = useState('chat');
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [locations, setLocations] = useState([]);
  const [sharing, setSharing] = useState(false);

  const bottomRef = useRef(null);
  const watchRef = useRef(null);

  // ─────────────────────────────
  // MEMBERS
  // ─────────────────────────────
  const loadMembers = async () => {
    const { data } = await supabase
      .from('popup_event_signups')
      .select('*')
      .eq('event_id', event.id);

    if (data) setMembers(data);
  };

  useEffect(() => {
    loadMembers();
  }, [event.id]);

  // ─────────────────────────────
  // CHAT
  // ─────────────────────────────
  const loadMessages = async () => {
    const { data } = await supabase
      .from('popup_event_messages')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at');

    if (data) setMessages(data);
  };

  useEffect(() => {
    loadMessages();
  }, [event.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${event.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'popup_event_messages',
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [event.id]);

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content) return;

    setDraft('');

    await supabase.from('popup_event_messages').insert({
      event_id: event.id,
      user_id: user.id,
      display_name: displayName || user.email,
      content,
    });
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─────────────────────────────
  // LOCATIONS
  // ─────────────────────────────
  const loadLocations = async () => {
    const { data } = await supabase
      .from('popup_event_locations')
      .select('*')
      .eq('event_id', event.id);

    if (data) setLocations(data);
  };

  useEffect(() => {
    loadLocations();
  }, [event.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`loc-${event.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'popup_event_locations',
          filter: `event_id=eq.${event.id}`,
        },
        () => loadLocations()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [event.id]);

  const startSharing = () => {
    if (!navigator.geolocation) return;

    setSharing(true);

    watchRef.current = navigator.geolocation.watchPosition((pos) => {
      supabase.from('popup_event_locations').upsert({
        event_id: event.id,
        user_id: user.id,
        display_name: displayName,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        updated_at: new Date().toISOString(),
      });
    });
  };

  const stopSharing = async () => {
    if (watchRef.current) {
      navigator.geolocation.clearWatch(watchRef.current);
    }

    setSharing(false);

    await supabase
      .from('popup_event_locations')
      .delete()
      .eq('event_id', event.id)
      .eq('user_id', user.id);
  };

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 500 }}>

      {/* Tabs */}
      <div style={{ display: 'flex' }}>
        {['chat', 'map', 'roster'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: 10,
              background: tab === t ? accent : 'transparent',
              color: tab === t ? '#fff' : '#888',
              border: 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* CHAT */}
      {tab === 'chat' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ marginBottom: 6 }}>
                <b>{m.display_name}:</b> {m.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: 'flex', gap: 6, padding: 10 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              style={{ flex: 1 }}
            />
            <button onClick={sendMessage}>
              <Send size={16} />
            </button>
          </div>
        </>
      )}

      {/* MAP */}
      {tab === 'map' && (
        <div style={{ padding: 10 }}>
          <button onClick={sharing ? stopSharing : startSharing}>
            {sharing ? 'Stop sharing' : 'Share location'}
          </button>

          <div style={{ marginTop: 10 }}>
            {locations.map((l) => (
              <div key={l.user_id}>
                📍 {l.display_name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROSTER */}
      {tab === 'roster' && (
        <div style={{ padding: 10 }}>
          {members.map((m) => (
            <div key={m.user_id}>
              {m.display_name} ({m.role})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PopupEventPanel;