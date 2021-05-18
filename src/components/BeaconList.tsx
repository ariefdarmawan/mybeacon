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

interface beaconItem {
  ID: string,
  Name: string
}

const BeaconList = (props: {
  scanStatus:string,
  style:Object
}) => {
  let bles = new Map()
  const [list, setList] = useState([])
  const [isScanning, setScanning] = useState(false)

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
    bles.clear()
    BleManager.scan([],3,true).then(() => {
      setScanning(true)
    }).catch(e => {
      console.log(e)
    })
  }

  const handleDiscoverPeripheral = (ble: any) => {
    if (ble) {
      let addBle = true
      let filtereds = myBeaconData.registered.filter((x:any) => x.id==ble.id)
      if (filtereds.length>0) {
        ble.name = filtereds[0].name
      } else {
        if (myBeaconData.useRegistered===true) {
          addBle = false
        } else {
          ble.name = 'No Name'
        }
      }

      if (addBle) {
        console.log('new ble is discovered: '+JSON.stringify(ble))
        ble.distance = Math.abs(ble.rssi) / myBeaconData.rssiMeter
        bles.set(ble.id, ble)
        if (bles.size==0) {
          setList([])
        } else {
          const bleList:any = Array.from(bles.values())
          setList(bleList)
        }
      }
    }
  }

  const handleStopScan = () => {
    console.log("stop scanning peripherals")
    setScanning(false)
    if (props.scanStatus=='Scanning') {
      setTimeout(scanPeripheral, 500)
    }
  }

  const handleDisconnectedPeripheral = (data: any) => {
    if (data && data.peripheral) {
      const ble = bles.get(data.peripheral)
      if (ble) {
        bles.delete(ble.id)
        const bleList:any = Array.from(bles.values())
        setList(bleList)
      }
    }
  }

  useEffect(() => {
    BleManager.start({showAlert: false})

    bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral)
    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan )
    bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral )
    //bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic )

    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
          if (result) {
            console.log("Permission is OK")
          } else {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
              if (result) {
                console.log("User accept")
              } else {
                console.log("User refuse")
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
      bleManagerEmitter.removeListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral )
      //bleManagerEmitter.removeListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic )
    })
  }, [props.scanStatus])

  return (
    <View style={props.style}>
      <Text>Peripherals found : { list.length }</Text>
      <FlatList 
        keyExtractor={(item:any) => item.id}
        data={list} 
        renderItem={({item}) => renderPer(item)} style={{marginTop:15}}></FlatList>
    </View>
  )
}

export default BeaconList