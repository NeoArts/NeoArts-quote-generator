import React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import QuoteList from './components/QuoteList';
import QuoteEditor from './components/QuoteEditor';
import AuthGate, { type Account } from './components/AuthGate';

// Hash routing keeps deep links, refresh and back/forward working on any static host.
// localStorage "currentQuote" is kept for parity with the legacy editor page.
const parseRoute = (): string | null => {
    const match = window.location.hash.match(/^#\/cotizacion\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
};

function useRoute() {
    const [quoteId, setQuoteId] = React.useState(parseRoute);
    React.useEffect(() => {
        const onHash = () => { toast.dismiss(); setQuoteId(parseRoute()); window.scrollTo(0, 0); };
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);
    return quoteId;
}

/** Lifts the signed-in account up to the header without re-rendering the whole tree on every change. */
function AccountSync({ account, onChange, children }: { account: Account; onChange: (a: Account) => void; children: React.ReactNode }) {
    React.useEffect(() => { onChange(account); return () => onChange(null); }, [account?.userId]); // eslint-disable-line react-hooks/exhaustive-deps
    return <>{children}</>;
}

function AccountMenu({ account }: { account: Account }) {
    if (!account) return <span className="hidden sm:block text-sm text-white/60">NeoArts</span>;
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:block text-white/70 truncate max-w-[16rem]" title={account.email}>{account.email}</span>
            <button type="button" onClick={account.signOut} className="h-8 px-3 rounded-md text-white/90 hover:bg-white/10">Cerrar sesión</button>
        </div>
    );
}

export default function App() {
    const quoteId = useRoute();
    const [account, setAccount] = React.useState<Account>(null);
    const openQuote = (id: string) => {
        localStorage.setItem('currentQuote', id);
        window.location.hash = `#/cotizacion/${encodeURIComponent(id)}`;
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Toaster
                position="bottom-center"
                gutter={8}
                toastOptions={{
                    duration: 4000,
                    className: '!rounded-lg !shadow-lift !text-sm !font-medium',
                    style: { background: '#18202F', color: '#fff', padding: '10px 14px', maxWidth: '440px' },
                    success: { iconTheme: { primary: '#5FD39A', secondary: '#18202F' } },
                    error: { iconTheme: { primary: '#FF8A80', secondary: '#18202F' } },
                }}
            />
            <header className="bg-ink text-white">
                <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <a href="#/" className="flex items-center gap-3 rounded-md -ml-1 pl-1 pr-2 py-1 hover:bg-white/5" aria-label="NeoArts, ir a cotizaciones">
                        <span className="bg-white rounded-md px-2 py-1"><img src={`${import.meta.env.BASE_URL}icons/logo_expanded.svg`} alt="" className="h-5" /></span>
                        <span className="semiwide font-semibold tracking-tight">Cotizaciones</span>
                    </a>
                    <AccountMenu account={account} />
                </div>
                <div className="cmyk-strip" aria-hidden="true" />
            </header>
            <main className="flex-1">
                <AuthGate>
                    {acc => <AccountSync account={acc} onChange={setAccount}>
                        {quoteId ? <QuoteEditor key={quoteId} quoteId={quoteId} /> : <QuoteList onOpen={openQuote} account={acc} />}
                    </AccountSync>}
                </AuthGate>
            </main>
        </div>
    );
}
