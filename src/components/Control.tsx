import React, { useState } from 'react'
import { Button, View, Text } from 'react-native'

interface ControlProps {
  scanHandler: (status: string) => void
}


const Control : React.FC<ControlProps> = (props) => {
  const [scanStatus, setScanStatus] = useState('None');
  
  const onPress = () => {
    const newStatus = scanStatus=='None' ? 'Scanning' : 'None';
    setScanStatus(newStatus);
    props.scanHandler(newStatus);
  }

  return (
    <View>
      <Button title={scanStatus=='None' ? 'Start Scan' : 'Stop Scan'} onPress={onPress}></Button>
      <Text style={{marginLeft:5, marginTop:5}}>Current State : { scanStatus }</Text>      
    </View>
  )
}

export default Control