export interface CredentialsPayload {
  name: string;
  email: string;
  password: string;
  roleDisplayName?: string;
  loginUrl?: string;
}

/**
 * Generate a clean, descriptive file name like:
 * "Samridhi_Arora_XGRO_Credentials.txt"
 * "Vasu_Arora_XGRO_Credentials.txt"
 * "Rock_Happy_XGRO_Credentials.txt"
 * or "Account_hotelblu_4812_XGRO_Credentials.txt"
 */
export function getCredentialsFileName(name: string, email: string): string {
  // Strip common honorific prefixes (Mr, Mrs, Ms, Dr, Prof, Shri, Smt)
  const titleRegex = /^(mr|mrs|ms|dr|prof|shri|smt)\.?\s+/i;
  const normalized = (name || '').trim().replace(titleRegex, '').trim();
  const cleanName = normalized.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);

  let baseName = '';
  if (parts.length >= 2) {
    baseName = `${parts[0]}_${parts[parts.length - 1]}`;
  } else if (parts.length === 1 && parts[0].length > 1) {
    baseName = parts[0];
  } else {
    const emailPrefix = (email || 'Client').split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
    baseName = `Account_${emailPrefix}_${Date.now().toString().slice(-4)}`;
  }

  return `${baseName}_XGRO_Credentials.txt`;
}

/**
 * Build a professionally formatted text document containing access credentials.
 */
export function buildCredentialsDocument(data: CredentialsPayload): string {
  const role = data.roleDisplayName || 'Authorized Portal User';
  const loginUrl = data.loginUrl || (typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://xgro.in/login');
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `================================================================
          XGRO PLATFORM — SECURE ACCESS CREDENTIALS
================================================================

Account Name:       ${data.name}
Assigned Role:      ${role}
Email / Login ID:   ${data.email}
Temporary Password: ${data.password}
Portal Login URL:   ${loginUrl}

----------------------------------------------------------------
GETTING STARTED & SECURITY INSTRUCTIONS:
----------------------------------------------------------------
1. Open your web browser and navigate to:
   ${loginUrl}

2. Enter your Email Address (${data.email}) and your 
   Temporary Password exactly as shown above.

3. IMPORTANT SECURITY NOTICE:
   For privacy and account safety, this temporary password is
   only generated and displayed once. Please save this file in
   a secure location. You can change your password anytime from
   your profile settings after logging in.

4. Keep this document in a safe location. Do not share these 
   credentials publicly or forward them to unauthorized individuals.

================================================================
Generated On: ${dateStr} by XGRO Agency Administration
Support Desk: info@xgro.in | WhatsApp: +91 63953 19725
================================================================
`;
}

/**
 * Trigger immediate browser download of the credentials text file.
 */
export function downloadCredentialsFile(data: CredentialsPayload): void {
  if (typeof window === 'undefined') return;

  const content = buildCredentialsDocument(data);
  const filename = getCredentialsFileName(data.name, data.email);

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate formatted clipboard string for instant WhatsApp / Email dispatch.
 */
export function buildWhatsAppCredentialsText(data: CredentialsPayload): string {
  const role = data.roleDisplayName || 'Authorized Portal User';
  const loginUrl = data.loginUrl || (typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://xgro.in/login');

  return `🔐 *XGRO PLATFORM ACCESS CREDENTIALS*
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *User Name:* ${data.name}
🎖️ *Role:* ${role}
📧 *Email / Login ID:* ${data.email}
🔑 *Temporary Password:* ${data.password}
🌐 *Portal Login URL:* ${loginUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *Notice:* This temporary password is only shown once for security. Download or save your credentials and sign in at ${loginUrl}. You can change your password anytime from your profile settings.`;
}
