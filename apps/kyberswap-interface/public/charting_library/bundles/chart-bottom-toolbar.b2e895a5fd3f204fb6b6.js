;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['chart-bottom-toolbar'],
  {
    '+GaQ': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return a
      })
      var i = n('q1tI')
      function a(e) {
        if (e.map) {
          return i.Children.toArray(e.children).map(e.map)
        }
        return e.children
      }
    },
    '02pg': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return o
      })
      var i = n('q1tI'),
        a = n('TSYQ'),
        s = n('XiJV')
      function o(e) {
        return i.createElement('div', { className: a(s.separator, e.className) })
      }
    },
    '1TxM': function (e, t, n) {
      'use strict'
      n.d(t, 'c', function () {
        return l
      }),
        n.d(t, 'a', function () {
          return c
        }),
        n.d(t, 'b', function () {
          return h
        })
      var i = n('q1tI'),
        a = n.n(i),
        s = n('17x9'),
        o = n.n(s)
      const r = a.a.createContext({})
      function l(e, t) {
        o.a.checkPropTypes(t, e, 'context', 'RegistryContext')
      }
      function c(e) {
        const { validation: t, value: n } = e
        return l(n, t), a.a.createElement(r.Provider, { value: n }, e.children)
      }
      function h() {
        return r
      }
    },
    '20PO': function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M9.7 9l4.65-4.65-.7-.7L9 8.29 4.35 3.65l-.7.7L8.29 9l-4.64 4.65.7.7L9 9.71l4.65 4.64.7-.7L9.71 9z"/></svg>'
    },
    '2mG+': function (e, t, n) {
      e.exports = { button: 'button-2-onvH7F' }
    },
    '5o6O': function (e, t, n) {
      e.exports = {
        tabs: 'tabs-3I2ohC86',
        tab: 'tab-3I2ohC86',
        noBorder: 'noBorder-3I2ohC86',
        disabled: 'disabled-3I2ohC86',
        active: 'active-3I2ohC86',
        defaultCursor: 'defaultCursor-3I2ohC86',
        slider: 'slider-3I2ohC86',
        content: 'content-3I2ohC86',
      }
    },
    '6KyJ': function (e, t, n) {
      'use strict'
      var i,
        a = n('q1tI'),
        s = n('TSYQ'),
        o = n('K9GE'),
        r = n('YZ9j')
      n('O7m7')
      !(function (e) {
        ;(e[(e.Initial = 0)] = 'Initial'), (e[(e.Appear = 1)] = 'Appear'), (e[(e.Active = 2)] = 'Active')
      })(i || (i = {}))
      class l extends a.PureComponent {
        constructor(e) {
          super(e), (this._stateChangeTimeout = null), (this.state = { state: i.Initial })
        }
        render() {
          const { className: e, color: t = 'black' } = this.props,
            n = s(r.item, { [r[t]]: Boolean(t) })
          return a.createElement(
            'span',
            { className: s(r.loader, e, this._getStateClass()) },
            a.createElement('span', { className: n }),
            a.createElement('span', { className: n }),
            a.createElement('span', { className: n }),
          )
        }
        componentDidMount() {
          this.setState({ state: i.Appear }),
            (this._stateChangeTimeout = setTimeout(() => {
              this.setState({ state: i.Active })
            }, 2 * o.b))
        }
        componentWillUnmount() {
          this._stateChangeTimeout && (clearTimeout(this._stateChangeTimeout), (this._stateChangeTimeout = null))
        }
        _getStateClass() {
          switch (this.state.state) {
            case i.Initial:
              return r['loader-initial']
            case i.Appear:
              return r['loader-appear']
            default:
              return ''
          }
        }
      }
      n.d(t, 'a', function () {
        return l
      })
    },
    '9VJd': function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none"><path stroke="currentColor" d="M5.5 13v-2.5m8.5 11h6.5a2 2 0 0 0 2-2v-9m-17 0v-2c0-1.1.9-2 2-2h13a2 2 0 0 1 2 2v2m-17 0h17"/><path fill="currentColor" d="M10 4h1v4h-1V4zM17 4h1v4h-1V4z"/><path stroke="currentColor" d="M4 18.5h7.5m0 0L8 22m3.5-3.5L8 15"/></svg>'
    },
    '9dlw': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return d
      })
      var i = n('q1tI'),
        a = n.n(i),
        s = n('i8i4'),
        o = n.n(s),
        r = n('AiMB'),
        l = n('DTHj'),
        c = n('X0gx'),
        h = n('8Rai')
      function d(e) {
        const {
            controller: t,
            children: n,
            isOpened: s,
            closeOnClickOutside: d = !0,
            doNotCloseOn: u,
            onClickOutside: m,
            onClose: g,
            ...p
          } = e,
          b = Object(i.useContext)(c.a),
          v = Object(h.a)({
            handler: function (e) {
              m && m(e)
              if (!d) return
              if (u && e.target instanceof Node) {
                const t = o.a.findDOMNode(u)
                if (t instanceof Node && t.contains(e.target)) return
              }
              g()
            },
            mouseDown: !0,
            touchStart: !0,
          })
        return s
          ? a.a.createElement(
              r.a,
              { top: '0', left: '0', right: '0', bottom: '0', pointerEvents: 'none' },
              a.a.createElement(
                'span',
                { ref: v, style: { pointerEvents: 'auto' } },
                a.a.createElement(
                  l.b,
                  {
                    ...p,
                    onClose: g,
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
    ApAi: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path fill="none" stroke="currentColor" d="M11 1.5h3.5a2 2 0 0 1 2 2V7m0 5v2.5a2 2 0 0 1-2 2H11m-4 0H3.5a2 2 0 0 1-2-2V11m0-4V3.5a2 2 0 0 1 2-2H7"/></svg>'
    },
    'J+f8': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return a
      })
      var i = n('q1tI')
      const a = i.createContext(!1)
    },
    J3OW: function (e, t, n) {
      e.exports = { button: 'button-15caiVtH', separator: 'separator-15caiVtH' }
    },
    K3s3: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return r
      }),
        n.d(t, 'b', function () {
          return l
        }),
        n.d(t, 'c', function () {
          return c
        })
      var i = n('q1tI'),
        a = n('TSYQ'),
        s = n('Eyy1'),
        o = n('5o6O')
      const r = o
      function l(e) {
        const t = a(e.className, o.tab, {
          [o.active]: e.isActive,
          [o.disabled]: e.isDisabled,
          [o.defaultCursor]: !!e.shouldUseDefaultCursor,
          [o.noBorder]: !!e.noBorder,
        })
        return i.createElement(
          'div',
          {
            className: t,
            onClick: e.onClick,
            ref: e.reference,
            'data-type': 'tab-item',
            'data-value': e.value,
            'data-name': 'tab-item-' + e.value.toString().toLowerCase(),
          },
          e.children,
        )
      }
      function c(e) {
        return class extends i.PureComponent {
          constructor() {
            super(...arguments), (this.activeTab = { current: null })
          }
          componentDidUpdate() {
            ;(Object(s.ensureNotNull)(this._slider).style.transition = 'transform 350ms'), this._componentDidUpdate()
          }
          componentDidMount() {
            this._componentDidUpdate()
          }
          render() {
            const { className: t } = this.props,
              n = this._generateTabs()
            return i.createElement(
              'div',
              { className: a(t, o.tabs), 'data-name': this.props['data-name'] },
              n,
              i.createElement(e, {
                reference: e => {
                  this._slider = e
                },
              }),
            )
          }
          _generateTabs() {
            return (
              (this.activeTab.current = null),
              i.Children.map(this.props.children, e => {
                const t = e,
                  n = Boolean(t.props.isActive),
                  a = {
                    reference: e => {
                      n && (this.activeTab.current = e), t.props.reference && t.props.reference(e)
                    },
                  }
                return i.cloneElement(t, a)
              })
            )
          }
          _componentDidUpdate() {
            const e = Object(s.ensureNotNull)(this._slider).style
            if (this.activeTab.current) {
              const t = this.activeTab.current.offsetWidth,
                n = this.activeTab.current.offsetLeft
              ;(e.transform = `translateX(${n}px)`), (e.width = t + 'px'), (e.opacity = '1')
            } else e.opacity = '0'
          }
        }
      }
      c(function (e) {
        return i.createElement('div', { className: o.slider, ref: e.reference })
      })
    },
    KKsp: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return r
      })
      var i = n('q1tI'),
        a = n('TSYQ'),
        s = n.n(a),
        o = n('NOPy')
      function r(e) {
        const { size: t = 'normal', className: n } = e
        return i.createElement('div', {
          className: s()(
            o.separator,
            'small' === t && o.small,
            'normal' === t && o.normal,
            'large' === t && o.large,
            n,
          ),
        })
      }
    },
    MfqI: function (e, t, n) {
      'use strict'
      n.r(t)
      var i = n('q1tI'),
        a = n.n(i),
        s = n('i8i4'),
        o = n('YFKU'),
        r = n('17x9'),
        l = n('TSYQ'),
        c = n('cvc5'),
        h = n('Kxc7'),
        d = n('82wv'),
        u = n('Iksw'),
        m = n('tWVy'),
        g = n('/KDZ'),
        p = n('N5tr'),
        b = n('KKsp'),
        v = n('Eyy1'),
        f = n('JWMC'),
        _ = n('1TxM'),
        C = n('aIyQ'),
        S = n.n(C),
        y = n('dfhE')
      class E {
        constructor(e) {
          ;(this._state = { ranges: [] }),
            (this._change = new S.a()),
            (this._rangeChangedListenerBound = this._onRangeChanged.bind(this))
          const { chartWidget: t } = (this._context = e)
          t.withModel(null, () => {
            const e = t.model(),
              n = e.mainSeries()
            n.onStatusChanged().subscribe(this, this._updateAvailableRanges),
              h.enabled('update_timeframes_set_on_symbol_resolve') &&
                n.dataEvents().symbolResolved().subscribe(this, this._updateAvailableRanges),
              n.priceScale().properties().childs().lockScale.subscribe(this, this._updateAvailableRanges)
            const i = e.model().appliedTimeFrame()
            i.subscribe(this._rangeChangedListenerBound),
              this._rangeChangedListenerBound(i.value()),
              this._updateAvailableRanges()
          })
        }
        state() {
          return this._state
        }
        onChange() {
          return this._change
        }
        selectRange(e) {
          this._setState({ activeRange: e.value.value })
          const { chartWidgetCollection: t } = this._context,
            n = { val: e.value, res: e.targetResolution }
          t.setTimeFrame(n)
        }
        destroy() {
          const { chartWidget: e } = this._context
          e.withModel(null, () => {
            const t = e.model(),
              n = t.mainSeries()
            n.onStatusChanged().unsubscribe(this, this._updateAvailableRanges),
              h.enabled('update_timeframes_set_on_symbol_resolve') &&
                n.dataEvents().symbolResolved().unsubscribe(this, this._updateAvailableRanges),
              n.priceScale().properties().childs().lockScale.unsubscribe(this, this._updateAvailableRanges),
              t.model().appliedTimeFrame().unsubscribe(this._rangeChangedListenerBound)
          }),
            this._change.destroy()
        }
        _setState(e) {
          ;(this._state = Object.assign({}, this._state, e)), this._change.fire(this._state)
        }
        _onRangeChanged(e) {
          let t
          null !== e && 'period-back' === e.val.type && (t = e.val.value), this._setState({ activeRange: t })
        }
        _updateAvailableRanges() {
          const { availableTimeFrames: e, chartWidget: t } = this._context
          if (!t.hasModel()) return
          const n = t.model().mainSeries(),
            i = n.status()
          if (i === y.STATUS_LOADING || i === y.STATUS_RESOLVING) return
          const a = e(n.symbolInfo(), n.status())
          0 !== a.length && this._setState({ ranges: a })
        }
      }
      const x = Object(_.b)()
      function w(e) {
        var t
        return (
          ((t = class extends i.PureComponent {
            constructor(e, t) {
              super(e, t),
                (this._handleUpdate = e => {
                  this.setState(e)
                }),
                (this._handleSelectRange = e => {
                  Object(f.trackEvent)('GUI', 'Chart Bottom Toolbar', 'range ' + e.value), this._binding.selectRange(e)
                }),
                Object(_.c)(t, {
                  availableTimeFrames: r.any.isRequired,
                  chartWidgetCollection: r.any.isRequired,
                  chartWidget: r.any.isRequired,
                }),
                N.has(t.chartWidget) || N.set(t.chartWidget, new E(t))
              const n = (this._binding = Object(v.ensureDefined)(N.get(t.chartWidget)))
              this.state = n.state()
            }
            componentDidMount() {
              this._binding.onChange().subscribe(this, this._handleUpdate)
            }
            componentWillUnmount() {
              this._binding.onChange().unsubscribe(this, this._handleUpdate)
            }
            render() {
              return i.createElement(e, {
                goToDateButton: this.props.goToDateButton,
                className: this.props.className,
                ranges: this.state.ranges,
                activeRange: this.state.activeRange,
                onSelectRange: this._handleSelectRange,
              })
            }
          }).contextType = x),
          t
        )
      }
      const N = new WeakMap()
      var R = n('cdbK'),
        T = n('l4ku'),
        k = n('02pg'),
        M = n('2uTr'),
        A = n('9VJd'),
        W = n('J3OW')
      function O(e) {
        const { ranges: t, activeRange: n, onSelectRange: i } = e
        return a.a.createElement(
          a.a.Fragment,
          null,
          t.map(e =>
            a.a.createElement(T.a, {
              key: e.value.value,
              label: e.description || e.text,
              active: n === e.value.value,
              checked: n === e.value.value,
              checkable: !0,
              disabled: !1,
              onClick: s.bind(null, e),
              doNotCloseOnClick: !1,
              subItems: [],
            }),
          ),
        )
        function s(e) {
          e && i && i(e), Object(m.b)()
        }
      }
      function B(e) {
        const { onGoToDateClick: t } = e
        return a.a.createElement(
          a.a.Fragment,
          null,
          a.a.createElement(k.a, { className: W.separator }),
          a.a.createElement(T.a, {
            icon: A,
            label: Object(M.appendEllipsis)(Object(o.t)('Go to')),
            onClick: t,
            active: !1,
            checked: !1,
            checkable: !1,
            disabled: !1,
            doNotCloseOnClick: !1,
            subItems: [],
          }),
        )
      }
      const j = { title: window.t('Date Range'), goToDate: Object(M.appendEllipsis)(window.t('Go to')) },
        I = Object(_.b)()
      class D extends i.PureComponent {
        constructor(e, t) {
          super(e, t),
            (this._handleGoToDateClick = () => {
              const { chartWidget: e } = this.context
              Object(R.showGoToDateDialog)(e), Object(m.b)()
            }),
            (this._handleRangeSelect = e => {
              e && this.props.onSelectRange && this.props.onSelectRange(e), Object(m.b)()
            }),
            (this._renderChildren = e => {
              const { ranges: t, activeRange: n, goToDateButton: a } = this.props
              return e
                ? i.createElement(
                    i.Fragment,
                    null,
                    i.createElement(O, { ranges: t, activeRange: n, onSelectRange: this._handleRangeSelect }),
                    a && i.createElement(B, { onGoToDateClick: this._handleGoToDateClick }),
                  )
                : i.createElement(
                    i.Fragment,
                    null,
                    t.map(e =>
                      i.createElement(p.b, {
                        key: e.value.value,
                        label: e.description || e.text,
                        isActive: n === e.value.value,
                        onClick: this._handleRangeSelect,
                        onClickArg: e,
                      }),
                    ),
                    a && i.createElement(b.a, null),
                    a && i.createElement(p.b, { label: j.goToDate, onClick: this._handleGoToDateClick }),
                  )
            }),
            Object(_.c)(t, { chartWidget: r.any.isRequired })
        }
        render() {
          return i.createElement(g.a, { rule: 'screen and (max-width: 428px)' }, e =>
            i.createElement(
              d.a,
              {
                className: W.button,
                content: j.title,
                arrow: !0,
                verticalAttachEdge: u.c.Top,
                verticalDropDirection: u.d.FromBottomToTop,
                horizontalMargin: 4,
                'data-name': 'date-ranges-menu',
                isDrawer: e,
              },
              this._renderChildren(e),
            ),
          )
        }
      }
      D.contextType = I
      const L = w(D)
      var z = n('K3s3'),
        P = n('W9Y+')
      function F(e) {
        const t = l(e.className, P.item, { [P.isActive]: e.isActive, [P.isFirst]: e.isFirst, [P.isLast]: e.isLast })
        return i.createElement('div', { className: t, onClick: e.onClick, ref: e.reference }, e.children)
      }
      var U = n('nPPD'),
        q = n('RZ2Z')
      const H = Object(U.a)(z.a, q)
      var K = n('qSb5')
      const G = Object(z.c)(function (e) {
        return i.createElement(
          'div',
          { className: l(e.className, H.slider), ref: e.reference },
          i.createElement('div', { className: H.inner }),
        )
      })
      const X = w(function (e) {
        const { className: t, ranges: n, activeRange: a, onSelectRange: s } = e
        return i.createElement(
          G,
          { className: l(K.sliderRow, t), 'data-name': 'date-ranges-tabs' },
          n.map((e, t) =>
            i.createElement(
              F,
              {
                key: e.value.value,
                value: e.value.value,
                isFirst: 0 === t,
                isLast: t === n.length - 1,
                isActive: a === e.value.value,
                onClick: s && s.bind(null, e),
              },
              i.createElement('div', { title: e.description || e.text, className: 'apply-common-tooltip' }, e.text),
            ),
          ),
        )
      })
      var V = n('Iivm'),
        Y = n('/DW5'),
        Z = n('ul7r'),
        Q = n('c7H2')
      const J = Object(Y.b)({ keys: ['Alt', 'G'], text: '{0} + {1}' }),
        $ = Object(_.b)()
      class ee extends i.PureComponent {
        constructor(e, t) {
          super(e, t),
            (this._handleClick = () => {
              const { chartWidget: e } = this.context
              Object(f.trackEvent)('GUI', 'Chart Bottom Toolbar', 'go to'), Object(R.showGoToDateDialog)(e)
            }),
            Object(_.c)(t, { chartWidget: r.any.isRequired })
        }
        render() {
          const { className: e, ranges: t } = this.props
          return (
            t.length > 0 &&
            i.createElement(
              'div',
              {
                className: l('apply-common-tooltip', Q.button, e),
                'data-name': 'go-to-date',
                'data-tooltip-hotkey': J,
                onClick: this._handleClick,
                title: Object(o.t)('Go to'),
              },
              i.createElement(V.a, { className: Q.icon, icon: Z }),
            )
          )
        }
      }
      ee.contextType = $
      const te = w(ee)
      var ne = n('URQ3')
      function ie(e) {
        const { reference: t, className: n, children: a, ...s } = e
        return i.createElement(
          'button',
          { ...s, className: l(n, ne.button), ref: t },
          i.createElement('span', { className: ne.inner }, a),
        )
      }
      var ae = n('/+9u'),
        se = n('4kQX'),
        oe = n('7KDR'),
        re = n('5VQP')
      class le extends i.PureComponent {
        constructor(e) {
          super(e),
            (this._element = null),
            (this._menu = null),
            (this._handleRef = e => {
              this._element = e
            }),
            (this._showMenu = () => {
              if (this._menu && this._menu.isShown()) return this._menu.hide(), void this._menu.destroy()
              const { getActions: e, right: t } = this.props,
                n = Object(v.ensureNotNull)(this._element),
                i = e()
              0 !== i.length &&
                re.ContextMenuManager.createMenu(i).then(e => {
                  ;(this._menu = e),
                    e.show((e, i) => {
                      const a = n.getBoundingClientRect()
                      return {
                        clientX: t ? a.right - e : a.left,
                        clientY: a.top - Math.min(i, a.top),
                        overrideHeight: a.top < i ? a.top : void 0,
                      }
                    }, this._element || void 0)
                })
            })
        }
        render() {
          const { children: e } = this.props
          return i.createElement('span', { onClick: this._showMenu, ref: this._handleRef }, e)
        }
      }
      var ce = n('jCNj'),
        he = n('2mG+')
      const de = { hint: window.t('Timezone') }
      const ue = Object(_.b)()
      class me extends i.PureComponent {
        constructor(e, t) {
          super(e, t),
            (this._timeFormatter = new se.TimeFormatter()),
            (this._tickInterval = void 0),
            (this._tickClock = () => {
              const { chartApiInstance: e } = this.context
              if (void 0 !== this._timezone) {
                const t = Object(ce.utc_to_cal)(this._timezone, e.serverTime())
                this.setState({ time: this._timeFormatter.format(t) })
              }
            }),
            (this._getActions = () => {
              if (!this.props.withMenu) return []
              const { chartWidget: e } = this.context
              return (function (e) {
                e.updateActions()
                const t = e.actions()
                return t && t.applyTimeZone instanceof oe.Action ? t.applyTimeZone.getSubItems() : []
              })(e)
            }),
            Object(_.c)(t, { chartWidget: r.any.isRequired, chartApiInstance: r.any.isRequired }),
            (this.state = { time: '' })
        }
        componentDidMount() {
          const { chartWidget: e } = this.context
          ;(this._tickInterval = setInterval(this._tickClock, 1e3)),
            e.withModel(null, () => {
              const t = e.model()
              t.model().mainSeries().dataEvents().symbolResolved().subscribe(this, this.updateTimezonesButton),
                t.model().properties().timezone.subscribe(this, this.updateTimezonesButton)
            })
        }
        componentWillUnmount() {
          const { chartWidget: e } = this.context
          clearInterval(this._tickInterval),
            e.withModel(null, () => {
              const t = e.model()
              t.model().mainSeries().dataEvents().symbolResolved().unsubscribe(this, this.updateTimezonesButton),
                t.model().properties().timezone.unsubscribe(this, this.updateTimezonesButton)
            })
        }
        render() {
          const { className: e, withMenu: t } = this.props,
            { time: n } = this.state,
            a = void 0 !== this._timezone ? Object(ae.a)(this._timezone.name()).string : null
          return i.createElement(
            le,
            { getActions: this._getActions },
            i.createElement(
              ie,
              {
                className: l(e, he.button, 'apply-common-tooltip'),
                title: t ? de.hint : void 0,
                disabled: !t,
                'data-name': 'time-zone-menu',
              },
              n && a && `${n} (${a})`,
            ),
          )
        }
        updateTimezonesButton() {
          const { chartWidget: e } = this.context
          if (!e.hasModel()) return
          if (null === e.model().mainSeries().symbolInfo()) return
          let t = e.model().model().timezone()
          if ('exchange' === t) {
            const n = Object(v.ensureNotNull)(e.model().mainSeries().symbolInfo()).timezone
            n && (t = n)
          }
          ;(this._timezone = Object(ce.get_timezone)(t)), this._tickClock()
        }
      }
      me.contextType = ue
      var ge = n('z6ID')
      function pe(e) {
        return i.createElement('span', { className: l(ge.separator, e.className) })
      }
      var be = n('tU7i'),
        ve = n('qFKp')
      class fe {
        constructor(e, t, n) {
          ;(this._highlighted = !1),
            (this._chartWidget = e),
            (this._priceScaleGetter = t),
            (this._owner = n),
            (this._setHighlight = this._setHighlight.bind(this)),
            (this._removeHighlight = this._removeHighlight.bind(this))
        }
        destroy() {
          this._highlighted && this._removeHighlight()
        }
        handlers() {
          const e = ve.CheckMobile.any()
          return { onMouseEnter: e ? void 0 : this._setHighlight, onMouseLeave: e ? void 0 : this._removeHighlight }
        }
        _setHighlight() {
          const e = this._chartWidget.model().model(),
            t = e.paneForSource(e.mainSeries()),
            n = this._priceScaleGetter()
          if (null === t || null === n) return
          const i = this._chartWidget.paneByState(t)
          if (null !== i) {
            const t = i.rightPriceAxisesContainer().findAxisWidgetForScale(n)
            let a = null
            null !== t && (a = t.axisInfo())
            const s = i.leftPriceAxisesContainer().findAxisWidgetForScale(n)
            null !== s && (a = s.axisInfo())
            const o = i.highlightedPriceAxis()
            null !== a &&
              o.value().axis !== a &&
              (o.setValue({ owner: this._owner, axis: a }), e.lightUpdate(), (this._highlighted = !0))
          }
        }
        _removeHighlight() {
          const e = this._chartWidget.model().model(),
            t = e.paneForSource(e.mainSeries())
          if (null === t) return
          const n = this._chartWidget.paneByState(t)
          if (null !== n) {
            const t = n.highlightedPriceAxis(),
              i = t.value()
            null !== i.axis &&
              i.owner === this._owner &&
              (t.setValue({ owner: this._owner, axis: null }), e.lightUpdate(), (this._highlighted = !1))
          }
        }
      }
      const _e = Object(_.b)()
      const Ce = Object(_.b)()
      const Se = Object(_.b)()
      const ye = Object(_.b)()
      var Ee = n('+GaQ'),
        xe = n('XAms'),
        we = n('T4/F'),
        Ne = n('ApAi'),
        Re = n('PP+v')
      const Te = {
          extLabel: window.t('ext'),
          extHint: window.t('Extended Hours is available only for intraday charts'),
          percentageHint: window.t('Toggle Percentage'),
          logLabel: window.t('log', { context: 'scale' }),
          logHint: window.t('Toggle Log Scale'),
          autoLabel: window.t('auto', { context: 'scale' }),
          autoHint: window.t('Toggle Auto Scale'),
          fullscreenHint: window.t('Toggle Maximize Chart'),
          adjLabel: window.t('adj', { context: 'adjustments' }),
          adjHint: window.t('Adjust data for dividends'),
          adjForDividendsOnlyHint: window.t('Data is adjusted for dividends only'),
          adjForSplitsOnlyHint: window.t('Data is adjusted for splits only'),
        },
        ke =
          ((Me = e =>
            i.createElement(be.b, {
              text: Te.logLabel,
              title: Te.logHint,
              className: e.className,
              isActive: e.isLogarithm,
              isGrouped: !0,
              onClick: e.onClick,
              onMouseEnter: e.onMouseEnter,
              onMouseLeave: e.onMouseLeave,
              'data-name': 'logarithm',
            })),
          ((Ae = class extends i.PureComponent {
            constructor(e, t) {
              super(e, t),
                (this._priceScale = null),
                (this._handleSelect = () => {
                  const e = this.context.chartWidget.model(),
                    t = Object(v.ensureNotNull)(this.state.series),
                    n = t.priceScale(),
                    i = n.mode()
                  t.priceScale().isLockScale() || e.setPriceScaleMode({ log: !i.log }, n, window.t('Toggle Log Scale'))
                }),
                Object(_.c)(t, { chartWidget: r.any.isRequired }),
                (this.state = { isActive: !1, series: null }),
                (this._priceAxisHighlighter = new fe(this.context.chartWidget, () => this._priceScale, 'logarithm'))
            }
            componentDidMount() {
              const e = this.context.chartWidget
              e.withModel(null, () => {
                const t = e.model().mainSeries(),
                  n = t.priceScale()
                this._handleMainSeriesPriceScaleChanged(n),
                  t.priceScaleChanged().subscribe(this, this._handleMainSeriesPriceScaleChanged),
                  this._handleModeChanged({}, n.mode()),
                  this.setState({ isActive: t.priceScale().isLog(), series: t })
              })
            }
            componentWillUnmount() {
              const e = this.context.chartWidget
              e.withModel(null, () => {
                e.model().mainSeries().priceScaleChanged().unsubscribe(this, this._handleMainSeriesPriceScaleChanged)
              }),
                null !== this._priceScale &&
                  (this._priceScale.modeChanged().unsubscribeAll(this), (this._priceScale = null)),
                this._priceAxisHighlighter.destroy()
            }
            render() {
              const { className: e } = this.props,
                { isActive: t, series: n } = this.state
              return i.createElement(Me, {
                ...this._priceAxisHighlighter.handlers(),
                className: e,
                isLogarithm: t,
                isDisabled: null === n,
                onClick: this._handleSelect,
              })
            }
            _handleMainSeriesPriceScaleChanged(e) {
              null !== this._priceScale && this._priceScale.modeChanged().unsubscribe(this, this._handleModeChanged),
                (this._priceScale = e),
                this._priceScale.modeChanged().subscribe(this, this._handleModeChanged),
                this._handleModeChanged({}, e.mode())
            }
            _handleModeChanged(e, t) {
              Boolean(t.log) !== this.state.isActive && this.setState({ isActive: Boolean(t.log) })
            }
          }).contextType = _e),
          Ae)
      var Me, Ae
      const We = (function (e) {
          var t
          return (
            ((t = class extends i.PureComponent {
              constructor(e, t) {
                super(e, t),
                  (this._priceScale = null),
                  (this._handleSelect = () => {
                    const e = this.context.chartWidget.model(),
                      t = Object(v.ensureNotNull)(this.state.series).priceScale(),
                      n = t.mode()
                    e.setPriceScaleMode({ autoScale: !n.autoScale }, t, window.t('Toggle Auto Scale'))
                  }),
                  Object(_.c)(t, { chartWidget: r.any.isRequired }),
                  (this.state = { isActive: !1, series: null }),
                  (this._priceAxisHighlighter = new fe(this.context.chartWidget, () => this._priceScale, 'auto'))
              }
              componentDidMount() {
                const e = this.context.chartWidget
                e.withModel(null, () => {
                  const t = e.model().mainSeries(),
                    n = t.priceScale()
                  this._handleMainSeriesPriceScaleChanged(n),
                    t.priceScaleChanged().subscribe(this, this._handleMainSeriesPriceScaleChanged),
                    this._handleModeChanged({}, n.mode()),
                    this.setState({ isActive: t.priceScale().isAutoScale(), series: t })
                })
              }
              componentWillUnmount() {
                const e = this.context.chartWidget
                e.withModel(null, () => {
                  e.model().mainSeries().priceScaleChanged().unsubscribe(this, this._handleMainSeriesPriceScaleChanged)
                }),
                  null !== this._priceScale &&
                    (this._priceScale.modeChanged().unsubscribeAll(this), (this._priceScale = null)),
                  this._priceAxisHighlighter.destroy()
              }
              render() {
                const { className: t } = this.props,
                  { isActive: n, series: a } = this.state
                return i.createElement(e, {
                  ...this._priceAxisHighlighter.handlers(),
                  className: t,
                  isAuto: n,
                  isDisabled: null === a,
                  onClick: this._handleSelect,
                })
              }
              _handleMainSeriesPriceScaleChanged(e) {
                null !== this._priceScale && this._priceScale.modeChanged().unsubscribe(this, this._handleModeChanged),
                  (this._priceScale = e),
                  this._priceScale.modeChanged().subscribe(this, this._handleModeChanged),
                  this._handleModeChanged({}, e.mode())
              }
              _handleModeChanged(e, t) {
                Boolean(t.autoScale) !== this.state.isActive && this.setState({ isActive: Boolean(t.autoScale) })
              }
            }).contextType = Ce),
            t
          )
        })(e =>
          i.createElement(be.b, {
            text: Te.autoLabel,
            title: Te.autoHint,
            className: e.className,
            isActive: e.isAuto,
            isGrouped: !0,
            onClick: e.onClick,
            onMouseEnter: e.onMouseEnter,
            onMouseLeave: e.onMouseLeave,
            'data-name': 'auto',
          }),
        ),
        Oe = (function (e) {
          var t
          return (
            ((t = class extends i.PureComponent {
              constructor(e, t) {
                super(e, t),
                  (this._priceScale = null),
                  (this._handleSelect = () => {
                    const e = this.context.chartWidget.model(),
                      t = Object(v.ensureNotNull)(this.state.series),
                      n = t.priceScale(),
                      i = n.mode()
                    t.priceScale().isLockScale() ||
                      e.setPriceScaleMode({ percentage: !i.percentage }, n, window.t('Toggle Percentage Scale'))
                  }),
                  Object(_.c)(t, { chartWidget: r.any.isRequired }),
                  (this.state = { isActive: !1, series: null }),
                  (this._priceAxisHighlighter = new fe(this.context.chartWidget, () => this._priceScale, 'percentage'))
              }
              componentDidMount() {
                const e = this.context.chartWidget
                e.withModel(null, () => {
                  const t = e.model().mainSeries(),
                    n = t.priceScale()
                  this._handleMainSeriesPriceScaleChanged(n),
                    t.priceScaleChanged().subscribe(this, this._handleMainSeriesPriceScaleChanged),
                    this._handleScaleChange({}, n.mode()),
                    this.setState({ isActive: t.priceScale().isPercentage(), series: t })
                })
              }
              componentWillUnmount() {
                const e = this.context.chartWidget
                e.withModel(null, () => {
                  e.model().mainSeries().priceScaleChanged().unsubscribe(this, this._handleMainSeriesPriceScaleChanged)
                }),
                  null !== this._priceScale &&
                    (this._priceScale.modeChanged().unsubscribeAll(this), (this._priceScale = null)),
                  this._priceAxisHighlighter.destroy()
              }
              render() {
                const { className: t } = this.props,
                  { isActive: n, series: a } = this.state
                return i.createElement(e, {
                  ...this._priceAxisHighlighter.handlers(),
                  className: t,
                  isPercentage: n,
                  isDisabled: null === a,
                  onClick: this._handleSelect,
                })
              }
              _handleMainSeriesPriceScaleChanged(e) {
                null !== this._priceScale && this._priceScale.modeChanged().unsubscribe(this, this._handleScaleChange),
                  (this._priceScale = e),
                  this._priceScale.modeChanged().subscribe(this, this._handleScaleChange),
                  this._handleScaleChange({}, e.mode())
              }
              _handleScaleChange(e, t) {
                Boolean(t.percentage) !== this.state.isActive && this.setState({ isActive: Boolean(t.percentage) })
              }
            }).contextType = Se),
            t
          )
        })(e =>
          i.createElement(be.b, {
            icon: we,
            title: Te.percentageHint,
            className: e.className,
            isActive: e.isPercentage,
            isDisabled: e.isDisabled,
            isGrouped: !0,
            onClick: e.onClick,
            onMouseEnter: e.onMouseEnter,
            onMouseLeave: e.onMouseLeave,
            'data-name': 'percentage',
          }),
        )
      const Be = Object(Y.b)({ keys: ['Alt', 'Enter'], text: '{0} + {1}' }),
        je = (function (e) {
          var t
          return (
            ((t = class extends i.PureComponent {
              constructor(e, t) {
                super(e, t),
                  (this._handleClick = e => {
                    const { resizerDetacher: t, chartWidgetCollection: n } = this.context
                    e.shiftKey && t.detachable.value()
                      ? t.detach()
                      : this.state.isFullscreen
                      ? t.exitFullscreen()
                      : t.requestFullscreen()
                  }),
                  (this._handleLayoutChange = e => {
                    this.setState({ isFullscreen: e })
                  }),
                  (this._handlePhoneSize = () => {
                    0
                  }),
                  Object(_.c)(t, { chartWidgetCollection: r.any.isRequired, resizerDetacher: r.any.isRequired })
                const { resizerDetacher: n } = t
                this.state = { isFullscreen: n.fullscreen.value(), isChangeLayoutButton: this._isChangeLayoutButton() }
              }
              componentDidMount() {
                const { resizerDetacher: e, chartWidgetCollection: t } = this.context,
                  { mobileChangeLayoutEnabled: n } = this.props
                e.fullscreen.subscribe(this._handleLayoutChange)
              }
              componentWillUnmount() {
                const { resizerDetacher: e, chartWidgetCollection: t } = this.context,
                  { mobileChangeLayoutEnabled: n } = this.props
                e.fullscreen.unsubscribe(this._handleLayoutChange)
              }
              render() {
                const { className: t } = this.props,
                  { isFullscreen: n, isChangeLayoutButton: a } = this.state
                return i.createElement(e, { className: t, isFullscreen: n, onClick: this._handleClick })
              }
              _isChangeLayoutButton() {
                return !1
              }
            }).contextType = ye),
            t
          )
        })(e =>
          i.createElement(be.b, {
            icon: Ne,
            title: Te.fullscreenHint,
            className: e.className,
            isActive: e.isFullscreen,
            onClick: e.onClick,
            'data-tooltip-hotkey': Be,
            'data-name': 'fullscreen',
          }),
        ),
        Ie = { properties: !0, fullscreen: !0, preventPhoneLayout: !0 },
        De = {
          fullscreen: Number.MIN_SAFE_INTEGER,
          preventPhoneLayout: Number.MIN_SAFE_INTEGER,
          properties: Number.MIN_SAFE_INTEGER,
          separator: -2,
          timeZones: -1,
          auto: 0,
          logarithm: 1,
          percentage: 2,
          session: 3,
          adj: 4,
        },
        Le = (() => {
          const e = new Map()
          return e.set(ke, 'logarithm'), e.set(Oe, 'percentage'), e.set(We, 'auto'), e.set(je, 'fullscreen'), e
        })()
      function ze(e) {
        0
      }
      const Pe = {
          dateRangeMode: 'hidden',
          separator: !0,
          timeZones: !0,
          fullscreen: !0,
          preventPhoneLayout: !0,
          properties: !0,
          auto: !0,
          logarithm: !0,
          percentage: !0,
          session: !0,
          adj: !0,
        },
        Fe = Object(_.b)()
      class Ue extends i.PureComponent {
        constructor(e, t) {
          var n, a
          super(e, t),
            (this._timezoneButtonRef = null),
            (this._layout = Object.assign({}, Pe)),
            (this._raf = null),
            (this._toolbar = null),
            (this._rangeExpanded = null),
            (this._rangeCollapsed = null),
            (this._seriesComponents = {}),
            (this._injector =
              ((n = () => this._layout),
              (a = (e, t) => (this._seriesComponents[t] = e)),
              (e, t, s) => {
                if (i.isValidElement(e) && 'string' != typeof e.type) {
                  const { props: o } = e
                  if ('string' == typeof o.className) {
                    const r = { className: l(o.className, 0 === t && Re.first, t === s.length - 1 && Re.last) },
                      c = n(),
                      h = Object(v.ensureDefined)(Le.get(e.type))
                    return i.createElement(
                      'div',
                      {
                        key: null === e.key ? void 0 : e.key,
                        className: l(Re.inline, c[h] && Re.collapsed),
                        ref: e => a(e, h),
                        onClick: () => ze(),
                      },
                      i.cloneElement(e, r),
                    )
                  }
                }
                return e
              })),
            (this._handleResize = () => {
              null === this._raf &&
                (this._raf = requestAnimationFrame(() => {
                  const e = this._layout,
                    t = Object(v.ensureNotNull)(this._toolbar),
                    n = Object(v.ensureNotNull)(this._rangeExpanded),
                    i =
                      ((a = (function (e) {
                        const t = {}
                        return (
                          Object.keys(e).forEach(n => {
                            const i = e[n]
                            if (null !== i) {
                              const e = s.findDOMNode(i)
                              null !== e && (t[n] = e)
                            }
                          }),
                          t
                        )
                      })(this._seriesComponents)),
                      Object.keys(a)
                        .map(e => ({ name: e, width: a[e].offsetWidth }))
                        .sort((e, t) => De[e.name] - De[t.name]))
                  var a
                  const o = t.offsetWidth,
                    r = i.reduce((e, t) => e + t.width, 0),
                    l = n.offsetWidth,
                    c = !Boolean(n.textContent) || o - r - l <= 0 ? 'collapsed' : 'expanded'
                  if ((Object.assign(e, { dateRangeMode: c }), 'expanded' !== c)) {
                    const t = o - Object(v.ensureNotNull)(this._rangeCollapsed).offsetWidth - 0
                    let n = 0,
                      a = 0
                    for (const s of i)
                      (n += s.width),
                        s.name in Ie
                          ? ((a += s.width), Object.assign(e, { [s.name]: !1 }))
                          : Object.assign(e, {
                              [s.name]: t <= n,
                            })
                    t <= a && Object.assign(e, { dateRangeMode: 'hidden' })
                  } else
                    Object.assign(e, {
                      separator: !1,
                      timeZones: !1,
                      fullscreen: !1,
                      preventPhoneLayout: !1,
                      properties: !1,
                      auto: !1,
                      logarithm: !1,
                      percentage: !1,
                      session: !1,
                      adj: !1,
                    })
                  this._applyResizing(), (this._raf = null)
                }))
            }),
            (this._handleTimezoneButtonRef = e => {
              this._timezoneButtonRef = e
            }),
            (this._handleMeasure = () => {
              null !== this._toolbar && this.resizeUI()
            }),
            (this._handleFullscreenableChange = e => {
              this._setStateWithResize({ isFullscreenable: e })
            }),
            (this._handlePreventPhoneLayoutButtonVisibility = () => {
              0
            }),
            (this._handleToolbarRef = e => (this._toolbar = e)),
            (this._handleRangeCollapsedRef = e => (this._rangeCollapsed = e)),
            (this._handleRangeExpandedRef = e => (this._rangeExpanded = e)),
            (this._handleTimeZonesRef = e => {
              this._seriesComponents.timeZones = e
            }),
            (this._handleSessionsRef = e => {
              this._seriesComponents.session = e
            }),
            (this._handleSeparatorRef = e => {
              this._seriesComponents.separator = e
            }),
            Object(_.c)(t, {
              onContentBoxChanged: r.any.isRequired,
              chartApiInstance: r.any.isRequired,
              chartWidget: r.any.isRequired,
              chartWidgetCollection: r.any.isRequired,
              resizerDetacher: r.any.isRequired,
            })
          const { resizerDetacher: o } = this.context
          this.state = {
            isFullscreenable: o.fullscreenable.value(),
            isPreventPhoneLayoutButton: this._isPreventPhoneLayoutButton(),
          }
        }
        componentDidMount() {
          const { onContentBoxChanged: e, resizerDetacher: t, chartWidgetCollection: n, chartWidget: i } = this.context
          e.subscribe(this, this._handleResize),
            t.fullscreenable.subscribe(this._handleFullscreenableChange),
            this.updateTimezonesButton(),
            this.resizeUI()
        }
        componentWillUnmount() {
          const { onContentBoxChanged: e, resizerDetacher: t, chartWidgetCollection: n, chartWidget: i } = this.context
          e.unsubscribe(this, this._handleResize),
            t.fullscreenable.unsubscribe(this._handleFullscreenableChange),
            null !== this._raf && (cancelAnimationFrame(this._raf), (this._raf = null))
        }
        render() {
          const e = this._layout,
            {
              timeFramesWidgetEnabled: t,
              timeWidgetEnabled: n,
              percentageScaleButtonEnabled: a,
              logScaleButtonEnabled: s,
              autoScaleButtonEnabled: o,
              fullscreenButtonEnabled: r,
            } = this.props
          return i.createElement(
            'div',
            { className: Re.toolbar, ref: this._handleToolbarRef, onContextMenu: xe.a },
            t &&
              i.createElement(
                Ee.a,
                null,
                i.createElement(
                  'div',
                  {
                    className: l(Re.dateRangeWrapper, 'collapsed' !== e.dateRangeMode && Re.collapsed),
                    ref: this._handleRangeCollapsedRef,
                  },
                  i.createElement(
                    'div',
                    { className: l(Re.dateRangeCollapsed) },
                    i.createElement(L, { goToDateButton: this.props.goToDateEnabled }),
                  ),
                ),
                i.createElement(
                  c,
                  { onMeasure: this._handleMeasure },
                  i.createElement(
                    'div',
                    {
                      className: l(Re.dateRangeWrapper, 'expanded' !== e.dateRangeMode && Re.collapsed),
                      ref: this._handleRangeExpandedRef,
                    },
                    i.createElement(
                      'div',
                      { className: l(Re.dateRangeExpanded) },
                      i.createElement(X, null),
                      this.props.goToDateEnabled && i.createElement(pe, null),
                      this.props.goToDateEnabled && i.createElement(te, null),
                    ),
                  ),
                ),
              ),
            i.createElement(
              'div',
              { className: Re.seriesControlWrapper },
              n &&
                i.createElement(
                  c,
                  { onMeasure: this._handleMeasure },
                  i.createElement(
                    'div',
                    { className: l(Re.inline, e.timeZones && Re.collapsed), ref: this._handleTimeZonesRef },
                    i.createElement(
                      'div',
                      { className: Re.inline, onClick: this._trackTimezonesButtonClick },
                      i.createElement(me, {
                        className: Re.timezone,
                        withMenu: this.props.timezoneMenuEnabled,
                        ref: this._handleTimezoneButtonRef,
                      }),
                    ),
                  ),
                ),
              !1,
              i.createElement(
                'div',
                { ref: this._handleSeparatorRef, className: l(Re.inline, e.separator && Re.collapsed) },
                i.createElement(pe, null),
              ),
              i.createElement(
                Ee.a,
                { map: this._injector },
                !1,
                a && !h.enabled('fundamental_widget') && i.createElement(Oe, { className: Re.icon }),
                s && i.createElement(ke, { className: Re.item }),
                o && i.createElement(We, { className: Re.item }),
                r &&
                  this.state.isFullscreenable &&
                  i.createElement(je, {
                    className: Re.icon,
                    mobileChangeLayoutEnabled: this.props.mobileChangeLayoutEnabled,
                  }),
                !1,
              ),
            ),
          )
        }
        updateTimezonesButton() {
          null !== this._timezoneButtonRef && this._timezoneButtonRef.updateTimezonesButton()
        }
        resizeUI() {
          this._handleResize()
        }
        _updateButtonsVisibility() {
          0
        }
        _trackTimezonesButtonClick() {
          ze()
        }
        _setStateWithResize(e) {
          Object.assign(this._layout, Pe), this._applyResizing(), this.setState(e, () => this._handleResize())
        }
        _applyResizing() {
          const { dateRangeMode: e, ...t } = this._layout
          this._rangeExpanded && this._rangeExpanded.classList.toggle(Re.collapsed, 'expanded' !== e),
            this._rangeCollapsed && this._rangeCollapsed.classList.toggle(Re.collapsed, 'collapsed' !== e),
            Object.keys(t).forEach(e => {
              const n = e,
                i = this._seriesComponents[n]
              i && i.classList.toggle(Re.collapsed, t[n])
            })
        }
        _isPreventPhoneLayoutButton() {
          return !1
        }
      }
      Ue.contextType = Fe
      const qe = {
        onContentBoxChanged: r.any,
        computeContentBox: r.any,
        chartWidget: r.any,
        chartApiInstance: r.any,
        chartWidgetCollection: r.any,
        resizerDetacher: r.any,
        availableTimeFrames: r.any,
      }
      class He extends i.PureComponent {
        constructor(e) {
          super(e),
            (this._setActiveChart = e => {
              this._defineRegistry(e), this.setState({ chartWidget: e })
            })
          const t = this.props.chartWidgetCollection.activeChartWidget.value()
          ;(this.state = { chartWidget: t }), this._defineRegistry(t)
        }
        componentDidMount() {
          this.props.chartWidgetCollection.activeChartWidget.subscribe(this._setActiveChart)
        }
        componentWillUnmount() {
          this.props.chartWidgetCollection.activeChartWidget.unsubscribe(this._setActiveChart)
        }
        render() {
          const { chartWidget: e } = this.state
          if (!e) return null
          const { options: t } = this.props,
            n = {
              timeFramesWidgetEnabled: t.timeFramesWidgetEnabled,
              goToDateEnabled: t.timeFramesWidget.goToDateEnabled,
              timeWidgetEnabled: t.timeWidgetEnabled,
              timezoneMenuEnabled: t.timeWidget && t.timeWidget.timezoneMenuEnabled,
              sessionIdButtonEnabled: t.sessionIdButtonEnabled,
              adjustForDividendsButtonEnabled: t.adjustForDividendsButtonEnabled,
              logScaleButtonEnabled: t.logScaleButtonEnabled,
              percentageScaleButtonEnabled: t.percentageScaleButtonEnabled,
              autoScaleButtonEnabled: t.autoScaleButtonEnabled,
              fullscreenButtonEnabled: t.fullscreenButtonEnabled,
              mobileChangeLayoutEnabled: t.mobileChangeLayoutEnabled,
            }
          return i.createElement(
            _.a,
            { validation: qe, value: this._registry },
            i.createElement(Ue, { key: e.id(), ...n }),
          )
        }
        _defineRegistry(e) {
          const {
              onContentBoxChanged: t,
              computeContentBox: n,
              chartApiInstance: i,
              chartWidgetCollection: a,
              options: { timeFramesWidgetEnabled: s, timeFramesWidget: o },
            } = this.props,
            r = s ? o.availableTimeFrames : void 0
          this._registry = {
            onContentBoxChanged: t,
            computeContentBox: n,
            chartWidget: e,
            availableTimeFrames: r,
            chartApiInstance: i,
            chartWidgetCollection: a,
            resizerDetacher: e.getResizerDetacher(),
          }
        }
      }
      n.d(t, 'BottomToolbarRenderer', function () {
        return Ke
      })
      class Ke {
        constructor(e, t, n, a, o, r, l) {
          this._container = e
          const c = i.createElement(He, {
            onContentBoxChanged: t,
            computeContentBox: n,
            chartWidgetCollection: a,
            chartApiInstance: o,
            chartWidgetOptions: r,
            options: l,
          })
          s.render(c, e), e.setAttribute('data-initialized', 'true')
        }
        destroy() {
          s.unmountComponentAtNode(this._container), this._container.removeAttribute('data-initialized')
        }
      }
    },
    N5tr: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return h
      }),
        n.d(t, 'b', function () {
          return m
        })
      var i = n('q1tI'),
        a = n.n(i),
        s = n('TSYQ'),
        o = n('tWVy'),
        r = n('JWMC'),
        l = n('ijHL'),
        c = n('v1bN')
      const h = c
      function d(e) {
        const { reference: t, ...n } = e,
          i = { ...n, ref: t }
        return a.a.createElement(e.href ? 'a' : 'div', i)
      }
      function u(e) {
        e.stopPropagation()
      }
      function m(e) {
        const {
            id: t,
            role: n,
            'aria-selected': h,
            className: m,
            title: g,
            labelRowClassName: p,
            labelClassName: b,
            shortcut: v,
            forceShowShortcuts: f,
            icon: _,
            isActive: C,
            isDisabled: S,
            isHovered: y,
            appearAsDisabled: E,
            label: x,
            link: w,
            showToolboxOnHover: N,
            target: R,
            rel: T,
            toolbox: k,
            reference: M,
            onMouseOut: A,
            onMouseOver: W,
            suppressToolboxClick: O = !0,
            theme: B = c,
          } = e,
          j = Object(l.b)(e),
          I = Object(i.useRef)(null)
        return a.a.createElement(
          d,
          {
            ...j,
            id: t,
            role: n,
            'aria-selected': h,
            className: s(m, B.item, _ && B.withIcon, { [B.isActive]: C, [B.isDisabled]: S || E, [B.hovered]: y }),
            title: g,
            href: w,
            target: R,
            rel: T,
            reference: function (e) {
              ;(I.current = e), 'function' == typeof M && M(e)
              'object' == typeof M && (M.current = e)
            },
            onClick: function (t) {
              const { dontClosePopup: n, onClick: i, onClickArg: a, trackEventObject: s } = e
              if (S) return
              s && Object(r.trackEvent)(s.category, s.event, s.label)
              i && i(a, t)
              n || Object(o.b)()
            },
            onContextMenu: function (t) {
              const { trackEventObject: n, trackRightClick: i } = e
              n && i && Object(r.trackEvent)(n.category, n.event, n.label + '_rightClick')
            },
            onMouseUp: function (t) {
              const { trackEventObject: n, trackMouseWheelClick: i } = e
              if (1 === t.button && w && n) {
                let e = n.label
                i && (e += '_mouseWheelClick'), Object(r.trackEvent)(n.category, n.event, e)
              }
            },
            onMouseOver: W,
            onMouseOut: A,
          },
          void 0 !== _ && a.a.createElement('div', { className: B.icon, dangerouslySetInnerHTML: { __html: _ } }),
          a.a.createElement(
            'div',
            { className: s(B.labelRow, p) },
            a.a.createElement('div', { className: s(B.label, b) }, x),
          ),
          (void 0 !== v || f) &&
            a.a.createElement('div', { className: B.shortcut }, (D = v) && D.split('+').join(' + ')),
          void 0 !== k &&
            a.a.createElement('div', { onClick: O ? u : void 0, className: s(B.toolbox, { [B.showOnHover]: N }) }, k),
        )
        var D
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
    O7m7: function (e, t, n) {},
    'PP+v': function (e, t, n) {
      e.exports = {
        toolbar: 'toolbar-2yU8ifXU',
        dateRangeWrapper: 'dateRangeWrapper-2yU8ifXU',
        seriesControlWrapper: 'seriesControlWrapper-2yU8ifXU',
        dateRangeExpanded: 'dateRangeExpanded-2yU8ifXU',
        dateRangeCollapsed: 'dateRangeCollapsed-2yU8ifXU',
        item: 'item-2yU8ifXU',
        first: 'first-2yU8ifXU',
        last: 'last-2yU8ifXU',
        inline: 'inline-2yU8ifXU',
        timezone: 'timezone-2yU8ifXU',
        session: 'session-2yU8ifXU',
        icon: 'icon-2yU8ifXU',
        hidden: 'hidden-2yU8ifXU',
        collapsed: 'collapsed-2yU8ifXU',
      }
    },
    RZ2Z: function (e, t, n) {
      e.exports = {
        slider: 'slider-3GYrNsPp',
        inner: 'inner-3GYrNsPp',
      }
    },
    'T4/F': function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><g fill="none" stroke="currentColor"><circle cx="3.5" cy="3.5" r="2"/><circle cx="10.5" cy="10.5" r="2"/><path stroke-linecap="square" d="M9.5 1.5l-5 11"/></g></svg>'
    },
    URQ3: function (e, t, n) {
      e.exports = { button: 'button-2pZNJ24z', hover: 'hover-2pZNJ24z', inner: 'inner-2pZNJ24z' }
    },
    'W9Y+': function (e, t, n) {
      e.exports = {
        item: 'item-3SbREAgE',
        hover: 'hover-3SbREAgE',
        isActive: 'isActive-3SbREAgE',
        isFirst: 'isFirst-3SbREAgE',
        isLast: 'isLast-3SbREAgE',
      }
    },
    XXQ5: function (e, t, n) {
      e.exports = {
        item: 'item-1-SF84yU',
        emptyIcons: 'emptyIcons-1-SF84yU',
        loading: 'loading-1-SF84yU',
        disabled: 'disabled-1-SF84yU',
        interactive: 'interactive-1-SF84yU',
        hovered: 'hovered-1-SF84yU',
        icon: 'icon-1-SF84yU',
        label: 'label-1-SF84yU',
        fullWidth: 'fullWidth-1-SF84yU',
        title: 'title-1-SF84yU',
        nested: 'nested-1-SF84yU',
        shortcut: 'shortcut-1-SF84yU',
        remove: 'remove-1-SF84yU',
      }
    },
    XiJV: function (e, t, n) {
      e.exports = { separator: 'separator-3No0pWrk' }
    },
    Xy1d: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M7 15l5 5L23 9"/></svg>'
    },
    Xzy5: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none"><path stroke="currentColor" d="M8 5l3.5 3.5L8 12"/></svg>'
    },
    YZ9j: function (e) {
      e.exports = JSON.parse(
        '{"loader":"loader-8x1ZxRwP","item":"item-2-89r_cd","tv-button-loader":"tv-button-loader-23vqS1uY","black":"black-20Ytsf0V","white":"white-1ucCcc2I","gray":"gray-XDhHSS-T","loader-initial":"loader-initial-1deQDeio","loader-appear":"loader-appear-2krFtMrd"}',
      )
    },
    c7H2: function (e, t, n) {
      e.exports = { button: 'button-yLOygoSG', hover: 'hover-yLOygoSG', icon: 'icon-yLOygoSG' }
    },
    l4ku: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return g
      })
      var i = n('q1tI'),
        a = n.n(i),
        s = n('TSYQ'),
        o = n('Iivm'),
        r = n('6KyJ'),
        l = n('J+f8'),
        c = n('w+Rv'),
        h = n('Xy1d'),
        d = n('Xzy5'),
        u = n('20PO'),
        m = n('XXQ5')
      function g(e) {
        const {
            isTitle: t,
            isLoading: n,
            isHovered: g,
            active: p,
            checkable: b,
            disabled: v,
            checked: f,
            icon: _,
            iconChecked: C,
            hint: S,
            subItems: y,
            label: E,
            onClick: x,
            children: w,
            toolbox: N,
            fullWidthLabel: R,
          } = e,
          T = Object(i.useContext)(l.a),
          k = !!y.length
        return n
          ? a.a.createElement('li', { className: s(m.item, m.loading) }, a.a.createElement(r.a, { color: 'gray' }))
          : a.a.createElement(
              'li',
              {
                className: s(
                  m.item,
                  m.interactive,
                  t && m.title,
                  v && m.disabled,
                  g && m.hovered,
                  p && m.active,
                  T && m.emptyIcons,
                ),
                onClick: x,
              },
              a.a.createElement(o.a, {
                className: s(m.icon),
                icon: (function () {
                  if (b && f) return C || _ || h
                  return _
                })(),
              }),
              a.a.createElement('span', { className: s(m.label, R && m.fullWidth) }, E),
              !!N &&
                a.a.createElement(o.a, {
                  onClick: function () {
                    N && N.action()
                  },
                  className: m.remove,
                  icon: u,
                }),
              !k && S && a.a.createElement(c.a, { className: m.shortcut, text: S }),
              k && a.a.createElement(o.a, { className: m.nested, icon: d }),
              w,
            )
      }
    },
    nPPD: function (e, t, n) {
      'use strict'
      function i(e, t, n = {}) {
        const i = Object.assign({}, t)
        for (const a of Object.keys(t)) {
          const s = n[a] || a
          s in e && (i[a] = [e[s], t[a]].join(' '))
        }
        return i
      }
      function a(e, t, n = {}) {
        return Object.assign({}, e, i(e, t, n))
      }
      n.d(t, 'b', function () {
        return i
      }),
        n.d(t, 'a', function () {
          return a
        })
    },
    qSb5: function (e, t, n) {
      e.exports = { sliderRow: 'sliderRow-1emAA4_D' }
    },
    ul7r: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none"><path stroke="currentColor" d="M1.5 8V6.5m7.5 9h5.5a2 2 0 0 0 2-2v-7m-15 0v-2c0-1.1.9-2 2-2h11a2 2 0 0 1 2 2v2m-15 0h15"/><path fill="currentColor" d="M5 1h1v3H5V1zM12 1h1v3h-1V1z"/><path stroke="currentColor" d="M0 12.5h7.5m0 0L4 16m3.5-3.5L4 9"/></svg>'
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
    'w+Rv': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return r
      })
      var i = n('q1tI'),
        a = n('TSYQ'),
        s = n.n(a),
        o = n('ycgn')
      function r(e) {
        const { text: t = '', className: n } = e
        return i.createElement('span', { className: s()(o.shortcut, n) }, t)
      }
    },
    'x0D+': function (e, t, n) {
      var i, a, s
      ;(a = [t]),
        void 0 ===
          (s =
            'function' ==
            typeof (i = function (e) {
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
                var i = {
                  get passive() {
                    n = !0
                  },
                }
                window.addEventListener('testPassive', null, i), window.removeEventListener('testPassive', null, i)
              }
              var a =
                  'undefined' != typeof window &&
                  window.navigator &&
                  window.navigator.platform &&
                  /iP(ad|hone|od)/.test(window.navigator.platform),
                s = [],
                o = !1,
                r = -1,
                l = void 0,
                c = void 0,
                h = function (e) {
                  return s.some(function (t) {
                    return !(!t.options.allowTouchMove || !t.options.allowTouchMove(e))
                  })
                },
                d = function (e) {
                  var t = e || window.event
                  return !!h(t.target) || 1 < t.touches.length || (t.preventDefault && t.preventDefault(), !1)
                },
                u = function () {
                  setTimeout(function () {
                    void 0 !== c && ((document.body.style.paddingRight = c), (c = void 0)),
                      void 0 !== l && ((document.body.style.overflow = l), (l = void 0))
                  })
                }
              ;(e.disableBodyScroll = function (e, i) {
                if (a) {
                  if (!e)
                    return void console.error(
                      'disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.',
                    )
                  if (
                    e &&
                    !s.some(function (t) {
                      return t.targetElement === e
                    })
                  ) {
                    var u = { targetElement: e, options: i || {} }
                    ;(s = [].concat(t(s), [u])),
                      (e.ontouchstart = function (e) {
                        1 === e.targetTouches.length && (r = e.targetTouches[0].clientY)
                      }),
                      (e.ontouchmove = function (t) {
                        var n, i, a, s
                        1 === t.targetTouches.length &&
                          ((i = e),
                          (s = (n = t).targetTouches[0].clientY - r),
                          !h(n.target) &&
                            ((i && 0 === i.scrollTop && 0 < s) ||
                            ((a = i) && a.scrollHeight - a.scrollTop <= a.clientHeight && s < 0)
                              ? d(n)
                              : n.stopPropagation()))
                      }),
                      o || (document.addEventListener('touchmove', d, n ? { passive: !1 } : void 0), (o = !0))
                  }
                } else {
                  ;(g = i),
                    setTimeout(function () {
                      if (void 0 === c) {
                        var e = !!g && !0 === g.reserveScrollBarGap,
                          t = window.innerWidth - document.documentElement.clientWidth
                        e &&
                          0 < t &&
                          ((c = document.body.style.paddingRight), (document.body.style.paddingRight = t + 'px'))
                      }
                      void 0 === l && ((l = document.body.style.overflow), (document.body.style.overflow = 'hidden'))
                    })
                  var m = { targetElement: e, options: i || {} }
                  s = [].concat(t(s), [m])
                }
                var g
              }),
                (e.clearAllBodyScrollLocks = function () {
                  a
                    ? (s.forEach(function (e) {
                        ;(e.targetElement.ontouchstart = null), (e.targetElement.ontouchmove = null)
                      }),
                      o && (document.removeEventListener('touchmove', d, n ? { passive: !1 } : void 0), (o = !1)),
                      (s = []),
                      (r = -1))
                    : (u(), (s = []))
                }),
                (e.enableBodyScroll = function (e) {
                  if (a) {
                    if (!e)
                      return void console.error(
                        'enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.',
                      )
                    ;(e.ontouchstart = null),
                      (e.ontouchmove = null),
                      (s = s.filter(function (t) {
                        return t.targetElement !== e
                      })),
                      o &&
                        0 === s.length &&
                        (document.removeEventListener('touchmove', d, n ? { passive: !1 } : void 0), (o = !1))
                  } else
                    1 === s.length && s[0].targetElement === e
                      ? (u(), (s = []))
                      : (s = s.filter(function (t) {
                          return t.targetElement !== e
                        }))
                })
            })
              ? i.apply(t, a)
              : i) || (e.exports = s)
    },
    ycgn: function (e, t, n) {
      e.exports = {
        item: 'item-f5BaKrKq',
        interactive: 'interactive-f5BaKrKq',
        hovered: 'hovered-f5BaKrKq',
        disabled: 'disabled-f5BaKrKq',
        active: 'active-f5BaKrKq',
        shortcut: 'shortcut-f5BaKrKq',
        iconCell: 'iconCell-f5BaKrKq',
        icon: 'icon-f5BaKrKq',
        checkmark: 'checkmark-f5BaKrKq',
        content: 'content-f5BaKrKq',
        label: 'label-f5BaKrKq',
        checked: 'checked-f5BaKrKq',
        toolbox: 'toolbox-f5BaKrKq',
        showToolboxOnHover: 'showToolboxOnHover-f5BaKrKq',
        arrowIcon: 'arrowIcon-f5BaKrKq',
        subMenu: 'subMenu-f5BaKrKq',
        invisibleHotkey: 'invisibleHotkey-f5BaKrKq',
      }
    },
    z6ID: function (e, t, n) {
      e.exports = { separator: 'separator-13-1nlsQ' }
    },
  },
])
