;(window.webpackJsonp = window.webpackJsonp || []).push([
  [40],
  {
    '4Cm8': function (t, e, s) {
      'use strict'
      s.d(e, 'a', function () {
        return R
      })
      var i = s('q1tI'),
        r = s('TSYQ'),
        o = s('cvc5'),
        n = s('Eyy1'),
        l = s('Iivm'),
        a = s('//lZ'),
        h = s('9uLv'),
        c = s('Ialn'),
        u = s('Vike'),
        d = s('ji/R')
      const p = { isVisibleScrollbar: !0, shouldMeasure: !0, hideButtonsFrom: 1 }
      function f(t) {
        return i.createElement('div', { className: r(d.fadeLeft, t.className, { [d.isVisible]: t.isVisible }) })
      }
      function w(t) {
        return i.createElement('div', { className: r(d.fadeRight, t.className, { [d.isVisible]: t.isVisible }) })
      }
      function b(t) {
        return i.createElement(v, { ...t, className: d.scrollLeft })
      }
      function m(t) {
        return i.createElement(v, { ...t, className: d.scrollRight })
      }
      function v(t) {
        return i.createElement(
          'div',
          { className: r(t.className, { [d.isVisible]: t.isVisible }), onClick: t.onClick },
          i.createElement('div', { className: d.iconWrap }, i.createElement(l.a, { icon: u, className: d.icon })),
        )
      }
      const R = (function (t = b, e = m, s = f, l = w) {
        var u
        return (
          ((u = class extends i.PureComponent {
            constructor(t) {
              super(t),
                (this._scroll = i.createRef()),
                (this._wrapMeasureRef = i.createRef()),
                (this._contentMeasureRef = i.createRef()),
                (this._handleScrollLeft = () => {
                  if (this.props.onScrollButtonClick) return void this.props.onScrollButtonClick('left')
                  const t = this.props.scrollStepSize || this.state.widthWrap - 50
                  this.animateTo(Math.max(0, this.currentPosition() - t))
                }),
                (this._handleScrollRight = () => {
                  if (this.props.onScrollButtonClick) return void this.props.onScrollButtonClick('right')
                  const t = this.props.scrollStepSize || this.state.widthWrap - 50
                  this.animateTo(
                    Math.min((this.state.widthContent || 0) - (this.state.widthWrap || 0), this.currentPosition() + t),
                  )
                }),
                (this._handleResizeWrap = t => {
                  this.props.onMeasureWrap && this.props.onMeasureWrap(t),
                    this.setState({ widthWrap: t.width }),
                    this._checkButtonsVisibility()
                }),
                (this._handleResizeContent = t => {
                  this.props.onMeasureContent && this.props.onMeasureContent(t)
                  const { shouldDecreaseWidthContent: e, buttonsWidthIfDecreasedWidthContent: s } = this.props
                  e && s ? this.setState({ widthContent: t.width + 2 * s }) : this.setState({ widthContent: t.width })
                }),
                (this._handleScroll = () => {
                  const { onScroll: t } = this.props
                  t && t(this.currentPosition(), this.isAtLeft(), this.isAtRight()), this._checkButtonsVisibility()
                }),
                (this._checkButtonsVisibility = () => {
                  const { isVisibleLeftButton: t, isVisibleRightButton: e } = this.state,
                    s = this.isAtLeft(),
                    i = this.isAtRight()
                  s || t
                    ? s && t && this.setState({ isVisibleLeftButton: !1 })
                    : this.setState({ isVisibleLeftButton: !0 }),
                    i || e
                      ? i && e && this.setState({ isVisibleRightButton: !1 })
                      : this.setState({ isVisibleRightButton: !0 })
                }),
                (this.state = { widthContent: 0, widthWrap: 0, isVisibleRightButton: !1, isVisibleLeftButton: !1 })
            }
            componentDidMount() {
              this._checkButtonsVisibility()
            }
            componentDidUpdate(t, e) {
              ;(e.widthWrap === this.state.widthWrap && e.widthContent === this.state.widthContent) ||
                this._handleScroll(),
                this.props.shouldMeasure &&
                  this._wrapMeasureRef.current &&
                  this._contentMeasureRef.current &&
                  (this._wrapMeasureRef.current.measure(), this._contentMeasureRef.current.measure())
            }
            currentPosition() {
              return this._scroll.current
                ? Object(c.isRtl)()
                  ? Object(c.getLTRScrollLeft)(this._scroll.current)
                  : this._scroll.current.scrollLeft
                : 0
            }
            isAtLeft() {
              return (
                !this._isOverflowed() || this.currentPosition() <= Object(n.ensureDefined)(this.props.hideButtonsFrom)
              )
            }
            isAtRight() {
              return (
                !this._isOverflowed() ||
                this.currentPosition() + this.state.widthWrap >=
                  this.state.widthContent - Object(n.ensureDefined)(this.props.hideButtonsFrom)
              )
            }
            animateTo(t, e = h.b) {
              const s = this._scroll.current
              s &&
                (Object(c.isRtl)() && (t = Object(c.getLTRScrollLeftOffset)(s, t)),
                e <= 0
                  ? (s.scrollLeft = Math.round(t))
                  : Object(a.doAnimate)({
                      onStep(t, e) {
                        s.scrollLeft = Math.round(e)
                      },
                      from: s.scrollLeft,
                      to: Math.round(t),
                      easing: h.c.easeInOutCubic,
                      duration: e,
                    }))
            }
            render() {
              const {
                  children: n,
                  isVisibleScrollbar: a,
                  isVisibleFade: h,
                  isVisibleButtons: c,
                  shouldMeasure: u,
                  shouldDecreaseWidthContent: p,
                  buttonsWidthIfDecreasedWidthContent: f,
                  onMouseOver: w,
                  onMouseOut: b,
                  scrollWrapClassName: m,
                  fadeClassName: v,
                } = this.props,
                { isVisibleRightButton: R, isVisibleLeftButton: S } = this.state,
                V = p && f
              return i.createElement(
                o,
                {
                  whitelist: ['width'],
                  onMeasure: this._handleResizeWrap,
                  shouldMeasure: u,
                  ref: this._wrapMeasureRef,
                },
                i.createElement(
                  'div',
                  { className: d.wrapOverflow, onMouseOver: w, onMouseOut: b },
                  i.createElement(
                    'div',
                    { className: r(d.wrap, V ? d.wrapWithArrowsOuting : '') },
                    i.createElement(
                      'div',
                      {
                        className: r(d.scrollWrap, m, { [d.noScrollBar]: !a }),
                        onScroll: this._handleScroll,
                        ref: this._scroll,
                      },
                      i.createElement(
                        o,
                        {
                          onMeasure: this._handleResizeContent,
                          whitelist: ['width'],
                          shouldMeasure: u,
                          ref: this._contentMeasureRef,
                        },
                        n,
                      ),
                    ),
                    h && i.createElement(s, { isVisible: S, className: v }),
                    h && i.createElement(l, { isVisible: R, className: v }),
                    c && i.createElement(t, { onClick: this._handleScrollLeft, isVisible: S }),
                    c && i.createElement(e, { onClick: this._handleScrollRight, isVisible: R }),
                  ),
                ),
              )
            }
            _isOverflowed() {
              const { widthContent: t, widthWrap: e } = this.state
              return t > e
            }
          }).defaultProps = p),
          u
        )
      })(b, m, f, w)
    },
    Vike: function (t, e) {
      t.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 10" width="20" height="10"><path fill="none" stroke="currentColor" stroke-width="1.5" d="M2 1l8 8 8-8"/></svg>'
    },
    'ji/R': function (t, e, s) {
      t.exports = {
        wrap: 'wrap-3obNZqvj',
        wrapWithArrowsOuting: 'wrapWithArrowsOuting-3obNZqvj',
        wrapOverflow: 'wrapOverflow-3obNZqvj',
        scrollWrap: 'scrollWrap-3obNZqvj',
        noScrollBar: 'noScrollBar-3obNZqvj',
        icon: 'icon-3obNZqvj',
        scrollLeft: 'scrollLeft-3obNZqvj',
        scrollRight: 'scrollRight-3obNZqvj',
        isVisible: 'isVisible-3obNZqvj',
        iconWrap: 'iconWrap-3obNZqvj',
        fadeLeft: 'fadeLeft-3obNZqvj',
        fadeRight: 'fadeRight-3obNZqvj',
      }
    },
  },
])
