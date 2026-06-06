(() => {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const API = cfg.apiUrl || '';
  const CHAT_EP = cfg.chatEndpoint || '/chat';
  const CONV_EP = cfg.conversationsEndpoint || '/conversations';
  const DEL_EP = cfg.deleteConversationEndpoint || CONV_EP;

  const $ = (id) => document.getElementById(id);

  const state = {
    conversations: [],
    currentId: null,
    messages: [],
    isStreaming: false,
  };

  function newId() {
    return 'c_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function titleFromMessage(msg) {
    const t = (msg || '').trim().split('\n')[0];
    return t.length > 48 ? t.slice(0, 48) + '…' : t || 'New conversation';
  }

  async function api(path, opts = {}) {
    const url = path.startsWith('http') ? path : API + path;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
    }
    return res.json();
  }

  function renderConversations() {
    const list = $('conversationList');
    if (state.conversations.length === 0) {
      list.innerHTML = '<div class="empty-state">No conversations yet</div>';
      return;
    }
    list.innerHTML = state.conversations
      .map(
        (c) => `
        <div class="conversation-item ${c.id === state.currentId ? 'active' : ''}" data-id="${c.id}">
          <span class="conversation-title">${escapeHtml(c.title || 'Untitled')}</span>
          <button class="conversation-delete" data-del="${c.id}" title="Delete">×</button>
        </div>`
      )
      .join('');
  }

  function renderMessages() {
    const wrap = $('messages');
    if (state.messages.length === 0) {
      wrap.innerHTML = `
        <div class="empty-welcome">
          <div class="welcome-mark">✦</div>
          <h2>How can I help you today?</h2>
          <p>Ask me anything. I'll do my best.</p>
        </div>`;
      return;
    }
    wrap.innerHTML = state.messages
      .map(
        (m) => `
        <div class="message-row ${m.role}">
          <div class="message-avatar">${m.role === 'user' ? 'You' : '✦'}</div>
          <div class="message-content">${escapeHtml(m.content)}</div>
        </div>`
      )
      .join('') +
      (state.isStreaming
        ? `<div class="message-row assistant"><div class="message-avatar">✦</div><div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div></div>`
        : '');
    wrap.scrollTop = wrap.scrollHeight;
  }

  function renderHeader() {
    const conv = state.conversations.find((c) => c.id === state.currentId);
    $('conversationTitle').textContent = conv ? conv.title : 'New conversation';
    $('deleteBtn').hidden = !state.currentId;
  }

  function render() {
    renderConversations();
    renderMessages();
    renderHeader();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function autoResize() {
    const ta = $('messageInput');
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }

  function setComposerEnabled(on) {
    $('messageInput').disabled = !on;
    $('sendBtn').disabled = !on || !$('messageInput').value.trim();
    $('messageInput').placeholder = on
      ? 'Message Chatbot…'
      : 'Waiting for response…';
  }

  function showError(msg) {
    const wrap = $('messages');
    const banner = document.createElement('div');
    banner.className = 'error-banner';
    banner.textContent = msg;
    wrap.appendChild(banner);
    wrap.scrollTop = wrap.scrollHeight;
    setTimeout(() => banner.remove(), 6000);
  }

  async function loadConversations() {
    try {
      const list = await api(CONV_EP);
      state.conversations = (list || []).map((c) => ({
        id: String(c.id),
        title: c.title || 'Untitled',
        model: c.model,
        created_at: c.created_at,
      }));
    } catch (e) {
      // Backend might not expose /conversations. Fall back to local-only mode.
      state.conversations = state.conversations || [];
    }
    render();
  }

  async function newConversation() {
    state.currentId = newId();
    state.messages = [];
    state.conversations.unshift({ id: state.currentId, title: 'New conversation' });
    render();
    $('messageInput').focus();
  }

  async function selectConversation(id) {
    state.currentId = id;
    try {
      const conv = await api(`${CONV_EP}/${id}`);
      state.messages = (conv.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      }));
    } catch {
      state.messages = [];
    }
    render();
  }

  async function deleteConversation(id) {
    try {
      await api(`${DEL_EP}/${id}`, { method: 'DELETE' });
    } catch {
      // Ignore — remove locally regardless.
    }
    state.conversations = state.conversations.filter((c) => c.id !== id);
    if (state.currentId === id) {
      state.currentId = null;
      state.messages = [];
    }
    render();
  }

  async function sendMessage(text) {
    if (state.isStreaming) return;
    if (!state.currentId) await newConversation();

    state.messages.push({ role: 'user', content: text });
    state.isStreaming = true;
    setComposerEnabled(false);
    render();

    const model = $('modelSelect').value;
    try {
      const data = await api(CHAT_EP, {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          model: model,
          conversation_id: state.currentId,
        }),
      });
      const reply = data.response || data.reply || '';
      state.messages.push({ role: 'assistant', content: reply });

      const conv = state.conversations.find((c) => c.id === state.currentId);
      if (conv && (conv.title === 'New conversation' || !conv.title)) {
        conv.title = titleFromMessage(text);
      }
    } catch (e) {
      showError('Failed to send: ' + e.message);
    } finally {
      state.isStreaming = false;
      setComposerEnabled(true);
      render();
    }
  }

  function bindEvents() {
    $('newChatBtn').addEventListener('click', newConversation);

    $('deleteBtn').addEventListener('click', () => {
      if (state.currentId) deleteConversation(state.currentId);
    });

    $('conversationList').addEventListener('click', (e) => {
      const delBtn = e.target.closest('[data-del]');
      if (delBtn) {
        e.stopPropagation();
        deleteConversation(delBtn.getAttribute('data-del'));
        return;
      }
      const item = e.target.closest('[data-id]');
      if (item) selectConversation(item.getAttribute('data-id'));
    });

    $('messageInput').addEventListener('input', () => {
      autoResize();
      $('sendBtn').disabled = !$('messageInput').value.trim() || state.isStreaming;
    });

    $('messageInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const v = $('messageInput').value.trim();
        if (v && !state.isStreaming) {
          $('messageInput').value = '';
          autoResize();
          sendMessage(v);
        }
      }
    });

    $('composerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('messageInput').value.trim();
      if (v && !state.isStreaming) {
        $('messageInput').value = '';
        autoResize();
        sendMessage(v);
      }
    });
  }

  function init() {
    bindEvents();
    setComposerEnabled(true);
    autoResize();
    loadConversations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
