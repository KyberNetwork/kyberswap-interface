;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['drawing-toolbar'],
  {
    '5f7t': function (e, t, o) {
      'use strict'
      o.r(t)
      var i = o('q1tI'),
        n = o.n(i),
        s = o('i8i4'),
        a = o('Eyy1'),
        l = o('YFKU'),
        r = o('TSYQ'),
        c = o.n(r),
        d = o('8+VR'),
        h = o('Vdly'),
        u = o('Kxc7'),
        m = o('mMWL'),
        p = o('zL3Q'),
        b = o('FQhm'),
        g = o('aIyQ'),
        v = o.n(g),
        _ = o('qFKp'),
        w = (o('mNbo'), o('MP+M'))
      class T {
        constructor(e) {
          this._drawingsAccess = e || { tools: [], type: 'black' }
        }
        isToolEnabled(e) {
          const t = this._findTool(e)
          return !(!t || !t.grayed) || ('black' === this._drawingsAccess.type ? !t : !!t)
        }
        isToolGrayed(e) {
          const t = this._findTool(e)
          return Boolean(t && t.grayed)
        }
        _findTool(e) {
          return this._drawingsAccess.tools.find(t => t.name === e)
        }
      }
      var C = o('/3z9'),
        f = o('+GxX')
      const S = [
        {
          id: 'linetool-group-cursors',
          title: window.t('Cursors'),
          items: [{ name: 'cursor' }, { name: 'dot' }, { name: 'arrow' }, { name: 'eraser' }],
        },
        {
          id: 'linetool-group-trend-line',
          title: window.t('Trend Line Tools'),
          items: [
            { name: 'LineToolTrendLine', hotkeyHash: C.Modifiers.Alt + 84 },
            { name: 'LineToolArrow' },
            { name: 'LineToolRay' },
            { name: 'LineToolInfoLine' },
            { name: 'LineToolExtended' },
            { name: 'LineToolTrendAngle' },
            { name: 'LineToolHorzLine', hotkeyHash: C.Modifiers.Alt + 72 },
            { name: 'LineToolHorzRay' },
            { name: 'LineToolVertLine', hotkeyHash: C.Modifiers.Alt + 86 },
            { name: 'LineToolCrossLine', hotkeyHash: C.Modifiers.Alt + 67 },
            { name: 'LineToolParallelChannel' },
            { name: 'LineToolRegressionTrend' },
            { name: 'LineToolFlatBottom' },
            { name: 'LineToolDisjointAngle' },
            null,
          ].filter(Boolean),
        },
        {
          id: 'linetool-group-gann-and-fibonacci',
          title: window.t('Gann and Fibonacci Tools'),
          items: [
            { name: 'LineToolFibRetracement', hotkeyHash: C.Modifiers.Alt + 70 },
            { name: 'LineToolTrendBasedFibExtension' },
            { name: 'LineToolPitchfork' },
            { name: 'LineToolSchiffPitchfork2' },
            { name: 'LineToolSchiffPitchfork' },
            { name: 'LineToolInsidePitchfork' },
            { name: 'LineToolFibChannel' },
            { name: 'LineToolFibTimeZone' },
            { name: 'LineToolGannSquare' },
            { name: 'LineToolGannFixed' },
            { name: 'LineToolGannComplex' },
            { name: 'LineToolGannFan' },
            { name: 'LineToolFibSpeedResistanceFan' },
            { name: 'LineToolTrendBasedFibTime' },
            { name: 'LineToolFibCircles' },
            { name: 'LineToolPitchfan' },
            { name: 'LineToolFibSpiral' },
            { name: 'LineToolFibSpeedResistanceArcs' },
            { name: 'LineToolFibWedge' },
          ],
        },
        {
          id: 'linetool-group-geometric-shapes',
          title: window.t('Geometric Shapes'),
          items: [
            { name: 'LineToolBrush' },
            { name: 'LineToolHighlighter' },
            { name: 'LineToolRectangle' },
            { name: 'LineToolEllipse' },
            { name: 'LineToolPath' },
            { name: 'LineToolBezierQuadro' },
            { name: 'LineToolPolyline' },
            { name: 'LineToolTriangle' },
            { name: 'LineToolRotatedRectangle' },
            { name: 'LineToolArc' },
            { name: 'LineToolBezierCubic' },
          ],
        },
        {
          id: 'linetool-group-annotation',
          title: window.t('Annotation Tools'),
          items: [
            { name: 'LineToolText' },
            { name: 'LineToolTextAbsolute' },
            { name: 'LineToolNote' },
            { name: 'LineToolNoteAbsolute' },
            { name: 'LineToolSignpost' },
            null,
            { name: 'LineToolCallout' },
            { name: 'LineToolBalloon' },
            { name: 'LineToolPriceLabel' },
            { name: 'LineToolPriceNote' },
            { name: 'LineToolArrowMarker' },
            { name: 'LineToolArrowMarkLeft' },
            { name: 'LineToolArrowMarkRight' },
            { name: 'LineToolArrowMarkUp' },
            { name: 'LineToolArrowMarkDown' },
            { name: 'LineToolFlagMark' },
          ].filter(Boolean),
        },
        {
          id: 'linetool-group-patterns',
          title: window.t('Patterns'),
          items: [
            {
              name: 'LineTool5PointsPattern',
            },
            { name: 'LineToolCypherPattern' },
            { name: 'LineToolABCD' },
            { name: 'LineToolTrianglePattern' },
            { name: 'LineToolThreeDrivers' },
            { name: 'LineToolHeadAndShoulders' },
            { name: 'LineToolElliottImpulse' },
            { name: 'LineToolElliottTriangle' },
            { name: 'LineToolElliottTripleCombo' },
            { name: 'LineToolElliottCorrection' },
            { name: 'LineToolElliottDoubleCombo' },
            { name: 'LineToolCircleLines' },
            { name: 'LineToolTimeCycles' },
            { name: 'LineToolSineLine' },
          ],
        },
        {
          id: 'linetool-group-prediction-and-measurement',
          title: window.t('Prediction and Measurement Tools'),
          items: [
            { name: 'LineToolRiskRewardLong' },
            { name: 'LineToolRiskRewardShort' },
            { name: 'LineToolPrediction' },
            { name: 'LineToolDateRange' },
            { name: 'LineToolPriceRange' },
            { name: 'LineToolDateAndPriceRange' },
            { name: 'LineToolBarsPattern' },
            Object(f.isFeatureEnabled)('remove-line-tool-ghost-feed') ? null : { name: 'LineToolGhostFeed' },
            { name: 'LineToolProjection' },
            { name: 'LineToolFixedRangeVolumeProfile' },
          ].filter(Boolean),
        },
      ]
      var y = o('OiSa'),
        k = o('cvc5'),
        E = o('Iivm'),
        D = o('//lZ'),
        L = o('9uLv'),
        O = o('uJ8n'),
        M = o('Vike')
      class N extends n.a.PureComponent {
        constructor(e) {
          super(e),
            (this._scroll = null),
            (this._handleScrollTop = () => {
              this.animateTo(Math.max(0, this.currentPosition() - (this.state.heightWrap - 50)))
            }),
            (this._handleScrollBot = () => {
              this.animateTo(
                Math.min(
                  (this.state.heightContent || 0) - (this.state.heightWrap || 0),
                  this.currentPosition() + (this.state.heightWrap - 50),
                ),
              )
            }),
            (this._handleResizeWrap = ({ height: e }) => {
              this.setState({ heightWrap: e })
            }),
            (this._handleResizeContent = ({ height: e }) => {
              this.setState({ heightContent: e })
            }),
            (this._handleScroll = () => {
              const { onScroll: e } = this.props
              e && e(this.currentPosition(), this.isAtTop(), this.isAtBot()), this._checkButtonsVisibility()
            }),
            (this._checkButtonsVisibility = () => {
              const { isVisibleTopButton: e, isVisibleBotButton: t } = this.state,
                o = this.isAtTop(),
                i = this.isAtBot()
              o || e ? o && e && this.setState({ isVisibleTopButton: !1 }) : this.setState({ isVisibleTopButton: !0 }),
                i || t ? i && t && this.setState({ isVisibleBotButton: !1 }) : this.setState({ isVisibleBotButton: !0 })
            }),
            (this.state = { heightContent: 0, heightWrap: 0, isVisibleBotButton: !1, isVisibleTopButton: !1 })
        }
        componentDidMount() {
          this._checkButtonsVisibility()
        }
        componentDidUpdate(e, t) {
          ;(t.heightWrap === this.state.heightWrap && t.heightContent === this.state.heightContent) ||
            this._handleScroll()
        }
        currentPosition() {
          return this._scroll ? this._scroll.scrollTop : 0
        }
        isAtTop() {
          return this.currentPosition() <= 1
        }
        isAtBot() {
          return this.currentPosition() + this.state.heightWrap >= this.state.heightContent - 1
        }
        animateTo(e, t = L.b) {
          const o = this._scroll
          o &&
            Object(D.doAnimate)({
              onStep(e, t) {
                o.scrollTop = t
              },
              from: o.scrollTop,
              to: Math.round(e),
              easing: L.c.easeInOutCubic,
              duration: t,
            })
        }
        render() {
          const {
              children: e,
              isVisibleScrollbar: t,
              isVisibleFade: o,
              isVisibleButtons: i,
              onMouseOver: s,
              onMouseOut: a,
            } = this.props,
            { heightContent: l, heightWrap: r, isVisibleBotButton: d, isVisibleTopButton: h } = this.state
          return n.a.createElement(
            k,
            { whitelist: ['height'], onMeasure: this._handleResizeWrap },
            n.a.createElement(
              'div',
              { className: O.wrap, onMouseOver: s, onMouseOut: a },
              n.a.createElement(
                'div',
                {
                  className: c()(O.scrollWrap, { [O.noScrollBar]: !t }),
                  onScroll: this._handleScroll,
                  ref: e => (this._scroll = e),
                },
                n.a.createElement(
                  k,
                  { onMeasure: this._handleResizeContent, whitelist: ['height'] },
                  n.a.createElement('div', { className: O.content }, e),
                ),
              ),
              o && n.a.createElement('div', { className: c()(O.fadeTop, { [O.isVisible]: h && l > r }) }),
              o && n.a.createElement('div', { className: c()(O.fadeBot, { [O.isVisible]: d && l > r }) }),
              i &&
                n.a.createElement(
                  'div',
                  { className: c()(O.scrollTop, { [O.isVisible]: h && l > r }), onClick: this._handleScrollTop },
                  n.a.createElement(
                    'div',
                    { className: O.iconWrap },
                    n.a.createElement(E.a, { icon: M, className: O.icon }),
                  ),
                ),
              i &&
                n.a.createElement(
                  'div',
                  { className: c()(O.scrollBot, { [O.isVisible]: d && l > r }), onClick: this._handleScrollBot },
                  n.a.createElement(
                    'div',
                    { className: O.iconWrap },
                    n.a.createElement(E.a, { icon: M, className: O.icon }),
                  ),
                ),
            ),
          )
        }
      }
      N.defaultProps = { isVisibleScrollbar: !0 }
      var A = o('lxNp'),
        B = o('tWVy'),
        j = o('4rU7')
      function V(e) {
        const { id: t, action: o, isActive: n, isHidden: s, isTransparent: a, toolName: l } = e
        return i.createElement(j.a, {
          id: t,
          icon: w.a[l].icon,
          isActive: n,
          isHidden: s,
          isTransparent: a,
          onClick: o,
          title: w.a[l].localizedName,
          'data-name': l,
        })
      }
      var W = o('wZIs')
      const P = [
        61536, 61537, 61538, 61539, 61725, 61726, 61575, 61576, 61796, 61797, 61779, 61780, 61781, 61782, 61783, 61784,
        61785, 61786, 61440, 61441, 61442, 61444, 61445, 61446, 61447, 61448, 61452, 61453, 61454, 61456, 61457, 61458,
        61459, 61460, 61461, 61463, 61464, 61466, 61467, 61469, 61470, 61473, 61475, 61476, 61488, 61502, 61504, 61505,
        61507, 61510, 61523, 61524, 61525, 61526, 61527, 61528, 61529, 61530, 61531, 61532, 61533, 61534, 61540, 61541,
        61542, 61543, 61544, 61545, 61546, 61547, 61548, 61550, 61552, 61553, 61554, 61555, 61557, 61558, 61559, 61560,
        61565, 61566, 61568, 61572, 61574, 61578, 61588, 61597, 61601, 61602, 61603, 61604, 61605, 61606, 61607, 61608,
        61609, 61610, 61611, 61616, 61617, 61635, 61648, 61649, 61654, 61655, 61656, 61657, 61658, 61659, 61666, 61667,
        61669, 61670, 61671, 61672, 61673, 61675, 61681, 61682, 61683, 61684, 61696, 61697, 61698, 61699, 61700, 61701,
        61702, 61703, 61704, 61705, 61706, 61707, 61708, 61712, 61713, 61714, 61715, 61720, 61721, 61722, 61731, 61732,
        61736, 61737, 61738, 61746, 61747, 61748, 61749, 61751, 61752, 61753, 61754, 61757, 61758, 61760, 61764, 61768,
        61769, 61770, 61771, 61772, 61773, 61774, 61776, 61777, 61778, 61799, 61811, 61812, 61813, 61814, 61815, 61816,
        61817, 61818, 61819, 61820, 61821, 61826, 61827, 61828, 61829, 61830, 61831, 61832, 61836, 61838, 61840, 61842,
        61845,
      ]
      var F = o('9dlw'),
        x = o('ijHL'),
        U = o('Sn4D'),
        I = o('hn2c'),
        R = o('KmEK')
      class z extends i.PureComponent {
        constructor(e) {
          super(e),
            (this._toggleDropdown = e => {
              this.setState({ isOpened: void 0 !== e ? e : !this.state.isOpened })
            }),
            (this._handleClose = () => {
              this._toggleDropdown(!1)
            }),
            (this._getDropdownPosition = () => {
              if (!this._control) return { x: 0, y: 0 }
              const e = this._control.getBoundingClientRect()
              return { x: e.left + e.width + 1, y: e.top - 6 }
            }),
            (this._handleClickArrow = () => {
              this._toggleDropdown()
            }),
            (this._handleTouchStart = () => {
              this.props.onClickButton && this.props.onClickButton(), this._toggleDropdown()
            }),
            (this._handlePressStart = () => {
              if (d.mobiletouch && !this.props.checkable)
                !this._longPressDelay && this.props.onClickButton && this.props.onClickButton()
              else {
                if (this._doubleClickDelay)
                  return (
                    clearTimeout(this._doubleClickDelay), delete this._doubleClickDelay, void this._toggleDropdown(!0)
                  )
                this._doubleClickDelay = setTimeout(() => {
                  delete this._doubleClickDelay,
                    !this._longPressDelay && this.props.onClickButton && this.props.onClickButton()
                }, 175)
              }
              this._longPressDelay = setTimeout(() => {
                delete this._longPressDelay, this._toggleDropdown(!0)
              }, 300)
            }),
            (this._cancelAllTimeouts = () => {
              clearTimeout(this._longPressDelay),
                delete this._longPressDelay,
                clearTimeout(this._doubleClickDelay),
                delete this._doubleClickDelay
            }),
            (this._handleTouchPressEnd = e => {
              e.cancelable && e.preventDefault(), this._handlePressEnd()
            }),
            (this._handlePressEnd = () => {
              this._longPressDelay &&
                (clearTimeout(this._longPressDelay),
                delete this._longPressDelay,
                this.state.isOpened
                  ? this._toggleDropdown(!1)
                  : this.props.checkable || this.state.isOpened || !this.props.isActive || d.mobiletouch
                  ? !this._doubleClickDelay && this.props.onClickButton && this.props.onClickButton()
                  : this._toggleDropdown(!0))
            }),
            (this.state = { isOpened: !1 })
        }
        render() {
          const {
              buttonActiveClass: e,
              buttonClass: t,
              buttonIcon: o,
              buttonTitle: n,
              buttonHotKey: s,
              dropdownTooltip: a,
              children: l,
              isActive: c,
              isGrayed: h,
              onClickWhenGrayed: u,
              checkable: m,
              isSmallTablet: p,
            } = this.props,
            { isOpened: b } = this.state,
            g = Object(x.b)(this.props)
          return i.createElement(
            'div',
            {
              className: r(R.dropdown, { [R.isGrayed]: h, [R.isActive]: c, [R.isOpened]: b }),
              onClick: h ? u : void 0,
            },
            i.createElement(
              'div',
              { ...g, ref: e => (this._control = e), className: R.control },
              i.createElement(
                'div',
                {
                  ...this._getButtonHandlers(),
                  className: r(R.buttonWrap, { 'apply-common-tooltip common-tooltip-vertical': Boolean(n || s) }),
                  'data-tooltip-hotkey': s,
                  'data-tooltip-delay': 1500,
                  'data-role': 'button',
                  title: n,
                },
                i.createElement(j.a, {
                  activeClass: e,
                  className: t,
                  icon: o,
                  isActive: c,
                  isGrayed: h,
                  isTransparent: !m,
                }),
              ),
              !h &&
                !d.mobiletouch &&
                i.createElement(
                  'div',
                  {
                    className: r(R.arrow, a && 'apply-common-tooltip common-tooltip-vertical'),
                    title: a,
                    onClick: this._handleClickArrow,
                    'data-role': 'menu-handle',
                  },
                  i.createElement(E.a, { className: R.arrowIcon, icon: I }),
                ),
            ),
            !h &&
              (p
                ? b && i.createElement(U.a, { onClose: this._handleClose, position: 'Bottom' }, l)
                : i.createElement(
                    F.a,
                    {
                      doNotCloseOn: this,
                      isOpened: b,
                      onClose: this._handleClose,
                      position: this._getDropdownPosition,
                    },
                    l,
                  )),
          )
        }
        _getButtonHandlers() {
          const { isGrayed: e, checkable: t } = this.props
          return e
            ? {}
            : d.mobiletouch
            ? t
              ? {
                  onTouchStart: this._handlePressStart,
                  onTouchEnd: this._handleTouchPressEnd,
                  onTouchMove: this._cancelAllTimeouts,
                }
              : { onClick: this._handleTouchStart }
            : { onMouseDown: this._handlePressStart, onMouseUp: this._handlePressEnd }
        }
      }
      var G = o('KKsp'),
        H = o('EA32')
      const K = { icon: window.t('Icon'), dropdownTooltip: window.t('Icons') }
      class q extends i.Component {
        constructor(e) {
          super(e),
            (this._renderItem = (e, t) => {
              const { isSmallTablet: o } = this.props,
                n = c()(
                  H.item,
                  o && H.smallTablet,
                  t && o && this.state.isActive && e === this.state.current && H.active,
                )
              return i.createElement(
                'div',
                {
                  className: n,
                  key: e,
                  onClick: () => {
                    this._handleSelect(e), Object(B.b)()
                  },
                },
                String.fromCharCode(e),
              )
            }),
            (this._onChangeDrawingState = () => {
              this.setState({ isActive: this._isActive() })
            }),
            (this._handleSelect = e => {
              Object(W.saveDefaults)('linetoolicon', { ...Object(W.defaults)('linetoolicon'), icon: e }),
                m.iconTool.setValue(e),
                m.tool.setValue('LineToolIcon')
              let { recents: t } = this.state
              const o = t.indexOf(e)
              ;-1 !== o && t.splice(o, 1),
                (t = [e, ...t.slice(0, 9)]),
                Object(h.setJSON)('linetoolicon.recenticons', t),
                this.setState({ current: e, recents: t })
            }),
            (this.state = {
              current: Object(W.defaults)('linetoolicon').icon,
              recents: Object(h.getJSON)('linetoolicon.recenticons') || [],
            })
        }
        componentDidMount() {
          m.tool.subscribe(this._onChangeDrawingState), h.onSync.subscribe(this, this._onSyncSettings)
        }
        componentWillUnmount() {
          m.tool.unsubscribe(this._onChangeDrawingState), h.onSync.unsubscribe(this, this._onSyncSettings)
        }
        render() {
          const { isGrayed: e, toolName: t, isSmallTablet: o } = this.props,
            { current: n, isActive: s, recents: a } = this.state,
            l = Object(x.b)(this.props),
            r = c()(H.wrap, o && H.smallTablet)
          return i.createElement(
            z,
            {
              buttonClass: H.button,
              buttonIcon: i.createElement('div', { className: H.buttonIcon }, String.fromCharCode(n || P[0])),
              buttonTitle: K.icon,
              dropdownTooltip: K.dropdownTooltip,
              isActive: s,
              isGrayed: e,
              isSmallTablet: o,
              onClickButton: () => this._handleSelect(n || P[0]),
              onClickWhenGrayed: () =>
                Object(b.emit)('onGrayedObjectClicked', { type: 'drawing', name: w.a[t].localizedName }),
              ...l,
            },
            a &&
              i.createElement(
                i.Fragment,
                null,
                o && i.createElement('div', { className: H.title }, window.t('Recently used')),
                i.createElement(
                  'div',
                  { className: r },
                  a.map(e => this._renderItem(e, !0)),
                ),
                i.createElement(G.a, { className: c()(o && H.separator) }),
              ),
            i.createElement(
              'div',
              { key: 'all', className: r },
              P.map(e => this._renderItem(e)),
            ),
          )
        }
        _isActive() {
          return m.tool.value() === this.props.toolName
        }
        _onSyncSettings() {
          this.setState({ recents: Object(h.getJSON)('linetoolicon.recenticons') })
        }
      }
      var J = o('Ocx9')
      class Y extends i.PureComponent {
        constructor(e) {
          super(e),
            (this._handleClick = () => {
              this.props.saveDefaultOnChange && Object(J.saveDefaultProperties)(!0)
              const e = !this.props.property.value()
              this.props.property.setValue(e),
                this.props.saveDefaultOnChange && Object(J.saveDefaultProperties)(!1),
                this.props.onClick && this.props.onClick(e)
            }),
            (this.state = { isActive: this.props.property.value() })
        }
        componentDidMount() {
          this.props.property.subscribe(this, this._onChange)
        }
        componentWillUnmount() {
          this.props.property.unsubscribe(this, this._onChange)
        }
        render() {
          const { toolName: e } = this.props,
            { isActive: t } = this.state,
            o = w.a[e]
          return i.createElement(j.a, {
            icon: t && o.iconActive ? o.iconActive : o.icon,
            isActive: t,
            onClick: this._handleClick,
            title: o.localizedName,
            buttonHotKey: o.hotKey,
            'data-name': e,
          })
        }
        _onChange(e) {
          this.setState({ isActive: e.value() })
        }
      }
      class Q extends i.PureComponent {
        constructor(e) {
          super(e),
            (this._handleClick = () => {
              m.tool.setValue(this.props.toolName)
            }),
            (this._onChange = () => {
              this.setState({ isActive: m.tool.value() === this.props.toolName })
            }),
            (this.state = { isActive: m.tool.value() === this.props.toolName })
        }
        componentDidMount() {
          m.tool.subscribe(this._onChange)
        }
        componentWillUnmount() {
          m.tool.unsubscribe(this._onChange)
        }
        render() {
          const { toolName: e } = this.props,
            { isActive: t } = this.state,
            o = w.a[e]
          return i.createElement(j.a, {
            icon: w.a[e].icon,
            isActive: t,
            isTransparent: !0,
            onClick: this._handleClick,
            title: o.localizedName,
            buttonHotKey: o.hotKey,
            'data-name': e,
          })
        }
      }
      class Z extends i.PureComponent {
        constructor(e) {
          super(e),
            (this._boundUndoModel = null),
            (this._handleClick = () => {
              const e = this._activeChartWidget()
              e.hasModel() && e.model().zoomFromViewport()
            }),
            (this._syncUnzoomButton = () => {
              const e = this._activeChartWidget()
              let t = !1
              if (e.hasModel()) {
                const o = e.model()
                this._boundUndoModel !== o &&
                  (this._boundUndoModel &&
                    this._boundUndoModel.zoomStack().onChange().unsubscribe(null, this._syncUnzoomButton),
                  o.zoomStack().onChange().subscribe(null, this._syncUnzoomButton),
                  (this._boundUndoModel = o)),
                  (t = !o.zoomStack().isEmpty())
              } else e.withModel(null, this._syncUnzoomButton)
              this.setState({ isVisible: t })
            }),
            (this.state = { isVisible: !1 })
        }
        componentDidMount() {
          this.props.chartWidgetCollection.activeChartWidget.subscribe(this._syncUnzoomButton, { callWithLast: !0 })
        }
        componentWillUnmount() {
          this.props.chartWidgetCollection.activeChartWidget.unsubscribe(this._syncUnzoomButton)
        }
        render() {
          return this.state.isVisible
            ? i.createElement(V, { action: this._handleClick, isTransparent: !0, toolName: 'zoom-out' })
            : i.createElement('div', null)
        }
        _activeChartWidget() {
          return this.props.chartWidgetCollection.activeChartWidget.value()
        }
      }
      var X = o('b2d7'),
        $ = o('pr86'),
        ee = o('N5tr'),
        te = o('dhVi')
      class oe extends i.PureComponent {
        constructor(e) {
          super(e),
            (this._onChangeDrawingState = () => {
              const e = this._getActiveToolIndex()
              this.setState({ current: -1 !== e ? e : this.state.current, isActive: -1 !== e })
            }),
            (this._handleClickButton = () => {
              if (_.CheckMobile.any()) return
              const e = this._getCurrentToolName()
              this._selectTool(e)
            }),
            (this._handleClickItem = e => {
              this._selectTool(e)
            }),
            (this._handleGrayedClick = e => {
              Object(b.emit)('onGrayedObjectClicked', { type: 'drawing', name: w.a[e].localizedName })
            }),
            (this._handleClickFavorite = e => {
              this.state.favState && this.state.favState[e] ? X.a.removeFavorite(e) : X.a.addFavorite(e)
            }),
            (this._onAddFavorite = e => {
              this.setState({ favState: { ...this.state.favState, [e]: !0 } })
            }),
            (this._onRemoveFavorite = e => {
              this.setState({ favState: { ...this.state.favState, [e]: !1 } })
            }),
            (this._onSyncFavorites = () => {
              this.setState({ favState: this._composeFavState() })
            })
          const t = this._getActiveToolIndex()
          this.state = {
            current: -1 === t ? this._firstNonGrayedTool() : t,
            favState: this._composeFavState(),
            isActive: -1 !== t,
          }
        }
        componentDidMount() {
          m.tool.subscribe(this._onChangeDrawingState),
            X.a.favoriteAdded.subscribe(null, this._onAddFavorite),
            X.a.favoriteRemoved.subscribe(null, this._onRemoveFavorite),
            X.a.favoritesSynced.subscribe(null, this._onSyncFavorites)
        }
        componentWillUnmount() {
          m.tool.unsubscribe(this._onChangeDrawingState),
            X.a.favoriteAdded.unsubscribe(null, this._onAddFavorite),
            X.a.favoriteRemoved.unsubscribe(null, this._onRemoveFavorite),
            X.a.favoritesSynced.unsubscribe(null, this._onSyncFavorites)
        }
        componentDidUpdate(e, t) {
          e.lineTools !== this.props.lineTools && this.setState({ favState: this._composeFavState() })
        }
        render() {
          const { favoriting: e, grayedTools: t, lineTools: o, dropdownTooltip: n, isSmallTablet: s } = this.props,
            { current: a, favState: l, isActive: r } = this.state,
            c = this._getCurrentToolName(),
            d = w.a[c],
            h = this._showShortcuts(),
            u = Object(x.b)(this.props)
          return i.createElement(
            'span',
            null,
            i.createElement(
              z,
              {
                buttonIcon: d.icon,
                buttonTitle: d.localizedName,
                buttonHotKey: d.hotKey,
                dropdownTooltip: n,
                isActive: r,
                onClickButton: this._handleClickButton,
                isSmallTablet: s,
                ...u,
              },
              o.map((o, n) => {
                const c = o.name,
                  d = w.a[c],
                  u = t[c]
                return i.createElement(ee.b, {
                  key: c,
                  'data-name': o.name,
                  theme: s ? te.a : void 0,
                  dontClosePopup: u,
                  forceShowShortcuts: h,
                  shortcut: !s && o.hotkeyHash ? Object(C.humanReadableHash)(o.hotkeyHash) : void 0,
                  icon: d.icon,
                  isActive: r && a === n,
                  appearAsDisabled: u,
                  label: d.localizedName,
                  onClick: u ? this._handleGrayedClick : this._handleClickItem,
                  onClickArg: c,
                  showToolboxOnHover: !l[c],
                  toolbox:
                    e && !u
                      ? i.createElement($.a, {
                          isActive: r && a === n,
                          isFilled: l[c],
                          onClick: () => this._handleClickFavorite(c),
                        })
                      : void 0,
                })
              }),
            ),
          )
        }
        _getCurrentToolName() {
          const { current: e } = this.state,
            { lineTools: t } = this.props
          return t[e || 0].name
        }
        _firstNonGrayedTool() {
          const { grayedTools: e, lineTools: t } = this.props
          return t.findIndex(t => !e[t.name])
        }
        _getActiveToolIndex() {
          return this.props.lineTools.findIndex(e => e.name === m.tool.value())
        }
        _showShortcuts() {
          return this.props.lineTools.some(e => 'shortcut' in e)
        }
        _selectTool(e) {
          m.tool.setValue(e)
        }
        _composeFavState() {
          const e = {}
          return (
            this.props.lineTools.forEach(t => {
              e[t.name] = X.a.isFavorite(t.name)
            }),
            e
          )
        }
      }
      var ie = o('JWMC'),
        ne = o('nPPD'),
        se = o('FTBN')
      const ae = Object(ne.a)(ee.a, se),
        le = {
          all: window.t('Remove Drawings & Indicators'),
          drawings: window.t('Remove Drawings'),
          studies: window.t('Remove Indicators'),
        }
      class re extends i.PureComponent {
        constructor() {
          super(...arguments),
            (this._handleRemoveToolClick = () => {
              d.mobiletouch || this._handleRemoveDrawings()
            }),
            (this._handleRemoveDrawings = () => {
              Object(ie.trackEvent)('GUI', 'Chart Left Toolbar', 'remove drawing'),
                this.props.chartWidgetCollection.activeChartWidget.value().removeAllDrawingTools()
            }),
            (this._handleRemoveStudies = () => {
              Object(ie.trackEvent)('GUI', 'Chart Left Toolbar', 'remove indicator'),
                this.props.chartWidgetCollection.activeChartWidget.value().removeAllStudies()
            }),
            (this._handleRemoveAll = () => {
              Object(ie.trackEvent)('GUI', 'Chart Left Toolbar', 'remove all'),
                this.props.chartWidgetCollection.activeChartWidget.value().removeAllStudiesDrawingTools()
            })
        }
        render() {
          const e = this.props.isSmallTablet ? ae : void 0
          return i.createElement(
            z,
            {
              buttonIcon: w.a[this.props.toolName].icon,
              buttonTitle: le.drawings,
              onClickButton: this._handleRemoveToolClick,
              isSmallTablet: this.props.isSmallTablet,
              'data-name': this.props.toolName,
            },
            i.createElement(ee.b, {
              'data-name': 'remove-drawing-tools',
              label: le.drawings,
              onClick: this._handleRemoveDrawings,
              theme: e,
            }),
            i.createElement(ee.b, {
              'data-name': 'remove-studies',
              label: le.studies,
              onClick: this._handleRemoveStudies,
              theme: e,
            }),
            i.createElement(ee.b, {
              'data-name': 'remove-all',
              label: le.all,
              onClick: this._handleRemoveAll,
              theme: e,
            }),
          )
        }
      }
      var ce = o('Ijvb')
      function de(e) {
        const { hideDrawingsProperty: t, hideIndicatorsProperty: o, isSmallTablet: s } = e,
          [a, r] = Object(i.useState)(() => h.getValue('ChartToolsHideMode', 'drawings')),
          [c, d] = Object(i.useState)(() => t.value()),
          [u, m] = Object(i.useState)(() => o.value())
        Object(i.useEffect)(() => {
          const e = v('drawings', d),
            i = v('indicators', m)
          return (
            t.subscribe(null, e),
            o.subscribe(null, i),
            () => {
              t.unsubscribe(null, e), o.unsubscribe(null, i)
            }
          )
        }, [])
        const p = w.a.hideAllDrawings,
          b = c || u,
          g = s ? ae : void 0
        return n.a.createElement(
          z,
          {
            buttonIcon: (function () {
              switch (a) {
                case 'drawings':
                  return c ? ce.a.hideAllDrawingToolsActive : ce.a.hideAllDrawingTools
                case 'indicators':
                  return u ? ce.a.hideAllIndicatorsActive : ce.a.hideAllIndicators
                default:
                  return c && u ? ce.a.hideAllDrawingsActive : ce.a.hideAllDrawings
              }
            })(),
            buttonTitle: (function () {
              switch (a) {
                case 'drawings':
                  return b ? Object(l.t)('Show all drawings') : Object(l.t)('Hide all drawings')
                case 'indicators':
                  return b ? Object(l.t)('Show all indicators') : Object(l.t)('Hide all indicators')
                default:
                  return b
                    ? Object(l.t)('Show all drawings and indicators')
                    : Object(l.t)('Hide all drawings and indicators')
              }
            })(),
            buttonHotKey: p.hotKey,
            onClickButton: function () {
              switch (a) {
                case 'drawings':
                  he(t)
                  break
                case 'indicators':
                  he(o)
                  break
                default:
                  he(t), he(o)
              }
            },
            isSmallTablet: s,
            isActive: b,
            checkable: !0,
            'data-name': 'hide-all',
            'data-type': {
              drawings: 'hide-drawing-tools',
              indicators: 'hide-indicators',
              all: 'hide-drawings-and-indicators',
            }[a],
          },
          n.a.createElement(ee.b, {
            label: Object(l.t)('Hide drawings'),
            isActive: c && !u,
            onClick: function () {
              const e = 'all' === a || !c
              o.setValue(!1), t.setValue(e), _('drawings'), ue('hide drawings', e)
            },
            'data-name': 'hide-drawing-tools',
            theme: g,
          }),
          n.a.createElement(ee.b, {
            label: Object(l.t)('Hide indicators'),
            isActive: !c && u,
            onClick: function () {
              const e = 'all' === a || !u
              t.setValue(!1), o.setValue(e), _('indicators'), ue('hide indicators', e)
            },
            'data-name': 'hide-indicators',
            theme: g,
          }),
          n.a.createElement(ee.b, {
            label: Object(l.t)('Hide drawings & indicators'),
            isActive: c && u,
            onClick: function () {
              const e = !(c && u)
              t.setValue(e), o.setValue(e), _('all'), ue('hide drawings and indicators', e)
            },
            'data-name': 'hide-drawings-and-indicators',
            theme: g,
          }),
        )
        function v(e, t) {
          return e => t(e.value())
        }
        function _(e) {
          r(e), h.setValue('ChartToolsHideMode', e)
        }
      }
      function he(e) {
        e.setValue(!e.value())
      }
      function ue(e, t) {
        Object(ie.trackEvent)('GUI', 'Chart Left Toolbar', `${e} ${t ? 'on' : 'off'}`)
      }
      var me = o('g5Qf'),
        pe = o('85c9')
      const be = window.t('Show Favorite Drawing Tools Toolbar')
      class ge extends i.PureComponent {
        constructor() {
          super(...arguments),
            (this._instance = null),
            (this._promise = null),
            (this._bindedForceUpdate = () => this.forceUpdate()),
            (this._handleClick = () => {
              null !== this._instance && (this._instance.isVisible() ? this._instance.hide() : this._instance.show())
            })
        }
        componentDidMount() {
          const e = (this._promise = Object(a.ensureNotNull)(Object(me.getFavoriteDrawingToolbarPromise)()))
          e.then(t => {
            this._promise === e &&
              ((this._instance = t),
              this._instance.canBeShown().subscribe(this._bindedForceUpdate),
              this._instance.visibility().subscribe(this._bindedForceUpdate),
              this.forceUpdate())
          })
        }
        componentWillUnmount() {
          ;(this._promise = null),
            null !== this._instance &&
              (this._instance.canBeShown().unsubscribe(this._bindedForceUpdate),
              this._instance.visibility().unsubscribe(this._bindedForceUpdate),
              (this._instance = null))
        }
        render() {
          return null !== this._instance && this._instance.canBeShown().value()
            ? i.createElement(j.a, {
                id: this.props.id,
                icon: pe,
                isActive: this._instance.isVisible(),
                onClick: this._handleClick,
                title: be,
              })
            : null
        }
      }
      var ve,
        _e = o('4o++')
      !(function (e) {
        ;(e.Screenshot = 'drawing-toolbar-screenshot'),
          (e.FavoriteDrawings = 'drawing-toolbar-favorite-drawings'),
          (e.ObjectTree = 'drawing-toolbar-object-tree')
      })(ve || (ve = {}))
      var we = o('8d0Q'),
        Te = o('XAms'),
        Ce = o('7RN7'),
        fe = o('X0gx'),
        Se = o('Wz44')
      const ye = Se,
        ke = 'http://www.w3.org/2000/svg'
      function Ee(e) {
        const { direction: t, theme: o = Se } = e
        return i.createElement(
          'svg',
          {
            xmlns: ke,
            width: '9',
            height: '27',
            viewBox: '0 0 9 27',
            className: r(o.container, 'right' === t ? o.mirror : null),
            onContextMenu: Te.a,
          },
          i.createElement(
            'g',
            { fill: 'none', fillRule: 'evenodd' },
            i.createElement('path', {
              className: o.background,
              d: 'M4.5.5a4 4 0 0 1 4 4v18a4 4 0 1 1-8 0v-18a4 4 0 0 1 4-4z',
            }),
            i.createElement('path', { className: o.arrow, d: 'M5.5 10l-2 3.5 2 3.5' }),
          ),
        )
      }
      var De = o('ybOa')
      const Le = Object(ne.a)(ye, De),
        Oe = { hide: window.t('Hide Drawings Toolbar'), show: window.t('Show Drawings Toolbar') }
      class Me extends i.PureComponent {
        constructor() {
          super(...arguments),
            (this._toggleVisibility = () => {
              y.isDrawingToolbarVisible.setValue(!y.isDrawingToolbarVisible.value())
            })
        }
        render() {
          const { toolbarVisible: e, 'data-name': t } = this.props
          return i.createElement(
            'div',
            {
              className: r(Le.toggleButton, 'apply-common-tooltip common-tooltip-vertical', !e && Le.collapsed),
              onClick: this._toggleVisibility,
              title: e ? Oe.hide : Oe.show,
              'data-name': t,
              'data-value': e ? 'visible' : 'collapsed',
            },
            i.createElement(Ee, { direction: e ? 'left' : 'right', theme: e ? void 0 : Le }),
          )
        }
      }
      var Ne = o('mkWe'),
        Ae = o('uhCe'),
        Be = o('/KDZ')
      const je = { chartWidgetCollection: o('17x9').any.isRequired }
      var Ve = o('1TxM'),
        We = o('JQKp')
      const Pe = { weakMagnet: window.t('Weak Magnet'), strongMagnet: window.t('Strong Magnet') },
        Fe = Object(_.onWidget)(),
        xe = new v.a(),
        Ue = ie.trackEvent.bind(null, 'GUI', 'Chart Left Toolbar'),
        Ie = (e, t) => Ue(`${e} ${t ? 'on' : 'off'}`)
      function Re() {
        const e = !m.properties().childs().magnet.value()
        Ie('magnet mode', e),
          Object(J.saveDefaultProperties)(!0),
          m.properties().childs().magnet.setValue(e),
          Object(J.saveDefaultProperties)(!1)
      }
      function ze() {
        Object(ie.trackEvent)('GUI', 'Magnet mode', 'Weak'),
          Object(J.saveDefaultProperties)(!0),
          m.properties().childs().magnetMode.setValue(_e.MagnetMode.WeakMagnet),
          m.properties().childs().magnet.setValue(!0),
          Object(J.saveDefaultProperties)(!1)
      }
      function Ge() {
        Object(ie.trackEvent)('GUI', 'Magnet mode', 'Strong'),
          Object(J.saveDefaultProperties)(!0),
          m.properties().childs().magnetMode.setValue(_e.MagnetMode.StrongMagnet),
          m.properties().childs().magnet.setValue(!0),
          Object(J.saveDefaultProperties)(!1)
      }
      class He extends i.PureComponent {
        constructor(e) {
          var t
          super(e),
            (this._grayedTools = {}),
            (this._handleDrawingClick = e => {
              Ie('drawing mode', e)
            }),
            (this._handleLockClick = e => {
              Ie('lock all drawing', e)
            }),
            (this._handleSyncClick = e => {
              Ie('sync', e)
            }),
            (this._handleMouseOver = e => {
              Object(we.a)(e) && this.setState({ isHovered: !0 })
            }),
            (this._handleMouseOut = e => {
              Object(we.a)(e) && this.setState({ isHovered: !1 })
            }),
            (this._handleChangeVisibility = e => {
              this.setState({ isVisible: e })
            }),
            (this._handleEsc = () => {
              m.resetToCursor(!0)
            }),
            (this._updateMagnetEnabled = () => {
              const e = { magnet: Object(p.a)().value() }
              this.setState(e)
            }),
            (this._updateMagnetMode = () => {
              const e = { magnetMode: Object(p.b)().value() }
              this.setState(e)
            }),
            (this._handleWidgetbarSettled = e => {
              var t
              this.setState({
                isWidgetbarVisible: null === (t = window.widgetbar) || void 0 === t ? void 0 : t.visible().value(),
                widgetbarSettled: e,
              })
            }),
            (this._handleWidgetbarVisible = e => {
              this.setState({ isWidgetbarVisible: e })
            }),
            m.init(),
            (this._toolsFilter = new T(this.props.drawingsAccess)),
            (this._filteredLineTools = S.map(e => ({
              id: e.id,
              title: e.title,
              items: e.items.filter(e => this._toolsFilter.isToolEnabled(w.a[e.name].localizedName)),
            })).filter(e => 0 !== e.items.length)),
            this._filteredLineTools.forEach(e =>
              e.items.forEach(e => {
                this._grayedTools[e.name] = this._toolsFilter.isToolGrayed(w.a[e.name].localizedName)
              }),
            ),
            (this.state = {
              isHovered: !1,
              isVisible: y.isDrawingToolbarVisible.value(),
              isWidgetbarVisible: Boolean(
                null === (t = window.widgetbar) || void 0 === t ? void 0 : t.visible().value(),
              ),
              widgetbarSettled: void 0 !== window.widgetbar,
              magnet: m.properties().childs().magnet.value(),
              magnetMode: m.properties().childs().magnetMode.value(),
            }),
            (this._features = {
              favoriting: !Fe && u.enabled('items_favoriting'),
              multicharts: u.enabled('support_multicharts'),
              tools: !Fe || u.enabled('charting_library_base'),
            }),
            (this._registry = { chartWidgetCollection: this.props.chartWidgetCollection }),
            this._negotiateResizer()
        }
        componentDidMount() {
          var e
          y.isDrawingToolbarVisible.subscribe(this._handleChangeVisibility),
            B.a.subscribe(this, this._handleGlobalClose),
            Object(p.a)().subscribe(this._updateMagnetEnabled),
            Object(p.b)().subscribe(this._updateMagnetMode),
            (this._tool = m.tool.spawn()),
            this._tool.subscribe(this._updateHotkeys.bind(this)),
            this._initHotkeys(),
            this.props.widgetbarSettled &&
              (this.props.widgetbarSettled.subscribe(this, this._handleWidgetbarSettled),
              _.CheckMobile.any() &&
                (null === (e = window.widgetbar) ||
                  void 0 === e ||
                  e.visible().subscribe(this._handleWidgetbarVisible)))
        }
        componentWillUnmount() {
          var e
          null === (e = window.widgetbar) || void 0 === e || e.visible().unsubscribe(this._handleWidgetbarVisible),
            y.isDrawingToolbarVisible.unsubscribe(this._handleChangeVisibility),
            B.a.unsubscribe(this, this._handleGlobalClose),
            Object(p.a)().unsubscribe(this._updateMagnetEnabled),
            Object(p.b)().unsubscribe(this._updateMagnetMode),
            this._tool.destroy(),
            this._hotkeys.destroy()
        }
        componentDidUpdate(e, t) {
          var o
          const { isVisible: i, widgetbarSettled: n } = this.state
          i !== t.isVisible &&
            (b.emit('toggle_sidebar', !i),
            h.setValue('ChartDrawingToolbarWidget.visible', i),
            this._negotiateResizer()),
            t.widgetbarSettled !== n &&
              n &&
              _.CheckMobile.any() &&
              (null === (o = window.widgetbar) || void 0 === o || o.visible().subscribe(this._handleWidgetbarVisible))
        }
        render() {
          const { bgColor: e, chartWidgetCollection: t, readOnly: o } = this.props,
            { isHovered: n, isVisible: s, magnet: a, magnetMode: l } = this.state,
            c = { backgroundColor: e && '#' + e }
          let h
          h = i.createElement(Me, { toolbarVisible: s, 'data-name': 'toolbar-drawing-toggle-button' })
          const p = () => !!this._features.tools && !!u.enabled('show_object_tree')
          return i.createElement(
            Ve.a,
            { validation: je, value: this._registry },
            i.createElement(
              fe.a.Provider,
              { value: xe },
              i.createElement(
                Ne.b,
                null,
                i.createElement(Be.a, { rule: Ae.a.TabletSmall }, e =>
                  i.createElement(
                    'div',
                    {
                      id: 'drawing-toolbar',
                      className: r(We.drawingToolbar, { [We.isHidden]: !s }),
                      style: c,
                      onClick: this.props.onClick,
                      onContextMenu: Te.b,
                    },
                    i.createElement(
                      N,
                      {
                        onScroll: this._handleGlobalClose,
                        isVisibleFade: d.mobiletouch,
                        isVisibleButtons: !d.mobiletouch && n,
                        isVisibleScrollbar: !1,
                        onMouseOver: this._handleMouseOver,
                        onMouseOut: this._handleMouseOut,
                      },
                      i.createElement(
                        'div',
                        { className: We.inner },
                        !o &&
                          i.createElement(
                            'div',
                            { className: We.group, style: c },
                            this._filteredLineTools.map((o, n) =>
                              i.createElement(oe, {
                                'data-name': o.id,
                                chartWidgetCollection: t,
                                favoriting: this._features.favoriting,
                                grayedTools: this._grayedTools,
                                key: n,
                                dropdownTooltip: o.title,
                                lineTools: o.items,
                                isSmallTablet: e,
                              }),
                            ),
                            this._toolsFilter.isToolEnabled('Font Icons') &&
                              i.createElement(q, {
                                'data-name': 'linetool-group-font-icons',
                                isGrayed: this._grayedTools['Font Icons'],
                                toolName: 'LineToolIcon',
                                isSmallTablet: e,
                              }),
                          ),
                        !o &&
                          i.createElement(
                            'div',
                            { className: We.group, style: c },
                            i.createElement(Q, { toolName: 'measure' }),
                            i.createElement(Q, { toolName: 'zoom' }),
                            i.createElement(Z, { chartWidgetCollection: t }),
                          ),
                        !o &&
                          i.createElement(
                            'div',
                            { className: We.group, style: c },
                            i.createElement(
                              z,
                              {
                                'data-name': 'magnet-button',
                                buttonIcon: l === _e.MagnetMode.StrongMagnet ? ce.a.strongMagnet : ce.a.magnet,
                                buttonTitle: w.a.magnet.localizedName,
                                isActive: a,
                                onClickButton: Re,
                                buttonHotKey: w.a.magnet.hotKey,
                                checkable: !0,
                                isSmallTablet: e,
                              },
                              i.createElement(ee.b, {
                                key: 'weakMagnet',
                                className: e ? We.popupMenuItem : void 0,
                                'data-name': 'weakMagnet',
                                icon: ce.a.magnet,
                                isActive: a && l !== _e.MagnetMode.StrongMagnet,
                                label: Pe.weakMagnet,
                                onClick: ze,
                              }),
                              i.createElement(ee.b, {
                                key: 'strongMagnet',
                                className: e ? We.popupMenuItem : void 0,
                                'data-name': 'strongMagnet',
                                icon: ce.a.strongMagnet,
                                isActive: a && l === _e.MagnetMode.StrongMagnet,
                                label: Pe.strongMagnet,
                                onClick: Ge,
                              }),
                            ),
                            this._features.tools &&
                              i.createElement(Y, {
                                property: m.properties().childs().stayInDrawingMode,
                                saveDefaultOnChange: !0,
                                toolName: 'drawginmode',
                                onClick: this._handleDrawingClick,
                              }),
                            this._features.tools &&
                              i.createElement(Y, {
                                property: m.lockDrawings(),
                                toolName: 'lockAllDrawings',
                                onClick: this._handleLockClick,
                              }),
                            this._features.tools &&
                              i.createElement(de, {
                                isSmallTablet: e,
                                hideDrawingsProperty: m.hideAllDrawings(),
                                hideIndicatorsProperty: m.hideAllIndicators(),
                              }),
                            !1,
                          ),
                        !o &&
                          this._features.tools &&
                          i.createElement(
                            'div',
                            { className: We.group, style: c },
                            i.createElement(re, {
                              chartWidgetCollection: t,
                              isSmallTablet: e,
                              toolName: 'removeAllDrawingTools',
                            }),
                          ),
                        i.createElement('div', { className: We.fill, style: c }),
                        !o &&
                          (this._features.tools || !1) &&
                          i.createElement(
                            'div',
                            { className: r(We.group, We.lastGroup), style: c },
                            !1,
                            this._features.tools &&
                              this._features.favoriting &&
                              i.createElement(ge, { id: ve.FavoriteDrawings }),
                            p() &&
                              i.createElement(V, {
                                id: ve.ObjectTree,
                                action: () => this._activeChartWidget().showObjectsTreeDialog(),
                                toolName: 'showObjectsTree',
                              }),
                          ),
                      ),
                    ),
                    h,
                  ),
                ),
              ),
            ),
          )
        }
        _activeChartWidget() {
          return this.props.chartWidgetCollection.activeChartWidget.value()
        }
        _negotiateResizer() {
          const e = Ce.a
          this.props.resizerBridge.negotiateWidth(this.state.isVisible ? Ce.b : e)
        }
        _handleGlobalClose() {
          xe.fire()
        }
        _updateHotkeys() {
          this._hotkeys.promote()
        }
        _initHotkeys() {
          ;(this._hotkeys = A.createGroup({ desc: 'Drawing Toolbar' })),
            this._hotkeys.add({
              desc: 'Reset',
              hotkey: 27,
              handler: () => this._handleEsc(),
              isDisabled: () => m.toolIsCursor(m.tool.value()),
            })
        }
      }
      o.d(t, 'DrawingToolbarRenderer', function () {
        return Ke
      })
      class Ke {
        constructor(e, t) {
          ;(this._component = null),
            (this._handleRef = e => {
              this._component = e
            }),
            (this._container = e),
            s.render(i.createElement(He, { ...t, ref: this._handleRef }), this._container)
        }
        destroy() {
          s.unmountComponentAtNode(this._container)
        }
        getComponent() {
          return Object(a.ensureNotNull)(this._component)
        }
      }
    },
    '85c9': function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="19" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.103.687a1 1 0 0 1 1.794 0l2.374 4.81 5.309.772a1 1 0 0 1 .554 1.706l-3.841 3.745.906 5.287a1 1 0 0 1-1.45 1.054L10 15.565 5.252 18.06A1 1 0 0 1 3.8 17.007l.907-5.287L.866 7.975a1 1 0 0 1 .554-1.706l5.31-.771L9.102.688zM10 1.13L7.393 6.412l-5.829.847 4.218 4.111-.996 5.806L10 14.436l5.214 2.74-.996-5.805 4.218-4.112-5.83-.847L10 1.13z"/></svg>'
    },
    EA32: function (e, t, o) {
      e.exports = {
        wrap: 'wrap-2qy9YC6D',
        smallTablet: 'smallTablet-2qy9YC6D',
        buttonIcon: 'buttonIcon-2qy9YC6D',
        item: 'item-2qy9YC6D',
        hovered: 'hovered-2qy9YC6D',
        active: 'active-2qy9YC6D',
        title: 'title-2qy9YC6D',
        separator: 'separator-2qy9YC6D',
        button: 'button-2qy9YC6D',
      }
    },
    FTBN: function (e, t, o) {
      e.exports = { item: 'item-3NgvBqLJ', label: 'label-3NgvBqLJ' }
    },
    JQKp: function (e, t, o) {
      e.exports = {
        drawingToolbar: 'drawingToolbar-2_so5thS',
        isHidden: 'isHidden-2_so5thS',
        inner: 'inner-2_so5thS',
        popupMenuItem: 'popupMenuItem-2_so5thS',
        group: 'group-2_so5thS',
        noGroupPadding: 'noGroupPadding-2_so5thS',
        lastGroup: 'lastGroup-2_so5thS',
        fill: 'fill-2_so5thS',
        separator: 'separator-2_so5thS',
      }
    },
    KmEK: function (e, t, o) {
      e.exports = {
        dropdown: 'dropdown-191zO2Od',
        buttonWrap: 'buttonWrap-191zO2Od',
        control: 'control-191zO2Od',
        arrow: 'arrow-191zO2Od',
        arrowIcon: 'arrowIcon-191zO2Od',
        isOpened: 'isOpened-191zO2Od',
        hover: 'hover-191zO2Od',
        isGrayed: 'isGrayed-191zO2Od',
      }
    },
    R5JZ: function (e, t, o) {
      'use strict'
      function i(e, t, o, i, n) {
        function s(n) {
          if (e > n.timeStamp) return
          const s = n.target
          void 0 !== o && null !== t && null !== s && s.ownerDocument === i && (t.contains(s) || o(n))
        }
        return (
          n.click && i.addEventListener('click', s, !1),
          n.mouseDown && i.addEventListener('mousedown', s, !1),
          n.touchEnd && i.addEventListener('touchend', s, !1),
          n.touchStart && i.addEventListener('touchstart', s, !1),
          () => {
            i.removeEventListener('click', s, !1),
              i.removeEventListener('mousedown', s, !1),
              i.removeEventListener('touchend', s, !1),
              i.removeEventListener('touchstart', s, !1)
          }
        )
      }
      o.d(t, 'a', function () {
        return i
      })
    },
    Sn4D: function (e, t, o) {
      'use strict'
      o.d(t, 'a', function () {
        return p
      })
      var i = o('q1tI'),
        n = o.n(i),
        s = o('Eyy1'),
        a = o('TSYQ'),
        l = o('x0D+'),
        r = o('0YpW'),
        c = o('AiMB'),
        d = o('mkWe'),
        h = o('qFKp'),
        u = o('X0gx'),
        m = o('sHQ4')
      function p(e) {
        const { position: t = 'Bottom', onClose: o, children: p, className: b, theme: g = m } = e,
          v = Object(s.ensureNotNull)(Object(i.useContext)(d.a)),
          [_, w] = Object(i.useState)(0),
          T = Object(i.useRef)(null),
          C = Object(i.useContext)(u.a)
        return (
          Object(i.useEffect)(() => {
            const e = Object(s.ensureNotNull)(T.current)
            return (
              e.focus({ preventScroll: !0 }),
              C.subscribe(v, o),
              Object(r.a)(!0),
              h.CheckMobile.iOS() && Object(l.disableBodyScroll)(e),
              w(v.addDrawer()),
              () => {
                C.unsubscribe(v, o)
                const t = v.removeDrawer()
                h.CheckMobile.iOS() && Object(l.enableBodyScroll)(e), 0 === t && Object(r.a)(!1)
              }
            )
          }, []),
          n.a.createElement(
            c.a,
            null,
            n.a.createElement(
              'div',
              {
                className: a(m.wrap, m['position' + t]),
              },
              _ === v.currentDrawer && n.a.createElement('div', { className: m.backdrop, onClick: o }),
              n.a.createElement(
                'div',
                {
                  className: a(m.drawer, g.drawer, m['position' + t], b),
                  ref: T,
                  tabIndex: -1,
                  'data-name': e['data-name'],
                },
                p,
              ),
            ),
          )
        )
      }
    },
    Vike: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10" width="20" height="10"><path fill="none" stroke="currentColor" stroke-width="1.5" d="M2 1l8 8 8-8"/></svg>'
    },
    Wz44: function (e, t, o) {
      e.exports = {
        container: 'container-3CL4Geq2',
        mirror: 'mirror-3CL4Geq2',
        background: 'background-3CL4Geq2',
        arrow: 'arrow-3CL4Geq2',
      }
    },
    ijHL: function (e, t, o) {
      'use strict'
      function i(e) {
        return s(e, a)
      }
      function n(e) {
        return s(e, l)
      }
      function s(e, t) {
        const o = Object.entries(e).filter(t),
          i = {}
        for (const [e, t] of o) i[e] = t
        return i
      }
      function a(e) {
        const [t, o] = e
        return 0 === t.indexOf('data-') && 'string' == typeof o
      }
      function l(e) {
        return 0 === e[0].indexOf('aria-')
      }
      o.d(t, 'b', function () {
        return i
      }),
        o.d(t, 'a', function () {
          return n
        }),
        o.d(t, 'c', function () {
          return s
        }),
        o.d(t, 'e', function () {
          return a
        }),
        o.d(t, 'd', function () {
          return l
        })
    },
    mkWe: function (e, t, o) {
      'use strict'
      o.d(t, 'b', function () {
        return s
      }),
        o.d(t, 'a', function () {
          return a
        })
      var i = o('q1tI'),
        n = o.n(i)
      class s extends n.a.PureComponent {
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
          return n.a.createElement(
            a.Provider,
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
      const a = n.a.createContext(null)
    },
    sHQ4: function (e, t, o) {
      e.exports = {
        wrap: 'wrap-164vy-kj',
        positionBottom: 'positionBottom-164vy-kj',
        backdrop: 'backdrop-164vy-kj',
        drawer: 'drawer-164vy-kj',
        positionLeft: 'positionLeft-164vy-kj',
      }
    },
    uJ8n: function (e, t, o) {
      e.exports = {
        wrap: 'wrap-379NmUSU',
        scrollWrap: 'scrollWrap-379NmUSU',
        noScrollBar: 'noScrollBar-379NmUSU',
        content: 'content-379NmUSU',
        icon: 'icon-379NmUSU',
        scrollBot: 'scrollBot-379NmUSU',
        scrollTop: 'scrollTop-379NmUSU',
        isVisible: 'isVisible-379NmUSU',
        iconWrap: 'iconWrap-379NmUSU',
        fadeBot: 'fadeBot-379NmUSU',
        fadeTop: 'fadeTop-379NmUSU',
      }
    },
    ybOa: function (e, t, o) {
      e.exports = {
        toggleButton: 'toggleButton-3zv4iS2j',
        collapsed: 'collapsed-3zv4iS2j',
        background: 'background-3zv4iS2j',
        arrow: 'arrow-3zv4iS2j',
      }
    },
  },
])
