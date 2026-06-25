import React from 'react';
import { Plus, Star, Calendar } from 'lucide-react';
import type { Business, Staff } from '@/lib/db';

interface StaffViewProps {
  business: Business;
  staffList: Staff[];
  openAddStaff: () => void;
  openEditStaff: (st: Staff) => void;
  reloadData: (businessId: string) => Promise<void>;
}

export default function StaffView({
  business,
  staffList,
  openAddStaff,
  openEditStaff,
  reloadData
}: StaffViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem' }}>Staff Profiles</h3>
        <button 
          onClick={openAddStaff}
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

            {/* Assigned Services List */}
            {st.services && st.services.length > 0 ? (
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center', marginTop: '0.25rem' }}>
                {st.services.map((s: any) => (
                  <span key={s.id} className="badge badge-muted" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                    {s.name}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                All Services Offered
              </span>
            )}

            <div style={{ display: 'flex', width: '100%', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button 
                onClick={() => {
                  const baseUrl = window.location.origin;
                  const authUrl = `${baseUrl}/api/staff/google-auth?staffId=${st.id}`;
                  navigator.clipboard.writeText(authUrl);
                  alert("Google Calendar connect link copied to clipboard! Share it with this staff member.");
                }}
                className="btn btn-outline btn-sm"
                style={{ flex: 1, padding: '0.35rem', borderColor: '#4285F4', color: '#4285F4', fontSize: '0.7rem' }}
                title="Copy Calendar Connect Link"
              >
                <Calendar size={12} style={{ display: 'inline', marginRight: '2px' }} /> Sync
              </button>
              <button 
                onClick={() => openEditStaff(st)}
                className="btn btn-outline btn-sm"
                style={{ flex: 1, padding: '0.35rem', fontSize: '0.7rem' }}
              >
                Edit
              </button>
              <button 
                onClick={() => {
                  if (window.confirm(`Remove staff profile for ${st.name}?`)) {
                    fetch(`/api/staff?id=${st.id}`, { method: "DELETE" })
                      .then(() => reloadData(business.id));
                  }
                }}
                className="btn btn-outline btn-sm"
                style={{ flex: 1, padding: '0.35rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
