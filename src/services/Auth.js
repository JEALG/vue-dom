import Vue from 'vue'
import store from '@/store'

// set authentication (API key, token, ...) and notify application user is authenticated
function setAuthentication (login, authentication) {
  const roles = []
  if (authentication.access_token) {
    try {
      const payload = JSON.parse(atob(authentication.access_token.split('.')[1]))
      roles.push(...payload.scope.split(' '))
    } catch (error) {
      console.warn('JWT parsing failed', error)
    }
  }
  new Vue().$Provider.setAuthentication(authentication)
  store.commit('app/setUser', { isAuthenticated: true, login, roles })
}

export default {

  // send a request to the login URL and save the returned api key
  async login (login, password, remember) {
    if (!login || !password) {
      return false
    }
    const authentication = await new Vue().$Provider.authenticate(login, password)
    if (!authentication) {
      return false
    }
    setAuthentication(login, authentication)
    if (remember) {
      localStorage.setItem('user', JSON.stringify({ login, authentication }))
    }
    return true
  },

  // clear local storage and store
  logout () {
    store.dispatch('clear')
    localStorage.clear()
    sessionStorage.clear()
  },

  // return stored user (login and api key)
  restoreUser () {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (user) {
        setAuthentication(user.login, user.authentication)
      }
    } catch (e) {
      console.error('Error during restore user', e)
    }
  },
}
