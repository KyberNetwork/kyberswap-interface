;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['currency-label-menu'],
  {
    '1sXn': function (e, t, n) {
      e.exports = { scrollWrap: 'scrollWrap-2-It3_hB' }
    },
    '20PO': function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M9.7 9l4.65-4.65-.7-.7L9 8.29 4.35 3.65l-.7.7L8.29 9l-4.64 4.65.7.7L9 9.71l4.65 4.64.7-.7L9.71 9z"/></svg>'
    },
    '8bbt': function (e, t, n) {
      e.exports = {
        action: 'action-DhEzLCdX',
        hovered: 'hovered-DhEzLCdX',
        active: 'active-DhEzLCdX',
        label: 'label-DhEzLCdX',
        description: 'description-DhEzLCdX',
        small: 'small-DhEzLCdX',
        smallPadding: 'smallPadding-DhEzLCdX',
        centerAlign: 'centerAlign-DhEzLCdX',
        highlighted: 'highlighted-DhEzLCdX',
      }
    },
    '9agd': function (e, t, n) {
      'use strict'
      n.r(t)
      var o = n('q1tI'),
        i = n.n(o),
        a = n('i8i4'),
        c = n.n(a),
        r = n('/KDZ'),
        s = n('uhCe'),
        l = n('Iksw'),
        u = n('YFKU'),
        d = n('Iivm'),
        m = n('9dlw'),
        h = n('DTHj'),
        f = n('nPPD'),
        p = n('H9Gg'),
        g = n('KKsp'),
        v = n('cwLw')
      function C(e, t, n) {
        const o = e.reduce((e, t) => [...e, ...t.actions], [])
        return Object(p.c)({ data: o, rules: n, queryString: t, primaryKey: 'label', secondaryKey: 'description' })
      }
      var E = n('TSYQ'),
        b = n.n(E),
        A = n('1LIl'),
        O = n('8bbt')
      function w(e) {
        const {
            label: t,
            rules: n,
            search: a,
            description: c,
            onClick: r,
            onClose: s,
            isActive: l,
            isSmallSize: u,
          } = e,
          d = Object(o.useCallback)(() => {
            r(), s && s()
          }, [r, s])
        return i.a.createElement(
          'div',
          { className: b()(O.action, l && O.active, u && O.small, !Boolean(c) && O.smallPadding), onClick: d },
          i.a.createElement('div', { className: b()(O.label, u && O.small, !Boolean(c) && !u && O.centerAlign) }, m(t)),
          void 0 !== c && i.a.createElement('div', { className: b()(O.description, u && O.small) }, m(c)),
        )
        function m(e) {
          return i.a.createElement(A.a, {
            text: e,
            rules: n,
            queryString: a,
            className: b()(l && O.highlighted, l && O.active),
          })
        }
      }
      var y = n('9e/V'),
        S = n('20PO'),
        j = n('Znkj'),
        T = n('1sXn')
      const N = Object(f.a)(h.a, T)
      function x(e) {
        const { title: t, sections: n, onClose: a, ...c } = e,
          [r, s] = Object(o.useState)(''),
          [l, h] = Object(o.useState)(() => n.reduce((e, t, n) => (t.name && (e[t.id] = !0), e), {})),
          f = Object(o.useMemo)(() => Object(p.a)(r), [r]),
          E = Object(o.useRef)(null)
        return i.a.createElement(
          m.a,
          {
            ...c,
            onClose: a,
            className: j.menu,
            theme: N,
            maxHeight: 233,
            noMomentumBasedScroll: !0,
            isOpened: !0,
            onOpen: function () {
              var e
              null === (e = E.current) || void 0 === e || e.focus()
            },
          },
          i.a.createElement(
            'div',
            { className: j.header },
            i.a.createElement('div', { className: j.title }, t),
            i.a.createElement(
              'div',
              { className: j.container },
              i.a.createElement(d.a, { icon: y, className: j.icon }),
              i.a.createElement('input', {
                size: 1,
                type: 'text',
                className: j.input,
                placeholder: Object(u.t)('Search'),
                autoComplete: 'off',
                'data-role': 'search',
                onChange: function (e) {
                  s(e.target.value)
                },
                value: r,
                ref: E,
              }),
              Boolean(r) &&
                i.a.createElement(d.a, {
                  icon: S,
                  className: j.clear,
                  onClick: function () {
                    s('')
                  },
                }),
            ),
          ),
          r
            ? C(n, r, f).map(b)
            : n.map((e, t) =>
                i.a.createElement(
                  i.a.Fragment,
                  { key: e.id },
                  Boolean(t) && i.a.createElement(g.a, null),
                  e.name
                    ? i.a.createElement(
                        v.a,
                        {
                          summary: e.name,
                          className: j.section,
                          open: l[e.id],
                          onStateChange: t => h({ ...l, [e.id]: t }),
                        },
                        e.actions.map(b),
                      )
                    : e.actions.map(b),
                ),
              ),
        )
        function b(e) {
          const { id: t, ...n } = e
          return i.a.createElement(w, { key: t, rules: f, search: r, onClose: a, isSmallSize: !0, ...n })
        }
      }
      var D = n('g89m'),
        L = n('QHWU'),
        B = n('sYiF')
      function _(e) {
        const { title: t, onClose: n, sections: a } = e,
          [c, r] = Object(o.useState)(''),
          s = Object(o.useMemo)(() => Object(p.a)(c), [c])
        return i.a.createElement(D.a, {
          title: t,
          onClose: n,
          render: function () {
            return i.a.createElement(
              i.a.Fragment,
              null,
              i.a.createElement(L.a, { placeholder: Object(u.t)('Search'), onChange: l }),
              i.a.createElement(
                'div',
                { className: B.container },
                c
                  ? C(a, c, s).map(e => {
                      const { id: t, isActive: o, ...a } = e
                      return i.a.createElement(w, { key: t, isActive: o, onClose: n, rules: s, search: c, ...a })
                    })
                  : a.map((e, t) =>
                      i.a.createElement(
                        i.a.Fragment,
                        { key: e.id },
                        e.name && i.a.createElement('div', { className: B.section }, e.name),
                        e.actions.map((o, r) => {
                          const { id: l, ...u } = o,
                            d = r === e.actions.length - 1,
                            m = t === a.length - 1
                          return i.a.createElement(
                            i.a.Fragment,
                            { key: l },
                            i.a.createElement(w, { rules: s, search: c, onClose: n, ...u }),
                            !m && d && i.a.createElement('div', { className: B.separator }),
                          )
                        }),
                      ),
                    ),
              ),
            )
          },
          dataName: 'unit-conversion-dialog',
          draggable: !1,
          fullScreen: !0,
          isOpened: !0,
        })
        function l(e) {
          r(e.target.value)
        }
      }
      function z(e) {
        const { element: t, ...n } = e
        return i.a.createElement(r.a, { rule: s.a.TabletSmall }, e =>
          e
            ? i.a.createElement(_, { ...n })
            : i.a.createElement(x, { ...n, position: Object(l.e)(t, {}), doNotCloseOn: t }),
        )
      }
      function k(e, t, n) {
        let o = document.createElement('div')
        const a = () => {
            null !== o && (c.a.unmountComponentAtNode(o), (o = null))
          },
          r = { title: e, sections: n, element: t, onClose: a }
        return c.a.render(i.a.createElement(z, { ...r }), o), { close: a, isOpened: () => null !== o }
      }
      n.d(t, 'showUnitConversion', function () {
        return k
      })
    },
    '9dlw': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return d
      })
      var o = n('q1tI'),
        i = n.n(o),
        a = n('i8i4'),
        c = n.n(a),
        r = n('AiMB'),
        s = n('DTHj'),
        l = n('X0gx'),
        u = n('8Rai')
      function d(e) {
        const {
            controller: t,
            children: n,
            isOpened: a,
            closeOnClickOutside: d = !0,
            doNotCloseOn: m,
            onClickOutside: h,
            onClose: f,
            ...p
          } = e,
          g = Object(o.useContext)(l.a),
          v = Object(u.a)({
            handler: function (e) {
              h && h(e)
              if (!d) return
              if (m && e.target instanceof Node) {
                const t = c.a.findDOMNode(m)
                if (t instanceof Node && t.contains(e.target)) return
              }
              f()
            },
            mouseDown: !0,
            touchStart: !0,
          })
        return a
          ? i.a.createElement(
              r.a,
              { top: '0', left: '0', right: '0', bottom: '0', pointerEvents: 'none' },
              i.a.createElement(
                'span',
                { ref: v, style: { pointerEvents: 'auto' } },
                i.a.createElement(
                  s.b,
                  {
                    ...p,
                    onClose: f,
                    onScroll: function (t) {
                      const { onScroll: n } = e
                      n && n(t)
                    },
                    customCloseDelegate: g,
                    ref: t,
                  },
                  n,
                ),
              ),
            )
          : null
      }
    },
    '9e/V': function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none"><path stroke="currentColor" d="M11.85 11.93A5.48 5.48 0 0 0 8 2.5a5.5 5.5 0 1 0 3.85 9.43zm0 0L16 16"/></svg>'
    },
    Iksw: function (e, t, n) {
      'use strict'
      n.d(t, 'c', function () {
        return o
      }),
        n.d(t, 'a', function () {
          return i
        }),
        n.d(t, 'd', function () {
          return a
        }),
        n.d(t, 'b', function () {
          return c
        }),
        n.d(t, 'e', function () {
          return l
        })
      var o,
        i,
        a,
        c,
        r = n('Eyy1')
      !(function (e) {
        ;(e[(e.Top = 0)] = 'Top'), (e[(e.Bottom = 1)] = 'Bottom')
      })(o || (o = {})),
        (function (e) {
          ;(e[(e.Left = 0)] = 'Left'), (e[(e.Right = 1)] = 'Right')
        })(i || (i = {})),
        (function (e) {
          ;(e[(e.FromTopToBottom = 0)] = 'FromTopToBottom'), (e[(e.FromBottomToTop = 1)] = 'FromBottomToTop')
        })(a || (a = {})),
        (function (e) {
          ;(e[(e.FromLeftToRight = 0)] = 'FromLeftToRight'), (e[(e.FromRightToLeft = 1)] = 'FromRightToLeft')
        })(c || (c = {}))
      const s = {
        verticalAttachEdge: o.Bottom,
        horizontalAttachEdge: i.Left,
        verticalDropDirection: a.FromTopToBottom,
        horizontalDropDirection: c.FromLeftToRight,
        verticalMargin: 0,
        horizontalMargin: 0,
        matchButtonAndListboxWidths: !1,
      }
      function l(e, t) {
        return (n, l) => {
          const u = Object(r.ensureNotNull)(e).getBoundingClientRect(),
            {
              verticalAttachEdge: d = s.verticalAttachEdge,
              verticalDropDirection: m = s.verticalDropDirection,
              horizontalAttachEdge: h = s.horizontalAttachEdge,
              horizontalDropDirection: f = s.horizontalDropDirection,
              horizontalMargin: p = s.horizontalMargin,
              verticalMargin: g = s.verticalMargin,
              matchButtonAndListboxWidths: v = s.matchButtonAndListboxWidths,
            } = t,
            C = d === o.Top ? -1 * g : g,
            E = h === i.Right ? u.right : u.left,
            b = d === o.Top ? u.top : u.bottom,
            A = { x: E - (f === c.FromRightToLeft ? n : 0) + p, y: b - (m === a.FromBottomToTop ? l : 0) + C }
          return v && (A.overrideWidth = u.width), A
        }
      }
    },
    KKsp: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return r
      })
      var o = n('q1tI'),
        i = n('TSYQ'),
        a = n.n(i),
        c = n('NOPy')
      function r(e) {
        const { size: t = 'normal', className: n } = e
        return o.createElement('div', {
          className: a()(
            c.separator,
            'small' === t && c.small,
            'normal' === t && c.normal,
            'large' === t && c.large,
            n,
          ),
        })
      }
    },
    'ML8+': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return s
      })
      var o = n('q1tI'),
        i = n('TSYQ'),
        a = n('Iivm'),
        c = n('cvzQ'),
        r = n('R4+T')
      function s(e) {
        const { dropped: t, className: n } = e
        return o.createElement(a.a, { className: i(n, c.icon, { [c.dropped]: t }), icon: r })
      }
    },
    NOPy: function (e, t, n) {
      e.exports = {
        separator: 'separator-eqcGT_ow',
        small: 'small-eqcGT_ow',
        normal: 'normal-eqcGT_ow',
        large: 'large-eqcGT_ow',
      }
    },
    'R4+T': function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 8" width="16" height="8"><path fill="currentColor" d="M0 1.475l7.396 6.04.596.485.593-.49L16 1.39 14.807 0 7.393 6.122 8.58 6.12 1.186.08z"/></svg>'
    },
    Znkj: function (e, t, n) {
      e.exports = {
        menu: 'menu-__tSsAAY',
        header: 'header-__tSsAAY',
        title: 'title-__tSsAAY',
        container: 'container-__tSsAAY',
        icon: 'icon-__tSsAAY',
        clear: 'clear-__tSsAAY',
        input: 'input-__tSsAAY',
        highlighted: 'highlighted-__tSsAAY',
        active: 'active-__tSsAAY',
        section: 'section-__tSsAAY',
      }
    },
    aWqZ: function (e, t, n) {
      'use strict'
      n.r(t),
        n.d(t, 'currencyActions', function () {
          return a
        })
      var o = n('Eyy1'),
        i = n('YFKU')
      function a(e, t, n) {
        if (null === t || t.readOnly) return []
        const a = [],
          c = (e, t, n, o) => ({ id: e, label: t, isActive: n, onClick: o }),
          r = t => {
            e.setPriceScaleCurrency(n, t)
          },
          s = t.selectedCurrency,
          l = t.originalCurrencies,
          u = t.baseCurrencies,
          d = t.displayedValues,
          m = { id: 'first_section', actions: [] }
        if (l.size > 1) {
          const e = c('Mixed', Object(i.t)('Mixed'), null === t.selectedCurrency, () => r(null))
          m.actions.push(e)
        }
        const h = e.model().availableCurrencies()
        if (null !== s) {
          const e = c(s, Object(o.ensureDefined)(d.get(s)), !0, () => {})
          m.actions.push(e)
        }
        const f = h.filterConvertible(u, e => e !== s && l.has(e))
        for (const e of f) m.actions.push(c(e.id, e.code, t.selectedCurrency === e.id, () => r(e.id)))
        m.actions.length > 0 && a.push(m)
        const p = h.filterConvertible(u, e => e !== s && !l.has(e)),
          g = { id: 'second_section', actions: [] }
        for (const e of p) g.actions.push(c(e.id, e.code, t.selectedCurrency === e.id, () => r(e.id)))
        return g.actions.length > 0 && a.push(g), a
      }
    },
    cvzQ: function (e, t, n) {
      e.exports = { icon: 'icon-19OjtB6A', dropped: 'dropped-19OjtB6A' }
    },
    cwLw: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return l
      })
      var o = n('q1tI'),
        i = n.n(o),
        a = n('TSYQ'),
        c = n.n(a),
        r = n('ML8+'),
        s = n('fioS')
      function l(e) {
        return i.a.createElement(
          i.a.Fragment,
          null,
          i.a.createElement(
            'div',
            {
              className: c()(e.className, s.summary),
              onClick: function () {
                e.onStateChange && e.onStateChange(!e.open)
              },
              'data-open': e.open,
            },
            e.summary,
            i.a.createElement(r.a, { className: s.caret, dropped: Boolean(e.open) }),
          ),
          e.open && e.children,
        )
      }
    },
    fioS: function (e, t, n) {
      e.exports = { summary: 'summary-3UYGeClB', hovered: 'hovered-3UYGeClB', caret: 'caret-3UYGeClB' }
    },
    hpdS: function (e, t, n) {
      'use strict'
      n.r(t),
        n.d(t, 'unitActions', function () {
          return a
        })
      var o = n('Eyy1'),
        i = n('YFKU')
      function a(e, t, n) {
        if (null === t || 0 === t.availableGroups.size) return []
        const a = [],
          c = (e, t, n, o, i) => ({ id: e, label: t, isActive: o, onClick: i, description: n }),
          r = t => {
            e.setPriceScaleUnit(n, t)
          },
          s = t.selectedUnit,
          l = t.originalUnits,
          u = t.names,
          d = t.descriptions,
          m = { actions: [], id: 'first_section' }
        if (l.size > 1) {
          const e = c('Mixed', Object(i.t)('Mixed'), void 0, null === t.selectedUnit, () => r(null))
          m.actions.push(e)
        }
        const h = e.model().availableUnits()
        if (null !== s) {
          const e = c(s, Object(o.ensureDefined)(u.get(s)), Object(o.ensureDefined)(d.get(s)), !0, () => {})
          m.actions.push(e)
        }
        const f = h.unitsByGroups(t.availableGroups)
        for (const e of f)
          for (const t of e.units)
            t.id !== s && l.has(t.id) && m.actions.push(c(t.id, t.name, t.description, !1, () => r(t.id)))
        m.actions.length > 0 && a.push(m)
        const p = s && h.unitGroupById(s)
        if (null !== p)
          for (const e of f) {
            if (e.name !== p) continue
            const t = { id: e.name, actions: [], name: e.name }
            for (const n of e.units)
              n.id === s || l.has(n.id) || t.actions.push(c(n.id, n.name, n.description, !1, () => r(n.id)))
            t.actions.length > 0 && a.push(t)
          }
        for (const e of f) {
          if (e.name === p) continue
          const t = { id: e.name, actions: [], name: e.name }
          for (const n of e.units)
            n.id === s || l.has(n.id) || t.actions.push(c(n.id, n.name, n.description, !1, () => r(n.id)))
          t.actions.length > 0 && a.push(t)
        }
        return a
      }
    },
    nPPD: function (e, t, n) {
      'use strict'
      function o(e, t, n = {}) {
        const o = Object.assign({}, t)
        for (const i of Object.keys(t)) {
          const a = n[i] || i
          a in e && (o[i] = [e[a], t[i]].join(' '))
        }
        return o
      }
      function i(e, t, n = {}) {
        return Object.assign({}, e, o(e, t, n))
      }
      n.d(t, 'b', function () {
        return o
      }),
        n.d(t, 'a', function () {
          return i
        })
    },
    sYiF: function (e, t, n) {
      e.exports = { container: 'container-9xiUj6X_', separator: 'separator-9xiUj6X_', section: 'section-9xiUj6X_' }
    },
  },
])
