;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['study-market'],
  {
    '++0f': function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none"><path stroke="currentcolor" stroke-width="1.3" d="M12 9l5 5-5 5"/></svg>'
    },
    '+l/S': function (e, t, n) {},
    '/KDZ': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return r
      })
      var i = n('q1tI')
      class r extends i.PureComponent {
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
    '0NLZ': function (e, t, n) {
      e.exports = { container: 'container-12vIMEmh' }
    },
    '2A9e': function (e) {
      e.exports = JSON.parse(
        '{"button":"button-1iktpaT1","content":"content-2PGssb8d","noOutline":"noOutline-d9Yp4qvi","grouped":"grouped-2NxOpIxM","adjust-position":"adjust-position-2zd-ooQC","first-row":"first-row-11wXF7aC","first-col":"first-col-pbJu53tK","no-corner-top-left":"no-corner-top-left-3ZsS65Fk","no-corner-top-right":"no-corner-top-right-3MYQOwk_","no-corner-bottom-right":"no-corner-bottom-right-3II18BAU","no-corner-bottom-left":"no-corner-bottom-left-3KZuX8tv","appearance-default":"appearance-default-dMjF_2Hu","intent-primary":"intent-primary-1-IOYcbg","intent-success":"intent-success-25a4XZXM","intent-default":"intent-default-2ZbSqQDs","intent-warning":"intent-warning-24j5HMi0","intent-danger":"intent-danger-1EETHCla","appearance-stroke":"appearance-stroke-12lxiUSM","appearance-text":"appearance-text-DqKJVT3U","appearance-inverse":"appearance-inverse-r1Y2JQg_","size-s":"size-s-3mait84m","size-m":"size-m-2G7L7Qat","size-l":"size-l-2NEs9_xt","full-width":"full-width-1wU8ljjC","with-icon":"with-icon-yumghDr-","icon":"icon-1grlgNdV"}',
      )
    },
    '2x13': function (e, t, n) {
      e.exports = {
        wrapper: 'wrapper-DggvOZTm',
        container: 'container-DggvOZTm',
        tab: 'tab-DggvOZTm',
        active: 'active-DggvOZTm',
        title: 'title-DggvOZTm',
        icon: 'icon-DggvOZTm',
        titleText: 'titleText-DggvOZTm',
        nested: 'nested-DggvOZTm',
        isTablet: 'isTablet-DggvOZTm',
        isMobile: 'isMobile-DggvOZTm',
      }
    },
    '9DSJ': function (e, t, n) {
      e.exports = {
        'tablet-small-breakpoint': 'screen and (max-width: 428px)',
        dialog: 'dialog-3kc5LZDR',
        dialogLibrary: 'dialogLibrary-3kc5LZDR',
        listContainer: 'listContainer-3kc5LZDR',
        scroll: 'scroll-3kc5LZDR',
        sidebarContainer: 'sidebarContainer-3kc5LZDR',
        noContentBlock: 'noContentBlock-3kc5LZDR',
      }
    },
    An2S: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return d
      }),
        n.d(t, 'c', function () {
          return m
        }),
        n.d(t, 'b', function () {
          return p
        })
      var i = n('q1tI'),
        r = n.n(i),
        a = n('TSYQ'),
        s = n.n(a),
        o = n('Iivm'),
        l = n('++0f'),
        c = n('2x13')
      function u(e) {
        return { isMobile: 'mobile' === e, isTablet: 'tablet' === e }
      }
      function d(e) {
        const { mode: t, className: n, ...i } = e,
          { isMobile: a, isTablet: o } = u(t),
          l = s()(c.container, o && c.isTablet, a && c.isMobile, n)
        return r.a.createElement('div', { ...i, className: l, 'data-role': 'dialog-sidebar' })
      }
      function m(e) {
        return r.a.createElement('div', { className: c.wrapper, ...e })
      }
      function p(e) {
        const { mode: t, title: n, icon: i, isActive: a, onClick: d, ...m } = e,
          { isMobile: p, isTablet: h } = u(t)
        return r.a.createElement(
          'div',
          { ...m, className: s()(c.tab, h && c.isTablet, p && c.isMobile, a && c.active), onClick: d },
          r.a.createElement(o.a, { className: c.icon, icon: i }),
          !h &&
            r.a.createElement(
              'span',
              { className: c.title },
              r.a.createElement('span', { className: c.titleText }, n),
              p && r.a.createElement(o.a, { className: c.nested, icon: l }),
            ),
        )
      }
    },
    PMRz: function (e, t, n) {
      e.exports = {
        'tablet-small-breakpoint': 'screen and (max-width: 428px)',
        container: 'container-3Ywm3-oo',
        selected: 'selected-3Ywm3-oo',
        disabled: 'disabled-3Ywm3-oo',
        favorite: 'favorite-3Ywm3-oo',
        actions: 'actions-3Ywm3-oo',
        highlighted: 'highlighted-3Ywm3-oo',
        light: 'light-3Ywm3-oo',
        'highlight-animation-theme-light': 'highlight-animation-theme-light-3Ywm3-oo',
        dark: 'dark-3Ywm3-oo',
        'highlight-animation-theme-dark': 'highlight-animation-theme-dark-3Ywm3-oo',
        pill: 'pill-3Ywm3-oo',
        main: 'main-3Ywm3-oo',
        paddingLeft: 'paddingLeft-3Ywm3-oo',
        isActive: 'isActive-3Ywm3-oo',
        author: 'author-3Ywm3-oo',
        likes: 'likes-3Ywm3-oo',
      }
    },
    XfUw: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none"><path stroke="currentColor" d="M9 2.13l1.903 3.855.116.236.26.038 4.255.618-3.079 3.001-.188.184.044.259.727 4.237-3.805-2L9 12.434l-.233.122-3.805 2.001.727-4.237.044-.26-.188-.183-3.079-3.001 4.255-.618.26-.038.116-.236L9 2.13z"/></svg>'
    },
    ZWNO: function (e, t, n) {
      'use strict'
      function i(e) {
        let t = 0
        return (
          (e.isTop && e.isLeft) || (t += 1),
          (e.isTop && e.isRight) || (t += 2),
          (e.isBottom && e.isLeft) || (t += 8),
          (e.isBottom && e.isRight) || (t += 4),
          t
        )
      }
      n.d(t, 'a', function () {
        return i
      })
    },
    cu5P: function (e, t, n) {
      e.exports = {
        title: 'title-1gYObTuJ',
        disabled: 'disabled-1gYObTuJ',
        icon: 'icon-1gYObTuJ',
        locked: 'locked-1gYObTuJ',
        open: 'open-1gYObTuJ',
        actionIcon: 'actionIcon-1gYObTuJ',
        selected: 'selected-1gYObTuJ',
        codeIcon: 'codeIcon-1gYObTuJ',
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
    iYOJ: function (e, t, n) {
      e.exports = {
        title: 'title-hq9up-8e',
        small: 'small-hq9up-8e',
        normal: 'normal-hq9up-8e',
        large: 'large-hq9up-8e',
      }
    },
    idtP: function (e, t, n) {
      e.exports = {
        container: 'container-39xfFXyr',
        image: 'image-39xfFXyr',
        title: 'title-39xfFXyr',
        description: 'description-39xfFXyr',
        button: 'button-39xfFXyr',
      }
    },
    jPOK: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return s
      })
      var i = n('q1tI'),
        r = n('TSYQ'),
        a = n('Owlf')
      n('SzKR')
      function s(e) {
        const t = r('tv-spinner', 'tv-spinner--shown', 'tv-spinner--size_' + (e.size || a.a))
        return i.createElement(
          'div',
          { className: t, style: e.style, role: 'progressbar' },
          i.createElement(
            'div',
            { className: 'tv-spinner__spinner-layer' },
            i.createElement('div', { className: 'tv-spinner__background tv-spinner__width_element' }),
            i.createElement('div', {
              className: 'tv-spinner__circle-clipper tv-spinner__width_element tv-spinner__circle-clipper--left',
            }),
            i.createElement('div', {
              className: 'tv-spinner__circle-clipper tv-spinner__width_element tv-spinner__circle-clipper--right',
            }),
          ),
        )
      }
    },
    mwqF: function (e, t, n) {
      'use strict'
      var i = n('q1tI'),
        r = n.n(i),
        a = n('TSYQ'),
        s = n('wwkJ'),
        o = n('ZWNO')
      function l(e, t) {
        const {
            intent: n = 'primary',
            size: i = 'm',
            appearance: r = 'default',
            useFullWidth: s = !1,
            tabIndex: l = 0,
            icon: c,
            className: u,
            isGrouped: d,
            cellState: m,
            disablePositionAdjustment: p = !1,
          } = t,
          h = (function (e, t) {
            let n = ''
            return (
              0 !== e &&
                (1 & e && (n = a(n, t['no-corner-top-left'])),
                2 & e && (n = a(n, t['no-corner-top-right'])),
                4 & e && (n = a(n, t['no-corner-bottom-right'])),
                8 & e && (n = a(n, t['no-corner-bottom-left']))),
              n
            )
          })(Object(o.a)(m), e)
        return a(
          u,
          e.button,
          e['size-' + i],
          e['intent-' + n],
          e['appearance-' + r],
          s && e['full-width'],
          -1 === l && e.noOutline,
          c && 's' !== i && e['with-icon'],
          h,
          d && e.grouped,
          !p && e['adjust-position'],
          m.isTop && e['first-row'],
          m.isLeft && e['first-col'],
        )
      }
      var c = n('2A9e')
      n('+l/S')
      function u(e) {
        const {
            className: t,
            intent: n,
            size: o,
            appearance: u,
            disabled: d,
            useFullWidth: m,
            reference: p,
            icon: h,
            children: g,
            tabIndex: f,
            ...v
          } = e,
          { isGrouped: b, cellState: _, disablePositionAdjustment: y } = Object(i.useContext)(s.a),
          w = l(c, {
            intent: n,
            size: o,
            appearance: u,
            disabled: d,
            useFullWidth: m,
            tabIndex: f,
            icon: h,
            isGrouped: b,
            cellState: _,
            disablePositionAdjustment: y,
          })
        return r.a.createElement(
          'button',
          { className: a(w, t), disabled: d, ref: p, tabIndex: f, ...v },
          h && 's' !== o && r.a.createElement('span', { className: c.icon }, h),
          r.a.createElement('span', { className: c.content }, g),
        )
      }
      n.d(t, 'a', function () {
        return u
      })
    },
    pr86: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return u
      })
      n('YFKU')
      var i = n('q1tI'),
        r = n('TSYQ'),
        a = n('Iivm'),
        s = n('sg5d'),
        o = n('XfUw'),
        l = n('fEjm')
      const c = { add: window.t('Add to favorites'), remove: window.t('Remove from favorites') }
      function u(e) {
        const { className: t, isFilled: n, isActive: u, onClick: d, ...m } = e
        return i.createElement(a.a, {
          ...m,
          className: r(l.favorite, 'apply-common-tooltip', n && l.checked, u && l.active, t),
          icon: n ? s : o,
          onClick: d,
          title: n ? c.remove : c.add,
        })
      }
    },
    sg5d: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none"><path fill="currentColor" d="M9 1l2.35 4.76 5.26.77-3.8 3.7.9 5.24L9 13l-4.7 2.47.9-5.23-3.8-3.71 5.25-.77L9 1z"/></svg>'
    },
    vbTm: function (e, t, n) {
      e.exports = { container: 'container-gb0TB1FN' }
    },
    vqb8: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return r
      })
      var i = n('q1tI')
      const r = e => {
        const t = 'watchedValue' in e ? e.watchedValue : void 0,
          n = 'defaultValue' in e ? e.defaultValue : e.watchedValue.value(),
          [r, a] = Object(i.useState)(t ? t.value() : n)
        return (
          Object(i.useEffect)(() => {
            if (t) {
              a(t.value())
              const e = e => a(e)
              return t.subscribe(e), () => t.unsubscribe(e)
            }
            return () => {}
          }, [t]),
          r
        )
      }
    },
    wwkJ: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return r
      })
      var i = n('q1tI')
      const r = n
        .n(i)
        .a.createContext({ isGrouped: !1, cellState: { isTop: !0, isRight: !0, isBottom: !0, isLeft: !0 } })
    },
    zbLM: function (e, t, n) {
      'use strict'
      n.r(t)
      var i = n('q1tI'),
        r = n.n(i),
        a = n('i8i4'),
        s = n.n(a),
        o = n('YFKU'),
        l = n('mMWL'),
        c = n('CW80'),
        u = n('0YCj'),
        d = n.n(u),
        m = n('Kxc7')
      function p(e, t) {
        const n = e.title.toLowerCase(),
          i = t.title.toLowerCase()
        return n < i ? -1 : n > i ? 1 : 0
      }
      const h = { earning: new RegExp('EPS'), earnings: new RegExp('EPS'), 'trailing twelve months': new RegExp('TTM') }
      function g(e) {
        var t
        const {
            id: n,
            description: i,
            shortDescription: r,
            description_localized: a,
            is_hidden_study: s,
            version: l,
          } = e,
          c =
            m.enabled('graying_disabled_tools_enabled') &&
            (null === (t = window.ChartApiInstance) || void 0 === t
              ? void 0
              : t.studiesAccessController.isToolGrayed(i))
        return {
          id: n,
          title: a || Object(o.t)(i, { context: 'study' }),
          shortDescription: r,
          shortTitle: r,
          isStrategy: d.a.isScriptStrategy(e),
          isHidden: s,
          descriptor: { type: 'java', studyId: e.id },
          packageName: d.a.getPackageName(n),
          isGrayed: c,
          version: l,
        }
      }
      var f = n('TSYQ'),
        v = n.n(f),
        b = n('jPOK'),
        _ = n('g89m'),
        y = n('qFKp'),
        w = n('QHWU'),
        O = n('An2S'),
        E = n('0NLZ')
      function N(e) {
        const { reference: t, className: n, ...i } = e
        return r.a.createElement('div', { ref: t, className: v()(E.container, n), ...i, 'data-role': 'dialog-content' })
      }
      var k = n('cu5P')
      function C(e) {
        const { children: t, className: n, disabled: i } = e
        return r.a.createElement('span', { className: v()(k.title, i && k.disabled, n) }, t)
      }
      const S = r.a.createContext(null)
      var x = n('1LIl'),
        T = n('vqb8'),
        j = n('oiZD'),
        I = n('zM7N'),
        D = n('pr86'),
        Y = n('/3z9'),
        R = n('PMRz')
      function q(e) {
        const t = Object(i.useContext)(S),
          {
            style: n,
            layoutMode: a,
            item: s,
            query: o,
            regExpRules: l,
            isBeta: c,
            isNew: u,
            isUpdated: d,
            isSelected: m,
            isHighlighted: p,
            reference: h,
            onClick: g,
            renderActions: f,
          } = e,
          { isFavorite: b, isStrategy: _, isLocked: y, public: w } = s,
          O = void 0 !== b,
          E = F(g, s),
          N = Object(i.useCallback)(e => e.stopPropagation(), []),
          k = (null == t ? void 0 : t.toggleFavorite) ? F(t.toggleFavorite, s) : void 0,
          Y = Object(T.a)({ watchedValue: j.watchedTheme }) === I.a.Dark ? R.dark : R.light,
          q = v()(R.container, s.isGrayed && R.disabled, m && R.selected, p && R.highlighted, p && Y)
        return r.a.createElement(
          'div',
          {
            ref: h,
            className: q,
            onClick: E,
            style: n,
            'data-role': 'list-item',
            'data-disabled': s.isGrayed,
            'data-title': s.title,
            'data-id': s.id,
          },
          r.a.createElement(
            'div',
            { className: v()(R.main, !O && R.paddingLeft) },
            O && r.a.createElement(D.a, { className: v()(R.favorite, b && R.isActive), isFilled: b, onClick: k }),
            r.a.createElement(
              C,
              { disabled: s.isGrayed },
              r.a.createElement(x.a, { queryString: o, rules: l, text: s.title }),
            ),
            !1,
            c && r.a.createElement(Pill, { label: 'Beta', className: R.pill, color: 'gray' }),
            u && r.a.createElement(Pill, { label: 'New', className: R.pill, color: 'orange' }),
            d && r.a.createElement(Pill, { label: 'Updated', className: R.pill, color: 'green' }),
          ),
          w &&
            r.a.createElement(
              'a',
              { href: w.authorLink, className: R.author, target: '_blank', onClick: N },
              w.authorName,
            ),
          'mobile' !== a && w && r.a.createElement('span', { className: R.likes }, w.likesCount),
          !1,
        )
      }
      function F(e, t) {
        return n => {
          const i = 0 === Object(Y.modifiersFromEvent)(n) && 0 === n.button
          !n.defaultPrevented && e && i && (n.preventDefault(), e(t))
        }
      }
      var P = n('iYOJ')
      function L(e) {
        const { title: t, type: n, className: i } = e
        return r.a.createElement(
          'h3',
          {
            className: v()(P.title, 'Small' === n && P.small, 'Normal' === n && P.normal, 'Large' === n && P.large, i),
          },
          t,
        )
      }
      var M = n('vbTm')
      function Z(e) {
        const { style: t, children: n } = e
        return r.a.createElement('div', { style: t, className: M.container }, n)
      }
      var A = n('Iivm'),
        J = n('mwqF'),
        z = n('idtP')
      function B(e) {
        const { className: t, icon: n, title: i, description: a, buttonText: s, buttonAction: o } = e
        return r.a.createElement(
          'div',
          { className: v()(z.container, t) },
          n && r.a.createElement(A.a, { icon: n, className: z.image }),
          i && r.a.createElement('h3', { className: z.title }, i),
          a && r.a.createElement('p', { className: z.description }, a),
          s && o && r.a.createElement(J.a, { onClick: o, className: z.button }, s),
        )
      }
      function K(e) {
        const [t, n] = Object(i.useState)(null)
        function r(e) {
          return e.findIndex(e => (null == t ? void 0 : t.id) === e.id)
        }
        return [
          t,
          n,
          function () {
            n(
              (function () {
                var n
                const i = r(e),
                  a = i === e.length - 1
                return null === t || -1 === i ? (null !== (n = e[0]) && void 0 !== n ? n : null) : a ? e[i] : e[i + 1]
              })(),
            )
          },
          function () {
            n(
              (function () {
                var n
                const i = r(e)
                return null === t || 0 === i || -1 === i ? (null !== (n = e[0]) && void 0 !== n ? n : null) : e[i - 1]
              })(),
            )
          },
        ]
      }
      var V = n('H9Gg'),
        W = n('9DSJ')
      function G(e) {
        const { reference: t, data: n, isOpened: a, onClose: s, applyStudy: l } = e,
          [c, u] = Object(i.useState)(''),
          d = Object(i.useMemo)(() => Object(V.a)(c, h), [c]),
          m = Object(i.useMemo)(
            () =>
              c
                ? Object(V.c)({
                    data: n,
                    rules: d,
                    queryString: c,
                    primaryKey: 'shortDescription',
                    secondaryKey: 'title',
                    optionalPrimaryKey: 'shortTitle',
                  })
                : n,
            [c, d, n],
          ),
          {
            highlightedItem: p,
            selectedItem: g,
            selectedNodeReference: f,
            scrollContainerRef: E,
            searchInputRef: k,
            onClickStudy: C,
            handleKeyDown: S,
          } = (function (e, t, n, r) {
            let a = 0
            const [s, o] = Object(i.useState)(null),
              l = Object(i.useRef)(null),
              c = Object(i.useRef)(null),
              [u, d, m, p] = K(t),
              h = Object(i.useRef)(null)
            return (
              Object(i.useEffect)(() => {
                e ? g(0) : d(null)
              }, [e]),
              Object(i.useEffect)(() => {
                void 0 !== r && (g(0), d(null))
              }, [r]),
              Object(i.useEffect)(
                () => (
                  s &&
                    (a = setTimeout(() => {
                      o(null)
                    }, 1500)),
                  () => {
                    clearInterval(a)
                  }
                ),
                [s],
              ),
              {
                highlightedItem: s,
                scrollContainerRef: l,
                selectedNodeReference: c,
                selectedItem: u,
                searchInputRef: h,
                onClickStudy: function (e) {
                  if (!n) return
                  n(e), d(e), o(e)
                },
                handleKeyDown: function (e) {
                  const [t, i] = (function (e, t) {
                    if (null === e.current || null === t.current) return [0, 0]
                    const n = e.current.getBoundingClientRect(),
                      i = t.current.getBoundingClientRect(),
                      { height: r } = n,
                      a = n.top - i.top,
                      s = n.bottom - i.bottom + r < 0 ? 0 : r,
                      o = a - r > 0 ? 0 : r,
                      { scrollTop: l } = t.current
                    return [l - o, l + s]
                  })(c, l)
                  40 === Object(Y.hashFromEvent)(e) && (e.preventDefault(), m(), g(i))
                  38 === Object(Y.hashFromEvent)(e) && (e.preventDefault(), p(), g(t))
                  if (13 === Object(Y.hashFromEvent)(e) && u) {
                    if (!n) return
                    n(u), o(u)
                  }
                },
              }
            )
            function g(e) {
              null !== l.current && l.current.scrollTo && l.current.scrollTo(0, e)
            }
          })(a, m, l),
          x = '' === c && !m.length
        return (
          Object(i.useEffect)(() => {
            var e
            a || u(''), y.CheckMobile.any() || null === (e = k.current) || void 0 === e || e.focus()
          }, [a]),
          r.a.createElement(_.a, {
            isOpened: a,
            onClose: s,
            onClickOutside: s,
            className: v()(W.dialogLibrary),
            render: function () {
              return r.a.createElement(
                r.a.Fragment,
                null,
                r.a.createElement(w.a, { reference: k, placeholder: Object(o.t)('Search'), onChange: T, onFocus: j }),
                r.a.createElement(
                  O.c,
                  null,
                  r.a.createElement(
                    N,
                    { reference: E, className: W.scroll },
                    x
                      ? r.a.createElement(b.a, null)
                      : m.length
                      ? r.a.createElement(
                          r.a.Fragment,
                          null,
                          r.a.createElement(Z, null, r.a.createElement(L, { title: Object(o.t)('Script name') })),
                          m.map(e => {
                            const t = (null == g ? void 0 : g.id) === e.id
                            return r.a.createElement(q, {
                              key: e.id,
                              item: e,
                              onClick: () => C(e),
                              query: c,
                              regExpRules: d,
                              reference: t ? f : void 0,
                              isSelected: (null == g ? void 0 : g.id) === e.id,
                              isHighlighted: (null == p ? void 0 : p.id) === e.id,
                            })
                          }),
                        )
                      : r.a.createElement(B, {
                          className: W.noContentBlock,
                          description: Object(o.t)('No indicators matched your criteria.'),
                        }),
                  ),
                ),
              )
            },
            title: Object(o.t)('Indicators'),
            dataName: 'indicators-dialog',
            onKeyDown: S,
            ref: t,
          })
        )
        function T(e) {
          u(e.target.value)
        }
        function j() {
          var e
          c.length > 0 && (null === (e = k.current) || void 0 === e || e.select())
        }
      }
      var U = n('FQhm'),
        Q = n('hY0g'),
        X = n.n(Q)
      n.d(t, 'IndicatorsLibraryContainer', function () {
        return H
      })
      class H extends class {
        constructor(e) {
          ;(this._searchInputRef = r.a.createRef()),
            (this._dialog = r.a.createRef()),
            (this._visibility = new X.a(!1)),
            (this._container = document.createElement('div')),
            (this._isForceRender = !1),
            (this._parentSource = null),
            (this._isDestroyed = !1),
            (this._chartWidgetCollection = e)
        }
        isDestroyed() {
          return this._isDestroyed
        }
        visible() {
          return this._visibility.readonly()
        }
        resetAllStudies() {}
        updateFavorites() {}
        open(e) {
          ;(this._parentSource = null != e ? e : null),
            this._setProps({ isOpened: !0 }),
            this._visibility.setValue(!0),
            U.emit('indicators_dialog')
        }
        show() {
          this.open()
        }
        hide() {
          ;(this._parentSource = null), this._setProps({ isOpened: !1 }), this._visibility.setValue(!1)
        }
        destroy() {
          ;(this._isDestroyed = !0), s.a.unmountComponentAtNode(this._container)
        }
        _shouldPreventRender() {
          return this._isDestroyed || (!this._isForceRender && !this._getProps().value().isOpened)
        }
        _getRenderData() {
          return { props: this._getProps().value(), container: this._getContainer() }
        }
        _applyStudy(e) {
          var t, n
          e.isGrayed
            ? U.emit('onGrayedObjectClicked', { type: 'study', name: e.shortDescription })
            : (y.CheckMobile.any() || null === (t = this._searchInputRef.current) || void 0 === t || t.select(),
              (async function (e, t, n) {
                const i = t.descriptor
                if ('java' === i.type) {
                  const e = Object(c.tryFindStudyLineToolNameByStudyId)(i.studyId)
                  if (null !== e) return l.tool.setValue(e), null
                }
                const r = e.activeChartWidget.value()
                return r ? r.insertStudy(t.descriptor, n, t.shortDescription) : null
              })(this._chartWidgetCollection, e, null !== (n = this._parentSource) && void 0 !== n ? n : void 0).then(
                () => {
                  var e
                  y.CheckMobile.any() ||
                    ((null === document.activeElement ||
                      document.activeElement === document.body ||
                      (null !== this._dialog.current && this._dialog.current.contains(document.activeElement))) &&
                      (null === (e = this._searchInputRef.current) || void 0 === e || e.focus()))
                },
              ))
        }
        _setProps(e) {
          const t = this._getProps().value(),
            { isOpened: n } = t
          this._isForceRender = n && 'isOpened' in e && !e.isOpened
          const i = { ...t, ...e }
          this._getProps().setValue(i)
        }
        _requestBuiltInJavaStudies() {
          return this._chartWidgetCollection.activeChartWidget.value().metaInfoRepository().findAllJavaStudies()
        }
        _focus() {
          var e
          this._getProps().value().isOpened && (null === (e = this._dialog.current) || void 0 === e || e.focus())
        }
        _getContainer() {
          return this._container
        }
        _getDialog() {
          return this._dialog
        }
      } {
        constructor(e, t) {
          super(e),
            (this._studies = {}),
            (this._options = { onWidget: !1 }),
            (this._getStudies = e => this._studies[e] || []),
            t && (this._options = t),
            (this._props = new X.a({
              data: [],
              applyStudy: this._applyStudy.bind(this),
              isOpened: !1,
              reference: this._getDialog(),
              onClose: this.hide.bind(this),
            })),
            this._getProps().subscribe(this._render.bind(this)),
            this._init()
        }
        _getProps() {
          return this._props
        }
        async _init() {
          const e = await this._requestBuiltInJavaStudies()
          this._studies = (function (e) {
            const t = {}
            return (
              e.forEach(e => {
                const { packageName: n } = e
                n in t ? t[n].push(e) : (t[n] = [e])
              }),
              t
            )
          })(
            (function (e, t = !0) {
              return e.filter(e => {
                const n =
                  !!t ||
                  !(function (e) {
                    return e.isStrategy
                  })(e)
                return !e.isHidden && n
              })
            })(e.map(g)),
          )
          const t = [
            ...this._getStudies('tv-basicstudies'),
            ...this._getStudies('Script$STD'),
            ...this._getStudies('tv-volumebyprice'),
          ]
            .filter(e => !e.isStrategy)
            .sort(p)
          this._setProps({ data: t })
        }
        _render() {
          if (this._shouldPreventRender()) return
          const { props: e, container: t } = this._getRenderData()
          s.a.render(r.a.createElement(G, { ...e }), t)
        }
      }
    },
  },
])
