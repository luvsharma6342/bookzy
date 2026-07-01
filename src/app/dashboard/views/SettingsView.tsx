import React from 'react';
import { CreditCard, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { Business } from '@/lib/db';

interface SettingsViewProps {
  business: Business;
  setBusiness: (biz: Business) => void;
  paymentLoading: string | null;
  handleUpgrade: (plan: 'growth' | 'pro') => Promise<void>;
  cancelLoading: boolean;
  handleCancelSubscription: () => Promise<void>;
  reloadData: (businessId: string) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const SettingsView = React.memo(function SettingsView({
  business,
  setBusiness,
  paymentLoading,
  handleUpgrade,
  cancelLoading,
  handleCancelSubscription,
  reloadData,
  showToast
}: SettingsViewProps) {
  return (
    <div className="flex flex-col gap-6">
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 600 }}>ACTIVE PLAN</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '1.5rem', fontWeight: 800,
                color: business.plan === 'pro' ? '#a855f7' : business.plan === 'growth' ? '#6366f1' : '#64748b'
              }}>
                {business.plan.charAt(0).toUpperCase() + business.plan.slice(1)}
              </span>
              {business.plan !== 'free' && (
                <span className={`badge ${
                  business.planStatus === 'cancelled' ? 'badge-warning' :
                  business.planStatus === 'past_due' ? 'badge-danger' : 'badge-success'
                }`} style={{ fontSize: '0.65rem' }}>
                  {business.planStatus === 'cancelled' ? '⚠ Cancels Soon' :
                   business.planStatus === 'past_due' ? '❌ Past Due' : '✓ Active'}
                </span>
              )}
            </div>
            {business.plan !== 'free' && business.planExpiresAt && (
              <span style={{ fontSize: '0.78rem', opacity: 0.65 }}>
                {business.planStatus === 'cancelled' ? 'Access until' : 'Renews on'}{' '}
                <strong>{new Date(business.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </span>
            )}
            {business.plan === 'free' && (
              <span style={{ fontSize: '0.78rem', opacity: 0.6 }}>Free forever · Upgrade to unlock automation</span>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
              {business.plan === 'free' ? '₹0' : business.plan === 'growth' ? '₹499' : '₹1,499'}
            </div>
            {business.plan !== 'free' && (
              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>per month</div>
            )}
          </div>
        </div>

        {business.plan !== 'pro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>UPGRADE YOUR PLAN</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

              {business.plan !== 'growth' && (
                <div style={{ border: '2px solid #6366f1', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="flex justify-between items-center">
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

              <div style={{ border: '2px solid #a855f7', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="flex justify-between items-center">
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

        {business.plan !== 'free' && business.razorpaySubscriptionId && business.planStatus === 'active' && (
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

        {business.planStatus === 'cancelled' && business.planExpiresAt && (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem', color: '#d97706' }}>
            ⚠ Your subscription is cancelled. You have full access until{' '}
            <strong>{new Date(business.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
            After that, the account will revert to the Free plan.
          </div>
        )}
      </div>

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
              <option value="Web Development & Freelancers">Web Development & Freelancers</option>
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
  );
});


export default SettingsView;
