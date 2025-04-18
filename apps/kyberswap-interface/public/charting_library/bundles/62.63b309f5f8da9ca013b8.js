;(window.webpackJsonp = window.webpackJsonp || []).push([
  [62],
  {
    CA9d: function (e, t, i) {
      'use strict'
      i.d(t, 'b', function () {
        return u
      }),
        i.d(t, 'a', function () {
          return h
        }),
        i.d(t, 'c', function () {
          return l
        })
      var n = i('HSjo'),
        s = i('hY0g'),
        o = i.n(s),
        r = i('25b6')
      const c = window.t('Price'),
        a = window.t('Bar#')
      function u(e, t, i) {
        return { property: Object(n.b)(e, t.price, `Change ${c} Y coordinate`), info: { typeY: 1, stepY: i } }
      }
      function h(e, t) {
        return {
          property: Object(n.b)(e, t.bar, `Change ${a} X coordinate`),
          info: { typeX: 0, minX: new o.a(-5e4), maxX: new o.a(15e3), stepX: new o.a(1) },
        }
      }
      function l(e, t, i, s, o, c) {
        const a = h(e, t),
          l = u(e, t, s)
        return Object(n.f)(
          { x: a.property, y: l.property },
          { id: Object(r.c)(`${c}Coordinates${o}`), title: o, ...a.info, ...l.info },
        )
      }
    },
    Cn8r: function (e, t, i) {
      'use strict'
      i.d(t, 'a', function () {
        return _
      })
      var n = i('YFKU'),
        s = (i('HbRj'), i('Eyy1')),
        o = i('HSjo'),
        r = i('1yQO'),
        c = i('hY0g'),
        a = i.n(c),
        u = i('lgIt'),
        h = i('CA9d')
      const l = Object(n.t)('Visibility'),
        b = Object(n.t)('Coordinates'),
        p = Object(n.t)('Style'),
        d = Object(n.t)('Text'),
        y = Object(n.t)('Inputs')
      class _ {
        constructor(e, t) {
          ;(this._yCoordinateStepWV = null),
            (this._propertyPages = []),
            (this._source = t),
            (this._undoModel = e),
            (this._ownerSource = Object(s.ensureNotNull)(this._source.ownerSource())),
            this._createPropertyRages()
        }
        destroy() {
          null !== this._yCoordinateStepWV &&
            (this._source.ownerSourceChanged().unsubscribeAll(this),
            this._ownerSource.priceStepChanged().unsubscribeAll(this)),
            this._propertyPages.forEach(e => {
              Object(o.u)(e.definitions.value())
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
          null !== t && this._propertyPages.push(t)
          const i = this._createTextPropertyPage()
          if ((null !== i && this._propertyPages.push(i), this._source.hasEditableCoordinates())) {
            const e = this._createCoordinatesPropertyPage()
            null !== e && this._propertyPages.push(e)
          }
          const n = this._createVisibilitiesPropertyPage()
          this._propertyPages.push(n)
        }
        _createVisibilitiesPropertyPage() {
          const e = this._source.properties().childs().intervalsVisibilities.childs()
          return Object(r.a)(Object(u.a)(this._undoModel, e, this._source.title(!0)), 'visibility', l)
        }
        _createCoordinatesPropertyPage() {
          const e = this._coordinatesPropertyDefinitions()
          return null !== e ? Object(r.a)(e, 'coordinates', b) : null
        }
        _getYCoordinateStepWV() {
          return (
            null === this._yCoordinateStepWV &&
              ((this._yCoordinateStepWV = new a.a(
                (function (e) {
                  if (null !== e) {
                    const t = e.priceStep()
                    if (null !== t) return t
                  }
                  return 1
                })(this._source.ownerSource()),
              )),
              this._ownerSource.priceStepChanged().subscribe(this, () => this._updateYCoordinateStep()),
              this._source.ownerSourceChanged().subscribe(this, () => {
                this._ownerSource.priceStepChanged().unsubscribeAll(this),
                  (this._ownerSource = Object(s.ensureNotNull)(this._source.ownerSource())),
                  this._ownerSource.priceStepChanged().subscribe(this, () => this._updateYCoordinateStep())
              })),
            this._yCoordinateStepWV
          )
        }
        _coordinatesPropertyDefinitions() {
          const e = this._source.points(),
            t = this._source.pointsProperty().childs().points,
            i = [],
            s = this._getYCoordinateStepWV()
          return (
            e.forEach((e, o) => {
              const r = t[o].childs()
              r &&
                i.push(
                  Object(h.c)(
                    this._undoModel,
                    r,
                    e,
                    s,
                    Object(n.t)('#{count} (price, bar)', { context: 'linetool point' }).format({
                      count: (o + 1).toString(),
                    }),
                    this._source.name(),
                  ),
                )
            }),
            i
          )
        }
        _createStylePropertyPage() {
          const e = this._stylePropertyDefinitions()
          return null !== e ? Object(r.a)(e, 'style', p) : null
        }
        _stylePropertyDefinitions() {
          return null
        }
        _createTextPropertyPage() {
          const e = this._textPropertyDefinitions()
          return null !== e ? Object(r.a)(e, 'text', d) : null
        }
        _textPropertyDefinitions() {
          return null
        }
        _createInputsPropertyPage() {
          const e = this._inputsPropertyDefinitions()
          return null !== e ? Object(r.a)(e, 'inputs', y) : null
        }
        _inputsPropertyDefinitions() {
          return null
        }
        _updateYCoordinateStep() {
          const e = this._ownerSource.priceStep()
          this._getYCoordinateStepWV().setValue(e || 1)
        }
      }
    },
    lgIt: function (e, t, i) {
      'use strict'
      i.d(t, 'a', function () {
        return C
      })
      var n = i('Kxc7'),
        s = i('HSjo'),
        o = i('hY0g'),
        r = i.n(o),
        c = i('pPtI')
      const a = window.t('Ticks'),
        u = window.t('Seconds'),
        h = window.t('Minutes'),
        l = window.t('Hours'),
        b = window.t('Days'),
        p = window.t('Weeks'),
        d = window.t('Months'),
        y = (window.t('Ranges'), [1, 59]),
        _ = [1, 59],
        g = [1, 24],
        w = [1, 366],
        O = [1, 52],
        j = [1, 12]
      function C(e, t, i) {
        const o = []
        if (n.enabled('tick_resolution')) {
          const n = Object(s.c)(
            { checked: Object(s.b)(e, t.ticks, `Change ${i} Visibility On Ticks`) },
            { id: 'IntervalsVisibilitiesTicks', title: a },
          )
          o.push(n)
        }
        if (Object(c.isSecondsEnabled)()) {
          const n = Object(s.n)(
            {
              checked: Object(s.b)(e, t.seconds, `Change ${i} Visibility On Seconds`),
              from: Object(s.b)(e, t.secondsFrom, `Change ${i} Seconds From`),
              to: Object(s.b)(e, t.secondsTo, `Change ${i} Seconds To`),
            },
            { id: 'IntervalsVisibilitiesSecond', title: u, min: new r.a(y[0]), max: new r.a(y[1]) },
          )
          o.push(n)
        }
        const C = Object(s.n)(
            {
              checked: Object(s.b)(e, t.minutes, `Change ${i} Visibility On Minutes`),
              from: Object(s.b)(e, t.minutesFrom, `Change ${i} Minutes From`),
              to: Object(s.b)(e, t.minutesTo, `Change ${i} Minutes To`),
            },
            { id: 'IntervalsVisibilitiesMinutes', title: h, min: new r.a(_[0]), max: new r.a(_[1]) },
          ),
          P = Object(s.n)(
            {
              checked: Object(s.b)(e, t.hours, `Change ${i} Visibility On Hours`),
              from: Object(s.b)(e, t.hoursFrom, `Change ${i} Hours From`),
              to: Object(s.b)(e, t.hoursTo, `Change ${i} Hours To`),
            },
            { id: 'IntervalsVisibilitiesHours', title: l, min: new r.a(g[0]), max: new r.a(g[1]) },
          ),
          S = Object(s.n)(
            {
              checked: Object(s.b)(e, t.days, `Change ${i} Visibility On Days`),
              from: Object(s.b)(e, t.daysFrom, `Change ${i} Days From`),
              to: Object(s.b)(e, t.daysTo, `Change ${i} Days To`),
            },
            { id: 'IntervalsVisibilitiesDays', title: b, min: new r.a(w[0]), max: new r.a(w[1]) },
          )
        o.push(C, P, S)
        const f = Object(s.n)(
            {
              checked: Object(s.b)(e, t.weeks, `Change ${i} Visibility On Weeks`),
              from: Object(s.b)(e, t.weeksFrom, `Change ${i} Weeks From`),
              to: Object(s.b)(e, t.weeksTo, `Change ${i} Weeks To`),
            },
            { id: 'IntervalsVisibilitiesWeeks', title: p, min: new r.a(O[0]), max: new r.a(O[1]) },
          ),
          m = Object(s.n)(
            {
              checked: Object(s.b)(e, t.months, `Change ${i} Visibility On Months`),
              from: Object(s.b)(e, t.monthsFrom, `Change ${i} Months From`),
              to: Object(s.b)(e, t.monthsTo, `Change ${i} Months To`),
            },
            { id: 'IntervalsVisibilitiesMonths', title: d, min: new r.a(j[0]), max: new r.a(j[1]) },
          )
        return o.push(f, m), o
      }
    },
  },
])
