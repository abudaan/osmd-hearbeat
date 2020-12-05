import { BoundingBox } from 'webdaw-modules';
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
  currentPosition: number;
  currentBarSong: number;
  currentBarScore: number;
  currentBarStartX: number;
  currentBarStartMillis: number;
  currentBarDurationMillis: number;
  pixelsPerMillisecond: number;
  selectedMeasures: number[];
  width: number;
  loaded: boolean;
  repeats: number[][];
  initialTempo: number;
  boundingBoxesMeasures: BoundingBox[];
  songPositionMillis: number;
  playheadPositionPixels: number;
  playhead: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  hasRepeated: { [index: number]: boolean };
};

export type Reducers = {
  toggleSongState: () => void;
  setSongPosition: (durationBarMillis: number) => void;
  setPlayheadScore: () => void;
  updateBar: (args: {
    currentBarScore: number;
    currentBarDurationMillis: number;
    currentBarStartMillis: number;
  }) => void;
};

export type Store = State & Reducers;

export const store = create<Store>((set, get) => ({
  playheadPositionPixels: 0,
  offset: { x: 0, y: 0 },
  scrollPos: { x: 0, y: 0 },
  selection: [],
  songState: 'stop',
  midiFileName,
  midiFile,
  mxmlFile,
  ppq: 960,
  currentBarSong: 1,
  currentBarScore: 1,
  currentPosition: 0,
  currentBarStartX: 0,
  currentBarStartMillis: 0,
  currentBarDurationMillis: 0,
  pixelsPerMillisecond: 0,
  selectedMeasures: [],
  width: window.innerWidth,
  repeats: [],
  initialTempo: 90,
  loaded: false,
  hasRepeated: {},
  playhead: {
    x: 0,
    y: 0,
    width: 25,
    height: 0,
  },
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
  updateBar: args => {
    const { currentBarDurationMillis, currentBarScore } = args;
    set(state => {
      const { width } = state.boundingBoxesMeasures[currentBarScore - 1];
      return {
        pixelsPerMillisecond: width / currentBarDurationMillis,
      };
    });
  },
  setSongPosition: durationBarMillis => {
    set(state => {
      const {
        offset: { x: offsetX },
        currentBarStartX,
        currentBarStartMillis,
        pixelsPerMillisecond,
      } = state;
      const relPos = durationBarMillis - currentBarStartMillis;
      return {
        playhead: {
          ...state.playhead,
          x: offsetX + currentBarStartX + relPos * pixelsPerMillisecond,
        },
      };
    });
  },
  setPlayheadScore: () => {},
  boundingBoxesMeasures: [],
  songPositionMillis: 0,
}));
