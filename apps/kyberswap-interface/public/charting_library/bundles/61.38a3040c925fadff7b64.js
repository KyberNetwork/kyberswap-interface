;(window.webpackJsonp = window.webpackJsonp || []).push([
  [61],
  {
    '1yQO': function (e, i, t) {
      'use strict'
      t.d(i, 'a', function () {
        return r
      })
      var o = t('hY0g'),
        n = t.n(o)
      function r(e, i, t, o = null) {
        const r = { id: i, title: t, definitions: new n.a(e) }
        return null !== o && (r.icon = o), r
      }
    },
    Equz: function (e, i, t) {
      'use strict'
      t.d(i, 'a', function () {
        return T
      })
      var o = t('Eyy1'),
        n = t('HSjo'),
        r = t('n5al'),
        s = t('hY0g'),
        l = t.n(s),
        c = t('Kxc7'),
        a = t('Z5lT'),
        d = t('25b6')
      const h = window.t('Color Bars Based on Previous Close'),
        u = window.t('HLC Bars'),
        b = window.t('Up Color'),
        p = window.t('Down Color'),
        w = window.t('Thin Bars'),
        y = window.t('Body'),
        C = window.t('Borders'),
        S = window.t('Wick'),
        f = window.t('Price Source'),
        O = window.t('Type'),
        j = window.t('Line'),
        g = window.t('Top Line'),
        v = window.t('Bottom Line'),
        _ = window.t('Fill'),
        m = window.t('Fill Top Area'),
        P = window.t('Fill Bottom Area'),
        L =
          (window.t('Up bars'),
          window.t('Down bars'),
          window.t('Projection up bars'),
          window.t('Projection down bars'),
          window.t('Show real prices on price scale (instead of Heikin-Ashi price)'),
          window.t('Base Level')),
        B = window.t('Body'),
        M = window.t('Borders'),
        k = window.t('Labels')
      function D(e, i, t, o) {
        const r = Object(d.c)(t)
        return [
          Object(n.s)(
            {
              checked: Object(n.b)(e, i.drawBody, `Change ${t} Body Visibility`),
              color1: Object(n.v)(e, i.upColor, null, `Change ${t} Up Color`),
              color2: Object(n.v)(e, i.downColor, null, `Change ${t} Down Color`),
            },
            { id: `${o}Symbol${r}CandlesColor`, title: y },
          ),
          Object(n.s)(
            {
              checked: Object(n.b)(e, i.drawBorder, `Change ${t} Border Visibility`),
              color1: Object(n.v)(e, i.borderUpColor, null, `Change ${t} Up Border Color`),
              color2: Object(n.v)(e, i.borderDownColor, null, `Change ${t} Down Border Color`),
            },
            { id: `${o}Symbol${r}BordersColor`, title: C },
          ),
          Object(n.s)(
            {
              checked: Object(n.b)(e, i.drawWick, `Change ${t} Wick Visibility`),
              color1: Object(n.v)(e, i.wickUpColor, null, `Change ${t} Wick Up Color`),
              color2: Object(n.v)(e, i.wickDownColor, null, `Change ${t} Wick Down Color`),
            },
            { id: `${o}Symbol${r}WickColors`, title: S },
          ),
        ]
      }
      function T(e, i, t, s, d) {
        switch (t) {
          case 0:
            return (function (e, i, t) {
              return [
                Object(n.c)(
                  { checked: Object(n.b)(e, i.barColorsOnPrevClose, 'Change Color Bars Based on Previous Close') },
                  { id: t + 'SymbolBarStyleBarColorsOnPrevClose', title: h },
                ),
                Object(n.c)(
                  { checked: Object(n.b)(e, i.dontDrawOpen, 'Change HLC Bars') },
                  { id: t + 'SymbolDontDrawOpen', title: u },
                ),
                Object(n.e)(
                  { color: Object(n.v)(e, i.upColor, null, 'Change Bar Up Color') },
                  { id: t + 'SymbolUpColor', title: b },
                ),
                Object(n.e)(
                  { color: Object(n.v)(e, i.downColor, null, 'Change Bar Down Color') },
                  { id: t + 'SymbolDownColor', title: p },
                ),
                Object(n.c)(
                  { checked: Object(n.b)(e, i.thinBars, 'Change Thin Bars') },
                  { id: t + 'SymbolBarThinBars', title: w },
                ),
              ]
            })(e, i.barStyle.childs(), d)
          case 1:
            return (function (e, i, t) {
              return [
                Object(n.c)(
                  { checked: Object(n.b)(e, i.barColorsOnPrevClose, 'Change Color Bars Based on Previous Close') },
                  { id: t + 'SymbolCandleStyleBarColorsOnPrevClose', title: h },
                ),
                ...D(e, i, 'Candle', t),
              ]
            })(e, i.candleStyle.childs(), d)
          case 2:
            return (function (e, i, t, o, r) {
              return [
                Object(n.k)(
                  { option: Object(n.b)(e, i.priceSource, 'Change Price Source') },
                  { id: r + 'SymbolLinePriceSource', title: f, options: new l.a(t) },
                ),
                Object(n.k)(
                  {
                    option: Object(n.b)(e, i.styleType, 'Change Line Type'),
                  },
                  { id: r + 'SymbolStyleType', title: O, options: new l.a(o) },
                ),
                Object(n.i)(
                  {
                    color: Object(n.v)(e, i.color, null, 'Change Line Color'),
                    width: Object(n.b)(e, i.linewidth, 'Change Line Width'),
                  },
                  { id: r + 'SymbolLineStyle', title: j },
                ),
              ]
            })(e, i.lineStyle.childs(), s.seriesPriceSources, s.lineStyleTypes, d)
          case 3:
            return (function (e, i, t, o) {
              return [
                Object(n.k)(
                  { option: Object(n.b)(e, i.priceSource, 'Change Area Price Source') },
                  { id: o + 'SymbolAreaPriceSource', title: f, options: new l.a(t) },
                ),
                Object(n.i)(
                  {
                    color: Object(n.v)(e, i.linecolor, null, 'Change Area Line Color'),
                    width: Object(n.b)(e, i.linewidth, 'Change Area Line Width'),
                  },
                  { id: o + 'SymbolAreaLineStyle', title: j },
                ),
                Object(n.s)(
                  {
                    color1: Object(n.v)(e, i.color1, i.transparency, 'Change Area Fill Color'),
                    color2: Object(n.v)(e, i.color2, i.transparency, 'Change Area Fill Color'),
                  },
                  { id: o + 'SymbolAreaFills', title: _ },
                ),
              ]
            })(e, i.areaStyle.childs(), s.seriesPriceSources, d)
          case 9:
            return D(e, i.hollowCandleStyle.childs(), 'Hollow Candles', d)
          case 10:
            return (function (e, i, t, o) {
              return [
                Object(n.k)(
                  { option: Object(n.b)(e, i.priceSource, 'Change Baseline Price Source') },
                  { id: o + 'SymbolBaseLinePriceSource', title: f, options: new l.a(t) },
                ),
                Object(n.i)(
                  {
                    color: Object(n.v)(e, i.topLineColor, null, 'Change Baseline Top Line Color'),
                    width: Object(n.b)(e, i.topLineWidth, 'Change Baseline Top Line Width'),
                  },
                  { id: o + 'SymbolBaseLineTopLine', title: g },
                ),
                Object(n.i)(
                  {
                    color: Object(n.v)(e, i.bottomLineColor, null, 'Change Baseline Bottom Line Color'),
                    width: Object(n.b)(e, i.bottomLineWidth, 'Change Baseline Bottom Line Width'),
                  },
                  { id: o + 'SymbolBaseLineBottomLine', title: v },
                ),
                Object(n.s)(
                  {
                    color1: Object(n.v)(e, i.topFillColor1, null, 'Change Baseline Fill Top Area Color'),
                    color2: Object(n.v)(e, i.topFillColor2, null, 'Change Baseline Fill Top Area Color'),
                  },
                  { id: o + 'SymbolBaseLineTopFills', title: m },
                ),
                Object(n.s)(
                  {
                    color1: Object(n.v)(e, i.bottomFillColor1, null, 'Change Baseline Fill Bottom Area Color'),
                    color2: Object(n.v)(e, i.bottomFillColor2, null, 'Change Baseline Fill Bottom Area Color'),
                  },
                  { id: o + 'SymbolBaseLineBottomFills', title: P },
                ),
                Object(n.j)(
                  { value: Object(n.b)(e, i.baseLevelPercentage, 'Change Base Level', [a.b]) },
                  {
                    id: o + 'SymbolBaseLevelPercentage',
                    title: L,
                    type: 0,
                    min: new l.a(0),
                    max: new l.a(100),
                    step: new l.a(1),
                    unit: new l.a('%'),
                  },
                ),
              ]
            })(e, i.baselineStyle.childs(), s.seriesPriceSources, d)
        }
        if (!i.hasOwnProperty('haStyle')) return []
        if (s.isJapaneseChartsAvailable && 8 === t) {
          return (function (e, i, t) {
            const o = []
            return (
              o.push(
                Object(n.c)(
                  { checked: Object(n.b)(e, i.barColorsOnPrevClose, 'Change Color Bars Based on Previous Close') },
                  { id: t + 'SymbolHAStyleBarColorsOnPrevClose', title: h },
                ),
                ...D(e, i, 'Heikin Ashi', t),
              ),
              o
            )
          })(e, i.haStyle.childs(), d)
        }
        s.isJapaneseChartsAvailable && c.enabled('japanese_chart_styles')
        if (c.enabled('chart_style_hilo') && 12 === t) {
          const t = i.hiloStyle.childs(),
            l = Object(r.chartStyleStudyId)(12)
          return (function (e, i, t, o) {
            const r = Object(n.e)(
                {
                  checked: Object(n.b)(e, i.drawBody, 'Change High-Low Body Visibility'),
                  color: Object(n.v)(e, i.color, null, 'Change High-Low Body Color'),
                },
                { id: o + 'SymbolBodiesColor', title: B },
              ),
              s = Object(n.e)(
                {
                  checked: Object(n.b)(e, i.showBorders, 'Change Show High-Low Borders'),
                  color: Object(n.v)(e, i.borderColor, null, 'Change High-Low Border Color'),
                },
                { id: o + 'SymbolBorderColor', title: M },
              ),
              l = t.map(e => ({ title: String(e), value: e }))
            return [
              r,
              s,
              Object(n.q)(
                {
                  checked: Object(n.b)(e, i.showLabels, 'Change Show High-Low Labels'),
                  color: Object(n.v)(e, i.labelColor, null, 'Change High-Low Labels Color'),
                  size: Object(n.b)(e, i.fontSize, 'Change High-Low Labels Font Size'),
                },
                { id: o + 'SymbolLabels', title: k, isEditable: !1, isMultiLine: !1, sizeItems: l },
              ),
            ]
          })(e, t, Object(o.ensure)(s.defaultSeriesFontSizes)[l], d)
        }
        return []
      }
    },
    Z5lT: function (e, i, t) {
      'use strict'
      t.d(i, 'b', function () {
        return n
      }),
        t.d(i, 'a', function () {
          return r
        }),
        t.d(i, 'c', function () {
          return s
        })
      var o = t('T6Of')
      function n(e) {
        return Math.floor(e)
      }
      function r(e) {
        return parseInt(String(e))
      }
      function s(e) {
        const i = new o.LimitedPrecisionNumericFormatter(e)
        return e => {
          if (null === e) return e
          const t = i.parse(i.format(e))
          return t.res ? t.value : null
        }
      }
    },
    zqjM: function (e, i, t) {
      'use strict'
      var o = t('Eyy1'),
        n = t('HSjo'),
        r = t('hY0g'),
        s = t.n(r),
        l = t('n5al'),
        c = t('dfhE'),
        a = t('Equz'),
        d = t('Z5lT')
      function h(e) {
        return e.map(e => ({ value: e, title: window.t(e) }))
      }
      function u(e, i, t, r, c, a, u) {
        const b = []
        return (
          t.forEach(t => {
            if (
              !(function (e, i) {
                return (
                  !e.isHidden &&
                  (void 0 === e.visible ||
                    (function (e, i) {
                      if (!e) return !0
                      const t = e.split('==')
                      return !(t.length < 2) && i[t[0]].value() === t[1]
                    })(e.visible, i))
                )
              })(t, r)
            )
              return
            const p = t.id
            if (!r.hasOwnProperty(p)) return
            const w = r[p],
              y = (function (e, i) {
                return 'style' === e.id
                  ? window.t('Box size assignment method')
                  : 'boxSize' === e.id
                  ? window.t('Box Size')
                  : window.t(i.childs().name.value())
              })(t, c[p])
            if ('options' in t) {
              const i = Object(o.ensure)(t.options)
              b.push(
                Object(n.k)(
                  { option: Object(n.b)(e, w, 'Change ' + y) },
                  { id: `${u}${t.name}`, title: y, options: new s.a(h(i)) },
                ),
              )
            } else if ('integer' !== t.type) {
              if ('float' === t.type) {
                let o
                return (
                  (o =
                    (function (e, i) {
                      return !(
                        ((i === Object(l.chartStyleStudyId)(4) || i === Object(l.chartStyleStudyId)(6)) &&
                          'boxSize' === e) ||
                        (i === Object(l.chartStyleStudyId)(5) && 'reversalAmount' === e)
                      )
                    })(p, i) || null === a.value()
                      ? new s.a(t.min)
                      : a),
                  void b.push(
                    Object(n.j)(
                      { value: Object(n.b)(e, w, 'Change ' + y) },
                      { id: `${u}${t.name}`, title: y, type: 1, min: o, max: new s.a(t.max), defval: t.defval },
                    ),
                  )
                )
              }
              'text' !== t.type
                ? 'bool' !== t.type ||
                  b.push(Object(n.c)({ checked: Object(n.b)(e, w, 'Change ' + y) }, { id: `${u}${t.name}`, title: y }))
                : b.push(
                    Object(n.q)(
                      { text: Object(n.b)(e, w, 'Change ' + y) },
                      { id: `${u}${t.name}`, title: y, isEditable: !0, isMultiLine: !1 },
                    ),
                  )
            } else
              b.push(
                Object(n.j)(
                  { value: Object(n.b)(e, w, 'Change ' + y, [d.b]) },
                  {
                    id: `${u}${t.name}`,
                    title: y,
                    type: 0,
                    min: new s.a(t.min),
                    max: new s.a(t.max),
                    defval: t.defval,
                  },
                ),
              )
          }),
          b
        )
      }
      var b = t('txPx'),
        p = t('Cf1E')
      t.d(i, 'b', function () {
        return A
      }),
        t.d(i, 'c', function () {
          return $
        }),
        t.d(i, 'd', function () {
          return W
        }),
        t.d(i, 'a', function () {
          return V
        })
      const w = Object(b.getLogger)('Chart.Definitions.Series'),
        y = (window.t('Adjust Data for Dividends'), window.t('Session'), window.t('Pre/Post market hours background')),
        C = window.t('Last Price Line'),
        S =
          (window.t('Previous Day Close Price Line'),
          window.t('Bid and Ask lines'),
          window.t('Pre/Post Market Price Line'),
          window.t('High and low price lines')),
        f = window.t('Average close price line'),
        O = window.t('Precision'),
        j = window.t('Time Zone'),
        g = window.t('Open'),
        v = window.t('High'),
        _ = window.t('Low'),
        m = window.t('Close'),
        P = window.t('(H + L)/2'),
        L = window.t('(H + L + C)/3'),
        B = window.t('(O + H + L + C)/4'),
        M = window.t('Simple'),
        k = window.t('With Markers'),
        D = window.t('Step'),
        T = window.t('Default'),
        E = { [Object(l.chartStyleStudyId)(12)]: [7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 40] },
        I = [
          { priceScale: 1, minMove: 1, frac: !1 },
          { priceScale: 10, minMove: 1, frac: !1 },
          { priceScale: 100, minMove: 1, frac: !1 },
          { priceScale: 1e3, minMove: 1, frac: !1 },
          { priceScale: 1e4, minMove: 1, frac: !1 },
          { priceScale: 1e5, minMove: 1, frac: !1 },
          { priceScale: 1e6, minMove: 1, frac: !1 },
          { priceScale: 1e7, minMove: 1, frac: !1 },
          { priceScale: 1e8, minMove: 1, frac: !1 },
          { priceScale: 2, minMove: 1, frac: !0 },
          { priceScale: 4, minMove: 1, frac: !0 },
          { priceScale: 8, minMove: 1, frac: !0 },
          { priceScale: 16, minMove: 1, frac: !0 },
          { priceScale: 32, minMove: 1, frac: !0 },
          { priceScale: 64, minMove: 1, frac: !0 },
          { priceScale: 128, minMove: 1, frac: !0 },
          { priceScale: 320, minMove: 1, frac: !0 },
        ],
        A = [
          { title: g, value: 'open', id: 'price-source-open' },
          { title: v, value: 'high', id: 'price-source-high' },
          { title: _, value: 'low', id: 'price-source-low' },
          { title: m, value: 'close', id: 'price-source-close' },
          { title: P, value: 'hl2', id: 'price-source-hl2' },
          { title: L, value: 'hlc3', id: 'price-source-hlc3' },
          { title: B, value: 'ohlc4', id: 'price-source-ohlc4' },
        ],
        $ = [
          { title: M, value: c.STYLE_LINE_TYPE_SIMPLE },
          { title: k, value: c.STYLE_LINE_TYPE_MARKERS },
          { title: D, value: c.STYLE_LINE_TYPE_STEP },
        ]
      function W() {
        const e = [{ title: T, value: 'default' }]
        for (let i = 0; i < I.length; i++)
          e.push({
            title: `${I[i].minMove}/${I[i].priceScale}`,
            value: `${I[i].priceScale},${I[i].minMove},${I[i].frac}`,
          })
        return e
      }
      class V {
        constructor(e, i, t, o, n, r) {
          ;(this._definitions = null),
            (this._inputsSubscriptions = null),
            (this._isDestroyed = !1),
            (this._propertyPages = null),
            (this._seriesMinTickWV = null),
            (this._sessionIdOptionsWV = new s.a([])),
            (this._disabledSessionSelect = new s.a(!0)),
            (this._series = e),
            (this._undoModel = i),
            (this._model = this._undoModel.model()),
            (this._propertyPageId = t),
            (this._propertyPageName = o),
            (this._propertyPageIcon = n),
            (this._timezonePropertyObj = r),
            this._series.onStyleChanged().subscribe(this, this._updateDefinitions),
            this._series.dataEvents().symbolResolved().subscribe(this, this._updateSeriesMinTickWV),
            this._series.dataEvents().symbolResolved().subscribe(this, this._updateSessionIdOptionsWV),
            this._updateSeriesMinTickWV(),
            this._updateSessionIdOptionsWV()
        }
        destroy() {
          null !== this._propertyPages &&
            this._propertyPages.forEach(e => {
              Object(n.u)(e.definitions.value())
            }),
            this._series.onStyleChanged().unsubscribe(this, this._updateDefinitions),
            this._series.dataEvents().symbolResolved().unsubscribeAll(this),
            this._unsubscribeInputsUpdate(),
            (this._isDestroyed = !0)
        }
        propertyPages() {
          return null === this._propertyPages
            ? this._getDefinitions().then(e => {
                if (this._isDestroyed) throw new Error('SeriesPropertyDefinitionsViewModel already destroyed')
                return (
                  null === this._propertyPages &&
                    (this._propertyPages = [
                      {
                        id: this._propertyPageId,
                        title: this._propertyPageName,
                        icon: this._propertyPageIcon,
                        definitions: new s.a(e),
                      },
                    ]),
                  this._propertyPages
                )
              })
            : Promise.resolve(this._propertyPages)
        }
        _seriesMinTick() {
          const e = this._series.symbolInfo()
          return null !== e ? e.minmov / e.pricescale : null
        }
        _updateSeriesMinTickWV() {
          null === this._seriesMinTickWV
            ? (this._seriesMinTickWV = new s.a(this._seriesMinTick()))
            : this._seriesMinTickWV.setValue(this._seriesMinTick())
        }
        _updateSessionIdOptionsWV() {}
        _updateDefinitions() {
          null !== this._definitions && Object(n.u)(this._definitions),
            (this._definitions = null),
            this._unsubscribeInputsUpdate(),
            this._createSeriesDefinitions().then(e => {
              if (this._isDestroyed) throw new Error('SeriesPropertyDefinitionsViewModel already destroyed')
              Object(o.ensureNotNull)(this._propertyPages)[0].definitions.setValue(e)
            })
        }
        _getDefinitions() {
          return null === this._definitions ? this._createSeriesDefinitions() : Promise.resolve(this._definitions)
        }
        _unsubscribeInputsUpdate() {
          null !== this._inputsSubscriptions &&
            (this._inputsSubscriptions.forEach(e => {
              e.unsubscribeAll(this)
            }),
            (this._inputsSubscriptions = null))
        }
        _subscribeInputsUpdate(e, i) {
          const t = []
          e.forEach(e => {
            if (void 0 !== e.visible) {
              const o = e.visible.split('==')
              if (2 === o.length) {
                const e = i[o[0]]
                ;-1 === t.indexOf(e) && (e.subscribe(this, this._updateDefinitions), t.push(e))
              }
            }
          }),
            t.length > 0 ? (this._inputsSubscriptions = t) : (this._inputsSubscriptions = null)
        }
        _createSeriesDefinitions() {
          const e = this._series.properties().childs(),
            i = this._series.getInputsProperties(),
            t = this._series.getInputsInfoProperties(),
            r = e.style.value(),
            c = this._series.getStyleShortName()
          return new Promise(e => {
            const n = Object(l.chartStyleStudyId)(r)
            null !== n
              ? this._model
                  .studyMetaInfoRepository()
                  .findById({ type: 'java', studyId: n })
                  .then(n => {
                    if (this._isDestroyed) throw new Error('SeriesPropertyDefinitionsViewModel already destroyed')
                    if (null !== this._definitions) return void e(null)
                    const r = Object(o.ensureNotNull)(this._seriesMinTickWV),
                      s = u(this._undoModel, n.id, n.inputs, i, t, r, c)
                    this._subscribeInputsUpdate(n.inputs, i), e(s)
                  })
                  .catch(i => {
                    w.logWarn('Find meta info for create series definitions with error - ' + Object(p.a)(i)), e(null)
                  })
              : e(null)
          }).then(i => {
            if (this._isDestroyed) throw new Error('SeriesPropertyDefinitionsViewModel already destroyed')
            if (null !== this._definitions) return this._definitions
            const t = Object(a.a)(
              this._undoModel,
              e,
              r,
              { seriesPriceSources: A, lineStyleTypes: $, isJapaneseChartsAvailable: !0, defaultSeriesFontSizes: E },
              'mainSeries',
            )
            null !== i && t.push(...i)
            const o = Object(n.k)(
                { option: Object(n.b)(this._undoModel, e.minTick, 'Change Decimal Places') },
                { id: c + 'SymbolMinTick', title: O, options: new s.a(W()) },
              ),
              l = Object(n.k)(
                { option: Object(n.b)(this._undoModel, this._timezonePropertyObj.property, 'Change Timezone') },
                { id: c + 'SymbolTimezone', title: j, options: new s.a(this._timezonePropertyObj.values) },
              )
            return (
              (this._definitions = [
                Object(n.l)(t, 'generalSymbolStylesGroup'),
                ...this._seriesPriceLinesDefinitions(c),
                ...this._seriesDataDefinitions(c),
                o,
                l,
              ]),
              this._definitions
            )
          })
        }
        _seriesDataDefinitions(e) {
          this._series.dividendsAdjustmentProperty()
          return []
        }
        _createOutOfSessionDefinition(e) {
          const i = this._model
            .sessions()
            .properties()
            .childs()
            .graphics.childs()
            .backgrounds.childs()
            .outOfSession.childs()
          return Object(n.e)(
            {
              color: Object(n.v)(this._undoModel, i.color, i.transparency, 'Change Extended hours color'),
            },
            { id: e + 'SymbolExtendedHoursColors', title: y },
          )
        }
        _createPrePostMarketDefinition(e) {
          const i = this._model.sessions(),
            t = i.properties().childs().graphics.childs().backgrounds.childs().preMarket.childs(),
            o = i.properties().childs().graphics.childs().backgrounds.childs().postMarket.childs()
          return Object(n.s)(
            {
              color1: Object(n.v)(this._undoModel, t.color, t.transparency, 'Change Pre Market Color'),
              color2: Object(n.v)(this._undoModel, o.color, o.transparency, 'Change Post Market Color'),
            },
            { id: e + 'SymbolExtendedHoursColors', title: y },
          )
        }
        _seriesPriceLinesDefinitions(e) {
          const i = [],
            t = this._series.properties().childs()
          if (this._series.hasClosePrice()) {
            const o = Object(n.i)(
              {
                checked: Object(n.b)(this._undoModel, t.showPriceLine, 'Change Price Price Line'),
                color: Object(n.v)(this._undoModel, t.priceLineColor, null, 'Change Price Line Color'),
                width: Object(n.b)(this._undoModel, t.priceLineWidth, 'Change Price Line Width'),
              },
              { id: e + 'SymbolLastValuePriceLine', title: C },
            )
            i.push(o)
          }
          this._series.hasClosePrice()
          const o = t.highLowAvgPrice,
            r = Object(n.c)(
              {
                checked: Object(n.b)(
                  this._undoModel,
                  o.childs().highLowPriceLinesVisible,
                  'Change high/low price lines visibility',
                ),
              },
              { id: e + 'SymbolHighLowPriceLines', title: S },
            ),
            s = Object(n.c)(
              {
                checked: Object(n.b)(
                  this._undoModel,
                  o.childs().averageClosePriceLineVisible,
                  'Change average close price line visibility',
                ),
              },
              { id: e + 'SymbolAverageClosePriceLine', title: f },
            )
          return i.push(r, s), i
        }
      }
    },
  },
])
