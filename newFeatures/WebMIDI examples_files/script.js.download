// Setup highlight.js
hljs.initHighlightingOnLoad();

// Globals to access them later.
let midiIn = [];
let midiOut = [];
let notesOn = new Map(); 

connect();

// Start up WebMidi.
function connect() {
  navigator.requestMIDIAccess()
  .then(
    (midi) => midiReady(midi),
    (err) => console.log('Something went wrong', err));
}

function midiReady(midi) {
  // Also react to device changes.
  midi.addEventListener('statechange', (event) => initDevices(event.target));
  initDevices(midi);
}

function initDevices(midi) {
  // Reset.
  midiIn = [];
  midiOut = [];
  
  // MIDI devices that send you data.
  const inputs = midi.inputs.values();
  for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
    midiIn.push(input.value);
  }
  
  // MIDI devices that you send data to.
  const outputs = midi.outputs.values();
  for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
    midiOut.push(output.value);
  }
  
  displayDevices();
  startListening();
}

function displayDevices() {
  selectIn.innerHTML = midiIn.map(device => `<option>${device.name}</option>`).join('');
  selectOut.innerHTML = midiOut.map(device => `<option>${device.name}</option>`).join('');
}

function startListening() {
  outputIn.innerHTML = '';
  
  // Start listening to MIDI messages.
  for (const input of midiIn) {
    input.addEventListener('midimessage', midiMessageReceived);;
  }
}

function midiMessageReceived(event) {
  // MIDI commands we care about. See
  // http://webaudio.github.io/web-midi-api/#a-simple-monophonic-sine-wave-midi-synthesizer.
  const NOTE_ON = 9;
  const NOTE_OFF = 8;

  const cmd = event.data[0] >> 4;
  const pitch = event.data[1];
  const velocity = (event.data.length > 2) ? event.data[2] : 1;
  
  // You can use the timestamp to figure out the duration of each note.
  const timestamp = Date.now();
  
  // Note that not all MIDI controllers send a separate NOTE_OFF command for every NOTE_ON.
  if (cmd === NOTE_OFF || (cmd === NOTE_ON && velocity === 0)) {
    outputIn.innerHTML += `🎧 from ${event.srcElement.name} note off: pitch:<b>${pitch}</b>, velocity: <b>${velocity}</b> <br/>`;
  
    // Complete the note!
    const note = notesOn.get(pitch);
    if (note) {
      outputIn.innerHTML += `🎵 pitch:<b>${pitch}</b>, duration:<b>${timestamp - note}</b> ms. <br>`;
      notesOn.delete(pitch);
    }
  } else if (cmd === NOTE_ON) {
    outputIn.innerHTML += `🎧 from ${event.srcElement.name} note off: pitch:<b>${pitch}</b>, velocity: <b>${velocity}</b> <br/>`;
    
    // One note can only be on at once.
    notesOn.set(pitch, timestamp);
  }
  
  // Scroll to the bottom of this div.
  outputIn.scrollTop = outputIn.scrollHeight;
}

function sendMidiMessage(pitch, velocity, duration) {
  const NOTE_ON = 0x90;
  const NOTE_OFF = 0x80;
  
  const device = midiOut[selectOut.selectedIndex];
  const msgOn = [NOTE_ON, pitch, velocity];
  const msgOff = [NOTE_ON, pitch, velocity];
  
  // First send the note on;
  device.send(msgOn); 
    
  // Then send the note off. You can send this separately if you want 
  // (i.e. when the button is released)
  device.send(msgOff, Date.now() + duration); 
}
  
function copy(event) {
  const str = event.target.nextElementSibling.textContent;
  
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  
  event.target.textContent = 'Done!';
  event.target.classList.add('active');
  setTimeout(() => {
    event.target.textContent = 'Copy';
    event.target.classList.remove('active');
  }, 1000);
}  