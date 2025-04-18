;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['simple-dialog'],
  {
    '+l/S': function (e, t, n) {},
    '/KDZ': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return a
      })
      var o = n('q1tI')
      class a extends o.PureComponent {
        constructor(e) {
          super(e),
            (this._handleChange = () => {
              this.forceUpdate()
            }),
            (this.state = { query: window.matchMedia(this.props.rule) })
        }
        componentDidMount() {
          this._subscribe(this.state.query)
        }
        componentDidUpdate(e, t) {
          this.state.query !== t.query && (this._unsubscribe(t.query), this._subscribe(this.state.query))
        }
        componentWillUnmount() {
          this._unsubscribe(this.state.query)
        }
        render() {
          return this.props.children(this.state.query.matches)
        }
        static getDerivedStateFromProps(e, t) {
          return e.rule !== t.query.media ? { query: window.matchMedia(e.rule) } : null
        }
        _subscribe(e) {
          e.addListener(this._handleChange)
        }
        _unsubscribe(e) {
          e.removeListener(this._handleChange)
        }
      }
    },
    '2A9e': function (e) {
      e.exports = JSON.parse(
        '{"button":"button-1iktpaT1","content":"content-2PGssb8d","noOutline":"noOutline-d9Yp4qvi","grouped":"grouped-2NxOpIxM","adjust-position":"adjust-position-2zd-ooQC","first-row":"first-row-11wXF7aC","first-col":"first-col-pbJu53tK","no-corner-top-left":"no-corner-top-left-3ZsS65Fk","no-corner-top-right":"no-corner-top-right-3MYQOwk_","no-corner-bottom-right":"no-corner-bottom-right-3II18BAU","no-corner-bottom-left":"no-corner-bottom-left-3KZuX8tv","appearance-default":"appearance-default-dMjF_2Hu","intent-primary":"intent-primary-1-IOYcbg","intent-success":"intent-success-25a4XZXM","intent-default":"intent-default-2ZbSqQDs","intent-warning":"intent-warning-24j5HMi0","intent-danger":"intent-danger-1EETHCla","appearance-stroke":"appearance-stroke-12lxiUSM","appearance-text":"appearance-text-DqKJVT3U","appearance-inverse":"appearance-inverse-r1Y2JQg_","size-s":"size-s-3mait84m","size-m":"size-m-2G7L7Qat","size-l":"size-l-2NEs9_xt","full-width":"full-width-1wU8ljjC","with-icon":"with-icon-yumghDr-","icon":"icon-1grlgNdV"}',
      )
    },
    '3tYt': function (e, t, n) {
      e.exports = { label: 'label-32bOLbsS', input: 'input-32bOLbsS' }
    },
    '6KyJ': function (e, t, n) {
      'use strict'
      var o,
        a = n('q1tI'),
        r = n('TSYQ'),
        i = n('K9GE'),
        l = n('YZ9j')
      n('O7m7')
      !(function (e) {
        ;(e[(e.Initial = 0)] = 'Initial'), (e[(e.Appear = 1)] = 'Appear'), (e[(e.Active = 2)] = 'Active')
      })(o || (o = {}))
      class c extends a.PureComponent {
        constructor(e) {
          super(e), (this._stateChangeTimeout = null), (this.state = { state: o.Initial })
        }
        render() {
          const { className: e, color: t = 'black' } = this.props,
            n = r(l.item, { [l[t]]: Boolean(t) })
          return a.createElement(
            'span',
            { className: r(l.loader, e, this._getStateClass()) },
            a.createElement('span', { className: n }),
            a.createElement('span', { className: n }),
            a.createElement('span', { className: n }),
          )
        }
        componentDidMount() {
          this.setState({ state: o.Appear }),
            (this._stateChangeTimeout = setTimeout(() => {
              this.setState({ state: o.Active })
            }, 2 * i.b))
        }
        componentWillUnmount() {
          this._stateChangeTimeout && (clearTimeout(this._stateChangeTimeout), (this._stateChangeTimeout = null))
        }
        _getStateClass() {
          switch (this.state.state) {
            case o.Initial:
              return l['loader-initial']
            case o.Appear:
              return l['loader-appear']
            default:
              return ''
          }
        }
      }
      n.d(t, 'a', function () {
        return c
      })
    },
    ASyk: function (e, t, n) {
      e.exports = {
        'tablet-normal-breakpoint': 'screen and (max-width: 768px)',
        'small-height-breakpoint': 'screen and (max-height: 360px)',
        'tablet-small-breakpoint': 'screen and (max-width: 428px)',
      }
    },
    EcUf: function (e, t, n) {
      'use strict'
      n.r(t)
      var o = n('q1tI'),
        a = n.n(o),
        r = n('YFKU'),
        i = n('TSYQ'),
        l = n('Iivm'),
        c = n('FQhm'),
        s = n('WXjp'),
        u = n('/3z9'),
        d = n('/KDZ'),
        m = n('ZjKI'),
        p = n('uhCe'),
        f = n('tmL0'),
        h = n('mwqF'),
        b = n('6KyJ'),
        v = n('Eyy1'),
        g = n('PR+g'),
        w = n('+EG+')
      const E = a.a.createContext({ isSmallTablet: !1, dialogCloseHandler: () => {} })
      var O = n('G4Ee')
      function C(e) {
        const { disabled: t, name: n, title: r, appearance: l, intent: c, handler: s, reference: u } = e,
          { isSmallTablet: d, dialogCloseHandler: m } = Object(o.useContext)(E),
          p = Object(v.ensureNotNull)(Object(o.useContext)(w.b)),
          f = Object(g.a)(),
          [C, y] = Object(o.useState)(!1)
        return a.a.createElement(
          h.a,
          {
            disabled: t,
            reference: u,
            className: i(O.actionButton, d && O.small),
            name: n,
            size: d ? 'l' : void 0,
            appearance: l,
            intent: c,
            onClick: function () {
              if (C) return
              const e = s({ dialogClose: m, innerManager: p })
              e &&
                (y(!0),
                e.then(() => {
                  f.current && y(!1)
                }))
            },
          },
          a.a.createElement('span', { className: i(C && O.hiddenTitle) }, r),
          C && a.a.createElement(b.a, { color: 'white' }),
        )
      }
      var y = n('zztK'),
        S = n('yKGJ')
      function j(e) {
        const {
          title: t,
          onClose: n,
          actions: r,
          dataName: h,
          popupDialogClassName: b,
          backdrop: v,
          closeOnOutsideClick: g = !0,
        } = e
        Object(o.useEffect)(
          () => (
            c.subscribe(m.CLOSE_POPUPS_AND_DIALOGS_COMMAND, n, null),
            () => {
              c.unsubscribe(m.CLOSE_POPUPS_AND_DIALOGS_COMMAND, n, null)
            }
          ),
          [n],
        )
        const [w, O] = Object(o.useState)(!0),
          j = Object(o.useRef)(null)
        return a.a.createElement(d.a, { rule: p.a.TabletSmall }, o =>
          a.a.createElement(
            E.Provider,
            { value: { isSmallTablet: o, dialogCloseHandler: n } },
            a.a.createElement(
              s.a,
              {
                className: i(S.popupDialog, b),
                isOpened: w,
                backdrop: v,
                onClickBackdrop: x,
                onClickOutside: g ? x : void 0,
                onKeyDown: N,
                autofocus: !0,
                fixedBody: !0,
              },
              a.a.createElement(
                'div',
                { className: S.wrap, 'data-name': h },
                a.a.createElement(
                  'div',
                  { className: i(S.main, o && S.small) },
                  a.a.createElement('div', { className: i(S.title, o && S.small) }, t),
                  (function (t) {
                    if ('html' in e)
                      return a.a.createElement(f.a, {
                        className: i(S.content, t && S.small, S.html),
                        dangerouslySetInnerHTML: { __html: e.html },
                      })
                    if ('content' in e)
                      return a.a.createElement(f.a, { className: i(S.content, t && S.small) }, e.content)
                    return null
                  })(o),
                  r &&
                    r.length > 0 &&
                    a.a.createElement(
                      'div',
                      { className: i(S.footer, o && S.small) },
                      r.map((e, t) => a.a.createElement(C, { ...e, key: e.name, reference: 0 === t ? j : void 0 })),
                    ),
                ),
                a.a.createElement(l.a, {
                  className: i(S.close, o && S.small),
                  icon: y,
                  onClick: x,
                  'data-name': 'close',
                  'data-role': 'button',
                }),
              ),
            ),
          ),
        )
        function N(e) {
          switch (Object(u.hashFromEvent)(e)) {
            case 27:
              w && (e.preventDefault(), n())
              break
            case 13:
              if (w && r && r.length) {
                e.preventDefault()
                const t = j.current
                t && t.click()
              }
          }
        }
        function x() {
          O(!1), n()
        }
      }
      function N(e) {
        return 'html' in e ? { html: e.html } : { content: e.text }
      }
      var x = n('wHCJ'),
        k = n('3tYt')
      function T(e) {
        const { maxLength: t, value: n, placeholder: r, onValueChange: i, nameInputRef: l } = e,
          { isSmallTablet: c } = Object(o.useContext)(E),
          s = a.a.useRef(null)
        return (
          Object(o.useLayoutEffect)(() => {
            s.current && s.current.select()
          }, []),
          a.a.createElement(
            a.a.Fragment,
            null,
            (function () {
              if ('content' in e)
                return a.a.createElement(
                  'div',
                  {
                    className: k.label,
                  },
                  e.content,
                )
              if ('html' in e)
                return a.a.createElement('div', { className: k.label, dangerouslySetInnerHTML: { __html: e.html } })
              return null
            })(),
            a.a.createElement(x.a, {
              inputClassName: k.input,
              autoComplete: 'no',
              size: c ? 'large' : void 0,
              reference: function (e) {
                ;(s.current = e), l && (l.current = e)
              },
              value: n,
              placeholder: r,
              maxLength: t,
              onChange: function (e) {
                i(e.currentTarget.value)
              },
            }),
          )
        )
      }
      function _(e) {
        return Boolean(e.trim())
      }
      function L(e) {
        const { buttonText: t, intentButton: n, actions: o } = e,
          a = [
            {
              name: 'ok',
              title: t || Object(r.t)('Ok'),
              intent: n,
              handler: ({ dialogClose: e }) => {
                e()
              },
            },
          ]
        return o && o.forEach(e => a.push(e)), a
      }
      var D = n('i8i4'),
        I = n.n(D)
      const A = new (n('Gtzb').a)()
      n.d(t, 'confirmModule', function () {
        return M
      }),
        n.d(t, 'renameModule', function () {
          return P
        }),
        n.d(t, 'warningModule', function () {
          return B
        }),
        n.d(t, 'showSimpleDialog', function () {
          return q
        })
      const M = function (e) {
          const {
              title: t,
              onClose: n = () => {},
              mainButtonText: o,
              mainButtonIntent: i,
              cancelButtonText: l,
              closeOnOutsideClick: c,
              onConfirm: s,
              onCancel: u,
            } = e,
            d = N(e)
          return a.a.createElement(j, {
            ...d,
            title: t || Object(r.t)('Confirmation'),
            onClose: n,
            actions: [
              { name: 'yes', title: o || Object(r.t)('Yes'), intent: i || 'success', handler: s },
              {
                name: 'no',
                title: l || Object(r.t)('No'),
                appearance: 'stroke',
                intent: 'default',
                handler: e => {
                  u ? u(e) : e.dialogClose()
                },
              },
            ],
            dataName: 'confirm-dialog',
            closeOnOutsideClick: c,
          })
        },
        P = function (e) {
          const {
              title: t,
              maxLength: n,
              initValue: i,
              placeholder: l,
              onClose: c = () => {},
              mainButtonText: s,
              mainButtonIntent: u,
              cancelButtonText: d,
              validator: m = _,
              onRename: p,
            } = e,
            f = Object(o.useRef)(null),
            [h, b] = Object(o.useState)(i || ''),
            [v, g] = Object(o.useState)(() => m(h)),
            w = N(e)
          return a.a.createElement(j, {
            title: t || Object(r.t)('Rename'),
            content: a.a.createElement(T, {
              ...w,
              nameInputRef: f,
              maxLength: n,
              placeholder: l,
              value: h,
              onValueChange: function (e) {
                b(e), g(m(e))
              },
            }),
            onClose: c,
            actions: [
              {
                disabled: !v,
                name: 'save',
                title: s || Object(r.t)('Save'),
                intent: u || 'primary',
                handler: ({ dialogClose: e, innerManager: t }) =>
                  p({ newValue: h, focusInput: E, dialogClose: e, innerManager: t }),
              },
              {
                name: 'cancel',
                title: d || Object(r.t)('Cancel'),
                appearance: 'stroke',
                intent: 'default',
                handler: ({ dialogClose: e }) => {
                  e()
                },
              },
            ],
            dataName: 'rename-dialog',
          })
          function E() {
            f.current && f.current.focus()
          }
        },
        B = function (e) {
          const { title: t, closeOnOutsideClick: n, onClose: o = () => {} } = e,
            i = N(e)
          return a.a.createElement(j, {
            ...i,
            title: t || Object(r.t)('Warning'),
            onClose: o,
            actions: L(e),
            dataName: 'warning-dialog',
            closeOnOutsideClick: n,
          })
        },
        q = function (e, t, n) {
          const { title: o } = e,
            r = `${o}_${'text' in e ? e.text : e.html}`
          if (A.isOpened(r)) return Object(v.ensureDefined)(A.getDialogPayload(r)).closeHandler
          const i = document.createElement('div'),
            l = () => {
              var t
              null === (t = e.onClose) || void 0 === t || t.call(e), I.a.unmountComponentAtNode(i), A.setAsClosed(r)
            }
          return (
            I.a.render(
              a.a.createElement(w.b.Provider, { value: n || null }, a.a.createElement(t, { ...e, onClose: l })),
              i,
            ),
            A.setAsOpened(r, { closeHandler: l }),
            l
          )
        }
    },
    G4Ee: function (e, t, n) {
      e.exports = {
        actionButton: 'actionButton-3wPv1Zy2',
        small: 'small-3wPv1Zy2',
        hiddenTitle: 'hiddenTitle-3wPv1Zy2',
      }
    },
    Gtzb: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return o
      }),
        n.d(t, 'b', function () {
          return a
        })
      class o {
        constructor() {
          this._storage = new Map()
        }
        setAsOpened(e, t) {
          this._storage.set(e, t)
        }
        setAsClosed(e) {
          this._storage.delete(e)
        }
        isOpened(e) {
          return this._storage.has(e)
        }
        getDialogPayload(e) {
          return this._storage.get(e)
        }
      }
      const a = new o()
    },
    O7m7: function (e, t, n) {},
    'PR+g': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return a
      })
      var o = n('q1tI')
      const a = () => {
        const e = Object(o.useRef)(!1)
        return (
          Object(o.useEffect)(
            () => (
              (e.current = !0),
              () => {
                e.current = !1
              }
            ),
            [],
          ),
          e
        )
      }
    },
    R5JZ: function (e, t, n) {
      'use strict'
      function o(e, t, n, o, a) {
        function r(a) {
          if (e > a.timeStamp) return
          const r = a.target
          void 0 !== n && null !== t && null !== r && r.ownerDocument === o && (t.contains(r) || n(a))
        }
        return (
          a.click && o.addEventListener('click', r, !1),
          a.mouseDown && o.addEventListener('mousedown', r, !1),
          a.touchEnd && o.addEventListener('touchend', r, !1),
          a.touchStart && o.addEventListener('touchstart', r, !1),
          () => {
            o.removeEventListener('click', r, !1),
              o.removeEventListener('mousedown', r, !1),
              o.removeEventListener('touchend', r, !1),
              o.removeEventListener('touchstart', r, !1)
          }
        )
      }
      n.d(t, 'a', function () {
        return o
      })
    },
    YZ9j: function (e) {
      e.exports = JSON.parse(
        '{"loader":"loader-8x1ZxRwP","item":"item-2-89r_cd","tv-button-loader":"tv-button-loader-23vqS1uY","black":"black-20Ytsf0V","white":"white-1ucCcc2I","gray":"gray-XDhHSS-T","loader-initial":"loader-initial-1deQDeio","loader-appear":"loader-appear-2krFtMrd"}',
      )
    },
    ijHL: function (e, t, n) {
      'use strict'
      function o(e) {
        return r(e, i)
      }
      function a(e) {
        return r(e, l)
      }
      function r(e, t) {
        const n = Object.entries(e).filter(t),
          o = {}
        for (const [e, t] of n) o[e] = t
        return o
      }
      function i(e) {
        const [t, n] = e
        return 0 === t.indexOf('data-') && 'string' == typeof n
      }
      function l(e) {
        return 0 === e[0].indexOf('aria-')
      }
      n.d(t, 'b', function () {
        return o
      }),
        n.d(t, 'a', function () {
          return a
        }),
        n.d(t, 'c', function () {
          return r
        }),
        n.d(t, 'e', function () {
          return i
        }),
        n.d(t, 'd', function () {
          return l
        })
    },
    mwqF: function (e, t, n) {
      'use strict'
      var o = n('q1tI'),
        a = n.n(o),
        r = n('TSYQ'),
        i = n('wwkJ'),
        l = n('ZWNO')
      function c(e, t) {
        const {
            intent: n = 'primary',
            size: o = 'm',
            appearance: a = 'default',
            useFullWidth: i = !1,
            tabIndex: c = 0,
            icon: s,
            className: u,
            isGrouped: d,
            cellState: m,
            disablePositionAdjustment: p = !1,
          } = t,
          f = (function (e, t) {
            let n = ''
            return (
              0 !== e &&
                (1 & e && (n = r(n, t['no-corner-top-left'])),
                2 & e && (n = r(n, t['no-corner-top-right'])),
                4 & e && (n = r(n, t['no-corner-bottom-right'])),
                8 & e && (n = r(n, t['no-corner-bottom-left']))),
              n
            )
          })(Object(l.a)(m), e)
        return r(
          u,
          e.button,
          e['size-' + o],
          e['intent-' + n],
          e['appearance-' + a],
          i && e['full-width'],
          -1 === c && e.noOutline,
          s && 's' !== o && e['with-icon'],
          f,
          d && e.grouped,
          !p && e['adjust-position'],
          m.isTop && e['first-row'],
          m.isLeft && e['first-col'],
        )
      }
      var s = n('2A9e')
      n('+l/S')
      function u(e) {
        const {
            className: t,
            intent: n,
            size: l,
            appearance: u,
            disabled: d,
            useFullWidth: m,
            reference: p,
            icon: f,
            children: h,
            tabIndex: b,
            ...v
          } = e,
          { isGrouped: g, cellState: w, disablePositionAdjustment: E } = Object(o.useContext)(i.a),
          O = c(s, {
            intent: n,
            size: l,
            appearance: u,
            disabled: d,
            useFullWidth: m,
            tabIndex: b,
            icon: f,
            isGrouped: g,
            cellState: w,
            disablePositionAdjustment: E,
          })
        return a.a.createElement(
          'button',
          { className: r(O, t), disabled: d, ref: p, tabIndex: b, ...v },
          f && 's' !== l && a.a.createElement('span', { className: s.icon }, f),
          a.a.createElement(
            'span',
            {
              className: s.content,
            },
            h,
          ),
        )
      }
      n.d(t, 'a', function () {
        return u
      })
    },
    tmL0: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return c
      })
      var o = n('q1tI'),
        a = n.n(o),
        r = n('x0D+'),
        i = n('Eyy1'),
        l = n('qFKp')
      function c(e) {
        const { reference: t, children: n, ...i } = e,
          c = Object(o.useRef)(null),
          u = Object(o.useCallback)(
            e => {
              t && (t.current = e),
                l.CheckMobile.iOS() &&
                  (null !== c.current && Object(r.enableBodyScroll)(c.current),
                  (c.current = e),
                  null !== c.current && Object(r.disableBodyScroll)(c.current, { allowTouchMove: s(c) }))
            },
            [t],
          )
        return a.a.createElement('div', { ref: u, ...i }, n)
      }
      function s(e) {
        return t => {
          const n = Object(i.ensureNotNull)(e.current),
            o = document.activeElement
          return !n.contains(t) || (null !== o && n.contains(o) && o.contains(t))
        }
      }
    },
    uhCe: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return a
      })
      var o = n('ASyk')
      const a = {
        SmallHeight: o['small-height-breakpoint'],
        TabletSmall: o['tablet-small-breakpoint'],
        TabletNormal: o['tablet-normal-breakpoint'],
      }
    },
    'x0D+': function (e, t, n) {
      var o, a, r
      ;(a = [t]),
        void 0 ===
          (r =
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
              var a =
                  'undefined' != typeof window &&
                  window.navigator &&
                  window.navigator.platform &&
                  /iP(ad|hone|od)/.test(window.navigator.platform),
                r = [],
                i = !1,
                l = -1,
                c = void 0,
                s = void 0,
                u = function (e) {
                  return r.some(function (t) {
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
                      void 0 !== c && ((document.body.style.overflow = c), (c = void 0))
                  })
                }
              ;(e.disableBodyScroll = function (e, o) {
                if (a) {
                  if (!e)
                    return void console.error(
                      'disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.',
                    )
                  if (
                    e &&
                    !r.some(function (t) {
                      return t.targetElement === e
                    })
                  ) {
                    var m = { targetElement: e, options: o || {} }
                    ;(r = [].concat(t(r), [m])),
                      (e.ontouchstart = function (e) {
                        1 === e.targetTouches.length && (l = e.targetTouches[0].clientY)
                      }),
                      (e.ontouchmove = function (t) {
                        var n, o, a, r
                        1 === t.targetTouches.length &&
                          ((o = e),
                          (r = (n = t).targetTouches[0].clientY - l),
                          !u(n.target) &&
                            ((o && 0 === o.scrollTop && 0 < r) ||
                            ((a = o) && a.scrollHeight - a.scrollTop <= a.clientHeight && r < 0)
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
                      void 0 === c && ((c = document.body.style.overflow), (document.body.style.overflow = 'hidden'))
                    })
                  var p = { targetElement: e, options: o || {} }
                  r = [].concat(t(r), [p])
                }
                var f
              }),
                (e.clearAllBodyScrollLocks = function () {
                  a
                    ? (r.forEach(function (e) {
                        ;(e.targetElement.ontouchstart = null), (e.targetElement.ontouchmove = null)
                      }),
                      i && (document.removeEventListener('touchmove', d, n ? { passive: !1 } : void 0), (i = !1)),
                      (r = []),
                      (l = -1))
                    : (m(), (r = []))
                }),
                (e.enableBodyScroll = function (e) {
                  if (a) {
                    if (!e)
                      return void console.error(
                        'enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.',
                      )
                    ;(e.ontouchstart = null),
                      (e.ontouchmove = null),
                      (r = r.filter(function (t) {
                        return t.targetElement !== e
                      })),
                      i &&
                        0 === r.length &&
                        (document.removeEventListener('touchmove', d, n ? { passive: !1 } : void 0), (i = !1))
                  } else
                    1 === r.length && r[0].targetElement === e
                      ? (m(), (r = []))
                      : (r = r.filter(function (t) {
                          return t.targetElement !== e
                        }))
                })
            })
              ? o.apply(t, a)
              : o) || (e.exports = r)
    },
    yKGJ: function (e, t, n) {
      e.exports = {
        popupDialog: 'popupDialog-35doN71j',
        wrap: 'wrap-35doN71j',
        main: 'main-35doN71j',
        small: 'small-35doN71j',
        title: 'title-35doN71j',
        content: 'content-35doN71j',
        html: 'html-35doN71j',
        footer: 'footer-35doN71j',
        close: 'close-35doN71j',
      }
    },
    zztK: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" width="17" height="17" fill="none"><path stroke="currentColor" stroke-width="1.2" d="M1 1l15 15m0-15L1 16"/></svg>'
    },
  },
])
