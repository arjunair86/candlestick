import React from 'react';
import './App.css';


import CandleStick from "./CandleStick";

function App() {
  const width = 720;
  const height = 360;
  const size = {
    width: width,
    height: height
  }

  return (
    <div>
      <CandleStick size={size}/>
    </div>
  )
  
}

export default App;
