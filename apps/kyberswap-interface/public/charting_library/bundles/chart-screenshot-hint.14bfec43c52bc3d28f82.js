;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['chart-screenshot-hint'],
  {
    '+PSo': function (t, e, n) {
      t.exports = {
        container: 'container-2PMGBrHh',
        bottomPadding: 'bottomPadding-2PMGBrHh',
        centerElement: 'centerElement-2PMGBrHh',
        notice: 'notice-2PMGBrHh',
        'notice-showed': 'notice-showed-2PMGBrHh',
      }
    },
    '/f/q': function (t, e, n) {},
    ByBs: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9" width="9" height="9"><path stroke="currentColor" stroke-width="1.2" d="M1 1l7 7m0-7L1 8"/></svg>'
    },
    Iivm: function (t, e, n) {
      'use strict'
      var o = n('q1tI')
      const s = o.forwardRef((t, e) => {
        const { icon: n = '', ...s } = t
        return o.createElement('span', { ...s, ref: e, dangerouslySetInnerHTML: { __html: n } })
      })
      n.d(e, 'a', function () {
        return s
      })
    },
    K5qS: function (t) {
      t.exports = JSON.parse(
        '{"container":"container-9ckn123c","container-danger":"container-danger-3U4WdGto","icon":"icon-2ZK1Y3zH","header":"header-287NeSeQ","container-warning":"container-warning-1jkRTadj","container-success":"container-success-2srhYBbo","container-default":"container-default-2MDEpAUG","text-wrap":"text-wrap-26IUyzzc","close-button":"close-button-2LkcSirN"}',
      )
    },
    KkTf: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" width="17" height="17"><path stroke="currentColor" stroke-width="1.2" d="M1 1l15 15m0-15L1 16"/></svg>'
    },
    LeKP: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 11" width="11" height="11"><path stroke="currentColor" stroke-width="1.2" d="M1 1l9 9m0-9l-9 9"/></svg>'
    },
    N9IK: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" width="23" height="23"><path stroke="currentColor" stroke-width="1.2" d="M1 1l21 21m0-21L1 22"/></svg>'
    },
    SJs6: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" fill-rule="evenodd" d="M9 0a9 9 0 1 0 0 18A9 9 0 0 0 9 0zm4.15 5.87a.75.75 0 0 0-1.3-.74l-3.51 6.15-2.31-2.31a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.18-.16l4-7z"/></svg>'
    },
    USSy: function (t, e, n) {
      'use strict'
      n.r(e)
      var o = n('q1tI'),
        s = n.n(o),
        r = n('i8i4'),
        i = n('hbEN'),
        c = n('TSYQ'),
        a = n('Iivm'),
        l = n('N9IK'),
        h = n('KkTf'),
        u = n('zvJH'),
        w = n('LeKP'),
        d = n('ByBs'),
        m = n('yMrP')
      n('wk5D')
      function g(t = 'l') {
        switch (t) {
          case 'l':
            return l
          case 'm':
            return h
          case 's':
            return u
          case 'xs':
            return w
          case 'xxs':
            return d
          default:
            return h
        }
      }
      const p = o.forwardRef((t, e) => {
        const { className: n, size: s, ...r } = t,
          i = c(m['close-button'], m['button-' + s], n)
        return o.createElement(
          'button',
          { ...r, type: 'button', className: i, ref: e },
          o.createElement(a.a, { icon: g(s), className: m['close-icon'] }),
        )
      })
      var v = n('ZZTB'),
        f = n('c6oV'),
        x = n('SJs6'),
        b = n('K5qS')
      n('/f/q')
      const B = { danger: v, warning: v, success: x, default: f }
      function k(t) {
        const {
          informerIntent: e,
          content: n,
          className: s,
          header: r,
          isIconShown: i = !0,
          isCloseButtonShown: l,
          icon: h,
          onCloseClick: u,
          closeButtonLabel: w = 'Close',
        } = t
        return o.createElement(
          'div',
          { className: c(b.container, b['container-' + e], s) },
          i && o.createElement(a.a, { className: b.icon, icon: null != h ? h : B[e] }),
          o.createElement(
            'div',
            { className: b['text-wrap'] },
            o.createElement(
              'span',
              {
                className: b.header,
              },
              r,
            ),
            ' ',
            n,
          ),
          l && o.createElement(p, { 'aria-label': w, onClick: u, className: b['close-button'], size: 'xs' }),
        )
      }
      var M = n('+PSo')
      function P(t) {
        const [e, n] = Object(o.useState)(!1)
        return (
          Object(o.useLayoutEffect)(() => {
            const t = setTimeout(() => n(!0), 50),
              e = setTimeout(() => n(!1), 2500)
            return () => {
              clearTimeout(t), clearTimeout(e)
            }
          }, []),
          s.a.createElement(
            'div',
            { className: c(M.container, t.bottomPadding && M.bottomPadding) },
            s.a.createElement(
              'div',
              { className: M.centerElement },
              s.a.createElement(k, {
                content: t.text,
                informerIntent: 'success',
                className: c(M.notice, e && M['notice-showed']),
              }),
            ),
          )
        )
      }
      n.d(e, 'ChartScreenshotHintRenderer', function () {
        return E
      })
      class E {
        constructor(t, e) {
          ;(this._showed = !1),
            (this._wrap = document.createElement('div')),
            (this._container = t),
            (this._debouncedHide = Object(i.default)(() => this.hide(), 3e3)),
            (this._bottomPadding = e.bottomPadding)
        }
        show(t) {
          this._wrap &&
            !this._showed &&
            ((this._showed = !0),
            this._container.append(this._wrap),
            r.render(o.createElement(P, { text: t, bottomPadding: this._bottomPadding }), this._wrap),
            this._debouncedHide())
        }
        hide() {
          this._wrap && ((this._showed = !1), r.unmountComponentAtNode(this._wrap), this._wrap.remove())
        }
        destroy() {
          this.hide(), delete this._wrap
        }
      }
    },
    ZZTB: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 0a9 9 0 1 0 0 18A9 9 0 0 0 9 0zM7.75 5.48a1.27 1.27 0 1 1 2.5 0l-.67 4.03a.59.59 0 0 1-1.16 0l-.67-4.03zM8 13a1 1 0 1 1 2 0 1 1 0 0 1-2 0z"/></svg>'
    },
    c6oV: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18"><path fill="currentColor" d="M9 0a9 9 0 1 0 0 18A9 9 0 0 0 9 0zm1 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM9 8a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1z"/></svg>'
    },
    wk5D: function (t, e, n) {},
    yMrP: function (t) {
      t.exports = JSON.parse(
        '{"close-button":"close-button-1WFSq2PU","close-icon":"close-icon-3unB1Yrw","button-l":"button-l-uIo2rThA","button-m":"button-m-3MMteafV","button-s":"button-s-Nv9EL6Kl","button-xs":"button-xs-3f-PiL7F","button-xxs":"button-xxs-1ElYVuPk"}',
      )
    },
    zvJH: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 13" width="13" height="13"><path stroke="currentColor" stroke-width="1.2" d="M1 1l11 11m0-11L1 12"/></svg>'
    },
  },
])
