const { request: httpRequest, Agent: HttpAgent } = require('http')
const { request: httpsRequest, Agent: HttpsAgent} = require('https')
const { URL } = require('url')
const { asktug } = require('./config')

const httpAgent = new HttpAgent({
  keepAlive: true
})

const httpsAgent = new HttpsAgent({
  keepAlive: true
})

/**
 *
 * @param url
 * @param options
 * @param cb
 * @return {ClientRequest}
 */
const request = (url, options, cb) => {
  if (/^https:\/\//.test(url)) {
    return httpsRequest(url, { ...options, agent: httpsAgent }, cb)
  } else {
    return httpRequest(url, { ...options, agent: httpAgent }, cb)
  }
}

/**
 *
 * @param ctx {import('koa').Context}
 * @param externalId {string}
 * @return Promise<void>
 */
function proxyAsktug (ctx, externalId) {
  const { req, res } = ctx

  return new Promise((resolve, reject) => {
    const headers = {
      'Accept': 'application/json',
      'x-forwarded-for': ctx.request.get('x-forwarded-for'),
    }
    let url = asktug.url + req.url
    if (externalId) {
      headers['Api-Key'] = asktug.token
      headers['Api-User-External-Id'] = externalId
    }

    const clientRequest = request(url, {
      method: req.method,
      timeout: 1500,
      headers,
    }, asktugRes => {
      res.statusCode = asktugRes.statusCode
      res.statusMessage = asktugRes.statusMessage

      asktugRes.setEncoding('utf8');
      if (asktugRes.headers['content-type']) {
        res.setHeader('content-type', asktugRes.headers['content-type'])
      }
      if (asktugRes.headers['content-length']) {
        res.setHeader('content-length', asktugRes.headers['content-length'])
      }
      asktugRes
        .on('data', (chunk) => {
          res.write(chunk)
        })
        .on('error', err => {
          res.statusCode = err.status ?? 500
          res.write(err.message)
          reject(err)
        })
        .on('end', () => {
          res.end(() => {
            resolve()
          })
        });
    })

    clientRequest.on('error', (e) => {
      console.error(e)
      reject(e)
    })

    req
      .pipe(clientRequest)
      .on('finish', () => {
        clientRequest.end()
      })
  })

}

module.exports = proxyAsktug
