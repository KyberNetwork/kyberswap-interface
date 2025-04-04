;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['series-pane-views'],
  {
    '+weX': function (t, e, i) {
      'use strict'
      var a = i('aO4+').Point,
        s = i('YFKU').t,
        r = i('Zy3/').CompositeRenderer,
        n = i('gQ5K').DateFormatter,
        l = i('4kQX').TimeFormatter,
        d = i('ikwP').calcTextHorizontalShift,
        o = i('Ialn').isRtl,
        h = i('zDbI').CHART_FONT_FAMILY,
        _ = i('cPgM').ScaledPaneRenderer
      class m extends _ {
        constructor() {
          super(), (this._data = null)
        }
        setData(t) {
          this._data = t
        }
        hitTest() {
          return null
        }
        _drawImpl(t) {
          if (null !== this._data) {
            var e = Math.round(4.5),
              i = 0
            t.save(), t.setFont('12px ' + h)
            var a = s('Last available bar')
            if (this._data.eod) i = t.measureText(a).width
            else {
              var r = t.measureText(this._data.dateString || '').width,
                n = t.measureText(this._data.timeString || '').width
              i = Math.max(r, n)
            }
            var l = this._data.timeString ? 2 : 1,
              _ = document.querySelector('html').classList.contains('theme-dark')
            ;(t.fillStyle = _ ? '#50535E' : '#2A2E39'), t.translate(this._data.point.x + 0.5, this._data.point.y + 0.5)
            var m = Math.round(-i / 2) - 8,
              u = -17 * l - 8 - 4 - 5,
              T = Math.round(m + i + 16)
            if (
              (t.beginPath(),
              t.moveTo(m + 2, u),
              t.lineTo(T - 2, u),
              t.arcTo(T, u, T, u + 2, 2),
              t.lineTo(T, -11),
              t.arcTo(T, -9, T - 2, -9, 2),
              t.lineTo(6, -9),
              t.lineTo(0, -5),
              t.lineTo(-6, -9),
              t.lineTo(m + 2, -9),
              t.arcTo(m, -9, m, -11, 2),
              t.lineTo(m, u + 2),
              t.arcTo(m, u, m + 2, u, 2),
              t.fill(),
              (t.fillStyle = '#F0F3FA'),
              (t.textBaseline = 'middle'),
              (t.textAlign = o() ? 'right' : 'left'),
              this._data.eod)
            ) {
              var c = d(t, i)
              t.fillText(a, m + 8 + c, u + (-9 - u) / 2)
            } else {
              var p = m + 8 + (i - r) / 2,
                v = d(t, r)
              if ((t.fillText(this._data.dateString, p + v, u + e + 8), this._data.timeString)) {
                var f = d(t, n),
                  g = m + 8 + (i - n) / 2
                t.fillText(this._data.timeString, g + f, u + 17 * l - e)
              }
            }
            t.restore()
          }
        }
      }
      t.exports.GotoDateView = class {
        constructor(t, e) {
          ;(this._gotoDateResult = e), (this._series = t), (this._invalidated = !0), (this._renderer = new m())
        }
        update() {
          this._invalidated = !0
        }
        updateImpl() {
          delete this._point, delete this._dateString, delete this._timeString, delete this._eod
          var t = this._series.model().timeScale().timePointToIndex(this._gotoDateResult.timestamp),
            e = this._series.bars(),
            i = null
          if (
            (t < e.firstIndex() && null !== e.first()
              ? ((t = e.firstIndex()), (i = e.first().value))
              : t > e.lastIndex() && null !== e.last()
              ? ((t = e.lastIndex()), (i = e.last().value))
              : (i = e.valueAt(t)),
            null !== i)
          ) {
            var s = this._series.firstValue()
            if (null != s) {
              var r = this._series.priceScale().priceToCoordinate(i[TradingView.HIGH_PLOT], s),
                d = this._series.model().timeScale().indexToCoordinate(t)
              if (((this._point = new a(d, r)), this._gotoDateResult.eod)) this._eod = !0
              else {
                var o = this._series.model().timeScale().indexToUserTime(t)
                ;(this._dateString = new n().format(o)), this._series.isDWM() || (this._timeString = new l().format(o))
              }
            }
          }
        }
        renderer() {
          return (
            this._invalidated && (this.updateImpl(), (this._invalidated = !1)),
            this._point
              ? (this._renderer.setData({
                  point: this._point,
                  dateString: this._dateString,
                  timeString: this._timeString,
                  eod: this._eod,
                }),
                this._renderer)
              : new r()
          )
        }
      }
    },
  },
])
