import React from 'react';
import type { Provider } from '../types';
import { getProviders, PROVIDERS_UPDATED } from '../lib/providers';

/** Live provider list: refreshes on same-tab saves and on other-tab storage changes. */
export function useProviders(): Provider[] {
    const [providers, setProviders] = React.useState<Provider[]>(getProviders);
    React.useEffect(() => {
        const reload = () => setProviders(getProviders());
        const onStorage = (e: StorageEvent) => { if (e.key === 'providers') reload(); };
        window.addEventListener(PROVIDERS_UPDATED, reload);
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener(PROVIDERS_UPDATED, reload);
            window.removeEventListener('storage', onStorage);
        };
    }, []);
    return providers;
}
