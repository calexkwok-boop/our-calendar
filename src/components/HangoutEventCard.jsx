import React from 'react';

const HangoutEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const duration = String(event?.expectedDuration || '').trim();
  const reservationName = String(event?.reservationName || '').trim();
  const billSplitting = String(event?.billSplitting || 'separate').trim();
  const billText = billSplitting === 'split'
    ? 'Split evenly'
    : billSplitting === 'host'
      ? 'Host pays'
      : 'Separate checks';

  return (
    <div className="group relative overflow-hidden rounded-[32px] border-2 border-cyan-300/70 bg-gradient-to-br from-cyan-50 via-sky-50/80 to-blue-50/50 shadow-[0_24px_80px_rgba(34,211,238,0.25)] transition-all duration-300 hover:shadow-[0_28px_100px_rgba(34,211,238,0.35)] dark:border-cyan-400/25 dark:from-[#15242d] dark:via-[#121a1f] dark:to-[#0f1113] dark:shadow-none">
      
      {/* FLOATING COFFEE STEAM WISPS */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Steam wisps that rise and fade */}
        <div className="absolute left-[20%] top-[100%] h-16 w-1 rounded-full bg-gradient-to-t from-cyan-200/40 to-transparent blur-sm dark:from-cyan-400/20" 
             style={{ animation: 'rise-steam 6s ease-in infinite' }} />
        <div className="absolute left-[22%] top-[100%] h-20 w-1 rounded-full bg-gradient-to-t from-sky-200/30 to-transparent blur-sm dark:from-sky-400/15" 
             style={{ animation: 'rise-steam 7s ease-in infinite 1s' }} />
        <div className="absolute left-[24%] top-[100%] h-14 w-1 rounded-full bg-gradient-to-t from-cyan-200/35 to-transparent blur-sm dark:from-cyan-400/18" 
             style={{ animation: 'rise-steam 6.5s ease-in infinite 2s' }} />
        
        <div className="absolute right-[30%] top-[100%] h-18 w-1 rounded-full bg-gradient-to-t from-blue-200/35 to-transparent blur-sm dark:from-blue-400/18" 
             style={{ animation: 'rise-steam 7.5s ease-in infinite 0.5s' }} />
        <div className="absolute right-[32%] top-[100%] h-16 w-1 rounded-full bg-gradient-to-t from-cyan-200/40 to-transparent blur-sm dark:from-cyan-400/20" 
             style={{ animation: 'rise-steam 6.8s ease-in infinite 1.5s' }} />
      </div>

      {/* CASUAL DOODLES/LINES (relaxed aesthetic) */}
      <div className="pointer-events-none absolute inset-0">
        {/* Wavy casual lines */}
        <svg className="absolute left-[10%] top-[30%] h-8 w-8 opacity-10 dark:opacity-5" viewBox="0 0 40 40">
          <path d="M5,20 Q10,10 15,20 T25,20 T35,20" stroke="currentColor" strokeWidth="2" fill="none" className="text-cyan-400" />
        </svg>
        <svg className="absolute right-[15%] top-[60%] h-6 w-6 opacity-10 dark:opacity-5" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="2" fill="none" className="text-sky-400" />
        </svg>
      </div>

      {/* SOFT AMBIENT GLOW */}
      <div className="pointer-events-none absolute -left-12 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-300/20 to-transparent blur-3xl dark:from-cyan-400/10" />
      <div className="pointer-events-none absolute -right-12 top-1/3 h-32 w-32 -translate-y-1/2 rounded-full bg-gradient-to-l from-sky-300/20 to-transparent blur-3xl dark:from-sky-400/10" />

      {/* HEADER */}
      <div className="relative border-b-2 border-cyan-200/80 bg-gradient-to-br from-white/95 to-cyan-50/60 px-6 py-6 dark:border-cyan-400/15 dark:from-white/[0.04] dark:to-cyan-500/[0.02] sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              {/* COFFEE CUP ICON WITH STEAM */}
              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-[18px] border-2 border-cyan-300 bg-gradient-to-br from-cyan-100 to-sky-100 text-2xl shadow-lg shadow-cyan-200/40 transition-transform group-hover:scale-110 dark:border-cyan-400/30 dark:from-cyan-500/15 dark:to-sky-500/15 dark:shadow-cyan-500/10"
                    style={{ animation: 'gentle-wobble 3s ease-in-out infinite' }}>
                ☕
                {/* Mini steam effect on icon */}
                <div className="absolute -top-1 left-1/2 h-3 w-0.5 -translate-x-1/2 rounded-full bg-cyan-300/40 blur-[1px] dark:bg-cyan-400/20" 
                     style={{ animation: 'rise-mini-steam 2s ease-in infinite' }} />
              </span>
              
              <span className="rounded-full bg-gradient-to-br from-cyan-100 to-cyan-200 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-cyan-800 shadow-sm dark:from-cyan-500/15 dark:to-cyan-600/15 dark:text-cyan-200">
                Hangout
              </span>
              
              {duration && (
                <span className="rounded-full border-2 border-cyan-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-cyan-700 shadow-sm dark:border-cyan-400/20 dark:bg-white/5 dark:text-cyan-200">
                  ~{duration}
                </span>
              )}
            </div>
            
            <h3 className="text-[22px] font-bold leading-tight tracking-tight text-gray-950 dark:text-white">
              {event?.title || 'Untitled hangout'}
            </h3>
            
            <div className="mt-2.5 flex items-center gap-2 text-[15px] font-medium text-gray-600 dark:text-gray-300">
              <svg className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatEventDateTime(event?.date, event?.time)}</span>
            </div>
            
            {event?.location && (
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 text-[15px] font-medium text-gray-600 dark:text-gray-300">
                  <svg className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{event.location}</span>
                </div>
                <ActionPill href={buildMapHref(event.location)}>View map</ActionPill>
              </div>
            )}
          </div>

          {(props.onEdit || props.onDelete) && (
            <div className="flex items-center gap-2">
              {props.onEdit && (
                <button 
                  className="rounded-full border-2 border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm transition-all hover:border-gray-300 hover:text-gray-900 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white" 
                  onClick={props.onEdit} 
                  type="button"
                >
                  <EditIcon />
                </button>
              )}
              {props.onDelete && (
                <button 
                  className="rounded-full border-2 border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-red-400/20 dark:hover:bg-red-500/10 dark:hover:text-red-400" 
                  onClick={props.onDelete} 
                  type="button"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="relative space-y-5 px-6 py-6 sm:px-7">
        
        {/* PLAN - CASUAL LAYOUT WITH ICONS */}
        <Section
          title="The Plan"
          subtitle={reservationName ? `Table under: ${reservationName}` : 'Walk-in or meetup spot'}
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              onClick={() => openEditor({
                title: 'Edit Plan',
                subtitle: 'Update reservation and logistics.',
                fields: [
                  { key: 'reservationName', label: 'Reservation name', value: reservationName, placeholder: 'Smith' },
                  { key: 'expectedDuration', label: 'Expected duration', value: duration, placeholder: '2 hours' },
                  { key: 'billSplitting', label: 'Bill style', value: billSplitting, placeholder: 'separate, split, or host' },
                ],
                onSave: (values) => onUpdateEventData({
                  reservationName: String(values.reservationName || '').trim(),
                  expectedDuration: String(values.expectedDuration || '').trim(),
                  billSplitting: ['separate', 'split', 'host'].includes(String(values.billSplitting || '').trim()) 
                    ? String(values.billSplitting || '').trim() 
                    : 'separate',
                }),
              })}
            >
              Edit
            </ActionPill>
          ) : null}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Reservation Card - relaxed style */}
            <div className="group/card relative overflow-hidden rounded-2xl border-2 border-cyan-200 bg-white p-4 shadow-sm transition-all hover:border-cyan-300 hover:shadow-md dark:border-cyan-400/20 dark:bg-white/5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-sky-100 text-xl dark:from-cyan-500/15 dark:to-sky-500/15">
                  📋
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
                    Reservation
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {reservationName || 'Walk-in'}
                  </div>
                </div>
              </div>
            </div>

            {/* Bill Card - casual money icon */}
            <div className="group/card relative overflow-hidden rounded-2xl border-2 border-sky-200 bg-white p-4 shadow-sm transition-all hover:border-sky-300 hover:shadow-md dark:border-sky-400/20 dark:bg-white/5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 text-xl dark:from-sky-500/15 dark:to-blue-500/15">
                  💳
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">
                    Bill
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {billText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* VIBE CHECK - CASUAL INFO CARD */}
        {duration && (
          <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 shadow-sm dark:border-blue-400/20 dark:from-blue-500/10 dark:to-cyan-500/10">
            {/* Decorative wave */}
            <div className="pointer-events-none absolute right-4 top-4 opacity-10 dark:opacity-5">
              <svg className="h-8 w-8 text-blue-400" viewBox="0 0 40 40">
                <path d="M5,20 Q10,15 15,20 T25,20 T35,20" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            </div>
            
            <div className="relative flex items-center gap-3">
              <span className="text-3xl">⏱️</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
                  Expected Duration
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Around {duration}
                </div>
              </div>
            </div>
          </div>
        )}

        <NotesSection event={event} onEdit={onEdit} />

        <InviteeRow event={event} label="Coming" />
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes rise-steam {
          0% { 
            transform: translateY(0) translateX(0) scaleY(1);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          50% {
            transform: translateY(-80px) translateX(8px) scaleY(1.2);
            opacity: 0.3;
          }
          100% { 
            transform: translateY(-120px) translateX(15px) scaleY(1.5);
            opacity: 0;
          }
        }
        
        @keyframes rise-mini-steam {
          0% { 
            transform: translateY(0) scaleY(1);
            opacity: 0;
          }
          50% {
            opacity: 0.4;
          }
          100% { 
            transform: translateY(-12px) scaleY(1.5);
            opacity: 0;
          }
        }
        
        @keyframes gentle-wobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-2deg); }
          75% { transform: rotate(2deg); }
        }
      `}</style>
    </div>
  );
};

export default HangoutEventCard;
