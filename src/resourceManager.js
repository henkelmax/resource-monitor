import si from 'systeminformation';
import { exec } from 'child_process';

export default async () => {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const cpuTemperature = await si.cpuTemperature();
    const networkStats = await si.networkStats();
    const networkInterfaceDefault = await si.networkInterfaceDefault();
    const defualtNetworkInterface = networkStats.find(e => e.iface === networkInterfaceDefault);
    const graphics = await getGraphics();

    const processes = await getProcesses();

    return {
        cpuUsage: cpu.currentload,
        coreUsages: cpu.cpus.map(e => e.load),
        ramUsed: mem.used,
        ramTotal: mem.total,
        cpuTemp: cpuTemperature.main,
        networkTX: defualtNetworkInterface.tx_sec,
        networkRX: defualtNetworkInterface.rx_sec,
        ...graphics,
        ...processes
    };
}

function getGraphics() {
    return new Promise((resolve, reject) => {
        exec('nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,memory.total,memory.used,fan.speed --format=csv,noheader,nounits', (error, stdout, stderr) => {
            if (error) {
                resolve({
                    gpuUsage: -1,
                    gpuTemp: -1,
                    gpuMemoryTotal: -1,
                    gpuMemoryUsed: -1,
                    gpuFanSpeed: -1
                });
                return;
            }
            const split = stdout.replace('\n', '').trim().split(', ');
            resolve({
                gpuUsage: Number.parseInt(split[0]),
                gpuTemp: Number.parseInt(split[1]),
                gpuMemoryTotal: Number.parseInt(split[2]) * 1000000,
                gpuMemoryUsed: Number.parseInt(split[3]) * 1000000,
                gpuFanSpeed: Number.parseInt(split[4])
            });
        });
    });
}

async function getProcesses() {
    const processes = (await si.processes()).list
        .filter(element => element.pid !== 0)
        .filter(element => element.name !== 'Memory Compression')
        .map(element => {
            return {
                memory: element.mem_rss * 1000,
                pid: element.pid,
                name: element.name,
                cpu: element.pcpu
            };
        });

    return {
        cpuProcesses: [...processes].sort((e1, e2) => e2.cpu - e1.cpu).slice(0, 16),
        memoryProcesses: [...processes].sort((e1, e2) => e2.memory - e1.memory).slice(0, 16)
    };
}

