;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['full-tooltips-popup'],
  {
    '9dlw': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return d
      })
      var o = n('q1tI'),
        r = n.n(o),
        a = n('i8i4'),
        i = n.n(a),
        l = n('AiMB'),
        s = n('DTHj'),
        c = n('X0gx'),
        u = n('8Rai')
      function d(e) {
        const {
            controller: t,
            children: n,
            isOpened: a,
            closeOnClickOutside: d = !0,
            doNotCloseOn: m,
            onClickOutside: p,
            onClose: v,
            ...f
          } = e,
          h = Object(o.useContext)(c.a),
          g = Object(u.a)({
            handler: function (e) {
              p && p(e)
              if (!d) return
              if (m && e.target instanceof Node) {
                const t = i.a.findDOMNode(m)
                if (t instanceof Node && t.contains(e.target)) return
              }
              v()
            },
            mouseDown: !0,
            touchStart: !0,
          })
        return a
          ? r.a.createElement(
              l.a,
              { top: '0', left: '0', right: '0', bottom: '0', pointerEvents: 'none' },
              r.a.createElement(
                'span',
                { ref: g, style: { pointerEvents: 'auto' } },
                r.a.createElement(
                  s.b,
                  {
                    ...f,
                    onClose: v,
                    onScroll: function (t) {
                      const { onScroll: n } = e
                      n && n(t)
                    },
                    customCloseDelegate: h,
                    ref: t,
                  },
                  n,
                ),
              ),
            )
          : null
      }
    },
    Sn4D: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return v
      })
      var o = n('q1tI'),
        r = n.n(o),
        a = n('Eyy1'),
        i = n('TSYQ'),
        l = n('x0D+'),
        s = n('0YpW'),
        c = n('AiMB'),
        u = n('mkWe'),
        d = n('qFKp'),
        m = n('X0gx'),
        p = n('sHQ4')
      function v(e) {
        const { position: t = 'Bottom', onClose: n, children: v, className: f, theme: h = p } = e,
          g = Object(a.ensureNotNull)(Object(o.useContext)(u.a)),
          [b, w] = Object(o.useState)(0),
          y = Object(o.useRef)(null),
          E = Object(o.useContext)(m.a)
        return (
          Object(o.useEffect)(() => {
            const e = Object(a.ensureNotNull)(y.current)
            return (
              e.focus({ preventScroll: !0 }),
              E.subscribe(g, n),
              Object(s.a)(!0),
              d.CheckMobile.iOS() && Object(l.disableBodyScroll)(e),
              w(g.addDrawer()),
              () => {
                E.unsubscribe(g, n)
                const t = g.removeDrawer()
                d.CheckMobile.iOS() && Object(l.enableBodyScroll)(e), 0 === t && Object(s.a)(!1)
              }
            )
          }, []),
          r.a.createElement(
            c.a,
            null,
            r.a.createElement(
              'div',
              { className: i(p.wrap, p['position' + t]) },
              b === g.currentDrawer && r.a.createElement('div', { className: p.backdrop, onClick: n }),
              r.a.createElement(
                'div',
                {
                  className: i(p.drawer, h.drawer, p['position' + t], f),
                  ref: y,
                  tabIndex: -1,
                  'data-name': e['data-name'],
                },
                v,
              ),
            ),
          )
        )
      }
    },
    mkWe: function (e, t, n) {
      'use strict'
      n.d(t, 'b', function () {
        return a
      }),
        n.d(t, 'a', function () {
          return i
        })
      var o = n('q1tI'),
        r = n.n(o)
      class a extends r.a.PureComponent {
        constructor(e) {
          super(e),
            (this._addDrawer = () => {
              const e = this.state.currentDrawer + 1
              return this.setState({ currentDrawer: e }), e
            }),
            (this._removeDrawer = () => {
              const e = this.state.currentDrawer - 1
              return this.setState({ currentDrawer: e }), e
            }),
            (this.state = { currentDrawer: 0 })
        }
        render() {
          return r.a.createElement(
            i.Provider,
            {
              value: {
                addDrawer: this._addDrawer,
                removeDrawer: this._removeDrawer,
                currentDrawer: this.state.currentDrawer,
              },
            },
            this.props.children,
          )
        }
      }
      const i = r.a.createContext(null)
    },
    my4O: function (e, t, n) {
      e.exports = {
        'css-value-small-size': '18px',
        'css-value-border-radius-small-size': '9px',
        'css-value-large-size': '22px',
        'css-value-border-radius-large-size': '11px',
        popupWidget: 'popupWidget-1LnizAbt',
        desc: 'desc-1LnizAbt',
        icon: 'icon-1LnizAbt',
        small: 'small-1LnizAbt',
        large: 'large-1LnizAbt',
        title: 'title-1LnizAbt',
        text: 'text-1LnizAbt',
        action: 'action-1LnizAbt',
        additionalWidget: 'additionalWidget-1LnizAbt',
      }
    },
    sHQ4: function (e, t, n) {
      e.exports = {
        wrap: 'wrap-164vy-kj',
        positionBottom: 'positionBottom-164vy-kj',
        backdrop: 'backdrop-164vy-kj',
        drawer: 'drawer-164vy-kj',
        positionLeft: 'positionLeft-164vy-kj',
      }
    },
    'vR7+': function (e, t, n) {
      'use strict'
      n.r(t)
      var o = n('q1tI'),
        r = n.n(o),
        a = n('i8i4'),
        i = (n('YFKU'), n('9dlw')),
        l = n('/KDZ'),
        s = n('Sn4D'),
        c = n('mkWe'),
        u = n('e3/o'),
        d = n('TSYQ'),
        m = n('Eyy1'),
        p = n('Iivm'),
        v = n('vqb8'),
        f = n('my4O')
      const h = new WeakMap(),
        g = new WeakMap()
      function b(e) {
        const t = Object(v.a)({ watchedValue: e.info })
        if (null === t) return null
        const n = t.map(t => {
          const { title: n, titleColor: o, icon: a, iconClassName: i, html: l, action: s, size: c } = t
          h.has(t) || h.set(t, Object(u.randomHash)())
          let v = []
          return (
            void 0 !== e.additionalWidgets &&
              (v = e.additionalWidgets.map(
                e => (
                  g.has(e) || g.set(e, Object(u.randomHash)()),
                  e.renderer(Object(m.ensureDefined)(g.get(e)), f.additionalWidget)
                ),
              )),
            r.a.createElement(
              'div',
              { key: h.get(t), className: f.popupWidget },
              r.a.createElement(p.a, { className: d(f.icon, i, f[c]), icon: a || void 0 }),
              r.a.createElement(
                'div',
                { className: f.desc },
                r.a.createElement('span', { style: { color: o || void 0 }, className: d(f.title, f[c]) }, n),
                l &&
                  r.a.createElement('p', {
                    className: d(f.text, f[c]),
                    dangerouslySetInnerHTML: { __html: l.join(' ') },
                  }),
                s &&
                  r.a.createElement(
                    'span',
                    {
                      className: d(s.tooltip && 'apply-common-tooltip', f.action, f[c]),
                      onClick: () => {
                        e.onClose(), null == s || s.onClick()
                      },
                      title: s.tooltip,
                    },
                    s.text,
                  ),
                v,
              ),
            )
          )
        })
        return r.a.createElement(r.a.Fragment, null, n)
      }
      const w = new WeakMap()
      function y(e) {
        const { statusWidgetInfos: t } = e,
          n = t
            .filter(e => e.visible.value())
            .map(
              t => (
                w.has(t) || w.set(t, Object(u.randomHash)()),
                r.a.createElement(b, {
                  key: w.get(t),
                  info: t.model.fullInfo(),
                  onClose: e.onClose,
                  additionalWidgets: t.additionalWidgets,
                })
              ),
            )
        return r.a.createElement(
          c.b,
          null,
          r.a.createElement(l.a, { rule: 'screen and (max-width: 428px)' }, t =>
            t
              ? r.a.createElement(s.a, { onClose: e.onClose, position: 'Bottom' }, n)
              : r.a.createElement(
                  i.a,
                  { isOpened: !0, onClose: e.onClose, position: e.position, doNotCloseOn: e.rendererButton },
                  n,
                ),
          ),
        )
      }
      function E(e, t, n, r, i, l) {
        const s = { rendererButton: n, position: l, statusWidgetInfos: r, onClose: i }
        e ? a.render(o.createElement(y, { ...s }), t) : a.unmountComponentAtNode(t)
      }
      n.d(t, 'render', function () {
        return E
      })
    },
    'x0D+': function (e, t, n) {
      var o, r, a
      ;(r = [t]),
        void 0 ===
          (a =
            'function' ==
            typeof (o = function (e) {
              'use strict'
              function t(e) {
                if (Array.isArray(e)) {
                  for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t]
                  return n
                }
                return Array.from(e)
              }
              Object.defineProperty(e, '__esModule', { value: !0 })
              var n = !1
              if ('undefined' != typeof window) {
                var o = {
                  get passive() {
                    n = !0
                  },
                }
                window.addEventListener('testPassive', null, o), window.removeEventListener('testPassive', null, o)
              }
              var r =
                  'undefined' != typeof window &&
                  window.navigator &&
                  window.navigator.platform &&
                  /iP(ad|hone|od)/.test(window.navigator.platform),
                a = [],
                i = !1,
                l = -1,
                s = void 0,
                c = void 0,
                u = function (e) {
                  return a.some(function (t) {
                    return !(!t.options.allowTouchMove || !t.options.allowTouchMove(e))
                  })
                },
                d = function (e) {
                  var t = e || window.event
                  return !!u(t.target) || 1 < t.touches.length || (t.preventDefault && t.preventDefault(), !1)
                },
                m = function () {
                  setTimeout(function () {
                    void 0 !== c && ((document.body.style.paddingRight = c), (c = void 0)),
                      void 0 !== s && ((document.body.style.overflow = s), (s = void 0))
                  })
                }
              ;(e.disableBodyScroll = function (e, o) {
                if (r) {
                  if (!e)
                    return void console.error(
                      'disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.',
                    )
                  if (
                    e &&
                    !a.some(function (t) {
                      return t.targetElement === e
                    })
                  ) {
                    var m = { targetElement: e, options: o || {} }
                    ;(a = [].concat(t(a), [m])),
                      (e.ontouchstart = function (e) {
                        1 === e.targetTouches.length && (l = e.targetTouches[0].clientY)
                      }),
                      (e.ontouchmove = function (t) {
                        var n, o, r, a
                        1 === t.targetTouches.length &&
                          ((o = e),
                          (a = (n = t).targetTouches[0].clientY - l),
                          !u(n.target) &&
                            ((o && 0 === o.scrollTop && 0 < a) ||
                            ((r = o) && r.scrollHeight - r.scrollTop <= r.clientHeight && a < 0)
                              ? d(n)
                              : n.stopPropagation()))
                      }),
                      i || (document.addEventListener('touchmove', d, n ? { passive: !1 } : void 0), (i = !0))
                  }
                } else {
                  ;(v = o),
                    setTimeout(function () {
                      if (void 0 === c) {
                        var e = !!v && !0 === v.reserveScrollBarGap,
                          t = window.innerWidth - document.documentElement.clientWidth
                        e &&
                          0 < t &&
                          ((c = document.body.style.paddingRight), (document.body.style.paddingRight = t + 'px'))
                      }
                      void 0 === s && ((s = document.body.style.overflow), (document.body.style.overflow = 'hidden'))
                    })
                  var p = { targetElement: e, options: o || {} }
                  a = [].concat(t(a), [p])
                }
                var v
              }),
                (e.clearAllBodyScrollLocks = function () {
                  r
                    ? (a.forEach(function (e) {
                        ;(e.targetElement.ontouchstart = null), (e.targetElement.ontouchmove = null)
                      }),
                      i && (document.removeEventListener('touchmove', d, n ? { passive: !1 } : void 0), (i = !1)),
                      (a = []),
                      (l = -1))
                    : (m(), (a = []))
                }),
                (e.enableBodyScroll = function (e) {
                  if (r) {
                    if (!e)
                      return void console.error(
                        'enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.',
                      )
                    ;(e.ontouchstart = null),
                      (e.ontouchmove = null),
                      (a = a.filter(function (t) {
                        return t.targetElement !== e
                      })),
                      i &&
                        0 === a.length &&
                        (document.removeEventListener('touchmove', d, n ? { passive: !1 } : void 0), (i = !1))
                  } else
                    1 === a.length && a[0].targetElement === e
                      ? (m(), (a = []))
                      : (a = a.filter(function (t) {
                          return t.targetElement !== e
                        }))
                })
            })
              ? o.apply(t, r)
              : o) || (e.exports = a)
    },
  },
])
