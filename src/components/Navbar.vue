<template>
  <nav class="navbar is-dark is-fixed-top">
    <div class="navbar-brand">
      <a class="navbar-item" href="#" @click="openSidebar"><img src="./../assets/home.png" class="fa-mr"><span class="is-hidden-mobile">{{ title }}</span></a>
      <div class="navbar-item is-hidden-desktop sync-mobile"><sync /></div>
    </div>
    <div id="navbar-menu" class="navbar-menu">
      <div class="navbar-start">
        <router-link class="navbar-item" :to="{name: 'rooms'}" title="Pièces"><i class="fa fa-home fa-fw fa-mr" /><span class="is-navbar-label">Pièces</span></router-link>
        <router-link class="navbar-item" :to="{name: 'scenarios'}" title="Scénarios"><i class="fa fa-book fa-fw fa-mr" /><span class="is-navbar-label">Scénarios</span></router-link>
        <div v-if="tagsList.length" class="navbar-item has-dropdown" :class="{'is-active': hasDropdownTagsDisplayed}" @click="hasDropdownTagsDisplayed = !hasDropdownTagsDisplayed">
          <router-link class="navbar-link is-arrowless" :to="{name: 'tags'}" event=""><i class="fa fa-tags fa-fw fa-mr" /><span class="is-navbar-label">Catégories</span></router-link>
          <div class="navbar-dropdown">
            <router-link v-for="tag in tagsList" :key="tag" :to="{name: 'tag', params: {tag}}" class="navbar-item">{{ tag }}</router-link>
          </div>
        </div>
      </div>
      <div class="navbar-end is-flex-center">
        <notifications-counter class-name="navbar-item" :is-link="true" />
        <query />
        <div class="navbar-item sync-tablet"><sync /></div>
      </div>
    </div>
  </nav>
</template>

<script>
import Sync from '@/components/Sync'
import Query from '@/components/Query'
import NotificationsCounter from '@/components/NotificationsCounter'
import { RoomsMixin } from '@/mixins/Rooms'
import { createNamespacedHelpers } from 'vuex'
const { mapMutations } = createNamespacedHelpers('app')
const custom = window.custom

export default {
  name: 'Navbar',
  components: {
    Sync,
    Query,
    NotificationsCounter,
  },
  mixins: [RoomsMixin],
  data () {
    return {
      title: custom.title,
      hasDropdownTagsDisplayed: false,
    }
  },
  mounted () {
    document.body.classList.add('has-navbar-fixed-top')
  },
  methods: {
    openSidebar (e) {
      e.preventDefault()
      this.setSidebarStatus(true)
    },
    ...mapMutations(['setSidebarStatus']),
  },
}
</script>
