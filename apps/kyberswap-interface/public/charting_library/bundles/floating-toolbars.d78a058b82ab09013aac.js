;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['floating-toolbars'],
  {
    '+KIV': function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"><path stroke="currentColor" d="M8 9.5H6.5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V20m-8-1.5h11a1 1 0 0 0 1-1v-11a1 1 0 0 0-1-1h-11a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1z"/></svg>'
    },
    '0ZwQ': function (t, e, i) {
      'use strict'
      var o = i('8+VR'),
        n = i('9uLv'),
        s = i('Vdly'),
        r = i('aIyQ'),
        a = i.n(r),
        l = i('hY0g'),
        c = i.n(l),
        d = i('cZRT')
      class h extends d.a {
        _startLoading() {
          return i
            .e('hammerjs')
            .then(i.bind(null, 'be1f'))
            .then(t => t.HammerJS)
        }
      }
      var u = i('VVxS')
      i('Eyy1')
      function p(t, e = !1) {
        const i = getComputedStyle(t),
          o = [i.height]
        return (
          'border-box' !== i.boxSizing && o.push(i.paddingTop, i.paddingBottom, i.borderTopWidth, i.borderBottomWidth),
          e && o.push(i.marginTop, i.marginBottom),
          o.reduce((t, e) => t + (parseFloat(e) || 0), 0)
        )
      }
      function g(t, e = !1) {
        const i = getComputedStyle(t),
          o = [i.width]
        return (
          'border-box' !== i.boxSizing && o.push(i.paddingLeft, i.paddingRight, i.borderLeftWidth, i.borderRightWidth),
          e && o.push(i.marginLeft, i.marginRight),
          o.reduce((t, e) => t + (parseFloat(e) || 0), 0)
        )
      }
      var _ = i('qFKp')
      class m {
        constructor(t) {
          var e, i
          ;(this._helper = null),
            (this._handleDragStart = t => {
              var e
              if (null !== this._helper) return
              if (!(t.target instanceof Element && this._handle.contains(t.target))) return
              const i = this._source
              i.classList.add('ui-draggable-dragging')
              const o = this._getEventTarget()
              o.addEventListener('pointermove', this._handleDragMove),
                o.addEventListener('pointerup', this._handleDragStop),
                o.addEventListener('pointercancel', this._handleDragStop),
                o.setPointerCapture(t.pointerId)
              const [n, s] = [g(i), p(i)]
              ;(this._helper = {
                pointer: t.pointerId,
                startX: t.clientX,
                startY: t.clientY,
                startTop: parseFloat(i.style.top) || 0,
                startLeft: parseFloat(i.style.left) || 0,
                nextTop: null,
                nextLeft: null,
                raf: null,
                size: [n, s],
                containment:
                  this._containment instanceof HTMLElement
                    ? [
                        parseInt(getComputedStyle(this._containment).borderLeftWidth) +
                          parseInt(getComputedStyle(this._containment).paddingLeft),
                        parseInt(getComputedStyle(this._containment).borderTopWidth) +
                          parseInt(getComputedStyle(this._containment).paddingTop),
                        this._containment.offsetWidth -
                          parseInt(getComputedStyle(this._containment).borderRightWidth) -
                          parseInt(getComputedStyle(this._containment).paddingRight) -
                          parseInt(getComputedStyle(i).marginLeft) -
                          parseInt(getComputedStyle(i).marginRight) -
                          n,
                        this._containment.offsetHeight -
                          parseInt(getComputedStyle(this._containment).borderBottomWidth) -
                          parseInt(getComputedStyle(this._containment).paddingBottom) -
                          parseInt(getComputedStyle(i).marginTop) -
                          parseInt(getComputedStyle(i).marginBottom) -
                          s,
                      ]
                    : 'window' === this._containment
                    ? [
                        window.scrollX,
                        window.scrollY,
                        window.scrollX + document.documentElement.offsetWidth - n,
                        window.scrollY + document.documentElement.offsetHeight - s,
                      ]
                    : null,
              }),
                null === (e = this._start) || void 0 === e || e.call(this)
            }),
            (this._handleDragMove = t => {
              var e
              if (null === this._helper || this._helper.pointer !== t.pointerId) return
              const i = this._source,
                o = this._helper.nextTop,
                n = this._helper.nextLeft,
                s = 'y' === this._axis || !1 === this._axis || 0 !== t.movementY
              if (s) {
                const e = this._helper.startTop
                isFinite(e) && (this._helper.nextTop = t.clientY - this._helper.startY + e)
              }
              const r = 'x' === this._axis || !1 === this._axis || 0 !== t.movementX
              if (r) {
                const e = this._helper.startLeft
                isFinite(e) && (this._helper.nextLeft = t.clientX - this._helper.startX + e)
              }
              if (null !== this._helper.containment) {
                const [t, e, i, o] = this._helper.containment
                s &&
                  this._helper.nextTop &&
                  ((this._helper.nextTop = Math.min(this._helper.nextTop, o)),
                  (this._helper.nextTop = Math.max(this._helper.nextTop, e))),
                  r &&
                    this._helper.nextLeft &&
                    ((this._helper.nextLeft = Math.min(this._helper.nextLeft, i)),
                    (this._helper.nextLeft = Math.max(this._helper.nextLeft, t)))
              }
              null !== this._helper.raf ||
                (o === this._helper.nextTop && n === this._helper.nextLeft) ||
                (this._helper.raf = requestAnimationFrame(() => {
                  null !== this._helper &&
                    (null !== this._helper.nextTop &&
                      ((i.style.top = this._helper.nextTop + 'px'), (this._helper.nextTop = null)),
                    null !== this._helper.nextLeft &&
                      ((i.style.left = this._helper.nextLeft + 'px'), (this._helper.nextLeft = null)),
                    (this._helper.raf = null))
                })),
                null === (e = this._drag) || void 0 === e || e.call(this)
            }),
            (this._handleDragStop = t => {
              var e
              if (null === this._helper || this._helper.pointer !== t.pointerId) return
              this._source.classList.remove('ui-draggable-dragging')
              const i = this._getEventTarget()
              i.removeEventListener('pointermove', this._handleDragMove),
                i.removeEventListener('pointerup', this._handleDragStop),
                i.removeEventListener('pointercancel', this._handleDragStop),
                i.releasePointerCapture(this._helper.pointer),
                (this._helper = null),
                null === (e = this._stop) || void 0 === e || e.call(this)
            })
          const o = (this._source = t.source)
          o.classList.add('ui-draggable')
          const n = (this._handle = null !== (e = t.handle ? o.querySelector(t.handle) : null) && void 0 !== e ? e : o)
          ;(n.style.touchAction = 'none'), n.classList.add('ui-draggable-handle')
          this._getEventTarget().addEventListener('pointerdown', this._handleDragStart),
            (this._start = t.start),
            (this._stop = t.stop),
            (this._drag = t.drag),
            (this._axis = null !== (i = t.axis) && void 0 !== i && i),
            (this._containment = t.containment)
        }
        destroy() {
          const t = this._source
          t.classList.remove('ui-draggable'), t.classList.remove('ui-draggable-dragging')
          this._handle.style.touchAction = ''
          const e = this._getEventTarget()
          e.removeEventListener('pointerdown', this._handleDragStart),
            e.removeEventListener('pointermove', this._handleDragMove),
            e.removeEventListener('pointerup', this._handleDragStop),
            e.removeEventListener('pointercancel', this._handleDragStop),
            null !== this._helper &&
              (this._helper.raf && cancelAnimationFrame(this._helper.raf),
              e.releasePointerCapture(this._helper.pointer),
              (this._helper = null))
        }
        _getEventTarget() {
          return _.CheckMobile.iOS() || (Object(_.isMac)() && o.touch) ? window.document.documentElement : this._handle
        }
      }
      var b = i('gWrr'),
        v = i('JWMC'),
        w = i('qAO1')
      i('PwLo')
      i.d(e, 'a', function () {
        return f
      }),
        i.d(e, 'b', function () {
          return C
        })
      const f = 'floating-toolbar-react-widgets',
        y = `<div class="tv-floating-toolbar i-closed i-hidden"><div class="tv-floating-toolbar__widget-wrapper"><div class="tv-floating-toolbar__drag js-drag">${w}</div><div class="tv-floating-toolbar__content js-content"></div><div class="${f}"></div></div></div>`
      class C {
        constructor(t) {
          ;(this._widget = document.createElement('div')),
            (this._isVertical = !1),
            (this._hiddingTimeoutId = null),
            (this._visibility = new c.a(!1)),
            (this._windowResizeListener = this._onWindowResize.bind(this)),
            (this._reorderedDelegate = new a.a()),
            (this._responsiveResizeFunction = null),
            (this._showTimeStamp = null),
            (this._draggable = null),
            (this._preventClickUntilAnimation = t => {
              null !== this._showTimeStamp &&
                performance.now() - this._showTimeStamp < this.hideDuration() &&
                t.stopPropagation()
            }),
            C._toolbars.push(this),
            (this._options = t),
            (this._widget = Object(b.b)(y)),
            (this._content = this._widget.getElementsByClassName('js-content').item(0)),
            (this._reactWidgetsContainer = this._widget.getElementsByClassName(f).item(0)),
            this._setZIndex(C._startZIndex + C._toolbars.length - 1),
            this._options.addClass && (this._widget.className += ' ' + this._options.addClass),
            this._options['data-name'] && (this._widget.dataset.name = this._options['data-name']),
            this._options.layout &&
              'auto' !== this._options.layout &&
              ((this._isVertical = 'vertical' === this._options.layout),
              this._updateLayoutType(),
              this._updateAxisOption()),
            this._widget.addEventListener('click', this._preventClickUntilAnimation, !0)
        }
        destroy() {
          this.hide(!0),
            C._toolbars.splice(C._toolbars.indexOf(this), 1),
            this._widget.removeEventListener('click', this._preventClickUntilAnimation, !0),
            document.body.contains(this._widget) && document.body.removeChild(this._widget),
            null !== this._draggable && this._draggable.destroy(),
            (this._widget.innerHTML = ''),
            (this._responsiveResizeFunction = null)
        }
        setResponsiveResizeFunc(t) {
          this._responsiveResizeFunction = t
        }
        isVisible() {
          return this._visibility.value()
        }
        visibility() {
          return this._visibility.readonly()
        }
        isVertical() {
          return this._isVertical
        }
        show() {
          this.isVisible() ||
            (document.body.contains(this._widget) || (this._init(), document.body.appendChild(this._widget)),
            this._setHiddingTimeout(null),
            window.addEventListener('resize', this._windowResizeListener),
            this.raise(),
            this._visibility.setValue(!0),
            (this._showTimeStamp = performance.now()),
            this._widget.classList.contains('i-hidden')
              ? (this._widget.classList.remove('i-hidden'),
                setTimeout(() => {
                  this.isVisible() && this._widget.classList.remove('i-closed')
                }))
              : this._widget.classList.remove('i-closed'),
            this._onWindowResize())
        }
        hide(t = !1) {
          if (!this.isVisible()) return
          const e = this._widget.classList.contains('i-closed')
          if ((this._widget.classList.add('i-closed'), this._visibility.setValue(!1), t || e))
            this._setHiddingTimeout(null), this._widget.classList.add('i-hidden')
          else {
            const t = setTimeout(() => {
              this._setHiddingTimeout(null), this._widget.classList.add('i-hidden')
            }, this.hideDuration())
            this._setHiddingTimeout(t)
          }
          window.removeEventListener('resize', this._windowResizeListener)
        }
        raise() {
          C._toolbars.length + C._startZIndex !== this._zIndex() &&
            (C._toolbars.splice(C._toolbars.indexOf(this), 1), C._toolbars.push(this), C._updateAllZIndexes())
        }
        hideDuration() {
          return 0.75 * n.b
        }
        addWidget(t, e = {}) {
          const i = this.widgetsCount()
          if ((void 0 === e.index && (e.index = i), e.index < 0 || e.index > i))
            throw new Error(`Index must be in [0, ${i}]`)
          const o = document.createElement('div')
          ;(o.className = 'tv-floating-toolbar__widget js-widget'), o.appendChild(t)
          const n = e.index === i ? null : this._content.childNodes.item(e.index)
          this._content.insertBefore(o, n), this._onWindowResize()
        }
        getReactWidgetContainer() {
          return this._reactWidgetsContainer
        }
        removeWidget(t) {
          const e = this._findWrapperForWidget(t)
          e && (this._content.removeChild(e), this._onWindowResize())
        }
        widgetsCount() {
          return this._content.childNodes.length
        }
        showWidget(t) {
          const e = this._findWrapperForWidget(t)
          e && e.classList.remove('i-hidden')
        }
        hideWidget(t) {
          const e = this._findWrapperForWidget(t)
          e && e.classList.add('i-hidden')
        }
        removeWidgets() {
          for (; this._content.firstChild; ) this._content.removeChild(this._content.firstChild)
          this._onWindowResize()
        }
        onWidgetsReordered() {
          return this._reorderedDelegate
        }
        onContextMenu(t) {
          if (o.mobiletouch) {
            new h().load().then(e => {
              const i = new e(this._widget)
              i.get('press').set({ time: 500 }),
                i.on('press', e => {
                  this._preventWidgetTouchEndEvent(), t(e.srcEvent)
                })
            })
          } else this._widget.addEventListener('contextmenu', t)
        }
        checkPosition() {
          const t = this._getCorrectedWidgetRect(),
            e = { left: t.left, top: t.top }
          this._correctPosition(e),
            (t.left === e.left && t.top === e.top) ||
              ((this._widget.style.left = e.left + 'px'), (this._widget.style.top = e.top + 'px'))
        }
        _determineCurrentLayoutVertical(t) {
          const e = this._isVertical ? t.height : t.width
          return window.innerWidth < e && window.innerWidth < window.innerHeight
        }
        _getWidget() {
          return this._widget
        }
        _findWrapperForWidget(t) {
          const e = this._content.getElementsByClassName('js-widget')
          for (let i = 0; i < e.length; ++i) {
            const o = e.item(i)
            if (o.contains(t)) return o
          }
          return null
        }
        _onVerticalChanged(t, e) {}
        _setHiddingTimeout(t) {
          null !== this._hiddingTimeoutId && clearTimeout(this._hiddingTimeoutId), (this._hiddingTimeoutId = t)
        }
        _preventWidgetTouchEndEvent() {
          const t = e => {
            e.preventDefault(), this._widget.removeEventListener('touchend', t)
          }
          this._widget.addEventListener('touchend', t)
        }
        _updateLayoutType() {
          this._widget.classList.toggle('i-vertical', this._isVertical)
        }
        _updateAxisOption() {
          0
        }
        _onWindowResize() {
          if ('auto' === (this._options.layout || 'auto')) {
            const t = this._isVertical,
              e = this._getCorrectedWidgetRect()
            ;(this._isVertical = this._determineCurrentLayoutVertical(e)),
              this._updateLayoutType(),
              t !== this._isVertical && (this._onVerticalChanged(this._isVertical, t), this._updateAxisOption())
          }
          this.checkPosition(), this._resizeResponsive()
        }
        _resizeResponsive() {
          if (null === this._responsiveResizeFunction) return
          let t = this._options.layout || 'auto'
          'auto' === t && (t = this._isVertical ? 'vertical' : 'horizontal')
          const e = 'vertical' === t ? this._widget.clientHeight : this._widget.clientWidth,
            i = ('vertical' === t ? window.innerHeight : window.innerWidth) - e
          this._responsiveResizeFunction(e, i, t)
        }
        _correctPosition(t) {
          const e = this._getCorrectedWidgetRect()
          t.left + e.width > window.innerWidth && (t.left = Math.max(0, window.innerWidth - e.width)),
            t.top + e.height > window.innerHeight && (t.top = Math.max(0, window.innerHeight - e.height)),
            (t.left = Math.max(0, t.left)),
            (t.top = Math.max(0, t.top))
        }
        _setZIndex(t) {
          this._widget.style.zIndex = String(t)
        }
        _zIndex() {
          return Number(this._widget.style.zIndex)
        }
        _loadPosition() {
          let t
          if ('device' === this._options.positionStorageType) {
            const e = u.TVLocalStorage.getItem(this._options.positionSettingsKey)
            t = null !== e ? JSON.parse(e) : this._options.defaultPosition
          } else t = Object(s.getJSON)(this._options.positionSettingsKey, this._options.defaultPosition)
          ;(this._widget.style.left = Math.round(t.left) + 'px'),
            (this._widget.style.top = Math.round(t.top) + 'px'),
            this._onWindowResize()
        }
        _savePosition() {
          const t = this._widget.getBoundingClientRect()
          if ('device' === this._options.positionStorageType)
            try {
              u.TVLocalStorage.setItem(this._options.positionSettingsKey, JSON.stringify({ left: t.left, top: t.top }))
            } catch (t) {}
          else Object(s.setJSON)(this._options.positionSettingsKey, { left: t.left, top: t.top })
        }
        _init() {
          this._loadPosition(),
            (this._draggable = new m({
              source: this._widget,
              containment: 'window',
              handle: '.js-drag',
              stop: this._savePosition.bind(this),
            })),
            this._widget.addEventListener('pointerdown', this.raise.bind(this))
        }
        _initSortable() {
          let t = -1
          lazyJqueryUI(this._content).sortable({
            start: (e, i) => {
              t = i.item.index()
            },
            stop: (e, i) => {
              const o = i.item.index()
              t !== o && (Object(v.trackEvent)('Floating Toolbar', 'User Sort'), this._reorderedDelegate.fire(t, o))
            },
            tolerance: 'pointer',
            distance: 5,
            containment: !!this._options.dragOnlyInsideToolbar && 'parent',
            scroll: !1,
            placeholder: 'sortable-placeholder',
            forcePlaceholderSize: !0,
          }),
            this._updateAxisOption()
        }
        _getCorrectedWidgetRect() {
          const t = this._widget.getBoundingClientRect()
          if (this._widget.classList.contains('i-closed')) {
            const e = 1 / 0.925 - 1,
              i = t.width * e,
              o = t.height * e
            return {
              bottom: t.bottom + o / 2,
              height: t.height + o,
              left: t.left - i / 2,
              right: t.right + i / 2,
              top: t.top - o / 2,
              width: t.width + i,
            }
          }
          return t
        }
        static _updateAllZIndexes() {
          C._toolbars.forEach((t, e) => {
            t._setZIndex(C._startZIndex + e)
          })
        }
      }
      ;(C._startZIndex = 20), (C._toolbars = [])
    },
    '0fuu': function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="none"><path stroke="currentColor" d="M13.5 6.5l-3-3-7 7 7.59 7.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82L13.5 6.5zm0 0v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6"/><path fill="currentColor" d="M0 16.5C0 15 2.5 12 2.5 12S5 15 5 16.5 4 19 2.5 19 0 18 0 16.5z"/><circle fill="currentColor" cx="9.5" cy="9.5" r="1.5"/></svg>'
    },
    '2F1E': function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 4" width="18" height="4"><rect width="18" height="4" fill="currentColor" rx="2"/></svg>'
    },
    '4QAy': function (t, e, i) {},
    '5hRh': function (t, e, i) {
      'use strict'
      i.d(e, 'a', function () {
        return n
      })
      var o = i('q1tI')
      const n = t => {
        const [e, i] = Object(o.useState)(t.value())
        return (
          Object(o.useEffect)(() => {
            const e = t => {
              i(t.value())
            }
            e(t)
            const o = {}
            return t.subscribe(o, e), () => t.unsubscribe(o, e)
          }, [t]),
          e
        )
      }
    },
    ADFN: function (t, e, i) {},
    EvtC: function (t, e, i) {
      t.exports = { button: 'button-2YcRd2gv' }
    },
    HWhk: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M7.5 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM5 14.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0zm9.5-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 14.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0zm9.5-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM19 14.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0z"/></svg>'
    },
    IhRv: function (t, e, i) {
      'use strict'
      i.r(e),
        i.d(e, 'ColorPickerButton', function () {
          return b
        })
      var o = i('q1tI'),
        n = i.n(o),
        s = i('TSYQ'),
        r = i.n(s),
        a = i('Eyy1'),
        l = i('Iivm'),
        c = i('eJTA'),
        d = i('Tmoa'),
        h = i('V3OP'),
        u = i('htM8'),
        p = i('wLjq'),
        g = i('82wv'),
        _ = i('5hRh'),
        m = i('X1vi')
      function b(t) {
        const { property: e, icon: i, model: s, title: b, className: v } = t,
          w = Object(_.a)(e),
          f = Object(o.useRef)(null),
          y = w ? Object(c.parseRgba)(w)[3] : void 0,
          C = '' === w,
          x = String(T()).toLowerCase() === p.c,
          [W, P, S] = Object(h.a)()
        return n.a.createElement(
          g.a,
          {
            className: v,
            content: n.a.createElement(
              'div',
              { className: m.wrap },
              n.a.createElement(l.a, { className: m.icon, icon: i }),
              n.a.createElement(
                'div',
                { className: m.colorBg },
                n.a.createElement('div', {
                  className: r()(m.color, C && m.multicolor, x && m.white),
                  style: C ? void 0 : { backgroundColor: w },
                }),
              ),
            ),
            arrow: !1,
            title: b,
            ref: f,
            'data-name': t['data-name'],
            menuDataName: t['data-name'] + '-menu',
          },
          n.a.createElement(u.a, {
            color: T(),
            opacity: y,
            onColorChange: function (t, e) {
              const i = w ? Object(d.alphaToTransparency)(Object(c.parseRgba)(w)[3]) : 0
              L(Object(d['generateColor'])(String(t), i, true)), e || Object(a.ensureNotNull)(f.current).close()
            },
            onOpacityChange: function (t) {
              L(Object(d.generateColor)(w, Object(d.alphaToTransparency)(t), !0))
            },
            selectOpacity: void 0 !== y,
            selectCustom: !0,
            customColors: W,
            onAddColor: function (t) {
              P(t), Object(a.ensureNotNull)(f.current).close()
            },
            onRemoveCustomColor: S,
          }),
        )
        function T() {
          return w ? Object(c.rgbToHexString)(Object(c.parseRgb)(w)) : null
        }
        function L(t) {
          s.setProperty(e, t, b)
        }
      }
    },
    Lnv9: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="currentColor"><rect width="18" height="2" rx="1" x="5" y="14"/><rect width="18" height="1" rx=".5" x="5" y="20"/><rect width="18" height="3" rx="1.5" x="5" y="7"/></svg>'
    },
    O5Oz: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 1" width="18" height="1"><rect width="18" height="1" fill="currentColor" rx=".5"/></svg>'
    },
    PwLo: function (t, e, i) {},
    SAe1: function (t, e, i) {
      'use strict'
      i.d(e, 'a', function () {
        return r
      })
      var o = i('q1tI'),
        n = i('rzV7'),
        s = i.n(n)
      class r extends o.Component {
        constructor(t) {
          super(t),
            (this._handleMediaChange = () => {
              const t = l(this.state.queries, (t, e) => e.matches)
              let e = !1
              for (const i in t)
                if (t.hasOwnProperty(i) && this.state.matches[i] !== t[i]) {
                  e = !0
                  break
                }
              e && this.setState({ matches: t })
            })
          const { rules: e } = this.props
          this.state = a(e)
        }
        shouldComponentUpdate(t, e) {
          return !s()(t, this.props) || !s()(e.rules, this.state.rules) || !s()(e.matches, this.state.matches)
        }
        componentDidMount() {
          this._migrate(null, this.state.queries)
        }
        componentDidUpdate(t, e) {
          s()(t.rules, this.props.rules) || this._migrate(e.queries, this.state.queries)
        }
        componentWillUnmount() {
          this._migrate(this.state.queries, null)
        }
        render() {
          return this.props.children(this.state.matches)
        }
        static getDerivedStateFromProps(t, e) {
          if (s()(t.rules, e.rules)) return null
          const { rules: i } = t
          return a(i)
        }
        _migrate(t, e) {
          null !== t &&
            l(t, (t, e) => {
              e.removeListener(this._handleMediaChange)
            }),
            null !== e &&
              l(e, (t, e) => {
                e.addListener(this._handleMediaChange)
              })
        }
      }
      function a(t) {
        const e = l(t, (t, e) => window.matchMedia(e))
        return { queries: e, matches: l(e, (t, e) => e.matches), rules: { ...t } }
      }
      function l(t, e) {
        const i = {}
        for (const o in t) t.hasOwnProperty(o) && (i[o] = e(o, t[o]))
        return i
      }
    },
    UXdH: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path fill="currentColor" d="M4 13h5v1H4v-1zM12 13h5v1h-5v-1zM20 13h5v1h-5v-1z"/></svg>'
    },
    Ve4Q: function (t, e, i) {
      'use strict'
      i.r(e)
      var o = i('q1tI'),
        n = i.n(o),
        s = i('i8i4'),
        r = i.n(s),
        a = i('YFKU'),
        l = i('Kxc7'),
        c = i('hY0g'),
        d = i.n(c),
        h = i('ogJP'),
        u = i('CW80'),
        p = i('mMWL'),
        g = i('j3hX'),
        _ = i('Eyy1'),
        m = i('tc+8'),
        b = i.n(m)
      class v extends b.a {
        constructor(t, e, i) {
          super(),
            (this._listenersMappers = []),
            (this._isProcess = !1),
            (this._baseProperty = t),
            (this._undoModel = e),
            (this._undoText = i)
        }
        destroy() {
          this._baseProperty.destroy()
        }
        value() {
          return this._baseProperty.value()
        }
        setValue(t) {
          ;(this._isProcess = !0),
            this._baseProperty.setValue(t, void 0, {
              applyValue: (t, e) => this._undoModel.setProperty(t, e, this._undoText),
            }),
            (this._isProcess = !1),
            this._listenersMappers.forEach(t => {
              t.method.call(t.obj, this)
            })
        }
        subscribe(t, e) {
          const i = i => {
              this._isProcess || e.call(t, this)
            },
            o = { obj: t, method: e, callback: i }
          this._listenersMappers.push(o), this._baseProperty.subscribe(t, i)
        }
        unsubscribe(t, e) {
          var i
          const o = Object(_.ensureDefined)(
            null === (i = this._listenersMappers.find(i => i.obj === t && i.method === e)) || void 0 === i
              ? void 0
              : i.callback,
          )
          this._baseProperty.unsubscribe(t, o)
        }
        unsubscribeAll(t) {
          this._baseProperty.unsubscribeAll(t)
        }
      }
      var w = i('turx'),
        f = i('SAe1'),
        y = i('0ZwQ'),
        C = i('uhCe')
      const x = y.a + '__button'
      function W(t) {
        const {
            templateButton: e,
            propertyButtons: i,
            commonButtons: o,
            isDrawingFinished: s,
            activeChartWidget: r,
          } = t,
          a = r.hasModel() && r.model().selection().dataSources()
        return a && a.length
          ? n.a.createElement(
              f.a,
              { rules: { isSmallWidth: C.a.TabletSmall, isSmallHeight: 'screen and (max-height: 428px)' } },
              ({ isSmallWidth: t, isSmallHeight: e }) =>
                n.a.createElement(
                  n.a.Fragment,
                  null,
                  l(),
                  s &&
                    n.a.createElement(
                      n.a.Fragment,
                      null,
                      Boolean(i.length) &&
                        i.map((i, o) =>
                          n.a.createElement(i.component, {
                            ...i.props,
                            key: `${i.props.title}_${o}`,
                            className: x,
                            isSmallScreen: t || e,
                          }),
                        ),
                      Boolean(o.length) &&
                        o.map((i, o) => {
                          const s = t || e
                          return s
                            ? i.showForSmallScreen
                              ? n.a.createElement(i.component, {
                                  ...i.props,
                                  isSmallScreen: s,
                                  key: `${i.props.title}_${o}`,
                                  className: x,
                                })
                              : null
                            : n.a.createElement(i.component, { ...i.props, key: `${i.props.title}_${o}`, className: x })
                        }),
                    ),
                ),
            )
          : l()
        function l() {
          return null === e ? null : n.a.createElement(e.component, { ...e.props, isDrawingFinished: s, className: x })
        }
      }
      var P = i('JWMC'),
        S = i('p0W+'),
        T = i('Xxuz')
      function L(t) {
        const { title: e, activeChartWidget: i, className: o } = t
        return n.a.createElement(S.a, {
          className: o,
          icon: T,
          title: e,
          onClick: function () {
            Object(P.trackEvent)('GUI', 'Context action on drawings', 'Settings'),
              i.showChartPropertiesForSource(i.model().selection().lineDataSources()[0], void 0, {
                onWidget: i.onWidget(),
              })
          },
          'data-name': 'settings',
        })
      }
      var E = i('5hRh'),
        B = i('TSYQ'),
        k = i('4rU7'),
        O = i('ucyy')
      function V(t) {
        const { className: e, ...i } = t
        return n.a.createElement(k.a, { className: B(e, O.button), tooltipPosition: 'horizontal', ...i })
      }
      var I = i('43BO'),
        M = i('Uh5y')
      function R(t) {
        const { activeChartWidget: e, className: i } = t,
          o = e.model().selection().lineDataSources()[0].properties().frozen,
          s = Object(E.a)(o),
          r = s
            ? {
                title: Object(a.t)('Unlock'),
                icon: I,
              }
            : { title: Object(a.t)('Lock'), icon: M }
        return n.a.createElement(V, {
          className: i,
          isActive: Boolean(s),
          onClick: function () {
            Object(P.trackEvent)('GUI', 'Context action on drawings', 'Lock'), e.toggleLockSelectedObject()
          },
          'data-name': Boolean(s) ? 'unlock' : 'lock',
          ...r,
        })
      }
      var N = i('aVjL')
      function j(t) {
        const { title: e, activeChartWidget: i, className: o } = t
        return n.a.createElement(S.a, {
          className: o,
          icon: N,
          title: e,
          'data-name': 'remove',
          onClick: function () {
            Object(P.trackEvent)('GUI', 'Context action on drawings', 'Remove'), i.removeSelectedSources()
          },
        })
      }
      var F = i('Iivm'),
        A = i('8+VR'),
        D = i('/3z9'),
        z = i('lxNp'),
        H = i('82wv'),
        U = i('IAAr'),
        G = i('7KDR'),
        Q = i('ycI/'),
        q = i('5VQP'),
        K = i('HZKX'),
        Y = i('HWhk'),
        Z = i('9dnG'),
        $ = i('dmHa')
      function X(t) {
        const { title: e, activeChartWidget: s, isSmallScreen: r, className: l } = t,
          c = s.model(),
          d = c.selection().lineDataSources(),
          [h, u] = Object(o.useState)([]),
          p = Object(o.useRef)(null),
          g = Object(o.useMemo)(() => new K.ActionsProvider(s), [s])
        return n.a.createElement(
          n.a.Fragment,
          null,
          n.a.createElement(Q.a, {
            keyCode: 27,
            eventType: 'keyup',
            handler: function () {
              Object(_.ensureNotNull)(p.current).close()
            },
          }),
          n.a.createElement(
            H.a,
            {
              className: l,
              ref: p,
              arrow: !1,
              onOpen: r
                ? void 0
                : function () {
                    const t = [
                        new G.Action({
                          label: Object(a.t)('Visual order'),
                          icon: Z,
                          subItems: m(),
                          name: 'visual-order',
                        }),
                      ],
                      e = (function () {
                        const t = [],
                          e = D.isMacKeyboard ? ' +' : '',
                          o = d.filter(t => t.cloneable())
                        o.length > 0 &&
                          t.push(
                            new G.Action({
                              name: 'clone',
                              icon: i('+KIV'),
                              shortcutHint: D.humanReadableModifiers(z.Modifiers.Mod) + e + ' Drag',
                              label: Object(a.t)('Clone'),
                              onExecute: () => {
                                c.cloneLineTools(o, !1),
                                  Object(P.trackEvent)('GUI', 'Context action on drawings', 'Clone')
                              },
                            }),
                          )
                        const n = d.filter(t => t.copiable())
                        if (n.length > 0) {
                          const i = {
                            name: 'copy',
                            label: Object(a.t)('Copy'),
                            shortcutHint: D.humanReadableModifiers(z.Modifiers.Mod) + e + ' C',
                            onExecute: () => {
                              s.chartWidgetCollection().clipboard.uiRequestCopy(n)
                            },
                          }
                          t.push(new G.Action(i, 'Copy'))
                        }
                        if (
                          !(function () {
                            if (!(null == s ? void 0 : s.isMultipleLayout())) return !1
                            return d.some(t => t.isSynchronizable())
                          })()
                        )
                          return t
                        d.filter(t => !!t.linkKey().value()).length
                          ? t.push(
                              new G.Action({
                                name: 'stop-sync',
                                label: Object(a.t)('Stop syncing'),
                                onExecute: () => {
                                  c.unlinkLines && c.unlinkLines(d)
                                },
                              }),
                            )
                          : t.push(
                              new G.Action({
                                name: 'sync',
                                label: Object(a.t)('Sync to all charts'),
                                onExecute: () => {
                                  c.copyToOtherCharts(d)
                                },
                              }),
                            )
                        return t
                      })()
                    e.length && t.push(new G.Separator(), ...e)
                    t.push(
                      new G.Separator(),
                      new G.Action({
                        label: Object(a.t)('Hide'),
                        icon: $,
                        onExecute: () => {
                          s.hideSelectedObject()
                        },
                        name: 'hide',
                      }),
                    ),
                      u(J(t))
                  },
              onClick: r
                ? function (t) {
                    g.contextMenuActionsForSources(d).then(e => {
                      window.matchMedia(C.a.TabletSmall).matches
                        ? q.ContextMenuManager.createMenu(J(e), { mode: 'drawer', 'data-name': 'more-menu' }).then(e =>
                            e.show(t),
                          )
                        : u(J(e))
                    })
                  }
                : void 0,
              title: e,
              content: n.a.createElement(F.a, { icon: Y }),
              'data-name': 'more',
              menuDataName: 'more-menu',
            },
            n.a.createElement(U.a, { parentIsOpened: !0, items: h }),
          ),
        )
        function m() {
          const t = [],
            e = c.availableZOrderOperations(d),
            i = new G.Action({
              name: 'bring-to-front',
              label: Object(a.t)('Bring to Front'),
              onExecute: () => {
                c.bringToFront(d)
              },
              disabled: 1 === d.length && !e.bringToFrontEnabled,
            }),
            o = new G.Action({
              name: 'send-to-back',
              label: Object(a.t)('Send to Back'),
              onExecute: () => {
                c.sendToBack(d)
              },
              disabled: 1 === d.length && !e.sendToBackEnabled,
            }),
            n = new G.Action({
              name: 'bring-forward',
              label: Object(a.t)('Bring Forward'),
              onExecute: () => {
                c.bringForward(d)
              },
              disabled: 1 === d.length && !e.bringForwardEnabled,
            }),
            s = new G.Action({
              name: 'send-backward',
              label: Object(a.t)('Send Backward'),
              onExecute: () => {
                c.sendBackward(d)
              },
              disabled: 1 === d.length && !e.sendBackwardEnabled,
            })
          return t.push(i, o, n, s), t
        }
      }
      function J(t) {
        return A.touch && !window.matchMedia('(pointer:fine)').matches ? t.filter(t => 'Copy' !== t.id) : t
      }
      var tt = i('972a'),
        et = i('bQEj'),
        it = i('UXdH'),
        ot = i('ZSM+')
      function nt(t) {
        const { property: e, model: i, title: s, className: r } = t,
          l = Object(E.a)(e),
          c = Object(o.useMemo)(
            () => [
              new G.Action({
                icon: et,
                label: Object(a.t)('Line'),
                active: tt.b.Solid === l,
                onExecute: () => i.setProperty(e, tt.b.Solid, s),
              }),
              new G.Action({
                icon: it,
                label: Object(a.t)('Dashed line'),
                active: tt.b.Dashed === l,
                onExecute: () => i.setProperty(e, tt.b.Dashed, s),
              }),
              new G.Action({
                icon: ot,
                label: Object(a.t)('Dotted line'),
                active: tt.b.Dotted === l,
                onExecute: () => i.setProperty(e, tt.b.Dotted, s),
              }),
            ],
            [i, e, l],
          )
        return n.a.createElement(
          H.a,
          {
            className: r,
            arrow: !1,
            content: n.a.createElement(F.a, { icon: st(l) }),
            title: s,
            'data-name': t['data-name'],
            menuDataName: t['data-name'] + '-menu',
          },
          n.a.createElement(U.a, { items: c }),
        )
      }
      function st(t) {
        switch (t) {
          case tt.b.Solid:
            return et
          case tt.b.Dashed:
            return it
          case tt.b.Dotted:
            return ot
          default:
            return ''
        }
      }
      const rt = [10, 11, 12, 14, 16, 20, 24, 28, 32, 40]
      function at(t) {
        const { property: e, model: i, title: o, className: s } = t,
          r = Object(E.a)(e),
          a = rt.map(
            t => new G.Action({ label: t.toString(), onExecute: () => i.setProperty(e, t, o), active: t === r }),
          )
        return n.a.createElement(
          H.a,
          {
            arrow: !1,
            content: r,
            className: s,
            title: o,
            'data-name': t['data-name'],
            menuDataName: t['data-name'] + '-menu',
          },
          n.a.createElement(U.a, { items: a }),
        )
      }
      var lt = i('aIyQ'),
        ct = i.n(lt)
      i('m/4m'), i('ADFN')
      class dt extends y.b {
        constructor(t) {
          super(dt._prepareOptions(t)),
            (this._onWidgetStateChangedDelegate = new ct.a()),
            (this._statedWidgets = []),
            (this._currentPopup = null),
            (this._onWindowClickedListener = this._onWindowClicked.bind(this))
        }
        show() {
          super.show(), document.addEventListener('mousedown', this._onWindowClickedListener)
        }
        hide(t) {
          super.hide(t), document.removeEventListener('mousedown', this._onWindowClickedListener)
        }
        destroy() {
          this._closePopup(), super.destroy()
        }
        addGroupedWidget(t, e = {}) {
          Object(_.assert)(
            t.states.length > 0 && -1 !== dt._getStateIndexById(t, t.currentStateId),
            `Argument is invalid (count: ${t.states.length}, state: ${t.currentStateId})`,
          )
          const i = document.createElement('div')
          ;(i.className = 'tv-grouped-floating-toolbar__widget-wrapper apply-common-tooltip'),
            t.widgetAddClass && i.classList.add(t.widgetAddClass),
            i.setAttribute('title', t.tooltip)
          const o = { isEnabled: !0, statedWidget: t, toolbarWidget: i },
            n = this._onWidgetClicked.bind(this, o)
          ;(o.clickListener = n),
            i.addEventListener('click', n),
            this._updateWidgetPreview(o),
            this.addWidget(i, e),
            this._statedWidgets.push(o)
        }
        findGroupedWidget(t) {
          const e = this._statedWidgets.length
          for (let i = 0; i < e; ++i) {
            if (this._statedWidgets[i].statedWidget.id === t) return i
          }
          return -1
        }
        removeGroupedWidget(t) {
          const e = this._statedWidgets.length
          for (let i = 0; i < e; ++i) {
            const e = this._statedWidgets[i]
            if (e.statedWidget.id === t)
              return (
                this._isPopupCreatedForWidget(t) && this._closePopup(),
                void 0 !== e.clickListener && e.toolbarWidget.removeEventListener('click', e.clickListener),
                this.removeWidget(e.toolbarWidget),
                this._statedWidgets.splice(i, 1),
                void this._updatePopupPosition()
              )
          }
          Object(_.assert)(!1, `Unknown groupId(${t})`)
        }
        updateGroupedWidget(t, e) {
          this._closePopup()
          const i = this._ensuredGetWidgetDataForId(t)
          ;(i.statedWidget.currentStateId = e.currentStateId),
            (i.statedWidget.states = e.states),
            this._updateWidgetPreview(i)
        }
        setGroupedWidgetEnabled(t, e) {
          const i = this._ensuredGetWidgetDataForId(t)
          ;(i.isEnabled = e), i.toolbarWidget.classList.toggle('i-disabled', !e)
        }
        setGroupedWidgetState(t, e) {
          const i = this._ensuredGetWidgetDataForId(t)
          Object(_.assert)(-1 !== dt._getStateIndexById(i.statedWidget, e), `Unknown stateId (${e})`),
            (i.statedWidget.currentStateId = e),
            this._updateSubWidgetsState(i.statedWidget),
            this._updateWidgetPreview(i)
        }
        onWidgetStateChanged() {
          return this._onWidgetStateChangedDelegate
        }
        _onVerticalChanged(t, e) {
          this._updatePopupPosition()
        }
        _ensuredGetWidgetDataForId(t) {
          for (const e of this._statedWidgets) if (e.statedWidget.id === t) return e
          throw new Error(`Unknown groupId(${t})`)
        }
        _onWidgetClicked(t, e) {
          const i = this._currentPopup && this._isPopupCreatedForWidget(t.statedWidget.id)
          this._closePopup(), !i && t.isEnabled && this._createPopup(t)
        }
        _createPopup(t) {
          const e = {
            createdFor: t.toolbarWidget,
            element: document.createElement('div'),
            stateWidgetId: t.statedWidget.id,
            widgets: [],
          }
          e.element.className += 'tv-grouped-floating-toolbar__popup js-popup'
          const i = t.statedWidget.states.length
          t.statedWidget.states.forEach((o, n) => {
            const s = this._createSubWidget(t, o),
              r = this._onSubWidgetClicked.bind(this, t, o.id)
            s.addEventListener('click', r),
              e.widgets.push({ clickListener: r, stateWidget: o, widget: s }),
              s.classList.add('tv-grouped-floating-toolbar__sub-widget--slide-right-' + n),
              s.classList.add('tv-grouped-floating-toolbar__sub-widget--slide-left-' + (i - n + 1)),
              o.readonly || e.element.appendChild(s)
          }),
            (this._currentPopup = e),
            this._updateSubWidgetsState(t.statedWidget),
            t.toolbarWidget.classList.add('i-dropped'),
            this._getWidget().appendChild(this._currentPopup.element),
            Promise.resolve().then(() => {
              this._currentPopup && this._currentPopup.element.classList.add('i-opened')
            }),
            this._updatePopupPosition()
        }
        _closePopup() {
          if (
            (this._statedWidgets.forEach(t => {
              t.toolbarWidget.classList.remove('i-dropped')
            }),
            !this._currentPopup)
          )
            return
          const t = this._currentPopup.widgets,
            e = this._currentPopup.element
          ;(this._currentPopup = null),
            t.forEach(t => {
              t.widget.removeEventListener('click', t.clickListener)
            }),
            e.classList.remove('i-opened'),
            e.addEventListener('transitionend', t => {
              t.target === e && this._getWidget().removeChild(e)
            })
        }
        _updateWidgetPreview(t) {
          const e = dt._getStateIndexById(t.statedWidget, t.statedWidget.currentStateId)
          Object(_.assert)(-1 !== e, 'Unknown state id: ' + t.statedWidget.currentStateId)
          const i = t.statedWidget.states[e].widget.cloneNode(!0)
          t.toolbarWidget.firstChild
            ? t.toolbarWidget.replaceChild(i, t.toolbarWidget.firstChild)
            : (t.toolbarWidget.appendChild(i), t.toolbarWidget.appendChild(dt._createCaret()))
        }
        _updateSubWidgetsState(t) {
          this._currentPopup &&
            this._isPopupCreatedForWidget(t.id) &&
            this._currentPopup.widgets.forEach(e => {
              e.widget.classList.toggle(dt._activeSubWidgetClass, e.stateWidget.id === t.currentStateId)
            })
        }
        _updatePopupPosition() {
          if (!this._currentPopup) return
          const t = this._currentPopup.createdFor,
            e = this._getWidget().getBoundingClientRect(),
            i = this._findWrapperForWidget(t)
          if (!i || !this._currentPopup)
            throw new Error("Toolbar has no wrapper for preview's widget or there is no popup")
          const o = i.getBoundingClientRect(),
            n = this._currentPopup.element.getBoundingClientRect(),
            s = this._currentPopup.element
          if (this.isVertical())
            s.classList.remove('tv-grouped-floating-toolbar__popup--at-top'),
              (s.style.top = o.top - e.top + 1 + 'px'),
              (s.style.left = ''),
              e.left > window.innerWidth - e.right
                ? s.classList.add('tv-grouped-floating-toolbar__popup--at-left')
                : s.classList.remove('tv-grouped-floating-toolbar__popup--at-left')
          else {
            s.classList.remove('tv-grouped-floating-toolbar__popup--at-left')
            let t = 0
            o.left + n.width > window.innerWidth
              ? e.left + n.width > window.innerWidth && (t = e.width - n.width)
              : (t = o.left - e.left + 1),
              (s.style.left = t + 'px'),
              e.bottom + n.height > window.innerHeight
                ? s.classList.add('tv-grouped-floating-toolbar__popup--at-top')
                : (s.classList.remove('tv-grouped-floating-toolbar__popup--at-top'), (s.style.top = ''))
          }
        }
        _isPopupCreatedForWidget(t) {
          return Boolean(this._currentPopup && this._currentPopup.stateWidgetId === t)
        }
        _createSubWidget(t, e) {
          const i = document.createElement('div')
          return (
            (i.className += 'tv-grouped-floating-toolbar__sub-widget'),
            t.statedWidget.stateWidgetAddClass && i.classList.add(t.statedWidget.stateWidgetAddClass),
            i.appendChild(e.widget),
            i
          )
        }
        _onSubWidgetClicked(t, e) {
          this._closePopup(),
            t.statedWidget.currentStateId !== e &&
              (this.setGroupedWidgetState(t.statedWidget.id, e),
              this._onWidgetStateChangedDelegate.fire(t.statedWidget.id, e))
        }
        _onWindowClicked(t) {
          if (this.isVisible() && this._currentPopup && !dt._isEventInElement(t, this._currentPopup.element)) {
            for (let e = 0; e < this._statedWidgets.length; ++e)
              if (dt._isEventInElement(t, this._statedWidgets[e].toolbarWidget)) return
            this._closePopup()
          }
        }
        static _getStateIndexById(t, e) {
          for (let i = 0; i < t.states.length; ++i) if (t.states[i].id === e) return i
          return -1
        }
        static _createCaret() {
          const t = document.createElement('div')
          return (t.className = 'tv-caret tv-caret--small tv-caret--colored tv-grouped-floating-toolbar__caret'), t
        }
        static _prepareOptions(t) {
          return (
            t.addClass ? (t.addClass += ' tv-grouped-floating-toolbar') : (t.addClass = ' tv-grouped-floating-toolbar'),
            t
          )
        }
        static _isEventInElement(t, e) {
          return t.target === e || e.contains(t.target)
        }
      }
      dt._activeSubWidgetClass = 'tv-grouped-floating-toolbar__sub-widget--current'
      var ht = i('yMne'),
        ut = i('GxN8')
      i.d(e, 'LineToolPropertiesWidgetBase', function () {
        return pt
      })
      class pt {
        constructor(t) {
          ;(this._isDrawingFinished = new d.a(!0)),
            (this._currentTool = null),
            (this._updateVisibilityTimeout = null),
            (this._lineWidthsProperty = null),
            (this._lineColorsProperty = null),
            (this._currentProperties = null),
            (this._container = null),
            (this._toolbarRendered = !1),
            (this._templatesButton = null),
            (this._propertyButtons = []),
            (this._commonButtons = []),
            (this._handleSourceEdit = t => {
              p.isDirectionalMovementActive.value() ||
                (t ? this._floatingToolbar.hide(!0) : this._toolbarRendered && this._floatingToolbar.show())
            }),
            (this._chartWidgetCollection = t),
            (this._floatingToolbar = new dt({
              defaultPosition: { top: ht.b + 15, left: window.innerWidth / 2 },
              positionSettingsKey: 'properties_toolbar.position',
              positionStorageType: 'device',
              layout: 'horizontal',
              'data-name': 'drawing-toolbar',
            })),
            (this._container = this._floatingToolbar.getReactWidgetContainer()),
            p.isToolMovingNow.subscribe(this._handleSourceEdit),
            p.isToolEditingNow.subscribe(this._handleSourceEdit)
        }
        activeChartWidget() {
          return this._chartWidgetCollection.activeChartWidget.value()
        }
        selectedSources() {
          return this._chartWidgetCollection.selectedSources.value()
        }
        hide() {
          this._updateVisibilityTimeout && clearTimeout(this._updateVisibilityTimeout),
            (this._updateVisibilityTimeout = setTimeout(() => {
              Object(u.unsetNewToolProperties)(),
                this._floatingToolbar.hide(!0),
                this._isToolbarRendered() && this._unmountToolbar(),
                this._clearProperties(),
                this._clearCommonButtons()
            }, 0))
        }
        _clearProperties() {
          this._clearPropertyButtons(),
            this._lineWidthsProperty && (this._lineWidthsProperty.destroy(), (this._lineWidthsProperty = null)),
            this._lineColorsProperty && (this._lineColorsProperty.destroy(), (this._lineColorsProperty = null)),
            this._currentProperties && (this._currentProperties = null)
        }
        _show() {
          this._updateVisibilityTimeout && clearTimeout(this._updateVisibilityTimeout),
            (this._updateVisibilityTimeout = setTimeout(() => {
              this._renderToolbar(), this._floatingToolbar.show(), this._floatingToolbar.checkPosition()
            }, 0))
        }
        _addPropertyButton(t) {
          this._propertyButtons.push(t), this._renderToolbar()
        }
        _addCommonButton(t) {
          this._commonButtons.push(t), this._renderToolbar()
        }
        _addTemplatesButton(t) {
          this._templatesButton = t
        }
        _renderToolbar() {
          null !== this._container &&
            this.activeChartWidget() &&
            this.activeChartWidget().hasModel() &&
            (r.a.render(
              n.a.createElement(W, {
                templateButton: this._templatesButton,
                propertyButtons: this._propertyButtons,
                commonButtons: this._commonButtons,
                isDrawingFinished: this._isDrawingFinished.value(),
                activeChartWidget: this.activeChartWidget(),
              }),
              this._container,
            ),
            (this._toolbarRendered = !0))
        }
        _unmountToolbar() {
          null !== this._container && (r.a.unmountComponentAtNode(this._container), (this._toolbarRendered = !1))
        }
        _clearTemplatesButton() {
          this._templatesButton = null
        }
        _clearPropertyButtons() {
          this._propertyButtons = []
        }
        _clearCommonButtons() {
          this._commonButtons = []
        }
        _isToolbarRendered() {
          return this._toolbarRendered
        }
        _createSettingsButton() {
          if (this.selectedSources().length > 1) return
          const t = {
            component: L,
            props: { title: Object(a.t)('Settings'), activeChartWidget: this.activeChartWidget() },
          }
          this._addCommonButton(t)
        }
        _createLockButton() {
          const t = { component: R, props: { title: 'Lock', activeChartWidget: this.activeChartWidget() } }
          this._addCommonButton(t)
        }
        _createRemoveButton() {
          const t = {
            component: j,
            props: { title: Object(a.t)('Remove'), activeChartWidget: this.activeChartWidget() },
            showForSmallScreen: !0,
          }
          this._addCommonButton(t)
        }
        _createDotsButton() {
          this._addCommonButton({
            component: X,
            props: { title: Object(a.t)('More'), activeChartWidget: this.activeChartWidget() },
            showForSmallScreen: !0,
          })
        }
        _createAlertButton() {}
        _createSourceActions() {
          this._createLockButton()
        }
        _createLineStyleButton(t) {
          const e = this.selectedSources()
          if (0 === e.length) return !1
          const i = e[0]
          if (!Object(ut.a)(i)) return !1
          const o = {
            component: nt,
            props: {
              property: i.properties().linestyle || t,
              title: Object(a.t)('Style'),
              model: this.activeChartWidget().model(),
              'data-name': 'style',
            },
          }
          return this._addPropertyButton(o), !0
        }
        _createFontSizeButton(t) {
          const e = this.selectedSources()
          if (0 === e.length) return !1
          const i = e[0]
          if (!Object(ut.a)(i)) return !1
          const o = {
            component: at,
            props: {
              property: i.properties().fontsize || t,
              title: Object(a.t)('Font Size'),
              model: this.activeChartWidget().model(),
              'data-name': 'font-size',
            },
          }
          return this._addPropertyButton(o), !0
        }
        _createCommonButtons() {
          this._commonButtons.length && this._clearCommonButtons(),
            l.enabled('property_pages') && this._createSettingsButton(),
            this._createSourceActions(),
            this._createRemoveButton(),
            this._createDotsButton()
        }
        _prepareProperties(t) {
          const e = this.selectedSources().filter(e => Object(u.isLineTool)(e) && e.properties()[t])
          if (!(e.filter(e => e.properties()[t].visible()).length < 1))
            return e.map(e => e.properties()[t]).filter(h.notNull)
        }
        _createProperty(t, e, i, o) {
          if (e) {
            const t = this._prepareProperties(i)
            if (!t) return
            const e = this.activeChartWidget().model()
            return this._isWidthProperty(t[0])
              ? new v(new g.MultipleLineWidthsProperty(t), e, o)
              : new w.b(new g.MultipleLineColorsProperty(t), e, o)
          }
          if (t && t.visible())
            return this._isWidthProperty(t)
              ? new g.MultipleLineWidthsProperty([t])
              : new w.a(new g.MultipleLineColorsProperty([t]))
        }
        _shouldShowBackgroundProperty(t, e) {
          return !e || !e.fillBackground || !!e.fillBackground.value()
        }
        _isDrawingToolExcludingTweet(t) {
          return Boolean(null == t ? void 0 : t.toLowerCase().includes('linetool')) && 'LineToolTweet' !== t
        }
        _isWidthProperty(t) {
          return t instanceof g.LineToolWidthsProperty
        }
      }
    },
    'W0/v': function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" width="17" height="17" fill="none"><path stroke="currentColor" d="M1.5 11.5l-.7.7a1 1 0 0 0-.3.71v3.59h3.59a1 1 0 0 0 .7-.3l.71-.7m-4-4l9-9m-9 9l2 2m2 2l9-9m-9 9l-2-2m11-7l1.3-1.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0l-1.3 1.3m4 4l-4-4m-7 11l9-9"/></svg>'
    },
    X1vi: function (t, e, i) {
      t.exports = {
        wrap: 'wrap-2EG6_6QR',
        icon: 'icon-2EG6_6QR',
        colorBg: 'colorBg-2EG6_6QR',
        color: 'color-2EG6_6QR',
        multicolor: 'multicolor-2EG6_6QR',
        white: 'white-2EG6_6QR',
      }
    },
    Xxuz: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none"><path fill="currentcolor" fill-rule="evenodd" clip-rule="evenodd" d="M13 5.5c0-.28.22-.5.5-.5h1c.28 0 .5.22.5.5V7.05l.4.09c.9.18 1.73.53 2.46 1.02l.34.23.29-.3.81-.8c.2-.2.52-.2.71 0l.7.7.36-.35-.35.35c.2.2.2.51 0 .7l-.82.82-.29.29.23.34c.49.73.84 1.57 1.02 2.46l.08.4H22.5c.28 0 .5.22.5.5v1a.5.5 0 0 1-.5.5H20.95l-.09.4c-.18.9-.53 1.73-1.02 2.46l-.23.34.3.29.8.81c.2.2.2.52 0 .71l-.7.7a.5.5 0 0 1-.7 0l-.82-.8-.29-.3-.34.23c-.73.49-1.57.84-2.46 1.02l-.4.08V22.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V20.95l-.4-.09a6.96 6.96 0 0 1-2.46-1.02l-.34-.23-.29.3-.81.8.35.36-.35-.35a.5.5 0 0 1-.71 0l-.7-.71a.5.5 0 0 1 0-.7l-.36-.36.35.35.82-.81.29-.29-.23-.34a6.96 6.96 0 0 1-1.02-2.46l-.08-.4H5.5a.5.5 0 0 1-.5-.5v-1c0-.28.22-.5.5-.5H7.05l.09-.4c.18-.9.53-1.73 1.02-2.46l.23-.34-.3-.29-.8-.81a.5.5 0 0 1 0-.71l.7-.7c.2-.2.51-.2.7 0l.82.8.29.3.34-.23a6.96 6.96 0 0 1 2.46-1.02l.4-.08V5.5zm.5-1.5c-.83 0-1.5.67-1.5 1.5v.75c-.73.2-1.43.48-2.06.86l-.54-.53a1.5 1.5 0 0 0-2.12 0l-.7.7a1.5 1.5 0 0 0 0 2.12l.53.54A7.95 7.95 0 0 0 6.25 12H5.5c-.83 0-1.5.67-1.5 1.5v1c0 .83.67 1.5 1.5 1.5h.75c.2.73.48 1.43.86 2.06l-.53.54a1.5 1.5 0 0 0 0 2.12l.7.7a1.5 1.5 0 0 0 2.12 0l.54-.53c.63.38 1.33.67 2.06.86v.75c0 .83.67 1.5 1.5 1.5h1c.83 0 1.5-.67 1.5-1.5v-.75a7.95 7.95 0 0 0 2.06-.86l.54.53a1.5 1.5 0 0 0 2.12 0l.7-.7a1.5 1.5 0 0 0 0-2.12l-.53-.54c.38-.63.67-1.33.86-2.06h.75c.83 0 1.5-.67 1.5-1.5v-1c0-.83-.67-1.5-1.5-1.5h-.75a7.95 7.95 0 0 0-.86-2.06l.53-.54a1.5 1.5 0 0 0 0-2.12l-.7-.7a1.5 1.5 0 0 0-2.12 0l-.54.53A7.95 7.95 0 0 0 16 6.25V5.5c0-.83-.67-1.5-1.5-1.5h-1zM12 14a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm2-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>'
    },
    'ZSM+': function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor"><circle cx="9" cy="14" r="1"/><circle cx="4" cy="14" r="1"/><circle cx="14" cy="14" r="1"/><circle cx="19" cy="14" r="1"/><circle cx="24" cy="14" r="1"/></svg>'
    },
    ZWNO: function (t, e, i) {
      'use strict'
      function o(t) {
        let e = 0
        return (
          (t.isTop && t.isLeft) || (e += 1),
          (t.isTop && t.isRight) || (e += 2),
          (t.isBottom && t.isLeft) || (e += 8),
          (t.isBottom && t.isRight) || (e += 4),
          e
        )
      }
      i.d(e, 'a', function () {
        return o
      })
    },
    bQEj: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path stroke="currentColor" d="M4 13.5h20"/></svg>'
    },
    dRg2: function (t, e, i) {
      t.exports = {
        item: 'item-3Te2Sp8a',
        withIcon: 'withIcon-3Te2Sp8a',
        icon: 'icon-3Te2Sp8a',
        labelRow: 'labelRow-3Te2Sp8a',
        multiWidth: 'multiWidth-3Te2Sp8a',
        buttonWrap: 'buttonWrap-3Te2Sp8a',
        buttonLabel: 'buttonLabel-3Te2Sp8a',
      }
    },
    gmn6: function (t, e, i) {
      'use strict'
      i.r(e),
        i.d(e, 'FavoriteDrawingToolbar', function () {
          return g
        })
      i('YFKU')
      var o = i('0ZwQ'),
        n = i('b2d7'),
        s = i('8+VR'),
        r = i('gWrr'),
        a = i('7KDR'),
        l = i('5VQP'),
        c = i('mMWL'),
        d = i('MP+M'),
        h = i('Vdly'),
        u = i('hY0g'),
        p = i.n(u)
      i('4QAy')
      class g extends o.b {
        constructor(t) {
          super({
            allowSortable: !s.mobiletouch,
            dragOnlyInsideToolbar: !0,
            defaultPosition: t,
            positionSettingsKey: 'chart.favoriteDrawingsPosition',
            positionStorageType: 'device',
          }),
            (this._linetoolsWidgets = {}),
            (this._canBeShownValue = new p.a(!1)),
            this._attachHandlers(),
            this._loadVisibilityState(),
            (this._hideAction = this._createHideToolbarAction())
        }
        show() {
          this._canBeShownValue.value() &&
            (h.setValue('ChartFavoriteDrawingToolbarWidget.visible', !0),
            this.isVisible() || this._renderAllLinetools(),
            super.show())
        }
        hide() {
          h.setValue('ChartFavoriteDrawingToolbarWidget.visible', !1), super.hide()
        }
        canBeShown() {
          return this._canBeShownValue.readonly()
        }
        _onFavoriteAdded(t) {
          this._canBeShownValue.setValue(!0), this.addWidget(this._createLinetoolWidget(t)), this.show()
        }
        _onFavoriteRemoved(t) {
          this.removeWidget(this._linetoolsWidgets[t]),
            delete this._linetoolsWidgets[t],
            0 === n.a.favoritesCount() && (this._canBeShownValue.setValue(!1), this.hide())
        }
        _onFavoriteMoved() {
          this._renderAllLinetools()
        }
        _onSelectedLinetoolChanged(t) {
          Object.keys(this._linetoolsWidgets).forEach(e => {
            this._linetoolsWidgets[e].classList.toggle('i-active', t === e)
          })
        }
        _createLinetoolWidget(t) {
          const e = `<span class="tv-favorited-drawings-toolbar__widget ${
              t === c.tool.value() ? 'i-active' : ''
            }" title="${d.a[t].localizedName}">${d.a[t].icon}</span>`,
            i = Object(r.b)(e)
          return (
            i.addEventListener('click', e => {
              e.preventDefault(), c.tool.value() !== t && c.tool.setValue(t)
            }),
            (this._linetoolsWidgets[t] = i),
            i
          )
        }
        _renderAllLinetools() {
          ;(this._linetoolsWidgets = {}),
            this.removeWidgets(),
            n.a
              .favorites()
              .filter(t => d.a[t])
              .forEach(t => {
                this.addWidget(this._createLinetoolWidget(t))
              })
        }
        _attachHandlers() {
          n.a.favoriteAdded.subscribe(this, this._onFavoriteAdded),
            n.a.favoriteRemoved.subscribe(this, this._onFavoriteRemoved),
            n.a.favoriteMoved.subscribe(this, this._onFavoriteMoved),
            n.a.favoritesSynced.subscribe(null, () => {
              this._loadVisibilityState(), this._renderAllLinetools()
            }),
            this.onWidgetsReordered().subscribe(this, (t, e) => {
              if ((n.a.favoriteMoved.unsubscribe(this, this._onFavoriteMoved), !n.a.moveFavorite(n.a.favorite(t), e)))
                throw new Error('Something went wrong')
              n.a.favoriteMoved.subscribe(this, this._onFavoriteMoved)
            }),
            this.onContextMenu(t => {
              t.preventDefault(),
                l.ContextMenuManager.createMenu([this._hideAction]).then(e => {
                  e.show(t)
                })
            }),
            c.tool.subscribe(this._onSelectedLinetoolChanged.bind(this))
        }
        _createHideToolbarAction() {
          return new a.Action({
            label: window.t('Hide Favorite Drawing Tools Toolbar'),
            onExecute: () => {
              this.hide()
            },
          })
        }
        _loadVisibilityState() {
          const t = n.a.favoritesCount() > 0
          this._canBeShownValue.setValue(t)
          h.getBool('ChartFavoriteDrawingToolbarWidget.visible', !0) && t ? this.show() : this.hide()
        }
      }
    },
    'm/4m': function (t, e, i) {},
    mQbF: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 15" width="13" height="15" fill="none"><path stroke="currentColor" d="M4 14.5h2.5m2.5 0H6.5m0 0V.5m0 0h-5a1 1 0 0 0-1 1V4m6-3.5h5a1 1 0 0 1 1 1V4"/></svg>'
    },
    myiL: function (t, e, i) {
      'use strict'
      i.r(e),
        i.d(e, 'LineWidthButton', function () {
          return f
        })
      var o = i('q1tI'),
        n = i.n(o),
        s = i('TSYQ'),
        r = i('Eyy1'),
        a = i('Iivm'),
        l = i('82wv'),
        c = i('5hRh'),
        d = i('N5tr'),
        h = i('nPPD'),
        u = i('O5Oz'),
        p = i('xnr+'),
        g = i('n3oB'),
        _ = i('2F1E'),
        m = i('Lnv9'),
        b = i('dRg2')
      const v = Object(h.a)(d.a, b),
        w = [
          { value: 1, icon: u },
          { value: 2, icon: p },
          { value: 3, icon: g },
          { value: 4, icon: _ },
        ]
      function f(t) {
        const { multipleProperty: e, title: i, model: o, className: h, isSmallScreen: u } = t,
          p = Object(c.a)(Object(r.ensureDefined)(e)),
          g = 'mixed' === p || !p,
          _ = (function (t) {
            const e = w.find(e => e.value === t)
            if (!e) return m
            return e.icon
          })(p)
        return n.a.createElement(
          l.a,
          {
            className: h,
            arrow: !1,
            title: i,
            'data-name': t['data-name'],
            menuDataName: t['data-name'] + '-menu',
            content: n.a.createElement(
              'div',
              null,
              g
                ? n.a.createElement('div', { className: b.multiWidth }, n.a.createElement(a.a, { icon: m }))
                : n.a.createElement(
                    'div',
                    { className: b.buttonWrap },
                    !u && n.a.createElement(a.a, { icon: _ }),
                    n.a.createElement('div', { className: s(!u && b.buttonLabel) }, p + 'px'),
                  ),
            ),
          },
          w.map(({ value: t, icon: e }) =>
            n.a.createElement(d.b, {
              key: t,
              theme: v,
              label: t + 'px',
              icon: e,
              isActive: t === p,
              onClick: f,
              onClickArg: t,
            }),
          ),
        )
        function f(t) {
          t &&
            e &&
            (o.beginUndoMacro(i),
            e.setValue(t, void 0, {
              applyValue: (t, e) => {
                o.setProperty(t, e, i)
              },
            }),
            o.endUndoMacro())
        }
      }
    },
    n3oB: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 3" width="18" height="3"><rect width="18" height="3" fill="currentColor" rx="1.5"/></svg>'
    },
    'p0W+': function (t, e, i) {
      'use strict'
      i.d(e, 'a', function () {
        return a
      })
      var o = i('q1tI'),
        n = i('TSYQ'),
        s = i('tU7i'),
        r = i('EvtC')
      const a = o.forwardRef((t, e) => {
        const { className: i, ...a } = t
        return o.createElement(s.b, { ...a, ref: e, className: n(i, r.button) })
      })
    },
    qAO1: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 12" width="8" height="12" fill="currentColor"><rect width="2" height="2" rx="1"/><rect width="2" height="2" rx="1" y="5"/><rect width="2" height="2" rx="1" y="10"/><rect width="2" height="2" rx="1" x="6"/><rect width="2" height="2" rx="1" x="6" y="5"/><rect width="2" height="2" rx="1" x="6" y="10"/></svg>'
    },
    rzV7: function (t, e, i) {
      'use strict'
      var o = Object.prototype.hasOwnProperty
      function n(t, e) {
        return t === e ? 0 !== t || 0 !== e || 1 / t == 1 / e : t != t && e != e
      }
      t.exports = function (t, e) {
        if (n(t, e)) return !0
        if ('object' != typeof t || null === t || 'object' != typeof e || null === e) return !1
        var i = Object.keys(t),
          s = Object.keys(e)
        if (i.length !== s.length) return !1
        for (var r = 0; r < i.length; r++) if (!o.call(e, i[r]) || !n(t[i[r]], e[i[r]])) return !1
        return !0
      }
    },
    tPkB: function (t, e, i) {
      'use strict'
      var o = i('YFKU').t,
        n = i('mMWL'),
        s = i('Ve4Q').LineToolPropertiesWidgetBase,
        r = i('e92V').isLineDrawnWithPressedButton,
        a = i('CW80').isLineTool
      const l = i('IhRv').ColorPickerButton,
        c = i('myiL').LineWidthButton
      i('CW80').setNewToolProperties
      var d = i('W0/v'),
        h = i('0fuu'),
        u = i('mQbF'),
        p = window.t('Color')
      class g extends s {
        constructor(t) {
          super(t), (this._hasAlertWathcedValue = null), (this._templatesButton = null), this.attachHandlers()
        }
        attachHandlers() {
          n.tool.subscribe(this.onToolChanged.bind(this), { callWithLast: !0 }),
            n.iconTool.subscribe(this.onIconToolChanged.bind(this)),
            this._chartWidgetCollection.selectedSources.subscribe(this.onSourceChanged.bind(this))
        }
        onIconToolChanged() {
          this.onToolChanged(n.tool.value())
        }
        onToolChanged(t, e) {
          this._currentTool = t
          const i = this.selectedSources()
          this._isDrawingToolExcludingTweet(t)
            ? (this._isDrawingFinished.setValue(!1), this._updateVisibility())
            : i && i.length
            ? (i.length > 1 && this._isDrawingFinished.setValue(!0), this.onSourceChanged(this.selectedSources()))
            : this.hide()
        }
        findSourceOnWidget(t) {
          for (var e = 0; e < this.activeChartWidget().model().panes().length; e++)
            for (var i = this.activeChartWidget().model().panes()[e].sourcesByGroup().all(), o = 0; o < i.length; o++)
              if (i[o] === t) return i[o]
        }
        onSourceChanged(t) {
          if (
            (this._hasAlertWathcedValue && (this._hasAlertWathcedValue.destroy(), (this._hasAlertWathcedValue = null)),
            t && t.length && (1 !== t.length || a(t[0])))
          )
            if ((this._createCommonButtons(), 1 === t.length)) {
              var e = t[0]
              e.isAvailableInFloatingWidget() && this.findSourceOnWidget(e)
                ? (!e.userEditEnabled() ||
                    (!r(e.toolname) && this.activeChartWidget().model().lineBeingCreated()) ||
                    (this._isDrawingFinished.setValue(!0),
                    e.canHasAlert() && (this._hasAlertWathcedValue = e.hasAlert.spawn())),
                  this.showPropertiesOf(e.toolname, e.properties(), !0),
                  this.showTemplatesOf({ source: e }),
                  (this._toolbarVisible = !0),
                  this._updateVisibility())
                : this.hide()
            } else
              this._clearProperties(),
                this._templatesButton && (this._clearTemplatesButton(), (this._templatesButton = null)),
                this._updateVisibility(),
                this._createWidthsButton(void 0, !0),
                this._createColorsButton(void 0, !0),
                this._createBackgroundsButton(void 0, !0),
                this._createTextColorsButton(void 0, !0)
          else this.hide()
        }
        _createWidthsButton(t, e) {
          if (
            (this._lineWidthsProperty && (this._lineWidthsProperty.destroy(), (this._lineWidthsProperty = null)),
            (this._lineWidthsProperty = this._createProperty(t, e, 'linesWidths', 'Set Line tool(s) line width')),
            !this._lineWidthsProperty)
          )
            return !0
          var i = window.t('Line tool width')
          e &&
            1 !==
              this.selectedSources().filter(function (t) {
                return a(t) && t.properties().linesWidths
              }).length &&
            (i = window.t('Line tool widths'))
          return (
            this._addPropertyButton({
              component: c,
              props: {
                title: i,
                multipleProperty: this._lineWidthsProperty,
                model: this.activeChartWidget().model(),
                'data-name': 'line-tool-width',
              },
            }),
            !0
          )
        }
        _createColorsButton(t, e) {
          return (
            this._lineColorsProperty && (this._lineColorsProperty.destroy(), (this._lineColorsProperty = null)),
            (this._lineColorsProperty = this._createProperty(t, e, 'linesColors', 'Set Line tool(s) color')),
            !this._lineColorsProperty ||
              (this._addPropertyButton({
                component: l,
                props: {
                  icon: d,
                  title: window.t('Line tool colors'),
                  property: this._lineColorsProperty,
                  model: this.activeChartWidget().model(),
                  'data-name': 'line-tool-color',
                },
              }),
              !0)
          )
        }
        _createBackgroundsButton(t, e) {
          return (
            this._backgroundsProperty && (this._backgroundsProperty.destroy(), (this._backgroundsProperty = null)),
            (this._backgroundsProperty = this._createProperty(
              t,
              e,
              'backgroundsColors',
              'Set Line background(s) color',
            )),
            !this._backgroundsProperty ||
              (this._addPropertyButton({
                component: l,
                props: {
                  icon: h,
                  title: window.t('Line tool backgrounds'),
                  property: this._backgroundsProperty,
                  model: this.activeChartWidget().model(),
                  'data-name': 'background-color',
                },
              }),
              !0)
          )
        }
        _createTextColorsButton(t, e) {
          return (
            this._textColorsProperty && (this._textColorsProperty.destroy(), (this._textColorsProperty = null)),
            (this._textColorsProperty = this._createProperty(t, e, 'textsColors', 'Set Line tool(s) text color')),
            !this._textColorsProperty ||
              (this._addPropertyButton({
                component: l,
                props: {
                  icon: u,
                  title: window.t('Line tool text colors'),
                  property: this._textColorsProperty,
                  model: this.activeChartWidget().model(),
                  'data-name': 'text-color',
                },
              }),
              !0)
          )
        }
        showTemplatesOf(t) {}
        templatesList() {
          return this._templatesList
        }
        _getPossibleProperty(t) {
          for (var e = [], i = this._defaultToolProperties(), o = 0; o < i.length; o++) {
            var n = i[o]
            n.name in t && e.push(n)
          }
          return e
        }
        showPropertiesOf(t, e, i) {
          this._toolExceptionCases || (this._toolExceptionCases = this._createToolExceptionCases())
          var o = this._toolExceptionCases[t] || this._getPossibleProperty(e)
          if ((this._clearProperties(), (this._propertiesVisible = !1), o.length)) {
            for (var n = {}, s = 0; s < o.length; s++) {
              for (var r = o[s], a = e, c = r.name.split('.'), d = 0; d < c.length; ++d) a = a && a[c[d]]
              var h = r.showIf
              if ('function' != typeof h || h(a, e)) {
                var u = r.factory
                if (u && u.call(this, a, i)) continue
                if (!a) continue
                if (((this._propertiesVisible = !0), 'combobox' !== r.inputType)) {
                  const t = {
                    component: l,
                    props: {
                      icon: r.iconSvgCode,
                      title: r.title,
                      'data-name': r.dataName,
                      property: a,
                      model: this.activeChartWidget().model(),
                    },
                  }
                  this._addPropertyButton(t)
                  continue
                }
                n[r.name] = a
              }
            }
            this._currentProperties = n
          }
        }
        _updateVisibility() {
          this._isDrawingFinished.value() && (this._toolbarVisible || this._propertiesVisible)
            ? this._show()
            : this.hide()
        }
        refresh() {
          this.onSourceChanged(this.selectedSources())
        }
        _defaultToolProperties() {
          return [
            {
              name: 'linesColors',
              inputType: 'colorPicker',
              iconSvgCode: d,
              title: p,
              factory: g.prototype._createColorsButton,
              dataName: 'line-tool-color',
            },
            {
              name: 'backgroundsColors',
              inputType: 'colorPicker',
              iconSvgCode: h,
              title: o('Background Color'),
              factory: g.prototype._createBackgroundsButton,
              dataName: 'background-color',
              showIf: this._shouldShowBackgroundProperty,
            },
            {
              name: 'textsColors',
              title: o('Text color'),
              inputType: 'colorPicker',
              iconSvgCode: u,
              factory: g.prototype._createTextColorsButton,
              dataName: 'text-color',
            },
            { name: 'linesWidths', inputType: 'combobox', factory: g.prototype._createWidthsButton },
            {
              name: 'linestyle',
              title: o('Style'),
              inputType: 'combobox',
              factory: g.prototype._createLineStyleButton,
            },
          ]
        }
        _riskPropertiesExceptionCases() {
          return [
            {
              name: 'textcolor',
              title: o('Text color'),
              inputType: 'colorPicker',
              iconSvgCode: u,
              dataName: 'text-color',
            },
            {
              name: 'profitBackground',
              title: o('Profit Background Color'),
              inputType: 'colorPicker',
              iconSvgCode: h,
              dataName: 'background-color',
            },
            {
              name: 'stopBackground',
              title: o('Stop Background Color'),
              inputType: 'colorPicker',
              iconSvgCode: h,
              dataName: 'background-color',
            },
          ]
        }
        _rangeExceptionCases() {
          return [
            { name: 'linecolor', inputType: 'colorPicker', iconSvgCode: d, title: p, dataName: 'line-tool-color' },
            {
              name: 'backgroundColor',
              inputType: 'colorPicker',
              iconSvgCode: h,
              title: o('Background Color'),
              dataName: 'background-color',
              showIf: this._shouldShowBackgroundProperty,
            },
            { name: 'linesWidths', inputType: 'combobox', factory: g.prototype._createWidthsButton },
          ]
        }
        _brushPropertiesExceptionCase() {
          return [
            {
              name: 'linesColors',
              inputType: 'colorPicker',
              iconSvgCode: d,
              title: o('Color'),
              factory: g.prototype._createColorsButton,
              dataName: 'line-tool-color',
            },
            {
              name: 'backgroundsColors',
              inputType: 'colorPicker',
              iconSvgCode: h,
              title: o('Background Color'),
              dataName: 'background-color',
              factory: g.prototype._createBackgroundsButton,
            },
            { name: 'linesWidths', inputType: 'combobox', factory: g.prototype._createWidthsButton },
          ]
        }
        _bezierPropertiesExceptionCases() {
          return [
            {
              name: 'linesColors',
              inputType: 'colorPicker',
              iconSvgCode: d,
              title: o('Color'),
              factory: g.prototype._createColorsButton,
              dataName: 'line-tool-color',
            },
            {
              name: 'backgroundsColors',
              inputType: 'colorPicker',
              iconSvgCode: h,
              dataName: 'background-color',
              title: o('Background Color'),
              factory: g.prototype._createBackgroundsButton,
              showIf: this._shouldShowBackgroundProperty,
            },
            { name: 'linesWidths', inputType: 'combobox', factory: g.prototype._createWidthsButton },
            {
              name: 'linestyle',
              title: o('Style'),
              inputType: 'combobox',
              factory: g.prototype._createLineStyleButton,
            },
          ]
        }
        _textPropertiesExceptionCases() {
          return [
            { name: 'color', title: o('Text color'), inputType: 'colorPicker', iconSvgCode: u, dataName: 'text-color' },
            {
              name: 'backgroundColor',
              title: o('Background Color'),
              inputType: 'colorPicker',
              iconSvgCode: h,
              dataName: 'background-color',
              showIf: this._shouldShowBackgroundProperty,
            },
            {
              name: 'fontsize',
              title: o('Font Size'),
              inputType: 'combobox',
              factory: g.prototype._createFontSizeButton,
            },
          ]
        }
        _notePropertiesExceptionCases() {
          return [
            {
              name: 'markerColor',
              title: o('Marker Color'),
              inputType: 'colorPicker',
              iconSvgCode: d,
              dataName: 'line-tool-color',
            },
            {
              name: 'textColor',
              title: o('Text color'),
              inputType: 'colorPicker',
              iconSvgCode: u,
              dataName: 'text-color',
            },
            {
              name: 'fontSize',
              title: o('Font Size'),
              inputType: 'combobox',
              factory: g.prototype._createFontSizeButton,
            },
          ]
        }
        _createToolExceptionCases() {
          return {
            LineToolRegressionTrend: [],
            LineToolBrush: g.prototype._brushPropertiesExceptionCase(),
            LineToolBezierQuadro: g.prototype._bezierPropertiesExceptionCases(),
            LineToolBezierCubic: g.prototype._bezierPropertiesExceptionCases(),
            LineToolText: g.prototype._textPropertiesExceptionCases(),
            LineToolTextAbsolute: g.prototype._textPropertiesExceptionCases(),
            LineToolBalloon: g.prototype._textPropertiesExceptionCases(),
            LineToolCallout: g.prototype._textPropertiesExceptionCases(),
            LineToolPriceLabel: g.prototype._textPropertiesExceptionCases(),
            LineToolDateRange: g.prototype._rangeExceptionCases(),
            LineToolPriceRange: g.prototype._rangeExceptionCases(),
            LineToolDateAndPriceRange: g.prototype._rangeExceptionCases(),
            LineToolNote: g.prototype._notePropertiesExceptionCases(),
            LineToolNoteAbsolute: g.prototype._notePropertiesExceptionCases(),
            LineToolRiskRewardLong: g.prototype._riskPropertiesExceptionCases(),
            LineToolRiskRewardShort: g.prototype._riskPropertiesExceptionCases(),
            LineToolBarsPattern: [
              { name: 'color', title: p, inputType: 'colorPicker', iconSvgCode: h, dataName: 'background-color' },
            ],
            LineToolProjection: [
              {
                name: 'color1',
                title: o('Background color 1'),
                inputType: 'colorPicker',
                iconSvgCode: h,
                dataName: 'background-color',
              },
              {
                name: 'color2',
                title: o('Background color 2'),
                inputType: 'colorPicker',
                iconSvgCode: h,
                dataName: 'background-color',
              },
              { name: 'linesWidths', inputType: 'combobox', factory: g.prototype._createWidthsButton },
            ],
            LineToolSignpost: [
              { name: 'fontSize', title: o('Font Size'), inputType: 'combobox' },
              {
                name: 'linesColors',
                inputType: 'colorPicker',
                iconSvgCode: h,
                dataName: 'background-color',
                title: p,
                factory: g.prototype._createBackgroundsButton,
                showIf: function (t, e) {
                  return e && e.showImage.value()
                },
              },
            ],
          }
        }
      }
      t.exports = g
    },
    turx: function (t, e, i) {
      'use strict'
      i.d(e, 'b', function () {
        return a
      }),
        i.d(e, 'a', function () {
          return l
        })
      var o = i('Eyy1'),
        n = i('tc+8'),
        s = i.n(n)
      class r extends s.a {
        constructor(t) {
          super(), (this._listenersMappers = []), (this._isProcess = !1), (this._baseProperty = t)
        }
        destroy() {
          this._baseProperty.destroy()
        }
        value() {
          const t = this._baseProperty.value()
          return 'mixed' === t ? '' : t
        }
        visible() {
          return this._baseProperty.visible()
        }
        setValue(t) {
          ;(this._isProcess = !0),
            this._baseProperty.setValue('' === t ? 'mixed' : t, void 0, { applyValue: this._applyValue.bind(this) }),
            (this._isProcess = !1),
            this._listenersMappers.forEach(t => {
              t.method.call(t.obj, this)
            })
        }
        subscribe(t, e) {
          const i = i => {
              this._isProcess || e.call(t, this)
            },
            o = { obj: t, method: e, callback: i }
          this._listenersMappers.push(o), this._baseProperty.subscribe(t, i)
        }
        unsubscribe(t, e) {
          var i
          const n = Object(o.ensureDefined)(
            null === (i = this._listenersMappers.find(i => i.obj === t && i.method === e)) || void 0 === i
              ? void 0
              : i.callback,
          )
          this._baseProperty.unsubscribe(t, n)
        }
        unsubscribeAll(t) {
          this._baseProperty.unsubscribeAll(t)
        }
      }
      class a extends r {
        constructor(t, e, i) {
          super(t), (this._undoModel = e), (this._undoText = i)
        }
        _applyValue(t, e) {
          this._undoModel.setProperty(t, e, this._undoText)
        }
      }
      class l extends r {
        _applyValue(t, e) {
          t.setValue(e)
        }
      }
    },
    ucyy: function (t, e, i) {
      t.exports = { button: 'button-1gEXpG61' }
    },
    wwkJ: function (t, e, i) {
      'use strict'
      i.d(e, 'a', function () {
        return n
      })
      var o = i('q1tI')
      const n = i
        .n(o)
        .a.createContext({ isGrouped: !1, cellState: { isTop: !0, isRight: !0, isBottom: !0, isLeft: !0 } })
    },
    'xnr+': function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 2" width="18" height="2"><rect width="18" height="2" fill="currentColor" rx="1"/></svg>'
    },
  },
])
