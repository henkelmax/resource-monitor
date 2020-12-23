<template>
  <div id="wrapper">
    <div id="graph">
      <svg xmlns="http://www.w3.org/2000/svg">
        <template v-if="data && data.length > 1">
          <line
            v-for="(n, index) in data.length - 1"
            :key="index"
            :x1="`${100 * (index / maxX)}%`"
            :x2="`${100 * ((index + 1) / maxX)}%`"
            :y1="`${100 - 100 * (data[index] / maxY)}%`"
            :y2="`${100 - 100 * (data[index + 1] / maxY)}%`"
            stroke="#00FF00"
            stroke-width="2"
          />
        </template>
        <line v-else x1="0%" x2="100%" y1="0%" y2="0%" stroke="#00FF00" />
      </svg>
    </div>
    <div id="text">
      <p>{{ text }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "Graph",
  props: ["data", "max", "text"],
  computed: {
    maxY() {
      return Math.max(1, this.max || Math.max(...this.data));
    },
    maxX() {
      return this.data.length - 1;
    },
  },
};
</script>

<style scoped>
svg {
  display: block;
  border: 1px solid #00ff00;
  width: calc(100% - 2px);
  height: calc(100% - 2px);
}

#wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

#graph {
  width: 100%;
  height: 100%;
  position: absolute;
}

#text {
  width: 100%;
  height: 100%;
  z-index: 10;
  position: absolute;
}

#text > p {
  color: #00ff00;
  font-size: 20px;
  margin: 5px 5px 5px 5px;
  font-family: Lucida Console, Lucida Sans Typewriter, monaco,
    Bitstream Vera Sans Mono, monospace;
}
</style>
