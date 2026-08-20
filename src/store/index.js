import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from "vuex-persistedstate"
Vue.use(Vuex)

const FIXED_TOKEN = process.env.VUE_APP_GITHUB_TOKEN || '';

const store = new Vuex.Store({
  state: {
    token: FIXED_TOKEN,
    userInfo: {},
    uploadInfo: {
      iscant: false,
      repos: "",
      content: "",
      delimit: "",
      branch:""
    },
    sign:"wishimg"
  },
  mutations: {
    setToken(state, v) {
      state.token = FIXED_TOKEN;
    },
    setUserInfo(state, v) {
      state.userInfo = v;
    },
    setUploadInfo(state, v) {
      state.uploadInfo = v;
    },
    setSign(state,v){
      state.sign = v;
    }
  },
  actions: {
  },
  modules: {
  },
  plugins: [createPersistedState({
    paths: ['userInfo', 'uploadInfo', 'sign']
  })]
});

store.replaceState({
  ...store.state,
  token: FIXED_TOKEN
});

export default store;
