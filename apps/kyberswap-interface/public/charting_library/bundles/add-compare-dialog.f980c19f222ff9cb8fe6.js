;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['add-compare-dialog'],
  {
    '/KDZ': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return o
      })
      var a = n('q1tI')
      class o extends a.PureComponent {
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
    '8R5U': function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 121 120" width="121" height="120"><path fill="#1E222D" d="M53.88 18.36a43.4 43.4 0 0 1 11.24 0 1 1 0 0 0 .26-1.98 45.42 45.42 0 0 0-11.76 0 1 1 0 1 0 .26 1.98zM43.04 21.26a1 1 0 0 0-.77-1.85A44.95 44.95 0 0 0 32.1 25.3a1 1 0 0 0 1.22 1.58 42.95 42.95 0 0 1 9.72-5.62zM75.42 19.96a1 1 0 0 1 1.3-.55A44.95 44.95 0 0 1 86.9 25.3a1 1 0 0 1-1.22 1.58 42.95 42.95 0 0 0-9.72-5.62 1 1 0 0 1-.54-1.3zM25.38 34.82a1 1 0 1 0-1.58-1.22 44.95 44.95 0 0 0-5.89 10.17 1 1 0 0 0 1.85.77 42.95 42.95 0 0 1 5.62-9.72zM16.86 55.38a1 1 0 0 0-1.98-.26 45.42 45.42 0 0 0 0 11.76 1 1 0 1 0 1.98-.26 43.4 43.4 0 0 1 0-11.24zM103 54.26a1 1 0 0 1 1.12.86 45.4 45.4 0 0 1 0 11.76 1 1 0 0 1-1.98-.26 43.37 43.37 0 0 0 0-11.24 1 1 0 0 1 .86-1.12zM19.76 77.46a1 1 0 0 0-1.85.77A44.95 44.95 0 0 0 23.8 88.4a1 1 0 0 0 1.58-1.22 42.95 42.95 0 0 1-5.62-9.72zM100.54 76.92a1 1 0 0 1 .54 1.3A44.95 44.95 0 0 1 95.2 88.4a1 1 0 0 1-1.58-1.22 42.95 42.95 0 0 0 5.62-9.72 1 1 0 0 1 1.3-.54zM33.32 95.12a1 1 0 1 0-1.22 1.58 44.94 44.94 0 0 0 10.17 5.88 1 1 0 0 0 .77-1.84 42.97 42.97 0 0 1-9.72-5.62zM87.08 95.3a1 1 0 0 1-.18 1.4 44.94 44.94 0 0 1-10.17 5.88 1 1 0 0 1-.77-1.84 42.98 42.98 0 0 0 9.72-5.62 1 1 0 0 1 1.4.18zM53.88 103.64a1 1 0 0 0-.26 1.98 45.4 45.4 0 0 0 11.76 0 1 1 0 0 0-.26-1.98 43.37 43.37 0 0 1-11.24 0zM62.81 53.17a1 1 0 0 0-.78 1.84 6.62 6.62 0 0 1 3.49 3.5 1 1 0 1 0 1.84-.78 8.62 8.62 0 0 0-4.55-4.56z"/><path fill="#1E222D" d="M45.5 61a14 14 0 1 1 24.28 9.5l7.92 7.92a1 1 0 0 1-1.42 1.42l-7.96-7.97A14 14 0 0 1 45.5 61zm14-12a12 12 0 1 0 0 24 12 12 0 0 0 0-24z"/><circle fill="#2196F3" cx="97.5" cy="39" r="13"/><path fill="#fff" d="M98.5 34a1 1 0 1 0-2 0v4h-4a1 1 0 1 0 0 2h4v4a1 1 0 1 0 2 0v-4h4a1 1 0 0 0 0-2h-4v-4z"/></svg>'
    },
    '8d0Q': function (e, t, n) {
      'use strict'
      var a = n('q1tI')
      function o() {
        const [e, t] = Object(a.useState)(!1)
        return [
          e,
          {
            onMouseOver: function (e) {
              r(e) && t(!0)
            },
            onMouseOut: function (e) {
              r(e) && t(!1)
            },
          },
        ]
      }
      function r(e) {
        return !e.currentTarget.contains(e.relatedTarget)
      }
      function c(e) {
        const [t, n] = Object(a.useState)(!1)
        return (
          Object(a.useEffect)(() => {
            const t = t => {
              if (null === e.current) return
              const a = e.current.contains(t.target)
              n(a)
            }
            return document.addEventListener('mouseover', t), () => document.removeEventListener('mouseover', t)
          }, []),
          t
        )
      }
      n.d(t, 'c', function () {
        return o
      }),
        n.d(t, 'a', function () {
          return r
        }),
        n.d(t, 'b', function () {
          return c
        })
    },
    B2fo: function (e, t, n) {
      e.exports = { label: 'label-AT0tDw0n' }
    },
    DtPX: function (e, t, n) {
      e.exports = { dialog: 'dialog-1o8lbzhQ', tablet: 'tablet-1o8lbzhQ' }
    },
    F0Qt: function (e) {
      e.exports = JSON.parse(
        '{"wrapper":"wrapper-21v50zE8","input":"input-24iGIobO","box":"box-3574HVnv","icon":"icon-2jsUbtec","noOutline":"noOutline-3VoWuntz","intent-danger":"intent-danger-1Sr9dowC","check":"check-382c8Fu1","dot":"dot-3gRd-7Qt"}',
      )
    },
    GqiZ: function (e, t, n) {
      e.exports = {
        button: 'button-3vkvsUbb',
        bordersVisible: 'bordersVisible-3vkvsUbb',
        selected: 'selected-3vkvsUbb',
      }
    },
    N5tr: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return u
      }),
        n.d(t, 'b', function () {
          return v
        })
      var a = n('q1tI'),
        o = n.n(a),
        r = n('TSYQ'),
        c = n('tWVy'),
        l = n('JWMC'),
        i = n('ijHL'),
        s = n('v1bN')
      const u = s
      function d(e) {
        const { reference: t, ...n } = e,
          a = { ...n, ref: t }
        return o.a.createElement(e.href ? 'a' : 'div', a)
      }
      function m(e) {
        e.stopPropagation()
      }
      function v(e) {
        const {
            id: t,
            role: n,
            'aria-selected': u,
            className: v,
            title: h,
            labelRowClassName: p,
            labelClassName: b,
            shortcut: f,
            forceShowShortcuts: g,
            icon: w,
            isActive: S,
            isDisabled: y,
            isHovered: x,
            appearAsDisabled: E,
            label: O,
            link: C,
            showToolboxOnHover: k,
            target: I,
            rel: N,
            toolbox: j,
            reference: M,
            onMouseOut: D,
            onMouseOver: T,
            suppressToolboxClick: _ = !0,
            theme: z = s,
          } = e,
          B = Object(i.b)(e),
          A = Object(a.useRef)(null)
        return o.a.createElement(
          d,
          {
            ...B,
            id: t,
            role: n,
            'aria-selected': u,
            className: r(v, z.item, w && z.withIcon, { [z.isActive]: S, [z.isDisabled]: y || E, [z.hovered]: x }),
            title: h,
            href: C,
            target: I,
            rel: N,
            reference: function (e) {
              ;(A.current = e), 'function' == typeof M && M(e)
              'object' == typeof M && (M.current = e)
            },
            onClick: function (t) {
              const { dontClosePopup: n, onClick: a, onClickArg: o, trackEventObject: r } = e
              if (y) return
              r && Object(l.trackEvent)(r.category, r.event, r.label)
              a && a(o, t)
              n || Object(c.b)()
            },
            onContextMenu: function (t) {
              const { trackEventObject: n, trackRightClick: a } = e
              n && a && Object(l.trackEvent)(n.category, n.event, n.label + '_rightClick')
            },
            onMouseUp: function (t) {
              const { trackEventObject: n, trackMouseWheelClick: a } = e
              if (1 === t.button && C && n) {
                let e = n.label
                a && (e += '_mouseWheelClick'), Object(l.trackEvent)(n.category, n.event, e)
              }
            },
            onMouseOver: T,
            onMouseOut: D,
          },
          void 0 !== w && o.a.createElement('div', { className: z.icon, dangerouslySetInnerHTML: { __html: w } }),
          o.a.createElement(
            'div',
            { className: r(z.labelRow, p) },
            o.a.createElement('div', { className: r(z.label, b) }, O),
          ),
          (void 0 !== f || g) &&
            o.a.createElement('div', { className: z.shortcut }, (P = f) && P.split('+').join(' + ')),
          void 0 !== j &&
            o.a.createElement('div', { onClick: _ ? m : void 0, className: r(z.toolbox, { [z.showOnHover]: k }) }, j),
        )
        var P
      }
    },
    'P4l+': function (e, t, n) {},
    Q5EB: function (e, t, n) {
      e.exports = { wrap: 'wrap-38TyPnxL', header: 'header-38TyPnxL', item: 'item-38TyPnxL' }
    },
    Sn4D: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return h
      })
      var a = n('q1tI'),
        o = n.n(a),
        r = n('Eyy1'),
        c = n('TSYQ'),
        l = n('x0D+'),
        i = n('0YpW'),
        s = n('AiMB'),
        u = n('mkWe'),
        d = n('qFKp'),
        m = n('X0gx'),
        v = n('sHQ4')
      function h(e) {
        const { position: t = 'Bottom', onClose: n, children: h, className: p, theme: b = v } = e,
          f = Object(r.ensureNotNull)(Object(a.useContext)(u.a)),
          [g, w] = Object(a.useState)(0),
          S = Object(a.useRef)(null),
          y = Object(a.useContext)(m.a)
        return (
          Object(a.useEffect)(() => {
            const e = Object(r.ensureNotNull)(S.current)
            return (
              e.focus({ preventScroll: !0 }),
              y.subscribe(f, n),
              Object(i.a)(!0),
              d.CheckMobile.iOS() && Object(l.disableBodyScroll)(e),
              w(f.addDrawer()),
              () => {
                y.unsubscribe(f, n)
                const t = f.removeDrawer()
                d.CheckMobile.iOS() && Object(l.enableBodyScroll)(e), 0 === t && Object(i.a)(!1)
              }
            )
          }, []),
          o.a.createElement(
            s.a,
            null,
            o.a.createElement(
              'div',
              { className: c(v.wrap, v['position' + t]) },
              g === f.currentDrawer && o.a.createElement('div', { className: v.backdrop, onClick: n }),
              o.a.createElement(
                'div',
                {
                  className: c(v.drawer, b.drawer, v['position' + t], p),
                  ref: S,
                  tabIndex: -1,
                  'data-name': e['data-name'],
                },
                h,
              ),
            ),
          )
        )
      }
    },
    X0gx: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return c
      })
      var a = n('q1tI'),
        o = n.n(a),
        r = n('tWVy')
      const c = o.a.createContext(r.a)
    },
    XG33: function (e, t, n) {
      e.exports = {
        scrollable: 'scrollable-1zurvWNw',
        spinnerWrap: 'spinnerWrap-1zurvWNw',
        item: 'item-1zurvWNw',
        heading: 'heading-1zurvWNw',
        checkboxWrap: 'checkboxWrap-1zurvWNw',
        checkbox: 'checkbox-1zurvWNw',
        emptyState: 'emptyState-1zurvWNw',
        image: 'image-1zurvWNw',
        text: 'text-1zurvWNw',
      }
    },
    Xy1d: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M7 15l5 5L23 9"/></svg>'
    },
    'a+BI': function (e, t, n) {
      'use strict'
      n.r(t)
      var a = n('q1tI'),
        o = n.n(a),
        r = n('YFKU'),
        c = n('8+VR'),
        l = n('Kxc7'),
        i = n('kNVT'),
        s = n('TSYQ'),
        u = n.n(s),
        d = n('cvc5'),
        m = n.n(d),
        v = n('Eyy1'),
        h = n('Iivm'),
        p = n('tmL0'),
        b = n('vqb8'),
        f = n('jPOK'),
        g = n('zM7N'),
        w = n('oiZD'),
        S = n('VogD'),
        y = n('zjoO')
      const x = o.a.createContext(null)
      var E = n('8d0Q'),
        O = n('OoQL')
      const C = o.a.createContext(null)
      var k = n('N5tr'),
        I = n('Sn4D'),
        N = n('mkWe'),
        j = n('GqiZ')
      function M(e) {
        const {
          theme: t = j,
          children: n,
          onClick: a,
          isSelected: r,
          areBordersVisible: c,
          isItemSelected: l,
          className: i,
          value: s,
          name: d,
        } = e
        return o.a.createElement(
          'button',
          {
            type: 'button',
            className: u()(i, t.button, r && t.selected, c && !r && !l && t.bordersVisible),
            name: d,
            value: s,
            onClick: a,
          },
          n,
        )
      }
      function D(e) {
        const { value: t, onClick: n, ...r } = e,
          c = Object(a.useCallback)(e => n(t, e), [t, n])
        return o.a.createElement(M, { ...r, value: String(t), onClick: c })
      }
      var T = n('xlAh'),
        _ = n('Q5EB')
      const z = {
        sameScale: Object(r.t)('Same % scale'),
        newPriceScale: Object(r.t)('New price scale'),
        newPane: Object(r.t)('New pane'),
      }
      function B(e) {
        const { fullSymbolName: t, isSelected: n, className: a } = e,
          { isMobile: c, searchRef: l, setMode: s } = Object(O.a)(S.a),
          {
            compareModel: d,
            selectedCompareOption: m,
            setHoveredItemId: v,
            clearInput: h,
            allowExtendTimeScale: p,
          } = Object(O.a)(x),
          { callback: b } = Object(O.a)(C)
        return c
          ? o.a.createElement(
              N.b,
              null,
              o.a.createElement(
                I.a,
                { position: 'Bottom', onClose: f.bind(null, !1) },
                o.a.createElement('div', { className: _.header }, Object(r.t)('Add to')),
                o.a.createElement(k.b, {
                  className: _.item,
                  onClick: g,
                  onClickArg: T.a.SameScale,
                  label: z.sameScale,
                }),
                o.a.createElement(k.b, {
                  className: _.item,
                  onClick: g,
                  onClickArg: T.a.NewPriceScale,
                  label: z.newPriceScale,
                }),
                o.a.createElement(k.b, { className: _.item, onClick: g, onClickArg: T.a.NewPane, label: z.newPane }),
              ),
            )
          : o.a.createElement(
              'div',
              { className: u()(_.wrap, a), 'data-name': 'compare-buttons-group' },
              o.a.createElement(
                D,
                { onClick: g, value: T.a.SameScale, isItemSelected: Boolean(n), isSelected: n && m === T.a.SameScale },
                z.sameScale,
              ),
              o.a.createElement(
                D,
                {
                  onClick: g,
                  value: T.a.NewPriceScale,
                  isItemSelected: Boolean(n),
                  isSelected: n && m === T.a.NewPriceScale,
                },
                z.newPriceScale,
              ),
              o.a.createElement(
                D,
                { onClick: g, value: T.a.NewPane, isItemSelected: Boolean(n), isSelected: n && m === T.a.NewPane },
                z.newPane,
              ),
            )
        function f(e) {
          c && b && b(), h && e && h(l, s)
        }
        function g(e, n) {
          if ((n.preventDefault(), d && t && void 0 !== e)) {
            Object(i.getSymbolSearchCompleteOverrideFunction)()(t).then(t => {
              d.applyStudy(t, e, p), v(''), f(!0)
            })
          }
        }
      }
      function A(e) {
        const { isSelected: t, fullSymbolName: n, onExpandClick: r, actions: l, id: s, isOffset: u } = e,
          { isMobile: d, toggleExpand: m, searchSpreads: v, searchRef: h, setMode: p } = Object(O.a)(S.a),
          {
            compareModel: b,
            hoveredItemId: f,
            setHoveredItemId: g,
            clearInput: w,
            allowExtendTimeScale: k,
          } = Object(O.a)(x),
          [I, N] = Object(a.useState)(!1),
          j = Object(a.useRef)(null),
          M = Object(E.b)(j),
          D = Object(a.useMemo)(() => ({ callback: A }), [A]),
          _ = !Boolean(r) && !Boolean(l),
          z = s === f
        return o.a.createElement(
          C.Provider,
          { value: D },
          o.a.createElement(y.a, {
            ...e,
            reference: j,
            onClick: function (t) {
              if (Boolean(r) && s && !u) return t.preventDefault(), void m(s)
              if (!I && d) return void N(!0)
              if (v && e.onClick) return void e.onClick(t)
              if ((c.mobiletouch ? z : !I) && n) {
                Object(i.getSymbolSearchCompleteOverrideFunction)()(n).then(e => {
                  b.applyStudy(e, T.a.SameScale, k)
                }),
                  g(''),
                  w && w(h, p)
              }
              c.mobiletouch && !d && !z && s && g(s)
            },
            hoverComponent: (function () {
              if (!_) return !1
              if (d) return I
              if (c.mobiletouch) return z
              return Boolean(M || t)
            })()
              ? B
              : void 0,
          }),
        )
        function A() {
          N(!1)
        }
      }
      var P = n('8R5U'),
        R = n('mjks'),
        W = n('Xy1d'),
        L = n('XG33')
      function q(e) {
        const { handleListWidth: t } = Object(v.ensureNotNull)(Object(a.useContext)(S.a)),
          {
            compareModel: n,
            selectedCompareIndex: c,
            selectedItemRef: l,
          } = Object(v.ensureNotNull)(Object(a.useContext)(x)),
          i = Object(b.a)({ watchedValue: n.isDataReady() }),
          s = Object(b.a)({ watchedValue: n.studies() }),
          d = Object(b.a)({ watchedValue: n.highlightedSymbol() }),
          E = Object(a.useMemo)(() => s.filter(e => e.checked), [s]),
          O = Object(a.useMemo)(() => s.filter(e => !e.checked), [s])
        return (
          Object(a.useEffect)(
            () => (
              n.chartModel().dataSourceCollectionChanged().subscribe(n, n.handleSourcesChange),
              () => n.chartModel().dataSourceCollectionChanged().unsubscribe(n, n.handleSourcesChange)
            ),
            [n],
          ),
          o.a.createElement(
            m.a,
            {
              onMeasure: function (e) {
                t(e.width)
              },
            },
            o.a.createElement(
              p.a,
              { className: L.scrollable },
              (function () {
                if (!i) return o.a.createElement('div', { className: L.spinnerWrap }, o.a.createElement(f.a, null))
                if (!Boolean(E.length) && !Boolean(O.length)) {
                  const e = w.watchedTheme.value() === g.a.Dark ? R : P
                  return o.a.createElement(
                    'div',
                    { className: L.emptyState },
                    o.a.createElement(h.a, { className: L.image, icon: e }),
                    o.a.createElement(
                      'div',
                      { className: L.text },
                      Object(r.t)('No symbols here yet — why not add some?'),
                    ),
                  )
                }
                return o.a.createElement(
                  o.a.Fragment,
                  null,
                  Boolean(E.length) &&
                    o.a.createElement(
                      o.a.Fragment,
                      null,
                      o.a.createElement('div', { className: L.heading }, Object(r.t)('Added symbols')),
                      E.map((e, t) =>
                        o.a.createElement(y.a, {
                          'data-role': 'added-symbol-item',
                          className: L.item,
                          key: e.id,
                          id: e.id,
                          title: e.title,
                          dangerousDescriptionHTML: e.description,
                          exchangeName: e.exchangeName,
                          marketType: e.marketType,
                          country: e.country,
                          providerId: e.providerId,
                          onClick: C.bind(null, e),
                          isHighlighted: e.id === d,
                          isSelected: k(e),
                          itemRef: k(e) ? l : void 0,
                          actions: o.a.createElement(
                            'div',
                            { className: L.checkboxWrap },
                            o.a.createElement(
                              M,
                              { className: L.checkbox, onClick: C.bind(null, e), isSelected: k(e) },
                              o.a.createElement(h.a, { icon: W }),
                            ),
                          ),
                        }),
                      ),
                    ),
                  Boolean(O.length) &&
                    o.a.createElement(
                      o.a.Fragment,
                      null,
                      o.a.createElement('div', { className: L.heading }, Object(r.t)('Recent symbols')),
                      O.map(e =>
                        o.a.createElement(A, {
                          'data-role': 'recent-symbol-item',
                          className: u()(L.item, e.id === d && L.highlighted),
                          key: e.id,
                          id: e.id,
                          title: e.title,
                          dangerousDescriptionHTML: e.description,
                          exchangeName: e.exchangeName,
                          marketType: e.marketType,
                          country: e.country,
                          providerId: e.providerId,
                          fullSymbolName: e.symbol,
                          isSelected: k(e),
                          itemRef: k(e) ? l : void 0,
                        }),
                      ),
                    ),
                )
              })(),
            ),
          )
        )
        function C(e, t) {
          t.preventDefault(), n.removeStudy(e)
        }
        function k(e) {
          return s.indexOf(e) === c
        }
      }
      var H = n('Vdly')
      class V extends o.a.PureComponent {
        constructor(e) {
          super(e),
            (this._selectedItemRef = o.a.createRef()),
            (this._getContextValue = () => {
              const { compareModel: e } = this.props,
                {
                  selectedCompareOption: t,
                  selectedCompareIndex: n,
                  hoveredItemId: a,
                  allowExtendTimeScale: o,
                } = this.state
              return {
                compareModel: e,
                selectedCompareOption: t,
                setSelectedCompareOption: this._setSelectedCompareOption,
                hoveredItemId: a,
                setHoveredItemId: this._setHoveredItemId,
                selectedCompareIndex: n,
                setSelectedCompareIndex: this._setSelectedCompareIndex,
                selectedItemRef: this._selectedItemRef,
                clearInput: this._clearInput,
                allowExtendTimeScale: o,
                toggleAllowExtendTimeScale: this._toggleAllowExtendTimeScale,
              }
            }),
            (this._clearInput = (e, t) => {
              e && e.current && ((e.current.value = ''), t('compare'))
            }),
            (this._setSelectedCompareOption = e => {
              this.setState({ selectedCompareOption: e })
            }),
            (this._setHoveredItemId = e => {
              this.setState({ hoveredItemId: e })
            }),
            (this._setSelectedCompareIndex = (e, t) => {
              this.setState({ selectedCompareIndex: e }, t)
            }),
            (this._toggleAllowExtendTimeScale = () => {
              const e = !this.state.allowExtendTimeScale
              H.setValue('showAddSymbolDialog.extendCheckboxState', e), this.setState({ allowExtendTimeScale: e })
            }),
            (this.state = {
              selectedCompareOption: 0,
              selectedCompareIndex: -1,
              hoveredItemId: void 0,
              allowExtendTimeScale: Boolean(H.getBool('showAddSymbolDialog.extendCheckboxState')),
            })
        }
        render() {
          const { children: e } = this.props
          return o.a.createElement(x.Provider, { value: this._getContextValue() }, e)
        }
      }
      var F = n('/3z9'),
        Q = n('g89m'),
        U = n('DtPX')
      const X = Object.keys(T.a).length / 2
      function Y(e) {
        const {
            openedItems: t,
            searchRef: n,
            feedItems: r,
            selectedIndex: c,
            toggleExpand: l,
            onSearchComplete: i,
            mode: u,
            setMode: d,
            setSelectedIndex: m,
            isMobile: v,
            isTablet: h,
            onClose: p,
            upperCaseEnabled: f,
          } = Object(O.a)(S.a),
          {
            compareModel: g,
            hoveredItemId: w,
            setHoveredItemId: y,
            selectedCompareOption: E,
            setSelectedCompareOption: C,
            selectedCompareIndex: k,
            setSelectedCompareIndex: I,
            selectedItemRef: N,
            clearInput: j,
            allowExtendTimeScale: M,
          } = Object(O.a)(x),
          D = Object(b.a)({ watchedValue: g.studies() }),
          T = r[c],
          _ = 'compare' === u
        return (
          Object(a.useEffect)(() => {
            w && y(''), k && I(-1)
          }, [u]),
          o.a.createElement(Q.a, {
            ...e,
            className: s(U.dialog, !v && h && U.tablet),
            onKeyDown: function (e) {
              var a
              const o = Object(F.hashFromEvent)(e),
                s = _ ? k : c,
                u = _ ? D : r
              switch (o) {
                case 38:
                  if ((e.preventDefault(), 0 === s)) return
                  if (-1 === s) return void z(0)
                  z(s - 1)
                  break
                case 40:
                  if ((e.preventDefault(), s === u.length - 1)) return
                  z(s + 1)
                  break
                case 37: {
                  const n = A()
                  if (n && t.has(n)) return e.preventDefault(), void l(n)
                  if (!E || n) return
                  e.preventDefault(), C(E - 1)
                  break
                }
                case 39: {
                  const n = A()
                  if (n && !t.has(n)) return e.preventDefault(), void l(n)
                  if (E === X - 1 || n) return
                  e.preventDefault(), C(E + 1)
                  break
                }
                case 13: {
                  if (_)
                    return void (function () {
                      if (-1 === k) return
                      const e = D[k]
                      e.checked ? g.removeStudy(e) : g.applyStudy(e.symbol, E, M)
                      I(-1)
                    })()
                  const t = A()
                  if (t) return e.preventDefault(), void l(t)
                  e.preventDefault()
                  const o = null === (a = null == n ? void 0 : n.current) || void 0 === a ? void 0 : a.value.trim()
                  o &&
                    j &&
                    (i([{ symbol: f ? o.toUpperCase() : o, resolved: !1, compareOption: E, allowExtendTimeScale: M }]),
                    j(n, d))
                  break
                }
                case 27:
                  e.preventDefault(), p()
              }
            },
            dataName: 'compare-dialog',
            draggable: !0,
          })
        )
        function z(e) {
          _ ? I(e, B) : m(e)
        }
        function B() {
          var e
          null === (e = N.current) || void 0 === e || e.scrollIntoView({ block: 'nearest' })
        }
        function A() {
          if (!T) return
          const { id: e, isOffset: t, onExpandClick: n } = T
          return !t && Boolean(n) && e ? e : void 0
        }
      }
      var G = n('i8i4'),
        K = n.n(G),
        J = n('CJov'),
        Z = n('uTDg'),
        $ = (n('p04v'), n('sQaR'))
      class ee extends $.a {
        constructor(e) {
          super(), (this._props = e)
        }
        show() {
          if (this.visible().value()) return
          const e = o.a.createElement(
            J.a.Provider,
            { value: null },
            o.a.createElement(Z.a, {
              ...this._props,
              initialMode: this._props.initialMode || 'symbolSearch',
              onClose: () => this.hide(),
            }),
          )
          K.a.render(e, this._container), this._setVisibility(!0)
        }
        hide() {
          var e, t
          K.a.unmountComponentAtNode(this._container),
            this._visibility.setValue(!1),
            null === (t = (e = this._props).onClose) || void 0 === t || t.call(e)
        }
      }
      var te = n('TgrR'),
        ne = n('QHWU'),
        ae = n('ki38')
      function oe(e) {
        const { searchRef: t, setMode: n } = Object(O.a)(S.a),
          { currentMode: r } = Object(O.a)(ae.a)
        return (
          Object(a.useEffect)(() => {
            const e = t.current
            if (e)
              return (
                e.addEventListener('input', c),
                () => {
                  e && e.removeEventListener('input', c)
                }
              )
          }, []),
          o.a.createElement(ne.a, { ...e })
        )
        function c() {
          var e, a, o, c
          t.current &&
            r &&
            ('compare' !== r.current ||
            '' ===
              (null === (a = null === (e = null == t ? void 0 : t.current) || void 0 === e ? void 0 : e.value) ||
              void 0 === a
                ? void 0
                : a.trim())
              ? 'symbolSearch' === r.current &&
                '' ===
                  (null === (c = null === (o = null == t ? void 0 : t.current) || void 0 === o ? void 0 : o.value) ||
                  void 0 === c
                    ? void 0
                    : c.trim()) &&
                n('compare')
              : n('symbolSearch'))
        }
      }
      var re = n('vCF3'),
        ce = n('tOje'),
        le = n('B2fo')
      function ie(e) {
        const { allowExtendTimeScale: t, toggleAllowExtendTimeScale: n } = Object(v.ensureNotNull)(
          Object(a.useContext)(x),
        )
        return o.a.createElement(
          ce.a,
          null,
          o.a.createElement(
            'label',
            null,
            o.a.createElement(re.a, { checked: t, value: t ? 'on' : 'off', onChange: n }),
            o.a.createElement('span', { className: le.label }, Object(r.t)('Allow extend time scale')),
          ),
        )
      }
      n.d(t, 'getCompareDialogRenderer', function () {
        return ue
      })
      const se = l.enabled('secondary_series_extend_time_scale')
      function ue(e) {
        return new ee({
          wrapper: ((t = e), e => o.a.createElement(V, { ...e, compareModel: t })),
          dialog: Y,
          contentItem: A,
          initialScreen: q,
          searchInput: oe,
          footer: se ? o.a.createElement(ie) : void 0,
          initialMode: 'compare',
          dialogTitle: Object(r.t)('Compare symbol'),
          autofocus: !c.mobiletouch,
          dialogWidth: 'fixed',
          onSearchComplete: t => {
            const { compareOption: n, allowExtendTimeScale: a } = t[0]
            if (void 0 !== n) {
              Object(i.getSymbolSearchCompleteOverrideFunction)()(t[0].symbol).then(t => {
                e.applyStudy(t, n, a)
              })
            }
          },
          symbolTypes: Object(te.d)(),
          showSpreadActions: l.enabled('show_spread_operators') && l.enabled('compare_symbol_search_spread_operators'),
        })
        var t
      }
    },
    mjks: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 121 120" width="121" height="120"><path fill="#D1D4DC" d="M53.88 18.36a43.4 43.4 0 0 1 11.24 0 1 1 0 0 0 .26-1.98 45.42 45.42 0 0 0-11.76 0 1 1 0 1 0 .26 1.98zM43.04 21.26a1 1 0 0 0-.77-1.85A44.95 44.95 0 0 0 32.1 25.3a1 1 0 0 0 1.22 1.58 42.95 42.95 0 0 1 9.72-5.62zM75.42 19.96a1 1 0 0 1 1.3-.55A44.95 44.95 0 0 1 86.9 25.3a1 1 0 0 1-1.22 1.58 42.95 42.95 0 0 0-9.72-5.62 1 1 0 0 1-.54-1.3zM25.38 34.82a1 1 0 1 0-1.58-1.22 44.95 44.95 0 0 0-5.89 10.17 1 1 0 0 0 1.85.77 42.95 42.95 0 0 1 5.62-9.72zM16.86 55.38a1 1 0 0 0-1.98-.26 45.42 45.42 0 0 0 0 11.76 1 1 0 1 0 1.98-.26 43.4 43.4 0 0 1 0-11.24zM103 54.26a1 1 0 0 1 1.12.86 45.4 45.4 0 0 1 0 11.76 1 1 0 0 1-1.98-.26 43.37 43.37 0 0 0 0-11.24 1 1 0 0 1 .86-1.12zM19.76 77.46a1 1 0 0 0-1.85.77A44.95 44.95 0 0 0 23.8 88.4a1 1 0 0 0 1.58-1.22 42.95 42.95 0 0 1-5.62-9.72zM100.54 76.92a1 1 0 0 1 .54 1.3A44.95 44.95 0 0 1 95.2 88.4a1 1 0 0 1-1.58-1.22 42.95 42.95 0 0 0 5.62-9.72 1 1 0 0 1 1.3-.54zM33.32 95.12a1 1 0 1 0-1.22 1.58 44.94 44.94 0 0 0 10.17 5.88 1 1 0 0 0 .77-1.84 42.97 42.97 0 0 1-9.72-5.62zM87.08 95.3a1 1 0 0 1-.18 1.4 44.94 44.94 0 0 1-10.17 5.88 1 1 0 0 1-.77-1.84 42.98 42.98 0 0 0 9.72-5.62 1 1 0 0 1 1.4.18zM53.88 103.64a1 1 0 0 0-.26 1.98 45.4 45.4 0 0 0 11.76 0 1 1 0 0 0-.26-1.98 43.37 43.37 0 0 1-11.24 0zM62.81 53.17a1 1 0 0 0-.78 1.84 6.62 6.62 0 0 1 3.49 3.5 1 1 0 1 0 1.84-.78 8.62 8.62 0 0 0-4.55-4.56z"/><path fill="#D1D4DC" d="M45.5 61a14 14 0 1 1 24.28 9.5l7.92 7.92a1 1 0 0 1-1.42 1.42l-7.96-7.97A14 14 0 0 1 45.5 61zm14-12a12 12 0 1 0 0 24 12 12 0 0 0 0-24z"/><circle fill="#1976D2" cx="97.5" cy="39" r="13"/><path fill="#D1D4DC" d="M98.5 34a1 1 0 1 0-2 0v4h-4a1 1 0 1 0 0 2h4v4a1 1 0 1 0 2 0v-4h4a1 1 0 0 0 0-2h-4v-4z"/></svg>'
    },
    mkWe: function (e, t, n) {
      'use strict'
      n.d(t, 'b', function () {
        return r
      }),
        n.d(t, 'a', function () {
          return c
        })
      var a = n('q1tI'),
        o = n.n(a)
      class r extends o.a.PureComponent {
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
          return o.a.createElement(
            c.Provider,
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
      const c = o.a.createContext(null)
    },
    os48: function (e, t, n) {
      e.exports = { footer: 'footer-3r-9t_XG' }
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
    tOje: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return i
      })
      var a = n('q1tI'),
        o = n.n(a),
        r = n('TSYQ'),
        c = n.n(r),
        l = n('os48')
      function i(e) {
        const { className: t, children: n } = e
        return o.a.createElement('div', { className: c()(l.footer, t) }, n)
      }
    },
    tUxN: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 9" width="11" height="9" fill="none"><path stroke-width="2" d="M0.999878 4L3.99988 7L9.99988 1"/></svg>'
    },
    tmL0: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return i
      })
      var a = n('q1tI'),
        o = n.n(a),
        r = n('x0D+'),
        c = n('Eyy1'),
        l = n('qFKp')
      function i(e) {
        const { reference: t, children: n, ...c } = e,
          i = Object(a.useRef)(null),
          u = Object(a.useCallback)(
            e => {
              t && (t.current = e),
                l.CheckMobile.iOS() &&
                  (null !== i.current && Object(r.enableBodyScroll)(i.current),
                  (i.current = e),
                  null !== i.current && Object(r.disableBodyScroll)(i.current, { allowTouchMove: s(i) }))
            },
            [t],
          )
        return o.a.createElement('div', { ref: u, ...c }, n)
      }
      function s(e) {
        return t => {
          const n = Object(c.ensureNotNull)(e.current),
            a = document.activeElement
          return !n.contains(t) || (null !== a && n.contains(a) && a.contains(t))
        }
      }
    },
    v1bN: function (e, t, n) {
      e.exports = {
        'tablet-small-breakpoint': 'screen and (max-width: 428px)',
        item: 'item-2IihgTnv',
        hovered: 'hovered-2IihgTnv',
        isDisabled: 'isDisabled-2IihgTnv',
        isActive: 'isActive-2IihgTnv',
        shortcut: 'shortcut-2IihgTnv',
        toolbox: 'toolbox-2IihgTnv',
        withIcon: 'withIcon-2IihgTnv',
        icon: 'icon-2IihgTnv',
        labelRow: 'labelRow-2IihgTnv',
        label: 'label-2IihgTnv',
        showOnHover: 'showOnHover-2IihgTnv',
      }
    },
    vCF3: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return i
      })
      var a = n('q1tI'),
        o = n('TSYQ'),
        r = n('Iivm'),
        c = n('tUxN'),
        l = n('F0Qt')
      n('P4l+')
      function i(e) {
        const t = o(l.box, l['intent-' + e.intent], {
            [l.check]: !Boolean(e.indeterminate),
            [l.dot]: Boolean(e.indeterminate),
            [l.noOutline]: -1 === e.tabIndex,
          }),
          n = o(l.wrapper, e.className)
        return a.createElement(
          'span',
          { className: n, title: e.title },
          a.createElement('input', {
            id: e.id,
            tabIndex: e.tabIndex,
            className: l.input,
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
          a.createElement('span', { className: t }, a.createElement(r.a, { icon: c, className: l.icon })),
        )
      }
    },
    'x0D+': function (e, t, n) {
      var a, o, r
      ;(o = [t]),
        void 0 ===
          (r =
            'function' ==
            typeof (a = function (e) {
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
                var a = {
                  get passive() {
                    n = !0
                  },
                }
                window.addEventListener('testPassive', null, a), window.removeEventListener('testPassive', null, a)
              }
              var o =
                  'undefined' != typeof window &&
                  window.navigator &&
                  window.navigator.platform &&
                  /iP(ad|hone|od)/.test(window.navigator.platform),
                r = [],
                c = !1,
                l = -1,
                i = void 0,
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
                      void 0 !== i && ((document.body.style.overflow = i), (i = void 0))
                  })
                }
              ;(e.disableBodyScroll = function (e, a) {
                if (o) {
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
                    var m = { targetElement: e, options: a || {} }
                    ;(r = [].concat(t(r), [m])),
                      (e.ontouchstart = function (e) {
                        1 === e.targetTouches.length && (l = e.targetTouches[0].clientY)
                      }),
                      (e.ontouchmove = function (t) {
                        var n, a, o, r
                        1 === t.targetTouches.length &&
                          ((a = e),
                          (r = (n = t).targetTouches[0].clientY - l),
                          !u(n.target) &&
                            ((a && 0 === a.scrollTop && 0 < r) ||
                            ((o = a) && o.scrollHeight - o.scrollTop <= o.clientHeight && r < 0)
                              ? d(n)
                              : n.stopPropagation()))
                      }),
                      c || (document.addEventListener('touchmove', d, n ? { passive: !1 } : void 0), (c = !0))
                  }
                } else {
                  ;(h = a),
                    setTimeout(function () {
                      if (void 0 === s) {
                        var e = !!h && !0 === h.reserveScrollBarGap,
                          t = window.innerWidth - document.documentElement.clientWidth
                        e &&
                          0 < t &&
                          ((s = document.body.style.paddingRight), (document.body.style.paddingRight = t + 'px'))
                      }
                      void 0 === i && ((i = document.body.style.overflow), (document.body.style.overflow = 'hidden'))
                    })
                  var v = { targetElement: e, options: a || {} }
                  r = [].concat(t(r), [v])
                }
                var h
              }),
                (e.clearAllBodyScrollLocks = function () {
                  o
                    ? (r.forEach(function (e) {
                        ;(e.targetElement.ontouchstart = null), (e.targetElement.ontouchmove = null)
                      }),
                      c && (document.removeEventListener('touchmove', d, n ? { passive: !1 } : void 0), (c = !1)),
                      (r = []),
                      (l = -1))
                    : (m(), (r = []))
                }),
                (e.enableBodyScroll = function (e) {
                  if (o) {
                    if (!e)
                      return void console.error(
                        'enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.',
                      )
                    ;(e.ontouchstart = null),
                      (e.ontouchmove = null),
                      (r = r.filter(function (t) {
                        return t.targetElement !== e
                      })),
                      c &&
                        0 === r.length &&
                        (document.removeEventListener('touchmove', d, n ? { passive: !1 } : void 0), (c = !1))
                  } else
                    1 === r.length && r[0].targetElement === e
                      ? (m(), (r = []))
                      : (r = r.filter(function (t) {
                          return t.targetElement !== e
                        }))
                })
            })
              ? a.apply(t, o)
              : a) || (e.exports = r)
    },
    xlAh: function (e, t, n) {
      'use strict'
      var a
      n.d(t, 'a', function () {
        return a
      }),
        (function (e) {
          ;(e[(e.SameScale = 0)] = 'SameScale'),
            (e[(e.NewPriceScale = 1)] = 'NewPriceScale'),
            (e[(e.NewPane = 2)] = 'NewPane')
        })(a || (a = {}))
    },
  },
])
