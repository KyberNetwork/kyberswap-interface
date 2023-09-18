/*!!
 * Matomo - free/libre analytics platform
 *
 * JavaScript tracking client
 *
 * @link https://piwik.org
 * @source https://github.com/matomo-org/matomo/blob/master/js/piwik.js
 * @license https://piwik.org/free-software/bsd/ BSD-3 Clause (also in js/LICENSE.txt)
 * @license magnet:?xt=urn:btih:c80d50af7d3db9be66a4d0a86db0286e4fd33292&dn=bsd-3-clause.txt BSD-3-Clause
 */ 'object' != typeof _paq && (_paq = []),
  'object' != typeof window.Matomo &&
    (window.Matomo = window.Piwik =
      (function () {
        var _ = Math.round
        function $(e) {
          try {
            return t(e)
          } catch (t) {
            return unescape(e)
          }
        }
        function p(e) {
          var t = typeof e
          return 'undefined' != t
        }
        function M(e) {
          return 'function' == typeof e
        }
        function C(e) {
          return 'object' == typeof e
        }
        function Z(e) {
          return 'string' == typeof e || e instanceof String
        }
        function x(e) {
          return 'number' == typeof e || e instanceof Number
        }
        function ee(e) {
          return p(e) && (x(e) || (Z(e) && e.length))
        }
        function te(e) {
          if (!e) return !0
          var t
          for (t in e) if (Object.prototype.hasOwnProperty.call(e, t)) return !1
          return !0
        }
        function D(e) {
          var t = typeof console
          'undefined' != t && console && console.error && console.error(e)
        }
        function ne() {
          var e, t, n, i, o
          for (e = 0; e < arguments.length; e += 1) {
            ;(o = null),
              arguments[e] && arguments[e].slice && (o = arguments[e].slice()),
              (i = arguments[e]),
              (n = i.shift())
            var a,
              r,
              s = Z(n) && 0 < n.indexOf('::')
            if (s)
              (a = n.split('::')),
                (r = a[0]),
                (n = a[1]),
                'object' == typeof fe[r] && 'function' == typeof fe[r][n] ? fe[r][n].apply(fe[r], i) : o && L.push(o)
            else
              for (t = 0; t < k.length; t++)
                if (Z(n)) {
                  r = k[t]
                  var d = 0 < n.indexOf('.')
                  if (d)
                    if (((a = n.split('.')), r && 'object' == typeof r[a[0]])) (r = r[a[0]]), (n = a[1])
                    else if (o) {
                      L.push(o)
                      break
                    }
                  if (r[n]) r[n].apply(r, i)
                  else {
                    var l =
                      "The method '" +
                      n +
                      '\' was not found in "_paq" variable.  Please have a look at the Matomo tracker documentation: https://developer.matomo.org/api-reference/tracking-javascript'
                    if ((D(l), !d)) throw new TypeError(l)
                  }
                  if ('addTracker' === n) break
                  if ('setTrackerUrl' === n || 'setSiteId' === n) break
                } else n.apply(k[t], i)
          }
        }
        function ie(e, t, n, i) {
          return e.addEventListener
            ? (e.addEventListener(t, n, i), !0)
            : e.attachEvent
            ? e.attachEvent('on' + t, n)
            : void (e['on' + t] = n)
        }
        function oe(e) {
          'complete' === z.readyState
            ? e()
            : Te.addEventListener
            ? Te.addEventListener('load', e, !1)
            : Te.attachEvent && Te.attachEvent('onload', e)
        }
        function n(e) {
          var t = !1
          if (((t = z.attachEvent ? 'complete' === z.readyState : 'loading' !== z.readyState), t)) return void e()
          var n
          z.addEventListener
            ? ie(z, 'DOMContentLoaded', function n() {
                z.removeEventListener('DOMContentLoaded', n, !1), t || ((t = !0), e())
              })
            : z.attachEvent &&
              (z.attachEvent('onreadystatechange', function n() {
                'complete' === z.readyState && (z.detachEvent('onreadystatechange', n), !t && ((t = !0), e()))
              }),
              z.documentElement.doScroll &&
                Te === Te.top &&
                (function n() {
                  if (!t) {
                    try {
                      z.documentElement.doScroll('left')
                    } catch (e) {
                      return void setTimeout(n, 0)
                    }
                    ;(t = !0), e()
                  }
                })()),
            ie(
              Te,
              'load',
              function () {
                t || ((t = !0), e())
              },
              !1,
            )
        }
        function q(e, t, n) {
          if (!e) return ''
          var i,
            o,
            a,
            r,
            s = ''
          for (i in Ce)
            Object.prototype.hasOwnProperty.call(Ce, i) &&
              ((r = Ce[i] && 'function' == typeof Ce[i][e]), r && ((o = Ce[i][e]), (a = o(t || {}, n)), a && (s += a)))
          return s
        }
        function re(e) {
          var t
          ;(ve = !0), q('unload'), (t = new Date())
          var n = t.getTimeAlias()
          if ((3e3 < he - n && (he = n + 3e3), he))
            do t = new Date()
            while (t.getTimeAlias() < he)
        }
        function se(e, t) {
          var n = z.createElement('script')
          ;(n.type = 'text/javascript'),
            (n.src = e),
            n.readyState
              ? (n.onreadystatechange = function () {
                  var e = this.readyState
                  ;('loaded' === e || 'complete' === e) && ((n.onreadystatechange = null), t())
                })
              : (n.onload = t),
            z.getElementsByTagName('head')[0].appendChild(n)
        }
        function o() {
          var e = ''
          try {
            e = Te.top.document.referrer
          } catch (t) {
            if (Te.parent)
              try {
                e = Te.parent.document.referrer
              } catch (t) {
                e = ''
              }
          }
          return '' === e && (e = z.referrer), e
        }
        function N(e) {
          var t = /^([a-z]+):/,
            n = t.exec(e)
          return n ? n[1] : null
        }
        function s(e) {
          var t = /^(?:(?:https?|ftp):)\/*(?:[^@]+@)?([^:/#]+)/,
            n = t.exec(e)
          return n ? n[1] : e
        }
        function d(e) {
          return /^[0-9][0-9]*(\.[0-9]+)?$/.test(e)
        }
        function G(e, t) {
          var n,
            i = {}
          for (n in e) e.hasOwnProperty(n) && t(e[n]) && (i[n] = e[n])
          return i
        }
        function Q(e) {
          var t,
            n = {}
          for (t in e)
            if (e.hasOwnProperty(t))
              if (d(e[t])) n[t] = _(e[t])
              else
                throw new Error(
                  'Parameter "' + t + '" provided value "' + e[t] + '" is not valid. Please provide a numeric value.',
                )
          return n
        }
        function B(e) {
          var t,
            n = ''
          for (t in e) e.hasOwnProperty(t) && (n += '&' + h(t) + '=' + h(e[t]))
          return n
        }
        function l(e, t) {
          return (e += ''), 0 === e.lastIndexOf(t, 0)
        }
        function de(e, t) {
          return (e += ''), -1 !== e.indexOf(t, e.length - t.length)
        }
        function U(e, t) {
          return (e += ''), -1 !== e.indexOf(t)
        }
        function A(e, t) {
          return (e += ''), e.substr(0, e.length - t)
        }
        function le(e, t, n) {
          ;(e += ''), n || (n = '')
          var i = e.indexOf('#'),
            o = e.length
          ;-1 === i && (i = o)
          var a = e.substr(0, i),
            r = e.substr(i, o - i)
          return -1 === a.indexOf('?') ? (a += '?') : !de(a, '?') && (a += '&'), a + h(t) + '=' + h(n) + r
        }
        function I(e, t) {
          if (((e += ''), -1 === e.indexOf('?' + t + '=') && -1 === e.indexOf('&' + t + '='))) return e
          var n = e.indexOf('?')
          if (-1 === n) return e
          var i = e.substr(n + 1),
            o = e.substr(0, n)
          if (i) {
            var a = '',
              r = i.indexOf('#')
            ;-1 !== r && ((a = i.substr(r + 1)), (i = i.substr(0, r)))
            var s,
              d = i.split('&'),
              l = d.length - 1
            for (l; 0 <= l; l--) (s = d[l].split('=')[0]), s === t && d.splice(l, 1)
            var c = d.join('&')
            c && (o = o + '?' + c), a && (o += '#' + a)
          }
          return o
        }
        function j(e, t) {
          var n = '[\\?&#]' + t + '=([^&#]*)',
            i = new RegExp(n),
            o = i.exec(e)
          return o ? $(o[1]) : ''
        }
        function e(e) {
          return e && e + '' === e ? e.replace(/^\s+|\s+$/g, '') : e
        }
        function a(e) {
          return unescape(h(e))
        }
        function F(e) {
          var t,
            n,
            i,
            o,
            r,
            s,
            d,
            l,
            c,
            u,
            m = function (e, t) {
              return (e << t) | (e >>> (32 - t))
            },
            g = function (e) {
              var t,
                n,
                i = ''
              for (t = 7; 0 <= t; t--) (n = 15 & (e >>> (4 * t))), (i += n.toString(16))
              return i
            },
            h = [],
            p = 1732584193,
            C = 4023233417,
            T = 2562383102,
            N = 271733878,
            k = 3285377520,
            b = []
          for (e = a(e), u = e.length, n = 0; n < u - 3; n += 4)
            (i =
              (e.charCodeAt(n) << 24) | (e.charCodeAt(n + 1) << 16) | (e.charCodeAt(n + 2) << 8) | e.charCodeAt(n + 3)),
              b.push(i)
          switch (3 & u) {
            case 0:
              n = 2147483648
              break
            case 1:
              n = 8388608 | (e.charCodeAt(u - 1) << 24)
              break
            case 2:
              n = 32768 | ((e.charCodeAt(u - 2) << 24) | (e.charCodeAt(u - 1) << 16))
              break
            case 3:
              n = 128 | ((e.charCodeAt(u - 3) << 24) | (e.charCodeAt(u - 2) << 16) | (e.charCodeAt(u - 1) << 8))
          }
          for (b.push(n); 14 != (15 & b.length); ) b.push(0)
          for (b.push(u >>> 29), b.push(4294967295 & (u << 3)), t = 0; t < b.length; t += 16) {
            for (n = 0; 16 > n; n++) h[n] = b[t + n]
            for (n = 16; 79 >= n; n++) h[n] = m(h[n - 3] ^ h[n - 8] ^ h[n - 14] ^ h[n - 16], 1)
            for (o = p, r = C, s = T, d = N, l = k, n = 0; 19 >= n; n++)
              (c = 4294967295 & (m(o, 5) + ((r & s) | (~r & d)) + l + h[n] + 1518500249)),
                (l = d),
                (d = s),
                (s = m(r, 30)),
                (r = o),
                (o = c)
            for (n = 20; 39 >= n; n++)
              (c = 4294967295 & (m(o, 5) + (r ^ s ^ d) + l + h[n] + 1859775393)),
                (l = d),
                (d = s),
                (s = m(r, 30)),
                (r = o),
                (o = c)
            for (n = 40; 59 >= n; n++)
              (c = 4294967295 & (m(o, 5) + ((r & s) | (r & d) | (s & d)) + l + h[n] + 2400959708)),
                (l = d),
                (d = s),
                (s = m(r, 30)),
                (r = o),
                (o = c)
            for (n = 60; 79 >= n; n++)
              (c = 4294967295 & (m(o, 5) + (r ^ s ^ d) + l + h[n] + 3395469782)),
                (l = d),
                (d = s),
                (s = m(r, 30)),
                (r = o),
                (o = c)
            ;(p = 4294967295 & (p + o)),
              (C = 4294967295 & (C + r)),
              (T = 4294967295 & (T + s)),
              (N = 4294967295 & (N + d)),
              (k = 4294967295 & (k + l))
          }
          return (c = g(p) + g(C) + g(T) + g(N) + g(k)), c.toLowerCase()
        }
        function ue(e, t, n) {
          return (
            e || (e = ''),
            t || (t = ''),
            'translate.googleusercontent.com' === e
              ? ('' === n && (n = t), (t = j(t, 'u')), (e = s(t)))
              : ('cc.bingj.com' === e || 'webcache.googleusercontent.com' === e || '74.6.' === e.slice(0, 5)) &&
                ((t = z.links[0].href), (e = s(t))),
            [e, t, n]
          )
        }
        function ae(e) {
          var t = e.length
          return (
            '.' === e.charAt(--t) && (e = e.slice(0, t)),
            '*.' === e.slice(0, 2) && (e = e.slice(1)),
            -1 !== e.indexOf('/') && (e = e.substr(0, e.indexOf('/'))),
            e
          )
        }
        function O(e) {
          if (((e = e && e.text ? e.text : e), !Z(e))) {
            var t = z.getElementsByTagName('title')
            t && p(t[0]) && (e = t[0].text)
          }
          return e
        }
        function ce(e) {
          return e ? (!p(e.children) && p(e.childNodes) ? e.children : p(e.children) ? e.children : []) : []
        }
        function S(e, t) {
          return (
            !!(e && t) &&
            (e.contains
              ? e.contains(t)
              : e === t || (!!e.compareDocumentPosition && !!(16 & e.compareDocumentPosition(t))))
          )
        }
        function Y(e, t) {
          if (e && e.indexOf) return e.indexOf(t)
          if (!p(e) || null === e) return -1
          if (!e.length) return -1
          var n = e.length
          if (0 === n) return -1
          for (var i = 0; i < n; ) {
            if (e[i] === t) return i
            i++
          }
          return -1
        }
        function P(e) {
          function t(e, t) {
            return Te.getComputedStyle
              ? z.defaultView.getComputedStyle(e, null)[t]
              : e.currentStyle
              ? e.currentStyle[t]
              : void 0
          }
          function n(e) {
            for (e = e.parentNode; e; ) {
              if (e === z) return !0
              e = e.parentNode
            }
            return !1
          }
          function i(o, a, r, s, d, l, c) {
            var u = o.parentNode,
              m = 1
            return (
              !!n(o) &&
              (9 === u.nodeType ||
                ('0' !== t(o, 'opacity') &&
                  'none' !== t(o, 'display') &&
                  'hidden' !== t(o, 'visibility') &&
                  ((p(a) && p(r) && p(s) && p(d) && p(l) && p(c)) ||
                    ((a = o.offsetTop),
                    (d = o.offsetLeft),
                    (s = a + o.offsetHeight),
                    (r = d + o.offsetWidth),
                    (l = o.offsetWidth),
                    (c = o.offsetHeight)),
                  (e !== o || (0 !== c && 0 !== l) || 'hidden' !== t(o, 'overflow')) &&
                    (!u ||
                      (!(
                        ('hidden' === t(u, 'overflow') || 'scroll' === t(u, 'overflow')) &&
                        (d + 1 > u.offsetWidth + u.scrollLeft ||
                          d + l - 1 < u.scrollLeft ||
                          a + 1 > u.offsetHeight + u.scrollTop ||
                          a + c - 1 < u.scrollTop)
                      ) &&
                        (o.offsetParent === u && ((d += u.offsetLeft), (a += u.offsetTop)), i(u, a, r, s, d, l, c)))))))
            )
          }
          return !!e && i(e)
        }
        function i(e, t) {
          if (t) return t
          if (((e = Ae.toAbsoluteUrl(e)), U(e, '?'))) {
            var n = e.indexOf('?')
            e = e.slice(0, n)
          }
          if (de(e, 'matomo.php')) e = A(e, 10)
          else if (de(e, 'piwik.php')) e = A(e, 9)
          else if (de(e, '.php')) {
            var i = e.lastIndexOf('/'),
              o = 1
            e = e.slice(0, i + o)
          }
          return de(e, '/js/') && (e = A(e, 3)), e
        }
        function me(e) {
          var t = 'Matomo_Overlay',
            n =
              /index\.php\?module=Overlay&action=startOverlaySession&idSite=([0-9]+)&period=([^&]+)&date=([^&]+)(&segment=[^&]*)?/,
            i = n.exec(z.referrer)
          if (i) {
            var o = i[1]
            if (o !== e + '') return !1
            var a = i[2],
              r = i[3],
              s = i[4]
            s ? 0 === s.indexOf('&segment=') && (s = s.substr(9)) : (s = ''),
              (Te.name = 'Matomo_Overlay###' + a + '###' + r + '###' + s)
          }
          var d = Te.name.split('###')
          return 4 === d.length && 'Matomo_Overlay' === d[0]
        }
        function R(e, t, n) {
          var o = Te.name.split('###'),
            a = o[1],
            r = o[2],
            s = o[3],
            d = i(e, t)
          se(d + 'plugins/Overlay/client/client.js?v=1', function () {
            Matomo_Overlay_Client.initialize(d, n, a, r, s)
          })
        }
        function ge() {
          var e
          try {
            e = Te.frameElement
          } catch (e) {
            return !0
          }
          if (p(e)) return !!(e && 'iframe' === (e.nodeName + '').toLowerCase())
          try {
            return Te.self !== Te.top
          } catch (e) {
            return !0
          }
        }
        function v(a, r) {
          var d = Math.floor
          function c(e) {
            if (Zn && 'mtm_consent_removed' !== e) return 0
            var n = new RegExp('(^|;)[ ]*' + e + '=([^;]*)'),
              i = n.exec(z.cookie)
            return i ? t(i[2]) : 0
          }
          function u(e, t, n, i, o, a, r) {
            if (!(Zn && 'mtm_consent_removed' !== e)) {
              var s
              if (
                (n && ((s = new Date()), s.setTime(s.getTime() + n)),
                r || (r = 'Lax'),
                (z.cookie =
                  e +
                  '=' +
                  h(t) +
                  (n ? ';expires=' + s.toGMTString() : '') +
                  ';path=' +
                  (i || '/') +
                  (o ? ';domain=' + o : '') +
                  (a ? ';secure' : '') +
                  ';SameSite=' +
                  r),
                (!n || 0 <= n) && c(e) !== t + '')
              ) {
                var d = 'There was an error setting cookie `' + e + '`. Please check domain and path.'
                D(d)
              }
            }
          }
          function m(e) {
            var t, n
            for (e = I(e, 'pk_vid'), e = I(e, 'ignore_referrer'), e = I(e, 'ignore_referer'), n = 0; n < Mn.length; n++)
              e = I(e, Mn[n])
            return en ? ((t = /#.*/), e.replace(t, '')) : e
          }
          function T(e, t) {
            var n,
              i = N(t)
            return i
              ? t
              : '/' === t.slice(0, 1)
              ? N(e) + '://' + s(e) + t
              : ((e = m(e)),
                (n = e.indexOf('?')),
                0 <= n && (e = e.slice(0, n)),
                (n = e.lastIndexOf('/')),
                n !== e.length - 1 && (e = e.slice(0, n + 1)),
                e + t)
          }
          function b(e, t) {
            var n
            if (((e = (e + '').toLowerCase()), (t = (t + '').toLowerCase()), e === t)) return !0
            if ('.' === t.slice(0, 1)) {
              if (e === t.slice(1)) return !0
              if (((n = e.length - t.length), 0 < n && e.slice(n) === t)) return !0
            }
            return !1
          }
          function A(e) {
            var t = document.createElement('a')
            return (
              0 !== e.indexOf('//') &&
                0 !== e.indexOf('http') &&
                (0 === e.indexOf('*') && (e = e.substr(1)),
                0 === e.indexOf('.') && (e = e.substr(1)),
                (e = 'http://' + e)),
              (t.href = Ae.toAbsoluteUrl(e)),
              t.pathname ? t.pathname : ''
            )
          }
          function E(e, t) {
            l(t, '/') || (t = '/' + t), l(e, '/') || (e = '/' + e)
            var n = '/' === t || '/*' === t
            return (
              !!n ||
              e === t ||
              (((t = (t + '').toLowerCase()), (e = (e + '').toLowerCase()), de(t, '*'))
                ? ((t = t.slice(0, -1)), (n = !t || '/' === t), !!n || e === t || 0 === e.indexOf(t))
                : (de(e, '/') || (e += '/'), de(t, '/') || (t += '/'), 0 === e.indexOf(t)))
            )
          }
          function y(e, t) {
            var n, i, o, a, r
            for (n = 0; n < Vn.length; n++) if (((a = ae(Vn[n])), (r = A(Vn[n])), b(e, a) && E(t, r))) return !0
            return !1
          }
          function w(e) {
            var t, n, i
            for (t = 0; t < Vn.length; t++) {
              if (((n = ae(Vn[t].toLowerCase())), e === n)) return !0
              if ('.' === n.slice(0, 1)) {
                if (e === n.slice(1)) return !0
                if (((i = e.length - n.length), 0 < i && e.slice(i) === n)) return !0
              }
            }
            return !1
          }
          function L(e) {
            var t, n, i, o, a
            if (!e.length || !Un.length) return !1
            for (n = s(e), i = A(e), 0 === n.indexOf('www.') && (n = n.substr(4)), t = 0; t < Un.length; t++)
              if (((o = ae(Un[t])), (a = A(Un[t])), 0 === o.indexOf('www.') && (o = o.substr(4)), b(n, o) && E(i, a)))
                return !0
            return !1
          }
          function x(e, t) {
            e = e.replace('send_image=0', 'send_image=1')
            var n = new Image(1, 1)
            ;(n.onload = function () {
              ;(pe = 0), 'function' == typeof t && t({ request: e, trackerUrl: wn, success: !0 })
            }),
              (n.onerror = function () {
                'function' == typeof t && t({ request: e, trackerUrl: wn, success: !1 })
              }),
              (n.src = wn + (0 > wn.indexOf('?') ? '?' : '&') + e)
          }
          function P(e) {
            return 'POST' === An || (e && (2e3 < e.length || 0 === e.indexOf('{"requests"')))
          }
          function V() {
            return 'object' == typeof J && 'function' == typeof J.sendBeacon && 'function' == typeof Blob
          }
          function U(e, t, n) {
            var i = V()
            if (!i) return !1
            var o = { type: 'application/x-www-form-urlencoded; charset=UTF-8' },
              a = !1,
              r = wn
            try {
              var s = new Blob([e], o)
              n && !P(e) && ((s = new Blob([], o)), (r = r + (0 > r.indexOf('?') ? '?' : '&') + e)),
                (a = J.sendBeacon(r, s))
            } catch (e) {
              return !1
            }
            return a && 'function' == typeof t && t({ request: e, trackerUrl: wn, success: !0, isSendBeacon: !0 }), a
          }
          function H(e, t, n) {
            ;(p(n) && null !== n) || (n = !0),
              (ve && U(e, t, n)) ||
                setTimeout(function () {
                  if (!(ve && U(e, t, n))) {
                    var i
                    try {
                      var o = Te.XMLHttpRequest
                        ? new Te.XMLHttpRequest()
                        : Te.ActiveXObject
                        ? new ActiveXObject('Microsoft.XMLHTTP')
                        : null
                      o.open('POST', wn, !0),
                        (o.onreadystatechange = function () {
                          if (4 === this.readyState && !(200 <= this.status && 300 > this.status)) {
                            var i = ve && U(e, t, n)
                            !i && n
                              ? x(e, t)
                              : 'function' == typeof t && t({ request: e, trackerUrl: wn, success: !1, xhr: this })
                          } else
                            4 === this.readyState &&
                              'function' == typeof t &&
                              t({ request: e, trackerUrl: wn, success: !0, xhr: this })
                        }),
                        o.setRequestHeader('Content-Type', yn),
                        (o.withCredentials = !0),
                        o.send(e)
                    } catch (o) {
                      ;(i = ve && U(e, t, n)),
                        !i && n ? x(e, t) : 'function' == typeof t && t({ request: e, trackerUrl: wn, success: !1 })
                    }
                  }
                }, 50)
          }
          function X(e) {
            var t = new Date(),
              n = t.getTime() + e
            ;(!he || n > he) && (he = n)
          }
          function K() {
            ;(Ai = !0), (Ei = new Date().getTime())
          }
          function ne() {
            var e = new Date().getTime()
            return !Ei || e - Ei > Kt
          }
          function re() {
            ne() && $t()
          }
          function se() {
            'hidden' === z.visibilityState && ne()
              ? $t()
              : 'visible' === z.visibilityState && (Ei = new Date().getTime())
          }
          function Ee() {
            _i ||
              !Kt ||
              ((_i = !0),
              ie(Te, 'focus', K),
              ie(Te, 'blur', re),
              ie(Te, 'visibilitychange', se),
              ke++,
              fe.addPlugin('HeartBeat' + ke, {
                unload: function () {
                  _i && ne() && $t()
                },
              }))
          }
          function ye(e) {
            var t = new Date(),
              n = t.getTime()
            if (((yi = n), Ni && n < Ni)) {
              var i = Ni - n
              return setTimeout(e, i), X(i + 50), void (Ni += 50)
            }
            if (!1 === Ni) {
              var o = 800
              Ni = n + 800
            }
            e()
          }
          function we() {
            c('mtm_consent_removed') ? (Ii = !1) : c('mtm_consent') && (Ii = !0)
          }
          function Se(e) {
            if (!hi) return e
            var t,
              n = '&uadata=' + h(Te.JSON.stringify(hi))
            if (e instanceof Array) for (t = 0; t < e.length; t++) e[t] += n
            else e += n
            return e
          }
          function Oe(e) {
            return qi && p(J.userAgentData) && M(J.userAgentData.getHighEntropyValues)
              ? void ((hi = { brands: J.userAgentData.brands, platform: J.userAgentData.platform }),
                J.userAgentData
                  .getHighEntropyValues([
                    'brands',
                    'model',
                    'platform',
                    'platformVersion',
                    'uaFullVersion',
                    'fullVersionList',
                  ])
                  .then(
                    function (t) {
                      var n
                      t.fullVersionList && (delete t.brands, delete t.uaFullVersion), (hi = t), e()
                    },
                    function (t) {
                      e()
                    },
                  ))
              : void e()
          }
          function Le(e, t, n) {
            return fi
              ? (we(),
                Ii
                  ? void ((Vi = !0),
                    !an &&
                      e &&
                      (xi && Ii && (e += '&consent=1'),
                      (e = Se(e)),
                      ye(function () {
                        return jn && U(e, n, !0) ? void X(100) : void (P(e) ? H(e, n) : x(e, n), X(t))
                      })),
                    !_i && Ee())
                  : void Pi.push(e))
              : void pi.push(e)
          }
          function xe(e) {
            return !an && e && e.length
          }
          function Ie(e, t) {
            if (!t || t >= e.length) return [e]
            var n = 0,
              i = e.length,
              o = []
            for (n; n < i; n += t) o.push(e.slice(n, n + t))
            return o
          }
          function Pe(e, t) {
            return xe(e)
              ? fi
                ? Ii
                  ? void ((Vi = !0),
                    ye(function () {
                      var n,
                        i = Ie(e, 50),
                        o = 0
                      for (o; o < i.length; o++)
                        (n = '{"requests":["?' + Se(i[o]).join('","?') + '"],"send_image":0}'),
                          jn && U(n, null, !1) ? X(100) : H(n, null, !1)
                      X(t)
                    }))
                  : void Pi.push(e)
                : void pi.push(e)
              : void 0
          }
          function Re(e) {
            return zn + e + '.' + xn + '.' + mn
          }
          function De(e, t, n) {
            u(e, '', -1296e5, t, n)
          }
          function Ve() {
            if (Zn) return '0'
            if (!p(Te.showModalDialog) && p(J.cookieEnabled)) return J.cookieEnabled ? '1' : '0'
            var e = zn + 'testcookie'
            u(e, '1', void 0, on, nn, Xn, Qn)
            var t = '1' === c(e) ? '1' : '0'
            return De(e), t
          }
          function ce() {
            mn = wi((nn || Nn) + (on || '/')).slice(0, 4)
          }
          function qe() {
            if (
              (Oe(function () {
                var e, t
                for (fi = !0, e = 0; e < pi.length; e++)
                  (t = typeof pi[e]), 'string' === t ? Le(pi[e], Gn) : 'object' == t && Pe(pi[e], Gn)
                pi = []
              }),
              !qi)
            )
              return {}
            if (p(gi.res)) return gi
            var e,
              t,
              n = {
                pdf: 'application/pdf',
                qt: 'video/quicktime',
                realp: 'audio/x-pn-realaudio-plugin',
                wma: 'application/x-mplayer2',
                fla: 'application/x-shockwave-flash',
                java: 'application/x-java-vm',
                ag: 'application/x-silverlight',
              }
            if (!/MSIE/.test(J.userAgent)) {
              if (J.mimeTypes && J.mimeTypes.length)
                for (e in n)
                  Object.prototype.hasOwnProperty.call(n, e) &&
                    ((t = J.mimeTypes[n[e]]), (gi[e] = t && t.enabledPlugin ? '1' : '0'))
              !/Edge[ /](\d+[\.\d]+)/.test(J.userAgent) &&
                'unknown' != typeof navigator.javaEnabled &&
                p(J.javaEnabled) &&
                J.javaEnabled() &&
                (gi.java = '1'),
                (gi.cookie = !p(Te.showModalDialog) && p(J.cookieEnabled) ? (J.cookieEnabled ? '1' : '0') : Ve())
            }
            var i = parseInt(g.width, 10),
              o = parseInt(g.height, 10)
            return (gi.res = parseInt(i, 10) + 'x' + parseInt(o, 10)), gi
          }
          function Ue() {
            var e = Re('cvar'),
              t = c(e)
            return t && t.length && ((t = Te.JSON.parse(t)), C(t)) ? t : {}
          }
          function Me() {
            !1 === ai && (ai = Ue())
          }
          function We() {
            var e = qe()
            return wi(
              (J.userAgent || '') + (J.platform || '') + Te.JSON.stringify(e) + new Date().getTime() + Math.random(),
            ).slice(0, 16)
          }
          function Fe() {
            var e = qe()
            return wi((J.userAgent || '') + (J.platform || '') + Te.JSON.stringify(e)).slice(0, 6)
          }
          function Ge() {
            return d(new Date().getTime() / 1e3)
          }
          function je() {
            var e = Ge(),
              t = Fe(),
              n = e + '' + t
            return n
          }
          function He(e) {
            e += ''
            var t = Fe(),
              n = t.length,
              i = e.substr(-1 * n, n),
              o = parseInt(e.substr(0, e.length - n), 10)
            if (o && i && i === t) {
              var a = Ge()
              if (0 >= Yn) return !0
              if (a >= o && a <= o + Yn) return !0
            }
            return !1
          }
          function Be(e) {
            if (!vi) return ''
            var t = j(e, 'pk_vid')
            if (!t) return ''
            t += ''
            var n = /^[a-zA-Z0-9]+$/
            if (32 === t.length && n.test(t)) {
              var i = t.substr(16, 32)
              if (He(i)) {
                var o = t.substr(0, 16)
                return o
              }
            }
            return ''
          }
          function ze() {
            Pn || (Pn = Be(kn))
            var e,
              t,
              n = new Date(),
              i = _(n.getTime() / 1e3),
              o = Re('id'),
              a = c(o)
            return a
              ? ((e = a.split('.')), e.unshift('0'), Pn.length && (e[1] = Pn), e)
              : ((t = Pn.length ? Pn : '0' === Ve() ? '' : We()), (e = ['1', t, i]), e)
          }
          function Je() {
            var e = ze(),
              t = e[0],
              n = e[1],
              i = e[2]
            return { newVisitor: t, uuid: n, createTs: i }
          }
          function Ye() {
            var e = new Date(),
              t = e.getTime(),
              n = Je().createTs,
              i = parseInt(n, 10),
              o = 1e3 * i + Kn - t
            return o
          }
          function Xe(e) {
            if (xn) {
              var t = new Date(),
                n = _(t.getTime() / 1e3)
              p(e) || (e = Je())
              var i = e.uuid + '.' + e.createTs + '.'
              u(Re('id'), i, Ye(), on, nn, Xn, Qn)
            }
          }
          function Qe() {
            var e = c(Re('ref'))
            if (e.length)
              try {
                if (((e = Te.JSON.parse(e)), C(e))) return e
              } catch (e) {}
            return ['', '', 0, '']
          }
          function Ze(e) {
            var t = zn + 'testcookie_domain',
              n = 'testvalue'
            return u(t, n, 1e4, null, e, Xn, Qn), c(t) === n && (De(t, null, e), !0)
          }
          function Ke() {
            var e = Zn
            Zn = !1
            var t, n
            for (t = 0; t < Li.length; t++)
              (n = Re(Li[t])), 'mtm_consent_removed' !== n && 'mtm_consent' !== n && 0 !== c(n) && De(n, on, nn)
            Zn = e
          }
          function $e(e) {
            xn = e
          }
          function et(e) {
            if (e && C(e)) {
              var t,
                n = []
              for (t in e) Object.prototype.hasOwnProperty.call(e, t) && n.push(t)
              var i = {}
              n.sort()
              var o,
                a = n.length
              for (o = 0; o < a; o++) i[n[o]] = e[n[o]]
              return i
            }
          }
          function tt() {
            u(Re('ses'), '1', $n, on, nn, Xn, Qn)
          }
          function nt() {
            var e,
              t = '',
              n = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
              i = n.length
            for (e = 0; 6 > e; e++) t += n.charAt(d(Math.random() * i))
            return t
          }
          function it(e) {
            if ('' !== Ln) return (e += Ln), (ii = !0), e
            if (!W) return e
            var t = 'object' == typeof W.timing && W.timing ? W.timing : void 0
            if (
              (t ||
                (t =
                  'function' == typeof W.getEntriesByType && W.getEntriesByType('navigation')
                    ? W.getEntriesByType('navigation')[0]
                    : void 0),
              !t)
            )
              return e
            var n = ''
            if (t.connectEnd && t.fetchStart) {
              if (t.connectEnd < t.fetchStart) return e
              n += '&pf_net=' + _(t.connectEnd - t.fetchStart)
            }
            if (t.responseStart && t.requestStart) {
              if (t.responseStart < t.requestStart) return e
              n += '&pf_srv=' + _(t.responseStart - t.requestStart)
            }
            if (t.responseStart && t.responseEnd) {
              if (t.responseEnd < t.responseStart) return e
              n += '&pf_tfr=' + _(t.responseEnd - t.responseStart)
            }
            if (p(t.domLoading)) {
              if (t.domInteractive && t.domLoading) {
                if (t.domInteractive < t.domLoading) return e
                n += '&pf_dm1=' + _(t.domInteractive - t.domLoading)
              }
            } else if (t.domInteractive && t.responseEnd) {
              if (t.domInteractive < t.responseEnd) return e
              n += '&pf_dm1=' + _(t.domInteractive - t.responseEnd)
            }
            if (t.domComplete && t.domInteractive) {
              if (t.domComplete < t.domInteractive) return e
              n += '&pf_dm2=' + _(t.domComplete - t.domInteractive)
            }
            if (t.loadEventEnd && t.loadEventStart) {
              if (t.loadEventEnd < t.loadEventStart) return e
              n += '&pf_onl=' + _(t.loadEventEnd - t.loadEventStart)
            }
            return e + n
          }
          function ot(e) {
            return '1' === j(e, 'ignore_referrer') || '1' === j(e, 'ignore_referer')
          }
          function rt() {
            var e,
              t,
              n,
              i,
              o,
              a,
              r,
              d = new Date(),
              l = _(d.getTime() / 1e3),
              g = 1024,
              p = Re('ses'),
              C = Re('ref'),
              T = c(p),
              N = Qe(),
              k = Qt || kn,
              b = {}
            if (((a = N[0]), (r = N[1]), (t = N[2]), (n = N[3]), !ot(k) && !T)) {
              if (!sn || !a.length) {
                for (e in Hn) if (Object.prototype.hasOwnProperty.call(Hn, e) && ((a = j(k, Hn[e])), a.length)) break
                for (e in Bn) if (Object.prototype.hasOwnProperty.call(Bn, e) && ((r = j(k, Bn[e])), r.length)) break
              }
              ;(i = s(bn)),
                (o = n.length ? s(n) : ''),
                !i.length || w(i) || L(bn) || (sn && o.length && !w(o) && !L(n)) || (n = bn),
                (n.length || a.length) &&
                  ((t = l), (N = [a, r, t, m(n.slice(0, 1024))]), u(C, Te.JSON.stringify(N), ei, on, nn, Xn, Qn))
            }
            return (
              a.length && (b._rcn = h(a)),
              r.length && (b._rck = h(r)),
              (b._refts = t),
              (n + '').length && (b._ref = h(m(n.slice(0, 1024)))),
              b
            )
          }
          function st(e, t, n) {
            function i(e, t) {
              var n = Te.JSON.stringify(e)
              return 2 < n.length ? '&' + t + '=' + h(n) : ''
            }
            var o,
              a = new Date(),
              r = ai,
              s = Re('cvar'),
              d = Qt || kn,
              l = ot(d)
            if ((Zn && Ke(), an)) return ''
            var c = Je(),
              g = z.characterSet || z.charset
            ;(g && 'utf-8' !== g.toLowerCase()) || (g = null),
              (e +=
                '&idsite=' +
                xn +
                '&rec=1&r=' +
                (Math.random() + '').slice(2, 8) +
                '&h=' +
                a.getHours() +
                '&m=' +
                a.getMinutes() +
                '&s=' +
                a.getSeconds() +
                '&url=' +
                h(m(d)) +
                (!bn.length || L(bn) || l ? '' : '&urlref=' + h(m(bn))) +
                (ee(In) ? '&uid=' + h(In) : '') +
                '&_id=' +
                c.uuid +
                '&_idn=' +
                c.newVisitor +
                (g ? '&cs=' + h(g) : '') +
                '&send_image=0')
            var p = rt()
            for (o in p) Object.prototype.hasOwnProperty.call(p, o) && (e += '&' + o + '=' + p[o])
            var C = qe()
            for (o in C) Object.prototype.hasOwnProperty.call(C, o) && (e += '&' + o + '=' + C[o])
            var T = []
            if (t)
              for (o in t)
                if (Object.prototype.hasOwnProperty.call(t, o) && /^dimension\d+$/.test(o)) {
                  var N = o.replace('dimension', '')
                  T.push(parseInt(N, 10)), T.push(N + ''), (e += '&' + o + '=' + h(t[o])), delete t[o]
                }
            for (o in (t && te(t) && (t = null), ui))
              Object.prototype.hasOwnProperty.call(ui, o) && (e += '&' + o + '=' + h(ui[o]))
            for (o in li)
              if (Object.prototype.hasOwnProperty.call(li, o)) {
                var k = -1 === Y(T, o)
                k && (e += '&dimension' + o + '=' + h(li[o]))
              }
            t ? (e += '&data=' + h(Te.JSON.stringify(t))) : tn && (e += '&data=' + h(Te.JSON.stringify(tn)))
            var b = et(ri),
              v = et(si)
            if (((e += i(b, 'cvar')), (e += i(v, 'e_cvar')), ai)) {
              for (o in ((e += i(ai, '_cvar')), r))
                Object.prototype.hasOwnProperty.call(r, o) && ('' === ai[o][0] || '' === ai[o][1]) && delete ai[o]
              oi && u(s, Te.JSON.stringify(ai), $n, on, nn, Xn, Qn)
            }
            return (
              ti && ni && !ii && ((e = it(e)), (ii = !0)),
              gn && (e += '&pv_id=' + gn),
              Xe(c),
              tt(),
              (e += q(n, { tracker: hn, request: e })),
              On.length && (e += '&' + On),
              M(ln) && (e = ln(e)),
              e
            )
          }
          function lt(e, t, n, i, o, a) {
            var r,
              s = 'idgoal=0',
              d = new Date(),
              l = [],
              c = (e + '').length
            if (
              (c && (s += '&ec_id=' + h(e)),
              (s += '&revenue=' + t),
              (n + '').length && (s += '&ec_st=' + n),
              (i + '').length && (s += '&ec_tx=' + i),
              (o + '').length && (s += '&ec_sh=' + o),
              (a + '').length && (s += '&ec_dt=' + a),
              mi)
            ) {
              for (r in mi)
                Object.prototype.hasOwnProperty.call(mi, r) &&
                  (p(mi[r][1]) || (mi[r][1] = ''),
                  p(mi[r][2]) || (mi[r][2] = ''),
                  (p(mi[r][3]) && 0 !== (mi[r][3] + '').length) || (mi[r][3] = 0),
                  (p(mi[r][4]) && 0 !== (mi[r][4] + '').length) || (mi[r][4] = 1),
                  l.push(mi[r]))
              s += '&ec_items=' + h(Te.JSON.stringify(l))
            }
            ;(s = st(s, tn, 'ecommerce')), Le(s, Gn), c && (mi = {})
          }
          function ut(e, t, n, i, o, a) {
            ;(e + '').length && p(t) && lt(e, t, n, i, o, a)
          }
          function mt(e) {
            p(e) && lt('', e, '', '', '', '')
          }
          function gt(e, t, n) {
            Si || (gn = nt())
            var i = st('action_name=' + h(O(e || Rn)), t, 'log')
            ti && !ii && (i = it(i)), Le(i, Gn, n)
          }
          function ht(e, t) {
            var n,
              i = '(^| )(piwik[_-]' + t + '|matomo[_-]' + t
            if (e) for (n = 0; n < e.length; n++) i += '|' + e[n]
            return (i += ')( |$)'), new RegExp(i)
          }
          function pt(e) {
            return wn && e && 0 === (e + '').indexOf(wn)
          }
          function ft(e, t, n, i) {
            if (pt(t)) return 0
            var o = ht(Wn, 'download'),
              a = ht(Fn, 'link'),
              r = new RegExp('\\.(' + Dn.join('|') + ')([?&#]|$)', 'i')
            return a.test(e) ? 'link' : i || o.test(e) || r.test(t) ? 'download' : n ? 0 : 'link'
          }
          function Ct(e) {
            var t
            for (t = e.parentNode; null !== t && p(t) && !_e.isLinkElement(e); ) (e = t), (t = e.parentNode)
            return e
          }
          function Tt(e) {
            if (((e = Ct(e)), !!_e.hasNodeAttribute(e, 'href')) && p(e.href)) {
              var t = _e.getAttributeValueFromNode(e, 'href'),
                n = e.pathname || A(e.href),
                i = e.hostname || s(e.href),
                o = i.toLowerCase(),
                a = e.href.replace(i, o),
                r = /^(javascript|vbscript|jscript|mocha|livescript|ecmascript|mailto|tel):/i
              if (!r.test(a)) {
                var d = ft(e.className, a, y(o, n), _e.hasNodeAttribute(e, 'download'))
                if (d) return { type: d, href: a }
              }
            }
          }
          function Nt(e, t, n, i) {
            var o = Ae.buildInteractionRequestParams(e, t, n, i)
            return o ? st(o, null, 'contentInteraction') : void 0
          }
          function kt(e, t) {
            if (!e || !t) return !1
            var n = Ae.findTargetNode(e)
            return !Ae.shouldIgnoreInteraction(n) && ((n = Ae.findTargetNodeNoDefault(e)), !n || S(n, t))
          }
          function vt(e, t, n) {
            if (e) {
              var i = Ae.findParentContentNode(e)
              if (i && kt(i, e)) {
                var o = Ae.buildContentBlock(i)
                if (o)
                  return (
                    !o.target && n && (o.target = n), Ae.buildInteractionRequestParams(t, o.name, o.piece, o.target)
                  )
              }
            }
          }
          function _t(e) {
            if (!Ci || !Ci.length) return !1
            var t, n
            for (t = 0; t < Ci.length; t++)
              if (((n = Ci[t]), n && n.name === e.name && n.piece === e.piece && n.target === e.target)) return !0
            return !1
          }
          function At(e) {
            return function (t) {
              if (e) {
                var n,
                  i = Ae.findParentContentNode(e)
                if ((t && (n = t.target || t.srcElement), n || (n = e), !!kt(i, n))) {
                  if (!i) return !1
                  var o = Ae.findTargetNode(i)
                  if (!o || Ae.shouldIgnoreInteraction(o)) return !1
                  var a = Tt(o)
                  return bi && a && a.type ? a.type : hn.trackContentInteractionNode(n, 'click')
                }
              }
            }
          }
          function Et(e) {
            if (e && e.length) {
              var t, n
              for (t = 0; t < e.length; t++)
                (n = Ae.findTargetNode(e[t])),
                  n &&
                    !n.contentInteractionTrackingSetupDone &&
                    ((n.contentInteractionTrackingSetupDone = !0), ie(n, 'click', At(n)))
            }
          }
          function yt(e, t) {
            if (!e || !e.length) return []
            var n, i
            for (n = 0; n < e.length; n++) _t(e[n]) ? (e.splice(n, 1), n--) : Ci.push(e[n])
            if (!e || !e.length) return []
            Et(t)
            var o = []
            for (n = 0; n < e.length; n++)
              (i = st(
                Ae.buildImpressionRequestParams(e[n].name, e[n].piece, e[n].target),
                void 0,
                'contentImpressions',
              )),
                i && o.push(i)
            return o
          }
          function wt(e) {
            var t = Ae.collectContent(e)
            return yt(t, e)
          }
          function St(e) {
            if (!e || !e.length) return []
            var t
            for (t = 0; t < e.length; t++) Ae.isNodeVisible(e[t]) || (e.splice(t, 1), t--)
            return e && e.length ? wt(e) : []
          }
          function Ot(e, t, n) {
            var i = Ae.buildImpressionRequestParams(e, t, n)
            return st(i, null, 'contentImpression')
          }
          function Lt(e, t) {
            if (e) {
              var n = Ae.findParentContentNode(e),
                i = Ae.buildContentBlock(n)
              if (i) return t || (t = 'Unknown'), Nt(t, i.name, i.piece, i.target)
            }
          }
          function xt(e, t, n, i) {
            return (
              'e_c=' + h(e) + '&e_a=' + h(t) + (p(n) ? '&e_n=' + h(n) : '') + (p(i) ? '&e_v=' + h(i) : '') + '&ca=1'
            )
          }
          function It(e, t, n, i, o, a) {
            if (!ee(e) || !ee(t))
              return (
                D(
                  'Error while logging event: Parameters `category` and `action` must not be empty or filled with whitespaces',
                ),
                !1
              )
            var r = st(xt(e, t, n, i), o, 'event')
            Le(r, Gn, a)
          }
          function Pt(e, t, n, i) {
            var o = st(
              'search=' + h(e) + (t ? '&search_cat=' + h(t) : '') + (p(n) ? '&search_count=' + n : ''),
              i,
              'sitesearch',
            )
            Le(o, Gn)
          }
          function Rt(e, t, n, i) {
            var o = st('idgoal=' + e + (t ? '&revenue=' + t : ''), n, 'goal')
            Le(o, Gn, i)
          }
          function Dt(e, t, n, i, o) {
            var a = t + '=' + h(m(e)),
              r = vt(o, 'click', e)
            r && (a += '&' + r)
            var s = st(a, n, 'link')
            Le(s, Gn, i)
          }
          function Vt(e, t) {
            return '' === e ? t : e + t.charAt(0).toUpperCase() + t.slice(1)
          }
          function qt(e) {
            var t,
              n,
              i,
              o = ['', 'webkit', 'ms', 'moz']
            if (!rn)
              for (n = 0; n < o.length; n++)
                if (((i = o[n]), Object.prototype.hasOwnProperty.call(z, Vt(i, 'hidden')))) {
                  'prerender' === z[Vt(i, 'visibilityState')] && (t = !0)
                  break
                }
            return t
              ? void ie(z, i + 'visibilitychange', function t() {
                  z.removeEventListener(i + 'visibilitychange', t, !1), e()
                })
              : void e()
          }
          function Ut() {
            var e = hn.getVisitorId(),
              t = je()
            return e + t
          }
          function Mt(e) {
            if (e && _e.hasNodeAttribute(e, 'href')) {
              var t = _e.getAttributeValueFromNode(e, 'href')
              if (t && !pt(t) && hn.getVisitorId()) {
                t = I(t, 'pk_vid')
                var n = Ut()
                ;(t = le(t, 'pk_vid', n)), _e.setAnyAttribute(e, 'href', t)
              }
            }
          }
          function Wt(e) {
            var t = _e.getAttributeValueFromNode(e, 'href')
            if (!t) return !1
            t += ''
            var n = 0 === t.indexOf('//') || 0 === t.indexOf('http://') || 0 === t.indexOf('https://')
            if (!n) return !1
            var i = e.pathname || A(e.href),
              o = (e.hostname || s(e.href)).toLowerCase()
            return !!y(o, i) && !b(Nn, ae(o))
          }
          function Ft(e) {
            var t = Tt(e)
            return t && t.type
              ? ((t.href = $(t.href)), void Dt(t.href, t.type, void 0, null, e))
              : void (vi && ((e = Ct(e)), Wt(e) && Mt(e)))
          }
          function Gt() {
            return z.all && !z.addEventListener
          }
          function jt(e) {
            var t = e.which,
              n = typeof e.button
            return (
              t ||
                'undefined' === n ||
                (Gt()
                  ? 1 & e.button
                    ? (t = 1)
                    : 2 & e.button
                    ? (t = 3)
                    : 4 & e.button && (t = 2)
                  : 0 === e.button || '0' === e.button
                  ? (t = 1)
                  : 1 & e.button
                  ? (t = 2)
                  : 2 & e.button && (t = 3)),
              t
            )
          }
          function Ht(e) {
            switch (jt(e)) {
              case 1:
                return 'left'
              case 2:
                return 'middle'
              case 3:
                return 'right'
            }
          }
          function Bt(e) {
            return e.target || e.srcElement
          }
          function zt(e) {
            return 'A' === e || 'AREA' === e
          }
          function Jt(e) {
            function t(e) {
              for (var t = Bt(e), n = t.nodeName, i = ht(qn, 'ignore'); !zt(n) && t && t.parentNode; )
                (t = t.parentNode), (n = t.nodeName)
              if (t && zt(n) && !i.test(t.className)) return t
            }
            return function (n) {
              n = n || Te.event
              var i = t(n)
              if (i) {
                var o = Ht(n)
                if ('click' === n.type) {
                  var a = !1
                  e && 'middle' === o && (a = !0), i && !a && Ft(i)
                } else
                  'mousedown' === n.type
                    ? 'middle' === o && i
                      ? ((cn = o), (un = i))
                      : (cn = un = null)
                    : 'mouseup' === n.type
                    ? (o === cn && i === un && Ft(i), (cn = un = null))
                    : 'contextmenu' === n.type && Ft(i)
              }
            }
          }
          function Yt(e, t, n) {
            var i = typeof t
            'undefined' == i && (t = !0),
              ie(e, 'click', Jt(t), n),
              t && (ie(e, 'mouseup', Jt(t), n), ie(e, 'mousedown', Jt(t), n), ie(e, 'contextmenu', Jt(t), n))
          }
          function Xt(e, t, n) {
            function i() {
              r = !0
            }
            if (Ti) return !0
            Ti = !0
            var o,
              a,
              r = !1
            oe(function () {
              function s(e) {
                setTimeout(function () {
                  Ti && ((r = !1), n.trackVisibleContentImpressions(), s(e))
                }, e)
              }
              function d(e) {
                setTimeout(function () {
                  Ti && (r && ((r = !1), n.trackVisibleContentImpressions()), d(e))
                }, e)
              }
              if (e) {
                for (o = ['scroll', 'resize'], a = 0; a < o.length; a++)
                  z.addEventListener ? z.addEventListener(o[a], i, !1) : Te.attachEvent('on' + o[a], i)
                d(100)
              }
              t && 0 < t && ((t = parseInt(t, 10)), s(t))
            })
          }
          var Qt,
            Zt,
            Kt,
            $t,
            en,
            tn,
            nn,
            on,
            an,
            rn,
            sn,
            ln,
            cn,
            un,
            mn,
            gn,
            hn = this,
            pn = 'mtm_consent',
            fn = 'mtm_cookie_consent',
            Cn = 'mtm_consent_removed',
            Tn = ue(z.domain, Te.location.href, o()),
            Nn = ae(Tn[0]),
            kn = $(Tn[1]),
            bn = $(Tn[2]),
            vn = !1,
            _n = 'GET',
            An = 'GET',
            En = 'application/x-www-form-urlencoded; charset=UTF-8',
            yn = 'application/x-www-form-urlencoded; charset=UTF-8',
            wn = a || '',
            Sn = '',
            On = '',
            Ln = '',
            xn = r || '',
            In = '',
            Pn = '',
            Rn = '',
            Dn = [
              '7z',
              'aac',
              'apk',
              'arc',
              'arj',
              'asf',
              'asx',
              'avi',
              'azw3',
              'bin',
              'csv',
              'deb',
              'dmg',
              'doc',
              'docx',
              'epub',
              'exe',
              'flv',
              'gif',
              'gz',
              'gzip',
              'hqx',
              'ibooks',
              'jar',
              'jpg',
              'jpeg',
              'js',
              'mobi',
              'mp2',
              'mp3',
              'mp4',
              'mpg',
              'mpeg',
              'mov',
              'movie',
              'msi',
              'msp',
              'odb',
              'odf',
              'odg',
              'ods',
              'odt',
              'ogg',
              'ogv',
              'pdf',
              'phps',
              'png',
              'ppt',
              'pptx',
              'qt',
              'qtm',
              'ra',
              'ram',
              'rar',
              'rpm',
              'rtf',
              'sea',
              'sit',
              'tar',
              'tbz',
              'tbz2',
              'bz',
              'bz2',
              'tgz',
              'torrent',
              'txt',
              'wav',
              'wma',
              'wmv',
              'wpd',
              'xls',
              'xlsx',
              'xml',
              'z',
              'zip',
            ],
            Vn = [Nn],
            qn = [],
            Un = ['.paypal.com'],
            Mn = [],
            Wn = [],
            Fn = [],
            Gn = 500,
            jn = !0,
            Hn = [
              'pk_campaign',
              'mtm_campaign',
              'piwik_campaign',
              'matomo_campaign',
              'utm_campaign',
              'utm_source',
              'utm_medium',
            ],
            Bn = ['pk_kwd', 'mtm_kwd', 'piwik_kwd', 'matomo_kwd', 'utm_term'],
            zn = '_pk_',
            Jn = 'pk_vid',
            Yn = 180,
            Xn = !1,
            Qn = 'Lax',
            Zn = !1,
            Kn = 339552e5,
            $n = 18e5,
            ei = 15768e6,
            ti = !0,
            ni = !1,
            ii = !1,
            oi = !1,
            ai = !1,
            ri = {},
            si = {},
            li = {},
            ci = 200,
            ui = {},
            mi = {},
            gi = {},
            hi = {},
            pi = [],
            fi = !1,
            Ci = [],
            Ti = !1,
            Ni = !1,
            ki = !1,
            bi = !1,
            vi = !1,
            _i = !1,
            Ai = ge(),
            Ei = null,
            yi = null,
            wi = F,
            Si = !1,
            Oi = 0,
            Li = ['id', 'ses', 'cvar', 'ref'],
            xi = !1,
            Ii = null,
            Pi = [],
            Ri = [],
            Di = be++,
            Vi = !1,
            qi = !0
          try {
            Rn = z.title
          } catch (e) {
            Rn = ''
          }
          ;(Ii = !c('mtm_consent_removed')),
            ($t = function e() {
              var t = new Date()
              return (t = t.getTime()), !!yi && !!(yi + Kt <= t) && (hn.ping(), !0)
            })
          var Ui = {
            enabled: !0,
            requests: [],
            timeout: null,
            interval: 2500,
            sendRequests: function () {
              var e = this.requests
              ;(this.requests = []), 1 === e.length ? Le(e[0], Gn) : Pe(e, Gn)
            },
            canQueue: function () {
              return !ve && this.enabled
            },
            pushMultiple: function (e) {
              if (!this.canQueue()) return void Pe(e, Gn)
              var t
              for (t = 0; t < e.length; t++) this.push(e[t])
            },
            push: function (e) {
              if (e) {
                if (!this.canQueue()) return void Le(e, Gn)
                Ui.requests.push(e),
                  this.timeout && (clearTimeout(this.timeout), (this.timeout = null)),
                  (this.timeout = setTimeout(function () {
                    ;(Ui.timeout = null), Ui.sendRequests()
                  }, Ui.interval))
                var t = 'RequestQueue' + Di
                Object.prototype.hasOwnProperty.call(Ce, t) ||
                  (Ce[t] = {
                    unload: function () {
                      Ui.timeout && clearTimeout(Ui.timeout), Ui.sendRequests()
                    },
                  })
              }
            },
          }
          ce(),
            (this.hasConsent = function () {
              return Ii
            }),
            (this.getVisitorInfo = function () {
              return c(Re('id')) || Xe(), ze()
            }),
            (this.getVisitorId = function () {
              return this.getVisitorInfo()[1]
            }),
            (this.getAttributionInfo = function () {
              return Qe()
            }),
            (this.getAttributionCampaignName = function () {
              return Qe()[0]
            }),
            (this.getAttributionCampaignKeyword = function () {
              return Qe()[1]
            }),
            (this.getAttributionReferrerTimestamp = function () {
              return Qe()[2]
            }),
            (this.getAttributionReferrerUrl = function () {
              return Qe()[3]
            }),
            (this.setTrackerUrl = function (e) {
              wn = e
            }),
            (this.getTrackerUrl = function () {
              return wn
            }),
            (this.getMatomoUrl = function () {
              return i(this.getTrackerUrl(), Sn)
            }),
            (this.getPiwikUrl = function () {
              return this.getMatomoUrl()
            }),
            (this.addTracker = function (e, t) {
              ;(p(e) && null !== e) || (e = this.getTrackerUrl())
              var n = new v(e, t)
              return k.push(n), fe.trigger('TrackerAdded', [this]), n
            }),
            (this.getSiteId = function () {
              return xn
            }),
            (this.setSiteId = function (e) {
              $e(e)
            }),
            (this.resetUserId = function () {
              In = ''
            }),
            (this.setUserId = function (e) {
              ee(e) && (In = e)
            }),
            (this.setVisitorId = function (e) {
              var t = /[0-9A-Fa-f]{16}/g
              Z(e) && t.test(e) ? (Pn = e) : D('Invalid visitorId set' + e)
            }),
            (this.getUserId = function () {
              return In
            }),
            (this.setCustomData = function (e, t) {
              C(e) ? (tn = e) : (!tn && (tn = {}), (tn[e] = t))
            }),
            (this.getCustomData = function () {
              return tn
            }),
            (this.setCustomRequestProcessing = function (e) {
              ln = e
            }),
            (this.appendToTrackingUrl = function (e) {
              On = e
            }),
            (this.getRequest = function (e) {
              return st(e)
            }),
            (this.addPlugin = function (e, t) {
              Ce[e] = t
            }),
            (this.setCustomDimension = function (e, t) {
              ;(e = parseInt(e, 10)), 0 < e && (!p(t) && (t = ''), !Z(t) && (t += ''), (li[e] = t))
            }),
            (this.getCustomDimension = function (e) {
              if (((e = parseInt(e, 10)), 0 < e && Object.prototype.hasOwnProperty.call(li, e))) return li[e]
            }),
            (this.deleteCustomDimension = function (e) {
              ;(e = parseInt(e, 10)), 0 < e && delete li[e]
            }),
            (this.setCustomVariable = function (e, t, n, i) {
              var o
              p(i) || (i = 'visit'),
                p(t) &&
                  (!p(n) && (n = ''),
                  0 < e &&
                    ((t = Z(t) ? t : t + ''),
                    (n = Z(n) ? n : n + ''),
                    (o = [t.slice(0, 200), n.slice(0, 200)]),
                    'visit' === i || 2 === i
                      ? (Me(), (ai[e] = o))
                      : 'page' === i || 3 === i
                      ? (ri[e] = o)
                      : 'event' === i && (si[e] = o)))
            }),
            (this.getCustomVariable = function (e, t) {
              var n
              return (
                p(t) || (t = 'visit'),
                'page' === t || 3 === t
                  ? (n = ri[e])
                  : 'event' === t
                  ? (n = si[e])
                  : ('visit' == t || 2 === t) && (Me(), (n = ai[e])),
                p(n) && (!n || '' !== n[0]) && n
              )
            }),
            (this.deleteCustomVariable = function (e, t) {
              this.getCustomVariable(e, t) && this.setCustomVariable(e, '', '', t)
            }),
            (this.deleteCustomVariables = function (e) {
              'page' === e || 3 === e ? (ri = {}) : 'event' === e ? (si = {}) : ('visit' == e || 2 === e) && (ai = {})
            }),
            (this.storeCustomVariablesInCookie = function () {
              oi = !0
            }),
            (this.setLinkTrackingTimer = function (e) {
              Gn = e
            }),
            (this.getLinkTrackingTimer = function () {
              return Gn
            }),
            (this.setDownloadExtensions = function (e) {
              Z(e) && (e = e.split('|')), (Dn = e)
            }),
            (this.addDownloadExtensions = function (e) {
              var t
              for (Z(e) && (e = e.split('|')), t = 0; t < e.length; t++) Dn.push(e[t])
            }),
            (this.removeDownloadExtensions = function (e) {
              var t,
                n = []
              for (Z(e) && (e = e.split('|')), t = 0; t < Dn.length; t++) -1 === Y(e, Dn[t]) && n.push(Dn[t])
              Dn = n
            }),
            (this.setDomains = function (e) {
              Vn = Z(e) ? [e] : e
              var t,
                n = !1,
                i = 0
              for (i; i < Vn.length; i++) {
                if (((t = Vn[i] + ''), b(Nn, ae(t)))) {
                  n = !0
                  break
                }
                var o = A(t)
                if (o && '/' !== o && '/*' !== o) {
                  n = !0
                  break
                }
              }
              n || Vn.push(Nn)
            }),
            (this.setExcludedReferrers = function (e) {
              Un = Z(e) ? [e] : e
            }),
            (this.enableCrossDomainLinking = function () {
              vi = !0
            }),
            (this.disableCrossDomainLinking = function () {
              vi = !1
            }),
            (this.isCrossDomainLinkingEnabled = function () {
              return vi
            }),
            (this.setCrossDomainLinkingTimeout = function (e) {
              Yn = e
            }),
            (this.getCrossDomainLinkingUrlParameter = function () {
              return h('pk_vid') + '=' + h(Ut())
            }),
            (this.setIgnoreClasses = function (e) {
              qn = Z(e) ? [e] : e
            }),
            (this.setRequestMethod = function (e) {
              ;(An = e ? (e + '').toUpperCase() : 'GET'), 'GET' === An && this.disableAlwaysUseSendBeacon()
            }),
            (this.setRequestContentType = function (e) {
              yn = e || 'application/x-www-form-urlencoded; charset=UTF-8'
            }),
            (this.setGenerationTimeMs = function (e) {
              D(
                'setGenerationTimeMs is no longer supported since Matomo 4. The call will be ignored. The replacement is setPagePerformanceTiming.',
              )
            }),
            (this.setPagePerformanceTiming = function (e, t, n, i, o, a) {
              var r = { pf_net: e, pf_srv: t, pf_tfr: n, pf_dm1: i, pf_dm2: o, pf_onl: a }
              try {
                if (((r = G(r, p)), (r = Q(r)), (Ln = B(r)), '' === Ln))
                  return void D(
                    'setPagePerformanceTiming() called without parameters. This function needs to be called with at least one performance parameter.',
                  )
                ;(ii = !1), (ni = !0)
              } catch (e) {
                D('setPagePerformanceTiming: ' + e.toString())
              }
            }),
            (this.setReferrerUrl = function (e) {
              bn = e
            }),
            (this.setCustomUrl = function (e) {
              Qt = T(kn, e)
            }),
            (this.getCurrentUrl = function () {
              return Qt || kn
            }),
            (this.setDocumentTitle = function (e) {
              Rn = e
            }),
            (this.setPageViewId = function (e) {
              ;(gn = e), (Si = !0)
            }),
            (this.setAPIUrl = function (e) {
              Sn = e
            }),
            (this.setDownloadClasses = function (e) {
              Wn = Z(e) ? [e] : e
            }),
            (this.setLinkClasses = function (e) {
              Fn = Z(e) ? [e] : e
            }),
            (this.setCampaignNameKey = function (e) {
              Hn = Z(e) ? [e] : e
            }),
            (this.setCampaignKeywordKey = function (e) {
              Bn = Z(e) ? [e] : e
            }),
            (this.discardHashTag = function (e) {
              en = e
            }),
            (this.setCookieNamePrefix = function (e) {
              ;(zn = e), ai && (ai = Ue())
            }),
            (this.setCookieDomain = function (e) {
              var t = ae(e)
              Zn || Ze(t) ? ((nn = t), ce()) : D("Can't write cookie on domain " + e)
            }),
            (this.setExcludedQueryParams = function (e) {
              Mn = Z(e) ? [e] : e
            }),
            (this.getCookieDomain = function () {
              return nn
            }),
            (this.hasCookies = function () {
              return '1' === Ve()
            }),
            (this.setSessionCookie = function (e, t, n) {
              if (!e) throw new Error('Missing cookie name')
              p(n) || (n = $n), Li.push(e), u(Re(e), t, n, on, nn, Xn, Qn)
            }),
            (this.getCookie = function (e) {
              var t = c(Re(e))
              return 0 === t ? null : t
            }),
            (this.setCookiePath = function (e) {
              ;(on = e), ce()
            }),
            (this.getCookiePath = function (e) {
              return on
            }),
            (this.setVisitorCookieTimeout = function (e) {
              Kn = 1e3 * e
            }),
            (this.setSessionCookieTimeout = function (e) {
              $n = 1e3 * e
            }),
            (this.getSessionCookieTimeout = function () {
              return $n
            }),
            (this.setReferralCookieTimeout = function (e) {
              ei = 1e3 * e
            }),
            (this.setConversionAttributionFirstReferrer = function (e) {
              sn = e
            }),
            (this.setSecureCookie = function (e) {
              return e && 'https:' !== location.protocol
                ? void D('Error in setSecureCookie: You cannot use `Secure` on http.')
                : void (Xn = e)
            }),
            (this.setCookieSameSite = function (e) {
              return (
                (e += ''),
                (e = e.charAt(0).toUpperCase() + e.toLowerCase().slice(1)),
                'None' !== e && 'Lax' !== e && 'Strict' !== e
                  ? void D('Ignored value for sameSite. Please use either Lax, None, or Strict.')
                  : void ('None' === e &&
                      ('https:' === location.protocol
                        ? this.setSecureCookie(!0)
                        : (D('sameSite=None cannot be used on http, reverted to sameSite=Lax.'), (e = 'Lax'))),
                    (Qn = e))
              )
            }),
            (this.disableCookies = function () {
              ;(Zn = !0), xn && Ke()
            }),
            (this.areCookiesEnabled = function () {
              return !Zn
            }),
            (this.setCookieConsentGiven = function () {
              if (Zn && !an && ((Zn = !1), (qi = !0), xn && Vi)) {
                Xe()
                var e = st('ping=1', null, 'ping')
                Le(e, Gn)
              }
            }),
            (this.requireCookieConsent = function () {
              return !this.getRememberedCookieConsent() && (this.disableCookies(), !0)
            }),
            (this.getRememberedCookieConsent = function () {
              return c('mtm_cookie_consent')
            }),
            (this.forgetCookieConsentGiven = function () {
              De('mtm_cookie_consent', on, nn), this.disableCookies()
            }),
            (this.rememberCookieConsentGiven = function (e) {
              ;(e = e ? 1e3 * (60 * (60 * e)) : 946080000000), this.setCookieConsentGiven()
              var t = new Date().getTime()
              u('mtm_cookie_consent', t, e, on, nn, Xn, Qn)
            }),
            (this.deleteCookies = function () {
              Ke()
            }),
            (this.setDoNotTrack = function (e) {
              var t = J.doNotTrack || J.msDoNotTrack
              ;(an = e && ('yes' === t || '1' === t)), an && this.disableCookies()
            }),
            (this.alwaysUseSendBeacon = function () {
              jn = !0
            }),
            (this.disableAlwaysUseSendBeacon = function () {
              jn = !1
            }),
            (this.addListener = function (e, t) {
              Yt(e, t, !1)
            }),
            (this.enableLinkTracking = function (e) {
              if (!bi) {
                bi = !0
                var t = this
                n(function () {
                  ki = !0
                  var t = z.body
                  Yt(t, e, !0)
                })
              }
            }),
            (this.enableJSErrorTracking = function () {
              if (!vn) {
                vn = !0
                var e = Te.onerror
                Te.onerror = function (t, n, i, o, a) {
                  return (
                    qt(function () {
                      var e = 'JavaScript Errors',
                        a = n + ':' + i
                      o && (a += ':' + o),
                        -1 === Y(Ri, 'JavaScript Errors' + a + t) &&
                          (Ri.push('JavaScript Errors' + a + t), It('JavaScript Errors', a, t))
                    }),
                    !!e && e(t, n, i, o, a)
                  )
                }
              }
            }),
            (this.disablePerformanceTracking = function () {
              ti = !1
            }),
            (this.enableHeartBeatTimer = function (e) {
              var t = Math.max
              ;(e = t(e || 15, 5)), (Kt = 1e3 * e), null !== yi && Ee()
            }),
            (this.disableHeartBeatTimer = function () {
              ;(Kt || _i) &&
                (Te.removeEventListener
                  ? (Te.removeEventListener('focus', K),
                    Te.removeEventListener('blur', re),
                    Te.removeEventListener('visibilitychange', se))
                  : Te.detachEvent &&
                    (Te.detachEvent('onfocus', K),
                    Te.detachEvent('onblur', re),
                    Te.detachEvent('visibilitychange', se))),
                (Kt = null),
                (_i = !1)
            }),
            (this.killFrame = function () {
              Te.location !== Te.top.location && (Te.top.location = Te.location)
            }),
            (this.redirectFile = function (e) {
              'file:' === Te.location.protocol && (Te.location = e)
            }),
            (this.setCountPreRendered = function (e) {
              rn = e
            }),
            (this.trackGoal = function (e, t, n, i) {
              qt(function () {
                Rt(e, t, n, i)
              })
            }),
            (this.trackLink = function (e, t, n, i) {
              qt(function () {
                Dt(e, t, n, i)
              })
            }),
            (this.getNumTrackedPageViews = function () {
              return Oi
            }),
            (this.trackPageView = function (e, t, n) {
              ;(Ci = []),
                (Pi = []),
                (Ri = []),
                me(xn)
                  ? qt(function () {
                      R(wn, Sn, xn)
                    })
                  : qt(function () {
                      Oi++, gt(e, t, n)
                    })
            }),
            (this.disableBrowserFeatureDetection = function () {
              qi = !1
            }),
            (this.enableBrowserFeatureDetection = function () {
              qi = !0
            }),
            (this.trackAllContentImpressions = function () {
              me(xn) ||
                qt(function () {
                  n(function () {
                    var e = Ae.findContentNodes(),
                      t = wt(e)
                    Ui.pushMultiple(t)
                  })
                })
            }),
            (this.trackVisibleContentImpressions = function (e, t) {
              me(xn) ||
                (!p(e) && (e = !0),
                !p(t) && (t = 750),
                Xt(e, t, this),
                qt(function () {
                  oe(function () {
                    var e = Ae.findContentNodes(),
                      t = St(e)
                    Ui.pushMultiple(t)
                  })
                }))
            }),
            (this.trackContentImpression = function (t, n, i) {
              me(xn) ||
                ((t = e(t)),
                (n = e(n)),
                (i = e(i)),
                t &&
                  ((n = n || 'Unknown'),
                  qt(function () {
                    var e = Ot(t, n, i)
                    Ui.push(e)
                  })))
            }),
            (this.trackContentImpressionsWithinNode = function (e) {
              me(xn) ||
                !e ||
                qt(function () {
                  Ti
                    ? oe(function () {
                        var t = Ae.findContentNodesWithinNode(e),
                          n = St(t)
                        Ui.pushMultiple(n)
                      })
                    : n(function () {
                        var t = Ae.findContentNodesWithinNode(e),
                          n = wt(t)
                        Ui.pushMultiple(n)
                      })
                })
            }),
            (this.trackContentInteraction = function (t, n, i, o) {
              me(xn) ||
                ((t = e(t)),
                (n = e(n)),
                (i = e(i)),
                (o = e(o)),
                t &&
                  n &&
                  ((i = i || 'Unknown'),
                  qt(function () {
                    var e = Nt(t, n, i, o)
                    e && Ui.push(e)
                  })))
            }),
            (this.trackContentInteractionNode = function (e, t) {
              if (!me(xn) && e) {
                var n = null
                return (
                  qt(function () {
                    ;(n = Lt(e, t)), n && Ui.push(n)
                  }),
                  n
                )
              }
            }),
            (this.logAllContentBlocksOnPage = function () {
              var e = Ae.findContentNodes(),
                t = Ae.collectContent(e),
                n = typeof console
              'undefined' !== n && console && console.log && console.log(t)
            }),
            (this.trackEvent = function (e, t, n, i, o, a) {
              qt(function () {
                It(e, t, n, i, o, a)
              })
            }),
            (this.trackSiteSearch = function (e, t, n, i) {
              ;(Ci = []),
                qt(function () {
                  Pt(e, t, n, i)
                })
            }),
            (this.setEcommerceView = function (e, t, n, i) {
              ;(ui = {}),
                ee(n) && (n += ''),
                p(n) && null !== n && !1 !== n && n.length ? n instanceof Array && (n = Te.JSON.stringify(n)) : (n = '')
              var o = '_pkc'
              ;(ui[o] = n),
                p(i) && null !== i && !1 !== i && (i + '').length && ((o = '_pkp'), (ui[o] = i)),
                (ee(e) || ee(t)) &&
                  (ee(e) && ((o = '_pks'), (ui[o] = e)), !ee(t) && (t = ''), (o = '_pkn'), (ui[o] = t))
            }),
            (this.getEcommerceItems = function () {
              return JSON.parse(JSON.stringify(mi))
            }),
            (this.addEcommerceItem = function (e, t, n, i, o) {
              ee(e) && (mi[e] = [e + '', t, n, i, o])
            }),
            (this.removeEcommerceItem = function (e) {
              ee(e) && ((e += ''), delete mi[e])
            }),
            (this.clearEcommerceCart = function () {
              mi = {}
            }),
            (this.trackEcommerceOrder = function (e, t, n, i, o, a) {
              ut(e, t, n, i, o, a)
            }),
            (this.trackEcommerceCartUpdate = function (e) {
              mt(e)
            }),
            (this.trackRequest = function (e, t, n, i) {
              qt(function () {
                var o = st(e, t, i)
                Le(o, Gn, n)
              })
            }),
            (this.ping = function () {
              this.trackRequest('ping=1', null, null, 'ping')
            }),
            (this.disableQueueRequest = function () {
              Ui.enabled = !1
            }),
            (this.setRequestQueueInterval = function (e) {
              if (1e3 > e) throw new Error('Request queue interval needs to be at least 1000ms')
              Ui.interval = e
            }),
            (this.queueRequest = function (e) {
              qt(function () {
                var t = st(e)
                Ui.push(t)
              })
            }),
            (this.isConsentRequired = function () {
              return xi
            }),
            (this.getRememberedConsent = function () {
              var e = c('mtm_consent')
              return c('mtm_consent_removed') ? (e && De('mtm_consent', on, nn), null) : e && 0 !== e ? e : null
            }),
            (this.hasRememberedConsent = function () {
              return !!this.getRememberedConsent()
            }),
            (this.requireConsent = function () {
              ;(xi = !0),
                (Ii = this.hasRememberedConsent()),
                Ii || (Zn = !0),
                Ne++,
                (Ce['CoreConsent' + Ne] = {
                  unload: function () {
                    Ii || Ke()
                  },
                })
            }),
            (this.setConsentGiven = function (e) {
              ;(Ii = !0), (qi = !0), De('mtm_consent_removed', on, nn)
              var t, n
              for (t = 0; t < Pi.length; t++)
                (n = typeof Pi[t]), 'string' === n ? Le(Pi[t], Gn) : 'object' == n && Pe(Pi[t], Gn)
              ;(Pi = []), (!p(e) || e) && this.setCookieConsentGiven()
            }),
            (this.rememberConsentGiven = function (e) {
              e = e ? 1e3 * (60 * (60 * e)) : 946080000000
              var t = !0
              this.setConsentGiven(!0)
              var n = new Date().getTime()
              u('mtm_consent', n, e, on, nn, Xn, Qn)
            }),
            (this.forgetConsentGiven = function (e) {
              ;(e = e ? 1e3 * (60 * (60 * e)) : 946080000000),
                De('mtm_consent', on, nn),
                u('mtm_consent_removed', new Date().getTime(), e, on, nn, Xn, Qn),
                this.forgetCookieConsentGiven(),
                this.requireConsent()
            }),
            (this.isUserOptedOut = function () {
              return !Ii
            }),
            (this.optUserOut = this.forgetConsentGiven),
            (this.forgetUserOptOut = function () {
              this.setConsentGiven(!1)
            }),
            oe(function () {
              setTimeout(function () {
                ni = !0
              }, 0)
            }),
            fe.trigger('TrackerSetup', [this]),
            fe.addPlugin('TrackerVisitorIdCookie' + Di, {
              unload: function () {
                Vi || (Xe(), rt())
              },
            })
        }
        function T() {
          return { push: ne }
        }
        function K(e, t) {
          var n,
            i,
            o = {}
          for (n = 0; n < t.length; n++) {
            var a = t[n]
            for (o[a] = 1, i = 0; i < e.length; i++)
              if (e[i] && e[i][0]) {
                var r = e[i][0]
                a === r &&
                  (ne(e[i]),
                  delete e[i],
                  1 < o[r] &&
                    'addTracker' !== r &&
                    'enableLinkTracking' !== r &&
                    D(
                      'The method ' +
                        r +
                        ' is registered more than once in "_paq" variable. Only the last call has an effect. Please have a look at the multiple Matomo trackers documentation: https://developer.matomo.org/guides/tracking-javascript-guide#multiple-piwik-trackers',
                    ),
                  o[r]++)
              }
          }
          return e
        }
        function c(e, t) {
          var n = new v(e, t)
          for (k.push(n), _paq = K(_paq, w), pe = 0; pe < _paq.length; pe++) _paq[pe] && ne(_paq[pe])
          return (_paq = new T()), fe.trigger('TrackerAdded', [n]), n
        }
        var he,
          pe,
          fe,
          Ce = {},
          b = {},
          z = document,
          J = navigator,
          g = screen,
          Te = window,
          W = Te.performance || Te.mozPerformance || Te.msPerformance || Te.webkitPerformance,
          h = Te.encodeURIComponent,
          t = Te.decodeURIComponent,
          V = unescape,
          k = [],
          L = [],
          Ne = 0,
          ke = 0,
          be = 0,
          ve = !1,
          _e = {
            htmlCollectionToArray: function (e) {
              var t,
                n = []
              if (!e || !e.length) return n
              for (t = 0; t < e.length; t++) n.push(e[t])
              return n
            },
            find: function (e) {
              if (!document.querySelectorAll || !e) return []
              var t = document.querySelectorAll(e)
              return this.htmlCollectionToArray(t)
            },
            findMultiple: function (e) {
              if (!e || !e.length) return []
              var t,
                n,
                i = []
              for (t = 0; t < e.length; t++) (n = this.find(e[t])), (i = i.concat(n))
              return (i = this.makeNodesUnique(i)), i
            },
            findNodesByTagName: function (e, t) {
              if (!e || !t || !e.getElementsByTagName) return []
              var n = e.getElementsByTagName(t)
              return this.htmlCollectionToArray(n)
            },
            makeNodesUnique: function (e) {
              var t = [].concat(e)
              if (
                (e.sort(function (e, n) {
                  if (e === n) return 0
                  var i = Y(t, e),
                    o = Y(t, n)
                  return i === o ? 0 : i > o ? -1 : 1
                }),
                1 >= e.length)
              )
                return e
              var n,
                i = 0,
                o = 0,
                a = []
              for (n = e[i++]; n; ) n === e[i] && (o = a.push(i)), (n = e[i++] || null)
              for (; o--; ) e.splice(a[o], 1)
              return e
            },
            getAttributeValueFromNode: function (e, t) {
              if (this.hasNodeAttribute(e, t)) {
                if (e && e.getAttribute) return e.getAttribute(t)
                if (e && e.attributes) {
                  var n = typeof e.attributes[t]
                  if ('undefined' != n) {
                    if (e.attributes[t].value) return e.attributes[t].value
                    if (e.attributes[t].nodeValue) return e.attributes[t].nodeValue
                    var i,
                      o = e.attributes
                    if (o) {
                      for (i = 0; i < o.length; i++) if (o[i].nodeName === t) return o[i].nodeValue
                      return null
                    }
                  }
                }
              }
            },
            hasNodeAttributeWithValue: function (e, t) {
              var n = this.getAttributeValueFromNode(e, t)
              return !!n
            },
            hasNodeAttribute: function (e, t) {
              if (e && e.hasAttribute) return e.hasAttribute(t)
              if (e && e.attributes) {
                var n = typeof e.attributes[t]
                return 'undefined' != n
              }
              return !1
            },
            hasNodeCssClass: function (e, t) {
              if (e && t && e.className) {
                var n = 'string' == typeof e.className ? e.className.split(' ') : []
                if (-1 !== Y(n, t)) return !0
              }
              return !1
            },
            findNodesHavingAttribute: function (e, t, n) {
              if ((n || (n = []), !e || !t)) return n
              var i = ce(e)
              if (!i || !i.length) return n
              var o, a
              for (o = 0; o < i.length; o++)
                (a = i[o]), this.hasNodeAttribute(a, t) && n.push(a), (n = this.findNodesHavingAttribute(a, t, n))
              return n
            },
            findFirstNodeHavingAttribute: function (e, t) {
              if (e && t) {
                if (this.hasNodeAttribute(e, t)) return e
                var n = this.findNodesHavingAttribute(e, t)
                if (n && n.length) return n[0]
              }
            },
            findFirstNodeHavingAttributeWithValue: function (e, t) {
              if (e && t) {
                if (this.hasNodeAttributeWithValue(e, t)) return e
                var n = this.findNodesHavingAttribute(e, t)
                if (n && n.length) {
                  var i
                  for (i = 0; i < n.length; i++) if (this.getAttributeValueFromNode(n[i], t)) return n[i]
                }
              }
            },
            findNodesHavingCssClass: function (e, t, n) {
              if ((n || (n = []), !e || !t)) return n
              if (e.getElementsByClassName) {
                var i = e.getElementsByClassName(t)
                return this.htmlCollectionToArray(i)
              }
              var o = ce(e)
              if (!o || !o.length) return []
              var a, r
              for (a = 0; a < o.length; a++)
                (r = o[a]), this.hasNodeCssClass(r, t) && n.push(r), (n = this.findNodesHavingCssClass(r, t, n))
              return n
            },
            findFirstNodeHavingClass: function (e, t) {
              if (e && t) {
                if (this.hasNodeCssClass(e, t)) return e
                var n = this.findNodesHavingCssClass(e, t)
                if (n && n.length) return n[0]
              }
            },
            isLinkElement: function (e) {
              if (!e) return !1
              var t = (e.nodeName + '').toLowerCase(),
                n = ['a', 'area'],
                i = Y(n, t)
              return -1 !== i
            },
            setAnyAttribute: function (e, t, n) {
              e && t && (e.setAttribute ? e.setAttribute(t, n) : (e[t] = n))
            },
          },
          Ae = {
            CONTENT_ATTR: 'data-track-content',
            CONTENT_CLASS: 'matomoTrackContent',
            LEGACY_CONTENT_CLASS: 'piwikTrackContent',
            CONTENT_NAME_ATTR: 'data-content-name',
            CONTENT_PIECE_ATTR: 'data-content-piece',
            CONTENT_PIECE_CLASS: 'matomoContentPiece',
            LEGACY_CONTENT_PIECE_CLASS: 'piwikContentPiece',
            CONTENT_TARGET_ATTR: 'data-content-target',
            CONTENT_TARGET_CLASS: 'matomoContentTarget',
            LEGACY_CONTENT_TARGET_CLASS: 'piwikContentTarget',
            CONTENT_IGNOREINTERACTION_ATTR: 'data-content-ignoreinteraction',
            CONTENT_IGNOREINTERACTION_CLASS: 'matomoContentIgnoreInteraction',
            LEGACY_CONTENT_IGNOREINTERACTION_CLASS: 'piwikContentIgnoreInteraction',
            location: void 0,
            findContentNodes: function () {
              var e = '.' + this.CONTENT_CLASS,
                t = '.' + this.LEGACY_CONTENT_CLASS,
                n = '[' + this.CONTENT_ATTR + ']',
                i = _e.findMultiple([e, t, n])
              return i
            },
            findContentNodesWithinNode: function (e) {
              if (!e) return []
              var t = _e.findNodesHavingCssClass(e, this.CONTENT_CLASS)
              t = _e.findNodesHavingCssClass(e, this.LEGACY_CONTENT_CLASS, t)
              var n = _e.findNodesHavingAttribute(e, this.CONTENT_ATTR)
              if (n && n.length) {
                var i
                for (i = 0; i < n.length; i++) t.push(n[i])
              }
              return (
                _e.hasNodeAttribute(e, this.CONTENT_ATTR)
                  ? t.push(e)
                  : _e.hasNodeCssClass(e, this.CONTENT_CLASS)
                  ? t.push(e)
                  : _e.hasNodeCssClass(e, this.LEGACY_CONTENT_CLASS) && t.push(e),
                (t = _e.makeNodesUnique(t)),
                t
              )
            },
            findParentContentNode: function (e) {
              if (e)
                for (var t = e, n = 0; t && t !== z && t.parentNode; ) {
                  if (_e.hasNodeAttribute(t, this.CONTENT_ATTR)) return t
                  if (_e.hasNodeCssClass(t, this.CONTENT_CLASS)) return t
                  if (_e.hasNodeCssClass(t, this.LEGACY_CONTENT_CLASS)) return t
                  if (((t = t.parentNode), 1e3 < n)) break
                  n++
                }
            },
            findPieceNode: function (e) {
              var t
              return (
                (t = _e.findFirstNodeHavingAttribute(e, this.CONTENT_PIECE_ATTR)),
                t || (t = _e.findFirstNodeHavingClass(e, this.CONTENT_PIECE_CLASS)),
                t || (t = _e.findFirstNodeHavingClass(e, this.LEGACY_CONTENT_PIECE_CLASS)),
                t ? t : e
              )
            },
            findTargetNodeNoDefault: function (e) {
              if (e) {
                var t = _e.findFirstNodeHavingAttributeWithValue(e, this.CONTENT_TARGET_ATTR)
                if (t) return t
                if (((t = _e.findFirstNodeHavingAttribute(e, this.CONTENT_TARGET_ATTR)), t)) return t
                if (((t = _e.findFirstNodeHavingClass(e, this.CONTENT_TARGET_CLASS)), t)) return t
                if (((t = _e.findFirstNodeHavingClass(e, this.LEGACY_CONTENT_TARGET_CLASS)), t)) return t
              }
            },
            findTargetNode: function (e) {
              var t = this.findTargetNodeNoDefault(e)
              return t ? t : e
            },
            findContentName: function (e) {
              if (e) {
                var t = _e.findFirstNodeHavingAttributeWithValue(e, this.CONTENT_NAME_ATTR)
                if (t) return _e.getAttributeValueFromNode(t, this.CONTENT_NAME_ATTR)
                var n = this.findContentPiece(e)
                if (n) return this.removeDomainIfIsInLink(n)
                if (_e.hasNodeAttributeWithValue(e, 'title')) return _e.getAttributeValueFromNode(e, 'title')
                var i = this.findPieceNode(e)
                if (_e.hasNodeAttributeWithValue(i, 'title')) return _e.getAttributeValueFromNode(i, 'title')
                var o = this.findTargetNode(e)
                if (_e.hasNodeAttributeWithValue(o, 'title')) return _e.getAttributeValueFromNode(o, 'title')
              }
            },
            findContentPiece: function (e) {
              if (e) {
                var t = _e.findFirstNodeHavingAttributeWithValue(e, this.CONTENT_PIECE_ATTR)
                if (t) return _e.getAttributeValueFromNode(t, this.CONTENT_PIECE_ATTR)
                var n = this.findPieceNode(e),
                  i = this.findMediaUrlInNode(n)
                if (i) return this.toAbsoluteUrl(i)
              }
            },
            findContentTarget: function (e) {
              if (e) {
                var t = this.findTargetNode(e)
                if (_e.hasNodeAttributeWithValue(t, this.CONTENT_TARGET_ATTR))
                  return _e.getAttributeValueFromNode(t, this.CONTENT_TARGET_ATTR)
                var n
                if (_e.hasNodeAttributeWithValue(t, 'href'))
                  return (n = _e.getAttributeValueFromNode(t, 'href')), this.toAbsoluteUrl(n)
                var i = this.findPieceNode(e)
                if (_e.hasNodeAttributeWithValue(i, 'href'))
                  return (n = _e.getAttributeValueFromNode(i, 'href')), this.toAbsoluteUrl(n)
              }
            },
            isSameDomain: function (e) {
              if (!e || !e.indexOf) return !1
              if (0 === e.indexOf(this.getLocation().origin)) return !0
              var t = e.indexOf(this.getLocation().host)
              return !!(8 >= t && 0 <= t)
            },
            removeDomainIfIsInLink: function (e) {
              var t = '^https?://[^/]+',
                n = '^.*//[^/]+'
              return (
                e &&
                  e.search &&
                  -1 !== e.search(/^https?:\/\/[^/]+/) &&
                  this.isSameDomain(e) &&
                  ((e = e.replace(new RegExp(n), '')), !e && (e = '/')),
                e
              )
            },
            findMediaUrlInNode: function (e) {
              if (e) {
                var t = ['img', 'embed', 'video', 'audio'],
                  n = e.nodeName.toLowerCase()
                if (-1 !== Y(t, n) && _e.findFirstNodeHavingAttributeWithValue(e, 'src')) {
                  var i = _e.findFirstNodeHavingAttributeWithValue(e, 'src')
                  return _e.getAttributeValueFromNode(i, 'src')
                }
                if ('object' === n && _e.hasNodeAttributeWithValue(e, 'data'))
                  return _e.getAttributeValueFromNode(e, 'data')
                if ('object' === n) {
                  var o = _e.findNodesByTagName(e, 'param')
                  if (o && o.length) {
                    var a
                    for (a = 0; a < o.length; a++)
                      if (
                        'movie' === _e.getAttributeValueFromNode(o[a], 'name') &&
                        _e.hasNodeAttributeWithValue(o[a], 'value')
                      )
                        return _e.getAttributeValueFromNode(o[a], 'value')
                  }
                  var r = _e.findNodesByTagName(e, 'embed')
                  if (r && r.length) return this.findMediaUrlInNode(r[0])
                }
              }
            },
            trim: function (t) {
              return e(t)
            },
            isOrWasNodeInViewport: function (e) {
              if (!e || !e.getBoundingClientRect || 1 !== e.nodeType) return !0
              var t = e.getBoundingClientRect(),
                n = z.documentElement || {},
                i = 0 > t.top
              i && e.offsetTop && (i = 0 < e.offsetTop + t.height)
              var o = n.clientWidth
              Te.innerWidth && o > Te.innerWidth && (o = Te.innerWidth)
              var a = n.clientHeight
              return (
                Te.innerHeight && a > Te.innerHeight && (a = Te.innerHeight),
                (0 < t.bottom || i) && 0 < t.right && t.left < o && (t.top < a || i)
              )
            },
            isNodeVisible: function (e) {
              var t = P(e),
                n = this.isOrWasNodeInViewport(e)
              return t && n
            },
            buildInteractionRequestParams: function (e, t, n, i) {
              var o = ''
              return (
                e && (o += 'c_i=' + h(e)),
                t && (o && (o += '&'), (o += 'c_n=' + h(t))),
                n && (o && (o += '&'), (o += 'c_p=' + h(n))),
                i && (o && (o += '&'), (o += 'c_t=' + h(i))),
                o && (o += '&ca=1'),
                o
              )
            },
            buildImpressionRequestParams: function (e, t, n) {
              var i = 'c_n=' + h(e) + '&c_p=' + h(t)
              return n && (i += '&c_t=' + h(n)), i && (i += '&ca=1'), i
            },
            buildContentBlock: function (e) {
              if (e) {
                var t = this.findContentName(e),
                  n = this.findContentPiece(e),
                  i = this.findContentTarget(e)
                return (
                  (t = this.trim(t)),
                  (n = this.trim(n)),
                  (i = this.trim(i)),
                  { name: t || 'Unknown', piece: n || 'Unknown', target: i || '' }
                )
              }
            },
            collectContent: function (e) {
              if (!e || !e.length) return []
              var t,
                n,
                i = []
              for (t = 0; t < e.length; t++) (n = this.buildContentBlock(e[t])), p(n) && i.push(n)
              return i
            },
            setLocation: function (e) {
              this.location = e
            },
            getLocation: function () {
              var e = this.location || Te.location
              return e.origin || (e.origin = e.protocol + '//' + e.hostname + (e.port ? ':' + e.port : '')), e
            },
            toAbsoluteUrl: function (e) {
              if ((!e || e + '' !== e) && '' !== e) return e
              if ('' === e) return this.getLocation().href
              if (-1 !== e.search(/^\/\//)) return this.getLocation().protocol + e
              if (-1 !== e.search(/:\/\//)) return e
              if (0 === e.indexOf('#')) return this.getLocation().origin + this.getLocation().pathname + e
              if (0 === e.indexOf('?')) return this.getLocation().origin + this.getLocation().pathname + e
              if (0 === e.search('^[a-zA-Z]{2,11}:')) return e
              if (-1 !== e.search(/^\//)) return this.getLocation().origin + e
              var t = '(.*/)',
                n = this.getLocation().origin + this.getLocation().pathname.match(/(.*\/)/)[0]
              return n + e
            },
            isUrlToCurrentDomain: function (e) {
              var t = this.toAbsoluteUrl(e)
              if (!t) return !1
              var n = this.getLocation().origin
              return n === t || (0 === (t + '').indexOf(n) && ':' !== (t + '').substr(n.length, 1))
            },
            setHrefAttribute: function (e, t) {
              e && t && _e.setAnyAttribute(e, 'href', t)
            },
            shouldIgnoreInteraction: function (e) {
              return (
                !!_e.hasNodeAttribute(e, this.CONTENT_IGNOREINTERACTION_ATTR) ||
                !!_e.hasNodeCssClass(e, this.CONTENT_IGNOREINTERACTION_CLASS) ||
                !!_e.hasNodeCssClass(e, this.LEGACY_CONTENT_IGNOREINTERACTION_CLASS)
              )
            },
          },
          w = [
            'addTracker',
            'forgetCookieConsentGiven',
            'requireCookieConsent',
            'disableBrowserFeatureDetection',
            'disableCookies',
            'setTrackerUrl',
            'setAPIUrl',
            'enableCrossDomainLinking',
            'setCrossDomainLinkingTimeout',
            'setSessionCookieTimeout',
            'setVisitorCookieTimeout',
            'setCookieNamePrefix',
            'setCookieSameSite',
            'setSecureCookie',
            'setCookiePath',
            'setCookieDomain',
            'setDomains',
            'setUserId',
            'setVisitorId',
            'setSiteId',
            'alwaysUseSendBeacon',
            'disableAlwaysUseSendBeacon',
            'enableLinkTracking',
            'setCookieConsentGiven',
            'requireConsent',
            'setConsentGiven',
            'disablePerformanceTracking',
            'setPagePerformanceTiming',
            'setExcludedQueryParams',
            'setExcludedReferrers',
          ]
        return (
          ie(Te, 'beforeunload', re, !1),
          ie(
            Te,
            'visibilitychange',
            function () {
              ve || ('hidden' === z.visibilityState && q('unload'))
            },
            !1,
          ),
          ie(
            Te,
            'online',
            function () {
              p(J.serviceWorker) &&
                J.serviceWorker.ready.then(
                  function (e) {
                    if (e && e.sync) return e.sync.register('matomoSync')
                  },
                  function () {},
                )
            },
            !1,
          ),
          ie(
            Te,
            'message',
            function (e) {
              function t(t) {
                var n = z.getElementsByTagName('iframe')
                for (i = 0; i < n.length; i++) {
                  var o = n[i],
                    r = s(o.src)
                  if (o.contentWindow && p(o.contentWindow.postMessage) && r === a) {
                    var d = JSON.stringify(t)
                    o.contentWindow.postMessage(d, e.origin)
                  }
                }
              }
              if (e && e.origin) {
                var n,
                  i,
                  o,
                  a = s(e.origin),
                  r = fe.getAsyncTrackers()
                for (i = 0; i < r.length; i++)
                  if (((o = s(r[i].getMatomoUrl())), o === a)) {
                    n = r[i]
                    break
                  }
                if (n) {
                  var d = null
                  try {
                    d = JSON.parse(e.data)
                  } catch (e) {
                    return
                  }
                  if (d)
                    if (p(d.maq_initial_value))
                      t({
                        maq_opted_in: d.maq_initial_value && n.hasConsent(),
                        maq_url: n.getMatomoUrl(),
                        maq_optout_by_default: n.isConsentRequired(),
                      })
                    else if (p(d.maq_opted_in)) {
                      for (r = fe.getAsyncTrackers(), i = 0; i < r.length; i++)
                        (n = r[i]), d.maq_opted_in ? n.rememberConsentGiven() : n.forgetConsentGiven()
                      t({
                        maq_confirm_opted_in: n.hasConsent(),
                        maq_url: n.getMatomoUrl(),
                        maq_optout_by_default: n.isConsentRequired(),
                      })
                    }
                }
              }
            },
            !1,
          ),
          (Date.prototype.getTimeAlias = Date.prototype.getTime),
          (fe = {
            initialized: !1,
            JSON: Te.JSON,
            DOM: {
              addEventListener: function (e, t, n, i) {
                var o = typeof i
                'undefined' == o && (i = !1), ie(e, t, n, i)
              },
              onLoad: oe,
              onReady: n,
              isNodeVisible: P,
              isOrWasNodeVisible: Ae.isNodeVisible,
            },
            on: function (e, t) {
              b[e] || (b[e] = []), b[e].push(t)
            },
            off: function (e, t) {
              if (b[e]) {
                var n = 0
                for (n; n < b[e].length; n++) b[e][n] === t && b[e].splice(n, 1)
              }
            },
            trigger: function (e, t, n) {
              if (b[e]) {
                var i = 0
                for (i; i < b[e].length; i++) b[e][i].apply(n || Te, t)
              }
            },
            addPlugin: function (e, t) {
              Ce[e] = t
            },
            getTracker: function (e, t) {
              return (
                p(t) || (t = this.getAsyncTracker().getSiteId()),
                p(e) || (e = this.getAsyncTracker().getTrackerUrl()),
                new v(e, t)
              )
            },
            getAsyncTrackers: function () {
              return k
            },
            addTracker: function (e, t) {
              var n
              return (n = k.length ? k[0].addTracker(e, t) : c(e, t)), n
            },
            getAsyncTracker: function (e, t) {
              var n
              if (k.length && k[0]) n = k[0]
              else return c(e, t)
              if (!t && !e) return n
              ;(!p(t) || null === t) && n && (t = n.getSiteId()), (!p(e) || null === e) && n && (e = n.getTrackerUrl())
              var i,
                o = 0
              for (o; o < k.length; o++)
                if (((i = k[o]), i && i.getSiteId() + '' === t + '' && i.getTrackerUrl() === e)) return i
            },
            retryMissedPluginCalls: function () {
              var e = L
              L = []
              var t = 0
              for (t; t < e.length; t++) ne(e[t])
            },
          }),
          'function' == typeof define &&
            define.amd &&
            (define('piwik', [], function () {
              return fe
            }),
            define('matomo', [], function () {
              return fe
            })),
          fe
        )
      })())
/*!!! pluginTrackerHook */ const a0a4 = a0b
function a0b(e, t) {
  const n = a0a()
  return (
    (a0b = function (t, i) {
      t -= 373
      let e = n[t]
      return e
    }),
    a0b(e, t)
  )
}
;(function (e, t) {
  for (const n = a0b, i = e(); !0; )
    try {
      const e =
        (parseInt(n(399)) / 1) * (parseInt(n(457)) / 2) +
        -parseInt(n(418)) / 3 +
        (parseInt(n(481)) / 4) * (-parseInt(n(453)) / 5) +
        parseInt(n(378)) / 6 +
        (parseInt(n(401)) / 7) * (parseInt(n(461)) / 8) +
        -parseInt(n(420)) / 9 +
        parseInt(n(475)) / 10
      if (e === t) break
      else i.push(i.shift())
    } catch (t) {
      i.push(i.shift())
    }
})(a0a, 511799),
  null != cookie3Options?.[a0a4(380)]?.[a0a4(482)]() &&
    (_paq[a0a4(462)]([a0a4(492), 'https://c.staging.cookie3.co/lake']),
    _paq[a0a4(462)]([a0a4(417), cookie3Options[a0a4(380)].toString()]),
    setTimeout(() => {
      const i = a0a4,
        _ = {
          goNhW: i(478),
          Zrjeq: 'Wallet',
          aLzxu: 'setCustomDimension',
          xLaIS: function (e, t) {
            return e === t
          },
          rJEtg: function (e, t) {
            return e === t
          },
          hFEZo: function (e, t) {
            return e != t
          },
          vMvEn: i(491),
          WnkhD: 'argentxwallet',
          jrPwN: i(439),
        }
      class a {
        constructor(e, t) {
          const n = i
          ;(this[n(430)] = null),
            fetch(e)
              [n(376)](e => (this[n(430)] = e))
              [n(429)](() => (this.extension = null)),
            (this.extensionName = t)
        }
      }
      const b = 1,
        c = 2,
        Y = window[i(373)],
        e = window.phantom?.[i(476)],
        $ = window.ic?.[i(432)],
        g = window.tronWeb,
        h = null != Y?.['_metamask'] && Y?.[i(404)],
        j = Y?.[i(427)] === !0,
        k = _[i(394)](window[i(409)]?.[i(507)], i(430)),
        l = e?.[i(467)] === !0,
        m = null != window[i(396)],
        n = Y?.[i(403)] === !0,
        o = Y?.[i(390)] === !0,
        p = window[i(426)]?.[i(503)] === !0,
        q = null != window.liquality,
        r = null != $,
        s = window[i(400)]?.[i(423)](e => e[i(438)] === i(408)),
        t = Y?.[i(452)] === !0,
        u = null != window[i(442)],
        v = _.rJEtg(Y?.[i(459)], !0),
        w = null != window[i(434)],
        x = window[i(443)]?.[i(471)] === !0,
        y = Y?.[i(486)] === !0,
        z = null != window[i(416)],
        A = null != window.cardano?.['nami'],
        B = window[i(455)]?.[i(463)] === !0,
        C = null != window[i(505)],
        D = null != window[i(500)],
        E = null != window[i(488)],
        F = null != window[i(419)],
        G = null != window[i(485)],
        H = null != window[i(435)],
        I = window.aleereum?.[i(414)] === !0,
        J = window[i(465)]?.['name'] === i(496),
        Z = null != window[i(422)],
        L = window[i(484)]?.['isSubWallet'] === !0,
        M = 'ArConnect' === window[i(445)]?.[i(397)],
        N = null != window[i(410)],
        O = window[i(497)]?.[i(392)] === !0,
        P = window.fewcha?.['isFewcha'] === !0,
        Q = window[i(428)]?.[i(425)] === !0,
        R = _[i(490)](window[i(381)]?.['yoroi'], null),
        S =
          null != window[i(411)]?.[i(473)] ||
          window[i(373)]?.['isMathWallet'] === !0 ||
          window[i(498)]?.['isMathWallet'] === !0 ||
          window.solana?.[i(493)] === !0,
        T = null != window[i(450)],
        U = [
          ...(h ? [i(437)] : []),
          ...(j ? [i(424)] : []),
          ...(k ? [i(409)] : []),
          ...(l ? [_[i(407)]] : []),
          ...(m ? [i(495)] : []),
          ...(n ? ['trustwallet'] : []),
          ...(o ? [i(464)] : []),
          ...(p ? [i(385)] : []),
          ...(q ? [i(446)] : []),
          ...(r ? ['plugwallet'] : []),
          ...(s ? [i(412)] : []),
          ...(t ? [i(433)] : []),
          ...(u ? [i(472)] : []),
          ...(v ? ['xdefiwallet'] : []),
          ...(w ? [i(456)] : []),
          ...(x ? [i(384)] : []),
          ...(y ? [i(441)] : []),
          ...(z ? [i(451)] : []),
          ...(A ? [i(393)] : []),
          ...(B ? ['senderwallet'] : []),
          ...(C ? [i(502)] : []),
          ...(D ? [i(406)] : []),
          ...(E ? [i(389)] : []),
          ...(F ? [i(470)] : []),
          ...(G ? [i(499)] : []),
          ...(H ? [_[i(480)]] : []),
          ...(I ? [i(477)] : []),
          ...(J ? ['suietwallet'] : []),
          ...(Z ? [_[i(483)]] : []),
          ...(L ? [i(489)] : []),
          ...(M ? [i(377)] : []),
          ...(N ? [i(402)] : []),
          ...(O ? [i(444)] : []),
          ...(P ? [i(415)] : []),
          ...(Q ? [i(374)] : []),
          ...(R ? [i(474)] : []),
          ...(S ? [i(473)] : []),
          ...(T ? ['cosmostationwallet'] : []),
        ]
      let V = ''
      for (let e = 0; e < U[i(454)]; e++) V += e == U[i(454)] - 1 ? U[e] : U[e] + '|'
      let K = []
      setTimeout(() => {
        const t = i
        if (Y) {
          var n = window?.['web3']?.[t(460)]?.[t(395)]
          null != n && (K[0] = n),
            K && 0 < K[t(454)] && _paq[t(462)]([t(382), b, K[0]]),
            Y.on(t(487), function (e) {
              const n = t
              let i = 0 < e[n(454)] ? e[0] : ''
              _paq[n(462)](['setCustomDimension', b, i]), _paq.push([n(478), n(387), n(383), i])
            }),
            Y.on(t(506), function () {
              const e = t
              _paq[e(462)]([e(382), b, '']), _paq[e(462)]([e(478), e(387), e(431), ''])
            }),
            Y.on(t(375), function (n) {
              const i = t
              i(440) === i(440) ? _paq[i(462)]([_[i(449)], _[i(466)], i(388)]) : (c += Y[e] + '|')
            })
        }
        if (
          (g?.['defaultAddress']?.['base58'] && _paq[t(462)]([t(382), b, g[t(436)].base58]),
          null != $?.[t(413)] && _paq[t(462)]([t(382), b, $?.[t(413)]]),
          _paq[t(462)](['setCustomDimension', c, V]),
          cookie3Options?.['cookielessEnabled'])
        )
          if (t(469) !== t(469)) c[t(462)]([_.aLzxu, Y, e?.[t(413)]])
          else {
            _paq[t(462)]([t(447)])
            var o = localStorage?.[t(494)]('_c_id')
            null == o && ((o = generateUUID()), localStorage?.[t(398)](t(468), o)), _paq[t(462)]([t(379), o])
          }
        _paq.push([t(504)]), _paq.push([t(405)])
      }, i(391))
    }, 200))
function generateUUID() {
  const t = a0a4,
    n = {
      wjRPj: function (e, t) {
        return e | t
      },
    }
  return t(448)[t(458)](/[xy]/g, function (i) {
    const o = t
    if ('SUNgE' === o(421)) {
      var a = n[o(386)](16 * Math[o(479)](), 0),
        r = 'x' == i ? a : 8 | (3 & a)
      return r[o(482)](16)
    }
    ;(this.extension = null),
      a(r)
        [o(376)](e => (this[o(430)] = e))
        [o(429)](() => (this[o(430)] = null)),
      (this[o(501)] = f)
  })
}
function a0a() {
  const e = [
    'mathwallet',
    'yoroiwallet',
    '13520860PtBTem',
    'solana',
    'alewallet',
    'trackEvent',
    'random',
    'WnkhD',
    '24eEPFNv',
    'toString',
    'jrPwN',
    'SubWallet',
    'ethosWallet',
    'isPocketUniverse',
    'accountsChanged',
    'martian',
    'subwallet',
    'hFEZo',
    'phantom',
    'setTrackerUrl',
    'isMathWallet',
    'getItem',
    'cryptocomwallet',
    'Suiet',
    'rise',
    'tronWeb',
    'ethossuiwallet',
    'pontem',
    'extensionName',
    'suiwallet',
    'isTally',
    'enableLinkTracking',
    'suiWallet',
    'disconnect',
    'mode',
    'ethereum',
    'solflarewallet',
    'connect',
    'then',
    'arconnectwallet',
    '2805366IUpMXV',
    'setUserId',
    'siteId',
    'cardano',
    'setCustomDimension',
    'ethAccountsChanged',
    'tronlink',
    'tallyho',
    'wjRPj',
    'Wallet',
    'ethConnect',
    'martianwallet',
    'isCoin98',
    '500',
    'isRise',
    'namiwallet',
    'xLaIS',
    'selectedAddress',
    'deficonnectProvider',
    'walletName',
    'setItem',
    '1629icXNly',
    'fcl_extensions',
    '7kZgLEZ',
    'zkidwallet',
    'isTrust',
    'isMetaMask',
    'trackPageView',
    'pontemaptoswallet',
    'vMvEn',
    'Lilico',
    'keplr',
    'zkid',
    'injectedWeb3',
    'lilicowallet',
    'principalId',
    'isAle',
    'fewchawallet',
    'StacksProvider',
    'setSiteId',
    '2993715fdXtQi',
    'petra',
    '3504465muDKrl',
    'SUNgE',
    'starknet_braavos',
    'some',
    'coinbasewallet',
    'isSolflare',
    'tally',
    'isCoinbaseWallet',
    'solflare',
    'catch',
    'extension',
    'ethDisconnect',
    'plug',
    'rabbywallet',
    'forboleX',
    'starknet_argentX',
    'defaultAddress',
    'metamask',
    'uid',
    'braavoswallet',
    'iCaMp',
    'pocketuniverse',
    'elrondWallet',
    'tron',
    'risewallet',
    'arweaveWallet',
    'liqualitywallet',
    'disableCookies',
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
    'goNhW',
    'cosmostation',
    'hirowallet',
    'isRabby',
    '653215WJekfG',
    'length',
    'near',
    'forbolex',
    '814ynIodT',
    'replace',
    'isXDEFI',
    'currentProvider',
    '1602376BdEfvI',
    'push',
    'isSender',
    'coin98wallet',
    '__suiet__',
    'Zrjeq',
    'isPhantom',
    '_c_id',
    'pamsK',
    'petraaptoswallet',
    'isTronLink',
    'maiarwallet',
  ]
  return (
    (a0a = function () {
      return e
    }),
    a0a()
  )
}
;(function () {
  function e() {
    if ('object' != typeof _paq) return !1
    var e = typeof _paq.length
    return 'undefined' != e && !!_paq.length
  }
  if (window && 'object' == typeof window.matomoPluginAsyncInit && window.matomoPluginAsyncInit.length) {
    var t = 0
    for (t; t < window.matomoPluginAsyncInit.length; t++)
      'function' == typeof window.matomoPluginAsyncInit[t] && window.matomoPluginAsyncInit[t]()
  }
  window && window.piwikAsyncInit && window.piwikAsyncInit(),
    window && window.matomoAsyncInit && window.matomoAsyncInit(),
    window.Matomo.getAsyncTrackers().length ||
      (e()
        ? window.Matomo.addTracker()
        : (_paq = {
            push: function (e) {
              var t = typeof console
              'undefined' != t &&
                console &&
                console.error &&
                console.error(
                  '_paq.push() was used but Matomo tracker was not initialized before the matomo.js file was loaded. Make sure to configure the tracker via _paq.push before loading matomo.js. Alternatively, you can create a tracker via Matomo.addTracker() manually and then use _paq.push but it may not fully work as tracker methods may not be executed in the correct order.',
                  e,
                )
            },
          })),
    window.Matomo.trigger('MatomoInitialized', []),
    (window.Matomo.initialized = !0)
})(),
  (function () {
    var e = typeof window.AnalyticsTracker
    'undefined' == e && (window.AnalyticsTracker = window.Matomo)
  })(),
  'function' != typeof window.piwik_log &&
    (window.piwik_log = function (t, n, e, i) {
      function o(e) {
        try {
          if (window['piwik_' + e]) return window['piwik_' + e]
        } catch (e) {}
      }
      var r,
        s = window.Matomo.getTracker(e, n)
      s.setDocumentTitle(t),
        s.setCustomData(i),
        (r = o('tracker_pause')),
        r && s.setLinkTrackingTimer(r),
        (r = o('download_extensions')),
        r && s.setDownloadExtensions(r),
        (r = o('hosts_alias')),
        r && s.setDomains(r),
        (r = o('ignore_classes')),
        r && s.setIgnoreClasses(r),
        s.trackPageView(),
        o('install_tracker') &&
          ((piwik_track = function (e, t, n, i) {
            s.setSiteId(t), s.setTrackerUrl(n), s.trackLink(e, i)
          }),
          s.enableLinkTracking())
    }) /*!! @license-end */
