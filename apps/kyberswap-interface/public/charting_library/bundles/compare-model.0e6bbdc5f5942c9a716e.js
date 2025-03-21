;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['compare-model'],
  {
    '1pWb': function (e, t, s) {
      'use strict'
      function o(e) {
        return !1
      }
      s.d(t, 'b', function () {
        return o
      }),
        s.d(t, 'a', function () {
          return '###'
        })
    },
    TgrR: function (e, t, s) {
      'use strict'
      function o(e) {
        if (e.fullName) return e.fullName
        let t
        return (
          (t = e.prefix || e.exchange ? (e.prefix || e.exchange) + ':' + e.name : e.name),
          t.replace(/<\/?[^>]+(>|$)/g, '')
        )
      }
      function n(e) {
        return '' === e.value
      }
      function i() {
        const e = a()
        return e.find(n) || e[0] || null
      }
      function r() {
        return a()
      }
      function a() {
        return window.ChartApiInstance.supportedExchangesList().map(e => ({
          ...e,
          country: '',
          providerId: '',
          flag: '',
        }))
      }
      function c() {
        return window.ChartApiInstance.supportedSymbolsTypes()
      }
      function l() {
        return ''
      }
      function d() {
        return !1
      }
      s.d(t, 'f', function () {
        return o
      }),
        s.d(t, 'g', function () {
          return n
        }),
        s.d(t, 'e', function () {
          return i
        }),
        s.d(t, 'c', function () {
          return r
        }),
        s.d(t, 'd', function () {
          return c
        }),
        s.d(t, 'b', function () {
          return l
        }),
        s.d(t, 'a', function () {
          return d
        })
    },
    cK0E: function (e, t, s) {
      'use strict'
      s.r(t)
      var o = s('Eyy1'),
        n = s('Kxc7'),
        i = s('jy4L'),
        r = s('5fI3'),
        a = s('hY0g'),
        c = s.n(a),
        l = s('xlAh'),
        d = s('cKqi'),
        h = s('YzC7'),
        u = s('qC62'),
        m = s('TgrR')
      new Set(['short_name', 'description', 'exchange', 'type', 'country_code', 'provider_id'])
      const b = Object(m.c)(),
        y = {}
      for (const e of b) y[e.value] = { country: e.country, providerId: e.providerId }
      function S(e) {
        return e instanceof d.study_Overlay || e instanceof h.a
      }
      function _(e) {
        if (!e) return
        const [t, s] = e.split(':')
        return s && t && y[t] ? y[t] : void 0
      }
      function f(e, t, s) {
        const o = u.a.fromSymbolInfo(e),
          n = _(o)
        return {
          id: (null == s ? void 0 : s.id()) || o,
          symbol: o,
          checked: t,
          title: e.name,
          description: e.description,
          exchangeName: e.exchange,
          country: null == n ? void 0 : n.country,
          providerId: null == n ? void 0 : n.providerId,
          marketType: e.type,
          study: s,
        }
      }
      function p(e, t, s, o) {
        return { id: void 0 !== s ? s.id() : e, symbol: e, checked: t, title: e, study: s, description: o }
      }
      var g = s('Vdly'),
        v = s('IWXC'),
        I = s('1pWb')
      const w = new Map()
      class k {
        constructor(e, t, s = 'watchlist') {
          ;(this._symbolDataHandlers = new Map()),
            (this._fastSymbols = new Set()),
            (this._subscribedSymbols = new Set()),
            (this._subscriptionSet = new Set()),
            (this._cancelSubscriptionSet = new Set()),
            (this._resolvedSymbolsSet = new Set()),
            (this._quoteSessionDataHandler = e => {
              const t = Object(o.ensureDefined)(e.symbolname),
                { filtered: s, keepSubscription: n } = this._applyDataFilters(e)
              n || this._unsubscribeSymbols([t]), this._setSymbolDataCache(t, s)
              const i = this._symbolDataHandlers.get(t)
              i && i(s)
            }),
            (this._clientId = e),
            (this._quoteSession = Object(v.getQuoteSessionInstance)(s)),
            (this._lastSymbolData = t || new Map())
        }
        destroy() {
          const e = Array.from(this._subscribedSymbols)
          this._unsubscribeSymbols(e)
        }
        addFastSymbol(e) {
          this._fastSymbols.has(e) ||
            !this._subscribedSymbols.has(e) ||
            Object(I.b)(e) ||
            (this._fastSymbols.add(e), this._quoteSession.setFastSymbols(this._clientId, Array.from(this._fastSymbols)))
        }
        removeFastSymbol(e) {
          this._fastSymbols.has(e) &&
            (this._fastSymbols.delete(e),
            this._quoteSession.setFastSymbols(this._clientId, Array.from(this._fastSymbols)))
        }
        addSymbolDataHandler(e, t) {
          Object(I.b)(e) || this._symbolDataHandlers.set(e, t)
        }
        removeSymbolDataHandler(e) {
          this._symbolDataHandlers.delete(e)
        }
        addToSubscriptionSet(e) {
          e.forEach(e => {
            Object(I.b)(e) || this._subscriptionSet.add(e)
          })
        }
        clearSubscriptionSet() {
          this._subscriptionSet.clear()
        }
        addToCancelSubscriptionSet(e) {
          e.forEach(e => {
            Object(I.b)(e) || this._cancelSubscriptionSet.add(e)
          })
        }
        commitSubscriptionChanges() {
          Array.from(this._subscriptionSet).forEach(e => {
            this._cancelSubscriptionSet.has(e) &&
              (this._subscriptionSet.delete(e), this._cancelSubscriptionSet.delete(e))
          }),
            this._subscribeSymbols(Array.from(this._subscriptionSet)),
            this._subscriptionSet.clear(),
            this._unsubscribeSymbols(Array.from(this._cancelSubscriptionSet)),
            this._cancelSubscriptionSet.clear(),
            this._quoteSession.setFastSymbols(this._clientId, Array.from(this._fastSymbols))
        }
        getLastSymbolData(e) {
          return this._lastSymbolData.get(e)
        }
        getSymbolSnapshotForAll(e, t, s = guid()) {
          const o = e.map(e => this.getSymbolSnapshot(e, t, s))
          return Promise.all(o)
        }
        getSymbolSnapshot(e, t, s = guid()) {
          if (Object(I.b)(e)) return Promise.resolve(void 0)
          const o = this._lastSymbolData.get(e)
          if (o && 'ok' === o.status) {
            const s = this._resolvedSymbolsSet.has(e) && o.complete
            if (C(o, t) || s) return this._resolvedSymbolsSet.add(e), Promise.resolve(o)
          }
          return new Promise(o => {
            const n = this._clientId + '_snapshot_' + s,
              i = s => {
                const { filtered: r, keepSubscription: a } = this._applyDataFilters(s)
                r && 'error' !== r.status && this._setSymbolDataCache(e, r),
                  (!a || C(r, t) || 'error' === r.status || r.complete) &&
                    (this._quoteSession.unsubscribe(n, e, i), o(r))
              }
            this._quoteSession.subscribe(n, e, i)
          })
        }
        getSymbolFullName(e) {
          if (Object(I.b)(e)) return Promise.resolve(e)
          if (w.has(e)) return Object(o.ensureDefined)(w.get(e))
          const t = new Promise(t => {
            const s = this._clientId + '_SymbolFullName',
              o = n => {
                const i = n => {
                  this._quoteSession.unsubscribe(s, e, o), t(n)
                }
                n && 'ok' === n.status ? n.values && i(n.values.pro_name || e) : i(e)
              }
            this._quoteSession.subscribe(s, e, o)
          })
          return w.set(e, t), t
        }
        getSymbolsFullNames(e) {
          return Promise.all(e.map(e => this.getSymbolFullName(e)))
        }
        getUniqueSymbolsFullNames(e) {
          return this.getSymbolsFullNames(e).then(e => Array.from(new Set(e)))
        }
        _subscribeSymbols(e) {
          this._quoteSession.subscribe(this._clientId, e, this._quoteSessionDataHandler),
            e.forEach(e => this._subscribedSymbols.add(e))
        }
        _unsubscribeSymbols(e) {
          this._quoteSession.unsubscribe(this._clientId, e, this._quoteSessionDataHandler),
            e.forEach(e => {
              this._subscribedSymbols.delete(e)
            })
        }
        _setSymbolDataCache(e, t) {
          var s
          const o = (null === (s = this._lastSymbolData.get(e)) || void 0 === s ? void 0 : s.values) || {}
          this._resolvedSymbolsSet.add(e), this._lastSymbolData.set(e, { ...t, values: { ...o, ...t.values } })
        }
        _applyDataFilters(e) {
          return { filtered: e, keepSubscription: !0 }
        }
      }
      const D = new (class {
        constructor() {
          ;(this._adaptersMap = new Map()), (this._lastSymbolData = new Map())
        }
        destroy() {
          this._adaptersMap.forEach(e => {
            e.forEach(e => e.destroy())
          }),
            this._lastSymbolData.clear()
        }
        get(e, t = 'watchlist') {
          let s
          const o = this._adaptersMap.get(e)
          if (o) {
            const n = o.get(t)
            n ? (s = n) : ((s = new k(e, this._lastSymbolData, t)), o.set(t, s))
          } else {
            s = new k(e, this._lastSymbolData, t)
            const o = new Map()
            o.set(t, s), this._adaptersMap.set(e, o)
          }
          return s
        }
      })()
      function C(e, t) {
        for (const s of Array.from(t)) if (!e.values.hasOwnProperty(s)) return !1
        return !0
      }
      s.d(t, 'CompareModel', function () {
        return O
      })
      class O {
        constructor(e) {
          ;(this._contentItemList = new c.a([])),
            (this._checkedSymbols = new Map()),
            (this._recentLength = 10),
            (this._adapter = D.get('compare-dialog-adapter')),
            (this._isDataReady = new c.a(!1)),
            (this._highlightedSymbol = new c.a(null)),
            (this._defaultSymbolsDescriptions = new Map()),
            (this._idToStudyMap = new Map()),
            (this._chartSession = null),
            (this._recentSymbolsEnabled = n.enabled('compare_recent_symbols_enabled')),
            (this._preventHandleSourcesChange = !0),
            (this.removeStudy = e => {
              const { symbol: t, study: s } = e
              if (!s) return
              this._chartWidget.model().removeSource(s, !1)
              const o = this._checkedSymbols.get(t)
              o && o.length > 1 ? this._removeStudyIdFromCheckedSymbols(t, s.id()) : this._checkedSymbols.delete(t),
                this._updateContentItemList(this._contentItemList.value(), !0)
            }),
            (this._getResolveSymbolPromise = (e, t = Object(i.makeNextSymbolId)()) => {
              const s = Object(r.encodeExtendedSymbolOrGetSimpleSymbolString)({ symbol: e })
              return new Promise(e => {
                Object(o.ensureNotNull)(this._chartSession).resolveSymbol(t, s, t => {
                  e(t)
                })
              })
            }),
            (this._chartWidget = e.activeChartWidget.value()),
            (this._chartSession = this._chartWidget.model().model().chartApi())
          const t = new Set(this._loadRecent().reverse()),
            s = new Set(),
            a = new Set(),
            l = this._chartWidget.model().model().dataSources().filter(S),
            d = l.map(e => {
              const t = e.symbolInfo()
              if (t) return Promise.resolve(u.a.fromSymbolInfo(t))
              const s = e.symbol()
              return Object(u.b)(s)
            })
          Promise.all(d).then(e => {
            const o = e.map((e, t) => (void 0 !== e ? l[t] : void 0)).filter(A)
            e.filter(A).forEach((e, n) => {
              const i = o[n],
                r = i.id()
              this._addStudyIdToCheckedSymbols(e, r), this._idToStudyMap.set(r, i), t.has(e) ? s.add(e) : a.add(e)
            })
            const n = Array.from(t)
                .filter(e => this._checkedSymbols.has(e))
                .reduce((e, t) => (s.has(t) && e.push(t), e), [])
                .concat(Array.from(a)),
              r = Array.from(t)
            if (r.length < this._recentLength) {
              let e
              ;(e = []),
                this._chartWidget.compareSymbols() &&
                  this._chartWidget.compareSymbols().forEach(t => {
                    e.push(Object(u.b)(t.symbol)), this._defaultSymbolsDescriptions.set(t.symbol, t.title)
                  })
              const t = [...r, ...e]
              n.push(...t)
            } else n.push(...r)
            const c = Array.from(new Set(n))
            {
              const e = new Map(),
                t = c.map(t => {
                  const s = Object(i.makeNextSymbolId)()
                  return e.set(t, s), this._getResolveSymbolPromise(t, s)
                })
              Promise.all(t).then(t =>
                this._handleInitProcess(
                  n,
                  s => {
                    const o = e.get(s)
                    return t.find(e => e.params[0] === o)
                  },
                  (e, t) => u.a.fromSymbolMessage(t, e),
                  (e, t, s, o) =>
                    'symbol_resolved' === e.method ? f(e.params[1], s, o) : p(t, s, o, this._getSymbolDescription(t)),
                ),
              )
            }
          })
        }
        chartModel() {
          return this._chartWidget.model().model()
        }
        handleSourcesChange() {
          if (this._preventHandleSourcesChange) return
          const e = this.chartModel().dataSources().filter(S),
            t = new Set(e.map(e => e.id()))
          Array.from(t).forEach(e => {
            if (!this._checkedStudiesIds().has(e)) {
              const t = this.chartModel().dataSourceForId(e) || null
              if (null !== t && S(t)) {
                const t = this._getContentItemByStudyId(e)
                if (!t) return
                this._addStudyIdToCheckedSymbols(t.symbol, e),
                  this._saveRecent(t.symbol),
                  this._updateContentItemList(this._contentItemList.value(), !0)
              }
            }
          })
          Array.from(this._checkedStudiesIds()).forEach(e => {
            if (!t.has(e)) {
              const t = this._getContentItemByStudyId(e)
              if (!t) return
              const s = this._checkedSymbols.get(t.symbol)
              s && s.length > 1
                ? this._removeStudyIdFromCheckedSymbols(t.symbol, e)
                : this._checkedSymbols.delete(t.symbol),
                this._updateContentItemList(this._contentItemList.value(), !0)
            }
          })
        }
        studies() {
          return this._contentItemList.readonly()
        }
        isDataReady() {
          return this._isDataReady.readonly()
        }
        highlightedSymbol() {
          return this._highlightedSymbol.readonly()
        }
        applyStudy(e, t, s) {
          const o = this._chartWidget
          if (!o) return
          if (Object(I.b)(e)) return
          let n
          switch (t) {
            case l.a.SameScale:
              n = o.addCompareAsOverlay(e, s)
              break
            case l.a.NewPriceScale:
              n = o.addOverlayStudy(e, !0, s)
              break
            case l.a.NewPane:
              n = o.addOverlayStudy(e, !1, s)
          }
          Promise.all([this._getResolveSymbolPromise(e), n]).then(t =>
            this._handleApplyProcess(
              t,
              t => u.a.fromSymbolMessage(e, t),
              (e, t, s) => ('symbol_resolved' === e.method ? f(e.params[1], !0, s) : p(t, !0, s)),
            ),
          )
        }
        _handleApplyProcess(e, t, s) {
          const [o, n] = e
          if (!o || null === n) return
          const i = n.id(),
            r = t(o),
            a = s(o, r, n)
          this._saveRecent(r), this._addStudyIdToCheckedSymbols(r, i), this._showNewItem(a, r, i)
        }
        _handleInitProcess(e, t, s, o) {
          const n = []
          for (const i of e) {
            const e = t(i)
            if (!e) continue
            const r = s(e, i),
              a = this._checkedSymbols.get(r),
              c = -1 !== n.findIndex(e => e.symbol === r)
            if (void 0 === a || c) this._recentSymbolsEnabled && n.push(o(e, r, !1))
            else for (const t of a) n.push(o(e, r, !0, this._idToStudyMap.get(t)))
          }
          this._updateContentItemList(n), this._isDataReady.setValue(!0)
        }
        _showNewItem(e, t, s) {
          const o = this._contentItemList.value().map(this._updateChecked, this)
          o.unshift(e),
            this._recentSymbolsEnabled && o.unshift({ ...e, id: t, study: void 0, checked: !1 }),
            this._updateContentItemList(o),
            this._highlightedSymbol.setValue(s),
            setTimeout(() => this._highlightedSymbol.setValue(null), 500)
        }
        _addStudyIdToCheckedSymbols(e, t) {
          const s = this._checkedSymbols.get(e) || []
          this._checkedSymbols.set(e, [...s, t])
        }
        _removeStudyIdFromCheckedSymbols(e, t) {
          const s = this._checkedSymbols.get(e)
          if (s) {
            const o = s.indexOf(t)
            s.splice(o, 1), this._checkedSymbols.set(e, s)
          }
        }
        _updateChecked(e) {
          var t
          const s = this._checkedSymbols.get(e.symbol),
            o = null === (t = e.study) || void 0 === t ? void 0 : t.id()
          return o ? { ...e, checked: Boolean(s && s.includes(o)) } : e
        }
        _updateContentItemList(e, t) {
          const s = t ? e.map(this._updateChecked, this) : e,
            o = s.filter(e => e.checked)
          if (this._recentSymbolsEnabled) {
            const e = new Set(),
              t = s
                .reduce((t, s) => (s.checked || e.has(s.symbol) || (t.push(s), e.add(s.symbol)), t), [])
                .slice(0, this._recentLength)
            this._contentItemList.setValue(o.concat(t))
          } else this._contentItemList.setValue(o)
        }
        _checkedStudiesIds() {
          const e = [].concat(...Array.from(this._checkedSymbols.values()))
          return new Set(e)
        }
        _getContentItemByStudyId(e) {
          const t = this._contentItemList.value(),
            s = t.findIndex(t => t.study && t.study.id() === e)
          return t[s]
        }
        _loadRecent() {
          return this._recentSymbolsEnabled ? g.getJSON('CompareDialog.recent', []) : []
        }
        _saveRecent(e) {
          if (!this._recentSymbolsEnabled) return
          const t = new Set(this._loadRecent())
          t.has(e) && t.delete(e), t.add(e), g.setJSON('CompareDialog.recent', Array.from(t).slice(-this._recentLength))
        }
        _getSymbolDescription(e) {
          var t
          return this._defaultSymbolsDescriptions.size &&
            null !== (t = this._defaultSymbolsDescriptions.get(e)) &&
            void 0 !== t
            ? t
            : ''
        }
      }
      function A(e) {
        return void 0 !== e
      }
    },
    qC62: function (e, t, s) {
      'use strict'
      s.d(t, 'b', function () {
        return r
      }),
        s.d(t, 'a', function () {
          return o
        })
      var o,
        n = s('Eyy1'),
        i = s('Kxc7')
      s('TgrR')
      function r(e) {
        return e
      }
      !(function (e) {
        function t(e) {
          return e.pro_name
        }
        function s(e) {
          {
            const t = i.enabled('pay_attention_to_ticker_not_symbol') ? e.ticker : e.full_name
            return Object(n.ensureDefined)(t)
          }
        }
        ;(e.fromQuotesResponse = function (e) {
          const { values: s, symbolname: o, status: n } = e
          return 'error' === n && o ? o : t(s)
        }),
          (e.fromQuotes = t),
          (e.fromSymbolSearchResult = function (e, t) {
            {
              const { ticker: s, full_name: o } = null != t ? t : e
              return i.enabled('pay_attention_to_ticker_not_symbol')
                ? Object(n.ensureDefined)(null != s ? s : o)
                : Object(n.ensureDefined)(o)
            }
          }),
          (e.fromSymbolInfo = s),
          (e.fromSymbolMessage = function (e, t) {
            return 'symbol_resolved' === t.method ? s(t.params[1]) : e
          })
      })(o || (o = {}))
    },
    xlAh: function (e, t, s) {
      'use strict'
      var o
      s.d(t, 'a', function () {
        return o
      }),
        (function (e) {
          ;(e[(e.SameScale = 0)] = 'SameScale'),
            (e[(e.NewPriceScale = 1)] = 'NewPriceScale'),
            (e[(e.NewPane = 2)] = 'NewPane')
        })(o || (o = {}))
    },
  },
])
