import React, { useState } from 'react';
import { Plus, Pencil, X } from 'lucide-react';
import { renderFormattedDescription } from '@/lib/formatter';
import type { Business, Service } from '@/lib/db';

interface ServicesViewProps {
  business: Business;
  services: Service[];
  CATEGORY_MAP: Record<string, string[]>;
  handleAddServiceSubmit: (e: React.FormEvent) => Promise<void>;
  handleToggleService: (svc: Service) => Promise<void>;
  openEditService: (svc: Service) => void;
  reloadData: (businessId: string) => Promise<void>;
  
  // Props mapped to state in page.tsx
  showAddService: boolean;
  setShowAddService: React.Dispatch<React.SetStateAction<boolean>>;
  newServiceName: string;
  setNewServiceName: React.Dispatch<React.SetStateAction<string>>;
  newServiceCategory: string;
  setNewServiceCategory: React.Dispatch<React.SetStateAction<string>>;
  newServicePrice: number;
  setNewServicePrice: React.Dispatch<React.SetStateAction<number>>;
  newServiceDuration: number;
  setNewServiceDuration: React.Dispatch<React.SetStateAction<number>>;
  newServiceDesc: string;
  setNewServiceDesc: React.Dispatch<React.SetStateAction<string>>;
}

const ServicesView = React.memo(function ServicesView({
  business,
  services,
  CATEGORY_MAP,
  handleAddServiceSubmit,
  handleToggleService,
  openEditService,
  reloadData,
  showAddService,
  setShowAddService,
  newServiceName,
  setNewServiceName,
  newServiceCategory,
  setNewServiceCategory,
  newServicePrice,
  setNewServicePrice,
  newServiceDuration,
  setNewServiceDuration,
  newServiceDesc,
  setNewServiceDesc
}: ServicesViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h3 style={{ fontSize: '1.25rem' }}>Service Catalogue ({services.length})</h3>
        <button onClick={() => setShowAddService(!showAddService)} className="btn btn-primary btn-sm">
          <Plus size={16} /> Add New Service
        </button>
      </div>

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
                {(CATEGORY_MAP[business.category] || ["General", "Consultation"]).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {services.map(svc => (
          <div key={svc.id} className="glass-card" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem' }}>{svc.name}</h4>
                  <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>{svc.category}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{renderFormattedDescription(svc.description)}</div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  <span>⏱️ {svc.duration} mins</span>
                  <strong>₹{svc.price}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
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
                  onClick={() => openEditService(svc)}
                  title="Edit service"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', opacity: 0.8, padding: '0.2rem' }}
                >
                  <Pencil size={15} />
                </button>

                <button 
                  onClick={() => {
                    if (window.confirm('Delete this service from catalog?')) {
                      fetch(`/api/services?id=${svc.id}`, { method: "DELETE" })
                        .then(() => reloadData(business.id));
                    }
                  }}
                  title="Delete service"
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6, padding: '0.2rem' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});


export default ServicesView;
