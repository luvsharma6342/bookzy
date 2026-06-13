'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Calendar,
  BarChart3,
  Smartphone,
  CheckCircle,
  Globe,
  Sparkles,
  ArrowRight,
  Users,
  Search,
  Bell,
  HelpCircle,
  TrendingUp,
  Languages,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export default function LandingPage() {
  const router = useRouter();
  const [demoBizName, setDemoBizName] = useState('');
  const [demoCategory, setDemoCategory] = useState('Salons & Beauty Parlours');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHindi, setIsHindi] = useState(false);
  const [screenshotTab, setScreenshotTab] = useState<'storefront' | 'dashboard' | 'whatsapp'>('storefront');
  const { data: session } = authClient.useSession();

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoBizName.trim()) return;

    setIsGenerating(true);

    const slug = demoBizName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const cleanSlug = slug || 'my-store';

    if (!session?.user) {
      // If not logged in, redirect to auth page with state to auto-create on signup
      setTimeout(() => {
        setIsGenerating(false);
        router.push(`/auth?bizName=${encodeURIComponent(demoBizName)}&category=${encodeURIComponent(demoCategory)}`);
      }, 1000);
      return;
    }

    try {
      // Create new business in Postgres DB via API
      const bizRes = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: demoBizName,
          slug: cleanSlug,
          category: demoCategory,
          phone: '+919999999999',
          city: 'Local Area',
          description: 'Newly generated storefront booking page via Bookze.',
        })
      });

      if (!bizRes.ok) {
        const errorData = await bizRes.json();
        throw new Error(errorData.error || 'Failed to create business');
      }

      const newBiz = await bizRes.json();

      // Add a default service for this new business
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: newBiz.id,
          name: demoCategory === 'Salons & Beauty Parlours' ? 'Premium Haircut' : 'General Service Consultation',
          price: 299,
          duration: 30,
          description: 'Standard booking slot consultation service.',
          category: 'General',
          active: true
        })
      });

      setTimeout(() => {
        setIsGenerating(false);
        router.push(`/book/${newBiz.slug}`);
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to create storefront');
      setIsGenerating(false);
    }
  };

  return (
    <div className="landing-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', color: '#0f172a' }}>

      {/* Top Banner for Local Language */}
      <div style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
        <span>🚀 {isHindi ? 'अब बुकजी हिंदी में भी उपलब्ध है!' : 'Now Bookze is available in Hindi & English!'}</span>
        <button
          onClick={() => setIsHindi(!isHindi)}
          style={{ background: 'white', color: '#6366f1', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          <Languages size={12} />
          {isHindi ? 'English' : 'हिंदी'}
        </button>
      </div>

      {/* Navigation Header */}
      <header style={{ borderBottom: '1px solid #e2e8f0', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4.5rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ height: '2.5rem', width: '2.5rem', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>B</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-title)', letterSpacing: '-0.5px' }}>Bookze</span>
          </Link>

          <nav style={{ display: 'flex', gap: '2rem', fontWeight: 550, color: '#64748b' }} className="desktop-nav">
            <a href="#features" className="hover-link">{isHindi ? 'विशेषताएं' : 'Features'}</a>
            <a href="#demo" className="hover-link">{isHindi ? 'डेमो' : 'Try Demo'}</a>
            <a href="#pricing" className="hover-link">{isHindi ? 'कीमतें' : 'Pricing'}</a>
            <a href="#faq" className="hover-link">{isHindi ? 'अक्सर पूछे जाने वाले सवाल' : 'FAQs'}</a>
          </nav>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/dashboard" className="btn btn-outline btn-sm">
              {isHindi ? 'मर्चेंट लॉगिन' : 'Dashboard'}
            </Link>
            <a href="#demo" className="btn btn-primary btn-sm">
              {isHindi ? 'फ्री शुरू करें' : 'Get Started'}
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '5rem 0 4rem 0', position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)' }}>
        <div className="container hero-grid">

          {/* Hero Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '0.4rem 0.8rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600, width: 'fit-content' }}>
              <Sparkles size={14} />
              <span>{isHindi ? 'व्हाट्सएप-फर्स्ट डिजिटल स्टोर' : 'India’s #1 WhatsApp Storefront Creator'}</span>
            </div>

            <h1 style={{ fontSize: '3.5rem', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
              {isHindi ? (
                <>अपना बिजनेस ऑनलाइन लाएं। <span className="text-gradient">व्हाट्सएप बुकिंग</span> से कस्टमर बढ़ाएं।</>
              ) : (
                <>Your Service Business. On Google. <span className="text-gradient">Booked on WhatsApp.</span></>
              )}
            </h1>

            <p style={{ fontSize: '1.125rem', color: '#64748b', lineHeight: 1.6 }}>
              {isHindi ? (
                'सैलून, जिम, क्लीनिक या ट्यूटर - सिर्फ 5 मिनट में अपनी बुकिंग वेबसाइट बनाएं। कोई कोडिंग या टेक्निकल स्किल नहीं चाहिए। कस्टमर व्हाट्सएप पर सीधे स्लॉट चुनकर बुक कर सकते हैं।'
              ) : (
                'Get a branded mobile booking page in 5 minutes. Customers can discover your services on Google, check live availability, and book instantly via WhatsApp. Zero friction, zero client dropoffs.'
              )}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
              <a href="#demo" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
                {isHindi ? 'फ्री लिंक बनाएं' : 'Create Free Link'} <ArrowRight size={18} />
              </a>
              <Link href="/book/priyas-salon" className="btn btn-secondary" style={{ padding: '0.85rem 2rem' }}>
                {isHindi ? 'लाइव सैलून डेमो देखें' : 'View Live Demo'}
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 800 }} className="text-gradient">70%+</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{isHindi ? 'कम नो-शो (रिमाइंडर से)' : 'Reduced No-Shows'}</p>
              </div>
              <div>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 800 }} className="text-gradient">5 Mins</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{isHindi ? 'आसान सेटअप समय' : 'Easy Setup Time'}</p>
              </div>
              <div>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 800 }} className="text-gradient">₹0</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{isHindi ? 'होस्टिंग या डोमेन खर्च' : 'Hosting Cost'}</p>
              </div>
            </div>
          </motion.div>

          {/* Hero Right Visual Interface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
          >
            <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '1rem', boxShadow: 'var(--shadow-premium)', background: '#fff', border: '1px solid #e2e8f0', transform: 'rotate(2deg)' }}>

              {/* Device Mockup Top Bar */}
              <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }}></span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }}></span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }}></span>
                </div>
                <span>bookze.in/priyas-salon</span>
                <span>📶 4G</span>
              </div>

              {/* Storefront Mockup Header */}
              <div style={{ textAlign: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #6366f1)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.5rem' }}>PS</div>
                <h3 style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>Priya's Premium Salon</h3>
                <span className="badge badge-success" style={{ marginTop: '0.25rem' }}>Open Now</span>
              </div>

              {/* Service Item Mockup */}
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                  <div>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 650 }}>Haircut & Styling</h5>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>45 Mins · ₹499</span>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>Selected</button>
                </div>
              </div>

              {/* Calendar Slot Selection Preview */}
              <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                <h5 style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Select Appointment Time</h5>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <div style={{ flex: 1, padding: '0.4rem', background: 'white', borderRadius: '6px', textAlign: 'center', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Mon, 4:00 PM</div>
                  <div style={{ flex: 1, padding: '0.4rem', background: '#6366f1', borderRadius: '6px', color: 'white', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600 }}>Mon, 5:00 PM</div>
                  <div style={{ flex: 1, padding: '0.4rem', background: 'white', borderRadius: '6px', textAlign: 'center', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>Mon, 6:00 PM</div>
                </div>
              </div>

              {/* WhatsApp Button Preview */}
              <button className="btn btn-whatsapp" style={{ width: '100%', marginTop: '1rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem' }}>
                <MessageSquare size={16} />
                <span>Book Now on WhatsApp</span>
              </button>
            </div>

            {/* Background elements */}
            <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', height: '6rem', width: '6rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', filter: 'blur(20px)', zIndex: -1 }}></div>
          </motion.div>

        </div>
      </section>

      {/* Interactive Live Store Generator Widget */}
      <section id="demo" style={{ padding: '4rem 0', background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem', letterSpacing: '-0.5px' }}>
            {isHindi ? 'अपना बुकिंग स्टोर लिंक अभी बनाएं' : 'Create Your Booking Page Instantly'}
          </h2>
          <p style={{ color: '#64748b', marginBottom: '2.5rem' }}>
            {isHindi ? '10 सेकंड में अपना स्टोर पेज लाइव करें और कस्टमर को व्हाट्सएप बुकिंग दें।' : 'Type your business name below to instantly generate your live, testable Bookze storefront page.'}
          </p>

          <form onSubmit={handleGenerateLink} className="glass-card" style={{ padding: '2.5rem', background: 'white', boxShadow: 'var(--shadow-premium)', display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{isHindi ? 'बिजनेस का नाम' : 'Business Name'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Priya's Beauty Parlour"
                  value={demoBizName}
                  onChange={(e) => setDemoBizName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isHindi ? 'बिजनेस कैटेगरी' : 'Business Category'}</label>
                <select
                  className="form-select"
                  value={demoCategory}
                  onChange={(e) => setDemoCategory(e.target.value)}
                >
                  <option value="Salons & Beauty Parlours">{isHindi ? 'सैलून और पार्लर' : 'Salons & Beauty Parlours'}</option>
                  <option value="Gyms & Yoga Studios">{isHindi ? 'जिम और योगा' : 'Gyms & Yoga Studios'}</option>
                  <option value="Tutors & Coaching Classes">{isHindi ? 'ट्यूशन और क्लासेस' : 'Tutors & Coaching Classes'}</option>
                  <option value="Clinics & Doctors">{isHindi ? 'क्लीनिक और डॉक्टर्स' : 'Clinics & Doctors'}</option>
                  <option value="Local Services (Plumbers/Carpenters)">{isHindi ? 'लोकल सर्विसेज (प्लम्बर/इलेक्ट्रीशियन)' : 'Local Services (Plumbers/Carpenters)'}</option>
                </select>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} style={{ color: '#6366f1' }} />
              <span>
                {isHindi ? 'आपका स्टोर यूआरएल होगा:' : 'Your direct booking storefront URL will be:'}{' '}
                <strong>
                  bookze.vercel.app/book/{demoBizName ? demoBizName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : 'your-brand'}
                </strong>
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={isGenerating}>
              {isGenerating ? (
                <span>{isHindi ? 'स्टोरफ्रंट तैयार किया जा रहा है...' : 'Generating Storefront...'}</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {isHindi ? 'फ्री स्टोरफ्रंट लिंक बनाएं' : 'Create & Open Storefront Page'} <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '6rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>{isHindi ? 'विशेषताएं' : 'Platform Moat'}</span>
            <h2 style={{ fontSize: '2.5rem', letterSpacing: '-0.75px' }}>
              {isHindi ? 'छोटे व्यवसायों के लिए आधुनिक फीचर्स' : 'Built for the Needs of Indian Local Businesses'}
            </h2>
            <p style={{ color: '#64748b', maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
              {isHindi ? 'कस्टमर को मिले आसान और तेज बुकिंग अनुभव, आपको मिले पूरा मर्चेंट कंट्रोल।' : 'Everything you need to automate bookings, showcase catalogues, and decrease no-shows.'}
            </p>
          </div>

          <div className="grid-3">

            {/* Feature 1 */}
            <div className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ height: '3rem', width: '3rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>{isHindi ? 'मोबाइल-फर्स्ट स्टोरफ्रंट' : 'Instant Storefront Page'}</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {isHindi ? 'कैटलॉग, मूल्य और अवधि के साथ एक सुंदर बुकिंग पेज जो मोबाइल पर 2 सेकंड से कम समय में लोड होता है।' : 'A lightweight, fast, and SEO-optimized public page showing all services, pricing, ratings, and working hours.'}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ height: '3rem', width: '3rem', borderRadius: '10px', background: 'rgba(37, 211, 102, 0.1)', color: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>{isHindi ? 'व्हाट्सएप बुकिंग और बॉट' : 'WhatsApp-First Booking'}</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {isHindi ? 'कस्टमर व्हाट्सएप डीप-लिंक या एआई चैटबॉट फ्लो के माध्यम से बिना ऐप डाउनलोड किए स्लॉट बुक कर सकते हैं।' : 'Standard wa.me redirects for Free/Growth plans, and automated WhatsApp AI chatbot flows for the Pro tier.'}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ height: '3rem', width: '3rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>{isHindi ? 'ऑटोमेटेड व्हाट्सएप रिमाइंडर्स' : 'Automated Reminders'}</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {isHindi ? 'अप्वाइंटमेंट से 2 घंटे पहले व्हाट्सएप पर ऑटो-रिमाइंडर भेजें। नो-शो रेट को 40% तक कम करें।' : 'Send automated reminders 2 hours before the appointment. Let clients reschedule directly by replying.'}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ height: '3rem', width: '3rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>{isHindi ? 'बिजनेस एनालिटिक्स' : 'Analytics Dashboard'}</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {isHindi ? 'पेज व्यूज, बुकिंग काउंट, व्यस्ततम घंटे, और सबसे ज्यादा कमाई देने वाली सर्विसेज की ट्रैकिंग।' : 'Track total views, booking sources, peak hours, service performance, and repeat customer ratios.'}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ height: '3rem', width: '3rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>{isHindi ? 'स्टाफ मैनेजमेंट' : 'Multi-Staff Schedules'}</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {isHindi ? 'हर स्टाफ मेंबर के लिए अलग टाइमिंग और स्लॉट उपलब्धता ताकि कस्टमर अपना मनपसंद स्टाफ चुन सकें।' : 'Assign service slots per staff member. Let customers book their favorite stylist or trainer directly.'}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ height: '3rem', width: '3rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>{isHindi ? 'गूगल मैप्स लिंकिंग (GMB)' : 'Google Maps Integration'}</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {isHindi ? 'अपने स्टोरफ्रंट लिंक को गूगल मैप्स प्रोफाइल से जोड़ें ताकि सर्च करने वाले सीधे बुक कर सकें।' : 'Integrate directly on Google My Business. Add your Bookze booking button directly to Google Maps search listings.'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive Showcase / Screenshots Section */}
      <section id="screenshots" style={{ padding: '6rem 0', background: 'linear-gradient(180deg, #fff 0%, #f1f5f9 100%)', borderTop: '1px solid #e2e8f0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="badge badge-success" style={{ marginBottom: '0.75rem' }}>{isHindi ? 'प्लेटफॉर्म गैलरी' : 'Interactive Showcase'}</span>
            <h2 style={{ fontSize: '2.5rem', letterSpacing: '-0.75px' }}>
              {isHindi ? 'बुकजी का लाइव इंटरफ़ेस देखें' : 'See How Bookze Simplifies Booking'}
            </h2>
            <p style={{ color: '#64748b', maxWidth: '600px', margin: '0.5rem auto 0 auto', fontSize: '0.95rem' }}>
              {isHindi ? 'कस्टमर बुकिंग पेज से लेकर मर्चेंट डैशबोर्ड तक, हर इंटरफ़ेस उपयोग करने में बेहद आसान है।' : 'Explore client booking, dashboard management, and real-time WhatsApp flow.'}
            </p>
          </div>

          {/* Tabs Control */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setScreenshotTab('storefront')}
              className={`btn btn-sm ${screenshotTab === 'storefront' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.6rem 1.25rem', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: 600 }}
            >
              📱 {isHindi ? 'कस्टमर बुकिंग' : 'Client Booking Flow'}
            </button>
            <button
              onClick={() => setScreenshotTab('dashboard')}
              className={`btn btn-sm ${screenshotTab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.6rem 1.25rem', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: 600 }}
            >
              📊 {isHindi ? 'मर्चेंट डैशबोर्ड' : 'Merchant Dashboard'}
            </button>
            <button
              onClick={() => setScreenshotTab('whatsapp')}
              className={`btn btn-sm ${screenshotTab === 'whatsapp' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.6rem 1.25rem', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: 600 }}
            >
              💬 {isHindi ? 'व्हाट्सएप चैट' : 'WhatsApp Notifications'}
            </button>
          </div>

          {/* Active Tab Screen Content */}
          <div style={{ display: 'flex', justifyContent: 'center', minHeight: '400px' }}>
            {screenshotTab === 'storefront' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%', maxWidth: '380px' }}
              >
                {/* Client Booking View Mobile Mockup */}
                <div className="glass-card" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '1.25rem', borderRadius: '24px' }}>
                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
                    <span>🌐 bookze.in/priyas-salon</span>
                    <span style={{ fontWeight: 600 }}>● Live</span>
                  </div>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                    <div style={{ width: '3.5rem', height: '3.5rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>PS</div>
                    <h4 style={{ marginTop: '0.5rem', fontWeight: 800, fontSize: '1.1rem' }}>Priya's Premium Salon</h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Sector 18, Noida • ★ 4.9 (120 reviews)</p>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{isHindi ? 'हमारी सेवाएं' : 'Services Catalogue'}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Haircut & Hair Spa</div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>₹499 · 45m</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 700 }}>✓ Selected</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', border: '1px solid #f1f5f9', borderRadius: '8px', opacity: 0.75, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Facial & Clean-up</div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>₹799 · 60m</span>
                        </div>
                        <button style={{ fontSize: '0.75rem', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'white' }}>+ Add</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', background: '#e0e7ff', padding: '0.75rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4338ca', marginBottom: '0.25rem' }}>📅 {isHindi ? 'स्लॉट चुनें' : 'Choose Appointment Slot'}</div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <div style={{ flex: 1, padding: '0.35rem', background: '#fff', borderRadius: '6px', textAlign: 'center', fontSize: '0.7rem', border: '1px solid #c7d2fe', fontWeight: 600, color: '#4338ca' }}>Tomorrow, 11 AM</div>
                      <div style={{ flex: 1, padding: '0.35rem', background: '#4338ca', borderRadius: '6px', color: '#fff', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600 }}>Tomorrow, 12 PM</div>
                    </div>
                  </div>
                  <button className="btn btn-whatsapp" style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem' }}>
                    <MessageSquare size={14} /> {isHindi ? 'व्हाट्सएप पर बुक करें' : 'Confirm Bookings on WhatsApp'}
                  </button>
                </div>
              </motion.div>
            )}

            {screenshotTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%', maxWidth: '800px' }}
              >
                {/* Dashboard Desktop View Mockup */}
                <div className="glass-card" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '1.5rem', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ height: '1.75rem', width: '1.75rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.85rem', fontWeight: 800 }}>B</span>
                      <span style={{ fontSize: '1rem', fontWeight: 800 }}>Bookze Partner Dashboard</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="badge badge-success">Priya's Salon</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Luv Sharma (Owner)</span>
                    </div>
                  </div>

                  {/* Dashboard Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ border: '1px solid #f1f5f9', padding: '0.75rem', borderRadius: '8px', background: '#f8fafc' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{isHindi ? 'कुल नियुक्तियाँ' : 'Total Appointments'}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6366f1', marginTop: '0.25rem' }}>184</div>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>↑ 12% this week</span>
                    </div>
                    <div style={{ border: '1px solid #f1f5f9', padding: '0.75rem', borderRadius: '8px', background: '#f8fafc' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{isHindi ? 'अनुमानित आय' : 'Estimated Revenue'}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>₹92,450</div>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>↑ 8.4% this week</span>
                    </div>
                    <div style={{ border: '1px solid #f1f5f9', padding: '0.75rem', borderRadius: '8px', background: '#f8fafc' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{isHindi ? 'पेज व्यूज' : 'Storefront Views'}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>1,420</div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Conversion: 13%</span>
                    </div>
                  </div>

                  {/* Booking Entries */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 700, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{isHindi ? 'हालिया बुकिंग्स' : 'Recent Bookings'}</span>
                      <span style={{ color: '#6366f1', cursor: 'pointer' }}>{isHindi ? 'सभी देखें' : 'View Calendar →'}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong>Anjali Gupta</strong> (Haircut + Hair Spa)
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Today, 4:00 PM - 4:45 PM · WhatsApp Confirmed</div>
                        </div>
                        <span className="badge badge-success">Active</span>
                      </div>
                      <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong>Amit Verma</strong> (General consultation)
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tomorrow, 10:30 AM - 11:00 AM · Pending Reply</div>
                        </div>
                        <span className="badge" style={{ background: '#fef3c7', color: '#d97706' }}>Pending</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {screenshotTab === 'whatsapp' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%', maxWidth: '380px' }}
              >
                {/* WhatsApp Chat Preview */}
                <div style={{ background: '#ece5dd', border: '1px solid #cbd5e1', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', borderRadius: '24px', overflow: 'hidden', fontFamily: 'sans-serif' }}>
                  {/* Chat Header */}
                  <div style={{ background: '#075e54', padding: '0.75rem 1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: '#fff', color: '#075e54', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>B</div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Bookze Assistant</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>online</div>
                    </div>
                  </div>

                  {/* Chat Body */}
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '320px', fontSize: '0.85rem' }}>
                    {/* Bot Message */}
                    <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', alignSelf: 'flex-start', maxWidth: '85%', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                      Hello Amit! 💇‍♂️
                      <br /><br />
                      You selected <strong>Haircut & Styling</strong> at <strong>Priya's Premium Salon</strong>.
                      <br /><br />
                      📅 Date: <strong>June 14, 2026</strong>
                      <br />
                      ⏰ Time: <strong>12:00 PM</strong>
                      <br /><br />
                      To confirm your slot instantly, please click send to message the merchant!
                    </div>

                    {/* Customer Response */}
                    <div style={{ background: '#dcf8c6', padding: '0.75rem', borderRadius: '8px', alignSelf: 'flex-end', maxWidth: '85%', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                      I want to book "Haircut & Styling" on June 14, 2026 at 12:00 PM via Bookze.
                    </div>

                    {/* Bot Confirmation */}
                    <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', alignSelf: 'flex-start', maxWidth: '85%', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                      ✅ <strong>Booking Confirmed!</strong>
                      <br /><br />
                      Your appointment at Priya's Premium Salon is successfully scheduled.
                      <br /><br />
                      📍 Location: Sector 18, Noida
                      <br />
                      📞 Support: +91 7668861953
                      <br /><br />
                      We will send you a reminder 2 hours before your session. See you there!
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '6rem 0', background: '#eff6ff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span className="badge badge-success" style={{ marginBottom: '0.75rem' }}>{isHindi ? 'किफायती प्लान्स' : 'Pricing Plans'}</span>
            <h2 style={{ fontSize: '2.5rem', letterSpacing: '-0.75px' }}>
              {isHindi ? 'एक छोटे निवेश से शुरुआत करें' : 'Fair Pricing for Service Businesses'}
            </h2>
            <p style={{ color: '#64748b', maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
              {isHindi ? 'फ्री प्लान से शुरू करें। जैसे-जैसे ग्राहक बढ़ें, प्रीमियम फीचर्स के साथ स्केल करें।' : 'Start with our free tier to test the water. Upgrade to automate notifications and calendars.'}
            </p>
          </div>

          <div className="grid-3" style={{ maxWidth: '1100px', margin: '0 auto' }}>

            {/* Free Plan */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'white', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                <h3 style={{ fontSize: '1.5rem' }}>{isHindi ? 'फ्री प्लान' : 'Free Plan'}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>₹0</span>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{isHindi ? '/हमेशा के लिए' : '/forever'}</span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  {isHindi ? 'डिजिटल प्रेजेंस और व्हाट्सएप बुकिंग लिंक शुरू करने के लिए।' : 'Great for starting out and establishing your booking page.'}
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', listStyle: 'none', fontSize: '0.9rem', color: '#64748b' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#10b981' }} /> {isHindi ? '1 बिजनेस स्टोरफ्रंट' : '1 Business Storefront'}</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#10b981' }} /> {isHindi ? 'अधिकतम 5 सर्विसेज' : 'Up to 5 Services'}</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#10b981' }} /> {isHindi ? 'व्हाट्सएप बुकिंग लिंक (wa.me)' : 'WhatsApp Redirection Link'}</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#10b981' }} /> {isHindi ? 'मैनुअल कन्फर्मेशन' : 'Manual Confirmation'}</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.5 }}><CheckCircle size={16} /> {isHindi ? 'व्हाट्सएप रिमाइंडर्स (बंद)' : 'Auto Reminders (No)'}</li>
                </ul>
              </div>
              <a href="#demo" className="btn btn-secondary" style={{ width: '100%', marginTop: '2rem' }}>{isHindi ? 'फ्री बनाएं' : 'Create Free Link'}</a>
            </div>

            {/* Growth Plan */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'white', border: '2px solid #6366f1', boxShadow: 'var(--shadow-premium)' }}>
              <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#6366f1', color: 'white', padding: '0.25rem 1rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                {isHindi ? 'लोकप्रिय' : 'Most Popular'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', marginTop: '0.5rem' }}>
                <h3 style={{ fontSize: '1.5rem' }}>{isHindi ? 'ग्रोथ प्लान' : 'Growth Plan'}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>₹499</span>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{isHindi ? '/महीना' : '/month'}</span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  {isHindi ? 'बढ़ते छोटे व्यवसायों के लिए जो बुकिंग ऑटोमेट करना चाहते हैं।' : 'Automated reminders to reduce no-shows and sync schedules.'}
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', listStyle: 'none', fontSize: '0.9rem', color: '#64748b' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#6366f1' }} /> <strong>{isHindi ? 'व्हाट्सएप ऑटो-रिमाइंडर्स' : 'WhatsApp Auto-Reminders'}</strong></li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#6366f1' }} /> {isHindi ? 'गूगल कैलेंडर सिंक' : 'Google Calendar Sync'}</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#6366f1' }} /> {isHindi ? 'अनलिमिटेड सर्विसेज' : 'Unlimited Services'}</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#6366f1' }} /> {isHindi ? 'नो बुकजी ब्रांडिंग' : 'No Bookze Branding'}</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#6366f1' }} /> {isHindi ? '3 स्टाफ मेंबर्स' : '3 Staff Member Profiles'}</li>
                </ul>
              </div>
              <a href="#demo" className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }}>{isHindi ? 'ग्रोथ शुरू करें' : 'Get Growth'}</a>
            </div>

            {/* Pro Plan */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'white' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                <h3 style={{ fontSize: '1.5rem' }}>{isHindi ? 'प्रो प्लान' : 'Pro Plan'}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>₹1,499</span>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{isHindi ? '/महीना' : '/month'}</span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  {isHindi ? 'व्हाट्सएप चैटबॉट बुकिंग और बड़ी टीम्स के लिए।' : 'Complete AI Chatbot flow and multi-staff scheduling.'}
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', listStyle: 'none', fontSize: '0.9rem', color: '#64748b' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#10b981' }} /> <strong>{isHindi ? 'व्हाट्सएप चैटबॉट बुकिंग (ऑटो)' : 'WhatsApp Chatbot Flow'}</strong></li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#10b981' }} /> {isHindi ? 'बुकिंग ऑटो-कन्फर्मेशन' : 'Auto-Confirm Bookings'}</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#10b981' }} /> {isHindi ? '10 स्टाफ मेंबर्स शेड्यूलिंग' : 'Up to 10 Staff Profiles'}</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#10b981' }} /> {isHindi ? 'गूगल रिव्यू ऑटोमेशन' : 'Google Review Automation'}</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} style={{ color: '#10b981' }} /> {isHindi ? 'प्रीमियम व्हाट्सएप सपोर्ट' : 'Priority WhatsApp Support'}</li>
                </ul>
              </div>
              <a href="#demo" className="btn btn-secondary" style={{ width: '100%', marginTop: '2rem' }}>{isHindi ? 'प्रो शुरू करें' : 'Get Pro'}</a>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ padding: '6rem 0' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <HelpCircle size={32} style={{ color: '#6366f1', margin: '0 auto 0.5rem auto' }} />
            <h2 style={{ fontSize: '2.5rem', letterSpacing: '-0.75px' }}>
              {isHindi ? 'अक्सर पूछे जाने वाले सवाल' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ background: 'white' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {isHindi ? '1. क्या मुझे व्हाट्सएप एपीआई (API) तुरंत चाहिए?' : '1. Do I need a Meta WhatsApp API account immediately?'}
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {isHindi ? (
                  'नहीं! फ्री और ग्रोथ प्लान व्हाट्सएप लिंक का उपयोग करते हैं जो बिना किसी सेटअप के आपके पर्सनल व्हाट्सएप नंबर पर खुलते हैं। जब आप प्रो प्लान पर आते हैं, तब हम व्हाट्सएप एपीआई सेटअप करके एआई चैटबॉट चालू करते हैं।'
                ) : (
                  'No! Free and Growth plans use standard WhatsApp Deep Links (wa.me redirection) which open in the customer’s WhatsApp to your business number instantly with zero configuration needed. WhatsApp Business API is only needed if you want the automated chatbot flow (Pro Plan).'
                )}
              </p>
            </div>

            <div className="glass-card" style={{ background: 'white' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {isHindi ? '2. क्या कस्टमर को बुकिंग के लिए कोई ऐप डाउनलोड करना होगा?' : '2. Do clients need to install any app to book?'}
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {isHindi ? (
                  'बिल्कुल नहीं! कस्टमर सिर्फ आपके स्टोरफ्रंट लिंक पर क्लिक करके क्रोम/सफारी पर सेवाएं देखते हैं और सीधे व्हाट्सएप पर बुक करते हैं। व्हाट्सएप भारत में हर स्मार्टफोन में पहले से मौजूद है।'
                ) : (
                  'Absolutely not! Customers open your web URL, select services, and tap "Book Now". It directs them to WhatsApp, which is already installed on almost 100% of smartphones in India.'
                )}
              </p>
            </div>

            <div className="glass-card" style={{ background: 'white' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {isHindi ? '3. गूगल मैप्स (Google My Business) लिंकिंग कैसे काम करती है?' : '3. How does the Google My Business integration work?'}
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {isHindi ? (
                  'हम मर्चेंट ऑनबोर्डिंग के दौरान आपके गूगल मैप्स प्रोफाइल पर बुकिंग बटन लिंक करने में मदद करते हैं। इससे मैप्स पर आपको खोजने वाले कस्टमर सीधे आपकी बुकजी प्रोफाइल खोलकर अप्वाइंटमेंट ले सकते हैं।'
                ) : (
                  'We help link your Bookze storefront URL to your Google My Business / Maps profile. When local clients search for you (e.g. "salon near me"), they can click your Bookze booking button directly in search results.'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Homepage Contact section */}
      <section id="contact" style={{ padding: '5rem 0', background: 'linear-gradient(180deg, #fff 0%, #f8fafc 100%)', borderTop: '1px solid #e2e8f0' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="badge badge-success" style={{ marginBottom: '0.75rem' }}>{isHindi ? 'संपर्क करें' : 'Get in Touch'}</span>
            <h2 style={{ fontSize: '2.5rem', letterSpacing: '-0.75px' }}>
              {isHindi ? 'कोई सवाल है? हमसे पूछें' : 'Have Questions? Reach Out'}
            </h2>
            <p style={{ color: '#64748b', maxWidth: '500px', margin: '0.5rem auto 0 auto', fontSize: '0.95rem' }}>
              {isHindi ? 'हमारी टीम आपकी सहायता के लिए यहाँ है। नीचे दिए गए फ़ॉर्म को भरें।' : 'Need custom triggers or have enterprise queries? Send a message and we will respond shortly.'}
            </p>
          </div>

          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Contact Details Card */}
            <div className="glass-card" style={{ background: 'white', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{isHindi ? 'संपर्क जानकारी' : 'Direct Support'}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={16} style={{ color: '#6366f1' }} />
                  <span><strong>Bookze Platform</strong> (Sole Proprietorship)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={16} style={{ color: '#6366f1' }} />
                  <span>Founder: <strong>Luv Sharma</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} style={{ color: '#6366f1' }} />
                  <span>Sector 18, Noida, Uttar Pradesh, India</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={16} style={{ color: '#6366f1' }} />
                  <a href="mailto:luvsharma105@gmail.com" className="text-indigo-600 hover:underline">luvsharma105@gmail.com</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={16} style={{ color: '#6366f1' }} />
                  <a href="tel:+917668861953" className="text-slate-700 hover:text-indigo-600 transition">+91 7668861953</a>
                </div>
              </div>
            </div>

            {/* Quick Contact Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                alert(isHindi ? "धन्यवाद! आपका संदेश सफलतापूर्वक भेज दिया गया है।" : "Thank you! Your message has been sent successfully.");
                (e.target as HTMLFormElement).reset();
              }}
              className="glass-card" 
              style={{ background: 'white', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{isHindi ? 'आपका नाम' : 'Your Name'}</label>
                <input type="text" className="form-input" required placeholder="e.g. Luv Sharma" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{isHindi ? 'ईमेल एड्रेस' : 'Email Address'}</label>
                <input type="email" className="form-input" required placeholder="name@company.com" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{isHindi ? 'आपका संदेश' : 'Message'}</label>
                <textarea className="form-input" required rows={3} placeholder={isHindi ? 'आप क्या पूछना चाहते हैं...' : 'How can we help your business...'} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>
                {isHindi ? 'संदेश भेजें' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#090d16', color: '#94a3b8', padding: '4rem 0 2rem 0', borderTop: '1px solid #1f2937', marginTop: 'auto' }}>
        <div className="container footer-grid" style={{ marginBottom: '3rem' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ height: '2rem', width: '2rem', borderRadius: '6px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem' }}>B</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>Bookze</span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
              {isHindi ? 'भारतीय लोकल सर्विस व्यवसायों को व्हाट्सएप की शक्ति से सशक्त बनाना।' : 'Empowering local service businesses across India with WhatsApp storefront automation.'}
            </p>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem' }}>{isHindi ? 'प्लेटफॉर्म' : 'Platform'}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li><Link href="/dashboard" className="hover-white">{isHindi ? 'मर्चेंट डैशबोर्ड' : 'Merchant Dashboard'}</Link></li>
              <li><Link href="/book/priyas-salon" className="hover-white">{isHindi ? 'लाइव सैलून स्टोर' : 'Live Salon Demo'}</Link></li>
              <li><Link href="/book/flex-fitness" className="hover-white">{isHindi ? 'लाइव जिम स्टोर' : 'Live Gym Demo'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem' }}>{isHindi ? 'कंपनी' : 'Company'}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li><Link href="/about" className="hover-white">{isHindi ? 'हमारे बारे में' : 'About Us'}</Link></li>
              <li><Link href="/contact" className="hover-white">{isHindi ? 'संपर्क करें' : 'Contact Us'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem' }}>{isHindi ? 'कानूनी' : 'Legal'}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li><Link href="/privacy" className="hover-white">{isHindi ? 'गोपनीयता नीति' : 'Privacy Policy'}</Link></li>
              <li><Link href="/terms" className="hover-white">{isHindi ? 'नियम और शर्तें' : 'Terms & Conditions'}</Link></li>
              <li><Link href="/refund" className="hover-white">{isHindi ? 'वापसी नीति' : 'Refund Policy'}</Link></li>
            </ul>
          </div>

        </div>

        <div className="container" style={{ borderTop: '1px solid #1f2937', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem' }}>
          <span>© 2026 Bookze Platform. All Rights Reserved.</span>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="/privacy" className="hover-white">Privacy Policy</Link>
            <Link href="/terms" className="hover-white">Terms & Conditions</Link>
            <Link href="/refund" className="hover-white">Refund & Cancellation</Link>
          </div>
        </div>
      </footer>

      {/* Internal helper styles */}
      <style jsx>{`
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          align-items: center;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        .hover-link:hover {
          color: #6366f1;
          transition: color 0.2s ease;
        }
        .hover-white:hover {
          color: white;
          transition: color 0.2s ease;
        }
        @media (min-width: 768px) {
          .hero-grid {
            grid-template-columns: 1.2fr 1fr;
            gap: 3rem;
          }
          .footer-grid {
            grid-template-columns: 1.5fr 1fr 1fr 1fr;
            gap: 3rem;
          }
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .landing-layout {
            text-align: center;
          }
          section {
            padding: 3rem 0 !important;
          }
          h1 {
            font-size: 2.25rem !important;
          }
        }
      `}</style>

    </div>
  );
}
