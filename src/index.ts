import sequencer, { loadMusicXMLFile, MIDIEvent, Song } from 'heartbeat-sequencer';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import {
  parseMusicXML,
  setGraphicalNoteColor,
  getGraphicalNotesPerBar,
  mapMIDINoteIdToGraphicalNote,
  MusicSystemShim,
  getVersion,
} from 'webdaw-modules';
import { loadJSON, addAssetPack, loadMIDIFile } from './heartbeat-utils';

const ppq = 960;
const midiFile = 'mozk545a_musescore';
const instrumentName = 'TP00-PianoStereo';

const btnPlay = document.getElementById('play') as HTMLButtonElement;
const btnStop = document.getElementById('stop') as HTMLButtonElement;
const scoreDiv = document.getElementById('score');
if (scoreDiv === null) {
  throw new Error('element not found');
}

const osmd = new OpenSheetMusicDisplay(scoreDiv, {
  backend: 'svg',
  autoResize: false,
});
console.log(`OSMD : ${osmd.Version}`);
console.log(`WebDAW : ${getVersion()}`);

const resize = async (song: Song, repeats: number[][]) => {
  osmd.render();

  // the score has been rendered so we can get all references to the SVGElement of the notes
  const graphicalNotesPerBar = await getGraphicalNotesPerBar(osmd, ppq);

  // map the MIDI notes (MIDINote) to the graphical notes (SVGElement)
  const { midiToGraphical, graphicalToMidi } = mapMIDINoteIdToGraphicalNote(
    graphicalNotesPerBar,
    repeats,
    song.notes
  );
  // console.log(midiToGraphical);
  console.timeEnd('connect_heartbeat');

  // setup listener for highlighting the active notes and for the scroll position
  let scrollPos = 0;
  let currentY = 0;
  let reference = -1;
  song.addEventListener('event', 'type = NOTE_ON', (event: MIDIEvent) => {
    const noteId = event.midiNote.id;
    if (midiToGraphical[noteId]) {
      const { element, musicSystem } = midiToGraphical[noteId];
      setGraphicalNoteColor(element, 'red');

      const tmp = ((musicSystem as unknown) as MusicSystemShim).graphicalMeasures[0][0].stave.y;
      if (currentY !== tmp) {
        currentY = tmp;
        const bbox = element.getBoundingClientRect();
        if (reference === -1) {
          reference = bbox.y;
        } else {
          scrollPos = bbox.y + window.pageYOffset - reference;
          window.scroll({
            top: scrollPos,
            behavior: 'smooth',
          });
        }
      }
    }
  });

  // setup listener to switch of the highlighting if notes are not active anymore
  song.addEventListener('event', 'type = NOTE_OFF', (event: MIDIEvent) => {
    const noteId = event.midiNote.id;
    if (midiToGraphical[noteId]) {
      const { element } = midiToGraphical[noteId];
      setGraphicalNoteColor(element, 'black');
    }
  });

  // setup listeners for every graphical note
  Object.values(midiToGraphical).forEach(({ element }) => {
    element.addEventListener('mousedown', e => {
      const midiNote = graphicalToMidi[element.id];
      const noteOn = midiNote.noteOn as MIDIEvent;
      const noteOff = midiNote.noteOff as MIDIEvent;
      if (e.ctrlKey) {
        song.setPlayhead('ticks', noteOn.ticks);
      } else {
        setGraphicalNoteColor(element, 'red');
        console.log(element);
        sequencer.processEvent(
          [
            sequencer.createMidiEvent(0, 144, noteOn.noteNumber, noteOn.velocity),
            sequencer.createMidiEvent(noteOff.ticks - noteOn.ticks, 128, noteOff.noteNumber, 0),
          ],
          instrumentName
        );
      }
      e.stopImmediatePropagation();
    });
    element.addEventListener('mouseup', e => {
      sequencer.stopProcessEvents();
      setGraphicalNoteColor(element, 'black');
    });
  });
};

const init = async () => {
  await sequencer.ready();

  // load MIDI file and setup song
  await loadMIDIFile(`../assets/${midiFile}.mid`);
  const song = sequencer.createSong(sequencer.getMidiFile(midiFile));

  // load instrument and setup all tracks
  let url = `../assets/${instrumentName}.mp3.json`;
  if (sequencer.browser === 'firefox') {
    url = `../assets/${instrumentName}.ogg.json`;
  }
  const json = await loadJSON(url);
  await addAssetPack(json);
  song.tracks.forEach(track => {
    track.setInstrument(instrumentName);
  });

  // load and render the score
  const xmlDoc = await loadMusicXMLFile('../assets/mozk545a_musescore.musicxml');
  await osmd.load(xmlDoc);

  // connect the OSMD score to heartbeat
  console.time('connect_heartbeat');
  const events = song.events.filter(event => event.command === 144);

  // parse the MusicXML file to find where the song repeats
  const parsed = parseMusicXML(xmlDoc, ppq);
  if (parsed === null) {
    return;
  }
  const { repeats, initialTempo } = parsed;
  await resize(song, repeats);

  // setup controls
  song.addEventListener('stop', () => {
    btnPlay.innerHTML = 'play';
  });
  song.addEventListener('play', () => {
    btnPlay.innerHTML = 'pause';
  });
  song.addEventListener('end', () => {
    btnPlay.innerHTML = 'play';
  });

  btnPlay.addEventListener('click', () => {
    if (song.playing) {
      song.pause();
    } else {
      song.play();
    }
  });
  btnStop.addEventListener('click', () => {
    song.stop();
  });

  // everything has been setup so we can enable the buttons
  btnPlay.disabled = false;
  btnStop.disabled = false;

  window.addEventListener('resize', async () => {
    await resize(song, repeats);
  });
};

init();
