;(window.webpackJsonp = window.webpackJsonp || []).push([
  [54],
  {
    '20PO': function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18" fill="none"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M9.7 9l4.65-4.65-.7-.7L9 8.29 4.35 3.65l-.7.7L8.29 9l-4.64 4.65.7.7L9 9.71l4.65 4.64.7-.7L9.71 9z"/></svg>'
    },
    '38fQ': function (e, t, n) {
      e.exports = { separator: 'separator-LcIsiH9i' }
    },
    '39J6': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return l
      })
      var s = n('q1tI'),
        a = n('TSYQ'),
        o = n.n(a),
        r = n('6KyJ'),
        i = n('Oy6E')
      function l(e) {
        const { className: t } = e
        return s.createElement('div', { className: o()(i.spinnerWrap, t) }, s.createElement(r.a, null))
      }
    },
    '6KyJ': function (e, t, n) {
      'use strict'
      var s,
        a = n('q1tI'),
        o = n('TSYQ'),
        r = n('K9GE'),
        i = n('YZ9j')
      n('O7m7')
      !(function (e) {
        ;(e[(e.Initial = 0)] = 'Initial'), (e[(e.Appear = 1)] = 'Appear'), (e[(e.Active = 2)] = 'Active')
      })(s || (s = {}))
      class l extends a.PureComponent {
        constructor(e) {
          super(e), (this._stateChangeTimeout = null), (this.state = { state: s.Initial })
        }
        render() {
          const { className: e, color: t = 'black' } = this.props,
            n = o(i.item, { [i[t]]: Boolean(t) })
          return a.createElement(
            'span',
            { className: o(i.loader, e, this._getStateClass()) },
            a.createElement('span', { className: n }),
            a.createElement('span', { className: n }),
            a.createElement('span', { className: n }),
          )
        }
        componentDidMount() {
          this.setState({ state: s.Appear }),
            (this._stateChangeTimeout = setTimeout(() => {
              this.setState({ state: s.Active })
            }, 2 * r.b))
        }
        componentWillUnmount() {
          this._stateChangeTimeout && (clearTimeout(this._stateChangeTimeout), (this._stateChangeTimeout = null))
        }
        _getStateClass() {
          switch (this.state.state) {
            case s.Initial:
              return i['loader-initial']
            case s.Appear:
              return i['loader-appear']
            default:
              return ''
          }
        }
      }
      n.d(t, 'a', function () {
        return l
      })
    },
    A7ND: function (e, t, n) {
      e.exports = { loaderWrapper: 'loaderWrapper-2mhYnUll' }
    },
    Gpmm: function (e, t, n) {
      e.exports = { row: 'row-3B5H2q5m', line: 'line-3B5H2q5m', hint: 'hint-3B5H2q5m' }
    },
    IAAr: function (e, t, n) {
      'use strict'
      var s = n('q1tI'),
        a = n.n(s),
        o = n('zRdu'),
        r = n('Gpmm')
      function i(e) {
        return s.createElement(
          'tr',
          { className: r.row },
          s.createElement('td', null, s.createElement('div', { className: r.line })),
          s.createElement(
            'td',
            null,
            s.createElement('div', { className: r.line }),
            e.hint ? s.createElement('div', { className: r.hint }, e.hint) : null,
          ),
        )
      }
      var l = n('TSYQ'),
        c = n('vCF3'),
        u = n('qFKp'),
        h = n('8+VR')
      var p = n('i/MG'),
        m = n('pr86'),
        d = n('w+Rv'),
        f = n('L/Ed'),
        v = n('euMy'),
        b = n('hn2c'),
        E = n('ycgn')
      class S extends a.a.PureComponent {
        constructor() {
          super(...arguments),
            (this._handleMouseOver = e => {
              ;(function (e) {
                const t = e.sourceCapabilities
                let n = t && t.firesTouchEvents
                return void 0 === n && (n = h.touch), n
              })(e.nativeEvent) ||
                (this.props.onMouseOver && this.props.onMouseOver())
            }),
            (this._handleClickToolbox = e => {
              e.stopPropagation(), this.props.onClickToolbox && this.props.onClickToolbox()
            })
        }
        render() {
          const {
              hasSubItems: e,
              shortcutHint: t,
              hint: n,
              invisibleHotkey: s,
              favourite: o,
              theme: r = E,
            } = this.props,
            i = this.props.checkable && this.props.checkboxInput ? 'label' : 'div'
          return a.a.createElement(
            a.a.Fragment,
            null,
            a.a.createElement(
              'tr',
              {
                className: l(
                  r.item,
                  !this.props.noInteractive && r.interactive,
                  this.props.hovered && r.hovered,
                  this.props.disabled && r.disabled,
                  this.props.active && r.active,
                  this.props.selected && r.selected,
                ),
                onClick: this.props.onClick,
                onMouseOver: this._handleMouseOver,
                ref: this.props.reference,
                'data-action-name': this.props.actionName,
              },
              void 0 !== o &&
                a.a.createElement(
                  'td',
                  null,
                  a.a.createElement(m.a, { className: r.favourite, isFilled: o, onClick: this.props.onFavouriteClick }),
                ),
              a.a.createElement('td', { className: l(r.iconCell), 'data-icon-cell': !0 }, this._icon(r)),
              a.a.createElement(
                'td',
                { className: r.contentCell },
                a.a.createElement(
                  i,
                  { className: r.content },
                  a.a.createElement(
                    'span',
                    { className: l(r.label, this.props.checked && r.checked), 'data-label': !0 },
                    this.props.label,
                  ),
                  this._toolbox(r),
                  e &&
                    a.a.createElement('span', {
                      className: r.arrowIcon,
                      dangerouslySetInnerHTML: { __html: b },
                      'data-submenu-arrow': !0,
                    }),
                  !e &&
                    t &&
                    !u.CheckMobile.any() &&
                    a.a.createElement(d.a, { className: l(s && r.invisibleHotkey), text: t }),
                  !e && !t && n && a.a.createElement(d.a, { text: n }),
                ),
              ),
            ),
            a.a.createElement('tr', { className: r.subMenu }, a.a.createElement('td', null, this.props.children)),
          )
        }
        _icon(e) {
          if (this.props.checkable) {
            if (this.props.checkboxInput)
              return a.a.createElement(c.a, { className: l(e.icon, e.checkboxInput), checked: this.props.checked })
            if (this.props.checked) {
              const t = !this.props.icon && !this.props.iconChecked,
                n = this.props.iconChecked || this.props.icon || v
              return a.a.createElement('span', {
                className: l(e.icon, t && e.checkmark),
                dangerouslySetInnerHTML: { __html: n },
                'data-icon-checkmark': t,
              })
            }
            return this.props.icon
              ? a.a.createElement('span', { className: e.icon, dangerouslySetInnerHTML: { __html: this.props.icon } })
              : a.a.createElement('span', { className: e.icon })
          }
          return this.props.icon
            ? a.a.createElement('span', { className: e.icon, dangerouslySetInnerHTML: { __html: this.props.icon } })
            : null
        }
        _toolbox(e) {
          return this.props.toolbox
            ? a.a.createElement(
                'span',
                {
                  className: l(e.toolbox, this.props.showToolboxOnHover && e.showToolboxOnHover),
                  onClick: this._handleClickToolbox,
                  'data-toolbox': !0,
                },
                this._renderToolboxContent(),
              )
            : null
        }
        _renderToolboxContent() {
          if (this.props.toolbox)
            switch (this.props.toolbox.type) {
              case f.ToolboxType.Delete:
                return a.a.createElement(p.a, { onClick: this.props.toolbox.action })
            }
          return null
        }
      }
      var _ = n('xRqE'),
        k = n('tWVy'),
        x = n('JWMC'),
        C = n('Ialn')
      var w = n('dxYz'),
        g = n('Eyy1')
      class y extends a.a.PureComponent {
        constructor(e) {
          super(e),
            (this._itemRef = null),
            (this._menuElementRef = a.a.createRef()),
            (this._menuRef = null),
            (this._handleClick = e => {
              e.isDefaultPrevented() ||
                this.state.disabled ||
                (this._hasSubItems()
                  ? this._showSubMenu()
                  : (this.state.doNotCloseOnClick || Object(k.b)(),
                    this.props.action.execute(),
                    this._trackEvent(),
                    this.props.onExecute && this.props.onExecute(this.props.action)))
            }),
            (this._handleClickToolbox = () => {
              Object(k.b)()
            }),
            (this._handleItemMouseOver = () => {
              this._showSubMenu(), this._setCurrentContextValue()
            }),
            (this._handleMenuMouseOver = () => {
              this._setCurrentContextValue()
            }),
            (this._showSubMenu = () => {
              this.props.onShowSubMenu(this.props.action)
            }),
            (this._calcSubMenuPos = e =>
              (function (e, t, n = { x: 0, y: 10 }) {
                if (t) {
                  const { left: n, right: s, top: a } = t.getBoundingClientRect(),
                    o = document.documentElement.clientWidth,
                    r = { x: n - e, y: a },
                    i = { x: s, y: a }
                  return Object(C.isRtl)() ? (n <= e ? i : r) : o - s >= e ? i : r
                }
                return n
              })(e, this._itemRef)),
            (this._updateState = e => {
              this.setState(e.getState())
            }),
            (this._setItemRef = e => {
              this._itemRef = e
            }),
            (this._handleMenuRef = e => {
              this._menuRef = e
            }),
            (this.state = { ...this.props.action.getState() })
        }
        componentDidMount() {
          var e
          this.props.action.onUpdate().subscribe(this, this._updateState),
            this.state.subItems.length &&
              (this._unsubscribe =
                null === (e = this.context) || void 0 === e
                  ? void 0
                  : e.registerSubmenu(
                      this.props.action.id,
                      e =>
                        Object(g.ensureNotNull)(this._itemRef).contains(e) ||
                        (null !== this._menuElementRef.current && this._menuElementRef.current.contains(e)),
                    )),
            this.props.reference && (this._itemRef = this.props.reference.current)
        }
        componentDidUpdate(e, t) {
          t.subItems !== this.state.subItems && null !== this._menuRef && this._menuRef.update()
        }
        componentWillUnmount() {
          this.props.action.onUpdate().unsubscribe(this, this._updateState), this._unsubscribe && this._unsubscribe()
        }
        render() {
          var e, t
          const n = (null === (e = this.context) || void 0 === e ? void 0 : e.current)
            ? this.context.current === this.props.action.id
            : this.props.isSubMenuOpened
          return a.a.createElement(
            S,
            {
              theme: this.props.theme,
              reference: null !== (t = this.props.reference) && void 0 !== t ? t : this._setItemRef,
              onClick: this._handleClick,
              onClickToolbox: this._handleClickToolbox,
              onMouseOver: this._handleItemMouseOver,
              hovered: n,
              hasSubItems: this._hasSubItems(),
              actionName: this.state.name,
              checkboxInput: this.props.checkboxInput,
              selected: this.props.selected,
              ...this.state,
            },
            a.a.createElement(_.a, {
              isOpened: n,
              items: this.state.subItems,
              position: this._calcSubMenuPos,
              menuStatName: this.props.menuStatName,
              parentStatName: this._getStatName(),
              menuElementReference: this._menuElementRef,
              onMouseOver: this.state.subItems.length ? this._handleMenuMouseOver : void 0,
              ref: this._handleMenuRef,
            }),
          )
        }
        _setCurrentContextValue() {
          var e
          this.state.subItems.length &&
            (null === (e = this.context) || void 0 === e || e.setCurrent(this.props.action.id))
        }
        _hasSubItems() {
          return this.state.subItems.length > 0
        }
        _trackEvent() {
          const e = this._getStatName()
          Object(x.trackEvent)('ContextMenuClick', this.props.menuStatName || '', e)
        }
        _getStatName() {
          return [this.props.parentStatName, this.state.statName].filter(e => Boolean(e)).join('.')
        }
      }
      y.contextType = w.a
      var O = n('6KyJ'),
        N = n('X64X')
      function M(e) {
        return s.createElement(S, {
          label: s.createElement(
            'div',
            { className: N.loaderWrap },
            s.createElement(O.a, { className: N.loader, color: 'gray' }),
          ),
          noInteractive: !0,
          onMouseOver: e.onMouseOver,
        })
      }
      function I(e) {
        return s.createElement(S, { label: e.label, noInteractive: !0, disabled: !0, onMouseOver: e.onMouseOver })
      }
      var K = n('4O8T'),
        R = n.n(K)
      class T extends s.PureComponent {
        constructor(e) {
          super(e),
            (this._loadEmitter = new R.a()),
            (this._onDone = () => {
              this.setState({ loaded: !0, failed: !1 }, this._updateMenu)
            }),
            (this._onFail = e => {
              this.setState({ failed: !0, error: e }, this._updateMenu)
            }),
            (this._updateMenu = () => {
              this.props.menu && this.props.menu.update()
            }),
            (this._handleMouseOver = () => {
              this.props.onShowSubMenu(this.props.action)
            }),
            (this.state = { loaded: this.props.action.isLoaded(), failed: !1, error: '' })
        }
        componentDidMount() {
          this._loadEmitter.on('done', this._onDone), this._loadEmitter.on('fail', this._onFail), this._load()
        }
        componentWillUnmount() {
          this._loadEmitter.removeEvent('done'), this._loadEmitter.removeEvent('fail')
        }
        render() {
          return this.state.failed
            ? s.createElement(I, { label: this.state.error, onMouseOver: this._handleMouseOver })
            : this.state.loaded
            ? s.createElement(y, { ...this.props })
            : s.createElement(M, { onMouseOver: this._handleMouseOver })
        }
        _load() {
          this.props.action
            .loadOptions()
            .then(() => {
              this._loadEmitter.emit('done')
            })
            .catch(e => {
              this._loadEmitter.emit('fail', e)
            })
        }
      }
      var B = n('39J6'),
        q = n('A7ND')
      function L(e) {
        return a.a.createElement(
          'tr',
          null,
          a.a.createElement('td', null, a.a.createElement(B.a, { className: q.loaderWrapper })),
        )
      }
      var D = n('PN6A')
      n.d(t, 'a', function () {
        return F
      })
      class F extends s.PureComponent {
        constructor(e) {
          super(e),
            (this._handleShowSubMenu = e => {
              const t = e.getState()
              this.setState({ showSubMenuOf: t.subItems.length ? e : void 0 })
            }),
            (this.state = {})
        }
        render() {
          return s.createElement(
            'table',
            null,
            s.createElement(
              'tbody',
              null,
              this.props.items.map(e => this._item(e)),
            ),
          )
        }
        static getDerivedStateFromProps(e, t) {
          return !e.parentIsOpened && t.showSubMenuOf ? { showSubMenuOf: void 0 } : null
        }
        _item(e) {
          switch (e.type) {
            case o.a.Separator:
              return s.createElement(i, { key: e.id, hint: e.getHint() })
            case o.a.Action:
              return s.createElement(y, {
                key: e.id,
                action: e,
                onShowSubMenu: this._handleShowSubMenu,
                isSubMenuOpened: this.state.showSubMenuOf === e,
                menuStatName: this.props.menuStatName,
                parentStatName: this.props.parentStatName,
              })
            case o.a.ActionAsync:
              return s.createElement(D.a.Consumer, { key: e.id }, t =>
                s.createElement(T, {
                  action: e,
                  onShowSubMenu: this._handleShowSubMenu,
                  isSubMenuOpened: this.state.showSubMenuOf === e,
                  menuStatName: this.props.menuStatName,
                  parentStatName: this.props.parentStatName,
                  menu: t,
                }),
              )
            case o.a.Loader:
              return s.createElement(L, { key: e.id })
            default:
              return null
          }
        }
      }
    },
    'J+f8': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return a
      })
      var s = n('q1tI')
      const a = s.createContext(!1)
    },
    O7m7: function (e, t, n) {},
    Oy6E: function (e, t, n) {
      e.exports = { spinnerWrap: 'spinnerWrap-1dkAsm33' }
    },
    'PR+g': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return a
      })
      var s = n('q1tI')
      const a = () => {
        const e = Object(s.useRef)(!1)
        return (
          Object(s.useEffect)(
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
    RgaO: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return a
      })
      var s = n('8Rai')
      function a(e) {
        const { children: t, ...n } = e
        return t(Object(s.a)(n))
      }
    },
    To8B: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path fill="currentColor" d="M9.707 9l4.647-4.646-.707-.708L9 8.293 4.354 3.646l-.708.708L8.293 9l-4.647 4.646.708.708L9 9.707l4.646 4.647.708-.707L9.707 9z"/></svg>'
    },
    X64X: function (e, t, n) {
      e.exports = { loaderWrap: 'loaderWrap-2SapxxDI', loader: 'loader-2SapxxDI' }
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
    euMy: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 14" width="18" height="14"><path fill="currentColor" d="M6 11.17l-4.17-4.17-1.42 1.41 5.59 5.59 12-12-1.41-1.41-10.59 10.58z"/></svg>'
    },
    fwrW: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.5 20L11 14.5 16.5 9"/></svg>'
    },
    'i/MG': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return c
      })
      n('YFKU')
      var s = n('q1tI'),
        a = n('TSYQ'),
        o = n('Iivm'),
        r = n('To8B'),
        i = n('kXJy')
      const l = { remove: window.t('Remove') }
      function c(e) {
        const { className: t, isActive: n, onClick: c, title: u, hidden: h, 'data-name': p = 'remove-button', ...m } = e
        return s.createElement(o.a, {
          ...m,
          'data-name': p,
          className: a(i.button, 'apply-common-tooltip', n && i.active, h && i.hidden, t),
          icon: r,
          onClick: c,
          title: u || l.remove,
        })
      }
    },
    kXJy: function (e, t, n) {
      e.exports = {
        button: 'button-3B9fDLtm',
        disabled: 'disabled-3B9fDLtm',
        active: 'active-3B9fDLtm',
        hidden: 'hidden-3B9fDLtm',
      }
    },
    l4ku: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return d
      })
      var s = n('q1tI'),
        a = n.n(s),
        o = n('TSYQ'),
        r = n('Iivm'),
        i = n('6KyJ'),
        l = n('J+f8'),
        c = n('w+Rv'),
        u = n('Xy1d'),
        h = n('Xzy5'),
        p = n('20PO'),
        m = n('XXQ5')
      function d(e) {
        const {
            isTitle: t,
            isLoading: n,
            isHovered: d,
            active: f,
            checkable: v,
            disabled: b,
            checked: E,
            icon: S,
            iconChecked: _,
            hint: k,
            subItems: x,
            label: C,
            onClick: w,
            children: g,
            toolbox: y,
            fullWidthLabel: O,
          } = e,
          N = Object(s.useContext)(l.a),
          M = !!x.length
        return n
          ? a.a.createElement('li', { className: o(m.item, m.loading) }, a.a.createElement(i.a, { color: 'gray' }))
          : a.a.createElement(
              'li',
              {
                className: o(
                  m.item,
                  m.interactive,
                  t && m.title,
                  b && m.disabled,
                  d && m.hovered,
                  f && m.active,
                  N && m.emptyIcons,
                ),
                onClick: w,
              },
              a.a.createElement(r.a, {
                className: o(m.icon),
                icon: (function () {
                  if (v && E) return _ || S || u
                  return S
                })(),
              }),
              a.a.createElement('span', { className: o(m.label, O && m.fullWidth) }, C),
              !!y &&
                a.a.createElement(r.a, {
                  onClick: function () {
                    y && y.action()
                  },
                  className: m.remove,
                  icon: p,
                }),
              !M && k && a.a.createElement(c.a, { className: m.shortcut, text: k }),
              M && a.a.createElement(r.a, { className: m.nested, icon: h }),
              g,
            )
      }
    },
    t3rk: function (e, t, n) {
      e.exports = { menu: 'menu-1Jmy26Oy' }
    },
    uqKQ: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return o
      })
      var s = n('q1tI'),
        a = n('AiMB')
      function o(e) {
        return class extends s.PureComponent {
          render() {
            const { isOpened: t, root: n } = this.props
            if (!t) return null
            const o = s.createElement(e, { ...this.props, zIndex: 150 })
            return 'parent' === n ? o : s.createElement(a.a, null, o)
          }
        }
      }
    },
    'w+Rv': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return i
      })
      var s = n('q1tI'),
        a = n('TSYQ'),
        o = n.n(a),
        r = n('ycgn')
      function i(e) {
        const { text: t = '', className: n } = e
        return s.createElement('span', { className: o()(r.shortcut, n) }, t)
      }
    },
    xRqE: function (e, t, n) {
      'use strict'
      var s = n('q1tI'),
        a = n.n(s),
        o = n('uqKQ'),
        r = n('DTHj'),
        i = n('RgaO'),
        l = n('ycI/'),
        c = n('TSYQ'),
        u = n('IAAr'),
        h = n('mkWe'),
        p = n('/KDZ'),
        m = n('zRdu'),
        d = n('38fQ')
      function f(e) {
        return a.a.createElement('li', { className: d.separator })
      }
      var v = n('l4ku'),
        b = n('Sn4D'),
        E = n('tWVy')
      function S(e) {
        const { action: t, isLoading: n } = e,
          [o, r] = Object(s.useState)(t.getState()),
          [i, l] = Object(s.useState)(!1),
          c = () => r(t.getState()),
          u = !!o.subItems.length,
          h = u && i
        return (
          Object(s.useEffect)(() => {
            n || r(t.getState())
          }, [n]),
          Object(s.useEffect)(
            () => (
              t.onUpdate().subscribe(null, c),
              () => {
                t.onUpdate().unsubscribe(null, c)
              }
            ),
            [],
          ),
          a.a.createElement(
            v.a,
            {
              ...o,
              onClick: function (e) {
                if (o.disabled || e.defaultPrevented) return
                if (u) return void l(!0)
                o.doNotCloseOnClick || Object(E.b)()
                t.execute()
              },
              isLoading: n,
              isHovered: h,
            },
            h &&
              a.a.createElement(
                b.a,
                { onClose: p, position: 'Bottom' },
                a.a.createElement(y, { items: o.subItems, parentAction: t, closeNested: p }),
              ),
          )
        )
        function p(e) {
          e && e.preventDefault(), l(!1)
        }
      }
      var _ = n('PR+g')
      function k(e) {
        const { action: t } = e,
          [n, o] = Object(s.useState)(t.isLoaded()),
          [r, i] = Object(s.useState)(!1),
          l = Object(_.a)()
        return (
          Object(s.useEffect)(() => {
            t.loadOptions()
              .then(() => {
                l.current && (o(!0), i(!1))
              })
              .catch(() => {
                l.current && i(!0)
              })
          }, []),
          a.a.createElement(S, { isLoading: !n || r, action: t })
        )
      }
      var x = n('39J6')
      function C(e) {
        return a.a.createElement('li', null, a.a.createElement(x.a, null))
      }
      var w = n('J+f8'),
        g = n('fwrW')
      function y(e) {
        const { items: t, parentAction: n, closeNested: s } = e,
          o =
            !Boolean(n) &&
            t.every(e => !Boolean(e.type !== m.a.Separator && (e.getState().icon || e.getState().checkable)))
        return a.a.createElement(
          w.a.Provider,
          { value: o },
          a.a.createElement(
            'ul',
            null,
            n &&
              a.a.createElement(
                a.a.Fragment,
                null,
                a.a.createElement(v.a, {
                  label: n.getState().label,
                  isTitle: !0,
                  active: !1,
                  disabled: !1,
                  subItems: [],
                  checkable: !1,
                  checked: !1,
                  doNotCloseOnClick: !1,
                  icon: g,
                  onClick: s,
                }),
                a.a.createElement(f, null),
              ),
            t.map(e => {
              switch (e.type) {
                case m.a.Action:
                  return a.a.createElement(S, { key: e.id, action: e })
                case m.a.Separator:
                  return a.a.createElement(f, { key: e.id })
                case m.a.ActionAsync:
                  return a.a.createElement(k, { key: e.id, action: e })
                case m.a.Loader:
                  return a.a.createElement(C, { key: e.id })
                default:
                  return null
              }
            }),
          ),
        )
      }
      const O = s.createContext(!1)
      var N = n('t3rk')
      n.d(t, 'a', function () {
        return M
      }),
        n.d(t, 'b', function () {
          return I
        })
      class M extends s.PureComponent {
        constructor(e) {
          super(e),
            (this._menuRef = s.createRef()),
            (this._handleClose = () => {
              this.props.onClose && this.props.onClose()
            }),
            (this._handleOutsideClickClose = e => {
              const { doNotCloseOn: t, onClose: n } = this.props
              !n || (void 0 !== t && t.contains(e.target)) || n()
            }),
            (this._handleFocusOnOpen = () => {
              var e, t
              ;(null === (e = this.props.menuElementReference) || void 0 === e ? void 0 : e.current) &&
                this.props.takeFocus &&
                (null === (t = this.props.menuElementReference) ||
                  void 0 === t ||
                  t.current.focus({ preventScroll: !0 }))
            }),
            (this.state = {})
        }
        render() {
          const {
            isOpened: e,
            onClose: t,
            items: n,
            doNotCloseOn: a,
            menuStatName: o,
            parentStatName: m,
            takeFocus: d,
            ...f
          } = this.props
          return e
            ? s.createElement(
                s.Fragment,
                null,
                s.createElement(l.a, { keyCode: 27, eventType: 'keyup', handler: this._handleClose }),
                s.createElement(
                  h.b,
                  null,
                  s.createElement(p.a, { rule: 'screen and (max-width: 428px)' }, t =>
                    this._isDrawer(t)
                      ? s.createElement(
                          b.a,
                          { onClose: this._handleClose, position: 'Bottom', 'data-name': f['data-name'] },
                          s.createElement(O.Provider, { value: t }, s.createElement(y, { items: n })),
                        )
                      : s.createElement(
                          i.a,
                          {
                            handler: this._handleOutsideClickClose,
                            mouseDown: !0,
                            touchStart: !0,
                            reference: this.props.menuElementReference,
                          },
                          t =>
                            s.createElement(
                              r.b,
                              {
                                ...f,
                                reference: t,
                                className: c(N.menu, 'context-menu'),
                                onClose: this._handleClose,
                                noMomentumBasedScroll: !0,
                                ref: this._menuRef,
                                tabIndex: d ? -1 : void 0,
                                onOpen: this._handleFocusOnOpen,
                              },
                              s.createElement(u.a, { items: n, menuStatName: o, parentStatName: m, parentIsOpened: e }),
                            ),
                        ),
                  ),
                ),
              )
            : null
        }
        update() {
          this._menuRef.current && this._menuRef.current.update()
        }
        _isDrawer(e) {
          return void 0 === this.props.mode ? e : 'drawer' === this.props.mode
        }
      }
      const I = Object(o.a)(M)
    },
    'ycI/': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return a
      })
      var s = n('q1tI')
      class a extends s.PureComponent {
        constructor() {
          super(...arguments),
            (this._handleKeyDown = e => {
              e.keyCode === this.props.keyCode && this.props.handler(e)
            })
        }
        componentDidMount() {
          document.addEventListener(this.props.eventType || 'keydown', this._handleKeyDown, !1)
        }
        componentWillUnmount() {
          document.removeEventListener(this.props.eventType || 'keydown', this._handleKeyDown, !1)
        }
        render() {
          return null
        }
      }
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
  },
])
