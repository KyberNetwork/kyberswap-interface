;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['load-chart-dialog'],
  {
    '8h+f': function (t, e, o) {
      t.exports = {
        container: 'container-1NQ91aze',
        list: 'list-1NQ91aze',
        overlayScrollWrap: 'overlayScrollWrap-1NQ91aze',
        scroll: 'scroll-1NQ91aze',
      }
    },
    EgWQ: function (t, e, o) {
      'use strict'
      o.r(e)
      var n = o('q1tI'),
        i = o.n(n),
        r = o('i8i4'),
        a = o('Eyy1'),
        c = o('YFKU'),
        l = o('Vdly'),
        s = o('qFKp'),
        d = o('g89m'),
        u = o('TSYQ'),
        m = o.n(u),
        h = o('9dlw'),
        f = o('Iksw'),
        g = o('Iivm'),
        v = o('e5nO'),
        b = o('UjII'),
        p = o('HjiN')
      function S(t) {
        const { sortDirection: e, children: o, ...r } = t,
          a = Object(n.useRef)(null),
          [c, l] = Object(n.useState)(!1)
        return i.a.createElement(
          'div',
          {
            ...r,
            ref: a,
            className: u(p.sortButton, 'apply-common-tooltip', 'common-tooltip-vertical'),
            onClick: function () {
              l(!c)
            },
          },
          i.a.createElement(g.a, { className: p.icon, icon: 0 === e ? v : b }),
          i.a.createElement(
            h.a,
            {
              doNotCloseOn: a.current,
              isOpened: c,
              onClose: () => {
                l(!1)
              },
              position: Object(f.e)(a.current, { verticalMargin: -35, verticalAttachEdge: 0 }),
            },
            o,
          ),
        )
      }
      var O = o('N5tr'),
        y = o('H2qI')
      function w(t) {
        const {
            label: e,
            listSortField: o,
            itemSortField: i,
            listSortDirection: r,
            itemSortDirection: a,
            onClick: c,
            className: l,
            ...s
          } = t,
          d = i === o && a === r
        return n.createElement(O.b, {
          ...s,
          className: u(y.container, l),
          label: n.createElement(
            'div',
            { className: y.labelWrap },
            n.createElement(g.a, { className: y.icon, icon: 0 === a ? v : b }),
            n.createElement('span', { className: y.text }, e),
          ),
          isActive: d,
          onClick: function () {
            c(i, a)
          },
          'data-active': d.toString(),
          'data-sort-field': i,
          'data-sort-direction': 0 === a ? 'asc' : 'desc',
        })
      }
      var E = o('QHWU'),
        j = o('IePd')
      function C(t) {
        const { children: e, className: o } = t
        return i.a.createElement('div', { className: m()(j.container, o) }, e)
      }
      function F(t) {
        const { title: e } = t
        return i.a.createElement('div', { className: j.title }, e)
      }
      var D = o('ivNn')
      var N = o('iR1w'),
        x = o('cvc5'),
        T = o.n(x),
        R = o('Ialn'),
        k = o('9S1y'),
        I = o('n9z6')
      var M = o('0lNN'),
        L = o('8h+f')
      function A(t) {
        const { className: e, onScroll: o, onTouchStart: r, reference: a, children: c, scrollbar: l, ...d } = t,
          [u, h] = Object(k.a)(),
          [f, g, v, b] = Object(I.a)()
        return (
          Object(n.useEffect)(() => {
            const t = () => {}
            return s.isFF
              ? (document.addEventListener('wheel', () => t),
                () => {
                  document.removeEventListener('wheel', t)
                })
              : t
          }, []),
          i.a.createElement(
            T.a,
            { onMeasure: u },
            i.a.createElement(
              'div',
              { ...('overlay' === l && g), className: m()(L.container, e), onTouchStart: r, onScrollCapture: o },
              'overlay' === l && i.a.createElement(M.a, { ...f, className: L.overlayScrollWrap }),
              i.a.createElement(N.a, {
                ref: a,
                className: m()('native' === l ? L.scroll : L.list),
                outerRef: 'overlay' === l ? v : void 0,
                onItemsRendered: b,
                layout: 'vertical',
                width: '100%',
                height: (null == h ? void 0 : h.height) || 0,
                children: c,
                direction: Object(R.isRtl)() ? 'rtl' : 'ltr',
                ...d,
              }),
            ),
          )
        )
      }
      var B = o('mNbo')
      var W = o('gM3K'),
        z = o('pPtI'),
        K = o('+EG+'),
        P = o('fZEr')
      var Q = o('gQ5K'),
        q = o('4kQX'),
        _ = o('1LIl'),
        J = o('H9Gg'),
        V = o('iJYK')
      const U = Object(c.t)("Do you really want to delete Chart Layout '{name}' ?")
      const H = new Q.DateFormatter('dd-MM-yyyy'),
        Y = new q.TimeFormatter('%h:%m')
      function X(t) {
        const {
            chart: e,
            chartWidgetCollection: o,
            trackEvent: r,
            localFavorites: a,
            onClose: c,
            searchString: l,
            onClickRemove: s,
            onRemoveCanceled: d,
            isSelected: u,
          } = t,
          [h, f] = Object(n.useState)(() => e.active()),
          g = (function (t) {
            const e = t.chartId ? `/chart/${t.chartId}/` : '/chart/',
              o = new URL(e, location.href)
            return (
              t.symbol && o.searchParams.append('symbol', t.symbol),
              t.interval && o.searchParams.append('interval', t.interval),
              t.style && o.searchParams.append('style', t.style),
              Object(B.urlWithMobileAppParams)(o.href)
            )
          })({ chartId: e.url }),
          v = Object(n.useContext)(K.b),
          b = Object(n.useMemo)(() => new Date(1e3 * e.modified), [e]),
          p = Object(n.useMemo)(() => Object(J.a)(l), [l]),
          S = m()(V.highlight, h && V.active)
        return (
          Object(n.useEffect)(
            () => (
              o && o.metaInfo.id.subscribe(y),
              () => {
                o && o.metaInfo.id.unsubscribe(y)
              }
            ),
            [],
          ),
          i.a.createElement(W.a, {
            url: g,
            title: i.a.createElement(_.a, { className: S, queryString: l, rules: p, text: e.title }),
            subtitle: i.a.createElement(
              i.a.Fragment,
              null,
              i.a.createElement(_.a, { className: S, queryString: l, rules: p, text: e.description }),
              ' ',
              '(',
              H.format(b).replace(/-/g, '.'),
              ' ',
              Y.formatLocal(b),
              ')',
            ),
            onClick: function (t) {
              0
              e.openAction(), !1
            },
            onClickFavorite: function () {
              0
              const t = { ...a }
              t[e.id] ? delete t[e.id] : (t[e.id] = !0)
              e.favoriteAction(t)
            },
            onClickRemove: function () {
              !(function (t, e, o, n) {
                Object(P.showConfirm)(
                  {
                    text: t,
                    onConfirm: ({ dialogClose: t }) => {
                      e(), t()
                    },
                    onClose: () => {
                      o()
                    },
                  },
                  n,
                )
              })(U.format({ name: e.title }), O, d, v)
            },
            isFavorite: Boolean(a[e.id]),
            isActive: h,
            isSelected: u,
            'data-name': 'load-chart-dialog-item',
          })
        )
        function O() {
          e.deleteAction().then(() => s(e.id))
        }
        function y(t) {
          f(e.id === t)
        }
      }
      var Z = o('tWVy'),
        $ = o('/3z9')
      var G = o('YCUu')
      const tt = { sortField: 'modified', sortDirection: 1 },
        et = (function (t) {
          const { paddingTop: e = 0, paddingBottom: o = 0 } = t
          return Object(n.forwardRef)(({ style: t, ...n }, r) => {
            const { height: a = 0 } = t
            return i.a.createElement('div', {
              ref: r,
              style: { ...t, height: (Object(D.isNumber)(a) ? a : parseFloat(a)) + e + o + 'px' },
              ...n,
            })
          })
        })({ paddingBottom: 6 })
      function ot(t) {
        let e
        try {
          e = Object(z.getTranslatedResolution)(t)
        } catch (o) {
          e = t
        }
        return e
      }
      function nt(t) {
        const { charts: e, onClose: o, favoriteChartsService: r, chartWidgetCollection: c } = t,
          [u, m] = Object(n.useState)(''),
          [h, f] = Object(n.useState)(u),
          [g, v] = Object(n.useState)([]),
          b = Object(n.useRef)(null),
          [p, O] = Object(n.useState)(() => r.get()),
          [y, j] = Object(n.useState)(() => l.getJSON('loadChartDialog.viewState', tt)),
          D = Object(n.useRef)(null),
          N = Object(n.useRef)(null),
          x = Object(n.useMemo)(() => e.map(t => ({ ...t, description: `${t.symbol}, ${ot(t.interval)}` })), [e])
        Object(n.useEffect)(() => {
          s.CheckMobile.any() || Object(a.ensureNotNull)(D.current).focus()
        }, [])
        const T = Object(n.useRef)()
        Object(n.useEffect)(
          () => (
            (T.current = setTimeout(() => {
              m(h)
            }, 300)),
            () => {
              clearTimeout(T.current)
            }
          ),
          [h],
        ),
          Object(n.useEffect)(
            () => (
              r.getOnChange().subscribe(null, P),
              () => {
                r.getOnChange().unsubscribe(null, P)
              }
            ),
            [],
          )
        const R = Object(n.useCallback)(() => !0, []),
          k = Object(n.useMemo)(() => {
            return Object(J.c)({
              data: x
                .filter(t => !g.includes(t.id))
                .sort(
                  ((t = y.sortDirection),
                  (e, o) => {
                    if (p[e.id] && !p[o.id]) return -1
                    if (!p[e.id] && p[o.id]) return 1
                    const n = 0 === t ? 1 : -1
                    return 'modified' === y.sortField
                      ? n * (e.modified - o.modified)
                      : n * e.title.localeCompare(o.title)
                  }),
                ),
              rules: Object(J.a)(u),
              queryString: u,
              primaryKey: 'title',
              secondaryKey: 'description',
            })
            var t
          }, [u, y, g, p]),
          {
            selectedItemIndex: I,
            setSelectedItemIndex: M,
            handleKeyboardSelection: L,
          } = (function (t, e, o) {
            const [i, r] = Object(n.useState)(-1)
            return (
              Object(n.useEffect)(() => {
                var t
                ;-1 !== i && (null === (t = o.current) || void 0 === t || t.scrollToItem(i))
              }, [i]),
              {
                selectedItemIndex: i,
                setSelectedItemIndex: r,
                handleKeyboardSelection: function (o) {
                  switch (Object($.hashFromEvent)(o)) {
                    case 40:
                      if (i === t - 1) return
                      r(i + 1)
                      break
                    case 38:
                      if (0 === i) return
                      if (-1 === i) return void r(i + 1)
                      r(i - 1)
                      break
                    case 13:
                      e(o)
                  }
                },
              }
            )
          })(
            k.length,
            function (t) {
              const e = k[I]
              if (-1 === I || !e) return
              0
              e.openAction(), !1
            },
            N,
          )
        return i.a.createElement(d.a, {
          ref: b,
          onClose: o,
          onClickOutside: o,
          onKeyDown: L,
          isOpened: !0,
          className: G.dialog,
          title: window.t('Load layout'),
          dataName: 'load-layout-dialog',
          render: function () {
            return i.a.createElement(
              i.a.Fragment,
              null,
              i.a.createElement(E.a, { reference: D, onChange: W, placeholder: window.t('Search') }),
              i.a.createElement(
                C,
                null,
                i.a.createElement(F, { title: window.t('Layout name') }),
                i.a.createElement(
                  S,
                  {
                    sortDirection: y.sortDirection,
                    title: window.t('Sort by layout name, date changed'),
                    'data-name': 'load-chart-dialog-sort-button',
                  },
                  i.a.createElement(w, {
                    label: window.t('Layout name (A to Z)'),
                    listSortField: y.sortField,
                    itemSortField: 'title',
                    listSortDirection: y.sortDirection,
                    itemSortDirection: 0,
                    onClick: q,
                    'data-name': 'load-chart-dialog-sort-menu-item',
                  }),
                  i.a.createElement(w, {
                    label: window.t('Layout name (Z to A)'),
                    listSortField: y.sortField,
                    itemSortField: 'title',
                    listSortDirection: y.sortDirection,
                    itemSortDirection: 1,
                    onClick: q,
                    'data-name': 'load-chart-dialog-sort-menu-item',
                  }),
                  i.a.createElement(w, {
                    label: window.t('Date modified (oldest first)'),
                    listSortField: y.sortField,
                    itemSortField: 'modified',
                    listSortDirection: y.sortDirection,
                    itemSortDirection: 0,
                    onClick: q,
                    'data-name': 'load-chart-dialog-sort-menu-item',
                  }),
                  i.a.createElement(w, {
                    label: window.t('Date modified (newest first)'),
                    listSortField: y.sortField,
                    itemSortField: 'modified',
                    listSortDirection: y.sortDirection,
                    itemSortDirection: 1,
                    onClick: q,
                    'data-name': 'load-chart-dialog-sort-menu-item',
                  }),
                ),
              ),
              i.a.createElement(A, {
                scrollbar: 'native',
                reference: N,
                itemCount: k.length,
                itemSize: 52,
                className: G.contentList,
                onScroll: B,
                innerElementType: et,
                itemKey: t => (p[k[t].id] ? 'f_' : '') + k[t].id,
                children: ({ style: t, index: e }) =>
                  i.a.createElement(
                    'div',
                    { style: t },
                    i.a.createElement(X, {
                      chart: k[e],
                      onClose: o,
                      chartWidgetCollection: c,
                      trackEvent: z,
                      onRemoveCanceled: Q,
                      localFavorites: p,
                      searchString: u,
                      onClickRemove: K,
                      isSelected: e === I,
                    }),
                  ),
              }),
            )
          },
          forceCloseOnEsc: R,
        })
        function B() {
          Z.a.fire()
        }
        function W(t) {
          const e = t.currentTarget.value
          f(e), M(-1)
        }
        function z(t) {
          0
        }
        function K(t) {
          v([t, ...g])
        }
        function P(t) {
          O(t)
        }
        function Q() {
          Object(a.ensureNotNull)(b.current).focus()
        }
        function q(t, e) {
          const o = { sortField: t, sortDirection: e }
          j(o), l.setValue('loadChartDialog.viewState', JSON.stringify(o), { forceFlush: !0 }), z()
        }
      }
      var it = o('sQaR')
      o.d(e, 'LoadChartDialogRenderer', function () {
        return rt
      })
      class rt extends it.a {
        constructor(t) {
          super(), (this._options = t)
        }
        show() {
          r.render(n.createElement(nt, { ...this._options, onClose: () => this.hide() }), this._container),
            this._setVisibility(!0)
        }
        hide() {
          r.unmountComponentAtNode(this._container), this._setVisibility(!1)
        }
      }
    },
    H2qI: function (t, e, o) {
      t.exports = {
        container: 'container-xPtOXn4t',
        labelWrap: 'labelWrap-xPtOXn4t',
        icon: 'icon-xPtOXn4t',
        text: 'text-xPtOXn4t',
      }
    },
    HjiN: function (t, e, o) {
      t.exports = { sortButton: 'sortButton-Srpxcu6T', icon: 'icon-Srpxcu6T' }
    },
    IePd: function (t, e, o) {
      t.exports = { container: 'container-30_lleAw', title: 'title-30_lleAw' }
    },
    Iksw: function (t, e, o) {
      'use strict'
      o.d(e, 'c', function () {
        return n
      }),
        o.d(e, 'a', function () {
          return i
        }),
        o.d(e, 'd', function () {
          return r
        }),
        o.d(e, 'b', function () {
          return a
        }),
        o.d(e, 'e', function () {
          return s
        })
      var n,
        i,
        r,
        a,
        c = o('Eyy1')
      !(function (t) {
        ;(t[(t.Top = 0)] = 'Top'), (t[(t.Bottom = 1)] = 'Bottom')
      })(n || (n = {})),
        (function (t) {
          ;(t[(t.Left = 0)] = 'Left'), (t[(t.Right = 1)] = 'Right')
        })(i || (i = {})),
        (function (t) {
          ;(t[(t.FromTopToBottom = 0)] = 'FromTopToBottom'), (t[(t.FromBottomToTop = 1)] = 'FromBottomToTop')
        })(r || (r = {})),
        (function (t) {
          ;(t[(t.FromLeftToRight = 0)] = 'FromLeftToRight'), (t[(t.FromRightToLeft = 1)] = 'FromRightToLeft')
        })(a || (a = {}))
      const l = {
        verticalAttachEdge: n.Bottom,
        horizontalAttachEdge: i.Left,
        verticalDropDirection: r.FromTopToBottom,
        horizontalDropDirection: a.FromLeftToRight,
        verticalMargin: 0,
        horizontalMargin: 0,
        matchButtonAndListboxWidths: !1,
      }
      function s(t, e) {
        return (o, s) => {
          const d = Object(c.ensureNotNull)(t).getBoundingClientRect(),
            {
              verticalAttachEdge: u = l.verticalAttachEdge,
              verticalDropDirection: m = l.verticalDropDirection,
              horizontalAttachEdge: h = l.horizontalAttachEdge,
              horizontalDropDirection: f = l.horizontalDropDirection,
              horizontalMargin: g = l.horizontalMargin,
              verticalMargin: v = l.verticalMargin,
              matchButtonAndListboxWidths: b = l.matchButtonAndListboxWidths,
            } = e,
            p = u === n.Top ? -1 * v : v,
            S = h === i.Right ? d.right : d.left,
            O = u === n.Top ? d.top : d.bottom,
            y = { x: S - (f === a.FromRightToLeft ? o : 0) + g, y: O - (m === r.FromBottomToTop ? s : 0) + p }
          return b && (y.overrideWidth = d.width), y
        }
      }
    },
    UjII: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M19.5 18.5h-3M21.5 13.5h-5M23.5 8.5h-7M8.5 7v13.5M4.5 16.5l4 4 4-4"/></svg>'
    },
    YCUu: function (t, e, o) {
      t.exports = { dialog: 'dialog-1xjtlTJV', contentList: 'contentList-1xjtlTJV' }
    },
    e5nO: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M19.5 18.5h-3M21.5 13.5h-5M23.5 8.5h-7M8.5 20.5V7M12.5 11l-4-4-4 4"/></svg>'
    },
    iJYK: function (t, e, o) {
      t.exports = { highlight: 'highlight-1aROqc2m', active: 'active-1aROqc2m' }
    },
  },
])
