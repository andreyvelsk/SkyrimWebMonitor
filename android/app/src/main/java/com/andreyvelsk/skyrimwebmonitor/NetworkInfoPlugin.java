package com.andreyvelsk.skyrimwebmonitor;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Custom Capacitor plugin that exposes the device's local IPv4 addresses
 * to the web layer. Used for WebSocket endpoint auto-discovery.
 */
@CapacitorPlugin(name = "NetworkInfo")
public class NetworkInfoPlugin extends Plugin {

    @PluginMethod
    public void getLocalIps(PluginCall call) {
        List<String> ips = new ArrayList<>();

        try {
            for (NetworkInterface networkInterface : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!networkInterface.isUp() || networkInterface.isLoopback()) {
                    continue;
                }

                for (InetAddress address : Collections.list(networkInterface.getInetAddresses())) {
                    if (address instanceof Inet4Address && !address.isLoopbackAddress()) {
                        ips.add(address.getHostAddress());
                    }
                }
            }
        } catch (Exception exception) {
            call.reject("Failed to enumerate network interfaces", exception);
            return;
        }

        JSObject result = new JSObject();
        result.put("ips", new JSArray(ips));
        call.resolve(result);
    }
}