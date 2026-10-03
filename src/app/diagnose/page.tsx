'use client';

import { useEffect, useState } from 'react';

export default function DiagnosePage() {
  const [results, setResults] = useState<string>('Running diagnostics...');
  
  useEffect(() => {
    runDiagnostics().then(r => setResults(JSON.stringify(r, null, 2)));
  }, []);
  
  return (
    <pre style={{
      background: '#000',
      color: '#0f0',
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '13px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      minHeight: '100vh',
    }}>
      {results}
    </pre>
  );
}

async function runDiagnostics() {
  const results: Record<string, any> = { timestamp: new Date().toISOString() };
  
  try {
    // Step 1: GET /me
    const meRes = await fetch('/api/spotify/proxy/me');
    const me = await meRes.json();
    results.step1_me = {
      status: meRes.status,
      id: me.id || me.error || 'N/A',
      display_name: me.display_name || 'N/A',
    };
    
    if (meRes.status !== 200) {
      results.step1_error = me;
      return results;
    }
    
    const myId = me.id;
    
    // Step 2: GET /me/playlists
    const plRes = await fetch('/api/spotify/proxy/me/playlists?limit=20');
    const pl = await plRes.json();
    results.step2_playlists = { status: plRes.status, total: pl.total };
    
    if (plRes.status !== 200 || !pl.items) {
      results.step2_error = pl;
      return results;
    }
    
    const owned: any[] = [];
    const followed: any[] = [];
    
    for (const p of pl.items) {
      const info = {
        id: p.id,
        name: p.name,
        owner_id: p.owner?.id,
        isOwned: p.owner?.id === myId,
        public: p.public,
        collaborative: p.collaborative,
      };
      if (p.owner?.id === myId) owned.push(info);
      else followed.push(info);
    }
    
    results.step2_owned = owned.map((p: any) => ({ id: p.id, name: p.name }));
    results.step2_followed = followed.map((p: any) => ({ id: p.id, name: p.name, owner: p.owner_id }));
    
    // Step 3: Test a NON-OWNED playlist
    if (followed.length > 0) {
      const target = followed[0];
      results.step3_nonowned_test = { playlist_id: target.id, name: target.name, owner_id: target.owner_id };
      
      const metaRes = await fetch(`/api/spotify/proxy/playlists/${target.id}`);
      const meta = await metaRes.json();
      results.step3_metadata = {
        status: metaRes.status,
        owner_id: meta.owner?.id,
        public: meta.public,
        collaborative: meta.collaborative,
        items_total: meta.items?.total,
        owner_match: meta.owner?.id === myId ? 'YES' : 'NO',
      };
      
      const itemsRes = await fetch(`/api/spotify/proxy/playlists/${target.id}/items?limit=50`);
      let itemsBody;
      try { itemsBody = await itemsRes.json(); } catch { itemsBody = null; }
      results.step3_items = {
        status: itemsRes.status,
        error_body: itemsRes.status !== 200 ? itemsBody : undefined,
        items_count: itemsBody?.items?.length,
      };
    } else {
      results.step3_nonowned_test = 'NO_FOLLOWED_PLAYLISTS_FOUND';
    }
    
    // Step 4: Test an OWNED playlist
    if (owned.length > 0) {
      const target = owned[0];
      results.step4_owned_test = { playlist_id: target.id, name: target.name };
      
      const itemsRes = await fetch(`/api/spotify/proxy/playlists/${target.id}/items?limit=50`);
      let itemsBody;
      try { itemsBody = await itemsRes.json(); } catch { itemsBody = null; }
      results.step4_items = {
        status: itemsRes.status,
        items_count: itemsBody?.items?.length,
      };
      
      if (itemsRes.status === 200 && itemsBody?.items?.length > 0) {
        const first = itemsBody.items[0];
        results.step4_response_shape = {
          first_item_keys: Object.keys(first),
          has_dot_item: !!first.item,
          has_dot_track: !!first.track,
          item_type: first.item?.type,
          item_id: first.item?.id,
          item_name: first.item?.name,
          track_type: first.track?.type,
          track_id: first.track?.id,
          track_name: first.track?.name,
        };
      } else if (itemsRes.status !== 200) {
        results.step4_error = itemsBody;
      }
    } else {
      results.step4_owned_test = 'NO_OWNED_PLAYLISTS_FOUND';
    }
    
  } catch (e: any) {
    results.fatal_error = e.message || String(e);
  }
  
  // Also write to server for file-based reading
  try {
    await fetch('/api/spotify/diagnose-write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results),
    });
  } catch {}
  
  return results;
}
