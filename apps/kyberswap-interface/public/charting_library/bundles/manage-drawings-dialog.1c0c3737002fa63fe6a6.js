;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['manage-drawings-dialog'],
  {
    CAsX: function (e, t, i) {
      'use strict'
      i.r(t)
      var s = i('q1tI'),
        a = i('i8i4'),
        n = i('YFKU'),
        o = i('eqEH'),
        r = i('vPbs'),
        l = i('g89m'),
        d = i('b4AZ'),
        h = i('RIfm')
      class c extends s.PureComponent {
        constructor(e) {
          super(e),
            (this._dialogRef = s.createRef()),
            (this._renderChildren = e =>
              s.createElement(
                'div',
                { className: h.wrap },
                s.createElement(d.a, { onInitialized: e.centerAndFit, chartWidget: this._activeChartWidget }),
              ))
          const t = Object(o.service)(r.CHART_WIDGET_COLLECTION_SERVICE)
          ;(this._activeChartWidget = t.activeChartWidget.value()),
            (this.state = { layoutName: t.metaInfo.name.value() })
        }
        render() {
          return s.createElement(l.a, {
            className: h.dialog,
            dataName: 'manage-drawings-dialog',
            isOpened: !0,
            onClickOutside: this.props.onClose,
            onClose: this.props.onClose,
            ref: this._dialogRef,
            render: this._renderChildren,
            showSeparator: !0,
            title: Object(n.t)('Manage layout drawings'),
            subtitle: this.state.layoutName,
          })
        }
      }
      i.d(t, 'ManageDrawingsDialogRenderer', function () {
        return C
      })
      class C {
        constructor(e) {
          ;(this._container = document.createElement('div')),
            (this._isVisible = !1),
            (this._handleClose = () => {
              this._onClose && this._onClose(), a.unmountComponentAtNode(this._container), (this._isVisible = !1)
            }),
            (this._onClose = e)
        }
        hide() {
          this._handleClose()
        }
        isVisible() {
          return this._isVisible
        }
        show() {
          a.render(s.createElement(c, { onClose: this._handleClose }), this._container), (this._isVisible = !0)
        }
      }
    },
    RIfm: function (e, t, i) {
      e.exports = { dialog: 'dialog-Gd2kEiLq', wrap: 'wrap-Gd2kEiLq' }
    },
  },
])
