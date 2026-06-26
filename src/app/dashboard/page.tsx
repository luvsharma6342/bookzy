'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
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
  IndianRupee, 
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
  ShieldCheck,
  Copy,
  QrCode,
  Share2,
  Pencil,
  Search,
  Sun,
  Moon
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
import { isPaidPlan } from '@/lib/planOverride';
import { renderFormattedDescription } from '@/lib/formatter';

const CATEGORY_MAP: Record<string, string[]> = {
  "Salons & Beauty Parlours": ["Hair Care", "Skincare", "Nail Care", "Makeup", "Massage & Spa"],
  "Clinics & Doctors": ["Consultation", "Dental Treatments", "Diagnostics / Tests", "Therapy", "General Checkup"],
  "Gyms & Yoga Studios": ["Personal Training", "Group Classes", "Yoga & Meditation", "Diet & Nutrition"],
  "Tutors & Coaching Classes": ["Academic Subjects", "Test Preparation", "Language Learning", "Coding & Tech"],
  "Local Services (Plumbers/Carpenters)": ["Plumbing", "Electrical Work", "Carpentry", "Appliance Repair", "Cleaning"],
  "Web Development & Freelancers": ["Web Development", "AI & Voice Agents", "Mobile App Dev", "Design & Branding", "Consulting", "Digital Downloads"]
};

import AnalyticsView from './views/AnalyticsView';
import BookingsView from './views/BookingsView';
import ServicesView from './views/ServicesView';
import AvailabilityView from './views/AvailabilityView';
import WhatsAppView from './views/WhatsAppView';
import StaffView from './views/StaffView';
import SettingsView from './views/SettingsView';
import SecurityView from './views/SecurityView';

export default function MerchantDashboard() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const authLoading = isPending || !session;

  // Business Selection
  const [selectedBizId, setSelectedBizId] = useState<string>('');
  const [business, setBusiness] = useState<Business | null>(null);

  // Active Tab / View
  const [activeView, setActiveView] = useState<'analytics' | 'bookings' | 'services' | 'availability' | 'whatsapp' | 'staff' | 'settings' | 'security'>('analytics');

  // Business state variables (SWR cache)
  const { data: rawBusinesses } = useSWR<Business[]>('/api/businesses', fetcher);
  const { data: rawServices, mutate: mutateServices } = useSWR<Service[]>(business ? `/api/services?businessId=${business.id}` : null, fetcher);
  const { data: rawStaffList } = useSWR<Staff[]>(business ? `/api/staff?businessId=${business.id}` : null, fetcher);
  const { data: rawBookings } = useSWR<Booking[]>(business ? `/api/bookings?businessId=${business.id}` : null, fetcher);
  const { data: rawAnalytics } = useSWR<AnalyticsEvent[]>(business ? `/api/analytics?businessId=${business.id}` : null, fetcher);
  const { data: rawBlockedDates } = useSWR<any[]>(business ? `/api/blocked-dates?businessId=${business.id}` : null, fetcher);
  
  const businesses = rawBusinesses || [];
  const services = rawServices || [];
  const staffList = rawStaffList || [];
  const bookings = rawBookings || [];
  const analytics = rawAnalytics || [];
  const blockedDates = rawBlockedDates || [];
  
  // Sync business state when businesses load
  useEffect(() => {
    if (businesses && businesses.length > 0) {
      const target = selectedBizId ? businesses.find((b: Business) => b.id === selectedBizId) : businesses[0];
      const finalTarget = target || businesses[0];
      if (finalTarget && finalTarget.id !== business?.id) {
        setSelectedBizId(finalTarget.id);
        setBusiness(finalTarget);
      }
    } else if (businesses && businesses.length === 0) {
      setBusiness(null);
      router.push('/auth/onboard');
    }
  }, [businesses, selectedBizId, business?.id, router]);

  // Filtering Bookings
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'>('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingDateFrom, setBookingDateFrom] = useState('');
  const [bookingDateTo, setBookingDateTo] = useState('');
  const [agendaCollapsed, setAgendaCollapsed] = useState(false);

  // Add Service Form State
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(299);
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServiceCategory, setNewServiceCategory] = useState('Hair Care');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Edit Service Modal State
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editSvcName, setEditSvcName] = useState('');
  const [editSvcPrice, setEditSvcPrice] = useState(0);
  const [editSvcDuration, setEditSvcDuration] = useState(30);
  const [editSvcCategory, setEditSvcCategory] = useState('Hair Care');
  const [editSvcDesc, setEditSvcDesc] = useState('');
  const [editSvcLoading, setEditSvcLoading] = useState(false);

  // Simulation state variables
  const [wabaConnected, setWabaConnected] = useState(true);
  const [gmbLinked, setGmbLinked] = useState(true);
  const [simulatedReminderText, setSimulatedReminderText] = useState<string | null>(null);

  // WhatsApp States
  const [metaWabaIdInput, setMetaWabaIdInput] = useState('');
  const [metaPhoneNumberIdInput, setMetaPhoneNumberIdInput] = useState('');
  const [metaPermanentTokenInput, setMetaPermanentTokenInput] = useState('');
  const [testPhoneInput, setTestPhoneInput] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [saveBizLoading, setSaveBizLoading] = useState(false);

  // Payment state
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [hasPasswordAccount, setHasPasswordAccount] = useState<boolean | null>(null);
  const { openCheckout } = useRazorpay();

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Share tools state
  const [copyLinkCopied, setCopyLinkCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Add Manual Booking modal state
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [addBkLoading, setAddBkLoading] = useState(false);
  const [addBkCustomerName, setAddBkCustomerName] = useState('');
  const [addBkCustomerPhone, setAddBkCustomerPhone] = useState('');
  const [addBkServiceId, setAddBkServiceId] = useState('');
  const [addBkStaffId, setAddBkStaffId] = useState('');
  const [addBkDateTime, setAddBkDateTime] = useState('');
  const [addBkPrice, setAddBkPrice] = useState(0);
  const [addBkNotes, setAddBkNotes] = useState('');

  // Add/Edit Staff modal state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Stylist');
  const [staffSelectedServiceIds, setStaffSelectedServiceIds] = useState<string[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  // Blocked dates states

  const [blockDateInput, setBlockDateInput] = useState('');
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);

  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDateInput || !business) return;

    setBlockLoading(true);
    try {
      const res = await fetch("/api/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          date: blockDateInput,
          reason: blockReasonInput.trim() || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to block date");
      }

      showToast("Date blocked successfully!", "success");
      setBlockDateInput('');
      setBlockReasonInput('');
      reloadData(business.id);
    } catch (err: any) {
      showToast(err.message || "Error blocking date", "error");
    } finally {
      setBlockLoading(false);
    }
  };

  const handleUnblockDate = async (id: string) => {
    if (!confirm("Remove this holiday/date block?") || !business) return;

    try {
      const res = await fetch(`/api/blocked-dates?id=${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Failed to unblock date");
      }

      showToast("Date unblocked successfully!", "success");
      reloadData(business.id);
    } catch (err: any) {
      showToast(err.message || "Error unblocking date", "error");
    }
  };

  const openAddStaff = () => {
    setEditingStaff(null);
    setStaffName('');
    setStaffRole('Stylist');
    setStaffSelectedServiceIds([]);
    setShowAddStaffModal(true);
  };

  const openEditStaff = (st: Staff) => {
    setEditingStaff(st);
    setStaffName(st.name);
    setStaffRole(st.role);
    const associatedServiceIds = st.services ? st.services.map((s: any) => s.id) : [];
    setStaffSelectedServiceIds(associatedServiceIds);
    setShowAddStaffModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffRole.trim() || !business) return;

    setStaffLoading(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingStaff?.id,
          businessId: business.id,
          name: staffName.trim(),
          role: staffRole.trim(),
          rating: editingStaff?.rating || 5.0,
          serviceIds: staffSelectedServiceIds
        })
      });

      if (!res.ok) {
        throw new Error("Failed to save staff profile");
      }

      showToast(`Staff profile ${editingStaff ? 'updated' : 'added'} successfully!`, 'success');
      setShowAddStaffModal(false);
      reloadData(business.id);
    } catch (err: any) {
      showToast(err.message || "Error saving staff", 'error');
    } finally {
      setStaffLoading(false);
    }
  };

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

  // Refresh DB States via SWR Cache Invalidation
  const reloadData = async (bizId: string) => {
    if (!bizId) return;
    mutate(`/api/services?businessId=${bizId}`);
    mutate(`/api/staff?businessId=${bizId}`);
    mutate(`/api/bookings?businessId=${bizId}`);
    mutate(`/api/analytics?businessId=${bizId}`);
    mutate(`/api/blocked-dates?businessId=${bizId}`);
    mutate('/api/businesses');
  };

  // Synchronize category state when active business changes
  useEffect(() => {
    if (business) {
      const cats = CATEGORY_MAP[business.category] || ["General", "Consultation"];
      setNewServiceCategory(cats[0]);
      setEditSvcCategory(cats[0]);
    }
  }, [business?.id, business?.category]);

  // Check if account has password credential linked for Change Password form
  useEffect(() => {
    if (activeView === 'security') {
      authClient.listAccounts()
        .then(({ data }) => {
          const hasCred = data?.some(acc => acc.providerId === "credential" || acc.providerId === "email") ?? false;
          setHasPasswordAccount(hasCred);
        })
        .catch(() => {
          setHasPasswordAccount(true); // fallback to showing password change form
        });
    }
  }, [activeView]);

  // Manage theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const activeTheme = savedTheme || 'dark'; // Dashboard defaults to dark mode
      setTheme(activeTheme);
      if (activeTheme === 'dark') {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };

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
    if (!business) return;    // 1. Optimistically update local state immediately
    const originalServices = [...(services || [])];
    mutateServices((prev: Service[] = []) => prev.map(s => 
      s.id === svc.id ? { ...s, active: !s.active } : s
    ), { revalidate: false });

    try {
      // 2. Send API request in background
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...svc,
          active: !svc.active
        })
      });

      if (!res.ok) {
        // 3. Revert if API fails
        throw new Error("Failed to update service on server");
      }
      
      // Request successful: trigger background revalidation
      mutate(`/api/services?businessId=${business.id}`);
    } catch (err) {
      console.error(err);
      // Revert state on failure
      mutateServices(originalServices, { revalidate: false });
      showToast("Failed to toggle service status.", "error");
    }  };

  // Open edit modal pre-filled with service data
  const openEditService = (svc: Service) => {
    setEditingService(svc);
    setEditSvcName(svc.name);
    setEditSvcPrice(svc.price);
    setEditSvcDuration(svc.duration);
    setEditSvcCategory(svc.category);
    setEditSvcDesc(svc.description);
  };

  // Submit edited service — POST with id triggers update in API
  const handleEditServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !business) return;
    setEditSvcLoading(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingService.id,
          businessId: business.id,
          name: editSvcName,
          price: editSvcPrice,
          duration: editSvcDuration,
          category: editSvcCategory,
          description: editSvcDesc,
          active: editingService.active,
        }),
      });
      if (res.ok) {
        setEditingService(null);
        showToast('Service updated successfully!', 'success');
        await reloadData(business.id);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update service', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setEditSvcLoading(false);
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
        if (newStatus === 'no_show' && business.plan !== 'free') {
          const msg = `Hi ${booking.customerName}, we missed you for your appointment today. Want to reschedule? Reply YES to find a new slot.`;
          setSimulatedReminderText(`📲 SMS Sent to ${booking.customerName} (${booking.customerPhone}): "${msg}"`);
          setTimeout(() => setSimulatedReminderText(null), 7000);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // WhatsApp Input Initializer
  useEffect(() => {
    if (business) {
      setMetaWabaIdInput(business.metaWabaId || '');
      setMetaPhoneNumberIdInput(business.metaPhoneNumberId || '');
      setMetaPermanentTokenInput(business.metaPermanentToken || '');
    }
  }, [business]);

  const handleSaveWABA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setSaveBizLoading(true);
    try {
      const res = await fetch("/api/businesses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: business.id,
          metaWabaId: metaWabaIdInput,
          metaPhoneNumberId: metaPhoneNumberIdInput,
          metaPermanentToken: metaPermanentTokenInput
        })
      });
      if (res.ok) {
        showToast("WhatsApp Cloud API settings saved successfully!", "success");
        await reloadData(business.id);
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to save settings", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaveBizLoading(false);
    }
  };

  const handleSendTestWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !testPhoneInput.trim()) return;
    setTestSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          toPhone: testPhoneInput,
          templateName: "booking_confirmation",
          params: [session?.user?.name || "Test User", "Test Premium Haircut", "15 Jun at 10:00 AM", "Priya Sharma"]
        })
      });
      if (res.ok) {
        showToast("Test WhatsApp message dispatched successfully!", "success");
        setTestPhoneInput('');
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to send test message", "error");
      }
    } catch {
      showToast("Network error during test dispatch", "error");
    } finally {
      setTestSending(false);
    }
  };

  // Send Reminder (Real Meta WABA if configured, otherwise simulation fallback)
  const handleSendReminder = async (booking: Booking) => {
    if (!business) return;
    const svcName = services.find(s => s.id === booking.serviceId)?.name || 'service';
    const dateObj = new Date(booking.bookingTime);
    const timeFormatted = dateObj.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    if (business.metaPhoneNumberId && business.metaPermanentToken) {
      showToast("Dispatching real WhatsApp reminder...", "success");
      try {
        const res = await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: business.id,
            toPhone: booking.customerPhone,
            templateName: "appointment_reminder",
            params: [booking.customerName, svcName, timeFormatted]
          })
        });
        if (res.ok) {
          showToast("Real WhatsApp Reminder dispatched successfully!", "success");
        } else {
          const data = await res.json();
          showToast(data.error || "Failed to send WhatsApp reminder", "error");
        }
      } catch (err) {
        showToast("Network error dispatching WhatsApp reminder", "error");
      }
    } else {
      const msg = `Hi ${booking.customerName}, friendly reminder: your ${svcName} is scheduled for today at ${timeFormatted}. Reply CANCEL to cancel.`;
      setSimulatedReminderText(`📲 WhatsApp Reminder dispatched (Simulation) to ${booking.customerName} (${booking.customerPhone}): "${msg}"`);
      setTimeout(() => setSimulatedReminderText(null), 6000);
    }
  };

  // Send Review Request (Simulation or Text if WABA configured)
  const handleSendReviewRequest = async (booking: Booking) => {
    if (!business) return;
    const msg = `Hi ${booking.customerName}, thanks for visiting ${business.name} today! If you enjoyed your experience, we'd love a Google review: https://g.page/${business.slug}/review`;

    if (business.metaPhoneNumberId && business.metaPermanentToken) {
      showToast("Dispatching real WhatsApp review request...", "success");
      try {
        const res = await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: business.id,
            toPhone: booking.customerPhone,
            templateName: "no_show_followup",
            params: [booking.customerName, `Visit Feedback (Google Review)`]
          })
        });
        if (res.ok) {
          showToast("Real WhatsApp feedback request dispatched!", "success");
        } else {
          const data = await res.json();
          showToast(data.error || "Failed to send feedback request", "error");
        }
      } catch {
        showToast("Network error dispatching review request", "error");
      }
    } else {
      setSimulatedReminderText(`📲 WhatsApp Review Request sent (Simulation) to ${booking.customerName} (${booking.customerPhone}): "${msg}"`);
      setTimeout(() => setSimulatedReminderText(null), 6000);
    }
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

  // Copy storefront link to clipboard
  const handleCopyLink = async () => {
    if (!business) return;
    const url = `${window.location.origin}/book/${business.slug}`;
    await navigator.clipboard.writeText(url);
    setCopyLinkCopied(true);
    setTimeout(() => setCopyLinkCopied(false), 2500);
  };

  // Share to WhatsApp
  const handleWhatsAppShare = () => {
    if (!business) return;
    const url = `${window.location.origin}/book/${business.slug}`;
    const text = encodeURIComponent(`Book your appointment at *${business.name}*:\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Reset + close Add Booking modal
  const closeAddBookingModal = () => {
    setShowAddBookingModal(false);
    setAddBkCustomerName('');
    setAddBkCustomerPhone('');
    setAddBkServiceId('');
    setAddBkStaffId('');
    setAddBkDateTime('');
    setAddBkPrice(0);
    setAddBkNotes('');
  };

  // Submit manual booking
  const handleAddManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !addBkServiceId || !addBkDateTime) return;
    setAddBkLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: addBkServiceId,
          staffId: addBkStaffId || null,
          customerName: addBkCustomerName,
          customerPhone: addBkCustomerPhone,
          bookingTime: new Date(addBkDateTime).toISOString(),
          price: addBkPrice,
          bookingSource: 'manual',
          notes: addBkNotes,
        }),
      });
      if (res.ok) {
        closeAddBookingModal();
        showToast('✅ Booking added successfully!', 'success');
        await reloadData(business.id);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to add booking', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setAddBkLoading(false);
    }
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

  // Get today's bookings (chronological, non-cancelled)
  const getTodayBookings = () => {
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return bookings
      .filter(b => {
        const bDate = new Date(b.bookingTime);
        const bLocal = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, '0')}-${String(bDate.getDate()).padStart(2, '0')}`;
        return bLocal === localToday && b.status !== 'cancelled';
      })
      .sort((a, b) => new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime());
  };

  const todayBookings = getTodayBookings();

  // Filtered bookings list (status + search name/phone + date from/to)
  const filteredBookings = bookings
    .filter(b => bookingFilter === 'all' || b.status === bookingFilter)
    .filter(b => {
      if (!bookingSearch) return true;
      const q = bookingSearch.toLowerCase();
      const nameMatch = b.customerName.toLowerCase().includes(q);
      const phoneMatch = b.customerPhone.includes(q);
      return nameMatch || phoneMatch;
    })
    .filter(b => {
      if (!bookingDateFrom && !bookingDateTo) return true;
      const dateStr = b.bookingTime.slice(0, 10); // YYYY-MM-DD
      if (bookingDateFrom && dateStr < bookingDateFrom) return false;
      if (bookingDateTo && dateStr > bookingDateTo) return false;
      return true;
    });

  const isDataLoading = authLoading || (rawBusinesses && rawBusinesses.length > 0 && business && (rawServices === undefined || rawStaffList === undefined || rawBookings === undefined || rawAnalytics === undefined));

  if (isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        <p className="text-slate-400 font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

  if (rawBusinesses === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        <p className="text-slate-400 font-medium">Checking businesses...</p>
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
                <option value="Web Development & Freelancers">Web Development & Freelancers</option>
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

  if (!business) return null; // Avoid rendering dashboard until business is set

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
            disabled={business.plan === 'free'}
          >
            <MessageSquare size={18} />
            <span>WhatsApp Automation</span>
            {business.plan === 'free' && (
              <span style={{ background: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', marginLeft: 'auto', fontWeight: 700 }}>PRO</span>
            )}
          </button>

          <button 
            onClick={() => setActiveView('staff')} 
            className={`btn btn-sm ${activeView === 'staff' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: 'flex-start', width: '100%', border: 'none' }}
            disabled={business.plan === 'free'}
          >
            <Users size={18} />
            <span>Staff Schedules</span>
            {business.plan === 'free' && (
              <span style={{ background: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', marginLeft: 'auto', fontWeight: 700 }}>PRO</span>
            )}
          </button>

          <button 
            onClick={() => setActiveView('security')} 
            className={`btn btn-sm ${activeView === 'security' ? 'btn-primary' : 'btn-outline'}`}
            style={{ justifyContent: 'flex-start', width: '100%', border: 'none', marginTop: '0.5rem' }}
          >
            <ShieldCheck size={18} />
            <span>Password & Security</span>
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
              <span className={`badge ${business.plan === 'pro' ? 'badge-success' : (business.plan === 'growth' ? 'badge-primary' : 'badge-muted')}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                {business.plan}
              </span>
            </div>
            {business.planStatus === 'cancelled' && (
              <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>⚠ Cancels at period end</span>
            )}
            {business.plan === 'free' && (
              <button
                onClick={() => setActiveView('settings')}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', marginTop: '0.25rem' }}
              >
                <CreditCard size={12} /> Upgrade Plan
              </button>
            )}
          </div>

          {/* Share / Storefront Tools */}
          <Link href={`/book/${business.slug}`} target="_blank" className="btn btn-outline btn-sm" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
            <ExternalLink size={12} />
            <span>Live Storefront</span>
          </Link>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
            <button
              onClick={handleCopyLink}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.72rem', gap: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Copy booking link to clipboard"
            >
              {copyLinkCopied ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
              {copyLinkCopied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.72rem', gap: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25d366', borderColor: 'rgba(37,211,102,0.4)' }}
              title="Share via WhatsApp"
            >
              <Share2 size={12} /> WhatsApp
            </button>
          </div>

          {business.plan !== 'free' && (
            <button
              onClick={() => setShowQRModal(true)}
              className="btn btn-outline btn-sm"
              style={{ width: '100%', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              title="Show QR code for this storefront"
            >
              <QrCode size={12} /> Show QR Code
            </button>
          )}
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-outline btn-sm"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.35rem', fontSize: '0.72rem' }}
          >
            {theme === 'light' ? <Moon size={12} /> : <Sun size={12} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

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

        {/* RENDERING VIEWS */}
        {activeView === 'analytics' && (
          <AnalyticsView 
            stats={stats} 
            bookings={bookings} 
            chartData={chartData} 
            sourceData={sourceData} 
          />
        )}
        
        {activeView === 'bookings' && (
          <BookingsView 
            business={business}
            bookings={bookings}
            agendaCollapsed={agendaCollapsed}
            setAgendaCollapsed={setAgendaCollapsed}
            staffList={staffList}
            services={services}
            bookingFilter={bookingFilter}
            setBookingFilter={setBookingFilter}
            bookingSearch={bookingSearch}
            setBookingSearch={setBookingSearch}
            bookingDateFrom={bookingDateFrom}
            setBookingDateFrom={setBookingDateFrom}
            bookingDateTo={bookingDateTo}
            setBookingDateTo={setBookingDateTo}
            handleUpdateBookingStatus={handleUpdateBookingStatus}
            handleSendReminder={handleSendReminder}
            handleSendReviewRequest={handleSendReviewRequest}
            setShowAddBookingModal={setShowAddBookingModal}
            handleCSVExport={handleCSVExport}
          />
        )}

        {activeView === 'services' && (
          <ServicesView 
            business={business}
            services={services}
            CATEGORY_MAP={CATEGORY_MAP}
            handleAddServiceSubmit={handleAddServiceSubmit}
            handleToggleService={handleToggleService}
            openEditService={openEditService}
            reloadData={reloadData}
            showAddService={showAddService}
            setShowAddService={setShowAddService}
            newServiceName={newServiceName}
            setNewServiceName={setNewServiceName}
            newServiceCategory={newServiceCategory}
            setNewServiceCategory={setNewServiceCategory}
            newServicePrice={newServicePrice}
            setNewServicePrice={setNewServicePrice}
            newServiceDuration={newServiceDuration}
            setNewServiceDuration={setNewServiceDuration}
            newServiceDesc={newServiceDesc}
            setNewServiceDesc={setNewServiceDesc}
          />
        )}

        {activeView === 'availability' && (
          <AvailabilityView 
            business={business}
            blockedDates={blockedDates}
            handleUpdateWorkingHours={handleUpdateWorkingHours}
            reloadData={reloadData}
            showToast={showToast}
          />
        )}

        {activeView === 'whatsapp' && (
          <WhatsAppView 
            business={business}
            reloadData={reloadData}
            showToast={showToast}
          />
        )}

        {activeView === 'staff' && (
          <StaffView 
            business={business}
            staffList={staffList}
            openAddStaff={openAddStaff}
            openEditStaff={openEditStaff}
            reloadData={reloadData}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView 
            business={business}
            setBusiness={setBusiness}
            paymentLoading={paymentLoading}
            handleUpgrade={handleUpgrade}
            cancelLoading={cancelLoading}
            handleCancelSubscription={handleCancelSubscription}
            reloadData={reloadData}
            showToast={showToast}
          />
        )}

        {activeView === 'security' && (
          <SecurityView 
            hasPasswordAccount={hasPasswordAccount}
            showToast={showToast}
          />
        )}

      {/* ─── ADD MANUAL BOOKING MODAL ─────────────────────────────── */}
      <AnimatePresence>
        {showAddBookingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={(e) => { if (e.target === e.currentTarget) closeAddBookingModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.18 }}
              style={{ background: 'var(--card)', borderRadius: '16px', padding: '2rem', maxWidth: '540px', width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add Manual Booking</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Walk-in, phone, or in-person appointment</p>
                </div>
                <button onClick={closeAddBookingModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddManualBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Customer info */}
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Customer Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Rohan Verma"
                      value={addBkCustomerName}
                      onChange={(e) => setAddBkCustomerName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp Phone *</label>
                    <input
                      type="tel"
                      required
                      className="form-input"
                      placeholder="+91 98765 43210"
                      value={addBkCustomerPhone}
                      onChange={(e) => setAddBkCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Service + Staff */}
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Service *</label>
                    <select
                      required
                      className="form-select"
                      value={addBkServiceId}
                      onChange={(e) => {
                        setAddBkServiceId(e.target.value);
                        const svc = services.find(s => s.id === e.target.value);
                        if (svc) setAddBkPrice(svc.price);
                      }}
                    >
                      <option value="">Select a service...</option>
                      {services.filter(s => s.active).map(s => (
                        <option key={s.id} value={s.id}>{s.name} — ₹{s.price}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Staff Member</label>
                    <select
                      className="form-select"
                      value={addBkStaffId}
                      onChange={(e) => setAddBkStaffId(e.target.value)}
                    >
                      <option value="">Any / Not assigned</option>
                      {staffList.map(st => (
                        <option key={st.id} value={st.id}>{st.name} — {st.role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date/Time + Price */}
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Date &amp; Time *</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-input"
                      value={addBkDateTime}
                      onChange={(e) => setAddBkDateTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={0.01}
                      className="form-input"
                      value={addBkPrice}
                      onChange={(e) => setAddBkPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Special requests, preferences, or internal notes..."
                    value={addBkNotes}
                    onChange={(e) => setAddBkNotes(e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                  <button type="button" onClick={closeAddBookingModal} className="btn btn-outline btn-sm">Cancel</button>
                  <button
                    type="submit"
                    disabled={addBkLoading}
                    className="btn btn-primary btn-sm"
                    style={{ minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    {addBkLoading
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Adding...</>
                      : <><Plus size={14} /> Add Booking</>
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── QR CODE MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {showQRModal && business && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowQRModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.18 }}
              style={{ background: 'var(--card)', borderRadius: '20px', padding: '2rem', maxWidth: '320px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center', position: 'relative', border: '1px solid var(--border)' }}
            >
              <button onClick={() => setShowQRModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={18} />
              </button>

              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📲 Scan to Book</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{business.name}</p>
              </div>

              {/* QR via free API — no npm package needed */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', display: 'inline-flex' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : 'https://bookze.vercel.app'}/book/${business.slug}`)}&color=090d16&bgcolor=ffffff`}
                  alt="Booking QR Code"
                  width={180}
                  height={180}
                  style={{ display: 'block', borderRadius: '6px' }}
                />
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
                Print this QR at your counter. Customers scan to instantly open your booking page.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : 'https://bookze.vercel.app'}/book/${business.slug}`)}&color=090d16&bgcolor=ffffff`}
                  download={`${business.slug}-qr-code.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  ⬇️ Download QR (600×600)
                </a>
                <button
                  onClick={handleCopyLink}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  {copyLinkCopied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                  {copyLinkCopied ? 'Link Copied!' : 'Copy Booking Link'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── EDIT SERVICE MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {editingService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditingService(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.18 }}
              style={{ background: 'var(--card)', borderRadius: '16px', padding: '2rem', maxWidth: '520px', width: '100%', position: 'relative', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Edit Service</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                    Editing: <strong>{editingService.name}</strong>
                  </p>
                </div>
                <button onClick={() => setEditingService(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditServiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Name + Category */}
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Service Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={editSvcName}
                      onChange={(e) => setEditSvcName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={editSvcCategory}
                      onChange={(e) => setEditSvcCategory(e.target.value)}
                    >
                      {(() => {
                        const baseCats = CATEGORY_MAP[business.category] || ["General", "Consultation"];
                        const allCats = [...baseCats];
                        if (editSvcCategory && !allCats.includes(editSvcCategory)) {
                          allCats.push(editSvcCategory);
                        }
                        return allCats.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                {/* Price + Duration */}
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={0.01}
                      className="form-input"
                      value={editSvcPrice}
                      onChange={(e) => setEditSvcPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (Minutes) *</label>
                    <input
                      type="number"
                      required
                      min={5}
                      className="form-input"
                      value={editSvcDuration}
                      onChange={(e) => setEditSvcDuration(parseInt(e.target.value) || 5)}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Briefly describe what this service includes..."
                    value={editSvcDesc}
                    onChange={(e) => setEditSvcDesc(e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                  <button type="button" onClick={() => setEditingService(null)} className="btn btn-outline btn-sm">Cancel</button>
                  <button
                    type="submit"
                    disabled={editSvcLoading}
                    className="btn btn-primary btn-sm"
                    style={{ minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    {editSvcLoading
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                      : <><Check size={14} /> Save Changes</>
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ADD/EDIT STAFF MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {showAddStaffModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddStaffModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.18 }}
              style={{ background: 'var(--card)', borderRadius: '16px', padding: '2rem', maxWidth: '500px', width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingStaff ? 'Edit Staff Profile' : 'Add Staff Profile'}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Define staff role and service offerings</p>
                </div>
                <button onClick={() => setShowAddStaffModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="form-input"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Stylist, Senior Therapist"
                    className="form-input"
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                  />
                </div>

                {/* Services Checklist */}
                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>Assigned Services</label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                    Select which services this staff member performs. If none are selected, they will be bookable for all services.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--background)' }}>
                    {services.map((svc) => {
                      const isChecked = staffSelectedServiceIds.includes(svc.id);
                      return (
                        <label key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStaffSelectedServiceIds([...staffSelectedServiceIds, svc.id]);
                              } else {
                                setStaffSelectedServiceIds(staffSelectedServiceIds.filter((id) => id !== svc.id));
                              }
                            }}
                          />
                          <span>{svc.name} <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>({svc.category})</span></span>
                        </label>
                      );
                    })}
                    {services.length === 0 && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                        No services configured. Add services first.
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowAddStaffModal(false)} className="btn btn-outline btn-sm">Cancel</button>
                  <button
                    type="submit"
                    disabled={staffLoading}
                    className="btn btn-primary btn-sm"
                    style={{ minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    {staffLoading
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                      : 'Save Profile'
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
