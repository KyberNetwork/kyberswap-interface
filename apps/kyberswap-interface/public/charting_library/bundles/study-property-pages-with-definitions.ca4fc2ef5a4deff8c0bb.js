;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['study-property-pages-with-definitions'],
  {
    '4lou': function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'RegressionTrendDefinitionsViewModel', function () {
          return h
        })
      i('YFKU'), i('HbRj')
      var s = i('HSjo'),
        o = i('cKLu'),
        n = i('25b6')
      const l = window.t('Base'),
        r = window.t('Up'),
        c = window.t('Down'),
        u = window.t("Pearson's R"),
        d = window.t('Extend Lines')
      class h extends o.StudyLineDataSourceDefinitionsViewModel {
        constructor(e, t) {
          super(e, t)
        }
        _stylePropertyDefinitions() {
          const e = this._source.properties().childs().styles.childs(),
            t = this._source.name(),
            i = Object(n.c)(t),
            o = e.baseLine.childs(),
            h = Object(s.i)(
              {
                checked: Object(s.b)(this._undoModel, o.visible, `Change ${t} base line visibility`),
                color: Object(s.v)(this._undoModel, o.color, e.transparency, `Change ${t} base line color`),
                width: Object(s.b)(this._undoModel, o.linewidth, `Change ${t} base line width`),
                style: Object(s.b)(this._undoModel, o.linestyle, `Change ${t} base line style`),
              },
              { id: i + 'BaseLine', title: l },
            ),
            a = e.upLine.childs(),
            p = Object(s.i)(
              {
                checked: Object(s.b)(this._undoModel, a.visible, `Change ${t} up line visibility`),
                color: Object(s.v)(this._undoModel, a.color, e.transparency, `Change ${t} up line color`),
                width: Object(s.b)(this._undoModel, a.linewidth, `Change ${t} up line width`),
                style: Object(s.b)(this._undoModel, a.linestyle, `Change ${t} up line style`),
              },
              { id: i + 'UpLine', title: r },
            ),
            y = e.downLine.childs()
          return [
            h,
            p,
            Object(s.i)(
              {
                checked: Object(s.b)(this._undoModel, y.visible, `Change ${t} down line visibility`),
                color: Object(s.v)(this._undoModel, y.color, e.transparency, `Change ${t} down line color`),
                width: Object(s.b)(this._undoModel, y.linewidth, `Change ${t} down line width`),
                style: Object(s.b)(this._undoModel, y.linestyle, `Change ${t} down line style`),
              },
              { id: i + 'DownLine', title: c },
            ),
            Object(s.c)(
              { checked: Object(s.b)(this._undoModel, e.extendLines, `Change ${t} Extend Lines`) },
              { id: i + 'ExtendLines', title: d },
            ),
            Object(s.c)(
              { checked: Object(s.b)(this._undoModel, e.showPearsons, `Change ${t} show pearson's r`) },
              { id: i + 'Pearsons', title: u },
            ),
          ]
        }
      }
    },
    WUYT: function (e, t, i) {
      'use strict'
      i.r(t)
      i('YFKU'), i('HbRj')
      var s = i('Eyy1'),
        o = i('Kxc7'),
        n = i('HSjo'),
        l = i('1yQO'),
        r = i('loJ+'),
        c = i('zqjM'),
        u = i('hY0g'),
        d = i.n(u),
        h = i('0YCj'),
        a = i.n(h),
        p = i('pPtI'),
        y = i('lgIt')
      const b = window.t('Style'),
        _ = window.t('Inputs'),
        f = window.t('Visibility'),
        j = ['1', '3', '5', '15', '30', '45', '60', '120', '180', '240', '1D', '1W', '1M'].map(e => ({
          value: e,
          title: Object(p.getTranslatedResolutionModel)(e).hint,
        }))
      var w = i('Equz'),
        S = i('25b6')
      i.d(t, 'StudyOverlayDefinitionsViewModel', function () {
        return P
      })
      const g = [
          { title: window.t('Bars'), value: 0 },
          { title: window.t('Candles'), value: 1 },
          { title: window.t('Hollow Candles'), value: 9 },
          { title: window.t('Line'), value: 2 },
          { title: window.t('Area'), value: 3 },
          { title: window.t('Baseline'), value: 10 },
        ],
        O = window.t('Style'),
        m = window.t('Price Line'),
        I = window.t('Override Min Tick')
      class P extends class {
        constructor(e, t) {
          ;(this._inputSourceItems = null),
            (this._propertyPages = []),
            (this._sourceInput = null),
            (this._source = t),
            (this._undoModel = e)
          const i = this._sortInputs(this._source.metaInfo().inputs)
          for (const e of i) 'source' === e.type && (this._sourceInput = e)
          this._createPropertyRages(),
            null !== this._inputSourceItems &&
              this._undoModel
                .model()
                .dataSourceCollectionChanged()
                .subscribe(this, () => {
                  null !== this._inputSourceItems && this._inputSourceItems.setValue(this._getInputSourceItems())
                })
        }
        destroy() {
          null !== this._inputSourceItems && this._undoModel.model().dataSourceCollectionChanged().unsubscribeAll(this),
            this._propertyPages.forEach(e => {
              Object(n.u)(e.definitions.value())
            })
        }
        propertyPages() {
          return Promise.resolve(this._propertyPages)
        }
        _createPropertyRages() {
          this._propertyPages = []
          const e = this._createInputsPropertyPage()
          null !== e && this._propertyPages.push(e)
          const t = this._createStylePropertyPage()
          null !== t && this._propertyPages.push(t), this._propertyPages.push(this._createVisibilitiesPropertyPage())
        }
        _createStylePropertyPage() {
          const e = this._stylePropertyDefinitions()
          return null !== e ? Object(l.a)(e, 'style', b) : null
        }
        _createVisibilitiesPropertyPage() {
          const e = this._source.properties().childs().intervalsVisibilities.childs()
          return Object(l.a)(Object(y.a)(this._undoModel, e, this._source.title(!0)), 'visibility', f)
        }
        _stylePropertyDefinitions() {
          return null
        }
        _createInputsPropertyPage() {
          const e = this._inputsPropertyDefinitions()
          return null !== e ? Object(l.a)(e, 'inputs', _) : null
        }
        _inputsPropertyDefinitions() {
          const e = this._sortInputs(this._source.metaInfo().inputs),
            t = this._source.properties().childs().inputs.childs()
          return (
            null !== this._sourceInput && (this._inputSourceItems = new d.a(this._getInputSourceItems())),
            Object(r.a)(this._undoModel, e, t, !1, {
              resolutionItems: j,
              customSymbolInputSetter: this._customSymbolInputSetter(),
              getSymbolInfoBySymbol: this._getSymbolInfoBySymbol.bind(this),
              onSymbolsInfosChanged: this._source.symbolsResolved(),
              sourcesItems: this._inputSourceItems,
            })
          )
        }
        _sortInputs(e) {
          return e
        }
        _getInputSourceItems() {
          const e = c.b.slice(),
            t = Object(s.ensureNotNull)(this._sourceInput)
          if (this._source && this._source.isChildStudy()) {
            const i = this._source.parentSource(),
              s = i.title(),
              o = a.a.getChildSourceInputTitles(t, i.metaInfo(), s)
            for (const t of Object.keys(o)) e.push({ id: t, value: t, title: o[t] })
          }
          if (
            o.enabled('study_on_study') &&
            this._source &&
            (this._source.isChildStudy() || a.a.canBeChild(this._source.metaInfo()))
          ) {
            const t = new Set([this._source, ...this._source.getAllChildren()])
            this._undoModel
              .model()
              .allStudies()
              .filter(e => e.canHaveChildren() && !t.has(e))
              .forEach(t => {
                const i = t.title(!0, void 0, !0),
                  o = t.sourceId() || '#' + t.id(),
                  n = t.metaInfo(),
                  l = n.styles,
                  r = n.plots || []
                if (1 === r.length) e.push({ id: o, value: o, title: i })
                else if (r.length > 1) {
                  const t = r.reduce((e, t, n) => {
                    if (!a.a.canPlotBeSourceOfChildStudy(t.type)) return e
                    let r
                    try {
                      r = Object(s.ensureDefined)(Object(s.ensureDefined)(l)[t.id]).title
                    } catch (e) {
                      r = t.id
                    }
                    return { ...e, [`${o}$${n}`]: `${i}: ${r}` }
                  }, {})
                  for (const i of Object.keys(t)) e.push({ id: i, value: i, title: t[i] })
                }
              })
          }
          return e
        }
        _customSymbolInputSetter() {}
        _getSymbolInfoBySymbol(e) {
          return this._source.resolvedSymbolInfoBySymbol(e.value())
        }
      } {
        constructor(e, t) {
          super(e, t),
            (this._stylesPropertyPage = null),
            this.propertyPages().then(e => {
              this._stylesPropertyPage = e.filter(e => 'style' === e.id)[0]
            }),
            this._source
              .properties()
              .childs()
              .style.subscribe(this, e => {
                null !== this._stylesPropertyPage &&
                  (Object(n.u)(this._stylesPropertyPage.definitions.value()),
                  this._stylesPropertyPage.definitions.setValue(this._stylePropertyDefinitions()))
              })
        }
        destroy() {
          this._source.properties().childs().style.unsubscribeAll(this), super.destroy()
        }
        _customSymbolInputSetter() {
          return e => {
            this._undoModel.setSymbol(this._source, e)
          }
        }
        _stylePropertyDefinitions() {
          const e = this._source.properties().childs(),
            t = Object(n.k)(
              { option: Object(n.b)(this._undoModel, e.style, 'Change study overlay style') },
              { id: 'StudyOverlayStyle', title: O, options: new d.a(g) },
            ),
            i = Object(n.c)(
              { checked: Object(n.b)(this._undoModel, e.showPriceLine, 'Change Price Price Line') },
              { id: 'StudyOverlayPriceLine', title: m },
            ),
            s = Object(n.k)(
              { option: Object(n.b)(this._undoModel, e.minTick, 'Change study overlay style') },
              { id: 'StudyOverlayMinTick', title: I, options: new d.a(Object(c.d)()) },
            ),
            o = Object(S.c)(this._source.title())
          return [Object(n.l)([t, ...this._getSeriesStylesDefinitions()], 'SeriesStyleGroup' + o), i, s]
        }
        _getSeriesStylesDefinitions() {
          const e = this._source.properties().childs()
          return Object(w.a)(
            this._undoModel,
            e,
            e.style.value(),
            { seriesPriceSources: c.b, lineStyleTypes: c.c, isJapaneseChartsAvailable: !1 },
            'mainSeries',
          )
        }
      }
    },
    cKLu: function (e, t, i) {
      'use strict'
      i.r(t),
        i.d(t, 'StudyLineDataSourceDefinitionsViewModel', function () {
          return a
        })
      var s = i('YFKU'),
        o = (i('HbRj'), i('HSjo')),
        n = i('Cn8r'),
        l = i('hY0g'),
        r = i.n(l),
        c = i('zqjM'),
        u = i('loJ+'),
        d = i('CA9d'),
        h = i('25b6')
      class a extends n.a {
        constructor(e, t) {
          super(e, t)
        }
        _inputsPropertyDefinitions() {
          const e = this._undoModel
            .model()
            .studyMetaInfoRepository()
            .findByIdSync({ type: 'java', studyId: this._source.studyId() })
          return null === e
            ? null
            : Object(u.a)(this._undoModel, e.inputs, this._source.properties().childs().inputs.childs(), !1, {
                sourcesItems: new r.a(c.b),
              })
        }
        _coordinatesPropertyDefinitions() {
          const e = this._source.points(),
            t = this._source.pointsProperty().childs().points,
            i = []
          return (
            e.forEach((e, n) => {
              const l = t[n].childs()
              if (!l) return
              const r = Object(d.a)(this._undoModel, l)
              i.push(
                Object(o.f)(
                  { x: r.property },
                  {
                    id: Object(h.c)(`${this._source.name()}Point${n}`),
                    title: Object(s.t)('#{count} (bar)', { context: 'linetool point' }).format({
                      count: (n + 1).toString(),
                    }),
                    ...r.info,
                  },
                ),
              )
            }),
            i
          )
        }
      }
    },
    'loJ+': function (e, t, i) {
      'use strict'
      i.d(t, 'a', function () {
        return d
      })
      var s = i('Eyy1'),
        o = i('HSjo'),
        n = i('hY0g'),
        l = i.n(n),
        r = i('25b6')
      function c(e, t) {
        const i = e.id
        return (
          'first_visible_bar_time' !== i &&
          'last_visible_bar_time' !== i &&
          'time' !== e.type &&
          !e.isHidden &&
          !(t && !e.confirm) &&
          void 0 === e.groupId
        )
      }
      function u(e) {
        return e.name || Object(r.a)(e.id.toLowerCase())
      }
      function d(e, t, i, n, r) {
        const d = []
        for (const h of t) {
          if (!c(h, n)) continue
          const t = u(h),
            a = window.t(t, { context: 'input' })
          let p = null
          if ('resolution' === h.type)
            p = Object(o.k)(
              { option: Object(o.b)(e, i[h.id], 'Change ' + t) },
              { id: 'StudyInput' + t, title: a, options: new l.a(r.resolutionItems) },
            )
          else if ('source' === h.type) {
            const n = Object(s.ensure)(r.sourcesItems)
            p = Object(o.k)(
              { option: Object(o.b)(e, i[h.id], 'Change ' + t) },
              { id: 'StudyInput' + t, title: a, options: n },
            )
          } else if ('options' in h && void 0 !== h.options) {
            const s = []
            for (const e of h.options) {
              const t = (h.optionsTitles && h.optionsTitles[e]) || e,
                i = window.t(t)
              s.push({ value: e, title: i })
            }
            p = Object(o.k)(
              { option: Object(o.b)(e, i[h.id], 'Change ' + t) },
              { id: 'StudyInput' + t, title: a, options: new l.a(s) },
            )
          } else if ('symbol' === h.type) {
            const n = i[h.id],
              l = Object(s.ensure)(r.getSymbolInfoBySymbol),
              c = Object(s.ensure)(r.onSymbolsInfosChanged)
            p = Object(o.p)(
              { symbol: Object(o.z)(e, n, l, c, 'Change ' + a, r.customSymbolInputSetter) },
              { id: 'StudyInput' + t, title: a },
            )
          } else if ('session' === h.type)
            p = Object(o.o)({ session: Object(o.b)(e, i[h.id], 'Change ' + t) }, { id: 'StudyInput' + t, title: a })
          else if ('bool' === h.type)
            p = Object(o.c)({ checked: Object(o.b)(e, i[h.id], 'Change ' + a) }, { id: 'StudyInput' + t, title: a })
          else if ('integer' === h.type || 'float' === h.type || 'price' === h.type) {
            const s = {
              id: 'StudyInput' + t,
              title: a,
              type: 'float' === h.type || 'price' === h.type ? 1 : 0,
              defval: h.defval,
            }
            h.min && (s.min = new l.a(h.min)),
              h.max && (s.max = new l.a(h.max)),
              void 0 !== h.step && isFinite(h.step) && h.step > 0 && (s.step = new l.a(h.step)),
              (p = Object(o.j)({ value: Object(o.b)(e, i[h.id], 'Change ' + a) }, s))
          } else
            p = Object(o.q)(
              { text: Object(o.b)(e, i[h.id], 'Change ' + a) },
              { id: 'StudyInput' + t, title: a, isEditable: !0, isMultiLine: !1 },
            )
          d.push(p)
        }
        return 0 === d.length ? null : d
      }
    },
  },
])
