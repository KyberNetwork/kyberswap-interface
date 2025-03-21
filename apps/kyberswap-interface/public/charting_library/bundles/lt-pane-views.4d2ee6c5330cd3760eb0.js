;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['lt-pane-views'],
  {
    '/S7V': function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'TriangleRenderer', function () {
          return d
        })
      var r = i('GEp6'),
        n = i('f6yo'),
        s = i('cPgM'),
        a = i('VdBB'),
        o = i('Tmoa'),
        l = i('jFln'),
        h = i('Zp/P')
      class d extends s.ScaledPaneRenderer {
        constructor() {
          super(...arguments), (this._data = null)
        }
        setData(e) {
          this._data = e
        }
        hitTest(e) {
          if (null === this._data || this._data.points.length < 2) return null
          const [t, i] = this._data.points
          let s = Object(r.distanceToSegment)(t, i, e)
          const o = Object(h.interactionTolerance)().line
          if (s.distance <= o) return new a.HitTestResult(a.HitTestResult.MOVEPOINT)
          if (3 !== this._data.points.length) return null
          const l = this._data.points[2]
          return (
            (s = Object(r.distanceToSegment)(i, l, e)),
            s.distance <= o
              ? new a.HitTestResult(a.HitTestResult.MOVEPOINT)
              : ((s = Object(r.distanceToSegment)(l, t, e)),
                s.distance <= o
                  ? new a.HitTestResult(a.HitTestResult.MOVEPOINT)
                  : this._data.fillBackground && Object(n.pointInTriangle)(e, t, i, l)
                  ? new a.HitTestResult(a.HitTestResult.MOVEPOINT_BACKGROUND)
                  : null)
          )
        }
        _drawImpl(e) {
          if (null === this._data || this._data.points.length < 2) return
          ;(e.lineCap = 'butt'),
            (e.strokeStyle = this._data.color),
            (e.lineWidth = this._data.linewidth),
            void 0 !== this._data.linestyle && Object(l.setLineStyle)(e, this._data.linestyle)
          const [t, i] = this._data.points,
            r = 2 === this._data.points.length ? i : this._data.points[2]
          e.beginPath(),
            e.moveTo(t.x, t.y),
            e.lineTo(i.x, i.y),
            e.lineTo(r.x, r.y),
            e.lineTo(t.x, t.y),
            this._data.fillBackground &&
              ((e.fillStyle = Object(o.generateColor)(this._data.backcolor, this._data.transparency)), e.fill()),
            e.stroke()
        }
      }
    },
    '00XE': function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'BrushPaneView', function () {
          return s
        })
      var r = i('8Uy/'),
        n = i('hzaj')
      class s extends n.a {
        _createPolygonRendererData() {
          const e = this._source.properties().childs(),
            t = {
              points: this._points,
              color: e.linecolor.value(),
              linewidth: e.linewidth.value(),
              linestyle: r.LINESTYLE_SOLID,
              linecap: 'round',
              skipClosePath: !0,
              leftend: e.leftEnd.value(),
              rightend: e.rightEnd.value(),
              filled: !1,
              fillBackground: !1,
              backcolor: e.backgroundColor.value(),
            }
          return (
            e.fillBackground.value() &&
              this._model.lineBeingCreated() !== this._source &&
              ((t.filled = !0), (t.fillBackground = !0), (t.transparency = e.transparency.value())),
            t
          )
        }
      }
    },
    '0s1X': function (e, t, i) {
      'use strict'
      i.r(t)
      var r = i('Eyy1'),
        n = i('aO4+'),
        s = i('HGP3'),
        a = i('Zy3/'),
        o = i('qgcf'),
        l = i('aB9a'),
        h = i('GEp6'),
        d = i('8Uy/'),
        c = i('jFln'),
        u = i('zDbI'),
        _ = i('VaSN'),
        p = i('VdBB'),
        f = i('gAom'),
        g = i('Zp/P')
      function v(e) {
        let t, i
        return (
          e >= -135 && e <= -45
            ? ((t = 'center'), (i = 'bottom'))
            : e > -45 && e < 45
            ? ((t = 'left'), (i = 'middle'))
            : e >= 45 && e <= 135
            ? ((t = 'center'), (i = 'top'))
            : ((t = 'right'), (i = 'middle')),
          { horzAlign: t, vertAlign: i }
        )
      }
      class w {
        constructor() {
          ;(this._data = null),
            (this._priceLabelRenderer = new o.TextRenderer(
              void 0,
              new p.HitTestResult(p.HitTestResult.MOVEPOINT, { areaName: p.AreaName.Style, activeItem: 1 }),
            )),
            (this._hittest = new p.HitTestResult(p.HitTestResult.MOVEPOINT, { areaName: p.AreaName.Style }))
        }
        setData(e) {
          this._data = e
          const t = e.points[0],
            i = e.points[1],
            r = Math.round((180 * Math.atan2(i.y - t.y, i.x - t.x)) / Math.PI)
          this._priceLabelRenderer.setData({
            ...v(r),
            points: [i],
            text: e.text,
            color: e.textColor,
            font: u.CHART_FONT_FAMILY,
            fontSize: e.fontSize,
            bold: e.bold,
            italic: e.italic,
            offsetX: 0,
            offsetY: 0,
            borderColor: e.borderColor,
            borderWidth: 1,
            backgroundColor: e.backgroundColor,
            backgroundRoundRect: 4,
            boxPaddingVert: 6,
            boxPaddingHorz: 8,
          })
        }
        setHitTest(e) {
          this._hittest = e
        }
        draw(e, t) {
          const i = this._data
          if (null === i || i.points.length < 2) return
          e.save()
          const r = t.pixelRatio,
            n = Math.round(i.points[0].x * r),
            s = Math.round(i.points[0].y * r),
            a = Math.round(i.points[1].x * r),
            o = Math.round(i.points[1].y * r)
          ;(e.lineCap = 'butt'),
            Object(c.setLineStyle)(e, d.LINESTYLE_SOLID),
            (e.strokeStyle = i.lineColor),
            (e.fillStyle = i.lineColor),
            (e.lineWidth = Math.round(1 * r))
          const l = Object(g.fillScaledRadius)(2, r)
          Object(f.createCircle)(e, n, s, l),
            e.fill(),
            Object(c.drawLine)(e, n, s, a, o),
            this._priceLabelRenderer.draw(e, t)
          const h = 1 * r
          ;(e.strokeStyle = i.circleBorderColor), (e.lineWidth = h)
          const u = l + h / 2
          Object(f.createCircle)(e, n, s, u), e.stroke(), e.restore()
        }
        hitTest(e) {
          const t = this._data
          if (null === t) return null
          const i = Object(_.lastEventIsTouch)() ? 20 : 3
          return Object(h.distanceToSegment)(t.points[0], t.points[1], e).distance <= i
            ? this._hittest
            : this._priceLabelRenderer.hitTest(e)
        }
      }
      i.d(t, 'PriceNotePaneView', function () {
        return x
      })
      class x extends l.LineSourcePaneView {
        constructor() {
          super(...arguments),
            (this._renderer = new a.CompositeRenderer()),
            (this._priceNoteRenderer = new w()),
            (this._customLabelRenderer = new o.TextRenderer())
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          super._updateImpl(), this._renderer.clear()
          const e = this._source.priceScale()
          if (!e || e.isEmpty()) return
          const t = this._points
          if (t.length < 2) return
          const i = this._source.properties().childs(),
            a = this._model.isDark() ? s.colorsPalette['color-cold-gray-900'] : s.colorsPalette['color-white'],
            o = this._source.points()[0].price,
            l = Object(r.ensureNotNull)(this._source.ownerSource()).firstValue()
          if (null === l) return
          const h = e.formatPrice(o, l)
          if (
            (this._priceNoteRenderer.setData({
              text: h,
              points: t,
              lineColor: i.lineColor.value(),
              circleBorderColor: a,
              backgroundColor: i.priceLabelBackgroundColor.value(),
              borderColor: i.priceLabelBorderColor.value(),
              textColor: i.priceLabelTextColor.value(),
              fontSize: i.priceLabelFontSize.value(),
              bold: i.priceLabelBold.value(),
              italic: i.priceLabelItalic.value(),
            }),
            this._renderer.append(this._priceNoteRenderer),
            this._renderer.append(this.createLineAnchor({ points: t }, 0)),
            i.showLabel && i.showLabel.value())
          ) {
            const e = t[0],
              r = t[1],
              s = e.x < r.x ? e : r,
              a = s === e ? r : e,
              o = i.vertLabelsAlign.value(),
              l = i.horzLabelsAlign.value()
            let h
            h = 'left' === l ? s.clone() : 'right' === l ? a.clone() : new n.Point((e.x + r.x) / 2, (e.y + r.y) / 2)
            const d = Math.atan((a.y - s.y) / (a.x - s.x)),
              c = {
                points: [h],
                text: i.text.value(),
                color: i.textColor.value(),
                vertAlign: o,
                horzAlign: l,
                font: u.CHART_FONT_FAMILY,
                offsetX: 0,
                offsetY: 0,
                bold: i.bold.value(),
                italic: i.italic.value(),
                fontsize: i.fontSize.value(),
                forceTextAlign: !0,
                angle: d,
              }
            this._customLabelRenderer.setData(c), this._renderer.append(this._customLabelRenderer)
          }
        }
      }
    },
    '1SUO': function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('pJOz').TrendLineRenderer,
        s = i('cjIn').PaneRendererCachedImage,
        a = i('VdBB').HitTestResult,
        o = i('Zy3/').CompositeRenderer,
        l = i('isd9').ArcWedgeRenderer,
        h = i('a7Ha').LineEnd,
        d = i('NCfL').LineToolPaneViewWithLevelledTextCache
      t.FibWedgePaneView = class extends d {
        constructor(e, t) {
          super(e, t),
            (this._levels = []),
            (this._baseTrendRenderer = new n()),
            (this._edgeTrendRenderer = new n()),
            (this._renderer = null)
        }
        getCacheRects(e, t) {
          super.getCacheRects(e, t)
          var i = this._cacheState.preparedCells.cells[this._levels[t].index - 1]
          if (i) {
            var r = this._levels[t],
              n = {
                left: i.left,
                top: this._cache.topByRow(this._cacheState.row),
                width: i.width,
                height: this._cache.rowHeight(this._cacheState.row),
              }
            return {
              cacheRect: n,
              targetRect: {
                left: Math.round(r.labelPoint.x - n.width),
                top: Math.round(r.labelPoint.y - n.height / 2),
                width: i.width,
                height: n.height,
              },
            }
          }
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), (this._levels = []), this._points.length < 3))
            this._updateRenderer()
          else {
            var e = this._points,
              t = e[0],
              i = e[1],
              n = e[2],
              s = i.subtract(t).normalized(),
              a = n.subtract(t).normalized(),
              o = new r(1, 0),
              l = new r(0, 1),
              h = Math.acos(s.dotProduct(o))
            s.dotProduct(l) < 0 && (h = 2 * Math.PI - h), (this._edge1 = h)
            var d = Math.acos(a.dotProduct(o))
            a.dotProduct(l) < 0 && (d = 2 * Math.PI - d),
              (this._edge2 = d),
              h < d && ((this._edge1 = Math.max(h, d)), (this._edge2 = Math.min(h, d) + 2 * Math.PI)),
              Math.abs(h - d) > Math.PI &&
                ((this._edge1 = Math.min(h, d)), (this._edge2 = Math.max(h, d) - 2 * Math.PI))
            for (var c = this._source.properties(), u = 1; u <= this._source.levelsCount(); u++) {
              var _ = c['level' + u]
              if (_.visible.value()) {
                var p = _.coeff.value(),
                  f = _.color.value(),
                  g = i.subtract(t).length() * p,
                  v = s.add(a).scaled(0.5).normalized().scaled(g),
                  w = t.add(v)
                this._levels.push({
                  coeff: p,
                  color: f,
                  radius: g,
                  labelPoint: w,
                  p1: t.add(s.scaled(g)),
                  p2: t.add(a.scaled(g)),
                  linewidth: _.linewidth.value(),
                  linestyle: _.linestyle.value(),
                  index: u,
                })
              }
            }
            this._points.length < 2 || this._updateRenderer()
          }
        }
        _updateRenderer() {
          if (!((x = this._points).length < 2)) {
            var e = new o(),
              t = this._source.properties(),
              i = x[0],
              r = x[1],
              n = {
                points: [i, r],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: t.trendline.color.value(),
                linewidth: t.trendline.visible.value() ? t.trendline.linewidth.value() : 0,
                linestyle: t.trendline.linestyle.value(),
                extendleft: !1,
                extendright: !1,
                leftend: h.Normal,
                rightend: h.Normal,
              }
            if ((this._baseTrendRenderer.setData(n), e.append(this._baseTrendRenderer), x.length < 3))
              return this.addAnchors(e), void (this._renderer = e)
            var d = x[2],
              c = d.data,
              u = r.subtract(i).length(),
              _ = d.subtract(i).normalized()
            ;((d = i.add(_.scaled(u))).data = c),
              (n = {
                points: [i, d],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: t.trendline.color.value(),
                linewidth: t.trendline.visible.value() ? t.trendline.linewidth.value() : 0,
                linestyle: t.trendline.linestyle.value(),
                extendleft: !1,
                extendright: !1,
                leftend: h.Normal,
                rightend: h.Normal,
              }),
              this._edgeTrendRenderer.setData(n),
              e.append(this._edgeTrendRenderer)
            for (var p = this._levels.length - 1; p >= 0; p--) {
              var f = this._levels[p],
                g = {}
              ;(g.center = this._points[0]),
                (g.radius = f.radius),
                (g.prevRadius = p > 0 ? this._levels[p - 1].radius : 0),
                (g.edge = this._edge),
                (g.color = f.color),
                (g.linewidth = f.linewidth),
                (g.edge1 = this._edge1),
                (g.edge2 = this._edge2),
                (g.p1 = f.p1),
                (g.p2 = f.p2),
                (g.fillBackground = t.fillBackground.value()),
                (g.transparency = t.transparency.value())
              var v = new l()
              if ((v.setData(g), v.setHitTest(new a(a.MOVEPOINT, null, f.index)), e.append(v), t.showCoeffs.value())) {
                var w = new s(this, p)
                e.append(w)
              }
            }
            var x = [i, r]
            this._model.lineBeingCreated() !== this._source && x.push(d),
              e.append(this.createLineAnchor({ points: x }, 0)),
              (this._renderer = e)
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    '1oDZ': function (e, t, i) {
      'use strict'
      var r = i('aB9a').LineSourcePaneView,
        n = i('qgcf').TextRenderer,
        s = i('VdBB').HitTestResult,
        a = i('Zy3/').CompositeRenderer,
        o = i('gAom').drawHorizontalLine,
        l = i('Zp/P').interactionTolerance,
        h = i('jFln').setLineStyle
      class d {
        constructor() {
          this._data = null
        }
        setData(e) {
          this._data = e
        }
        draw(e, t) {
          if (null === this._data || 0 === this._data.points.length) return null
          var i = t.pixelRatio,
            r = e.canvas.width,
            n = this._data.points[0].y,
            s = Math.max(0, this._data.points[0].x),
            a = Math.max(r, this._data.points[0].x)
          ;(e.lineCap = 'butt'),
            (e.strokeStyle = this._data.color),
            (e.lineWidth = Math.max(1, Math.floor(this._data.linewidth * i))),
            void 0 !== this._data.linestyle && h(e, this._data.linestyle),
            o(e, Math.round(n * i), Math.round(s * i), Math.round(a * i))
        }
        hitTest(e) {
          if (null === this._data || 0 === this._data.points.length) return null
          if (e.x < this._data.points[0].x) return null
          var t = l().line
          return Math.abs(e.y - this._data.points[0].y) <= t ? new s(this._data.hitTestResult) : null
        }
      }
      t.HorzRayPaneView = class extends r {
        constructor(e, t) {
          super(e, t), (this._horzRayRenderer = new d()), (this._labelRenderer = new n()), (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          super._updateImpl(), (this._renderer = null)
          var e = this._source.properties(),
            t = new a(),
            i = {}
          if (
            ((i.points = this._points),
            (i.color = e.linecolor.value()),
            (i.linewidth = e.linewidth.value()),
            (i.linestyle = e.linestyle.value()),
            (i.hitTestResult = s.MOVEPOINT),
            this._horzRayRenderer.setData(i),
            t.append(this._horzRayRenderer),
            e.showLabel.value() && 1 === this._points.length)
          ) {
            var r = e.vertLabelsAlign.value(),
              n = e.horzLabelsAlign.value(),
              o = this._points[0].clone(),
              l = 0,
              h = e.text.value(),
              d = e.bold.value(),
              c = e.italic.value(),
              u = e.font.value(),
              _ = e.fontsize.value()
            if ('right' === n) {
              this._labelRenderer.setData({ text: h, font: u, bold: d, italic: c, fontsize: _ })
              var p = this._labelRenderer.measure().width,
                f = this._model.timeScale().width()
              o.x + p + 3 >= f ? (o.x += p + 3) : ((o.x = f), (l = 3))
            } else 'center' === n && (o.x = (o.x + this._model.timeScale().width()) / 2)
            var g = {
              points: [o],
              text: h,
              color: e.textcolor.value(),
              vertAlign: r,
              horzAlign: n,
              font: u,
              offsetX: l,
              offsetY: 0,
              bold: d,
              italic: c,
              fontsize: _,
              forceTextAlign: !0,
            }
            this._labelRenderer.setData(g), t.append(this._labelRenderer)
          }
          this.addAnchors(t), (this._renderer = t)
        }
      }
    },
    '2hKl': function (e, t, i) {
      'use strict'
      i.d(t, 'c', function () {
        return n
      }),
        i.d(t, 'a', function () {
          return s
        }),
        i.d(t, 'b', function () {
          return a
        })
      var r = i('GEp6')
      function n(e, t, i, n, s) {
        const a = i.subtract(e).length() + i.subtract(t).length(),
          o = Math.max(3 / a, 0.02)
        let l
        for (let a = 0; ; a += o) {
          a > 1 && (a = 1)
          const o = e.scaled((1 - a) * (1 - a)),
            h = i.scaled(2 * a * (1 - a)),
            d = t.scaled(a * a),
            c = o.add(h).add(d)
          if (void 0 !== l) {
            if (Object(r.distanceToSegment)(c, l, n).distance < s) return !0
          } else if (c.subtract(n).length() < s) return !0
          if (((l = c), 1 === a)) break
        }
        return !1
      }
      function s(e, t, i, n, s, a) {
        const o = i.subtract(e).length() + n.subtract(i).length() + t.subtract(n).length(),
          l = Math.max(3 / o, 0.02)
        let h
        for (let o = 0; ; o += l) {
          o > 1 && (o = 1)
          const l = e.scaled((1 - o) * (1 - o) * (1 - o)),
            d = i.scaled(3 * (1 - o) * (1 - o) * o),
            c = n.scaled(3 * (1 - o) * o * o),
            u = t.scaled(o * o * o),
            _ = l.add(d).add(c).add(u)
          if (void 0 !== h) {
            if (Object(r.distanceToSegment)(_, h, s).distance < a) return !0
          } else if (_.subtract(s).length() < a) return !0
          if (((h = _), 1 === o)) break
        }
        return !1
      }
      function a(e, t, i, r, n) {
        const s = i.subtract(e).length() + i.subtract(t).length()
        if (!s) return []
        const a = (function (e, t, i, r, n) {
          const s = [],
            a = o(e.y, t.y, i.y, 0).concat(o(e.y, t.y, i.y, n))
          for (let n = 0; n < a.length; n++) {
            const o = l(e.x, t.x, i.x, a[n])
            o >= 0 && o <= r && s.push(a[n])
          }
          const h = o(e.x, t.x, i.x, 0).concat(o(e.x, t.x, i.x, r))
          for (let r = 0; r < h.length; r++) {
            const a = l(e.y, t.y, i.y, h[r])
            a >= 0 && a <= n && s.push(h[r])
          }
          return s
        })(e, t, i, r, n)
          .filter(e => e > 1)
          .sort((e, t) => e - t)
        t.x >= 0 && t.x <= r && t.y >= 0 && t.y <= n && a.unshift(1)
        const h = 3 / s,
          d = []
        for (let r = 0; r < a.length - 1; r += 2) {
          let n = h,
            s = a[r],
            o = a[r + 1] + n
          const l = []
          for (; s <= o; ) {
            const r = e.scaled((1 - s) * (1 - s)),
              a = i.scaled(2 * s * (1 - s)),
              h = t.scaled(s * s),
              d = r.add(a).add(h)
            if (l.length > 0) {
              l[l.length - 1].subtract(d).length() < 2 && ((o += n), (n *= 2))
            }
            l.push(d), (s += n)
          }
          l.length > 0 && d.push(l)
        }
        return d
      }
      function o(e, t, i, r) {
        const n = [],
          s = e - 2 * i + t,
          a = 2 * i - 2 * e,
          o = e - r
        if (Math.abs(s) > 1e-8) {
          const e = a * a - 4 * s * o
          e >= 0 && (n.push((-a + Math.sqrt(e)) / (2 * s)), n.push((-a - Math.sqrt(e)) / (2 * s)))
        } else n.push(-o / a)
        return n
      }
      function l(e, t, i, r) {
        return (1 - r) * (1 - r) * e + 2 * (1 - r) * r * i + r * r * t
      }
    },
    '2trc': function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'ChannelRenderer', function () {
          return c
        })
      var r = i('Eyy1'),
        n = i('aO4+'),
        s = i('f6yo'),
        a = i('GEp6'),
        o = i('hBTJ'),
        l = i('VdBB'),
        h = i('Tmoa'),
        d = i('cPgM')
      class c extends d.ScaledPaneRenderer {
        constructor() {
          super(...arguments), (this._data = null)
        }
        setData(e) {
          this._data = e
        }
        hitTest(e, t) {
          if (null === this._data || !this._data.hittestOnBackground) return null
          const i = this._visiblePolygon(t)
          return null !== i && Object(s.pointInPolygon)(e, i)
            ? new l.HitTestResult(l.HitTestResult.MOVEPOINT_BACKGROUND)
            : null
        }
        _drawImpl(e, t) {
          if (null === this._data) return
          const i = this._visiblePolygon(t)
          if (null !== i) {
            e.beginPath(), e.moveTo(i[0].x, i[0].y)
            for (let t = 1; t < i.length; t++) e.lineTo(i[t].x, i[t].y)
            ;(e.fillStyle = Object(h.generateColor)(this._data.color, this._data.transparency, !0)), e.fill()
          }
        }
        _visiblePolygon(e) {
          const t = Object(r.ensureNotNull)(this._data),
            i = t.p1,
            s = t.p2,
            o = t.p3,
            l = t.p4
          if (
            Object(n.equalPoints)(i, s) ||
            Object(n.equalPoints)(o, l) ||
            (Object(a.distanceToLine)(i, s, o).distance < 1e-6 && Object(a.distanceToLine)(i, s, l).distance < 1e-6)
          )
            return null
          if (e.cssWidth <= 0 || e.cssHeight <= 0) return null
          let h = [
            new n.Point(0, 0),
            new n.Point(e.cssWidth, 0),
            new n.Point(e.cssWidth, e.cssHeight),
            new n.Point(0, e.cssHeight),
          ]
          return (
            (h = u(h, i, s, [l, o])),
            (h = u(h, l, o, [i, s])),
            Object(n.equalPoints)(o, i) || t.extendLeft || (h = u(h, o, i, [s, l])),
            h
          )
        }
      }
      function u(e, t, i, r) {
        const s = Object(n.equalPoints)(i, r[0]) ? (Object(n.equalPoints)(i, r[1]) ? null : r[1]) : r[0]
        return null !== e && null !== s
          ? Object(o.intersectPolygonAndHalfplane)(
              e,
              Object(n.halfplaneThroughPoint)(Object(n.lineThroughPoints)(t, i), s),
            )
          : null
      }
    },
    '3xLB': function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'DateRangePaneView', function () {
          return v
        })
      var r = i('aO4+'),
        n = i('YFKU'),
        s = i('Ialn'),
        a = i('aB9a'),
        o = i('qgcf'),
        l = i('IjC5'),
        h = i('pJOz'),
        d = i('Zy3/'),
        c = i('8Uy/'),
        u = i('a7Ha'),
        _ = i('nda6')
      const p = new (i('nEwK').VolumeFormatter)(),
        f = Object(n.t)('{count} bars'),
        g = Object(n.t)('Vol')
      class v extends a.LineSourcePaneView {
        constructor() {
          super(...arguments),
            (this._leftBorderRenderer = new h.TrendLineRenderer()),
            (this._rightBorderRenderer = new h.TrendLineRenderer()),
            (this._distancePriceRenderer = new h.TrendLineRenderer()),
            (this._backgroundRenderer = new l.RectangleRenderer()),
            (this._textRenderer = new o.TextRenderer()),
            (this._renderer = new d.CompositeRenderer())
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(e, t), this._renderer
        }
        _updateImpl(e, t) {
          if (
            (super._updateImpl(), this._renderer.clear(), this._points.length < 2 || this._source.points().length < 2)
          )
            return
          const i = this._source.properties().childs(),
            n = i.extendTop.value(),
            a = i.extendBottom.value(),
            [l, h] = this._points,
            d = n ? 0 : Math.min(l.y, h.y),
            v = a ? this._height() : Math.max(l.y, h.y)
          i.fillBackground.value() &&
            (this._backgroundRenderer.setData({
              points: [new r.Point(l.x, d), new r.Point(h.x, v)],
              color: 'white',
              linewidth: 0,
              backcolor: i.backgroundColor.value(),
              fillBackground: !0,
              transparency: i.backgroundTransparency.value(),
              extendLeft: !1,
              extendRight: !1,
            }),
            this._renderer.append(this._backgroundRenderer))
          const w = (e, t, r) => {
            e.setData({
              points: [t, r],
              color: i.linecolor.value(),
              linewidth: i.linewidth.value(),
              linestyle: c.LINESTYLE_SOLID,
              extendleft: !1,
              extendright: !1,
              leftend: u.LineEnd.Normal,
              rightend: u.LineEnd.Normal,
            }),
              this._renderer.append(e)
          }
          w(this._leftBorderRenderer, new r.Point(l.x, d), new r.Point(l.x, v)),
            w(this._rightBorderRenderer, new r.Point(h.x, d), new r.Point(h.x, v))
          const x = Math.round((l.y + h.y) / 2),
            m = new r.Point(l.x, x),
            y = new r.Point(h.x, x)
          this._distancePriceRenderer.setData({
            points: [m, y],
            color: i.linecolor.value(),
            linewidth: i.linewidth.value(),
            linestyle: c.LINESTYLE_SOLID,
            extendleft: !1,
            extendright: !1,
            leftend: u.LineEnd.Normal,
            rightend: Math.abs(m.x - y.x) >= 15 * i.linewidth.value() ? u.LineEnd.Arrow : u.LineEnd.Normal,
          }),
            this._renderer.append(this._distancePriceRenderer)
          const b = this._source.points()[0].index,
            R = this._source.points()[1].index,
            T = R - b,
            S = this._model.timeScale().indexToUserTime(b),
            P = this._model.timeScale().indexToUserTime(R)
          let L = ''
          if (S && P) {
            const e = (P.valueOf() - S.valueOf()) / 1e3
            L = ', ' + Object(s.startWithLTR)(new _.TimeSpanFormatter().format(e))
          }
          const C = this._source.volume(),
            M = Number.isNaN(C) ? '' : `\n${g} ${p.format(C)}`,
            I = { x: 0, y: 10 },
            O = {
              text: f.format({ count: Object(s.forceLTRStr)(T.toString()) }) + L + M,
              color: i.textcolor.value(),
              font: i.font.value(),
              offsetX: I.x,
              offsetY: I.y,
              padding: 8,
              vertAlign: 'middle',
              horzAlign: 'center',
              fontsize: i.fontsize.value(),
              backgroundRoundRect: 4,
              backgroundHorzInflate: 0.4 * i.fontsize.value(),
              backgroundVertInflate: 0.2 * i.fontsize.value(),
            }
          i.fillLabelBackground.value() && (O.backgroundColor = i.labelBackgroundColor.value()),
            this._textRenderer.setData(O)
          const N = this._textRenderer.measure(),
            D = Object(o.calculateLabelPosition)(N, l, h, I, e)
          this._textRenderer.setPoints([D]),
            this._renderer.append(this._textRenderer),
            this._renderer.append(this._textRenderer),
            this.addAnchors(this._renderer)
        }
      }
    },
    '4Ptp': function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'cacheIsValid', function () {
          return h
        }),
        i.d(t, 'BezierQuadroPaneView', function () {
          return d
        })
      var r = i('Eyy1'),
        n = i('Tmoa'),
        s = i('aB9a'),
        a = i('Zy3/'),
        o = i('2hKl'),
        l = i('e9yB')
      function h(e, t, i, r, n, s) {
        return (
          null !== e &&
          e.p1.x === t.x &&
          e.p1.y === t.y &&
          e.p2.x === i.x &&
          e.p2.y === i.y &&
          e.p3.x === r.x &&
          e.p3.y === r.y &&
          e.width === n &&
          e.height === s
        )
      }
      class d extends s.LineSourcePaneView {
        constructor() {
          super(...arguments),
            (this._bezierQuadroRenderer = new l.a()),
            (this._renderer = null),
            (this._extendedSegmentLeftCache = null),
            (this._extendedSegmentRightCache = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(e, t), this._renderer
        }
        _updateImpl(e, t) {
          if ((super._updateImpl(e, t), (this._renderer = null), this._points.length < 2)) return
          const i = this._source.properties().childs()
          let r = [],
            s = []
          if (3 === this._source.points().length) {
            const n = this._source.pointToScreenPoint(this._source.points()[0])[1],
              a = this._source.pointToScreenPoint(this._source.points()[1])[1],
              o = this._source.pointToScreenPoint(this._source.points()[2])[1],
              l = a.subtract(n),
              h = o.subtract(l.scaled(0.25)),
              d = o.add(l.scaled(0.25))
            i.extendLeft.value() && (r = this._extendSegmentLeft(o, n, h, t, e)),
              i.extendRight.value() && (s = this._extendSegmentRight(o, a, d, t, e))
          }
          const o = this._points.slice(),
            l = this._source.controlPoint()
          null !== l && o.push(this._source.pointToScreenPoint(l)[0])
          const h = {
            points: o,
            color: i.linecolor.value(),
            lineWidth: i.linewidth.value(),
            lineStyle: i.linestyle.value(),
            leftEnd: i.leftEnd.value(),
            rightEnd: i.rightEnd.value(),
            fillBack: i.fillBackground.value(),
            backColor: Object(n.generateColor)(i.backgroundColor.value(), i.transparency.value()),
            extendLeftSegments: r,
            extendRightSegments: s,
          }
          this._bezierQuadroRenderer.setData(h)
          const d = new a.CompositeRenderer()
          d.append(this._bezierQuadroRenderer), this.addAnchors(d), (this._renderer = d)
        }
        _extendSegmentLeft(e, t, i, n, s) {
          return (
            h(this._extendedSegmentLeftCache, e, t, i, n, s) ||
              (this._extendedSegmentLeftCache = {
                p1: e,
                p2: t,
                p3: i,
                width: n,
                height: s,
                segment: Object(o.b)(e, t, i, n, s),
              }),
            Object(r.ensureNotNull)(this._extendedSegmentLeftCache).segment
          )
        }
        _extendSegmentRight(e, t, i, n, s) {
          return (
            h(this._extendedSegmentRightCache, e, t, i, n, s) ||
              (this._extendedSegmentRightCache = {
                p1: e,
                p2: t,
                p3: i,
                width: n,
                height: s,
                segment: Object(o.b)(e, t, i, n, s),
              }),
            Object(r.ensureNotNull)(this._extendedSegmentRightCache).segment
          )
        }
      }
    },
    '5/lF': function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'iconsContainer', function () {
          return p
        }),
        i.d(t, 'TrendLineStatsRenderer', function () {
          return g
        })
      var r = i('aO4+'),
        n = i('f6yo'),
        s = i('Eyy1'),
        a = i('qFKp'),
        o = i('qgcf'),
        l = i('VdBB'),
        h = i('gAom'),
        d = i('ogJP'),
        c = i('ikwP'),
        u = i('KDMZ')
      let _ = null
      const p = new u.a(
          [
            {
              name: 'angle',
              theme: 'dark',
              imageData:
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zLjQ5OTk5IDE1SDIuNjU3NzFMMy4wNjEwNCAxNC4yNjA2TDkuMDYxMDQgMy4yNjA1N0w5LjMwMDQ2IDIuODIxNjJMMTAuMTc4NCAzLjMwMDQ4TDkuOTM4OTMgMy43Mzk0Mkw3LjUxMzg1IDguMTg1NDJDMTAuNTYyMSA5LjY3MjA1IDEwLjk0NTEgMTIuNjI2MSAxMC45OTMxIDE0SDE0LjVIMTVWMTVIMTQuNUgzLjQ5OTk5Wk05Ljk5MTk3IDE0QzkuOTQyMzYgMTIuNzI1OSA5LjU4NjI5IDEwLjI4OCA3LjAzNDM1IDkuMDY0NDlMNC4zNDIyNiAxNEg5Ljk5MTk3WiIgZmlsbD0iI0Y4RjlGRCIvPgo8L3N2Zz4K',
            },
            {
              name: 'angle',
              theme: 'light',
              imageData:
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMy40OTk5OSAxNUgyLjY1NzcxTDMuMDYxMDQgMTQuMjYwNkw5LjA2MTA0IDMuMjYwNTdMOS4zMDA0NiAyLjgyMTYyTDEwLjE3ODQgMy4zMDA0OEw5LjkzODkzIDMuNzM5NDJMNy41MTM4NSA4LjE4NTQyQzEwLjU2MjEgOS42NzIwNSAxMC45NDUxIDEyLjYyNjEgMTAuOTkzMSAxNEgxNC41SDE1VjE1SDE0LjVIMy40OTk5OVpNOS45OTE5NyAxNEM5Ljk0MjM2IDEyLjcyNTkgOS41ODYyOSAxMC4yODggNy4wMzQzNSA5LjA2NDQ5TDQuMzQyMjYgMTRIOS45OTE5N1oiIGZpbGw9IiMyQTJFMzkiLz4NCjwvc3ZnPg0K',
            },
            {
              name: 'barsRange',
              theme: 'dark',
              imageData:
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMiAzVjMuNVY1SDFWNlYxM1YxNEgyVjE1LjVWMTZIM1YxNS41VjE0SDRWMTNWNlY1SDNWMy41VjNIMlpNOC4yMDcxMSA3LjVMNy44NTM1NSA3Ljg1MzU1TDYuNzA3MTEgOUgxMS4yOTI5TDEwLjE0NjQgNy44NTM1NUw5Ljc5Mjg5IDcuNUwxMC41IDYuNzkyODlMMTAuODUzNiA3LjE0NjQ1TDEyLjg1MzYgOS4xNDY0NUwxMy4yMDcxIDkuNUwxMi44NTM2IDkuODUzNTVMMTAuODUzNiAxMS44NTM2TDEwLjUgMTIuMjA3MUw5Ljc5Mjg5IDExLjVMMTAuMTQ2NCAxMS4xNDY0TDExLjI5MjkgMTBINi43MDcxMUw3Ljg1MzU1IDExLjE0NjRMOC4yMDcxMSAxMS41TDcuNSAxMi4yMDcxTDcuMTQ2NDUgMTEuODUzNkw1LjE0NjQ1IDkuODUzNTVMNC43OTI4OSA5LjVMNS4xNDY0NSA5LjE0NjQ1TDcuMTQ2NDUgNy4xNDY0NUw3LjUgNi43OTI4OUw4LjIwNzExIDcuNVpNMyA2SDJWMTNIM1Y2Wk0xNSAzLjVWM0gxNlYzLjVWNUgxN1Y2VjEzVjE0SDE2VjE1LjVWMTZIMTVWMTUuNVYxNEgxNFYxM1Y2VjVIMTVWMy41Wk0xNSA2SDE2VjEzSDE1VjZaIiBmaWxsPSIjRjhGOUZEIi8+DQo8L3N2Zz4NCg==',
            },
            {
              name: 'barsRange',
              theme: 'light',
              imageData:
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMiAzVjMuNVY1SDFWNlYxM1YxNEgyVjE1LjVWMTZIM1YxNS41VjE0SDRWMTNWNlY1SDNWMy41VjNIMlpNOC4yMDcxMSA3LjVMNy44NTM1NSA3Ljg1MzU1TDYuNzA3MTEgOUgxMS4yOTI5TDEwLjE0NjQgNy44NTM1NUw5Ljc5Mjg5IDcuNUwxMC41IDYuNzkyODlMMTAuODUzNiA3LjE0NjQ1TDEyLjg1MzYgOS4xNDY0NUwxMy4yMDcxIDkuNUwxMi44NTM2IDkuODUzNTVMMTAuODUzNiAxMS44NTM2TDEwLjUgMTIuMjA3MUw5Ljc5Mjg5IDExLjVMMTAuMTQ2NCAxMS4xNDY0TDExLjI5MjkgMTBINi43MDcxMUw3Ljg1MzU1IDExLjE0NjRMOC4yMDcxMSAxMS41TDcuNSAxMi4yMDcxTDcuMTQ2NDUgMTEuODUzNkw1LjE0NjQ1IDkuODUzNTVMNC43OTI4OSA5LjVMNS4xNDY0NSA5LjE0NjQ1TDcuMTQ2NDUgNy4xNDY0NUw3LjUgNi43OTI4OUw4LjIwNzExIDcuNVpNMyA2SDJWMTNIM1Y2Wk0xNSAzLjVWM0gxNlYzLjVWNUgxN1Y2VjEzVjE0SDE2VjE1LjVWMTZIMTVWMTUuNVYxNEgxNFYxM1Y2VjVIMTVWMy41Wk0xNSA2SDE2VjEzSDE1VjZaIiBmaWxsPSIjMkEyRTM5Ii8+DQo8L3N2Zz4NCg==',
            },
            {
              name: 'priceRange',
              theme: 'dark',
              imageData:
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMyAySDMuNUgxMy41SDE0VjNIMTMuNUgzLjVIM1YyWk04LjUgMy43OTI4OUw4Ljg1MzU1IDQuMTQ2NDVMMTAuODUzNiA2LjE0NjQ1TDExLjIwNzEgNi41TDEwLjUgNy4yMDcxMUwxMC4xNDY0IDYuODUzNTVMOSA1LjcwNzExVjEyLjI5MjlMMTAuMTQ2NCAxMS4xNDY0TDEwLjUgMTAuNzkyOUwxMS4yMDcxIDExLjVMMTAuODUzNiAxMS44NTM2TDguODUzNTUgMTMuODUzNkw4LjUgMTQuMjA3MUw4LjE0NjQ1IDEzLjg1MzZMNi4xNDY0NSAxMS44NTM2TDUuNzkyODkgMTEuNUw2LjUgMTAuNzkyOUw2Ljg1MzU1IDExLjE0NjRMOCAxMi4yOTI5VjUuNzA3MTFMNi44NTM1NSA2Ljg1MzU1TDYuNSA3LjIwNzExTDUuNzkyODkgNi41TDYuMTQ2NDUgNi4xNDY0NUw4LjE0NjQ1IDQuMTQ2NDVMOC41IDMuNzkyODlaTTMuNSAxNkgzVjE1SDMuNUgxMy41SDE0VjE2SDEzLjVIMy41WiIgZmlsbD0iI0Y4RjlGRCIvPg0KPC9zdmc+DQo=',
            },
            {
              name: 'priceRange',
              theme: 'light',
              imageData:
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMyAySDMuNUgxMy41SDE0VjNIMTMuNUgzLjVIM1YyWk04LjUgMy43OTI4OUw4Ljg1MzU1IDQuMTQ2NDVMMTAuODUzNiA2LjE0NjQ1TDExLjIwNzEgNi41TDEwLjUgNy4yMDcxMUwxMC4xNDY0IDYuODUzNTVMOSA1LjcwNzExVjEyLjI5MjlMMTAuMTQ2NCAxMS4xNDY0TDEwLjUgMTAuNzkyOUwxMS4yMDcxIDExLjVMMTAuODUzNiAxMS44NTM2TDguODUzNTUgMTMuODUzNkw4LjUgMTQuMjA3MUw4LjE0NjQ1IDEzLjg1MzZMNi4xNDY0NSAxMS44NTM2TDUuNzkyODkgMTEuNUw2LjUgMTAuNzkyOUw2Ljg1MzU1IDExLjE0NjRMOCAxMi4yOTI5VjUuNzA3MTFMNi44NTM1NSA2Ljg1MzU1TDYuNSA3LjIwNzExTDUuNzkyODkgNi41TDYuMTQ2NDUgNi4xNDY0NUw4LjE0NjQ1IDQuMTQ2NDVMOC41IDMuNzkyODlaTTMuNSAxNkgzVjE1SDMuNUgxMy41SDE0VjE2SDEzLjVIMy41WiIgZmlsbD0iIzJBMkUzOSIvPg0KPC9zdmc+DQo=',
            },
          ],
          18,
        ),
        f = new Map()
      class g {
        constructor(e, t, i) {
          ;(this._fontSize = 0),
            (this._preRendered = !1),
            (this._boundingBox = null),
            (this._rect = null),
            (this._padding = null),
            (this._textPoint = null),
            (this._textSizeCache = t),
            (this._data = e),
            (this._fontSize = e.fontSize ? e.fontSize : 12),
            (this._lineSpacing =
              Object(d.isNumber)(this._data.lineSpacing) && this._data.lineSpacing ? this._data.lineSpacing : 0),
            (e.lines = this._lines =
              null === e.text ? [] : Object(o.wordWrap)(e.text, this.fontStyle(), e.wordWrapWidth)),
            (this._hittest = i || new l.HitTestResult(l.HitTestResult.MOVEPOINT))
        }
        fontStyle() {
          return `${this._data.bold ? 'bold ' : ''}${this._data.italic ? 'italic ' : ''}${this._fontSize}px ${
            this._data.font
          }`
        }
        draw(e, t) {
          if (0 === this._data.points.length || null === this._data.text) return { width: 0 }
          this._preRender()
          const i = this._fontSize + this._lineSpacing
          ;(e.textBaseline = 'top'), (e.font = this.fontStyle())
          const r = Object(s.ensureNotNull)(this._rect)
          if (this._rect) {
            if (
              (('right' !== this._data.horzAlign && 'center' !== this._data.horzAlign) ||
                (!0 !== this._data.doNotAlignText &&
                  (e.textAlign = 'right' === this._data.horzAlign ? 'end' : 'center')),
              this._data.backgroundRoundRect
                ? (Object(h.drawRoundRect)(e, r.x, r.y, r.w, r.h, this._data.backgroundRoundRect),
                  (e.fillStyle = this._data.backgroundColor),
                  e.fill(),
                  (e.globalAlpha = 1))
                : ((e.fillStyle = this._data.backgroundColor), e.fillRect(r.x, r.y, r.w, r.h), (e.globalAlpha = 1)),
              !a.isIE && this._data.icons)
            ) {
              let n = 0
              const a = Math.ceil((18 - this._fontSize) / 2),
                o = Object(s.ensureNotNull)(this._padding)
              for (const s of this._data.icons) {
                const l = Math.round(r.x + o.left),
                  h = Math.round(r.y + o.top + i * n - a)
                this._drawIcon(e, l, h, s, Boolean(this._data.isDark), t), (n += 1)
              }
            }
          } else
            'right' === this._data.horzAlign
              ? (e.textAlign = 'end')
              : 'center' === this._data.horzAlign && (e.textAlign = 'center')
          const n = Object(s.ensureNotNull)(this._textPoint),
            o = n.x
          let l = n.y
          e.fillStyle = this._data.color
          for (const t of this._lines) e.fillText(t, o, l), (l += i)
          return { width: r.w + 2 }
        }
        hitTest(e) {
          return 0 === this._data.points.length
            ? null
            : (this._preRender(),
              this._boundingBox && Object(n.pointInBox)(e, this._boundingBox) ? this._hittest : null)
        }
        _preRender() {
          if (this._preRendered) return
          const e = (function () {
              if (null !== _) return _
              const e = Object(c.createDisconnectedCanvas)(document, new c.Size(0, 0))
              return (_ = Object(c.getPrescaledContext2D)(e)), _
            })(),
            t = this._data.points[0].x + (this._data.offsetX || 0)
          let i = t
          const n = this._data.points[0].y + (this._data.offsetY || 0)
          let s = n
          const o = this._fontSize,
            l = this._lineSpacing,
            h = (o + l) * this._lines.length - l
          ;(e.textBaseline = 'top'), (e.font = this.fontStyle())
          const d = []
          let u
          if (this._data.wordWrapWidth) {
            u = this._data.wordWrapWidth
            for (let e = 0; e < this._lines.length; e++) d.push(this._data.wordWrapWidth)
          } else {
            u = 0
            for (let t = 0; t < this._lines.length; t++) {
              const i = e.measureText(this._lines[t]).width
              d.push(i), (u = Math.max(u, i))
            }
          }
          const p = {
              top: this._data.paddingTop,
              right: this._data.paddingRight,
              bottom: this._data.paddingBottom,
              left: this._data.paddingLeft,
            },
            f = {
              x: Math.floor(t),
              y: Math.floor(n),
              w: Math.ceil(u + p.left + p.right),
              h: Math.ceil(h + p.top + p.bottom),
            }
          if (((i += p.left), (s += p.top), !a.isIE && this._data.icons)) {
            const e = void 0 !== this._data.textPadding ? this._data.textPadding : Math.round(o / 2)
            ;(i += 18 + e), (f.w += 18 + e)
          }
          if ('bottom' === this._data.vertAlign || 'middle' === this._data.vertAlign) {
            const e = 'middle' === this._data.vertAlign ? n - f.h / 2 : n - f.h - (f.y - n)
            ;(s += e - f.y), (f.y = e)
          }
          if ('right' === this._data.horzAlign || 'center' === this._data.horzAlign) {
            const r = 'center' === this._data.horzAlign ? t - f.w / 2 : t - f.w - (f.x - t)
            ;(i += r - f.x),
              (f.x = r),
              !0 !== this._data.doNotAlignText &&
                ('right' === this._data.horzAlign
                  ? ((e.textAlign = 'end'), (i += u))
                  : ((e.textAlign = 'center'), (i += u / 2)))
          }
          f.w % 2 != 0 && f.w++,
            (f.x += 0.5),
            (f.y += 0.5),
            (this._boundingBox = Object(r.box)(new r.Point(f.x, f.y), new r.Point(f.x + f.w, f.y + f.h))),
            (this._rect = f),
            (this._padding = p),
            (this._textPoint = { x: i, y: s }),
            this._textSizeCache && (this._textSizeCache.widths = d),
            (this._preRendered = !0)
        }
        _drawIcon(e, t, i, r, n, o) {
          const l = `${r}${this._data.isDark}${o.pixelRatio}`
          let h = f.get(l)
          if (!h) {
            ;(h = document.createElement('canvas')),
              (h.width = 18 * o.pixelRatio),
              (h.height = 18 * o.pixelRatio),
              (h.style.width = '18px'),
              (h.style.height = '18px')
            const e = Object(s.ensureNotNull)(h.getContext('2d'))
            e.setTransform(1, 0, 0, 1, 0, 0), a.isEdge || e.scale(o.pixelRatio, o.pixelRatio)
            const t = p.getIcon(r, n ? 'dark' : 'light')
            t.ready() && (e.drawImage(t.image(), 0, 0), f.set(l, h))
          }
          e.drawImage(h, t - 0.5, i - 0.5, 18, 18)
        }
      }
    },
    '6MfG': function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'Pattern5pointsPaneView', function () {
          return _
        })
      var r = i('8Uy/'),
        n = i('a7Ha'),
        s = i('Zy3/'),
        a = i('qgcf'),
        o = i('/S7V'),
        l = i('pJOz'),
        h = i('zXvd'),
        d = i('VdBB'),
        c = i('BCbF'),
        u = i('aB9a')
      class _ extends u.LineSourcePaneView {
        constructor(e, t) {
          super(e, t),
            (this._abRetracement = NaN),
            (this._bcRetracement = NaN),
            (this._cdRetracement = NaN),
            (this._xdRetracement = NaN),
            (this._numericFormatter = new h.NumericFormatter()),
            (this._bcRetracementTrend = new l.TrendLineRenderer()),
            (this._xdRetracementTrend = new l.TrendLineRenderer()),
            (this._xbTrend = new l.TrendLineRenderer()),
            (this._bdTrend = new l.TrendLineRenderer()),
            (this._polylineRenderer = new c.PolygonRenderer(new d.HitTestResult(d.HitTestResult.MOVEPOINT))),
            (this._mainTriangleRenderer = new o.TriangleRenderer()),
            (this._triangleRendererPoints234 = new o.TriangleRenderer()),
            (this._xbLabelRenderer = new a.TextRenderer()),
            (this._acLabelRenderer = new a.TextRenderer()),
            (this._bdLabelRenderer = new a.TextRenderer()),
            (this._xdLabelRenderer = new a.TextRenderer()),
            (this._textRendererALabel = new a.TextRenderer()),
            (this._textRendererBLabel = new a.TextRenderer()),
            (this._textRendererCLabel = new a.TextRenderer()),
            (this._textRendererDLabel = new a.TextRenderer()),
            (this._textRendererXLabel = new a.TextRenderer()),
            (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if ((super._updateImpl(), this._updateBaseData(), (this._renderer = null), this._points.length < 2)) return
          const e = this._source.properties().childs(),
            t = new s.CompositeRenderer(),
            i = (t, i) => ({
              points: [t],
              text: i,
              color: e.textcolor.value(),
              vertAlign: 'middle',
              horzAlign: 'center',
              font: e.font.value(),
              offsetX: 0,
              offsetY: 0,
              bold: e.bold && e.bold.value(),
              italic: e.italic && e.italic.value(),
              fontsize: e.fontsize.value(),
              backgroundColor: e.color.value(),
              backgroundRoundRect: 4,
            }),
            a = (t, i) => ({
              points: [t, i],
              color: e.color.value(),
              linewidth: 1,
              linestyle: r.LINESTYLE_DOTTED,
              extendleft: !1,
              extendright: !1,
              leftend: n.LineEnd.Normal,
              rightend: n.LineEnd.Normal,
            }),
            [o, l, h, d, c] = this._points,
            u = {
              points: [o, l, this._points.length < 3 ? l : h],
              color: 'rgba(0, 0, 0, 0)',
              linewidth: e.linewidth.value(),
              backcolor: e.backgroundColor.value(),
              fillBackground: e.fillBackground.value(),
              transparency: e.transparency.value(),
            }
          if ((this._mainTriangleRenderer.setData(u), t.append(this._mainTriangleRenderer), this._points.length > 3)) {
            const i = {
              points: [h, d, 5 === this._points.length ? c : d],
              color: 'rgba(0, 0, 0, 0)',
              linewidth: e.linewidth.value(),
              backcolor: e.backgroundColor.value(),
              fillBackground: e.fillBackground.value(),
              transparency: e.transparency.value(),
            }
            this._triangleRendererPoints234.setData(i), t.append(this._triangleRendererPoints234)
          }
          const _ = {
            points: this._points,
            color: e.color.value(),
            linewidth: e.linewidth.value(),
            backcolor: e.backgroundColor.value(),
            fillBackground: !1,
            linestyle: r.LINESTYLE_SOLID,
            filled: !1,
          }
          if ((this._polylineRenderer.setData(_), t.append(this._polylineRenderer), this._points.length >= 3)) {
            const e = i(o.add(h).scaled(0.5), this._numericFormatter.format(this._abRetracement))
            this._xbLabelRenderer.setData(e),
              t.append(this._xbLabelRenderer),
              this._xbTrend.setData(a(o, h)),
              t.append(this._xbTrend)
          }
          if (this._points.length >= 4) {
            this._bcRetracementTrend.setData(a(l, d)), t.append(this._bcRetracementTrend)
            const e = i(l.add(d).scaled(0.5), this._numericFormatter.format(this._bcRetracement))
            this._acLabelRenderer.setData(e), t.append(this._acLabelRenderer)
          }
          if (this._points.length >= 5) {
            const e = i(h.add(c).scaled(0.5), this._numericFormatter.format(this._cdRetracement))
            this._bdLabelRenderer.setData(e),
              t.append(this._bdLabelRenderer),
              this._xdRetracementTrend.setData(a(o, c)),
              t.append(this._xdRetracementTrend)
            const r = i(o.add(c).scaled(0.5), this._numericFormatter.format(this._xdRetracement))
            this._xdLabelRenderer.setData(r),
              t.append(this._xdLabelRenderer),
              this._bdTrend.setData(a(h, c)),
              t.append(this._bdTrend)
          }
          const p = i(o, 'X')
          l.y > o.y ? ((p.vertAlign = 'bottom'), (p.offsetY = 5)) : ((p.vertAlign = 'top'), (p.offsetY = 5)),
            this._textRendererXLabel.setData(p),
            t.append(this._textRendererXLabel)
          const f = i(l, 'A')
          if (
            (l.y < o.y ? ((f.vertAlign = 'bottom'), (f.offsetY = 5)) : ((f.vertAlign = 'top'), (f.offsetY = 5)),
            this._textRendererALabel.setData(f),
            t.append(this._textRendererALabel),
            this._points.length > 2)
          ) {
            const e = i(h, 'B')
            h.y < l.y ? ((e.vertAlign = 'bottom'), (e.offsetY = 5)) : ((e.vertAlign = 'top'), (e.offsetY = 5)),
              this._textRendererBLabel.setData(e),
              t.append(this._textRendererBLabel)
          }
          if (this._points.length > 3) {
            const e = i(d, 'C')
            d.y < h.y ? ((e.vertAlign = 'bottom'), (e.offsetY = 5)) : ((e.vertAlign = 'top'), (e.offsetY = 5)),
              this._textRendererCLabel.setData(e),
              t.append(this._textRendererCLabel)
          }
          if (this._points.length > 4) {
            const e = i(c, 'D')
            c.y < d.y ? ((e.vertAlign = 'bottom'), (e.offsetY = 5)) : ((e.vertAlign = 'top'), (e.offsetY = 5)),
              this._textRendererDLabel.setData(e),
              t.append(this._textRendererDLabel)
          }
          this.addAnchors(t), (this._renderer = t)
        }
        _updateBaseData() {
          if (this._source.points().length >= 3) {
            const [e, t, i] = this._source.points()
            this._abRetracement = Math.round(1e3 * Math.abs((i.price - t.price) / (t.price - e.price))) / 1e3
          }
          if (this._source.points().length >= 4) {
            const [, e, t, i] = this._source.points()
            this._bcRetracement = Math.round(1e3 * Math.abs((i.price - t.price) / (t.price - e.price))) / 1e3
          }
          if (this._source.points().length >= 5) {
            const [e, t, i, r, n] = this._source.points()
            ;(this._cdRetracement = Math.round(1e3 * Math.abs((n.price - r.price) / (r.price - i.price))) / 1e3),
              (this._xdRetracement = Math.round(1e3 * Math.abs((n.price - t.price) / (t.price - e.price))) / 1e3)
          }
        }
      }
    },
    '6sSH': function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('IjC5').RectangleRenderer,
        s = i('pJOz').TrendLineRenderer,
        a = i('cjIn').PaneRendererCachedImage,
        o = i('VdBB').HitTestResult,
        l = i('Zy3/').CompositeRenderer,
        h = i('a7Ha').LineEnd,
        d = i('d1Pk').fibLevelCoordinate,
        c = i('NCfL').LineToolPaneViewWithLevelledTextCache,
        u = i('xUGI')
      class _ extends u {
        _selectStartPrice(e) {
          return e.points()[2].price
        }
        priceRange(e, t) {
          var i = this.points(e),
            r = i[0],
            n = i[1],
            s = t ? r.price - n.price : n.price - r.price
          if (!this._calculateLogLevels(e)) return { price: s }
          var a = e.priceScale(),
            o = e.ownerSource().firstValue(),
            l = a.priceToCoordinate(r.price, o),
            h = a.priceToCoordinate(n.price, o)
          return { price: s, coordinate: t ? l - h : h - l }
        }
      }
      t.TrendBasedFibExtensionPaneView = class extends c {
        constructor(e, t) {
          super(e, t),
            (this._rendererCache = {}),
            (this._trendLineRendererPoints12 = new s()),
            (this._trendLineRendererPoints23 = new s()),
            (this._renderer = null)
        }
        getCacheRects(e, t) {
          super.getCacheRects(e, t)
          var i = this._cacheState.preparedCells.cells[this._levels[t].index - 1]
          if (i) {
            var n = this._points[1],
              s = this._points[2],
              a = Math.min(n.x, s.x),
              o = Math.max(n.x, s.x)
            ;(n = new r(a, this._levels[t].y)), (s = new r(o, this._levels[t].y))
            var l,
              h = this._source.properties(),
              d = h.extendLines.value() ? this._model.timeScale().width() : o
            switch (h.horzLabelsAlign.value()) {
              case 'left':
                l = n
                break
              case 'center':
                ;((l = n.add(s).scaled(0.5)).x += i.width / 2), (l.x = Math.round(l.x))
                break
              case 'right':
                h.extendLines.value()
                  ? (l = new r(d - 4, this._levels[t].y))
                  : (((l = new r(d + 4, this._levels[t].y)).x += i.width), (l.x = Math.round(l.x)))
            }
            var c = {
                left: i.left,
                top: this._cache.topByRow(this._cacheState.row),
                width: i.width,
                height: this._cache.rowHeight(this._cacheState.row),
              },
              u = { left: l.x - c.width, top: l.y, width: i.width, height: c.height },
              _ = h.vertLabelsAlign.value()
            return (
              'middle' === _ && (u.top -= u.height / 2),
              'bottom' === _ && (u.top -= u.height),
              { cacheRect: c, targetRect: u }
            )
          }
        }
        _createCache(e) {
          return new _(this._source.properties().fibLevelsBasedOnLogScale, this._source.levelsCount(), e)
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), 3 === this._source.points().length)) {
            var e = this._source.priceScale()
            if (!e || e.isEmpty() || this._model.timeScale().isEmpty()) return
            var t = this._source.ownerSource().firstValue()
            if (null == t) return
            var i = this._source.points()[0],
              c = this._source.points()[1],
              u = this._source.points()[2],
              _ = !1
            ;(C = this._source.properties()).reverse && C.reverse.value() && (_ = C.reverse.value()),
              (this._levels = [])
            var p,
              f,
              g = _ ? i.price : c.price,
              v = _ ? c.price : i.price,
              w = g - v,
              x = e.isLog() && C.fibLevelsBasedOnLogScale.value()
            if (x) (p = e.priceToCoordinate(g, t) - e.priceToCoordinate(v, t)), (f = e.priceToCoordinate(u.price, t))
            for (
              var m = { price: u.price, coordinate: f },
                y = { price: w, coordinate: p },
                b = this._source.levelsCount(),
                R = 1;
              R <= b;
              R++
            ) {
              var T = C['level' + R]
              if (T.visible.value()) {
                var S = T.coeff.value(),
                  P = T.color.value(),
                  L = d(m, y, S, e, t, x)
                this._levels.push({
                  color: P,
                  y: L,
                  linewidth: C.levelsStyle.linewidth.value(),
                  linestyle: C.levelsStyle.linestyle.value(),
                  index: R,
                })
              }
            }
          }
          if (!(this._points.length < 2)) {
            var C,
              M = new l()
            ;(i = this._points[0]), (c = this._points[1])
            if ((C = this._source.properties()).trendline.visible.value()) {
              var I = {
                points: [i, c],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: C.trendline.color.value(),
                linewidth: C.trendline.linewidth.value(),
                linestyle: C.trendline.linestyle.value(),
                extendleft: !1,
                extendright: !1,
                leftend: h.Normal,
                rightend: h.Normal,
              }
              this._trendLineRendererPoints12.setData(I), M.append(this._trendLineRendererPoints12)
            }
            if (this._points.length < 3) return this.addAnchors(M), void (this._renderer = M)
            u = this._points[2]
            if (C.trendline.visible.value()) {
              I = {
                points: [c, u],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: C.trendline.color.value(),
                linewidth: C.trendline.linewidth.value(),
                linestyle: C.trendline.linestyle.value(),
                extendleft: !1,
                extendright: !1,
                leftend: h.Normal,
                rightend: h.Normal,
              }
              this._trendLineRendererPoints23.setData(I), M.append(this._trendLineRendererPoints23)
            }
            var O = Math.min(u.x, c.x),
              N = Math.max(u.x, c.x),
              D = C.fillBackground.value(),
              B = C.transparency.value(),
              k = C.extendLinesLeft.value(),
              A = C.extendLines.value()
            if (D)
              for (R = 0; R < this._levels.length; R++)
                if (R > 0 && D) {
                  var E = this._levels[R - 1],
                    z = ((i = new r(O, this._levels[R].y)), (c = new r(N, E.y)), {})
                  ;(z.points = [i, c]),
                    (z.color = this._levels[R].color),
                    (z.linewidth = 0),
                    (z.backcolor = this._levels[R].color),
                    (z.fillBackground = !0),
                    (z.transparency = B),
                    (z.extendLeft = k),
                    (z.extendRight = A)
                  var j = new n(void 0, void 0, !0)
                  j.setData(z), M.append(j)
                }
            var V = O,
              H = N
            V === H && (k && (V -= 1), A && (H += 1))
            for (R = 0; R < this._levels.length; R++) {
              I = {
                points: [(i = new r(V, this._levels[R].y)), (c = new r(H, this._levels[R].y))],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: this._levels[R].color,
                linewidth: this._levels[R].linewidth,
                linestyle: this._levels[R].linestyle,
                extendleft: k,
                extendright: A,
                leftend: h.Normal,
                rightend: h.Normal,
              }
              var W = new s()
              if (
                (W.setData(I),
                W.setHitTest(new o(o.MOVEPOINT, null, this._levels[R].index)),
                M.append(W),
                C.showCoeffs.value() || C.showPrices.value())
              ) {
                var F = new a(this, R)
                M.append(F)
              }
            }
            this.addAnchors(M), (this._renderer = M)
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    '8GeE': function (e, t, i) {
      'use strict'
      i.r(t)
      var r = i('aO4+'),
        n = i('hfHJ'),
        s = i('Zy3/'),
        a = i('a7Ha'),
        o = i('8Uy/'),
        l = i('//lt'),
        h = i('pJOz'),
        d = i('aB9a'),
        c = i('Ialn'),
        u = i('ikwP'),
        _ = i('cPgM'),
        p = i('VdBB')
      class f extends _.ScaledPaneRenderer {
        constructor(e) {
          super(), (this._data = null), (this._cache = e)
        }
        setData(e) {
          this._data = e
        }
        hitTest(e, t) {
          if (null === this._data) return null
          const i = 65536 * this._data.icon + this._data.size,
            r = this._cache[i] * this._data.scale,
            s = Object(n.rotationMatrix)(-this._data.angle)
          let a = e.subtract(this._data.point)
          return (
            (a = Object(n.transformPoint)(s, a)),
            Math.abs(a.y) <= r / 2 && Math.abs(a.x) <= this._data.size / 2
              ? new p.HitTestResult(p.HitTestResult.MOVEPOINT)
              : null
          )
        }
        _drawImpl(e, t) {
          if (null === this._data) return
          const i = String.fromCharCode(this._data.icon)
          e.font = this._data.size + 'px FontAwesome'
          const r = e.measureText(i).width
          e.textBaseline = 'middle'
          const n = this._data.point
          e.translate(n.x, n.y), e.rotate(this._data.angle - Math.PI / 2), e.scale(this._data.scale, 1)
          const s = 65536 * this._data.icon + this._data.size
          e.textAlign = Object(c.isRtl)() ? 'right' : 'left'
          const a = Object(u.calcTextHorizontalShift)(e, r)
          ;(this._cache[s] = r),
            this._data.selected &&
              ((e.fillStyle = 'rgba(80, 80, 80, 0.2)'),
              e.fillRect(-this._cache[s] / 2, -this._data.size / 2, this._cache[s], this._data.size)),
            (e.fillStyle = this._data.color),
            e.fillText(i, -this._cache[s] / 2 + a, 0)
        }
      }
      i.d(t, 'IconPaneView', function () {
        return g
      })
      class g extends d.LineSourcePaneView {
        constructor() {
          super(...arguments),
            (this._cache = {}),
            (this._dashRenderer = new h.TrendLineRenderer()),
            (this._iconRenderer = new f(this._cache)),
            (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), this._points.length < 1)) return
          const e = new s.CompositeRenderer(),
            t = this._source.properties().childs(),
            i = {
              point: this._points[0],
              color: t.color.value(),
              size: t.size.value(),
              icon: t.icon.value(),
              angle: t.angle.value(),
              scale: t.scale.value(),
              selected: this.areAnchorsVisible(),
            }
          this._iconRenderer.setData(i), e.append(this._iconRenderer)
          const h = 65536 * i.icon + i.size,
            c = this._cache[h],
            u = i.size,
            _ = this._points[0],
            p = t.scale.value(),
            f = this._source.getAnchorLimit()
          let g = new r.Point(Math.max(f, u) / 2, 0),
            v = new r.Point(0, Math.max(f, p * c) / 2)
          const w = Object(n.rotationMatrix)(t.angle.value())
          ;(g = Object(n.transformPoint)(w, g)), (v = Object(n.transformPoint)(w, v))
          const x = _.add(g)
          x.data = 0
          const m = _.subtract(g)
          m.data = 1
          const y = _.add(v)
          ;(y.data = 2), (y.square = !0)
          const b = _.subtract(v)
          if (((b.data = 3), (b.square = !0), this.areAnchorsVisible())) {
            const t = {
              points: [x, m],
              color: '#808080',
              linewidth: 1,
              linestyle: o.LINESTYLE_DASHED,
              extendleft: !1,
              extendright: !1,
              leftend: a.LineEnd.Normal,
              rightend: a.LineEnd.Normal,
            }
            this._dashRenderer.setData(t), e.append(this._dashRenderer)
          }
          const R = Object(d.thirdPointCursorType)(x, m),
            T = [l.PaneCursorType.Default, l.PaneCursorType.Default, R, R]
          e.append(this.createLineAnchor({ points: [x, m, y, b], pointsCursorType: T }, 0)), (this._renderer = e)
        }
      }
    },
    '8MBc': function (e, t, i) {
      'use strict'
      var r = i('aB9a').LineSourcePaneView,
        n = i('pJOz').TrendLineRenderer,
        s = i('VdBB').HitTestResult,
        a = i('Zy3/').CompositeRenderer,
        o = i('a7Ha').LineEnd,
        l = i('cPgM').ScaledPaneRenderer
      class h extends l {
        constructor() {
          super(), (this._data = null)
        }
        setData(e) {
          this._data = e
        }
        _fibNumbers() {
          return [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
        }
        _continiusFib(e) {
          var t = this._fibNumbers(),
            i = Math.floor(e),
            r = Math.ceil(e)
          if (r >= t.length) return null
          var n = e - i
          n = Math.pow(n, 1.15)
          var s = t[r] - t[i]
          return t[i] + s * n
        }
        hitTest(e) {
          if (null === this._data) return null
          var t = this._data.points[0],
            i = this._data.points[1].subtract(t),
            r = e.subtract(t),
            n = i.normalized(),
            a = n.transposed(),
            o = r.normalized(),
            l = Math.acos(n.dotProduct(o))
          Math.asin(a.dotProduct(o)) < 0 && (l = 2 * Math.PI - l)
          for (var h = this._data.counterclockwise ? -1 : 1, d = r.length(), c = 0; c < 4; c++) {
            var u = (h * l) / (0.5 * Math.PI),
              _ = this._continiusFib(u + 4 * c)
            if (null !== (_ = (_ * i.length()) / 5) && Math.abs(_ - d) < 5) return new s(s.MOVEPOINT)
          }
          return null
        }
        _drawImpl(e) {
          if (null !== this._data) {
            ;(e.lineCap = 'round'), (e.strokeStyle = this._data.color)
            var t = this._data.points[0],
              i = this._data.points[1]
            e.translate(t.x, t.y)
            var r = i.subtract(t),
              n = r.length()
            r = r.normalized()
            var s = Math.acos(r.x)
            Math.asin(r.y) < 0 && (s = 2 * Math.PI - s),
              e.rotate(s),
              e.scale(n / 5, n / 5),
              (e.lineWidth = this._data.linewidth),
              CanvasEx.setLineStyle(e, this._data.linestyle)
            var a = Math.PI / 100
            e.moveTo(0, 0)
            for (var o = this._data.counterclockwise ? -1 : 1, l = 0; l < 50 * (this._fibNumbers().length - 1); l++) {
              var h = o * l * a,
                d = this._continiusFib(l / 50),
                c = Math.cos(h) * d,
                u = Math.sin(h) * d
              e.lineTo(c, u)
            }
            e.scale(5 / n, 5 / n), e.rotate(-s), e.stroke()
          }
        }
      }
      t.FibSpiralPaneView = class extends r {
        constructor(e, t) {
          super(e, t), (this._trendLineRenderer = new n()), (this._spiralRenderer = new h()), (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), !(this._floatPoints.length < 2))) {
            var e,
              t = new a()
            ;((e = {}).points = this._floatPoints),
              (e.width = this._model.timeScale().width()),
              (e.height = this._source.priceScale().height()),
              (e.color = this._source.properties().linecolor.value()),
              (e.linewidth = this._source.properties().linewidth.value()),
              (e.linestyle = this._source.properties().linestyle.value()),
              (e.extendleft = !1),
              (e.extendright = !0),
              (e.leftend = o.Normal),
              (e.rightend = o.Normal),
              this._trendLineRenderer.setData(e),
              t.append(this._trendLineRenderer),
              ((e = {}).points = this._floatPoints),
              (e.width = this._model.timeScale().width()),
              (e.height = this._source.priceScale().height()),
              (e.color = this._source.properties().linecolor.value()),
              (e.linewidth = this._source.properties().linewidth.value()),
              (e.linestyle = this._source.properties().linestyle.value()),
              (e.counterclockwise = this._source.properties().counterclockwise.value()),
              this._spiralRenderer.setData(e),
              t.append(this._spiralRenderer),
              this.addAnchors(t),
              (this._renderer = t)
          }
        }
      }
    },
    '8xAY': function (e, t, i) {
      'use strict'
      var r
      i.r(t),
        i.d(t, 'LabelSettings', function () {
          return r
        }),
        (function (e) {
          ;(e.offset = 8),
            (e.fontSize = 12),
            (e.lineSpacing = 16),
            (e.rectRadius = 4),
            (e.bgColorLight = 'rgba(227,242,253,0.9)'),
            (e.bgColorDark = 'rgba(67,70,81,0.9)'),
            (e.textColorLight = '#2A2E39'),
            (e.textColorDark = '#F8F9FD'),
            (e.textPadding = 10),
            (e.paddingTopBottom = 13),
            (e.paddingLeftRight = 10)
        })(r || (r = {}))
    },
    '9FRF': function (e, t, i) {
      'use strict'
      var r = i('aB9a').LineSourcePaneView,
        n = i('NN6M').ParallelChannelRenderer,
        s = i('Zy3/').CompositeRenderer,
        a = i('//lt').PaneCursorType,
        o = [a.Default, a.Default, a.Default, a.Default, a.VerticalResize, a.VerticalResize]
      t.ParallelChannelPaneView = class extends r {
        constructor(e, t) {
          super(e, t), (this._channelRenderer = new n()), (this._renderer = null), (this._p3 = null), (this._p4 = null)
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            (this._renderer = null),
            this._source.priceScale() && !this._source.priceScale().isEmpty() && 0 !== this._source.points().length)
          ) {
            if (
              (this._source._priceOffset || this._source.calculatePriceDiff(),
              3 === this._points.length && this._source._priceOffset)
            ) {
              var e = this._points[0],
                t = this._points[1],
                i = this._source._priceOffset + this._source.points()[0].price,
                r = this._source._priceOffset + this._source.points()[1].price
              ;(this._p3 = e.clone()), (this._p4 = t.clone())
              var n = this._source.priceScale(),
                a = this._source.ownerSource().firstValue()
              if (n.isLog()) {
                var l = 0.5 * (i + r) - this._source._priceOffset,
                  h = 0.5 * (i + r),
                  d = this._source.priceScale().priceToCoordinate(l, a),
                  c = this._source.priceScale().priceToCoordinate(h, a) - d
                ;(this._p3.y += c), (this._p4.y += c)
              } else
                (this._p3.y = this._source.priceScale().priceToCoordinate(i, a)),
                  (this._p4.y = this._source.priceScale().priceToCoordinate(r, a))
            }
            var u = { points: [] }
            this._points.length > 1 && (u.points.push(this._points[0]), u.points.push(this._points[1])),
              this._points.length > 2 &&
                null !== this._p3 &&
                null !== this._p4 &&
                (u.points.push(this._p3), u.points.push(this._p4)),
              (u.color = this._source.properties().linecolor.value()),
              (u.width = this._model.timeScale().width()),
              (u.height = this._source.priceScale().height())
            var _ = this._source.properties()
            ;(u.linewidth = _.linewidth.value()),
              (u.linestyle = _.linestyle.value()),
              (u.extendleft = _.extendLeft.value()),
              (u.extendright = _.extendRight.value()),
              (u.fillBackground = _.fillBackground.value()),
              (u.backcolor = _.backgroundColor.value()),
              (u.transparency = _.transparency.value()),
              (u.showMidline = _.showMidline.value()),
              (u.midlinewidth = _.midlinewidth.value()),
              (u.midlinestyle = _.midlinestyle.value()),
              (u.midcolor = _.midlinecolor.value()),
              (u.fillBackground = _.fillBackground.value()),
              (u.hittestOnBackground = !0),
              this._channelRenderer.setData(u)
            var p = new s()
            p.append(this._channelRenderer)
            var f = []
            if ((this._points[0] && f.push(this._points[0]), this._points[1] && f.push(this._points[1]), this._p3)) {
              var g = this._p3
              ;(g.data = 2), f.push(g)
              var v = this._p4
              ;(v.data = 3), f.push(v)
              var w = this._p3.add(this._p4).scaled(0.5)
              ;(w.data = 4), (w.square = !0), f.push(w)
              var x = f[0].add(f[1]).scaled(0.5)
              ;(x.data = 5), (x.square = !0), f.push(x)
            }
            var m = 3 === this._points.length && !this._p3
            this._model.lineBeingCreated() !== this._source || m || (f.pop(), f.pop()),
              p.append(this.createLineAnchor({ points: f, pointsCursorType: o }, 0)),
              (this._renderer = p)
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    AOzI: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'StudyLineDataSourceAnchorsPaneView', function () {
          return n
        })
      var r = i('aB9a')
      class n extends r.LineSourcePaneView {
        renderer() {
          return (
            this._invalidated && (this._updateImpl(), (this._invalidated = !1)),
            this.createLineAnchor({ points: this._getPoints() }, 0)
          )
        }
      }
    },
    Ay2m: function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('YFKU').t,
        s = i('aB9a').LineSourcePaneView,
        a = i('LxhU').Interval,
        o = i('VdBB').HitTestResult,
        l = i('Zy3/').CompositeRenderer,
        h = i('PuIH').getImage,
        d = i('Hr11'),
        c = i('GH0z').PercentageFormatter,
        u = i('gQ5K').DateFormatter,
        _ = i('4kQX').TimeFormatter,
        p = i('nda6').TimeSpanFormatter,
        f = i('Tmoa'),
        g = i('08i5'),
        v = i('ikwP').calcTextHorizontalShift,
        w = i('Ialn').isRtl,
        x = i('gAom').drawRoundRect,
        m = i('XlJ7').makeFont,
        y = i('cPgM').ScaledPaneRenderer,
        b = i('Ialn'),
        R = b.forceLTRStr,
        T = b.startWithLTR,
        S = i('zDbI').CHART_FONT_FAMILY
      class P extends y {
        constructor() {
          super(),
            (this._data = null),
            (this._font = S),
            (this._targetFontSize1 = 14),
            (this._targetFontSize2 = 11),
            (this._sourceFontSize1 = 12),
            (this._sourceFontSize2 = 10),
            (this._arrowOffset = 6),
            (this._arrowWidth = 5),
            (this._arrowHeight = 5),
            (this._radius = 3),
            (this._sourceWidth = void 0),
            (this._sourceHeight = void 0),
            (this._sourceRectLeftOffset = void 0),
            (this._targetWidth = void 0),
            (this._targetHeight = void 0),
            (this._targetRectLeftOffset = void 0)
        }
        setData(e) {
          this._data = e
        }
        drawBalloon(e, t, i, n, s, a) {
          var o = a || 20
          if ((e.beginPath(), 'down' === s)) {
            var l = new r(t.x - o, t.y - this._arrowOffset - this._arrowHeight - n)
            return (
              e.moveTo(l.x + this._radius, l.y),
              e.lineTo(l.x + i - this._radius, l.y),
              e.arcTo(l.x + i, l.y, l.x + i, l.y + this._radius, this._radius),
              e.lineTo(l.x + i, l.y + n - this._radius),
              e.arcTo(l.x + i, l.y + n, l.x + i - this._radius, l.y + n, this._radius),
              e.lineTo(l.x + o + this._arrowWidth, l.y + n),
              e.lineTo(l.x + o, l.y + n + this._arrowHeight),
              e.lineTo(l.x + o - this._arrowWidth, l.y + n),
              e.lineTo(l.x + this._radius, l.y + n),
              e.arcTo(l.x, l.y + n, l.x, l.y + n - this._radius, this._radius),
              e.lineTo(l.x, l.y + this._radius),
              e.arcTo(l.x, l.y, l.x + this._radius, l.y, this._radius),
              l
            )
          }
          var h = new r(t.x - o, t.y + this._arrowOffset + this._arrowHeight + n)
          return (
            e.moveTo(h.x + this._radius, h.y),
            e.lineTo(h.x + i - this._radius, h.y),
            e.arcTo(h.x + i, h.y, h.x + i, h.y - this._radius, this._radius),
            e.lineTo(h.x + i, h.y - n + this._radius),
            e.arcTo(h.x + i, h.y - n, h.x + i - this._radius, h.y - n, this._radius),
            e.lineTo(h.x + o + this._arrowWidth, h.y - n),
            e.lineTo(h.x + o, h.y - n - this._arrowHeight),
            e.lineTo(h.x + o - this._arrowWidth, h.y - n),
            e.lineTo(h.x + this._radius, h.y - n),
            e.arcTo(h.x, h.y - n, h.x, h.y - n + this._radius, this._radius),
            e.lineTo(h.x, h.y - this._radius),
            e.arcTo(h.x, h.y, h.x + this._radius, h.y, this._radius),
            new r(h.x, h.y - n)
          )
        }
        drawTargetLabel(e) {
          e.save(), e.translate(0.5, 0.5)
          var t = m(this._targetFontSize1, this._font, 'normal'),
            i = m(this._targetFontSize2, this._font, 'normal'),
            r = this._data.targetLine1,
            s = this._data.targetLine2,
            a = this._data.targetLine3,
            o = this._data.targetLine4
          e.font = t
          var l = e.measureText(r).width,
            h = e.measureText(s).width,
            d = e.measureText(' ').width
          e.font = i
          var c = e.measureText(a).width,
            u = e.measureText(o).width,
            _ = e.measureText(' ').width,
            p = (this._data.clockWhite && this._data.clockWhite.width) || 0
          ;(this._targetWidth = Math.max(l + h + d, c + u + p + 2 * _) + 8 + 4),
            (this._targetHeight = this._targetFontSize1 + this._targetFontSize2 + 9 + 4)
          var y = this._data.points[1],
            b = y.x + this._targetWidth - e.canvas.width + 5
          this._targetRectLeftOffset = Math.max(20, Math.min(this._targetWidth - 15, b))
          var R = 'up' === this._data.direction ? 'down' : 'up',
            T = this.drawBalloon(e, y, this._targetWidth, this._targetHeight, R, this._targetRectLeftOffset)
          ;(e.fillStyle = f.generateColor(this._data.targetBackColor, this._data.transparency)),
            e.fill(),
            (e.lineWidth = 2),
            (e.strokeStyle = f.generateColor(this._data.targetStrokeColor, this._data.transparency)),
            e.stroke()
          e.beginPath(),
            e.arc(y.x, y.y, 3, 0, 2 * Math.PI, !1),
            (e.fillStyle = this._data.centersColor),
            e.fill(),
            (e.textBaseline = 'top'),
            (e.fillStyle = this._data.targetTextColor)
          var S = 2 + T.x + 4,
            P = 2 + T.y + 3,
            L = this._targetWidth - 8 - 4
          ;(e.font = t), (e.textAlign = w() ? 'right' : 'left')
          var C = v(e, L - h - d)
          e.fillText(r, S + C, P)
          var M = v(e, L - l)
          e.fillText(s, S + l + d + M, P), (e.font = i)
          var I = P + this._targetFontSize1 + 3,
            O = v(e, L - u - p - _)
          e.fillText(a, S + O, I)
          var N = v(e, L - c - _ - p - u)
          this._data.clockWhite && e.drawImage(this._data.clockWhite, S + c + _ + N, I + 1)
          var D = v(e, L - c - p)
          if ((e.fillText(o, S + c + p + 2 * _ + D, I), this._data.status)) {
            var B, k, A, E
            switch (((e.font = m(this._targetFontSize1, this._font, 'bold')), this._data.status)) {
              case g.AlertStatus.Success:
                ;(B = n('SUCCESS')),
                  (k = f.generateColor(this._data.successBackground, this._data.transparency)),
                  (A = this._data.successTextColor),
                  (E = this._data.successIcon)
                break
              case g.AlertStatus.Failure:
                ;(B = n('FAILURE')),
                  (k = f.generateColor(this._data.failureBackground, this._data.transparency)),
                  (A = this._data.failureTextColor),
                  (E = this._data.failureIcon)
            }
            var z = this._targetFontSize1 + 4,
              j = e.measureText(B).width,
              V = Math.round((this._targetWidth - j) / 2),
              H = v(e, j)
            ;(e.fillStyle = k),
              'up' === this._data.direction
                ? (x(e, T.x - 1, T.y - z - 2, this._targetWidth + 2, z, 5),
                  e.fill(),
                  (e.fillStyle = A),
                  e.fillText(B, T.x + V + H, T.y - z + 1),
                  E && e.drawImage(E, T.x + V - E.width - 4, T.y - z - 2 + Math.abs(z - E.height) / 2))
                : (x(e, T.x - 1, T.y + this._targetHeight + 2, this._targetWidth + 2, z, 5),
                  e.fill(),
                  (e.fillStyle = A),
                  e.fillText(B, T.x + V + H, T.y + this._targetHeight + 5),
                  E &&
                    e.drawImage(E, T.x + V - E.width - 4, T.y + this._targetHeight + 10 - Math.abs(z - E.height) / 2)),
              e.restore()
          } else e.restore()
        }
        drawStartLabel(e) {
          e.save(), e.translate(0.5, 0.5)
          var t = m(this._sourceFontSize1, this._font, 'normal'),
            i = m(this._sourceFontSize2, this._font, 'normal')
          e.font = t
          var r = e.measureText(this._data.sourceLine1).width
          e.font = i
          var n = e.measureText(this._data.sourceLine2).width
          ;(this._sourceWidth = Math.max(r, n) + 6 + 4),
            (this._sourceHeight = this._sourceFontSize1 + this._sourceFontSize2 + 6 + 4)
          var s = this._data.points[0],
            a = s.x + this._sourceWidth - e.canvas.width + 5
          this._sourceRectLeftOffset = Math.max(20, Math.min(this._sourceWidth - 15, a))
          var o = this.drawBalloon(
            e,
            s,
            this._sourceWidth,
            this._sourceHeight,
            this._data.direction,
            this._sourceRectLeftOffset,
          )
          ;(e.fillStyle = f.generateColor(this._data.sourceBackColor, this._data.transparency)),
            e.fill(),
            (e.lineWidth = 2),
            (e.strokeStyle = f.generateColor(this._data.sourceStrokeColor, this._data.transparency)),
            e.stroke(),
            (e.textAlign = w() ? 'right' : 'left'),
            (e.textBaseline = 'top'),
            (e.fillStyle = this._data.sourceTextColor)
          var l = v(e, this._sourceWidth - 6 - 4),
            h = 2 + o.x + 3 + l,
            d = 2 + o.y + 2
          ;(e.font = t),
            e.fillText(this._data.sourceLine1, h, d),
            (e.font = i),
            e.fillText(this._data.sourceLine2, h, d + this._sourceFontSize1 + 2)
          e.beginPath(),
            e.arc(s.x, s.y, 3, 0, 2 * Math.PI, !1),
            (e.fillStyle = this._data.centersColor),
            e.fill(),
            e.restore()
        }
        _drawImpl(e) {
          if (!(null === this._data || this._data.points.length < 2)) {
            ;(e.lineCap = 'butt'),
              (e.strokeStyle = this._data.color),
              (e.lineWidth = this._data.linewidth),
              (e.lineStyle = this._data.linestyle)
            var t = this._data.points[0],
              i = this._data.points[1],
              r = i.subtract(t)
            Math.abs(r.x) < 1 || Math.abs(r.y) < 1
              ? (e.beginPath(), e.moveTo(t.x, t.y), e.lineTo(i.x, i.y), e.stroke())
              : (e.save(),
                e.beginPath(),
                e.translate(t.x, t.y),
                e.scale(1, r.y / r.x),
                e.moveTo(0, 0),
                e.arcTo(r.x, 0, r.x, r.x, Math.abs(r.x)),
                e.lineTo(r.x, r.x),
                e.restore(),
                e.stroke()),
              this.drawTargetLabel(e),
              this.drawStartLabel(e)
            var n = Math.max(8, 4 * this._data.linewidth)
            e.fillStyle = this._data.color
            var s = r.y < 0 ? 1 : -1
            if (Math.abs(r.x) < 1 || Math.abs(r.y) < 1) var a = Math.atan(r.x / r.y)
            else {
              var o,
                l,
                h = Math.abs(r.x),
                d = Math.abs(r.y),
                c = 0,
                u = Math.PI / 2,
                _ = (c + u) / 2
              if (r.length() > n)
                for (;;) {
                  ;(o = h * Math.sin(_)), (l = d * (1 - Math.cos(_)))
                  var p = Math.sqrt((o - h) * (o - h) + (l - d) * (l - d))
                  if (Math.abs(p - n) < 1) break
                  p > n ? (c = _) : (u = _), (_ = (c + u) / 2)
                }
              ;(a = Math.atan((h - o) / (d - l))), r.x * r.y < 0 && (a = -a)
            }
            e.save(),
              e.beginPath(),
              e.translate(i.x, i.y),
              e.rotate(-a),
              e.moveTo(0, 0),
              e.lineTo(-n / 2, s * n),
              e.lineTo(n / 2, s * n),
              e.lineTo(0, 0),
              e.restore(),
              e.fill()
          }
        }
        targetLabelHitTest(e) {
          if (void 0 === this._targetWidth || void 0 === this._targetHeight || void 0 === this._targetRectLeftOffset)
            return null
          var t = this._targetHeight + this._arrowHeight
          this._data.status && (t += this._targetFontSize1 + 10)
          var i = 'up' === this._data.direction ? -1 : 1,
            r = this._radius,
            n = this._data.points[1],
            s = n.x - this._targetRectLeftOffset,
            a = n.y + i * r,
            l = n.y + i * (t + r),
            h = Math.min(a, l),
            d = Math.max(a, l)
          return e.x >= s && e.x <= s + this._targetWidth && e.y >= h && e.y <= d ? new o(o.MOVEPOINT) : null
        }
        sourceLabelHitTest(e) {
          if (void 0 === this._sourceHeight || void 0 === this._sourceWidth || void 0 === this._sourceRectLeftOffset)
            return null
          var t = 'up' === this._data.direction ? 1 : -1,
            i = this._radius,
            r = this._data.points[0],
            n = r.x - this._sourceRectLeftOffset,
            s = r.y + i * t,
            a = r.y + (i + this._sourceHeight + this._arrowHeight) * t,
            l = Math.min(s, a),
            h = Math.max(s, a)
          return e.x >= n && e.x <= n + this._sourceWidth && e.y >= l && e.y <= h ? new o(o.MOVEPOINT) : null
        }
        hitTest(e) {
          if (null === this._data || this._data.points.length < 2) return null
          var t = this._data.points[0],
            i = this._data.points[1],
            r = i.subtract(t),
            n = ((r = i.subtract(t)), e.subtract(t)),
            s = Math.abs(r.x),
            a = Math.abs(r.y),
            l = d.sign(r.y) * (a - a * Math.sqrt(1 - (n.x * n.x) / (s * s)))
          if (Math.abs(l - n.y) < 3) return new o(o.MOVEPOINT)
          var h = this.targetLabelHitTest(e)
          return h || this.sourceLabelHitTest(e)
        }
      }
      t.PredictionPaneView = class extends s {
        constructor(e, t) {
          super(e, t), (this._pendingIcons = 3)
          var r = this
          function n() {
            ;(r._pendingIcons -= 1), 0 === r._pendingIcons && r._source.model().updateSource(r._source)
          }
          ;(this._clockWhite = null),
            (this._successIcon = null),
            (this._failureIcon = null),
            h('prediction-clock-white', i('qjB4')).then(function (e) {
              ;(r._clockWhite = e), n()
            }),
            h('prediction-success-white', i('mJB8')).then(function (e) {
              ;(r._successIcon = e), n()
            }),
            h('prediction-failure-white', i('V8bI')).then(function (e) {
              ;(r._failureIcon = e), n()
            }),
            (this._percentageFormatter = new c()),
            (this._predictionRenderer = new P()),
            (this._renderer = null)
        }
        iconsReady() {
          return 0 === this._pendingIcons
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            (this._renderer = null),
            (this._targetLine1 = ''),
            (this._targetLine2 = ''),
            (this._targetLine3 = ''),
            (this._targetLine4 = ''),
            !(this._source.points().length < 2)) &&
            this._source.priceScale()
          ) {
            var e = this._source.ownerSource().formatter(),
              t = this._source.points()[1],
              i = this._source.points()[0]
            this._targetLine3 = R(e.format(t.price))
            var r = t.price - i.price,
              s = (r / Math.abs(i.price)) * 100
            this._targetLine1 = R(e.format(r) + ' (' + this._percentageFormatter.format(s) + ')')
            var o = this._model.timeScale().indexToUserTime(i.index),
              h = this._model.timeScale().indexToUserTime(t.index)
            i.time &&
              t.time &&
              ((o = TradingView.isString(i.time) ? new Date(Date.parse(i.time)) : i.time),
              (h = TradingView.isString(t.time) ? new Date(Date.parse(t.time)) : t.time))
            var d = this._model.mainSeries().isDWM(),
              c = a.parse(this._model.mainSeries().interval()),
              f = c.isSeconds() || c.isTicks()
            if (h && o) {
              ;(this._targetLine4 = new u().format(h)),
                d || (this._targetLine4 = this._targetLine4 + '  ' + new _(f ? '%h:%m:%s' : '%h:%m').format(h))
              var v = (h.valueOf() - o.valueOf()) / 1e3
              this._targetLine2 = n('in', { context: 'dates' }) + ' ' + T(new p().format(v))
            }
            ;(this._sourceLine1 = e.format(i.price)), (this._sourceLine2 = '')
            var w = this._model.timeScale().indexToUserTime(i.index)
            w &&
              ((this._sourceLine2 = new u().format(w)),
              d || (this._sourceLine2 = this._sourceLine2 + ' ' + new _(f ? '%h:%m:%s' : '%h:%m').format(w))),
              (this._direction = this._source.direction() === g.Direction.Up ? 'up' : 'down'),
              (this._finished =
                this._model.lineBeingCreated() !== this._source &&
                this._model.lineBeingEdited() !== this._source &&
                !this._model.sourcesBeingMoved().includes(this._source))
            var x = {}
            ;(x.points = this._points),
              (x.color = this._source.properties().linecolor.value()),
              (x.linewidth = this._source.properties().linewidth.value()),
              (x.targetLine1 = this._targetLine1),
              (x.targetLine2 = this._targetLine2),
              (x.targetLine3 = this._targetLine3),
              (x.targetLine4 = this._targetLine4),
              (x.status = this._source.properties().status.value()),
              (x.transparency = this._source.properties().transparency.value()),
              (x.targetBackColor = this._source.properties().targetBackColor.value()),
              (x.targetStrokeColor = this._source.properties().targetStrokeColor.value()),
              (x.targetTextColor = this._source.properties().targetTextColor.value()),
              (x.sourceBackColor = this._source.properties().sourceBackColor.value()),
              (x.sourceStrokeColor = this._source.properties().sourceStrokeColor.value()),
              (x.sourceTextColor = this._source.properties().sourceTextColor.value()),
              (x.successBackground = this._source.properties().successBackground.value()),
              (x.successTextColor = this._source.properties().successTextColor.value()),
              (x.failureBackground = this._source.properties().failureBackground.value()),
              (x.failureTextColor = this._source.properties().failureTextColor.value()),
              (x.intermediateBackColor = this._source.properties().intermediateBackColor.value()),
              (x.intermediateTextColor = this._source.properties().intermediateTextColor.value()),
              (x.sourceLine1 = this._sourceLine1),
              (x.sourceLine2 = this._sourceLine2),
              (x.direction = this._direction),
              (x.clockWhite = this._clockWhite),
              (x.successIcon = this._successIcon),
              (x.failureIcon = this._failureIcon),
              (x.finished = this._finished),
              (x.centersColor = this._model.backgroundCounterColor()),
              this._predictionRenderer.setData(x)
            var m = new l()
            m.append(this._predictionRenderer), this.addAnchors(m), (this._renderer = m)
          }
        }
      }
    },
    B4Hi: function (e, t, i) {
      'use strict'
      var r,
        n = i('aO4+').Point,
        s = i('aB9a').LineSourcePaneView,
        a = i('VdBB').HitTestResult,
        o = i('VdBB').AreaName,
        l = i('Zy3/').CompositeRenderer,
        h = i('Tmoa'),
        d = i('jTis').CalloutConsts,
        c = i('ikwP').calcTextHorizontalShift,
        u = i('Ialn').isRtl,
        _ = i('cPgM').ScaledPaneRenderer
      class p extends _ {
        constructor(e) {
          super(), (this._data = null), (this._textSizeCache = e)
        }
        wordWrap(e, t) {
          var i
          r ||
            (((i = document.createElement('canvas')).width = 0), (i.height = 0), (r = i.getContext('2d')), (i = null)),
            (t = +t)
          var n = (e += '').split(/[^\S\r\n]*(?:\r\n|\r|\n|$)/)
          if ((n[n.length - 1] || n.pop(), !isFinite(t) || t <= 0)) return n
          r.font = this.fontStyle()
          for (var s = [], a = 0; a < n.length; a++) {
            var o = n[a]
            if ((h = r.measureText(o).width) <= t) s.push(o)
            else
              for (var l = o.split(/([-)\]},.!?:;])|(\s+)/); l.length; ) {
                var h,
                  d = ~~(((t / h) * (l.length + 2)) / 3)
                if (d <= 0 || r.measureText(l.slice(0, 3 * d - 1).join('')).width <= t)
                  for (; r.measureText(l.slice(0, 3 * (d + 1) - 1).join('')).width <= t; ) d++
                else for (; d > 0 && r.measureText(l.slice(0, 3 * --d - 1).join('')).width > t; );
                if (d > 0) s.push(l.slice(0, 3 * d - 1).join('')), l.splice(0, 3 * d)
                else {
                  var c = l[0] + (l[1] || ''),
                    u = 1 === u ? 1 : ~~((t / r.measureText(c)) * c.length)
                  if (r.measureText(c.substr(0, u)).width <= t)
                    for (; r.measureText(c.substr(0, u + 1)).width <= t; ) u++
                  else for (; u > 1 && r.measureText(c.substr(0, --u)).width > t; );
                  u < 1 && (u = 1), s.push(c.substr(0, u)), (l[0] = c.substr(u)), (l[1] = '')
                }
                if ((h = r.measureText(l.join('')).width) <= t) {
                  s.push(l.join(''))
                  break
                }
              }
          }
          return s
        }
        setData(e) {
          ;(this._data = e), (this._data.lines = this.wordWrap(e.text, e.wordWrapWidth))
        }
        hitTest(e) {
          if (null === this._data || this._data.points.length < 2) return null
          var t = this._data.points[0],
            i = this._data.points[1]
          if (t.subtract(e).length() < 3) return new a(a.CHANGEPOINT, 0)
          var r = i.x - this._textSizeCache.totalWidth / 2,
            n = i.y - this._textSizeCache.totalHeight / 2
          return e.x >= r &&
            e.x <= r + this._textSizeCache.totalWidth &&
            e.y >= n &&
            e.y <= n + this._textSizeCache.totalHeight
            ? new a(a.MOVEPOINT, { areaName: o.Text })
            : null
        }
        fontStyle() {
          return (
            (this._data.bold ? 'bold ' : '') +
            (this._data.italic ? 'italic ' : '') +
            this._data.fontSize +
            'px ' +
            this._data.font
          )
        }
        _drawImpl(e) {
          if (!(null === this._data || this._data.points.length < 2)) {
            var t = this._data.points[0].clone(),
              i = this._data.points[1].clone()
            ;(e.lineCap = 'butt'),
              (e.strokeStyle = this._data.bordercolor),
              (e.lineWidth = this._data.linewidth),
              (e.textBaseline = 'bottom'),
              (e.font = this.fontStyle())
            var r = this._data.fontSize * this._data.lines.length,
              n =
                this._data.wordWrapWidth ||
                this._data.lines.reduce(function (t, i) {
                  return Math.max(t, e.measureText(i).width)
                }, 0)
            ;(this._textSizeCache.textHeight = r), (this._textSizeCache.textHeight = n)
            var s = d.RoundRadius,
              a = d.TextMargins,
              o = n + 2 * a + 2 * s,
              l = r + 2 * a + 2 * s
            ;(this._textSizeCache.totalWidth = o), (this._textSizeCache.totalHeight = l)
            var _ = i.x - o / 2,
              p = i.y - l / 2,
              f = 0,
              g = n + 2 * a > 2 * s,
              v = r + 2 * a > 2 * s
            e.textAlign = u() ? 'right' : 'left'
            var w = c(e, n)
            t.x > _ + o ? (f = 20) : t.x > _ && (f = 10),
              t.y > p + l ? (f += 2) : t.y > p && (f += 1),
              e.save(),
              e.translate(_, p),
              (t.x -= _),
              (t.y -= p),
              (i.x -= _),
              (i.y -= p),
              e.beginPath(),
              e.moveTo(s, 0),
              10 === f
                ? g
                  ? (e.lineTo(i.x - s, 0), e.lineTo(t.x, t.y), e.lineTo(i.x + s, 0), e.lineTo(o - s, 0))
                  : (e.lineTo(t.x, t.y), e.lineTo(o - s, 0))
                : e.lineTo(o - s, 0),
              20 === f ? (e.lineTo(t.x, t.y), e.lineTo(o, s)) : e.arcTo(o, 0, o, s, s),
              21 === f
                ? v
                  ? (e.lineTo(o, i.y - s), e.lineTo(t.x, t.y), e.lineTo(o, i.y + s), e.lineTo(o, l - s))
                  : (e.lineTo(t.x, t.y), e.lineTo(o, l - s))
                : e.lineTo(o, l - s),
              22 === f ? (e.lineTo(t.x, t.y), e.lineTo(o - s, l)) : e.arcTo(o, l, o - s, l, s),
              12 === f
                ? g
                  ? (e.lineTo(i.x + s, l), e.lineTo(t.x, t.y), e.lineTo(i.x - s, l), e.lineTo(s, l))
                  : (e.lineTo(t.x, t.y), e.lineTo(s, l))
                : e.lineTo(s, l),
              2 === f ? (e.lineTo(t.x, t.y), e.lineTo(0, l - s)) : e.arcTo(0, l, 0, l - s, s),
              1 === f
                ? v
                  ? (e.lineTo(0, i.y + s), e.lineTo(t.x, t.y), e.lineTo(0, i.y - s), e.lineTo(0, s))
                  : (e.lineTo(t.x, t.y), e.lineTo(0, s))
                : e.lineTo(0, s),
              0 === f ? (e.lineTo(t.x, t.y), e.lineTo(s, 0)) : e.arcTo(0, 0, s, 0, s),
              e.stroke(),
              (e.fillStyle = h.generateColor(this._data.backcolor, this._data.transparency)),
              e.fill(),
              (e.fillStyle = this._data.color),
              (p = s + a + this._data.fontSize),
              (_ = s + a + w)
            for (var x = 0; x < this._data.lines.length; x++)
              e.fillText(this._data.lines[x], _, p), (p += this._data.fontSize)
            e.restore()
          }
        }
      }
      t.CalloutPaneView = class extends s {
        constructor(e, t) {
          super(e, t),
            (this._textSizeCache = {}),
            (this._calloutRenderer = new p(this._textSizeCache)),
            (this._renderer = null)
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            this._source._calculatePoint2(),
            (this._renderer = null),
            this._points[0] && !(this._points.length < 2))
          ) {
            var e = this._source.properties(),
              t = { points: [] }
            t.points.push(this._points[0])
            var i = this._points[1].clone()
            ;(i.x = this._points[0].x + this._source._barOffset * this._model.timeScale().barSpacing()),
              t.points.push(i),
              (t.color = e.color.value()),
              (t.linewidth = e.linewidth.value()),
              (t.backcolor = e.backgroundColor.value()),
              (t.transparency = e.transparency.value()),
              (t.text = e.text.value()),
              (t.font = e.font.value()),
              (t.fontSize = e.fontsize.value()),
              (t.bordercolor = e.bordercolor.value()),
              e.wordWrap && e.wordWrap.value() && (t.wordWrapWidth = e.wordWrapWidth.value()),
              (t.bold = e.bold && e.bold.value()),
              (t.italic = e.italic && e.italic.value()),
              this._calloutRenderer.setData(t)
            var r = new l()
            r.append(this._calloutRenderer)
            var s = t.points[1],
              a = [].concat(t.points)
            if ((a.splice(a.length - 1, 1), r.append(this.createLineAnchor({ points: a }, 0)), t.wordWrapWidth)) {
              var o = new n(s.x + (t.wordWrapWidth >> 1) + d.RoundRadius + d.TextMargins, s.y)
              ;(o.data = 1), r.append(this.createLineAnchor({ points: [o] }, 1))
            }
            this._renderer = r
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    BCbF: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'PolygonRenderer', function () {
          return u
        })
      var r = i('f6yo'),
        n = i('GEp6'),
        s = i('jFln'),
        a = i('pJOz'),
        o = i('a7Ha'),
        l = i('VdBB'),
        h = i('Tmoa'),
        d = i('cPgM'),
        c = i('Zp/P')
      class u extends d.ScaledPaneRenderer {
        constructor(e) {
          super(),
            (this._data = null),
            (this._backHittest = new l.HitTestResult(l.HitTestResult.MOVEPOINT_BACKGROUND)),
            (this._points = []),
            (this._hittest = e || new l.HitTestResult(l.HitTestResult.MOVEPOINT))
        }
        setData(e) {
          ;(this._data = e), (this._points = e.points)
        }
        hitTest(e) {
          if (null === this._data || (void 0 !== this._data.mouseTouchable && !this._data.mouseTouchable)) return null
          const t = Math.max(Object(c.interactionTolerance)().line, Math.ceil(this._data.linewidth / 2)),
            i = this._points.length
          if (1 === i) {
            return Object(r.pointInCircle)(e, this._points[0], t) ? this._hittest : null
          }
          for (let r = 1; r < i; r++) {
            const i = this._points[r - 1],
              s = this._points[r]
            if (Object(n.distanceToSegment)(i, s, e).distance <= t) return this._hittest
          }
          if (this._data.filled && this._data.fillBackground && i > 0) {
            const r = this._points[0],
              s = this._points[i - 1]
            if (Object(n.distanceToSegment)(r, s, e).distance <= t) return this._hittest
          }
          return this._data.filled && this._data.fillBackground && Object(r.pointInPolygon)(e, this._data.points)
            ? this._backHittest
            : null
        }
        _drawImpl(e, t) {
          var i, r
          const n = this._points.length
          if (null === this._data || 0 === n) return
          if (1 === n) return void this._drawPoint(e, this._points[0], this._data.linewidth / 2, this._data.color)
          e.beginPath()
          const l = null !== (i = this._data.linecap) && void 0 !== i ? i : 'butt'
          ;(e.lineCap = l),
            (e.strokeStyle = this._data.color),
            (e.lineWidth = this._data.linewidth),
            (e.lineJoin = null !== (r = this._data.linejoin) && void 0 !== r ? r : 'miter'),
            Object(s.setLineStyle)(e, this._data.linestyle)
          const d = this._points[0]
          e.moveTo(d.x, d.y)
          for (const t of this._points) e.lineTo(t.x, t.y)
          if (
            (this._data.filled &&
              this._data.fillBackground &&
              ((e.fillStyle = Object(h.generateColor)(this._data.backcolor, this._data.transparency)), e.fill()),
            this._data.filled && !this._data.skipClosePath && e.closePath(),
            this._data.linewidth > 0 && e.stroke(),
            n > 1)
          ) {
            if (('butt' !== l && (e.lineCap = 'butt'), this._data.leftend === o.LineEnd.Arrow)) {
              const i = this._correctArrowPoints(this._points[1], this._points[0], e.lineWidth, l)
              Object(a.drawArrow)(i[0], i[1], e, e.lineWidth, t.pixelRatio)
            }
            if (this._data.rightend === o.LineEnd.Arrow) {
              const i = this._correctArrowPoints(this._points[n - 2], this._points[n - 1], e.lineWidth, l)
              Object(a.drawArrow)(i[0], i[1], e, e.lineWidth, t.pixelRatio)
            }
          }
        }
        _drawPoint(e, t, i, r) {
          0 !== i && (e.beginPath(), (e.fillStyle = r), e.arc(t.x, t.y, i, 0, 2 * Math.PI, !0), e.fill(), e.closePath())
        }
        _correctArrowPoints(e, t, i, r) {
          const n = t.subtract(e),
            s = n.length()
          if ('butt' === r || s < 1) return [e, t]
          const a = s + i / 2
          return [e, n.scaled(a / s).add(e)]
        }
      }
    },
    BSCN: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'VertLinePaneView', function () {
          return d
        })
      var r = i('aO4+'),
        n = i('Zy3/'),
        s = i('qgcf'),
        a = i('//lt'),
        o = i('z+cS'),
        l = i('aB9a')
      const h = [a.PaneCursorType.HorizontalResize]
      class d extends l.LineSourcePaneView {
        constructor(e, t, i) {
          super(e, t),
            (this._lineRenderer = new o.VerticalLineRenderer()),
            (this._labelRenderer = new s.TextRenderer()),
            (this._renderer = null),
            (this._pane = i)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _validatePriceScale() {
          return !0
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), 0 === this._points.length)) return
          const e = this._source.properties().childs(),
            t = {
              x: this._points[0].x,
              color: e.linecolor.value(),
              linewidth: e.linewidth.value(),
              linestyle: e.linestyle.value(),
            }
          this._lineRenderer.setData(t)
          const i = new n.CompositeRenderer()
          i.append(this._lineRenderer)
          const s = this._pane.height()
          if (
            e.showLabel.value() &&
            e.text.value().length > 0 &&
            this._source.model().paneForSource(this._source) === this._pane
          ) {
            let t = 0,
              n = 5,
              a = 'center',
              o = 'middle'
            const l = this._points[0].x
            let h = 0
            switch (e.vertLabelsAlign.value()) {
              case 'top':
                h = s
                break
              case 'middle':
                h = s / 2
                break
              case 'bottom':
                h = 0
            }
            if ('horizontal' === e.textOrientation.value()) {
              switch (e.horzLabelsAlign.value()) {
                case 'left':
                  a = 'right'
                  break
                case 'right':
                  a = 'left'
                  break
                case 'center':
                  a = 'center'
              }
              switch (e.vertLabelsAlign.value()) {
                case 'top':
                  o = 'bottom'
                  break
                case 'middle':
                  o = 'middle'
                  break
                case 'bottom':
                  o = 'top'
              }
            } else {
              switch (((t = -Math.PI / 2), (n = 0), e.horzLabelsAlign.value())) {
                case 'left':
                  o = 'bottom'
                  break
                case 'right':
                  o = 'top'
                  break
                case 'center':
                  o = 'middle'
              }
              switch (e.vertLabelsAlign.value()) {
                case 'top':
                  a = 'left'
                  break
                case 'middle':
                  a = 'center'
                  break
                case 'bottom':
                  a = 'right'
              }
            }
            const d = {
              points: [new r.Point(l, h)],
              text: e.text.value(),
              color: e.textcolor.value(),
              vertAlign: o,
              horzAlign: a,
              font: e.font.value(),
              offsetX: n,
              offsetY: 0,
              bold: e.bold.value(),
              italic: e.italic.value(),
              fontsize: e.fontsize.value(),
              forceTextAlign: !0,
              angle: t,
            }
            this._labelRenderer.setData(d), i.append(this._labelRenderer)
          }
          if (1 === this._points.length) {
            const e = new r.Point(this._points[0].x, s / 2)
            ;(e.data = 0), (e.square = !0), i.append(this.createLineAnchor({ points: [e], pointsCursorType: h }, 0))
          }
          this._renderer = i
        }
      }
    },
    C2CE: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'PolylinePaneView', function () {
          return a
        })
      var r = i('BCbF'),
        n = i('Zy3/'),
        s = i('aB9a')
      class a extends s.LineSourcePaneView {
        constructor(e, t) {
          super(e, t),
            (this._polygonRenderer = new r.PolygonRenderer(null)),
            (this._renderer = new n.CompositeRenderer())
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          super._updateImpl(), this._renderer.clear()
          const e = this._source.properties().childs(),
            t = {
              points: this._points,
              color: e.linecolor.value(),
              linewidth: e.linewidth.value(),
              linestyle: e.linestyle.value(),
              filled: e.filled.value(),
              backcolor: e.backgroundColor.value(),
              fillBackground: e.fillBackground.value(),
              transparency: e.transparency.value(),
            }
          this._polygonRenderer.setData(t),
            this._renderer.append(this._polygonRenderer),
            this.addAnchors(this._renderer)
        }
      }
    },
    CR3a: function (e, t, i) {
      'use strict'
      var r = i('NN6M').ParallelChannelRenderer,
        n = i('pJOz').TrendLineRenderer,
        s = i('cjIn').PaneRendererCachedImage,
        a = i('Zy3/').CompositeRenderer,
        o = i('Tmoa'),
        l = i('a7Ha').LineEnd,
        h = i('NCfL').LineToolPaneViewWithLevelledTextCache,
        d = i('xUGI')
      class c extends d {
        _selectStartPrice(e) {
          return e.points()[0].price
        }
        priceRange(e, t) {
          var i = e.points()[2],
            r = e.points()[0],
            n = this._calculatePriceRange(i, r, t)
          if (!this._calculateLogLevels(e)) return { price: n }
          var s = e.priceScale(),
            a = e.ownerSource().firstValue(),
            o = s.priceToCoordinate(i.price, a),
            l = s.priceToCoordinate(r.price, a)
          return { price: n, coordinate: t ? l - o : o - l }
        }
      }
      class u extends r {
        _getColor() {
          return o.generateColor(this._data.backcolor, this._data.transparency, !0)
        }
      }
      t.FibChannelPaneView = class extends h {
        constructor(e, t) {
          super(e, t),
            (this._rendererCache = {}),
            (this._baseLineRenderer = new n()),
            (this._lastLevelTrendRenderer = new n()),
            (this._renderer = null)
        }
        getCacheRects(e, t) {
          super.getCacheRects(e, t)
          var i,
            r = this._source.properties(),
            n = r['level' + t],
            s = this._cacheState.preparedCells.cells[t - 1],
            a = this._floatPoints[0],
            o = this._floatPoints[1],
            l = this.norm.scaled(n.coeff.value()),
            h = a.add(l),
            d = o.add(l)
          switch (r.horzLabelsAlign.value()) {
            case 'left':
              i = h
              break
            case 'center':
              ;((i = h.add(d).scaled(0.5)).x += s.width / 2), (i.x = Math.round(i.x))
              break
            case 'right':
              ;((i = d.clone()).x += s.width), (i.x = Math.round(i.x))
          }
          var c = {
              left: s.left,
              top: this._cache.topByRow(this._cacheState.row),
              width: s.width,
              height: this._cache.rowHeight(this._cacheState.row),
            },
            u = { left: Math.round(i.x - c.width), top: Math.round(i.y), width: s.width, height: c.height },
            _ = r.vertLabelsAlign.value()
          return (
            'middle' === _ && (u.top -= u.height / 2),
            'bottom' === _ && (u.top -= u.height),
            { cacheRect: c, targetRect: u }
          )
        }
        _createCache(e) {
          return new c(this._source.properties().fibLevelsBasedOnLogScale, this._source.levelsCount(), e)
        }
        _updateImpl() {
          super._updateImpl(),
            (this._renderer = null),
            3 === this._floatPoints.length &&
              3 === this._source.points().length &&
              (this.norm = this._floatPoints[2].subtract(this._floatPoints[0]))
          var e = new a()
          if (this._floatPoints.length < 2) return this.addAnchors(e), void (this._renderer = e)
          var t = this._source.properties(),
            i = this._floatPoints[0],
            r = this._floatPoints[1]
          if (this._floatPoints.length < 3) {
            var n = {
              points: [i, r],
              width: this._model.timeScale().width(),
              height: this._source.priceScale().height(),
              color: t.level1.color.value(),
              linewidth: t.levelsStyle.linewidth.value(),
              linestyle: t.levelsStyle.linestyle.value(),
              extendleft: t.extendLeft.value(),
              extendright: t.extendRight.value(),
              leftend: l.Normal,
              rightend: l.Normal,
            }
            return (
              this._baseLineRenderer.setData(n),
              e.append(this._baseLineRenderer),
              this.addAnchors(e),
              void (this._renderer = e)
            )
          }
          for (
            var o = function (t, i, r) {
                var n = new s(this, d)
                e.append(n)
              }.bind(this),
              h = this._source.levelsCount(),
              d = 1;
            d < h;
            d++
          ) {
            if ((T = t['level' + d]).visible.value()) {
              for (var c = null, _ = d + 1; _ <= h; _++) {
                var p = t['level' + _]
                if (p.visible.value()) {
                  c = p
                  break
                }
              }
              if (!c) break
              var f = this.norm.scaled(T.coeff.value()),
                g = i.add(f),
                v = r.add(f),
                w = this.norm.scaled(c.coeff.value()),
                x = i.add(w),
                m = r.add(w),
                y = {}
              ;(y.points = [g, v, x, m]),
                (y.color = T.color.value()),
                (y.width = this._model.timeScale().width()),
                (y.height = this._source.priceScale().height()),
                (y.linewidth = t.levelsStyle.linewidth.value()),
                (y.linestyle = t.levelsStyle.linestyle.value()),
                (y.extendleft = t.extendLeft.value()),
                (y.extendright = t.extendRight.value()),
                (y.backcolor = T.color.value()),
                (y.transparency = t.transparency.value()),
                (y.skipTopLine = !0),
                (y.fillBackground = t.fillBackground.value()),
                (y.hittestOnBackground = !0)
              var b = new u()
              b.setData(y), e.append(b), (t.showCoeffs.value() || t.showPrices.value()) && o(g, v, d)
            }
          }
          var R = null
          for (d = h; d >= 1; d--) {
            var T
            if ((T = t['level' + d]).visible.value()) {
              R = d
              break
            }
          }
          if (null != R && (T = t['level' + R]).visible.value()) {
            ;(f = this.norm.scaled(T.coeff.value())),
              (n = {
                points: [(g = i.add(f)), (v = r.add(f))],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: T.color.value(),
                linewidth: t.levelsStyle.linewidth.value(),
                linestyle: t.levelsStyle.linestyle.value(),
                extendleft: t.extendLeft.value(),
                extendright: t.extendRight.value(),
                leftend: l.Normal,
                rightend: l.Normal,
              })
            this._lastLevelTrendRenderer.setData(n),
              e.append(this._lastLevelTrendRenderer),
              (t.showCoeffs.value() || t.showPrices.value()) && o(g, v, R - 1)
          }
          this.addAnchors(e), (this._renderer = e)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    D4q4: function (e, t, i) {
      'use strict'
      var r = i('aB9a').LineSourcePaneView,
        n = i('Zy3/').CompositeRenderer,
        s = i('/S7V').TriangleRenderer
      t.TrianglePaneView = class extends r {
        constructor(e, t) {
          super(e, t), (this._triangleRenderer = new s()), (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          super._updateImpl(), (this._renderer = null)
          var e = {}
          ;(e.points = this._points),
            (e.color = this._source.properties().color.value()),
            (e.linewidth = this._source.properties().linewidth.value()),
            (e.backcolor = this._source.properties().backgroundColor.value()),
            (e.fillBackground = this._source.properties().fillBackground.value()),
            (e.transparency = this._source.properties().transparency.value()),
            this._triangleRenderer.setData(e)
          var t = new n()
          t.append(this._triangleRenderer), this.addAnchors(t), (this._renderer = t)
        }
      }
    },
    'Dz+H': function (e, t, i) {
      'use strict'
      i.r(t)
      var r = i('aB9a'),
        n = i('Zy3/'),
        s = i('vq8G'),
        a = i('VdBB'),
        o = i('Eyy1'),
        l = i('qgcf'),
        h = i('Tmoa'),
        d = i('Ialn'),
        c = i('ikwP'),
        u = i('c44N'),
        _ = i('aO4+'),
        p = i('f6yo')
      class f {
        constructor(e) {
          ;(this._data = null),
            (this._sourceCanvas = null),
            (this._translate = new _.Point(0, 0)),
            (this._renderParams = e)
        }
        destroy() {
          var e
          null === (e = this._sourceCanvas) || void 0 === e || e.remove()
        }
        renderParams() {
          return this._renderParams
        }
        update(e) {
          var t, i
          ;(t = this._data),
            (i = e),
            (null === t ||
              t.markerColor !== i.markerColor ||
              t.borderColor !== i.borderColor ||
              t.width !== i.width ||
              t.height !== i.height) &&
              this._createSource(e.width, e.height, e.markerColor),
            (this._data = e)
        }
        drawOn(e) {
          const t = Object(o.ensureNotNull)(this._data),
            i = new _.Point(Math.round(t.point.x), Math.round(t.point.y)).add(this._translate)
          e.drawImage(
            Object(o.ensureNotNull)(this._sourceCanvas),
            Math.round(i.x * this._renderParams.pixelRatio),
            Math.round(i.y * this._renderParams.pixelRatio),
            Math.round(t.width * this._renderParams.pixelRatio),
            Math.round(t.height * this._renderParams.pixelRatio),
          )
        }
        hasPoint(e) {
          const t = Object(o.ensureNotNull)(this._data),
            i = t.point.add(this._translate),
            r = new _.Point(t.point.x - this._translate.x, t.point.y)
          return Object(p.pointInBox)(e, Object(_.box)(i, r))
        }
        _createSource(e, t, i) {
          ;(this._sourceCanvas = Object(c.createDisconnectedCanvas)(
            document,
            new c.Size(e, t),
            this._renderParams.pixelRatio,
          )),
            (this._translate = new _.Point(-e / 2, 0.5 - t)),
            this._translate.x % 1 == 0 && (this._translate = new _.Point(this._translate.x + 0.5, this._translate.y))
          const r = Object(o.ensureNotNull)(this._sourceCanvas.getContext('2d'))
          Object(c.drawScaled)(r, this._renderParams.pixelRatio, () => {
            const n = 0.6 * e
            ;(r.fillStyle = i),
              r.beginPath(),
              r.moveTo(e / 2, t),
              r.quadraticCurveTo(e, e / 1.15, e, e / 2),
              r.arc(e / 2, e / 2, e / 2, 0, Math.PI, !0),
              r.quadraticCurveTo(0, e / 1.15, e / 2, t),
              r.fill(),
              (r.globalCompositeOperation = 'destination-out'),
              r.beginPath(),
              r.moveTo((e - n) / 2, e / 2),
              r.arc(e / 2, e / 2, n / 2, 0, 2 * Math.PI),
              r.fill()
          })
        }
      }
      class g {
        constructor() {
          ;(this._source = null), (this._data = null)
        }
        setData(e) {
          ;(this._data = e), this._source && this._source.update(e)
        }
        draw(e, t) {
          var i
          if (null === this._data) return
          ;(null !== this._source && Object(u.areEqualPaneRenderParams)(this._source.renderParams(), t)) ||
            (null === (i = this._source) || void 0 === i || i.destroy(),
            (this._source = new f(t)),
            this._source.update(this._data))
          this._source.drawOn(e), this._data.tooltipVisible && this._drawTooltipOn(e, t)
        }
        hitTest(e) {
          return null !== this._data && null !== this._source && this._source.hasPoint(e)
            ? new a.HitTestResult(a.HitTestResult.MOVEPOINT)
            : null
        }
        _drawTooltipOn(e, t) {
          e.save(), e.translate(0.5, 0.5)
          const i = Object(o.ensureNotNull)(this._data),
            r = String(i.text).replace(/^\s+|\s+$/g, '')
          e.font = (i.bold ? 'bold ' : '') + (i.italic ? 'italic ' : '') + i.fontSize + 'px ' + i.font
          const n = i.tooltipWidth - 2 * i.tooltipPadding,
            s = Object(l.wordWrap)(r, e.font, n),
            a = i.point,
            u = i.tooltipLineSpacing
          let _ = i.tooltipWidth,
            p = s.length * i.fontSize + 2 * i.tooltipPadding
          s.length > 1 && (p += (s.length - 1) * u)
          let f = Math.round(a.x - _ / 2),
            g = Math.round(a.y - i.height - p - 8)
          const v = a.x < 20 || a.x + 20 > i.vpWidth
          let w = v ? null : 'top',
            x = v ? 0 : Math.round(a.x)
          g < 10 ? (g = a.y + 13) : (w = 'bottom'),
            f < 10 ? (f += Math.abs(f - 10)) : f + _ + 10 > i.vpWidth && (f -= f + _ + 10 - i.vpWidth),
            (e.fillStyle = Object(h.generateColor)(i.backgroundColor, i.backgroundTransparency)),
            (e.strokeStyle = i.borderColor),
            (e.lineWidth = 1),
            e.beginPath()
          const m = Math.round(f * t.pixelRatio),
            y = Math.round(g * t.pixelRatio)
          ;(x = Math.round(x * t.pixelRatio)), (p = Math.round(p * t.pixelRatio)), (_ = Math.round(_ * t.pixelRatio))
          const b = Math.round(7 * t.pixelRatio)
          e.moveTo(m, y),
            v || 'top' !== w || (e.lineTo(x - b, y), e.lineTo(x, y - b), e.lineTo(x + b, y)),
            e.lineTo(m + _, y),
            e.lineTo(m + _, y + p),
            v || 'bottom' !== w || (e.lineTo(x + b, y + p), e.lineTo(x, y + p + b), e.lineTo(x - b, y + p)),
            e.lineTo(m, y + p),
            e.closePath(),
            e.fill(),
            e.stroke(),
            (e.textBaseline = 'middle'),
            (e.fillStyle = i.textColor),
            (e.textAlign = Object(d.isRtl)() ? 'right' : 'left')
          const R = Object(c.calcTextHorizontalShift)(e, n),
            T = f + i.tooltipPadding + R
          let S = g + i.tooltipPadding + i.fontSize / 2
          Object(c.drawScaled)(e, t.pixelRatio, () => {
            for (let t = 0; t < s.length; t++) e.fillText(s[t].replace(/^\s+/, ''), T, S), (S += i.fontSize + u)
          }),
            e.restore()
        }
      }
      i.d(t, 'NotePaneView', function () {
        return v
      })
      class v extends r.LineSourcePaneView {
        constructor(e, t) {
          super(e, t), (this._renderer = null), (this._noteRenderer = new g())
        }
        isLabelVisible() {
          return this.isHoveredSource() || this.isSelectedSource()
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          super._updateImpl(), (this._renderer = null)
          const e = this._getSource(),
            t = this._source.isFixed() ? e.fixedPoints() : this._points
          if (t.length < 1) return
          const i = new n.CompositeRenderer(),
            r = this.isLabelVisible(),
            o = this._source.properties().childs(),
            l = {
              text: o.text.value(),
              bold: o.bold.value(),
              italic: o.italic.value(),
              font: o.font.value(),
              fontSize: o.fontSize.value(),
              backgroundColor: o.backgroundColor.value(),
              backgroundTransparency: o.backgroundTransparency.value(),
              borderColor: o.borderColor.value(),
              textColor: o.textColor.value(),
              markerColor: o.markerColor.value(),
              point: t[0],
              width: 24,
              height: 32,
              tooltipVisible: r,
              vpWidth: this._model.timeScale().width(),
              tooltipWidth: e.getTooltipWidth(),
              tooltipPadding: e.getTooltipPadding(),
              tooltipLineSpacing: e.getTooltipLineSpacing(),
            }
          this._noteRenderer.setData(l),
            i.append(this._noteRenderer),
            i.append(
              new s.SelectionRenderer({
                points: t,
                bgColors: this._lineAnchorColors(t),
                visible: this.areAnchorsVisible(),
                barSpacing: this._model.timeScale().barSpacing(),
                hittestResult: a.HitTestResult.MOVEPOINT,
              }),
            ),
            (this._renderer = i)
        }
      }
    },
    EBrf: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'splitThousands', function () {
          return n
        })
      var r = i('ivNn')
      function n(e, t = '&nbsp;') {
        let i = e + ''
        ;-1 !== i.indexOf('e') &&
          (i = (function (e) {
            return Object(r.fixComputationError)(e)
              .toFixed(10)
              .replace(/\.?0+$/, '')
          })(Number(e)))
        const n = i.split('.')
        return n[0].replace(/\B(?=(\d{3})+(?!\d))/g, t) + (n[1] ? '.' + n[1] : '')
      }
    },
    FVHe: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'TrendLineStatsCache', function () {
          return f
        })
      var r = i('Eyy1'),
        n = i('aO4+'),
        s = i('txPx'),
        a = i('5/lF'),
        o = i('zDbI'),
        l = i('8xAY'),
        h = i('ikwP'),
        d = l.LabelSettings.fontSize,
        c = l.LabelSettings.lineSpacing,
        u = l.LabelSettings.paddingTopBottom
      const _ = Object(s.getLogger)('Chart.LineToolTrendLine')
      function p(e, t) {
        return !(!e && !t) && (!(!e || t) || !(e || !t) || e.index !== t.index || e.price !== t.price)
      }
      class f {
        constructor(e) {
          ;(this._sourcesToRow = new Map()),
            (this._rowsToSources = new Map()),
            (this._currentWidth = 400),
            (this._actualCapacity = 1),
            (this._currentSymbol = ''),
            (this._params = e)
          const t = c,
            i = d + t
          ;(this._maxRowHeight = 3 * i - t + 2 * u + 2), this._recreateCanvas()
        }
        destroy() {
          delete this._canvas, delete this._ctx
        }
        canvas() {
          return this._canvas
        }
        topByRow(e) {
          return e * this._maxRowHeight
        }
        rowHeight(e) {
          const t = Object(r.ensureDefined)(this._rowsToSources.get(e)),
            i = Object(r.ensureDefined)(this._sourcesToRow.get(t)).effectiveState
          return null !== i ? i.realRowHeight : this._maxRowHeight
        }
        rowWidth(e) {
          const t = Object(r.ensureDefined)(this._rowsToSources.get(e))
          return Object(r.ensureDefined)(this._sourcesToRow.get(t)).width
        }
        currentWidth() {
          return this._currentWidth
        }
        updateSource(e, t) {
          const i = e.properties().symbol.value()
          this._currentSymbol !== i &&
            (_.logDebug(
              'TrendLineCache. Clearing canvas because of changing symbol from ' + this._currentSymbol + ' to ' + i,
            ),
            (this._currentSymbol = i),
            this._sourcesToRow.clear(),
            this._rowsToSources.clear())
          const r = e.id()
          let n = this._sourcesToRow.get(r)
          if (void 0 === n) {
            const e = this._findEmptyRow(r)
            ;(n = { effectiveState: null, rowIndex: e, width: 0 }),
              this._sourcesToRow.set(r, n),
              this._rowsToSources.set(e, r)
          }
          const s = n.effectiveState,
            a = this._effectiveState(e)
          if (!this._effectiveStatesEquals(s, a)) {
            const e = t()
            this._repaintSource(r, n.rowIndex, e), (n.effectiveState = a)
          }
          return n
        }
        _findEmptyRow(e) {
          let t = 0
          for (; void 0 !== this._rowsToSources.get(t); ) t++
          return (
            this._rowsToSources.set(t, e),
            t >= this._actualCapacity && (this._actualCapacity++, this._recreateCanvas()),
            t
          )
        }
        _effectiveState(e) {
          const t = e.properties(),
            i = t.showBarsRange.value(),
            n = t.showDateTimeRange.value(),
            s = t.showDistance.value(),
            a = t.showPriceRange.value(),
            o = t.showAngle.value()
          let l = 0
          ;(i || n || s) && l++, o && l++, a && l++
          const h = (d + c) * l - c + 2 * u + 2
          return {
            p1: Object.assign({}, e.points()[0]),
            p2: Object.assign({}, e.points()[1]),
            props: e.properties(),
            showBars: i,
            showTimeRange: n,
            showDistance: s,
            showPriceRange: a,
            showAngle: o,
            dark: e.model().isDark(),
            priceRange: Object(r.ensureNotNull)(Object(r.ensureNotNull)(e.priceScale()).priceRange()).state(),
            barSpacing: e.model().timeScale().barSpacing(),
            realRowHeight: h,
          }
        }
        _effectiveStatesEquals(e, t) {
          if (null !== e && null === t) return !1
          if (null === e && null !== t) return !1
          const i = Object(r.ensureNotNull)(e),
            n = Object(r.ensureNotNull)(t)
          if (p(i.p1, n.p1)) return !1
          if (p(i.p2, n.p2)) return !1
          if (i.dark !== n.dark) return !1
          if (i.showBars !== n.showBars) return !1
          if (i.showTimeRange !== n.showTimeRange) return !1
          if (i.showDistance !== n.showDistance) return !1
          if (i.showPriceRange !== n.showPriceRange) return !1
          if (i.showAngle !== n.showAngle) return !1
          if (i.showAngle || i.showDistance) {
            if (i.priceRange.min !== n.priceRange.min) return !1
            if (i.priceRange.max !== n.priceRange.max) return !1
            if (i.barSpacing !== n.barSpacing) return !1
          }
          return !0
        }
        _repaintSource(e, t, i) {
          ;(i.points[0] = new n.Point(0, 0)),
            (i.offsetX = 0),
            (i.offsetY = 0),
            delete i.horzAlign,
            delete i.vertAlign,
            Object(h.drawScaled)(this._ctx, this._params.pixelRatio, () => {
              this._ctx.translate(0.5, this.topByRow(t) + 0.5),
                this._ctx.clearRect(0, 0, this._currentWidth, this._maxRowHeight)
              const n = new a.TrendLineStatsRenderer(i, { widths: [] }).draw(this._ctx, this._params)
              Object(r.ensureDefined)(this._sourcesToRow.get(e)).width = n.width
            })
        }
        _recreateCanvas() {
          ;(this._canvas = Object(r.ensureNotNull)(document.createElement('canvas'))),
            (this._canvas.width = this._currentWidth * this._params.pixelRatio),
            (this._canvas.height = this._maxRowHeight * this._actualCapacity * this._params.pixelRatio),
            (this._ctx = Object(r.ensureNotNull)(this._canvas.getContext('2d'))),
            (this._ctx.font = `${d}px ${o.CHART_FONT_FAMILY}`),
            this._sourcesToRow.clear(),
            this._rowsToSources.clear()
        }
      }
    },
    Fx2Q: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'LineToolHeadAndShouldersPaneView', function () {
          return p
        })
      var r = i('hBTJ'),
        n = i('YFKU'),
        s = i('8Uy/'),
        a = i('pJOz'),
        o = i('/S7V'),
        l = i('qgcf'),
        h = i('Zy3/'),
        d = i('a7Ha'),
        c = i('BCbF'),
        u = i('aB9a')
      const _ = {
        leftShoulder: Object(n.t)('Left Shoulder'),
        rightShoulder: Object(n.t)('Right Shoulder'),
        head: Object(n.t)('Head'),
      }
      class p extends u.LineSourcePaneView {
        constructor() {
          super(...arguments),
            (this._trendLineRenderer = new a.TrendLineRenderer()),
            (this._triangleRendererPoints234 = new o.TriangleRenderer()),
            (this._intersect1Renderer = new o.TriangleRenderer()),
            (this._intersect2Renderer = new o.TriangleRenderer()),
            (this._polyLineRenderer = new c.PolygonRenderer(null)),
            (this._leftShoulderLabelRenderer = new l.TextRenderer()),
            (this._headLabelRenderer = new l.TextRenderer()),
            (this._rightShoulderLabelRenderer = new l.TextRenderer()),
            (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          let e, t
          super._updateImpl(), (this._renderer = null)
          const [i, a, o, l, c, u, p] = this._points
          if (this._points.length >= 5) {
            const n = Object(r.intersectLineSegments)(o, c, i, a)
            if (null !== n) {
              const t = c.subtract(o)
              e = o.add(t.scaled(n))
            }
            if (7 === this._points.length) {
              const e = Object(r.intersectLineSegments)(o, c, u, p)
              if (null !== e) {
                const i = c.subtract(o)
                t = o.add(i.scaled(e))
              }
            }
          }
          if (this._points.length < 2) return
          const f = this._source.properties().childs(),
            g = new h.CompositeRenderer(),
            v = (e, t) => ({
              points: [e],
              text: Object(n.t)(t),
              color: f.textcolor.value(),
              horzAlign: 'center',
              vertAlign: 'middle',
              font: f.font.value(),
              offsetX: 0,
              offsetY: 0,
              bold: f.bold && f.bold.value(),
              italic: f.italic && f.italic.value(),
              fontsize: f.fontsize.value(),
              backgroundColor: f.color.value(),
              backgroundRoundRect: 4,
            }),
            w = (e, t, i) => ({
              points: [e, t, i],
              color: 'rgba(0, 0, 0, 0)',
              linewidth: 0,
              backcolor: f.backgroundColor.value(),
              fillBackground: f.fillBackground.value(),
              transparency: f.transparency.value(),
            }),
            x = {
              points: this._points,
              color: f.color.value(),
              linewidth: f.linewidth.value(),
              linestyle: s.LINESTYLE_SOLID,
              backcolor: 'rgba(0, 0, 0, 0)',
              fillBackground: !1,
              filled: !1,
            }
          if ((this._polyLineRenderer.setData(x), g.append(this._polyLineRenderer), this._points.length >= 5)) {
            let i,
              r,
              n = !1,
              a = !1
            e ? (i = e) : ((i = o), (n = !0)), t ? (r = t) : ((r = c), (a = !0))
            const h = {
              points: [i, r],
              color: f.color.value(),
              linewidth: f.linewidth.value(),
              linestyle: s.LINESTYLE_DOTTED,
              extendleft: !1,
              extendright: !1,
              leftend: d.LineEnd.Normal,
              rightend: d.LineEnd.Normal,
            }
            ;(h.extendleft = n),
              (h.extendright = a),
              this._trendLineRenderer.setData(h),
              g.append(this._trendLineRenderer)
            const u = w(o, l, c)
            this._triangleRendererPoints234.setData(u), g.append(this._triangleRendererPoints234)
          }
          if (e) {
            const t = w(e, a, o)
            this._intersect1Renderer.setData(t), g.append(this._intersect1Renderer)
          }
          if (t) {
            const e = w(c, u, t)
            this._intersect2Renderer.setData(e), g.append(this._intersect2Renderer)
          }
          if (this._points.length >= 2) {
            const e = v(a, _.leftShoulder)
            a.y < i.y ? ((e.vertAlign = 'bottom'), (e.offsetY = 5)) : ((e.vertAlign = 'top'), (e.offsetY = 5)),
              this._leftShoulderLabelRenderer.setData(e),
              g.append(this._leftShoulderLabelRenderer)
          }
          if (this._points.length >= 4) {
            const e = v(l, _.head)
            l.y < o.y ? ((e.vertAlign = 'bottom'), (e.offsetY = 5)) : ((e.vertAlign = 'top'), (e.offsetY = 5)),
              this._headLabelRenderer.setData(e),
              g.append(this._headLabelRenderer)
          }
          if (this._points.length >= 6) {
            const e = v(u, _.rightShoulder)
            u.y < c.y ? ((e.vertAlign = 'bottom'), (e.offsetY = 5)) : ((e.vertAlign = 'top'), (e.offsetY = 5)),
              this._rightShoulderLabelRenderer.setData(e),
              g.append(this._rightShoulderLabelRenderer)
          }
          this.addAnchors(g), (this._renderer = g)
        }
      }
    },
    FzRY: function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('pJOz').TrendLineRenderer,
        s = i('cjIn').PaneRendererCachedImage,
        a = i('VdBB').HitTestResult,
        o = i('Zy3/').CompositeRenderer,
        l = i('zXvd').NumericFormatter,
        h = i('QA6D').EllipseRendererSimple,
        d = i('a7Ha').LineEnd,
        c = i('NCfL').LineToolPaneViewWithLevelledTextCache
      t.FibCirclesPaneView = class extends c {
        constructor(e, t) {
          super(e, t),
            (this._rendererCache = {}),
            (this._numericFormatter = new l()),
            (this._trendLineRenderer = new n()),
            (this._renderer = null)
        }
        getCacheRects(e, t) {
          super.getCacheRects(e, t)
          var i = this._cacheState.preparedCells.cells[this._levels[t].index - 1]
          if (i) {
            var r = this._levels[t],
              n = {
                left: i.left,
                top: this._cache.topByRow(this._cacheState.row),
                width: i.width,
                height: this._cache.rowHeight(this._cacheState.row),
              }
            return {
              cacheRect: n,
              targetRect: {
                left: Math.round(r.labelPoint.x - n.width),
                top: Math.round(r.labelPoint.y - n.height / 2),
                width: i.width,
                height: n.height,
              },
            }
          }
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            (this._renderer = null),
            !(this._source.points().length < 2) &&
              this._source.priceScale() &&
              !this._source.priceScale().isEmpty() &&
              !this._model.timeScale().isEmpty())
          ) {
            var e = this._points[0],
              t = this._points[1]
            this._center = e.add(t).scaled(0.5)
            var i = Math.abs(t.x - e.x),
              n = Math.abs(t.y - e.y)
            this._levels = []
            for (var l = this._source.properties(), c = this._source.levelsCount(), u = 1; u <= c; u++) {
              var _ = l['level' + u]
              if (_.visible.value()) {
                var p = _.coeff.value(),
                  f = _.color.value(),
                  g = []
                g.push(new r(this._center.x - 0.5 * i * p, this._center.y - 0.5 * n * p)),
                  g.push(new r(this._center.x + 0.5 * i * p, this._center.y + 0.5 * n * p))
                var v = new r(this._center.x, this._center.y + 0.5 * n * p)
                this._levels.push({
                  color: f,
                  points: g,
                  labelPoint: v,
                  linewidth: _.linewidth.value(),
                  linestyle: _.linestyle.value(),
                  index: u,
                })
              }
            }
            if (!(this._points.length < 2)) {
              var w = new o(),
                x = l.fillBackground.value(),
                m = l.transparency.value()
              for (u = 0; u < this._levels.length; u++) {
                var y = this._levels[u],
                  b = {}
                ;(b.points = y.points),
                  (b.color = y.color),
                  (b.linewidth = y.linewidth),
                  (b.backcolor = y.color),
                  u > 0 && (b.wholePoints = this._levels[u - 1].points),
                  (b.fillBackground = x),
                  (b.transparency = m)
                var R = new a(a.MOVEPOINT, null, y.index)
                if ((w.append(new h(b, R)), l.showCoeffs.value())) {
                  var T = new s(this, u)
                  w.append(T)
                }
              }
              if (l.trendline.visible.value()) {
                var S = {
                  points: [this._points[0], this._points[1]],
                  width: this._model.timeScale().width(),
                  height: this._source.priceScale().height(),
                  color: l.trendline.color.value(),
                  linewidth: l.trendline.linewidth.value(),
                  linestyle: l.trendline.linestyle.value(),
                  extendleft: !1,
                  extendright: !1,
                  leftend: d.Normal,
                  rightend: d.Normal,
                }
                this._trendLineRenderer.setData(S), w.append(this._trendLineRenderer)
              }
              this.addAnchors(w), (this._renderer = w)
            }
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    'GS+0': function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('aB9a').LineSourcePaneView,
        s = i('z+cS').VerticalLineRenderer,
        a = i('pJOz').TrendLineRenderer,
        o = i('VdBB').HitTestResult,
        l = i('Zy3/').CompositeRenderer,
        h = i('a7Ha').LineEnd
      t.LineToolCircleLinesPaneView = class extends n {
        constructor(e, t) {
          super(e, t), (this._lines = []), (this._trendRenderer = new a()), (this._renderer = null)
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), !(this._source.points().length < 2))) {
            var e = this._model.timeScale()
            if (this._source.priceScale() && !this._source.priceScale().isEmpty() && !e.isEmpty()) {
              var t = this._source.points()[0],
                i = this._source.points()[1],
                n = i ? i.index - t.index : 1
              if (((this._lines = []), 0 !== n)) {
                var a = e.visibleBarsStrictRange()
                if (n > 0)
                  for (var d = t.index; d <= a.lastBar(); d += n) this._lines.push({ x: e.indexToCoordinate(d) })
                else for (d = t.index; d >= a.firstBar(); d += n) this._lines.push({ x: e.indexToCoordinate(d) })
                if (!(this._points.length < 2)) {
                  var c = new l(),
                    u = this._source.properties(),
                    _ = {
                      points: [t, i],
                      width: this._model.timeScale().width(),
                      height: this._source.priceScale().height(),
                      color: u.trendline.color.value(),
                      linewidth: u.trendline.linewidth.value(),
                      linestyle: u.trendline.linestyle.value(),
                      extendleft: !1,
                      extendright: !1,
                      leftend: h.Normal,
                      rightend: h.Normal,
                    }
                  this._trendRenderer.setData(_), c.append(this._trendRenderer)
                  var p = this._model.timeScale().width(),
                    f = this._source.priceScale().height()
                  for (d = 0; d < this._lines.length; d++) {
                    var g = {
                        width: p,
                        height: f,
                        x: this._lines[d].x,
                        color: u.linecolor.value(),
                        linewidth: u.linewidth.value(),
                        linestyle: u.linestyle.value(),
                      },
                      v = new s()
                    v.setData(g), c.append(v)
                  }
                  if (2 === this._source.points().length) {
                    var w = [].concat(this._points)
                    c.append(this.createLineAnchor({ points: w }, 0))
                  } else
                    c.append(
                      this.createLineAnchor(
                        {
                          points: [new r(this._points[0].x, this._source.priceScale().height() / 2)],
                          hittestResult: o.MOVEPOINT,
                        },
                        1,
                      ),
                    )
                  this._renderer = c
                }
              }
            }
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    GW0y: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'RectanglePaneView', function () {
          return d
        })
      var r = i('aO4+'),
        n = i('zDbI'),
        s = i('IjC5'),
        a = i('Zy3/'),
        o = i('qgcf'),
        l = i('aB9a'),
        h = i('//lt')
      class d extends l.LineSourcePaneView {
        constructor(e, t) {
          super(e, t),
            (this._rectangleRenderer = new s.RectangleRenderer()),
            (this._textRenderer = new o.TextRenderer()),
            (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), this._points.length < 2)) return
          const e = this._getSource().properties().childs(),
            t = {
              points: this._points,
              color: e.color.value(),
              linewidth: e.linewidth.value(),
              backcolor: e.backgroundColor.value(),
              fillBackground: e.fillBackground.value(),
              transparency: e.transparency.value(),
              extendLeft: e.extendLeft.value(),
              extendRight: e.extendRight.value(),
              includeRightEdge: !0,
            }
          this._rectangleRenderer.setData(t)
          const i = new a.CompositeRenderer()
          i.append(this._rectangleRenderer)
          const s = this._points[0],
            o = this._points[1]
          if (e.showLabel.value()) {
            const t = Math.min(s.x, o.x),
              a = Math.max(s.x, o.x),
              l = Math.min(s.y, o.y),
              h = Math.max(s.y, o.y)
            let d, c, u, _
            const p = e.fontSize.value() / 3
            let f,
              g,
              v = 0
            switch (e.vertLabelsAlign.value()) {
              case 'middle':
                ;(_ = (l + h) / 2), (c = 'middle'), (v = p)
                break
              case 'top':
                ;(_ = h), (c = 'top')
                break
              case 'bottom':
                ;(_ = l), (c = 'bottom')
            }
            switch (e.horzLabelsAlign.value()) {
              case 'center':
                ;(u = (t + a) / 2), (d = 'center')
                break
              case 'left':
                ;(u = t), (d = 'left')
                break
              case 'right':
                ;(u = a), (d = 'right')
            }
            'middle' === c && ((f = a - t - 2 * v), (g = h - l))
            const w = {
              points: [new r.Point(u, _)],
              text: e.text.value(),
              fontSize: e.fontSize.value(),
              font: n.CHART_FONT_FAMILY,
              bold: e.bold.value(),
              italic: e.italic.value(),
              horzAlign: d,
              vertAlign: c,
              color: e.textColor.value(),
              wordWrapWidth: f,
              maxHeight: g,
              offsetX: 0,
              offsetY: 0,
              boxPaddingVert: p,
              boxPaddingHorz: v,
              forceTextAlign: !0,
            }
            this._textRenderer.setData(w), i.append(this._textRenderer)
          }
          this._addAnchors(s, o, i), (this._renderer = i)
        }
        _addAnchors(e, t, i) {
          const n = new r.Point(e.x, t.y)
          n.data = 2
          const s = new r.Point(t.x, e.y)
          s.data = 3
          const a = new r.Point(e.x, 0.5 * (e.y + t.y))
          a.data = 4
          const o = new r.Point(t.x, 0.5 * (e.y + t.y))
          o.data = 5
          const l = new r.Point(0.5 * (e.x + t.x), e.y)
          l.data = 6
          const d = new r.Point(0.5 * (e.x + t.x), t.y)
          ;(d.data = 7), [a, o, l, d].forEach(e => (e.square = !0))
          const c = e.x - t.x,
            u = e.y - t.y,
            _ = Math.sign(c * u),
            p = [
              _ < 0 ? h.PaneCursorType.DiagonalNeSwResize : h.PaneCursorType.DiagonalNwSeResize,
              _ < 0 ? h.PaneCursorType.DiagonalNeSwResize : h.PaneCursorType.DiagonalNwSeResize,
              _ > 0 ? h.PaneCursorType.DiagonalNeSwResize : h.PaneCursorType.DiagonalNwSeResize,
              _ > 0 ? h.PaneCursorType.DiagonalNeSwResize : h.PaneCursorType.DiagonalNwSeResize,
              h.PaneCursorType.HorizontalResize,
              h.PaneCursorType.HorizontalResize,
              h.PaneCursorType.VerticalResize,
              h.PaneCursorType.VerticalResize,
            ]
          i.append(this.createLineAnchor({ points: [e, t, n, s, a, o, l, d], pointsCursorType: p }, 0))
        }
      }
    },
    GzSs: function (e, t, i) {
      'use strict'
      var r = i('aB9a').LineSourcePaneView,
        n = i('jkoZ'),
        s = i('VdBB').HitTestResult,
        a = i('EBrf').splitThousands,
        o = i('Ialn'),
        l = i('2uTr').appendEllipsis,
        h = i('cPgM').ScaledPaneRenderer
      class d extends h {
        constructor(e, t) {
          super(), (this._data = null), (this._cache = e), (this._adapter = t)
        }
        setData(e) {
          this._data = e
        }
        _height() {
          return Math.max(
            20,
            1 + Math.max(n.fontHeight(this._adapter.getBodyFont()), n.fontHeight(this._adapter.getQuantityFont())),
          )
        }
        _bodyWidth(e) {
          if (0 === this._adapter.getText().length) return 0
          e.save(), (e.font = this._adapter.getBodyFont())
          var t = e.measureText(this._adapter.getText()).width
          return e.restore(), Math.round(10 + t)
        }
        _getQuantity() {
          var e = this._adapter.getQuantity()
          return isNaN(e) ? e : a(this._adapter.getQuantity(), ' ')
        }
        _quantityWidth(e) {
          if (0 === this._getQuantity().length) return 0
          e.save(), (e.font = this._adapter.getQuantityFont())
          var t = e.measureText(this._getQuantity()).width
          return e.restore(), Math.round(Math.max(this._height(), 10 + t))
        }
        _reverseButtonWidth() {
          return this._adapter.isOnReverseCallbackPresent() ? this._height() : 0
        }
        _closeButtonWidth() {
          return this._adapter.isOnCloseCallbackPresent() ? this._height() : 0
        }
        _drawLines(e, t, i, r, n) {
          e.save(),
            (e.strokeStyle = this._adapter.getLineColor()),
            (e.lineStyle = this._adapter.getLineStyle()),
            (e.lineWidth = this._adapter.getLineWidth()),
            CanvasEx.drawLine(e, i, r, n, r),
            this._adapter.getExtendLeft() && CanvasEx.drawLine(e, 0, r, t, r),
            e.restore()
        }
        _drawBody(e, t, i) {
          ;(e.strokeStyle = this._adapter.getBodyBorderColor()), (e.fillStyle = this._adapter.getBodyBackgroundColor())
          var r = this._bodyWidth(e),
            n = this._height()
          e.fillRect(t + 0.5, i + 0.5, r - 1, n - 1), e.strokeRect(t, i, r, n)
        }
        _drawBodyText(e, t, i) {
          e.save(),
            (e.textAlign = 'center'),
            (e.textBaseline = 'middle'),
            (e.font = this._adapter.getBodyFont()),
            (e.fillStyle = this._adapter.getBodyTextColor())
          var r = t + this._bodyWidth(e) / 2,
            n = i + this._height() / 2
          e.fillText(this._adapter.getText(), r, n), e.restore()
        }
        _drawQuantity(e, t, i) {
          ;(e.strokeStyle = this._adapter.getQuantityBorderColor()),
            (e.fillStyle = this._adapter.getQuantityBackgroundColor())
          var r = this._quantityWidth(e),
            n = this._height()
          e.fillRect(t + 0.5, i + 0.5, r - 1, n - 1), e.strokeRect(t, i, r, n)
        }
        _drawQuantityText(e, t, i) {
          e.save(),
            (e.textAlign = 'center'),
            (e.textBaseline = 'middle'),
            (e.font = this._adapter.getQuantityFont()),
            (e.fillStyle = this._adapter.getQuantityTextColor())
          var r = t + this._quantityWidth(e) / 2,
            n = i + this._height() / 2
          e.fillText(o.startWithLTR(this._getQuantity() + ''), r, n), e.restore()
        }
        _drawReverseButton(e, t, i) {
          e.save(),
            (e.strokeStyle = this._adapter.getReverseButtonBorderColor()),
            (e.fillStyle = this._adapter.getReverseButtonBackgroundColor())
          var r = this._reverseButtonWidth(),
            n = this._height()
          e.fillRect(t + 0.5, i + 0.5, r - 1, n - 1),
            e.strokeRect(t, i, r, n),
            (e.strokeStyle = this._adapter.getReverseButtonIconColor())
          var s = function (e, t) {
              CanvasEx.setLineStyle(e, CanvasEx.LINESTYLE_SOLID),
                CanvasEx.drawLine(e, 0, 0, 0, t),
                CanvasEx.drawLine(e, -1, 1, 1, 1),
                CanvasEx.drawLine(e, -2, 2, 2, 2)
            },
            a = t + Math.round((this._reverseButtonWidth() - 6) / 2),
            o = i + 5
          e.save(),
            e.translate(a, o),
            s(e, 10),
            e.translate(6, 10),
            e.rotate(Math.PI),
            s(e, 10),
            e.restore(),
            this._adapter._blocked &&
              ((e.fillStyle = 'rgba(140, 140, 140, 0.75)'), e.fillRect(t + 0.5, i + 0.5, r - 1, n - 1)),
            e.restore()
        }
        _drawCloseButton(e, t, i) {
          e.save(),
            (e.strokeStyle = this._adapter.getCloseButtonBorderColor()),
            (e.fillStyle = this._adapter.getCloseButtonBackgroundColor())
          var r = this._closeButtonWidth(),
            n = this._height()
          e.fillRect(t + 0.5, i + 0.5, r - 1, n - 1), e.strokeRect(t, i, r, n)
          var s = t + r,
            a = i + n
          e.strokeStyle = this._adapter.getCloseButtonIconColor()
          var o = (this._closeButtonWidth() - 8) / 2,
            l = (this._height() - 8) / 2
          CanvasEx.drawPoly(
            e,
            [
              { x: t + o, y: i + l },
              { x: s - o, y: a - l },
            ],
            !0,
          ),
            CanvasEx.drawPoly(
              e,
              [
                { x: s - o, y: i + l },
                { x: t + o, y: a - l },
              ],
              !0,
            ),
            this._adapter._blocked &&
              ((e.fillStyle = 'rgba(140, 140, 140, 0.75)'), e.fillRect(t + 0.5, i + 0.5, r - 1, n - 1)),
            e.restore()
        }
        _drawImpl(e) {
          if (null !== this._data && this._data.points && !(this._data.points.length < 1)) {
            var t = this._data.width,
              i = this._bodyWidth(e),
              r = this._quantityWidth(e),
              n = this._reverseButtonWidth(e),
              s = i + r + n + this._closeButtonWidth(),
              a = t - s,
              o = Math.max((this._adapter.getLineLength() / 100) * t, 1),
              l = Math.round(t - Math.min(a, o)),
              h = l - s,
              d = Math.round(this._data.points[0].y),
              c = Math.round(d - (this._height() + 1) / 2)
            ;(this._cache.bodyRight = h + i),
              (this._cache.quantityRight = this._cache.bodyRight + r),
              (this._cache.reverseButtonRight = this._cache.quantityRight + n),
              (this._cache.top = c),
              (this._cache.bottom = c + this._height()),
              (this._cache.left = h),
              (this._cache.right = l),
              this._drawLines(e, h, l, d, t),
              0 !== i && (this._drawBody(e, h, c), this._drawBodyText(e, h, c)),
              0 !== r &&
                (this._drawQuantity(e, this._cache.bodyRight, c), this._drawQuantityText(e, this._cache.bodyRight, c)),
              0 !== n && this._drawReverseButton(e, this._cache.quantityRight, c),
              0 !== this._closeButtonWidth() && this._drawCloseButton(e, this._cache.reverseButtonRight, c)
          }
        }
        hitTest(e) {
          return null === this._data ||
            0 === this._data.points.length ||
            e.y < this._cache.top ||
            e.y > this._cache.bottom ||
            e.x < this._cache.left ||
            this._cache.right < e.x
            ? null
            : this._adapter._blocked
            ? new s(s.CUSTOM, {})
            : e.x >= this._cache.bodyRight && e.x < this._cache.quantityRight && this._adapter._onModifyCallback
            ? new s(s.CUSTOM, {
                clickHandler: this._adapter.callOnModify.bind(this._adapter),
                tapHandler: this._adapter.callOnModify.bind(this._adapter),
                tooltip: {
                  text: this._adapter.getProtectTooltip() || l(window.t('Protect Position')),
                  rect: {
                    x: this._cache.bodyRight,
                    y: this._cache.top,
                    w: this._cache.quantityRight - this._cache.bodyRight,
                    h: this._cache.bottom - this._cache.top,
                  },
                },
              })
            : e.x >= this._cache.quantityRight && e.x < this._cache.reverseButtonRight
            ? new s(s.CUSTOM, {
                clickHandler: this._adapter.callOnReverse.bind(this._adapter),
                tapHandler: this._adapter.callOnReverse.bind(this._adapter),
                tooltip: {
                  text: this._adapter.getReverseTooltip() || window.t('Reverse Position'),
                  rect: {
                    x: this._cache.quantityRight,
                    y: this._cache.top,
                    w: this._cache.reverseButtonRight - this._cache.quantityRight,
                    h: this._cache.bottom - this._cache.top,
                  },
                },
              })
            : e.x >= this._cache.reverseButtonRight && e.x < this._cache.right
            ? new s(s.CUSTOM, {
                clickHandler: this._adapter.callOnClose.bind(this._adapter),
                tapHandler: this._adapter.callOnClose.bind(this._adapter),
                tooltip: {
                  text: this._adapter.getCloseTooltip() || window.t('Close Position'),
                  rect: {
                    x: this._cache.reverseButtonRight,
                    y: this._cache.top,
                    w: this._cache.right - this._cache.reverseButtonRight,
                    h: this._cache.bottom - this._cache.top,
                  },
                },
              })
            : new s(s.CUSTOM, {
                clickHandler: function () {},
                tapHandler: function () {},
                tooltip: {
                  text: this._adapter.getTooltip(),
                  rect: {
                    x: this._cache.left,
                    y: this._cache.top,
                    w: this._cache.bodyRight - this._cache.left,
                    h: this._cache.bottom - this._cache.top,
                  },
                },
              })
        }
      }
      t.PositionPaneView = class extends r {
        constructor(e, t) {
          super(e, t), (this._rendererCache = {}), (this._renderer = new d(this._rendererCache, e._adapter))
        }
        renderer(e, t) {
          return (
            this._invalidated && this._updateImpl(),
            this._renderer.setData({ points: this._points, width: this._model.timeScale().width() }),
            this._renderer
          )
        }
      }
    },
    'Ht/7': function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('aB9a').LineSourcePaneView,
        s = i('pJOz').TrendLineRenderer,
        a = i('VdBB').HitTestResult,
        o = i('Zy3/').CompositeRenderer,
        l = i('Hr11'),
        h = i('Tmoa'),
        d = i('zDbI').CHART_FONT_FAMILY,
        c = i('QPcX').LetterInCircleRenderer,
        u = i('Tmoa').resetTransparency,
        _ = {
          4: { font: 24, circle: 36, circleBorderWidth: 1, bold: !0 },
          3: { font: 20, circle: 28, circleBorderWidth: 1, bold: !1 },
          2: { font: 18, circle: 22, circleBorderWidth: 1, bold: !1 },
          1: { font: 16, circle: 22, circleBorderWidth: 1, bold: !1 },
          0: { font: 11, circle: 14, circleBorderWidth: 1, bold: !0 },
        }
      t.ElliottLabelsPaneView = class extends n {
        constructor(e, t) {
          super(e, t), (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          super._updateImpl(), (this._renderer = null), (this._wave = [])
          var e = this._source.properties(),
            t = this._source.priceScale(),
            i = this._model.timeScale()
          if (t && !t.isEmpty() && !i.isEmpty()) {
            var n = e.color.value()
            if (e.showWave.value())
              for (
                var p = this._source.ownerSource().firstValue(), f = this._source.points(), g = 1;
                g < f.length;
                g++
              ) {
                var v = f[g - 1],
                  w = f[g],
                  x = i.indexToCoordinate(v.index),
                  m = i.indexToCoordinate(w.index),
                  y = v.price,
                  b = w.price,
                  R = t.priceToCoordinate(y, p),
                  T = t.priceToCoordinate(b, p),
                  S = {
                    points: [new r(x, R), new r(m, T)],
                    width: i.width(),
                    height: t.height(),
                    color: h.generateColor(n, 0),
                    linewidth: e.linewidth.value(),
                    linestyle: CanvasEx.LINESTYLE_SOLID,
                    extendleft: !1,
                    extendright: !1,
                    overlayLineEndings: !0,
                  }
                this._wave.push(S)
              }
            var P = this.areAnchorsVisible() ? 0 : 1,
              L = new o()
            for (e = this._source.properties(), g = 0; g < this._wave.length; g++) {
              var C = new s()
              C.setData(this._wave[g]), L.append(C)
            }
            var M = 1
            if (this._points.length > 2) {
              ;(v = this._points[2]), (w = this._points[1])
              M = l.sign(v.y - w.y)
            }
            var I = 0
            this._model.lineBeingCreated() === this._source && (I = 1)
            for (n = u(e.color.value()), g = 0; g < this._points.length - I; g++, M = -M)
              if (!(g < P)) {
                var O = this._source.label(g),
                  N = O.label,
                  D = 'circle' === O.decoration
                'brackets' === O.decoration && (N = '(' + N + ')')
                var B = _[O.group],
                  k = new a(a.CHANGEPOINT, { pointIndex: g })
                L.append(
                  new c(
                    {
                      point: this._points[g],
                      letter: N,
                      color: n,
                      font: d,
                      fontSize: B.font,
                      bold: B.bold,
                      showCircle: D,
                      circleRadius: B.circle / 2,
                      circleBorderWidth: B.circleBorderWidth,
                      yOffset: 10,
                      vertAlign: 1 === M ? 'top' : 'bottom',
                    },
                    k,
                  ),
                )
              }
            for (var A = [], E = 0; E < this._points.length; E++) {
              var z = this._points[E].clone()
              ;(z.data = E), A.push(z)
            }
            this._model.lineBeingCreated() === this._source && A.pop(),
              L.append(this.createLineAnchor({ points: A }, 0)),
              (this._renderer = L)
          }
        }
      }
    },
    Hyqq: function (e, t, i) {
      'use strict'
      i.r(t)
      var r = i('XlJ7'),
        n = i('Tmoa'),
        s = i('zDbI'),
        a = i('aB9a'),
        o = i('aO4+'),
        l = i('f6yo'),
        h = i('Ialn'),
        d = i('ikwP'),
        c = i('cPgM'),
        u = i('VdBB')
      class _ extends c.ScaledPaneRenderer {
        constructor() {
          super(),
            (this._geometryCache = { innerHeight: NaN, textHorizontalPadding: NaN, innerWidth: NaN, paddingLeft: NaN }),
            (this._geomertryCacheInvalidated = !0),
            (this._data = null)
        }
        setData(e) {
          ;(this._data = e), (this._geomertryCacheInvalidated = !0)
        }
        hitTest(e, t) {
          if (null === this._data || 0 === this._data.points.length) return null
          const i = this._data.points[0].x - (this._geometryCache.paddingLeft + 20),
            r = this._data.points[0].y - (this._geometryCache.innerHeight + 9),
            n = Object(o.box)(
              new o.Point(i, r),
              new o.Point(i + this._geometryCache.innerWidth, r + this._geometryCache.innerHeight),
            )
          return Object(l.pointInBox)(e, n)
            ? new u.HitTestResult(u.HitTestResult.MOVEPOINT, { areaName: u.AreaName.Text })
            : null
        }
        _drawImpl(e, t) {
          if (null === this._data || 0 === this._data.points.length) return
          e.font = this._data.font
          const i = this._measureInfo(e, this._data.label, this._data.fontSize),
            { paddingLeft: r, innerHeight: n, innerWidth: s, textHorizontalPadding: a } = i
          e.textAlign = Object(h.isRtl)() ? 'right' : 'left'
          const o = this._data.points[0].x - (r + 20),
            l = this._data.points[0].y - (n + 9)
          e.translate(o, l),
            e.beginPath(),
            e.moveTo(24, n),
            e.lineTo(15, n),
            e.arcTo(-1e3, 0, 1e3, 0, n / 2),
            e.lineTo(s - 15, 0),
            e.arcTo(1e3, n, -1e3, n, n / 2),
            e.lineTo(33, n),
            e.quadraticCurveTo(33, n + 4, 35, n + 9),
            e.quadraticCurveTo(27, n + 6, 24, n),
            (e.fillStyle = this._data.backgroundColor),
            e.fill(),
            (e.strokeStyle = this._data.borderColor),
            (e.lineWidth = 2),
            e.stroke(),
            e.closePath(),
            (e.textBaseline = 'middle'),
            (e.fillStyle = this._data.color),
            e.fillText(this._data.label, r + a, n / 2)
        }
        _measureInfo(e, t, i) {
          if (this._geomertryCacheInvalidated) {
            const r = e.measureText(t),
              n = i,
              s = 15,
              a = Math.round(n / 1.3),
              o = r.width + 2 * s,
              l = n + 2 * a,
              h = Object(d.calcTextHorizontalShift)(e, r.width)
            ;(this._geometryCache = { paddingLeft: s, innerWidth: o, innerHeight: l, textHorizontalPadding: h }),
              (this._geomertryCacheInvalidated = !1)
          }
          return this._geometryCache
        }
      }
      var p = i('Zy3/'),
        f = i('vq8G')
      i.d(t, 'BalloonPaneView', function () {
        return g
      })
      class g extends a.LineSourcePaneView {
        constructor(e, t) {
          super(e, t), (this._balloonRenderer = new _()), (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl(e, t) {
          super._updateImpl(e, t)
          const i = this._source.properties().childs(),
            a = {
              points: this._points,
              color: i.color.value(),
              borderColor: i.borderColor.value(),
              backgroundColor: Object(n.generateColor)(i.backgroundColor.value(), i.transparency.value()),
              font: Object(r.makeFont)(i.fontsize.value(), s.CHART_FONT_FAMILY),
              fontSize: i.fontsize.value(),
              label: i.text.value(),
            }
          if ((this._balloonRenderer.setData(a), 1 === a.points.length)) {
            const e = new p.CompositeRenderer()
            return (
              e.append(this._balloonRenderer),
              e.append(
                new f.SelectionRenderer({
                  points: a.points,
                  bgColors: this._lineAnchorColors(a.points),
                  visible: this.areAnchorsVisible(),
                  barSpacing: this._model.timeScale().barSpacing(),
                  hittestResult: u.HitTestResult.MOVEPOINT,
                }),
              ),
              void (this._renderer = e)
            )
          }
          this._renderer = this._balloonRenderer
        }
      }
    },
    IMGS: function (e, t, i) {
      'use strict'
      var r = i('aB9a').LineSourcePaneView,
        n = i('QncP').prepareLinearRegressionRenderersData,
        s = i('NN6M').ParallelChannelRenderer,
        a = i('qgcf').TextRenderer,
        o = i('pJOz').TrendLineRenderer,
        l = i('vq8G').SelectionRenderer,
        h = i('VdBB').HitTestResult,
        d = i('Zy3/').CompositeRenderer,
        c = i('Tmoa')
      t.RegressionTrendPaneView = class extends r {
        constructor(e, t) {
          super(e, t),
            (this._calc = null),
            (this._lines = []),
            (this._pearsons = null),
            (this._pearsonsLabelRenderer = new a()),
            (this._renderer = null)
        }
        getTransparencyResetLines() {
          return this._lines.map(function (e) {
            var t = Object.assign({}, e)
            return (t.color = c.resetTransparency(t.color)), t
          })
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          super._updateImpl()
          const e = n(this._model, this._source)
          ;(this._lines = e.lines), (this._pearsons = e.pearsons), (this._renderer = null)
          for (
            var t = new d(), i = [], r = [this._lines[1], this._lines[0], this._lines[2]], a = [], u = 0;
            u < r.length;
            u++
          )
            r[u] && a.push(r[u])
          for (u = 1; u < a.length; u++) {
            var _ = {}
            ;(_.points = [r[u].floatPoints[0], r[u].floatPoints[1], r[u - 1].floatPoints[0], r[u - 1].floatPoints[1]]),
              (_.color = r[u].color),
              (_.width = this._model.timeScale().width()),
              (_.height = this._source.priceScale().height()),
              (_.linewidth = r[u].linewidth),
              (_.linestyle = r[u].linestyle),
              (_.extendleft = !1),
              (_.extendright = r[u].extendright),
              (_.backcolor = _.color),
              (_.transparency = this._source.properties().styles.transparency.value()),
              (_.skipLines = !0),
              (_.fillBackground = !0),
              (f = new s(new h(h.REGULAR))).setData(_),
              t.append(f)
          }
          var p = this.getTransparencyResetLines()
          for (u = 0; u < a.length; u++) {
            var f
            ;(f = new o()).setData(p[u]),
              f.setHitTest(new h(h.REGULAR)),
              t.append(f),
              0 !== u && (i = i.concat(this._lines[u].floatPoints))
          }
          if (
            (this._pearsons &&
              ((this._pearsons.color = c.resetTransparency(this._pearsons.color)),
              this._pearsonsLabelRenderer.setData(this._pearsons),
              t.append(this._pearsonsLabelRenderer)),
            this._lines && this._lines.length >= 1)
          ) {
            t.append(new l({ points: i, bgColors: this._lineAnchorColors(i), visible: this.areAnchorsVisible() }))
            var g = this._lines[0].floatPoints
            ;(g[0].data = 0), (g[1].data = 1), t.append(this.createLineAnchor({ points: g }, 0))
          }
          this._renderer = t
        }
      }
    },
    Jej9: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'LineToolTrianglePatternPaneView', function () {
          return u
        })
      var r = i('Eyy1'),
        n = i('aO4+'),
        s = i('8Uy/'),
        a = i('Zy3/'),
        o = i('pJOz'),
        l = i('/S7V'),
        h = i('qgcf'),
        d = i('a7Ha'),
        c = i('aB9a')
      class u extends c.LineSourcePaneView {
        constructor() {
          super(...arguments),
            (this._trendLineRendererPoints01 = new o.TrendLineRenderer()),
            (this._trendLineRendererPoints12 = new o.TrendLineRenderer()),
            (this._trendLineRendererPoints23 = new o.TrendLineRenderer()),
            (this._intersectionRenderer = new l.TriangleRenderer()),
            (this._aLabelRenderer = new h.TextRenderer()),
            (this._bLabelRenderer = new h.TextRenderer()),
            (this._cLabelRenderer = new h.TextRenderer()),
            (this._dLabelRenderer = new h.TextRenderer()),
            (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          super._updateImpl(), (this._renderer = null)
          const [e, t, i, o] = this._points
          let l, h, c
          if (4 === this._points.length) {
            if (Math.abs(i.x - e.x) < 1 || Math.abs(o.x - t.x) < 1) return
            let r = Math.min(e.x, t.x)
            ;(r = Math.min(r, i.x)), (r = Math.min(r, o.x))
            const s = (i.y - e.y) / (i.x - e.x),
              a = e.y + (r - e.x) * s,
              d = (o.y - t.y) / (o.x - t.x),
              u = t.y + (r - t.x) * d
            if (Math.abs(s - d) < 1e-6) return
            ;(h = new n.Point(r, a)), (c = new n.Point(r, u))
            const _ = (t.y - e.y + (e.x * s - t.x * d)) / (s - d)
            if (_ < r) {
              let r = Math.max(e.x, t.x)
              ;(r = Math.max(r, i.x)),
                (r = Math.max(r, o.x)),
                (h = new n.Point(r, e.y + (r - e.x) * s)),
                (c = new n.Point(r, t.y + (r - t.x) * d))
            }
            const p = e.y + (_ - e.x) * s
            l = new n.Point(_, p)
          }
          if (this._points.length < 2) return
          const u = this._source.properties().childs(),
            _ = new a.CompositeRenderer(),
            p = (e, t) => ({
              points: [e],
              text: t,
              color: u.textcolor.value(),
              vertAlign: 'middle',
              horzAlign: 'center',
              font: u.font.value(),
              offsetX: 0,
              offsetY: 0,
              bold: u.bold && u.bold.value(),
              italic: u.italic && u.italic.value(),
              fontsize: u.fontsize.value(),
              backgroundColor: u.color.value(),
              backgroundRoundRect: 4,
            }),
            f = (e, t) => ({
              points: [e, t],
              color: u.color.value(),
              linewidth: u.linewidth.value(),
              linestyle: s.LINESTYLE_SOLID,
              extendleft: !1,
              extendright: !1,
              leftend: d.LineEnd.Normal,
              rightend: d.LineEnd.Normal,
            })
          if (
            (this._trendLineRendererPoints01.setData(f(e, t)),
            _.append(this._trendLineRendererPoints01),
            this._points.length >= 3 &&
              (this._trendLineRendererPoints12.setData(f(t, i)), _.append(this._trendLineRendererPoints12)),
            4 === this._points.length &&
              (this._trendLineRendererPoints23.setData(f(i, o)), _.append(this._trendLineRendererPoints23), l))
          ) {
            const e = {
              points: [Object(r.ensureDefined)(h), Object(r.ensureDefined)(c), l],
              color: u.color.value(),
              linewidth: u.linewidth.value(),
              backcolor: u.backgroundColor.value(),
              fillBackground: u.fillBackground.value(),
              transparency: u.transparency.value(),
              linestyle: s.LINESTYLE_DOTTED,
            }
            this._intersectionRenderer.setData(e), _.append(this._intersectionRenderer)
          }
          const g = p(e, 'A')
          t.y > e.y ? ((g.vertAlign = 'bottom'), (g.offsetY = 5)) : ((g.vertAlign = 'top'), (g.offsetY = 5)),
            this._aLabelRenderer.setData(g),
            _.append(this._aLabelRenderer)
          const v = p(t, 'B')
          if (
            (t.y < e.y ? ((v.vertAlign = 'bottom'), (v.offsetY = 5)) : ((v.vertAlign = 'top'), (v.offsetY = 5)),
            this._bLabelRenderer.setData(v),
            _.append(this._bLabelRenderer),
            this._points.length > 2)
          ) {
            const e = p(i, 'C')
            i.y < t.y ? ((e.vertAlign = 'bottom'), (e.offsetY = 5)) : ((e.vertAlign = 'top'), (e.offsetY = 5)),
              this._cLabelRenderer.setData(e),
              _.append(this._cLabelRenderer)
          }
          if (this._points.length > 3) {
            const e = p(o, 'D')
            o.y < i.y ? ((e.vertAlign = 'bottom'), (e.offsetY = 5)) : ((e.vertAlign = 'top'), (e.offsetY = 5)),
              this._dLabelRenderer.setData(e),
              _.append(this._dLabelRenderer)
          }
          this.addAnchors(_), (this._renderer = _)
        }
      }
    },
    JeuX: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'PathPaneView', function () {
          return a
        })
      var r = i('BCbF'),
        n = i('Zy3/'),
        s = i('aB9a')
      class a extends s.LineSourcePaneView {
        constructor(e, t) {
          super(e, t),
            (this._polygonRenderer = new r.PolygonRenderer(null)),
            (this._renderer = new n.CompositeRenderer())
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          super._updateImpl(), this._renderer.clear()
          const e = this._source.properties().childs(),
            t = {
              points: this._points,
              color: e.lineColor.value(),
              linewidth: e.lineWidth.value(),
              linestyle: e.lineStyle.value(),
              leftend: e.leftEnd.value(),
              rightend: e.rightEnd.value(),
              filled: !1,
              backcolor: '',
              fillBackground: !1,
              transparency: 0,
            }
          this._polygonRenderer.setData(t),
            this._renderer.append(this._polygonRenderer),
            this.addAnchors(this._renderer)
        }
      }
    },
    KDMZ: function (e, t, i) {
      'use strict'
      i.d(t, 'a', function () {
        return o
      })
      var r = i('Eyy1'),
        n = i('aIyQ'),
        s = i.n(n)
      class a {
        constructor(e, t, i) {
          ;(this._ready = !1),
            (this._img = (function (e, t, i) {
              const r = new Image()
              return (r.width = t), (r.height = t), (r.onload = i), (r.src = e), r
            })(e, t, () => {
              ;(this._ready = !0), i()
            }))
        }
        ready() {
          return this._ready
        }
        image() {
          return this._img
        }
      }
      class o {
        constructor(e, t) {
          ;(this._icons = new Map()), (this._onAllIconsLoaded = new s.a()), (this._pendingLoading = e.length)
          const i = () => {
            0 == --this._pendingLoading && this._onAllIconsLoaded.fire()
          }
          e.forEach(e => {
            const r = this._icons.get(e.name) || new Map()
            r.set(e.theme, new a(e.imageData, t, i)), this._icons.set(e.name, r)
          })
        }
        getIcon(e, t) {
          return Object(r.ensureDefined)(Object(r.ensureDefined)(this._icons.get(e)).get(t))
        }
        onAllIconsReady() {
          return this._onAllIconsLoaded
        }
      }
    },
    KFbh: function (e, t, i) {
      'use strict'
      i.r(t)
      var r = i('aO4+'),
        n = i('HGP3'),
        s = i('zDbI'),
        a = i('jvrd'),
        o = i('GEp6'),
        l = i('f6yo'),
        h = i('Eyy1'),
        d = i('VaSN'),
        c = i('ikwP'),
        u = i('qgcf'),
        _ = i('VdBB'),
        p = i('XXdw'),
        f = i('qFKp'),
        g = i('c44N'),
        v = i('KDMZ'),
        w = i('f2d2')
      const x = [
          { name: 'twitter', theme: '', imageData: URL.createObjectURL(new Blob([w], { type: 'image/svg+xml' })) },
        ],
        m = new v.a(x, 24)
      var y = i('Zp/P')
      const b = new WeakMap()
      function R(e, t, i, r) {
        let n = b.get(e)
        return (
          (void 0 !== n && n.width === t) ||
            ((n = (function (e, t, i, r) {
              const n = Object(c.createDisconnectedCanvas)(document, new c.Size(t, t), 1),
                s = 0 === r ? Math.min(e.width, e.height) : Math.max(e.width, e.height),
                a = Math.round(e.width / 2 - s / 2),
                o = Math.round(e.height / 2 - s / 2),
                l = Object(c.getContext2D)(n)
              return (
                i && (l.beginPath(), l.arc(t / 2, t / 2, t / 2, 0, 2 * Math.PI, !0), l.closePath(), l.clip()),
                (l.imageSmoothingEnabled = !0),
                (l.imageSmoothingQuality = 'high'),
                l.drawImage(e, a, o, s, s, 0, 0, t, t),
                n
              )
            })(e, t, i, r)),
            b.set(e, n)),
          n
        )
      }
      function T(e) {
        return e.poleStartY
      }
      function S(e) {
        return e.inverseAnchorPosition
          ? e.anchorY
          : e.anchorY + (e.labelHeight + e.poleTailHeight + 2 * e.circleRadius) * e.direction
      }
      function P(e) {
        return e.inverseAnchorPosition
          ? e.anchorY + (2 * e.circleRadius + e.poleTailHeight) * e.direction
          : e.anchorY + e.labelHeight * e.direction
      }
      function L(e) {
        return e.inverseAnchorPosition ? P(e) - e.poleTailHeight * e.direction : P(e) + e.poleTailHeight * e.direction
      }
      const C = new (class {
        constructor() {
          this._cachedItems = []
        }
        getItem(e, t) {
          const i = this._cachedItems.find(i => i.sourceLabel === e && Object(g.areEqualPaneRenderParams)(t, i.params))
          if (void 0 !== i) return i.canvas
          const r = m.getIcon(e, '')
          if (!r.ready()) return null
          const n = document.createElement('canvas')
          ;(n.width = 24 * t.pixelRatio),
            (n.height = 24 * t.pixelRatio),
            (n.style.width = '24px'),
            (n.style.height = '24px')
          const s = Object(h.ensureNotNull)(n.getContext('2d'))
          return (
            s.setTransform(1, 0, 0, 1, 0, 0),
            f.isEdge || s.scale(t.pixelRatio, t.pixelRatio),
            s.drawImage(r.image(), 0, 0),
            this._cachedItems.push({ params: t, sourceLabel: e, canvas: n }),
            n
          )
        }
      })()
      function M(e, t, i, r, n, s) {
        const a = s.pixelRatio,
          o = Object(y.fillScaledRadius)(t.circleRadius, a),
          l = Math.round(t.x * a),
          h = t.inverseAnchorPosition
            ? Math.round(t.anchorY * a) + Math.round(t.circleRadius * a) * t.direction
            : Math.round(t.anchorY * a) +
              Math.round((t.labelHeight + t.poleTailHeight + t.circleRadius) * a) * t.direction,
          d = (Math.max(1, Math.floor(a)) % 2) / 2,
          c = l + d,
          u = h + d
        e.save()
        const _ = u + 0.05 * o,
          f = e.createRadialGradient(c, _, o / 2, c, _, 1.1 * o)
        if (
          (f.addColorStop(0, 'transparent'),
          f.addColorStop(0.1, r),
          f.addColorStop(1, 'transparent'),
          (e.fillStyle = f),
          e.beginPath(),
          e.arc(c, _, 1.1 * o, 0, 2 * Math.PI, !0),
          e.closePath(),
          e.fill(),
          e.restore(),
          e.beginPath(),
          e.arc(c, u, o, 0, 2 * Math.PI, !0),
          e.closePath(),
          e.fill(),
          null !== t.image)
        ) {
          const r = t.srcItem.type() === p.StoriesTimeLineItemType.Emoji,
            n = r ? 2 * Object(y.fillScaledRadius)(i, a) : 2 * o,
            s = R(t.image, n, !r, r ? 1 : 0)
          e.drawImage(s, c - n / 2, u - n / 2)
        }
        const g = Math.round(t.circleBorderWidth * a),
          v = Object(y.strokeScaledRadius)(t.circleRadius, a, g)
        if (
          ((e.lineWidth = g),
          e.beginPath(),
          e.arc(c, u, v, 0, 2 * Math.PI, !0),
          e.closePath(),
          e.stroke(),
          t.outsideBorderWidth)
        ) {
          e.save()
          const i = Math.round(t.outsideBorderWidth * a),
            r = v + g / 2 + i / 2
          ;(e.lineWidth = i),
            (e.strokeStyle = n),
            e.beginPath(),
            e.arc(c, u, r, 0, 2 * Math.PI, !0),
            e.closePath(),
            e.stroke(),
            e.restore()
        }
        const w = t.srcItem.sourceLabel()
        if (null !== w) {
          const i = C.getItem(w, s)
          if (null !== i) {
            const r = Math.round(c + t.circleRadius * a - i.width),
              n = Math.round(u - t.circleRadius * a)
            e.drawImage(i, r, n)
            const s = i.width / 2,
              o = r + s,
              l = n + s
            e.save(),
              (e.lineWidth = g),
              e.beginPath(),
              e.arc(o, l, s, 0, 2 * Math.PI, !0),
              e.closePath(),
              e.stroke(),
              e.restore()
          }
        }
      }
      class I {
        constructor(e, t, i, r) {
          ;(this._data = null),
            (this._labels = []),
            (this._cacheRects = {}),
            (this._items = []),
            (this._hitTestResult = e),
            (this._showTooltipHandler = t),
            (this._clearSelectedDataHandler = i),
            (this._phantomMode = Boolean(r))
        }
        setData(e) {
          this._data = e
        }
        clearItems() {
          ;(this._labels = []), (this._items = []), (this._cacheRects = {})
        }
        addItem(e) {
          const t = {
              circleBackgroundColor: e.circleBackgroundColor,
              circleBorderColor: e.circleBorderColor,
              circleBorderWidth: e.circleBorderWidth,
              outsideBorderWidth: e.outsideBorderWidth,
              image: e.image,
              itemIndex: e.itemIndex,
              labelIndex: e.labelIndex,
              x: e.x,
              anchorY: e.anchorY,
              poleTailHeight: e.poleTailHeight,
              poleStartY: e.poleStartY,
              circleRadius: e.circleRadius,
              srcItem: e.srcItem,
              direction: e.direction * (e.inverseAnchorPosition ? -1 : 1),
              labelHeight: 0,
              labelId: -1,
              inverseAnchorPosition: e.inverseAnchorPosition,
            },
            i = {
              offsetX: 0,
              offsetY: 0,
              points: [new r.Point(e.x, e.anchorY)],
              forceCalculateMaxLineWidth: !0,
              vertAlign: -1 === e.labelDirection ? 'bottom' : 'top',
              horzAlign: 'center',
              horzTextAlign: 'center',
              font: e.labelFont,
              fontSize: e.labelFontSize,
              bold: e.labelFontBold,
              italic: e.labelFontItalic,
              backgroundRoundRect: e.labelBorderRadius,
              padding: e.labelPadding,
              boxPaddingVert: e.labelBoxPaddingVert,
              boxPaddingHorz: e.labelBoxPaddingHorz,
              wordWrapWidth: e.labelWordWrapWidth,
              color: e.labelColor,
              borderColor: e.labelBorderColor,
              borderWidth: 1,
              backgroundColor: e.labelBackgroundColor,
              text: e.text,
            }
          if (e.inverseAnchorPosition) {
            const e = Object(h.ensureDefined)(i.points)
            ;(e[0] = new r.Point(e[0].x, P(t))), (t.labelId = this._labels.length)
          } else {
            const n = new u.TextRenderer(i)
            this._labels.push(n), (t.labelId = this._labels.length), (t.labelHeight = n.measure().height)
            const s =
              1 === e.direction
                ? Math.min(t.poleStartY - t.labelHeight, t.anchorY)
                : Math.max(t.poleStartY + t.labelHeight, t.anchorY)
            t.anchorY !== s && ((t.anchorY = s), (i.points = [new r.Point(e.x, s)]), n.setData(i))
          }
          const n = new u.TextRenderer(i)
          this._labels.push(n), this._items.push(t)
        }
        itemAnchorY(e) {
          return e >= this._items.length ? null : this._items[e].anchorY
        }
        hitTest(e, t) {
          if (null === this._data) return null
          for (let i = this._items.length - 1; i >= 0; --i) {
            const n = this._items[i],
              [s, a, o] = this._doesPointBelongToItem(n, e)
            if (s || a || o) {
              const e = { hideCrosshairLinesOnHover: !0, activeItem: s || a ? n.itemIndex : n.labelIndex }
              o ? (e.areaName = _.AreaName.Text) : a && (e.areaName = _.AreaName.Style)
              const i = this._showTooltipHandler
              if (void 0 !== i) {
                const s = { targetBox: this._itemRect(n, t.cssHeight), item: n.srcItem },
                  a = e => {
                    const [t, i] = this._doesPointBelongToItem(n, e)
                    return t || i
                  }
                ;(e.tapHandler = e => {
                  e.preventDefault(), i(s, new r.Point(e.clientX - e.localX, e.clientY - e.localY), a)
                }),
                  (e.clickHandler = e => {
                    i(s, new r.Point(e.clientX - e.localX, e.clientY - e.localY), a)
                  })
                const o = this._clearSelectedDataHandler
                void 0 !== o &&
                  ((e.doubleClickHandler = e => o()),
                  (e.pressedMouseMoveHandler = e => o()),
                  (e.executeDefaultAction = { pressedMouseMoveHandler: !0, touchMoveHandler: !0 }))
              }
              return new _.HitTestResult(this._hitTestResult, e)
            }
          }
          return null
        }
        draw(e, t) {
          if (null === this._data) return
          e.save(), this._phantomMode && (e.globalAlpha = 0.5)
          const { poleColor: i, emojiRadius: r } = this._data,
            n = t.pixelRatio,
            s = Math.max(1, Math.floor(n)),
            a = s % 2 ? 0.5 : 0
          e.beginPath(), (e.strokeStyle = i), (e.lineWidth = s)
          for (const t of this._items) {
            const i = Math.round(t.x * n) + a
            e.moveTo(i, Math.round(T(t) * n)),
              e.lineTo(i, Math.round(S(t) * n)),
              0 !== t.poleTailHeight && (e.moveTo(i, Math.round(P(t) * n)), e.lineTo(i, Math.round(L(t) * n)))
          }
          e.stroke()
          for (const i of this._items)
            (e.strokeStyle = i.circleBorderColor),
              (e.fillStyle = i.circleBackgroundColor),
              i.circleRadius > 0 && M(e, i, r, this._data.shadowColor, this._data.outsideBorderColor, t),
              this._labels[i.labelId].draw(e, t)
          e.restore()
        }
        _itemRect(e, t) {
          if (!this._cacheRects[e.labelId]) {
            const i = this._labels[e.labelId].rect(),
              r = e.circleRadius > 0 ? e.circleRadius + e.circleBorderWidth : 0,
              n = i.y < e.poleStartY
            this._cacheRects[e.labelId] = {
              top: Math.max(n ? i.y : e.poleStartY, 0),
              bottom: Math.min(n ? e.poleStartY : i.y + i.height, t),
              left: Math.min(e.x - r, i.x),
              right: Math.max(e.x + r, i.x + i.width),
            }
          }
          return this._cacheRects[e.labelId]
        }
        _doesPointBelongToItem(e, t) {
          const i = Object(d.lastEventIsTouch)() ? 20 : 3,
            n = e.x,
            s = Object(o.distanceToSegment)(new r.Point(n, T(e)), new r.Point(n, S(e)), t).distance < i,
            a =
              !s &&
              e.circleRadius > 0 &&
              Object(l.pointInCircle)(
                t,
                new r.Point(
                  n,
                  (function (e) {
                    return e.inverseAnchorPosition
                      ? e.anchorY + e.circleRadius * e.direction
                      : e.anchorY + (e.labelHeight + e.poleTailHeight + e.circleRadius) * e.direction
                  })(e),
                ),
                e.circleRadius + i,
              )
          return [s, a, !s && !a && null !== this._labels[e.labelId].hitTest(t)]
        }
      }
      const O = {
          circleBackgroundColor: n.colorsPalette['color-cold-gray-800'],
          circleBorderColor: n.colorsPalette['color-cold-gray-900'],
          labelBackgroundColor: n.colorsPalette['color-cold-gray-900'],
          labelBorderColor: n.colorsPalette['color-cold-gray-800'],
          labelTextColor: n.colorsPalette['color-cold-gray-200'],
          poleColor: n.colorsPalette['color-cold-gray-500'],
          shadowColor: 'rgba(0,0,0,0.4)',
          selectionColor: n.colorsPalette['color-tv-blue-500'],
          labelHoveredColor: n.colorsPalette['color-cold-gray-800'],
          labelSelectedColor: n.colorsPalette['color-tv-blue-a900'],
        },
        N = {
          circleBackgroundColor: n.colorsPalette['color-cold-gray-100'],
          circleBorderColor: n.colorsPalette['color-white'],
          labelBackgroundColor: n.colorsPalette['color-white'],
          labelBorderColor: n.colorsPalette['color-cold-gray-150'],
          labelTextColor: n.colorsPalette['color-cold-gray-900'],
          poleColor: n.colorsPalette['color-cold-gray-500'],
          shadowColor: 'rgba(107,121,136,0.4)',
          selectionColor: n.colorsPalette['color-tv-blue-500'],
          labelHoveredColor: n.colorsPalette['color-cold-gray-100'],
          labelSelectedColor: n.colorsPalette['color-tv-blue-50'],
        }
      class D {
        constructor(e, t, i, r, n) {
          ;(this._renderer = null),
            (this._invalidated = !0),
            (this._model = e),
            (this._timeLine = t),
            (this._timeLineItemsRenderer = new I(
              i,
              null == r ? void 0 : r.tooltipHandler,
              null == r ? void 0 : r.clearSelectedDataHandler,
              n,
            ))
        }
        update() {
          this._invalidated = !0
        }
        renderer(e, t) {
          return this._invalidated && (this._updateImpl(e), (this._invalidated = !1)), this._renderer
        }
        itemAnchorY(e) {
          return this._timeLineItemsRenderer.itemAnchorY(e)
        }
        _updateImpl(e) {
          ;(this._renderer = null), this._timeLineItemsRenderer.clearItems()
          const t = this._timeLine.priceSource()
          if (null === t) return
          const i = this._model.timeScale(),
            r = t.priceScale(),
            n = t.firstValue()
          if (i.isEmpty() || null === r || r.isEmpty() || null === n) return
          const o = this._model.isDark(),
            l = o ? O : N
          let h
          const d = this._model.mainSeries()
          for (const c of this._timeLine.items()) {
            if (this._timeLine.isHidden(c)) continue
            const u = c.position(),
              _ = t === d ? Object(a.b)(d, c) : Object(a.a)(c, r, n)
            if (null === _) continue
            const p = i.indexToCoordinate(_.index),
              f = r.priceToCoordinate(_.price, n),
              g = c.showPlate()
            let v = Object(a.d)(u, e, f, _.positionPointDirection)
            v >= -1e-10 && v <= e + 1e-10 && (v = Math.min(e - 2, Math.max(2, v)))
            const w = _.visualDirection !== _.positionPointDirection,
              x = _.visualDirection,
              m = this._timeLine.isItemSelected(c),
              y = this._timeLine.isItemHovered(c),
              b = {
                circleBackgroundColor: c.backgroundPlateColor(o) || l.circleBackgroundColor,
                outsideBorderWidth: m ? 2 : y ? 1 : 0,
                circleBorderColor: l.circleBorderColor,
                circleBorderWidth: 1,
                image: c.image(),
                itemIndex: c.itemIndex(),
                labelIndex: c.labelIndex(),
                x: p,
                anchorY: v,
                poleTailHeight: c.headline() && g ? 10 : 0,
                poleStartY: _.poleStartY,
                circleRadius: g ? 35 : 0,
                direction: x,
                inverseAnchorPosition: w,
                srcItem: c,
                text: c.headline(),
                labelDirection: _.positionPointDirection,
                labelFont: s.CHART_FONT_FAMILY,
                labelFontSize: (c.fontSize && c.fontSize()) || 12,
                labelFontBold: (c.fontBold && c.fontBold()) || !1,
                labelFontItalic: (c.fontItalic && c.fontItalic()) || !1,
                labelBorderRadius: 4,
                labelPadding: 3,
                labelBoxPaddingVert: 6,
                labelBoxPaddingHorz: 8,
                labelWordWrapWidth: 134,
                labelColor: l.labelTextColor,
                labelBorderColor: l.labelBorderColor,
                labelBackgroundColor: m ? l.labelSelectedColor : y ? l.labelHoveredColor : l.labelBackgroundColor,
              }
            this._timeLine.isItemHovered(c) ? (h = b) : this._timeLineItemsRenderer.addItem(b)
          }
          void 0 !== h && this._timeLineItemsRenderer.addItem(h),
            this._timeLineItemsRenderer.setData({
              emojiRadius: 16,
              poleColor: l.poleColor,
              shadowColor: l.shadowColor,
              outsideBorderColor: l.selectionColor,
            }),
            (this._renderer = this._timeLineItemsRenderer)
        }
      }
      var B = i('Zy3/'),
        k = i('//lt'),
        A = i('aB9a')
      i.d(t, 'SignpostPaneView', function () {
        return E
      })
      class E extends A.LineSourcePaneView {
        constructor(e, t) {
          super(e, t),
            (this._renderer = new B.CompositeRenderer()),
            (this._storiesEventsPaneView = new D(t, e, _.HitTestResult.MOVEPOINT, void 0, e.isPhantom()))
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(e, t), this._renderer
        }
        _updateImpl(e, t) {
          super._updateImpl(), this._renderer.clear(), this._storiesEventsPaneView.update()
          const i = this._storiesEventsPaneView.renderer(e, t)
          if ((null !== i && this._renderer.append(i), this._source.isPhantom())) return
          const n = this._storiesEventsPaneView.itemAnchorY(0)
          if (null === n) return
          const s = this._points[0],
            a = new r.Point(s.x, n)
          ;(a.data = s.data),
            (a.square = !0),
            this._renderer.append(
              this.createLineAnchor({ points: [a], pointsCursorType: [k.PaneCursorType.VerticalResize] }, 0),
            )
        }
      }
    },
    LMGK: function (e, t, i) {
      'use strict'
      i.r(t)
      var r = i('aO4+'),
        n = i('aB9a'),
        s = i('Zy3/'),
        a = i('YFKU'),
        o = i('EBrf'),
        l = i('jFln'),
        h = i('cPgM'),
        d = i('VdBB'),
        c = i('2uTr'),
        u = i('jkoZ')
      const _ = Object(a.t)('Modify Order'),
        p = Object(a.t)('Cancel Order')
      class f extends h.ScaledPaneRenderer {
        constructor(e) {
          super(), (this._data = null), (this._cache = {}), (this._data = null), (this._adapter = e)
        }
        setData(e) {
          this._data = e
        }
        hitTest(e, t) {
          if (null === this._data || 0 === this._data.points.length) return null
          const i = this._cache
          if (e.y < i.top || e.y > i.bottom) return null
          if (this._adapter.getBlocked() && e.x >= i.left && e.x < i.right)
            return new d.HitTestResult(d.HitTestResult.CUSTOM, {})
          if (this._adapter.getEditable() && e.x >= i.left && e.x < i.bodyRight) {
            const e = this._adapter.hasMoveCallback() ? d.HitTestResult.MOVEPOINT : d.HitTestResult.REGULAR
            return 0 === this._adapter.getTooltip().length
              ? new d.HitTestResult(e)
              : new d.HitTestResult(e, {
                  tooltip: {
                    text: this._adapter.getTooltip(),
                    rect: { x: i.left, y: i.top, w: i.bodyRight - i.left, h: i.bottom - i.top },
                  },
                })
          }
          return this._adapter.getEditable() && e.x >= i.bodyRight && e.x < i.quantityRight
            ? this._adapter.hasModifyCallback()
              ? new d.HitTestResult(d.HitTestResult.CUSTOM, {
                  clickHandler: this._adapter.callOnModify.bind(this._adapter),
                  tapHandler: this._adapter.callOnModify.bind(this._adapter),
                  tooltip: {
                    text: this._adapter.getModifyTooltip() || Object(c.appendEllipsis)(_),
                    rect: { x: i.bodyRight, y: i.top, w: i.quantityRight - i.bodyRight, h: i.bottom - i.top },
                  },
                })
              : new d.HitTestResult(d.HitTestResult.REGULAR)
            : this._adapter.getCancellable() && e.x >= i.quantityRight && e.x < i.right
            ? new d.HitTestResult(d.HitTestResult.CUSTOM, {
                clickHandler: this._adapter.callOnCancel.bind(this._adapter),
                tapHandler: this._adapter.callOnCancel.bind(this._adapter),
                tooltip: {
                  text: this._adapter.getCancelTooltip() || p,
                  rect: { x: i.quantityRight, y: i.top, w: i.right - i.quantityRight, h: i.bottom - i.top },
                },
              })
            : null
        }
        _drawImpl(e, t) {
          if (null === this._data || !this._data.points || this._data.points.length < 1) return
          const i = t.cssWidth,
            r = this._bodyWidth(e),
            n = this._quantityWidth(e),
            s = r + n + this._cancelButtonWidth(),
            a = i - s,
            o = Math.max((this._adapter.getLineLength() / 100) * i, 1),
            l = Math.round(i - Math.min(a, o)),
            h = l - s,
            d = Math.round(this._data.points[0].y),
            c = Math.round(d - (this._height() + 1) / 2)
          ;(this._cache.bodyRight = h + r),
            (this._cache.quantityRight = h + r + n),
            (this._cache.top = c),
            (this._cache.bottom = c + this._height()),
            (this._cache.left = h),
            (this._cache.right = l),
            this._drawLines(e, h, l, d, i)
          let u = !1
          0 !== r &&
            (this._drawBody(e, h, c),
            this._adapter.hasMoveCallback() && this._drawMovePoints(e, h, c),
            this._drawBodyText(e, h, c),
            (u = !0)),
            0 !== n && (this._drawQuantity(e, h + r, c, u), this._drawQuantityText(e, h + r, c), (u = !0)),
            0 !== this._cancelButtonWidth() && this._drawCancelButton(e, h + r + n, c, u)
        }
        _height() {
          return Math.max(
            20,
            1 + Math.max(u.fontHeight(this._adapter.getBodyFont()), u.fontHeight(this._adapter.getQuantityFont())),
          )
        }
        _bodyWidth(e) {
          if (0 === this._adapter.getText().length) return 0
          e.save(), (e.font = this._adapter.getBodyFont())
          const t = e.measureText(this._adapter.getText()).width
          return e.restore(), Math.round(20 + t)
        }
        _getQuantity() {
          return Object(o.splitThousands)(this._adapter.getQuantity(), ' ')
        }
        _quantityWidth(e) {
          if (0 === this._getQuantity().length) return 0
          e.save(), (e.font = this._adapter.getQuantityFont())
          const t = e.measureText(this._getQuantity()).width
          return e.restore(), Math.round(Math.max(this._height(), 10 + t))
        }
        _cancelButtonWidth() {
          return this._adapter.isOnCancelCallbackPresent() ? this._height() : 0
        }
        _drawLines(e, t, i, r, n) {
          e.save(),
            (e.strokeStyle = this._adapter.getLineColor()),
            Object(l.setLineStyle)(e, this._adapter.getLineStyle()),
            (e.lineWidth = this._adapter.getLineWidth()),
            Object(l.drawLine)(e, i, r, n, r),
            this._adapter.getExtendLeft() && Object(l.drawLine)(e, 0, r, t, r),
            e.restore()
        }
        _drawMovePoints(e, t, i) {
          e.save(),
            (e.strokeStyle = this._adapter.getBodyBorderColor()),
            (e.fillStyle = this._adapter.getBodyBorderColor())
          const r = t + 4,
            n = r + 2,
            s = Math.floor((this._height() - 10) / 2) + 1
          for (let t = 0; t < s; ++t) {
            const s = i + 5 + 2 * t
            Object(l.drawLine)(e, r, s, n, s)
          }
          e.restore()
        }
        _drawBody(e, t, i) {
          ;(e.strokeStyle = this._adapter.getBodyBorderColor()), (e.fillStyle = this._adapter.getBodyBackgroundColor())
          const r = this._bodyWidth(e),
            n = this._height()
          e.fillRect(t + 0.5, i + 0.5, r - 1, n - 1), e.strokeRect(t, i, r, n)
        }
        _drawBodyText(e, t, i) {
          ;(e.textAlign = 'center'),
            (e.textBaseline = 'middle'),
            (e.font = this._adapter.getBodyFont()),
            (e.fillStyle = this._adapter.getBodyTextColor())
          const r = t + this._bodyWidth(e) / 2,
            n = i + this._height() / 2
          e.fillText(this._adapter.getText(), 5 + r - 2, n)
        }
        _drawQuantity(e, t, i, r) {
          e.save(),
            (e.strokeStyle = this._adapter.getQuantityBorderColor()),
            (e.fillStyle = this._adapter.getQuantityBackgroundColor())
          const n = this._quantityWidth(e),
            s = this._height()
          e.fillRect(t + 0.5, i + 0.5, n - 1, s - 1),
            r && e.clip && (e.beginPath(), e.rect(t + 0.5, i - 0.5, n + 1, s + 1), e.clip()),
            e.strokeRect(t, i, n, s),
            e.restore()
        }
        _drawQuantityText(e, t, i) {
          e.save(),
            (e.textAlign = 'center'),
            (e.textBaseline = 'middle'),
            (e.font = this._adapter.getQuantityFont()),
            (e.fillStyle = this._adapter.getQuantityTextColor())
          const r = t + this._quantityWidth(e) / 2,
            n = i + this._height() / 2
          e.fillText(this._getQuantity(), r, n), e.restore()
        }
        _drawCancelButton(e, t, i, n) {
          ;(e.strokeStyle = this._adapter.getCancelButtonBorderColor()),
            (e.fillStyle = this._adapter.getCancelButtonBackgroundColor())
          const s = this._cancelButtonWidth(),
            a = this._height()
          e.fillRect(t + 0.5, i + 0.5, s - 1, a - 1),
            this._adapter.getBlocked() &&
              ((e.fillStyle = 'rgba(140, 140, 140, 0.75)'), e.fillRect(t + 0.5, i + 0.5, s - 1, a - 1)),
            e.save(),
            n && e.clip && (e.beginPath(), e.rect(t + 0.5, i - 0.5, s + 1, a + 1), e.clip()),
            e.strokeRect(t, i, s, a),
            e.restore()
          const o = t + s,
            h = i + a
          e.strokeStyle = this._adapter.getCancelButtonIconColor()
          const d = (this._cancelButtonWidth() - 8) / 2,
            c = (this._height() - 8) / 2
          Object(l.drawPoly)(e, [new r.Point(t + d, i + c), new r.Point(o - d, h - c)], !0),
            Object(l.drawPoly)(e, [new r.Point(o - d, i + c), new r.Point(t + d, h - c)], !0)
        }
      }
      var g = i('vq8G')
      i.d(t, 'OrderPaneView', function () {
        return v
      })
      class v extends n.LineSourcePaneView {
        constructor(e, t) {
          super(e, t),
            (this._renderer = new s.CompositeRenderer()),
            (this._selectionRenderer = new g.SelectionRenderer()),
            (this._selectionData = null),
            (this._adapter = e.adapter()),
            (this._orderRenderer = new f(e.adapter())),
            this._renderer.append(this._orderRenderer),
            this._renderer.append(this._selectionRenderer)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(t), this._renderer
        }
        _updateImpl(e) {
          if ((super._updateImpl(), (this._selectionData = null), this.isSelectedSource() && this._points.length > 0)) {
            const t = this._points[0].y,
              i = e - 3.5 - 1,
              n = this._adapter.hasMoveCallback() ? d.HitTestResult.MOVEPOINT : d.HitTestResult.REGULAR,
              s = [new r.Point(i, t)]
            this._selectionData = {
              barSpacing: this._model.timeScale().barSpacing(),
              points: s,
              bgColors: this._lineAnchorColors(s),
              hittestResult: n,
              visible: !0,
            }
          }
          this._orderRenderer.setData({ points: this._points }), this._selectionRenderer.setData(this._selectionData)
        }
      }
    },
    NCfL: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'LineToolPaneViewWithLevelledTextCache', function () {
          return l
        })
      var r = i('Eyy1'),
        n = i('aB9a'),
        s = i('xUGI'),
        a = i.n(s),
        o = i('c44N')
      class l extends n.LineSourcePaneView {
        constructor(e, t) {
          super(e, t), (this._cache = null), (this._cacheDrawParams = null), (this._cacheInvalidated = !0)
        }
        getCacheCanvas(e) {
          return this._createCacheIfRequired(e), Object(r.ensureNotNull)(this._cache).canvas()
        }
        getCacheRects(e, t) {
          return this._createCacheIfRequired(e), null
        }
        destroy() {
          var e
          null === (e = this._cache) || void 0 === e || e.destroy()
        }
        _updateImpl() {
          super._updateImpl(), (this._cacheInvalidated = !0)
        }
        _createCache(e) {
          return new a.a(this._source.properties().fibLevelsBasedOnLogScale, this._source.levelsCount(), e)
        }
        _createCacheIfRequired(e) {
          var t
          ;(null !== this._cache &&
            null !== this._cacheDrawParams &&
            Object(o.areEqualPaneRenderParams)(e, this._cacheDrawParams)) ||
            (null === (t = this._cache) || void 0 === t || t.destroy(),
            (this._cache = this._createCache(e)),
            (this._cacheState = this._cache.updateSource(this._source)),
            (this._cacheDrawParams = e),
            (this._cacheInvalidated = !1)),
            this._cacheInvalidated &&
              ((this._cacheState = this._cache.updateSource(this._source)), (this._cacheInvalidated = !1))
        }
      }
    },
    NN6M: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'ParallelChannelRenderer', function () {
          return u
        })
      var r = i('Eyy1'),
        n = i('aO4+'),
        s = i('GEp6'),
        a = i('hBTJ'),
        o = i('jFln'),
        l = i('VdBB'),
        h = i('Zp/P'),
        d = i('Tmoa'),
        c = i('cPgM')
      class u extends c.ScaledPaneRenderer {
        constructor(e, t) {
          super(),
            (this._data = null),
            (this._hittestResult = e || new l.HitTestResult(l.HitTestResult.MOVEPOINT)),
            (this._backHittestResult = t || new l.HitTestResult(l.HitTestResult.MOVEPOINT_BACKGROUND))
        }
        setData(e) {
          this._data = e
        }
        hitTest(e, t) {
          if (null === this._data || this._data.points.length < 2) return null
          const [i, r] = this._data.points,
            n = this._extendAndHitTestLineSegment(e, i, r, t)
          if (null !== n) return n
          if (4 === this._data.points.length && !this._data.skipTopLine) {
            const [, , n, s] = this._data.points,
              a = this._extendAndHitTestLineSegment(e, n, s, t)
            if (null !== a) return a
            if (this._data.showMidline && !this._data.skipLines) {
              const a = i.add(n).scaled(0.5),
                o = r.add(s).scaled(0.5),
                l = this._extendAndHitTestLineSegment(e, a, o, t)
              if (null !== l) return l
            }
          }
          return this._data.hittestOnBackground && this._data.fillBackground ? this._hitTestBackground(e) : null
        }
        _drawImpl(e, t) {
          if (null === this._data || this._data.points.length < 2) return
          ;(e.lineCap = 'butt'),
            (e.strokeStyle = this._data.color),
            (e.lineWidth = this._data.linewidth),
            Object(o.setLineStyle)(e, this._data.linestyle)
          const [i, r] = this._data.points
          if (!isFinite(i.y) || !isFinite(r.y)) this._extendAndDrawLineSegment(e, i, r, t)
          else if (
            (this._data.skipLines || this._extendAndDrawLineSegment(e, i, r, t), 4 === this._data.points.length)
          ) {
            const [, , n, s] = this._data.points
            if (
              (this._data.skipLines || this._data.skipTopLine || this._extendAndDrawLineSegment(e, n, s, t),
              this._data.fillBackground && this._drawBackground(e, this._data.points, t),
              this._data.showMidline && !this._data.skipLines)
            ) {
              ;(e.strokeStyle = this._data.midcolor),
                (e.lineWidth = this._data.midlinewidth),
                Object(o.setLineStyle)(e, this._data.midlinestyle)
              const a = i.add(n).scaled(0.5),
                l = r.add(s).scaled(0.5)
              this._extendAndDrawLineSegment(e, a, l, t)
            }
          }
        }
        _getColor() {
          const e = Object(r.ensureNotNull)(this._data)
          return Object(d.generateColor)(e.backcolor, e.transparency)
        }
        _extendAndDrawLineSegment(e, t, i, r) {
          const n = this._extendAndClipLineSegment(t, i, r)
          null !== n && Object(o.drawLine)(e, n[0].x, n[0].y, n[1].x, n[1].y)
        }
        _extendAndHitTestLineSegment(e, t, i, r) {
          const n = this._extendAndClipLineSegment(t, i, r)
          if (null !== n) {
            if (Object(s.distanceToSegment)(n[0], n[1], e).distance <= 3) return this._hittestResult
          }
          return null
        }
        _extendAndClipLineSegment(e, t, i) {
          const n = Object(r.ensureNotNull)(this._data)
          return Object(h.extendAndClipLineSegment)(e, t, i.cssWidth, i.cssHeight, n.extendleft, n.extendright)
        }
        _drawBackground(e, t, i) {
          const a = Object(r.ensureNotNull)(this._data),
            [o, l, h, d] = t
          if (
            Object(n.equalPoints)(o, l) ||
            Object(n.equalPoints)(h, d) ||
            Object(s.distanceToLine)(o, l, h).distance < 1e-6 ||
            Object(s.distanceToLine)(o, l, d).distance < 1e-6
          )
            return
          if (i.cssWidth <= 0 || i.cssHeight <= 0) return
          let c = [
            new n.Point(0, 0),
            new n.Point(i.cssWidth, 0),
            new n.Point(i.cssWidth, i.cssHeight),
            new n.Point(0, i.cssHeight),
          ]
          if (
            ((c = _(c, o, l, d)),
            a.extendright || (c = _(c, l, d, h)),
            (c = _(c, d, h, o)),
            a.extendleft || (c = _(c, h, o, l)),
            null !== c)
          ) {
            e.beginPath(), e.moveTo(c[0].x, c[0].y)
            for (let t = 1; t < c.length; t++) e.lineTo(c[t].x, c[t].y)
            ;(e.fillStyle = this._getColor()), e.fill()
          }
        }
        _hitTestBackground(e) {
          const t = Object(r.ensureNotNull)(this._data)
          if (4 !== t.points.length) return null
          const [i, n, s] = t.points,
            a = (n.y - i.y) / (n.x - i.x),
            o = i.y + a * (e.x - i.x),
            l = s.y + a * (e.x - s.x),
            h = Math.max(o, l),
            d = Math.min(o, l),
            c = Math.min(i.x, n.x),
            u = Math.max(i.x, n.x)
          return (!t.extendleft && e.x < c) || (!t.extendright && e.x > u)
            ? null
            : e.y >= d && e.y <= h
            ? this._backHittestResult
            : null
        }
      }
      function _(e, t, i, r) {
        return null !== e
          ? Object(a.intersectPolygonAndHalfplane)(
              e,
              Object(n.halfplaneThroughPoint)(Object(n.lineThroughPoints)(t, i), r),
            )
          : null
      }
    },
    Ni7V: function (e, t, i) {
      'use strict'
      var r = i('aO4+'),
        n = r.Point,
        s = r.box,
        a = i('f6yo').pointInBox,
        o = i('aB9a').LineSourcePaneView,
        l = i('vq8G').SelectionRenderer,
        h = i('VdBB').HitTestResult,
        d = i('Zy3/').CompositeRenderer,
        c = i('Tmoa'),
        u = i('ikwP').calcTextHorizontalShift,
        _ = i('Ialn').isRtl,
        p = i('cPgM').ScaledPaneRenderer
      class f extends p {
        constructor(e, t) {
          super(), (this._data = null), (this._measureCache = e), (this._chartModel = t), (this._points = null)
        }
        setData(e) {
          ;(this._data = e), (this._points = e.points)
        }
        _drawImpl(e) {
          if (null !== this._data && null !== this._points && 0 !== this._points.length) {
            e.font = [this._data.fontWeight, this._data.fontSize + 'px', this._data.fontFamily].join(' ')
            var t = e.measureText(this._data.label)
            t.height = this._data.fontSize
            var i = 10,
              r = 5,
              n = t.width + 2 * i,
              s = t.height + 2 * r,
              a = this._points[0].x - -9,
              o = this._points[0].y - (s + 15)
            e.textAlign = _() ? 'right' : 'left'
            var l = u(e, t.width)
            this._measureCache &&
              Object.assign(this._measureCache, { innerWidth: n, innerHeight: s, tailLeft: -9, tailHeight: 15 }),
              e.translate(0.5 + a, 0.5 + o),
              e.beginPath(),
              e.moveTo(12, s),
              e.lineTo(-9, s + 15),
              e.lineTo(-10, s + 15 - 1),
              e.lineTo(5, s),
              e.lineTo(3, s),
              e.arcTo(0, s, 0, 0, 3),
              e.lineTo(0, 3),
              e.arcTo(0, 0, n, 0, 3),
              e.lineTo(n - 3, 0),
              e.arcTo(n, 0, n, s, 3),
              e.lineTo(n, s - 3),
              e.arcTo(n, s, 0, s, 3),
              e.lineTo(12, s),
              (e.fillStyle = c.generateColor(this._data.backgroundColor, this._data.transparency)),
              e.fill(),
              (e.strokeStyle = this._data.borderColor),
              (e.lineWidth = 2),
              e.stroke(),
              e.closePath(),
              (e.textBaseline = 'alphabetic'),
              (e.fillStyle = this._data.color),
              e.fillText(this._data.label, i + l, s / 2 + Math.floor(0.35 * this._data.fontSize)),
              e.translate(-0.5, -0.5),
              e.beginPath(),
              e.arc(-9, s + 15, 2.5, 0, 2 * Math.PI, !1),
              (e.fillStyle = c.generateColor(this._data.borderColor, this._data.transparency)),
              e.fill(),
              (e.strokeStyle = this._chartModel.backgroundColor().value()),
              (e.lineWidth = 1),
              e.stroke(),
              e.closePath()
          }
        }
        hitTest(e) {
          if (null === this._data || null === this._points || 0 === this._points.length) return null
          var t = this._points[0].x - this._measureCache.tailLeft,
            i = this._points[0].y - (this._measureCache.innerHeight + this._measureCache.tailHeight),
            r = s(new n(t, i), new n(t + this._measureCache.innerWidth, i + this._measureCache.innerHeight))
          return a(e, r) ? new h(h.MOVEPOINT) : null
        }
      }
      t.PriceLabelPaneView = class extends o {
        constructor(e, t, i) {
          super(e, t),
            (this._rendererCache = {}),
            (this._priceLabelRenderer = new f(this._rendererCache, t)),
            (this._renderer = null)
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), this._source.points().length > 0)) {
            var e = this._source.points()[0].price,
              t = this._source.priceScale()
            if (!t || t.isEmpty()) return
            var i = this._source.ownerSource().firstValue()
            this._priceLabel = t.formatPrice(e, i)
          }
          var r = {}
          if (
            ((r.points = this._points),
            (r.borderColor = this._source.properties().borderColor.value()),
            (r.backgroundColor = this._source.properties().backgroundColor.value()),
            (r.color = this._source.properties().color.value()),
            (r.fontWeight = this._source.properties().fontWeight.value()),
            (r.fontSize = this._source.properties().fontsize.value()),
            (r.fontFamily = this._source.properties().font.value()),
            (r.transparency = this._source.properties().transparency.value()),
            (r.label = this._priceLabel),
            this._priceLabelRenderer.setData(r),
            1 === r.points.length)
          ) {
            var n = new d()
            return (
              n.append(this._priceLabelRenderer),
              n.append(
                new l({
                  points: r.points,
                  bgColors: this._lineAnchorColors(r.points),
                  visible: this.areAnchorsVisible(),
                }),
              ),
              void (this._renderer = n)
            )
          }
          this._renderer = this._priceLabelRenderer
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    PuIH: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'getImage', function () {
          return n
        })
      const r = new Map()
      function n(e, t) {
        let i = r.get(e)
        return (
          void 0 === i &&
            ((i = new Promise((e, i) => {
              const r = new Image()
              ;(r.onload = () => {
                e(r), (r.onload = null), (r.onerror = null)
              }),
                (r.onerror = () => {
                  i(), (r.onload = null), (r.onerror = null)
                }),
                (r.crossOrigin = 'anonymous'),
                (r.src = t)
            })),
            r.set(e, i)),
          i
        )
      }
    },
    QA6D: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'EllipseRendererSimple', function () {
          return h
        })
      var r = i('VdBB'),
        n = i('Hr11'),
        s = i('aO4+'),
        a = i('Tmoa'),
        o = i('jFln'),
        l = i('cPgM')
      class h extends l.ScaledPaneRenderer {
        constructor(e, t, i) {
          super(),
            (this._data = e),
            (this._hitTest = t || new r.HitTestResult(r.HitTestResult.MOVEPOINT)),
            (this._backgroundHitTest = i || new r.HitTestResult(r.HitTestResult.MOVEPOINT_BACKGROUND))
        }
        hitTest(e) {
          if (this._data.points.length < 2) return null
          const t = this._data.points[0],
            i = this._data.points[1],
            r = 0.5 * Math.abs(t.x - i.x),
            a = Math.abs(t.x - i.x),
            o = Math.abs(t.y - i.y),
            l = t.add(i).scaled(0.5)
          let h = e.subtract(l)
          if (a < 1 || o < 1) return null
          const d = (i.y - t.y) / (i.x - t.x)
          h = new s.Point(h.x, h.y / d)
          let c = h.x * h.x + h.y * h.y - r * r
          return (
            (c = Object(n.sign)(c) * Math.sqrt(Math.abs(c / r))),
            Math.abs(c) < 3
              ? this._hitTest
              : this._data.fillBackground && !this._data.noHitTestOnBackground && c < 3
              ? this._backgroundHitTest
              : null
          )
        }
        _drawImpl(e) {
          ;(e.lineCap = 'butt'),
            (e.strokeStyle = this._data.color),
            (e.lineWidth = this._data.linewidth),
            void 0 !== this._data.linestyle && Object(o.setLineStyle)(e, this._data.linestyle)
          const t = this._data.points[0],
            i = this._data.points[1],
            r = Math.abs(t.x - i.x),
            n = Math.abs(t.y - i.y),
            s = t.add(i).scaled(0.5)
          if (r < 1 || n < 1) return
          let l = 0
          if (this._data.wholePoints) {
            const e = this._data.wholePoints[0],
              t = this._data.wholePoints[1]
            l = Math.abs(e.x - t.x)
          }
          e.save(),
            e.translate(s.x, s.y),
            e.scale(1, n / r),
            e.beginPath(),
            e.arc(0, 0, r / 2, 0, 2 * Math.PI, !1),
            e.restore(),
            e.stroke(),
            this._data.fillBackground &&
              (this._data.wholePoints &&
                (e.translate(s.x, s.y), e.scale(1, n / r), e.arc(0, 0, l / 2, 0, 2 * Math.PI, !0)),
              (e.fillStyle = Object(a.generateColor)(this._data.backcolor, this._data.transparency, !0)),
              e.fill())
        }
      }
    },
    QPcX: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'LetterInCircleRenderer', function () {
          return o
        })
      var r = i('aO4+'),
        n = i('f6yo'),
        s = i('ikwP'),
        a = i('XlJ7')
      class o {
        constructor(e, t) {
          ;(this._data = e), (this._hitTestResult = t)
        }
        hitTest(e) {
          const t = this._center(),
            i = this._data.circleRadius,
            s = { min: new r.Point(t.x - i, t.y - i), max: new r.Point(t.x + i, t.y + i) }
          return Object(n.pointInBox)(e, s) ? this._hitTestResult : null
        }
        draw(e, t) {
          e.save()
          const i = t.pixelRatio,
            r = (Math.max(1, Math.floor(i)) % 2) / 2,
            n = this._center(),
            o = Math.round(n.x * i) + r,
            l = Math.round(n.y * i) + r
          if (this._data.showCircle) {
            const t = Math.round(o + this._data.circleRadius * i) - o - (this._data.circleBorderWidth * i) / 2
            ;(e.strokeStyle = this._data.color),
              (e.lineWidth = this._data.circleBorderWidth * i),
              e.beginPath(),
              e.moveTo(o + t, l),
              e.arc(o, l, t, 0, 2 * Math.PI, !1),
              e.stroke()
          }
          ;(e.font = Object(a.makeFont)(this._data.fontSize, this._data.font, this._data.bold ? 'bold' : void 0)),
            (e.textBaseline = 'middle'),
            (e.textAlign = 'center'),
            (e.fillStyle = this._data.color),
            Object(s.drawScaled)(e, i, () => {
              e.fillText(this._data.letter, o / i, l / i + 0.05 * this._data.fontSize)
            }),
            e.restore()
        }
        _center() {
          const e = 'bottom' === this._data.vertAlign ? -1 : 1,
            t = this._data.point.y + e * this._data.yOffset + e * this._data.circleRadius,
            i = this._data.point.x
          return new r.Point(i, t)
        }
      }
    },
    Qa6j: function (e, t, i) {
      'use strict'
      i.r(t)
      var r = i('aB9a'),
        n = i('Zy3/'),
        s = i('qgcf'),
        a = i('aO4+'),
        o = i('cPgM'),
        l = i('VdBB'),
        h = i('Zp/P')
      function d(e) {
        if (e < 92) return 18
        let t = 0.25 * e
        return (t = Math.min(t, 106)), (t = Math.max(t, 18)), (t = Math.min(t, 0.9 * e)), t
      }
      class c extends o.ScaledPaneRenderer {
        constructor(e) {
          super(), (this._data = e)
        }
        setData(e) {
          this._data = e
        }
        hitTest(e) {
          if (this._data.points.length < 2) return null
          let t = this._data.points[0],
            i = this._data.points[1].subtract(t)
          const r = i.length()
          i = this._data.points[1].subtract(this._data.points[0])
          i.length() < 22 &&
            ((t = this._data.points[1].addScaled(i.normalized(), -22)), (i = this._data.points[1].subtract(t)))
          const n = e.subtract(t),
            s = i.dotProduct(n) / r
          if (s < 0 || s > r) return null
          const a = i.scaled(1 / r),
            o = t.addScaled(a, s),
            d = e.subtract(o),
            c = Object(h.interactionTolerance)().line,
            u = this._hittestGeometry(r)
          for (let e = u.length - 2; e >= 0; e--) {
            const t = u[e]
            if (s >= t.x) {
              const i = u[e + 1],
                r = i.x - t.x,
                n = i.y - t.y,
                a = (s - t.x) / r,
                o = t.y + n * a
              return d.length() <= o + c ? new l.HitTestResult(l.HitTestResult.MOVEPOINT) : null
            }
          }
          return d.length() < 3 ? new l.HitTestResult(l.HitTestResult.MOVEPOINT) : null
        }
        _drawImpl(e) {
          if (this._data.points.length < 2) return
          ;(e.fillStyle = this._data.color),
            (e.strokeStyle = this._data.color),
            (e.lineJoin = 'round'),
            (e.lineCap = 'round')
          let t = this._data.points[1].subtract(this._data.points[0])
          const i = t.length()
          let r = this._data.points[0]
          i < 22 && ((r = this._data.points[1].addScaled(t.normalized(), -22)), (t = this._data.points[1].subtract(r)))
          const n = new a.Point(t.y, -t.x).normalized(),
            s = this._arrowGeometry(t.length()),
            o = t.normalized()
          ;(e.lineWidth = (function (e) {
            let t = Math.round(0.02 * e)
            return (t = Math.min(t, 5)), (t = Math.max(t, 2)), t
          })(t.length())),
            e.beginPath(),
            e.moveTo(r.x, r.y)
          for (let t = 0; t < s.length; t++) {
            const i = s[t],
              a = r.addScaled(o, i.x).addScaled(n, i.y)
            e.lineTo(a.x, a.y)
          }
          e.lineTo(this._data.points[1].x, this._data.points[1].y)
          for (let t = s.length - 1; t >= 0; t--) {
            const i = s[t],
              a = r.addScaled(o, i.x).addScaled(n, -i.y)
            e.lineTo(a.x, a.y)
          }
          e.lineTo(r.x, r.y), e.stroke(), e.fill()
        }
        _arrowGeometry(e) {
          const t = d(e),
            i = [],
            r = e >= 35 ? 0.1 : 0
          return (
            i.push(new a.Point(0, 0)),
            i.push(new a.Point(e - t + t * r, (1.22 * t) / 4)),
            i.push(new a.Point(e - t, (1.22 * t) / 2)),
            i.push(new a.Point(e, 0)),
            i
          )
        }
        _hittestGeometry(e) {
          const t = d(e),
            i = []
          return (
            i.push(new a.Point(0, 0)),
            i.push(new a.Point(e - t, (1.22 * t) / 4)),
            i.push(new a.Point(e - t, (1.22 * t) / 2)),
            i.push(new a.Point(e, 0)),
            i
          )
        }
      }
      var u = i('QA6D')
      i.d(t, 'ArrowMarkerPaneView', function () {
        return _
      })
      class _ extends r.LineSourcePaneView {
        constructor(e, t) {
          super(e, t),
            (this._textRendererData = {
              text: '',
              color: '',
              vertAlign: 'middle',
              horzAlign: 'center',
              font: '',
              offsetX: 10,
              offsetY: 10,
              points: [],
              forceTextAlign: !0,
            }),
            (this._arrowRendererData = { points: [], color: '' }),
            (this._ellipseRendererData = {
              color: '',
              linewidth: 0,
              points: [],
              fillBackground: !0,
              backcolor: '',
              noHitTestOnBackground: !0,
            }),
            (this._drawAsCircle = !1),
            (this._textRenderer = new s.TextRenderer(this._textRendererData)),
            (this._arrowRenderer = new c(this._arrowRendererData)),
            (this._ellipseRenderer = new u.EllipseRendererSimple(this._ellipseRendererData))
        }
        renderer(e, t) {
          this._invalidated && this._updateImpl()
          const i = new n.CompositeRenderer()
          this._drawAsCircle ? i.append(this._ellipseRenderer) : i.append(this._arrowRenderer)
          const r = this._getSource().properties()
          return (
            this._textRendererData.points &&
              this._textRendererData.points.length > 0 &&
              r.showLabel.value() &&
              (this._textRenderer.setData({ ...this._textRendererData }), i.append(this._textRenderer)),
            this.addAnchors(i),
            i
          )
        }
        _updateImpl() {
          super._updateImpl()
          const e = this._getPoints(),
            t = this._getSource().properties()
          if (
            ((this._arrowRendererData.color = t.backgroundColor.value()),
            (this._arrowRendererData.points = e),
            (this._textRendererData.text = t.text.value()),
            (this._textRendererData.color = t.textColor.value()),
            (this._textRendererData.font = t.font.value()),
            (this._textRendererData.bold = t.bold.value()),
            (this._textRendererData.italic = t.italic.value()),
            (this._textRendererData.fontsize = t.fontsize.value()),
            e.length >= 2)
          ) {
            const i = this._getSource().points(),
              r = i[0].index - i[1].index,
              n = i[0].price - i[1].price
            if (
              ((this._drawAsCircle = 0 === r && Math.abs(n) < 1e-8),
              (this._textRendererData.points = [e[0]]),
              this._drawAsCircle)
            ) {
              ;(this._textRendererData.horzAlign = 'left'), (this._textRendererData.vertAlign = 'middle')
              const i = new a.Point(e[0].x - 9, e[0].y - 9),
                r = new a.Point(e[0].x + 9, e[0].y + 9)
              ;(this._ellipseRendererData.points = [i, r]),
                (this._ellipseRendererData.backcolor = t.backgroundColor.value()),
                (this._ellipseRendererData.color = t.backgroundColor.value())
            } else {
              const t = e[1].subtract(e[0])
              Math.abs(t.x) >= Math.abs(t.y)
                ? (e[1].x > e[0].x
                    ? (this._textRendererData.horzAlign = 'right')
                    : (this._textRendererData.horzAlign = 'left'),
                  (this._textRendererData.vertAlign = 'middle'))
                : (e[1].y > e[0].y
                    ? (this._textRendererData.vertAlign = 'bottom')
                    : (this._textRendererData.vertAlign = 'top'),
                  (this._textRendererData.horzAlign = 'center'))
            }
          }
        }
      }
    },
    QncP: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'prepareLinearRegressionRenderersData', function () {
          return o
        })
      var r = i('Eyy1'),
        n = i('aO4+'),
        s = i('a7Ha'),
        a = i('zDbI')
      function o(e, t) {
        const i = { lines: [], pearsons: null }
        if (!t.properties().visible.value()) return i
        const o = e.timeScale(),
          l = t.priceScale(),
          h = e.mainSeries().firstBar()
        if (!l || l.isEmpty() || o.isEmpty() || !h) return i
        const d = t.startIndex(),
          c = t.endIndex()
        if (null === d || null === c) return i
        const u = [t.baseLine(), t.downLine(), t.upLine()],
          _ = Math.round(o.indexToCoordinate(d)),
          p = Math.round(o.indexToCoordinate(c)),
          f = t.properties(),
          g = [f.styles.baseLine, f.styles.downLine, f.styles.upLine],
          v = h[4]
        for (let a = 0; a < u.length; a++) {
          if (!g[a].visible.value()) continue
          const o = Object(r.ensureNotNull)(u[a]).startPrice,
            h = Object(r.ensureNotNull)(u[a]).endPrice
          if (void 0 === o || void 0 === h) continue
          const d = l.priceToCoordinate(o, v),
            c = l.priceToCoordinate(h, v),
            w = new n.Point(_, d),
            x = new n.Point(p, c),
            m = g[a].color.value(),
            y = g[a].linewidth.value(),
            b = g[a].linestyle.value(),
            R = {
              floatPoints: [w, x],
              width: e.timeScale().width(),
              height: Object(r.ensureNotNull)(t.priceScale()).height(),
              color: m,
              linewidth: y,
              linestyle: b,
              extendleft: !1,
              extendright: f.styles.extendLines.value(),
              leftend: s.LineEnd.Normal,
              rightend: s.LineEnd.Normal,
            }
          i.lines.push(R)
        }
        const w = Object(r.ensureNotNull)(t.downLine())
        if (f.styles.showPearsons.value() && void 0 !== w.startPrice) {
          const e = l.priceToCoordinate(w.startPrice, v),
            r = new n.Point(_, e)
          i.pearsons = {
            points: [r],
            text: '' + t.pearsons(),
            color: f.styles.downLine.color.value(),
            vertAlign: 'top',
            horzAlign: 'center',
            font: a.CHART_FONT_FAMILY,
            offsetX: 0,
            offsetY: 4,
            fontsize: 12,
          }
        }
        return i
      }
    },
    R7Bt: function (e, t, i) {
      'use strict'
      var r = i('Eyy1').ensureNotNull,
        n = i('aO4+').Point,
        s = i('IjC5').RectangleRenderer,
        a = i('pJOz').TrendLineRenderer,
        o = i('cjIn').PaneRendererCachedImage,
        l = i('VdBB').HitTestResult,
        h = i('Zy3/').CompositeRenderer,
        d = i('a7Ha').LineEnd,
        c = i('d1Pk').fibLevelCoordinate,
        u = i('NCfL').LineToolPaneViewWithLevelledTextCache
      t.FibRetracementPaneView = class extends u {
        constructor(e, t) {
          super(e, t), (this._rendererCache = {}), (this._trendLineRenderer = new a()), (this._renderer = null)
        }
        getCacheRects(e, t) {
          if ((super.getCacheRects(e, t), !this._cacheState.preparedCells)) return null
          var i = this._levels[t].index - 1,
            s = this._cacheState.preparedCells.cells[i]
          if (!s) return null
          var a = this._points[0],
            o = this._points[1],
            l = Math.min(a.x, o.x),
            h = Math.max(a.x, o.x)
          ;(a = new n(l, this._levels[t].y)), (o = new n(h, this._levels[t].y))
          var d,
            c = this._source.properties(),
            u = c.extendLines.value() ? this._model.timeScale().width() : h,
            _ = r(this._cache)
          switch (c.horzLabelsAlign.value()) {
            case 'left':
              d = a
              break
            case 'center':
              ;((d = a.add(o).scaled(0.5)).x += s.width / 2), (d.x = Math.round(d.x))
              break
            case 'right':
              c.extendLines.value()
                ? (d = new n(u - 4, this._levels[t].y))
                : (((d = new n(u + 4, this._levels[t].y)).x += s.width), (d.x = Math.round(d.x)))
          }
          var p = {
              left: s.left,
              top: _.topByRow(this._cacheState.row),
              width: s.width,
              height: _.rowHeight(this._cacheState.row),
            },
            f = { left: d.x - p.width, top: d.y, width: s.width, height: p.height },
            g = c.vertLabelsAlign.value()
          return (
            'middle' === g && (f.top -= f.height / 2),
            'bottom' === g && (f.top -= f.height),
            { cacheRect: p, targetRect: f }
          )
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), !(this._source.points().length < 2))) {
            var e = this._source.priceScale()
            if (e && !e.isEmpty() && !this._model.timeScale().isEmpty()) {
              var t = this._source.ownerSource().firstValue()
              if (null != t) {
                var i = this._source.points()[0],
                  r = this._source.points()[1],
                  u = !1
                ;(L = this._source.properties()).reverse && L.reverse.value() && (u = L.reverse.value()),
                  (this._levels = [])
                var _,
                  p,
                  f = u ? i.price : r.price,
                  g = u ? r.price : i.price,
                  v = g - f,
                  w = e.isLog() && L.fibLevelsBasedOnLogScale.value()
                if (w) (_ = e.priceToCoordinate(f, t)), (p = e.priceToCoordinate(g, t) - _)
                for (
                  var x = { price: f, coordinate: _ },
                    m = { price: v, coordinate: p },
                    y = this._source.levelsCount(),
                    b = 1;
                  b <= y;
                  b++
                ) {
                  var R = L['level' + b]
                  if (R.visible.value()) {
                    var T = R.coeff.value(),
                      S = R.color.value(),
                      P = c(x, m, T, e, t, w)
                    this._levels.push({
                      color: S,
                      y: P,
                      linewidth: L.levelsStyle.linewidth.value(),
                      linestyle: L.levelsStyle.linestyle.value(),
                      index: b,
                    })
                  }
                }
                if (!(this._points.length < 2)) {
                  var L,
                    C = new h(),
                    M = ((i = this._points[0]), (r = this._points[1]), Math.min(i.x, r.x)),
                    I = Math.max(i.x, r.x),
                    O = (L = this._source.properties()).fillBackground.value(),
                    N = L.transparency.value(),
                    D = L.extendLinesLeft.value(),
                    B = L.extendLines.value()
                  if (O)
                    for (b = 0; b < this._levels.length; b++)
                      if (b > 0 && O) {
                        var k = this._levels[b - 1],
                          A = ((i = new n(M, this._levels[b].y)), (r = new n(I, k.y)), {})
                        ;(A.points = [i, r]),
                          (A.color = this._levels[b].color),
                          (A.linewidth = 0),
                          (A.backcolor = this._levels[b].color),
                          (A.fillBackground = !0),
                          (A.transparency = N),
                          (A.extendLeft = D),
                          (A.extendRight = B),
                          (j = new s(void 0, void 0, !0)).setData(A),
                          C.append(j)
                      }
                  var E = M,
                    z = I
                  E === z && (D && (E -= 1), B && (z += 1))
                  for (b = 0; b < this._levels.length; b++) {
                    var j,
                      V = {
                        points: [(i = new n(E, this._levels[b].y)), (r = new n(z, this._levels[b].y))],
                        width: this._model.timeScale().width(),
                        height: this._source.priceScale().height(),
                        color: this._levels[b].color,
                        linewidth: this._levels[b].linewidth,
                        linestyle: this._levels[b].linestyle,
                        extendleft: D,
                        extendright: B,
                        leftend: d.Normal,
                        rightend: d.Normal,
                      }
                    if (
                      ((j = new a()).setData(V),
                      j.setHitTest(new l(l.MOVEPOINT, null, this._levels[b].index)),
                      C.append(j),
                      L.showCoeffs.value() || L.showPrices.value())
                    ) {
                      var H = new o(this, b)
                      C.append(H)
                    }
                  }
                  if (L.trendline.visible.value()) {
                    V = {
                      points: [this._points[0], this._points[1]],
                      width: this._model.timeScale().width(),
                      height: this._source.priceScale().height(),
                      color: L.trendline.color.value(),
                      linewidth: L.trendline.linewidth.value(),
                      linestyle: L.trendline.linestyle.value(),
                      extendleft: !1,
                      extendright: !1,
                      leftend: d.Normal,
                      rightend: d.Normal,
                    }
                    this._trendLineRenderer.setData(V), C.append(this._trendLineRenderer)
                  }
                  this.addAnchors(C), (this._renderer = C)
                }
              }
            }
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    S6aM: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'LineToolThreeDrivesPaneView', function () {
          return c
        })
      var r = i('8Uy/'),
        n = i('Zy3/'),
        s = i('qgcf'),
        a = i('zXvd'),
        o = i('pJOz'),
        l = i('a7Ha'),
        h = i('BCbF'),
        d = i('aB9a')
      class c extends d.LineSourcePaneView {
        constructor() {
          super(...arguments),
            (this._numericFormatter = new a.NumericFormatter()),
            (this._retrace1LabelRenderer = new s.TextRenderer()),
            (this._retrace12LabelRenderer = new s.TextRenderer()),
            (this._polyLineRenderer = new h.PolygonRenderer(null)),
            (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          super._updateImpl(), (this._renderer = null)
          let e = NaN,
            t = NaN
          if (this._source.points().length >= 4) {
            const [, t, i, r] = this._source.points()
            e = Math.round(100 * Math.abs((r.price - i.price) / (i.price - t.price))) / 100
          }
          if (this._source.points().length >= 6) {
            const [, , , e, i, r] = this._source.points()
            t = Math.round(100 * Math.abs((r.price - i.price) / (i.price - e.price))) / 100
          }
          if (this._points.length < 2) return
          const i = this._source.properties().childs(),
            s = new n.CompositeRenderer(),
            a = (e, t) => ({
              points: [e],
              text: t,
              color: i.textcolor.value(),
              vertAlign: 'middle',
              horzAlign: 'center',
              font: i.font.value(),
              offsetX: 0,
              offsetY: 0,
              bold: i.bold && i.bold.value(),
              italic: i.italic && i.italic.value(),
              fontsize: i.fontsize.value(),
              backgroundColor: i.color.value(),
              backgroundRoundRect: 4,
            }),
            h = (e, t) => ({
              points: [e, t],
              color: i.color.value(),
              linewidth: i.linewidth.value(),
              linestyle: r.LINESTYLE_DOTTED,
              extendleft: !1,
              extendright: !1,
              leftend: l.LineEnd.Normal,
              rightend: l.LineEnd.Normal,
            }),
            d = {
              points: this._points,
              color: i.color.value(),
              linewidth: i.linewidth.value(),
              linestyle: r.LINESTYLE_SOLID,
              leftend: l.LineEnd.Normal,
              rightend: l.LineEnd.Normal,
              backcolor: 'rgba(0, 0, 0, 0)',
              fillBackground: !1,
              filled: !1,
            }
          if ((this._polyLineRenderer.setData(d), s.append(this._polyLineRenderer), !isNaN(e))) {
            const t = new o.TrendLineRenderer()
            t.setData(h(this._points[1], this._points[3])), s.append(t)
            const i = a(this._points[1].add(this._points[3]).scaled(0.5), this._numericFormatter.format(e))
            this._retrace1LabelRenderer.setData(i), s.append(this._retrace1LabelRenderer)
          }
          if (!isNaN(t)) {
            const e = new o.TrendLineRenderer()
            e.setData(h(this._points[3], this._points[5])), s.append(e)
            const i = a(this._points[5].add(this._points[3]).scaled(0.5), this._numericFormatter.format(t))
            this._retrace12LabelRenderer.setData(i), s.append(this._retrace12LabelRenderer)
          }
          this.addAnchors(s), (this._renderer = s)
        }
      }
    },
    SvjA: function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('z+cS').VerticalLineRenderer,
        s = i('aB9a').LineSourcePaneView,
        a = i('qgcf').TextRenderer,
        o = i('IjC5').RectangleRenderer,
        l = i('pJOz').TrendLineRenderer,
        h = i('VdBB').HitTestResult,
        d = i('Zy3/').CompositeRenderer,
        c = i('a7Ha').LineEnd
      t.TrendBasedFibTimePaneView = class extends s {
        constructor(e, t) {
          super(e, t),
            (this._trendLineRendererPoints12 = new l()),
            (this._trendLineRendererPoints23 = new l()),
            (this._renderer = null)
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), 3 === this._source.points().length)) {
            if (!this._source.priceScale() || this._source.priceScale().isEmpty() || this._model.timeScale().isEmpty())
              return
            var e = this._source.points()[0],
              t = this._source.points()[1],
              i = this._source.points()[2]
            if (((this._levels = []), t.index === e.index)) return
            var s = t.index - e.index,
              l = this._source.properties(),
              u = i.index
            if (null === this._model.timeScale().visibleBarsStrictRange()) return
            for (var _ = 1; _ <= 11; _++) {
              var p = l['level' + _]
              if (p.visible.value()) {
                var f = p.coeff.value(),
                  g = p.color.value(),
                  v = Math.round(u + f * s),
                  w = {
                    x: this._model.timeScale().indexToCoordinate(v),
                    coeff: f,
                    color: g,
                    linewidth: p.linewidth.value(),
                    linestyle: p.linestyle.value(),
                    index: _,
                  }
                l.showCoeffs.value() && ((w.text = f), (w.y = this._source.priceScale().height())), this._levels.push(w)
              }
            }
          }
          if (!(this._points.length < 2)) {
            var x = new d()
            ;(e = this._points[0]), (t = this._points[1])
            if ((l = this._source.properties()).trendline.visible.value()) {
              var m = {
                points: [e, t],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: l.trendline.color.value(),
                linewidth: l.trendline.linewidth.value(),
                linestyle: l.trendline.linestyle.value(),
                extendleft: !1,
                extendright: !1,
                leftend: c.Normal,
                rightend: c.Normal,
              }
              this._trendLineRendererPoints12.setData(m), x.append(this._trendLineRendererPoints12)
            }
            if (this._points.length < 3) return this.addAnchors(x), void (this._renderer = x)
            i = this._points[2]
            if (l.trendline.visible.value()) {
              m = {
                points: [t, i],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: l.trendline.color.value(),
                linewidth: l.trendline.linewidth.value(),
                linestyle: l.trendline.linestyle.value(),
                extendleft: !1,
                extendright: !1,
                leftend: c.Normal,
                rightend: c.Normal,
              }
              this._trendLineRendererPoints23.setData(m), x.append(this._trendLineRendererPoints23)
            }
            var y = l.fillBackground.value(),
              b = l.transparency.value(),
              R = this._model.timeScale().width(),
              T = this._source.priceScale().height()
            if (y)
              for (_ = 1; _ < this._levels.length; _++) {
                var S = this._levels[_ - 1],
                  P = ((e = new r(S.x, 0)), (t = new r(this._levels[_].x, this._source.priceScale().height())), {})
                ;(P.points = [e, t]),
                  (P.color = this._levels[_].color),
                  (P.linewidth = 0),
                  (P.backcolor = this._levels[_].color),
                  (P.fillBackground = !0),
                  (P.transparency = b),
                  (P.extendLeft = !1),
                  (P.extendRight = !1),
                  (O = new o(void 0, void 0, !0)).setData(P),
                  x.append(O)
              }
            for (_ = 0; _ < this._levels.length; _++) {
              if (void 0 !== this._levels[_].text) {
                var L,
                  C = l.horzLabelsAlign.value()
                switch (((C = 'left' === C ? 'right' : 'right' === C ? 'left' : 'center'), l.vertLabelsAlign.value())) {
                  case 'top':
                    L = new r(this._levels[_].x, 0)
                    break
                  case 'middle':
                    L = new r(this._levels[_].x, 0.5 * this._levels[_].y)
                    break
                  case 'bottom':
                    L = new r(this._levels[_].x, this._levels[_].y)
                }
                var M = {
                  points: [L],
                  text: '' + this._levels[_].text,
                  color: this._levels[_].color,
                  vertAlign: l.vertLabelsAlign.value(),
                  horzAlign: C,
                  font: l.font.value(),
                  offsetX: 2,
                  offsetY: 0,
                  fontsize: 12,
                }
                x.append(new a(M))
              }
              var I = {}
              ;(I.width = R),
                (I.height = T),
                (I.x = this._levels[_].x),
                (I.color = this._levels[_].color),
                (I.linewidth = this._levels[_].linewidth),
                (I.linestyle = this._levels[_].linestyle)
              var O,
                N = new h(h.MOVEPOINT, null, this._levels[_].index)
              ;(O = new n()).setData(I), O.setHitTest(N), x.append(O)
            }
            this.addAnchors(x), (this._renderer = x)
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    UcQu: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'DateAndPriceRangePaneView', function () {
          return R
        })
      var r = i('Eyy1'),
        n = i('aO4+'),
        s = i('YFKU'),
        a = i('Ialn'),
        o = i('aB9a'),
        l = i('qgcf'),
        h = i('IjC5'),
        d = i('pJOz'),
        c = i('Zy3/'),
        u = i('GH0z'),
        _ = i('8Uy/'),
        p = i('a7Ha'),
        f = i('nda6'),
        g = i('5C6T'),
        v = i('nEwK')
      const w = new f.TimeSpanFormatter(),
        x = new u.PercentageFormatter(),
        m = new v.VolumeFormatter(),
        y = Object(s.t)('{count} bars'),
        b = Object(s.t)('Vol')
      class R extends o.LineSourcePaneView {
        constructor() {
          super(...arguments),
            (this._distanceLineRenderer = new d.TrendLineRenderer()),
            (this._distancePriceRenderer = new d.TrendLineRenderer()),
            (this._backgroundRenderer = new h.RectangleRenderer()),
            (this._borderRenderer = new h.RectangleRenderer()),
            (this._textRenderer = new l.TextRenderer()),
            (this._renderer = new c.CompositeRenderer()),
            (this._pipFormatter = null),
            (this._lastSymbolInfo = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(e, t), this._renderer
        }
        _updateImpl(e, t) {
          if (
            (super._updateImpl(), this._renderer.clear(), this._points.length < 2 || this._source.points().length < 2)
          )
            return
          const i = this._source.properties().childs()
          i.fillBackground &&
            i.fillBackground.value() &&
            (this._backgroundRenderer.setData({
              points: this._points,
              color: 'white',
              linewidth: 0,
              backcolor: i.backgroundColor.value(),
              fillBackground: !0,
              transparency: i.backgroundTransparency.value(),
              extendLeft: !1,
              extendRight: !1,
            }),
            this._renderer.append(this._backgroundRenderer))
          const [s, o] = this._points
          i.drawBorder.value() &&
            (this._borderRenderer.setData({
              points: this._points,
              color: i.borderColor.value(),
              linewidth: i.borderWidth.value(),
              fillBackground: !1,
              extendLeft: !1,
              extendRight: !1,
              backcolor: '',
            }),
            this._renderer.append(this._borderRenderer))
          const h = i.drawBorder.value() ? i.borderWidth.value() / 2 : 0,
            d = Math.round((s.y + o.y) / 2),
            c = new n.Point(s.x + Math.sign(o.x - s.x) * h, d),
            u = new n.Point(o.x + Math.sign(s.x - o.x) * h, d)
          this._distanceLineRenderer.setData({
            points: [c, u],
            color: i.linecolor.value(),
            linewidth: i.linewidth.value(),
            linestyle: _.LINESTYLE_SOLID,
            extendleft: !1,
            extendright: !1,
            leftend: p.LineEnd.Normal,
            rightend: Math.abs(s.x - o.x) >= 25 * i.linewidth.value() ? p.LineEnd.Arrow : p.LineEnd.Normal,
          }),
            this._renderer.append(this._distanceLineRenderer)
          const f = Math.round((s.x + o.x) / 2),
            v = new n.Point(f, s.y + Math.sign(o.y - s.y) * h),
            R = new n.Point(f, o.y + Math.sign(s.y - o.y) * h)
          this._distancePriceRenderer.setData({
            points: [v, R],
            color: i.linecolor.value(),
            linewidth: i.linewidth.value(),
            linestyle: _.LINESTYLE_SOLID,
            extendleft: !1,
            extendright: !1,
            leftend: p.LineEnd.Normal,
            rightend: Math.abs(v.y - R.y) >= 25 * i.linewidth.value() ? p.LineEnd.Arrow : p.LineEnd.Normal,
          }),
            this._renderer.append(this._distancePriceRenderer)
          const T = this._source.points()[0].price,
            S = this._source.points()[1].price,
            P = S - T,
            L = (100 * P) / Math.abs(T),
            C = this._source.points()[0].index,
            M = this._source.points()[1].index,
            I = M - C,
            O = Object(a.forceLTRStr)(I + ''),
            N = this._model.timeScale().indexToUserTime(C),
            D = this._model.timeScale().indexToUserTime(M)
          let B = ''
          if (N && D) {
            const e = (D.valueOf() - N.valueOf()) / 1e3
            B = ', ' + Object(a.startWithLTR)(w.format(e))
          }
          const k = this._model.mainSeries().symbolInfo()
          k &&
            k !== this._lastSymbolInfo &&
            ((this._pipFormatter = new g.PipFormatter(k.pricescale, k.minmov, k.type, k.minmove2)),
            (this._lastSymbolInfo = k))
          const A =
            Object(r.ensureNotNull)(this._source.ownerSource()).formatter().format(P) +
            ' (' +
            x.format(Math.round(100 * L) / 100) +
            ') ' +
            (this._pipFormatter ? this._pipFormatter.format(P) : '')
          let E = Object(a.forceLTRStr)(A) + '\n' + y.format({ count: O }) + B
          const z = this._source.volume()
          let j
          Number.isNaN(z) || (E += `\n${b} ${m.format(z)}`),
            (j =
              S > T
                ? new n.Point(0.5 * (s.x + o.x), o.y - 2 * i.fontsize.value())
                : new n.Point(0.5 * (s.x + o.x), o.y + 0.7 * i.fontsize.value()))
          const V = { x: 0, y: 10 },
            H = {
              points: [j],
              text: E,
              color: i.textcolor.value(),
              font: i.font.value(),
              offsetX: V.x,
              offsetY: V.y,
              padding: 8,
              vertAlign: 'middle',
              horzAlign: 'center',
              fontsize: i.fontsize.value(),
              backgroundRoundRect: 4,
              backgroundHorzInflate: 0.4 * i.fontsize.value(),
              backgroundVertInflate: 0.2 * i.fontsize.value(),
            }
          i.fillLabelBackground &&
            i.fillLabelBackground.value() &&
            (H.backgroundColor = i.labelBackgroundColor.value()),
            this._textRenderer.setData(H)
          const W = this._textRenderer.measure(),
            F = Object(l.calculateLabelPosition)(W, s, o, V, e)
          this._textRenderer.setPoints([F]), this._renderer.append(this._textRenderer), this.addAnchors(this._renderer)
        }
      }
    },
    V8bI: function (e, t, i) {
      e.exports = i.p + '898929f1acdb622689e0fc0c95c8fcd0.png'
    },
    VghZ: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'PriceRangePaneView', function () {
          return g
        })
      var r = i('Eyy1'),
        n = i('aO4+'),
        s = i('Ialn'),
        a = i('aB9a'),
        o = i('qgcf'),
        l = i('IjC5'),
        h = i('pJOz'),
        d = i('Zy3/'),
        c = i('GH0z'),
        u = i('8Uy/'),
        _ = i('a7Ha'),
        p = i('5C6T')
      const f = new c.PercentageFormatter()
      class g extends a.LineSourcePaneView {
        constructor() {
          super(...arguments),
            (this._topBorderRenderer = new h.TrendLineRenderer()),
            (this._bottomBorderRenderer = new h.TrendLineRenderer()),
            (this._distanceRenderer = new h.TrendLineRenderer()),
            (this._backgroundRenderer = new l.RectangleRenderer()),
            (this._labelRenderer = new o.TextRenderer()),
            (this._renderer = new d.CompositeRenderer()),
            (this._pipFormatter = null),
            (this._lastSymbolInfo = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(e, t), this._renderer
        }
        _updateImpl(e, t) {
          if (
            (super._updateImpl(), this._renderer.clear(), this._points.length < 2 || this._source.points().length < 2)
          )
            return
          const i = this._source.properties().childs(),
            a = i.extendLeft.value(),
            l = i.extendRight.value(),
            [h, d] = this._points,
            c = Math.min(h.x, d.x),
            g = Math.max(h.x, d.x)
          i.fillBackground.value() &&
            (this._backgroundRenderer.setData({
              points: [new n.Point(c, h.y), new n.Point(g, d.y)],
              color: 'white',
              linewidth: 0,
              backcolor: i.backgroundColor.value(),
              fillBackground: !0,
              transparency: i.backgroundTransparency.value(),
              extendLeft: a,
              extendRight: l,
            }),
            this._renderer.append(this._backgroundRenderer))
          const v = (e, t, r) => {
            e.setData({
              points: [t, r],
              color: i.linecolor.value(),
              linewidth: i.linewidth.value(),
              linestyle: u.LINESTYLE_SOLID,
              extendleft: a,
              extendright: l,
              leftend: _.LineEnd.Normal,
              rightend: _.LineEnd.Normal,
            }),
              this._renderer.append(e)
          }
          let w = c,
            x = g
          w === x && (a && (w -= 1), l && (x += 1)),
            v(this._topBorderRenderer, new n.Point(w, h.y), new n.Point(x, h.y)),
            v(this._bottomBorderRenderer, new n.Point(w, d.y), new n.Point(x, d.y))
          const m = Math.round((h.x + d.x) / 2),
            y = new n.Point(m, h.y),
            b = new n.Point(m, d.y)
          this._distanceRenderer.setData({
            points: [y, b],
            color: i.linecolor.value(),
            linewidth: i.linewidth.value(),
            linestyle: u.LINESTYLE_SOLID,
            extendleft: !1,
            extendright: !1,
            leftend: _.LineEnd.Normal,
            rightend: Math.abs(y.y - b.y) >= 15 * i.linewidth.value() ? _.LineEnd.Arrow : _.LineEnd.Normal,
          }),
            this._renderer.append(this._distanceRenderer)
          const R = this._source.points()[0].price,
            T = this._source.points()[1].price,
            S = T - R,
            P = (100 * S) / Math.abs(R),
            L = this._model.mainSeries().symbolInfo()
          L &&
            L !== this._lastSymbolInfo &&
            ((this._pipFormatter = new p.PipFormatter(L.pricescale, L.minmov, L.type, L.minmove2)),
            (this._lastSymbolInfo = L))
          const C = Object(s.forceLTRStr)(
            Object(r.ensureNotNull)(this._source.ownerSource()).formatter().format(S) +
              ' (' +
              f.format(P) +
              ') ' +
              (this._pipFormatter ? this._pipFormatter.format(S) : ''),
          )
          let M
          M =
            T > R
              ? new n.Point(0.5 * (h.x + d.x), d.y - 2 * i.fontsize.value())
              : new n.Point(0.5 * (h.x + d.x), d.y + 0.7 * i.fontsize.value())
          const I = { x: 0, y: 10 },
            O = {
              points: [M],
              text: C,
              color: i.textcolor.value(),
              font: i.font.value(),
              offsetX: I.x,
              offsetY: I.y,
              padding: 8,
              vertAlign: 'middle',
              horzAlign: 'center',
              fontsize: i.fontsize.value(),
              backgroundRoundRect: 4,
              backgroundHorzInflate: 0.4 * i.fontsize.value(),
              backgroundVertInflate: 0.2 * i.fontsize.value(),
            }
          i.fillLabelBackground.value() && (O.backgroundColor = i.labelBackgroundColor.value()),
            this._labelRenderer.setData(O)
          const N = this._labelRenderer.measure(),
            D = Object(o.calculateLabelPosition)(N, h, d, I, e)
          this._labelRenderer.setPoints([D]),
            this._renderer.append(this._labelRenderer),
            this.addAnchors(this._renderer)
        }
      }
    },
    X4Cb: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'GannComplexPaneView', function () {
          return u
        })
      var r = i('aO4+'),
        n = i('aB9a'),
        s = i('pJOz'),
        a = i('qgcf'),
        o = i('Zy3/'),
        l = i('a7Ha'),
        h = i('8Uy/'),
        d = i('amvX'),
        c = i('Ialn')
      class u extends n.LineSourcePaneView {
        constructor(e, t) {
          super(e, t),
            (this._verticalLevelsRenderers = []),
            (this._horizontalLevelsRenderers = []),
            (this._fanRenderers = []),
            (this._arcRenderers = []),
            (this._priceDiffTextRenderer = new a.TextRenderer()),
            (this._indexDiffTextRenderer = new a.TextRenderer()),
            (this._ratioTextRenderer = new a.TextRenderer()),
            (this._renderer = null),
            this._initRenderers()
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          super._updateImpl(), (this._renderer = null)
          const e = new o.CompositeRenderer(),
            t = this._getPoints()
          if (t.length < 2) return this.addAnchors(e), void (this._renderer = e)
          let [i, r] = t
          const n = this._getSource(),
            s = n.isReversed()
          s && ([r, i] = t)
          const a = r.x - i.x,
            l = r.y - i.y,
            h = i,
            d = r,
            c = this._getModel(),
            u = {
              barsCoordsRange: a,
              priceCoordsRange: l,
              startPoint: h,
              endPoint: d,
              p1: i,
              p2: r,
              isLabelsVisible: n.isLabelsVisible(),
              reversed: s,
            }
          this._prepareLevels(e, u), this._prepareFanLines(e, u), this._prepareArcs(e, u), this._prepareLabels(e, u)
          const _ = [i, r]
          c.lineBeingCreated() === n && _.pop(), e.append(this.createLineAnchor({ points: _ }, 0)), (this._renderer = e)
        }
        _initRenderers() {
          const e = this._getSource(),
            t = e.levelsCount()
          for (let e = 0; e < t; e++)
            this._verticalLevelsRenderers.push(new s.TrendLineRenderer()),
              this._horizontalLevelsRenderers.push(new s.TrendLineRenderer())
          const i = e.fanLinesCount()
          for (let e = 0; e < i; e++) this._fanRenderers.push(new s.TrendLineRenderer())
          const r = e.arcsCount()
          for (let e = 0; e < r; e++) this._arcRenderers.push(new d.a())
        }
        _prepareLevels(e, t) {
          const { startPoint: i, endPoint: n, barsCoordsRange: s, priceCoordsRange: a } = t,
            o = this._getSource().levels()
          for (const t of o) {
            if (!t.visible) continue
            const o = t.index / 5,
              d = i.x + o * s,
              c = {
                points: [new r.Point(d, i.y), new r.Point(d, n.y)],
                color: t.color,
                linewidth: t.width,
                linestyle: h.LINESTYLE_SOLID,
                extendleft: !1,
                extendright: !1,
                leftend: l.LineEnd.Normal,
                rightend: l.LineEnd.Normal,
              },
              u = this._verticalLevelsRenderers[t.index]
            u.setData(c), e.append(u)
            const _ = i.y + o * a,
              p = {
                points: [new r.Point(i.x, _), new r.Point(n.x, _)],
                color: t.color,
                linewidth: t.width,
                linestyle: h.LINESTYLE_SOLID,
                extendleft: !1,
                extendright: !1,
                leftend: l.LineEnd.Normal,
                rightend: l.LineEnd.Normal,
              },
              f = this._horizontalLevelsRenderers[t.index]
            f.setData(p), e.append(f)
          }
        }
        _prepareFanLines(e, t) {
          const { p1: i, startPoint: n, endPoint: s, barsCoordsRange: a, priceCoordsRange: o } = t,
            d = this._getSource().fanLines()
          for (const t of d) {
            if (!t.visible) continue
            const d = t.x,
              c = t.y
            let u, _
            if (d > c) {
              u = s.x
              const e = c / d
              _ = n.y + e * o
            } else {
              _ = s.y
              const e = d / c
              u = n.x + e * a
            }
            const p = {
                points: [i, new r.Point(u, _)],
                color: t.color,
                linewidth: t.width,
                linestyle: h.LINESTYLE_SOLID,
                extendleft: !1,
                extendright: !1,
                leftend: l.LineEnd.Normal,
                rightend: l.LineEnd.Normal,
              },
              f = this._fanRenderers[t.index]
            f.setData(p), e.append(f)
          }
        }
        _prepareArcs(e, t) {
          const { p1: i, startPoint: n, endPoint: s, barsCoordsRange: a, priceCoordsRange: o } = t
          let l = i
          const h = this._getSource(),
            d = h.isArcsBackgroundFilled(),
            c = h.arcsBackgroundTransparency(),
            u = h.arcs()
          for (const t of u) {
            if (!t.visible) continue
            const i = t.x / 5,
              h = t.y / 5,
              u = n.x + i * a,
              _ = n.y + h * o,
              p = {
                center: n,
                point: new r.Point(u, _),
                edge: s,
                color: t.color,
                linewidth: t.width,
                fillBack: d,
                transparency: c,
                prevPoint: l,
              },
              f = this._arcRenderers[t.index]
            f.setData(p), e.append(f), (l = p.point)
          }
        }
        _prepareLabels(e, t) {
          const { p1: i, p2: n, isLabelsVisible: s, reversed: a } = t
          if (!s) return
          const o = this._getSource(),
            l = o.ownerSource()
          let h = o.getPriceDiff(),
            d = o.getIndexDiff()
          if (null === h || null === d || null === l) return
          a && ((h = -h), (d = -d))
          const u = new r.Point(i.x, n.y),
            _ = Object(c.forceLTRStr)(l.formatter().format(h)),
            p = this._getLabelData(u, _)
          ;(p.horzAlign = d > 0 ? 'right' : 'left'),
            (p.vertAlign = h > 0 ? 'bottom' : 'top'),
            (p.offsetX = 10),
            (p.offsetY = h > 0 ? 8 : 10),
            (p.forceTextAlign = !0),
            this._priceDiffTextRenderer.setData(p),
            e.append(this._priceDiffTextRenderer)
          const f = new r.Point(n.x, i.y),
            g = Object(c.forceLTRStr)(d.toString()),
            v = this._getLabelData(f, g)
          ;(v.horzAlign = d > 0 ? 'left' : 'right'),
            (v.vertAlign = h > 0 ? 'top' : 'bottom'),
            (v.offsetX = 10),
            (v.offsetY = h > 0 ? 10 : 8),
            (v.forceTextAlign = !0),
            this._indexDiffTextRenderer.setData(v),
            e.append(this._indexDiffTextRenderer)
          const w = o.getScaleRatio()
          if (null === w) return
          const x = o.getScaleRatioFormatter(),
            m = Object(c.forceLTRStr)(x.format(w)),
            y = this._getLabelData(n, m)
          ;(y.horzAlign = d > 0 ? 'left' : 'right'),
            (y.vertAlign = h > 0 ? 'bottom' : 'top'),
            (y.offsetX = 10),
            (y.offsetY = h > 0 ? 8 : 10),
            (y.forceTextAlign = !0),
            this._ratioTextRenderer.setData(y),
            e.append(this._ratioTextRenderer)
        }
        _getLabelData(e, t) {
          const i = this._getSource(),
            { textColor: r, font: n, fontSize: s, bold: a, italic: o } = i.getLabelsStyle()
          return {
            points: [e],
            backgroundColor: 'transparent',
            text: t,
            font: n,
            bold: a,
            italic: o,
            fontsize: s,
            color: r,
            vertAlign: 'top',
            horzAlign: 'center',
            offsetX: 0,
            offsetY: 0,
            backgroundRoundRect: 4,
          }
        }
      }
    },
    XHET: function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('YFKU').t,
        s = i('aB9a').LineSourcePaneView,
        a = i('5/lF').TrendLineStatsRenderer,
        o = i('qgcf').TextRenderer,
        l = i('pJOz').TrendLineRenderer,
        h = i('Zy3/').CompositeRenderer,
        d = i('GH0z').PercentageFormatter,
        c = i('vq8G').SelectionRenderer,
        u = i('5C6T').PipFormatter,
        _ = i('a7Ha').LineEnd,
        p = i('8xAY').LabelSettings,
        f = i('zDbI').CHART_FONT_FAMILY,
        g = i('VdBB').HitTestResult,
        v = i('cPgM').ScaledPaneRenderer,
        w = i('cPgM').ScaledPaneRendererWrapper,
        x = i('Ialn').forceLTRStr
      class m extends v {
        constructor() {
          super(), (this._data = null)
        }
        setData(e) {
          this._data = e
        }
        hitTest() {
          return null
        }
        _drawImpl(e) {
          if (null !== this._data) {
            e.save(), e.translate(this._data.point.x, this._data.point.y), (e.strokeStyle = this._data.color)
            var t = [1, 2]
            'function' == typeof e.setLineDash
              ? e.setLineDash(t)
              : void 0 !== e.mozDash
              ? (e.mozDash = t)
              : void 0 !== e.webkitLineDash && (e.webkitLineDash = t)
            var i = this._data.size
            e.beginPath(),
              e.moveTo(0, 0),
              e.lineTo(i, 0),
              e.arc(0, 0, i, 0, -this._data.angle, this._data.angle > 0),
              e.stroke(),
              e.restore()
          }
        }
      }
      t.TrendAnglePaneView = class extends s {
        constructor(e, t) {
          super(e, t),
            (this._label = null),
            (this._rendererCache = {}),
            (this._pipFormatter = null),
            (this._lastSymbolInfo = null),
            (this._trendLineRenderer = new l()),
            (this._angleRenderer = new m()),
            (this._angleLabelRenderer = new o()),
            (this._renderer = null)
        }
        _updateImpl() {
          if (
            (super._updateImpl(), (this._renderer = null), this._points.length > 0 && void 0 !== this._source._angle)
          ) {
            var e = this._points[0],
              t = Math.cos(this._source._angle),
              i = -Math.sin(this._source._angle),
              s = new r(t, i)
            ;(this._secondPoint = e.addScaled(s, this._source._distance)),
              (this._secondPoint.data = 1),
              (this._middlePoint = this._source.calcMiddlePoint(this._points[0], this._secondPoint))
          }
          if (((this._label = null), !(this._source.points().length < 2))) {
            e = this._source.points()[0]
            var o,
              l,
              v = this._source.points()[1],
              m = []
            if (this._source.properties().showPriceRange.value() && this._source.priceScale()) {
              var y = v.price - e.price,
                b = y / Math.abs(e.price)
              o = this._source.ownerSource().formatter().format(y) + ' (' + new d().format(100 * b) + ') '
              var R = this._model.mainSeries().symbolInfo()
              R &&
                R !== this._lastSymbolInfo &&
                ((this._pipFormatter = new u(R.pricescale, R.minmov, R.type, R.minmove2)), (this._lastSymbolInfo = R)),
                (o += this._pipFormatter ? ', ' + this._pipFormatter.format(y) : ''),
                m.push('priceRange')
            }
            if (this._source.properties().showBarsRange.value()) {
              l = ''
              var T = v.index - e.index
              ;(l += n('{count} bars').format({ count: x(T) })), m.push('barsRange')
            }
            ;(this._label =
              [x(o), l]
                .filter(function (e) {
                  return e
                })
                .join('\n') || null),
              (this._icons = m)
            var S = new h(),
              P = {},
              L =
                this.isHoveredSource() || this.isSelectedSource() || this._source.properties().alwaysShowStats.value(),
              C =
                (this.isHoveredSource() || this.isSelectedSource()) && this._source.properties().showMiddlePoint.value()
            if (this._secondPoint && this._points.length > 0) {
              var M = this._source.properties().linecolor.value()
              if (
                ((P.points = [this._points[0], this._secondPoint]),
                (P.width = this._model.timeScale().width()),
                (P.height = this._source.priceScale().height()),
                (P.color = M),
                (P.linewidth = this._source.properties().linewidth.value()),
                (P.linestyle = this._source.properties().linestyle.value()),
                (P.extendleft = this._source.properties().extendLeft.value()),
                (P.extendright = this._source.properties().extendRight.value()),
                (P.leftend = _.Normal),
                (P.rightend = _.Normal),
                this._trendLineRenderer.setData(P),
                S.append(this._trendLineRenderer),
                L && this._label && 2 === this._points.length)
              ) {
                var I = this._source.properties().statsPosition.value(),
                  O = this._source.getPointByPosition(I, P.points[0], this._middlePoint, P.points[1]),
                  N = this._model.isDark(),
                  D = N ? p.bgColorDark : p.bgColorLight,
                  B = N ? p.textColorDark : p.textColorLight,
                  k = {
                    points: [O],
                    text: this._label,
                    color: B,
                    isDark: N,
                    font: f,
                    fontSize: p.fontSize,
                    lineSpacing: p.lineSpacing,
                    backgroundColor: D,
                    backgroundRoundRect: p.rectRadius,
                    paddingLeft: p.paddingLeftRight,
                    paddingRight: p.paddingLeftRight,
                    paddingTop: p.paddingTopBottom,
                    paddingBottom: p.paddingTopBottom,
                    textPadding: p.textPadding,
                    doNotAlignText: !0,
                    icons: this._icons,
                  },
                  A = p.offset
                ;(k.offsetX = A),
                  (k.offsetY = A),
                  ((this._points[1].y < this._points[0].y && this._points[1].x < this._points[0].x) ||
                    (this._points[1].y > this._points[0].y && this._points[1].x > this._points[0].x)) &&
                    (k.vertAlign = 'bottom'),
                  S.append(new w(new a(k, this._rendererCache)))
              }
              this._middlePoint &&
                S.append(
                  new c({
                    points: [this._middlePoint],
                    bgColors: this._lineAnchorColors([this._middlePoint]),
                    color: M,
                    visible: C && this.areAnchorsVisible(),
                    hittestResult: g.REGULAR,
                  }),
                )
              var E = {}
              ;(E.point = this._points[0]),
                (E.angle = this._source._angle),
                (E.color = this._source.properties().linecolor.value()),
                (E.size = 50),
                this._angleRenderer.setData(E),
                S.append(this._angleRenderer)
              var z = Math.round((180 * E.angle) / Math.PI) + 'º'
              ;(O = this._points[0].clone()).x = O.x + 50
              var j = {
                points: [O],
                text: x(z),
                color: this._source.properties().textcolor.value(),
                horzAlign: 'left',
                font: this._source.properties().font.value(),
                offsetX: 5,
                offsetY: 0,
                bold: this._source.properties().bold.value(),
                italic: this._source.properties().italic.value(),
                fontsize: this._source.properties().fontsize.value(),
                vertAlign: 'middle',
              }
              this._angleLabelRenderer.setData(j), S.append(this._angleLabelRenderer)
            }
            0,
              this._secondPoint &&
                this._points.length > 0 &&
                S.append(this.createLineAnchor({ points: [this._points[0], this._secondPoint] }, 0)),
              (this._renderer = S)
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    ZJWf: function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('aB9a').LineSourcePaneView,
        s = i('2trc').ChannelRenderer,
        a = i('qgcf').TextRenderer,
        o = i('pJOz').TrendLineRenderer,
        l = i('VdBB').HitTestResult,
        h = i('Zy3/').CompositeRenderer,
        d = i('a7Ha').LineEnd
      t.GannFanPaneView = class extends n {
        constructor(e, t) {
          super(e, t), (this._renderer = null)
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            (this._renderer = null),
            !(this._source.points().length < 2) &&
              this._source.priceScale() &&
              !this._source.priceScale().isEmpty() &&
              !this._model.timeScale().isEmpty())
          ) {
            var e = this._floatPoints[0],
              t = this._floatPoints[1]
            this._fans = []
            for (var i = t.x - e.x, n = t.y - e.y, c = 1; c <= 9; c++) {
              var u = 'level' + c,
                _ = this._source.properties()[u]
              if (_.visible.value()) {
                var p,
                  f,
                  g = _.coeff1.value(),
                  v = _.coeff2.value(),
                  w = g / v,
                  x = _.color.value(),
                  m = g + '/' + v
                g > v ? ((p = t.x), (f = e.y + n / w)) : ((p = e.x + i * w), (f = t.y)),
                  this._fans.push({
                    label: m,
                    color: x,
                    x: p,
                    y: f,
                    linewidth: _.linewidth.value(),
                    linestyle: _.linestyle.value(),
                    index: c,
                  })
              }
            }
            if (!(this._floatPoints.length < 2)) {
              var y = new h(),
                b = ((e = this._floatPoints[0]), this._source.properties()),
                R = this._source.properties().fillBackground.value(),
                T = this._source.properties().transparency.value()
              for (c = 0; c < this._fans.length; c++) {
                var S = new r(this._fans[c].x, this._fans[c].y)
                if (R)
                  if (this._fans[c].index < 4) {
                    var P = new r(this._fans[c + 1].x, this._fans[c + 1].y)
                    ;((L = {}).width = this._model.timeScale().width()),
                      (L.height = this._source.priceScale().height()),
                      (L.p1 = e),
                      (L.p2 = S),
                      (L.p3 = e),
                      (L.p4 = P),
                      (L.color = this._fans[c].color),
                      (L.transparency = T),
                      (L.hittestOnBackground = !0),
                      (C = new s()).setData(L),
                      y.append(C)
                  } else if (this._fans[c].index > 4 && c > 0) {
                    var L
                    P = new r(this._fans[c - 1].x, this._fans[c - 1].y)
                    ;((L = {}).width = this._model.timeScale().width()),
                      (L.height = this._source.priceScale().height()),
                      (L.p1 = e),
                      (L.p2 = S),
                      (L.p3 = e),
                      (L.p4 = P),
                      (L.color = this._fans[c].color),
                      (L.transparency = T),
                      (L.hittestOnBackground = !0),
                      (C = new s()).setData(L),
                      y.append(C)
                  }
                var C,
                  M = {
                    points: [e, S],
                    width: this._model.timeScale().width(),
                    height: this._source.priceScale().height(),
                    color: this._fans[c].color,
                    linewidth: this._fans[c].linewidth,
                    linestyle: this._fans[c].linestyle,
                    extendleft: !1,
                    extendright: !0,
                    leftend: d.Normal,
                    rightend: d.Normal,
                  }
                if (
                  ((C = new o()).setData(M),
                  C.setHitTest(new l(l.MOVEPOINT, null, this._fans[c].index)),
                  y.append(C),
                  b.showLabels.value())
                ) {
                  var I = {
                    points: [S],
                    text: this._fans[c].label,
                    color: this._fans[c].color,
                    vertAlign: 'middle',
                    horzAlign: 'left',
                    font: b.font.value(),
                    offsetX: 0,
                    offsetY: 5,
                    fontsize: 12,
                  }
                  y.append(new a(I))
                }
              }
              this.addAnchors(y), (this._renderer = y)
            }
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    a6on: function (e, t, i) {
      'use strict'
      i.r(t)
      var r = i('Tmoa'),
        n = i('aB9a'),
        s = i('cPgM'),
        a = i('VdBB'),
        o = i('2hKl'),
        l = i('jFln'),
        h = i('pJOz'),
        d = i('a7Ha'),
        c = i('e9yB'),
        u = i('Zp/P')
      class _ extends s.ScaledPaneRenderer {
        constructor(e) {
          super(), (this._data = e || null)
        }
        setData(e) {
          this._data = e
        }
        hitTest(e, t) {
          const i = this._data
          if (null === i) return null
          if (4 === i.points.length) {
            const t = Object(u.interactionTolerance)().curve,
              [r, n, s, l] = i.points,
              h = l.subtract(r),
              d = s.subtract(h.scaled(0.25)),
              _ = s.add(h.scaled(0.25)),
              p = n.subtract(s),
              f = l.subtract(p.scaled(0.25)),
              g = l.add(p.scaled(0.25))
            if (Object(o.c)(s, r, d, e, t) || Object(o.a)(s, l, _, f, e, t) || Object(o.c)(l, n, g, e, t))
              return new a.HitTestResult(a.HitTestResult.MOVEPOINT)
            let v = Object(c.c)(e, t, i.extendLeftPoints)
            return null === v && (v = Object(c.c)(e, t, i.extendRightPoints)), v
          }
          return null
        }
        _drawImpl(e, t) {
          if (null === this._data) return
          ;(e.lineCap = 'butt'),
            (e.strokeStyle = this._data.color),
            (e.lineWidth = this._data.lineWidth),
            Object(l.setLineStyle)(e, this._data.lineStyle)
          const i = this._data.points[0],
            r = this._data.points[1]
          if (2 === this._data.points.length)
            e.beginPath(),
              e.moveTo(i.x, i.y),
              e.lineTo(r.x, r.y),
              e.stroke(),
              this._data.leftEnd === d.LineEnd.Arrow && Object(h.drawArrow)(r, i, e, e.lineWidth, t.pixelRatio),
              this._data.rightEnd === d.LineEnd.Arrow && Object(h.drawArrow)(i, r, e, e.lineWidth, t.pixelRatio)
          else {
            const n = this._data.points[2],
              s = this._data.points[3],
              a = s.subtract(i),
              o = n.subtract(a.scaled(0.25)),
              l = n.add(a.scaled(0.25)),
              u = r.subtract(n),
              _ = s.subtract(u.scaled(0.25)),
              p = s.add(u.scaled(0.25))
            this._data.fillBack &&
              this._data.points.length > 2 &&
              ((e.fillStyle = this._data.backColor),
              e.beginPath(),
              e.moveTo(i.x, i.y),
              e.quadraticCurveTo(o.x, o.y, n.x, n.y),
              e.bezierCurveTo(l.x, l.y, _.x, _.y, s.x, s.y),
              e.quadraticCurveTo(p.x, p.y, r.x, r.y),
              e.fill()),
              e.beginPath(),
              Object(c.b)(e, this._data.extendLeftPoints),
              e.moveTo(i.x, i.y),
              e.quadraticCurveTo(o.x, o.y, n.x, n.y),
              e.bezierCurveTo(l.x, l.y, _.x, _.y, s.x, s.y),
              e.quadraticCurveTo(p.x, p.y, r.x, r.y),
              Object(c.b)(e, this._data.extendRightPoints),
              e.stroke(),
              this._data.leftEnd === d.LineEnd.Arrow && Object(h.drawArrow)(o, i, e, e.lineWidth, t.pixelRatio),
              this._data.rightEnd === d.LineEnd.Arrow && Object(h.drawArrow)(p, r, e, e.lineWidth, t.pixelRatio)
          }
        }
      }
      var p = i('Zy3/'),
        f = i('4Ptp'),
        g = i('Eyy1')
      i.d(t, 'BezierCubicPaneView', function () {
        return v
      })
      class v extends n.LineSourcePaneView {
        constructor() {
          super(...arguments),
            (this._bezierCubicRenderer = new _()),
            (this._renderer = null),
            (this._extendedSegmentLeftCache = null),
            (this._extendedSegmentRightCache = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(e, t), this._renderer
        }
        _updateImpl(e, t) {
          if ((super._updateImpl(e, t), (this._renderer = null), this._points.length < 2)) return
          const i = this._source.properties().childs()
          let n = [],
            s = []
          if (4 === this._source.points().length) {
            const r = this._source.pointToScreenPoint(this._source.points()[0])[1],
              a = this._source.pointToScreenPoint(this._source.points()[1])[1],
              o = this._source.pointToScreenPoint(this._source.points()[2])[1],
              l = this._source.pointToScreenPoint(this._source.points()[3])[1],
              h = l.subtract(r),
              d = o.subtract(h.scaled(0.25)),
              c = a.subtract(o),
              u = l.add(c.scaled(0.25))
            i.extendLeft.value() && (n = this._extendSegmentLeft(o, r, d, t, e)),
              i.extendRight.value() && (s = this._extendSegmentRight(l, a, u, t, e))
          }
          const a = this._points.slice(),
            o = this._source.controlPoints()
          null !== o &&
            (a.push(this._source.pointToScreenPoint(o[0])[0]), a.push(this._source.pointToScreenPoint(o[1])[0]))
          const l = {
            points: a,
            color: i.linecolor.value(),
            lineWidth: i.linewidth.value(),
            lineStyle: i.linestyle.value(),
            leftEnd: i.leftEnd.value(),
            rightEnd: i.rightEnd.value(),
            fillBack: i.fillBackground.value(),
            backColor: Object(r.generateColor)(i.backgroundColor.value(), i.transparency.value()),
            extendLeftPoints: n,
            extendRightPoints: s,
          }
          this._bezierCubicRenderer.setData(l)
          const h = new p.CompositeRenderer()
          h.append(this._bezierCubicRenderer), this.addAnchors(h), (this._renderer = h)
        }
        _extendSegmentLeft(e, t, i, r, n) {
          return (
            Object(f.cacheIsValid)(this._extendedSegmentLeftCache, e, t, i, r, n) ||
              (this._extendedSegmentLeftCache = {
                p1: e,
                p2: t,
                p3: i,
                width: r,
                height: n,
                segment: Object(o.b)(e, t, i, r, n),
              }),
            Object(g.ensureNotNull)(this._extendedSegmentLeftCache).segment
          )
        }
        _extendSegmentRight(e, t, i, r, n) {
          return (
            Object(f.cacheIsValid)(this._extendedSegmentRightCache, e, t, i, r, n) ||
              (this._extendedSegmentRightCache = {
                p1: e,
                p2: t,
                p3: i,
                width: r,
                height: n,
                segment: Object(o.b)(e, t, i, r, n),
              }),
            Object(g.ensureNotNull)(this._extendedSegmentRightCache).segment
          )
        }
      }
    },
    aB9a: function (e, t, i) {
      'use strict'
      i.r(t)
      var r = i('aO4+'),
        n = i('VaSN'),
        s = i('VdBB'),
        a = i('vq8G'),
        o = i('f6yo'),
        l = i('gAom'),
        h = i('ogJP'),
        d = i('//lt'),
        c = i('Zp/P'),
        u = i('Eyy1')
      class _ extends r.Point {
        constructor(e, t, i, r) {
          super(e, t), (this.data = i), (this.square = r)
        }
      }
      function p(e, t, i, r) {
        const n = i + r / 2
        Object(l.drawRoundRect)(e, t.x - n, t.y - n, 2 * n, 2 * n, (i + r) / 2), e.closePath(), (e.lineWidth = r)
      }
      function f(e, t, i, r) {
        ;(e.globalAlpha = 0.2), p(e, t, i, r), e.stroke(), (e.globalAlpha = 1)
      }
      function g(e, t, i, r) {
        p(e, t, i - r, r), e.fill(), e.stroke()
      }
      function v(e, t, i, r) {
        ;(e.globalAlpha = 0.2),
          e.beginPath(),
          e.arc(t.x, t.y, i + r / 2, 0, 2 * Math.PI, !0),
          e.closePath(),
          (e.lineWidth = r),
          e.stroke(),
          (e.globalAlpha = 1)
      }
      function w(e, t, i, r) {
        e.beginPath(),
          e.arc(t.x, t.y, i - r / 2, 0, 2 * Math.PI, !0),
          e.closePath(),
          (e.lineWidth = r),
          e.fill(),
          e.stroke()
      }
      class x {
        constructor(e) {
          this._data = null != e ? e : null
        }
        setData(e) {
          this._data = e
        }
        draw(e, t) {
          if (null === this._data || !this._data.visible) return
          const i = [],
            r = [],
            n = [],
            s = []
          for (let e = 0; e < this._data.points.length; ++e) {
            const t = this._data.points[e],
              a = this._data.backgroundColors[e]
            t.square ? (i.push(t), r.push(a)) : (n.push(t), s.push(a))
          }
          i.length && ((e.strokeStyle = this._data.color), this._drawPoints(e, t.pixelRatio, i, r, g, f)),
            n.length && ((e.strokeStyle = this._data.color), this._drawPoints(e, t.pixelRatio, n, s, w, v))
        }
        hitTest(e) {
          if (null === this._data) return null
          const t = this._data.radius,
            i = Object(c.interactionTolerance)().anchor
          for (let r = 0; r < this._data.points.length; ++r) {
            const n = this._data.points[r]
            if (n.subtract(e).length() <= t + i) {
              const e =
                void 0 !== this._data.pointsCursorType ? this._data.pointsCursorType[r] : d.PaneCursorType.Default
              return new s.HitTestResult(this._data.hittestResult, { pointIndex: n.data, cursorType: e })
            }
          }
          return null
        }
        doesIntersectWithBox(e) {
          return null !== this._data && this._data.points.some(t => Object(o.pointInBox)(t, e))
        }
        _drawPoints(e, t, i, r, n, s) {
          const a = Object(u.ensureNotNull)(this._data),
            o = a.currentPoint,
            l = a.radius
          let d = Math.max(1, Math.floor((a.strokeWidth || 2) * t))
          a.selected && (d += Math.max(1, Math.floor(t / 2)))
          const p = Math.max(1, Math.floor(t))
          let f = Math.round(l * t * 2)
          f % 2 != p % 2 && (f += 1)
          const g = (p % 2) / 2,
            v = Object(c.interactionTolerance)().anchor
          for (let c = 0; c < i.length; ++c) {
            const u = i[c]
            e.fillStyle = r[c]
            if (!(Object(h.isInteger)(u.data) && a.linePointBeingEdited === u.data)) {
              n(e, new _(Math.round(u.x * t) + g, Math.round(u.y * t) + g, u.data, u.square), f / 2, d)
              if (u.subtract(o).length() <= l + v) {
                const i = Math.max(1, Math.floor(a.selectedStrokeWidth * t))
                let r = Math.round(l * t * 2)
                r % 2 != p % 2 && (r += 1)
                s(e, new _(Math.round(u.x * t) + g, Math.round(u.y * t) + g, u.data, u.square), r / 2, i)
              }
            }
          }
        }
      }
      function m(e, t) {
        const i = t.x - e.x,
          r = t.y - e.y,
          n = Math.abs(Math.atan2(i, r))
        return n > Math.PI / 4 && n < (3 * Math.PI) / 4
          ? d.PaneCursorType.VerticalResize
          : d.PaneCursorType.HorizontalResize
      }
      i.d(t, 'thirdPointCursorType', function () {
        return m
      }),
        i.d(t, 'LineSourcePaneView', function () {
          return y
        })
      class y {
        constructor(e, t) {
          ;(this._invalidated = !0),
            (this._points = []),
            (this._floatPoints = []),
            (this._middlePoint = null),
            (this._selectionRenderers = []),
            (this._lineAnchorRenderers = []),
            (this._source = e),
            (this._model = t)
        }
        priceToCoordinate(e) {
          const t = this._source.priceScale()
          if (null === t) return null
          const i = this._source.ownerSource(),
            r = null !== i ? i.firstValue() : null
          return null === r ? null : t.priceToCoordinate(e, r)
        }
        currentPoint() {
          const e = this._model.crossHairSource()
          return new r.Point(e.originX(), e.originY())
        }
        anchorColor() {
          return '#1E53E5'
        }
        isHoveredSource() {
          return this._source === this._model.hoveredSource()
        }
        isSelectedSource() {
          return this._model.selection().isSelected(this._source)
        }
        isBeingEdited() {
          return this._model.lineBeingEdited() === this._source
        }
        isEditMode() {
          return !this._model.isSnapshot()
        }
        areAnchorsVisible() {
          return ((this.isHoveredSource() && !this.isLocked()) || this.isSelectedSource()) && this.isEditMode()
        }
        update() {
          this._invalidated = !0
        }
        isLocked() {
          return Boolean(this._source.isLocked && this._source.isLocked())
        }
        addAnchors(e) {
          let t = this._points
          this._model.lineBeingCreated() === this._source && (t = t.slice(0, -1)),
            e.append(this.createLineAnchor({ points: t }, 0))
        }
        createLineAnchor(e, t) {
          if (this.isLocked()) {
            const i = this._getSelectionRenderer(t)
            return (
              i.setData({
                bgColors: this._lineAnchorColors(e.points),
                points: e.points,
                visible: this.areAnchorsVisible(),
                hittestResult: s.HitTestResult.REGULAR,
                barSpacing: this._model.timeScale().barSpacing(),
              }),
              i
            )
          }
          const i = Object(n.lastEventIsTouch)(),
            r = this._getLineAnchorRenderer(t)
          return (
            r.setData({
              ...e,
              color: this.anchorColor(),
              backgroundColors: this._lineAnchorColors(e.points),
              currentPoint: this.currentPoint(),
              linePointBeingEdited: this.isBeingEdited() ? this._model.linePointBeingEdited() : null,
              hittestResult: s.HitTestResult.CHANGEPOINT,
              radius: i ? 13 : 6,
              strokeWidth: i ? 2 : 1,
              selected: this.isSelectedSource(),
              selectedStrokeWidth: i ? 0 : 3,
              visible: this.areAnchorsVisible(),
            }),
            r
          )
        }
        _lineAnchorColors(e) {
          const t = Object(u.ensureNotNull)(this._model.paneForSource(this._source)).height()
          return e.map(e => this._model.backgroundColorAtYPercentFromTop(e.y / t))
        }
        _updateImpl(e, t) {
          ;(this._points = []), (this._floatPoints = [])
          if (this._model.timeScale().isEmpty()) return
          if (!this._validatePriceScale()) return
          const i = this._source.points()
          for (let e = 0; e < i.length; e++) {
            const t = i[e],
              r = this._source.pointToScreenPoint(t)
            if (!r) return
            const n = r[0]
            n.data = e
            const s = r[1]
            ;(s.data = e), this._floatPoints.push(n), this._points.push(s)
          }
          2 === this._points.length &&
            (this._middlePoint = this._source.calcMiddlePoint(this._points[0], this._points[1])),
            (this._invalidated = !1)
        }
        _validatePriceScale() {
          const e = this._source.priceScale()
          return null !== e && !e.isEmpty()
        }
        _getSource() {
          return this._source
        }
        _getPoints() {
          return this._points
        }
        _getModel() {
          return this._model
        }
        _height() {
          const e = this._source.priceScale()
          return null !== e ? e.height() : 0
        }
        _width() {
          return this._model.timeScale().width()
        }
        _getSelectionRenderer(e) {
          for (; this._selectionRenderers.length <= e; ) this._selectionRenderers.push(new a.SelectionRenderer())
          return this._selectionRenderers[e]
        }
        _getLineAnchorRenderer(e) {
          for (; this._lineAnchorRenderers.length <= e; ) this._lineAnchorRenderers.push(new x())
          return this._lineAnchorRenderers[e]
        }
      }
    },
    'am+t': function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('aB9a').LineSourcePaneView,
        s = i('VdBB').HitTestResult,
        a = i('Zy3/').CompositeRenderer,
        o = i('Tmoa'),
        l = i('cPgM').ScaledPaneRenderer
      class h extends l {
        constructor() {
          super(), (this._data = null)
        }
        setData(e) {
          this._data = e
        }
        _drawImpl(e) {
          null !== this._data &&
            ((e.strokeStyle = this._data.color),
            (e.lineWidth = this._data.linewidth),
            CanvasEx.setLineStyle(e, this._data.linestyle),
            e.save(),
            e.translate(this._data.point.x + 1, this._data.point.y),
            e.scale(this._data.width, this._data.height),
            e.beginPath(),
            e.arc(0.5, 0, 0.5, Math.PI, 0, !1),
            e.restore(),
            e.stroke(),
            this._data.fillBackground &&
              ((e.fillStyle = o.generateColor(this._data.backcolor, this._data.transparency)), e.fill()))
        }
        hitTest(e) {
          if (null === this._data || e.y > this._data.point.y) return null
          if (e.x < this._data.point.x || e.x > this._data.point.x + this._data.width) return null
          var t = new r(this._data.point.x + this._data.width / 2, this._data.point.y),
            i = e.subtract(t),
            n = this._data.height / this._data.width
          i.y /= n
          var a = i.length()
          return Math.abs(a - this._data.width / 2) < 3 ? new s(s.MOVEPOINT) : null
        }
      }
      t.TimeCyclesPaneView = class extends n {
        constructor(e, t) {
          super(e, t), (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), !(this._points.length < 2))) {
            var e = this._source.points(),
              t = e[0],
              i = e[1],
              n = Math.min(t.index, i.index),
              s = Math.max(t.index, i.index),
              o = s - n,
              l = this._points[0],
              d = this._points[1],
              c = Math.abs(l.x - d.x),
              u = new a(),
              _ = this._source.properties(),
              p = this._model.timeScale()
            if (0 !== o) {
              for (var f = Math.min(l.x, d.x), g = [], v = n; f > -c; v -= o) (f = p.indexToCoordinate(v)), g.push(f)
              f = Math.max(l.x, d.x)
              for (v = s; f < p.width(); v += o) (f = p.indexToCoordinate(v)), g.push(f)
              for (var w = 0; w < g.length; w++) {
                var x = {
                    point: new r(g[w], l.y),
                    width: c,
                    height: c,
                    color: _.linecolor.value(),
                    linewidth: _.linewidth.value(),
                    linestyle: _.linestyle.value(),
                    fillBackground: _.fillBackground.value(),
                    backcolor: _.backgroundColor.value(),
                    transparency: _.transparency.value(),
                  },
                  m = new h()
                m.setData(x), u.append(m)
              }
              this.addAnchors(u), (this._renderer = u)
            }
          }
        }
      }
    },
    amUF: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'CrossLinePaneView', function () {
          return l
        })
      var r = i('aB9a'),
        n = i('l4sv'),
        s = i('z+cS'),
        a = i('Zy3/'),
        o = i('VdBB')
      class l extends r.LineSourcePaneView {
        constructor(e, t) {
          super(e, t),
            (this._renderer = null),
            (this._horizLineRenderer = new n.HorizontalLineRenderer()),
            (this._vertLineRenderer = new s.VerticalLineRenderer()),
            this._horizLineRenderer.setHitTest(new o.HitTestResult(o.HitTestResult.MOVEPOINT))
        }
        update() {
          this._invalidated = !0
        }
        renderer() {
          return this._invalidated && (this._updateImpl(), (this._invalidated = !1)), this._renderer
        }
        _updateImpl() {
          super._updateImpl(), (this._renderer = null)
          const e = this._getPoints()
          if (0 === e.length) return
          const t = {
            color: this._getSource().lineColor(),
            linestyle: this._getSource().lineStyle(),
            linewidth: this._getSource().lineWidth(),
            x: e[0].x,
            y: e[0].y,
          }
          this._horizLineRenderer.setData(t), this._vertLineRenderer.setData(t)
          const i = new a.CompositeRenderer()
          i.append(this._horizLineRenderer), i.append(this._vertLineRenderer), this.addAnchors(i), (this._renderer = i)
        }
      }
    },
    amvX: function (e, t, i) {
      'use strict'
      i.d(t, 'a', function () {
        return o
      })
      var r = i('aO4+'),
        n = i('Tmoa'),
        s = i('VdBB'),
        a = i('cPgM')
      class o extends a.ScaledPaneRenderer {
        constructor() {
          super(), (this._data = null)
        }
        setData(e) {
          this._data = e
        }
        hitTest(e) {
          if (null === this._data) return null
          e = e.subtract(this._data.center)
          const t = this._data.edge.subtract(this._data.center),
            i = t.y / t.x
          e = new r.Point(e.x, e.y / i)
          let n = this._data.point.subtract(this._data.center)
          n = new r.Point(n.x, n.y / i)
          const a = n.length(),
            o = e.length()
          let l = this._data.prevPoint.subtract(this._data.center)
          l = new r.Point(l.x, l.y / i)
          const h = l.length()
          return Math.abs(o - a) < 5 && t.x * e.x >= 0 && t.y * e.y >= 0
            ? new s.HitTestResult(s.HitTestResult.MOVEPOINT)
            : this._data.fillBack && o >= h && o <= a && t.x * e.x >= 0 && t.y * e.y >= 0
            ? new s.HitTestResult(s.HitTestResult.MOVEPOINT_BACKGROUND)
            : null
        }
        _drawImpl(e) {
          if (null === this._data) return
          ;(e.lineCap = 'butt'),
            (e.strokeStyle = this._data.color),
            (e.lineWidth = this._data.linewidth),
            e.translate(this._data.center.x, this._data.center.y)
          const t = this._data.edge.subtract(this._data.center),
            i = t.y / t.x
          let s = this._data.point.subtract(this._data.center)
          s = new r.Point(s.x, s.y / i)
          let a = s.length(),
            o = this._data.prevPoint.subtract(this._data.center)
          o = new r.Point(o.x, o.y / i)
          let l = o.length()
          e.scale(1, i),
            this._data.fillBack &&
              (this._data.point.x < this._data.center.x && ((a = -a), (l = -l)),
              e.beginPath(),
              e.moveTo(l, 0),
              e.lineTo(a, 0),
              e.arcTo(a, a, 0, a, Math.abs(a)),
              e.lineTo(0, l),
              e.arcTo(l, l, l, 0, Math.abs(l)),
              (e.fillStyle = Object(n.generateColor)(this._data.color, this._data.transparency, !0)),
              e.fill()),
            e.beginPath(),
            this._data.point.x > this._data.center.x
              ? e.arc(0, 0, Math.abs(a), 0, Math.PI / 2, !1)
              : e.arc(0, 0, Math.abs(a), -Math.PI / 2, -Math.PI, !0),
            e.scale(1, 1 / i),
            e.stroke()
        }
      }
    },
    bFMU: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'ABCDPaneView', function () {
          return u
        })
      var r = i('8Uy/'),
        n = i('Zy3/'),
        s = i('zXvd'),
        a = i('pJOz'),
        o = i('qgcf'),
        l = i('a7Ha'),
        h = i('BCbF'),
        d = i('VdBB'),
        c = i('aB9a')
      class u extends c.LineSourcePaneView {
        constructor(e, t) {
          super(e, t),
            (this._numericFormatter = new s.NumericFormatter()),
            (this._abRetracementTrend = new a.TrendLineRenderer()),
            (this._cdRetracementTrend = new a.TrendLineRenderer()),
            (this._polylineRenderer = new h.PolygonRenderer(new d.HitTestResult(d.HitTestResult.MOVEPOINT))),
            (this._abLabelRenderer = new o.TextRenderer()),
            (this._cdLabelRenderer = new o.TextRenderer()),
            (this._textRendererALabel = new o.TextRenderer()),
            (this._textRendererBLabel = new o.TextRenderer()),
            (this._textRendererCLabel = new o.TextRenderer()),
            (this._textRendererDLabel = new o.TextRenderer()),
            (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if ((super._updateImpl(), this._points.length < 2)) return void (this._renderer = null)
          const e = this._source.properties().childs(),
            t = new n.CompositeRenderer(),
            i = (t, i) => ({
              points: [t],
              text: i,
              color: e.textcolor.value(),
              vertAlign: 'middle',
              horzAlign: 'center',
              font: e.font.value(),
              offsetX: 0,
              offsetY: 0,
              bold: e.bold && e.bold.value(),
              italic: e.italic && e.italic.value(),
              fontsize: e.fontsize.value(),
              backgroundColor: e.color.value(),
              backgroundRoundRect: 4,
            }),
            s = (t, i) => ({
              points: [t, i],
              color: e.color.value(),
              linewidth: e.linewidth.value(),
              linestyle: r.LINESTYLE_DOTTED,
              extendleft: !1,
              extendright: !1,
              leftend: l.LineEnd.Normal,
              rightend: l.LineEnd.Normal,
            }),
            [a, o, h, d] = this._points,
            c = {
              points: this._points,
              color: e.color.value(),
              linewidth: e.linewidth.value(),
              linestyle: r.LINESTYLE_SOLID,
              fillBackground: !1,
              filled: !1,
              backcolor: 'rgba(0, 0, 0, 0)',
            }
          this._polylineRenderer.setData(c), t.append(this._polylineRenderer)
          const u = i(a, 'A')
          o.y > a.y ? ((u.vertAlign = 'bottom'), (u.offsetY = 5)) : ((u.vertAlign = 'top'), (u.offsetY = 5)),
            this._textRendererALabel.setData(u),
            t.append(this._textRendererALabel)
          const _ = i(o, 'B')
          if (
            (o.y < a.y ? ((_.vertAlign = 'bottom'), (_.offsetY = 5)) : ((_.vertAlign = 'top'), (_.offsetY = 5)),
            this._textRendererBLabel.setData(_),
            t.append(this._textRendererBLabel),
            this._points.length > 2)
          ) {
            const e = i(h, 'C')
            h.y < o.y ? ((e.vertAlign = 'bottom'), (e.offsetY = 5)) : ((e.vertAlign = 'top'), (e.offsetY = 5)),
              this._textRendererCLabel.setData(e),
              t.append(this._textRendererCLabel)
          }
          if (this._points.length > 3) {
            const e = i(d, 'D')
            d.y < h.y ? ((e.vertAlign = 'bottom'), (e.offsetY = 5)) : ((e.vertAlign = 'top'), (e.offsetY = 5)),
              this._textRendererDLabel.setData(e),
              t.append(this._textRendererDLabel)
          }
          if (this._points.length >= 3) {
            this._abRetracementTrend.setData(s(a, h)), t.append(this._abRetracementTrend)
            const e = a.add(h).scaled(0.5),
              [r, n, o] = this._source.points(),
              l = Math.round(1e3 * Math.abs((o.price - n.price) / (n.price - r.price))) / 1e3,
              d = i(e, this._numericFormatter.format(l))
            this._abLabelRenderer.setData(d), t.append(this._abLabelRenderer)
          }
          if (this._points.length >= 4) {
            this._cdRetracementTrend.setData(s(o, d)), t.append(this._cdRetracementTrend)
            const e = o.add(d).scaled(0.5),
              [, r, n, a] = this._source.points(),
              l = Math.round(1e3 * Math.abs((a.price - n.price) / (n.price - r.price))) / 1e3,
              h = i(e, this._numericFormatter.format(l))
            this._cdLabelRenderer.setData(h), t.append(this._cdLabelRenderer)
          }
          this.addAnchors(t), (this._renderer = t)
        }
      }
    },
    bcXK: function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('Hr11'),
        s = i('pJOz').TrendLineRenderer,
        a = i('cjIn').PaneRendererCachedImage,
        o = i('VdBB').HitTestResult,
        l = i('Zy3/').CompositeRenderer,
        h = i('Tmoa'),
        d = i('a7Ha').LineEnd,
        c = i('cPgM').ScaledPaneRenderer,
        u = i('NCfL').LineToolPaneViewWithLevelledTextCache
      class _ extends c {
        constructor(e, t, i) {
          super(),
            (this._data = e),
            (this._hittest = t || new o(o.MOVEPOINT)),
            (this._backHittest = i || new o(o.MOVEPOINT_BACKGROUND))
        }
        _drawImpl(e) {
          ;(e.lineCap = 'butt'),
            (e.strokeStyle = this._data.color),
            (e.lineWidth = this._data.linewidth),
            e.translate(this._data.center.x, this._data.center.y),
            e.beginPath(),
            this._data.fullCircles
              ? e.arc(0, 0, this._data.radius, 2 * Math.PI, 0, !1)
              : this._data.dir > 0
              ? e.arc(0, 0, this._data.radius, 0, Math.PI, !1)
              : e.arc(0, 0, this._data.radius, Math.PI, 0, !1),
            e.stroke(),
            this._data.fillBackground &&
              (this._data.radius2 &&
                (this._data.fullCircles
                  ? e.arc(0, 0, this._data.radius2, 2 * Math.PI, 0, !0)
                  : this._data.dir > 0
                  ? e.arc(0, 0, this._data.radius2, Math.PI, 0, !0)
                  : e.arc(0, 0, this._data.radius2, 0, Math.PI, !0)),
              (e.fillStyle = h.generateColor(this._data.color, this._data.transparency, !0)),
              e.fill())
        }
        hitTest(e) {
          if (n.sign(e.y - this._data.center.y) !== this._data.dir && !this._data.fullCircles) return null
          var t = e.subtract(this._data.center).length()
          return Math.abs(t - this._data.radius) < 3
            ? this._hittest
            : this._data.hittestOnBackground && Math.abs(t) <= this._data.radius + 3
            ? this._backHittest
            : null
        }
      }
      t.FibSpeedResistanceArcsPaneView = class extends u {
        constructor(e, t) {
          super(e, t), (this._rendererCache = {}), (this._trendLineRenderer = new s()), (this._renderer = null)
        }
        getCacheRects(e, t) {
          super.getCacheRects(e, t)
          var i = this._cacheState.preparedCells.cells[this._levels[t].index - 1]
          if (i) {
            var r = this._levels[t],
              n = {
                left: i.left,
                top: this._cache.topByRow(this._cacheState.row),
                width: i.width,
                height: this._cache.rowHeight(this._cacheState.row),
              }
            return {
              cacheRect: n,
              targetRect: {
                left: Math.round(r.labelPoint.x - n.width),
                top: Math.round(r.labelPoint.y - n.height / 2),
                width: i.width,
                height: n.height,
              },
            }
          }
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            (this._renderer = null),
            !(this._floatPoints.length < 2) &&
              this._source.priceScale() &&
              !this._source.priceScale().isEmpty() &&
              !this._model.timeScale().isEmpty())
          ) {
            var e = this._floatPoints[0],
              t = this._floatPoints[1],
              i = e.subtract(t).length()
            this._levels = []
            for (var s = this._source.properties(), h = this._source.levelsCount(), c = 1; c <= h; c++) {
              var u = s['level' + c]
              if (u.visible.value()) {
                var p = u.coeff.value(),
                  f = u.color.value(),
                  g = t.subtract(e).length() * p,
                  v = n.sign(t.y - e.y),
                  w = new r(e.x, e.y + v * i * p)
                this._levels.push({
                  color: f,
                  radius: g,
                  dir: v,
                  labelPoint: w,
                  linewidth: u.linewidth.value(),
                  linestyle: u.linestyle.value(),
                  index: c,
                })
              }
            }
            if (!(this._floatPoints.length < 2)) {
              var x = new l(),
                m = ((e = this._floatPoints[0]), (s = this._source.properties()).fillBackground.value()),
                y = s.transparency.value()
              for (c = 0; c < this._levels.length; c++) {
                var b = this._levels[c],
                  R = {}
                ;(R.center = e),
                  (R.color = b.color),
                  (R.linewidth = b.linewidth),
                  (R.radius = b.radius),
                  (R.dir = b.dir),
                  (R.transparency = y),
                  (R.fillBackground = m),
                  (R.hittestOnBackground = !0),
                  (R.fullCircles = s.fullCircles.value()),
                  c > 0 && (R.radius2 = this._levels[c - 1].radius)
                var T = new o(o.MOVEPOINT, null, b.index)
                if ((x.append(new _(R, T)), s.showCoeffs.value())) {
                  var S = new a(this, c)
                  x.append(S)
                }
              }
              if (s.trendline.visible.value()) {
                var P = {
                  points: [this._floatPoints[0], this._floatPoints[1]],
                  width: this._model.timeScale().width(),
                  height: this._source.priceScale().height(),
                  color: s.trendline.color.value(),
                  linewidth: s.trendline.linewidth.value(),
                  linestyle: s.trendline.linestyle.value(),
                  extendleft: !1,
                  extendright: !1,
                  leftend: d.Normal,
                  rightend: d.Normal,
                }
                this._trendLineRenderer.setData(P), x.append(this._trendLineRenderer)
              }
              this.addAnchors(x), (this._renderer = x)
            }
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    c6sA: function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('aB9a').LineSourcePaneView,
        s = i('z+cS').VerticalLineRenderer,
        a = i('IjC5').RectangleRenderer,
        o = i('pJOz').TrendLineRenderer,
        l = i('VdBB').HitTestResult,
        h = i('gyZD').PaneRendererLine,
        d = i('Zy3/').CompositeRenderer,
        c = i('Tmoa'),
        u = i('Ye2/').LineToolBarsPatternMode,
        _ = i('a7Ha').LineEnd
      t.BarsPatternPaneView = class extends n {
        constructor(e, t) {
          super(e, t),
            (this._vertLineRenderer1 = new s()),
            (this._vertLineRenderer2 = new s()),
            (this._medianRenderer = new o()),
            (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            (this._renderer = null),
            !(!this._source.priceScale() || this._source.priceScale().isEmpty() || this._points.length < 2))
          ) {
            if (this._source._pattern && this._source._pattern.length > 0 && 2 === this._source.points().length) {
              var e = this._source.priceScale(),
                t = this._source.firstPatternPrice(),
                i = this._source.pressCoeff(),
                n = this._source.ownerSource().firstValue(),
                s = e.priceToCoordinate(t, n),
                o = function (r) {
                  var a = (r - t) * i + t
                  return e.priceToCoordinate(a, n) - s
                },
                p = parseInt(this._source.properties().mode.value()),
                f = this._source.points()[0].index > this._source.points()[1].index ? 1 : 0,
                g = this._points[f],
                v = g.x,
                w = Math.abs((this._points[0].x - this._points[1].x) / (this._source._pattern.length - 1)),
                x = {
                  0: function (e) {
                    return { high: o(e[TradingView.HIGH_PLOT]), low: o(e[TradingView.LOW_PLOT]) }
                  },
                  1: function (e, t) {
                    return new r(v + t * w, o(e[TradingView.CLOSE_PLOT]) + g.y)
                  },
                  2: function (e) {
                    return { open: o(e[TradingView.OPEN_PLOT]), close: o(e[TradingView.CLOSE_PLOT]) }
                  },
                  3: function (e, t) {
                    return new r(v + t * w, o(e[TradingView.OPEN_PLOT]) + g.y)
                  },
                  4: function (e, t) {
                    return new r(v + t * w, o(e[TradingView.HIGH_PLOT]) + g.y)
                  },
                  5: function (e, t) {
                    return new r(v + t * w, o(e[TradingView.LOW_PLOT]) + g.y)
                  },
                  6: function (e, t) {
                    return new r(v + t * w, o((e[TradingView.HIGH_PLOT] + e[TradingView.LOW_PLOT]) / 2) + g.y)
                  },
                }
              this._pattern = this._source._pattern.map(x[p])
            } else delete this._pattern
            if (this._pattern && 2 === this._source.points().length) {
              var m =
                this._source.points()[0].index < this._source.points()[1].index ? this._points[0] : this._points[1]
              if (!m) return void (this._renderer = new d())
              ;(p = parseInt(this._source.properties().mode.value(), 10)),
                (w = Math.abs((this._points[0].x - this._points[1].x) / (this._pattern.length - 1)))
              if (p === u.Bars || p === u.OpenClose) {
                for (
                  var y = new d(), b = p === u.Bars ? ['high', 'low'] : ['open', 'close'], R = b[0], T = b[1], S = 0;
                  S < this._pattern.length;
                  S++
                ) {
                  var P = Math.round(m.x + S * w + 0.5),
                    L = m.y + Math.round(this._pattern[S][R]),
                    C = m.y + Math.round(this._pattern[S][T])
                  ;((I = {}).points = [new r(P - 1, L), new r(P + 1, C)]),
                    (I.color = this._source.properties().color.value()),
                    (I.linewidth = 1),
                    (I.backcolor = this._source.properties().color.value()),
                    (I.fillBackground = !0),
                    (I.transparency = 10),
                    (I.extendLeft = !1),
                    (I.extendRight = !1)
                  var M = new a()
                  M.setData(I), y.append(M)
                }
                y.append(this.createLineAnchor({ points: this._points }, 0)), (this._renderer = y)
              } else {
                var I
                y = new d()
                ;((I = {}).barSpacing = w),
                  (I.items = this._pattern),
                  (I.histogramBase = 0),
                  (I.lineIndex = 0),
                  (I.lineColor = c.generateColor(this._source.properties().color.value(), 10)),
                  (I.lineStyle = CanvasEx.LINESTYLE_SOLID),
                  (I.lineWidth = 2),
                  (I.hittest = new l(l.MOVEPOINT)),
                  y.append(new h(I)),
                  y.append(this.createLineAnchor({ points: this._points }, 1)),
                  (this._renderer = y)
              }
            } else {
              y = new d()
              if (this._points.length < 2) return void (this._renderer = y)
              var O = this._model.timeScale().width(),
                N = this._source.priceScale().height(),
                D = this._points[0],
                B = this._points[1],
                k = {}
              ;(k.width = O),
                (k.height = N),
                (k.x = D.x),
                (k.color = '#808080'),
                (k.linewidth = 1),
                (k.linestyle = CanvasEx.LINESTYLE_SOLID),
                this._vertLineRenderer1.setData(k),
                y.append(this._vertLineRenderer1)
              var A = {}
              ;(A.width = O),
                (A.height = N),
                (A.x = B.x),
                (A.color = '#808080'),
                (A.linewidth = 1),
                (A.linestyle = CanvasEx.LINESTYLE_SOLID),
                this._vertLineRenderer2.setData(A),
                y.append(this._vertLineRenderer2)
              var E = {
                points: [D, B],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: '#808080',
                linewidth: 1,
                linestyle: CanvasEx.LINESTYLE_SOLID,
                extendleft: !1,
                extendright: !1,
                leftend: _.Normal,
                rightend: _.Normal,
              }
              this._medianRenderer.setData(E), y.append(this._medianRenderer), (this._renderer = y)
            }
          }
        }
      }
    },
    'cT+B': function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('aB9a').LineSourcePaneView,
        s = i('pJOz').TrendLineRenderer,
        a = i('2trc').ChannelRenderer,
        o = i('VdBB').HitTestResult,
        l = i('Zy3/').CompositeRenderer,
        h = i('a7Ha').LineEnd
      class d extends n {
        constructor(e, t) {
          super(e, t), (this._medianRenderer = new s()), (this._sideRenderer = new s()), (this._renderer = null)
        }
        _updateImpl() {
          super._updateImpl(),
            (this._renderer = null),
            0 !== this._floatPoints.length &&
              (3 === this._floatPoints.length
                ? ((this._medianPoint = this._floatPoints[1].add(this._floatPoints[2]).scaled(0.5)),
                  (this._medianPoint.data = 3))
                : 2 === this._floatPoints.length
                ? ((this._medianPoint = this._floatPoints[1]), (this._medianPoint.data = 3))
                : ((this._medianPoint = this._floatPoints[0]), (this._medianPoint.data = 3)),
              this._updateRenderer())
        }
        _updateRenderer() {
          if (!(this._floatPoints.length < 2) && this._medianPoint) {
            var e = this._source.properties(),
              t = new l(),
              i = {
                points: [this._floatPoints[0], this._medianPoint],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: e.median.color.value(),
                linewidth: e.median.linewidth.value(),
                linestyle: e.median.linestyle.value(),
                extendleft: e.extendLines.value(),
                extendright: !0,
                leftend: h.Normal,
                rightend: h.Normal,
              }
            if ((this._medianRenderer.setData(i), t.append(this._medianRenderer), this._floatPoints.length < 3))
              return this.addAnchors(t), void (this._renderer = t)
            var r = {
              points: [this._floatPoints[1], this._floatPoints[2]],
              width: this._model.timeScale().width(),
              height: this._source.priceScale().height(),
              color: e.median.color.value(),
              linewidth: e.median.linewidth.value(),
              linestyle: e.median.linestyle.value(),
              extendleft: !1,
              extendright: !1,
              leftend: h.Normal,
              rightend: h.Normal,
            }
            this._sideRenderer.setData(r), t.append(this._sideRenderer)
            for (
              var n = this._floatPoints[2].subtract(this._floatPoints[1]).scaled(0.5),
                d = this._medianPoint.subtract(this._floatPoints[0]),
                c = 0,
                u = e.fillBackground.value(),
                _ = e.transparency.value(),
                p = 0;
              p <= 8;
              p++
            ) {
              var f = e['level' + p]
              if (f.visible.value()) {
                var g,
                  v,
                  w = this._medianPoint.addScaled(n, f.coeff.value()),
                  x = w.add(d),
                  m = this._medianPoint.addScaled(n, -f.coeff.value()),
                  y = m.add(d)
                if (u)
                  ((g = {}).p1 = w),
                    (g.p2 = x),
                    (g.p3 = this._medianPoint.addScaled(n, c)),
                    (g.p4 = g.p3.add(d)),
                    (g.color = f.color.value()),
                    (g.width = this._model.timeScale().width()),
                    (g.height = this._source.priceScale().height()),
                    (g.transparency = _),
                    (g.hittestOnBackground = !0),
                    (g.extendLeft = e.extendLines.value()),
                    (v = new a()).setData(g),
                    t.append(v),
                    ((g = {}).p1 = m),
                    (g.p2 = y),
                    (g.p3 = this._medianPoint.addScaled(n, -c)),
                    (g.p4 = g.p3.add(d)),
                    (g.color = f.color.value()),
                    (g.width = this._model.timeScale().width()),
                    (g.height = this._source.priceScale().height()),
                    (g.transparency = _),
                    (g.hittestOnBackground = !0),
                    (g.extendLeft = e.extendLines.value()),
                    (v = new a()).setData(g),
                    t.append(v)
                c = f.coeff.value()
                var b = {
                    points: [w, x],
                    width: this._model.timeScale().width(),
                    height: this._source.priceScale().height(),
                    color: f.color.value(),
                    linewidth: f.linewidth.value(),
                    linestyle: f.linestyle.value(),
                    extendleft: e.extendLines.value(),
                    extendright: !0,
                    leftend: h.Normal,
                    rightend: h.Normal,
                  },
                  R = new s()
                R.setData(b), R.setHitTest(new o(o.MOVEPOINT, null, p)), t.append(R)
                var T = {
                    points: [m, y],
                    width: this._model.timeScale().width(),
                    height: this._source.priceScale().height(),
                    color: f.color.value(),
                    linewidth: f.linewidth.value(),
                    linestyle: f.linestyle.value(),
                    extendleft: e.extendLines.value(),
                    extendright: !0,
                    leftend: h.Normal,
                    rightend: h.Normal,
                  },
                  S = new s()
                S.setData(T), S.setHitTest(new o(o.MOVEPOINT, null, p)), t.append(S)
              }
            }
            this.addAnchors(t), (this._renderer = t)
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
      class c extends d {
        constructor(e, t) {
          super(e, t), (this._backSideRenderer = new s())
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateRenderer() {
          if (!(this._floatPoints.length < 2)) {
            this._calcMofifiedBase()
            var e = this._source.properties(),
              t = new l(),
              i = {
                points: [this._floatPoints[0], this._floatPoints[1]],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: e.median.color.value(),
                linewidth: e.median.linewidth.value(),
                linestyle: e.median.linestyle.value(),
                extendleft: !1,
                extendright: !1,
                leftend: h.Normal,
                rightend: h.Normal,
              }
            if (
              (this._backSideRenderer.setData(i),
              t.append(this._backSideRenderer),
              !this._medianPoint || !this._modifiedBase)
            )
              return this.addAnchors(t), void (this._renderer = t)
            var r = {
              points: [this._modifiedBase, this._medianPoint],
              width: this._model.timeScale().width(),
              height: this._source.priceScale().height(),
              color: e.median.color.value(),
              linewidth: e.median.linewidth.value(),
              linestyle: e.median.linestyle.value(),
              extendleft: e.extendLines.value(),
              extendright: !0,
              leftend: h.Normal,
              rightend: h.Normal,
            }
            if ((this._medianRenderer.setData(r), t.append(this._medianRenderer), this._floatPoints.length < 3))
              return this.addAnchors(t), void (this._renderer = t)
            var n = {
              points: [this._floatPoints[1], this._floatPoints[2]],
              width: this._model.timeScale().width(),
              height: this._source.priceScale().height(),
              color: e.median.color.value(),
              linewidth: e.median.linewidth.value(),
              linestyle: e.median.linestyle.value(),
              extendleft: !1,
              extendright: !1,
              leftend: h.Normal,
              rightend: h.Normal,
            }
            this._sideRenderer.setData(n), t.append(this._sideRenderer)
            for (
              var d = this._floatPoints[2].subtract(this._floatPoints[1]).scaled(0.5),
                c = this._medianPoint.subtract(this._modifiedBase),
                u = 0,
                _ = e.fillBackground.value(),
                p = e.transparency.value(),
                f = 0;
              f <= 8;
              f++
            ) {
              var g = e['level' + f]
              if (g.visible.value()) {
                var v = this._medianPoint.addScaled(d, g.coeff.value()),
                  w = v.add(c),
                  x = this._medianPoint.addScaled(d, -g.coeff.value()),
                  m = x.add(c)
                if (_)
                  ((i = {}).p1 = v),
                    (i.p2 = w),
                    (i.p3 = this._medianPoint.addScaled(d, u)),
                    (i.p4 = i.p3.add(c)),
                    (i.color = g.color.value()),
                    (i.width = this._model.timeScale().width()),
                    (i.height = this._source.priceScale().height()),
                    (i.transparency = p),
                    (i.hittestOnBackground = !0),
                    (i.extendLeft = e.extendLines.value()),
                    (R = new a()).setData(i),
                    t.append(R),
                    ((i = {}).p1 = x),
                    (i.p2 = m),
                    (i.p3 = this._medianPoint.addScaled(d, -u)),
                    (i.p4 = i.p3.add(c)),
                    (i.color = g.color.value()),
                    (i.width = this._model.timeScale().width()),
                    (i.height = this._source.priceScale().height()),
                    (i.transparency = p),
                    (i.hittestOnBackground = !0),
                    (i.extendLeft = e.extendLines.value()),
                    (R = new a()).setData(i),
                    t.append(R)
                u = g.coeff.value()
                var y = {
                    points: [v, w],
                    width: this._model.timeScale().width(),
                    height: this._source.priceScale().height(),
                    color: g.color.value(),
                    linewidth: g.linewidth.value(),
                    linestyle: g.linestyle.value(),
                    extendleft: e.extendLines.value(),
                    extendright: !0,
                    leftend: h.Normal,
                    rightend: h.Normal,
                  },
                  b = new s()
                b.setData(y), b.setHitTest(new o(o.MOVEPOINT, null, f)), t.append(b)
                var R,
                  T = {
                    points: [x, m],
                    width: this._model.timeScale().width(),
                    height: this._source.priceScale().height(),
                    color: g.color.value(),
                    linewidth: g.linewidth.value(),
                    linestyle: g.linestyle.value(),
                    extendleft: e.extendLines.value(),
                    extendright: !0,
                    leftend: h.Normal,
                    rightend: h.Normal,
                  }
                ;(R = new s()).setData(T), R.setHitTest(new o(o.MOVEPOINT, null, f)), t.append(R)
              }
            }
            this.addAnchors(t), (this._renderer = t)
          }
        }
        _calcMofifiedBase() {
          this._floatPoints.length > 1 &&
            (this._modifiedBase = this._floatPoints[0].add(this._floatPoints[1]).scaled(0.5))
        }
      }
      ;(t.PitchforkLinePaneView = d),
        (t.SchiffPitchforkLinePaneView = c),
        (t.SchiffPitchfork2LinePaneView = class extends c {
          _calcMofifiedBase() {
            if (this._floatPoints.length > 2) {
              var e = this._floatPoints[0].x,
                t = 0.5 * (this._floatPoints[0].y + this._floatPoints[1].y),
                i = new r(e, t)
              this._modifiedBase = i
            }
          }
        }),
        (t.InsidePitchforkLinePaneView = class extends d {
          constructor(e, t) {
            super(e, t), (this._backSideRenderer = new s()), (this._centerRenderer = new s())
          }
          _updateRenderer() {
            if (
              (this._floatPoints.length > 1 &&
                (this._modifiedBase = this._floatPoints[0].add(this._floatPoints[1]).scaled(0.5)),
              !(this._floatPoints.length < 2))
            ) {
              var e = new l()
              if (this._medianPoint && this._modifiedBase) {
                var t = this._source.properties()
                if (3 === this._floatPoints.length) {
                  var i = {
                    points: [this._modifiedBase, this._floatPoints[2]],
                    width: this._model.timeScale().width(),
                    height: this._source.priceScale().height(),
                    color: t.median.color.value(),
                    linewidth: t.median.linewidth.value(),
                    linestyle: t.median.linestyle.value(),
                    extendleft: !1,
                    extendright: !1,
                    leftend: h.Normal,
                    rightend: h.Normal,
                  }
                  this._medianRenderer.setData(i), e.append(this._medianRenderer)
                }
                var r = {
                  points: [this._floatPoints[0], this._floatPoints[1]],
                  width: this._model.timeScale().width(),
                  height: this._source.priceScale().height(),
                  color: t.median.color.value(),
                  linewidth: t.median.linewidth.value(),
                  linestyle: t.median.linestyle.value(),
                  extendleft: !1,
                  extendright: !1,
                  leftend: h.Normal,
                  rightend: h.Normal,
                }
                if ((this._backSideRenderer.setData(r), e.append(this._backSideRenderer), this._floatPoints.length < 3))
                  return this.addAnchors(e), void (this._renderer = e)
                var n = {
                  points: [this._floatPoints[1], this._floatPoints[2]],
                  width: this._model.timeScale().width(),
                  height: this._source.priceScale().height(),
                  color: t.median.color.value(),
                  linewidth: t.median.linewidth.value(),
                  linestyle: t.median.linestyle.value(),
                  extendleft: !1,
                  extendright: !1,
                  leftend: h.Normal,
                  rightend: h.Normal,
                }
                this._sideRenderer.setData(n), e.append(this._sideRenderer)
                var d = this._floatPoints[2].subtract(this._floatPoints[1]).scaled(0.5),
                  c = this._floatPoints[2].subtract(this._modifiedBase),
                  u = 0,
                  _ = t.fillBackground.value(),
                  p = t.transparency.value(),
                  f = {
                    points: [this._medianPoint, this._medianPoint.add(c)],
                    width: this._model.timeScale().width(),
                    height: this._source.priceScale().height(),
                    color: t.median.color.value(),
                    linewidth: t.median.linewidth.value(),
                    linestyle: t.median.linestyle.value(),
                    extendleft: t.extendLines.value(),
                    extendright: !0,
                    leftend: h.Normal,
                    rightend: h.Normal,
                  }
                this._centerRenderer.setData(f), e.append(this._centerRenderer)
                for (var g = 0; g <= 8; g++) {
                  var v = t['level' + g]
                  if (v.visible.value()) {
                    var w = this._medianPoint.addScaled(d, v.coeff.value()),
                      x = w.add(c),
                      m = this._medianPoint.addScaled(d, -v.coeff.value()),
                      y = m.add(c)
                    if (_)
                      ((r = {}).p1 = w),
                        (r.p2 = x),
                        (r.p3 = this._medianPoint.addScaled(d, u)),
                        (r.p4 = r.p3.add(c)),
                        (r.color = v.color.value()),
                        (r.width = this._model.timeScale().width()),
                        (r.height = this._source.priceScale().height()),
                        (r.transparency = p),
                        (r.hittestOnBackground = !0),
                        (r.extendLeft = t.extendLines.value()),
                        (T = new a()).setData(r),
                        e.append(T),
                        ((r = {}).p1 = m),
                        (r.p2 = y),
                        (r.p3 = this._medianPoint.addScaled(d, -u)),
                        (r.p4 = r.p3.add(c)),
                        (r.color = v.color.value()),
                        (r.width = this._model.timeScale().width()),
                        (r.height = this._source.priceScale().height()),
                        (r.transparency = p),
                        (r.hittestOnBackground = !0),
                        (r.extendLeft = t.extendLines.value()),
                        (T = new a()).setData(r),
                        e.append(T)
                    u = v.coeff.value()
                    var b = {
                        points: [w, x],
                        width: this._model.timeScale().width(),
                        height: this._source.priceScale().height(),
                        color: v.color.value(),
                        linewidth: v.linewidth.value(),
                        linestyle: v.linestyle.value(),
                        extendleft: t.extendLines.value(),
                        extendright: !0,
                        leftend: h.Normal,
                        rightend: h.Normal,
                      },
                      R = new s()
                    R.setData(b), R.setHitTest(new o(o.MOVEPOINT, null, g)), e.append(R)
                    var T,
                      S = {
                        points: [m, y],
                        width: this._model.timeScale().width(),
                        height: this._source.priceScale().height(),
                        color: v.color.value(),
                        linewidth: v.linewidth.value(),
                        linestyle: v.linestyle.value(),
                        extendleft: t.extendLines.value(),
                        extendright: !0,
                        leftend: h.Normal,
                        rightend: h.Normal,
                      }
                    ;(T = new s()).setData(S), T.setHitTest(new o(o.MOVEPOINT, null, g)), e.append(T)
                  }
                }
                this.addAnchors(e), (this._renderer = e)
              } else this.addAnchors(e)
            }
          }
          _updateImpl() {
            super._updateImpl()
          }
          renderer(e, t) {
            return this._invalidated && this._updateImpl(), this._renderer
          }
        })
    },
    cjIn: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'PaneRendererCachedImage', function () {
          return a
        })
      var r = i('aO4+'),
        n = i('f6yo'),
        s = i('VdBB')
      class a {
        constructor(e, t) {
          ;(this._cacheRect = null), (this._targetRect = null), (this._cacheProvider = e), (this._index = t)
        }
        draw(e, t) {
          const i = this._cacheProvider.getCacheRects(t, this._index)
          if (null === i) return (this._cacheRect = null), void (this._targetRect = null)
          if (
            ((this._cacheRect = i.cacheRect),
            (this._targetRect = i.targetRect),
            0 === this._cacheRect.width ||
              0 === this._cacheRect.height ||
              0 === this._targetRect.width ||
              0 === this._targetRect.height)
          )
            return
          e.save(), e.setTransform(1, 0, 0, 1, 0, 0)
          const r = t.pixelRatio,
            n = this._cacheProvider.getCacheCanvas(t)
          e.drawImage(
            n,
            Math.round(this._cacheRect.left * r),
            Math.round(this._cacheRect.top * r),
            this._cacheRect.width * r,
            this._cacheRect.height * r,
            Math.round(this._targetRect.left * r),
            Math.round(this._targetRect.top * r),
            this._targetRect.width * r,
            this._targetRect.height * r,
          ),
            e.restore()
        }
        hitTest(e) {
          if (null === this._targetRect) return null
          const t = new r.Point(this._targetRect.left, this._targetRect.top),
            i = t.add(new r.Point(this._targetRect.width, this._targetRect.height))
          return Object(n.pointInBox)(e, Object(r.box)(t, i)) ? new s.HitTestResult(s.HitTestResult.REGULAR) : null
        }
      }
    },
    'ckl+': function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'HorzLinePaneView', function () {
          return c
        })
      var r = i('aO4+'),
        n = i('VdBB'),
        s = i('//lt'),
        a = i('qgcf'),
        o = i('l4sv'),
        l = i('Zy3/'),
        h = i('aB9a')
      const d = [s.PaneCursorType.VerticalResize]
      class c extends h.LineSourcePaneView {
        constructor(e, t) {
          super(e, t),
            (this._renderer = null),
            (this._labelRenderer = new a.TextRenderer()),
            (this._lineRenderer = new o.HorizontalLineRenderer()),
            this._lineRenderer.setHitTest(new n.HitTestResult(n.HitTestResult.MOVEPOINT))
        }
        renderer() {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), 0 === this._points.length)) return
          const e = this._source.properties(),
            t = new l.CompositeRenderer(),
            i = {
              y: this._points[0].y,
              color: e.childs().linecolor.value(),
              linewidth: e.childs().linewidth.value(),
              linestyle: e.childs().linestyle.value(),
            }
          if (
            (this._lineRenderer.setData(i),
            t.append(this._lineRenderer),
            e.showLabel.value() && 1 === this._points.length && e.text.value().length > 0)
          ) {
            const i = e.vertLabelsAlign.value(),
              n = e.horzLabelsAlign.value()
            let s = 0,
              a = 0
            'left' === n
              ? (a = 3)
              : 'right' === n
              ? ((a = this._model.timeScale().width()), (s = 3))
              : (a = this._model.timeScale().width() / 2)
            const o = {
              points: [new r.Point(a, this._points[0].y)],
              text: e.text.value(),
              color: e.textcolor.value(),
              vertAlign: i,
              horzAlign: n,
              font: e.font.value(),
              offsetX: s,
              offsetY: 0,
              bold: e.bold.value(),
              italic: e.italic.value(),
              fontsize: e.fontsize.value(),
              forceTextAlign: !0,
            }
            this._labelRenderer.setData(o), t.append(this._labelRenderer)
          }
          if (1 === this._points.length) {
            const e = this._model.timeScale().width(),
              i = new r.Point(e / 2, this._points[0].y)
            ;(i.data = 0), (i.square = !0), t.append(this.createLineAnchor({ points: [i], pointsCursorType: d }, 0))
          }
          this._renderer = t
        }
      }
    },
    'ct+2': function (e, t, i) {
      'use strict'
      i.r(t)
      var r = i('zDbI'),
        n = i('aB9a'),
        s = i('Zy3/'),
        a = i('vq8G'),
        o = i('qgcf'),
        l = i('VdBB'),
        h = i('f6yo'),
        d = i('Hr11')
      class c {
        constructor() {
          this._data = null
        }
        setData(e) {
          this._data = e
        }
        draw(e, t) {
          if (null !== this._data) {
            switch ((e.save(), (e.fillStyle = this._data.color), this._data.direction)) {
              case 'up':
              case 'down':
                !(function (e, t, i, r) {
                  const n = Math.max(1, Math.floor(r)) % 2 ? 0.5 : 0,
                    s = 'up' === i ? 1 : -1,
                    a = s * Math.round(12 * r),
                    o = Object(d.ceiledEven)(19.5 * r) / 2 + n,
                    l = s * Math.round(10 * r),
                    h = Object(d.ceiledEven)(10 * r) / 2 + n,
                    c = Math.round(t.x * r) + n,
                    u = Math.round(t.y * r)
                  e.beginPath(),
                    e.moveTo(c, u),
                    e.lineTo(c + o, u + a),
                    e.lineTo(c + h, u + a),
                    e.lineTo(c + h, u + a + l),
                    e.lineTo(c - h, u + a + l),
                    e.lineTo(c - h, u + a),
                    e.lineTo(c - o, u + a),
                    e.moveTo(c, u),
                    e.fill()
                })(e, this._data.point, this._data.direction, t.pixelRatio)
                break
              case 'left':
              case 'right':
                !(function (e, t, i, r) {
                  const n = Math.max(1, Math.floor(r)) % 2 ? 0.5 : 0,
                    s = 'left' === i ? 1 : -1,
                    a = s * Math.round(12 * r) + n,
                    o = Object(d.ceiledEven)(19.5 * r) / 2 + n,
                    l = s * Math.round(22 * r) + n,
                    h = Object(d.ceiledEven)(10 * r) / 2 + n,
                    c = Math.round(t.x * r) + n,
                    u = Math.round(t.y * r) + n
                  e.beginPath(),
                    e.moveTo(c, u),
                    e.lineTo(c + a, u + o),
                    e.lineTo(c + a, u + h),
                    e.lineTo(c + l, u + h),
                    e.lineTo(c + l, u - h),
                    e.lineTo(c + a, u - h),
                    e.lineTo(c + a, u - o),
                    e.moveTo(c, u),
                    e.fill()
                })(e, this._data.point, this._data.direction, t.pixelRatio)
            }
            e.restore()
          }
        }
        hitTest(e) {
          if (null === this._data) return null
          let t, i, r, n
          switch (this._data.direction) {
            case 'up':
              ;(t = this._data.point.x - 9.75), (r = t + 19.5), (i = this._data.point.y), (n = i + 12 + 10)
              break
            case 'down':
              ;(t = this._data.point.x - 9.75), (r = t + 19.5), (n = this._data.point.y), (i = n - 12 - 10)
              break
            case 'left':
              ;(t = this._data.point.x), (r = t + 12 + 10), (i = this._data.point.y - 9.75), (n = i + 19.5)
              break
            case 'right':
              ;(r = this._data.point.x), (t = r - 12 - 10), (i = this._data.point.y - 9.75), (n = i + 19.5)
          }
          return e.x < t || e.x > r || e.y < i || e.y > n ? null : new l.HitTestResult(l.HitTestResult.MOVEPOINT)
        }
        doesIntersectWithBox(e) {
          return null !== this._data && Object(h.pointInBox)(this._data.point, e)
        }
      }
      i.d(t, 'ArrowMarkPaneView', function () {
        return u
      })
      class u extends n.LineSourcePaneView {
        constructor() {
          super(...arguments),
            (this._arrowMarkRenderer = new c()),
            (this._textRenderer = new o.TextRenderer()),
            (this._renderer = null),
            (this._anchorsOffset = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), 1 !== this._points.length)) return
          const e = this._getSource(),
            t = e.properties().childs(),
            i = this._getModel()
          this._arrowMarkRenderer.setData({
            point: this._points[0],
            direction: e.direction(),
            color: t.arrowColor.value(),
          }),
            (this._renderer = new s.CompositeRenderer()),
            this._renderer.append(this._arrowMarkRenderer),
            '' !== t.text.value() &&
              t.showLabel.value() &&
              (this._textRenderer.setData({
                points: this._points,
                font: r.CHART_FONT_FAMILY,
                bold: t.bold.value(),
                italic: t.italic.value(),
                fontSize: t.fontsize.value(),
                text: t.text.value(),
                color: t.color.value(),
                ...e.textAlignParams(),
              }),
              this._renderer.append(this._textRenderer))
          const n = [this._anchorsOffset ? this._points[0].add(this._anchorsOffset) : this._points[0].clone()]
          this._renderer.append(
            new a.SelectionRenderer({
              points: n,
              bgColors: this._lineAnchorColors(n),
              visible: this.areAnchorsVisible(),
              barSpacing: i.timeScale().barSpacing(),
              hittestResult: l.HitTestResult.MOVEPOINT,
            }),
          )
        }
      }
    },
    d1Pk: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'fibLevelCoordinate', function () {
          return n
        }),
        i.d(t, 'fibLevelPrice', function () {
          return s
        })
      var r = i('Eyy1')
      function n(e, t, i, n, s, a) {
        if (a) return Math.round(Object(r.ensureDefined)(e.coordinate) + Object(r.ensureDefined)(t.coordinate) * i)
        const o = e.price + t.price * i
        return n.priceToCoordinate(o, s)
      }
      function s(e, t, i, n, s, a) {
        if (!a) return e.price + t.price * i
        const o = Object(r.ensureDefined)(e.coordinate) + Object(r.ensureDefined)(t.coordinate) * i
        return n.coordinateToPrice(o, s)
      }
    },
    dKqZ: function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('GEp6').distanceToLine,
        s = i('hfHJ'),
        a = s.rotationMatrix,
        o = s.scalingMatrix,
        l = s.translationMatrix,
        h = s.transformPoint,
        d = i('aB9a').LineSourcePaneView,
        c = i('aB9a').thirdPointCursorType,
        u = i('VdBB').HitTestResult,
        _ = i('Zy3/').CompositeRenderer,
        p = i('Tmoa'),
        f = i('cPgM').ScaledPaneRenderer,
        g = i('//lt').PaneCursorType
      class v extends f {
        constructor() {
          super(), (this._data = null)
        }
        setData(e) {
          ;(this._data = e), (this._data.angleFrom = 0), (this._data.angleTo = Math.PI), (this._data.clockwise = !1)
        }
        _drawImpl(e) {
          if (!(null === this._data || this._data.points.length < 2)) {
            var t = this._data.points[0],
              i = this._data.points[1]
            if (this._data.points.length < 3)
              return (
                (e.strokeStyle = this._data.color),
                (e.lineWidth = this._data.linewidth),
                e.beginPath(),
                e.moveTo(t.x, t.y),
                e.lineTo(i.x, i.y),
                void e.stroke()
              )
            var s = this._data.points[2],
              d = n(t, i, s).distance
            if (d < 1)
              return (
                (e.strokeStyle = this._data.color),
                (e.lineWidth = this._data.linewidth),
                e.beginPath(),
                e.moveTo(t.x, t.y),
                e.lineTo(i.x, i.y),
                void e.stroke()
              )
            var c = i.subtract(t),
              u = t.add(i).scaled(0.5),
              _ = new r(-c.y, c.x)
            ;(_ = _.normalized()),
              (s = u.add(_.scaled(d))),
              (e.strokeStyle = this._data.color),
              (e.lineWidth = this._data.linewidth)
            var f = c.length(),
              g = c.x / f,
              v = c.y / f,
              w = Math.acos(g)
            v < 0 && (w = -w)
            var x = this._data.points[2],
              m = l(-u.x, -u.y)
            ;(x = h(m, x)),
              (m = a(-w)),
              (x = h(m, x)),
              (m = o(1, f / (2 * d))),
              (x = h(m, x)).y < 0 ? (this._data.clockwise = !0) : (this._data.clockwise = !1),
              e.save(),
              e.beginPath(),
              e.translate(t.x, t.y),
              e.rotate(w)
            var y = 1 - Math.sqrt(3) / 2
            e.scale(1, d / (f * y)),
              this._data.clockwise
                ? e.arc(0.5 * f, (f * Math.sqrt(3)) / 2, f, (-2 * Math.PI) / 3, -Math.PI / 3, !1)
                : e.arc(0.5 * f, (-f * Math.sqrt(3)) / 2, f, Math.PI / 3, (2 * Math.PI) / 3, !1),
              e.restore(),
              e.stroke(),
              this._data.fillBackground &&
                ((e.fillStyle = p.generateColor(this._data.backcolor, this._data.transparency)), e.fill())
          }
        }
        hitTest(e) {
          if (null === this._data || this._data.points.length < 3) return null
          var t = this._data.points[0],
            i = this._data.points[1],
            s = this._data.points[2],
            d = n(t, i, s).distance
          if (d < 1) return (d = n(t, i, e).distance) < 5 ? new u(u.MOVEPOINT) : null
          var c = i.subtract(t),
            _ = c.length(),
            p = t.add(i).scaled(0.5),
            f = s.subtract(p)
          ;(f = f.normalized()), (s = p.add(f.scaled(d)))
          var g = c.x / _,
            v = c.y / _,
            w = Math.acos(g)
          v < 0 && (w = -w)
          var x = l(-t.x, -t.y)
          ;(e = h(x, e)), (x = a(-w)), (e = h(x, e)), (f = h(x, f))
          var m,
            y = 1 - Math.sqrt(3) / 2
          if (((x = o(1, (_ * y) / d)), (e = h(x, e)), (f = h(x, f)), e.y * f.y < 0)) return null
          m = e.y < 0 ? new r(0.5 * _, (_ * Math.sqrt(3)) / 2) : new r(0.5 * _, (-_ * Math.sqrt(3)) / 2)
          var b = e.subtract(m).length()
          return Math.abs(b - _) <= 5 ? new u(u.MOVEPOINT) : null
        }
      }
      t.ArcPaneView = class extends d {
        constructor(e, t) {
          super(e, t), (this._arcRenderer = new v()), (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), 0 !== this._points.length)) {
            var e = {}
            ;(e.points = this._points),
              (e.color = this._source.properties().color.value()),
              (e.linewidth = this._source.properties().linewidth.value()),
              (e.backcolor = this._source.properties().backgroundColor.value()),
              (e.fillBackground = this._source.properties().fillBackground.value()),
              (e.transparency = this._source.properties().transparency.value()),
              this._arcRenderer.setData(e)
            var t = new _()
            ;(this._renderer = t), t.append(this._arcRenderer)
            var i = [],
              s = e.points[0],
              d = new r(s.x, s.y)
            if (((d.data = 0), i.push(d), 1 !== e.points.length)) {
              var u = e.points[1],
                p = new r(u.x, u.y)
              if (((p.data = 1), 2 !== e.points.length)) {
                i.push(p)
                var f = e.points[2],
                  v = n(s, u, f).distance,
                  w = u.subtract(s),
                  x = s.add(u).scaled(0.5),
                  m = new r(-w.y, w.x)
                ;(m = m.normalized()), (f = x.add(m.scaled(v)))
                var y = x.add(m.scaled(-v)),
                  b = w.length(),
                  R = w.x / b,
                  T = w.y / b,
                  S = Math.acos(R)
                T < 0 && (S = -S)
                var P = e.points[2],
                  L = l(-x.x, -x.y)
                ;(P = h(L, P)), (L = a(-S)), (P = h(L, P)), (L = o(1, b / (2 * v)))
                var C = (P = h(L, P)).y >= 0 ? new r(f.x, f.y) : new r(y.x, y.y)
                ;(C.data = 2), i.push(C)
                var M = [g.Default, g.Default, c(s, u)]
                t.append(this.createLineAnchor({ points: i, pointsCursorType: M }, 0))
              } else this.addAnchors(t)
            }
          }
        }
      }
    },
    dMkl: function (e, t, i) {
      'use strict'
      var r = i('Hr11'),
        n = i('aB9a').LineSourcePaneView,
        s = i('pJOz').TrendLineRenderer,
        a = i('VdBB').HitTestResult,
        o = i('/hKg').PaneRendererCandles,
        l = i('Zy3/').CompositeRenderer,
        h = i('a7Ha').LineEnd,
        d = i('Zp/P')
      t.GhostFeedPaneView = class extends n {
        constructor(e, t) {
          super(e, t), (this._renderer = null)
        }
        _udpateImpl() {
          super._updateImpl(), (this._renderer = null)
          var e = this
          if (((this._segments = []), !(e._points.length < 2))) {
            this._segments = this._source
              .segments()
              .map(function (t, i) {
                var n = e._source.points()
                if (i >= e._points.length - 1) return null
                var s = e._points[i].x,
                  a = n[i].price,
                  o = n[i + 1].price,
                  l = n[i + 1].index - n[i].index,
                  h = e._model.timeScale().barSpacing() * r.sign(l),
                  d = (o - a) / (t.bars().length - 1),
                  c = e._source.properties(),
                  u = c.candleStyle.upColor.value(),
                  _ = c.candleStyle.downColor.value(),
                  p = c.candleStyle.borderUpColor.value(),
                  f = c.candleStyle.borderDownColor.value()
                return {
                  bars: t.bars().map(function (t, i) {
                    var r = t.c >= t.o
                    return {
                      time: s + i * h,
                      open: e.priceToCoordinate(t.o + a + i * d),
                      high: e.priceToCoordinate(t.h + a + i * d),
                      low: e.priceToCoordinate(t.l + a + i * d),
                      close: e.priceToCoordinate(t.c + a + i * d),
                      color: r ? u : _,
                      borderColor: r ? p : f,
                      hollow: !1,
                    }
                  }),
                }
              })
              .filter(function (e) {
                return !!e
              })
            for (var t = new l(), i = 1; i < this._points.length; i++) {
              var n = {
                  points: [this._points[i - 1], this._points[i]],
                  width: this._model.timeScale().width(),
                  height: this._source.priceScale().height(),
                  color: '#808080',
                  linewidth: 1,
                  linestyle: CanvasEx.LINESTYLE_SOLID,
                  extendleft: !1,
                  extendright: !1,
                  leftend: h.Normal,
                  rightend: h.Normal,
                },
                c = new s()
              c.setData(n), c.setHitTest(new a(a.MOVEPOINT, null)), t.append(c)
            }
            var u = this._source.properties(),
              _ = u.candleStyle.drawWick.value(),
              p = u.candleStyle.drawBorder.value(),
              f = u.candleStyle.borderColor.value(),
              g = u.candleStyle.wickColor.value(),
              v = new l()
            v.setGlobalAlpha(1 - u.transparency.value() / 100)
            var w = this._model.timeScale().barSpacing()
            for (i = 0; i < this._segments.length; i++) {
              var x = {
                bars: this._segments[i].bars,
                barSpacing: w,
                wickVisible: _,
                bodyVisible: !0,
                borderVisible: p,
                borderColor: f,
                wickColor: g,
                barWidth: d.optimalBarWidth(w),
                hittest: new a(a.MOVEPOINT, null),
              }
              v.append(new o(x))
            }
            t.append(v), this.addAnchors(t), (this._renderer = t)
          }
        }
        renderer(e, t) {
          return this._invalidated && this._udpateImpl(), this._renderer
        }
      }
    },
    e9yB: function (e, t, i) {
      'use strict'
      i.d(t, 'c', function () {
        return c
      }),
        i.d(t, 'b', function () {
          return u
        }),
        i.d(t, 'a', function () {
          return _
        })
      var r = i('GEp6'),
        n = i('cPgM'),
        s = i('a7Ha'),
        a = i('jFln'),
        o = i('VdBB'),
        l = i('2hKl'),
        h = i('pJOz'),
        d = i('Zp/P')
      function c(e, t, i) {
        for (const n of i)
          for (let i = 1; i < n.length; i++) {
            const s = n[i - 1],
              a = n[i]
            if (Object(r.distanceToSegment)(s, a, e).distance < t) return new o.HitTestResult(o.HitTestResult.MOVEPOINT)
          }
        return null
      }
      function u(e, t) {
        for (let i = 0; i < t.length; i++) {
          const r = t[i],
            n = r[0]
          e.moveTo(n.x, n.y)
          for (let t = 1; t < r.length; t++) {
            const i = r[t]
            e.lineTo(i.x, i.y)
          }
        }
      }
      class _ extends n.ScaledPaneRenderer {
        constructor(e) {
          super(), (this._data = e || null)
        }
        setData(e) {
          this._data = e
        }
        hitTest(e, t) {
          if (null !== this._data && 3 === this._data.points.length) {
            const t = Object(d.interactionTolerance)().curve,
              [i, r, n] = this._data.points,
              s = r.subtract(i),
              a = n.subtract(s.scaled(0.25)),
              h = n.add(s.scaled(0.25))
            if (Object(l.c)(n, i, a, e, t) || Object(l.c)(n, r, h, e, t))
              return new o.HitTestResult(o.HitTestResult.MOVEPOINT)
            let u = c(e, t, this._data.extendLeftSegments)
            return null === u && (u = c(e, t, this._data.extendRightSegments)), u
          }
          return null
        }
        _drawImpl(e, t) {
          if (null === this._data) return
          const [i, r, n] = this._data.points
          if (
            ((e.lineCap = 'butt'),
            (e.strokeStyle = this._data.color),
            (e.lineWidth = this._data.lineWidth),
            Object(a.setLineStyle)(e, this._data.lineStyle),
            2 === this._data.points.length)
          )
            e.beginPath(), e.moveTo(i.x, i.y), e.lineTo(r.x, r.y), e.stroke()
          else {
            const a = r.subtract(i),
              o = n.subtract(a.scaled(0.25)),
              l = n.add(a.scaled(0.25))
            this._data.fillBack &&
              this._data.points.length > 2 &&
              ((e.fillStyle = this._data.backColor),
              e.beginPath(),
              e.moveTo(i.x, i.y),
              e.quadraticCurveTo(o.x, o.y, n.x, n.y),
              e.quadraticCurveTo(l.x, l.y, r.x, r.y),
              e.fill()),
              e.beginPath(),
              u(e, this._data.extendLeftSegments),
              e.moveTo(i.x, i.y),
              e.quadraticCurveTo(o.x, o.y, n.x, n.y),
              e.quadraticCurveTo(l.x, l.y, r.x, r.y),
              u(e, this._data.extendRightSegments),
              e.stroke(),
              this._data.leftEnd === s.LineEnd.Arrow && Object(h.drawArrow)(o, i, e, e.lineWidth, t.pixelRatio),
              this._data.rightEnd === s.LineEnd.Arrow && Object(h.drawArrow)(l, r, e, e.lineWidth, t.pixelRatio)
          }
        }
      }
    },
    eg8N: function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('aB9a').LineSourcePaneView,
        s = i('qgcf').TextRenderer,
        a = i('IjC5').RectangleRenderer,
        o = i('pJOz').TrendLineRenderer,
        l = i('Zy3/').CompositeRenderer,
        h = i('zXvd').NumericFormatter,
        d = i('a7Ha').LineEnd
      t.GannSquarePaneView = class extends n {
        constructor(e, t) {
          super(e, t), (this._numericFormatter = new h()), (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            (this._renderer = null),
            !(this._source.points().length < 2) &&
              this._source.priceScale() &&
              !this._source.priceScale().isEmpty() &&
              !this._model.timeScale().isEmpty())
          ) {
            var e = this._source.points()[0],
              t = this._source.points()[1],
              i = (L = this._source.properties()).reverse && L.reverse.value()
            this._hlevels = []
            for (
              var n = i ? e.price - t.price : t.price - e.price,
                h = i ? t.price : e.price,
                c = this._source.ownerSource().firstValue(),
                u = 1;
              u <= 7;
              u++
            ) {
              if ((x = L['hlevel' + u]).visible.value()) {
                var _ = x.coeff.value(),
                  p = x.color.value(),
                  f = h + _ * n,
                  g = this._source.priceScale().priceToCoordinate(f, c)
                this._hlevels.push({ coeff: _, color: p, y: g })
              }
            }
            this._vlevels = []
            var v = i ? e.index - t.index : t.index - e.index,
              w = i ? t.index : e.index
            for (u = 1; u <= 7; u++) {
              var x
              if ((x = L['vlevel' + u]).visible.value()) {
                ;(_ = x.coeff.value()), (p = x.color.value())
                var m = Math.round(w + _ * v),
                  y = this._model.timeScale().indexToCoordinate(m)
                this._vlevels.push({ coeff: _, color: p, x: y })
              }
            }
            if (((this._hfans = []), (this._vfans = []), L.fans.visible.value()))
              for (u = 1; u <= 7; u++) {
                ;(m = Math.round(w + L['hlevel' + u].coeff.value() * v)), (f = h + L['vlevel' + u].coeff.value() * n)
                this._hfans.push(this._model.timeScale().indexToCoordinate(m)),
                  this._vfans.push(this._source.priceScale().priceToCoordinate(f, c))
              }
            var b = new l()
            if (this._points.length < 2) return this.addAnchors(b), void (this._renderer = b)
            ;(e = this._points[0]), (t = this._points[1])
            var R = Math.min(e.x, t.x),
              T = Math.min(e.y, t.y),
              S = Math.max(e.x, t.x),
              P = Math.max(e.y, t.y),
              L = this._source.properties(),
              C = this._source.properties().fillHorzBackground.value(),
              M = this._source.properties().horzTransparency.value(),
              I = this._source.properties().fillVertBackground.value(),
              O = this._source.properties().vertTransparency.value()
            for (u = 0; u < this._hlevels.length; u++) {
              if (u > 0 && C) {
                var N = this._hlevels[u - 1]
                ;(e = new r(R, this._hlevels[u].y)), (t = new r(S, N.y))
                ;((A = {}).points = [e, t]),
                  (A.color = this._hlevels[u].color),
                  (A.linewidth = 0),
                  (A.backcolor = this._hlevels[u].color),
                  (A.fillBackground = !0),
                  (A.transparency = M),
                  (A.extendLeft = !1),
                  (A.extendRight = !1),
                  (z = new a(void 0, void 0, !0)).setData(A),
                  b.append(z)
              }
              var D = {
                points: [(e = new r(R, this._hlevels[u].y)), (t = new r(S, this._hlevels[u].y))],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: this._hlevels[u].color,
                linewidth: L.linewidth.value(),
                linestyle: L.linestyle.value(),
                extendleft: !1,
                extendright: !1,
                leftend: d.Normal,
                rightend: d.Normal,
              }
              if (((z = new o()).setData(D), b.append(z), L.showLeftLabels.value())) {
                var B = {
                  points: [e],
                  text: this._numericFormatter.format(this._hlevels[u].coeff),
                  color: this._hlevels[u].color,
                  vertAlign: 'middle',
                  horzAlign: 'right',
                  font: L.font.value(),
                  offsetX: 5,
                  offsetY: 0,
                  fontsize: 12,
                  forceTextAlign: !0,
                }
                b.append(new s(B))
              }
              if (L.showRightLabels.value()) {
                var k = {
                  points: [t],
                  text: this._numericFormatter.format(this._hlevels[u].coeff),
                  color: this._hlevels[u].color,
                  vertAlign: 'middle',
                  horzAlign: 'left',
                  font: L.font.value(),
                  offsetX: 5,
                  offsetY: 0,
                  fontsize: 12,
                }
                b.append(new s(k))
              }
            }
            for (u = 0; u < this._vlevels.length; u++) {
              ;(e = new r(this._vlevels[u].x, T)), (t = new r(this._vlevels[u].x, P))
              if (u > 0 && I) {
                N = this._vlevels[u - 1]
                var A,
                  E = new r(N.x, T)
                ;((A = {}).points = [E, t]),
                  (A.color = this._vlevels[u].color),
                  (A.linewidth = 0),
                  (A.backcolor = this._vlevels[u].color),
                  (A.fillBackground = !0),
                  (A.transparency = O),
                  (A.extendLeft = !1),
                  (A.extendRight = !1),
                  (z = new a(void 0, void 0, !0)).setData(A),
                  b.append(z)
              }
              var z
              D = {
                points: [e, t],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: this._vlevels[u].color,
                linewidth: L.linewidth.value(),
                linestyle: L.linestyle.value(),
                extendleft: !1,
                extendright: !1,
                leftend: d.Normal,
                rightend: d.Normal,
              }
              if (((z = new o()).setData(D), b.append(z), L.showTopLabels.value())) {
                var j = {
                  points: [e],
                  text: this._numericFormatter.format(this._vlevels[u].coeff),
                  color: this._vlevels[u].color,
                  vertAlign: 'bottom',
                  horzAlign: 'center',
                  font: L.font.value(),
                  offsetX: 0,
                  offsetY: 3,
                  fontsize: 12,
                }
                b.append(new s(j))
              }
              if (L.showBottomLabels.value()) {
                var V = {
                  points: [t],
                  text: this._numericFormatter.format(this._vlevels[u].coeff),
                  color: this._vlevels[u].color,
                  vertAlign: 'top',
                  horzAlign: 'center',
                  font: L.font.value(),
                  offsetX: 0,
                  offsetY: 5,
                  fontsize: 12,
                }
                b.append(new s(V))
              }
            }
            var H = this
            W(b, this._hfans, !0), W(b, this._vfans, !1), this.addAnchors(b), (this._renderer = b)
          }
          function W(e, t, i) {
            var n = new r(R, T),
              s = new r(S, T),
              a = new r(R, P),
              l = new r(S, P),
              h = {
                width: H._model.timeScale().width(),
                height: H._source.priceScale().height(),
                color: L.fans.color.value(),
                linewidth: L.linewidth.value(),
                linestyle: L.linestyle.value(),
                extendleft: !1,
                extendright: !1,
                leftend: d.Normal,
                rightend: d.Normal,
              }
            function c(t) {
              var i = new o()
              i.setData(Object.assign({}, h, { points: t })), e.append(i)
            }
            for (var u = 0; u < t.length; ++u) {
              var _ = i ? P : t[u],
                p = i ? T : t[u],
                f = i ? t[u] : R,
                g = i ? t[u] : S,
                v = new r(g, _),
                w = new r(f, _),
                x = new r(g, p),
                m = new r(f, p)
              c([a, x]), c([l, m]), c([n, v]), c([s, w])
            }
          }
        }
      }
    },
    f2d2: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="#00ACEE" d="M23.5 12a11.5 11.5 0 1 1-23 0 11.5 11.5 0 0 1 23 0z"/><path fill="#fff" d="M17.82 8.47c-.42.18-.86.3-1.34.37.48-.3.85-.75 1.03-1.3-.45.27-.95.47-1.48.57a2.33 2.33 0 0 0-3.97 2.13 6.61 6.61 0 0 1-4.8-2.44 2.33 2.33 0 0 0 .72 3.11 2.32 2.32 0 0 1-1.06-.29v.03c0 1.13.8 2.07 1.87 2.29a2.35 2.35 0 0 1-1.05.04c.3.92 1.16 1.6 2.18 1.61a4.67 4.67 0 0 1-3.45.97 6.59 6.59 0 0 0 3.57 1.04 6.58 6.58 0 0 0 6.62-6.92c.45-.33.85-.74 1.16-1.2v-.01z"/></svg>'
    },
    gr7S: function (e, t, i) {
      'use strict'
      var r = i('aB9a').LineSourcePaneView,
        n = i('wacn').DisjointChannelRenderer,
        s = i('pJOz').TrendLineRenderer,
        a = i('qgcf').TextRenderer,
        o = i('Zy3/').CompositeRenderer
      t.FlatBottomPaneView = class extends r {
        constructor(e, t) {
          super(e, t),
            (this._label1 = null),
            (this._label2 = null),
            (this._trendLineRendererPoints12 = new s()),
            (this._trendLineRendererPoints43 = new s()),
            (this._disjointChannelRenderer = new n()),
            (this._p1LabelRenderer = new a()),
            (this._p2LabelRenderer = new a()),
            (this._p3LabelRenderer = new a()),
            (this._p4LabelRenderer = new a()),
            (this._renderer = null)
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            (this._renderer = null),
            (this._label1 = null),
            (this._label2 = null),
            !(this._source.points().length < 2) && this._source.priceScale())
          ) {
            var e = this._source.points()[0],
              t = this._source.points()[1],
              i = this._source.ownerSource().firstValue()
            if (
              ((this._price1 = this._source.priceScale().formatPrice(e.price, i)),
              (this._price2 = this._source.priceScale().formatPrice(t.price, i)),
              3 === this._source.points().length)
            ) {
              var r = this._source.points()[2]
              this._price3 = this._source.priceScale().formatPrice(r.price, i)
            }
            if (!(this._points.length < 2)) {
              var n,
                s = new o(),
                a = ((e = this._points[0]), (t = this._points[1]), this._source.properties()),
                l = this._model,
                h = this._source
              if (
                3 === this._points.length &&
                (((r = this._points[2]).x = t.x), ((n = e.clone()).y = r.y), (n.data = 3), a.fillBackground.value())
              ) {
                var d = l.timeScale().width(),
                  c = h.priceScale().height(),
                  u = a.extendLeft.value(),
                  _ = a.extendRight.value()
                this._disjointChannelRenderer.setData({
                  width: d,
                  height: c,
                  extendleft: u,
                  extendright: _,
                  points: [e, t, r, n],
                  backcolor: a.backgroundColor.value(),
                  transparency: a.transparency.value(),
                  hittestOnBackground: TradingView.isMobile.any(),
                }),
                  s.append(this._disjointChannelRenderer)
              }
              var p = function (e, t) {
                return {
                  points: [e, t],
                  width: l.timeScale().width(),
                  height: h.priceScale().height(),
                  color: a.linecolor.value(),
                  linewidth: a.linewidth.value(),
                  linestyle: a.linestyle.value(),
                  extendleft: a.extendLeft.value(),
                  extendright: a.extendRight.value(),
                  leftend: a.leftEnd.value(),
                  rightend: a.rightEnd.value(),
                }
              }
              if (
                (this._trendLineRendererPoints12.setData(p(e, t)),
                s.append(this._trendLineRendererPoints12),
                2 === this._points.length)
              )
                return this.addAnchors(s), void (this._renderer = s)
              var f = this,
                g = function (e, t, i, r, n, a) {
                  if (f._source.properties().showPrices.value()) {
                    var o = {
                      points: [i],
                      text: n,
                      color: f._source.properties().textcolor.value(),
                      horzAlign: i.x > r.x ? 'left' : 'right',
                      vertAlign: 'middle',
                      font: f._source.properties().font.value(),
                      offsetX: 6,
                      offsetY: 0,
                      boxPadding: 0,
                      bold: f._source.properties().bold.value(),
                      italic: f._source.properties().italic.value(),
                      fontsize: f._source.properties().fontsize.value(),
                      forceTextAlign: !0,
                    }
                    e.setData(o), s.append(e)
                    o = {
                      points: [r],
                      text: a,
                      color: f._source.properties().textcolor.value(),
                      horzAlign: i.x < r.x ? 'left' : 'right',
                      vertAlign: 'middle',
                      font: f._source.properties().font.value(),
                      offsetX: 6,
                      offsetY: 0,
                      boxPadding: 0,
                      bold: f._source.properties().bold.value(),
                      italic: f._source.properties().italic.value(),
                      fontsize: f._source.properties().fontsize.value(),
                      forceTextAlign: !0,
                    }
                    t.setData(o), s.append(t)
                  }
                }
              g(this._p1LabelRenderer, this._p2LabelRenderer, e, t, this._price1, this._price2),
                this._trendLineRendererPoints43.setData(p(n, r)),
                s.append(this._trendLineRendererPoints43),
                g(this._p3LabelRenderer, this._p4LabelRenderer, r, n, this._price3, this._price3)
              var v = [e, t, r, n]
              this._model.lineBeingCreated() === this._source && v.pop(),
                s.append(this.createLineAnchor({ points: v }, 0)),
                (this._renderer = s)
            }
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    hzaj: function (e, t, i) {
      'use strict'
      i.d(t, 'a', function () {
        return h
      })
      var r = i('aO4+'),
        n = i('BCbF'),
        s = i('vq8G'),
        a = i('Zy3/'),
        o = i('VdBB'),
        l = i('aB9a')
      class h extends l.LineSourcePaneView {
        constructor() {
          super(...arguments),
            (this._polygonRenderer = new n.PolygonRenderer(null)),
            (this._renderer = new a.CompositeRenderer())
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          super._updateImpl()
          const e = Math.max(1, this._source.smooth()),
            t = this._points
          if (0 === t.length) return void this._renderer.clear()
          const i = [t[0]]
          for (let r = 1; r < t.length; r++) {
            const n = t[r].subtract(t[r - 1]),
              s = n.length(),
              a = Math.min(5, Math.floor(s / e)),
              o = n.normalized().scaled(s / a)
            for (let e = 0; e < a - 1; e++) i.push(t[r - 1].add(o.scaled(e)))
            i.push(t[r])
          }
          this._points = this._smoothArray(i, e)
          const r = this._createPolygonRendererData()
          if (
            (this._polygonRenderer.setData(r),
            (this._renderer = new a.CompositeRenderer()),
            this._renderer.append(this._polygonRenderer),
            this._source.finished())
          ) {
            const e = r.points.length
            if (e > 0) {
              const t = 1 !== e ? [r.points[0], r.points[e - 1]] : [r.points[0]],
                i = new s.SelectionRenderer({
                  points: t,
                  bgColors: this._lineAnchorColors(t),
                  visible: this.areAnchorsVisible(),
                  hittestResult: o.HitTestResult.REGULAR,
                  barSpacing: this._getModel().timeScale().barSpacing(),
                })
              this._renderer.append(i)
            }
          }
        }
        _smoothArray(e, t) {
          if (1 === e.length) return e
          const i = new Array(e.length)
          for (let n = 0; n < e.length; n++) {
            let s = new r.Point(0, 0)
            for (let i = 0; i < t; i++) {
              const t = Math.max(n - i, 0),
                r = Math.min(n + i, e.length - 1)
              ;(s = s.add(e[t])), (s = s.add(e[r]))
            }
            i[n] = s.scaled(0.5 / t)
          }
          return i.push(e[e.length - 1]), i
        }
      }
    },
    isd9: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'ArcWedgeRenderer', function () {
          return a
        })
      var r = i('VdBB'),
        n = i('Tmoa'),
        s = i('cPgM')
      class a extends s.ScaledPaneRenderer {
        constructor() {
          super(...arguments),
            (this._data = null),
            (this._hitTest = new r.HitTestResult(r.HitTestResult.MOVEPOINT)),
            (this._backHitTest = new r.HitTestResult(r.HitTestResult.MOVEPOINT_BACKGROUND))
        }
        setData(e) {
          this._data = e
        }
        setHitTest(e) {
          this._hitTest = e
        }
        hitTest(e) {
          if (null === this._data) return null
          const t = e.subtract(this._data.center),
            i = t.length()
          if (Math.abs(i - this._data.radius) <= 4) {
            const t = e.subtract(this._data.p1).length(),
              i = e.subtract(this._data.p2).length()
            if (Math.max(t, i) <= this._data.p1.subtract(this._data.p2).length()) return this._hitTest
          }
          if (this._data.fillBackground && i <= this._data.radius) {
            const e = this._data.p1.subtract(this._data.center).normalized(),
              i = this._data.p2.subtract(this._data.center).normalized(),
              r = t.normalized(),
              n = e.dotProduct(i),
              s = r.dotProduct(e),
              a = r.dotProduct(i)
            if (s >= n && a >= n) return this._backHitTest
          }
          return null
        }
        _drawImpl(e) {
          if (
            null !== this._data &&
            ((e.strokeStyle = this._data.color),
            (e.lineWidth = this._data.linewidth),
            e.beginPath(),
            e.arc(this._data.center.x, this._data.center.y, this._data.radius, this._data.edge1, this._data.edge2, !0),
            e.stroke(),
            this._data.fillBackground)
          ) {
            if (
              (e.arc(
                this._data.center.x,
                this._data.center.y,
                this._data.prevRadius,
                this._data.edge2,
                this._data.edge1,
                !1,
              ),
              this._data.gradient)
            ) {
              const t = e.createRadialGradient(
                this._data.center.x,
                this._data.center.y,
                this._data.prevRadius,
                this._data.center.x,
                this._data.center.y,
                this._data.radius,
              )
              t.addColorStop(0, Object(n.generateColor)(this._data.color1, this._data.transparency)),
                t.addColorStop(1, Object(n.generateColor)(this._data.color2, this._data.transparency)),
                (e.fillStyle = t)
            } else e.fillStyle = Object(n.generateColor)(this._data.color, this._data.transparency, !0)
            e.fill()
          }
        }
      }
    },
    jlk4: function (e, t, i) {
      'use strict'
      var r = i('isd9').ArcWedgeRenderer,
        n = i('1SUO').FibWedgePaneView,
        s = i('pJOz').TrendLineRenderer,
        a = i('Zy3/').CompositeRenderer,
        o = i('a7Ha').LineEnd
      t.ProjectionLinePaneView = class extends n {
        constructor(e, t) {
          super(e, t),
            (this._baseTrendRenderer = new s()),
            (this._edgeTrendRenderer = new s()),
            (this._arcWedgeRenderer = new r())
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateRenderer() {
          if (!(this._points.length < 2)) {
            var e = new a(),
              t = this._source.properties(),
              i = this._points,
              r = i[0],
              n = i[1],
              s = {
                points: [r, n],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: t.trendline.color.value(),
                linewidth: t.linewidth.value(),
                linestyle: t.trendline.linestyle.value(),
                extendleft: !1,
                extendright: !1,
                leftend: o.Normal,
                rightend: o.Normal,
              }
            if ((this._baseTrendRenderer.setData(s), e.append(this._baseTrendRenderer), this._points.length < 3))
              return this.addAnchors(e), void (this._renderer = e)
            var l = i[2],
              h = l.data,
              d = n.subtract(r).length(),
              c = l.subtract(r).normalized()
            ;((l = r.add(c.scaled(d))).data = h),
              (s = {
                points: [r, l],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: t.trendline.color.value(),
                linewidth: t.linewidth.value(),
                linestyle: t.trendline.linestyle.value(),
                extendleft: !1,
                extendright: !1,
                leftend: o.Normal,
                rightend: o.Normal,
              }),
              this._edgeTrendRenderer.setData(s),
              e.append(this._edgeTrendRenderer)
            var u = this._levels[0],
              _ = {}
            ;(_.center = this._points[0]),
              (_.radius = u.radius),
              (_.prevRadius = 0),
              (_.edge = this._edge),
              (_.color = t.trendline.color.value()),
              (_.color1 = t.color1.value()),
              (_.color2 = t.color2.value()),
              (_.linewidth = t.linewidth.value()),
              (_.edge1 = this._edge1),
              (_.edge2 = this._edge2),
              (_.p1 = u.p1),
              (_.p2 = u.p2),
              (_.fillBackground = t.fillBackground.value()),
              (_.transparency = t.transparency.value()),
              (_.gradient = !0),
              this._arcWedgeRenderer.setData(_),
              e.append(this._arcWedgeRenderer),
              this.addAnchors(e),
              (this._renderer = e)
          }
        }
      }
    },
    l5Au: function (e, t, i) {
      'use strict'
      var r = i('aB9a').LineSourcePaneView,
        n = i('2trc').ChannelRenderer,
        s = i('pJOz').TrendLineRenderer,
        a = i('VdBB').HitTestResult,
        o = i('Zy3/').CompositeRenderer,
        l = i('a7Ha').LineEnd
      t.PitchfanLinePaneView = class extends r {
        constructor(e, t) {
          super(e, t), (this._medianRenderer = new s()), (this._sideRenderer = new s()), (this._renderer = null)
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            (this._renderer = null),
            0 !== this._floatPoints.length &&
              (3 === this._floatPoints.length
                ? ((this._medianPoint = this._floatPoints[1].add(this._floatPoints[2]).scaled(0.5)),
                  (this._medianPoint.data = 3))
                : 2 === this._floatPoints.length
                ? ((this._medianPoint = this._floatPoints[1]), (this._medianPoint.data = 3))
                : ((this._medianPoint = this._floatPoints[0]), (this._medianPoint.data = 3)),
              !(this._floatPoints.length < 2) && this._medianPoint))
          ) {
            var e = new o(),
              t = {
                points: [this._floatPoints[0], this._medianPoint],
                width: this._model.timeScale().width(),
                height: this._source.priceScale().height(),
                color: this._source.properties().median.color.value(),
                linewidth: this._source.properties().median.linewidth.value(),
                linestyle: this._source.properties().median.linestyle.value(),
                extendleft: !1,
                extendright: !0,
                leftend: l.Normal,
                rightend: l.Normal,
              }
            if ((this._medianRenderer.setData(t), e.append(this._medianRenderer), this._floatPoints.length < 3))
              return this.addAnchors(e), void (this._renderer = e)
            var i = {
              points: [this._floatPoints[1], this._floatPoints[2]],
              width: this._model.timeScale().width(),
              height: this._source.priceScale().height(),
              color: this._source.properties().median.color.value(),
              linewidth: this._source.properties().median.linewidth.value(),
              linestyle: this._source.properties().median.linestyle.value(),
              extendleft: !1,
              extendright: !1,
              leftend: l.Normal,
              rightend: l.Normal,
            }
            this._sideRenderer.setData(i), e.append(this._sideRenderer)
            for (
              var r = 0,
                h = this._floatPoints[2].subtract(this._floatPoints[1]).scaled(0.5),
                d = this._source.properties().fillBackground.value(),
                c = this._source.properties().transparency.value(),
                u = 0;
              u <= 8;
              u++
            ) {
              var _ = 'level' + u,
                p = this._source.properties()[_]
              if (p.visible.value()) {
                var f,
                  g = this._medianPoint.addScaled(h, p.coeff.value()),
                  v = this._medianPoint.addScaled(h, -p.coeff.value())
                if (d)
                  ((f = {}).width = this._model.timeScale().width()),
                    (f.height = this._source.priceScale().height()),
                    (f.p1 = this._floatPoints[0]),
                    (f.p2 = g),
                    (f.p3 = this._floatPoints[0]),
                    (f.p4 = this._medianPoint.addScaled(h, r)),
                    (f.color = p.color.value()),
                    (f.transparency = c),
                    (f.hittestOnBackground = !0),
                    (x = new n()).setData(f),
                    e.append(x),
                    ((f = {}).width = this._model.timeScale().width()),
                    (f.height = this._source.priceScale().height()),
                    (f.p1 = this._floatPoints[0]),
                    (f.p2 = v),
                    (f.p3 = this._floatPoints[0]),
                    (f.p4 = this._medianPoint.addScaled(h, -r)),
                    (f.color = p.color.value()),
                    (f.transparency = c),
                    (f.hittestOnBackground = !0),
                    (x = new n()).setData(f),
                    e.append(x)
                r = p.coeff.value()
                var w = {
                  points: [this._floatPoints[0], g],
                  width: this._model.timeScale().width(),
                  height: this._source.priceScale().height(),
                  color: p.color.value(),
                  linewidth: p.linewidth.value(),
                  linestyle: p.linestyle.value(),
                  extendleft: !1,
                  extendright: !0,
                  leftend: l.Normal,
                  rightend: l.Normal,
                }
                ;(x = new s()).setData(w), x.setHitTest(new a(a.MOVEPOINT, null, u)), e.append(x)
                var x,
                  m = {
                    points: [this._floatPoints[0], v],
                    width: this._model.timeScale().width(),
                    height: this._source.priceScale().height(),
                    color: p.color.value(),
                    linewidth: p.linewidth.value(),
                    linestyle: p.linestyle.value(),
                    extendleft: !1,
                    extendright: !0,
                    leftend: l.Normal,
                    rightend: l.Normal,
                  }
                ;(x = new s()).setData(m), x.setHitTest(new a(a.MOVEPOINT, null, u)), e.append(x)
              }
            }
            this.addAnchors(e), (this._renderer = e)
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    lZ9F: function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('GEp6').distanceToLine,
        s = i('aB9a').LineSourcePaneView,
        a = i('aB9a').thirdPointCursorType,
        o = i('pJOz').TrendLineRenderer,
        l = i('BCbF').PolygonRenderer,
        h = i('Zy3/').CompositeRenderer,
        d = i('a7Ha').LineEnd,
        c = i('//lt').PaneCursorType
      t.RotatedRectanglePaneView = class extends s {
        constructor(e, t) {
          super(e, t), (this._poligonRenderer = new l()), (this._renderer = null)
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            (this._renderer = null),
            (this._distance = 0),
            3 === this._points.length &&
              (this._distance = n(this._points[0], this._points[1], this._points[2]).distance),
            0 !== this._points.length)
          ) {
            var e,
              t,
              i,
              s,
              l = new h(),
              u = this._source.properties(),
              _ = this._points[0],
              p = this._points[1]
            if (2 === this._points.length) {
              ;((g = {}).points = this._points),
                (g.floatPoints = this._floatPoints),
                (g.width = this._model.timeScale().width()),
                (g.height = this._source.priceScale().height()),
                (g.color = u.color.value()),
                (g.linewidth = 1),
                (g.linestyle = CanvasEx.LINESTYLE_SOLID),
                (g.extendleft = !1),
                (g.extendright = !1),
                (g.leftend = d.Normal),
                (g.rightend = d.Normal)
              var f = new o()
              f.setData(g), l.append(f)
            } else if (3 === this._points.length) {
              var g,
                v = p.subtract(_),
                w = new r(v.y, -v.x).normalized().scaled(this._distance),
                x = w.scaled(-1)
              ;(e = _.add(w)),
                (t = p.add(w)),
                (i = _.add(x)),
                (s = p.add(x)),
                ((g = {}).points = [e, t, s, i]),
                (g.color = u.color.value()),
                (g.linewidth = this._source.properties().linewidth.value()),
                (g.linestyle = CanvasEx.LINESTYLE_SOLID),
                (g.filled = !0),
                (g.backcolor = u.backgroundColor.value()),
                (g.fillBackground = u.fillBackground.value()),
                (g.transparency = u.transparency.value()),
                this._poligonRenderer.setData(g),
                l.append(this._poligonRenderer)
            }
            var m = []
            m.push(_), this._points.length >= 2 && m.push(p)
            var y = [c.Default, c.Default]
            if (3 === this._points.length) {
              ;(e.data = 2), (i.data = 2), (t.data = 2), (s.data = 2), m.push(e, i, t, s)
              var b = a(_, p)
              y.push(b, b, b, b)
            }
            l.append(this.createLineAnchor({ points: m, pointsCursorType: y }, 0)), (this._renderer = l)
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    mJB8: function (e, t, i) {
      e.exports = i.p + '4fafff07d8914dc11f6d335f606ff47c.png'
    },
    mjK7: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'CypherPaneView', function () {
          return n
        })
      var r = i('6MfG')
      class n extends r.Pattern5pointsPaneView {
        _updateBaseData() {
          if (this._source.points().length >= 3) {
            const [e, t, i] = this._source.points()
            this._abRetracement = Math.round(1e3 * Math.abs((i.price - t.price) / (t.price - e.price))) / 1e3
          }
          if (this._source.points().length >= 4) {
            const [e, t, , i] = this._source.points()
            this._bcRetracement = Math.round(1e3 * Math.abs((i.price - e.price) / (t.price - e.price))) / 1e3
          }
          if (this._source.points().length >= 5) {
            const [e, , t, i, r] = this._source.points()
            ;(this._cdRetracement = Math.round(1e3 * Math.abs((r.price - i.price) / (i.price - t.price))) / 1e3),
              (this._xdRetracement = Math.round(1e3 * Math.abs((r.price - i.price) / (e.price - i.price))) / 1e3)
          }
        }
      }
    },
    mr3a: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'TextPaneView', function () {
          return p
        })
      var r = i('Eyy1'),
        n = i('aO4+'),
        s = i('zDbI'),
        a = i('//lt'),
        o = i('qgcf'),
        l = i('Zy3/'),
        h = i('vq8G'),
        d = i('TTFo'),
        c = i('VdBB'),
        u = i('aB9a')
      const _ = [a.PaneCursorType.HorizontalResize]
      class p extends u.LineSourcePaneView {
        constructor(e, t, i, r, n, s, a, l) {
          super(e, t),
            (this._textRenderer = new o.TextRenderer()),
            (this._noSelection = !1),
            (this._renderer = null),
            (this._offsetX = i),
            (this._offsetY = r),
            (this._vertAlign = n),
            (this._horzAlign = s),
            (this._forceTextAlign = Boolean(a)),
            (this._noSelection = !1),
            (this._renderer = null),
            (this._recalculateSourcePointsOnFirstUpdate = l)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        disableSelection() {
          this._noSelection = !0
        }
        isEditMode() {
          return !this._getModel().readOnly()
        }
        _updateImpl() {
          super._updateImpl(), (this._renderer = null)
          const e = this._getSource(),
            t = e.priceScale()
          if (!t || t.isEmpty()) return
          const i = e.properties().childs(),
            a = this._getModel(),
            o = {
              text: i.text.value(),
              color: i.color.value(),
              fontSize: i.fontsize.value(),
              boxPadding: i.fontsize.value() / 6,
              font: s.CHART_FONT_FAMILY,
              vertAlign: this._vertAlign || 'top',
              horzAlign: this._horzAlign || 'left',
              offsetX: this._offsetX || 0,
              offsetY: this._offsetY || 0,
              forceTextAlign: this._forceTextAlign,
            }
          if (
            ((o.points = e.isFixed() ? e.fixedPoints() : this._points),
            i.fillBackground && i.fillBackground.value() && (o.backgroundColor = i.backgroundColor.value()),
            i.drawBorder && i.drawBorder.value() && (o.borderColor = i.borderColor.value()),
            i.wordWrap && i.wordWrap.value() && (o.wordWrapWidth = i.wordWrapWidth.value()),
            (o.bold = i.bold && i.bold.value()),
            (o.italic = i.italic && i.italic.value()),
            (o.highlightBorder = a.selection().isSelected(e)),
            !e.isFixed() && i.fixedSize && !i.fixedSize.value())
          ) {
            o.scaleX = a.timeScale().barSpacing() / e.barSpacing()
            const i = Object(r.ensureNotNull)(t.priceRange())
            let n = t.height() / i.length()
            e.isPriceDencityLog() &&
              !t.isLog() &&
              (n = t.height() / (Object(d.toLog)(i.maxValue()) - Object(d.toLog)(i.minValue()))),
              !e.isPriceDencityLog() &&
                t.isLog() &&
                (n = t.height() / (Object(d.fromLog)(i.maxValue()) - Object(d.fromLog)(i.minValue())))
            const s = e.priceDencity()
            void 0 !== s && (o.scaleY = n / s),
              (void 0 === s || void 0 === o.scaleY || o.scaleY <= 0) && delete o.scaleY
          }
          this._textRenderer.setData(o)
          const u = 1 === o.points.length
          if (u && void 0 !== this._recalculateSourcePointsOnFirstUpdate) {
            this._renderer = null
            const e = this._textRenderer.measure()
            return (
              this._recalculateSourcePointsOnFirstUpdate(e.width, e.height),
              void (this._recalculateSourcePointsOnFirstUpdate = void 0)
            )
          }
          if (u && !this._noSelection) {
            const e = new l.CompositeRenderer()
            e.append(this._textRenderer)
            const t = o.points[0].clone(),
              i = this._textRenderer.measure(),
              r = i.width,
              s = i.height
            if (o.wordWrapWidth) {
              const i = new n.Point(t.x + r, t.y + s / 2)
              ;(i.data = 0), e.append(this.createLineAnchor({ points: [i], pointsCursorType: _ }, 0))
            }
            const d = new n.Point(t.x + r / 2, t.y + s)
            return (
              (d.data = 0),
              e.append(
                new h.SelectionRenderer({
                  points: [d],
                  bgColors: this._lineAnchorColors([d]),
                  visible: this.areAnchorsVisible(),
                  hittestResult: c.HitTestResult.MOVEPOINT,
                  barSpacing: a.timeScale().barSpacing(),
                }),
              ),
              void (this._renderer = e)
            )
          }
          this._renderer = this._textRenderer
        }
      }
    },
    'obU/': function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('GEp6').distanceToLine,
        s = i('hfHJ'),
        a = s.rotationMatrix,
        o = s.scalingMatrix,
        l = s.translationMatrix,
        h = s.transformPoint,
        d = i('aB9a').LineSourcePaneView,
        c = i('VdBB').HitTestResult,
        u = i('Zy3/').CompositeRenderer,
        _ = i('Tmoa'),
        p = i('aB9a').thirdPointCursorType,
        f = i('//lt').PaneCursorType,
        g = i('cPgM').ScaledPaneRenderer
      class v extends g {
        constructor() {
          super(), (this._data = null)
        }
        setData(e) {
          ;(this._data = e), (this._data.angleFrom = 0), (this._data.angleTo = 2 * Math.PI), (this._data.clockwise = !1)
        }
        _drawImpl(e) {
          if (!(null === this._data || this._data.points.length < 2)) {
            var t = this._data.points[0],
              i = this._data.points[1]
            if (this._data.points.length < 3)
              return (
                (e.strokeStyle = this._data.color),
                (e.lineWidth = this._data.linewidth),
                e.beginPath(),
                e.moveTo(t.x, t.y),
                e.lineTo(i.x, i.y),
                void e.stroke()
              )
            var s = this._data.points[2],
              d = n(t, i, s).distance
            if (d < 1)
              return (
                (e.strokeStyle = this._data.color),
                (e.lineWidth = this._data.linewidth),
                e.beginPath(),
                e.moveTo(t.x, t.y),
                e.lineTo(i.x, i.y),
                void e.stroke()
              )
            var c = i.subtract(t),
              u = t.add(i).scaled(0.5),
              p = new r(-c.y, c.x)
            ;(p = p.normalized()),
              (s = u.add(p.scaled(d))),
              (e.strokeStyle = this._data.color),
              (e.lineWidth = this._data.linewidth)
            var f = c.length(),
              g = c.x / f,
              v = c.y / f,
              w = Math.acos(g)
            v < 0 && (w = -w)
            var x = this._data.points[2],
              m = l(-u.x, -u.y)
            ;(x = h(m, x)),
              (m = a(-w)),
              (x = h(m, x)),
              (m = o(1, f / (2 * d))),
              (x = h(m, x)).y < 0 ? (this._data.clockwise = !0) : (this._data.clockwise = !1),
              e.save(),
              e.beginPath(),
              e.translate(u.x, u.y),
              e.rotate(w),
              e.scale(1, (2 * d) / f),
              e.arc(0, 0, 0.5 * f, this._data.angleFrom, this._data.angleTo, this._data.clockwise),
              e.restore(),
              e.stroke(),
              this._data.fillBackground &&
                ((e.fillStyle = _.generateColor(this._data.backcolor, this._data.transparency)), e.fill())
          }
        }
        _additionalPointTest(e, t) {
          return !0
        }
        hitTest(e) {
          if (null === this._data || this._data.points.length < 3) return null
          var t = this._data.points[0],
            i = this._data.points[1],
            s = this._data.points[2],
            d = n(t, i, s).distance,
            u = i.subtract(t),
            _ = t.add(i).scaled(0.5),
            p = new r(-u.y, u.x)
          ;(p = p.normalized()), (s = _.add(p.scaled(d)))
          var f = u.length(),
            g = u.x / f,
            v = u.y / f,
            w = Math.acos(g)
          v < 0 && (w = -w)
          var x = l(-_.x, -_.y)
          e = h(x, e)
          var m = h(x, this._data.points[2])
          ;(x = a(-w)), (e = h(x, e)), (m = h(x, m)), (x = o(1, f / (2 * d))), (e = h(x, e)), (m = h(x, m))
          var y = e.length()
          return this._additionalPointTest(e, m)
            ? Math.abs(y - 0.5 * f) <= 3
              ? new c(c.MOVEPOINT)
              : this._data.fillBackground && !this._data.noHitTestOnBackground && y <= 0.5 * f
              ? new c(c.MOVEPOINT_BACKGROUND)
              : null
            : null
        }
      }
      t.EllipsePaneView = class extends d {
        constructor(e, t) {
          super(e, t), (this._ellipseRenderer = new v()), (this._renderer = null)
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), !(this._points.length < 2))) {
            var e = {}
            ;(e.points = this._points),
              (e.color = this._source.properties().color.value()),
              (e.linewidth = this._source.properties().linewidth.value()),
              (e.backcolor = this._source.properties().backgroundColor.value()),
              (e.fillBackground = this._source.properties().fillBackground.value()),
              (e.transparency = this._source.properties().transparency.value()),
              this._ellipseRenderer.setData(e)
            var t = new u()
            t.append(this._ellipseRenderer)
            var i = e.points[0],
              s = e.points[1]
            if (2 === this._points.length) return this.addAnchors(t), void (this._renderer = t)
            var a = e.points[2],
              o = n(i, s, a).distance,
              l = s.subtract(i),
              h = i.add(s).scaled(0.5),
              d = new r(-l.y, l.x)
            ;(d = d.normalized()), (a = h.add(d.scaled(o)))
            var c = h.add(d.scaled(-o)),
              _ = new r(i.x, i.y)
            _.data = 0
            var g = new r(s.x, s.y)
            g.data = 1
            var v = new r(a.x, a.y)
            v.data = 2
            var w = new r(c.x, c.y)
            w.data = 3
            var x = p(_, g),
              m = [f.Default, f.Default, x, x]
            t.append(this.createLineAnchor({ points: [_, g, v, w], pointsCursorType: m }, 0)), (this._renderer = t)
          }
        }
      }
    },
    ocVb: function (e, t, i) {
      'use strict'
      var r = i('Eyy1').ensureNotNull,
        n = i('aO4+').Point,
        s = i('YFKU').t,
        a = i('aB9a').LineSourcePaneView,
        o = i('cjIn').PaneRendererCachedImage,
        l = i('Zy3/').CompositeRenderer,
        h = i('GH0z').PercentageFormatter,
        d = i('zXvd').NumericFormatter,
        c = i('nda6').TimeSpanFormatter,
        u = i('5C6T').PipFormatter,
        _ = i('vq8G').SelectionRenderer,
        p = i('pJOz').TrendLineRenderer,
        f = i('qgcf').TextRenderer,
        g = i('8xAY').LabelSettings,
        v = i('zDbI').CHART_FONT_FAMILY,
        w = i('VdBB').HitTestResult,
        x = i('FVHe').TrendLineStatsCache,
        m = i('c44N').areEqualPaneRenderParams,
        y = i('5/lF').iconsContainer,
        b = i('Ialn'),
        R = b.forceLTRStr,
        T = b.startWithLTR
      t.TrendLinePaneView = class extends a {
        constructor(e, t) {
          super(e, t),
            (this._label = null),
            (this._rendererCache = {}),
            (this._cacheInvalidated = !0),
            (this._percentageFormatter = new h()),
            (this._numericFormatter = new d()),
            (this._pipFormatter = null),
            (this._lastSymbolInfo = null),
            (this._trendRenderer = new p()),
            (this._labelRenderer = new f()),
            (this._renderer = null),
            (this._cache = null),
            (this._cacheDrawParams = null),
            (this._iconsReady = !1),
            y.onAllIconsReady().subscribe(this, function () {
              this._cache && (this._cache.destroy(), (this._cache = null)), (this._iconsReady = !0), t.lightUpdate()
            })
        }
        iconsReady() {
          return this._iconsReady
        }
        update() {
          super.update(), (this._cacheInvalidated = !0)
        }
        getCacheCanvas(e) {
          return this._createCacheIfRequired(e), r(this._cache).canvas()
        }
        getCacheRects(e, t) {
          this._createCacheIfRequired(e)
          var i = this._source.properties().statsPosition.value(),
            r = this._source.getPointByPosition(i, this._points[0], this._middlePoint, this._points[1]),
            n = {
              left: 0,
              top: this._cache.topByRow(this._statCache.rowIndex),
              width: this._cache.rowWidth(this._statCache.rowIndex),
              height: this._cache.rowHeight(this._statCache.rowIndex),
            },
            s = { left: Math.floor(r.x), top: Math.floor(r.y), width: n.width, height: n.height }
          return (
            (s.left += g.paddingLeftRight),
            (this._points[1].y < this._points[0].y && this._points[1].x < this._points[0].x) ||
            (this._points[1].y > this._points[0].y && this._points[1].x > this._points[0].x)
              ? (s.top -= g.paddingLeftRight + s.height)
              : (s.top += g.paddingLeftRight),
            { cacheRect: n, targetRect: s }
          )
        }
        _createCacheIfRequired(e) {
          ;(null != this._cache && null != this._cacheDrawParams && m(e, this._cacheDrawParams)) ||
            (this._cache && this._cache.destroy(),
            (this._cache = new x(e)),
            (this._statCache = this._cache.updateSource(
              this._source,
              function () {
                return this._statLabelData()
              }.bind(this),
            )),
            (this._cacheDrawParams = e),
            (this._cacheInvalidated = !1)),
            this._cacheInvalidated &&
              ((this._cacheState = this._cache.updateSource(
                this._source,
                function () {
                  return this._statLabelData()
                }.bind(this),
              )),
              (this._cacheInvalidated = !1))
        }
        destroy() {
          this._cache && (this._cache.destroy(), (this._cache = null)), y.onAllIconsReady().unsubscribeAll(this)
        }
        _updateImpl() {
          ;(this._renderer = null), (this._invalidated = !1)
          var e = this._source.priceScale(),
            t = this._model.timeScale()
          if (e && !e.isEmpty() && !t.isEmpty()) {
            var i = this._model.timeScale().visibleBarsStrictRange()
            if (null !== i) {
              var r = this._source.points()
              if (!(r.length < 2)) {
                var s = r[0],
                  a = r[1],
                  h = this._source.properties()
                if (
                  (!(s.index < i.firstBar() && a.index < i.firstBar()) ||
                    h.extendLeft.value() ||
                    h.extendRight.value()) &&
                  (super._updateImpl(), !(this._points.length < 2))
                ) {
                  var d = h.showBarsRange.value(),
                    c = h.showDateTimeRange.value(),
                    u = h.showDistance.value(),
                    p = h.showPriceRange.value(),
                    f = h.showAngle.value()
                  p ||
                    d ||
                    c ||
                    u ||
                    f ||
                    ((this._label = null),
                    this._labelData && ((this._labelData.text = ''), (this._labelData.lines = [])))
                  var g = new l(),
                    v = h.linecolor.value(),
                    x = {}
                  ;(x.points = this._points),
                    (x.floatPoints = this._floatPoints),
                    (x.width = t.width()),
                    (x.height = e.height()),
                    (x.color = v),
                    (x.linewidth = h.linewidth.value()),
                    (x.linestyle = h.linestyle.value()),
                    (x.extendleft = h.extendLeft.value()),
                    (x.extendright = h.extendRight.value()),
                    (x.leftend = h.leftEnd.value()),
                    (x.rightend = h.rightEnd.value()),
                    this._trendRenderer.setData(x),
                    g.append(this._trendRenderer)
                  var m =
                      ((this.isHoveredSource() || this.isSelectedSource()) && this.isEditMode()) ||
                      h.alwaysShowStats.value(),
                    y = (this.isHoveredSource() || this.isSelectedSource()) && h.showMiddlePoint.value()
                  if (m && 2 === this._points.length) {
                    var b = new o(this, 0)
                    g.append(b)
                  }
                  if (
                    (this._middlePoint &&
                      g.append(
                        new _({
                          points: [this._middlePoint],
                          bgColors: this._lineAnchorColors([this._middlePoint]),
                          color: v,
                          visible: y && this.areAnchorsVisible(),
                          hittestResult: w.REGULAR,
                        }),
                      ),
                    this.addAnchors(g),
                    h.showLabel && h.showLabel.value() && h.text.value().length > 0)
                  ) {
                    ;(s = this._points[0]), (a = this._points[1])
                    var R,
                      T = s.x < a.x ? s : a,
                      S = T === s ? a : s,
                      P = h.vertLabelsAlign.value(),
                      L = h.horzLabelsAlign.value()
                    R = 'left' === L ? T.clone() : 'right' === L ? S.clone() : new n((s.x + a.x) / 2, (s.y + a.y) / 2)
                    var C = Math.atan((S.y - T.y) / (S.x - T.x)),
                      M = {
                        points: [R],
                        text: h.text.value(),
                        color: h.textcolor.value(),
                        vertAlign: P,
                        horzAlign: L,
                        font: h.font.value(),
                        offsetX: 0,
                        offsetY: 0,
                        bold: h.bold.value(),
                        italic: h.italic.value(),
                        fontsize: h.fontsize.value(),
                        forceTextAlign: !0,
                        angle: C,
                      }
                    this._labelRenderer.setData(M), g.append(this._labelRenderer)
                  }
                  this._renderer = g
                }
              }
            }
          }
        }
        _statLabelData() {
          var e,
            t,
            i,
            r,
            n,
            a,
            o,
            l = this._source.points(),
            h = l[0],
            d = l[1],
            _ = this._source.properties(),
            p = []
          if (_.showPriceRange.value() && this._source.priceScale()) {
            var f = (r = d.price - h.price) / Math.abs(h.price)
            e =
              this._source.ownerSource().formatter().format(r) + ' (' + this._percentageFormatter.format(100 * f) + ')'
            var w = this._model.mainSeries().symbolInfo()
            w &&
              w !== this._lastSymbolInfo &&
              ((this._pipFormatter = new u(w.pricescale, w.minmov, w.type, w.minmove2)), (this._lastSymbolInfo = w)),
              (e += this._pipFormatter ? ', ' + this._pipFormatter.format(r) : ''),
              p.push('priceRange')
          }
          var x,
            m = _.showBarsRange.value(),
            y = _.showDateTimeRange.value(),
            b = _.showDistance.value(),
            S = _.showAngle.value()
          if (S || b) {
            var P = this._source.pointToScreenPoint(h)[0]
            ;(a = this._source.pointToScreenPoint(d)[0].subtract(P)), (o = Math.round(1e5 * a.length()) / 1e5)
          }
          if (m || y || b) {
            if (((t = ''), m && ((n = d.index - h.index), (t += s('{count} bars').format({ count: R(n) }))), y)) {
              var L = this._model.timeScale().indexToUserTime(h.index),
                C = this._model.timeScale().indexToUserTime(d.index)
              if (L && C) {
                var M = (C.valueOf() - L.valueOf()) / 1e3,
                  I = T(new c().format(M))
                I && (t += m ? ' (' + I + ')' : I)
              }
            }
            b &&
              (t && (t += ', '),
              (t += s('distance: {number} px').format({ number: R(this._numericFormatter.format(Math.round(o))) }))),
              t && p.push('barsRange')
          }
          S &&
            (o > 0 && ((a = a.normalized()), (x = Math.acos(a.x)), a.y > 0 && (x = -x)),
            'number' != typeof x ||
              TradingView.isNaN(x) ||
              ((i = Math.round((180 * x) / Math.PI) + 'º'), p.push('angle')))
          ;(this._label =
            [R(e), t, i]
              .filter(function (e) {
                return e
              })
              .join('\n') || null),
            (this._icons = p)
          var O = this._model.isDark(),
            N = O ? g.bgColorDark : g.bgColorLight,
            D = O ? g.textColorDark : g.textColorLight,
            B = {
              points: [this._points[1]],
              text: this._label,
              color: D,
              isDark: O,
              font: v,
              fontSize: g.fontSize,
              lineSpacing: g.lineSpacing,
              backgroundColor: N,
              backgroundRoundRect: g.rectRadius,
              paddingLeft: g.paddingLeftRight,
              paddingRight: g.paddingLeftRight,
              paddingTop: g.paddingTopBottom,
              paddingBottom: g.paddingTopBottom,
              textPadding: g.textPadding,
              doNotAlignText: !0,
              icons: this._icons,
            }
          return (
            this._points[1].y < this._points[0].y && (B.vertAlign = 'bottom'),
            this._points[1].x < this._points[0].x && (B.horzAlign = 'right'),
            (this._labelData = B),
            B
          )
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    pBAL: function (e, t, i) {
      'use strict'
      var r = i('aB9a').LineSourcePaneView,
        n = i('wacn').DisjointChannelRenderer,
        s = i('pJOz').TrendLineRenderer,
        a = i('qgcf').TextRenderer,
        o = i('Zy3/').CompositeRenderer,
        l = i('//lt').PaneCursorType,
        h = [l.Default, l.Default, l.VerticalResize, l.Default]
      t.DisjointChannelPaneView = class extends r {
        constructor(e, t) {
          super(e, t),
            (this._label = null),
            (this._trendLineRendererPoints12 = new s()),
            (this._trendLineRendererPoints43 = new s()),
            (this._disjointChannelRenderer = new n()),
            (this._p1LabelRenderer = new a()),
            (this._p2LabelRenderer = new a()),
            (this._p3LabelRenderer = new a()),
            (this._p4LabelRenderer = new a()),
            (this._renderer = null)
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            (this._renderer = null),
            (this._label = null),
            !(this._source.points().length < 2) && this._source.priceScale())
          ) {
            var e = this._source.points()[0],
              t = this._source.points()[1],
              i = this._source.ownerSource().firstValue()
            if (
              ((this._price1 = this._source.priceScale().formatPrice(e.price, i)),
              (this._price2 = this._source.priceScale().formatPrice(t.price, i)),
              3 === this._source.points().length)
            ) {
              var r = this._source.points()[2]
              this._price3 = this._source.priceScale().formatPrice(r.price, i)
              var n = t.price - e.price
              this._price4 = this._source.priceScale().formatPrice(r.price + n, i)
            }
            if (!(this._points.length < 2)) {
              var s,
                a = new o(),
                l = ((e = this._points[0]), (t = this._points[1]), this._source.properties()),
                d = this._model,
                c = this._source
              if (this._points.length >= 3) {
                ;((r = this._points[2]).x = t.x), (r.square = !0)
                var u = t.y - e.y
                if ((((s = e.clone()).y = r.y + u), (s.data = 3), l.fillBackground.value())) {
                  var _ = d.timeScale().width(),
                    p = c.priceScale().height(),
                    f = l.extendLeft.value(),
                    g = l.extendRight.value()
                  this._disjointChannelRenderer.setData({
                    width: _,
                    height: p,
                    extendleft: f,
                    extendright: g,
                    points: [e, t, r, s],
                    backcolor: l.backgroundColor.value(),
                    transparency: l.transparency.value(),
                    hittestOnBackground: TradingView.isMobile.any(),
                  }),
                    a.append(this._disjointChannelRenderer)
                }
              }
              var v = function (e, t) {
                  return {
                    points: [e, t],
                    width: d.timeScale().width(),
                    height: c.priceScale().height(),
                    color: l.linecolor.value(),
                    linewidth: l.linewidth.value(),
                    linestyle: l.linestyle.value(),
                    extendleft: l.extendLeft.value(),
                    extendright: l.extendRight.value(),
                    leftend: l.leftEnd.value(),
                    rightend: l.rightEnd.value(),
                  }
                },
                w = this,
                x = function (e, t, i, r, n, s) {
                  if (w._source.properties().showPrices.value()) {
                    var o = {
                      points: [i],
                      text: n,
                      color: w._source.properties().textcolor.value(),
                      horzAlign: i.x > r.x ? 'left' : 'right',
                      vertAlign: 'middle',
                      font: w._source.properties().font.value(),
                      offsetX: 6,
                      offsetY: 0,
                      boxPadding: 0,
                      bold: w._source.properties().bold.value(),
                      italic: w._source.properties().italic.value(),
                      fontsize: w._source.properties().fontsize.value(),
                      forceTextAlign: !0,
                    }
                    e.setData(o), a.append(e)
                    o = {
                      points: [r],
                      text: s,
                      color: w._source.properties().textcolor.value(),
                      horzAlign: i.x < r.x ? 'left' : 'right',
                      vertAlign: 'middle',
                      font: w._source.properties().font.value(),
                      offsetX: 6,
                      offsetY: 0,
                      boxPadding: 0,
                      bold: w._source.properties().bold.value(),
                      italic: w._source.properties().italic.value(),
                      fontsize: w._source.properties().fontsize.value(),
                      forceTextAlign: !0,
                    }
                    t.setData(o), a.append(t)
                  }
                }
              if (
                (this._trendLineRendererPoints12.setData(v(e, t)),
                a.append(this._trendLineRendererPoints12),
                x(this._p1LabelRenderer, this._p2LabelRenderer, e, t, this._price1, this._price2),
                2 === this._points.length)
              )
                return this.addAnchors(a), void (this._renderer = a)
              this._trendLineRendererPoints43.setData(v(s, r)),
                a.append(this._trendLineRendererPoints43),
                x(this._p3LabelRenderer, this._p4LabelRenderer, r, s, this._price3, this._price4)
              var m = [e, t, r, s]
              this._model.lineBeingCreated() === this._source && m.pop(),
                a.append(this.createLineAnchor({ points: m, pointsCursorType: h }, 0)),
                (this._renderer = a)
            }
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    pGCE: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'LineToolBeingCreatedPaneView', function () {
          return h
        })
      var r = i('aB9a'),
        n = i('8Uy/'),
        s = i('a7Ha'),
        a = i('Zy3/'),
        o = i('z+cS'),
        l = i('pJOz')
      class h extends r.LineSourcePaneView {
        constructor() {
          super(...arguments),
            (this._lineRenderer1 = new o.VerticalLineRenderer()),
            (this._lineRenderer2 = new o.VerticalLineRenderer()),
            (this._medianRenderer = new l.TrendLineRenderer()),
            (this._renderer = null)
        }
        renderer() {
          return this._invalidated && (this._updateImpl(), (this._invalidated = !1)), this._renderer
        }
        _updateImpl() {
          super._updateImpl(), (this._renderer = null)
          const e = this._getPoints()
          if (e.length < 1) return
          this._renderer = new a.CompositeRenderer()
          const [t, i] = e
          this._lineRenderer1.setData({ x: t.x, color: '#808080', linewidth: 1, linestyle: n.LINESTYLE_SOLID }),
            this._renderer.append(this._lineRenderer1),
            e.length > 1 &&
              (this._lineRenderer2.setData({ x: i.x, color: '#808080', linewidth: 1, linestyle: n.LINESTYLE_SOLID }),
              this._medianRenderer.setData({
                points: [t, i],
                color: '#808080',
                linewidth: 1,
                linestyle: n.LINESTYLE_SOLID,
                extendleft: !1,
                extendright: !1,
                leftend: s.LineEnd.Normal,
                rightend: s.LineEnd.Normal,
              }),
              this._renderer.append(this._lineRenderer2),
              this._renderer.append(this._medianRenderer))
        }
      }
    },
    piZW: function (e, t, i) {
      'use strict'
      i.r(t)
      var r = i('aO4+'),
        n = i('aB9a'),
        s = i('Zy3/'),
        a = i('cPgM'),
        o = i('VdBB'),
        l = i('jFln')
      class h extends a.ScaledPaneRenderer {
        constructor(e) {
          super(), (this._data = e)
        }
        hitTest(e, t) {
          const i = ((e.x - this._data.point.x) * Math.PI) / this._data.width
          let r = (Math.sin(i - Math.PI / 2) * this._data.height) / 2
          return (
            (r = this._data.point.y + r + this._data.height / 2),
            Math.abs(r - e.y) <= 3 ? new o.HitTestResult(o.HitTestResult.MOVEPOINT) : null
          )
        }
        _drawImpl(e, t) {
          ;(e.strokeStyle = this._data.color),
            (e.lineWidth = this._data.lineWidth),
            Object(l.setLineStyle)(e, this._data.lineStyle),
            e.beginPath(),
            e.moveTo(this._data.point.x, this._data.point.y)
          const i = Math.max(1, this._data.width / 30),
            r = t.cssWidth - this._data.point.x + i
          for (let t = 1; t <= r; t += i) {
            const i = (t * Math.PI) / this._data.width,
              r = (Math.sin(i - Math.PI / 2) * this._data.height) / 2
            e.lineTo(this._data.point.x + t, this._data.point.y + r + this._data.height / 2)
          }
          e.stroke()
        }
      }
      i.d(t, 'SineLinePaneView', function () {
        return d
      })
      class d extends n.LineSourcePaneView {
        constructor(e, t) {
          super(e, t), (this._renderer = new s.CompositeRenderer())
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(e, t), this._renderer
        }
        _updateImpl(e, t) {
          if ((super._updateImpl(), this._renderer.clear(), this._points.length < 2)) return
          const [i, n] = this._source.points()
          if (0 === 2 * Math.abs(i.index - n.index)) return void this.addAnchors(this._renderer)
          const [s, a] = this._points,
            o = Math.abs(s.x - a.x),
            l = a.y - s.y,
            d = this._source.properties(),
            c = d.linewidth.value()
          if ((s.y < -c && a.y < -c) || (s.y > e + c && a.y > e + c)) return
          const u = 2 * o,
            _ = s.x > 0 ? s.x - Math.ceil(s.x / u) * u : s.x + Math.floor(-s.x / u) * u,
            p = {
              point: new r.Point(_, s.y),
              width: o,
              height: l,
              color: d.linecolor.value(),
              lineWidth: d.linewidth.value(),
              lineStyle: d.linestyle.value(),
            }
          this._renderer.append(new h(p)), this.addAnchors(this._renderer)
        }
      }
    },
    qjB4: function (e, t, i) {
      e.exports = i.p + 'f55394b616ed1ae9462c37daab941d93.png'
    },
    tjxb: function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('aB9a').LineSourcePaneView,
        s = i('jkoZ'),
        a = i('VdBB').HitTestResult,
        o = i('cPgM').ScaledPaneRenderer
      class l extends o {
        constructor(e, t) {
          super(), (this._data = e), (this._adapter = t)
        }
        _textWidth(e) {
          if (0 === this._adapter.getText().length) return 0
          e.save(), (e.font = this._adapter.getFont())
          var t = e.measureText(this._adapter.getText()).width
          return e.restore(), 5 + t
        }
        _drawArrow(e, t, i) {
          e.save(), (e.strokeStyle = this._adapter.getArrowColor()), (e.fillStyle = this._adapter.getArrowColor())
          var r = this._adapter.getArrowHeight(),
            n = this._adapter.getDirection()
          e.translate(t - 2, i), 'buy' !== n && e.rotate(Math.PI), CanvasEx.drawArrow(e, 0, 0, 0, r, 4), e.restore()
        }
        _drawText(e, t, i) {
          var r = this._adapter.getText()
          if (r) {
            e.save(),
              (e.textAlign = 'center'),
              (e.textBaseline = 'middle'),
              (e.font = this._adapter.getFont()),
              (e.fillStyle = this._adapter.getTextColor())
            var n = t + this._textWidth(e) / 2,
              a = i + s.fontHeight(this._adapter.getFont()) / 2
            e.fillText(r, n, a - 1), e.restore()
          }
        }
        _drawImpl(e, t) {
          var i = Math.round(this._data.points[0].x),
            r = Math.round(this._data.points[0].y)
          this._drawArrow(e, i, r)
          var n = this._textWidth(e)
          if (0 !== n) {
            var a = this._adapter.getArrowHeight(),
              o = this._adapter.getArrowSpacing(),
              l = s.fontHeight(this._adapter.getFont()),
              h = 'buy' === this._adapter.getDirection() ? r + a + o : r - a - o - l
            this._drawText(e, Math.round(i + 0.5 - n / 2), h)
          }
        }
        hitTest(e) {
          var t,
            i,
            r = Math.round(this._data.points[0].x),
            n = Math.round(this._data.points[0].y),
            s = this._adapter.getArrowHeight()
          if (
            ('buy' === this._adapter.getDirection() ? ((t = n), (i = n + s)) : ((t = n - s), (i = n)),
            e.x >= r - 2 && e.x <= r + 2 && e.y >= t && e.y <= i)
          ) {
            var o = this._adapter.getTooltip()
            const e = () => {
              TradingView.TradingWidget && TradingView.TradingWidget.journalDialog()
            }
            return new a(a.CUSTOM, {
              clickHandler: e,
              tapHandler: e,
              tooltip: '' !== o ? { text: o, rect: { x: r, y: t, w: 2, h: i - t } } : null,
            })
          }
          return null
        }
      }
      class h extends n {
        _updateImpl() {
          super._updateImpl(), (this._renderer = null), (this._rendererCached = !1)
        }
        renderer(e, t) {
          if ((this._invalidated && this._updateImpl(), this._rendererCached)) return this._renderer
          this._rendererCached = !0
          var i = this._source,
            n = i.points()
          if (0 === n.length) return null
          var s = i._adapter,
            a = i._model.timeScale(),
            o = this._source._model
              .paneForSource(this._source)
              .executionsPositionController()
              .getXYCoordinate(s, a, n[0].index)
          if (!isFinite(o.y) || o.y < 0 || o.y > e || o.x < 0) return (this._renderer = null), null
          var h = { points: [new r(o.x, o.y)] }
          return (this._renderer = new l(h, s)), this._renderer
        }
      }
      ;(h.prototype._renderer = null), (h.prototype._rendererCached = !1), (t.ExecutionPaneView = h)
    },
    'u+oH': function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('YFKU').t,
        s = i('aB9a').LineSourcePaneView,
        a = i('pJOz').TrendLineRenderer,
        o = i('qgcf').TextRenderer,
        l = i('IjC5').RectangleRenderer,
        h = i('VdBB').HitTestResult,
        d = i('Zy3/').CompositeRenderer,
        c = i('GH0z').PercentageFormatter,
        u = i('zXvd').NumericFormatter,
        _ = i('5C6T').PipFormatter,
        p = i('Tmoa'),
        f = i('a7Ha').LineEnd,
        g = i('wGNx').RiskRewardPointIndex,
        v = i('Ialn').forceLTRStr,
        w = i('//lt').PaneCursorType,
        x = [w.Default, w.HorizontalResize, w.VerticalResize, w.VerticalResize]
      class m extends s {
        constructor(e, t) {
          super(e, t),
            (this._percentageFormatter = new c()),
            (this._numericFormatter = new u()),
            (this._pipFormatter = null),
            (this._lastSymbolInfo = null),
            (this._entryLineRenderer = new a()),
            (this._stopLineRenderer = new a()),
            (this._targetLineRenderer = new a()),
            (this._positionLineRenderer = new a()),
            (this._fullStopBgRenderer = new l(new h(h.MOVEPOINT), new h(h.MOVEPOINT))),
            (this._stopBgRenderer = new l(new h(h.MOVEPOINT), new h(h.MOVEPOINT))),
            (this._fullTargetBgRenderer = new l(new h(h.MOVEPOINT), new h(h.MOVEPOINT))),
            (this._targetBgRenderer = new l(new h(h.MOVEPOINT), new h(h.MOVEPOINT))),
            (this._stopLabelRenderer = new o()),
            (this._middleLabelRenderer = new o()),
            (this._profitLabelRenderer = new o()),
            (this._renderer = null)
        }
        _formatInTicks(e) {
          var t = this._model.mainSeries().base()
          return Math.round(e * t)
        }
        isLabelVisible() {
          return this.isHoveredSource() || this.isSelectedSource() || this._source.properties().alwaysShowStats.value()
        }
        _updateImpl() {
          super._updateImpl(), (this._renderer = null), (this._stopLevel = null), (this._profitLevel = null)
          var e = this._model.timeScale(),
            t = this._source.priceScale()
          if (t && !t.isEmpty() && !e.isEmpty()) {
            var i = this._source.points()
            if (!(i.length < 2 || this._points.length < 2)) {
              var n = this._model.mainSeries(),
                s = n.bars()
              if (0 !== s.length && null !== s.last()) {
                this._isClosed = 4 === i.length
                var a = this._source.lastBarData()
                if (a) {
                  var o = this._source.stopPrice(),
                    l = this._source.profitPrice()
                  this._pl = this._source.calculatePL(a.closePrice)
                  var h = this._source.ownerSource().firstValue()
                  ;(this._entryLevel = this._points[g.Entry].y),
                    (this._stopLevel = t.priceToCoordinate(o, h)),
                    (this._profitLevel = t.priceToCoordinate(l, h)),
                    (this._closeLevel = t.priceToCoordinate(a.closePrice, h)),
                    (this._closeBar = this._source._model.timeScale().indexToCoordinate(a.index))
                  var c = new d(),
                    u = this,
                    w = this._source.properties(),
                    m = this._points[g.Entry].x,
                    y = this._points[g.ActualEntry] ? this._points[g.ActualEntry].x : this._points[g.Close].x,
                    b = this._points[g.ActualClose] ? this._points[g.ActualClose].x : this._points[g.Close].x,
                    R = this._points[g.Close].x,
                    T = new r(m, this._entryLevel),
                    S = new r(R, this._stopLevel)
                  if (
                    (((I = {}).points = [T, S]),
                    (I.color = 'white'),
                    (I.linewidth = 0),
                    (I.backcolor = w.stopBackground.value()),
                    (I.fillBackground = !0),
                    (I.transparency = w.stopBackgroundTransparency.value()),
                    (I.extendLeft = !1),
                    (I.extendRight = !1),
                    this._fullStopBgRenderer.setData(I),
                    c.append(this._fullStopBgRenderer),
                    this._pl < 0 && y !== b)
                  ) {
                    ;(T = new r(y, this._entryLevel)), (S = new r(b, this._closeLevel))
                    ;((I = {}).points = [T, S]),
                      (I.color = 'white'),
                      (I.linewidth = 0),
                      (I.backcolor = w.stopBackground.value()),
                      (I.fillBackground = !0)
                    var P = 100 - 100 * (1 - (L = 0.01 * w.stopBackgroundTransparency.value()) * L * L)
                    ;(I.transparency = P),
                      (I.extendLeft = !1),
                      (I.extendRight = !1),
                      this._stopBgRenderer.setData(I),
                      c.append(this._stopBgRenderer)
                  }
                  ;(T = new r(m, this._entryLevel)), (S = new r(R, this._profitLevel))
                  if (
                    (((I = {}).points = [T, S]),
                    (I.color = 'white'),
                    (I.linewidth = 0),
                    (I.backcolor = w.profitBackground.value()),
                    (I.fillBackground = !0),
                    (I.transparency = w.profitBackgroundTransparency.value()),
                    (I.extendLeft = !1),
                    (I.extendRight = !1),
                    this._fullTargetBgRenderer.setData(I),
                    c.append(this._fullTargetBgRenderer),
                    this._pl > 0 && y !== b)
                  ) {
                    ;(T = new r(y, this._entryLevel)), (S = new r(b, this._closeLevel))
                    ;((I = {}).points = [T, S]),
                      (I.color = 'white'),
                      (I.linewidth = 0),
                      (I.backcolor = w.profitBackground.value()),
                      (I.fillBackground = !0)
                    var L,
                      C = 100 - 100 * (1 - (L = 0.01 * w.profitBackgroundTransparency.value()) * L * L)
                    ;(I.transparency = C),
                      (I.extendLeft = !1),
                      (I.extendRight = !1),
                      this._targetBgRenderer.setData(I),
                      c.append(this._targetBgRenderer)
                  }
                  var M = function (e, t, i, r) {
                    var n = {}
                    ;(n.points = [t, i]),
                      (n.width = u._model.timeScale().width()),
                      (n.height = u._source.priceScale().height()),
                      (n.color = r || u._source.properties().linecolor.value()),
                      (n.linewidth = u._source.properties().linewidth.value()),
                      (n.linestyle = CanvasEx.LINESTYLE_SOLID),
                      (n.extendleft = !1),
                      (n.extendright = !1),
                      (n.leftend = f.Normal),
                      (n.rightend = f.Normal),
                      e.setData(n),
                      c.append(e)
                  }
                  if (this._points[g.ActualEntry]) {
                    var I
                    ;(T = this._points[g.ActualEntry]),
                      (S = this._isClosed ? this._points[g.ActualClose] : new r(this._closeBar, this._closeLevel))
                    ;((I = {}).points = [T, S]),
                      (I.width = u._model.timeScale().width()),
                      (I.height = u._source.priceScale().height()),
                      (I.color = u._source.properties().linecolor.value()),
                      (I.linewidth = 1),
                      (I.linestyle = CanvasEx.LINESTYLE_DASHED),
                      (I.extendleft = !1),
                      (I.extendright = !1),
                      (I.leftend = f.Normal),
                      (I.rightend = f.Arrow),
                      this._positionLineRenderer.setData(I),
                      c.append(this._positionLineRenderer)
                  }
                  u = this
                  var O = function (e, t, i, r, n, s, a) {
                      if (u.isLabelVisible()) {
                        var o = {}
                        ;(o.points = [t]),
                          (o.text = i),
                          (o.color = w.textcolor.value()),
                          (o.font = w.font.value()),
                          (o.offsetX = 3),
                          (o.offsetY = s),
                          (o.vertAlign = n),
                          (o.horzAlign = 'center'),
                          (o.backgroundRoundRect = 4),
                          (o.backgroundColor = p.resetTransparency(r)),
                          (o.fontsize = w.fontsize.value()),
                          (o.backgroundHorzInflate = 4),
                          a && (o.borderColor = a),
                          e.setData(o),
                          c.append(e)
                      }
                    },
                    N = this._source.entryPrice(),
                    D = this._source.stopPrice(),
                    B = this._source.profitPrice(),
                    k = Math.abs(D - N),
                    A = Math.round((1e4 * k) / N) / 100,
                    E = Math.abs(B - N),
                    z = Math.round((1e4 * E) / N) / 100,
                    j = Math.abs(N - B) / Math.abs(N - D)
                  ;(T = new r(m, this._points[g.Entry].y)), (S = new r(R, this._points[g.Entry].y))
                  M(this._entryLineRenderer, T, S)
                  var V = new r((m + R) / 2, Math.round(this._points[0].y) + 0.5),
                    H = '',
                    W = '',
                    F = this._numericFormatter.format(Math.round(100 * j) / 100)
                  this._points[1] &&
                    void 0 !== this._pl &&
                    (W = this._source.ownerSource().formatter().format(this._pl))
                  var Y = w.qty.value() / w.lotSize.value(),
                    U = n.symbolInfo(),
                    Z =
                      'bitcoin' === U.type || 'crypto' === U.type || 'futures' === U.type
                        ? Math.round(1e3 * Y) / 1e3
                        : Math.floor(Y)
                  if (w.compact.value()) (H += W ? W + ' ~ ' : ''), (H += Z + '\n'), (H += F)
                  else {
                    var q = this._isClosed ? this.i18nCache.closed : this.i18nCache.open
                    ;(H += W ? this.i18nCache.pnl.format({ status: q, pnl: W }) + ', ' : ''),
                      (H += this.i18nCache.qty.format({ qty: Z }) + '\n'),
                      (H += this.i18nCache.ratio.format({ ratio: F }) + ' ')
                  }
                  var G = w.linecolor.value()
                  this._pl < 0 ? (G = w.stopBackground.value()) : this._pl > 0 && (G = w.profitBackground.value()),
                    O(this._middleLabelRenderer, V, H, G, 'middle', 0, 'white')
                  ;(T = new r(m, this._stopLevel)), (S = new r(R, this._stopLevel))
                  M(this._stopLineRenderer, T, S, w.stopBackground.value()),
                    U &&
                      U !== this._lastSymbolInfo &&
                      ((this._pipFormatter = new _(U.pricescale, U.minmov, U.type, U.minmove2)),
                      (this._lastSymbolInfo = U))
                  ;(V = new r((m + R) / 2, this._stopLevel)), (H = '')
                  var Q = this._source.ownerSource().formatter().format(k),
                    X = this._percentageFormatter.format(A)
                  ;(H = w.compact.value()
                    ? Q + ' (' + X + ') ' + w.amountStop.value()
                    : this.i18nCache.stop.format({
                        stopChange: v(this._source.ownerSource().formatter().format(k)),
                        stopChangePercent: v(this._percentageFormatter.format(A)),
                        stopChangePip: this._pipFormatter ? v(this._pipFormatter.format(k)) : '',
                        amount: v(w.amountStop.value()),
                      })),
                    O(this._stopLabelRenderer, V, H, w.stopBackground.value(), N < D ? 'bottom' : 'top', 0)
                  ;(T = new r(m, this._profitLevel)), (S = new r(R, this._profitLevel))
                  M(this._targetLineRenderer, T, S, w.profitBackground.value())
                  ;(V = new r((m + R) / 2, this._profitLevel)),
                    (H = ''),
                    (Q = this._source.ownerSource().formatter().format(E)),
                    (X = this._percentageFormatter.format(z))
                  ;(H = w.compact.value()
                    ? Q + ' (' + X + ') ' + w.amountTarget.value()
                    : this.i18nCache.target.format({
                        profitChange: v(this._source.ownerSource().formatter().format(E)),
                        profitChangePercent: v(this._percentageFormatter.format(z)),
                        profitChangePip: this._pipFormatter ? v(this._pipFormatter.format(E)) : '',
                        amount: v(w.amountTarget.value()),
                      })),
                    O(this._profitLabelRenderer, V, H, w.profitBackground.value(), N < D ? 'top' : 'bottom', 0)
                  var J = this._points[0].clone()
                  J.data = 0
                  var K = new r(m, this._stopLevel)
                  ;(K.data = 2), (K.square = !0)
                  var $ = new r(m, this._profitLevel)
                  ;($.data = 3), ($.square = !0)
                  var ee = new r(R, J.y)
                  ;(ee.data = 1), (ee.square = !0)
                  var te = { points: [J, ee, K, $], pointsCursorType: x }
                  c.append(this.createLineAnchor(te, 0)), (this._renderer = c)
                }
              }
            }
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
      ;(m.prototype.i18nCache = {
        pnl: n('{status} P&L: {pnl}'),
        open: n('Open', { context: 'line_tool_position' }),
        closed: n('Closed', { context: 'line_tool_position' }),
        ratio: n('Risk/Reward Ratio: {ratio}'),
        stop: n('Stop: {stopChange} ({stopChangePercent}) {stopChangePip}, Amount: {amount}'),
        target: n('Target: {profitChange} ({profitChangePercent}) {profitChangePip}, Amount: {amount}'),
        qty: n('Qty: {qty}'),
      }),
        (t.RiskRewardPaneView = m)
    },
    uRW3: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'HighlighterPaneView', function () {
          return s
        })
      var r = i('8Uy/'),
        n = i('hzaj')
      class s extends n.a {
        _createPolygonRendererData() {
          const e = this._source.properties().childs()
          return {
            points: this._points,
            color: e.linecolor.value(),
            linewidth: 20,
            backcolor: 'rgba(0, 0, 0, 0)',
            fillBackground: !1,
            linestyle: r.LINESTYLE_SOLID,
            linecap: 'round',
            linejoin: 'round',
            filled: !1,
            transparency: e.transparency.value(),
          }
        }
      }
    },
    wacn: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'DisjointChannelRenderer', function () {
          return _
        })
      var r = i('Eyy1'),
        n = i('aO4+'),
        s = i('f6yo'),
        a = i('GEp6'),
        o = i('hBTJ'),
        l = i('8Uy/'),
        h = i('VdBB'),
        d = i('NN6M'),
        c = i('Tmoa'),
        u = i('cPgM')
      class _ {
        constructor() {
          ;(this._parallelChannelRenderer = new d.ParallelChannelRenderer()),
            (this._disjointChannelIntersectionRenderer = new p()),
            (this._selectedRenderer = this._disjointChannelIntersectionRenderer)
        }
        setData(e) {
          if (e.points.length < 4) return
          const [t, i, r, s] = e.points
          if (
            Object(n.equalPoints)(t, i) ||
            Object(n.equalPoints)(r, s) ||
            (Object(a.distanceToLine)(t, i, r).distance < 1e-6 && Object(a.distanceToLine)(t, i, s).distance < 1e-6)
          )
            this._selectedRenderer = null
          else {
            null !== Object(o.intersectLines)(Object(n.lineThroughPoints)(t, i), Object(n.lineThroughPoints)(r, s))
              ? (this._disjointChannelIntersectionRenderer.setData(e),
                (this._selectedRenderer = this._disjointChannelIntersectionRenderer))
              : (this._parallelChannelRenderer.setData({
                  extendleft: e.extendleft,
                  extendright: e.extendright,
                  points: [t, i, s, r],
                  fillBackground: !0,
                  backcolor: e.backcolor,
                  transparency: e.transparency,
                  color: 'rgba(0,0,0,0)',
                  linestyle: l.LINESTYLE_SOLID,
                  linewidth: 0,
                  showMidline: !1,
                  hittestOnBackground: e.hittestOnBackground,
                }),
                (this._selectedRenderer = this._parallelChannelRenderer))
          }
        }
        hitTest(e, t) {
          return null !== this._selectedRenderer ? this._selectedRenderer.hitTest(e, t) : null
        }
        draw(e, t) {
          null !== this._selectedRenderer && this._selectedRenderer.draw(e, t)
        }
      }
      class p extends u.ScaledPaneRenderer {
        constructor() {
          super(...arguments), (this._data = null)
        }
        setData(e) {
          this._data = e
        }
        hitTest(e, t) {
          if (null === this._data || !this._data.hittestOnBackground) return null
          for (const i of this._visiblePolygons(t))
            if (Object(s.pointInPolygon)(e, i)) return new h.HitTestResult(h.HitTestResult.MOVEPOINT_BACKGROUND)
          return null
        }
        _drawImpl(e, t) {
          if (!(null === this._data || this._data.points.length < 4)) {
            e.fillStyle = Object(c.generateColor)(this._data.backcolor, this._data.transparency)
            for (const i of this._visiblePolygons(t)) {
              e.beginPath(), e.moveTo(i[0].x, i[0].y)
              for (let t = 1; t < i.length; t++) e.lineTo(i[t].x, i[t].y)
              e.fill()
            }
          }
        }
        _visiblePolygons(e) {
          const t = Object(r.ensureNotNull)(this._data),
            [i, s, a, l] = t.points
          if (e.cssWidth <= 0 || e.cssHeight <= 0) return []
          const h = Object(o.intersectLines)(Object(n.lineThroughPoints)(i, s), Object(n.lineThroughPoints)(a, l))
          if (null === h) return []
          const d = [
              new n.Point(0, 0),
              new n.Point(e.cssWidth, 0),
              new n.Point(e.cssWidth, e.cssHeight),
              new n.Point(0, e.cssHeight),
            ],
            c = []
          {
            let e = d
            const r = i.subtract(s).add(h),
              n = l.subtract(a).add(h)
            ;(e = f(e, h, r, [n, n])), (e = v(e, t)), (e = f(e, n, h, [r, r])), null !== e && c.push(e)
          }
          {
            let e = d
            const r = s.subtract(i).add(h),
              n = a.subtract(l).add(h)
            ;(e = f(e, h, r, [n, n])), (e = v(e, t)), (e = f(e, n, h, [r, r])), null !== e && c.push(e)
          }
          return c
        }
      }
      function f(e, t, i, r) {
        const s = Object(n.equalPoints)(i, r[0]) ? (Object(n.equalPoints)(i, r[1]) ? null : r[1]) : r[0]
        return null !== e && null !== s
          ? Object(o.intersectPolygonAndHalfplane)(
              e,
              Object(n.halfplaneThroughPoint)(Object(n.lineThroughPoints)(t, i), s),
            )
          : null
      }
      function g(e, t, i) {
        return null !== e
          ? Object(o.intersectPolygonAndHalfplane)(
              e,
              Object(n.halfplaneThroughPoint)(((r = t), Object(n.line)(1, 0, -r)), new n.Point(i, 0)),
            )
          : null
        var r
      }
      function v(e, t) {
        const [i, r] = t.points
        return t.extendleft || (e = g(e, i.x, r.x)), t.extendright || (e = g(e, r.x, i.x)), e
      }
    },
    wdUH: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'GannFixedPaneView', function () {
          return d
        })
      var r = i('aO4+'),
        n = i('aB9a'),
        s = i('pJOz'),
        a = i('Zy3/'),
        o = i('a7Ha'),
        l = i('8Uy/'),
        h = i('amvX')
      class d extends n.LineSourcePaneView {
        constructor(e, t) {
          super(e, t),
            (this._verticalLevelsRenderers = []),
            (this._horizontalLevelsRenderers = []),
            (this._fanRenderers = []),
            (this._arcRenderers = []),
            (this._renderer = null),
            this._initRenderers()
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          super._updateImpl(), (this._renderer = null)
          const e = this._getSource(),
            t = this._getPoints(),
            i = e.getScreenPoints()
          if (t.length < 2 || i.length < 2) return
          const [r, n] = i
          ;(t[1] = r), (t[1].data = 1), (t[2] = n)
          const s = this._getPoints(),
            o = new a.CompositeRenderer()
          if (s.length < 2) return this.addAnchors(o), void (this._renderer = o)
          const l = s[0],
            h = 3 === s.length ? s[2] : s[1],
            d = h.x - l.x,
            c = h.y - l.y,
            u = l,
            _ = h,
            p = this._getModel(),
            f = { barsCoordsRange: d, priceCoordsRange: c, startPoint: u, endPoint: _, p1: l, p2: h }
          this._prepareLevels(o, f), this._prepareFanLines(o, f), this._prepareArcs(o, f)
          const g = [l, s[1]]
          p.lineBeingCreated() === e && g.pop(), o.append(this.createLineAnchor({ points: g }, 0)), (this._renderer = o)
        }
        _initRenderers() {
          const e = this._getSource(),
            t = e.levelsCount()
          for (let e = 0; e < t; e++)
            this._verticalLevelsRenderers.push(new s.TrendLineRenderer()),
              this._horizontalLevelsRenderers.push(new s.TrendLineRenderer())
          const i = e.fanLinesCount()
          for (let e = 0; e < i; e++) this._fanRenderers.push(new s.TrendLineRenderer())
          const r = e.arcsCount()
          for (let e = 0; e < r; e++) this._arcRenderers.push(new h.a())
        }
        _prepareLevels(e, t) {
          const { startPoint: i, endPoint: n, barsCoordsRange: s, priceCoordsRange: a } = t,
            h = this._getSource().levels()
          for (const t of h) {
            if (!t.visible) continue
            const h = t.index / 5,
              d = i.x + h * s,
              c = {
                points: [new r.Point(d, i.y), new r.Point(d, n.y)],
                color: t.color,
                linewidth: t.width,
                linestyle: l.LINESTYLE_SOLID,
                extendleft: !1,
                extendright: !1,
                leftend: o.LineEnd.Normal,
                rightend: o.LineEnd.Normal,
              },
              u = this._verticalLevelsRenderers[t.index]
            u.setData(c), e.append(u)
            const _ = i.y + h * a,
              p = {
                points: [new r.Point(i.x, _), new r.Point(n.x, _)],
                color: t.color,
                linewidth: t.width,
                linestyle: l.LINESTYLE_SOLID,
                extendleft: !1,
                extendright: !1,
                leftend: o.LineEnd.Normal,
                rightend: o.LineEnd.Normal,
              },
              f = this._horizontalLevelsRenderers[t.index]
            f.setData(p), e.append(f)
          }
        }
        _prepareFanLines(e, t) {
          const { p1: i, startPoint: n, endPoint: s, barsCoordsRange: a, priceCoordsRange: h } = t,
            d = this._getSource().fanLines()
          for (const t of d) {
            if (!t.visible) continue
            const d = t.x,
              c = t.y
            let u, _
            if (d > c) {
              u = s.x
              const e = c / d
              _ = n.y + e * h
            } else {
              _ = s.y
              const e = d / c
              u = n.x + e * a
            }
            const p = {
                points: [i, new r.Point(u, _)],
                color: t.color,
                linewidth: t.width,
                linestyle: l.LINESTYLE_SOLID,
                extendleft: !1,
                extendright: !1,
                leftend: o.LineEnd.Normal,
                rightend: o.LineEnd.Normal,
              },
              f = this._fanRenderers[t.index]
            f.setData(p), e.append(f)
          }
        }
        _prepareArcs(e, t) {
          const { p1: i, startPoint: n, endPoint: s, barsCoordsRange: a, priceCoordsRange: o } = t
          let l = i
          const h = this._getSource(),
            d = h.isArcsBackgroundFilled(),
            c = h.arcsBackgroundTransparency(),
            u = h.arcs()
          for (const t of u) {
            if (!t.visible) continue
            const i = t.x / 5,
              h = t.y / 5,
              u = n.x + i * a,
              _ = n.y + h * o,
              p = {
                center: n,
                point: new r.Point(u, _),
                edge: s,
                color: t.color,
                linewidth: t.width,
                fillBack: d,
                transparency: c,
                prevPoint: l,
              },
              f = this._arcRenderers[t.index]
            f.setData(p), e.append(f), (l = p.point)
          }
        }
      }
    },
    wgWl: function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('aB9a').LineSourcePaneView,
        s = i('z+cS').VerticalLineRenderer,
        a = i('qgcf').TextRenderer,
        o = i('IjC5').RectangleRenderer,
        l = i('pJOz').TrendLineRenderer,
        h = i('VdBB').HitTestResult,
        d = i('Zy3/').CompositeRenderer,
        c = i('a7Ha').LineEnd
      t.FibTimeZonePaneView = class extends n {
        constructor(e, t) {
          super(e, t), (this._levels = []), (this._trendRenderer = new l()), (this._renderer = null)
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            (this._renderer = null),
            !(this._source.points().length < 1) &&
              this._source.priceScale() &&
              !this._source.priceScale().isEmpty() &&
              !this._model.timeScale().isEmpty())
          ) {
            var e = this._source.points()[0]
            2 === this._source.points().length && (v = this._source.points()[1])
            var t = this._source.properties(),
              i = this._source.points()[0].index
            if (null !== this._model.timeScale().visibleBarsStrictRange()) {
              this._levels = []
              for (var n = v ? v.index - e.index : 1, l = 1; l <= 11; l++) {
                var u = t['level' + l]
                if (u.visible.value()) {
                  var _ = Math.round(i + u.coeff.value() * n),
                    p = {
                      index: l,
                      x: this._model.timeScale().indexToCoordinate(_),
                      color: u.color.value(),
                      width: u.linewidth.value(),
                      style: u.linestyle.value(),
                    }
                  t.showLabels.value() && ((p.text = u.coeff.value()), (p.y = this._source.priceScale().height())),
                    this._levels.push(p)
                }
              }
              var f = new d()
              if ((t = this._source.properties()).fillBackground.value())
                for (l = 1; l < this._levels.length; l++) {
                  var g = this._levels[l - 1],
                    v = ((e = new r(this._levels[l].x, 0)), new r(g.x, this._source.priceScale().height())),
                    w = {}
                  ;(w.points = [e, v]),
                    (w.color = this._levels[l].color),
                    (w.linewidth = 0),
                    (w.backcolor = this._levels[l].color),
                    (w.fillBackground = !0),
                    (w.transparency = t.transparency.value()),
                    (w.extendLeft = !1),
                    (w.extendRight = !1),
                    (m = new o(void 0, void 0, !0)).setData(w),
                    f.append(m)
                }
              for (l = 0; l < this._levels.length; l++) {
                var x = {}
                ;(x.x = this._levels[l].x),
                  (x.color = this._levels[l].color),
                  (x.linewidth = this._levels[l].width),
                  (x.linestyle = this._levels[l].style)
                var m,
                  y = new h(h.MOVEPOINT, null, this._levels[l].index)
                if (((m = new s()).setData(x), m.setHitTest(y), f.append(m), void 0 !== this._levels[l].text)) {
                  var b,
                    R = t.horzLabelsAlign.value()
                  switch (
                    ((R = 'left' === R ? 'right' : 'right' === R ? 'left' : 'center'), t.vertLabelsAlign.value())
                  ) {
                    case 'top':
                      b = new r(this._levels[l].x, 0)
                      break
                    case 'middle':
                      b = new r(this._levels[l].x, 0.5 * this._levels[l].y)
                      break
                    case 'bottom':
                      b = new r(this._levels[l].x, this._levels[l].y)
                  }
                  var T = {
                    points: [b],
                    text: '' + this._levels[l].text,
                    color: x.color,
                    vertAlign: t.vertLabelsAlign.value(),
                    horzAlign: R,
                    font: t.font.value(),
                    offsetX: 2,
                    offsetY: 0,
                    fontsize: 12,
                  }
                  f.append(new a(T))
                }
              }
              if (2 === this._points.length) {
                var S = {
                  points: [this._points[0], this._points[1]],
                  color: t.trendline.color.value(),
                  linewidth: t.trendline.linewidth.value(),
                  linestyle: t.trendline.linestyle.value(),
                  extendleft: !1,
                  extendright: !1,
                  leftend: c.Normal,
                  rightend: c.Normal,
                }
                this._trendRenderer.setData(S), f.append(this._trendRenderer)
              }
              2 === this._source.points().length
                ? f.append(this.createLineAnchor({ points: this._points }, 0))
                : this._points.length > 0 &&
                  f.append(
                    this.createLineAnchor(
                      {
                        points: [new r(this._points[0].x, this._source.priceScale().height() / 2)],
                        hittestResult: h.MOVEPOINT,
                      },
                      0,
                    ),
                  ),
                (this._renderer = f)
            }
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    xUGI: function (e, t, i) {
      'use strict'
      var r = i('GH0z').PercentageFormatter,
        n = i('zXvd').NumericFormatter,
        s = i('zDbI').CHART_FONT_FAMILY,
        a = i('d1Pk').fibLevelPrice,
        o = i('ikwP').drawScaled
      function l(e, t, i) {
        ;(this._fibLevelsBasedOnLogScaleProperty = e),
          (this._sourcesToRow = {}),
          (this._rowsToSources = {}),
          (this._currentSymbol = ''),
          (this._actualCapacity = 1),
          (this._actualWidth = 1),
          (this._numericFormatter = new n()),
          (this._percentageFormatter = new r()),
          (this._pixelRatio = i.pixelRatio),
          this._recreateCanvas(this._actualWidth, l.ROW_HEIGHT * this._actualCapacity),
          (this._levelsCount = t)
      }
      ;(l.prototype.destroy = function () {
        ;(this._canvas = null), (this._cache = null)
      }),
        (l.prototype.topByRow = function (e) {
          return e * l.ROW_HEIGHT
        }),
        (l.prototype.rowHeight = function (e) {
          return l.ROW_HEIGHT
        }),
        (l.prototype.devicePixelRatio = function () {
          return (this._canvas && this._canvas.pixelRatio) || 0
        }),
        (l.prototype._recreateCanvas = function (e, t) {
          ;(this._canvas = document.createElement('canvas')),
            (this._canvas.width = Math.ceil(e * this._pixelRatio)),
            (this._canvas.height = Math.ceil(t * this._actualCapacity * this._pixelRatio)),
            (this._cache = this._canvas.getContext('2d')),
            (this._cache.font = '12px ' + s)
        }),
        (l.prototype.canvas = function () {
          return this._canvas
        }),
        (l.ROW_HEIGHT = 14),
        (l.prototype.points = function (e) {
          return [e.points()[0], e.points()[1]]
        }),
        (l.prototype._selectStartPrice = function (e, t) {
          return t ? e.points()[0].price : e.points()[1].price
        }),
        (l.prototype.startPoint = function (e, t) {
          var i = this._selectStartPrice(e, t)
          if (!this._calculateLogLevels(e)) return { price: i }
          var r = e.ownerSource().firstValue()
          return { price: i, coordinate: e.priceScale().priceToCoordinate(i, r) }
        }),
        (l.prototype._calculatePriceRange = function (e, t, i) {
          return i ? t.price - e.price : e.price - t.price
        }),
        (l.prototype.priceRange = function (e, t) {
          var i = this.points(e),
            r = i[0],
            n = i[1],
            s = this._calculatePriceRange(r, n, t)
          if (!this._calculateLogLevels(e)) return { price: s }
          var a = e.priceScale(),
            o = e.ownerSource().firstValue(),
            l = a.priceToCoordinate(r.price, o),
            h = a.priceToCoordinate(n.price, o)
          return { price: s, coordinate: t ? h - l : l - h }
        }),
        (l.prototype.sourceIsReady = function (e) {
          return e.points().length >= 2
        }),
        (l.prototype._calculateLogLevels = function (e) {
          return e.fibLevelsBasedOnLogScale && e.fibLevelsBasedOnLogScale()
        }),
        (l.prototype._calculateWidth = function (e) {
          if (!this.sourceIsReady(e)) return null
          var t = this._canvas.getContext('2d')
          t.font = '12px ' + s
          var i = !!e.properties().showPrices && e.properties().showPrices.value(),
            r = !!e.properties().coeffsAsPercents && e.properties().coeffsAsPercents.value(),
            n = e.properties().showCoeffs.value(),
            o = this.points(e),
            l = o[0],
            h = o[1]
          if (!l || !h) return null
          var d = e.ownerSource().firstValue()
          if (null === d) return 0
          var c = !1,
            u = e.properties()
          u.reverse && u.reverse.value() && (c = u.reverse.value())
          for (
            var _ = this.startPoint(e, c),
              p = this.priceRange(e, c),
              f = this._calculateLogLevels(e),
              g = 0,
              v = [],
              w = 1;
            w <= this._levelsCount;
            w++
          ) {
            var x = u['level' + w].coeff.value(),
              m = ''
            if (
              (n &&
                (m += r
                  ? this._percentageFormatter.format(Math.round(1e4 * x) / 100)
                  : this._numericFormatter.format(x)),
              i)
            ) {
              var y = e.priceScale(),
                b = a(_, p, x, y, d, f)
              m += '(' + y.formatPrice(b, d) + ')'
            }
            var R = { text: m, left: g, width: t.measureText(m).width + 4 }
            v.push(R), (g += R.width)
          }
          return { totalWidth: g, cells: v }
        }),
        (l.prototype._effectiveState = function (e) {
          var t = {},
            i = e.properties()
          i.showPrices && (t.showPrices = i.showPrices.value()),
            i.coeffsAsPercents && (t.coeffsAsPercents = i.coeffsAsPercents.value()),
            (t.showCoeffs = i.showCoeffs.value())
          var r = e.priceScale()
          r &&
            (r.formatter().state && (t.formatter = e.priceScale().formatter().state()),
            (t.logLevels = this._calculateLogLevels(e))),
            i.reverse && (t.reverse = i.reverse.value()),
            (t.p1 = e.points()[0]),
            (t.p2 = e.points()[1]),
            3 === e.points().length && (t.p3 = e.points()[2]),
            (t.items = [])
          for (var n = 1; n <= this._levelsCount; n++) {
            var s = i['level' + n],
              a = { coeff: s.coeff.value(), color: s.color.value() }
            t.items.push(a)
          }
          return t
        }),
        (l.prototype._findEmptyRow = function (e) {
          for (var t = 0; this._rowsToSources[t]; ) t++
          return (
            (this._rowsToSources[t] = e),
            t >= this._actualCapacity &&
              (this._actualCapacity++, this._recreateCanvas(this._actualWidth, l.ROW_HEIGHT * this._actualCapacity)),
            t
          )
        }),
        (l.prototype._repaintSource = function (e, t, i) {
          var r = l.ROW_HEIGHT * i.row
          o(
            this._cache,
            this._pixelRatio,
            function () {
              this._cache.clearRect(0, r, this._actualWidth, l.ROW_HEIGHT),
                (this._cache.textBaseline = 'bottom'),
                (this._cache.font = '12px ' + s),
                (r += l.ROW_HEIGHT)
              for (var i = 0; i < e.cells.length; i++) {
                var n = e.cells[i]
                ;(this._cache.fillStyle = t.items[i].color), this._cache.fillText(n.text, n.left, r)
              }
            }.bind(this),
          )
        }),
        (l.prototype.removeSource = function (e) {
          if (this._sourcesToRow[e]) {
            var t = this._sourcesToRow[e].row
            o(this._cache, this._pixelRatio, function () {
              this._cache.clearRect(0, this.topByRow(t), this._actualWidth, l.ROW_HEIGHT)
            }),
              delete this._sourcesToRow[e],
              delete this._rowsToSources[t]
          }
        }),
        (l.prototype._effectiveStatesEquals = function (e, t) {
          var i,
            r,
            n,
            s,
            a = function (e, t) {
              return !(!e && !t) && (!(!e || t) || !(e || !t) || e.index !== t.index || e.price !== t.price)
            }
          if (e && !t) return !1
          if (!e && t) return !1
          if (e.showPrices !== t.showPrices) return !1
          if (e.coeffsAsPercents !== t.coeffsAsPercents) return !1
          if (e.showCoeffs !== t.showCoeffs) return !1
          if (e.reverse !== t.reverse) return !1
          if (e.logLevels !== t.logLevels) return !1
          if (
            ((i = e.formatter),
            (r = t.formatter),
            (i || r) &&
              ((i && !r) ||
                (!i && r) ||
                i.minMove !== r.minMove ||
                i.minMove2 !== r.minMove2 ||
                i.fractional !== r.fractional ||
                i.fractionalLength !== r.fractionalLength))
          )
            return !1
          if (a(e.p1, t.p1)) return !1
          if (a(e.p2, t.p2)) return !1
          if (a(e.p3, t.p3)) return !1
          if (e.items.length !== t.items.length) return !1
          for (var o = 0; o < e.items.length; o++)
            if (((n = e.items[o]), (s = t.items[o]), n.coeff !== s.coeff || n.color !== s.color)) return !1
          return !0
        }),
        (l.prototype.updateSource = function (e) {
          var t = e.properties().symbol.value()
          if (
            (this._currentSymbol !== t &&
              ((this._currentSymbol = t), (this._sourcesToRow = {}), (this._rowsToSources = {})),
            !this._sourcesToRow[e.id()])
          ) {
            var i = this._findEmptyRow(e.id())
            this._sourcesToRow[e.id()] = { effectiveState: null, row: i }
          }
          var r = this._sourcesToRow[e.id()].effectiveState,
            n = this._effectiveState(e)
          if (!this._effectiveStatesEquals(r, n)) {
            var s = this._calculateWidth(e)
            if (s) {
              ;(this._sourcesToRow[e.id()].effectiveState = n),
                s.totalWidth > this._actualWidth &&
                  (this._recreateCanvas(s.totalWidth, l.ROW_HEIGHT * this._actualCapacity),
                  (this._actualWidth = s.totalWidth))
              i = this._sourcesToRow[e.id()]
              this._repaintSource(s, n, i),
                (this._sourcesToRow[e.id()].effectiveState = n),
                (this._sourcesToRow[e.id()].preparedCells = s)
            } else this._sourcesToRow[e.id()].effectiveState = null
          }
          return this._sourcesToRow[e.id()]
        }),
        (e.exports = l)
    },
    xp9B: function (e, t, i) {
      'use strict'
      var r = i('aO4+').Point,
        n = i('aB9a').LineSourcePaneView,
        s = i('2trc').ChannelRenderer,
        a = i('qgcf').TextRenderer,
        o = i('pJOz').TrendLineRenderer,
        l = i('VdBB').HitTestResult,
        h = i('Zy3/').CompositeRenderer,
        d = i('zXvd').NumericFormatter,
        c = i('a7Ha').LineEnd
      t.FibSpeedResistanceFanPaneView = class extends n {
        constructor(e, t) {
          super(e, t), (this._numericFormatter = new d()), (this._renderer = null)
        }
        _updateImpl() {
          if (
            (super._updateImpl(),
            (this._renderer = null),
            !(this._source.points().length < 2) &&
              this._source.priceScale() &&
              !this._source.priceScale().isEmpty() &&
              !this._model.timeScale().isEmpty())
          ) {
            var e = this._source.points()[0],
              t = this._source.points()[1],
              i = this._source.properties(),
              n = i.reverse.value()
            this._hlevels = []
            for (
              var d = n ? t.price - e.price : e.price - t.price,
                u = n ? e.price : t.price,
                _ = this._source.ownerSource().firstValue(),
                p = 1;
              p <= 7;
              p++
            ) {
              if ((y = i['hlevel' + p]).visible.value()) {
                var f = y.coeff.value(),
                  g = y.color.value(),
                  v = u + f * d,
                  w = this._source.priceScale().priceToCoordinate(v, _)
                this._hlevels.push({ coeff: f, color: g, y: w, index: p })
              }
            }
            this._vlevels = []
            var x = n ? t.index - e.index : e.index - t.index,
              m = n ? e.index : t.index
            for (p = 1; p <= 7; p++) {
              var y
              if ((y = i['vlevel' + p]).visible.value()) {
                ;(f = y.coeff.value()), (g = y.color.value())
                var b = Math.round(m + f * x),
                  R = this._model.timeScale().indexToCoordinate(b, !0)
                this._vlevels.push({ coeff: f, color: g, x: R, index: p })
              }
            }
            if (!(this._floatPoints.length < 2)) {
              var T = new h(),
                S = ((e = this._floatPoints[0]), (t = this._floatPoints[1]), Math.min(e.x, t.x)),
                P = Math.min(e.y, t.y),
                L = Math.max(e.x, t.x),
                C = Math.max(e.y, t.y),
                M = i.grid.color.value(),
                I = i.grid.linewidth.value(),
                O = i.grid.linestyle.value()
              for (p = 0; p < this._hlevels.length; p++) {
                ;(e = new r(S, this._hlevels[p].y)), (t = new r(L, this._hlevels[p].y))
                if (i.grid.visible.value()) {
                  var N = {
                    points: [e, t],
                    width: this._model.timeScale().width(),
                    height: this._source.priceScale().height(),
                    color: M,
                    linewidth: I,
                    linestyle: O,
                    extendleft: !1,
                    extendright: !1,
                    leftend: c.Normal,
                    rightend: c.Normal,
                  }
                  ;(F = new o()).setData(N), T.append(F)
                }
                if (i.showLeftLabels.value()) {
                  var D = {
                    points: [e],
                    text: this._numericFormatter.format(this._hlevels[p].coeff),
                    color: this._hlevels[p].color,
                    vertAlign: 'middle',
                    horzAlign: 'right',
                    font: i.font.value(),
                    offsetX: 5,
                    offsetY: 0,
                    fontsize: 12,
                    forceTextAlign: !0,
                  }
                  T.append(new a(D))
                }
                if (i.showRightLabels.value()) {
                  var B = {
                    points: [t],
                    text: this._numericFormatter.format(this._hlevels[p].coeff),
                    color: this._hlevels[p].color,
                    vertAlign: 'middle',
                    horzAlign: 'left',
                    font: i.font.value(),
                    offsetX: 5,
                    offsetY: 0,
                    fontsize: 12,
                    forceTextAlign: !0,
                  }
                  T.append(new a(B))
                }
              }
              for (p = 0; p < this._vlevels.length; p++) {
                ;(e = new r(this._vlevels[p].x, P)), (t = new r(this._vlevels[p].x, C))
                if (i.grid.visible.value()) {
                  N = {
                    points: [e, t],
                    width: this._model.timeScale().width(),
                    height: this._source.priceScale().height(),
                    color: M,
                    linewidth: I,
                    linestyle: O,
                    extendleft: !1,
                    extendright: !1,
                    leftend: c.Normal,
                    rightend: c.Normal,
                  }
                  ;(F = new o()).setData(N), T.append(F)
                }
                if (i.showTopLabels.value()) {
                  var k = {
                    points: [e],
                    text: this._numericFormatter.format(this._vlevels[p].coeff),
                    color: this._vlevels[p].color,
                    vertAlign: 'bottom',
                    horzAlign: 'center',
                    font: i.font.value(),
                    offsetX: 0,
                    offsetY: 5,
                    fontsize: 12,
                  }
                  T.append(new a(k))
                }
                if (i.showBottomLabels.value()) {
                  var A = {
                    points: [t],
                    text: this._numericFormatter.format(this._vlevels[p].coeff),
                    color: this._vlevels[p].color,
                    vertAlign: 'top',
                    horzAlign: 'center',
                    font: i.font.value(),
                    offsetX: 0,
                    offsetY: 5,
                    fontsize: 12,
                  }
                  T.append(new a(A))
                }
              }
              var E = i.fillBackground.value(),
                z = i.transparency.value()
              for (e = this._floatPoints[0], t = this._floatPoints[1], p = 0; p < this._hlevels.length; p++) {
                var j = new r(t.x, this._hlevels[p].y)
                if (p > 0 && E) {
                  var V = new r(t.x, this._hlevels[p - 1].y)
                  ;((W = {}).width = this._model.timeScale().width()),
                    (W.height = this._source.priceScale().height()),
                    (W.p1 = e),
                    (W.p2 = j),
                    (W.p3 = e),
                    (W.p4 = V),
                    (W.color = this._hlevels[p].color),
                    (W.transparency = z),
                    (W.hittestOnBackground = !0),
                    (F = new s()).setData(W),
                    T.append(F)
                }
                N = {
                  points: [e, j],
                  width: this._model.timeScale().width(),
                  height: this._source.priceScale().height(),
                  color: this._hlevels[p].color,
                  linewidth: i.linewidth.value(),
                  linestyle: i.linestyle.value(),
                  extendleft: !1,
                  extendright: !0,
                  leftend: c.Normal,
                  rightend: c.Normal,
                }
                ;(F = new o()).setData(N),
                  F.setHitTest(new l(l.MOVEPOINT, null, { type: 'h', index: this._hlevels[p].index })),
                  T.append(F)
              }
              for (p = 0; p < this._vlevels.length; p++) {
                var H = new r(this._vlevels[p].x, t.y)
                if (p > 0 && E) {
                  var W
                  V = new r(this._vlevels[p - 1].x, t.y)
                  ;((W = {}).width = this._model.timeScale().width()),
                    (W.height = this._source.priceScale().height()),
                    (W.p1 = e),
                    (W.p2 = H),
                    (W.p3 = e),
                    (W.p4 = V),
                    (W.color = this._vlevels[p].color),
                    (W.transparency = z),
                    (W.hittestOnBackground = !0),
                    (F = new s()).setData(W),
                    T.append(F)
                }
                var F
                N = {
                  points: [e, H],
                  width: this._model.timeScale().width(),
                  height: this._source.priceScale().height(),
                  color: this._vlevels[p].color,
                  linewidth: i.linewidth.value(),
                  linestyle: i.linestyle.value(),
                  extendleft: !1,
                  extendright: !0,
                  leftend: c.Normal,
                  rightend: c.Normal,
                }
                ;(F = new o()).setData(N),
                  F.setHitTest(new l(l.MOVEPOINT, null, { type: 'v', index: this._vlevels[p].index })),
                  T.append(F)
              }
              this.addAnchors(T), (this._renderer = T)
            }
          }
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
      }
    },
    'y/56': function (e, t, i) {
      'use strict'
      i.r(t)
      var r = i('aB9a'),
        n = i('Zy3/'),
        s = i('vq8G'),
        a = i('VdBB'),
        o = i('f6yo'),
        l = i('gAom'),
        h = i('cPgM')
      class d extends h.ScaledPaneRenderer {
        constructor() {
          super(...arguments), (this._data = null)
        }
        setData(e) {
          this._data = e
        }
        hitTest(e) {
          if (null === this._data) return null
          const { x: t, y: i } = this._data.point
          return e.x < t || e.x > t + 20 || e.y < i - 22 || e.y > i
            ? null
            : new a.HitTestResult(a.HitTestResult.MOVEPOINT)
        }
        doesIntersectWithBox(e) {
          return null !== this._data && Object(o.pointInBox)(this._data.point, e)
        }
        _drawImpl(e) {
          null !== this._data &&
            (e.save(),
            e.translate(Math.round(this._data.point.x) - 0.5, Math.round(this._data.point.y - 22) - 0.5),
            (e.fillStyle = '#434651'),
            Object(l.drawRoundRect)(e, 0, 0, 2, 22, 1),
            e.fill(),
            (e.fillStyle = this._data.color),
            e.beginPath(),
            e.moveTo(6.87, 0),
            e.bezierCurveTo(5.62, 0, 4.46, 0.23, 3.32, 0.69),
            e.bezierCurveTo(3.26, 0.71, 3.2, 0.75, 3.15, 0.8),
            e.bezierCurveTo(3.06, 0.89, 3, 1.02, 3, 1.16),
            e.lineTo(3, 1.19),
            e.lineTo(3, 12.5),
            e.bezierCurveTo(3, 12.8, 3.3, 13.02, 3.59, 12.93),
            e.bezierCurveTo(4.61, 12.64, 5.94, 12.44, 6.87, 12.44),
            e.bezierCurveTo(8.5, 12.44, 10.09, 12.83, 11.63, 13.21),
            e.bezierCurveTo(13.19, 13.6, 14.79, 14, 16.45, 14),
            e.bezierCurveTo(17.59, 14, 18.65, 13.81, 19.69, 13.43),
            e.bezierCurveTo(19.88, 13.36, 20, 13.18, 20, 12.98),
            e.lineTo(20, 1.19),
            e.bezierCurveTo(20, 1.06, 19.83, 0.93, 19.66, 0.99),
            e.bezierCurveTo(18.63, 1.38, 17.58, 1.56, 16.45, 1.56),
            e.bezierCurveTo(14.82, 1.56, 13.23, 1.17, 11.69, 0.79),
            e.bezierCurveTo(10.14, 0.4, 8.53, 0, 6.87, 0),
            e.closePath(),
            e.fill(),
            e.restore())
        }
      }
      i.d(t, 'FlagMarkPaneView', function () {
        return c
      })
      class c extends r.LineSourcePaneView {
        constructor() {
          super(...arguments), (this._flagMarkRenderer = new d()), (this._renderer = null), (this._anchorsOffset = null)
        }
        setAnchors(e) {
          this._anchorsOffset = e
        }
        renderer(e, t) {
          return this._invalidated && this._updateImpl(), this._renderer
        }
        _updateImpl() {
          if ((super._updateImpl(), (this._renderer = null), 1 !== this._points.length)) return
          this._flagMarkRenderer.setData({
            point: this._points[0],
            color: this._getSource().properties().childs().flagColor.value(),
          })
          const e = this._getModel()
          ;(this._renderer = new n.CompositeRenderer()), this._renderer.append(this._flagMarkRenderer)
          const t = [this._anchorsOffset ? this._points[0].add(this._anchorsOffset) : this._points[0].clone()]
          this._renderer.append(
            new s.SelectionRenderer({
              points: t,
              bgColors: this._lineAnchorColors(t),
              visible: this.areAnchorsVisible(),
              barSpacing: e.timeScale().barSpacing(),
              hittestResult: a.HitTestResult.MOVEPOINT,
            }),
          )
        }
      }
    },
  },
])
