(function () {
  'use strict';

  // Helpers
  const qs = s => document.querySelector(s);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const debounce = (fn, wait) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); } };

  // Elements
  const textarea = qs('#content');
  const statusEl = qs('#status');
  const noteInfo = qs('#noteInfo');
  const controls = qs('.controls');

  let lastSaved = textarea ? textarea.value : '';
  let currentNoteId = noteInfo ? noteInfo.textContent.trim() : '';

  // Compute save interval (debounced) - longer on touch devices to save battery
  const saveInterval = isTouch ? 2500 : 1000;
  const autoSave = debounce(() => {
    if (!textarea) return;
    if (textarea.value === lastSaved) return;
    statusEl.textContent = 'Saving...';
    saveNote().then(() => { statusEl.textContent = 'Saved'; setTimeout(() => { if (statusEl.textContent === 'Saved') statusEl.textContent = 'Ready'; }, 1500); }).catch(err => { console.error(err); statusEl.textContent = 'Error: Save failed'; });
  }, saveInterval);

  // Save note via POST
  async function saveNote() {
    const saveUrl = currentNoteId ? (window.location.pathname.replace(/\/noteid\/.*$/, '') || '/') + 'noteid/' + currentNoteId : (window.location.pathname.replace(/\/noteid\/.*$/, '') || '/');
    const res = await fetch(saveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: currentNoteId, content: textarea.value })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.success) {
      lastSaved = textarea.value;
      if (data.noteId && data.noteId !== currentNoteId) {
        currentNoteId = data.noteId;
        history.replaceState({}, '', (window.location.pathname.replace(/\/noteid\/.*$/, '') || '/') + 'noteid/' + data.noteId);
        if (noteInfo) noteInfo.textContent = data.noteId;
      }
    } else {
      throw new Error(data.error || 'save failed');
    }
    return data;
  }

  // Tab handling (insert tab instead of losing focus)
  if (textarea) {
    textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') { e.preventDefault(); const s = this.selectionStart, epos = this.selectionEnd; this.value = this.value.substring(0, s) + '\t' + this.value.substring(epos); this.selectionStart = this.selectionEnd = s + 1; }
    });

    textarea.addEventListener('input', function () {
      qs('#printable').textContent = this.value;
      autoSave();
    });
  }

  // Copy link
  if (qs('#copyLink')) qs('#copyLink').addEventListener('click', () => { if (!currentNoteId) return; const link = window.location.origin + (window.location.pathname.replace(/\/noteid\/.*$/, '') || '/') + 'noteid/' + currentNoteId; if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => { statusEl.textContent = 'Link copied!'; setTimeout(() => { statusEl.textContent = 'Ready'; }, 1500); }); });

  // Copy content
  if (qs('#copyContent')) qs('#copyContent').addEventListener('click', () => { const text = textarea.value; if (!text) return; if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { statusEl.textContent = 'Content copied!'; setTimeout(() => { statusEl.textContent = 'Ready'; }, 1500); }); });

  // Print button
  if (qs('#printBtn')) qs('#printBtn').addEventListener('click', () => window.print());

  // Floating menu toggle for small screens
  const menuToggle = qs('#menuToggle');
  if (menuToggle) menuToggle.addEventListener('click', () => { controls.classList.toggle('mobile-open'); });

  // FAB on mobile: new note
  const fab = qs('#fab');
  if (fab) fab.addEventListener('click', () => { window.location.href = window.location.pathname.replace(/\/noteid\/.*$/, ''); });
  // Header "New Note" button
  const newNoteBtn = qs('#newNote');
  if (newNoteBtn) newNoteBtn.addEventListener('click', () => { window.location.href = window.location.pathname.replace(/\/noteid\/.*$/, ''); });
  // keyboard shortcut save (Ctrl/Cmd+S)
  window.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault(); statusEl.textContent = 'Saving...'; saveNote().then(() => { statusEl.textContent = 'Saved'; setTimeout(() => { if (statusEl.textContent === 'Saved') statusEl.textContent = 'Ready'; }, 1500); }).catch(err => { statusEl.textContent = 'Error: Save failed'; console.error(err); });
    }
  });

  // initial printable
  if (qs('#printable')) qs('#printable').textContent = textarea ? textarea.value : '';

  // focus area
  if (textarea) textarea.focus();

  // Periodic auto-save in case input events missed
  setInterval(() => { if (textarea && textarea.value !== lastSaved) autoSave(); }, Math.max(2000, saveInterval));
})();
