const state = {
  login: null,
  isAuthenticated: false,
  hasEventsListenerOpen: false,
  hasNetwork: false,
  information: {},
}

const getters = {
}

const mutations = {

  // store user login and authentication status
  setUser (state, payload) {
    state.login = payload.login
    state.isAuthenticated = payload.isAuthenticated
  },

  // store websocket status
  setEventsListenerStatus (state, payload) {
    state.hasEventsListenerOpen = payload
  },

  // store connectivity status
  setNetworkStatus (state, payload) {
    state.hasNetwork = payload
  },

  // store informations to be displayed as toast
  setInformation (state, payload) {
    state.information = payload
  },
}

const actions = {
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
