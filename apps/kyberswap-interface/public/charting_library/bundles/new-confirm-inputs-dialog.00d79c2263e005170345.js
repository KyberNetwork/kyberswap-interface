;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['new-confirm-inputs-dialog'],
  {
    RaCQ: function (t, e, n) {
      'use strict'
      function i(t, e) {
        return 'symbol' === e ? t.inputs.filter(e => e.id === t.symbolInputId()) : t.inputs.filter(t => t.confirm)
      }
      n.d(e, 'a', function () {
        return i
      })
    },
    T4SC: function (t, e, n) {
      'use strict'
      n.r(e),
        n.d(e, 'selectInputValuesOnChart', function () {
          return c
        })
      var i = n('Eyy1'),
        o = n('YFKU'),
        s = n('M87J'),
        r = n('RaCQ')
      async function c(t, e, n = 'default') {
        const c = Object(r.a)(e, n),
          u = Object(s.a)(c)
        for await (const t of u) await l(t)
        const a = c.filter(p)
        return c.length === a.length
        async function l(t) {
          if (Object(s.b)(t))
            if (Object(s.c)(t)) {
              const n = (function (t) {
                if (2 === t.length) {
                  const e = 'price' === t[0].type,
                    n = 'time' === t[0].type,
                    i = 'price' === t[1].type,
                    o = 'time' === t[1].type
                  if ((e && o) || (n && i)) return { time: t[n ? 0 : 1], price: t[e ? 0 : 1] }
                }
                return null
              })(t.children)
              if (n) {
                const { time: t, price: s } = n,
                  r = Object(o.t)('Set the {inputInline} time and price for {studyShortDescription}').format({
                    inputInline: Object(i.ensureDefined)(t.inline),
                    studyShortDescription: e.shortDescription,
                  })
                await m('all', r, t.id, s.id)
              } else for await (const e of t.children) await f(e)
            } else for await (const e of t.children) await l(e)
          else await f(t)
        }
        function p(t) {
          return 'time' === t.type || 'price' === t.type
        }
        async function f(t) {
          if (!p(t)) return
          const n = 'time' === t.type,
            i = n ? 'time' : 'price',
            s = n
              ? Object(o.t)('Set the {inputTitle} time for {studyShortDescription}').format({
                  inputTitle: t.name,
                  studyShortDescription: e.shortDescription,
                })
              : Object(o.t)('Set the {inputTitle} price for {studyShortDescription}').format({
                  inputTitle: t.name,
                  studyShortDescription: e.shortDescription,
                }),
            r = n ? t.id : void 0,
            c = n ? void 0 : t.id
          await m(i, s, r, c)
        }
        async function m(n, i, o, s) {
          const r = await t.requestSelectPoint(n, i),
            { inputs: c } = e.defaults
          c && (o && (c[o] = 1e3 * (r.point.time || 0)), s && (c[s] = r.point.price))
        }
      }
    },
    iqv3: function (t, e, n) {
      'use strict'
      n.r(e)
      var i = n('i8i4'),
        o = n('q1tI'),
        s = n.n(o),
        r = (n('bSeV'), n('YFKU')),
        c = n('ycFu'),
        u = n('tWVy'),
        a = n('tmL0'),
        l = n('5Ssy'),
        p = n('tc+8'),
        f = n.n(p),
        m = n('aIyQ'),
        d = n.n(m),
        y = n('qFKp'),
        h = n('RaCQ'),
        b = n('jOdQ')
      function S(t) {
        const { title: e, studyMetaInfo: n, model: i, confirmInputsType: p, onCancel: m, onSubmit: S, onClose: O } = t,
          [w, C] = Object(o.useState)(!0),
          j = Object(o.useMemo)(function () {
            const t = Object.assign({}, n.defaults.inputs)
            return new f.a({ inputs: t })
          }, []),
          I = Object(o.useMemo)(function () {
            const t = new d.a()
            return {
              isInputsStudy: !0,
              symbolsResolved: () => t,
              resolvedSymbolInfoBySymbol: () => null,
              tempProperties: j,
            }
          }, []),
          _ = Object(o.useRef)(null)
        return (
          Object(o.useEffect)(() => {
            if (!y.CheckMobile.any() && w && 'symbol' === p && _.current) {
              const t = _.current.querySelector('input')
              t && t.focus()
            }
          }, [w]),
          s.a.createElement(c.a, {
            dataName: 'confirm-inputs-dialog',
            title: e,
            isOpened: w,
            onSubmit: function () {
              S(j.state().inputs), D()
            },
            onCancel: m,
            onClickOutside: D,
            onClose: D,
            render: () =>
              s.a.createElement(
                s.a.Fragment,
                null,
                s.a.createElement('div', { className: b.separator }),
                s.a.createElement(
                  a.a,
                  { className: b.scrollable, onScroll: T },
                  s.a.createElement(l.a, { reference: _, property: j, model: i, study: I, inputs: Object(h.a)(n, p) }),
                ),
              ),
            defaultActionOnClose: 'none',
            submitButtonText: Object(r.t)('Apply'),
            submitOnEnterKey: !1,
          })
        )
        function T() {
          u.a.fire()
        }
        function D() {
          C(!1), O()
        }
      }
      n.d(e, 'ConfirmInputsDialogRenderer', function () {
        return O
      })
      class O {
        constructor(t, e, n, o, s, r) {
          ;(this._container = document.createElement('div')),
            (this._handleClose = () => {
              i.unmountComponentAtNode(this._container), this._onClose()
            }),
            (this._title = t),
            (this._studyMetaInfo = e),
            (this._model = n),
            (this._confirmInputsType = o),
            (this._onSubmit = s),
            (this._onClose = r)
        }
        show() {
          i.render(
            o.createElement(S, {
              title: this._title,
              studyMetaInfo: this._studyMetaInfo,
              model: this._model,
              confirmInputsType: this._confirmInputsType,
              onSubmit: this._onSubmit,
              onCancel: () => {},
              onClose: this._handleClose,
            }),
            this._container,
          )
        }
      }
    },
    jOdQ: function (t, e, n) {
      t.exports = { separator: 'separator-3wSrFLTr', scrollable: 'scrollable-3wSrFLTr' }
    },
  },
])
