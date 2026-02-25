import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Transformer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { DrawingLine, TapeStrip, Tool, TapeColor, Point } from '../types';
import { TAPE_COLORS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CanvasProps {
  tool: Tool;
  lines: DrawingLine[];
  setLines: (lines: DrawingLine[]) => void;
  tapes: TapeStrip[];
  setTapes: (tapes: TapeStrip[]) => void;
  tapeColor: TapeColor;
  background: string;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  penColor: string;
  highlighterColor: string;
  penWidth: number;
  highlighterWidth: number;
  eraserWidth: number;
  tapeHeight: number;
  backgroundImage?: string;
  orientation: 'portrait' | 'landscape';
}

export const Canvas: React.FC<CanvasProps> = ({
  tool,
  lines,
  setLines,
  tapes,
  setTapes,
  tapeColor,
  background,
  selectedIds,
  setSelectedIds,
  penColor,
  highlighterColor,
  penWidth,
  highlighterWidth,
  eraserWidth,
  tapeHeight,
  backgroundImage,
  orientation
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lassoPoints, setLassoPoints] = useState<number[]>([]);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [bgImage] = useImage(backgroundImage || '');

  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (tool === 'select') {
      const clickedOnEmpty = e.target === stage;
      if (clickedOnEmpty) {
        setSelectedIds([]);
      }
      return;
    }

    setIsDrawing(true);

    if (tool === 'lasso') {
      setLassoPoints([pos.x, pos.y]);
      return;
    }

    if (tool === 'pen' || tool === 'eraser' || tool === 'highlighter') {
      if (tool === 'eraser') {
        const clickedLine = lines.find(line => {
          for (let i = 0; i < line.points.length; i += 2) {
            const dx = line.points[i] - pos.x;
            const dy = line.points[i+1] - pos.y;
            if (Math.sqrt(dx*dx + dy*dy) < eraserWidth / 2) return true;
          }
          return false;
        });
        if (clickedLine) {
          setLines(lines.filter(l => l.id !== clickedLine.id));
          return;
        }
      }

      setLines([...lines, { 
        id: Math.random().toString(36).substr(2, 9),
        tool, 
        points: [pos.x, pos.y], 
        color: tool === 'highlighter' ? highlighterColor : (tool === 'eraser' ? '#ffffff' : penColor),
        width: tool === 'highlighter' ? highlighterWidth : (tool === 'eraser' ? eraserWidth : penWidth),
        opacity: tool === 'highlighter' ? 0.4 : 1
      }]);
    } else if (tool === 'tape') {
      const newTape: TapeStrip = {
        id: Math.random().toString(36).substr(2, 9),
        x: pos.x,
        y: pos.y,
        width: 0,
        height: tapeHeight,
        rotation: 0,
        color: tapeColor,
        opacity: 0.9,
        isRevealed: false,
        isLocked: false,
      };
      setTapes([...tapes, newTape]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (tool === 'lasso') {
      setLassoPoints([...lassoPoints, pos.x, pos.y]);
      return;
    }

    if (tool === 'pen' || tool === 'eraser' || tool === 'highlighter') {
      const lastLine = lines[lines.length - 1];
      if (!lastLine) return;
      lastLine.points = lastLine.points.concat([pos.x, pos.y]);
      setLines(lines.slice(0, -1).concat([lastLine]));
    } else if (tool === 'tape') {
      const lastTape = tapes[tapes.length - 1];
      if (!lastTape) return;
      lastTape.width = pos.x - lastTape.x;
      setTapes(tapes.slice(0, -1).concat([lastTape]));
    }
  };

  const handleMouseUp = () => {
    if (tool === 'lasso' && lassoPoints.length > 4) {
      // Point-in-polygon check for lasso selection
      const isPointInPolygon = (x: number, y: number, polygon: number[]) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 2; i < polygon.length; i += 2) {
          const xi = polygon[i], yi = polygon[i + 1];
          const xj = polygon[j], yj = polygon[j + 1];
          const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
          j = i;
        }
        return inside;
      };

      const newlySelectedIds = tapes
        .filter(t => isPointInPolygon(t.x + t.width / 2, t.y + t.height / 2, lassoPoints))
        .map(t => t.id);

      if (newlySelectedIds.length > 0) {
        setSelectedIds(newlySelectedIds);
      } else {
        setSelectedIds([]);
      }
    }
    setIsDrawing(false);
    setLassoPoints([]);
  };

  const handleTapeClick = (id: string) => {
    if (tool === 'select') {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
      return;
    }
    
    setTapes(tapes.map(t => {
      if (t.id === id) {
        return { ...t, isRevealed: !t.isRevealed };
      }
      return t;
    }));
  };

  useEffect(() => {
    if (transformerRef.current && selectedIds.length > 0) {
      const nodes = selectedIds.map(id => stageRef.current.findOne('#' + id)).filter(Boolean);
      if (nodes.length > 0) {
        transformerRef.current.nodes(nodes);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedIds]);

  return (
    <div className={cn("w-full h-screen overflow-hidden cursor-crosshair", background)}>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        ref={stageRef}
        className="canvas-container"
      >
        <Layer>
          {/* Background Image Layer */}
          {bgImage && (
            <KonvaImage
              image={bgImage}
              x={orientation === 'landscape' ? window.innerWidth / 2 : 0}
              y={orientation === 'landscape' ? 0 : 0}
              width={orientation === 'landscape' ? window.innerHeight : window.innerWidth}
              height={orientation === 'landscape' ? window.innerWidth : window.innerWidth * (bgImage.height / bgImage.width)}
              rotation={orientation === 'landscape' ? 90 : 0}
              opacity={0.8}
              listening={false}
            />
          )}

          {/* Drawing Layer */}
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.width}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              opacity={line.opacity ?? 1}
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}

          {/* Lasso Path */}
          {lassoPoints.length > 0 && (
            <Line
              points={lassoPoints}
              stroke="#71717a"
              strokeWidth={1}
              dash={[5, 5]}
              closed={true}
              fill="rgba(113, 113, 122, 0.1)"
            />
          )}

          {/* Tape Layer */}
          {tapes.map((tape) => (
            <React.Fragment key={tape.id}>
              <Rect
                id={tape.id}
                x={tape.x}
                y={tape.y}
                width={tape.width}
                height={tape.height}
                fill={TAPE_COLORS[tape.color]}
                opacity={tape.isRevealed ? 0.2 : tape.opacity}
                rotation={tape.rotation}
                cornerRadius={2}
                shadowBlur={tape.isRevealed ? 0 : 4}
                shadowColor="rgba(0,0,0,0.15)"
                shadowOffset={{ x: 1, y: 1 }}
                onClick={() => handleTapeClick(tape.id)}
                onTap={() => handleTapeClick(tape.id)}
                draggable={tool === 'select' && !tape.isLocked}
                onDragEnd={(e) => {
                  setTapes(tapes.map(t => t.id === tape.id ? { ...t, x: e.target.x(), y: e.target.y() } : t));
                }}
                onTransformEnd={(e) => {
                  const node = e.target;
                  setTapes(tapes.map(t => t.id === tape.id ? {
                    ...t,
                    x: node.x(),
                    y: node.y(),
                    width: node.width() * node.scaleX(),
                    height: node.height() * node.scaleY(),
                    rotation: node.rotation(),
                  } : t));
                  node.scaleX(1);
                  node.scaleY(1);
                }}
              />
              {/* Texture/Tape details */}
              {!tape.isRevealed && (
                <Line
                  points={[tape.x, tape.y + 5, tape.x + tape.width, tape.y + 5]}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={1}
                  rotation={tape.rotation}
                  listening={false}
                />
              )}
              {/* Visual "Peel" effect indicator if revealed */}
              {tape.isRevealed && (
                <Rect
                   x={tape.x}
                   y={tape.y}
                   width={Math.min(15, Math.abs(tape.width))}
                   height={tape.height}
                   fill="rgba(0,0,0,0.05)"
                   rotation={tape.rotation}
                   listening={false}
                />
              )}
            </React.Fragment>
          ))}

          {tool === 'select' && selectedIds.length > 0 && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};
