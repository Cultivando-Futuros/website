/* Cultivando Futuros — review feedback widget.
 * Adds a "Feedback" button to every page. Reviewers pick a section, write a
 * comment, and it is sent as one structured row (page, language, section,
 * comment, current wording, suggested wording, priority, name).
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
    intro: 'Consejo: antes de abrir esto, seleccione el texto que quiere cambiar y se copiará aquí.',
    name: 'Su nombre', section: 'Sección', comment: '¿Qué se debe cambiar?',
    current: 'Texto actual (opcional)', suggested: 'Texto sugerido (opcional)',
    priority: 'Importancia', p1: 'Hay que corregirlo', p2: 'Sería bueno', p3: 'Solo una idea',
    send: 'Enviar', cancel: 'Cerrar', whole: 'Toda la página', header: 'Encabezado y menú',
    footer: 'Pie de página', top: 'Parte de arriba (título)', need: 'Escriba su comentario.',
    thanks: '¡Gracias! Recibimos su comentario. Puede enviar otro.',
    mail: 'Se abrirá su programa de correo con el comentario. Solo presione enviar.',
    fail: 'No se pudo enviar. Intente de nuevo o escriba a ' + FALLBACK_EMAIL + '.'
  } : {
    btn: 'Feedback', title: 'Feedback on this page',
    intro: 'Tip: select the text you want changed before opening this, and it will be copied in.',
    name: 'Your name', section: 'Section', comment: 'What should change?',
    current: 'Current wording (optional)', suggested: 'Suggested wording (optional)',
    priority: 'Priority', p1: 'Must fix', p2: 'Nice to have', p3: 'Just a thought',
    send: 'Send', cancel: 'Close', whole: 'Whole page', header: 'Header and menu',
    footer: 'Footer', top: 'Top of page (headline)', need: 'Please write your comment.',
    thanks: 'Thank you! Your comment was received. You can send another.',
    mail: 'Your email app will open with the comment. Just press send.',
    fail: 'Could not send. Please try again or email ' + FALLBACK_EMAIL + '.'
  };

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); }
    catch (e) { return ''; }
  }

  // Sections: page top, each numbered h2 in <main>, footer, header, whole page.
  var main = document.getElementById('main') || document.querySelector('main');
  var heads = main ? Array.prototype.slice.call(main.querySelectorAll('h2')) : [];
  var sections = [T.whole, T.top].concat(heads.map(function (h) { return h.textContent.trim(); }), [T.footer, T.header]);

  function sectionFor(node) {
    if (!node) return '';
    var el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return '';
    if (el.closest('.foot')) return T.footer;
    if (el.closest('.top')) return T.header;
    if (el.closest('.hero') || el.closest('.draft') || el.closest('.notice')) return T.top;
    var found = '';
    heads.forEach(function (h) {
      if (h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING || h.contains(el)) found = h.textContent.trim();
    });
    return found;
  }

  // Remember the last text the reviewer selected on the page.
  var picked = { text: '', section: '' };
  document.addEventListener('selectionchange', function () {
    var s = window.getSelection();
    if (!s || s.isCollapsed || (box && box.contains(s.anchorNode))) return;
    var t = s.toString().trim();
    if (t) picked = { text: t.slice(0, 1500), section: sectionFor(s.anchorNode) };
  });

  var css = document.createElement('style');
  css.textContent =
    '.fb-btn{position:fixed;right:14px;bottom:14px;z-index:60;background:#B8621B;color:#fff;border:0;border-radius:999px;font:700 15px/1 "DM Sans",system-ui,sans-serif;padding:13px 18px;min-height:44px;box-shadow:0 3px 12px rgba(0,0,0,.25);cursor:pointer}' +
    '.fb-btn:focus-visible,.fb-box button:focus-visible{outline:3px solid #1F4D3A;outline-offset:2px}' +
    'body{padding-bottom:72px}' +
    '.fb-box{position:fixed;z-index:61;right:14px;bottom:70px;width:min(420px,calc(100vw - 28px));max-height:calc(100vh - 90px);overflow:auto;box-sizing:border-box;background:#fff;color:#1f2a1f;border:1px solid #d8d2c2;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.25);padding:16px;font:15px/1.4 "DM Sans",system-ui,sans-serif}' +
    '.fb-box[hidden]{display:none}.fb-box h2{font-size:18px;margin:0 0 4px}.fb-box p{margin:0 0 10px;font-size:13px;color:#555}' +
    '.fb-box label{display:block;font-weight:700;font-size:13px;margin:10px 0 4px}' +
    '.fb-box input[type=text],.fb-box select,.fb-box textarea{width:100%;box-sizing:border-box;font:inherit;padding:8px;border:1px solid #bbb;border-radius:8px;min-height:40px}' +
    '.fb-box textarea{min-height:64px;resize:vertical}.fb-box fieldset{border:0;padding:0;margin:10px 0 0}.fb-box legend{font-weight:700;font-size:13px;padding:0;margin-bottom:4px}' +
    '.fb-box .fb-pri label{display:inline-flex;align-items:center;gap:5px;font-weight:400;margin:0 12px 4px 0;min-height:32px}' +
    '.fb-row{display:flex;gap:8px;margin:14px -16px -16px;padding:10px 16px 16px;position:sticky;bottom:-16px;background:#fff;border-top:1px solid #eee}.fb-row button{flex:1;min-height:44px;border-radius:8px;font:700 15px "DM Sans",system-ui,sans-serif;cursor:pointer;border:2px solid #2F6B3F}' +
    '.fb-send{background:#2F6B3F;color:#fff}.fb-cancel{background:#fff;color:#2F6B3F}.fb-msg{margin-top:10px;font-weight:700;font-size:14px}.fb-msg:empty{display:none}' +
    '@media print{.fb-btn,.fb-box{display:none}}';
  document.head.appendChild(css);

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'fb-btn'; btn.textContent = T.btn;
  btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');

  var box = document.createElement('div');
  box.className = 'fb-box'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-labelledby', 'fb-title');
  var opts = sections.map(function (s) { var o = document.createElement('option'); o.textContent = s; return o.outerHTML; }).join('');
  box.innerHTML =
    '<h2 id="fb-title">' + T.title + '</h2><p>' + T.intro + '</p>' +
    '<form novalidate>' +
    '<label for="fb-name">' + T.name + '</label><input type="text" id="fb-name" autocomplete="name">' +
    '<label for="fb-sec">' + T.section + '</label><select id="fb-sec">' + opts + '</select>' +
    '<label for="fb-com">' + T.comment + '</label><textarea id="fb-com" required></textarea>' +
    '<label for="fb-cur">' + T.current + '</label><textarea id="fb-cur"></textarea>' +
    '<label for="fb-sug">' + T.suggested + '</label><textarea id="fb-sug"></textarea>' +
    '<fieldset class="fb-pri"><legend>' + T.priority + '</legend>' +
    '<label><input type="radio" name="fb-p" value="Must fix" checked>' + T.p1 + '</label>' +
    '<label><input type="radio" name="fb-p" value="Nice to have">' + T.p2 + '</label>' +
    '<label><input type="radio" name="fb-p" value="Just a thought">' + T.p3 + '</label></fieldset>' +
    '<div class="fb-msg" role="status" aria-live="polite"></div><div class="fb-row"><button type="submit" class="fb-send">' + T.send + '</button><button type="button" class="fb-cancel">' + T.cancel + '</button></div>' +
    '</form>';

  document.body.appendChild(btn);
  document.body.appendChild(box);

  var f = box.querySelector('form'), msg = box.querySelector('.fb-msg');
  var $ = function (id) { return box.querySelector('#' + id); };

  function open() {
    box.hidden = false; btn.setAttribute('aria-expanded', 'true'); msg.textContent = '';
    $('fb-name').value = $('fb-name').value || store('cf-fb-name');
    if (picked.text) {
      $('fb-cur').value = picked.text;
      if (picked.section) $('fb-sec').value = picked.section;
      picked = { text: '', section: '' };
    }
    ($('fb-name').value ? $('fb-com') : $('fb-name')).focus();
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
      section: $('fb-sec').value,
      comment: $('fb-com').value.trim(),
      current: $('fb-cur').value.trim(),
      suggested: $('fb-sug').value.trim(),
      priority: f.querySelector('input[name=fb-p]:checked').value,
      name: $('fb-name').value.trim()
    };
    if (!d.comment) { msg.textContent = T.need; $('fb-com').focus(); return; }
    store('cf-fb-name', d.name);

    var done = function () {
      msg.textContent = T.thanks;
      ['fb-com', 'fb-cur', 'fb-sug'].forEach(function (id) { $(id).value = ''; });
    };

    if (GOOGLE_FORM.action) {
      var body = new URLSearchParams();
      Object.keys(GOOGLE_FORM.fields).forEach(function (k) {
        if (GOOGLE_FORM.fields[k]) body.append(GOOGLE_FORM.fields[k], d[k]);
      });
      fetch(GOOGLE_FORM.action, { method: 'POST', mode: 'no-cors', body: body })
        .then(done, function () { msg.textContent = T.fail; });
    } else {
      var text = ['Page: ' + d.page, 'Language: ' + d.language, 'Section: ' + d.section,
        'Priority: ' + d.priority, 'Name: ' + d.name, '', 'What should change:', d.comment,
        '', 'Current wording:', d.current || '-', '', 'Suggested wording:', d.suggested || '-'].join('\n');
      location.href = 'mailto:' + FALLBACK_EMAIL + '?subject=' +
        encodeURIComponent('[cfuturos feedback] ' + d.page + ' - ' + d.section) + '&body=' + encodeURIComponent(text);
      msg.textContent = T.mail;
    }
  });
})();
