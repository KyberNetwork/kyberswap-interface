;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['take-chart-image-impl'],
  {
    '13es': function (t, e, n) {
      'use strict'
      n.r(e)
      var a = n('txPx'),
        o = n('Kxc7'),
        i = n('MbIA'),
        r = n('8woN'),
        c = n('qHEz'),
        s = n('Rdaf'),
        l = n('QC7+'),
        d = (n('HbRj'), n('YFKU'), n('wVAQ'))
      function p(t, e = {}) {
        return new Promise((n, a) => {
          !(async function (t, e, n, a = {}) {
            var i
            const r = new FormData()
            if (void 0 !== a.previews) for (const t of a.previews) r.append('previews[]', t)
            void 0 !== a.cme && r.append('cme', String(a.cme))
            void 0 !== a.wl && r.append('wl', String(a.wl))
            void 0 !== a.onWidget && r.append('onWidget', String(a.onWidget))
            a.isReport && r.append('isReport', String(a.isReport))
            a.asyncSave && r.append('asyncSave', String(a.asyncSave))
            const c = window.urlParams
            c && c.locale && r.append('language', c.locale)
            const s = t.activeChartWidget.value(),
              l = s.widgetCustomer()
            void 0 !== l && r.append('customer', l)
            let p = s.properties().childs().timezone.value()
            'exchange' === p &&
              (p = (null === (i = s.model().mainSeries().symbolInfo()) || void 0 === i ? void 0 : i.timezone) || p)
            if ((r.append('timezone', p), a.sendClientImage)) {
              const e = await t.clientSnapshot(),
                n = await new Promise(t => e.toBlob(t))
              null !== n && r.append('preparedImage', n)
            } else
              r.append(
                'images',
                JSON.stringify(t.images(), (t, e) => (e instanceof HTMLCanvasElement ? null : e)),
              )
            !(async function (t, e, n, a = {}) {
              const i = o.enabled('charting_library_base')
                ? a.snapshotUrl || 'https://www.tradingview.com/snapshot/'
                : '/snapshot/'
              try {
                const a = await Object(d.fetch)(i, { body: t, method: 'POST', credentials: 'same-origin' }),
                  o = await a.text()
                a.ok ? e(o) : n()
              } catch (t) {
                n()
              }
            })(r, e, n, a)
          })(t, n, a, e)
        })
      }
      n.d(e, 'copyToClipboardImageOfChart', function () {
        return m
      }),
        n.d(e, 'getImageOfChartSilently', function () {
          return h
        }),
        n.d(e, 'copyToClipboardClientScreenshot', function () {
          return g
        }),
        n.d(e, 'downloadClientScreenshot', function () {
          return f
        })
      const w = Object(a.getLogger)('Platform.TakeChartImage'),
        u = new i.a({ dateTimeSeparator: '_', timeFormat: '%h-%m-%s' })
      async function m(t, e) {
        const n = p(t, e),
          a = n.then(t => (o.enabled('charting_library_base') && e.snapshotUrl ? t : Object(l.a)(t))),
          i = a.then(t => new Blob([t], { type: 'text/plain' }))
        try {
          return await Object(c.b)(i, 'text/plain'), n
        } catch (t) {
          throw (window.open(await a), t)
        }
      }
      async function h(t, e) {
        try {
          return await p(t, e)
        } catch (t) {
          throw (w.logWarn('Error while trying to create snapshot'), t)
        }
      }
      async function g(t) {
        const e = t.clientSnapshot(),
          n = e.then(
            t =>
              new Promise(e =>
                t.toBlob(t => {
                  null !== t && e(t)
                }),
              ),
          )
        try {
          return await Object(c.b)(n, 'image/png')
        } catch (t) {
          const n = window.open()
          throw (n && n.document.write(`<img width="100%" src="${(await e).toDataURL()}"/>`), t)
        }
      }
      async function f(t) {
        const e = t.activeChartWidget.value().model().mainSeries().actualSymbol(),
          n = `${Object(r.shortName)(e)}_${u.formatLocal(new Date())}`,
          a = await t.clientSnapshot()
        Object(s.a)(n + '.png', a.toDataURL())
      }
    },
    'QC7+': function (t, e, n) {
      'use strict'
      n.d(e, 'a', function () {
        return i
      })
      var a = n('Kxc7'),
        o = n('Wt0y')
      function i(t) {
        return a.enabled('charting_library_base') || Object(o.isProd)()
          ? 'https://www.tradingview.com/x/' + t + '/'
          : window.location.protocol + '//' + window.location.host + '/x/' + t + '/'
      }
    },
    Rdaf: function (t, e, n) {
      'use strict'
      function a(t, e) {
        const n = document.createElement('a')
        ;(n.style.display = 'none'), (n.href = e), (n.download = t), n.click()
      }
      n.d(e, 'a', function () {
        return a
      })
    },
  },
])
