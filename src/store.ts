import { BoundingBoxMeasure } from 'webdaw-modules';
import create from 'zustand/vanilla';
import { midiFileName, midiFile, mxmlFile } from './files';

export type State = {
  offset: { x: number; y: number };
  scrollPos: { x: number; y: number };
  selection: number[];
  songState: 'play' | 'pause' | 'stop';
  midiFileName: string;
  midiFile: string;
  mxmlFile: string;
  ppq: number;
  playhead: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  currentPosition: number;
  currentBar: number;
  currentBarStartX: number;
  currentBarStartMillis: number;
  currentBarDurationMillis: number;
  pixelsPerMillisecond: number;
  selectedMeasures: number[];
  boundingBoxes: BoundingBoxMeasure[];
  width: number;
  loaded: boolean;
};

export type Reducers = {
  toggleSongState: () => void;
};

export type Store = State & Reducers;

export const store = create<Store>((set, get) => ({
  offset: { x: 0, y: 0 },
  scrollPos: { x: 0, y: 0 },
  selection: [],
  songState: 'stop',
  midiFileName,
  midiFile,
  mxmlFile,
  ppq: 960,
  playhead: { x: 0, y: 0, width: 10, height: 0 },
  currentBar: 1,
  currentPosition: 0,
  currentBarStartX: 0,
  currentBarStartMillis: 0,
  currentBarDurationMillis: 0,
  pixelsPerMillisecond: 0,
  selectedMeasures: [],
  boundingBoxes: [],
  width: window.innerWidth,
  loaded: false,
  toggleSongState: () => {
    set(state => {
      if (state.songState === 'play') {
        return { songState: 'pause' };
        // } else if (state.songState === 'pause') {
        //   return { songState: 'stop' };
      }
      return { songState: 'play' };
    });
  },
}));
