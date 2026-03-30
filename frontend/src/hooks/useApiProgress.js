/**
 * useApiProgress – hook bắt tất cả axios request/response để
 * điều khiển thanh tiến độ (progress bar) ở đầu trang.
 *
 * Dùng trong NProgress singleton (không cài thêm thư viện).
 */
import { useEffect } from 'react';
import defaultApi from '../services/api';

// ---- Minimal inlined NProgress ----------------------------------------
let _timer = null;
let _progress = 0;
let _refCount = 0;
let _bar = null;

function getBar() {
    if (_bar) return _bar;
    _bar = document.createElement('div');
    _bar.id = 'api-progress-bar';
    _bar.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'height:3px',
        'width:0%',
        'z-index:99999',
        'pointer-events:none',
        'transition:width 0.2s ease,opacity 0.4s ease',
        'background:linear-gradient(90deg,#38bdf8,#818cf8,#f472b6)',
        'box-shadow:0 0 8px rgba(56,189,248,0.6)',
        'border-radius:0 2px 2px 0',
        'opacity:0',
    ].join(';');
    document.body.appendChild(_bar);
    return _bar;
}

export function progressStart() {
    _refCount++;
    if (_refCount !== 1) return;
    _progress = 0;
    const bar = getBar();
    bar.style.opacity = '1';
    bar.style.width = '0%';
    clearInterval(_timer);
    _timer = setInterval(() => {
        // Easing: tốc độ chậm dần khi gần 90%
        const step = _progress < 50 ? 8 : _progress < 80 ? 3 : 0.5;
        _progress = Math.min(_progress + step, 90);
        bar.style.width = `${_progress}%`;
    }, 120);
}

export function progressDone() {
    _refCount = Math.max(0, _refCount - 1);
    if (_refCount > 0) return;
    clearInterval(_timer);
    const bar = getBar();
    bar.style.width = '100%';
    setTimeout(() => {
        bar.style.opacity = '0';
        setTimeout(() => {
            bar.style.width = '0%';
        }, 400);
    }, 200);
}

// -----------------------------------------------------------------------

/**
 * Gắn interceptor vào TẤT CẢ axios instance được truyền vào.
 * Mặc định dùng defaultApi (userApi) — đủ bắt login/profile call.
 *
 * Nhưng để bắt toàn bộ: import và truyền mảng instances ở App.jsx.
 */
export function useApiProgress(instances = [defaultApi]) {
    useEffect(() => {
        const ejectFns = [];

        instances.forEach((api) => {
            const reqId = api.interceptors.request.use((config) => {
                progressStart();
                return config;
            });

            const resId = api.interceptors.response.use(
                (res) => { progressDone(); return res; },
                (err) => { progressDone(); return Promise.reject(err); }
            );

            ejectFns.push(() => {
                api.interceptors.request.eject(reqId);
                api.interceptors.response.eject(resId);
            });
        });

        return () => ejectFns.forEach((fn) => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
