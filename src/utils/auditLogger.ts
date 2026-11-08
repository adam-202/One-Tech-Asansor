import { LoginAuditLog, Technician } from '../types';
import { getSupabase, isSupabaseConfigured } from './supabase';

const DEVICE_ID_KEY = 'onetech_device_uuid';
const AUDIT_LOGS_STORAGE_KEY = 'onetech_login_audit_logs';

/**
 * Retrieves or generates a persistent device fingerprint token for this browser.
 */
export function getOrCreateDeviceFingerprint(): string {
  try {
    let devId = localStorage.getItem(DEVICE_ID_KEY);
    if (!devId) {
      const randomPart = Math.random().toString(36).substring(2, 10);
      const timePart = Date.now().toString(36);
      devId = `dev_${timePart}_${randomPart}`;
      localStorage.setItem(DEVICE_ID_KEY, devId);
    }
    return devId;
  } catch {
    return `dev_session_${Date.now()}`;
  }
}

/**
 * Detects device hardware profile, operating system, and browser from userAgent and screen.
 */
export function detectDeviceInfo(): {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceName: string;
  browser: string;
  screenResolution: string;
} {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const screen = typeof window !== 'undefined' ? window.screen : { width: 0, height: 0 };
  const screenResolution = `${screen.width || 0}x${screen.height || 0}`;

  // 1. Device Type Detection
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  const isMobile = /(mobi|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop)/i.test(ua);

  if (isTablet) {
    deviceType = 'tablet';
  } else if (isMobile || (typeof window !== 'undefined' && window.innerWidth < 768 && 'ontouchstart' in window)) {
    deviceType = 'mobile';
  }

  // 2. Hardware / OS / Phone Model Detection
  let deviceName = 'Bilinmeyen Cihaz (Unknown Device)';

  if (/iPhone/i.test(ua)) {
    // Check screen height to give accurate iPhone generation
    const h = Math.max(screen.width, screen.height);
    let model = 'Apple iPhone';
    if (h >= 932) model = 'Apple iPhone Pro Max / Plus';
    else if (h >= 852) model = 'Apple iPhone Pro / 15 / 16';
    else if (h >= 844) model = 'Apple iPhone 12 / 13 / 14';
    else if (h >= 812) model = 'Apple iPhone X / XS / 11 Pro';
    else if (h >= 667) model = 'Apple iPhone SE / 8';

    const iosMatch = ua.match(/OS (\d+[_.]\d+)/);
    const osVer = iosMatch ? ` (iOS ${iosMatch[1].replace('_', '.')})` : ' (iOS)';
    deviceName = `${model}${osVer}`;
  } else if (/iPad/i.test(ua)) {
    deviceName = 'Apple iPad (iPadOS)';
  } else if (/Android/i.test(ua)) {
    let brand = 'Android';
    if (/Samsung|SM-|GT-/i.test(ua)) brand = 'Samsung Galaxy';
    else if (/Xiaomi|Redmi|POCO/i.test(ua)) brand = 'Xiaomi / Redmi';
    else if (/Huawei|HONOR/i.test(ua)) brand = 'Huawei';
    else if (/Pixel/i.test(ua)) brand = 'Google Pixel';
    else if (/Oppo/i.test(ua)) brand = 'Oppo';
    else if (/Vivo/i.test(ua)) brand = 'Vivo';

    const androidMatch = ua.match(/Android\s+([0-9.]+)/i);
    const ver = androidMatch ? ` ${androidMatch[1]}` : '';
    deviceName = `${brand} (Android${ver})`;
  } else if (/Windows NT/i.test(ua)) {
    if (/Windows NT 10.0/i.test(ua)) deviceName = 'Windows 11 / 10 PC';
    else deviceName = 'Windows PC';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceName = 'Apple Mac (macOS)';
  } else if (/Linux/i.test(ua)) {
    deviceName = 'Linux Workstation';
  }

  // 3. Browser Detection
  let browser = 'Web Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = deviceType === 'mobile' ? 'Chrome Mobile' : 'Google Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = deviceType === 'mobile' ? 'Safari Mobile' : 'Safari';
  } else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera';

  return {
    deviceType,
    deviceName,
    browser,
    screenResolution,
  };
}

/**
 * Records a successful login event with device fingerprinting and verifies
 * whether this login is from a new / different mobile phone or device.
 */
export async function recordLoginAudit(user: Technician): Promise<LoginAuditLog> {
  const deviceFingerprint = getOrCreateDeviceFingerprint();
  const info = detectDeviceInfo();

  // Check known devices for this technician email in localStorage
  const knownDevicesKey = `onetech_known_devices_${user.email.toLowerCase().trim()}`;
  let isDifferentDevice = false;

  try {
    const rawKnown = localStorage.getItem(knownDevicesKey);
    let knownList: string[] = rawKnown ? JSON.parse(rawKnown) : [];

    // If user has prior logins recorded, and current device fingerprint is not among them:
    if (knownList.length > 0 && !knownList.includes(deviceFingerprint)) {
      isDifferentDevice = true;
    }

    if (!knownList.includes(deviceFingerprint)) {
      knownList.push(deviceFingerprint);
      localStorage.setItem(knownDevicesKey, JSON.stringify(knownList));
    }
  } catch (err) {
    console.warn('Failed reading known devices:', err);
  }

  const logEntry: LoginAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: user.role,
    timestamp: new Date().toISOString(),
    deviceType: info.deviceType,
    deviceName: info.deviceName,
    browser: info.browser,
    screenResolution: info.screenResolution,
    deviceFingerprint,
    isDifferentDevice,
  };

  // 1. Store in localStorage
  try {
    const rawLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    const existing: LoginAuditLog[] = rawLogs ? JSON.parse(rawLogs) : [];
    // Keep most recent 100 logs
    const updated = [logEntry, ...existing.filter((x) => x.id !== logEntry.id)].slice(0, 100);
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed writing local audit log:', err);
  }

  // 2. Sync to Supabase cloud login_logs table
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      if (client) {
        await client.from('login_logs').insert([
          {
            id: logEntry.id,
            user_id: logEntry.userId,
            user_name: logEntry.userName,
            user_email: logEntry.userEmail,
            role: logEntry.role,
            timestamp: logEntry.timestamp,
            device_type: logEntry.deviceType,
            device_name: logEntry.deviceName,
            browser: logEntry.browser,
            screen_resolution: logEntry.screenResolution,
            device_fingerprint: logEntry.deviceFingerprint,
            is_different_device: logEntry.isDifferentDevice,
          },
        ]);
      }
    } catch (err) {
      // Table may not yet exist in Supabase, local log is preserved safely
      console.info('Supabase login_logs sync note:', err);
    }
  }

  return logEntry;
}

/**
 * Fetches all login audit logs from Supabase cloud (with automatic fallback to localStorage).
 */
export async function fetchLoginAuditLogs(): Promise<LoginAuditLog[]> {
  let cloudLogs: LoginAuditLog[] = [];

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      if (client) {
        const { data, error } = await client
          .from('login_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (!error && Array.isArray(data)) {
          cloudLogs = data.map((row: any) => ({
            id: row.id,
            userId: row.user_id || '',
            userName: row.user_name || '',
            userEmail: row.user_email || '',
            role: row.role || 'Field Technician',
            timestamp: row.timestamp || row.created_at || new Date().toISOString(),
            deviceType: (row.device_type as any) || 'mobile',
            deviceName: row.device_name || 'Bilinmeyen Cihaz',
            browser: row.browser || 'Browser',
            screenResolution: row.screen_resolution || '',
            deviceFingerprint: row.device_fingerprint || '',
            isDifferentDevice: Boolean(row.is_different_device),
          }));
        }
      }
    } catch {
      // Ignore cloud error and use local
    }
  }

  // Read local storage logs
  let localLogs: LoginAuditLog[] = [];
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (raw) {
      localLogs = JSON.parse(raw);
    }
  } catch {
    localLogs = [];
  }

  // Merge and deduplicate
  const map = new Map<string, LoginAuditLog>();
  [...cloudLogs, ...localLogs].forEach((log) => {
    if (!map.has(log.id)) {
      map.set(log.id, log);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Clears login audit logs (Admin only)
 */
export async function clearLoginAuditLogs(): Promise<void> {
  try {
    localStorage.removeItem(AUDIT_LOGS_STORAGE_KEY);
  } catch {
    // Ignore
  }

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      if (client) {
        await client.from('login_logs').delete().neq('id', 'keep_all');
      }
    } catch {
      // Ignore
    }
  }
}
