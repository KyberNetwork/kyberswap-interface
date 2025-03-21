;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['study-template-dialog'],
  {
    '+l/S': function (e, t, n) {},
    '/KDZ': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return i
      })
      var s = n('q1tI')
      class i extends s.PureComponent {
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
    '02pg': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return a
      })
      var s = n('q1tI'),
        i = n('TSYQ'),
        o = n('XiJV')
      function a(e) {
        return s.createElement('div', { className: i(o.separator, e.className) })
      }
    },
    '0W35': function (e, t, n) {
      'use strict'
      var s = n('q1tI'),
        i = n('17x9')
      class o extends s.PureComponent {
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
      function a(e) {
        var t
        return (
          ((t = class extends s.PureComponent {
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
              return s.createElement(e, {
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
          }).contextTypes = { switchGroupContext: i.any.isRequired }),
          t
        )
      }
      ;(o.childContextTypes = { switchGroupContext: i.any.isRequired }),
        n.d(t, 'a', function () {
          return o
        }),
        n.d(t, 'b', function () {
          return a
        })
    },
    '2A9e': function (e) {
      e.exports = JSON.parse(
        '{"button":"button-1iktpaT1","content":"content-2PGssb8d","noOutline":"noOutline-d9Yp4qvi","grouped":"grouped-2NxOpIxM","adjust-position":"adjust-position-2zd-ooQC","first-row":"first-row-11wXF7aC","first-col":"first-col-pbJu53tK","no-corner-top-left":"no-corner-top-left-3ZsS65Fk","no-corner-top-right":"no-corner-top-right-3MYQOwk_","no-corner-bottom-right":"no-corner-bottom-right-3II18BAU","no-corner-bottom-left":"no-corner-bottom-left-3KZuX8tv","appearance-default":"appearance-default-dMjF_2Hu","intent-primary":"intent-primary-1-IOYcbg","intent-success":"intent-success-25a4XZXM","intent-default":"intent-default-2ZbSqQDs","intent-warning":"intent-warning-24j5HMi0","intent-danger":"intent-danger-1EETHCla","appearance-stroke":"appearance-stroke-12lxiUSM","appearance-text":"appearance-text-DqKJVT3U","appearance-inverse":"appearance-inverse-r1Y2JQg_","size-s":"size-s-3mait84m","size-m":"size-m-2G7L7Qat","size-l":"size-l-2NEs9_xt","full-width":"full-width-1wU8ljjC","with-icon":"with-icon-yumghDr-","icon":"icon-1grlgNdV"}',
      )
    },
    '6KyJ': function (e, t, n) {
      'use strict'
      var s,
        i = n('q1tI'),
        o = n('TSYQ'),
        a = n('K9GE'),
        r = n('YZ9j')
      n('O7m7')
      !(function (e) {
        ;(e[(e.Initial = 0)] = 'Initial'), (e[(e.Appear = 1)] = 'Appear'), (e[(e.Active = 2)] = 'Active')
      })(s || (s = {}))
      class l extends i.PureComponent {
        constructor(e) {
          super(e), (this._stateChangeTimeout = null), (this.state = { state: s.Initial })
        }
        render() {
          const { className: e, color: t = 'black' } = this.props,
            n = o(r.item, { [r[t]]: Boolean(t) })
          return i.createElement(
            'span',
            { className: o(r.loader, e, this._getStateClass()) },
            i.createElement('span', { className: n }),
            i.createElement('span', { className: n }),
            i.createElement('span', { className: n }),
          )
        }
        componentDidMount() {
          this.setState({ state: s.Appear }),
            (this._stateChangeTimeout = setTimeout(() => {
              this.setState({ state: s.Active })
            }, 2 * a.b))
        }
        componentWillUnmount() {
          this._stateChangeTimeout && (clearTimeout(this._stateChangeTimeout), (this._stateChangeTimeout = null))
        }
        _getStateClass() {
          switch (this.state.state) {
            case s.Initial:
              return r['loader-initial']
            case s.Appear:
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
    '8NUT': function (e, t, n) {
      e.exports = {
        'small-height-breakpoint': 'screen and (max-height: 360px)',
        footer: 'footer-KW8170fm',
        submitButton: 'submitButton-KW8170fm',
        buttons: 'buttons-KW8170fm',
      }
    },
    '8RO/': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return i
      }),
        n.d(t, 'b', function () {
          return o
        })
      var s = n('3ClC')
      function i(e, t) {
        return {
          indicators: e
            .orderedDataSources(!0)
            .filter(e => Object(s.isStudy)(e) && !Object(s.isESDStudy)(e))
            .map(e => ({ id: e.metaInfo().id, description: e.title(!0, void 0, !0) })),
          interval: t,
        }
      }
      function o(e) {
        const t = new Map()
        return (
          e.forEach(e => {
            const [n, s] = t.get(e.id) || [e.description, 0]
            t.set(e.id, [n, s + 1])
          }),
          Array.from(t.values())
            .map(([e, t]) => `${e}${t > 1 ? ' x ' + t : ''}`)
            .join(', ')
        )
      }
    },
    ASyk: function (e, t, n) {
      e.exports = {
        'tablet-normal-breakpoint': 'screen and (max-width: 768px)',
        'small-height-breakpoint': 'screen and (max-height: 360px)',
        'tablet-small-breakpoint': 'screen and (max-width: 428px)',
      }
    },
    E9Pn: function (e, t, n) {},
    F0Qt: function (e) {
      e.exports = JSON.parse(
        '{"wrapper":"wrapper-21v50zE8","input":"input-24iGIobO","box":"box-3574HVnv","icon":"icon-2jsUbtec","noOutline":"noOutline-3VoWuntz","intent-danger":"intent-danger-1Sr9dowC","check":"check-382c8Fu1","dot":"dot-3gRd-7Qt"}',
      )
    },
    FaeL: function (e, t, n) {
      e.exports = {
        autocomplete: 'autocomplete-2wlTLOUu',
        caret: 'caret-2wlTLOUu',
        icon: 'icon-2wlTLOUu',
        suggestions: 'suggestions-2wlTLOUu',
        suggestion: 'suggestion-2wlTLOUu',
        noResults: 'noResults-2wlTLOUu',
        selected: 'selected-2wlTLOUu',
        opened: 'opened-2wlTLOUu',
      }
    },
    IDfV: function (e, t, n) {
      'use strict'
      n.r(t)
      var s,
        i = n('Eyy1'),
        o = n('YFKU'),
        a = n('q1tI'),
        r = n.n(a),
        l = n('i8i4'),
        c = (n('HbRj'), n('TSYQ')),
        u = n('fV0y'),
        h = n('ML8+'),
        d = n('xADF'),
        p = n('wHCJ'),
        m = n('RgaO')
      !(function (e) {
        ;(e[(e.Enter = 13)] = 'Enter'),
          (e[(e.Space = 32)] = 'Space'),
          (e[(e.Backspace = 8)] = 'Backspace'),
          (e[(e.DownArrow = 40)] = 'DownArrow'),
          (e[(e.UpArrow = 38)] = 'UpArrow'),
          (e[(e.RightArrow = 39)] = 'RightArrow'),
          (e[(e.LeftArrow = 37)] = 'LeftArrow'),
          (e[(e.Escape = 27)] = 'Escape'),
          (e[(e.Tab = 9)] = 'Tab')
      })(s || (s = {}))
      var f = n('FaeL')
      function b(e, t) {
        return '' === e || -1 !== t.toLowerCase().indexOf(e.toLowerCase())
      }
      class g extends a.PureComponent {
        constructor(e) {
          if (
            (super(e),
            (this._setInputRef = e => {
              e &&
                ((this._inputElement = e),
                this.props.setupHTMLInput && this.props.setupHTMLInput(e),
                this._inputElement.addEventListener('keyup', this._handleKeyUpEnter))
            }),
            (this._handleCaretClick = () => {
              this.state.isOpened
                ? this.props.preventOnFocusOpen && this._focus()
                : this.props.preventOnFocusOpen
                ? this._open()
                : this._focus()
            }),
            (this._handleOutsideClick = () => {
              const { allowUserDefinedValues: e, value: t, onChange: n } = this.props,
                { queryValue: s } = this.state
              e ? n && s !== t && n(s) : this.setState(this._valueToQuery(t)), this._close()
            }),
            (this._handleFocus = e => {
              this.props.preventOnFocusOpen || this._open(), this.props.onFocus && this.props.onFocus(e)
            }),
            (this._handleChange = e => {
              const {
                  preventSearchOnEmptyQuery: t,
                  allowUserDefinedValues: n,
                  onChange: s,
                  onSuggestionsOpen: i,
                  onSuggestionsClose: o,
                } = this.props,
                a = e.currentTarget.value
              if (t && '' === a) this.setState({ queryValue: a, isOpened: !1, active: void 0 }), o && o()
              else {
                const e = this._suggestions(a),
                  t = Object.keys(e).length > 0
                this.setState({ queryValue: a, isOpened: t, active: n ? void 0 : this._getActiveKeyByValue(a) }),
                  t && i && i()
              }
              n && s && s(a)
            }),
            (this._handleItemClick = e => {
              const t = e.currentTarget.id
              this.setState({ queryValue: this._source()[t] }),
                this.props.onChange && this.props.onChange(t),
                this._close()
            }),
            (this._handleKeyDown = e => {
              if (-1 === [s.DownArrow, s.UpArrow, s.Enter, s.Escape].indexOf(e.which)) return
              const { allowUserDefinedValues: t, value: n, onChange: i, onSuggestionsOpen: o } = this.props,
                { active: a, isOpened: r, queryValue: l } = this.state
              r && (e.preventDefault(), e.stopPropagation())
              const c = this._suggestions(l)
              switch (e.which) {
                case s.DownArrow:
                case s.UpArrow:
                  const u = Object.keys(c)
                  if (!r && u.length && e.which === s.DownArrow) {
                    this.setState({ isOpened: !0, active: u[0] }), o && o()
                    break
                  }
                  let h
                  if (void 0 === a) {
                    if (e.which === s.UpArrow) {
                      this._close()
                      break
                    }
                    h = 0
                  } else h = u.indexOf(a) + (e.which === s.UpArrow ? -1 : 1)
                  h < 0 && (h = 0), h > u.length - 1 && (h = u.length - 1)
                  const d = u[h]
                  this.setState({ active: d })
                  const p = document.getElementById(d)
                  p && this._scrollIfNotVisible(p, this._suggestionsElement)
                  break
                case s.Escape:
                  this._close(), r || this._blur()
                  break
                case s.Enter:
                  let m = a
                  t && (r && m ? this.setState(this._valueToQuery(m)) : (m = l)),
                    void 0 !== m &&
                      (this._close(), r || this._blur(), m !== n ? i && i(m) : this.setState(this._valueToQuery(m)))
              }
            }),
            (this._setSuggestionsRef = e => {
              e && (this._suggestionsElement = e)
            }),
            (this._scrollIfNotVisible = (e, t) => {
              const n = t.scrollTop,
                s = t.scrollTop + t.clientHeight,
                i = e.offsetTop,
                o = i + e.clientHeight
              i <= n ? e.scrollIntoView(!0) : o >= s && e.scrollIntoView(!1)
            }),
            !(e => Array.isArray(e.source) || !e.allowUserDefinedValues)(e))
          )
            throw new Error('allowUserDefinedProps === true cay only be used if source is array')
          this.state = { isOpened: !1, active: e.value, ...this._valueToQuery(e.value) }
        }
        UNSAFE_componentWillReceiveProps(e) {
          const { allowUserDefinedValues: t, value: n } = e
          if (n === this.props.value && this.state.isOpened) return
          const s = t ? n : '' === n ? '' : this._source()[n] || this.state.queryValue
          this.setState({ queryValue: s, active: n })
        }
        componentWillUnmount() {
          this._inputElement && this._inputElement.removeEventListener('keyup', this._handleKeyUpEnter)
        }
        render() {
          return a.createElement(m.a, { handler: this._handleOutsideClick, click: !0 }, e =>
            a.createElement(
              'div',
              { className: c(f.autocomplete, { [f.opened]: this.state.isOpened }, 'js-dialog-skip-escape'), ref: e },
              a.createElement(p.a, {
                name: this.props.name,
                endSlot: Object.keys(this._suggestions(this.state.queryValue)).length
                  ? a.createElement(
                      d.b,
                      null,
                      a.createElement(
                        'span',
                        { className: f.caret, onClick: this._handleCaretClick },
                        a.createElement(h.a, { className: f.icon, dropped: this.state.isOpened }),
                      ),
                    )
                  : void 0,
                maxLength: this.props.maxLength,
                reference: this._setInputRef,
                stretch: !0,
                placeholder: this.props.placeholder,
                value: this.state.queryValue,
                intent: this.props.error ? 'danger' : void 0,
                onChange: this._handleChange,
                onFocus: this._handleFocus,
                onBlur: this.props.onBlur,
                onMouseOver: this.props.onMouseOver,
                onMouseOut: this.props.onMouseOut,
                onKeyDown: this._handleKeyDown,
                autoComplete: 'off',
              }),
              this._renderSuggestions(),
            ),
          )
        }
        _focus() {
          this._inputElement.focus()
        }
        _blur() {
          this._inputElement.blur()
        }
        _open() {
          const { onSuggestionsOpen: e } = this.props
          this._focus(), this.setState({ isOpened: !0 }), e && e()
        }
        _close() {
          const { onSuggestionsClose: e } = this.props
          this.setState({ isOpened: !1, active: void 0 }), e && e()
        }
        _source() {
          let e = {}
          return (
            Array.isArray(this.props.source)
              ? this.props.source.forEach(t => {
                  e[t] = t
                })
              : (e = this.props.source),
            e
          )
        }
        _suggestions(e) {
          const { filter: t = b } = this.props,
            n = this._source(),
            s = {}
          return (
            Object.keys(n)
              .filter(s => t(e, n[s]))
              .forEach(e => (s[e] = n[e])),
            s
          )
        }
        _renderSuggestions() {
          const e = this._suggestions(this.state.queryValue),
            t = Object.keys(e).map(t => {
              const n = c(f.suggestion, { [f.selected]: this.state.active === t })
              return a.createElement('li', { id: t, key: t, className: n, onClick: this._handleItemClick }, e[t])
            }),
            n = a.createElement('li', { className: f.noResults }, window.t('No results found'))
          return !t.length && this.props.noEmptyText
            ? null
            : a.createElement('ul', { className: f.suggestions, ref: this._setSuggestionsRef }, t.length ? t : n)
        }
        _handleKeyUpEnter(e) {
          e.which === s.Enter && e.stopImmediatePropagation()
        }
        _getActiveKeyByValue(e) {
          const { filter: t = b } = this.props,
            n = this._suggestions(e),
            s = Object.keys(n)
          for (const i of s) if (t(e, n[i])) return i
          return s[0]
        }
        _valueToQuery(e) {
          return { queryValue: this._source()[e] || '' }
        }
      }
      var v = n('Iivm'),
        _ = n('ycFu'),
        w = n('+EG+'),
        C = n('6KyJ'),
        S = n('tz2P')
      function y(e) {
        const { isLoading: t } = e
        return r.a.createElement(
          'span',
          { className: t ? S.loading : void 0 },
          window.t('Save'),
          t && r.a.createElement(C.a, { color: 'white' }),
        )
      }
      class O extends a.PureComponent {
        constructor(e) {
          super(e),
            (this._dialogRef = a.createRef()),
            (this._manager = null),
            (this._handleSubmit = () => {
              this.setState({ isLoading: !0 }), this.props.onSubmit(this)
            }),
            (this.state = { isLoading: !1 })
        }
        render() {
          const { isOpened: e, saveDisabled: t, title: n, onClose: s } = this.props
          return a.createElement(_.a, {
            ref: this._dialogRef,
            onClose: s,
            onSubmit: this._handleSubmit,
            onCancel: s,
            onClickOutside: s,
            isOpened: e,
            title: n,
            dataName: 'save-rename-dialog',
            render: this._renderDialogBody(),
            defaultActionOnClose: 'none',
            submitButtonText: a.createElement(y, { isLoading: this.state.isLoading }),
            submitButtonDisabled: t,
          })
        }
        focus() {
          Object(i.ensureNotNull)(this._dialogRef.current).focus()
        }
        manager() {
          return this._manager
        }
        submit() {
          this.props.onSubmit(this)
        }
        close() {
          this.props.onClose()
        }
        dropLoading() {
          this.setState({ isLoading: !1 })
        }
        _renderDialogBody() {
          return () => a.createElement(w.b.Consumer, null, e => ((this._manager = e), this.props.children))
        }
      }
      var E = n('xJ0h'),
        x = n('j+m7')
      const N = window.t('Template name'),
        T = window.t('Saved indicators'),
        k = window.t('Remember Symbol'),
        A = window.t('Remember Interval')
      function L(e) {
        const {
            title: t,
            saveSymbolHintText: n,
            saveIntervalHintText: s,
            indicatorsText: o,
            source: l,
            onClose: h,
            onSubmit: d,
          } = e,
          [p, m] = Object(a.useState)(''),
          [f, b] = Object(a.useState)(!1),
          [_, w] = Object(a.useState)(!1),
          [C, S] = Object(a.useState)(!1),
          y = Object(a.useRef)(null),
          L = Object(a.useRef)(null)
        return (
          Object(a.useEffect)(() => {
            Object(i.ensureNotNull)(L.current).focus()
          }, []),
          r.a.createElement(
            O,
            {
              ref: y,
              isOpened: !0,
              saveDisabled: !p,
              title: t,
              onClose: h,
              onSubmit: function (e) {
                d({ title: p, saveSymbol: f, saveInterval: _ }, e)
              },
            },
            r.a.createElement(
              'div',
              { className: c(x.container, C && x.withSuggestions) },
              r.a.createElement('div', { className: x.title }, N),
              r.a.createElement(
                'div',
                { className: x.autocomplete },
                r.a.createElement(g, {
                  maxLength: 64,
                  value: p,
                  onChange: m,
                  onBlur: function () {
                    Object(i.ensureNotNull)(y.current).focus()
                  },
                  source: l,
                  allowUserDefinedValues: !0,
                  preventOnFocusOpen: !0,
                  noEmptyText: !0,
                  preventSearchOnEmptyQuery: !0,
                  filter: function (e, t) {
                    return Boolean('' === e || (e && -1 !== t.toLowerCase().indexOf(e.toLowerCase())))
                  },
                  setupHTMLInput: function (e) {
                    L.current = e
                  },
                  onSuggestionsOpen: function () {
                    S(!0)
                  },
                  onSuggestionsClose: function () {
                    S(!1)
                  },
                }),
              ),
              r.a.createElement(
                'div',
                { className: x.saveSymbol },
                r.a.createElement(u.a, {
                  label: r.a.createElement(
                    'span',
                    { className: x.hintLabel },
                    k,
                    r.a.createElement(v.a, { icon: E, className: c(x.hintMark, 'apply-common-tooltip'), title: n }),
                  ),
                  onChange: function () {
                    b(!f), Object(i.ensureNotNull)(y.current).focus()
                  },
                  checked: f,
                }),
              ),
              r.a.createElement(
                'div',
                { className: x.saveInterval },
                r.a.createElement(u.a, {
                  label: r.a.createElement(
                    'span',
                    { className: x.hintLabel },
                    A,
                    r.a.createElement(v.a, { icon: E, className: c(x.hintMark, 'apply-common-tooltip'), title: s }),
                  ),
                  onChange: function () {
                    w(!_), Object(i.ensureNotNull)(y.current).focus()
                  },
                  checked: _,
                }),
              ),
              r.a.createElement('div', { className: x.title }, T),
              r.a.createElement('div', { className: c(x.indicators, C && x.withSuggestions) }, o),
            ),
          )
        )
      }
      var D = n('FQhm'),
        I = n('ZjKI')
      class j {
        constructor(e) {
          ;(this._container = document.createElement('div')),
            (this.close = () => {
              this.unmount(), this._onClose && this._onClose()
            }),
            (this.unmount = () => {
              D.unsubscribe(I.CLOSE_POPUPS_AND_DIALOGS_COMMAND, this.unmount, null),
                l.unmountComponentAtNode(this._container)
            }),
            (this._title = e.title),
            (this._saveSymbolHintText = e.saveSymbolHintText),
            (this._saveIntervalHintText = e.saveIntervalHintText),
            (this._indicatorsText = e.indicatorsText),
            (this._source = e.source),
            (this._onSubmit = e.onSubmit),
            (this._onClose = e.onClose),
            D.subscribe(I.CLOSE_POPUPS_AND_DIALOGS_COMMAND, this.unmount, null)
        }
        mount() {
          l.render(
            r.a.createElement(L, {
              title: this._title,
              saveSymbolHintText: this._saveSymbolHintText,
              saveIntervalHintText: this._saveIntervalHintText,
              indicatorsText: this._indicatorsText,
              source: this._source,
              onClose: this.close,
              onSubmit: this._onSubmit,
            }),
            this._container,
          )
        }
        destroy() {
          this.unmount()
        }
        show() {
          this.mount()
        }
      }
      var F = n('zUrt'),
        U = n('fZEr'),
        P = n('xDuj'),
        V = n('8RO/')
      n.d(t, 'StudyTemplateSaver', function () {
        return H
      })
      const q = Object(o.t)('Save Indicator Template'),
        M = Object(o.t)(
          'Selecting this option will set the {symbol} symbol on the chart when this template is applied',
        ),
        B = Object(o.t)(
          'Selecting this option will set the {interval} interval on the chart when this template is applied',
        ),
        R = Object(o.t)("Study Template '{templateName}' already exists. Do you really want to replace it?")
      function K(e, t, n) {
        const s = () => {
          F.backend.invalidateStudyTemplatesList(), F.backend.getStudyTemplatesList().then(t)
        }
        F.backend.saveStudyTemplate(e).then(s)
      }
      class H {
        constructor(e) {
          ;(this._dialog = null),
            (this._onSave = e => {
              this._options.onSave(e), this._close()
            }),
            (this._showSaveDialog = async () => {
              const e = this._controller.model().mainSeries().symbol(),
                t = this._controller.model().mainSeries().interval(),
                n = await this._getActualTemplateList()
              await this._showTemplateSaveRenameDialog(n, e, t)
            }),
            (this._close = () => {
              this._dialog && (this._dialog.destroy(), (this._dialog = null))
            }),
            (this._options = e),
            (this._controller = e.controller)
        }
        show() {
          window.runOrSignIn(this._showSaveDialog, { source: 'Study templates save as', sourceMeta: 'Chart' })
        }
        _prepareData(e, t, n) {
          const s = this._controller.model().studyTemplate(t, n)
          return { name: e, content: JSON.stringify(s), meta_info: Object(V.a)(this._controller, s.interval) }
        }
        _doSave(e, t, n) {
          const { title: s, saveSymbol: i, saveInterval: o } = t
          if (!s) return
          const a = n.manager() || void 0,
            r = this._prepareData(s, i, o)
          if (e.find(e => e.name === s)) {
            const e = e => {
              e ? K(r, this._onSave) : (n.focus(), n.dropLoading())
            }
            ;(function (e, t) {
              return new Promise(n =>
                Object(U.showConfirm)(
                  {
                    text: R.format({ templateName: e }),
                    onConfirm: ({ dialogClose: e }) => {
                      n(!0), e()
                    },
                    onClose: () => n(!1),
                  },
                  t,
                ),
              )
            })(s, a).then(e)
          } else {
            K(r, this._onSave)
          }
        }
        _getActualTemplateList() {
          return F.backend.invalidateStudyTemplatesList(), F.backend.getStudyTemplatesList()
        }
        _showTemplateSaveRenameDialog(e, t, n) {
          const s = Object(V.a)(this._controller)
          ;(this._dialog = new j({
            source: e.map(e => e.name),
            title: q,
            saveSymbolHintText: M.format({ symbol: t }),
            saveIntervalHintText: B.format({ interval: Object(P.translatedIntervalString)(n) }),
            indicatorsText: Object(V.b)(s.indicators),
            onSubmit: (t, n) => this._doSave(e, t, n),
            onClose: this._close,
          })).show()
        }
      }
    },
    ItnF: function (e, t, n) {
      e.exports = { dialog: 'dialog-2cMrvu9r', wrapper: 'wrapper-2cMrvu9r', separator: 'separator-2cMrvu9r' }
    },
    'ML8+': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return l
      })
      var s = n('q1tI'),
        i = n('TSYQ'),
        o = n('Iivm'),
        a = n('cvzQ'),
        r = n('R4+T')
      function l(e) {
        const { dropped: t, className: n } = e
        return s.createElement(o.a, { className: i(n, a.icon, { [a.dropped]: t }), icon: r })
      }
    },
    O7m7: function (e, t, n) {},
    'P4l+': function (e, t, n) {},
    'R4+T': function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 8" width="16" height="8"><path fill="currentColor" d="M0 1.475l7.396 6.04.596.485.593-.49L16 1.39 14.807 0 7.393 6.122 8.58 6.12 1.186.08z"/></svg>'
    },
    R5JZ: function (e, t, n) {
      'use strict'
      function s(e, t, n, s, i) {
        function o(i) {
          if (e > i.timeStamp) return
          const o = i.target
          void 0 !== n && null !== t && null !== o && o.ownerDocument === s && (t.contains(o) || n(i))
        }
        return (
          i.click && s.addEventListener('click', o, !1),
          i.mouseDown && s.addEventListener('mousedown', o, !1),
          i.touchEnd && s.addEventListener('touchend', o, !1),
          i.touchStart && s.addEventListener('touchstart', o, !1),
          () => {
            s.removeEventListener('click', o, !1),
              s.removeEventListener('mousedown', o, !1),
              s.removeEventListener('touchend', o, !1),
              s.removeEventListener('touchstart', o, !1)
          }
        )
      }
      n.d(t, 'a', function () {
        return s
      })
    },
    XiJV: function (e, t, n) {
      e.exports = { separator: 'separator-3No0pWrk' }
    },
    YZ9j: function (e) {
      e.exports = JSON.parse(
        '{"loader":"loader-8x1ZxRwP","item":"item-2-89r_cd","tv-button-loader":"tv-button-loader-23vqS1uY","black":"black-20Ytsf0V","white":"white-1ucCcc2I","gray":"gray-XDhHSS-T","loader-initial":"loader-initial-1deQDeio","loader-appear":"loader-appear-2krFtMrd"}',
      )
    },
    cvzQ: function (e, t, n) {
      e.exports = { icon: 'icon-19OjtB6A', dropped: 'dropped-19OjtB6A' }
    },
    fV0y: function (e, t, n) {
      'use strict'
      var s = n('q1tI'),
        i = n('TSYQ'),
        o = n('0W35'),
        a = n('vCF3'),
        r = n('qibD')
      n('E9Pn')
      class l extends s.PureComponent {
        render() {
          const { inputClassName: e, labelClassName: t, ...n } = this.props,
            o = i(this.props.className, r.checkbox, {
              [r.reverse]: Boolean(this.props.labelPositionReverse),
              [r.baseline]: Boolean(this.props.labelAlignBaseline),
            }),
            l = i(r.label, t, { [r.disabled]: this.props.disabled })
          let c = null
          return (
            this.props.label &&
              (c = s.createElement('span', { className: l, title: this.props.title }, this.props.label)),
            s.createElement('label', { className: o }, s.createElement(a.a, { ...n, className: e }), c)
          )
        }
      }
      l.defaultProps = { value: 'on' }
      Object(o.b)(l)
      n.d(t, 'a', function () {
        return l
      })
    },
    g89m: function (e, t, n) {
      'use strict'
      var s = n('q1tI'),
        i = n.n(s),
        o = n('Eyy1'),
        a = n('TSYQ'),
        r = n.n(a),
        l = n('/3z9'),
        c = n('d700'),
        u = n('WXjp'),
        h = n('02pg'),
        d = n('uhCe'),
        p = n('/KDZ'),
        m = n('pafz'),
        f = n('ZjKI'),
        b = n('FQhm'),
        g = n('Iivm')
      const v = i.a.createContext({ setHideClose: () => {} })
      var _ = n('zztK'),
        w = n('px1m')
      function C(e) {
        const {
            title: t,
            subtitle: n,
            showCloseIcon: o = !0,
            onClose: a,
            renderBefore: l,
            renderAfter: c,
            draggable: u,
            className: h,
            unsetAlign: d,
          } = e,
          [p, m] = Object(s.useState)(!1)
        return i.a.createElement(
          v.Provider,
          { value: { setHideClose: m } },
          i.a.createElement(
            'div',
            { className: r()(w.container, h, (n || d) && w.unsetAlign) },
            l,
            i.a.createElement(
              'div',
              { 'data-dragg-area': u, className: w.title },
              i.a.createElement('div', { className: w.ellipsis }, t),
              n && i.a.createElement('div', { className: r()(w.ellipsis, w.subtitle) }, n),
            ),
            c,
            o &&
              !p &&
              i.a.createElement(g.a, {
                className: w.close,
                icon: _,
                onClick: a,
                'data-name': 'close',
                'data-role': 'button',
              }),
          ),
        )
      }
      var S = n('ItnF')
      n.d(t, 'a', function () {
        return E
      })
      const y = { vertical: 20 },
        O = { vertical: 0 }
      class E extends i.a.PureComponent {
        constructor() {
          super(...arguments),
            (this._controller = null),
            (this._reference = null),
            (this._renderChildren = (e, t) => (
              (this._controller = e),
              this.props.render({
                requestResize: this._requestResize,
                centerAndFit: this._centerAndFit,
                isSmallWidth: t,
              })
            )),
            (this._handleReference = e => (this._reference = e)),
            (this._handleClose = () => {
              this.props.onClose()
            }),
            (this._handleKeyDown = e => {
              var t
              if (!e.defaultPrevented)
                switch ((this.props.onKeyDown && this.props.onKeyDown(e), Object(l.hashFromEvent)(e))) {
                  case 27:
                    if (e.defaultPrevented) return
                    if (this.props.forceCloseOnEsc && this.props.forceCloseOnEsc()) return void this._handleClose()
                    const { activeElement: n } = document,
                      s = Object(o.ensureNotNull)(this._reference)
                    if (null !== n) {
                      if (
                        (e.preventDefault(),
                        'true' === (t = n).getAttribute('data-haspopup') && 'true' !== t.getAttribute('data-expanded'))
                      )
                        return void this._handleClose()
                      if (Object(c.b)(n)) return void s.focus()
                      if (s.contains(n)) return void this._handleClose()
                    }
                }
            }),
            (this._requestResize = () => {
              null !== this._controller && this._controller.recalculateBounds()
            }),
            (this._centerAndFit = () => {
              null !== this._controller && this._controller.centerAndFit()
            })
        }
        componentDidMount() {
          b.subscribe(f.CLOSE_POPUPS_AND_DIALOGS_COMMAND, this._handleClose, null)
        }
        componentWillUnmount() {
          b.unsubscribe(f.CLOSE_POPUPS_AND_DIALOGS_COMMAND, this._handleClose, null)
        }
        focus() {
          Object(o.ensureNotNull)(this._reference).focus()
        }
        getElement() {
          return this._reference
        }
        contains(e) {
          var t, n
          return (
            null !== (n = null === (t = this._reference) || void 0 === t ? void 0 : t.contains(e)) && void 0 !== n && n
          )
        }
        render() {
          const {
              className: e,
              headerClassName: t,
              isOpened: n,
              title: s,
              dataName: o,
              onClickOutside: a,
              additionalElementPos: l,
              additionalHeaderElement: c,
              backdrop: f,
              shouldForceFocus: b = !0,
              showSeparator: g,
              subtitle: v,
              draggable: _ = !0,
              fullScreen: w = !1,
              showCloseIcon: E = !0,
              rounded: x = !0,
              isAnimationEnabled: N,
              growPoint: T,
              dialogTooltip: k,
              unsetHeaderAlign: A,
            } = this.props,
            L = 'after' !== l ? c : void 0,
            D = 'after' === l ? c : void 0
          return i.a.createElement(p.a, { rule: d.a.SmallHeight }, l =>
            i.a.createElement(p.a, { rule: d.a.TabletSmall }, c =>
              i.a.createElement(
                u.a,
                {
                  rounded: !(c || w) && x,
                  className: r()(S.dialog, e),
                  isOpened: n,
                  reference: this._handleReference,
                  onKeyDown: this._handleKeyDown,
                  onClickOutside: a,
                  onClickBackdrop: a,
                  fullscreen: c || w,
                  guard: l ? O : y,
                  boundByScreen: c || w,
                  shouldForceFocus: b,
                  backdrop: f,
                  draggable: _,
                  isAnimationEnabled: N,
                  growPoint: T,
                  name: this.props.dataName,
                  dialogTooltip: k,
                },
                i.a.createElement(
                  'div',
                  { className: S.wrapper, 'data-name': o, 'data-dialog-name': 'string' == typeof s ? s : '' },
                  void 0 !== s &&
                    i.a.createElement(C, {
                      draggable: _ && !(c || w),
                      onClose: this._handleClose,
                      renderAfter: D,
                      renderBefore: L,
                      subtitle: v,
                      title: s,
                      showCloseIcon: E,
                      className: t,
                      unsetAlign: A,
                    }),
                  g && i.a.createElement(h.a, { className: S.separator }),
                  i.a.createElement(m.a.Consumer, null, e => this._renderChildren(e, c || w)),
                ),
              ),
            ),
          )
        }
      }
    },
    ijHL: function (e, t, n) {
      'use strict'
      function s(e) {
        return o(e, a)
      }
      function i(e) {
        return o(e, r)
      }
      function o(e, t) {
        const n = Object.entries(e).filter(t),
          s = {}
        for (const [e, t] of n) s[e] = t
        return s
      }
      function a(e) {
        const [t, n] = e
        return 0 === t.indexOf('data-') && 'string' == typeof n
      }
      function r(e) {
        return 0 === e[0].indexOf('aria-')
      }
      n.d(t, 'b', function () {
        return s
      }),
        n.d(t, 'a', function () {
          return i
        }),
        n.d(t, 'c', function () {
          return o
        }),
        n.d(t, 'e', function () {
          return a
        }),
        n.d(t, 'd', function () {
          return r
        })
    },
    'j+m7': function (e, t, n) {
      e.exports = {
        container: 'container-1FV_LSwA',
        withSuggestions: 'withSuggestions-1FV_LSwA',
        title: 'title-1FV_LSwA',
        autocomplete: 'autocomplete-1FV_LSwA',
        saveSymbol: 'saveSymbol-1FV_LSwA',
        saveInterval: 'saveInterval-1FV_LSwA',
        indicators: 'indicators-1FV_LSwA',
        hintLabel: 'hintLabel-1FV_LSwA',
        hintMark: 'hintMark-1FV_LSwA',
      }
    },
    mwqF: function (e, t, n) {
      'use strict'
      var s = n('q1tI'),
        i = n.n(s),
        o = n('TSYQ'),
        a = n('wwkJ'),
        r = n('ZWNO')
      function l(e, t) {
        const {
            intent: n = 'primary',
            size: s = 'm',
            appearance: i = 'default',
            useFullWidth: a = !1,
            tabIndex: l = 0,
            icon: c,
            className: u,
            isGrouped: h,
            cellState: d,
            disablePositionAdjustment: p = !1,
          } = t,
          m = (function (e, t) {
            let n = ''
            return (
              0 !== e &&
                (1 & e && (n = o(n, t['no-corner-top-left'])),
                2 & e && (n = o(n, t['no-corner-top-right'])),
                4 & e && (n = o(n, t['no-corner-bottom-right'])),
                8 & e && (n = o(n, t['no-corner-bottom-left']))),
              n
            )
          })(Object(r.a)(d), e)
        return o(
          u,
          e.button,
          e['size-' + s],
          e['intent-' + n],
          e['appearance-' + i],
          a && e['full-width'],
          -1 === l && e.noOutline,
          c && 's' !== s && e['with-icon'],
          m,
          h && e.grouped,
          !p && e['adjust-position'],
          d.isTop && e['first-row'],
          d.isLeft && e['first-col'],
        )
      }
      var c = n('2A9e')
      n('+l/S')
      function u(e) {
        const {
            className: t,
            intent: n,
            size: r,
            appearance: u,
            disabled: h,
            useFullWidth: d,
            reference: p,
            icon: m,
            children: f,
            tabIndex: b,
            ...g
          } = e,
          { isGrouped: v, cellState: _, disablePositionAdjustment: w } = Object(s.useContext)(a.a),
          C = l(c, {
            intent: n,
            size: r,
            appearance: u,
            disabled: h,
            useFullWidth: d,
            tabIndex: b,
            icon: m,
            isGrouped: v,
            cellState: _,
            disablePositionAdjustment: w,
          })
        return i.a.createElement(
          'button',
          { className: o(C, t), disabled: h, ref: p, tabIndex: b, ...g },
          m && 's' !== r && i.a.createElement('span', { className: c.icon }, m),
          i.a.createElement('span', { className: c.content }, f),
        )
      }
      n.d(t, 'a', function () {
        return u
      })
    },
    px1m: function (e, t, n) {
      e.exports = {
        'small-height-breakpoint': 'screen and (max-height: 360px)',
        container: 'container-2sL5JydP',
        unsetAlign: 'unsetAlign-2sL5JydP',
        title: 'title-2sL5JydP',
        subtitle: 'subtitle-2sL5JydP',
        ellipsis: 'ellipsis-2sL5JydP',
        close: 'close-2sL5JydP',
      }
    },
    qibD: function (e) {
      e.exports = JSON.parse(
        '{"checkbox":"checkbox-3xZUD-2M","reverse":"reverse-3xeTx96y","label":"label-cyItEVpF","baseline":"baseline-6TXKro4X"}',
      )
    },
    tUxN: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 9" width="11" height="9" fill="none"><path stroke-width="2" d="M0.999878 4L3.99988 7L9.99988 1"/></svg>'
    },
    tz2P: function (e, t, n) {
      e.exports = { loading: 'loading-20Nb4yny' }
    },
    uhCe: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return i
      })
      var s = n('ASyk')
      const i = {
        SmallHeight: s['small-height-breakpoint'],
        TabletSmall: s['tablet-small-breakpoint'],
        TabletNormal: s['tablet-normal-breakpoint'],
      }
    },
    vCF3: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return l
      })
      var s = n('q1tI'),
        i = n('TSYQ'),
        o = n('Iivm'),
        a = n('tUxN'),
        r = n('F0Qt')
      n('P4l+')
      function l(e) {
        const t = i(r.box, r['intent-' + e.intent], {
            [r.check]: !Boolean(e.indeterminate),
            [r.dot]: Boolean(e.indeterminate),
            [r.noOutline]: -1 === e.tabIndex,
          }),
          n = i(r.wrapper, e.className)
        return s.createElement(
          'span',
          { className: n, title: e.title },
          s.createElement('input', {
            id: e.id,
            tabIndex: e.tabIndex,
            className: r.input,
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
          s.createElement('span', { className: t }, s.createElement(o.a, { icon: a, className: r.icon })),
        )
      }
    },
    xJ0h: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none"><path stroke="currentColor" d="M8 8.5h1.5V14"/><circle fill="currentColor" cx="9" cy="5" r="1"/><path stroke="currentColor" d="M16.5 9a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0z"/></svg>'
    },
    ycFu: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return d
      })
      var s = n('q1tI'),
        i = n.n(s),
        o = n('TSYQ'),
        a = n.n(o),
        r = n('mwqF'),
        l = n('Eyy1'),
        c = (n('YFKU'), n('/3z9')),
        u = n('g89m'),
        h = n('8NUT')
      class d extends i.a.PureComponent {
        constructor() {
          super(...arguments),
            (this._dialogRef = i.a.createRef()),
            (this._handleClose = () => {
              const { defaultActionOnClose: e, onSubmit: t, onCancel: n, onClose: s } = this.props
              switch (e) {
                case 'submit':
                  t()
                  break
                case 'cancel':
                  n()
              }
              s()
            }),
            (this._handleCancel = () => {
              this.props.onCancel(), this.props.onClose()
            }),
            (this._handleKeyDown = e => {
              const { onSubmit: t, submitButtonDisabled: n, submitOnEnterKey: s } = this.props
              switch (Object(c.hashFromEvent)(e)) {
                case 13:
                  !n && s && (e.preventDefault(), t())
              }
            })
        }
        render() {
          const {
            render: e,
            onClose: t,
            onSubmit: n,
            onCancel: s,
            footerLeftRenderer: o,
            submitButtonText: a,
            submitButtonDisabled: r,
            defaultActionOnClose: l,
            submitOnEnterKey: c,
            ...h
          } = this.props
          return i.a.createElement(u.a, {
            ...h,
            ref: this._dialogRef,
            onKeyDown: this._handleKeyDown,
            render: this._renderChildren(),
            onClose: this._handleClose,
          })
        }
        focus() {
          Object(l.ensureNotNull)(this._dialogRef.current).focus()
        }
        _renderChildren() {
          return e => {
            const {
              render: t,
              footerLeftRenderer: n,
              additionalButtons: s,
              submitButtonText: o,
              submitButtonDisabled: l,
              onSubmit: c,
              cancelButtonText: u,
              showCancelButton: d = !0,
              submitButtonClassName: p,
              cancelButtonClassName: m,
              buttonsWrapperClassName: f,
            } = this.props
            return i.a.createElement(
              i.a.Fragment,
              null,
              t(e),
              i.a.createElement(
                'div',
                { className: h.footer },
                n && n(e.isSmallWidth),
                i.a.createElement(
                  'div',
                  { className: a()(h.buttons, f) },
                  s,
                  d &&
                    i.a.createElement(
                      r.a,
                      { className: m, name: 'cancel', appearance: 'stroke', onClick: this._handleCancel },
                      null != u ? u : window.t('Cancel'),
                    ),
                  i.a.createElement(
                    'span',
                    { className: h.submitButton },
                    i.a.createElement(
                      r.a,
                      { className: p, disabled: l, name: 'submit', onClick: c, 'data-name': 'submit-button' },
                      null != o ? o : window.t('Ok'),
                    ),
                  ),
                ),
              ),
            )
          }
        }
      }
      d.defaultProps = { defaultActionOnClose: 'submit', submitOnEnterKey: !0 }
    },
    zztK: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" width="17" height="17" fill="none"><path stroke="currentColor" stroke-width="1.2" d="M1 1l15 15m0-15L1 16"/></svg>'
    },
  },
])
