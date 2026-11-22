/* Cultivando Futuros — review feedback widget.
 * Adds a "Feedback" button to every page. Reviewers type into one box
 * ("What needs to change?"); the page and language are added automatically.
 * After sending, the form closes and the button stays for more comments.
 *
 * Where comments go:
 *   1. If GOOGLE_FORM below is filled in, comments are sent to that Google
 *      Form, and its responses spreadsheet collects one row per comment.
 *   2. Otherwise the reviewer's email app opens with the comment pre-written,
 *      addressed to FALLBACK_EMAIL.
 * To remove the widget at launch, delete the <script src="feedback.js"> tags
 * (or set ENABLED to false).
 */
(function () {
  'use strict';

  var ENABLED = true;

  // Fill these in from the Google Form's "Get pre-filled link" URL.
  // action: https://docs.google.com/forms/d/e/<FORM_ID>/formResponse
  var GOOGLE_FORM = {
    action: 'https://docs.google.com/forms/d/e/1FAIpQLSeuvVoE3v-eTjSHYIDcjlQtQLEMqmvN2Hprum-q12QQZ6AYnw/formResponse',
    fields: {
      page: 'entry.1050328772',
      language: 'entry.185552754',
      section: 'entry.1158661852',
      comment: 'entry.833408865',
      current: 'entry.313724622',
      suggested: 'entry.1421778569',
      priority: 'entry.138961065',
      name: 'entry.1985379481'
    }
  };

  var FALLBACK_EMAIL = 'animora@berkeley.edu';

  if (!ENABLED) return;

  var es = (document.documentElement.lang || '').toLowerCase().indexOf('es') === 0;
  var T = es ? {
    btn: 'Comentarios', title: 'Comentarios sobre esta página',
    comment: '¿Qué hay que cambiar? Sea lo más específico posible.',
    send: 'Enviar', cancel: 'Cerrar', need: 'Escriba su comentario.',
    thanks: '¡Gracias! Recibido',
    mail: 'Se abrirá su programa de correo con el comentario. Solo presione enviar.',
    fail: 'No se pudo enviar. Intente de nuevo o escriba a ' + FALLBACK_EMAIL + '.'
  } : {
    btn: 'Feedback', title: 'Feedback on this page',
    comment: 'What needs to change? Be as specific as possible.',
    send: 'Send', cancel: 'Close', need: 'Please write your comment.',
    thanks: 'Thank you! Received',
    mail: 'Your email app will open with the comment. Just press send.',
    fail: 'Could not send. Please try again or email ' + FALLBACK_EMAIL + '.'
  };

  var css = document.createElement('style');
  css.textContent =
    '.fb-btn{position:fixed;right:14px;bottom:14px;z-index:60;background:#B8621B;color:#fff;border:0;border-radius:999px;font:700 15px/1 "DM Sans",system-ui,sans-serif;padding:13px 18px;min-height:44px;box-shadow:0 3px 12px rgba(0,0,0,.25);cursor:pointer}' +
    '.fb-btn.fb-ok{background:#2F6B3F}' +
    '.fb-btn:focus-visible,.fb-box button:focus-visible{outline:3px solid #1F4D3A;outline-offset:2px}' +
    'body{padding-bottom:72px}' +
    '.fb-box{position:fixed;z-index:61;right:14px;bottom:70px;width:min(420px,calc(100vw - 28px));max-height:calc(100vh - 90px);overflow:auto;box-sizing:border-box;background:#fff;color:#1f2a1f;border:1px solid #d8d2c2;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.25);padding:16px;font:15px/1.4 "DM Sans",system-ui,sans-serif}' +
    '.fb-box[hidden]{display:none}.fb-box h2{font-size:18px;margin:0 0 4px}' +
    '.fb-box label{display:block;font-weight:700;font-size:14px;margin:10px 0 6px}' +
    '.fb-box textarea{width:100%;box-sizing:border-box;font:inherit;padding:8px;border:1px solid #bbb;border-radius:8px;min-height:140px;resize:vertical}' +
    '.fb-row{display:flex;gap:8px;margin-top:12px}.fb-row button{flex:1;min-height:44px;border-radius:8px;font:700 15px "DM Sans",system-ui,sans-serif;cursor:pointer;border:2px solid #2F6B3F}' +
    '.fb-send{background:#2F6B3F;color:#fff}.fb-cancel{background:#fff;color:#2F6B3F}.fb-msg{margin-top:10px;font-weight:700;font-size:14px}.fb-msg:empty{display:none}' +
    '@media print{.fb-btn,.fb-box{display:none}}';
  document.head.appendChild(css);

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'fb-btn'; btn.textContent = T.btn;
  btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');

  var box = document.createElement('div');
  box.className = 'fb-box'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-labelledby', 'fb-title');
  box.innerHTML =
    '<h2 id="fb-title">' + T.title + '</h2>' +
    '<form novalidate>' +
    '<label for="fb-com">' + T.comment + '</label><textarea id="fb-com" required></textarea>' +
    '<div class="fb-msg" role="status" aria-live="polite"></div><div class="fb-row"><button type="submit" class="fb-send">' + T.send + '</button><button type="button" class="fb-cancel">' + T.cancel + '</button></div>' +
    '</form>';

  var live = document.createElement('div');
  live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
  live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';

  document.body.appendChild(btn);
  document.body.appendChild(box);
  document.body.appendChild(live);

  var f = box.querySelector('form'), msg = box.querySelector('.fb-msg'), com = box.querySelector('#fb-com');
  var timer;

  function open() {
    clearTimeout(timer); btn.textContent = T.btn; btn.classList.remove('fb-ok');
    box.hidden = false; btn.setAttribute('aria-expanded', 'true'); msg.textContent = '';
    com.focus();
  }
  function close() { box.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }

  btn.addEventListener('click', function () { box.hidden ? open() : close(); });
  box.querySelector('.fb-cancel').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) close(); });

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = {
      page: location.pathname.replace(/^.*?((es\/)?[^\/]*)$/, '$1') || 'index.html',
      language: es ? 'ES' : 'EN',
      comment: com.value.trim()
    };
    if (!d.comment) { msg.textContent = T.need; com.focus(); return; }

    var done = function () {
      com.value = '';
      close();
      // Brief confirmation on the button, then it goes back to "Feedback".
      btn.textContent = T.thanks + ' ✓'; btn.classList.add('fb-ok'); live.textContent = T.thanks;
      clearTimeout(timer);
      timer = setTimeout(function () { btn.textContent = T.btn; btn.classList.remove('fb-ok'); live.textContent = ''; }, 3000);
    };

    if (GOOGLE_FORM.action) {
      var body = new URLSearchParams();
      ['page', 'language', 'comment'].forEach(function (k) {
        if (GOOGLE_FORM.fields[k]) body.append(GOOGLE_FORM.fields[k], d[k]);
      });
      fetch(GOOGLE_FORM.action, { method: 'POST', mode: 'no-cors', body: body })
        .then(done, function () { msg.textContent = T.fail; });
    } else {
      var text = ['Page: ' + d.page, 'Language: ' + d.language, '', 'What needs to change:', d.comment].join('\n');
      location.href = 'mailto:' + FALLBACK_EMAIL + '?subject=' +
        encodeURIComponent('[cfuturos feedback] ' + d.page) + '&body=' + encodeURIComponent(text);
      msg.textContent = T.mail;
    }
  });
})();
