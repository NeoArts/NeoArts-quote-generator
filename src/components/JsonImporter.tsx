import React from 'react';
import { importQuotes } from '../lib/db';
import { parseImportFile, type ImportContent } from '../lib/backup';
import { importProviders } from '../lib/providers';
import { notify } from '../lib/notify';
import { Button, Icon, IconButton } from './ui';

const plural = (n: number, s = 's') => (n !== 1 ? s : '');
const cot = (n: number) => (n === 1 ? 'cotización' : 'cotizaciones');

type Item = ImportContent & { name: string };
type Parsed = { content: ImportContent | null; name: string; parseError?: boolean };

async function parseFile(file: File): Promise<Parsed> {
    try {
        const data: unknown = JSON.parse(await file.text());
        return { content: parseImportFile(data), name: file.name };
    } catch {
        return { content: null, name: file.name, parseError: true };
    }
}

/** Legacy JsonUploader (one quote per file), also accepting full backups and providers files (IMPROVEMENT-001). */
export default function JsonImporter({ onImported }: { onImported: () => void }) {
    const [items, setItems] = React.useState<Item[]>([]);
    const [uploading, setUploading] = React.useState(false);
    const [dragOver, setDragOver] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const processFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const list = Array.from(files);
        if (list.some(f => f.type !== 'application/json' && !f.name.endsWith('.json'))) {
            notify.error('Solo se aceptan archivos .json');
            return;
        }
        const parsed = await Promise.all(list.map(parseFile));
        const valid: Item[] = parsed.flatMap(p => (p.content ? [{ ...p.content, name: p.name }] : []));
        if (parsed.every(p => p.parseError)) {
            notify.error('Error al leer los archivos JSON. Verifique que el formato sea correcto.');
            return;
        }
        const invalid = parsed.length - valid.length;
        if (valid.length > 0) {
            setItems(prev => [...prev, ...valid]);
            notify.success(`${valid.length} archivo${plural(valid.length)} listo${plural(valid.length)} para importar`);
        }
        if (invalid > 0) notify.warning(`${invalid} archivo${plural(invalid)} con estructura inválida`);
    };

    const submit = async () => {
        if (items.length === 0) {
            notify.error('No hay datos válidos para importar');
            return;
        }
        setUploading(true);
        try {
            const providers = items.flatMap(i => i.providers);
            if (providers.length) {
                const { added, updated } = importProviders(providers);
                notify.success(`Proveedores importados: ${added} nuevos, ${updated} actualizados`);
            }
            const { success, duplicates, errors } = await importQuotes(items.flatMap(i => i.quotes));
            if (success > 0) notify.success(`${success} ${cot(success)} importada${plural(success)}`);
            if (duplicates > 0) notify.warning(`${duplicates} ${cot(duplicates)} ya existía${plural(duplicates, 'n')} y ${duplicates === 1 ? 'no se importó' : 'no se importaron'}`);
            if (errors > 0) notify.error(`No se pudo importar ${errors} ${cot(errors)}`);
            setItems([]);
            onImported();
        } catch {
            notify.error('No se pudo guardar en la base de datos del navegador');
        } finally {
            setUploading(false);
        }
    };

    const count = items.length;
    const quoteCount = items.reduce((n, i) => n + i.quotes.length, 0);
    const providerCount = items.reduce((n, i) => n + i.providers.length, 0);
    const summary = [quoteCount ? `${quoteCount} ${cot(quoteCount)}` : '', providerCount ? `${providerCount} proveedor${plural(providerCount, 'es')}` : ''].filter(Boolean).join(' y ');

    return (
        <div className="bg-sheet rounded-xl shadow-sheet">
            <div
                data-testid="json-dropzone"
                className={`m-2 rounded-lg border-2 border-dashed transition-colors flex flex-col sm:flex-row items-center gap-4 px-5 py-5 ${dragOver ? 'border-magenta bg-magenta-soft/40' : 'border-rule'}`}
                onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
            >
                <span className="w-10 h-10 rounded-full bg-well flex items-center justify-center text-graphite flex-shrink-0"><Icon name="upload" /></span>
                <div className="flex-1 text-center sm:text-left">
                    <p className="font-medium text-ink">Arrastra archivos aquí o elígelos desde tu equipo</p>
                    <p className="text-sm text-graphite">Cotizaciones (.json), respaldos completos o archivos de proveedores.</p>
                </div>
                <input ref={inputRef} type="file" accept=".json" multiple className="hidden" id="file-upload" onChange={e => { processFiles(e.target.files); e.target.value = ''; }} />
                <label htmlFor="file-upload" className="inline-flex items-center h-10 px-4 rounded-md border border-rule bg-sheet text-sm font-medium text-ink hover:border-mist hover:bg-well cursor-pointer">
                    {count > 0 ? 'Agregar más archivos' : 'Elegir archivos'}
                </label>
            </div>

            {count > 0 && (
                <div className="px-4 pb-4 space-y-3">
                    <ul className="divide-y divide-rule-soft border border-rule-soft rounded-lg max-h-56 overflow-auto scroll-thin">
                        {items.map((item, i) => (
                            <li key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                                <Icon name="file" className="w-4 h-4 text-mist flex-shrink-0" />
                                <span className="truncate flex-1">{item.name}</span>
                                <span className="text-graphite num whitespace-nowrap">
                                    {[item.quotes.length ? `${item.quotes.length} ${cot(item.quotes.length)}` : '', item.providers.length ? `${item.providers.length} prov.` : ''].filter(Boolean).join(', ')}
                                </span>
                                <IconButton icon="close" label={`Quitar ${item.name}`} onClick={() => setItems(items.filter((_, j) => j !== i))} />
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-graphite">{summary} para importar. Las cotizaciones que ya existen (mismo ID) se omiten.</p>
                        <div className="flex gap-2">
                            <Button text="Limpiar" variant="ghost" disabled={uploading} onClick={() => setItems([])} />
                            <Button text={uploading ? 'Importando…' : 'Importar'} icon="upload" onClick={submit} loading={uploading} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
