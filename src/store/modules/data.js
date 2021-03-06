import Vue from 'vue'
import { normalize, schema } from 'normalizr'

const vue = new Vue()

// prepare data normalization schemas
const stateSchema = new schema.Entity('states')
const actionSchema = new schema.Entity('actions')
const equipmentSchema = new schema.Entity('equipments', {
  states: [stateSchema],
  actions: [actionSchema],
})
const roomSchema = new schema.Entity('rooms', {
  equipments: [equipmentSchema],
})
const roomListSchema = new schema.Array(roomSchema)
const scenarioSchema = new schema.Entity('scenarios')
const scenarioListSchema = new schema.Array(scenarioSchema)

const getDefaultState = () => {
  return {
    rooms: {},
    roomsSummary: {},
    roomsRaw: [],
    equipments: {},
    states: {},
    actions: {},
    roomsList: [],
    summaryList: [],
    statesStatistics: {},
    tagsList: [],
    scenarios: {},
    notifications: [],
  }
}

const state = getDefaultState()

const getters = {

  // return room by id or object with empty name and equipments
  getRoomById: (state) => (id) => {
    return (state.rooms[id]) || {
      name: '',
      equipments: [],
    }
  },

  // return room summary by id or empty object
  getRoomSummaryById: (state) => (id) => {
    return (state.roomsSummary[id]) || {}
  },

  // return equipment by id or object with empty action and state
  getEquipmentById: (state) => (id) => {
    return (state.equipments[id]) || {
      states: [],
      actions: [],
    }
  },

  // return equipments ids by tag
  getEquipmentsIdByTag: (state) => (tag) => {
    return Object.values(state.equipments).filter((equipment) => equipment.tags.includes(tag)).map((equipment) => equipment.id)
  },

  // return all states for requested equipment id
  getStatesByEquipmentId: (state, getters) => (id) => {
    const states = []
    const statesId = state.equipments[id].states
    // reduce state to minimal informations
    statesId.forEach((stateId) => {
      const c = getters.getStateById(stateId)
      states.push({
        id: c.id,
        type: c.type,
        genericType: c.genericType,
        isVisible: c.isVisible,
      })
    })
    return states
  },

  // return all actions for requested equipment id
  getActionsByEquipmentId: (state, getters) => (id) => {
    const actions = []
    const actionsId = state.equipments[id].actions
    // reduce action to minimal informations
    actionsId.forEach((actionId) => {
      const c = getters.getActionById(actionId)
      actions.push({
        id: c.id,
        type: c.type,
        stateFeedbackId: c.stateFeedbackId,
        genericType: c.genericType,
        isVisible: c.isVisible,
      })
    })
    return actions
  },

  // return states by id or empty array
  getStatesByIds: (state, getters) => (statesId) => {
    const states = []
    statesId.forEach((stateId) => {
      const c = getters.getStateById(stateId)
      states.push({
        id: c.id,
        type: c.type,
        genericType: c.genericType,
        isVisible: c.isVisible,
      })
    })
    return states
  },

  // return actions by id or empty array
  getActionsByIds: (state, getters) => (actionsId) => {
    const actions = []
    actionsId.forEach((actionId) => {
      const c = getters.getActionById(actionId)
      actions.push({
        id: c.id,
        type: c.type,
        stateFeedbackId: c.stateFeedbackId,
        genericType: c.genericType,
        isVisible: c.isVisible,
      })
    })
    return actions
  },

  // return state by id or empty object
  getStateById: (state) => (id) => {
    return (state.states[id]) || { }
  },
  // return action by id or empty object
  getActionById: (state) => (id) => {
    return (state.actions[id]) || { }
  },

  // return state statistics by id or null
  getStateStatisticsById: (state) => (id) => {
    return (state.statesStatistics[id]) || null
  },

  // return all scenarios
  getScenarios: (state) => () => {
    return Object.keys(state.scenarios).map((scenarioId) => state.scenarios[scenarioId])
  },

  // return notifications count
  getNotificationsCount: (state) => () => {
    return state.notifications.length
  },
}

const mutations = {

  // store all rooms, equipments, states and actions normalized
  saveRooms (state, payload) {
    state.roomsRaw = payload
    const normalized = normalize(payload, roomListSchema)
    Object.assign(state, normalized.entities)
  },

  // store specific room, equipments, states and actions normalized
  saveRoom (state, payload) {
    const normalized = normalize(payload, roomSchema)
    state.roomsList.push(normalized.result)
    Object.assign(state.rooms, normalized.entities.rooms)
    Object.assign(state.equipments, normalized.entities.equipments)
    Object.assign(state.states, normalized.entities.states)
    Object.assign(state.actions, normalized.entities.actions)
  },

  // store specific room summary
  saveRoomSummary (state, payload) {
    if (payload.id === 'global') {
      payload.id = 0
    }
    const info = {
      key: payload.key,
      value: payload.value,
    }
    let normalized = state.roomsSummary[payload.id]
    if (!normalized) {
      // there was no summary for this room
      normalized = {
        id: payload.id,
        keys: [info],
      }
    } else {
      // search the key in room summary
      const index = normalized.keys.findIndex((info) => info.key === payload.key)
      if (index !== -1) {
        // key found, update it
        normalized.keys.splice(index, 1, info)
      } else {
        // key not found, adding it
        normalized.keys.push(info)
      }
    }
    // normalized[payload.key] = payload.summary
    const arr = []
    arr[payload.id] = normalized
    state.roomsSummary = Object.assign({}, state.roomsSummary, arr)
  },

  // store state statistics
  saveStateStatistics (state, payload) {
    const updated = {}
    updated[payload.id] = payload.statistics
    state.statesStatistics = Object.assign({}, state.statesStatistics, updated)
  },

  // store updated states/actions (batch)
  updateStates (state, payload) {
    const statesUpdated = {}
    const actionsUpdated = {}
    const equipmentsUpdated = {}
    payload.forEach(update => {
      const id = update.id
      if (!state.states[id] && !state.actions[id]) {
        return
      }
      if (state.states[id]) {
        statesUpdated[id] = state.states[id]
        statesUpdated[id].currentValue = update.currentValue
        // update equipment date with state collect date if it is newer
        const equipmentId = state.states[id].eqId
        if (Vue.moment(update.collectDate).isAfter(state.equipments[equipmentId].lastCommunication)) {
          equipmentsUpdated[equipmentId] = state.equipments[equipmentId]
          equipmentsUpdated[equipmentId].lastCommunication = Vue.moment(update.collectDate).format()
        }
      }
      if (state.actions[id]) {
        actionsUpdated[id] = state.actions[id]
        actionsUpdated[id].currentValue = update.currentValue
      }
    })
    if (Object.keys(statesUpdated).length > 0) {
      state.states = Object.assign({}, state.states, statesUpdated)
    }
    if (Object.keys(actionsUpdated).length > 0) {
      state.actions = Object.assign({}, state.actions, actionsUpdated)
    }
    if (Object.keys(equipmentsUpdated).length > 0) {
      state.equipments = Object.assign({}, state.equipments, equipmentsUpdated)
    }
  },

  // store tags
  saveTags (state, payload) {
    state.tagsList = payload
  },

  // store scenarios
  saveScenarios (state, payload) {
    const normalized = normalize(payload, scenarioListSchema)
    Object.assign(state, normalized.entities)
  },

  // store updated scenario information
  updateScenario (state, payload) {
    if (!state.scenarios[payload.id]) {
      return
    }
    const updated = {}
    updated[payload.id] = state.scenarios[payload.id]
    updated[payload.id].state = payload.state
    state.scenarios = Object.assign({}, state.scenarios, updated)
  },

  // store all notifications
  saveNotifications (state, payload) {
    state.notifications = payload
  },

  // store new notification
  addNotification (state, payload) {
    state.notifications.push(payload)
    state.notifications.sort((a, b) => Vue.moment(b.date) - Vue.moment(a.date))
  },

  // clear state
  clear (state) {
    Object.assign(state, getDefaultState())
  },
}

const actions = {

  // call API and store rooms list
  async loadRooms ({ commit }) {
    try {
      // get global summary
      vue.$Provider.getSummary().then((summary) => {
        for (const key in summary) {
          if (summary[key] !== null) {
            commit('saveRoomSummary', { id: 'global', key, value: summary[key] })
          }
        }
      }, (error) => {
        commit('app/setInformation', { type: 'is-danger', message: `Erreur lors de la récupération du résumé global<br>${error.message}` }, { root: true })
      })
      // get all rooms
      const rooms = await vue.$Provider.getRooms()
      if (rooms === undefined) {
        // no rooms to save
        return
      }
      commit('saveRooms', rooms)
      // get tags
      let tagsList = []
      rooms.forEach((room) => {
        room.equipments.forEach((equipment) => {
          tagsList = tagsList.concat(equipment.tags)
        })
      })
      commit('saveTags', [...new Set(tagsList)])
      // get rooms summary
      rooms.forEach(async (room) => {
        for (const key in room.summary) {
          const value = await vue.$Provider.getRoomSummary(room.id, key)
          commit('saveRoomSummary', { id: room.id, key, value })
        }
      })
    } catch (error) {
      commit('app/setInformation', { type: 'is-danger', message: `Erreur lors de la récupération des pièces<br>${error.message}` }, { root: true })
    }
  },

  // call API and store state statistics
  async loadStateStatistics ({ commit, state }, id) {
    try {
      const statistics = await vue.$Provider.getStatistics(id)
      if (statistics === undefined) {
        return
      }
      commit('saveStateStatistics', { id, statistics })
    } catch (error) {
      commit('app/setInformation', { type: 'is-danger', message: `Erreur lors de la récupération des statistiques<br>${error.message}` }, { root: true })
    }
  },

  // execute an action by calling API
  async executeAction ({ commit }, action) {
    try {
      await vue.$Provider.executeAction(action.id, action.options)
    } catch (error) {
      console.error(error)
      commit('app/setInformation', { type: 'is-danger', message: `Erreur lors de la requête d'exécution de la commande<br>${error.message}` }, { root: true })
    }
  },

  // call API and store scenarios
  async loadScenarios ({ commit }) {
    try {
      const scenarios = await vue.$Provider.getScenarios()
      if (scenarios === undefined) {
        return
      }
      commit('saveScenarios', scenarios)
    } catch (error) {
      commit('app/setInformation', { type: 'is-danger', message: `Erreur lors de la récupération des scénarios<br>${error.message}` }, { root: true })
    }
  },

  // call API and store notifications
  async loadNotifications ({ commit }) {
    try {
      const notifications = await vue.$Provider.getNotifications()
      if (notifications === undefined) {
        return
      }
      notifications.sort((a, b) => Vue.moment(b.date) - Vue.moment(a.date))
      commit('saveNotifications', notifications)
    } catch (error) {
      commit('app/setInformation', { type: 'is-danger', message: `Erreur lors de la récupération des notifications<br>${error.message}` }, { root: true })
    }
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
