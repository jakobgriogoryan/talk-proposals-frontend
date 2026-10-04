// Compile Vue SFCs for client rendering while using Vue's custom test renderer.
// No browser globals or DOM emulation are installed by this environment.
export default {
  name: 'vue-renderer',
  viteEnvironment: 'client',
  setup() {
    return { teardown() {} }
  },
}
