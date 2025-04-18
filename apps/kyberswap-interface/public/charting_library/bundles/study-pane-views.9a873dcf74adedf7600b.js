;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['study-pane-views'],
  {
    '1sos': function (t, e, i) {
      'use strict'
      i.r(e),
        i.d(e, 'HorizLinePaneView', function () {
          return o
        })
      var s = i('Eyy1'),
        n = i('VdBB'),
        r = i('Zy3/'),
        a = i('l4sv')
      class o {
        constructor(t, e, i) {
          ;(this._data = []),
            (this._invalidated = !0),
            (this._provider = t),
            (this._model = e),
            (this._hitTestResult =
              void 0 !== i
                ? new n.HitTestResult(n.HitTestResult.CUSTOM, i)
                : new n.HitTestResult(n.HitTestResult.REGULAR))
        }
        update() {
          this._invalidated = !0
        }
        renderer() {
          this._invalidated && (this._updateViewInternal(), (this._invalidated = !1))
          const t = new r.CompositeRenderer()
          for (const e of this._data) {
            const i = new a.HorizontalLineRenderer()
            i.setData(e), i.setHitTest(this._hitTestResult), t.append(i)
          }
          return t
        }
        _updateViewInternal() {
          this._data = []
          const t = this._provider.priceScale(),
            e = this._model.timeScale()
          if (!t || t.isEmpty() || e.isEmpty()) return
          const i = this._provider.graphics().horizlines()
          if (0 === i.size) return
          const n = this._model.timeScale().visibleBarsStrictRange()
          if (null === n) return
          const r = this._provider.firstValue()
          if (null === r) return
          const a = n.firstBar(),
            o = n.lastBar()
          i.forEach((i, n) => {
            const l = this._provider.properties().graphics.horizlines[n]
            l.visible.value() &&
              i.forEach(i => {
                const n = i.startIndex,
                  c = i.endIndex
                ;(!i.extendRight && Math.max(n, c) < a) ||
                  (!i.extendLeft && Math.min(n, c) > o) ||
                  this._data.push({
                    y: t.priceToCoordinate(Object(s.ensureDefined)(i.level), r),
                    left: i.extendLeft ? void 0 : e.indexToCoordinate(n),
                    right: i.extendRight ? void 0 : e.indexToCoordinate(c),
                    color: l.color.value(),
                    linewidth: l.width.value(),
                    linestyle: l.style.value(),
                  })
              })
          })
        }
      }
    },
    BCbF: function (t, e, i) {
      'use strict'
      i.r(e),
        i.d(e, 'PolygonRenderer', function () {
          return u
        })
      var s = i('f6yo'),
        n = i('GEp6'),
        r = i('jFln'),
        a = i('pJOz'),
        o = i('a7Ha'),
        l = i('VdBB'),
        c = i('Tmoa'),
        h = i('cPgM'),
        d = i('Zp/P')
      class u extends h.ScaledPaneRenderer {
        constructor(t) {
          super(),
            (this._data = null),
            (this._backHittest = new l.HitTestResult(l.HitTestResult.MOVEPOINT_BACKGROUND)),
            (this._points = []),
            (this._hittest = t || new l.HitTestResult(l.HitTestResult.MOVEPOINT))
        }
        setData(t) {
          ;(this._data = t), (this._points = t.points)
        }
        hitTest(t) {
          if (null === this._data || (void 0 !== this._data.mouseTouchable && !this._data.mouseTouchable)) return null
          const e = Math.max(Object(d.interactionTolerance)().line, Math.ceil(this._data.linewidth / 2)),
            i = this._points.length
          if (1 === i) {
            return Object(s.pointInCircle)(t, this._points[0], e) ? this._hittest : null
          }
          for (let s = 1; s < i; s++) {
            const i = this._points[s - 1],
              r = this._points[s]
            if (Object(n.distanceToSegment)(i, r, t).distance <= e) return this._hittest
          }
          if (this._data.filled && this._data.fillBackground && i > 0) {
            const s = this._points[0],
              r = this._points[i - 1]
            if (Object(n.distanceToSegment)(s, r, t).distance <= e) return this._hittest
          }
          return this._data.filled && this._data.fillBackground && Object(s.pointInPolygon)(t, this._data.points)
            ? this._backHittest
            : null
        }
        _drawImpl(t, e) {
          var i, s
          const n = this._points.length
          if (null === this._data || 0 === n) return
          if (1 === n) return void this._drawPoint(t, this._points[0], this._data.linewidth / 2, this._data.color)
          t.beginPath()
          const l = null !== (i = this._data.linecap) && void 0 !== i ? i : 'butt'
          ;(t.lineCap = l),
            (t.strokeStyle = this._data.color),
            (t.lineWidth = this._data.linewidth),
            (t.lineJoin = null !== (s = this._data.linejoin) && void 0 !== s ? s : 'miter'),
            Object(r.setLineStyle)(t, this._data.linestyle)
          const h = this._points[0]
          t.moveTo(h.x, h.y)
          for (const e of this._points) t.lineTo(e.x, e.y)
          if (
            (this._data.filled &&
              this._data.fillBackground &&
              ((t.fillStyle = Object(c.generateColor)(this._data.backcolor, this._data.transparency)), t.fill()),
            this._data.filled && !this._data.skipClosePath && t.closePath(),
            this._data.linewidth > 0 && t.stroke(),
            n > 1)
          ) {
            if (('butt' !== l && (t.lineCap = 'butt'), this._data.leftend === o.LineEnd.Arrow)) {
              const i = this._correctArrowPoints(this._points[1], this._points[0], t.lineWidth, l)
              Object(a.drawArrow)(i[0], i[1], t, t.lineWidth, e.pixelRatio)
            }
            if (this._data.rightend === o.LineEnd.Arrow) {
              const i = this._correctArrowPoints(this._points[n - 2], this._points[n - 1], t.lineWidth, l)
              Object(a.drawArrow)(i[0], i[1], t, t.lineWidth, e.pixelRatio)
            }
          }
        }
        _drawPoint(t, e, i, s) {
          0 !== i && (t.beginPath(), (t.fillStyle = s), t.arc(e.x, e.y, i, 0, 2 * Math.PI, !0), t.fill(), t.closePath())
        }
        _correctArrowPoints(t, e, i, s) {
          const n = e.subtract(t),
            r = n.length()
          if ('butt' === s || r < 1) return [t, e]
          const a = r + i / 2
          return [t, n.scaled(a / r).add(t)]
        }
      }
    },
    BJvp: function (t, e, i) {
      'use strict'
      i.r(e),
        i.d(e, 'PolygonPaneView', function () {
          return c
        })
      var s = i('Eyy1'),
        n = i('aO4+'),
        r = i('VdBB'),
        a = i('Zy3/'),
        o = i('8Uy/'),
        l = i('BCbF')
      class c {
        constructor(t, e, i) {
          ;(this._data = []),
            (this._invalidated = !0),
            (this._provider = t),
            (this._model = e),
            (this._hitTestResult =
              void 0 !== i
                ? new r.HitTestResult(r.HitTestResult.CUSTOM, i)
                : new r.HitTestResult(r.HitTestResult.REGULAR))
        }
        update() {
          this._invalidated = !0
        }
        renderer() {
          this._invalidated && (this._updateViewInternal(), (this._invalidated = !1))
          const t = new a.CompositeRenderer()
          for (const e of this._data) {
            const i = new l.PolygonRenderer(this._hitTestResult)
            i.setData(e), t.append(i)
          }
          return t
        }
        _updateViewInternal() {
          this._data = []
          const t = this._provider.priceScale(),
            e = this._model.timeScale()
          if (!t || t.isEmpty() || e.isEmpty()) return
          const i = this._provider.graphics().polygons()
          if (0 === i.size) return
          const r = this._model.timeScale().visibleBarsStrictRange()
          if (null === r) return
          const a = this._provider.firstValue()
          if (null === a) return
          const l = r.firstBar(),
            c = r.lastBar(),
            h = this._provider.properties().graphics.polygons,
            d = Object(s.ensureDefined)(this._provider.metaInfo().graphics.polygons)
          i.forEach((i, r) => {
            const u = h[r]
            100 !== u.transparency.value() &&
              i.forEach(i => {
                let h = 1 / 0,
                  p = -1 / 0
                for (const t of i.points) {
                  const e = t.index + (t.offset || 0)
                  ;(h = Math.min(h, e)), (p = Math.max(p, e))
                }
                if (p < l || c < h) return
                const f = i.points.map(i => {
                  const r = e.indexToCoordinate(i.index + (i.offset || 0)),
                    o = t.priceToCoordinate(Object(s.ensureDefined)(i.level), a)
                  return new n.Point(r, o)
                })
                this._data.push({
                  points: f,
                  color: u.color.value(),
                  backcolor: u.color.value(),
                  linewidth: void 0 !== u.showBorder && u.showBorder.value() ? 1 : 0,
                  linestyle: o.LINESTYLE_SOLID,
                  filled: !0,
                  fillBackground: !0,
                  transparency: u.transparency.value(),
                  mouseTouchable: Object(s.ensureDefined)(d[r]).mouseTouchable,
                })
              })
          })
        }
      }
    },
    Gj0v: function (t, e, i) {
      'use strict'
      i.r(e)
      var s = i('Eyy1'),
        n = i('VdBB'),
        r = i('Zy3/'),
        a = i('qgcf'),
        o = i('aO4+'),
        l = i('eJTA'),
        c = i('ikwP'),
        h = i('KG+6'),
        d = i('nEwK'),
        u = i('zDbI')
      function p(t, e) {
        return { min: Math.min(t, e), max: Math.max(t, e) }
      }
      function f(t) {
        return t.max - t.min
      }
      class _ {
        constructor(t) {
          this._data = t
        }
        hitTest(t, e) {
          const i = this._data
          for (const s of i.histograms) {
            if (s.yRange.min >= t.y || t.y >= s.yRange.max) continue
            let r = s.yRange.min,
              a = null
            const o = f(s.xRange)
            for (const l of s.bars) {
              const c = i.styles[l.styleId]
              if (!c.visible) continue
              if (c.location === h.b.Absolute && (s.xRange.min >= t.x || t.x >= s.xRange.max)) continue
              null === a &&
                ((a = 0),
                s.bars.forEach(t => {
                  const e = t.subBarValues.reduce((t, e) => t + e)
                  a = Math.max(a, e)
                }))
              const d = v(s.xRange, c, e.cssWidth),
                { xBasePoint: u, sign: f } = d,
                _ = p(r, r + l.height)
              r += l.height
              const g = Math.max((c.percentWidth * o) / 100 - l.subBarValues.length, 0)
              for (let e = 0; e < l.subBarValues.length; e++) {
                const i = _.min,
                  s = _.max,
                  r = 0 === e ? u : u + f * ((g * l.subBarValues[e - 1]) / a),
                  o = r + f * ((g * l.subBarValues[e]) / a)
                if (((t.x >= r && t.x <= o) || (t.x >= o && t.x <= r)) && t.y >= i && t.y <= s)
                  return new n.HitTestResult(n.HitTestResult.REGULAR)
              }
            }
          }
          return null
        }
        draw(t, e) {
          const i = this._data
          t.save(),
            i.histograms.forEach(s => {
              const n = []
              let r = s.yRange.min,
                a = 0,
                o = 0
              s.bars.forEach(t => {
                const e = t.subBarValues.reduce((t, e) => t + e)
                ;(a = Math.max(a, e)), (o += t.height)
              })
              const c = o / s.bars.length,
                h = ((d = c), (u = e.pixelRatio), Math.floor(d * u) >= 1 * u ? Math.floor(u) : 0)
              var d, u
              const _ = f(s.xRange),
                b = []
              if (
                (s.bars.forEach(o => {
                  const l = i.styles[o.styleId]
                  if (!l.visible) return
                  if (l.showValues)
                    for (let t = 0; t < o.subBarValues.length; t++) n[t] = (n[t] || 0) + o.subBarValues[t]
                  const c = v(s.xRange, l, e.cssWidth),
                    { xBasePoint: d, sign: u } = c,
                    f = p(r, r + o.height)
                  if (((r += o.height), f.min > e.cssHeight || f.max < 0)) return
                  const R = Math.max((l.percentWidth * _) / 100 - o.subBarValues.length, 0)
                  for (let i = 0; i < o.subBarValues.length; i++) {
                    const s = f.min,
                      n = f.max,
                      r = 0 === i ? d : d + u * ((R * o.subBarValues[i - 1]) / a),
                      c = r + u * ((R * o.subBarValues[i]) / a)
                    if (Math.abs(c - r) < 0.5) continue
                    ;(t.fillStyle = l.colors[i]), t.beginPath()
                    const p = Math.round(r * e.pixelRatio),
                      _ = Math.round(s * e.pixelRatio),
                      v = Math.round(c * e.pixelRatio),
                      g = Math.round(n * e.pixelRatio),
                      m = v - p,
                      b = Math.max(g - _ - h, 1)
                    t.rect(p, _, m, b), t.fill()
                  }
                  if (!l.showValues) return
                  const y = g(o.subBarValues, l.direction),
                    x = m(_, f, c, l, y)
                  b.push(x)
                }),
                b.length > 0)
              ) {
                const t = i.styles[s.bars[0].styleId],
                  a = v(s.xRange, t, e.cssWidth),
                  o = p(r, r + c),
                  h = g(n, t.direction),
                  d = m(_, o, a, t, h)
                ;(d.color = Object(l.shiftColor)(d.color, 1.5)), b.push(d)
              }
              const y = Math.min(...b.map(t => t.fontSize))
              if (y >= 7.5) for (const i of b) (i.fontSize = y), R(t, e, i)
            }),
            t.restore()
        }
      }
      function v(t, e, i) {
        const s = e.location === h.b.Absolute,
          n = e.location === h.b.Relative,
          r = e.direction === h.a.LeftToRight,
          a = e.direction === h.a.RightToLeft
        let o, l
        if (s && r) (o = t.min), (l = 1)
        else if (s && a) (o = t.max), (l = -1)
        else if (n && r) (o = 0), (l = 1)
        else {
          if (!n || !a) throw new Error(`Unknown location/direction values: ${e.location}/${e.direction}`)
          ;(o = i), (l = -1)
        }
        return { xBasePoint: o, sign: l }
      }
      function g(t, e) {
        e === h.a.RightToLeft && (t = t.slice()).reverse()
        const i = new d.VolumeFormatter()
        return t.map(t => i.format(t)).join('x')
      }
      function m(t, e, i, s, n) {
        const r = Math.min(Math.round((1.7 * t) / n.length), Math.round(0.6 * f(e))),
          a = s.direction === h.a.LeftToRight ? 'left' : 'right',
          { xBasePoint: l, sign: c } = i,
          d = l + 3 * c,
          u = e.min + 0.7 * f(e)
        return { text: n, color: s.valuesColor, fontSize: r, align: a, point: new o.Point(d, u) }
      }
      function R(t, e, i) {
        const { text: s, color: n, fontSize: r, align: a, point: o } = i
        ;(t.font = `${r}px ${u.CHART_FONT_FAMILY}`),
          (t.fillStyle = n),
          (t.textAlign = a),
          Object(c.drawScaled)(t, e.pixelRatio, () => t.fillText(s, o.x, o.y))
      }
      var b = i('Tmoa')
      i.d(e, 'HHistPaneView', function () {
        return y
      })
      class y {
        constructor(t, e, i) {
          ;(this._invalidated = !0),
            (this._provider = t),
            (this._model = e),
            (this._rendererData = { histograms: [], styles: {} }),
            (this._textData = []),
            (this._hhistRenderer = new _(this._rendererData))
        }
        update() {
          this._invalidated = !0
        }
        renderer() {
          this._invalidated && (this._updateViewInternal(), (this._invalidated = !1))
          const t = new r.CompositeRenderer()
          t.append(this._hhistRenderer)
          for (const e of this._textData) t.append(new a.TextRenderer(e, new n.HitTestResult(n.HitTestResult.REGULAR)))
          return t
        }
        _resetRenderersData() {
          ;(this._rendererData.histograms = []), (this._textData = [])
        }
        _prepareStyles() {
          const t = Object(s.ensureDefined)(this._provider.graphicsInfo().hhists),
            e = Object.keys(t),
            i = this._provider.properties().graphics.hhists
          this._rendererData.styles = {}
          for (const n of e) {
            const e = Object(s.ensureDefined)(i.child(n)),
              r = Object(s.ensureDefined)(t[n]),
              a = Object(b.generateColor)(e.colors[0].value(), e.transparencies[0].value()),
              o = e.colors[1] ? Object(b.generateColor)(e.colors[1].value(), e.transparencies[1].value()) : a
            this._rendererData.styles[n] = {
              colors: [a, o],
              visible: e.visible.value(),
              percentWidth: e.percentWidth.value(),
              location: r.location,
              direction: e.direction.value(),
              showValues: e.showValues.value(),
              valuesColor: e.valuesColor.value(),
            }
          }
        }
        _updateViewInternal() {
          this._resetRenderersData()
          const t = this._provider.priceScale(),
            e = this._model.timeScale()
          if (!t || t.isEmpty() || e.isEmpty()) return
          if (null === this._provider.firstValue()) return
          const i = this._provider.graphics().hhistsByTimePointIndex()
          if (0 === i.size) return
          const n = e.visibleBarsStrictRange()
          if (null === n) return
          const r = n.firstBar(),
            a = n.lastBar()
          this._prepareStyles(),
            Object(s.ensureDefined)(i).forEach((i, s) => {
              let n = 1 / 0,
                o = -1 / 0
              i.forEach(t => {
                ;(n = Math.min(n, t.firstBarTime)), (o = Math.max(o, t.lastBarTime))
              }),
                o < r || n > a || this._updateDataForRenderers(i, t, e)
            })
        }
        _updateDataForRenderers(t, e, i) {
          if (t.size <= 0) return
          let n = null
          if (
            (t.forEach(t => {
              n = n || t
            }),
            null === n)
          )
            return
          let r = n
          t.forEach(t => {
            t.priceLow < r.priceLow && (r = t)
          })
          const a = (function (t, e) {
              return p(e.indexToCoordinate(t.firstBarTime), e.indexToCoordinate(t.lastBarTime))
            })(n, i),
            o = []
          t.forEach(t => {
            null == t.rate[t.rate.length - 1] && t.rate.splice(-1, 1)
            const i = (function (t, e, i) {
              return p(e.priceToCoordinate(t.priceHigh, i), e.priceToCoordinate(t.priceLow, i))
            })(t, e, Object(s.ensureNotNull)(this._provider.firstValue()))
            o.push({ yRange: i, subBarValues: t.rate, styleId: t.styleId })
          }),
            o.sort((t, e) => t.yRange.min - e.yRange.min)
          const l = []
          let c = o[0].yRange.min
          for (const t of o) {
            const e = t.yRange.max - c
            l.push({ height: e, ...t }), (c = t.yRange.max)
          }
          this._rendererData.histograms.push({ xRange: a, yRange: p(o[0].yRange.min, c), bars: l })
        }
      }
    },
    psYU: function (t, e, i) {
      'use strict'
      i.r(e),
        i.d(e, 'VertLinePaneView', function () {
          return l
        })
      var s = i('Eyy1'),
        n = i('VdBB'),
        r = i('972a'),
        a = i('Zy3/'),
        o = i('z+cS')
      class l {
        constructor(t, e, i) {
          ;(this._data = []),
            (this._invalidated = !0),
            (this._provider = t),
            (this._model = e),
            (this._hitTestResult =
              void 0 !== i
                ? new n.HitTestResult(n.HitTestResult.CUSTOM, i)
                : new n.HitTestResult(n.HitTestResult.REGULAR))
        }
        update() {
          this._invalidated = !0
        }
        renderer() {
          this._invalidated && (this._updateViewInternal(), (this._invalidated = !1))
          const t = new a.CompositeRenderer()
          for (const e of this._data) {
            const i = new o.VerticalLineRenderer()
            i.setData(e), i.setHitTest(this._hitTestResult), t.append(i)
          }
          return t
        }
        _updateViewInternal() {
          this._data = []
          const t = this._provider.priceScale(),
            e = this._model.timeScale()
          if (!t || t.isEmpty() || e.isEmpty()) return
          const i = this._provider.graphicsInfo().vertlines,
            n = this._provider.graphics().vertlines()
          if (0 === n.size || void 0 === i) return
          const a = this._model.timeScale().visibleBarsStrictRange()
          if (null === a) return
          const o = this._provider.firstValue()
          if (null === o) return
          const l = a.firstBar(),
            c = a.lastBar()
          n.forEach((n, a) => {
            const h = this._provider.properties().graphics.vertlines[a]
            if (!h.visible.value()) return
            let d = 0
            switch (Object(s.ensureDefined)(i[a]).halign) {
              case r.a.Left:
                d = -e.barSpacing() / 2
                break
              case r.a.Right:
                d = e.barSpacing() / 2
            }
            n.forEach(i => {
              const n = i.index
              n < l ||
                c < n ||
                this._data.push({
                  x: e.indexToCoordinate(n) + d,
                  top: i.extendTop ? void 0 : t.priceToCoordinate(Object(s.ensureDefined)(i.endPrice), o),
                  bottom: i.extendBottom ? void 0 : t.priceToCoordinate(Object(s.ensureDefined)(i.startPrice), o),
                  color: h.color.value(),
                  linewidth: h.width.value(),
                  linestyle: h.style.value(),
                })
            })
          })
        }
      }
    },
  },
])
