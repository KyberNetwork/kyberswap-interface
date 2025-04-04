;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['symbol-info-dialog-impl'],
  {
    '1Z/g': function (e, t, n) {
      'use strict'
      ;(function (e, o) {
        var r,
          i = n('PT1i').linking,
          s = n('+6ja').availableTimezones,
          c = n('kcTO').PriceFormatter,
          a = n('e3/o'),
          u = n('q1tI'),
          l = n('i8i4'),
          d = n('ZzxF').SymbolInfoDialog,
          p = n('5mo2').SessionSpec,
          f = n('jCNj'),
          m = n('kcTO').numberToStringWithLeadingZero,
          b = n('Ialn'),
          y = n('IWXC').getQuoteSessionInstance,
          h = n('n5al').createSeriesFormatter,
          O = n('w3Pp').marketType,
          D = n('6vtU').getAdditionalSymbolInfoFields,
          j = [f.MONDAY, f.TUESDAY, f.WEDNESDAY, f.THURSDAY, f.FRIDAY, f.SATURDAY, f.SUNDAY],
          v = j.reduce(function (t, n) {
            return (t[n < 7 ? n + 1 : 1] = e.weekdaysMin(n)), t
          }, {})
        function w(e) {
          return (
            !(function (e) {
              return e && e.type && 'economic' === e.type
            })(e) &&
            !(function (e, t) {
              return e && e.listed_exchange && t.indexOf(e.listed_exchange) >= 0
            })(e, ['QUANDL', 'BSE_EOD', 'NSE_EOD', 'LSE_EOD'])
          )
        }
        function N(e) {
          return e.minmove2 > 0 && !e.fractional && e.pricescale
        }
        function E(e) {
          if (N(e)) return new c(e.pricescale / e.minmove2).format(e.minmove2 / e.pricescale)
        }
        function k(e) {
          return void 0 === e.minmov || void 0 === e.pricescale ? null : h(e).format(e.minmov / e.pricescale)
        }
        function S(e) {
          return O(e.type, e.typespecs)
        }
        function g(e) {
          return e.original_currency_code || e.currency_code || null
        }
        function A(e, t) {
          return e(t.original_unit_id || t.unit_id) || null
        }
        function _(e) {
          return e && e.type && 'futures' === e.type && e.front_contract
        }
        function M(e) {
          r || ((r = document.createElement('div')), document.body.appendChild(r)), l.render(u.createElement(d, e), r)
        }
        function Y(e) {
          for (var t = s, n = 0; n < t.length; n++) if (t[n].id === e) return t[n].title
          return e
        }
        function T(e) {
          var t,
            n = new p('Etc/UTC', e)
          return ((t = n.entries()),
          j.reduce(function (e, n) {
            var o = t.filter(function (e) {
                return e.dayOfWeek() === n
              }),
              r = v[n] + ' '
            if (0 === o.length) return e.push(r + window.t('Closed')), e
            var i = o.reduce(function (e, t) {
              var n = t.sessionStartDayOfWeek(),
                o = t.sessionStartDaysOffset(),
                r = (function (e, t) {
                  for (var n = e + t; n > f.SATURDAY; ) n -= f.SATURDAY
                  return n
                })(n, o === t.sessionEndDaysOffset() ? 0 : o),
                i = n !== t.dayOfWeek(),
                s = i && r !== t.dayOfWeek(),
                c = i ? v[n] : '',
                a = s ? v[r] : '',
                u = W(t.start()) + c + '-' + W(t.start() + t.length()) + a
              return e.push(u), e
            }, [])
            return e.push(r + i.join(', ')), e
          }, [])).join('<br>')
        }
        function U(e) {
          return e || '-'
        }
        function R(e, t) {
          for (var n = 0, o = 0; o < t.length; o++)
            if (void 0 === t[o].getter) {
              var r = t[o].propName,
                i = t[o].altPropName,
                s = r in e ? r : void 0 !== i && i in e ? i : void 0
              if (void 0 !== s) {
                var c = e[s]
                ;(t[o].value = (t[o].formatter || U)(c)), n++
              }
            } else {
              var a = t[o].getter(e)
              null !== a && (t[o].value = a), n++
            }
          return (n -= (function (e, t) {
            for (var n = 0, o = 0; o < t.length; o++) {
              var r = t[o]
              void 0 === r.visibility || r.visibility(e) || (t.splice(o, 1), o--, n++)
            }
            return n
          })(e, t))
        }
        function W(e) {
          for (; e > f.minutesPerDay; ) e -= f.minutesPerDay
          var t = e % 60,
            n = m((e - t) / 60, 2) + ':' + m(t, 2)
          return b.isRtl() ? b.startWithLTR(n) : n
        }
        t.showSymbolInfoDialog = function (e, t) {
          if ((M({ isOpened: !1 }), null == e && (e = i.symbol.value()), null != e)) {
            e += ''
            var n = t && t.symbolInfo,
              s = [
                { title: window.t('Symbol Name'), propName: o.enabled('charting_library_base') ? 'name' : 'pro_name' },
                { title: window.t('Symbol Description'), propName: 'description' },
                { title: window.t('Symbol Type'), propName: 'type', getter: S },
                {
                  title: window.t('Current Contract'),
                  propName: 'front_contract',
                  visibility: _,
                },
                { title: window.t('Point Value'), propName: 'pointvalue' },
                { title: window.t('Exchange'), propName: 'exchange' },
                { title: window.t('Listed Exchange'), propName: 'listed_exchange' },
                {
                  title: window.t('Currency'),
                  propName: 'currency_code',
                  getter: g,
                  formatter: function (e) {
                    return e || ''
                  },
                  defValue: '',
                },
                {
                  title: window.t('Unit'),
                  propName: 'unit_id',
                  getter: A.bind(null, t.unitName),
                  visibility: function () {
                    return t.showUnit
                  },
                  formatter: function (e) {
                    return e || ''
                  },
                  defValue: '',
                },
                { title: window.t('Pip Size'), propName: 'pip_size', getter: E, visibility: N },
                { title: window.t('Tick Size'), propName: 'tick_size', getter: k },
                { title: window.t('Sector'), propName: 'sector' },
                { title: window.t('Industry'), propName: 'industry' },
                { title: window.t('Timezone'), propName: 'timezone', formatter: Y, visibility: w },
                {
                  title: window.t('Session'),
                  propName: 'session_display',
                  altPropName: 'session',
                  formatter: T,
                  visibility: w,
                  setHtml: !0,
                },
              ],
              c = D()
            if (c && c.length > 0) for (const e of c) s.push({ title: e.title, propName: e.propertyName })
            var u = 0
            if ((n && (u = R(n, s)), u < s.length)) {
              var d = 'symbolinfodialog.' + a.guid(),
                p = y('full')
              p.subscribe(d, e, function (t, n) {
                R(n.values, s), p.unsubscribe(d, e), M(f)
              })
            }
            var f = {
              isOpened: !0,
              onClose: function () {
                M({ isOpened: !1 }), l.unmountComponentAtNode(r), (r = null)
              },
              fields: s,
            }
            M(f)
          }
        }
      }).call(this, n('ldgD'), n('Kxc7'))
    },
    '4nwx': function (e, t, n) {
      'use strict'
      n.r(t),
        n.d(t, 'monthsFullNames', function () {
          return i
        }),
        n.d(t, 'monthsShortNames', function () {
          return s
        }),
        n.d(t, 'weekDaysFullNames', function () {
          return c
        }),
        n.d(t, 'weekDaysShortNames', function () {
          return a
        }),
        n.d(t, 'weekDaysMiniNames', function () {
          return u
        })
      var o = n('YFKU'),
        r = n('99ZO')
      const i = {
          [r.Months.JANUARY]: Object(o.t)('January'),
          [r.Months.FEBRUARY]: Object(o.t)('February'),
          [r.Months.MARCH]: Object(o.t)('March'),
          [r.Months.APRIL]: Object(o.t)('April'),
          [r.Months.MAY]: Object(o.t)('May'),
          [r.Months.JUNE]: Object(o.t)('June'),
          [r.Months.JULY]: Object(o.t)('July'),
          [r.Months.AUGUST]: Object(o.t)('August'),
          [r.Months.SEPTEMBER]: Object(o.t)('September'),
          [r.Months.OCTOBER]: Object(o.t)('October'),
          [r.Months.NOVEMBER]: Object(o.t)('November'),
          [r.Months.DECEMBER]: Object(o.t)('December'),
        },
        s = {
          [r.Months.JANUARY]: Object(o.t)('Jan'),
          [r.Months.FEBRUARY]: Object(o.t)('Feb'),
          [r.Months.MARCH]: Object(o.t)('Mar'),
          [r.Months.APRIL]: Object(o.t)('Apr'),
          [r.Months.MAY]: Object(o.t)('May', { context: 'short' }),
          [r.Months.JUNE]: Object(o.t)('Jun'),
          [r.Months.JULY]: Object(o.t)('Jul'),
          [r.Months.AUGUST]: Object(o.t)('Aug'),
          [r.Months.SEPTEMBER]: Object(o.t)('Sep'),
          [r.Months.OCTOBER]: Object(o.t)('Oct'),
          [r.Months.NOVEMBER]: Object(o.t)('Nov'),
          [r.Months.DECEMBER]: Object(o.t)('Dec'),
        },
        c = {
          [r.WeekDays.SUNDAY]: Object(o.t)('Sunday'),
          [r.WeekDays.MONDAY]: Object(o.t)('Monday'),
          [r.WeekDays.TUESDAY]: Object(o.t)('Tuesday'),
          [r.WeekDays.WEDNESDAY]: Object(o.t)('Wednesday'),
          [r.WeekDays.THURSDAY]: Object(o.t)('Thursday'),
          [r.WeekDays.FRIDAY]: Object(o.t)('Friday'),
          [r.WeekDays.SATURDAY]: Object(o.t)('Saturday'),
        },
        a = {
          [r.WeekDays.SUNDAY]: Object(o.t)('Sun'),
          [r.WeekDays.MONDAY]: Object(o.t)('Mon'),
          [r.WeekDays.TUESDAY]: Object(o.t)('Tue'),
          [r.WeekDays.WEDNESDAY]: Object(o.t)('Wed'),
          [r.WeekDays.THURSDAY]: Object(o.t)('Thu'),
          [r.WeekDays.FRIDAY]: Object(o.t)('Fri'),
          [r.WeekDays.SATURDAY]: Object(o.t)('Sat'),
        },
        u = {
          [r.WeekDays.SUNDAY]: Object(o.t)('Su', { context: 'day_of_week' }),
          [r.WeekDays.MONDAY]: Object(o.t)('Mo', { context: 'day_of_week' }),
          [r.WeekDays.TUESDAY]: Object(o.t)('Tu', { context: 'day_of_week' }),
          [r.WeekDays.WEDNESDAY]: Object(o.t)('We', { context: 'day_of_week' }),
          [r.WeekDays.THURSDAY]: Object(o.t)('Th', { context: 'day_of_week' }),
          [r.WeekDays.FRIDAY]: Object(o.t)('Fr', { context: 'day_of_week' }),
          [r.WeekDays.SATURDAY]: Object(o.t)('Sa', { context: 'day_of_week' }),
        }
    },
    R5JZ: function (e, t, n) {
      'use strict'
      function o(e, t, n, o, r) {
        function i(r) {
          if (e > r.timeStamp) return
          const i = r.target
          void 0 !== n && null !== t && null !== i && i.ownerDocument === o && (t.contains(i) || n(r))
        }
        return (
          r.click && o.addEventListener('click', i, !1),
          r.mouseDown && o.addEventListener('mousedown', i, !1),
          r.touchEnd && o.addEventListener('touchend', i, !1),
          r.touchStart && o.addEventListener('touchstart', i, !1),
          () => {
            o.removeEventListener('click', i, !1),
              o.removeEventListener('mousedown', i, !1),
              o.removeEventListener('touchend', i, !1),
              o.removeEventListener('touchstart', i, !1)
          }
        )
      }
      n.d(t, 'a', function () {
        return o
      })
    },
    XYXm: function (e, t, n) {
      e.exports = { body: 'body-2IgbkgW8' }
    },
    ZzxF: function (e, t, n) {
      'use strict'
      n.r(t)
      n('YFKU')
      var o = n('q1tI'),
        r = n('WXjp'),
        i = n('TSYQ'),
        s = n('kgsH'),
        c = n('uo4K'),
        a = n('Iivm')
      function u(e) {
        const t = e.hideIcon ? null : o.createElement(a.a, { className: s.close, icon: c, onClick: e.onClose })
        return o.createElement(
          'div',
          { className: i(s.header, e.className), 'data-dragg-area': !0, ref: e.reference },
          e.children,
          t,
        )
      }
      n('kQXJ')
      var l = n('XYXm')
      function d(e) {
        return o.createElement('div', { className: i(l.body, e.className), ref: e.reference }, e.children)
      }
      n('8Rai'), n('cJj4')
      var p = n('ycI/'),
        f = n('FQhm'),
        m = n('ZjKI'),
        b = n('g9Yu')
      n.d(t, 'SymbolInfoDialog', function () {
        return y
      })
      class y extends o.PureComponent {
        constructor() {
          super(...arguments), (this._close = () => this.props.onClose())
        }
        componentDidMount() {
          f.subscribe(m.CLOSE_POPUPS_AND_DIALOGS_COMMAND, this._close, null)
        }
        componentWillUnmount() {
          f.unsubscribe(m.CLOSE_POPUPS_AND_DIALOGS_COMMAND, this._close, null)
        }
        render() {
          return o.createElement(
            r.a,
            { className: b.popupDialog, isOpened: this.props.isOpened, onClickOutside: this.props.onClose },
            o.createElement(u, { onClose: this.props.onClose }, window.t('Symbol Info')),
            o.createElement(
              d,
              null,
              o.createElement(p.a, { keyCode: 27, handler: this.props.onClose }),
              o.createElement(
                'div',
                { className: b.content, 'data-symbol-info-dialog-content': !0 },
                this._renderFields(),
              ),
            ),
          )
        }
        _renderFields() {
          return this.props.fields
            ? this.props.fields.map((e, t) =>
                o.createElement(
                  'div',
                  { key: e.propName + t.toString(), className: b.row },
                  o.createElement(
                    'div',
                    { className: i(b.column, b.columnTitle) },
                    o.createElement('span', { className: b.title }, e.title),
                  ),
                  o.createElement(
                    'div',
                    { className: i(b.column, b.columnValue) },
                    o.createElement(
                      'span',
                      { className: b.value },
                      (function (e) {
                        const t = e.value || e.defValue || '-'
                        if (e.setHtml) return o.createElement('span', { dangerouslySetInnerHTML: { __html: t } })
                        return t
                      })(e),
                    ),
                  ),
                ),
              )
            : []
        }
      }
    },
    cJj4: function (e, t, n) {
      e.exports = {
        message: 'message-2dEP78zc',
        error: 'error-2dEP78zc',
      }
    },
    g9Yu: function (e, t, n) {
      e.exports = {
        popupDialog: 'popupDialog-2uQzjNpP',
        content: 'content-2uQzjNpP',
        row: 'row-2uQzjNpP',
        column: 'column-2uQzjNpP',
        title: 'title-2uQzjNpP',
        value: 'value-2uQzjNpP',
        columnTitle: 'columnTitle-2uQzjNpP',
        columnValue: 'columnValue-2uQzjNpP',
      }
    },
    ijHL: function (e, t, n) {
      'use strict'
      function o(e) {
        return i(e, s)
      }
      function r(e) {
        return i(e, c)
      }
      function i(e, t) {
        const n = Object.entries(e).filter(t),
          o = {}
        for (const [e, t] of n) o[e] = t
        return o
      }
      function s(e) {
        const [t, n] = e
        return 0 === t.indexOf('data-') && 'string' == typeof n
      }
      function c(e) {
        return 0 === e[0].indexOf('aria-')
      }
      n.d(t, 'b', function () {
        return o
      }),
        n.d(t, 'a', function () {
          return r
        }),
        n.d(t, 'c', function () {
          return i
        }),
        n.d(t, 'e', function () {
          return s
        }),
        n.d(t, 'd', function () {
          return c
        })
    },
    kQXJ: function (e, t, n) {
      e.exports = { footer: 'footer-16Va6-EJ' }
    },
    kgsH: function (e, t, n) {
      e.exports = { header: 'header-2ibjJG9Z', close: 'close-2ibjJG9Z' }
    },
    qoI1: function (e, t, n) {
      var o = {
        './en-gb': 'Oaa7',
        './en-gb.js': 'Oaa7',
        './es': 'iYuL',
        './es.js': 'iYuL',
        './it': 'bpih',
        './it.js': 'bpih',
        './ja': 'B55N',
        './ja.js': 'B55N',
        './ko': 'Ivi+',
        './ko.js': 'Ivi+',
        './pl': 'jVdC',
        './pl.js': 'jVdC',
        './pt': '8mBD',
        './pt-br': '0tRk',
        './pt-br.js': '0tRk',
        './pt.js': '8mBD',
        './ru': 'lXzo',
        './ru.js': 'lXzo',
        './tr': 'DoHr',
        './tr.js': 'DoHr',
      }
      function r(e) {
        var t = i(e)
        return n(t)
      }
      function i(e) {
        if (!n.o(o, e)) {
          var t = new Error("Cannot find module '" + e + "'")
          throw ((t.code = 'MODULE_NOT_FOUND'), t)
        }
        return o[e]
      }
      ;(r.keys = function () {
        return Object.keys(o)
      }),
        (r.resolve = i),
        (e.exports = r),
        (r.id = 'qoI1')
    },
    uo4K: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 13" width="13" height="13"><path fill="currentColor" d="M5.18 6.6L1.3 2.7.6 2 2 .59l.7.7 3.9 3.9 3.89-3.9.7-.7L12.61 2l-.71.7L8 6.6l3.89 3.89.7.7-1.4 1.42-.71-.71L6.58 8 2.72 11.9l-.71.7-1.41-1.4.7-.71 3.9-3.9z"/></svg>'
    },
    w3Pp: function (e, t, n) {
      'use strict'
      n.r(t),
        n.d(t, 'marketType', function () {
          return a
        })
      var o = n('YFKU')
      n('HbRj')
      const r = new Map(),
        i = { context: 'market_type' },
        s = {
          cfd: Object(o.t)('cfd', i),
          bitcoin: Object(o.t)('crypto', i),
          crypto: Object(o.t)('crypto', i),
          dr: Object(o.t)('dr', i),
          forex: Object(o.t)('forex', i),
          futures: Object(o.t)('futures', i),
          index: Object(o.t)('index', i),
          stock: Object(o.t)('stock', i),
        },
        c = new Set(['cfd', 'spreadbet', 'defi'])
      function a(e, t = []) {
        const n = t.filter(e => c.has(e)),
          a = `${e}_${n.sort().join('_')}`,
          u = r.get(a)
        if (void 0 !== u) return u
        const l = Boolean(t.length) ? Object(o.t)(e, i) + ' ' + n.join(' ') : s[e] || e
        return r.set(a, l), l
      }
    },
    'ycI/': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return r
      })
      var o = n('q1tI')
      class r extends o.PureComponent {
        constructor() {
          super(...arguments),
            (this._handleKeyDown = e => {
              e.keyCode === this.props.keyCode && this.props.handler(e)
            })
        }
        componentDidMount() {
          document.addEventListener(this.props.eventType || 'keydown', this._handleKeyDown, !1)
        }
        componentWillUnmount() {
          document.removeEventListener(this.props.eventType || 'keydown', this._handleKeyDown, !1)
        }
        render() {
          return null
        }
      }
    },
  },
])
