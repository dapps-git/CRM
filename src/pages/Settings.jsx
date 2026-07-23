import React, { useState, useEffect } from 'react';
import { FiLock, FiUpload, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { companyName, companyLogo, setCompanyName, setCompanyLogo } = useAuth();

  const [nameInput, setNameInput] = useState(companyName);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(companyLogo);
  const [savingBrand, setSavingBrand] = useState(false);

  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Keep form in sync if context changes from elsewhere
  useEffect(() => {
    setNameInput(companyName);
    setLogoPreview(companyLogo);
  }, [companyName, companyLogo]);

  /* ── Handle logo file pick ── */
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  /* ── Save branding ── */
  const handleSaveBrand = async (e) => {
    e.preventDefault();
    setSavingBrand(true);
    try {
      const formData = new FormData();
      formData.append('companyName', nameInput);
      if (logoFile) formData.append('companyLogo', logoFile);

      const res = await api.put('/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update global context immediately → sidebar + login page update
      setCompanyName(nameInput);
      if (res.data.companyLogo) {
        setCompanyLogo(res.data.companyLogo);
        setLogoPreview(res.data.companyLogo);
      }
      setLogoFile(null);
      toast.success('Branding updated — sidebar and login page reflect changes');
    } catch {
      toast.error('Failed to save branding');
    } finally {
      setSavingBrand(false);
    }
  };

  /* ── Change Password ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwords.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setSavingPwd(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  /* ── Shared input style ── */
  const INPUT = {
    width: '100%',
    background: '#ffffff',
    border: '1px solid rgba(138,50,198,0.18)',
    borderRadius: 8,
    color: '#2c2438',
    fontSize: 12,
    fontFamily: 'Montserrat, sans-serif',
    padding: '8px 12px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const onFocus = e => { e.target.style.borderColor = '#8a32c6'; e.target.style.boxShadow = '0 0 0 3px rgba(138,50,198,0.12)'; };
  const onBlur  = e => { e.target.style.borderColor = 'rgba(138,50,198,0.18)'; e.target.style.boxShadow = 'none'; };

  const LABEL = {
    display: 'block',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#76726a',
    marginBottom: 6,
    fontFamily: 'Montserrat, sans-serif',
  };

  const CARD = {
    background: '#ffffff',
    border: '1px solid rgba(138,50,198,0.1)',
    borderRadius: 14,
    padding: '24px 22px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    position: 'relative',
    overflow: 'hidden',
  };

  const ACCENT_LINE = (color) => ({
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 3,
    background: `linear-gradient(90deg, ${color}, transparent)`,
    borderRadius: '14px 14px 0 0',
  });

  return (
    <div style={{ maxWidth: 560, fontFamily: 'Montserrat, sans-serif', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Page Title ── */}
      <div>
        <h1 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Settings</h1>
        <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
          Manage company branding and account security.
        </p>
      </div>

      {/* ─────────────── BRANDING CARD ─────────────── */}
      <div style={CARD}>
        <div style={ACCENT_LINE('#f4ce41')} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(244,206,65,0.12)', border: '1px solid rgba(244,206,65,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiUpload size={14} style={{ color: '#b08d02' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#2c2438' }}>Company Branding</div>
            <div style={{ fontSize: 10, color: '#76726a', fontWeight: 500 }}>Logo and name shown in sidebar &amp; login screen</div>
          </div>
        </div>

        <form onSubmit={handleSaveBrand} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Company Name */}
          <div>
            <label style={LABEL}>Company Name</label>
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="Enter company name"
              style={INPUT}
              onFocus={onFocus}
              onBlur={onBlur}
              required
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label style={LABEL}>Company Logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Preview */}
              <div style={{
                width: 56, height: 56, borderRadius: 10, border: '1px solid rgba(138,50,198,0.15)',
                background: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                ) : (
                  <span style={{ fontSize: 9, color: '#a5a198', fontWeight: 600, textAlign: 'center', padding: 4 }}>No Logo</span>
                )}
              </div>

              {/* File Picker */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                border: '1px dashed rgba(138,50,198,0.3)', borderRadius: 8,
                cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#8a32c6',
                background: 'rgba(138,50,198,0.04)', transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(138,50,198,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(138,50,198,0.04)'}
              >
                <FiUpload size={12} />
                {logoFile ? logoFile.name : 'Upload Logo'}
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
              </label>
            </div>
            <p style={{ fontSize: 9, color: '#a5a198', marginTop: 6, fontWeight: 500 }}>
              Recommended: PNG with transparent background, min 200×200px
            </p>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              type="submit"
              disabled={savingBrand}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 22px', borderRadius: 8, border: 'none',
                background: savingBrand ? '#c9a8e8' : '#8a32c6',
                color: '#fff', fontSize: 11, fontWeight: 800,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: savingBrand ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(138,50,198,0.28)',
                fontFamily: 'Montserrat, sans-serif', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!savingBrand) e.currentTarget.style.background = '#a35ad6'; }}
              onMouseLeave={e => { if (!savingBrand) e.currentTarget.style.background = '#8a32c6'; }}
            >
              {savingBrand ? (
                <>
                  <div style={{ width: 12, height: 12, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <><FiCheck size={12} /> Save Branding</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─────────────── PASSWORD CARD ─────────────── */}
      <div style={CARD}>
        <div style={ACCENT_LINE('#8a32c6')} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(138,50,198,0.08)', border: '1px solid rgba(138,50,198,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiLock size={14} style={{ color: '#8a32c6' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#2c2438' }}>Change Password</div>
            <div style={{ fontSize: 10, color: '#76726a', fontWeight: 500 }}>Update your admin account password</div>
          </div>
        </div>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Current Password */}
          <div>
            <label style={LABEL}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showOld ? 'text' : 'password'}
                value={passwords.oldPassword}
                onChange={e => setPasswords({ ...passwords, oldPassword: e.target.value })}
                placeholder="Enter current password"
                style={{ ...INPUT, paddingRight: 36 }}
                onFocus={onFocus}
                onBlur={onBlur}
                required
              />
              <button type="button" onClick={() => setShowOld(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a5a198', padding: 2 }}>
                {showOld ? <FiEyeOff size={13} /> : <FiEye size={13} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label style={LABEL}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={passwords.newPassword}
                onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="Enter new password"
                style={{ ...INPUT, paddingRight: 36 }}
                onFocus={onFocus}
                onBlur={onBlur}
                required
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a5a198', padding: 2 }}>
                {showNew ? <FiEyeOff size={13} /> : <FiEye size={13} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={LABEL}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={passwords.confirmPassword}
                onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
                style={{ ...INPUT, paddingRight: 36 }}
                onFocus={onFocus}
                onBlur={onBlur}
                required
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a5a198', padding: 2 }}>
                {showConfirm ? <FiEyeOff size={13} /> : <FiEye size={13} />}
              </button>
            </div>
          </div>

          {/* Mismatch indicator */}
          {passwords.newPassword && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
            <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>
              ⚠ Passwords do not match
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              type="submit"
              disabled={savingPwd}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 22px', borderRadius: 8, border: 'none',
                background: savingPwd ? '#c9a8e8' : '#8a32c6',
                color: '#fff', fontSize: 11, fontWeight: 800,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: savingPwd ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(138,50,198,0.28)',
                fontFamily: 'Montserrat, sans-serif', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!savingPwd) e.currentTarget.style.background = '#a35ad6'; }}
              onMouseLeave={e => { if (!savingPwd) e.currentTarget.style.background = '#8a32c6'; }}
            >
              {savingPwd ? (
                <>
                  <div style={{ width: 12, height: 12, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Updating...
                </>
              ) : (
                <><FiLock size={12} /> Update Password</>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default Settings;
