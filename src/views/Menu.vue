<template>
  <div class="container">
    <!-- FIXME: add variablen -->
    <div class="text-center">{{ `lvl: ${player.lvl}` }}</div>
    <div class="mt-1">
      <!-- FIXME: add variablen -->
      <ProgressBar :progress="player.exp" :max-value="player.lvl * 50"></ProgressBar>
    </div>
    <div class="mt-3"><Button @click="play()">Play</Button></div>
    <div class="mt-3">
      <Modal title="lineup">
        <div class="container">
          <div>available figures</div>
          <div>current lineup</div>
        </div>
        <template #button>
          <div class="cellButton"><Button>Lineup</Button></div>
        </template>
      </Modal>
    </div>
    <div class="mt-3">
      <div class="row" v-for="row of 5">
        <div class="cell" v-for="cell of 5">
          <!-- FIXME: add variablen -->
          <Modal title="test">
            <div class="container">
              <div>max amount: Pi</div>
              <div>
                <Button>
                  <div>increase</div>
                  <div>costs: Pi</div>
                </Button>
              </div>
              <div>new units per round: Pi</div>
              <div>
                <Button>
                  <div>increase</div>
                  <div>costs: Pi</div>
                </Button>
              </div>
            </div>
            <template #button>
              <div class="cellButton"><Button>piece name</Button></div>
            </template>
          </Modal>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { Button, ProgressBar, Modal } from 'custom-mbd-components';
import { player } from '../Player';
import router from '../router';

function play() {
  router.push({ name: 'Board' });
}
console.log(player.value);
</script>
<style lang="scss" scoped>
$size: 20vw;
.row {
  display: grid;
  grid-template-columns: repeat(8, auto);
  .cell {
    border: 1px solid #000;
    display: flex;
    justify-content: center;
    align-items: center;
    width: $size;
    height: $size;
    cursor: pointer;
    background-color: gray;
    font-size: 5rem;
    @media (max-width: 1000px) {
      font-size: 2.5rem;
    }
  }
}
.row:nth-child(odd) .cell:nth-child(even) {
  background: #854000;
}
.row:nth-child(even) .cell:nth-child(odd) {
  background: #854000;
}
.cellButton {
  display: flex;
}
</style>
