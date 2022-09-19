const Koa = require('koa')
const logger = require('koa-logger')
const { getExternalId } = require('./accounts-client')
const proxyAsktug = require('./asktug-proxy')
const { asktug } = require('./config')
const Axios = require("axios");

const app = new Koa()

app.use(async (ctx, next) => {
  if (ctx.path === '/healthy/live') {
    ctx.response.statusCode = 200
    ctx.response.body = 'OK'
  } else {
    await next()
  }
})

app.use(logger())

if (Boolean(process.env.ENABLE_CORS)) {
  const cors = require('@koa/cors');
  app.use(cors({ credentials: true }));
  console.log('[cors] enabled')
}

// forbid to visit admin api
app.use(async (ctx, next) => {
  if (ctx.request.path.startsWith('/admin/')) {
    ctx.response.statusCode = 403
    ctx.response.body = 'FORBIDDEN'
  } else {
    await next()
  }
})

app.use(async (ctx, next) => {
  if (ctx.request.path === '/healthy/ready') {
    try {
      await Axios.head(asktug.url, {headers: {accept: 'application/json'}})
      ctx.response.statusCode = 200
      ctx.response.body = 'OK'
    } catch (e) {
      ctx.response.statusCode = 502
      ctx.response.body = `failed to HEAD ${asktug.url}, ${String(e)}`
    }
  } else {
    await next()
  }
})

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
    const externalId = await getExternalId(ctx)
    await proxyAsktug(ctx, externalId)
  } catch (e) {
    console.error('proxy failed', e)
    ctx.status = e?.response?.status ?? e?.status ?? 500
  }
})


app.listen(process.env.PORT || 3000)
