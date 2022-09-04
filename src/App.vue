<template>
  <div id="container">
    <router-view />
  </div>
</template>
<script setup lang="ts">
import Board from './components/Board.vue';
import router from './router/index';
</script>

<style lang="scss">
html:root {
  --bs-body-font-family: arial;
}
.modal-content {
  margin-top: 10vh;
  background-color: white !important;
  padding-bottom: 2vh;
}
#container {
  padding: 8px;
}
</style>
