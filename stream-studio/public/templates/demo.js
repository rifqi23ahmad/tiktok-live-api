// Stream Studio demo mode: monkey-patch WebSocket so templates can be
// previewed without a real TikTok LIVE stream. Activated by `?demo=1`.
(function () {
  try {
    const qs = new URLSearchParams(location.search)
    if (qs.get('demo') !== '1') return
  } catch (_) {
    return
  }

  const NAMES = ['sultan_raja', 'si_paling_gift', 'viewer_kepo', 'bakul_ramen', 'raja_emoji', 'night_owl', 'geng_motor', 'cinta_sejati']
  const GIFTS = [
    { name: 'Rose', diamonds: 1 },
    { name: 'Heart', diamonds: 5 },
    { name: 'Football', diamonds: 99 },
    { name: 'Galaxy', diamonds: 1000 },
    { name: 'Lion', diamonds: 2999 },
    { name: 'Universe', diamonds: 5000 }
  ]
  const CHATS = [
    'keren banget 🔥🔥😍',
    'wkwkwk ngakak',
    'gas mantap!',
    'halo semua ❤️',
    'cek kodam',
    'cek nasib',
    '!hujan',
    '!sapa semangat terus kakak! 🚀'
  ]

  const rnd = (n) => Math.floor(Math.random() * n)
  const pick = (arr) => arr[rnd(arr.length)]

  function FakeWebSocket() {
    const self = this
    self.readyState = 0 // CONNECTING
    self.url = 'demo://stream-studio'

    let i = 0
    self._timer = setTimeout(function open() {
      self.readyState = 1 // OPEN
      if (typeof self.onopen === 'function') self.onopen({})

      self._emitTimer = setInterval(function emit() {
        if (self.readyState !== 1) return
        const user = { uniqueId: pick(NAMES) }
        const roll = rnd(10)
        let evt
        if (roll < 4) {
          const g = pick(GIFTS)
          evt = { event: 'gift', data: { user, giftName: g.name, diamondCount: g.diamonds, repeatCount: 1 } }
        } else if (roll < 6) {
          evt = { event: 'chat', data: { user, comment: pick(CHATS) } }
        } else if (roll < 8) {
          evt = { event: 'like', data: { user, likeCount: 1 + rnd(20), totalLikes: (self._likes = (self._likes || 0) + 1 + rnd(20)) } }
        } else if (roll < 9) {
          evt = { event: 'member', data: { user } }
        } else {
          evt = { event: 'roomUserSeq', data: { viewerCount: 180 + rnd(400) } }
        }
        i++
        if (typeof self.onmessage === 'function') self.onmessage({ data: JSON.stringify(evt) })
      }, 1500)
    }, 500)
  }

  FakeWebSocket.prototype.close = function () {
    this.readyState = 3 // CLOSED
    if (this._timer) clearTimeout(this._timer)
    if (this._emitTimer) clearInterval(this._emitTimer)
    if (typeof this.onclose === 'function') this.onclose({})
  }
  FakeWebSocket.prototype.send = function () {}

  window.WebSocket = FakeWebSocket
})()
