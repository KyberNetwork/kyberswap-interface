;(window.webpackJsonp = window.webpackJsonp || []).push([
  ['show-theme-save-dialog'],
  {
    KeOl: function (e, t, n) {
      'use strict'
      n.r(t),
        n.d(t, 'showThemeSaveDialog', function () {
          return m
        })
      var o = n('YFKU'),
        a = n('fZEr'),
        s = n('EsvI'),
        i = n('JWMC')
      function m(e, t) {
        function n(n) {
          Object(s.saveTheme)(n, e).then(() => {
            t && t(n)
          }),
            Object(i.trackEvent)('GUI', 'Themes', 'Save custom theme')
        }
        Object(a.showRename)({
          title: Object(o.t)('Save Theme As'),
          text: Object(o.t)('Theme name') + ':',
          maxLength: 128,
          onRename: ({ newValue: e, focusInput: t, dialogClose: i, innerManager: m }) =>
            new Promise(c => {
              Object(s.isThemeExist)(e).then(s => {
                if (s) {
                  const s = Object(o.t)(
                    "Color Theme '__themeName__' already exists. Do you really want to replace it?",
                    { themeName: e },
                  )
                  Object(a.showConfirm)(
                    {
                      text: s,
                      onConfirm: ({ dialogClose: t }) => {
                        n(e), t(), i()
                      },
                      onClose: t,
                    },
                    m,
                  ).then(() => {
                    c()
                  })
                } else n(e), c(), i()
              })
            }),
        })
      }
    },
  },
])
