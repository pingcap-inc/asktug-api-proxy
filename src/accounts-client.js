const Axios = require('axios')
const { accounts } = require('./config')

const accountsClient = Axios.create({
  baseURL: accounts.url
})

/**
 *
 * @param ctx {import('koa').Context}
 * @returns {Promise<string>}
 */
module.exports.getUsername = async (ctx) => {
  try {
    const { data } = await accountsClient.get('/api/me', {
      headers: {
        cookie: ctx.get('cookie')
      }
    })
    return data.data.username
  } catch (e) {
    return undefined
  }
}
