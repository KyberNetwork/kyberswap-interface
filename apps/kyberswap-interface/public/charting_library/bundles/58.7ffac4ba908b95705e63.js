;(window.webpackJsonp = window.webpackJsonp || []).push([
  [58],
  {
    '5VK0': function (e, t, r) {
      e.exports = {
        scrollWrap: 'scrollWrap-1KEqJy8_',
        tabsWrap: 'tabsWrap-1KEqJy8_',
        tabs: 'tabs-1KEqJy8_',
        withoutBorder: 'withoutBorder-1KEqJy8_',
        tab: 'tab-1KEqJy8_',
        withHover: 'withHover-1KEqJy8_',
        headerBottomSeparator: 'headerBottomSeparator-1KEqJy8_',
        fadeWithoutSlider: 'fadeWithoutSlider-1KEqJy8_',
      }
    },
    '5o6O': function (e, t, r) {
      e.exports = {
        tabs: 'tabs-3I2ohC86',
        tab: 'tab-3I2ohC86',
        noBorder: 'noBorder-3I2ohC86',
        disabled: 'disabled-3I2ohC86',
        active: 'active-3I2ohC86',
        defaultCursor: 'defaultCursor-3I2ohC86',
        slider: 'slider-3I2ohC86',
        content: 'content-3I2ohC86',
      }
    },
    K3s3: function (e, t, r) {
      'use strict'
      r.d(t, 'a', function () {
        return l
      }),
        r.d(t, 'b', function () {
          return i
        }),
        r.d(t, 'c', function () {
          return c
        })
      var a = r('q1tI'),
        n = r('TSYQ'),
        o = r('Eyy1'),
        s = r('5o6O')
      const l = s
      function i(e) {
        const t = n(e.className, s.tab, {
          [s.active]: e.isActive,
          [s.disabled]: e.isDisabled,
          [s.defaultCursor]: !!e.shouldUseDefaultCursor,
          [s.noBorder]: !!e.noBorder,
        })
        return a.createElement(
          'div',
          {
            className: t,
            onClick: e.onClick,
            ref: e.reference,
            'data-type': 'tab-item',
            'data-value': e.value,
            'data-name': 'tab-item-' + e.value.toString().toLowerCase(),
          },
          e.children,
        )
      }
      function c(e) {
        return class extends a.PureComponent {
          constructor() {
            super(...arguments), (this.activeTab = { current: null })
          }
          componentDidUpdate() {
            ;(Object(o.ensureNotNull)(this._slider).style.transition = 'transform 350ms'), this._componentDidUpdate()
          }
          componentDidMount() {
            this._componentDidUpdate()
          }
          render() {
            const { className: t } = this.props,
              r = this._generateTabs()
            return a.createElement(
              'div',
              { className: n(t, s.tabs), 'data-name': this.props['data-name'] },
              r,
              a.createElement(e, {
                reference: e => {
                  this._slider = e
                },
              }),
            )
          }
          _generateTabs() {
            return (
              (this.activeTab.current = null),
              a.Children.map(this.props.children, e => {
                const t = e,
                  r = Boolean(t.props.isActive),
                  n = {
                    reference: e => {
                      r && (this.activeTab.current = e), t.props.reference && t.props.reference(e)
                    },
                  }
                return a.cloneElement(t, n)
              })
            )
          }
          _componentDidUpdate() {
            const e = Object(o.ensureNotNull)(this._slider).style
            if (this.activeTab.current) {
              const t = this.activeTab.current.offsetWidth,
                r = this.activeTab.current.offsetLeft
              ;(e.transform = `translateX(${r}px)`), (e.width = t + 'px'), (e.opacity = '1')
            } else e.opacity = '0'
          }
        }
      }
      c(function (e) {
        return a.createElement('div', { className: s.slider, ref: e.reference })
      })
    },
    LWBq: function (e, t, r) {
      'use strict'
      var a = r('q1tI'),
        n = r('ybVX')
      const o = {
          'Elliott Impulse Wave (12345)Degree': 'normal',
          'Elliott Triangle Wave (ABCDE)Degree': 'normal',
          'Elliott Triple Combo Wave (WXYXZ)Degree': 'normal',
          'Elliott Correction Wave (ABC)Degree': 'normal',
          'Elliott Double Combo Wave (WXY)Degree': 'normal',
          BarsPatternMode: 'normal',
          StudyInputSource: 'normal',
        },
        s = {
          TextText: 'big',
          AnchoredTextText: 'big',
          NoteText: 'big',
          AnchoredNoteText: 'big',
          CalloutText: 'big',
          BalloonText: 'big',
        }
      var l = r('Q+1u'),
        i = r('bvfV')
      function c(e) {
        return a.createElement(
          n.a.Provider,
          { value: s },
          a.createElement(
            n.b.Provider,
            { value: o },
            e.page &&
              a.createElement(
                l.a,
                { reference: e.pageRef, key: e.tableKey },
                e.page.definitions.value().map(e => a.createElement(i.a, { key: e.id, definition: e })),
              ),
          ),
        )
      }
      r.d(t, 'a', function () {
        return c
      })
    },
    aDg1: function (e, t, r) {
      'use strict'
      var a = r('q1tI'),
        n = r('TSYQ'),
        o = r('K3s3'),
        s = r('nPPD'),
        l = r('dMmr')
      const i = Object(s.a)(o.a, l)
      var c = r('4Cm8'),
        u = r('8+VR'),
        d = r('5VK0')
      r.d(t, 'a', function () {
        return p
      })
      const m = d,
        f = Object(o.c)(function (e) {
          return a.createElement(
            'div',
            { className: i.slider, ref: e.reference },
            a.createElement('div', { className: i.inner }),
          )
        })
      class p extends a.PureComponent {
        constructor() {
          super(...arguments),
            (this._createClickHandler = e => () => {
              this.props.onSelect(e)
            })
        }
        render() {
          const { theme: e = m, hiddenBottomBorders: t, fadedSlider: r = !0, ScrollComponent: o = c.a } = this.props,
            s = this._generateDialogTabs()
          return a.createElement(
            'div',
            { className: n(e.scrollWrap) },
            !t && a.createElement('div', { className: e.headerBottomSeparator }),
            a.createElement(
              o,
              {
                isVisibleFade: u.mobiletouch,
                isVisibleButtons: !u.mobiletouch,
                isVisibleScrollbar: !1,
                fadeClassName: n({ [e.fadeWithoutSlider]: !r }),
              },
              a.createElement(
                'div',
                { className: e.tabsWrap },
                a.createElement(f, { className: n(e.tabs, t && e.withoutBorder) }, s),
              ),
            ),
          )
        }
        _generateDialogTabs() {
          const { activeTabId: e, tabs: t, theme: r = m } = this.props
          return t.allIds.map(s => {
            const l = e === s
            return a.createElement(
              o.b,
              {
                key: s,
                value: s,
                className: n(r.tab, !l && r.withHover),
                isActive: l,
                onClick: this._createClickHandler(s),
              },
              t.byId[s].title,
            )
          })
        }
      }
    },
    dMmr: function (e, t, r) {
      e.exports = { slider: 'slider-3RfwXbxu', inner: 'inner-3RfwXbxu' }
    },
    lpmA: function (e, t, r) {
      e.exports = {
        themesButtonText: 'themesButtonText-3JA3MxY8',
        themesButtonIcon: 'themesButtonIcon-3JA3MxY8',
        defaultsButtonText: 'defaultsButtonText-3JA3MxY8',
        defaultsButtonItem: 'defaultsButtonItem-3JA3MxY8',
      }
    },
    pLAj: function (e, t, r) {
      'use strict'
      var a = r('q1tI'),
        n = r.n(a),
        o = (r('/MKj'), r('bSeV'), r('Iivm')),
        s = r('K+KL'),
        l = r('/KDZ'),
        i = r('N5tr'),
        c = r('i/MG'),
        u = r('8d0Q'),
        d = r('8+VR'),
        m = r('lpmA')
      function f(e) {
        const { name: t, onRemove: r, onClick: n } = e,
          [o, s] = Object(u.c)(),
          l = a.useCallback(() => n(t), [n, t]),
          f = a.useCallback(() => {
            r && r(t)
          }, [r, t])
        return a.createElement(
          'div',
          { ...s },
          a.createElement(i.b, {
            className: m.defaultsButtonItem,
            isActive: !1,
            label: t,
            onClick: l,
            toolbox: r && a.createElement(c.a, { hidden: !d.mobiletouch && !o, onClick: f }),
          }),
        )
      }
      var p = r('HWhk')
      function h(e) {
        const { model: t, source: r } = e
        return n.a.createElement(l.a, { rule: 'screen and (max-width: 768px)' }, e =>
          n.a.createElement(
            s.a,
            {
              className: !e && m.themesButtonText,
              hideArrowButton: e,
              buttonChildren: e
                ? n.a.createElement(o.a, { className: m.themesButtonIcon, icon: p })
                : window.t('Template'),
            },
            n.a.createElement(f, { onClick: a, name: window.t('Apply Defaults') }),
          ),
        )
        function a() {
          t.restorePropertiesForSource(r)
        }
      }
      function b(e) {
        return n.a.createElement(h, { ...e })
      }
      r.d(t, 'a', function () {
        return b
      })
    },
    vHME: function (e, t, r) {
      'use strict'
      r.d(t, 'a', function () {
        return m
      })
      var a = r('q1tI'),
        n = r('TSYQ'),
        o = r.n(n),
        s = (r('YFKU'), r('Iivm')),
        l = r('K+KL'),
        i = r('N5tr'),
        c = r('HWhk'),
        u = r('wt3x')
      const d = {
        reset: window.t('Reset Settings'),
        saveAsDefault: window.t('Save As Default'),
        defaults: window.t('Defaults'),
      }
      class m extends a.PureComponent {
        constructor() {
          super(...arguments),
            (this._handleResetToDefaults = () => {
              this.props.model.restorePropertiesForSource(this.props.source)
            }),
            (this._handleSaveAsDefaults = () => {
              this.props.source.properties().saveDefaults()
            })
        }
        render() {
          const { mode: e } = this.props
          return a.createElement(
            l.a,
            {
              id: 'study-defaults-manager',
              className: o()('normal' === e && u.defaultsButtonText),
              hideArrowButton: 'compact' === e,
              buttonChildren: this._getPlaceHolderItem('compact' === e),
            },
            a.createElement(i.b, {
              className: u.defaultsButtonItem,
              isActive: !1,
              label: d.reset,
              onClick: this._handleResetToDefaults,
            }),
            a.createElement(i.b, {
              className: u.defaultsButtonItem,
              isActive: !1,
              label: d.saveAsDefault,
              onClick: this._handleSaveAsDefaults,
            }),
          )
        }
        _getPlaceHolderItem(e) {
          return e ? a.createElement(s.a, { className: u.defaultsButtonIcon, icon: c }) : d.defaults
        }
      }
    },
    wt3x: function (e, t, r) {
      e.exports = {
        defaultsButtonText: 'defaultsButtonText-3mn75BN0',
        defaultsButtonItem: 'defaultsButtonItem-3mn75BN0',
        defaultsButtonIcon: 'defaultsButtonIcon-3mn75BN0',
      }
    },
  },
])
