;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['lollipop-tooltip-renderer'],
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
        c = n('AiMB'),
        l = n('DTHj'),
        s = n('X0gx'),
        u = n('8Rai')
      function d(e) {
        const {
            controller: t,
            children: n,
            isOpened: a,
            closeOnClickOutside: d = !0,
            doNotCloseOn: m,
            onClickOutside: p,
            onClose: f,
            ...v
          } = e,
          b = Object(o.useContext)(s.a),
          h = Object(u.a)({
            handler: function (e) {
              p && p(e)
              if (!d) return
              if (m && e.target instanceof Node) {
                const t = i.a.findDOMNode(m)
                if (t instanceof Node && t.contains(e.target)) return
              }
              f()
            },
            mouseDown: !0,
            touchStart: !0,
          })
        return a
          ? r.a.createElement(
              c.a,
              { top: '0', left: '0', right: '0', bottom: '0', pointerEvents: 'none' },
              r.a.createElement(
                'span',
                { ref: h, style: { pointerEvents: 'auto' } },
                r.a.createElement(
                  l.b,
                  {
                    ...v,
                    onClose: f,
                    onScroll: function (t) {
                      const { onScroll: n } = e
                      n && n(t)
                    },
                    customCloseDelegate: b,
                    ref: t,
                  },
                  n,
                ),
              ),
            )
          : null
      }
    },
    GwmT: function (e, t, n) {
      e.exports = {
        titleWrapper: 'titleWrapper-SNaRagqV',
        title: 'title-SNaRagqV',
        subtitle: 'subtitle-SNaRagqV',
        text: 'text-SNaRagqV',
        icon: 'icon-SNaRagqV',
        group: 'group-SNaRagqV',
        groupTitle: 'groupTitle-SNaRagqV',
        groupRow: 'groupRow-SNaRagqV',
      }
    },
    R5JZ: function (e, t, n) {
      'use strict'
      function o(e, t, n, o, r) {
        function a(r) {
          if (e > r.timeStamp) return
          const a = r.target
          void 0 !== n && null !== t && null !== a && a.ownerDocument === o && (t.contains(a) || n(r))
        }
        return (
          r.click && o.addEventListener('click', a, !1),
          r.mouseDown && o.addEventListener('mousedown', a, !1),
          r.touchEnd && o.addEventListener('touchend', a, !1),
          r.touchStart && o.addEventListener('touchstart', a, !1),
          () => {
            o.removeEventListener('click', a, !1),
              o.removeEventListener('mousedown', a, !1),
              o.removeEventListener('touchend', a, !1),
              o.removeEventListener('touchstart', a, !1)
          }
        )
      }
      n.d(t, 'a', function () {
        return o
      })
    },
    Sn4D: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return f
      })
      var o = n('q1tI'),
        r = n.n(o),
        a = n('Eyy1'),
        i = n('TSYQ'),
        c = n('x0D+'),
        l = n('0YpW'),
        s = n('AiMB'),
        u = n('mkWe'),
        d = n('qFKp'),
        m = n('X0gx'),
        p = n('sHQ4')
      function f(e) {
        const { position: t = 'Bottom', onClose: n, children: f, className: v, theme: b = p } = e,
          h = Object(a.ensureNotNull)(Object(o.useContext)(u.a)),
          [g, w] = Object(o.useState)(0),
          E = Object(o.useRef)(null),
          y = Object(o.useContext)(m.a)
        return (
          Object(o.useEffect)(() => {
            const e = Object(a.ensureNotNull)(E.current)
            return (
              e.focus({ preventScroll: !0 }),
              y.subscribe(h, n),
              Object(l.a)(!0),
              d.CheckMobile.iOS() && Object(c.disableBodyScroll)(e),
              w(h.addDrawer()),
              () => {
                y.unsubscribe(h, n)
                const t = h.removeDrawer()
                d.CheckMobile.iOS() && Object(c.enableBodyScroll)(e), 0 === t && Object(l.a)(!1)
              }
            )
          }, []),
          r.a.createElement(
            s.a,
            null,
            r.a.createElement(
              'div',
              { className: i(p.wrap, p['position' + t]) },
              g === h.currentDrawer && r.a.createElement('div', { className: p.backdrop, onClick: n }),
              r.a.createElement(
                'div',
                {
                  className: i(p.drawer, b.drawer, p['position' + t], v),
                  ref: E,
                  tabIndex: -1,
                  'data-name': e['data-name'],
                },
                f,
              ),
            ),
          )
        )
      }
    },
    Wpff: function (e, t, n) {
      e.exports = {
        drawer: 'drawer-1QFSt-Zu',
        drawerItem: 'drawerItem-1QFSt-Zu',
        title: 'title-1QFSt-Zu',
        subtitle: 'subtitle-1QFSt-Zu',
        text: 'text-1QFSt-Zu',
        menuWrap: 'menuWrap-1QFSt-Zu',
        menuBox: 'menuBox-1QFSt-Zu',
        card: 'card-1QFSt-Zu',
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
    nPPD: function (e, t, n) {
      'use strict'
      function o(e, t, n = {}) {
        const o = Object.assign({}, t)
        for (const r of Object.keys(t)) {
          const a = n[r] || r
          a in e && (o[r] = [e[a], t[r]].join(' '))
        }
        return o
      }
      function r(e, t, n = {}) {
        return Object.assign({}, e, o(e, t, n))
      }
      n.d(t, 'b', function () {
        return o
      }),
        n.d(t, 'a', function () {
          return r
        })
    },
    qKHM: function (e, t, n) {
      'use strict'
      n.r(t)
      var o = n('q1tI'),
        r = n.n(o),
        a = n('i8i4'),
        i = n('Eyy1'),
        c = n('/KDZ'),
        l = n('Sn4D'),
        s = n('mkWe'),
        u = n('9dlw'),
        d = n('/3z9'),
        m = n('tWVy'),
        p = n('ogJP')
      const f = Object(o.forwardRef)((e, t) => {
        const { onClose: n, onForceClose: a, onClickOutside: i, customCloseSubscriptions: c = [], ...l } = e,
          s = Object(o.useRef)(null),
          f = Object(o.useCallback)(
            e => {
              27 === Object(d.hashFromEvent)(e) && a()
            },
            [a],
          ),
          v = Object(o.useCallback)(() => {
            Object(m.b)(), a()
          }, [a]),
          b = Object(o.useCallback)(() => {
            s.current && s.current.focus({ preventScroll: !0 })
          }, [])
        return (
          Object(o.useEffect)(() => {
            const e = ((t = v), window.addEventListener('scroll', t), () => window.removeEventListener('scroll', t))
            var t
            const n =
              c &&
              (function (e, t) {
                for (const n of e) n.subscribe(null, t)
                return () => {
                  for (const n of e) n.unsubscribe(null, t)
                }
              })(c, v)
            return () => {
              e(), Object(p.isFunction)(n) && n()
            }
          }, [c, v]),
          r.a.createElement(
            u.a,
            {
              isOpened: !0,
              tabIndex: -1,
              reference: e => {
                'function' == typeof t ? t(e) : Object(p.isObject)(t) && (t.current = e), (s.current = e)
              },
              onClose: n,
              onClickOutside: i,
              onKeyDown: f,
              onOpen: b,
              ...l,
            },
            e.children,
          )
        )
      })
      var v = n('nPPD'),
        b = n('DTHj'),
        h = n('Iivm'),
        g = n('GwmT')
      const w = g
      function E(e, t) {
        return r.a.createElement(
          'div',
          { key: e.name, className: t.groupRow, style: e.style },
          r.a.createElement('span', { className: t.text }, e.name),
          r.a.createElement('span', { className: t.text }, e.value),
        )
      }
      function y(e) {
        var t
        const { content: n = [], subTitle: o, theme: a = g } = e,
          i = n.map(e =>
            r.a.createElement(
              'div',
              { key: `${e.title}:${e.content.length}`, className: a.group },
              e.title && r.a.createElement('span', { className: a.groupTitle }, e.title),
              e.content.map(e => E(e, a)),
            ),
          ),
          c = 'string' == typeof o ? o : o.map(e => E(e, a))
        return r.a.createElement(
          r.a.Fragment,
          null,
          r.a.createElement(
            'div',
            { className: a.titleWrapper },
            e.tooltipIcon &&
              r.a.createElement(h.a, {
                icon: e.tooltipIcon,
                className: a.icon,
                style: { color: null === (t = e.style) || void 0 === t ? void 0 : t.color },
              }),
            r.a.createElement('span', { className: a.title }, e.title),
          ),
          r.a.createElement('span', { className: a.subtitle }, c),
          i.length > 0 && r.a.createElement('div', { className: a.contentWrapper }, i),
        )
      }
      var O = n('Wpff')
      const C = Object(v.a)(b.a, { menuWrap: O.menuWrap, menuBox: O.menuBox }),
        S = Object(v.a)(w, { title: O.title, subtitle: O.subtitle, text: O.text })
      function j(e) {
        const {
          tooltips: t,
          onClose: n,
          onForceClose: o,
          onClickOutside: a,
          position: i,
          customCloseSubscriptions: u,
        } = e
        return r.a.createElement(
          s.b,
          null,
          r.a.createElement(c.a, { rule: 'screen and (max-width: 419px)' }, e =>
            e
              ? r.a.createElement(
                  l.a,
                  { className: O.drawer, onClose: o || n, position: 'Bottom' },
                  t.map(e =>
                    r.a.createElement(
                      'div',
                      { key: `${e.title}:${e.subTitle}`, className: O.drawerItem },
                      r.a.createElement(y, { theme: S, ...e }),
                    ),
                  ),
                )
              : r.a.createElement(
                  f,
                  {
                    position: i,
                    theme: C,
                    onClose: n,
                    onForceClose: o || n,
                    onClickOutside: a,
                    customCloseSubscriptions: u,
                  },
                  t.map(e => {
                    var t
                    return r.a.createElement(
                      'div',
                      {
                        key: `${e.title}:${e.subTitle}`,
                        className: O.card,
                        style: { borderColor: null === (t = e.style) || void 0 === t ? void 0 : t.color },
                      },
                      r.a.createElement(y, { ...e }),
                    )
                  }),
                ),
          ),
        )
      }
      n.d(t, 'showLollipopTooltip', function () {
        return k
      })
      let N = null
      function k(e) {
        if (!e.items.length) return
        const t = {
          tooltips: e.items,
          onClose: D,
          onForceClose: () => {
            D(), 'function' == typeof e.onCustomClose && e.onCustomClose()
          },
          onClickOutside: e.onClickOutside,
          position: x.bind(null, e.position),
          customCloseSubscriptions: e.customCloseSubscriptions,
        }
        null === N && ((N = document.createElement('div')), document.body.appendChild(N)),
          a.render(o.createElement(j, { ...t }), N)
      }
      function D() {
        null !== N && (a.unmountComponentAtNode(N), N.remove(), (N = null))
      }
      function x(e, t, n) {
        const o = Object(i.ensureNotNull)(e.target.closest('.chart-container')),
          r = o.getBoundingClientRect(),
          a = Object(i.ensureNotNull)(o.parentElement).getBoundingClientRect(),
          c = (e.left + e.right) / 2,
          l = Math.round(c - t / 2),
          s = Math.min(l + t, r.right, a.right)
        let u = Math.max(s - t, r.left, a.left)
        return u + t >= a.right && (u = a.right - t), { x: u, y: e.top - n }
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
                c = -1,
                l = void 0,
                s = void 0,
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
                    void 0 !== s && ((document.body.style.paddingRight = s), (s = void 0)),
                      void 0 !== l && ((document.body.style.overflow = l), (l = void 0))
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
                        1 === e.targetTouches.length && (c = e.targetTouches[0].clientY)
                      }),
                      (e.ontouchmove = function (t) {
                        var n, o, r, a
                        1 === t.targetTouches.length &&
                          ((o = e),
                          (a = (n = t).targetTouches[0].clientY - c),
                          !u(n.target) &&
                            ((o && 0 === o.scrollTop && 0 < a) ||
                            ((r = o) && r.scrollHeight - r.scrollTop <= r.clientHeight && a < 0)
                              ? d(n)
                              : n.stopPropagation()))
                      }),
                      i || (document.addEventListener('touchmove', d, n ? { passive: !1 } : void 0), (i = !0))
                  }
                } else {
                  ;(f = o),
                    setTimeout(function () {
                      if (void 0 === s) {
                        var e = !!f && !0 === f.reserveScrollBarGap,
                          t = window.innerWidth - document.documentElement.clientWidth
                        e &&
                          0 < t &&
                          ((s = document.body.style.paddingRight), (document.body.style.paddingRight = t + 'px'))
                      }
                      void 0 === l && ((l = document.body.style.overflow), (document.body.style.overflow = 'hidden'))
                    })
                  var p = { targetElement: e, options: o || {} }
                  a = [].concat(t(a), [p])
                }
                var f
              }),
                (e.clearAllBodyScrollLocks = function () {
                  r
                    ? (a.forEach(function (e) {
                        ;(e.targetElement.ontouchstart = null), (e.targetElement.ontouchmove = null)
                      }),
                      i && (document.removeEventListener('touchmove', d, n ? { passive: !1 } : void 0), (i = !1)),
                      (a = []),
                      (c = -1))
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
