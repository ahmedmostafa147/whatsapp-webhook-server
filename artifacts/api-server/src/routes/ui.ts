import { Router, type Request, type Response } from "express";

const router = Router();

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WhatsApp Sandbox</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f0f2f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 16px rgba(0,0,0,.08);
      width: 100%;
      max-width: 480px;
      overflow: hidden;
    }
    .card-header {
      background: #25d366;
      color: #fff;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .card-header svg { flex-shrink: 0; }
    .card-header h1 { font-size: 18px; font-weight: 600; }
    .card-header p { font-size: 12px; opacity: .85; margin-top: 2px; }
    .card-body { padding: 24px; }
    label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px; }
    input, textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      color: #111;
      transition: border-color .15s;
      outline: none;
    }
    input:focus, textarea:focus { border-color: #25d366; box-shadow: 0 0 0 3px rgba(37,211,102,.15); }
    textarea { resize: vertical; min-height: 96px; font-family: inherit; }
    .field { margin-bottom: 16px; }
    .hint { font-size: 11px; color: #9ca3af; margin-top: 4px; }
    button {
      width: 100%;
      padding: 11px;
      background: #25d366;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background .15s;
    }
    button:hover { background: #1ebe59; }
    button:disabled { background: #a7f3c0; cursor: not-allowed; }
    #log {
      margin-top: 20px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      display: none;
    }
    #log .log-header {
      background: #f9fafb;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: .05em;
      border-bottom: 1px solid #e5e7eb;
    }
    #log-body { padding: 12px; font-size: 13px; }
    .success { color: #15803d; }
    .error { color: #b91c1c; }
    pre { white-space: pre-wrap; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="white" fill-opacity=".3"/>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/>
      </svg>
      <div>
        <h1>WhatsApp Sandbox</h1>
        <p>Send messages via Twilio sandbox</p>
      </div>
    </div>
    <div class="card-body">
      <form id="form">
        <div class="field">
          <label for="to">Recipient phone number</label>
          <input id="to" name="to" type="tel" placeholder="+1234567890" required />
          <p class="hint">Must be enrolled in the Twilio sandbox. Include country code.</p>
        </div>
        <div class="field">
          <label for="message">Message</label>
          <textarea id="message" name="message" placeholder="Type your message…" required></textarea>
        </div>
        <button id="btn" type="submit">Send Message</button>
      </form>
      <div id="log">
        <div class="log-header">Response</div>
        <div id="log-body"></div>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById('form');
    const btn = document.getElementById('btn');
    const log = document.getElementById('log');
    const logBody = document.getElementById('log-body');

    function showResult(cls, icon, text, detail) {
      logBody.innerHTML = '';
      const p = document.createElement('p');
      p.className = cls;
      p.textContent = icon + ' ' + text;
      logBody.appendChild(p);
      if (detail) {
        const pre = document.createElement('pre');
        pre.textContent = detail;
        logBody.appendChild(pre);
      }
      log.style.display = 'block';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      btn.disabled = true;
      btn.textContent = 'Sending…';
      log.style.display = 'none';

      const to = document.getElementById('to').value.trim();
      const message = document.getElementById('message').value.trim();

      try {
        const res = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, message }),
        });
        const data = await res.json();
        if (res.ok) {
          showResult('success', '\u2713', 'Message sent!', JSON.stringify(data, null, 2));
        } else {
          showResult('error', '\u2717', 'Error: ' + (data.error || res.statusText));
        }
      } catch (err) {
        showResult('error', '\u2717', 'Network error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send Message';
      }
    });
  </script>
</body>
</html>`;

router.get("/", (_req: Request, res: Response): void => {
  res.type("text/html").send(HTML);
});

export default router;
