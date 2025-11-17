import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_FROM = process.env.SMTP_FROM || process.env.DEFAULT_FROM || 'no-reply@example.com';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

export async function getPendingMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, content, metadata, status, created_at')
    .in('status', ['queued', 'pending'])
    .eq('message_type', 'email')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    console.error('Error fetching messages', error);
    return [];
  }
  return data || [];
}

export async function fetchMessageById(id) {
  const { data, error } = await supabase.from('messages').select('*').eq('id', id).limit(1).single();
  if (error) {
    throw error;
  }
  return data;
}

export async function deleteMessageById(id) {
  try {
    const { data, error } = await supabase.from('messages').delete().eq('id', id).select();
    if (error) {
      throw error;
    }
    return data;
  } catch (err) {
    throw err;
  }
}

export async function lockMessage(id) {
  try {
    const { data: current, error: readErr } = await supabase.from('messages').select('id, status, attempts').eq('id', id).limit(1).single();
    if (readErr) {
      console.error('Error reading message for lock', id, readErr);
      return null;
    }
    if (!current) return null;
    if (!['queued', 'pending'].includes(current.status)) {
      return null;
    }

    const nextAttempts = (current.attempts || 0) + 1;
    const { data, error } = await supabase
      .from('messages')
      .update({ status: 'sending', attempts: nextAttempts, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status, attempts');

    if (error) {
      console.error('Error locking message', id, error);
      return null;
    }
    return data?.[0];
  } catch (err) {
    console.error('lockMessage exception', err);
    return null;
  }
}

export async function fetchConversationAndChannel(conversationId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, subject, channels(id, name, type, config, configuration)')
    .eq('id', conversationId)
    .limit(1)
    .single();

  if (error) {
    console.warn('Error loading conversation', conversationId, error.message || error);
    return null;
  }
  return data;
}

export async function fetchEmailChannel(channelId) {
  // Prefer new `channels` table with `config` JSON
  try {
    const { data, error } = await supabase
      .from('channels')
      .select('id, name, type, config, configuration, is_active')
      .eq('id', channelId)
      .limit(1)
      .single();

    if (!error && data) {
      const cfg = data.config || data.configuration || {};
      return {
        id: data.id,
        name: data.name,
        type: data.type || 'email',
        host: cfg.smtp_host || cfg.host || null,
        port: cfg.smtp_port || cfg.port || 587,
        username: cfg.smtp_username || cfg.username || null,
        password: cfg.smtp_password || cfg.password || null,
        secure: (typeof cfg.use_tls !== 'undefined') ? cfg.use_tls : (cfg.secure === true || cfg.secure === 'true'),
        from_email: cfg.from_email || cfg.email || cfg.from || null,
        raw: data,
      };
    }
  } catch (err) {
    console.warn('Error loading channel from channels table', channelId, err.message || err);
  }

  // Fallback to legacy `email_channels` table
  try {
    const { data: ch, error } = await supabase
      .from('email_channels')
      .select('*')
      .eq('id', channelId)
      .limit(1)
      .single();

    if (error || !ch) {
      if (error) console.warn('Error loading email channel', channelId, error.message || error);
      return null;
    }

    const normalized = {
      id: ch.id,
      name: ch.name,
      type: ch.type || ch.channel_type || 'email',
      host: ch.smtp_host || ch.host || ch.server || null,
      port: ch.smtp_port || ch.port || ch.smtp_port || 587,
      username: ch.smtp_username || ch.username || ch.user || null,
      password: ch.smtp_password || ch.password || null,
      secure: (typeof ch.use_tls !== 'undefined') ? ch.use_tls : (ch.secure === true || ch.secure === 'true'),
      from_email: ch.email || ch.from_email || ch.from || null,
      raw: ch,
    };

    return normalized;
  } catch (err) {
    console.warn('Error loading legacy email_channel', channelId, err.message || err);
    return null;
  }
}

export async function fetchEmailChannelByName(name) {
  try {
    // Try channels table first
    const { data, error } = await supabase
      .from('channels')
      .select('id, name, type, config, configuration')
      .eq('name', name)
      .limit(1)
      .single();

    if (!error && data) {
      const cfg = data.config || data.configuration || {};
      return {
        id: data.id,
        name: data.name,
        type: data.type || 'email',
        host: cfg.smtp_host || cfg.host || null,
        port: cfg.smtp_port || cfg.port || 587,
        username: cfg.smtp_username || cfg.username || null,
        password: cfg.smtp_password || cfg.password || null,
        secure: (typeof cfg.use_tls !== 'undefined') ? cfg.use_tls : (cfg.secure === true || cfg.secure === 'true'),
        from_email: cfg.from_email || cfg.email || cfg.from || null,
      };
    }

    // Fallback to legacy table
    const { data: legacy, error: lErr } = await supabase
      .from('email_channels')
      .select('*')
      .eq('name', name)
      .limit(1)
      .single();

    if (lErr || !legacy) return null;

    const ch = legacy;
    return {
      id: ch.id,
      name: ch.name,
      type: ch.type || 'email',
      host: ch.smtp_host || ch.host || null,
      port: ch.smtp_port || ch.port || 587,
      username: ch.smtp_username || ch.username || null,
      password: ch.smtp_password || ch.password || null,
      secure: (typeof ch.use_tls !== 'undefined') ? ch.use_tls : (ch.secure === true || ch.secure === 'true'),
      from_email: ch.email || ch.from_email || ch.from || null,
    };
  } catch (err) {
    console.warn('Error fetching email_channel by name', name, err.message || err);
    return null;
  }
}

export function createTransportForChannel(channel) {
  if (!channel) return null;
  const opts = {
    host: channel.host,
    port: parseInt(channel.port || 587, 10),
    secure: channel.secure === true || channel.secure === 'true',
    auth: channel.username ? { user: channel.username, pass: channel.password } : undefined
  };
  return nodemailer.createTransport(opts);
}

export async function sendMail({ to, subject, html, text, from, transport }) {
  if (!transport) {
    throw new Error('Missing transport');
  }
  const info = await transport.sendMail({ from, to, subject, text, html });
  return info;
}

export async function processMessage(m) {
  try {
    console.log('Processing message', m.id);
    const locked = await lockMessage(m.id);
    if (!locked) {
      console.log('Could not lock message (maybe already processing):', m.id);
      return;
    }

    const to = m.metadata?.to || m.metadata?.from || null;
    if (!to) {
      await supabase.from('messages').update({ status: 'failed', error: 'Missing recipient', updated_at: new Date().toISOString() }).eq('id', m.id);
      console.warn('Message has no recipient:', m.id);
      return;
    }

    const conv = m.conversation_id ? await fetchConversationAndChannel(m.conversation_id) : null;
    let emailChannel = null;
    if (conv?.channels) {
      const cfg = conv.channels.config || conv.channels.configuration || {};
      if (cfg && (cfg.smtp_host || cfg.smtp_server || cfg.host || cfg.smtp_username || cfg.smtp_password)) {
        emailChannel = {
          id: conv.channels.id,
          name: conv.channels.name,
          type: conv.channels.type || 'email',
          host: cfg.smtp_host || cfg.smtp_server || cfg.host || null,
          port: cfg.port || cfg.smtp_port || cfg.port || 587,
          username: cfg.smtp_username || cfg.username || cfg.user || null,
          password: cfg.smtp_password || cfg.password || null,
          secure: (typeof cfg.use_tls !== 'undefined') ? cfg.use_tls : (cfg.secure === true || cfg.secure === 'true'),
          from_email: cfg.from_email || cfg.email || cfg.from || null,
        };
        console.log('Using SMTP settings from channel.config for conversation', conv.id);
      } else {
        emailChannel = await fetchEmailChannelByName(conv.channels.name);
        if (emailChannel) console.log('Found email_channels entry for channel name', conv.channels.name);
      }
    }

    let transport;
    if (process.env.SMTP_HOST) {
      console.log('Using SMTP override from env');
      const envPort = parseInt(process.env.SMTP_PORT || '587', 10);
      const envSecure = (process.env.SMTP_SECURE === 'true');
      const envAuth = process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined;
      transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: envPort,
        secure: envSecure,
        auth: envAuth
      });
    } else if (emailChannel && emailChannel.host) {
      transport = createTransportForChannel(emailChannel);
    } else {
      console.warn('No transport available for message', m.id);
      await supabase.from('messages').update({ status: 'failed', error: 'No SMTP configuration', updated_at: new Date().toISOString() }).eq('id', m.id);
      return;
    }

    const from = (emailChannel && emailChannel.from_email) || DEFAULT_FROM;
    const subject = conv?.subject || 'Mensagem da clínica';
    const text = typeof m.content === 'string' ? m.content : (m.content?.text || JSON.stringify(m.content));

    console.log('Sending', m.id, 'to', to, 'from', from, 'subject', subject);
    if (emailChannel) {
      try {
        console.log('Using channel for send:', { id: emailChannel.id, name: emailChannel.name, type: emailChannel.type });
        if (emailChannel.raw) console.log('Channel raw config preview:', JSON.stringify((emailChannel.raw.config || emailChannel.raw.configuration) ? (emailChannel.raw.config || emailChannel.raw.configuration) : {}, null, 2));
      } catch (logErr) {
        // don't fail send on logging issues
        console.warn('Error logging channel info', logErr);
      }
    }

    const info = await sendMail({ to, subject, text, from, transport });

    await supabase.from('messages').update({ status: 'sent', sent_at: new Date().toISOString(), external_id: info.messageId, updated_at: new Date().toISOString() }).eq('id', m.id);
    console.log('Message sent', m.id, 'to', to, 'info', info && info.messageId);
  } catch (err) {
    console.error('Error processing message', m.id, err.message || err);
    try {
      const { data: cur, error: rErr } = await supabase.from('messages').select('attempts').eq('id', m.id).limit(1).single();
      if (rErr) {
        console.error('Error reading attempts for message', m.id, rErr);
      }
      const curAttempts = cur?.attempts || 0;
      const newAttempts = curAttempts + 1;
      const updates = { attempts: newAttempts, error: String(err.message || err), updated_at: new Date().toISOString() };
      if (newAttempts >= 3) {
        updates.status = 'failed';
      } else {
        updates.status = 'queued';
      }
      await supabase.from('messages').update(updates).eq('id', m.id);
      console.log('Updated attempts for', m.id, 'to', newAttempts);
    } catch (uErr) {
      console.error('Error updating failed status for message', m.id, uErr);
    }
  }
}

export async function runOnce() {
  try {
    const pending = await getPendingMessages();
    if (!pending || pending.length === 0) {
      console.log('No pending messages found');
      return;
    }
    console.log('Pending messages found:', pending.length);
    for (const m of pending) {
      // process sequentially to avoid smtp concurrency issues
      // eslint-disable-next-line no-await-in-loop
      await processMessage(m);
    }
  } catch (err) {
    console.error('Worker error', err);
  }
}
