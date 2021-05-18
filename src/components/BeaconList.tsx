import React, { useEffect, useState } from 'react'
import { 
  FlatList,
  Text,
  TouchableHighlight,
  View,
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid
 } from 'react-native'

import myBeaconData from '../data/myBeaconData.json'
import BleManager from 'react-native-ble-manager'
const BleManagerModule = NativeModules.BleManager

const bleManagerEmitter = new NativeEventEmitter(BleManagerModule)

const BeaconList = (props: {
  scanStatus:string,
  style:Object
}) => {
  let devices = new Map()
  const [list, setList] = useState([])
  const [closest, setClosest] = useState('')

  const renderPer = (item:any) => {
    return (
      <>
        <TouchableHighlight style={{marginTop:5}}>
          <Text>{item.id} | {item.name} | rssi: {item.rssi} | {item.distance.toPrecision(2)}m</Text>
        </TouchableHighlight>
      </>
    )
  }

  const scanPeripheral = () => {
    console.log("scanning peripherals")
    BleManager.enableBluetooth()
    devices.clear()
    //setClosest('')
    BleManager.scan([], myBeaconData.scanDuration, true).then(() => {
      //setScanning(true)
    }).catch(e => {
      console.log(e)
    })
  }

  const deviceToList = () => {
    const devList:any = Array.from(devices.values())
    setList(devList)
  }

  const handleDiscoverPeripheral = (device: any) => {
    if (device) {
      let addBle = true
      const filtereds = myBeaconData.registered.filter((x:any) => x.id==device.id)
      if (filtereds.length>0) {
        device.name = filtereds[0].name
      } else {
        if (myBeaconData.useRegistered===true) {
          addBle = false
        } else {
          device.name = 'No Name'
        }
      }

      if (addBle) {
        console.log('new ble is discovered: '+JSON.stringify(device))
        device.distance = Math.abs(device.rssi) / myBeaconData.rssiMeter
        devices.set(device.id, device)
        deviceToList()
      }
    }
  }

  const handleStopScan = () => {
    console.log("stop scanning peripherals")

    if (devices.size>0) {
      const sortedDevices = Array.from(devices.values()).sort((a,b:any)=>a.rssi > b.rssi ? -1 : a.rssi==b.rssi ? 0 : 1)
      setClosest('closest device: ' + sortedDevices[0].name + ' distance '+sortedDevices[0].distance.toPrecision(2)+'m')
    }
    
    if (props.scanStatus=='Scanning') {
      setTimeout(scanPeripheral, 500)
    }
  }

  /*
  const handleDisconnectedPeripheral = (data: any) => {
    if (data && data.peripheral) {
      const device = devices.get(data.peripheral)
      if (device) {
        devices.delete(device.id)
        deviceToList()
      }
    }
  }
  */

  useEffect(() => {
    BleManager.start({showAlert: false})

    bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral)
    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan )
    //bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral )
    //bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic )

    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
          if (result) {
            console.log("Permission is OK")
          } else {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
              if (result) {
                console.log("User accept permission request")
              } else {
                console.log("User refuse permission request")
              }
            })
          }
      })
    }  

    if (props.scanStatus=='Scanning') {
      scanPeripheral()
    }
    
    return (() => {
      console.log('Unmount BLE')
      bleManagerEmitter.removeListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral)
      bleManagerEmitter.removeListener('BleManagerStopScan', handleStopScan )
      //bleManagerEmitter.removeListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral )
      //bleManagerEmitter.removeListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic )
    })
  }, [props.scanStatus])

  return (
    <View style={props.style}>
      <Text>Peripherals found : { list.length }</Text>
      <Text>{ closest }</Text>
      <FlatList 
        keyExtractor={(item:any) => item.id}
        data={list} 
        renderItem={({item}) => renderPer(item)} style={{marginTop:15}}></FlatList>
    </View>
  )
}

export default BeaconList