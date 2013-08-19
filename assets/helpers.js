// Generated by CoffeeScript 1.6.3
var AceRange, abTest, abTestWrite, allMarkers, baseEditorChange, codeCache, editorAce, editorTimer, editors, getAST, handleAst, handleData, handleErrors, handleNewBlueprintFormat, initDots, initEditors, initLive, initLocalStore, injectScript, loadedAceAndThings, readCookie, renderAST, resizeEditor, saveScriptsToStore, sendCode, sendCodeString, sending, setCookie, timeoutInProgress, validateEditor, variant;

readCookie = function(name) {
  var c, ca, i, nameEQ;
  nameEQ = escape(name) + "=";
  ca = document.cookie.split(";");
  i = 0;
  while (i < ca.length) {
    c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) {
      return unescape(c.substring(nameEQ.length, c.length).replace(/"/g, ''));
    }
    i++;
  }
};

setCookie = function(cookieName, cookieValue, expire) {
  if (expire == null) {
    expire = null;
  }
  if (!expire) {
    expire = new Date();
    expire.setDate(expire.getDate() + 365 * 30);
  }
  return document.cookie = escape(cookieName) + "=" + escape(cookieValue) + ";expires=" + expire.toGMTString() + ";domain=." + location.hostname + ";path=/";
};

variant = false;

abTest = function(usableVariants, fallbackVariant) {
  var maxI, minI;
  maxI = usableVariants.length - 1;
  minI = -1;
  variant = readCookie('ab_testing_variant');
  if ((!!variant) || (variant === '0') || (variant === '-1')) {
    variant = parseInt(variant, 10);
    if (variant < 0) {
      window.ab_variant = fallbackVariant;
      return;
    }
    if (variant > maxI) {
      variant = false;
    }
  } else {
    variant = false;
  }
  if (variant === false) {
    variant = Math.floor(Math.random() * (maxI - minI + 1) + minI);
    setCookie('ab_testing_variant', variant, new Date(1 * new Date() + 3600 * 1000));
  }
  if (variant > -1) {
    window.ab_variant = usableVariants[variant][0];
    return usableVariants[variant];
  }
};

abTestWrite = function(klass, usableVariants, fallbackVariant) {
  var chosenVariant, s;
  chosenVariant = abTest(usableVariants, fallbackVariant);
  if (!chosenVariant) {
    return;
  }
  s = "" + (unescape('%3Cspan')) + " class=\"" + klass + "\"" + (unescape("%3E"));
  s += chosenVariant[1];
  s += unescape("%3C/span%3E");
  return document.write(s);
};

initDots = function() {
  var $els;
  $els = [].slice.call(document.querySelectorAll('.anim__item'), 0);
  return $els.forEach(function(dot, ind) {
    var frg, i, s;
    i = parseInt(dot.getAttribute('data-dots'), 10);
    frg = document.createElement('span');
    frg.setAttribute('class', "anim__dots__all anim__len__" + i + " anim__delay__" + ind);
    dot.style.width = frg.style.width = i * 11 + 'px';
    s = '';
    s += '<span class="anim--dot"></span>';
    frg.innerHTML = s;
    return dot.insertBefore(frg, dot.lastChild);
  });
};

codeCache = {};

getAST = function(code, thenBack) {
  var args;
  args = codeCache.get(code, false);
  if (args !== false) {
    args.push(code);
    thenBack.apply(this, args);
    return;
  }
  promise.post(window.astParserURI + '?_t=' + (1 * (new Date())), JSON.stringify({
    blueprintCode: code
  }), {
    "Accept": "application/json",
    'Content-type': 'application/json; charset=utf-8'
  }).then(function(err, text, xhr) {
    args = [err, text, code];
    if (!codeCache.get(code, false)) {
      codeCache.set(code, args);
    }
    return thenBack.apply(this, args);
  });
};

editorTimer = null;

baseEditorChange = function() {
  resizeEditor(editors['editor_ace']);
  if (!!editorTimer) {
    clearTimeout(editorTimer);
  }
  return editorTimer = setTimeout(validateEditor, 200);
};

editors = {};

validateEditor = function() {
  var code, newCode;
  code = editors['editor_ace'].getSession().getValue().replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  newCode = code + '';
  editors['editor_ace'].getSession().clearAnnotations();
  return handleNewBlueprintFormat(code);
};

sendCodeString = '';

sending = false;

handleNewBlueprintFormat = function(code, codeInside) {
  var timeoutInProgress;
  if (sending) {
    clearTimeout(sending);
    sending = false;
  }
  sendCodeString = ''.concat(code);
  timeoutInProgress = true;
  return sending = setTimeout(sendCode, 500);
};

allMarkers = [];

timeoutInProgress = false;

AceRange = null;

handleErrors = function(data, sess, doc, text) {
  var editorErrors, positioning, _ref, _ref1;
  editorErrors = [];
  if ((data != null ? data.location : void 0) != null) {
    if ((data != null ? (_ref = data.location) != null ? (_ref1 = _ref[0]) != null ? _ref1.index : void 0 : void 0 : void 0) != null) {
      positioning = doc.indexToPosition(parseInt(data.location[0].index, 10), 0);
      editorErrors.push({
        type: 'error',
        row: positioning.row,
        column: positioning.column,
        html: '<span class="code_errortip">' + data.description.substr(0, 1).toUpperCase() + data.description.slice(1) + '</span>'
      });
      sess.setAnnotations(editorErrors);
    }
  } else {
    alert("There was an error with your blueprint code.\n\n" + text);
  }
};

handleAst = function(data, sess, doc) {
  var loc, locKey, positioning, rangePos, warn, warnColumnEnd, warnKey, warnings, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4;
  if (!((data != null ? (_ref = data.warnings) != null ? _ref.length : void 0 : void 0) > 0)) {
    sess.clearAnnotations();
    return;
  }
  warnings = [];
  positioning = false;
  _ref1 = data.warnings || [];
  for (warnKey = _i = 0, _len = _ref1.length; _i < _len; warnKey = ++_i) {
    warn = _ref1[warnKey];
    if (((_ref2 = warn.location) != null ? (_ref3 = _ref2[0]) != null ? _ref3.index : void 0 : void 0) == null) {
      continue;
    }
    rangePos = new Array();
    positioning = doc.indexToPosition(parseInt(warn.location[0].index, 10), 0);
    warnings.push({
      type: 'warning',
      row: positioning.row,
      column: positioning.column,
      html: '<span class="code_warntip">' + warn.message.substr(0, 1).toUpperCase() + warn.message.substr(1) + '.</span>'
    });
    rangePos.push(positioning.row);
    warnColumnEnd = warn.location[0].length;
    if (warn.location.length > 0) {
      _ref4 = warn.location || [];
      for (locKey = _j = 0, _len1 = _ref4.length; _j < _len1; locKey = ++_j) {
        loc = _ref4[locKey];
        positioning = doc.indexToPosition(parseInt(loc.index, 10), 0);
        rangePos.push(positioning.row);
      }
    }
    if (rangePos.length > 0) {
      rangePos.sort();
      allMarkers.push(sess.addMarker(new AceRange(rangePos[0], 0, rangePos.pop(), warnColumnEnd), 'warningLine', "fullLine"));
    }
  }
  return sess.setAnnotations(warnings);
};

handleData = function(sess, doc, data, code) {
  var oneMarker;
  sess.clearAnnotations();
  while (oneMarker = allMarkers.shift()) {
    sess.removeMarker(oneMarker);
  }
  allMarkers = [];
  if (data) {
    renderAST(JSON.stringify((data.ast ? data.ast : data), null, '\t'), -1);
  }
  return data;
};

sendCode = function() {
  timeoutInProgress = false;
  return getAST(sendCodeString, function(err, text, code) {
    var data, doc, e, sess;
    if (timeoutInProgress) {
      timeoutInProgress = false;
      return false;
    }
    try {
      data = JSON.parse(text);
    } catch (_error) {
      e = _error;
      data = false;
    }
    sess = editors['editor_ace'].getSession();
    doc = sess.getDocument();
    data = handleData(sess, doc, data, code);
    if (err && text) {
      handleErrors(data, sess, doc, text);
    } else if (err && !text) {
      alert('Error sending blueprint code to server for elementary parser check.');
      return;
    } else if (!err && text) {
      handleAst(data, sess, doc);
    }
  });
};

editorAce = null;

resizeEditor = function() {};

renderAST = function() {};

initEditors = function() {
  var $els, MdMode, clickListItem, dom, hashed, highlighter, listBlockRegExp, loadExample, modeJSON, newPass, old, oldPass, passes, resizeAST, theme;
  dom = ace.require('ace/lib/dom');
  highlighter = ace.require("ace/ext/static_highlight");
  AceRange = ace.require('ace/range').Range;
  theme = ace.require('ace/theme/twilight');
  modeJSON = ace.require('ace/mode/json');
  modeJSON = new modeJSON.Mode();
  editorAce = document.getElementById('editor_ace');
  MdMode = ace.require("ace/mode/markdown").Mode;
  listBlockRegExp = /^(\s*)(?:([-+*])|(\d+)\.)(\s+)/;
  MdMode.prototype.getNextLineIndent = function(state, line, tab) {
    var marker, match;
    if (state === "listblock") {
      match = listBlockRegExp.exec(line);
      if (!match) {
        return '';
      }
      marker = match[2];
      if (!marker) {
        marker = (parseInt(match[3], 10) + 1) + ".";
      }
      return match[1];
    } else {
      return this.$getIndent(line);
    }
  };
  MdMode = new MdMode();
  oldPass = -1;
  newPass = 0;
  passes = 0;
  resizeAST = function(size, clsnm) {
    if (size == null) {
      size = '0px';
    }
    dom.importCssString(".ace_editor.ace_gutter_size_" + (size || '0px') + " .ace_gutter-cell { width: " + (size || '0px') + "; }", 'ace_gutter_size_' + (size || '0px'));
    clsnm = editors['output_ast'].className.replace(/ace_gutter_size_([\S]{2,})/g, '');
    editors['output_ast'].className = "" + (clsnm.trim()) + " ace_gutter_size_" + (size || '0px');
  };
  resizeEditor = function(editor) {
    var checker, newHeight, sess;
    sess = editor.getSession();
    newHeight = sess.getScreenLength() * parseInt(editor.renderer.lineHeight, 10) + (editor.renderer.$horizScroll ? editor.renderer.scrollBar.getWidth() : 0);
    editorAce.style.height = newHeight + 'px';
    editors['editor_ace'].resize();
    checker = function() {
      passes++;
      newPass = editorAce.querySelector('.ace_gutter-layer').style.width;
      if ((newPass === oldPass && newPass !== '') || passes >= 20) {
        oldPass = -1;
        passes = 0;
        resizeAST(newPass);
      } else {
        oldPass = newPass;
        setTimeout(checker, 7);
      }
    };
    return setTimeout(checker, 7);
  };
  ['editor_ace', 'output_ast'].forEach(function(editorName) {
    var editor;
    if (editorName === 'editor_ace') {
      editor = ace.edit(editorName);
      editor.getSession().setMode(MdMode);
      editor.setHighlightActiveLine(false);
      editor.setReadOnly(true);
      editor.session.setFoldStyle('markbeginend');
      editor.getSession().setUseSoftTabs(true);
      editor.setTheme("ace/theme/twilight");
      editor.setShowPrintMargin(false);
      editor.setShowFoldWidgets(true);
    } else {
      editor = document.getElementById('output_ast');
    }
    return editors[editorName] = editor;
  });
  loadExample = function(listItem, sess, editor) {
    editor = editors['editor_ace'];
    sess = editor.getSession();
    editor.setValue(listItem.querySelector('code.markdown').firstChild.data, -1);
    sess.getUndoManager().reset();
    resizeEditor(editor);
    renderAST(listItem.querySelector('code.ast').firstChild.data);
  };
  renderAST = function(text) {
    editors['output_ast'].setAttribute('data-text', text);
    return highlighter.render(text, modeJSON, theme, 1, false, function(highlighted) {
      editors['output_ast'].innerHTML = highlighted.html;
    });
  };
  hashed = false;
  if (window.location.hash) {
    hashed = document.querySelector('a[href*="' + window.location.href.split('#').pop() + '"]');
  }
  if (!hashed) {
    loadExample(document.querySelector('li.examples__tab.active'));
  } else {
    old = document.querySelector('li.examples__tab.active');
    old.className = old.className.replace('active', '').trim();
    hashed.parentNode.className += ' active';
    loadExample(hashed.parentNode);
  }
  clickListItem = function() {
    if (this.parentNode.className.indexOf('active') < 0) {
      old = document.querySelector('li.examples__tab.active');
      old.querySelector('code.ast').firstChild.data = editors['output_ast'].getAttribute('data-text');
      old.querySelector('code.markdown').firstChild.data = editors['editor_ace'].getValue();
      old.className = old.className.replace('active', '').trim();
      this.parentNode.className += ' active';
      loadExample(this.parentNode);
    }
  };
  document.querySelector('.page--examples').className += ' loaded';
  $els = [].slice.call(document.querySelectorAll('.examples__tab a'), 0);
  $els.forEach(function(linkItem) {
    if (linkItem.addEventListener) {
      return linkItem.addEventListener('click', clickListItem, false);
    } else if (linkItem.attachEvent) {
      return linkItem.attachEvent('onclick', clickListItem);
    }
  });
};

initLive = function() {
  var editor;
  codeCache = new SafeMap();
  editor = editors['editor_ace'];
  editor.setHighlightActiveLine(true);
  editor.setReadOnly(false);
  editor.getSession().on('paste', baseEditorChange);
  editor.getSession().on('change', baseEditorChange);
};

loadedAceAndThings = function() {
  loadedAceAndThings = function() {};
  initEditors();
  initLive();
};

injectScript = function(code) {
  var head, script;
  head = document.head || document.getElementsByTagName('head')[0];
  if (code.indexOf("use strict") === 1) {
    script = document.createElement("script");
    script.text = code;
    return head.appendChild(script).parentNode.removeChild(script);
  } else {
    return eval(code);
  }
};

initLocalStore = function(callback) {
  var inserted, scriptKey, scriptText, scriptToInsert, scriptsJSON, _i, _ref;
  if (!store.enabled) {
    return callback(false);
  }
  scriptsJSON = store.get('apiblueprint-scripts');
  if ((scriptsJSON != null ? scriptsJSON.arr : void 0) && parseInt(scriptsJSON['time_of_creation'], 10) === parseInt(window.time_of_creation, 10)) {
    inserted = 0;
    scriptText = ["\n;\n"];
    for (scriptKey = _i = 0, _ref = scriptsJSON.arr - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; scriptKey = 0 <= _ref ? ++_i : --_i) {
      if (scriptToInsert = store.get("apiblueprint-scripts-item-" + scriptKey)) {
        scriptText.push(scriptToInsert);
        inserted++;
      }
    }
    if (scriptsJSON.arr === inserted) {
      injectScript(scriptText.join('\n;\n'));
      return callback(true);
    }
  }
  return callback(false);
};

saveScriptsToStore = function(scriptsPaths) {
  var allFinished, arr, script, scriptKey, scripts, _fn, _i, _len;
  scripts = [];
  arr = 0;
  allFinished = function() {
    var i, _i, _j, _ref;
    window.store.set('apiblueprint-scripts', {
      'time_of_creation': parseInt(window.time_of_creation, 10),
      'arr': arr
    });
    for (i = _i = 0; _i <= 20; i = ++_i) {
      window.store.remove("apiblueprint-scripts-item-" + i);
    }
    for (i = _j = 0, _ref = arr - 1; 0 <= _ref ? _j <= _ref : _j >= _ref; i = 0 <= _ref ? ++_j : --_j) {
      window.store.set("apiblueprint-scripts-item-" + i, scripts[i]);
    }
  };
  _fn = function(script, scriptKey) {
    return promise.get(script).then(function(err, text, xhr) {
      scripts[scriptKey] = text;
      arr++;
      if (scriptsPaths.length === arr) {
        allFinished();
      }
    });
  };
  for (scriptKey = _i = 0, _len = scriptsPaths.length; _i < _len; scriptKey = ++_i) {
    script = scriptsPaths[scriptKey];
    _fn(script, scriptKey);
  }
};
