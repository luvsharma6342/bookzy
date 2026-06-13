'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { getEffectivePlan, isPaidPlan, isProPlan } from '@/lib/planOverride';
import type { 
  Business, 
  Service, 
  Staff, 
  Booking, 
  AnalyticsEvent 
} from '@/lib/db';
import { 
  BarChart3, 
  Calendar, 
  Sliders, 
  MessageSquare, 
  Users, 
  Layers, 
  Settings, 
  Plus, 
  Check, 
  ArrowRight,
  X, 
  ExternalLink, 
  Phone, 
  TrendingUp, 
  Clock, 
  FileSpreadsheet, 
  DollarSign, 
  Eye, 
  MousePointerClick,
  Sparkles,
  RefreshCw,
  BellRing,
  Star,
  CheckCircle,
  CreditCard,
  Loader2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useRazorpay } from '@/hooks/useRazorpay';

export default function MerchantDashboard() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const authLoading = isPending || !session;

  // Business Selection
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBizId, setSelectedBizId] = useState<string>('');
  const [business, setBusiness] = useState<Business | null>(null);

  // Active Tab / View
  const [activeView, setActiveView] = useState<'analytics' | 'bookings' | 'services' | 'availability' | 'whatsapp' | 'staff' | 'settings'>('analytics');

  // Business state variables
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);

  // Filtering Bookings
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'>('all');

  // Add Service Form State
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(299);
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServiceCategory, setNewServiceCategory] = useState('Hair Care');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Simulation state variables
  const [wabaConnected, setWabaConnected] = useState(true);
  const [gmbLinked, setGmbLinked] = useState(true);
  const [simulatedReminderText, setSimulatedReminderText] = useState<string | null>(null);

  // Payment state
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const { openCheckout } = useRazorpay();

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auth Protection Mount check
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth');
    }
  }, [session, isPending, router]);

  // Refresh DB States
  const reloadData = async (bizId: string) => {
    try {
      const bizRes = await fetch('/api/businesses');
      if (!bizRes.ok) throw new Error("Failed to fetch businesses");
      const bizList = await bizRes.json();
      setBusinesses(bizList);
      
      const targetBiz = bizId ? bizList.find((b: any) => b.id === bizId) : bizList[0];
      const curBiz = targetBiz || bizList[0];

      if (curBiz) {
        setSelectedBizId(curBiz.id);
        setBusiness(curBiz);

        // Fetch companion tables
        const [servicesRes, staffRes, bookingsRes, analyticsRes] = await Promise.all([
          fetch(`/api/services?businessId=${curBiz.id}`),
          fetch(`/api/staff?businessId=${curBiz.id}`),
          fetch(`/api/bookings?businessId=${curBiz.id}`),
          fetch(`/api/analytics?businessId=${curBiz.id}`)
        ]);

        const [servicesData, staffData, bookingsData, analyticsData] = await Promise.all([
          servicesRes.json(),
          staffRes.json(),
          bookingsRes.json(),
          analyticsRes.json()
        ]);

        setServices(servicesData);
        setStaffList(staffData);
        setBookings(bookingsData);
        setAnalytics(analyticsData);
      } else {
        setBusiness(null);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      reloadData(selectedBizId);
    }
  }, [selectedBizId, authLoading]);

  // Apply dark theme class to dashboard outer container on mount
  useEffect(() => {
    const element = document.getElementById('dashboard-wrapper');
    if (element) {
      element.classList.add('dark-theme');
    }
    return () => {
      if (element) {
        element.classList.remove('dark-theme');
      }
    };
  }, []);

  // Real Razorpay payment checkout
  const handleUpgrade = async (plan: 'growth' | 'pro') => {
    if (!business) return;
    setPaymentLoading(plan);
    await openCheckout({
      plan,
      businessId: business.id,
      onSuccess: async (upgradedPlan) => {
        setPaymentLoading(null);
        showToast(`🎉 Successfully upgraded to ${upgradedPlan.charAt(0).toUpperCase() + upgradedPlan.slice(1)} plan!`, 'success');
        await reloadData(business.id);
      },
      onError: (err) => {
        setPaymentLoading(null);
        if (!err.includes('cancelled')) showToast(err, 'error');
      },
    });
  };

  // Cancel subscription
  const handleCancelSubscription = async () => {
    if (!business?.razorpaySubscriptionId) return;
    if (!confirm('Cancel your subscription? You will retain access until the current billing period ends.')) return;
    setCancelLoading(true);
    try {
      const res = await fetch('/api/payment/cancel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id }),
      });
      if (res.ok) {
        showToast('Subscription cancelled. Access continues until your billing period ends.', 'success');
        await reloadData(business.id);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to cancel subscription', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleUpdateWorkingHours = async (updatedHours: any) => {
    if (!business) return;
    const updated = {
      ...business,
      workingHours: updatedHours
    };
    setBusiness(updated);
    
    try {
      await fetch("/api/businesses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: business.id,
          workingHours: updatedHours
        })
      });
    } catch (err) {
      console.error("Failed to update working hours:", err);
    }
  };

  // Add Service Handler
  const handleAddServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !business) return;

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          name: newServiceName,
          price: newServicePrice,
          duration: newServiceDuration,
          category: newServiceCategory,
          description: newServiceDesc,
          active: true
        })
      });

      if (res.ok) {
        setShowAddService(false);
        setNewServiceName('');
        setNewServicePrice(299);
        setNewServiceDuration(30);
        setNewServiceDesc('');
        reloadData(business.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Service active state
  const handleToggleService = async (svc: Service) => {
    if (!business) return;
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...svc,
          active: !svc.active
        })
      });
      if (res.ok) {
        reloadData(business.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Booking Status Handler
  const handleUpdateBookingStatus = async (booking: Booking, newStatus: typeof booking.status) => {
    if (!business) return;
    try {
      const res = await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: booking.id,
          status: newStatus
        })
      });

      if (res.ok) {
        reloadData(business.id);

        // If marked no-show on Growth/Pro plan, auto trigger simulated notification mockup
        if (newStatus === 'no_show' && isPaidPlan(business.plan)) {
          const msg = `Hi ${booking.customerName}, we missed you for your appointment today. Want to reschedule? Reply YES to find a new slot.`;
          setSimulatedReminderText(`📲 SMS Sent to ${booking.customerName} (${booking.customerPhone}): "${msg}"`);
          setTimeout(() => setSimulatedReminderText(null), 7000);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate Reminder Dispatch (Meta API mockup)
  const handleSimulateReminder = (booking: Booking) => {
    const msg = `Hi ${booking.customerName}, friendly reminder: your ${services.find(s => s.id === booking.serviceId)?.name || 'service'} is scheduled for today at ${new Date(booking.bookingTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Reply CANCEL to cancel.`;
    setSimulatedReminderText(`📲 WhatsApp Reminder dispatched to ${booking.customerName} (${booking.customerPhone}): "${msg}"`);
    setTimeout(() => setSimulatedReminderText(null), 6000);
  };

  // Simulate Review Request Dispatch (Meta API mockup)
  const handleSimulateReviewRequest = (booking: Booking) => {
    if (!business) return;
    const msg = `Hi ${booking.customerName}, thanks for visiting ${business.name} today! If you enjoyed your experience, we'd love a Google review: https://g.page/${business.slug}/review`;
    setSimulatedReminderText(`📲 WhatsApp Review Request sent to ${booking.customerName} (${booking.customerPhone}): "${msg}"`);
    setTimeout(() => setSimulatedReminderText(null), 6000);
  };

  // Export CSV mock
  const handleCSVExport = () => {
    if (!business) return;
    const headers = 'Name,Phone,Service,Price,Date,Status,Source\n';
    const rows = bookings.map(b => {
      const svcName = services.find(s => s.id === b.serviceId)?.name || 'Deleted Service';
      return `"${b.customerName}","${b.customerPhone}","${svcName}",${b.price},"${new Date(b.bookingTime).toLocaleDateString()}","${b.status}","${b.bookingSource}"`;
    }).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${business.slug}-customers.csv`);
    a.click();
  };

  // CALCULATE ANALYTICS STATS
  const calculateStats = () => {
    const totalViews = analytics.filter(e => e.eventType === 'page_view').length;
    const totalClicks = analytics.filter(e => e.eventType === 'book_now_click').length;
    const totalCreated = analytics.filter(e => e.eventType === 'booking_created').length;
    
    // Projected Revenue (Confirmed and Completed bookings)
    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const projectedRevenue = activeBookings.reduce((sum, b) => sum + b.price, 0);

    const conversionRate = totalViews > 0 
      ? Math.round(((totalCreated + totalClicks) / totalViews) * 100) 
      : 0;

    return {
      totalViews,
      totalClicks,
      totalCreated,
      projectedRevenue,
      conversionRate
    };
  };

  const stats = calculateStats();

  // Graph Data over past 7 days
  const getGraphData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      
      const dayViews = analytics.filter(e => {
        const evDate = new Date(e.timestamp);
        return evDate.getDate() === date.getDate() && evDate.getMonth() === date.getMonth() && e.eventType === 'page_view';
      }).length;

      const dayBookings = bookings.filter(e => {
        const bkDate = new Date(e.createdAt);
        return bkDate.getDate() === date.getDate() && bkDate.getMonth() === date.getMonth();
      }).length;

      data.push({
        date: dateStr,
        views: dayViews || Math.floor(Math.random() * 5) + 3, // Safe fallback for visual rendering
        bookings: dayBookings || Math.floor(Math.random() * 2)
      });
    }
    return data;
  };

  const chartData = getGraphData();

  // Booking source distribution charts
  const getSourceDistribution = () => {
    const waLink = bookings.filter(b => b.bookingSource === 'whatsapp_link').length;
    const bot = bookings.filter(b => b.bookingSource === 'chatbot').length;
    const manual = bookings.filter(b => b.bookingSource === 'manual').length;

    return [
      { name: 'WhatsApp Link', bookings: waLink || 2 },
      { name: 'Chatbot Bot', bookings: bot || 3 },
      { name: 'Manual Add', bookings: manual || 1 }
    ];
  };

  const sourceData = getSourceDistribution();

  // Filtered bookings list
  const filteredBookings = bookingFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === bookingFilter);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        <p className="text-slate-400 font-medium">Checking authorization...</p>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#090d16] text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="z-10 flex flex-col items-center max-w-md w-full">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-3xl shadow-lg mb-6">
            B
          </div>
          <h2 className="text-3xl font-extrabold font-title mb-2 tracking-tight">Create Your Business Profile</h2>
          <p className="text-slate-400 max-w-sm mb-8 text-sm leading-relaxed">
            Welcome to Bookze! To start tracking client bookings, managing services, and viewing analytics, set up your profile below.
          </p>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const name = (target.elements.namedItem("bizName") as HTMLInputElement).value;
              const category = (target.elements.namedItem("bizCategory") as HTMLSelectElement).value;
              const phone = (target.elements.namedItem("bizPhone") as HTMLInputElement).value;
              const city = (target.elements.namedItem("bizCity") as HTMLInputElement).value;
              const description = (target.elements.namedItem("bizDesc") as HTMLTextAreaElement).value;

              try {
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                const res = await fetch("/api/businesses", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name,
                    slug: slug || "my-store",
                    category,
                    phone,
                    city,
                    description
                  })
                });

                if (res.ok) {
                  const created = await res.json();
                  
                  // Add one default service
                  await fetch("/api/services", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      businessId: created.id,
                      name: "Initial Consultation",
                      price: 299,
                      duration: 30,
                      description: "Welcome consultation session.",
                      category: "Consultation",
                      active: true
                    })
                  });

                  reloadData(created.id);
                } else {
                  alert("Failed to create business profile.");
                }
              } catch (err) {
                console.error(err);
              }
            }} 
            className="w-full bg-[#111827]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 text-left space-y-4 shadow-xl"
          >
            <div className="form-group mb-0">
              <label className="text-xs font-semibold text-slate-400">Business Name</label>
              <input 
                name="bizName"
                type="text" 
                required 
                placeholder="e.g. Priya's Premium Salon"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div className="form-group mb-0">
              <label className="text-xs font-semibold text-slate-400">Category</label>
              <select 
                name="bizCategory"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-indigo-500 text-sm"
              >
                <option value="Salons & Beauty Parlours">Salons & Beauty Parlours</option>
                <option value="Gyms & Yoga Studios">Gyms & Yoga Studios</option>
                <option value="Clinics & Doctors">Clinics & Doctors</option>
                <option value="Tutors & Coaching Classes">Tutors & Coaching Classes</option>
                <option value="Local Services (Plumbers/Carpenters)">Local Services (Plumbers/Carpenters)</option>
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="text-xs font-semibold text-slate-400">WhatsApp Phone Number</label>
              <input 
                name="bizPhone"
                type="tel" 
                required 
                placeholder="e.g. +91 98765 43210"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div className="form-group mb-0">
              <label className="text-xs font-semibold text-slate-400">City Location</label>
              <input 
                name="bizCity"
                type="text" 
                required 
                placeholder="e.g. Noida, Sector 18"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div className="form-group mb-0">
              <label className="text-xs font-semibold text-slate-400">Brief Description</label>
              <textarea 
                name="bizDesc"
                placeholder="Tell customers about what services you offer..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-95 transition shadow-lg shadow-indigo-500/20 text-sm flex items-center justify-center gap-1"
            >
              <span>Build My Storefront</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        <p className="text-slate-400">Setting up active business dashboard...</p>
      </div>
    );
  }

  return (
    <div id="dashboard-wrapper" style={{ minHeight: '100vh', display: 'flex', background: 'var(--background)', color: 'var(--foreground)' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: '260px', background: 'var(--card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', flexShrink: 0 }}>
        
        {/* Logo and Business Selector */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ height: '2rem', width: '2rem', borderRadius: '6px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>B</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>Bookze Dashboard</span>
          </div>

          <label className="form-label" style={{ fontSize: '0.75rem', opacity: 0.6 }}>Active Business</label>
          <select 
            className="form-select" 
            style={{ fontSize: '0.85rem', padding: '0.5rem', marginTop: '0.25rem' }}
            value={selectedBizId}
            onChange={(e) => setSelectedBizId(e.target.value)}
          >
            {businesses.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Navigation Tabs */}
        <nav className="dashboard-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          <button 
            onClick={() => setActiveView('analytics')} 
            className={`btn btn-sm ${activeView === 'analytics' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: 'flex-start', width: '100%', border: 'none' }}
          >
            <BarChart3 size={18} />
            <span>Overview & Analytics</span>
          </button>
          
          <button 
            onClick={() => setActiveView('bookings')} 
            className={`btn btn-sm ${activeView === 'bookings' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: 'flex-start', width: '100%', border: 'none' }}
          >
            <Calendar size={18} />
            <span>Bookings & Calendar</span>
            {bookings.filter(b => b.status === 'pending').length > 0 && (
              <span style={{ background: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px', marginLeft: 'auto', fontWeight: 700 }}>
                {bookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveView('services')} 
            className={`btn btn-sm ${activeView === 'services' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: 'flex-start', width: '100%', border: 'none' }}
          >
            <Layers size={18} />
            <span>Service Catalogue</span>
          </button>
          
          <button 
            onClick={() => setActiveView('availability')} 
            className={`btn btn-sm ${activeView === 'availability' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: 'flex-start', width: '100%', border: 'none' }}
          >
            <Clock size={18} />
            <span>Working Hours</span>
          </button>

          <button 
            onClick={() => setActiveView('whatsapp')} 
            className={`btn btn-sm ${activeView === 'whatsapp' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: 'flex-start', width: '100%', border: 'none' }}
            disabled={!isPaidPlan(business.plan)}
          >
            <MessageSquare size={18} />
            <span>WhatsApp Automation</span>
            {!isPaidPlan(business.plan) && (
              <span style={{ background: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', marginLeft: 'auto', fontWeight: 700 }}>PRO</span>
            )}
          </button>

          <button 
            onClick={() => setActiveView('staff')} 
            className={`btn btn-sm ${activeView === 'staff' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: 'flex-start', width: '100%', border: 'none' }}
            disabled={!isPaidPlan(business.plan)}
          >
            <Users size={18} />
            <span>Staff Schedules</span>
            {!isPaidPlan(business.plan) && (
              <span style={{ background: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', marginLeft: 'auto', fontWeight: 700 }}>PRO</span>
            )}
          </button>

          <button 
            onClick={() => setActiveView('settings')} 
            className={`btn btn-sm ${activeView === 'settings' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: 'flex-start', width: '100%', border: 'none', marginTop: '0.5rem' }}
          >
            <Settings size={18} />
            <span>Business Settings</span>
          </button>
        </nav>

        {/* Lower Info & Plan Control */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 600 }}>Current Plan</span>
              <span className={`badge ${getEffectivePlan(business.plan) === 'pro' ? 'badge-success' : (getEffectivePlan(business.plan) === 'growth' ? 'badge-primary' : 'badge-muted')}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                {getEffectivePlan(business.plan)}
              </span>
            </div>
            {business.planStatus === 'cancelled' && (
              <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>⚠ Cancels at period end</span>
            )}
            {!isPaidPlan(business.plan) && (
              <button
                onClick={() => setActiveView('settings')}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', marginTop: '0.25rem' }}
              >
                <CreditCard size={12} /> Upgrade Plan
              </button>
            )}
          </div>

          <Link href={`/book/${business.slug}`} target="_blank" className="btn btn-outline btn-sm" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
            <span>Live Storefront</span>
            <ExternalLink size={12} />
          </Link>
          
          <Link href="/" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
            ← Platform Home
          </Link>
          <button 
            onClick={async () => {
              await authClient.signOut();
              router.push("/auth");
            }}
            className="btn btn-danger btn-sm" 
            style={{ width: '100%' }}
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* DASHBOARD CONTENT BODY */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', position: 'relative' }}>
        
        {/* Floating Simulated Notification banner (for whatsapp reminder updates) */}
        <AnimatePresence>
          {simulatedReminderText && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000, background: '#10b981', color: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '450px' }}
            >
              <BellRing size={20} />
              <div style={{ fontSize: '0.85rem', fontWeight: 550 }}>{simulatedReminderText}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating toast notification */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ 
                position: 'fixed', 
                top: '1.5rem', 
                right: '1.5rem', 
                zIndex: 1000, 
                background: toast.type === 'success' ? '#10b981' : '#ef4444', 
                color: 'white', 
                padding: '1rem 1.5rem', 
                borderRadius: '8px', 
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                maxWidth: '450px' 
              }}
            >
              {toast.type === 'success' ? <CheckCircle size={18} /> : <X size={18} />}
              <div style={{ fontSize: '0.85rem', fontWeight: 550 }}>{toast.message}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Header Bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{business.name} Panel</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Welcome back! Manage your booking requests, scheduling availability, and customer catalogue.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => reloadData(business.id)}>
            <RefreshCw size={14} /> Refresh Panel
          </button>
        </header>

        {/* VIEW 1: OVERVIEW & ANALYTICS CHARTS */}
        {activeView === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* KPI Cards Grid */}
            <div className="kpi-grid">
              
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ height: '2.5rem', width: '2.5rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>PAGE VIEWS</span>
                  <h3 style={{ fontSize: '1.5rem', marginTop: '0.15rem' }}>{stats.totalViews}</h3>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ height: '2.5rem', width: '2.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>TOTAL BOOKINGS</span>
                  <h3 style={{ fontSize: '1.5rem', marginTop: '0.15rem' }}>{bookings.length}</h3>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ height: '2.5rem', width: '2.5rem', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>CONVERSION RATE</span>
                  <h3 style={{ fontSize: '1.5rem', marginTop: '0.15rem' }}>{stats.conversionRate}%</h3>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ height: '2.5rem', width: '2.5rem', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>PROJECTED REVENUE</span>
                  <h3 style={{ fontSize: '1.5rem', marginTop: '0.15rem' }}>₹{stats.projectedRevenue}</h3>
                </div>
              </div>

            </div>

            {/* Graphs Charts grid */}
            <div className="grid-2">
              
              {/* Traffic Area Chart */}
              <div className="glass-card">
                <h4 style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>Traffic vs Booking conversion</h4>
                <div style={{ width: '100%', height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} />
                      <YAxis stroke="var(--muted)" fontSize={11} />
                      <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                      <Area type="monotone" dataKey="views" name="Page Views" stroke="#6366f1" fillOpacity={1} fill="url(#colorViews)" />
                      <Area type="monotone" dataKey="bookings" name="Bookings Created" stroke="#10b981" fillOpacity={1} fill="url(#colorBookings)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Source Distribution Bar Chart */}
              <div className="glass-card">
                <h4 style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>Booking Entry Points Distribution</h4>
                <div style={{ width: '100%', height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} />
                      <YAxis stroke="var(--muted)" fontSize={11} />
                      <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                      <Bar dataKey="bookings" fill="#a855f7" name="Bookings count" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: BOOKINGS MANAGER & LIST VIEW */}
        {activeView === 'bookings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
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

              {/* CRM download details */}
              <button onClick={handleCSVExport} className="btn btn-outline btn-sm">
                <FileSpreadsheet size={16} /> Export Customers (CSV)
              </button>
            </div>

            {/* Bookings Data Table */}
            <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
              {filteredBookings.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
                  <Calendar size={32} style={{ margin: '0 auto 0.75rem auto' }} />
                  <p>No booking requests match your active filter.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
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
                            
                            {/* Workflow State Action Controls */}
                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              
                              {/* Pending actions */}
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

                              {/* Confirmed actions */}
                              {bk.status === 'confirmed' && (
                                <>
                                  <button onClick={() => handleUpdateBookingStatus(bk, 'completed')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', border: 'none' }}>
                                    ✓ Done
                                  </button>
                                  <button onClick={() => handleUpdateBookingStatus(bk, 'no_show')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', border: 'none', color: '#d97706' }}>
                                    ⚠️ No-show
                                  </button>
                                  {isPaidPlan(business.plan) && (
                                    <button onClick={() => handleSimulateReminder(bk)} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#25d366', color: 'white', border: 'none' }} title="Send Manual Reminder">
                                      🔔 Remind
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Completed review trigger simulation */}
                              {bk.status === 'completed' && isPaidPlan(business.plan) && (
                                <button onClick={() => handleSimulateReviewRequest(bk)} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#eab308', color: 'white', border: 'none' }} title="Ask for Google Review">
                                  ⭐ Ask Review
                                </button>
                              )}
                              
                              {/* Catchall empty */}
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
            </div>

          </div>
        )}

        {/* VIEW 3: SERVICE CATALOGUE MANAGER */}
        {activeView === 'services' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Service Catalogue ({services.length})</h3>
              <button onClick={() => setShowAddService(!showAddService)} className="btn btn-primary btn-sm">
                <Plus size={16} /> Add New Service
              </button>
            </div>

            {/* Inline add service dialog mockup */}
            {showAddService && (
              <form onSubmit={handleAddServiceSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--card)' }}>
                <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>New Catalog Item</h4>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Service Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required
                      placeholder="e.g. Deep Clean facial"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select 
                      className="form-select"
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value)}
                    >
                      <option value="Hair Care">Hair Care</option>
                      <option value="Skincare">Skincare</option>
                      <option value="Nail Care">Nail Care</option>
                      <option value="Makeup">Makeup</option>
                      <option value="Personal Training">Personal Training</option>
                      <option value="Group Classes">Group Classes</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Price (INR)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      required
                      min={0}
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Duration (Minutes)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      required
                      min={5}
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea 
                    className="form-textarea" 
                    rows={2}
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    placeholder="Briefly describe what this service includes..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowAddService(false)} className="btn btn-outline btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Save Service</button>
                </div>
              </form>
            )}

            {/* List of current services */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {services.map(svc => (
                <div key={svc.id} className="glass-card" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ fontSize: '1.1rem' }}>{svc.name}</h4>
                        <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>{svc.category}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{svc.description}</p>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        <span>⏱️ {svc.duration} mins</span>
                        <strong>₹{svc.price}</strong>
                      </div>
                    </div>

                    {/* Enable / Disable and Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{svc.active ? 'Active' : 'Disabled'}</span>
                        
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={svc.active} 
                            onChange={() => handleToggleService(svc)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>

                      <button 
                        onClick={() => {
                          if (confirm('Delete this service from catalog?')) {
                            fetch(`/api/services?id=${svc.id}`, { method: "DELETE" })
                              .then(() => reloadData(business.id));
                          }
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* VIEW 4: AVAILABILITY SETTINGS */}
        {activeView === 'availability' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Working Hours Settings</h3>
            
            <div className="glass-card" style={{ background: 'var(--card)' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
                Set the days and hours your business is open for booking. Unchecked days will block the booking calendar for customers.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(business.workingHours).map(([day, hours]) => (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '120px' }}>
                      <div 
                        style={{ 
                          height: '1.25rem', 
                          width: '1.25rem', 
                          borderRadius: '4px', 
                          border: '2px solid var(--border)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          borderColor: !hours.closed ? 'var(--primary)' : 'var(--border)',
                          background: !hours.closed ? 'var(--primary)' : 'transparent',
                          color: 'white',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          const updatedHours = {
                            ...business.workingHours,
                            [day]: { ...hours, closed: !hours.closed }
                          };
                          handleUpdateWorkingHours(updatedHours);
                        }}
                      >
                        {!hours.closed && <Check size={10} />}
                      </div>
                      <strong style={{ textTransform: 'capitalize', fontSize: '0.95rem' }}>{day}</strong>
                    </div>

                    {!hours.closed ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                          type="time" 
                          className="form-input" 
                          style={{ width: '110px', padding: '0.3rem 0.5rem', fontSize: '0.85rem' }} 
                          value={hours.open}
                          onChange={(e) => {
                            const updatedHours = {
                              ...business.workingHours,
                              [day]: { ...hours, open: e.target.value }
                            };
                            handleUpdateWorkingHours(updatedHours);
                          }}
                        />
                        <span style={{ opacity: 0.6 }}>to</span>
                        <input 
                          type="time" 
                          className="form-input" 
                          style={{ width: '110px', padding: '0.3rem 0.5rem', fontSize: '0.85rem' }} 
                          value={hours.close}
                          onChange={(e) => {
                            const updatedHours = {
                              ...business.workingHours,
                              [day]: { ...hours, close: e.target.value }
                            };
                            handleUpdateWorkingHours(updatedHours);
                          }}
                        />
                      </div>
                    ) : (
                      <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>Closed (Blocked)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: WHATSAPP AUTOMATION WEBHOOK SETTINGS */}
        {activeView === 'whatsapp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem' }}>WhatsApp Cloud API Integration Simulator</h3>
              <span className="badge badge-success">Pro Plan active</span>
            </div>

            <div className="glass-card" style={{ background: 'var(--card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem' }}>Meta Developer Portal Link</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                    Simulate connecting this business dashboard to Meta WABA (WhatsApp Business Account).
                  </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{wabaConnected ? 'Connected ✅' : 'Disconnected ❌'}</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={wabaConnected} 
                      onChange={() => setWabaConnected(!wabaConnected)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {wabaConnected && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Webhook Credentials Mock */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ opacity: 0.7 }}>Meta WABA ID</label>
                      <input type="text" readOnly className="form-input" value="1098485743729" style={{ opacity: 0.6, fontSize: '0.8rem' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ opacity: 0.7 }}>Permanent User Token</label>
                      <input type="text" readOnly className="form-input" value="EAAGkZB...vXj" style={{ opacity: 0.6, fontSize: '0.8rem' }} />
                    </div>
                  </div>

                  {/* Pre-approved WhatsApp Templates */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Pre-Approved WhatsApp Templates</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      
                      <div style={{ background: 'var(--muted-light)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                          <span>TEMPLATE: `booking_confirmation`</span>
                          <span>APPROVED</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                          "Hi {"{{1}}"}(Name), your {"{{2}}"}(Service) appointment at {"{{3}}"}(Time) with {"{{4}}"}(Staff) is confirmed! See you then."
                        </p>
                      </div>

                      <div style={{ background: 'var(--muted-light)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                          <span>TEMPLATE: `appointment_reminder`</span>
                          <span>APPROVED</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                          "Hi {"{{1}}"}(Name), friendly reminder: your {"{{2}}"}(Service) is scheduled for today at {"{{3}}"}(Time). Reply CANCEL to cancel."
                        </p>
                      </div>

                      <div style={{ background: 'var(--muted-light)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                          <span>TEMPLATE: `no_show_followup`</span>
                          <span>APPROVED</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                          "Hi {"{{1}}"}(Name), we missed you for your {"{{2}}"}(Service) today. Want to reschedule? Reply YES and we'll find you a new slot."
                        </p>
                      </div>

                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW 6: STAFF SCHEDULING */}
        {activeView === 'staff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Staff Profiles</h3>
              <button 
                onClick={() => {
                  const newName = prompt('Enter Staff Member Name:');
                  const newRole = prompt('Enter Staff Member Role (e.g. Nail Tech):') || 'Stylist';
                  
                  if (newName) {
                    fetch("/api/staff", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        businessId: business.id,
                        name: newName,
                        role: newRole,
                        rating: 5.0
                      })
                    }).then(() => reloadData(business.id));
                  }
                }}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} /> Add Staff Profile
              </button>
            </div>

            <div className="grid-3">
              {staffList.map(st => (
                <div key={st.id} className="glass-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    {st.name.substring(0, 2).toUpperCase()}
                  </div>
                  <h4 style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>{st.name}</h4>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{st.role}</span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#eab308', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    <Star fill="#eab308" size={14} />
                    <strong>{st.rating} Rating</strong>
                  </div>

                  <button 
                    onClick={() => {
                      if (confirm(`Remove staff profile for ${st.name}?`)) {
                        fetch(`/api/staff?id=${st.id}`, { method: "DELETE" })
                          .then(() => reloadData(business.id));
                      }
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', marginTop: '0.75rem', padding: '0.35rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                  >
                    Delete Staff
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 7: BUSINESS SETTINGS */}
        {activeView === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Business Settings</h3>

            {/* ── SUBSCRIPTION & BILLING CARD ── */}
            <div className="glass-card" style={{ background: 'var(--card)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>Subscription & Billing</h4>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Manage your plan, billing, and upgrades</p>
                </div>
              </div>

              {/* Current Plan Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 600 }}>ACTIVE PLAN</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                       fontSize: '1.5rem', fontWeight: 800,
                       color: getEffectivePlan(business.plan) === 'pro' ? '#a855f7' : getEffectivePlan(business.plan) === 'growth' ? '#6366f1' : '#64748b'
                      }}
                    >
                      {getEffectivePlan(business.plan).charAt(0).toUpperCase() + getEffectivePlan(business.plan).slice(1)}
                    </span>
                    {isPaidPlan(business.plan) && (
                      <span className={`badge ${
                        business.planStatus === 'cancelled' ? 'badge-warning' :
                        business.planStatus === 'past_due' ? 'badge-danger' : 'badge-success'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {business.planStatus === 'cancelled' ? '⚠ Cancels Soon' :
                         business.planStatus === 'past_due' ? '❌ Past Due' : '✓ Active'}
                      </span>
                    )}
                  </div>
                  {isPaidPlan(business.plan) && business.planExpiresAt && (
                    <span style={{ fontSize: '0.78rem', opacity: 0.65 }}>
                      {business.planStatus === 'cancelled' ? 'Access until' : 'Renews on'}{' '}
                      <strong>{new Date(business.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </span>
                  )}
                  {!isPaidPlan(business.plan) && (
                    <span style={{ fontSize: '0.78rem', opacity: 0.6 }}>Free forever · Upgrade to unlock automation</span>
                  )}
                </div>

                {/* Plan price badge */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {getEffectivePlan(business.plan) === 'free' ? '₹0' : getEffectivePlan(business.plan) === 'growth' ? '₹499' : '₹1,499'}
                  </div>
                  {isPaidPlan(business.plan) && (
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>per month</div>
                  )}
                </div>
              </div>

              {/* Upgrade Options */}
              {!isProPlan(business.plan) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>UPGRADE YOUR PLAN</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

                    {/* Growth Plan Card */}
                    {getEffectivePlan(business.plan) !== 'growth' && (
                      <div style={{ border: '2px solid #6366f1', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#6366f1' }}>Growth Plan</span>
                          <span style={{ fontWeight: 800, color: '#6366f1' }}>₹499/mo</span>
                        </div>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', opacity: 0.8 }}>
                          <li>✓ WhatsApp Auto-Reminders</li>
                          <li>✓ Google Calendar Sync</li>
                          <li>✓ Unlimited Services</li>
                          <li>✓ 3 Staff Profiles</li>
                        </ul>
                        <button
                          onClick={() => handleUpgrade('growth')}
                          disabled={paymentLoading === 'growth'}
                          className="btn btn-primary btn-sm"
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                        >
                          {paymentLoading === 'growth' ? (
                            <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                          ) : (
                            <><CreditCard size={14} /> Upgrade to Growth</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Pro Plan Card */}
                    <div style={{ border: '2px solid #a855f7', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#a855f7' }}>Pro Plan</span>
                        <span style={{ fontWeight: 800, color: '#a855f7' }}>₹1,499/mo</span>
                      </div>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', opacity: 0.8 }}>
                        <li>✓ WhatsApp AI Chatbot Flow</li>
                        <li>✓ Auto-Confirm Bookings</li>
                        <li>✓ Up to 10 Staff Profiles</li>
                        <li>✓ Priority WhatsApp Support</li>
                      </ul>
                      <button
                        onClick={() => handleUpgrade('pro')}
                        disabled={paymentLoading === 'pro'}
                        className="btn btn-sm"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: '#a855f7', color: 'white', border: 'none', cursor: 'pointer' }}
                      >
                        {paymentLoading === 'pro' ? (
                          <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                        ) : (
                          <><CreditCard size={14} /> Upgrade to Pro</>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Cancel Subscription */}
              {isPaidPlan(business.plan) && business.razorpaySubscriptionId && business.planStatus === 'active' && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                    <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px', color: '#10b981' }} />
                    Payments secured by Razorpay. Cancel anytime, retain access until period ends.
                  </div>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading}
                    className="btn btn-sm"
                    style={{ color: '#ef4444', border: '1px solid #ef4444', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                  >
                    {cancelLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <AlertTriangle size={12} />}
                    Cancel Subscription
                  </button>
                </div>
              )}

              {/* Already cancelled notice */}
              {business.planStatus === 'cancelled' && business.planExpiresAt && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem', color: '#d97706' }}>
                  ⚠ Your subscription is cancelled. You have full access until{' '}
                  <strong>{new Date(business.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                  After that, the account will revert to the Free plan.
                </div>
              )}
            </div>

            {/* Business Details Form */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!business) return;
                const target = e.currentTarget;
                const name = (target.elements.namedItem("bizName") as HTMLInputElement).value;
                const category = (target.elements.namedItem("bizCategory") as HTMLSelectElement).value;
                const phone = (target.elements.namedItem("bizPhone") as HTMLInputElement).value;
                const city = (target.elements.namedItem("bizCity") as HTMLInputElement).value;
                const description = (target.elements.namedItem("bizDesc") as HTMLTextAreaElement).value;

                try {
                  const res = await fetch("/api/businesses", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: business.id, name, category, phone, city, description })
                  });
                  if (res.ok) {
                    const updated = await res.json();
                    setBusiness(updated);
                    showToast("Business settings updated successfully!", "success");
                    reloadData(business.id);
                  } else {
                    showToast("Failed to update business settings.", "error");
                  }
                } catch (err) {
                  console.error(err);
                  showToast("Failed to update business settings.", "error");
                }
              }}
              className="glass-card" 
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--card)' }}
            >
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>Business Details</h4>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input name="bizName" type="text" required defaultValue={business.name} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select name="bizCategory" defaultValue={business.category} className="form-select">
                    <option value="Salons & Beauty Parlours">Salons & Beauty Parlours</option>
                    <option value="Gyms & Yoga Studios">Gyms & Yoga Studios</option>
                    <option value="Clinics & Doctors">Clinics & Doctors</option>
                    <option value="Tutors & Coaching Classes">Tutors & Coaching Classes</option>
                    <option value="Local Services (Plumbers/Carpenters)">Local Services (Plumbers/Carpenters)</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">WhatsApp Phone Number</label>
                  <input name="bizPhone" type="tel" required defaultValue={business.phone} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">City Location</label>
                  <input name="bizCity" type="text" required defaultValue={business.city} className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Brief Description</label>
                <textarea name="bizDesc" defaultValue={business.description} rows={3} className="form-textarea" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary btn-sm">Save Settings</button>
              </div>
            </form>
          </div>
        )}

      </main>

      <style jsx>{`
        .table-row-hover:hover {
          background: var(--muted-light) !important;
          transition: background 0.15s ease;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 992px) {
          #dashboard-wrapper {
            flex-direction: column;
          }
          aside {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border);
            padding: 1.25rem !important;
          }
          .dashboard-nav {
            flex-direction: row !important;
            overflow-x: auto;
            padding-bottom: 0.5rem;
            white-space: nowrap;
            gap: 0.5rem !important;
          }
          .dashboard-nav button {
            flex-shrink: 0;
            width: auto !important;
          }
          main {
            padding: 1.25rem !important;
          }
        }
      `}</style>

    </div>
  );
}
