// landmarks.js
// Hand landmark indices and connections

const WRIST = 0;
const THUMB_CMC = 1;
const THUMB_MCP = 2;
const THUMB_IP = 3;
const THUMB_TIP = 4;
const INDEX_FINGER_MCP = 5;
const INDEX_FINGER_PIP = 6;
const INDEX_FINGER_DIP = 7;
const INDEX_FINGER_TIP = 8;
const MIDDLE_FINGER_MCP = 9;
const MIDDLE_FINGER_PIP = 10;
const MIDDLE_FINGER_DIP = 11;
const MIDDLE_FINGER_TIP = 12;
const RING_FINGER_MCP = 13;
const RING_FINGER_PIP = 14;
const RING_FINGER_DIP = 15;
const RING_FINGER_TIP = 16;
const PINKY_MCP = 17;
const PINKY_PIP = 18;
const PINKY_DIP = 19;
const PINKY_TIP = 20;

const HAND_CONNECTIONS = [
  { start: WRIST, end: THUMB_CMC },
  { start: THUMB_CMC, end: THUMB_MCP },
  { start: THUMB_MCP, end: THUMB_IP },
  { start: THUMB_IP, end: THUMB_TIP },
  { start: WRIST, end: INDEX_FINGER_MCP },
  { start: INDEX_FINGER_MCP, end: INDEX_FINGER_PIP },
  { start: INDEX_FINGER_PIP, end: INDEX_FINGER_DIP },
  { start: INDEX_FINGER_DIP, end: INDEX_FINGER_TIP },
  { start: WRIST, end: MIDDLE_FINGER_MCP },
  { start: MIDDLE_FINGER_MCP, end: MIDDLE_FINGER_PIP },
  { start: MIDDLE_FINGER_PIP, end: MIDDLE_FINGER_DIP },
  { start: MIDDLE_FINGER_DIP, end: MIDDLE_FINGER_TIP },
  { start: WRIST, end: RING_FINGER_MCP },
  { start: RING_FINGER_MCP, end: RING_FINGER_PIP },
  { start: RING_FINGER_PIP, end: RING_FINGER_DIP },
  { start: RING_FINGER_DIP, end: RING_FINGER_TIP },
  { start: WRIST, end: PINKY_MCP },
  { start: PINKY_MCP, end: PINKY_PIP },
  { start: PINKY_PIP, end: PINKY_DIP },
  { start: PINKY_DIP, end: PINKY_TIP },
  { start: INDEX_FINGER_MCP, end: MIDDLE_FINGER_MCP },
  { start: MIDDLE_FINGER_MCP, end: RING_FINGER_MCP },
  { start: RING_FINGER_MCP, end: PINKY_MCP }
];
