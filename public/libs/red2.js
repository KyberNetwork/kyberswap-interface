!(function () {
  var t,
    e,
    n,
    r,
    i = {
      8878: function (t, e, n) {
        'use strict'
        var r =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule ? t : { default: t }
          }
        Object.defineProperty(e, '__esModule', { value: !0 })
        var i = r(n(325))
        function o(t, e) {
          return function () {
            var n = this.traits(),
              r = this.properties ? this.properties() : {}
            return (
              i.default(n, 'address.' + t) ||
              i.default(n, t) ||
              (e ? i.default(n, 'address.' + e) : null) ||
              (e ? i.default(n, e) : null) ||
              i.default(r, 'address.' + t) ||
              i.default(r, t) ||
              (e ? i.default(r, 'address.' + e) : null) ||
              (e ? i.default(r, e) : null)
            )
          }
        }
        e.default = function (t) {
          ;(t.zip = o('postalCode', 'zip')),
            (t.country = o('country')),
            (t.street = o('street')),
            (t.state = o('state')),
            (t.city = o('city')),
            (t.region = o('region'))
        }
      },
      4780: function (t, e, n) {
        'use strict'
        var r =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule ? t : { default: t }
          }
        Object.defineProperty(e, '__esModule', { value: !0 }), (e.Alias = void 0)
        var i = r(n(1285)),
          o = n(9512)
        function u(t, e) {
          o.Facade.call(this, t, e)
        }
        ;(e.Alias = u),
          i.default(u, o.Facade),
          (u.prototype.action = function () {
            return 'alias'
          }),
          (u.prototype.type = u.prototype.action),
          (u.prototype.previousId = function () {
            return this.field('previousId') || this.field('from')
          }),
          (u.prototype.from = u.prototype.previousId),
          (u.prototype.userId = function () {
            return this.field('userId') || this.field('to')
          }),
          (u.prototype.to = u.prototype.userId)
      },
      4814: function (t, e) {
        'use strict'
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.clone = void 0),
          (e.clone = function t(e) {
            if ('[object Object]' === Object.prototype.toString.call(e)) {
              var n = {}
              for (var r in e) n[r] = t(e[r])
              return n
            }
            return Array.isArray(e) ? e.map(t) : e
          })
      },
      5257: function (t, e, n) {
        'use strict'
        var r =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule ? t : { default: t }
          }
        Object.defineProperty(e, '__esModule', { value: !0 }), (e.Delete = void 0)
        var i = r(n(1285)),
          o = n(9512)
        function u(t, e) {
          o.Facade.call(this, t, e)
        }
        ;(e.Delete = u),
          i.default(u, o.Facade),
          (u.prototype.type = function () {
            return 'delete'
          })
      },
      9512: function (t, e, n) {
        'use strict'
        var r =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule ? t : { default: t }
          }
        Object.defineProperty(e, '__esModule', { value: !0 }), (e.Facade = void 0)
        var i = r(n(8878)),
          o = n(4814),
          u = r(n(2272)),
          s = r(n(5870)),
          a = r(n(325)),
          c = r(n(6279))
        function l(t, e) {
          ;(e = e || {}),
            (this.raw = o.clone(t)),
            'clone' in e || (e.clone = !0),
            e.clone && (t = o.clone(t)),
            'traverse' in e || (e.traverse = !0),
            (t.timestamp = 'timestamp' in t ? s.default(t.timestamp) : new Date()),
            e.traverse && c.default(t),
            (this.opts = e),
            (this.obj = t)
        }
        e.Facade = l
        var f = l.prototype
        function p(t) {
          return o.clone(t)
        }
        ;(f.proxy = function (t) {
          var e = t.split('.'),
            n = this[(t = e.shift())] || this.field(t)
          return n
            ? ('function' == typeof n && (n = n.call(this) || {}),
              0 === e.length || (n = a.default(n, e.join('.'))),
              this.opts.clone ? p(n) : n)
            : n
        }),
          (f.field = function (t) {
            var e = this.obj[t]
            return this.opts.clone ? p(e) : e
          }),
          (l.proxy = function (t) {
            return function () {
              return this.proxy(t)
            }
          }),
          (l.field = function (t) {
            return function () {
              return this.field(t)
            }
          }),
          (l.multi = function (t) {
            return function () {
              var e = this.proxy(t + 's')
              if (Array.isArray(e)) return e
              var n = this.proxy(t)
              return n && (n = [this.opts.clone ? o.clone(n) : n]), n || []
            }
          }),
          (l.one = function (t) {
            return function () {
              var e = this.proxy(t)
              if (e) return e
              var n = this.proxy(t + 's')
              return Array.isArray(n) ? n[0] : void 0
            }
          }),
          (f.json = function () {
            var t = this.opts.clone ? o.clone(this.obj) : this.obj
            return this.type && (t.type = this.type()), t
          }),
          (f.rawEvent = function () {
            return this.raw
          }),
          (f.options = function (t) {
            var e = this.obj.options || this.obj.context || {},
              n = this.opts.clone ? o.clone(e) : e
            if (!t) return n
            if (this.enabled(t)) {
              var r = this.integrations(),
                i = r[t] || a.default(r, t)
              return 'object' != typeof i && (i = a.default(this.options(), t)), 'object' == typeof i ? i : {}
            }
          }),
          (f.context = f.options),
          (f.enabled = function (t) {
            var e = this.proxy('options.providers.all')
            'boolean' != typeof e && (e = this.proxy('options.all')),
              'boolean' != typeof e && (e = this.proxy('integrations.all')),
              'boolean' != typeof e && (e = !0)
            var n = e && u.default(t),
              r = this.integrations()
            if ((r.providers && r.providers.hasOwnProperty(t) && (n = r.providers[t]), r.hasOwnProperty(t))) {
              var i = r[t]
              n = 'boolean' != typeof i || i
            }
            return !!n
          }),
          (f.integrations = function () {
            return this.obj.integrations || this.proxy('options.providers') || this.options()
          }),
          (f.active = function () {
            var t = this.proxy('options.active')
            return null == t && (t = !0), t
          }),
          (f.anonymousId = function () {
            return this.field('anonymousId') || this.field('sessionId')
          }),
          (f.sessionId = f.anonymousId),
          (f.groupId = l.proxy('options.groupId')),
          (f.traits = function (t) {
            var e = this.proxy('options.traits') || {},
              n = this.userId()
            for (var r in ((t = t || {}), n && (e.id = n), t)) {
              var i = null == this[r] ? this.proxy('options.traits.' + r) : this[r]()
              null != i && ((e[t[r]] = i), delete e[r])
            }
            return e
          }),
          (f.library = function () {
            var t = this.proxy('options.library')
            return t ? ('string' == typeof t ? { name: t, version: null } : t) : { name: 'unknown', version: null }
          }),
          (f.device = function () {
            var t = this.proxy('context.device')
            ;('object' == typeof t && null !== t) || (t = {})
            var e = this.library().name
            return (
              t.type || (e.indexOf('ios') > -1 && (t.type = 'ios'), e.indexOf('android') > -1 && (t.type = 'android')),
              t
            )
          }),
          (f.userAgent = l.proxy('context.userAgent')),
          (f.timezone = l.proxy('context.timezone')),
          (f.timestamp = l.field('timestamp')),
          (f.channel = l.field('channel')),
          (f.ip = l.proxy('context.ip')),
          (f.userId = l.field('userId')),
          i.default(f)
      },
      615: function (t, e, n) {
        'use strict'
        var r =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule ? t : { default: t }
          }
        Object.defineProperty(e, '__esModule', { value: !0 }), (e.Group = void 0)
        var i = r(n(1285)),
          o = r(n(4554)),
          u = r(n(5870)),
          s = n(9512)
        function a(t, e) {
          s.Facade.call(this, t, e)
        }
        ;(e.Group = a), i.default(a, s.Facade)
        var c = a.prototype
        ;(c.action = function () {
          return 'group'
        }),
          (c.type = c.action),
          (c.groupId = s.Facade.field('groupId')),
          (c.created = function () {
            var t =
              this.proxy('traits.createdAt') ||
              this.proxy('traits.created') ||
              this.proxy('properties.createdAt') ||
              this.proxy('properties.created')
            if (t) return u.default(t)
          }),
          (c.email = function () {
            var t = this.proxy('traits.email')
            if (t) return t
            var e = this.groupId()
            return o.default(e) ? e : void 0
          }),
          (c.traits = function (t) {
            var e = this.properties(),
              n = this.groupId()
            for (var r in ((t = t || {}), n && (e.id = n), t)) {
              var i = null == this[r] ? this.proxy('traits.' + r) : this[r]()
              null != i && ((e[t[r]] = i), delete e[r])
            }
            return e
          }),
          (c.name = s.Facade.proxy('traits.name')),
          (c.industry = s.Facade.proxy('traits.industry')),
          (c.employees = s.Facade.proxy('traits.employees')),
          (c.properties = function () {
            return this.field('traits') || this.field('properties') || {}
          })
      },
      4705: function (t, e, n) {
        'use strict'
        var r =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule ? t : { default: t }
          }
        Object.defineProperty(e, '__esModule', { value: !0 }), (e.Identify = void 0)
        var i = n(9512),
          o = r(n(325)),
          u = r(n(1285)),
          s = r(n(4554)),
          a = r(n(5870)),
          c = function (t) {
            return t.trim()
          }
        function l(t, e) {
          i.Facade.call(this, t, e)
        }
        ;(e.Identify = l), u.default(l, i.Facade)
        var f = l.prototype
        ;(f.action = function () {
          return 'identify'
        }),
          (f.type = f.action),
          (f.traits = function (t) {
            var e = this.field('traits') || {},
              n = this.userId()
            for (var r in ((t = t || {}), n && (e.id = n), t)) {
              var i = null == this[r] ? this.proxy('traits.' + r) : this[r]()
              null != i && ((e[t[r]] = i), r !== t[r] && delete e[r])
            }
            return e
          }),
          (f.email = function () {
            var t = this.proxy('traits.email')
            if (t) return t
            var e = this.userId()
            return s.default(e) ? e : void 0
          }),
          (f.created = function () {
            var t = this.proxy('traits.created') || this.proxy('traits.createdAt')
            if (t) return a.default(t)
          }),
          (f.companyCreated = function () {
            var t = this.proxy('traits.company.created') || this.proxy('traits.company.createdAt')
            if (t) return a.default(t)
          }),
          (f.companyName = function () {
            return this.proxy('traits.company.name')
          }),
          (f.name = function () {
            var t = this.proxy('traits.name')
            if ('string' == typeof t) return c(t)
            var e = this.firstName(),
              n = this.lastName()
            return e && n ? c(e + ' ' + n) : void 0
          }),
          (f.firstName = function () {
            var t = this.proxy('traits.firstName')
            if ('string' == typeof t) return c(t)
            var e = this.proxy('traits.name')
            return 'string' == typeof e ? c(e).split(' ')[0] : void 0
          }),
          (f.lastName = function () {
            var t = this.proxy('traits.lastName')
            if ('string' == typeof t) return c(t)
            var e = this.proxy('traits.name')
            if ('string' == typeof e) {
              var n = c(e).indexOf(' ')
              if (-1 !== n) return c(e.substr(n + 1))
            }
          }),
          (f.uid = function () {
            return this.userId() || this.username() || this.email()
          }),
          (f.description = function () {
            return this.proxy('traits.description') || this.proxy('traits.background')
          }),
          (f.age = function () {
            var t = this.birthday(),
              e = o.default(this.traits(), 'age')
            return null != e ? e : t instanceof Date ? new Date().getFullYear() - t.getFullYear() : void 0
          }),
          (f.avatar = function () {
            var t = this.traits()
            return o.default(t, 'avatar') || o.default(t, 'photoUrl') || o.default(t, 'avatarUrl')
          }),
          (f.position = function () {
            var t = this.traits()
            return o.default(t, 'position') || o.default(t, 'jobTitle')
          }),
          (f.username = i.Facade.proxy('traits.username')),
          (f.website = i.Facade.one('traits.website')),
          (f.websites = i.Facade.multi('traits.website')),
          (f.phone = i.Facade.one('traits.phone')),
          (f.phones = i.Facade.multi('traits.phone')),
          (f.address = i.Facade.proxy('traits.address')),
          (f.gender = i.Facade.proxy('traits.gender')),
          (f.birthday = i.Facade.proxy('traits.birthday'))
      },
      4122: function (t, e, n) {
        'use strict'
        var r =
          (this && this.__assign) ||
          function () {
            return (
              (r =
                Object.assign ||
                function (t) {
                  for (var e, n = 1, r = arguments.length; n < r; n++)
                    for (var i in (e = arguments[n])) Object.prototype.hasOwnProperty.call(e, i) && (t[i] = e[i])
                  return t
                }),
              r.apply(this, arguments)
            )
          }
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.Delete = e.Screen = e.Page = e.Track = e.Identify = e.Group = e.Alias = e.Facade = void 0)
        var i = n(9512)
        Object.defineProperty(e, 'Facade', {
          enumerable: !0,
          get: function () {
            return i.Facade
          },
        })
        var o = n(4780)
        Object.defineProperty(e, 'Alias', {
          enumerable: !0,
          get: function () {
            return o.Alias
          },
        })
        var u = n(615)
        Object.defineProperty(e, 'Group', {
          enumerable: !0,
          get: function () {
            return u.Group
          },
        })
        var s = n(4705)
        Object.defineProperty(e, 'Identify', {
          enumerable: !0,
          get: function () {
            return s.Identify
          },
        })
        var a = n(5480)
        Object.defineProperty(e, 'Track', {
          enumerable: !0,
          get: function () {
            return a.Track
          },
        })
        var c = n(5926)
        Object.defineProperty(e, 'Page', {
          enumerable: !0,
          get: function () {
            return c.Page
          },
        })
        var l = n(1207)
        Object.defineProperty(e, 'Screen', {
          enumerable: !0,
          get: function () {
            return l.Screen
          },
        })
        var f = n(5257)
        Object.defineProperty(e, 'Delete', {
          enumerable: !0,
          get: function () {
            return f.Delete
          },
        }),
          (e.default = r(r({}, i.Facade), {
            Alias: o.Alias,
            Group: u.Group,
            Identify: s.Identify,
            Track: a.Track,
            Page: c.Page,
            Screen: l.Screen,
            Delete: f.Delete,
          }))
      },
      4554: function (t, e) {
        'use strict'
        Object.defineProperty(e, '__esModule', { value: !0 })
        var n = /.+\@.+\..+/
        e.default = function (t) {
          return n.test(t)
        }
      },
      2272: function (t, e) {
        'use strict'
        Object.defineProperty(e, '__esModule', { value: !0 })
        var n = { Salesforce: !0 }
        e.default = function (t) {
          return !n[t]
        }
      },
      5926: function (t, e, n) {
        'use strict'
        var r =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule ? t : { default: t }
          }
        Object.defineProperty(e, '__esModule', { value: !0 }), (e.Page = void 0)
        var i = r(n(1285)),
          o = n(9512),
          u = n(5480),
          s = r(n(4554))
        function a(t, e) {
          o.Facade.call(this, t, e)
        }
        ;(e.Page = a), i.default(a, o.Facade)
        var c = a.prototype
        ;(c.action = function () {
          return 'page'
        }),
          (c.type = c.action),
          (c.category = o.Facade.field('category')),
          (c.name = o.Facade.field('name')),
          (c.title = o.Facade.proxy('properties.title')),
          (c.path = o.Facade.proxy('properties.path')),
          (c.url = o.Facade.proxy('properties.url')),
          (c.referrer = function () {
            return (
              this.proxy('context.referrer.url') ||
              this.proxy('context.page.referrer') ||
              this.proxy('properties.referrer')
            )
          }),
          (c.properties = function (t) {
            var e = this.field('properties') || {},
              n = this.category(),
              r = this.name()
            for (var i in ((t = t || {}), n && (e.category = n), r && (e.name = r), t)) {
              var o = null == this[i] ? this.proxy('properties.' + i) : this[i]()
              null != o && ((e[t[i]] = o), i !== t[i] && delete e[i])
            }
            return e
          }),
          (c.email = function () {
            var t = this.proxy('context.traits.email') || this.proxy('properties.email')
            if (t) return t
            var e = this.userId()
            return s.default(e) ? e : void 0
          }),
          (c.fullName = function () {
            var t = this.category(),
              e = this.name()
            return e && t ? t + ' ' + e : e
          }),
          (c.event = function (t) {
            return t ? 'Viewed ' + t + ' Page' : 'Loaded a Page'
          }),
          (c.track = function (t) {
            var e = this.json()
            return (
              (e.event = this.event(t)),
              (e.timestamp = this.timestamp()),
              (e.properties = this.properties()),
              new u.Track(e, this.opts)
            )
          })
      },
      1207: function (t, e, n) {
        'use strict'
        var r =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule ? t : { default: t }
          }
        Object.defineProperty(e, '__esModule', { value: !0 }), (e.Screen = void 0)
        var i = r(n(1285)),
          o = n(5926),
          u = n(5480)
        function s(t, e) {
          o.Page.call(this, t, e)
        }
        ;(e.Screen = s),
          i.default(s, o.Page),
          (s.prototype.action = function () {
            return 'screen'
          }),
          (s.prototype.type = s.prototype.action),
          (s.prototype.event = function (t) {
            return t ? 'Viewed ' + t + ' Screen' : 'Loaded a Screen'
          }),
          (s.prototype.track = function (t) {
            var e = this.json()
            return (
              (e.event = this.event(t)),
              (e.timestamp = this.timestamp()),
              (e.properties = this.properties()),
              new u.Track(e, this.opts)
            )
          })
      },
      5480: function (t, e, n) {
        'use strict'
        var r =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule ? t : { default: t }
          }
        Object.defineProperty(e, '__esModule', { value: !0 }), (e.Track = void 0)
        var i = r(n(1285)),
          o = n(9512),
          u = n(4705),
          s = r(n(4554)),
          a = r(n(325))
        function c(t, e) {
          o.Facade.call(this, t, e)
        }
        ;(e.Track = c), i.default(c, o.Facade)
        var l = c.prototype
        ;(l.action = function () {
          return 'track'
        }),
          (l.type = l.action),
          (l.event = o.Facade.field('event')),
          (l.value = o.Facade.proxy('properties.value')),
          (l.category = o.Facade.proxy('properties.category')),
          (l.id = o.Facade.proxy('properties.id')),
          (l.productId = function () {
            return this.proxy('properties.product_id') || this.proxy('properties.productId')
          }),
          (l.promotionId = function () {
            return this.proxy('properties.promotion_id') || this.proxy('properties.promotionId')
          }),
          (l.cartId = function () {
            return this.proxy('properties.cart_id') || this.proxy('properties.cartId')
          }),
          (l.checkoutId = function () {
            return this.proxy('properties.checkout_id') || this.proxy('properties.checkoutId')
          }),
          (l.paymentId = function () {
            return this.proxy('properties.payment_id') || this.proxy('properties.paymentId')
          }),
          (l.couponId = function () {
            return this.proxy('properties.coupon_id') || this.proxy('properties.couponId')
          }),
          (l.wishlistId = function () {
            return this.proxy('properties.wishlist_id') || this.proxy('properties.wishlistId')
          }),
          (l.reviewId = function () {
            return this.proxy('properties.review_id') || this.proxy('properties.reviewId')
          }),
          (l.orderId = function () {
            return this.proxy('properties.id') || this.proxy('properties.order_id') || this.proxy('properties.orderId')
          }),
          (l.sku = o.Facade.proxy('properties.sku')),
          (l.tax = o.Facade.proxy('properties.tax')),
          (l.name = o.Facade.proxy('properties.name')),
          (l.price = o.Facade.proxy('properties.price')),
          (l.total = o.Facade.proxy('properties.total')),
          (l.repeat = o.Facade.proxy('properties.repeat')),
          (l.coupon = o.Facade.proxy('properties.coupon')),
          (l.shipping = o.Facade.proxy('properties.shipping')),
          (l.discount = o.Facade.proxy('properties.discount')),
          (l.shippingMethod = function () {
            return this.proxy('properties.shipping_method') || this.proxy('properties.shippingMethod')
          }),
          (l.paymentMethod = function () {
            return this.proxy('properties.payment_method') || this.proxy('properties.paymentMethod')
          }),
          (l.description = o.Facade.proxy('properties.description')),
          (l.plan = o.Facade.proxy('properties.plan')),
          (l.subtotal = function () {
            var t = a.default(this.properties(), 'subtotal'),
              e = this.total() || this.revenue()
            if (t) return t
            if (!e) return 0
            if (this.total()) {
              var n = this.tax()
              n && (e -= n), (n = this.shipping()) && (e -= n), (n = this.discount()) && (e += n)
            }
            return e
          }),
          (l.products = function () {
            var t = this.properties(),
              e = a.default(t, 'products')
            return Array.isArray(e)
              ? e.filter(function (t) {
                  return null !== t
                })
              : []
          }),
          (l.quantity = function () {
            return (this.obj.properties || {}).quantity || 1
          }),
          (l.currency = function () {
            return (this.obj.properties || {}).currency || 'USD'
          }),
          (l.referrer = function () {
            return (
              this.proxy('context.referrer.url') ||
              this.proxy('context.page.referrer') ||
              this.proxy('properties.referrer')
            )
          }),
          (l.query = o.Facade.proxy('options.query')),
          (l.properties = function (t) {
            var e = this.field('properties') || {}
            for (var n in (t = t || {})) {
              var r = null == this[n] ? this.proxy('properties.' + n) : this[n]()
              null != r && ((e[t[n]] = r), delete e[n])
            }
            return e
          }),
          (l.username = function () {
            return (
              this.proxy('traits.username') || this.proxy('properties.username') || this.userId() || this.sessionId()
            )
          }),
          (l.email = function () {
            var t = this.proxy('traits.email') || this.proxy('properties.email') || this.proxy('options.traits.email')
            if (t) return t
            var e = this.userId()
            return s.default(e) ? e : void 0
          }),
          (l.revenue = function () {
            var t = this.proxy('properties.revenue'),
              e = this.event()
            return (
              !t &&
                e &&
                e.match(/^[ _]?completed[ _]?order[ _]?|^[ _]?order[ _]?completed[ _]?$/i) &&
                (t = this.proxy('properties.total')),
              (function (t) {
                if (!t) return
                if ('number' == typeof t) return t
                if ('string' != typeof t) return
                if (((t = t.replace(/\$/g, '')), (t = parseFloat(t)), !isNaN(t))) return t
              })(t)
            )
          }),
          (l.cents = function () {
            var t = this.revenue()
            return 'number' != typeof t ? this.value() || 0 : 100 * t
          }),
          (l.identify = function () {
            var t = this.json()
            return (t.traits = this.traits()), new u.Identify(t, this.opts)
          })
      },
      6279: function (t, e, n) {
        'use strict'
        var r = n(8264)
        function i(t, e) {
          return (
            void 0 === e && (e = !0),
            t && 'object' == typeof t
              ? (function (t, e) {
                  return (
                    Object.keys(t).forEach(function (n) {
                      t[n] = i(t[n], e)
                    }),
                    t
                  )
                })(t, e)
              : Array.isArray(t)
              ? (function (t, e) {
                  return (
                    t.forEach(function (n, r) {
                      t[r] = i(n, e)
                    }),
                    t
                  )
                })(t, e)
              : r.is(t, e)
              ? r.parse(t)
              : t
          )
        }
        t.exports = i
      },
      8264: function (t, e) {
        'use strict'
        var n =
          /^(\d{4})(?:-?(\d{2})(?:-?(\d{2}))?)?(?:([ T])(\d{2}):?(\d{2})(?::?(\d{2})(?:[,\.](\d{1,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/
        ;(e.parse = function (t) {
          var e = [1, 5, 6, 7, 11, 12],
            r = n.exec(t),
            i = 0
          if (!r) return new Date(t)
          for (var o, u = 0; (o = e[u]); u++) r[o] = parseInt(r[o], 10) || 0
          ;(r[2] = parseInt(r[2], 10) || 1),
            (r[3] = parseInt(r[3], 10) || 1),
            r[2]--,
            (r[8] = r[8] ? (r[8] + '00').substring(0, 3) : 0),
            ' ' === r[4]
              ? (i = new Date().getTimezoneOffset())
              : 'Z' !== r[9] && r[10] && ((i = 60 * r[11] + r[12]), '+' === r[10] && (i = 0 - i))
          var s = Date.UTC(r[1], r[2], r[3], r[5], r[6] + i, r[7], r[8])
          return new Date(s)
        }),
          (e.is = function (t, e) {
            return 'string' == typeof t && (!e || !1 !== /^\d{4}-\d{2}-\d{2}/.test(t)) && n.test(t)
          })
      },
      1285: function (t) {
        'function' == typeof Object.create
          ? (t.exports = function (t, e) {
              e &&
                ((t.super_ = e),
                (t.prototype = Object.create(e.prototype, {
                  constructor: { value: t, enumerable: !1, writable: !0, configurable: !0 },
                })))
            })
          : (t.exports = function (t, e) {
              if (e) {
                t.super_ = e
                var n = function () {}
                ;(n.prototype = e.prototype), (t.prototype = new n()), (t.prototype.constructor = t)
              }
            })
      },
      5870: function (t, e, n) {
        'use strict'
        var r = n(8264),
          i = n(5228),
          o = n(6076),
          u = Object.prototype.toString
        t.exports = function (t) {
          return (
            (e = t),
            '[object Date]' === u.call(e)
              ? t
              : (function (t) {
                  return '[object Number]' === u.call(t)
                })(t)
              ? new Date((n = t) < 315576e5 ? 1e3 * n : n)
              : r.is(t)
              ? r.parse(t)
              : i.is(t)
              ? i.parse(t)
              : o.is(t)
              ? o.parse(t)
              : new Date(t)
          )
          var e, n
        }
      },
      5228: function (t, e) {
        'use strict'
        var n = /\d{13}/
        ;(e.is = function (t) {
          return n.test(t)
        }),
          (e.parse = function (t) {
            return (t = parseInt(t, 10)), new Date(t)
          })
      },
      6076: function (t, e) {
        'use strict'
        var n = /\d{10}/
        ;(e.is = function (t) {
          return n.test(t)
        }),
          (e.parse = function (t) {
            var e = 1e3 * parseInt(t, 10)
            return new Date(e)
          })
      },
      325: function (t) {
        function e(t) {
          return function (e, n, r, o) {
            var u,
              s =
                o &&
                (function (t) {
                  return 'function' == typeof t
                })(o.normalizer)
                  ? o.normalizer
                  : i
            n = s(n)
            for (var a = !1; !a; ) c()
            function c() {
              for (u in e) {
                var t = s(u)
                if (0 === n.indexOf(t)) {
                  var r = n.substr(t.length)
                  if ('.' === r.charAt(0) || 0 === r.length) {
                    n = r.substr(1)
                    var i = e[u]
                    return null == i ? void (a = !0) : n.length ? void (e = i) : void (a = !0)
                  }
                }
              }
              ;(u = void 0), (a = !0)
            }
            if (u) return null == e ? e : t(e, u, r)
          }
        }
        function n(t, e) {
          return t.hasOwnProperty(e) && delete t[e], t
        }
        function r(t, e, n) {
          return t.hasOwnProperty(e) && (t[e] = n), t
        }
        function i(t) {
          return t.replace(/[^a-zA-Z0-9\.]+/g, '').toLowerCase()
        }
        ;(t.exports = e(function (t, e) {
          if (t.hasOwnProperty(e)) return t[e]
        })),
          (t.exports.find = t.exports),
          (t.exports.replace = function (t, n, i, o) {
            return e(r).call(this, t, n, i, o), t
          }),
          (t.exports.del = function (t, r, i) {
            return e(n).call(this, t, r, null, i), t
          })
      },
      4791: function (t) {
        t.exports = (function (t) {
          'use strict'
          var e = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']
          function n(t, e) {
            var n = t[0],
              r = t[1],
              i = t[2],
              o = t[3]
            ;(r =
              ((((r +=
                ((((i =
                  ((((i +=
                    ((((o =
                      ((((o +=
                        ((((n = ((((n += (((r & i) | (~r & o)) + e[0] - 680876936) | 0) << 7) | (n >>> 25)) + r) | 0) &
                          r) |
                          (~n & i)) +
                          e[1] -
                          389564586) |
                        0) <<
                        12) |
                        (o >>> 20)) +
                        n) |
                      0) &
                      n) |
                      (~o & r)) +
                      e[2] +
                      606105819) |
                    0) <<
                    17) |
                    (i >>> 15)) +
                    o) |
                  0) &
                  o) |
                  (~i & n)) +
                  e[3] -
                  1044525330) |
                0) <<
                22) |
                (r >>> 10)) +
                i) |
              0),
              (r =
                ((((r +=
                  ((((i =
                    ((((i +=
                      ((((o =
                        ((((o +=
                          ((((n =
                            ((((n += (((r & i) | (~r & o)) + e[4] - 176418897) | 0) << 7) | (n >>> 25)) + r) | 0) &
                            r) |
                            (~n & i)) +
                            e[5] +
                            1200080426) |
                          0) <<
                          12) |
                          (o >>> 20)) +
                          n) |
                        0) &
                        n) |
                        (~o & r)) +
                        e[6] -
                        1473231341) |
                      0) <<
                      17) |
                      (i >>> 15)) +
                      o) |
                    0) &
                    o) |
                    (~i & n)) +
                    e[7] -
                    45705983) |
                  0) <<
                  22) |
                  (r >>> 10)) +
                  i) |
                0),
              (r =
                ((((r +=
                  ((((i =
                    ((((i +=
                      ((((o =
                        ((((o +=
                          ((((n =
                            ((((n += (((r & i) | (~r & o)) + e[8] + 1770035416) | 0) << 7) | (n >>> 25)) + r) | 0) &
                            r) |
                            (~n & i)) +
                            e[9] -
                            1958414417) |
                          0) <<
                          12) |
                          (o >>> 20)) +
                          n) |
                        0) &
                        n) |
                        (~o & r)) +
                        e[10] -
                        42063) |
                      0) <<
                      17) |
                      (i >>> 15)) +
                      o) |
                    0) &
                    o) |
                    (~i & n)) +
                    e[11] -
                    1990404162) |
                  0) <<
                  22) |
                  (r >>> 10)) +
                  i) |
                0),
              (r =
                ((((r +=
                  ((((i =
                    ((((i +=
                      ((((o =
                        ((((o +=
                          ((((n =
                            ((((n += (((r & i) | (~r & o)) + e[12] + 1804603682) | 0) << 7) | (n >>> 25)) + r) | 0) &
                            r) |
                            (~n & i)) +
                            e[13] -
                            40341101) |
                          0) <<
                          12) |
                          (o >>> 20)) +
                          n) |
                        0) &
                        n) |
                        (~o & r)) +
                        e[14] -
                        1502002290) |
                      0) <<
                      17) |
                      (i >>> 15)) +
                      o) |
                    0) &
                    o) |
                    (~i & n)) +
                    e[15] +
                    1236535329) |
                  0) <<
                  22) |
                  (r >>> 10)) +
                  i) |
                0),
              (r =
                ((((r +=
                  ((((i =
                    ((((i +=
                      ((((o =
                        ((((o +=
                          ((((n =
                            ((((n += (((r & o) | (i & ~o)) + e[1] - 165796510) | 0) << 5) | (n >>> 27)) + r) | 0) &
                            i) |
                            (r & ~i)) +
                            e[6] -
                            1069501632) |
                          0) <<
                          9) |
                          (o >>> 23)) +
                          n) |
                        0) &
                        r) |
                        (n & ~r)) +
                        e[11] +
                        643717713) |
                      0) <<
                      14) |
                      (i >>> 18)) +
                      o) |
                    0) &
                    n) |
                    (o & ~n)) +
                    e[0] -
                    373897302) |
                  0) <<
                  20) |
                  (r >>> 12)) +
                  i) |
                0),
              (r =
                ((((r +=
                  ((((i =
                    ((((i +=
                      ((((o =
                        ((((o +=
                          ((((n =
                            ((((n += (((r & o) | (i & ~o)) + e[5] - 701558691) | 0) << 5) | (n >>> 27)) + r) | 0) &
                            i) |
                            (r & ~i)) +
                            e[10] +
                            38016083) |
                          0) <<
                          9) |
                          (o >>> 23)) +
                          n) |
                        0) &
                        r) |
                        (n & ~r)) +
                        e[15] -
                        660478335) |
                      0) <<
                      14) |
                      (i >>> 18)) +
                      o) |
                    0) &
                    n) |
                    (o & ~n)) +
                    e[4] -
                    405537848) |
                  0) <<
                  20) |
                  (r >>> 12)) +
                  i) |
                0),
              (r =
                ((((r +=
                  ((((i =
                    ((((i +=
                      ((((o =
                        ((((o +=
                          ((((n =
                            ((((n += (((r & o) | (i & ~o)) + e[9] + 568446438) | 0) << 5) | (n >>> 27)) + r) | 0) &
                            i) |
                            (r & ~i)) +
                            e[14] -
                            1019803690) |
                          0) <<
                          9) |
                          (o >>> 23)) +
                          n) |
                        0) &
                        r) |
                        (n & ~r)) +
                        e[3] -
                        187363961) |
                      0) <<
                      14) |
                      (i >>> 18)) +
                      o) |
                    0) &
                    n) |
                    (o & ~n)) +
                    e[8] +
                    1163531501) |
                  0) <<
                  20) |
                  (r >>> 12)) +
                  i) |
                0),
              (r =
                ((((r +=
                  ((((i =
                    ((((i +=
                      ((((o =
                        ((((o +=
                          ((((n =
                            ((((n += (((r & o) | (i & ~o)) + e[13] - 1444681467) | 0) << 5) | (n >>> 27)) + r) | 0) &
                            i) |
                            (r & ~i)) +
                            e[2] -
                            51403784) |
                          0) <<
                          9) |
                          (o >>> 23)) +
                          n) |
                        0) &
                        r) |
                        (n & ~r)) +
                        e[7] +
                        1735328473) |
                      0) <<
                      14) |
                      (i >>> 18)) +
                      o) |
                    0) &
                    n) |
                    (o & ~n)) +
                    e[12] -
                    1926607734) |
                  0) <<
                  20) |
                  (r >>> 12)) +
                  i) |
                0),
              (r =
                ((((r +=
                  (((i =
                    ((((i +=
                      (((o =
                        ((((o +=
                          (((n = ((((n += ((r ^ i ^ o) + e[5] - 378558) | 0) << 4) | (n >>> 28)) + r) | 0) ^ r ^ i) +
                            e[8] -
                            2022574463) |
                          0) <<
                          11) |
                          (o >>> 21)) +
                          n) |
                        0) ^
                        n ^
                        r) +
                        e[11] +
                        1839030562) |
                      0) <<
                      16) |
                      (i >>> 16)) +
                      o) |
                    0) ^
                    o ^
                    n) +
                    e[14] -
                    35309556) |
                  0) <<
                  23) |
                  (r >>> 9)) +
                  i) |
                0),
              (r =
                ((((r +=
                  (((i =
                    ((((i +=
                      (((o =
                        ((((o +=
                          (((n = ((((n += ((r ^ i ^ o) + e[1] - 1530992060) | 0) << 4) | (n >>> 28)) + r) | 0) ^
                            r ^
                            i) +
                            e[4] +
                            1272893353) |
                          0) <<
                          11) |
                          (o >>> 21)) +
                          n) |
                        0) ^
                        n ^
                        r) +
                        e[7] -
                        155497632) |
                      0) <<
                      16) |
                      (i >>> 16)) +
                      o) |
                    0) ^
                    o ^
                    n) +
                    e[10] -
                    1094730640) |
                  0) <<
                  23) |
                  (r >>> 9)) +
                  i) |
                0),
              (r =
                ((((r +=
                  (((i =
                    ((((i +=
                      (((o =
                        ((((o +=
                          (((n = ((((n += ((r ^ i ^ o) + e[13] + 681279174) | 0) << 4) | (n >>> 28)) + r) | 0) ^
                            r ^
                            i) +
                            e[0] -
                            358537222) |
                          0) <<
                          11) |
                          (o >>> 21)) +
                          n) |
                        0) ^
                        n ^
                        r) +
                        e[3] -
                        722521979) |
                      0) <<
                      16) |
                      (i >>> 16)) +
                      o) |
                    0) ^
                    o ^
                    n) +
                    e[6] +
                    76029189) |
                  0) <<
                  23) |
                  (r >>> 9)) +
                  i) |
                0),
              (r =
                ((((r +=
                  (((i =
                    ((((i +=
                      (((o =
                        ((((o +=
                          (((n = ((((n += ((r ^ i ^ o) + e[9] - 640364487) | 0) << 4) | (n >>> 28)) + r) | 0) ^ r ^ i) +
                            e[12] -
                            421815835) |
                          0) <<
                          11) |
                          (o >>> 21)) +
                          n) |
                        0) ^
                        n ^
                        r) +
                        e[15] +
                        530742520) |
                      0) <<
                      16) |
                      (i >>> 16)) +
                      o) |
                    0) ^
                    o ^
                    n) +
                    e[2] -
                    995338651) |
                  0) <<
                  23) |
                  (r >>> 9)) +
                  i) |
                0),
              (r =
                ((((r +=
                  (((o =
                    ((((o +=
                      ((r ^
                        ((n = ((((n += ((i ^ (r | ~o)) + e[0] - 198630844) | 0) << 6) | (n >>> 26)) + r) | 0) | ~i)) +
                        e[7] +
                        1126891415) |
                      0) <<
                      10) |
                      (o >>> 22)) +
                      n) |
                    0) ^
                    ((i = ((((i += ((n ^ (o | ~r)) + e[14] - 1416354905) | 0) << 15) | (i >>> 17)) + o) | 0) | ~n)) +
                    e[5] -
                    57434055) |
                  0) <<
                  21) |
                  (r >>> 11)) +
                  i) |
                0),
              (r =
                ((((r +=
                  (((o =
                    ((((o +=
                      ((r ^
                        ((n = ((((n += ((i ^ (r | ~o)) + e[12] + 1700485571) | 0) << 6) | (n >>> 26)) + r) | 0) | ~i)) +
                        e[3] -
                        1894986606) |
                      0) <<
                      10) |
                      (o >>> 22)) +
                      n) |
                    0) ^
                    ((i = ((((i += ((n ^ (o | ~r)) + e[10] - 1051523) | 0) << 15) | (i >>> 17)) + o) | 0) | ~n)) +
                    e[1] -
                    2054922799) |
                  0) <<
                  21) |
                  (r >>> 11)) +
                  i) |
                0),
              (r =
                ((((r +=
                  (((o =
                    ((((o +=
                      ((r ^
                        ((n = ((((n += ((i ^ (r | ~o)) + e[8] + 1873313359) | 0) << 6) | (n >>> 26)) + r) | 0) | ~i)) +
                        e[15] -
                        30611744) |
                      0) <<
                      10) |
                      (o >>> 22)) +
                      n) |
                    0) ^
                    ((i = ((((i += ((n ^ (o | ~r)) + e[6] - 1560198380) | 0) << 15) | (i >>> 17)) + o) | 0) | ~n)) +
                    e[13] +
                    1309151649) |
                  0) <<
                  21) |
                  (r >>> 11)) +
                  i) |
                0),
              (r =
                ((((r +=
                  (((o =
                    ((((o +=
                      ((r ^
                        ((n = ((((n += ((i ^ (r | ~o)) + e[4] - 145523070) | 0) << 6) | (n >>> 26)) + r) | 0) | ~i)) +
                        e[11] -
                        1120210379) |
                      0) <<
                      10) |
                      (o >>> 22)) +
                      n) |
                    0) ^
                    ((i = ((((i += ((n ^ (o | ~r)) + e[2] + 718787259) | 0) << 15) | (i >>> 17)) + o) | 0) | ~n)) +
                    e[9] -
                    343485551) |
                  0) <<
                  21) |
                  (r >>> 11)) +
                  i) |
                0),
              (t[0] = (n + t[0]) | 0),
              (t[1] = (r + t[1]) | 0),
              (t[2] = (i + t[2]) | 0),
              (t[3] = (o + t[3]) | 0)
          }
          function r(t) {
            var e,
              n = []
            for (e = 0; e < 64; e += 4)
              n[e >> 2] =
                t.charCodeAt(e) + (t.charCodeAt(e + 1) << 8) + (t.charCodeAt(e + 2) << 16) + (t.charCodeAt(e + 3) << 24)
            return n
          }
          function i(t) {
            var e,
              n = []
            for (e = 0; e < 64; e += 4) n[e >> 2] = t[e] + (t[e + 1] << 8) + (t[e + 2] << 16) + (t[e + 3] << 24)
            return n
          }
          function o(t) {
            var e,
              i,
              o,
              u,
              s,
              a,
              c = t.length,
              l = [1732584193, -271733879, -1732584194, 271733878]
            for (e = 64; e <= c; e += 64) n(l, r(t.substring(e - 64, e)))
            for (
              i = (t = t.substring(e - 64)).length, o = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], e = 0;
              e < i;
              e += 1
            )
              o[e >> 2] |= t.charCodeAt(e) << (e % 4 << 3)
            if (((o[e >> 2] |= 128 << (e % 4 << 3)), e > 55)) for (n(l, o), e = 0; e < 16; e += 1) o[e] = 0
            return (
              (u = (u = 8 * c).toString(16).match(/(.*?)(.{0,8})$/)),
              (s = parseInt(u[2], 16)),
              (a = parseInt(u[1], 16) || 0),
              (o[14] = s),
              (o[15] = a),
              n(l, o),
              l
            )
          }
          function u(t) {
            var e,
              r,
              o,
              u,
              s,
              a,
              c = t.length,
              l = [1732584193, -271733879, -1732584194, 271733878]
            for (e = 64; e <= c; e += 64) n(l, i(t.subarray(e - 64, e)))
            for (
              r = (t = e - 64 < c ? t.subarray(e - 64) : new Uint8Array(0)).length,
                o = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                e = 0;
              e < r;
              e += 1
            )
              o[e >> 2] |= t[e] << (e % 4 << 3)
            if (((o[e >> 2] |= 128 << (e % 4 << 3)), e > 55)) for (n(l, o), e = 0; e < 16; e += 1) o[e] = 0
            return (
              (u = (u = 8 * c).toString(16).match(/(.*?)(.{0,8})$/)),
              (s = parseInt(u[2], 16)),
              (a = parseInt(u[1], 16) || 0),
              (o[14] = s),
              (o[15] = a),
              n(l, o),
              l
            )
          }
          function s(t) {
            var n,
              r = ''
            for (n = 0; n < 4; n += 1) r += e[(t >> (8 * n + 4)) & 15] + e[(t >> (8 * n)) & 15]
            return r
          }
          function a(t) {
            var e
            for (e = 0; e < t.length; e += 1) t[e] = s(t[e])
            return t.join('')
          }
          function c(t) {
            return /[\u0080-\uFFFF]/.test(t) && (t = unescape(encodeURIComponent(t))), t
          }
          function l(t, e) {
            var n,
              r = t.length,
              i = new ArrayBuffer(r),
              o = new Uint8Array(i)
            for (n = 0; n < r; n += 1) o[n] = t.charCodeAt(n)
            return e ? o : i
          }
          function f(t) {
            return String.fromCharCode.apply(null, new Uint8Array(t))
          }
          function p(t, e, n) {
            var r = new Uint8Array(t.byteLength + e.byteLength)
            return r.set(new Uint8Array(t)), r.set(new Uint8Array(e), t.byteLength), n ? r : r.buffer
          }
          function d(t) {
            var e,
              n = [],
              r = t.length
            for (e = 0; e < r - 1; e += 2) n.push(parseInt(t.substr(e, 2), 16))
            return String.fromCharCode.apply(String, n)
          }
          function h() {
            this.reset()
          }
          return (
            a(o('hello')),
            'undefined' == typeof ArrayBuffer ||
              ArrayBuffer.prototype.slice ||
              (function () {
                function e(t, e) {
                  return (t = 0 | t || 0) < 0 ? Math.max(t + e, 0) : Math.min(t, e)
                }
                ArrayBuffer.prototype.slice = function (n, r) {
                  var i,
                    o,
                    u,
                    s,
                    a = this.byteLength,
                    c = e(n, a),
                    l = a
                  return (
                    r !== t && (l = e(r, a)),
                    c > l
                      ? new ArrayBuffer(0)
                      : ((i = l - c),
                        (o = new ArrayBuffer(i)),
                        (u = new Uint8Array(o)),
                        (s = new Uint8Array(this, c, i)),
                        u.set(s),
                        o)
                  )
                }
              })(),
            (h.prototype.append = function (t) {
              return this.appendBinary(c(t)), this
            }),
            (h.prototype.appendBinary = function (t) {
              ;(this._buff += t), (this._length += t.length)
              var e,
                i = this._buff.length
              for (e = 64; e <= i; e += 64) n(this._hash, r(this._buff.substring(e - 64, e)))
              return (this._buff = this._buff.substring(e - 64)), this
            }),
            (h.prototype.end = function (t) {
              var e,
                n,
                r = this._buff,
                i = r.length,
                o = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
              for (e = 0; e < i; e += 1) o[e >> 2] |= r.charCodeAt(e) << (e % 4 << 3)
              return this._finish(o, i), (n = a(this._hash)), t && (n = d(n)), this.reset(), n
            }),
            (h.prototype.reset = function () {
              return (
                (this._buff = ''),
                (this._length = 0),
                (this._hash = [1732584193, -271733879, -1732584194, 271733878]),
                this
              )
            }),
            (h.prototype.getState = function () {
              return { buff: this._buff, length: this._length, hash: this._hash.slice() }
            }),
            (h.prototype.setState = function (t) {
              return (this._buff = t.buff), (this._length = t.length), (this._hash = t.hash), this
            }),
            (h.prototype.destroy = function () {
              delete this._hash, delete this._buff, delete this._length
            }),
            (h.prototype._finish = function (t, e) {
              var r,
                i,
                o,
                u = e
              if (((t[u >> 2] |= 128 << (u % 4 << 3)), u > 55)) for (n(this._hash, t), u = 0; u < 16; u += 1) t[u] = 0
              ;(r = (r = 8 * this._length).toString(16).match(/(.*?)(.{0,8})$/)),
                (i = parseInt(r[2], 16)),
                (o = parseInt(r[1], 16) || 0),
                (t[14] = i),
                (t[15] = o),
                n(this._hash, t)
            }),
            (h.hash = function (t, e) {
              return h.hashBinary(c(t), e)
            }),
            (h.hashBinary = function (t, e) {
              var n = a(o(t))
              return e ? d(n) : n
            }),
            (h.ArrayBuffer = function () {
              this.reset()
            }),
            (h.ArrayBuffer.prototype.append = function (t) {
              var e,
                r = p(this._buff.buffer, t, !0),
                o = r.length
              for (this._length += t.byteLength, e = 64; e <= o; e += 64) n(this._hash, i(r.subarray(e - 64, e)))
              return (this._buff = e - 64 < o ? new Uint8Array(r.buffer.slice(e - 64)) : new Uint8Array(0)), this
            }),
            (h.ArrayBuffer.prototype.end = function (t) {
              var e,
                n,
                r = this._buff,
                i = r.length,
                o = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
              for (e = 0; e < i; e += 1) o[e >> 2] |= r[e] << (e % 4 << 3)
              return this._finish(o, i), (n = a(this._hash)), t && (n = d(n)), this.reset(), n
            }),
            (h.ArrayBuffer.prototype.reset = function () {
              return (
                (this._buff = new Uint8Array(0)),
                (this._length = 0),
                (this._hash = [1732584193, -271733879, -1732584194, 271733878]),
                this
              )
            }),
            (h.ArrayBuffer.prototype.getState = function () {
              var t = h.prototype.getState.call(this)
              return (t.buff = f(t.buff)), t
            }),
            (h.ArrayBuffer.prototype.setState = function (t) {
              return (t.buff = l(t.buff, !0)), h.prototype.setState.call(this, t)
            }),
            (h.ArrayBuffer.prototype.destroy = h.prototype.destroy),
            (h.ArrayBuffer.prototype._finish = h.prototype._finish),
            (h.ArrayBuffer.hash = function (t, e) {
              var n = a(u(new Uint8Array(t)))
              return e ? d(n) : n
            }),
            h
          )
        })()
      },
      94: function (t, e, n) {
        'use strict'
        n.d(e, {
          G: function () {
            return i
          },
          s: function () {
            return o
          },
        })
        var r = n(204)
        function i() {
          return !(0, r.j)() || window.navigator.onLine
        }
        function o() {
          return !i()
        }
      },
      4328: function (t, e, n) {
        'use strict'
        n.d(e, {
          U: function () {
            return r
          },
        })
        var r = 'api.segment.io/v1'
      },
      8404: function (t, e, n) {
        'use strict'
        n.d(e, {
          _: function () {
            return u
          },
        })
        var r = n(5163),
          i = n(1494),
          o = n(6218),
          u = (function (t) {
            function e(e, n) {
              return t.call(this, e, n, new o.j()) || this
            }
            return (
              (0, r.ZT)(e, t),
              (e.system = function () {
                return new this({ type: 'track', event: 'system' })
              }),
              e
            )
          })(i._)
      },
      204: function (t, e, n) {
        'use strict'
        function r() {
          return 'undefined' != typeof window
        }
        function i() {
          return !r()
        }
        n.d(e, {
          j: function () {
            return r
          },
          s: function () {
            return i
          },
        })
      },
      6863: function (t, e, n) {
        'use strict'
        function r(t) {
          try {
            return decodeURIComponent(t.replace(/\+/g, ' '))
          } catch (e) {
            return t
          }
        }
        n.d(e, {
          a: function () {
            return r
          },
        })
      },
      6218: function (t, e, n) {
        'use strict'
        n.d(e, {
          j: function () {
            return s
          },
        })
        var r,
          i = n(5163),
          o = n(417),
          u = n(449),
          s = (function (t) {
            function e() {
              return (null !== t && t.apply(this, arguments)) || this
            }
            return (
              (0, i.ZT)(e, t),
              (e.initRemoteMetrics = function (t) {
                r = new u.B(t)
              }),
              (e.prototype.increment = function (e, n, i) {
                t.prototype.increment.call(this, e, n, i), null == r || r.increment(e, null != i ? i : [])
              }),
              e
            )
          })(o.s)
      },
      449: function (t, e, n) {
        'use strict'
        n.d(e, {
          B: function () {
            return c
          },
        })
        var r = n(5163),
          i = n(4759),
          o = n(4278),
          u = n(6175),
          s = n(4328)
        function a(t) {
          console.error('Error sending segment performance metrics', t)
        }
        var c = (function () {
          function t(t) {
            var e,
              n,
              r,
              i,
              o = this
            if (
              ((this.host = null !== (e = null == t ? void 0 : t.host) && void 0 !== e ? e : s.U),
              (this.sampleRate = null !== (n = null == t ? void 0 : t.sampleRate) && void 0 !== n ? n : 1),
              (this.flushTimer = null !== (r = null == t ? void 0 : t.flushTimer) && void 0 !== r ? r : 3e4),
              (this.maxQueueSize = null !== (i = null == t ? void 0 : t.maxQueueSize) && void 0 !== i ? i : 20),
              (this.queue = []),
              this.sampleRate > 0)
            ) {
              var u = !1,
                c = function () {
                  u || ((u = !0), o.flush().catch(a), (u = !1), setTimeout(c, o.flushTimer))
                }
              c()
            }
          }
          return (
            (t.prototype.increment = function (t, e) {
              if (
                t.includes('analytics_js.') &&
                0 !== e.length &&
                !(Math.random() > this.sampleRate || this.queue.length >= this.maxQueueSize)
              ) {
                var n = (function (t, e, n) {
                  var i = e.reduce(function (t, e) {
                    var n = e.split(':'),
                      r = n[0],
                      i = n[1]
                    return (t[r] = i), t
                  }, {})
                  return {
                    type: 'Counter',
                    metric: t,
                    value: 1,
                    tags: (0, r.pi)((0, r.pi)({}, i), {
                      library: 'analytics.js',
                      library_version: 'web' === n ? 'next-'.concat(o.i) : 'npm:next-'.concat(o.i),
                    }),
                  }
                })(t, e, (0, u.B)())
                this.queue.push(n), t.includes('error') && this.flush().catch(a)
              }
            }),
            (t.prototype.flush = function () {
              return (0, r.mG)(this, void 0, Promise, function () {
                var t = this
                return (0, r.Jh)(this, function (e) {
                  switch (e.label) {
                    case 0:
                      return this.queue.length <= 0
                        ? [2]
                        : [
                            4,
                            this.send().catch(function (e) {
                              a(e), (t.sampleRate = 0)
                            }),
                          ]
                    case 1:
                      return e.sent(), [2]
                  }
                })
              })
            }),
            (t.prototype.send = function () {
              return (0, r.mG)(this, void 0, Promise, function () {
                var t, e, n
                return (0, r.Jh)(this, function (r) {
                  return (
                    (t = { series: this.queue }),
                    (this.queue = []),
                    (e = { 'Content-Type': 'text/plain' }),
                    (n = 'https://'.concat(this.host, '/m')),
                    [2, (0, i.h)(n, { headers: e, body: JSON.stringify(t), method: 'POST' })]
                  )
                })
              })
            }),
            t
          )
        })()
      },
      4278: function (t, e, n) {
        'use strict'
        n.d(e, {
          i: function () {
            return r
          },
        })
        var r = '1.55.0'
      },
      584: function (t, e, n) {
        'use strict'
        n.d(e, {
          M: function () {
            return r
          },
        })
        try {
          window.analyticsWriteKey = 'pe0ARTOeWYLV8SG0Dz7Vcs5YkDS9vT9Y'
        } catch (t) {}
        function r() {
          if (void 0 !== window.analyticsWriteKey)
            return window.analyticsWriteKey !== ['__', 'WRITE', '_', 'KEY', '__'].join('')
              ? window.analyticsWriteKey
              : void 0
        }
      },
      4759: function (t, e, n) {
        'use strict'
        function r(t, e) {
          return (
            (e = e || {}),
            new Promise(function (n, r) {
              var i = new XMLHttpRequest(),
                o = [],
                u = [],
                s = {},
                a = function () {
                  return {
                    ok: 2 == ((i.status / 100) | 0),
                    statusText: i.statusText,
                    status: i.status,
                    url: i.responseURL,
                    text: function () {
                      return Promise.resolve(i.responseText)
                    },
                    json: function () {
                      return Promise.resolve(JSON.parse(i.responseText))
                    },
                    blob: function () {
                      return Promise.resolve(new Blob([i.response]))
                    },
                    clone: a,
                    headers: {
                      keys: function () {
                        return o
                      },
                      entries: function () {
                        return u
                      },
                      get: function (t) {
                        return s[t.toLowerCase()]
                      },
                      has: function (t) {
                        return t.toLowerCase() in s
                      },
                    },
                  }
                }
              for (var c in (i.open(e.method || 'get', t, !0),
              (i.onload = function () {
                i.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm, function (t, e, n) {
                  o.push((e = e.toLowerCase())), u.push([e, n]), (s[e] = s[e] ? s[e] + ',' + n : n)
                }),
                  n(a())
              }),
              (i.onerror = r),
              (i.withCredentials = 'include' == e.credentials),
              e.headers))
                i.setRequestHeader(c, e.headers[c])
              i.send(e.body || null)
            })
          )
        }
        n.d(e, {
          h: function () {
            return o
          },
        })
        var i = n(3744),
          o = function () {
            for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e]
            var n = (0, i.R)()
            return ((n && n.fetch) || r).apply(void 0, t)
          }
      },
      3744: function (t, e, n) {
        'use strict'
        n.d(e, {
          R: function () {
            return r
          },
        })
        var r = function () {
          return 'undefined' != typeof globalThis
            ? globalThis
            : 'undefined' != typeof self
            ? self
            : 'undefined' != typeof window
            ? window
            : 'undefined' != typeof global
            ? global
            : null
        }
      },
      7070: function (t, e, n) {
        'use strict'
        function r(t) {
          return Array.prototype.slice.call(window.document.querySelectorAll('script')).find(function (e) {
            return e.src === t
          })
        }
        function i(t, e) {
          var n = r(t)
          if (void 0 !== n) {
            var i = null == n ? void 0 : n.getAttribute('status')
            if ('loaded' === i) return Promise.resolve(n)
            if ('loading' === i)
              return new Promise(function (t, e) {
                n.addEventListener('load', function () {
                  return t(n)
                }),
                  n.addEventListener('error', function (t) {
                    return e(t)
                  })
              })
          }
          return new Promise(function (n, r) {
            var i,
              o = window.document.createElement('script')
            ;(o.type = 'text/javascript'), (o.src = t), (o.async = !0), o.setAttribute('status', 'loading')
            for (var u = 0, s = Object.entries(null != e ? e : {}); u < s.length; u++) {
              var a = s[u],
                c = a[0],
                l = a[1]
              o.setAttribute(c, l)
            }
            ;(o.onload = function () {
              ;(o.onerror = o.onload = null), o.setAttribute('status', 'loaded'), n(o)
            }),
              (o.onerror = function () {
                ;(o.onerror = o.onload = null),
                  o.setAttribute('status', 'error'),
                  r(new Error('Failed to load '.concat(t)))
              })
            var f = window.document.getElementsByTagName('script')[0]
            null === (i = f.parentElement) || void 0 === i || i.insertBefore(o, f)
          })
        }
        function o(t) {
          var e = r(t)
          return void 0 !== e && e.remove(), Promise.resolve()
        }
        n.d(e, {
          t: function () {
            return o
          },
          v: function () {
            return i
          },
        })
      },
      5944: function (t, e, n) {
        'use strict'
        n.d(e, {
          o: function () {
            return i
          },
        })
        var r = n(5163)
        function i(t, e) {
          var n,
            i = Object.entries(null !== (n = e.integrations) && void 0 !== n ? n : {}).reduce(function (t, e) {
              var n,
                i,
                o = e[0],
                u = e[1]
              return 'object' == typeof u
                ? (0, r.pi)((0, r.pi)({}, t), (((n = {})[o] = u), n))
                : (0, r.pi)((0, r.pi)({}, t), (((i = {})[o] = {}), i))
            }, {})
          return Object.entries(t.integrations).reduce(function (t, e) {
            var n,
              o = e[0],
              u = e[1]
            return (0, r.pi)((0, r.pi)({}, t), (((n = {})[o] = (0, r.pi)((0, r.pi)({}, u), i[o])), n))
          }, {})
        }
      },
      8044: function (t, e, n) {
        'use strict'
        n.d(e, {
          x: function () {
            return i
          },
        })
        var r = n(5163),
          i = function (t, e) {
            return (0, r.mG)(void 0, void 0, Promise, function () {
              var n
              return (0, r.Jh)(this, function (i) {
                return (
                  (n = function (i) {
                    return (0, r.mG)(void 0, void 0, Promise, function () {
                      var o
                      return (0, r.Jh)(this, function (r) {
                        switch (r.label) {
                          case 0:
                            return t(i) ? ((o = n), [4, e()]) : [3, 2]
                          case 1:
                            return [2, o.apply(void 0, [r.sent()])]
                          case 2:
                            return [2]
                        }
                      })
                    })
                  }),
                  [2, n(void 0)]
                )
              })
            })
          }
      },
      7566: function (t, e, n) {
        'use strict'
        n.d(e, {
          Kg: function () {
            return a
          },
          UH: function () {
            return u
          },
          Vl: function () {
            return s
          },
          YM: function () {
            return c
          },
        })
        var r,
          i = n(584),
          o = /(https:\/\/.*)\/analytics\.js\/v1\/(?:.*?)\/(?:platform|analytics.*)?/,
          u = function (t) {
            window.analytics && (window.analytics._cdn = t), (r = t)
          },
          s = function () {
            var t,
              e = null != r ? r : null === (t = window.analytics) || void 0 === t ? void 0 : t._cdn
            if (e) return e
            var n,
              i =
                (Array.prototype.slice.call(document.querySelectorAll('script')).forEach(function (t) {
                  var e,
                    r = null !== (e = t.getAttribute('src')) && void 0 !== e ? e : '',
                    i = o.exec(r)
                  i && i[1] && (n = i[1])
                }),
                n)
            return i || 'https://cdn.segment.com'
          },
          a = function () {
            var t = s()
            return ''.concat(t, '/next-integrations')
          }
        function c() {
          for (
            var t,
              e,
              n = null !== (t = (0, i.M)()) && void 0 !== t ? t : window.analytics._writeKey,
              r = void 0,
              u = 0,
              s = Array.prototype.slice.call(document.querySelectorAll('script'));
            u < s.length;
            u++
          ) {
            var a = null !== (e = s[u].getAttribute('src')) && void 0 !== e ? e : '',
              c = o.exec(a)
            if (c && c[1]) {
              r = a
              break
            }
          }
          return r
            ? r.replace('analytics.min.js', 'analytics.classic.js')
            : 'https://cdn.segment.com/analytics.js/v1/'.concat(n, '/analytics.classic.js')
        }
      },
      3061: function (t, e, n) {
        'use strict'
        n.d(e, {
          $: function () {
            return p
          },
        })
        var r = n(5163),
          i = n(3098),
          o = n(8404),
          u = n(204),
          s = { getItem: function () {}, setItem: function () {}, removeItem: function () {} }
        try {
          s = (0, u.j)() && window.localStorage ? window.localStorage : s
        } catch (t) {
          console.warn('Unable to access localStorage', t)
        }
        function a(t) {
          var e = s.getItem(t)
          return (e ? JSON.parse(e) : []).map(function (t) {
            return new o._(t.event, t.id)
          })
        }
        function c(t) {
          var e = s.getItem(t)
          return e ? JSON.parse(e) : {}
        }
        function l(t) {
          s.removeItem(t)
        }
        function f(t, e, n) {
          void 0 === n && (n = 0)
          var r = 'persisted-queue:v1:'.concat(t, ':lock'),
            i = s.getItem(r),
            o = i ? JSON.parse(i) : null,
            u =
              null === o ||
              (function (t) {
                return new Date().getTime() > t
              })(o)
          if (u) return s.setItem(r, JSON.stringify(new Date().getTime() + 50)), e(), void s.removeItem(r)
          !u && n < 3
            ? setTimeout(function () {
                f(t, e, n + 1)
              }, 50)
            : console.error('Unable to retrieve lock')
        }
        var p = (function (t) {
          function e(e, n) {
            var i = t.call(this, e, []) || this,
              o = 'persisted-queue:v1:'.concat(n, ':items'),
              u = 'persisted-queue:v1:'.concat(n, ':seen'),
              p = [],
              d = {}
            return (
              f(n, function () {
                try {
                  ;(p = a(o)),
                    (d = c(u)),
                    l(o),
                    l(u),
                    (i.queue = (0, r.ev)((0, r.ev)([], p, !0), i.queue, !0)),
                    (i.seen = (0, r.pi)((0, r.pi)({}, d), i.seen))
                } catch (t) {
                  console.error(t)
                }
              }),
              window.addEventListener('pagehide', function () {
                if (i.todo > 0) {
                  var t = (0, r.ev)((0, r.ev)([], i.queue, !0), i.future, !0)
                  try {
                    f(n, function () {
                      !(function (t, e) {
                        var n = a(t),
                          i = (0, r.ev)((0, r.ev)([], e, !0), n, !0).reduce(function (t, e) {
                            var n
                            return (0, r.pi)((0, r.pi)({}, t), (((n = {})[e.id] = e), n))
                          }, {})
                        s.setItem(t, JSON.stringify(Object.values(i)))
                      })(o, t),
                        (function (t, e) {
                          var n = c(t)
                          s.setItem(t, JSON.stringify((0, r.pi)((0, r.pi)({}, n), e)))
                        })(u, i.seen)
                    })
                  } catch (t) {
                    console.error(t)
                  }
                }
              }),
              i
            )
          }
          return (0, r.ZT)(e, t), e
        })(i.Z)
      },
      9950: function (t, e, n) {
        'use strict'
        n.d(e, {
          D: function () {
            return i
          },
        })
        var r = n(4122)
        function i(t, e) {
          var n = new r.Facade(t, e)
          return (
            'track' === t.type && (n = new r.Track(t, e)),
            'identify' === t.type && (n = new r.Identify(t, e)),
            'page' === t.type && (n = new r.Page(t, e)),
            'alias' === t.type && (n = new r.Alias(t, e)),
            'group' === t.type && (n = new r.Group(t, e)),
            'screen' === t.type && (n = new r.Screen(t, e)),
            Object.defineProperty(n, 'obj', { value: t, writable: !0 }),
            n
          )
        }
      },
      6175: function (t, e, n) {
        'use strict'
        n.d(e, {
          B: function () {
            return o
          },
          X: function () {
            return i
          },
        })
        var r = 'npm'
        function i(t) {
          r = t
        }
        function o() {
          return r
        }
      },
      6338: function (t, e, n) {
        'use strict'
        n.r(e),
          n.d(e, {
            applyDestinationMiddleware: function () {
              return u
            },
            sourceMiddlewarePlugin: function () {
              return s
            },
          })
        var r = n(5163),
          i = n(1494),
          o = n(9950)
        function u(t, e, n) {
          return (0, r.mG)(this, void 0, Promise, function () {
            function i(e, n) {
              return (0, r.mG)(this, void 0, Promise, function () {
                var i, u, s
                return (0, r.Jh)(this, function (a) {
                  switch (a.label) {
                    case 0:
                      return (
                        (i = !1),
                        (u = null),
                        [
                          4,
                          n({
                            payload: (0, o.D)(e, { clone: !0, traverse: !1 }),
                            integration: t,
                            next: function (t) {
                              ;(i = !0), null === t && (u = null), t && (u = t.obj)
                            },
                          }),
                        ]
                      )
                    case 1:
                      return (
                        a.sent(),
                        i ||
                          null === u ||
                          (u.integrations = (0, r.pi)((0, r.pi)({}, e.integrations), (((s = {})[t] = !1), s))),
                        [2, u]
                      )
                  }
                })
              })
            }
            var u, s, a, c, l
            return (0, r.Jh)(this, function (t) {
              switch (t.label) {
                case 0:
                  ;(u = (0, o.D)(e, { clone: !0, traverse: !1 }).rawEvent()), (s = 0), (a = n), (t.label = 1)
                case 1:
                  return s < a.length ? ((c = a[s]), [4, i(u, c)]) : [3, 4]
                case 2:
                  if (null === (l = t.sent())) return [2, null]
                  ;(u = l), (t.label = 3)
                case 3:
                  return s++, [3, 1]
                case 4:
                  return [2, u]
              }
            })
          })
        }
        function s(t, e) {
          function n(n) {
            return (0, r.mG)(this, void 0, Promise, function () {
              var u
              return (0, r.Jh)(this, function (r) {
                switch (r.label) {
                  case 0:
                    return (
                      (u = !1),
                      [
                        4,
                        t({
                          payload: (0, o.D)(n.event, { clone: !0, traverse: !1 }),
                          integrations: null != e ? e : {},
                          next: function (t) {
                            ;(u = !0), t && (n.event = t.obj)
                          },
                        }),
                      ]
                    )
                  case 1:
                    if ((r.sent(), !u))
                      throw new i.Y({
                        retry: !1,
                        type: 'middleware_cancellation',
                        reason: 'Middleware `next` function skipped',
                      })
                    return [2, n]
                }
              })
            })
          }
          return {
            name: 'Source Middleware '.concat(t.name),
            type: 'before',
            version: '0.1.0',
            isLoaded: function () {
              return !0
            },
            load: function (t) {
              return Promise.resolve(t)
            },
            track: n,
            page: n,
            identify: n,
            alias: n,
            group: n,
          }
        }
      },
      5163: function (t, e, n) {
        'use strict'
        n.d(e, {
          Jh: function () {
            return a
          },
          ZT: function () {
            return i
          },
          _T: function () {
            return u
          },
          ev: function () {
            return c
          },
          mG: function () {
            return s
          },
          pi: function () {
            return o
          },
        })
        var r = function (t, e) {
          return (
            (r =
              Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array &&
                function (t, e) {
                  t.__proto__ = e
                }) ||
              function (t, e) {
                for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n])
              }),
            r(t, e)
          )
        }
        function i(t, e) {
          if ('function' != typeof e && null !== e)
            throw new TypeError('Class extends value ' + String(e) + ' is not a constructor or null')
          function n() {
            this.constructor = t
          }
          r(t, e), (t.prototype = null === e ? Object.create(e) : ((n.prototype = e.prototype), new n()))
        }
        var o = function () {
          return (
            (o =
              Object.assign ||
              function (t) {
                for (var e, n = 1, r = arguments.length; n < r; n++)
                  for (var i in (e = arguments[n])) Object.prototype.hasOwnProperty.call(e, i) && (t[i] = e[i])
                return t
              }),
            o.apply(this, arguments)
          )
        }
        function u(t, e) {
          var n = {}
          for (var r in t) Object.prototype.hasOwnProperty.call(t, r) && e.indexOf(r) < 0 && (n[r] = t[r])
          if (null != t && 'function' == typeof Object.getOwnPropertySymbols) {
            var i = 0
            for (r = Object.getOwnPropertySymbols(t); i < r.length; i++)
              e.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(t, r[i]) && (n[r[i]] = t[r[i]])
          }
          return n
        }
        function s(t, e, n, r) {
          return new (n || (n = Promise))(function (i, o) {
            function u(t) {
              try {
                a(r.next(t))
              } catch (t) {
                o(t)
              }
            }
            function s(t) {
              try {
                a(r.throw(t))
              } catch (t) {
                o(t)
              }
            }
            function a(t) {
              var e
              t.done
                ? i(t.value)
                : ((e = t.value),
                  e instanceof n
                    ? e
                    : new n(function (t) {
                        t(e)
                      })).then(u, s)
            }
            a((r = r.apply(t, e || [])).next())
          })
        }
        function a(t, e) {
          var n,
            r,
            i,
            o,
            u = {
              label: 0,
              sent: function () {
                if (1 & i[0]) throw i[1]
                return i[1]
              },
              trys: [],
              ops: [],
            }
          return (
            (o = { next: s(0), throw: s(1), return: s(2) }),
            'function' == typeof Symbol &&
              (o[Symbol.iterator] = function () {
                return this
              }),
            o
          )
          function s(s) {
            return function (a) {
              return (function (s) {
                if (n) throw new TypeError('Generator is already executing.')
                for (; o && ((o = 0), s[0] && (u = 0)), u; )
                  try {
                    if (
                      ((n = 1),
                      r &&
                        (i = 2 & s[0] ? r.return : s[0] ? r.throw || ((i = r.return) && i.call(r), 0) : r.next) &&
                        !(i = i.call(r, s[1])).done)
                    )
                      return i
                    switch (((r = 0), i && (s = [2 & s[0], i.value]), s[0])) {
                      case 0:
                      case 1:
                        i = s
                        break
                      case 4:
                        return u.label++, { value: s[1], done: !1 }
                      case 5:
                        u.label++, (r = s[1]), (s = [0])
                        continue
                      case 7:
                        ;(s = u.ops.pop()), u.trys.pop()
                        continue
                      default:
                        if (!((i = u.trys), (i = i.length > 0 && i[i.length - 1]) || (6 !== s[0] && 2 !== s[0]))) {
                          u = 0
                          continue
                        }
                        if (3 === s[0] && (!i || (s[1] > i[0] && s[1] < i[3]))) {
                          u.label = s[1]
                          break
                        }
                        if (6 === s[0] && u.label < i[1]) {
                          ;(u.label = i[1]), (i = s)
                          break
                        }
                        if (i && u.label < i[2]) {
                          ;(u.label = i[2]), u.ops.push(s)
                          break
                        }
                        i[2] && u.ops.pop(), u.trys.pop()
                        continue
                    }
                    s = e.call(t, u)
                  } catch (t) {
                    ;(s = [6, t]), (r = 0)
                  } finally {
                    n = i = 0
                  }
                if (5 & s[0]) throw s[1]
                return { value: s[0] ? s[1] : void 0, done: !0 }
              })([s, a])
            }
          }
        }
        Object.create
        function c(t, e, n) {
          if (n || 2 === arguments.length)
            for (var r, i = 0, o = e.length; i < o; i++)
              (!r && i in e) || (r || (r = Array.prototype.slice.call(e, 0, i)), (r[i] = e[i]))
          return t.concat(r || Array.prototype.slice.call(e))
        }
        Object.create
      },
      888: function (t, e, n) {
        'use strict'
        function r(t, e) {
          return new Promise(function (n, r) {
            var i = setTimeout(function () {
              r(Error('Promise timed out'))
            }, e)
            t.then(function (t) {
              return clearTimeout(i), n(t)
            }).catch(r)
          })
        }
        function i(t, e, n) {
          var i
          return ((i = n),
          new Promise(function (t) {
            return setTimeout(t, i)
          }))
            .then(function () {
              return r(
                (function () {
                  try {
                    return Promise.resolve(e(t))
                  } catch (t) {
                    return Promise.reject(t)
                  }
                })(),
                1e3,
              )
            })
            .catch(function (e) {
              null == t || t.log('warn', 'Callback Error', { error: e }),
                null == t || t.stats.increment('callback_error')
            })
            .then(function () {
              return t
            })
        }
        n.d(e, {
          FJ: function () {
            return r
          },
          UI: function () {
            return i
          },
        })
      },
      1494: function (t, e, n) {
        'use strict'
        n.d(e, {
          Y: function () {
            return a
          },
          _: function () {
            return c
          },
        })
        var r = n(7831),
          i = n(380),
          o = n(5163),
          u = (function () {
            function t() {
              this._logs = []
            }
            return (
              (t.prototype.log = function (t, e, n) {
                var r = new Date()
                this._logs.push({ level: t, message: e, time: r, extras: n })
              }),
              Object.defineProperty(t.prototype, 'logs', {
                get: function () {
                  return this._logs
                },
                enumerable: !1,
                configurable: !0,
              }),
              (t.prototype.flush = function () {
                if (this.logs.length > 1) {
                  var t = this._logs.reduce(function (t, e) {
                    var n,
                      r,
                      i,
                      u = (0, o.pi)((0, o.pi)({}, e), { json: JSON.stringify(e.extras, null, ' '), extras: e.extras })
                    delete u.time
                    var s =
                      null !== (i = null === (r = e.time) || void 0 === r ? void 0 : r.toISOString()) && void 0 !== i
                        ? i
                        : ''
                    return (
                      t[s] && (s = ''.concat(s, '-').concat(Math.random())),
                      (0, o.pi)((0, o.pi)({}, t), (((n = {})[s] = u), n))
                    )
                  }, {})
                  console.table ? console.table(t) : console.log(t)
                } else
                  this.logs.forEach(function (t) {
                    var e = t.level,
                      n = t.message,
                      r = t.extras
                    'info' === e || 'debug' === e
                      ? console.log(n, null != r ? r : '')
                      : console[e](n, null != r ? r : '')
                  })
                this._logs = []
              }),
              t
            )
          })(),
          s = n(417),
          a = function (t) {
            var e, n, r
            ;(this.retry = null === (e = t.retry) || void 0 === e || e),
              (this.type = null !== (n = t.type) && void 0 !== n ? n : 'plugin Error'),
              (this.reason = null !== (r = t.reason) && void 0 !== r ? r : '')
          },
          c = (function () {
            function t(t, e, n, i) {
              void 0 === e && (e = (0, r.v4)()),
                void 0 === n && (n = new s.i()),
                void 0 === i && (i = new u()),
                (this.attempts = 0),
                (this.event = t),
                (this._id = e),
                (this.logger = i),
                (this.stats = n)
            }
            return (
              (t.system = function () {}),
              (t.prototype.isSame = function (t) {
                return t.id === this.id
              }),
              (t.prototype.cancel = function (t) {
                if (t) throw t
                throw new a({ reason: 'Context Cancel' })
              }),
              (t.prototype.log = function (t, e, n) {
                this.logger.log(t, e, n)
              }),
              Object.defineProperty(t.prototype, 'id', {
                get: function () {
                  return this._id
                },
                enumerable: !1,
                configurable: !0,
              }),
              (t.prototype.updateEvent = function (t, e) {
                var n
                if ('integrations' === t.split('.')[0]) {
                  var r = t.split('.')[1]
                  if (!1 === (null === (n = this.event.integrations) || void 0 === n ? void 0 : n[r])) return this.event
                }
                return (0, i.N)(this.event, t, e), this.event
              }),
              (t.prototype.failedDelivery = function () {
                return this._failedDelivery
              }),
              (t.prototype.setFailedDelivery = function (t) {
                this._failedDelivery = t
              }),
              (t.prototype.logs = function () {
                return this.logger.logs
              }),
              (t.prototype.flush = function () {
                this.logger.flush(), this.stats.flush()
              }),
              (t.prototype.toJSON = function () {
                return { id: this._id, event: this.event, logs: this.logger.logs, metrics: this.stats.metrics }
              }),
              t
            )
          })()
      },
      7127: function (t, e, n) {
        'use strict'
        n.d(e, {
          Q: function () {
            return r
          },
        })
        var r = (function () {
          function t() {
            this.callbacks = {}
          }
          return (
            (t.prototype.on = function (t, e) {
              return this.callbacks[t] ? this.callbacks[t].push(e) : (this.callbacks[t] = [e]), this
            }),
            (t.prototype.once = function (t, e) {
              var n = this,
                r = function () {
                  for (var i = [], o = 0; o < arguments.length; o++) i[o] = arguments[o]
                  n.off(t, r), e.apply(n, i)
                }
              return this.on(t, r), this
            }),
            (t.prototype.off = function (t, e) {
              var n,
                r = (null !== (n = this.callbacks[t]) && void 0 !== n ? n : []).filter(function (t) {
                  return t !== e
                })
              return (this.callbacks[t] = r), this
            }),
            (t.prototype.emit = function (t) {
              for (var e, n = this, r = [], i = 1; i < arguments.length; i++) r[i - 1] = arguments[i]
              var o = null !== (e = this.callbacks[t]) && void 0 !== e ? e : []
              return (
                o.forEach(function (t) {
                  t.apply(n, r)
                }),
                this
              )
            }),
            t
          )
        })()
      },
      3098: function (t, e, n) {
        'use strict'
        n.d(e, {
          M: function () {
            return o
          },
          Z: function () {
            return u
          },
        })
        var r = n(5163),
          i = n(7127)
        var o = 'onRemoveFromFuture',
          u = (function (t) {
            function e(e, n, r) {
              var i = t.call(this) || this
              return (i.future = []), (i.maxAttempts = e), (i.queue = n), (i.seen = null != r ? r : {}), i
            }
            return (
              (0, r.ZT)(e, t),
              (e.prototype.push = function () {
                for (var t = this, e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
                var r = e.map(function (e) {
                  return !(t.updateAttempts(e) > t.maxAttempts || t.includes(e)) && (t.queue.push(e), !0)
                })
                return (
                  (this.queue = this.queue.sort(function (e, n) {
                    return t.getAttempts(e) - t.getAttempts(n)
                  })),
                  r
                )
              }),
              (e.prototype.pushWithBackoff = function (t) {
                var e = this
                if (0 === this.getAttempts(t)) return this.push(t)[0]
                var n = this.updateAttempts(t)
                if (n > this.maxAttempts || this.includes(t)) return !1
                var r = (function (t) {
                  var e = Math.random() + 1,
                    n = t.minTimeout,
                    r = void 0 === n ? 500 : n,
                    i = t.factor,
                    o = void 0 === i ? 2 : i,
                    u = t.attempt,
                    s = t.maxTimeout,
                    a = void 0 === s ? 1 / 0 : s
                  return Math.min(e * r * Math.pow(o, u), a)
                })({ attempt: n - 1 })
                return (
                  setTimeout(function () {
                    e.queue.push(t),
                      (e.future = e.future.filter(function (e) {
                        return e.id !== t.id
                      })),
                      e.emit(o)
                  }, r),
                  this.future.push(t),
                  !0
                )
              }),
              (e.prototype.getAttempts = function (t) {
                var e
                return null !== (e = this.seen[t.id]) && void 0 !== e ? e : 0
              }),
              (e.prototype.updateAttempts = function (t) {
                return (this.seen[t.id] = this.getAttempts(t) + 1), this.getAttempts(t)
              }),
              (e.prototype.includes = function (t) {
                return (
                  this.queue.includes(t) ||
                  this.future.includes(t) ||
                  Boolean(
                    this.queue.find(function (e) {
                      return e.id === t.id
                    }),
                  ) ||
                  Boolean(
                    this.future.find(function (e) {
                      return e.id === t.id
                    }),
                  )
                )
              }),
              (e.prototype.pop = function () {
                return this.queue.shift()
              }),
              Object.defineProperty(e.prototype, 'length', {
                get: function () {
                  return this.queue.length
                },
                enumerable: !1,
                configurable: !0,
              }),
              Object.defineProperty(e.prototype, 'todo', {
                get: function () {
                  return this.queue.length + this.future.length
                },
                enumerable: !1,
                configurable: !0,
              }),
              e
            )
          })(i.Q)
      },
      6096: function (t, e, n) {
        'use strict'
        n.d(e, {
          a: function () {
            return o
          },
          z: function () {
            return u
          },
        })
        var r = n(5163),
          i = n(1494)
        function o(t, e) {
          t.log('debug', 'plugin', { plugin: e.name })
          var n = new Date().getTime(),
            o = e[t.event.type]
          return void 0 === o
            ? Promise.resolve(t)
            : (function (t) {
                return (0, r.mG)(this, void 0, void 0, function () {
                  var e
                  return (0, r.Jh)(this, function (n) {
                    switch (n.label) {
                      case 0:
                        return n.trys.push([0, 2, , 3]), [4, t()]
                      case 1:
                        return [2, n.sent()]
                      case 2:
                        return (e = n.sent()), [2, Promise.reject(e)]
                      case 3:
                        return [2]
                    }
                  })
                })
              })(function () {
                return o.apply(e, [t])
              })
                .then(function (t) {
                  var r = new Date().getTime() - n
                  return t.stats.gauge('plugin_time', r, ['plugin:'.concat(e.name)]), t
                })
                .catch(function (n) {
                  if (n instanceof i.Y && 'middleware_cancellation' === n.type) throw n
                  return n instanceof i.Y
                    ? (t.log('warn', n.type, { plugin: e.name, error: n }), n)
                    : (t.log('error', 'plugin Error', { plugin: e.name, error: n }),
                      t.stats.increment('plugin_error', 1, ['plugin:'.concat(e.name)]),
                      n)
                })
        }
        function u(t, e) {
          return o(t, e).then(function (e) {
            if (e instanceof i._) return e
            t.log('debug', 'Context canceled'), t.stats.increment('context_canceled'), t.cancel(e)
          })
        }
      },
      417: function (t, e, n) {
        'use strict'
        n.d(e, {
          i: function () {
            return o
          },
          s: function () {
            return i
          },
        })
        var r = n(5163),
          i = (function () {
            function t() {
              this.metrics = []
            }
            return (
              (t.prototype.increment = function (t, e, n) {
                void 0 === e && (e = 1),
                  this.metrics.push({
                    metric: t,
                    value: e,
                    tags: null != n ? n : [],
                    type: 'counter',
                    timestamp: Date.now(),
                  })
              }),
              (t.prototype.gauge = function (t, e, n) {
                this.metrics.push({
                  metric: t,
                  value: e,
                  tags: null != n ? n : [],
                  type: 'gauge',
                  timestamp: Date.now(),
                })
              }),
              (t.prototype.flush = function () {
                var t = this.metrics.map(function (t) {
                  return (0, r.pi)((0, r.pi)({}, t), { tags: t.tags.join(',') })
                })
                console.table ? console.table(t) : console.log(t), (this.metrics = [])
              }),
              (t.prototype.serialize = function () {
                return this.metrics.map(function (t) {
                  return {
                    m: t.metric,
                    v: t.value,
                    t: t.tags,
                    k: ((e = t.type), { gauge: 'g', counter: 'c' }[e]),
                    e: t.timestamp,
                  }
                  var e
                })
              }),
              t
            )
          })(),
          o = (function (t) {
            function e() {
              return (null !== t && t.apply(this, arguments)) || this
            }
            return (
              (0, r.ZT)(e, t),
              (e.prototype.gauge = function () {
                for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e]
              }),
              (e.prototype.increment = function () {
                for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e]
              }),
              (e.prototype.flush = function () {
                for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e]
              }),
              (e.prototype.serialize = function () {
                for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e]
                return []
              }),
              e
            )
          })(i)
      },
      7595: function (t, e, n) {
        'use strict'
        function r(t) {
          return 'string' == typeof t
        }
        function i(t) {
          return 'number' == typeof t
        }
        function o(t) {
          return 'function' == typeof t
        }
        function u(t) {
          return null != t
        }
        function s(t) {
          return 'object' === Object.prototype.toString.call(t).slice(8, -1).toLowerCase()
        }
        n.d(e, {
          Gg: function () {
            return u
          },
          HD: function () {
            return r
          },
          PO: function () {
            return s
          },
          hj: function () {
            return i
          },
          mf: function () {
            return o
          },
        })
      },
      7831: function (t, e, n) {
        'use strict'
        n.d(e, {
          v4: function () {
            return u
          },
        })
        for (var r, i = 256, o = []; i--; ) o[i] = (i + 256).toString(16).substring(1)
        function u() {
          var t,
            e = 0,
            n = ''
          if (!r || i + 16 > 256) {
            for (r = Array((e = 256)); e--; ) r[e] = (256 * Math.random()) | 0
            e = i = 0
          }
          for (; e < 16; e++)
            (t = r[i + e]),
              (n += 6 == e ? o[(15 & t) | 64] : 8 == e ? o[(63 & t) | 128] : o[t]),
              1 & e && e > 1 && e < 11 && (n += '-')
          return i++, n
        }
      },
      380: function (t, e, n) {
        'use strict'
        function r(t, e, n) {
          e.split && (e = e.split('.'))
          for (
            var r, i, o = 0, u = e.length, s = t;
            o < u && '__proto__' !== (i = e[o++]) && 'constructor' !== i && 'prototype' !== i;

          )
            s = s[i] =
              o === u ? n : typeof (r = s[i]) == typeof e ? r : 0 * e[o] != 0 || ~('' + e[o]).indexOf('.') ? {} : []
        }
        n.d(e, {
          N: function () {
            return r
          },
        })
      },
    },
    o = {}
  function u(t) {
    var e = o[t]
    if (void 0 !== e) return e.exports
    var n = (o[t] = { exports: {} })
    return i[t].call(n.exports, n, n.exports, u), n.exports
  }
  ;(u.m = i),
    (u.n = function (t) {
      var e =
        t && t.__esModule
          ? function () {
              return t.default
            }
          : function () {
              return t
            }
      return u.d(e, { a: e }), e
    }),
    (e = Object.getPrototypeOf
      ? function (t) {
          return Object.getPrototypeOf(t)
        }
      : function (t) {
          return t.__proto__
        }),
    (u.t = function (n, r) {
      if ((1 & r && (n = this(n)), 8 & r)) return n
      if ('object' == typeof n && n) {
        if (4 & r && n.__esModule) return n
        if (16 & r && 'function' == typeof n.then) return n
      }
      var i = Object.create(null)
      u.r(i)
      var o = {}
      t = t || [null, e({}), e([]), e(e)]
      for (var s = 2 & r && n; 'object' == typeof s && !~t.indexOf(s); s = e(s))
        Object.getOwnPropertyNames(s).forEach(function (t) {
          o[t] = function () {
            return n[t]
          }
        })
      return (
        (o.default = function () {
          return n
        }),
        u.d(i, o),
        i
      )
    }),
    (u.d = function (t, e) {
      for (var n in e) u.o(e, n) && !u.o(t, n) && Object.defineProperty(t, n, { enumerable: !0, get: e[n] })
    }),
    (u.f = {}),
    (u.e = function (t) {
      return Promise.all(
        Object.keys(u.f).reduce(function (e, n) {
          return u.f[n](t, e), e
        }, []),
      )
    }),
    (u.u = function (t) {
      return (
        ({
          96: 'queryString',
          119: 'auto-track',
          150: 'legacyVideos',
          214: 'remoteMiddleware',
          464: 'ajs-destination',
          493: 'schemaFilter',
          604: 'tsub-middleware',
        }[t] || t) +
        '.bundle.' +
        {
          96: '5949e6e86feb5312385b',
          119: 'a9d7db192bb0f8beb329',
          150: '611314fd74bde9f21947',
          214: '366df96a78421ccf3f3e',
          464: '0f003b5e4b03680982b4',
          493: 'f63551a29dc1697f71b6',
          604: '77315eced46c5ae4c052',
          799: '3370767d4bbb423fe139',
          870: '6e2976b75e60ab2b2bf8',
        }[t] +
        '.js'
      )
    }),
    (u.o = function (t, e) {
      return Object.prototype.hasOwnProperty.call(t, e)
    }),
    (n = {}),
    (r = '@segment/analytics-next:'),
    (u.l = function (t, e, i, o) {
      if (n[t]) n[t].push(e)
      else {
        var s, a
        if (void 0 !== i)
          for (var c = document.getElementsByTagName('script'), l = 0; l < c.length; l++) {
            var f = c[l]
            if (f.getAttribute('src') == t || f.getAttribute('data-webpack') == r + i) {
              s = f
              break
            }
          }
        s ||
          ((a = !0),
          ((s = document.createElement('script')).charset = 'utf-8'),
          (s.timeout = 120),
          u.nc && s.setAttribute('nonce', u.nc),
          s.setAttribute('data-webpack', r + i),
          (s.src = t)),
          (n[t] = [e])
        var p = function (e, r) {
            ;(s.onerror = s.onload = null), clearTimeout(d)
            var i = n[t]
            if (
              (delete n[t],
              s.parentNode && s.parentNode.removeChild(s),
              i &&
                i.forEach(function (t) {
                  return t(r)
                }),
              e)
            )
              return e(r)
          },
          d = setTimeout(p.bind(null, void 0, { type: 'timeout', target: s }), 12e4)
        ;(s.onerror = p.bind(null, s.onerror)), (s.onload = p.bind(null, s.onload)), a && document.head.appendChild(s)
      }
    }),
    (u.r = function (t) {
      'undefined' != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(t, Symbol.toStringTag, { value: 'Module' }),
        Object.defineProperty(t, '__esModule', { value: !0 })
    }),
    (u.p = ''),
    (function () {
      var t = { 610: 0 }
      u.f.j = function (e, n) {
        var r = u.o(t, e) ? t[e] : void 0
        if (0 !== r)
          if (r) n.push(r[2])
          else {
            var i = new Promise(function (n, i) {
              r = t[e] = [n, i]
            })
            n.push((r[2] = i))
            var o = u.p + u.u(e),
              s = new Error()
            u.l(
              o,
              function (n) {
                if (u.o(t, e) && (0 !== (r = t[e]) && (t[e] = void 0), r)) {
                  var i = n && ('load' === n.type ? 'missing' : n.type),
                    o = n && n.target && n.target.src
                  ;(s.message = 'Loading chunk ' + e + ' failed.\n(' + i + ': ' + o + ')'),
                    (s.name = 'ChunkLoadError'),
                    (s.type = i),
                    (s.request = o),
                    r[1](s)
                }
              },
              'chunk-' + e,
              e,
            )
          }
      }
      var e = function (e, n) {
          var r,
            i,
            o = n[0],
            s = n[1],
            a = n[2],
            c = 0
          if (
            o.some(function (e) {
              return 0 !== t[e]
            })
          ) {
            for (r in s) u.o(s, r) && (u.m[r] = s[r])
            if (a) a(u)
          }
          for (e && e(n); c < o.length; c++) (i = o[c]), u.o(t, i) && t[i] && t[i][0](), (t[i] = 0)
        },
        n = (self.webpackChunk_segment_analytics_next = self.webpackChunk_segment_analytics_next || [])
      n.forEach(e.bind(null, 0)), (n.push = e.bind(null, n.push.bind(n)))
    })()
  var s = {}
  !(function () {
    'use strict'
    u.r(s)
    var t = u(5163),
      e = u(7566),
      n = u(6175)
    function r() {
      return 'undefined' != typeof process && process.env ? process.env : {}
    }
    var i = u(4759),
      o = u(7595)
    function a(t, e, n, r) {
      var i,
        u = [t, e, n, r],
        s = (0, o.PO)(t) ? t.event : t
      if (!s || !(0, o.HD)(s)) throw new Error('Event missing')
      var a = (0, o.PO)(t) ? (null !== (i = t.properties) && void 0 !== i ? i : {}) : (0, o.PO)(e) ? e : {},
        c = {}
      return (
        (0, o.mf)(n) || (c = null != n ? n : {}),
        (0, o.PO)(t) && !(0, o.mf)(e) && (c = null != e ? e : {}),
        [s, a, c, u.find(o.mf)]
      )
    }
    function c(t, e, n, r, i) {
      var u,
        s,
        a = null,
        c = null,
        l = [t, e, n, r, i],
        f = l.filter(o.HD)
      void 0 !== f[0] && void 0 !== f[1] && ((a = f[0]), (c = f[1])), 1 === f.length && ((a = null), (c = f[0]))
      var p = l.find(o.mf),
        d = l.filter(function (t) {
          return null === c ? (0, o.PO)(t) : (0, o.PO)(t) || null === t
        }),
        h = null !== (u = d[0]) && void 0 !== u ? u : {},
        v = null !== (s = d[1]) && void 0 !== s ? s : {}
      return [a, c, h, v, p]
    }
    var l = function (t) {
      return function () {
        for (var e, n, r, i, u, s = [], a = 0; a < arguments.length; a++) s[a] = arguments[a]
        var c = null
        c =
          null !==
            (r =
              null !== (e = s.find(o.HD)) && void 0 !== e
                ? e
                : null === (n = s.find(o.hj)) || void 0 === n
                ? void 0
                : n.toString()) && void 0 !== r
            ? r
            : t.id()
        var l = s.filter(function (t) {
            return null === c ? (0, o.PO)(t) : (0, o.PO)(t) || null === t
          }),
          f = null !== (i = l[0]) && void 0 !== i ? i : {},
          p = null !== (u = l[1]) && void 0 !== u ? u : {},
          d = s.find(o.mf)
        return [c, f, p, d]
      }
    }
    function f(t, e, n, r) {
      ;(0, o.hj)(t) && (t = t.toString()), (0, o.hj)(e) && (e = e.toString())
      var i = [t, e, n, r],
        u = i.filter(o.HD),
        s = u[0],
        a = void 0 === s ? t : s,
        c = u[1],
        l = void 0 === c ? null : c,
        f = i.filter(o.PO)[0]
      return [a, l, void 0 === f ? {} : f, i.find(o.mf)]
    }
    var p = u(94),
      d = u(8404),
      h = u(888)
    function v(e, n, r, i) {
      return (0, t.mG)(this, void 0, void 0, function () {
        var o, u
        return (0, t.Jh)(this, function (t) {
          switch (t.label) {
            case 0:
              return r.emit('dispatch_start', e), (o = Date.now()), n.isEmpty() ? [4, n.dispatchSingle(e)] : [3, 2]
            case 1:
              return (u = t.sent()), [3, 4]
            case 2:
              return [4, n.dispatch(e)]
            case 3:
              ;(u = t.sent()), (t.label = 4)
            case 4:
              return (null == i ? void 0 : i.callback)
                ? [
                    4,
                    (0, h.UI)(
                      u,
                      i.callback,
                      ((s = o), (a = i.timeout), (c = Date.now() - s), Math.max((null != a ? a : 300) - c, 0)),
                    ),
                  ]
                : [3, 6]
            case 5:
              ;(u = t.sent()), (t.label = 6)
            case 6:
              return (null == i ? void 0 : i.debug) && u.flush(), [2, u]
          }
          var s, a, c
        })
      })
    }
    var y = u(7127),
      m = u(7831),
      g = u(380),
      b = u(4791),
      w = u.n(b),
      _ = (function () {
        function e(t) {
          this.user = t
        }
        return (
          (e.prototype.track = function (e, n, r, i) {
            return this.normalize(
              (0, t.pi)((0, t.pi)({}, this.baseEvent()), {
                event: e,
                type: 'track',
                properties: n,
                options: (0, t.pi)({}, r),
                integrations: (0, t.pi)({}, i),
              }),
            )
          }),
          (e.prototype.page = function (e, n, r, i, o) {
            var u,
              s = {
                type: 'page',
                properties: (0, t.pi)({}, r),
                options: (0, t.pi)({}, i),
                integrations: (0, t.pi)({}, o),
              }
            return (
              null !== e &&
                ((s.category = e),
                (s.properties = null !== (u = s.properties) && void 0 !== u ? u : {}),
                (s.properties.category = e)),
              null !== n && (s.name = n),
              this.normalize((0, t.pi)((0, t.pi)({}, this.baseEvent()), s))
            )
          }),
          (e.prototype.screen = function (e, n, r, i, o) {
            var u = {
              type: 'screen',
              properties: (0, t.pi)({}, r),
              options: (0, t.pi)({}, i),
              integrations: (0, t.pi)({}, o),
            }
            return (
              null !== e && (u.category = e),
              null !== n && (u.name = n),
              this.normalize((0, t.pi)((0, t.pi)({}, this.baseEvent()), u))
            )
          }),
          (e.prototype.identify = function (e, n, r, i) {
            return this.normalize(
              (0, t.pi)((0, t.pi)({}, this.baseEvent()), {
                type: 'identify',
                userId: e,
                traits: n,
                options: (0, t.pi)({}, r),
                integrations: (0, t.pi)({}, i),
              }),
            )
          }),
          (e.prototype.group = function (e, n, r, i) {
            return this.normalize(
              (0, t.pi)((0, t.pi)({}, this.baseEvent()), {
                type: 'group',
                traits: n,
                options: (0, t.pi)({}, r),
                integrations: (0, t.pi)({}, i),
                groupId: e,
              }),
            )
          }),
          (e.prototype.alias = function (e, n, r, i) {
            var o = { userId: e, type: 'alias', options: (0, t.pi)({}, r), integrations: (0, t.pi)({}, i) }
            return (
              null !== n && (o.previousId = n),
              void 0 === e
                ? this.normalize((0, t.pi)((0, t.pi)({}, o), this.baseEvent()))
                : this.normalize((0, t.pi)((0, t.pi)({}, this.baseEvent()), o))
            )
          }),
          (e.prototype.baseEvent = function () {
            var t = { integrations: {}, options: {} },
              e = this.user
            return e.id() && (t.userId = e.id()), e.anonymousId() && (t.anonymousId = e.anonymousId()), t
          }),
          (e.prototype.context = function (t) {
            var e,
              n,
              r,
              i = ['integrations', 'anonymousId', 'timestamp', 'userId'],
              o = null !== (e = t.options) && void 0 !== e ? e : {}
            delete o.integrations
            var u = Object.keys(o),
              s = null !== (r = null === (n = t.options) || void 0 === n ? void 0 : n.context) && void 0 !== r ? r : {},
              a = {}
            return (
              u.forEach(function (t) {
                'context' !== t && (i.includes(t) ? (0, g.N)(a, t, o[t]) : (0, g.N)(s, t, o[t]))
              }),
              [s, a]
            )
          }),
          (e.prototype.normalize = function (e) {
            var n, r, i
            ;(null === (n = e.options) || void 0 === n ? void 0 : n.anonymousId) &&
              this.user.anonymousId(e.options.anonymousId)
            var o = Object.keys(null !== (r = e.integrations) && void 0 !== r ? r : {}).reduce(function (n, r) {
                var i, o
                return (0,
                t.pi)((0, t.pi)({}, n), (((i = {})[r] = Boolean(null === (o = e.integrations) || void 0 === o ? void 0 : o[r])), i))
              }, {}),
              u = (0, t.pi)((0, t.pi)({}, o), null === (i = e.options) || void 0 === i ? void 0 : i.integrations),
              s = this.context(e),
              a = s[0],
              c = s[1],
              l = (e.options, (0, t._T)(e, ['options'])),
              f = (0, t.pi)((0, t.pi)((0, t.pi)({ timestamp: new Date() }, l), { context: a, integrations: u }), c),
              p = 'ajs-next-' + w().hash(JSON.stringify(f) + (0, m.v4)())
            return (0, t.pi)((0, t.pi)({}, f), { messageId: p })
          }),
          e
        )
      })(),
      x = u(3061)
    var S = u(3098),
      j = u(1494),
      P = u(6096),
      I = (function (e) {
        function n(t) {
          var n,
            r,
            i,
            o = e.call(this) || this
          return (
            (o.criticalTasks =
              ((i = 0),
              {
                done: function () {
                  return n
                },
                run: function (t) {
                  var e,
                    o = t()
                  return (
                    'object' == typeof (e = o) &&
                      null !== e &&
                      'then' in e &&
                      'function' == typeof e.then &&
                      (1 == ++i &&
                        (n = new Promise(function (t) {
                          return (r = t)
                        })),
                      o.finally(function () {
                        return 0 == --i && r()
                      })),
                    o
                  )
                },
              })),
            (o.plugins = []),
            (o.failedInitializations = []),
            (o.flushing = !1),
            (o.queue = t),
            o.queue.on(S.M, function () {
              o.scheduleFlush(0)
            }),
            o
          )
        }
        return (
          (0, t.ZT)(n, e),
          (n.prototype.register = function (e, n, r) {
            return (0, t.mG)(this, void 0, void 0, function () {
              var i = this
              return (0, t.Jh)(this, function (t) {
                switch (t.label) {
                  case 0:
                    return [
                      4,
                      Promise.resolve(n.load(e, r))
                        .then(function () {
                          i.plugins.push(n)
                        })
                        .catch(function (t) {
                          if ('destination' === n.type)
                            return (
                              i.failedInitializations.push(n.name),
                              console.warn(n.name, t),
                              void e.log('warn', 'Failed to load destination', { plugin: n.name, error: t })
                            )
                          throw t
                        }),
                    ]
                  case 1:
                    return t.sent(), [2]
                }
              })
            })
          }),
          (n.prototype.deregister = function (e, n, r) {
            return (0, t.mG)(this, void 0, void 0, function () {
              var i
              return (0, t.Jh)(this, function (t) {
                switch (t.label) {
                  case 0:
                    return t.trys.push([0, 3, , 4]), n.unload ? [4, Promise.resolve(n.unload(e, r))] : [3, 2]
                  case 1:
                    t.sent(), (t.label = 2)
                  case 2:
                    return (
                      (this.plugins = this.plugins.filter(function (t) {
                        return t.name !== n.name
                      })),
                      [3, 4]
                    )
                  case 3:
                    return (
                      (i = t.sent()),
                      e.log('warn', 'Failed to unload destination', { plugin: n.name, error: i }),
                      [3, 4]
                    )
                  case 4:
                    return [2]
                }
              })
            })
          }),
          (n.prototype.dispatch = function (e) {
            return (0, t.mG)(this, void 0, void 0, function () {
              var n
              return (0, t.Jh)(this, function (t) {
                return (
                  e.log('debug', 'Dispatching'),
                  e.stats.increment('message_dispatched'),
                  this.queue.push(e),
                  (n = this.subscribeToDelivery(e)),
                  this.scheduleFlush(0),
                  [2, n]
                )
              })
            })
          }),
          (n.prototype.subscribeToDelivery = function (e) {
            return (0, t.mG)(this, void 0, void 0, function () {
              var n = this
              return (0, t.Jh)(this, function (t) {
                return [
                  2,
                  new Promise(function (t) {
                    var r = function (i, o) {
                      i.isSame(e) && (n.off('flush', r), t(i))
                    }
                    n.on('flush', r)
                  }),
                ]
              })
            })
          }),
          (n.prototype.dispatchSingle = function (e) {
            return (0, t.mG)(this, void 0, void 0, function () {
              var n = this
              return (0, t.Jh)(this, function (t) {
                return (
                  e.log('debug', 'Dispatching'),
                  e.stats.increment('message_dispatched'),
                  this.queue.updateAttempts(e),
                  (e.attempts = 1),
                  [
                    2,
                    this.deliver(e).catch(function (t) {
                      return n.enqueuRetry(t, e) ? n.subscribeToDelivery(e) : (e.setFailedDelivery({ reason: t }), e)
                    }),
                  ]
                )
              })
            })
          }),
          (n.prototype.isEmpty = function () {
            return 0 === this.queue.length
          }),
          (n.prototype.scheduleFlush = function (t) {
            var e = this
            void 0 === t && (t = 500),
              this.flushing ||
                ((this.flushing = !0),
                setTimeout(function () {
                  e.flush().then(function () {
                    setTimeout(function () {
                      ;(e.flushing = !1), e.queue.length && e.scheduleFlush(0)
                    }, 0)
                  })
                }, t))
          }),
          (n.prototype.deliver = function (e) {
            return (0, t.mG)(this, void 0, void 0, function () {
              var n, r, i, o
              return (0, t.Jh)(this, function (t) {
                switch (t.label) {
                  case 0:
                    return [4, this.criticalTasks.done()]
                  case 1:
                    t.sent(), (n = Date.now()), (t.label = 2)
                  case 2:
                    return t.trys.push([2, 4, , 5]), [4, this.flushOne(e)]
                  case 3:
                    return (
                      (e = t.sent()),
                      (r = Date.now() - n),
                      this.emit('delivery_success', e),
                      e.stats.gauge('delivered', r),
                      e.log('debug', 'Delivered', e.event),
                      [2, e]
                    )
                  case 4:
                    throw (
                      ((i = t.sent()),
                      (o = i),
                      e.log('error', 'Failed to deliver', o),
                      this.emit('delivery_failure', e, o),
                      e.stats.increment('delivery_failed'),
                      i)
                    )
                  case 5:
                    return [2]
                }
              })
            })
          }),
          (n.prototype.enqueuRetry = function (t, e) {
            return !(t instanceof j.Y && !t.retry) && this.queue.pushWithBackoff(e)
          }),
          (n.prototype.flush = function () {
            return (0, t.mG)(this, void 0, void 0, function () {
              var e, n
              return (0, t.Jh)(this, function (t) {
                switch (t.label) {
                  case 0:
                    if (0 === this.queue.length) return [2, []]
                    if (!(e = this.queue.pop())) return [2, []]
                    ;(e.attempts = this.queue.getAttempts(e)), (t.label = 1)
                  case 1:
                    return t.trys.push([1, 3, , 4]), [4, this.deliver(e)]
                  case 2:
                    return (e = t.sent()), this.emit('flush', e, !0), [3, 4]
                  case 3:
                    return (
                      (n = t.sent()),
                      this.enqueuRetry(n, e) || (e.setFailedDelivery({ reason: n }), this.emit('flush', e, !1)),
                      [2, []]
                    )
                  case 4:
                    return [2, [e]]
                }
              })
            })
          }),
          (n.prototype.isReady = function () {
            return !0
          }),
          (n.prototype.availableExtensions = function (e) {
            var n,
              r,
              i = this.plugins.filter(function (t) {
                var n, r, i
                if ('destination' !== t.type && 'Segment.io' !== t.name) return !0
                var o = void 0
                return (
                  null === (n = t.alternativeNames) ||
                    void 0 === n ||
                    n.forEach(function (t) {
                      void 0 !== e[t] && (o = e[t])
                    }),
                  null !== (i = null !== (r = e[t.name]) && void 0 !== r ? r : o) && void 0 !== i
                    ? i
                    : !1 !== ('Segment.io' === t.name || e.All)
                )
              }),
              o =
                ((n = 'type'),
                (r = {}),
                i.forEach(function (e) {
                  var i,
                    o = void 0
                  if ('string' == typeof n) {
                    var u = e[n]
                    o = 'string' != typeof u ? JSON.stringify(u) : u
                  } else n instanceof Function && (o = n(e))
                  void 0 !== o &&
                    (r[o] = (0, t.ev)((0, t.ev)([], null !== (i = r[o]) && void 0 !== i ? i : [], !0), [e], !1))
                }),
                r),
              u = o.before,
              s = void 0 === u ? [] : u,
              a = o.enrichment,
              c = void 0 === a ? [] : a,
              l = o.destination,
              f = void 0 === l ? [] : l,
              p = o.after
            return { before: s, enrichment: c, destinations: f, after: void 0 === p ? [] : p }
          }),
          (n.prototype.flushOne = function (e) {
            var n, r
            return (0, t.mG)(this, void 0, void 0, function () {
              var i, o, u, s, a, c, l, f, p, d, h, v, y, m
              return (0, t.Jh)(this, function (t) {
                switch (t.label) {
                  case 0:
                    if (!this.isReady()) throw new Error('Not ready')
                    e.attempts > 1 && this.emit('delivery_retry', e),
                      (i = this.availableExtensions(null !== (n = e.event.integrations) && void 0 !== n ? n : {})),
                      (o = i.before),
                      (u = i.enrichment),
                      (s = 0),
                      (a = o),
                      (t.label = 1)
                  case 1:
                    return s < a.length ? ((c = a[s]), [4, (0, P.z)(e, c)]) : [3, 4]
                  case 2:
                    ;(d = t.sent()) instanceof j._ && (e = d), this.emit('message_enriched', e, c), (t.label = 3)
                  case 3:
                    return s++, [3, 1]
                  case 4:
                    ;(l = 0), (f = u), (t.label = 5)
                  case 5:
                    return l < f.length ? ((p = f[l]), [4, (0, P.a)(e, p)]) : [3, 8]
                  case 6:
                    ;(d = t.sent()) instanceof j._ && (e = d), this.emit('message_enriched', e, p), (t.label = 7)
                  case 7:
                    return l++, [3, 5]
                  case 8:
                    return (
                      (h = this.availableExtensions(null !== (r = e.event.integrations) && void 0 !== r ? r : {})),
                      (v = h.destinations),
                      (y = h.after),
                      [
                        4,
                        new Promise(function (t, n) {
                          setTimeout(function () {
                            var r = v.map(function (t) {
                              return (0, P.a)(e, t)
                            })
                            Promise.all(r).then(t).catch(n)
                          }, 0)
                        }),
                      ]
                    )
                  case 9:
                    return (
                      t.sent(),
                      e.stats.increment('message_delivered'),
                      this.emit('message_delivered', e),
                      (m = y.map(function (t) {
                        return (0, P.a)(e, t)
                      })),
                      [4, Promise.all(m)]
                    )
                  case 10:
                    return t.sent(), [2, e]
                }
              })
            })
          }),
          n
        )
      })(y.Q),
      O = (function (e) {
        function n(t) {
          return e.call(this, 'string' == typeof t ? new x.$(4, t) : t) || this
        }
        return (
          (0, t.ZT)(n, e),
          (n.prototype.flush = function () {
            return (0, t.mG)(this, void 0, Promise, function () {
              return (0, t.Jh)(this, function (t) {
                return (0, p.s)() ? [2, []] : [2, e.prototype.flush.call(this)]
              })
            })
          }),
          n
        )
      })(I)
    function k(t) {
      for (var e = t.constructor.prototype, n = 0, r = Object.getOwnPropertyNames(e); n < r.length; n++) {
        var i = r[n]
        if ('constructor' !== i) {
          var o = Object.getOwnPropertyDescriptor(t.constructor.prototype, i)
          o && 'function' == typeof o.value && (t[i] = t[i].bind(t))
        }
      }
      return t
    }
    var A = { Cookie: 'cookie', LocalStorage: 'localStorage', Memory: 'memory' },
      M = (function () {
        function t(t) {
          this.stores = t
        }
        return (
          (t.prototype.get = function (t) {
            for (var e = null, n = 0, r = this.stores; n < r.length; n++) {
              var i = r[n]
              try {
                if (null != (e = i.get(t))) return e
              } catch (e) {
                console.warn("Can't access ".concat(t, ': ').concat(e))
              }
            }
            return null
          }),
          (t.prototype.set = function (t, e) {
            this.stores.forEach(function (n) {
              try {
                n.set(t, e)
              } catch (e) {
                console.warn("Can't set ".concat(t, ': ').concat(e))
              }
            })
          }),
          (t.prototype.clear = function (t) {
            this.stores.forEach(function (e) {
              try {
                e.remove(t)
              } catch (e) {
                console.warn("Can't remove ".concat(t, ': ').concat(e))
              }
            })
          }),
          (t.prototype.getAndSync = function (t) {
            var e = this.get(t),
              n = 'number' == typeof e ? e.toString() : e
            return this.set(t, n), n
          }),
          t
        )
      })(),
      E = (function () {
        function t() {
          this.cache = {}
        }
        return (
          (t.prototype.get = function (t) {
            var e
            return null !== (e = this.cache[t]) && void 0 !== e ? e : null
          }),
          (t.prototype.set = function (t, e) {
            this.cache[t] = e
          }),
          (t.prototype.remove = function (t) {
            delete this.cache[t]
          }),
          t
        )
      })()
    function F(t) {
      return (
        t &&
        t.stores &&
        Array.isArray(t.stores) &&
        t.stores.every(function (t) {
          return Object.values(A).includes(t)
        })
      )
    }
    function D(t) {
      for (var e = 1; e < arguments.length; e++) {
        var n = arguments[e]
        for (var r in n) t[r] = n[r]
      }
      return t
    }
    var C = (function t(e, n) {
        function r(t, r, i) {
          if ('undefined' != typeof document) {
            'number' == typeof (i = D({}, n, i)).expires && (i.expires = new Date(Date.now() + 864e5 * i.expires)),
              i.expires && (i.expires = i.expires.toUTCString()),
              (t = encodeURIComponent(t)
                .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
                .replace(/[()]/g, escape))
            var o = ''
            for (var u in i) i[u] && ((o += '; ' + u), !0 !== i[u] && (o += '=' + i[u].split(';')[0]))
            return (document.cookie = t + '=' + e.write(r, t) + o)
          }
        }
        return Object.create(
          {
            set: r,
            get: function (t) {
              if ('undefined' != typeof document && (!arguments.length || t)) {
                for (var n = document.cookie ? document.cookie.split('; ') : [], r = {}, i = 0; i < n.length; i++) {
                  var o = n[i].split('='),
                    u = o.slice(1).join('=')
                  try {
                    var s = decodeURIComponent(o[0])
                    if (((r[s] = e.read(u, s)), t === s)) break
                  } catch (t) {}
                }
                return t ? r[t] : r
              }
            },
            remove: function (t, e) {
              r(t, '', D({}, e, { expires: -1 }))
            },
            withAttributes: function (e) {
              return t(this.converter, D({}, this.attributes, e))
            },
            withConverter: function (e) {
              return t(D({}, this.converter, e), this.attributes)
            },
          },
          { attributes: { value: Object.freeze(n) }, converter: { value: Object.freeze(e) } },
        )
      })(
        {
          read: function (t) {
            return '"' === t[0] && (t = t.slice(1, -1)), t.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
          },
          write: function (t) {
            return encodeURIComponent(t).replace(/%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g, decodeURIComponent)
          },
        },
        { path: '/' },
      ),
      T = C
    function J(t) {
      var e = (function (t) {
        try {
          return new URL(t)
        } catch (t) {
          return
        }
      })(t)
      if (e)
        for (
          var n = (function (t) {
              var e = t.hostname.split('.'),
                n = e[e.length - 1],
                r = []
              if (4 === e.length && parseInt(n, 10) > 0) return r
              if (e.length <= 1) return r
              for (var i = e.length - 2; i >= 0; --i) r.push(e.slice(i).join('.'))
              return r
            })(e),
            r = 0;
          r < n.length;
          ++r
        ) {
          var i = '__tld__',
            o = n[r],
            u = { domain: '.' + o }
          try {
            if ((T.set(i, '1', u), T.get(i))) return T.remove(i, u), o
          } catch (t) {
            return
          }
        }
    }
    var G = (function () {
        function e(n) {
          void 0 === n && (n = e.defaults), (this.options = (0, t.pi)((0, t.pi)({}, e.defaults), n))
        }
        return (
          Object.defineProperty(e, 'defaults', {
            get: function () {
              return { maxage: 365, domain: J(window.location.href), path: '/', sameSite: 'Lax' }
            },
            enumerable: !1,
            configurable: !0,
          }),
          (e.prototype.opts = function () {
            return {
              sameSite: this.options.sameSite,
              expires: this.options.maxage,
              domain: this.options.domain,
              path: this.options.path,
              secure: this.options.secure,
            }
          }),
          (e.prototype.get = function (t) {
            var e
            try {
              var n = T.get(t)
              if (null == n) return null
              try {
                return null !== (e = JSON.parse(n)) && void 0 !== e ? e : null
              } catch (t) {
                return null != n ? n : null
              }
            } catch (t) {
              return null
            }
          }),
          (e.prototype.set = function (t, e) {
            'string' == typeof e
              ? T.set(t, e, this.opts())
              : null === e
              ? T.remove(t, this.opts())
              : T.set(t, JSON.stringify(e), this.opts())
          }),
          (e.prototype.remove = function (t) {
            return T.remove(t, this.opts())
          }),
          e
        )
      })(),
      q = (function () {
        function t() {}
        return (
          (t.prototype.localStorageWarning = function (t, e) {
            console.warn('Unable to access '.concat(t, ', localStorage may be ').concat(e))
          }),
          (t.prototype.get = function (t) {
            var e
            try {
              var n = localStorage.getItem(t)
              if (null === n) return null
              try {
                return null !== (e = JSON.parse(n)) && void 0 !== e ? e : null
              } catch (t) {
                return null != n ? n : null
              }
            } catch (e) {
              return this.localStorageWarning(t, 'unavailable'), null
            }
          }),
          (t.prototype.set = function (t, e) {
            try {
              localStorage.setItem(t, JSON.stringify(e))
            } catch (e) {
              this.localStorageWarning(t, 'full')
            }
          }),
          (t.prototype.remove = function (t) {
            try {
              return localStorage.removeItem(t)
            } catch (e) {
              this.localStorageWarning(t, 'unavailable')
            }
          }),
          t
        )
      })()
    function N(t) {
      return t.map(function (t) {
        var e, n
        switch (
          (!(function (t) {
            return 'object' == typeof t && void 0 !== t.name
          })(t)
            ? (e = t)
            : ((e = t.name), (n = t.settings)),
          e)
        ) {
          case A.Cookie:
            return new G(n)
          case A.LocalStorage:
            return new q()
          case A.Memory:
            return new E()
          default:
            throw new Error('Unknown Store Type: '.concat(t))
        }
      })
    }
    function L(t, e) {
      return t.map(function (t) {
        return e && t === A.Cookie ? { name: t, settings: e } : t
      })
    }
    var U = {
        persist: !0,
        cookie: { key: 'ajs_user_id', oldKey: 'ajs_user' },
        localStorage: { key: 'ajs_user_traits' },
      },
      B = (function () {
        function e(e, n) {
          void 0 === e && (e = U)
          var r,
            i,
            o,
            u,
            s = this
          ;(this.options = {}),
            (this.id = function (t) {
              if (s.options.disable) return null
              var e = s.identityStore.getAndSync(s.idKey)
              void 0 !== t &&
                (s.identityStore.set(s.idKey, t), t !== e && null !== e && null !== t && s.anonymousId(null))
              var n = s.identityStore.getAndSync(s.idKey)
              if (n) return n
              var r = s.legacyUserStore.get(U.cookie.oldKey)
              return r ? ('object' == typeof r ? r.id : r) : null
            }),
            (this.anonymousId = function (t) {
              var e, n
              if (s.options.disable) return null
              if (void 0 === t) {
                var r =
                  null !== (e = s.identityStore.getAndSync(s.anonKey)) && void 0 !== e
                    ? e
                    : null === (n = s.legacySIO()) || void 0 === n
                    ? void 0
                    : n[0]
                if (r) return r
              }
              return null === t
                ? (s.identityStore.set(s.anonKey, null), s.identityStore.getAndSync(s.anonKey))
                : (s.identityStore.set(s.anonKey, null != t ? t : (0, m.v4)()), s.identityStore.getAndSync(s.anonKey))
            }),
            (this.traits = function (t) {
              var e
              if (!s.options.disable)
                return (
                  null === t && (t = {}),
                  t && s.traitsStore.set(s.traitsKey, null != t ? t : {}),
                  null !== (e = s.traitsStore.get(s.traitsKey)) && void 0 !== e ? e : {}
                )
            }),
            (this.options = (0, t.pi)((0, t.pi)({}, U), e)),
            (this.cookieOptions = n),
            (this.idKey =
              null !== (i = null === (r = e.cookie) || void 0 === r ? void 0 : r.key) && void 0 !== i
                ? i
                : U.cookie.key),
            (this.traitsKey =
              null !== (u = null === (o = e.localStorage) || void 0 === o ? void 0 : o.key) && void 0 !== u
                ? u
                : U.localStorage.key),
            (this.anonKey = 'ajs_anonymous_id'),
            (this.identityStore = this.createStorage(this.options, n)),
            (this.legacyUserStore = this.createStorage(this.options, n, function (t) {
              return t === A.Cookie
            })),
            (this.traitsStore = this.createStorage(this.options, n, function (t) {
              return t !== A.Cookie
            }))
          var a = this.legacyUserStore.get(U.cookie.oldKey)
          a && 'object' == typeof a && (a.id && this.id(a.id), a.traits && this.traits(a.traits)), k(this)
        }
        return (
          (e.prototype.legacySIO = function () {
            var t = this.legacyUserStore.get('_sio')
            if (!t) return null
            var e = t.split('----')
            return [e[0], e[1]]
          }),
          (e.prototype.identify = function (e, n) {
            if (!this.options.disable) {
              n = null != n ? n : {}
              var r = this.id()
              ;(null !== r && r !== e) || (n = (0, t.pi)((0, t.pi)({}, this.traits()), n)),
                e && this.id(e),
                this.traits(n)
            }
          }),
          (e.prototype.logout = function () {
            this.anonymousId(null), this.id(null), this.traits({})
          }),
          (e.prototype.reset = function () {
            this.logout(),
              this.identityStore.clear(this.idKey),
              this.identityStore.clear(this.anonKey),
              this.traitsStore.clear(this.traitsKey)
          }),
          (e.prototype.load = function () {
            return new e(this.options, this.cookieOptions)
          }),
          (e.prototype.save = function () {
            return !0
          }),
          (e.prototype.createStorage = function (t, e, n) {
            var r = [A.LocalStorage, A.Cookie, A.Memory]
            return t.disable
              ? new M([])
              : t.persist
              ? (void 0 !== t.storage && null !== t.storage && F(t.storage) && (r = t.storage.stores),
                t.localStorageFallbackDisabled &&
                  (r = r.filter(function (t) {
                    return t !== A.LocalStorage
                  })),
                n && (r = r.filter(n)),
                new M(N(L(r, e))))
              : new M([new E()])
          }),
          (e.defaults = U),
          e
        )
      })(),
      R = { persist: !0, cookie: { key: 'ajs_group_id' }, localStorage: { key: 'ajs_group_properties' } },
      z = (function (e) {
        function n(n, r) {
          void 0 === n && (n = R)
          var i = e.call(this, (0, t.pi)((0, t.pi)({}, R), n), r) || this
          return (i.anonymousId = function (t) {}), k(i), i
        }
        return (0, t.ZT)(n, e), n
      })(B),
      K = u(4278),
      W = u(3744),
      Z = 'This is being deprecated and will be not be available in future releases of Analytics JS',
      H = (0, W.R)(),
      V = null == H ? void 0 : H.analytics
    function Y() {
      console.warn(Z)
    }
    var Q,
      $ = (function (e) {
        function n(n, r, i, o, u) {
          var s,
            a,
            c,
            l = this
          ;((l = e.call(this) || this)._debug = !1),
            (l.initialized = !1),
            (l.user = function () {
              return l._user
            }),
            (l.init = l.initialize.bind(l)),
            (l.log = Y),
            (l.addIntegrationMiddleware = Y),
            (l.listeners = Y),
            (l.addEventListener = Y),
            (l.removeAllListeners = Y),
            (l.removeListener = Y),
            (l.removeEventListener = Y),
            (l.hasListeners = Y),
            (l.add = Y),
            (l.addIntegration = Y)
          var f = null == r ? void 0 : r.cookie,
            p = null !== (s = null == r ? void 0 : r.disableClientPersistence) && void 0 !== s && s
          ;(l.settings = n),
            (l.settings.timeout = null !== (a = l.settings.timeout) && void 0 !== a ? a : 300),
            (l.queue =
              null != i
                ? i
                : (function (t, e, n) {
                    void 0 === e && (e = !1), void 0 === n && (n = !1)
                    var r = e ? 4 : 1,
                      i = n ? new S.Z(r, []) : new x.$(r, t)
                    return new O(i)
                  })(''.concat(n.writeKey, ':event-queue'), null == r ? void 0 : r.retryQueue, p))
          var d = null == r ? void 0 : r.storage
          return (
            (l._universalStorage = l.createStore(p, d, f)),
            (l._user =
              null != o
                ? o
                : new B(
                    (0, t.pi)({ persist: !p, storage: null == r ? void 0 : r.storage }, null == r ? void 0 : r.user),
                    f,
                  ).load()),
            (l._group =
              null != u
                ? u
                : new z(
                    (0, t.pi)({ persist: !p, storage: null == r ? void 0 : r.storage }, null == r ? void 0 : r.group),
                    f,
                  ).load()),
            (l.eventFactory = new _(l._user)),
            (l.integrations = null !== (c = null == r ? void 0 : r.integrations) && void 0 !== c ? c : {}),
            (l.options = null != r ? r : {}),
            k(l),
            l
          )
        }
        return (
          (0, t.ZT)(n, e),
          (n.prototype.createStore = function (t, e, n) {
            return t
              ? new M([new E()])
              : e && F(e)
              ? new M(N(L(e.stores, n)))
              : new M(N([A.LocalStorage, { name: A.Cookie, settings: n }, A.Memory]))
          }),
          Object.defineProperty(n.prototype, 'storage', {
            get: function () {
              return this._universalStorage
            },
            enumerable: !1,
            configurable: !0,
          }),
          (n.prototype.track = function () {
            for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            return (0, t.mG)(this, void 0, Promise, function () {
              var n,
                r,
                i,
                o,
                u,
                s,
                c = this
              return (0, t.Jh)(this, function (t) {
                return (
                  (n = a.apply(void 0, e)),
                  (r = n[0]),
                  (i = n[1]),
                  (o = n[2]),
                  (u = n[3]),
                  (s = this.eventFactory.track(r, i, o, this.integrations)),
                  [
                    2,
                    this._dispatch(s, u).then(function (t) {
                      return c.emit('track', r, t.event.properties, t.event.options), t
                    }),
                  ]
                )
              })
            })
          }),
          (n.prototype.page = function () {
            for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            return (0, t.mG)(this, void 0, Promise, function () {
              var n,
                r,
                i,
                o,
                u,
                s,
                a,
                l = this
              return (0, t.Jh)(this, function (t) {
                return (
                  (n = c.apply(void 0, e)),
                  (r = n[0]),
                  (i = n[1]),
                  (o = n[2]),
                  (u = n[3]),
                  (s = n[4]),
                  (a = this.eventFactory.page(r, i, o, u, this.integrations)),
                  [
                    2,
                    this._dispatch(a, s).then(function (t) {
                      return l.emit('page', r, i, t.event.properties, t.event.options), t
                    }),
                  ]
                )
              })
            })
          }),
          (n.prototype.identify = function () {
            for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            return (0, t.mG)(this, void 0, Promise, function () {
              var n,
                r,
                i,
                o,
                u,
                s,
                a = this
              return (0, t.Jh)(this, function (t) {
                return (
                  (n = l(this._user).apply(void 0, e)),
                  (r = n[0]),
                  (i = n[1]),
                  (o = n[2]),
                  (u = n[3]),
                  this._user.identify(r, i),
                  (s = this.eventFactory.identify(this._user.id(), this._user.traits(), o, this.integrations)),
                  [
                    2,
                    this._dispatch(s, u).then(function (t) {
                      return a.emit('identify', t.event.userId, t.event.traits, t.event.options), t
                    }),
                  ]
                )
              })
            })
          }),
          (n.prototype.group = function () {
            for (var t = this, e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            if (0 === e.length) return this._group
            var r = l(this._group).apply(void 0, e),
              i = r[0],
              o = r[1],
              u = r[2],
              s = r[3]
            this._group.identify(i, o)
            var a = this._group.id(),
              c = this._group.traits(),
              f = this.eventFactory.group(a, c, u, this.integrations)
            return this._dispatch(f, s).then(function (e) {
              return t.emit('group', e.event.groupId, e.event.traits, e.event.options), e
            })
          }),
          (n.prototype.alias = function () {
            for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            return (0, t.mG)(this, void 0, Promise, function () {
              var n,
                r,
                i,
                o,
                u,
                s,
                a = this
              return (0, t.Jh)(this, function (t) {
                return (
                  (n = f.apply(void 0, e)),
                  (r = n[0]),
                  (i = n[1]),
                  (o = n[2]),
                  (u = n[3]),
                  (s = this.eventFactory.alias(r, i, o, this.integrations)),
                  [
                    2,
                    this._dispatch(s, u).then(function (t) {
                      return a.emit('alias', r, i, t.event.options), t
                    }),
                  ]
                )
              })
            })
          }),
          (n.prototype.screen = function () {
            for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            return (0, t.mG)(this, void 0, Promise, function () {
              var n,
                r,
                i,
                o,
                u,
                s,
                a,
                l = this
              return (0, t.Jh)(this, function (t) {
                return (
                  (n = c.apply(void 0, e)),
                  (r = n[0]),
                  (i = n[1]),
                  (o = n[2]),
                  (u = n[3]),
                  (s = n[4]),
                  (a = this.eventFactory.screen(r, i, o, u, this.integrations)),
                  [
                    2,
                    this._dispatch(a, s).then(function (t) {
                      return l.emit('screen', r, i, t.event.properties, t.event.options), t
                    }),
                  ]
                )
              })
            })
          }),
          (n.prototype.trackClick = function () {
            for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            return (0, t.mG)(this, void 0, Promise, function () {
              var n, r
              return (0, t.Jh)(this, function (i) {
                switch (i.label) {
                  case 0:
                    return [4, u.e(119).then(u.bind(u, 1956))]
                  case 1:
                    return (n = i.sent()), [2, (r = n.link).call.apply(r, (0, t.ev)([this], e, !1))]
                }
              })
            })
          }),
          (n.prototype.trackLink = function () {
            for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            return (0, t.mG)(this, void 0, Promise, function () {
              var n, r
              return (0, t.Jh)(this, function (i) {
                switch (i.label) {
                  case 0:
                    return [4, u.e(119).then(u.bind(u, 1956))]
                  case 1:
                    return (n = i.sent()), [2, (r = n.link).call.apply(r, (0, t.ev)([this], e, !1))]
                }
              })
            })
          }),
          (n.prototype.trackSubmit = function () {
            for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            return (0, t.mG)(this, void 0, Promise, function () {
              var n, r
              return (0, t.Jh)(this, function (i) {
                switch (i.label) {
                  case 0:
                    return [4, u.e(119).then(u.bind(u, 1956))]
                  case 1:
                    return (n = i.sent()), [2, (r = n.form).call.apply(r, (0, t.ev)([this], e, !1))]
                }
              })
            })
          }),
          (n.prototype.trackForm = function () {
            for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            return (0, t.mG)(this, void 0, Promise, function () {
              var n, r
              return (0, t.Jh)(this, function (i) {
                switch (i.label) {
                  case 0:
                    return [4, u.e(119).then(u.bind(u, 1956))]
                  case 1:
                    return (n = i.sent()), [2, (r = n.form).call.apply(r, (0, t.ev)([this], e, !1))]
                }
              })
            })
          }),
          (n.prototype.register = function () {
            for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            return (0, t.mG)(this, void 0, Promise, function () {
              var n,
                r,
                i = this
              return (0, t.Jh)(this, function (t) {
                switch (t.label) {
                  case 0:
                    return (
                      (n = d._.system()),
                      (r = e.map(function (t) {
                        return i.queue.register(n, t, i)
                      })),
                      [4, Promise.all(r)]
                    )
                  case 1:
                    return t.sent(), [2, n]
                }
              })
            })
          }),
          (n.prototype.deregister = function () {
            for (var e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            return (0, t.mG)(this, void 0, Promise, function () {
              var n,
                r,
                i = this
              return (0, t.Jh)(this, function (t) {
                switch (t.label) {
                  case 0:
                    return (
                      (n = d._.system()),
                      (r = e.map(function (t) {
                        var e = i.queue.plugins.find(function (e) {
                          return e.name === t
                        })
                        if (e) return i.queue.deregister(n, e, i)
                        n.log('warn', 'plugin '.concat(t, ' not found'))
                      })),
                      [4, Promise.all(r)]
                    )
                  case 1:
                    return t.sent(), [2, n]
                }
              })
            })
          }),
          (n.prototype.debug = function (t) {
            return (
              !1 === t && localStorage.getItem('debug') && localStorage.removeItem('debug'), (this._debug = t), this
            )
          }),
          (n.prototype.reset = function () {
            this._user.reset(), this._group.reset(), this.emit('reset')
          }),
          (n.prototype.timeout = function (t) {
            this.settings.timeout = t
          }),
          (n.prototype._dispatch = function (e, n) {
            return (0, t.mG)(this, void 0, Promise, function () {
              var r
              return (0, t.Jh)(this, function (t) {
                return (
                  (r = new d._(e)),
                  (0, p.s)() && !this.options.retryQueue
                    ? [2, r]
                    : [2, v(r, this.queue, this, { callback: n, debug: this._debug, timeout: this.settings.timeout })]
                )
              })
            })
          }),
          (n.prototype.addSourceMiddleware = function (e) {
            return (0, t.mG)(this, void 0, Promise, function () {
              var n = this
              return (0, t.Jh)(this, function (r) {
                switch (r.label) {
                  case 0:
                    return [
                      4,
                      this.queue.criticalTasks.run(function () {
                        return (0, t.mG)(n, void 0, void 0, function () {
                          var n, r, i
                          return (0, t.Jh)(this, function (t) {
                            switch (t.label) {
                              case 0:
                                return [4, Promise.resolve().then(u.bind(u, 6338))]
                              case 1:
                                return (
                                  (n = t.sent().sourceMiddlewarePlugin),
                                  (r = {}),
                                  this.queue.plugins.forEach(function (t) {
                                    if ('destination' === t.type) return (r[t.name] = !0)
                                  }),
                                  (i = n(e, r)),
                                  [4, this.register(i)]
                                )
                              case 2:
                                return t.sent(), [2]
                            }
                          })
                        })
                      }),
                    ]
                  case 1:
                    return r.sent(), [2, this]
                }
              })
            })
          }),
          (n.prototype.addDestinationMiddleware = function (t) {
            for (var e = [], n = 1; n < arguments.length; n++) e[n - 1] = arguments[n]
            var r = this.queue.plugins.filter(function (e) {
              return e.name.toLowerCase() === t.toLowerCase()
            })
            return (
              r.forEach(function (t) {
                t.addMiddleware.apply(t, e)
              }),
              Promise.resolve(this)
            )
          }),
          (n.prototype.setAnonymousId = function (t) {
            return this._user.anonymousId(t)
          }),
          (n.prototype.queryString = function (e) {
            return (0, t.mG)(this, void 0, Promise, function () {
              return (0, t.Jh)(this, function (t) {
                switch (t.label) {
                  case 0:
                    return !1 === this.options.useQueryString ? [2, []] : [4, u.e(96).then(u.bind(u, 7473))]
                  case 1:
                    return [2, (0, t.sent().queryString)(this, e)]
                }
              })
            })
          }),
          (n.prototype.use = function (t) {
            return t(this), this
          }),
          (n.prototype.ready = function (e) {
            return (
              void 0 === e &&
                (e = function (t) {
                  return t
                }),
              (0, t.mG)(this, void 0, Promise, function () {
                return (0, t.Jh)(this, function (t) {
                  return [
                    2,
                    Promise.all(
                      this.queue.plugins.map(function (t) {
                        return t.ready ? t.ready() : Promise.resolve()
                      }),
                    ).then(function (t) {
                      return e(t), t
                    }),
                  ]
                })
              })
            )
          }),
          (n.prototype.noConflict = function () {
            return console.warn(Z), (window.analytics = null != V ? V : this), this
          }),
          (n.prototype.normalize = function (t) {
            return console.warn(Z), this.eventFactory.normalize(t)
          }),
          Object.defineProperty(n.prototype, 'failedInitializations', {
            get: function () {
              return console.warn(Z), this.queue.failedInitializations
            },
            enumerable: !1,
            configurable: !0,
          }),
          Object.defineProperty(n.prototype, 'VERSION', {
            get: function () {
              return K.i
            },
            enumerable: !1,
            configurable: !0,
          }),
          (n.prototype.initialize = function (e, n) {
            return (0, t.mG)(this, void 0, Promise, function () {
              return (0, t.Jh)(this, function (t) {
                return console.warn(Z), [2, Promise.resolve(this)]
              })
            })
          }),
          (n.prototype.pageview = function (e) {
            return (0, t.mG)(this, void 0, Promise, function () {
              return (0, t.Jh)(this, function (t) {
                switch (t.label) {
                  case 0:
                    return console.warn(Z), [4, this.page({ path: e })]
                  case 1:
                    return t.sent(), [2, this]
                }
              })
            })
          }),
          Object.defineProperty(n.prototype, 'plugins', {
            get: function () {
              var t
              return console.warn(Z), null !== (t = this._plugins) && void 0 !== t ? t : {}
            },
            enumerable: !1,
            configurable: !0,
          }),
          Object.defineProperty(n.prototype, 'Integrations', {
            get: function () {
              return (
                console.warn(Z),
                this.queue.plugins
                  .filter(function (t) {
                    return 'destination' === t.type
                  })
                  .reduce(function (t, e) {
                    var n = ''.concat(e.name.toLowerCase().replace('.', '').split(' ').join('-'), 'Integration'),
                      r = window[n]
                    if (!r) return t
                    var i = r.Integration
                    return i ? ((t[e.name] = i), t) : ((t[e.name] = r), t)
                  }, {})
              )
            },
            enumerable: !1,
            configurable: !0,
          }),
          (n.prototype.push = function (t) {
            var e = t.shift()
            ;(e && !this[e]) || this[e].apply(this, t)
          }),
          n
        )
      })(y.Q),
      X = u(5944),
      tt = u(6863)
    function et() {
      if (Q) return Q
      var t = J(window.location.href)
      return (Q = { expires: 31536e6, secure: !1, path: '/' }), t && (Q.domain = t), Q
    }
    function nt() {
      var t = document.querySelector("link[rel='canonical']")
      if (t) return t.getAttribute('href') || void 0
    }
    function rt() {
      var t = nt()
      if (!t) return window.location.pathname
      var e = document.createElement('a')
      return (e.href = t), e.pathname.startsWith('/') ? e.pathname : '/' + e.pathname
    }
    function it(t) {
      void 0 === t && (t = '')
      var e = nt()
      if (e) return e.includes('?') ? e : ''.concat(e).concat(t)
      var n = window.location.href,
        r = n.indexOf('#')
      return -1 === r ? n : n.slice(0, r)
    }
    var ot = function () {
        var e = this
        ;(this.name = 'Page Enrichment'),
          (this.type = 'before'),
          (this.version = '0.1.0'),
          (this.isLoaded = function () {
            return !0
          }),
          (this.load = function (t, n) {
            return (e.instance = n), Promise.resolve()
          }),
          (this.enrich = function (r) {
            var i,
              o,
              u,
              s,
              a,
              c,
              l = r.event,
              f = null !== (i = l.context) && void 0 !== i ? i : (l.context = {}),
              p = {
                path: rt(),
                referrer: document.referrer,
                search: location.search,
                title: document.title,
                url: it(location.search),
              }
            'page' === l.type &&
              ((s =
                l.properties &&
                ((a = l.properties),
                (c = Object.keys(p)),
                Object.assign.apply(
                  Object,
                  (0, t.ev)(
                    [{}],
                    c.map(function (t) {
                      var e
                      if (a && Object.prototype.hasOwnProperty.call(a, t)) return ((e = {})[t] = a[t]), e
                    }),
                    !1,
                  ),
                ))),
              (l.properties = (0, t.pi)((0, t.pi)((0, t.pi)({}, p), l.properties), l.name ? { name: l.name } : {}))),
              (f.page = (0, t.pi)((0, t.pi)((0, t.pi)({}, p), s), f.page))
            var d = f.page.search || ''
            f.userAgent = navigator.userAgent
            var h = navigator.userLanguage || navigator.language
            void 0 === f.locale && void 0 !== h && (f.locale = h),
              (null !== (o = f.library) && void 0 !== o) ||
                (f.library = {
                  name: 'analytics.js',
                  version: ''.concat('web' === (0, n.B)() ? 'next' : 'npm:next', '-').concat(K.i),
                }),
              d &&
                !f.campaign &&
                (f.campaign = (function (t) {
                  return (
                    t.startsWith('?') && (t = t.substring(1)),
                    (t = t.replace(/\?/g, '&')).split('&').reduce(function (t, e) {
                      var n = e.split('='),
                        r = n[0],
                        i = n[1],
                        o = void 0 === i ? '' : i
                      if (r.includes('utm_') && r.length > 4) {
                        var u = r.substr(4)
                        'campaign' === u && (u = 'name'), (t[u] = (0, tt.a)(o))
                      }
                      return t
                    }, {})
                  )
                })(d))
            var v = (function () {
              var t = T.get('_ga')
              if (t && t.startsWith('amp')) return t
            })()
            return (
              v && (f.amp = { id: v }),
              (function (e, n, r) {
                var i,
                  o = new M(r ? [] : [new G(et())]),
                  u = o.get('s:context.referrer'),
                  s =
                    null !==
                      (i = (function (t) {
                        var e = { btid: 'dataxu', urid: 'millennial-media' }
                        t.startsWith('?') && (t = t.substring(1))
                        for (var n = 0, r = (t = t.replace(/\?/g, '&')).split('&'); n < r.length; n++) {
                          var i = r[n].split('='),
                            o = i[0],
                            u = i[1]
                          if (e[o]) return { id: u, type: e[o] }
                        }
                      })(e)) && void 0 !== i
                      ? i
                      : u
                s && (n && (n.referrer = (0, t.pi)((0, t.pi)({}, n.referrer), s)), o.set('s:context.referrer', s))
              })(d, f, null !== (u = e.instance.options.disableClientPersistence) && void 0 !== u && u),
              r
            )
          }),
          (this.track = this.enrich),
          (this.identify = this.enrich),
          (this.page = this.enrich),
          (this.group = this.enrich),
          (this.alias = this.enrich),
          (this.screen = this.enrich)
      },
      ut = new ot(),
      st = u(7070),
      at = u(6338),
      ct = (function () {
        function e(t, e) {
          ;(this.version = '1.0.0'),
            (this.alternativeNames = []),
            (this.middleware = []),
            (this.alias = this._createMethod('alias')),
            (this.group = this._createMethod('group')),
            (this.identify = this._createMethod('identify')),
            (this.page = this._createMethod('page')),
            (this.screen = this._createMethod('screen')),
            (this.track = this._createMethod('track')),
            (this.action = e),
            (this.name = t),
            (this.type = e.type),
            this.alternativeNames.push(e.name)
        }
        return (
          (e.prototype.addMiddleware = function () {
            for (var t, e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            'destination' === this.type && (t = this.middleware).push.apply(t, e)
          }),
          (e.prototype.transform = function (e) {
            return (0, t.mG)(this, void 0, Promise, function () {
              var n
              return (0, t.Jh)(this, function (t) {
                switch (t.label) {
                  case 0:
                    return [4, (0, at.applyDestinationMiddleware)(this.name, e.event, this.middleware)]
                  case 1:
                    return (
                      null === (n = t.sent()) &&
                        e.cancel(new j.Y({ retry: !1, reason: 'dropped by destination middleware' })),
                      [2, new d._(n)]
                    )
                }
              })
            })
          }),
          (e.prototype._createMethod = function (e) {
            var n = this
            return function (r) {
              return (0, t.mG)(n, void 0, Promise, function () {
                var n
                return (0, t.Jh)(this, function (t) {
                  switch (t.label) {
                    case 0:
                      return this.action[e]
                        ? ((n = r), 'destination' !== this.type ? [3, 2] : [4, this.transform(r)])
                        : [2, r]
                    case 1:
                      ;(n = t.sent()), (t.label = 2)
                    case 2:
                      return [4, this.action[e](n)]
                    case 3:
                      return t.sent(), [2, r]
                  }
                })
              })
            }
          }),
          (e.prototype.isLoaded = function () {
            return this.action.isLoaded()
          }),
          (e.prototype.ready = function () {
            return this.action.ready ? this.action.ready() : Promise.resolve()
          }),
          (e.prototype.load = function (t, e) {
            return this.action.load(t, e)
          }),
          (e.prototype.unload = function (t, e) {
            var n, r
            return null === (r = (n = this.action).unload) || void 0 === r ? void 0 : r.call(n, t, e)
          }),
          e
        )
      })()
    function lt(n, r) {
      return (0, t.mG)(this, void 0, Promise, function () {
        var i, o, u, s, a
        return (0, t.Jh)(this, function (t) {
          switch (t.label) {
            case 0:
              if (((i = new RegExp('https://cdn.segment.(com|build)')), (o = (0, e.Vl)()), !r)) return [3, 6]
              ;(u = n.url.split('/')),
                (s = u[u.length - 2]),
                (a = n.url.replace(s, btoa(s).replace(/=/g, ''))),
                (t.label = 1)
            case 1:
              return t.trys.push([1, 3, , 5]), [4, (0, st.v)(a.replace(i, o))]
            case 2:
              return t.sent(), [3, 5]
            case 3:
              return t.sent(), [4, (0, st.v)(n.url.replace(i, o))]
            case 4:
              return t.sent(), [3, 5]
            case 5:
              return [3, 8]
            case 6:
              return [4, (0, st.v)(n.url.replace(i, o))]
            case 7:
              t.sent(), (t.label = 8)
            case 8:
              return 'function' == typeof window[n.libraryName] ? [2, window[n.libraryName]] : [2]
          }
        })
      })
    }
    function ft(e, n, r, i, o, u) {
      var s, a, c
      return (0, t.mG)(this, void 0, Promise, function () {
        var l,
          f,
          p,
          d = this
        return (0, t.Jh)(this, function (h) {
          switch (h.label) {
            case 0:
              return (
                (l = []),
                (f =
                  null !== (a = null === (s = e.middlewareSettings) || void 0 === s ? void 0 : s.routingRules) &&
                  void 0 !== a
                    ? a
                    : []),
                (p = (null !== (c = e.remotePlugins) && void 0 !== c ? c : []).map(function (e) {
                  return (0, t.mG)(d, void 0, void 0, function () {
                    var s, a, c, p, d, h
                    return (0, t.Jh)(this, function (v) {
                      switch (v.label) {
                        case 0:
                          if (
                            (function (t, e) {
                              var n = t[e.creationName],
                                r = t[e.name]
                              return (!1 === t.All && !n && !r) || !1 === n || !1 === r
                            })(n, e)
                          )
                            return [2]
                          v.label = 1
                        case 1:
                          return (
                            v.trys.push([1, 6, , 7]),
                            (a =
                              null == u
                                ? void 0
                                : u.find(function (t) {
                                    return t.pluginName === e.name
                                  }))
                              ? [3, 3]
                              : [4, lt(e, i)]
                          )
                        case 2:
                          ;(a = v.sent()), (v.label = 3)
                        case 3:
                          return (s = a) ? [4, s((0, t.pi)((0, t.pi)({}, e.settings), r[e.name]))] : [3, 5]
                        case 4:
                          ;(c = v.sent()),
                            (function (t) {
                              if (!Array.isArray(t)) throw new Error('Not a valid list of plugins')
                              var e = ['load', 'isLoaded', 'name', 'version', 'type']
                              t.forEach(function (t) {
                                e.forEach(function (e) {
                                  var n
                                  if (void 0 === t[e])
                                    throw new Error(
                                      'Plugin: '
                                        .concat(
                                          null !== (n = t.name) && void 0 !== n ? n : 'unknown',
                                          ' missing required function ',
                                        )
                                        .concat(e),
                                    )
                                })
                              })
                            })((p = Array.isArray(c) ? c : [c])),
                            (d = f.filter(function (t) {
                              return t.destinationName === e.creationName
                            })),
                            p.forEach(function (t) {
                              var n = new ct(e.creationName, t)
                              d.length && o && 'destination' === t.type && n.addMiddleware(o), l.push(n)
                            }),
                            (v.label = 5)
                        case 5:
                          return [3, 7]
                        case 6:
                          return (h = v.sent()), console.warn('Failed to load Remote Plugin', h), [3, 7]
                        case 7:
                          return [2]
                      }
                    })
                  })
                })),
                [4, Promise.all(p)]
              )
            case 1:
              return h.sent(), [2, l.filter(Boolean)]
          }
        })
      })
    }
    var pt = u(9950)
    function dt(t) {
      return (encodeURI(JSON.stringify(t)).split(/%..|./).length - 1) / 1024
    }
    function ht(e, n) {
      var r,
        o,
        u,
        s,
        a,
        c = [],
        l = !1,
        f = null !== (r = null == n ? void 0 : n.size) && void 0 !== r ? r : 10,
        p = null !== (o = null == n ? void 0 : n.timeout) && void 0 !== o ? o : 5e3
      function d(n) {
        var r
        if (0 !== n.length) {
          var o = null === (r = n[0]) || void 0 === r ? void 0 : r.writeKey,
            u = n.map(function (e) {
              var n = e
              n.sentAt
              return (0, t._T)(n, ['sentAt'])
            })
          return (0, i.h)('https://'.concat(e, '/b'), {
            keepalive: l,
            headers: { 'Content-Type': 'text/plain' },
            method: 'post',
            body: JSON.stringify({ writeKey: o, batch: u, sentAt: new Date().toISOString() }),
          })
        }
      }
      function h() {
        return (0, t.mG)(this, void 0, Promise, function () {
          var e
          return (0, t.Jh)(this, function (t) {
            return c.length ? ((e = c), (c = []), [2, d(e)]) : [2]
          })
        })
      }
      return (
        (s = function (t) {
          if ((l = t) && c.length) {
            var e = (function (t) {
              var e = [],
                n = 0
              return (
                t.forEach(function (t) {
                  dt(e[n]) >= 64 && n++, e[n] ? e[n].push(t) : (e[n] = [t])
                }),
                e
              )
            })(c).map(d)
            Promise.all(e).catch(console.error)
          }
        }),
        (a = !1),
        window.addEventListener('pagehide', function () {
          a || s((a = !0))
        }),
        document.addEventListener('visibilitychange', function () {
          if ('hidden' == document.visibilityState) {
            if (a) return
            a = !0
          } else a = !1
          s(a)
        }),
        {
          dispatch: function (e, n) {
            return (0, t.mG)(this, void 0, Promise, function () {
              var e
              return (0, t.Jh)(this, function (t) {
                return (
                  c.push(n),
                  (e =
                    c.length >= f ||
                    (function (t) {
                      return dt(t) >= 450
                    })(c)),
                  [
                    2,
                    e || l
                      ? h()
                      : void (
                          u ||
                          (u = setTimeout(function () {
                            ;(u = void 0), h().catch(console.error)
                          }, p))
                        ),
                  ]
                )
              })
            })
          },
        }
      )
    }
    function vt(e, n, r, i) {
      var o,
        u = e.user()
      delete n.options,
        (n.writeKey = null == r ? void 0 : r.apiKey),
        (n.userId = n.userId || u.id()),
        (n.anonymousId = n.anonymousId || u.anonymousId()),
        (n.sentAt = new Date())
      var s = e.queue.failedInitializations || []
      s.length > 0 && (n._metadata = { failedInitializations: s })
      var a = [],
        c = []
      for (var l in i) {
        var f = i[l]
        'Segment.io' === l && a.push(l),
          'bundled' === f.bundlingStatus && a.push(l),
          'unbundled' === f.bundlingStatus && c.push(l)
      }
      for (var p = 0, d = (null == r ? void 0 : r.unbundledIntegrations) || []; p < d.length; p++) {
        var h = d[p]
        c.includes(h) || c.push(h)
      }
      var v = null !== (o = null == r ? void 0 : r.maybeBundledConfigIds) && void 0 !== o ? o : {},
        y = []
      return (
        a.sort().forEach(function (t) {
          var e
          ;(null !== (e = v[t]) && void 0 !== e ? e : []).forEach(function (t) {
            y.push(t)
          })
        }),
        !1 !== (null == r ? void 0 : r.addBundledMetadata) &&
          (n._metadata = (0, t.pi)((0, t.pi)({}, n._metadata), {
            bundled: a.sort(),
            unbundled: c.sort(),
            bundledIds: y,
          })),
        n
      )
    }
    var yt = u(8044)
    function mt(e, n) {
      return (0, t.mG)(this, void 0, Promise, function () {
        var r,
          i = this
        return (0, t.Jh)(this, function (o) {
          switch (o.label) {
            case 0:
              return (
                (r = []),
                (0, p.s)()
                  ? [2, n]
                  : [
                      4,
                      (0, yt.x)(
                        function () {
                          return n.length > 0 && !(0, p.s)()
                        },
                        function () {
                          return (0, t.mG)(i, void 0, void 0, function () {
                            var i, o
                            return (0, t.Jh)(this, function (t) {
                              switch (t.label) {
                                case 0:
                                  return (i = n.pop()) ? [4, (0, P.a)(i, e)] : [2]
                                case 1:
                                  return (o = t.sent()), o instanceof d._ || r.push(i), [2]
                              }
                            })
                          })
                        },
                      ),
                    ]
              )
            case 1:
              return (
                o.sent(),
                r.map(function (t) {
                  return n.pushWithBackoff(t)
                }),
                [2, n]
              )
          }
        })
      })
    }
    function gt(e, n, r, i) {
      var o = this
      e ||
        setTimeout(function () {
          return (0, t.mG)(o, void 0, void 0, function () {
            var e, o
            return (0, t.Jh)(this, function (t) {
              switch (t.label) {
                case 0:
                  return (e = !0), [4, mt(r, n)]
                case 1:
                  return (o = t.sent()), (e = !1), n.todo > 0 && i(e, o, r, i), [2]
              }
            })
          })
        }, 5e3 * Math.random())
    }
    var bt = u(4328)
    function wt(e) {
      return (0, t.mG)(this, void 0, Promise, function () {
        var n
        return (0, t.Jh)(this, function (t) {
          return (n = navigator.userAgentData)
            ? e
              ? [
                  2,
                  n.getHighEntropyValues(e).catch(function () {
                    return n.toJSON()
                  }),
                ]
              : [2, n.toJSON()]
            : [2, void 0]
        })
      })
    }
    function _t(e, n, r) {
      var o, u, s
      return (0, t.mG)(this, void 0, Promise, function () {
        function a(i) {
          return (0, t.mG)(this, void 0, Promise, function () {
            var o, u
            return (0, t.Jh)(this, function (t) {
              return (0, p.s)()
                ? (l.push(i), gt(d, l, w, gt), [2, i])
                : (f.add(i),
                  (o = i.event.type.charAt(0)),
                  b && i.event.context && (i.event.context.userAgentData = b),
                  (u = (0, pt.D)(i.event).json()),
                  'track' === i.event.type && delete u.traits,
                  'alias' === i.event.type &&
                    (u = (function (t, e) {
                      var n,
                        r,
                        i,
                        o,
                        u = t.user()
                      return (
                        (e.previousId =
                          null !==
                            (i =
                              null !== (r = null !== (n = e.previousId) && void 0 !== n ? n : e.from) && void 0 !== r
                                ? r
                                : u.id()) && void 0 !== i
                            ? i
                            : u.anonymousId()),
                        (e.userId = null !== (o = e.userId) && void 0 !== o ? o : e.to),
                        delete e.from,
                        delete e.to,
                        e
                      )
                    })(e, u)),
                  [
                    2,
                    g
                      .dispatch(''.concat(y, '/').concat(o), vt(e, u, n, r))
                      .then(function () {
                        return i
                      })
                      .catch(function () {
                        return l.pushWithBackoff(i), gt(d, l, w, gt), i
                      })
                      .finally(function () {
                        f.delete(i)
                      }),
                  ])
            })
          })
        }
        var c, l, f, d, h, v, y, m, g, b, w
        return (0, t.Jh)(this, function (t) {
          switch (t.label) {
            case 0:
              window.addEventListener('pagehide', function () {
                l.push.apply(l, Array.from(f)), f.clear()
              }),
                (c = null !== (o = null == n ? void 0 : n.apiKey) && void 0 !== o ? o : ''),
                (l = e.options.disableClientPersistence
                  ? new S.Z(e.queue.queue.maxAttempts, [])
                  : new x.$(e.queue.queue.maxAttempts, ''.concat(c, ':dest-Segment.io'))),
                (f = new Set()),
                (d = !1),
                (h = null !== (u = null == n ? void 0 : n.apiHost) && void 0 !== u ? u : bt.U),
                (v = null !== (s = null == n ? void 0 : n.protocol) && void 0 !== s ? s : 'https'),
                (y = ''.concat(v, '://').concat(h)),
                (m = null == n ? void 0 : n.deliveryStrategy),
                (g =
                  'batching' === (null == m ? void 0 : m.strategy)
                    ? ht(h, m.config)
                    : ((r = null == m ? void 0 : m.config),
                      {
                        dispatch: function (t, e) {
                          return (0, i.h)(t, {
                            keepalive: null == r ? void 0 : r.keepalive,
                            headers: { 'Content-Type': 'text/plain' },
                            method: 'post',
                            body: JSON.stringify(e),
                          })
                        },
                      })),
                (t.label = 1)
            case 1:
              return t.trys.push([1, 3, , 4]), [4, wt(e.options.highEntropyValuesClientHints)]
            case 2:
              return (b = t.sent()), [3, 4]
            case 3:
              return t.sent(), (b = void 0), [3, 4]
            case 4:
              return (
                (w = {
                  name: 'Segment.io',
                  type: 'after',
                  version: '0.1.0',
                  isLoaded: function () {
                    return !0
                  },
                  load: function () {
                    return Promise.resolve()
                  },
                  track: a,
                  identify: a,
                  page: a,
                  alias: a,
                  group: a,
                  screen: a,
                }),
                l.todo && gt(d, l, w, gt),
                [2, w]
              )
          }
          var r
        })
      })
    }
    var xt = (function (e) {
        function n(t, n) {
          var r = e.call(this, ''.concat(t, ' ').concat(n)) || this
          return (r.field = t), r
        }
        return (0, t.ZT)(n, e), n
      })(Error),
      St = 'is not a string',
      jt = 'is not an object',
      Pt = 'is nil'
    function It(t) {
      var e = '.userId/anonymousId/previousId/groupId',
        n = (function (t) {
          var e, n, r
          return null !==
            (r =
              null !== (n = null !== (e = t.userId) && void 0 !== e ? e : t.anonymousId) && void 0 !== n
                ? n
                : t.groupId) && void 0 !== r
            ? r
            : t.previousId
        })(t)
      if (!(0, o.Gg)(n)) throw new xt(e, Pt)
      if (!(0, o.HD)(n)) throw new xt(e, St)
    }
    function Ot(t) {
      if (!(0, o.Gg)(t)) throw new xt('Event', Pt)
      if ('object' != typeof t) throw new xt('Event', jt)
    }
    function kt(t) {
      if (!(0, o.HD)(t.type)) throw new xt('.type', St)
    }
    function At(t) {
      if (!(0, o.HD)(t.event)) throw new xt('.event', St)
    }
    function Mt(t) {
      var e,
        n = t.event
      Ot(n), kt(n), 'track' === n.type && At(n)
      var r = null !== (e = n.properties) && void 0 !== e ? e : n.traits
      if ('alias' !== n.type && !(0, o.PO)(r)) throw new xt('.properties', 'is not an object')
      return It(n), t
    }
    var Et = {
        name: 'Event Validation',
        type: 'before',
        version: '1.0.0',
        isLoaded: function () {
          return !0
        },
        load: function () {
          return Promise.resolve()
        },
        track: Mt,
        identify: Mt,
        page: Mt,
        alias: Mt,
        group: Mt,
        screen: Mt,
      },
      Ft = function (t, e, n) {
        n.getCalls(t).forEach(function (t) {
          Gt(e, t).catch(console.error)
        })
      },
      Dt = function (e, n) {
        return (0, t.mG)(void 0, void 0, void 0, function () {
          var r, i, o
          return (0, t.Jh)(this, function (t) {
            switch (t.label) {
              case 0:
                ;(r = 0), (i = n.getCalls('addSourceMiddleware')), (t.label = 1)
              case 1:
                return r < i.length ? ((o = i[r]), [4, Gt(e, o).catch(console.error)]) : [3, 4]
              case 2:
                t.sent(), (t.label = 3)
              case 3:
                return r++, [3, 1]
              case 4:
                return [2]
            }
          })
        })
      },
      Ct = Ft.bind(void 0, 'on'),
      Tt = Ft.bind(void 0, 'setAnonymousId'),
      Jt = (function () {
        function t() {
          this._value = {}
        }
        return (
          (t.prototype.toArray = function () {
            var t
            return (t = []).concat.apply(t, Object.values(this._value))
          }),
          (t.prototype.getCalls = function (t) {
            var e
            return null !== (e = this._value[t]) && void 0 !== e ? e : []
          }),
          (t.prototype.push = function () {
            for (var t = this, e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
            return (
              e.forEach(function (e) {
                t._value[e.method] ? t._value[e.method].push(e) : (t._value[e.method] = [e])
              }),
              this
            )
          }),
          (t.prototype.clear = function () {
            return (this._value = {}), this
          }),
          t
        )
      })()
    function Gt(e, n) {
      return (0, t.mG)(this, void 0, Promise, function () {
        var r, i
        return (0, t.Jh)(this, function (t) {
          switch (t.label) {
            case 0:
              return (
                t.trys.push([0, 3, , 4]),
                n.called
                  ? [2, void 0]
                  : ((n.called = !0),
                    (r = e[n.method].apply(e, n.args)),
                    'object' == typeof (o = r) && null !== o && 'then' in o && 'function' == typeof o.then
                      ? [4, r]
                      : [3, 2])
              )
            case 1:
              t.sent(), (t.label = 2)
            case 2:
              return n.resolve(r), [3, 4]
            case 3:
              return (i = t.sent()), n.reject(i), [3, 4]
            case 4:
              return [2]
          }
          var o
        })
      })
    }
    var qt = (function () {
      function t(t) {
        var e = this
        ;(this._preInitBuffer = new Jt()),
          (this.trackSubmit = this._createMethod('trackSubmit')),
          (this.trackClick = this._createMethod('trackClick')),
          (this.trackLink = this._createMethod('trackLink')),
          (this.pageView = this._createMethod('pageview')),
          (this.identify = this._createMethod('identify')),
          (this.reset = this._createMethod('reset')),
          (this.group = this._createMethod('group')),
          (this.track = this._createMethod('track')),
          (this.ready = this._createMethod('ready')),
          (this.alias = this._createMethod('alias')),
          (this.debug = this._createChainableMethod('debug')),
          (this.page = this._createMethod('page')),
          (this.once = this._createChainableMethod('once')),
          (this.off = this._createChainableMethod('off')),
          (this.on = this._createChainableMethod('on')),
          (this.addSourceMiddleware = this._createMethod('addSourceMiddleware')),
          (this.setAnonymousId = this._createMethod('setAnonymousId')),
          (this.addDestinationMiddleware = this._createMethod('addDestinationMiddleware')),
          (this.screen = this._createMethod('screen')),
          (this.register = this._createMethod('register')),
          (this.deregister = this._createMethod('deregister')),
          (this.user = this._createMethod('user')),
          (this.VERSION = K.i),
          (this._promise = t(this._preInitBuffer)),
          this._promise
            .then(function (t) {
              var n = t[0],
                r = t[1]
              ;(e.instance = n), (e.ctx = r)
            })
            .catch(function () {})
      }
      return (
        (t.prototype.then = function () {
          for (var t, e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
          return (t = this._promise).then.apply(t, e)
        }),
        (t.prototype.catch = function () {
          for (var t, e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
          return (t = this._promise).catch.apply(t, e)
        }),
        (t.prototype.finally = function () {
          for (var t, e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n]
          return (t = this._promise).finally.apply(t, e)
        }),
        (t.prototype._createMethod = function (t) {
          var e = this
          return function () {
            for (var n, r = [], i = 0; i < arguments.length; i++) r[i] = arguments[i]
            if (e.instance) {
              var o = (n = e.instance)[t].apply(n, r)
              return Promise.resolve(o)
            }
            return new Promise(function (n, i) {
              e._preInitBuffer.push({ method: t, args: r, resolve: n, reject: i, called: !1 })
            })
          }
        }),
        (t.prototype._createChainableMethod = function (t) {
          var e = this
          return function () {
            for (var n, r = [], i = 0; i < arguments.length; i++) r[i] = arguments[i]
            return e.instance
              ? ((n = e.instance)[t].apply(n, r), e)
              : (e._preInitBuffer.push({
                  method: t,
                  args: r,
                  resolve: function () {},
                  reject: console.error,
                  called: !1,
                }),
                e)
          }
        }),
        t
      )
    })()
    function Nt(t) {
      var e = t[0],
        n = t.slice(1)
      return { method: e, resolve: function () {}, reject: console.error, args: n, called: !1 }
    }
    var Lt,
      Ut,
      Bt = function () {
        var t = window.analytics
        if (!Array.isArray(t)) return []
        var e = t.splice(0, t.length)
        return e.map(Nt)
      },
      Rt =
        null !== (Lt = (Ut = (0, W.R)()).__SEGMENT_INSPECTOR__) && void 0 !== Lt ? Lt : (Ut.__SEGMENT_INSPECTOR__ = {}),
      zt = u(6218)
    function Kt(e, n) {
      return (0, t.mG)(this, void 0, Promise, function () {
        return (0, t.Jh)(this, function (t) {
          switch (t.label) {
            case 0:
              return n.push.apply(n, Bt()), [4, Dt(e, n)]
            case 1:
              return (
                t.sent(),
                n.push.apply(n, Bt()),
                (function (t, e) {
                  e.toArray().forEach(function (e) {
                    setTimeout(function () {
                      Gt(t, e).catch(console.error)
                    }, 0)
                  })
                })(e, n),
                n.clear(),
                [2]
              )
          }
        })
      })
    }
    function Wt(e, n, i, o, s, a, c) {
      var l, f, p
      return (
        void 0 === a && (a = []),
        (0, t.mG)(this, void 0, Promise, function () {
          var d,
            h,
            v,
            y,
            m,
            g,
            b,
            w,
            _,
            x,
            S,
            j,
            P,
            I,
            O = this
          return (0, t.Jh)(this, function (k) {
            switch (k.label) {
              case 0:
                return (
                  (d =
                    null == a
                      ? void 0
                      : a.filter(function (t) {
                          return 'object' == typeof t
                        })),
                  (h =
                    null == a
                      ? void 0
                      : a.filter(function (t) {
                          return 'function' == typeof t && 'string' == typeof t.pluginName
                        })),
                  (function (t) {
                    var e, n, i
                    return (
                      'test' !== r().NODE_ENV &&
                      (null !==
                        (i =
                          null ===
                            (n = null === (e = t.middlewareSettings) || void 0 === e ? void 0 : e.routingRules) ||
                          void 0 === n
                            ? void 0
                            : n.length) && void 0 !== i
                        ? i
                        : 0) > 0
                    )
                  })(n)
                    ? [
                        4,
                        Promise.all([u.e(870), u.e(604)])
                          .then(u.bind(u, 669))
                          .then(function (t) {
                            return t.tsubMiddleware(n.middlewareSettings.routingRules)
                          }),
                      ]
                    : [3, 2]
                )
              case 1:
                return (y = k.sent()), [3, 3]
              case 2:
                ;(y = void 0), (k.label = 3)
              case 3:
                return (
                  (v = y),
                  (A = n),
                  ('test' !== r().NODE_ENV && Object.keys(A.integrations).length > 1) || c.length > 0
                    ? [
                        4,
                        u
                          .e(464)
                          .then(u.bind(u, 3162))
                          .then(function (t) {
                            return t.ajsDestinations(e, n, i.integrations, o, v, c)
                          }),
                      ]
                    : [3, 5]
                )
              case 4:
                return (g = k.sent()), [3, 6]
              case 5:
                ;(g = []), (k.label = 6)
              case 6:
                return (
                  (m = g),
                  n.legacyVideoPluginsEnabled
                    ? [
                        4,
                        u
                          .e(150)
                          .then(u.bind(u, 9141))
                          .then(function (t) {
                            return t.loadLegacyVideoPlugins(i)
                          }),
                      ]
                    : [3, 8]
                )
              case 7:
                k.sent(), (k.label = 8)
              case 8:
                return (null === (l = o.plan) || void 0 === l ? void 0 : l.track)
                  ? [
                      4,
                      u
                        .e(493)
                        .then(u.bind(u, 5081))
                        .then(function (t) {
                          var e
                          return t.schemaFilter(null === (e = o.plan) || void 0 === e ? void 0 : e.track, n)
                        }),
                    ]
                  : [3, 10]
              case 9:
                return (w = k.sent()), [3, 11]
              case 10:
                ;(w = void 0), (k.label = 11)
              case 11:
                return (
                  (b = w),
                  (_ = (0, X.o)(n, s)),
                  [
                    4,
                    ft(n, i.integrations, _, s.obfuscate, v, h).catch(function () {
                      return []
                    }),
                  ]
                )
              case 12:
                return (
                  (x = k.sent()),
                  (S = (0, t.ev)((0, t.ev)((0, t.ev)([Et, ut], d, !0), m, !0), x, !0)),
                  b && S.push(b),
                  (!1 === (null === (f = o.integrations) || void 0 === f ? void 0 : f.All) &&
                    !o.integrations['Segment.io']) ||
                  (o.integrations && !1 === o.integrations['Segment.io'])
                    ? [3, 14]
                    : ((P = (j = S).push), [4, _t(i, _['Segment.io'], n.integrations)])
                )
              case 13:
                P.apply(j, [k.sent()]), (k.label = 14)
              case 14:
                return [4, i.register.apply(i, S)]
              case 15:
                return (
                  (I = k.sent()),
                  Object.entries(null !== (p = n.enabledMiddleware) && void 0 !== p ? p : {}).some(function (t) {
                    return t[1]
                  })
                    ? [
                        4,
                        u
                          .e(214)
                          .then(u.bind(u, 9568))
                          .then(function (e) {
                            var r = e.remoteMiddlewares
                            return (0, t.mG)(O, void 0, void 0, function () {
                              var e, o
                              return (0, t.Jh)(this, function (t) {
                                switch (t.label) {
                                  case 0:
                                    return [4, r(I, n, s.obfuscate)]
                                  case 1:
                                    return (
                                      (e = t.sent()),
                                      (o = e.map(function (t) {
                                        return i.addSourceMiddleware(t)
                                      })),
                                      [2, Promise.all(o)]
                                    )
                                }
                              })
                            })
                          }),
                      ]
                    : [3, 17]
                )
              case 16:
                k.sent(), (k.label = 17)
              case 17:
                return [2, I]
            }
            var A
          })
        })
      )
    }
    function Zt(n, r, o) {
      var u, s, a, c, l, f, p
      return (
        void 0 === r && (r = {}),
        (0, t.mG)(this, void 0, Promise, function () {
          var d, h, v, y, m, g, b, w, _, x, S
          return (0, t.Jh)(this, function (j) {
            switch (j.label) {
              case 0:
                return (
                  n.cdnURL && (0, e.UH)(n.cdnURL),
                  null === (u = n.cdnSettings) || void 0 === u ? [3, 1] : ((h = u), [3, 3])
                )
              case 1:
                return [
                  4,
                  ((P = n.writeKey),
                  (I = n.cdnURL),
                  (O = null != I ? I : (0, e.Vl)()),
                  (0, i.h)(''.concat(O, '/v1/projects/').concat(P, '/settings'))
                    .then(function (t) {
                      return t.ok
                        ? t.json()
                        : t.text().then(function (t) {
                            throw new Error(t)
                          })
                    })
                    .catch(function (t) {
                      throw (console.error(t.message), t)
                    })),
                ]
              case 2:
                ;(h = j.sent()), (j.label = 3)
              case 3:
                return (
                  (d = h),
                  r.updateCDNSettings && (d = r.updateCDNSettings(d)),
                  (v =
                    null ===
                      (a = null === (s = d.integrations['Segment.io']) || void 0 === s ? void 0 : s.retryQueue) ||
                    void 0 === a ||
                    a),
                  (y = (0, t.pi)({ retryQueue: v }, r)),
                  (function (t) {
                    var e
                    null === (e = Rt.attach) || void 0 === e || e.call(Rt, t)
                  })((m = new $(n, y))),
                  (g = null !== (c = n.plugins) && void 0 !== c ? c : []),
                  (b = null !== (l = n.classicIntegrations) && void 0 !== l ? l : []),
                  zt.j.initRemoteMetrics(d.metrics),
                  (function (t, e) {
                    e.push.apply(e, Bt()), Tt(t, e), Ct(t, e)
                  })(m, o),
                  [4, Wt(n.writeKey, d, m, y, r, g, b)]
                )
              case 4:
                return (
                  (w = j.sent()),
                  (_ = null !== (f = window.location.search) && void 0 !== f ? f : ''),
                  (x = null !== (p = window.location.hash) && void 0 !== p ? p : ''),
                  (S = _.length ? _ : x.replace(/(?=#).*(?=\?)/, '')).includes('ajs_')
                    ? [4, m.queryString(S).catch(console.error)]
                    : [3, 6]
                )
              case 5:
                j.sent(), (j.label = 6)
              case 6:
                return (
                  (m.initialized = !0),
                  m.emit('initialize', n, r),
                  r.initialPageview && m.page().catch(console.error),
                  [4, Kt(m, o)]
                )
              case 7:
                return j.sent(), [2, [m, w]]
            }
            var P, I, O
          })
        })
      )
    }
    var Ht = (function (e) {
        function n() {
          var t,
            n,
            r,
            i = this,
            o =
              ((r = new Promise(function (e, r) {
                ;(t = e), (n = r)
              })),
              { resolve: t, reject: n, promise: r }),
            u = o.promise,
            s = o.resolve
          return (
            (i =
              e.call(this, function (t) {
                return u.then(function (e) {
                  return Zt(e[0], e[1], t)
                })
              }) || this),
            (i._resolveLoadStart = function (t, e) {
              return s([t, e])
            }),
            i
          )
        }
        return (
          (0, t.ZT)(n, e),
          (n.prototype.load = function (t, e) {
            return void 0 === e && (e = {}), this._resolveLoadStart(t, e), this
          }),
          (n.load = function (t, e) {
            return void 0 === e && (e = {}), new n().load(t, e)
          }),
          (n.standalone = function (t, e) {
            return n.load({ writeKey: t }, e).then(function (t) {
              return t[0]
            })
          }),
          n
        )
      })(qt),
      Vt = u(584)
    function Yt() {
      var e, n
      return (0, t.mG)(this, void 0, Promise, function () {
        var r, i, o
        return (0, t.Jh)(this, function (t) {
          switch (t.label) {
            case 0:
              return (
                (r = (function () {
                  var t
                  if ((0, Vt.M)()) return (0, Vt.M)()
                  if (window.analytics._writeKey) return window.analytics._writeKey
                  for (
                    var e = /http.*\/analytics\.js\/v1\/([^/]*)(\/platform)?\/analytics.*/,
                      n = void 0,
                      r = 0,
                      i = Array.prototype.slice.call(document.querySelectorAll('script'));
                    r < i.length;
                    r++
                  ) {
                    var o = null !== (t = i[r].getAttribute('src')) && void 0 !== t ? t : ''
                    if ((u = e.exec(o)) && u[1]) {
                      n = u[1]
                      break
                    }
                  }
                  if (!n && document.currentScript) {
                    var u
                    ;(o = document.currentScript.src), (u = e.exec(o)) && u[1] && (n = u[1])
                  }
                  return n
                })()),
                (i =
                  null !== (n = null === (e = window.analytics) || void 0 === e ? void 0 : e._loadOptions) &&
                  void 0 !== n
                    ? n
                    : {}),
                r
                  ? ((o = window), [4, Ht.standalone(r, i)])
                  : (console.error(
                      'Failed to load Write Key. Make sure to use the latest version of the Segment snippet, which can be found in your source settings.',
                    ),
                    [2])
              )
            case 1:
              return (o.analytics = t.sent()), [2]
          }
        })
      })
    }
    var Qt = u(449)
    var $t = (0, e.Vl)()
    ;(0, e.UH)($t),
      (u.p = $t ? $t + '/analytics-next/bundles/' : 'https://cdn.segment.com/analytics-next/bundles/'),
      (0, n.X)('web')
    var Xt = !1,
      te = function (e) {
        new Qt.B().increment(
          'analytics_js.invoke.error',
          (0, t.ev)((0, t.ev)([], e, !0), ['wk:'.concat((0, Vt.M)())], !1),
        )
      }
    function ee(e) {
      return (0, t.mG)(this, void 0, void 0, function () {
        var n
        return (0, t.Jh)(this, function (r) {
          switch (r.label) {
            case 0:
              return r.trys.push([0, 2, , 3]), [4, e()]
            case 1:
              return [2, r.sent()]
            case 2:
              return (
                (n = r.sent()),
                (i = n),
                console.error('[analytics.js]', 'Failed to load Analytics.js', i),
                te(
                  (0, t.ev)(
                    ['type:initialization'],
                    i instanceof Error
                      ? ['message:'.concat(null == i ? void 0 : i.message), 'name:'.concat(null == i ? void 0 : i.name)]
                      : [],
                    !0,
                  ),
                ),
                [3, 3]
              )
            case 3:
              return [2]
          }
          var i
        })
      })
    }
    if (
      (document.addEventListener('securitypolicyviolation', function (n) {
        !Xt &&
          (function (t) {
            return 'report' !== t.disposition && t.blockedURI.includes('cdn.segment')
          })(n) &&
          ((Xt = !0),
          te(['type:csp']),
          (function () {
            return (0, t.mG)(this, void 0, Promise, function () {
              var n
              return (0, t.Jh)(this, function (t) {
                switch (t.label) {
                  case 0:
                    return (
                      console.warn(
                        'Your CSP policy is missing permissions required in order to run Analytics.js 2.0',
                        'https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/upgrade-to-ajs2/#using-a-strict-content-security-policy-on-the-page',
                      ),
                      console.warn('Reverting to Analytics.js 1.0'),
                      (n = (0, e.YM)()),
                      [4, (0, st.v)(n)]
                    )
                  case 1:
                    return t.sent(), [2]
                }
              })
            })
          })().catch(console.error))
      }),
      (function () {
        var t = { Firefox: 46, Edge: 13 },
          e = !!window.MSInputMethodContext && !!document.documentMode,
          n = navigator.userAgent.split(' '),
          r = n[n.length - 1].split('/'),
          i = r[0],
          o = r[1]
        return e || (void 0 !== t[i] && t[i] >= parseInt(o))
      })())
    ) {
      var ne = document.createElement('script')
      ne.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/7.7.0/polyfill.min.js'),
        'loading' === document.readyState
          ? document.addEventListener('DOMContentLoaded', function () {
              return document.body.appendChild(ne)
            })
          : document.body.appendChild(ne),
        (ne.onload = function () {
          ee(Yt)
        })
    } else ee(Yt)
  })(),
    (window.AnalyticsNext = s)
})()
//# sourceMappingURL=standalone.js.map
