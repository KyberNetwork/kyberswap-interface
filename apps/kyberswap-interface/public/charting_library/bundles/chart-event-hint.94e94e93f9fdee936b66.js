;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['chart-event-hint'],
  {
    '+EG+': function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return o
      }),
        n.d(t, 'b', function () {
          return i
        })
      var r = n('q1tI')
      class o extends r.Component {
        shouldComponentUpdate() {
          return !1
        }
        render() {
          return r.createElement('div', {
            style: { position: 'fixed', zIndex: 150, left: 0, top: 0 },
            ref: this.props.reference,
          })
        }
      }
      const i = r.createContext(null)
    },
    '79vt': function (e, t, n) {
      e.exports = {
        container: 'container-113jHcZc',
        content: 'content-113jHcZc',
        arrowHolder: 'arrowHolder-113jHcZc',
        'arrowHolder--below': 'arrowHolder--below-113jHcZc',
        'arrowHolder--above': 'arrowHolder--above-113jHcZc',
        'arrowHolder--before': 'arrowHolder--before-113jHcZc',
        'arrowHolder--after': 'arrowHolder--after-113jHcZc',
        'arrowHolder--above-fix': 'arrowHolder--above-fix-113jHcZc',
        'arrowHolder--before-rtl-fix': 'arrowHolder--before-rtl-fix-113jHcZc',
        'arrowHolder--after-ltr-fix': 'arrowHolder--after-ltr-fix-113jHcZc',
        label: 'label-113jHcZc',
        closeButton: 'closeButton-113jHcZc',
      }
    },
    AiMB: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return c
      }),
        n.d(t, 'b', function () {
          return l
        })
      var r = n('q1tI'),
        o = n('i8i4'),
        i = n('e3/o'),
        s = n('jAh7'),
        a = n('+EG+')
      class c extends r.PureComponent {
        constructor() {
          super(...arguments), (this._uuid = Object(i.guid)())
        }
        componentWillUnmount() {
          this._manager().removeWindow(this._uuid)
        }
        render() {
          const e = this._manager().ensureWindow(this._uuid, this.props.layerOptions)
          return (
            (e.style.top = this.props.top || ''),
            (e.style.bottom = this.props.bottom || ''),
            (e.style.left = this.props.left || ''),
            (e.style.right = this.props.right || ''),
            (e.style.pointerEvents = this.props.pointerEvents || ''),
            o.createPortal(r.createElement(l.Provider, { value: this }, this.props.children), e)
          )
        }
        moveToTop() {
          this._manager().moveToTop(this._uuid)
        }
        _manager() {
          return null === this.context ? Object(s.b)() : this.context
        }
      }
      c.contextType = a.b
      const l = r.createContext(null)
    },
    Iivm: function (e, t, n) {
      'use strict'
      var r = n('q1tI')
      const o = r.forwardRef((e, t) => {
        const { icon: n = '', ...o } = e
        return r.createElement('span', { ...o, ref: t, dangerouslySetInnerHTML: { __html: n } })
      })
      n.d(t, 'a', function () {
        return o
      })
    },
    PN5r: function (e, t, n) {
      'use strict'
      n.r(t)
      var r = n('q1tI'),
        o = n.n(r),
        i = n('i8i4'),
        s = n('TSYQ'),
        a = n('Iivm'),
        c = (n('AiMB'), n('To8B')),
        l = n('79vt')
      r.PureComponent
      function d(e) {
        const {
          className: t,
          containerClassName: n,
          contentClassName: o,
          reference: i,
          style: d,
          arrow: h = !0,
          arrowClassName: u,
          arrowReference: p,
          onClose: m,
          arrowStyle: w,
          children: f,
          ..._
        } = e
        return r.createElement(
          'div',
          { ..._, className: t, ref: i, style: d },
          h && r.createElement('div', { className: u, ref: p, style: w }),
          r.createElement(
            'div',
            { className: s(l.container, n) },
            r.createElement('div', { className: s(l.content, o) }, f),
            m && r.createElement(a.a, { className: l.closeButton, icon: c, onClick: m }),
          ),
        )
      }
      var h = n('g2Cz')
      function u(e) {
        const { text: t, onClose: n } = e
        return o.a.createElement(
          'div',
          { className: h.container },
          o.a.createElement(
            'div',
            { className: h.centerElement },
            o.a.createElement(d, { arrow: !1, onClose: n }, o.a.createElement('div', { className: h.text }, t)),
          ),
        )
      }
      n.d(t, 'ChartEventHintRenderer', function () {
        return p
      })
      class p {
        constructor(e) {
          ;(this._wrap = document.createElement('div')), (this._container = e)
        }
        show(e, t) {
          if (!this._wrap) return
          this.hide(), this._container.append(this._wrap)
          const n = {
            text: e,
            onClose: () => {
              t && t(), this.hide()
            },
          }
          i.render(r.createElement(u, { ...n }), this._wrap)
        }
        hide() {
          this._wrap && (i.unmountComponentAtNode(this._wrap), this._wrap.remove())
        }
        destroy() {
          this.hide(), delete this._wrap
        }
      }
    },
    To8B: function (e, t) {
      e.exports =
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path fill="currentColor" d="M9.707 9l4.647-4.646-.707-.708L9 8.293 4.354 3.646l-.708.708L8.293 9l-4.647 4.646.708.708L9 9.707l4.646 4.647.708-.707L9.707 9z"/></svg>'
    },
    g2Cz: function (e, t, n) {
      e.exports = { container: 'container-RnpzRzG6', centerElement: 'centerElement-RnpzRzG6', text: 'text-RnpzRzG6' }
    },
    jAh7: function (e, t, n) {
      'use strict'
      n.d(t, 'a', function () {
        return i
      }),
        n.d(t, 'b', function () {
          return a
        })
      var r = n('Eyy1')
      class o {
        constructor() {
          this._storage = []
        }
        add(e) {
          this._storage.push(e)
        }
        remove(e) {
          this._storage = this._storage.filter(t => e !== t)
        }
        has(e) {
          return this._storage.includes(e)
        }
        getItems() {
          return this._storage
        }
      }
      class i {
        constructor(e = document) {
          ;(this._storage = new o()),
            (this._windows = new Map()),
            (this._index = 0),
            (this._document = e),
            (this._container = e.createDocumentFragment())
        }
        setContainer(e) {
          const t = this._container,
            n = null === e ? this._document.createDocumentFragment() : e
          !(function (e, t) {
            Array.from(e.childNodes).forEach(e => {
              e.nodeType === Node.ELEMENT_NODE && t.appendChild(e)
            })
          })(t, n),
            (this._container = n)
        }
        registerWindow(e) {
          this._storage.has(e) || this._storage.add(e)
        }
        ensureWindow(e, t = { position: 'fixed', direction: 'normal' }) {
          const n = this._windows.get(e)
          if (void 0 !== n) return n
          this.registerWindow(e)
          const r = this._document.createElement('div')
          if (
            ((r.style.position = t.position),
            (r.style.zIndex = this._index.toString()),
            (r.dataset.id = e),
            void 0 !== t.index)
          ) {
            const e = this._container.childNodes.length
            if (t.index >= e) this._container.appendChild(r)
            else if (t.index <= 0) this._container.insertBefore(r, this._container.firstChild)
            else {
              const e = this._container.childNodes[t.index]
              this._container.insertBefore(r, e)
            }
          } else
            'reverse' === t.direction
              ? this._container.insertBefore(r, this._container.firstChild)
              : this._container.appendChild(r)
          return this._windows.set(e, r), ++this._index, r
        }
        unregisterWindow(e) {
          this._storage.remove(e)
          const t = this._windows.get(e)
          void 0 !== t && (null !== t.parentElement && t.parentElement.removeChild(t), this._windows.delete(e))
        }
        getZindex(e) {
          const t = this.ensureWindow(e)
          return parseInt(t.style.zIndex || '0')
        }
        moveToTop(e) {
          if (this.getZindex(e) !== this._index) {
            this.ensureWindow(e).style.zIndex = (++this._index).toString()
          }
        }
        removeWindow(e) {
          this.unregisterWindow(e)
        }
      }
      const s = new WeakMap()
      function a(e = document) {
        const t = e.getElementById('overlap-manager-root')
        if (null !== t) return Object(r.ensureDefined)(s.get(t))
        {
          const t = new i(e),
            n = (function (e) {
              const t = e.createElement('div')
              return (
                (t.style.position = 'absolute'),
                (t.style.zIndex = (150).toString()),
                (t.style.top = '0px'),
                (t.style.left = '0px'),
                (t.id = 'overlap-manager-root'),
                t
              )
            })(e)
          return s.set(n, t), t.setContainer(n), e.body.appendChild(n), t
        }
      }
    },
  },
])
