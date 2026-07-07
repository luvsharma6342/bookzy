import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { Business } from '@/lib/db';

interface AvailabilityViewProps {
  business: Business;
  blockedDates: any[];
  handleUpdateWorkingHours: (updatedHours: any) => Promise<void>;
  reloadData: (businessId: string) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const AvailabilityView = React.memo(function AvailabilityView({
  business,
  blockedDates,
  handleUpdateWorkingHours,
  reloadData,
  showToast
}: AvailabilityViewProps) {
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
    if (!window.confirm("Remove this blocked date?")) return;
    try {
      const res = await fetch(`/api/blocked-dates?id=${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to unblock date");
      
      showToast("Date unblocked", "success");
      reloadData(business.id);
    } catch (err: any) {
      showToast(err.message || "Error unblocking date", "error");
    }
  };

  const [localWorkingHours, setLocalWorkingHours] = useState(business.workingHours);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync if business object updates from outside
  React.useEffect(() => {
    setLocalWorkingHours(business.workingHours);
    setHasChanges(false);
  }, [business.workingHours]);

  const handleSaveWorkingHours = async () => {
    setIsSaving(true);
    try {
      await handleUpdateWorkingHours(localWorkingHours);
      setHasChanges(false);
      showToast("Working hours saved successfully!", "success");
    } catch (err: any) {
      showToast("Failed to save working hours", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h3 style={{ fontSize: '1.25rem' }}>Working Hours Settings</h3>
      
      <div className="glass-card" style={{ background: 'var(--card)' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          Set the days and hours your business is open for booking. Unchecked days will block the booking calendar for customers.
        </p>

        <div className="flex flex-col gap-4">
          {Object.entries(localWorkingHours).map(([day, hours]: [string, any]) => (
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
                    setLocalWorkingHours({
                      ...localWorkingHours,
                      [day]: { ...hours, closed: !hours.closed }
                    });
                    setHasChanges(true);
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
                      setLocalWorkingHours({
                        ...localWorkingHours,
                        [day]: { ...hours, open: e.target.value }
                      });
                      setHasChanges(true);
                    }}
                  />
                  <span style={{ opacity: 0.6 }}>to</span>
                  <input 
                    type="time" 
                    className="form-input" 
                    style={{ width: '110px', padding: '0.3rem 0.5rem', fontSize: '0.85rem' }} 
                    value={hours.close}
                    onChange={(e) => {
                      setLocalWorkingHours({
                        ...localWorkingHours,
                        [day]: { ...hours, close: e.target.value }
                      });
                      setHasChanges(true);
                    }}
                  />
                </div>
              ) : (
                <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>Closed (Blocked)</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button 
            className={`btn ${hasChanges ? 'btn-primary' : 'btn-outline'}`}
            disabled={!hasChanges || isSaving}
            onClick={handleSaveWorkingHours}
            style={{ minWidth: '150px' }}
          >
            {isSaving ? 'Saving...' : (hasChanges ? 'Save Settings' : 'Saved')}
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📅 Holiday & Date Blocks</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.15rem' }}>Mark specific calendar dates as closed (e.g. festivals, leave, holidays)</p>
          </div>
        </div>

        <form onSubmit={handleBlockDate} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Date *</label>
            <input
              type="date"
              required
              className="form-input"
              style={{ height: '38px', fontSize: '0.85rem' }}
              value={blockDateInput}
              onChange={(e) => setBlockDateInput(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '200px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Reason (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Diwali Holiday, Staff Training"
              className="form-input"
              style={{ height: '38px', fontSize: '0.85rem' }}
              value={blockReasonInput}
              onChange={(e) => setBlockReasonInput(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={blockLoading}
            className="btn btn-primary btn-sm"
            style={{ height: '38px', padding: '0 1.25rem', whiteSpace: 'nowrap' }}
          >
            {blockLoading ? 'Blocking...' : 'Block Date'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.25rem' }}>Active Blocks</h5>
          {blockedDates.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>
              No custom blocked dates added yet. Your booking page relies on weekly hours only.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
              {blockedDates.map((bd) => (
                <div key={bd.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div className="flex flex-col gap-1">
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {new Date(bd.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {bd.reason && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Reason: {bd.reason}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnblockDate(bd.id)}
                    className="btn btn-outline btn-sm"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});


export default AvailabilityView;
