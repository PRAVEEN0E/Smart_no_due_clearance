import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

export default function PushNotificationManager() {
    const { token } = useAuthStore();
    const [supported, setSupported] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setSupported(true);
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub));
            });
        }
    }, []);

    const urlBase64ToUint8Array = (base64) => {
        const padding = '='.repeat((4 - (base64.length % 4)) % 4);
        const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(b64);
        return new Uint8Array([...rawData].map(ch => ch.charCodeAt(0)));
    };

    const handleSubscribe = async () => {
        if (!supported) return;
        setLoading(true);
        try {
            const vapidRes = await api.get('/push/vapid-key');
            const { publicKey } = vapidRes.data;
            if (!publicKey) { setLoading(false); return; }

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            await api.post('/push/subscribe', {
                endpoint: sub.endpoint,
                keys: { p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))), auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))) }
            });
            setSubscribed(true);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    const handleUnsubscribe = async () => {
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await api.delete('/push/subscribe', { data: { endpoint: sub.endpoint } });
                await sub.unsubscribe();
            }
            setSubscribed(false);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    if (!supported) return null;

    return (
        <button onClick={subscribed ? handleUnsubscribe : handleSubscribe} disabled={loading}
            aria-label={subscribed ? 'Disable push notifications' : 'Enable push notifications'}
            className={`p-2.5 rounded-xl border border-black/5 transition-all ${subscribed ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'hover:bg-black/5 text-slate-400'}`}>
            {subscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </button>
    );
}
