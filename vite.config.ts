import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Content Security Policy for production builds (the dev server needs inline scripts, so it is skipped there).
 * Limits a hypothetical XSS: scripts only from this site, network only to this site and the Supabase project.
 */
function csp(supabaseUrl: string | undefined): Plugin {
    const api = supabaseUrl ? ` ${supabaseUrl} ${supabaseUrl.replace(/^http/, 'ws')}` : '';
    const policy = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        `img-src 'self' data: blob:${api}`,
        `connect-src 'self' data: blob:${api}`,
        "frame-src blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; ');
    return {
        name: 'csp',
        apply: 'build',
        transformIndexHtml: html => html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`),
    };
}

// Relative base so the build works from any static host path (e.g. GitHub Pages project sites).
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    return {
        base: './',
        plugins: [react(), csp(env.VITE_SUPABASE_URL)],
        // Characterization tests import legacy sources whose tsconfig extends Astro; don't resolve tsconfig files.
        esbuild: { tsconfigRaw: '{}' },
        // Unit tests always run in browser-storage mode, even if Supabase variables are set in the shell.
        test: { environment: 'jsdom', include: ['tests/**/*.test.ts'], setupFiles: ['tests/setup.ts'], env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_KEY: '' } },
    };
});
