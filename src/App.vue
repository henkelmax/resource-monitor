<template>
  <div id="app">
    <ResourceMonitor></ResourceMonitor>
  </div>
</template>

<script>
import ResourceMonitor from "@/components/ResourceMonitor";

export default {
  name: "App",
  components: {
    ResourceMonitor,
  },
};
</script>

<style>
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  -webkit-app-region: drag;
  user-select: none;
}
</style>
