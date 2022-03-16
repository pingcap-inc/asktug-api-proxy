const Koa = require('koa')
const logger = require('koa-logger')
const { getUsername } = require('./accounts-client')
const proxyAsktug = require('./asktug-proxy')

const app = new Koa()

app.use(logger())

if (Boolean(process.env.ENABLE_CORS)) {
  const cors = require('@koa/cors');
  app.use(cors());
}

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (e) {
    console.error(e)
  }
})

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
