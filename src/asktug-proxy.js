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
 * @param username {string}
 * @return Promise<void>
 */
function proxyAsktug (ctx, username) {
  const { req, res } = ctx

  return new Promise((resolve, reject) => {
    const authHeaders = username ? {
        'Api-Key': asktug.token,
        'Api-Username': username,
      } : {}

    const clientRequest = request(asktug.url + req.url, {
      method: req.method,
      timeout: 1500,
      headers: {
        ...authHeaders,
        'Accept': 'application/json'
      },
    }, asktugRes => {
      res.statusCode = asktugRes.statusCode
      res.statusMessage = asktugRes.statusMessage
      if (asktugRes.headers['content-type']) {
        res.setHeader('content-type', asktugRes.headers['content-type'])
      }
      if (asktugRes.headers['content-length']) {
        res.setHeader('content-length', asktugRes.headers['content-length'])
      }
      asktugRes
        .on('data', data => {
          res.write(data)
        })
        .on('end', () => {
          res.end()
          resolve()
        })
        .on('error', err => {
          res.statusCode = err.status ?? 500
          res.write(err.message)
          reject(err)
        })
    })

    req
      .pipe(clientRequest)
      .on('end', () => {
        clientRequest.end()
      })
  })

}

module.exports = proxyAsktug
