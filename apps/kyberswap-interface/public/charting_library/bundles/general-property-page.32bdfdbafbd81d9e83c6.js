;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['general-property-page'],
  {
    '34BO': function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M9 7H7v14h2v3h1v-3h2V7h-2V4H9v3zM8 8v12h3V8H8zm9 1h-2v10h2v3h1v-3h2V9h-2V6h-1v3zm-1 1v8h3v-8h-3z"/></svg>'
    },
    '5lPo': function (e, t, i) {
      'use strict'
      i.r(t)
      var s = i('Eyy1'),
        r = i('Kxc7'),
        o = (i('N22A'), i('hY0g')),
        a = i.n(o),
        n = i('HSjo'),
        l = i('1yQO'),
        c = i('1ANp'),
        h = i('RspR'),
        d = i('MWAT'),
        p = i('zqjM'),
        b = i('x2L+')
      const u = window.t('Show Buy/Sell Buttons')
      var g = i('qFKp')
      const w = window.t('Symbol'),
        y = window.t('OHLC Values'),
        P = window.t('Bar Change Values'),
        O = window.t('Indicator Titles'),
        m = window.t('Indicator Arguments'),
        v = window.t('Indicator Values'),
        j = window.t('Background'),
        C = (window.t('Wrap text'), window.t('Show Open market status'))
      g.CheckMobile.any()
      function S(e, t, i, s, o) {
        const l = [],
          c = [],
          h = Object(n.k)(
            {
              checked: Object(n.b)(e, t.showSeriesTitle, 'Change Symbol Description Visibility'),
              option: Object(n.b)(e, i.property, 'Change Symbol Legend Format'),
            },
            { id: 'symbolTextSource', title: w, options: new a.a(i.values) },
          )
        if ((c.push(h), null !== s)) {
          const t = Object(n.c)(
            { checked: Object(n.b)(e, s, 'Change show open market status') },
            { id: 'showOpenMarketStatus', title: C },
          )
          c.push(t)
        }
        const d = Object(n.c)(
          { checked: Object(n.b)(e, t.showSeriesOHLC, 'Change OHLC Values Visibility') },
          { id: 'ohlcTitle', title: y },
        )
        c.push(d)
        const p = Object(n.c)(
          { checked: Object(n.b)(e, t.showBarChange, 'Change Bar Change Visibility') },
          { id: 'barChange', title: P },
        )
        c.push(p), l.push(Object(n.l)(c, 'seriesLegendVisibilityGroup'))
        const b = (function (e, t) {
          return null !== t && r.enabled('buy_sell_buttons')
            ? Object(n.c)(
                { checked: Object(n.a)(e, t.showSellBuyButtons, 'Change buy/sell buttons visibility') },
                { id: 'tradingSellBuyPanel', title: u },
              )
            : null
        })(e, o)
        null !== b && l.push(Object(n.l)([b], 'sellBuyButtonsLegendVisibilityGroup'))
        const g = [],
          S = Object(n.c)(
            { checked: Object(n.b)(e, t.showStudyArguments, 'Change Indicator Arguments Visibility') },
            { id: 'studyArguments', title: m },
          ),
          _ = Object(n.d)(
            { checked: Object(n.b)(e, t.showStudyTitles, 'Change Indicator Titles Visibility') },
            { id: 'studyTitles', title: O },
            [S],
          )
        g.push(_)
        const f = Object(n.c)(
          { checked: Object(n.b)(e, t.showStudyValues, 'Change Indicator Values Visibility') },
          { id: 'studyValues', title: v },
        )
        g.push(f), l.push(Object(n.l)(g, 'studiesLegendVisibilityGroup'))
        const L = []
        const k = Object(n.r)(
          {
            checked: Object(n.b)(e, t.showBackground, 'Change Legend Background Visibility'),
            transparency: Object(n.b)(e, t.backgroundTransparency, 'Change Legend Background Transparency'),
          },
          { id: 'legendBgTransparency', title: j },
        )
        return L.push(k), l.push(Object(n.l)(L, 'generalLegendGroup')), l
      }
      var _ = i('oXaB'),
        f = i('Z5lT'),
        L = i('GDWD')
      const k = window.t('Symbol Name Label'),
        V = window.t('Symbol Last Price Label'),
        M = (window.t('Symbol Previous Day Close Price Label (Intraday Only)'), window.t('Indicator Name Label')),
        x = window.t('Indicator Last Value Label'),
        B =
          (window.t('Financials Name Label'),
          window.t('Financials Last Value Label'),
          window.t('Bid and Ask Labels'),
          window.t('Pre/Post Market Price Label'),
          window.t('High and low price labels')),
        z = window.t('Average close price label'),
        D = window.t('Countdown To Bar Close'),
        T = window.t('Currency'),
        A = window.t('Unit'),
        H = window.t('Plus Button'),
        G = window.t('Scales Placement'),
        R = window.t('Date Format'),
        E = window.t('Lock Price to Bar Ratio'),
        N = window.t('No Overlapping Labels'),
        W = [
          {
            value: _.PriceAxisLastValueMode.LastPriceAndPercentageValue,
            title: window.t('Price and Percentage Value'),
          },
          { value: _.PriceAxisLastValueMode.LastValueAccordingToScale, title: window.t('Value according to Scale') },
        ]
      const F = window.t('Background'),
        I = window.t('Vert Grid Lines'),
        U = window.t('Horz Grid Lines'),
        q = window.t('Session Breaks'),
        K = window.t('Scales text'),
        Q = window.t('Scales lines'),
        J = window.t('Crosshair'),
        Z = window.t('Watermark'),
        X = window.t('Top Margin'),
        Y = window.t('Navigation Buttons'),
        $ = window.t('Pane Buttons'),
        ee = window.t('Bottom Margin'),
        te = window.t('Right Margin'),
        ie = window.t('bars', { context: 'unit' })
      var se = i('e1ZQ'),
        re = i('3t3b'),
        oe = i('gQ5K'),
        ae = i('+6ja')
      const ne = {
        symbol: i('34BO'),
        legend: i('ggCF'),
        scales: i('Iilx'),
        appearance: i('DyO1'),
        events: i('iUxq'),
        trading: i('WS5G'),
      }
      i.d(t, 'ChartPropertyDefinitionsViewModel', function () {
        return ge
      })
      const le = window.t('Symbol'),
        ce = window.t('Status line'),
        he = window.t('Scales'),
        de = window.t('Appearance')
      window.t('Events'), window.t('Trading')
      let pe = null
      function be() {
        const e = new Date(Date.UTC(1997, 8, 29))
        return se.a.map(t => ({ value: t, title: new oe.DateFormatter(t).format(e) }))
      }
      const ue = [
        { id: 'symbol-text-source-description', value: 'description', title: window.t('Description') },
        { id: 'symbol-text-source-ticker', value: 'ticker', title: window.t('Ticker') },
        {
          id: 'symbol-text-source-ticker-and-description',
          value: 'ticker-and-description',
          title: window.t('Ticker and description'),
        },
      ]
      class ge {
        constructor(e, t, i) {
          ;(this._propertyPages = null),
            (this._maxRightOffsetPropertyObject = null),
            (this._isDestroyed = !1),
            (this._undoModel = e),
            (this._model = this._undoModel.model()),
            (this._series = this._model.mainSeries()),
            (this._chartWidgetProperties = t),
            (this._options = i),
            (this._seriesPropertyDefinitionViewModel = this._createSeriesViewModel()),
            (this._legendPropertyPage = this._createLegendPropertyPage()),
            (this._scalesPropertyPage = this._createScalesPropertyPage()),
            (this._appearancePropertyPage = this._createAppearancePropertyPage()),
            (this._tradingPropertyPage = this._createTradingPropertyPage()),
            (this._eventsPropertyPage = this._createEventsPropertyPage()),
            this._series.onStyleChanged().subscribe(this, this._updateDefinitions),
            this._series.priceScaleChanged().subscribe(this, this._updateDefinitions)
        }
        destroy() {
          null !== this._propertyPages &&
            this._propertyPages
              .filter((e, t) => 0 !== t)
              .forEach(e => {
                Object(n.u)(e.definitions.value())
              }),
            this._seriesPropertyDefinitionViewModel.destroy(),
            this._series.onStyleChanged().unsubscribe(this, this._updateDefinitions),
            this._series.priceScaleChanged().unsubscribe(this, this._updateDefinitions)
          Object(s.ensureNotNull)(this._model.timeScale()).maxRightOffsetChanged().unsubscribeAll(this),
            (this._isDestroyed = !0)
        }
        propertyPages() {
          return null === this._propertyPages
            ? this._seriesPropertyDefinitionViewModel.propertyPages().then(e => {
                if (this._isDestroyed) throw new Error('ChartPropertyDefinitionsViewModel already destroyed')
                return (
                  null === this._propertyPages &&
                    ((this._propertyPages = [...e]),
                    this._propertyPages.push(
                      this._legendPropertyPage,
                      this._scalesPropertyPage,
                      this._appearancePropertyPage,
                    ),
                    null !== this._tradingPropertyPage && this._propertyPages.push(this._tradingPropertyPage),
                    null !== this._eventsPropertyPage && this._propertyPages.push(this._eventsPropertyPage)),
                  this._propertyPages
                )
              })
            : Promise.resolve(this._propertyPages)
        }
        _updateDefinitions() {
          Object(n.u)(this._scalesPropertyPage.definitions.value())
          const e = this._createScalesDefinitions()
          this._scalesPropertyPage.definitions.setValue(e)
        }
        _createSeriesViewModel() {
          const e = {
            property: this._model.properties().timezone,
            values: ae.availableTimezones.map(e => ({ value: e.id, title: e.title })),
          }
          return new p.a(this._series, this._undoModel, 'symbol', le, ne.symbol, e)
        }
        _createLegendPropertyPage() {
          const e = this._chartWidgetProperties.childs().paneProperties.childs().legendProperties.childs(),
            t = { property: this._series.properties().childs().statusViewStyle.childs().symbolTextSource, values: ue },
            i = S(this._undoModel, e, t, this._options.marketStatusWidgetEnabled ? b.b : null, pe)
          return Object(l.a)(i, 'legend', ce, ne.legend)
        }
        _createScalesPropertyPage() {
          const e = this._createScalesDefinitions()
          return Object(l.a)(e, 'scales', he, ne.scales)
        }
        _createScalesDefinitions() {
          const e = this._chartWidgetProperties.childs().scalesProperties.childs(),
            t = {
              property: this._model.properties().priceScaleSelectionStrategyName,
              values: Object(d.allPriceScaleSelectionStrategyInfo)().map(e => ({ value: e.name, title: e.title })),
            },
            i = { property: re.dateFormatProperty, values: be() },
            s = this._model.mainSeriesScaleRatioProperty()
          return (function (e, t, i, s) {
            const o = s.seriesPriceScale.properties().childs(),
              l = [],
              c = []
            if (s.seriesHasClosePrice) {
              const t = Object(n.c)(
                  { checked: Object(n.b)(e, i.showSymbolLabels, 'Show Symbol Labels') },
                  { id: 'symbolNameLabel', title: k },
                ),
                s = Object(n.k)(
                  {
                    checked: Object(n.b)(e, i.showSeriesLastValue, 'Change Symbol Last Value Visibility'),
                    option: Object(n.b)(e, i.seriesLastValueMode, 'Change Symbol Last Value Mode'),
                  },
                  { id: 'symbolLastValueLabel', title: V, options: new a.a(W) },
                )
              c.push(t, s)
            }
            const h = t.highLowAvgPrice,
              d = Object(n.c)(
                {
                  checked: Object(n.b)(
                    e,
                    h.childs().highLowPriceLabelsVisible,
                    'Change high/low price labels visibility',
                  ),
                },
                { id: 'highLowPriceLabels', title: B },
              ),
              p = Object(n.c)(
                {
                  checked: Object(n.b)(
                    e,
                    h.childs().averageClosePriceLabelVisible,
                    'Change average close price label visibility',
                  ),
                },
                { id: 'averageClosePriceLabels', title: z },
              )
            c.push(d, p)
            const b = Object(n.c)(
                { checked: Object(n.b)(e, i.showStudyPlotLabels, 'Show Study Plots Labels') },
                { id: 'studyNameLabel', title: M },
              ),
              u = Object(n.c)(
                { checked: Object(n.b)(e, i.showStudyLastValue, 'Change Indicator Last Value Visibility') },
                { id: 'studyLastValueLabel', title: x },
              )
            c.push(b, u)
            const g = Object(n.c)(
              { checked: Object(n.b)(e, o.alignLabels, 'Change No Overlapping Labels') },
              { id: 'noOverlappingLabels', title: N },
            )
            if ((c.push(g), s.countdownEnabled)) {
              const i = Object(n.c)(
                {
                  checked: Object(n.b)(e, t.showCountdown, 'Change Show Countdown'),
                },
                { id: 'countdown', title: D },
              )
              c.push(i)
            }
            if (s.currencyConversionEnabled) {
              const t = Object(n.c)(
                { checked: Object(n.b)(e, i.showCurrency, 'Change Currency Label Visibility') },
                { id: 'scalesCurrency', title: T },
              )
              c.push(t)
            }
            if (s.unitConversionEnabled) {
              const t = Object(n.c)(
                { checked: Object(n.b)(e, i.showUnit, 'Change Unit Label Visibility') },
                { id: 'scalesUnit', title: A },
              )
              c.push(t)
            }
            if (e.crossHairSource().isMenuEnabled()) {
              const t = Object(n.c)(
                { checked: Object(n.b)(e, L.addPlusButtonProperty, 'Plus Button') },
                { id: 'addPlusButton', title: H },
              )
              c.push(t)
            }
            l.push(Object(n.l)(c, 'generalScalesLabelsGroup'))
            const w = Object(n.j)(
                {
                  checked: Object(n.w)(e, o.lockScale, s.seriesPriceScale, 'Change lock scale'),
                  value: Object(n.y)(e, s.mainSeriesScaleRatioProperty, 'Change Price to Bar Ratio', [
                    Object(f.c)(7),
                    e => e,
                  ]),
                },
                {
                  id: 'lockScale',
                  title: E,
                  min: new a.a(s.mainSeriesScaleRatioProperty.getMinValue()),
                  max: new a.a(s.mainSeriesScaleRatioProperty.getMaxValue()),
                  step: new a.a(s.mainSeriesScaleRatioProperty.getStepChangeValue()),
                },
              ),
              y = Object(n.k)(
                { option: Object(n.x)(e, s.scalesPlacementPropertyObj.property) },
                { id: 'scalesPlacement', title: G, options: new a.a(s.scalesPlacementPropertyObj.values) },
              )
            if ((l.push(w, y), r.enabled('scales_date_format'))) {
              const t = Object(n.k)(
                { option: Object(n.b)(e, s.dateFormatPropertyObj.property, 'Change Date Format') },
                { id: 'dateFormat', title: R, options: new a.a(s.dateFormatPropertyObj.values) },
              )
              l.push(t)
            }
            return l
          })(this._undoModel, this._series.properties().childs(), e, {
            disableSeriesPrevCloseValueProperty: this._series.isDWMProperty(),
            seriesHasClosePrice: this._series.hasClosePrice(),
            seriesPriceScale: this._series.priceScale(),
            mainSeriesScaleRatioProperty: s,
            scalesPlacementPropertyObj: t,
            dateFormatPropertyObj: i,
            currencyConversionEnabled: this._options.currencyConversionEnabled,
            unitConversionEnabled: this._options.unitConversionEnabled,
            countdownEnabled: this._options.countdownEnabled,
          })
        }
        _createMaxOffsetPropertyObject() {
          const e = Object(s.ensureNotNull)(this._model.timeScale()),
            t = new a.a(Math.floor(e.maxRightOffset()))
          e.maxRightOffsetChanged().subscribe(this, e => {
            t.setValue(Math.floor(e))
          }),
            (this._maxRightOffsetPropertyObject = { property: e.defaultRightOffsetProperty(), min: new a.a(0), max: t })
        }
        _createAppearancePropertyPage() {
          const e = this._chartWidgetProperties.childs(),
            t = e.paneProperties.childs(),
            i = e.scalesProperties.childs(),
            o = this._model.watermarkSource()
          let d = null
          null !== o && (d = o.properties().childs())
          const p = { property: c.property(), values: c.availableValues() },
            b = { property: h.property(), values: h.availableValues() },
            u = this._model.sessions().properties().childs().graphics.childs().vertlines.childs().sessBreaks.childs()
          null === this._maxRightOffsetPropertyObject && this._createMaxOffsetPropertyObject()
          const g = Object(s.ensureNotNull)(this._maxRightOffsetPropertyObject),
            w = (function (e, t, i, s, o, l, c, h, d) {
              const p = [],
                b = Object(n.e)(
                  {
                    color: Object(n.v)(e, t.background, null, 'Change Chart Background Color'),
                    gradientColor1: Object(n.v)(
                      e,
                      t.backgroundGradientStartColor,
                      null,
                      'Change Chart Background Color',
                    ),
                    gradientColor2: Object(n.v)(e, t.backgroundGradientEndColor, null, 'Change Chart Background Color'),
                    type: Object(n.b)(e, t.backgroundType, 'Change Chart Background Type'),
                  },
                  { id: 'chartBackground', title: F, noAlpha: !0 },
                ),
                u = t.vertGridProperties.childs(),
                g = Object(n.i)(
                  {
                    color: Object(n.v)(e, u.color, null, 'Change Vert Grid Lines Color'),
                    style: Object(n.b)(e, u.style, 'Change Vert Grid Lines Style'),
                  },
                  { id: 'vertGridLine', title: I },
                ),
                w = t.horzGridProperties.childs(),
                y = Object(n.i)(
                  {
                    color: Object(n.v)(e, w.color, null, 'Change Horz Grid Lines Color'),
                    style: Object(n.b)(e, w.style, 'Change Horz Grid Lines Style'),
                  },
                  { id: 'horizGridLine', title: U },
                ),
                P = Object(n.i)(
                  {
                    disabled: Object(n.b)(e, l, 'Change Intraday Interval Property'),
                    checked: Object(n.b)(e, o.visible, 'Change Sessions Breaks Visibility'),
                    color: Object(n.v)(e, o.color, null, 'Change Sessions Breaks Color'),
                    width: Object(n.b)(e, o.width, 'Change Sessions Breaks Width'),
                    style: Object(n.b)(e, o.style, 'Change Sessions Breaks Style'),
                  },
                  { id: 'sessionBeaks', title: q },
                ),
                O = Object(n.q)(
                  {
                    color: Object(n.v)(e, s.textColor, null, 'Change Scales Text Color'),
                    size: Object(n.b)(e, s.fontSize, 'Change Scales Font Size'),
                  },
                  { id: 'scalesText', title: K },
                ),
                m = Object(n.i)(
                  { color: Object(n.v)(e, s.lineColor, null, 'Change Scales Lines Color') },
                  { id: 'scalesLine', title: Q },
                ),
                v = t.crossHairProperties.childs(),
                j = Object(n.i)(
                  {
                    color: Object(n.v)(e, v.color, v.transparency, 'Change Crosshair Color'),
                    width: Object(n.b)(e, v.width, 'Change Crosshair Width'),
                    style: Object(n.b)(e, v.style, 'Change Crosshair Style'),
                  },
                  { id: 'crossHair', title: J },
                )
              if ((p.push(b, g, y, P, O, m, j), null !== i)) {
                const t = Object(n.e)(
                  {
                    checked: Object(n.b)(e, i.visibility, 'Change Symbol Watermark Visibility'),
                    color: Object(n.v)(e, i.color, null, 'Change Symbol Watermark Color'),
                  },
                  { id: 'watermark', title: Z },
                )
                p.push(t)
              }
              const C = Object(n.k)(
                { option: Object(n.b)(e, h.property, 'Change Navigation Buttons Visibility') },
                { id: 'navButtons', title: Y, options: new a.a(h.values) },
              )
              p.push(C)
              const S = Object(n.k)(
                { option: Object(n.b)(e, d.property, 'Change Pane Buttons Visibility') },
                { id: 'paneButtons', title: $, options: new a.a(d.values) },
              )
              p.push(S)
              const _ = Object(n.j)(
                  { value: Object(n.b)(e, t.topMargin, 'Change Top Margin', [f.b]) },
                  {
                    type: 0,
                    id: 'paneTopMargin',
                    title: X,
                    min: new a.a(0),
                    max: new a.a(25),
                    step: new a.a(1),
                    unit: new a.a('%'),
                  },
                ),
                L = Object(n.j)(
                  { value: Object(n.b)(e, t.bottomMargin, 'Change Bottom Margin', [f.b]) },
                  {
                    type: 0,
                    id: 'paneBottomMargin',
                    title: ee,
                    min: new a.a(0),
                    max: new a.a(25),
                    step: new a.a(1),
                    unit: new a.a('%'),
                  },
                ),
                k = Object(n.j)(
                  { value: Object(n.b)(e, c.property, 'Change Right Margin', [f.b]) },
                  {
                    type: 0,
                    id: 'paneRightMargin',
                    title: te,
                    min: c.min,
                    max: c.max,
                    step: new a.a(1),
                    unit: new a.a(ie),
                  },
                ),
                V = [Object(n.l)(p, 'generalAppearanceGroup'), _, L]
              return r.enabled('chart_property_page_right_margin_editor') && V.push(k), V
            })(this._undoModel, t, d, i, u, this._series.isDWMProperty(), g, p, b)
          return Object(l.a)(w, 'appearance', de, ne.appearance)
        }
        _createTradingPropertyPage() {
          return null
        }
        _createEventsPropertyPage() {
          return null
        }
      }
    },
    DyO1: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"><path stroke="currentColor" d="M7.5 16.5l-1 1v4h4l1-1m-4-4l2 2m-2-2l9-9m-5 13l-2-2m2 2l9-9m-11 7l9-9m0 0l-2-2m2 2l2 2m-4-4l.94-.94a1.5 1.5 0 0 1 2.12 0l1.88 1.88a1.5 1.5 0 0 1 0 2.12l-.94.94"/></svg>'
    },
    Iilx: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"><path stroke="currentColor" d="M10.5 20.5a2 2 0 1 1-2-2m2 2a2 2 0 0 0-2-2m2 2h14m-16-2v-14m16 16L21 17m3.5 3.5L21 24M8.5 4.5L12 8M8.5 4.5L5 8"/></svg>'
    },
    WS5G: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M24.068 9a.569.569 0 0 1 .73.872L19 14.842l-5.798-4.97a.569.569 0 0 1 .73-.872l4.751 3.887.317.26.317-.26L24.068 9zm1.47-.67a1.569 1.569 0 0 0-2.103-.104L19 11.854l-4.435-3.628a1.569 1.569 0 0 0-2.014 2.405l6.124 5.249.325.279.325-.28 6.124-5.248a1.569 1.569 0 0 0 .088-2.3zm-11.484 9.728a.57.57 0 0 0 .688-.91L9 12.636l-5.742 4.512a.57.57 0 0 0 .688.91l4.76-3.462.294-.214.294.214 4.76 3.462zm1.446.649a1.57 1.57 0 0 1-2.034.16L9 15.618l-4.466 3.249a1.57 1.57 0 0 1-1.894-2.505l6.051-4.755.309-.243.309.243 6.051 4.755c.74.581.806 1.68.14 2.345z"/></svg>'
    },
    ggCF: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"><path fill="currentColor" d="M6 13h12v1H6zM6 17h12v1H6zM6 21h12v1H6z"/><rect width="17" height="3" stroke="currentColor" rx="1.5" x="5.5" y="6.5"/></svg>'
    },
    iUxq: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M10 4h1v2h6V4h1v2h2.5A2.5 2.5 0 0 1 23 8.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 5 19.5v-11A2.5 2.5 0 0 1 7.5 6H10V4zm8 3H7.5A1.5 1.5 0 0 0 6 8.5v11A1.5 1.5 0 0 0 7.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 20.5 7H18zm-3 2h-2v2h2V9zm-7 4h2v2H8v-2zm12-4h-2v2h2V9zm-7 4h2v2h-2v-2zm-3 4H8v2h2v-2zm3 0h2v2h-2v-2zm7-4h-2v2h2v-2z"/></svg>'
    },
  },
])
