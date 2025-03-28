;(window.webpackJsonp = window.webpackJsonp || []).push([
  [37],
  {
    '++uw': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return r
      })
      var a = n('q1tI'),
        o = n('yqnI')
      const r = e => {
        const t = 'property' in e ? e.property : void 0,
          n = 'defaultValue' in e ? e.defaultValue : e.property.value(),
          [r, s] = Object(a.useState)(t ? t.value() : n)
        Object(a.useEffect)(() => {
          if (t) {
            const n = {}
            return (
              s(t.value()),
              t.subscribe(n, t => {
                const n = t.value()
                e.handler && e.handler(n), s(n)
              }),
              () => t.unsubscribeAll(n)
            )
          }
          return () => {}
        }, [t])
        return [
          r,
          e => {
            if (void 0 !== t) {
              const n = t.value()
              o.a.logNormal(`Changing property value from "${n}" to "${e}"`), t.setValue(e)
            }
          },
        ]
      }
    },
    '+8gn': function (e, t, n) {
      'use strict'
      n.d(t, 'b', function () {
        return c
      }),
        n.d(t, 'a', function () {
          return l
        })
      var a = n('q1tI'),
        o = n('Eyy1'),
        r = n('txPx')
      const s = Object(r.getLogger)('Platform.GUI.StudyInputPropertyContainer'),
        c = a.createContext(null)
      class l extends a.PureComponent {
        constructor(e) {
          super(e),
            (this._setValue = (e, t, n) => {
              const { property: a, model: r } = this.props,
                c = Object(o.ensureDefined)(a.child(e))
              s.logNormal(`Changing property "${e}" value from "${a.value()}" to "${t}"`),
                r.setProperty(c, t, 'Change ' + n)
            })
          const { property: t } = e,
            n = {}
          t.childNames().forEach(e => {
            const a = Object(o.ensureDefined)(t.child(e))
            n.hasOwnProperty(e) || (n[e] = a.value())
          }),
            (this.state = n)
        }
        componentDidMount() {
          const { property: e } = this.props
          e.childNames().forEach(t => {
            Object(o.ensureDefined)(e.child(t)).subscribe(this, e => {
              const n = e.value()
              s.logNormal(`Property "${t}" updated to value "${n}"`), this.setState({ [t]: n })
            })
          })
        }
        componentWillUnmount() {
          const { property: e } = this.props
          e.childNames().forEach(t => {
            Object(o.ensureDefined)(e.child(t)).unsubscribeAll(this)
          })
        }
        render() {
          const { study: e, model: t, children: n } = this.props,
            o = { study: e, model: t, values: this.state, setValue: this._setValue }
          return a.createElement(c.Provider, { value: o }, n)
        }
      }
    },
    '07LS': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return l
      })
      var a = n('q1tI'),
        o = n.n(a),
        r = n('Q+1u'),
        s = n('fktV'),
        c = n('Q40t')
      function l(e) {
        return o.a.createElement(
          r.a.Row,
          null,
          o.a.createElement(
            r.a.Cell,
            {
              className: c.titleWrap,
              placement: 'first',
              verticalAlign: 'adaptive',
              colSpan: 2,
              'data-section-name': e.name,
              checkableTitle: !0,
            },
            o.a.createElement(s.a, { title: e.title, name: 'is-enabled-' + e.name }),
          ),
        )
      }
    },
    '0W35': function (e, t, n) {
      'use strict'
      var a = n('q1tI'),
        o = n('17x9')
      class r extends a.PureComponent {
        constructor() {
          super(...arguments),
            (this._subscriptions = new Set()),
            (this._getName = () => this.props.name),
            (this._getValues = () => this.props.values),
            (this._getOnChange = () => this.props.onChange),
            (this._subscribe = e => {
              this._subscriptions.add(e)
            }),
            (this._unsubscribe = e => {
              this._subscriptions.delete(e)
            })
        }
        getChildContext() {
          return {
            switchGroupContext: {
              getName: this._getName,
              getValues: this._getValues,
              getOnChange: this._getOnChange,
              subscribe: this._subscribe,
              unsubscribe: this._unsubscribe,
            },
          }
        }
        render() {
          return this.props.children
        }
        componentDidUpdate(e) {
          this._notify(this._getUpdates(this.props.values, e.values))
        }
        _notify(e) {
          this._subscriptions.forEach(t => t(e))
        }
        _getUpdates(e, t) {
          return [...t, ...e].filter(n => (t.includes(n) ? !e.includes(n) : e.includes(n)))
        }
      }
      function s(e) {
        var t
        return (
          ((t = class extends a.PureComponent {
            constructor() {
              super(...arguments),
                (this._onChange = e => {
                  this.context.switchGroupContext.getOnChange()(e)
                }),
                (this._onUpdate = e => {
                  e.includes(this.props.value) && this.forceUpdate()
                })
            }
            componentDidMount() {
              this.context.switchGroupContext.subscribe(this._onUpdate)
            }
            render() {
              return a.createElement(e, {
                ...this.props,
                name: this._getName(),
                onChange: this._onChange,
                checked: this._isChecked(),
              })
            }
            componentWillUnmount() {
              this.context.switchGroupContext.unsubscribe(this._onUpdate)
            }
            _getName() {
              return this.context.switchGroupContext.getName()
            }
            _isChecked() {
              return this.context.switchGroupContext.getValues().includes(this.props.value)
            }
          }).contextTypes = { switchGroupContext: o.any.isRequired }),
          t
        )
      }
      ;(r.childContextTypes = { switchGroupContext: o.any.isRequired }),
        n.d(t, 'a', function () {
          return r
        }),
        n.d(t, 'b', function () {
          return s
        })
    },
    '4bOu': function (e, t, n) {
      e.exports = {
        colorPickerWrap: 'colorPickerWrap-3gSLMlhu',
        focused: 'focused-3gSLMlhu',
        readonly: 'readonly-3gSLMlhu',
        disabled: 'disabled-3gSLMlhu',
        'size-small': 'size-small-3gSLMlhu',
        'size-medium': 'size-medium-3gSLMlhu',
        'size-large': 'size-large-3gSLMlhu',
        'font-size-small': 'font-size-small-3gSLMlhu',
        'font-size-medium': 'font-size-medium-3gSLMlhu',
        'font-size-large': 'font-size-large-3gSLMlhu',
        'border-none': 'border-none-3gSLMlhu',
        shadow: 'shadow-3gSLMlhu',
        'border-thin': 'border-thin-3gSLMlhu',
        'border-thick': 'border-thick-3gSLMlhu',
        'intent-default': 'intent-default-3gSLMlhu',
        'intent-success': 'intent-success-3gSLMlhu',
        'intent-warning': 'intent-warning-3gSLMlhu',
        'intent-danger': 'intent-danger-3gSLMlhu',
        'intent-primary': 'intent-primary-3gSLMlhu',
        'corner-top-left': 'corner-top-left-3gSLMlhu',
        'corner-top-right': 'corner-top-right-3gSLMlhu',
        'corner-bottom-right': 'corner-bottom-right-3gSLMlhu',
        'corner-bottom-left': 'corner-bottom-left-3gSLMlhu',
        colorPicker: 'colorPicker-3gSLMlhu',
        swatch: 'swatch-3gSLMlhu',
        placeholderContainer: 'placeholderContainer-3gSLMlhu',
        placeholder: 'placeholder-3gSLMlhu',
        white: 'white-3gSLMlhu',
        opacitySwatch: 'opacitySwatch-3gSLMlhu',
        colorLine: 'colorLine-3gSLMlhu',
        thicknessContainer: 'thicknessContainer-3gSLMlhu',
        thicknessTitle: 'thicknessTitle-3gSLMlhu',
      }
    },
    '5YG5': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return r
      })
      var a = n('CW80'),
        o = n('3ClC')
      function r(e) {
        if (Object(a.isLineTool)(e))
          return {
            isPine: () => !1,
            isStandardPine: () => !1,
            canOverrideMinTick: () => !1,
            resolvedSymbolInfoBySymbol: () => {
              throw new TypeError('Only study is supported.')
            },
            symbolsResolved: () => {
              throw new TypeError('Only study is supported.')
            },
            parentSource: () => {
              throw new TypeError('Only study is supported.')
            },
            getAllChildren: () => [],
            sourceId: () => {
              throw new TypeError('Only study is supported.')
            },
          }
        if (Object(o.isStudy)(e)) return e
        if ('isInputsStudy' in e) return e
        throw new TypeError('Unsupported source type.')
      }
    },
    '6ix9': function (e, t, n) {
      e.exports = {
        content: 'content-22S1W3v8',
        cell: 'cell-22S1W3v8',
        inner: 'inner-22S1W3v8',
        first: 'first-22S1W3v8',
        inlineCell: 'inlineCell-22S1W3v8',
        fill: 'fill-22S1W3v8',
        top: 'top-22S1W3v8',
        topCenter: 'topCenter-22S1W3v8',
        offset: 'offset-22S1W3v8',
        inlineRow: 'inlineRow-22S1W3v8',
        grouped: 'grouped-22S1W3v8',
        separator: 'separator-22S1W3v8',
        groupSeparator: 'groupSeparator-22S1W3v8',
        big: 'big-22S1W3v8',
        adaptive: 'adaptive-22S1W3v8',
        checkableTitle: 'checkableTitle-22S1W3v8',
      }
    },
    '7MId': function (e, t, n) {
      'use strict'
      var a = n('q1tI'),
        o = n.n(a),
        r = n('TSYQ'),
        s = n.n(r),
        c = n('Eyy1'),
        l = n('/3z9'),
        i = n('9dlw'),
        u = n('SpAO'),
        d = n('htM8'),
        p = n('PN6A')
      function h(e) {
        const { button: t, children: n, className: r, onPopupClose: s, ...h } = e,
          [m, b] = Object(a.useState)(!1),
          [f, g] = Object(a.useState)(!1),
          [v, C] = Object(u.a)(),
          y = Object(a.useRef)(null)
        return o.a.createElement(
          'div',
          { className: r },
          o.a.createElement(
            'div',
            {
              tabIndex: e.disabled ? void 0 : -1,
              ref: y,
              onClick: S,
              onFocus: C.onFocus,
              onBlur: C.onBlur,
              onKeyDown: E,
            },
            'function' == typeof t ? t(f, v) : t,
          ),
          o.a.createElement(
            i.a,
            {
              isOpened: f,
              onClose: N,
              position: function () {
                const e = Object(c.ensureNotNull)(y.current).getBoundingClientRect()
                return { x: e.left, y: e.top + e.height }
              },
              doNotCloseOn: y.current,
              onKeyDown: E,
            },
            o.a.createElement(p.a.Consumer, null, e => o.a.createElement(d.a, { ...h, onToggleCustom: b, menu: e })),
            !m && n,
          ),
        )
        function S() {
          e.disabled || (g(e => !e), b(!1))
        }
        function E(e) {
          switch (Object(l.hashFromEvent)(e)) {
            case 27:
              f && (e.preventDefault(), N())
          }
        }
        function N() {
          S(), Object(c.ensureNotNull)(y.current).focus(), s && s()
        }
      }
      var m = n('V3OP'),
        b = n('Tmoa'),
        f = n('wLjq'),
        g = (n('YFKU'), n('0W35')),
        v = n('95N5')
      const C = Object(g.b)(
        class extends a.PureComponent {
          constructor() {
            super(...arguments),
              (this._onChange = () => {
                this.props.onChange && this.props.onChange(this.props.value)
              })
          }
          render() {
            const { name: e, checked: t, value: n } = this.props,
              o = r(v.thicknessItem, { [v.checked]: t }),
              s = r(v.bar, { [v.checked]: t }),
              c = { borderTopWidth: parseInt(n) }
            return a.createElement(
              'div',
              { className: o },
              a.createElement('input', {
                type: 'radio',
                className: v.radio,
                name: e,
                value: n,
                onChange: this._onChange,
                checked: t,
              }),
              a.createElement('div', { className: s, style: c }, ' '),
            )
          }
        },
      )
      function y(e) {
        const { name: t, values: n, selectedValues: o, onChange: r } = e,
          s = n.map((e, t) => a.createElement(C, { key: t, value: e.toString() })),
          c = o.map(e => e.toString())
        return a.createElement(
          'div',
          { className: v.wrap },
          a.createElement(
            g.a,
            {
              name: t,
              onChange: e => {
                r(parseInt(e))
              },
              values: c,
            },
            s,
          ),
        )
      }
      var S = n('85uA')
      const E = window.t('Thickness')
      function N(e) {
        return o.a.createElement(
          'div',
          { className: S.thicknessContainer },
          o.a.createElement('div', { className: S.thicknessTitle }, E),
          o.a.createElement(y, {
            name: 'color_picker_thickness_select',
            onChange: e.onChange,
            values: e.items,
            selectedValues: [e.value],
          }),
        )
      }
      var w = n('4bOu')
      function k(e) {
        const {
            className: t,
            selectOpacity: n = void 0 !== e.opacity,
            thickness: a,
            color: r,
            disabled: c,
            opacity: l = 1,
            onColorChange: i,
            onOpacityChange: u,
            onThicknessChange: d,
            thicknessItems: p,
            onPopupClose: b,
          } = e,
          [f, g, v] = Object(m.a)()
        return o.a.createElement(
          h,
          {
            className: t,
            disabled: c,
            color: r,
            selectOpacity: n,
            opacity: l,
            selectCustom: !0,
            customColors: f,
            onColorChange: i,
            onOpacityChange: r ? u : void 0,
            onAddColor: g,
            onRemoveCustomColor: v,
            button: function (e, t) {
              const n = e || t,
                i = n ? 'primary' : 'default'
              return o.a.createElement(
                'div',
                {
                  className: s()(
                    w.colorPickerWrap,
                    w['intent-' + i],
                    w['border-thin'],
                    w['size-medium'],
                    n && w.highlight,
                    n && w.focused,
                    c && w.disabled,
                  ),
                  'data-role': 'button',
                  'data-name': a ? 'color-with-thickness-select' : 'color-select',
                },
                o.a.createElement(
                  'div',
                  { className: s()(w.colorPicker, c && w.disabled) },
                  r
                    ? (function () {
                        const e = x(r, l),
                          t = l >= 0.95 && O(r)
                        return o.a.createElement(
                          'div',
                          { className: w.opacitySwatch },
                          o.a.createElement('div', {
                            style: { backgroundColor: e },
                            className: s()(w.swatch, t && w.white),
                          }),
                        )
                      })()
                    : o.a.createElement(
                        'div',
                        { className: w.placeholderContainer },
                        o.a.createElement('div', { className: w.placeholder }),
                      ),
                  a &&
                    o.a.createElement('span', {
                      className: s()(w.colorLine, O(r) && w.white),
                      style: { height: a, backgroundColor: x(r, l) },
                    }),
                ),
                n && o.a.createElement('span', { className: w.shadow }),
              )
            },
            onPopupClose: b,
          },
          a &&
            p &&
            o.a.createElement(N, {
              value: a,
              items: p,
              onChange: function (e) {
                d && d(e)
              },
            }),
        )
      }
      function x(e, t) {
        return e ? Object(b.generateColor)(e, Object(b.alphaToTransparency)(t)) : '#000000'
      }
      function O(e) {
        return !!e && e.toLowerCase() === f.c
      }
      n.d(t, 'a', function () {
        return k
      })
    },
    '85uA': function (e, t, n) {
      e.exports = { thicknessContainer: 'thicknessContainer-2K1QSVfY', thicknessTitle: 'thicknessTitle-2K1QSVfY' }
    },
    '95N5': function (e, t, n) {
      e.exports = {
        wrap: 'wrap-kAIcH6Vi',
        thicknessItem: 'thicknessItem-kAIcH6Vi',
        checked: 'checked-kAIcH6Vi',
        radio: 'radio-kAIcH6Vi',
        bar: 'bar-kAIcH6Vi',
      }
    },
    E9Pn: function (e, t, n) {},
    EYfA: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return c
      })
      var a = n('q1tI'),
        o = n.n(a),
        r = n('Q+1u'),
        s = n('fktV')
      function c(e) {
        const { id: t, offset: n, disabled: a, checked: c, title: l, children: i } = e
        return o.a.createElement(
          r.a.Row,
          null,
          o.a.createElement(
            r.a.Cell,
            {
              placement: 'first',
              verticalAlign: 'adaptive',
              offset: n,
              'data-section-name': t,
              colSpan: Boolean(i) ? void 0 : 2,
              checkableTitle: !0,
            },
            o.a.createElement(s.a, { name: 'is-enabled-' + t, title: l, disabled: a, property: c }),
          ),
          Boolean(i) && o.a.createElement(r.a.Cell, { placement: 'last', 'data-section-name': t }, i),
        )
      }
    },
    HfwS: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return r
      }),
        n.d(t, 'b', function () {
          return s
        })
      var a = n('q1tI'),
        o = n('+8gn')
      function r(e) {
        var t
        return (
          ((t = class extends a.PureComponent {
            constructor() {
              super(...arguments),
                (this._getTimezoneName = e => {
                  const t = e.model().timezone()
                  if ('exchange' !== t) return t
                  const n = e.model().mainSeries().symbolInfo()
                  return null == n ? void 0 : n.timezone
                }),
                (this._onChange = (e, t, n) => {
                  const { setValue: a } = this.context,
                    { onChange: o } = this.props
                  s(a, o)(e, t, n)
                })
            }
            render() {
              const { input: t } = this.props,
                { values: n, model: o } = this.context
              return a.createElement(e, {
                ...this.props,
                value: n[t.id],
                tzName: this._getTimezoneName(o),
                onChange: this._onChange,
              })
            }
          }).contextType = o.b),
          t
        )
      }
      function s(e, t) {
        return (n, a, o) => {
          e(a, n, o), t && t(n, a, o)
        }
      }
    },
    'Q+1u': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return i
      })
      var a = n('q1tI'),
        o = n.n(a),
        r = n('TSYQ'),
        s = n('ijHL'),
        c = n('6ix9')
      const l = o.a.createContext(!1)
      class i extends o.a.PureComponent {
        render() {
          return o.a.createElement('div', { ref: this.props.reference, className: c.content }, this.props.children)
        }
      }
      ;(i.InlineRowContext = l),
        (i.Row = function (e) {
          const { children: t } = e
          return Object(a.useContext)(l)
            ? o.a.createElement('span', { className: c.inlineRow }, t)
            : o.a.createElement(o.a.Fragment, null, t)
        }),
        (i.Cell = function (e) {
          const t = Object(a.useContext)(l),
            n = r(
              c.cell,
              e.offset && c.offset,
              e.grouped && c.grouped,
              t && c.inlineCell,
              'top' === e.verticalAlign && c.top,
              'topCenter' === e.verticalAlign && c.topCenter,
              'adaptive' === e.verticalAlign && c.adaptive,
              e.checkableTitle && c.checkableTitle,
              2 === e.colSpan && c.fill,
              'first' === e.placement && 2 !== e.colSpan && c.first,
              'last' === e.placement && 2 !== e.colSpan && c.last,
            ),
            i = Object(s.b)(e)
          return o.a.createElement(
            'div',
            { ...i, className: n },
            o.a.createElement('div', { className: r(c.inner, e.className) }, e.children),
          )
        }),
        (i.Separator = function (e) {
          return o.a.createElement(i.Row, null, o.a.createElement('div', { className: r(c.cell, c.separator, c.fill) }))
        }),
        (i.GroupSeparator = function (e) {
          const t = e.size || 0
          return o.a.createElement(
            i.Row,
            null,
            o.a.createElement('div', { className: r(c.cell, c.groupSeparator, c.fill, 1 === t && c.big) }),
          )
        })
    },
    Q40t: function (e, t, n) {
      e.exports = { titleWrap: 'titleWrap-3OnZWCnE' }
    },
    Si6X: function (e, t, n) {
      'use strict'
      var a = n('q1tI'),
        o = n.n(a),
        r = n('TSYQ'),
        s = n.n(r),
        c = n('YFKU'),
        l = n('Eyy1'),
        i = n('+EG+'),
        u = n('pafz'),
        d = n('Kxc7'),
        p = n('fV01'),
        h = n('kNVT'),
        m = n('p04v'),
        b = n('Iivm'),
        f = n('u52U'),
        g = n('xNfs')
      function v(e) {
        const { value: t, onClick: n, disabled: a = !1, className: s } = e
        return o.a.createElement(
          'div',
          { className: r(g.wrap, a && g.disabled, s), onClick: n, 'data-name': 'edit-button' },
          o.a.createElement('span', { className: r(g.text, 'apply-overflow-tooltip') }, t),
          o.a.createElement(b.a, { icon: f, className: g.icon }),
        )
      }
      var C = n('EYfA'),
        y = n('xpzh'),
        S = n('952j'),
        E = n('rC+j'),
        N = n('8woN')
      var w = n('pCpq')
      function k(e) {
        const { symbol: t, onSymbolChanged: n, disabled: r, className: l } = e,
          [p, b] = Object(a.useState)(t),
          f = Object(a.useContext)(i.b),
          g = Object(a.useContext)(u.a)
        return o.a.createElement(v, {
          value: p,
          onClick: function () {
            const e = (function (e) {
                const t = Object(S.b)(e)
                return Object(E.e)(t)
              })(p)
                ? p
                : (function (e) {
                    try {
                      return Object(N.shortName)(e)
                    } catch (t) {
                      return e
                    }
                  })(p),
              t = Object(h.getSymbolSearchCompleteOverrideFunction)()
            Object(m.a)({
              onSearchComplete: e => {
                t(e[0].symbol).then(e => {
                  n(e), b(e)
                })
              },
              dialogTitle: Object(c.t)('Change symbol'),
              defaultValue: e,
              manager: f,
              onClose: () => {
                g && g.focus()
              },
              showSpreadActions:
                d.enabled('show_spread_operators') && d.enabled('studies_symbol_search_spread_operators'),
            })
          },
          disabled: r,
          className: s()(l, d.enabled('uppercase_instrument_names') && w.uppercase),
        })
      }
      function x(e) {
        if ('definition' in e) {
          const { propType: t, properties: n, id: a, title: r = '' } = e.definition,
            s = n[t],
            c = s.value() || '',
            i = e => {
              s.setValue(e)
            }
          return o.a.createElement(
            C.a,
            { id: a, title: r },
            o.a.createElement(
              y.a,
              null,
              o.a.createElement(k, { symbol: Object(l.ensureDefined)(c), onSymbolChanged: i }),
            ),
          )
        }
        {
          const {
              study: t,
              value: n,
              input: { id: a, name: r },
              onChange: c,
              disabled: i,
              hasTooltip: u,
            } = e,
            d = e => {
              const n = Object(p.b)(e, t)
              c(n, a, r)
            }
          return o.a.createElement(k, {
            symbol: Object(l.ensureDefined)(n),
            onSymbolChanged: d,
            disabled: i,
            className: s()(u && w.hasTooltip),
          })
        }
      }
      n.d(t, 'a', function () {
        return x
      })
    },
    WboT: function (e, t, n) {
      'use strict'
      var a = n('q1tI'),
        o = n.n(a),
        r = n('8+VR'),
        s = n('TSYQ'),
        c = n('ldG2'),
        l = n('xADF'),
        i = n('dKnb'),
        u = n('jh7f'),
        d = n('VET0'),
        p = n('ZgM/')
      const h = { large: c.b.FontSizeLarge, medium: c.b.FontSizeMedium },
        m = { attachment: d.a.top.attachment, targetAttachment: d.a.top.targetAttachment, attachmentOffsetY: -4 }
      function b(e) {
        const {
            className: t,
            inputClassName: n,
            stretch: o = !0,
            errorMessage: r,
            fontSizeStyle: c = 'large',
            endSlot: d,
            button: b,
            error: f,
            warning: g,
            innerLabel: v,
            inputReference: C,
            children: y,
            ...S
          } = e,
          E = f && void 0 !== r ? [r] : void 0,
          N = g && void 0 !== r ? [r] : void 0,
          w = s(p.inputContainer, h[c], t),
          k = v ? a.createElement(l.d, { className: p.innerLabel, interactive: !1 }, v) : void 0,
          x = d || b || y ? a.createElement(l.b, null, d, b, y) : void 0
        return a.createElement(i.a, {
          ...S,
          className: w,
          inputClassName: n,
          errors: E,
          warnings: N,
          hasErrors: f,
          hasWarnings: g,
          messagesPosition: u.a.Attached,
          customErrorsAttachment: m,
          messagesRoot: 'document',
          inheritMessagesWidthFromTarget: !0,
          disableMessagesRtlStyles: !0,
          iconHidden: !0,
          stretch: o,
          reference: C,
          startSlot: k,
          endSlot: x,
        })
      }
      var f = n('YFKU'),
        g = n('Iivm'),
        v = n('R4+T'),
        C = n('uZsJ')
      function y(e) {
        const t = s(C.control, C.controlIncrease),
          n = s(C.control, C.controlDecrease)
        return a.createElement(
          a.Fragment,
          null,
          void 0 !== e.title && a.createElement('div', { className: C.title }, e.title),
          a.createElement(
            'div',
            { className: C.controlWrapper },
            (e.defaultButtonsVisible || e.title) &&
              a.createElement(
                a.Fragment,
                null,
                a.createElement(
                  'button',
                  {
                    type: 'button',
                    tabIndex: -1,
                    'aria-label': Object(f.t)('Increase'),
                    className: t,
                    onClick: e.increaseValue,
                  },
                  a.createElement(g.a, { icon: v, className: C.controlIcon }),
                ),
                a.createElement(
                  'button',
                  {
                    type: 'button',
                    tabIndex: -1,
                    'aria-label': Object(f.t)('Increase'),
                    className: n,
                    onClick: e.decreaseValue,
                  },
                  a.createElement(g.a, { icon: v, className: C.controlIcon }),
                ),
              ),
          ),
        )
      }
      var S = n('8d0Q'),
        E = n('SpAO'),
        N = n('3F0O'),
        w = n('/3z9')
      n.d(t, 'a', function () {
        return O
      })
      const k = [38],
        x = [40]
      function O(e) {
        const [t, n] = Object(S.c)(),
          [s, c] = Object(E.a)(),
          l = Object(N.a)(c.onFocus, e.onFocus),
          i = Object(N.a)(c.onBlur, e.onBlur),
          u = Object(a.useCallback)(
            t => {
              !e.disabled &&
                s &&
                (t.preventDefault(), t.deltaY < 0 ? e.onValueByStepChange(1) : e.onValueByStepChange(-1))
            },
            [s, e.disabled, e.onValueByStepChange],
          )
        return o.a.createElement(b, {
          ...n,
          name: e.name,
          pattern: e.pattern,
          borderStyle: e.borderStyle,
          fontSizeStyle: e.fontSizeStyle,
          value: e.value,
          className: e.className,
          inputClassName: e.inputClassName,
          button: (function () {
            const { button: n, forceShowControls: a, disabled: c, title: l } = e,
              i = !c && !r.mobiletouch && (a || s || t)
            return c
              ? void 0
              : o.a.createElement(
                  o.a.Fragment,
                  null,
                  null != n
                    ? n
                    : o.a.createElement(y, { increaseValue: d, decreaseValue: p, defaultButtonsVisible: i, title: l }),
                )
          })(),
          disabled: e.disabled,
          placeholder: e.placeholder,
          innerLabel: e.innerLabel,
          endSlot: e.endSlot,
          containerReference: e.containerReference,
          inputReference: e.inputReference,
          inputMode: e.inputMode,
          type: e.type,
          error: e.error,
          errorMessage: e.errorMessage,
          onClick: e.onClick,
          onFocus: l,
          onBlur: i,
          onChange: e.onValueChange,
          onKeyDown: function (t) {
            if (e.disabled || 0 !== Object(w.modifiersFromEvent)(t.nativeEvent)) return
            let n = k,
              a = x
            e.controlDecKeyCodes && (a = a.concat(e.controlDecKeyCodes))
            e.controlIncKeyCodes && (n = n.concat(e.controlIncKeyCodes))
            ;(a.includes(t.keyCode) || n.includes(t.keyCode)) &&
              (t.preventDefault(), e.onValueByStepChange(a.includes(t.keyCode) ? -1 : 1))
            e.onKeyDown && e.onKeyDown(t)
          },
          onWheelNoPassive: u,
          stretch: e.stretch,
          intent: e.intent,
          highlight: e.highlight,
          highlightRemoveRoundBorder: e.highlightRemoveRoundBorder,
          autoSelectOnFocus: !0,
        })
        function d() {
          e.disabled || e.onValueByStepChange(1)
        }
        function p() {
          e.disabled || e.onValueByStepChange(-1)
        }
      }
    },
    'ZgM/': function (e, t, n) {
      e.exports = { innerLabel: 'innerLabel-21h1g6jU' }
    },
    eG6P: function (e, t, n) {
      e.exports = { wrap: 'wrap-2tojvhF7' }
    },
    fV01: function (e, t, n) {
      'use strict'
      n.d(t, 'b', function () {
        return u
      }),
        n.d(t, 'a', function () {
          return d
        })
      var a = n('q1tI'),
        o = n.n(a),
        r = n('Eyy1'),
        s = n('+8gn'),
        c = n('HfwS'),
        l = n('5YG5'),
        i = n('Si6X')
      function u(e, t) {
        const n = Object(l.a)(t).resolvedSymbolInfoBySymbol(e)
        return n && (n.ticker || n.full_name) ? n.ticker || n.full_name : e
      }
      const d = Object(c.a)(function (e) {
        const t = Object(a.useContext)(s.b),
          { study: n } = Object(r.ensureNotNull)(t),
          {
            input: { defval: c },
            value: l,
          } = e
        return o.a.createElement(i.a, { ...e, value: u(l || c || '', n), study: n })
      })
    },
    fV0y: function (e, t, n) {
      'use strict'
      var a = n('q1tI'),
        o = n('TSYQ'),
        r = n('0W35'),
        s = n('vCF3'),
        c = n('qibD')
      n('E9Pn')
      class l extends a.PureComponent {
        render() {
          const { inputClassName: e, labelClassName: t, ...n } = this.props,
            r = o(this.props.className, c.checkbox, {
              [c.reverse]: Boolean(this.props.labelPositionReverse),
              [c.baseline]: Boolean(this.props.labelAlignBaseline),
            }),
            l = o(c.label, t, { [c.disabled]: this.props.disabled })
          let i = null
          return (
            this.props.label &&
              (i = a.createElement('span', { className: l, title: this.props.title }, this.props.label)),
            a.createElement('label', { className: r }, a.createElement(s.a, { ...n, className: e }), i)
          )
        }
      }
      l.defaultProps = { value: 'on' }
      Object(r.b)(l)
      n.d(t, 'a', function () {
        return l
      })
    },
    fktV: function (e, t, n) {
      'use strict'
      var a = n('q1tI'),
        o = n.n(a),
        r = n('qFKp'),
        s = n('fV0y'),
        c = n('++uw')
      function l(e) {
        const { property: t, ...n } = e,
          [a, r] = Object(c.a)({ property: t })
        return o.a.createElement(s.a, {
          ...n,
          name: 'toggle-enabled',
          checked: a,
          onChange: function () {
            r(!a)
          },
        })
      }
      var i = n('xpzh'),
        u = n('vxCt')
      function d(e) {
        const { property: t, disabled: n, title: a, className: s, name: c } = e,
          d = o.a.createElement('span', { className: u.title }, a)
        return o.a.createElement(
          i.a,
          { className: s },
          t &&
            o.a.createElement(l, {
              name: c,
              className: u.checkbox,
              property: t,
              disabled: n,
              label: d,
              labelAlignBaseline: !r.isIE,
            }),
          !t && d,
        )
      }
      n.d(t, 'a', function () {
        return d
      })
    },
    pCpq: function (e, t, n) {
      e.exports = { hasTooltip: 'hasTooltip-2kfQACVg', uppercase: 'uppercase-2kfQACVg' }
    },
    qibD: function (e) {
      e.exports = JSON.parse(
        '{"checkbox":"checkbox-3xZUD-2M","reverse":"reverse-3xeTx96y","label":"label-cyItEVpF","baseline":"baseline-6TXKro4X"}',
      )
    },
    u52U: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none"><path stroke="currentColor" d="M13.5 7l1.65-1.65a.5.5 0 0 0 0-.7l-1.8-1.8a.5.5 0 0 0-.7 0L11 4.5M13.5 7L11 4.5M13.5 7l-8.35 8.35a.5.5 0 0 1-.36.15H2.5v-2.3a.5.5 0 0 1 .15-.35L11 4.5"/></svg>'
    },
    uZsJ: function (e, t, n) {
      e.exports = {
        controlWrapper: 'controlWrapper-7ApHzdB4',
        hidden: 'hidden-7ApHzdB4',
        control: 'control-7ApHzdB4',
        controlIncrease: 'controlIncrease-7ApHzdB4',
        controlDecrease: 'controlDecrease-7ApHzdB4',
        controlIcon: 'controlIcon-7ApHzdB4',
        title: 'title-7ApHzdB4',
      }
    },
    vxCt: function (e, t, n) {
      e.exports = { checkbox: 'checkbox-FNjK79Y1', title: 'title-FNjK79Y1' }
    },
    xNfs: function (e, t, n) {
      e.exports = { wrap: 'wrap-3GItoI3T', icon: 'icon-3GItoI3T', text: 'text-3GItoI3T', disabled: 'disabled-3GItoI3T' }
    },
    xpzh: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return l
      })
      var a = n('q1tI'),
        o = n.n(a),
        r = n('TSYQ'),
        s = n.n(r),
        c = n('eG6P')
      function l(e) {
        return o.a.createElement('div', { className: s()(c.wrap, e.className) }, e.children)
      }
    },
    yqnI: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return o
      })
      var a = n('txPx')
      const o = Object(a.getLogger)('Platform.GUI.PropertyDefinitionTrace')
    },
  },
])
