'use client';

import { useEffect, useMemo, useState } from 'react';
import { AddAgentInline } from './AddAgentInline';

export function AddAgentShell({ initialOpen }: { initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    if (!initialOpen) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('addAgent');
    window.history.replaceState({}, '', url.toString());
  }, [initialOpen]);

  const content = useMemo(() => {
    if (!open) return null;
    return (
      <AddAgentInline
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          window.location.reload();
        }}
      />
    );
  }, [open]);

  return (
    <>
      {content}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            all: 'unset',
            cursor: 'pointer',
            background: '#1A1814',
            border: '0.5px dashed #2A2824',
            borderRadius: 10,
            minHeight: 130,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                background: '#222018',
                border: '0.5px solid #2A2824',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5F5E5A',
                fontSize: 16,
              }}
            >
              +
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#3E3C38' }}>Add subagent</div>
            <div style={{ fontSize: 10, color: '#2A2824', textAlign: 'center' }}>metrics · feed · tasks · report · watcher · custom</div>
          </div>
        </button>
      ) : null}
    </>
  );
}
