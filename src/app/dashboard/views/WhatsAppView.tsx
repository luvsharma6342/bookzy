import React, { useState } from 'react';
import type { Business } from '@/lib/db';

interface WhatsAppViewProps {
  business: Business;
  reloadData: (businessId: string) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const WhatsAppView = React.memo(function WhatsAppView({
  business,
  reloadData,
  showToast
}: WhatsAppViewProps) {
  const [metaWabaIdInput, setMetaWabaIdInput] = useState(business?.metaWabaId || '');
  const [metaPhoneNumberIdInput, setMetaPhoneNumberIdInput] = useState(business?.metaPhoneNumberId || '');
  const [metaPermanentTokenInput, setMetaPermanentTokenInput] = useState(business?.metaPermanentToken || '');
  const [saveBizLoading, setSaveBizLoading] = useState(false);
  
  const [testPhoneInput, setTestPhoneInput] = useState('');
  const [testSending, setTestSending] = useState(false);

  const handleSaveWABA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setSaveBizLoading(true);
    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: business.id,
          metaWabaId: metaWabaIdInput,
          metaPhoneNumberId: metaPhoneNumberIdInput,
          metaPermanentToken: metaPermanentTokenInput,
        })
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("WhatsApp configuration saved!", "success");
      reloadData(business.id);
    } catch (err) {
      showToast("Failed to save config", "error");
    } finally {
      setSaveBizLoading(false);
    }
  };

  const handleSendTestWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !testPhoneInput) return;
    setTestSending(true);
    try {
      const res = await fetch("/api/whatsapp/send-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          to: testPhoneInput,
          templateName: 'booking_confirmation',
          components: [
            { type: "body", parameters: [
              { type: "text", text: "Test User" },
              { type: "text", text: "Test Service" },
              { type: "text", text: "Today at 5PM" },
              { type: "text", text: "Any Staff" }
            ]}
          ]
        })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed");
      }
      showToast("Test message sent! Check WhatsApp.", "success");
      setTestPhoneInput('');
    } catch (err: any) {
      showToast(`Send failed: ${err.message}`, "error");
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h3 style={{ fontSize: '1.25rem' }}>WhatsApp Cloud API Integration</h3>
        <span className="badge badge-success">Pro Plan active</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div className="glass-card" style={{ background: 'var(--card)' }}>
          <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            Meta Developer Account Credentials
          </h4>
          
          <form onSubmit={handleSaveWABA} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Meta WABA ID</label>
              <input 
                type="text" 
                placeholder="e.g. 1098485743729" 
                className="form-input" 
                value={metaWabaIdInput}
                onChange={(e) => setMetaWabaIdInput(e.target.value)} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Meta Phone Number ID</label>
              <input 
                type="text" 
                placeholder="e.g. 1047285938202" 
                className="form-input" 
                value={metaPhoneNumberIdInput}
                onChange={(e) => setMetaPhoneNumberIdInput(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Meta Permanent Access Token</label>
              <input 
                type="password" 
                placeholder="EAAGkZB...vXj" 
                className="form-input" 
                value={metaPermanentTokenInput}
                onChange={(e) => setMetaPermanentTokenInput(e.target.value)} 
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={saveBizLoading}
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              {saveBizLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-6">
          <div className="glass-card" style={{ background: 'var(--card)' }}>
            <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
              Webhook Configuration
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
              Configure Meta's developer portal webhook to point here to capture incoming responses (like canceling a booking when a user replies CANCEL).
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span className="text-xs font-semibold text-slate-400">CALLBACK URL</span>
                <div className="form-input" style={{ fontSize: '0.75rem', background: 'var(--muted-light)', userSelect: 'all', fontFamily: 'monospace', padding: '0.5rem' }}>
                  https://bookze.vercel.app/api/whatsapp/webhook
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400">VERIFY TOKEN</span>
                <div className="form-input" style={{ fontSize: '0.75rem', background: 'var(--muted-light)', userSelect: 'all', fontFamily: 'monospace', padding: '0.5rem' }}>
                  bookze_whatsapp_2024
                </div>
              </div>
            </div>
          </div>

          {business?.metaPhoneNumberId && business?.metaPermanentToken && (
            <div className="glass-card" style={{ background: 'var(--card)' }}>
              <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                Test Connection
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                Send a test `booking_confirmation` template message to your phone.
              </p>
              
              <form onSubmit={handleSendTestWhatsApp} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="tel" 
                  placeholder="+919999999999" 
                  required
                  className="form-input" 
                  style={{ flex: 1 }}
                  value={testPhoneInput}
                  onChange={(e) => setTestPhoneInput(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={testSending}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  {testSending ? 'Sending...' : 'Send Test'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ background: 'var(--card)' }}>
        <h4 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          Pre-Approved WhatsApp Templates
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          To send messages, you must first create these template names inside your Meta Business Suite:
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ background: 'var(--muted-light)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
              <span>TEMPLATE: `booking_confirmation`</span>
              <span>REQUIRED</span>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', fontFamily: 'monospace' }}>
              "Hi {"{{1}}"}(Name), your {"{{2}}"}(Service) appointment at {"{{3}}"}(Time) with {"{{4}}"}(Staff) is confirmed! See you then."
            </p>
          </div>

          <div style={{ background: 'var(--muted-light)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
              <span>TEMPLATE: `appointment_reminder`</span>
              <span>REQUIRED</span>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', fontFamily: 'monospace' }}>
              "Hi {"{{1}}"}(Name), friendly reminder: your {"{{2}}"}(Service) is scheduled for today at {"{{3}}"}(Time). Reply CANCEL to cancel."
            </p>
          </div>

          <div style={{ background: 'var(--muted-light)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
              <span>TEMPLATE: `no_show_followup`</span>
              <span>REQUIRED</span>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', fontFamily: 'monospace' }}>
              "Hi {"{{1}}"}(Name), we missed you for your {"{{2}}"}(Service) today. Want to reschedule? Reply YES and we'll find you a new slot."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});


export default WhatsAppView;
