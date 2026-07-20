let csrfToken = null;
let fetching = false;
let queue = [];

async function fetchToken() {
    if (csrfToken) return csrfToken;
    if (fetching) {
        return new Promise((resolve) => queue.push(resolve));
    }
    fetching = true;
    try {
        const baseURL = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${baseURL}/csrf-token`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch CSRF token');
        const data = await res.json();
        csrfToken = data.csrfToken;
        return csrfToken;
    } catch (e) {
        console.warn('[CSRF] Failed to fetch token:', e);
        return null;
    } finally {
        fetching = false;
        queue.forEach((r) => r(csrfToken));
        queue = [];
    }
}

function getToken() {
    return csrfToken;
}

function reset() {
    csrfToken = null;
}

export { fetchToken, getToken, reset };
