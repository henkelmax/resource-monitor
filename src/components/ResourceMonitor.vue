<template>
  <div id="main">
    <div id="cpuCores" style="grid-area: cores">
      <Graph
        v-for="(core, id) in coreUsages"
        :key="id"
        :data="core"
        :text="`CPU${id} ${core.slice(-1).pop().toFixed(0)}%`"
        :max="100"
        :style="{ 'grid-column': `col ${id} / span 1` }"
      />
    </div>
    <Graph
      :data="cpuUsage"
      :text="`CPU ${cpuUsage.slice(-1).pop().toFixed(0)}%`"
      :max="100"
      style="grid-area: cpuUsage"
    />
    <Graph
      :data="ramUsage"
      :text="`RAM ${((ramUsed / ramTotal) * 100).toFixed(0)}% (${formatBinary(
        ramUsed
      )}/${formatBinary(ramTotal)})`"
      :max="100"
      style="grid-area: ramUsage"
    />
    <Graph
      :data="cpuTemp"
      :text="`CPU temp ${cpuTemp.slice(-1).pop().toFixed(0)}°C`"
      :max="100"
      style="grid-area: cpuTemp"
    />
    <Graph
      :data="cpuFanSpeed"
      :text="`CPU fan speed ${cpuFanSpeed.slice(-1).pop().toFixed(0)}%`"
      :max="100"
      style="grid-area: cpuFanSpeed"
    />

    <Graph
      :data="gpuUsage"
      :text="`GPU ${gpuUsage.slice(-1).pop().toFixed(0)}%`"
      :max="100"
      style="grid-area: gpuUsage"
    />
    <Graph
      :data="gpuMemory"
      :text="`GPU memory ${((gpuMemoryUsed / gpuMemoryTotal) * 100).toFixed(
        0
      )}% (${formatBinary(gpuMemoryUsed)}/${formatBinary(gpuMemoryTotal)})`"
      :max="100"
      style="grid-area: gpuMemory"
    />
    <Graph
      :data="gpuTemp"
      :text="`GPU temp ${gpuTemp.slice(-1).pop().toFixed(0)}°C`"
      :max="100"
      style="grid-area: gpuTemp"
    />
    <Graph
      :data="gpuFanSpeed"
      :text="`GPU fan speed ${gpuFanSpeed.slice(-1).pop().toFixed(0)}%`"
      :max="100"
      style="grid-area: gpuFanSpeed"
    />

    <div class="cell no-drag" style="text-align: center; grid-area: time">
      <div>
        <p style="font-size: 60px; margin: 30px 0px 0px 0px">
          {{ $moment().format("HH:mm:ss") }}
        </p>
        <p style="font-size: 50px; margin: 20px 0px 0px 0px">
          {{ $moment().format("DD.MM.YYYY (W)") }}
        </p>
      </div>
    </div>

    <div
      class="cell no-scrollbar no-drag"
      style="grid-area: test; -webkit-app-region: no-drag"
    >
      <div style="overflow: scroll">
        <div
          spellcheck="false"
          contenteditable
          @input="handleInput"
          ref="text"
          style="text-align: left; height: 100%; padding: 20px; outline: none"
        ></div>
      </div>
    </div>

    <div class="cell no-drag" style="grid-area: prcessesCPU">
      <div>
        <table style="padding: 15px; width: 100%; table-layout: auto">
          <tbody>
            <tr align="left">
              <th>CPU</th>
              <th>PID</th>
              <th>Name</th>
            </tr>
            <tr v-for="(process, id) in cpuProcesses" :key="id">
              <td>{{ process.cpu.toFixed(1) }}%</td>
              <td>{{ process.pid }}</td>
              <td>{{ shorten(process.name) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="cell no-drag" style="grid-area: prcessesMemory">
      <div>
        <table style="padding: 15px; width: 100%; table-layout: auto">
          <tr align="left">
            <th>Memory</th>
            <th>PID</th>
            <th>Name</th>
          </tr>
          <tbody>
            <tr v-for="(process, id) in memoryProcesses" :key="id">
              <td>{{ format(process.memory) }}</td>
              <td>{{ process.pid }}</td>
              <td>{{ shorten(process.name) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Graph
      class="no-drag"
      :data="networkSent"
      :text="`Network Sent ${format(networkSent.slice(-1).pop())}/s`"
      style="grid-area: networkSent"
    />
    <Graph
      class="no-drag"
      :data="networkReceived"
      :text="`Network Received ${format(networkReceived.slice(-1).pop())}/s`"
      style="grid-area: networkReceived"
    />
  </div>
</template>

<script>
import Graph from "./Graph";
import prettyBytes from "pretty-bytes";
const Store = window.require("electron-store");
const { ipcRenderer } = window.require("electron");

const store = new Store();

export default {
  name: "ResourceMonitor",
  components: { Graph },
  data() {
    return {
      coreUsages: [[0]],
      ramTotal: 1,
      ramUsed: 0,
      gpuMemoryTotal: 1,
      gpuMemoryUsed: 0,
      gpuFanSpeedRPM: 0,
      cpuUsage: this.createArray(),
      ramUsage: this.createArray(),
      cpuTemp: this.createArray(),
      cpuFanSpeed: this.createArray(),
      gpuUsage: this.createArray(),
      gpuMemory: this.createArray(),
      gpuTemp: this.createArray(),
      gpuFanSpeed: this.createArray(),
      networkSent: this.createArray(),
      networkReceived: this.createArray(),
      cpuProcesses: [],
      memoryProcesses: [],
    };
  },
  mounted() {
    this.$refs.text.innerText = store.get("notes", "");
  },
  created() {
    ipcRenderer.on("data", (event, data) => {
      if (this.coreUsages.length != data.coreUsages.length) {
        this.coreUsages = Array.from(
          { length: data.coreUsages.length },
          this.createArray
        );
      }
      for (let i = 0; i < data.coreUsages.length; i++) {
        this.push(this.coreUsages[i], data.coreUsages[i]);
      }

      this.push(this.cpuUsage, data.cpuUsage);
      this.push(
        this.ramUsage,
        this.calculatePercentage(data.ramUsed, data.ramTotal)
      );
      this.ramUsed = data.ramUsed;
      this.ramTotal = data.ramTotal;
      this.push(this.cpuTemp, data.cpuTemp);
      this.push(this.cpuFanSpeed, -1);
      this.push(this.gpuUsage, data.gpuUsage);
      this.push(
        this.gpuMemory,
        this.calculatePercentage(data.gpuMemoryUsed, data.gpuMemoryTotal)
      );
      this.gpuMemoryUsed = data.gpuMemoryUsed;
      this.gpuMemoryTotal = data.gpuMemoryTotal;
      this.push(this.gpuTemp, data.gpuTemp);
      this.push(this.gpuFanSpeed, data.gpuFanSpeed);
      this.push(this.networkSent, data.networkTX);
      this.push(this.networkReceived, data.networkRX);

      this.cpuProcesses = data.cpuProcesses;
      this.memoryProcesses = data.memoryProcesses;

      this.$forceUpdate();
    });
  },
  methods: {
    push(array, value) {
      array.push(value);
      while (array.length > 60) {
        array.shift();
      }
    },
    createArray() {
      return Array.from({ length: 60 }, () => 0);
    },
    calculatePercentage(current, total) {
      return Math.round((current / total) * 100);
    },
    handleInput(e) {
      store.set("notes", e.target.innerText);
    },
    formatBinary(amount) {
      return prettyBytes(amount, { binary: true });
    },
    format(amount) {
      return prettyBytes(amount);
    },
    shorten(text, length = 24) {
      if (text.length > length) {
        return `${text.substring(0, length - 3)}...`;
      } else {
        return text;
      }
    },
  },
};
</script>

<style>
html {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;

  background: black;
  color: #00ff00;
  font-size: 16px;
  font-family: Lucida Console, Lucida Sans Typewriter, monaco,
    Bitstream Vera Sans Mono, monospace;
}
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

#main {
  display: grid;
  border: 1px solid #00ff00;
  width: calc(100% - 2px);
  height: calc(100% - 2px);
  margin: 0;
  padding: 0;
  grid-gap: 0px;
  grid-template-areas:
    "cores cores cores cores cores cores cores cores cores cores cores cores"
    "cpuUsage cpuUsage cpuUsage ramUsage ramUsage ramUsage cpuTemp cpuTemp cpuTemp cpuFanSpeed cpuFanSpeed cpuFanSpeed"
    "gpuUsage gpuUsage gpuUsage gpuMemory gpuMemory gpuMemory gpuTemp gpuTemp gpuTemp gpuFanSpeed gpuFanSpeed gpuFanSpeed"
    "time time time prcessesCPU prcessesCPU prcessesCPU prcessesMemory prcessesMemory prcessesMemory networkSent networkSent networkSent"
    "test test test prcessesCPU prcessesCPU prcessesCPU prcessesMemory prcessesMemory prcessesMemory networkReceived networkReceived networkReceived";
}

#cpuCores {
  display: grid;
  grid-gap: 0px;
}

.cell {
  position: relative;
  border: 1px solid #00ff00;
  width: calc(100% - 2px);
  height: calc(100% - 2px);
  margin: 0;
  padding: 0;
}

.cell > div {
  position: absolute;
  width: 100%;
  height: 100%;
}

.no-scrollbar > ::-webkit-scrollbar {
  display: none;
}

.no-drag {
  -webkit-app-region: no-drag;
}
</style>
