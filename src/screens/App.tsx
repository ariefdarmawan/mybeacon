import React, { useState } from 'react';
import { View } from 'react-native';
import BeaconList from '../components/BeaconList';
import Control from '../components/Control';

const App = () => {
  const [scanStatus, setScanStatus] = useState('None');

  const handleScan = (status:string) => {
    console.log('scan-stat:'+status);
    setScanStatus(status);
  }

  return (
    <View style={{ backgroundColor: '#FFFFFF'}}>
      <Control scanHandler={handleScan}></Control>
      <BeaconList scanStatus={scanStatus} style={{marginLeft:5, marginRight:5, marginTop:5}}></BeaconList>
    </View>
  )
}

export default App