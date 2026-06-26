import React from 'react';
import { Calendar, Clock, Check, X, FileSpreadsheet, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isPaidPlan } from '@/lib/planOverride';
import type { Business, Service, Staff, Booking } from '@/lib/db';

interface BookingsViewProps {
  business: Business;
  bookings: Booking[];
  bookingsMeta: { total: number; page: number; limit: number; totalPages: number };
  bookingsPage: number;
  setBookingsPage: React.Dispatch<React.SetStateAction<number>>;
  isBookingsLoading?: boolean;
  services: Service[];
  staffList: Staff[];
  agendaCollapsed: boolean;
  setAgendaCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  bookingFilter: string;
  setBookingFilter: React.Dispatch<React.SetStateAction<any>>;
  bookingSearch: string;
  setBookingSearch: React.Dispatch<React.SetStateAction<string>>;
  bookingDateFrom: string;
  setBookingDateFrom: React.Dispatch<React.SetStateAction<string>>;
  bookingDateTo: string;
  setBookingDateTo: (val: string) => void;
  setShowAddBookingModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleUpdateBookingStatus: (booking: Booking, status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show") => Promise<void>;
  handleSendReminder: (booking: Booking) => Promise<void>;
  handleSendReviewRequest: (booking: Booking) => Promise<void>;
  handleCSVExport: () => void;
}

export default function BookingsView({
  business,
  bookings,
  bookingsMeta,
  bookingsPage,
  setBookingsPage,
  isBookingsLoading,
  services,
  staffList,
  agendaCollapsed,
  setAgendaCollapsed,
  bookingFilter,
  setBookingFilter,
  bookingSearch,
  setBookingSearch,
  bookingDateFrom,
  setBookingDateFrom,
  bookingDateTo,
  setBookingDateTo,
  setShowAddBookingModal,
  handleUpdateBookingStatus,
  handleSendReminder,
  handleSendReviewRequest,
  handleCSVExport
}: BookingsViewProps) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayBookings = bookings.filter(b => {
    const d = new Date(b.bookingTime);
    return d >= todayStart && d <= todayEnd;
  }).sort((a, b) => new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime());

  const filteredBookings = bookings.filter(b => {
    if (bookingFilter !== 'all' && b.status !== bookingFilter) return false;
    
    if (bookingSearch) {
      const q = bookingSearch.toLowerCase();
      const matchName = b.customerName?.toLowerCase().includes(q);
      const matchPhone = b.customerPhone?.includes(q);
      if (!matchName && !matchPhone) return false;
    }

    if (bookingDateFrom) {
      const dFrom = new Date(bookingDateFrom);
      dFrom.setHours(0,0,0,0);
      if (new Date(b.bookingTime) < dFrom) return false;
    }

    if (bookingDateTo) {
      const dTo = new Date(bookingDateTo);
      dTo.setHours(23,59,59,999);
      if (new Date(b.bookingTime) > dTo) return false;
    }

    return true;
  }).sort((a, b) => new Date(b.bookingTime).getTime() - new Date(a.bookingTime).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* TODAY'S AGENDA VIEW */}
      <div className="glass-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => setAgendaCollapsed(!agendaCollapsed)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={18} style={{ color: '#6366f1' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Today's Schedule</h3>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'var(--primary)', color: 'white', fontWeight: 700 }}>
              {todayBookings.length} {todayBookings.length === 1 ? 'booking' : 'bookings'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 550 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              {agendaCollapsed ? 'Show' : 'Hide'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!agendaCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              {todayBookings.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                  <Clock size={24} style={{ margin: '0 auto 0.5rem auto', opacity: 0.6 }} />
                  <p style={{ fontSize: '0.85rem', margin: 0, fontWeight: 500 }}>No appointments scheduled for today.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {todayBookings.map((bk) => {
                    const svc = services.find(s => s.id === bk.serviceId);
                    const staff = staffList.find(st => st.id === bk.staffId);
                    const bTime = new Date(bk.bookingTime);
                    const formattedTime = bTime.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });
                    
                    const duration = svc?.duration || 30;
                    const endTime = new Date(bTime.getTime() + duration * 60000);
                    const formattedEndTime = endTime.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });

                    return (
                      <div 
                        key={bk.id} 
                        style={{ 
                          border: '1px solid var(--border)', 
                          borderRadius: '8px', 
                          padding: '0.85rem', 
                          background: 'var(--muted-light)',
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          transition: 'all 0.2s ease'
                        }}
                        className="table-row-hover"
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontWeight: 700, fontSize: '0.8rem' }}>
                              <Clock size={12} />
                              <span>{formattedTime} - {formattedEndTime}</span>
                            </div>
                            <span className={`badge ${
                              bk.status === 'confirmed' ? 'badge-success' : 
                              (bk.status === 'pending' ? 'badge-warning' : 
                              (bk.status === 'completed' ? 'badge-primary' : 'badge-danger'))
                            }`} style={{ fontSize: '0.65rem', padding: '1px 5px', textTransform: 'uppercase' }}>
                              {bk.status.replace('_', '-')}
                            </span>
                          </div>

                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.5rem', marginBottom: '0.1rem' }}>
                            {bk.customerName}
                          </h4>
                          <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.4rem' }}>{bk.customerPhone}</div>

                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{svc?.name || 'Deleted Service'}</div>
                            {staff && <div style={{ fontSize: '0.72rem', color: '#a855f7', fontWeight: 500 }}>Staff: {staff.name}</div>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>₹{bk.price}</span>
                          
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {bk.status === 'pending' && (
                              <>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleUpdateBookingStatus(bk, 'confirmed'); }} 
                                  className="btn btn-secondary" 
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem', height: '24px', border: 'none', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700 }}
                                  title="Accept Booking"
                                >
                                  <Check size={10} /> Confirm
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleUpdateBookingStatus(bk, 'cancelled'); }} 
                                  className="btn btn-secondary" 
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem', height: '24px', border: 'none', color: '#ef4444', fontWeight: 700 }}
                                  title="Cancel Booking"
                                >
                                  <X size={10} /> Cancel
                                </button>
                              </>
                            )}
                            {bk.status === 'confirmed' && (
                              <>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleUpdateBookingStatus(bk, 'completed'); }} 
                                  className="btn btn-secondary" 
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem', height: '24px', border: 'none', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontWeight: 700 }}
                                >
                                  ✓ Done
                                </button>
                                {isPaidPlan(business.plan) && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleSendReminder(bk); }} 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem', height: '24px', border: 'none', background: '#25d366', color: 'white', fontWeight: 700 }}
                                    title="Send Reminder"
                                  >
                                    🔔 Remind
                                  </button>
                                )}
                              </>
                            )}
                            {bk.status === 'completed' && isPaidPlan(business.plan) && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleSendReviewRequest(bk); }} 
                                className="btn btn-secondary" 
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem', height: '24px', border: 'none', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', fontWeight: 700 }}
                              >
                                ⭐ Ask Review
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Filter controls and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setBookingFilter(f)}
              style={{ 
                padding: '0.4rem 0.8rem', 
                borderRadius: '8px', 
                border: '1px solid var(--border)',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: bookingFilter === f ? 'var(--primary)' : 'var(--card)',
                color: bookingFilter === f ? 'white' : 'inherit',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {f.replace('_', '-')}
            </button>
          ))}
        </div>

        {/* Right-side action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddBookingModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} /> Add Booking
          </button>
          <button onClick={handleCSVExport} className="btn btn-outline btn-sm">
            <FileSpreadsheet size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Search & Date Filters Control Bar */}
      <div className="glass-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input 
              type="text" 
              placeholder="Search customer name or phone..." 
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 550 }}>Date Range:</span>
            <input 
              type="date" 
              value={bookingDateFrom}
              onChange={(e) => setBookingDateFrom(e.target.value)}
              className="form-input"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', width: 'auto', height: '38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>to</span>
            <input 
              type="date" 
              value={bookingDateTo}
              onChange={(e) => setBookingDateTo(e.target.value)}
              className="form-input"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', width: 'auto', height: '38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {(bookingSearch || bookingDateFrom || bookingDateTo) && (
          <button 
            onClick={() => {
              setBookingSearch('');
              setBookingDateFrom('');
              setBookingDateTo('');
            }}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem', height: '38px', borderRadius: '8px', border: '1px solid var(--border)' }}
          >
            <X size={14} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Bookings Data Table */}
      <div className="glass-card" style={{ padding: 0, overflowX: 'auto', position: 'relative' }}>
        
        {/* Loading Overlay */}
        {isBookingsLoading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255, 255, 255, 0.4)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span className="loader" style={{ width: '30px', height: '30px', border: '3px solid var(--border)', borderBottomColor: 'var(--primary)', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ background: 'var(--background)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Calendar size={32} style={{ color: 'var(--muted)', opacity: 0.5 }} />
            </div>
            <p style={{ fontWeight: 500, fontSize: '1.1rem', marginBottom: '0.25rem' }}>No bookings found</p>
            <p style={{ fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>
              {bookingSearch || bookingFilter !== 'all' || bookingDateFrom || bookingDateTo 
                ? "Try adjusting your filters to see more results."
                : "You don't have any bookings yet. Share your booking link to get started!"
              }
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', opacity: isBookingsLoading ? 0.6 : 1, transition: 'opacity 0.2s ease-in-out' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 600 }}>
                <th style={{ padding: '1rem' }}>Customer</th>
                <th style={{ padding: '1rem' }}>Service Selected</th>
                <th style={{ padding: '1rem' }}>Schedule Time</th>
                <th style={{ padding: '1rem' }}>Bill</th>
                <th style={{ padding: '1rem' }}>Channel</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((bk) => {
                const svc = services.find(s => s.id === bk.serviceId);
                const staff = staffList.find(st => st.id === bk.staffId);
                const formattedTime = new Date(bk.bookingTime).toLocaleString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={bk.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{bk.customerName}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{bk.customerPhone}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>{svc?.name || 'Deleted Service'}</div>
                      {staff && <div style={{ fontSize: '0.75rem', color: '#a855f7' }}>with {staff.name}</div>}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                      {formattedTime}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      ₹{bk.price}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${bk.bookingSource === 'chatbot' ? 'badge-success' : (bk.bookingSource === 'whatsapp_link' ? 'badge-primary' : 'badge-muted')}`}>
                        {bk.bookingSource === 'chatbot' ? '🤖 Bot Flow' : (bk.bookingSource === 'whatsapp_link' ? '📲 WA Redirect' : '✍️ Manual')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${
                        bk.status === 'confirmed' ? 'badge-success' : 
                        (bk.status === 'pending' ? 'badge-warning' : 
                        (bk.status === 'completed' ? 'badge-primary' : 'badge-danger'))
                      }`}>
                        {bk.status.replace('_', '-')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {bk.status === 'pending' && (
                          <>
                            <button onClick={() => handleUpdateBookingStatus(bk, 'confirmed')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: 'var(--accent-light)', color: 'var(--accent-hover)', border: 'none' }} title="Accept Booking">
                              <Check size={12} /> Confirm
                            </button>
                            <button onClick={() => handleUpdateBookingStatus(bk, 'cancelled')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: 'red', border: 'none' }} title="Cancel Booking">
                              <X size={12} /> Cancel
                            </button>
                          </>
                        )}
                        {bk.status === 'confirmed' && (
                          <>
                            <button onClick={() => handleUpdateBookingStatus(bk, 'completed')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', border: 'none' }}>
                              ✓ Done
                            </button>
                            <button onClick={() => handleUpdateBookingStatus(bk, 'no_show')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', border: 'none', color: '#d97706' }}>
                              ⚠️ No-show
                            </button>
                            {isPaidPlan(business.plan) && (
                              <button onClick={() => handleSendReminder(bk)} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#25d366', color: 'white', border: 'none' }} title="Send Manual Reminder">
                                🔔 Remind
                              </button>
                            )}
                          </>
                        )}
                        {bk.status === 'completed' && isPaidPlan(business.plan) && (
                          <button onClick={() => handleSendReviewRequest(bk)} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#eab308', color: 'white', border: 'none' }} title="Ask for Google Review">
                            ⭐ Ask Review
                          </button>
                        )}
                        {bk.status === 'cancelled' && <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Cancelled</span>}
                        {bk.status === 'no_show' && <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Marked No-Show</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        
        {/* Pagination Controls */}
        {bookingsMeta && bookingsMeta.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Showing page {bookingsMeta.page} of {bookingsMeta.totalPages} ({bookingsMeta.total} total bookings)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setBookingsPage(p => Math.max(1, p - 1))}
                disabled={bookingsPage === 1}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <button 
                onClick={() => setBookingsPage(p => Math.min(bookingsMeta.totalPages, p + 1))}
                disabled={bookingsPage >= bookingsMeta.totalPages}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
