/* Hayyamed AI — Website Chat Widget
 * Embed on any site:
 *   <script src="https://www.hayyaai.com/widget.js" data-org="YOUR_ORG_ID" data-name="Your Business"></script>
 */
(function () {
  var script = document.currentScript
  var ORG = script && script.getAttribute('data-org')
  var BIZ = (script && script.getAttribute('data-name')) || 'Chat with us'
  var API = (script && script.getAttribute('data-api')) || 'https://api.hayyaai.com'
  if (!ORG) { console.warn('[Hayyamed widget] missing data-org'); return }

  // Accent defaults to the Hayya AI champagne gold; each client can brand their
  // own widget with data-color="#RRGGBB".
  var GRN = (script && script.getAttribute('data-color')) || '#D8B16A'
  var BG = '#0f1622', BD = '#1e2d42', TX = '#e8eef5', MUT = '#7a8fa6'
  var sessionId = localStorage.getItem('hm_webchat_sid')
  if (!sessionId) { sessionId = 'web-' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('hm_webchat_sid', sessionId) }

  var open = false, sent = false
  var css = document.createElement('style')
  css.textContent =
    '.hmw-btn{position:fixed;bottom:20px;right:20px;width:58px;height:58px;border-radius:50%;background:' + GRN + ';border:none;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.3);font-size:26px;z-index:2147483000;display:flex;align-items:center;justify-content:center;transition:transform .15s}' +
    '.hmw-btn:hover{transform:scale(1.06)}' +
    '.hmw-win{position:fixed;bottom:88px;right:20px;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);background:' + BG + ';border:1px solid ' + BD + ';border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.5);z-index:2147483000;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}' +
    '.hmw-win.open{display:flex}' +
    '.hmw-hd{padding:16px;background:' + BG + ';border-bottom:1px solid ' + BD + ';display:flex;align-items:center;gap:10px}' +
    '.hmw-dot{width:9px;height:9px;border-radius:50%;background:' + GRN + ';box-shadow:0 0 8px ' + GRN + '}' +
    '.hmw-ttl{color:' + TX + ';font-weight:800;font-size:15px}' +
    '.hmw-sub{color:' + MUT + ';font-size:11px}' +
    '.hmw-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#0a121e}' +
    '.hmw-msg{max-width:80%;padding:9px 13px;border-radius:12px;font-size:14px;line-height:1.5;white-space:pre-wrap}' +
    '.hmw-v{align-self:flex-end;background:' + GRN + ';color:#07090f}' +
    '.hmw-b{align-self:flex-start;background:#1a2740;color:' + TX + ';border:1px solid ' + BD + '}' +
    '.hmw-ft{padding:12px;border-top:1px solid ' + BD + ';display:flex;gap:8px;background:' + BG + '}' +
    '.hmw-in{flex:1;background:#0a121e;border:1px solid ' + BD + ';border-radius:9px;padding:10px 12px;color:' + TX + ';font-size:14px;outline:none}' +
    '.hmw-send{background:' + GRN + ';border:none;border-radius:9px;color:#07090f;font-weight:800;padding:0 16px;cursor:pointer}' +
    '.hmw-pwr{text-align:center;font-size:10px;color:' + MUT + ';padding:6px}' +
    '.hmw-typing{display:flex;gap:4px;align-items:center}' +
    '.hmw-typing span{width:6px;height:6px;border-radius:50%;background:' + MUT + ';display:inline-block;animation:hmw-bounce 1.2s infinite ease-in-out}' +
    '.hmw-typing span:nth-child(2){animation-delay:.15s}.hmw-typing span:nth-child(3){animation-delay:.3s}' +
    '@keyframes hmw-bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-4px);opacity:1}}'
  document.head.appendChild(css)

  var btn = document.createElement('button')
  btn.className = 'hmw-btn'; btn.innerHTML = '💬'
  var win = document.createElement('div')
  win.className = 'hmw-win'
  win.innerHTML =
    '<div class="hmw-hd"><span class="hmw-dot"></span><div><div class="hmw-ttl">' + BIZ + '</div><div class="hmw-sub">We typically reply in a few minutes</div></div></div>' +
    '<div class="hmw-body" id="hmw-body"></div>' +
    '<div class="hmw-ft"><input class="hmw-in" id="hmw-in" placeholder="Type your message…" /><button class="hmw-send" id="hmw-send">Send</button></div>' +
    '<div class="hmw-pwr">⚡ Powered by Hayya Med AI</div>'
  document.body.appendChild(btn); document.body.appendChild(win)

  var body = win.querySelector('#hmw-body'), inp = win.querySelector('#hmw-in'), snd = win.querySelector('#hmw-send')

  function add(text, who) {
    var d = document.createElement('div'); d.className = 'hmw-msg ' + (who === 'visitor' ? 'hmw-v' : 'hmw-b'); d.textContent = text
    body.appendChild(d); body.scrollTop = body.scrollHeight
  }

  function greet() { if (!body.children.length) add('Hi! 👋 How can we help you today?', 'bot') }

  btn.onclick = function () { open = !open; win.classList.toggle('open', open); if (open) { greet(); inp.focus() } }

  function send() {
    var text = inp.value.trim(); if (!text) return
    inp.value = ''; add(text, 'visitor')
    var typing = document.createElement('div'); typing.className = 'hmw-msg hmw-b'; typing.innerHTML = '<span class="hmw-typing"><span></span><span></span><span></span></span>'; body.appendChild(typing); body.scrollTop = body.scrollHeight
    fetch(API + '/api/v1/webchat/' + ORG + '/message', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId, text: text }),
    }).then(function (r) { return r.json() }).then(function (d) {
      typing.remove(); add(d && d.reply ? d.reply : 'Thanks! A team member will reply shortly.', 'bot')
    }).catch(function () { typing.remove(); add('Connection issue — please try again.', 'bot') })
  }
  snd.onclick = send
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') send() })
})();
