if (location.protocol === 'http:') {
  location.replace(
    `https:${location.href.substring(location.protocol.length)}`
  );
}

const SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'.toLowerCase();
const WRITE_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'.toLowerCase();
const READ_UUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'.toLowerCase();

const { Fragment, StrictMode, useState } = React;

const encoder = new TextEncoder();

let bt;
let btRead;
let btWrite;
let device;
let server;

async function connectBluetooth(setConn) {
  try {
    device = await navigator.bluetooth.requestDevice({
      filters: [{
        services: [SERVICE_UUID]
      }]
    });

    server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    bt = service;
    btRead = await service.getCharacteristic(READ_UUID);
    btWrite = await service.getCharacteristic(WRITE_UUID);
    setConn(true);
  } catch (e) {
    if (e.message === 'Bluetooth adapter not available.') {
      return alert('Este dispositivo no tiene Bluetooth! Inténtalo en otro dispositivo');
    }
    
    if (e.message === 'User cancelled the requestDevice() chooser.') return;

    alert (e);
  }
}

function encode(value) {
    let buffer = new ArrayBuffer(value.length * 2); // 2 bytes per char
    let view = new Uint16Array(buffer);
    for (let i = 0, length = value.length; i < length; i++) {
        view[i] = value.charCodeAt(i);
    }
    return buffer;
}

async function writeBluetooth(code) {
  try {
    if (!device.gatt.connected) {
      await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      bt = service;
    }
    
  (await bt.getCharacteristic(WRITE_UUID)).writeValueWithoutResponse(encode(code));
  } catch (e) {
    // Avoids showing errors on offline mode
    if (e.message === 'Cannot read properties of undefined (reading \'gatt\')') return;
    alert(e);
  }
}

function onDeviceToggle({ id, room, state, setState }) {
  setState(!state);
  writeBluetooth(`${id}${room}${state ? 'f' : 't'}`);
}

async function disconnect(setConnected) {
  await device?.gatt.disconnect();
  setConnected(false);
}

const deviceMap = {
  true: {
    l: 'Apagar',
    d: 'Cerrar'
  },
  false: {
    l: 'Encender',
    d: 'Abrir'
  }
}

const DeviceButton = ({ room, id, children }) => {
  const [state, setState] = useState(false);
  return (
    <Fragment>
      <h3>{children}</h3>
      <button onClick={() => onDeviceToggle({ id, room, state, setState })}>{`${deviceMap[state][id]} ${children}`}</button>
    </Fragment>
  )
}

const RoomButtons = ({ room }) => {
  const [state, setState] = useState();
  return (
    <Fragment>
      <DeviceButton {...{room}} id='l'>Lámpara</DeviceButton>
      {
        room === '2' ?
          <DeviceButton {...{room}} id='d'>Puerta</DeviceButton>
        : null
      }
    </Fragment>
  )
}

const SelectRoomButton = ({ id, room, setRoom }) => (
  <button disabled={room === id} onClick={() => setRoom(id)}>{id}</button>
)

const Rooms = ({ room, setRoom, setConnected }) => (
  <Fragment>
    <h2>{`Habitación ${room}`}</h2>
    <SelectRoomButton {...{room, setRoom}} id='1' />
    <SelectRoomButton {...{room, setRoom}} id='2' />
    <div />
    <RoomButtons {...{room}}></RoomButtons>
    <br />
    <br />
    <button onClick={() => disconnect(setConnected)}>Desconectar</button>
    
  </Fragment>
)

const App = () => {
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState('1');
  return (
    <Fragment>
      <h1>Casa</h1>
      { connected ?
        <Rooms {...{room, setRoom, setConnected}} />
        :
        <>
          <button onClick={() => connectBluetooth(setConnected)}>Conectar</button>
          <br />
          <br />
          <button onClick={() => setConnected(true)}>Modo Offline (no usa Bluetooth)</button>
          <br />
          <br />
          <p align='center'>
            Aviso: al Bluetooth de Chrome no le cae muy bien las placas del bitbloq, así que se suele desconectar después de
            cada acción. Si se desconecta, se intentará reconectar, pero puede hacer que algunas acciones próximas no se
            registren correctamente.
          </p>
        </>
      }
    </Fragment>
  )
}

const root = ReactDOM.createRoot(document.querySelector('#root'));
root.render(<StrictMode><App /></StrictMode>);
