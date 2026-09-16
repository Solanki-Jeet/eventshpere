import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const VenueCalendar = ({ 
  events = [], 
  onDateSelect = null, 
  onEventClick = null, 
  selectable = false,
  role = 'customer'
}) => {
  
  // Custom date selection handler
  const handleDateSelect = (selectInfo) => {
    if (!onDateSelect) return;
    
    // FullCalendar selectInfo.endStr is exclusive. Let's subtract 1 day to make the end date inclusive for our API.
    const startStr = selectInfo.startStr;
    const endStr = selectInfo.endStr;
    
    // Convert endStr back by 1 day because FullCalendar's end is exclusive in selection
    const endDateObj = new Date(endStr);
    endDateObj.setDate(endDateObj.getDate() - 1);
    const inclusiveEndStr = endDateObj.toISOString().split('T')[0];

    onDateSelect(startStr, inclusiveEndStr);
  };

  // Check if selection overlaps with booked bookings or maintenance days
  const handleSelectAllow = (selectInfo) => {
    const start = new Date(selectInfo.startStr);
    const end = new Date(selectInfo.endStr);

    // Prevent selecting past dates
    const today = new Date();
    today.setHours(0,0,0,0);
    if (start < today) {
      return false;
    }

    // Check overlaps against confirmed bookings (red) or maintenance days (gray)
    for (let event of events) {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // If event type is booked or maintenance, block date overlap
      const isBlocker = event.color === 'red' || event.color === 'gray';
      if (isBlocker) {
        if (start < eventEnd && end > eventStart) {
          return false;
        }
      }
    }
    return true;
  };

  return (
    <div className="w-full bg-[#181825] p-6 rounded-3xl border border-white/10 shadow-xl space-y-4 text-left">
      {/* Calendar Header with Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <h4 className="font-bold text-white text-sm">Venue Availability Timeline</h4>
          <p className="text-[#9CA3AF] text-xs mt-0.5">Click and drag dates to request a booking slot.</p>
        </div>
        
        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider bg-[#141420] border border-white/10 px-3 py-1.5 rounded-2xl">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-400 block"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-400 border border-amber-300 block"></span>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 border border-rose-400 block"></span>
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-500 border border-slate-400 block"></span>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#7C3AED] border border-purple-400 block"></span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* FullCalendar Component */}
      <div className="venue-fullcalendar overflow-hidden rounded-2xl border border-white/10 p-3 bg-[#141420]">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          editable={false}
          selectable={selectable}
          selectMirror={true}
          selectAllow={handleSelectAllow}
          select={handleDateSelect}
          events={events}
          eventClick={(info) => onEventClick && onEventClick(info.event)}
          height="auto"
          dayMaxEvents={true}
          themeSystem="standard"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
          }}
          eventContent={(eventInfo) => {
            return (
              <div className="flex items-center gap-1 p-1 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-bold rounded-lg cursor-pointer">
                <span className="text-white drop-shadow-sm">{eventInfo.event.title}</span>
              </div>
            );
          }}
        />
      </div>

      {/* Global CSS Inject to customize FullCalendar styles with dark theme */}
      <style>{`
        .venue-fullcalendar .fc {
          font-family: inherit;
          font-size: 0.8rem;
          color: #f1f5f9;
        }
        .venue-fullcalendar .fc-theme-standard td,
        .venue-fullcalendar .fc-theme-standard th,
        .venue-fullcalendar .fc-theme-standard .fc-scrollgrid {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .venue-fullcalendar .fc-col-header-cell-cushion {
          color: #9ca3af !important;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 10px;
        }
        .venue-fullcalendar .fc-daygrid-day-number {
          color: #cbd5e1 !important;
          font-weight: 600;
        }
        .venue-fullcalendar .fc-header-toolbar {
          margin-bottom: 1rem !important;
          padding: 0.25rem;
        }
        .venue-fullcalendar .fc-toolbar-title {
          font-size: 1rem !important;
          font-weight: 800 !important;
          color: #ffffff !important;
        }
        .venue-fullcalendar .fc-button {
          background-color: #181825 !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: #e2e8f0 !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          text-transform: capitalize !important;
          padding: 0.35rem 0.65rem !important;
          border-radius: 10px !important;
          box-shadow: none !important;
          transition: all 0.2s ease;
        }
        .venue-fullcalendar .fc-button:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }
        .venue-fullcalendar .fc-button-active {
          background-color: #7C3AED !important;
          border-color: #7C3AED !important;
          color: #ffffff !important;
        }
        .venue-fullcalendar .fc-day-today {
          background-color: rgba(124, 58, 237, 0.1) !important;
        }
        .venue-fullcalendar .fc-day-today .fc-daygrid-day-number {
          color: #ffffff !important;
          font-weight: 800;
          background-color: #7C3AED;
          border-radius: 50%;
          padding: 2px 6px;
        }
        .venue-fullcalendar .fc-event {
          border: none !important;
          border-radius: 8px !important;
          margin: 1px 0 !important;
          padding: 2px 4px !important;
        }
        .venue-fullcalendar .fc-event-main {
          color: white !important;
        }
        /* Custom colors overrides */
        .venue-fullcalendar .fc-event[style*="background-color: yellow"],
        .venue-fullcalendar .fc-event[style*="background-color: rgb(251, 191, 36)"],
        .venue-fullcalendar .fc-event[style*="background-color: amber"] {
          background-color: #f59e0b !important;
          color: white !important;
        }
        .venue-fullcalendar .fc-event[style*="background-color: red"] {
          background-color: #ef4444 !important;
        }
        .venue-fullcalendar .fc-event[style*="background-color: gray"] {
          background-color: #64748b !important;
        }
      `}</style>
    </div>
  );
};

export default VenueCalendar;
