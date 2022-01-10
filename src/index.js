const Koa = require('koa')
const logger = require('koa-logger')
const { getUsername } = require('./accounts-client')
const proxyAsktug = require('./asktug-proxy')
const app = new Koa()

app.use(logger())

// ENV
// ACCOUNTS_COOKIE_NAME
app.use(async ctx => {
  try {
    const username = await getUsername(ctx)
    await proxyAsktug(ctx, username)
  } catch (e) {
    console.error(e)
    ctx.status = e?.response?.status ?? e?.status ?? 500
  }
})

app.listen(3000)
