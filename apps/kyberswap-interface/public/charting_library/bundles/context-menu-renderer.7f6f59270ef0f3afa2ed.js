;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['context-menu-renderer'],
  {
    F0Qt: function (e) {
      e.exports = JSON.parse(
        '{"wrapper":"wrapper-21v50zE8","input":"input-24iGIobO","box":"box-3574HVnv","icon":"icon-2jsUbtec","noOutline":"noOutline-3VoWuntz","intent-danger":"intent-danger-1Sr9dowC","check":"check-382c8Fu1","dot":"dot-3gRd-7Qt"}',
      )
    },
    'P4l+': function (e, t, n) {},
    R5JZ: function (e, t, n) {
      'use strict'
      function o(e, t, n, o, r) {
        function i(r) {
          if (e > r.timeStamp) return
          const i = r.target
          void 0 !== n && null !== t && null !== i && i.ownerDocument === o && (t.contains(i) || n(r))
        }
        return (
          r.click && o.addEventListener('click', i, !1),
          r.mouseDown && o.addEventListener('mousedown', i, !1),
          r.touchEnd && o.addEventListener('touchend', i, !1),
          r.touchStart && o.addEventListener('touchstart', i, !1),
          () => {
            o.removeEventListener('click', i, !1),
              o.removeEventListener('mousedown', i, !1),
              o.removeEventListener('touchend', i, !1),
              o.removeEventListener('touchstart', i, !1)
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
        return m
      })
      var o = n('q1tI'),
        r = n.n(o),
        i = n('Eyy1'),
        s = n('TSYQ'),
        c = n('x0D+'),
        a = n('0YpW'),
        l = n('AiMB'),
        u = n('mkWe'),
        d = n('qFKp'),
        h = n('X0gx'),
        v = n('sHQ4')
      function m(e) {
        const { position: t = 'Bottom', onClose: n, children: m, className: f, theme: p = v } = e,
          w = Object(i.ensureNotNull)(Object(o.useContext)(u.a)),
          [g, b] = Object(o.useState)(0),
          E = Object(o.useRef)(null),
          y = Object(o.useContext)(h.a)
        return (
          Object(o.useEffect)(() => {
            const e = Object(i.ensureNotNull)(E.current)
            return (
              e.focus({ preventScroll: !0 }),
              y.subscribe(w, n),
              Object(a.a)(!0),
              d.CheckMobile.iOS() && Object(c.disableBodyScroll)(e),
              b(w.addDrawer()),
              () => {
                y.unsubscribe(w, n)
                const t = w.removeDrawer()
                d.CheckMobile.iOS() && Object(c.enableBodyScroll)(e), 0 === t && Object(a.a)(!1)
              }
            )
          }, []),
          r.a.createElement(
            l.a,
            null,
            r.a.createElement(
              'div',
              { className: s(v.wrap, v['position' + t]) },
              g === w.currentDrawer && r.a.createElement('div', { className: v.backdrop, onClick: n }),
              r.a.createElement(
                'div',
                {
                  className: s(v.drawer, p.drawer, v['position' + t], f),
                  ref: E,
                  tabIndex: -1,
                  'data-name': e['data-name'],
                },
                m,
              ),
            ),
          )
        )
      }
    },
    XfUw: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none"><path stroke="currentColor" d="M9 2.13l1.903 3.855.116.236.26.038 4.255.618-3.079 3.001-.188.184.044.259.727 4.237-3.805-2L9 12.434l-.233.122-3.805 2.001.727-4.237.044-.26-.188-.183-3.079-3.001 4.255-.618.26-.038.116-.236L9 2.13z"/></svg>'
    },
    cbq4: function (e, t, n) {
      'use strict'
      n.r(t),
        n.d(t, 'ContextMenuRenderer', function () {
          return a
        })
      var o = n('q1tI'),
        r = n('i8i4'),
        i = n('xRqE'),
        s = n('Ialn'),
        c = n('+EG+')
      class a {
        constructor(e, t, n, r) {
          ;(this._root = document.createElement('div')),
            (this._isShown = !1),
            (this._manager = null),
            (this._props = {
              isOpened: !1,
              items: e,
              position: { x: 0, y: 0 },
              menuStatName: t.statName,
              mode: t.mode,
              'data-name': t['data-name'],
            }),
            (this._onDestroy = n),
            (this._onShow = r),
            (this._activeElement = document.activeElement),
            (this._returnFocus = t.returnFocus),
            (this._takeFocus = t.takeFocus),
            (this._menuElementRef = o.createRef()),
            t.manager && (this._manager = t.manager)
        }
        show(e, t, n) {
          this._onShow && this._onShow(),
            (this._isShown = !0),
            this._render({
              ...this._props,
              position: (t, o) => {
                'function' == typeof e && (e = e(t, o)),
                  e.touches &&
                    e.touches.length > 0 &&
                    (e = { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })
                return {
                  x: !n && Object(s.isRtl)() ? e.clientX - t : e.clientX,
                  y: e.clientY,
                  overrideHeight: e.overrideHeight,
                }
              },
              isOpened: !0,
              onClose: () => {
                this.hide(), this.destroy()
              },
              doNotCloseOn: t,
              takeFocus: this._takeFocus,
              menuElementReference: this._menuElementRef,
            })
        }
        hide() {
          ;(this._isShown = !1), this._render({ ...this._props, isOpened: !1 })
        }
        isShown() {
          return this._isShown
        }
        destroy() {
          ;(this._isShown = !1),
            r.unmountComponentAtNode(this._root),
            this._onDestroy && this._onDestroy(),
            this._returnFocus &&
              this._activeElement instanceof HTMLElement &&
              this._activeElement.focus({ preventScroll: !0 })
        }
        _render(e) {
          r.render(o.createElement(c.b.Provider, { value: this._manager }, o.createElement(i.b, { ...e })), this._root)
        }
      }
    },
    fEjm: function (e, t, n) {
      e.exports = {
        favorite: 'favorite-I_fAY9V2',
        disabled: 'disabled-I_fAY9V2',
        active: 'active-I_fAY9V2',
        checked: 'checked-I_fAY9V2',
      }
    },
    hn2c: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 16" width="10" height="16"><path d="M.6 1.4l1.4-1.4 8 8-8 8-1.4-1.4 6.389-6.532-6.389-6.668z"/></svg>'
    },
    mkWe: function (e, t, n) {
      'use strict'
      n.d(t, 'b', function () {
        return i
      }),
        n.d(t, 'a', function () {
          return s
        })
      var o = n('q1tI'),
        r = n.n(o)
      class i extends r.a.PureComponent {
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
            s.Provider,
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
      const s = r.a.createContext(null)
    },
    pr86: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return u
      })
      n('YFKU')
      var o = n('q1tI'),
        r = n('TSYQ'),
        i = n('Iivm'),
        s = n('sg5d'),
        c = n('XfUw'),
        a = n('fEjm')
      const l = { add: window.t('Add to favorites'), remove: window.t('Remove from favorites') }
      function u(e) {
        const { className: t, isFilled: n, isActive: u, onClick: d, ...h } = e
        return o.createElement(i.a, {
          ...h,
          className: r(a.favorite, 'apply-common-tooltip', n && a.checked, u && a.active, t),
          icon: n ? s : c,
          onClick: d,
          title: n ? l.remove : l.add,
        })
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
    sg5d: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none"><path fill="currentColor" d="M9 1l2.35 4.76 5.26.77-3.8 3.7.9 5.24L9 13l-4.7 2.47.9-5.23-3.8-3.71 5.25-.77L9 1z"/></svg>'
    },
    tUxN: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 9" width="11" height="9" fill="none"><path stroke-width="2" d="M0.999878 4L3.99988 7L9.99988 1"/></svg>'
    },
    vCF3: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return a
      })
      var o = n('q1tI'),
        r = n('TSYQ'),
        i = n('Iivm'),
        s = n('tUxN'),
        c = n('F0Qt')
      n('P4l+')
      function a(e) {
        const t = r(c.box, c['intent-' + e.intent], {
            [c.check]: !Boolean(e.indeterminate),
            [c.dot]: Boolean(e.indeterminate),
            [c.noOutline]: -1 === e.tabIndex,
          }),
          n = r(c.wrapper, e.className)
        return o.createElement(
          'span',
          { className: n, title: e.title },
          o.createElement('input', {
            id: e.id,
            tabIndex: e.tabIndex,
            className: c.input,
            type: 'checkbox',
            name: e.name,
            checked: e.checked,
            disabled: e.disabled,
            value: e.value,
            autoFocus: e.autoFocus,
            role: e.role,
            onChange: function () {
              e.onChange && e.onChange(e.value)
            },
            ref: e.reference,
          }),
          o.createElement('span', { className: t }, o.createElement(i.a, { icon: s, className: c.icon })),
        )
      }
    },
    'x0D+': function (e, t, n) {
      var o, r, i
      ;(r = [t]),
        void 0 ===
          (i =
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
                i = [],
                s = !1,
                c = -1,
                a = void 0,
                l = void 0,
                u = function (e) {
                  return i.some(function (t) {
                    return !(!t.options.allowTouchMove || !t.options.allowTouchMove(e))
                  })
                },
                d = function (e) {
                  var t = e || window.event
                  return !!u(t.target) || 1 < t.touches.length || (t.preventDefault && t.preventDefault(), !1)
                },
                h = function () {
                  setTimeout(function () {
                    void 0 !== l && ((document.body.style.paddingRight = l), (l = void 0)),
                      void 0 !== a && ((document.body.style.overflow = a), (a = void 0))
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
                    !i.some(function (t) {
                      return t.targetElement === e
                    })
                  ) {
                    var h = { targetElement: e, options: o || {} }
                    ;(i = [].concat(t(i), [h])),
                      (e.ontouchstart = function (e) {
                        1 === e.targetTouches.length && (c = e.targetTouches[0].clientY)
                      }),
                      (e.ontouchmove = function (t) {
                        var n, o, r, i
                        1 === t.targetTouches.length &&
                          ((o = e),
                          (i = (n = t).targetTouches[0].clientY - c),
                          !u(n.target) &&
                            ((o && 0 === o.scrollTop && 0 < i) ||
                            ((r = o) && r.scrollHeight - r.scrollTop <= r.clientHeight && i < 0)
                              ? d(n)
                              : n.stopPropagation()))
                      }),
                      s || (document.addEventListener('touchmove', d, n ? { passive: !1 } : void 0), (s = !0))
                  }
                } else {
                  ;(m = o),
                    setTimeout(function () {
                      if (void 0 === l) {
                        var e = !!m && !0 === m.reserveScrollBarGap,
                          t = window.innerWidth - document.documentElement.clientWidth
                        e &&
                          0 < t &&
                          ((l = document.body.style.paddingRight), (document.body.style.paddingRight = t + 'px'))
                      }
                      void 0 === a && ((a = document.body.style.overflow), (document.body.style.overflow = 'hidden'))
                    })
                  var v = { targetElement: e, options: o || {} }
                  i = [].concat(t(i), [v])
                }
                var m
              }),
                (e.clearAllBodyScrollLocks = function () {
                  r
                    ? (i.forEach(function (e) {
                        ;(e.targetElement.ontouchstart = null), (e.targetElement.ontouchmove = null)
                      }),
                      s && (document.removeEventListener('touchmove', d, n ? { passive: !1 } : void 0), (s = !1)),
                      (i = []),
                      (c = -1))
                    : (h(), (i = []))
                }),
                (e.enableBodyScroll = function (e) {
                  if (r) {
                    if (!e)
                      return void console.error(
                        'enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.',
                      )
                    ;(e.ontouchstart = null),
                      (e.ontouchmove = null),
                      (i = i.filter(function (t) {
                        return t.targetElement !== e
                      })),
                      s &&
                        0 === i.length &&
                        (document.removeEventListener('touchmove', d, n ? { passive: !1 } : void 0), (s = !1))
                  } else
                    1 === i.length && i[0].targetElement === e
                      ? (h(), (i = []))
                      : (i = i.filter(function (t) {
                          return t.targetElement !== e
                        }))
                })
            })
              ? o.apply(t, r)
              : o) || (e.exports = i)
    },
  },
])
