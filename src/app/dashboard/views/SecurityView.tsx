import React, { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

interface SecurityViewProps {
  hasPasswordAccount: boolean | null;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export default function SecurityView({
  hasPasswordAccount,
  showToast
}: SecurityViewProps) {
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h3 style={{ fontSize: '1.25rem' }}>Password &amp; Security</h3>

      <div className="glass-card" style={{ background: 'var(--card)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '8px', background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={18} style={{ color: '#a855f7' }} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>Change Password</h4>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Update your account password to keep your credentials secure</p>
          </div>
        </div>

        {hasPasswordAccount === null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6, fontSize: '0.85rem', padding: '0.5rem' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Checking account authentication status...</span>
          </div>
        ) : hasPasswordAccount ? (
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const currentPassword = (target.elements.namedItem("currentPassword") as HTMLInputElement).value;
              const newPassword = (target.elements.namedItem("newPassword") as HTMLInputElement).value;
              const confirmPassword = (target.elements.namedItem("confirmPassword") as HTMLInputElement).value;

              if (newPassword !== confirmPassword) {
                showToast("New passwords do not match.", "error");
                return;
              }

              if (newPassword.length < 8) {
                showToast("Password must be at least 8 characters long.", "error");
                return;
              }

              setPasswordChangeLoading(true);
              try {
                const { error } = await authClient.changePassword({
                  newPassword,
                  currentPassword,
                  revokeOtherSessions: true
                });

                if (error) {
                  showToast(error.message || "Failed to change password. Please check your current password.", "error");
                } else {
                  showToast("Password updated successfully!", "success");
                  target.reset();
                }
              } catch (err) {
                showToast("An unexpected error occurred.", "error");
              } finally {
                setPasswordChangeLoading(false);
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Current Password</label>
                <input name="currentPassword" type="password" required className="form-input" placeholder="••••••••" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Password</label>
                <input name="newPassword" type="password" required className="form-input" placeholder="Min. 8 characters" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Confirm New Password</label>
                <input name="confirmPassword" type="password" required className="form-input" placeholder="Repeat new password" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                disabled={passwordChangeLoading}
                className="btn btn-primary btn-sm"
                style={{ minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                {passwordChangeLoading ? (
                  <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</>
                ) : (
                  <>Update Password</>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <span>🔒</span> Authenticated via Google OAuth
            </p>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.75, margin: 0 }}>
              Your account is registered using your Google profile. Because you sign in without a password, you cannot directly set or change a password from this settings panel.
            </p>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.75, margin: 0 }}>
              If you wish to log in using standard credentials in the future, please log out and click **"Forgot Password"** on the login screen. Google allows you to securely assign a password to your email address through the password reset flow.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
