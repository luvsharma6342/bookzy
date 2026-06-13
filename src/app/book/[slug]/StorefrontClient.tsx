'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Business, Service, Staff, Booking } from '@/lib/db';
import {
  MapPin,
  Clock,
  Star,
  MessageSquare,
  Languages,
  Sparkles,
  Check,
  Home,
} from 'lucide-react';
import ChatbotSimulator from '@/components/ChatbotSimulator';
import confetti from 'canvas-confetti';
import { isProPlan } from '@/lib/planOverride';

interface Props {
  business: Business;
  initialServices: Service[];
  initialStaff: Staff[];
  initialBookings: Booking[];
}

export default function StorefrontClient({
  business,
  initialServices,
  initialStaff,
  initialBookings,
}: Props) {
  const [services] = useState<Service[]>(initialServices);
  const [staffList] = useState<Staff[]>(initialStaff);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  // Page Language state
  const [isHindi, setIsHindi] = useState(false);

  // Booking Wizard states
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  // Customer details for WhatsApp redirect
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Tab states for Category filter
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Chatbot visibility
  const [showChatbot, setShowChatbot] = useState(false);

  // WhatsApp redirection confirmation
  const [showWAConfirmation, setShowWAConfirmation] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<{
    bookingTime: string;
    customerName: string;
    customerPhone: string;
    price: number;
    serviceId: string;
    staffId: string | null;
  } | null>(null);

  // Refresh bookings helper
  const refreshBookings = async () => {
    try {
      const res = await fetch(`/api/bookings?businessId=${business.id}`);
      if (res.ok) setBookings(await res.json());
    } catch { /* ignore */ }
  };

  // Get categories list
  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category)))];
  const filteredServices =
    activeCategory === 'All' ? services : services.filter((s) => s.category === activeCategory);

  // Generate 7 upcoming dates starting from today
  const getUpcomingDates = () => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      list.push(nextDate);
    }
    return list;
  };
  const upcomingDates = getUpcomingDates();

  // Get time slots for selected date
  const getTimeSlots = (date: Date) => {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hours = (business.workingHours as any)[dayOfWeek];
    if (!hours || hours.closed) return [];

    const slots: string[] = [];
    const [startHour] = hours.open.split(':').map(Number);
    const [endHour] = hours.close.split(':').map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
      const isPM = hour >= 12;
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const suffix = isPM ? 'PM' : 'AM';
      slots.push(`${displayHour}:00 ${suffix}`);
      slots.push(`${displayHour}:30 ${suffix}`);
    }
    return slots;
  };

  // Check if a time slot is already booked
  const isSlotBooked = (timeSlot: string) => {
    if (!selectedDate) return false;
    return bookings.some((b) => {
      const bTime = new Date(b.bookingTime);
      const isSameDay =
        bTime.getDate() === selectedDate.getDate() &&
        bTime.getMonth() === selectedDate.getMonth() &&
        bTime.getFullYear() === selectedDate.getFullYear();
      if (!isSameDay || b.status === 'cancelled') return false;
      const bHour = bTime.getHours();
      const bMin = bTime.getMinutes();
      const bIsPM = bHour >= 12;
      const bDisplayHour = bHour > 12 ? bHour - 12 : bHour === 0 ? 12 : bHour;
      const bSuffix = bIsPM ? 'PM' : 'AM';
      return `${bDisplayHour}:${bMin.toString().padStart(2, '0')} ${bSuffix}` === timeSlot;
    });
  };

  const confirmWhatsAppBooking = async () => {
    if (!pendingBookingData || !selectedDate || !selectedTimeSlot || !selectedService) return;

    try {
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: pendingBookingData.serviceId,
          staffId: pendingBookingData.staffId,
          customerName: pendingBookingData.customerName,
          customerPhone: pendingBookingData.customerPhone,
          bookingTime: pendingBookingData.bookingTime,
          price: pendingBookingData.price,
          bookingSource: 'whatsapp_link',
        }),
      });

      if (!bookingRes.ok) throw new Error('Failed to create booking');

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      refreshBookings();
      setSelectedService(null);
      setSelectedTimeSlot('');
      setCustomerName('');
      setCustomerPhone('');
      setPendingBookingData(null);
      setShowWAConfirmation(false);
    } catch {
      alert('Failed to submit booking request. Please try again.');
    }
  };

  const handleWhatsAppBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTimeSlot || !customerName.trim() || !customerPhone.trim()) {
      alert('Please fill all details before booking.');
      return;
    }

    const bookingTimeObj = new Date(selectedDate);
    const [hoursStr, minutesPart] = selectedTimeSlot.split(':');
    let hrs = parseInt(hoursStr);
    const mins = parseInt(minutesPart.substring(0, 2));
    if (selectedTimeSlot.toLowerCase().includes('pm') && hrs < 12) hrs += 12;
    if (selectedTimeSlot.toLowerCase().includes('am') && hrs === 12) hrs = 0;
    bookingTimeObj.setHours(hrs, mins, 0, 0);

    setPendingBookingData({
      bookingTime: bookingTimeObj.toISOString(),
      customerName,
      customerPhone,
      price: selectedService.price,
      serviceId: selectedService.id,
      staffId: selectedStaff?.id || null,
    });

    const formattedDate = selectedDate.toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
    const waMessage = isHindi
      ? `नमस्ते, मैं Bookze से *${selectedService.name}* बुक करना चाहता हूँ।\n\n📅 तारीख: ${formattedDate}\n⏰ समय: ${selectedTimeSlot}\n👤 नाम: ${customerName}\n📞 फोन: ${customerPhone}`
      : `Hi, I want to book *${selectedService.name}* via Bookze.\n\n📅 Date: ${formattedDate}\n⏰ Time: ${selectedTimeSlot}\n👤 Name: ${customerName}\n📞 Phone: ${customerPhone}`;

    const waLink = `https://wa.me/${business.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMessage)}`;
    window.open(waLink, '_blank');
    setShowWAConfirmation(true);
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>

      {/* Cover Banner */}
      <div style={{ height: '180px', background: 'linear-gradient(135deg, #6366f1 0%, #d8b4fe 100%)', position: 'relative' }}>
        {/* Language Toggle */}
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
          <button
            onClick={() => setIsHindi(!isHindi)}
            style={{ background: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', boxShadow: 'var(--shadow-md)' }}
          >
            <Languages size={14} />
            {isHindi ? 'English' : 'हिंदी'}
          </button>
        </div>
        {/* Back Link */}
        <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
          <Link href="/" style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ← Bookze Home
          </Link>
        </div>
      </div>

      {/* Business Profile Header Card */}
      <div className="container" style={{ marginTop: '-4rem', position: 'relative', zIndex: 5, maxWidth: '800px', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ background: 'white', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: '5rem', height: '5rem', borderRadius: '12px', background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '2rem', boxShadow: 'var(--shadow-md)' }}>
                {business.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>{business.name}</h1>
                <p style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  <span style={{ display: 'inline-flex', padding: '0.1rem 0.4rem', background: '#f1f5f9', borderRadius: '4px', fontWeight: 600, color: '#475569' }}>
                    {business.category}
                  </span>
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#eab308' }}>
                <Star fill="#eab308" size={18} />
                <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{business.rating}</strong>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({business.reviewsCount} reviews)</span>
              </div>
              <span className="badge badge-success" style={{ marginTop: '0.5rem' }}>
                {isHindi ? 'खुला है (Open)' : 'Open Now'}
              </span>
            </div>
          </div>

          <p style={{ color: '#64748b', lineHeight: 1.5, fontSize: '0.95rem' }}>{business.description}</p>

          <div className="storefront-info-grid" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} style={{ color: '#6366f1' }} />
              <span>{business.city}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} style={{ color: '#6366f1' }} />
              <span>{isHindi ? '10:00 सुबह - 08:00 शाम' : '10:00 AM - 08:00 PM'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Core Layout */}
      <main className="container storefront-layout" style={{ maxWidth: '800px', paddingBottom: '6rem' }}>

        {/* Left Column: Services */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="storefront-column">
          <h3 style={{ fontSize: '1.25rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {isHindi ? 'सेवाएं कैटलॉग' : 'Services Catalogue'}
          </h3>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: activeCategory === cat ? '#6366f1' : 'white',
                  color: activeCategory === cat ? 'white' : '#64748b',
                  border: '1px solid #e2e8f0',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Service Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="glass-card"
                style={{ background: 'white', border: selectedService?.id === service.id ? '2px solid #6366f1' : '1px solid #e2e8f0', cursor: 'pointer' }}
                onClick={() => setSelectedService(service)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 650 }}>{service.name}</h4>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.25rem 0' }}>{service.description}</p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span style={{ color: '#6366f1' }}>{service.duration} mins</span>
                      <span style={{ color: '#10b981' }}>₹{service.price}</span>
                    </div>
                  </div>
                  <div style={{ height: '1.5rem', width: '1.5rem', borderRadius: '50%', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: selectedService?.id === service.id ? '#6366f1' : '#cbd5e1', background: selectedService?.id === service.id ? '#6366f1' : 'transparent', color: 'white' }}>
                    {selectedService?.id === service.id && <Check size={12} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Booking Wizard */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="storefront-column">
          <h3 style={{ fontSize: '1.25rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {isHindi ? 'अप्वाइंटमेंट बुक करें' : 'Booking Panel'}
          </h3>

          <div className="glass-card" style={{ background: 'white', position: 'sticky', top: '6rem' }}>
            {!selectedService ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                <Sparkles size={32} style={{ color: '#a855f7', margin: '0 auto 0.75rem auto' }} />
                <p style={{ fontSize: '0.95rem' }}>
                  {isHindi ? 'बुकिंग शुरू करने के लिए पहले बायीं ओर से एक सेवा चुनें।' : 'Select a service from the catalogue to start your booking.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Selected Service */}
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>{isHindi ? 'चुनी हुई सेवा' : 'Selected Service'}</span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 650, marginTop: '0.15rem' }}>{selectedService.name}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.25rem', color: '#64748b' }}>
                    <span>{selectedService.duration} mins</span>
                    <strong>₹{selectedService.price}</strong>
                  </div>
                </div>

                {/* Staff Selection */}
                {staffList.length > 0 && (
                  <div>
                    <label className="form-label">{isHindi ? 'स्टाफ सदस्य चुनें (वैकल्पिक)' : 'Select Staff Member (Optional)'}</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                      <button onClick={() => setSelectedStaff(null)} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', background: selectedStaff === null ? '#6366f1' : 'white', color: selectedStaff === null ? 'white' : '#0f172a', cursor: 'pointer' }}>
                        {isHindi ? 'कोई भी' : 'Any Staff'}
                      </button>
                      {staffList.map((st) => (
                        <button key={st.id} onClick={() => setSelectedStaff(st)} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', background: selectedStaff?.id === st.id ? '#6366f1' : 'white', color: selectedStaff?.id === st.id ? 'white' : '#0f172a', cursor: 'pointer' }}>
                          {st.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date Picker */}
                <div>
                  <label className="form-label">{isHindi ? 'तारीख चुनें' : 'Select Date'}</label>
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginTop: '0.35rem' }}>
                    {upcomingDates.map((date, idx) => {
                      const isSelected = selectedDate?.getDate() === date.getDate() && selectedDate?.getMonth() === date.getMonth();
                      return (
                        <button key={idx} onClick={() => { setSelectedDate(date); setSelectedTimeSlot(''); }}
                          style={{ minWidth: '55px', padding: '0.5rem 0.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center', cursor: 'pointer', background: isSelected ? '#6366f1' : 'white', color: isSelected ? 'white' : '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: isSelected ? 0.85 : 0.6 }}>{date.toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', { weekday: 'short' })}</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{date.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <label className="form-label">{isHindi ? 'समय स्लॉट चुनें' : 'Select Time Slot'}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.35rem' }}>
                      {getTimeSlots(selectedDate).map((slot, idx) => {
                        const isBooked = isSlotBooked(slot);
                        const isSelected = selectedTimeSlot === slot;
                        return (
                          <button key={idx} disabled={isBooked} onClick={() => setSelectedTimeSlot(slot)}
                            style={{ padding: '0.5rem 0.25rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', border: '1px solid #e2e8f0', cursor: isBooked ? 'not-allowed' : 'pointer', background: isSelected ? '#6366f1' : isBooked ? '#fee2e2' : 'white', color: isSelected ? 'white' : isBooked ? '#ef4444' : '#0f172a', borderColor: isSelected ? '#6366f1' : isBooked ? '#fca5a5' : '#e2e8f0', textDecoration: isBooked ? 'line-through' : 'none' }}>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Customer Details Form */}
                {selectedTimeSlot && (
                  <form onSubmit={handleWhatsAppBooking} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{isHindi ? 'आपका नाम' : 'Your Name'}</label>
                      <input type="text" className="form-input" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Ramesh Kumar" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{isHindi ? 'आपका मोबाइल नंबर (WhatsApp)' : 'WhatsApp Phone Number'}</label>
                      <input type="tel" className="form-input" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g. +91 9988776655" />
                    </div>
                    <button type="submit" className="btn btn-whatsapp" style={{ width: '100%', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                      <MessageSquare size={18} />
                      <span>{isHindi ? 'व्हाट्सएप पर पक्का करें' : 'Book on WhatsApp'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Pro Plan Chatbot */}
      {isProPlan(business.plan) && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '2rem', zIndex: 100 }}>
          <button onClick={() => setShowChatbot(true)} className="btn btn-primary" style={{ borderRadius: '50px', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-premium)' }}>
            <span style={{ display: 'inline-block', height: '8px', width: '8px', background: '#10b981', borderRadius: '50%', animation: 'pulse 1.2s infinite' }}></span>
            <span>{isHindi ? 'बुकिंग बॉट से चैट करें' : 'Chat with Booking Bot 💬'}</span>
          </button>
        </div>
      )}

      {/* Chatbot Modal */}
      <AnimatePresence>
        {showChatbot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 999 }}>
            <ChatbotSimulator business={business} services={services} isHindi={isHindi} onClose={() => setShowChatbot(false)} onBookingComplete={() => { refreshBookings(); setTimeout(() => setShowChatbot(false), 3000); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Confirmation Modal */}
      <AnimatePresence>
        {showWAConfirmation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card" style={{ background: 'white', maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: 'var(--shadow-premium)', borderRadius: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(37,211,102,0.1)', color: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <MessageSquare size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{isHindi ? 'व्हाट्सएप बुकिंग की पुष्टि करें' : 'Confirm WhatsApp Booking'}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  {isHindi ? 'हमने नए टैब में व्हाट्सएप खोल दिया है। क्या आपने मर्चेंट को बुकिंग मैसेज भेज दिया है?' : "We have opened WhatsApp in a new tab. Did you click send to deliver your booking details to the merchant?"}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={confirmWhatsAppBooking} className="btn btn-whatsapp" style={{ width: '100%', padding: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <Check size={18} />
                  <span>{isHindi ? 'हाँ, मैंने मैसेज भेज दिया है' : 'Yes, I sent the message'}</span>
                </button>
                <button onClick={() => { setShowWAConfirmation(false); setPendingBookingData(null); }} className="btn btn-outline" style={{ width: '100%', padding: '0.85rem', color: '#64748b', borderColor: '#cbd5e1' }}>
                  <span>{isHindi ? 'नहीं, बुकिंग रद्द करें' : 'No, cancel booking'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .storefront-layout { display: grid; grid-template-columns: 1.1fr 1fr; gap: 1.5rem; }
        .storefront-info-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
        @media (min-width: 640px) { .storefront-info-grid { grid-template-columns: 1.2fr 1fr; gap: 1rem; } }
        @media (max-width: 768px) { .storefront-layout { display: flex; flex-direction: column; gap: 1.5rem; } .storefront-column { grid-column: span 2; } }
      `}</style>
    </div>
  );
}
