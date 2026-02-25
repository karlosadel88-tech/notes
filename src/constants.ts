import { TapeColor } from "./types";

export const TAPE_COLORS: Record<TapeColor, string> = {
  yellow: '#fef08a',
  beige: '#f5f5dc',
  gray: '#d1d5db',
  blue: '#bfdbfe',
  green: '#bbf7d0',
};

export const PAPER_THEMES = {
  white: 'bg-white',
  dark: 'bg-zinc-900',
  paper: 'bg-[#fdfbf7]',
  grid: 'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]',
  dots: 'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:10px_10px]',
};

export const PEN_COLORS = [
  { name: 'Black', value: '#141414' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Purple', value: '#9333ea' },
];

export const HIGHLIGHTER_COLORS = [
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Pink', value: '#fbcfe8' },
];
