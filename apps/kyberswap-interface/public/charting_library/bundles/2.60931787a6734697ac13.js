;(window.webpackJsonp = window.webpackJsonp || []).push([
  [2],
  {
    RgaO: function (t, e, i) {
      'use strict'
      i.d(e, 'a', function () {
        return n
      })
      var s = i('8Rai')
      function n(t) {
        const { children: e, ...i } = t
        return e(Object(s.a)(i))
      }
    },
    WXjp: function (t, e, i) {
      'use strict'
      var s = i('q1tI'),
        n = i('TSYQ'),
        o = i('Eyy1'),
        a = i('+EG+'),
        r = i('jAh7'),
        h = i('ijHL'),
        l = i('aYmi')
      class d extends s.PureComponent {
        constructor() {
          super(...arguments),
            (this._manager = new r.a()),
            (this._handleSlot = t => {
              this._manager.setContainer(t)
            })
        }
        render() {
          const {
              rounded: t = !0,
              shadowed: e = !0,
              fullscreen: i = !1,
              darker: o = !1,
              className: r,
              backdrop: d,
            } = this.props,
            c = n(r, l.dialog, t && l.rounded, e && l.shadowed, i && l.fullscreen, o && l.darker),
            u = Object(h.b)(this.props),
            p = this.props.style ? { ...this._createStyles(), ...this.props.style } : this._createStyles()
          return s.createElement(
            s.Fragment,
            null,
            s.createElement(
              a.b.Provider,
              { value: this._manager },
              d && s.createElement('div', { onClick: this.props.onClickBackdrop, className: l.backdrop }),
              s.createElement(
                'div',
                {
                  ...u,
                  className: c,
                  style: p,
                  ref: this.props.reference,
                  onFocus: this.props.onFocus,
                  onMouseDown: this.props.onMouseDown,
                  onMouseUp: this.props.onMouseUp,
                  onClick: this.props.onClick,
                  onKeyDown: this.props.onKeyDown,
                  tabIndex: -1,
                },
                this.props.children,
              ),
            ),
            s.createElement(a.a, { reference: this._handleSlot }),
          )
        }
        _createStyles() {
          const { bottom: t, left: e, width: i, right: s, top: n, zIndex: o, height: a } = this.props
          return { bottom: t, left: e, right: s, top: n, zIndex: o, maxWidth: i, height: a }
        }
      }
      var c = i('uqKQ'),
        u = i('RgaO'),
        p = i('Hr11')
      function g(t, e, i, s) {
        return t + e > s && (t = s - e), t < i && (t = i), t
      }
      function _(t) {
        return {
          x: Object(p.clamp)(t.x, 20, document.documentElement.clientWidth - 20),
          y: Object(p.clamp)(t.y, 20, window.innerHeight - 20),
        }
      }
      function m(t) {
        return { x: t.clientX, y: t.clientY }
      }
      function f(t) {
        return { x: t.touches[0].clientX, y: t.touches[0].clientY }
      }
      class v {
        constructor(t, e, i = { boundByScreen: !0 }) {
          ;(this._drag = null),
            (this._canBeTouchClick = !1),
            (this._frame = null),
            (this._onMouseDragStart = t => {
              if (0 !== t.button) return
              t.preventDefault(),
                document.addEventListener('mousemove', this._onMouseDragMove),
                document.addEventListener('mouseup', this._onMouseDragEnd)
              const e = _(m(t))
              this._dragStart(e)
            }),
            (this._onTouchDragStart = t => {
              ;(this._canBeTouchClick = !0),
                t.preventDefault(),
                this._header.addEventListener('touchmove', this._onTouchDragMove, { passive: !1 })
              const e = _(f(t))
              this._dragStart(e)
            }),
            (this._onMouseDragEnd = t => {
              t.target instanceof Node && this._header.contains(t.target) && t.preventDefault(),
                document.removeEventListener('mousemove', this._onMouseDragMove),
                document.removeEventListener('mouseup', this._onMouseDragEnd),
                this._onDragStop()
            }),
            (this._onTouchDragEnd = t => {
              this._header.removeEventListener('touchmove', this._onTouchDragMove),
                this._onDragStop(),
                this._canBeTouchClick &&
                  ((this._canBeTouchClick = !1),
                  (function (t) {
                    if (t instanceof SVGElement) {
                      const e = document.createEvent('SVGEvents')
                      e.initEvent('click', !0, !0), t.dispatchEvent(e)
                    }
                    t instanceof HTMLElement && t.click()
                  })(t.target))
            }),
            (this._onMouseDragMove = t => {
              const e = _(m(t))
              this._dragMove(e)
            }),
            (this._onTouchDragMove = t => {
              ;(this._canBeTouchClick = !1), t.preventDefault()
              const e = _(f(t))
              this._dragMove(e)
            }),
            (this._onDragStop = () => {
              ;(this._drag = null), this._header.classList.remove('dragging')
            }),
            (this._dialog = t),
            (this._header = e),
            (this._options = i),
            this._header.addEventListener('mousedown', this._onMouseDragStart),
            this._header.addEventListener('touchstart', this._onTouchDragStart),
            this._header.addEventListener('touchend', this._onTouchDragEnd)
        }
        destroy() {
          null !== this._frame && cancelAnimationFrame(this._frame),
            this._header.removeEventListener('mousedown', this._onMouseDragStart),
            document.removeEventListener('mouseup', this._onMouseDragEnd),
            this._header.removeEventListener('touchstart', this._onTouchDragStart),
            this._header.removeEventListener('touchend', this._onTouchDragEnd),
            document.removeEventListener('mouseleave', this._onMouseDragEnd)
        }
        updateOptions(t) {
          this._options = t
        }
        _dragStart(t) {
          const e = this._dialog.getBoundingClientRect()
          this._drag = { startX: t.x, startY: t.y, finishX: t.x, finishY: t.y, dialogX: e.left, dialogY: e.top }
          const i = Math.round(e.left),
            s = Math.round(e.top)
          ;(this._dialog.style.transform = `translate(${i}px, ${s}px)`), this._header.classList.add('dragging')
        }
        _dragMove(t) {
          if (this._drag) {
            if (((this._drag.finishX = t.x), (this._drag.finishY = t.y), null !== this._frame)) return
            this._frame = requestAnimationFrame(() => {
              if (this._drag) {
                const e = t.x - this._drag.startX,
                  i = t.y - this._drag.startY
                this._moveDialog(this._drag.dialogX + e, this._drag.dialogY + i)
              }
              this._frame = null
            })
          }
        }
        _moveDialog(t, e) {
          const i = this._dialog.getBoundingClientRect(),
            { boundByScreen: s } = this._options,
            n = g(t, i.width, s ? 0 : -1 / 0, s ? window.innerWidth : 1 / 0),
            o = g(e, i.height, s ? 0 : -1 / 0, s ? window.innerHeight : 1 / 0)
          this._dialog.style.transform = `translate(${Math.round(n)}px, ${Math.round(o)}px)`
        }
      }
      class y {
        constructor(t, e = { vertical: 0 }) {
          ;(this._frame = null),
            (this._isFullscreen = !1),
            (this._handleResize = () => {
              null === this._frame &&
                (this._frame = requestAnimationFrame(() => {
                  this.recalculateBounds(), (this._frame = null)
                }))
            }),
            (this._dialog = t),
            (this._options = e),
            (this._initialHeight = t.style.height),
            window.addEventListener('resize', this._handleResize)
        }
        updateOptions(t = { vertical: 0 }) {
          this._options = t
        }
        setFullscreen(t) {
          this._isFullscreen !== t && ((this._isFullscreen = t), this.recalculateBounds())
        }
        centerAndFit() {
          const { x: t, y: e } = this.getDialogsTopLeftCoordinates(),
            i = this._calcAvailableHeight(),
            s = this._calcDialogHeight()
          i === s && (this._dialog.style.height = s + 'px'),
            (this._dialog.style.top = '0px'),
            (this._dialog.style.left = '0px'),
            (this._dialog.style.transform = `translate(${t}px, ${e}px)`)
        }
        getDialogsTopLeftCoordinates() {
          const { clientHeight: t, clientWidth: e } = document.documentElement,
            i = this._calcDialogHeight(),
            s = e / 2 - this._dialog.clientWidth / 2,
            n = t / 2 - i / 2
          return { x: Math.round(s), y: Math.round(n) }
        }
        recalculateBounds() {
          this._dialog.style.height = 'auto'
          const { clientHeight: t, clientWidth: e } = document.documentElement
          if (this._isFullscreen)
            (this._dialog.style.top = '0px'),
              (this._dialog.style.left = '0px'),
              (this._dialog.style.width = e + 'px'),
              (this._dialog.style.height = t + 'px'),
              (this._dialog.style.transform = 'none')
          else {
            const { vertical: i } = this._options
            ;(this._dialog.style.width = ''), (this._dialog.style.height = '')
            const s = this._dialog.getBoundingClientRect(),
              n = t - 2 * i,
              o = g(s.left, s.width, 0, e),
              a = g(s.top, s.height, i, t)
            ;(this._dialog.style.top = '0px'),
              (this._dialog.style.left = '0px'),
              (this._dialog.style.transform = `translate(${Math.round(o)}px, ${Math.round(a)}px)`),
              (this._dialog.style.height = n < s.height ? n + 'px' : this._initialHeight)
          }
        }
        destroy() {
          window.removeEventListener('resize', this._handleResize),
            null !== this._frame && (cancelAnimationFrame(this._frame), (this._frame = null))
        }
        _calcDialogHeight() {
          const t = this._calcAvailableHeight()
          return t < this._dialog.clientHeight ? t : this._dialog.clientHeight
        }
        _calcAvailableHeight() {
          return document.documentElement.clientHeight - 2 * this._options.vertical
        }
      }
      var E = i('AiMB'),
        x = i('pafz'),
        M = i('0YpW'),
        w = i('ZzSk')
      i.d(e, 'a', function () {
        return S
      })
      w['tooltip-offset']
      class D extends s.PureComponent {
        constructor(t) {
          super(t),
            (this._dialog = null),
            (this._handleDialogRef = t => {
              const { reference: e } = this.props
              ;(this._dialog = t), 'function' == typeof e && e(t)
            }),
            (this._handleFocus = t => {
              this._moveToTop()
            }),
            (this._handleMouseDown = t => {
              this._moveToTop()
            }),
            (this._handleTouchStart = t => {
              this._moveToTop()
            }),
            (this.state = { canFitTooltip: !1 })
        }
        render() {
          return s.createElement(
            x.a.Provider,
            { value: this },
            s.createElement(u.a, { mouseDown: !0, touchStart: !0, handler: this.props.onClickOutside }, t =>
              s.createElement(
                'div',
                {
                  ref: t,
                  'data-outside-boundary-for': this.props.name,
                  onFocus: this._handleFocus,
                  onMouseDown: this._handleMouseDown,
                  onTouchStart: this._handleTouchStart,
                  'data-dialog-name': this.props['data-dialog-name'],
                },
                s.createElement(
                  d,
                  {
                    style: this._applyAnimationCSSVariables(),
                    ...this.props,
                    reference: this._handleDialogRef,
                    className: n(w.dialog, this.props.className),
                  },
                  !1,
                  this.props.children,
                ),
              ),
            ),
          )
        }
        componentDidMount() {
          const t = Object(o.ensureNotNull)(this._dialog)
          if (this.props.draggable) {
            const e = t.querySelector('[data-dragg-area]')
            e &&
              e instanceof HTMLElement &&
              (this._drag = new v(t, e, { boundByScreen: Boolean(this.props.boundByScreen) }))
          }
          this.props.autofocus && !t.contains(document.activeElement) && t.focus(),
            (this._isFullScreen() || this.props.fixedBody) && Object(M.a)(!0),
            (this._resize = new y(t, this.props.guard)),
            this.props.isAnimationEnabled &&
              this.props.growPoint &&
              this._applyAppearanceAnimation(this.props.growPoint),
            this.props.centeredOnMount && this._resize.centerAndFit(),
            this._resize.setFullscreen(this._isFullScreen()),
            this.props.shouldForceFocus && t.focus()
        }
        componentDidUpdate() {
          this._resize &&
            (this._resize.updateOptions(this.props.guard), this._resize.setFullscreen(this._isFullScreen())),
            this._drag && this._drag.updateOptions({ boundByScreen: Boolean(this.props.boundByScreen) })
        }
        componentWillUnmount() {
          this._drag && this._drag.destroy(),
            this._resize && this._resize.destroy(),
            (this._isFullScreen() || this.props.fixedBody) && Object(M.a)(!1)
        }
        focus() {
          this._dialog && this._dialog.focus()
        }
        centerAndFit() {
          this._resize && this._resize.centerAndFit()
        }
        recalculateBounds() {
          this._resize && this._resize.recalculateBounds()
        }
        _moveToTop() {
          null !== this.context && this.context.moveToTop()
        }
        _applyAnimationCSSVariables() {
          return {
            '--animationTranslateStartX': null,
            '--animationTranslateStartY': null,
            '--animationTranslateEndX': null,
            '--animationTranslateEndY': null,
          }
        }
        _applyAppearanceAnimation(t) {
          if (this._resize && this._dialog) {
            const { x: e, y: i } = t,
              { x: s, y: n } = this._resize.getDialogsTopLeftCoordinates()
            this._dialog.style.setProperty('--animationTranslateStartX', e + 'px'),
              this._dialog.style.setProperty('--animationTranslateStartY', i + 'px'),
              this._dialog.style.setProperty('--animationTranslateEndX', s + 'px'),
              this._dialog.style.setProperty('--animationTranslateEndY', n + 'px'),
              this._dialog.classList.add(w.dialogAnimatedAppearance)
          }
        }
        _handleTooltipFit() {
          0
        }
        _isFullScreen() {
          return Boolean(this.props.fullscreen)
        }
      }
      ;(D.contextType = E.b), (D.defaultProps = { boundByScreen: !0, draggable: !0, centeredOnMount: !0 })
      const S = Object(c.a)(D)
    },
    ZzSk: function (t, e, i) {
      t.exports = {
        'tablet-normal-breakpoint': 'screen and (max-width: 768px)',
        'tooltip-offset': '20px',
        dialog: 'dialog-2AogBbC7',
        dragging: 'dragging-2AogBbC7',
        dialogAnimatedAppearance: 'dialogAnimatedAppearance-2AogBbC7',
        dialogAnimation: 'dialogAnimation-2AogBbC7',
        dialogTooltip: 'dialogTooltip-2AogBbC7',
      }
    },
    aYmi: function (t, e, i) {
      t.exports = {
        dialog: 'dialog-UM6w7sFp',
        rounded: 'rounded-UM6w7sFp',
        shadowed: 'shadowed-UM6w7sFp',
        fullscreen: 'fullscreen-UM6w7sFp',
        darker: 'darker-UM6w7sFp',
        backdrop: 'backdrop-UM6w7sFp',
      }
    },
    pafz: function (t, e, i) {
      'use strict'
      i.d(e, 'a', function () {
        return n
      })
      var s = i('q1tI')
      const n = s.createContext(null)
    },
    uqKQ: function (t, e, i) {
      'use strict'
      i.d(e, 'a', function () {
        return o
      })
      var s = i('q1tI'),
        n = i('AiMB')
      function o(t) {
        return class extends s.PureComponent {
          render() {
            const { isOpened: e, root: i } = this.props
            if (!e) return null
            const o = s.createElement(t, { ...this.props, zIndex: 150 })
            return 'parent' === i ? o : s.createElement(n.a, null, o)
          }
        }
      }
    },
  },
])
