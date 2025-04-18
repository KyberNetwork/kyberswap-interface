;(window.webpackJsonp = window.webpackJsonp || []).push([
  [55],
  {
    '5Ssy': function (e, t, n) {
      'use strict'
      var s,
        o = n('YFKU'),
        r = n('q1tI'),
        a = n.n(r),
        i = n('+8gn'),
        l = n('Q+1u'),
        c = n('0W35'),
        u = n('TSYQ'),
        p = n('b8Mn')
      n('GZ2k')
      const h = Object(c.b)(
        (((s = class extends r.PureComponent {
          constructor() {
            super(...arguments),
              (this._onChange = () => {
                this.props.onChange && this.props.onChange(this.props.value)
              })
          }
          render() {
            const e = u(this.props.className, p.radio, { [p.reverse]: Boolean(this.props.labelPositionReverse) }),
              t = u(p.label, { [p.disabled]: this.props.disabled }),
              n = u(p.box, { [p.noOutline]: -1 === this.props.tabIndex })
            let s = null
            return (
              this.props.label && (s = r.createElement('span', { className: t }, this.props.label)),
              r.createElement(
                'label',
                { className: e },
                r.createElement(
                  'span',
                  { className: p.wrapper, title: this.props.title },
                  r.createElement('input', {
                    id: this.props.id,
                    tabIndex: this.props.tabIndex,
                    autoFocus: this.props.autoFocus,
                    role: this.props.role,
                    className: p.input,
                    type: 'radio',
                    name: this.props.name,
                    checked: this.props.checked,
                    disabled: this.props.disabled,
                    value: this.props.value,
                    onChange: this._onChange,
                    ref: this.props.reference,
                  }),
                  r.createElement('span', { className: n }),
                ),
                s,
              )
            )
          }
        }).defaultProps = { value: 'on' }),
        s),
      )
      var d = n('Eyy1'),
        m = n('fV01'),
        f = n('HfwS'),
        b = n('qzWo'),
        g = n('tDS2')
      function v(e) {
        const { children: t, input: n, disabled: s, onChange: u, grouped: p, tooltip: v } = e,
          C = Object(r.useContext)(i.b),
          { values: y, setValue: E } = Object(d.ensureNotNull)(C),
          _ = y[n.id],
          [O, T] = Object(r.useState)(_ ? 'another-symbol' : 'main-symbol'),
          [S, w] = Object(r.useState)(_)
        return (
          Object(r.useEffect)(() => {
            _ && w(_)
          }, [_]),
          a.a.createElement(
            c.a,
            {
              name: 'symbol-source-' + n.id,
              values: [O],
              onChange: function (e) {
                T(e),
                  'main-symbol' === e
                    ? Object(f.b)(E)('', n.id, n.name)
                    : 'another-symbol' === e && S && Object(f.b)(E, u)(S, n.id, n.name)
              },
            },
            a.a.createElement(
              l.a.Row,
              null,
              a.a.createElement(
                l.a.Cell,
                { colSpan: 2, placement: 'first', grouped: p },
                a.a.createElement(h, {
                  value: 'main-symbol',
                  className: g.checkbox,
                  disabled: s,
                  label: a.a.createElement(
                    'span',
                    { className: g.label },
                    Object(o.t)('Main chart symbol', { context: 'input' }),
                  ),
                }),
              ),
            ),
            a.a.createElement(
              l.a.Row,
              null,
              a.a.createElement(
                l.a.Cell,
                { placement: 'first', grouped: p },
                a.a.createElement(h, {
                  value: 'another-symbol',
                  className: g.checkbox,
                  disabled: s,
                  label: a.a.createElement(
                    'span',
                    { className: g.label },
                    Object(o.t)('Another symbol', { context: 'input' }),
                  ),
                }),
              ),
              a.a.createElement(
                l.a.Cell,
                { placement: 'last', grouped: p },
                t ||
                  a.a.createElement(m.a, {
                    input: Object(d.ensureDefined)(n),
                    onChange: u,
                    disabled: s || 'main-symbol' === O,
                    hasTooltip: Boolean(v),
                  }),
                v && a.a.createElement(b.a, { title: v }),
              ),
            ),
          )
        )
      }
      var C = n('h5Dg')
      class y extends r.PureComponent {
        render() {
          const { label: e, input: t, tooltip: n } = this.props
          return r.createElement(
            l.a.Row,
            null,
            r.createElement(
              l.a.Cell,
              { placement: 'first', colSpan: 2 },
              r.createElement(C.a, { label: e, input: t, hasTooltip: Boolean(n) }),
              n && r.createElement(b.a, { title: n }),
            ),
          )
        }
      }
      var E = n('rJEJ')
      function _(e) {
        const { input: t, tooltip: n } = e
        return 'symbol' === t.type && t.optional
          ? r.createElement(v, { input: t, tooltip: n })
          : 'bool' === t.type
          ? r.createElement(y, { label: Object(o.t)(t.name, { context: 'input' }), input: t, tooltip: n })
          : r.createElement(E.a, {
              labelAlign: (function (e) {
                switch (e) {
                  case 'session':
                    return 'adaptive'
                  case 'time':
                    return 'topCenter'
                  default:
                    return
                }
              })(t.type),
              input: t,
              tooltip: n,
            })
      }
      var O = n('07LS'),
        T = n('MALe')
      function S(e) {
        const { content: t } = e
        let n
        return r.createElement(
          l.a.InlineRowContext.Provider,
          { value: !0 },
          r.createElement(
            'div',
            { className: T.inlineRow },
            t.children.map(
              (e, s) => (
                void 0 !== e.tooltip && (n = e.tooltip),
                r.createElement(_, { key: e.id, input: e, tooltip: s === t.children.length - 1 ? n : void 0 })
              ),
            ),
          ),
        )
      }
      var w = n('M87J'),
        j = n('Jt4T')
      function x(e) {
        const { content: t } = e
        return Object(w.b)(t)
          ? Object(w.c)(t)
            ? r.createElement(S, { content: t })
            : r.createElement(
                r.Fragment,
                null,
                r.createElement('div', { className: j.titleWrap }, r.createElement(O.a, { title: t.id, name: t.id })),
                t.children.map(e =>
                  Object(w.b)(e)
                    ? r.createElement(S, { key: e.id, content: e })
                    : r.createElement(_, { key: e.id, input: e, tooltip: e.tooltip }),
                ),
                r.createElement('div', { className: j.groupFooter }),
              )
          : r.createElement(_, { input: t, tooltip: t.tooltip })
      }
      n.d(t, 'a', function () {
        return N
      })
      const k = { offset: window.t('Offset') }
      class N extends a.a.PureComponent {
        render() {
          const { reference: e, inputs: t, property: n, study: s, model: o } = this.props,
            { offset: r, offsets: i } = n
          return a.a.createElement(
            l.a,
            { reference: e },
            a.a.createElement(R, { study: s, model: o, property: n.inputs, inputs: t }),
            r && this._createOffsetSection(r),
            i &&
              i.childNames().map(e => {
                const t = i.childs()[e]
                return this._createOffsetSection(t)
              }),
          )
        }
        _createOffsetSection(e) {
          const t = e.childs()
          return a.a.createElement(R, {
            key: 'offset_' + t.title.value(),
            study: this.props.study,
            model: this.props.model,
            inputs: [P(t)],
            property: e,
          })
        }
      }
      function R(e) {
        const { study: t, model: n, inputs: s, property: o } = e,
          l = Object(r.useMemo)(() => Object(w.a)(s), [s])
        return a.a.createElement(
          i.a,
          { property: o, study: t, model: n },
          l.map(e => a.a.createElement(x, { key: e.id, content: e })),
        )
      }
      function P(e) {
        return {
          id: 'val',
          name: e.title.value() || k.offset,
          defval: e.val.value(),
          type: 'integer',
          min: e.min.value(),
          max: e.max.value(),
        }
      }
    },
    GZ2k: function (e, t, n) {},
    HGyE: function (e, t, n) {
      'use strict'
      n.d(t, 'b', function () {
        return c
      }),
        n.d(t, 'a', function () {
          return u
        })
      var s = n('q1tI'),
        o = n('TSYQ'),
        r = n.n(o),
        a = n('PECq'),
        i = n('HfwS'),
        l = n('tDS2')
      class c extends s.PureComponent {
        constructor() {
          super(...arguments),
            (this._onChange = e => {
              const {
                input: { id: t, name: n },
                onChange: s,
              } = this.props
              s(e, t, n)
            })
        }
        render() {
          const {
              input: { id: e, defval: t, options: n, optionsTitles: o },
              value: i,
              disabled: c,
              hasTooltip: u,
            } = this.props,
            p = n.map(e => {
              const t = o && o[e] ? o[e] : e
              return { value: e, content: window.t(t, { context: 'input' }) }
            }),
            h = void 0 !== i && n.includes(i) ? i : t
          return s.createElement(a.a, {
            id: e,
            className: r()(l.input, u && l.hasTooltip),
            menuClassName: l.dropdownMenu,
            value: h,
            items: p,
            onChange: this._onChange,
            disabled: c,
          })
        }
      }
      const u = Object(i.a)(c)
    },
    HyYY: function (e, t, n) {
      e.exports = { icon: 'icon-3oPFhRYI' }
    },
    Jt4T: function (e, t, n) {
      e.exports = { titleWrap: 'titleWrap-24p2N42k', groupFooter: 'groupFooter-24p2N42k' }
    },
    KJt4: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return o
      }),
        n.d(t, 'b', function () {
          return r
        })
      var s = n('q1tI')
      const o = s.createContext(null)
      function r(e, t) {
        return s.createElement(o.Consumer, null, n =>
          n ? s.createElement(e, { ...Object.assign({ model: n }, t) }) : null,
        )
      }
    },
    M87J: function (e, t, n) {
      'use strict'
      n.d(t, 'b', function () {
        return o
      }),
        n.d(t, 'c', function () {
          return r
        }),
        n.d(t, 'a', function () {
          return a
        })
      var s = n('Eyy1')
      function o(e) {
        return e.hasOwnProperty('groupType')
      }
      function r(e) {
        return o(e) && 'inline' === e.groupType
      }
      function a(e) {
        const t = [],
          n = new Map(),
          o = new Map()
        return (
          o.set(void 0, new Map()),
          e.forEach(e => {
            const { group: r, inline: a } = e
            if (void 0 !== r || void 0 !== a)
              if (void 0 !== r)
                if (void 0 !== a)
                  if (n.has(r)) {
                    const t = Object(s.ensureDefined)(n.get(r))
                    let l
                    o.has(t) ? (l = Object(s.ensureDefined)(o.get(t))) : ((l = new Map()), o.set(t, l)),
                      i(e, 'inline', a, l, t.children)
                  } else {
                    const s = { id: a, groupType: 'inline', children: [e] },
                      i = { id: r, groupType: 'group', children: [s] },
                      l = new Map()
                    l.set(a, s), o.set(i, l), n.set(r, i), t.push(i)
                  }
                else i(e, 'group', r, n, t)
              else {
                const n = Object(s.ensureDefined)(o.get(void 0))
                i(e, 'inline', Object(s.ensureDefined)(a), n, t)
              }
            else t.push(e)
          }),
          t
        )
      }
      function i(e, t, n, o, r) {
        if (o.has(n)) Object(s.ensureDefined)(o.get(n)).children.push(e)
        else {
          const s = { id: n, groupType: t, children: [e] }
          o.set(n, s), r.push(s)
        }
      }
    },
    MALe: function (e, t, n) {
      e.exports = { inlineRow: 'inlineRow-3IOXimxZ' }
    },
    PjdP: function (e, t, n) {
      'use strict'
      var s = n('q1tI'),
        o = n('ZAxB'),
        r = n('kk0y'),
        a = n('YS4w'),
        i = n('h5Dg'),
        l = n('TSYQ'),
        c = n.n(l),
        u = n('wHCJ'),
        p = n('HfwS'),
        h = n('Yi2Q'),
        d = n('tDS2')
      class m extends s.PureComponent {
        constructor() {
          super(...arguments),
            (this._onChange = e => {
              const {
                input: { id: t, name: n },
                onChange: s,
              } = this.props
              s(e.currentTarget.value, t, n)
            })
        }
        render() {
          const {
            input: { defval: e },
            value: t,
            disabled: n,
            onBlur: o,
            onKeyDown: r,
            hasTooltip: a,
          } = this.props
          return s.createElement(u.a, {
            className: c()(d.input, a && d.hasTooltip),
            value: void 0 === t ? e : t,
            onChange: this._onChange,
            onBlur: o,
            onKeyDown: r,
            disabled: n,
          })
        }
      }
      const f = Object(h.a)(m),
        b = Object(p.a)(f)
      var g = n('fV01'),
        v = n('Eyy1'),
        C = n('XDrA'),
        y = n('qZIh')
      function E(e = '') {
        const [, t = '', n = '', s = '', o = ''] = Array.from(e.match(/^(\d\d)(\d\d)-(\d\d)(\d\d)/) || [])
        return [`${t}:${n}`, `${s}:${o}`]
      }
      class _ extends s.PureComponent {
        constructor(e) {
          super(e),
            (this._onStartPick = e => {
              this.setState({ startTime: e }, this._onChange)
            }),
            (this._onEndPick = e => {
              this.setState({ endTime: e }, this._onChange)
            }),
            (this._onChange = () => {
              const {
                  input: { id: e, name: t },
                  onChange: n,
                } = this.props,
                { startTime: s, endTime: o } = this.state
              n(s.replace(':', '') + '-' + o.replace(':', ''), e, t)
            })
          const t = e.value || e.input.defval,
            [n, s] = E(t)
          this.state = { prevValue: t, startTime: n, endTime: s }
        }
        render() {
          const { startTime: e, endTime: t } = this.state,
            { hasTooltip: n } = this.props
          return s.createElement(
            C.a,
            { className: c()(n && d.hasTooltip) },
            s.createElement(
              'div',
              { className: d.sessionStart },
              s.createElement(y.a, {
                className: c()(d.input, d.sessionInputContainer),
                name: 'start',
                value: Object(v.ensureDefined)(e),
                onChange: this._onStartPick,
              }),
              s.createElement('span', { className: d.sessionDash }, ' — '),
            ),
            s.createElement(
              'div',
              { className: d.sessionEnd },
              s.createElement(y.a, {
                className: c()(d.input, d.sessionInputContainer),
                name: 'end',
                value: Object(v.ensureDefined)(t),
                onChange: this._onEndPick,
              }),
            ),
          )
        }
        static getDerivedStateFromProps(e, t) {
          if (e.value === t.prevValue) return t
          const [n, s] = E(e.value)
          return { prevValue: e.value, startTime: n, endTime: s }
        }
      }
      const O = Object(p.a)(_)
      var T = n('YFKU'),
        S = n('Kxc7'),
        w = n('0YCj'),
        j = n.n(w),
        x = n('+8gn'),
        k = n('HGyE'),
        N = n('5YG5')
      const R = {
        open: window.t('open'),
        high: window.t('high'),
        low: window.t('low'),
        close: window.t('close'),
        hl2: window.t('hl2'),
        hlc3: window.t('hlc3'),
        ohlc4: window.t('ohlc4'),
      }
      class P extends s.PureComponent {
        render() {
          const { input: e } = this.props,
            { study: t, model: n } = this.context
          let o = { ...R }
          const r = Object(N.a)(t)
          if (t && this._isStudy(t) && t.isChildStudy()) {
            const t = r.parentSource(),
              n = t.title(),
              s = j.a.getChildSourceInputTitles(e, t.metaInfo(), n)
            o = { ...o, ...s }
          }
          if (
            S.enabled('study_on_study') &&
            t &&
            this._isStudy(t) &&
            (t.isChildStudy() || j.a.canBeChild(t.metaInfo()))
          ) {
            const e = [t, ...r.getAllChildren()]
            n.model()
              .allStudies()
              .filter(t => t.canHaveChildren() && !e.includes(t))
              .forEach(e => {
                const t = e.title(!0, void 0, !0),
                  n = e.sourceId() || '#' + e.id(),
                  s = e.metaInfo(),
                  r = s.styles,
                  a = s.plots || []
                if (1 === a.length) o[n + '$0'] = t
                else if (a.length > 1) {
                  const e = a.reduce((e, s, o) => {
                    if (!j.a.canPlotBeSourceOfChildStudy(s.type)) return e
                    let a
                    try {
                      a = Object(v.ensureDefined)(Object(v.ensureDefined)(r)[s.id]).title
                    } catch (e) {
                      a = s.id
                    }
                    return { ...e, [`${n}$${o}`]: `${t}: ${a}` }
                  }, {})
                  o = { ...o, ...e }
                }
              })
          }
          const a = { ...e, type: 'text', options: Object.keys(o), optionsTitles: o }
          return s.createElement(k.a, { ...this.props, input: a })
        }
        _isStudy(e) {
          return !e.hasOwnProperty('isInputsStudy')
        }
      }
      P.contextType = x.b
      var V = n('LxhU'),
        I = n('pPtI'),
        D = n('PECq')
      const B = void 0,
        M = ['1', '3', '5', '15', '30', '45', '60', '120', '180', '240', '1D', '1W', '1M']
      class q extends s.PureComponent {
        constructor() {
          super(...arguments),
            (this._onChange = e => {
              const {
                input: { id: t, name: n },
                onChange: s,
              } = this.props
              s(e, t, n)
            })
        }
        render() {
          const { input: e, value: t, disabled: n, hasTooltip: o } = this.props,
            r = V.Interval.parse(void 0 === t ? e.defval : t),
            a = r.multiplier()
          let i = r.value()
          const l = B ? B.get().filter(e => !V.Interval.parse(e).isRange()) : [],
            u = Object(I.mergeResolutions)(M, l)
          return (
            u.unshift(''),
            (a && u.includes(i)) || (i = u[0]),
            s.createElement(D.a, {
              id: e.id,
              className: c()(d.input, d.resolution, o && d.hasTooltip),
              menuClassName: c()(d.dropdownMenu, d.resolution),
              items:
                ((p = u),
                p.map(e => ({
                  value: e,
                  content: '' === e ? Object(T.t)('Same as chart') : Object(I.getTranslatedResolutionModel)(e).hint,
                }))),
              value: i,
              onChange: this._onChange,
              disabled: n,
            })
          )
          var p
        }
      }
      const W = Object(p.a)(q)
      var Y = n('lkVX'),
        F = n('Z1Tk')
      class H extends s.PureComponent {
        render() {
          return s.createElement(x.b.Consumer, null, e => (e ? this._getColorInputWithContext(e) : null))
        }
        _getColorInputWithContext(e) {
          var t
          const {
              input: { id: n },
              disabled: o,
              hasTooltip: r,
            } = this.props,
            { model: a, study: i } = e
          if ('properties' in i || 'tempProperties' in i) {
            const e =
              'properties' in i
                ? i.properties().inputs[n]
                : null === (t = i.tempProperties) || void 0 === t
                ? void 0
                : t.inputs.child(n)
            return s.createElement(
              F.a,
              { model: a, property: e },
              s.createElement(Y.a, { className: c()(r && d.hasTooltip), color: e, disabled: o }),
            )
          }
          return null
        }
      }
      n.d(t, 'a', function () {
        return K
      })
      class K extends s.PureComponent {
        render() {
          const { input: e, disabled: t, onChange: n, tzName: l, hasTooltip: c } = this.props
          if (Object(o.b)(e)) return s.createElement(k.a, { input: e, disabled: t, onChange: n, hasTooltip: c })
          switch (e.type) {
            case 'integer':
              return s.createElement(r.a, { input: e, disabled: t, onChange: n, hasTooltip: c })
            case 'float':
            case 'price':
              return s.createElement(a.a, { input: e, disabled: t, onChange: n, hasTooltip: c })
            case 'bool':
              return s.createElement(i.a, { input: e, disabled: t, onChange: n, hasTooltip: c })
            case 'text':
              return s.createElement(b, { input: e, disabled: t, onChange: n, hasTooltip: c })
            case 'symbol':
              return s.createElement(g.a, { input: e, disabled: t, onChange: n, hasTooltip: c })
            case 'session':
              return s.createElement(O, { input: e, disabled: t, onChange: n, hasTooltip: c })
            case 'source':
              return s.createElement(P, { input: e, disabled: t, onChange: n, hasTooltip: c })
            case 'resolution':
              return s.createElement(W, { input: e, disabled: t, onChange: n, hasTooltip: c })
            case 'time':
              return null
            case 'color':
              return s.createElement(H, { input: e, disabled: t, onChange: n, hasTooltip: c })
            default:
              return null
          }
        }
      }
    },
    S0KV: function (e, t, n) {
      'use strict'
      function s(e) {
        return Array.isArray(e) ? e[0].value() : e.value()
      }
      function o(e, t) {
        if (Array.isArray(e)) for (const n of e) t(n)
        else t(e)
      }
      n.d(t, 'a', function () {
        return s
      }),
        n.d(t, 'b', function () {
          return o
        })
    },
    UYhW: function (e, t, n) {
      'use strict'
      var s = n('q1tI'),
        o = n.n(s),
        r = n('Eyy1'),
        a = n('YFKU'),
        i = n('nc0P'),
        l = n('WboT'),
        c = n('EBrf'),
        u = n('Ialn')
      var p = n('zXvd'),
        h = n('Hr11')
      const d = Object(a.t)('Number format is invalid.'),
        m = new (class {
          constructor(e = ' ') {
            this._divider = e
          }
          format(e) {
            const t = Object(c.splitThousands)(e, this._divider)
            return Object(u.isRtl)() ? Object(u.startWithLTR)(t) : t
          }
          parse(e) {
            const t = Object(u.stripLTRMarks)(e).split(this._divider).join(''),
              n = Number(t)
            return isNaN(n) || /e/i.test(t) ? { res: !1 } : { res: !0, value: n, suggest: this.format(n) }
          }
        })(),
        f = /^-?[0-9]*$/,
        b = 9e15
      class g extends o.a.PureComponent {
        constructor(e) {
          super(e),
            (this._onFocus = e => {
              this.setState({ focused: !0 }), this.props.onFocus && this.props.onFocus(e)
            }),
            (this._onBlur = e => {
              this.setState({ displayValue: v(this.props, this.props.value), focused: !1 }),
                this.props.errorHandler && this.props.errorHandler(!1),
                this.props.onBlur && this.props.onBlur(e)
            }),
            (this._onValueChange = e => {
              const t = e.target.value
              if (
                (void 0 !== this.props.onEmptyString && '' === t && this.props.onEmptyString(),
                'integer' === this.props.mode && !f.test(t))
              )
                return
              const n = C(t, this.props.formatter),
                s = n.res ? this._checkValueBoundaries(n.value) : { value: !1 },
                o = n.res && !s.value,
                r = n.res && n.suggest && !this.state.focused ? n.suggest : t,
                a = o && s.msg ? s.msg : d
              this.setState({ displayValue: r, errorMsg: a }),
                n.res && s.value && this.props.onValueChange(n.value, 'input'),
                this.props.errorHandler && this.props.errorHandler(!n.res || o)
            }),
            (this._onValueByStepChange = e => {
              const { roundByStep: t = !0, step: n = 1, uiStep: s, min: o = n, formatter: r } = this.props,
                a = C(this.state.displayValue, r),
                l = null != s ? s : n
              let c = n
              if (a.res) {
                const s = new i.Big(a.value),
                  r = s.minus(o).mod(n)
                let u = s.plus(e * l)
                !r.eq(0) && t && (u = u.plus((e > 0 ? 0 : 1) * l).minus(r)), (c = Number(u))
              }
              this._checkValueBoundaries(c).value &&
                (this.setState({ displayValue: v(this.props, c) }), this.props.onValueChange(c, 'step')),
                this.props.errorHandler && this.props.errorHandler(!1)
            })
          const { value: t } = e
          this.state = { value: t, displayValue: v(e, t), focused: !1, errorMsg: d }
        }
        render() {
          return o.a.createElement(l.a, {
            inputMode: this.props.inputMode,
            borderStyle: this.props.borderStyle,
            fontSizeStyle: this.props.fontSizeStyle,
            value: this.state.displayValue,
            forceShowControls: this.props.forceShowControls,
            className: this.props.className,
            inputClassName: this.props.inputClassName,
            button: this.props.button,
            placeholder: this.props.placeholder,
            innerLabel: this.props.innerLabel,
            endSlot: this.props.endSlot,
            disabled: this.props.disabled,
            error: this.props.error,
            errorMessage: this.props.errorMessage || this.state.errorMsg,
            onValueChange: this._onValueChange,
            onValueByStepChange: this._onValueByStepChange,
            containerReference: this.props.containerReference,
            inputReference: this.props.inputReference,
            onClick: this.props.onClick,
            onFocus: this._onFocus,
            onBlur: this._onBlur,
            onKeyDown: this.props.onKeyDown,
            controlDecKeyCodes: this.props.controlDecKeyCodes,
            controlIncKeyCodes: this.props.controlIncKeyCodes,
            title: this.props.title,
            intent: this.props.intent,
            highlight: this.props.highlight,
            highlightRemoveRoundBorder: this.props.highlightRemoveRoundBorder,
            stretch: this.props.stretch,
          })
        }
        getClampedValue() {
          const { min: e = -1 / 0, max: t = b } = this.props,
            n = C(this.state.displayValue, this.props.formatter)
          return n.res ? Object(h.clamp)(n.value, e, t) : null
        }
        static getDerivedStateFromProps(e, t) {
          const { alwaysUpdateValueFromProps: n, value: s } = e
          return (t.focused && !n) || t.value === s ? null : { value: s, displayValue: v(e, s) }
        }
        _checkValueBoundaries(e) {
          const { min: t = -1 / 0, max: n = b } = this.props,
            s = (function (e, t, n) {
              const s = e >= t,
                o = e <= n
              return { passMin: s, passMax: o, pass: s && o, clamped: Object(h.clamp)(e, t, n) }
            })(e, t, n),
            o = s.passMax
              ? s.passMin
                ? void 0
                : Object(a.t)('Specified value is less than the instrument minimum of {min}.').format({
                    min: String(t),
                  })
              : Object(a.t)('Specified value is more than the instrument maximum of {max}.').format({ max: String(n) })
          return { value: s.pass, msg: o }
        }
      }
      function v(e, t) {
        const { useFormatter: n = !0, formatter: s, mode: o } = e
        return n && 'integer' !== o
          ? (function (e, t = m) {
              return null !== e ? t.format(e) : ''
            })(t, s)
          : (function (e) {
              if (null === e) return ''
              return p.NumericFormatter.formatNoE(e)
            })(t)
      }
      function C(e, t = m) {
        return t.parse ? t.parse(e) : { res: !1, error: 'Formatter does not support parse' }
      }
      var y = n('qFKp')
      n.d(t, 'a', function () {
        return E
      })
      class E extends s.PureComponent {
        constructor() {
          super(...arguments),
            (this._container = null),
            (this._handleContainerRef = e => (this._container = e)),
            (this._onChange = (e, t) => {
              const {
                input: { id: n, name: s },
                onChange: o,
                onBlur: r,
              } = this.props
              o(e, n, s), 'step' === t && r && r()
            }),
            (this._onBlur = e => {
              const { onBlur: t } = this.props
              if (t) {
                const n = Object(r.ensureNotNull)(this._container)
                n.contains(document.activeElement) || n.contains(e.relatedTarget) || t()
              }
            })
        }
        render() {
          const {
            input: { defval: e, min: t, max: n, step: o },
            value: r,
            disabled: a,
            onKeyDown: i,
            className: l,
            mode: c,
            stretch: u,
          } = this.props
          return s.createElement(g, {
            className: l,
            value: Number(void 0 === r ? e : r),
            min: t,
            max: n,
            step: o,
            mode: c,
            onBlur: this._onBlur,
            onValueChange: this._onChange,
            onKeyDown: i,
            disabled: a,
            containerReference: this._handleContainerRef,
            inputMode: y.CheckMobile.iOS() ? void 0 : 'numeric',
            fontSizeStyle: 'medium',
            roundByStep: !1,
            stretch: u,
          })
        }
      }
    },
    XDrA: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return l
      })
      var s = n('q1tI'),
        o = n.n(s),
        r = n('TSYQ'),
        a = n('Q+1u'),
        i = n('tDS2')
      function l(e) {
        const { className: t } = e,
          n = Object(s.useContext)(a.a.InlineRowContext)
        return o.a.createElement('div', { className: r(i.inputGroup, n && i.inlineGroup, t) }, e.children)
      }
    },
    YS4w: function (e, t, n) {
      'use strict'
      n.d(t, 'b', function () {
        return p
      }),
        n.d(t, 'a', function () {
          return h
        })
      var s = n('q1tI'),
        o = n('TSYQ'),
        r = n.n(o),
        a = n('UYhW'),
        i = n('HfwS'),
        l = n('Yi2Q'),
        c = n('tDS2')
      class u extends s.PureComponent {
        render() {
          const { hasTooltip: e } = this.props
          return s.createElement(a.a, { ...this.props, className: r()(c.input, e && c.hasTooltip), stretch: !1 })
        }
      }
      const p = Object(l.a)(u, { change: 1 / 0, commit: 0, blur: 0 }),
        h = Object(i.a)(p)
    },
    Yi2Q: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return r
      })
      var s = n('q1tI')
      const o = { blur: 0, commit: 0, change: 1 / 0 }
      function r(e, t = o) {
        return class extends s.PureComponent {
          constructor(e) {
            super(e),
              (this._onChange = (e, n, s) => {
                const o = t.change
                o
                  ? (clearTimeout(this._timeout),
                    this.setState({ value: e }, () => {
                      o !== 1 / 0 && (this._timeout = setTimeout(() => this._flush(), o))
                    }))
                  : this._flush(e)
              }),
              (this._onBlur = () => {
                this._debounce(t.blur)
                const { onBlur: e } = this.props
                e && e()
              }),
              (this._onKeyDown = e => {
                13 === e.keyCode && this._debounce(t.commit)
              }),
              (this.state = { prevValue: e.value, value: e.value })
          }
          componentWillUnmount() {
            this._flush()
          }
          render() {
            const { value: t } = this.state
            return s.createElement(e, {
              ...this.props,
              value: t,
              onChange: this._onChange,
              onBlur: this._onBlur,
              onKeyDown: this._onKeyDown,
            })
          }
          static getDerivedStateFromProps(e, t) {
            return e.value === t.prevValue ? t : { prevValue: e.value, value: e.value }
          }
          _debounce(e) {
            e
              ? (clearTimeout(this._timeout), e !== 1 / 0 && (this._timeout = setTimeout(() => this._flush(), e)))
              : this.setState(e => {
                  this._flush(e.value)
                })
          }
          _flush(e) {
            const {
                input: { id: t, name: n },
                onChange: s,
              } = this.props,
              { prevValue: o, value: r } = this.state
            clearTimeout(this._timeout)
            const a = void 0 !== e ? e : r
            void 0 !== a && a !== o && s(a, t, n)
          }
        }
      }
    },
    Z1Tk: function (e, t, n) {
      'use strict'
      n.d(t, 'b', function () {
        return r
      }),
        n.d(t, 'a', function () {
          return a
        }),
        n.d(t, 'c', function () {
          return i
        })
      var s = n('q1tI'),
        o = n('KJt4')
      const r = s.createContext(null)
      class a extends s.PureComponent {
        constructor() {
          super(...arguments),
            (this._setValue = (e, t, n) => {
              const { model: s } = this.props
              s.setProperty(e, t, n)
            })
        }
        componentDidMount() {
          const { property: e } = this.props
          e.subscribe(this, () => this.forceUpdate())
        }
        componentWillUnmount() {
          const { property: e } = this.props
          e.unsubscribeAll(this)
        }
        render() {
          const e = { setValue: this._setValue }
          return s.createElement(r.Provider, { value: e }, this.props.children)
        }
      }
      function i(e, t) {
        return Object(o.b)(
          ({ model: n }) => s.createElement(a, { model: n, property: t.property }, s.createElement(e, { ...t })),
          t,
        )
      }
    },
    b8Mn: function (e) {
      e.exports = JSON.parse(
        '{"radio":"radio-1cZENBYk","input":"input-303BGOua","box":"box-3rMRS-wv","reverse":"reverse-39E2s_WA","label":"label-3Xg_J0oJ","wrapper":"wrapper-1Law0ttl","noOutline":"noOutline-3-BkNnru"}',
      )
    },
    h5Dg: function (e, t, n) {
      'use strict'
      n.d(t, 'b', function () {
        return u
      }),
        n.d(t, 'a', function () {
          return p
        })
      var s = n('q1tI'),
        o = n('fV0y'),
        r = n('TSYQ'),
        a = n.n(r),
        i = n('qFKp'),
        l = n('HfwS'),
        c = n('tDS2')
      class u extends s.PureComponent {
        constructor() {
          super(...arguments),
            (this._onChange = () => {
              const {
                input: { id: e, name: t },
                value: n,
                onChange: s,
              } = this.props
              s(!n, e, t)
            })
        }
        render() {
          const {
              input: { defval: e },
              value: t,
              disabled: n,
              label: r,
              hasTooltip: l,
            } = this.props,
            u = void 0 === t ? e : t
          return s.createElement(o.a, {
            className: a()(c.checkbox, l && c.hasTooltip),
            disabled: n,
            checked: u,
            onChange: this._onChange,
            label: s.createElement('span', { className: c.label }, r),
            labelAlignBaseline: !i.isIE,
          })
        }
      }
      const p = Object(l.a)(u)
    },
    kk0y: function (e, t, n) {
      'use strict'
      n.d(t, 'b', function () {
        return p
      }),
        n.d(t, 'a', function () {
          return h
        })
      var s = n('q1tI'),
        o = n('TSYQ'),
        r = n.n(o),
        a = n('HfwS'),
        i = n('Yi2Q'),
        l = n('UYhW'),
        c = n('tDS2')
      class u extends s.PureComponent {
        render() {
          const { hasTooltip: e } = this.props
          return s.createElement(l.a, {
            ...this.props,
            mode: 'integer',
            className: r()(c.input, e && c.hasTooltip),
            stretch: !1,
          })
        }
      }
      const p = Object(i.a)(u, { change: 1 / 0, commit: 0, blur: 0 }),
        h = Object(a.a)(p)
    },
    lkVX: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return f
      })
      n('YFKU')
      var s = n('q1tI'),
        o = n.n(s),
        r = n('eJTA'),
        a = n('Tmoa'),
        i = n('Z1Tk'),
        l = n('7MId'),
        c = n('S0KV'),
        u = n('JWMC')
      const p = window.t('Change Thickness'),
        h = window.t('Change Color'),
        d = window.t('Change Opacity'),
        m = [1, 2, 3, 4]
      class f extends o.a.PureComponent {
        constructor() {
          super(...arguments),
            (this._trackEventLabel = null),
            (this._getTransparencyValue = () => {
              const { transparency: e } = this.props
              return e ? e.value() : 0
            }),
            (this._getOpacityValue = () => {
              const { color: e } = this.props,
                t = Object(c.a)(e)
              if (t)
                return Object(a.isHexColor)(t)
                  ? Object(a.transparencyToAlpha)(this._getTransparencyValue())
                  : Object(r.parseRgba)(t)[3]
            }),
            (this._getColorValueInHex = () => {
              const { color: e } = this.props,
                t = Object(c.a)(e)
              return t ? (Object(a.isHexColor)(t) ? t : Object(r.rgbToHexString)(Object(r.parseRgb)(t))) : null
            }),
            (this._onThicknessChange = e => {
              const { thickness: t } = this.props
              void 0 !== t && this._setProperty(t, e, p)
            }),
            (this._onColorChange = e => {
              const { color: t, isPaletteColor: n } = this.props,
                s = Object(c.a)(t)
              let o = 0
              s &&
                (o = Object(a.isHexColor)(s)
                  ? this._getTransparencyValue()
                  : Object(a.alphaToTransparency)(Object(r.parseRgba)(s)[3])),
                this._setProperty(t, Object(a.generateColor)(String(e), o, !0), h),
                (this._trackEventLabel = 'Plot color > ' + (n ? 'Palette' : 'Single'))
            }),
            (this._onOpacityChange = e => {
              const { color: t } = this.props,
                n = Object(c.a)(t)
              this._setProperty(t, Object(a.generateColor)(n, Object(a.alphaToTransparency)(e), !0), d)
            }),
            (this._onPopupClose = () => {
              this._trackEventLabel &&
                (Object(u.trackEvent)('GUI', 'Study settings', this._trackEventLabel), (this._trackEventLabel = null))
            })
        }
        componentWillUnmount() {
          this._onPopupClose()
        }
        render() {
          const { selectOpacity: e = !0, disabled: t, className: n } = this.props
          return o.a.createElement(l.a, {
            className: n,
            disabled: t,
            color: this._getColorValueInHex(),
            selectOpacity: e,
            opacity: this._getOpacityValue(),
            thickness: this._getThicknessValue(),
            thicknessItems: m,
            onColorChange: this._onColorChange,
            onOpacityChange: this._onOpacityChange,
            onThicknessChange: this._onThicknessChange,
            onPopupClose: this._onPopupClose,
          })
        }
        _getThicknessValue() {
          const { thickness: e } = this.props
          return e ? Object(c.a)(e) : void 0
        }
        _setProperty(e, t, n) {
          const { setValue: s } = this.context
          Object(c.b)(e, e => s(e, t, n))
        }
      }
      f.contextType = i.b
    },
    qzWo: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return m
      })
      var s = n('q1tI'),
        o = n.n(s),
        r = n('TSYQ'),
        a = n.n(r),
        i = n('Iivm'),
        l = n('+6II'),
        c = n('8+VR'),
        u = n('HyYY'),
        p = n('xJ0h')
      function h() {
        document.removeEventListener('scroll', h), document.removeEventListener('touchstart', h), Object(l.a)()
      }
      function d(e) {
        c.mobiletouch &&
          (Object(l.c)(e.currentTarget, { tooltipDelay: 0 }),
          document.addEventListener('scroll', h),
          document.addEventListener('touchstart', h))
      }
      function m(e) {
        const { title: t } = e
        return o.a.createElement(i.a, { icon: p, className: a()('apply-common-tooltip', u.icon), title: t, onClick: d })
      }
    },
    rJEJ: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return l
      })
      n('YFKU')
      var s = n('q1tI'),
        o = n('Eyy1'),
        r = n('PjdP'),
        a = n('Q+1u'),
        i = n('qzWo')
      class l extends s.PureComponent {
        render() {
          const {
            label: e,
            children: t,
            input: n,
            disabled: l,
            onChange: c,
            labelAlign: u,
            grouped: p,
            tooltip: h,
            offset: d,
          } = this.props
          return s.createElement(
            a.a.Row,
            null,
            s.createElement(
              a.a.Cell,
              { placement: 'first', verticalAlign: u, grouped: p, offset: d },
              void 0 !== e ? e : window.t(Object(o.ensureDefined)(n).name, { context: 'input' }),
            ),
            s.createElement(
              a.a.Cell,
              { placement: 'last', grouped: p },
              t ||
                s.createElement(r.a, {
                  input: Object(o.ensureDefined)(n),
                  onChange: c,
                  disabled: l,
                  hasTooltip: Boolean(h),
                }),
              h && s.createElement(i.a, { title: h }),
            ),
          )
        }
      }
    },
    tDS2: function (e, t, n) {
      e.exports = {
        input: 'input-1zfqRRWX',
        resolution: 'resolution-1zfqRRWX',
        symbol: 'symbol-1zfqRRWX',
        checkbox: 'checkbox-1zfqRRWX',
        label: 'label-1zfqRRWX',
        dropdownMenu: 'dropdownMenu-1zfqRRWX',
        sessionStart: 'sessionStart-1zfqRRWX',
        sessionEnd: 'sessionEnd-1zfqRRWX',
        sessionInputContainer: 'sessionInputContainer-1zfqRRWX',
        sessionDash: 'sessionDash-1zfqRRWX',
        inputGroup: 'inputGroup-1zfqRRWX',
        inlineGroup: 'inlineGroup-1zfqRRWX',
        hasTooltip: 'hasTooltip-1zfqRRWX',
      }
    },
    xJ0h: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none"><path stroke="currentColor" d="M8 8.5h1.5V14"/><circle fill="currentColor" cx="9" cy="5" r="1"/><path stroke="currentColor" d="M16.5 9a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0z"/></svg>'
    },
  },
])
