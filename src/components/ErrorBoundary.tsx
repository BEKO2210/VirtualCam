import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

/**
 * Last-resort root boundary. Without this, a render-time exception
 * unmounts the whole React tree and the user sees a blank page.
 *
 * Provides two recovery paths:
 *  - "Studio neu laden" — soft reload, in case the error was transient.
 *  - "Studio zurücksetzen" — wipes localStorage so a poisoned persisted
 *    state can't keep crashing on every reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    console.error('[CameraPrompt] Render crash:', error, info.componentStack);
  }

  reload = () => {
    this.setState({ error: null, info: null });
    location.reload();
  };

  hardReset = () => {
    try {
      // Wipe every key the studio might have written.
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cpp:')) localStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
    this.setState({ error: null, info: null });
    location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-dvh grid place-items-center px-6 py-12">
        <div className="glass-strong rounded-[var(--radius-lg)] p-6 max-w-lg w-full space-y-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-full grid place-items-center bg-[color-mix(in_oklch,var(--color-warn)_22%,transparent)] border border-[color-mix(in_oklch,var(--color-warn)_40%,transparent)] shrink-0">
              <AlertTriangle className="size-5 text-[var(--color-warn)]" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold">Studio ist abgestürzt</div>
              <div className="text-xs text-foreground/60 mt-0.5">
                Wahrscheinlich ein gespeichertes Setup, das zur aktuellen Datenstruktur nicht
                mehr passt. „Zurücksetzen" löscht das gespeicherte Setup und startet sauber.
              </div>
            </div>
          </div>

          <details className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-black/30 p-3">
            <summary className="text-[11px] font-mono uppercase tracking-[0.18em] text-foreground/50 cursor-pointer">
              Technischer Stack
            </summary>
            <pre className="mt-2 text-[11px] font-mono text-foreground/70 whitespace-pre-wrap break-all max-h-48 overflow-auto">
              {this.state.error.message}
              {this.state.info?.componentStack ? `\n${this.state.info.componentStack}` : ''}
            </pre>
          </details>

          <div className="flex gap-2 pt-1">
            <Button onClick={this.reload} variant="secondary" className="gap-2 flex-1">
              <RotateCcw className="size-4" /> Studio neu laden
            </Button>
            <Button onClick={this.hardReset} variant="default" className="gap-2 flex-1">
              <Trash2 className="size-4" /> Studio zurücksetzen
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
